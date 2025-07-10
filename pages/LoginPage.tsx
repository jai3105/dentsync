import React, { useState } from 'react';
import { ICONS } from '../constants';
import { auth, googleProvider } from '../services/firebase';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await auth.signInWithPopup(googleProvider);
      // No need to navigate, the onAuthStateChanged listener in AppContext will handle it
    } catch (err: any) {
      setError('Failed to sign in. Please try again.');
      console.error(err);
      setIsLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.424,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8 text-center">
          <div className="mx-auto mb-6 h-16 w-16 flex items-center justify-center rounded-full bg-primary-50 text-primary-600">
            {ICONS.clinic}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome to DentSync</h1>
          <p className="mt-2 text-slate-500">Your Modern Dental Practice Manager</p>

          <div className="mt-8">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full inline-flex justify-center items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <div className="mt-8 text-xs text-slate-400">
            By signing in, you agree to our terms of service.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;