// src/pages/dash/keys.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FiPlusCircle, FiTrash2, FiCopy } from 'react-icons/fi';
import { auth } from '@/lib/auth';
import { CryptoSession } from '@/lib/crypto-session';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';

interface SSHKey {
  id: number;
  user_id: number;
  name: string;
  public_key: string;
  private_key: string;
  created_at: string;
}

const KeysPage = () => {
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    public_key: '',
    private_key: ''
  });

  const fetchKeys = async () => {
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/sync', {
        headers: auth.getAuthHeaders(),
      });

      const data = await response.json();
      if (data.status === 'success') {
        const decryptedKeys = await Promise.all(
          data.data.keys.map(async (key: SSHKey) => ({
            ...key,
            private_key: await cipher.decrypt(key.private_key)
          }))
        );
        setKeys(decryptedKeys);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to load SSH keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      return;
    }

    try {
      const encryptedPrivateKey = await cipher.encrypt(newKeyData.private_key);
      
      const newKey = {
        ...newKeyData,
        private_key: encryptedPrivateKey
      };

      const response = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          data: {
            keys: [...keys, { ...newKey, id: Date.now(), user_id: 0 }]
          }
        })
      });

      if (response.ok) {
        setIsAddingKey(false);
        setNewKeyData({ name: '', public_key: '', private_key: '' });
        fetchKeys();
      } else {
        setError('Failed to add SSH key');
      }
    } catch {
      setError('Failed to add SSH key');
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    if (!window.confirm('Are you sure you want to delete this SSH key?')) {
      return;
    }

    try {
      const updatedKeys = keys.filter(key => key.id !== keyId);
      const response = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          data: {
            keys: updatedKeys
          }
        })
      });

      if (response.ok) {
        fetchKeys();
      } else {
        setError('Failed to delete SSH key');
      }
    } catch {
      setError('Failed to delete SSH key');
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
    fetchKeys();
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">SSH Keys</h1>
          <button
            onClick={() => setIsAddingKey(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiPlusCircle className="w-5 h-5 mr-2" />
            Add New Key
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {isAddingKey ? (
              <div className="p-6">
                <form onSubmit={handleAddKey} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Key Name</label>
                    <input
                      type="text"
                      value={newKeyData.name}
                      onChange={e => setNewKeyData({ ...newKeyData, name: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Public Key</label>
                    <textarea
                      value={newKeyData.public_key}
                      onChange={e => setNewKeyData({ ...newKeyData, public_key: e.target.value })}
                      required
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Private Key</label>
                    <textarea
                      value={newKeyData.private_key}
                      onChange={e => setNewKeyData({ ...newKeyData, private_key: e.target.value })}
                      required
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingKey(false);
                        setNewKeyData({ name: '', public_key: '', private_key: '' });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add Key
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {keys.map((key) => (
                  <div key={key.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{key.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Added on {new Date(key.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleCopyToClipboard(key.public_key)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy public key"
                        >
                          <FiCopy className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-red-400 hover:text-red-600"
                          title="Delete key"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default KeysPage;