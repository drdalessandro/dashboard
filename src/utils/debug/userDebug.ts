/**
 * Debug utilities for user management
 * These are only active in development mode and help with testing user scenarios
 */

import { createTestUser } from '../createTestUser';
import { UserInfo, getUserInfo } from '../userInfoStorage';

// Only enable these utilities in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Set a test user via the browser console
 * This can be called manually in the console with:
 * window.setTestUser('provider');
 */
export const setupUserDebugTools = (): void => {
    if (isDevelopment && typeof window !== 'undefined') {
        // Add debug functions to window object
        (window as any).setTestUser = (role: 'provider' | 'patient' | 'pharmacist' | 'insurance') => {
            const user = createTestUser(role);
            console.log(`[DEBUG] Set test user: ${user.name} (${user.role})`);
            return user;
        };
        
        (window as any).getStoredUserInfo = () => {
            const user = getUserInfo();
            console.log('[DEBUG] Current stored user:', user);
            return user;
        };
        
        (window as any).clearUserInfo = () => {
            localStorage.removeItem('user_info');
            console.log('[DEBUG] User info cleared');
        };
        
        console.log('[DEBUG] User debug tools initialized. Available commands:');
        console.log('  window.setTestUser("provider" | "patient" | "pharmacist" | "insurance")');
        console.log('  window.getStoredUserInfo()');
        console.log('  window.clearUserInfo()');
    }
};

/**
 * Automatically initialize a test user if none exists
 * This helps with development by always ensuring a user is available
 */
export const initializeDefaultUser = (): UserInfo | null => {
    if (isDevelopment && typeof window !== 'undefined') {
        const currentUser = getUserInfo();
        
        // If no user exists, create a default provider
        if (!currentUser) {
            console.log('[DEBUG] No user found, creating default provider');
            return createTestUser('provider');
        }
        
        return currentUser;
    }
    
    return null;
};
