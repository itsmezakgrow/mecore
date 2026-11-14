import { WorkoutSession, WorkoutExercise, RpeFeedbackRating } from '../types';
import {
  getNextProgressionWeight,
  getDoubleProgressionWeight,
  getSmallDeloadWeight,
  getExerciseSpec,
  getExerciseBiomechanicalType,
  normalizeExerciseLookupKey
} from './exerciseAssets';

export interface CoachPrescription {
  exerciseName: string;
  action:
    | 'increase_weight'
    | 'double_jump_weight'
    | 'rpe_easy_jump'
    | 'rpe_failure_hold'
    | 'consolidate_volume'
    | 'struggle_safety'
    | 'new_exercise';
  headlineEn: string;
  headlineAr: string;
  detailsEn: string;
  detailsAr: string;
  suggestedWeight: number;
  suggestedReps: number;
  suggestedSets: number;
  targetSetReps: number[]; // Prescribed reps for each set (e.g. [10, 10, 9] or [8, 8, 8])
  lastWeight: number;
  lastReps: number[];
  lastRepsSummary: string;
  minReps: number;
  maxReps: number;
  weightStep: number;
  isReadyForOverload: boolean;
  isDoubleJump?: boolean;
  rpeFeedbackApplied?: RpeFeedbackRating;
  peakLastReps?: number;
  hasWarningFlag?: boolean;
}

export interface ExecutionOrderAnalysis {
  hasAlert: boolean;
  isolationBeforeCompoundPairs: { isolationName: string; compoundName: string; isolationTime: number; compoundTime: number }[];
  chronologicalSequence: { name: string; type: 'compound' | 'isolation'; completedAt: number }[];
  alertMessageEn: string;
  alertMessageAr: string;
  detailsEn: string;
  detailsAr: string;
}

/**
 * Analyzes the exact chronological completion order (`completedAt` timestamps) of strength exercises
 * in a session. Flags if an Isolation exercise (small muscles: Biceps, Triceps, Lateral Delts, etc.)
 * was completed BEFORE a heavy Compound exercise (Chest, Back, Legs).
 */
export function analyzeSessionExecutionOrder(exercises: WorkoutExercise[] = []): ExecutionOrderAnalysis {
  const stampedStrength = exercises
    .map((ex) => {
      const bioType = ex.executionCategory || getExerciseBiomechanicalType(ex.name);
      if (bioType === 'cardio') return null;

      // Determine chronological completion timestamp from exercise.completedAt or final completed set
      let ts = ex.completedAt;
      if (!ts && Array.isArray(ex.sets) && ex.sets.length > 0 && ex.sets.every((s) => s.completed)) {
        const setTimestamps = ex.sets.map((s) => s.completedAt || 0).filter((n) => n > 0);
        if (setTimestamps.length > 0) {
          ts = Math.max(...setTimestamps);
        }
      }
      if (!ts || ts <= 0) return null;

      return {
        name: ex.name,
        type: bioType as 'compound' | 'isolation',
        completedAt: ts
      };
    })
    .filter((item): item is { name: string; type: 'compound' | 'isolation'; completedAt: number } => item !== null)
    .sort((a, b) => a.completedAt - b.completedAt);

  const pairs: { isolationName: string; compoundName: string; isolationTime: number; compoundTime: number }[] = [];

  for (let i = 0; i < stampedStrength.length; i++) {
    const first = stampedStrength[i];
    if (first.type !== 'isolation') continue;
    for (let j = i + 1; j < stampedStrength.length; j++) {
      const later = stampedStrength[j];
      if (later.type === 'compound') {
        pairs.push({
          isolationName: first.name,
          compoundName: later.name,
          isolationTime: first.completedAt,
          compoundTime: later.completedAt
        });
      }
    }
  }

  const hasAlert = pairs.length > 0;
  const firstPair = pairs[0];

  const alertMessageEn = '⚠️ Efficiency Alert: You fatigued small muscles before heavy compounds. This reduces strength output.';
  const alertMessageAr = '⚠️ تنبيه الكفاءة البيوميكانيكية: قمت بإرهاق العضلات الصغيرة (العزل) قبل التمارين المركبة الثقيلة، مما يقلل من إنتاج القوة القصوى.';

  const detailsEn = firstPair
    ? `${firstPair.isolationName} (Isolation) was finished before ${firstPair.compoundName} (Compound).`
    : 'Optimal compound-before-isolation sequencing.';
  const detailsAr = firstPair
    ? `تم إنهاء ${firstPair.isolationName} (عزل) قبل ${firstPair.compoundName} (مركّب).`
    : 'ترتيب ممتاز: التمارين المركبة قبل تمارين العزل.';

  return {
    hasAlert,
    isolationBeforeCompoundPairs: pairs,
    chronologicalSequence: stampedStrength,
    alertMessageEn,
    alertMessageAr,
    detailsEn,
    detailsAr
  };
}

