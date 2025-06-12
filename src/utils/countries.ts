// Comprehensive list of countries following ISO 3166-1 alpha-2 codes
export const COUNTRIES = [
  { code: 'ML', name: 'Mali' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'GN', name: 'Guinea' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'NE', name: 'Niger' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  // Add more countries as needed, prioritizing Sub-Saharan African countries
].sort((a, b) => a.name.localeCompare(b.name));

// Phone country codes with calling codes
export const PHONE_COUNTRY_CODES = [
  { code: 'ML', name: 'Mali', callingCode: '+223' },
  { code: 'US', name: 'United States', callingCode: '+1' },
  { code: 'CA', name: 'Canada', callingCode: '+1' },
  { code: 'FR', name: 'France', callingCode: '+33' },
  { code: 'GB', name: 'United Kingdom', callingCode: '+44' },
  { code: 'SN', name: 'Senegal', callingCode: '+221' },
  { code: 'CI', name: 'Côte d\'Ivoire', callingCode: '+225' },
  { code: 'GN', name: 'Guinea', callingCode: '+224' },
  { code: 'BF', name: 'Burkina Faso', callingCode: '+226' },
  { code: 'NE', name: 'Niger', callingCode: '+227' },
  { code: 'DZ', name: 'Algeria', callingCode: '+213' },
  { code: 'MA', name: 'Morocco', callingCode: '+212' },
  { code: 'TN', name: 'Tunisia', callingCode: '+216' },
].sort((a, b) => a.name.localeCompare(b.name));
