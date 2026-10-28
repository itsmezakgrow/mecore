import React, { useState, useEffect } from 'react';
import { 
  Sidebar 
} from './components/Sidebar';
import { 
  DashboardOverview 
} from './components/DashboardOverview';
import { 
  HabitTracker 
} from './components/HabitTracker';
import { 
  TaskTracker 
} from './components/TaskTracker';
import {
  ChecklistsManager
} from './components/ChecklistsManager';
import { 
  WeeklyPlanner 
} from './components/WeeklyPlanner';
import { 
  ProjectsManager 
} from './components/ProjectsManager';
import { 
  NotesReminders 
} from './components/NotesReminders';
import {
  UserGuide
} from './components/UserGuide';
import {
  AnalyticsDashboard
} from './components/AnalyticsDashboard';
import {
  GoalsManager
} from './components/GoalsManager';
import {
  CommentsHub
} from './components/CommentsHub';
import {
  MobileQuickFab
} from './components/MobileQuickFab';
import { 
  SetupGuideModal 
} from './components/SetupGuideModal';
import {
  ExportImportModal
} from './components/ExportImportModal';
import {
  Atlas
} from './components/Atlas';
import {
  SettingsManager
} from './components/SettingsManager';
import {
  DeepFocusOverlay
} from './components/DeepFocusOverlay';
import {
  ArchiveHub,
  ArchiveItemType
} from './components/ArchiveHub';
import {
  FocusSelectModal
} from './components/FocusSelectModal';
import {
  TrainingEngine
} from './components/TrainingEngine';
import {
  SundayResetWizard
} from './components/SundayResetWizard';
import {
  DailyBlocksEngine
} from './components/DailyBlocksEngine';
import {
  startAmbientSound,
  stopAmbientSound,
  playCelebrationChime
} from './utils/focusAudio';
import { translations } from './utils/translations';
import {
  ToastContainer,
  ToastMessage
} from './components/Toast';
import { 
  ModuleType, 
  TaskItem, 
  HabitItem, 
  ProjectItem, 
  NoteItem, 
  WeeklyPlanSlot, 
  ChecklistGroup, 
  GoalItem, 
  FocusSession, 
  AppComment, 
  WorkoutSession, 
  SundayReset,
  RewardItem,
  TaskSkipReason,
  ReviewEntry,
  DailyBlockItem,
  ModuleLifecycleEvent,
  WeeklyPriorityGoal,
  DailySleepLog,
  SleepScheduleConfig,
  AccessControlData
} from './types';
import {
  subscribeToTasks,
  addTask,
  updateTask,
  deleteTask,
  subscribeToHabits,
  addHabit,
  updateHabit,
  toggleHabitDate,
  toggleHabitFreeze,
  deleteHabit,
  subscribeToProjects,
  addProject,
  updateProject,
  deleteProject,
  subscribeToPlanner,
  addPlannerSlot,
  updatePlannerSlot,
  deletePlannerSlot,
  batchApplyPlannerSlots,
  clearPlannerSlotsForDay,
  subscribeToNotes,
  addNote,
  updateNote,
  deleteNote,
  subscribeToChecklists,
  addChecklist,
  updateChecklist,
  deleteChecklist,
  subscribeToGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  clearAllDataFromFirestore,
  seedInitialDataIfEmpty,
  subscribeToFocusSessions,
  addFocusSession,
  subscribeToComments,
  addComment,
  updateComment,
  deleteComment,
  bulkUpdateTasks,
  bulkDeleteTasks,
  reorderTasks,
  bulkUpdateHabits,
  bulkDeleteHabits,
  reorderHabits,
  updateHabitDailyValue,
  subscribeToWorkouts,
  subscribeToSundayResets,
  addSundayReset,
  subscribeToReviews,
  addReviewEntry,
  deleteReviewEntry,
  subscribeToDailyBlocks,
  addDailyBlock,
  updateDailyBlock,
  deleteDailyBlock,
  batchApplyDailyBlocks,
  clearDailyBlocksForDate,
  subscribeToModuleLifecycle,
  subscribeToWeeklyGoals,
  addWeeklyGoal,
  updateWeeklyGoal,
  deleteWeeklyGoal,
  subscribeToSleepLogs,
  logDailySleep,
  updateDailySleep,
  deleteDailySleep,
  subscribeToSleepConfig,
  saveSleepConfig,
  subscribeToAccessControl,
  addCollaboratorEmail,
  removeCollaboratorEmail,
  DEFAULT_OWNER_EMAIL,
  DEFAULT_ALLOWED_EMAILS,
  isAbortError
} from './services/firestoreService';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { AuthGate } from './components/AuthGate';
import { ReflectionsJournal } from './components/ReflectionsJournal';
import { SleepWakeTracker } from './components/SleepWakeTracker';
import { ReviewJournalModal } from './components/ReviewJournalModal';
import { ReviewPromptBanner } from './components/ReviewPromptBanner';
import { FocusTracker } from './components/FocusTracker';
import { isSystemTrackingActive } from './utils/moduleLifecycle';
import firebaseConfig from '../firebase-applet-config.json';
import { RefreshCw, Wifi, WifiOff, Download, Monitor, Minimize2, Maximize2, Moon, Sun, Timer, MessageSquare, BarChart3, CheckSquare, Flame, CalendarDays, StickyNote, ChevronLeft, ChevronRight, RotateCcw, Archive, HelpCircle } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#', '') as ModuleType;
        if (hash) return hash;
      }
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return 'habits';
      }
    } catch {}
    return 'dashboard';
  });

  // Navigation History Stack & Mouse Hardware Side-Button State
  const [navHistory, setNavHistory] = useState<ModuleType[]>(() => [activeModule]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Dispatcher that updates activeModule and pushes to history stack
  const changeModule = (newModule: ModuleType, pushHistory: boolean = true) => {
    if (newModule === activeModule) return;
    setActiveModule(newModule);

    if (pushHistory) {
      try {
        window.history.pushState({ module: newModule }, '', '#' + newModule);
      } catch {}

      setNavHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newModule];
      });
      setHistoryIndex((prev) => prev + 1);
    }
  };

  const canGoBack = historyIndex > 0 || (typeof window !== 'undefined' && window.history.length > 1);
  const canGoForward = historyIndex < navHistory.length - 1;

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const target = navHistory[prevIdx];
      setHistoryIndex(prevIdx);
      setActiveModule(target);
      try { window.history.back(); } catch {}
    } else if (typeof window !== 'undefined') {
      try { window.history.back(); } catch {}
    }
  };

  const handleGoForward = () => {
    if (historyIndex < navHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      const target = navHistory[nextIdx];
      setHistoryIndex(nextIdx);
      setActiveModule(target);
      try { window.history.forward(); } catch {}
    } else if (typeof window !== 'undefined') {
      try { window.history.forward(); } catch {}
    }
  };

  // Sync with browser popstate (native back/forward and mouse side buttons)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.module) {
        setActiveModule(e.state.module);
      } else if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#', '') as ModuleType;
        if (hash) setActiveModule(hash);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Hardware Mouse Side Navigation Buttons (Button 3 = Back, Button 4 = Forward) & Keyboard Alt+Arrow
  useEffect(() => {
    const handleMouseAuxClick = (e: MouseEvent) => {
      if (e.button === 3) {
        e.preventDefault();
        e.stopPropagation();
        handleGoBack();
      } else if (e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
        handleGoForward();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoForward();
      }
    };

    window.addEventListener('auxclick', handleMouseAuxClick);
    window.addEventListener('mouseup', handleMouseAuxClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('auxclick', handleMouseAuxClick);
      window.removeEventListener('mouseup', handleMouseAuxClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [historyIndex, navHistory]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [compactLayout, setCompactLayout] = useState<boolean>(() => {
    try {
      return localStorage.getItem('compact_layout') === 'true';
    } catch {
      return false;
    }
  });
  const [appStartDate, setAppStartDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('app_start_date');
      if (saved) return saved;
      const now = new Date().toISOString();
      localStorage.setItem('app_start_date', now);
      return now;
    } catch {
      return new Date().toISOString();
    }
  });
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('app_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return false;
    } catch {
      return false;
    }
  });

  // Sync theme with html root class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('app_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('app_theme', 'light');
      } catch {}
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const [lang, setLang] = useState<'en' | 'ar'>(() => {
    try {
      return (localStorage.getItem('app_lang') as 'en' | 'ar') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_lang', lang);
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  // ----------------- Authentication & Access Control -----------------
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [accessControl, setAccessControl] = useState<AccessControlData>({
    ownerEmail: DEFAULT_OWNER_EMAIL,
    allowedEmails: DEFAULT_ALLOWED_EMAILS,
    updatedAt: Date.now()
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribeAccess = subscribeToAccessControl((data) => {
      setAccessControl(data);
    });
    return () => unsubscribeAccess();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      addToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح.' : 'Signed out successfully.', 'info');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleAddCollaborator = async (collaboratorEmail: string) => {
    await addCollaboratorEmail(collaboratorEmail);
    addToast(lang === 'ar' ? `تمت إضافة ${collaboratorEmail} إلى قائمة الشركاء.` : `Added ${collaboratorEmail} to collaborators list.`, 'success');
  };

  const handleRemoveCollaborator = async (collaboratorEmail: string) => {
    await removeCollaboratorEmail(collaboratorEmail);
    addToast(lang === 'ar' ? `تمت إزالة ${collaboratorEmail}.` : `Removed ${collaboratorEmail}.`, 'info');
  };

  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Firestore Real-Time State Collections
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [checklists, setChecklists] = useState<ChecklistGroup[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [plans, setPlans] = useState<WeeklyPlanSlot[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [comments, setComments] = useState<AppComment[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [sundayResets, setSundayResets] = useState<SundayReset[]>([]);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [dailyBlocks, setDailyBlocks] = useState<DailyBlockItem[]>([]);
  const [weeklyPriorityGoals, setWeeklyPriorityGoals] = useState<WeeklyPriorityGoal[]>([]);
  const [moduleLifecycleEvents, setModuleLifecycleEvents] = useState<ModuleLifecycleEvent[]>([]);
  const [sleepLogs, setSleepLogs] = useState<DailySleepLog[]>([]);
  const [sleepConfig, setSleepConfig] = useState<SleepScheduleConfig | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewModalTab, setReviewModalTab] = useState<'weekly' | 'monthly' | 'archive'>('weekly');

  const handleSaveSleepLog = async (logData: Omit<DailySleepLog, 'id'>) => {
    await logDailySleep(logData);
    addToast(
      lang === 'ar' ? '✓ تم تسجيل بيانات النوم والاستيقاظ بنجاح!' : '✓ Sleep & wake log recorded successfully!',
      'success'
    );
  };

  const handleSaveSleepConfig = async (cfg: Partial<SleepScheduleConfig>) => {
    await saveSleepConfig(cfg);
    addToast(
      lang === 'ar' ? '✓ تم تحديث جدول النوم المستهدف بنجاح!' : '✓ Target sleep schedule updated!',
      'success'
    );
  };

  const handleDeleteSleepLog = async (id: string) => {
    await deleteDailySleep(id);
    addToast(
      lang === 'ar' ? 'تم حذف سجل النوم' : 'Sleep log deleted',
      'info'
    );
  };

  const handleOpenReviewModal = (tab: 'weekly' | 'monthly' | 'archive' = 'weekly') => {
    setReviewModalTab(tab);
    setShowReviewModal(true);
  };

  const handleSaveReview = async (reviewData: Omit<ReviewEntry, 'id'>) => {
    await addReviewEntry(reviewData);
    addToast(
      lang === 'ar' ? '✓ تم حفظ التقرير والتحليل بنجاح في السجل!' : '✓ Review entry archived successfully!',
      'success'
    );
  };

  const handleDeleteReview = async (id: string) => {
    await deleteReviewEntry(id);
    addToast(
      lang === 'ar' ? 'تم حذف السجل' : 'Review entry deleted',
      'info'
    );
  };

  // Daily Blocks CRUD Handlers
  const handleAddDailyBlock = async (block: Omit<DailyBlockItem, 'id'>) => {
    return await addDailyBlock(block);
  };

  const handleUpdateDailyBlock = async (id: string, updates: Partial<DailyBlockItem>) => {
    return await updateDailyBlock(id, updates);
  };

  const handleDeleteDailyBlock = async (id: string) => {
    const blockToDelete = dailyBlocks.find((b) => b.id === id);
    if (blockToDelete) {
      setLastDeletedItem({
        id,
        type: 'dailyBlock',
        title: blockToDelete.title,
        data: blockToDelete,
        timestamp: Date.now(),
        restore: async () => {
          const { id: _, ...data } = blockToDelete;
          await addDailyBlock(data);
        },
      });
      addToast(
        lang === 'ar' ? `تم حذف الفترة "${blockToDelete.title}"` : `Deleted block "${blockToDelete.title}"`,
        'delete',
        {
          label: lang === 'ar' ? 'تراجع ↺' : 'Undo ↺',
          onClick: handleUndo,
        }
      );
    }
    return await deleteDailyBlock(id);
  };

  const handleBatchApplyDailyBlocks = async (blocks: Omit<DailyBlockItem, 'id'>[]) => {
    return await batchApplyDailyBlocks(blocks);
  };

  const handleClearDailyBlocksForDate = async (dateStr: string) => {
    return await clearDailyBlocksForDate(dateStr, dailyBlocks);
  };

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // System Master Tracking State
  const [systemTrackingActive, setSystemTrackingActive] = useState<boolean>(() => isSystemTrackingActive());

  useEffect(() => {
    const handleTrackingSync = () => {
      setSystemTrackingActive(isSystemTrackingActive());
    };
    window.addEventListener('core_system_tracking_changed', handleTrackingSync);
    return () => window.removeEventListener('core_system_tracking_changed', handleTrackingSync);
  }, []);

  // Milestone Gamification Rewards state
  const [rewards, setRewards] = useState<RewardItem[]>(() => {
    try {
      const saved = localStorage.getItem('app_milestone_rewards_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_milestone_rewards_v1', JSON.stringify(rewards));
    } catch {}
  }, [rewards]);

  // Time Blocker linking states
  const [preSelectedTaskId, setPreSelectedTaskId] = useState<string | null>(null);
  const [autoOpenPlannerAddModal, setAutoOpenPlannerAddModal] = useState<boolean>(false);

  // Undo System State
  interface LastDeletedItem {
    id: string;
    type: 'task' | 'habit' | 'project' | 'note' | 'checklist' | 'dailyBlock' | 'goal';
    title: string;
    data: any;
    timestamp: number;
    restore: () => Promise<void>;
  }
  const [lastDeletedItem, setLastDeletedItem] = useState<LastDeletedItem | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    message: string,
    type: ToastMessage['type'] = 'success',
    action?: { label: string; onClick: () => void }
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type, action }]);
    const duration = action ? 7000 : 3200;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const handleUndo = async () => {
    if (!lastDeletedItem) return;
    const itemToRestore = lastDeletedItem;
    setLastDeletedItem(null);
    try {
      await itemToRestore.restore();
      playCelebrationChime();
      addToast(
        lang === 'ar'
          ? `تم استرجاع "${itemToRestore.title}" بنجاح!`
          : `Restored "${itemToRestore.title}" successfully!`,
        'success'
      );
    } catch (err) {
      console.error('Failed to undo deletion:', err);
      addToast(
        lang === 'ar' ? 'فشل استرجاع العنصر المحذوف' : 'Failed to restore deleted item',
        'error'
      );
    }
  };

  // Keyboard shortcut: Cmd+Z or Ctrl+Z to undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const activeEl = document.activeElement;
        const tag = activeEl?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || (activeEl as HTMLElement)?.isContentEditable) {
          return;
        }
        if (lastDeletedItem) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastDeletedItem, lang]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleCompactLayout = () => {
    const next = !compactLayout;
    setCompactLayout(next);
    try {
      localStorage.setItem('compact_layout', String(next));
    } catch {}
    addToast(next ? 'Compact screen mode enabled' : 'Comfortable screen mode enabled', 'info');
  };

  // Pomodoro & Deep Focus System States (Unified and shared with FocusTracker)
  const [sharedTimeRemaining, setSharedTimeRemaining] = useState<number>(25 * 60);
  const [sharedIsActive, setSharedIsActive] = useState<boolean>(false);
  const [sharedTimerMode, setSharedTimerMode] = useState<'focus' | 'short-break' | 'long-break'>('focus');
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);
  const [focusQueueTaskIds, setFocusQueueTaskIds] = useState<string[]>([]);
  const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'habits' | 'tasks' | 'goals' | 'focus'>('overview');

  const handleFocusTask = (task: TaskItem) => {
    if (task.id) {
      setActiveFocusTaskId(task.id);
      setFocusQueueTaskIds((prev) => Array.from(new Set([task.id!, ...prev])));
    }
    setActiveModule('focus');
    addToast(
      lang === 'ar'
        ? `🎯 تم تثبيت "${task.title}" في مؤقت التركيز بومودورو`
        : `🎯 Set "${task.title}" as active task in Pomodoro Station`,
      'info'
    );
  };

  const handleBulkSendToPomodoro = (selectedTasks: TaskItem[]) => {
    const ids = selectedTasks.map((t) => t.id).filter(Boolean) as string[];
    if (ids.length > 0) {
      setFocusQueueTaskIds((prev) => Array.from(new Set([...prev, ...ids])));
      if (!activeFocusTaskId) {
        setActiveFocusTaskId(ids[0]);
      }
      setActiveModule('focus');
      addToast(
        lang === 'ar'
          ? `🍅 تم إرسال ${ids.length} مهام إلى قائمة تركيز بومودورو`
          : `🍅 Sent ${ids.length} tasks to Pomodoro focus queue`,
        'success'
      );
    }
  };

  const [pomodoroTime, setPomodoroTime] = useState<number>(25 * 60);
  const [pomodoroActive, setPomodoroActive] = useState<boolean>(false);
  const [pomodoroTarget, setPomodoroTarget] = useState<{ id?: string; type: 'task' | 'plan' | 'custom'; title: string } | null>(null);
  const [showFocusSelectModal, setShowFocusSelectModal] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [ambientAudio, setAmbientAudio] = useState<'none' | 'lofi' | 'white-noise'>('none');

  // Option to display the Pomodoro timer in the top header bar (configurable in Pomodoro/System Settings)
  const [showTopBarTimer, setShowTopBarTimer] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('pomodoro_show_top_bar_timer');
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleTopBarTimer = (show: boolean) => {
    setShowTopBarTimer(show);
    try {
      localStorage.setItem('pomodoro_show_top_bar_timer', String(show));
      window.dispatchEvent(new Event('pomodoro_top_timer_changed'));
    } catch {}
  };

  useEffect(() => {
    const handleSyncTimerVisibility = () => {
      try {
        const val = localStorage.getItem('pomodoro_show_top_bar_timer');
        if (val !== null) {
          setShowTopBarTimer(val === 'true');
        }
      } catch {}
    };
    window.addEventListener('storage', handleSyncTimerVisibility);
    window.addEventListener('pomodoro_top_timer_changed', handleSyncTimerVisibility);
    return () => {
      window.removeEventListener('storage', handleSyncTimerVisibility);
      window.removeEventListener('pomodoro_top_timer_changed', handleSyncTimerVisibility);
    };
  }, []);

  // Background countdown for the shared Focus Station timer (only when NOT on focus page)
  useEffect(() => {
    if (activeModule === 'focus') {
      // FocusTracker is mounted and will handle its own timer loop + logging!
      return;
    }

    let interval: any = null;
    if (sharedIsActive && sharedTimeRemaining > 0) {
      interval = setInterval(() => {
        setSharedTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (sharedIsActive && sharedTimeRemaining === 0) {
      setSharedIsActive(false);
      try {
        playCelebrationChime();
      } catch (e) {}

      // Auto-save a general session when completing in the background
      const logBackgroundSession = async () => {
        try {
          await addFocusSession({
            title: lang === 'ar' ? 'جلسة تركيز عامة' : 'General Focus Sprint',
            duration: 25, // default focus duration
            type: 'focus',
            associatedType: 'none',
            createdAt: Date.now(),
          });
        } catch (e) {
          console.warn('Failed to log background focus session:', e);
        }
      };
      logBackgroundSession();

      addToast(
        lang === 'ar'
          ? '✓ رائع! اكتملت فترة التركيز بنجاح (٢٥ دقيقة تم تسجيلها).'
          : '✓ Focus period completed successfully (25 mins logged).',
        'success'
      );
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sharedIsActive, sharedTimeRemaining, activeModule, lang]);

  // Legacy countdown loop
  useEffect(() => {
    let interval: any = null;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroActive && pomodoroTime === 0) {
      setPomodoroActive(false);
      handlePomodoroCompleted();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroActive, pomodoroTime]);

  const handlePomodoroCompleted = async () => {
    playCelebrationChime();

    if (pomodoroTarget?.type === 'task' && pomodoroTarget.id) {
      const targetTask = tasks.find((t) => t.id === pomodoroTarget.id);
      if (targetTask) {
        const currentFocused = targetTask.focusedMinutes || 0;
        await handleUpdateTask(targetTask.id!, { focusedMinutes: currentFocused + 25 });
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const savedTelemetry = localStorage.getItem('core_daily_focus_telemetry');
      const telemetry = savedTelemetry ? JSON.parse(savedTelemetry) : {};
      telemetry[todayStr] = (telemetry[todayStr] || 0) + 25;
      localStorage.setItem('core_daily_focus_telemetry', JSON.stringify(telemetry));
    } catch (e) {
      console.warn('Failed to save focus telemetry:', e);
    }

    addToast(
      lang === 'ar'
        ? '✓ رائع! اكتملت فترة التركيز بنجاح (٢٥ دقيقة تم تسجيلها).'
        : '✓ Spectacular! Focus sprint accomplished (25 mins logged).',
      'success'
    );

    setIsFocusMode(false);
    setAmbientAudio('none');
    stopAmbientSound();
    setPomodoroTime(25 * 60);
    setPomodoroTarget(null);
  };

  const handleStartFocus = (target: { id?: string; type: 'task' | 'plan' | 'custom'; title: string }) => {
    setPomodoroTarget(target);
    setPomodoroTime(25 * 60);
    setPomodoroActive(true);
    setIsFocusMode(true);
    setSidebarCollapsed(true);
    setShowFocusSelectModal(false);
    addToast(
      lang === 'ar' ? 'بدء جلسة العمل العميق!' : 'Deep work session activated!',
      'info'
    );
  };

  const handlePauseFocus = () => {
    setPomodoroActive(false);
    addToast(
      lang === 'ar' ? 'تم تعليق المؤقت' : 'Timer paused',
      'info'
    );
  };

  const handleResumeFocus = () => {
    setPomodoroActive(true);
    addToast(
      lang === 'ar' ? 'استئناف التركيز' : 'Focus resumed',
      'info'
    );
  };

  const handleStopFocus = () => {
    setPomodoroActive(false);
    setIsFocusMode(false);
    setAmbientAudio('none');
    stopAmbientSound();
    setPomodoroTime(25 * 60);
    setPomodoroTarget(null);
    addToast(
      lang === 'ar' ? 'تم إنهاء الجلسة وإعادة الضبط' : 'Session terminated and timer reset',
      'info'
    );
  };

  const handleToggleAmbientAudio = (type: 'none' | 'lofi' | 'white-noise') => {
    setAmbientAudio(type);
    if (type === 'none') {
      stopAmbientSound();
    } else {
      startAmbientSound(type);
    }
  };

  // Real-time Subscriptions setup
  useEffect(() => {
    // Scroll window and root containers up to the top whenever activeModule changes
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [activeModule]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Back online — changes synced with Cloud Firestore', 'info');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('Working offline — changes cached locally', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let loadedCount = 0;
    const checkInitialLoad = () => {
      loadedCount++;
      if (loadedCount >= 8) {
        setIsLoading(false);
      }
    };

    // Subscriptions
    const unsubTasks = subscribeToTasks(
      (data) => {
        setTasks(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubHabits = subscribeToHabits(
      (data) => {
        setHabits(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubProjects = subscribeToProjects(
      (data) => {
        setProjects(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubChecklists = subscribeToChecklists(
      (data) => {
        setChecklists(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubPlans = subscribeToPlanner(
      (data) => {
        setPlans(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubNotes = subscribeToNotes(
      (data) => {
        setNotes(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubGoals = subscribeToGoals(
      (data) => {
        setGoals(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubFocusSessions = subscribeToFocusSessions(
      (data) => {
        setFocusSessions(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubComments = subscribeToComments(
      (data) => {
        setComments(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubWorkouts = subscribeToWorkouts(
      (data) => {
        setWorkouts(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubReviews = subscribeToReviews(
      (data) => {
        setReviews(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubSundayResets = subscribeToSundayResets(
      (data) => {
        setSundayResets(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubDailyBlocks = subscribeToDailyBlocks(
      (data) => {
        setDailyBlocks(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubModuleLifecycle = subscribeToModuleLifecycle(
      (data) => {
        setModuleLifecycleEvents(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubWeeklyGoals = subscribeToWeeklyGoals(
      (data) => {
        setWeeklyPriorityGoals(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubSleepLogs = subscribeToSleepLogs(
      (data) => {
        setSleepLogs(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    const unsubSleepConfig = subscribeToSleepConfig(
      (data) => {
        setSleepConfig(data);
        checkInitialLoad();
      },
      () => checkInitialLoad()
    );

    // Timeout safety fallback so UI loads quickly
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => {
      clearTimeout(timer);
      const unsubs = [
        unsubTasks, unsubHabits, unsubProjects, unsubChecklists,
        unsubPlans, unsubNotes, unsubGoals, unsubFocusSessions,
        unsubComments, unsubWorkouts, unsubReviews, unsubSundayResets,
        unsubDailyBlocks, unsubModuleLifecycle, unsubWeeklyGoals,
        unsubSleepLogs, unsubSleepConfig
      ];
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch (e: any) {
          if (!isAbortError(e)) {
            console.warn('Subscription unsubscribe error:', e);
          }
        }
      });
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  // Bulk Operations for Tasks and Habits
  const handleBulkUpdateTasks = async (taskIds: string[], updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id && taskIds.includes(t.id) ? { ...t, ...updates } : t))
    );
    try {
      await bulkUpdateTasks(taskIds, updates);
      addToast(
        lang === 'ar' ? `تم تحديث ${taskIds.length} مهام بنجاح` : `Updated ${taskIds.length} tasks`,
        'success'
      );
    } catch (err) {
      console.error('Failed to bulk update tasks:', err);
    }
  };

  const handleBulkDeleteTasks = async (taskIds: string[]) => {
    setTasks((prev) => prev.filter((t) => !t.id || !taskIds.includes(t.id)));
    try {
      await bulkDeleteTasks(taskIds);
      addToast(
        lang === 'ar' ? `تم حذف ${taskIds.length} مهام` : `Deleted ${taskIds.length} tasks`,
        'delete'
      );
    } catch (err) {
      console.error('Failed to bulk delete tasks:', err);
    }
  };

  const handleBulkUpdateHabits = async (habitIds: string[], updates: Partial<HabitItem>) => {
    setHabits((prev) =>
      prev.map((h) => (h.id && habitIds.includes(h.id) ? { ...h, ...updates } : h))
    );
    try {
      await bulkUpdateHabits(habitIds, updates);
      addToast(
        lang === 'ar' ? `تم تحديث ${habitIds.length} عادات بنجاح` : `Updated ${habitIds.length} habits`,
        'success'
      );
    } catch (err) {
      console.error('Failed to bulk update habits:', err);
    }
  };

  const handleBulkDeleteHabits = async (habitIds: string[]) => {
    setHabits((prev) => prev.filter((h) => !h.id || !habitIds.includes(h.id)));
    try {
      await bulkDeleteHabits(habitIds);
      addToast(
        lang === 'ar' ? `تم حذف ${habitIds.length} عادات` : `Deleted ${habitIds.length} habits`,
        'delete'
      );
    } catch (err) {
      console.error('Failed to bulk delete habits:', err);
    }
  };

  // Comment System CRUD
  const handleAddComment = async (comment: Omit<AppComment, 'id'>) => {
    const tempId = `temp-c-${Date.now()}`;
    const optimisticComment: AppComment = { ...comment, id: tempId, createdAt: Date.now() };
    setComments((prev) => [optimisticComment, ...prev]);
    try {
      const created = await addComment(comment);
      addToast(lang === 'ar' ? 'تم حفظ التعليق' : 'Comment saved', 'success');
      return created;
    } catch (err) {
      console.error('Failed to add comment:', err);
      addToast(lang === 'ar' ? 'فشل حفظ التعليق' : 'Failed to save comment', 'error');
    }
  };

  const handleUpdateComment = async (id: string, updates: Partial<AppComment>) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    try {
      await updateComment(id, updates);
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleDeleteComment = async (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteComment(id);
      addToast(lang === 'ar' ? 'تم حذف التعليق' : 'Comment deleted', 'delete');
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Task CRUD
  const handleAddTask = async (task: Omit<TaskItem, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: TaskItem = { ...task, id: tempId };
    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const created = await addTask(task);
      addToast(
        lang === 'ar'
          ? `تم إنشاء المهمة "${task.title}"`
          : `Task "${task.title}" created`,
        'success'
      );
      return created;
    } catch (err) {
      console.error('Failed to add task:', err);
      addToast(
        lang === 'ar'
          ? 'فشل حفظ المهمة في السحابة الإلكترونية'
          : 'Failed to save task to cloud',
        'error'
      );
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    try {
      await updateTask(id, updates);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));

    if (taskToDelete) {
      setLastDeletedItem({
        id,
        type: 'task',
        title: taskToDelete.title,
        data: taskToDelete,
        timestamp: Date.now(),
        restore: async () => {
          const { id: _, ...data } = taskToDelete;
          await addTask(data);
        },
      });
    }

    addToast(
      lang === 'ar'
        ? `تم حذف المهمة "${taskToDelete?.title || ''}"`
        : `Task "${taskToDelete?.title || ''}" deleted`,
      'delete',
      taskToDelete
        ? {
            label: lang === 'ar' ? 'تراجع ↺' : 'Undo ↺',
            onClick: handleUndo,
          }
        : undefined
    );

    try {
      await deleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
      addToast(
        lang === 'ar'
          ? 'خطأ في حذف المهمة من السحابة الإلكترونية'
          : 'Error deleting task from cloud',
        'error'
      );
    }
  };

  // Habit CRUD
  const handleAddHabit = async (habit: Omit<HabitItem, 'id'>) => {
    const tempId = `temp-h-${Date.now()}`;
    const optimisticHabit: HabitItem = { ...habit, id: tempId };
    setHabits((prev) => [optimisticHabit, ...prev]);

    try {
      const created = await addHabit(habit);
      addToast(
        lang === 'ar'
          ? `تم إنشاء العادة "${habit.title}" بنجاح`
          : `Habit "${habit.title}" created`,
        'success'
      );
      return created;
    } catch (err) {
      console.error('Failed to add habit:', err);
      addToast(
        lang === 'ar'
          ? 'فشل حفظ العادة في السحابة الإلكترونية'
          : 'Failed to save habit to cloud',
        'error'
      );
    }
  };

  const handleUpdateHabit = async (id: string, updates: Partial<HabitItem>) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
    try {
      await updateHabit(id, updates);
    } catch (err) {
      console.error('Failed to update habit:', err);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    const habitToDelete = habits.find((h) => h.id === id);
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, archived: true } : h))
    );

    if (habitToDelete) {
      setLastDeletedItem({
        id,
        type: 'habit',
        title: habitToDelete.title,
        data: habitToDelete,
        timestamp: Date.now(),
        restore: async () => {
          await updateHabit(id, { archived: false });
        },
      });
    }

    addToast(
      lang === 'ar'
        ? `تم أرشفة العادة "${habitToDelete?.title || ''}"`
        : `Habit "${habitToDelete?.title || ''}" archived`,
      'delete',
      habitToDelete
        ? {
            label: lang === 'ar' ? 'تراجع ↺' : 'Undo ↺',
            onClick: handleUndo,
          }
        : undefined
    );

    try {
      await deleteHabit(id);
    } catch (err) {
      console.error('Failed to archive habit:', err);
      addToast(
        lang === 'ar' ? 'حدث خطأ في أرشفة العادة' : 'Error archiving habit',
        'error'
      );
    }
  };

  // Habit Streak Freeze with Excuse
  const handleApplyFreezeExcuse = async (habit: HabitItem, dateKey: string, excuse: string) => {
    if (!habit.id) return;
    const currentFreezes = habit.freezes || {};
    const currentExcuses = habit.freezeExcuses || {};
    const updatedFreezes = { ...currentFreezes, [dateKey]: true };
    const updatedExcuses = { ...currentExcuses, [dateKey]: excuse };

    await handleUpdateHabit(habit.id, {
      freezes: updatedFreezes,
      freezeExcuses: updatedExcuses,
    });

    addToast(
      lang === 'ar'
        ? `تم تجميد سلسلة "${habit.title}" وحمايتها بنجاح`
        : `Streak for "${habit.title}" frozen and protected`,
      'info'
    );
  };

  const handleRemoveFreeze = async (habit: HabitItem, dateKey: string) => {
    if (!habit.id) return;
    const currentFreezes = { ...(habit.freezes || {}) };
    const currentExcuses = { ...(habit.freezeExcuses || {}) };
    delete currentFreezes[dateKey];
    delete currentExcuses[dateKey];

    await handleUpdateHabit(habit.id, {
      freezes: currentFreezes,
      freezeExcuses: currentExcuses,
    });

    addToast(
      lang === 'ar' ? 'تم إلغاء التجميد' : 'Streak freeze removed',
      'info'
    );
  };

  // Batch complete habits (e.g. 1-tap Routine completion)
  const handleBatchCompleteHabits = async (habitIds: string[], dateKey: string) => {
    for (const id of habitIds) {
      const habit = habits.find((h) => h.id === id);
      if (habit) {
        await toggleHabitDate(habit, dateKey);
      }
    }
  };

  // Task Skip / Rollover with reason
  const handleApplyTaskSkip = async (taskId: string, skipReason: TaskSkipReason, newDueDate: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentSkipReasons = task.skipReasons || [];
    const updatedSkipReasons = [...currentSkipReasons, skipReason];
    const newRolloverCount = (task.rolloverCount || 0) + 1;

    await handleUpdateTask(taskId, {
      dueDate: newDueDate,
      rolloverCount: newRolloverCount,
      skipReasons: updatedSkipReasons,
    });

    addToast(
      lang === 'ar'
        ? `تم ترحيل المهمة إلى ${newDueDate} مع حفظ السبب`
        : `Task postponed to ${newDueDate} with reason logged`,
      'info'
    );
  };



  // Milestone Rewards Handlers
  const handleAddReward = async (reward: Omit<RewardItem, 'id'>) => {
    const newId = `rew-${Date.now()}`;
    const newReward: RewardItem = { ...reward, id: newId, isClaimed: false, createdAt: Date.now() };
    setRewards((prev) => [newReward, ...prev]);
    addToast(
      lang === 'ar'
        ? `تم إضافة المكافأة: "${reward.title}"`
        : `Reward added: "${reward.title}"`,
      'success'
    );
  };

  const handleUpdateReward = async (rewardId: string, updates: Partial<RewardItem>) => {
    setRewards((prev) =>
      prev.map((r) => (r.id === rewardId ? { ...r, ...updates } : r))
    );
    addToast(
      lang === 'ar' ? 'تم تحديث المكافأة' : 'Milestone reward updated',
      'success'
    );
  };

  const handleClaimReward = async (rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) => (r.id === rewardId ? { ...r, isClaimed: true, claimedAt: Date.now() } : r))
    );
    const claimed = rewards.find((r) => r.id === rewardId);
    playCelebrationChime();
    addToast(
      lang === 'ar'
        ? `🎉 مبارك! تم استلام مكافأة "${claimed?.title || ''}"`
        : `🎉 Congratulations! Claimed reward: "${claimed?.title || ''}"`,
      'success'
    );
  };

  const handleDeleteReward = async (rewardId: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== rewardId));
    addToast(
      lang === 'ar' ? 'تم حذف المكافأة' : 'Reward removed',
      'delete'
    );
  };

  const handleResetRewards = () => {
    const defaultRewards: RewardItem[] = [
      {
        id: 'rew-1',
        title: 'Specialty Coffee & Pastry Treat',
        description: 'Treat yourself to your favorite cafe after a solid 7-day habit streak.',
        icon: '☕',
        category: 'Personal Treat',
        milestoneType: 'streak',
        targetCount: 7,
        isClaimed: false,
        createdAt: Date.now(),
      },
      {
        id: 'rew-2',
        title: 'New Workout Gear & Apparel',
        description: 'Upgrade your training clothes or equipment for hitting a 30-day streak.',
        icon: '🏋️',
        category: 'Shopping',
        milestoneType: 'streak',
        targetCount: 30,
        isClaimed: false,
        createdAt: Date.now(),
      },
      {
        id: 'rew-3',
        title: 'Weekend Cinema & Movie Night',
        description: 'Relax and catch the latest movie after completing 25 productive tasks.',
        icon: '🎬',
        category: 'Entertainment',
        milestoneType: 'task_count',
        targetCount: 25,
        isClaimed: false,
        createdAt: Date.now(),
      }
    ];
    setRewards(defaultRewards);
    addToast(
      lang === 'ar' ? 'تمت استعادة المكافآت الافتراضية' : 'Default rewards restored',
      'info'
    );
  };

  const handleClearAllRewards = () => {
    setRewards([]);
    addToast(
      lang === 'ar' ? 'تم مسح كافة المكافآت' : 'All rewards cleared',
      'info'
    );
  };

  const handleClearPresetSamples = () => {
    setRewards([]);
    addToast(
      lang === 'ar' ? 'تم مسح النماذج والبيانات التوضيحية' : 'Demo presets purged',
      'info'
    );
  };

  const handleFullWorkspaceReset = () => {
    const freshStart = new Date().toISOString();
    const today = freshStart.split('T')[0];
    try {
      localStorage.setItem('app_clean_start_date', today);
      localStorage.setItem('app_clean_start_timestamp', Date.now().toString());
      localStorage.setItem('app_start_date', freshStart);
      localStorage.removeItem('app_life_phases_v1');
      localStorage.removeItem('app_active_phase_id');
      localStorage.setItem('app_milestone_rewards_v1', JSON.stringify([]));
      localStorage.removeItem('core_daily_focus_telemetry');
      localStorage.removeItem('core_atlas_chat_history');
      localStorage.removeItem('planner_monthly_themes_v1');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('planner_theme_') || key.startsWith('pomodoro_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    setAppStartDate(freshStart);
    setHabits([]);
    setTasks([]);
    setProjects([]);
    setChecklists([]);
    setNotes([]);
    setPlans([]);
    setGoals([]);
    setComments([]);
    setFocusSessions([]);
    setWorkouts([]);
    setSundayResets([]);
    setReviews([]);
    setDailyBlocks([]);
    setSleepLogs([]);
    setRewards([]);
    addToast(
      lang === 'ar'
        ? 'تم مسح وتفريغ مساحة العمل كلياً، التطبيق الآن صفحة بيضاء نظيفة تماماً للبدء من جديد!'
        : 'Workspace completely cleared and reset to a clean blank canvas!',
      'success'
    );
  };

  // Project CRUD
  const handleAddProject = async (project: Omit<ProjectItem, 'id'>) => {
    const tempId = `temp-p-${Date.now()}`;
    setProjects((prev) => [{ ...project, id: tempId }, ...prev]);

    try {
      const created = await addProject(project);
      addToast(
        lang === 'ar'
          ? `تم إنشاء المشروع "${project.title}"`
          : `Project "${project.title}" created`,
        'success'
      );
      return created;
    } catch (err) {
      console.error('Failed to add project:', err);
      addToast(
        lang === 'ar' ? 'فشل في حفظ المشروع' : 'Failed to save project',
        'error'
      );
    }
  };

  const handleUpdateProject = async (id: string, updates: Partial<ProjectItem>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    try {
      await updateProject(id, updates);
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const projectToDelete = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));

    if (projectToDelete) {
      setLastDeletedItem({
        id,
        type: 'project',
        title: projectToDelete.title,
        data: projectToDelete,
        timestamp: Date.now(),
        restore: async () => {
          const { id: _, ...data } = projectToDelete;
          await addProject(data);
        },
      });
    }

    addToast(
      lang === 'ar'
        ? `تم حذف المشروع "${projectToDelete?.title || ''}"`
        : `Project "${projectToDelete?.title || ''}" deleted`,
      'delete',
      projectToDelete
        ? {
            label: lang === 'ar' ? 'تراجع ↺' : 'Undo ↺',
            onClick: handleUndo,
          }
        : undefined
    );

    try {
      await deleteProject(id);
    } catch (err) {
      console.error('Failed to delete project:', err);
      addToast(
        lang === 'ar' ? 'خطأ في حذف المشروع' : 'Error deleting project',
        'error'
      );
    }
  };

  // Checklist CRUD
  const handleAddChecklist = async (checklist: Omit<ChecklistGroup, 'id'>) => {
    const tempId = `temp-chk-${Date.now()}`;
    setChecklists((prev) => [{ ...checklist, id: tempId }, ...prev]);

    try {
      const created = await addChecklist(checklist);
      addToast(
        lang === 'ar'
          ? `تم إنشاء قائمة التحقق "${checklist.title}"`
          : `Checklist "${checklist.title}" created`,
        'success'
      );
      return created;
    } catch (err) {
      console.error('Failed to add checklist:', err);
      addToast(
        lang === 'ar' ? 'فشل حفظ قائمة التحقق' : 'Failed to save checklist',
        'error'
      );
    }
  };

  const handleUpdateChecklist = async (id: string, updates: Partial<ChecklistGroup>) => {
    setChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    try {
      await updateChecklist(id, updates);
    } catch (err) {
      console.error('Failed to update checklist:', err);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    const chkToDelete = checklists.find((c) => c.id === id);
    setChecklists((prev) => prev.filter((c) => c.id !== id));

    if (chkToDelete) {
      setLastDeletedItem({
        id,
        type: 'checklist',
        title: chkToDelete.title,
        data: chkToDelete,
        timestamp: Date.now(),
        restore: async () => {
          const { id: _, ...data } = chkToDelete;
          await addChecklist(data);
        },
      });
    }

    addToast(
      lang === 'ar'
        ? `تم حذف قائمة التحقق "${chkToDelete?.title || ''}"`
        : `Checklist "${chkToDelete?.title || ''}" deleted`,
      'delete',
      chkToDelete
        ? {
            label: lang === 'ar' ? 'تراجع ↺' : 'Undo ↺',
            onClick: handleUndo,
          }
        : undefined
    );

    try {
      await deleteChecklist(id);
    } catch (err) {
      console.error('Failed to delete checklist:', err);
      addToast(
        lang === 'ar' ? 'خطأ في حذف قائمة التحقق' : 'Error deleting checklist',
        'error'
      );
    }
  };

  // Planner CRUD
  const handleAddPlannerSlot = async (slot: Omit<WeeklyPlanSlot, 'id'>) => {
    const tempId = `temp-w-${Date.now()}`;
    setPlans((prev) => [...prev, { ...slot, id: tempId }]);

    try {
      const created = await addPlannerSlot(slot);
      addToast(
        lang === 'ar' ? 'تم جدولة الفترة بنجاح' : 'Block scheduled',
        'success'
      );
      return created;
    } catch (err) {
      console.error('Failed to add planner slot:', err);
    }
  };

  const handleUpdatePlannerSlot = async (id: string, updates: Partial<WeeklyPlanSlot>) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    try {
      await updatePlannerSlot(id, updates);
    } catch (err) {
      console.error('Failed to update planner slot:', err);
    }
  };

  const handleDeletePlannerSlot = async (id: string) => {
    const slotToDelete = plans.find((p) => p.id === id);
    setPlans((prev) => prev.filter((p) => p.id !== id));

    if (slotToDelete) {
      setLastDeletedItem({
        id,
        type: 'note',
        title: slotToDelete.title,
        data: slotToDelete,
        timestamp: Date.now(),
        restore: async () => {
          const { id: _, ...data } = slotToDelete;
          await addPlannerSlot(data);
        },
      });
    }

    addToast(
      lang === 'ar' ? 'تمت إزالة فترة الجدول الأسبوعي' : 'Schedule block removed',
      'delete',
      slotToDelete
        ? {
            label: lang === 'ar' ? 'تراجع ↺' : 'Undo ↺',
            onClick: handleUndo,
          }
        : undefined
    );

    try {
      await deletePlannerSlot(id);
    } catch (err) {
      console.error('Failed to delete planner slot:', err);
    }
  };

  // Note CRUD
  const handleAddNote = async (note: Omit<NoteItem, 'id'>) => {
    const tempId = `temp-n-${Date.now()}`;
    setNotes((prev) => [{ ...note, id: tempId }, ...prev]);

    try {
      const created = await addNote(note);
      addToast(
        lang === 'ar' ? 'تم إنشاء مذكرة جديدة' : 'New note created',
        'success'
      );
      return created;
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<NoteItem>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
    try {
      await updateNote(id, updates);
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const noteToDelete = notes.find((n) => n.id === id);
    setNotes((prev) => prev.filter((n) => n.id !== id));

    if (noteToDelete) {
      setLastDeletedItem({
        id,
        type: 'note',
        title: noteToDelete.title,
        data: noteToDelete,
        timestamp: Date.now(),
        restore: async () => {
          const { id: _, ...data } = noteToDelete;
          await addNote(data);
        },
      });
    }

    addToast(
      lang === 'ar'
        ? `تم حذف المذكرة "${noteToDelete?.title || 'وثيقة'}"`
        : `Note "${noteToDelete?.title || 'Document'}" deleted`,
      'delete',
      noteToDelete
        ? {
            label: lang === 'ar' ? 'تراجع ↺' : 'Undo ↺',
            onClick: handleUndo,
          }
        : undefined
    );

    try {
      await deleteNote(id);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Goal CRUD
  const handleAddGoal = async (goal: Omit<GoalItem, 'id'>) => {
    const tempId = `temp-g-${Date.now()}`;
    setGoals((prev) => [{ ...goal, id: tempId }, ...prev]);

    try {
      const created = await addGoal(goal);
      addToast(
        lang === 'ar'
          ? `تم إنشاء الهدف "${goal.title}"`
          : `Goal "${goal.title}" created`,
        'success'
      );
      return created;
    } catch (err) {
      console.error('Failed to add goal:', err);
      addToast(
        lang === 'ar' ? 'فشل حفظ الهدف' : 'Failed to save goal',
        'error'
      );
    }
  };

  const handleUpdateGoal = async (id: string, updates: Partial<GoalItem>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
    try {
      await updateGoal(id, updates);
    } catch (err) {
      console.error('Failed to update goal:', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const goalToDelete = goals.find((g) => g.id === id);
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, archived: true } : g))
    );

    if (goalToDelete) {
      setLastDeletedItem({
        id,
        type: 'goal',
        title: goalToDelete.title,
        data: goalToDelete,
        timestamp: Date.now(),
        restore: async () => {
          await updateGoal(id, { archived: false });
        },
      });
    }

    addToast(
      lang === 'ar'
        ? `تم أرشفة الهدف "${goalToDelete?.title || 'الهدف'}"`
        : `Goal "${goalToDelete?.title || 'Target'}" archived`,
      'delete',
      goalToDelete
        ? {
            label: lang === 'ar' ? 'تراجع ↺' : 'Undo ↺',
            onClick: handleUndo,
          }
        : undefined
    );

    try {
      await deleteGoal(id);
    } catch (err) {
      console.error('Failed to archive goal:', err);
      addToast(
        lang === 'ar' ? 'حدث خطأ في أرشفة الهدف' : 'Error archiving goal',
        'error'
      );
    }
  };

  // Weekly Priority Goals Handlers
  const handleAddWeeklyGoal = async (goal: Omit<WeeklyPriorityGoal, 'id'>) => {
    const tempId = `temp-wg-${Date.now()}`;
    const newGoal: WeeklyPriorityGoal = { ...goal, id: tempId };
    setWeeklyPriorityGoals((prev) => [...prev, newGoal]);
    try {
      const created = await addWeeklyGoal(goal);
      return created;
    } catch (e) {
      console.warn('Saved weekly goal in local state:', e);
      return { id: tempId };
    }
  };

  const handleUpdateWeeklyGoal = async (id: string, updates: Partial<WeeklyPriorityGoal>) => {
    setWeeklyPriorityGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g))
    );
    try {
      await updateWeeklyGoal(id, updates);
    } catch (e) {
      console.warn('Updated weekly goal locally:', e);
    }
  };

  const handleDeleteWeeklyGoal = async (id: string) => {
    setWeeklyPriorityGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteWeeklyGoal(id);
    } catch (e) {
      console.warn('Deleted weekly goal locally:', e);
    }
  };

  const handleRolloverWeeklyGoals = async (
    sourceWeekId: string,
    targetWeekId: string,
    decisions: Record<string, { action: 'rollover' | 'cancel' | 'complete'; notes?: string; newProgress?: number }>
  ) => {
    const currentWeekGoals = weeklyPriorityGoals.filter((g) => g.weekId === sourceWeekId);
    for (const g of currentWeekGoals) {
      if (!g.id) continue;
      const dec = decisions[g.id];
      if (!dec) continue;

      if (dec.action === 'complete') {
        await handleUpdateWeeklyGoal(g.id, {
          status: 'completed',
          progressPercent: 100,
          outcomeNotes: dec.notes || g.outcomeNotes
        });
      } else if (dec.action === 'cancel') {
        await handleUpdateWeeklyGoal(g.id, {
          status: 'cancelled',
          outcomeNotes: dec.notes || g.outcomeNotes
        });
      } else if (dec.action === 'rollover') {
        await handleUpdateWeeklyGoal(g.id, {
          status: 'carried_over',
          outcomeNotes: dec.notes || g.outcomeNotes
        });
        await handleAddWeeklyGoal({
          weekId: targetWeekId,
          rank: g.rank,
          title: g.title,
          description: g.description,
          linkedGoalId: g.linkedGoalId,
          linkedProjectId: g.linkedProjectId,
          progressPercent: dec.newProgress !== undefined ? dec.newProgress : g.progressPercent,
          status: 'in_progress',
          carriedFromWeekId: sourceWeekId,
          createdAt: Date.now()
        });
      }
    }
    addToast(
      lang === 'ar'
        ? '✓ تم ترحيل أهداف الأسبوع بنجاح وتحديث السجل!'
        : '✓ Weekly goals rolled over successfully!',
      'success'
    );
  };

  // Archive Hub Handlers
  const handleUnarchiveItem = async (type: ArchiveItemType, id: string) => {
    try {
      switch (type) {
        case 'task':
          await updateTask(id, { archived: false, archivedAt: undefined });
          setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, archived: false, archivedAt: undefined } : t)));
          break;
        case 'project':
          await updateProject(id, { archived: false, archivedAt: undefined });
          setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived: false, archivedAt: undefined } : p)));
          break;
        case 'dailyBlock':
          await updateDailyBlock(id, { archived: false, archivedAt: undefined });
          setDailyBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, archived: false, archivedAt: undefined } : b)));
          break;
        case 'note':
          await updateNote(id, { archived: false, archivedAt: undefined });
          setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, archived: false, archivedAt: undefined } : n)));
          break;
        case 'checklist':
          await updateChecklist(id, { archived: false, archivedAt: undefined });
          setChecklists((prev) => prev.map((c) => (c.id === id ? { ...c, archived: false, archivedAt: undefined } : c)));
          break;
        case 'habit':
          await updateHabit(id, { archived: false });
          setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, archived: false } : h)));
          break;
        case 'goal':
          await updateGoal(id, { archived: false });
          setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, archived: false } : g)));
          break;
      }
      playCelebrationChime();
      addToast(
        lang === 'ar' ? 'تم استرجاع العنصر إلى اللوحة النشطة بنجاح!' : 'Item restored to active workspace!',
        'success'
      );
    } catch (err) {
      console.error('Failed to unarchive item:', err);
      addToast(lang === 'ar' ? 'فشل استرجاع العنصر من الأرشيف' : 'Failed to unarchive item', 'error');
    }
  };

  const handlePermanentDeleteItem = async (type: ArchiveItemType, id: string) => {
    try {
      switch (type) {
        case 'task':
          await deleteTask(id);
          setTasks((prev) => prev.filter((t) => t.id !== id));
          break;
        case 'project':
          await deleteProject(id);
          setProjects((prev) => prev.filter((p) => p.id !== id));
          break;
        case 'dailyBlock':
          await deleteDailyBlock(id);
          setDailyBlocks((prev) => prev.filter((b) => b.id !== id));
          break;
        case 'note':
          await deleteNote(id);
          setNotes((prev) => prev.filter((n) => n.id !== id));
          break;
        case 'checklist':
          await deleteChecklist(id);
          setChecklists((prev) => prev.filter((c) => c.id !== id));
          break;
        case 'habit':
          await deleteHabit(id);
          setHabits((prev) => prev.filter((h) => h.id !== id));
          break;
        case 'goal':
          await deleteGoal(id);
          setGoals((prev) => prev.filter((g) => g.id !== id));
          break;
      }
      addToast(lang === 'ar' ? 'تم حذف العنصر نهائياً' : 'Item permanently deleted', 'info');
    } catch (err) {
      console.error('Failed to permanently delete item:', err);
      addToast(lang === 'ar' ? 'فشل الحذف النهائي' : 'Failed to delete permanently', 'error');
    }
  };

  const handleArchiveCompletedTasks = async () => {
    const completedTasks = tasks.filter((t) => t.completed && !t.archived);
    if (completedTasks.length === 0) return;
    try {
      const now = Date.now();
      for (const t of completedTasks) {
        if (t.id) {
          await updateTask(t.id, { archived: true, archivedAt: now });
        }
      }
      setTasks((prev) =>
        prev.map((t) => (t.completed && !t.archived ? { ...t, archived: true, archivedAt: now } : t))
      );
      addToast(
        lang === 'ar'
          ? `تمت أرشفة ${completedTasks.length} مهمة مكتملة بنجاح!`
          : `Archived ${completedTasks.length} completed tasks!`,
        'success'
      );
    } catch (err) {
      console.error('Failed to bulk archive tasks:', err);
      addToast(lang === 'ar' ? 'فشل أرشفة المهام' : 'Failed to archive tasks', 'error');
    }
  };

  return (
    <AuthGate
      user={currentUser}
      loading={authLoading}
      accessControl={accessControl}
      lang={lang}
      isDark={isDark}
      onToggleTheme={toggleTheme}
      onToggleLanguage={toggleLanguage}
      onSignOut={handleSignOut}
    >
      <div className={`min-h-screen w-full max-w-full flex text-neutral-900 dark:text-[#F3F4F6] selection:bg-neutral-200 ${compactLayout ? 'text-xs' : ''} bg-[#FBFBFA] dark:bg-[#121316]`}>
        {/* Sidebar Navigation (Desktop Collapsible Small/Big & Mobile Bottom Bar) */}
        <Sidebar
          activeModule={activeModule}
          setActiveModule={(mod) => changeModule(mod)}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onOpenSetupGuide={() => setShowSetupGuide(true)}
          onOpenExportModal={() => setShowExportModal(true)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          lang={lang}
          onToggleLanguage={toggleLanguage}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden pt-28 md:pt-6 pb-6 bg-[#FBFBFA] dark:bg-[#121316]">
        {/* Top Floating App Bar */}
        <header className="fixed top-0 left-0 right-0 z-20 px-3 sm:px-6 py-2.5 bg-white/90 dark:bg-[#121316]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile App Logo */}
            <div className="md:hidden flex items-center">
              <img
                src={isDark ? '/assets/logo-full-dark.svg' : '/assets/logo-full.svg'}
                alt="Core"
                className="h-6 max-w-[100px] object-contain object-left"
              />
            </div>
            <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Core
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">/</span>

            <span className="text-xs sm:text-xs font-bold text-neutral-900 dark:text-white capitalize">
              {activeModule === 'daily-blocks'
                ? (lang === 'ar' ? 'فترات وقوالب اليوم' : 'Daily Blocks')
                : activeModule === 'checklists' 
                ? translations[lang].checklistsSOPs 
                : activeModule === 'habits' 
                ? translations[lang].habitTracker
                : activeModule === 'tasks'
                ? translations[lang].taskTracker
                : activeModule === 'planner'
                ? translations[lang].weeklyPlanner
                : activeModule === 'projects'
                ? translations[lang].projects
                : activeModule === 'notes'
                ? translations[lang].brainDumpNotes
                : activeModule === 'analytics'
                ? translations[lang].analyticsTelemetry
                : activeModule === 'goals'
                ? translations[lang].goalsTargets
                : activeModule === 'guide'
                ? translations[lang].operatingGuide
                : activeModule === 'mentor'
                ? translations[lang].aiMentor
                : activeModule === 'settings'
                ? translations[lang].settings
                : activeModule === 'focus'
                ? (lang === 'ar' ? 'محطة التركيز وبومودورو' : 'Deep Focus & Pomodoro')
                : activeModule === 'training'
                ? (lang === 'ar' ? 'محرك التدريب واللياقة' : 'Training Engine')
                : activeModule === 'sunday-reset'
                ? (lang === 'ar' ? 'إعادة الضبط الأسبوعي' : 'Sunday Reset')
                : activeModule === 'reflections'
                ? (lang === 'ar' ? 'سجل التأملات والدروس المستفادة' : 'Reflections & Lessons Journal')
                : activeModule === 'archive'
                ? (lang === 'ar' ? 'الأرشيف والمحفوظات' : 'Executive Archive Hub')
                : translations[lang].overview}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Pomodoro Timer - Configurable in Pomodoro Settings */}
            {showTopBarTimer && (
              <button
                id="top-focus-clock"
                onClick={() => changeModule('focus')}
                className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1E2022] dark:hover:bg-[#2D3136] rounded-full border border-neutral-200 dark:border-[#2D3136] shadow-3xs transition-all select-none cursor-pointer"
                title={lang === 'ar' ? 'عرض محطة التركيز ومؤقت بومودورو' : 'Go to Deep Focus & Pomodoro station'}
              >
                <Timer size={13} className={sharedIsActive ? "text-emerald-500 animate-pulse" : "text-neutral-500 dark:text-neutral-400"} />
                <span className="font-mono text-xs font-black text-neutral-800 dark:text-neutral-200">
                  {Math.floor(sharedTimeRemaining / 60).toString().padStart(2, '0')}:{(sharedTimeRemaining % 60).toString().padStart(2, '0')}
                </span>
                {sharedIsActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                )}
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Module Workspace with compact / responsive scaling */}
        <div className={`flex-1 px-3 sm:px-6 py-3 sm:py-5 w-full mx-auto transition-all ${compactLayout ? 'max-w-5xl' : 'max-w-6xl'} bg-[#FBFBFA] dark:bg-[#121316]`}>
          {isLoading ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-2">
              <RefreshCw size={22} className="animate-spin text-[#787774]" />
              <p className="text-xs font-medium text-[#787774]">
                {lang === 'ar' ? 'جاري الاتصال بقاعدة بيانات فايرستور السحابية...' : 'Connecting to Cloud Firestore...'}
              </p>
            </div>
          ) : (
            <>
              {/* SYSTEM TRACKING DEACTIVATED NOTICE */}
              {!systemTrackingActive && (
                <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base shrink-0">⏸️</span>
                    <div>
                      <p className="font-bold">{lang === 'ar' ? 'تتبع النظام معطل حالياً (توقف الحساب التراكمي)' : 'Master System Tracking Suspended'}</p>
                      <p className="text-[11px] opacity-85">
                        {lang === 'ar'
                          ? 'تم إيقاف احتساب وتراكم الأرقام والسلاسل عبر كامل التطبيق. عند إعادة التفعيل في الإعدادات سيتم استئناف الحساب بدءاً من تلك اللحظة.'
                          : 'All number counting, streaks, and telemetry are paused across the OS. Reactivating in Settings will resume counting forward from that exact moment.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => changeModule('settings')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    {lang === 'ar' ? 'إدارة الإعدادات' : 'Go to Settings'}
                  </button>
                </div>
              )}

              {(activeModule === 'dashboard' || activeModule === 'analytics') && (
                <ReviewPromptBanner
                  reviews={reviews}
                  appStartDate={appStartDate}
                  onOpenWeekly={() => handleOpenReviewModal('weekly')}
                  onOpenMonthly={() => handleOpenReviewModal('monthly')}
                  onOpenArchive={() => handleOpenReviewModal('archive')}
                  lang={lang}
                />
              )}

              {activeModule === 'dashboard' && (
                <DashboardOverview
                  tasks={tasks}
                  habits={habits}
                  projects={projects}
                  checklists={checklists}
                  notes={notes}
                  plans={plans}
                  dailyBlocks={dailyBlocks}
                  focusSessions={focusSessions}
                  rewards={rewards}
                  setActiveModule={(mod) => changeModule(mod)}
                  onToggleTask={(id, completed) => handleUpdateTask(id, { completed })}
                  onToggleHabit={toggleHabitDate}
                  onBatchCompleteHabits={handleBatchCompleteHabits}
                  onAddReward={handleAddReward}
                  onClaimReward={handleClaimReward}
                  onDeleteReward={handleDeleteReward}
                  onApplyTaskSkip={handleApplyTaskSkip}
                  onApplyFreezeExcuse={handleApplyFreezeExcuse}
                  onRemoveFreeze={handleRemoveFreeze}
                  sleepLogs={sleepLogs}
                  sleepConfig={sleepConfig}
                  reviews={reviews}
                  workouts={workouts}
                  lang={lang}
                />
              )}

              {activeModule === 'daily-blocks' && (
                <DailyBlocksEngine
                  blocks={dailyBlocks.filter((b) => !b.archived)}
                  tasks={tasks.filter((t) => !t.archived)}
                  habits={habits}
                  plans={plans}
                  projects={projects.filter((p) => !p.archived)}
                  goals={goals.filter((g) => !g.archived)}
                  onAddBlock={handleAddDailyBlock}
                  onUpdateBlock={handleUpdateDailyBlock}
                  onDeleteBlock={handleDeleteDailyBlock}
                  onBatchApplyBlocks={handleBatchApplyDailyBlocks}
                  onClearDateBlocks={handleClearDailyBlocksForDate}
                  onToggleTask={(id, completed) => handleUpdateTask(id, { completed })}
                  onToggleHabit={toggleHabitDate}
                  onAddWeeklyPlanSlot={handleAddPlannerSlot}
                  onNavigateModule={(mod) => changeModule(mod)}
                  lang={lang}
                  isDark={isDark}
                />
              )}

              {activeModule === 'analytics' && (
                <AnalyticsDashboard
                  tasks={tasks}
                  habits={habits}
                  projects={projects}
                  plans={plans}
                  checklists={checklists}
                  goals={goals}
                  focusSessions={focusSessions}
                  reviews={reviews}
                  dailyBlocks={dailyBlocks}
                  workouts={workouts}
                  sleepLogs={sleepLogs}
                  moduleLifecycleEvents={moduleLifecycleEvents}
                  appStartDate={appStartDate}
                  onOpenReviewModal={handleOpenReviewModal}
                  onNavigateModule={(mod) => changeModule(mod)}
                  initialTab={analyticsTab as any}
                  lang={lang}
                />
              )}

              {activeModule === 'goals' && (
                <GoalsManager
                  goals={goals.filter((g) => !g.archived)}
                  projects={projects.filter((p) => !p.archived)}
                  habits={habits}
                  weeklyGoals={weeklyPriorityGoals}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onDeleteGoal={handleDeleteGoal}
                  onAddWeeklyGoal={handleAddWeeklyGoal}
                  onUpdateWeeklyGoal={handleUpdateWeeklyGoal}
                  onDeleteWeeklyGoal={handleDeleteWeeklyGoal}
                  lang={lang}
                />
              )}

              {activeModule === 'habits' && (
                <HabitTracker
                  habits={habits}
                  rewards={rewards}
                  sleepLogs={sleepLogs}
                  sleepConfig={sleepConfig}
                  workouts={workouts}
                  onNavigateModule={(mod) => changeModule(mod as any)}
                  onAddHabit={handleAddHabit}
                  onToggleHabit={toggleHabitDate}
                  onToggleFreeze={toggleHabitFreeze}
                  onApplyFreezeExcuse={handleApplyFreezeExcuse}
                  onRemoveFreeze={handleRemoveFreeze}
                  onUpdateHabit={handleUpdateHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onReorderHabits={reorderHabits}
                  onUpdateDailyValue={updateHabitDailyValue}
                  onBulkUpdateHabits={handleBulkUpdateHabits}
                  onBulkDeleteHabits={handleBulkDeleteHabits}
                  onOpenExportModal={() => setShowExportModal(true)}
                  onAddReward={handleAddReward}
                  onClaimReward={handleClaimReward}
                  onDeleteReward={handleDeleteReward}
                  onSaveSleepLog={handleSaveSleepLog}
                  onSaveSleepConfig={handleSaveSleepConfig}
                  onDeleteSleepLog={handleDeleteSleepLog}
                  lang={lang}
                />
              )}

              {activeModule === 'reflections' && (
                <ReflectionsJournal
                  reviews={reviews}
                  habits={habits}
                  tasks={tasks}
                  sleepLogs={sleepLogs}
                  focusSessions={focusSessions}
                  weeklyGoals={weeklyPriorityGoals}
                  onSaveReview={handleSaveReview}
                  onDeleteReview={handleDeleteReview}
                  lang={lang}
                />
              )}

              {activeModule === 'tasks' && (
                <TaskTracker
                  tasks={tasks.filter((t) => !t.archived)}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onReorderTasks={reorderTasks}
                  onBulkUpdateTasks={handleBulkUpdateTasks}
                  onBulkDeleteTasks={handleBulkDeleteTasks}
                  onFocusTask={handleFocusTask}
                  onBulkSendToPomodoro={handleBulkSendToPomodoro}
                  onAddFocusSession={addFocusSession}
                  comments={comments}
                  onAddComment={handleAddComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  allHabits={habits}
                  allNotes={notes}
                  allProjects={projects}
                  allGoals={goals}
                  lang={lang}
                  onScheduleTask={(task) => {
                    setPreSelectedTaskId(task.id || null);
                    setAutoOpenPlannerAddModal(true);
                    changeModule('planner');
                  }}
                />
              )}

              {activeModule === 'comments' && (
                <CommentsHub
                  comments={comments}
                  tasks={tasks}
                  habits={habits}
                  notes={notes}
                  projects={projects}
                  goals={goals}
                  onAddComment={handleAddComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  onNavigateItem={(type, id) => {
                    if (type === 'task') changeModule('tasks');
                    if (type === 'habit') changeModule('habits');
                    if (type === 'note') changeModule('notes');
                    if (type === 'project') changeModule('projects');
                    if (type === 'goal') changeModule('goals');
                  }}
                  lang={lang}
                />
              )}

              {activeModule === 'checklists' && (
                <ChecklistsManager
                  checklists={checklists.filter((c) => !c.archived)}
                  projects={projects.filter((p) => !p.archived)}
                  tasks={tasks.filter((t) => !t.archived)}
                  onAddChecklist={handleAddChecklist}
                  onUpdateChecklist={handleUpdateChecklist}
                  onDeleteChecklist={handleDeleteChecklist}
                  lang={lang}
                />
              )}

              {activeModule === 'planner' && (
                <WeeklyPlanner
                  plans={plans}
                  tasks={tasks}
                  habits={habits}
                  projects={projects}
                  goals={goals}
                  weeklyGoals={weeklyPriorityGoals}
                  dailyBlocks={dailyBlocks}
                  onAddPlan={handleAddPlannerSlot}
                  onUpdatePlan={handleUpdatePlannerSlot}
                  onDeletePlan={handleDeletePlannerSlot}
                  onBatchAddPlans={(slots) => batchApplyPlannerSlots(slots)}
                  onClearDayPlans={(dayIndex) => clearPlannerSlotsForDay(dayIndex, plans)}
                  onAddDailyBlock={handleAddDailyBlock}
                  onUpdateDailyBlock={handleUpdateDailyBlock}
                  onDeleteDailyBlock={handleDeleteDailyBlock}
                  onBatchApplyDailyBlocks={handleBatchApplyDailyBlocks}
                  onClearDateBlocks={handleClearDailyBlocksForDate}
                  onToggleTask={(id, completed) => handleUpdateTask(id, { completed })}
                  onToggleHabit={toggleHabitDate}
                  onAddWeeklyGoal={handleAddWeeklyGoal}
                  onUpdateWeeklyGoal={handleUpdateWeeklyGoal}
                  onDeleteWeeklyGoal={handleDeleteWeeklyGoal}
                  onRolloverWeeklyGoals={handleRolloverWeeklyGoals}
                  onNavigateModule={(mod) => changeModule(mod)}
                  onNavigateGuide={() => changeModule('guide')}
                  lang={lang}
                  isDark={isDark}
                  preSelectedTaskId={preSelectedTaskId}
                  autoOpenAddModal={autoOpenPlannerAddModal}
                  onClearPreSelection={() => {
                    setPreSelectedTaskId(null);
                    setAutoOpenPlannerAddModal(false);
                  }}
                />
              )}

              {activeModule === 'settings' && (
                <SettingsManager
                  lang={lang}
                  setLang={setLang}
                  isDark={isDark}
                  onToggleTheme={toggleTheme}
                  habits={habits}
                  tasks={tasks}
                  projects={projects}
                  notes={notes}
                  plans={plans}
                  checklists={checklists}
                  goals={goals}
                  comments={comments}
                  focusSessions={focusSessions}
                  compactLayout={compactLayout}
                  onToggleCompactLayout={toggleCompactLayout}
                  isOnline={isOnline}
                  onOpenExportModal={() => setShowExportModal(true)}
                  onOpenFirestoreGuide={() => setShowSetupGuide(true)}
                  rewards={rewards}
                  onAddReward={handleAddReward}
                  onUpdateReward={handleUpdateReward}
                  onClaimReward={handleClaimReward}
                  onDeleteReward={handleDeleteReward}
                  onResetRewards={handleResetRewards}
                  onClearAllRewards={handleClearAllRewards}
                  onClearPresetSamples={handleClearPresetSamples}
                  onDataReset={handleFullWorkspaceReset}
                  currentUser={currentUser}
                  accessControl={accessControl}
                  onAddCollaborator={handleAddCollaborator}
                  onRemoveCollaborator={handleRemoveCollaborator}
                  onSignOut={handleSignOut}
                  showTopBarTimer={showTopBarTimer}
                  onToggleTopBarTimer={handleToggleTopBarTimer}
                />
              )}

              {activeModule === 'projects' && (
                <ProjectsManager
                  projects={projects.filter((p) => !p.archived)}
                  goals={goals.filter((g) => !g.archived)}
                  onAddProject={handleAddProject}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onDeleteGoal={handleDeleteGoal}
                  lang={lang}
                />
              )}

              {activeModule === 'notes' && (
                <NotesReminders
                  notes={notes.filter((n) => !n.archived)}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onConvertToTask={handleAddTask}
                  onConvertToChecklist={handleAddChecklist}
                  lang={lang}
                />
              )}

              {activeModule === 'archive' && (
                <ArchiveHub
                  tasks={tasks}
                  habits={habits}
                  projects={projects}
                  notes={notes}
                  checklists={checklists}
                  dailyBlocks={dailyBlocks}
                  goals={goals}
                  onUnarchiveItem={handleUnarchiveItem}
                  onPermanentDeleteItem={handlePermanentDeleteItem}
                  onArchiveCompletedTasks={handleArchiveCompletedTasks}
                  lang={lang}
                  onNavigateModule={(mod) => changeModule(mod)}
                />
              )}

              {activeModule === 'guide' && (
                <UserGuide
                  onNavigateModule={(mod) => setActiveModule(mod)}
                  lang={lang}
                />
              )}

              {activeModule === 'mentor' && (
                <Atlas
                  habitsCount={habits.length}
                  tasksCount={tasks.length}
                  goalsCount={goals.length}
                  onNavigateToPlanImport={() => {
                    setActiveModule('dashboard');
                    setShowExportModal(true);
                  }}
                  lang={lang}
                  onAddTask={handleAddTask}
                  onAddHabit={handleAddHabit}
                />
              )}

              {activeModule === 'focus' && (
                <FocusTracker
                  tasks={tasks}
                  habits={habits}
                  projects={projects}
                  focusSessions={focusSessions}
                  lang={lang}
                  isDark={isDark}
                  timeRemaining={sharedTimeRemaining}
                  setTimeRemaining={setSharedTimeRemaining}
                  isActive={sharedIsActive}
                  setIsActive={setSharedIsActive}
                  timerMode={sharedTimerMode}
                  setTimerMode={setSharedTimerMode}
                  activeTaskId={activeFocusTaskId}
                  setActiveTaskId={setActiveFocusTaskId}
                  focusQueueIds={focusQueueTaskIds}
                  setFocusQueueIds={setFocusQueueTaskIds}
                  onUpdateTask={handleUpdateTask}
                  onAddTask={handleAddTask}
                  showTopBarTimer={showTopBarTimer}
                  onToggleTopBarTimer={handleToggleTopBarTimer}
                  onNavigateAnalytics={(tab) => {
                    setAnalyticsTab(tab || 'focus');
                    setActiveModule('analytics');
                  }}
                />
              )}

              {activeModule === 'training' && (
                <TrainingEngine
                  workouts={workouts}
                  habits={habits}
                  onToggleHabit={toggleHabitDate}
                  isDark={isDark}
                  lang={lang}
                />
              )}

              {activeModule === 'sunday-reset' && (
                <SundayResetWizard
                  habits={habits}
                  tasks={tasks}
                  plans={plans}
                  notes={notes}
                  onUpdateHabit={handleUpdateHabit}
                  onUpdateTask={handleUpdateTask}
                  onAddPlan={handleAddPlannerSlot}
                  onUpdateNote={handleUpdateNote}
                  onAddTask={handleAddTask}
                  onAddSundayReset={addSundayReset}
                  onNavigateModule={setActiveModule}
                  lang={lang}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button & Quick Speed Dial (Mobile Only) */}
      <MobileQuickFab
        onAddTask={handleAddTask}
        onAddHabit={handleAddHabit}
        onAddNote={handleAddNote}
        onNavigateModule={(mod) => setActiveModule(mod)}
        onAddPlannerSlot={handleAddPlannerSlot}
        lang={lang}
      />

      {/* Executive Review Journal Modal */}
      <ReviewJournalModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        habits={habits}
        tasks={tasks}
        focusSessions={focusSessions}
        workouts={workouts}
        reviews={reviews}
        onSaveReview={handleSaveReview}
        onDeleteReview={handleDeleteReview}
        initialType={reviewModalTab}
        lang={lang}
      />

      {/* Export, Backup & Phone Sync Modal */}
      <ExportImportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        habits={habits}
        tasks={tasks}
        projects={projects}
        checklists={checklists}
        notes={notes}
        plans={plans}
        goals={goals}
        comments={comments}
        focusSessions={focusSessions}
        onDataReset={handleFullWorkspaceReset}
        lang={lang}
      />

      {/* Database Guide Modal */}
      <SetupGuideModal
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
        projectId={firebaseConfig.projectId}
        lang={lang}
      />

      {/* Focus System Components */}
      <FocusSelectModal
        isOpen={showFocusSelectModal}
        tasks={tasks}
        plans={plans}
        lang={lang}
        onClose={() => setShowFocusSelectModal(false)}
        onStartFocus={handleStartFocus}
      />

      <DeepFocusOverlay
        isOpen={isFocusMode}
        timeRemaining={pomodoroTime}
        isActive={pomodoroActive}
        target={pomodoroTarget}
        ambientAudio={ambientAudio}
        lang={lang}
        onPause={handlePauseFocus}
        onResume={handleResumeFocus}
        onStop={handleStopFocus}
        onMinimize={() => setIsFocusMode(false)}
        onToggleAmbient={handleToggleAmbientAudio}
      />

      {/* Elegant Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
    </AuthGate>
  );
}

