import { NextResponse } from 'next/server';
import axios from 'axios';

// Cache to prevent duplicate requests
const requestCache = new Map();
// Cache TTL in milliseconds (30 minutes for detailed data as it changes less frequently)
const CACHE_TTL = 30 * 60 * 1000;

// This handler manages RxNorm API proxy calls for path-based routes (e.g., /rxcui/{rxcui}/allrelated)
export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    // Validate path parameter - must await params first
    const path = await params.path;

    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Build the RxNorm API URL
    const baseUrl = 'https://rxnav.nlm.nih.gov/REST';
    const apiPath = path.join('/');
    const apiUrl = `${baseUrl}/${apiPath}`;

    // Create a cache key from the request path
    const cacheKey = apiUrl;

    // Check if we have a cached response
    if (requestCache.has(cacheKey)) {
      const { data, timestamp } = requestCache.get(cacheKey);
      const now = Date.now();

      // Return cached data if it's still fresh
      if (now - timestamp < CACHE_TTL) {
        console.log(`Returning cached RxNorm API response for: ${cacheKey}`);
        return NextResponse.json(data);
      } else {
        // Remove stale cache entry
        requestCache.delete(cacheKey);
      }
    }

    console.log(`Making RxNorm API path request to: ${apiUrl}`);

    // Make the request to RxNorm API with a timeout
    const response = await axios.get(apiUrl, {
      timeout: 5000 // 5 second timeout
    });

    // Cache the response
    requestCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });

    // Return the response data
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('RxNorm API proxy error:', error.message);

    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: 'Request to RxNorm API timed out', message: error.message },
        { status: 504 }
      );
    }

    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        {
          error: 'RxNorm API returned an error',
          status: error.response.status,
          message: error.message
        },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch data from RxNorm API', message: error.message },
      { status: 500 }
    );
  }
}