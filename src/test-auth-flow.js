/**
 * Test script for Medplum authentication flow with offline-first capabilities
 * This script simulates various network conditions to test the auth provider
 */

// Import the necessary modules
const { authenticateWithMedplum } = require('./providers/auth-provider/auth-medplum');
const { isServerConnected, checkServerConnection } = require('./lib/medplum/client');

// Test credentials - replace with valid test credentials
const testCredentials = {
  email: 'test@example.com',
  password: 'password123'
};

/**
 * Run a series of tests for the authentication flow
 */
async function testAuthFlow() {
  console.log('🧪 Starting authentication flow tests...');
  
  // Test 1: Check server connectivity
  console.log('\n📡 Test 1: Checking server connectivity...');
  const serverAvailable = await checkServerConnection();
  console.log(`Server connectivity: ${serverAvailable ? 'Available ✅' : 'Unavailable ❌'}`);
  
  // Test 2: Login with server available
  if (serverAvailable) {
    console.log('\n🔑 Test 2: Testing login with server available...');
    try {
      const loginResult = await authenticateWithMedplum.login(testCredentials);
      console.log('Login result:', loginResult);
      console.log(loginResult.success ? 'Login successful ✅' : 'Login failed ❌');
    } catch (error) {
      console.error('Login error:', error);
    }
  } else {
    console.log('\n🔑 Test 2: Skipping login test as server is unavailable');
  }
  
  // Test 3: Check authentication status
  console.log('\n🔍 Test 3: Testing authentication check...');
  try {
    const checkResult = await authenticateWithMedplum.check();
    console.log('Check result:', checkResult);
    console.log(checkResult.authenticated ? 'Authentication check passed ✅' : 'Authentication check failed ❌');
  } catch (error) {
    console.error('Authentication check error:', error);
  }
  
  // Test 4: Get user identity
  console.log('\n👤 Test 4: Testing get identity...');
  try {
    const identity = await authenticateWithMedplum.getIdentity();
    console.log('Identity result:', identity ? 'Identity retrieved ✅' : 'No identity found ❌');
    if (identity) {
      console.log('User:', identity.name);
      console.log('Offline mode:', identity.offlineMode ? 'Yes' : 'No');
    }
  } catch (error) {
    console.error('Get identity error:', error);
  }
  
  // Test 5: Simulate offline mode
  console.log('\n📵 Test 5: Simulating offline mode...');
  // Mock navigator.onLine to be false
  const originalOnLine = navigator.onLine;
  Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
  
  try {
    console.log('Testing offline login...');
    const offlineLoginResult = await authenticateWithMedplum.login(testCredentials);
    console.log('Offline login result:', offlineLoginResult);
    console.log(offlineLoginResult.success ? 'Offline login successful ✅' : 'Offline login failed ❌');
    
    console.log('Testing offline authentication check...');
    const offlineCheckResult = await authenticateWithMedplum.check();
    console.log('Offline check result:', offlineCheckResult);
    console.log(offlineCheckResult.authenticated ? 'Offline authentication check passed ✅' : 'Offline authentication check failed ❌');
    
    console.log('Testing offline get identity...');
    const offlineIdentity = await authenticateWithMedplum.getIdentity();
    console.log('Offline identity result:', offlineIdentity ? 'Offline identity retrieved ✅' : 'No offline identity found ❌');
    if (offlineIdentity) {
      console.log('User:', offlineIdentity.name);
      console.log('Offline mode:', offlineIdentity.offlineMode ? 'Yes' : 'No');
    }
  } catch (error) {
    console.error('Offline test error:', error);
  } finally {
    // Restore original navigator.onLine value
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
  }
  
  // Test 6: Error handling
  console.log('\n⚠️ Test 6: Testing error handling...');
  try {
    const errorResult = await authenticateWithMedplum.onError(new Error('Test error'));
    console.log('Error handling result:', errorResult);
    console.log('Error message:', errorResult.error.message);
  } catch (error) {
    console.error('Error handling test error:', error);
  }
  
  console.log('\n🏁 Authentication flow tests completed');
}

// Run the tests
testAuthFlow().catch(console.error);
