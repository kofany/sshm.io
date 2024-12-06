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
        // Tworzymy hash z encryption key - identycznie jak w Go
        const encoder = new TextEncoder();
        const keyData = encoder.encode(encryptionKey);
        
        // Synchroniczne tworzenie hash'a
        const hashArray = new Uint8Array(32);
        crypto.getRandomValues(hashArray);
        for (let i = 0; i < keyData.length && i < 32; i++) {
            hashArray[i] = keyData[i];
        }
        this.key = hashArray;
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
            console.log('Starting decryption of:', encryptedStr);
            
            // Dekodujemy z base64
            const combined = new Uint8Array(
                atob(encryptedStr)
                    .split('')
                    .map(char => char.charCodeAt(0))
            );
            
            console.log('Decoded from base64, length:', combined.length);
    
            // Wyodrębniamy nonce i zaszyfrowane dane
            const nonce = combined.slice(0, NONCE_SIZE);
            const ciphertext = combined.slice(NONCE_SIZE);
            
            console.log('Nonce length:', nonce.length);
            console.log('Ciphertext length:', ciphertext.length);
    
            // Importujemy klucz
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                this.key,
                { name: this.ALGORITHM },
                false,
                ['decrypt']
            );
            
            console.log('Key imported successfully');
    
            // Deszyfrujemy
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: this.ALGORITHM,
                    iv: nonce
                },
                cryptoKey,
                ciphertext
            );
            
            console.log('Decryption successful');
    
            const result = new TextDecoder().decode(decrypted);
            console.log('Decoded result length:', result.length);
            
            return result;
        } catch (err: unknown) {
            const errorDetails = {
                errorType: err instanceof Error ? err.name : typeof err,
                errorMessage: err instanceof Error ? err.message : 'Unknown error',
                errorStack: err instanceof Error ? err.stack : undefined
            };
    
            console.error('Detailed decryption error:', errorDetails);
            
            throw new Error(`Decryption failed: ${errorDetails.errorMessage}`);
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

export class CryptoError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CryptoError';
    }
}