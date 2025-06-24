import { auth } from '@/lib/firebase-init';
import { GoogleAuthProvider, signInWithRedirect, signOut as firebaseSignOut } from 'firebase/auth';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error('Error during sign-in with Google:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error during sign-out:', error);
    throw error;
  }
}; 