import { NextResponse } from 'next/server';
import axios from 'axios';

// Cache to prevent duplicate requests
const requestCache = new Map();
// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// This handler manages RxNorm API proxy calls for the main endpoint
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get name parameter - this is required
    const name = searchParams.get('name');
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Name parameter is required and must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    // Build the RxNorm API URL
    const baseUrl = 'https://rxnav.nlm.nih.gov/REST';
    let apiUrl = `${baseUrl}/drugs`;
    
    // Add parameters from the original request
    const params = new URLSearchParams();
    params.append('name', name);
    
    // Always include search=1 parameter
    params.append('search', '1');
    
    // Copy other parameters
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'name' && value) {
        params.append(key, value);
      }
    }
    
    // Create a cache key from the request parameters
    const cacheKey = `${apiUrl}?${params.toString()}`;
    
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
    
    console.log(`Making RxNorm API request to: ${apiUrl}?${params.toString()}`);
    
    // Make the request to RxNorm API with a timeout
    const response = await axios.get(`${apiUrl}?${params.toString()}`, {
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