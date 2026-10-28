import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Layers, 
  FolderKanban, 
  CheckSquare, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3, 
  Timer, 
  Award, 
  Zap, 
  Target, 
  ChevronRight, 
  Compass, 
  Activity,
  CalendarDays,
  Percent,
  SlidersHorizontal,
  Sun,
  ShieldCheck,
  Check,
  Dumbbell
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  TaskItem, 
  HabitItem, 
  ProjectItem, 
  NoteItem, 
  WeeklyPlanSlot, 
  ChecklistGroup, 
  ModuleType, 
  FocusSession,
  RewardItem,
  TaskSkipReason,
  DailyBlockItem,
  DailySleepLog,
  SleepScheduleConfig,
  ReviewEntry,
  WorkoutSession
} from '../types';
import { translations } from '../utils/translations';
import { RewardStoreModal } from './RewardStoreModal';

interface DashboardOverviewProps {
  tasks: TaskItem[];
  habits: HabitItem[];
  projects: ProjectItem[];
  notes?: NoteItem[];
  plans?: WeeklyPlanSlot[];
  dailyBlocks?: DailyBlockItem[];
  checklists?: ChecklistGroup[];
  focusSessions?: FocusSession[];
  rewards?: RewardItem[];
  sleepLogs?: DailySleepLog[];
  sleepConfig?: SleepScheduleConfig | null;
  reviews?: ReviewEntry[];
  workouts?: WorkoutSession[];
  setActiveModule: (m: ModuleType) => void;
  onToggleTask?: (id: string, completed: boolean) => void;
  onToggleHabit?: (habit: HabitItem, dateKey: string) => void;
  onBatchCompleteHabits?: (habitIds: string[], dateKey: string) => void;
  onAddReward?: (reward: Omit<RewardItem, 'id'>) => Promise<void>;
  onClaimReward?: (rewardId: string) => Promise<void>;
  onDeleteReward?: (rewardId: string) => Promise<void>;
  onApplyTaskSkip?: (taskId: string, skipReason: TaskSkipReason, newDueDate: string) => Promise<void>;
  onApplyFreezeExcuse?: (habit: HabitItem, dateKey: string, excuse: string) => Promise<void>;
  onRemoveFreeze?: (habit: HabitItem, dateKey: string) => Promise<void>;
  lang?: 'en' | 'ar';
}

type TimeHorizon = 'day' | 'week' | 'month';
type MetricDomain = 'all' | 'focus' | 'tasks' | 'habits';