export interface CardioPrescription {
  exerciseName: string;
  action: 'increase_intensity' | 'consolidate_max' | 'increase_duration' | 'baseline';
  headlineEn: string;
  headlineAr: string;
  actionTagEn: string;
  actionTagAr: string;
  detailsEn: string;
  detailsAr: string;
  suggestedDurationMinutes: number;
  suggestedSpeedRpm: number;
  suggestedInclineResistance: number;
  speedUnit: 'km/h' | 'rpm' | 'level' | 'spm';
  lastDurationMinutes: number | null;
  lastSpeedRpm: number | null;
  lastInclineResistance: number | null;
  lastHeartRateBpm: number | null;
  lastSummaryEn: string;
  lastSummaryAr: string;
  consecutiveMaxCount: number;
  minDuration: number;
  maxDuration: number;
  isReadyForLevelUp: boolean;
}

export const CARDIO_MIN_DURATION = 15;
export const CARDIO_MAX_DURATION = 30;
export const CARDIO_DURATION_STEP = 2;
export const CARDIO_INTENSITY_STEP = 1;

function formatSpeedUnit(unit: 'km/h' | 'rpm' | 'level' | 'spm'): string {
  if (unit === 'km/h') return 'km/h';
  if (unit === 'rpm') return 'RPM';
  if (unit === 'spm') return 'SPM';
  return 'Lv';
}

function formatCardioLogSummary(
  log: {
    durationMinutes: number | null;
    speedRpm: number | null;
    speedUnit: 'km/h' | 'rpm' | 'level' | 'spm';
    inclineResistance: number | null;
    heartRateBpm: number | null;
  },
  isAr: boolean
): string {
  const parts: string[] = [];
  const unitLabel = formatSpeedUnit(log.speedUnit);

  if (log.durationMinutes !== null && log.durationMinutes > 0) {
    parts.push(isAr ? `${log.durationMinutes} د` : `${log.durationMinutes}m`);
  }
  if (log.speedRpm !== null && log.speedRpm > 0) {
    parts.push(`${log.speedRpm} ${unitLabel}`);
  }
  if (log.inclineResistance !== null && log.inclineResistance > 0) {
    parts.push(isAr ? `م ${log.inclineResistance}` : `Lv ${log.inclineResistance}`);
  }
  if (log.heartRateBpm !== null && log.heartRateBpm > 0) {
    parts.push(`♥ ${log.heartRateBpm} bpm`);
  }

  if (parts.length === 0) {
    return isAr ? 'منجز (بدون أرقام)' : 'Completed (no metrics logged)';
  }
  return parts.join(' · ');
}

/**
 * Cardio-Specific Progressive Overload Algorithm:
 * - Min Duration: 15 mins, Max Duration: 30 mins.
 * - Strictly ignores omitted/unentered metrics so partial logs (e.g., Cospo BPM only) never corrupt averages or reset progress.
 * - SCENARIO A (Endurance Mastered):
 *   IF the user completed >= 30 mins at the same Speed/RPM and Incline/Resistance
 *   across TWO consecutive sessions -> Increase Speed (or Incline) by +1 level
 *   and reset Duration back to 15 mins.
 * - CONSOLIDATE MAX (1/2 sessions at 30 mins):
 *   IF last session hit >= 30 mins once at current Speed/Incline -> Hold Speed/Incline
 *   and repeat 30 mins one more session to unlock the +1 intensity level-up.
 * - SCENARIO B (Building Stamina):
 *   IF last session duration < 30 mins -> Keep Speed/Incline the same, and recommend
 *   adding +2 mins (capped at 30 mins) for the next session.
 */
