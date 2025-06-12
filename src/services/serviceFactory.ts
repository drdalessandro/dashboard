// src/services/serviceFactory.ts
import { IPatientDataService } from './interfaces/IPatientDataService';
import { PatientDataService } from './implementations/PatientDataService';
import { IPractitionerDataService } from './interfaces/IPractitionerDataService';
import { PractitionerDataService } from './implementations/PractitionerDataService';
import { IPrescriptionDataService } from './interfaces/IPrescriptionDataService';
import { PrescriptionDataService } from './implementations/PrescriptionDataService';
import { DataServiceConfig } from './interfaces/IBaseDataService';

/**
 * Factory for creating data service instances
 * This centralizes service creation and makes it easy to swap implementations
 */
export const createDataServices = (config?: Partial<DataServiceConfig>) => {
    return {
        patientService: new PatientDataService(config) as IPatientDataService,
        practitionerService: new PractitionerDataService(config) as IPractitionerDataService,
        prescriptionService: new PrescriptionDataService(config) as IPrescriptionDataService
    };
};

/**
 * Type for the return value of createDataServices
 * Makes it easier to use the services with proper typing
 */
export type DataServices = ReturnType<typeof createDataServices>;

// Export a default instance for common use cases
export const dataServices = createDataServices();