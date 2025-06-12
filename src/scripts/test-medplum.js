// A simple script to test Medplum authentication and data retrieval
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fetch from 'node-fetch';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') });

// Get environment variables
const baseUrl = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL;
const clientId = process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID;
const clientSecret = process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_SECRET;

console.log('Environment variables:');
console.log('- Base URL:', baseUrl);
console.log('- Client ID:', clientId ? 'Set' : 'Not set');
console.log('- Client Secret:', clientSecret ? 'Set' : 'Not set');

if (!baseUrl || !clientId || !clientSecret) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function testMedplumAuth() {
  try {
    console.log('\nTesting Medplum authentication...');
    
    // First, check if the server is running
    console.log('Checking server health...');
    const healthResponse = await fetch(`${baseUrl}/healthcheck`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }
    const healthData = await healthResponse.json();
    console.log('Server health check successful:', healthData);
    
    // Authenticate using client credentials
    console.log('\nAuthenticating with client credentials...');
    const tokenUrl = `${baseUrl}/oauth2/token`;
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const tokenData = await response.json();
    console.log('Authentication successful!');
    console.log('- Token type:', tokenData.token_type);
    console.log('- Expires in:', tokenData.expires_in, 'seconds');
    console.log('- Has refresh token:', !!tokenData.refresh_token);
    
    // Test a simple patient search
    console.log('\nTesting patient search...');
    const searchResponse = await fetch(`${baseUrl}/fhir/R4/Patient?_count=10`, {
      headers: {
        'Authorization': `${tokenData.token_type} ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Patient search failed: ${searchResponse.status} ${searchResponse.statusText} - ${errorText}`);
    }
    
    const searchData = await searchResponse.json();
    console.log('Patient search successful!');
    console.log('- Total patients:', searchData.total || 0);
    console.log('- Entries returned:', searchData.entry?.length || 0);
    
    if (searchData.entry && searchData.entry.length > 0) {
      console.log('\nFirst patient details:');
      const patient = searchData.entry[0].resource;
      console.log('- ID:', patient.id);
      console.log('- Name:', patient.name?.[0]?.given?.join(' '), patient.name?.[0]?.family || 'Unnamed');
      console.log('- Gender:', patient.gender || 'Unknown');
      console.log('- Birth Date:', patient.birthDate || 'Unknown');
    } else {
      console.log('\nNo patients found in the system.');
    }
    
    return true;
  } catch (error) {
    console.error('\nError:', error.message);
    return false;
  }
}

// Run the test
testMedplumAuth().then(success => {
  console.log('\nTest completed:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
});
