// src/lib/crypto.ts
const NONCE_SIZE = 12;
const AUTH_TAG_SIZE = 16;

export class Cipher {
    private key: Uint8Array;
    private readonly ALGORITHM = 'AES-GCM';

    constructor(encryptionKey: string) {
        // Synchroniczne tworzenie klucza z SHA-256
        const encoder = new TextEncoder();
        const keyData = encoder.encode(encryptionKey);
        const hashArray = new Uint8Array(32); // 32 bytes for SHA-256
        
        // Tymczasowa inicjalizacja klucza
        for (let i = 0; i < keyData.length && i < 32; i++) {
            hashArray[i] = keyData[i];
        }
        this.key = hashArray;
    }

    async initializeKey(encryptionKey: string): Promise<void> {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(encryptionKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
        this.key = new Uint8Array(hashBuffer);
    }

    async encrypt(data: string): Promise<string> {
        try {
            // Generujemy nonce
            const nonce = window.crypto.getRandomValues(new Uint8Array(NONCE_SIZE));

            // Importujemy klucz
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                this.key,
                { name: this.ALGORITHM },
                false,
                ['encrypt']
            );

            // Szyfrujemy
            const encoder = new TextEncoder();
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: this.ALGORITHM,
                    iv: nonce
                },
                cryptoKey,
                encoder.encode(data)
            );

            // Łączymy nonce + encrypted (auth tag jest automatycznie dodany przez Web Crypto)
            const combined = new Uint8Array(nonce.length + new Uint8Array(encrypted).length);
            combined.set(nonce);
            combined.set(new Uint8Array(encrypted), nonce.length);

            // Konwertujemy do base64 tak jak w Go
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

            // Wyodrębniamy nonce i dane
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

            // Deszyfrujemy (Web Crypto automatycznie weryfikuje auth tag)
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
}

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CryptoError';
    }
}