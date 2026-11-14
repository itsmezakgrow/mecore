import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Dumbbell,
  Calendar,
  Clock,
  Utensils,
  Scale,
  Zap,
  Play,
  Flame,
  Info,
  ArrowRight,
  Briefcase,
  Target,
  Eye,
  Activity,
  CheckSquare,
  Square
} from 'lucide-react';
import { WorkoutSession, WorkoutExercise, WorkoutRoutineTemplate, BodyProfileConfig, RpeFeedbackRating } from '../types';
import { getExerciseImagePath, getExerciseSpec, getExerciseMeta, getExerciseBiomechanicalType, normalizeExerciseLookupKey } from '../utils/exerciseAssets';
import { getCoachPrescriptionForExercise, getCardioOverloadPrescription, CardioPrescription } from '../utils/progressiveOverloadCoach';
import { ExercisePreviewModal } from './ExercisePreviewModal';

interface NextSessionOverloadPlannerProps {
  workouts: WorkoutSession[];
  profile: BodyProfileConfig | null;
  onLaunchWorkoutWithTargets: (template: WorkoutRoutineTemplate, exercises: WorkoutExercise[], targetDate: string) => void;
  isDark?: boolean;
  lang?: 'en' | 'ar';
}

interface TacticalExercisePrescription {
  name: string;
  targetSets: number;
  repRangeMin: number;
  repRangeMax: number;
  incrementStep: number;
  lastWeightKg: number | null;
  lastReps?: number[];
  lastRepsSummary: string;
  nextWeightKg: number;
  nextTargetReps: number;
  targetSetReps?: number[];
  overloadStatus:
    | 'increase_weight'
    | 'double_jump_weight'
    | 'rpe_easy_jump'
    | 'rpe_failure_hold'
    | 'consolidate_reps'
    | 'form_recovery'
    | 'baseline';
  rpeFeedbackApplied?: RpeFeedbackRating;
  actionTagEn: string;
  actionTagAr: string;
  executionCueEn: string;
  executionCueAr: string;
  imagePath: string;
  meta: { categoryEn: string; categoryAr: string; icon: string };
}

const PRESET_ROUTINES_CONFIG: {
  id: 'routine-a-fullbody' | 'routine-b-fullbody' | 'routine-c-cardio';
  name: string;
  isCardio?: boolean;
  exercises: {
    name: string;
    subtitle?: string;
    defaultWeight: number;
    defaultDuration?: number;
    defaultSpeed?: number;
    speedUnit?: 'km/h' | 'rpm' | 'level' | 'spm';
    defaultIncline?: number;
  }[];
}[] = [
  {
    id: 'routine-a-fullbody',
    name: 'Routine A (Full Body)',
    exercises: [
      { name: 'Leg Press Machine', defaultWeight: 20 },
      { name: 'Flat Dumbbell Bench Press', defaultWeight: 7.5 },
      { name: 'Wide Grip Lat Pulldown', defaultWeight: 25 },
      { name: 'Seated Dumbbell Shoulder Press', defaultWeight: 7.5 },
      { name: 'Cable Rope Hammer Curls', defaultWeight: 12.5 },
    ]
  },
  {
    id: 'routine-b-fullbody',
    name: 'Routine B (Full Body)',
    exercises: [
      { name: 'Goblet Squat', defaultWeight: 7.5 },
      { name: 'Seated Cable Row', defaultWeight: 20 },
      { name: 'Incline Dumbbell Bench Press', defaultWeight: 7.5 },
      { name: 'Dumbbell Lateral Raises', defaultWeight: 2.5 },
      { name: 'Tricep Rope Pushdown', defaultWeight: 20 },
    ]
  },
  {
    id: 'routine-c-cardio',
    name: 'Routine C (Cardio & Conditioning)',
    isCardio: true,
    exercises: [
      { name: 'Treadmill', subtitle: 'طابي roulant', defaultWeight: 0, defaultDuration: 15, defaultSpeed: 8, speedUnit: 'km/h', defaultIncline: 1 },
      { name: 'Stationary Bike', subtitle: 'Picala', defaultWeight: 0, defaultDuration: 15, defaultSpeed: 75, speedUnit: 'rpm', defaultIncline: 4 },
      { name: 'Rowing Machine', subtitle: 'Erg / Rower', defaultWeight: 0, defaultDuration: 15, defaultSpeed: 10, speedUnit: 'km/h', defaultIncline: 5 },
      { name: 'Jump Rope', subtitle: 'الحبل', defaultWeight: 0, defaultDuration: 15, defaultSpeed: 1, speedUnit: 'level', defaultIncline: 0 },
      { name: 'Outdoor Sprint Intervals', subtitle: 'Outside / No equipment', defaultWeight: 0, defaultDuration: 15, defaultSpeed: 1, speedUnit: 'level', defaultIncline: 0 },
      { name: 'Burpees / Kettlebell Swings', subtitle: 'High-Intensity limited space', defaultWeight: 0, defaultDuration: 15, defaultSpeed: 1, speedUnit: 'level', defaultIncline: 0 },
    ]
  }
];