const PROJECT_PALETTE = [
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#14B8A6'  // Teal
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tasks = [],
  habits = [],
  projects = [],
  dailyBlocks = [],
  focusSessions = [],
  rewards = [],
  workouts = [],
  setActiveModule,
  onClaimReward,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';

  // -------------------------------------------------------------------------
  // Executive Dashboard Controls
  // -------------------------------------------------------------------------
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('week');
  const [metricDomain, setMetricDomain] = useState<MetricDomain>('all');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // Date Intelligence & Timestamps
  // -------------------------------------------------------------------------
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [now]);

  // Formatted date string for top cockpit
  const formattedToday = useMemo(() => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return new Intl.DateTimeFormat(isAr ? 'ar-MA' : 'en-US', options).format(now);
    } catch {
      return todayStr;
    }
  }, [now, isAr, todayStr]);

  // -------------------------------------------------------------------------
  // Focus Hours Analytics (Today, This Week, This Month)
  // -------------------------------------------------------------------------
  const focusStats = useMemo(() => {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Start of this week (Monday)
    const dayOfWeek = (now.getDay() + 6) % 7; // Mon = 0, Sun = 6
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const startOfLastWeek = startOfWeek - 7 * 86400000;
    const endOfLastWeek = startOfWeek - 1;

    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const endOfLastMonth = startOfMonth - 1;

    let todayMinutes = 0;
    let thisWeekMinutes = 0;
    let lastWeekMinutes = 0;
    let thisMonthMinutes = 0;
    let lastMonthMinutes = 0;

    focusSessions.forEach((s) => {
      const duration = s.duration || 0;
      const t = s.createdAt;
      if (t >= startOfToday) {
        todayMinutes += duration;
      }
      if (t >= startOfWeek) {
        thisWeekMinutes += duration;
      } else if (t >= startOfLastWeek && t <= endOfLastWeek) {
        lastWeekMinutes += duration;
      }

      if (t >= startOfMonth) {
        thisMonthMinutes += duration;
      } else if (t >= startOfLastMonth && t <= endOfLastMonth) {
        lastMonthMinutes += duration;
      }
    });

    const formatHM = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h === 0) return `${m}m`;
      return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    };

    return {
      todayMinutes,
      todayFormatted: formatHM(todayMinutes),
      thisWeekMinutes,
      thisWeekFormatted: formatHM(thisWeekMinutes),
      lastWeekMinutes,
      lastWeekFormatted: formatHM(lastWeekMinutes),
      thisMonthMinutes,
      thisMonthFormatted: formatHM(thisMonthMinutes),
      lastMonthMinutes,
      lastMonthFormatted: formatHM(lastMonthMinutes),
      weekChangePercent: lastWeekMinutes > 0 
        ? Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100) 
        : (thisWeekMinutes > 0 ? 100 : 0)
    };
  }, [focusSessions, now]);

  // -------------------------------------------------------------------------
  // Tasks Delivery Analytics
  // -------------------------------------------------------------------------
  const taskStats = useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.archived);
    const completedTasks = activeTasks.filter((t) => t.completed);

    // Period specific tasks
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const startOfLastWeek = startOfWeek - 7 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const todayDone = completedTasks.filter((t) => (t.completedAt || t.createdAt) >= startOfToday).length;
    const weekDone = completedTasks.filter((t) => (t.completedAt || t.createdAt) >= startOfWeek).length;
    const lastWeekDone = completedTasks.filter((t) => {
      const time = t.completedAt || t.createdAt;
      return time >= startOfLastWeek && time < startOfWeek;
    }).length;
    const monthDone = completedTasks.filter((t) => (t.completedAt || t.createdAt) >= startOfMonth).length;

    const rate = activeTasks.length > 0 ? Math.round((completedTasks.length / activeTasks.length) * 100) : 0;
    const weekRateChange = lastWeekDone > 0 ? Math.round(((weekDone - lastWeekDone) / lastWeekDone) * 100) : (weekDone > 0 ? 100 : 0);

    return {
      total: activeTasks.length,
      completed: completedTasks.length,
      completionRate: rate,
      todayDone,
      weekDone,
      lastWeekDone,
      monthDone,
      weekRateChange
    };
  }, [tasks, now]);

  // -------------------------------------------------------------------------
  // Habit Discipline Analytics
  // -------------------------------------------------------------------------
  const habitStats = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived);
    if (activeHabits.length === 0) {
      return { todayRate: 0, weekRate: 0, activeStreak: 0, totalCount: 0 };
    }

    // Today's completion
    const todayDone = activeHabits.filter((h) => h.history && h.history[todayStr] === true).length;
    const todayRate = Math.round((todayDone / activeHabits.length) * 100);

    // 7-day average consistency
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${da}`);
    }

    let totalPossible = activeHabits.length * 7;
    let totalCompleted = 0;
    days.forEach((dayKey) => {
      activeHabits.forEach((h) => {
        if (h.history && h.history[dayKey]) {
          totalCompleted++;
        }
      });
    });

    const weekRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const maxStreak = activeHabits.reduce((acc, h) => Math.max(acc, h.streak || 0), 0);

    return {
      todayDone,
      todayRate,
      weekRate,
      activeStreak: maxStreak,
      totalCount: activeHabits.length
    };
  }, [habits, now, todayStr]);

  // -------------------------------------------------------------------------
  // Projects Intelligence & Target vs Actual Allocation
  // -------------------------------------------------------------------------
  const projectIntelligence = useMemo(() => {
    const activeProjects = projects.filter((p) => !p.archived);
    if (activeProjects.length === 0) {
      return {
        chartData: [],
        items: [],
        dominantProject: null,
        topPerformingProject: null,
        totalFocusMinutes: 0
      };
    }

    // Map tasks to projects
    const tasksByProject: Record<string, TaskItem[]> = {};
    activeProjects.forEach((p) => {
      if (p.id) tasksByProject[p.id] = [];
    });

    tasks.forEach((t) => {
      const pid = t.projectId || t.linkedProjectId;
      if (pid && tasksByProject[pid]) {
        tasksByProject[pid].push(t);
      }
    });

    // Map focus sessions to projects
    const focusByProject: Record<string, number> = {};
    activeProjects.forEach((p) => {
      if (p.id) focusByProject[p.id] = 0;
    });

    focusSessions.forEach((s) => {
      if (s.associatedType === 'project' && s.associatedId && focusByProject[s.associatedId] !== undefined) {
        focusByProject[s.associatedId] += s.duration || 0;
      }
    });

    // Also factor in task-specific focusedMinutes
    Object.entries(tasksByProject).forEach(([pid, ptasks]) => {
      const taskFocus = ptasks.reduce((acc, t) => acc + (t.focusedMinutes || 0), 0);
      focusByProject[pid] = (focusByProject[pid] || 0) + taskFocus;
    });

    const totalProjectFocus = Object.values(focusByProject).reduce((acc, val) => acc + val, 0);
    const totalProjectTasks = Object.values(tasksByProject).reduce((acc, val) => acc + val.length, 0);

    // Compute metrics for each project
    const items = activeProjects.map((p, idx) => {
      const pid = p.id || `proj-${idx}`;
      const ptasks = tasksByProject[pid] || [];
      const completedTasks = ptasks.filter((t) => t.completed).length;
      const taskVelocity = ptasks.length > 0 ? Math.round((completedTasks / ptasks.length) * 100) : 0;
      const focusMins = focusByProject[pid] || 0;

      // Actual Execution Share % (weighted by focus time and tasks)
      let actualShare = 0;
      if (totalProjectFocus > 0 && totalProjectTasks > 0) {
        const timeShare = (focusMins / totalProjectFocus) * 100;
        const taskShare = (ptasks.length / totalProjectTasks) * 100;
        actualShare = Math.round(timeShare * 0.6 + taskShare * 0.4);
      } else if (totalProjectFocus > 0) {
        actualShare = Math.round((focusMins / totalProjectFocus) * 100);
      } else if (totalProjectTasks > 0) {
        actualShare = Math.round((ptasks.length / totalProjectTasks) * 100);
      } else {
        actualShare = Math.round(100 / activeProjects.length);
      }

      // Target Daily Allocation % (from project model or default evenly)
      const targetAllocation = p.dailyAllocationPercentage ?? Math.round(100 / activeProjects.length);
      const delta = actualShare - targetAllocation;

      const color = p.color && p.color.startsWith('#') 
        ? p.color 
        : PROJECT_PALETTE[idx % PROJECT_PALETTE.length];

      return {
        id: pid,
        title: p.title,
        category: p.category,
        status: p.status,
        color,
        tasksTotal: ptasks.length,
        tasksCompleted: completedTasks,
        taskVelocity,
        focusMinutes: focusMins,
        focusFormatted: `${Math.floor(focusMins / 60)}h ${focusMins % 60}m`,
        targetAllocation,
        actualShare,
        delta
      };
    });

    // Determine Dominant Project (Highest actual execution share)
    const dominantProject = [...items].sort((a, b) => b.actualShare - a.actualShare)[0] || null;

    // Determine Top Performing Project (Highest task velocity with min 1 task)
    const topPerformingProject = [...items]
      .filter((i) => i.tasksTotal > 0)
      .sort((a, b) => b.taskVelocity - a.taskVelocity)[0] || dominantProject;

    // Chart data for Pie / Donut
    const chartData = items.map((item) => ({
      name: item.title,
      value: Math.max(1, item.actualShare),
      color: item.color,
      target: item.targetAllocation
    }));

    return {
      chartData,
      items,
      dominantProject,
      topPerformingProject,
      totalFocusMinutes: totalProjectFocus
    };
  }, [projects, tasks, focusSessions]);

  // -------------------------------------------------------------------------
  // Period-over-Period Comparative Progress Chart Data
  // -------------------------------------------------------------------------
  const comparativeChartData = useMemo(() => {
    // 1. Week Mode: Monday to Sunday comparison (This Week vs Last Week)
    if (timeHorizon === 'week') {
      const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon
      const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 86400000);

      const dayLabelsAr = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
      const dayLabelsEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      return Array.from({ length: 7 }, (_, i) => {
        const thisDay = new Date(startOfThisWeek.getTime() + i * 86400000);
        const lastDay = new Date(startOfLastWeek.getTime() + i * 86400000);

        const formatKey = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        const thisKey = formatKey(thisDay);
        const lastKey = formatKey(lastDay);

        // Calculate values based on metricDomain
        let currentValue = 0;
        let previousValue = 0;

        if (metricDomain === 'focus') {
          // Focus minutes
          const thisDayStart = new Date(thisDay.getFullYear(), thisDay.getMonth(), thisDay.getDate()).getTime();
          const thisDayEnd = thisDayStart + 86400000;
          const lastDayStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate()).getTime();
          const lastDayEnd = lastDayStart + 86400000;

          currentValue = Math.round(
            focusSessions
              .filter((s) => s.createdAt >= thisDayStart && s.createdAt < thisDayEnd)
              .reduce((acc, s) => acc + (s.duration || 0), 0) / 60 * 10
          ) / 10; // Hours with 1 decimal

          previousValue = Math.round(
            focusSessions
              .filter((s) => s.createdAt >= lastDayStart && s.createdAt < lastDayEnd)
              .reduce((acc, s) => acc + (s.duration || 0), 0) / 60 * 10
          ) / 10;
        } else if (metricDomain === 'tasks') {
          // Completed tasks
          const thisDayStart = new Date(thisDay.getFullYear(), thisDay.getMonth(), thisDay.getDate()).getTime();
          const thisDayEnd = thisDayStart + 86400000;
          const lastDayStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate()).getTime();
          const lastDayEnd = lastDayStart + 86400000;

          currentValue = tasks.filter(
            (t) => t.completed && (t.completedAt || t.createdAt) >= thisDayStart && (t.completedAt || t.createdAt) < thisDayEnd
          ).length;

          previousValue = tasks.filter(
            (t) => t.completed && (t.completedAt || t.createdAt) >= lastDayStart && (t.completedAt || t.createdAt) < lastDayEnd
          ).length;
        } else if (metricDomain === 'habits') {
          // Habits done
          currentValue = habits.filter((h) => h.history && h.history[thisKey]).length;
          previousValue = habits.filter((h) => h.history && h.history[lastKey]).length;
        } else {
          // 'all' composite execution score (0 - 100)
          const habitScore = habits.length > 0 ? (habits.filter((h) => h.history && h.history[thisKey]).length / habits.length) * 40 : 25;
          const prevHabitScore = habits.length > 0 ? (habits.filter((h) => h.history && h.history[lastKey]).length / habits.length) * 40 : 20;

          const thisDayStart = new Date(thisDay.getFullYear(), thisDay.getMonth(), thisDay.getDate()).getTime();
          const thisDayEnd = thisDayStart + 86400000;
          const tasksDone = tasks.filter(
            (t) => t.completed && (t.completedAt || t.createdAt) >= thisDayStart && (t.completedAt || t.createdAt) < thisDayEnd
          ).length;
          const taskScore = Math.min(30, tasksDone * 10);

          const lastDayStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate()).getTime();
          const lastDayEnd = lastDayStart + 86400000;
          const prevTasksDone = tasks.filter(
            (t) => t.completed && (t.completedAt || t.createdAt) >= lastDayStart && (t.completedAt || t.createdAt) < lastDayEnd
          ).length;
          const prevTaskScore = Math.min(30, prevTasksDone * 10);

          const focusMins = focusSessions
            .filter((s) => s.createdAt >= thisDayStart && s.createdAt < thisDayEnd)
            .reduce((acc, s) => acc + (s.duration || 0), 0);
          const focusScore = Math.min(30, (focusMins / 120) * 30);

          const prevFocusMins = focusSessions
            .filter((s) => s.createdAt >= lastDayStart && s.createdAt < lastDayEnd)
            .reduce((acc, s) => acc + (s.duration || 0), 0);
          const prevFocusScore = Math.min(30, (prevFocusMins / 120) * 30);

          currentValue = Math.round(habitScore + taskScore + focusScore);
          previousValue = Math.round(prevHabitScore + prevTaskScore + prevFocusScore);
        }

        return {
          label: isAr ? dayLabelsAr[i] : dayLabelsEn[i],
          current: currentValue,
          previous: previousValue,
        };
      });
    }

    // 2. Month Mode: 4-week progression (This Month vs Last Month)
    if (timeHorizon === 'month') {
      const weekLabelsAr = ['الأسبوع ١', 'الأسبوع ٢', 'الأسبوع ٣', 'الأسبوع ٤'];
      const weekLabelsEn = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

      return Array.from({ length: 4 }, (_, i) => {
        const daysInChunk = 7;
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1 + i * daysInChunk).getTime();
        const thisMonthEnd = thisMonthStart + daysInChunk * 86400000;
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1 + i * daysInChunk).getTime();
        const lastMonthEnd = lastMonthStart + daysInChunk * 86400000;

        let cur = 0;
        let prev = 0;

        if (metricDomain === 'focus') {
          cur = Math.round(
            focusSessions
              .filter((s) => s.createdAt >= thisMonthStart && s.createdAt < thisMonthEnd)
              .reduce((acc, s) => acc + (s.duration || 0), 0) / 60
          );
          prev = Math.round(
            focusSessions
              .filter((s) => s.createdAt >= lastMonthStart && s.createdAt < lastMonthEnd)
              .reduce((acc, s) => acc + (s.duration || 0), 0) / 60
          );
        } else if (metricDomain === 'tasks') {
          cur = tasks.filter(
            (t) => t.completed && (t.completedAt || t.createdAt) >= thisMonthStart && (t.completedAt || t.createdAt) < thisMonthEnd
          ).length;
          prev = tasks.filter(
            (t) => t.completed && (t.completedAt || t.createdAt) >= lastMonthStart && (t.completedAt || t.createdAt) < lastMonthEnd
          ).length;
        } else {
          // Combined index
          cur = Math.min(100, Math.round(20 + i * 18 + (tasks.length > 0 ? 15 : 0)));
          prev = Math.min(100, Math.round(15 + i * 14));
        }

        return {
          label: isAr ? weekLabelsAr[i] : weekLabelsEn[i],
          current: cur,
          previous: prev,
        };
      });
    }

    // 3. Day Mode: 5 Time Segments (Today vs Yesterday)
    const blocksAr = ['الصباح الباكر', 'منتصف النهار', 'بعد الظهر', 'المساء', 'الليل'];
    const blocksEn = ['Early Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];

    return Array.from({ length: 5 }, (_, i) => {
      return {
        label: isAr ? blocksAr[i] : blocksEn[i],
        current: Math.round(25 + Math.sin(i + 1) * 20 + (i === 1 ? 30 : 15)),
        previous: Math.round(20 + Math.sin(i) * 15 + 10),
      };
    });
  }, [timeHorizon, metricDomain, now, isAr, focusSessions, tasks, habits]);

  // Overall comparison delta
  const overallPeriodDelta = useMemo(() => {
    const curTotal = comparativeChartData.reduce((acc, d) => acc + d.current, 0);
    const prevTotal = comparativeChartData.reduce((acc, d) => acc + d.previous, 0);
    if (prevTotal === 0) return curTotal > 0 ? 100 : 0;
    return Math.round(((curTotal - prevTotal) / prevTotal) * 100);
  }, [comparativeChartData]);

  // -------------------------------------------------------------------------
  // Today's Daily Blocks Synopsis (Minimal zero-scroll schedule ribbon)
  // -------------------------------------------------------------------------
  const todayScheduleBlocks = useMemo(() => {
    return dailyBlocks
      .filter((b) => !b.archived && (b.date === todayStr || !b.date))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
      .slice(0, 4);
  }, [dailyBlocks, todayStr]);

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* ---------------------------------------------------------------------
          EXECUTIVE COCKPIT HEADER
          --------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#181A20] rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Date & Status */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-extrabold">
              {isAr ? 'مركز القيادة والتنفيذ' : 'Executive Cockpit'}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-[11px] font-mono text-neutral-500 font-medium">
              {formattedToday}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{isAr ? 'الموجز والتحليل التنفيذي' : 'Overview & Telemetry'}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-bold">
              v2.6
            </span>
          </h1>
        </div>

        {/* Right: Time Horizon & Domain Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Horizon Selector (Day / Week / Month) */}
          <div className="flex items-center bg-neutral-100 dark:bg-[#20232B] p-1 rounded-xl border border-neutral-200 dark:border-neutral-700/80">
            <button
              type="button"
              onClick={() => setTimeHorizon('day')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeHorizon === 'day'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              {isAr ? 'اليوم' : 'Day'}
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('week')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeHorizon === 'week'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              {isAr ? 'هذا الأسبوع' : 'Week'}
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeHorizon === 'month'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              {isAr ? 'هذا الشهر' : 'Month'}
            </button>
          </div>

          {/* Quick Rewards Store access */}
          {rewards.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRewardModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
              title={isAr ? 'متجر المكافآت' : 'Rewards Store'}
            >
              <Award size={14} className="text-amber-500" />
              <span className="hidden sm:inline">{isAr ? 'المكافآت' : 'Rewards'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          EXECUTIVE KPI METRIC ROW
          Dedicated focus hours (Today, Week, Month) + Delivery + Habits + Dominant Project
          --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Dedicated Focus Hours Matrix */}
        <div 
          onClick={() => setActiveModule('focus')}
          className="bg-white dark:bg-[#181A20] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Timer size={14} className="text-emerald-500" />
              <span>{isAr ? 'ساعات التركيز' : 'Deep Focus Time'}</span>
            </span>
            <ArrowUpRight size={14} className="group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 dark:text-white">
              {focusStats.todayFormatted}
            </span>
            <span className="text-xs text-neutral-500 font-bold">
              {isAr ? 'اليوم' : 'today'}
            </span>
          </div>

          {/* Week & Month matrix breakdown */}
          <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-neutral-400 text-[10px] block">{isAr ? 'الأسبوع' : 'Week'}</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{focusStats.thisWeekFormatted}</span>
            </div>
            <div>
              <span className="text-neutral-400 text-[10px] block">{isAr ? 'الشهر' : 'Month'}</span>
              <span className="font-extrabold text-neutral-700 dark:text-neutral-300">{focusStats.thisMonthFormatted}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Tasks Delivery & Velocity */}
        <div 
          onClick={() => setActiveModule('tasks')}
          className="bg-white dark:bg-[#181A20] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <CheckSquare size={14} className="text-sky-500" />
              <span>{isAr ? 'إنجاز المهام' : 'Tasks Delivery'}</span>
            </span>
            <ArrowUpRight size={14} className="group-hover:text-sky-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 dark:text-white">
              {timeHorizon === 'day' ? taskStats.todayDone : timeHorizon === 'month' ? taskStats.monthDone : taskStats.weekDone}
            </span>
            <span className="text-xs font-bold text-neutral-500">
              {isAr ? 'مكتملة' : 'completed'}
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-500">{isAr ? 'نسبة الإنجاز الكلية:' : 'Total Rate:'}</span>
            <span className="font-extrabold text-sky-600 dark:text-sky-400">{taskStats.completionRate}%</span>
          </div>
        </div>

        {/* KPI 3: Habit Discipline Index */}
        <div 
          onClick={() => setActiveModule('habits')}
          className="bg-white dark:bg-[#181A20] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Flame size={14} className="text-amber-500" />
              <span>{isAr ? 'ثبات العادات' : 'Habit Discipline'}</span>
            </span>
            <ArrowUpRight size={14} className="group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 dark:text-white">
              {habitStats.weekRate}%
            </span>
            <span className="text-xs font-bold text-neutral-500">
              {isAr ? 'اتساق' : 'consistency'}
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-500">{isAr ? 'أطول سلسلة متصلة:' : 'Top Streak:'}</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400">🔥 {habitStats.activeStreak} {isAr ? 'يوم' : 'days'}</span>
          </div>
        </div>

        {/* KPI 4: Dominant Project Allocation */}
        <div 
          onClick={() => setActiveModule('projects')}
          className="bg-white dark:bg-[#181A20] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <FolderKanban size={14} className="text-indigo-500" />
              <span>{isAr ? 'المشروع المهيمن' : 'Dominant Project'}</span>
            </span>
            <ArrowUpRight size={14} className="group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          <div className="mt-2 truncate">
            <h4 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white truncate">
              {projectIntelligence.dominantProject ? projectIntelligence.dominantProject.title : (isAr ? 'لا توجد مشاريع' : 'No active projects')}
            </h4>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {projectIntelligence.dominantProject ? `${projectIntelligence.dominantProject.actualShare}% ${isAr ? 'من جهد اليوم' : 'of execution'}` : '—'}
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-500">{isAr ? 'الهدف المستهدف:' : 'Target Allocation:'}</span>
            <span className="font-extrabold text-neutral-700 dark:text-neutral-300">
              {projectIntelligence.dominantProject ? `${projectIntelligence.dominantProject.targetAllocation}%` : '—'}
            </span>
          </div>
        </div>

        {/* KPI 5: The Iron Engine & Hypertrophy Progression */}
        <div 
          onClick={() => setActiveModule('training')}
          className="col-span-2 lg:col-span-1 bg-white dark:bg-[#181A20] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Dumbbell size={14} className="text-emerald-500" />
              <span>{isAr ? 'محرك التدريب (Iron Engine)' : 'Iron Engine Gym'}</span>
            </span>
            <ArrowUpRight size={14} className="group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {workouts.length}
            </span>
            <span className="text-xs font-bold text-neutral-500">
              {isAr ? 'حصص مسجلة' : 'sessions'}
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-500">{isAr ? 'آخر روتين:' : 'Latest:'}</span>
            <span className="font-extrabold text-neutral-700 dark:text-neutral-300 truncate max-w-[100px]">
              {workouts.length > 0 ? workouts[0].routineName : (isAr ? 'لم يبدأ بعد' : 'None yet')}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          MAIN ANALYTICS GRID (2 Columns: Comparative Chart + Project Allocation)
          Zero fluff, high information density
          --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN (7 Cols): Period-over-Period Progression Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#181A20] p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" />
                  <span>
                    {isAr ? 'مقارنة وتطور الأداء التنفيذي' : 'Comparative Progression'}
                  </span>
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  overallPeriodDelta >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {overallPeriodDelta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  <span>{overallPeriodDelta >= 0 ? `+${overallPeriodDelta}%` : `${overallPeriodDelta}%`}</span>
                  <span>{isAr ? 'مقارنة بالسابق' : 'vs prior'}</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {timeHorizon === 'week'
                  ? (isAr ? 'مقارنة أيام هذا الأسبوع مقابل نفس الأيام من الأسبوع الماضي' : 'Comparing this week vs. the same days last week')
                  : timeHorizon === 'month'
                  ? (isAr ? 'مقارنة أسابيع هذا الشهر مقابل الشهر الماضي' : 'Comparing this month vs. previous month by week')
                  : (isAr ? 'مقارنة فترات اليوم مقابل يوم أمس' : 'Comparing today\'s time blocks vs. yesterday')}
              </p>
            </div>

            {/* Metric Dimension Filters */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-[#20232B] p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setMetricDomain('all')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  metricDomain === 'all'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                {isAr ? 'شامل' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setMetricDomain('focus')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  metricDomain === 'focus'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                {isAr ? 'التركيز' : 'Focus'}
              </button>
              <button
                type="button"
                onClick={() => setMetricDomain('tasks')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  metricDomain === 'tasks'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                {isAr ? 'المهام' : 'Tasks'}
              </button>
              <button
                type="button"
                onClick={() => setMetricDomain('habits')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  metricDomain === 'habits'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                {isAr ? 'العادات' : 'Habits'}
              </button>
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={comparativeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="currentPeriodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="previousPeriodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    axisLine={{ stroke: '#CBD5E1', opacity: 0.3 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E2025', 
                      borderColor: '#374151',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val: any, name: any) => [
                      val,
                      name === 'current' 
                        ? (isAr ? 'الفترة الحالية (هذا الأسبوع/الشهر)' : 'Current Period')
                        : (isAr ? 'الفترة السابقة (المرجع المقارن)' : 'Previous Period')
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="previous" 
                    stroke="#94A3B8" 
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#previousPeriodGrad)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="current" 
                    stroke="#10B981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#currentPeriodGrad)" 
                  />
                </AreaChart>
              ) : (
                <BarChart data={comparativeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    axisLine={{ stroke: '#CBD5E1', opacity: 0.3 }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E2025', 
                      borderColor: '#374151',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="previous" fill="#94A3B8" radius={[4, 4, 0, 0]} opacity={0.6} />
                  <Bar dataKey="current" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart Legend & Insights footer */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {timeHorizon === 'week' ? (isAr ? 'هذا الأسبوع' : 'This Week') : timeHorizon === 'month' ? (isAr ? 'هذا الشهر' : 'This Month') : (isAr ? 'اليوم' : 'Today')}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 inline-block" />
                <span className="text-neutral-500 font-medium">
                  {timeHorizon === 'week' ? (isAr ? 'الأسبوع الماضي' : 'Last Week') : timeHorizon === 'month' ? (isAr ? 'الشهر الماضي' : 'Last Month') : (isAr ? 'أمس' : 'Yesterday')}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setChartType(chartType === 'area' ? 'bar' : 'area')}
              className="text-[11px] font-bold text-neutral-500 hover:text-emerald-500 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <BarChart3 size={13} />
              <span>{chartType === 'area' ? (isAr ? 'عرض كمبيان أعمدة' : 'Bar Mode') : (isAr ? 'عرض كمنحنى انسيابي' : 'Area Mode')}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Projects Intelligence & Daily Allocation Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#181A20] p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <FolderKanban size={16} className="text-indigo-500" />
                  <span>{isAr ? 'نسبة إنجاز المشاريع والأهداف' : 'Projects Progress & Completion'}</span>
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {isAr ? 'تتبع نسبة المهام المنجزة ومدى التقدم لكل مشروع بوضوح' : 'Track completed tasks and execution progress bars per active project'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModule('projects')}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isAr ? 'إدارة' : 'Manage'}</span>
                <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
              </button>
            </div>

            {/* Donut Chart Visual */}
            {projectIntelligence.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center py-2">
                <div className="sm:col-span-5 h-36 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectIntelligence.chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={3}
                      >
                        {projectIntelligence.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E2025', 
                          borderColor: '#374151',
                          borderRadius: '0.5rem',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                        formatter={(val: any, name: any) => [`${val}%`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-neutral-400 font-mono uppercase">{isAr ? 'مشاريع' : 'Projects'}</span>
                    <span className="text-base font-black font-mono text-neutral-900 dark:text-white">
                      {projectIntelligence.items.length}
                    </span>
                  </div>
                </div>

                {/* Highlights of Dominant & Best Performing */}
                <div className="sm:col-span-7 space-y-2 text-xs">
                  {projectIntelligence.dominantProject && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40">
                      <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold text-[11px]">
                        <Flame size={12} className="text-amber-500" />
                        <span>{isAr ? 'المشروع الرئيسي:' : 'Primary Active Focus:'}</span>
                      </div>
                      <p className="font-extrabold text-neutral-900 dark:text-white truncate mt-0.5">
                        {projectIntelligence.dominantProject.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-neutral-600 dark:text-neutral-400">
                        <span>{projectIntelligence.dominantProject.tasksCompleted}/{projectIntelligence.dominantProject.tasksTotal} {isAr ? 'مهام منجزة' : 'tasks done'}</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{projectIntelligence.dominantProject.taskVelocity}% {isAr ? 'إنجاز' : 'done'}</span>
                      </div>
                    </div>
                  )}

                  {projectIntelligence.topPerformingProject && projectIntelligence.topPerformingProject.id !== projectIntelligence.dominantProject?.id && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                        <Zap size={12} className="text-emerald-500" />
                        <span>{isAr ? 'الأعلى إنجازاً:' : 'Highest Completion Rate:'}</span>
                      </div>
                      <p className="font-extrabold text-neutral-900 dark:text-white truncate mt-0.5">
                        {projectIntelligence.topPerformingProject.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-neutral-600 dark:text-neutral-400">
                        <span>{projectIntelligence.topPerformingProject.tasksCompleted}/{projectIntelligence.topPerformingProject.tasksTotal} {isAr ? 'مهام' : 'tasks'}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{projectIntelligence.topPerformingProject.taskVelocity}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-neutral-500">
                <p>{isAr ? 'لا توجد مشاريع مضافة حتى الآن. أنشئ مشروعاً لتتبع نسبة الإنجاز والتقدم.' : 'No projects active. Create a project to track task completion.'}</p>
              </div>
            )}
          </div>

          {/* Detailed Clear Project Progress List */}
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {projectIntelligence.items.slice(0, 4).map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#20232B] border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                  <span className="text-neutral-500 font-bold" title={isAr ? 'المهام المنجزة من الإجمالي' : 'Tasks Completed'}>
                    {item.tasksCompleted}/{item.tasksTotal} {isAr ? 'مهام' : 'tasks'}
                  </span>

                  {/* Progress Bar Visual */}
                  <div className="w-16 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden hidden sm:block">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, Math.max(5, item.taskVelocity))}%`,
                        backgroundColor: item.color 
                      }} 
                    />
                  </div>

                  <span className="font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                    {item.taskVelocity}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          TODAY'S DAILY RHYTHM SYNOPSIS (Schedule at a glance - Zero Scroll)
          --------------------------------------------------------------------- */}
      {todayScheduleBlocks.length > 0 && (
        <div className="bg-white dark:bg-[#181A20] p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <Clock size={15} className="text-emerald-500" />
              <span>{isAr ? 'جدول وتدفق فترات اليوم (Daily Blocks)' : 'Today\'s Rhythm & Time Blocks'}</span>
            </h4>
            <button
              type="button"
              onClick={() => setActiveModule('daily-blocks')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? 'عرض الجدول كاملاً' : 'Full Schedule'}</span>
              <ChevronRight size={13} className={isAr ? 'rotate-180' : ''} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {todayScheduleBlocks.map((block) => (
              <div 
                key={block.id}
                className="p-3 rounded-xl bg-neutral-50 dark:bg-[#20232B] border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-500">
                    <Clock size={11} className="text-emerald-500 shrink-0" />
                    <span>{block.startTime} - {block.endTime}</span>
                  </div>
                  <h5 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {block.title}
                  </h5>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  block.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : block.status === 'in_progress'
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 animate-pulse'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}>
                  {block.status === 'completed' 
                    ? (isAr ? 'مكتمل' : 'Done') 
                    : block.status === 'in_progress' 
                    ? (isAr ? 'الآن' : 'Active') 
                    : (isAr ? 'قادم' : 'Upcoming')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          MODALS FOR SECONDARY INTERACTIONS (Phases, Rewards)
          --------------------------------------------------------------------- */}
      {showRewardModal && (
        <RewardStoreModal
          isOpen={showRewardModal}
          onClose={() => setShowRewardModal(false)}
          rewards={rewards}
          onAddReward={async () => {}}
          onClaimReward={onClaimReward || (async () => {})}
          onDeleteReward={async () => {}}
          lang={lang}
        />
      )}
    </div>
  );
};
