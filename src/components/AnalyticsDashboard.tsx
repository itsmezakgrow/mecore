import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  CheckSquare,
  Award,
  Calendar,
  Layers,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  Sparkles,
  Zap,
  Target,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Compass,
  Monitor,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  FolderKanban,
  Timer,
  Trash2,
  BookOpen,
  FileText,
  Lock,
  Unlock,
  Star,
  ShieldAlert,
  AlertCircle,
  Dumbbell,
  History,
  Moon,
  Eye,
  EyeOff,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { TaskItem, HabitItem, ProjectItem, WeeklyPlanSlot, ChecklistGroup, GoalItem, ModuleType, FocusSession, ReviewEntry, DailyBlockItem, WorkoutSession, ModuleLifecycleEvent, DailySleepLog } from '../types';
import { deleteFocusSession } from '../services/firestoreService';
import { getDisabledModules, getModuleLifecycleHistory, ALL_CONTROLLABLE_MODULES } from '../utils/moduleLifecycle';

interface AnalyticsDashboardProps {
  tasks: TaskItem[];
  habits: HabitItem[];
  projects: ProjectItem[];
  plans: WeeklyPlanSlot[];
  checklists: ChecklistGroup[];
  goals: GoalItem[];
  focusSessions?: FocusSession[];
  reviews?: ReviewEntry[];
  dailyBlocks?: DailyBlockItem[];
  workouts?: WorkoutSession[];
  sleepLogs?: DailySleepLog[];
  moduleLifecycleEvents?: ModuleLifecycleEvent[];
  appStartDate?: string;
  onOpenReviewModal?: (tab: 'weekly' | 'monthly' | 'archive') => void;
  onNavigateModule: (module: ModuleType) => void;
  initialTab?: 'overview' | 'habits' | 'tasks' | 'focus' | 'sleep' | 'blocks' | 'reviews' | 'goals';
}

