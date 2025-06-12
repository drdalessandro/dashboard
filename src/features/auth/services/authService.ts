// src/features/auth/services/authService.ts
import { MedplumClient } from '@medplum/core';
import { LoginCredentials, TokenResponse, User, OfflineAuthOptions } from '../types/auth.types';

/**
 * Service for handling authentication operations with offline-first capabilities
 * Provides methods for login, logout, token management, and offline authentication
 */
export const authService = {
  // Cached authentication data
  _cachedAuth: {
    user: null as User | null,
    token: null as string | null,
    offlineMode: false
  },

  // Storage keys
  _storageKeys: {
    TOKEN: 'auth_token',
    USER: 'auth_user',
    OFFLINE_AUTH: 'offline_auth',
    OFFLINE_TOKEN: 'offline_token',
    DEVICE_ID: 'device_id',
    BIOMETRICS_ENABLED: 'biometrics_enabled'
  },

  // Medplum client instance
  _medplumClient: null as MedplumClient | null,

  /**
   * Initialize the auth service with a Medplum client
   */
  initialize(medplumClient: MedplumClient): void {
    this._medplumClient = medplumClient;
    
    // Check if we have a token in storage and try to restore session
    const token = localStorage.getItem(this._storageKeys.TOKEN);
    const userStr = localStorage.getItem(this._storageKeys.USER);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this._cachedAuth.token = token;
        this._cachedAuth.user = user;
        
        // Set the token in the medplum client
        if (this._medplumClient) {
          this._medplumClient.setAccessToken(token);
        }
      } catch (error) {
        console.error('Error restoring auth session:', error);
        this.clearAuthData();
      }
    }
  },

  /**
   * Login with email and password
   * Stores token and user data for offline access
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      if (!this._medplumClient) {
        throw new Error('Medplum client not initialized');
      }
      
      // Attempt to login with Medplum
      const loginResponse = await this._medplumClient.startLogin({
        email: credentials.email,
        password: credentials.password,
        remember: credentials.rememberDevice
      });
      
      if (!loginResponse) {
        throw new Error('Login failed - no response received');
      }
      
      // Get the profile from the client
      const profile = this._medplumClient.getProfile();
      if (!profile) {
        throw new Error('Login failed - no profile received');
      }
      
      // Get the access token
      const accessToken = this._medplumClient.getAccessToken();
      if (!accessToken) {
        throw new Error('Login failed - no access token received');
      }
      
      // Create user object
      const user: User = {
        id: profile.id || '',
        name: profile.name?.[0]?.given?.[0] || credentials.email,
        resourceType: profile.resourceType,
        profile: {
          display: profile.name?.[0]?.text || '',
          reference: `${profile.resourceType}/${profile.id}`
        },
        offlineAccessEnabled: credentials.rememberDevice,
        language: profile.language || navigator.language
      };
      
      // Save token and user data
      this._cachedAuth.token = accessToken;
      this._cachedAuth.user = user;
      this._cachedAuth.offlineMode = false;
      
      // Store in local storage for offline access if remember device is enabled
      if (credentials.rememberDevice) {
        localStorage.setItem(this._storageKeys.TOKEN, accessToken);
        localStorage.setItem(this._storageKeys.USER, JSON.stringify(user));
        
        // Store offline specific data
        this.setupOfflineAuth({
          enableBiometrics: false, // Default value, can be enabled later
          deviceIdentifier: this.generateDeviceId(),
          offlineTokenDuration: 30 // 30 days by default
        });
      }
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      
      // Try offline login if we're offline
      if (!navigator.onLine && this.isOfflineAuthAvailable()) {
        return this.offlineLogin();
      }
      
      throw error;
    }
  },

  /**
   * Log out the current user
   * Clears tokens and user data
   */
  async logout(): Promise<void> {
    try {
      if (this._medplumClient && navigator.onLine) {
        await this._medplumClient.signOut();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearAuthData();
    }
  },

  /**
   * Clear all authentication data from memory and storage
   */
  clearAuthData(): void {
    this._cachedAuth.token = null;
    this._cachedAuth.user = null;
    this._cachedAuth.offlineMode = false;
    
    localStorage.removeItem(this._storageKeys.TOKEN);
    localStorage.removeItem(this._storageKeys.USER);
    localStorage.removeItem('user_info'); // Also clear user info from local storage
    
    // Don't clear offline auth data as it might be needed for future offline login
    // Call clearOfflineAuth() explicitly if needed
  },

  /**
   * Clear offline authentication data
   */
  clearOfflineAuth(): void {
    localStorage.removeItem(this._storageKeys.OFFLINE_AUTH);
    localStorage.removeItem(this._storageKeys.OFFLINE_TOKEN);
    localStorage.removeItem(this._storageKeys.DEVICE_ID);
    localStorage.removeItem(this._storageKeys.BIOMETRICS_ENABLED);
  },

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this._cachedAuth.token && !!this._cachedAuth.user;
  },

  /**
   * Get the current user
   */
  getUser(): User | null {
    return this._cachedAuth.user;
  },

  /**
   * Get the current token
   */
  getToken(): string | null {
    return this._cachedAuth.token;
  },

  /**
   * Check if we're in offline mode
   */
  isOfflineMode(): boolean {
    return this._cachedAuth.offlineMode;
  },

  /**
   * Setup offline authentication
   */
  setupOfflineAuth(options: OfflineAuthOptions): void {
    const deviceId = options.deviceIdentifier || this.generateDeviceId();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (options.offlineTokenDuration || 30));
    
    const offlineAuth = {
      deviceId,
      biometricsEnabled: options.enableBiometrics || false,
      expiryDate: expiryDate.toISOString()
    };
    
    localStorage.setItem(this._storageKeys.OFFLINE_AUTH, JSON.stringify(offlineAuth));
    localStorage.setItem(this._storageKeys.DEVICE_ID, deviceId);
    localStorage.setItem(this._storageKeys.BIOMETRICS_ENABLED, String(options.enableBiometrics || false));
    
    // Store token specifically for offline use
    if (this._cachedAuth.token) {
      localStorage.setItem(this._storageKeys.OFFLINE_TOKEN, this._cachedAuth.token);
    }
  },

  /**
   * Check if offline authentication is available
   */
  isOfflineAuthAvailable(): boolean {
    try {
      const offlineAuthStr = localStorage.getItem(this._storageKeys.OFFLINE_AUTH);
      if (!offlineAuthStr) return false;
      
      const offlineAuth = JSON.parse(offlineAuthStr);
      const expiryDate = new Date(offlineAuth.expiryDate);
      
      // Check if token is expired
      if (expiryDate < new Date()) {
        return false;
      }
      
      return !!localStorage.getItem(this._storageKeys.OFFLINE_TOKEN);
    } catch (error) {
      console.error('Error checking offline auth:', error);
      return false;
    }
  },

  /**
   * Authenticate using offline credentials
   */
  offlineLogin(): User {
    try {
      const userStr = localStorage.getItem(this._storageKeys.USER);
      const offlineToken = localStorage.getItem(this._storageKeys.OFFLINE_TOKEN);
      
      if (!userStr || !offlineToken) {
        throw new Error('Offline login failed - missing user data or token');
      }
      
      const user = JSON.parse(userStr) as User;
      
      // Set offline mode
      this._cachedAuth.user = user;
      this._cachedAuth.token = offlineToken;
      this._cachedAuth.offlineMode = true;
      
      return user;
    } catch (error) {
      console.error('Offline login error:', error);
      throw new Error('Offline authentication failed');
    }
  },

  /**
   * Enable biometric authentication for offline access
   */
  async enableBiometrics(): Promise<boolean> {
    try {
      // This is a placeholder - actual biometric implementation would depend on platform
      // For example, using the Web Authentication API or a native plugin
      
      // For now, just set the flag
      localStorage.setItem(this._storageKeys.BIOMETRICS_ENABLED, 'true');
      
      // Update offline auth data
      const offlineAuthStr = localStorage.getItem(this._storageKeys.OFFLINE_AUTH);
      if (offlineAuthStr) {
        const offlineAuth = JSON.parse(offlineAuthStr);
        offlineAuth.biometricsEnabled = true;
        localStorage.setItem(this._storageKeys.OFFLINE_AUTH, JSON.stringify(offlineAuth));
      }
      
      return true;
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      return false;
    }
  },

  /**
   * Generate a device identifier for offline auth
   */
  generateDeviceId(): string {
    // Check if we already have a device ID
    const existingId = localStorage.getItem(this._storageKeys.DEVICE_ID);
    if (existingId) return existingId;
    
    // Generate a new UUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<string | null> {
    try {
      if (!this._medplumClient || !navigator.onLine) {
        throw new Error('Cannot refresh token - offline or client not initialized');
      }
      
      // Attempt to refresh token via Medplum
      // Use internal method since we don't have direct refreshToken access
      try {
        // First signout to clear current token
        await this._medplumClient.signOut();
        
        // Then try to relogin using stored credentials if available
        const userStr = localStorage.getItem(this._storageKeys.USER);
        if (userStr) {
          const user = JSON.parse(userStr) as User;
          // This would typically require saved credentials or other refresh mechanism
          // For now, we'll just simulate a token refresh by getting current token
        }
      } catch (refreshError) {
        console.error('Error during token refresh process:', refreshError);
      }
      
      const newToken = this._medplumClient.getAccessToken();
      
      if (newToken) {
        // Update cached auth and storage
        this._cachedAuth.token = newToken;
        localStorage.setItem(this._storageKeys.TOKEN, newToken);
        localStorage.setItem(this._storageKeys.OFFLINE_TOKEN, newToken);
        
        return newToken;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
};
