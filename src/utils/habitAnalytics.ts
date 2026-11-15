import { DayProfileConfig, HabitItem } from '../types';
import { getLocalIsoDate, isHabitFrozenByDayMode } from './dayModeHelpers';

export interface HabitScorePoint {
  date: string;
  dayLabel: string;
  score: number; // 0 - 100%
  completed: boolean;
}

export interface DayOfWeekStat {
  dayName: string;
  shortName: string;
  count: number;
  percentage: number;
}

/**
 * Helper to check if a specific day is frozen/exempt from penalties
 * (explicit streak freeze, snoozed, paused, before start date, OR shielded by Day Mode).
 */
export function isHabitDateFrozen(
  habit: HabitItem,
  dateStr: string,
  dateTime?: number,
  dayProfileConfig?: DayProfileConfig | null
): boolean {
  // Explicit streak freeze applied (with or without excuse)
  if (habit.freezes && habit.freezes[dateStr]) {
    return true;
  }

  // Day Mode Auto-Shield (Life & Errands, Rest, or Travel day depending on habit.dayModePolicy)
  if (isHabitFrozenByDayMode(habit, dateStr, dayProfileConfig)) {
    return true;
  }

  // Before official start date
  if (habit.startDate && dateStr < habit.startDate) {
    return true;
  }
  
  // Within custom pause range
  if (habit.pauseStartDate && habit.pauseEndDate) {
    if (dateStr >= habit.pauseStartDate && dateStr <= habit.pauseEndDate) {
      return true;
    }
  }

  // Within snoozeUntil timestamp window
  if (habit.snoozeUntil) {
    const checkTime = dateTime !== undefined ? dateTime : new Date(`${dateStr}T23:59:59`).getTime();
    if (checkTime <= habit.snoozeUntil) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates a rolling habit strength score (0-100%) for a habit over a specified number of days.
 * An exponential decaying weight model gives higher weight to recent days.
 * When a habit is snoozed/paused/shielded by Day Mode or scheduled in the future, momentum is FROZEN (no decay penalty).
 */
export function calculateHabitScoreHistory(
  habit: HabitItem,
  daysCount: number = 30,
  dayProfileConfig?: DayProfileConfig | null
): HabitScorePoint[] {
  const points: HabitScorePoint[] = [];
  const today = new Date();
  const history = habit.history || {};
  const targetPerWeek = habit.targetPerWeek || 7;
  const targetFraction = targetPerWeek / 7;

  let currentScore = 0;
  // Rolling memory factor (alpha approx 0.08 for smooth responsive momentum)
  const alpha = 0.08;

  for (let i = -(daysCount + 14); i <= 0; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = getLocalIsoDate(d);
    const isCompleted = Boolean(history[iso]);
    const isFrozen = isHabitDateFrozen(habit, iso, d.getTime(), dayProfileConfig);

    if (isCompleted) {
      // Completed day (including Bonus Wins on Rest/Errands days) always reinforces habit score
      currentScore = currentScore + alpha * (1 - currentScore);
    } else if (isFrozen) {
      // FREEZE / DAY MODE SHIELD: momentum stays perfectly preserved without decay!
      currentScore = currentScore;
    } else {
      // Missed active day: decay towards 0
      currentScore = currentScore + alpha * (0 - currentScore);
    }

    if (i >= -daysCount) {
      // Scale relative to user's targetPerWeek frequency
      const normalizedScore = Math.min(100, Math.round((currentScore / Math.max(0.2, targetFraction)) * 100));
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      points.push({
        date: iso,
        dayLabel,
        score: Math.max(0, normalizedScore),
        completed: isCompleted,
      });
    }
  }

  return points;
}

/**
 * Computes completion count and percentage grouped by Day of the Week (Mon - Sun).
 */
export function calculateDayOfWeekStats(habit: HabitItem): DayOfWeekStat[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const history = habit.history || {};

  let totalActive = 0;
  Object.keys(history).forEach((dateStr) => {
    if (history[dateStr]) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const dayIdx = d.getDay();
        counts[dayIdx]++;
        totalActive++;
      }
    }
  });

  // Reorder to start with Monday (1) to Sunday (0)
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((idx) => {
    const count = counts[idx];
    const percentage = totalActive > 0 ? Math.round((count / totalActive) * 100) : 0;
    return {
      dayName: fullDays[idx],
      shortName: days[idx],
      count,
      percentage,
    };
  });
}

/**
 * Calculates habit total stats:
 * - Current streak (bridges across Day-Mode-shielded days & manual freezes)
 * - Best streak ever
 * - Total completions count
 * - 30-day completion rate (%) across non-exempt Execution days
 * - 7-day completion count
 */
