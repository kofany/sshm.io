// src/lib/crypto-session.ts
import { Cipher } from './crypto';

const isBrowser = typeof window !== 'undefined';

interface CryptoSessionEvents {
  'crypto_session_expired': CustomEvent<void>;
}

declare global {
  interface WindowEventMap extends CryptoSessionEvents {}
}

export class CryptoSession {
  private static readonly STORAGE_KEY = 'encryption_key';
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minut
  private static timeoutId: NodeJS.Timeout | null = null;
  private static cipher: Cipher | null = null;

  static getCipher(): Cipher | null {
      if (!this.cipher && isBrowser) {
          const key = this.getEncryptionKey();
          if (key) {
              try {
                  this.cipher = new Cipher(key);
                  // Reset timeoutu przy każdym użyciu
                  this.resetTimeout();
              } catch (error) {
                  console.error('Failed to create cipher:', error);
                  this.clearEncryptionKey();
                  return null;
              }
          }
      }
      return this.cipher;
  }

  static setEncryptionKey(key: string): void {
      if (!isBrowser) return;
      
      try {
          // Najpierw sprawdź czy klucz jest poprawny
          const cipher = new Cipher(key);
          this.cipher = cipher;
          sessionStorage.setItem(this.STORAGE_KEY, key);
          this.resetTimeout();
      } catch (error) {
          console.error('Invalid encryption key:', error);
          this.clearEncryptionKey();
          throw new Error('Invalid encryption key');
      }
  }

  static getEncryptionKey(): string | null {
      if (!isBrowser) return null;
      
      try {
          const key = sessionStorage.getItem(this.STORAGE_KEY);
          if (key) {
              this.resetTimeout();
          }
          return key;
      } catch (error) {
          console.error('Failed to get encryption key:', error);
          this.clearEncryptionKey();
          return null;
      }
  }

  static clearEncryptionKey(): void {
      if (!isBrowser) return;
      
      sessionStorage.removeItem(this.STORAGE_KEY);
      this.cipher = null;
      if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
      }
      this.dispatchSessionExpired();
  }

  private static resetTimeout(): void {
      if (!isBrowser) return;
      
      if (this.timeoutId) {
          clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
          // Zapisz aktualny stan przed wyczyszczeniem
          const hadCipher = !!this.cipher;
          
          this.clearEncryptionKey();
          
          // Wyślij event tylko jeśli rzeczywiście był cipher
          if (hadCipher) {
              this.dispatchSessionExpired();
          }
      }, this.SESSION_TIMEOUT);
  }

  private static dispatchSessionExpired(): void {
      if (!isBrowser) return;
      
      window.dispatchEvent(new CustomEvent('crypto_session_expired'));
  }

  static checkSessionTimeout(): boolean {
      if (!isBrowser) return false;
      
      const key = this.getEncryptionKey();
      if (key) {
          try {
              // Sprawdź czy klucz jest nadal poprawny
              const cipher = new Cipher(key);
              this.cipher = cipher;
              this.resetTimeout();
              return true;
          } catch (error) {
              this.clearEncryptionKey();
              return false;
          }
      }
      return false;
  }
}