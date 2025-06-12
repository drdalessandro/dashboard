/**
 * Utilities for storing and retrieving user information
 * This provides a fallback mechanism when auth context is not available
 */

// User info structure
export interface UserInfo {
    id?: string;
    name: string;
    role: string;
    initials: string;
    avatar?: string;
}

// Storage key constant
const USER_INFO_KEY = 'user_info';

/**
 * Save user info to local storage
 * @param userInfo User information object
 */
export const saveUserInfo = (userInfo: UserInfo): void => {
    try {
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    } catch (error) {
        console.error('Error saving user info to localStorage:', error);
    }
};

/**
 * Get user info from local storage
 * @returns User information object or null if not found
 */
export const getUserInfo = (): UserInfo | null => {
    try {
        const userInfoStr = localStorage.getItem(USER_INFO_KEY);
        if (!userInfoStr) return null;
        
        return JSON.parse(userInfoStr) as UserInfo;
    } catch (error) {
        console.error('Error retrieving user info from localStorage:', error);
        return null;
    }
};

/**
 * Clear user info from local storage
 */
export const clearUserInfo = (): void => {
    try {
        localStorage.removeItem(USER_INFO_KEY);
    } catch (error) {
        console.error('Error clearing user info from localStorage:', error);
    }
};

/**
 * Create user info object from user data
 * @param userData User data from authentication
 * @returns User info object
 */
export const createUserInfo = (userData: any): UserInfo => {
    const name = userData?.name || 'User';
    const role = userData?.resourceType || userData?.role || 'Healthcare User';
    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    
    return {
        id: userData?.id,
        name,
        role,
        initials,
        avatar: userData?.avatar
    };
};
