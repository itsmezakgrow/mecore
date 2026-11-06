import { WorkoutSession, WorkoutExercise } from '../types';
import { getNextProgressionWeight, getExerciseSpec } from './exerciseAssets';

export interface CoachPrescription {
  exerciseName: string;
  action: 'increase_weight' | 'consolidate_volume' | 'struggle_safety' | 'new_exercise';
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
  hasWarningFlag?: boolean;
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

  // Extract past completed sets
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
    hasWarningFlag: true
  };
}
