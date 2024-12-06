// src/lib/crypto.ts
import { secretbox, randomBytes } from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { SHA256 } from 'crypto-js';

const KEY_SIZE = 32;
const NONCE_SIZE = 24;

export class Cipher {
    private key: Uint8Array;

    constructor(password: string) {
        // Generowanie klucza z hasła używając SHA-256, tak samo jak w Go
        const hash = SHA256(password);
        this.key = new Uint8Array(KEY_SIZE);
        
        // Konwertujemy hash na Uint8Array tak samo jak w Go
        const hashBytes = Buffer.from(hash.toString(), 'hex');
        this.key.set(hashBytes.slice(0, KEY_SIZE));
    }

    async encrypt(data: string): Promise<string> {
        // Generujemy nonce
        const nonce = randomBytes(NONCE_SIZE);

        // Konwertujemy string na Uint8Array
        const messageUint8 = new TextEncoder().encode(data);

        // Szyfrujemy używając secretbox (kompatybilne z Go)
        const encrypted = secretbox(messageUint8, nonce, this.key);

        // Łączymy nonce i zaszyfrowane dane
        const fullMessage = new Uint8Array(nonce.length + encrypted.length);
        fullMessage.set(nonce);
        fullMessage.set(encrypted, nonce.length);

        // Kodujemy do base64 (standardowe kodowanie)
        return encodeBase64(fullMessage);
    }

    async decrypt(encryptedStr: string): Promise<string> {
        try {
            // Dekodujemy z base64
            const encrypted = decodeBase64(encryptedStr);

            // Sprawdzamy długość
            if (encrypted.length < NONCE_SIZE) {
                throw new Error('encrypted data too short');
            }

            // Wyodrębniamy nonce
            const nonce = encrypted.slice(0, NONCE_SIZE);
            const message = encrypted.slice(NONCE_SIZE);

            // Deszyfrujemy
            const decrypted = secretbox.open(message, nonce, this.key);
            if (!decrypted) {
                throw new Error('decryption failed');
            }

            // Konwertujemy z powrotem na string
            return new TextDecoder().decode(decrypted);
        } catch (err) {
            if (err instanceof Error) {
                throw new Error(`Decryption error: ${err.message}`);
            }
            throw new Error('Unknown decryption error');
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

    static generateKeyFromPassword(password: string): Uint8Array {
        // Dopełniamy hasło do 32 bajtów
        const paddedPass = new Uint8Array(32);
        const passBytes = new TextEncoder().encode(password);
        paddedPass.set(passBytes);

        // Kodujemy using base64 i bierzemy pierwsze 32 znaki
        return new TextEncoder().encode(
            Buffer.from(paddedPass).toString('base64').substring(0, 32)
        );
    }
}

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CryptoError';
    }
}
