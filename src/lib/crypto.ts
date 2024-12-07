// src/lib/crypto.ts

const ALGORITHM = 'aes-256-cbc';
const BLOCK_SIZE = 16;
const KEY_SIZE = 32;

export class Cipher {
    private key: Uint8Array;

    constructor(password: string) {
        const encoder = new TextEncoder();
        this.key = new Uint8Array(KEY_SIZE);
        const passwordBytes = encoder.encode(password);
        
        for (let i = 0; i < KEY_SIZE; i++) {
            this.key[i] = i < passwordBytes.length ? passwordBytes[i] : 0;
        }
    }

    async encrypt(data: string): Promise<string> {
        try {
            // Generate random IV
            const iv = crypto.getRandomValues(new Uint8Array(BLOCK_SIZE));

            // Import key for AES-CBC
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                this.key,
                {
                    name: 'AES-CBC',
                    length: 256
                },
                false,
                ['encrypt']
            );

            // Convert string to bytes and pad
            const encoder = new TextEncoder();
            const plaintext = encoder.encode(data);
            const padded = this.pkcs7Pad(plaintext);

            // Encrypt
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: 'AES-CBC',
                    iv: iv
                },
                cryptoKey,
                padded
            );

            // Combine IV + ciphertext and convert to hex
            const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
            combined.set(iv);
            combined.set(new Uint8Array(ciphertext), iv.length);
            
            return this.arrayBufferToHex(combined);
        } catch (err) {
            console.error('Encryption error:', err);
            throw new Error(`Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    async decrypt(encryptedHex: string): Promise<string> {
        try {
            // Convert hex to bytes
            const combined = this.hexToArrayBuffer(encryptedHex);
            
            // Split IV and ciphertext
            const iv = combined.slice(0, BLOCK_SIZE);
            const ciphertext = combined.slice(BLOCK_SIZE);

            // Import key for AES-CBC
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                this.key,
                {
                    name: 'AES-CBC',
                    length: 256
                },
                false,
                ['decrypt']
            );

            // Decrypt
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-CBC',
                    iv: iv
                },
                cryptoKey,
                ciphertext
            );

            // Unpad and convert to string
            const unpadded = this.pkcs7Unpad(new Uint8Array(decrypted));
            return new TextDecoder().decode(unpadded);
        } catch (err) {
            console.error('Decryption error:', err);
            throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    // PKCS7 padding
    private pkcs7Pad(data: Uint8Array): Uint8Array {
        const padLength = BLOCK_SIZE - (data.length % BLOCK_SIZE);
        const padded = new Uint8Array(data.length + padLength);
        padded.set(data);
        padded.fill(padLength, data.length);
        return padded;
    }

    // PKCS7 unpadding
    private pkcs7Unpad(data: Uint8Array): Uint8Array {
        const padLength = data[data.length - 1];
        if (padLength === 0 || padLength > BLOCK_SIZE) {
            throw new Error('Invalid padding');
        }
        return data.slice(0, data.length - padLength);
    }

    // Convert ArrayBuffer to hex string
    private arrayBufferToHex(buffer: Uint8Array): string {
        return Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Convert hex string to ArrayBuffer
    private hexToArrayBuffer(hex: string): Uint8Array {
        if (hex.length % 2 !== 0) {
            throw new Error('Invalid hex string length');
        }
        const matches = hex.match(/.{1,2}/g) || [];
        return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    }
}