import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { InitOptions } from 'i18next';
import { createLogger } from "./logger";

const logger = createLogger('i18n');

// Healthcare-specific translation configuration
const i18nOptions: InitOptions = {
  debug: process.env.NODE_ENV === 'development',

  // Multilingual support for Sub-Saharan Africa
  lng: 'en',
  fallbackLng: ['en', 'fr'],
  supportedLngs: ['en', 'fr'],

  // Healthcare-specific namespaces
  ns: [
    'common',
    'patient',
    'practitioner',
    'dashboard',
    'navigation',
    'network',
    'prescription'
  ],
  defaultNS: 'common', // Change default namespace to 'common' for shared components

  // Backend configuration with offline-first approach
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    queryStringParams: { v: Date.now() }, // Prevent caching during development
  },

  // Interpolation settings for medical context
  interpolation: {
    escapeValue: false, // React already escapes values
    format: (value, format) => {
      // Custom formatting for medical values
      if (format === 'medical') {
        return value.toString().toUpperCase();
      }
      return value;
    }
  },

  // React-specific settings
  react: {
    useSuspense: false,
    transSupportBasicHtmlNodes: true,
  },

  // Missing key handling
  saveMissing: true,
  missingKeyHandler: (
    lngs: readonly string[],
    ns: string,
    key: string
  ) => {
    // Extract filename from the stack trace
    const stackLines = new Error().stack?.split('\n') || [];
    const fileLineMatch = stackLines.find(line => line.includes('.tsx') || line.includes('.ts'));
    const fileName = fileLineMatch
      ? fileLineMatch.match(/([^/]+\.(tsx|ts))/)?.at(1)
      : 'Unknown File';

    logger.warn(`Missing healthcare translation key: ${key} in namespace: ${ns} for language: ${lngs[0]} (File: ${fileName})`);
    return key; // Return the key as a fallback for critical healthcare information
  },

  // Fallback and return behaviors
  returnNull: false,
  returnEmptyString: false,

  // Language detection with medical context
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
    lookupLocalStorage: 'gandall_language',
  }
};

// Comprehensive initialization function with detailed error tracking
const initializeI18n = async () => {
  try {
    logger.info('Starting Gandall Healthcare i18n initialization');

    if (!i18n.isInitialized) {
      await i18n
        .use(Backend)
        .use(LanguageDetector)
        .use(initReactI18next)
        .init(i18nOptions);
    }

    logger.info('Gandall Healthcare i18n initialized successfully');

    return i18n;
  } catch (error) {
    logger.error('Gandall Healthcare i18n initialization failed:', error);

    if (!i18n.isInitialized) {
      await i18n.init({
        lng: 'en',
        fallbackLng: ['en', 'fr'],
        ns: ['common', 'patient', 'practitioner'],
        defaultNS: 'common',
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      });
    }

    throw error;
  }
};

const i18nInitPromise = initializeI18n().catch(error => {
  logger.error('Unhandled Gandall Healthcare i18n initialization error:', error);
});

// Export initialized instance and promise
export default i18n;
export {
  initializeI18n,
  i18nInitPromise
};