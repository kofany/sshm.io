// src/pages/dash/hosts.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HostsList from '@/components/hosts/HostsList';
import HostForm from '@/components/hosts/HostForm';
import { Host, Password } from '@/types/host';
import { auth } from '@/lib/auth';
import { CryptoSession } from '@/lib/crypto-session';
import CryptoKeyPrompt from '@/components/CryptoKeyPrompt';

const HostsPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentHost, setCurrentHost] = useState<Host | null>(null);
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [showCryptoPrompt, setShowCryptoPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
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
        // Deszyfrowanie haseł
        const decryptedPasswords = await Promise.all(
          data.data.passwords.map(async (pwd: Password) => ({
            ...pwd,
            password: await cipher.decrypt(pwd.password)
          }))
        );
        setPasswords(decryptedPasswords);
      }
    } catch (err) {
      setError('Failed to load passwords');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (host: Host) => {
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      return;
    }
    setCurrentHost(host);
    setIsEditing(true);
  };

  const handleDelete = async (host: Host) => {
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this host?')) {
      return;
    }

    try {
      const response = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          data: {
            hosts: [] // Wysyłamy pustą listę aby usunąć hosta
          }
        })
      });

      if (response.ok) {
        window.location.reload(); // Odświeżamy stronę aby pobrać aktualną listę
      } else {
        setError('Failed to delete host');
      }
    } catch (err) {
      setError('Failed to delete host');
    }
  };

  const handleSubmit = async (hostData: Host) => {
    const cipher = CryptoSession.getCipher();
    if (!cipher) {
      setShowCryptoPrompt(true);
      return;
    }

    try {
      // Pobieramy aktualną listę hostów
      const response = await fetch('/api/v1/sync', {
        headers: auth.getAuthHeaders(),
      });

      const data = await response.json();
      let hosts = data.status === 'success' ? data.data.hosts : [];

      // Aktualizujemy lub dodajemy nowego hosta
      if (currentHost) {
        hosts = hosts.map((h: Host) => h.id === currentHost.id ? hostData : h);
      } else {
        hosts = [...hosts, hostData];
      }

      // Synchronizujemy z serwerem
      const syncResponse = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
        body: JSON.stringify({
          data: { hosts }
        })
      });

      if (syncResponse.ok) {
        setIsEditing(false);
        setCurrentHost(null);
        window.location.reload();
      } else {
        setError('Failed to save host');
      }
    } catch (err) {
      setError('Failed to save host');
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
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          {error}
        </div>
      )}

      {isEditing ? (
        <HostForm
          host={currentHost}
          passwords={passwords}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsEditing(false);
            setCurrentHost(null);
          }}
        />
      ) : (
        <HostsList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => {
            setCurrentHost(null);
            setIsEditing(true);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default HostsPage;