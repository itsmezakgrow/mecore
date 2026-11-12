import { ReviewEntry, DailySleepLog, WorkoutSession, FocusSession, TaskItem, HabitItem } from '../types';

export interface WeekPeriodRange {
  start: Date;
  end: Date;
  startIso: string; // YYYY-MM-DD
  endIso: string;   // YYYY-MM-DD
  year: number;
  weekNr: number;
  monthIndex: number;
  monthNameEn: string;
  monthNameAr: string;
  weekOfMonth: number;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نوفمبر', 'دجنبر'
];

const ORDINAL_AR = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'];
const ORDINAL_EN = ['1st', '2nd', '3rd', '4th', '5th'];

/**
 * Calculates start (Monday) and end (Sunday) dates for an ISO week key (e.g. "2026-W46")
 */
export function parseWeekKey(weekKey: string): WeekPeriodRange {
  const [yearStr, weekStr] = (weekKey || '').split('-W');
  const now = new Date();
  const year = parseInt(yearStr) || now.getFullYear();
  const weekNr = parseInt(weekStr) || 1;

  // Find Monday of ISO week
  const simple = new Date(year, 0, 1 + (weekNr - 1) * 7);
  const dayOfWeek = simple.getDay(); // 0 is Sun
  const ISOweekStart = new Date(simple);
  if (dayOfWeek <= 4) {
    ISOweekStart.setDate(simple.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  } else {
    ISOweekStart.setDate(simple.getDate() + (8 - dayOfWeek));
  }

  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

  const startIso = ISOweekStart.toISOString().split('T')[0];
  const endIso = ISOweekEnd.toISOString().split('T')[0];

  const monthIndex = ISOweekStart.getMonth();
  const weekOfMonth = Math.min(5, Math.max(1, Math.ceil(ISOweekStart.getDate() / 7)));

  return {
    start: ISOweekStart,
    end: ISOweekEnd,
    startIso,
    endIso,
    year,
    weekNr,
    monthIndex,
    monthNameEn: MONTH_NAMES_EN[monthIndex],
    monthNameAr: MONTH_NAMES_AR[monthIndex],
    weekOfMonth,
  };
}

/**
 * Calculates start (1st) and end (last day) dates for a month key (e.g. "2026-11")
 */
export function parseMonthKey(monthKey: string) {
  const [yearStr, monthStr] = (monthKey || '').split('-');
  const now = new Date();
  const year = parseInt(yearStr) || now.getFullYear();
  const month = (parseInt(monthStr) || now.getMonth() + 1) - 1;

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const startIso = startDate.toISOString().split('T')[0];
  const endIso = endDate.toISOString().split('T')[0];

  return {
    startDate,
    endDate,
    startIso,
    endIso,
    year,
    monthIndex: month,
    monthNameEn: MONTH_NAMES_EN[month],
    monthNameAr: MONTH_NAMES_AR[month],
  };
}

/**
 * Generates an automatic, elegant default title for a week or month
 */
export function generateDefaultPeriodTitle(
  type: 'weekly' | 'monthly',
  periodKey: string,
  lang: 'en' | 'ar'
): string {
  const isAr = lang === 'ar';
  if (type === 'weekly') {
    const { year, weekNr, monthNameAr, monthNameEn, weekOfMonth } = parseWeekKey(periodKey);
    const ordinalAr = ORDINAL_AR[weekOfMonth - 1] || `${weekOfMonth}`;
    const ordinalEn = ORDINAL_EN[weekOfMonth - 1] || `${weekOfMonth}`;

    if (isAr) {
      return `الأسبوع ${ordinalAr} من شهر ${monthNameAr} ${year} (${periodKey})`;
    }
    return `Week ${ordinalEn} of ${monthNameEn} ${year} (${periodKey})`;
  } else {
    const { year, monthNameAr, monthNameEn } = parseMonthKey(periodKey);
    if (isAr) {
      return `التقرير الشامل لشهر ${monthNameAr} ${year}`;
    }
    return `Strategic Synthesis for ${monthNameEn} ${year}`;
  }
}

/**
 * Gathers comprehensive telemetry for a given date range [startIso, endIso]
 */
export function aggregatePeriodTelemetry({
  startIso,
  endIso,
  reviews = [],
  sleepLogs = [],
  workouts = [],
  focusSessions = [],
  tasks = [],
  habits = [],
}: {
  startIso: string;
  endIso: string;
  reviews?: ReviewEntry[];
  sleepLogs?: DailySleepLog[];
  workouts?: WorkoutSession[];
  focusSessions?: FocusSession[];
  tasks?: TaskItem[];
  habits?: HabitItem[];
}) {
  const startTime = new Date(`${startIso}T00:00:00`).getTime();
  const endTime = new Date(`${endIso}T23:59:59`).getTime();

  // 1. Daily reviews in this window (State Audit & Day Mastery Scores)
  const periodDailyReviews = reviews.filter((r) => {
    if (r.type !== 'daily') return false;
    return r.periodKey >= startIso && r.periodKey <= endIso;
  });

  let totalDayScore = 0;
  let scoredDaysCount = 0;
  let sumEnergy = 0;
  let sumStress = 0;
  let sumClarity = 0;
  let sumDiscipline = 0;
  let sumFulfillment = 0;
  const boosterCounts: Record<string, number> = {};
  const drainCounts: Record<string, number> = {};

  periodDailyReviews.forEach((dr) => {
    if (typeof dr.dayScore === 'number') {
      totalDayScore += dr.dayScore;
      scoredDaysCount++;
    }
    if (dr.stateRatings) {
      if (dr.stateRatings.energy) sumEnergy += dr.stateRatings.energy;
      if (dr.stateRatings.stress) sumStress += dr.stateRatings.stress;
      if (dr.stateRatings.clarity) sumClarity += dr.stateRatings.clarity;
      if (dr.stateRatings.discipline) sumDiscipline += dr.stateRatings.discipline;
      if (dr.stateRatings.fulfillment) sumFulfillment += dr.stateRatings.fulfillment;
    }
    if (Array.isArray(dr.boosters)) {
      dr.boosters.forEach((b) => {
        boosterCounts[b] = (boosterCounts[b] || 0) + 1;
      });
    }
    if (Array.isArray(dr.drains)) {
      dr.drains.forEach((d) => {
        drainCounts[d] = (drainCounts[d] || 0) + 1;
      });
    }
  });

  const topBoosters = Object.entries(boosterCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  const topDrains = Object.entries(drainCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  const daysCount = Math.max(1, periodDailyReviews.length);
  const avgDayScore = scoredDaysCount > 0 ? Math.round(totalDayScore / scoredDaysCount) : 0;
  const avgEnergy = scoredDaysCount > 0 ? Math.round((sumEnergy / scoredDaysCount) * 10) / 10 : 0;
  const avgStress = scoredDaysCount > 0 ? Math.round((sumStress / scoredDaysCount) * 10) / 10 : 0;
  const avgClarity = scoredDaysCount > 0 ? Math.round((sumClarity / scoredDaysCount) * 10) / 10 : 0;
  const avgDiscipline = scoredDaysCount > 0 ? Math.round((sumDiscipline / scoredDaysCount) * 10) / 10 : 0;
  const avgFulfillment = scoredDaysCount > 0 ? Math.round((sumFulfillment / scoredDaysCount) * 10) / 10 : 0;

  // 2. Sleep logs in this window
  const periodSleepLogs = sleepLogs.filter((s) => {
    const d = s.date || '';
    return d >= startIso && d <= endIso;
  });

  let totalSleepHours = 0;
  let onTargetDays = 0;
  periodSleepLogs.forEach((s) => {
    const hrs = (s.sleepDurationMinutes || 0) / 60;
    totalSleepHours += hrs;
    if (s.wokeOnTarget) onTargetDays++;
  });
  const avgSleepHours = periodSleepLogs.length > 0
    ? Math.round((totalSleepHours / periodSleepLogs.length) * 10) / 10
    : 0;

  // 3. Gym & Iron Engine Workouts
  const periodWorkouts = workouts.filter((w) => {
    if (!w.date) return false;
    return w.date >= startIso && w.date <= endIso;
  });

  let totalLiftedVolumeKg = 0;
  const routinesSet = new Set<string>();
  periodWorkouts.forEach((w) => {
    if (w.routineName) routinesSet.add(w.routineName);
    if (w.totalVolume) {
      totalLiftedVolumeKg += w.totalVolume;
    } else if (w.exercises) {
      w.exercises.forEach((ex) => {
        ex.sets?.forEach((s) => {
          if (s.completed && s.reps) {
            const wKg = parseFloat(String(s.weight).replace(/[^0-9.]/g, '')) || 0;
            totalLiftedVolumeKg += wKg * Number(s.reps);
          }
        });
      });
    }
  });

  // 4. Focus Sessions
  const periodFocusSessions = focusSessions.filter((s) => {
    const t = s.createdAt;
    return t >= startTime && t <= endTime;
  });
  const totalFocusMinutes = periodFocusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const diffDays = Math.max(1, Math.round((endTime - startTime) / 86400000));
  const avgDailyFocusMinutes = Math.round(totalFocusMinutes / diffDays);

  // 5. Tasks completed in period
  const completedTasks = tasks.filter((t) => {
    if (!t.completed) return false;
    const time = t.completedAt || t.createdAt;
    return time >= startTime && time <= endTime;
  });
  const highPriorityDone = completedTasks.filter((t) => t.priority === 'High').length;

  // 6. Habit Adherence & Excuses
  let totalOpportunities = 0;
  let completedHabitsCount = 0;
  const excusesList: { date: string; habitTitle: string; excuse: string }[] = [];

  const curDate = new Date(`${startIso}T00:00:00`);
  const endDate = new Date(`${endIso}T00:00:00`);

  const activeHabits = habits.filter((h) => !h.archived);

  while (curDate <= endDate) {
    const iso = curDate.toISOString().split('T')[0];
    activeHabits.forEach((h) => {
      totalOpportunities++;
      if (h.history?.[iso]) {
        completedHabitsCount++;
      }
      if (h.freezeExcuses?.[iso]) {
        excusesList.push({
          date: iso,
          habitTitle: h.title,
          excuse: h.freezeExcuses[iso],
        });
      }
    });
    curDate.setDate(curDate.getDate() + 1);
  }

  const habitScore = totalOpportunities > 0
    ? Math.round((completedHabitsCount / totalOpportunities) * 100)
    : 100;

  return {
    startIso,
    endIso,
    // Daily State Audit
    avgDayScore,
    daysAuditedCount: scoredDaysCount,
    avgEnergy,
    avgStress,
    avgClarity,
    avgDiscipline,
    avgFulfillment,
    topBoosters,
    topDrains,
    // Sleep
    avgSleepHours,
    onTargetDays,
    sleepDaysLogged: periodSleepLogs.length,
    // Gym
    workoutSessionsCount: periodWorkouts.length,
    totalLiftedVolumeKg: Math.round(totalLiftedVolumeKg),
    routines: Array.from(routinesSet),
    // Focus
    totalFocusMinutes,
    avgDailyFocusMinutes,
    // Tasks
    completedTasksCount: completedTasks.length,
    highPriorityDone,
    // Habits
    habitScore,
    excusesList,
  };
}
