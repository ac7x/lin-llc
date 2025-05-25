import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDsJP6_bjWLQ0SQiarhe3UIApnqx60vCqg",
  authDomain: "lin-llc-liff.firebaseapp.com",
  projectId: "lin-llc-liff",
  storageBucket: "lin-llc-liff.firebasestorage.app",
  messagingSenderId: "734381604026",
  appId: "1:734381604026:web:a07a50fe85c6c5acd25683",
  measurementId: "G-KBMLTJL6KK"
}

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig)
export const firestore: Firestore = getFirestore(firebaseApp)