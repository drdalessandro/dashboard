// Simple script to debug Medplum authentication
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const baseUrl = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'https://api.medplum.com';
const clientId = process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID;
const clientSecret = process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_SECRET;

console.log('Debugging Medplum Authentication');
console.log('==============================');
console.log('Environment Variables:');
console.log(`Base URL: ${baseUrl}`);
console.log(`Client ID: ${clientId ? 'Set' : 'Not set'}`);
console.log(`Client Secret: ${clientSecret ? 'Set' : 'Not set'}`);
console.log('==============================');

// Check if we can make a basic request to the Medplum server
console.log(`Testing connection to ${baseUrl}/healthcheck...`);
fetch(`${baseUrl}/healthcheck`)
  .then(response => {
    console.log(`Server health check: ${response.status} ${response.statusText}`);
    return response.text();
  })
  .then(text => {
    console.log('Response:', text);
    
    // If server is up, try to authenticate
    if (clientId && clientSecret) {
      console.log('\nAttempting to authenticate with client credentials...');
      
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      
      return fetch(`${baseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
    }
  })
  .then(response => {
    if (!response) return;
    console.log(`Authentication response: ${response.status} ${response.statusText}`);
    return response.json();
  })
  .then(tokenData => {
    if (!tokenData) return;
    console.log('Authentication successful!');
    console.log('Token expires in:', tokenData.expires_in, 'seconds');
    console.log('Access token:', tokenData.access_token ? tokenData.access_token.substring(0, 20) + '...' : 'None');
    
    // Try to make an authenticated request
    return fetch(`${baseUrl}/fhir/R4/Patient?_count=1`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
  })
  .then(response => {
    if (!response) return;
    console.log(`\nTest Patient search: ${response.status} ${response.statusText}`);
    return response.json();
  })
  .then(data => {
    if (!data) return;
    console.log('Patient search result:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
