import { Cipher } from './crypto';

const isBrowser = typeof window !== 'undefined';

declare global {
  interface WindowEventMap {
    'crypto_session_expired': CustomEvent<null>;
  }
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
        this.cipher = new Cipher(key);
      }
    }
    return this.cipher;
  }

  static setEncryptionKey(key: string): void {
    if (!isBrowser) return;
    
    sessionStorage.setItem(this.STORAGE_KEY, key);
    this.cipher = new Cipher(key);
    this.resetTimeout();
  }

  static getEncryptionKey(): string | null {
    if (!isBrowser) return null;
    
    const key = sessionStorage.getItem(this.STORAGE_KEY);
    if (key) {
      this.resetTimeout();
    }
    return key;
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
      this.clearEncryptionKey();
    }, this.SESSION_TIMEOUT);
  }

  private static dispatchSessionExpired(): void {
    if (!isBrowser) return;
    
    window.dispatchEvent(new CustomEvent('crypto_session_expired'));
  }

  static checkSessionTimeout(): boolean {
    if (!isBrowser) return false;
    
    const key = this.getEncryptionKey();
    return !!key;
  }
}