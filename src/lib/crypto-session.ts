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
            console.log('Initializing crypto session...');
            if (!encryptionKey) {
                throw new Error('Encryption key cannot be empty');
            }
            
            // First test if we can create a cipher with this key
            const testCipher = new Cipher(encryptionKey);
            this.cipher = testCipher;
            sessionStorage.setItem(this.STORAGE_KEY, encryptionKey);
            this.encryptionFailureCount = 0;
            console.log('Crypto session initialized successfully');
        } catch (error) {
            console.error('Failed to initialize crypto session:', error);
            this.clearSession();
            throw new Error('Failed to initialize encryption');
        }
    }
    
    static getCipher(): Cipher | null {
        if (!isBrowser) {
            console.log('Not in browser environment');
            return null;
        }
    
        if (!this.cipher) {
            console.log('No active cipher, trying to restore from session storage...');
            const storedKey = sessionStorage.getItem(this.STORAGE_KEY);
            
            if (storedKey) {
                console.log('Found stored key, recreating cipher...');
                try {
                    this.cipher = new Cipher(storedKey);
                    console.log('Cipher restored successfully');
                } catch (error) {
                    console.error('Failed to restore cipher:', error);
                    this.clearSession();
                    return null;
                }
            } else {
                console.log('No stored key found');
                return null;
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

        console.log('Clearing crypto session...');
        this.cipher = null;
        this.encryptionFailureCount = 0;
        sessionStorage.removeItem(this.STORAGE_KEY);
        
        try {
            window.dispatchEvent(new CustomEvent('crypto_session_expired'));
            console.log('Crypto session cleared and event dispatched');
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
        if (!cipher) {
            console.log('No cipher available for validation');
            return false;
        }

        try {
            console.log('Validating crypto session...');
            const testData = 'test_validation_string';
            const encrypted = await cipher.encrypt(testData);
            const decrypted = await cipher.decrypt(encrypted);
            
            console.log('Validation test results:', {
                testData,
                encrypted,
                decrypted,
                success: testData === decrypted
            });

            if (decrypted === testData) {
                this.encryptionFailureCount = 0;
                console.log('Session validation successful');
                return true;
            }
            
            this.handleEncryptionFailure();
            console.log('Session validation failed - data mismatch');
            return false;
        } catch (error) {
            console.error('Session validation error:', error);
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
            throw new Error('No active encryption session');
        }

        try {
            console.log('Encrypting data...');
            const result = await cipher.encrypt(data);
            this.encryptionFailureCount = 0;
            return result;
        } catch (error) {
            console.error('Encryption failed:', error);
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
            throw new Error('No active encryption session');
        }

        try {
            console.log('Decrypting data...');
            const result = await cipher.decrypt(data);
            this.encryptionFailureCount = 0;
            return result;
        } catch (error) {
            console.error('Decryption failed:', error);
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
        console.log(`Encryption failure count: ${this.encryptionFailureCount}/${this.MAX_FAILURES}`);
        
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

    /**
     * Debug helper method
     */
    static async testEncryption(): Promise<boolean> {
        console.log('Starting encryption test...');
        const cipher = this.getCipher();
        if (!cipher) {
            console.log('No cipher available for test');
            return false;
        }

        try {
            const testData = "test_encryption_string";
            const encrypted = await cipher.encrypt(testData);
            const decrypted = await cipher.decrypt(encrypted);
            
            console.log('Encryption test results:', {
                original: testData,
                encrypted: encrypted,
                decrypted: decrypted,
                success: decrypted === testData
            });

            return decrypted === testData;
        } catch (error) {
            console.error('Encryption test failed:', error);
            return false;
        }
    }
}

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CryptoError';
    }
}