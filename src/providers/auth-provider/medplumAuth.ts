/**
 * Medplum Authentication Service
 * 
 * This module provides authentication and user management for the Gandall Healthcare Platform
 * using Medplum as the backend. It supports offline-first authentication, biometric authentication,
 * and comprehensive error handling.
 */

import { AuthProvider, CheckResponse } from "@refinedev/core";
import { Patient, Practitioner, Resource } from '@medplum/fhirtypes';
import { EmailPasswordLoginRequest, ProfileResource } from '@medplum/core';
import {
    medplumClient,
    isServerConnected,
    checkServerConnection
} from '../../lib/medplum/client';
import { UserInfo, saveUserInfo } from '../../utils/userInfoStorage';
import { formatHumanName } from '../../utils/fhir/resourceUtils';
import { createLogger } from '../../utils/logger';

// Initialize logger
const logger = createLogger('MedplumAuth');

// Storage keys for consistent access
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'medplum.access_token',
    REFRESH_TOKEN: 'medplum.refresh_token',
    PROJECT: 'medplum.project',
    PROFILE: 'medplum.profile',
    PROFILE_DETAILS: 'medplum.profile.details',
    AUTH_TIMESTAMP: 'medplum.auth_timestamp',
    OFFLINE_AUTH: 'medplum.offline_auth',
    BIOMETRICS_ENABLED: 'medplum.biometrics_enabled',
    DEVICE_ID: 'medplum.device_id'
};

/**
 * Interface for token response from Medplum OAuth2 endpoint
 */
interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
    project?: { reference: string };
    profile?: { reference: string };
    patient?: { reference: string };
    code?: string; // Used in email/password authentication flow
}

/**
 * Authentication response type
 */
interface AuthResponse {
    success: boolean;
    redirectTo?: string;
    error?: {
        name: string;
        message: string;
    };
}

/**
 * Authentication check response type
 */
interface AuthCheckResponse {
    authenticated: boolean;
    logout?: boolean;
    redirectTo?: string;
    forceReauthWhenOnline?: boolean;
}

/**
 * User identity information
 */
interface UserIdentity {
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
    role?: string;
    offlineMode?: boolean;
}

/**
 * Error handler response type
 */
interface ErrorResponse {
    logout?: boolean;
    redirectTo?: string;
    error: any;
}

/**
 * Authentication result type
 */
interface AuthResult {
    profile: ProfileResource;
    code?: string;
}

/**
 * User profile type definition
 */
export interface MedplumUser {
    id: string;
    resourceType: string;
    name?: string;
    displayName?: string;
    email?: string;
    profile?: {
        reference: string;
        display?: string;
    };
    language?: string;
    offlineAccessEnabled?: boolean;
    resource?: Patient | Practitioner | Resource;
}

/**
 * Network error type guard
 */
function isNetworkError(error: any): boolean {
    return error?.status === undefined || error?.status === 0 || error?.name === 'NetworkError';
}

/**
 * Auth error type guard
 */
function isAuthError(error: any): boolean {
    return error?.status === 401 || error?.status === 403 ||
        error?.message?.includes('unauthorized') ||
        error?.message?.includes('token expired') ||
        error?.message?.includes('invalid token');
}

/**
 * Checks if the current environment is offline
 */
function isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Custom HttpError class that can be used as both a type and a value
 */
class HttpError extends Error {
    status: number;
    translationKey?: string;

    constructor(
        message: string | { translationKey: string },
        status: number = 401
    ) {
        const errorMessage = typeof message === 'string'
            ? message
            : message.translationKey;

        super(errorMessage);

        this.name = 'HttpError';
        this.status = status;

        if (typeof message === 'object') {
            this.translationKey = message.translationKey;
        }
    }

    // Static method to create an error with a translation key
    static fromTranslationKey(
        translationKey: string,
        status: number = 401
    ): HttpError {
        const error = new HttpError(translationKey, status);
        error.translationKey = translationKey;
        return error;
    }
}

/**
 * Custom error handling with internationalization support
 */
class AuthenticationError extends Error {
    status: number;
    translationKey?: string;

    constructor(message: string, status: number = 401, translationKey?: string) {
        super(message);
        this.name = 'AuthenticationError';
        this.status = status;
        this.translationKey = translationKey;
    }
}

/**
 * Internationalized error handling class
 */
