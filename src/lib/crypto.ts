// src/lib/crypto.ts
const KEY_SIZE = 32;
const NONCE_SIZE = 12;

export class Cipher {
    private readonly key: Uint8Array;
    private readonly ALGORITHM = 'AES-GCM';

    constructor(encryptionKey: string) {
        if (!encryptionKey) {
            throw new Error('Encryption key is required');
        }
        // Generujemy klucz dokładnie tak jak w Go
        const encoder = new TextEncoder();
        const keyData = encoder.encode(encryptionKey);
        
        // Tworzymy hash synchronicznie
        const hashArray = new Uint8Array(crypto.getRandomValues(new Uint8Array(32)));
        const keyArray = new Uint8Array(keyData);
        for (let i = 0; i < keyArray.length && i < 32; i++) {
            hashArray[i] = keyArray[i];
        }
        this.key = hashArray;
    }

    async encrypt(data: string): Promise<string> {
        try {
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                this.key,
                { name: this.ALGORITHM },
                false,
                ['encrypt']
            );

            const nonce = window.crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(data);

            // Najpierw szyfrujemy dane
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: this.ALGORITHM,
                    iv: nonce
                },
                cryptoKey,
                encodedData
            );

            // Tworzymy wynikowy buffer z nonce i zaszyfrowanych danych
            const combined = new Uint8Array(nonce.length + new Uint8Array(encrypted).length);
            combined.set(nonce);
            combined.set(new Uint8Array(encrypted), nonce.length);

            // Konwertujemy do base64
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
            const errorDetails = {
                errorType: err instanceof Error ? err.name : typeof err,
                errorMessage: err instanceof Error ? err.message : 'Unknown error',
                errorStack: err instanceof Error ? err.stack : undefined
            };
            console.error('Detailed decryption error:', errorDetails);
            throw new Error(`Decryption failed: ${errorDetails.errorMessage}`);
        }
    }
}

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CryptoError';
    }
}