import React, { useState, useEffect, useCallback } from 'react';
import { FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import { Host, Password } from '@/types/host';
import { CryptoSession } from '@/lib/crypto-session';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';
import { Cipher } from '@/lib/crypto'; // Dodaj ten import

interface HostCardProps {
  host: Host;
  password?: Password;
}

interface DecryptedHost {
  id: number;
  name: string;
  description: string | null;
  login: string;
  ip: string;
  port: string;
  created_at: string;
}

const HostCard: React.FC<HostCardProps> = ({ host, password }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [decryptedHost, setDecryptedHost] = useState<DecryptedHost | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decryptHost = useCallback(async (cipher: Cipher) => {
    try {
      return {
        ...host,
        login: await cipher.decrypt(host.login),
        ip: await cipher.decrypt(host.ip),
        port: await cipher.decrypt(host.port)
      };
    } catch (err) {
      console.error('Decryption error:', err);
      throw err;
    }
  }, [host]);
  
  useEffect(() => {
    const decryptHostData = async () => {
      const cipher = CryptoSession.getCipher();
      if (!cipher) {
        setShowCryptoPrompt(true);
        return;
      }
  
      try {
        console.log('Decrypting host data for:', host.name);
        const decrypted = await decryptHost(cipher);
        console.log('Decrypted host data:', decrypted);
        setDecryptedHost(decrypted);
        setError(null);
      } catch (err) {
        console.error('Host decryption error:', err);
        setError('Failed to decrypt host data');
      }
    };
  
    decryptHostData();
  }, [decryptHost]); // zależność zmieniona na decryptHost

  const handleTogglePassword = async () => {
    if (showPassword) {
      setShowPassword(false);
      setDecryptedPassword(null);
      return;
    }
  
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      return;
    }
  
    try {
      if (password?.password) {
        console.log('Decrypting password');
        const decrypted = await cipher.decrypt(password.password);
        console.log('Password decrypted successfully');
        setDecryptedPassword(decrypted);
        setShowPassword(true);
        setError(null);
      }
    } catch (err) {
      console.error('Password decryption error:', err);
      setError('Failed to decrypt password');
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied to clipboard successfully');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleCryptoKeyProvided = async () => {
    setShowCryptoPrompt(false);
    const cipher = CryptoSession.getCipher();
    if (!cipher) return;

    try {
      console.log('Attempting to decrypt host data after key provided');
      const decrypted = await decryptHost(cipher);
      console.log('Successfully decrypted host data');
      setDecryptedHost(decrypted);
      setError(null);
    } catch (err) {
      console.error('Decryption error after key provided:', err);
      setError('Failed to decrypt host data');
    }
  };

  if (showCryptoPrompt) {
    return <CryptoKeyPrompt onKeyProvided={handleCryptoKeyProvided} />;
  }

  if (!decryptedHost) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{decryptedHost.name}</h3>
        <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
          Active
        </span>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Description:</span>
          <span className="text-sm text-gray-900">{decryptedHost.description || '-'}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Login:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900">{decryptedHost.login}</span>
            <button
              onClick={() => handleCopyToClipboard(decryptedHost.login)}
              className="text-gray-400 hover:text-gray-600"
              title="Copy login"
            >
              <FiCopy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {password && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Password:</span>
            <div className="flex items-center space-x-2">
              {showPassword ? (
                <>
                  <span className="text-sm font-mono text-gray-900">
                    {decryptedPassword}
                  </span>
                  <button
                    onClick={() => handleCopyToClipboard(decryptedPassword || '')}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy password"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <span className="text-sm font-mono text-gray-900">••••••••</span>
              )}
              <button
                onClick={handleTogglePassword}
                className="text-gray-400 hover:text-gray-600"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <FiEyeOff className="w-4 h-4" />
                ) : (
                  <FiEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">IP Address:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900">{decryptedHost.ip}</span>
            <button
              onClick={() => handleCopyToClipboard(decryptedHost.ip)}
              className="text-gray-400 hover:text-gray-600"
              title="Copy IP address"
            >
              <FiCopy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Port:</span>
          <span className="text-sm text-gray-900">{decryptedHost.port}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Created:</span>
          <span>{new Date(decryptedHost.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default HostCard;