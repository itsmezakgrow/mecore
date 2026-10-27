import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Database,
  Key,
  Moon,
  Sun,
  Globe,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Check,
  Smartphone,
  Copy,
  Info,
  ShieldCheck,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  RefreshCw,
  Layers,
  MessageSquare,
  Timer,
  CheckSquare,
  Flame,
  StickyNote,
  FolderKanban,
  Target,
  ListChecks,
  CalendarDays,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Grid,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  FolderPlus,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
  Volume1,
  Award,
  Gift,
  Trophy,
  Edit2,
  Lock,
  Music,
  CheckCircle2,
  SlidersHorizontal,
  Ban,
  History,
  X,
  LogOut,
  KeyRound,
  Users,
  Mail,
  Activity
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  HabitItem, 
  TaskItem, 
  ProjectItem, 
  NoteItem, 
  WeeklyPlanSlot, 
  ChecklistGroup, 
  GoalItem, 
  AppComment, 
  FocusSession, 
  AppCategoryItem, 
  AppNavItemConfig, 
  ModuleType, 
  RewardItem,
  DashboardWidgetConfig,
  AccessControlData
} from '../types';
import { generateHabitsCSV } from '../utils/habitAnalytics';
import { importBackupData, importPlanJSON, clearAllDataFromFirestore, startCleanFreshPerformance, completeCleanWipe, DEFAULT_OWNER_EMAIL } from '../services/firestoreService';
import {
  getSavedNavCategories,
  saveNavCategories,
  getSavedNavItems,
  saveNavItems,
  DEFAULT_APP_CATEGORIES,
  DEFAULT_NAV_ITEMS
} from '../utils/appNavConfig';
import { soundManager } from '../utils/soundEffects';
import {
  ALL_CONTROLLABLE_MODULES,
  getDisabledModules,
  setModuleState,
  getModuleLifecycleHistory,
  isSystemTrackingActive,
  setSystemTrackingActive,
  getSystemActivatedAt
} from '../utils/moduleLifecycle';
import { ModuleLifecycleEvent } from '../types';

interface SettingsManagerProps {
  lang: 'en' | 'ar';
  setLang: (l: 'en' | 'ar') => void;
  isDark: boolean;
  onToggleTheme: () => void;
  habits: HabitItem[];
  tasks: TaskItem[];
  projects: ProjectItem[];
  notes: NoteItem[];
  plans: WeeklyPlanSlot[];
  checklists: ChecklistGroup[];
  goals: GoalItem[];
  comments?: AppComment[];
  focusSessions?: FocusSession[];
  onDataReset: () => void;
  compactLayout: boolean;
  onToggleCompactLayout: () => void;
  isOnline: boolean;
  onOpenExportModal: () => void;
  onOpenFirestoreGuide: () => void;
  // Feature Controls & Customizer Props
  rewards?: RewardItem[];
  onAddReward?: (reward: Omit<RewardItem, 'id'>) => Promise<void>;
  onUpdateReward?: (rewardId: string, updated: Partial<RewardItem>) => Promise<void>;
  onClaimReward?: (rewardId: string) => Promise<void>;
  onDeleteReward?: (rewardId: string) => Promise<void>;
  onResetRewards?: () => void;
  onClearAllRewards?: () => void;
  onClearPresetSamples?: () => void;
  currentUser?: FirebaseUser | null;
  accessControl?: AccessControlData;
  onAddCollaborator?: (email: string) => Promise<void>;
  onRemoveCollaborator?: (email: string) => Promise<void>;
  onSignOut?: () => Promise<void>;
  showTopBarTimer?: boolean;
  onToggleTopBarTimer?: (show: boolean) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  lang,
  setLang,
  isDark,
  onToggleTheme,
  habits,
  tasks,
  projects,
  notes,
  plans,
  checklists,
  goals,
  comments = [],
  focusSessions = [],
  onDataReset,
  compactLayout,
  onToggleCompactLayout,
  isOnline,
  onOpenExportModal,
  onOpenFirestoreGuide,
  rewards = [],
  onAddReward,
  onUpdateReward,
  onClaimReward,
  onDeleteReward,
  onResetRewards,
  onClearAllRewards,
  onClearPresetSamples,
  currentUser,
  accessControl,
  onAddCollaborator,
  onRemoveCollaborator,
  onSignOut,
  showTopBarTimer,
  onToggleTopBarTimer,
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'profile' | 'access' | 'preferences' | 'customization' | 'apps' | 'data' | 'ai'>('profile');

