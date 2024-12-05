import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiServer, FiKey, FiLock, FiUser, FiCode, FiLogOut } from 'react-icons/fi';
import { CryptoSession } from '@/lib/crypto-session';

const Sidebar = () => {
  const router = useRouter();

  const menuItems = [
    { icon: FiServer, label: 'Hosts', path: '/dash/hosts' },
    { icon: FiKey, label: 'Keys', path: '/dash/keys' },
    { icon: FiLock, label: 'Passwords', path: '/dash/passwords' },
    { icon: FiCode, label: 'API Key', path: '/dash/api-key' },
    { icon: FiUser, label: 'Profile', path: '/dash/profile' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/logout', {
        method: 'POST',
        headers: {
          'X-Api-Key': localStorage.getItem('sshm_api_key') || '',
        },
      });

      // Wyczyść dane sesji
      localStorage.removeItem('sshm_api_key');
      CryptoSession.clearEncryptionKey();
      
      // Przekieruj do strony logowania
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">SSHM.io</h1>
        </div>

        {/* Menu */}
        <nav className="flex-1 mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-6 py-3 text-sm ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer z przyciskiem wylogowania */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <FiLogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>

        {/* Wersja */}
        <div className="p-4 text-xs text-gray-400 text-center border-t border-gray-200">
          Version 1.0.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;