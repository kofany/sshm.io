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
    private static encryptionFailureCount: number = 0;
    private static readonly MAX_FAILURES = 3;

    /**
     * Initialize encryption session with provided encryption key
     */
    static initializeSession(encryptionKey: string): void {
        if (!isBrowser) return;

        try {
            this.cipher = new Cipher(encryptionKey);
            sessionStorage.setItem(this.STORAGE_KEY, encryptionKey);
            this.encryptionFailureCount = 0;
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
        this.encryptionFailureCount = 0;
        sessionStorage.removeItem(this.STORAGE_KEY);
        
        try {
            window.dispatchEvent(new CustomEvent('crypto_session_expired'));
        } catch (error) {
            console.error('Failed to dispatch session expired event:', error);
        }
    }

    /**
     * Validate encryption key and cipher by performing a test encryption/decryption
     */
    static async validateSession(): Promise<boolean> {
        if (!isBrowser) return false;

        const cipher = this.getCipher();
        if (!cipher) return false;

        try {
            const testData = 'test';
            const encrypted = await cipher.encrypt(testData);
            const decrypted = await cipher.decrypt(encrypted);
            
            if (decrypted === testData) {
                this.encryptionFailureCount = 0;
                return true;
            }
            
            this.handleEncryptionFailure();
            return false;
        } catch (error) {
            console.error('Session validation failed:', error);
            this.handleEncryptionFailure();
            return false;
        }
    }

    /**
     * Helper method for encrypting data
     */
    static async encrypt(data: string): Promise<string> {
        const cipher = this.getCipher();
        if (!cipher) {
            throw new CryptoError('No active encryption session');
        }

        try {
            const result = await cipher.encrypt(data);
            this.encryptionFailureCount = 0;
            return result;
        } catch (error) {
            this.handleEncryptionFailure();
            throw error;
        }
    }

    /**
     * Helper method for decrypting data
     */
    static async decrypt(data: string): Promise<string> {
        const cipher = this.getCipher();
        if (!cipher) {
            throw new CryptoError('No active encryption session');
        }

        try {
            const result = await cipher.decrypt(data);
            this.encryptionFailureCount = 0;
            return result;
        } catch (error) {
            this.handleEncryptionFailure();
            throw error;
        }
    }

    /**
     * Check if there is an active encryption session
     */
    static hasActiveSession(): boolean {
        return this.getCipher() !== null && this.getEncryptionKey() !== null;
    }

    /**
     * Handle encryption/decryption failures
     */
    private static handleEncryptionFailure(): void {
        this.encryptionFailureCount++;
        
        if (this.encryptionFailureCount >= this.MAX_FAILURES) {
            console.error('Maximum encryption failures reached, clearing session');
            this.clearSession();
        }
    }

    /**
     * Reset failure counter
     */
    static resetFailureCount(): void {
        this.encryptionFailureCount = 0;
    }
}

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CryptoError';
    }
}