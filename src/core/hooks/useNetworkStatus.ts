// src/core/hooks/useNetworkStatus.ts
import { useState, useEffect, useCallback } from 'react';

interface NetworkStatusState {
  isOnline: boolean;
  wasOffline: boolean;  // Was offline since last online state
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
}

/**
 * Hook for monitoring network status with offline-first capabilities
 * Provides real-time network status and history for synchronization purposes
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatusState>({
    isOnline: navigator.onLine,
    wasOffline: false,
    lastOnlineAt: navigator.onLine ? new Date() : null,
    lastOfflineAt: !navigator.onLine ? new Date() : null
  });

  // Update online status
  const handleOnline = useCallback(() => {
    setStatus(prevStatus => ({
      isOnline: true,
      wasOffline: !prevStatus.isOnline,  // Only true if we were offline before
      lastOnlineAt: new Date(),
      lastOfflineAt: prevStatus.lastOfflineAt
    }));
  }, []);

  // Update offline status
  const handleOffline = useCallback(() => {
    setStatus(prevStatus => ({
      isOnline: false,
      wasOffline: prevStatus.wasOffline,  // Maintain previous value
      lastOnlineAt: prevStatus.lastOnlineAt,
      lastOfflineAt: new Date()
    }));
  }, []);

  // Check connectivity to a specific endpoint
  const checkEndpointConnectivity = useCallback(async (
    url: string = 'https://www.google.com',
    timeout: number = 5000
  ): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.error('Connectivity check failed:', error);
      return false;
    }
  }, []);

  // Reset the wasOffline flag (useful after syncing)
  const resetWasOffline = useCallback(() => {
    setStatus(prevStatus => ({
      ...prevStatus,
      wasOffline: false
    }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // If we start as online, do a connectivity check
    if (navigator.onLine) {
      checkEndpointConnectivity().then(isReachable => {
        if (!isReachable && navigator.onLine) {
          // We're online but endpoint is not reachable
          // This may indicate a limited connection
          setStatus(prevStatus => ({
            ...prevStatus,
            wasOffline: true
          }));
        }
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, checkEndpointConnectivity]);

  return {
    isOnline: status.isOnline,
    wasOffline: status.wasOffline,
    lastOnlineAt: status.lastOnlineAt,
    lastOfflineAt: status.lastOfflineAt,
    checkEndpointConnectivity,
    resetWasOffline
  };
};
