"use client";

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { CartProvider } from './CartContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "demo-google-client-id.apps.googleusercontent.com";
  const [GoogleOAuthProviderComponent, setGoogleOAuthProviderComponent] = useState<any>(null);

  useEffect(() => {
    import('@react-oauth/google').then((mod) => {
      setGoogleOAuthProviderComponent(() => mod.GoogleOAuthProvider);
    }).catch(() => {
      // Ignore load error if any
    });
  }, []);

  const content = (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );

  if (!GoogleOAuthProviderComponent) {
    return content;
  }

  const Provider = GoogleOAuthProviderComponent;
  return (
    <Provider clientId={googleClientId}>
      {content}
    </Provider>
  );
}
