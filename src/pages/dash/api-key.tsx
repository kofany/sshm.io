// src/pages/dash/api-key.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FiRefreshCw } from 'react-icons/fi';
import { auth } from '@/lib/auth';
import { CryptoSession } from '@/lib/crypto-session';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';

const ApiKeyPage = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [error, setError] = useState('');
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const currentKey = auth.getApiKey();
    if (currentKey) {
      setApiKey(currentKey);
    }
  }, []);

  const generateNewKey = async () => {
    if (!CryptoSession.getCipher()) {
      setShowCryptoPrompt(true);
      return;
    }

    if (!window.confirm('Are you sure? This will invalidate your current API key.')) {
      return;
    }

    setRegenerating(true);
    setError('');

    try {
      const response = await fetch('/api/v1/user/update', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          regenerate_api_key: true
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setApiKey(data.data.api_key);
        auth.login(data.data.api_key);
        setError('');
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to generate new API key');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleCryptoKeyProvided = () => {
    setShowCryptoPrompt(false);
    generateNewKey();
  };

  if (showCryptoPrompt) {
    return (
      <DashboardLayout>
        <CryptoKeyPrompt onKeyProvided={handleCryptoKeyProvided} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">API Key Management</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Your API Key</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(apiKey)}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={generateNewKey}
                disabled={regenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                Generate New Key
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">API Key Usage</h2>
          <div className="prose max-w-none">
            <p>Use this API key to authenticate your requests to the sshm.io API.</p>
            <p className="mt-2">Include it in your requests as an HTTP header:</p>
            <pre className="bg-gray-50 rounded p-3 mt-2 text-sm">
              X-Api-Key: &ldquo;{'{your-api-key}'}&rdquo;
            </pre>
            <div className="mt-4 p-4 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Keep your API key secure and never share it with others. 
                If your key is compromised, use the &ldquo;Generate New Key&rdquo; button to invalidate the old key.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApiKeyPage;