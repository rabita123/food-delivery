'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a verification link to{' '}
            <span className="font-medium text-orange-600">{email}</span>
          </p>
        </div>
        <div className="rounded-md bg-white shadow-sm p-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Please check your email to verify your account. The verification link will expire in 24 hours.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Next steps:</p>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Open your email inbox</li>
                <li>Look for an email from HomeMade</li>
                <li>Click the verification link in the email</li>
                <li>Return here to sign in</li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">
                Can't find the email? Check your spam folder or click the button below to request a new verification email.
              </p>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <button
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: email || '',
                  });
                  if (error) throw error;
                  alert('New verification email sent!');
                } catch (error) {
                  console.error('Error resending email:', error);
                  alert('Failed to resend verification email. Please try again.');
                }
              }}
              className="w-full flex justify-center py-2 px-4 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-600 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Resend verification email
            </button>
            
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 