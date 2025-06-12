// src/data/utils/SyncManager.ts
// Centralized offline manager for handling online/offline transitions, caching, and synchronization

// Import our TypeScript definitions for ServiceWorker Sync API
import '../types/service-worker';

import { SyncStatus, PendingOperation, OperationType } from '@/data/models/base';
import { patientService, observationService, medicationRequestService, practitionerService, appointmentService } from '@/data/services/ResourceServices';
import SyncQueue, { QueueItem } from './SyncQueue';
import { storageService } from '@/core/services/storageService';

// Interface for synchronization options
interface SyncOptions {
  force?: boolean;
  silent?: boolean;
  retryLimit?: number;
}

/**
 * Enhanced SyncManager provides centralized offline-first capabilities:
 * - Manages online/offline state transitions
 * - Registers and controls service worker
 * - Manages synchronization of offline operations
 * - Provides unified cache invalidation
 * - Centralizes offline storage mechanisms
 */
class SyncManager {
  public isInitialized = false;
  private isSyncing = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private serviceWorkerSyncSupported = false;
  private syncQueue: SyncQueue;
  private syncInterval: number | null = null;
  private retryDelay = 5000; // 5 seconds
  private isProcessingQueue = false;
  private resourceServices = [
    patientService,
    observationService,
    medicationRequestService,
    practitionerService,
    appointmentService
  ];

  constructor() {
    this.syncQueue = new SyncQueue();
  }

  /**
   * Initialize the sync manager, register service worker, and set up event listeners
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize the storage service
    await storageService.initialize();

    // Register service worker if browser supports it
    await this.registerServiceWorker();

    // Set up online/offline event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener('message', this.handleServiceWorkerMessage);

    // Initialize sync status
    this.updateSyncStatus();

    // Start periodic sync
    this.startPeriodicSync();

    // If we're online on initialization, process the queue
    if (navigator.onLine) {
      this.processSyncQueue().catch(err =>
        console.error('Failed to process sync queue on initialization:', err)
      );
    }

    this.isInitialized = true;
    console.log('Enhanced SyncManager initialized - Offline-first mode active');
  }

  /**
   * Clean up event listeners and intervals
   */
  public destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    navigator.serviceWorker?.removeEventListener('message', this.handleServiceWorkerMessage);

