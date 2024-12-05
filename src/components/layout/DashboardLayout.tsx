import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';
import { CryptoSession } from '@/lib/crypto-session';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(!CryptoSession.getCipher());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/v1/check-session', {
          headers: {
            'X-Api-Key': localStorage.getItem('sshm_api_key') || '',
          },
        });
        const data = await response.json();

        if (data.status === 'error' && data.code === 'SESSION_EXPIRED') {
          CryptoSession.clearEncryptionKey();
          router.push('/login');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Session check failed:', error);
        setLoading(false);
      }
    };

    // Sprawdzaj sesję od razu i co minutę
    checkSession();
    const interval = setInterval(checkSession, 60000);

    // Nasłuchuj na wygaśnięcie klucza szyfrującego
    const handleCryptoExpired = () => {
      setShowCryptoPrompt(true);
    };

    window.addEventListener('crypto_session_expired', handleCryptoExpired);

    return () => {
      clearInterval(interval);
      window.removeEventListener('crypto_session_expired', handleCryptoExpired);
    };
  }, [router]);

  useEffect(() => {
    // Sprawdź, czy użytkownik jest zalogowany
    const apiKey = localStorage.getItem('sshm_api_key');
    if (!apiKey) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleCryptoKeyProvided = () => {
    setShowCryptoPrompt(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showCryptoPrompt ? (
        <CryptoKeyPrompt onKeyProvided={handleCryptoKeyProvided} />
      ) : (
        <div className="flex">
          <Sidebar />
          <div className="flex-1 pl-64">
            <main className="p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {router.pathname.split('/').pop()?.replace('-', ' ').toUpperCase() || 'Dashboard'}
                    </h1>
                    <div className="flex items-center space-x-4">
                      {/* Tu możesz dodać dodatkowe elementy header'a */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="mx-auto">
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    {children}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;