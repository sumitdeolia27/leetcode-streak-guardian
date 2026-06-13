import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyByW5MWjXilGzYiZ3AQ_K8V1NCzQgQyoZE',
  authDomain: 'leetcode-5b4a7.firebaseapp.com',
  projectId: 'leetcode-5b4a7',
  storageBucket: 'leetcode-5b4a7.firebasestorage.app',
  messagingSenderId: '828038793879',
  appId: '1:828038793879:web:f420e2deb8639b84eeb7d2',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
