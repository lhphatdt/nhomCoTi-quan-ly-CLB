import React, { useState } from 'react';
import { AuthUser } from '../types.ts';
import { LoginPage } from './LoginPage.tsx';
import { RegisterPage } from './RegisterPage.tsx';

interface AuthGateViewProps {
  authUsers: AuthUser[];
  onLoginSuccess: (user: AuthUser) => void;
  onRegisterNewUser: (newUser: AuthUser) => void;
  onGoogleSignIn?: () => Promise<void> | void;
}

export const AuthGateView: React.FC<AuthGateViewProps> = ({
  authUsers,
  onLoginSuccess,
  onRegisterNewUser,
  onGoogleSignIn,
}) => {
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (authView === 'register') {
    return (
      <RegisterPage
        authUsers={authUsers}
        onRegisterNewUser={onRegisterNewUser}
        onNavigateToLogin={() => setAuthView('login')}
      />
    );
  }

  return (
    <LoginPage
      authUsers={authUsers}
      onLoginSuccess={onLoginSuccess}
      onNavigateToRegister={() => setAuthView('register')}
      onGoogleSignIn={onGoogleSignIn}
    />
  );
};