const CustomCorrelationTooltip = ({ active, payload, isAr }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-[#1E2025] border border-neutral-200 dark:border-neutral-700 p-3.5 rounded-2xl shadow-xl space-y-2 text-xs min-w-48 text-start">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
          <Calendar size={13} className="text-blue-500" />
          <span>{data.fullDate || data.label}</span>
        </span>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
          {data.composite}% {isAr ? 'المحصلة' : 'Index'}
        </span>
      </div>

      <div className="space-y-1.5 font-mono text-[11px]">
        {payload.map((entry: any) => {
          let rawVal = '';
          if (entry.dataKey === 'habits') rawVal = data.habitsRaw;
          else if (entry.dataKey === 'tasks') rawVal = `${data.tasksRaw} ${isAr ? 'مكتمل' : 'done'}`;
          else if (entry.dataKey === 'focus') rawVal = data.focusRaw;
          else if (entry.dataKey === 'sleep') rawVal = data.sleepRaw;
          else if (entry.dataKey === 'rating') rawVal = data.ratingRaw;
          else if (entry.dataKey === 'blocks') rawVal = data.blocksRaw;

          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-sans">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-neutral-900 dark:text-white">{entry.value}%</span>
                {rawVal && <span className="text-neutral-400 text-[10px]">({rawVal})</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  tasks,
  habits,
  projects,
  plans,
  checklists,
  goals,
  focusSessions = [],
  reviews = [],
  dailyBlocks = [],
  workouts = [],
  sleepLogs = [],
  moduleLifecycleEvents = [],
  appStartDate,
  onOpenReviewModal,
  onNavigateModule,
  lang = 'en',
  initialTab = 'overview',
}) => {
  const isAr = lang === 'ar';
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'habits' | 'tasks' | 'focus' | 'sleep' | 'blocks' | 'reviews' | 'goals'>(initialTab as any);
  const [focusStatsPeriod, setFocusStatsPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');

  // Executive Multi-Trend Scope & Timeframe controls
  const [timeScope, setTimeScope] = useState<'week' | 'month' | 'year' | 'all'>('week');
  const [scopeOffset, setScopeOffset] = useState<number>(0);
  const [visibleLines, setVisibleLines] = useState<{
    habits: boolean;
    tasks: boolean;
    focus: boolean;
    sleep: boolean;
    rating: boolean;
    blocks: boolean;
  }>({
    habits: true,
    tasks: true,
    focus: true,
    sleep: true,
    rating: true,
    blocks: true,
  });

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Periodic Review & Audit status calculations
  const reviewStatus = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Week key calculation (e.g. 2026-W41)
    const firstJan = new Date(year, 0, 1);
    const dayNr = Math.ceil((today.getTime() - firstJan.getTime()) / 86400000);
    const weekNr = Math.ceil((dayNr + firstJan.getDay()) / 7);
    const currentWeekKey = `${year}-W${weekNr.toString().padStart(2, '0')}`;
    
    // Month key calculation (e.g. 2026-10)
    const currentMonthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;

    // Grace period & start date calculation
    const startDateStr = appStartDate || (typeof window !== 'undefined' ? localStorage.getItem('app_start_date') : null);
    let startDate = startDateStr ? new Date(startDateStr) : new Date();
    if (isNaN(startDate.getTime())) startDate = new Date();

    const daysSinceStart = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const isInGracePeriod = daysSinceStart < 7;

    // Check completion status from reviews array
    const hasCompletedWeekly = reviews.some(r => r.type === 'weekly' && r.periodKey === currentWeekKey);
    const hasCompletedMonthly = reviews.some(r => r.type === 'monthly' && r.periodKey === currentMonthKey);

    // Week-end check (Saturday after 12pm, Sunday, Monday, or >= 6 days elapsed)
    const dayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat, 1 = Mon
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    const isMonday = dayOfWeek === 1;
    const isWeeklyWindow = isSaturday || isSunday || isMonday || daysSinceStart >= 6;

    // Month-end check (Last 3 days of the month or day >= 27 or >= 28 days elapsed)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDay = today.getDate();
    const isMonthEnd = currentDay >= (daysInMonth - 3) || daysSinceStart >= 28;
    const daysLeftToMonth = Math.max(0, (daysInMonth - 3) - currentDay);

    return {
      currentWeekKey,
      currentMonthKey,
      hasCompletedWeekly,
      hasCompletedMonthly,
      isInGracePeriod,
      isWeeklyWindow,
      isMonthEnd,
      daysLeftToMonth,
      daysInMonth,
      currentDay,
      daysSinceStart,
      completedWeeklyCount: reviews.filter(r => r.type === 'weekly').length,
      completedMonthlyCount: reviews.filter(r => r.type === 'monthly').length,
      recentReviews: [...reviews].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4)
    };
  }, [reviews, appStartDate]);

  // ----------------------------------------------------
  // Executive Multi-Line Timeline Engine (Past Data, Scopes, Multi-Metric Trends)
  // ----------------------------------------------------
  const executiveTimeline = useMemo(() => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    // 1. Inception Date (Clean start date or App start date)
    const storedCleanStart = typeof window !== 'undefined' ? localStorage.getItem('app_clean_start_date') : null;
    const storedAppStart = typeof window !== 'undefined' ? localStorage.getItem('app_start_date') : null;
    const startStr = storedCleanStart || (appStartDate ? (appStartDate.includes('T') ? appStartDate.split('T')[0] : appStartDate) : (storedAppStart ? storedAppStart.split('T')[0] : todayIso));
    let inceptionDate = new Date(startStr);
    if (isNaN(inceptionDate.getTime())) inceptionDate = new Date();
    const inceptionIso = inceptionDate.toISOString().split('T')[0];
    const daysSinceInception = Math.max(0, Math.floor((today.getTime() - inceptionDate.getTime()) / (1000 * 60 * 60 * 24))) + 1;

    // Helper to format Date to YYYY-MM-DD
    const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // 2. Generate Date Array based on timeScope and scopeOffset
    let datesToInspect: { dateIso: string; label: string; fullDate: string }[] = [];
    let periodLabel = '';
    const isCurrentPeriod = scopeOffset === 0;

    if (timeScope === 'week') {
      const currentDayOfWeek = (today.getDay() + 6) % 7; // Mon=0, Sun=6
      const baseMonday = new Date(today);
      baseMonday.setDate(today.getDate() - currentDayOfWeek + (scopeOffset * 7));

      const weekDates: { dateIso: string; label: string; fullDate: string }[] = [];
      const arDays = ['إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد'];
      const enDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(baseMonday);
        d.setDate(baseMonday.getDate() + i);
        const iso = toIso(d);
        const dayLabel = isAr ? arDays[i] : enDays[i];
        weekDates.push({
          dateIso: iso,
          label: `${dayLabel} ${d.getDate()}`,
          fullDate: d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        });
      }
      datesToInspect = weekDates;

      const sunday = new Date(baseMonday);
      sunday.setDate(baseMonday.getDate() + 6);
      periodLabel = isAr
        ? (scopeOffset === 0 ? 'هذا الأسبوع' : scopeOffset === -1 ? 'الأسبوع الماضي' : `أسبوع (${baseMonday.getDate()} - ${sunday.getDate()} ${sunday.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' })})`)
        : (scopeOffset === 0 ? 'This Week' : scopeOffset === -1 ? 'Last Week' : `Week of ${baseMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);

    } else if (timeScope === 'month') {
      const targetMonthDate = new Date(today.getFullYear(), today.getMonth() + scopeOffset, 1);
      const targetYear = targetMonthDate.getFullYear();
      const targetMonth = targetMonthDate.getMonth();
      const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInTargetMonth; day++) {
        const d = new Date(targetYear, targetMonth, day);
        const iso = toIso(d);
        datesToInspect.push({
          dateIso: iso,
          label: day % 3 === 1 || day === daysInTargetMonth ? String(day) : '',
          fullDate: d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }

      periodLabel = isAr
        ? (scopeOffset === 0 ? `هذا الشهر (${targetMonthDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })})` : targetMonthDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }))
        : (scopeOffset === 0 ? `This Month (${targetMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})` : targetMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

    } else if (timeScope === 'year') {
      const targetYear = today.getFullYear() + scopeOffset;
      const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let m = 0; m < 12; m++) {
        datesToInspect.push({
          dateIso: `${targetYear}-${String(m + 1).padStart(2, '0')}`,
          label: isAr ? arMonths[m] : enMonths[m],
          fullDate: `${isAr ? arMonths[m] : enMonths[m]} ${targetYear}`
        });
      }

      periodLabel = isAr ? `عام ${targetYear}` : `Year ${targetYear}`;

    } else {
      // 'all' time - from inceptionDate to today
      const diffDays = Math.max(1, Math.min(365, Math.ceil((today.getTime() - inceptionDate.getTime()) / (1000 * 60 * 60 * 24))));
      const step = diffDays <= 14 ? 1 : diffDays <= 45 ? 2 : Math.ceil(diffDays / 20);

      for (let i = 0; i < diffDays; i += step) {
        const d = new Date(inceptionDate);
        d.setDate(inceptionDate.getDate() + i);
        if (d > today) break;
        const iso = toIso(d);
        datesToInspect.push({
          dateIso: iso,
          label: d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'numeric', day: 'numeric' }),
          fullDate: d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
      if (datesToInspect.length === 0 || datesToInspect[datesToInspect.length - 1].dateIso !== todayIso) {
        datesToInspect.push({
          dateIso: todayIso,
          label: isAr ? 'اليوم' : 'Today',
          fullDate: today.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }

      periodLabel = isAr ? `منذ البداية (${inceptionIso})` : `Since Launch (${inceptionIso})`;
    }

    // 3. Populate metrics for each date point
    const activeHabits = habits.filter(h => !h.archived);
    let totalHabitsChecked = 0;
    let totalTasksDoneInPeriod = 0;
    let totalFocusMinsInPeriod = 0;
    let totalSleepHoursInPeriod = 0;
    let sleepLogCountInPeriod = 0;
    let sleepTargetMetCount = 0;
    let reflectionRatingSum = 0;
    let reflectionCount = 0;

    const timelineData = datesToInspect.map((pt) => {
      const isYearScope = timeScope === 'year';
      const datePrefix = pt.dateIso;

      // A. HABITS SCORE
      let habitsPct = 0;
      let habitsRaw = '0/0';
      if (isYearScope) {
        let monthChecked = 0;
        let monthPossible = 0;
        activeHabits.forEach(h => {
          if (h.history) {
            Object.keys(h.history).forEach(k => {
              if (k.startsWith(datePrefix)) {
                monthPossible++;
                if (h.history[k]) monthChecked++;
              }
            });
          }
        });
        habitsPct = monthPossible > 0 ? Math.round((monthChecked / monthPossible) * 100) : (activeHabits.length > 0 ? 50 : 0);
        habitsRaw = `${habitsPct}%`;
      } else {
        const doneCount = activeHabits.filter(h => Boolean(h.history?.[datePrefix] || h.completedDates?.includes(datePrefix))).length;
        habitsPct = activeHabits.length > 0 ? Math.round((doneCount / activeHabits.length) * 100) : 0;
        habitsRaw = `${doneCount}/${activeHabits.length}`;
        totalHabitsChecked += doneCount;
      }

      // B. TASKS SCORE
      let tasksPct = 0;
      let tasksRaw = '0';
      if (isYearScope) {
        const tasksInMonth = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toISOString().split('T')[0].startsWith(datePrefix)).length;
        tasksPct = Math.min(100, tasksInMonth * 10);
        tasksRaw = `${tasksInMonth}`;
        totalTasksDoneInPeriod += tasksInMonth;
      } else {
        const tasksOnDay = tasks.filter(t => {
          if (!t.completed) return false;
          if (t.completedAt) {
            return new Date(t.completedAt).toISOString().split('T')[0] === datePrefix;
          }
          return datePrefix === todayIso;
        }).length;
        tasksPct = Math.min(100, tasksOnDay * 25);
        tasksRaw = `${tasksOnDay}`;
        totalTasksDoneInPeriod += tasksOnDay;
      }

      // C. FOCUS SCORE
      let focusMins = 0;
      if (isYearScope) {
        focusMins = focusSessions
          .filter(f => f.date && f.date.startsWith(datePrefix))
          .reduce((sum, f) => sum + (f.duration || 0), 0);
      } else {
        focusMins = focusSessions
          .filter(f => f.date === datePrefix)
          .reduce((sum, f) => sum + (f.duration || 0), 0);
      }
      totalFocusMinsInPeriod += focusMins;
      const targetMins = isYearScope ? 2400 : 180;
      const focusPct = Math.min(100, Math.round((focusMins / targetMins) * 100));
      const focusHours = (focusMins / 60).toFixed(1);
      const focusRaw = `${focusHours}h`;

      // D. SLEEP SCORE
      let sleepPct: number = 75;
      let sleepRaw = '-';
      if (isYearScope) {
        const monthLogs = (sleepLogs || []).filter(l => l.date && l.date.startsWith(datePrefix));
        if (monthLogs.length > 0) {
          const avgMins = monthLogs.reduce((s, l) => s + (l.sleepDurationMinutes || 480), 0) / monthLogs.length;
          const avgHours = avgMins / 60;
          sleepPct = Math.min(100, Math.round((avgHours / 8) * 100));
          sleepRaw = `${avgHours.toFixed(1)}h`;
        }
      } else {
        const sLog = (sleepLogs || []).find(l => l.date === datePrefix);
        if (sLog) {
          const sHours = sLog.sleepDurationMinutes ? sLog.sleepDurationMinutes / 60 : 8;
          sleepPct = sLog.wokeOnTarget && sLog.sleptOnTarget ? 100 : sLog.wokeOnTarget || sLog.sleptOnTarget ? 85 : Math.min(100, Math.round((sHours / 8) * 100));
          sleepRaw = `${sHours.toFixed(1)}h`;
          totalSleepHoursInPeriod += sHours;
          sleepLogCountInPeriod++;
          if (sLog.wokeOnTarget || sLog.sleptOnTarget) sleepTargetMetCount++;
        } else {
          sleepPct = 0;
          sleepRaw = '-';
        }
      }

      // E. RATING / REFLECTION SCORE
      let ratingPct: number = 0;
      let ratingRaw = '-';
      const ref = reviews.find(r => r.periodKey === datePrefix || (r.type === 'daily' && r.periodKey === datePrefix));
      if (ref && ref.rating) {
        ratingPct = Math.min(100, ref.rating * 10);
        ratingRaw = `${ref.rating}/10`;
        reflectionRatingSum += ref.rating;
        reflectionCount++;
      }

      // F. DAILY BLOCKS SCORE
      let blocksPct = 0;
      let blocksRaw = '-';
      const dBlocks = dailyBlocks.filter(b => b.date === datePrefix);
      if (dBlocks.length > 0) {
        const comp = dBlocks.filter(b => b.status === 'completed').length;
        blocksPct = Math.round((comp / dBlocks.length) * 100);
        blocksRaw = `${comp}/${dBlocks.length}`;
      }

      // G. COMPOSITE EXECUTIVE SCORE
      const hasAnyData = activeHabits.length > 0 || tasks.length > 0 || focusMins > 0 || sleepLogCountInPeriod > 0 || dBlocks.length > 0 || Boolean(ref);
      const compositeScore = hasAnyData
        ? Math.round(
            (activeHabits.length > 0 ? habitsPct * 0.30 : 0) +
            (tasks.length > 0 ? tasksPct * 0.25 : 0) +
            (focusMins > 0 ? focusPct * 0.20 : 0) +
            (sleepLogCountInPeriod > 0 ? sleepPct * 0.15 : 0) +
            (dBlocks.length > 0 ? blocksPct * 0.10 : 0)
          )
        : 0;

      return {
        key: pt.dateIso,
        label: pt.label,
        fullDate: pt.fullDate,
        dateIso: pt.dateIso,
        habits: habitsPct,
        habitsRaw,
        tasks: tasksPct,
        tasksRaw,
        focus: focusPct,
        focusRaw,
        sleep: sleepPct,
        sleepRaw,
        rating: ratingPct,
        ratingRaw,
        blocks: blocksPct,
        blocksRaw,
        composite: compositeScore,
      };
    });

    const totalDaysCount = Math.max(1, timelineData.length);
    const avgHabitsRate = activeHabits.length > 0 ? Math.round(timelineData.reduce((acc, d) => acc + d.habits, 0) / totalDaysCount) : 0;
    const tasksVelocityRate = Math.round(timelineData.reduce((acc, d) => acc + d.tasks, 0) / totalDaysCount);
    const focusRate = Math.round(timelineData.reduce((acc, d) => acc + d.focus, 0) / totalDaysCount);
    const avgSleepRate = sleepLogCountInPeriod > 0 ? Math.round((totalSleepHoursInPeriod / sleepLogCountInPeriod) * 10) / 10 : 0;
    const sleepAdherenceRate = sleepLogCountInPeriod > 0 ? Math.round((sleepTargetMetCount / sleepLogCountInPeriod) * 100) : 0;
    const totalFocusHours = (totalFocusMinsInPeriod / 60).toFixed(1);
    const avgRating = reflectionCount > 0 ? (reflectionRatingSum / reflectionCount).toFixed(1) : '-';
    const ratingPct = reflectionCount > 0 ? Math.round(timelineData.reduce((acc, d) => acc + d.rating, 0) / totalDaysCount) : 0;
    const blocksRate = dailyBlocks.length > 0 ? Math.round(timelineData.reduce((acc, d) => acc + d.blocks, 0) / totalDaysCount) : 0;
    const totalBlocksInPeriod = dailyBlocks.filter(b => datesToInspect.some(d => d.dateIso === b.date)).length;
    const completedBlocksInPeriod = dailyBlocks.filter(b => b.status === 'completed' && datesToInspect.some(d => d.dateIso === b.date)).length;
    const overallVelocityRate = Math.round(timelineData.reduce((acc, d) => acc + d.composite, 0) / totalDaysCount);

    return {
      timelineData,
      periodLabel,
      isCurrentPeriod,
      inceptionIso,
      daysSinceInception,
      summary: {
        avgHabitsRate,
        tasksVelocityRate,
        totalTasksDoneInPeriod,
        focusRate,
        totalFocusHours,
        avgSleepRate,
        sleepAdherenceRate,
        blocksRate,
        totalBlocksInPeriod,
        completedBlocksInPeriod,
        avgRating,
        ratingPct,
        overallVelocityRate,
      }
    };
  }, [timeScope, scopeOffset, habits, tasks, focusSessions, sleepLogs, reviews, dailyBlocks, appStartDate, isAr, todayStr]);

  // ----------------------------------------------------
  // Executive Performance Index (Clean Quantitative Metric Engine)
  // ----------------------------------------------------
  const executiveMetrics = useMemo(() => {
    // 1. Discipline (Habit Completion & Streak Continuity)
    let disciplineScore = 0;
    if (habits.length > 0) {
      const avgStreak = habits.reduce((acc, h) => acc + (h.streak || 0), 0) / habits.length;
      let totalCompletions = 0;
      habits.forEach(h => {
        if (h.history) {
          totalCompletions += Object.values(h.history).filter(Boolean).length;
        }
      });
      const todayDone = habits.filter(h => h.history?.[todayStr]).length;
      const todayRatio = todayDone / habits.length;

      // Pure ratio and streak progress, scaling dynamically to 100
      const completionFactor = todayRatio * 50 + Math.min(50, totalCompletions * 5);
      const streakFactor = Math.min(50, avgStreak * 10);
      disciplineScore = Math.min(100, Math.round(completionFactor + streakFactor));
    }

    // 2. Velocity (Task Execution Rate & High-Priority Throughput)
    let velocityScore = 0;
    if (tasks.length > 0) {
      const completedCount = tasks.filter(t => t.completed).length;
      const highPriorityTasks = tasks.filter(t => t.priority === 'High');
      const highPriorityDone = highPriorityTasks.filter(t => t.completed).length;

      const compRate = completedCount / tasks.length;
      const hpRate = highPriorityTasks.length > 0 ? highPriorityDone / highPriorityTasks.length : 1;

      // General task completion weighted at 70%, high-priority execution weighted at 30%
      velocityScore = Math.min(100, Math.round(compRate * 70 + (compRate > 0 ? hpRate * 30 : 0)));
    }

    // 3. Focus (Scheduled Deep Work Slots & Time Execution)
    let focusScore = 0;
    if (plans.length > 0) {
      const compPlans = plans.filter(p => p.completed).length;
      const planRatio = compPlans / plans.length;

      const deepWorkPlans = plans.filter(p => p.type === 'deep-work');
      const compDeepWork = deepWorkPlans.filter(p => p.completed).length;
      const deepWorkRatio = deepWorkPlans.length > 0 ? compDeepWork / deepWorkPlans.length : 1;

      // Schedule adherence weighted at 60%, deep-work focus execution weighted at 40%
      focusScore = Math.min(100, Math.round(planRatio * 60 + (planRatio > 0 ? deepWorkRatio * 40 : 0)));
    }

    // 4. Strategic Alignment (Goal Progress & Milestone Velocity)
    let strategyScore = 0;
    if (goals.length > 0) {
      let totalMilestones = 0;
      let compMilestones = 0;
      goals.forEach(g => {
        (g.milestones || []).forEach(m => {
          totalMilestones++;
          if (m.completed) compMilestones++;
        });
      });
      const milestoneRate = totalMilestones > 0 ? compMilestones / totalMilestones : 0;
      const activeGoals = goals.filter(g => g.status !== 'Draft');
      const onTrackCount = activeGoals.filter(g => g.status === 'On Track' || g.status === 'Achieved').length;
      const onTrackRate = activeGoals.length > 0 ? onTrackCount / activeGoals.length : 0;

      // Milestone completion weighted at 60%, strategic goal health weighted at 40%
      strategyScore = Math.min(100, Math.round(milestoneRate * 60 + onTrackRate * 40));
    }

    // 5. Systems Mastery (SOP Checklist Execution & Project Delivery)
    let masteryScore = 0;
    const allChecks = checklists.reduce((acc, c) => acc + (c.items?.length || 0), 0);
    const compChecks = checklists.reduce((acc, c) => acc + (c.items?.filter(i => i.completed).length || 0), 0);
    const checkRate = allChecks > 0 ? compChecks / allChecks : 0;

    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const projectRate = totalProjects > 0 ? completedProjects / totalProjects : 0;

    if (allChecks > 0 || totalProjects > 0) {
      // SOP adherence weighted at 60%, project delivery weighted at 40%
      masteryScore = Math.min(100, Math.round(checkRate * 60 + projectRate * 40));
    }

    // 6. Consistency / Momentum (Longest Active Streak)
    const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
    const momentumScore = habits.length > 0 ? Math.min(100, Math.round(maxStreak * 10)) : 0;

    // 7. Daily Blocks Execution
    let blocksScore = 0;
    if (dailyBlocks.length > 0) {
      const compBlocks = dailyBlocks.filter(b => b.status === 'completed').length;
      blocksScore = Math.round((compBlocks / dailyBlocks.length) * 100);
    } else {
      blocksScore = 100;
    }

    // Dynamic Module Weights: Excludes disabled modules so there is ZERO PENALTY for turned-off features!
    const disabled = getDisabledModules();
    const scoreItems: { key: ModuleType; subject: string; score: number; defaultWeight: number; isPaused: boolean }[] = [
      { key: 'daily-blocks', subject: isAr ? 'فترات اليوم' : 'Daily Blocks', score: blocksScore, defaultWeight: 0.20, isPaused: disabled.includes('daily-blocks') },
      { key: 'tasks', subject: isAr ? 'سرعة المهام' : 'Task Velocity', score: velocityScore, defaultWeight: 0.20, isPaused: disabled.includes('tasks') },
      { key: 'focus', subject: isAr ? 'التركيز العميق' : 'Deep Focus', score: focusScore, defaultWeight: 0.18, isPaused: disabled.includes('focus') },
      { key: 'habits', subject: isAr ? 'الانضباط والعادات' : 'Habit Discipline', score: disciplineScore, defaultWeight: 0.18, isPaused: disabled.includes('habits') },
      { key: 'goals', subject: isAr ? 'الأهداف والاستراتيجية' : 'Goals & Strategy', score: strategyScore, defaultWeight: 0.14, isPaused: disabled.includes('goals') },
      { key: 'checklists', subject: isAr ? 'الأنظمة وإجراءات التشغيل' : 'Systems & SOPs', score: masteryScore, defaultWeight: 0.10, isPaused: disabled.includes('checklists') },
    ];

    const activeScoreItems = scoreItems.filter(item => !item.isPaused);
    const sumActiveWeights = activeScoreItems.reduce((acc, item) => acc + item.defaultWeight, 0) || 1;

    let weightedSum = 0;
    activeScoreItems.forEach(item => {
      weightedSum += item.score * (item.defaultWeight / sumActiveWeights);
    });

    const performanceIndex = Math.min(100, Math.round(weightedSum));

    const radarData = activeScoreItems.map(item => ({
      subject: item.subject,
      value: item.score,
      fullMark: 100
    }));

    return {
      performanceIndex,
      disciplineScore,
      velocityScore,
      focusScore,
      strategyScore,
      masteryScore,
      momentumScore,
      blocksScore,
      scoreItems,
      radarData,
      disabledModulesList: disabled,
    };
  }, [habits, tasks, plans, goals, projects, checklists, dailyBlocks, todayStr, isAr]);

  // Daily Blocks Metrics Engine
  const dailyBlocksMetrics = useMemo(() => {
    const total = dailyBlocks.length;
    const completed = dailyBlocks.filter(b => b.status === 'completed').length;
    const inProgress = dailyBlocks.filter(b => b.status === 'in_progress').length;
    const deepWork = dailyBlocks.filter(b => b.blockType === 'deep-work').length;
    const recharge = dailyBlocks.filter(b => b.blockType === 'recharge').length;
    const fitness = dailyBlocks.filter(b => b.blockType === 'fitness').length;
    const execution = dailyBlocks.filter(b => b.blockType === 'execution').length;

    const plannedFocusMins = dailyBlocks.reduce((a, b) => a + (b.targetFocusMinutes || 0), 0);
    const loggedFocusMins = dailyBlocks.reduce((a, b) => a + (b.focusMinutesLogged || 0), 0);
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const blockTypeBreakdown = [
      { name: isAr ? 'تركيز عميق' : 'Deep Work', value: deepWork, color: '#10B981' },
      { name: isAr ? 'تنفيذ ومهام' : 'Execution', value: execution, color: '#6366F1' },
      { name: isAr ? 'راحة وتغذية' : 'Recharge', value: recharge, color: '#06B6D4' },
      { name: isAr ? 'رياضة ولياقة' : 'Fitness', value: fitness, color: '#F43F5E' },
    ].filter(d => d.value > 0);

    return {
      total,
      completed,
      inProgress,
      deepWork,
      plannedFocusMins,
      loggedFocusMins,
      completionPct,
      blockTypeBreakdown
    };
  }, [dailyBlocks, isAr]);

  // Workout Telemetry Engine
  const workoutMetrics = useMemo(() => {
    const totalSessions = workouts.length;
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    workouts.forEach(w => {
      totalVolume += w.totalVolume || 0;
      totalSets += w.totalSets || 0;
      totalReps += w.totalReps || 0;
    });
    return {
      totalSessions,
      totalVolume,
      totalSets,
      totalReps,
      recent: [...workouts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
    };
  }, [workouts]);

  // Effective Lifecycle History
  const effectiveLifecycleHistory = useMemo(() => {
    if (moduleLifecycleEvents && moduleLifecycleEvents.length > 0) {
      return moduleLifecycleEvents;
    }
    return getModuleLifecycleHistory();
  }, [moduleLifecycleEvents]);

  // Habit Trend Timeline
  const habitTrendData = useMemo(() => {
    const daysToShow = timeframe === '7d' ? 7 : timeframe === '30d' ? 14 : 28;
    const result: { date: string; display: string; rate: number; count: number; total: number }[] = [];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoStr = d.toISOString().split('T')[0];
      const monthNames = isAr
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const display = isAr ? `${d.getDate()} ${monthNames[d.getMonth()]}` : `${monthNames[d.getMonth()]} ${d.getDate()}`;

      let completedCount = 0;
      habits.forEach(h => {
        if (h.history && h.history[isoStr]) {
          completedCount++;
        }
      });

      const total = habits.length || 1;
      const rate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
      result.push({
        date: isoStr,
        display,
        rate,
        count: completedCount,
        total: habits.length,
      });
    }
    return result;
  }, [habits, timeframe, isAr]);

  // Task Priority Data
  const taskPriorityData = useMemo(() => {
    const high = tasks.filter(t => t.priority === 'High');
    const med = tasks.filter(t => t.priority === 'Med');
    const low = tasks.filter(t => t.priority === 'Low');

    return [
      { name: isAr ? 'أولوية عالية' : 'High Priority', total: high.length, completed: high.filter(t => t.completed).length, color: '#DC2626' },
      { name: isAr ? 'أولوية متوسطة' : 'Medium Priority', total: med.length, completed: med.filter(t => t.completed).length, color: '#D97706' },
      { name: isAr ? 'أولوية منخفضة' : 'Low Priority', total: low.length, completed: low.filter(t => t.completed).length, color: '#2563EB' },
    ];
  }, [tasks, isAr]);

  // Task Category Allocation
  const taskCategoryDistribution = useMemo(() => {
    const counts: { [key: string]: number } = {};
    tasks.forEach(t => {
      let cat = t.category || 'General';
      if (isAr && cat === 'General') cat = 'عام';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const COLORS = ['#2F3437', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'];
    return Object.keys(counts).map((cat, idx) => ({
      name: cat,
      value: counts[cat],
      color: COLORS[idx % COLORS.length],
    }));
  }, [tasks, isAr]);

  // Goal Progress Data
  const goalsProgressData = useMemo(() => {
    return goals.map(g => {
      let percent = 0;
      if (g.targetMetric && g.targetMetric > 0 && g.currentMetric !== undefined) {
        percent = Math.min(100, Math.round((g.currentMetric / g.targetMetric) * 100));
      } else if (g.milestones && g.milestones.length > 0) {
        const comp = g.milestones.filter(m => m.completed).length;
        percent = Math.round((comp / g.milestones.length) * 100);
      } else {
        percent = g.status === 'Achieved' ? 100 : 20;
      }
      return {
        name: g.title.length > 22 ? g.title.substring(0, 20) + '...' : g.title,
        progress: percent,
        category: g.category,
        status: g.status,
      };
    });
  }, [goals]);

  // Focus & Deep Work Metrics
  const focusMetrics = useMemo(() => {
    const focusOnly = focusSessions.filter((s) => s.type === 'focus');
    const totalMinutes = focusOnly.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHours = Number((totalMinutes / 60).toFixed(1));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaySessions = focusOnly.filter((s) => s.createdAt >= startOfToday.getTime());
    const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const todayHours = Number((todayMinutes / 60).toFixed(1));

    // Project breakdown
    const projectMinutes: Record<string, { duration: number; title: string }> = {};
    let grandTotal = 0;
    focusOnly.forEach((s) => {
      const key = s.associatedId || 'general';
      const title = s.associatedTitle || (isAr ? 'جلسات عامة' : 'General Focus');
      if (!projectMinutes[key]) {
        projectMinutes[key] = { duration: 0, title };
      }
      projectMinutes[key].duration += s.duration;
      grandTotal += s.duration;
    });

    let topProject = '—';
    let maxMin = 0;
    Object.values(projectMinutes).forEach((p) => {
      if (p.duration > maxMin) {
        maxMin = p.duration;
        topProject = p.title;
      }
    });

    const projectDistribution = Object.entries(projectMinutes)
      .map(([id, info]) => ({
        id,
        title: info.title,
        duration: info.duration,
        hours: Number((info.duration / 60).toFixed(1)),
        percentage: grandTotal > 0 ? Math.round((info.duration / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.duration - a.duration);

    return {
      totalHours,
      totalMinutes,
      todayHours,
      todayMinutes,
      totalSessions: focusOnly.length,
      topProject,
      projectDistribution,
    };
  }, [focusSessions, isAr]);

  // Focus Trend Chart Data
  const focusTrendData = useMemo(() => {
    const focusOnly = focusSessions.filter((s) => s.type === 'focus');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (focusStatsPeriod === 'day') {
      const hourSlots = [
        { label: '00:00', start: 0, end: 4 },
        { label: '04:00', start: 4, end: 8 },
        { label: '08:00', start: 8, end: 12 },
        { label: '12:00', start: 12, end: 16 },
        { label: '16:00', start: 16, end: 20 },
        { label: '20:00', start: 20, end: 24 },
      ];
      return hourSlots.map((slot) => {
        let mins = 0;
        focusOnly.forEach((s) => {
          const sDate = new Date(s.createdAt);
          const sHour = sDate.getHours();
          if (sHour >= slot.start && sHour < slot.end) {
            mins += s.duration;
          }
        });
        return { name: slot.label, hours: Number((mins / 60).toFixed(2)) };
      });
    } else if (focusStatsPeriod === 'week') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
          dateStr: d.toISOString().split('T')[0],
          label: d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short' }),
        });
      }
      return days.map((day) => {
        let mins = 0;
        focusOnly.forEach((s) => {
          const sDateStr = new Date(s.createdAt).toISOString().split('T')[0];
          if (sDateStr === day.dateStr) {
            mins += s.duration;
          }
        });
        return { name: day.label, hours: Number((mins / 60).toFixed(2)) };
      });
    } else if (focusStatsPeriod === 'month') {
      const weeks = [
        { label: 'Wk 1', startAgo: 28, endAgo: 21 },
        { label: 'Wk 2', startAgo: 21, endAgo: 14 },
        { label: 'Wk 3', startAgo: 14, endAgo: 7 },
        { label: 'Wk 4', startAgo: 7, endAgo: 0 },
      ];
      return weeks.map((w) => {
        let mins = 0;
        focusOnly.forEach((s) => {
          const elapsed = (now - s.createdAt) / oneDay;
          if (elapsed >= w.endAgo && elapsed < w.startAgo) {
            mins += s.duration;
          }
        });
        return { name: w.label, hours: Number((mins / 60).toFixed(2)) };
      });
    } else {
      const months = isAr
        ? ['يناير', 'مارس', 'مايو', 'يوليو', 'سبتمبر', 'نوفمبر']
        : ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'];
      return months.map((m, idx) => {
        let mins = 0;
        focusOnly.forEach((s) => {
          const sDate = new Date(s.createdAt);
          if (sDate.getMonth() === idx * 2) {
            mins += s.duration;
          }
        });
        return { name: m, hours: Number((mins / 60).toFixed(2)) };
      });
    }
  }, [focusSessions, focusStatsPeriod, isAr]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Mobile Priority Notice Banner (Explaining PC vs Phone optimization) */}
      <div className="block md:hidden bg-[#F7F6F3] dark:bg-[#18191D] p-4 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs text-[#555] dark:text-neutral-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#2F3437] dark:text-[#F3F4F6]">
          <Smartphone size={16} className="text-emerald-600" />
          <span>{isAr ? 'نمط الفحص السريع للهاتف' : 'Mobile Quick-Check Mode'}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#787774] dark:text-neutral-400">
          {isAr
            ? 'على هاتفك، ركّز على تسجيل العادات السريعة وإنجاز المهام. يُفضل تصفّح الرسوم البيانية العميقة والتحليلات المتكاملة من شاشة الكمبيوتر.'
            : 'On your phone, prioritize fast habit check-ins and task execution. Deep analytical graphs and multi-horizon matrixes are best experienced on your PC.'}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onNavigateModule('habits')}
            className="px-3 py-1.5 bg-[#2F3437] text-white font-semibold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <Flame size={12} className="text-amber-400" />
            <span>{isAr ? 'فحص العادات' : 'Check Habits'}</span>
          </button>
          <button
            onClick={() => onNavigateModule('tasks')}
            className="px-3 py-1.5 bg-white dark:bg-[#202228] border border-[#D3D1CB] dark:border-[#2A2C33] text-[#2F3437] dark:text-[#F3F4F6] font-semibold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <CheckSquare size={12} className="text-blue-600" />
            <span>{isAr ? 'عرض المهام' : 'View Tasks'}</span>
          </button>
        </div>
      </div>

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#787774] dark:text-neutral-400 font-semibold">
            <Monitor size={14} className="text-blue-600" />
            <span>{isAr ? 'مركز التحكم والقيادة التنفيذية' : 'Executive Command Center'}</span>
            <span className="text-[#D3D1CB]">•</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded">{isAr ? 'تحليلات متكاملة' : 'Telemetry Live'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2F3437] dark:text-[#F3F4F6]">
            {isAr ? 'قياسات الأداء والقياس عن بُعد لنسب التنفيذ' : 'Performance & Execution Telemetry'}
          </h1>
          <p className="text-xs text-[#787774] dark:text-neutral-400">
            {isAr
              ? 'مؤشر التشغيل الكمي، وخطوط الاتجاه متعددة الفترات، وجلسات التركيز العميق.'
              : 'Quantitative operational index, multi-period trend lines, and deep focus analytics.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#F7F6F3] dark:bg-[#1E2025] p-1 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-semibold self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <Activity size={13} className="text-blue-600" />
            <span>{isAr ? 'مؤشر الأداء التنفيذي' : 'Overview Index'}</span>
          </button>

          <button
            onClick={() => setActiveTab('habits')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'habits'
                ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <Flame size={13} className="text-amber-500" />
            <span>{isAr ? 'مسار العادات' : 'Habits Trajectory'}</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <CheckSquare size={13} className="text-emerald-600" />
            <span>{isAr ? 'سرعة المهام' : 'Task Velocity'}</span>
          </button>

          <button
            onClick={() => setActiveTab('focus')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'focus'
                ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <Clock size={13} className="text-blue-500" />
            <span>{isAr ? 'ساعات وجلسات التركيز' : 'Focus & Deep Work'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sleep')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sleep'
                ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <Moon size={13} className="text-purple-500" />
            <span>{isAr ? 'إيقاع وساعات النوم' : 'Sleep & Rhythm'}</span>
          </button>

          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'blocks'
                ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <Layers size={13} className="text-indigo-500" />
            <span>{isAr ? 'فترات اليوم' : 'Daily Blocks'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer relative ${
              activeTab === 'reviews'
                ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <BookOpen size={13} className="text-purple-600" />
            <span>{isAr ? 'مركز التحليل الدوري' : 'Audit Hub'}</span>
            {(!reviewStatus.hasCompletedWeekly || !reviewStatus.hasCompletedMonthly) && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <Target size={13} className="text-indigo-600" />
          </button>
        </div>
      </div>

      {/* ========================================================
          PERIODIC REVIEW & AUDIT HUB COMPONENT (REUSABLE JSX)
          ======================================================== */}
      {(activeTab === 'overview' || activeTab === 'reviews') && (
        <div className="bg-gradient-to-br from-indigo-900/5 via-purple-900/5 to-amber-900/5 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-amber-950/20 p-5 sm:p-6 rounded-3xl border border-indigo-500/20 dark:border-indigo-500/30 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/10 dark:border-indigo-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                    {isAr ? 'مركز التحليل والتقييم الدوري' : 'Periodic Audit & Review Hub'}
                  </h2>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                    {isAr ? 'تقييم أسبوعي / شهري' : 'Weekly & Monthly Audits'}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                  {isAr
                    ? 'سواء قمت بإخفاء التنبيه العلوي أو احتفظت به، يمكنك دائماً بدء ومراجعة تحليل الأسبوع والشهر من هنا بسهولة.'
                    : 'Whether you dismissed the top notification or kept it, you can always initiate and review weekly & monthly audits here.'}
                </p>
              </div>
            </div>

            {onOpenReviewModal && (
              <button
                onClick={() => onOpenReviewModal('archive')}
                className="px-3.5 py-2 bg-white dark:bg-[#202228] border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 shadow-3xs self-start sm:self-auto cursor-pointer"
              >
                <FileText size={14} />
                <span>{isAr ? `سجل الأرشيف (${reviews.length})` : `Review Archive (${reviews.length})`}</span>
                <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 1: WEEKLY REVIEW */}
            <div className="bg-white dark:bg-[#18191D] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-3xs flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {isAr ? 'التحليل الأسبوعي' : 'Weekly Audit'}
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                        {reviewStatus.currentWeekKey}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {reviewStatus.hasCompletedWeekly ? (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {isAr ? 'تم التحليل' : 'Completed'}
                    </span>
                  ) : reviewStatus.isWeeklyWindow ? (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-500 text-white shadow-3xs animate-pulse flex items-center gap-1">
                      <Sparkles size={12} />
                      {isAr ? 'جاهز للتحليل (نهاية الأسبوع)' : 'Ready for Weekly Audit'}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <Clock size={12} />
                      {isAr ? 'متاح للتقييم المبكر' : 'Available'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed pt-1">
                  {isAr
                    ? 'تقييم إنجاز العادات، مراجعة أسباب الأعذار، وتفريغ الملاحظات والدروس المستفادة للأسبوع المنقضي.'
                    : 'Evaluate habit execution, logged excuses, key wins, and lessons learned over the past 7 days.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/80">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {isAr ? 'الموعد المفضل: مساء السبت / الأحد' : 'Best time: Sat/Sun'}
                </span>
                <button
                  onClick={() => onOpenReviewModal?.('weekly')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs ${
                    reviewStatus.hasCompletedWeekly
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                  }`}
                >
                  <BookOpen size={14} />
                  <span>
                    {reviewStatus.hasCompletedWeekly
                      ? (isAr ? 'عرض / تعديل التحليل' : 'View / Edit Review')
                      : (isAr ? 'ابدأ تحليل الأسبوع الآن' : 'Start Weekly Audit')}
                  </span>
                </button>
              </div>
            </div>

            {/* CARD 2: MONTHLY REVIEW */}
            <div className="bg-white dark:bg-[#18191D] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-3xs flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {isAr ? 'التحليل الشهري' : 'Monthly Audit'}
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                        {reviewStatus.currentMonthKey}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {reviewStatus.hasCompletedMonthly ? (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {isAr ? 'تم التحليل الشهري' : 'Completed'}
                    </span>
                  ) : reviewStatus.isMonthEnd ? (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-purple-600 text-white shadow-3xs animate-pulse flex items-center gap-1">
                      <Unlock size={12} />
                      {isAr ? 'متاح الآن (نهاية الشهر)' : 'Unlocked for Month End'}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                      <Lock size={12} />
                      {isAr ? `مغلق (باقي ${reviewStatus.daysLeftToMonth} أيام)` : `Locked (${reviewStatus.daysLeftToMonth}d left)`}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed pt-1">
                  {isAr
                    ? 'تجميع حصيلة الأسابيع الأربعة، وقياس الإنجاز الإجمالي نحو الأهداف الكبرى وإحصائيات الـ 30 يوماً.'
                    : 'Consolidate 4 weekly reviews into a high-level strategic audit for the full 30-day period.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/80">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {!reviewStatus.isMonthEnd && !reviewStatus.hasCompletedMonthly
                    ? (isAr ? `ينفتح يوم ${reviewStatus.daysInMonth - 3} من الشهر` : `Unlocks on day ${reviewStatus.daysInMonth - 3}`)
                    : (isAr ? 'متاح حتى بداية الشهر الجديد' : 'Available now')}
                </span>

                {reviewStatus.isMonthEnd || reviewStatus.hasCompletedMonthly ? (
                  <button
                    onClick={() => onOpenReviewModal?.('monthly')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs ${
                      reviewStatus.hasCompletedMonthly
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                    }`}
                  >
                    <Unlock size={14} />
                    <span>
                      {reviewStatus.hasCompletedMonthly
                        ? (isAr ? 'عرض / تعديل التحليل' : 'View / Edit Review')
                        : (isAr ? 'ابدأ تحليل الشهر الآن' : 'Start Monthly Audit')}
                    </span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800/60 text-neutral-400 dark:text-neutral-500 cursor-not-allowed flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-800"
                    title={isAr ? 'التحليل الشهري يتطلب اكتمال بيانات الشهر الكلي' : 'Monthly audit unlocks at month end'}
                  >
                    <Lock size={14} />
                    <span>{isAr ? 'مغلق حتى نهاية الشهر' : 'Locked Until Month End'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RECENT SAVED REVIEWS SUMMARY */}
          {reviewStatus.recentReviews.length > 0 && (
            <div className="pt-3 border-t border-indigo-500/10 dark:border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <span>{isAr ? 'آخر التحاليل المحفوظة مؤخراً:' : 'Recent Completed Reviews:'}</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                  {reviewStatus.completedWeeklyCount} {isAr ? 'أسبوعي' : 'weekly'} | {reviewStatus.completedMonthlyCount} {isAr ? 'شهري' : 'monthly'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {reviewStatus.recentReviews.map((rev) => (
                  <div
                    key={rev.id || rev.periodKey}
                    onClick={() => onOpenReviewModal?.('archive')}
                    className="p-3 bg-white dark:bg-[#18191D] rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                        rev.type === 'weekly' 
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300' 
                          : 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300'
                      }`}>
                        {rev.type === 'weekly' ? (isAr ? 'أسبوعي' : 'Weekly') : (isAr ? 'شهري' : 'Monthly')}
                      </span>
                      <span className="font-mono text-neutral-500 text-[10px]">{rev.periodKey}</span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {rev.title || (isAr ? `تقرير ${rev.periodKey}` : `Audit ${rev.periodKey}`)}
                    </h4>
                    {rev.rating && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{rev.rating} / 10</span>
                        {rev.habitScore !== undefined && (
                          <span className="text-neutral-400 font-normal">({rev.habitScore}% {isAr ? 'انضباط' : 'discipline'})</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 1: EXECUTIVE PERFORMANCE INDEX & RADAR
          ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 1. EXECUTIVE SCOPE, INCEPTION & TIMEFRAME NAVIGATION BAR */}
          <div className="bg-white dark:bg-[#18191D] p-4 sm:p-5 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Journey Inception Milestone Badge */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {isAr ? 'انطلاقة مسار العمل والنظام' : 'System Launch Inception'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono">
                      {isAr ? `اليوم ${executiveTimeline.daysSinceInception}` : `Day ${executiveTimeline.daysSinceInception}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isAr 
                      ? `تاريخ البداية: ${executiveTimeline.inceptionIso} • تتبع التطور ومقارنة الفترات السابقة` 
                      : `Inception: ${executiveTimeline.inceptionIso} • Historical comparison & multi-period audit`}
                  </p>
                </div>
              </div>

              {/* Right: Controls & Period Navigation */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                {/* Scope Switcher: Week / Month / Year / All */}
                <div className="flex items-center bg-[#F7F6F3] dark:bg-[#202228] p-1 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-bold">
                  {[
                    { id: 'week', labelAr: 'سيمانة (أسبوع)', labelEn: 'Week' },
                    { id: 'month', labelAr: 'شهر', labelEn: 'Month' },
                    { id: 'year', labelAr: 'عام', labelEn: 'Year' },
                    { id: 'all', labelAr: 'من نهار بديت', labelEn: 'All Time' },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        setTimeScope(sc.id as any);
                        setScopeOffset(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        timeScope === sc.id
                          ? 'bg-white dark:bg-[#2F3437] text-neutral-900 dark:text-white shadow-xs font-black'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {isAr ? sc.labelAr : sc.labelEn}
                    </button>
                  ))}
                </div>

                {/* Historical Period Navigator (< Previous / Current Label / Next >) */}
                {timeScope !== 'all' && (
                  <div className="flex items-center bg-[#F7F6F3] dark:bg-[#202228] p-1 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-bold gap-1">
                    <button
                      onClick={() => setScopeOffset(scopeOffset - 1)}
                      className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-[#2F3437] text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                      title={isAr ? 'الفترة السابقة في الماضي' : 'Previous Period in the Past'}
                    >
                      <ChevronRight size={14} className={isAr ? '' : 'rotate-180'} />
                    </button>

                    <span className="px-2 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold whitespace-nowrap">
                      {executiveTimeline.periodLabel}
                    </span>

                    <button
                      onClick={() => setScopeOffset(scopeOffset + 1)}
                      disabled={scopeOffset >= 0}
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        scopeOffset >= 0
                          ? 'opacity-30 cursor-not-allowed text-neutral-400'
                          : 'hover:bg-white dark:hover:bg-[#2F3437] text-neutral-600 dark:text-neutral-300'
                      }`}
                      title={isAr ? 'الفترة التالية' : 'Next Period'}
                    >
                      <ChevronLeft size={14} className={isAr ? '' : 'rotate-180'} />
                    </button>

                    {scopeOffset !== 0 && (
                      <button
                        onClick={() => setScopeOffset(0)}
                        className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold hover:bg-indigo-100 cursor-pointer ml-1 rtl:ml-0 rtl:mr-1"
                        title={isAr ? 'العودة للفترة الحالية' : 'Reset to Current Period'}
                      >
                        {isAr ? 'الحالي' : 'Today'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Historical Jump Presets */}
            {timeScope !== 'all' && (
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1.5">
                  <RotateCcw size={12} className="text-neutral-400" />
                  <span>{isAr ? 'انتقال سريع للماضي والأرشيف:' : 'Quick Historical Jump:'}</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => { setTimeScope('week'); setScopeOffset(0); }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      timeScope === 'week' && scopeOffset === 0
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {isAr ? 'الأسبوع الحالي' : 'Current Week'}
                  </button>
                  <button
                    onClick={() => { setTimeScope('week'); setScopeOffset(-1); }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      timeScope === 'week' && scopeOffset === -1
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {isAr ? 'الأسبوع الماضي' : 'Last Week'}
                  </button>
                  <button
                    onClick={() => { setTimeScope('month'); setScopeOffset(0); }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      timeScope === 'month' && scopeOffset === 0
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {isAr ? 'هذا الشهر' : 'Current Month'}
                  </button>
                  <button
                    onClick={() => { setTimeScope('month'); setScopeOffset(-1); }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      timeScope === 'month' && scopeOffset === -1
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {isAr ? 'الشهر الماضي' : 'Last Month'}
                  </button>
                  <button
                    onClick={() => { setTimeScope('all'); setScopeOffset(0); }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      timeScope === 'all'
                        ? 'bg-amber-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {isAr ? `من نهار بديت (${executiveTimeline.inceptionIso})` : `Since Launch (${executiveTimeline.inceptionIso})`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. THE MULTI-LINE EXECUTIVE GRAPH & ADJACENT PILLAR VELOCITY CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left: Interactive Multi-Line Evolution Graph (8 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-600" />
                        <span>{isAr ? 'مخطط التطور والترابط التنفيذي المتعدد' : 'Multi-Pillar Correlation & Growth Telemetry'}</span>
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        {isAr ? `المحصلة: ${executiveTimeline.summary.overallVelocityRate}%` : `Velocity: ${executiveTimeline.summary.overallVelocityRate}%`}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {isAr
                        ? 'رسم بياني موحد يجمع خطوط تطور كل ركائز عملك (العادات، المهام، ساعات التركيز، النوم، الفترات، والتقييم).'
                        : 'Unified trend chart combining habits, task velocity, deep focus time, sleep rhythm, daily blocks, and reflection rating.'}
                    </p>
                  </div>

                  <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 whitespace-nowrap self-start sm:self-auto">
                    {executiveTimeline.periodLabel}
                  </span>
                </div>

                {/* Interactive Legend & Line Toggles */}
                <div className="flex flex-wrap items-center gap-1.5 pt-3 text-xs">
                  {/* Habits */}
                  <button
                    type="button"
                    onClick={() => setVisibleLines(prev => ({ ...prev, habits: !prev.habits }))}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      visibleLines.habits
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 shadow-3xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-400 line-through'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{isAr ? 'العادات' : 'Habits'}</span>
                    <span className="font-mono text-[10px] font-black">{executiveTimeline.summary.avgHabitsRate}%</span>
                  </button>

                  {/* Tasks */}
                  <button
                    type="button"
                    onClick={() => setVisibleLines(prev => ({ ...prev, tasks: !prev.tasks }))}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      visibleLines.tasks
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-3xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-400 line-through'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{isAr ? 'المهام' : 'Tasks'}</span>
                    <span className="font-mono text-[10px] font-black">{executiveTimeline.summary.tasksVelocityRate}%</span>
                  </button>

                  {/* Focus */}
                  <button
                    type="button"
                    onClick={() => setVisibleLines(prev => ({ ...prev, focus: !prev.focus }))}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      visibleLines.focus
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 shadow-3xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-400 line-through'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span>{isAr ? 'التركيز' : 'Focus'}</span>
                    <span className="font-mono text-[10px] font-black">{executiveTimeline.summary.focusRate}%</span>
                  </button>

                  {/* Sleep */}
                  <button
                    type="button"
                    onClick={() => setVisibleLines(prev => ({ ...prev, sleep: !prev.sleep }))}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      visibleLines.sleep
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 shadow-3xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-400 line-through'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span>{isAr ? 'النوم' : 'Sleep'}</span>
                    <span className="font-mono text-[10px] font-black">{executiveTimeline.summary.sleepAdherenceRate}%</span>
                  </button>

                  {/* Daily Blocks */}
                  <button
                    type="button"
                    onClick={() => setVisibleLines(prev => ({ ...prev, blocks: !prev.blocks }))}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      visibleLines.blocks
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 shadow-3xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-400 line-through'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>{isAr ? 'فترات اليوم' : 'Blocks'}</span>
                    <span className="font-mono text-[10px] font-black">{executiveTimeline.summary.blocksRate}%</span>
                  </button>

                  {/* Rating */}
                  <button
                    type="button"
                    onClick={() => setVisibleLines(prev => ({ ...prev, rating: !prev.rating }))}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      visibleLines.rating
                        ? 'bg-pink-50 dark:bg-pink-950/60 border-pink-300 dark:border-pink-800 text-pink-800 dark:text-pink-300 shadow-3xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-400 line-through'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                    <span>{isAr ? 'التقييم' : 'Rating'}</span>
                    <span className="font-mono text-[10px] font-black">{executiveTimeline.summary.ratingPct}%</span>
                  </button>
                </div>
              </div>

              {/* Chart Area */}
              <div className="w-full h-72 sm:h-80 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={executiveTimeline.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE9E6" className="dark:opacity-15" />
                    <XAxis dataKey="label" stroke="#8C8B88" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#8C8B88" fontSize={11} tickLine={false} tickFormatter={(val) => `${val}%`} />
                    <Tooltip content={<CustomCorrelationTooltip isAr={isAr} />} />

                    {visibleLines.habits && (
                      <Line
                        type="monotone"
                        dataKey="habits"
                        name={isAr ? 'العادات' : 'Habits'}
                        stroke="#F59E0B"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#F59E0B' }}
                        activeDot={{ r: 6, fill: '#F59E0B' }}
                      />
                    )}

                    {visibleLines.tasks && (
                      <Line
                        type="monotone"
                        dataKey="tasks"
                        name={isAr ? 'المهام' : 'Tasks'}
                        stroke="#10B981"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#10B981' }}
                        activeDot={{ r: 6, fill: '#10B981' }}
                      />
                    )}

                    {visibleLines.focus && (
                      <Line
                        type="monotone"
                        dataKey="focus"
                        name={isAr ? 'التركيز' : 'Focus'}
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#3B82F6' }}
                        activeDot={{ r: 6, fill: '#3B82F6' }}
                      />
                    )}

                    {visibleLines.sleep && (
                      <Line
                        type="monotone"
                        dataKey="sleep"
                        name={isAr ? 'النوم' : 'Sleep'}
                        stroke="#8B5CF6"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#8B5CF6' }}
                        activeDot={{ r: 6, fill: '#8B5CF6' }}
                      />
                    )}

                    {visibleLines.blocks && (
                      <Line
                        type="monotone"
                        dataKey="blocks"
                        name={isAr ? 'فترات اليوم' : 'Daily Blocks'}
                        stroke="#6366F1"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#6366F1' }}
                        activeDot={{ r: 6, fill: '#6366F1' }}
                      />
                    )}

                    {visibleLines.rating && (
                      <Line
                        type="monotone"
                        dataKey="rating"
                        name={isAr ? 'التقييم' : 'Rating'}
                        stroke="#EC4899"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#EC4899' }}
                        activeDot={{ r: 6, fill: '#EC4899' }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                <span>{isAr ? 'اضغط على أي ركيزة في القائمة الجانبية أو الأزرار لتفعيل/تعطيل خطها' : 'Click any pillar pill or side card to toggle its line'}</span>
                <span className="font-mono text-neutral-500">{executiveTimeline.timelineData.length} {isAr ? 'نقاط زمنية' : 'data points'}</span>
              </div>
            </div>

            {/* Right: Adjacent Live Percentage & Health Verdict Panel (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs flex flex-col justify-between space-y-3.5">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-500" />
                      <span>{isAr ? 'نسب الإنجاز والحالة اللحظية' : 'Live Pillar Percentages & Health'}</span>
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      {isAr ? 'مؤشرات دقيقة توضح واش غادي مزيان' : 'Instant diagnostics of your trajectory'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-black text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-lg">
                    {executiveTimeline.summary.overallVelocityRate}%
                  </span>
                </div>

                {/* Overall Health Verdict Banner ("واش غادي مزيان") */}
                <div className={`mt-3 p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
                  executiveTimeline.summary.overallVelocityRate >= 75
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : executiveTimeline.summary.overallVelocityRate >= 50
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
                }`}>
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    executiveTimeline.summary.overallVelocityRate >= 75
                      ? 'bg-emerald-500 text-white'
                      : executiveTimeline.summary.overallVelocityRate >= 50
                      ? 'bg-blue-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {executiveTimeline.summary.overallVelocityRate >= 75 ? (
                      <CheckCircle2 size={14} />
                    ) : executiveTimeline.summary.overallVelocityRate >= 50 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <AlertCircle size={14} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold block text-xs">
                      {executiveTimeline.summary.overallVelocityRate >= 75
                        ? (isAr ? '🚀 وتيرة ممتازة (غادي مزيان بزاف)' : '🚀 Optimal Velocity (Progressing Great)')
                        : executiveTimeline.summary.overallVelocityRate >= 50
                        ? (isAr ? '⚡ أداء مستقر وعلى المسار' : '⚡ Stable Momentum (On Track)')
                        : (isAr ? '⚠️ يحتاج تركيز وإعادة ضبط' : '⚠️ Needs Re-alignment')}
                    </span>
                    <span className="text-[10px] opacity-80 block truncate">
                      {executiveTimeline.summary.overallVelocityRate >= 75
                        ? (isAr ? 'العادات والمهام والتركيز في أعلى مستوياتها.' : 'Habits, tasks, and focus are executing at peak performance.')
                        : executiveTimeline.summary.overallVelocityRate >= 50
                        ? (isAr ? 'الركائز الأساسية تعمل بثبات مع فرصة لزيادة التركيز.' : 'Core pillars active with room to push sleep & deep focus.')
                        : (isAr ? 'ابدأ بتثبيت 3 عادات أساسية وإتمام مهمة اليوم.' : 'Focus on 3 core habits and complete 1 key task today.')}
                    </span>
                  </div>
                </div>

                {/* 6 Individual Pillar Velocity Cards */}
                <div className="space-y-2 mt-3">
                  {/* 1. Habits Pillar */}
                  <div
                    onClick={() => setVisibleLines(prev => ({ ...prev, habits: !prev.habits }))}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      visibleLines.habits
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                        : 'bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span>{isAr ? 'العادات اليومية' : 'Habits'}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          executiveTimeline.summary.avgHabitsRate >= 75
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : executiveTimeline.summary.avgHabitsRate >= 50
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {executiveTimeline.summary.avgHabitsRate >= 75 ? (isAr ? 'ممتاز' : 'Optimal') : (isAr ? 'مستقر' : 'Stable')}
                        </span>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                          {executiveTimeline.summary.avgHabitsRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${executiveTimeline.summary.avgHabitsRate}%` }} />
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 block font-mono">
                      {isAr ? 'معدل التزام وتثبيت العادات' : 'Average habit continuity'}
                    </span>
                  </div>

                  {/* 2. Tasks Velocity */}
                  <div
                    onClick={() => setVisibleLines(prev => ({ ...prev, tasks: !prev.tasks }))}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      visibleLines.tasks
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                        : 'bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>{isAr ? 'سرعة المهام' : 'Tasks Velocity'}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-neutral-400">
                          ({executiveTimeline.summary.totalTasksDoneInPeriod} {isAr ? 'منجزة' : 'done'})
                        </span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {executiveTimeline.summary.tasksVelocityRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${executiveTimeline.summary.tasksVelocityRate}%` }} />
                    </div>
                  </div>

                  {/* 3. Focus & Deep Work */}
                  <div
                    onClick={() => setVisibleLines(prev => ({ ...prev, focus: !prev.focus }))}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      visibleLines.focus
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                        : 'bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span>{isAr ? 'ساعات التركيز' : 'Deep Focus'}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-neutral-400">
                          ({executiveTimeline.summary.totalFocusHours}h)
                        </span>
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                          {executiveTimeline.summary.focusRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${executiveTimeline.summary.focusRate}%` }} />
                    </div>
                  </div>

                  {/* 4. Sleep & Rhythm */}
                  <div
                    onClick={() => setVisibleLines(prev => ({ ...prev, sleep: !prev.sleep }))}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      visibleLines.sleep
                        ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50'
                        : 'bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                        <span>{isAr ? 'إيقاع النوم' : 'Sleep Rhythm'}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-neutral-400">
                          ({executiveTimeline.summary.avgSleepRate}h)
                        </span>
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                          {executiveTimeline.summary.sleepAdherenceRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${executiveTimeline.summary.sleepAdherenceRate}%` }} />
                    </div>
                  </div>

                  {/* 5. Daily Blocks */}
                  <div
                    onClick={() => setVisibleLines(prev => ({ ...prev, blocks: !prev.blocks }))}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      visibleLines.blocks
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50'
                        : 'bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        <span>{isAr ? 'قوالب وفترات اليوم' : 'Daily Blocks'}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-neutral-400">
                          ({executiveTimeline.summary.completedBlocksInPeriod}/{executiveTimeline.summary.totalBlocksInPeriod})
                        </span>
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {executiveTimeline.summary.blocksRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${executiveTimeline.summary.blocksRate}%` }} />
                    </div>
                  </div>

                  {/* 6. Rating & Reflection */}
                  <div
                    onClick={() => setVisibleLines(prev => ({ ...prev, rating: !prev.rating }))}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      visibleLines.rating
                        ? 'bg-pink-50/50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/50'
                        : 'bg-neutral-50/50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                        <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                        <span>{isAr ? 'تقييم وتأمل الأيام' : 'Audit Rating'}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-neutral-400">
                          ({executiveTimeline.summary.avgRating}/10)
                        </span>
                        <span className="font-mono font-black text-pink-600 dark:text-pink-400">
                          {executiveTimeline.summary.ratingPct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${executiveTimeline.summary.ratingPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setVisibleLines({ habits: true, tasks: true, focus: true, sleep: true, blocks: true, rating: true })}
                  className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                >
                  {isAr ? 'إظهار كافة الخطوط' : 'Show All Lines'}
                </button>
                <span className="text-neutral-400 text-[10px]">
                  {isAr ? 'تحديث لحظي ومزامنة مباشرة' : 'Real-time telemetry'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. EXECUTIVE KPI BENTO GRID (WITH PERIOD SPECIFIC STATS) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-right">
            {/* KPI 1: Performance Index */}
            <div className="bg-white dark:bg-[#18191D] p-4 sm:p-5 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">{isAr ? 'مؤشر الأداء التنفيذي' : 'Performance Index'}</span>
                <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Activity size={14} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                  {executiveMetrics.performanceIndex}
                </span>
                <span className="text-xs text-[#787774] dark:text-neutral-400">/ 100</span>
              </div>
              <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                {isAr ? 'القياس المركب للأداء والتشغيل' : 'Composite operational execution score'}
              </p>
            </div>

            {/* KPI 2: Habit Consistency */}
            <div className="bg-white dark:bg-[#18191D] p-4 sm:p-5 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">{isAr ? 'التزام العادات' : 'Habit Consistency'}</span>
                <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Flame size={14} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                  {executiveTimeline.summary.avgHabitsRate}%
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold font-mono">
                  🔥 {executiveMetrics.momentumScore}% {isAr ? 'زخم' : 'momentum'}
                </span>
              </div>
              <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                {isAr
                  ? `معدل التزام العادات خلال ${executiveTimeline.periodLabel}`
                  : `Average adherence over ${executiveTimeline.periodLabel}`}
              </p>
            </div>

            {/* KPI 3: Task Velocity & Focus */}
            <div className="bg-white dark:bg-[#18191D] p-4 sm:p-5 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">{isAr ? 'إنجاز المهام والتركيز' : 'Tasks & Deep Focus'}</span>
                <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <CheckSquare size={14} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                  {executiveTimeline.summary.totalTasksDoneInPeriod}
                </span>
                <span className="text-xs text-[#787774] dark:text-neutral-400">{isAr ? 'مهام منجزة' : 'tasks done'}</span>
              </div>
              <p className="text-[11px] text-[#787774] dark:text-neutral-400 font-mono">
                {isAr
                  ? `⏱️ ${executiveTimeline.summary.totalFocusHours} ساعة تركيز مسجلة`
                  : `⏱️ ${executiveTimeline.summary.totalFocusHours}h deep focus logged`}
              </p>
            </div>

            {/* KPI 4: Sleep & Rhythm */}
            <div className="bg-white dark:bg-[#18191D] p-4 sm:p-5 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">{isAr ? 'إيقاع وانضباط النوم' : 'Sleep Rhythm'}</span>
                <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Moon size={14} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                  {executiveTimeline.summary.avgSleepRate}h
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-bold font-mono">
                  {executiveTimeline.summary.sleepAdherenceRate}% {isAr ? 'التزام' : 'on target'}
                </span>
              </div>
              <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                {isAr ? 'متوسط ساعات النوم اليومية والالتزام بالموعد' : 'Nightly sleep duration and schedule alignment'}
              </p>
            </div>
          </div>

          {/* Main 2-Column Section: Metric Breakdown & Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-right">
            {/* Dimension Breakdown Card (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#18191D] p-6 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#2F3437] dark:text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  {isAr ? 'درجات أبعاد التشغيل' : 'Operational Dimension Scores'}
                </h3>
                <p className="text-xs text-[#787774] dark:text-neutral-400">
                  {isAr ? 'التحليل التفصيلي الكمي لركائز الأداء الستة.' : 'Quantitative breakdown of the 6 performance pillars.'}
                </p>
              </div>

              <div className="space-y-3.5">
                {/* 1. Discipline */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2F3437] dark:text-neutral-200 flex items-center gap-1.5">
                      <Flame size={12} className="text-amber-500" /> {isAr ? 'الانضباط (سلاسل العادات)' : 'Discipline (Habit Streaks)'}
                    </span>
                    <span className="font-mono font-bold text-[#2F3437] dark:text-white">{executiveMetrics.disciplineScore}/100</span>
                  </div>
                  <div className="w-full bg-[#EAE9E6] dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${executiveMetrics.disciplineScore}%` }} />
                  </div>
                </div>

                {/* 2. Velocity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2F3437] dark:text-neutral-200 flex items-center gap-1.5">
                      <Zap size={12} className="text-emerald-600" /> {isAr ? 'السرعة (إنجاز المهام)' : 'Velocity (Task Execution)'}
                    </span>
                    <span className="font-mono font-bold text-[#2F3437] dark:text-white">{executiveMetrics.velocityScore}/100</span>
                  </div>
                  <div className="w-full bg-[#EAE9E6] dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${executiveMetrics.velocityScore}%` }} />
                  </div>
                </div>

                {/* 3. Focus */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2F3437] dark:text-neutral-200 flex items-center gap-1.5">
                      <Clock size={12} className="text-blue-600" /> {isAr ? 'التركيز (العمل العميق الأسبوعي)' : 'Focus (Weekly Deep Work)'}
                    </span>
                    <span className="font-mono font-bold text-[#2F3437] dark:text-white">{executiveMetrics.focusScore}/100</span>
                  </div>
                  <div className="w-full bg-[#EAE9E6] dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${executiveMetrics.focusScore}%` }} />
                  </div>
                </div>

                {/* 4. Strategy */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2F3437] dark:text-neutral-200 flex items-center gap-1.5">
                      <Target size={12} className="text-indigo-600" /> {isAr ? 'الاستراتيجية (المحطات والأهداف)' : 'Strategy (Goal Milestones)'}
                    </span>
                    <span className="font-mono font-bold text-[#2F3437] dark:text-white">{executiveMetrics.strategyScore}/100</span>
                  </div>
                  <div className="w-full bg-[#EAE9E6] dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${executiveMetrics.strategyScore}%` }} />
                  </div>
                </div>

                {/* 5. Systems */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2F3437] dark:text-neutral-200 flex items-center gap-1.5">
                      <Layers size={12} className="text-purple-600" /> {isAr ? 'الأنظمة (المشاريع وقوائم التدقيق)' : 'Systems (Projects & SOPs)'}
                    </span>
                    <span className="font-mono font-bold text-[#2F3437] dark:text-white">{executiveMetrics.masteryScore}/100</span>
                  </div>
                  <div className="w-full bg-[#EAE9E6] dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${executiveMetrics.masteryScore}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#FBFBFA] dark:bg-[#202228] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-[11px] text-[#787774] dark:text-neutral-400 flex items-center justify-between">
                <span>{isAr ? 'يتم احتسابه باستمرار من البيانات الحية' : 'Calculated continuously from live data'}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">{isAr ? 'مزامنة حية' : 'Live Sync'}</span>
              </div>
            </div>

            {/* Radar / Spider Matrix Visualization (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#18191D] p-6 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-[#2F3437] dark:text-white flex items-center gap-2">
                    <Compass size={16} className="text-blue-600" />
                    {isAr ? 'مصفوفة القدرات السداسية' : 'Capability Hexagon Matrix'}
                  </h3>
                  <p className="text-xs text-[#787774] dark:text-neutral-400">
                    {isAr ? 'هندسة أداء متوازنة متعددة المحاور' : 'Balanced multi-axis performance geometry'}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-[#787774] dark:text-neutral-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                  <span className="font-medium text-[#2F3437] dark:text-neutral-200">{isAr ? 'القدرة الحالية' : 'Current Capability'}</span>
                </div>
              </div>

              <div className="w-full h-72 sm:h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={executiveMetrics.radarData}>
                    <PolarGrid stroke="#EAE9E6" className="dark:opacity-20" strokeDasharray="3 3" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#8C8B88', fontSize: 11, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="#8C8B88"
                      tick={{ fill: '#8C8B88', fontSize: 9 }}
                    />
                    <Radar
                      name={isAr ? 'الدرجة' : 'Score'}
                      dataKey="value"
                      stroke="#2563EB"
                      fill="#3B82F6"
                      fillOpacity={0.35}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E2025',
                        borderRadius: '12px',
                        border: '1px solid #2A2C33',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} / 100`, isAr ? 'الدرجة' : 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-[#787774] dark:text-neutral-400 pt-2 border-t border-[#EAE9E6] dark:border-[#2A2C33]">
                <span>{isAr ? 'لزيادة رصيدك، حافظ على سلاسل عاداتك اليومية المستمرة وأنجز فترات العمل العميقة المخطط لها.' : 'To increase your score, maintain continuous habit streaks and finish planned deep-work slots.'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: HABITS TRAJECTORY & DAILY COMPLETIONS
          ======================================================== */}
      {activeTab === 'habits' && (
        <div className="space-y-6 text-right">
          <div className="bg-white p-6 rounded-3xl border border-[#EAE9E6] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#2F3437] flex items-center gap-2">
                  <Flame size={16} className="text-amber-500" />
                  {isAr ? 'اتجاه معدل تنفيذ العادات' : 'Habit Execution Rate Trend'}
                </h3>
                <p className="text-xs text-[#787774]">
                  {isAr ? 'نسبة الإنجاز اليومية لجميع العادات التي تم تكوينها مع مرور الوقت.' : 'Daily completion percentage across all configured habits over time.'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-[#F7F6F3] p-1 rounded-xl border border-[#EAE9E6] text-xs font-semibold">
                <button
                  onClick={() => setTimeframe('7d')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${timeframe === '7d' ? 'bg-white text-[#2F3437] shadow-xs' : 'text-[#787774]'}`}
                >
                  {isAr ? '٧ أيام' : '7 Days'}
                </button>
                <button
                  onClick={() => setTimeframe('30d')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${timeframe === '30d' ? 'bg-white text-[#2F3437] shadow-xs' : 'text-[#787774]'}`}
                >
                  {isAr ? '١٤ يوماً' : '14 Days'}
                </button>
                <button
                  onClick={() => setTimeframe('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${timeframe === 'all' ? 'bg-white text-[#2F3437] shadow-xs' : 'text-[#787774]'}`}
                >
                  {isAr ? '٢٨ يوماً' : '28 Days'}
                </button>
              </div>
            </div>

            {/* Area Chart */}
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={habitTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="habitRateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                  <XAxis dataKey="display" tick={{ fontSize: 10, fill: '#787774' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#787774' }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2F3437',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val}% (${isAr ? 'مكتمل' : 'completed'} ${item.payload.count}/${item.payload.total})`,
                      isAr ? 'معدل التنفيذ' : 'Execution Rate'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#habitRateGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Individual Habit Streaks Breakdown */}
            {habits.length > 0 ? (
              <div className="space-y-3 pt-4 border-t border-[#EAE9E6]">
                <h4 className="text-xs font-bold text-[#2F3437] uppercase tracking-wider">
                  {isAr ? 'سلاسل العادات النشطة وتكرارها المستهدف' : 'Active Habit Streaks & Target Frequencies'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {habits.map(h => (
                    <div key={h.id || h.title} className="p-3.5 bg-[#FBFBFA] rounded-2xl border border-[#EAE9E6] flex items-center justify-between">
                      <div className="space-y-0.5 text-left">
                        <div className="font-semibold text-xs text-[#2F3437] truncate max-w-[170px]">
                          {h.title}
                        </div>
                        <div className="text-[10px] text-[#787774]">
                          {isAr ? 'المستهدف:' : 'Target:'} {h.targetPerWeek || 7}x/{isAr ? 'أسبوعياً' : 'week'} • {h.category || (isAr ? 'عام' : 'General')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs font-mono">
                        <Flame size={12} className="text-amber-600 fill-amber-500" />
                        <span>{h.streak || 0}{isAr ? 'يوم' : 'd'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FBFBFA] rounded-2xl border border-dashed border-[#D3D1CB] space-y-3">
                <Flame size={32} className="mx-auto text-amber-500" />
                <div className="text-xs font-bold text-[#2F3437]">{isAr ? 'لا توجد عادات مضافة بعد' : 'No Habits Added Yet'}</div>
                <p className="text-xs text-[#787774] max-w-sm mx-auto">
                  {isAr ? 'أضف عاداتك اليومية في وحدة متابع العادات لملء الرسوم البيانية لاتجاه الإنجاز الفعلي.' : 'Add daily habits in the Habit Tracker module to populate real-time completion trend graphs.'}
                </p>
                <button
                  onClick={() => onNavigateModule('habits')}
                  className="px-4 py-2 bg-[#2F3437] text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
                >
                  {isAr ? 'الذهاب إلى متابع العادات' : 'Go to Habit Tracker'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: TASK VELOCITY & WORKLOAD ALLOCATION
          ======================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-6 text-right">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Priority Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE9E6] shadow-xs space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-[#2F3437] flex items-center gap-2">
                  <BarChart3 size={16} className="text-emerald-600" />
                  {isAr ? 'تقسيم تنفيذ المهام حسب الأولوية' : 'Priority Execution Breakdown'}
                </h3>
                <p className="text-xs text-[#787774]">
                  {isAr ? 'المهام المكتملة مقابل المعلقة مصنفة حسب الأولوية.' : 'Completed versus pending tasks categorized by priority.'}
                </p>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskPriorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#787774' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#787774' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2F3437',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="completed" name={isAr ? 'منجز' : 'Completed'} fill="#059669" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="total" name={isAr ? 'إجمالي المدخل' : 'Total Logged'} fill="#EAE9E6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Category Distribution Donut Chart */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE9E6] shadow-xs space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-[#2F3437] flex items-center gap-2">
                  <PieChartIcon size={16} className="text-blue-600" />
                  {isAr ? 'توزيع التصنيفات' : 'Category Allocation'}
                </h3>
                <p className="text-xs text-[#787774]">
                  {isAr ? 'توزيع عبء العمل عبر المجالات الاستراتيجية المختلفة.' : 'Distribution of workload across strategic domains.'}
                </p>
              </div>

              <div className="w-full h-64 flex items-center justify-center">
                {taskCategoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskCategoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {taskCategoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2F3437',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-[#787774]">{isAr ? 'لا توجد مهام مدخلة بعد.' : 'No tasks logged yet.'}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: FOCUS & DEEP WORK TELEMETRY
          ======================================================== */}
      {activeTab === 'focus' && (
        <div className="space-y-6">
          {/* Focus KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Focus Hours */}
            <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] p-5 rounded-2xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{isAr ? 'إجمالي ساعات التركيز' : 'Total Focus Time'}</span>
                <Clock size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-[#2F3437] dark:text-white font-mono">
                {focusMetrics.totalHours} <span className="text-xs font-normal text-[#787774]">{isAr ? 'ساعة' : 'hrs'}</span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                {focusMetrics.totalMinutes} {isAr ? 'دقيقة مسجلة بالسحابة' : 'minutes recorded'}
              </span>
            </div>

            {/* Today's Focus */}
            <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] p-5 rounded-2xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{isAr ? 'تركيز اليوم' : "Today's Focus"}</span>
                <Flame size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {focusMetrics.todayHours} <span className="text-xs font-normal text-[#787774]">{isAr ? 'ساعة' : 'hrs'}</span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                {focusMetrics.todayMinutes} {isAr ? 'دقيقة اليوم' : 'minutes today'}
              </span>
            </div>

            {/* Completed Sessions */}
            <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] p-5 rounded-2xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{isAr ? 'الجلسات المنجزة' : 'Sessions Completed'}</span>
                <Sparkles size={16} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-[#34D399] font-mono">
                {focusMetrics.totalSessions} <span className="text-xs font-normal text-[#787774]">{isAr ? 'جلسة' : 'cycles'}</span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                {isAr ? 'دورات بومودورو مسجلة' : 'Registered sprint cycles'}
              </span>
            </div>

            {/* Top Project Focus */}
            <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] p-5 rounded-2xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{isAr ? 'المشروع الأكثر تركيزاً' : 'Top Focus Anchor'}</span>
                <FolderKanban size={16} className="text-blue-500" />
              </div>
              <div className="text-base font-extrabold text-[#2F3437] dark:text-white truncate">
                {focusMetrics.topProject}
              </div>
              <button
                onClick={() => onNavigateModule('focus')}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
              >
                <span>{isAr ? 'بدء جلسة تركيز جديدة' : 'Launch Focus Station'}</span>
                <ArrowRight size={10} className={isAr ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>

          {/* Charts Row: Trend Chart + Project Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Focus Trend Graph */}
            <div className="lg:col-span-8 bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#2F3437] dark:text-white flex items-center gap-2">
                    <BarChart3 size={16} className="text-[#34D399]" />
                    {isAr ? 'مخطط اتجاه وتطور ساعات التركيز' : 'Focus Hours Trajectory & Trends'}
                  </h3>
                  <p className="text-xs text-[#787774] dark:text-neutral-400">
                    {isAr ? 'تحليل حجم الساعات المخصصة للعمل المركز عبر الفترات الزمنية.' : 'Volume of uninterrupted deep work across hours and days.'}
                  </p>
                </div>

                {/* Period Selectors */}
                <div className="flex items-center bg-neutral-100 dark:bg-[#1E2025] p-0.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33]">
                  {([
                    { id: 'day' as const, label: isAr ? 'يوم' : 'Day' },
                    { id: 'week' as const, label: isAr ? 'أسبوع' : 'Week' },
                    { id: 'month' as const, label: isAr ? 'شهر' : 'Month' },
                    { id: 'year' as const, label: isAr ? 'سنة' : 'Year' },
                  ]).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFocusStatsPeriod(p.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        focusStatsPeriod === p.id
                          ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs'
                          : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={focusTrendData}>
                    <defs>
                      <linearGradient id="focusTelemetryColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34D399" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE9E6" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: '11px', fill: '#787774' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: '11px', fill: '#787774' }}
                      unit="h"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E2025',
                        borderColor: '#2D3136',
                        color: '#F3F4F6',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                      formatter={(val: any) => [`${val} ${isAr ? 'ساعة تركيز' : 'hrs'}`, isAr ? 'المدة' : 'Duration']}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#34D399"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#focusTelemetryColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Focus Distribution */}
            <div className="lg:col-span-4 bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#2F3437] dark:text-white flex items-center gap-2 mb-1">
                  <FolderKanban size={16} className="text-blue-600" />
                  {isAr ? 'توزيع التركيز على المشاريع' : 'Project Allocation'}
                </h3>
                <p className="text-xs text-[#787774] dark:text-neutral-400 mb-4">
                  {isAr ? 'نسبة الساعات المستثمرة لكل مشروع ومستهدف.' : 'Proportion of deep focus invested per initiative.'}
                </p>

                {focusMetrics.projectDistribution.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#787774] dark:text-neutral-400">
                    {isAr ? 'لا توجد جلسات تركيز مسجلة بعد.' : 'No focus sessions recorded yet.'}
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                    {focusMetrics.projectDistribution.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-[#2F3437] dark:text-neutral-200 truncate max-w-[140px]">
                            {item.title}
                          </span>
                          <span className="text-[#787774] dark:text-neutral-400 font-mono text-[11px]">
                            {item.hours}h ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#34D399] rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#EAE9E6] dark:border-[#2A2C33]">
                <button
                  onClick={() => onNavigateModule('focus')}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Clock size={14} />
                  <span>{isAr ? 'افتح محطة التركيز' : 'Launch Focus Station'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Focus Session Logs Table */}
          <div className="bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
              <h3 className="text-sm font-bold text-[#2F3437] dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-emerald-500" />
                <span>{isAr ? 'سجل جلسات التركيز المكتملة' : 'Focus Session Chronicles'}</span>
              </h3>
              <span className="text-xs font-mono text-neutral-400">
                {focusSessions.length} {isAr ? 'سجل' : 'entries'}
              </span>
            </div>

            {focusSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#787774] dark:text-neutral-400">
                {isAr ? 'لا توجد جلسات مسجلة حتى الآن. ابدأ جلسة بومودورو من محطة التركيز!' : 'No focus sessions recorded yet. Start a pomodoro from Focus Station!'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-[#EAE9E6] dark:border-neutral-800 text-[11px] font-bold text-[#787774] dark:text-neutral-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-start">{isAr ? 'الهدف / المهمة' : 'Focus Target'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'المدة' : 'Duration'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'التاريخ' : 'Date & Time'}</th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE9E6] dark:divide-neutral-800">
                    {focusSessions.slice(0, 10).map((s) => (
                      <tr key={s.id || s.createdAt} className="hover:bg-neutral-50 dark:hover:bg-[#202228] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#2F3437] dark:text-neutral-200">
                          {s.title || (isAr ? 'جلسة تركيز' : 'Focus Session')}
                          {s.associatedTitle && s.associatedTitle !== s.title && (
                            <span className="text-[10px] text-neutral-400 block font-normal">{s.associatedTitle}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {s.duration}m
                        </td>
                        <td className="py-2.5 px-3 text-neutral-500 font-mono text-[11px]">
                          {new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-end">
                          <button
                            onClick={async () => {
                              if (s.id) await deleteFocusSession(s.id);
                            }}
                            className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                            title={isAr ? 'حذف الجلسة' : 'Delete session'}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: DAILY BLOCKS FLOW TELEMETRY
          ======================================================== */}
      {activeTab === 'blocks' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header & Quick Launch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                  {isAr ? 'تحليلات فترات وقوالب اليوم (Daily Blocks)' : 'Daily Blocks Telemetry'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {isAr ? 'قياس نسبة الالتزام بالفترات اليومية وتوزيع ساعات العمل والراحة.' : 'Measure macro block completion, deep work proportion, and scheduled execution.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateModule('daily-blocks')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
            >
              <Layers size={14} />
              <span>{isAr ? 'فتح محرك الفترات' : 'Open Daily Blocks'}</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 shadow-3xs space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">{isAr ? 'إجمالي الفترات' : 'Total Blocks'}</span>
              <p className="text-xl font-black font-mono text-neutral-900 dark:text-white">{dailyBlocksMetrics.total}</p>
              <span className="text-[10px] text-neutral-500 font-mono">{dailyBlocksMetrics.completed} {isAr ? 'مكتملة' : 'done'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 shadow-3xs space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">{isAr ? 'نسبة الإنجاز' : 'Adherence Rate'}</span>
              <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{dailyBlocksMetrics.completionPct}%</p>
              <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dailyBlocksMetrics.completionPct}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 shadow-3xs space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">{isAr ? 'فترات التركيز العميق' : 'Deep Work Sprints'}</span>
              <p className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{dailyBlocksMetrics.deepWork}</p>
              <span className="text-[10px] text-neutral-500 font-mono">{Math.floor(dailyBlocksMetrics.plannedFocusMins / 60)}h {dailyBlocksMetrics.plannedFocusMins % 60}m {isAr ? 'مخطط' : 'planned'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 shadow-3xs space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">{isAr ? 'ساعات مسجلة' : 'Focus Logged'}</span>
              <p className="text-xl font-black font-mono text-amber-500">
                {Math.floor(dailyBlocksMetrics.loggedFocusMins / 60)}h {dailyBlocksMetrics.loggedFocusMins % 60}m
              </p>
              <span className="text-[10px] text-neutral-500 font-mono">{isAr ? 'عبر المؤقت' : 'via Pomodoro'}</span>
            </div>
          </div>

          {/* Block Type Breakdown & Recent Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Type Breakdown */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <PieChartIcon size={14} className="text-indigo-500" />
                <span>{isAr ? 'توزيع أنواع الفترات' : 'Block Archetype Distribution'}</span>
              </h4>

              {dailyBlocksMetrics.blockTypeBreakdown.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center italic">
                  {isAr ? 'لا توجد فترات مسجلة بعد. استخدم محرك Daily Blocks لإنشاء فترات يومك.' : 'No blocks recorded yet. Use Daily Blocks to organize your days.'}
                </p>
              ) : (
                <div className="space-y-2 pt-1">
                  {dailyBlocksMetrics.blockTypeBreakdown.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-neutral-700 dark:text-neutral-300">{item.name}</span>
                        <span className="font-mono text-neutral-500">{item.value} {isAr ? 'فترة' : 'blocks'}</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.round((item.value / (dailyBlocksMetrics.total || 1)) * 100))}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Blocks Feed */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Clock size={14} className="text-emerald-500" />
                <span>{isAr ? 'آخر الفترات اليومية المسجلة' : 'Recent Daily Blocks'}</span>
              </h4>

              {dailyBlocks.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center italic">
                  {isAr ? 'لا توجد فترات بعد.' : 'No daily blocks yet.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {dailyBlocks.slice(0, 6).map((b) => (
                    <div
                      key={b.id || b.title}
                      className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{b.icon || '📌'}</span>
                        <div className="min-w-0">
                          <span className={`font-bold block truncate ${b.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                            {b.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {b.date} • {b.startTime} - {b.endTime}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        b.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                      }`}>
                        {b.status === 'completed' ? (isAr ? 'مكتملة' : 'Done') : (isAr ? 'قيد الانتظار' : 'Pending')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
