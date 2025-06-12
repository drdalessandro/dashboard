/**
 * Utility for creating test user data
 * This is useful for development and testing purposes
 */

import { UserInfo, saveUserInfo } from './userInfoStorage';

/**
 * Create and save a test user for development purposes
 * @param role The role to assign to the test user ('provider', 'patient', 'pharmacist', 'insurance')
 */
export const createTestUser = (role: 'provider' | 'patient' | 'pharmacist' | 'insurance' = 'provider'): UserInfo => {
    let userInfo: UserInfo;
    
    switch (role) {
        case 'provider':
            userInfo = {
                id: 'test-provider-id',
                name: 'Dr. Aminata Diallo',
                role: 'Healthcare Provider',
                initials: 'AD'
            };
            break;
            
        case 'patient':
            userInfo = {
                id: 'test-patient-id',
                name: 'Aisha Coulibaly',
                role: 'Patient',
                initials: 'AC'
            };
            break;
            
        case 'pharmacist':
            userInfo = {
                id: 'test-pharmacist-id',
                name: 'Grace Adebayo',
                role: 'Pharmacist',
                initials: 'GA'
            };
            break;
            
        case 'insurance':
            userInfo = {
                id: 'test-insurance-id',
                name: 'Ibrahim Sow',
                role: 'Insurance Coordinator',
                initials: 'IS'
            };
            break;
            
        default:
            userInfo = {
                id: 'test-user-id',
                name: 'Test User',
                role: 'User',
                initials: 'TU'
            };
    }
    
    // Save to localStorage
    saveUserInfo(userInfo);
    
    return userInfo;
};

/**
 * Create and save all test users
 * This is useful for quickly switching between different user roles during testing
 */
export const createAllTestUsers = (): void => {
    createTestUser('provider');
    createTestUser('patient');
    createTestUser('pharmacist');
    createTestUser('insurance');
};
