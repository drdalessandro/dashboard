// src/data/utils/SyncQueue.ts
// Manages the synchronization queue for offline operations

import { v4 as uuidv4 } from 'uuid';
import { PendingOperation, OperationType, SyncStatus } from '../data/models/base';

// Queue item interface for the synchronization queue
export interface QueueItem {
  id: string;
  operation: PendingOperation;
  attempts: number;
  createdAt: string;
  resourceType: string;
  endpoint?: string;
  priority: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: any;
}

/**
 * SyncQueue manages a persistent, priority-based queue of operations
 * to be performed when the application is online.
 */
export class SyncQueue {
  private queue: Map<string, QueueItem> = new Map();
  private storageKey = 'syncQueue';
  private maxRetries = 5;
  private listeners: Function[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add an operation to the queue
   */
  public add(
    operation: OperationType,
    resourceType: string,
    data: any,
    options: { priority?: number } = {}
  ): string {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const pendingOperation: PendingOperation = {
      id,
      type: operation,
      resourceType,
      data,
      timestamp
    };

    const queueItem: QueueItem = {
      id,
      operation: pendingOperation,
      attempts: 0,
      createdAt: timestamp,
      resourceType,
      priority: options.priority || 5, // Default priority is 5 (mid-level)
      status: 'pending'
    };

    // Add to queue
    this.queue.set(id, queueItem);

    // Save to storage
    this.saveToStorage();
    this.notifyListeners();

    return id;
  }

  /**
   * Remove an item from the queue
   */
  public remove(id: string): boolean {
    const result = this.queue.delete(id);
    if (result) {
      this.saveToStorage();
      this.notifyListeners();
    }
    return result;
  }

  /**
   * Get all queue items
   */
  public getAll(): QueueItem[] {
    return Array.from(this.queue.values());
  }

  /**
   * Get pending items sorted by priority
   */
  public getPending(): QueueItem[] {
    return Array.from(this.queue.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get failed items
   */
  public getFailed(): QueueItem[] {
    return Array.from(this.queue.values())
      .filter(item => item.status === 'failed');
  }

  /**
   * Get item by id
   */
  public getById(id: string): QueueItem | undefined {
    return this.queue.get(id);
  }

  /**
   * Update an item's status
   */
  public updateStatus(id: string, status: QueueItem['status'], error?: any): boolean {
    const item = this.queue.get(id);
    if (item) {
      item.status = status;
      if (error) {
        item.error = error;
      }
      if (status === 'processing') {
        item.attempts += 1;
      }
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Clear all items from the queue
   */
  public clear(): void {
    this.queue.clear();
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Retry a failed item
   */
  public retry(id: string): boolean {
    const item = this.queue.get(id);
    if (item && item.status === 'failed') {
      item.status = 'pending';
      // Reset attempts or keep track of them, depending on your policy
      // item.attempts = 0; // Uncomment to reset attempts
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Retry all failed items
   */
  public retryAllFailed(): number {
    let count = 0;
    // Use Array.from to safely iterate over Map entries
    Array.from(this.queue.entries()).forEach(([id, item]) => {
      if (item.status === 'failed') {
        item.status = 'pending';
        count++;
      }
    });

    if (count > 0) {
      this.saveToStorage();
      this.notifyListeners();
    }

    return count;
  }

  /**
   * Clean up the queue by removing completed items and old failed items
   */
  public cleanup(options: { keepFailedDays?: number } = {}): number {
    const now = new Date();
    const keepFailedDays = options.keepFailedDays || 3;
    const cutoffDate = new Date(now.getTime() - (keepFailedDays * 24 * 60 * 60 * 1000));

    let removedCount = 0;

    // Use Array.from and collect IDs to delete to avoid modifying during iteration
    const idsToDelete: string[] = [];

    Array.from(this.queue.entries()).forEach(([id, item]) => {
      // Mark completed items for removal
      if (item.status === 'completed') {
        idsToDelete.push(id);
        removedCount++;
        return;
      }

      // Mark old failed items for removal
      const itemDate = new Date(item.createdAt);
      if (item.status === 'failed' && itemDate < cutoffDate) {
        idsToDelete.push(id);
        removedCount++;
      }
    });

    // Delete marked items
    idsToDelete.forEach(id => this.queue.delete(id));

    if (removedCount > 0) {
      this.saveToStorage();
      this.notifyListeners();
    }

    return removedCount;
  }

  /**
   * Check if max retries reached for an item
   */
  public hasReachedMaxRetries(id: string): boolean {
    const item = this.queue.get(id);
    return item ? item.attempts >= this.maxRetries : false;
  }

  /**
   * Count items by status
   */
  public countByStatus(): Record<QueueItem['status'], number> {
    const counts: Record<QueueItem['status'], number> = {
      pending: 0,
      processing: 0,
      failed: 0,
      completed: 0
    };

    // Use Array.from to safely iterate over Map values
    Array.from(this.queue.values()).forEach(item => {
      // Use type assertion to ensure TypeScript knows this is a valid key
      const status = item.status as keyof typeof counts;
      counts[status]++;
    });

    return counts;
  }

  /**
   * Add a listener for queue changes
   */
  public addListener(listener: Function): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  public removeListener(listener: Function): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    const counts = this.countByStatus();
    for (const listener of this.listeners) {
      try {
        listener(counts);
      } catch (error) {
        console.error('Error in SyncQueue listener:', error);
      }
    }
  }

  /**
   * Load the queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      const queueString = localStorage.getItem(this.storageKey);
      if (queueString) {
        const queueArray = JSON.parse(queueString);
        this.queue = new Map(queueArray);
      }
    } catch (error) {
      console.error('Failed to load sync queue from storage:', error);
      // Initialize empty queue
      this.queue = new Map();
    }
  }

  /**
   * Save the queue to localStorage
   */
  private saveToStorage(): void {
    try {
      const queueArray = Array.from(this.queue.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(queueArray));
    } catch (error) {
      console.error('Failed to save sync queue to storage:', error);
    }
  }
}

export default SyncQueue;
