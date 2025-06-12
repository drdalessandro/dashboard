#!/usr/bin/env node

/**
 * Test script for Patient Clinical Data Seeding (ES Module version)
 * Usage: node test-patient-seeding.mjs [patientId]
 */

import { medplumClient } from './src/lib/medplum/client.js';
import { seedPatientClinicalData } from './src/services/seeding/PatientClinicalDataSeeder.js';

const DEFAULT_PATIENT_ID = '01970192-304e-723a-881f-ab29b1308594';

async function testPatientSeeding() {
  const patientId = process.argv[2] || DEFAULT_PATIENT_ID;
  
  console.log('🧪 Testing Patient Clinical Data Seeding');
  console.log(`📋 Patient ID: ${patientId}`);
  console.log('⏳ Starting seeding process...\n');

  try {
    // Check if medplum client is available
    if (!medplumClient) {
      throw new Error('Medplum client not available. Check your configuration.');
    }

    console.log('✅ Medplum client connected');
    
    // Run the seeding
    const result = await seedPatientClinicalData(medplumClient, patientId);
    
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
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
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