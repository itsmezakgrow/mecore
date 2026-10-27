/**
 * Life & Business Operating System
 * Modular Firebase Firestore (v9) Architecture & Client Implementation
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 1. Firebase Configuration
export const firebaseConfig = {
  projectId: "analytical-odyssey-667s8",
  appId: "1:533238195387:web:e6e13b21131f494c94359e",
  apiKey: "AIzaSyCEV-eK9kIJ4q3dS72tA1iCeDIcrefEPz8",
  authDomain: "analytical-odyssey-667s8.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-62a9a09f-0318-4e69-9bc5-8a7cf4a7640d"
};

// 2. Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// 3. Modular Firestore CRUD Functions
export const TasksAPI = {
  subscribe(callback) {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      callback(items);
    });
  },
  async add(task) {
    return await addDoc(collection(db, "tasks"), {
      ...task,
      createdAt: Date.now()
    });
  },
  async update(id, updates) {
    return await updateDoc(doc(db, "tasks", id), updates);
  },
  async delete(id) {
    return await deleteDoc(doc(db, "tasks", id));
  }
};

export const HabitsAPI = {
  subscribe(callback) {
    const q = query(collection(db, "habits"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      callback(items);
    });
  },
  async add(habit) {
    return await addDoc(collection(db, "habits"), {
      ...habit,
      history: habit.history || {},
      streak: habit.streak || 0,
      createdAt: Date.now()
    });
  },
  async toggleDate(habit, dateKey) {
    const history = { ...(habit.history || {}) };
    history[dateKey] = !history[dateKey];
    
    // Streak calculation
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (history[key]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return await updateDoc(doc(db, "habits", habit.id), {
      history,
      streak
    });
  },
  async delete(id) {
    return await deleteDoc(doc(db, "habits", id));
  }
};
