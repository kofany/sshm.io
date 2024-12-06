import React, { useState } from 'react';
import { FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import { Host, Password } from '@/types/host';
import { CryptoSession } from '@/lib/crypto-session';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';

interface HostCardProps {
  host: Host;
  password?: Password;
}

const HostCard: React.FC<HostCardProps> = ({ host, password }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const decrypted = await cipher.decrypt(password.password);
        setDecryptedPassword(decrypted);
        setShowPassword(true);
        setError(null);
      }
    } catch (err) {
      setError('Failed to decrypt password');
      console.error('Decryption error:', err);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleCryptoKeyProvided = () => {
    setShowCryptoPrompt(false);
    handleTogglePassword();
  };

  if (showCryptoPrompt) {
    return <CryptoKeyPrompt onKeyProvided={handleCryptoKeyProvided} />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{host.name}</h3>
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
          <span className="text-sm text-gray-900">{host.description || '-'}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Login:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900">{host.login}</span>
            <button
              onClick={() => handleCopyToClipboard(host.login)}
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
            <span className="text-sm text-gray-900">{host.ip}</span>
            <button
              onClick={() => handleCopyToClipboard(host.ip)}
              className="text-gray-400 hover:text-gray-600"
              title="Copy IP address"
            >
              <FiCopy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Port:</span>
          <span className="text-sm text-gray-900">{host.port}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Created:</span>
          <span>{new Date(host.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default HostCard;