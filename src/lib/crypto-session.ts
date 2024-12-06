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
    private static readonly STORAGE_KEY = 'sshm_encryption_key';
    private static cipher: Cipher | null = null;

    // Inicjalizacja przy logowaniu
    static initializeSession(password: string): void {
        if (!isBrowser) return;

        try {
            this.cipher = new Cipher(password);
            sessionStorage.setItem(this.STORAGE_KEY, password);
        } catch (error) {
            console.error('Failed to initialize crypto session:', error);
            this.clearSession();
            throw new Error('Failed to initialize encryption');
        }
    }

    static getCipher(): Cipher | null {
        if (!isBrowser) return null;

        if (!this.cipher) {
            const storedKey = sessionStorage.getItem(this.STORAGE_KEY);
            if (storedKey) {
                try {
                    this.cipher = new Cipher(storedKey);
                } catch (error) {
                    console.error('Failed to restore cipher:', error);
                    this.clearSession();
                    return null;
                }
            }
        }
        return this.cipher;
    }

    static getEncryptionKey(): string | null {
        if (!isBrowser) return null;
        return sessionStorage.getItem(this.STORAGE_KEY);
    }

    static clearSession(): void {
        if (!isBrowser) return;

        this.cipher = null;
        sessionStorage.removeItem(this.STORAGE_KEY);
        try {
            window.dispatchEvent(new CustomEvent('crypto_session_expired'));
        } catch (error) {
            console.error('Failed to dispatch session expired event:', error);
        }
    }

    // Weryfikacja czy sesja jest aktywna i ważna
    static async validateSession(): Promise<boolean> {
        if (!isBrowser) return false;

        const cipher = this.getCipher();
        if (!cipher) return false;

        try {
            const testData = 'test';
            const encrypted = await cipher.encrypt(testData);
            const decrypted = await cipher.decrypt(encrypted);
            return decrypted === testData;
        } catch (error) {
            console.error('Session validation failed:', error);
            this.clearSession();
            return false;
        }
    }

    // Pomocnicza metoda do szyfrowania
    static async encrypt(data: string): Promise<string> {
        const cipher = this.getCipher();
        if (!cipher) {
            throw new Error('No active encryption session');
        }
        return cipher.encrypt(data);
    }

    // Pomocnicza metoda do deszyfrowania
    static async decrypt(data: string): Promise<string> {
        const cipher = this.getCipher();
        if (!cipher) {
            throw new Error('No active encryption session');
        }
        return cipher.decrypt(data);
    }
}

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CryptoError';
    }
}