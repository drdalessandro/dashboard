// src/core/utils/translationUtils.ts
import i18n from 'i18next';
import { storageService } from '../services/storageService';

/**
 * Utility functions for handling translations with offline-first capabilities
 */
export const translationUtils = {
  /**
   * Set up application languages 
   * @param defaultLanguage Default language to use (e.g. 'en')
   * @param languages Array of supported language codes
   */
  setupLanguages(defaultLanguage: string = 'en', languages: string[] = ['en', 'fr']): void {
    // Read preferred language from storage or use default
    const userPreferredLanguage = storageService.getData<string>('user_language') || 
                                 localStorage.getItem('preferredLanguage') ||
                                 navigator.language.split('-')[0];
    
    const finalLanguage = languages.includes(userPreferredLanguage) 
      ? userPreferredLanguage 
      : defaultLanguage;
    
    // Set language if initialized
    if (i18n.isInitialized) {
      i18n.changeLanguage(finalLanguage);
    }
    
    // Store in localStorage for persistence
    storageService.saveData('user_language', finalLanguage);
  },
  
  /**
   * Change the current language
   * @param languageCode New language code (e.g. 'fr')
   */
  async changeLanguage(languageCode: string): Promise<void> {
    // Store in localStorage for persistence
    storageService.saveData('user_language', languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
    
    // Change i18n language and await the result
    // Using void to explicitly discard the return value
    await i18n.changeLanguage(languageCode);
    return;
  },
  
  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return i18n.language;
  },
  
  /**
   * Store translations for offline use
   * @param namespace Translation namespace
   * @param language Language code
   * @param translations Translation object
   */
  storeOfflineTranslations(
    namespace: string, 
    language: string, 
    translations: Record<string, any>
  ): void {
    storageService.saveNamespacedData(
      'translations', 
      `${namespace}_${language}`, 
      translations
    );
  },
  
  /**
   * Get translations for offline use
   * @param namespace Translation namespace
   * @param language Language code
   */
  getOfflineTranslations(
    namespace: string, 
    language: string
  ): Record<string, any> | null {
    return storageService.getNamespacedData<Record<string, any>>(
      'translations', 
      `${namespace}_${language}`
    );
  },
  
  /**
   * Check if translations are available offline
   * @param namespace Translation namespace
   * @param language Language code
   */
  hasOfflineTranslations(namespace: string, language: string): boolean {
    return storageService.hasValidData(`translations:${namespace}_${language}`);
  },
  
  /**
   * Get translation with fallback
   * Useful when you need a translation that might not be available
   * @param key Translation key
   * @param defaultValue Fallback value if translation is not found
   * @param options Translation options
   */
  getTranslation(
    key: string, 
    defaultValue: string, 
    options?: Record<string, unknown>
  ): string {
    const translation = i18n.t(key, { ...options, defaultValue });
    
    // If translation is the same as the key, it means it wasn't found
    // In that case, return the default value
    return translation === key ? defaultValue : translation;
  }
};
