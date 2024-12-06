// src/lib/crypto.ts

const NONCE_SIZE = 12;  // GCM standard nonce size
const KEY_SIZE = 32;    // AES-256 key size in bytes
const AUTH_TAG_SIZE = 16; // GCM auth tag size

export class Cipher {
    private key!: Uint8Array; // Using definite assignment assertion

    constructor(private readonly password: string) {}

    private async initKey(): Promise<void> {
        if (this.key) return; // Key already initialized

        // Convert password to bytes using TextEncoder (same as []byte in Go)
        const encoder = new TextEncoder();
        const passwordBytes = encoder.encode(this.password);
        
        // Create SHA-256 hash of password (matching Go's implementation)
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBytes);
        this.key = new Uint8Array(hashBuffer);
    }

    async encrypt(data: string): Promise<string> {
        await this.initKey();

        try {
            // Generate random nonce (same as Go's io.ReadFull(rand.Reader, nonce))
            const nonce = crypto.getRandomValues(new Uint8Array(NONCE_SIZE));

            // Import key for AES-GCM (matching Go's aes.NewCipher)
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

            // Convert input string to bytes (matching Go's []byte type conversion)
            const encoder = new TextEncoder();
            const plaintext = encoder.encode(data);

            // Encrypt using AES-GCM (matching Go's cipher.NewGCM().Seal)
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: nonce,
                    tagLength: AUTH_TAG_SIZE * 8 // Tag length in bits
                },
                cryptoKey,
                plaintext
            );

            // In Go, Seal() automatically appends auth tag to ciphertext
            // We need to combine: nonce + ciphertext + auth tag
            const ciphertextWithTag = new Uint8Array(ciphertext);
            const combined = new Uint8Array(NONCE_SIZE + ciphertextWithTag.length);
            
            // Structure matches Go's output: nonce + ciphertext + auth tag
            combined.set(nonce); // First 12 bytes are nonce
            combined.set(ciphertextWithTag, NONCE_SIZE); // Rest is ciphertext + auth tag

            // Convert to base64 (matching Go's base64.StdEncoding)
            return btoa(String.fromCharCode(...combined));

        } catch (err) {
            console.error('Encryption error:', err);
            throw new Error(`Encryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    async decrypt(encryptedData: string): Promise<string> {
        await this.initKey();

        try {
            // Decode from base64 (matching Go's base64.StdEncoding)
            const combined = new Uint8Array(
                atob(encryptedData)
                    .split('')
                    .map(char => char.charCodeAt(0))
            );

            // Extract nonce (matching Go's structure)
            const nonce = combined.slice(0, NONCE_SIZE);
            
            // Rest is ciphertext + auth tag (matching Go's structure)
            const ciphertextWithTag = combined.slice(NONCE_SIZE);

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

            // Decrypt (auth tag is automatically verified)
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: nonce,
                    tagLength: AUTH_TAG_SIZE * 8
                },
                cryptoKey,
                ciphertextWithTag
            );

            // Convert bytes back to string
            return new TextDecoder().decode(decrypted);

        } catch (err) {
            console.error('Decryption error:', err);
            throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
}

// Helper function to test encryption/decryption
export async function testCipher(password: string, plaintext: string): Promise<boolean> {
    const cipher = new Cipher(password);
    const encrypted = await cipher.encrypt(plaintext);
    const decrypted = await cipher.decrypt(encrypted);
    return decrypted === plaintext;
}