export function getCardioOverloadPrescription(
  exerciseName: string,
  workoutHistory: WorkoutSession[] = [],
  defaults?: {
    durationMinutes?: number;
    speedRpm?: number;
    speedUnit?: 'km/h' | 'rpm' | 'level' | 'spm';
    inclineResistance?: number;
  }
): CardioPrescription {
  const lookupKey = normalizeExerciseLookupKey(exerciseName);
  const spec = getExerciseSpec(exerciseName);

  const defaultDuration = defaults?.durationMinutes ?? spec.defaultDurationMinutes ?? CARDIO_MIN_DURATION;
  const defaultSpeed = defaults?.speedRpm ?? spec.defaultSpeedRpm ?? 1;
  const speedUnit = defaults?.speedUnit ?? spec.speedUnit ?? 'level';
  const defaultIncline = defaults?.inclineResistance ?? spec.defaultInclineResistance ?? 0;
  const unitLabel = formatSpeedUnit(speedUnit);

  const sortedSessions = [...workoutHistory].sort((a, b) => {
    if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt;
    return (b.date || '').localeCompare(a.date || '');
  });

  const logs: {
    durationMinutes: number | null;
    speedRpm: number | null;
    speedUnit: 'km/h' | 'rpm' | 'level' | 'spm';
    inclineResistance: number | null;
    heartRateBpm: number | null;
    date: string;
  }[] = [];

  for (const session of sortedSessions) {
    if (!session.exercises || !Array.isArray(session.exercises)) continue;
    const match = session.exercises.find(
      (ex) => normalizeExerciseLookupKey(ex.name) === lookupKey
    );
    if (match?.cardioData && match.cardioData.completed === true) {
      const dur = Number(match.cardioData.durationMinutes);
      const spd = Number(match.cardioData.speedRpm);
      const inc = Number(match.cardioData.inclineResistance);
      const bpm = Number(match.cardioData.heartRateBpm);

      logs.push({
        durationMinutes: Number.isFinite(dur) && dur > 0 ? dur : null,
        speedRpm: Number.isFinite(spd) && spd > 0 ? spd : null,
        speedUnit: match.cardioData.speedUnit || speedUnit,
        inclineResistance: Number.isFinite(inc) && inc > 0 ? inc : null,
        heartRateBpm: Number.isFinite(bpm) && bpm > 0 ? bpm : null,
        date: session.date
      });
    }
  }

  // BASELINE: No previous completed cardio logs for this exercise
  if (logs.length === 0) {
    const inclineNoteEn = defaultIncline > 0 ? ` · Incline/Res ${defaultIncline}` : '';
    const inclineNoteAr = defaultIncline > 0 ? ` · ميلان/مقاومة ${defaultIncline}` : '';
    return {
      exerciseName,
      action: 'baseline',
      headlineEn: '🎯 Baseline Conditioning Target',
      headlineAr: '🎯 تأسيس خط أساس الكارديو',
      actionTagEn: `🎯 Start at ${defaultDuration} mins · ${defaultSpeed} ${unitLabel}`,
      actionTagAr: `🎯 ابدأ بـ ${defaultDuration} دقيقة · ${defaultSpeed} ${unitLabel}`,
      detailsEn: `Establish your aerobic baseline: complete ${defaultDuration} mins at ${defaultSpeed} ${unitLabel}${inclineNoteEn}. Add +2 mins next session until you reach 30 mins.`,
      detailsAr: `أسّس مستواك الهوائي: أكمل ${defaultDuration} دقيقة على ${defaultSpeed} ${unitLabel}${inclineNoteAr}. أضف +2 دقيقة في كل حصة حتى تصل إلى 30 دقيقة.`,
      suggestedDurationMinutes: defaultDuration,
      suggestedSpeedRpm: defaultSpeed,
      suggestedInclineResistance: defaultIncline,
      speedUnit,
      lastDurationMinutes: null,
      lastSpeedRpm: null,
      lastInclineResistance: null,
      lastHeartRateBpm: null,
      lastSummaryEn: 'No past logs',
      lastSummaryAr: 'لا توجد سجلات سابقة',
      consecutiveMaxCount: 0,
      minDuration: CARDIO_MIN_DURATION,
      maxDuration: CARDIO_MAX_DURATION,
      isReadyForLevelUp: false
    };
  }

  const latest = logs[0];
  const lastSummaryEn = formatCardioLogSummary(latest, false);
  const lastSummaryAr = formatCardioLogSummary(latest, true);

  // Find logs with recorded duration so partial sessions without duration don't regress overload math
  const durationLogs = logs.filter((l) => l.durationMinutes !== null && l.durationMinutes > 0);
  const latestWithDuration = durationLogs[0];
  const latestWithSpeed = logs.find((l) => l.speedRpm !== null && l.speedRpm > 0);
  const latestWithIncline = logs.find((l) => l.inclineResistance !== null && l.inclineResistance > 0);

  const activeUnit = latestWithSpeed?.speedUnit || latest.speedUnit || speedUnit;
  const activeUnitLabel = formatSpeedUnit(activeUnit);
  const referenceSpeed = latest.speedRpm ?? latestWithSpeed?.speedRpm ?? defaultSpeed;
  const referenceIncline = latest.inclineResistance ?? latestWithIncline?.inclineResistance ?? defaultIncline;

  if (!latestWithDuration || latestWithDuration.durationMinutes === null) {
    return {
      exerciseName,
      action: 'baseline',
      headlineEn: '🎯 Set Aerobic Duration Baseline',
      headlineAr: '🎯 تثبيت خط أساس المدة',
      actionTagEn: `🎯 Target ${defaultDuration} mins · ${referenceSpeed} ${activeUnitLabel}`,
      actionTagAr: `🎯 استهدف ${defaultDuration} دقيقة · ${referenceSpeed} ${activeUnitLabel}`,
      detailsEn: `Previous session omitted duration (${lastSummaryEn}). Target ${defaultDuration} mins at ${referenceSpeed} ${activeUnitLabel} whenever you choose to track duration.`,
      detailsAr: `الحصة السابقة لم تسجّل المدة (${lastSummaryAr}). استهدف ${defaultDuration} دقيقة على ${referenceSpeed} ${activeUnitLabel} عند الرغبة في تسجيل المدة.`,
      suggestedDurationMinutes: defaultDuration,
      suggestedSpeedRpm: referenceSpeed,
      suggestedInclineResistance: referenceIncline,
      speedUnit: activeUnit,
      lastDurationMinutes: latest.durationMinutes,
      lastSpeedRpm: latest.speedRpm,
      lastInclineResistance: latest.inclineResistance,
      lastHeartRateBpm: latest.heartRateBpm,
      lastSummaryEn,
      lastSummaryAr,
      consecutiveMaxCount: 0,
      minDuration: CARDIO_MIN_DURATION,
      maxDuration: CARDIO_MAX_DURATION,
      isReadyForLevelUp: false
    };
  }

  const refDuration = latestWithDuration.durationMinutes;
  const refSpeedForStreak = latestWithDuration.speedRpm ?? referenceSpeed;
  const refInclineForStreak = latestWithDuration.inclineResistance ?? 0;

  // Count how many consecutive duration-logged sessions hit >= 30 mins at the exact same speed & incline
  let consecutiveMax = 0;
  for (const log of durationLogs) {
    const logSpeed = log.speedRpm ?? refSpeedForStreak;
    const logIncline = log.inclineResistance ?? 0;
    const sameSpeed = Math.abs(logSpeed - refSpeedForStreak) < 0.01;
    const sameIncline = Math.abs(logIncline - refInclineForStreak) < 0.01;
    if ((log.durationMinutes || 0) >= CARDIO_MAX_DURATION && sameSpeed && sameIncline) {
      consecutiveMax++;
    } else {
      break;
    }
  }

  // SCENARIO A (Endurance Mastered):
  // Completed >= 30 mins across 2 consecutive sessions at the same Speed/Incline
  if (refDuration >= CARDIO_MAX_DURATION && durationLogs[1] !== undefined && consecutiveMax >= 2) {
    const useSpeedBump = refSpeedForStreak > 0 || refInclineForStreak === 0;
    const nextSpeed = useSpeedBump
      ? Number((refSpeedForStreak + CARDIO_INTENSITY_STEP).toFixed(1))
      : refSpeedForStreak;
    const nextIncline = useSpeedBump
      ? refInclineForStreak
      : Number((refInclineForStreak + CARDIO_INTENSITY_STEP).toFixed(1));

    const speedActionEn = useSpeedBump
      ? `⬆️ Increase Avg Speed to ${nextSpeed} ${activeUnitLabel}`
      : `⬆️ Increase Incline/Res to ${nextIncline}`;
    const speedActionAr = useSpeedBump
      ? `⬆️ زيادة متوسط السرعة إلى ${nextSpeed} ${activeUnitLabel}`
      : `⬆️ زيادة الميلان/المقاومة إلى ${nextIncline}`;

    return {
      exerciseName,
      action: 'increase_intensity',
      headlineEn: `🔥 Endurance Mastered: ${speedActionEn} & Reset to ${CARDIO_MIN_DURATION}m`,
      headlineAr: `🔥 إتقان التحمل: ${speedActionAr} والعودة إلى ${CARDIO_MIN_DURATION} د`,
      actionTagEn: speedActionEn,
      actionTagAr: speedActionAr,
      detailsEn: `Mastered ${CARDIO_MAX_DURATION} mins twice in a row at ${refSpeedForStreak} ${activeUnitLabel}${refInclineForStreak > 0 ? ` (Incline/Res ${refInclineForStreak})` : ''}! Level up ${useSpeedBump ? `Avg Speed to ${nextSpeed} ${activeUnitLabel} (or Incline +1)` : `Incline/Res to ${nextIncline}`} and reset Duration to ${CARDIO_MIN_DURATION} mins.`,
      detailsAr: `أتممت ${CARDIO_MAX_DURATION} دقيقة في حصتين متتاليتين على ${refSpeedForStreak} ${activeUnitLabel}! ارفع ${useSpeedBump ? `متوسط السرعة إلى ${nextSpeed} ${activeUnitLabel} (أو الميلان +1)` : `الميلان إلى ${nextIncline}`} وأعد المدة إلى ${CARDIO_MIN_DURATION} دقيقة.`,
      suggestedDurationMinutes: CARDIO_MIN_DURATION,
      suggestedSpeedRpm: nextSpeed,
      suggestedInclineResistance: nextIncline,
      speedUnit: activeUnit,
      lastDurationMinutes: latest.durationMinutes,
      lastSpeedRpm: latest.speedRpm,
      lastInclineResistance: latest.inclineResistance,
      lastHeartRateBpm: latest.heartRateBpm,
      lastSummaryEn,
      lastSummaryAr,
      consecutiveMaxCount: consecutiveMax,
      minDuration: CARDIO_MIN_DURATION,
      maxDuration: CARDIO_MAX_DURATION,
      isReadyForLevelUp: true
    };
  }

  // Reached Max Duration (30 mins) for the 1st consecutive session -> Confirm 2nd consecutive session
  if (refDuration >= CARDIO_MAX_DURATION) {
    return {
      exerciseName,
      action: 'consolidate_max',
      headlineEn: `🔒 Lock In 30 mins (1/2 Consecutive Sessions)`,
      headlineAr: `🔒 تثبيت 30 دقيقة (حصة 1 من 2)`,
      actionTagEn: `🔒 Repeat 30 mins @ ${refSpeedForStreak} ${activeUnitLabel} (1/2)`,
      actionTagAr: `🔒 كرر 30 دقيقة @ ${refSpeedForStreak} ${activeUnitLabel} (1/2)`,
      detailsEn: `You reached ${CARDIO_MAX_DURATION} mins once at ${refSpeedForStreak} ${activeUnitLabel}! Complete 1 more consecutive 30-min session at the same intensity to unlock +1 Speed/Incline.`,
      detailsAr: `وصلت إلى ${CARDIO_MAX_DURATION} دقيقة لأول مرة على ${refSpeedForStreak} ${activeUnitLabel}! كرر 30 دقيقة لحصة ثانية متتالية بنفس الشدة قبل رفع المستوى.`,
      suggestedDurationMinutes: CARDIO_MAX_DURATION,
      suggestedSpeedRpm: refSpeedForStreak,
      suggestedInclineResistance: refInclineForStreak,
      speedUnit: activeUnit,
      lastDurationMinutes: latest.durationMinutes,
      lastSpeedRpm: latest.speedRpm,
      lastInclineResistance: latest.inclineResistance,
      lastHeartRateBpm: latest.heartRateBpm,
      lastSummaryEn,
      lastSummaryAr,
      consecutiveMaxCount: consecutiveMax,
      minDuration: CARDIO_MIN_DURATION,
      maxDuration: CARDIO_MAX_DURATION,
      isReadyForLevelUp: false
    };
  }

  // SCENARIO B (Building Stamina):
  // Have not reached Max Duration (30 mins) -> Keep Speed/Incline the same, add +2 mins
  const nextDuration = Math.min(CARDIO_MAX_DURATION, refDuration + CARDIO_DURATION_STEP);

  return {
    exerciseName,
    action: 'increase_duration',
    headlineEn: `🔄 Increase Duration to ${nextDuration} mins (+${nextDuration - refDuration}m)`,
    headlineAr: `🔄 زيادة المدة إلى ${nextDuration} دقيقة (+${nextDuration - refDuration} د)`,
    actionTagEn: `🔄 Increase Duration to ${nextDuration} mins`,
    actionTagAr: `🔄 زيادة المدة إلى ${nextDuration} دقيقة`,
    detailsEn: `Keep Avg Speed at ${refSpeedForStreak} ${activeUnitLabel}${refInclineForStreak > 0 ? ` and Incline/Res at ${refInclineForStreak}` : ''}. Build stamina by adding +2 mins to hit ${nextDuration} mins.`,
    detailsAr: `حافظ على نفس متوسط السرعة (${refSpeedForStreak} ${activeUnitLabel})${refInclineForStreak > 0 ? ` والميلان (${refInclineForStreak})` : ''}، وأضف +2 دقيقة لتصل إلى ${nextDuration} دقيقة.`,
    suggestedDurationMinutes: nextDuration,
    suggestedSpeedRpm: refSpeedForStreak,
    suggestedInclineResistance: refInclineForStreak,
    speedUnit: activeUnit,
    lastDurationMinutes: latest.durationMinutes,
    lastSpeedRpm: latest.speedRpm,
    lastInclineResistance: latest.inclineResistance,
    lastHeartRateBpm: latest.heartRateBpm,
    lastSummaryEn,
    lastSummaryAr,
    consecutiveMaxCount: 0,
    minDuration: CARDIO_MIN_DURATION,
    maxDuration: CARDIO_MAX_DURATION,
    isReadyForLevelUp: false
  };
}

