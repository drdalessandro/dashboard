#!/usr/bin/env tsx

/**
 * Medplum Server Connection Test Script
 * 
 * This script tests connectivity and authentication with the Medplum server
 * to help troubleshoot organization seeding issues.
 */

import { medplumClient } from './src/lib/medplum/client.js';

async function testConnection() {
  console.log('🔍 Medplum Server Connection Test');
  console.log('================================');
  
  // Test 1: Basic server connectivity
  console.log('\n1. Testing server connectivity...');
  try {
    const response = await fetch('http://localhost:8103/fhir/R4/metadata');
    if (response.ok) {
      console.log('✅ Medplum server is running and accessible');
      const metadata = await response.json();
      console.log(`   Server: ${metadata.software?.name || 'Unknown'} ${metadata.software?.version || ''}`);
    } else {
      console.log(`❌ Server responded with status: ${response.status}`);
      return;
    }
  } catch (error: any) {
    console.log(`❌ Cannot connect to server: ${error.message}`);
    console.log('   Make sure Medplum server is running on http://localhost:8103');
    return;
  }

  // Test 2: Check client configuration
  console.log('\n2. Checking client configuration...');
  console.log(`   Base URL: ${medplumClient?.getBaseUrl() || 'Not configured'}`);
  console.log(`   Client ID: ${process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || 'Not set'}`);
  
  // Test 3: Test authentication status
  console.log('\n3. Testing authentication...');
  const existingToken = medplumClient?.getAccessToken();
  if (existingToken) {
    console.log('✅ Access token found in client');
    console.log(`   Token preview: ${existingToken.substring(0, 20)}...`);
    
    try {
      const result = await medplumClient.search('Organization', { _count: 1 });
      console.log('✅ Authentication successful');
      console.log(`   Found ${result.length} organizations`);
    } catch (error: any) {
      console.log(`❌ Authentication failed: ${error.message}`);
    }
  } else {
    console.log('⚠️  No access token found');
    console.log('   You need to authenticate first');
  }

  // Test 4: Provide guidance
  console.log('\n4. How to get a valid token:');
  console.log('   a) Login to your Medplum application in the browser');
  console.log('   b) Open browser developer tools (F12)');
  console.log('   c) Go to Application/Storage → Local Storage');
  console.log('   d) Look for "medplum.access_token" or similar');
  console.log('   e) Copy the token value');
  console.log('   f) Use: npm run seed:organizations -- --token COPIED_TOKEN');
  
  console.log('\n5. Alternative: Use email/password:');
  console.log('   npm run seed:organizations -- --email your-email@example.com --password your-password');
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the test
testConnection().catch((error) => {
  console.error('❌ Connection test failed:', error);
  process.exit(1);
});
