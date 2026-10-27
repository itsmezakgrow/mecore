import React, { useState, useMemo } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { HabitItem, TaskItem, FocusSession, ReviewEntry } from '../types';
import { soundManager } from '../utils/soundEffects';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ReviewJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: HabitItem[];
  tasks: TaskItem[];
  focusSessions?: FocusSession[];
  reviews: ReviewEntry[];
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
  reviews = [],
  onSaveReview,
  onDeleteReview,
  initialType = 'weekly',
  lang = 'ar',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'archive'>(initialType);

  // Sync initial tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
    }
  }, [isOpen, initialType]);

  // Form states
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

  const [rating, setRating] = useState<number>(8);
  const [wins, setWins] = useState<string>('');
  const [challenges, setChallenges] = useState<string>('');
  const [lessons, setLessons] = useState<string>('');
  const [nextFocus, setNextFocus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedArchiveReview, setSelectedArchiveReview] = useState<ReviewEntry | null>(null);

  // Selected weekly review inspect tab in monthly mode
  const [selectedWeeklyReviewId, setSelectedWeeklyReviewId] = useState<string | null>(null);

  // Computed metrics for Weekly Review
  const weeklyStats = useMemo(() => {
    // Determine 7 days window for current week selection
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const startIso = start.toISOString().split('T')[0];
    const endIso = end.toISOString().split('T')[0];

    // Habit adherence
    let totalOpportunities = 0;
    let completedCount = 0;
    const excusesList: { date: string; habitTitle: string; excuse: string }[] = [];

    habits.forEach((h) => {
      if (h.archived) return;
      const cur = new Date(start);
      while (cur <= end) {
        const iso = cur.toISOString().split('T')[0];
        totalOpportunities++;
        if (h.history?.[iso]) {
          completedCount++;
        }
        if (h.freezeExcuses?.[iso]) {
          excusesList.push({
            date: iso,
            habitTitle: h.title,
            excuse: h.freezeExcuses[iso],
          });
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

    const habitScore = totalOpportunities > 0 ? Math.round((completedCount / totalOpportunities) * 100) : 100;

    // Completed tasks in past 7 days
    const completedTasks = tasks.filter((t) => t.completed);

    // Focus minutes past 7 days
    const startTs = start.getTime();
    const focusMins = focusSessions
      .filter((s) => s.createdAt >= startTs)
      .reduce((acc, s) => acc + (s.duration || 0), 0);

    return {
      habitScore,
      completedCount,
      totalOpportunities,
      completedTasksCount: completedTasks.length,
      focusMinutes: focusMins,
      excusesList,
      startIso,
      endIso,
    };
  }, [habits, tasks, focusSessions]);

  // Computed metrics for Monthly Review
  const monthlyStats = useMemo(() => {
    const [yearStr, monthStr] = selectedMonthKey.split('-');
    const year = parseInt(yearStr) || new Date().getFullYear();
    const month = (parseInt(monthStr) || (new Date().getMonth() + 1)) - 1;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const startIso = startDate.toISOString().split('T')[0];
    const endIso = endDate.toISOString().split('T')[0];

    // Habit adherence across the entire month
    let totalOpportunities = 0;
    let completedCount = 0;
    const excusesList: { date: string; habitTitle: string; excuse: string }[] = [];

    habits.forEach((h) => {
      if (h.archived) return;
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const iso = cur.toISOString().split('T')[0];
        totalOpportunities++;
        if (h.history?.[iso]) {
          completedCount++;
        }
        if (h.freezeExcuses?.[iso]) {
          excusesList.push({
            date: iso,
            habitTitle: h.title,
            excuse: h.freezeExcuses[iso],
          });
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

    const habitScore = totalOpportunities > 0 ? Math.round((completedCount / totalOpportunities) * 100) : 100;

    // Tasks completed during this month timeframe
    const completedTasks = tasks.filter((t) => t.completed);

    // Focus minutes during this month
    const startTs = startDate.getTime();
    const endTs = endDate.getTime() + 86400000;
    const focusMins = focusSessions
      .filter((s) => s.createdAt >= startTs && s.createdAt <= endTs)
      .reduce((acc, s) => acc + (s.duration || 0), 0);

    return {
      habitScore,
      completedCount,
      totalOpportunities,
      completedTasksCount: completedTasks.length,
      focusMinutes: focusMins,
      excusesList,
      startIso,
      endIso,
    };
  }, [habits, tasks, focusSessions, selectedMonthKey]);

  // Find all weekly reviews belonging to current selected month for Monthly Review Synthesizer
  const relevantWeeklyReviews = useMemo(() => {
    return reviews.filter((r) => r.type === 'weekly');
  }, [reviews]);

  if (!isOpen) return null;

  const handleSaveCurrentReview = async () => {
    setIsSubmitting(true);
    try {
      const isWeekly = activeTab === 'weekly';
      const stats = isWeekly ? weeklyStats : monthlyStats;
      const periodKey = isWeekly ? selectedWeekKey : selectedMonthKey;

      const title = isWeekly
        ? (isAr ? `تحليل الأسبوع ${selectedWeekKey}` : `Weekly Review ${selectedWeekKey}`)
        : (isAr ? `التقرير الشهري ${selectedMonthKey}` : `Monthly Review ${selectedMonthKey}`);

      const entry: Omit<ReviewEntry, 'id'> = {
        type: isWeekly ? 'weekly' : 'monthly',
        periodKey,
        title,
        rating,
        habitScore: stats.habitScore,
        completedTasksCount: stats.completedTasksCount,
        focusMinutes: stats.focusMinutes,
        excusesCount: stats.excusesList.length,
        wins: wins.trim(),
        challenges: challenges.trim(),
        lessons: lessons.trim(),
        nextFocus: nextFocus.trim(),
        excusesSummary: stats.excusesList.slice(0, 10),
        weeklyReviewIds: !isWeekly ? relevantWeeklyReviews.map((r) => r.id!).filter(Boolean) : undefined,
        createdAt: Date.now(),
      };

      await onSaveReview(entry);
      soundManager.playStreak();

      // Reset fields
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                {isAr ? 'مُحتَرِف التحليل والتقييم الدوري' : 'Executive Review & Journal'}
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                  {isAr ? 'مرن وجاد' : 'Strict & Flexible'}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isAr ? 'وثّق إنجازاتك، حلل الأسباب والأعذار، واحتفظ بالرؤية الشاملة لأشهر السنة' : 'Analyze performance metrics, review logged context excuses, and archive insights.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/30 dark:bg-neutral-900/30">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
              activeTab === 'weekly'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-neutral-800/80'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {isAr ? 'التحليل الأسبوعي' : 'Weekly Review'}
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
              activeTab === 'monthly'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-800/80'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {isAr ? 'التحليل الشهري المدمج' : 'Monthly Synthesis'}
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 ${
              activeTab === 'archive'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800/80'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            {isAr ? `أرشيف التحاليل (${reviews.length})` : `Saved Reviews (${reviews.length})`}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= WEEKLY / MONTHLY FORM ================= */}
          {(activeTab === 'weekly' || activeTab === 'monthly') && (
            <div className="space-y-6">
              {/* Period Selector & Quick Live Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                    {activeTab === 'weekly' ? (isAr ? 'رمز الأسبوع' : 'Week Period') : (isAr ? 'الشهر المستهدف' : 'Target Month')}
                  </label>
                  {activeTab === 'weekly' ? (
                    <input
                      type="text"
                      value={selectedWeekKey}
                      onChange={(e) => setSelectedWeekKey(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                    />
                  ) : (
                    <input
                      type="month"
                      value={selectedMonthKey}
                      onChange={(e) => setSelectedMonthKey(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                    />
                  )}
                </div>

                {/* Auto computed stats badges */}
                <div className="md:col-span-3 grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
                      {isAr ? 'التزام العادات' : 'Habit Adherence'}
                    </span>
                    <span className="text-base font-black text-emerald-800 dark:text-emerald-200">
                      {(activeTab === 'weekly' ? weeklyStats : monthlyStats).habitScore}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-center">
                    <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold block">
                      {isAr ? 'المهام المكتملة' : 'Tasks Done'}
                    </span>
                    <span className="text-base font-black text-blue-800 dark:text-blue-200">
                      {(activeTab === 'weekly' ? weeklyStats : monthlyStats).completedTasksCount}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-center">
                    <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold block">
                      {isAr ? 'ساعات التركيز' : 'Focus Hours'}
                    </span>
                    <span className="text-base font-black text-purple-800 dark:text-purple-200">
                      {((activeTab === 'weekly' ? weeklyStats : monthlyStats).focusMinutes / 60).toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>

              {/* SPECIAL MONTHLY SYNTHESIZER: Side-by-Side 4-Week Overview Cards */}
              {activeTab === 'monthly' && (
                <div className="space-y-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-4 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      {isAr ? 'تصفح ملخصات الأسابيع الأربعة لهذا الشهر (Multi-Week Review Hub)' : 'Monthly Multi-Week Review Hub'}
                    </h3>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-bold">
                      {relevantWeeklyReviews.length} {isAr ? 'تحليل أسبوعي مسجل' : 'weekly reviews logged'}
                    </span>
                  </div>

                  {relevantWeeklyReviews.length === 0 ? (
                    <div className="p-3 text-center text-xs text-neutral-500 dark:text-neutral-400 bg-white/60 dark:bg-neutral-900/60 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800">
                      {isAr
                        ? 'لم تقم بتسجيل تحاليل أسبوعية سابقة بعد لهذا الشهر. يمكنك البدء بإجراء تحليل أسبوعي أولاً لدمج أفكار الأسابيع الأربعة بكل سهولة!'
                        : 'No weekly reviews logged yet for this month. Complete weekly reviews to synthesize them here.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {relevantWeeklyReviews.map((r) => {
                        const isExpanded = selectedWeeklyReviewId === r.id;
                        return (
                          <div
                            key={r.id}
                            className={`p-3 rounded-xl border transition cursor-pointer ${
                              isExpanded
                                ? 'bg-white dark:bg-neutral-800 border-emerald-500 shadow-md'
                                : 'bg-white/80 dark:bg-neutral-900/80 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400'
                            }`}
                            onClick={() => setSelectedWeeklyReviewId(isExpanded ? null : r.id!)}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                {r.title}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                                  ⭐ {r.rating}/10
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>

                            {/* Details when expanded */}
                            {isExpanded && (
                              <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-700/60 space-y-2 text-[11px] text-neutral-700 dark:text-neutral-300 animate-fadeIn">
                                {r.wins && (
                                  <div>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">🌟 الإنجازات:</span>
                                    <p className="bg-neutral-50 dark:bg-neutral-900 p-2 rounded-lg">{r.wins}</p>
                                  </div>
                                )}
                                {r.lessons && (
                                  <div>
                                    <span className="font-bold text-blue-600 dark:text-blue-400 block">💡 الدروس:</span>
                                    <p className="bg-neutral-50 dark:bg-neutral-900 p-2 rounded-lg">{r.lessons}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Logged Excuses Context Box */}
              {((activeTab === 'weekly' ? weeklyStats : monthlyStats).excusesList.length > 0) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      {isAr ? 'الأعذار والأسباب المسجلة الموثقة لهذه الفترة' : 'Logged Excuses & Context for this Period'}
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                      {(activeTab === 'weekly' ? weeklyStats : monthlyStats).excusesList.length} {isAr ? 'عذر مسجل' : 'logged excuses'}
                    </span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-[11px]">
                    {(activeTab === 'weekly' ? weeklyStats : monthlyStats).excusesList.map((exc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1.5 bg-white/80 dark:bg-neutral-900/80 rounded-lg text-neutral-800 dark:text-neutral-200">
                        <span className="font-bold">{exc.habitTitle} ({exc.date})</span>
                        <span className="text-amber-700 dark:text-amber-300 font-medium">{exc.excuse}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reflection Journaling Inputs */}
              <div className="space-y-4">
                {/* Rating Input */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
                  <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    {isAr ? 'التقييم الشامل لهذه الفترة (من 10):' : 'Overall Grade / Rating (out of 10):'}
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition ${
                          rating >= num
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wins */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {isAr ? '1. أهم النجاحات والإنجازات (What Went Extremely Well?):' : '1. Key Wins & Accomplishments:'}
                  </label>
                  <textarea
                    rows={2}
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                    placeholder={isAr ? 'مثال: إكمال قراءة كتاب التخطيط، إنجاز 15 بومودورو بدون تشتت، الحفاظ على عادة الرياضة...' : 'List key accomplishments, completed milestones, and highlights...'}
                    className="w-full p-3 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Challenges */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    {isAr ? '2. التحديات والعقبات التي واجهتك (Challenges & Roadblocks):' : '2. Obstacles & Friction Points:'}
                  </label>
                  <textarea
                    rows={2}
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder={isAr ? 'مثال: السهر يوم الأربعاء أدى لتأخر روتين الصباح، بعض التسويف في المهمة المعقدة...' : 'Detail obstacles, friction points, or habits missed with context...'}
                    className="w-full p-3 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Lessons & Next Focus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      {isAr ? '3. أهم الدروس المكتسبة:' : '3. Principal Lessons Learned:'}
                    </label>
                    <textarea
                      rows={2}
                      value={lessons}
                      onChange={(e) => setLessons(e.target.value)}
                      placeholder={isAr ? 'مثال: تفكيك المهمة الكبيرة إلى 3 خطوات يجعل البداية أسهل بكثير...' : 'Key insights, mindshifts, and behavioral tweaks...'}
                      className="w-full p-3 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      {isAr ? '4. التركيز والشعار للفترة القادمة:' : '4. Next Focus Theme & Priority:'}
                    </label>
                    <textarea
                      rows={2}
                      value={nextFocus}
                      onChange={(e) => setNextFocus(e.target.value)}
                      placeholder={isAr ? 'مثال: أسبوع التنفيذ الصارم بدون المشتتات، التركيز على إنهاء مسودة المشروع...' : 'Set theme and priority target for the upcoming period...'}
                      className="w-full p-3 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
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
                  className="w-full py-3.5 px-6 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting
                    ? (isAr ? 'جاري توثيق وحفظ التحليل...' : 'Saving Review...')
                    : (isAr ? 'حفظ التقرير والتحليل في الأرشيف الدائم 💾' : 'Save Review Entry to Archive')}
                </button>
              </div>
            </div>
          )}

          {/* ================= ARCHIVE & REVIEW HISTORY ================= */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <Archive className="w-4 h-4 text-blue-500" />
                  {isAr ? 'سجل التحاليل والأرشفة المسجلة' : 'Saved Periodic Reviews Archive'}
                </h3>
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  {reviews.length} {isAr ? 'سجل مؤرشف' : 'entries saved'}
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
                  <BookOpen className="w-10 h-10 text-neutral-400 mx-auto" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isAr ? 'لا توجد تحاليل محفوظة بعد. ابدأ بإجراء أول تحليل أسبوعي أو شهري!' : 'No reviews saved yet. Start your first weekly or monthly audit!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => {
                    const isSelected = selectedArchiveReview?.id === r.id;
                    return (
                      <div
                        key={r.id || r.createdAt}
                        className={`p-4 rounded-2xl border transition ${
                          r.type === 'monthly'
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                            : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setSelectedArchiveReview(isSelected ? null : r)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl text-xs font-black ${
                              r.type === 'monthly'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}>
                              {r.type === 'monthly' ? (isAr ? 'شهري' : 'Monthly') : (isAr ? 'أسبوعي' : 'Weekly')}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-neutral-900 dark:text-white">
                                {r.title}
                              </h4>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              ⭐ {r.rating || 8}/10
                            </span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {r.habitScore || 100}% {isAr ? 'التزام' : 'habits'}
                            </span>
                            {onDeleteReview && r.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(isAr ? 'هل أنت تأكد من حذف هذا التقرير؟' : 'Delete this review entry?')) {
                                    onDeleteReview(r.id!);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isSelected && (
                          <div className="mt-4 pt-3 border-t border-neutral-200/80 dark:border-neutral-700/80 space-y-3 text-xs text-neutral-800 dark:text-neutral-200 animate-fadeIn">
                            {r.wins && (
                              <div>
                                <span className="font-black text-emerald-600 dark:text-emerald-400 block mb-1">
                                  🌟 {isAr ? 'أهم النجاحات:' : 'Key Wins:'}
                                </span>
                                <p className="bg-white/80 dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                                  {r.wins}
                                </p>
                              </div>
                            )}

                            {r.challenges && (
                              <div>
                                <span className="font-black text-rose-600 dark:text-rose-400 block mb-1">
                                  🧱 {isAr ? 'التحديات والعقبات:' : 'Challenges:'}
                                </span>
                                <p className="bg-white/80 dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                                  {r.challenges}
                                </p>
                              </div>
                            )}

                            {r.lessons && (
                              <div>
                                <span className="font-black text-blue-600 dark:text-blue-400 block mb-1">
                                  💡 {isAr ? 'الدروس المكتسبة:' : 'Lessons Learned:'}
                                </span>
                                <p className="bg-white/80 dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                                  {r.lessons}
                                </p>
                              </div>
                            )}

                            {r.nextFocus && (
                              <div>
                                <span className="font-black text-amber-600 dark:text-amber-400 block mb-1">
                                  🎯 {isAr ? 'التركيز والقادم:' : 'Next Focus:'}
                                </span>
                                <p className="bg-white/80 dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                                  {r.nextFocus}
                                </p>
                              </div>
                            )}
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
