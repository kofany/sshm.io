import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { Host } from '@/types/host';
import { CryptoSession } from '@/lib/crypto-session';
import { Cipher } from '@/lib/crypto';  // Dodany import
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';
import { auth } from '@/lib/auth';

interface HostsListProps {
  onEdit: (host: Host) => void;
  onDelete: (host: Host) => void;
  onAdd: () => void;
}

const decryptHost = async (host: Host, cipher: Cipher): Promise<Host> => {
  try {
    return {
      ...host,
      login: await cipher.decrypt(host.login),
      ip: await cipher.decrypt(host.ip),
      port: await cipher.decrypt(host.port)
    };
  } catch (error) {
    console.error('Failed to decrypt host:', error);
    throw new Error('Decryption failed');
  }
};

const HostsList = ({ onEdit, onDelete, onAdd }: HostsListProps) => {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setShowCryptoPrompt(true);
    };

    window.addEventListener('crypto_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('crypto_session_expired', handleSessionExpired);
    };
  }, []);

  const fetchHosts = async () => {
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
        // Deszyfrowanie danych hostów
        const decryptedHosts = await Promise.all(
          data.data.hosts.map(async (host: Host) => decryptHost(host, cipher))
        );
        setHosts(decryptedHosts);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Failed to load hosts:', err);
      setError('Failed to load hosts');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchHosts();
  }, []);

  const handleCryptoKeyProvided = async () => {
    setShowCryptoPrompt(false);
    setLoading(true);
    await fetchHosts();
  };

  const handleEdit = async (host: Host) => {
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      return;
    }
    onEdit(host); // Przekazujemy już odszyfrowanego hosta
  };

  const handleDelete = async (host: Host) => {
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      return;
    }
    onDelete(host);
  };

  const handleAdd = () => {
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      return;
    }
    onAdd();
  };

  if (showCryptoPrompt) {
    return <CryptoKeyPrompt onKeyProvided={handleCryptoKeyProvided} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">SSH Hosts</h2>
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiPlus className="w-5 h-5 mr-2" />
            Add New Host
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Port
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hosts.map((host) => (
              <tr key={host.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{host.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{host.description || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{host.login}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{host.ip}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{host.port}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(host)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(host)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HostsList;