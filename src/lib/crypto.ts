// src/lib/crypto.ts
import { createHash } from 'crypto';

const KEY_SIZE = 32;
const NONCE_SIZE = 12;

export class Cipher {
    private readonly key: Uint8Array;
    private readonly ALGORITHM = 'AES-GCM';

    constructor(password: string) {
        // Generujemy klucz z hasła używając SHA-256 - identycznie jak w Go
        const hash = createHash('sha256');
        hash.update(password);
        this.key = new Uint8Array(hash.digest());
    }

    async encrypt(data: string): Promise<string> {
        try {
            // Importujemy klucz w formacie odpowiednim dla Web Crypto API
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                this.key,
                { name: this.ALGORITHM },
                false,
                ['encrypt']
            );

            // Generujemy nonce
            const nonce = window.crypto.getRandomValues(new Uint8Array(NONCE_SIZE));

            // Szyfrujemy dane
            const encodedData = new TextEncoder().encode(data);
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: this.ALGORITHM,
                    iv: nonce
                },
                cryptoKey,
                encodedData
            );

            // Łączymy nonce + zaszyfrowane dane (tak samo jak w Go)
            const combined = new Uint8Array(nonce.length + new Uint8Array(encrypted).length);
            combined.set(nonce);
            combined.set(new Uint8Array(encrypted), nonce.length);

            // Konwertujemy do base64 (tak samo jak w Go)
            return btoa(String.fromCharCode(...combined));
        } catch (err) {
            throw new Error(`Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    async decrypt(encryptedStr: string): Promise<string> {
        try {
            // Dekodujemy z base64
            const combined = new Uint8Array(
                atob(encryptedStr)
                    .split('')
                    .map(char => char.charCodeAt(0))
            );

            // Wyodrębniamy nonce i zaszyfrowane dane
            const nonce = combined.slice(0, NONCE_SIZE);
            const ciphertext = combined.slice(NONCE_SIZE);

            // Importujemy klucz
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                this.key,
                { name: this.ALGORITHM },
                false,
                ['decrypt']
            );

            // Deszyfrujemy
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: this.ALGORITHM,
                    iv: nonce
                },
                cryptoKey,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
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
}