// src/lib/auth.ts
import { CryptoSession } from './crypto-session';

export const AUTH_KEY = 'sshm_api_key';

type AuthHeaders = HeadersInit & {
  'Content-Type': string;
  'X-Api-Key': string;
  'X-Requested-With': string;
};

export const auth = {
  /**
   * Checks if user is authenticated and session is active
   */
  async isAuthenticated(): Promise<boolean> {
    const apiKey = this.getApiKey();
    if (!apiKey) return false;

    try {
      const response = await fetch('/api/v1/check-session', {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === 'success';
    } catch {
      return false;
    }
  },

  /**
   * Gets API key from local storage
   */
  getApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_KEY);
  },

  /**
   * Sets API key (used during login)
   */
  login(apiKey: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_KEY, apiKey);
  },

  /**
   * Removes API key and encryption key (logout)
   */
  async logout(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch('/api/v1/logout', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        console.error('Logout request failed:', response.status);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(AUTH_KEY);
      CryptoSession.clearSession();
    }
  },

  /**
   * Returns standard headers with API key for requests
   */
  getAuthHeaders(): HeadersInit {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error('No API key available');
    }
    
    return {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Requested-With': 'XMLHttpRequest'
    } as AuthHeaders;
  },

  /**
   * Checks if there is an active session
   */
  hasActiveSession(): boolean {
    return this.getApiKey() !== null && CryptoSession.hasActiveSession();
  },

  /**
   * Validates current session with the server
   */
  async validateSession(): Promise<boolean> {
    if (!this.hasActiveSession()) {
      return false;
    }

    try {
      const response = await fetch('/api/v1/check-session', {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      return data.status === 'success';
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  },

  /**
   * Refreshes current session
   */
  async refreshSession(): Promise<boolean> {
    if (!this.hasActiveSession()) {
      return false;
    }

    try {
      await this.validateSession();
      return true;
    } catch {
      return false;
    }
  }
};