// src/lib/crypto.ts
const KEY_SIZE = 32;
const BLOCK_SIZE = 16; // AES block size

export class Cipher {
    private readonly key: Uint8Array;
    private readonly ALGORITHM = 'AES-CBC';

    constructor(encryptionKey: string) {
        // Klucz musi mieć 32 znaki
        const paddedKey = encryptionKey.padEnd(32, '0').slice(0, 32);
        this.key = new TextEncoder().encode(paddedKey);
    }

    async encrypt(data: string): Promise<string> {
        try {
            // Generuj IV
            const iv = window.crypto.getRandomValues(new Uint8Array(BLOCK_SIZE));
            
            // Import klucza
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                this.key,
                { name: this.ALGORITHM },
                false,
                ['encrypt']
            );

            // Padding danych PKCS7
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(data);
            const padded = this.pkcs7Pad(dataBytes);

            // Szyfrowanie
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: this.ALGORITHM,
                    iv: iv
                },
                cryptoKey,
                padded
            );

            // Połącz IV + zaszyfrowane dane
            const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            // Konwertuj do hex
            return Array.from(combined)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (err) {
            throw new Error(`Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    async decrypt(encryptedHex: string): Promise<string> {
        try {
            // Konwertuj z hex do bytes
            const bytes = new Uint8Array(
                encryptedHex.match(/.{1,2}/g)!
                    .map(byte => parseInt(byte, 16))
            );

            // Wydziel IV i dane
            const iv = bytes.slice(0, BLOCK_SIZE);
            const data = bytes.slice(BLOCK_SIZE);

            // Import klucza
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                this.key,
                { name: this.ALGORITHM },
                false,
                ['decrypt']
            );

            // Deszyfrowanie
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: this.ALGORITHM,
                    iv: iv
                },
                cryptoKey,
                data
            );

            // Usuń padding i konwertuj do string
            const unpadded = this.pkcs7Unpad(new Uint8Array(decrypted));
            return new TextDecoder().decode(unpadded);
        } catch (err) {
            throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    // PKCS7 padding implementation
    private pkcs7Pad(data: Uint8Array): Uint8Array {
        const padLength = BLOCK_SIZE - (data.length % BLOCK_SIZE);
        const padding = new Uint8Array(padLength).fill(padLength);
        const padded = new Uint8Array(data.length + padLength);
        padded.set(data);
        padded.set(padding, data.length);
        return padded;
    }

    private pkcs7Unpad(data: Uint8Array): Uint8Array {
        const padLength = data[data.length - 1];
        return data.slice(0, data.length - padLength);
    }
}