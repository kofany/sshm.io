// src/lib/auth.ts
import { CryptoSession } from './crypto-session';

export const AUTH_KEY = 'sshm_api_key';

type AuthHeaders = Record<string, string>;

export const auth = {
  // Sprawdza czy użytkownik jest zalogowany i czy sesja jest aktywna
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

  // Pobiera API key
  getApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_KEY);
  },

  // Ustawia API key (używane przy logowaniu)
  login(apiKey: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_KEY, apiKey);
  },

  // Usuwa API key i klucz szyfrujący (wylogowanie)
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

  // Zwraca standardowe nagłówki z API key
  getAuthHeaders(): HeadersInit {
    const apiKey = this.getApiKey();
    
    return {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey || '',
    };
  }
};