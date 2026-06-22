import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAcstpOsG98satp-sOdFoCwR6V6-4fYH9A",
  authDomain: "projectskorplus.firebaseapp.com",
  projectId: "projectskorplus",
  storageBucket: "projectskorplus.firebasestorage.app",
  messagingSenderId: "916682872075",
  appId: "1:916682872075:web:f1e662cef92e2b235b3e0e",
};

const app = initializeApp(firebaseConfig); 
export const auth = getAuth(app);
export const db = getFirestore(app);