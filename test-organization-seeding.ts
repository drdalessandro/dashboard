#!/usr/bin/env tsx

/**
 * Mali Healthcare Organizations Seeding Test Script
 * 
 * This script seeds comprehensive FHIR Organization resources for Mali's healthcare system
 * including Community Health Centers (CSCom), Referral Centers (CSRef), 
 * Regional Hospitals, and National Hospitals.
 * 
 * Usage:
 *   npm run seed:organizations
 *   npm run seed:organizations:help
 * 
 * Command line options:
 *   --token <token>           Use specific access token
 *   --email <email>           Use email authentication  
 *   --password <password>     Use password authentication
 *   --verify                  Verify seeding after completion
 *   --help                    Show this help message
 */

import { runOrganizationSeeding, verifyOrganizationSeeding } from './src/services/seeding/OrganizationUtils.js';

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options: any = {};
  let verify = false;
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--token':
        options.token = args[++i];
        break;
      case '--email':
        options.email = args[++i];
        break;
      case '--password':
        options.password = args[++i];
        break;
      case '--verify':
        verify = true;
        break;
      case '--help':
        showHelp = true;
        break;
    }
  }

  if (showHelp) {
    console.log(`
Mali Healthcare Organizations Seeding Script

This script creates comprehensive FHIR Organization resources for Mali's healthcare system:

🏥 National Hospitals (3):
   • Hôpital du Point G (Bamako)
   • Centre Hospitalier Universitaire Gabriel Touré (Bamako)  
   • Hôpital de Kati (Kati)

🏥 Regional Hospitals (7):
   • Sikasso, Ségou, Mopti, Tombouctou, Gao, Kayes, Koulikoro

🏥 Referral Centers - CSRef (8):
   • Bamako Communes I-VI, Koutiala, Bougouni

🏥 Community Health Centers - CSCom (12):
   • Banconi, Magnambougou, Sabalibougou, Kalaban Coro, and more

Usage:
  npm run seed:organizations                           # Use stored authentication
  npm run seed:organizations -- --token YOUR_TOKEN    # Use specific token
  npm run seed:organizations -- --verify              # Verify after seeding
  npm run seed:organizations -- --help                # Show this help

Authentication Options:
  --token <token>       Use specific access token
  --email <email>       Use email for authentication
  --password <password> Use password for authentication

Options:
  --verify             Verify organizations after seeding
  --help               Show this help message

Note: If no authentication is provided, the script will attempt to use stored authentication.
    `);
    return;
  }

  console.log('🇲🇱 Mali Healthcare Organizations Seeding Script');
  console.log('='.repeat(50));

  try {
    console.log('🏥 Creating comprehensive healthcare organization structure for Mali...\n');

    // Run the seeding
    const result = await runOrganizationSeeding(options);

    console.log('\n📋 Seeding Summary:');
    console.log(`   • Total Organizations: ${result.allOrganizations.length}`);
    console.log(`   • National Hospitals: ${result.nationalHospitals.length}`);
    console.log(`   • Regional Hospitals: ${result.regionalHospitals.length}`);
    console.log(`   • Referral Centers (CSRef): ${result.referralCenters.length}`);
    console.log(`   • Community Health Centers (CSCom): ${result.communityHealthCenters.length}`);

    // Verify if requested
    if (verify) {
      console.log('\n🔍 Running verification...');
      const verificationResult = await verifyOrganizationSeeding();
      
      if (verificationResult.total > 0) {
        console.log('✅ Verification passed - organizations are accessible');
      } else {
        console.log('⚠️ Verification found no organizations - check authentication');
      }
    }

    console.log('\n✅ Mali Healthcare Organizations seeding completed successfully!');
    console.log('   Organizations are now available for use in:');
    console.log('   • Patient registration (managing organization)');
    console.log('   • Practitioner employment');
    console.log('   • Encounter location tracking');
    console.log('   • Referral workflows');

  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    
    if (error.message?.includes('Authentication')) {
      console.log('\n🔑 Authentication Options:');
      console.log('   1. Login to the application first, then run: npm run seed:organizations');
      console.log('   2. Use a token: npm run seed:organizations -- --token YOUR_TOKEN');
      console.log('   3. Use email/password: npm run seed:organizations -- --email user@example.com --password password');
      console.log('\n💡 Get a token from the application after logging in');
    }
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
