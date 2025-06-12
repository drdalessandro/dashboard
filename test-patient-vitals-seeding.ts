// Test script for patient vitals seeding (TypeScript version)
// File: test-patient-vitals-seeding.ts

import { runPatientVitalsSeeding } from './src/services/seeding/PatientVitalsUtils';

// Configuration
const PATIENT_ID = '01970192-304e-723a-881f-ab29b1308594';

// Parse command line arguments
const args = process.argv.slice(2);
const token = args.find(arg => arg.startsWith('--token='))?.split('=')[1];
const email = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
const password = args.find(arg => arg.startsWith('--password='))?.split('=')[1];
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
🩺 Patient Vitals Seeding Test Script

Usage:
  npm run seed:vitals
  npm run seed:vitals -- --token=YOUR_TOKEN
  npm run seed:vitals -- --email=user@example.com --password=password

Options:
  --token=TOKEN      Use specific access token
  --email=EMAIL      Login with email
  --password=PASS    Login with password
  --help, -h         Show this help message

Examples:
  npm run seed:vitals
  npm run seed:vitals -- --token=eyJ0eXAiOiJKV1Q...
  npm run seed:vitals -- --email=doctor@clinic.com --password=mypassword

Environment Variables:
  NEXT_PUBLIC_MEDPLUM_BASE_URL     Medplum server URL (default: http://localhost:8103)
  NEXT_PUBLIC_MEDPLUM_CLIENT_ID    Medplum client ID
  NEXT_PUBLIC_MEDPLUM_CLIENT_SECRET Medplum client secret (optional)
  `);
  process.exit(0);
}

async function main() {
  console.log('🩺 Testing Patient Vitals Seeding');
  console.log('================================');
  console.log(`Patient ID: ${PATIENT_ID}`);
  console.log(`Base URL: ${process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103'}`);
  console.log('');

  try {
    const options: any = {};
    
    if (token) {
      console.log('🔐 Using provided token');
      options.token = token;
    } else if (email && password) {
      console.log('📧 Using email/password authentication');
      options.email = email;
      options.password = password;
    } else {
      console.log('🔄 Using stored authentication or environment credentials');
    }

    const result = await runPatientVitalsSeeding(PATIENT_ID, options);

    console.log('');
    console.log('✅ Vitals seeding completed successfully!');
    console.log('📊 Created resources:');
    console.log(`   • Blood Pressure observations: ${result.bloodPressure.length}`);
    console.log(`   • Heart Rate: ${result.heartRate.id}`);
    console.log(`   • Glucose: ${result.glucose.id}`);
    console.log(`   • Cholesterol: ${result.cholesterol.id}`);
    console.log(`   • Body Weight: ${result.bodyWeight.id}`);
    console.log('');
    console.log('🎉 All vitals data has been created in the FHIR server!');

  } catch (error: any) {
    console.error('');
    console.error('❌ Vitals seeding failed:');
    console.error(error.message);
    
    if (error.message?.includes('Authentication')) {
      console.error('');
      console.error('💡 Try these solutions:');
      console.error('• Login to the application first');
      console.error('• Provide a valid token: npm run seed:vitals -- --token=YOUR_TOKEN');
      console.error('• Use email/password: npm run seed:vitals -- --email=user@example.com --password=pass');
    }
    
    process.exit(1);
  }
}

main().catch(console.error);
