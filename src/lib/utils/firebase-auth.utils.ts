import { GoogleAuthProvider, signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseService } from '../services/firebase.service';

export const authUtils = {
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithRedirect(firebaseService.getAuth(), provider);
  },

  async signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(firebaseService.getAuth(), email, password);
  },

  async createUserWithEmail(email: string, password: string) {
    return createUserWithEmailAndPassword(firebaseService.getAuth(), email, password);
  },

  async signOut() {
    return signOut(firebaseService.getAuth());
  },

  getCurrentUser() {
    return firebaseService.getAuth().currentUser;
  },

  onAuthStateChanged(callback: (user: any) => void) {
    return firebaseService.subscribeToAuthState(callback);
  }
}; 