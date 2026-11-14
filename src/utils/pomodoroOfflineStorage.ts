import { FocusSession } from '../types';
import { addFocusSession, updateFocusSession, deleteFocusSession } from '../services/firestoreService';

export interface StoredTimerState {
  isActive: boolean;
  timerMode: 'focus' | 'short-break' | 'long-break';
  targetEndTime: number | null; // epoch timestamp ms
  pausedTimeRemaining: number; // seconds remaining when paused
  pausedRemainingMs?: number; // exact milliseconds remaining when paused (zero pause/resume drift)
  totalDurationSeconds: number; // total duration of this session in seconds
  activeTaskId?: string | null;
  activeTaskTitle?: string | null;
  selectedProjectId?: string | null;
  startedAt?: number;
}

export const DEFAULT_FOCUS_DURATION_MINUTES = 50;
export const DEFAULT_SHORT_BREAK_MINUTES = 5;
export const DEFAULT_LONG_BREAK_MINUTES = 15;

export const STORAGE_KEY_FOCUS_DUR = 'pomodoro_focus_dur';
export const STORAGE_KEY_SHORT_DUR = 'pomodoro_short_dur';
export const STORAGE_KEY_LONG_DUR = 'pomodoro_long_dur';
const STORAGE_KEY_V3_DEFAULT_MIGRATED = 'pomodoro_default_50_migrated_v1';
const STORAGE_KEY_QUEUED_NEXT_MODE = 'pomodoro_queued_next_mode_v1';
const STORAGE_KEY_LAST_COMPLETED_END = 'pomodoro_last_completed_target_end_v1';

const STORAGE_KEY_TIMER_STATE = 'pomodoro_timer_persistent_state_v2';
const STORAGE_KEY_SESSIONS_CACHE = 'pomodoro_focus_sessions_cache_v2';
const STORAGE_KEY_PENDING_QUEUE = 'pomodoro_pending_sync_sessions_v2';
const STORAGE_KEY_PENDING_UPDATES = 'pomodoro_pending_update_sessions_v2';
const STORAGE_KEY_PENDING_DELETES = 'pomodoro_pending_delete_sessions_v2';
const STORAGE_KEY_TELEMETRY = 'core_daily_focus_telemetry';

// ----------------------------------------------------
// 0. Default Duration Configuration & Migration (50m Default)
// ----------------------------------------------------

let defaultMigrationDone = false;
export function ensureDefaultPomodoroDurations(): void {
  if (defaultMigrationDone || typeof window === 'undefined') return;
  defaultMigrationDone = true;
  try {
    const migrated = localStorage.getItem(STORAGE_KEY_V3_DEFAULT_MIGRATED);
    if (!migrated) {
      const currentFocusDur = localStorage.getItem(STORAGE_KEY_FOCUS_DUR);
      if (!currentFocusDur || currentFocusDur === '25') {
        localStorage.setItem(STORAGE_KEY_FOCUS_DUR, String(DEFAULT_FOCUS_DURATION_MINUTES));
      }

      // If an idle, non-running timer state is sitting untouched at the legacy 25:00 default, update it to 50:00
      const rawTimer = localStorage.getItem(STORAGE_KEY_TIMER_STATE);
      if (rawTimer) {
        try {
          const parsed = JSON.parse(rawTimer) as StoredTimerState;
          if (
            parsed &&
            !parsed.isActive &&
            parsed.timerMode === 'focus' &&
            parsed.totalDurationSeconds === 25 * 60 &&
            parsed.pausedTimeRemaining === 25 * 60
          ) {
            const fiftySecs = DEFAULT_FOCUS_DURATION_MINUTES * 60;
            localStorage.setItem(
              STORAGE_KEY_TIMER_STATE,
              JSON.stringify({
                ...parsed,
                pausedTimeRemaining: fiftySecs,
                totalDurationSeconds: fiftySecs,
              })
            );
          }
        } catch {}
      }

      localStorage.setItem(STORAGE_KEY_V3_DEFAULT_MIGRATED, 'true');
    }
  } catch (err) {
    console.warn('Failed to migrate pomodoro default duration:', err);
  }
}

export function getConfiguredFocusDurationMinutes(): number {
  ensureDefaultPomodoroDurations();
  try {
    const val = localStorage.getItem(STORAGE_KEY_FOCUS_DUR);
    const parsed = val ? parseInt(val, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FOCUS_DURATION_MINUTES;
  } catch {
    return DEFAULT_FOCUS_DURATION_MINUTES;
  }
}

export function getConfiguredShortBreakMinutes(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY_SHORT_DUR);
    const parsed = val ? parseInt(val, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SHORT_BREAK_MINUTES;
  } catch {
    return DEFAULT_SHORT_BREAK_MINUTES;
  }
}

