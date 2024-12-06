// src/lib/crypto.ts
const NONCE_SIZE = 12;
const AUTH_TAG_SIZE = 16;

export class Cipher {
    private key: Uint8Array;
    private readonly ALGORITHM = 'AES-GCM';

    constructor(password: string) {
        // Dokładnie tak samo jak w Go - używamy encoder do zamiany stringa na bajty
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        
        // Tworzymy bufor 32 bajtowy (tyle samo co w Go)
        this.key = new Uint8Array(32);
        
        // Kopiujemy dane wejściowe do bufora (tak jak w Go)
        for (let i = 0; i < data.length && i < 32; i++) {
            this.key[i] = data[i];
        }
    }

    async encrypt(data: string): Promise<string> {
        try {
            // Generujemy nonce
            const nonce = window.crypto.getRandomValues(new Uint8Array(NONCE_SIZE));

            // Importujemy klucz do WebCrypto
            const cryptoKey = await window.crypto.subtle.importKey(
                'raw',
                this.key,
                { name: this.ALGORITHM },
                false,
                ['encrypt']
            );

            // Konwertujemy tekst na bajty
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(data);

            // Szyfrujemy
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: this.ALGORITHM,
                    iv: nonce
                },
                cryptoKey,
                dataBytes
            );

            // Łączymy nonce i zaszyfrowane dane (tak jak w Go)
            const combined = new Uint8Array(nonce.length + new Uint8Array(encrypted).length);
            combined.set(nonce);
            combined.set(new Uint8Array(encrypted), nonce.length);

            // Konwertujemy do base64 (tak jak w Go)
            return btoa(String.fromCharCode(...combined));
        } catch (err) {
            console.error('Encryption error:', err);
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

            // Wydzielamy nonce i dane
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

            // Konwertujemy bajty z powrotem na tekst
            return new TextDecoder().decode(decrypted);
        } catch (err) {
            console.error('Decryption error:', err);
            throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
}