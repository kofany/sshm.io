// src/pages/confirm-email/[token].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { auth } from '@/lib/auth';

const ConfirmEmailPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token || typeof token !== 'string') {
        setStatus('error');
        setErrorMessage('Invalid confirmation token');
        return;
      }

      try {
        const response = await fetch('/api/v1/confirm-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.status === 'success') {
          // Zapisz nowy API key
          if (data.data?.api_key) {
            auth.login(data.data.api_key);
          }
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.message || 'Confirmation failed');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('An error occurred during email confirmation');
      }
    };

    if (token) {
      confirmEmail();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Email Confirmation
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="rounded-md bg-green-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Email confirmed successfully
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <p className="text-sm text-gray-600">
                  Your account has been activated. You can now log in.
                </p>
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <Link
                  href="/register"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Back to Registration
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmailPage;