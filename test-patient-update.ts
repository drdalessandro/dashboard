#!/usr/bin/env npx tsx

/**
 * Test script for updating a specific patient with enhanced values
 * 
 * Usage examples:
 * 1. Update patient with all enhancements:
 *    npx tsx test-patient-update.ts --id="01970192-304e-723a-881f-ab29b1308594"
 * 
 * 2. Update patient with specific enhancements only:
 *    npx tsx test-patient-update.ts --id="01970192-304e-723a-881f-ab29b1308594" --contacts-only
 * 
 * 3. Update patient with custom options:
 *    npx tsx test-patient-update.ts --id="01970192-304e-723a-881f-ab29b1308594" --no-demographics
 * 
 * 4. Show help:
 *    npx tsx test-patient-update.ts --help
 */

import { medplumClient } from './src/lib/medplum/client';
import { seedPatientsWithAuth, updatePatientWithEnhancedValues } from './src/scripts/PatientsSeeder';

// Command line argument parsing
const args = process.argv.slice(2);
const getArg = (name: string) => {
  const arg = args.find(arg => arg.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};
const hasFlag = (name: string) => args.includes(`--${name}`);

function showHelp() {
  console.log(`
🏥 Patient Update Tool - Enhanced Values

This tool updates an existing patient with enhanced FHIR values including:
• Contact parties (guardian, partner, friend)
• General practitioner assignments  
• Managing organization assignments
• Enhanced demographic information

USAGE:
  npx tsx test-patient-update.ts --id="PATIENT_ID" [options]

REQUIRED:
  --id="PATIENT_ID"           Patient ID to update

OPTIONS:
  --contacts-only             Only add contact parties
  --practitioner-only         Only assign general practitioner
  --organization-only         Only assign managing organization
  --demographics-only         Only update demographics
  --no-contacts              Skip adding contact parties
  --no-practitioner          Skip assigning general practitioner
  --no-organization          Skip assigning managing organization
  --no-demographics          Skip updating demographics (default)
  --token="TOKEN"             Medplum access token
  --help                      Show this help message

EXAMPLES:
  # Update patient with all enhancements
  npx tsx test-patient-update.ts --id="01970192-304e-723a-881f-ab29b1308594"

  # Only add contact parties
  npx tsx test-patient-update.ts --id="01970192-304e-723a-881f-ab29b1308594" --contacts-only

  # Add everything except demographics
  npx tsx test-patient-update.ts --id="01970192-304e-723a-881f-ab29b1308594" --no-demographics

  # Use specific token
  npx tsx test-patient-update.ts --id="01970192-304e-723a-881f-ab29b1308594" --token="your-token"

NOTE: Authentication will attempt multiple methods:
1. Provided token (--token)
2. Stored authentication from login
3. Environment variables
4. Client credentials

Make sure your Medplum server is running and you have proper authentication.
`);
}

async function main() {
  try {
    // Show help if requested
    if (hasFlag('help') || hasFlag('h')) {
      showHelp();
      process.exit(0);
    }

    // Get patient ID
    const patientId = getArg('id');
    if (!patientId) {
      console.error('❌ Error: Patient ID is required');
      console.log('Use --id="PATIENT_ID" to specify the patient to update');
      console.log('Use --help for full usage information');
      process.exit(1);
    }

    console.log('🏥 Patient Update Tool - Enhanced Values');
    console.log('=====================================');
    console.log(`🎯 Target Patient ID: ${patientId}`);

    // Parse options
    const updateOptions = {
      addContacts: true,
      assignPractitioner: true, 
      assignOrganization: true,
      updateDemographics: false // Default: preserve existing demographics
    };

    // Handle specific-only flags
    if (hasFlag('contacts-only')) {
      updateOptions.addContacts = true;
      updateOptions.assignPractitioner = false;
      updateOptions.assignOrganization = false;
      updateOptions.updateDemographics = false;
    } else if (hasFlag('practitioner-only')) {
      updateOptions.addContacts = false;
      updateOptions.assignPractitioner = true;
      updateOptions.assignOrganization = false;
      updateOptions.updateDemographics = false;
    } else if (hasFlag('organization-only')) {
      updateOptions.addContacts = false;
      updateOptions.assignPractitioner = false;
      updateOptions.assignOrganization = true;
      updateOptions.updateDemographics = false;
    } else if (hasFlag('demographics-only')) {
      updateOptions.addContacts = false;
      updateOptions.assignPractitioner = false;
      updateOptions.assignOrganization = false;
      updateOptions.updateDemographics = true;
    } else {
      // Handle no- flags
      if (hasFlag('no-contacts')) updateOptions.addContacts = false;
      if (hasFlag('no-practitioner')) updateOptions.assignPractitioner = false;
      if (hasFlag('no-organization')) updateOptions.assignOrganization = false;
      if (hasFlag('no-demographics')) updateOptions.updateDemographics = false;
    }

    console.log('⚙️  Update Options:');
    console.log(`   👥 Add Contact Parties: ${updateOptions.addContacts ? '✅' : '❌'}`);
    console.log(`   👨‍⚕️ Assign Practitioner: ${updateOptions.assignPractitioner ? '✅' : '❌'}`);
    console.log(`   🏢 Assign Organization: ${updateOptions.assignOrganization ? '✅' : '❌'}`);
    console.log(`   📊 Update Demographics: ${updateOptions.updateDemographics ? '✅' : '❌'}`);
    console.log('');

    // Prepare authentication options
    const authOptions: any = {
      updatePatientId: patientId,
      updateOptions
    };

    const token = getArg('token');
    if (token) {
      authOptions.token = token;
      console.log('🔐 Using provided authentication token');
    } else {
      console.log('🔐 Using automatic authentication detection');
    }

    // Execute the update
    console.log('🚀 Starting patient update...\n');

    const result = await seedPatientsWithAuth(medplumClient, authOptions);

    // Display results
    console.log('\n📋 Update Results:');
    console.log('=================');

    if (result.updated) {
      if (result.updated.success) {
        console.log('✅ Update Status: SUCCESS');
        console.log(`👤 Patient: ${result.updated.patientName || 'Unknown'}`);
        console.log(`🆔 Patient ID: ${result.updated.patientId}`);
        
        if (result.updated.enhancements && result.updated.enhancements.length > 0) {
          console.log(`📈 Enhancements Applied: ${result.updated.enhancements.join(', ')}`);
        } else {
          console.log('ℹ️  No new enhancements needed (patient already has requested values)');
        }
      } else {
        console.log('❌ Update Status: FAILED');
        console.log(`🆔 Patient ID: ${result.updated.patientId}`);
        console.log(`💥 Error: ${result.updated.error}`);
      }
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors Encountered:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.error}`);
      });
    }

    console.log('\n🎉 Patient update process completed!');
    console.log('\nNext steps:');
    console.log('• View the updated patient in the healthcare platform');
    console.log('• Verify that the enhanced fields are displaying correctly');
    console.log('• Check that FHIR compliance is maintained');

  } catch (error: any) {
    console.error('\n💥 Fatal Error:', error.message);
    
    if (error.message.includes('Authentication')) {
      console.log('\n🔧 Authentication Help:');
      console.log('• Make sure your Medplum server is running');
      console.log('• Login to the healthcare platform first, or');
      console.log('• Provide a valid token with --token="your-token"');
      console.log('• Check your environment variables');
    }
    
    console.log('\nUse --help for full usage information');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Update process interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Update process terminated');
  process.exit(0);
});

// Execute main function
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
