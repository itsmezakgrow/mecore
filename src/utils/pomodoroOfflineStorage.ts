import { FocusSession } from '../types';
import { addFocusSession } from '../services/firestoreService';

export interface StoredTimerState {
  isActive: boolean;
  timerMode: 'focus' | 'short-break' | 'long-break';
  targetEndTime: number | null; // epoch timestamp ms
  pausedTimeRemaining: number; // seconds remaining when paused
  totalDurationSeconds: number; // total duration of this session in seconds
  activeTaskId?: string | null;
  activeTaskTitle?: string | null;
  selectedProjectId?: string | null;
  startedAt?: number;
}

const STORAGE_KEY_TIMER_STATE = 'pomodoro_timer_persistent_state_v2';
const STORAGE_KEY_SESSIONS_CACHE = 'pomodoro_focus_sessions_cache_v2';
const STORAGE_KEY_PENDING_QUEUE = 'pomodoro_pending_sync_sessions_v2';
const STORAGE_KEY_TELEMETRY = 'core_daily_focus_telemetry';

// ----------------------------------------------------
// 1. Timer State Persistence (Survives Refresh, Mobile Screen Lock, Offline)
// ----------------------------------------------------

export function getStoredTimerState(): StoredTimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIMER_STATE);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTimerState;
  } catch (err) {
    console.warn('Failed to parse stored pomodoro state:', err);
    return null;
  }
}

export function saveStoredTimerState(state: StoredTimerState): void {
  try {
    localStorage.setItem(STORAGE_KEY_TIMER_STATE, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save stored pomodoro state:', err);
  }
}

export function clearStoredTimerState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_TIMER_STATE);
  } catch (err) {
    console.warn('Failed to clear stored pomodoro state:', err);
  }
}

export function reconcileTimerRemaining(state: StoredTimerState): {
  isFinished: boolean;
  remainingSeconds: number;
} {
  if (!state.isActive || !state.targetEndTime) {
    return {
      isFinished: false,
      remainingSeconds: Math.max(0, state.pausedTimeRemaining),
    };
  }

  const now = Date.now();
  const diffMs = state.targetEndTime - now;
  const remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000));

  return {
    isFinished: remainingSeconds <= 0,
    remainingSeconds,
  };
}

// ----------------------------------------------------
// 2. Offline-First Focus Sessions Cache & Queue
// ----------------------------------------------------

export function getOfflineFocusSessions(): FocusSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS_CACHE);
    if (!raw) return [];
    return JSON.parse(raw) as FocusSession[];
  } catch (err) {
    console.warn('Failed to read offline focus sessions cache:', err);
    return [];
  }
}

export function setOfflineFocusSessionsCache(sessions: FocusSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS_CACHE, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save offline focus sessions cache:', err);
  }
}

export function getPendingSyncSessions(): FocusSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_QUEUE);
    if (!raw) return [];
    return JSON.parse(raw) as FocusSession[];
  } catch (err) {
    console.warn('Failed to read pending sync focus sessions:', err);
    return [];
  }
}

export function savePendingSyncSessions(queue: FocusSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PENDING_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to save pending sync focus sessions:', err);
  }
}

/**
 * Record a completed focus session offline-first.
 * 1. Generates local ID
 * 2. Saves directly into localStorage cache
 * 3. Updates daily telemetry
 * 4. Pushes into pending sync queue
 * 5. Tries immediate Firestore sync if online
 */
export async function recordCompletedFocusSessionOfflineFirst(sessionData: {
  title: string;
  duration: number; // minutes
  type?: 'focus' | 'short-break' | 'long-break';
  associatedType?: 'task' | 'project' | 'none';
  associatedId?: string;
  associatedTitle?: string;
  createdAt?: number;
}): Promise<FocusSession> {
  const timestamp = sessionData.createdAt || Date.now();
  const localId = `local_focus_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;

  const newSession: FocusSession = {
    id: localId,
    title: sessionData.title,
    duration: sessionData.duration,
    type: sessionData.type || 'focus',
    associatedType: sessionData.associatedType || 'none',
    associatedId: sessionData.associatedId,
    associatedTitle: sessionData.associatedTitle,
    createdAt: timestamp,
  };

  // 1. Update localStorage cache
  try {
    const cached = getOfflineFocusSessions();
    const updatedCache = [newSession, ...cached.filter((s) => s.id !== localId)];
    setOfflineFocusSessionsCache(updatedCache);
  } catch (err) {
    console.warn('Failed updating session cache:', err);
  }

  // 2. Update daily telemetry in localStorage
  try {
    const todayStr = new Date(timestamp).toISOString().split('T')[0];
    const rawTel = localStorage.getItem(STORAGE_KEY_TELEMETRY);
    const telemetry = rawTel ? JSON.parse(rawTel) : {};
    telemetry[todayStr] = (telemetry[todayStr] || 0) + sessionData.duration;
    localStorage.setItem(STORAGE_KEY_TELEMETRY, JSON.stringify(telemetry));
  } catch (err) {
    console.warn('Failed updating daily focus telemetry:', err);
  }

  // 3. Add to pending sync queue
  try {
    const queue = getPendingSyncSessions();
    queue.push(newSession);
    savePendingSyncSessions(queue);
  } catch (err) {
    console.warn('Failed queueing session for sync:', err);
  }

  // 4. Notify app components via CustomEvent
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('pomodoro_session_completed_locally', {
          detail: { session: newSession },
        })
      );
    } catch {}
  }

  // 5. If online, attempt background sync immediately (non-blocking)
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    syncPendingFocusSessions().catch((err) => {
      console.warn('Background sync will retry later:', err);
    });
  }

  return newSession;
}

/**
 * Flush and sync all pending focus sessions to Firestore.
 * Automatically called on connection recovery or session completion.
 */
let isSyncing = false;
export async function syncPendingFocusSessions(): Promise<number> {
  if (isSyncing) return 0;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  const queue = getPendingSyncSessions();
  if (queue.length === 0) return 0;

  isSyncing = true;
  let syncedCount = 0;
  const remainingQueue: FocusSession[] = [];

  for (const session of queue) {
    try {
      // Omit temporary client-side ID when uploading to Firestore
      const { id, ...sessionPayload } = session;
      const docRef = await addFocusSession(sessionPayload);

      // If successful, update the session ID in local cache
      if (docRef?.id) {
        const cached = getOfflineFocusSessions();
        const updatedCache = cached.map((s) =>
          s.id === session.id ? { ...s, id: docRef.id } : s
        );
        setOfflineFocusSessionsCache(updatedCache);
      }
      syncedCount++;
    } catch (err) {
      console.warn('Could not sync focus session to Firestore, keeping in queue:', err);
      remainingQueue.push(session);
    }
  }

  savePendingSyncSessions(remainingQueue);
  isSyncing = false;
  return syncedCount;
}

// ----------------------------------------------------
// 3. Online/Offline Auto-Sync Listener Initializer
// ----------------------------------------------------

export function initOfflineFocusSyncListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    syncPendingFocusSessions().then((count) => {
      if (count > 0) {
        console.info(`✓ Successfully synced ${count} offline focus sessions.`);
      }
    });
  };

  window.addEventListener('online', handleOnline);

  // Initial sync attempt if online on startup
  if (navigator.onLine) {
    syncPendingFocusSessions().catch(() => {});
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