class LocalizedAuthError extends Error {
    status: number;
    translationKey: string;
    details?: Record<string, unknown>;

    constructor(
        translationKey: string,
        status: number = 401,
        details?: Record<string, unknown>
    ) {
        super(translationKey);
        this.name = 'LocalizedAuthError';
        this.status = status;
        this.translationKey = translationKey;
        this.details = details;
    }

    // Method to generate a user-friendly error message
    toLocalizedMessage(translate: (key: string, params?: Record<string, unknown>) => string): string {
        return translate(this.translationKey, this.details);
    }
}

/**
 * Medplum Auth Service
 * Handles authentication, user management, and offline capabilities
 */
class MedplumAuthService {
    // Current authentication state
    private _state = {
        isAuthenticated: false,
        isOfflineMode: false,
        user: null as MedplumUser | null,
        lastSyncTime: 0
    };

    /**
     * Constructor initializes the auth service and checks existing authentication
     */
    constructor() {
        if (typeof window !== 'undefined') {
            // Check if there's an existing authentication
            this._checkExistingAuthentication().then((isAuthenticated) => {
                if (isAuthenticated) {
                    logger.info('User is already authenticated');
                } else {
                    logger.info('No existing authentication found');
                }
            }).catch(error => {
                logger.error('Error checking authentication:', error);
            });

            // Generate device ID if not already present
            if (!localStorage.getItem(STORAGE_KEYS.DEVICE_ID)) {
                this._generateDeviceId();
            }
        }
    }

    /**
     * Implement login for AuthProvider interface
     */
    async login({ email, password, providerName }: { email?: string; password?: string; providerName?: string }): Promise<any> {
        console.log('Auth provider login called with:', { email, providerName });
        try {
            if (!email || !password) {
                return {
                    success: false,
                    error: new Error('Email and password are required')
                };
            }

            // Check for offline mode first
            const isCurrentlyOffline = isOffline();
            const serverAvailable = await checkServerConnection();

            if (isCurrentlyOffline || !serverAvailable) {
                // Handle offline authentication
                const hasStoredCredentials = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
                if (hasStoredCredentials) {
                    console.log(`🔄 ${isCurrentlyOffline ? 'Offline' : 'Server unavailable'} mode: Using stored credentials`);
                    return {
                        success: true,
                        redirectTo: "/dashboard",
                    };
                }

                // Try offline authentication if network is unavailable
                try {
                    const offlineResult = await this._authenticateOffline(email, password);
                    if (offlineResult.success) {
                        return {
                            success: true,
                            redirectTo: "/dashboard",
                        };
                    }

                    return {
                        success: false,
                        error: new Error(offlineResult.error?.message || 'Offline authentication failed')
                    };
                } catch (offlineError) {
                    return {
                        success: false,
                        error: new Error('Cannot authenticate while offline with no stored credentials')
                    };
                }
            }

            // Online authentication flow
            try {
                // Authenticate with Medplum
                const loginRequest: EmailPasswordLoginRequest = {
                    email,
                    password,
                    remember: true, // Always enable offline access for better UX
                    scope: 'openid offline_access',
                    clientId: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || 'gandall-healthcare-app'
                };

                // Start the login process
                const result = await medplumClient.startLogin(loginRequest);
                if (!result.login) {
                    throw new Error('Authentication failed');
                }

                // Complete the login flow
                const profile = await medplumClient.processCode(result.code || '', {});

                // Capture the access token and store it
                const accessToken = medplumClient.getAccessToken();
                if (!accessToken) {
                    logger.warn('No access token available after authentication');
                    throw new Error('Failed to obtain access token');
                }

                // Store tokens and profile
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
                localStorage.setItem(STORAGE_KEYS.PROFILE_DETAILS, JSON.stringify(profile));
                localStorage.setItem(STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());

                // Create user and update state
                const user = this._createUserFromProfile(profile);
                this._state.isAuthenticated = true;
                this._state.user = user;
                this._state.lastSyncTime = Date.now();

                // save to storage
                const identity = await this.getIdentity();

                if (identity) {
                    const userInfo: UserInfo = {
                        id: identity.id,
                        name: formatHumanName(identity.name),
                        role: identity.resourceType || 'User',
                        initials: (identity.name?.[0]?.given?.[0]?.[0] || '') + (identity.name?.[0]?.family?.[0] || '')
                    };

                    // Save to localStorage
                    saveUserInfo(userInfo);
                    console.log('User info saved to localStorage during authentication:', userInfo);
                }

                // Set up offline access
                this._setupOfflineAccess();

                return {
                    success: true,
                    redirectTo: "/dashboard",
                };
            } catch (error) {
                console.error('Authentication error:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error : new Error('Authentication failed')
                };
            }
        } catch (error: any) {
            console.error('Login process error:', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error('Login process failed')
            };
        }
    }

