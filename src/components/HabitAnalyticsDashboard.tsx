import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  BarChart2,
  TrendingUp,
  Calendar,
  Filter,
  Flame,
  Shield,
  Award,
  CheckCircle2,
  Target,
  Clock,
  ArrowUpRight,
  Sun,
  Sunrise,
  Sunset,
  Check,
  Plus,
  Activity,
  Zap,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { HabitItem, HabitRoutineTime, GoalItem } from '../types';
import { calculateHabitStats, isHabitDateFrozen } from '../utils/habitAnalytics';

interface HabitAnalyticsDashboardProps {
  habits: HabitItem[];
  activeHabits: HabitItem[];
  goals?: GoalItem[];
  allLoggedExcuses: { habitTitle: string; habitIcon: string; dateKey: string; excuse: string }[];
  todayIso: string;
  isAr: boolean;
  onOpenDetail: (habit: HabitItem) => void;
  onOpenBulkExcuse: () => void;
  onBackToMatrix: () => void;
  getCategoryLabel: (cat: string) => string;
  getColorClasses: (col?: string) => { active: string; text: string; badge: string };
}

type TimeRangeOption = '7d' | '14d' | '30d' | '90d' | 'all';

interface DailyTrendPoint {
  date: string;
  dateKey: string;
  dayLabel: string;
  weekday: string;
  completedCount: number;
  totalActive: number;
  adherenceRate: number; // 0-100%
  movingAverage: number; // 7-day rolling avg
  excusedCount: number;
}

