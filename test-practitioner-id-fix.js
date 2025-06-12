// Test script to verify practitioner ID parameter fix
// Run this after implementing the fix

console.log('=== TESTING PRACTITIONER ID FIX ===');

// Test the ID extraction logic
const testUrl = '/practitioners/show/0196fc4e-2db6-766e-b989-fa4dda71ca74';
const pathParts = testUrl.split('/');
const extractedId = pathParts[pathParts.length - 1];

console.log('Test URL:', testUrl);
console.log('Extracted ID:', extractedId);
console.log('ID matches expected:', extractedId === '0196fc4e-2db6-766e-b989-fa4dda71ca74');

// Test ID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
console.log('ID is valid UUID:', uuidRegex.test(extractedId));

// Test cases for edge scenarios
const testCases = [
  undefined,
  null,
  '',
  '0196fc4e-2db6-766e-b989-fa4dda71ca74',
  'invalid-id',
  '123'
];

console.log('\n=== TESTING EDGE CASES ===');
testCases.forEach((testId, index) => {
  const shouldFetch = Boolean(testId);
  const isValidUUID = testId ? uuidRegex.test(testId) : false;
  
  console.log(`Test ${index + 1}:`, {
    input: testId,
    shouldFetch,
    isValidUUID,
    recommendation: shouldFetch && isValidUUID ? 'FETCH' : 'SKIP'
  });
});

console.log('\n=== TEST COMPLETE ===');
