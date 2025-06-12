/**
 * Base Hooks Index
 * 
 * Centralized exports for all base hooks that provide reusable patterns
 * Created as part of Step 3: Create Base Hooks refactoring
 */

// Base CRUD operations hook
export {
  useBaseCRUD,
  useResourceCRUD,
  type BaseCRUDOptions,
  type BaseCRUDState,
  type BaseCRUDOperations
} from './useBaseCRUD';

// Resource caching hooks
export {
  useResourceCache,
  useSimpleResourceCache,
  useCacheMonitoring,
  type ResourceCacheOptions,
  type CacheState,
  type CacheOperations
} from './useResourceCache';

// Resource enhancement hooks
export {
  useResourceEnhancement,
  usePatientEnhancement,
  usePractitionerEnhancement,
  CommonEnhancementStrategies,
  getResourceComputedProperty,
  createEnhancementStrategy,
  type ComputedProperties,
  type EnhancementStrategy,
  type ResourceEnhancementOptions,
  type EnhancedResource
} from './useResourceEnhancement';

// Base state management hooks
export {
  useBaseState,
  useSimpleState,
  useListState,
  useDetailState,
  isAnyLoading,
  getActiveLoadingStates,
  type BaseResourceState,
  type BaseStateActions,
  type BaseStateOptions,
  type PaginationState,
  type FilterState,
  type LoadingState
} from './useBaseState';

// Utility type for base hook composition
export interface BaseHookComposition<T extends Resource = Resource> {
  crud: ReturnType<typeof useBaseCRUD<T>>;
  cache: ReturnType<typeof useResourceCache<T>>;
  enhancement: ReturnType<typeof useResourceEnhancement<T>>;
  state: ReturnType<typeof useBaseState<T>>;
}

/**
 * Factory function to create a complete base hook composition
 * This will be used by the resource factory in Step 4
 */
export function createBaseHookComposition<T extends Resource = Resource>(config: {
  resourceType: ResourceType;
  crudOptions?: BaseCRUDOptions<T>;
  cacheOptions?: ResourceCacheOptions;
  enhancementOptions?: ResourceEnhancementOptions<T>;
  stateOptions?: BaseStateOptions;
}): () => BaseHookComposition<T> {
  return function useBaseHookComposition() {
    const crud = useBaseCRUD<T>(config.crudOptions || { resourceType: config.resourceType });
    const cache = useResourceCache<T>(config.cacheOptions || { resourceType: config.resourceType });
    const enhancement = useResourceEnhancement<T>(config.enhancementOptions || { 
      resourceType: config.resourceType, 
      strategies: [] 
    });
    const state = useBaseState<T>(config.stateOptions || {});

    return {
      crud,
      cache,
      enhancement,
      state
    };
  };
}
