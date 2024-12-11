// src/pages/dash/profile.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FiUser, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { auth } from '@/lib/auth';
import { CryptoSession } from '@/lib/crypto-session';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';

interface UserData {
  email: string;
  created_at: string;
  hosts_count: number;
  keys_count: number;
  passwords_count: number;
}

const ProfilePage = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);

    const fetchUserData = useCallback(async () => {
      const apiKey = auth.getApiKey();
      const cipher = CryptoSession.getCipher();
      
      if (!apiKey) {
        router.push('/login');
        return;
      }
      
      if (!cipher) {
        setShowCryptoPrompt(true);
        setLoading(false);
        return;
      }
    
      try {
        const response = await fetch('/api/v1/user/info', {
          headers: {
            ...auth.getAuthHeaders(),
            'X-Api-Key': apiKey
          }
        });
    
        const data = await response.json();
        if (data.status === 'success') {
          setUserData(data.data);
          setError('');
        } else if (response.status === 401) {
          router.push('/login');
        } else {
          setError('');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load user data');
      }
      setLoading(false);
  }, [router]); // router jako zależność

  useEffect(() => {
      fetchUserData();
  }, [fetchUserData]); // fetchUserData jako zależność

  const handleUpdateEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEmail = formData.get('email') as string;

    try {
      const response = await fetch('/api/v1/user/update', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setUserData(prev => prev ? { ...prev, email: newEmail } : null);
        setIsEditing(false);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update email');
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/v1/user/update', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setIsChangingPassword(false);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/v1/user/delete', {
        method: 'DELETE',
        headers: auth.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Najpierw usuwamy konto, potem wylogowujemy
        await auth.logout();
        router.push('/login');
      } else {
        setError(data.message || 'Failed to delete account');
      }
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const handleCryptoKeyProvided = () => {
    setShowCryptoPrompt(false);
    fetchUserData();
  };

  if (showCryptoPrompt) {
    return (
      <DashboardLayout>
        <CryptoKeyPrompt onKeyProvided={handleCryptoKeyProvided} />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {/* Basic Info */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your account details and email preferences.
                </p>
              </div>
              <FiUser className="h-6 w-6 text-gray-400" />
            </div>

            {userData && (
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userData.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(userData.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            )}

            <div className="mt-4">
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Change email
              </button>
            </div>
          </div>

          {/* Statistics */}
          {userData && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Account Statistics</h3>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hosts</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {userData.hosts_count}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Keys</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {userData.keys_count}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Passwords</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {userData.passwords_count}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Security */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Security</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your password and account security.
                </p>
              </div>
              <FiLock className="h-6 w-6 text-gray-400" />
            </div>

            <div className="mt-4">
              <button
                onClick={() => setIsChangingPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Change password
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
                <p className="mt-1 text-sm text-red-700">
                  Once you delete your account, there is no going back.
                </p>
              </div>
              <FiAlertCircle className="h-6 w-6 text-red-400" />
            </div>

            <div className="mt-4">
              <button
                onClick={handleDeleteAccount}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Email Change Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <form onSubmit={handleUpdateEmail}>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Change Email Address
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {isChangingPassword && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <form onSubmit={handleChangePassword}>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Change Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;