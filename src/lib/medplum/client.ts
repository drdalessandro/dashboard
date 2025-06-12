// src/lib/medplum/client.ts
import { MedplumClient } from "@medplum/core";
import { Resource, ResourceType } from '@medplum/fhirtypes';
// Import our centralized configuration and logger
import {
  medplumBaseUrl,
  medplumClientId,
  isDevelopment,
  isDebugEnabled
} from '../../config/environment';
import { createLogger } from '../../utils/logger';

// Initialize logger for this module
const logger = createLogger('MedplumClient');

// Use environment variables directly instead of centralized config
const baseUrl = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103';
const clientId = process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || 'gandall-healthcare-app';
const clientSecret = process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_SECRET || '';

// Enhanced logging for debugging
if (isDebugEnabled) {
  logger.debug('Initializing client with:', {
    baseUrl,
    clientId,
    nodeEnv: process.env.NODE_ENV
  });
}

// Connection status tracking
let isServerAvailable = true;
let connectionCheckInProgress = false;

// Function to check server connectivity
export const checkServerConnection = async (): Promise<boolean> => {
  if (connectionCheckInProgress || typeof window === 'undefined') {
    return isServerAvailable;
  }

  connectionCheckInProgress = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    // First try with no-cors mode to avoid CORS errors
    const response = await fetch(`${baseUrl}/healthcheck`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);
    // With no-cors mode, we can't check response.ok, but if we get here without an error,
    // it means the server is reachable
    isServerAvailable = true;

    if (isDebugEnabled) {
      console.log(`[MEDPLUM DEBUG] Server connectivity check: ${isServerAvailable ? 'Available' : 'Unavailable'}`);
    }
  } catch (error) {
    isServerAvailable = false;
    if (isDebugEnabled) {
      console.warn('[MEDPLUM DEBUG] Server connectivity check failed:', error);
    }
  } finally {
    connectionCheckInProgress = false;
  }

  return isServerAvailable;
};

// Create Medplum client with enhanced error handling
let medplumClient: MedplumClient | null = null;

