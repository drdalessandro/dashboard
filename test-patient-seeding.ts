#!/usr/bin/env tsx

/**
 * Test script for Patient Clinical Data Seeding with Enhanced Authentication
 * Usage: 
 *   tsx test-patient-seeding.ts [patientId] [token]
 *   tsx test-patient-seeding.ts --help
 * 
 * Examples:
 *   tsx test-patient-seeding.ts
 *   tsx test-patient-seeding.ts 01970192-304e-723a-881f-ab29b1308594
 *   tsx test-patient-seeding.ts 01970192-304e-723a-881f-ab29b1308594 your-token-here
 *   tsx test-patient-seeding.ts --token=your-token-here
 */

import { medplumClient } from './src/lib/medplum/client.js';
import { seedPatientClinicalDataWithAuth } from './src/services/seeding/PatientClinicalDataSeeder.js';

const DEFAULT_PATIENT_ID = '01970192-304e-723a-881f-ab29b1308594';

function showHelp() {
  console.log(`
🏥 Patient Clinical Data Seeding Tool

USAGE:
  tsx test-patient-seeding.ts [patientId] [token]
  tsx test-patient-seeding.ts [options]

OPTIONS:
  --help                    Show this help message
  --token=TOKEN            Use specific authentication token
  --patient=PATIENT_ID     Use specific patient ID
  --use-stored             Use stored authentication (default: true)

EXAMPLES:
  # Use default patient ID with stored authentication
  tsx test-patient-seeding.ts

  # Use specific patient ID
  tsx test-patient-seeding.ts 01970192-304e-723a-881f-ab29b1308594

  # Use specific token
  tsx test-patient-seeding.ts --token=your-access-token-here

  # Use specific patient and token
  tsx test-patient-seeding.ts 01970192-304e-723a-881f-ab29b1308594 your-token-here

AUTHENTICATION METHODS:
  1. Provided token (--token or second argument)
  2. Stored authentication from application login
  3. Client credentials (if configured in environment)

NOTE: You can get a token by logging into the application and running:
      localStorage.getItem('medplum.access_token')
`);
}

function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  let patientId = DEFAULT_PATIENT_ID;
  let token: string | undefined;
  let useStoredAuth = true;

  // Parse named arguments
  for (const arg of args) {
    if (arg.startsWith('--token=')) {
      token = arg.substring(8);
    } else if (arg.startsWith('--patient=')) {
      patientId = arg.substring(10);
    } else if (arg === '--no-stored') {
      useStoredAuth = false;
    } else if (!arg.startsWith('--')) {
      // Positional arguments
      if (!args[0]?.startsWith('--')) {
        patientId = args[0] || DEFAULT_PATIENT_ID;
      }
      if (!args[1]?.startsWith('--')) {
        token = args[1];
      }
    }
  }

  return { patientId, token, useStoredAuth };
}

async function testPatientSeeding() {
  const { patientId, token, useStoredAuth } = parseArguments();
  
  console.log('🧪 Testing Patient Clinical Data Seeding');
  console.log(`📋 Patient ID: ${patientId}`);
  
  if (token) {
    console.log('🔐 Using provided authentication token');
  } else if (useStoredAuth) {
    console.log('🔄 Attempting to use stored authentication');
  }
  
  console.log('⏳ Starting seeding process...\n');

  try {
    // Check if medplum client is available
    if (!medplumClient) {
      throw new Error('Medplum client not available. Check your configuration.');
    }

    console.log('✅ Medplum client initialized');
    
    // Run the seeding with enhanced authentication
    const result = await seedPatientClinicalDataWithAuth(medplumClient, patientId, {
      token,
      useStoredAuth
    });
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Allergies: ${result.allergies.length}`);
    console.log(`   • Immunizations: ${result.immunizations.length}`);
    console.log(`   • Conditions: ${result.conditions.length}`);
    console.log(`   • Medications: ${result.medications.length}`);
    
    console.log('\n📋 Created Resource IDs:');
    result.allergies.forEach((item, i) => console.log(`   AllergyIntolerance ${i + 1}: ${item.id}`));
    result.immunizations.forEach((item, i) => console.log(`   Immunization ${i + 1}: ${item.id}`));
    result.conditions.forEach((item, i) => console.log(`   Condition ${i + 1}: ${item.id}`));
    result.medications.forEach((item, i) => console.log(`   MedicationRequest ${i + 1}: ${item.id}`));
    
    console.log('\n✅ Test completed successfully!');
    return result;
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message?.includes('Authentication') || error.message?.includes('Unauthorized')) {
      console.error(`
💡 Authentication Solutions:

1. 📱 Login to the application first, then run:
   tsx test-patient-seeding.ts

2. 🔑 Use a specific token:
   tsx test-patient-seeding.ts --token=your-access-token

3. 🌐 Get token from browser after login:
   Open browser console and run: localStorage.getItem('medplum.access_token')
   Then use: tsx test-patient-seeding.ts --token=<copied-token>

4. ⚙️  For development, ensure MEDPLUM_CLIENT_SECRET is set in .env.local
`);
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPatientSeeding()
    .then(() => {
      console.log('\n🏁 Test script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}

export { testPatientSeeding };