    if (this.syncInterval !== null) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isInitialized = false;
    console.log('SyncManager destroyed');
  }

  /**
   * Register the service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        this.serviceWorkerRegistration = registration;

        console.log('Service Worker registered successfully:', registration.scope);

        // Check if update is available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.notifyUserOfUpdate();
              }
            });
          }
        });

        // Register for background sync if supported
        // With our TypeScript definition, TypeScript now recognizes the sync property
        if ('sync' in registration) {
          try {
            this.serviceWorkerSyncSupported = true;
            await registration.sync.register('sync-pending-changes');
            console.log('Background sync registered');
          } catch (error) {
            console.error('Background sync registration failed:', error);
            this.serviceWorkerSyncSupported = false;
          }
        } else {
          console.warn('Background sync not supported by this browser');
          this.serviceWorkerSyncSupported = false;
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    } else {
      console.warn('Service workers are not supported in this browser');
    }
  }

  /**
   * Notify user of service worker update
   */
  private notifyUserOfUpdate(): void {
    const event = new CustomEvent('serviceWorkerUpdated');
    window.dispatchEvent(event);

    console.log('New version available! Reload the page to update.');
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage = (event: MessageEvent): void => {
    const data = event.data;

    if (data && data.type === 'PERFORM_SYNC') {
      this.processSyncQueue().catch(err =>
        console.error('Failed to process sync queue from service worker message:', err)
      );
    }

    if (data && data.type === 'CACHE_UPDATED') {
      // A cache entry was updated, refresh relevant UI
      const event = new CustomEvent('cacheUpdated', {
        detail: { url: data.url }
      });
      window.dispatchEvent(event);
    }
  };

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    // Run sync process every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine && !this.isSyncing && this.syncQueue.countByStatus().pending > 0) {
        this.processSyncQueue({ silent: true }).catch(err =>
          console.error('Periodic sync failed:', err)
        );
      }
    }, 30000) as unknown as number;
  }

  /**
   * Handle coming back online
   */
  private handleOnline = (): void => {
    console.log('Connection restored. Processing sync queue...');
    this.updateSyncStatus();

    // Trigger background sync if available
    if (this.serviceWorkerRegistration && this.serviceWorkerSyncSupported) {
      // With our TypeScript definition, TypeScript now recognizes the sync property
      if ('sync' in this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration.sync.register('sync-pending-changes')
          .catch((err: Error) => console.error('Background sync registration failed:', err));
      }
    } else {
      // Fallback to manual sync
      this.processSyncQueue().catch((err: Error) =>
        console.error('Failed to process sync queue on coming online:', err)
      );
    }

    // Notify all tabs about connection restoration
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ONLINE_STATUS_CHANGED',
        status: 'online'
      });
    }

    // Dispatch event for UI components
    const event = new CustomEvent('connectionRestored');
    window.dispatchEvent(event);
  };

  /**
   * Handle going offline
   */
  private handleOffline = (): void => {
    console.log('Connection lost. Switching to offline mode...');
    this.updateSyncStatus();

    // Notify all tabs about connection loss
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ONLINE_STATUS_CHANGED',
        status: 'offline'
      });
    }

    // Dispatch event for UI components
    const event = new CustomEvent('connectionLost');
    window.dispatchEvent(event);
  };

  // Track previous sync status to avoid unnecessary updates
  private previousSyncStatus: SyncStatus | null = null;
  private previousPendingCount: number = 0;
  private previousFailedCount: number = 0;

  /**
   * Update the sync status and dispatch events
   */
  private updateSyncStatus(): void {
    const queueCounts = this.syncQueue.countByStatus();
    const status = navigator.onLine ?
      (queueCounts.pending > 0 ? SyncStatus.PENDING : SyncStatus.SYNCED) :
      SyncStatus.OFFLINE;

    // Check if status has actually changed to avoid unnecessary updates
    const hasStatusChanged = this.previousSyncStatus !== status;
    const hasPendingCountChanged = this.previousPendingCount !== queueCounts.pending;
    const hasFailedCountChanged = this.previousFailedCount !== queueCounts.failed;

    // Only update if something has changed
    if (hasStatusChanged || hasPendingCountChanged || hasFailedCountChanged) {
      // Update previous values
      this.previousSyncStatus = status;
      this.previousPendingCount = queueCounts.pending;
      this.previousFailedCount = queueCounts.failed;

      // Update localStorage
      localStorage.setItem('syncStatus', status);

      // Dispatch custom event for components to listen to
      const event = new CustomEvent('syncStatusChanged', {
        detail: {
          status,
          pendingChanges: queueCounts.pending,
          failedChanges: queueCounts.failed,
          lastUpdated: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Process the synchronization queue
   */
  public async processSyncQueue(options: SyncOptions = {}): Promise<void> {
    if (!navigator.onLine || this.isProcessingQueue) return;

    const pendingItems = this.syncQueue.getPending();

    // Early return if queue is empty
    if (pendingItems.length === 0) {
      if (!options.silent) {
        console.log('Sync queue is empty, nothing to process');
      }
      return;
    }

    this.isProcessingQueue = true;
    this.isSyncing = true;

    if (!options.silent) {
      console.log(`Starting to process sync queue (${pendingItems.length} items)...`);
    }

    try {
      for (const item of pendingItems) {
        if (!navigator.onLine) {
          console.log('Connection lost during sync, pausing queue processing');
          break;
        }

        try {
          this.syncQueue.updateStatus(item.id, 'processing');

          // Process the queue item based on resource type
          const service = this.getServiceForResourceType(item.resourceType);

          if (!service) {
            console.error(`No service found for resource type: ${item.resourceType}`);
            this.syncQueue.updateStatus(item.id, 'failed', 'Service not found');
            continue;
          }

          // Process based on operation type
          switch (item.operation.type) {
            case 'create':
              await service.create(item.operation.data);
              break;
            case 'update':
              await service.update(item.operation.data.id, item.operation.data);
              break;
            case 'delete':
              await service.delete(item.operation.data.id);
              break;
            default:
              throw new Error(`Unknown operation type: ${item.operation.type}`);
          }

          // Mark as completed and remove from queue
          this.syncQueue.updateStatus(item.id, 'completed');
          this.syncQueue.remove(item.id);

          console.log(`Processed queue item (${item.id}) successfully`);
        } catch (error) {
          console.error(`Failed to process queue item (${item.id}):`, error);

          // Check if max retries reached
          if (this.syncQueue.hasReachedMaxRetries(item.id)) {
            this.syncQueue.updateStatus(item.id, 'failed', error);
          } else {
            // Reset to pending for later retry
            this.syncQueue.updateStatus(item.id, 'pending');
          }
        }
      }

      // Clean up completed and old failed items
      this.syncQueue.cleanup();

      // Update sync status
      this.updateSyncStatus();

      const counts = this.syncQueue.countByStatus();

      if (!options.silent) {
        console.log(`Sync queue processing completed. Remaining: ${counts.pending} pending, ${counts.failed} failed`);
      }

      // If items are still pending, schedule another retry after delay
      if (counts.pending > 0 && navigator.onLine) {
        setTimeout(() => {
          this.processSyncQueue({ silent: true }).catch(err =>
            console.error('Retry sync failed:', err)
          );
        }, this.retryDelay);
      }

      // Sync resource-specific data
      if (counts.pending === 0) {
        await this.syncResourceData();
      }

      // Dispatch sync completed event
      const event = new CustomEvent('syncCompleted', {
        detail: {
          success: true,
          pendingCount: counts.pending,
          failedCount: counts.failed
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Sync queue processing failed:', error);

      // Dispatch sync failed event
      const event = new CustomEvent('syncCompleted', {
        detail: {
          success: false,
          error
        }
      });
      window.dispatchEvent(event);
    } finally {
      this.isProcessingQueue = false;
      this.isSyncing = false;
    }
  }

  /**
   * Sync resource-specific data from services
   */
  private async syncResourceData(): Promise<void> {
    // Call syncPendingChanges on each service
    for (const service of this.resourceServices) {
      try {
        await service.syncPendingChanges();
      } catch (error) {
        // Use type assertion to access resourceType property
        const resourceType = (service as any).resourceType || 'unknown';
        console.error(`Failed to sync ${resourceType} data:`, error);
      }
    }

    // Update last sync time
    localStorage.setItem('lastSyncTime', new Date().toISOString());
  }

  /**
   * Get the appropriate service for a resource type
   */
  private getServiceForResourceType(resourceType: string) {
    return this.resourceServices.find(service =>
      (service as any).resourceType?.toLowerCase() === resourceType.toLowerCase()
    );
  }

  /**
   * Add an operation to the synchronization queue
   */
  public addToSyncQueue(
    operation: OperationType,
    resourceType: string,
    data: any,
    options: { priority?: number } = {}
  ): string {
    const id = this.syncQueue.add(operation, resourceType, data, options);

    // Update sync status
    this.updateSyncStatus();

    // If we're online, try to process the queue immediately
    if (navigator.onLine && !this.isProcessingQueue) {
      setTimeout(() => {
        this.processSyncQueue({ silent: true }).catch(err =>
          console.error('Failed to process sync queue after new addition:', err)
        );
      }, 100);
    }

    return id;
  }

  /**
   * Get the current sync status
   */
  public getSyncStatus(): {
    status: SyncStatus;
    lastSyncTime: string | null;
    pendingChangesCount: number;
    failedChangesCount: number;
    isOnline: boolean;
  } {
    const queueCounts = this.syncQueue.countByStatus();
    const status = localStorage.getItem('syncStatus') as SyncStatus ||
      (navigator.onLine ?
        (queueCounts.pending > 0 ? SyncStatus.PENDING : SyncStatus.SYNCED) :
        SyncStatus.OFFLINE);

    const lastSyncTime = localStorage.getItem('lastSyncTime');

    return {
      status,
      lastSyncTime,
      pendingChangesCount: queueCounts.pending,
      failedChangesCount: queueCounts.failed,
      isOnline: navigator.onLine
    };
  }

  /**
   * Clear all cached data including IndexedDB, localStorage, and the Cache API
   */
  public async clearAllCaches(): Promise<void> {
    console.log('Clearing all caches...');

    // Clear service data caches
    for (const service of this.resourceServices) {
      await service.clearCache();
    }

    // Clear storage service caches
    await storageService.clearAllStores();

    // Clear sync-related metadata
    localStorage.removeItem('syncStatus');
    localStorage.removeItem('lastSyncTime');

    // Reset the queue
    this.syncQueue.clear();

    // Clear browser caches via service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      return new Promise((resolve, reject) => {
        // Create message channel for response
        const messageChannel = new MessageChannel();

        // Handle response
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.success) {
            console.log('Browser caches cleared successfully');
            resolve();
          } else {
            reject(new Error('Failed to clear browser caches'));
          }
        };

        // Send clear cache request to service worker with null check
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CLEAR_CACHE'
          }, [messageChannel.port2]);
        } else {
          reject(new Error('No active service worker controller'));
        }
      });
    }

    console.log('All caches cleared');
  }

  /**
   * Get all pending operations
   */
  public getPendingOperations(): PendingOperation[] {
    return this.syncQueue.getPending().map(item => item.operation);
  }

  /**
   * Get failed operations that need review
   */
  public getFailedOperations(): QueueItem[] {
    return this.syncQueue.getFailed();
  }

  /**
   * Retry a failed operation
   */
  public retryFailedOperation(id: string): boolean {
    const result = this.syncQueue.retry(id);

    if (result && navigator.onLine) {
      this.processSyncQueue({ silent: true }).catch(err =>
        console.error('Failed to process sync queue after retry:', err)
      );
    }

    return result;
  }

  /**
   * Retry all failed operations
   */
  public retryAllFailedOperations(): number {
    const count = this.syncQueue.retryAllFailed();

    if (count > 0 && navigator.onLine) {
      this.processSyncQueue({ silent: false }).catch(err =>
        console.error('Failed to process sync queue after retry all:', err)
      );
    }

    return count;
  }

  /**
   * Force synchronization of all data
   */
  public async forceSyncAll(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Cannot force sync while offline');
    }

    // First process the queue
    await this.processSyncQueue({ force: true });

    // Then refresh all resource data
    for (const service of this.resourceServices) {
      try {
        await (service as any).refreshCache?.();
      } catch (error) {
        console.error(`Failed to refresh ${(service as any).resourceType} cache:`, error);
      }
    }

    console.log('Force sync completed');
    localStorage.setItem('lastSyncTime', new Date().toISOString());
    this.updateSyncStatus();
  }
  /**
   * Sync pending changes - This handles sync process when triggered by the service worker
   */
  public async syncPendingChanges(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Perform the actual sync operation
    return this.processSyncQueue({ force: true });
  }
}

