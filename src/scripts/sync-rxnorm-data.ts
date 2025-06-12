/**
 * Script to sync common medications from RxNorm for offline use
 * 
 * Run with: npx ts-node src/scripts/sync-rxnorm-data.ts
 */

import { RxNormService } from '../services/implementations/rxnorm/RxNormService';
import { createLogger } from '../utils/logger';

const logger = createLogger('RxNormSync');

async function main() {
  logger.info('Starting RxNorm medication sync');
  
  try {
    const rxNormService = new RxNormService();
    const count = await rxNormService.syncCommonMedications();
    
    logger.info(`Sync completed successfully! Synced ${count} medications.`);
  } catch (error) {
    logger.error('Error syncing medications:', error);
    process.exit(1);
  }
}

main().catch(console.error);