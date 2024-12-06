// src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const KEY_SIZE = 32;
const NONCE_SIZE = 12; // AES-GCM uses 12 bytes nonce

export class Cipher {
    private readonly key: Buffer;
    private readonly ALGORITHM = 'aes-256-gcm';

    constructor(password: string) {
        // Generate key from password using SHA-256, same as Go
        const hash = createHash('sha256');
        hash.update(password);
        this.key = Buffer.from(hash.digest());
    }

    async encrypt(data: string): Promise<string> {
        try {
            // Generate nonce
            const nonce = randomBytes(NONCE_SIZE);

            // Create cipher
            const cipher = createCipheriv(this.ALGORITHM, this.key, nonce);

            // Encrypt
            const encryptedBuffer = Buffer.concat([
                cipher.update(data, 'utf8'),
                cipher.final()
            ]);

            // Get auth tag
            const authTag = cipher.getAuthTag();

            // Combine nonce + encrypted data + auth tag (same format as Go)
            const combined = Buffer.concat([
                nonce,
                encryptedBuffer,
                authTag
            ]);

            // Return as base64 (standard encoding)
            return combined.toString('base64');
        } catch (err) {
            throw new Error(`Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    async decrypt(encryptedStr: string): Promise<string> {
        try {
            // Decode from base64
            const encrypted = Buffer.from(encryptedStr, 'base64');

            // Check minimum length
            if (encrypted.length < NONCE_SIZE) {
                throw new Error('encrypted data too short');
            }

            // Extract parts
            const nonce = encrypted.slice(0, NONCE_SIZE);
            const authTag = encrypted.slice(-16); // GCM auth tag is always 16 bytes
            const ciphertext = encrypted.slice(NONCE_SIZE, -16);

            // Create decipher
            const decipher = createDecipheriv(this.ALGORITHM, this.key, nonce);
            decipher.setAuthTag(authTag);

            // Decrypt
            const decrypted = Buffer.concat([
                decipher.update(ciphertext),
                decipher.final()
            ]);

            return decrypted.toString('utf8');
        } catch (err) {
            throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    static async validateKey(cipher: Cipher, testData: string = 'test'): Promise<boolean> {
        try {
            const encrypted = await cipher.encrypt(testData);
            const decrypted = await cipher.decrypt(encrypted);
            return decrypted === testData;
        } catch {
            return false;
        }
    }

    static generateKeyFromPassword(password: string): Buffer {
        // Pad password to 32 bytes
        const paddedPass = Buffer.alloc(32);
        paddedPass.write(password);

        // Encode using base64 and take first 32 chars
        return Buffer.from(
            paddedPass.toString('base64').substring(0, 32)
        );
    }

    static generateSecureKey(): Buffer {
        return randomBytes(KEY_SIZE);
    }
}

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CryptoError';
    }
}

