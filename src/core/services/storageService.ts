// src/core/services/storageService.ts

/**
 * Storage service for managing local data with offline-first capabilities
 * Provides methods for storing, retrieving, and synchronizing data
 */
export const storageService = {
  /**
   * Save data to local storage with an optional expiration time
   * @param key Storage key
   * @param data Data to store
   * @param expiryHours Number of hours until data expires (optional)
   */
  saveData<T>(key: string, data: T, expiryHours?: number): void {
    try {
      const item = {
        data,
        timestamp: new Date().getTime(),
        expiry: expiryHours ? new Date().getTime() + (expiryHours * 60 * 60 * 1000) : undefined
      };
      
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
    }
  },

  /**
   * Retrieve data from local storage
   * @param key Storage key
   * @returns The stored data, or null if not found or expired
   */
  getData<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      // Check if data has expired
      if (item.expiry && new Date().getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.data as T;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove data from local storage
   * @param key Storage key
   */
  removeData(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
    }
  },

  /**
   * Check if data exists and is not expired
   * @param key Storage key
   * @returns True if data exists and is not expired
   */
  hasValidData(key: string): boolean {
    return this.getData(key) !== null;
  },

  /**
   * Get data timestamp (when it was saved)
   * @param key Storage key
   * @returns Timestamp in milliseconds, or null if data doesn't exist
   */
  getDataTimestamp(key: string): number | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      return item.timestamp as number;
    } catch (error) {
      console.error(`Error getting timestamp for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Save data with a prefix for namespacing
   * Useful for organizing related data (e.g., 'patient:123', 'patient:456')
   * @param prefix Key prefix
   * @param id Unique identifier
   * @param data Data to store
   * @param expiryHours Number of hours until data expires (optional)
   */
  saveNamespacedData<T>(prefix: string, id: string, data: T, expiryHours?: number): void {
    const key = `${prefix}:${id}`;
    this.saveData(key, data, expiryHours);
  },

  /**
   * Retrieve data with a prefix for namespacing
   * @param prefix Key prefix
   * @param id Unique identifier
   * @returns The stored data, or null if not found or expired
   */
  getNamespacedData<T>(prefix: string, id: string): T | null {
    const key = `${prefix}:${id}`;
    return this.getData<T>(key);
  },

  /**
   * Get all keys with a specific prefix
   * @param prefix Key prefix
   * @returns Array of matching keys
   */
  getKeysByPrefix(prefix: string): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${prefix}:`)) {
        keys.push(key);
      }
    }
    
    return keys;
  },

  /**
   * Get all data items with a specific prefix
   * @param prefix Key prefix
   * @returns Array of data items
   */
  getAllByPrefix<T>(prefix: string): T[] {
    const keys = this.getKeysByPrefix(prefix);
    const items: T[] = [];
    
    for (const key of keys) {
      const data = this.getData<T>(key);
      if (data) {
        items.push(data);
      }
    }
    
    return items;
  },

  /**
   * Clear all data with a specific prefix
   * @param prefix Key prefix
   */
  clearByPrefix(prefix: string): void {
    const keys = this.getKeysByPrefix(prefix);
    
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  },

  /**
   * Clear all expired data
   * Returns the number of items cleared
   */
  clearExpiredData(): number {
    let clearedCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) continue;
        
        const item = JSON.parse(itemStr);
        
        // Check if data has expired
        if (item.expiry && new Date().getTime() > item.expiry) {
          localStorage.removeItem(key);
          clearedCount++;
          i--; // Adjust index since we removed an item
        }
      } catch (error) {
        console.error(`Error checking expiry for key ${key}:`, error);
      }
    }
    
    return clearedCount;
  }
};