export const NextSessionOverloadPlanner: React.FC<NextSessionOverloadPlannerProps> = ({
  workouts = [],
  profile,
  onLaunchWorkoutWithTargets,
  isDark = false,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';

  // Routine selection: Routine A, Routine B, or Routine C
  const [selectedRoutineId, setSelectedRoutineId] = useState<'routine-a-fullbody' | 'routine-b-fullbody' | 'routine-c-cardio'>('routine-a-fullbody');

  // Flexible cardio selection (defaults to all 6 options)
  const [selectedCardioNames, setSelectedCardioNames] = useState<string[]>([
    'Treadmill',
    'Stationary Bike',
    'Rowing Machine',
    'Jump Rope',
    'Outdoor Sprint Intervals',
    'Burpees / Kettlebell Swings'
  ]);

  const toggleCardioSelection = (name: string) => {
    setSelectedCardioNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // Modal preview state
  const [previewExercise, setPreviewExercise] = useState<{
    name: string;
    weightKg: number;
    lastWeightKg?: number | null;
    lastRepsSummary?: string;
    nextTargetReps?: number;
  } | null>(null);

  // Input Parameters required by user:
  const [sessionDate, setSessionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [bodyWeight, setBodyWeight] = useState<number>(profile?.currentWeightKg || 64);
  const [bodyHeight, setBodyHeight] = useState<number>(profile?.heightCm || 186);
  const [preGymMeals, setPreGymMeals] = useState<number>(2);
  const [gymEntryTime, setGymEntryTime] = useState<string>('17:30');

  // Sync profile when loaded
  React.useEffect(() => {
    if (profile?.currentWeightKg) setBodyWeight(profile.currentWeightKg);
    if (profile?.heightCm) setBodyHeight(profile.heightCm);
  }, [profile]);

  const currentRoutineConfig = PRESET_ROUTINES_CONFIG.find(r => r.id === selectedRoutineId) || PRESET_ROUTINES_CONFIG[0];
  const isCardioRoutine = !!currentRoutineConfig.isCardio;

  // Check how many past workouts exist containing exercises from this specific routine
  const routineHistorySessions = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => b.createdAt - a.createdAt);
    const exerciseSet = new Set(currentRoutineConfig.exercises.map(e => normalizeExerciseLookupKey(e.name)));

    return sorted.filter(w => {
      if (!w.exercises || !Array.isArray(w.exercises)) return false;
      return w.exercises.some(e => {
        if (!exerciseSet.has(normalizeExerciseLookupKey(e.name))) return false;
        const hasStrengthLogs = e.sets && e.sets.length > 0;
        const hasCardioLogs = e.cardioData && e.cardioData.completed === true;
        return hasStrengthLogs || hasCardioLogs;
      });
    });
  }, [workouts, currentRoutineConfig]);

  const hasBaselineHistory = routineHistorySessions.length > 0;

  // Contextual Physiological & Energy Assessment
  const physiologicalInsight = useMemo(() => {
    const [hoursStr] = gymEntryTime.split(':');
    const hours = parseInt(hoursStr, 10) || 17;

    const focusMode = profile?.primaryFocusMode || 'hypertrophy_sprint';
    const isBusinessFocus = focusMode === 'business_maintenance';

    let energyMessageEn = '';
    let energyMessageAr = '';

    if (isBusinessFocus) {
      energyMessageAr = '💼 وضع تركيز البيزنس والعمل: الحفاظ على الكتلة العضلية وتحفيز الألياف دون استنزاف للجهاز العصبي (RIR 2-3).';
      energyMessageEn = 'Business & Work Focus: Preserving muscle mass with controlled RIR 2-3 to avoid central nervous system fatigue.';
    } else if (hours >= 16 && hours <= 21 && preGymMeals >= 2) {
      energyMessageAr = '🔥 ذروة الجليكوجين العضلي وحرارة الجسم. الوقت الذهبي لتحطيم الأرقام وزيادة الأوزان حسب نظام Double Progression.';
      energyMessageEn = 'Peak Muscle Glycogen & Core Body Temperature. Ideal window for Double Progression load increases.';
    } else if (preGymMeals === 1) {
      energyMessageAr = '⚡ طاقة ممتازة ومستقرة من الوجبة الأولى الخفيفة. حافظ على 90 ثانية راحة بين المجموعات.';
      energyMessageEn = 'Stable sustained energy from Light Meal 1. Take 90s rest intervals on compound lifts.';
    } else if (preGymMeals === 0) {
      energyMessageAr = '⚠️ تمرين على معدة خاوية / صيام. ركّز على التكنيك الدقيق والنزول البطيء، وتجنب الفشل العضلي المبكر.';
      energyMessageEn = 'Fasted state training. Focus on strict form and controlled eccentrics.';
    } else {
      energyMessageAr = '💪 ظروف مثالية للبناء العضلي. حافظ على وتيرة نزول بطيئة (2-3 ثوانٍ) في كل الحركات.';
      energyMessageEn = 'Prime conditions for hypertrophic volume. Maintain 2-3s negative cadence.';
    }

    return { energyMessageEn, energyMessageAr, isBusinessFocus };
  }, [gymEntryTime, preGymMeals, profile?.primaryFocusMode]);

  // Algorithmic Double Progression + RPE + Double Weight Jump Evaluation for Selected Strength Routine
  const exercisePrescriptions: TacticalExercisePrescription[] = useMemo(() => {
    if (!hasBaselineHistory || isCardioRoutine) return [];

    return currentRoutineConfig.exercises.map((item) => {
      const spec = getExerciseSpec(item.name);
      const rx = getCoachPrescriptionForExercise(
        item.name,
        3,
        spec.repRangeMin,
        item.defaultWeight.toString(),
        workouts
      );
      const imgPath = getExerciseImagePath(item.name);
      const meta = getExerciseMeta(item.name);

      let overloadStatus: TacticalExercisePrescription['overloadStatus'] = 'baseline';
      let actionTagEn = '🎯 Baseline Setup';
      let actionTagAr = '🎯 إدراج المستوى الأول';

      if (rx.action === 'double_jump_weight') {
        overloadStatus = 'double_jump_weight';
        actionTagEn = `⚡ Double Jump ⬆️ (+${rx.weightStep}kg)`;
        actionTagAr = `⚡ قفزة وزن مضاعفة (+${rx.weightStep} كجم)`;
      } else if (rx.action === 'rpe_easy_jump') {
        overloadStatus = 'rpe_easy_jump';
        actionTagEn = `🟢 Easy (RIR 3+): +${rx.weightStep}kg`;
        actionTagAr = `🟢 سهل (RIR 3+): +${rx.weightStep} كجم`;
      } else if (rx.action === 'rpe_failure_hold') {
        overloadStatus = 'rpe_failure_hold';
        actionTagEn = rx.headlineEn;
        actionTagAr = rx.headlineAr;
      } else if (rx.action === 'increase_weight') {
        overloadStatus = 'increase_weight';
        actionTagEn = `🔥 Weight Increase ⬆️ (+${rx.weightStep}kg)`;
        actionTagAr = `🔥 زيادة الوزن (+${rx.weightStep} كجم)`;
      } else if (rx.action === 'consolidate_volume') {
        overloadStatus = 'consolidate_reps';
        actionTagEn = '🔄 Rep Increase (Build Volume)';
        actionTagAr = '🔄 زيادة التكرارات (بناء الحجم)';
      } else if (rx.action === 'struggle_safety') {
        overloadStatus = 'form_recovery';
        actionTagEn = '⚠️ Maintain Weight & Focus on Form';
        actionTagAr = '⚠️ حافظ على الوزن وركز على الأداء الحركي';
      }

      return {
        name: item.name,
        targetSets: rx.suggestedSets,
        repRangeMin: rx.minReps,
        repRangeMax: rx.maxReps,
        incrementStep: rx.weightStep,
        lastWeightKg: rx.lastWeight > 0 ? rx.lastWeight : null,
        lastReps: rx.lastReps,
        lastRepsSummary: rx.lastRepsSummary === 'No past logs'
          ? (isAr ? 'لم تسجل سابقاً' : 'No past logs')
          : rx.lastRepsSummary,
        nextWeightKg: rx.suggestedWeight,
        nextTargetReps: rx.suggestedReps,
        targetSetReps: rx.targetSetReps,
        overloadStatus,
        rpeFeedbackApplied: rx.rpeFeedbackApplied,
        actionTagEn,
        actionTagAr,
        executionCueEn: rx.action === 'new_exercise' ? spec.executionCueEn : rx.detailsEn,
        executionCueAr: rx.action === 'new_exercise' ? spec.executionCueAr : rx.detailsAr,
        imagePath: imgPath,
        meta
      };
    });
  }, [workouts, currentRoutineConfig, isAr, hasBaselineHistory, isCardioRoutine]);

  // Cardio Progressive Overload Evaluation for Routine C
  const cardioPrescriptions = useMemo(() => {
    if (!isCardioRoutine) return [];
    return currentRoutineConfig.exercises.map((item) => {
      const spec = getExerciseSpec(item.name);
      const rx: CardioPrescription = getCardioOverloadPrescription(item.name, workouts, {
        durationMinutes: item.defaultDuration,
        speedRpm: item.defaultSpeed,
        speedUnit: item.speedUnit,
        inclineResistance: item.defaultIncline
      });
      return {
        ...rx,
        subtitle: item.subtitle,
        imagePath: getExerciseImagePath(item.name),
        meta: getExerciseMeta(item.name),
        executionCueEn: spec.executionCueEn,
        executionCueAr: spec.executionCueAr,
        supportsIncline: spec.supportsIncline !== false
      };
    });
  }, [isCardioRoutine, currentRoutineConfig, workouts]);

  // Launch Workout Directly with Prescribed Targets
  const handleLaunchSession = () => {
    if (isCardioRoutine) {
      const activeItems = cardioPrescriptions.filter((p) =>
        selectedCardioNames.length > 0 ? selectedCardioNames.includes(p.exerciseName) : true
      );

      const template: WorkoutRoutineTemplate = {
        id: currentRoutineConfig.id,
        name: currentRoutineConfig.name,
        category: 'Cardio & Conditioning',
        isFlexible: true,
        description: isAr
          ? 'حصة كارديو مرنة مع التدرج الذكي للمدة (15-30 دقيقة) والسرعة/المقاومة'
          : 'Flexible Cardio & Conditioning with progressive duration (15-30m) and intensity overload',
        exercises: activeItems.map((p) => ({
          name: p.exerciseName,
          subtitle: p.subtitle,
          isCardio: true,
          isOptional: true,
          targetSets: 1,
          targetReps: p.suggestedDurationMinutes,
          defaultWeight: '0',
          defaultDuration: p.suggestedDurationMinutes,
          defaultSpeed: p.suggestedSpeedRpm,
          speedUnit: p.speedUnit,
          defaultIncline: p.suggestedInclineResistance
        }))
      };

      const targetExercises: WorkoutExercise[] = activeItems.map((p, idx) => {
        const unitStr = p.speedUnit === 'km/h' ? 'km/h' : p.speedUnit === 'rpm' ? 'RPM' : p.speedUnit === 'spm' ? 'SPM' : 'Lv';
        const hasPastSummary =
          p.lastDurationMinutes !== null ||
          p.lastSpeedRpm !== null ||
          p.lastHeartRateBpm !== null;

        return {
          id: `ex-cardio-${Date.now()}-${idx}`,
          name: p.exerciseName,
          exerciseType: 'cardio',
          executionCategory: 'cardio',
          subtitle: p.subtitle,
          isOptional: true,
          category: 'Cardio & Conditioning',
          isAutoFilled: true,
          previousPerformanceSummary: hasPastSummary ? (isAr ? p.lastSummaryAr : p.lastSummaryEn) : undefined,
          nextTargetSummary: `${p.suggestedDurationMinutes}m @ ${p.suggestedSpeedRpm} ${unitStr}`,
          sets: [],
          cardioData: {
            // Actual logged metrics intentionally start empty so omitted metrics are never counted
            speedUnit: p.speedUnit,
            completed: false,
            targetDurationMinutes: p.suggestedDurationMinutes,
            targetSpeedRpm: p.suggestedSpeedRpm,
            targetInclineResistance: p.suggestedInclineResistance,
            previousDurationMinutes: p.lastDurationMinutes ?? undefined,
            previousSpeedRpm: p.lastSpeedRpm ?? undefined,
            previousInclineResistance: p.lastInclineResistance ?? undefined,
            previousHeartRateBpm: p.lastHeartRateBpm ?? undefined
          }
        };
      });

      onLaunchWorkoutWithTargets(template, targetExercises, sessionDate);
      return;
    }

    const template: WorkoutRoutineTemplate = {
      id: currentRoutineConfig.id,
      name: currentRoutineConfig.name,
      category: 'Full Body',
      description: isAr ? 'جلسة تدريبية مبرمجة بناءً على نظام Double Progression' : 'Prescribed Double Progression Session',
      exercises: currentRoutineConfig.exercises.map(e => ({
        name: e.name,
        targetSets: 3,
        targetReps: getExerciseSpec(e.name).repRangeMin,
        defaultWeight: e.defaultWeight.toString()
      }))
    };

    const targetExercises: WorkoutExercise[] = (hasBaselineHistory ? exercisePrescriptions : currentRoutineConfig.exercises.map(e => {
      const spec = getExerciseSpec(e.name);
      return {
        name: e.name,
        targetSets: 3,
        repRangeMin: spec.repRangeMin,
        repRangeMax: spec.repRangeMax,
        incrementStep: spec.incrementStep,
        lastWeightKg: null,
        lastReps: [],
        lastRepsSummary: '',
        nextWeightKg: e.defaultWeight,
        nextTargetReps: spec.repRangeMin,
        overloadStatus: 'baseline' as const,
        actionTagEn: '🎯 Baseline Setup',
        actionTagAr: '🎯 إدراج المستوى الأول',
        executionCueEn: spec.executionCueEn,
        executionCueAr: spec.executionCueAr,
        imagePath: getExerciseImagePath(e.name),
        meta: getExerciseMeta(e.name)
      };
    })).map((p: TacticalExercisePrescription, idx: number) => {
      const targetWeightNum = p.nextWeightKg !== undefined ? p.nextWeightKg : 7.5;
      const targetWeightStr = targetWeightNum.toString();
      const targetRepsNum = p.nextTargetReps || 10;
      
      const prevWeightVal = p.lastWeightKg !== undefined && p.lastWeightKg !== null ? p.lastWeightKg : null;
      const prevWeightStr = prevWeightVal !== null ? prevWeightVal.toString() : '';
      
      const prevRepsArr = Array.isArray(p.lastReps) ? p.lastReps : [];
      const prevSummary = prevWeightVal !== null
        ? `${prevWeightVal}kg (${prevRepsArr.length > 0 ? prevRepsArr.join(', ') : p.lastRepsSummary} reps)`
        : undefined;

      return {
        id: `ex-${Date.now()}-${idx}`,
        name: p.name,
        exerciseType: 'strength' as const,
        executionCategory: getExerciseBiomechanicalType(p.name),
        isAutoFilled: true,
        previousWeight: prevWeightStr,
        previousReps: prevRepsArr[0] || 0,
        previousPerformanceSummary: prevSummary,
        nextTargetSummary: `${targetWeightStr}kg × ${targetRepsNum} reps (${p.targetSets || 3} sets)`,
        targetWeight: targetWeightStr,
        targetReps: targetRepsNum,
        targetSetsCount: p.targetSets || 3,
        sets: Array.from({ length: p.targetSets || 3 }).map((_, sIdx) => {
          const sPastReps = prevRepsArr[sIdx] !== undefined ? prevRepsArr[sIdx] : (prevRepsArr[0] || 0);
          const sTargetReps = (p.targetSetReps && p.targetSetReps[sIdx] !== undefined)
            ? p.targetSetReps[sIdx]
            : targetRepsNum;
          return {
            id: `s-${Date.now()}-${idx}-${sIdx}`,
            setNumber: sIdx + 1,
            reps: sTargetReps, // PRE-FILLED WITH TARGET REPS!
            weight: targetWeightStr, // PRE-FILLED WITH TARGET WEIGHT!
            weightUnit: 'kg' as const,
            completed: false,
            previousWeight: prevWeightStr,
            previousReps: sPastReps,
            targetWeight: targetWeightStr,
            targetReps: sTargetReps
          };
        })
      };
    });

    onLaunchWorkoutWithTargets(template, targetExercises, sessionDate);
  };

  // Target Weight & Duration stats from Profile
  const targetWeightStats = useMemo(() => {
    const curW = profile?.currentWeightKg || bodyWeight || 64;
    const tgtW = profile?.targetWeightKg || 70;
    const months = profile?.timelineMonths || 2;
    const diff = Number((tgtW - curW).toFixed(1));
    const weeklyRate = months > 0 ? Number((diff / (months * 4.33)).toFixed(2)) : 0;
    return { curW, tgtW, months, diff, weeklyRate };
  }, [profile, bodyWeight]);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900 dark:text-slate-100">
      
      {/* Top Banner: Routine Selector & Goal Adaptation Readout */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isAr ? 'خطة وتوجيهات الحصة القادمة (Next Session Gameplan)' : 'Next Session Overload Gameplan'}
                </h2>
                <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800/40">
                  DOUBLE PROGRESSION
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                {isAr
                  ? 'خوارزمية رياضية دقيقة لتحقيق زيادة الوزن التدريجي بناءً على أدائك الحقيقي.'
                  : 'Calculates your next target loads strictly from your recorded historical performance.'}
              </p>
            </div>
          </div>

          {/* Routine Toggle Buttons */}
          <div className="flex flex-wrap items-center p-1 bg-slate-100 dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 self-start md:self-auto gap-1">
            <button
              type="button"
              onClick={() => setSelectedRoutineId('routine-a-fullbody')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedRoutineId === 'routine-a-fullbody'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Routine A
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoutineId('routine-b-fullbody')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedRoutineId === 'routine-b-fullbody'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Routine B
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoutineId('routine-c-cardio')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedRoutineId === 'routine-c-cardio'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Routine C (Cardio)
            </button>
          </div>
        </div>

        {/* Goal & Target Weight Readout Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Target size={16} className="text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                {isAr ? `هدف الوزن المراد تحقيقه: ` : `Target Goal: `}
                <strong className="text-emerald-600 dark:text-emerald-400">{targetWeightStats.tgtW} kg</strong>
                {isAr ? ` خلال ${targetWeightStats.months} أشهر ` : ` in ${targetWeightStats.months} months `}
                ({targetWeightStats.weeklyRate > 0 ? `+${targetWeightStats.weeklyRate}` : targetWeightStats.weeklyRate} kg/{isAr ? 'أسبوع' : 'wk'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {profile?.primaryFocusMode === 'business_maintenance' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 text-[11px]">
                <Briefcase size={13} />
                <span>{isAr ? 'وضع تركيز البيزنس والعمل' : 'Business Focus Mode'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                <Zap size={13} />
                <span>{isAr ? 'وضع التضخيم العضلي الفائق' : 'Hypertrophy Sprint'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inputs Bento: Date, Weight, Height, Meals, Entry Time */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="text-xs font-black uppercase text-slate-500 dark:text-neutral-400 tracking-wider flex items-center gap-2">
            <Clock size={14} className="text-emerald-500" />
            <span>{isAr ? 'ظروف الحصة القادمة ومستوى الجاهزية' : 'Next Session Parameters'}</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {routineHistorySessions.length} {isAr ? 'حصص سابقة مسجلة' : 'sessions logged for this routine'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>{isAr ? 'تاريخ الحصة:' : 'Session Date:'}</span>
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* 2. Weight */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Scale size={13} className="text-slate-400" />
              <span>{isAr ? 'الوزن (kg):' : 'Weight (kg):'}</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* 3. Height */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Info size={13} className="text-slate-400" />
              <span>{isAr ? 'الطول (cm):' : 'Height (cm):'}</span>
            </label>
            <input
              type="number"
              value={bodyHeight}
              onChange={(e) => setBodyHeight(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* 4. Number of meals before gym */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Utensils size={13} className="text-slate-400" />
              <span>{isAr ? 'وجبات قبل النادي:' : 'Pre-Gym Meals:'}</span>
            </label>
            <select
              value={preGymMeals}
              onChange={(e) => setPreGymMeals(parseInt(e.target.value, 10))}
              className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value={0}>{isAr ? 'صائم / 0 وجبة' : 'Fasted (0 meals)'}</option>
              <option value={1}>{isAr ? 'وجبة 1 (طاقة خفيفة)' : '1 Meal (Light fuel)'}</option>
              <option value={2}>{isAr ? 'وجبتين (طاقة كاملة)' : '2 Meals (Full glycogen)'}</option>
              <option value={3}>{isAr ? '3 وجبات' : '3 Meals'}</option>
            </select>
          </div>

          {/* 5. Gym entry time */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Clock size={13} className="text-slate-400" />
              <span>{isAr ? 'وقت دخول الجيم:' : 'Gym Entry Time:'}</span>
            </label>
            <input
              type="time"
              value={gymEntryTime}
              onChange={(e) => setGymEntryTime(e.target.value)}
              className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Dynamic Energy Callout */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3 text-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Zap size={16} />
          </div>
          <div>
            <span className="font-black text-emerald-800 dark:text-emerald-300 uppercase text-[10px] block">
              {isAr ? 'توصيات الجاهزية العصبية والتغذية:' : 'Readiness & Energy Note:'}
            </span>
            <p className="text-emerald-900 dark:text-emerald-200 font-medium mt-0.5">
              {isAr ? physiologicalInsight.energyMessageAr : physiologicalInsight.energyMessageEn}
            </p>
          </div>
        </div>
      </div>

      {/* CONDITIONAL DISPLAY: Routine C Cardio Gameplan vs Strength Zero History / Prescriptions */}
      {isCardioRoutine ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <h3 className="text-sm font-black uppercase text-slate-500 dark:text-neutral-400 tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-sky-500" />
              <span>
                {isAr
                  ? 'خطة تدرج الكارديو — Routine C (15–30 دقيقة، اختيار مرن حسب المعدات)'
                  : 'Cardio Overload Plan — Routine C (15–30 mins, Flexible Equipment)'}
              </span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              {selectedCardioNames.length}/{cardioPrescriptions.length} {isAr ? 'محددة للحصة' : 'selected for session'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {cardioPrescriptions.map((cx, idx) => {
              const isSelected = selectedCardioNames.includes(cx.exerciseName);
              const isIntensityUp = cx.action === 'increase_intensity';
              const isConsolidateMax = cx.action === 'consolidate_max';
              const unitStr = cx.speedUnit === 'km/h' ? 'km/h' : cx.speedUnit === 'rpm' ? 'RPM' : 'Lv';

              return (
                <div
                  key={cx.exerciseName}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                    !isSelected
                      ? 'opacity-65 bg-slate-50 dark:bg-neutral-900/50 border-slate-200 dark:border-neutral-800'
                      : isIntensityUp
                      ? 'bg-gradient-to-r from-emerald-50/70 via-white to-white dark:from-emerald-950/30 dark:via-[#18191D] dark:to-[#18191D] border-emerald-300 dark:border-emerald-600/50 shadow-xs'
                      : 'bg-gradient-to-r from-sky-50/60 via-white to-white dark:from-sky-950/20 dark:via-[#18191D] dark:to-[#18191D] border-sky-200 dark:border-sky-800/40 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Toggle Checkbox + Exercise Icon + Name & Action Tag */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleCardioSelection(cx.exerciseName)}
                        className="mt-1 sm:mt-0 text-sky-600 dark:text-sky-400 hover:scale-105 transition-transform cursor-pointer shrink-0"
                        title={isSelected ? (isAr ? 'استبعاد من هذه الحصة' : 'Exclude from this session') : (isAr ? 'تضمين في الحصة' : 'Include in session')}
                      >
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewExercise({
                          name: cx.exerciseName,
                          weightKg: cx.suggestedSpeedRpm,
                          previousRepsSummary: isAr ? cx.lastSummaryAr : cx.lastSummaryEn,
                          targetReps: cx.suggestedDurationMinutes
                        })}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-500/10 dark:bg-sky-950/50 border border-sky-500/20 flex items-center justify-center text-2xl shrink-0 cursor-pointer hover:border-sky-500 transition-all"
                        title={isAr ? 'معاينة قواعد الكارديو والتكنيك' : 'View cardio overload rules & form'}
                      >
                        {cx.meta.icon}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-black text-slate-400">#{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewExercise({
                              name: cx.exerciseName,
                              weightKg: cx.suggestedSpeedRpm,
                              previousRepsSummary: isAr ? cx.lastSummaryAr : cx.lastSummaryEn,
                              targetReps: cx.suggestedDurationMinutes
                            })}
                            className="text-base font-black text-slate-900 dark:text-white hover:text-sky-500 transition-colors text-left rtl:text-right cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{cx.exerciseName}</span>
                            {cx.subtitle && (
                              <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                                ({cx.subtitle})
                              </span>
                            )}
                          </button>

                          <span className="text-[11px] font-bold text-slate-400">· Optional</span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                            isIntensityUp
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isConsolidateMax
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-sky-600 text-white shadow-xs'
                          }`}>
                            {isAr ? cx.actionTagAr : cx.actionTagEn}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium leading-relaxed">
                          {isAr ? cx.detailsAr : cx.detailsEn}
                        </p>
                      </div>
                    </div>

                    {/* Right: Last Session vs Next Cardio Target */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start lg:self-auto shrink-0">
                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-neutral-900/90 p-3 rounded-2xl border border-slate-200 dark:border-neutral-800">
                        <div className="text-left rtl:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            {isAr ? 'آخر حصة' : 'LAST SESSION'}
                          </span>
                          <p className="text-xs font-mono font-bold text-slate-700 dark:text-neutral-300 mt-0.5 tabular-nums">
                            {cx.lastDurationMinutes !== null
                              ? `${cx.lastDurationMinutes} mins`
                              : cx.lastHeartRateBpm !== null
                              ? `♥ ${cx.lastHeartRateBpm} BPM`
                              : '—'}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                            {cx.lastSpeedRpm !== null || cx.lastHeartRateBpm !== null
                              ? [
                                  cx.lastSpeedRpm !== null ? `${cx.lastSpeedRpm} ${unitStr}` : null,
                                  cx.lastInclineResistance ? `Lv ${cx.lastInclineResistance}` : null,
                                  cx.lastDurationMinutes !== null && cx.lastHeartRateBpm !== null ? `♥ ${cx.lastHeartRateBpm} bpm` : null
                                ]
                                  .filter(Boolean)
                                  .join(' · ')
                              : (isAr ? 'لا توجد سجلات' : 'No past logs')}
                          </span>
                        </div>

                        <ArrowRight size={16} className="text-sky-500 rtl:rotate-180" />

                        <div className="text-left rtl:text-right">
                          <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 block">
                            {isAr ? 'الهدف القادم' : 'NEXT TARGET'}
                          </span>
                          <p className="text-base font-mono font-black text-sky-600 dark:text-sky-400 mt-0.5 tabular-nums">
                            {cx.suggestedDurationMinutes} mins
                          </p>
                          <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-neutral-200 tabular-nums">
                            {cx.suggestedSpeedRpm} {unitStr}
                            {cx.supportsIncline && cx.suggestedInclineResistance > 0 ? ` · Inc/Res ${cx.suggestedInclineResistance}` : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewExercise({
                          name: cx.exerciseName,
                          weightKg: cx.suggestedSpeedRpm,
                          previousRepsSummary: isAr ? cx.lastSummaryAr : cx.lastSummaryEn,
                          targetReps: cx.suggestedDurationMinutes
                        })}
                        className="px-3 py-2 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Activity size={14} />
                        <span>{isAr ? 'دليل الكارديو' : 'Cardio Guide'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 text-white border border-neutral-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-white">
                {isAr ? 'جاهز لبدء Routine C (الكارديو واللياقة)؟' : 'Ready for Routine C (Cardio & Conditioning)?'}
              </h4>
              <p className="text-xs text-neutral-400">
                {isAr
                  ? `سيتم تحميل ${selectedCardioNames.length || cardioPrescriptions.length} خيارات كارديو مرنة بأهداف المدة والسرعة المحسوبة.`
                  : `Launches the logger with ${selectedCardioNames.length || cardioPrescriptions.length} selected cardio options pre-filled with Duration & Speed/RPM targets.`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLaunchSession}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer shrink-0"
            >
              <Play size={16} className="fill-current" />
              <span>
                {isAr ? 'بدء Routine C بهذه الأهداف' : 'Launch Routine C With Targets'}
              </span>
            </button>
          </div>
        </div>
      ) : !hasBaselineHistory ? (
        /* Zero Baseline Screen when no historical workouts recorded for this strength routine */
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs text-center space-y-5 animate-scaleUp">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
            <Dumbbell size={32} />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? `لم تقم بتسجيل أي حصص سابقة لـ ${currentRoutineConfig.name}` : `No Baseline Recorded for ${currentRoutineConfig.name}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'خطة زيادة الحمل التدريجي (Double Progression Gameplan) تعتمد على تحليل أدائك الحقيقي. قم بإنجاز وتوثيق أول حصة في السجل لتأكيد أوزانك الأولية للبدء.'
                : 'Overload Gameplan requires at least 1 completed workout session to analyze your baseline strength. Complete and log your first workout to establish your real targets.'}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleLaunchSession}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-emerald-600/30 cursor-pointer transition-all active:scale-95"
            >
              <Play size={16} className="fill-current" />
              <span>{isAr ? `بدء أول حصة لـ ${currentRoutineConfig.name} الآن` : `Launch First Baseline Workout`}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Prescriptions Grid when history exists */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase text-slate-500 dark:text-neutral-400 tracking-wider flex items-center gap-2">
              <Dumbbell size={16} className="text-emerald-500" />
              <span>{isAr ? `توصيات وأوزان ${currentRoutineConfig.name}:` : `Next Targets for ${currentRoutineConfig.name}:`}</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              {exercisePrescriptions.length} {isAr ? 'تمارين مبرمجة' : 'exercises prescribed'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {exercisePrescriptions.map((ex, idx) => {
              const isLevelUp =
                ex.overloadStatus === 'increase_weight' ||
                ex.overloadStatus === 'double_jump_weight' ||
                ex.overloadStatus === 'rpe_easy_jump';
              const isFailureHold = ex.overloadStatus === 'rpe_failure_hold';
              const isConsolidate = ex.overloadStatus === 'consolidate_reps';

              return (
                <div
                  key={ex.name}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                    isLevelUp
                      ? 'bg-gradient-to-r from-emerald-50/70 via-white to-white dark:from-emerald-950/30 dark:via-[#18191D] dark:to-[#18191D] border-emerald-300 dark:border-emerald-600/50 shadow-xs'
                      : isFailureHold
                      ? 'bg-gradient-to-r from-rose-50/60 via-white to-white dark:from-rose-950/20 dark:via-[#18191D] dark:to-[#18191D] border-rose-300 dark:border-rose-700/50 shadow-xs'
                      : isConsolidate
                      ? 'bg-gradient-to-r from-sky-50/50 via-white to-white dark:from-sky-950/20 dark:via-[#18191D] dark:to-[#18191D] border-sky-200 dark:border-sky-800/40'
                      : 'bg-white dark:bg-[#18191D] border-slate-200/80 dark:border-neutral-800 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Exercise Image Thumbnail + Name & Cues */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Interactive Exercise Thumbnail with Pop-up trigger */}
                      <button
                        type="button"
                        onClick={() => setPreviewExercise({
                          name: ex.name,
                          weightKg: ex.nextWeightKg,
                          lastWeightKg: ex.lastWeightKg,
                          lastRepsSummary: ex.lastRepsSummary,
                          nextTargetReps: ex.nextTargetReps
                        })}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center relative group cursor-pointer hover:border-emerald-500 transition-all"
                        title={isAr ? 'انقر لمعاينة تركيب الأقراص والتكنيك' : 'Click to calculate plates & form'}
                      >
                        <img
                          src={ex.imagePath}
                          alt={ex.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const parent = (e.target as HTMLElement).parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.exercise-fallback-icon');
                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <div className="exercise-fallback-icon hidden w-full h-full flex items-center justify-center text-2xl">
                          {ex.meta.icon}
                        </div>
                        {/* Hover Overlay Icon */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye size={20} />
                        </div>
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-black text-slate-400">#{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setPreviewExercise({
                              name: ex.name,
                              weightKg: ex.nextWeightKg,
                              lastWeightKg: ex.lastWeightKg,
                              lastRepsSummary: ex.lastRepsSummary,
                              nextTargetReps: ex.nextTargetReps
                            })}
                            className="text-base font-black text-slate-900 dark:text-white truncate hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors text-left rtl:text-right cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{ex.name}</span>
                            <Eye size={14} className="text-slate-400 hover:text-emerald-500" />
                          </button>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isLevelUp
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isFailureHold
                              ? 'bg-rose-500 text-white shadow-xs'
                              : isConsolidate
                              ? 'bg-sky-500 text-white shadow-xs'
                              : 'bg-amber-500 text-white shadow-xs'
                          }`}>
                            {isAr ? ex.actionTagAr : ex.actionTagEn}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium leading-relaxed">
                          {isAr ? ex.executionCueAr : ex.executionCueEn}
                        </p>
                      </div>
                    </div>

                    {/* Right: Last Performance vs Next Target Numbers & Plate Loader Trigger */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start lg:self-auto shrink-0">
                      <div className="flex items-center gap-4 bg-slate-50 dark:bg-neutral-900/90 p-3 rounded-2xl border border-slate-200 dark:border-neutral-800">
                        {/* Past Session */}
                        <div className="text-left rtl:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            {isAr ? 'آخر حصة' : 'LAST SESSION'}
                          </span>
                          <p className="text-xs font-mono font-bold text-slate-700 dark:text-neutral-300 mt-0.5">
                            {ex.lastWeightKg !== null ? `${ex.lastWeightKg} kg` : '—'}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400">{ex.lastRepsSummary}</span>
                        </div>

                        <ArrowRight size={16} className="text-emerald-500 rtl:rotate-180" />

                        {/* Next Target */}
                        <div className="text-left rtl:text-right">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                            {isAr ? 'الهدف القادم' : 'NEXT TARGET'}
                          </span>
                          <p className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {ex.nextWeightKg} kg
                          </p>
                          <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-neutral-200">
                            {ex.targetSets} sets × {ex.nextTargetReps} reps
                          </span>
                        </div>
                      </div>

                      {/* Equipment Plate Calculator Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setPreviewExercise({
                          name: ex.name,
                          weightKg: ex.nextWeightKg,
                          lastWeightKg: ex.lastWeightKg,
                          lastRepsSummary: ex.lastRepsSummary,
                          nextTargetReps: ex.nextTargetReps
                        })}
                        className="px-3 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                        title={isAr ? 'حساب توزيع الأقراص والدامبلز في الصالة' : 'Calculate plate loading & dumbbells'}
                      >
                        <Scale size={14} />
                        <span>{isAr ? 'حاسبة الأقراص' : 'Plate Breakdown'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Launch Button when history exists */}
          <div className="p-4 rounded-3xl bg-slate-900 text-white border border-neutral-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-white">
                {isAr ? `جاهز لبدء ${currentRoutineConfig.name}؟` : `Ready for ${currentRoutineConfig.name}?`}
              </h4>
              <p className="text-xs text-neutral-400">
                {isAr
                  ? `سيتم فتح شاشة التمرين محملة بالأوزان والتكرارات المحسوبة.`
                  : `Launches the logger pre-filled with calculated targets.`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLaunchSession}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
            >
              <Play size={16} className="fill-current" />
              <span>
                {isAr
                  ? `بدء تمرين ${currentRoutineConfig.name} بهاد الأهداف`
                  : `Launch ${currentRoutineConfig.name} With Targets`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Exercise Preview & Equipment Calculator Modal */}
      {previewExercise && (
        <ExercisePreviewModal
          exerciseName={previewExercise.name}
          targetWeightKg={previewExercise.weightKg}
          previousWeightKg={previewExercise.lastWeightKg ?? undefined}
          previousRepsSummary={previewExercise.lastRepsSummary}
          targetReps={previewExercise.nextTargetReps}
          onClose={() => setPreviewExercise(null)}
          lang={lang}
        />
      )}

    </div>
  );
};
