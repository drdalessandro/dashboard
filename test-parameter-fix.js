// test-parameter-fix.js
// Test script to verify parameter passing fixes

console.log('🧪 Testing Parameter Passing Fixes...\n');

// Test URLs to verify
const testUrls = [
  '/practitioners/show/0196fc4e-2db6-766e-b989-fa4dda71ca74',
  '/practitioners/edit/0196fc4e-2db6-766e-b989-fa4dda71ca74', 
  '/patients/show/valid-patient-id-here',
  '/patients/edit/valid-patient-id-here'
];

// Test parameter extraction logic
function testParameterExtraction() {
  console.log('Testing parameter extraction...');
  
  testUrls.forEach(url => {
    const parts = url.split('/');
    const id = parts[parts.length - 1];
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    console.log(`URL: ${url}`);
    console.log(`Extracted ID: ${id}`);
    console.log(`Valid UUID: ${isValidUUID}`);
    console.log('---');
  });
}

// Test validation logic
function testValidation() {
  console.log('\nTesting validation logic...');
  
  const testCases = [
    { value: undefined, expected: false },
    { value: null, expected: false },
    { value: '', expected: false },
    { value: '0196fc4e-2db6-766e-b989-fa4dda71ca74', expected: true },
    { value: 'invalid-id', expected: false },
    { value: '123', expected: false }
  ];
  
  testCases.forEach(test => {
    const isValid = test.value ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(test.value) : false;
    const passed = isValid === test.expected;
    
    console.log(`Value: ${test.value} | Expected: ${test.expected} | Got: ${isValid} | ${passed ? '✅' : '❌'}`);
  });
}

testParameterExtraction();
testValidation();

console.log('\n🎯 Manual Testing Instructions:');
console.log('1. Start your development server: npm run dev');
console.log('2. Navigate to: http://localhost:3000/practitioners/show/0196fc4e-2db6-766e-b989-fa4dda71ca74');
console.log('3. Check browser console for parameter validation logs');
console.log('4. Verify no "practitionerNotFound" errors occur');
console.log('5. Test other URLs with valid practitioner IDs');
