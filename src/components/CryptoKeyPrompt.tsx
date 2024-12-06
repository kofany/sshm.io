// src/components/CryptoKeyPrompt.tsx
import React, { useState } from 'react';
import { CryptoSession } from '@/lib/crypto-session';

interface CryptoKeyPromptProps {
    onKeyProvided: () => void;
}

const CryptoKeyPrompt: React.FC<CryptoKeyPromptProps> = ({ onKeyProvided }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Inicjalizacja szyfru z podanym kluczem
            CryptoSession.initializeSession(key);
            
            // Walidacja czy klucz działa poprawnie
            const isValid = await CryptoSession.validateSession();
            
            if (!isValid) {
                setError('Invalid encryption key');
                CryptoSession.clearSession();
                setLoading(false);
                return;
            }

            setLoading(false);
            onKeyProvided();
        } catch (err) {
            setError('Failed to initialize encryption');
            setLoading(false);
            CryptoSession.clearSession();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Enter Encryption Key</h2>
                
                <p className="text-gray-600 mb-4">
                    Please enter your encryption key. This should be the same key you use
                    in the desktop application.
                </p>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-sm text-yellow-700">
                        Warning: This key is required to decrypt your data. Make sure you enter
                        the correct key used in the desktop application.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your encryption key"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {loading ? 'Verifying...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CryptoKeyPrompt;