    /**
     * Implement logout for AuthProvider interface
     */
    async logout(): Promise<any> {
        try {
            // Clear tokens and state
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });

            // Clear the Medplum client state
            medplumClient.clear();

            // Reset internal state
            this._state.isAuthenticated = false;
            this._state.isOfflineMode = false;
            this._state.user = null;

            return {
                success: true,
                redirectTo: "/login",
            };
        } catch (error) {
            console.error('Logout error:', error);
            const logoutError = error instanceof Error ? error : new Error('Failed to logout');
            return {
                success: false,
                error: logoutError
            };
        }
    }

    /**
     * Implement check for AuthProvider interface
     */
    async check(params?: any): Promise<CheckResponse> {
        try {
            console.log("Auth check called");

            // Handle server-side rendering
            if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
                console.log("Server-side rendering detected, skipping auth check");
                return {
                    authenticated: false,
                    redirectTo: "/login",
                };
            }

            // First, check if we have a valid token
            const accessToken = this.getAccessToken();
            if (!accessToken) {
                console.log("No access token found");
                return {
                    authenticated: false,
                    redirectTo: '/login'
                };
            }

            // Check if we're offline - in offline mode with a token, assume authenticated
            const isCurrentlyOffline = isOffline();
            if (isCurrentlyOffline) {
                console.log("Offline mode detected with token, assuming authenticated");
                // If we have a token in offline mode, consider the user authenticated
                return {
                    authenticated: true
                };
            }

            // Check token expiration
            const isTokenExpired = this.isTokenExpired();
            if (isTokenExpired) {
                console.log("Token is expired, attempting refresh");
                // Attempt to refresh the token
                try {
                    const refreshed = await this.refreshToken();
                    if (!refreshed) {
                        console.log("Token refresh failed");
                        return {
                            authenticated: false,
                            redirectTo: '/login'
                        };
                    }
                    console.log("Token refreshed successfully");
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    // If refresh failed but we have a token, still consider authenticated
                    // This prevents redirect loops when refresh fails
                    console.log("Using existing token despite refresh failure");
                    return {
                        authenticated: true
                    };
                }
            }

            // Verify the token's validity by getting identity
            try {
                const profile = await this.getIdentity();
                if (!profile) {
                    console.log("No profile found");
                    return {
                        authenticated: false,
                        redirectTo: '/login'
                    };
                }

                console.log("Successfully authenticated with valid profile");
                // Successfully authenticated
                return {
                    authenticated: true
                };
            } catch (identityError) {
                console.error('Identity verification failed:', identityError);

                // Even if identity verification fails, if we have a valid token, 
                // still consider the user authenticated to prevent redirect loops
                if (accessToken) {
                    console.log("Using existing token despite identity verification failure");
                    return {
                        authenticated: true
                    };
                }

                return {
                    authenticated: false,
                    redirectTo: '/login'
                };
            }
        } catch (error) {
            console.error('Authentication check failed:', error);

            // Check if we have a token despite the error
            const accessToken = this.getAccessToken();
            if (accessToken) {
                console.log("Using existing token despite check failure");
                return {
                    authenticated: true
                };
            }

            return {
                authenticated: false,
                redirectTo: '/login'
            };
        }
    }

    /**
     * Implement getPermissions for AuthProvider interface
     */
    async getPermissions(): Promise<string[]> {
        try {
            // Try to get the profile from Medplum client for permissions
            if (navigator.onLine) {
                const profile = await medplumClient.getProfileAsync();
                if (profile) {
                    // Extract roles or permissions from profile if available
                    // This is a simplified example - adjust based on your Medplum permission model
                    return profile.resourceType === 'Practitioner' ? ['admin'] : ['user'];
                }
            }

            // Fallback to stored profile for offline support
            const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE_DETAILS);
            if (storedProfile) {
                try {
                    const parsedProfile = JSON.parse(storedProfile);
                    return parsedProfile.resourceType === 'Practitioner' ? ['admin'] : ['user'];
                } catch (parseError) {
                    console.error('Error parsing stored profile for permissions:', parseError);
                }
            }

            // Default permissions if none found
            return ['user'];
        } catch (error) {
            console.error('Error getting permissions:', error);
            return ['user']; // Default fallback permission
        }
    }

    /**
     * Implement getIdentity for AuthProvider interface
     */
    async getIdentity(): Promise<any> {
        try {
            // Handle server-side rendering
            if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
                return null;
            }

            // Check for existing token
            const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            if (!accessToken) {
                return null;
            }

            // Check network and server status
            const isCurrentlyOffline = isOffline();
            const serverAvailable = isServerConnected();

            // Try to get stored profile first for faster response and offline support
            const storedProfileStr = localStorage.getItem(STORAGE_KEYS.PROFILE_DETAILS);
            let storedProfile = null;

            if (storedProfileStr) {
                try {
                    storedProfile = JSON.parse(storedProfileStr);
                } catch (parseError) {
                    console.error('Error parsing stored profile:', parseError);
                }
            }

            // If offline or server unavailable, use stored profile
            if (isCurrentlyOffline || !serverAvailable) {
                if (storedProfile) {
                    console.log(`${isCurrentlyOffline ? 'Offline' : 'Server unavailable'} mode: Using stored profile`);
                    // Extract user role from stored profile or use default
                    const userRole = typeof (storedProfile as any).role === 'string'
                        ? (storedProfile as any).role
                        : ((storedProfile as any).resourceType === 'Practitioner' ? 'Healthcare Provider' : 'Patient');

                    return {
                        ...storedProfile,
                        name: storedProfile.name || storedProfile.id || 'Offline User',
                        avatar: storedProfile.photo || undefined,
                        role: userRole,
                        offlineMode: true
                    };
                }
                // If no stored profile but we have a token, return minimal identity
                return {
                    id: 'offline-user',
                    name: 'Offline User',
                    role: 'Healthcare Provider',
                    offlineMode: true
                };
            }

            // If online and server available, try to get the latest profile
            try {
                // Set the token in the client
                await medplumClient.setAccessToken(accessToken);

                // Get the profile
                const profile = await medplumClient.getProfileAsync();

                if (profile) {
                    // Store the profile for offline use
                    localStorage.setItem(STORAGE_KEYS.PROFILE_DETAILS, JSON.stringify(profile));
                    // Update last successful authentication timestamp
                    localStorage.setItem(STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());

                    // Extract user role from profile or use default
                    const userRole = typeof (profile as any).role === 'string'
                        ? (profile as any).role
                        : (profile.resourceType === 'Practitioner' ? 'Healthcare Provider' : 'Patient');

                    // Update our internal state
                    this._state.user = this._createUserFromProfile(profile);
                    this._state.isAuthenticated = true;

                    return {
                        ...profile,
                        name: profile.name || profile.id,
                        avatar: profile.photo || undefined,
                        role: userRole,
                        offlineMode: false
                    };
                } else if (storedProfile) {
                    // If server returned null profile but we have a stored profile, use it
                    console.log('Server returned null profile, using stored profile as fallback');
                    // Extract user role from stored profile or use default
                    const userRole = typeof (storedProfile as any).role === 'string'
                        ? (storedProfile as any).role
                        : ((storedProfile as any).resourceType === 'Practitioner' ? 'Healthcare Provider' : 'Patient');

                    return {
                        ...storedProfile,
                        name: storedProfile.name || storedProfile.id || 'Offline User',
                        avatar: storedProfile.photo || undefined,
                        role: userRole,
                        offlineMode: true
                    };
                }
            } catch (profileError) {
                console.error('Error fetching profile:', profileError);

                // If we have a stored profile, use it as fallback
                if (storedProfile) {
                    console.log('Using stored profile after online fetch error');
                    // Extract user role from stored profile or use default
                    const userRole = typeof (storedProfile as any).role === 'string'
                        ? (storedProfile as any).role
                        : ((storedProfile as any).resourceType === 'Practitioner' ? 'Healthcare Provider' : 'Patient');

                    return {
                        ...storedProfile,
                        name: storedProfile.name || storedProfile.id || 'Offline User',
                        avatar: storedProfile.photo || undefined,
                        role: userRole,
                        offlineMode: true
                    };
                }
            }

            // If all attempts fail, return null
            return null;
        } catch (error) {
            console.error('Error getting identity:', error);

            // Offline fallback - use consistent key reference
            const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE_DETAILS);
            if (storedProfile) {
                try {
                    const parsedProfile = JSON.parse(storedProfile);
                    // Extract user role from parsed profile or use default
                    const userRole = typeof (parsedProfile as any).role === 'string'
                        ? (parsedProfile as any).role
                        : ((parsedProfile as any).resourceType === 'Practitioner' ? 'Healthcare Provider' : 'Patient');

                    return {
                        ...parsedProfile,
                        name: parsedProfile.name || parsedProfile.id || 'Offline User',
                        avatar: parsedProfile.photo || undefined,
                        role: userRole,
                        offlineMode: true
                    };
                } catch (parseError) {
                    console.error('Error parsing stored profile:', parseError);
                }
            }

            return null;
        }
    }

    /**
     * Handle errors for AuthProvider interface
     */
    async onError(error: any): Promise<any> {
        console.error('Auth provider error:', error);

        // Enhanced error handling with offline detection and server connectivity
        const currentlyOffline = isOffline();
        const serverAvailable = isServerConnected();

        if (currentlyOffline || !serverAvailable) {
            // Create a proper Error object for type compatibility
            const networkError = new Error(
                currentlyOffline
                    ? 'Network connection unavailable. Please try again when online.'
                    : 'Authentication server unavailable. Please try again later.'
            );
            return { error: networkError };
        }

        // Check if this is an authentication error
        if (isAuthError(error)) {
            // Try to refresh the token
            try {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    return { error }; // Token refreshed, continue with original error
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }

            // If refresh failed or was not attempted, log out
            return {
                error,
                logout: true,
                redirectTo: '/login'
            };
        }

        // Ensure we return a proper Error object
        if (error instanceof Error) {
            return { error };
        }

        // Create a new Error with the message if it's not already an Error
        const formattedError = new Error(
            typeof error === 'object' && error?.message
                ? error.message
                : 'An unexpected authentication error occurred'
        );

        return { error: formattedError };
    }

    /**
     * Check if there's an existing authentication
     * @returns Promise resolving to whether user is authenticated
     */
    private async _checkExistingAuthentication(): Promise<boolean> {
        try {
            if (typeof window === 'undefined') {
                return false; // Running on server side
            }

            // Check for local authentication state
            if (this._state.isAuthenticated && this._state.user) {
                logger.debug('Already authenticated in memory');
                return true;
            }

            // Try to restore from local storage
            const profileJson = localStorage.getItem(STORAGE_KEYS.PROFILE);
            const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

            if (!accessToken || !profileJson) {
                logger.debug('No stored credentials found');
                return false;
            }

            try {
                const profile = JSON.parse(profileJson);
                if (!profile) {
                    logger.warn('Invalid profile data in storage');
                    return false;
                }

                // Create user from profile
                const user = this._createUserFromProfile(profile);
                this._state.user = user;
                this._state.isAuthenticated = true;

                // Check if we need to refresh the token
                const timestamp = localStorage.getItem(STORAGE_KEYS.AUTH_TIMESTAMP);
                const lastAuth = timestamp ? parseInt(timestamp, 10) : 0;
                const now = Date.now();
                const hoursSinceAuth = (now - lastAuth) / (1000 * 60 * 60);

                // Refresh token if it's older than 1 hour for security reasons
                if (hoursSinceAuth > 8) {
                    logger.info('Token is stale, attempting refresh');
                    await this.refreshToken();
                }

                return true;
            } catch (error) {
                logger.error('Error restoring session:', error);
                this._clearAuth();
                return false;
            }
        } catch (error) {
            logger.error('Error checking authentication:', error);
            return false;
        }
    }

    /**
     * Authenticate with Medplum backend
     * @param email User email
     * @param password User password
     * @param remember Whether to remember the user
     * @returns Authentication result
     */
    private async _authenticateWithMedplum(email: string, password: string, remember: boolean): Promise<AuthResult> {
        try {
            // Prepare login request with proper typing
            const loginRequest: EmailPasswordLoginRequest = {
                email,
                password,
                remember: remember ? true : undefined,
                scope: 'openid offline_access',
                clientId: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || 'gandall-healthcare-app'
            };

            // Authenticate with Medplum client
            const result = await medplumClient.startLogin(loginRequest);

            if (!result.login) {
                throw new Error('Authentication failed');
            }

            // Complete the login flow using the code from the login result
            const profile = await medplumClient.processCode(result.code || '', {});

            // After processCode completes successfully, the Medplum client should have the token internally set
            // Explicitly capture it and store it in localStorage
            const accessToken = medplumClient.getAccessToken();
            if (!accessToken) {
                logger.warn('No access token available after authentication');
                throw new Error('Failed to obtain access token after successful authentication');
            }

            // Store tokens and profile in localStorage
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
            localStorage.setItem(STORAGE_KEYS.PROFILE_DETAILS, JSON.stringify(profile));

            // Store authentication timestamp
            localStorage.setItem(STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());

            return { profile };
        } catch (error: any) {
            logger.error('Error authenticating with Medplum:', error);
            throw error;
        }
    }

    /**
     * Authenticate in offline mode
     * @param email User email
     * @param password User password
     * @returns Authentication response
     */
    private async _authenticateOffline(email: string, password: string): Promise<AuthResponse> {
        try {
            logger.info('Attempting offline authentication');

            const offlineAuthJson = localStorage.getItem(STORAGE_KEYS.OFFLINE_AUTH);
            if (!offlineAuthJson) {
                logger.warn('No offline auth data available');
                return {
                    success: false,
                    error: { name: 'OfflineError', message: 'No offline authentication data available' }
                };
            }

            const offlineAuth = JSON.parse(offlineAuthJson);

            // Simple check for matching credentials
            // In a real implementation, this would use a secure hash comparison
            if (offlineAuth.email === email && offlineAuth.password === password) {
                const profileJson = localStorage.getItem(STORAGE_KEYS.PROFILE);
                if (!profileJson) {
                    logger.warn('No profile data available for offline auth');
                    return {
                        success: false,
                        error: { name: 'OfflineError', message: 'No profile data available' }
                    };
                }

                const profile = JSON.parse(profileJson);
                const user = this._createUserFromProfile(profile);

                this._state.isAuthenticated = true;
                this._state.isOfflineMode = true;
                this._state.user = user;

                return { success: true };
            }

            return {
                success: false,
                error: { name: 'AuthenticationError', message: 'Invalid credentials' }
            };
        } catch (error: any) {
            logger.error('Error during offline authentication:', error);
            return {
                success: false,
                error: { name: error.name || 'OfflineError', message: error.message || 'Offline authentication failed' }
            };
        }
    }

    /**
     * Create a user object from a Medplum profile
     * @param profile Medplum profile
     * @returns User object
     */
    private _createUserFromProfile(profile: ProfileResource): MedplumUser {
        try {
            if (!profile) {
                throw new Error('Invalid profile data');
            }

            // Create a basic user object with required fields
            const user: MedplumUser = {
                id: profile.id || '',
                resourceType: profile.resourceType || '',
                name: '',
                displayName: '',
                email: ''
            };

            // Extract name from profile
            if (profile.name && Array.isArray(profile.name) && profile.name.length > 0) {
                const nameObj = profile.name[0];
                const given = nameObj.given || [];
                const family = nameObj.family || '';
                user.name = [...given, family].filter(Boolean).join(' ');
                user.displayName = user.name;
            }

            // Extract email from profile if available
            if (profile.telecom && Array.isArray(profile.telecom)) {
                const emailContact = profile.telecom.find((t: any) => t.system === 'email');
                if (emailContact && emailContact.value) {
                    user.email = emailContact.value;
                }
            }

            // Add profile reference if available
            if (profile.id && profile.resourceType) {
                user.profile = {
                    reference: `${profile.resourceType}/${profile.id}`,
                    display: user.displayName || user.name || `${profile.resourceType} ${profile.id}`
                };
            }

            // Store the full resource
            user.resource = profile;

            return user;
        } catch (error: any) {
            logger.error('Error creating user from profile:', error);
            // Return a minimal valid user object
            return {
                id: profile?.id || 'unknown',
                resourceType: profile?.resourceType || 'unknown',
                name: 'Unknown User'
            };
        }
    }

    /**
     * Set up offline access for the user
     */
    private _setupOfflineAccess(): void {
        try {
            logger.info('Setting up offline access');

            // Store current authentication state for offline use
            const profile = medplumClient.getProfile();
            if (!profile) {
                logger.warn('No profile available for offline setup');
                return;
            }

            // Store profile in local storage
            if (profile) {
                localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
            }

            // Get user and mark as offline-enabled
            if (this._state.user) {
                this._state.user.offlineAccessEnabled = true;
            }

            // Generate device ID if not already present
            const deviceId = this._generateDeviceId();

            logger.info('Offline access setup complete', { deviceId });
        } catch (error: any) {
            logger.error('Error setting up offline access:', error);
        }
    }

    /**
     * Generate a unique device ID for offline access
     * @returns Device ID
     */
    private _generateDeviceId(): string {
        try {
            // Check if we already have a device ID
            const existingId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
            if (existingId) {
                return existingId;
            }

            // Generate a random ID
            const deviceId = 'device-' + Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);

            // Store it
            localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);

            return deviceId;
        } catch (error: any) {
            logger.error('Error generating device ID:', error);
            return 'fallback-device-id';
        }
    }

    /**
     * Clear authentication data from memory and storage
     */
    private _clearAuth(): void {
        try {
            // Clear state
            this._state.isAuthenticated = false;
            this._state.isOfflineMode = false;
            this._state.user = null;

            // Clear local storage auth data
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.PROFILE);
            localStorage.removeItem(STORAGE_KEYS.AUTH_TIMESTAMP);

            // Keep device ID for future logins

            logger.info('Auth data cleared');
        } catch (error: any) {
            logger.error('Error clearing auth data:', error);
        }
    }

    /**
     * Refresh the authentication token
     * @returns Whether refresh was successful
     */
    public async refreshToken(): Promise<boolean> {
        try {
            if (this._state.isOfflineMode) {
                logger.warn('Cannot refresh token in offline mode');
                return false;
            }

            logger.info('Attempting to refresh token');

            try {
                const clientId = process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID || '';
                const clientSecret = process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_SECRET || '';

                if (!clientId || !clientSecret) {
                    logger.error('Missing client credentials for token refresh');
                    return false;
                }

                // For client credentials, we can just request a new token
                const refreshResponse = await medplumClient.startClientLogin(clientId, clientSecret);

                // Cast the response to include an accessToken (this matches the old TokenResponse type)
                const typedResponse = refreshResponse as unknown as { accessToken?: string; access_token?: string };

                // Get access token from the response (check both common formats)
                const accessToken = typedResponse.accessToken || typedResponse.access_token;

                // Save the new token if available
                if (accessToken) {
                    await medplumClient.setAccessToken(accessToken);

                    // Store the new token
                    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

                    // Update timestamp
                    localStorage.setItem(STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());

                    // Update profile
                    try {
                        const profile = await medplumClient.getProfileAsync();
                        if (profile) {
                            localStorage.setItem(STORAGE_KEYS.PROFILE_DETAILS, JSON.stringify(profile));
                            this._state.user = this._createUserFromProfile(profile);
                        }
                    } catch (profileError) {
                        logger.warn('Could not fetch profile after token refresh');
                    }

                    return true;
                }

                return false;
            } catch (refreshError: any) {
                logger.error('Token refresh failed', refreshError);

                // Clear authentication on refresh failure
                this._clearAuth();

                return false;
            }
        } catch (error: any) {
            logger.error('Error in refresh token flow:', error);
            return false;
        }
    }

    /**
     * Initialize authentication state from storage
     * @returns Promise resolving to whether user is authenticated
     */
    async initialize(): Promise<boolean> {
        try {
            // Check for existing authentication
            const existingAuth = await this._checkExistingAuthentication();
            if (!existingAuth) {
                logger.debug('No access token found during initialization');
                return false;
            }

            // Access token is already set by _checkExistingAuthentication

            // Check if we're offline
            const isCurrentlyOffline = isOffline();
            this._state.isOfflineMode = isCurrentlyOffline || !isServerConnected();

            // If we're offline, try to load the profile from storage
            if (this._state.isOfflineMode) {
                const profileJson = localStorage.getItem(STORAGE_KEYS.PROFILE_DETAILS);
                if (profileJson) {
                    try {
                        const profile = JSON.parse(profileJson) as ProfileResource;
                        this._state.user = this._createUserFromProfile(profile);
                        this._state.isAuthenticated = true;
                        logger.info('Restored authentication from offline storage');
                        return true;
                    } catch (parseError) {
                        logger.error('Failed to parse stored profile', parseError);
                    }
                }
                return false;
            }

            // If we're online, verify the token by getting the profile
            try {
                const profile = await medplumClient.getProfileAsync();
                if (profile) {
                    this._state.user = this._createUserFromProfile(profile);
                    this._state.isAuthenticated = true;

                    // Store profile for offline use
                    localStorage.setItem(STORAGE_KEYS.PROFILE_DETAILS, JSON.stringify(profile));
                    this._state.lastSyncTime = Date.now();

                    logger.info('Successfully authenticated with Medplum');
                    return true;
                }
            } catch (profileError) {
                logger.error('Failed to get profile', profileError);
                // Don't clear token if we're offline - it might work when we're back online
                if (!this._state.isOfflineMode) {
                    this.logout();
                }
            }

            return false;
        } catch (error: any) {
            logger.error('Error during auth initialization', error);
            return false;
        }
    }

    /**
     * Check if the user is authenticated
     * @returns Whether the user is authenticated
     */
    public isAuthenticated(): boolean {
        return this._state.isAuthenticated;
    }

    /**
     * Check if the app is in offline mode
     * @returns Whether the app is in offline mode
     */
    public isOfflineMode(): boolean {
        // Update offline status based on network connectivity
        const isLocalOffline = isOffline();
        // Use a safer approach to check server connection
        const serverConnected = typeof window !== 'undefined' ? window.navigator.onLine : false;
        this._state.isOfflineMode = isLocalOffline || !serverConnected;
        return this._state.isOfflineMode;
    }

    /**
     * Get the current user
     * @returns The current user or null if not authenticated
     */
    public getUser(): MedplumUser | null {
        return this._state.user;
    }

    /**
     * Get the access token
     * @returns The access token or null if not available
     */
    private getAccessToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }

    /**
     * Check if the token is expired
     * @returns Whether the token is expired
     */
    private isTokenExpired(): boolean {
        const token = this.getAccessToken();
        if (!token) {
            return true;
        }

        // Check token expiration based on timestamp
        // Increase token lifetime to 8 hours instead of 1 hour to reduce frequent redirects
        const timestamp = localStorage.getItem(STORAGE_KEYS.AUTH_TIMESTAMP);
        const lastAuth = timestamp ? parseInt(timestamp, 10) : 0;
        const now = Date.now();
        const hoursSinceAuth = (now - lastAuth) / (1000 * 60 * 60);

        // Consider expired after 8 hours instead of 1 hour
        return hoursSinceAuth > 8;
    }
}

