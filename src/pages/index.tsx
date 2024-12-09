import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiGithub, FiTerminal, FiLock, FiKey, FiServer, FiCode } from 'react-icons/fi';

const IndexPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Image
                src="/logo.svg"
                alt="sshm.io Logo"
                width={160}
                height={40}
                priority
              />
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
            Free and Open Source Terminal-based SSH Manager with Encrypted Synchronization
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <a 
              href="https://github.com/kofany/sshManager"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <FiGithub className="mr-2" />
              View on GitHub
            </a>
          </div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <FiTerminal className="h-8 w-8 text-blue-600" />
            <h3 className="mt-4 text-lg font-medium">Command-line Interface</h3>
            <p className="mt-2 text-gray-600">
              Termius-like terminal UI tool for efficient SSH management
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
            <h2 className="text-2xl font-bold text-gray-900">Open Source & Self-Hosted</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div className="border rounded-lg p-6">
                <FiCode className="h-8 w-8 text-blue-600" />
                <h3 className="mt-4 text-lg font-medium">100% Open Source</h3>
                <p className="mt-2 text-gray-600">
                  Licensed under GPLv3, you have the freedom to view, modify, and distribute the code. Available on GitHub for both desktop and web components.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <FiServer className="h-8 w-8 text-blue-600" />
                <h3 className="mt-4 text-lg font-medium">Self-Hosting Ready</h3>
                <p className="mt-2 text-gray-600">
                  Deploy on your own infrastructure. Full control over your data and environment.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg shadow">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900">Important Notice</h2>
            <div className="mt-4 text-gray-600">
              <p className="mb-4">
                sshm.io is provided as free software under the GNU General Public License v3 (GPLv3). The software is provided "as is", without warranty of any kind, express or implied.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Disclaimer</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>You use this software at your own risk</li>
                  <li>No warranty for service availability or data retention</li>
                  <li>No guarantee of merchantability or fitness for a particular purpose</li>
                  <li>You are responsible for your data and security practices</li>
                </ul>
              </div>
            </div>
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
                Please note that this is a hobby project in continuous development. While I'm actively working on it,
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
            <div className="space-x-4 mb-4">
              <Link href="/privacy-policy" className="hover:text-gray-700">
                Privacy Policy & Terms
              </Link>
            </div>
            <div>
              Licensed under <a href="https://www.gnu.org/licenses/gpl-3.0.en.html" className="text-blue-600 hover:text-blue-700">GNU GPLv3</a>
            </div>
            <div className="mt-2">
              © 2024 sshm.io
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default IndexPage;