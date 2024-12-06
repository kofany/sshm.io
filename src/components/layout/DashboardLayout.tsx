// src/components/layout/DashboardLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';
import { CryptoSession } from '@/lib/crypto-session';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const promptShownRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Sprawdź czy użytkownik jest zalogowany
      const apiKey = localStorage.getItem('sshm_api_key');
      if (!apiKey) {
        router.push('/login');
        return;
      }

      // Sprawdź czy mamy aktywną sesję szyfrowania
      if (!promptShownRef.current) {
        promptShownRef.current = true;
        const cipher = CryptoSession.getCipher();
        if (!cipher) {
          setShowCryptoPrompt(true);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // Nasłuchuj na wygaśnięcie sesji szyfrowania
    const handleCryptoExpired = () => {
      setShowCryptoPrompt(true);
    };

    window.addEventListener('crypto_session_expired', handleCryptoExpired);
    return () => {
      window.removeEventListener('crypto_session_expired', handleCryptoExpired);
    };
  }, []);

  const handleCryptoKeyProvided = async () => {
    if (await CryptoSession.validateSession()) {
      setShowCryptoPrompt(false);
    }
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
              <div className="mb-8">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {router.pathname.split('/').pop()?.replace('-', ' ').toUpperCase() || 'Dashboard'}
                    </h1>
                  </div>
                </div>
              </div>

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