'use client';

import { auth, default as firebaseClientServices } from '@/lib/firebase-init';
import { User } from 'firebase/auth';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';

interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  error: Error | undefined;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: undefined,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    void firebaseClientServices.initializeClientServices();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 