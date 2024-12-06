// src/lib/sync-manager.ts
import { CryptoSession } from './crypto-session';
import { Host, Password, Key } from '@/types/host';

export class SyncManager {
    static async encryptForSync(data: any): Promise<any> {
        const cipher = CryptoSession.getCipher();
        if (!cipher) throw new Error('No active encryption session');

        const result = { ...data };

        // Szyfrowanie hostów
        if (data.hosts) {
            result.hosts = await Promise.all(data.hosts.map(async (host: Host) => ({
                ...host,
                login: await cipher.encrypt(host.login),
                ip: await cipher.encrypt(host.ip),
                port: await cipher.encrypt(host.port.toString())
            })));
        }

        // Szyfrowanie haseł
        if (data.passwords) {
            result.passwords = await Promise.all(data.passwords.map(async (pwd: Password) => ({
                ...pwd,
                password: await cipher.encrypt(pwd.password)
            })));
        }

        // Szyfrowanie kluczy - tylko key_data jest szyfrowane
        if (data.keys) {
            result.keys = await Promise.all(data.keys.map(async (key: Key) => ({
                ...key,
                key_data: key.key_data ? await cipher.encrypt(key.key_data) : null
            })));
        }

        return result;
    }

    static async decryptFromSync(data: any): Promise<any> {
        const cipher = CryptoSession.getCipher();
        if (!cipher) throw new Error('No active encryption session');

        const result = { ...data };

        if (data.hosts) {
            result.hosts = await Promise.all(data.hosts.map(async (host: Host) => ({
                ...host,
                login: await cipher.decrypt(host.login),
                ip: await cipher.decrypt(host.ip),
                port: await cipher.decrypt(host.port)
            })));
        }

        if (data.passwords) {
            result.passwords = await Promise.all(data.passwords.map(async (pwd: Password) => ({
                ...pwd,
                password: await cipher.decrypt(pwd.password)
            })));
        }

        if (data.keys) {
            result.keys = await Promise.all(data.keys.map(async (key: Key) => ({
                ...key,
                key_data: key.key_data ? await cipher.decrypt(key.key_data) : null
            })));
        }

        return result;
    }
}