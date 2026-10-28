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
  CheckCircle2,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Briefcase,
  Target,
  Eye,
  Camera
} from 'lucide-react';
import { WorkoutSession, WorkoutExercise, WorkoutSet, WorkoutRoutineTemplate, BodyProfileConfig } from '../types';
import { getExerciseImagePath, getExerciseSpec, getExerciseMeta } from '../utils/exerciseAssets';
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
  lastRepsSummary: string;
  nextWeightKg: number;
  nextTargetReps: number;
  overloadStatus: 'increase_weight' | 'consolidate_reps' | 'form_recovery' | 'baseline';
  actionTagEn: string;
  actionTagAr: string;
  executionCueEn: string;
  executionCueAr: string;
  imagePath: string;
  meta: { categoryEn: string; categoryAr: string; icon: string };
}

const PRESET_ROUTINES_CONFIG: {
  id: 'routine-a-fullbody' | 'routine-b-fullbody';
  name: string;
  exercises: { name: string; defaultWeight: number }[];
}[] = [
  {
    id: 'routine-a-fullbody',
    name: 'Routine A (Full Body)',
    exercises: [
      { name: 'Leg Press Machine', defaultWeight: 60 },
      { name: 'Flat Dumbbell Bench Press', defaultWeight: 20 },
      { name: 'Wide Grip Lat Pulldown', defaultWeight: 45 },
      { name: 'Seated Dumbbell Shoulder Press', defaultWeight: 14 },
      { name: 'Cable Rope Hammer Curls', defaultWeight: 18 },
    ]
  },
  {
    id: 'routine-b-fullbody',
    name: 'Routine B (Full Body)',
    exercises: [
      { name: 'Goblet Squat', defaultWeight: 24 },
      { name: 'Seated Cable Row', defaultWeight: 45 },
      { name: 'Incline Dumbbell Bench Press', defaultWeight: 18 },
      { name: 'Dumbbell Lateral Raises', defaultWeight: 8 },
      { name: 'Tricep Rope Pushdown', defaultWeight: 20 },
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

  // Routine selection: Routine A or Routine B
  const [selectedRoutineId, setSelectedRoutineId] = useState<'routine-a-fullbody' | 'routine-b-fullbody'>('routine-a-fullbody');

  // Modal preview state
  const [previewExerciseName, setPreviewExerciseName] = useState<string | null>(null);

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

  // Check how many past workouts exist containing exercises from this specific routine
  const routineHistorySessions = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => b.createdAt - a.createdAt);
    const exerciseSet = new Set(currentRoutineConfig.exercises.map(e => e.name.trim().toLowerCase()));

    return sorted.filter(w => {
      if (!w.exercises || !Array.isArray(w.exercises)) return false;
      return w.exercises.some(e => exerciseSet.has(e.name.trim().toLowerCase()) && e.sets && e.sets.length > 0);
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

  // Algorithmic Double Progression Evaluation for Selected Routine
  const exercisePrescriptions: TacticalExercisePrescription[] = useMemo(() => {
    if (!hasBaselineHistory) return [];

    return currentRoutineConfig.exercises.map((item) => {
      const cleanName = item.name.trim().toLowerCase();
      const spec = getExerciseSpec(item.name);
      
      // Find latest session containing this exercise
      let lastExerciseMatch: WorkoutExercise | null = null;
      for (const w of routineHistorySessions) {
        if (w.exercises) {
          const match = w.exercises.find(e => e.name.trim().toLowerCase() === cleanName);
          if (match && match.sets && match.sets.length > 0) {
            lastExerciseMatch = match;
            break;
          }
        }
      }

      const imgPath = getExerciseImagePath(item.name);
      const meta = getExerciseMeta(item.name);

      if (!lastExerciseMatch || !lastExerciseMatch.sets || lastExerciseMatch.sets.length === 0) {
        return {
          name: item.name,
          targetSets: 3,
          repRangeMin: spec.repRangeMin,
          repRangeMax: spec.repRangeMax,
          incrementStep: spec.incrementStep,
          lastWeightKg: null,
          lastRepsSummary: isAr ? 'لم تسجل سابقاً' : 'No past logs',
          nextWeightKg: item.defaultWeight,
          nextTargetReps: spec.repRangeMin,
          overloadStatus: 'baseline',
          actionTagEn: '🎯 Baseline Setup',
          actionTagAr: '🎯 إدراج المستوى الأول',
          executionCueEn: spec.executionCueEn,
          executionCueAr: spec.executionCueAr,
          imagePath: imgPath,
          meta
        };
      }

      // Past sets extraction
      const completedSets = lastExerciseMatch.sets.filter(s => s.completed || (s.reps && Number(s.reps) > 0));
      const activeSets = completedSets.length > 0 ? completedSets : lastExerciseMatch.sets;

      const weights = activeSets.map(s => {
        const parsed = parseFloat(String(s.weight).replace(/[^0-9.]/g, ''));
        return isNaN(parsed) ? item.defaultWeight : parsed;
      });
      const reps = activeSets.map(s => Number(s.reps) || 0);

      const maxWeight = Math.max(...weights, item.defaultWeight);
      const repsSummary = reps.join(', ') + ' reps';

      // DOUBLE PROGRESSION SCENARIOS:
      // Scenario A (Mastered weight): All sets >= repRangeMax
      const masteredAllSets = reps.length >= 3 && reps.every(r => r >= spec.repRangeMax);

      // Scenario B (Volume Building): All sets >= repRangeMin, but not all reached repRangeMax
      const hitMinRepRangeAllSets = reps.length >= 3 && reps.every(r => r >= spec.repRangeMin);

      if (masteredAllSets) {
        // SCENARIO A: Mastered the weight -> Increase TargetWeight by incrementStep, reset reps to repRangeMin
        const nextWeight = maxWeight + spec.incrementStep;
        const nextTargetReps = spec.repRangeMin;

        return {
          name: item.name,
          targetSets: 3,
          repRangeMin: spec.repRangeMin,
          repRangeMax: spec.repRangeMax,
          incrementStep: spec.incrementStep,
          lastWeightKg: maxWeight,
          lastRepsSummary: repsSummary,
          nextWeightKg: nextWeight,
          nextTargetReps,
          overloadStatus: 'increase_weight',
          actionTagEn: `🔥 Weight Increase ⬆️ (+${spec.incrementStep}kg)`,
          actionTagAr: `🔥 زيادة الوزن (+${spec.incrementStep} كجم)`,
          executionCueEn: `Mastered ${maxWeight}kg! Increased to ${nextWeight}kg for ${nextTargetReps} reps. Explosive push, 3s negative.`,
          executionCueAr: `أتقنت وزن ${maxWeight} كجم! تمت زيادة الوزن إلى ${nextWeight} كجم لـ ${nextTargetReps} تكرارات. دفع قوي ونزول بطيء.`,
          imagePath: imgPath,
          meta
        };
      } else if (hitMinRepRangeAllSets) {
        // SCENARIO B: Hit min rep range -> Keep same weight, push reps towards repRangeMax
        const maxRepRecorded = Math.max(...reps);
        const nextTargetReps = Math.min(spec.repRangeMax, maxRepRecorded + 1);

        return {
          name: item.name,
          targetSets: 3,
          repRangeMin: spec.repRangeMin,
          repRangeMax: spec.repRangeMax,
          incrementStep: spec.incrementStep,
          lastWeightKg: maxWeight,
          lastRepsSummary: repsSummary,
          nextWeightKg: maxWeight,
          nextTargetReps,
          overloadStatus: 'consolidate_reps',
          actionTagEn: '🔄 Volume Increase',
          actionTagAr: '🔄 زيادة عدد التكرارات',
          executionCueEn: `Hold ${maxWeight}kg steady. Aim for ${nextTargetReps} reps per set before adding weight.`,
          executionCueAr: `ثبّت الوزن عند ${maxWeight} كجم. اسعَ للوصول إلى ${nextTargetReps} تكراراً في كل مجموعة قبل زيادته.`,
          imagePath: imgPath,
          meta
        };
      } else {
        // SCENARIO C: Failed to hit min rep range on one or more sets -> Focus on Form / CNS Recovery
        return {
          name: item.name,
          targetSets: 3,
          repRangeMin: spec.repRangeMin,
          repRangeMax: spec.repRangeMax,
          incrementStep: spec.incrementStep,
          lastWeightKg: maxWeight,
          lastRepsSummary: repsSummary,
          nextWeightKg: maxWeight,
          nextTargetReps: spec.repRangeMin,
          overloadStatus: 'form_recovery',
          actionTagEn: '⚠️ Focus on Form / CNS Recovery',
          actionTagAr: '⚠️ التركيز على التكنيك والاستشفاء',
          executionCueEn: `Maintain ${maxWeight}kg with strict technique and full range of motion. Rest 90-120s between sets.`,
          executionCueAr: `حافظ على ${maxWeight} كجم بتكنيك دقيق ومدى حركي كامل. خذ راحة 90-120 ثانية بين المجموعات.`,
          imagePath: imgPath,
          meta
        };
      }
    });
  }, [routineHistorySessions, currentRoutineConfig, isAr, hasBaselineHistory]);

  // Launch Workout Directly with Prescribed Targets
  const handleLaunchSession = () => {
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
        targetReps: spec.repRangeMin,
        nextWeightKg: e.defaultWeight,
        nextTargetReps: spec.repRangeMin
      };
    })).map((p: any, idx: number) => ({
      id: `ex-${Date.now()}-${idx}`,
      name: p.name,
      isAutoFilled: true,
      sets: Array.from({ length: p.targetSets || 3 }).map((_, sIdx) => ({
        id: `s-${Date.now()}-${idx}-${sIdx}`,
        setNumber: sIdx + 1,
        reps: p.nextTargetReps || 10,
        weight: (p.nextWeightKg || 20).toString(),
        weightUnit: 'kg' as const,
        completed: false
      }))
    }));

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
          <div className="flex items-center p-1 bg-slate-100 dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSelectedRoutineId('routine-a-fullbody')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedRoutineId === 'routine-b-fullbody'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Routine B
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

      {/* CONDITIONAL DISPLAY: Zero History vs Calculated Prescriptions */}
      {!hasBaselineHistory ? (
        /* Zero Baseline Screen when no historical workouts recorded for this routine */
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
              const isLevelUp = ex.overloadStatus === 'increase_weight';
              const isConsolidate = ex.overloadStatus === 'consolidate_reps';

              return (
                <div
                  key={ex.name}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                    isLevelUp
                      ? 'bg-gradient-to-r from-emerald-50/70 via-white to-white dark:from-emerald-950/30 dark:via-[#18191D] dark:to-[#18191D] border-emerald-300 dark:border-emerald-600/50 shadow-xs'
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
                        onClick={() => setPreviewExerciseName(ex.name)}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center relative group cursor-pointer hover:border-emerald-500 transition-all"
                        title={isAr ? 'انقر لمعاينة حركة التمرين والتكنيك' : 'Click to preview exercise technique'}
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
                            onClick={() => setPreviewExerciseName(ex.name)}
                            className="text-base font-black text-slate-900 dark:text-white truncate hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors text-left rtl:text-right cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{ex.name}</span>
                            <Eye size={14} className="text-slate-400 hover:text-emerald-500" />
                          </button>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isLevelUp
                              ? 'bg-emerald-500 text-white shadow-xs'
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

                    {/* Right: Last Performance vs Next Target Numbers */}
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-neutral-900/90 p-3 rounded-2xl border border-slate-200 dark:border-neutral-800 self-start lg:self-auto shrink-0">
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

      {/* Exercise Preview Modal */}
      {previewExerciseName && (
        <ExercisePreviewModal
          exerciseName={previewExerciseName}
          onClose={() => setPreviewExerciseName(null)}
          lang={lang}
        />
      )}

    </div>
  );
};
