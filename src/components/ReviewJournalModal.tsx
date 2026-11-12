import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Star, 
  BookOpen, 
  Archive, 
  ShieldAlert, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  CheckSquare, 
  Timer, 
  Clock,
  Award,
  HelpCircle,
  Dumbbell,
  Moon,
  Zap,
  Shield,
  Search,
  Filter,
  Tag,
  Hash,
  Activity
} from 'lucide-react';
import { 
  HabitItem, 
  TaskItem, 
  FocusSession, 
  ReviewEntry, 
  WorkoutSession, 
  DailySleepLog 
} from '../types';
import { soundManager } from '../utils/soundEffects';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { 
  parseWeekKey, 
  parseMonthKey, 
  generateDefaultPeriodTitle, 
  aggregatePeriodTelemetry 
} from '../utils/reviewPeriodHelpers';

interface ReviewJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: HabitItem[];
  tasks: TaskItem[];
  focusSessions?: FocusSession[];
  workouts?: WorkoutSession[];
  reviews: ReviewEntry[];
  sleepLogs?: DailySleepLog[];
  onSaveReview: (review: Omit<ReviewEntry, 'id'>) => Promise<void>;
  onDeleteReview?: (id: string) => Promise<void>;
  initialType?: 'weekly' | 'monthly' | 'archive';
  lang?: 'en' | 'ar';
}

