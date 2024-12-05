// src/components/CryptoKeyPrompt.tsx
import { useState } from 'react';
import { CryptoSession } from '@/lib/crypto-session';

const CryptoKeyPrompt = ({ onKeyProvided }: { onKeyProvided: () => void }) => {
    const [key, setKey] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        CryptoSession.setEncryptionKey(key);
        onKeyProvided();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Enter Encryption Key</h2>
                <p className="text-gray-600 mb-4">
                    Please enter your encryption key. This should be the same key you use
                    in the desktop application. If you forget this key, your data cannot
                    be recovered.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-sm text-yellow-700">
                        Warning: This key will only be stored temporarily for this session
                        and will be cleared after 30 minutes of inactivity.
                    </p>
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="w-full p-2 border rounded mb-4"
                        placeholder="Enter your encryption key"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CryptoKeyPrompt;