/**
 * Strict Double Progression Formula (Scientific Hypertrophy & Strength Engine):
 *
 * Every exercise has defined parameters from KNOWN_EXERCISES_SPECS:
 * - minReps (e.g. 8 or 10)
 * - maxReps (e.g. 10 or 12)
 * - weightStep (e.g. 2.5 for dumbbells, 5 for machines, 10 for leg press)
 * - availableWeights (exact realistic commercial gym plate / dumbbell rack array)
 *
 * Strict Calculation Logic for the Next Session:
 * Analyze the athlete's LAST completed session for an exercise:
 *
 * 1. WEIGHT INCREASE (Mastery):
 *    IF user successfully hit maxReps on ALL sets (e.g., [10, 10, 10]):
 *    -> Next Target: Weight = LastWeight + weightStep (next commercial gym increment).
 *                    Reps = minReps for all sets (e.g. [8, 8, 8]).
 *
 * 2. REP INCREASE (Building Volume):
 *    IF user hit minReps on all sets, but did NOT reach maxReps on all sets (e.g., [10, 9, 8]):
 *    -> Next Target: Weight = LastWeight (NO CHANGE).
 *                    Reps = LastReps + 1 on the sets that missed the max (e.g., [10, 10, 9]).
 *
 * 3. DELOAD/SAFETY (Struggle):
 *    IF user failed to hit minReps on ANY set (e.g., [8, 7, 5] when minReps is 8):
 *    -> Next Target: Weight = LastWeight (NO CHANGE).
 *                    Reps = minReps for all sets.
 *                    UI Warning: "⚠️ Maintain Weight & Focus on Form" / "⚠️ حافظ على الوزن وركز على الأداء الحركي".
 *
 * CRITICAL RULE: NEVER increment the weight unless ALL sets in the previous session achieved maxReps.
 */
