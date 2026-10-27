import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Sparkles,
  Star,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  Layers,
  Flame,
  CheckSquare,
  Moon,
  Sunrise,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Zap,
  Coffee,
  Check,
  Save,
  Tag,
  ArrowRight
} from 'lucide-react';
import { HabitItem, TaskItem, FocusSession, ReviewEntry, DailySleepLog, WeeklyPriorityGoal } from '../types';
import { soundManager } from '../utils/soundEffects';

interface ReflectionsJournalProps {
  reviews: ReviewEntry[];
  habits: HabitItem[];
  tasks: TaskItem[];
  sleepLogs?: DailySleepLog[];
  focusSessions?: FocusSession[];
  weeklyGoals?: WeeklyPriorityGoal[];
  onSaveReview: (review: Omit<ReviewEntry, 'id'>) => Promise<void>;
  onDeleteReview?: (id: string) => Promise<void>;
  lang?: 'en' | 'ar';
}

export const ReflectionsJournal: React.FC<ReflectionsJournalProps> = ({
  reviews,
  habits,
  tasks,
  sleepLogs = [],
  focusSessions = [],
  weeklyGoals = [],
  onSaveReview,
  onDeleteReview,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'archive'>('daily');

  // Today ISO
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Current Week ID e.g. "2026-W42"
  const currentWeekId = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const firstJan = new Date(year, 0, 1);
    const dayNr = Math.ceil((d.getTime() - firstJan.getTime()) / 86400000);
    const weekNr = Math.ceil((dayNr + firstJan.getDay()) / 7);
    return `${year}-W${weekNr.toString().padStart(2, '0')}`;
  }, []);

  // Selected date for Daily reflection
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  // Selected week for Weekly reflection
  const [selectedWeek, setSelectedWeek] = useState<string>(currentWeekId);

  // Archive search and filter
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'daily' | 'weekly' | 'starred'>('all');

  // Form states for Daily reflection
  const existingDailyEntry = useMemo(() => {
    return reviews.find(r => r.type === 'daily' && r.periodKey === selectedDate);
  }, [reviews, selectedDate]);

  const [dailyMood, setDailyMood] = useState<'calm' | 'productive' | 'stressed' | 'neutral' | 'tired' | 'victorious'>('productive');
  const [dailyRating, setDailyRating] = useState<number>(8);
  const [dailyTitle, setDailyTitle] = useState<string>('');
  const [dailyLessons, setDailyLessons] = useState<string>('');
  const [dailyWins, setDailyWins] = useState<string>('');
  const [dailyChallenges, setDailyChallenges] = useState<string>('');
  const [dailyNotes, setDailyNotes] = useState<string>('');
  const [isSavingDaily, setIsSavingDaily] = useState(false);
  const [dailySaveSuccess, setDailySaveSuccess] = useState(false);

  // Sync daily form when date changes
  React.useEffect(() => {
    if (existingDailyEntry) {
      setDailyTitle(existingDailyEntry.title || '');
      setDailyMood(existingDailyEntry.dayMood || 'productive');
      setDailyRating(existingDailyEntry.rating || 8);
      setDailyLessons(existingDailyEntry.lessons || '');
      setDailyWins(existingDailyEntry.wins || '');
      setDailyChallenges(existingDailyEntry.challenges || '');
      setDailyNotes(existingDailyEntry.notes || '');
    } else {
      setDailyTitle('');
      setDailyMood('productive');
      setDailyRating(8);
      setDailyLessons('');
      setDailyWins('');
      setDailyChallenges('');
      setDailyNotes('');
    }
    setDailySaveSuccess(false);
  }, [existingDailyEntry, selectedDate]);

  // Form states for Weekly reflection
  const existingWeeklyEntry = useMemo(() => {
    return reviews.find(r => r.type === 'weekly' && r.periodKey === selectedWeek);
  }, [reviews, selectedWeek]);

  const [weeklyTitle, setWeeklyTitle] = useState<string>('');
  const [weeklyRating, setWeeklyRating] = useState<number>(8);
  const [weeklyLessons, setWeeklyLessons] = useState<string>('');
  const [weeklyWins, setWeeklyWins] = useState<string>('');
  const [weeklyChallenges, setWeeklyChallenges] = useState<string>('');
  const [weeklyNextFocus, setWeeklyNextFocus] = useState<string>('');
  const [weeklyNotes, setWeeklyNotes] = useState<string>('');
  const [isSavingWeekly, setIsSavingWeekly] = useState(false);
  const [weeklySaveSuccess, setWeeklySaveSuccess] = useState(false);

  // Sync weekly form when week changes
  React.useEffect(() => {
    if (existingWeeklyEntry) {
      setWeeklyTitle(existingWeeklyEntry.title || '');
      setWeeklyRating(existingWeeklyEntry.rating || 8);
      setWeeklyLessons(existingWeeklyEntry.lessons || '');
      setWeeklyWins(existingWeeklyEntry.wins || '');
      setWeeklyChallenges(existingWeeklyEntry.challenges || '');
      setWeeklyNextFocus(existingWeeklyEntry.nextFocus || '');
      setWeeklyNotes(existingWeeklyEntry.notes || '');
    } else {
      setWeeklyTitle('');
      setWeeklyRating(8);
      setWeeklyLessons('');
      setWeeklyWins('');
      setWeeklyChallenges('');
      setWeeklyNextFocus('');
      setWeeklyNotes('');
    }
    setWeeklySaveSuccess(false);
  }, [existingWeeklyEntry, selectedWeek]);

  // Connected context for selected Date
  const dateContext = useMemo(() => {
    // Habits completed on this date
    const habitsCompleted = habits.filter(h => Boolean(h.history?.[selectedDate] || h.completedDates?.includes(selectedDate)));
    // Tasks completed on this date
    const tasksCompleted = tasks.filter(t => {
      if (!t.completed) return false;
      if (t.completedAt) {
        const tIso = new Date(t.completedAt).toISOString().split('T')[0];
        return tIso === selectedDate;
      }
      return selectedDate === todayIso;
    });
    // Sleep log on this date
    const sleepLog = sleepLogs.find(l => l.date === selectedDate);
    // Focus sessions on this date
    const focusTotalMins = focusSessions
      .filter(f => f.date === selectedDate)
      .reduce((sum, f) => sum + (f.duration || 0), 0);

    return {
      habitsCompleted,
      tasksCompleted,
      sleepLog,
      focusTotalMins,
    };
  }, [selectedDate, habits, tasks, sleepLogs, focusSessions, todayIso]);

  // Connected context for selected Week
  const weekContext = useMemo(() => {
    // Habits active in week
    const habitsDoneCount = habits.filter(h => {
      const hasHistory = h.history && Object.keys(h.history).some(k => h.history[k]);
      const hasDates = (h.completedDates || []).length > 0;
      return hasHistory || hasDates;
    }).length;
    // Tasks completed in week
    const tasksDone = tasks.filter(t => t.completed);
    const weekGoals = weeklyGoals.filter(g => g.weekId === selectedWeek);

    return {
      habitsDoneCount,
      tasksDoneCount: tasksDone.length,
      weekGoals,
    };
  }, [selectedWeek, habits, tasks, weeklyGoals]);

  // Navigation helpers for dates
  const handleShiftDate = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    setSelectedDate(iso);
  };

  // Quick preset vibes for Daily Reflection
  const handleSelectQuickVibe = (vibe: 'calm' | 'productive' | 'stressed' | 'neutral' | 'tired' | 'victorious', defaultText: string) => {
    setDailyMood(vibe);
    if (!dailyNotes && !dailyLessons) {
      setDailyNotes(defaultText);
    }
  };

  // Save Daily Reflection
  const handleSaveDaily = async () => {
    setIsSavingDaily(true);
    try {
      const title = dailyTitle.trim() || (isAr ? `تأمل يوم ${selectedDate}` : `Reflection for ${selectedDate}`);
      await onSaveReview({
        type: 'daily',
        periodKey: selectedDate,
        title,
        dayMood: dailyMood,
        rating: dailyRating,
        lessons: dailyLessons.trim() || undefined,
        wins: dailyWins.trim() || undefined,
        challenges: dailyChallenges.trim() || undefined,
        notes: dailyNotes.trim() || undefined,
        habitScore: habits.length > 0 ? Math.round((dateContext.habitsCompleted.length / habits.length) * 100) : undefined,
        completedTasksCount: dateContext.tasksCompleted.length,
        focusMinutes: dateContext.focusTotalMins || undefined,
        sleepActualHours: dateContext.sleepLog ? Number((dateContext.sleepLog.sleepDurationMinutes / 60).toFixed(1)) : undefined,
        wokeOnTarget: dateContext.sleepLog?.wokeOnTarget,
        createdAt: existingDailyEntry ? existingDailyEntry.createdAt : Date.now(),
        updatedAt: Date.now(),
      });
      soundManager.play('celebrate');
      setDailySaveSuccess(true);
      setTimeout(() => setDailySaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save daily reflection:', err);
    } finally {
      setIsSavingDaily(false);
    }
  };

  // Save Weekly Reflection
  const handleSaveWeekly = async () => {
    setIsSavingWeekly(true);
    try {
      const title = weeklyTitle.trim() || (isAr ? `مراجعة وتأمل ${selectedWeek}` : `Weekly Reflection ${selectedWeek}`);
      await onSaveReview({
        type: 'weekly',
        periodKey: selectedWeek,
        title,
        rating: weeklyRating,
        lessons: weeklyLessons.trim() || undefined,
        wins: weeklyWins.trim() || undefined,
        challenges: weeklyChallenges.trim() || undefined,
        nextFocus: weeklyNextFocus.trim() || undefined,
        notes: weeklyNotes.trim() || undefined,
        createdAt: existingWeeklyEntry ? existingWeeklyEntry.createdAt : Date.now(),
        updatedAt: Date.now(),
      });
      soundManager.play('celebrate');
      setWeeklySaveSuccess(true);
      setTimeout(() => setWeeklySaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save weekly reflection:', err);
    } finally {
      setIsSavingWeekly(false);
    }
  };

  // Filtered Archive
  const filteredArchive = useMemo(() => {
    return reviews.filter(r => {
      if (archiveFilter === 'daily' && r.type !== 'daily') return false;
      if (archiveFilter === 'weekly' && r.type !== 'weekly') return false;
      if (archiveFilter === 'starred' && !r.isStarred) return false;

      if (!archiveSearch) return true;
      const s = archiveSearch.toLowerCase();
      return (
        r.title?.toLowerCase().includes(s) ||
        r.lessons?.toLowerCase().includes(s) ||
        r.wins?.toLowerCase().includes(s) ||
        r.challenges?.toLowerCase().includes(s) ||
        r.notes?.toLowerCase().includes(s) ||
        r.periodKey?.toLowerCase().includes(s)
      );
    });
  }, [reviews, archiveFilter, archiveSearch]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-36 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs border border-amber-200/50 dark:border-amber-800/30">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#2F3437] dark:text-white">
                  {isAr ? 'سجل التأملات والدروس المستفادة' : 'Reflections & Lessons Journal'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  {isAr ? 'يومي وأسبوعي مترابط' : 'Daily & Weekly Synced'}
                </span>
              </div>
              <p className="text-xs text-[#787774] dark:text-neutral-400 mt-0.5">
                {isAr
                  ? 'مساحتك الخاصة لتدوين الدروس، ما سار بشكل رائع، أين ضاع الوقت، وخلاصات الأداء المربوطة بعاداتك ومهامك ونومك.'
                  : 'Your space to capture daily lessons, weekly audits, wins, time leaks, and interconnected telemetry.'}
              </p>
            </div>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-[#202228] rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                  : 'text-[#787774] dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Calendar size={13} className={activeTab === 'daily' ? 'text-amber-500' : ''} />
              <span>{isAr ? 'التأمل اليومي' : 'Daily Reflection'}</span>
            </button>

            <button
              onClick={() => setActiveTab('weekly')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'weekly'
                  ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                  : 'text-[#787774] dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={13} className={activeTab === 'weekly' ? 'text-indigo-500' : ''} />
              <span>{isAr ? 'المراجعة الأسبوعية' : 'Weekly Review'}</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                  : 'text-[#787774] dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Bookmark size={13} className={activeTab === 'archive' ? 'text-emerald-500' : ''} />
              <span>{isAr ? 'أرشيف الدروس' : 'Lessons Archive'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                {reviews.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: DAILY REFLECTION */}
        {activeTab === 'daily' && (
          <div className="pt-4 space-y-5">
            {/* DATE NAVIGATOR & CONNECTED CHIPS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-[#202228] p-3 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShiftDate(-1)}
                  className="p-1.5 rounded-lg bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] hover:bg-neutral-100 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                  title={isAr ? 'اليوم السابق' : 'Previous Day'}
                >
                  {isAr ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                </button>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1 rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs font-mono font-bold text-[#2F3437] dark:text-white"
                  />
                  {selectedDate === todayIso && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white">
                      {isAr ? 'اليوم' : 'Today'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleShiftDate(1)}
                  className="p-1.5 rounded-lg bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] hover:bg-neutral-100 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                  title={isAr ? 'اليوم التالي' : 'Next Day'}
                >
                  {isAr ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
                </button>
              </div>

              {/* CONNECTED CONTEXT BADGES FOR THIS DATE */}
              <div className="flex items-center flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-1 rounded-lg bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center gap-1 font-mono text-neutral-700 dark:text-neutral-300">
                  <Flame size={12} className="text-amber-500" />
                  <span>{dateContext.habitsCompleted.length} {isAr ? 'عادات منجزة' : 'habits done'}</span>
                </span>
                <span className="px-2 py-1 rounded-lg bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center gap-1 font-mono text-neutral-700 dark:text-neutral-300">
                  <CheckSquare size={12} className="text-blue-500" />
                  <span>{dateContext.tasksCompleted.length} {isAr ? 'مهام منجزة' : 'tasks done'}</span>
                </span>
                {dateContext.sleepLog && (
                  <span className="px-2 py-1 rounded-lg bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center gap-1 font-mono text-neutral-700 dark:text-neutral-300">
                    <Moon size={12} className="text-indigo-500" />
                    <span>{(dateContext.sleepLog.sleepDurationMinutes / 60).toFixed(1)}h {isAr ? 'نوم' : 'sleep'}</span>
                    {dateContext.sleepLog.wokeOnTarget && <span className="text-emerald-500 font-bold">✓</span>}
                  </span>
                )}
              </div>
            </div>

            {/* QUICK VIBE SELECTOR (e.g. "ما كاين والو" / ضغط / ممتاز) */}
            <div>
              <span className="text-[11px] font-bold text-[#787774] dark:text-neutral-400 block mb-2 uppercase tracking-wider">
                {isAr ? 'حالة اليوم وطبيعة الضغط (Quick Vibe)' : 'Day Atmosphere & Load'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  {
                    id: 'calm',
                    labelAr: 'هادئ / ما كاين والو',
                    labelEn: 'Calm / Nothing Big',
                    icon: Coffee,
                    color: 'text-sky-500',
                    presetNote: isAr ? 'يوم هادئ وعادي، لا يوجد ضغط خاص أو أحداث استثنائية.' : 'Calm, peaceful day with no intense pressure.'
                  },
                  {
                    id: 'productive',
                    labelAr: 'إنتاجي وإنجازات',
                    labelEn: 'Productive & Focused',
                    icon: Zap,
                    color: 'text-amber-500',
                    presetNote: isAr ? 'يوم ممتاز مليء بالتركيز وإنجاز الأولويات بسلاسة.' : 'Highly focused and productive execution day.'
                  },
                  {
                    id: 'stressed',
                    labelAr: 'ضغط وتحديات',
                    labelEn: 'High Stress & Load',
                    icon: AlertTriangle,
                    color: 'text-rose-500',
                    presetNote: isAr ? 'يوم مليء بالتحديات وضغط المهام وتشتت الوقت.' : 'Faced high pressure and competing urgent demands.'
                  },
                  {
                    id: 'tired',
                    labelAr: 'راحة واسترجاع طاقة',
                    labelEn: 'Rest & Recovery',
                    icon: Moon,
                    color: 'text-indigo-500',
                    presetNote: isAr ? 'يوم مخصص للراحة والتعافي البدني والذهني.' : 'Restorative day prioritizing mental and physical recovery.'
                  },
                  {
                    id: 'victorious',
                    labelAr: 'انتصار وفوز كبير',
                    labelEn: 'Major Breakthrough',
                    icon: Star,
                    color: 'text-emerald-500',
                    presetNote: isAr ? 'تحقيق خطوة استراتيجية كبيرة وكسر حاجز مهم.' : 'Major breakthrough in goals or mindset today.'
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = dailyMood === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectQuickVibe(item.id as any, item.presetNote)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-[#2F3437] dark:text-white shadow-xs'
                          : 'border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon size={14} className={item.color} />
                      <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RATING & TITLE ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 block">
                  {isAr ? 'عنوان أو فكرة اليوم الرئيسية (اختياري)' : 'Headline / Main Theme'}
                </label>
                <input
                  type="text"
                  value={dailyTitle}
                  onChange={(e) => setDailyTitle(e.target.value)}
                  placeholder={isAr ? 'مثلا: بداية قوية في المشروع، أو تدوير للأولويات...' : 'e.g. Strong push on project, or reset priorities...'}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 flex items-center justify-between">
                  <span>{isAr ? 'تقييم اليوم الإجمالي' : 'Day Score'}</span>
                  <span className="text-amber-600 font-mono font-bold">{dailyRating}/10</span>
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={dailyRating}
                    onChange={(e) => setDailyRating(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* CORE QUESTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Question 1: Lessons Learned */}
              <div className="p-4 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'الدروس المستفادة اليوم (Lessons Learned)' : 'Lessons Learned Today'}
                  </h4>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                  {isAr
                    ? 'ماذا تعلمت اليوم عن نفسي، عن نمط عملي، أو قرار اتخذته؟'
                    : 'What did I learn about myself, my workflows, or a decision made?'}
                </p>
                <textarea
                  value={dailyLessons}
                  onChange={(e) => setDailyLessons(e.target.value)}
                  placeholder={isAr ? 'مثلا: تأخير المهمة الصعبة للظهيرة يستهلك طاقتي، أو تقسيم العمل إلى 25 دقيقة يجعلني أكثر هدوءاً...' : 'e.g. Starting hard tasks early saves energy...'}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-amber-200/70 dark:border-amber-800/40 bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Question 2: Time Leaks & Challenges */}
              <div className="p-4 rounded-xl bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-500" />
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'أين ضاع الوقت؟ وما هي التحديات؟' : 'Time Leaks & Challenges'}
                  </h4>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                  {isAr
                    ? 'أين تشتت انتباهي؟ ما الذي سرق ساعاتي دون أن أشعر؟'
                    : 'Where did my focus slip? What stole hours without noticing?'}
                </p>
                <textarea
                  value={dailyChallenges}
                  onChange={(e) => setDailyChallenges(e.target.value)}
                  placeholder={isAr ? 'مثلا: فتحت الهاتف بعد الغداء وضاعت ساعة، أو بدأت مهمة دون تحديد نهايتها...' : 'e.g. Scrolled phone after lunch, or lacked clear stopping rule...'}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-rose-200/70 dark:border-rose-800/40 bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Question 3: Wins & Accomplishments */}
              <div className="p-4 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'ما سار بشكل رائع وانتصارات اليوم' : 'Daily Wins & Progress'}
                  </h4>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                  {isAr
                    ? 'ما الذي قمت به اليوم واستحق التقدير والفخر؟'
                    : 'What went genuinely well today that deserves acknowledgment?'}
                </p>
                <textarea
                  value={dailyWins}
                  onChange={(e) => setDailyWins(e.target.value)}
                  placeholder={isAr ? 'مثلا: التزمت بالنوم في الموعد، أو أغلقت 3 مهام كانت مؤجلة...' : 'e.g. Stuck to sleep target, cleared 3 overdue tasks...'}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Question 4: Free-form Notes & Thoughts */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <div className="flex items-center gap-2">
                  <Edit3 size={16} className="text-indigo-500" />
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'ملاحظات وأفكار حرة (Free-form Notes)' : 'Free-form Notes & Thoughts'}
                  </h4>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                  {isAr
                    ? 'أي فكرة طارئة، مشاعر، أو تدوينات عفوية تود حفظها.'
                    : 'Any passing thoughts, feelings, or quick capture to keep safe.'}
                </p>
                <textarea
                  value={dailyNotes}
                  onChange={(e) => setDailyNotes(e.target.value)}
                  placeholder={isAr ? 'اكتب بحرية ما يجول في خاطرك...' : 'Write freely whatever is on your mind...'}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* SAVE BUTTON & NOTIFICATION */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {dailySaveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                    <Check size={14} />
                    {isAr ? '✓ تم حفظ تأمل اليوم بنجاح في السجل!' : '✓ Today\'s reflection saved successfully!'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveDaily}
                disabled={isSavingDaily}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                <Save size={14} />
                <span>{isSavingDaily ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ تأمل اليوم' : 'Save Reflection')}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: WEEKLY REVIEW */}
        {activeTab === 'weekly' && (
          <div className="pt-4 space-y-5">
            {/* WEEK SELECTOR & CONNECTED SUMMARY */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-[#202228] p-3 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-500" />
                  <span>{isAr ? 'الأسبوع المحدد:' : 'Selected Week:'}</span>
                </span>
                <input
                  type="text"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  placeholder="2026-W42"
                  className="px-3 py-1 rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs font-mono font-bold text-[#2F3437] dark:text-white w-28"
                />
                {selectedWeek === currentWeekId && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
                    {isAr ? 'الأسبوع الحالي' : 'Current Week'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] font-mono text-neutral-700 dark:text-neutral-300">
                  {weekContext.weekGoals.length} {isAr ? 'أهداف أسبوعية أساسية' : 'weekly priority goals'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] font-mono text-neutral-700 dark:text-neutral-300">
                  {weekContext.tasksDoneCount} {isAr ? 'مهام منجزة' : 'tasks finished'}
                </span>
              </div>
            </div>

            {/* TITLE & SCORE ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 block">
                  {isAr ? 'شعار أو عنوان الأسبوع (Weekly Focus / Theme)' : 'Week Headline / Theme'}
                </label>
                <input
                  type="text"
                  value={weeklyTitle}
                  onChange={(e) => setWeeklyTitle(e.target.value)}
                  placeholder={isAr ? 'مثلا: أسبوع الانضباط والاستيقاظ الباكر، أو إطلاق النسخة الأولى...' : 'e.g. Discipline & early rise week...'}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 flex items-center justify-between">
                  <span>{isAr ? 'تقييم رضاك عن الأسبوع' : 'Week Score'}</span>
                  <span className="text-indigo-600 font-mono font-bold">{weeklyRating}/10</span>
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weeklyRating}
                    onChange={(e) => setWeeklyRating(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* WEEKLY QUESTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Question 1: Key Lessons Learned */}
              <div className="p-4 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-200/50 dark:border-indigo-900/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-indigo-500" />
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'أهم دروس وخلاصات الأسبوع (Key Weekly Lessons)' : 'Key Weekly Lessons'}
                  </h4>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                  {isAr
                    ? 'ما هو الدرس الاستراتيجي الذي خرجت به من هذا الأسبوع؟'
                    : 'What strategic rule or truth became clear this week?'}
                </p>
                <textarea
                  value={weeklyLessons}
                  onChange={(e) => setWeeklyLessons(e.target.value)}
                  placeholder={isAr ? 'اكتب الدروس والقواعد التي ستعتمدها مستقبلاً...' : 'Key takeaways and golden rules...'}
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-indigo-200/70 dark:border-indigo-800/40 bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Question 2: Where Time Was Wasted */}
              <div className="p-4 rounded-xl bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-500" />
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'أين ضاع الوقت وأين خربقت؟ (Time Leaks & Missteps)' : 'Time Leaks & Missteps'}
                  </h4>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                  {isAr
                    ? 'أين تشتت الانتباه وما هي الأنماط السلبية التي تكررت؟'
                    : 'Where did friction happen and which patterns broke the flow?'}
                </p>
                <textarea
                  value={weeklyChallenges}
                  onChange={(e) => setWeeklyChallenges(e.target.value)}
                  placeholder={isAr ? 'مثلا: السهر أثر على استيقاظ الصباح، أو العمل بدون قائمة محددة...' : 'e.g. Late nights compromised mornings...'}
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-rose-200/70 dark:border-rose-800/40 bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Question 3: Top Wins */}
              <div className="p-4 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-emerald-500" />
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'أهم 3 انتصارات وإنجازات الأسبوع' : 'Top 3 Weekly Wins'}
                  </h4>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                  {isAr ? 'ما هي اللحظات التي شعرت فيها بالإنجاز والرضا؟' : 'Which moments felt deeply satisfying?'}
                </p>
                <textarea
                  value={weeklyWins}
                  onChange={(e) => setWeeklyWins(e.target.value)}
                  placeholder={isAr ? '1. إكمال المشروع...\n2. الحفاظ على التمرين...\n3. قراءة كتاب...' : '1. Shipped project...\n2. Consistent training...'}
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Question 4: Next Week Priorities */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-500" />
                  <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'أولويات ونوايا الأسبوع القادم' : 'Priorities for Next Week'}
                  </h4>
                </div>
                <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                  {isAr ? 'ما هو الشيء الواحد الذي إذا أنجزته سيكون الأسبوع القادم ناجحاً؟' : 'What single outcome defines success next week?'}
                </p>
                <textarea
                  value={weeklyNextFocus}
                  onChange={(e) => setWeeklyNextFocus(e.target.value)}
                  placeholder={isAr ? 'اكتب أولوياتك الرئيسية للأسبوع القادم...' : 'Core priorities and strategic intent...'}
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* SAVE BUTTON & NOTIFICATION */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {weeklySaveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                    <Check size={14} />
                    {isAr ? '✓ تم حفظ المراجعة الأسبوعية بنجاح في السجل!' : '✓ Weekly review saved successfully!'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveWeekly}
                disabled={isSavingWeekly}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                <Save size={14} />
                <span>{isSavingWeekly ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ المراجعة الأسبوعية' : 'Save Weekly Review')}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: LESSONS & REFLECTIONS ARCHIVE */}
        {activeTab === 'archive' && (
          <div className="pt-4 space-y-4">
            {/* SEARCH & FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-[#202228] p-3 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33]">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder={isAr ? 'ابحث في الدروس المستفادة، الانتصارات، والملاحظات...' : 'Search lessons, wins, or notes...'}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['all', 'daily', 'weekly'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setArchiveFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      archiveFilter === f
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100'
                    }`}
                  >
                    {f === 'all' && (isAr ? 'الكل' : 'All')}
                    {f === 'daily' && (isAr ? 'يومي' : 'Daily')}
                    {f === 'weekly' && (isAr ? 'أسبوعي' : 'Weekly')}
                  </button>
                ))}
              </div>
            </div>

            {/* LIST OF REFLECTIONS */}
            {filteredArchive.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl p-6">
                <Lightbulb size={28} className="mx-auto text-amber-400 mb-2 opacity-60" />
                <p className="text-xs font-bold text-[#2F3437] dark:text-white">
                  {isAr ? 'لا توجد تأملات أو دروس مطابقة حتى الآن' : 'No reflections or lessons found yet'}
                </p>
                <p className="text-[11px] text-[#787774] dark:text-neutral-400 mt-1">
                  {isAr ? 'سجل تأملك اليومي أو مراجعتك الأسبوعية لحفظ خبراتك وتجاربك هنا.' : 'Log your daily reflection or weekly audit to build your knowledge repository.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredArchive.map((entry) => {
                  const isDaily = entry.type === 'daily';
                  return (
                    <div
                      key={entry.id || entry.periodKey}
                      className="p-4 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] hover:border-neutral-300 dark:hover:border-neutral-600 transition-all flex flex-col justify-between space-y-3"
                    >
                      {/* Entry Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isDaily
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          }`}>
                            {isDaily ? (isAr ? 'تأمل يومي' : 'Daily') : (isAr ? 'مراجعة أسبوعية' : 'Weekly')}
                          </span>
                          <span className="text-xs font-mono font-bold text-neutral-500">
                            {entry.periodKey}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {entry.rating && (
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                              <Star size={11} className="fill-amber-500" />
                              {entry.rating}/10
                            </span>
                          )}
                          {onDeleteReview && entry.id && (
                            <button
                              onClick={() => onDeleteReview(entry.id!)}
                              className="p-1 rounded-md text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                        {entry.title}
                      </h4>

                      {/* Content Blocks */}
                      <div className="space-y-2 text-xs">
                        {entry.lessons && (
                          <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                              <Lightbulb size={11} /> {isAr ? 'الدروس المستفادة:' : 'Lessons Learned:'}
                            </span>
                            <p className="text-[11px] text-[#2F3437] dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                              {entry.lessons}
                            </p>
                          </div>
                        )}

                        {entry.wins && (
                          <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-0.5">
                              <CheckCircle2 size={11} /> {isAr ? 'الانتصارات:' : 'Wins:'}
                            </span>
                            <p className="text-[11px] text-[#2F3437] dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                              {entry.wins}
                            </p>
                          </div>
                        )}

                        {entry.challenges && (
                          <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30">
                            <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1 mb-0.5">
                              <AlertTriangle size={11} /> {isAr ? 'أين ضاع الوقت والتحديات:' : 'Time Leaks & Challenges:'}
                            </span>
                            <p className="text-[11px] text-[#2F3437] dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                              {entry.challenges}
                            </p>
                          </div>
                        )}

                        {entry.notes && !entry.lessons && !entry.wins && (
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap italic">
                            "{entry.notes}"
                          </p>
                        )}
                      </div>

                      {/* Footer telemetry preview */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <div className="flex items-center gap-2">
                          {entry.completedTasksCount !== undefined && (
                            <span>{entry.completedTasksCount} {isAr ? 'مهام' : 'tasks'}</span>
                          )}
                          {entry.sleepActualHours !== undefined && (
                            <span>{entry.sleepActualHours}h {isAr ? 'نوم' : 'sleep'}</span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (isDaily) {
                              setSelectedDate(entry.periodKey);
                              setActiveTab('daily');
                            } else {
                              setSelectedWeek(entry.periodKey);
                              setActiveTab('weekly');
                            }
                          }}
                          className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                        >
                          <span>{isAr ? 'تعديل أو مراجعة' : 'Inspect'}</span>
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
