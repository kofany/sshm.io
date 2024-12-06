// src/pages/index.tsx
import React from 'react';
import Link from 'next/link';
import { FiGithub, FiTerminal, FiLock, FiKey } from 'react-icons/fi';

const IndexPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">sshm.io</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Sign in
              </Link>
              <Link 
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Secure SSH Management
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Terminal-based SSH manager with encrypted synchronization
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <FiTerminal className="h-8 w-8 text-blue-600" />
            <h3 className="mt-4 text-lg font-medium">Command-line Interface</h3>
            <p className="mt-2 text-gray-600">
              Termius-like terminal UI for efficient SSH management
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <FiLock className="h-8 w-8 text-blue-600" />
            <h3 className="mt-4 text-lg font-medium">End-to-End Encryption</h3>
            <p className="mt-2 text-gray-600">
              Your data is encrypted locally before sync
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <FiKey className="h-8 w-8 text-blue-600" />
            <h3 className="mt-4 text-lg font-medium">Password & Key Management</h3>
            <p className="mt-2 text-gray-600">
              Secure storage for your SSH credentials
            </p>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg shadow">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900">About the Project</h2>
            <div className="mt-4 space-y-4 text-gray-600">
              <p>
                sshm.io started as a personal project for me and my close friends, but I decided to make it available to everyone.
              </p>
              <p>
                Please note that this is a hobby project in continuous development. While I&apos;m actively working on it,
                I cannot guarantee its long-term availability or development timeline at this moment.
              </p>
              <p>
                The project is fully open-source and available on GitHub:
              </p>
              <div className="flex flex-col space-y-2">
                <a 
                  href="https://github.com/kofany/sshManager"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  <FiGithub className="mr-2" /> Desktop Application
                </a>
                <a 
                  href="https://github.com/kofany/sshm.io"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  <FiGithub className="mr-2" /> Web Interface
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 text-center text-gray-500">
            © 2024 sshm.io
          </div>
        </div>
      </footer>
    </main>
  );
};

export default IndexPage;