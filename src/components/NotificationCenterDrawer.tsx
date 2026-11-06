import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  Flame, 
  Sparkles, 
  Compass, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Clock,
  Layers,
  Trash2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  ModuleType, 
  TaskItem, 
  HabitItem, 
  ReviewEntry, 
  VisualizationStory, 
  Affirmation 
} from '../types';

export interface SmartNotificationItem {
  id: string;
  category: 'urgent' | 'routine' | 'mindset';
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  titleEn?: string;
  subtitle?: string;
  brief: string;
  briefEn?: string;
  description: string;
  descriptionEn?: string;
  timeTag: string;
  badge?: string;
  badgeColor?: string;
  targetModule: ModuleType;
  targetTab?: 'journal' | 'blocks' | 'visions' | 'affirmations';
  targetFilter?: string;
  actionText: string;
  actionTextEn?: string;
}

interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: TaskItem[];
  habits?: HabitItem[];
  reviews?: ReviewEntry[];
  visions?: VisualizationStory[];
  affirmations?: Affirmation[];
  onNavigate: (module: ModuleType, subContext?: { tab?: string; filter?: string }) => void;
  lang?: 'en' | 'ar';
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  isOpen,
  onClose,
  tasks = [],
  habits = [],
  reviews = [],
  visions = [],
  affirmations = [],
  onNavigate,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // Active filter tab: 'all' | 'urgent' | 'routine'
  const [filterTab, setFilterTab] = useState<'all' | 'urgent' | 'routine'>('all');

  // Expanded card IDs (for accordion effect on single click)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Dismissed notifications stored in localStorage for today
  const storageKey = `core_dismissed_notifications_${todayStr}`;
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissedIds((prev) => {
      const updated = [...prev, id];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAll = () => {
    const allIds = rawNotifications.map((n) => n.id);
    setDismissedIds(allIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(allIds));
    } catch {}
  };

  // Generate real-time dynamic notifications
  const rawNotifications = useMemo(() => {
    const list: SmartNotificationItem[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday

    // 1. Daily State Audit & Day Score Pending Check
    const todayDailyReview = reviews.find(
      (r) => r.type === 'daily' && r.periodKey === todayStr && r.dayScore !== undefined
    );
    if (!todayDailyReview) {
      list.push({
        id: 'daily-audit',
        category: 'urgent',
        icon: <Zap className="w-4 h-4" />,
        iconBg: 'bg-amber-500/15 border border-amber-500/30',
        iconColor: 'text-amber-500',
        title: 'تدقيق وتقييم نهار اليوم',
        titleEn: 'Daily State Audit & Day Score',
        subtitle: isAr ? 'تقييم غير مكتمل' : 'Audit Pending',
        brief: 'سجل مستويات الطاقة، التوتر والانضباط لحساب الـ Day Score.',
        briefEn: 'Log your energy, stress, and discipline to compute your Day Score.',
        description:
          'مازال ما درتيش تنقيط نهارك ومراقبة مؤشراتك الـ 5 (الطاقة، التحكم بالتوتر، الصفاء، الانضباط، والرضا). سجل بياناتك اليومية باش تاخذ Day Mastery Score وتحدد المحفزات والمستنزفات.',
        descriptionEn:
          'You haven\'t completed today\'s 5-dimension state rating yet. Log energy, stress control, clarity, discipline, and fulfillment to get your composite Day Score.',
        timeTag: currentHour >= 18 ? (isAr ? 'مساءً • عاجل' : 'Evening • Priority') : (isAr ? 'اليوم' : 'Today'),
        badge: isAr ? 'مطلوب اليوم' : 'Required Today',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        targetModule: 'reflections',
        targetTab: 'journal',
        actionText: 'بدء تقييم النهار الآن',
        actionTextEn: 'Score Today\'s Day Now',
      });
    }

    // 2. Sunday Reset / Weekly Review Check
    // Triggers if Sunday or Saturday evening, and no weekly review for this week
    const year = now.getFullYear();
    const firstJan = new Date(year, 0, 1);
    const dayNr = Math.ceil((now.getTime() - firstJan.getTime()) / 86400000);
    const weekNr = Math.ceil((dayNr + firstJan.getDay()) / 7);
    const currentWeekKey = `${year}-W${weekNr.toString().padStart(2, '0')}`;

    const hasWeeklyReview = reviews.some(
      (r) => r.type === 'weekly' && r.periodKey === currentWeekKey
    );
    const isWeekend = currentDay === 0 || (currentDay === 6 && currentHour >= 17);

    if (isWeekend && !hasWeeklyReview) {
      list.push({
        id: 'sunday-reset',
        category: 'urgent',
        icon: <Calendar className="w-4 h-4" />,
        iconBg: 'bg-indigo-500/15 border border-indigo-500/30',
        iconColor: 'text-indigo-500',
        title: 'إعادة الضبط الأسبوعي (Sunday Reset)',
        titleEn: 'Sunday Reset Protocol',
        subtitle: isAr ? 'نهاية الأسبوع' : 'Weekend Ritual',
        brief: 'تصفية المهام وجدولة أولويات الأسبوع القادم.',
        briefEn: 'Triage past week and structure next week priorities.',
        description:
          'اليوم هو موعد إعادة الضبط الأسبوعي! استغل 10 دقائق لأرشفة المهام المنتهية، مراجعة نسبة ثبات عاداتك، وتحديد الأهداف الكبرى للأسبوع القادم بدون تشتيت.',
        descriptionEn:
          'It\'s time for the Sunday Reset Protocol. Archive finished items, review weekly habits, and lock in focus targets for the upcoming week.',
        timeTag: isAr ? 'الأحد • محطة أسبوعية' : 'Sunday • Weekly Station',
        badge: isAr ? 'إعادة ضبط' : 'Weekly Reset',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
        targetModule: 'sunday-reset',
        actionText: 'دخول بروتوكول الأحد',
        actionTextEn: 'Launch Sunday Reset',
      });
    }

    // 3. Monthly Review Check (End of month or beginning)
    const dayOfMonth = now.getDate();
    const isEndOfMonth = dayOfMonth >= 27 || dayOfMonth <= 2;
    const currentMonthKey = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const hasMonthlyReview = reviews.some(
      (r) => r.type === 'monthly' && r.periodKey === currentMonthKey
    );

    if (isEndOfMonth && !hasMonthlyReview) {
      list.push({
        id: 'monthly-review',
        category: 'urgent',
        icon: <BookOpen className="w-4 h-4" />,
        iconBg: 'bg-emerald-500/15 border border-emerald-500/30',
        iconColor: 'text-emerald-500',
        title: 'المراجعة الشهرية الشاملة',
        titleEn: 'Monthly Strategic Audit',
        subtitle: isAr ? 'محطة شهرية' : 'Monthly Milestone',
        brief: 'تقييم إنجازات الشهر وتحديد أولويات الشهر القادم.',
        briefEn: 'Reflect on monthly milestones and calibrate targets.',
        description:
          'نهاية الشهر فرصة ذهبية للابتعاد خطوة للوراء، مراجعة تقدم الأهداف الكبرى، استخلاص الدروس من الأعذار، وضبط بوصلة الشهر الجديد.',
        descriptionEn:
          'End-of-month check-in: Audit big projects, reflect on monthly wins, and recalibrate your execution roadmap.',
        timeTag: isAr ? 'شهرياً' : 'Monthly',
        badge: isAr ? 'تقييم استراتيجي' : 'Strategic Audit',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        targetModule: 'reflections',
        actionText: 'فتح التحليل الشهري',
        actionTextEn: 'Start Monthly Review',
      });
    }

    // 4. Tasks Due Today Check
    const activeTasksDueToday = tasks.filter((t) => {
      if (t.completed || t.archived) return false;
      if (t.dueDate === todayStr) return true;
      return false;
    });

    if (activeTasksDueToday.length > 0) {
      const topTwo = activeTasksDueToday.slice(0, 2).map((t) => t.title).join(' • ');
      list.push({
        id: 'tasks-today',
        category: 'routine',
        icon: <CheckSquare className="w-4 h-4" />,
        iconBg: 'bg-sky-500/15 border border-sky-500/30',
        iconColor: 'text-sky-500',
        title: `${activeTasksDueToday.length} ${isAr ? 'مهام مبرمجة لليوم' : 'Tasks Scheduled for Today'}`,
        titleEn: `${activeTasksDueToday.length} Tasks Scheduled for Today`,
        subtitle: isAr ? 'التنفيذ اليومي' : 'Daily Execution',
        brief: topTwo ? `${topTwo}...` : (isAr ? 'مهام بانتظار الإنجاز' : 'Pending tasks'),
        briefEn: topTwo ? `${topTwo}...` : 'Pending execution',
        description: isAr
          ? `عندك ${activeTasksDueToday.length} مهام مبرمجة لليوم لم تكتمل بعد. ركز على إنجاز المهام ذات الأولوية العالية للحفاظ على وتيرة العمل.`
          : `You have ${activeTasksDueToday.length} tasks scheduled for today that require execution. Knock them down to stay ahead.`,
        descriptionEn: `You have ${activeTasksDueToday.length} tasks scheduled for today that require execution. Knock them down to stay ahead.`,
        timeTag: isAr ? 'اليوم' : 'Today',
        badge: `${activeTasksDueToday.length} ${isAr ? 'مهام' : 'tasks'}`,
        badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
        targetModule: 'tasks',
        actionText: 'عرض وتتبع مهام اليوم',
        actionTextEn: 'Open Today\'s Tasks',
      });
    }

    // 5. Daily Habits Pending Check
    const activeHabits = habits.filter((h) => !h.archived);
    const pendingHabits = activeHabits.filter((h) => !h.history || !h.history[todayStr]);

    if (pendingHabits.length > 0) {
      const habitNames = pendingHabits.slice(0, 3).map((h) => h.title).join(' • ');
      list.push({
        id: 'habits-today',
        category: 'routine',
        icon: <Flame className="w-4 h-4" />,
        iconBg: 'bg-rose-500/15 border border-rose-500/30',
        iconColor: 'text-rose-500',
        title: `${pendingHabits.length} ${isAr ? 'عادات بانتظار التأكيد' : 'Habits Pending Check-in'}`,
        titleEn: `${pendingHabits.length} Daily Habits Pending Check-in`,
        subtitle: isAr ? 'سلسلة الالتزام' : 'Streaks at Risk',
        brief: habitNames ? `${habitNames}...` : (isAr ? 'عادات اليوم' : 'Daily habits'),
        briefEn: habitNames ? `${habitNames}...` : 'Daily habits',
        description: isAr
          ? `حافظ على الـ Streaks ديالك! مازال ما كملتيش كاع العادات المبرمجة لليوم (${habitNames}). لا تكسر السلسلة اليومية.`
          : `Keep your streaks alive! You have ${pendingHabits.length} habits pending check-in for today (${habitNames}). Don't break the chain.`,
        descriptionEn: `Keep your streaks alive! You have ${pendingHabits.length} habits pending check-in for today (${habitNames}). Don't break the chain.`,
        timeTag: currentHour >= 20 ? (isAr ? 'الليلة • حاسم' : 'Night • Urgent') : (isAr ? 'اليوم' : 'Today'),
        badge: `${pendingHabits.length} ${isAr ? 'عادات' : 'habits'}`,
        badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        targetModule: 'habits',
        actionText: 'تسجيل وتأكيد العادات',
        actionTextEn: 'Check In Habits',
      });
    }

    // 6. Affirmations Session Check
    if (affirmations.length > 0) {
      list.push({
        id: 'affirmations-deck',
        category: 'mindset',
        icon: <Sparkles className="w-4 h-4" />,
        iconBg: 'bg-purple-500/15 border border-purple-500/30',
        iconColor: 'text-purple-500',
        title: 'التأكيدات والبرمجة الذهنية',
        titleEn: 'Daily Affirmation Deck',
        subtitle: isAr ? 'شحن العقل' : 'Mindset Reprogramming',
        brief: `${affirmations.length} ${isAr ? 'تأكيدات لترسيخ هويتك وأهدافك' : 'affirmation cards ready'}`,
        briefEn: `${affirmations.length} affirmation cards ready to anchor focus.`,
        description: isAr
          ? `اقرأ بطاقات التأكيدات الذهنية الخاصة بك (${affirmations.length} بطاقة متوفرة) لبرمجة عقلك الباطن وبدء يومك بثقة وطاقة إيجابية عالية.`
          : `Run through your ${affirmations.length} affirmations flashcards to prime your subconscious mind for discipline and high performance.`,
        descriptionEn: `Run through your ${affirmations.length} affirmations flashcards to prime your subconscious mind for discipline and high performance.`,
        timeTag: isAr ? 'صباحاً / في أي وقت' : 'Anytime',
        badge: `${affirmations.length} ${isAr ? 'بطاقات' : 'cards'}`,
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
        targetModule: 'reflections',
        targetTab: 'affirmations',
        actionText: 'فتح بطاقات التأكيدات',
        actionTextEn: 'Read Affirmations Deck',
      });
    }

    // 7. Visualization Story Check
    if (visions.length > 0) {
      const storyTitle = visions[0]?.title || (isAr ? 'قصة المستقبل' : 'Vision Story');
      list.push({
        id: 'vision-story',
        category: 'mindset',
        icon: <Compass className="w-4 h-4" />,
        iconBg: 'bg-teal-500/15 border border-teal-500/30',
        iconColor: 'text-teal-500',
        title: 'التصور الذهني والقصة المستقبلية',
        titleEn: 'Visualization & Vision Story',
        subtitle: isAr ? 'التخيل الإبداعي' : 'Mental Rehearsal',
        brief: `${storyTitle}...`,
        briefEn: `${storyTitle}...`,
        description: isAr
          ? `جلسة تخيل ذهني قصيرة: استحضر مشهد نجاحك في (${storyTitle}). عيش المشاعر والتفاصيل لبرمجة تركيزك وإشعال الحافز الداخلي.`
          : `Spend 3 minutes visually experiencing your outcome in (${storyTitle}). Sensory rehearsal builds deep confidence and clears resistance.`,
        descriptionEn: 'Spend 3 minutes visually experiencing your outcome. Sensory rehearsal builds deep confidence and clears resistance.',
        timeTag: isAr ? '3-5 دقائق' : '3-5 mins',
        badge: isAr ? 'رؤية مستقبلية' : 'Visualization',
        badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
        targetModule: 'reflections',
        targetTab: 'visions',
        actionText: 'بدء جلسة التصور الآن',
        actionTextEn: 'Open Vision Reader',
      });
    }

    return list;
  }, [reviews, tasks, habits, affirmations, visions, todayStr, isAr]);

  // Filter out dismissed items
  const activeNotifications = useMemo(() => {
    return rawNotifications.filter((item) => !dismissedIds.includes(item.id));
  }, [rawNotifications, dismissedIds]);

  // Tab filtered notifications
  const displayedNotifications = useMemo(() => {
    if (filterTab === 'urgent') {
      return activeNotifications.filter((n) => n.category === 'urgent');
    }
    if (filterTab === 'routine') {
      return activeNotifications.filter((n) => n.category === 'routine' || n.category === 'mindset');
    }
    return activeNotifications;
  }, [activeNotifications, filterTab]);

  // Execute navigation (single button click or double-click on card)
  const handleExecute = (item: SmartNotificationItem) => {
    onNavigate(item.targetModule, {
      tab: item.targetTab,
      filter: item.targetFilter,
    });
    onClose();
  };

  // Toggle card expansion (single click)
  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Handle double click on card
  const handleDoubleClick = (item: SmartNotificationItem) => {
    handleExecute(item);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Drawer Panel: Right-docked phone-like notification center */}
      <div 
        className={`fixed inset-y-0 ${
          isAr ? 'left-0 sm:left-auto sm:right-0' : 'right-0'
        } w-full sm:w-[440px] bg-white dark:bg-[#15171C] border-l border-neutral-200/80 dark:border-neutral-800 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out`}
      >
        {/* Header (Phone OS Notification Center Style) */}
        <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#1A1C23]/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-3xs">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white tracking-tight">
                    {isAr ? 'مركز الإجراءات والتنبيهات' : 'Action Notification Center'}
                  </h2>
                  {activeNotifications.length > 0 && (
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-3xs">
                      {activeNotifications.length}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500">
                  {isAr ? 'مهام وعادات ومحطات تنتظر اهتمامك اليوم' : 'Daily actions and reminders requiring your attention'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition cursor-pointer"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Pills + Clear All button */}
          <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80">
            <div className="flex items-center gap-1 bg-neutral-200/60 dark:bg-[#20232B] p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-[#2D3139] text-neutral-900 dark:text-white shadow-3xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'الكل' : 'All'} ({activeNotifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('urgent')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  filterTab === 'urgent'
                    ? 'bg-amber-500 text-white shadow-3xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'عاجل' : 'Urgent'}
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('routine')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  filterTab === 'routine'
                    ? 'bg-sky-500 text-white shadow-3xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'الروتين والذهن' : 'Routine'}
              </button>
            </div>

            {activeNotifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-bold text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 px-2 py-1 rounded-lg transition cursor-pointer"
                title={isAr ? 'إخفاء كافة التنبيهات لليوم' : 'Clear all notifications for today'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'مسح الكل' : 'Clear All'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {displayedNotifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-neutral-900 dark:text-white">
                  {isAr ? 'كل شيء منجز وتحت السيطرة!' : 'All clear! Everything logged.'}
                </h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-[260px] leading-relaxed">
                  {isAr
                    ? 'لا توجد تنبيهات معلقة لليوم. استمر بنفس الزخم والتركيز.'
                    : 'No pending actions right now. Keep up the high execution cadence.'}
                </p>
              </div>
            </div>
          ) : (
            displayedNotifications.map((item) => {
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => toggleExpand(item.id)}
                  onDoubleClick={() => handleDoubleClick(item)}
                  className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    isExpanded
                      ? 'bg-neutral-50/90 dark:bg-[#1D2028] border-neutral-300 dark:border-neutral-700 shadow-md ring-1 ring-neutral-300 dark:ring-neutral-700'
                      : 'bg-white dark:bg-[#181A21] border-neutral-200/80 dark:border-neutral-800/90 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs'
                  }`}
                >
                  {/* Card Header (Compact Mobile Notification Preview) */}
                  <div className="p-3.5 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left Icon + Title & Preview */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor} shadow-3xs`}
                        >
                          {item.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">
                              {isAr ? item.title : item.titleEn}
                            </h3>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1 leading-relaxed">
                            {isAr ? item.brief : item.briefEn}
                          </p>

                          <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              <span>{item.timeTag}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Expand Arrow + Dismiss 'X' Button */}
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(item.id, e)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition cursor-pointer"
                          title={isAr ? 'إخفاء التنبيه' : 'Dismiss'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="text-neutral-400 p-1">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Tray */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-neutral-200/70 dark:border-neutral-800 text-xs space-y-3 animate-fadeIn">
                        <div className="p-3 rounded-xl bg-white/70 dark:bg-[#14161C]/70 border border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {isAr ? item.description : item.descriptionEn}
                        </div>

                        {/* Quick hint & Direct Action Button */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                          <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                            <span>💡</span>
                            <span>
                              {isAr
                                ? 'نقرة مزدوجة (Double-Click) للدخول المباشر'
                                : 'Double-click anywhere on card to jump directly'}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecute(item);
                            }}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-sm transition-all cursor-pointer"
                          >
                            <span>{isAr ? item.actionText : item.actionTextEn}</span>
                            <ArrowIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & keyboard hint */}
        <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#1A1C23]/60 text-center">
          <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
            {isAr
              ? '✨ نقرة واحدة للتوسيع • نقرة مزدوجة للدخول المباشر • اضغط × لمسح التنبيه'
              : '✨ Click to expand • Double-click to jump directly • Press × to clear'}
          </p>
        </div>
      </div>
    </div>
  );
};