// Helper function to extend MedplumClient with request hooks
function extendMedplumClient(client: MedplumClient): MedplumClient {
  // Preserve the original type while adding custom methods
  const extendedClient = client as MedplumClient & {
    onBeforeRequest?: (url: string, options: RequestInit) => { url: string; options: RequestInit };
    onAfterRequest?: (url: string, options: RequestInit, response: Response) => Response;
  };

  extendedClient.onBeforeRequest = (url: string, options: RequestInit) => {
    try {
      // Only process FHIR resource URLs
      if (url.includes('/fhir/')) {
        const urlParts = url.split('/');
        // Check if this is a resource read operation
        if (urlParts.length >= 4) {
          const resourceType = urlParts[urlParts.length - 2];
          const resourceId = urlParts[urlParts.length - 1].split('?')[0]; // Remove any query parameters

          // Log known problematic IDs
          if (resourceId === '01955638-e505-76c9-8818-47d1a48b77b1') {
            logger.warn(`Request for known problematic ID detected: ${resourceId}`);
          }

          logger.debug(`Processing request for ${resourceType}/${resourceId}`);
        }
      }
    } catch (error) {
      logger.error('Error in onBeforeRequest hook:', error);
    }

    return { url, options };
  };

  extendedClient.onAfterRequest = (url: string, options: RequestInit, response: Response) => {
    try {
      // Only process failed FHIR resource URLs
      if (!response.ok && url.includes('/fhir/')) {
        const urlParts = url.split('/');
        // Check if this is a resource read operation
        if (urlParts.length >= 4) {
          const resourceType = urlParts[urlParts.length - 2];
          const resourceId = urlParts[urlParts.length - 1].split('?')[0]; // Remove any query parameters

          logger.error(`Failed request for ${resourceType}/${resourceId}`, {
            status: response.status,
            statusText: response.statusText,
            url: url
          });

          // For specific problematic IDs, log additional diagnostic information
          if (resourceId === '01955638-e505-76c9-8818-47d1a48b77b1') {
            logger.warn(`Additional diagnostic info for problematic ID: ${resourceId}`, {
              resourceType,
              method: options.method || 'GET',
              headers: options.headers ? JSON.stringify(options.headers) : 'None',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error in onAfterRequest hook:', error);
    }

    return response;
  };

  return extendedClient;
}

// Initialize MedplumClient
function initializeMedplumClient() {
  // Check if we have a stored token to restore - safely handle server-side rendering
  const isClient = typeof window !== 'undefined';
  const storedToken = isClient ? localStorage.getItem('medplum.access_token') : null;

  // Debug the configuration
  if (isDebugEnabled) {
    logger.debug('Configuration:', {
      baseUrl,
      clientId,
      hasClientSecret: !!clientSecret,
      hasStoredToken: !!storedToken,
      environment: process.env.NODE_ENV
    });
  }

  try {
    // Create client with more detailed configuration
    const client = new MedplumClient({
      baseUrl,
      clientId,
      clientSecret,
      // Add more detailed error handling
      onUnauthenticated: () => {
        logger.warn("Client is unauthenticated. Authentication required.");
        // Only clear tokens on client-side if server is available
        if (isClient && isServerAvailable) {
          localStorage.removeItem('medplum.access_token');
        }
      },
      // Use a fetch implementation that works in both browser and Next.js environments
      fetch: async (url, options) => {
        if (isDebugEnabled) {
          logger.debug(`Fetch request to: ${url}`);
        }

        // Check if we're offline first
        if (isClient && typeof navigator !== 'undefined' && !navigator.onLine) {
          console.warn('[MEDPLUM] Browser reports offline status. Using offline mode.');
          return new Response(JSON.stringify({
            offline: true,
            message: 'You are offline. Some features may be limited.'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check server connectivity if needed
        if (!isServerAvailable && !url.includes('/auth/')) {
          // Recheck connectivity periodically, but don't block on it
          checkServerConnection();

          // If it's not an auth request and server is unavailable, return offline response
          console.warn('[MEDPLUM] Server unavailable. Using offline mode for request:', url);
          return new Response(JSON.stringify({
            offline: true,
            message: 'Server is currently unavailable. Operating in offline mode.'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Use the global fetch with better error handling
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const modifiedOptions = {
            ...options,
            signal: controller.signal
          };

          const response = await fetch(url, modifiedOptions);
          clearTimeout(timeoutId);

          if (isDebugEnabled) {
            logger.debug(`Fetch response from ${url}:`, response.status);
          }

          // Update server availability status based on response
          if (response.status >= 500 && !url.includes('/auth/')) {
            isServerAvailable = false;
          }

          return response;
        } catch (error: any) {
          logger.error(`Fetch error for ${url}:`, error);

          // Update server availability
          if (!url.includes('/auth/')) {
            isServerAvailable = false;
          }

          // For offline-first support, handle network errors gracefully
          if (error.message === 'Failed to fetch' ||
            error.name === 'TypeError' ||
            error.name === 'AbortError') {
            logger.warn('Network error detected - possibly offline or timeout');

            // Return a mock response that can be handled by the application
            return new Response(JSON.stringify({
              offline: true,
              message: 'Connection failed. Operating in offline mode.'
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          throw error;
        }
      },
      verbose: isDebugEnabled
    });

    // Extend the client with custom request hooks
    medplumClient = extendMedplumClient(client);

    // Restore token if available - only on client side
    if (storedToken && isClient) {
      try {
        medplumClient.setAccessToken(storedToken);
        if (isDebugEnabled) {
          logger.debug('Restored access token from localStorage');
        }

        // Verify the token is valid by making a test request
        medplumClient.getProfileAsync()
          .then(profile => {
            if (isDebugEnabled) {
              logger.debug('Token verified, profile:', profile?.resourceType);
            }
          })
          .catch(error => {
            logger.error('Invalid stored token:', error);
            // Only clear token if server is available
            if (isServerAvailable) {
              localStorage.removeItem('medplum.access_token');
            }
          });
      } catch (tokenError) {
        logger.error('Failed to restore access token:', tokenError);
        // Only clear token if server is available
        if (isServerAvailable) {
          localStorage.removeItem('medplum.access_token');
        }
      }
    }

  } catch (error) {
    logger.error("Error initializing client:", error);
    // Create a fallback client with offline support to prevent application crashes
    const fallbackClient = new MedplumClient({
      baseUrl, // Use the same baseUrl for consistency
      clientId,
      // Add offline-friendly fetch implementation
      fetch: (url, options) => {
        if (isDebugEnabled) {
          logger.debug(`Fallback client fetch: ${url}`);
        }
        return fetch(url, options).catch(error => {
          logger.warn('Network error in fallback client - working offline');
          // Return a mock response for offline support
          return new Response(JSON.stringify({
            offline: true,
            message: 'You appear to be offline. Some features may be limited.'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      }
    });

    medplumClient = fallbackClient;

    if (isDebugEnabled) {
      logger.debug('Created fallback client with offline support');
    }
  }
}

// Initialize the client
initializeMedplumClient();

// Ensure client is initialized before adding hooks
if (medplumClient) {
  // Check connectivity immediately if on client
  if (typeof window !== 'undefined') {
    checkServerConnection().then(available => {
      if (!available && isDebugEnabled) {
        logger.warn('Server appears to be unavailable. Operating in offline mode.');
      }
    });
  }
}

// Export a function to check server availability
export const isServerConnected = (): boolean => isServerAvailable;

// Export the client instance for use in data providers and components
export { medplumClient };

// Re-export the client as default for backward compatibility
// export default medplumClient;
