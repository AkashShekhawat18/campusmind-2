'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Use env variable or fallback
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';

export function GoogleLoginButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (credentialResponse: any) => {
    try {
      // Send the Google ID token to the FastAPI backend
      const res = await fetch('http://localhost:8000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to authenticate with backend');
      }

      const data = await res.json();
      
      // Store the JWT and user data in localStorage
      localStorage.setItem('campusmind_token', data.token);
      localStorage.setItem('campusmind_user', JSON.stringify(data.user));

      // Redirect to the dashboard
      router.push('/admin/dashboard'); 
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <GoogleOAuthProvider clientId={clientId}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            console.error('Google Login Failed');
            setError('Google Login Failed');
          }}
          useOneTap
          theme="filled_black"
          shape="pill"
        />
      </GoogleOAuthProvider>
      {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
    </div>
  );
}
