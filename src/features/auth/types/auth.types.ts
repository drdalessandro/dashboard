// src/features/auth/types/auth.types.ts

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  offline: {
    isOffline: boolean;
    offlineAuthenticated: boolean;
  };
}

/**
 * User information
 */
export interface User {
  id: string;
  name?: string;
  resourceType: string;
  practitionerId?: string;
  profile?: {
    display?: string;
    reference?: string;
  };
  offlineAccessEnabled?: boolean;
  roles?: string[];
  language?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberDevice?: boolean;
}

/**
 * Authentication token information
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  profile?: string;
}

/**
 * Options for offline authentication
 */
export interface OfflineAuthOptions {
  enableBiometrics?: boolean;
  deviceIdentifier?: string;
  offlineTokenDuration?: number; // in days
}
