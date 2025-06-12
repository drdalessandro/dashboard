/**
 * SyncService.ts
 * 
 * Handles offline synchronization of FHIR resources and pending operations
 * Provides conflict resolution and progress tracking for offline-first functionality
 * Extracted from useMedplum to improve separation of concerns
 */

import { Resource, ResourceType } from '@medplum/fhirtypes';
import { MedplumClient } from '@medplum/core';
import { createLogger } from '../../utils/logger';
import { cacheService } from './CacheService';

// Initialize logger for this service
const logger = createLogger('SyncService');

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resourceType: ResourceType;
  resourceId?: string;
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface SyncProgress {
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  isInProgress: boolean;
  errors: Array<{ operation: PendingOperation; error: Error }>;
}

export interface SyncOptions {
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  timeout?: number;
}

/**
 * Service for managing offline synchronization and pending operations
 */
export class SyncService {
  private medplumClient: MedplumClient;
  private options: Required<SyncOptions>;
  private syncInProgress = false;
  private listeners: Array<(progress: SyncProgress) => void> = [];

  constructor(medplumClient: MedplumClient, options: SyncOptions = {}) {
    this.medplumClient = medplumClient;
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      batchSize: options.batchSize ?? 10,
      timeout: options.timeout ?? 30000,
    };
  }

  /**
   * Check if there are pending operations to sync
   */
  public hasPendingOperations(): boolean {
    const creates = this.getPendingOperations('create');
    const updates = this.getPendingOperations('update');
    const deletes = this.getPendingOperations('delete');
    
    return creates.length > 0 || updates.length > 0 || deletes.length > 0;
  }

  /**
   * Get count of pending operations
   */
  public getPendingOperationsCount(): { creates: number; updates: number; deletes: number; total: number } {
    const creates = this.getPendingOperations('create');
    const updates = this.getPendingOperations('update');
    const deletes = this.getPendingOperations('delete');
    
    return {
      creates: creates.length,
      updates: updates.length,
      deletes: deletes.length,
      total: creates.length + updates.length + deletes.length,
    };
  }

  /**
   * Queue a create operation for offline sync
   */
  public queueCreate(resourceType: ResourceType, data: any): string {
    const operation: PendingOperation = {
      id: `create-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'create',
      resourceType,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.storePendingOperation('create', operation);
    logger.debug(`Queued create operation for ${resourceType}`, { operationId: operation.id });
    
    return operation.id;
  }

  /**
   * Queue an update operation for offline sync
   */
  public queueUpdate(resourceType: ResourceType, resourceId: string, data: any): string {
    const operation: PendingOperation = {
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'update',
      resourceType,
      resourceId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.storePendingOperation('update', operation);
    logger.debug(`Queued update operation for ${resourceType}/${resourceId}`, { operationId: operation.id });
    
    return operation.id;
  }

  /**
   * Queue a delete operation for offline sync
   */
  public queueDelete(resourceType: ResourceType, resourceId: string): string {
    const operation: PendingOperation = {
      id: `delete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'delete',
      resourceType,
      resourceId,
      data: { id: resourceId },
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.storePendingOperation('delete', operation);
    logger.debug(`Queued delete operation for ${resourceType}/${resourceId}`, { operationId: operation.id });
    
    return operation.id;
  }

  /**
   * Synchronize all pending operations
   */
  public async syncPendingOperations(): Promise<SyncProgress> {
    if (this.syncInProgress) {
      logger.warn('Sync already in progress, skipping...');
      return this.getCurrentProgress();
    }

    this.syncInProgress = true;
    
    try {
      logger.info('Starting synchronization of pending operations...');
      
      const allOperations = this.getAllPendingOperations();
      const progress: SyncProgress = {
        totalOperations: allOperations.length,
        completedOperations: 0,
        failedOperations: 0,
        isInProgress: true,
        errors: [],
      };

      this.notifyProgress(progress);

      // Process operations in batches
      for (let i = 0; i < allOperations.length; i += this.options.batchSize) {
        const batch = allOperations.slice(i, i + this.options.batchSize);
        await this.processBatch(batch, progress);
      }

      progress.isInProgress = false;
      this.notifyProgress(progress);

      logger.info('Synchronization completed', {
        total: progress.totalOperations,
        completed: progress.completedOperations,
        failed: progress.failedOperations,
      });

      return progress;
    } catch (error) {
      logger.error('Synchronization failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Subscribe to sync progress updates
   */
  public subscribe(listener: (progress: SyncProgress) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all pending operations (use with caution)
   */
  public clearPendingOperations(): void {
    cacheService.delete('pending.creates');
    cacheService.delete('pending.updates');
    cacheService.delete('pending.deletes');
    
    logger.info('Cleared all pending operations');
  }

  /**
   * Process a batch of operations
   */
  private async processBatch(operations: PendingOperation[], progress: SyncProgress): Promise<void> {
    const promises = operations.map(operation => this.processOperation(operation, progress));
    await Promise.allSettled(promises);
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: PendingOperation, progress: SyncProgress): Promise<void> {
    try {
      logger.debug(`Processing ${operation.type} operation`, { 
        operationId: operation.id,
        resourceType: operation.resourceType,
        resourceId: operation.resourceId 
      });

      let result: any;

      switch (operation.type) {
        case 'create':
          result = await this.medplumClient.createResource(operation.data);
          break;
        case 'update':
          result = await this.medplumClient.updateResource(operation.data);
          break;
        case 'delete':
          result = await this.processDeleteOperation(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      // Remove successful operation from pending queue
      this.removePendingOperation(operation);
      
      // Update cache with result if applicable
      if (result && result.resourceType && result.id) {
        cacheService.cacheResource(result);
      }

      progress.completedOperations++;
      this.notifyProgress(progress);

      logger.debug(`Successfully processed ${operation.type} operation`, { 
        operationId: operation.id,
        result: result?.id 
      });

    } catch (error) {
      const syncError = error instanceof Error ? error : new Error(String(error));
      
      logger.error(`Failed to process ${operation.type} operation`, {
        operationId: operation.id,
        error: syncError.message,
        retryCount: operation.retryCount,
      });

      // Update retry count and store error
      operation.retryCount++;
      operation.lastError = syncError.message;

      if (operation.retryCount >= this.options.maxRetries) {
        // Max retries reached, move to failed
        progress.failedOperations++;
        progress.errors.push({ operation, error: syncError });
        this.removePendingOperation(operation);
      } else {
        // Update operation for retry
        this.storePendingOperation(operation.type, operation);
      }

      this.notifyProgress(progress);
    }
  }

  /**
   * Process delete operation with appropriate status handling
   */
  private async processDeleteOperation(operation: PendingOperation): Promise<Resource> {
    if (!operation.resourceId) {
      throw new Error('Delete operation missing resource ID');
    }

    try {
      // Read current resource to determine how to handle deletion
      const current = await this.medplumClient.readResource(
        operation.resourceType, 
        operation.resourceId
      );

      let deleted: Resource;

      // Handle different resource types with appropriate status values
      if (current.resourceType === 'Patient' || current.resourceType === 'Practitioner') {
        deleted = {
          ...current,
          active: false // For Patient and Practitioner, use 'active' flag
        };
      } else if (current.resourceType === 'Observation') {
        deleted = {
          ...current,
          status: 'entered-in-error' as const // For Observation
        };
      } else if (current.resourceType === 'DiagnosticReport') {
        deleted = {
          ...current,
          status: 'cancelled' as const // For DiagnosticReport
        };
      } else if (current.resourceType === 'MedicationRequest') {
        deleted = {
          ...current,
          status: 'cancelled' as const // For MedicationRequest
        };
      } else if (current.resourceType === 'Appointment') {
        deleted = {
          ...current,
          status: 'cancelled' as const // For Appointment
        };
      } else {
        // Generic approach for other resources - add deletion tag
        deleted = {
          ...current,
          meta: {
            ...current.meta,
            tag: [...(current.meta?.tag || []), {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
              code: 'DELETED',
              display: 'Deleted'
            }]
          }
        };
      }

      const result = await this.medplumClient.updateResource(deleted);
      return result;
    } catch (error) {
      logger.error(`Error processing delete for ${operation.resourceType}/${operation.resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Get pending operations of a specific type
   */
  private getPendingOperations(type: 'create' | 'update' | 'delete'): PendingOperation[] {
    const cached = cacheService.get<PendingOperation[]>(`pending.${type}s`);
    return cached || [];
  }

  /**
   * Get all pending operations
   */
  private getAllPendingOperations(): PendingOperation[] {
    const creates = this.getPendingOperations('create');
    const updates = this.getPendingOperations('update');
    const deletes = this.getPendingOperations('delete');
    
    // Sort by timestamp (oldest first)
    return [...creates, ...updates, ...deletes].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Store a pending operation
   */
  private storePendingOperation(type: 'create' | 'update' | 'delete', operation: PendingOperation): void {
    const key = `pending.${type}s`;
    const existing = this.getPendingOperations(type);
    
    // Replace existing operation with same ID or add new one
    const updated = existing.filter(op => op.id !== operation.id);
    updated.push(operation);
    
    cacheService.set(key, updated);
  }

  /**
   * Remove a pending operation
   */
  private removePendingOperation(operation: PendingOperation): void {
    const key = `pending.${operation.type}s`;
    const existing = this.getPendingOperations(operation.type);
    const updated = existing.filter(op => op.id !== operation.id);
    
    cacheService.set(key, updated);
  }

  /**
   * Get current sync progress
   */
  private getCurrentProgress(): SyncProgress {
    const counts = this.getPendingOperationsCount();
    return {
      totalOperations: counts.total,
      completedOperations: 0,
      failedOperations: 0,
      isInProgress: this.syncInProgress,
      errors: [],
    };
  }

  /**
   * Notify progress listeners
   */
  private notifyProgress(progress: SyncProgress): void {
    this.listeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        logger.error('Error in sync progress listener:', error);
      }
    });
  }
}