export function getConfiguredLongBreakMinutes(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY_LONG_DUR);
    const parsed = val ? parseInt(val, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LONG_BREAK_MINUTES;
  } catch {
    return DEFAULT_LONG_BREAK_MINUTES;
  }
}

export function getConfiguredDurationSeconds(mode: 'focus' | 'short-break' | 'long-break'): number {
  if (mode === 'short-break') return getConfiguredShortBreakMinutes() * 60;
  if (mode === 'long-break') return getConfiguredLongBreakMinutes() * 60;
  return getConfiguredFocusDurationMinutes() * 60;
}

export function getQueuedNextMode(): 'focus' | 'short-break' | 'long-break' | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY_QUEUED_NEXT_MODE);
    if (val === 'focus' || val === 'short-break' || val === 'long-break') return val;
    return null;
  } catch {
    return null;
  }
}

export function setQueuedNextMode(mode: 'focus' | 'short-break' | 'long-break' | null): void {
  try {
    if (mode) {
      localStorage.setItem(STORAGE_KEY_QUEUED_NEXT_MODE, mode);
    } else {
      localStorage.removeItem(STORAGE_KEY_QUEUED_NEXT_MODE);
    }
  } catch {}
}

export function claimTargetEndTimeCompletion(targetEndTime: number | null | undefined): boolean {
  if (!targetEndTime) return true;
  try {
    const prev = localStorage.getItem(STORAGE_KEY_LAST_COMPLETED_END);
    if (prev && Number(prev) === targetEndTime) {
      return false;
    }
    localStorage.setItem(STORAGE_KEY_LAST_COMPLETED_END, String(targetEndTime));
    return true;
  } catch {
    return true;
  }
}

// ----------------------------------------------------
// 1. Timer State Persistence (Survives Refresh, Mobile Screen Lock, Offline)
// ----------------------------------------------------

export function getStoredTimerState(): StoredTimerState | null {
  ensureDefaultPomodoroDurations();
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
  remainingMs: number;
} {
  if (!state.isActive || !state.targetEndTime) {
    const ms =
      state.pausedRemainingMs !== undefined
        ? Math.max(0, state.pausedRemainingMs)
        : Math.max(0, state.pausedTimeRemaining) * 1000;
    return {
      isFinished: false,
      remainingSeconds: Math.max(0, Math.ceil(ms / 1000)),
      remainingMs: ms,
    };
  }

  const now = Date.now();
  const diffMs = state.targetEndTime - now;
  const remainingMs = Math.max(0, diffMs);
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

  return {
    isFinished: remainingMs <= 0,
    remainingSeconds,
    remainingMs,
  };
}

const STORAGE_KEY_PAUSED_BY_MODE = 'pomodoro_paused_ms_by_mode_v1';

export function getSavedPausedMsForMode(mode: 'focus' | 'short-break' | 'long-break'): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAUSED_BY_MODE);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, number>;
    const val = map[mode];
    return typeof val === 'number' && val > 0 ? val : null;
  } catch {
    return null;
  }
}

export function savePausedMsForMode(mode: 'focus' | 'short-break' | 'long-break', ms: number | null): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAUSED_BY_MODE);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    if (ms === null || ms <= 0) {
      delete map[mode];
    } else {
      map[mode] = ms;
    }
    localStorage.setItem(STORAGE_KEY_PAUSED_BY_MODE, JSON.stringify(map));
  } catch {}
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

interface PendingFocusUpdate {
  id: string;
  updates: Partial<FocusSession>;
}

function getPendingFocusUpdates(): PendingFocusUpdate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_UPDATES);
    return raw ? (JSON.parse(raw) as PendingFocusUpdate[]) : [];
  } catch {
    return [];
  }
}

function savePendingFocusUpdates(list: PendingFocusUpdate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PENDING_UPDATES, JSON.stringify(list));
  } catch {}
}

export function getPendingFocusDeletes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_DELETES);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function savePendingFocusDeletes(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PENDING_DELETES, JSON.stringify(ids));
  } catch {}
}

/**
 * Record a completed or manual focus session offline-first.
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
 * Update a focus session offline-first (works for both local_focus_* and synced Firestore IDs).
 */
