// src/lib/medplum/interceptor.ts
/**
 * Network interceptor for Medplum FHIR API calls
 * This module provides debugging capabilities for monitoring API requests and responses
 */

// Store for captured requests and responses
interface RequestRecord {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  response?: {
    status: number;
    statusText: string;
    body?: any;
    timestamp: number;
  };
  error?: {
    message: string;
    stack?: string;
  };
}

class FhirNetworkInterceptor {
  private enabled: boolean = false;
  private requests: RequestRecord[] = [];
  private maxRequests: number = 50; // Limit the number of stored requests to avoid memory issues
  private originalFetch: typeof fetch;

  constructor() {
    // Store the original fetch function based on environment
    this.originalFetch = typeof window !== "undefined" ? window.fetch : global.fetch;
  }

  /**
   * Enable the network interceptor
   */
  enable(): void {
    if (this.enabled) return;

    this.enabled = true;
    this.patchFetch();
    console.log('🔍 FHIR Network Interceptor enabled');
  }

  /**
   * Disable the network interceptor
   */
  disable(): void {
    if (!this.enabled) return;

    // Only restore window.fetch if in browser environment
    if (typeof window !== 'undefined') {
      window.fetch = this.originalFetch;
    }

    this.enabled = false;
    console.log('🔍 FHIR Network Interceptor disabled');
  }

  /**
   * Clear all captured requests
   */
  clearRequests(): void {
    this.requests = [];
    console.log('🔍 FHIR Network Interceptor requests cleared');
  }

  /**
   * Get all captured requests
   */
  getRequests(): RequestRecord[] {
    return [...this.requests];
  }

  /**
   * Get the last captured request
   */
  getLastRequest(): RequestRecord | undefined {
    return this.requests[this.requests.length - 1];
  }

  /**
   * Patch the global fetch function to intercept requests
   */
  private patchFetch(): void {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      console.log('🔍 FHIR Network Interceptor: Not patching fetch in server environment');
      return;
    }

    const self = this;

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      // Only intercept requests to the Medplum API
      const url = typeof input === 'string' ? input :
        input instanceof Request ? input.url :
          input.toString();

      // Check if this is a Medplum API request (includes both FHIR and non-FHIR endpoints)
      const isMedplumRequest = url.includes('localhost:8103');

      // Skip non-Medplum requests
      if (!isMedplumRequest) {
        return self.originalFetch.call(window, input, init);
      }

      // Add CORS handling for Medplum requests
      const corsInit = { ...init };
      if (!corsInit.headers) {
        corsInit.headers = {};
      }

      // Add necessary headers but avoid adding CORS headers on the client side
      // as these should be set by the server, not the client
      const corsHeaders = corsInit.headers as Record<string, string>;
      
      // Add content type if not present
      if (!corsHeaders['Content-Type']) {
        corsHeaders['Content-Type'] = 'application/json';
      }

      // Add origin header
      corsHeaders['Origin'] = window.location.origin;
      
      // Ensure credentials are included
      corsInit.credentials = 'include';

      // Set mode based on URL - use no-cors for healthcheck to avoid CORS issues
      if (url.includes('/healthcheck')) {
        corsInit.mode = 'no-cors';
        corsInit.cache = 'no-cache';
        corsInit.credentials = 'omit';
      } else {
        corsInit.mode = 'cors';
      }

      const method = init?.method || 'GET';
      const headers = init?.headers as Record<string, string> || {};
      const body = init?.body;

      // Create request record
      const request: RequestRecord = {
        url,
        method,
        headers,
        timestamp: Date.now()
      };
      
