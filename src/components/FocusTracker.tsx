import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Volume2,
  VolumeX,
  Settings,
  Flame,
  ArrowRight,
  FolderKanban,
  CheckSquare,
  Sparkles,
  ChevronDown,
  X,
  BarChart3,
  Check,
  Zap,
  BookOpen,
  Target,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskItem, HabitItem, ProjectItem, FocusSession } from '../types';
import { addFocusSession } from '../services/firestoreService';
import {
  playCelebrationChime,
  playTickSound,
  playStartSound,
  playPauseSound,
  playTaskCompleteSound,
} from '../utils/focusAudio';

interface FocusTrackerProps {
  tasks: TaskItem[];
  habits?: HabitItem[];
  projects?: ProjectItem[];
  focusSessions?: FocusSession[];
  lang?: 'en' | 'ar';
  isDark?: boolean;
  timeRemaining?: number;
  setTimeRemaining?: React.Dispatch<React.SetStateAction<number>>;
  isActive?: boolean;
  setIsActive?: React.Dispatch<React.SetStateAction<boolean>>;
  timerMode?: 'focus' | 'short-break' | 'long-break';
  setTimerMode?: React.Dispatch<React.SetStateAction<'focus' | 'short-break' | 'long-break'>>;
  activeTaskId?: string | null;
  setActiveTaskId?: (id: string | null) => void;
  focusQueueIds?: string[];
  setFocusQueueIds?: React.Dispatch<React.SetStateAction<string[]>>;
  onUpdateTask?: (id: string, updates: Partial<TaskItem>) => Promise<any>;
  onAddTask?: (task: Omit<TaskItem, 'id'>) => Promise<any>;
  onNavigateAnalytics?: (tab?: 'overview' | 'habits' | 'tasks' | 'goals' | 'focus') => void;
  showTopBarTimer?: boolean;
  onToggleTopBarTimer?: (show: boolean) => void;
}

