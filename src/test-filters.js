// Test file to verify FHIR search parameters
const { medplumClient } = require('./lib/medplum/client');

// Test different search parameter styles
async function testSearchParameters() {
  try {
    console.log('Testing search parameters with separate fields...');
    
    const patientId = '01955638-e505-76c9-8818-47d1a48b77b1';
    
    // Test direct search parameters (should work)
    const medications1 = await medplumClient.searchResources('MedicationRequest', {
      subject: `Patient/${patientId}`,
      status: 'active'
    });
    console.log(`Found ${medications1.length} medications using direct parameters`);
    
    // Test with _filter parameter (problematic)
    try {
      const medications2 = await medplumClient.searchResources('MedicationRequest', 
        `_filter=subject=Patient/${patientId}&status=active`
      );
      console.log(`Found ${medications2.length} medications using _filter parameter`);
    } catch (error) {
      console.error('Error when using _filter parameter:', error.message);
    }
    
    console.log('Search parameter tests complete');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

// Export for use if needed
module.exports = {
  testSearchParameters
};

// Run the test if executed directly
if (require.main === module) {
  testSearchParameters();
}
