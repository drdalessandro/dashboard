export interface RxNormMedication {
    rxcui: string;
    name: string;
    tty: string;
    activeIngredients: {
        rxcui: string;
        name: string;
    }[];
    dosageForm?: string;
    strength?: string;
    route?: string;
    details_checked?: boolean;
    error_fetching?: boolean;
    
    // New optional fields
    manufacturer?: string;
    packageSize?: number;
    packageUnit?: string;
}

export * from './RxNormService';