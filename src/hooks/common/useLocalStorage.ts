/**
 * useLocalStorage hook
 * Persistent storage hook optimized for offline-first healthcare applications
 */

import { useState, useEffect } from 'react';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

/**
 * React hook for persisting data in localStorage with type safety
 * Critical for offline-first functionality in areas with limited connectivity
 * 
 * @param key The localStorage key
 * @param initialValue The initial value (or function that returns it)
 * @returns A stateful value and a function to update it
 */
export function useLocalStorage<T>(
  key: string, 
  initialValue: T | (() => T)
): [T, SetValue<T>] {
  // Prefix keys to avoid collision with other applications
  const prefixedKey = `gandall_health_${key}`;
  
  // State to store our value
  // Pass initial state function to useState so logic only runs once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      // Return initial value when run in SSR
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(prefixedKey);
      
      // Parse stored json or return initialValue if nothing stored
      return item ? JSON.parse(item) : (
        typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
      );
    } catch (error) {
      // If error, return initialValue and log the error
      console.error(`Error reading localStorage key "${prefixedKey}":`, error);
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue: SetValue<T> = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function
          ? value(storedValue)
          : value;
          
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage (if we're in a browser environment)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(prefixedKey, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Handle errors gracefully
      console.error(`Error setting localStorage key "${prefixedKey}":`, error);
    }
  };

  // Listen for changes in other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== prefixedKey || e.newValue === null) return;
      
      try {
        setStoredValue(JSON.parse(e.newValue));
      } catch (error) {
        console.error(`Error parsing localStorage change for key "${prefixedKey}":`, error);
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [prefixedKey]);

  return [storedValue, setValue];
}
