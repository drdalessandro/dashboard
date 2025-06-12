#!/usr/bin/env tsx

/**
 * Script to query existing organizations from the database
 * This will help us get the actual organization IDs for the patient seeder
 */

import { medplumClient } from './src/lib/medplum/client.js';

async function queryExistingOrganizations() {
  console.log('🔍 Querying existing organizations from database...\n');

  try {
    // Query all organizations
    const organizations = await medplumClient.search('Organization', {
      _sort: 'name',
      _count: 100
    });

    console.log(`📊 Found ${organizations.length} organizations in database:\n`);

    const organizedResults = {
      national: [],
      regional: [],
      referral: [],
      community: [],
      other: []
    };

    // Organize organizations by type
    for (const org of organizations) {
      const orgInfo = {
        id: org.id,
        name: org.name,
        type: org.type?.[0]?.coding?.[0]?.display || 'Unknown',
        city: org.address?.[0]?.city || 'Unknown',
        identifier: org.identifier?.[0]?.value || 'No identifier'
      };

      if (org.identifier?.[0]?.value?.includes('HOSP-NAT')) {
        organizedResults.national.push(orgInfo);
      } else if (org.identifier?.[0]?.value?.includes('HOSP-REG')) {
        organizedResults.regional.push(orgInfo);
      } else if (org.identifier?.[0]?.value?.includes('CSREF')) {
        organizedResults.referral.push(orgInfo);
      } else if (org.identifier?.[0]?.value?.includes('CSCOM')) {
        organizedResults.community.push(orgInfo);
      } else {
        organizedResults.other.push(orgInfo);
      }
    }

    // Display results by category
    console.log('🏥 **NATIONAL HOSPITALS:**');
    organizedResults.national.forEach(org => {
      console.log(`   ID: ${org.id} | ${org.name} | ${org.city}`);
    });

    console.log('\n🏥 **REGIONAL HOSPITALS:**');
    organizedResults.regional.forEach(org => {
      console.log(`   ID: ${org.id} | ${org.name} | ${org.city}`);
    });

    console.log('\n🏥 **REFERRAL CENTERS:**');
    organizedResults.referral.forEach(org => {
      console.log(`   ID: ${org.id} | ${org.name} | ${org.city}`);
    });

    console.log('\n🏥 **COMMUNITY HEALTH CENTERS:**');
    organizedResults.community.forEach(org => {
      console.log(`   ID: ${org.id} | ${org.name} | ${org.city}`);
    });

    if (organizedResults.other.length > 0) {
      console.log('\n🏥 **OTHER ORGANIZATIONS:**');
      organizedResults.other.forEach(org => {
        console.log(`   ID: ${org.id} | ${org.name} | ${org.city}`);
      });
    }

    // Generate updated availableOrganizations array for patient seeder
    console.log('\n📋 **PATIENT SEEDER UPDATE:**');
    console.log('Copy this array to replace availableOrganizations in PatientsSeeder.ts:\n');
    
    const availableOrganizations = [];
    
    // Add best organizations for patient assignment
    organizedResults.national.slice(0, 2).forEach(org => {
      availableOrganizations.push({ id: org.id, name: org.name });
    });
    
    organizedResults.regional.slice(0, 2).forEach(org => {
      availableOrganizations.push({ id: org.id, name: org.name });
    });
    
    organizedResults.referral.slice(0, 2).forEach(org => {
      availableOrganizations.push({ id: org.id, name: org.name });
    });

    console.log('const availableOrganizations = [');
    availableOrganizations.forEach(org => {
      console.log(`  { id: '${org.id}', name: '${org.name}' },`);
    });
    console.log('];');

    return organizedResults;

  } catch (error: any) {
    if (error.message?.includes('401') || error.message?.includes('Authentication')) {
      console.error('❌ Authentication failed. Please ensure you are logged in to the healthcare platform.');
      console.log('\n💡 Solutions:');
      console.log('1. Login to the healthcare platform first');
      console.log('2. Run the organization seeder to create organizations');
      console.log('3. Provide authentication token if available');
    } else {
      console.error('❌ Error querying organizations:', error.message);
    }
    process.exit(1);
  }
}

// Run the query
queryExistingOrganizations()
  .then(() => {
    console.log('\n✅ Organization query completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to query organizations:', error);
    process.exit(1);
  });
