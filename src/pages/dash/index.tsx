// src/pages/dash/index.tsx
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FiServer, FiKey, FiActivity } from 'react-icons/fi';
import { auth } from '@/lib/auth';
import { CryptoSession } from '@/lib/crypto-session';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';

interface DashboardStats {
  hosts_count: number;
  keys_count: number;
  last_sync: string | null;
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    hosts_count: 0,
    keys_count: 0,
    last_sync: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);

  const fetchStats = async () => {
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
        setStats({
          hosts_count: data.data.hosts?.length || 0,
          keys_count: data.data.keys?.length || 0,
          last_sync: data.data.last_sync
        });
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCryptoKeyProvided = () => {
    setShowCryptoPrompt(false);
    fetchStats();
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FiServer className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Hosts</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.hosts_count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FiKey className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">SSH Keys</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.keys_count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <FiActivity className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Last Sync</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.last_sync 
                      ? new Date(stats.last_sync).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" 
                 onClick={() => window.location.href = '/dash/hosts'}>
              <h3 className="font-medium">Manage Hosts</h3>
              <p className="text-sm text-gray-500">Add, edit or remove SSH hosts</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                 onClick={() => window.location.href = '/dash/keys'}>
              <h3 className="font-medium">SSH Keys</h3>
              <p className="text-sm text-gray-500">Manage your SSH keys</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;