// Export a singleton instance of the SyncManager
export const syncManager = new SyncManager();

// Hook to get sync status from the SyncManager
import { useState, useEffect, useRef } from 'react';

export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState(syncManager.getSyncStatus());
  const initRef = useRef(false);

  useEffect(() => {
    // Remove all initialization logic to prevent infinite loops
    // The App component should handle initialization exclusively

    // Update on sync status changes
    const handleSyncStatusChange = () => {
      setSyncStatus(syncManager.getSyncStatus());
    };

    // Listen for sync status changes
    window.addEventListener('syncStatusChanged', handleSyncStatusChange);
    window.addEventListener('syncCompleted', handleSyncStatusChange);
    window.addEventListener('online', handleSyncStatusChange);
    window.addEventListener('offline', handleSyncStatusChange);

    // Skip initial update to prevent potential loops
    // handleSyncStatusChange();

    // Cleanup
    return () => {
      window.removeEventListener('syncStatusChanged', handleSyncStatusChange);
      window.removeEventListener('syncCompleted', handleSyncStatusChange);
      window.removeEventListener('online', handleSyncStatusChange);
      window.removeEventListener('offline', handleSyncStatusChange);
    };
  }, []);

  return {
    ...syncStatus,
    syncPendingChanges: () => syncManager.syncPendingChanges(),
    clearAllCaches: () => syncManager.clearAllCaches()
  };
}
