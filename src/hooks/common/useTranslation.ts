/**
 * useTranslation hook
 * Custom multilingual support for French and English
 * Created specifically for healthcare context in Mali and Sub-Saharan Africa
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { supportedLocales, defaultLocale } from '../../config/environment';

// Type for translation key structure
type TranslationKey = string;

// Locale type that ensures we only use supported locales
type Locale = typeof supportedLocales[number];

interface TranslationHookReturn {
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: Locale[];
}

/**
 * Get the current language setting
 * Provides access to the active language outside of React components
 * 
 * @returns Current language code (e.g., 'en' or 'fr')
 */
export function getLanguage(): Locale {
  // Get from localStorage if available
  if (typeof window !== 'undefined') {
    const storedLocale = localStorage.getItem('locale');
    if (storedLocale && supportedLocales.includes(storedLocale as Locale)) {
      return storedLocale as Locale;
    }
    
    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    if (supportedLocales.includes(browserLang as Locale)) {
      return browserLang as Locale;
    }
  }
  
  // Final fallback to default locale
  return defaultLocale as Locale;
}

/**
 * Custom translation hook for healthcare platform
 * Supports French and English localization with fallbacks
 * Optimized for offline use with localStorage caching
 * 
 * @returns Translation functions and locale information
 */
export function useTranslation(): TranslationHookReturn {
  // Get current locale from localStorage (with fallback to default)
  const [locale, setLocaleState] = useLocalStorage<Locale>(
    'locale', 
    () => {
      // Try to detect browser language first
      if (typeof window !== 'undefined') {
        const browserLang = navigator.language.split('-')[0];
        
        // Check if browser language is supported
        if (supportedLocales.includes(browserLang as Locale)) {
          return browserLang as Locale;
        }
      }
      
      // Fallback to default locale from environment config
      return defaultLocale as Locale;
    }
  );
  
  // Store translation dictionaries
  const [translations, setTranslations] = useState<Record<Locale, Record<string, string>>>({} as any);
  const [loading, setLoading] = useState<boolean>(true);

  // Load translations for current locale
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setLoading(true);
        
        // Check if we already have this locale loaded
        if (translations[locale]) {
          setLoading(false);
          return;
        }
        
        // Load translations - using dynamic import for code splitting
        const localeData = await import(`../../locales/${locale}.json`);
        
        setTranslations(prev => ({
          ...prev,
          [locale]: localeData.default
        }));
        
        // Store in localStorage for offline use
        if (typeof window !== 'undefined') {
          localStorage.setItem(`gandall_health_translations_${locale}`, JSON.stringify(localeData.default));
        }
      } catch (error) {
        console.error(`Failed to load translations for locale: ${locale}`, error);
        
        // Try to load from localStorage as fallback (for offline mode)
        if (typeof window !== 'undefined') {
          const cachedTranslations = localStorage.getItem(`gandall_health_translations_${locale}`);
          
          if (cachedTranslations) {
            try {
              setTranslations(prev => ({
                ...prev,
                [locale]: JSON.parse(cachedTranslations)
              }));
            } catch (e) {
              console.error('Failed to parse cached translations', e);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadTranslations();
  }, [locale]);
  
  // Translation function
  const t = useCallback((key: TranslationKey, params?: Record<string, string>): string => {
    if (loading || !translations[locale]) {
      return key; // Return key when translations are loading
    }
    
    // Get translated text or fallback to key
    let text = translations[locale][key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), value);
      });
    }
    
    return text;
  }, [locale, translations, loading]);
  
  // Set locale function - validates that it's a supported locale
  const setLocale = useCallback((newLocale: Locale) => {
    if (supportedLocales.includes(newLocale)) {
      setLocaleState(newLocale);
    } else {
      console.warn(`Locale ${newLocale} is not supported. Using default locale instead.`);
      setLocaleState(defaultLocale as Locale);
    }
  }, [setLocaleState]);
  
  return {
    t,
    locale,
    setLocale,
    availableLocales: supportedLocales as Locale[]
  };
}
