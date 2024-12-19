import React, { useState, useEffect } from 'react';
import { Host, Password, Key } from '@/types/host';
import { CryptoSession } from '@/lib/crypto-session';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';

interface HostFormProps {
    host: Host | null;
    passwords?: Password[];
    keys?: Key[];
    onSubmit: (host: Host) => Promise<void>;
    onCancel: () => void;
}

const HostForm: React.FC<HostFormProps> = ({ host, passwords = [], keys = [], onSubmit, onCancel }) => {
    const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);
    const [authType, setAuthType] = useState<'password' | 'key'>(
        host && host.password_id !== undefined ? (host.password_id >= 0 ? 'password' : 'key') : 'password'
    );
    const [formData, setFormData] = useState<Partial<Host>>({
        name: '',
        description: '',
        login: '',
        password_id: 0,
        ip: '',
        port: '22',
        ...host
    });

    useEffect(() => {
        const loadHostData = async () => {
            const cipher = CryptoSession.getCipher();
            if (!cipher) {
                setShowCryptoPrompt(true);
                return;
            }

            if (host) {
                try {
                    const [
                        decryptedName,
                        decryptedDescription,
                        decryptedLogin,
                        decryptedIp,
                        decryptedPort
                    ] = await Promise.all([
                        cipher.decrypt(host.name),
                        host.description ? cipher.decrypt(host.description) : Promise.resolve(null),
                        cipher.decrypt(host.login),
                        cipher.decrypt(host.ip),
                        cipher.decrypt(host.port)
                    ]);

                    setFormData({
                        ...host,
                        name: decryptedName,
                        description: decryptedDescription,
                        login: decryptedLogin,
                        ip: decryptedIp,
                        port: decryptedPort
                    });
                } catch (error) {
                    console.error('Failed to decrypt host data:', error);
                }
            }
        };

        loadHostData();
    }, [host]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const cipher = CryptoSession.getCipher();
            if (!cipher) {
                setShowCryptoPrompt(true);
                return;
            }
    
            if (!formData.login || !formData.ip || !formData.name) {
                console.error('Missing required fields');
                return;
            }
    
            console.log('Encrypting form data...');
    
            const [
                encryptedName,
                encryptedDescription,
                encryptedLogin, 
                encryptedIp, 
                encryptedPort
            ] = await Promise.all([
                cipher.encrypt(formData.name),
                formData.description ? cipher.encrypt(formData.description) : Promise.resolve(null),
                cipher.encrypt(formData.login),
                cipher.encrypt(formData.ip),
                cipher.encrypt(formData.port || '22')
            ]);
    
            // Oblicz password_id na podstawie typu autoryzacji
            let finalPasswordId: number;
            if (authType === 'password') {
                // Dla haseł używamy indeksu w tablicy (0, 1, 2, ...)
                finalPasswordId = passwords.findIndex(p => String(p.id) === String(formData.password_id));
                if (finalPasswordId === -1) finalPasswordId = 0;
            } else {
                // Dla kluczy używamy ujemnego indeksu (-1, -2, -3, ...)
                const keyIndex = keys.findIndex(k => String(k.id) === String(formData.password_id));
                finalPasswordId = keyIndex === -1 ? -1 : -(keyIndex + 1);
            }
    
            const hostData: Host = {
                id: host?.id || Date.now(),
                user_id: host?.user_id || 0,
                created_at: host?.created_at || new Date().toISOString(),
                password_id: finalPasswordId,
                name: encryptedName,
                description: encryptedDescription,
                login: encryptedLogin,
                ip: encryptedIp,
                port: encryptedPort
            };
    
            await onSubmit(hostData);
    
            setFormData({
                name: '',
                description: '',
                login: '',
                password_id: 0,
                ip: '',
                port: '22'
            });
    
            if (onCancel) {
                onCancel();
            }
    
        } catch (error) {
            console.error('Failed to prepare host data:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAuthTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setAuthType(e.target.value as 'password' | 'key');
        setFormData(prev => ({
            ...prev,
            password_id: e.target.value === 'password' ? 0 : -1
        }));
    };

    const handleCryptoKeyProvided = () => {
        setShowCryptoPrompt(false);
    };

    if (showCryptoPrompt) {
        return <CryptoKeyPrompt onKeyProvided={handleCryptoKeyProvided} />;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="login" className="block text-sm font-medium text-gray-700">
                    Login
                </label>
                <input
                    type="text"
                    id="login"
                    name="login"
                    value={formData.login}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="auth_type" className="block text-sm font-medium text-gray-700">
                    Authentication Type
                </label>
                <select
                    id="auth_type"
                    value={authType}
                    onChange={handleAuthTypeChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="password">Password</option>
                    <option value="key">SSH Key</option>
                </select>
            </div>

            {authType === 'password' ? (
                <div>
                    <label htmlFor="password_id" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <select
                        id="password_id"
                        name="password_id"
                        value={formData.password_id}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select password</option>
                        {passwords.map((pwd, index) => (
                            <option key={pwd.id} value={pwd.id}>
                                {pwd.description || `Password #${index + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div>
                    <label htmlFor="password_id" className="block text-sm font-medium text-gray-700">
                        SSH Key
                    </label>
                    <select
                        id="password_id"
                        name="password_id"
                        value={formData.password_id}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">Select SSH key</option>
                        {keys.map((key, index) => (
                            <option key={key.id} value={key.id}>
                                {key.description || `Key #${index + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label htmlFor="ip" className="block text-sm font-medium text-gray-700">
                    IP Address
                </label>
                <input
                    type="text"
                    id="ip"
                    name="ip"
                    value={formData.ip}
                    onChange={handleChange}
                    required
                    pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="port" className="block text-sm font-medium text-gray-700">
                    Port
                </label>
                <input
                    type="text"
                    id="port"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    required
                    pattern="^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    {host ? 'Update' : 'Create'} Host
                </button>
            </div>
        </form>
    );
};

export default HostForm;