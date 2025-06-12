/**
 * diagnose-resource-id.js
 * 
 * Diagnostic script to check resource IDs against common patterns
 * and identify potential issues
 * 
 * Run with: node diagnose-resource-id.js <resource-id>
 */

// Simple validation functions similar to the ones in resourceUtils.ts
function isValidStandardUuid(id) {
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return pattern.test(id);
}

function isValidNonStandardUuid(id) {
  // Some systems use non-standard UUID formats
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{16}$/i;
  return pattern.test(id);
}

function isValidIntegerId(id) {
  const pattern = /^\d+$/;
  return pattern.test(id);
}

function diagnoseId(id) {
  console.log("\n=== Resource ID Diagnostic Results ===");
  console.log(`ID: "${id}"`);
  console.log(`Length: ${id.length} characters`);
  
  // Check for common issues
  if (id.includes(' ')) {
    console.log("❌ Contains spaces - this will cause problems");
    id = id.replace(/\s+/g, '');
    console.log(`   Suggestion: Remove spaces -> "${id}"`);
  }
  
  if (id.length === 36 && isValidStandardUuid(id)) {
    console.log("✅ Valid standard UUID format (8-4-4-4-12)");
  } else if (id.length === 40 && isValidNonStandardUuid(id)) {
    console.log("✅ Valid non-standard UUID format (8-4-4-16)");
  } else if (isValidIntegerId(id)) {
    console.log("✅ Valid integer ID format");
  } else {
    console.log("❌ Does not match any standard ID format");
    
    // Suggest fixes
    if (id.length === 32 && !id.includes('-')) {
      // Missing dashes in UUID
      const withDashes = [
        id.substring(0, 8),
        id.substring(8, 12),
        id.substring(12, 16),
        id.substring(16, 20),
        id.substring(20)
      ].join('-');
      
      console.log(`   Suggestion: Add dashes -> "${withDashes}"`);
      
      if (isValidStandardUuid(withDashes)) {
        console.log("   ✅ This suggestion is a valid UUID format");
      }
    }
    
    // Check case sensitivity
    if (id.toLowerCase() !== id) {
      console.log(`   Suggestion: Use lowercase -> "${id.toLowerCase()}"`);
    }
    
    // Check for invalid characters
    const invalidChars = id.match(/[^0-9a-f-]/gi);
    if (invalidChars) {
      console.log(`   ❌ Contains invalid characters: ${[...new Set(invalidChars)].join(', ')}`);
    }
  }
  
  // Test if ID would pass our normalization
  try {
    const normalizedId = normalizeResourceId(id);
    if (normalizedId !== id) {
      console.log(`\nNormalized ID: "${normalizedId}"`);
      if (isValidStandardUuid(normalizedId) || isValidNonStandardUuid(normalizedId) || isValidIntegerId(normalizedId)) {
        console.log("✅ Normalization produced a valid ID format");
      } else {
        console.log("❌ Normalization did not produce a valid ID format");
      }
    } else {
      console.log("\nNo normalization needed or possible");
    }
  } catch (error) {
    console.log(`\n❌ Error during normalization: ${error.message}`);
  }
  
  console.log("\n=== Network Tests ===");
  // This would send test requests using different ID formats
  console.log("To perform network tests, run:");
  console.log(`  curl -v "${process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL}/fhir/Patient/${id}"`);
  
  console.log("\n=== Comparison with problematic ID ===");
  const problematicId = "01955638-e505-76c9-8818-47d1a48b77b1";
  console.log(`Problematic ID: "${problematicId}"`);
  
  // Compare with the known problematic ID
  if (id === problematicId) {
    console.log("❗ This is the same ID that was causing issues");
  } else {
    console.log("Differences from problematic ID:");
    // Simple character-by-character comparison
    if (id.length !== problematicId.length) {
      console.log(`   Different length: ${id.length} vs ${problematicId.length}`);
    } else {
      let differences = 0;
      for (let i = 0; i < id.length; i++) {
        if (id[i] !== problematicId[i]) {
          console.log(`   Position ${i}: "${id[i]}" vs "${problematicId[i]}"`);
          differences++;
        }
      }
      if (differences === 0) {
        console.log("   No character differences but still not matching - possible encoding issue");
      }
    }
  }
}

// Simple implementation of normalizeResourceId for the diagnostic script
function normalizeResourceId(id) {
  if (!id) return id;
  
  // Remove any whitespace
  const trimmedId = id.trim();
  
  // Attempt to correct common issues:
  
  // 1. IDs with spaces or other separators
  const noSpacesId = trimmedId.replace(/\s+/g, '');
  if (isValidStandardUuid(noSpacesId) || isValidNonStandardUuid(noSpacesId)) {
    return noSpacesId;
  }
  
  // 2. IDs that are missing dashes where they should be
  if (trimmedId.length === 32 && !trimmedId.includes('-')) {
    const withDashes = [
      trimmedId.substring(0, 8),
      trimmedId.substring(8, 12),
      trimmedId.substring(12, 16),
      trimmedId.substring(16, 20),
      trimmedId.substring(20)
    ].join('-');
    
    if (isValidStandardUuid(withDashes)) {
      return withDashes;
    }
  }
  
  // 3. Try lowercase
  const lowerCaseId = trimmedId.toLowerCase();
  if (lowerCaseId !== trimmedId && (isValidStandardUuid(lowerCaseId) || isValidNonStandardUuid(lowerCaseId))) {
    return lowerCaseId;
  }
  
  // If none of our normalization attempts worked, return the original
  return trimmedId;
}

// Main script execution
if (process.argv.length < 3) {
  console.log('Usage: node diagnose-resource-id.js <resource-id>');
  console.log('Example: node diagnose-resource-id.js 01955638-e505-76c9-8818-47d1a48b77b1');
  process.exit(1);
}

// Get the ID from command line arguments
const id = process.argv[2];

// Run the diagnostic
diagnoseId(id);