export const ReviewJournalModal: React.FC<ReviewJournalModalProps> = ({
  isOpen,
  onClose,
  habits,
  tasks,
  focusSessions = [],
  workouts = [],
  reviews = [],
  sleepLogs = [],
  onSaveReview,
  onDeleteReview,
  initialType = 'weekly',
  lang = 'ar',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'archive'>(initialType);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
    }
  }, [isOpen, initialType]);

  // Form period selectors
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const firstJan = new Date(year, 0, 1);
    const dayNr = Math.ceil((d.getTime() - firstJan.getTime()) / 86400000);
    const weekNr = Math.ceil((dayNr + firstJan.getDay()) / 7);
    return `${year}-W${weekNr.toString().padStart(2, '0')}`;
  });

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  // Custom user labeling states
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customNumber, setCustomNumber] = useState<string>('');

  // Qualitative notes & ratings
  const [rating, setRating] = useState<number>(8);
  const [wins, setWins] = useState<string>('');
  const [challenges, setChallenges] = useState<string>('');
  const [lessons, setLessons] = useState<string>('');
  const [nextFocus, setNextFocus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Archive tab filters & selection
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(null);

  // Monthly Synthesizer inspect selection
  const [selectedWeeklyReviewId, setSelectedWeeklyReviewId] = useState<string | null>(null);

  // Live Comprehensive Telemetry for the active week
  const weeklyTelemetry = useMemo(() => {
    const { startIso, endIso } = parseWeekKey(selectedWeekKey);
    return aggregatePeriodTelemetry({
      startIso,
      endIso,
      reviews,
      sleepLogs,
      workouts,
      focusSessions,
      tasks,
      habits,
    });
  }, [selectedWeekKey, reviews, sleepLogs, workouts, focusSessions, tasks, habits]);

  // Live Comprehensive Telemetry for the active month
  const monthlyTelemetry = useMemo(() => {
    const { startIso, endIso } = parseMonthKey(selectedMonthKey);
    return aggregatePeriodTelemetry({
      startIso,
      endIso,
      reviews,
      sleepLogs,
      workouts,
      focusSessions,
      tasks,
      habits,
    });
  }, [selectedMonthKey, reviews, sleepLogs, workouts, focusSessions, tasks, habits]);

  // Active telemetry for current active tab
  const currentTelemetry = activeTab === 'weekly' ? weeklyTelemetry : monthlyTelemetry;

  // Auto-generated fallback title preview
  const defaultTitlePreview = useMemo(() => {
    return generateDefaultPeriodTitle(
      activeTab === 'weekly' ? 'weekly' : 'monthly',
      activeTab === 'weekly' ? selectedWeekKey : selectedMonthKey,
      (lang || 'ar') as 'en' | 'ar'
    );
  }, [activeTab, selectedWeekKey, selectedMonthKey, lang]);

  // Find all weekly reviews belonging to current selected month for Monthly Review Synthesizer
  const relevantWeeklyReviews = useMemo(() => {
    return reviews.filter((r) => r.type === 'weekly');
  }, [reviews]);

  // Filtered archived reviews
  const filteredArchivedReviews = useMemo(() => {
    return reviews
      .filter((r) => r.type === 'weekly' || r.type === 'monthly')
      .filter((r) => {
        if (archiveFilter !== 'all' && r.type !== archiveFilter) return false;
        if (!archiveSearch.trim()) return true;
        const q = archiveSearch.toLowerCase();
        const matchTitle = (r.title || '').toLowerCase().includes(q);
        const matchCustom = (r.customTitle || '').toLowerCase().includes(q);
        const matchNum = (r.customNumber || '').toLowerCase().includes(q);
        const matchWins = (r.wins || '').toLowerCase().includes(q);
        const matchLessons = (r.lessons || '').toLowerCase().includes(q);
        return matchTitle || matchCustom || matchNum || matchWins || matchLessons;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [reviews, archiveFilter, archiveSearch]);

  if (!isOpen) return null;

  const handleSaveCurrentReview = async () => {
    setIsSubmitting(true);
    try {
      const isWeekly = activeTab === 'weekly';
      const periodKey = isWeekly ? selectedWeekKey : selectedMonthKey;
      const finalTitle = customTitle.trim() || defaultTitlePreview;

      const entry: Omit<ReviewEntry, 'id'> = {
        type: isWeekly ? 'weekly' : 'monthly',
        periodKey,
        title: finalTitle,
        customTitle: customTitle.trim() || undefined,
        customNumber: customNumber.trim() || undefined,
        startDate: currentTelemetry.startIso,
        endDate: currentTelemetry.endIso,
        rating,
        habitScore: currentTelemetry.habitScore,
        completedTasksCount: currentTelemetry.completedTasksCount,
        completedWorkoutsCount: currentTelemetry.workoutSessionsCount,
        totalLiftedVolume: currentTelemetry.totalLiftedVolumeKg,
        focusMinutes: currentTelemetry.totalFocusMinutes,
        excusesCount: currentTelemetry.excusesList.length,
        wins: wins.trim(),
        challenges: challenges.trim(),
        lessons: lessons.trim(),
        nextFocus: nextFocus.trim(),
        excusesSummary: currentTelemetry.excusesList.slice(0, 10),
        weeklyReviewIds: !isWeekly ? relevantWeeklyReviews.map((r) => r.id!).filter(Boolean) : undefined,
        sleepStats: {
          avgHours: currentTelemetry.avgSleepHours,
          onTargetDays: currentTelemetry.onTargetDays,
          totalDaysLogged: currentTelemetry.sleepDaysLogged,
        },
        stateAuditSummary: {
          avgDayScore: currentTelemetry.avgDayScore,
          avgEnergy: currentTelemetry.avgEnergy,
          avgStress: currentTelemetry.avgStress,
          avgClarity: currentTelemetry.avgClarity,
          avgDiscipline: currentTelemetry.avgDiscipline,
          avgFulfillment: currentTelemetry.avgFulfillment,
          topBoosters: currentTelemetry.topBoosters,
          topDrains: currentTelemetry.topDrains,
          daysAuditedCount: currentTelemetry.daysAuditedCount,
        },
        gymSummary: {
          sessionsCount: currentTelemetry.workoutSessionsCount,
          totalVolumeKg: currentTelemetry.totalLiftedVolumeKg,
          routines: currentTelemetry.routines,
        },
        tasksSummary: {
          completedCount: currentTelemetry.completedTasksCount,
          highPriorityCount: currentTelemetry.highPriorityDone,
        },
        focusSummary: {
          totalMinutes: currentTelemetry.totalFocusMinutes,
          avgDailyMinutes: currentTelemetry.avgDailyFocusMinutes,
        },
        createdAt: Date.now(),
      };

      await onSaveReview(entry);
      soundManager.playStreak();

      // Reset form fields
      setCustomTitle('');
      setCustomNumber('');
      setWins('');
      setChallenges('');
      setLessons('');
      setNextFocus('');
      setActiveTab('archive');
    } catch (err) {
      console.error('Failed saving review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const boosterDisplayMap: Record<string, { label: string; icon: string }> = {
    workout: { label: isAr ? 'تمرين مكثف' : 'Workout', icon: '🏋️‍♂️' },
    clean_nutrition: { label: isAr ? 'أكل صحي' : 'Nutrition', icon: '🥗' },
    deep_work: { label: isAr ? 'عمل عميق' : 'Deep Work', icon: '🎯' },
    quality_sleep: { label: isAr ? 'نوم مريح' : 'Good Sleep', icon: '😴' },
    sunlight_walk: { label: isAr ? 'شمس وتنفس' : 'Sunlight', icon: '☀️' },
    connection: { label: isAr ? 'تواصل إيجابي' : 'Connection', icon: '🤝' },
    reading: { label: isAr ? 'قراءة وتعلم' : 'Reading', icon: '📖' },
  };

  const drainDisplayMap: Record<string, { label: string; icon: string }> = {
    work_pressure: { label: isAr ? 'ضغط عمل' : 'Work Stress', icon: '💼' },
    screen_overload: { label: isAr ? 'سكرين تايم' : 'Screens', icon: '📱' },
    poor_sleep: { label: isAr ? 'قلة نعاس' : 'Poor Sleep', icon: '🥱' },
    junk_food: { label: isAr ? 'تخربيق ماكلة' : 'Junk Food', icon: '🍔' },
    conflict_argument: { label: isAr ? 'خلاف/مشكل' : 'Conflict', icon: '⚡' },
    procrastination: { label: isAr ? 'تسويف' : 'Procrastination', icon: '⏳' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#15171C] border border-neutral-200/90 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-3xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tracking-tight">
                  {isAr ? 'التقييم الدوري الشامل وتوثيق المسار' : 'Comprehensive Executive Review & Dossier'}
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {isAr ? 'التقرير الشامل v3.0' : 'Full Telemetry v3.0'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {isAr
                  ? 'تجميع تلقائي لبيانات الطاقة، النوم، التمارين، ساعات العمل العميق، وإنجازات الأسبوع أو الشهر.'
                  : 'Automated synthesis across sleep, habits, workouts, focus hours, and daily mastery scores.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'weekly'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1D2028]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {isAr ? 'التحليل الأسبوعي' : 'Weekly Review'}
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'monthly'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#1D2028]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {isAr ? 'التحليل الشهري المدمج' : 'Monthly Synthesis'}
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'archive'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1D2028]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            {isAr ? `أرشيف التقارير (${reviews.filter(r => r.type === 'weekly' || r.type === 'monthly').length})` : `Saved Reviews (${reviews.filter(r => r.type === 'weekly' || r.type === 'monthly').length})`}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= WEEKLY / MONTHLY FORM ================= */}
          {(activeTab === 'weekly' || activeTab === 'monthly') && (
            <div className="space-y-5 animate-fadeIn">
              {/* 1. Period Selector & Custom Labeling / Numbering Section */}
              <div className="bg-neutral-50 dark:bg-[#1A1C24] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Period Key Selector (3 cols) */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 uppercase font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{activeTab === 'weekly' ? (isAr ? 'رمز الأسبوع' : 'Week Period') : (isAr ? 'الشهر المستهدف' : 'Target Month')}</span>
                    </label>
                    {activeTab === 'weekly' ? (
                      <input
                        type="text"
                        value={selectedWeekKey}
                        onChange={(e) => setSelectedWeekKey(e.target.value)}
                        placeholder="2026-W46"
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#14161C] text-neutral-900 dark:text-white font-mono shadow-3xs"
                      />
                    ) : (
                      <input
                        type="month"
                        value={selectedMonthKey}
                        onChange={(e) => setSelectedMonthKey(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#14161C] text-neutral-900 dark:text-white font-mono shadow-3xs"
                      />
                    )}
                  </div>

                  {/* Custom Title Input (6 cols) */}
                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{isAr ? 'عنوان أو اسم مخصص لهذا الأسبوع (اختياري)' : 'Custom Title or Theme (Optional)'}</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={isAr ? 'مثال: أسبوع الانطلاقة القصوى، سبرنت التركيز...' : 'e.g., Deep Focus Sprint, High Output Week...'}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#14161C] text-neutral-900 dark:text-white shadow-3xs"
                    />
                  </div>

                  {/* Custom Number / Edition (3 cols) */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isAr ? 'رقم النسخة (اختياري)' : 'Edition # (Optional)'}</span>
                    </label>
                    <input
                      type="text"
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value)}
                      placeholder={isAr ? 'مثال: #46 أو 1' : 'e.g. #46 or 1'}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#14161C] text-neutral-900 dark:text-white font-mono shadow-3xs"
                    />
                  </div>
                </div>

                {/* Live Title Preview Banner */}
                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                    {isAr ? '🏷️ الاسم الذي سيظهر في الأرشيف:' : '🏷️ Final Archive Label:'}
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {customTitle.trim() || defaultTitlePreview}
                    {customNumber.trim() ? ` (${customNumber.trim()})` : ''}
                  </span>
                </div>
              </div>

              {/* 2. Comprehensive Live Telemetry Matrix (6 Core Metrics) */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
                  {isAr ? 'المؤشرات الرقمية المجمعة تلقائياً لهذا الأسبوع' : 'Aggregated Telemetry for this Period'}
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {/* Metric 1: Day Score Average */}
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1">
                      <Sparkles size={11} />
                      <span>{isAr ? 'معدل علامة اليوم' : 'Day Score Avg'}</span>
                    </span>
                    <div className="my-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                        {currentTelemetry.avgDayScore > 0 ? `${currentTelemetry.avgDayScore}` : '—'}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">/100</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {currentTelemetry.daysAuditedCount} {isAr ? 'أيام مقيمة' : 'days logged'}
                    </span>
                  </div>

                  {/* Metric 2: Habits Adherence */}
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1">
                      <Zap size={11} />
                      <span>{isAr ? 'ثبات العادات' : 'Habit Adherence'}</span>
                    </span>
                    <div className="my-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {currentTelemetry.habitScore}%
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {currentTelemetry.excusesList.length} {isAr ? 'أعذار مسجلة' : 'excuses logged'}
                    </span>
                  </div>

                  {/* Metric 3: Tasks Done */}
                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 flex items-center justify-center gap-1">
                      <CheckSquare size={11} />
                      <span>{isAr ? 'المهام المكتملة' : 'Tasks Done'}</span>
                    </span>
                    <div className="my-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                        {currentTelemetry.completedTasksCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {currentTelemetry.highPriorityDone} {isAr ? 'أولوية عالية' : 'high priority'}
                    </span>
                  </div>

                  {/* Metric 4: Gym & Lifted Volume */}
                  <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 flex items-center justify-center gap-1">
                      <Dumbbell size={11} />
                      <span>{isAr ? 'محرك التدريب' : 'Iron Engine'}</span>
                    </span>
                    <div className="my-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                        {currentTelemetry.workoutSessionsCount}
                      </span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold ml-1">{isAr ? 'حصة' : 'ses'}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono truncate" title={`${currentTelemetry.totalLiftedVolumeKg.toLocaleString()} kg`}>
                      {currentTelemetry.totalLiftedVolumeKg > 0 ? `${(currentTelemetry.totalLiftedVolumeKg / 1000).toFixed(1)}k kg` : '0 kg'}
                    </span>
                  </div>

                  {/* Metric 5: Sleep & Wake Consistency */}
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1">
                      <Moon size={11} />
                      <span>{isAr ? 'ساعات النوم' : 'Sleep Avg'}</span>
                    </span>
                    <div className="my-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {currentTelemetry.avgSleepHours > 0 ? `${currentTelemetry.avgSleepHours}h` : '—'}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {currentTelemetry.onTargetDays}/{currentTelemetry.sleepDaysLogged} {isAr ? 'في الموعد' : 'on target'}
                    </span>
                  </div>

                  {/* Metric 6: Focus Hours */}
                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1">
                      <Timer size={11} />
                      <span>{isAr ? 'ساعات التركيز' : 'Focus Hours'}</span>
                    </span>
                    <div className="my-1">
                      <span className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                        {(currentTelemetry.totalFocusMinutes / 60).toFixed(1)}h
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {currentTelemetry.avgDailyFocusMinutes}m {isAr ? 'يومياً' : '/ day'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. 5-Dimension State Telemetry (Energy, Stress, Clarity, Discipline, Fulfillment) */}
              {currentTelemetry.daysAuditedCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#1A1C24] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span>{isAr ? 'متوسط مؤشرات الحالة الذهنية والبدنية (State Audit Breakdown)' : 'Weekly State Ratings Breakdown'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {isAr ? 'مستخرج من التقييم اليومي' : 'From daily reflections'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                    {[
                      { label: isAr ? 'الطاقة والنشاط' : 'Energy', val: currentTelemetry.avgEnergy, color: 'bg-amber-500', icon: '⚡' },
                      { label: isAr ? 'التحكم بالتوتر' : 'Stress Control', val: currentTelemetry.avgStress, color: 'bg-emerald-500', icon: '🛡️' },
                      { label: isAr ? 'الصفاء الذهني' : 'Clarity', val: currentTelemetry.avgClarity, color: 'bg-sky-500', icon: '🎯' },
                      { label: isAr ? 'الانضباط والتنفيذ' : 'Discipline', val: currentTelemetry.avgDiscipline, color: 'bg-indigo-500', icon: '⚔️' },
                      { label: isAr ? 'الرضا والامتنان' : 'Fulfillment', val: currentTelemetry.avgFulfillment, color: 'bg-purple-500', icon: '🌟' },
                    ].map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-600 dark:text-neutral-400 font-bold truncate flex items-center gap-1">
                            <span>{m.icon}</span>
                            <span>{m.label}</span>
                          </span>
                          <span className="font-mono font-black text-neutral-900 dark:text-white">
                            {m.val > 0 ? `${m.val}` : '—'}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${m.color}`} style={{ width: `${(m.val / 10) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top Boosters & Drains Pills */}
                  {(currentTelemetry.topBoosters.length > 0 || currentTelemetry.topDrains.length > 0) && (
                    <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-wrap items-center gap-3 text-[11px]">
                      {currentTelemetry.topBoosters.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {isAr ? 'أهم المحفزات:' : 'Top Boosters:'}
                          </span>
                          {currentTelemetry.topBoosters.slice(0, 3).map((b) => (
                            <span key={b} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 text-[10px]">
                              {boosterDisplayMap[b]?.icon || '✨'} {boosterDisplayMap[b]?.label || b}
                            </span>
                          ))}
                        </div>
                      )}
                      {currentTelemetry.topDrains.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            {isAr ? 'أهم المستنزفات:' : 'Top Drains:'}
                          </span>
                          {currentTelemetry.topDrains.slice(0, 3).map((d) => (
                            <span key={d} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/20 text-[10px]">
                              {drainDisplayMap[d]?.icon || '⚠️'} {drainDisplayMap[d]?.label || d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Logged Freeze Excuses Summary (Self-Honesty Engine) */}
              {currentTelemetry.excusesList.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>{isAr ? 'سجل الأعذار وتبريرات تجميد العادات المسجلة هذا الأسبوع:' : 'Logged Habits Freeze Excuses:'}</span>
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {currentTelemetry.excusesList.map((exc, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-white/80 dark:bg-neutral-900/80 text-[11px] flex items-center justify-between border border-amber-500/20">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-neutral-400 text-[10px]">{exc.date}</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{exc.habitTitle}</span>
                        </div>
                        <span className="text-amber-700 dark:text-amber-300 italic max-w-[200px] sm:max-w-xs truncate">
                          "{exc.excuse}"
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Overall Subjective Grade (1 to 10) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {isAr ? 'التقييم الشامل للأداء (من 1 إلى 10):' : 'Overall Grade / Rating (out of 10):'}
                </label>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-mono text-xs sm:text-sm font-black transition cursor-pointer ${
                        rating === num
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                          : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Qualitative Analysis Text Areas */}
              <div className="space-y-3">
                {/* Wins */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {isAr ? '1. أهم الانتصارات والإنجازات المحققة:' : '1. Key Wins & Accomplishments:'}
                  </label>
                  <textarea
                    rows={2}
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                    placeholder={isAr ? 'سجل إنجازاتك في التدريب، تسليم المشاريع، أو السيطرة على الانضباط...' : 'List key accomplishments, completed workouts, and highlights...'}
                    className="w-full p-3 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#14161C] text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                {/* Obstacles */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    {isAr ? '2. العقبات ونقاط الاحتكاك التي واجهتك:' : '2. Obstacles & Friction Points:'}
                  </label>
                  <textarea
                    rows={2}
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder={isAr ? 'مثال: سكرين تايم متأخر، عدم الالتزام بوجبة قبل التمرين، تسويف في مهمة محددة...' : 'Detail obstacles, friction points, or habits missed with context...'}
                    className="w-full p-3 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#14161C] text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                {/* Lessons & Next Focus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      {isAr ? '3. أهم الدروس المكتسبة للتطوير:' : '3. Principal Lessons Learned:'}
                    </label>
                    <textarea
                      rows={2}
                      value={lessons}
                      onChange={(e) => setLessons(e.target.value)}
                      placeholder={isAr ? 'تعديلات سلوكية ودروس ذهنية ستطبقها مباشرة...' : 'Key insights, mindshifts, and behavioral tweaks...'}
                      className="w-full p-3 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#14161C] text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      {isAr ? '4. الشعار والهدف الأكبر للأسبوع القادم:' : '4. Next Focus Theme & Priority:'}
                    </label>
                    <textarea
                      rows={2}
                      value={nextFocus}
                      onChange={(e) => setNextFocus(e.target.value)}
                      placeholder={isAr ? 'الهدف الرئيسي الذي ستكرس له طاقتك بدون مساومة...' : 'Set theme and priority target for the upcoming period...'}
                      className="w-full p-3 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#14161C] text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveCurrentReview}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting
                    ? (isAr ? 'جاري توثيق وحفظ التقرير...' : 'Saving Review Dossier...')
                    : (isAr ? 'حفظ وتوثيق التقرير في الأرشيف الدائم 💾' : 'Save Review Entry to Archive')}
                </button>
              </div>
            </div>
          )}

          {/* ================= ARCHIVE & REVIEW HISTORY TAB ================= */}
          {activeTab === 'archive' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-[#1A1C24] border border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setArchiveFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      archiveFilter === 'all'
                        ? 'bg-amber-500 text-white shadow-3xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {isAr ? 'الكل' : 'All'} ({reviews.filter(r => r.type === 'weekly' || r.type === 'monthly').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveFilter('weekly')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      archiveFilter === 'weekly'
                        ? 'bg-amber-500 text-white shadow-3xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {isAr ? 'أسبوعية' : 'Weekly'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveFilter('monthly')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      archiveFilter === 'monthly'
                        ? 'bg-emerald-500 text-white shadow-3xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {isAr ? 'شهرية' : 'Monthly'}
                  </button>
                </div>

                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder={isAr ? 'بحث في التقارير المحفوظة...' : 'Search archived reviews...'}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#14161C] text-neutral-900 dark:text-white outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Dossiers List ("sections واحدة فوق واحدة") */}
              {filteredArchivedReviews.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
                  <BookOpen className="w-10 h-10 text-neutral-400 mx-auto" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isAr
                      ? 'لا توجد تقارير محفوظة مطابقة لبحثك. ابدأ بتسجيل أول تقرير أسبوعي أو شهري!'
                      : 'No reviews found matching criteria. Start your first periodic review!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredArchivedReviews.map((r) => {
                    const isExpanded = expandedArchiveId === r.id;
                    const isWeekly = r.type === 'weekly';

                    return (
                      <div
                        key={r.id || r.createdAt}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isExpanded
                            ? 'bg-neutral-50/90 dark:bg-[#1C1F28] border-neutral-300 dark:border-neutral-700 shadow-md ring-1 ring-neutral-300 dark:ring-neutral-700'
                            : 'bg-white dark:bg-[#181A22] border-neutral-200/80 dark:border-neutral-800 shadow-3xs hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        {/* Dossier Header Banner */}
                        <div
                          onClick={() => setExpandedArchiveId(isExpanded ? null : r.id!)}
                          className="p-4 cursor-pointer"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-3xs ${
                                  isWeekly
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {isWeekly ? <Calendar size={16} /> : <TrendingUp size={16} />}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white">
                                    {r.title}
                                  </h4>
                                  {r.customNumber && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono font-bold">
                                      {r.customNumber}
                                    </span>
                                  )}
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    ⭐ {r.rating || 8}/10
                                  </span>
                                </div>

                                <div className="mt-1 flex items-center gap-3 text-[10px] text-neutral-400 font-mono">
                                  <span>{r.periodKey}</span>
                                  {r.startDate && r.endDate && (
                                    <>
                                      <span>•</span>
                                      <span>{r.startDate} ➔ {r.endDate}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Mini KPI Snapshot Strip */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] font-mono">
                              {r.stateAuditSummary?.avgDayScore !== undefined && r.stateAuditSummary.avgDayScore > 0 && (
                                <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                  🏆 {r.stateAuditSummary.avgDayScore}/100
                                </span>
                              )}
                              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                                ⚡ {r.habitScore || 100}%
                              </span>
                              <span className="px-2 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20">
                                🎯 {r.completedTasksCount || 0}
                              </span>
                              {r.completedWorkoutsCount !== undefined && r.completedWorkoutsCount > 0 && (
                                <span className="px-2 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20 flex items-center gap-1">
                                  <Dumbbell size={11} />
                                  <span>{r.completedWorkoutsCount}</span>
                                </span>
                              )}

                              {onDeleteReview && r.id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا التقرير المؤرشف؟' : 'Delete this archived review?')) {
                                      onDeleteReview(r.id!);
                                    }
                                  }}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-rose-500 transition cursor-pointer"
                                  title={isAr ? 'حذف التقرير' : 'Delete'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}

                              <div className="text-neutral-400 p-0.5">
                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Deep Dossier */}
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-neutral-200/70 dark:border-neutral-800 space-y-4 text-xs animate-fadeIn">
                            {/* State audit breakdown if present */}
                            {r.stateAuditSummary && (
                              <div className="mt-3 p-3 rounded-xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 space-y-2">
                                <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">
                                  {isAr ? 'مؤشرات الطاقة والسيطرة الذهنية المسجلة:' : 'State Telemetry:'}
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                                  <div>
                                    <span className="text-neutral-400 block text-[10px]">⚡ الطاقة:</span>
                                    <span className="font-bold text-amber-500">{r.stateAuditSummary.avgEnergy || '—'}/10</span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-400 block text-[10px]">🛡️ التوتر:</span>
                                    <span className="font-bold text-emerald-500">{r.stateAuditSummary.avgStress || '—'}/10</span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-400 block text-[10px]">🎯 الصفاء:</span>
                                    <span className="font-bold text-sky-500">{r.stateAuditSummary.avgClarity || '—'}/10</span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-400 block text-[10px]">⚔️ الانضباط:</span>
                                    <span className="font-bold text-indigo-500">{r.stateAuditSummary.avgDiscipline || '—'}/10</span>
                                  </div>
                                  <div>
                                    <span className="text-neutral-400 block text-[10px]">🌟 الرضا:</span>
                                    <span className="font-bold text-purple-500">{r.stateAuditSummary.avgFulfillment || '—'}/10</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Wins */}
                            {r.wins && (
                              <div className="space-y-1">
                                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                                  <Sparkles size={13} />
                                  <span>{isAr ? 'أهم الانتصارات والإنجازات:' : 'Key Wins:'}</span>
                                </span>
                                <p className="p-3 rounded-xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] leading-relaxed whitespace-pre-wrap">
                                  {r.wins}
                                </p>
                              </div>
                            )}

                            {/* Obstacles */}
                            {r.challenges && (
                              <div className="space-y-1">
                                <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 text-xs">
                                  <ShieldAlert size={13} />
                                  <span>{isAr ? 'العقبات ونقاط الاحتكاك:' : 'Obstacles & Friction:'}</span>
                                </span>
                                <p className="p-3 rounded-xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] leading-relaxed whitespace-pre-wrap">
                                  {r.challenges}
                                </p>
                              </div>
                            )}

                            {/* Lessons & Next Focus */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {r.lessons && (
                                <div className="space-y-1">
                                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 text-xs">
                                    <BookOpen size={13} />
                                    <span>{isAr ? 'الدروس المكتسبة:' : 'Lessons Learned:'}</span>
                                  </span>
                                  <p className="p-3 rounded-xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] leading-relaxed whitespace-pre-wrap">
                                    {r.lessons}
                                  </p>
                                </div>
                              )}

                              {r.nextFocus && (
                                <div className="space-y-1">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                                    <TrendingUp size={13} />
                                    <span>{isAr ? 'التركيز والشعار القادم:' : 'Next Priority:'}</span>
                                  </span>
                                  <p className="p-3 rounded-xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] leading-relaxed whitespace-pre-wrap">
                                    {r.nextFocus}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
