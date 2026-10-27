import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Timer, 
  Sparkles, 
  Clock, 
  Plus, 
  Flame,
  Volume2,
  VolumeX,
  FolderKanban
} from 'lucide-react';
import { TaskItem, ProjectItem, FocusSession } from '../types';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface TaskPomodoroModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => Promise<any>;
  onAddFocusSession?: (session: Omit<FocusSession, 'id'>) => Promise<any>;
  allProjects?: ProjectItem[];
  lang?: 'en' | 'ar';
}

export const TaskPomodoroModal: React.FC<TaskPomodoroModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onAddFocusSession,
  allProjects = [],
  lang = 'en',
}) => {
  const isAr = lang === 'ar';

  // Preset options in minutes
  const PRESETS = [15, 25, 45, 60];

  const [selectedPreset, setSelectedPreset] = useState<number>(25);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const targetMinutes = isCustom ? (parseInt(customMinutes) || 25) : selectedPreset;
  const initialSeconds = targetMinutes * 60;

  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const timerRef = useRef<any>(null);

  // Sync initial seconds when preset or task changes (if timer not actively running)
  useEffect(() => {
    if (!isActive) {
      setSecondsRemaining(targetMinutes * 60);
    }
  }, [selectedPreset, customMinutes, isCustom]);

  // Timer countdown loop
  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsRemaining === 0) {
      handleCompleteSession();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsRemaining]);

  if (!isOpen || !task) return null;

  const linkedProject = task.projectId ? allProjects.find((p) => p.id === task.projectId) : null;

  // Formatting helper
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalDurationSeconds = targetMinutes * 60;
  const progressPercentage = totalDurationSeconds > 0 
    ? Math.min(100, Math.max(0, ((totalDurationSeconds - secondsRemaining) / totalDurationSeconds) * 100))
    : 0;

  // Toggle Timer Play / Pause
  const handleTogglePlay = () => {
    if (!isActive) {
      setIsActive(true);
      if (soundEnabled) soundManager.playCheck();
    } else {
      setIsActive(false);
    }
  };

  // Reset Timer
  const handleReset = () => {
    setIsActive(false);
    setSecondsRemaining(targetMinutes * 60);
  };

  // Add 5 Minutes Boost
  const handleAddFiveMinutes = () => {
    setSecondsRemaining((prev) => prev + 300);
  };

  // Session Completion Action
  const handleCompleteSession = async () => {
    setIsActive(false);
    setSecondsRemaining(targetMinutes * 60);
    setSessionCount((prev) => prev + 1);

    if (soundEnabled) {
      soundManager.playStreak();
    }

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#059669', '#F59E0B']
    });

    const elapsedMins = targetMinutes;
    const currentFocused = task.focusedMinutes || 0;
    const newFocusedMinutes = currentFocused + elapsedMins;

    // Build updates for the task
    const taskUpdates: Partial<TaskItem> = {
      focusedMinutes: newFocusedMinutes,
      kanbanStatus: 'in_progress',
    };

    // If task is measurable and unit is pomodoros/sessions, increment currentValue
    if (task.isMeasurable) {
      const isPomodoroUnit = !task.unit || task.unit.toLowerCase().includes('pomo') || task.unit.toLowerCase().includes('جلسة');
      if (isPomodoroUnit) {
        taskUpdates.currentValue = (task.currentValue || 0) + 1;
        if (task.targetValue && (taskUpdates.currentValue >= task.targetValue)) {
          taskUpdates.completed = true;
          taskUpdates.completedAt = Date.now();
          taskUpdates.kanbanStatus = 'completed';
        }
      }
    }

    if (task.id) {
      await onUpdateTask(task.id, taskUpdates);
    }

    // Log FocusSession
    if (onAddFocusSession) {
      try {
        await onAddFocusSession({
          title: task.title,
          duration: elapsedMins,
          type: 'focus',
          associatedType: 'task',
          associatedId: task.id,
          associatedTitle: task.title,
          createdAt: Date.now(),
        });
      } catch (err) {
        console.warn('Failed to log focus session:', err);
      }
    }
  };

  // Early Finish & Log
  const handleFinishEarlyAndLog = async () => {
    const secondsWorked = totalDurationSeconds - secondsRemaining;
    const minsWorked = Math.max(1, Math.round(secondsWorked / 60));

    setIsActive(false);

    if (minsWorked > 0 && task.id) {
      const newFocusedMinutes = (task.focusedMinutes || 0) + minsWorked;
      await onUpdateTask(task.id, {
        focusedMinutes: newFocusedMinutes,
        kanbanStatus: 'in_progress',
      });

      if (onAddFocusSession) {
        try {
          await onAddFocusSession({
            title: task.title,
            duration: minsWorked,
            type: 'focus',
            associatedType: 'task',
            associatedId: task.id,
            associatedTitle: task.title,
            createdAt: Date.now(),
          });
        } catch (e) {
          console.warn('Failed to log focus session:', e);
        }
      }

      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.7 },
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
              <Timer size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {isAr ? 'جلسة بومودورو للمهمة' : 'Task Pomodoro Focus Session'}
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white truncate">
                {task.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title={soundEnabled ? (isAr ? 'كتم الصوت' : 'Mute Sound') : (isAr ? 'تشغيل الصوت' : 'Unmute Sound')}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Metadata Badges & Total Logged Time */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              {linkedProject && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                  <FolderKanban size={12} />
                  <span>{linkedProject.title}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                <Flame size={12} />
                <span>{task.focusedMinutes || 0} {isAr ? 'دقيقة مركزة مسجلة' : 'mins total focused'}</span>
              </span>
            </div>

            {sessionCount > 0 && (
              <span className="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400">
                🍅 {sessionCount} {isAr ? 'جلسات مكتملة الآن' : 'sprint(s) done now'}
              </span>
            )}
          </div>

          {/* Duration Preset Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400">
              {isAr ? 'اختر مدة الجلسة (بالدقائق):' : 'Select Session Duration:'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedPreset(m);
                    if (!isActive) setSecondsRemaining(m * 60);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                    !isCustom && selectedPreset === m
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-emerald-500'
                  }`}
                >
                  {m}m
                </button>
              ))}

              <button
                onClick={() => setIsCustom(true)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isCustom
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                    : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-emerald-500'
                }`}
              >
                {isAr ? 'مخصص' : 'Custom'}
              </button>
            </div>

            {isCustom && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  placeholder="e.g. 30"
                  value={customMinutes}
                  onChange={(e) => {
                    setCustomMinutes(e.target.value);
                    const val = parseInt(e.target.value);
                    if (val && !isActive) setSecondsRemaining(val * 60);
                  }}
                  className="w-24 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold bg-white dark:bg-neutral-800 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-neutral-500 font-medium">
                  {isAr ? 'دقيقة' : 'minutes'}
                </span>
              </div>
            )}
          </div>

          {/* Central Circular Progress & Timer Display */}
          <div className="relative flex flex-col items-center justify-center py-4">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
              {/* SVG Ring Background */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-neutral-100 dark:text-neutral-800 stroke-current"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-emerald-500 stroke-current transition-all duration-1000 ease-linear"
                  strokeWidth="7"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 - (263.89 * progressPercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Center Digital Clock */}
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-neutral-900 dark:text-white">
                  {formattedTime}
                </span>
                <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isActive 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}>
                  {isActive ? (isAr ? 'جاري التركيز...' : 'In Session') : (isAr ? 'جاهز للبدء' : 'Ready')}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer"
              title={isAr ? 'إعادة ضبط' : 'Reset Timer'}
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={handleTogglePlay}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer scale-[1.03] active:scale-95 ${
                isActive
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isActive ? (
                <>
                  <Pause size={18} />
                  <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
                </>
              ) : (
                <>
                  <Play size={18} className="fill-white" />
                  <span>{isAr ? 'بدء التركيز الان' : 'Start Focus'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleAddFiveMinutes}
              className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
              title={isAr ? 'إضافة 5 دقائق' : '+5 Minutes'}
            >
              <Plus size={14} />
              <span>5m</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <button
            onClick={handleFinishEarlyAndLog}
            className="px-4 py-2 rounded-xl bg-neutral-200/80 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            <span>{isAr ? 'إنهاء الجلسة وتسجيل الوقت' : 'Finish & Log Worked Time'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-bold cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