export async function updateFocusSessionOfflineFirst(
  id: string,
  updates: Partial<FocusSession>
): Promise<void> {
  // 1. Update cache
  try {
    const cached = getOfflineFocusSessions();
    setOfflineFocusSessionsCache(
      cached.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  } catch {}

  // 2. Notify UI immediately
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('pomodoro_session_updated_locally', {
          detail: { id, updates },
        })
      );
    } catch {}
  }

  // 3. If it's still a local unsynced session, update it inside the pending queue directly
  if (id.startsWith('local_focus_')) {
    const queue = getPendingSyncSessions();
    const updatedQueue = queue.map((s) => (s.id === id ? { ...s, ...updates } : s));
    savePendingSyncSessions(updatedQueue);
    return;
  }

  // 4. Sync with Firestore or queue update if offline/fails
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await updateFocusSession(id, updates);
      return;
    } catch (err) {
      console.warn('Offline/delayed update queued for focus session:', err);
    }
  }

  const pending = getPendingFocusUpdates().filter((item) => item.id !== id);
  pending.push({ id, updates });
  savePendingFocusUpdates(pending);
}

/**
 * Delete a focus session offline-first (works for both local_focus_* and synced Firestore IDs).
 */
export async function deleteFocusSessionOfflineFirst(id: string): Promise<void> {
  // 1. Remove from cache
  try {
    const cached = getOfflineFocusSessions();
    setOfflineFocusSessionsCache(cached.filter((s) => s.id !== id));
  } catch {}

  // 2. Notify UI immediately
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('pomodoro_session_deleted_locally', {
          detail: { id },
        })
      );
    } catch {}
  }

  // 3. Remove from pending add/update queues if present
  const queue = getPendingSyncSessions();
  if (queue.some((s) => s.id === id)) {
    savePendingSyncSessions(queue.filter((s) => s.id !== id));
  }
  const updates = getPendingFocusUpdates();
  if (updates.some((u) => u.id === id)) {
    savePendingFocusUpdates(updates.filter((u) => u.id !== id));
  }

  if (id.startsWith('local_focus_')) {
    return;
  }

  // 4. Delete from Firestore or queue delete for when back online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      await deleteFocusSession(id);
      return;
    } catch (err) {
      console.warn('Offline/delayed delete queued for focus session:', err);
    }
  }

  const pendingDeletes = getPendingFocusDeletes();
  if (!pendingDeletes.includes(id)) {
    pendingDeletes.push(id);
    savePendingFocusDeletes(pendingDeletes);
  }
}

/**
 * Flush and sync all pending focus sessions, updates, and deletes to Firestore.
 */
let isSyncing = false;
export async function syncPendingFocusSessions(): Promise<number> {
  if (isSyncing) return 0;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  isSyncing = true;
  let syncedCount = 0;

  try {
    // 1. Flush pending adds
    const queue = getPendingSyncSessions();
    if (queue.length > 0) {
      const remainingQueue: FocusSession[] = [];
      for (const session of queue) {
        try {
          const { id, ...sessionPayload } = session;
          const docRef = await addFocusSession(sessionPayload);

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
    }

    // 2. Flush pending updates
    const pendingUpdates = getPendingFocusUpdates();
    if (pendingUpdates.length > 0) {
      const remainingUpdates: PendingFocusUpdate[] = [];
      for (const item of pendingUpdates) {
        try {
          await updateFocusSession(item.id, item.updates);
          syncedCount++;
        } catch (err) {
          remainingUpdates.push(item);
        }
      }
      savePendingFocusUpdates(remainingUpdates);
    }

    // 3. Flush pending deletes
    const pendingDeletes = getPendingFocusDeletes();
    if (pendingDeletes.length > 0) {
      const remainingDeletes: string[] = [];
      for (const delId of pendingDeletes) {
        try {
          await deleteFocusSession(delId);
          syncedCount++;
        } catch (err) {
          remainingDeletes.push(delId);
        }
      }
      savePendingFocusDeletes(remainingDeletes);
    }
  } finally {
    isSyncing = false;
  }

  return syncedCount;
}

// ----------------------------------------------------
// 3. Online/Offline Auto-Sync Listener Initializer
// ----------------------------------------------------

export function initOfflineFocusSyncListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  ensureDefaultPomodoroDurations();

  const handleOnline = () => {
    syncPendingFocusSessions().then((count) => {
      if (count > 0) {
        console.info(`Successfully synced ${count} offline focus operations.`);
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