export const FocusTracker: React.FC<FocusTrackerProps> = ({
  tasks = [],
  habits = [],
  projects = [],
  focusSessions = [],
  lang = 'en',
  isDark = true,
  timeRemaining: propTimeRemaining,
  setTimeRemaining: propSetTimeRemaining,
  isActive: propIsActive,
  setIsActive: propSetIsActive,
  timerMode: propTimerMode,
  setTimerMode: propSetTimerMode,
  activeTaskId: propActiveTaskId,
  setActiveTaskId: propSetActiveTaskId,
  focusQueueIds: propFocusQueueIds,
  setFocusQueueIds: propSetFocusQueueIds,
  onUpdateTask,
  onAddTask,
  onNavigateAnalytics,
  showTopBarTimer,
  onToggleTopBarTimer,
}) => {
  const isAr = lang === 'ar';

  const [showTopBarTimerState, setShowTopBarTimerState] = useState<boolean>(() => {
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
      setShowTopBarTimerState(showTopBarTimer);
    }
  }, [showTopBarTimer]);

  // ----------------------------------------------------
  // Configurable Durations & Preferences
  // ----------------------------------------------------
  const [focusDuration, setFocusDuration] = useState<number>(() => {
    try {
      const val = localStorage.getItem('pomodoro_focus_dur');
      return val ? parseInt(val, 10) : 25;
    } catch {
      return 25;
    }
  });
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(() => {
    try {
      const val = localStorage.getItem('pomodoro_short_dur');
      return val ? parseInt(val, 10) : 5;
    } catch {
      return 5;
    }
  });
  const [longBreakDuration, setLongBreakDuration] = useState<number>(() => {
    try {
      const val = localStorage.getItem('pomodoro_long_dur');
      return val ? parseInt(val, 10) : 15;
    } catch {
      return 15;
    }
  });
  // Configurable Durations & Precise Time Daily Targets
  const [targetHours, setTargetHours] = useState<number>(() => {
    try {
      const val = localStorage.getItem('pomodoro_target_hours');
      return val !== null ? parseInt(val, 10) : 3;
    } catch {
      return 3;
    }
  });
  const [targetMinutes, setTargetMinutes] = useState<number>(() => {
    try {
      const val = localStorage.getItem('pomodoro_target_minutes');
      return val !== null ? parseInt(val, 10) : 30;
    } catch {
      return 30;
    }
  });
  const [targetWindow, setTargetWindow] = useState<string>(() => {
    try {
      return localStorage.getItem('pomodoro_target_window') || 'all-day';
    } catch {
      return 'all-day';
    }
  });
  const [dailyTargetSessions, setDailyTargetSessions] = useState<number>(() => {
    try {
      const val = localStorage.getItem('pomodoro_daily_target');
      return val ? parseInt(val, 10) : 4;
    } catch {
      return 4;
    }
  });
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pomodoro_alerts') !== 'false';
    } catch {
      return true;
    }
  });

  // Settings & Target Modal States
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showTargetModal, setShowTargetModal] = useState<boolean>(false);
  const [showRestModal, setShowRestModal] = useState<boolean>(false);

  // ----------------------------------------------------
  // Timer State Handling
  // ----------------------------------------------------
  const [localTimerMode, setLocalTimerMode] = useState<'focus' | 'short-break' | 'long-break'>('focus');
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number>(focusDuration * 60);
  const [localIsActive, setLocalIsActive] = useState<boolean>(false);
  const [localActiveTaskId, setLocalActiveTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');

  const timerMode = propTimerMode !== undefined ? propTimerMode : localTimerMode;
  const setTimerMode = propSetTimerMode !== undefined ? propSetTimerMode : setLocalTimerMode;
  const timeRemaining = propTimeRemaining !== undefined ? propTimeRemaining : localTimeRemaining;
  const setTimeRemaining = propSetTimeRemaining !== undefined ? propSetTimeRemaining : setLocalTimeRemaining;
  const isActive = propIsActive !== undefined ? propIsActive : localIsActive;
  const setIsActive = propSetIsActive !== undefined ? propSetIsActive : setLocalIsActive;
  const activeTaskId = propActiveTaskId !== undefined ? propActiveTaskId : localActiveTaskId;
  const setActiveTaskId = propSetActiveTaskId !== undefined ? propSetActiveTaskId : setLocalActiveTaskId;

  // Quick focus goal text
  const [quickGoalText, setQuickGoalText] = useState<string>('');

  // Precise timing refs
  const targetEndTimeRef = useRef<number | null>(null);
  const totalDurationRef = useRef<number>(focusDuration * 60);
  const rafIdRef = useRef<number | null>(null);

  // Sync total duration on mode/duration change
  useEffect(() => {
    let durMins = focusDuration;
    if (timerMode === 'short-break') durMins = shortBreakDuration;
    if (timerMode === 'long-break') durMins = longBreakDuration;

    totalDurationRef.current = durMins * 60;
    if (!isActive) {
      setTimeRemaining(durMins * 60);
    }
  }, [timerMode, focusDuration, shortBreakDuration, longBreakDuration]);

  // Request browser notifications permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // ----------------------------------------------------
  // Precision Timestamp Delta Timing Loop (Tab Throttling Proof)
  // ----------------------------------------------------
  useEffect(() => {
    if (isActive) {
      targetEndTimeRef.current = Date.now() + timeRemaining * 1000;

      const reconcileTimer = () => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const diffMs = targetEndTimeRef.current - now;
        const secsLeft = Math.max(0, Math.ceil(diffMs / 1000));

        setTimeRemaining(secsLeft);

        if (secsLeft <= 0) {
          targetEndTimeRef.current = null;
          handleSessionComplete();
        } else {
          rafIdRef.current = requestAnimationFrame(reconcileTimer);
        }
      };

      rafIdRef.current = requestAnimationFrame(reconcileTimer);

      const fallbackInterval = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const diffMs = targetEndTimeRef.current - Date.now();
        const secsLeft = Math.max(0, Math.ceil(diffMs / 1000));
        setTimeRemaining(secsLeft);
        if (secsLeft <= 0) {
          clearInterval(fallbackInterval);
          targetEndTimeRef.current = null;
          handleSessionComplete();
        }
      }, 500);

      return () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        clearInterval(fallbackInterval);
      };
    } else {
      targetEndTimeRef.current = null;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    }
  }, [isActive]);

  // Document Title Synchronization
  useEffect(() => {
    const mins = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const secs = (timeRemaining % 60).toString().padStart(2, '0');
    const modeLabel = timerMode === 'focus' ? (isAr ? 'تركيز' : 'Focus') : (isAr ? 'استراحة' : 'Break');

    if (isActive) {
      document.title = `(${mins}:${secs}) 🎯 ${modeLabel} - Pomodoro`;
    } else {
      document.title = `Core - Executive Habit & Workspace OS`;
    }

    return () => {
      document.title = `Core - Executive Habit & Workspace OS`;
    };
  }, [timeRemaining, isActive, timerMode, isAr]);

  // Active Task & Project Details
  const activeTask = useMemo(() => {
    if (!activeTaskId || activeTaskId === 'none') return null;
    return tasks.find((t) => t.id === activeTaskId) || null;
  }, [tasks, activeTaskId]);

  const activeProject = useMemo(() => {
    if (selectedProjectId && selectedProjectId !== 'none') {
      return projects.find((p) => p.id === selectedProjectId) || null;
    }
    if (activeTask?.linkedProjectId) {
      return projects.find((p) => p.id === activeTask.linkedProjectId) || null;
    }
    return null;
  }, [projects, selectedProjectId, activeTask]);

  // Pending Tasks filtered by selected project
  const availableTasks = useMemo(() => {
    const pending = tasks.filter((t) => !t.completed);
    if (selectedProjectId !== 'none') {
      return pending.filter((t) => t.linkedProjectId === selectedProjectId);
    }
    return pending;
  }, [tasks, selectedProjectId]);

  // Today's completed focus cycles
  const completedCyclesToday = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return focusSessions.filter(
      (s) => s.createdAt >= startOfToday.getTime() && s.type === 'focus'
    ).length;
  }, [focusSessions]);

  // Total Focus Minutes Today
  const totalMinutesToday = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return focusSessions
      .filter((s) => s.createdAt >= startOfToday.getTime() && s.type === 'focus')
      .reduce((acc, curr) => acc + (curr.duration || 0), 0);
  }, [focusSessions]);

  // Precise Time Daily Target Calculations
  const totalTargetMinutes = useMemo(() => {
    return targetHours * 60 + targetMinutes;
  }, [targetHours, targetMinutes]);

  const targetSessionsCount = useMemo(() => {
    return Math.max(1, Math.round(totalTargetMinutes / (focusDuration || 25)));
  }, [totalTargetMinutes, focusDuration]);

  const targetProgressPct = useMemo(() => {
    if (totalTargetMinutes <= 0) return 100;
    return Math.min(100, Math.round((totalMinutesToday / totalTargetMinutes) * 100));
  }, [totalMinutesToday, totalTargetMinutes]);

  const minutesRemainingToday = useMemo(() => {
    return Math.max(0, totalTargetMinutes - totalMinutesToday);
  }, [totalTargetMinutes, totalMinutesToday]);

  // ----------------------------------------------------
  // Timer Actions
  // ----------------------------------------------------
  const handleTogglePlayPause = () => {
    if (!isActive) {
      if (soundAlertsEnabled) playStartSound();
      setIsActive(true);
    } else {
      if (soundAlertsEnabled) playPauseSound();
      setIsActive(false);
    }
  };

  const handleResetTimer = () => {
    setIsActive(false);
    let durMins = focusDuration;
    if (timerMode === 'short-break') durMins = shortBreakDuration;
    if (timerMode === 'long-break') durMins = longBreakDuration;

    setTimeRemaining(durMins * 60);
    totalDurationRef.current = durMins * 60;
  };

  const handleSkipTimer = () => {
    handleSessionComplete();
  };

  const handleSelectMode = (mode: 'focus' | 'short-break' | 'long-break') => {
    setTimerMode(mode);
    setIsActive(false);

    let durMins = focusDuration;
    if (mode === 'short-break') durMins = shortBreakDuration;
    if (mode === 'long-break') durMins = longBreakDuration;

    setTimeRemaining(durMins * 60);
    totalDurationRef.current = durMins * 60;
  };

  const handleSetQuickGoal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickGoalText.trim()) return;

    if (onAddTask) {
      try {
        const newTask = await onAddTask({
          title: quickGoalText.trim(),
          priority: 'High',
          category: activeProject?.category || 'Business',
          linkedProjectId: selectedProjectId !== 'none' ? selectedProjectId : undefined,
          completed: false,
          createdAt: Date.now(),
          order: tasks.length,
          isMeasurable: true,
          targetValue: 4,
          currentValue: 0,
          unit: 'pomodoros',
        });
        if (newTask?.id) {
          setActiveTaskId(newTask.id);
          setQuickGoalText('');
        }
      } catch (err) {
        console.warn('Failed to add quick task:', err);
      }
    }
  };

  // ----------------------------------------------------
  // Session Complete Lifecycle Handler
  // ----------------------------------------------------
  const handleSessionComplete = async () => {
    setIsActive(false);

    if (soundAlertsEnabled) {
      playCelebrationChime();
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = timerMode === 'focus'
          ? (isAr ? '🎉 اكتملت دورة التركيز!' : '🎉 Pomodoro Focus Completed!')
          : (isAr ? '☕ انتهت الاستراحة، حان وقت العمل!' : '☕ Break finished, ready to sprint!');
        new Notification(title, {
          body: timerMode === 'focus'
            ? (isAr ? `أحسنت! تم تسجيل ${focusDuration} دقيقة تركيز.` : `Great job! ${focusDuration} mins logged.`)
            : (isAr ? 'استعد للبدء في جلسة التركيز التالية.' : 'Ready for your next focus session.'),
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }

    if (timerMode === 'focus') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#059669', '#3B82F6']
      });

      const sessionDurationMins = Math.round(totalDurationRef.current / 60) || focusDuration;

      // 1. Log to Firestore
      try {
        await addFocusSession({
          title: activeTask?.title || quickGoalText || (isAr ? 'جلسة تركيز بومودورو' : 'Pomodoro Focus Session'),
          duration: sessionDurationMins,
          type: 'focus',
          associatedType: activeTask ? 'task' : (activeProject ? 'project' : 'none'),
          associatedId: activeTask?.id || activeProject?.id,
          associatedTitle: activeTask?.title || activeProject?.title || quickGoalText,
          createdAt: Date.now(),
        });
      } catch (err) {
        console.warn('Error saving focus session:', err);
      }

      // 2. Increment Task Progress
      if (activeTask?.id && onUpdateTask) {
        try {
          const currentFocused = activeTask.focusedMinutes || 0;
          const currentVal = activeTask.currentValue || 0;
          await onUpdateTask(activeTask.id, {
            focusedMinutes: currentFocused + sessionDurationMins,
            currentValue: activeTask.isMeasurable ? currentVal + 1 : currentVal,
          });
        } catch (err) {
          console.warn('Error updating task focus minutes:', err);
        }
      }

      setShowRestModal(true);
    } else {
      setTimerMode('focus');
      setTimeRemaining(focusDuration * 60);
      totalDurationRef.current = focusDuration * 60;
    }
  };

  // Math for Circular Dial
  const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
  const seconds = (timeRemaining % 60).toString().padStart(2, '0');
  const totalSecs = totalDurationRef.current || 25 * 60;
  const progressRatio = Math.max(0, Math.min(1, (totalSecs - timeRemaining) / totalSecs));
  
  // Circumference for r=100 in 230x230 viewBox: 2 * Math.PI * 100 = 628.31
  const strokeDashoffset = 628.31 - 628.31 * progressRatio;

  return (
    <div 
      className="w-full h-full max-w-6xl mx-auto flex flex-col justify-between py-1 sm:py-2 px-1 sm:px-3 text-neutral-900 dark:text-neutral-100 font-sans select-none animate-fadeIn overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ----------------------------------------------------
          TOP HEADER BAR (Brand Green & Ultra Compact)
          ---------------------------------------------------- */}
      <header className="w-full flex items-center justify-between gap-3 pb-2 border-b border-neutral-200/80 dark:border-neutral-800/80 shrink-0">
        {/* Left: Brand Green Pomodoro Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-2xs">
            <Timer size={17} className={isActive ? 'animate-pulse text-emerald-500' : ''} />
          </div>

          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight leading-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span>{isAr ? 'مؤقت بومودورو' : 'Pomodoro Workspace'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs shadow-emerald-500/50" />
            </h1>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {isAr ? 'بيئة التركيز المباشرة والانضباط' : 'Executive deep focus & velocity stage'}
            </p>
          </div>
        </div>

        {/* Right: Sound Alert, Statistics & Settings */}
        <div className="flex items-center gap-1.5">
          {/* Sound Alarm Toggle */}
          <button
            type="button"
            onClick={() => setSoundAlertsEnabled(!soundAlertsEnabled)}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
              soundAlertsEnabled
                ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400'
            }`}
            title={soundAlertsEnabled ? (isAr ? 'التنبيهات مفعلة' : 'Sound Enabled') : (isAr ? 'مكتوم' : 'Muted')}
          >
            {soundAlertsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Statistics Button */}
          {onNavigateAnalytics && (
            <button
              type="button"
              onClick={() => onNavigateAnalytics('focus')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              title={isAr ? 'عرض الإحصائيات' : 'Open Focus Telemetry'}
            >
              <BarChart3 size={14} className="text-emerald-500" />
              <span className="hidden sm:inline text-[11px]">{isAr ? 'الإحصائيات' : 'Telemetry'}</span>
            </button>
          )}

          {/* Settings Cog */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 sm:p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer transition-all active:scale-95 shadow-2xs"
            title={isAr ? 'إعدادات المؤقت' : 'Timer Settings'}
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* ----------------------------------------------------
          MAIN EXECUTIVE WORKSPACE (2 Columns on md+, 100% Zero Scroll)
          ---------------------------------------------------- */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 my-auto py-2 items-center overflow-hidden">
        
        {/* ====================================================
            LEFT PANEL: Hero Stage & Control Dial (md:col-span-5)
            ==================================================== */}
        <div className="md:col-span-5 bg-white dark:bg-[#181A20] border border-neutral-200/90 dark:border-neutral-800/90 rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-between shadow-xs h-full min-h-[320px] max-h-[460px]">
          
          {/* 1. Mode Selector Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/80 p-1 rounded-2xl shadow-2xs w-full justify-center shrink-0">
            <button
              type="button"
              onClick={() => handleSelectMode('focus')}
              className={`flex-1 py-1 sm:py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                timerMode === 'focus'
                  ? 'bg-emerald-500 text-white dark:text-neutral-950 shadow-xs shadow-emerald-500/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {isAr ? 'تركيز' : 'Focus'}
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('short-break')}
              className={`flex-1 py-1 sm:py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                timerMode === 'short-break'
                  ? 'bg-sky-500 text-white dark:text-neutral-950 shadow-xs shadow-sky-500/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {isAr ? 'استراحة قصيرة' : 'Short Break'}
            </button>

            <button
              type="button"
              onClick={() => handleSelectMode('long-break')}
              className={`flex-1 py-1 sm:py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                timerMode === 'long-break'
                  ? 'bg-indigo-500 text-white dark:text-neutral-950 shadow-xs shadow-indigo-500/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {isAr ? 'استراحة طويلة' : 'Long Break'}
            </button>
          </div>

          {/* 2. Hero Circular Ring with Emerald Accent */}
          <div className="relative flex items-center justify-center my-auto py-1">
            <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-neutral-50 dark:bg-neutral-900/90 border-4 border-neutral-200/80 dark:border-neutral-800/90 shadow-xl relative flex flex-col items-center justify-center">
              
              {/* SVG Ring */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 230 230">
                <circle
                  cx="115"
                  cy="115"
                  r="100"
                  className="stroke-neutral-200 dark:stroke-neutral-800/80"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="115"
                  cy="115"
                  r="100"
                  stroke={
                    timerMode === 'short-break'
                      ? '#0EA5E9'
                      : timerMode === 'long-break'
                      ? '#6366F1'
                      : '#10B981'
                  }
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray="628.31"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                  style={{
                    filter: isActive ? `drop-shadow(0px 0px 8px ${timerMode === 'short-break' ? 'rgba(14,165,233,0.5)' : timerMode === 'long-break' ? 'rgba(99,102,241,0.5)' : 'rgba(16,185,129,0.6)'})` : 'none',
                  }}
                />
              </svg>

              {/* Digits Display */}
              <div className="flex flex-col items-center justify-center z-10 select-none">
                <div className="font-mono text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-none tabular-nums drop-shadow-2xs">
                  {minutes}:{seconds}
                </div>

                {/* Subtitle Badge */}
                <div className="mt-2">
                  <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${
                    timerMode === 'short-break'
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                      : timerMode === 'long-break'
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}>
                    {timerMode === 'focus' ? (isAr ? 'تركيز موجه' : 'DEEP FOCUS') : (isAr ? 'استراحة' : 'REST BREAK')}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Primary Controls Trio (Reset / Big Play / Skip) */}
          <div className="flex items-center justify-center gap-3 shrink-0 pt-1">
            {/* Reset */}
            <button
              type="button"
              onClick={handleResetTimer}
              className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-2xs"
              title={isAr ? 'إعادة ضبط' : 'Reset Timer'}
            >
              <RotateCcw size={16} />
            </button>

            {/* Big Emerald Play / Pause Button */}
            <button
              type="button"
              onClick={handleTogglePlayPause}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-lg ${
                timerMode === 'short-break'
                  ? 'bg-sky-500 hover:bg-sky-600 text-white dark:text-neutral-950 shadow-sky-500/30'
                  : timerMode === 'long-break'
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white dark:text-neutral-950 shadow-indigo-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white dark:text-neutral-950 shadow-emerald-500/30'
              }`}
              title={isActive ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'بدء التركيز' : 'Start Focus')}
            >
              {isActive ? <Pause size={22} className="fill-current" /> : <Play size={22} className="fill-current translate-x-0.5" />}
            </button>

            {/* Skip */}
            <button
              type="button"
              onClick={handleSkipTimer}
              className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-2xs"
              title={isAr ? 'تخطي واكتمال' : 'Skip & Finish'}
            >
              <SkipForward size={16} />
            </button>
          </div>

        </div>

        {/* ====================================================
            RIGHT PANEL: Context Bindings & Telemetry (md:col-span-7)
            ==================================================== */}
        <div className="md:col-span-7 bg-white dark:bg-[#181A20] border border-neutral-200/90 dark:border-neutral-800/90 rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between space-y-3 shadow-xs h-full min-h-[320px] max-h-[460px]">
          
          {/* 1. Target & Session Stats Grid (Precise Time Tracking) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Precise Time Daily Target Card */}
            <div 
              onClick={() => setShowTargetModal(true)}
              className="bg-neutral-50 dark:bg-neutral-900/80 hover:bg-neutral-100/80 dark:hover:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 p-2.5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                    {isAr ? 'الهدف اليومي الدقيق' : 'Precise Daily Target'}
                  </p>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                    {isAr ? 'تعديل' : 'Edit'}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Target size={13} className="text-emerald-500" />
                </div>
              </div>

              <div className="mt-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs sm:text-sm font-extrabold font-mono text-neutral-900 dark:text-white">
                    {Math.floor(totalMinutesToday / 60)}h {totalMinutesToday % 60}m <span className="text-neutral-400 font-normal">/ {targetHours}h {targetMinutes}m</span>
                  </p>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {targetProgressPct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${targetProgressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono mt-1">
                  <span>
                    {minutesRemainingToday > 0 
                      ? `${Math.floor(minutesRemainingToday / 60)}h ${minutesRemainingToday % 60}m ${isAr ? 'متبقية' : 'left'}` 
                      : (isAr ? '🎉 تم الهدف' : '🎯 Target Done')}
                  </span>
                  <span>~{completedCyclesToday}/{targetSessionsCount} {isAr ? 'دورات' : 'cycles'}</span>
                </div>
              </div>
            </div>

            {/* Minutes Logged Today */}
            <div className="bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 p-2.5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                  {isAr ? 'إجمالي التركيز اليوم' : 'Total Focus Today'}
                </p>
                <p className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {Math.floor(totalMinutesToday / 60)}h {totalMinutesToday % 60}m{' '}
                  <span className="text-[10px] text-neutral-400 font-sans">({totalMinutesToday}m)</span>
                </p>
                <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">
                  {completedCyclesToday} {isAr ? 'جلسات بومودورو مكتملة' : 'completed sprints'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Zap size={16} className="fill-emerald-500/20" />
              </div>
            </div>
          </div>

          {/* 2. Bindings: Project Selector & Task Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
              <Target size={13} className="text-emerald-500" />
              <span>{isAr ? 'ربط الجلسة بمشروع ومهمة:' : 'Bind Session Context:'}</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Project Dropdown */}
              <div className="relative w-full">
                <div className="flex items-center gap-2 w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl text-xs font-medium">
                  <BookOpen size={14} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer appearance-none pr-5 text-xs font-semibold"
                  >
                    <option value="none" className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                      {isAr ? '📖 بدون مشروع (عام)' : '📖 No Project (General)'}
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                        📂 {p.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              {/* Task Dropdown */}
              <div className="relative w-full">
                <div className="flex items-center gap-2 w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl text-xs font-medium">
                  <CheckSquare size={14} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
                  <select
                    value={activeTaskId || 'none'}
                    onChange={(e) => setActiveTaskId(e.target.value === 'none' ? null : e.target.value)}
                    className="w-full bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer appearance-none pr-5 text-xs font-semibold"
                  >
                    <option value="none" className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                      {isAr ? '☑️ بدون مهمة (تركيز حر)' : '☑️ No Task (Free Focus)'}
                    </option>
                    {availableTasks.map((t) => (
                      <option key={t.id} value={t.id} className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Quick Focus Goal Bar */}
          <form onSubmit={handleSetQuickGoal} className="w-full flex items-center gap-2 p-1.5 pl-3 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-2xs">
            <Sparkles size={14} className="text-emerald-500 shrink-0" />
            <input
              type="text"
              value={quickGoalText}
              onChange={(e) => setQuickGoalText(e.target.value)}
              placeholder={isAr ? 'أضف مهمة سريعة واضغط Enter...' : 'Add a quick target task & press Enter...'}
              className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 font-medium focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-neutral-950 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            >
              {isAr ? 'تثبيت' : 'Set Goal'}
            </button>
          </form>

          {/* 4. Active Target Status Banner */}
          <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {isAr ? 'المهمة النشطة حالياً:' : 'Active Focus Target:'}
              </p>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate mt-0.5">
                {activeTask ? activeTask.title : (activeProject ? `📂 ${activeProject.title}` : (isAr ? 'تركيز حر عام' : 'Freeform Deep Focus'))}
              </h4>
            </div>

            {activeTask && (
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {activeTask.focusedMinutes || 0}m {isAr ? 'منجزة' : 'done'}
                </span>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* ----------------------------------------------------
          REST PROTECTION MODAL
          ---------------------------------------------------- */}
      {showRestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 max-w-md w-full text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto text-2xl shadow-xs">
              🏆
            </div>

            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {isAr ? 'أحسنت! اكتملت دورة التركيز' : 'Great Job! Focus Sprint Completed'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                {isAr
                  ? `أنجزت ${focusDuration} دقيقة من التركيز الفائق. تم تسجيل الجلسة بنجاح.`
                  : `You completed a ${focusDuration}-minute sprint. Session logged to your telemetry.`}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRestModal(false);
                  handleSelectMode('short-break');
                  setIsActive(true);
                }}
                className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white dark:text-neutral-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                <span>☕</span>
                <span>{isAr ? `بدء استراحة قصيرة (${shortBreakDuration} د)` : `Start Short Break (${shortBreakDuration}m)`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRestModal(false);
                  handleSelectMode('long-break');
                  setIsActive(true);
                }}
                className="w-full py-2.5 px-4 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold rounded-2xl text-xs border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
              >
                <span>🌴</span>
                <span>{isAr ? `بدء استراحة طويلة (${longBreakDuration} د)` : `Start Long Break (${longBreakDuration}m)`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRestModal(false);
                  handleSelectMode('focus');
                }}
                className="w-full py-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isAr ? 'تخطي الاستراحة والمتابعة' : 'Skip break & continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SETTINGS MODAL
          ---------------------------------------------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-emerald-500" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {isAr ? 'إعدادات مؤقت بومودورو' : 'Pomodoro Settings'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {/* Focus Duration */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>{isAr ? 'مدة التركيز:' : 'Focus Duration:'}</span>
                  <span className="font-mono text-emerald-500">{focusDuration} {isAr ? 'دقيقة' : 'mins'}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={focusDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFocusDuration(val);
                    try { localStorage.setItem('pomodoro_focus_dur', String(val)); } catch {}
                  }}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Short Break */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>{isAr ? 'مدة الاستراحة القصيرة:' : 'Short Break:'}</span>
                  <span className="font-mono text-sky-500">{shortBreakDuration} {isAr ? 'دقيقة' : 'mins'}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={shortBreakDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setShortBreakDuration(val);
                    try { localStorage.setItem('pomodoro_short_dur', String(val)); } catch {}
                  }}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Long Break */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>{isAr ? 'مدة الاستراحة الطويلة:' : 'Long Break:'}</span>
                  <span className="font-mono text-indigo-500">{longBreakDuration} {isAr ? 'دقيقة' : 'mins'}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="5"
                  value={longBreakDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setLongBreakDuration(val);
                    try { localStorage.setItem('pomodoro_long_dur', String(val)); } catch {}
                  }}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Precise Time Daily Target in Settings */}
              <div className="space-y-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{isAr ? 'الهدف اليومي الدقيق للتركيز:' : 'Precise Daily Focus Target:'}</span>
                  <span className="font-mono text-emerald-500 font-extrabold">{targetHours}h {targetMinutes}m</span>
                </div>

                {/* Quick Presets */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { h: 1, m: 30 },
                    { h: 2, m: 0 },
                    { h: 3, m: 0 },
                    { h: 4, m: 0 },
                    { h: 5, m: 0 },
                    { h: 6, m: 0 },
                  ].map((p) => (
                    <button
                      key={`${p.h}-${p.m}`}
                      type="button"
                      onClick={() => {
                        setTargetHours(p.h);
                        setTargetMinutes(p.m);
                        try {
                          localStorage.setItem('pomodoro_target_hours', String(p.h));
                          localStorage.setItem('pomodoro_target_minutes', String(p.m));
                        } catch {}
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        targetHours === p.h && targetMinutes === p.m
                          ? 'bg-emerald-500 text-white shadow-2xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {p.h}h {p.m > 0 ? `${p.m}m` : ''}
                    </button>
                  ))}
                </div>

                {/* Steppers */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">{isAr ? 'الساعات:' : 'Hours:'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const newH = Math.max(0, targetHours - 1);
                          setTargetHours(newH);
                          try { localStorage.setItem('pomodoro_target_hours', String(newH)); } catch {}
                        }}
                        className="w-5 h-5 rounded bg-white dark:bg-neutral-700 font-bold flex items-center justify-center cursor-pointer text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold w-4 text-center">{targetHours}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newH = Math.min(16, targetHours + 1);
                          setTargetHours(newH);
                          try { localStorage.setItem('pomodoro_target_hours', String(newH)); } catch {}
                        }}
                        className="w-5 h-5 rounded bg-white dark:bg-neutral-700 font-bold flex items-center justify-center cursor-pointer text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">{isAr ? 'الدقائق:' : 'Mins:'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const newM = Math.max(0, targetMinutes - 15);
                          setTargetMinutes(newM);
                          try { localStorage.setItem('pomodoro_target_minutes', String(newM)); } catch {}
                        }}
                        className="w-5 h-5 rounded bg-white dark:bg-neutral-700 font-bold flex items-center justify-center cursor-pointer text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold w-6 text-center">{targetMinutes}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newM = Math.min(55, targetMinutes + 15);
                          setTargetMinutes(newM);
                          try { localStorage.setItem('pomodoro_target_minutes', String(newM)); } catch {}
                        }}
                        className="w-5 h-5 rounded bg-white dark:bg-neutral-700 font-bold flex items-center justify-center cursor-pointer text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Show Live Timer in Top Header Bar Option */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 block text-xs">
                    {isAr ? 'إظهار عداد الوقت في الشريط العلوي:' : 'Show Timer in Top Bar:'}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-normal block">
                    {isAr ? 'عرض مؤقت بومودورو المصغر دائماً في أعلى التطبيق' : 'Display live pomodoro clock at the top header'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newVal = !showTopBarTimerState;
                    setShowTopBarTimerState(newVal);
                    try {
                      localStorage.setItem('pomodoro_show_top_bar_timer', String(newVal));
                      window.dispatchEvent(new Event('pomodoro_top_timer_changed'));
                    } catch {}
                    if (onToggleTopBarTimer) {
                      onToggleTopBarTimer(newVal);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showTopBarTimerState ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                  role="switch"
                  aria-checked={showTopBarTimerState}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showTopBarTimerState ? (isAr ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-neutral-950 rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-emerald-500/20"
              >
                {isAr ? 'حفظ وتطبيق' : 'Save & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          DEDICATED MODAL: PRECISE DAILY TIME TARGET MODAL
          ---------------------------------------------------- */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Target size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                    {isAr ? 'تحديد الهدف اليومي الدقيق للتركيز' : 'Set Precise Daily Focus Target'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr ? 'حدد بدقة عدد الساعات والدقائق المطلوبة للتركيز اليومي' : 'Precise hours and minutes for daily deep work'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Target Display */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                {isAr ? 'الهدف المختار:' : 'Target Time:'}
              </span>
              <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {targetHours}h {targetMinutes}m
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                = {totalTargetMinutes} {isAr ? 'دقيقة تركيز صافية' : 'pure focus minutes'} (~{targetSessionsCount} {isAr ? 'جلسات بومودورو' : 'sessions'})
              </p>
            </div>

            {/* Quick 1-Tap Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {isAr ? 'أهداف سريعة شائعة:' : 'Quick Presets:'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { h: 1, m: 30, label: '1h 30m' },
                  { h: 2, m: 0, label: '2h 00m' },
                  { h: 3, m: 0, label: '3h 00m' },
                  { h: 4, m: 0, label: '4h 00m' },
                  { h: 5, m: 0, label: '5h 00m' },
                  { h: 6, m: 0, label: '6h 00m' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setTargetHours(preset.h);
                      setTargetMinutes(preset.m);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      targetHours === preset.h && targetMinutes === preset.m
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Hours & Minutes Adjuster */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Hours Stepper */}
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block text-center">
                  {isAr ? 'الساعات' : 'Hours'}
                </span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTargetHours((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:bg-neutral-100"
                  >
                    -
                  </button>
                  <span className="text-xl font-extrabold font-mono text-neutral-900 dark:text-white">
                    {targetHours}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTargetHours((prev) => Math.min(16, prev + 1))}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:bg-neutral-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Minutes Stepper */}
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block text-center">
                  {isAr ? 'الدقائق' : 'Minutes'}
                </span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTargetMinutes((prev) => Math.max(0, prev - 15))}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:bg-neutral-100"
                  >
                    -
                  </button>
                  <span className="text-xl font-extrabold font-mono text-neutral-900 dark:text-white">
                    {targetMinutes}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTargetMinutes((prev) => Math.min(55, prev + 15))}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-bold flex items-center justify-center cursor-pointer shadow-2xs hover:bg-neutral-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Preferred Focus Window */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {isAr ? 'فترة التركيز المفضلة في اليوم:' : 'Prime Focus Window:'}
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'all-day', labelEn: 'All Day', labelAr: 'طوال اليوم', icon: '🌍' },
                  { id: 'morning', labelEn: 'Morning (08-12)', labelAr: 'الصباح (08-12)', icon: '🌅' },
                  { id: 'afternoon', labelEn: 'Afternoon (13-17)', labelAr: 'بعد الظهر (13-17)', icon: '⚡' },
                  { id: 'evening', labelEn: 'Evening (18-22)', labelAr: 'المساء (18-22)', icon: '🌙' },
                ].map((win) => (
                  <button
                    key={win.id}
                    type="button"
                    onClick={() => setTargetWindow(win.id)}
                    className={`p-2 rounded-xl border text-start flex items-center gap-1.5 cursor-pointer transition-all ${
                      targetWindow === win.id
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span>{win.icon}</span>
                    <span className="truncate">{isAr ? win.labelAr : win.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('pomodoro_target_hours', String(targetHours));
                    localStorage.setItem('pomodoro_target_minutes', String(targetMinutes));
                    localStorage.setItem('pomodoro_target_window', targetWindow);
                    localStorage.setItem('pomodoro_daily_target', String(targetSessionsCount));
                  } catch {}
                  setShowTargetModal(false);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-neutral-950 rounded-xl font-bold text-xs cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                {isAr ? 'حفظ وتطبيق الهدف الدقيق' : 'Save & Set Target'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
