import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Create user profile when first login
export const createUserProfile = async (userId, data) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      name: data.name || 'Student',
      email: data.email || '',
      totalExp: 0,
      daysStreak: 0,
      completed: 0,
      exerciseProgress: 0,
      createdAt: new Date().toISOString(),
    });
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  }
  return null;
};

// Update user stats after completing game
export const updateUserStats = async (userId, { expGained, completed }) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const current = userSnap.data();
    await updateDoc(userRef, {
      totalExp: current.totalExp + expGained,
      completed: current.completed + completed,
      exerciseProgress: Math.min((current.exerciseProgress || 0) + 0.05, 1),
    });
  }
};