import { 
  GoogleAuthProvider, 
  signInWithRedirect, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User,
  UserCredential
} from 'firebase/auth';
import { firebaseService } from '../services/firebase.service';

export const authUtils = {
  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    return signInWithRedirect(firebaseService.getAuth(), provider);
  },

  async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(firebaseService.getAuth(), email, password);
  },

  async createUserWithEmail(email: string, password: string): Promise<UserCredential> {
    return createUserWithEmailAndPassword(firebaseService.getAuth(), email, password);
  },

  async signOut(): Promise<void> {
    return signOut(firebaseService.getAuth());
  },

  getCurrentUser(): User | null {
    return firebaseService.getAuth().currentUser;
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseService.subscribeToAuthState(callback);
  }
}; 