  // Pomodoro Top Bar Timer Display state
  const [topBarTimerEnabled, setTopBarTimerEnabled] = useState<boolean>(() => {
    if (showTopBarTimer !== undefined) return showTopBarTimer;
    try {
      const val = localStorage.getItem('pomodoro_show_top_bar_timer');
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (showTopBarTimer !== undefined) {
      setTopBarTimerEnabled(showTopBarTimer);
    }
  }, [showTopBarTimer]);

  // Collaborator management state
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [collaboratorFeedback, setCollaboratorFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Profile State
  const [profileName, setProfileName] = useState<string>(() => {
    try {
      return localStorage.getItem('core_profile_name') || '';
    } catch {
      return '';
    }
  });

  // AI Config State
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('core_gemini_api_key') || '';
    } catch {
      return '';
    }
  });

  // Sound settings state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundManager.isEnabled());
  const [soundVolume, setSoundVolume] = useState<number>(() => soundManager.getVolume());

  // App Navigation & Category Management States
  const [navCategories, setNavCategories] = useState<AppCategoryItem[]>(() => getSavedNavCategories());
  const [navItems, setNavItems] = useState<AppNavItemConfig[]>(() => getSavedNavItems());
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [showNavSuccess, setShowNavSuccess] = useState(false);

  // Data Management states
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmResetText, setConfirmResetText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [startCleanSuccessMessage, setStartCleanSuccessMessage] = useState<string | null>(null);
  const [isStartingClean, setIsStartingClean] = useState(false);
  const [showStartCleanModal, setShowStartCleanModal] = useState(false);
  const [startCleanMode, setStartCleanMode] = useState<'performance' | 'complete'>('performance');
  const [cleanConfirmWord, setCleanConfirmWord] = useState('');
  const [showApiKeySuccess, setShowApiKeySuccess] = useState(false);
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);
  const [customSuccessMessage, setCustomSuccessMessage] = useState<string | null>(null);

  // Edit states in settings
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);

  // System Tracking State
  const [systemTrackingActive, setSystemTrackingActiveState] = useState<boolean>(() => isSystemTrackingActive());
  const [systemActivatedAt, setSystemActivatedAt] = useState<number>(() => getSystemActivatedAt());

  useEffect(() => {
    const handleTrackingSync = () => {
      setSystemTrackingActiveState(isSystemTrackingActive());
      setSystemActivatedAt(getSystemActivatedAt());
    };
    window.addEventListener('core_system_tracking_changed', handleTrackingSync);
    return () => window.removeEventListener('core_system_tracking_changed', handleTrackingSync);
  }, []);

  // Module Master Lifecycle State
  const [disabledModules, setDisabledModules] = useState<ModuleType[]>(() => getDisabledModules());
  const [lifecycleHistory, setLifecycleHistory] = useState<ModuleLifecycleEvent[]>(() => getModuleLifecycleHistory());

  useEffect(() => {
    const handleModuleStateSync = () => {
      setDisabledModules(getDisabledModules());
      setLifecycleHistory(getModuleLifecycleHistory());
    };
    window.addEventListener('core_module_state_changed', handleModuleStateSync);
    return () => window.removeEventListener('core_module_state_changed', handleModuleStateSync);
  }, []);

  const handleAddCollaboratorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCollaboratorEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setCollaboratorFeedback({ text: isAr ? 'يرجى إدخال بريد إلكتروني صالح.' : 'Please enter a valid email address.', type: 'error' });
      return;
    }
    if (accessControl?.allowedEmails?.map(e => e.toLowerCase()).includes(clean)) {
      setCollaboratorFeedback({ text: isAr ? 'هذا البريد مضاف بالفعل في قائمة المصرح لهم.' : 'This email is already in the authorized list.', type: 'error' });
      return;
    }
    try {
      setIsAddingCollaborator(true);
      if (onAddCollaborator) {
        await onAddCollaborator(clean);
      }
      setNewCollaboratorEmail('');
      setCollaboratorFeedback({
        text: isAr ? `تمت إضافة ${clean} بنجاح! يمكنه الآن تسجيل الدخول والاطلاع على البيانات.` : `Successfully added ${clean}! They can now log in and access workspace data.`,
        type: 'success'
      });
      setTimeout(() => setCollaboratorFeedback(null), 5000);
    } catch (err: any) {
      setCollaboratorFeedback({ text: err.message || 'Failed to add collaborator', type: 'error' });
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaboratorClick = async (emailToRemove: string) => {
    if (!onRemoveCollaborator) return;
    try {
      await onRemoveCollaborator(emailToRemove);
      setCollaboratorFeedback({
        text: isAr ? `تمت إزالة ${emailToRemove} من قائمة المصرح لهم.` : `Removed ${emailToRemove} from access list.`,
        type: 'success'
      });
      setTimeout(() => setCollaboratorFeedback(null), 4000);
    } catch (err: any) {
      setCollaboratorFeedback({ text: err.message || 'Failed to remove', type: 'error' });
    }
  };

  const handleToggleModuleLifecycle = (moduleId: ModuleType) => {
    const isCurrentlyDisabled = disabledModules.includes(moduleId);
    const enable = isCurrentlyDisabled;
    const modDef = ALL_CONTROLLABLE_MODULES.find(m => m.id === moduleId);
    const modName = isAr ? (modDef?.nameAr || moduleId) : (modDef?.nameEn || moduleId);

    setModuleState(moduleId, enable, enable ? 'Re-activated in settings' : 'Deactivated in settings');
    setDisabledModules(getDisabledModules());
    setLifecycleHistory(getModuleLifecycleHistory());

    triggerCustomNotification(
      enable
        ? (isAr ? `✓ تم تفعيل قسم "${modName}" وأصبح نشطاً ومحسوباً في النظام!` : `✓ Activated "${modName}" module!`)
        : (isAr ? `✓ تم إيقاف قسم "${modName}" واستبعاده تماماً كأنه غير موجود (لا يؤثر سلباً على النتائج).` : `✓ Deactivated "${modName}". Excluded from score and hidden without penalties.`)
    );
  };

  const totalWorkspaceItems = 
    habits.length + 
    tasks.length + 
    projects.length + 
    notes.length + 
    plans.length + 
    checklists.length + 
    goals.length + 
    comments.length + 
    focusSessions.length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('core_profile_name', profileName.trim());
      setShowProfileSuccess(true);
      setTimeout(() => setShowProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('core_gemini_api_key', apiKey.trim());
      setShowApiKeySuccess(true);
      setTimeout(() => setShowApiKeySuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
    if (next) soundManager.playCheck();
  };

  const handleVolumeChange = (v: number) => {
    setSoundVolume(v);
    soundManager.setVolume(v);
  };

  // Nav item actions
  const handleToggleItemVisibility = (id: ModuleType) => {
    const updated = navItems.map((item) => {
      if (item.id === id) {
        return { ...item, hidden: !item.hidden };
      }
      return item;
    });
    setNavItems(updated);
    saveNavItems(updated);
    triggerNavSaveNotification();
  };

  const handleChangeItemCategory = (id: ModuleType, newCategory: string) => {
    const updated = navItems.map((item) => {
      if (item.id === id) {
        return { ...item, category: newCategory };
      }
      return item;
    });
    setNavItems(updated);
    saveNavItems(updated);
    triggerNavSaveNotification();
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navItems.length) return;

    const updated = [...navItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((item, idx) => ({ ...item, order: idx }));
    setNavItems(reordered);
    saveNavItems(reordered);
    triggerNavSaveNotification();
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameEn.trim()) return;

    const newCatId = 'custom_' + Date.now();
    const newCat: AppCategoryItem = {
      id: newCatId,
      nameEn: newCatNameEn.trim(),
      nameAr: newCatNameAr.trim() || newCatNameEn.trim(),
      order: navCategories.length,
    };

    const updated = [...navCategories, newCat];
    setNavCategories(updated);
    saveNavCategories(updated);
    setNewCatNameEn('');
    setNewCatNameAr('');
    triggerNavSaveNotification();
  };

  const handleDeleteCategory = (catId: string) => {
    const isDefault = DEFAULT_APP_CATEGORIES.some((c) => c.id === catId);
    if (isDefault) {
      alert(isAr ? 'لا يمكن حذف الأقسام الافتراضية للنظام.' : 'Default system categories cannot be deleted.');
      return;
    }

    const updatedCats = navCategories.filter((c) => c.id !== catId);
    setNavCategories(updatedCats);
    saveNavCategories(updatedCats);

    const updatedItems = navItems.map((item) => {
      if (item.category === catId) {
        return { ...item, category: 'core' };
      }
      return item;
    });
    setNavItems(updatedItems);
    saveNavItems(updatedItems);
    triggerNavSaveNotification();
  };

  const handleResetNavigation = () => {
    if (confirm(isAr ? 'هل تريد استعادة الترتيب والأقسام الافتراضية للتطبيقات؟' : 'Reset all apps and categories to factory defaults?')) {
      setNavCategories(DEFAULT_APP_CATEGORIES);
      saveNavCategories(DEFAULT_APP_CATEGORIES);
      setNavItems(DEFAULT_NAV_ITEMS);
      saveNavItems(DEFAULT_NAV_ITEMS);
      triggerNavSaveNotification();
    }
  };

  const triggerNavSaveNotification = () => {
    setShowNavSuccess(true);
    setTimeout(() => setShowNavSuccess(false), 2500);
  };

  const triggerCustomNotification = (msg: string) => {
    setCustomSuccessMessage(msg);
    setTimeout(() => setCustomSuccessMessage(null), 3000);
  };

  // Helper download blob
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. One-Click Full Workspace Backup (JSON)
  const handleExportFullWorkspaceJSON = () => {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    const fullBackup = {
      version: '3.0',
      system: 'Life-OS Core Workspace',
      exportedAt: now.toISOString(),
      counts: {
        habits: habits.length,
        tasks: tasks.length,
        projects: projects.length,
        notes: notes.length,
        planner: plans.length,
        checklists: checklists.length,
        goals: goals.length,
        comments: comments.length,
        focusSessions: focusSessions.length,
        total: totalWorkspaceItems,
      },
      data: {
        habits,
        tasks,
        projects,
        notes,
        planner: plans,
        checklists,
        goals,
        comments,
        focusSessions,
        rewards,
      },
    };

    const jsonString = JSON.stringify(fullBackup, null, 2);
    triggerDownload(
      jsonString,
      `life-os-full-workspace-${dateStr}.json`,
      'application/json'
    );
  };

  const handleExportCSV = () => {
    const csvContent = generateHabitsCSV(habits);
    const dateStr = new Date().toISOString().split('T')[0];
    triggerDownload(csvContent, `habits-export-${dateStr}.csv`, 'text/csv');
  };

  const handleExportTasksJSON = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const data = JSON.stringify(tasks, null, 2);
    triggerDownload(data, `tasks-export-${dateStr}.json`, 'application/json');
  };

  const handleExportCommentsJSON = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const data = JSON.stringify(comments, null, 2);
    triggerDownload(data, `comments-export-${dateStr}.json`, 'application/json');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed && parsed.action === 'replace_week_plan' && parsed.data) {
          const count = await importPlanJSON(parsed.data);
          setImportStatus(
            isAr
              ? `✓ تم استيراد خطة أسبوعية بالذكاء الاصطناعي بنجاح (${count} فترات زمنية)!`
              : `✓ Successfully imported AI Weekly Plan (${count} scheduled slots)!`
          );
        } else {
          const dataToImport = parsed.data || parsed;
          const count = await importBackupData(dataToImport);
          setImportStatus(
            isAr
              ? `✓ تم استعادة ومزامنة ${count} عنصر بنجاح عبر كافة وحدات مساحة العمل السحابية!`
              : `✓ Successfully restored and synced ${count} items across all workspace collections in Firestore!`
          );
        }
      } catch (err: any) {
        setImportError(isAr ? `فشل الاستيراد: صيغة الملف غير صالحة (${err.message})` : `Failed to import JSON: ${err.message}`);
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError(isAr ? 'فشل قراءة الملف.' : 'Failed to read file.');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (confirmResetText.toLowerCase() !== 'reset') return;
    setIsResetting(true);
    setResetSuccess(false);
    try {
      await clearAllDataFromFirestore();
      setResetSuccess(true);
      setConfirmResetText('');
      onDataReset();
    } catch (err: any) {
      alert(`Error cleaning data: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExecuteStartClean = async (mode: 'performance' | 'complete') => {
    setIsStartingClean(true);
    setStartCleanSuccessMessage(null);
    try {
      if (mode === 'performance') {
        const res = await startCleanFreshPerformance({
          uncompleteTasks: true,
          clearSleepHistory: true,
          clearFocusHistory: true,
          clearDailyBlocksHistory: true,
        });
        soundManager.play('celebrate');
        setStartCleanSuccessMessage(
          isAr
            ? `✓ تم تصفير سجلات الأداء بنجاح وبدء الحساب النظيف من اليوم (${res.cleanStartDate})! تم تصفير ${res.habitsResetCount} عادة مع الاحتفاظ بكامل القواعد والمشاريع.`
            : `✓ Performance records reset successfully! Kept all ${res.habitsResetCount} habits and frameworks intact, starting clean from today (${res.cleanStartDate}).`
        );
      } else {
        const deleted = await completeCleanWipe();
        if (typeof window !== 'undefined') {
          localStorage.setItem('app_life_phases_v1', JSON.stringify([]));
          localStorage.setItem('app_milestone_rewards_v1', JSON.stringify([]));
          localStorage.setItem('app_active_phase_id', '');
          localStorage.removeItem('core_daily_focus_telemetry');
        }
        soundManager.play('celebrate');
        setStartCleanSuccessMessage(
          isAr
            ? `✓ تم بدء نسخة جديدة فارغة بالكامل بنجاح (${deleted} عنصر تم مسحه). مساحة العمل الآن صفحة بيضاء نظيفة 100% بدون أي نماذج مسبقة لتسجيل وحساب كل شيء بنفسك.`
            : `✓ Fresh clean version started successfully! Wiped ${deleted} items. The workspace is a 100% blank canvas with zero sample data.`
        );
      }
      onDataReset();
      setShowStartCleanModal(false);
      setCleanConfirmWord('');
    } catch (err: any) {
      console.error('Failed to start clean:', err);
      alert(`Error starting clean: ${err.message}`);
    } finally {
      setIsStartingClean(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 px-1 sm:px-4 space-y-6 animate-fadeIn" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Title */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-800 text-[#34D399] flex items-center justify-center shrink-0 shadow-2xs">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#2F3437] dark:text-[#F3F4F6]">
              {isAr ? 'مركز التحكم والإعدادات' : 'Control Center & Settings'}
            </h2>
            <p className="text-xs text-[#787774] dark:text-neutral-400">
              {isAr ? 'تخصيص الهوية، التحكم بالميزات المضافة، المؤثرات الصوتية، وإدارة البيانات.' : 'Manage profile, feature customizer, synthesizer audio, apps navigation, and cloud sync.'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-neutral-50 dark:bg-[#1E2025] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
          title={isAr ? 'تبديل المظهر (ليلي / نهاري)' : 'Toggle Dark / Light Theme'}
        >
          {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
        </button>
      </div>

      {/* User Account & Ownership Card (Moved from Sidebar as requested) */}
      {currentUser && (
        <div className="bg-white dark:bg-[#18191D] border border-emerald-500/30 dark:border-emerald-500/20 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-neutral-950 font-black text-base flex items-center justify-center shrink-0 shadow-xs">
              {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-[#2D3136] dark:text-[#F3F4F6] truncate font-mono">
                  {currentUser.email}
                </p>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {currentUser.email?.toLowerCase() === DEFAULT_OWNER_EMAIL.toLowerCase()
                    ? (isAr ? 'المالك الأساسي' : 'Primary Owner')
                    : (isAr ? 'شريك مصرح له' : 'Collaborator')}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {currentUser.email?.toLowerCase() === DEFAULT_OWNER_EMAIL.toLowerCase()
                  ? (isAr ? 'حسابك هو المالك المعتمد لكافة قواعد البيانات وتخصيصات المنظومة.' : 'Your account is the primary verified owner of all workspace databases.')
                  : (isAr ? 'حساب مصرح له بالوصول والمزامنة الحية.' : 'Authorized collaborator with live database sync.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('access')}
              className="px-3.5 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-neutral-50 dark:bg-[#1E2025] hover:bg-neutral-100 dark:hover:bg-[#252830] text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>{isAr ? 'إدارة المشاركين' : 'Manage Access'}</span>
            </button>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-3xs"
                title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
              >
                <LogOut size={13} className="text-rose-500" />
                <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tab Selection Column */}
        <div className="md:col-span-1 flex flex-col gap-1.5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer shadow-2xs ${
              activeTab === 'profile'
                ? 'bg-[#2F3437] text-white dark:bg-white dark:text-neutral-900'
                : 'bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] text-[#5A5955] dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1E2025]'
            }`}
          >
            <User size={15} />
            <span>{isAr ? 'الملف الشخصي' : 'Profile'}</span>
          </button>

          <button
            onClick={() => setActiveTab('access')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer shadow-2xs ${
              activeTab === 'access'
                ? 'bg-emerald-500 text-[#1F2327] dark:bg-emerald-400 dark:text-neutral-900 font-extrabold shadow-sm'
                : 'bg-white dark:bg-[#18191D] border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
            }`}
          >
            <ShieldCheck size={15} className="text-emerald-500" />
            <span>{isAr ? 'الوصول والمشاركون' : 'Access & Collaborators'}</span>
          </button>

          <button
            onClick={() => setActiveTab('customization')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer shadow-2xs ${
              activeTab === 'customization'
                ? 'bg-indigo-600 text-white dark:bg-indigo-600 dark:text-white'
                : 'bg-white dark:bg-[#18191D] border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-[#1E2025]'
            }`}
          >
            <Sliders size={15} className="text-indigo-500" />
            <span>{isAr ? 'تخصيص وحذف الميزات' : 'Feature Controls & Customizer'}</span>
          </button>

          <button
            onClick={() => setActiveTab('apps')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer shadow-2xs ${
              activeTab === 'apps'
                ? 'bg-[#2F3437] text-white dark:bg-white dark:text-neutral-900'
                : 'bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] text-[#5A5955] dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1E2025]'
            }`}
          >
            <Grid size={15} />
            <span>{isAr ? 'تنظيم التطبيقات والأقسام' : 'Apps & Navigation'}</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer shadow-2xs ${
              activeTab === 'preferences'
                ? 'bg-[#2F3437] text-white dark:bg-white dark:text-neutral-900'
                : 'bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] text-[#5A5955] dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1E2025]'
            }`}
          >
            <Globe size={15} />
            <span>{isAr ? 'التفضيلات والمظهر' : 'Preferences'}</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer shadow-2xs ${
              activeTab === 'data'
                ? 'bg-[#2F3437] text-white dark:bg-white dark:text-neutral-900'
                : 'bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] text-[#5A5955] dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1E2025]'
            }`}
          >
            <Database size={15} />
            <span>{isAr ? 'إدارة البيانات والبداية النظيفة (Start Clean)' : 'Data & Start Clean'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer shadow-2xs ${
              activeTab === 'ai'
                ? 'bg-[#2F3437] text-white dark:bg-white dark:text-neutral-900'
                : 'bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] text-[#5A5955] dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1E2025]'
            }`}
          >
            <Key size={15} />
            <span>{isAr ? 'تهيئة الذكاء الاصطناعي' : 'AI Configuration'}</span>
          </button>
        </div>

        {/* Form Content Column */}
        <div className="md:col-span-3 bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] p-5 sm:p-6 rounded-2xl shadow-xs">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h3 className="text-sm font-bold text-[#2F3437] dark:text-[#F3F4F6] border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-2 flex items-center gap-2">
                <User size={16} className="text-[#34D399]" />
                {isAr ? 'إعدادات هوية المستخدم' : 'Identity Settings'}
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D3136] dark:text-neutral-200">
                  {isAr ? 'الاسم الشخصي' : 'Your Name'}
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder={isAr ? 'ادخل اسمك هنا ليتمكن Atlas من التعرف عليك...' : 'Enter your name so Atlas knows who you are...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE9E6] dark:border-neutral-800 bg-neutral-50 dark:bg-[#1E2025] text-xs font-medium text-[#2D3136] dark:text-white focus:outline-none focus:border-[#34D399]"
                />
                <p className="text-[10px] text-[#787774] dark:text-neutral-400">
                  {isAr 
                    ? 'سيخاطبك مستشار الذكاء الاصطناعي (Atlas) بهذا الاسم مباشرة لتخصيص خطط عملك والحديث معك.'
                    : 'The AI Mentor (Atlas) will refer to you by this name to customize your session plans and conversations.'}
                </p>
              </div>

              {showProfileSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-900/40">
                  {isAr ? '✓ تم حفظ الاسم بنجاح!' : '✓ Name successfully saved!'}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2F3437] text-white hover:bg-black dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  {isAr ? 'حفظ الاسم' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

          {/* ACCESS & COLLABORATORS TAB */}
          {activeTab === 'access' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span>{isAr ? 'إدارة الوصول والمشاركون في المنظومة' : 'Access & Workspace Collaborators'}</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Firebase Cloud
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isAr
                    ? 'التحكم في الحسابات المصرح لها برؤية ومزامنة كافة بيانات المنظومة الحية.'
                    : 'Control authorized accounts allowed to view and sync all live workspace data.'}
                </p>
              </div>

              {/* Section 1: Connected Account Card */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1E2025] border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <User size={14} className="text-emerald-500" />
                    {isAr ? 'الحساب الحالي المتصل:' : 'Current Connected Account:'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {currentUser?.email?.toLowerCase() === DEFAULT_OWNER_EMAIL.toLowerCase()
                      ? (isAr ? 'المالك الأساسي' : 'Primary Owner')
                      : (isAr ? 'شريك مصرح له' : 'Collaborator')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-neutral-950 font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {currentUser?.email || (isAr ? 'غير مسجل' : 'Not signed in')}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {currentUser?.providerData?.[0]?.providerId === 'google.com'
                          ? (isAr ? 'متصل عبر Google Account' : 'Connected via Google Account')
                          : (isAr ? 'متصل بالبريد وكلمة المرور' : 'Connected via Email & Password')}
                      </p>
                    </div>
                  </div>

                  {onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-xs font-bold text-rose-700 dark:text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center shadow-3xs"
                    >
                      <LogOut size={13} className="text-rose-500" />
                      <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 2: Add Collaborator Form */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1E2025] border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Users size={15} className="text-emerald-500" />
                    <span>{isAr ? 'إضافة شريك جديد لرؤية المنظومة' : 'Add Collaborator to View Everything'}</span>
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isAr
                      ? 'أدخل البريد الإلكتروني للشخص الذي تريده أن يرى كافة المهام والعادات والخطط الأسبوعية والتحليلات.'
                      : 'Enter the email address of the person you want to see all your tasks, habits, weekly plans, and metrics.'}
                  </p>
                </div>

                <form onSubmit={handleAddCollaboratorSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Mail size={14} className="absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="email"
                      required
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                      placeholder={isAr ? 'partner@gmail.com أو زميل العمل...' : 'partner@gmail.com or colleague...'}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191D] text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingCollaborator || !newCollaboratorEmail.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#1F2327] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Plus size={14} />
                    <span>{isAr ? 'إضافة الشريك' : 'Add Collaborator'}</span>
                  </button>
                </form>

                {collaboratorFeedback && (
                  <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                    collaboratorFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
                  }`}>
                    {collaboratorFeedback.type === 'success' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-rose-500" />}
                    <span>{collaboratorFeedback.text}</span>
                  </div>
                )}

                {/* Whitelisted Emails List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    {isAr ? 'قائمة الحسابات المصرح لها بالدخول:' : 'Authorized Accounts List:'}
                  </span>

                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-[#18191D]">
                    {(accessControl?.allowedEmails || [DEFAULT_OWNER_EMAIL]).map((emailItem) => {
                      const isOwner = emailItem.toLowerCase() === DEFAULT_OWNER_EMAIL.toLowerCase();
                      return (
                        <div key={emailItem} className="p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isOwner ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                            }`}>
                              {emailItem.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                {emailItem}
                              </p>
                              <p className="text-[10px] text-neutral-400">
                                {isOwner 
                                  ? (isAr ? 'المالك الأساسي (دائم)' : 'Permanent Master Owner')
                                  : (isAr ? 'شريك مصرح له بالاطلاع والمزامنة' : 'Authorized Collaborator')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOwner 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700'
                            }`}>
                              {isOwner ? (isAr ? 'المالك' : 'Owner') : (isAr ? 'شريك' : 'Collaborator')}
                            </span>

                            {!isOwner && onRemoveCollaborator && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCollaboratorClick(emailItem)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                title={isAr ? 'إزالة الشريك' : 'Remove collaborator'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMIZATION & FEATURE CONTROLS TAB */}
          {activeTab === 'customization' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Sliders size={16} className="text-indigo-600" />
                    <span>{isAr ? 'التحكم الكامل وتخصيص الميزات المضافة' : 'Feature Customizer & Control Center'}</span>
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {isAr 
                    ? 'لك كامل الحرية في تعديل، تفعيل، أو حذف أي ميزة أو إعداد مسبق، بما فيها مراحل التركيز، متجر الجوائز، روتينات الأوقات، المؤثرات الصوتية، والبطاقات.' 
                    : 'Full granular control to edit, toggle, customize, or delete any added feature or preset (Life Phases, Rewards, Routines, Audio Synthesizer, and Widgets).'}
                </p>
              </div>

              {customSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" />
                  <span>{customSuccessMessage}</span>
                </div>
              )}

              {/* 0. MODULE MASTER CONTROLS & LIFECYCLE DEACTIVATION */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <span>{isAr ? 'التحكم في الميزات ودورة الاستخدام (Module Lifecycle)' : 'Feature Lifecycle & Deactivation Engine'}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {isAr ? 'بدون تأثير سلبي' : 'Zero Penalty'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-xl leading-relaxed">
                        {isAr
                          ? 'إذا لم ترغب في استخدام أي ميزة في أي وقت، يمكنك إيقافها هنا: ستختفي تماماً ولن تُحسب أو تؤثر سلباً على تقييمك (كأنها غير موجودة). وعند الرجوع لتفعيلها ستعمل من جديد مع حفظ كافة بياناتك وسجل الفترات التي استخدمتها أو توقفت فيها.'
                          : 'Turn off any feature you don\'t use: it will disappear, not count, and not affect your score (as if it doesn\'t exist). When re-enabled, it resumes seamlessly with full history of when you worked with it.'}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono font-bold text-neutral-500">
                    {ALL_CONTROLLABLE_MODULES.length - disabledModules.length}/{ALL_CONTROLLABLE_MODULES.length} {isAr ? 'ميزة نشطة' : 'active'}
                  </div>
                </div>

                {/* Modules Switcher Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {ALL_CONTROLLABLE_MODULES.map((mod) => {
                    const isDisabled = disabledModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2 text-xs ${
                          isDisabled
                            ? 'bg-neutral-100/70 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                            : 'bg-white dark:bg-[#18191D] border-[#EAE9E6] dark:border-[#2A2C33] shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-base">{mod.icon}</span>
                              <span className={`font-bold truncate ${isDisabled ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-white'}`}>
                                {isAr ? mod.nameAr : mod.nameEn}
                              </span>
                            </div>

                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                !isDisabled
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                              }`}
                            >
                              {!isDisabled ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'مستبعدة' : 'Paused')}
                            </span>
                          </div>

                          <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">
                            {isAr ? mod.descriptionAr : mod.descriptionEn}
                          </p>
                        </div>

                        <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                          <span className="text-[9px] text-neutral-400 font-mono">
                            {!isDisabled ? (isAr ? 'تُحسب في النتائج' : 'Included in stats') : (isAr ? 'مستبعدة من الحسابات' : 'Zero impact')}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleModuleLifecycle(mod.id)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                              !isDisabled
                                ? 'bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-600 dark:bg-neutral-800 dark:hover:bg-rose-950/40 dark:text-neutral-300 dark:hover:text-rose-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            }`}
                          >
                            {!isDisabled ? (isAr ? 'إيقاف وتعطيل' : 'Deactivate') : (isAr ? 'إعادة التفعيل' : 'Activate')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Historical Lifecycle Audit Timeline */}
                <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80 space-y-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <History size={13} className="text-indigo-500" />
                    <span>{isAr ? 'سجل فترات التشغيل والتوقف (Lifecycle Audit History):' : 'Historical Feature Usage Periods Log:'}</span>
                  </h5>

                  {lifecycleHistory.length === 0 ? (
                    <p className="text-[11px] text-neutral-400 italic">
                      {isAr
                        ? 'كافة الميزات تعمل حالياً في وضعها النشط المستمر بدون فترات توقف سابقة.'
                        : 'All modules are currently running continuously on active lifecycle without logged pauses.'}
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {lifecycleHistory.slice(0, 15).map((evt, idx) => {
                        const isEvtActive = evt.status === 'enabled';
                        const modDef = ALL_CONTROLLABLE_MODULES.find(m => m.id === evt.moduleId);
                        const dateFormatted = new Date(evt.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div
                            key={evt.id || idx}
                            className="p-2 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm">{modDef?.icon || '⚙️'}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-neutral-900 dark:text-white truncate">
                                    {isAr ? (modDef?.nameAr || evt.moduleName) : (modDef?.nameEn || evt.moduleName)}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      isEvtActive
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}
                                  >
                                    {isEvtActive ? (isAr ? 'تم التفعيل / قيد العمل' : 'Activated') : (isAr ? 'تم الإيقاف والتجميد' : 'Deactivated')}
                                  </span>
                                </div>
                                {evt.reason && (
                                  <span className="text-[10px] text-neutral-400 block truncate">
                                    {evt.reason}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                              {dateFormatted}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 1. SYNTHESIZER AUDIO & SOUND CUES */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Music size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        {isAr ? 'المؤثرات الصوتية التوليدية (Web Audio)' : 'Web Audio Synthesizer & Sound Cues'}
                      </h4>
                      <p className="text-[10px] text-neutral-500">
                        {isAr ? 'أصوات تشجيعية عند إنجاز العادات والمهام وفك الجوائز' : 'Crisp audio chime feedback for checkoffs, streaks, and milestones'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs ${
                      soundEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                    <span>{soundEnabled ? (isAr ? 'الأصوات مفعلة' : 'Sound Enabled') : (isAr ? 'مكتوم' : 'Muted')}</span>
                  </button>
                </div>

                {soundEnabled && (
                  <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-neutral-600 dark:text-neutral-400">{isAr ? 'مستوى الصوت:' : 'Master Volume:'}</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{Math.round(soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />

                    {/* Test Sound Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-neutral-400 self-center font-bold">
                        {isAr ? 'اختبار النغمات:' : 'Test Cues:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => soundManager.playCheck()}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-indigo-500 cursor-pointer"
                      >
                        🔔 {isAr ? 'نغمة الإنجاز' : 'Check Bell'}
                      </button>
                      <button
                        type="button"
                        onClick={() => soundManager.playStreak()}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 cursor-pointer"
                      >
                        🔥 {isAr ? 'نغمة السلسلة' : 'Streak Chime'}
                      </button>
                      <button
                        type="button"
                        onClick={() => soundManager.playRoutineComplete()}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 cursor-pointer"
                      >
                        ⚡ {isAr ? 'نغمة الروتين' : 'Routine Fanfare'}
                      </button>
                      <button
                        type="button"
                        onClick={() => soundManager.playFreeze()}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 cursor-pointer"
                      >
                        ❄️ {isAr ? 'نغمة التجميد' : 'Freeze Shimmer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => soundManager.playRewardClaim()}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-purple-500 cursor-pointer"
                      >
                        🎉 {isAr ? 'نغمة الجائزة' : 'Reward Fanfare'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. MASTER SYSTEM TRACKING & CALCULATION CONTROLS */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      systemTrackingActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    }`}>
                      <Activity size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        {isAr ? 'حالة تتبع وحساب النظام الشامل' : 'Master System Tracking & Calculation'}
                      </h4>
                      <p className="text-[10px] text-neutral-500">
                        {systemTrackingActive
                          ? (isAr
                              ? `🟢 النظام نشط ويحسب كافة الأرقام • منذ: ${systemActivatedAt ? new Date(systemActivatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : 'الآن'}`
                              : `🟢 System Active & Counting • Since: ${systemActivatedAt ? new Date(systemActivatedAt).toLocaleDateString() : 'Now'}`)
                          : (isAr ? '⏸️ النظام متوقف حالياً ولن يقوم بحساب أي أرقام أو سلاسل' : '⏸️ Master System Deactivated — Number Counting Suspended')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !systemTrackingActive;
                      setSystemTrackingActive(next);
                      setSystemTrackingActiveState(next);
                      setSystemActivatedAt(Date.now());
                      triggerCustomNotification(
                        next
                          ? (isAr ? '✓ تم تفعيل النظام بنجاح! يبدأ احتساب الأرقام والسلاسل من الآن.' : '✓ System tracking activated! Counting resumes freshly from this point.')
                          : (isAr ? '✓ تم تعطيل النظام بالكامل. تم إيقاف احتساب وتراكم الأرقام.' : '✓ Master system deactivated. All number counting and telemetry suspended.')
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs ${
                      systemTrackingActive
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {systemTrackingActive ? (
                      <>
                        <Ban size={13} />
                        <span>{isAr ? 'تعطيل النظام وإيقاف الحساب' : 'Deactivate System'}</span>
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        <span>{isAr ? 'تفعيل النظام وبدء الحساب' : 'Activate & Start Counting'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  systemTrackingActive
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-900 dark:text-rose-200'
                }`}>
                  <p className="font-bold text-[11px] mb-0.5">
                    {systemTrackingActive
                      ? (isAr ? 'النظام في وضع العمل التام' : 'System is Actively Counting')
                      : (isAr ? 'النظام معطل (حالة السكون الكامل)' : 'System Deactivated (Zero Telemetry)')}
                  </p>
                  <p className="text-[10px] opacity-90">
                    {systemTrackingActive
                      ? (isAr
                          ? 'يقوم النظام بحساب السلاسل (Streaks)، أوقات التركيز، إنجازات المهام، والتحليلات البيانية بشكل فوري وتراكمي.'
                          : 'The system is tracking streaks, focus sessions, task completions, and analytics continuously.')
                      : (isAr
                          ? 'عند تعطيل النظام، يتوقف احتساب كافة الأرقام والسلاسل عبر كامل التطبيق. وعند إعادة تفعيله، يتم الحساب فعلياً من نقطة التفعيل الجديدة دون أي أخطاء أو تراكمات غير مرغوبة.'
                          : 'When deactivated, all counting stops across the entire OS. Once reactivated, tracking starts freshly and counts forward from that exact activation moment.')}
                  </p>
                </div>
              </div>

              {/* 3. MILESTONE REWARDS CONTROLS */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        {isAr ? 'متجر المكافآت والجوائز التحفيزية' : 'Milestone Rewards & Treat Vault'}
                      </h4>
                      <p className="text-[10px] text-neutral-500">
                        {isAr ? `${rewards.length} مكافأة مسجلة • تحكم بحرية كاملة في إضافة، تعديل أو مسح المكافآت` : `${rewards.length} milestone rewards configured`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onResetRewards && (
                      <button
                        type="button"
                        onClick={() => {
                          onResetRewards();
                          triggerCustomNotification(isAr ? 'تمت استعادة المكافآت الافتراضية بنجاح!' : 'Default rewards restored!');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-amber-600 flex items-center gap-1 cursor-pointer bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                        title={isAr ? 'استعادة المكافآت الافتراضية' : 'Reset default rewards'}
                      >
                        <RotateCcw size={11} />
                        <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
                      </button>
                    )}
                    {onClearAllRewards && rewards.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(isAr ? 'هل تريد مسح جميع المكافآت؟' : 'Clear all milestone rewards?')) {
                            onClearAllRewards();
                            triggerCustomNotification(isAr ? 'تم مسح جميع المكافآت.' : 'All rewards cleared.');
                          }
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-white dark:bg-neutral-800 rounded-lg border border-rose-200 dark:border-rose-900"
                        title={isAr ? 'مسح كافة المكافآت' : 'Clear all rewards'}
                      >
                        <Trash2 size={11} />
                        <span>{isAr ? 'مسح الكل' : 'Clear All'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Rewards Quick List */}
                <div className="space-y-1.5 pt-1">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id || reward.title}
                      className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-base">{reward.icon || '🎁'}</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-neutral-900 dark:text-white block truncate">{reward.title}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {reward.milestoneType === 'streak' ? `${reward.targetCount} days streak` : `${reward.targetCount} tasks`} • {reward.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {reward.isClaimed && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                            {isAr ? 'تم الاستلام' : 'Claimed'}
                          </span>
                        )}
                        {onDeleteReward && reward.id && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteReward(reward.id!);
                              triggerCustomNotification(isAr ? 'تم حذف المكافأة.' : 'Reward deleted.');
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-rose-600 cursor-pointer"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. CLEAR PRESET SAMPLES OPTION */}
              {onClearPresetSamples && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Trash2 size={14} className="text-amber-600" />
                    <span>{isAr ? 'تفريغ العناصر التوضيحية والبيانات المسبقة بنقرة واحدة' : 'Clear Default Demo Presets'}</span>
                  </h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                    {isAr 
                      ? 'إذا كنت ترغب بالبدء من الصفر تماماً وتفريغ النماذج الافتراضية، يمكنك الضغط هنا لإزالتها فوراً دون المساس بالإعدادات الخاصة.' 
                      : 'Wipe all pre-loaded sample items to start from a completely clean personal slate.'}
                  </p>
                  <button
                    type="button"
                    onClick={onClearPresetSamples}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-3xs"
                  >
                    {isAr ? 'مسح النماذج التجريبية والبدء من الصفر' : 'Purge Sample Presets & Start Fresh'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* APPS & CATEGORIES MANAGEMENT TAB */}
          {activeTab === 'apps' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-[#2F3437] dark:text-[#F3F4F6] flex items-center gap-2">
                    <Grid size={16} className="text-indigo-600" />
                    <span>{isAr ? 'إدارة وتخصيص التطبيقات والأقسام' : 'App Navigation & Category Manager'}</span>
                  </h3>
                  <p className="text-xs text-[#787774] dark:text-neutral-400">
                    {isAr
                      ? 'يمكنك إخفاء أو إظهار التطبيقات، إعادة ترتيبها، وإنشاء أقسام تصنيف مخصصة لفرزها في الشريط الجانبي.'
                      : 'Show/hide apps, reorder their hierarchy, and create custom categories to organize your sidebar.'}
                  </p>
                </div>

                <button
                  onClick={handleResetNavigation}
                  className="px-2.5 py-1 text-[11px] font-bold text-[#787774] dark:text-neutral-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                  title={isAr ? 'استعادة الترتيب الافتراضي' : 'Reset to default'}
                >
                  <RotateCcw size={12} />
                  <span>{isAr ? 'استعادة الافتراضي' : 'Reset'}</span>
                </button>
              </div>

              {showNavSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" />
                  <span>{isAr ? '✓ تم تحديث وحفظ ترتيب وأقسام التطبيقات بنجاح!' : '✓ App navigation layout updated and saved!'}</span>
                </div>
              )}

              {/* 1. Add New Category Section */}
              <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-3">
                <h4 className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                  <FolderPlus size={14} className="text-emerald-500" />
                  <span>{isAr ? 'إنشاء قسم جديد مخصص' : 'Create New Category'}</span>
                </h4>
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <input
                    type="text"
                    value={newCatNameEn}
                    onChange={(e) => setNewCatNameEn(e.target.value)}
                    placeholder={isAr ? 'اسم القسم (بالإنجليزية): e.g. Finance' : 'Category Name (EN): e.g. Growth & Sales'}
                    className="px-3 py-2 text-xs rounded-xl border border-[#EAE9E6] dark:border-neutral-800 bg-white dark:bg-[#18191D] text-[#2F3437] dark:text-white focus:outline-none focus:border-[#34D399]"
                  />
                  <input
                    type="text"
                    value={newCatNameAr}
                    onChange={(e) => setNewCatNameAr(e.target.value)}
                    placeholder={isAr ? 'اسم القسم (بالعربية): مثل النمو والمبيعات' : 'Category Name (AR): Optional'}
                    className="px-3 py-2 text-xs rounded-xl border border-[#EAE9E6] dark:border-neutral-800 bg-white dark:bg-[#18191D] text-[#2F3437] dark:text-white focus:outline-none focus:border-[#34D399]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    <Plus size={14} />
                    <span>{isAr ? 'إضافة القسم' : 'Add Category'}</span>
                  </button>
                </form>

                {/* Existing Categories List */}
                <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mr-1">
                    {isAr ? 'الأقسام النشطة:' : 'Active Categories:'}
                  </span>
                  {navCategories.map((cat) => {
                    const isDefault = DEFAULT_APP_CATEGORIES.some(d => d.id === cat.id);
                    return (
                      <div
                        key={cat.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] text-[11px] font-semibold text-[#2F3437] dark:text-neutral-200"
                      >
                        <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-neutral-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                            title={isAr ? 'حذف القسم' : 'Delete category'}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Apps Organization & Visibility List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center justify-between">
                  <span>{isAr ? 'قائمة التطبيقات والترتيب' : 'Apps List, Visibility & Ordering'}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    {navItems.filter(i => !i.hidden).length}/{navItems.length} {isAr ? 'تطبيق معروض' : 'apps visible'}
                  </span>
                </h4>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {navItems.map((item, index) => {
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all text-xs ${
                          item.hidden
                            ? 'bg-neutral-50/60 dark:bg-[#18191D]/40 border-[#EAE9E6] dark:border-[#2A2C33] opacity-60'
                            : 'bg-white dark:bg-[#18191D] border-[#EAE9E6] dark:border-[#2A2C33] shadow-2xs'
                        }`}
                      >
                        {/* Title & Status */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleItemVisibility(item.id)}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                              !item.hidden
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400'
                            }`}
                            title={!item.hidden ? (isAr ? 'إخفاء التطبيق من القائمة' : 'Hide app from sidebar') : (isAr ? 'إظهار التطبيق في القائمة' : 'Show app in sidebar')}
                          >
                            {!item.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <span className={`font-bold block truncate ${item.hidden ? 'text-neutral-400 line-through' : 'text-[#2F3437] dark:text-neutral-200'}`}>
                              {isAr ? item.labelAr : item.labelEn}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              #{index + 1} • {item.id}
                            </span>
                          </div>
                        </div>

                        {/* Category Selector */}
                        <div className="shrink-0 w-32 sm:w-40">
                          <select
                            value={item.category}
                            onChange={(e) => handleChangeItemCategory(item.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-[#1E2025] text-[#2F3437] dark:text-neutral-200 border border-[#EAE9E6] dark:border-neutral-800 rounded-xl text-[11px] font-semibold focus:outline-none focus:border-[#34D399] cursor-pointer"
                          >
                            {navCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {isAr ? c.nameAr : c.nameEn}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Move Up / Move Down Reordering Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, 'up')}
                            className="p-1.5 rounded-lg border border-[#EAE9E6] dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-[#282C34] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[#2F3437] dark:text-neutral-200"
                            title={isAr ? 'تحريك لأعلى' : 'Move Up'}
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={index === navItems.length - 1}
                            onClick={() => handleMoveItem(index, 'down')}
                            className="p-1.5 rounded-lg border border-[#EAE9E6] dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-[#282C34] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-[#2F3437] dark:text-neutral-200"
                            title={isAr ? 'تحريك لأسفل' : 'Move Down'}
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-[#2F3437] dark:text-[#F3F4F6] border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-2 flex items-center gap-2">
                <Globe size={16} className="text-[#34D399]" />
                {isAr ? 'تفضيلات النظام والمظهر' : 'System Preferences & Appearance'}
              </h3>

              {/* Language Selection */}
              <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <label className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-2">
                  <Globe size={15} className="text-blue-500" />
                  {isAr ? 'لغة واجهة النظام (Language)' : 'System UI Language'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      lang === 'en'
                        ? 'bg-[#2F3437] text-white border-black dark:bg-white dark:text-neutral-900'
                        : 'bg-white dark:bg-[#18191D] border-[#EAE9E6] dark:border-[#2A2C33] text-[#787774] dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#282C34]'
                    }`}
                  >
                    <span>English (EN)</span>
                    {lang === 'en' && <Check size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLang('ar')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      lang === 'ar'
                        ? 'bg-[#2F3437] text-white border-black dark:bg-white dark:text-neutral-900'
                        : 'bg-white dark:bg-[#18191D] border-[#EAE9E6] dark:border-[#2A2C33] text-[#787774] dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#282C34]'
                    }`}
                  >
                    <span>العربية (AR)</span>
                    {lang === 'ar' && <Check size={14} />}
                  </button>
                </div>
              </div>

              {/* Theme Mode Toggle */}
              <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <label className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-2">
                  {isDark ? <Moon size={15} className="text-indigo-400" /> : <Sun size={15} className="text-amber-500" />}
                  {isAr ? 'المظهر (Light / Dark Theme)' : 'Display Theme'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => !isDark || onToggleTheme()}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      !isDark
                        ? 'bg-[#2F3437] text-white border-black dark:bg-white dark:text-neutral-900'
                        : 'bg-white dark:bg-[#18191D] border-[#EAE9E6] dark:border-[#2A2C33] text-[#787774] dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#282C34]'
                    }`}
                  >
                    <Sun size={14} />
                    <span>{isAr ? 'مضيء (Light)' : 'Light Mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => isDark || onToggleTheme()}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isDark
                        ? 'bg-[#2F3437] text-white border-black dark:bg-white dark:text-neutral-900'
                        : 'bg-white dark:bg-[#18191D] border-[#EAE9E6] dark:border-[#2A2C33] text-[#787774] dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#282C34]'
                    }`}
                  >
                    <Moon size={14} />
                    <span>{isAr ? 'داكن (Dark)' : 'Dark Mode'}</span>
                  </button>
                </div>
              </div>

              {/* Compact Layout Toggle */}
              <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                    {compactLayout ? <Minimize2 size={14} className="text-indigo-500" /> : <Maximize2 size={14} className="text-indigo-500" />}
                    <span>{isAr ? 'طريقة العرض المضغوطة (Compact Density)' : 'Compact Layout Density'}</span>
                  </h4>
                  <p className="text-[10px] text-[#787774] dark:text-neutral-400 mt-0.5">
                    {isAr ? 'تقليل المسافات لعرض معلومات أكثر في الشاشة.' : 'Reduce paddings and cell heights for high information density.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleCompactLayout}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    compactLayout
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-[#18191D] border-[#EAE9E6] dark:border-[#2A2C33] text-[#2F3437] dark:text-white'
                  }`}
                >
                  {compactLayout ? (isAr ? 'مفعل' : 'Active') : (isAr ? 'معطل' : 'Disabled')}
                </button>
              </div>

              {/* Pomodoro Top Bar Timer Toggle */}
              <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                    <Timer size={14} className="text-emerald-500" />
                    <span>{isAr ? 'مؤقت بومودورو في الشريط العلوي' : 'Top Bar Pomodoro Timer'}</span>
                  </h4>
                  <p className="text-[10px] text-[#787774] dark:text-neutral-400 mt-0.5">
                    {isAr
                      ? 'إظهار أو إخفاء عداد بومودورو الحي في شريط التنقل العلوي للتطبيق.'
                      : 'Show or hide the live pomodoro timer clock in the top navigation header bar.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newVal = !topBarTimerEnabled;
                    setTopBarTimerEnabled(newVal);
                    try {
                      localStorage.setItem('pomodoro_show_top_bar_timer', String(newVal));
                      window.dispatchEvent(new Event('pomodoro_top_timer_changed'));
                    } catch {}
                    if (onToggleTopBarTimer) {
                      onToggleTopBarTimer(newVal);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    topBarTimerEnabled ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                  role="switch"
                  aria-checked={topBarTimerEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      topBarTimerEnabled ? (isAr ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Firestore Setup Guide Modal Trigger */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Database size={14} className="text-indigo-600" />
                    <span>{isAr ? 'دليل تهيئة ومزامنة قاعدة البيانات السحابية' : 'Cloud Database & Firestore Guide'}</span>
                  </h4>
                  <p className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                    {isAr ? 'إرشادات ربط الحساب والمزامنة الفورية عبر الأجهزة.' : 'Instructions on real-time sync across web and mobile.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenFirestoreGuide}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-3xs"
                >
                  {isAr ? 'عرض الدليل' : 'View Guide'}
                </button>
              </div>
            </div>
          )}

          {/* DATA MANAGEMENT TAB */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-blue-500" />
                  <h3 className="text-sm font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'مركز سلامة ونسخ البيانات الشامل' : 'Data Safety & Full Workspace Backups'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>{totalWorkspaceItems} {isAr ? 'عنصر نشط' : 'active cloud items'}</span>
                </span>
              </div>

              {/* Import status */}
              {importStatus && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900/40 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* SECTION 1: ONE-CLICK FULL WORKSPACE BACKUP */}
              <div className="p-5 bg-gradient-to-br from-[#FBFBFA] to-neutral-100 dark:from-[#242930] dark:to-[#1E2228] rounded-2xl border-2 border-blue-500/20 dark:border-blue-500/30 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-xs">
                        <Download size={16} />
                      </div>
                      <h4 className="text-sm font-bold text-[#2F3437] dark:text-white">
                        {isAr ? 'النسخ الاحتياطي الشامل بنقرة واحدة (JSON)' : 'One-Click Full Workspace Backup (JSON)'}
                      </h4>
                    </div>
                    <p className="text-xs text-[#787774] dark:text-neutral-400 leading-relaxed pt-1">
                      {isAr
                        ? 'تغليف وتنزيل كافة بيانات مساحة العمل في ملف JSON واحد يحفظ العادات، المهام، المشاريع، الملاحظات، الأهداف، القوائم، التعليقات، وجلسات التركيز لضمان عدم فقدان أي بيانات.'
                        : 'Packages and downloads your entire workspace in a single timestamped JSON file (Tasks, Habits, Notes, Projects, Goals, Checklists, Comments, and Focus History).'}
                    </p>
                  </div>
                </div>

                {/* Collections Breakdown Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-white dark:bg-[#18191D] rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between">
                    <span className="text-[#787774] dark:text-neutral-400 flex items-center gap-1.5"><CheckSquare size={13} className="text-blue-500" /> {isAr ? 'مهام' : 'Tasks'}</span>
                    <strong className="text-[#2F3437] dark:text-white font-mono">{tasks.length}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#18191D] rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between">
                    <span className="text-[#787774] dark:text-neutral-400 flex items-center gap-1.5"><Flame size={13} className="text-amber-500" /> {isAr ? 'عادات' : 'Habits'}</span>
                    <strong className="text-[#2F3437] dark:text-white font-mono">{habits.length}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#18191D] rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between">
                    <span className="text-[#787774] dark:text-neutral-400 flex items-center gap-1.5"><FolderKanban size={13} className="text-indigo-500" /> {isAr ? 'مشاريع' : 'Projects'}</span>
                    <strong className="text-[#2F3437] dark:text-white font-mono">{projects.length}</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#18191D] rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between">
                    <span className="text-[#787774] dark:text-neutral-400 flex items-center gap-1.5"><Target size={13} className="text-rose-500" /> {isAr ? 'أهداف' : 'Goals'}</span>
                    <strong className="text-[#2F3437] dark:text-white font-mono">{goals.length}</strong>
                  </div>
                </div>

                <button
                  onClick={handleExportFullWorkspaceJSON}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                >
                  <Download size={15} />
                  <span>
                    {isAr 
                      ? `تصدير النسخة الاحتياطية الكاملة (${totalWorkspaceItems} عنصر في JSON)`
                      : `Export Entire Workspace (${totalWorkspaceItems} items in JSON)`}
                  </span>
                </button>
              </div>

              {/* SECTION 2: INDIVIDUAL MODULE EXPORTS */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#787774] dark:text-neutral-400">
                  {isAr ? 'تصدير وحدات فردية مخصصة' : 'Per-Module Quick Exports'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                        <FileSpreadsheet size={14} className="text-emerald-500" />
                        {isAr ? 'العادات (CSV)' : 'Habits (CSV)'}
                      </span>
                      <p className="text-[10px] text-[#787774] dark:text-neutral-400 mt-0.5">
                        {isAr ? 'سلاسل الالتزام وسجلات الأداء لجداول البيانات.' : 'Streak histories & daily check-ins for Excel/Sheets.'}
                      </p>
                    </div>
                    <button
                      onClick={handleExportCSV}
                      className="w-full py-1.5 bg-white dark:bg-[#282C34] hover:bg-neutral-100 dark:hover:bg-[#323640] border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[#2F3437] dark:text-white"
                    >
                      <Download size={12} />
                      <span>CSV ({habits.length})</span>
                    </button>
                  </div>

                  <div className="p-3.5 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                        <FileCode size={14} className="text-blue-500" />
                        {isAr ? 'المهام (JSON)' : 'Tasks (JSON)'}
                      </span>
                      <p className="text-[10px] text-[#787774] dark:text-neutral-400 mt-0.5">
                        {isAr ? 'مصفوفة الأولويات والتواريخ والحالات.' : 'Eisenhower matrix priorities & due dates.'}
                      </p>
                    </div>
                    <button
                      onClick={handleExportTasksJSON}
                      className="w-full py-1.5 bg-white dark:bg-[#282C34] hover:bg-neutral-100 dark:hover:bg-[#323640] border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[#2F3437] dark:text-white"
                    >
                      <Download size={12} />
                      <span>Tasks JSON ({tasks.length})</span>
                    </button>
                  </div>

                  <div className="p-3.5 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-sky-500" />
                        {isAr ? 'التعليقات (JSON)' : 'Comments (JSON)'}
                      </span>
                      <p className="text-[10px] text-[#787774] dark:text-neutral-400 mt-0.5">
                        {isAr ? 'ملاحظات وتوثيق العناصر والمراجعات.' : 'Contextual notes & linked entity audit logs.'}
                      </p>
                    </div>
                    <button
                      onClick={handleExportCommentsJSON}
                      className="w-full py-1.5 bg-white dark:bg-[#282C34] hover:bg-neutral-100 dark:hover:bg-[#323640] border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[#2F3437] dark:text-white"
                    >
                      <Download size={12} />
                      <span>Comments ({comments.length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 3: IMPORT & RESTORE FLOW */}
              <div className="p-5 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                    <Upload size={14} className="text-indigo-500" />
                    {isAr ? 'أداة الاستيراد والاستعادة السريعة (JSON Restore Flow)' : 'Import & Restore Flow (JSON Workspace Recovery)'}
                  </h4>
                  <p className="text-[10px] text-[#787774] dark:text-neutral-400 mt-0.5">
                    {isAr
                      ? 'اختر ملف نسخة احتياطية سابقة لاستعادة كافة البيانات المتزامنة مباشرة إلى قاعدة بيانات Firestore.'
                      : 'Upload a previously exported full workspace backup or AI plan file to restore your entire ecosystem.'}
                  </p>
                </div>

                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#D3D1CB] dark:border-neutral-700 bg-white dark:bg-[#18191D] p-6 rounded-2xl cursor-pointer hover:border-indigo-500 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                    {isImporting ? (isAr ? 'جاري استعادة البيانات إلى السحابة...' : 'Restoring to Cloud Database...') : (isAr ? 'انقر لاختيار ملف JSON للاستعادة' : 'Click to select JSON Backup File')}
                  </span>
                  <span className="text-[10px] text-[#787774] dark:text-neutral-400">
                    {isAr ? 'يدعم النسخ الشاملة وملفات خطط الذكاء الاصطناعي' : 'Supports full workspace backups, module backups, and Atlas AI plans'}
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>

              {/* SECTION 4: START CLEAN & WORKSPACE RESET */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#787774] dark:text-neutral-400 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>{isAr ? 'البدء من جديد وإعادة التعيين الذكي (Start Clean)' : 'Start Clean & Workspace Reset'}</span>
                    </h4>
                    <p className="text-[10px] text-[#787774] dark:text-neutral-400 mt-0.5">
                      {isAr
                        ? 'اختر بين تصفير سجلات الأداء وبدء الحساب من اليوم مع الاحتفاظ بعاداتك، أو تفريغ شامل للمساحة بالكامل.'
                        : 'Choose between resetting performance logs while keeping habits as your foundation, or a full factory reset.'}
                    </p>
                  </div>
                </div>

                {startCleanSuccessMessage && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{startCleanSuccessMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* OPTION 1: KEEP HABITS, RESET PERFORMANCE & START CLEAN TODAY */}
                  <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <RotateCcw size={14} className="text-amber-600" />
                          {isAr ? 'تصفير الأداء والبدء من اليوم' : 'Reset Performance, Keep Habits'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                          {isAr ? 'مُوصى به' : 'Recommended'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1.5 leading-relaxed">
                        {isAr
                          ? `يحتفظ بكافة العادات والمشاريع والمهام كقواعد، ولكن يصفر سلاسل الالتزام والأرقام السابقة ليبدأ التطبيق حسابه من هذا اليوم بنقاء.`
                          : `Preserves your custom habits, projects, and goals, but resets streak histories and analytics to start calculating fresh from today.`}
                      </p>
                      <ul className="text-[10px] text-amber-800/70 dark:text-amber-400/80 space-y-0.5 mt-2 font-mono">
                        <li>{isAr ? '✓ تبقى العادات الـ ' + habits.length + ' كما هي' : `✓ Keeps all ${habits.length} habits intact`}</li>
                        <li>{isAr ? '✓ تصفير سلاسل الأيام وسجلات الشيك القديمة' : '✓ Clears streaks and completion history'}</li>
                        <li>{isAr ? '✓ يبدأ قياس التحليلات من تاريخ اليوم' : '✓ Starts analytics from today'}</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setStartCleanMode('performance');
                        setCleanConfirmWord('');
                        setShowStartCleanModal(true);
                      }}
                      className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Sparkles size={13} />
                      <span>{isAr ? 'ابدأ بداية نظيفة من اليوم (Start Clean)' : 'Start Clean from Today'}</span>
                    </button>
                  </div>

                  {/* OPTION 2: COMPLETE BLANK SLATE */}
                  <div className="p-4 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                          <Trash2 size={14} className="text-rose-600" />
                          {isAr ? 'بدء نسخة جديدة فارغة بالكامل' : 'Start Fresh Blank Workspace'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                          {isAr ? 'Zero Sample Data' : 'Zero Data'}
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-1.5 leading-relaxed">
                        {isAr
                          ? `يبدأ لك تطبيقاً فارغاً تماماً وخالياً من أية معلومات أو مهام أو عادات نموذجية (0 عناصر)، لتتمكن من إدخال وحساب وبناء كل شيء بنفسك من البداية.`
                          : `Starts a 100% empty workspace with zero pre-populated items, allowing you to build, calculate, and log everything yourself from scratch.`}
                      </p>
                      <ul className="text-[10px] text-rose-800/70 dark:text-rose-400/80 space-y-0.5 mt-2 font-mono">
                        <li>{isAr ? '✓ خلو تام من أي بيانات أو نماذج تجريبية' : '✓ Zero sample or demo data populated'}</li>
                        <li>{isAr ? '✓ مسح كافة المجموعات والسجلات القديمة' : '✓ Wipes all historical collections'}</li>
                        <li>{isAr ? '✓ جاهز لحسابك الخاص خطوة بخطوة' : '✓ Ready for your custom inputs from day 1'}</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setStartCleanMode('complete');
                        setCleanConfirmWord('');
                        setShowStartCleanModal(true);
                      }}
                      className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Trash2 size={13} />
                      <span>{isAr ? 'بدء نسخة جديدة فارغة (Start Clean Blank)' : 'Start Clean Blank Workspace'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* START CLEAN CONFIRMATION MODAL */}
              {showStartCleanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-3">
                      <div className="flex items-center gap-2">
                        {startCleanMode === 'performance' ? (
                          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Sparkles size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertTriangle size={16} />
                          </div>
                        )}
                        <h3 className="text-xs font-bold text-[#2F3437] dark:text-white">
                          {startCleanMode === 'performance'
                            ? (isAr ? 'تأكيد البدء النظيف وتصفير الأداء' : 'Confirm Performance Clean Start')
                            : (isAr ? 'تأكيد التفريغ الشامل لمساحة العمل' : 'Confirm Complete Workspace Wipe')}
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowStartCleanModal(false)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      {startCleanMode === 'performance' ? (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1.5 text-amber-900 dark:text-amber-200">
                          <p className="font-bold text-[11px]">
                            {isAr ? 'ما الذي سيحدث عند التأكيد؟' : 'What happens upon confirmation?'}
                          </p>
                          <p className="text-[10px] leading-relaxed">
                            {isAr
                              ? `سنحافظ على كافة العادات (${habits.length}) والمشاريع والمهام كإطار عمل جاهز، وسيتم تصفير سلاسل الالتزام (Streaks) وتاريخ الإنجازات السابقة حتى يبدأ التطبيق من اليوم بصفحة نظيفة.`
                              : `We will keep all your habits (${habits.length}), projects, and tasks intact as your framework, and reset old streak logs so tracking starts clean today.`}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-1.5 text-rose-900 dark:text-rose-200">
                          <p className="font-bold text-[11px]">
                            {isAr ? 'تحذير: إجراء لا يمكن التراجع عنه!' : 'Warning: Irreversible Action!'}
                          </p>
                          <p className="text-[10px] leading-relaxed">
                            {isAr
                              ? `سيتم مسح كافة المجموعات (${totalWorkspaceItems} عنصر) نهائياً من قاعدة بيانات Firestore ولن يتبقى أي شيء في التطبيق.`
                              : `Permanently wipes all ${totalWorkspaceItems} items from Firestore collections. Your workspace will become completely blank.`}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 block">
                          {isAr
                            ? `لتأكيد العملية، اكتب "${startCleanMode === 'performance' ? 'clean أو نعم' : 'reset أو مسح'}" أو اضغط زر التعبئة السريعة:`
                            : `To confirm, type "${startCleanMode === 'performance' ? 'clean' : 'reset'}" below:`}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cleanConfirmWord}
                            onChange={(e) => setCleanConfirmWord(e.target.value)}
                            placeholder={startCleanMode === 'performance' ? (isAr ? 'اكتب clean أو نعم' : 'clean') : (isAr ? 'اكتب reset أو مسح' : 'reset')}
                            className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202228] text-xs font-mono text-[#2F3437] dark:text-white focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setCleanConfirmWord(startCleanMode === 'performance' ? 'clean' : 'reset')}
                            className="px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 cursor-pointer shrink-0"
                          >
                            {isAr ? 'تأكيد تلقائي' : 'Quick Fill'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE9E6] dark:border-[#2A2C33]">
                      <button
                        type="button"
                        onClick={() => setShowStartCleanModal(false)}
                        className="px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 cursor-pointer"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExecuteStartClean(startCleanMode)}
                        disabled={
                          isStartingClean ||
                          !(
                            startCleanMode === 'performance'
                              ? ['clean', 'نعم', 'بدء', 'start'].includes(cleanConfirmWord.trim().toLowerCase())
                              : ['reset', 'مسح', 'نعم', 'clean'].includes(cleanConfirmWord.trim().toLowerCase())
                          )
                        }
                        className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          startCleanMode === 'performance'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                      >
                        {isStartingClean ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                        <span>
                          {isStartingClean
                            ? (isAr ? 'جاري التنفيذ...' : 'Processing...')
                            : startCleanMode === 'performance'
                            ? (isAr ? 'تأكيد البدء النظيف' : 'Confirm Start Clean')
                            : (isAr ? 'تأكيد المسح الشامل' : 'Confirm Complete Wipe')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI CONFIGURATION TAB */}
          {activeTab === 'ai' && (
            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <h3 className="text-sm font-bold text-[#2F3437] dark:text-white border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-2 flex items-center gap-2">
                <Key size={16} className="text-[#34D399]" />
                {isAr ? 'مستشار الذكاء الاصطناعي (أطلس)' : 'Gemini AI Integration (Atlas)'}
              </h3>

              {/* Secure Integration Notice */}
              <div className="p-3.5 bg-[#34D399]/10 text-emerald-800 dark:text-[#34D399] rounded-xl border border-[#34D399]/30 text-xs space-y-1">
                <p className="font-bold">
                  {isAr ? '✓ ربط آمن عبر خادم المزامنة المدمج' : '✓ Secure Server-side Proxy Active'}
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {isAr 
                    ? 'يتم تغذية أطلس بمفتاح الـ API المعتمد في بيئة عمل Google AI Studio تلقائياً من الخادم الخلفي الآمن. يمكنك بدء المحادثة فوراً دون الحاجة لإدخال أي بيانات أو مفاتيح يدوية.' 
                    : 'Atlas is automatically powered by your secure Google AI Studio Gemini API Key from our backend proxy. You can chat with Atlas immediately without configuring any manual keys.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D3136] dark:text-neutral-200">
                  {isAr ? 'مفتاح مخصص يدوي (اختياري لتجاوز الإعدادات الافتراضية)' : 'Custom Override API Key (Optional)'}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE9E6] dark:border-neutral-800 bg-neutral-50 dark:bg-[#1E2025] text-xs font-mono text-[#2D3136] dark:text-white focus:outline-none focus:border-[#34D399]"
                />
                <p className="text-[10px] text-[#787774] dark:text-neutral-400">
                  {isAr ? 'متروك للمستخدمين المتقدمين الراغبين في استخدام مفاتيح خارجية خاصة بهم.' : 'Only needed if you explicitly wish to override the default cloud environment configuration.'}
                </p>
              </div>

              {showApiKeySuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-900/40">
                  {isAr ? '✓ تم حفظ الإعدادات المخصصة بنجاح!' : '✓ Custom configuration successfully saved!'}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2F3437] text-white hover:bg-black dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  {isAr ? 'حفظ التغييرات' : 'Save AI Config'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
