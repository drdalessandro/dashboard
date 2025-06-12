// config.js
module.exports = {
  // Medplum configuration
  MEDPLUM_BASE_URL: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103',
  MEDPLUM_CLIENT_ID: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || 'gandall-healthcare-app',
  MEDPLUM_PROJECT_ID: process.env.NEXT_PUBLIC_MEDPLUM_PROJECT_ID || 'gandall-healthcare-project',
  
  // App configuration
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  ENABLE_OFFLINE_MODE: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
};