export function calculateHabitStats(habit: HabitItem, dayProfileConfig?: DayProfileConfig | null) {
  const history = habit.history || {};
  const freezes = habit.freezes || {};
  const today = new Date();

  // Total completions
  const totalCompletions = Object.values(history).filter(Boolean).length;

  // Dynamic live current streak (up to 90 days backwards, bridging freezes and Day Mode shields)
  let liveCurrentStreak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = getLocalIsoDate(d);
    if (history[iso] || freezes[iso]) {
      liveCurrentStreak++;
    } else if (isHabitFrozenByDayMode(habit, iso, dayProfileConfig)) {
      continue;
    } else if (i > 0) {
      break;
    }
  }

  // Best streak calculation across history (bridging Day Mode shields & freezes)
  const sortedDates = Array.from(
    new Set([
      ...Object.keys(history).filter((k) => history[k]),
      ...Object.keys(freezes).filter((k) => freezes[k]),
    ])
  ).sort();

  let bestStreak = Math.max(habit.streak || 0, liveCurrentStreak);
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) continue;
    const curDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    if (prevDate) {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        // Check if every intervening gap day was frozen/shielded by Day Mode
        let allGapShielded = true;
        for (let g = 1; g < diffDays; g++) {
          const gapDate = new Date(prevDate);
          gapDate.setDate(prevDate.getDate() + g);
          const gapIso = getLocalIsoDate(gapDate);
          if (!isHabitDateFrozen(habit, gapIso, gapDate.getTime(), dayProfileConfig)) {
            allGapShielded = false;
            break;
          }
        }
        tempStreak = allGapShielded ? tempStreak + 1 : 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = curDate;
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  // 30-day completion rate (calculated across active non-frozen days; Bonus Wins count as positive)
  let last30Count = 0;
  let active30Days = 0;
  let bonusWins30 = 0;
  let shieldedDays30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = getLocalIsoDate(d);
    const isCompleted = Boolean(history[iso]);
    const isFrozen = isHabitDateFrozen(habit, iso, d.getTime(), dayProfileConfig);
    if (isFrozen) {
      shieldedDays30++;
      if (isCompleted) bonusWins30++;
    }
    if (!isFrozen || isCompleted) {
      active30Days++;
      if (isCompleted) last30Count++;
    }
  }
  const rate30 = active30Days > 0 ? Math.min(100, Math.round((last30Count / active30Days) * 100)) : (shieldedDays30 > 0 ? 100 : 0);

  // 7-day completion count
  let last7Count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = getLocalIsoDate(d);
    if (history[iso]) last7Count++;
  }

  // Freeze & excuse statistics
  const freezeExcuses = habit.freezeExcuses || {};
  const totalFreezesUsed = Object.values(freezes).filter(Boolean).length;

  // Banked Freezes calculation: Start with 1 base freeze + 1 earned for every 14 days of current streak (max 5)
  const earnedFromStreak = Math.floor(liveCurrentStreak / 14);
  const calculatedBankedFreezes = Math.max(0, (habit.bankedFreezes ?? 1) + earnedFromStreak);

  return {
    totalCompletions,
    bestStreak,
    currentStreak: liveCurrentStreak,
    rate30,
    last7Count,
    bonusWins30,
    shieldedDays30,
    totalFreezesUsed,
    bankedFreezes: Math.min(5, Math.max(1, calculatedBankedFreezes)),
    freezeExcusesCount: Object.keys(freezeExcuses).length,
  };
}

/**
 * Calculates priority weight for a task or habit based on active Life Phase category percentages.
 * e.g. If active phase is 70% Business and 30% Personal:
 * A High priority Business task gets higher composite rank than a High priority Personal task.
 */
export function calculatePhaseWeightedScore(
  category: string | undefined,
  priority: 'High' | 'Med' | 'Low' = 'Med',
  dueTime?: string,
  categoryWeights: Record<string, number> = {}
): number {
  let score = 0;

  // 1. Priority Base
  if (priority === 'High') score += 500;
  else if (priority === 'Med') score += 250;
  else score += 100;

  // 2. Active Phase Category Weight (0-100) * 3
  if (category && categoryWeights[category] !== undefined) {
    score += categoryWeights[category] * 3;
  } else if (category && (category.toLowerCase().includes('work') || category.toLowerCase().includes('business')) && categoryWeights['Business']) {
    score += categoryWeights['Business'] * 3;
  } else if (category && (category.toLowerCase().includes('life') || category.toLowerCase().includes('personal')) && categoryWeights['Personal']) {
    score += categoryWeights['Personal'] * 3;
  }

  // 3. Time of Day bonus (earlier tasks get slight edge if due today)
  if (dueTime) {
    const [h, m] = dueTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      // earlier in day gets higher score up to +144 points
      const minutesFromMidnight = h * 60 + m;
      score += Math.max(0, 1440 - minutesFromMidnight) / 10;
    }
  }

  return score;
}

/**
 * Formats full CSV string for all habits or a single habit.
 */
export function generateHabitsCSV(habits: HabitItem[]): string {
  const rows: string[] = [];
  rows.push(['Habit ID', 'Title', 'Category', 'Target / Week', 'Current Streak', 'Date', 'Completed', 'Daily Note'].join(','));

  habits.forEach((habit) => {
    const history = habit.history || {};
    const notes = habit.notes || {};
    const allDates = Array.from(new Set([...Object.keys(history), ...Object.keys(notes)])).sort();

    if (allDates.length === 0) {
      rows.push([
        `"${habit.id || ''}"`,
        `"${habit.title.replace(/"/g, '""')}"`,
        `"${habit.category}"`,
        habit.targetPerWeek,
        habit.streak,
        `"${new Date().toISOString().split('T')[0]}"`,
        'false',
        '""',
      ].join(','));
    } else {
      allDates.forEach((dateStr) => {
        const isDone = Boolean(history[dateStr]);
        const note = notes[dateStr] ? notes[dateStr].replace(/"/g, '""') : '';
        rows.push([
          `"${habit.id || ''}"`,
          `"${habit.title.replace(/"/g, '""')}"`,
          `"${habit.category}"`,
          habit.targetPerWeek,
          habit.streak,
          `"${dateStr}"`,
          isDone ? 'true' : 'false',
          `"${note}"`,
        ].join(','));
      });
    }
  });

  return rows.join('\n');
}
