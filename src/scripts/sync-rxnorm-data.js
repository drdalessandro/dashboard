/**
 * Sync RxNorm Data Script
 * 
 * This script syncs common medications for offline use in the Mali healthcare context.
 * Run with: node src/scripts/sync-rxnorm-data.js
 */

require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// RxNorm API client
const rxNormClient = axios.create({
  baseURL: 'https://rxnav.nlm.nih.gov/REST',
});

// Common medications used in Mali and sub-Saharan Africa
const COMMON_MEDICATIONS = [
  // Antimalarials
  { name: 'Artemether/Lumefantrine', search: 'Artemether Lumefantrine' },
  { name: 'Chloroquine', search: 'Chloroquine' },
  { name: 'Quinine', search: 'Quinine' },
  { name: 'Artesunate', search: 'Artesunate' },
  { name: 'Mefloquine', search: 'Mefloquine' },
  { name: 'Primaquine', search: 'Primaquine' },

  // Antibiotics
  { name: 'Amoxicillin', search: 'Amoxicillin' },
  { name: 'Azithromycin', search: 'Azithromycin' },
  { name: 'Ciprofloxacin', search: 'Ciprofloxacin' },
  { name: 'Cotrimoxazole', search: 'Trimethoprim Sulfamethoxazole' },
  { name: 'Doxycycline', search: 'Doxycycline' },
  { name: 'Metronidazole', search: 'Metronidazole' },

  // Analgesics and anti-inflammatories
  { name: 'Paracetamol', search: 'Acetaminophen' },
  { name: 'Ibuprofen', search: 'Ibuprofen' },
  { name: 'Diclofenac', search: 'Diclofenac' },
  { name: 'Aspirin', search: 'Aspirin' },

  // Antihypertensives
  { name: 'Amlodipine', search: 'Amlodipine' },
  { name: 'Atenolol', search: 'Atenolol' },
  { name: 'Hydrochlorothiazide', search: 'Hydrochlorothiazide' },
  { name: 'Enalapril', search: 'Enalapril' },
  { name: 'Lisinopril', search: 'Lisinopril' },

  // Antidiabetics
  { name: 'Metformin', search: 'Metformin' },
  { name: 'Glibenclamide', search: 'Glibenclamide' },
  { name: 'Insulin', search: 'Insulin' },

  // Others
  { name: 'Albendazole', search: 'Albendazole' },
  { name: 'Mebendazole', search: 'Mebendazole' },
  { name: 'Zinc sulfate', search: 'Zinc Sulfate' },
  { name: 'Oral rehydration salts', search: 'Oral Rehydration Salts' },
  { name: 'Folic acid', search: 'Folic Acid' }
];

/**
 * Search for medications by name
 */
async function searchMedications(query) {
  try {
    const response = await rxNormClient.get('/drugs', {
      params: {
        name: query,
        search: 1
      }
    });
    
    const rxcuis = response.data.drugGroup?.conceptGroup
      ?.flatMap(group => group.conceptProperties || [])
      .map(prop => prop.rxcui) || [];
    
    return rxcuis;
  } catch (error) {
    console.error(`Error searching for "${query}":`, error.message);
    return [];
  }
}

/**
 * Get medication details by RxCUI
 */
async function getMedicationDetails(rxcui) {
  try {
    // Get all related information
    const response = await rxNormClient.get(`/rxcui/${rxcui}/allrelated`);
    
    // Process and extract the relevant information
    const allRelated = response.data.allRelatedGroup?.conceptGroup || [];
    
    // Find dosage form concepts
    const dosageForms = allRelated
      .find(group => group.tty === 'DF')
      ?.conceptProperties || [];
    
    // Find ingredient concepts
    const ingredients = allRelated
      .find(group => group.tty === 'IN')
      ?.conceptProperties || [];
    
    // Get the name and other basic information
    const nameResponse = await rxNormClient.get(`/rxcui/${rxcui}`);
    const basicInfo = nameResponse.data.idGroup?.name || '';
    
    return {
      rxcui,
      name: basicInfo,
      tty: nameResponse.data.idGroup?.tty || '',
      active_ingredients: ingredients.map(ing => ({
        rxcui: ing.rxcui,
        name: ing.name
      })),
      dosage_form: dosageForms[0]?.name || '',
      strength: '', // Would need additional API calls to get strength
      route: '',    // Would need additional API calls to get route
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching details for RxCUI ${rxcui}:`, error.message);
    return null;
  }
}

/**
 * Store medication in Supabase
 */
async function storeMedication(medication) {
  if (!medication) return;
  
  try {
    const { error } = await supabase
      .from('rxnorm_medications')
      .upsert(medication);
    
    if (error) throw error;
    
    console.log(`Stored medication: ${medication.name} (${medication.rxcui})`);
  } catch (error) {
    console.error(`Error storing medication ${medication.rxcui}:`, error.message);
  }
}

/**
 * Main sync function
 */
async function syncMedications() {
  console.log('Starting RxNorm medication sync...');
  
  let totalSynced = 0;
  
  for (const med of COMMON_MEDICATIONS) {
    console.log(`Processing ${med.name}...`);
    
    // Search for the medication
    const rxcuis = await searchMedications(med.search);
    
    if (rxcuis.length === 0) {
      console.log(`No results found for ${med.name}`);
      continue;
    }
    
    // Get details for the first few RxCUIs
    const limit = Math.min(5, rxcuis.length);
    for (let i = 0; i < limit; i++) {
      const details = await getMedicationDetails(rxcuis[i]);
      if (details) {
        await storeMedication(details);
        totalSynced++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  console.log(`Sync complete! Synced ${totalSynced} medications.`);
}

// Run the sync
syncMedications()
  .catch(error => {
    console.error('Sync error:', error);
  })
  .finally(() => {
    console.log('Script execution completed.');
  });