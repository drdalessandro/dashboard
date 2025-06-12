/**
 * useDebounce hook
 * Debounce a value to prevent excessive renders or API calls
 * Important for low-bandwidth environments in Sub-Saharan Africa
 */

import { useState, useEffect } from 'react';

/**
 * Creates a debounced value that only updates after a specified delay
 * Useful for search inputs, form validation, and other real-time updates
 * Optimized for low-connectivity environments
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timeout if the value changes before the delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
