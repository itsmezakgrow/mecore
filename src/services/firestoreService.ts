import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  deleteField,
  getDocs,
  getDoc,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { TaskItem, HabitItem, ProjectItem, NoteItem, WeeklyPlanSlot, ChecklistGroup, GoalItem, FocusSession, AppComment, WorkoutSession, SundayReset, ReviewEntry, DailyBlockItem, ModuleLifecycleEvent, MonthlyPlanMeta, WeeklyPriorityGoal, DailySleepLog, SleepScheduleConfig, AccessControlData, BodyMetricLog, BodyProfileConfig, ScheduledWorkoutItem, CognitiveReflection, VisualizationStory, Affirmation } from '../types';

/**
 * Deeply sanitizes updates for Firestore updateDoc operations by replacing
 * `undefined` with `deleteField()`.
 */
export function sanitizeUpdateData<T extends Record<string, any>>(data: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      sanitized[key] = deleteField();
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeUpdateData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Deeply sanitizes insert data for Firestore addDoc/setDoc operations by removing
 * keys with `undefined` values.
 */
export function sanitizeInsertData<T extends Record<string, any>>(data: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        sanitized[key] = sanitizeInsertData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

// Collection references
const TASKS_COLL = 'tasks';
const HABITS_COLL = 'habits';
const PROJECTS_COLL = 'projects';
const NOTES_COLL = 'notes';
const PLANNER_COLL = 'planner';
const CHECKLISTS_COLL = 'checklists';
const GOALS_COLL = 'goals';
const COMMENTS_COLL = 'comments';
const WORKOUTS_COLL = 'workouts';
const FOCUS_COLL = 'focus_sessions';
const SUNDAY_RESETS_COLL = 'sunday_resets';
const REVIEWS_COLL = 'reviews';
const SLEEP_LOGS_COLL = 'sleep_logs';
const SLEEP_CONFIG_COLL = 'sleep_config';
const ACCESS_CONTROL_COLL = 'access_control';
const BODY_METRICS_COLL = 'body_metrics';
const BODY_PROFILE_COLL = 'body_profile';
const SCHEDULED_WORKOUTS_COLL = 'scheduled_workouts';
const REFLECTIONS_COLL = 'reflections';
const VISIONS_COLL = 'visions';
const AFFIRMATIONS_COLL = 'affirmations';

// Safe AbortError Detection
export function isAbortError(err: any): boolean {
  if (!err) return false;
  const name = err.name || err.code || err.constructor?.name || '';
  const msg = typeof err === 'string' ? err : err.message || '';
  let str = '';
  try { str = String(err); } catch {}
  const reasonStr = (err.reason && (err.reason.message || String(err.reason))) || '';
  return (
    name === 'AbortError' ||
    name === 'cancelled' ||
    name === 'DOMException' ||
    msg.includes('aborted') ||
    msg.includes('AbortError') ||
    msg.includes('The user aborted a request') ||
    msg.includes('signal is aborted') ||
    str.includes('aborted') ||
    str.includes('AbortError') ||
    str.includes('signal is aborted') ||
    reasonStr.includes('aborted') ||
    reasonStr.includes('signal is aborted')
  );
}

function handleSubscriptionError(context: string, error: any, onError?: (err: any) => void) {
  if (isAbortError(error)) return;
  console.warn(`Firestore ${context} subscription warning:`, error);
  if (onError) onError(error);
}

// ----------------- Tasks -----------------
export const subscribeToTasks = (
  callback: (tasks: TaskItem[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, TASKS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: TaskItem[] = [];
      snapshot.forEach((d) => {
        tasks.push({ id: d.id, ...d.data() } as TaskItem);
      });
      callback(tasks);
    },
    (error) => handleSubscriptionError("tasks", error, onError)
  );
};

export const addTask = async (task: Omit<TaskItem, 'id'>) => {
  return await addDoc(collection(db, TASKS_COLL), sanitizeInsertData(task));
};

export const updateTask = async (id: string, updates: Partial<TaskItem>) => {
  const ref = doc(db, TASKS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteTask = async (id: string) => {
  const ref = doc(db, TASKS_COLL, id);
  return await deleteDoc(ref);
};

export const reorderTasks = async (taskIds: string[]) => {
  const batch = writeBatch(db);
  taskIds.forEach((id, index) => {
    const ref = doc(db, TASKS_COLL, id);
    batch.update(ref, { order: index });
  });
  return await batch.commit();
};

export const updateTaskProgress = async (taskId: string, currentValue: number, targetValue?: number) => {
  const ref = doc(db, TASKS_COLL, taskId);
  const target = targetValue && targetValue > 0 ? targetValue : 1;
  const isCompleted = currentValue >= target;
  return await updateDoc(ref, {
    currentValue: currentValue,
    completed: isCompleted,
    ...(isCompleted ? { completedAt: Date.now() } : {})
  });
};

// ----------------- Habits -----------------
export const subscribeToHabits = (
  callback: (habits: HabitItem[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, HABITS_COLL), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const habits: HabitItem[] = [];
      snapshot.forEach((d) => {
        habits.push({ id: d.id, ...d.data() } as HabitItem);
      });
      callback(habits);
    },
    (error) => handleSubscriptionError("habits", error, onError)
  );
};

export const addHabit = async (habit: Omit<HabitItem, 'id'>) => {
  return await addDoc(collection(db, HABITS_COLL), sanitizeInsertData(habit));
};

export const toggleHabitDate = async (habit: HabitItem, dateKey: string) => {
  if (!habit.id) return;
  const currentHistory = { ...(habit.history || {}) };
  const currentFreezes = { ...(habit.freezes || {}) };
  const newState = !currentHistory[dateKey];
  currentHistory[dateKey] = newState;

  if (newState) {
    // If checked in, remove the freeze for this day
    delete currentFreezes[dateKey];
  }

  // Calculate streak based on consecutive prior days (either checked in OR frozen)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (currentHistory[key] || currentFreezes[key]) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const ref = doc(db, HABITS_COLL, habit.id);
  return await updateDoc(ref, {
    history: currentHistory,
    freezes: currentFreezes,
    streak: streak
  });
};

export const toggleHabitFreeze = async (habit: HabitItem, dateKey: string) => {
  if (!habit.id) return;
  const currentHistory = { ...(habit.history || {}) };
  const currentFreezes = { ...(habit.freezes || {}) };
  const newState = !currentFreezes[dateKey];
  
  if (newState) {
    // Freeze applied: remove check-in if any
    currentFreezes[dateKey] = true;
    currentHistory[dateKey] = false;
  } else {
    delete currentFreezes[dateKey];
  }

  // Calculate streak based on consecutive prior days (either checked in OR frozen)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (currentHistory[key] || currentFreezes[key]) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const ref = doc(db, HABITS_COLL, habit.id);
  return await updateDoc(ref, {
    history: currentHistory,
    freezes: currentFreezes,
    streak: streak
  });
};

export const updateHabit = async (id: string, updates: Partial<HabitItem>) => {
  const ref = doc(db, HABITS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const addHabitNote = async (habitId: string, dateKey: string, noteText: string, currentNotes: Record<string, string> = {}) => {
  const ref = doc(db, HABITS_COLL, habitId);
  const updated = { ...currentNotes, [dateKey]: noteText };
  return await updateDoc(ref, { notes: updated });
};

export const deleteHabit = async (id: string) => {
  const ref = doc(db, HABITS_COLL, id);
  return await updateDoc(ref, { archived: true });
};

export const reorderHabits = async (habitIds: string[]) => {
  const batch = writeBatch(db);
  habitIds.forEach((id, index) => {
    const ref = doc(db, HABITS_COLL, id);
    batch.update(ref, { order: index });
  });
  return await batch.commit();
};

export const updateHabitDailyValue = async (habit: HabitItem, dateKey: string, value: number) => {
  if (!habit.id) return;
  const currentDailyValues = { ...(habit.dailyValues || {}) };
  const currentHistory = { ...(habit.history || {}) };
  const currentFreezes = { ...(habit.freezes || {}) };
  
  currentDailyValues[dateKey] = value;
  const target = habit.targetValue && habit.targetValue > 0 ? habit.targetValue : 1;
  const isDone = value >= target;
  currentHistory[dateKey] = isDone;

  if (isDone) {
    delete currentFreezes[dateKey];
  }

  // Calculate streak based on consecutive prior days (either checked in OR frozen)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (currentHistory[key] || currentFreezes[key]) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const ref = doc(db, HABITS_COLL, habit.id);
  return await updateDoc(ref, {
    dailyValues: currentDailyValues,
    history: currentHistory,
    freezes: currentFreezes,
    streak: streak
  });
};

// ----------------- Projects -----------------
export const subscribeToProjects = (
  callback: (projects: ProjectItem[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, PROJECTS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const projects: ProjectItem[] = [];
      snapshot.forEach((d) => {
        projects.push({ id: d.id, ...d.data() } as ProjectItem);
      });
      callback(projects);
    },
    (error) => handleSubscriptionError("projects", error, onError)
  );
};

export const addProject = async (project: Omit<ProjectItem, 'id'>) => {
  return await addDoc(collection(db, PROJECTS_COLL), sanitizeInsertData(project));
};

export const updateProject = async (id: string, updates: Partial<ProjectItem>) => {
  const ref = doc(db, PROJECTS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteProject = async (id: string) => {
  const ref = doc(db, PROJECTS_COLL, id);
  return await deleteDoc(ref);
};

// ----------------- Weekly Planner -----------------
export const subscribeToPlanner = (
  callback: (plans: WeeklyPlanSlot[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, PLANNER_COLL), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const plans: WeeklyPlanSlot[] = [];
      snapshot.forEach((d) => {
        plans.push({ id: d.id, ...d.data() } as WeeklyPlanSlot);
      });
      callback(plans);
    },
    (error) => handleSubscriptionError("planner", error, onError)
  );
};

export const addPlannerSlot = async (slot: Omit<WeeklyPlanSlot, 'id'>) => {
  return await addDoc(collection(db, PLANNER_COLL), sanitizeInsertData(slot));
};

export const updatePlannerSlot = async (id: string, updates: Partial<WeeklyPlanSlot>) => {
  const ref = doc(db, PLANNER_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deletePlannerSlot = async (id: string) => {
  const ref = doc(db, PLANNER_COLL, id);
  return await deleteDoc(ref);
};

export const batchApplyPlannerSlots = async (slots: Omit<WeeklyPlanSlot, 'id'>[]) => {
  const batch = writeBatch(db);
  slots.forEach((s) => {
    const newRef = doc(collection(db, PLANNER_COLL));
    batch.set(newRef, sanitizeInsertData(s));
  });
  return await batch.commit();
};

export const clearPlannerSlotsForDay = async (dayIndex: number, existingSlots: WeeklyPlanSlot[]) => {
  const toDelete = existingSlots.filter(s => s.dayIndex === dayIndex && s.id);
  if (toDelete.length === 0) return;
  const batch = writeBatch(db);
  toDelete.forEach(s => {
    if (s.id) {
      const ref = doc(db, PLANNER_COLL, s.id);
      batch.delete(ref);
    }
  });
  return await batch.commit();
};

// ----------------- Monthly Plans -----------------
const MONTHLY_PLANS_COLL = 'monthly_plans';

export const subscribeToMonthlyPlans = (
  callback: (plans: MonthlyPlanMeta[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, MONTHLY_PLANS_COLL));
  return onSnapshot(
    q,
    (snapshot) => {
      const plans: MonthlyPlanMeta[] = [];
      snapshot.forEach((d) => {
        plans.push({ id: d.id, ...d.data() } as MonthlyPlanMeta);
      });
      callback(plans);
    },
    (error) => handleSubscriptionError("monthly_plans", error, onError)
  );
};

export const saveMonthlyPlanMeta = async (meta: Omit<MonthlyPlanMeta, 'id'>) => {
  const q = query(collection(db, MONTHLY_PLANS_COLL), where('monthKey', '==', meta.monthKey));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docId = snap.docs[0].id;
    const ref = doc(db, MONTHLY_PLANS_COLL, docId);
    return await updateDoc(ref, sanitizeUpdateData({ ...meta, updatedAt: Date.now() }));
  } else {
    return await addDoc(collection(db, MONTHLY_PLANS_COLL), sanitizeInsertData({ ...meta, updatedAt: Date.now() }));
  }
};

// ----------------- Notes -----------------
export const subscribeToNotes = (
  callback: (notes: NoteItem[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, NOTES_COLL), orderBy('pinned', 'desc'), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const notes: NoteItem[] = [];
      snapshot.forEach((d) => {
        notes.push({ id: d.id, ...d.data() } as NoteItem);
      });
      callback(notes);
    },
    (error) => handleSubscriptionError("notes", error, onError)
  );
};

export const addNote = async (note: Omit<NoteItem, 'id'>) => {
  return await addDoc(collection(db, NOTES_COLL), sanitizeInsertData(note));
};

export const updateNote = async (id: string, updates: Partial<NoteItem>) => {
  const ref = doc(db, NOTES_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData({
    ...updates,
    updatedAt: Date.now()
  }));
};

export const deleteNote = async (id: string) => {
  const ref = doc(db, NOTES_COLL, id);
  return await deleteDoc(ref);
};

// ----------------- Checklists -----------------
export const subscribeToChecklists = (
  callback: (checklists: ChecklistGroup[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, CHECKLISTS_COLL), orderBy('pinned', 'desc'), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const checklists: ChecklistGroup[] = [];
      snapshot.forEach((d) => {
        checklists.push({ id: d.id, ...d.data() } as ChecklistGroup);
      });
      callback(checklists);
    },
    (error) => handleSubscriptionError("checklists", error, onError)
  );
};

export const addChecklist = async (checklist: Omit<ChecklistGroup, 'id'>) => {
  return await addDoc(collection(db, CHECKLISTS_COLL), sanitizeInsertData(checklist));
};

export const updateChecklist = async (id: string, updates: Partial<ChecklistGroup>) => {
  const ref = doc(db, CHECKLISTS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData({
    ...updates,
    updatedAt: Date.now(),
  }));
};

export const deleteChecklist = async (id: string) => {
  const ref = doc(db, CHECKLISTS_COLL, id);
  return await deleteDoc(ref);
};

// ----------------- Goals & Lifetime Endpoints -----------------
export const subscribeToGoals = (
  callback: (goals: GoalItem[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, GOALS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const goals: GoalItem[] = [];
      snapshot.forEach((d) => {
        goals.push({ id: d.id, ...d.data() } as GoalItem);
      });
      callback(goals);
    },
    (error) => handleSubscriptionError("goals", error, onError)
  );
};

export const addGoal = async (goal: Omit<GoalItem, 'id'>) => {
  return await addDoc(collection(db, GOALS_COLL), sanitizeInsertData(goal));
};

export const updateGoal = async (id: string, updates: Partial<GoalItem>) => {
  const ref = doc(db, GOALS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteGoal = async (id: string) => {
  const ref = doc(db, GOALS_COLL, id);
  return await updateDoc(ref, { archived: true });
};

// ----------------- Comprehensive Clean Start Engine -----------------
export const ALL_WORKSPACE_COLLECTIONS = [
  TASKS_COLL,
  HABITS_COLL,
  PROJECTS_COLL,
  NOTES_COLL,
  PLANNER_COLL,
  CHECKLISTS_COLL,
  GOALS_COLL,
  COMMENTS_COLL,
  FOCUS_COLL,
  WORKOUTS_COLL,
  SCHEDULED_WORKOUTS_COLL,
  BODY_METRICS_COLL,
  BODY_PROFILE_COLL,
  SUNDAY_RESETS_COLL,
  REVIEWS_COLL,
  'daily_blocks',
  'monthly_plans',
  'weekly_goals',
  SLEEP_LOGS_COLL,
  SLEEP_CONFIG_COLL,
  'module_lifecycle'
];

/**
 * Complete Clean Slate: Permanently wipes all collections to start completely blank.
 */
export const completeCleanWipe = async () => {
  const { getDocs, writeBatch } = await import('firebase/firestore');
  let totalDeleted = 0;

  for (const colName of ALL_WORKSPACE_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const docs = snap.docs;
        const chunkSize = 400;
        for (let i = 0; i < docs.length; i += chunkSize) {
          const chunk = docs.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach((docSnap) => {
            batch.delete(docSnap.ref);
            totalDeleted++;
          });
          await batch.commit();
        }
      }
    } catch (err) {
      console.warn(`Clean wipe warning for ${colName}:`, err);
    }
  }

  if (typeof window !== 'undefined') {
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    localStorage.setItem('app_clean_start_date', today);
    localStorage.setItem('app_clean_start_timestamp', Date.now().toString());
    localStorage.setItem('app_start_date', nowIso);
    localStorage.setItem('app_life_phases_v1', JSON.stringify([]));
    localStorage.setItem('app_milestone_rewards_v1', JSON.stringify([]));
    localStorage.setItem('app_active_phase_id', '');
    localStorage.removeItem('core_daily_focus_telemetry');
    localStorage.removeItem('core_atlas_chat_history');
    localStorage.removeItem('planner_monthly_themes_v1');
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('planner_theme_') || key.startsWith('pomodoro_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    window.dispatchEvent(new Event('core_workspace_cleaned'));
  }

  return totalDeleted;
};

export const clearAllDataFromFirestore = completeCleanWipe;

/**
 * Start Clean Fresh Performance:
 * Keeps all habit definitions, project structures, and task definitions intact as the user's foundation,
 * but wipes all historical completions, streaks, numbers, and logs so performance starts completely fresh from today!
 */
export const startCleanFreshPerformance = async (options?: {
  uncompleteTasks?: boolean;
  clearSleepHistory?: boolean;
  clearFocusHistory?: boolean;
  clearDailyBlocksHistory?: boolean;
  clearSundayResets?: boolean;
  clearReviewsHistory?: boolean;
}) => {
  const { getDocs, writeBatch } = await import('firebase/firestore');
  const today = new Date().toISOString().split('T')[0];
  let habitsResetCount = 0;
  let tasksResetCount = 0;
  let recordsDeletedCount = 0;

  // Helper for chunked batch commit
  const chunkedBatchExecute = async (docs: any[], operation: (batch: any, docSnap: any) => void) => {
    const chunkSize = 400;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => operation(batch, d));
      await batch.commit();
    }
  };

  // 1. Reset all habits performance in Firestore
  const habitSnap = await getDocs(collection(db, HABITS_COLL));
  if (!habitSnap.empty) {
    await chunkedBatchExecute(habitSnap.docs, (batch, docSnap) => {
      batch.update(docSnap.ref, {
        history: {},
        dailyValues: {},
        freezes: {},
        freezeExcuses: {},
        dailyMoods: {},
        notes: {},
        streak: 0,
        startDate: today,
        completedDates: [],
        completionHistory: {},
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        excuses: [],
        habitLogs: [],
        freezePassesUsed: 0,
        updatedAt: Date.now()
      });
      habitsResetCount++;
    });
  }

  // 2. Reset tasks completion if requested (default: true)
  if (options?.uncompleteTasks !== false) {
    const taskSnap = await getDocs(collection(db, TASKS_COLL));
    if (!taskSnap.empty) {
      await chunkedBatchExecute(taskSnap.docs, (batch, docSnap) => {
        batch.update(docSnap.ref, {
          completed: false,
          currentValue: 0,
          kanbanStatus: 'todo',
          completedAt: deleteField()
        });
        tasksResetCount++;
      });
    }
  }

  // 3. Clear focus session logs (Pomodoros)
  if (options?.clearFocusHistory !== false) {
    const focusSnap = await getDocs(collection(db, FOCUS_COLL));
    if (!focusSnap.empty) {
      await chunkedBatchExecute(focusSnap.docs, (batch, docSnap) => {
        batch.delete(docSnap.ref);
        recordsDeletedCount++;
      });
    }
  }

  // 4. Clear sleep history before today (keep today if any)
  if (options?.clearSleepHistory !== false) {
    const sleepSnap = await getDocs(collection(db, SLEEP_LOGS_COLL));
    if (!sleepSnap.empty) {
      const docsToDelete = sleepSnap.docs.filter((d) => d.data().date !== today);
      await chunkedBatchExecute(docsToDelete, (batch, docSnap) => {
        batch.delete(docSnap.ref);
        recordsDeletedCount++;
      });
    }
  }

  // 5. Clear historical daily blocks before today
  if (options?.clearDailyBlocksHistory !== false) {
    const blocksSnap = await getDocs(collection(db, 'daily_blocks'));
    if (!blocksSnap.empty) {
      const docsToDelete = blocksSnap.docs.filter((d) => d.data().date && d.data().date !== today);
      await chunkedBatchExecute(docsToDelete, (batch, docSnap) => {
        batch.delete(docSnap.ref);
        recordsDeletedCount++;
      });
    }
  }

  // 6. Clear reviews before today if requested
  if (options?.clearReviewsHistory) {
    const reviewsSnap = await getDocs(collection(db, REVIEWS_COLL));
    if (!reviewsSnap.empty) {
      await chunkedBatchExecute(reviewsSnap.docs, (batch, docSnap) => {
        batch.delete(docSnap.ref);
        recordsDeletedCount++;
      });
    }
  }

  // 7. Record Clean Start Timestamp in localStorage & notify
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_clean_start_date', today);
    localStorage.setItem('app_clean_start_timestamp', Date.now().toString());
    localStorage.removeItem('core_daily_focus_telemetry');
    window.dispatchEvent(new Event('core_workspace_cleaned'));
  }

  return { habitsResetCount, tasksResetCount, recordsDeletedCount, cleanStartDate: today };
};

// Seed initial template data if collections are empty (Clean default)
export const seedInitialDataIfEmpty = async (
  hasTasks: boolean,
  hasHabits: boolean,
  hasProjects: boolean,
  hasNotes: boolean,
  hasPlanner: boolean,
  hasChecklists?: boolean,
  hasGoals?: boolean
) => {
  // Respect clean slate preference: do not auto-repopulate dummy items once explicitly cleaned
};

export interface WorkspaceBackupPayload {
  habits?: HabitItem[];
  tasks?: TaskItem[];
  projects?: ProjectItem[];
  notes?: NoteItem[];
  planner?: WeeklyPlanSlot[];
  checklists?: ChecklistGroup[];
  goals?: GoalItem[];
  comments?: AppComment[];
  focusSessions?: FocusSession[];
  focus_sessions?: FocusSession[];
  focusHistory?: FocusSession[];
  dailyBlocks?: any[];
  daily_blocks?: any[];
  lifePhases?: any[];
  life_phases?: any[];
  rewards?: any[];
}

export interface BackupImportSummary {
  totalCount: number;
  habitsCount: number;
  tasksCount: number;
  projectsCount: number;
  notesCount: number;
  plannerCount: number;
  checklistsCount: number;
  goalsCount: number;
  commentsCount: number;
  focusCount: number;
  dailyBlocksCount?: number;
}

// Batch restore or import from JSON backup
export const importBackupData = async (backupJson: WorkspaceBackupPayload): Promise<number> => {
  let importedCount = 0;
  if (backupJson.habits && Array.isArray(backupJson.habits)) {
    for (const h of backupJson.habits) {
      const { id, ...rest } = h;
      await addDoc(collection(db, HABITS_COLL), rest);
      importedCount++;
    }
  }
  if (backupJson.tasks && Array.isArray(backupJson.tasks)) {
    for (const t of backupJson.tasks) {
      const { id, ...rest } = t;
      await addDoc(collection(db, TASKS_COLL), rest);
      importedCount++;
    }
  }
  if (backupJson.projects && Array.isArray(backupJson.projects)) {
    for (const p of backupJson.projects) {
      const { id, ...rest } = p;
      await addDoc(collection(db, PROJECTS_COLL), rest);
      importedCount++;
    }
  }
  if (backupJson.checklists && Array.isArray(backupJson.checklists)) {
    for (const c of backupJson.checklists) {
      const { id, ...rest } = c;
      await addDoc(collection(db, CHECKLISTS_COLL), rest);
      importedCount++;
    }
  }
  if (backupJson.notes && Array.isArray(backupJson.notes)) {
    for (const n of backupJson.notes) {
      const { id, ...rest } = n;
      await addDoc(collection(db, NOTES_COLL), rest);
      importedCount++;
    }
  }
  if (backupJson.planner && Array.isArray(backupJson.planner)) {
    for (const pl of backupJson.planner) {
      const { id, ...rest } = pl;
      await addDoc(collection(db, PLANNER_COLL), rest);
      importedCount++;
    }
  }
  if (backupJson.goals && Array.isArray(backupJson.goals)) {
    for (const g of backupJson.goals) {
      const { id, ...rest } = g;
      await addDoc(collection(db, GOALS_COLL), rest);
      importedCount++;
    }
  }
  if (backupJson.comments && Array.isArray(backupJson.comments)) {
    for (const com of backupJson.comments) {
      const { id, ...rest } = com;
      await addDoc(collection(db, COMMENTS_COLL), rest);
      importedCount++;
    }
  }
  const focusItems = backupJson.focusSessions || backupJson.focus_sessions || backupJson.focusHistory;
  if (focusItems && Array.isArray(focusItems)) {
    for (const fs of focusItems) {
      const { id, ...rest } = fs;
      await addDoc(collection(db, FOCUS_COLL), rest);
      importedCount++;
    }
  }
  const dBlocks = backupJson.dailyBlocks || backupJson.daily_blocks;
  if (dBlocks && Array.isArray(dBlocks)) {
    for (const dbItem of dBlocks) {
      const { id, ...rest } = dbItem;
      await addDoc(collection(db, 'daily_blocks'), rest);
      importedCount++;
    }
  }
  const phases = backupJson.lifePhases || backupJson.life_phases;
  if (phases && Array.isArray(phases) && typeof window !== 'undefined') {
    try {
      localStorage.setItem('app_life_phases_v1', JSON.stringify(phases));
      if (phases[0]?.id) {
        localStorage.setItem('app_active_phase_id', phases[0].id);
      }
      importedCount += phases.length;
    } catch {}
  }
  if (backupJson.rewards && Array.isArray(backupJson.rewards) && typeof window !== 'undefined') {
    try {
      localStorage.setItem('app_milestone_rewards_v1', JSON.stringify(backupJson.rewards));
      importedCount += backupJson.rewards.length;
    } catch {}
  }

  return importedCount;
};

export interface PlanImportJSON {
  week?: string;
  habits?: Array<{
    name?: string;
    title?: string;
    category?: string;
    frequency?: string;
    targetPerWeek?: number;
  }>;
  tasks?: Array<{
    title: string;
    priority?: 'High' | 'Med' | 'Low' | string;
    matrix?: string;
    category?: string;
    dueDate?: string;
  }>;
  goals?: Array<{
    title: string;
    type?: string;
    category?: string;
    vision?: string;
    endpointTarget?: string;
    targetDate?: string;
  }>;
  planner?: Array<{
    dayIndex?: number;
    title: string;
    timeSlot?: string;
    type?: 'deep-work' | 'meeting' | 'workout' | 'personal' | 'general';
  }>;
}

// Dedicated JSON Plan Importer: Batch writes habits, tasks, goals into Firestore
export const importPlanJSON = async (plan: PlanImportJSON) => {
  const batch = writeBatch(db);
  const now = Date.now();
  let itemsCount = 0;

  // Process Habits
  if (Array.isArray(plan.habits)) {
    for (const h of plan.habits) {
      const habitTitle = h.name || h.title || 'New Habit';
      const targetDays = h.frequency?.toLowerCase() === 'daily' 
        ? 7 
        : (h.targetPerWeek || (h.frequency?.includes('Weekly') ? 3 : 7));
      
      const newHabitDoc = doc(collection(db, HABITS_COLL));
      batch.set(newHabitDoc, {
        title: habitTitle,
        category: h.category || 'General',
        targetPerWeek: targetDays,
        streak: 0,
        history: {},
        createdAt: now,
        notes: plan.week ? { info: `Imported with ${plan.week}` } : {}
      });
      itemsCount++;
    }
  }

  // Process Tasks
  if (Array.isArray(plan.tasks)) {
    for (const t of plan.tasks) {
      let priority: 'High' | 'Med' | 'Low' = 'Med';
      const rawPri = (t.priority || '').toLowerCase();
      const rawMatrix = (t.matrix || '').toLowerCase();

      if (rawPri.includes('high') || rawMatrix.includes('urgent-important') || rawMatrix.includes('urgent & important')) {
        priority = 'High';
      } else if (rawPri.includes('low') || rawMatrix.includes('backlog') || rawMatrix.includes('someday')) {
        priority = 'Low';
      }

      const category = t.category || (t.matrix ? `Matrix: ${t.matrix}` : 'Plan Import');
      const newTaskDoc = doc(collection(db, TASKS_COLL));
      batch.set(newTaskDoc, {
        title: t.title,
        completed: false,
        priority,
        category,
        dueDate: t.dueDate || new Date().toISOString().split('T')[0],
        createdAt: now
      });
      itemsCount++;
    }
  }

  // Process Goals
  if (Array.isArray(plan.goals)) {
    for (const g of plan.goals) {
      const newGoalDoc = doc(collection(db, GOALS_COLL));
      batch.set(newGoalDoc, {
        title: g.title,
        vision: g.vision || (plan.week ? `Established in ${plan.week}` : 'Focus milestone'),
        endpointTarget: g.endpointTarget || g.title,
        category: (g.category as any) || 'Career & Business',
        timeframe: 'Quarterly',
        status: 'In Progress',
        milestones: [
          {
            id: 'm1',
            title: `Execute initial sprint for: ${g.title}`,
            completed: false
          }
        ],
        createdAt: now
      });
      itemsCount++;
    }
  }

  // Process optional Planner slots
  if (Array.isArray(plan.planner)) {
    for (const pl of plan.planner) {
      const newPlannerDoc = doc(collection(db, PLANNER_COLL));
      batch.set(newPlannerDoc, {
        dayIndex: typeof pl.dayIndex === 'number' ? pl.dayIndex : 0,
        title: pl.title,
        timeSlot: pl.timeSlot || 'Morning',
        completed: false,
        type: pl.type || 'deep-work',
        createdAt: now
      });
      itemsCount++;
    }
  }

  // Commit all writes atomically in a single batch
  if (itemsCount > 0) {
    await batch.commit();
  }

  return {
    importedCount: itemsCount,
    habitsCount: plan.habits?.length || 0,
    tasksCount: plan.tasks?.length || 0,
    goalsCount: plan.goals?.length || 0,
  };
};

// ----------------- Focus Sessions -----------------

export const subscribeToFocusSessions = (
  callback: (sessions: FocusSession[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, FOCUS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: FocusSession[] = [];
      snapshot.forEach((d) => {
        sessions.push({ id: d.id, ...d.data() } as FocusSession);
      });
      callback(sessions);
    },
    (error) => handleSubscriptionError("focus sessions", error, onError)
  );
};

export const addFocusSession = async (session: Omit<FocusSession, 'id'>) => {
  return await addDoc(collection(db, FOCUS_COLL), sanitizeInsertData(session));
};

export const deleteFocusSession = async (id: string) => {
  const ref = doc(db, FOCUS_COLL, id);
  return await deleteDoc(ref);
};

export const updateFocusSession = async (id: string, updates: Partial<FocusSession>) => {
  const ref = doc(db, FOCUS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

// ----------------- Bulk Operations -----------------
export const bulkUpdateTasks = async (ids: string[], updates: Partial<TaskItem>) => {
  if (!ids || ids.length === 0) return;
  const cleanUpdates = sanitizeUpdateData(updates);
  const batch = writeBatch(db);
  for (const id of ids) {
    const ref = doc(db, TASKS_COLL, id);
    batch.update(ref, cleanUpdates);
  }
  return await batch.commit();
};

export const bulkDeleteTasks = async (ids: string[]) => {
  if (!ids || ids.length === 0) return;
  const batch = writeBatch(db);
  for (const id of ids) {
    const ref = doc(db, TASKS_COLL, id);
    batch.delete(ref);
  }
  return await batch.commit();
};

export const bulkUpdateHabits = async (ids: string[], updates: Partial<HabitItem>) => {
  if (!ids || ids.length === 0) return;
  const cleanUpdates = sanitizeUpdateData(updates);
  const batch = writeBatch(db);
  for (const id of ids) {
    const ref = doc(db, HABITS_COLL, id);
    batch.update(ref, cleanUpdates);
  }
  return await batch.commit();
};

export const bulkDeleteHabits = async (ids: string[]) => {
  if (!ids || ids.length === 0) return;
  const batch = writeBatch(db);
  for (const id of ids) {
    const ref = doc(db, HABITS_COLL, id);
    batch.update(ref, { archived: true });
  }
  return await batch.commit();
};

// ----------------- Comments System -----------------
export const subscribeToComments = (
  callback: (comments: AppComment[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, COMMENTS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const comments: AppComment[] = [];
      snapshot.forEach((d) => {
        comments.push({ id: d.id, ...d.data() } as AppComment);
      });
      callback(comments);
    },
    (error) => handleSubscriptionError("comments", error, onError)
  );
};

export const addComment = async (comment: Omit<AppComment, 'id'>) => {
  return await addDoc(collection(db, COMMENTS_COLL), sanitizeInsertData(comment));
};

export const updateComment = async (id: string, updates: Partial<AppComment>) => {
  const ref = doc(db, COMMENTS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteComment = async (id: string) => {
  const ref = doc(db, COMMENTS_COLL, id);
  return await deleteDoc(ref);
};

// ----------------- Workouts & Calisthenics Engine -----------------
export const subscribeToWorkouts = (
  callback: (workouts: WorkoutSession[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, WORKOUTS_COLL), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const workouts: WorkoutSession[] = [];
      snapshot.forEach((d) => {
        workouts.push({ id: d.id, ...d.data() } as WorkoutSession);
      });
      callback(workouts);
    },
    (error) => handleSubscriptionError("workouts", error, onError)
  );
};

export const addWorkout = async (workout: Omit<WorkoutSession, 'id'>) => {
  return await addDoc(collection(db, WORKOUTS_COLL), sanitizeInsertData(workout));
};

/**
 * Cross-collection Batch Write: Logs a workout session to `workouts` AND atomically
 * checks off the linked Habit (Gym Habit or Cardio Habit) in the `habits` collection
 * for the workout's date.
 */
export const addWorkoutWithHabitBatch = async (
  workout: Omit<WorkoutSession, 'id'>,
  linkedHabitId?: string | null,
  secondaryHabitId?: string | null
) => {
  const batch = writeBatch(db);

  // 1. Create new workout document ref
  const workoutRef = doc(collection(db, WORKOUTS_COLL));
  const sanitizedWorkout = sanitizeInsertData(workout);
  batch.set(workoutRef, sanitizedWorkout);

  // 2. If habit IDs are linked, update each habit's history map for this workout date
  const habitIdsToUpdate = [linkedHabitId, secondaryHabitId].filter(Boolean) as string[];

  for (const habitId of habitIdsToUpdate) {
    try {
      const habitRef = doc(db, HABITS_COLL, habitId);
      const habitSnap = await getDoc(habitRef);
      if (habitSnap.exists()) {
        const habitData = habitSnap.data() as HabitItem;
        const targetDate = workout.date || new Date().toISOString().split('T')[0];
        
        // Calculate updated streak
        const updatedHistory = { ...(habitData.history || {}), [targetDate]: true };
        let currentStreak = 0;
        let cursorDate = new Date();
        // Check backwards up to 365 days
        for (let i = 0; i < 365; i++) {
          const dStr = cursorDate.toISOString().split('T')[0];
          if (updatedHistory[dStr] || (habitData.freezes && habitData.freezes[dStr])) {
            currentStreak++;
            cursorDate.setDate(cursorDate.getDate() - 1);
          } else {
            break;
          }
        }

        batch.update(habitRef, {
          [`history.${targetDate}`]: true,
          streak: Math.max(currentStreak, habitData.streak || 0)
        });
      }
    } catch (e) {
      console.warn('Notice while updating linked habit in batch:', e);
    }
  }

  await batch.commit();
  return workoutRef.id;
};

export const updateWorkout = async (id: string, updates: Partial<WorkoutSession>) => {
  const ref = doc(db, WORKOUTS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteWorkout = async (id: string) => {
  const ref = doc(db, WORKOUTS_COLL, id);
  return await deleteDoc(ref);
};

// ----------------- Body Metrics & Weight Tracker -----------------

export const subscribeToBodyMetrics = (
  callback: (logs: BodyMetricLog[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, BODY_METRICS_COLL), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: BodyMetricLog[] = [];
      snapshot.forEach((d) => {
        logs.push({ id: d.id, ...d.data() } as BodyMetricLog);
      });
      callback(logs);
    },
    (error) => handleSubscriptionError("body_metrics", error, onError)
  );
};

export const addBodyMetricLog = async (log: Omit<BodyMetricLog, 'id'>) => {
  return await addDoc(collection(db, BODY_METRICS_COLL), sanitizeInsertData(log));
};

export const deleteBodyMetricLog = async (id: string) => {
  const ref = doc(db, BODY_METRICS_COLL, id);
  return await deleteDoc(ref);
};

export const subscribeToBodyProfile = (
  callback: (profile: BodyProfileConfig | null) => void,
  onError?: (err: any) => void
) => {
  const ref = doc(db, BODY_PROFILE_COLL, 'user_profile');
  return onSnapshot(
    ref,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as BodyProfileConfig);
      } else {
        callback(null);
      }
    },
    (error) => handleSubscriptionError("body_profile", error, onError)
  );
};

export const saveBodyProfile = async (profile: Partial<BodyProfileConfig>) => {
  const ref = doc(db, BODY_PROFILE_COLL, 'user_profile');
  return await setDoc(ref, sanitizeInsertData({ ...profile, updatedAt: Date.now() }), { merge: true });
};

// ----------------- Scheduled Workout Planner -----------------

export const subscribeToScheduledWorkouts = (
  callback: (items: ScheduledWorkoutItem[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, SCHEDULED_WORKOUTS_COLL), orderBy('date', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: ScheduledWorkoutItem[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as ScheduledWorkoutItem);
      });
      callback(items);
    },
    (error) => handleSubscriptionError("scheduled_workouts", error, onError)
  );
};

export const addScheduledWorkout = async (item: Omit<ScheduledWorkoutItem, 'id'>) => {
  return await addDoc(collection(db, SCHEDULED_WORKOUTS_COLL), sanitizeInsertData(item));
};

export const updateScheduledWorkout = async (id: string, updates: Partial<ScheduledWorkoutItem>) => {
  const ref = doc(db, SCHEDULED_WORKOUTS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteScheduledWorkout = async (id: string) => {
  const ref = doc(db, SCHEDULED_WORKOUTS_COLL, id);
  return await deleteDoc(ref);
};

export const toggleScheduledWorkoutWithHabit = async (
  scheduledItem: ScheduledWorkoutItem,
  linkedHabitId?: string | null
) => {
  const nextCompleted = !scheduledItem.completed;
  const batch = writeBatch(db);

  if (scheduledItem.id) {
    const itemRef = doc(db, SCHEDULED_WORKOUTS_COLL, scheduledItem.id);
    batch.update(itemRef, { completed: nextCompleted });
  }

  if (linkedHabitId) {
    try {
      const habitRef = doc(db, HABITS_COLL, linkedHabitId);
      const habitSnap = await getDoc(habitRef);
      if (habitSnap.exists()) {
        const habitData = habitSnap.data() as HabitItem;
        const targetDate = scheduledItem.date;
        const updatedHistory = { ...(habitData.history || {}), [targetDate]: nextCompleted };
        
        let currentStreak = 0;
        let cursorDate = new Date();
        for (let i = 0; i < 365; i++) {
          const dStr = cursorDate.toISOString().split('T')[0];
          if (updatedHistory[dStr] || (habitData.freezes && habitData.freezes[dStr])) {
            currentStreak++;
            cursorDate.setDate(cursorDate.getDate() - 1);
          } else {
            break;
          }
        }

        batch.update(habitRef, {
          [`history.${targetDate}`]: nextCompleted,
          streak: Math.max(0, currentStreak)
        });
      }
    } catch (e) {
      console.warn('Notice while updating linked habit in toggle:', e);
    }
  }

  await batch.commit();
};

// ----------------- Sunday Resets -----------------

export const subscribeToSundayResets = (
  callback: (resets: SundayReset[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, SUNDAY_RESETS_COLL), orderBy('completedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const resets: SundayReset[] = [];
      snapshot.forEach((d) => {
        resets.push({ id: d.id, ...d.data() } as SundayReset);
      });
      callback(resets);
    },
    (error) => handleSubscriptionError("sunday_resets", error, onError)
  );
};

export const addSundayReset = async (reset: Omit<SundayReset, 'id'>) => {
  return await addDoc(collection(db, SUNDAY_RESETS_COLL), sanitizeInsertData(reset));
};

// ----------------- Reviews & Periodic Audits -----------------

export const subscribeToReviews = (
  callback: (reviews: ReviewEntry[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, REVIEWS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const reviews: ReviewEntry[] = [];
      snapshot.forEach((d) => {
        reviews.push({ id: d.id, ...d.data() } as ReviewEntry);
      });
      callback(reviews);
    },
    (error) => handleSubscriptionError("reviews", error, onError)
  );
};

export const addReviewEntry = async (review: Omit<ReviewEntry, 'id'>) => {
  return await addDoc(collection(db, REVIEWS_COLL), sanitizeInsertData(review));
};

export const updateReviewEntry = async (id: string, updates: Partial<ReviewEntry>) => {
  const ref = doc(db, REVIEWS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteReviewEntry = async (id: string) => {
  const ref = doc(db, REVIEWS_COLL, id);
  return await deleteDoc(ref);
};

// ----------------- Daily Blocks -----------------
const DAILY_BLOCKS_COLL = 'daily_blocks';

export const subscribeToDailyBlocks = (
  callback: (blocks: DailyBlockItem[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, DAILY_BLOCKS_COLL), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const blocks: DailyBlockItem[] = [];
      snapshot.forEach((d) => {
        blocks.push({ id: d.id, ...d.data() } as DailyBlockItem);
      });
      callback(blocks);
    },
    (error) => handleSubscriptionError("daily_blocks", error, onError)
  );
};

export const addDailyBlock = async (block: Omit<DailyBlockItem, 'id'>) => {
  return await addDoc(collection(db, DAILY_BLOCKS_COLL), sanitizeInsertData(block));
};

export const updateDailyBlock = async (id: string, updates: Partial<DailyBlockItem>) => {
  const ref = doc(db, DAILY_BLOCKS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteDailyBlock = async (id: string) => {
  const ref = doc(db, DAILY_BLOCKS_COLL, id);
  return await deleteDoc(ref);
};

export const batchApplyDailyBlocks = async (blocks: Omit<DailyBlockItem, 'id'>[]) => {
  const batch = writeBatch(db);
  blocks.forEach((blk) => {
    const newRef = doc(collection(db, DAILY_BLOCKS_COLL));
    batch.set(newRef, sanitizeInsertData(blk));
  });
  return await batch.commit();
};

export const clearDailyBlocksForDate = async (dateStr: string, existingBlocks: DailyBlockItem[]) => {
  const blocksToDelete = existingBlocks.filter(b => b.date === dateStr && b.id);
  if (blocksToDelete.length === 0) return;
  const batch = writeBatch(db);
  blocksToDelete.forEach(b => {
    if (b.id) {
      const ref = doc(db, DAILY_BLOCKS_COLL, b.id);
      batch.delete(ref);
    }
  });
  return await batch.commit();
};

// ----------------- Module Lifecycle Audit -----------------
const MODULE_LIFECYCLE_COLL = 'module_lifecycle';

export const subscribeToModuleLifecycle = (
  callback: (events: ModuleLifecycleEvent[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, MODULE_LIFECYCLE_COLL), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const events: ModuleLifecycleEvent[] = [];
      snapshot.forEach((d) => {
        events.push({ id: d.id, ...d.data() } as ModuleLifecycleEvent);
      });
      callback(events);
    },
    (error) => handleSubscriptionError("module_lifecycle", error, onError)
  );
};

export const recordModuleLifecycleEvent = async (event: Omit<ModuleLifecycleEvent, 'id'>) => {
  return await addDoc(collection(db, MODULE_LIFECYCLE_COLL), sanitizeInsertData(event));
};

// ----------------- Weekly Priority Goals -----------------
const WEEKLY_GOALS_COLL = 'weekly_goals';

export const subscribeToWeeklyGoals = (
  callback: (goals: WeeklyPriorityGoal[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, WEEKLY_GOALS_COLL), orderBy('rank', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const goals: WeeklyPriorityGoal[] = [];
      snapshot.forEach((d) => {
        goals.push({ id: d.id, ...d.data() } as WeeklyPriorityGoal);
      });
      callback(goals);
    },
    (error) => handleSubscriptionError("weekly_goals", error, onError)
  );
};

export const addWeeklyGoal = async (goal: Omit<WeeklyPriorityGoal, 'id'>) => {
  return await addDoc(collection(db, WEEKLY_GOALS_COLL), sanitizeInsertData(goal));
};

export const updateWeeklyGoal = async (id: string, updates: Partial<WeeklyPriorityGoal>) => {
  const ref = doc(db, WEEKLY_GOALS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteWeeklyGoal = async (id: string) => {
  const ref = doc(db, WEEKLY_GOALS_COLL, id);
  return await deleteDoc(ref);
};

// ----------------- Sleep & Wake Tracking -----------------
export const subscribeToSleepLogs = (
  callback: (logs: DailySleepLog[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, SLEEP_LOGS_COLL), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: DailySleepLog[] = [];
      snapshot.forEach((d) => {
        logs.push({ id: d.id, ...d.data() } as DailySleepLog);
      });
      callback(logs);
    },
    (error) => handleSubscriptionError("sleep_logs", error, onError)
  );
};

export const logDailySleep = async (sleepData: Omit<DailySleepLog, 'id'>) => {
  // If a record for this date already exists, update it, else add it
  const snap = await getDocs(query(collection(db, SLEEP_LOGS_COLL), where('date', '==', sleepData.date)));
  if (!snap.empty) {
    const existingDoc = snap.docs[0];
    await updateDoc(existingDoc.ref, sanitizeUpdateData({ ...sleepData, updatedAt: Date.now() }));
    return existingDoc.id;
  }
  const res = await addDoc(collection(db, SLEEP_LOGS_COLL), sanitizeInsertData({ ...sleepData, createdAt: Date.now() }));
  return res.id;
};

export const updateDailySleep = async (id: string, updates: Partial<DailySleepLog>) => {
  const ref = doc(db, SLEEP_LOGS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData({ ...updates, updatedAt: Date.now() }));
};

export const deleteDailySleep = async (id: string) => {
  const ref = doc(db, SLEEP_LOGS_COLL, id);
  return await deleteDoc(ref);
};

export const subscribeToSleepConfig = (
  callback: (config: SleepScheduleConfig | null) => void,
  onError?: (err: any) => void
) => {
  const ref = doc(db, SLEEP_CONFIG_COLL, 'target_schedule');
  return onSnapshot(
    ref,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as SleepScheduleConfig);
      } else {
        callback(null);
      }
    },
    (error) => handleSubscriptionError("sleep_config", error, onError)
  );
};

export const saveSleepConfig = async (config: Partial<SleepScheduleConfig>) => {
  const ref = doc(db, SLEEP_CONFIG_COLL, 'target_schedule');
  return await setDoc(ref, sanitizeInsertData({ ...config, updatedAt: Date.now() }), { merge: true });
};

// ----------------- Access Control & Collaborator Whitelist -----------------
export const DEFAULT_OWNER_EMAIL = 'itsmezaki77@gmail.com';
export const DEFAULT_ALLOWED_EMAILS = ['itsmezaki77@gmail.com', 'zakaworkproo@gmail.com'];

export const subscribeToAccessControl = (
  callback: (data: AccessControlData) => void,
  onError?: (err: any) => void
) => {
  const ref = doc(db, ACCESS_CONTROL_COLL, 'whitelist');
  return onSnapshot(
    ref,
    (docSnap) => {
      if (docSnap.exists()) {
        const raw = docSnap.data() as Partial<AccessControlData>;
        const allowed = Array.isArray(raw.allowedEmails) ? raw.allowedEmails : [];
        const normalized = Array.from(new Set([
          DEFAULT_OWNER_EMAIL,
          ...allowed.map(e => (typeof e === 'string' ? e.toLowerCase().trim() : '')).filter(Boolean)
        ]));
        callback({
          ownerEmail: raw.ownerEmail || DEFAULT_OWNER_EMAIL,
          allowedEmails: normalized,
          updatedAt: raw.updatedAt || Date.now()
        });
      } else {
        const initialData: AccessControlData = {
          ownerEmail: DEFAULT_OWNER_EMAIL,
          allowedEmails: DEFAULT_ALLOWED_EMAILS,
          updatedAt: Date.now()
        };
        // Auto initialize doc on Firestore
        setDoc(ref, initialData, { merge: true }).catch(() => {});
        callback(initialData);
      }
    },
    (error) => handleSubscriptionError("access_control", error, onError)
  );
};

export const addCollaboratorEmail = async (email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return;
  const ref = doc(db, ACCESS_CONTROL_COLL, 'whitelist');
  const snap = await getDoc(ref);
  let currentList = [...DEFAULT_ALLOWED_EMAILS];
  if (snap.exists()) {
    const raw = snap.data() as Partial<AccessControlData>;
    if (Array.isArray(raw.allowedEmails)) {
      currentList = raw.allowedEmails.map(e => (e || '').toLowerCase().trim()).filter(Boolean);
    }
  }
  const merged = Array.from(new Set([...currentList, cleanEmail]));
  await setDoc(ref, {
    ownerEmail: DEFAULT_OWNER_EMAIL,
    allowedEmails: merged,
    updatedAt: Date.now()
  }, { merge: true });
};

export const removeCollaboratorEmail = async (email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === DEFAULT_OWNER_EMAIL.toLowerCase()) return;
  const ref = doc(db, ACCESS_CONTROL_COLL, 'whitelist');
  const snap = await getDoc(ref);
  let currentList = [...DEFAULT_ALLOWED_EMAILS];
  if (snap.exists()) {
    const raw = snap.data() as Partial<AccessControlData>;
    if (Array.isArray(raw.allowedEmails)) {
      currentList = raw.allowedEmails.map(e => (e || '').toLowerCase().trim()).filter(Boolean);
    }
  }
  const filtered = currentList.filter(e => e.toLowerCase() !== cleanEmail);
  if (!filtered.includes(DEFAULT_OWNER_EMAIL)) {
    filtered.unshift(DEFAULT_OWNER_EMAIL);
  }
  await setDoc(ref, {
    ownerEmail: DEFAULT_OWNER_EMAIL,
    allowedEmails: filtered,
    updatedAt: Date.now()
  }, { merge: true });
};

// ----------------- Cognitive Reflections (Breakthroughs & Blocks) -----------------
export const subscribeToReflections = (
  callback: (reflections: CognitiveReflection[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, REFLECTIONS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: CognitiveReflection[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as CognitiveReflection);
      });
      callback(items);
    },
    (error) => handleSubscriptionError("reflections", error, onError)
  );
};

export const addReflection = async (reflection: Omit<CognitiveReflection, 'id'>) => {
  return await addDoc(collection(db, REFLECTIONS_COLL), sanitizeInsertData(reflection));
};

export const updateReflection = async (id: string, updates: Partial<CognitiveReflection>) => {
  const ref = doc(db, REFLECTIONS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteReflection = async (id: string) => {
  const ref = doc(db, REFLECTIONS_COLL, id);
  return await deleteDoc(ref);
};

// ----------------- Visualization Stories -----------------
export const subscribeToVisions = (
  callback: (visions: VisualizationStory[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, VISIONS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: VisualizationStory[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as VisualizationStory);
      });
      callback(items);
    },
    (error) => handleSubscriptionError("visions", error, onError)
  );
};

export const addVision = async (vision: Omit<VisualizationStory, 'id'>) => {
  return await addDoc(collection(db, VISIONS_COLL), sanitizeInsertData(vision));
};

export const updateVision = async (id: string, updates: Partial<VisualizationStory>) => {
  const ref = doc(db, VISIONS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteVision = async (id: string) => {
  const ref = doc(db, VISIONS_COLL, id);
  return await deleteDoc(ref);
};

// ----------------- Affirmations Deck -----------------
export const subscribeToAffirmations = (
  callback: (affirmations: Affirmation[]) => void,
  onError?: (err: any) => void
) => {
  const q = query(collection(db, AFFIRMATIONS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Affirmation[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Affirmation);
      });
      callback(items);
    },
    (error) => handleSubscriptionError("affirmations", error, onError)
  );
};

export const addAffirmation = async (affirmation: Omit<Affirmation, 'id'>) => {
  return await addDoc(collection(db, AFFIRMATIONS_COLL), sanitizeInsertData(affirmation));
};

export const updateAffirmation = async (id: string, updates: Partial<Affirmation>) => {
  const ref = doc(db, AFFIRMATIONS_COLL, id);
  return await updateDoc(ref, sanitizeUpdateData(updates));
};

export const deleteAffirmation = async (id: string) => {
  const ref = doc(db, AFFIRMATIONS_COLL, id);
  return await deleteDoc(ref);
};



