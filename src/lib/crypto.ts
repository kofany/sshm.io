// src/lib/crypto.ts

const NONCE_SIZE = 12; // GCM nonce size
const KEY_SIZE = 32;   // 32 bytes for AES-256

export class Cipher {
    private key: Uint8Array;

    constructor(password: string) {
        // Convert password to key
        const encoder = new TextEncoder();
        this.key = new Uint8Array(KEY_SIZE);
        const passwordBytes = encoder.encode(password);
        
        for (let i = 0; i < KEY_SIZE; i++) {
            this.key[i] = i < passwordBytes.length ? passwordBytes[i] : 0;
        }
    }

    async encrypt(data: string): Promise<string> {
        try {
            // Generate random nonce
            const nonce = crypto.getRandomValues(new Uint8Array(NONCE_SIZE));

            // Import key for AES-GCM
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                this.key,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                false,
                ['encrypt']
            );

            // Convert string to bytes
            const encoder = new TextEncoder();
            const plaintext = encoder.encode(data);

            // Encrypt using AES-GCM
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: nonce,
                    tagLength: 128 // Auth tag length in bits
                },
                cryptoKey,
                plaintext
            );

            // Combine nonce + ciphertext (auth tag is already appended by encrypt)
            const combined = new Uint8Array(nonce.length + new Uint8Array(ciphertext).length);
            combined.set(nonce);
            combined.set(new Uint8Array(ciphertext), nonce.length);

            // Convert to hex string
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

            // Split nonce and ciphertext
            const nonce = combined.slice(0, NONCE_SIZE);
            const ciphertext = combined.slice(NONCE_SIZE);

            // Import key for AES-GCM
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                this.key,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                false,
                ['decrypt']
            );

            // Decrypt
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: nonce,
                    tagLength: 128 // Auth tag length in bits
                },
                cryptoKey,
                ciphertext
            );

            // Convert bytes to string
            return new TextDecoder().decode(decrypted);
        } catch (err) {
            console.error('Decryption error:', err);
            throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    private arrayBufferToHex(buffer: Uint8Array): string {
        return Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    private hexToArrayBuffer(hex: string): Uint8Array {
        const matches = hex.match(/.{1,2}/g) || [];
        return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    }
}