import { type User } from 'firebase/auth';
import { type RoleKey } from '@/constants/roles';

declare module 'firebase/auth' {
  interface User {
    currentRole?: RoleKey;
  }
}

export interface AuthUser extends User {
  currentRole: RoleKey;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  signInWithGoogle: () => Promise<void>;
}
