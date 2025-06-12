/**
 * Resource Hook Factory Index
 * 
 * Centralized exports for the resource hook factory system
 * Created as part of Step 4: Implement Resource Factory refactoring
 */

import { Condition, MedicationRequest, Observation, Patient, Practitioner, Resource, ResourceType } from '@medplum/fhirtypes';
import { getResourceConfig, ResourceConfigs } from './ResourceConfig';
import { createResourceHook } from './createResourceHook';
import { getEnhancementStrategies } from './EnhancementStrategies';

// Main factory function
export {
    createResourceHook,
    createSimpleResourceHook,
    validateResourceConfig,
    type GeneratedResourceHook,
    type ResourceFactoryOptions
} from './createResourceHook';

// Configuration system
export {
    ResourceConfigs,
    getResourceConfig,
    mergeResourceConfig,
    type ResourceHookConfig,
    type PatientConfig,
    type PractitionerConfig,
    type ObservationConfig,
    type MedicationRequestConfig,
    type ConditionConfig
} from './ResourceConfig';

// Enhancement strategies
export {
    PatientEnhancementStrategies,
    PractitionerEnhancementStrategies,
    ObservationEnhancementStrategies,
    MedicationRequestEnhancementStrategies,
    ConditionEnhancementStrategies,
    EnhancementStrategiesByResource,
    getEnhancementStrategies,
    type PatientStrategies,
    type PractitionerStrategies,
    type ObservationStrategies,
    type MedicationRequestStrategies,
    type ConditionStrategies
} from './EnhancementStrategies';

// Generated hooks using the factory
export { usePatient } from '../usePatient';
export { usePractitioner } from '../usePractitioner';
export { useObservation } from '../useObservation';
export { useMedicationRequest } from '../useMedicationRequest';
export { useCondition } from '../useCondition';

/**
 * Quick start function to generate a resource hook with sensible defaults
 */
export function generateResourceHook<T extends Resource = Resource>(
    resourceType: ResourceType
) {
    const config = getResourceConfig<T>(resourceType);
    if (!config) {
        throw new Error(`No configuration found for resource type: ${resourceType}`);
    }

    return createResourceHook<T>(config);
}

/**
 * Generate all common resource hooks at once
 */
export function generateAllCommonHooks() {
    return {
        usePatient: generateResourceHook<Patient>('Patient'),
        usePractitioner: generateResourceHook<Practitioner>('Practitioner'),
        useObservation: generateResourceHook<Observation>('Observation'),
        useMedicationRequest: generateResourceHook<MedicationRequest>('MedicationRequest'),
        useCondition: generateResourceHook<Condition>('Condition'),
    };
}

/**
 * Factory statistics and utilities
 */
export const FactoryUtils = {
    /**
     * Get list of supported resource types
     */
    getSupportedResourceTypes(): ResourceType[] {
        return Object.keys(ResourceConfigs) as ResourceType[];
    },

    /**
     * Check if a resource type is supported
     */
    isResourceTypeSupported(resourceType: ResourceType): boolean {
        return resourceType in ResourceConfigs;
    },

    /**
     * Get factory statistics
     */
    getFactoryStats() {
        const supportedTypes = this.getSupportedResourceTypes();
        const totalEnhancementStrategies = supportedTypes.reduce((total, type) => {
            const strategies = getEnhancementStrategies(type);
            return total + strategies.length;
        }, 0);

        return {
            supportedResourceTypes: supportedTypes.length,
            totalResourceTypes: supportedTypes,
            totalEnhancementStrategies,
            factoryVersion: '1.0.0',
            generatedAt: new Date().toISOString()
        };
    }
};