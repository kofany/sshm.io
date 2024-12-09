import React from 'react';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

const PrivacyAndTerms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link 
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
        >
          <FiArrowLeft className="mr-2" />
          Back to Home
        </Link>

        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy & Terms of Use</h1>

          <div className="prose max-w-none">
            <h2>Open Source Software Notice</h2>
            <p>sshm.io is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License version 3 (GPLv3) as published by the Free Software Foundation.</p>
            
            <p>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.</p>

            <h2>Self-Hosting</h2>
            <p>You are free to self-host sshm.io on your own servers. The source code is available on GitHub, and you can deploy and modify it according to your needs under the terms of GPLv3.</p>

            <h2>Disclaimer of Warranty</h2>
            <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. YOU USE THIS SOFTWARE AT YOUR OWN RISK. THE DEVELOPERS AND CONTRIBUTORS:</p>
            <ul>
              <li>MAKE NO WARRANTIES ABOUT THE SOFTWARE</li>
              <li>DO NOT GUARANTEE ITS RELIABILITY, AVAILABILITY, OR FUNCTIONALITY</li>
              <li>ARE NOT RESPONSIBLE FOR ANY DAMAGES OR LOSSES RESULTING FROM ITS USE</li>
            </ul>

            <h2>Privacy Information</h2>
            <p>For the hosted version at sshm.io:</p>
            <ul>
              <li><strong>Email Usage:</strong> We collect your email address solely for:
                <ul>
                  <li>Account registration</li>
                  <li>Password recovery</li>
                </ul>
              </li>
              <li><strong>Data Storage:</strong> All sensitive data (hosts, passwords, keys) is:
                <ul>
                  <li>End-to-end encrypted</li>
                  <li>Never accessible to us in unencrypted form</li>
                  <li>Stored on servers located in the UK</li>
                </ul>
              </li>
              <li><strong>No Tracking:</strong> We do not use any tracking cookies or analytics</li>
            </ul>

            <h2>Data Security</h2>
            <p>While we implement security best practices, no method of electronic storage is 100% secure. We cannot guarantee absolute security of your data. You are responsible for:</p>
            <ul>
              <li>Keeping your encryption key secure</li>
              <li>Maintaining secure passwords</li>
              <li>Properly configuring your self-hosted installation if you choose to self-host</li>
            </ul>

            <h2>Service Availability</h2>
            <p>The hosted version at sshm.io is provided as-is, without any guarantees of:</p>
            <ul>
              <li>Uptime or availability</li>
              <li>Data retention or backup</li>
              <li>Continued service operation</li>
            </ul>

            <p>We recommend keeping local backups of your configuration if you use the hosted version.</p>

            <h2>Termination</h2>
            <p>We reserve the right to terminate any account or deny access to the service for any reason, at any time.</p>

            <h2>Source Code</h2>
            <p>The complete source code is available at:
              <br />
              <a href="https://github.com/kofany/sshManager" className="text-blue-600 hover:text-blue-700">
                github.com/kofany/sshManager
              </a> (Desktop Application)
              <br />
              <a href="https://github.com/kofany/sshm.io" className="text-blue-600 hover:text-blue-700">
                github.com/kofany/sshm.io
              </a> (Web Interface)
            </p>

            <h2>Contact</h2>
            <p>For questions about this privacy policy or the software:</p>
            <p>Email: kofany@sshm.io</p>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                By using sshm.io, you acknowledge that you have read and understood this policy and agree to use the software at your own risk.
              </p>
            </div>

            <p className="text-sm text-gray-500 mt-8">Last updated: December 9, 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyAndTerms;