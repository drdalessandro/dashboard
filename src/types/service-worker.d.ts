// TypeScript definitions for Background Sync API
// This extends the standard ServiceWorkerRegistration interface

interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

// Extend the ServiceWorkerRegistration interface
interface ServiceWorkerRegistration {
  // Add the sync property
  sync: SyncManager;
}

// SyncEvent interface for the 'sync' event
interface SyncEvent extends ExtendableEvent {
  tag: string;
}

// Update the service worker global scope to include sync event handling
interface ServiceWorkerGlobalScopeEventMap {
  sync: SyncEvent;
}
