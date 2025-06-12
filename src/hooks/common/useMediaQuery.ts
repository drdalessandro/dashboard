/**
 * useMediaQuery hook
 * Responsive design hook for healthcare platform UI
 */

import { useState, useEffect } from 'react';

/**
 * React hook for responsive design and adaptive layouts
 * Supports various device types common in Sub-Saharan Africa
 * 
 * @param query CSS media query string
 * @returns Boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Skip for SSR environment
    if (typeof window === 'undefined') return;
    
    // Create media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Define listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener with modern API if available, fallback for older browsers
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      // Fallback for older browsers (mainly for support in low-end devices)
      mediaQuery.addListener(handleChange);
      return () => {
        mediaQuery.removeListener(handleChange);
      };
    }
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoints for consistent responsive design
 */
export const breakpoints = {
  xs: '(max-width: 575px)',
  sm: '(min-width: 576px) and (max-width: 767px)',
  md: '(min-width: 768px) and (max-width: 991px)',
  lg: '(min-width: 992px) and (max-width: 1199px)',
  xl: '(min-width: 1200px)',
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 991px)',
  desktop: '(min-width: 992px)',
  touchDevice: '(hover: none) and (pointer: coarse)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',
};