      // Safely handle the body based on its type
      if (body) {
        try {
          // Try to parse as JSON if it's a string that looks like JSON
          if (typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))) {
            request.body = JSON.parse(body);
          } else {
            // For form data or other formats, store as is
            request.body = body;
          }
        } catch (e) {
          // If parsing fails, store the raw body
          request.body = body;
          console.log('Could not parse request body as JSON:', body);
        }
      }

      // Log the request
      console.group(`🔍 FHIR Request: ${method} ${url}`);
      console.log('Headers:', headers);
      if (body) console.log('Body:', body);
      console.groupEnd();

      // Make the actual request with CORS settings
      // Use a try-catch to handle potential fetch errors
      try {
        // Use a safe approach to call fetch
        const fetchPromise = self.originalFetch.apply(window, [input, corsInit]);
        return fetchPromise.then(async (response) => {
          // Clone the response to avoid consuming it
          const clonedResponse = response.clone();
          let responseBody;

          // Check content type to determine how to handle the response
          const contentType = response.headers.get('content-type');
          
          try {
            if (contentType && contentType.includes('application/json')) {
              // Parse as JSON if content type is application/json
              responseBody = await clonedResponse.json();
            } else if (contentType && contentType.includes('text/')) {
              // Handle text responses
              responseBody = await clonedResponse.text();
            } else {
              // For other types, try JSON first, then fall back to text
              try {
                responseBody = await clonedResponse.json();
              } catch (jsonError) {
                try {
                  responseBody = await clonedResponse.text();
                } catch (textError) {
                  console.log('Could not parse response as JSON or text');
                }
              }
            }
          } catch (e) {
            console.log('Error processing response:', e);
            // Response could not be processed
          }

          // Update request record with response
          request.response = {
            status: response.status,
            statusText: response.statusText,
            body: responseBody,
            timestamp: Date.now()
          };

          // Log the response
          console.group(`🔍 FHIR Response: ${method} ${url} (${response.status})`);
          console.log('Status:', response.status, response.statusText);
          if (responseBody) console.log('Body:', responseBody);
          console.groupEnd();

          // Add to requests array, maintaining max size
          self.addRequest(request);

          return response;
        })
        .catch((error: Error) => {
          // Update request record with error
          request.error = {
            message: error.message,
            stack: error.stack
          };
          
          // Log the error
          console.group(`🔍 FHIR Error: ${method} ${url}`);
          console.error('Error:', error);
          console.groupEnd();
          
          // Add to requests array
          self.addRequest(request);
          
          // Re-throw the error to be handled by the caller
          throw error;
        });
      } catch (outerError) {
        console.error('Fetch error in interceptor:', outerError);
        // Record the failed request
        request.error = {
          message: outerError instanceof Error ? outerError.message : 'Unknown error',
          stack: outerError instanceof Error ? outerError.stack : undefined
        };
        self.addRequest(request);
        throw outerError;
      }
    };
  }

  /**
   * Add a request to the requests array, maintaining max size
   */
  private addRequest(request: RequestRecord): void {
    this.requests.push(request);

    // Trim the requests array if it exceeds the max size
    if (this.requests.length > this.maxRequests) {
      this.requests = this.requests.slice(-this.maxRequests);
    }
  }
}

// Create singleton instance
const fhirInterceptor = new FhirNetworkInterceptor();

/**
 * Add a healthcheck function to check server availability
 * This can be used to check if the Medplum server is available without CORS issues
 */
export async function checkMedplumServerHealth(): Promise<boolean> {
  console.log('Checking Medplum server health...');
  try {
    // Use a simple fetch with minimal headers to avoid CORS issues
    // The server should be configured to handle CORS properly
    const response = await fetch('http://localhost:8103/healthcheck', {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      }
    });

    // Check if the response is ok
    console.log('Medplum server healthcheck completed with status:', response.status);
    return response.ok;
  } catch (error) {
    console.error('Medplum server healthcheck failed:', error);
    return false;
  }
}

// Auto-enable in development mode, but only in browser environment
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Use requestAnimationFrame for browser-only code
  // This ensures the code only runs in the browser after the DOM is ready
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      fhirInterceptor.enable();
    });
  } else {
    // Fallback to setTimeout
    setTimeout(() => {
      fhirInterceptor.enable();
    }, 0);
  }
}

export default fhirInterceptor;
