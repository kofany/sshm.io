// src/lib/auth.ts
import { CryptoSession } from './crypto-session';

export const AUTH_KEY = 'sshm_api_key';

export const auth = {
  // Sprawdza czy użytkownik jest zalogowany i czy sesja jest aktywna
  async isAuthenticated(): Promise<boolean> {
    const apiKey = this.getApiKey();
    if (!apiKey) return false;

    try {
      const response = await fetch('/api/v1/check-session', {
        headers: this.getAuthHeaders()
      });
      const data = await response.json();
      return data.status === 'success';
    } catch {
      return false;
    }
  },

  // Pobiera API key
  getApiKey(): string | null {
    return localStorage.getItem(AUTH_KEY);
  },

  // Ustawia API key (używane przy logowaniu)
  login(apiKey: string): void {
    localStorage.setItem(AUTH_KEY, apiKey);
  },

  // Usuwa API key i klucz szyfrujący (wylogowanie)
  async logout(): Promise<void> {
    try {
      await fetch('/api/v1/logout', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } finally {
      localStorage.removeItem(AUTH_KEY);
      CryptoSession.clearEncryptionKey();
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