export function getCoachPrescriptionForExercise(
  exerciseName: string,
  targetSets: number = 3,
  _targetRepsFallback: number = 10,
  defaultWeightStr: string = '20',
  workoutHistory: WorkoutSession[] = []
): CoachPrescription {
  const cleanName = exerciseName.trim().toLowerCase();
  const spec = getExerciseSpec(exerciseName);

  const minReps = spec.repRangeMin || 8;
  const maxReps = spec.repRangeMax || 10;
  const weightStep = spec.incrementStep || 2.5;

  // Find most recent session with this exercise
  const sortedSessions = [...workoutHistory].sort((a, b) => b.createdAt - a.createdAt);
  let lastRecordedExercise: WorkoutExercise | null = null;

  for (const session of sortedSessions) {
    if (session.exercises && Array.isArray(session.exercises)) {
      const match = session.exercises.find(e => e.name.trim().toLowerCase() === cleanName);
      if (match && match.sets && match.sets.length > 0) {
        lastRecordedExercise = match;
        break;
      }
    }
  }

  const parseWeight = (raw: any): number => {
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  };

  const defaultNumWeight = parseWeight(defaultWeightStr) || (spec.availableWeights?.[0] || 10);

  // BASELINE: First time performing this exercise
  if (!lastRecordedExercise || !lastRecordedExercise.sets || lastRecordedExercise.sets.length === 0) {
    const baselineSetReps = Array(targetSets).fill(minReps);
    return {
      exerciseName,
      action: 'new_exercise',
      headlineEn: '🎯 Baseline Foundation',
      headlineAr: '🎯 تأسيس المستوى الأولي',
      detailsEn: `Start with ${defaultNumWeight} kg for ${targetSets}x${minReps} reps. Focus on strict form, tempo, and full range of motion.`,
      detailsAr: `ابدأ بوزن ${defaultNumWeight} كجم لـ ${targetSets} مجموعات × ${minReps} تكرارات، مع التركيز على التكنيك الدقيق والمدى الحركي الكامل.`,
      suggestedWeight: defaultNumWeight,
      suggestedReps: minReps,
      suggestedSets: targetSets,
      targetSetReps: baselineSetReps,
      lastWeight: 0,
      lastReps: [],
      lastRepsSummary: 'No past logs',
      minReps,
      maxReps,
      weightStep,
      isReadyForOverload: false,
    };
  }

  // Extract past completed sets & RPE feedback
  const completedSets = lastRecordedExercise.sets.filter(s => s.completed || (s.reps && Number(s.reps) > 0));
  const activeSets = completedSets.length > 0 ? completedSets : lastRecordedExercise.sets;

  const validWeights = activeSets
    .map(s => parseWeight(s.weight))
    .filter(w => w > 0);
  const rawReps = activeSets.map(s => Number(s.reps) || 0);

  // Use the athlete's actual logged working weight from last session
  const lastWeight = validWeights.length > 0 ? Math.max(...validWeights) : defaultNumWeight;
  const numSets = Math.max(targetSets || 3, rawReps.length);

  // Normalize reps array to targetSets length
  const lastReps = Array.from({ length: numSets }, (_, i) => rawReps[i] !== undefined ? rawReps[i] : (rawReps[rawReps.length - 1] || minReps));
  const repsSummary = lastReps.join(', ');
  const peakLastReps = rawReps.length > 0 ? Math.max(...rawReps) : 0;
  const rpeFeedback = lastRecordedExercise.rpeFeedback;

  // -----------------------------------------------------------------
  // FEATURE 2: DYNAMIC REP OVER-PERFORMANCE (Breaking the Ceiling)
  // IF actual reps EXCEED maxReps by +2 or more (e.g. 14 reps when max is 12)
  // AND RPE wasn't Failure -> Immediate "Double Weight Jump" (2x weightStep).
  // -----------------------------------------------------------------
  const brokeCeilingByTwoPlus = peakLastReps >= maxReps + 2;
  if (brokeCeilingByTwoPlus && rpeFeedback !== 'failure') {
    const { nextWeight, incrementStep } = getDoubleProgressionWeight(exerciseName, lastWeight);
    const actualStep = incrementStep > 0 ? incrementStep : weightStep * 2;
    const targetSetReps = Array(numSets).fill(minReps);

    return {
      exerciseName,
      action: 'double_jump_weight',
      headlineEn: `⚡ Double Weight Jump (+${actualStep} kg)`,
      headlineAr: `⚡ قفزة وزن مضاعفة (+${actualStep} كجم)`,
      detailsEn: `Broke rep ceiling with ${peakLastReps} reps (max ${maxReps}, +${peakLastReps - maxReps} over)! Jumping 2x increment to ${nextWeight} kg for ${minReps} reps to match true strength.`,
      detailsAr: `تجاوزت سقف التكرارات بـ ${peakLastReps} تكرار (الحد الأقصى ${maxReps})! تم تطبيق قفزة مضاعفة إلى ${nextWeight} كجم لـ ${minReps} تكرارات لمطابقة قوتك الفعلية.`,
      suggestedWeight: nextWeight,
      suggestedReps: minReps,
      suggestedSets: numSets,
      targetSetReps,
      lastWeight,
      lastReps,
      lastRepsSummary: `${repsSummary} reps`,
      minReps,
      maxReps,
      weightStep: actualStep,
      isReadyForOverload: true,
      isDoubleJump: true,
      rpeFeedbackApplied: rpeFeedback,
      peakLastReps,
      hasWarningFlag: false
    };
  }

  // -----------------------------------------------------------------
  // FEATURE 3A: RPE FAILURE GUARD (RIR 0)
  // Keep weight the same or micro-deload slightly to prevent CNS overload & injury.
  // -----------------------------------------------------------------
  if (rpeFeedback === 'failure') {
    const missedMinCount = lastReps.filter(r => r < minReps).length;
    const shouldDropSlightly = missedMinCount >= 2 || (lastReps.reduce((a, b) => a + b, 0) / lastReps.length) < minReps;

    if (shouldDropSlightly) {
      const { nextWeight, decrementStep } = getSmallDeloadWeight(exerciseName, lastWeight);
      const targetSetReps = Array(numSets).fill(minReps);
      return {
        exerciseName,
        action: 'rpe_failure_hold',
        headlineEn: decrementStep > 0
          ? `🔴 Failure (RIR 0): Micro-Deload -${decrementStep} kg`
          : `🔴 Failure (RIR 0): Hold ${lastWeight} kg`,
        headlineAr: decrementStep > 0
          ? `🔴 فشل عضلي (RIR 0): تخفيف طفيف -${decrementStep} كجم`
          : `🔴 فشل عضلي (RIR 0): تثبيت ${lastWeight} كجم`,
        detailsEn: `Last session hit Failure (RIR 0) below ${minReps} reps (${repsSummary}). Dropping slightly to ${nextWeight} kg for ${minReps} controlled reps to protect joints & CNS recovery.`,
        detailsAr: `وصلت للفشل العضلي (RIR 0) دون إكمال ${minReps} تكرارات (${repsSummary}). خفّض الوزن قليلاً إلى ${nextWeight} كجم لـ ${minReps} تكرارات نظيفة لحماية المفاصل والاستشفاء.`,
        suggestedWeight: nextWeight,
        suggestedReps: minReps,
        suggestedSets: numSets,
        targetSetReps,
        lastWeight,
        lastReps,
        lastRepsSummary: `${repsSummary} reps`,
        minReps,
        maxReps,
        weightStep,
        isReadyForOverload: false,
        rpeFeedbackApplied: 'failure',
        peakLastReps,
        hasWarningFlag: true
      };
    }

    const holdReps = lastReps.map(r => Math.max(minReps, Math.min(maxReps, r)));
    const peakHoldRep = Math.max(...holdReps);
    return {
      exerciseName,
      action: 'rpe_failure_hold',
      headlineEn: `🔴 Failure (RIR 0): Hold ${lastWeight} kg — No Jump`,
      headlineAr: `🔴 فشل عضلي (RIR 0): تثبيت ${lastWeight} كجم دون زيادة`,
      detailsEn: `Logged Failure (RIR 0) at ${lastWeight} kg (${repsSummary}). Keeping weight steady at ${lastWeight} kg next session so you stabilize RIR 1-2 safely before adding load.`,
      detailsAr: `سجّلت فشلاً عضلياً (RIR 0) على وزن ${lastWeight} كجم (${repsSummary}). سيتم تثبيت الوزن عند ${lastWeight} كجم لتحقيق استشفاء واستقرار آمن قبل أي زيادة.`,
      suggestedWeight: lastWeight,
      suggestedReps: peakHoldRep,
      suggestedSets: numSets,
      targetSetReps: holdReps,
      lastWeight,
      lastReps,
      lastRepsSummary: `${repsSummary} reps`,
      minReps,
      maxReps,
      weightStep,
      isReadyForOverload: false,
      rpeFeedbackApplied: 'failure',
      peakLastReps,
      hasWarningFlag: true
    };
  }

  // -----------------------------------------------------------------
  // FEATURE 3B: RPE EASY (RIR 3+)
  // Automatically suggest a weight increase regardless of rep scheme!
  // -----------------------------------------------------------------
  if (rpeFeedback === 'easy') {
    const { nextWeight, incrementStep } = getNextProgressionWeight(exerciseName, lastWeight);
    const actualStep = incrementStep > 0 ? incrementStep : weightStep;
    const targetSetReps = Array(numSets).fill(minReps);

    return {
      exerciseName,
      action: 'rpe_easy_jump',
      headlineEn: `🟢 Easy (RIR 3+): Auto Weight Up +${actualStep} kg`,
      headlineAr: `🟢 سهل (RIR 3+): زيادة الوزن تلقائياً +${actualStep} كجم`,
      detailsEn: `Rated "Easy (RIR 3+)" at ${lastWeight} kg (${repsSummary}). Auto-increasing load to ${nextWeight} kg for ${minReps} reps regardless of rep ceiling.`,
      detailsAr: `تم تقييم الوزن كـ "سهل (RIR 3+)" عند ${lastWeight} كجم (${repsSummary}). سيتم رفع الوزن تلقائياً إلى ${nextWeight} كجم لـ ${minReps} تكرارات.`,
      suggestedWeight: nextWeight,
      suggestedReps: minReps,
      suggestedSets: numSets,
      targetSetReps,
      lastWeight,
      lastReps,
      lastRepsSummary: `${repsSummary} reps`,
      minReps,
      maxReps,
      weightStep: actualStep,
      isReadyForOverload: true,
      rpeFeedbackApplied: 'easy',
      peakLastReps,
      hasWarningFlag: false
    };
  }

  // -----------------------------------------------------------------
  // 1. WEIGHT INCREASE (Mastery):
  // Hit maxReps on ALL sets (e.g. [10, 10, 10] or [12, 12, 12])
  // -----------------------------------------------------------------
  const masteredAllSets = lastReps.length >= 3 && lastReps.every(r => r >= maxReps);

  if (masteredAllSets) {
    const { nextWeight, incrementStep } = getNextProgressionWeight(exerciseName, lastWeight);
    const actualStep = incrementStep > 0 ? incrementStep : weightStep;
    const targetSetReps = Array(numSets).fill(minReps);

    return {
      exerciseName,
      action: 'increase_weight',
      headlineEn: `🔥 Level Up Load: +${actualStep} kg`,
      headlineAr: `🔥 زيادة الوزن: +${actualStep} كجم`,
      detailsEn: `Mastered ${lastWeight}kg across all sets (${repsSummary} >= ${maxReps} reps)! Overload load to ${nextWeight} kg and reset to ${minReps} reps on all sets.`,
      detailsAr: `أتقنت وزن ${lastWeight} كجم في جميع المجموعات (${repsSummary} >= ${maxReps} تكرار)! ارفع الوزن إلى ${nextWeight} كجم وابدأ من ${minReps} تكرارات لجميع المجموعات.`,
      suggestedWeight: nextWeight,
      suggestedReps: minReps,
      suggestedSets: numSets,
      targetSetReps,
      lastWeight,
      lastReps,
      lastRepsSummary: `${repsSummary} reps`,
      minReps,
      maxReps,
      weightStep: actualStep,
      isReadyForOverload: true,
      rpeFeedbackApplied: rpeFeedback,
      peakLastReps,
      hasWarningFlag: false
    };
  }

  // -----------------------------------------------------------------
  // 2. REP INCREASE (Building Volume):
  // Hit minReps on ALL sets, but did NOT reach maxReps on all sets (e.g. [10, 9, 8])
  // Weight = LastWeight (NO CHANGE). Reps = LastReps + 1 on sets that missed max!
  // -----------------------------------------------------------------
  const hitMinRepsAllSets = lastReps.every(r => r >= minReps);

  if (hitMinRepsAllSets) {
    // Add +1 rep to sets that have not yet reached maxReps
    const targetSetReps = lastReps.map(r => Math.min(maxReps, r + (r < maxReps ? 1 : 0)));
    const targetSetRepsSummary = targetSetReps.join(', ');
    const peakNextRep = Math.max(...targetSetReps);

    return {
      exerciseName,
      action: 'consolidate_volume',
      headlineEn: `🔄 Rep Increase: Build Volume (+1 on missed sets)`,
      headlineAr: `🔄 زيادة التكرارات: بناء الحجم (+1 تكرار)`,
      detailsEn: `Weight steady at ${lastWeight}kg (no increase). Push missed sets: target [${targetSetRepsSummary}] reps to build volume towards ${maxReps} reps.`,
      detailsAr: `ثبّت الوزن عند ${lastWeight} كجم (دون زيادة). ادفع المجموعات غير المكتملة: الهدف القادم [${targetSetRepsSummary}] تكرار حتى تصل إلى ${maxReps} في جميع المجموعات.`,
      suggestedWeight: lastWeight,
      suggestedReps: peakNextRep,
      suggestedSets: numSets,
      targetSetReps,
      lastWeight,
      lastReps,
      lastRepsSummary: `${repsSummary} reps`,
      minReps,
      maxReps,
      weightStep,
      isReadyForOverload: false,
      rpeFeedbackApplied: rpeFeedback,
      peakLastReps,
      hasWarningFlag: false
    };
  }

  // -----------------------------------------------------------------
  // 3. DELOAD / SAFETY (Struggle):
  // Failed to hit minReps on ANY set (e.g., [8, 7, 5] when minReps is 8)
  // Weight = LastWeight (NO CHANGE). Reps = minReps. UI warning flag added.
  // -----------------------------------------------------------------
  const safetySetReps = Array(numSets).fill(minReps);

  return {
    exerciseName,
    action: 'struggle_safety',
    headlineEn: '⚠️ Maintain Weight & Focus on Form',
    headlineAr: '⚠️ حافظ على الوزن وركز على الأداء الحركي',
    detailsEn: `Fell short of ${minReps} reps on some sets (${repsSummary}). Do not add weight! Maintain ${lastWeight}kg, aim for ${minReps} clean reps on all sets, and prioritize strict technique & tempo.`,
    detailsAr: `لم تكمل الحد الأدنى (${minReps} تكرارات) في بعض المجموعات (${repsSummary}). لا تزد الوزن! حافظ على ${lastWeight} كجم، استهدف ${minReps} تكرارات نقية في كل المجموعات، وركز على التكنيك والاستشفاء.`,
    suggestedWeight: lastWeight,
    suggestedReps: minReps,
    suggestedSets: numSets,
    targetSetReps: safetySetReps,
    lastWeight,
    lastReps,
    lastRepsSummary: `${repsSummary} reps`,
    minReps,
    maxReps,
    weightStep,
    isReadyForOverload: false,
    rpeFeedbackApplied: rpeFeedback,
    peakLastReps,
    hasWarningFlag: true
  };
}
