import axios from 'axios';
import supabaseClient from '@/lib/supabase/client';
import { createLogger } from '@/utils/logger';

export class RxNormService {
  private supabase;
  private logger;

  constructor() {
    // Use the centralized Supabase client
    this.supabase = supabaseClient;
    this.logger = createLogger('RxNormService');
  }

  /**
   * Search for medications by name and optional filters
   */
  async searchMedications(query: string, filters?: MedicationFilters): Promise<RxNormMedication[]> {
    try {
      console.log('Searching medications with query:', query);

      if (!query || query.length < 2) {
        return [];
      }

      // Try local search first
      const localResults = await this.searchLocal(query, filters);

      if (localResults && localResults.length > 0) {
        console.log('Found local results:', localResults.length);
        return localResults;
      }

      // If online, try RxNorm API via proxy
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        return this.searchRxNormAPI(query, filters);
      }

      return [];
    } catch (error) {
      console.error('Error searching medications:', error);
      return [];
    }
  }

  /**
   * Search for medications in local Supabase cache
   */
  private async searchLocal(query: string, filters?: MedicationFilters): Promise<RxNormMedication[]> {
    try {
      // First try Supabase
      let dbResults: RxNormMedication[] = [];
      let dbError: any = null;

      try {
        let supabaseQuery = this.supabase
          .from('rxnorm_medications')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(20);

        // Apply filters if provided
        if (filters) {
          if (filters.dosageForm) {
            supabaseQuery = supabaseQuery.eq('dosage_form', filters.dosageForm);
          }
          // Add more filters as needed
        }

        const { data, error } = await supabaseQuery;

        if (error) {
          console.warn('Supabase query error:', error);
          dbError = error;
        } else if (data && data.length > 0) {
          dbResults = data.map(this.mapSupabaseToRxNormMedication);
        }
      } catch (dbQueryError) {
        console.warn('Error in Supabase query:', dbQueryError);
        dbError = dbQueryError;
      }

      // If Supabase returned results, use those
      if (dbResults.length > 0) {
        return dbResults;
      }

      // If we got here, either there was an error or no results from Supabase
      // Try localStorage as fallback
      const localStorageResults = this.searchLocalStorage(query, filters);
      if (localStorageResults.length > 0) {
        console.debug('Found results in localStorage:', localStorageResults.length);
        return localStorageResults;
      }

      // No results from either source
      console.log('No local results found in database or localStorage');
      return [];
    } catch (error) {
      console.error('Error searching local medications:', error);

      // Try localStorage as last resort
      return this.searchLocalStorage(query, filters);
    }
  }

  /**
   * Search localStorage for medications (fallback when database is unavailable)
   */
  private searchLocalStorage(query: string, filters?: MedicationFilters): RxNormMedication[] {
    if (typeof window === 'undefined') return []; // Only works in browser

    try {
      const results: RxNormMedication[] = [];
      const lowerQuery = query.toLowerCase();

      // Scan localStorage for RxNorm medication entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('rxnorm_med_')) continue;

        try {
          const item = localStorage.getItem(key);
          if (!item) continue;

          const medication = JSON.parse(item) as RxNormMedication;

          // Check if the medication name matches the query
          if (medication.name && medication.name.toLowerCase().includes(lowerQuery)) {
            // Apply filters if needed
            if (filters?.dosageForm &&
              (!medication.dosageForm ||
                !medication.dosageForm.toLowerCase().includes(filters.dosageForm.toLowerCase()))) {
              continue;
            }

            results.push(medication);

            // Limit to 20 results like the database query
            if (results.length >= 20) break;
          }
        } catch (parseError) {
          console.warn('Error parsing localStorage medication:', key, parseError);
        }
      }

      return results;
    } catch (error) {
      console.warn('Error searching localStorage:', error);
      return [];
    }
  }

  /**
   * Search RxNorm API through a proxy endpoint to avoid CORS issues
   */
  private async searchRxNormAPI(query: string, filters?: MedicationFilters): Promise<RxNormMedication[]> {
    try {
      // Prevent empty searches
      if (!query || query.length < 2) {
        return [];
      }

      // Use the API proxy endpoint with explicit parameters
      const queryParams = new URLSearchParams({
        name: query,
        search: '1'
      }).toString();

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`/api/rxnorm-proxy?${queryParams}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`RxNorm search failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.drugGroup || !data.drugGroup.conceptGroup) {
        console.log('No API results found or unexpected response format');
        return [];
      }

      // Extract medications from the API response
      const medications: RxNormMedication[] = [];

      // Process each concept group
      for (const group of data.drugGroup.conceptGroup) {
        if (!group.conceptProperties) continue;

        for (const concept of group.conceptProperties) {
          // Create a basic medication object from the search results
          const medication: RxNormMedication = {
            rxcui: concept.rxcui,
            name: concept.name,
            tty: concept.tty,
            activeIngredients: [],
            dosageForm: '',
            strength: '',
            route: ''
          };

          medications.push(medication);

          // Cache each medication for future use
          this.cacheMedication(medication);

          // Only fetch details for the first 3 results to reduce API load
          if (medications.length <= 3) {
            try {
              // We'll use setTimeout to delay and stagger these requests even for the check
              setTimeout(async () => {
                try {
                  // Check if we should try to fetch details
                  const shouldFetch = await this.checkMedicationDetails(concept.rxcui);

                  if (shouldFetch) {
                    // Add another delay for the actual fetch to prevent bunching requests
                    setTimeout(() => {
                      this.fetchAndCacheMedicationDetails(concept.rxcui)
                        .catch(err => {
                          console.warn(`Failed detail fetch for ${concept.rxcui}:`, err);
                        });
                    }, 300); // Small additional delay between check and fetch
                  } else {
                    console.debug(`Skipping details fetch for ${concept.rxcui} - already checked`);
                  }
                } catch (checkErr) {
                  console.warn(`Error in details check for ${concept.rxcui}:`, checkErr);
                }
              }, medications.length * 500); // Stagger by 500ms to reduce contention
            } catch (err) {
              console.warn(`Error setting up medication details check for ${concept.rxcui}:`, err);
            }
          }
        }
      }

      // Apply filters if needed
      let filteredResults = medications;
      if (filters && filters.dosageForm) {
        filteredResults = filteredResults.filter(med =>
          med.dosageForm && med.dosageForm.toLowerCase().includes(filters.dosageForm!.toLowerCase())
        );
      }

      return filteredResults;
    } catch (error) {
      console.error('Error searching RxNorm API:', error);
      return [];
    }
  }

  /**
   * Fetch detailed information for a medication by RxCUI
   * This can be done asynchronously after returning search results
   */
  private async fetchAndCacheMedicationDetails(rxcui: string): Promise<void> {
    try {
      // Skip if rxcui is invalid
      if (!rxcui || typeof rxcui !== 'string') {
        console.debug(`Skipping detail fetch for invalid RxCUI: ${rxcui}`);
        return;
      }

      // Check if we already have detailed information
      const { data: existingMed, error: dbError } = await this.supabase
        .from('rxnorm_medications')
        .select('rxcui, active_ingredients')  // Only select columns we know exist
        .eq('rxcui', rxcui)
        .single();

      if (dbError && dbError.code !== 'PGRST116') { // Not PGRST116 (no rows returned)
        console.warn(`Database error checking for existing medication ${rxcui}:`, dbError);
      }

      if (existingMed && Array.isArray(existingMed.active_ingredients) && existingMed.active_ingredients.length > 0) {
        console.debug(`Using cached details for RxCUI ${rxcui}`);
        return; // We already have detailed information
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        // Fetch details from proxy API with timeout
        const response = await fetch(`/api/rxnorm-proxy/${rxcui}/allrelated`, {
          signal: controller.signal
        });

        // Handle 404 errors gracefully - this RxCUI may no longer be valid
        if (response.status === 404) {
          console.debug(`RxCUI ${rxcui} not found in RxNorm API - may be deprecated or removed`);

          // Still cache basic information to prevent repeated lookup attempts
          const basicMedication: RxNormMedication = {
            rxcui,
            name: `Unknown Medication (${rxcui})`,
            tty: '',
            activeIngredients: [],
            dosageForm: '',
            strength: '',
            route: ''
          };

          // Cache the basic info to prevent retries
          await this.cacheMedication(basicMedication);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch medication details: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.allRelatedGroup || !data.allRelatedGroup.conceptGroup) {
          console.debug(`No concept group found for RxCUI ${rxcui}`);

          // Cache basic info to prevent retries
          await this.cacheMedication({
            rxcui,
            name: `Medication ${rxcui} (no details)`,
            tty: '',
            activeIngredients: [],
            dosageForm: '',
            strength: '',
            route: ''
          });

          return;
        }

        // Extract details from the response
        const allRelated = data.allRelatedGroup.conceptGroup;

        // Find dosage form concepts
        const dosageForms = allRelated
          .find((group: any) => group.tty === 'DF')
          ?.conceptProperties || [];

        // Find ingredient concepts
        const ingredients = allRelated
          .find((group: any) => group.tty === 'IN')
          ?.conceptProperties || [];

        // Get the name and basic information - with timeout
        const nameController = new AbortController();
        const nameTimeoutId = setTimeout(() => nameController.abort(), 5000);

        let nameData: any = {};
        try {
          const nameResponse = await fetch(`/api/rxnorm-proxy/${rxcui}`, {
            signal: nameController.signal
          });

          if (nameResponse.ok) {
            nameData = await nameResponse.json();
          } else if (nameResponse.status === 404) {
            console.debug(`Basic info for RxCUI ${rxcui} not found in RxNorm API`);
          } else {
            console.warn(`Error fetching basic info for RxCUI ${rxcui}: ${nameResponse.statusText}`);
          }
        } catch (nameError) {
          console.warn(`Error in name lookup for RxCUI ${rxcui}:`, nameError);
        } finally {
          clearTimeout(nameTimeoutId);
        }

        // Process ingredients carefully
        const processedIngredients = ingredients.map((ing: any) => ({
          rxcui: ing.rxcui || '',
          name: ing.name || ''
        }));

        const medicationDetails: RxNormMedication = {
          rxcui,
          name: nameData.idGroup?.name || `Medication ${rxcui}`,
          tty: nameData.idGroup?.tty || '',
          activeIngredients: processedIngredients,
          dosageForm: dosageForms[0]?.name || '',
          strength: '', // Would need additional API calls to get strength
          route: ''     // Would need additional API calls to get route
        };

        console.debug(`Successfully fetched details for RxCUI ${rxcui}, caching...`);

        // Cache the detailed information
        await this.cacheMedication(medicationDetails);

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn(`Timeout fetching details for RxCUI ${rxcui}`);
      } else {
        console.error(`Error fetching details for RxCUI ${rxcui}:`, error);
      }

      // Still cache basic info to prevent retries
      try {
        await this.cacheMedication({
          rxcui,
          name: `Medication ${rxcui} (error)`,
          tty: '',
          activeIngredients: [],
          dosageForm: '',
          strength: '',
          route: ''
        });
      } catch (cacheError) {
        console.error(`Failed to cache error state for RxCUI ${rxcui}:`, cacheError);
      }
    }
  }

  /**
   * Cache a medication in Supabase
   */
  private async cacheMedication(medication: RxNormMedication): Promise<void> {
    if (!medication || !medication.rxcui) {
      console.debug('Skipping cache for medication without rxcui');
      return;
    }

    // Ensure medication object has all required properties
    const validMedication: RxNormMedication = {
      rxcui: medication.rxcui,
      name: medication.name || `Medication ${medication.rxcui}`,
      tty: medication.tty || '',
      activeIngredients: Array.isArray(medication.activeIngredients) ? medication.activeIngredients : [],
      dosageForm: medication.dosageForm || '',
      strength: medication.strength || '',
      route: medication.route || ''
    };

    try {
      // Get current auth status
      const { data: { session } } = await this.supabase.auth.getSession();

      // If not authenticated, use localStorage instead
      if (!session) {
        console.warn('No authenticated session available - using localStorage fallback instead');
        this.cacheToLocalStorage(validMedication);
        return;
      }

      // Ensure all required fields are present and properly formatted
      const medicationData: Record<string, any> = {
        rxcui: validMedication.rxcui,
        name: validMedication.name,
        tty: validMedication.tty,
        active_ingredients: validMedication.activeIngredients,
        dosage_form: validMedication.dosageForm,
        strength: validMedication.strength,
        route: validMedication.route,
        last_updated: new Date().toISOString()
      };

      // First attempt with just the known schema fields
      // Log the data being cached for debugging
      console.debug('Caching medication data:', medicationData);

      const { data, error } = await this.supabase
        .from('rxnorm_medications')
        .upsert(medicationData, {
          onConflict: 'rxcui'    // Specify the conflict field
        });

      if (error) {
        // Handle specific error codes
        if (error.code === '42P01') {
          console.error('Table "rxnorm_medications" does not exist - need to run migrations');
          this.cacheToLocalStorage(validMedication);
        } else if (error.code === '23505') {
          console.warn('Duplicate key for rxcui:', medication.rxcui);
          // This is usually not an error, just a duplicate key
        } else if (error.code === 'PGRST204') {
          // Column not found error - likely the new fields
          console.warn('Column not found in table - using only basic fields');

          // Try again with only the basic fields (remove the new fields)
          const basicData = {
            rxcui: validMedication.rxcui,
            name: validMedication.name,
            tty: validMedication.tty,
            active_ingredients: validMedication.activeIngredients,
            dosage_form: validMedication.dosageForm,
            strength: validMedication.strength,
            route: validMedication.route,
            last_updated: new Date().toISOString()
          };

          // Try upsert again with only basic fields
          const retryResult = await this.supabase
            .from('rxnorm_medications')
            .upsert(basicData, {
              onConflict: 'rxcui'
            });

          if (retryResult.error) {
            console.error('Retry upsert failed:', retryResult.error, 'Basic data:', basicData);
            this.cacheToLocalStorage(validMedication);
          } else {
            console.debug('Successfully cached medication with basic fields:', medication.rxcui);
          }
        } else if (error.code === '42501') {
          // Row-level security policy violation
          console.warn('RLS policy prevented medication caching - using localStorage instead');
          this.cacheToLocalStorage(validMedication);
        } else {
          // Other errors
          console.error('Error caching medication:', error, 'Medication data:', medicationData);
          this.cacheToLocalStorage(validMedication);
        }
      } else {
        console.debug('Successfully cached medication:', medication.rxcui);
      }
    } catch (error) {
      // Better error handling with more context
      console.error('Exception while caching medication:', error, 'Medication:', medication.rxcui);
      this.cacheToLocalStorage(validMedication);
    }
  }

  /**
   * Cache a medication to localStorage as fallback when database operations fail
   */
  private cacheToLocalStorage(medication: RxNormMedication): void {
    if (typeof window === 'undefined') return; // Only works in browser

    try {
      const key = `rxnorm_med_${medication.rxcui}`;
      const data = {
        ...medication,
        activeIngredients: medication.activeIngredients || [],
        cached_at: new Date().toISOString()
      };

      localStorage.setItem(key, JSON.stringify(data));
      console.debug('Cached medication to localStorage:', medication.rxcui);
    } catch (error) {
      console.warn('Failed to cache medication to localStorage:', error);
    }
  }

  /**
   * Check if medication details should be fetched
   * Returns true if details should be fetched, false if already done
   */
  private async checkMedicationDetails(rxcui: string): Promise<boolean> {
    try {
      // First check if the record exists at all
      const { data, error } = await this.supabase
        .from('rxnorm_medications')
        .select('rxcui, active_ingredients')
        .eq('rxcui', rxcui)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, so we should fetch details
          console.debug(`No existing record for ${rxcui}, will fetch details`);
          return true;
        }
        console.warn(`Error checking medication: ${error.message}`);
        throw error;
      }

      // Check if we have active ingredients already - use this as a proxy for "details checked"
      // since we don't have the details_checked column
      if (data && Array.isArray(data.active_ingredients) && data.active_ingredients.length > 0) {
        console.debug(`Found existing details for ${rxcui}, skipping fetch`);
        return false; // Already have details
      }

      // We have a record, but no active ingredients - fetch details
      console.debug(`Record exists for ${rxcui} but needs details, will fetch`);
      return true;
    } catch (error) {
      console.warn(`Error checking if medication details exist for ${rxcui}:`, error);
      // On error, default to fetching details
      return true;
    }
  }

  /**
   * Sync common medications from RxNorm for offline use
   */
  // In RxNormService.ts
  /**
   * Sync common medications from RxNorm for offline use
   */
  public async syncCommonMedications(): Promise<number> {
    try {
      this.logger.info('Starting sync of common medications');

      // List of common medications to sync (RxCUI codes)
      const commonMedicationRxcuis = [
        '198440', // Ibuprofen
        '310965', // Amoxicillin
        '197361', // Amoxicillin-Clavulanate
        '197379', // Azithromycin
        '197307', // Cephalexin
        '197500', // Ciprofloxacin
        '197516', // Doxycycline
        '197361', // Amoxicillin
        '197743', // Metronidazole
        '198211', // Paracetamol (Acetaminophen)
        '198440', // Ibuprofen
        '198440', // Ibuprofen
        '198440'  // Ibuprofen (multiple common forms)
      ];

      let syncedCount = 0;

      // Process each medication
      for (const rxcui of commonMedicationRxcuis) {
        try {
          // Check if we already have this medication with details
          const needsSync = await this.checkMedicationDetails(rxcui);

          if (needsSync) {
            this.logger.debug(`Fetching details for medication: ${rxcui}`);
            await this.fetchAndCacheMedicationDetails(rxcui);
            syncedCount++;

            // Add a small delay between API calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            this.logger.debug(`Skipping already synced medication: ${rxcui}`);
          }
        } catch (error) {
          this.logger.warn(`Error syncing medication ${rxcui}:`, error);
          // Continue with next medication even if one fails
        }
      }

      this.logger.info(`Successfully synced ${syncedCount} common medications`);
      return syncedCount;

    } catch (error) {
      this.logger.error('Error in syncCommonMedications:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  /**
   * Map Supabase row to RxNormMedication object
   */
  private mapSupabaseToRxNormMedication(row: any): RxNormMedication {
    return {
      rxcui: row.rxcui,
      name: row.name || '',
      tty: row.tty || '',
      activeIngredients: row.active_ingredients || [],
      dosageForm: row.dosage_form || '',
      strength: row.strength || '',
      route: row.route || '',
      details_checked: row.details_checked === true,
      error_fetching: row.error_fetching === true
    };
  }
}

export interface RxNormMedication {
  rxcui: string;
  name: string;
  tty: string;
  activeIngredients: {
    rxcui: string;
    name: string;
  }[];
  dosageForm: string;
  strength: string;
  route: string;
  details_checked?: boolean;
  error_fetching?: boolean;
}

export interface MedicationFilters {
  dosageForm?: string;
  route?: string;
  ingredient?: string;
}