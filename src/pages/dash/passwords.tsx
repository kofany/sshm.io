// src/pages/dash/passwords.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FiPlusCircle, FiTrash2, FiEye, FiEyeOff, FiCopy } from 'react-icons/fi';
import { auth } from '@/lib/auth';
import { CryptoSession } from '@/lib/crypto-session';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';

interface Password {
  id: number;
  user_id: number;
  description: string;
  password: string;
  created_at: string;
}

interface SyncData {
  passwords: Password[];
  hosts: any[];
  keys: any[];
}

const PasswordsPage = () => {
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);
  const [isAddingPassword, setIsAddingPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const [newPassword, setNewPassword] = useState({
    description: '',
    password: ''
  });

  // Pobiera aktualne surowe dane z API
  const fetchCurrentData = async (): Promise<SyncData | null> => {
    const response = await fetch('/api/v1/sync', {
      headers: auth.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch current data');
    }

    const data = await response.json();
    return data.status === 'success' ? data.data : null;
  };

  // Pobiera i deszyfruje hasła do wyświetlenia
  const fetchPasswords = async () => {
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchCurrentData();
      if (!data) {
        throw new Error('No data received');
      }

      const decryptedPasswords = await Promise.all(
        data.passwords.map(async (pwd: Password) => {
          try {
            return {
              ...pwd,
              password: await cipher.decrypt(pwd.password)
            };
          } catch (error) {
            console.error('Failed to decrypt password:', error);
            throw error;
          }
        })
      );
      setPasswords(decryptedPasswords);
    } catch (err) {
      console.error('Failed to load passwords:', err);
      setError('Failed to load passwords');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasswords();
  }, []);

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      return;
    }

    try {
      // Pobierz aktualne dane
      const currentData = await fetchCurrentData();
      if (!currentData) {
        throw new Error('Failed to fetch current data');
      }

      // Przygotuj nowe zaszyfrowane hasło
      const encryptedPassword = await cipher.encrypt(newPassword.password);
      const passwordData = {
        id: Date.now(),
        user_id: 0,
        description: newPassword.description,
        password: encryptedPassword,
        created_at: new Date().toISOString()
      };

      // Wyślij zaktualizowane dane
      const response = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          data: {
            ...currentData,
            passwords: [...currentData.passwords, passwordData]
          }
        })
      });

      if (response.ok) {
        setIsAddingPassword(false);
        setNewPassword({ description: '', password: '' });
        await fetchPasswords();
      } else {
        throw new Error('Failed to sync data');
      }
    } catch (err) {
      console.error('Add password error:', err);
      setError('Failed to add password');
    }
  };

  const handleDeletePassword = async (passwordId: number) => {
    if (!window.confirm('Are you sure you want to delete this password?')) {
      return;
    }

    try {
      // Pobierz aktualne dane
      const currentData = await fetchCurrentData();
      if (!currentData) {
        throw new Error('Failed to fetch current data');
      }

      // Usuń wybrane hasło
      const updatedPasswords = currentData.passwords.filter(
        pwd => pwd.id !== passwordId
      );

      // Wyślij zaktualizowane dane
      const response = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          data: {
            ...currentData,
            passwords: updatedPasswords
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to sync data');
      }

      await fetchPasswords();
    } catch (err) {
      console.error('Delete password error:', err);
      setError('Failed to delete password');
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Copy to clipboard error:', err);
      setError('Failed to copy to clipboard');
    }
  };

  const handleCryptoKeyProvided = () => {
    setShowCryptoPrompt(false);
    fetchPasswords();
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
          <h1 className="text-2xl font-semibold text-gray-900">Password Management</h1>
          <button
            onClick={() => setIsAddingPassword(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiPlusCircle className="w-5 h-5 mr-2" />
            Add New Password
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
            {isAddingPassword ? (
              <div className="p-6">
                <form onSubmit={handleAddPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={newPassword.description}
                      onChange={e => setNewPassword({ ...newPassword, description: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="Enter password description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={newPassword.password}
                      onChange={e => setNewPassword({ ...newPassword, password: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="Enter password"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingPassword(false);
                        setNewPassword({ description: '', password: '' });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Save Password
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {passwords.map((pwd) => (
                  <div key={pwd.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{pwd.description}</h3>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="font-mono text-sm">
                            {visiblePasswords[pwd.id] ? pwd.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(pwd.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {visiblePasswords[pwd.id] ? (
                              <FiEyeOff className="w-4 h-4" />
                            ) : (
                              <FiEye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyToClipboard(pwd.password)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Added on {new Date(pwd.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePassword(pwd.id)}
                        className="text-red-400 hover:text-red-600 ml-4"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
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

export default PasswordsPage;