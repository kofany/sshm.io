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

    /**
     * Initialize encryption session with provided key
     */
    static initializeSession(encryptionKey: string): void {
        if (!isBrowser) return;

        try {
            this.cipher = new Cipher(encryptionKey);
            sessionStorage.setItem(this.STORAGE_KEY, encryptionKey);
        } catch (error) {
            console.error('Failed to initialize crypto session:', error);
            this.clearSession();
            throw new Error('Failed to initialize encryption');
        }
    }

    /**
     * Get current cipher instance or try to restore it from session storage
     */
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

    /**
     * Get current encryption key from session storage
     */
    static getEncryptionKey(): string | null {
        if (!isBrowser) return null;
        return sessionStorage.getItem(this.STORAGE_KEY);
    }

    /**
     * Clear encryption session and trigger session expired event
     */
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

    /**
     * Validate encryption session by performing test encryption/decryption
     */
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

    /**
     * Helper method for encrypting data
     */
    static async encrypt(data: string): Promise<string> {
        const cipher = this.getCipher();
        if (!cipher) {
            throw new Error('No active encryption session');
        }
        return cipher.encrypt(data);
    }

    /**
     * Helper method for decrypting data
     */
    static async decrypt(data: string): Promise<string> {
        const cipher = this.getCipher();
        if (!cipher) {
            throw new Error('No active encryption session');
        }
        return cipher.decrypt(data);
    }

    /**
     * Check if there is an active encryption session
     */
    static hasActiveSession(): boolean {
        return this.getCipher() !== null;
    }

    /**
     * Helper method to migrate encryption key if needed
     * (e.g., when changing encryption key)
     */
    static async migrateEncryptionKey(oldKey: string, newKey: string, data: any): Promise<any> {
        const oldCipher = new Cipher(oldKey);
        const newCipher = new Cipher(newKey);

        try {
            // Helper function to process nested objects
            const processObject = async (obj: any): Promise<any> => {
                if (typeof obj !== 'object' || obj === null) return obj;

                const result: any = Array.isArray(obj) ? [] : {};

                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'string' && value.startsWith('encrypted:')) {
                        // Decrypt with old key and encrypt with new key
                        const decrypted = await oldCipher.decrypt(value.substring(10));
                        const encrypted = await newCipher.encrypt(decrypted);
                        result[key] = `encrypted:${encrypted}`;
                    } else if (typeof value === 'object' && value !== null) {
                        result[key] = await processObject(value);
                    } else {
                        result[key] = value;
                    }
                }

                return result;
            };

            return await processObject(data);
        } catch (error) {
            console.error('Failed to migrate encryption key:', error);
            throw new Error('Encryption key migration failed');
        }
    }
}

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CryptoError';
    }
}