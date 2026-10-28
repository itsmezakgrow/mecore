import { WorkoutSession, WorkoutExercise } from '../types';

export interface CoachPrescription {
  exerciseName: string;
  action: 'increase_weight' | 'consolidate_volume' | 'maintain' | 'new_exercise';
  headlineEn: string;
  headlineAr: string;
  detailsEn: string;
  detailsAr: string;
  suggestedWeight: number;
  suggestedReps: number;
  suggestedSets: number;
  lastWeight: number;
  lastRepsSummary: string;
  isReadyForOverload: boolean;
}

/**
 * Double Progression Rule (Algorithmic Strength Coach - Code-only):
 *
 * 1. Checks the last completed workout session containing this exercise.
 * 2. If the user hit target reps on ALL sets (e.g., 3 sets of 10 or 12):
 *    -> LEVEL UP: Increase weight by +2.5kg (or +2kg/1.25kg), reset reps to lower threshold (e.g. 8-10 reps).
 * 3. If the user completed sets with diminishing reps (e.g., 10, 8, 7):
 *    -> CONSOLIDATE: Maintain current weight, focus on adding +1-2 reps on the later sets first.
 * 4. If this is a new exercise without history:
 *    -> BASELINE: Set safe initial load with target reps to establish foundation.
 */
export function getCoachPrescriptionForExercise(
  exerciseName: string,
  targetSets: number = 3,
  targetReps: number = 10,
  defaultWeightStr: string = '20',
  workoutHistory: WorkoutSession[] = []
): CoachPrescription {
  const cleanName = exerciseName.trim().toLowerCase();
  
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

  const defaultNumWeight = parseWeight(defaultWeightStr) || 20;

  if (!lastRecordedExercise || !lastRecordedExercise.sets || lastRecordedExercise.sets.length === 0) {
    return {
      exerciseName,
      action: 'new_exercise',
      headlineEn: 'Baseline Foundation',
      headlineAr: 'تأسيس المستوى الأولي',
      detailsEn: `Start with ${defaultNumWeight} kg for ${targetSets}x${targetReps}. Focus on strict form and full range of motion.`,
      detailsAr: `ابدأ بوزن ${defaultNumWeight} كجم لـ ${targetSets} مجموعات × ${targetReps} تكرار، مع التركيز على التكنيك الصحيح والحركة الكاملة.`,
      suggestedWeight: defaultNumWeight,
      suggestedReps: targetReps,
      suggestedSets: targetSets,
      lastWeight: 0,
      lastRepsSummary: 'No past logs',
      isReadyForOverload: false,
    };
  }

  const completedSets = lastRecordedExercise.sets.filter(s => s.completed || (s.reps && Number(s.reps) > 0));
  const activeSets = completedSets.length > 0 ? completedSets : lastRecordedExercise.sets;

  const weights = activeSets.map(s => parseWeight(s.weight));
  const reps = activeSets.map(s => Number(s.reps) || 0);

  const maxWeight = Math.max(...weights, defaultNumWeight);
  const allSetsHitTarget = reps.length >= targetSets && reps.every(r => r >= targetReps);
  const repsSummary = reps.join(', ');

  if (allSetsHitTarget) {
    // PROGRESSIVE OVERLOAD ACHIEVED: Recommend weight jump!
    const weightIncrement = maxWeight >= 40 ? 5 : 2.5;
    const nextWeight = maxWeight + weightIncrement;
    const nextTargetReps = Math.max(8, targetReps - 2); // temporarily drop reps to adapt to higher load

    return {
      exerciseName,
      action: 'increase_weight',
      headlineEn: `🔥 Level Up Load: +${weightIncrement} kg`,
      headlineAr: `🔥 زيادة الوزن: +${weightIncrement} كجم`,
      detailsEn: `Target achieved last session (${repsSummary} reps @ ${maxWeight}kg)! Overload to ${nextWeight} kg for ${targetSets}x${nextTargetReps}.`,
      detailsAr: `أتممت الهدف بنجاح في الجلسة السابقة (${repsSummary} تكرارات بوزن ${maxWeight} كجم)! زد الوزن إلى ${nextWeight} كجم لـ ${targetSets} مجموعات × ${nextTargetReps}.`,
      suggestedWeight: nextWeight,
      suggestedReps: nextTargetReps,
      suggestedSets: targetSets,
      lastWeight: maxWeight,
      lastRepsSummary: `${repsSummary} reps @ ${maxWeight}kg`,
      isReadyForOverload: true,
    };
  }

  // VOLUME CONSOLIDATION NEEDED: Keep current weight and push remaining sets to hit target reps
  return {
    exerciseName,
    action: 'consolidate_volume',
    headlineEn: `🎯 Volume Consolidation @ ${maxWeight} kg`,
    headlineAr: `🎯 تثبيت الحجم عند ${maxWeight} كجم`,
    detailsEn: `Last logs: ${repsSummary} reps. Maintain ${maxWeight} kg and aim to hit ${targetReps} reps on all ${targetSets} sets before increasing weight.`,
    detailsAr: `سجلك السابق: ${repsSummary} تكرارات. حافظ على وزن ${maxWeight} كجم وركّز على إكمال ${targetReps} تكرار في كل المجموعات قبل رفع الوزن.`,
    suggestedWeight: maxWeight,
    suggestedReps: targetReps,
    suggestedSets: targetSets,
    lastWeight: maxWeight,
    lastRepsSummary: `${repsSummary} reps @ ${maxWeight}kg`,
    isReadyForOverload: false,
  };
}