export const HabitAnalyticsDashboard: React.FC<HabitAnalyticsDashboardProps> = ({
  habits,
  activeHabits,
  goals = [],
  allLoggedExcuses,
  todayIso,
  isAr,
  onOpenDetail,
  onOpenBulkExcuse,
  onBackToMatrix,
  getCategoryLabel,
  getColorClasses,
}) => {
  // Filter States
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRoutine, setSelectedRoutine] = useState<string>('All');
  const [selectedHabitId, setSelectedHabitId] = useState<string>('All');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('All');
  const [metricMode, setMetricMode] = useState<'percentage' | 'count'>('percentage');
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);

  // Extract unique categories from habits
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    habits.forEach((h) => {
      if (h.category) set.add(h.category);
    });
    return Array.from(set).sort();
  }, [habits]);

  // Determine active date range based on timeRange
  const dateRangeList = useMemo(() => {
    const daysCount =
      timeRange === '7d'
        ? 7
        : timeRange === '14d'
        ? 14
        : timeRange === '30d'
        ? 30
        : timeRange === '90d'
        ? 90
        : 180; // 'all' covers past 180 days

    const dates: { iso: string; date: Date }[] = [];
    const baseDate = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      dates.push({ iso, date: d });
    }
    return dates;
  }, [timeRange]);

  // Filtered habits list based on Category, Routine, Habit, and Goal Selection
  const filteredHabits = useMemo(() => {
    return activeHabits.filter((h) => {
      const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
      const matchesRoutine =
        selectedRoutine === 'All' ||
        (selectedRoutine === 'anytime' && (!h.routineTime || h.routineTime === 'anytime')) ||
        h.routineTime === selectedRoutine;
      const matchesHabit = selectedHabitId === 'All' || h.id === selectedHabitId;
      const matchesGoal = selectedGoalId === 'All' || h.goalId === selectedGoalId;
      return matchesCategory && matchesRoutine && matchesHabit && matchesGoal;
    });
  }, [activeHabits, selectedCategory, selectedRoutine, selectedHabitId, selectedGoalId]);

  // Trend data calculation for the primary line / area chart
  const trendData = useMemo(() => {
    const points: DailyTrendPoint[] = [];
    const habitPool = filteredHabits.length > 0 ? filteredHabits : activeHabits;
    const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdaysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    dateRangeList.forEach((item, index) => {
      const { iso, date } = item;
      let completedCount = 0;
      let excusedCount = 0;
      let activeForHabitCount = 0;

      habitPool.forEach((h) => {
        // Check if habit was created or valid for this date
        const isFrozen = isHabitDateFrozen(h, iso, date.getTime());
        if (h.history && h.history[iso]) {
          completedCount++;
        }
        if (isFrozen) {
          excusedCount++;
        }
        activeForHabitCount++;
      });

      const totalActive = Math.max(1, activeForHabitCount);
      const adherenceRate = Math.min(100, Math.round((completedCount / totalActive) * 100));

      const dayNum = date.getDay();
      const weekday = isAr ? weekdaysAr[dayNum] : weekdaysEn[dayNum];
      const dayLabel = date.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });

      points.push({
        date: dayLabel,
        dateKey: iso,
        dayLabel,
        weekday,
        completedCount,
        totalActive,
        adherenceRate,
        movingAverage: 0,
        excusedCount,
      });
    });

    // Compute 7-day rolling moving average for smoothed momentum
    for (let i = 0; i < points.length; i++) {
      const windowStart = Math.max(0, i - 6);
      const windowSlice = points.slice(windowStart, i + 1);
      const avgRate = Math.round(
        windowSlice.reduce((sum, p) => sum + p.adherenceRate, 0) / windowSlice.length
      );
      points[i].movingAverage = avgRate;
    }

    return points;
  }, [filteredHabits, activeHabits, dateRangeList, isAr]);

  // Aggregated Summary Metrics across the selected timeframe
  const summaryMetrics = useMemo(() => {
    const habitPool = filteredHabits.length > 0 ? filteredHabits : activeHabits;
    let totalChecks = 0;
    let totalOpportunities = 0;
    let totalExcuses = 0;

    trendData.forEach((day) => {
      totalChecks += day.completedCount;
      totalOpportunities += day.totalActive;
      totalExcuses += day.excusedCount;
    });

    const overallAdherence =
      totalOpportunities > 0 ? Math.round((totalChecks / totalOpportunities) * 100) : 0;

    // Previous window comparison
    const halfLen = Math.floor(trendData.length / 2);
    const firstHalf = trendData.slice(0, halfLen);
    const secondHalf = trendData.slice(halfLen);

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((acc, p) => acc + p.adherenceRate, 0) / firstHalf.length
        : 0;
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((acc, p) => acc + p.adherenceRate, 0) / secondHalf.length
        : 0;
    const momentumDelta = Math.round(secondHalfAvg - firstHalfAvg);

    // Streaks metrics
    const streaks = habitPool.map((h) => calculateHabitStats(h));
    const bestStreak = streaks.reduce((max, s) => Math.max(max, s.bestStreak), 0);
    const currentStreaks = streaks.map((s) => s.currentStreak);
    const avgStreak =
      currentStreaks.length > 0
        ? (currentStreaks.reduce((a, b) => a + b, 0) / currentStreaks.length).toFixed(1)
        : '0.0';
    const strongStreaksCount = currentStreaks.filter((s) => s >= 3).length;

    // Momentum status label
    let statusText = isAr ? 'بناء الروتين' : 'Building Momentum';
    let statusColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';

    if (overallAdherence >= 85) {
      statusText = isAr ? 'أداء نخبوي متفوق 🔥' : 'Elite Execution 🔥';
      statusColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    } else if (overallAdherence >= 70) {
      statusText = isAr ? 'انضباط قوي وثابت ⚡' : 'Strong Rhythm ⚡';
      statusColor = 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800';
    } else if (overallAdherence < 45) {
      statusText = isAr ? 'بحاجة إلى تركيز ⚠️' : 'Needs Focus ⚠️';
      statusColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
    }

    return {
      overallAdherence,
      totalChecks,
      totalOpportunities,
      totalExcuses,
      momentumDelta,
      bestStreak,
      avgStreak,
      strongStreaksCount,
      statusText,
      statusColor,
      totalActiveHabits: habitPool.length,
    };
  }, [filteredHabits, activeHabits, trendData, isAr]);

  // Day of Week Analysis (Monday to Sunday)
  const weekdayAnalysis = useMemo(() => {
    const habitPool = filteredHabits.length > 0 ? filteredHabits : activeHabits;
    const daysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysFullEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daysAr = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

    // Map 0 (Sunday) - 6 (Saturday) to Monday-start index
    // Sun(0) -> 6, Mon(1) -> 0, Tue(2) -> 1, Wed(3) -> 2, Thu(4) -> 3, Fri(5) -> 4, Sat(6) -> 5
    const toMonIdx = (dayNum: number) => (dayNum === 0 ? 6 : dayNum - 1);

    const counts = [0, 0, 0, 0, 0, 0, 0];
    const totals = [0, 0, 0, 0, 0, 0, 0];

    trendData.forEach((point) => {
      const parts = point.dateKey.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const idx = toMonIdx(d.getDay());
        counts[idx] += point.completedCount;
        totals[idx] += point.totalActive;
      }
    });

    const result = daysEn.map((name, idx) => {
      const completed = counts[idx];
      const total = Math.max(1, totals[idx]);
      const rate = totals[idx] > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        shortName: isAr ? daysAr[idx] : name,
        fullName: isAr ? daysAr[idx] : daysFullEn[idx],
        rate,
        completed,
        total: totals[idx],
      };
    });

    // Find best and lowest day
    const validDays = result.filter((d) => d.total > 0);
    const sorted = [...validDays].sort((a, b) => b.rate - a.rate);
    const bestDay = sorted[0] || result[0];
    const lowestDay = sorted[sorted.length - 1] || result[0];

    return {
      days: result,
      bestDay,
      lowestDay,
    };
  }, [filteredHabits, activeHabits, trendData, isAr]);

  // Category Breakdown Metrics
  const categoryBreakdown = useMemo(() => {
    const catsMap: Record<
      string,
      { count: number; completedInPeriod: number; opportunitiesInPeriod: number }
    > = {};

    activeHabits.forEach((h) => {
      const cat = h.category || 'General';
      if (!catsMap[cat]) {
        catsMap[cat] = { count: 0, completedInPeriod: 0, opportunitiesInPeriod: 0 };
      }
      catsMap[cat].count++;

      dateRangeList.forEach((d) => {
        catsMap[cat].opportunitiesInPeriod++;
        if (h.history && h.history[d.iso]) {
          catsMap[cat].completedInPeriod++;
        }
      });
    });

    return Object.keys(catsMap).map((catName) => {
      const data = catsMap[catName];
      const rate =
        data.opportunitiesInPeriod > 0
          ? Math.round((data.completedInPeriod / data.opportunitiesInPeriod) * 100)
          : 0;
      return {
        category: catName,
        label: getCategoryLabel(catName),
        habitCount: data.count,
        rate,
        completed: data.completedInPeriod,
        total: data.opportunitiesInPeriod,
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [activeHabits, dateRangeList, getCategoryLabel]);

  // Routine Time Breakdown (Morning, Afternoon, Evening, Anytime)
  const routineBreakdown = useMemo(() => {
    const routines: { key: HabitRoutineTime; label: string; icon: string }[] = [
      { key: 'morning', label: isAr ? 'صباحي' : 'Morning', icon: '☀️' },
      { key: 'afternoon', label: isAr ? 'بعد الظهر' : 'Afternoon', icon: '🌤️' },
      { key: 'evening', label: isAr ? 'مسائي' : 'Evening', icon: '🌙' },
      { key: 'anytime', label: isAr ? 'أي وقت' : 'Anytime', icon: '⚡' },
    ];

    return routines.map((r) => {
      const matchingHabits = activeHabits.filter(
        (h) => (h.routineTime || 'anytime') === r.key
      );
      let completed = 0;
      let total = 0;

      matchingHabits.forEach((h) => {
        dateRangeList.forEach((d) => {
          total++;
          if (h.history && h.history[d.iso]) completed++;
        });
      });

      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...r,
        habitCount: matchingHabits.length,
        rate,
        completed,
        total,
      };
    });
  }, [activeHabits, dateRangeList, isAr]);

  // Individual Habits Performance Table Data
  const habitLeaderboard = useMemo(() => {
    const habitPool = filteredHabits.length > 0 ? filteredHabits : activeHabits;
    return habitPool.map((h) => {
      const stats = calculateHabitStats(h);
      let completedInPeriod = 0;
      const recent7DaysStatus: { iso: string; completed: boolean; frozen: boolean }[] = [];

      // Last 7 days status for sparkline dots
      const last7Days = dateRangeList.slice(-7);
      last7Days.forEach((d) => {
        const isDone = Boolean(h.history && h.history[d.iso]);
        const isFrozen = isHabitDateFrozen(h, d.iso, d.date.getTime());
        recent7DaysStatus.push({
          iso: d.iso,
          completed: isDone,
          frozen: isFrozen,
        });
      });

      dateRangeList.forEach((d) => {
        if (h.history && h.history[d.iso]) completedInPeriod++;
      });

      const totalOpportunities = Math.max(1, dateRangeList.length);
      const periodRate = Math.round((completedInPeriod / totalOpportunities) * 100);

      // Performance badge
      let badgeLabel = isAr ? 'قيد البناء' : 'Building';
      let badgeClass = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700';

      if (periodRate >= 85) {
        badgeLabel = isAr ? 'ثبات ممتاز 🔥' : 'Rock Solid 🔥';
        badgeClass = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700';
      } else if (periodRate >= 70) {
        badgeLabel = isAr ? 'منتظم ⚡' : 'Consistent ⚡';
        badgeClass = 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700';
      } else if (periodRate < 45) {
        badgeLabel = isAr ? 'انتباه ⚠️' : 'At Risk ⚠️';
        badgeClass = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700';
      }

      return {
        habit: h,
        stats,
        periodRate,
        completedInPeriod,
        totalOpportunities,
        recent7DaysStatus,
        badgeLabel,
        badgeClass,
      };
    }).sort((a, b) => b.periodRate - a.periodRate);
  }, [filteredHabits, activeHabits, dateRangeList, isAr]);

  return (
    <div className={`space-y-6 animate-fadeIn ${isAr ? 'text-right' : 'text-left'}`}>
      {/* ========================================================
          1. TOP CONTROLS & INTERACTIVE FILTERS BAR
          ======================================================== */}
      <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
              <BarChart2 size={16} className="text-indigo-500" />
              <span>{isAr ? 'لوحة تحليلات العادات ومؤشرات التقدم' : 'Habit Analytics & Performance Engine'}</span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${summaryMetrics.statusColor}`}>
                {summaryMetrics.statusText}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              {isAr ? 'معدلات الالتزام، التوالي والمنحنى البياني الزمني' : 'Adherence Trajectory, Streaks & Behavioral Rhythm'}
            </h3>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mr-1 rtl:mr-0 rtl:ml-1 flex items-center gap-1">
              <Calendar size={13} />
              {isAr ? 'المدى:' : 'Range:'}
            </span>
            {(['7d', '14d', '30d', '90d', 'all'] as TimeRangeOption[]).map((range) => {
              const labelMap: Record<TimeRangeOption, { en: string; ar: string }> = {
                '7d': { en: '7D', ar: '7 أيام' },
                '14d': { en: '14D', ar: '14 يوماً' },
                '30d': { en: '30D', ar: '30 يوماً' },
                '90d': { en: '90D', ar: '90 يوماً' },
                all: { en: 'All', ar: 'الكل' },
              };
              const isActive = timeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs scale-102'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {isAr ? labelMap[range].ar : labelMap[range].en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Filter size={12} />
              <span>{isAr ? 'التصنيف' : 'Category'}</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">{isAr ? 'جميع التصنيفات' : 'All Categories'}</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Routine Time Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} />
              <span>{isAr ? 'توقيت الروتين' : 'Routine Time'}</span>
            </label>
            <select
              value={selectedRoutine}
              onChange={(e) => setSelectedRoutine(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">{isAr ? 'كل الفترات اليومية' : 'All Day Routines'}</option>
              <option value="morning">☀️ {isAr ? 'صباحي' : 'Morning'}</option>
              <option value="afternoon">🌤️ {isAr ? 'بعد الظهر' : 'Afternoon'}</option>
              <option value="evening">🌙 {isAr ? 'مسائي' : 'Evening'}</option>
              <option value="anytime">⚡ {isAr ? 'أي وقت خلال اليوم' : 'Anytime'}</option>
            </select>
          </div>

          {/* Goal Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Target size={12} className="text-emerald-500" />
              <span>{isAr ? 'الهدف الاستراتيجي' : 'Strategic Goal'}</span>
            </label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
            >
              <option value="All">{isAr ? 'كل الأهداف (بدون فلترة)' : 'All Goals (No Filter)'}</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  🎯 {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Individual Habit Drill-down */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Target size={12} />
              <span>{isAr ? 'العادة المستهدفة' : 'Habit Focus'}</span>
            </label>
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
            >
              <option value="All">{isAr ? 'كل العادات مجمعة (تراكمي)' : 'All Habits (Cumulative)'}</option>
              {activeHabits.map((h) => (
                <option key={h.id || h.title} value={h.id || h.title}>
                  {h.icon || '🔥'} {h.title}
                </option>
              ))}
            </select>
          </div>

          {/* Metric View & Moving Average Toggles */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={12} />
              <span>{isAr ? 'طريقة العرض' : 'Metric Mode'}</span>
            </label>
            <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMetricMode('percentage')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  metricMode === 'percentage'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'النسبة %' : 'Rate %'}
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('count')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  metricMode === 'count'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'العدد' : 'Count'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CORE EXECUTIVE KPI METRIC CARDS
          ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Adherence Rate */}
        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isAr ? 'معدل الالتزام للفترة' : 'Period Adherence'}
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
              {summaryMetrics.overallAdherence}%
            </span>
            {summaryMetrics.momentumDelta !== 0 && (
              <span
                className={`text-xs font-bold flex items-center font-mono ${
                  summaryMetrics.momentumDelta > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {summaryMetrics.momentumDelta > 0 ? '+' : ''}
                {summaryMetrics.momentumDelta}%
              </span>
            )}
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                summaryMetrics.overallAdherence >= 80
                  ? 'bg-emerald-500'
                  : summaryMetrics.overallAdherence >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, summaryMetrics.overallAdherence)}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-mono">
            {summaryMetrics.totalChecks} / {summaryMetrics.totalOpportunities} {isAr ? 'إنجاز محقق' : 'logged check-ins'}
          </p>
        </div>

        {/* Best & Average Streak */}
        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isAr ? 'أطول سلسلة وأفضل ثبات' : 'Best Active Streak'}
            </span>
            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <Flame size={16} className="fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {summaryMetrics.bestStreak}
            </span>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {isAr ? 'يوم متواصل' : 'days max'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2.5 text-[11px] text-neutral-600 dark:text-neutral-300 font-medium">
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
              {summaryMetrics.strongStreaksCount} {isAr ? 'عادات ≥ 3 أيام' : 'habits on streak'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            {isAr ? `متوسط التوالي: ${summaryMetrics.avgStreak} يوماً` : `Avg streak: ${summaryMetrics.avgStreak} days`}
          </p>
        </div>

        {/* Total Habits Tracked */}
        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isAr ? 'العادات تحت المتابعة' : 'Active Tracked Habits'}
            </span>
            <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
              <Target size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
              {summaryMetrics.totalActiveHabits}
            </span>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {isAr ? 'عادة نشطة' : 'active habits'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {isAr
                ? `${availableCategories.length} مجالات أسلوب حياة`
                : `${availableCategories.length} lifestyle categories`}
            </span>
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">
            {isAr ? 'مزامنة فورية ودقيقة' : '100% cloud synced'}
          </p>
        </div>

        {/* Excuses & Streak Shields */}
        <div className="bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isAr ? 'الأعذار والحماية' : 'Protected Streak Days'}
            </span>
            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500">
              <Shield size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {allLoggedExcuses.length}
            </span>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              {isAr ? 'سياق موثق' : 'audit logs'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md font-mono">
              {isAr ? 'حماية من الاحتراق الذهني' : 'Zero Guilt Buffer'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            {isAr ? 'سجلات استثنائية معتمدة' : 'Official context records'}
          </p>
        </div>
      </div>

      {/* ========================================================
          3. MAIN INTERACTIVE TRAJECTORY CHART (RECHARTS)
          ======================================================== */}
      <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Activity size={18} />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                {isAr ? 'المنحنى الزمني للالتزام اليومي ومعدل الإنجاز' : 'Daily Adherence & Completion Trajectory'}
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isAr
                ? 'رسم بياني تفاعلي يوضح نسبة إنجاز العادات عبر الأيام مع خط المتوسط المتحرك لتقييم الزخم.'
                : 'Interactive timeline charting daily habit execution with 7-day moving average trajectory.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Toggle 7-Day Moving Average */}
            <button
              type="button"
              onClick={() => setShowMovingAverage(!showMovingAverage)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showMovingAverage
                  ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <span className="w-2.5 h-0.5 bg-purple-500 rounded-full inline-block" />
              <span>{isAr ? 'المتوسط المتحرك (7 أيام)' : '7-Day Rolling Trend'}</span>
            </button>

            {/* Target 80% Benchmark */}
            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-mono">
              <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-500 inline-block" />
              <span>{isAr ? 'الهدف: 80%' : '80% Goal'}</span>
            </div>
          </div>
        </div>

        {/* The Recharts Graphic */}
        <div className="h-[280px] sm:h-[320px] w-full pt-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="habitAdherenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="habitCountGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#888888' }}
                tickLine={false}
                axisLine={{ stroke: '#88888830' }}
                interval={trendData.length > 30 ? Math.floor(trendData.length / 10) : 0}
              />

              <YAxis
                domain={metricMode === 'percentage' ? [0, 100] : [0, 'auto']}
                tick={{ fontSize: 11, fill: '#888888' }}
                tickLine={false}
                axisLine={false}
                unit={metricMode === 'percentage' ? '%' : ''}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data: DailyTrendPoint = payload[0].payload;
                    return (
                      <div className="bg-neutral-900/95 dark:bg-neutral-800/95 text-white p-3 rounded-2xl shadow-xl border border-neutral-700/80 backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
                        <div className="font-bold flex items-center justify-between pb-1 border-b border-neutral-700">
                          <span>{data.dateKey}</span>
                          <span className="text-neutral-400 font-mono">{data.weekday}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 font-mono">
                          <span className="text-neutral-400">{isAr ? 'نسبة الإنجاز:' : 'Adherence:'}</span>
                          <span className="font-bold text-emerald-400 text-sm">{data.adherenceRate}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 font-mono">
                          <span className="text-neutral-400">{isAr ? 'العادات المنجزة:' : 'Completed:'}</span>
                          <span className="font-bold text-white">
                            {data.completedCount} / {data.totalActive}
                          </span>
                        </div>
                        {showMovingAverage && (
                          <div className="flex items-center justify-between gap-3 font-mono pt-1 border-t border-neutral-700/60 text-[11px]">
                            <span className="text-purple-400">{isAr ? 'المتوسط المتحرك:' : 'Rolling 7d Avg:'}</span>
                            <span className="font-bold text-purple-300">{data.movingAverage}%</span>
                          </div>
                        )}
                        {data.excusedCount > 0 && (
                          <div className="text-[10px] text-blue-300 flex items-center gap-1 font-semibold pt-0.5">
                            <Shield size={10} />
                            <span>{data.excusedCount} {isAr ? 'عذر مسجل' : 'excused context'}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* 80% Benchmark Reference Line */}
              {metricMode === 'percentage' && (
                <ReferenceLine
                  y={80}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
              )}

              {/* Area for Primary Metric */}
              <Area
                type="monotone"
                dataKey={metricMode === 'percentage' ? 'adherenceRate' : 'completedCount'}
                stroke={metricMode === 'percentage' ? '#10B981' : '#6366F1'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${metricMode === 'percentage' ? 'habitAdherenceGradient' : 'habitCountGradient'})`}
                activeDot={{ r: 6, fill: metricMode === 'percentage' ? '#10B981' : '#6366F1', stroke: '#ffffff', strokeWidth: 2 }}
              />

              {/* Rolling 7-day Moving Average Line */}
              {showMovingAverage && metricMode === 'percentage' && (
                <Area
                  type="monotone"
                  dataKey="movingAverage"
                  stroke="#A855F7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================
          4. TWO-COLUMN ANALYTICS: WEEKDAY RHYTHM & CATEGORY RADAR
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Day-of-the-Week Consistency Rhythm */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
                  <Calendar size={18} />
                </span>
                <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  {isAr ? 'الإيقاع الأسبوعي (توزيع أيام الأسبوع)' : 'Weekday Consistency Rhythm'}
                </h4>
              </div>
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-lg">
                {isAr ? 'معدل الالتزام' : 'Adherence Rate'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {isAr
                ? `أقوى يوم إنجاز لديك هو ${weekdayAnalysis.bestDay.fullName} (${weekdayAnalysis.bestDay.rate}%)`
                : `Peak performance day is ${weekdayAnalysis.bestDay.fullName} (${weekdayAnalysis.bestDay.rate}%)`}
            </p>
          </div>

          {/* Bar Chart by Day */}
          <div className="h-[220px] w-full pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayAnalysis.days} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#888888' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#888888' }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-neutral-900 text-white p-2.5 rounded-xl text-xs font-mono shadow-lg border border-neutral-700">
                          <p className="font-bold text-amber-400">{data.fullName}</p>
                          <p className="text-white mt-1">{data.rate}% {isAr ? 'التزام' : 'adherence'}</p>
                          <p className="text-neutral-400 text-[10px]">{data.completed} / {data.total} {isAr ? 'إنجاز' : 'checks'}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {weekdayAnalysis.days.map((entry, idx) => {
                    const color = entry.rate >= 80 ? '#10B981' : entry.rate >= 60 ? '#F59E0B' : '#EF4444';
                    return <Cell key={`cell-${idx}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Insights */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                🏆 {isAr ? 'الأعلى كفاءة' : 'Strongest Day'}
              </span>
              <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                {weekdayAnalysis.bestDay.fullName} ({weekdayAnalysis.bestDay.rate}%)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                ⚡ {isAr ? 'أدنى استقرار' : 'Needs Focus'}
              </span>
              <span className="font-bold text-neutral-900 dark:text-white mt-0.5 block">
                {weekdayAnalysis.lowestDay.fullName} ({weekdayAnalysis.lowestDay.rate}%)
              </span>
            </div>
          </div>
        </div>

        {/* Category & Routine Distribution */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
                  <Zap size={18} />
                </span>
                <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  {isAr ? 'الالتزام حسب مجالات الحياة والروتين' : 'Category & Routine Adherence'}
                </h4>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                {categoryBreakdown.length} {isAr ? 'تصنيفات' : 'domains'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {isAr
                ? 'توزيع التزامك وفق المجالات الحياتية وتوقيت اليوم (صباح، ظهيرة، مساء).'
                : 'Execution rate broken down across lifestyle pillars and daily routine phases.'}
            </p>
          </div>

          {/* Category Progress Bars */}
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              {isAr ? 'أداء مجالات الحياة' : 'Lifestyle Domain Performance'}
            </span>
            <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {cat.label} ({cat.habitCount} {isAr ? 'عادات' : 'habits'})
                    </span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white">
                      {cat.rate}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.rate >= 80 ? 'bg-emerald-500' : cat.rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${cat.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Routine Time Breakdown Chips */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              {isAr ? 'الالتزام حسب الفترات اليومية' : 'Routine Phase Execution'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {routineBreakdown
                .filter((r) => r.key !== 'anytime')
                .map((r) => (
                  <div
                    key={r.key}
                    className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-center"
                  >
                    <span className="text-sm block">{r.icon}</span>
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300 block mt-0.5">
                      {r.label}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-neutral-900 dark:text-white block mt-0.5">
                      {r.rate}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          5. HABIT PERFORMANCE MATRIX & LEADERBOARD
          ======================================================== */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <Award size={18} />
              </span>
              <h4 className="font-bold text-base text-neutral-900 dark:text-white">
                {isAr ? 'مصفوفة أداء العادات والتوالي الفردي' : 'Habit Performance Matrix & Consistency Table'}
              </h4>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isAr
                ? 'جدول تفصيلي يوضح نسبة إنجاز كل عادة خلال المدى المختار وآخر 7 أيام وسلسلة الالتزام.'
                : 'Detailed metrics for every habit with rolling completion rates, 7-day sparklines, and streak health.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <span>{isAr ? 'العادات المعروضة:' : 'Showing:'}</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-white">
              {habitLeaderboard.length} / {activeHabits.length}
            </span>
          </div>
        </div>

        {habitLeaderboard.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 font-medium">
            {isAr
              ? 'لا توجد عادات تطابق الفلتر الحالي. يرجى تعديل الفلاتر أعلاه.'
              : 'No habits match the active filter criteria. Adjust the filters above.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px] text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-[11px] font-bold text-neutral-500">
                  <th className={`py-3 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>
                    {isAr ? 'العادة والتصنيف' : 'Habit & Category'}
                  </th>
                  <th className="py-3 px-3 text-center">{isAr ? 'نسبة الإنجاز' : 'Adherence'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'سجل آخر 7 أيام' : 'Last 7 Days'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'السلسلة الحالية' : 'Current Streak'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'أفضل سلسلة' : 'Best Streak'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className={`py-3 px-3.5 ${isAr ? 'text-left' : 'text-right'}`}>
                    {isAr ? 'الإجراء' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {habitLeaderboard.map((item, idx) => {
                  const { habit, stats, periodRate, recent7DaysStatus, badgeLabel, badgeClass } = item;
                  const colorTheme = getColorClasses(habit.color || 'amber');

                  return (
                    <tr
                      key={habit.id || `habit-${idx}`}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Title & Category */}
                      <td className={`py-3 px-3.5 ${isAr ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                            {habit.icon || '🔥'}
                          </span>
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-white block hover:text-indigo-600 cursor-pointer" onClick={() => onOpenDetail(habit)}>
                              {habit.title}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${colorTheme.badge}`}>
                                {getCategoryLabel(habit.category)}
                              </span>
                              {habit.routineTime && (
                                <span className="text-[10px] text-neutral-500">
                                  {habit.routineTime === 'morning' ? '☀️' : habit.routineTime === 'afternoon' ? '🌤️' : habit.routineTime === 'evening' ? '🌙' : '⚡'}
                                </span>
                              )}
                              {habit.goalId && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                  <Target size={10} />
                                  <span>{goals.find((g) => g.id === habit.goalId)?.title || (isAr ? 'هدف استراتيجي' : 'Goal')}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Period Rate with Progress Bar */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-extrabold text-neutral-900 dark:text-white text-xs">
                            {periodRate}%
                          </span>
                          <div className="w-16 bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                periodRate >= 80 ? 'bg-emerald-500' : periodRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${periodRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 7-Day Sparkline Dots */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {recent7DaysStatus.map((day, dIdx) => (
                            <span
                              key={`dot-${dIdx}`}
                              title={`${day.iso}: ${day.completed ? 'Completed' : day.frozen ? 'Excused' : 'Missed'}`}
                              className={`w-2.5 h-2.5 rounded-full transition-all ${
                                day.completed
                                  ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                                  : day.frozen
                                  ? 'bg-blue-400 ring-2 ring-blue-400/20'
                                  : 'bg-neutral-200 dark:bg-neutral-700'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Current Streak */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                        <span className="flex items-center justify-center gap-0.5">
                          <Flame size={12} className="fill-amber-500" />
                          <span>{stats.currentStreak}d</span>
                        </span>
                      </td>

                      {/* Best Streak */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                        {stats.bestStreak}d
                      </td>

                      {/* Status Tag */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </td>

                      {/* Action */}
                      <td className={`py-3 px-3.5 ${isAr ? 'text-left' : 'text-right'}`}>
                        <button
                          type="button"
                          onClick={() => onOpenDetail(habit)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                        >
                          {isAr ? 'تفاصيل' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          6. CONTEXT & EXCUSE AUDIT LOG (سجل الأعذار والسياق الظرفي الشهري)
          ======================================================== */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Shield size={18} className="text-blue-500" />
              <span>{isAr ? 'سجل الأعذار والسياق الظرفي الشهري (Context Audit Log)' : 'Monthly Context & Excuse Audit Log'}</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isAr
                ? 'تحليل موضوعي للأيام التي توقفت فيها لظروف طارئة، زيارات، أو تركيز استثنائي على مشاريع أخرى لراحة الذهن وعدم النسيان.'
                : 'Objective review of missed habit days protected by formal context excuses.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenBulkExcuse}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>{isAr ? 'تسجيل عذر لأيام سابقة' : 'Log Context Excuse'}</span>
          </button>
        </div>

        {allLoggedExcuses.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 font-medium">
            {isAr
              ? 'لا توجد أعذار أو سياق استثنائي مسجل حالياً. انقر على "تسجيل عذر لأيام سابقة" لتوثيق أسباب التوقف.'
              : 'No context excuses logged yet. Click "Log Context Excuse" to record reasons for missed days.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px] text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-[11px] font-bold text-neutral-500">
                  <th className={`py-2.5 px-3 ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'العادة' : 'Habit'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className={`py-2.5 px-3 ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'العذر الموثق / السياق' : 'Logged Context Excuse'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
                {allLoggedExcuses.slice(0, 15).map((item, idx) => (
                  <tr key={`excuse-audit-${idx}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className={`py-2.5 px-3 font-bold text-neutral-900 dark:text-white ${isAr ? 'text-right' : 'text-left'}`}>
                      <span className="mr-1 rtl:mr-0 rtl:ml-1">{item.habitIcon}</span>
                      <span>{item.habitTitle}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-neutral-500">
                      {item.dateKey}
                    </td>
                    <td className={`py-2.5 px-3 text-blue-700 dark:text-blue-300 font-bold ${isAr ? 'text-right' : 'text-left'}`}>
                      {item.excuse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Back to Matrix button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onBackToMatrix}
          className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-black dark:hover:bg-neutral-200 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
        >
          <Check size={14} />
          <span>{isAr ? 'العودة لشبكة تسجيل العادات اليومية' : 'Back to Daily Check-in Matrix'}</span>
        </button>
      </div>
    </div>
  );
};
