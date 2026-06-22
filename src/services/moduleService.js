import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Get all modules
export const getModules = async () => {
  const modulesRef = collection(db, 'modules');
  const snapshot = await getDocs(modulesRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Get user progress for all modules
export const getUserModuleProgress = async (userId) => {
  const progressRef = collection(db, 'users', userId, 'moduleProgress');
  const snapshot = await getDocs(progressRef);
  const progress = {};
  snapshot.docs.forEach((doc) => {
    progress[doc.id] = doc.data();
  });
  return progress;
};

// Update user progress after completing a game
export const updateModuleProgress = async (userId, moduleId, score) => {
  const progressRef = doc(db, 'users', userId, 'moduleProgress', moduleId);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    const current = progressSnap.data();
    const newProgress = Math.min(current.progress + 0.1, 1);
    const highScore = Math.max(current.highScore || 0, score);
    await updateDoc(progressRef, {
      progress: newProgress,
      highScore,
      lastPlayed: new Date().toISOString(),
    });
  } else {
    await setDoc(progressRef, {
      progress: 0.1,
      highScore: score,
      lastPlayed: new Date().toISOString(),
    });
  }
};