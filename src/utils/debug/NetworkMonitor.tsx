import React, { useEffect, useState } from 'react';
import { createLogger } from '../logger';

const logger = createLogger('NetworkMonitor');

interface NetworkInfo {
  online: boolean;
  lastChecked: Date;
  connectionType?: string;
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
  saveData?: boolean;
}

interface NetworkMonitorProps {
  children?: React.ReactNode;
  onStatusChange?: (status: NetworkInfo) => void;
  renderStatus?: boolean;
}

/**
 * NetworkMonitor Component for Gandall Healthcare Platform
 * 
 * Monitors network connectivity status and provides critical information
 * for the offline-first architecture. Especially important for healthcare
 * applications in low-connectivity environments.
 */
export const NetworkMonitor: React.FC<NetworkMonitorProps> = ({
  children,
  onStatusChange,
  renderStatus = false
}) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastChecked: new Date()
  });

  const updateNetworkInfo = () => {
    const info: NetworkInfo = {
      online: navigator.onLine,
      lastChecked: new Date()
    };

    // Get advanced network information if available
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn) {
        info.connectionType = conn.type;
        info.downlink = conn.downlink;
        info.rtt = conn.rtt;
        info.effectiveType = conn.effectiveType;
        info.saveData = conn.saveData;
      }
    }

    setNetworkInfo(info);
    
    // Call the onStatusChange callback if provided
    if (onStatusChange) {
      onStatusChange(info);
    }

    // Log the network status change
    logger.info(`Network status: ${info.online ? 'online' : 'offline'}`);
    if (info.effectiveType) {
      logger.debug(`Connection quality: ${info.effectiveType}, RTT: ${info.rtt}ms, Downlink: ${info.downlink}Mbps`);
    }

    return info;
  };

  useEffect(() => {
    // Initial update
    updateNetworkInfo();

    // Set up event listeners for online and offline events
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    // Listen for connection changes if available
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn) {
        conn.addEventListener('change', updateNetworkInfo);
      }
    }

    // Periodic check (every 30s) for connection quality changes
    const interval = setInterval(() => {
      const info = updateNetworkInfo();
      logger.debug('Network status check:', info);
    }, 30000);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);

      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn) {
          conn.removeEventListener('change', updateNetworkInfo);
        }
      }

      clearInterval(interval);
    };
  }, []);

  // Render the network status if requested
  if (renderStatus) {
    return (
      <div className="network-monitor">
        <div className={`status-indicator ${networkInfo.online ? 'online' : 'offline'}`}>
          {networkInfo.online ? 'Online' : 'Offline'}
        </div>
        {networkInfo.effectiveType && (
          <div className="connection-quality">
            Quality: {networkInfo.effectiveType}
          </div>
        )}
        {children}
      </div>
    );
  }

  // Otherwise just render children
  return <>{children}</>;
};