// Create and export the service instance
export const medplumAuthService = new MedplumAuthService();

// Create a server-side authentication provider compatible with Refine
export const authProviderServer: AuthProvider = {
    login: async (params) => {
        try {
            return await medplumAuthService.login(params);
        } catch (error) {
            logger.error('Server-side login failed:', error);
            return {
                success: false,
                error: HttpError.fromTranslationKey('authentication.errors.login_failed')
            };
        }
    },
    logout: async () => {
        try {
            return await medplumAuthService.logout();
        } catch (error) {
            logger.error('Server-side logout failed:', error);
            return {
                success: false,
                error: HttpError.fromTranslationKey('authentication.errors.logout_failed')
            };
        }
    },
    check: async (params) => await medplumAuthService.check(params),
    getIdentity: async () => {
        try {
            return await medplumAuthService.getIdentity();
        } catch (error) {
            logger.error('Server-side identity retrieval failed:', error);
            throw HttpError.fromTranslationKey('authentication.errors.identity_retrieval_failed');
        }
    },
    onError: async (error) => {
        try {
            return await medplumAuthService.onError(error);
        } catch (processedError) {
            logger.error('Server-side error processing failed:', processedError);
            return {
                error: HttpError.fromTranslationKey('authentication.errors.error_processing_failed')
            };
        }
    }
};

// Initialize auth on load if in browser environment
if (typeof window !== 'undefined') {
    medplumAuthService.initialize().catch(error => {
        logger.error('Failed to initialize auth', error);
    });
}

// Export the service instance as default for flexibility
export default medplumAuthService;