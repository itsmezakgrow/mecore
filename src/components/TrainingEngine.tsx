import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dumbbell,
  Flame,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Play,
  Pause,
  Trophy,
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Sparkles,
  Award,
  BarChart3,
  ListOrdered,
  History,
  Info,
  Check,
  Timer,
  Share2,
  Copy,
  AlertCircle,
  Scale,
  Utensils,
  CalendarDays,
  Target,
  ArrowRight,
  CheckSquare,
  ShieldCheck,
  Activity,
  Eye,
  EyeOff,
  Filter,
  Sliders,
  Square,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  Heart
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { 
  WorkoutSession, 
  WorkoutExercise, 
  WorkoutSet, 
  WorkoutRoutineTemplate,
  WorkoutRoutineCategory,
  CardioExerciseData,
  RpeFeedbackRating,
  HabitItem,
  BodyMetricLog,
  BodyProfileConfig,
  ScheduledWorkoutItem
} from '../types';
import { 
  addWorkout, 
  deleteWorkout, 
  addWorkoutWithHabitBatch,
  subscribeToBodyMetrics,
  addBodyMetricLog,
  deleteBodyMetricLog,
  subscribeToBodyProfile,
  saveBodyProfile,
  subscribeToScheduledWorkouts,
  addScheduledWorkout,
  deleteScheduledWorkout,
  toggleScheduledWorkoutWithHabit
} from '../services/firestoreService';
import { playCelebrationChime } from '../utils/focusAudio';
import {
  getCoachPrescriptionForExercise,
  getCardioOverloadPrescription,
  CardioPrescription,
  analyzeSessionExecutionOrder,
  ExecutionOrderAnalysis
} from '../utils/progressiveOverloadCoach';
import { WorkoutSchedulePlanner } from './WorkoutSchedulePlanner';
import { BodyMetricsNutrition } from './BodyMetricsNutrition';
import { NextSessionOverloadPlanner } from './NextSessionOverloadPlanner';
import { ExercisePreviewModal } from './ExercisePreviewModal';
import { getExerciseImagePath, getExerciseMeta, getExerciseSpec, getExerciseBiomechanicalType, isCardioExercise, normalizeExerciseLookupKey } from '../utils/exerciseAssets';
import { usePageViewSettings } from '../hooks/usePageViewSettings';
import { PageViewSettingsModal, PageViewSettingItem } from './PageViewSettingsModal';

interface TrainingEngineProps {
  workouts: WorkoutSession[];
  habits?: HabitItem[];
  onToggleHabit?: (habitId: string, date: string) => void;
  isDark?: boolean;
  lang?: 'en' | 'ar';
}

/**
 * Helper to find the most recent recorded exercise data across past workout sessions.
 * Returns past sets array or null if never recorded.
 */
function getLastRecordedExercise(exerciseName: string, workoutHistory: WorkoutSession[]): WorkoutExercise | null {
  if (!workoutHistory || workoutHistory.length === 0) return null;
  const targetKey = normalizeExerciseLookupKey(exerciseName);
  
  // Sort sessions chronologically descending
  const sortedSessions = [...workoutHistory].sort((a, b) => b.createdAt - a.createdAt);
  
  for (const session of sortedSessions) {
    if (session.exercises && Array.isArray(session.exercises)) {
      const match = session.exercises.find(ex => normalizeExerciseLookupKey(ex.name) === targetKey);
      if (match && ((match.sets && match.sets.length > 0) || (match.cardioData && match.cardioData.completed === true))) {
        return match;
      }
    }
  }
  return null;
}

// Built-in Iron Engine Presets & Routines (Routine A, Routine B & Routine C are prominent Hero Routines)
const ROUTINE_TEMPLATES: WorkoutRoutineTemplate[] = [
  {
    id: 'routine-a-fullbody',
    name: 'Routine A (Full Body)',
    category: 'Full Body',
    description: 'Leg Press (3x12), Flat DB Bench (3x10), Lat Pulldown (3x12), Shoulder Press (3x10), Hammer Curls (3x12)',
    exercises: [
      { name: 'Leg Press Machine', targetSets: 3, targetReps: 12, defaultWeight: '20' },
      { name: 'Flat Dumbbell Bench Press', targetSets: 3, targetReps: 10, defaultWeight: '7.5' },
      { name: 'Wide Grip Lat Pulldown', targetSets: 3, targetReps: 12, defaultWeight: '25' },
      { name: 'Seated Dumbbell Shoulder Press', targetSets: 3, targetReps: 10, defaultWeight: '7.5' },
      { name: 'Cable Rope Hammer Curls', targetSets: 3, targetReps: 12, defaultWeight: '12.5' },
    ]
  },
  {
    id: 'routine-b-fullbody',
    name: 'Routine B (Full Body)',
    category: 'Full Body',
    description: 'Goblet Squat (3x12), Seated Cable Row (3x12), Incline DB Bench (3x10), Lateral Raises (3x15), Tricep Rope Pushdown (3x12)',
    exercises: [
      { name: 'Goblet Squat', targetSets: 3, targetReps: 12, defaultWeight: '7.5' },
      { name: 'Seated Cable Row', targetSets: 3, targetReps: 12, defaultWeight: '20' },
      { name: 'Incline Dumbbell Bench Press', targetSets: 3, targetReps: 10, defaultWeight: '7.5' },
      { name: 'Dumbbell Lateral Raises', targetSets: 3, targetReps: 15, defaultWeight: '2.5' },
      { name: 'Tricep Rope Pushdown', targetSets: 3, targetReps: 12, defaultWeight: '20' },
    ]
  },
  {
    id: 'routine-c-cardio',
    name: 'Routine C (Cardio & Conditioning)',
    category: 'Cardio & Conditioning',
    isFlexible: true,
    description: 'Flexible Cardio: Treadmill, Stationary Bike, Rowing Machine, Jump Rope, Outdoor Sprints, Burpees',
    exercises: [
      { name: 'Treadmill', subtitle: 'طابي roulant', isCardio: true, isOptional: true, targetSets: 1, targetReps: 15, defaultWeight: '0', defaultDuration: 15, defaultSpeed: 8, speedUnit: 'km/h', defaultIncline: 1 },
      { name: 'Stationary Bike', subtitle: 'Picala', isCardio: true, isOptional: true, targetSets: 1, targetReps: 15, defaultWeight: '0', defaultDuration: 15, defaultSpeed: 75, speedUnit: 'rpm', defaultIncline: 4 },
      { name: 'Rowing Machine', subtitle: 'Erg / Rower', isCardio: true, isOptional: true, targetSets: 1, targetReps: 15, defaultWeight: '0', defaultDuration: 15, defaultSpeed: 10, speedUnit: 'km/h', defaultIncline: 5 },
      { name: 'Jump Rope', subtitle: 'الحبل', isCardio: true, isOptional: true, targetSets: 1, targetReps: 15, defaultWeight: '0', defaultDuration: 15, defaultSpeed: 1, speedUnit: 'level', defaultIncline: 0 },
      { name: 'Outdoor Sprint Intervals', subtitle: 'Outside / No equipment', isCardio: true, isOptional: true, targetSets: 1, targetReps: 15, defaultWeight: '0', defaultDuration: 15, defaultSpeed: 1, speedUnit: 'level', defaultIncline: 0 },
      { name: 'Burpees / Kettlebell Swings', subtitle: 'High-Intensity limited space', isCardio: true, isOptional: true, targetSets: 1, targetReps: 15, defaultWeight: '0', defaultDuration: 15, defaultSpeed: 1, speedUnit: 'level', defaultIncline: 0 },
    ]
  },
  {
    id: 'push-mastery',
    name: 'Push Mastery (Calisthenics)',
    category: 'Push',
    description: 'Chest, Triceps, and Anterior Delts progressive strength',
    exercises: [
      { name: 'Standard Push-ups', targetSets: 4, targetReps: 15, defaultWeight: 'Bodyweight' },
      { name: 'Parallel Bar Dips', targetSets: 4, targetReps: 10, defaultWeight: 'Bodyweight' },
      { name: 'Diamond Push-ups', targetSets: 3, targetReps: 12, defaultWeight: 'Bodyweight' },
      { name: 'Pike Push-ups', targetSets: 3, targetReps: 8, defaultWeight: 'Bodyweight' },
    ]
  },
  {
    id: 'pull-dominance',
    name: 'Pull & Back Dominance',
    category: 'Pull',
    description: 'Lats, Rhomboids, Biceps, and Scapular stability',
    exercises: [
      { name: 'Standard Pull-ups', targetSets: 4, targetReps: 8, defaultWeight: 'Bodyweight' },
      { name: 'Chin-ups', targetSets: 3, targetReps: 8, defaultWeight: 'Bodyweight' },
      { name: 'Horizontal Inverted Rows', targetSets: 4, targetReps: 12, defaultWeight: 'Bodyweight' },
      { name: 'Dead Hang Active Hold', targetSets: 3, targetReps: 45, defaultWeight: 'Secs' },
    ]
  },
  {
    id: 'legs-explosive',
    name: 'Legs & Lower Body Hypertrophy',
    category: 'Legs',
    description: 'Quads, Hamstrings, Glutes, and Calves explosiveness',
    exercises: [
      { name: 'Bodyweight Deep Squats', targetSets: 4, targetReps: 20, defaultWeight: 'Bodyweight' },
      { name: 'Bulgarian Split Squats', targetSets: 3, targetReps: 12, defaultWeight: 'Bodyweight' },
      { name: 'Walking Lunges', targetSets: 3, targetReps: 16, defaultWeight: 'Bodyweight' },
      { name: 'Calf Raises', targetSets: 4, targetReps: 25, defaultWeight: 'Bodyweight' },
    ]
  },
  {
    id: 'core-isometric',
    name: 'Core & Isometric Power',
    category: 'Core & Mobility',
    description: 'Abdominals, obliques, and pelvic floor anti-extension strength',
    exercises: [
      { name: 'Hanging Leg Raises', targetSets: 4, targetReps: 10, defaultWeight: 'Bodyweight' },
      { name: 'L-Sit Hold (Secs)', targetSets: 3, targetReps: 20, defaultWeight: 'Secs' },
      { name: 'Plank Hold (Secs)', targetSets: 3, targetReps: 60, defaultWeight: 'Secs' },
      { name: 'Ab Wheel Rollouts', targetSets: 3, targetReps: 10, defaultWeight: 'Bodyweight' },
    ]
  }
];

const POPULAR_EXERCISES = [
  'Treadmill',
  'Stationary Bike',
  'Rowing Machine',
  'Jump Rope',
  'Outdoor Sprint Intervals',
  'Burpees / Kettlebell Swings',
  'Leg Press',
  'Flat Dumbbell Bench Press',
  'Wide Grip Lat Pulldown',
  'Seated Dumbbell Shoulder Press',
  'Cable Rope Hammer Curls',
  'Goblet Squat',
  'Seated Cable Row',
  'Incline Dumbbell Bench Press',
  'Dumbbell Lateral Raises',
  'Tricep Rope Pushdown',
  'Standard Push-ups',
  'Parallel Bar Dips',
  'Standard Pull-ups',
  'Chin-ups',
  'Pike Push-ups',
  'Handstand Push-ups',
  'Muscle-ups',
  'Diamond Push-ups',
  'Bodyweight Squats',
  'Bulgarian Split Squats',
  'L-Sit Hold (Secs)',
  'Hanging Leg Raises',
  'Plank Hold (Secs)'
];

export const TrainingEngine: React.FC<TrainingEngineProps> = ({
  workouts = [],
  habits = [],
  onToggleHabit,
  isDark = false,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';

  // Navigation sub-tab
  const [activeTab, setActiveTab] = useState<'logger' | 'schedule' | 'nutrition' | 'analytics' | 'history'>('logger');

  // Firestore persistent state for sub-modules
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetricLog[]>([]);
  const [bodyProfile, setBodyProfile] = useState<BodyProfileConfig | null>(null);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkoutItem[]>([]);
  const [linkedHabitId, setLinkedHabitId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('iron_engine_gym_habit') || null;
    } catch {
      return null;
    }
  });
  const [linkedCardioHabitId, setLinkedCardioHabitId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('iron_engine_cardio_habit') || null;
    } catch {
      return null;
    }
  });

  // Flexible Routine C equipment/exercise checklist before starting session
  const [selectedRoutineCExercises, setSelectedRoutineCExercises] = useState<string[]>([
    'Treadmill',
    'Stationary Bike',
    'Rowing Machine',
    'Jump Rope',
    'Outdoor Sprint Intervals',
    'Burpees / Kettlebell Swings'
  ]);
  const handleToggleRoutineCOption = (name: string) => {
    setSelectedRoutineCExercises((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  // Subscribe to real-time Firestore collections
  useEffect(() => {
    const unsubMetrics = subscribeToBodyMetrics(setBodyMetrics);
    const unsubProfile = subscribeToBodyProfile(setBodyProfile);
    const unsubSchedule = subscribeToScheduledWorkouts(setScheduledWorkouts);
    return () => {
      unsubMetrics?.();
      unsubProfile?.();
      unsubSchedule?.();
    };
  }, []);

  // Active workout logger states
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [routineName, setRoutineName] = useState<string>('Routine A (Full Body)');
  const [routineCategory, setRoutineCategory] = useState<WorkoutRoutineCategory>('Full Body');
  const [workoutDate, setWorkoutDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [previewModalData, setPreviewModalData] = useState<{
    name: string;
    targetWeightKg?: number;
    previousWeightKg?: number;
    previousRepsSummary?: string;
    targetReps?: number;
  } | null>(null);
  
  // Toggle to show/hide previous performance and next targets
  const [showTargetsAndHistory, setShowTargetsAndHistory] = useState<boolean>(true);

  // Page View Customization Settings (Show/Hide sections)
  const [showViewSettingsModal, setShowViewSettingsModal] = useState(false);
  const trainingViewSettingsItems: PageViewSettingItem[] = useMemo(() => [
    {
      id: 'routineLauncherHeader',
      label: isAr ? 'شريط أدوات بدء التمرين' : 'Routine Launcher Bar',
      description: isAr
        ? 'شريط أزرار إظهار الأهداف وزر بدء جلسة فارغة مخصصة'
        : 'Controls bar with Targets toggle and Custom Session button',
      icon: <Play size={16} />,
    },
    {
      id: 'primaryRoutines',
      label: isAr ? 'بطاقات الروتينات الأساسية (Routine A & B)' : 'Primary Full-Body Routines',
      description: isAr
        ? 'البطاقات الرئيسية لتمارين الجسم كامل مع أهداف الزيادة التدريجية'
        : 'Dual hero cards for Routine A & B with progressive overload targets',
      icon: <Dumbbell size={16} />,
    },
    {
      id: 'linkedHabitBanner',
      label: isAr ? 'شريط ربط العادة الرياضية' : 'Linked Gym Habit Banner',
      description: isAr
        ? 'شريط ربط إنجاز جلسة التمرين أوتوماتيكياً بالعادة في جدول العادات'
        : 'Banner linking workouts to auto-check habits in Habit Tracker',
      icon: <Flame size={16} />,
    },
    {
      id: 'specialistRoutines',
      label: isAr ? 'الروتينات الإضافية والكاليسثينكس' : 'Specialist & Calisthenics Routines',
      description: isAr
        ? 'شبكة الروتينات الإضافية المتخصصة في القوة والحركة والجمباز'
        : 'Grid of extra specialist workouts for calisthenics, mobility & strength',
      icon: <Layers size={16} />,
    },
  ], [isAr]);

  const { isVisible, toggleSetting, resetSettings } = usePageViewSettings('training', {
    routineLauncherHeader: true,
    primaryRoutines: true,
    linkedHabitBanner: true,
    specialistRoutines: true,
  });

  // Duration & Stopwatch: DOES NOT auto-start as requested!
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [manualDurationMinutes, setManualDurationMinutes] = useState<number>(45);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rest timer between sets
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // New exercise picker input
  const [customExerciseName, setCustomExerciseName] = useState<string>('');
  const [showExerciseSuggestions, setShowExerciseSuggestions] = useState<boolean>(false);

  // Analytics Filter States
  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState<string>('All');
  const [selectedRoutineFilter, setSelectedRoutineFilter] = useState<'All' | 'Routine A' | 'Routine B' | 'Routine C'>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7' | '30' | '90' | 'all'>('30');
  const [analyticsMetric, setAnalyticsMetric] = useState<'load_1rm' | 'volume' | 'reps'>('load_1rm');
  const [analyticsSubView, setAnalyticsSubView] = useState<'gameplan' | 'charts'>('charts');

  // Saving state & notifications
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Cancellation confirm modal & deleting state (NO browser window.confirm!)
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<boolean>(false);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);

  // Exercise collapsing state to avoid long scrolls on mobile
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});
  const handleToggleCollapse = (id: string) => {
    setCollapsedExercises((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Drag & Drop + Reorder state for Dynamic Execution Order
  const [draggedExIdx, setDraggedExIdx] = useState<number | null>(null);
  const [dragOverExIdx, setDragOverExIdx] = useState<number | null>(null);
  const handleMoveExercise = (fromIdx: number, toIdx: number) => {
    setExercises((prev) => {
      if (
        fromIdx < 0 ||
        toIdx < 0 ||
        fromIdx >= prev.length ||
        toIdx >= prev.length ||
        fromIdx === toIdx
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  // Start / stop active workout elapsed timer
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Rest Timer countdown
  useEffect(() => {
    if (isRestActive && restSecondsRemaining !== null && restSecondsRemaining > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev === null || prev <= 1) {
            setIsRestActive(false);
            try {
              playCelebrationChime();
            } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isRestActive, restSecondsRemaining]);

  const startRestTimer = (seconds: number = 60) => {
    setRestSecondsRemaining(seconds);
    setIsRestActive(true);
  };

  const cancelRestTimer = () => {
    setIsRestActive(false);
    setRestSecondsRemaining(null);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Load a preset routine template (Routine A, Routine B, Routine C, or Specialist) with calculated targets
  const handleLoadPreset = (template: WorkoutRoutineTemplate) => {
    setRoutineName(template.name);
    setRoutineCategory(template.category);
    setCollapsedExercises({});

    const sourceExercises =
      template.id === 'routine-c-cardio' && selectedRoutineCExercises.length > 0
        ? template.exercises.filter((item) => selectedRoutineCExercises.includes(item.name))
        : template.exercises;

    const newExs: WorkoutExercise[] = sourceExercises.map((item, idx) => {
      const isCardioItem = !!item.isCardio || isCardioExercise(item.name);

      if (isCardioItem) {
        const cardioRx = getCardioOverloadPrescription(item.name, workouts, {
          durationMinutes: item.defaultDuration,
          speedRpm: item.defaultSpeed,
          speedUnit: item.speedUnit,
          inclineResistance: item.defaultIncline
        });
        const unitLabel = cardioRx.speedUnit === 'km/h' ? 'km/h' : cardioRx.speedUnit === 'rpm' ? 'RPM' : cardioRx.speedUnit === 'spm' ? 'SPM' : 'Lv';
        const hasPastSummary =
          cardioRx.lastDurationMinutes !== null ||
          cardioRx.lastSpeedRpm !== null ||
          cardioRx.lastHeartRateBpm !== null;
        return {
          id: `ex-cardio-${Date.now()}-${idx}`,
          name: item.name,
          exerciseType: 'cardio',
          executionCategory: 'cardio',
          subtitle: item.subtitle,
          isOptional: item.isOptional,
          category: 'Cardio & Conditioning',
          sets: [],
          isAutoFilled: true,
          previousPerformanceSummary: hasPastSummary ? (isAr ? cardioRx.lastSummaryAr : cardioRx.lastSummaryEn) : undefined,
          nextTargetSummary: `${cardioRx.suggestedDurationMinutes} mins @ ${cardioRx.suggestedSpeedRpm} ${unitLabel}`,
          cardioData: {
            // Leave logged actuals empty so unentered metrics are never counted
            speedUnit: cardioRx.speedUnit,
            completed: false,
            targetDurationMinutes: cardioRx.suggestedDurationMinutes,
            targetSpeedRpm: cardioRx.suggestedSpeedRpm,
            targetInclineResistance: cardioRx.suggestedInclineResistance,
            previousDurationMinutes: cardioRx.lastDurationMinutes ?? undefined,
            previousSpeedRpm: cardioRx.lastSpeedRpm ?? undefined,
            previousInclineResistance: cardioRx.lastInclineResistance ?? undefined,
            previousHeartRateBpm: cardioRx.lastHeartRateBpm ?? undefined
          }
        };
      }

      const lastRecorded = getLastRecordedExercise(item.name, workouts);
      const prescription = getCoachPrescriptionForExercise(
        item.name,
        item.targetSets,
        item.targetReps,
        item.defaultWeight,
        workouts
      );

      const targetWeightStr = prescription.suggestedWeight.toString();
      const targetRepsNum = prescription.suggestedReps;

      let pastWeightStr = '';
      let pastRepsNum = 0;
      if (lastRecorded && lastRecorded.sets && lastRecorded.sets.length > 0) {
        const completedSets = lastRecorded.sets.filter(s => s.completed || (s.reps && Number(s.reps) > 0));
        const activeSets = completedSets.length > 0 ? completedSets : lastRecorded.sets;
        const validWeights = activeSets.map(s => parseFloat(String(s.weight).replace(/[^0-9.]/g, ''))).filter(w => !isNaN(w) && w > 0);
        if (validWeights.length > 0) {
          pastWeightStr = Math.max(...validWeights).toString();
        } else {
          pastWeightStr = (lastRecorded.sets[0].weight !== undefined ? lastRecorded.sets[0].weight : '').toString();
        }
        pastRepsNum = lastRecorded.sets[0].reps || 0;
      }

      const targetSets: WorkoutSet[] = Array.from({ length: item.targetSets }).map((_, sIdx) => {
        const pastSet = lastRecorded?.sets?.[sIdx] || lastRecorded?.sets?.[0];
        const sPastWeight = pastSet?.weight !== undefined ? pastSet.weight.toString() : pastWeightStr;
        const sPastReps = pastSet?.reps || pastRepsNum;
        const sTargetReps = (prescription.targetSetReps && prescription.targetSetReps[sIdx] !== undefined)
          ? prescription.targetSetReps[sIdx]
          : targetRepsNum;

        return {
          id: `s-${Date.now()}-${idx}-${sIdx}`,
          setNumber: sIdx + 1,
          reps: sTargetReps, // PRE-FILLED WITH EXACT TARGET REPS!
          weight: targetWeightStr, // PRE-FILLED WITH TARGET WEIGHT!
          weightUnit: 'kg' as const,
          completed: false,
          previousWeight: sPastWeight,
          previousReps: sPastReps,
          targetWeight: targetWeightStr,
          targetReps: sTargetReps
        };
      });

      return {
        id: `ex-${Date.now()}-${idx}`,
        name: item.name,
        exerciseType: 'strength',
        executionCategory: getExerciseBiomechanicalType(item.name),
        sets: targetSets,
        isAutoFilled: true,
        previousWeight: pastWeightStr,
        previousReps: pastRepsNum,
        previousPerformanceSummary: prescription.lastRepsSummary !== 'No past logs' ? `${prescription.lastWeight}kg (${prescription.lastRepsSummary})` : undefined,
        nextTargetSummary: `${targetWeightStr}kg × ${targetRepsNum} reps (${item.targetSets} sets)`,
        targetWeight: targetWeightStr,
        targetReps: targetRepsNum,
        targetSetsCount: item.targetSets
      };
    });
    setExercises(newExs);
    setSaveErrorMessage(null);
    setElapsedSeconds(0);
    setIsTimerRunning(false); // DO NOT auto-start stopwatch!
    const cardioSum = newExs.reduce((sum, ex) => sum + (ex.cardioData?.durationMinutes || 0), 0);
    setManualDurationMinutes(template.category === 'Cardio & Conditioning' && cardioSum > 0 ? Math.min(180, cardioSum) : 45);
    setIsSessionActive(true);
    setActiveTab('logger');
  };

  // Start an empty custom workout session (Secondary option)
  const handleStartCustomWorkout = () => {
    setRoutineName(isAr ? 'تمرين مخصص جديد' : 'Custom Workout Session');
    setRoutineCategory('Custom');
    setExercises([]);
    setSaveErrorMessage(null);
    setCollapsedExercises({});
    setElapsedSeconds(0);
    setIsTimerRunning(false); // DO NOT auto-start stopwatch!
    setManualDurationMinutes(45);
    setIsSessionActive(true);
    setActiveTab('logger');
  };

  // Discard/Cancel active session without window.confirm
  const handleRequestCancelWorkout = () => {
    if (sessionStats.completedSets === 0) {
      setIsSessionActive(false);
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      setExercises([]);
      cancelRestTimer();
    } else {
      setShowCancelConfirmModal(true);
    }
  };

  const handleConfirmDiscardWorkout = () => {
    setIsSessionActive(false);
    setIsTimerRunning(false);
    setElapsedSeconds(0);
    setExercises([]);
    cancelRestTimer();
    setShowCancelConfirmModal(false);
  };

  // Add a new exercise to active routine
  const handleAddExercise = (exerciseName: string) => {
    if (!exerciseName.trim()) return;
    const cleanName = exerciseName.trim();

    if (isCardioExercise(cleanName)) {
      const spec = getExerciseSpec(cleanName);
      const cardioRx = getCardioOverloadPrescription(cleanName, workouts);
      const unitLabel = cardioRx.speedUnit === 'km/h' ? 'km/h' : cardioRx.speedUnit === 'rpm' ? 'RPM' : cardioRx.speedUnit === 'spm' ? 'SPM' : 'Lv';
      const hasPastSummary =
        cardioRx.lastDurationMinutes !== null ||
        cardioRx.lastSpeedRpm !== null ||
        cardioRx.lastHeartRateBpm !== null;
      const newCardioEx: WorkoutExercise = {
        id: `ex-cardio-${Date.now()}`,
        name: cleanName,
        exerciseType: 'cardio',
        executionCategory: 'cardio',
        subtitle: isAr ? spec.subtitleAr : spec.subtitleEn,
        isOptional: true,
        category: 'Cardio & Conditioning',
        sets: [],
        isAutoFilled: true,
        previousPerformanceSummary: hasPastSummary ? (isAr ? cardioRx.lastSummaryAr : cardioRx.lastSummaryEn) : undefined,
        nextTargetSummary: `${cardioRx.suggestedDurationMinutes} mins @ ${cardioRx.suggestedSpeedRpm} ${unitLabel}`,
        cardioData: {
          // Actuals stay empty until entered by user or applied via Apply Target
          speedUnit: cardioRx.speedUnit,
          completed: false,
          targetDurationMinutes: cardioRx.suggestedDurationMinutes,
          targetSpeedRpm: cardioRx.suggestedSpeedRpm,
          targetInclineResistance: cardioRx.suggestedInclineResistance,
          previousDurationMinutes: cardioRx.lastDurationMinutes ?? undefined,
          previousSpeedRpm: cardioRx.lastSpeedRpm ?? undefined,
          previousInclineResistance: cardioRx.lastInclineResistance ?? undefined,
          previousHeartRateBpm: cardioRx.lastHeartRateBpm ?? undefined
        }
      };
      setExercises((prev) => [...prev, newCardioEx]);
      setCustomExerciseName('');
      setShowExerciseSuggestions(false);
      return;
    }

    const lastRecorded = getLastRecordedExercise(cleanName, workouts);
    
    let defaultSets: WorkoutSet[] = [];
    if (lastRecorded && lastRecorded.sets && lastRecorded.sets.length > 0) {
      defaultSets = lastRecorded.sets.map((pastSet, sIdx) => ({
        id: `s-${Date.now()}-${sIdx}`,
        setNumber: sIdx + 1,
        reps: pastSet.reps || 10,
        weight: pastSet.weight || '20',
        weightUnit: pastSet.weightUnit || 'kg',
        completed: false
      }));
    } else {
      defaultSets = [
        { id: `s-${Date.now()}-1`, setNumber: 1, reps: 10, weight: '20', weightUnit: 'kg', completed: false },
        { id: `s-${Date.now()}-2`, setNumber: 2, reps: 10, weight: '20', weightUnit: 'kg', completed: false },
        { id: `s-${Date.now()}-3`, setNumber: 3, reps: 10, weight: '20', weightUnit: 'kg', completed: false },
      ];
    }

    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}`,
      name: cleanName,
      exerciseType: 'strength',
      executionCategory: getExerciseBiomechanicalType(cleanName),
      sets: defaultSets,
      isAutoFilled: !!lastRecorded
    };

    setExercises((prev) => [...prev, newEx]);
    setCustomExerciseName('');
    setShowExerciseSuggestions(false);
  };

  // Remove exercise from active routine
  const handleRemoveExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  // Add set to an exercise
  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `s-${Date.now()}-${ex.sets.length + 1}`,
          setNumber: ex.sets.length + 1,
          reps: lastSet ? lastSet.reps : 10,
          weight: lastSet ? lastSet.weight : '20',
          weightUnit: lastSet ? lastSet.weightUnit : 'kg',
          completed: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  // Remove set from an exercise
  const handleRemoveSet = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const filtered = ex.sets.filter((s) => s.id !== setId);
        const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return { ...ex, sets: renumbered };
      })
    );
  };

  // Update set details
  const handleUpdateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s))
        };
      })
    );
  };

  // Toggle set completed checkbox with audio chime & exact chronological completedAt timestamp
  const handleToggleSetComplete = (exerciseId: string, setId: string) => {
    const now = Date.now();
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        let triggeredComplete = false;
        const nextSets = ex.sets.map((s) => {
          if (s.id === setId) {
            const nextState = !s.completed;
            if (nextState) triggeredComplete = true;
            return {
              ...s,
              completed: nextState,
              completedAt: nextState ? now : undefined
            };
          }
          return s;
        });

        if (triggeredComplete) {
          try {
            playCelebrationChime();
          } catch {}
          startRestTimer(60);
        }

        const allSetsCompleted = nextSets.length > 0 && nextSets.every((s) => s.completed);
        return {
          ...ex,
          sets: nextSets,
          completedAt: allSetsCompleted ? (ex.completedAt && !triggeredComplete ? ex.completedAt : now) : undefined
        };
      })
    );
  };

  // Set or toggle post-exercise RPE / RIR feedback rating
  const handleSetExerciseRpe = (exerciseId: string, rating: RpeFeedbackRating) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          rpeFeedback: ex.rpeFeedback === rating ? undefined : rating
        };
      })
    );
  };

  // Update cardio exercise metrics (keeps omitted fields strictly undefined, never 0)
  const handleUpdateCardio = (exerciseId: string, updates: Partial<CardioExerciseData>) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const spec = getExerciseSpec(ex.name);
        const currentCardio: CardioExerciseData = ex.cardioData || {
          speedUnit: spec.speedUnit ?? 'level',
          completed: false
        };
        return {
          ...ex,
          cardioData: { ...currentCardio, ...updates }
        };
      })
    );
  };

  // Toggle cardio exercise completed with celebration chime & completion timestamp
  const handleToggleCardioComplete = (exerciseId: string) => {
    const now = Date.now();
    setSaveErrorMessage(null);
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const spec = getExerciseSpec(ex.name);
        const currentCardio: CardioExerciseData = ex.cardioData || {
          speedUnit: spec.speedUnit ?? 'level',
          completed: false
        };
        const nextState = !currentCardio.completed;
        if (nextState) {
          try {
            playCelebrationChime();
          } catch {}
        }
        return {
          ...ex,
          completedAt: nextState ? now : undefined,
          cardioData: { ...currentCardio, completed: nextState }
        };
      })
    );
  };

  // Apply cardio coach prescription to active cardio exercise
  const handleApplyCardioTarget = (exerciseId: string, prescription: CardioPrescription) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const currentCardio: CardioExerciseData = ex.cardioData || {
          durationMinutes: prescription.suggestedDurationMinutes,
          speedRpm: prescription.suggestedSpeedRpm,
          speedUnit: prescription.speedUnit,
          inclineResistance: prescription.suggestedInclineResistance,
          completed: false
        };
        return {
          ...ex,
          cardioData: {
            ...currentCardio,
            durationMinutes: prescription.suggestedDurationMinutes,
            speedRpm: prescription.suggestedSpeedRpm,
            speedUnit: prescription.speedUnit,
            inclineResistance: prescription.suggestedInclineResistance,
            targetDurationMinutes: prescription.suggestedDurationMinutes,
            targetSpeedRpm: prescription.suggestedSpeedRpm,
            targetInclineResistance: prescription.suggestedInclineResistance
          }
        };
      })
    );
    try {
      playCelebrationChime();
    } catch {}
  };

  // Apply Coach Target Prescription to an exercise
  const handleApplyCoachTarget = (
    exerciseId: string,
    recommendedWeight: number,
    recommendedReps: number,
    targetSetReps?: number[]
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          targetWeight: recommendedWeight.toString(),
          targetReps: recommendedReps,
          sets: ex.sets.map((s, sIdx) => {
            if (s.completed) return s; // leave completed alone
            const setRep = (targetSetReps && targetSetReps[sIdx] !== undefined)
              ? targetSetReps[sIdx]
              : recommendedReps;
            return {
              ...s,
              weight: recommendedWeight.toString(),
              reps: setRep,
              targetWeight: recommendedWeight.toString(),
              targetReps: setRep
            };
          })
        };
      })
    );
    try {
      playCelebrationChime();
    } catch {}
  };

  // Active workout summary stats (strictly counts ONLY checked exercises and entered metrics)
  const sessionStats = useMemo(() => {
    let totalSets = 0;
    let completedSets = 0;
    let totalReps = 0;
    let calculatedVolume = 0;
    let cardioExercisesCount = 0;
    let completedCardioCount = 0;
    let totalCardioMinutes = 0;
    let bpmSum = 0;
    let bpmCount = 0;

    exercises.forEach((ex) => {
      const isCardio = ex.exerciseType === 'cardio' || !!ex.cardioData || isCardioExercise(ex.name);
      if (isCardio) {
        cardioExercisesCount++;
        totalSets++;
        if (ex.cardioData?.completed) {
          completedSets++;
          completedCardioCount++;
          const dur = Number(ex.cardioData.durationMinutes);
          if (Number.isFinite(dur) && dur > 0) {
            totalCardioMinutes += dur;
          }
          const bpm = Number(ex.cardioData.heartRateBpm);
          if (Number.isFinite(bpm) && bpm > 0) {
            bpmSum += bpm;
            bpmCount++;
          }
        }
      } else {
        ex.sets.forEach((s) => {
          totalSets++;
          if (s.completed) {
            completedSets++;
            const reps = Number(s.reps) || 0;
            totalReps += reps;
            const weightNum = parseFloat(String(s.weight || '0'));
            if (!isNaN(weightNum) && weightNum > 0) {
              calculatedVolume += reps * weightNum;
            }
          }
        });
      }
    });

    const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    const avgHeartRateBpm = bpmCount > 0 ? Math.round(bpmSum / bpmCount) : undefined;
    return {
      totalSets,
      completedSets,
      totalReps,
      calculatedVolume,
      completionRate,
      cardioExercisesCount,
      completedCardioCount,
      totalCardioMinutes,
      avgHeartRateBpm
    };
  }, [exercises]);

  // Save workout session to Firestore (strictly includes ONLY checked exercises & entered metrics)
  const handleSaveWorkout = async () => {
    setSaveErrorMessage(null);

    const checkedExercisesOnly: WorkoutExercise[] = exercises
      .map((ex): WorkoutExercise | null => {
        const isCardio = ex.exerciseType === 'cardio' || !!ex.cardioData || isCardioExercise(ex.name);
        if (isCardio) {
          if (!ex.cardioData?.completed) return null;
          const dur = Number(ex.cardioData.durationMinutes);
          const spd = Number(ex.cardioData.speedRpm);
          const inc = Number(ex.cardioData.inclineResistance);
          const bpm = Number(ex.cardioData.heartRateBpm);

          const cleanCardio: CardioExerciseData = {
            ...ex.cardioData,
            durationMinutes: Number.isFinite(dur) && dur > 0 ? dur : undefined,
            speedRpm: Number.isFinite(spd) && spd > 0 ? spd : undefined,
            inclineResistance: Number.isFinite(inc) && inc > 0 ? inc : undefined,
            heartRateBpm: Number.isFinite(bpm) && bpm > 0 ? bpm : undefined,
            completed: true
          };
          return {
            ...ex,
            exerciseType: 'cardio',
            executionCategory: 'cardio',
            cardioData: cleanCardio
          };
        }

        const completedSetsOnly = (ex.sets || []).filter((s) => s.completed === true);
        if (completedSetsOnly.length === 0) return null;
        return {
          ...ex,
          sets: completedSetsOnly.map((s, idx) => ({ ...s, setNumber: idx + 1 }))
        };
      })
      .filter((item): item is WorkoutExercise => item !== null);

    if (checkedExercisesOnly.length === 0) {
      setShowCancelConfirmModal(false);
      setSaveErrorMessage(
        isAr
          ? 'يرجى تحديد التمرين أو المجموعات التي أنجزتها فقط قبل الحفظ. التمارين غير المحددة لا يتم احتسابها.'
          : 'Check off at least one exercise or set before finishing. Unchecked exercises are excluded from your session.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const isPureCardioSession = checkedExercisesOnly.every(
        (ex) => ex.exerciseType === 'cardio' || !!ex.cardioData || isCardioExercise(ex.name)
      );

      // Recompute strictly from checkedExercisesOnly and entered metrics (never fabricate omitted cardio metrics!)
      let savedVolume = 0;
      let savedReps = 0;
      let savedSetsCount = 0;
      let savedCardioMins = 0;
      let savedBpmSum = 0;
      let savedBpmCount = 0;

      checkedExercisesOnly.forEach((ex) => {
        const isCardio = ex.exerciseType === 'cardio' || !!ex.cardioData;
        if (isCardio && ex.cardioData) {
          savedSetsCount++;
          if (ex.cardioData.durationMinutes && ex.cardioData.durationMinutes > 0) {
            savedCardioMins += ex.cardioData.durationMinutes;
          }
          if (ex.cardioData.heartRateBpm && ex.cardioData.heartRateBpm > 0) {
            savedBpmSum += ex.cardioData.heartRateBpm;
            savedBpmCount++;
          }
        } else {
          ex.sets.forEach((s) => {
            savedSetsCount++;
            const reps = Number(s.reps) || 0;
            savedReps += reps;
            const weightNum = parseFloat(String(s.weight || '0'));
            if (!isNaN(weightNum) && weightNum > 0) {
              savedVolume += reps * weightNum;
            }
          });
        }
      });

      const savedAvgHeartRate = savedBpmCount > 0 ? Math.round(savedBpmSum / savedBpmCount) : undefined;

      // For cardio sessions, only store durationMinutes when timer ran or cardio duration was entered
      const durationMins = elapsedSeconds >= 60
        ? Math.round(elapsedSeconds / 60)
        : isPureCardioSession
        ? (savedCardioMins > 0 ? savedCardioMins : undefined)
        : (manualDurationMinutes || 45);

      const targetDate = workoutDate || new Date().toISOString().split('T')[0];
      const executionOrder = analyzeSessionExecutionOrder(checkedExercisesOnly);

      const payload: Omit<WorkoutSession, 'id'> = {
        routineName: routineName.trim(),
        routineCategory,
        exercises: checkedExercisesOnly,
        durationMinutes: durationMins,
        date: targetDate,
        createdAt: Date.now(),
        notes: workoutNotes.trim() || undefined,
        totalVolume: savedVolume,
        totalReps: savedReps,
        totalSets: savedSetsCount,
        totalCardioMinutes: savedCardioMins > 0 ? savedCardioMins : undefined,
        avgHeartRateBpm: savedAvgHeartRate,
        hasExecutionOrderAlert: executionOrder.hasAlert,
        executionOrderAlertDetails: executionOrder.hasAlert ? executionOrder.detailsEn : undefined,
      };

      // Check linked habits for automatic batch completion
      const gymHabitId = linkedHabitId || (typeof window !== 'undefined' ? localStorage.getItem('iron_engine_gym_habit') || undefined : undefined);
      const cardioHabitId = linkedCardioHabitId || (typeof window !== 'undefined' ? localStorage.getItem('iron_engine_cardio_habit') || undefined : undefined);

      if (gymHabitId || cardioHabitId) {
        await addWorkoutWithHabitBatch(payload, gymHabitId, cardioHabitId);
      } else {
        await addWorkout(payload);
      }

      playCelebrationChime();

      setSaveSuccessMessage(
        isAr
          ? `🎉 تم حفظ ${checkedExercisesOnly.length} تمرين/تمارين منجزة وتحديث العادة المرتبطة بنجاح!`
          : `🎉 Saved ${checkedExercisesOnly.length} checked exercise(s) & updated linked habit!`
      );
      setTimeout(() => setSaveSuccessMessage(null), 4000);

      setShowCancelConfirmModal(false);
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      cancelRestTimer();
      setIsSessionActive(false);
      setExercises([]);
      setActiveTab('analytics');
    } catch (err) {
      console.error('Failed to log workout session:', err);
      setSaveErrorMessage(isAr ? 'حدث خطأ أثناء حفظ التمرين، يرجى المحاولة مرة أخرى.' : 'Error saving workout session. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete historical workout session
  const handleDeleteWorkout = async (id: string) => {
    if (deletingWorkoutId !== id) {
      setDeletingWorkoutId(id);
      setTimeout(() => setDeletingWorkoutId(null), 4000);
      return;
    }
    try {
      await deleteWorkout(id);
      setDeletingWorkoutId(null);
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  };

  // Clone historical workout into active logger
  const handleLoadHistoricalWorkout = (session: WorkoutSession) => {
    setRoutineName(session.routineName);
    if (session.routineCategory) setRoutineCategory(session.routineCategory);
    setExercises(
      session.exercises.map((ex, idx) => ({
        ...ex,
        id: `ex-clone-${Date.now()}-${idx}`,
        executionCategory: ex.executionCategory || getExerciseBiomechanicalType(ex.name),
        completedAt: undefined,
        rpeFeedback: undefined,
        sets: (ex.sets || []).map((s, sIdx) => ({
          ...s,
          id: `s-clone-${Date.now()}-${idx}-${sIdx}`,
          completed: false,
          completedAt: undefined
        })),
        cardioData: ex.cardioData
          ? {
              speedUnit: ex.cardioData.speedUnit,
              completed: false,
              targetDurationMinutes: ex.cardioData.targetDurationMinutes ?? ex.cardioData.durationMinutes,
              targetSpeedRpm: ex.cardioData.targetSpeedRpm ?? ex.cardioData.speedRpm,
              targetInclineResistance: ex.cardioData.targetInclineResistance ?? ex.cardioData.inclineResistance,
              previousDurationMinutes: ex.cardioData.durationMinutes,
              previousSpeedRpm: ex.cardioData.speedRpm,
              previousInclineResistance: ex.cardioData.inclineResistance,
              previousHeartRateBpm: ex.cardioData.heartRateBpm
            }
          : undefined
      }))
    );
    setActiveTab('logger');
    setIsTimerRunning(false);
    setElapsedSeconds(0);
    setManualDurationMinutes(session.durationMinutes || 45);
    setIsSessionActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Progressive Overload & Analytics Calculations
  const allUniqueExercises = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach((w) => {
      w.exercises?.forEach((ex) => {
        if (ex.name) set.add(ex.name.trim());
      });
    });
    POPULAR_EXERCISES.forEach((p) => set.add(p));
    return Array.from(set).sort();
  }, [workouts]);

  const prAnalytics = useMemo(() => {
    let globalMaxWeight = 0;
    let globalPeak1RM = 0;
    let globalMaxWeightExercise = '';
    let globalMaxReps = 0;

    let selectedFilterPeakWeight = 0;
    let selectedFilterPeak1RM = 0;
    let selectedFilterTotalVolume = 0;
    let totalExerciseSessions = 0;
    let totalRepsInSelected = 0;
    let totalWorkingSets = 0;

    // Routine comparison accumulators
    let routineACount = 0;
    let routineAVolume = 0;
    let routineBCount = 0;
    let routineBVolume = 0;
    let routineCCount = 0;
    let routineCMins = 0;
    let routineCBpmSum = 0;
    let routineCBpmCount = 0;

    const now = new Date();
    const timeframeDays = selectedTimeframe === 'all' ? 99999 : parseInt(selectedTimeframe, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - timeframeDays);
    const cutoffISO = cutoffDate.toISOString().split('T')[0];

    const filteredWorkouts = workouts.filter((w) => {
      // 1. Timeframe filter
      if (selectedTimeframe !== 'all' && w.date < cutoffISO) return false;

      // 2. Routine filter (Routine A vs Routine B vs Routine C vs All)
      if (selectedRoutineFilter === 'Routine A') {
        const rName = (w.routineName || '').toLowerCase();
        if (!rName.includes('routine a') && !rName.includes('routine-a')) return false;
      } else if (selectedRoutineFilter === 'Routine B') {
        const rName = (w.routineName || '').toLowerCase();
        if (!rName.includes('routine b') && !rName.includes('routine-b')) return false;
      } else if (selectedRoutineFilter === 'Routine C') {
        const rName = (w.routineName || '').toLowerCase();
        if (!rName.includes('routine c') && !rName.includes('routine-c') && w.routineCategory !== 'Cardio & Conditioning') return false;
      }

      return true;
    });

    const executionOrderAlerts: {
      id?: string;
      date: string;
      routineName: string;
      analysis: ExecutionOrderAnalysis;
    }[] = [];

    // Gather statistics
    filteredWorkouts.forEach((w) => {
      const orderCheck = analyzeSessionExecutionOrder(w.exercises || []);
      if (orderCheck.hasAlert) {
        executionOrderAlerts.push({
          id: w.id,
          date: w.date,
          routineName: w.routineName,
          analysis: orderCheck
        });
      }

      const rName = (w.routineName || '').toLowerCase();
      const isRoutineA = rName.includes('routine a') || rName.includes('routine-a');
      const isRoutineB = rName.includes('routine b') || rName.includes('routine-b');
      const isRoutineC = rName.includes('routine c') || rName.includes('routine-c') || w.routineCategory === 'Cardio & Conditioning';

      if (isRoutineA) {
        routineACount++;
        routineAVolume += (w.totalVolume || 0);
      } else if (isRoutineB) {
        routineBCount++;
        routineBVolume += (w.totalVolume || 0);
      } else if (isRoutineC) {
        routineCCount++;
        const exCardioSum = (w.exercises || []).reduce((acc, ex) => {
          const d = ex.cardioData?.completed ? Number(ex.cardioData.durationMinutes) : 0;
          return acc + (Number.isFinite(d) && d > 0 ? d : 0);
        }, 0);
        // Strictly sum only entered cardio minutes; never fabricate from missing durations
        routineCMins += (w.totalCardioMinutes && w.totalCardioMinutes > 0 ? w.totalCardioMinutes : exCardioSum);

        (w.exercises || []).forEach((ex) => {
          const bpm = ex.cardioData?.completed ? Number(ex.cardioData.heartRateBpm) : 0;
          if (Number.isFinite(bpm) && bpm > 0) {
            routineCBpmSum += bpm;
            routineCBpmCount++;
          }
        });
      }

      let sessionHadMatch = false;

      w.exercises?.forEach((ex) => {
        const exName = ex.name.trim();
        const isMatch = selectedExerciseFilter === 'All' || normalizeExerciseLookupKey(exName) === normalizeExerciseLookupKey(selectedExerciseFilter);

        if (isMatch && ex.cardioData?.completed) {
          sessionHadMatch = true;
        }

        ex.sets?.forEach((s) => {
          const reps = Number(s.reps) || 0;
          let weightVal = 0;
          if (typeof s.weight === 'number') weightVal = s.weight;
          else if (typeof s.weight === 'string') {
            const parsed = parseFloat(s.weight.replace(/[^0-9.]/g, ''));
            if (!isNaN(parsed)) weightVal = parsed;
          }

          // Epley 1RM Formula
          const est1RM = weightVal > 0 ? Math.round(weightVal * (1 + (Math.min(12, reps) / 30))) : weightVal;

          if (weightVal > globalMaxWeight) {
            globalMaxWeight = weightVal;
            globalMaxWeightExercise = exName;
          }
          if (est1RM > globalPeak1RM) {
            globalPeak1RM = est1RM;
          }
          if (reps > globalMaxReps) {
            globalMaxReps = reps;
          }

          if (isMatch && (reps > 0 || weightVal > 0)) {
            sessionHadMatch = true;
            totalWorkingSets++;
            totalRepsInSelected += reps;
            selectedFilterTotalVolume += (reps * (weightVal > 0 ? weightVal : 1));

            if (weightVal > selectedFilterPeakWeight) selectedFilterPeakWeight = weightVal;
            if (est1RM > selectedFilterPeak1RM) selectedFilterPeak1RM = est1RM;
          }
        });
      });

      if (sessionHadMatch) {
        totalExerciseSessions++;
      }
    });

    const avgWeightPerSet = totalWorkingSets > 0 
      ? Math.round(selectedFilterTotalVolume / Math.max(1, totalRepsInSelected))
      : 0;
    const routineCAvgBpm = routineCBpmCount > 0 ? Math.round(routineCBpmSum / routineCBpmCount) : null;

    return {
      globalMaxWeight,
      globalPeak1RM,
      globalMaxWeightExercise,
      globalMaxReps,
      selectedFilterPeakWeight,
      selectedFilterPeak1RM,
      selectedFilterTotalVolume,
      totalExerciseSessions,
      totalRepsInSelected,
      totalWorkingSets,
      avgWeightPerSet,
      routineAStats: { count: routineACount, volume: routineAVolume },
      routineBStats: { count: routineBCount, volume: routineBVolume },
      routineCStats: { count: routineCCount, totalMinutes: routineCMins, avgHeartRateBpm: routineCAvgBpm },
      executionOrderAlerts,
      filteredWorkouts,
    };
  }, [workouts, selectedExerciseFilter, selectedRoutineFilter, selectedTimeframe]);

  const isCardioChartMode = useMemo(() => {
    return (
      selectedRoutineFilter === 'Routine C' ||
      (selectedExerciseFilter !== 'All' && isCardioExercise(selectedExerciseFilter))
    );
  }, [selectedRoutineFilter, selectedExerciseFilter]);

  const chartData = useMemo(() => {
    const rawMap: Record<string, { 
      date: string; 
      rawDate: string;
      maxWeight: number; 
      est1RM: number; 
      volume: number; 
      maxReps: number; 
      totalReps: number; 
      cardioMinutes: number | null;
      cardioSpeed: number | null;
      heartRateBpm: number | null;
      routine: string;
      isPR?: boolean;
    }> = {};

    const sorted = [...prAnalytics.filteredWorkouts].sort((a, b) => a.date.localeCompare(b.date));

    let rollingPeakWeight = 0;

    sorted.forEach((w) => {
      let sessionMaxWeight = 0;
      let sessionPeak1RM = 0;
      let sessionMaxReps = 0;
      let sessionTotalReps = 0;
      let sessionCalculatedVolume = 0;
      let sessionCardioMinutes = 0;
      let hasCardioMinutes = false;
      let sessionCardioSpeedSum = 0;
      let sessionCardioSpeedCount = 0;
      let sessionBpmSum = 0;
      let sessionBpmCount = 0;
      let matchedCompletedCardio = false;

      w.exercises?.forEach((ex) => {
        const isMatch =
          selectedExerciseFilter === 'All' ||
          normalizeExerciseLookupKey(ex.name) === normalizeExerciseLookupKey(selectedExerciseFilter);
        if (isMatch) {
          if (ex.cardioData?.completed) {
            matchedCompletedCardio = true;
            const dur = Number(ex.cardioData.durationMinutes);
            if (Number.isFinite(dur) && dur > 0) {
              sessionCardioMinutes += dur;
              hasCardioMinutes = true;
            }
            const spd = Number(ex.cardioData.speedRpm);
            if (Number.isFinite(spd) && spd > 0) {
              sessionCardioSpeedSum += spd;
              sessionCardioSpeedCount++;
            }
            const bpm = Number(ex.cardioData.heartRateBpm);
            if (Number.isFinite(bpm) && bpm > 0) {
              sessionBpmSum += bpm;
              sessionBpmCount++;
            }
          }
          ex.sets?.forEach((s) => {
            const reps = Number(s.reps) || 0;
            let weightVal = 0;
            if (typeof s.weight === 'number') weightVal = s.weight;
            else if (typeof s.weight === 'string') {
              const parsed = parseFloat(s.weight.replace(/[^0-9.]/g, ''));
              if (!isNaN(parsed)) weightVal = parsed;
            }

            if (weightVal > sessionMaxWeight) sessionMaxWeight = weightVal;
            if (reps > sessionMaxReps) sessionMaxReps = reps;

            const est1RM = weightVal > 0 ? Math.round(weightVal * (1 + (Math.min(12, reps) / 30))) : weightVal;
            if (est1RM > sessionPeak1RM) sessionPeak1RM = est1RM;

            sessionTotalReps += reps;
            sessionCalculatedVolume += reps * (weightVal > 0 ? weightVal : 1);
          });
        }
      });

      if (
        selectedExerciseFilter === 'All' ||
        sessionTotalReps > 0 ||
        sessionMaxWeight > 0 ||
        matchedCompletedCardio
      ) {
        const parts = w.date.split('-');
        const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const shortDate = dObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });

        const isPR = sessionMaxWeight > rollingPeakWeight && rollingPeakWeight > 0;
        if (sessionMaxWeight > rollingPeakWeight) rollingPeakWeight = sessionMaxWeight;

        const finalCardioMins = hasCardioMinutes
          ? sessionCardioMinutes
          : (selectedExerciseFilter === 'All' && w.totalCardioMinutes && w.totalCardioMinutes > 0 ? w.totalCardioMinutes : null);
        const finalCardioSpeed = sessionCardioSpeedCount > 0
          ? Number((sessionCardioSpeedSum / sessionCardioSpeedCount).toFixed(1))
          : null;
        const finalHeartRateBpm = sessionBpmCount > 0
          ? Math.round(sessionBpmSum / sessionBpmCount)
          : (selectedExerciseFilter === 'All' && w.avgHeartRateBpm && w.avgHeartRateBpm > 0 ? w.avgHeartRateBpm : null);

        rawMap[w.date] = {
          date: shortDate,
          rawDate: w.date,
          maxWeight: sessionMaxWeight,
          est1RM: sessionPeak1RM || sessionMaxWeight,
          volume: selectedExerciseFilter === 'All' ? (w.totalVolume || sessionCalculatedVolume) : Math.round(sessionCalculatedVolume),
          maxReps: sessionMaxReps,
          totalReps: sessionTotalReps > 0 ? sessionTotalReps : (w.totalReps || 0),
          cardioMinutes: finalCardioMins,
          cardioSpeed: finalCardioSpeed,
          heartRateBpm: finalHeartRateBpm,
          routine: w.routineName,
          isPR
        };
      }
    });

    return Object.values(rawMap);
  }, [prAnalytics.filteredWorkouts, selectedExerciseFilter, isAr]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32 transition-colors">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & SUB-NAVIGATION BAR                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Dumbbell size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'محرك التدريب (The Iron Engine)' : 'The Iron Engine'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'التدريب التدريجي (Double Progression)، جدول الأسبوع، وحساب وجبات التغذية والماكروز'
                : 'Mobile-first progressive overload workout logger, weekly schedule board & nutrition engine.'}
            </p>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-neutral-900/90 rounded-2xl border border-slate-200 dark:border-neutral-800">
          <button
            id="tab-btn-logger"
            onClick={() => setActiveTab('logger')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logger'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListOrdered size={14} />
            <span>{isAr ? 'التمارين والروتينات' : 'Workout Routines'}</span>
          </button>

          <button
            id="tab-btn-schedule"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays size={14} />
            <span>{isAr ? 'جدول الأسبوع' : 'Schedule Planner'}</span>
          </button>

          <button
            id="tab-btn-nutrition"
            onClick={() => setActiveTab('nutrition')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'nutrition'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scale size={14} />
            <span>{isAr ? 'الوزن والماكروز' : 'Body & Nutrition'}</span>
          </button>

          <button
            id="tab-btn-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>{isAr ? 'التحليلات والأرقام' : 'Overload & PRs'}</span>
          </button>

          <button
            id="tab-btn-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History size={14} />
            <span>{isAr ? 'السجل' : 'Chronicles'}</span>
            {workouts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-neutral-800 text-[10px] font-mono">
                {workouts.length}
              </span>
            )}
          </button>

          {/* Page View Customization Button */}
          <button
            type="button"
            onClick={() => setShowViewSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent hover:border-slate-200 dark:hover:border-neutral-700"
            title={isAr ? 'تخصيص وإخفاء أقسام الصفحة' : 'Customize view sections'}
          >
            <Sliders size={13} className="text-slate-400" />
            <span className="hidden sm:inline">{isAr ? 'تخصيص العرض' : 'View Settings'}</span>
          </button>
        </div>
      </div>

      {/* Save Success Alert Notification */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-xs text-emerald-700 dark:text-emerald-400 underline font-semibold cursor-pointer shrink-0"
          >
            {isAr ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: WORKOUT ROUTINES / ACTIVE LOGGER                                    */}
      {/* ========================================================================= */}
      {activeTab === 'logger' && !isSessionActive && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Hero Bar: Routine Launcher with Secondary Custom Option */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} />
                {isAr ? 'الروتينات الأساسية المعتمدة' : 'Primary Full-Body Routines'}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isAr ? 'اختر روتين اليوم لبدء التمرين' : 'Select Your Training Routine for Today'}
              </h2>
            </div>

            {/* Routine Launcher Controls with Targets Toggle & Secondary Custom Option */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTargetsAndHistory(!showTargetsAndHistory)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                  showTargetsAndHistory
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-neutral-700'
                }`}
              >
                {showTargetsAndHistory ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>
                  {showTargetsAndHistory 
                    ? (isAr ? 'إخفاء الأهداف والماضي' : 'Hide Targets & History') 
                    : (isAr ? 'إظهار الأهداف والماضي' : 'Show Targets & History')}
                </span>
              </button>

              <button
                type="button"
                onClick={handleStartCustomWorkout}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-neutral-700 shrink-0"
              >
                <Plus size={14} />
                <span>{isAr ? 'جلسة مخصصة فارغة' : 'Start Custom Empty Session'}</span>
              </button>
            </div>
          </div>

          {/* PRIMARY HERO CARDS: Routine A, Routine B & Routine C (Cardio & Conditioning) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {ROUTINE_TEMPLATES.slice(0, 3).map((routine, idx) => {
              const isRoutineA = idx === 0;
              const isRoutineC = routine.id === 'routine-c-cardio';
              const selectedCardioCount = isRoutineC
                ? routine.exercises.filter((ex) => selectedRoutineCExercises.includes(ex.name)).length
                : routine.exercises.length;

              return (
                <div
                  key={routine.id}
                  className={`p-6 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between group ${
                    isRoutineA
                      ? 'bg-gradient-to-br from-emerald-500/10 via-slate-900/5 to-transparent dark:from-emerald-950/40 dark:via-[#18191D] dark:to-[#121316] border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                      : isRoutineC
                      ? 'bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-transparent dark:from-amber-950/35 dark:via-[#18191D] dark:to-[#121316] border-amber-500/30 shadow-lg shadow-amber-500/5 md:col-span-2 xl:col-span-1'
                      : 'bg-gradient-to-br from-teal-500/10 via-slate-900/5 to-transparent dark:from-teal-950/40 dark:via-[#18191D] dark:to-[#121316] border-teal-500/30 shadow-lg shadow-teal-500/5'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                        isRoutineA
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : isRoutineC
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                      }`}>
                        {routine.name}
                      </span>
                      <span className="text-xs font-mono tabular-nums font-bold text-slate-400">
                        {isRoutineC
                          ? `${selectedCardioCount}/${routine.exercises.length} ${isAr ? 'مختارة' : 'selected'}`
                          : `${routine.exercises.length} ${isAr ? 'تمارين مستهدفة' : 'exercises'}`}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className={`text-xl font-black text-slate-900 dark:text-white transition-colors ${
                        isRoutineC
                          ? 'group-hover:text-amber-500 dark:group-hover:text-amber-400'
                          : 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                      }`}>
                        {routine.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {routine.description}
                      </p>
                      {isRoutineC && (
                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          {isAr
                            ? 'روتين مرن: اختر الأجهزة المتاحة لك اليوم (15 إلى 30 دقيقة، +2 د للتحمل / +1 مستوى عند الإتقان مرتين)'
                            : 'Flexible options: toggle available gear for today (15–30 min progressive endurance)'}
                        </p>
                      )}
                    </div>

                    {/* Exercise List preview with Prev & Next Targets */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-neutral-800/80">
                      {routine.exercises.map((ex, exI) => {
                        if (isRoutineC || ex.isCardio) {
                          const isSelected = selectedRoutineCExercises.includes(ex.name);
                          const cardioRx = getCardioOverloadPrescription(ex.name, workouts, {
                            durationMinutes: ex.defaultDuration,
                            speedRpm: ex.defaultSpeed,
                            speedUnit: ex.speedUnit,
                            inclineResistance: ex.defaultIncline
                          });
                          const unitLabel =
                            cardioRx.speedUnit === 'km/h'
                              ? 'km/h'
                              : cardioRx.speedUnit === 'rpm'
                              ? 'RPM'
                              : cardioRx.speedUnit === 'spm'
                              ? 'SPM'
                              : 'Lv';

                          return (
                            <div
                              key={ex.name}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 px-3 rounded-xl border gap-1.5 transition-opacity ${
                                isSelected
                                  ? 'bg-white/80 dark:bg-neutral-900/70 border-slate-200/60 dark:border-neutral-800'
                                  : 'bg-white/30 dark:bg-neutral-900/30 border-slate-200/30 dark:border-neutral-800/40 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoutineCOption(ex.name)}
                                  aria-label={`Toggle ${ex.name}`}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-amber-500 border-amber-500 text-white'
                                      : 'bg-white dark:bg-neutral-800 border-slate-300 dark:border-neutral-700 text-transparent'
                                  }`}
                                >
                                  <Check size={12} className="stroke-[3]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewModalData({
                                      name: ex.name,
                                      targetReps: cardioRx.suggestedDurationMinutes
                                    })
                                  }
                                  className="font-bold text-slate-800 dark:text-slate-200 hover:text-amber-500 transition-colors text-left rtl:text-right cursor-pointer flex items-center gap-1.5 min-w-0"
                                  title={isAr ? 'معاينة التمرين وقواعد الكارديو' : 'View cardio exercise details'}
                                >
                                  <span className="truncate">
                                    {exI + 1}. {ex.name}
                                  </span>
                                  {ex.subtitle && (
                                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                      ({ex.subtitle})
                                    </span>
                                  )}
                                  <Eye size={12} className="text-slate-400 opacity-60 hover:opacity-100 shrink-0" />
                                </button>
                              </div>

                              {showTargetsAndHistory ? (
                                <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] shrink-0">
                                  {cardioRx.lastDurationMinutes !== null ? (
                                    <span
                                      className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md"
                                      title={isAr ? cardioRx.lastSummaryAr : cardioRx.lastSummaryEn}
                                    >
                                      {cardioRx.lastDurationMinutes}m @ {cardioRx.lastSpeedRpm}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-[10px] font-sans">
                                      {isAr ? 'بداية' : 'Start'}
                                    </span>
                                  )}

                                  <span className="text-slate-300 dark:text-neutral-600">➔</span>

                                  <span className="text-amber-600 dark:text-amber-400 font-black bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                    {cardioRx.suggestedDurationMinutes}m @ {cardioRx.suggestedSpeedRpm} {unitLabel}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono tabular-nums text-[11px] text-amber-600 dark:text-amber-400 font-black shrink-0">
                                  {ex.defaultDuration ?? 15}m • {ex.defaultSpeed ?? 1} {unitLabel}
                                </span>
                              )}
                            </div>
                          );
                        }

                        const prescription = getCoachPrescriptionForExercise(
                          ex.name,
                          ex.targetSets,
                          ex.targetReps,
                          ex.defaultWeight,
                          workouts
                        );

                        return (
                          <div
                            key={ex.name}
                            className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 px-3 rounded-xl bg-white/70 dark:bg-neutral-900/60 border border-slate-200/50 dark:border-neutral-800 gap-1.5"
                          >
                            <button
                              type="button"
                              onClick={() => setPreviewModalData({
                                name: ex.name,
                                targetWeightKg: prescription.suggestedWeight,
                                previousWeightKg: prescription.lastWeight > 0 ? prescription.lastWeight : undefined,
                                previousRepsSummary: prescription.lastRepsSummary,
                                targetReps: prescription.suggestedReps
                              })}
                              className="font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-500 transition-colors text-left rtl:text-right cursor-pointer flex items-center gap-1.5"
                              title={isAr ? 'عرض حاسبة الأوزان وتفاصيل التكرار' : 'View per-rep load breakdown'}
                            >
                              <span>{exI + 1}. {ex.name}</span>
                              <Eye size={12} className="text-slate-400 opacity-60 hover:opacity-100" />
                            </button>

                            {showTargetsAndHistory ? (
                              <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] shrink-0">
                                {prescription.lastWeight > 0 ? (
                                  <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md" title={prescription.lastRepsSummary}>
                                    <span className="text-[10px] font-sans font-bold text-slate-400 mr-1">{isAr ? 'السابق:' : 'Prev:'}</span>
                                    {prescription.lastWeight}kg
                                  </span>
                                ) : (
                                  <span className="text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-[10px]">
                                    {isAr ? 'بداية جديدة' : 'Baseline'}
                                  </span>
                                )}

                                <span className="text-slate-300 dark:text-neutral-600">➔</span>

                                <span className="text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  <span className="text-[10px] font-sans font-bold text-emerald-600 dark:text-emerald-400 mr-1">{isAr ? 'الهدف:' : 'Next:'}</span>
                                  {prescription.suggestedWeight}kg × {prescription.suggestedReps}
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono tabular-nums text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                                {ex.targetSets}x{ex.targetReps} • {ex.defaultWeight}kg
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 pt-4">
                    <button
                      type="button"
                      disabled={isRoutineC && selectedCardioCount === 0}
                      onClick={() => handleLoadPreset(routine)}
                      className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                        isRoutineA
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                          : isRoutineC
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25'
                          : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/25'
                      }`}
                    >
                      <Play size={16} className="fill-current stroke-[2.5]" />
                      <span>
                        {isRoutineC
                          ? (isAr ? `بدء الكارديو (${selectedCardioCount})` : `Start Routine C (${selectedCardioCount})`)
                          : (isAr ? `بدء تمرين ${routine.name}` : `Start ${routine.name}`)}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linked Habit Quick Selector / Status (Gym + Cardio) */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Flame size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'العادات المرتبطة بالتمارين والكارديو' : 'Linked Gym & Cardio Habits'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr 
                    ? 'يتم وضع علامة إنجاز أوتوماتيكياً على هذه العادات فور إنهاء أي تمرين بنجاح.' 
                    : 'Automatically checked off in Habit Tracker when a workout is finished.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'الحديد:' : 'Gym:'}
                </span>
                <select
                  aria-label="Linked Gym Habit"
                  value={linkedHabitId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    setLinkedHabitId(id || null);
                    if (id) {
                      localStorage.setItem('iron_engine_gym_habit', id);
                    } else {
                      localStorage.removeItem('iron_engine_gym_habit');
                    }
                  }}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="">{isAr ? 'غير مرتبط' : 'None'}</option>
                  {habits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.icon || '🏋️'} {h.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'الكارديو:' : 'Cardio:'}
                </span>
                <select
                  aria-label="Linked Cardio Habit"
                  value={linkedCardioHabitId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    setLinkedCardioHabitId(id || null);
                    if (id) {
                      localStorage.setItem('iron_engine_cardio_habit', id);
                    } else {
                      localStorage.removeItem('iron_engine_cardio_habit');
                    }
                  }}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="">{isAr ? 'غير مرتبط' : 'None'}</option>
                  {habits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.icon || '🏃'} {h.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Secondary Calisthenics & Other Presets */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 px-1">
              <Layers size={16} className="text-emerald-500" />
              <span>{isAr ? 'روتينات إضافية (كاليسثينكس وقوة عضلية)' : 'Additional Specialist Routines'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ROUTINE_TEMPLATES.slice(3).map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300">
                        {tmpl.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {tmpl.exercises.length} ex
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {tmpl.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadPreset(tmpl)}
                    className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-neutral-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play size={12} className="fill-current" />
                    <span>{isAr ? 'بدء هذا الروتين' : 'Start Routine'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTIVE WORKOUT VIEW (THE HEVY/STRONG MOBILE-FIRST INTERACTIVE EXPERIENCE) */}
      {/* ========================================================================= */}
      {activeTab === 'logger' && isSessionActive && (
        <div className="animate-fadeIn space-y-4">
          
          {/* Top Sticky Header Bar: Mobile-Optimized with Exit, Timer, and Finish */}
          <div className="bg-white dark:bg-[#18191D] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-2 z-20">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRequestCancelWorkout}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-neutral-800 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/60 dark:border-neutral-700 shrink-0"
              >
                <ChevronLeft size={16} />
                <span>{isAr ? 'رجوع / تغيير' : 'Back / Change'}</span>
              </button>

              <div className="truncate flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                  {isAr ? 'جلسة جارية' : 'ACTIVE SESSION'}
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                  {routineName}
                </h2>
              </div>
            </div>

            {/* Quick Duration / Stopwatch Toggle & Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Live Stopwatch Pill (Manual start/stop) */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700">
                <Timer size={14} className={isTimerRunning ? 'text-emerald-500 animate-pulse' : 'text-slate-400'} />
                <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                  {elapsedSeconds > 0 ? formatTime(elapsedSeconds) : `${manualDurationMinutes}m`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isTimerRunning
                      ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                  title={isTimerRunning ? 'Pause live timer' : 'Start live timer'}
                >
                  {isTimerRunning ? <Pause size={12} className="stroke-[3]" /> : <Play size={12} className="stroke-[3] fill-current" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleRequestCancelWorkout}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-xs transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleSaveWorkout}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/30"
              >
                <CheckCircle2 size={16} />
                <span>{isAr ? 'إنهاء وحفظ' : 'Finish'}</span>
              </button>
            </div>
          </div>

          {/* Two-Column Grid: Configuration on Left, Exercise Sets on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Duration Adjuster & Session Notes */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              
              {/* Retrospective Logging Duration Selector */}
              <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-500" />
                    {isAr ? 'مدة التمرين (تسجيل منزلي / مباشر)' : 'Workout Duration'}
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {elapsedSeconds >= 60 ? `${Math.round(elapsedSeconds / 60)} min (live)` : `${manualDurationMinutes} min`}
                  </span>
                </div>

                {/* Quick Presets for Retrospective Entry */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[30, 45, 60, 75].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setManualDurationMinutes(m);
                        setElapsedSeconds(0);
                        setIsTimerRunning(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        manualDurationMinutes === m && elapsedSeconds < 60
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex items-center gap-2">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    {isAr ? 'تخصيص الدقائق:' : 'Custom min:'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={manualDurationMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setManualDurationMinutes(val);
                    }}
                    className="w-20 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-400 font-bold">{isAr ? 'دقيقة' : 'mins'}</span>
                </div>
              </div>

              {/* Inter-Set Rest Countdown */}
              {restSecondsRemaining !== null && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer size={16} className="animate-pulse text-emerald-300" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
                        {isAr ? 'مؤقت الاستراحة بين المجموعات' : 'REST INTERVAL'}
                      </span>
                    </div>
                    <span className="text-xl font-black font-mono bg-black/15 px-2.5 py-0.5 rounded-lg">
                      {formatTime(restSecondsRemaining)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRestSecondsRemaining((prev) => (prev ? prev + 30 : 30))}
                      className="flex-1 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-[11px] font-bold cursor-pointer transition-colors text-center"
                    >
                      +30s
                    </button>
                    <button
                      type="button"
                      onClick={cancelRestTimer}
                      className="flex-1 py-1.5 rounded-xl bg-black/20 hover:bg-black/35 text-[11px] font-bold cursor-pointer transition-colors text-center"
                    >
                      {isAr ? 'تخطي الاستراحة' : 'Skip Rest'}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes Card */}
              <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  {isAr ? 'ملاحظات التمرين' : 'Workout Notes'}
                </label>
                <textarea
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  placeholder={isAr ? 'ملاحظات عن الأوزان، الطاقة، أو التكنيك...' : 'Energy levels, RPE, form cues...'}
                  rows={2}
                  className="w-full text-xs px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Right Column: Interactive Exercise Cards with Sets & Reps Inputs */}
            <div className="lg:col-span-8 space-y-5">
              
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-emerald-500" />
                  {isAr ? 'التمارين والمجموعات' : 'Exercises & Sets'}
                </h3>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTargetsAndHistory(!showTargetsAndHistory)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      showTargetsAndHistory
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-neutral-700'
                    }`}
                  >
                    {showTargetsAndHistory ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>
                      {showTargetsAndHistory 
                        ? (isAr ? 'إخفاء الأهداف والماضي' : 'Hide Targets & History') 
                        : (isAr ? 'إظهار الأهداف والماضي' : 'Show Targets & History')}
                    </span>
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    {exercises.length} {isAr ? 'تمارين' : 'movements'}
                  </span>
                </div>
              </div>

              {exercises.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-3xl bg-slate-50/50 dark:bg-neutral-900/10 space-y-2">
                  <Plus size={32} className="mx-auto text-slate-300 dark:text-neutral-700 animate-pulse" />
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                    {isAr ? 'لا توجد تمارين مضافة' : 'No exercises added yet'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'أضف تمريناً من المكتبة أدناه' : 'Add exercises from the library below.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-neutral-900/70 border border-slate-200/70 dark:border-neutral-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <GripVertical size={14} className="text-emerald-500 shrink-0" />
                      <span>
                        {isAr
                          ? 'اسحب التمارين أو استخدم الأسهم لتغيير الترتيب حسب الأجهزة المتاحة. يتم تسجيل وقت الإنجاز تلقائياً.'
                          : 'Drag & drop or use arrows to reorder anytime based on gym equipment. Completion order is timestamped.'}
                      </span>
                    </span>
                  </div>

                  {exercises.map((exercise, exIdx) => {
                    const isCardio =
                      exercise.exerciseType === 'cardio' ||
                      !!exercise.cardioData ||
                      isCardioExercise(exercise.name);

                    const bioType = exercise.executionCategory || getExerciseBiomechanicalType(exercise.name);
                    const completedOrderList = exercises
                      .filter((item) => !!item.completedAt)
                      .sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));
                    const completedRank = exercise.completedAt
                      ? completedOrderList.findIndex((item) => item.id === exercise.id) + 1
                      : 0;

                    const spec = isCardio ? getExerciseSpec(exercise.name) : null;
                    const cardioRx = isCardio
                      ? getCardioOverloadPrescription(
                          exercise.name,
                          workouts,
                          exercise.cardioData
                            ? {
                                durationMinutes: exercise.cardioData.targetDurationMinutes ?? spec?.defaultDurationMinutes,
                                speedRpm: exercise.cardioData.targetSpeedRpm ?? spec?.defaultSpeedRpm,
                                speedUnit: exercise.cardioData.speedUnit ?? spec?.speedUnit,
                                inclineResistance: exercise.cardioData.targetInclineResistance ?? spec?.defaultInclineResistance
                              }
                            : undefined
                        )
                      : null;

                    const cd: CardioExerciseData = exercise.cardioData || {
                      speedUnit: cardioRx?.speedUnit ?? spec?.speedUnit ?? 'level',
                      completed: false
                    };
                    const unitLabel = cd.speedUnit === 'km/h' ? 'km/h' : cd.speedUnit === 'rpm' ? 'RPM' : cd.speedUnit === 'spm' ? 'SPM' : 'Lv';
                    const inclineLabel = spec
                      ? (isAr ? spec.inclineLabelAr : spec.inclineLabelEn) || (isAr ? 'الميلان / المقاومة (اختياري)' : 'Incline / Resistance (Optional)')
                      : isAr
                      ? 'الميلان / المقاومة (اختياري)'
                      : 'Incline / Resistance (Optional)';

                    const isCollapsed = !!collapsedExercises[exercise.id];
                    const completedSetsCount = isCardio
                      ? cd.completed
                        ? 1
                        : 0
                      : exercise.sets.filter((s) => s.completed).length;
                    const totalSetsCount = isCardio ? 1 : exercise.sets.length;
                    const isAllCompleted = completedSetsCount === totalSetsCount && totalSetsCount > 0;

                    // Scientific Progressive Overload Coach prescription (Strength)
                    const targetSetsCount = exercise.sets.length || 3;
                    const targetRepsCount = exercise.sets[0]?.reps || 10;
                    const defaultWeight = exercise.previousWeight || (exercise.sets[0]?.weight ? exercise.sets[0].weight.toString() : '7.5');
                    const prescription = !isCardio
                      ? getCoachPrescriptionForExercise(
                          exercise.name,
                          targetSetsCount,
                          targetRepsCount,
                          defaultWeight,
                          workouts
                        )
                      : null;

                    const isDraggingThis = draggedExIdx === exIdx;
                    const isDropTargetThis = dragOverExIdx === exIdx && draggedExIdx !== exIdx;

                    return (
                      <div
                        key={exercise.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedExIdx(exIdx);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(exIdx));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverExIdx !== exIdx) setDragOverExIdx(exIdx);
                        }}
                        onDragLeave={() => {
                          if (dragOverExIdx === exIdx) setDragOverExIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = draggedExIdx !== null ? draggedExIdx : parseInt(e.dataTransfer.getData('text/plain'), 10);
                          if (!isNaN(from)) {
                            handleMoveExercise(from, exIdx);
                          }
                          setDraggedExIdx(null);
                          setDragOverExIdx(null);
                        }}
                        onDragEnd={() => {
                          setDraggedExIdx(null);
                          setDragOverExIdx(null);
                        }}
                        className={`bg-white dark:bg-[#18191D] rounded-3xl border shadow-xs transition-all ${
                          isDraggingThis
                            ? 'opacity-60 scale-[0.99] border-emerald-500'
                            : isDropTargetThis
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                            : isCardio && cd.completed
                            ? 'border-emerald-500/40 dark:border-emerald-700/50'
                            : 'border-slate-200/80 dark:border-neutral-800'
                        } ${isCollapsed ? 'p-4' : 'p-5 sm:p-6 space-y-4'}`}
                      >
                        {/* Collapsed View */}
                        {isCollapsed ? (
                          <div className="flex items-center justify-between gap-3 animate-fadeIn">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <span
                                className="p-1 text-slate-400 hover:text-emerald-500 cursor-grab active:cursor-grabbing shrink-0"
                                title={isAr ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
                              >
                                <GripVertical size={16} />
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleCollapse(exercise.id)}
                                className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 cursor-pointer ${
                                  isAllCompleted 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-neutral-800'
                                }`}
                              >
                                {isAllCompleted ? '✓' : `#${exIdx + 1}`}
                              </button>
                              <div className="truncate">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                                  {exercise.name}
                                  {exercise.subtitle && (
                                    <span className="text-xs font-semibold text-slate-400 ml-1.5">
                                      ({exercise.subtitle})
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400 font-mono tabular-nums">
                                  {isCardio
                                    ? [
                                        cd.durationMinutes && cd.durationMinutes > 0 ? `${cd.durationMinutes} mins` : null,
                                        cd.speedRpm && cd.speedRpm > 0 ? `${cd.speedRpm} ${unitLabel}` : null,
                                        cd.heartRateBpm && cd.heartRateBpm > 0 ? `♥ ${cd.heartRateBpm} bpm` : null,
                                        cd.inclineResistance && cd.inclineResistance > 0 ? `Inc ${cd.inclineResistance}` : null,
                                        cd.completed ? '✓ Done' : (isAr ? 'غير محدد بعد' : 'Unchecked')
                                      ]
                                        .filter(Boolean)
                                        .join(' · ')
                                    : `${completedSetsCount}/${totalSetsCount} ${isAr ? 'مجموعات منجزة' : 'sets completed'}`}
                                  {exercise.completedAt && completedRank > 0
                                    ? ` · #${completedRank} ${new Date(exercise.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveExercise(exIdx, exIdx - 1)}
                                disabled={exIdx === 0}
                                className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
                                title={isAr ? 'نقل للأعلى' : 'Move up'}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveExercise(exIdx, exIdx + 1)}
                                disabled={exIdx === exercises.length - 1}
                                className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 cursor-pointer"
                                title={isAr ? 'نقل للأسفل' : 'Move down'}
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCollapse(exercise.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-900 text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                              >
                                {isAr ? 'توسيع' : 'Expand'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(exercise.id)}
                                className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Expanded Exercise Card */
                          <div className="animate-fadeIn space-y-4">
                            {/* Exercise Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800/80">
                              <div className="flex items-center gap-2.5 sm:gap-3">
                                <span
                                  className="p-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 text-slate-400 hover:text-emerald-500 cursor-grab active:cursor-grabbing shrink-0"
                                  title={isAr ? 'اسحب لتغيير ترتيب التمرين' : 'Drag & drop to reorder exercise'}
                                >
                                  <GripVertical size={16} />
                                </span>

                                {/* Interactive Exercise Image Thumbnail */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewModalData(
                                      isCardio
                                        ? {
                                            name: exercise.name,
                                            targetReps: cd.durationMinutes
                                          }
                                        : {
                                            name: exercise.name,
                                            targetWeightKg: exercise.targetWeight ?? (parseFloat(exercise.sets[0]?.weight) || 20),
                                            previousWeightKg: exercise.previousWeight,
                                            previousRepsSummary: exercise.previousPerformanceSummary,
                                            targetReps: exercise.targetReps ?? (parseInt(String(exercise.sets[0]?.reps || 10), 10) || 10)
                                          }
                                    )
                                  }
                                  className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center relative group cursor-pointer hover:border-emerald-500 transition-all shadow-2xs"
                                  title={isAr ? 'انقر لمعاينة حركة التمرين والتفاصيل' : 'Click to preview exercise details'}
                                >
                                  <img
                                    src={getExerciseImagePath(exercise.name)}
                                    alt={exercise.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                      const parent = (e.target as HTMLElement).parentElement;
                                      if (parent) {
                                        const fallback = parent.querySelector('.active-ex-fallback');
                                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                      }
                                    }}
                                  />
                                  <div className="active-ex-fallback hidden w-full h-full flex items-center justify-center text-base">
                                    {getExerciseMeta(exercise.name).icon}
                                  </div>
                                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                    <Eye size={16} />
                                  </div>
                                </button>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-mono font-black text-slate-400">#{exIdx + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewModalData(
                                          isCardio
                                            ? {
                                                name: exercise.name,
                                                targetReps: cd.durationMinutes
                                              }
                                            : {
                                                name: exercise.name,
                                                targetWeightKg: exercise.targetWeight ?? (parseFloat(exercise.sets[0]?.weight) || 20),
                                                previousWeightKg: exercise.previousWeight,
                                                previousRepsSummary: exercise.previousPerformanceSummary,
                                                targetReps: exercise.targetReps ?? (parseInt(String(exercise.sets[0]?.reps || 10), 10) || 10)
                                              }
                                        )
                                      }
                                      className="text-base font-black text-slate-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left rtl:text-right"
                                    >
                                      <span>{exercise.name}</span>
                                      {exercise.subtitle && (
                                        <span className="text-xs font-semibold text-slate-400">
                                          ({exercise.subtitle})
                                        </span>
                                      )}
                                      <Eye size={15} className="text-slate-400 hover:text-emerald-500" />
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] font-bold">
                                    {exercise.isAutoFilled && (
                                      <span className={`px-2 py-0.5 rounded-md border ${
                                        isCardio
                                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                      }`}>
                                        {isCardio
                                          ? (isAr ? 'كارديو • تحمّل تدريجي' : 'Cardio • Conditioning Overload')
                                          : (isAr ? 'الأهداف مجهزة مسبقاً' : 'Prescribed Targets Preloaded')}
                                      </span>
                                    )}
                                    {!isCardio && (
                                      <span className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {bioType === 'compound'
                                          ? (isAr ? '• مركّب (Compound)' : '• Compound')
                                          : (isAr ? '• عزل (Isolation)' : '• Isolation')}
                                      </span>
                                    )}
                                    {exercise.completedAt && completedRank > 0 && (
                                      <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                                        ✓ #{completedRank} {isAr ? 'منجز' : 'Done'} · {new Date(exercise.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleMoveExercise(exIdx, exIdx - 1)}
                                  disabled={exIdx === 0}
                                  className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors cursor-pointer flex items-center justify-center"
                                  title={isAr ? 'نقل للأعلى' : 'Move up'}
                                >
                                  <ArrowUp size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveExercise(exIdx, exIdx + 1)}
                                  disabled={exIdx === exercises.length - 1}
                                  className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors cursor-pointer flex items-center justify-center"
                                  title={isAr ? 'نقل للأسفل' : 'Move down'}
                                >
                                  <ArrowDown size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCollapse(exercise.id)}
                                  className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center"
                                  title={isAr ? 'طي التمرين' : 'Collapse'}
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExercise(exercise.id)}
                                  className="min-h-[36px] min-w-[36px] p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer flex items-center justify-center"
                                  title={isAr ? 'حذف التمرين' : 'Remove'}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* CARDIO VIEW vs STRENGTH VIEW */}
                            {isCardio && cardioRx ? (
                              <>
                                {/* Previous Cardio Session vs Prescribed Target */}
                                {showTargetsAndHistory && (
                                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/70 border border-slate-200/70 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                        <History size={12} className="text-slate-400" />
                                        <span>{isAr ? 'الحصة السابقة:' : 'Past Session:'}</span>
                                      </span>
                                      <span className="font-mono tabular-nums font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-neutral-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-neutral-700">
                                        {exercise.previousPerformanceSummary ||
                                          (cardioRx.lastDurationMinutes !== null || cardioRx.lastSpeedRpm !== null || cardioRx.lastHeartRateBpm !== null
                                            ? (isAr ? cardioRx.lastSummaryAr : cardioRx.lastSummaryEn)
                                            : (isAr ? 'أول حصة لهذا التمرين' : 'Baseline (15 mins)'))}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <Target size={12} className="text-amber-500" />
                                        <span>{isAr ? 'الهدف الموصوف:' : 'Prescribed Target:'}</span>
                                      </span>
                                      <span className="font-mono tabular-nums font-black text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                                        {cardioRx.suggestedDurationMinutes} mins @ {cardioRx.suggestedSpeedRpm} {unitLabel}
                                        {cardioRx.suggestedInclineResistance > 0 ? ` • Inc ${cardioRx.suggestedInclineResistance}` : ''}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Cardio Progressive Overload Coach Banner */}
                                <div
                                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    cardioRx.isReadyForLevelUp
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                                        cardioRx.isReadyForLevelUp ? 'bg-emerald-500' : 'bg-amber-500'
                                      }`}
                                    >
                                      <TrendingUp size={16} />
                                    </div>
                                    <div className="text-xs">
                                      <div className="flex flex-wrap items-center gap-1.5 font-black uppercase text-[10px]">
                                        <span>{isAr ? 'توجيه الكوتش (تطور الكارديو):' : 'Cardio Overload Plan:'}</span>
                                        <span className="px-1.5 py-0.5 rounded font-bold bg-black/10 dark:bg-white/10">
                                          {isAr ? cardioRx.headlineAr : cardioRx.headlineEn}
                                        </span>
                                      </div>
                                      <p className="mt-0.5">{isAr ? cardioRx.detailsAr : cardioRx.detailsEn}</p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleApplyCardioTarget(exercise.id, cardioRx)}
                                    className={`px-3 py-1.5 rounded-xl text-white text-xs font-black transition-all cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1 ${
                                      cardioRx.isReadyForLevelUp
                                        ? 'bg-emerald-600 hover:bg-emerald-500'
                                        : 'bg-amber-600 hover:bg-amber-500'
                                    }`}
                                  >
                                    <Zap size={12} className="fill-current" />
                                    <span>{isAr ? 'تطبيق هدف الكوتش' : 'Apply Target'}</span>
                                  </button>
                                </div>

                                {/* Cardio Input Fields (Sets / Reps / Weight HIDDEN) */}
                                <div
                                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                    cd.completed
                                      ? 'bg-emerald-500/10 dark:bg-emerald-950/25 border-emerald-500/30'
                                      : 'bg-slate-50 dark:bg-neutral-900 border-slate-200/70 dark:border-neutral-800'
                                  }`}
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                    {/* 1. Duration (mins) */}
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1">
                                        <span>{isAr ? 'المدة (دقيقة)' : 'Duration (mins)'}</span>
                                        <span className="text-[10px] font-normal text-slate-400">
                                          {isAr ? 'اختياري' : 'Optional'}
                                        </span>
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="240"
                                        step="1"
                                        value={cd.durationMinutes ?? ''}
                                        onChange={(e) => {
                                          const raw = e.target.value.trim();
                                          if (raw === '') {
                                            handleUpdateCardio(exercise.id, { durationMinutes: undefined });
                                            return;
                                          }
                                          const parsed = parseInt(raw, 10);
                                          handleUpdateCardio(exercise.id, {
                                            durationMinutes: !isNaN(parsed) && parsed > 0 ? parsed : undefined
                                          });
                                        }}
                                        placeholder={cd.targetDurationMinutes ? `${cd.targetDurationMinutes}` : '15'}
                                        className="w-full text-sm font-black font-mono tabular-nums px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                      />
                                    </div>

                                    {/* 2. Speed (Average Speed) */}
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1">
                                        <span>{isAr ? 'متوسط السرعة' : 'Avg Speed'}</span>
                                        <span className="text-[10px] font-mono text-slate-400">{unitLabel}</span>
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={cd.speedRpm ?? ''}
                                        onChange={(e) => {
                                          const raw = e.target.value.trim();
                                          if (raw === '') {
                                            handleUpdateCardio(exercise.id, { speedRpm: undefined });
                                            return;
                                          }
                                          const parsed = parseFloat(raw);
                                          handleUpdateCardio(exercise.id, {
                                            speedRpm: !isNaN(parsed) && parsed > 0 ? parsed : undefined
                                          });
                                        }}
                                        placeholder={cd.targetSpeedRpm ? `${cd.targetSpeedRpm} ${unitLabel}` : unitLabel}
                                        className="w-full text-sm font-black font-mono tabular-nums px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                      />
                                    </div>

                                    {/* 3. Heart Pumps (Cospo Chest Strap / App BPM) */}
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center justify-between gap-1">
                                        <span className="flex items-center gap-1 truncate">
                                          <Heart size={12} className="shrink-0" />
                                          <span className="truncate">{isAr ? 'نبضات القلب (Cospo)' : 'Heart Pumps (Cospo)'}</span>
                                        </span>
                                        <span className="text-[10px] font-mono text-rose-500 dark:text-rose-400 shrink-0">BPM</span>
                                      </label>
                                      <input
                                        type="number"
                                        min="30"
                                        max="240"
                                        step="1"
                                        value={cd.heartRateBpm ?? ''}
                                        onChange={(e) => {
                                          const raw = e.target.value.trim();
                                          if (raw === '') {
                                            handleUpdateCardio(exercise.id, { heartRateBpm: undefined });
                                            return;
                                          }
                                          const parsed = parseInt(raw, 10);
                                          handleUpdateCardio(exercise.id, {
                                            heartRateBpm: !isNaN(parsed) && parsed > 0 ? parsed : undefined
                                          });
                                        }}
                                        placeholder={cd.previousHeartRateBpm ? `${cd.previousHeartRateBpm} BPM` : (isAr ? 'مثال 145 BPM' : 'e.g. 145 BPM')}
                                        className="w-full text-sm font-black font-mono tabular-nums px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-rose-200 dark:border-rose-900/60 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                                      />
                                    </div>

                                    {/* 4. Incline / Resistance (Optional) */}
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1">
                                        <span className="truncate">{inclineLabel}</span>
                                        <span className="text-[10px] font-normal text-slate-400 shrink-0">
                                          {isAr ? 'اختياري' : 'Optional'}
                                        </span>
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={cd.inclineResistance ?? ''}
                                        onChange={(e) => {
                                          const raw = e.target.value.trim();
                                          if (raw === '') {
                                            handleUpdateCardio(exercise.id, { inclineResistance: undefined });
                                            return;
                                          }
                                          const parsed = parseFloat(raw);
                                          handleUpdateCardio(exercise.id, {
                                            inclineResistance: !isNaN(parsed) && parsed > 0 ? parsed : undefined
                                          });
                                        }}
                                        placeholder={cd.targetInclineResistance && cd.targetInclineResistance > 0 ? `${cd.targetInclineResistance}` : (isAr ? 'اختياري' : 'Optional')}
                                        className="w-full text-sm font-black font-mono tabular-nums px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                      />
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                                    {isAr
                                      ? 'اترك أي خانة فارغة إذا لم تقم بقياسها — لن يتم احتساب أي رقم غير مدخل، ولن يتم حفظ التمارين غير المحددة عند الإنهاء.'
                                      : 'Leave any metric blank if skipped — unentered fields are not counted, and unchecked exercises are excluded on Finish.'}
                                  </p>

                                  {/* Check / Complete Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCardioComplete(exercise.id)}
                                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] ${
                                      cd.completed
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                        : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 border border-slate-200 dark:border-neutral-700'
                                    }`}
                                  >
                                    {cd.completed ? <CheckCircle2 size={18} /> : <Square size={16} />}
                                    <span>
                                      {cd.completed
                                        ? (isAr ? 'تم إنجاز تمرين الكارديو ✓' : 'Completed • Click to Undo')
                                        : (isAr ? 'تحديد التمرين كمكتمل (Check / Complete)' : 'Check / Complete')}
                                    </span>
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Previous Session vs Next Target Summary Bar (Strength) */}
                                {showTargetsAndHistory && prescription && (
                                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/70 border border-slate-200/70 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                        <History size={12} className="text-slate-400" />
                                        <span>{isAr ? 'الحصة السابقة:' : 'Past Session:'}</span>
                                      </span>
                                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-neutral-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-neutral-700">
                                        {exercise.previousPerformanceSummary || (exercise.previousWeight ? `${exercise.previousWeight}kg × ${exercise.previousReps} reps` : (prescription.lastWeight > 0 ? `${prescription.lastWeight}kg (${prescription.lastRepsSummary})` : (isAr ? 'أول حصة لهذا التمرين' : 'Baseline')))}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Target size={12} className="text-emerald-500" />
                                        <span>{isAr ? 'الهدف الموصوف:' : 'Prescribed Target:'}</span>
                                      </span>
                                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                                        {exercise.targetWeight || prescription.suggestedWeight}kg × {exercise.targetReps || prescription.suggestedReps} reps
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Scientific Progressive Overload Coach Box (Strength) */}
                                {prescription && (
                                  <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    prescription.hasWarningFlag
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                                      : prescription.isReadyForOverload
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-slate-50 dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-slate-300'
                                  }`}>
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                        prescription.hasWarningFlag
                                          ? 'bg-amber-500 text-white'
                                          : prescription.isReadyForOverload
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-slate-400'
                                      }`}>
                                        {prescription.hasWarningFlag ? <AlertCircle size={16} /> : <TrendingUp size={16} />}
                                      </div>
                                      <div className="text-xs">
                                        <div className="flex items-center gap-1.5 font-black uppercase text-[10px]">
                                          <span>{isAr ? 'توجيه الكوتش (Double Progression):' : 'Iron Coach Target:'}</span>
                                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                                            prescription.hasWarningFlag
                                              ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200'
                                              : 'bg-black/10 dark:bg-white/10'
                                          }`}>
                                            {isAr ? prescription.headlineAr : prescription.headlineEn}
                                          </span>
                                        </div>
                                        <p className="mt-0.5">{isAr ? prescription.detailsAr : prescription.detailsEn}</p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleApplyCoachTarget(exercise.id, prescription.suggestedWeight, prescription.suggestedReps, prescription.targetSetReps)}
                                      className={`px-3 py-1.5 rounded-xl text-white text-xs font-black transition-all cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1 ${
                                        prescription.hasWarningFlag
                                          ? 'bg-amber-600 hover:bg-amber-500'
                                          : 'bg-emerald-600 hover:bg-emerald-500'
                                      }`}
                                    >
                                      <Zap size={12} className="fill-current" />
                                      <span>{isAr ? 'تطبيق هدف الكوتش' : 'Apply Targets'}</span>
                                    </button>
                                  </div>
                                )}

                                {/* Sets Table (Strength Only) */}
                                <div className="space-y-2.5">
                                  <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">
                                    <span className="col-span-2">{isAr ? 'المجموعة' : 'SET'}</span>
                                    <span className="col-span-4">{isAr ? 'الوزن (kg)' : 'WEIGHT (KG)'}</span>
                                    <span className="col-span-3">{isAr ? 'التكرار' : 'REPS'}</span>
                                    <span className="col-span-3 text-center">{isAr ? 'تم' : 'DONE'}</span>
                                  </div>

                                  {exercise.sets.map((set, sIdx) => {
                                    const isDone = !!set.completed;
                                    const prevSetWeight = set.previousWeight || exercise.previousWeight || (prescription && prescription.lastWeight > 0 ? prescription.lastWeight.toString() : '');
                                    const prevSetReps = set.previousReps !== undefined ? set.previousReps : (exercise.previousReps || 0);
                                    const targetSetWeight = set.targetWeight || exercise.targetWeight || prescription?.suggestedWeight;
                                    const targetSetReps = set.targetReps || exercise.targetReps || prescription?.suggestedReps;

                                    return (
                                      <div
                                        key={set.id}
                                        className={`p-3 rounded-2xl border transition-all space-y-2 ${
                                          isDone
                                            ? 'bg-emerald-500/10 dark:bg-emerald-950/25 border-emerald-500/30'
                                            : 'bg-slate-50 dark:bg-neutral-900 border-slate-200/70 dark:border-neutral-800'
                                        }`}
                                      >
                                        {/* Set-Level Target & History Sub-line */}
                                        {showTargetsAndHistory && (
                                          <div className="flex items-center justify-between text-[11px] font-mono px-1 pb-1 border-b border-slate-200/60 dark:border-neutral-800/80">
                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">{isAr ? 'السابق:' : 'Prev:'}</span>
                                              <span>{prevSetWeight ? `${prevSetWeight}kg × ${prevSetReps}` : (isAr ? 'لا يوجد' : '—')}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                              <span className="text-[10px] font-sans font-bold uppercase">{isAr ? 'هدف المجموعة:' : 'Next Target:'}</span>
                                              <span>{targetSetWeight}kg × {targetSetReps} reps</span>
                                            </div>
                                          </div>
                                        )}

                                        <div className="grid grid-cols-12 gap-2 items-center">
                                          {/* Set Number */}
                                          <span className="col-span-2 font-mono font-black text-xs text-slate-700 dark:text-slate-300">
                                            Set {sIdx + 1}
                                          </span>

                                          {/* Weight Input (Pre-filled with Target Weight!) */}
                                          <div className="col-span-4 flex items-center gap-1">
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={set.weight !== undefined ? set.weight : ''}
                                              onChange={(e) => handleUpdateSet(exercise.id, set.id, { weight: e.target.value })}
                                              placeholder="kg"
                                              className="w-full text-sm font-black font-mono px-3 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                            />
                                          </div>

                                          {/* Reps Input (Pre-filled with Target Reps!) */}
                                          <div className="col-span-3 flex items-center gap-1">
                                            <input
                                              type="number"
                                              min="1"
                                              value={set.reps !== undefined ? set.reps : ''}
                                              onChange={(e) => handleUpdateSet(exercise.id, set.id, { reps: parseInt(e.target.value, 10) || 0 })}
                                              placeholder="reps"
                                              className="w-full text-sm font-black font-mono px-3 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                            />
                                          </div>

                                          {/* Satisfying Big Check/Complete Button */}
                                          <div className="col-span-3 flex items-center justify-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => handleToggleSetComplete(exercise.id, set.id)}
                                              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                                                isDone
                                                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                                  : 'bg-white dark:bg-neutral-800 text-slate-300 hover:text-emerald-500 border border-slate-200 dark:border-neutral-700'
                                              }`}
                                              title={isDone ? 'Mark as incomplete' : 'Complete set'}
                                            >
                                              <Check size={20} className="stroke-[3]" />
                                            </button>
                                            
                                            {exercise.sets.length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveSet(exercise.id, set.id)}
                                                className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Add Set Button (Strength Only) */}
                                <button
                                  type="button"
                                  onClick={() => handleAddSet(exercise.id)}
                                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 hover:border-emerald-500 text-slate-600 dark:text-slate-400 hover:text-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Plus size={14} />
                                  <span>{isAr ? 'إضافة مجموعة جديدة' : '+ Add Set'}</span>
                                </button>

                                {/* Feature 2: Live Dynamic Rep Over-Performance Detection (+2 above maxReps) */}
                                {prescription &&
                                  exercise.rpeFeedback !== 'failure' &&
                                  exercise.sets.some((s) => Number(s.reps) >= prescription.maxReps + 2) && (
                                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 animate-fadeIn">
                                      <Zap size={16} className="text-emerald-500 shrink-0" />
                                      <span>
                                        {isAr
                                          ? `تجاوزت سقف التكرارات (${prescription.maxReps} + 2 فأكثر)! سيتم تفعيل قفزة وزن مضاعفة (2x) في الحصة القادمة لمطابقة قوتك الفعلية.`
                                          : `Over-Performance detected (+2 reps above ${prescription.maxReps} ceiling): Immediate Double Weight Jump (2x step) queued for next session!`}
                                      </span>
                                    </div>
                                  )}

                                {/* Feature 3: Post-Exercise RPE / RIR Micro-UI ("How did that feel?") */}
                                {isAllCompleted && (
                                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-700/80 space-y-2.5 animate-fadeIn">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-xs font-black text-slate-900 dark:text-white">
                                        {isAr ? 'كيف كان شعورك في المجموعة الأخيرة؟ (RPE / RIR)' : 'How did that feel?'}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                        {isAr ? 'يضبط توصية الوزن القادمة' : 'Calibrates next session load'}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSetExerciseRpe(exercise.id, 'easy')}
                                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                          exercise.rpeFeedback === 'easy'
                                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                            : 'bg-white dark:bg-[#18191D] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-neutral-700 hover:border-emerald-500'
                                        }`}
                                      >
                                        <span>🟢</span>
                                        <span>{isAr ? 'سهل (RIR 3+)' : 'Easy (RIR 3+)'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetExerciseRpe(exercise.id, 'perfect')}
                                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                          exercise.rpeFeedback === 'perfect'
                                            ? 'bg-amber-500 text-white border-amber-400 shadow-sm'
                                            : 'bg-white dark:bg-[#18191D] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-neutral-700 hover:border-amber-500'
                                        }`}
                                      >
                                        <span>🟡</span>
                                        <span>{isAr ? 'مثالي (RIR 1-2)' : 'Perfect (RIR 1-2)'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetExerciseRpe(exercise.id, 'failure')}
                                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                          exercise.rpeFeedback === 'failure'
                                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                                            : 'bg-white dark:bg-[#18191D] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-neutral-700 hover:border-rose-500'
                                        }`}
                                      >
                                        <span>🔴</span>
                                        <span>{isAr ? 'فشل عضلي (RIR 0)' : 'Failure (RIR 0)'}</span>
                                      </button>
                                    </div>

                                    {exercise.rpeFeedback && (
                                      <p
                                        className={`text-[11px] font-bold ${
                                          exercise.rpeFeedback === 'easy'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : exercise.rpeFeedback === 'failure'
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-amber-600 dark:text-amber-400'
                                        }`}
                                      >
                                        {exercise.rpeFeedback === 'easy'
                                          ? isAr
                                            ? '🟢 وزن خفيف جداً: سيتم اقتراح زيادة الوزن تلقائياً في الحصة القادمة.'
                                            : '🟢 Easy (RIR 3+): Next session will automatically suggest a weight increase.'
                                          : exercise.rpeFeedback === 'failure'
                                          ? isAr
                                            ? '🔴 حماية من الإجهاد العصبي: سيتم تثبيت الوزن أو تخفيفه قليلاً في الحصة القادمة.'
                                            : '🔴 Failure Guard: Next session holds weight steady or applies a micro-deload to protect CNS recovery.'
                                          : isAr
                                          ? '🟡 جهد مثالي للبناء العضلي (RIR 1-2): سيستمر نظام التدرج القياسي.'
                                          : '🟡 Optimal hypertrophy zone (RIR 1-2): Standard Double Progression applies.'}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Exercise from library or custom */}
              <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {isAr ? 'إضافة تمرين جديد للجلسة' : 'Add Exercise to Session'}
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="text"
                    value={customExerciseName}
                    onChange={(e) => setCustomExerciseName(e.target.value)}
                    placeholder={isAr ? 'اكتب اسم التمرين (مثال: Treadmill أو Incline DB Press)' : 'Type exercise name (e.g. Treadmill or Incline DB Press)...'}
                    className="w-full text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddExercise(customExerciseName)}
                    disabled={!customExerciseName.trim()}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus size={16} />
                    <span>{isAr ? 'إضافة التمرين' : 'Add Exercise'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {(routineCategory === 'Cardio & Conditioning'
                    ? POPULAR_EXERCISES.slice(0, 6)
                    : POPULAR_EXERCISES.slice(0, 10)
                  ).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => handleAddExercise(ex)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-neutral-800 transition-colors cursor-pointer"
                    >
                      + {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inline Save Validation / Error Alert (no window.alert) */}
              {saveErrorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800/60 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold">{saveErrorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSaveErrorMessage(null)}
                    className="text-xs underline font-semibold cursor-pointer shrink-0"
                  >
                    {isAr ? 'إغلاق' : 'Dismiss'}
                  </button>
                </div>
              )}

              {/* Bottom Sticky Action Bar with Mobile Safe-Area Margin */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-2xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-16 sm:mb-4">
                {sessionStats.cardioExercisesCount > 0 && sessionStats.cardioExercisesCount === exercises.length ? (
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'المكتمل' : 'CHECKED'}</span>
                      <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-400">
                        {sessionStats.completedCardioCount} <span className="text-xs text-slate-400">/ {sessionStats.cardioExercisesCount}</span>
                      </p>
                    </div>

                    {sessionStats.totalCardioMinutes > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'مدة الكارديو' : 'CARDIO TIME'}</span>
                        <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-400">
                          {sessionStats.totalCardioMinutes} <span className="text-xs text-slate-400">{isAr ? 'د' : 'mins'}</span>
                        </p>
                      </div>
                    )}

                    {sessionStats.avgHeartRateBpm && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'متوسط النبض (Cospo)' : 'COSPO AVG'}</span>
                        <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-400">
                          ♥ {sessionStats.avgHeartRateBpm} <span className="text-xs text-slate-400">BPM</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'المجموعات' : 'SETS'}</span>
                      <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-400">
                        {sessionStats.completedSets} <span className="text-xs text-slate-400">/ {sessionStats.totalSets}</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'التكرارات' : 'TOTAL REPS'}</span>
                      <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-white">
                        {sessionStats.totalReps}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {sessionStats.totalCardioMinutes > 0
                          ? (isAr ? 'كارديو' : 'CARDIO')
                          : (isAr ? 'الحجم' : 'VOLUME')}
                      </span>
                      <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-300">
                        {sessionStats.totalCardioMinutes > 0 ? (
                          <>
                            {sessionStats.totalCardioMinutes} <span className="text-xs text-slate-400">m</span>
                          </>
                        ) : (
                          <>
                            {sessionStats.calculatedVolume} <span className="text-xs text-slate-400">kg</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleRequestCancelWorkout}
                    className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 font-bold text-xs cursor-pointer border border-white/10 text-center"
                  >
                    <span>{isAr ? 'إلغاء التمرين' : 'Cancel Workout'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveWorkout}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <CheckCircle2 size={18} />
                    <span>{isAr ? 'حفظ وتأكيد الإنجاز' : 'Finish & Save'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WEEKLY SCHEDULE PLANNER (NOTION-STYLE 7-DAY BOARD)                 */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <WorkoutSchedulePlanner
          scheduledWorkouts={scheduledWorkouts}
          habits={habits}
          linkedHabitId={linkedHabitId}
          onAddScheduledWorkout={addScheduledWorkout}
          onToggleScheduledWorkout={(item) => toggleScheduledWorkoutWithHabit(item, linkedHabitId)}
          onDeleteScheduledWorkout={deleteScheduledWorkout}
          onStartRoutine={(tmpl) => {
            setActiveTab('logger');
            handleLoadPreset(tmpl);
          }}
          onSetLinkedHabit={(id) => {
            setLinkedHabitId(id);
            localStorage.setItem('iron_engine_gym_habit', id);
          }}
          isDark={isDark}
          lang={lang}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BODY METRICS & 2-MEAL MACRO ENGINE                                 */}
      {/* ========================================================================= */}
      {activeTab === 'nutrition' && (
        <BodyMetricsNutrition
          logs={bodyMetrics}
          profile={bodyProfile}
          onSaveProfile={saveBodyProfile}
          onAddLog={addBodyMetricLog}
          onDeleteLog={deleteBodyMetricLog}
          isDark={isDark}
          lang={lang}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PROGRESSIVE OVERLOAD & ANALYTICS CHARTS                            */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Sub-view Switcher: Next Session Gameplan vs Historical Charts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white dark:bg-[#18191D] rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-neutral-900 rounded-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setAnalyticsSubView('gameplan')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  analyticsSubView === 'gameplan'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Target size={16} />
                <span>{isAr ? '🎯 خطة الحصة القادمة (Gameplan)' : '🎯 Next Session Gameplan'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAnalyticsSubView('charts')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  analyticsSubView === 'charts'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp size={16} />
                <span>{isAr ? '📈 المنحنى البياني والأرقام' : '📈 Trajectory & PRs'}</span>
              </button>
            </div>

            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-3">
              {analyticsSubView === 'gameplan' 
                ? (isAr ? 'توجيهات الحصة القادمة وفق خوارزمية Double Progression وتوقيت الدخول والوجبات' : 'Double Progression Algorithm & Energy Readout')
                : (isAr ? 'تتبع مؤشرات القوة والحجم التدريبي التراكمي عبر الزمن' : 'Tracking volume output and personal records across sessions')}
            </div>
          </div>

          {analyticsSubView === 'gameplan' ? (
            <NextSessionOverloadPlanner
              workouts={workouts}
              profile={bodyProfile}
              onLaunchWorkoutWithTargets={(template, targetExercises, date) => {
                setRoutineName(template.name);
                setRoutineCategory(template.category as WorkoutRoutineCategory);
                setExercises(targetExercises);
                setWorkoutDate(date);
                setIsTimerRunning(false);
                setElapsedSeconds(0);
                const cardioSum = targetExercises.reduce((sum, ex) => sum + (ex.cardioData?.durationMinutes || 0), 0);
                setManualDurationMinutes(template.category === 'Cardio & Conditioning' && cardioSum > 0 ? Math.min(180, cardioSum) : 45);
                setIsSessionActive(true);
                setActiveTab('logger');
                setCollapsedExercises({});
              }}
              isDark={isDark}
              lang={lang}
            />
          ) : (
            <div className="space-y-5 animate-fadeIn">
              {/* Routine A vs Routine B vs Routine C Comparative Analysis Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Routine A Card */}
                <div 
                  onClick={() => setSelectedRoutineFilter(selectedRoutineFilter === 'Routine A' ? 'All' : 'Routine A')}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
                    selectedRoutineFilter === 'Routine A'
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-[#18191D] border-slate-200/80 dark:border-neutral-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                        A
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          Routine A (Full Body)
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                          Leg Press • DB Bench • Lat Pulldown • DB Shoulder • Hammer Curls
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                      selectedRoutineFilter === 'Routine A'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                    }`}>
                      {selectedRoutineFilter === 'Routine A' ? (isAr ? 'مُحدد' : 'Filtered') : (isAr ? 'تصفية' : 'Filter')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'الحصص المنجزة' : 'Sessions Done'}</span>
                      <p className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                        {prAnalytics.routineAStats.count} {isAr ? 'حصة' : 'sessions'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'إجمالي الحجم' : 'Total Volume'}</span>
                      <p className="text-base font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {prAnalytics.routineAStats.volume.toLocaleString()} kg
                      </p>
                    </div>
                  </div>
                </div>

                {/* Routine B Card */}
                <div 
                  onClick={() => setSelectedRoutineFilter(selectedRoutineFilter === 'Routine B' ? 'All' : 'Routine B')}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
                    selectedRoutineFilter === 'Routine B'
                      ? 'bg-sky-500/10 border-sky-500 shadow-md shadow-sky-500/10 ring-2 ring-sky-500/20'
                      : 'bg-white dark:bg-[#18191D] border-slate-200/80 dark:border-neutral-800 hover:border-sky-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-xs">
                        B
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          Routine B (Full Body)
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                          Goblet Squat • Cable Row • Incline DB • Lateral Raises • Tricep Pushdown
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                      selectedRoutineFilter === 'Routine B'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                    }`}>
                      {selectedRoutineFilter === 'Routine B' ? (isAr ? 'مُحدد' : 'Filtered') : (isAr ? 'تصفية' : 'Filter')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'الحصص المنجزة' : 'Sessions Done'}</span>
                      <p className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                        {prAnalytics.routineBStats.count} {isAr ? 'حصة' : 'sessions'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'إجمالي الحجم' : 'Total Volume'}</span>
                      <p className="text-base font-black font-mono tabular-nums text-sky-600 dark:text-sky-400 mt-0.5">
                        {prAnalytics.routineBStats.volume.toLocaleString()} kg
                      </p>
                    </div>
                  </div>
                </div>

                {/* Routine C Card (Cardio & Conditioning) */}
                <div 
                  onClick={() => setSelectedRoutineFilter(selectedRoutineFilter === 'Routine C' ? 'All' : 'Routine C')}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
                    selectedRoutineFilter === 'Routine C'
                      ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-[#18191D] border-slate-200/80 dark:border-neutral-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                        C
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          Routine C (Cardio)
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                          Treadmill • Bike • Rowing • Jump Rope • Sprints • Burpees
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                      selectedRoutineFilter === 'Routine C'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                    }`}>
                      {selectedRoutineFilter === 'Routine C' ? (isAr ? 'مُحدد' : 'Filtered') : (isAr ? 'تصفية' : 'Filter')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'حصص الكارديو' : 'Cardio Sessions'}</span>
                      <p className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                        {prAnalytics.routineCStats.count} {isAr ? 'حصة' : 'sessions'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {prAnalytics.routineCStats.avgHeartRateBpm
                          ? (isAr ? 'المدة • نبض Cospo' : 'Mins · Cospo BPM')
                          : (isAr ? 'إجمالي المدة' : 'Logged Duration')}
                      </span>
                      <p className="text-base font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
                        {prAnalytics.routineCStats.totalMinutes.toLocaleString()} {isAr ? 'د' : 'm'}
                        {prAnalytics.routineCStats.avgHeartRateBpm ? (
                          <span className="text-rose-500 dark:text-rose-400 text-xs font-bold ml-1.5">
                            · ♥ {prAnalytics.routineCStats.avgHeartRateBpm}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Dimensional Analytics Bento Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Peak Weight & 1RM */}
                <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-500" />
                    {isAr ? 'أقصى وزن / 1RM تقديري' : 'Peak Load / Est 1RM'}
                  </span>
                  <div className="mt-2.5">
                    <div className="text-2xl sm:text-3xl font-black text-amber-500 font-mono flex items-baseline gap-1.5">
                      <span>{prAnalytics.selectedFilterPeak1RM || prAnalytics.globalPeak1RM || 0}</span>
                      <span className="text-xs font-bold text-slate-400">kg (1RM)</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 mt-1">
                      {isAr ? 'أعلى وزن رفع:' : 'Max Working Load:'} {prAnalytics.selectedFilterPeakWeight || prAnalytics.globalMaxWeight} kg
                    </p>
                  </div>
                </div>

                {/* 2. Cumulative Volume */}
                <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Zap size={14} className="text-emerald-500" />
                    {isAr ? 'إجمالي الحمولة (Tonnage)' : 'Total Cumulative Tonnage'}
                  </span>
                  <div className="mt-2.5">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-baseline gap-1.5">
                      <span>{prAnalytics.selectedFilterTotalVolume.toLocaleString()}</span>
                      <span className="text-xs font-bold text-slate-400">kg</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 mt-1">
                      ≈ {(prAnalytics.selectedFilterTotalVolume / 1000).toFixed(2)} {isAr ? 'طن مرفوع' : 'tonnes moved'}
                    </p>
                  </div>
                </div>

                {/* 3. Rep Intensity & Volume */}
                <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Flame size={14} className="text-rose-500" />
                    {isAr ? 'إجمالي التكرارات' : 'Total Reps Crushed'}
                  </span>
                  <div className="mt-2.5">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                      <span>{prAnalytics.totalRepsInSelected || 0}</span>
                      <span className="text-xs font-bold text-slate-400">{isAr ? 'تكرار' : 'reps'}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 mt-1">
                      {prAnalytics.totalWorkingSets} {isAr ? 'مجموعة فعالة' : 'working sets logged'}
                    </p>
                  </div>
                </div>

                {/* 4. Active Sessions in Filter */}
                <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500" />
                    {isAr ? 'الحصص المطابقة' : 'Filtered Sessions'}
                  </span>
                  <div className="mt-2.5">
                    <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono flex items-baseline gap-1.5">
                      <span>{prAnalytics.filteredWorkouts.length}</span>
                      <span className="text-xs font-bold text-slate-400">{isAr ? 'تمرين' : 'workouts'}</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 mt-1 truncate">
                      {selectedRoutineFilter === 'All' ? (isAr ? 'كل الروتينات' : 'All Routines') : selectedRoutineFilter}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 1: Biomechanical Execution Order Telemetry & Warning Tooltip */}
              {prAnalytics.executionOrderAlerts.length > 0 && (
                <div className="bg-amber-50/90 dark:bg-amber-950/25 p-4 sm:p-5 rounded-3xl border border-amber-300 dark:border-amber-700/60 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <ShieldAlert size={18} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200">
                            {isAr ? 'تنبيه ترتيب التمارين في الحصة (Execution Order)' : 'Biomechanical Execution Order Telemetry'}
                          </h4>
                          <div className="relative group inline-block">
                            <button
                              type="button"
                              className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30 cursor-help flex items-center gap-1"
                              title="⚠️ Efficiency Alert: You fatigued small muscles before heavy compounds. This reduces strength output."
                            >
                              <Info size={12} />
                              <span>{isAr ? 'تفاصيل التحذير' : 'Warning Tooltip'}</span>
                            </button>
                            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-0 rtl:left-auto rtl:right-0 top-full mt-1.5 w-72 sm:w-80 p-3 rounded-2xl bg-slate-900 text-amber-100 text-xs font-medium shadow-xl border border-amber-500/40 z-30 pointer-events-none">
                              {isAr
                                ? prAnalytics.executionOrderAlerts[0].analysis.alertMessageAr
                                : '⚠️ Efficiency Alert: You fatigued small muscles before heavy compounds. This reduces strength output.'}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          ⚠️ Efficiency Alert: You fatigued small muscles before heavy compounds. This reduces strength output.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-black text-amber-700 dark:text-amber-300 shrink-0">
                      {prAnalytics.executionOrderAlerts.length} {isAr ? 'حصص مرصودة' : 'flagged sessions'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {prAnalytics.executionOrderAlerts.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.id || `${item.date}-${idx}`}
                        className="p-3 rounded-2xl bg-white/80 dark:bg-[#18191D] border border-amber-200 dark:border-amber-800/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-slate-900 dark:text-white truncate">{item.routineName}</span>
                          <span className="font-mono tabular-nums text-[11px] text-slate-500">{item.date}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300">
                          {isAr ? item.analysis.detailsAr : item.analysis.detailsEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progressive Overload & Trajectory Chart Card */}
              <div className="bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {isAr ? 'منحنى زيادة الحمل التدريجي ومسار القوة' : 'Progressive Overload & Strength Trajectory'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'تحليل متكامل لأوزان الرفع، الـ 1RM التقديري، الحجم الكلي، والتكرارات' : 'Comprehensive multi-phase telemetry of load, estimated 1RM, volume, and reps'}
                      </p>
                    </div>
                  </div>

                  {/* Multi-Dimensional Filter Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Routine Selector Dropdown */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs font-bold">
                      {(['All', 'Routine A', 'Routine B', 'Routine C'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedRoutineFilter(r)}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            selectedRoutineFilter === r
                              ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-neutral-200'
                          }`}
                        >
                          {r === 'All' ? (isAr ? 'الكل' : 'All') : r}
                        </button>
                      ))}
                    </div>

                    {/* Exercise Selector */}
                    <select
                      aria-label="Filter chart by exercise"
                      value={selectedExerciseFilter}
                      onChange={(e) => setSelectedExerciseFilter(e.target.value)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">{isAr ? 'جميع التمارين' : 'All Exercises'}</option>
                      {allUniqueExercises.map((exName) => (
                        <option key={exName} value={exName}>
                          {exName}
                        </option>
                      ))}
                    </select>

                    {/* Timeframe Selector */}
                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-700 text-[11px] font-bold">
                      {(['7', '30', '90', 'all'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setSelectedTimeframe(tf)}
                          className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                            selectedTimeframe === tf
                              ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {tf === 'all' ? (isAr ? 'الكل' : 'All') : `${tf}d`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metric Phase Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                  <button
                    onClick={() => setAnalyticsMetric('load_1rm')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      analyticsMetric === 'load_1rm'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Trophy size={13} className="text-amber-500" />
                    <span>{isAr ? 'مسار الأوزان و 1RM المتوقع' : 'Working Load & Est. 1RM (kg)'}</span>
                  </button>

                  <button
                    onClick={() => setAnalyticsMetric('volume')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      analyticsMetric === 'volume'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Zap size={13} className="text-emerald-500" />
                    <span>{isAr ? 'إجمالي الحجم التدريبي (Tonnage)' : 'Session Volume Load (kg)'}</span>
                  </button>

                  <button
                    onClick={() => setAnalyticsMetric('reps')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      analyticsMetric === 'reps'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Flame size={13} className="text-sky-500" />
                    <span>{isAr ? 'كثافة التكرارات (Reps Density)' : 'Rep Intensity & Total Sets'}</span>
                  </button>
                </div>

                {/* Graph Visualization */}
                <div className="h-72 sm:h-84 w-full pt-2">
                  {chartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Activity size={32} className="opacity-40 animate-pulse" />
                      <p className="text-xs">{isAr ? 'لا توجد بيانات كافية مطابقة لهذا الفلتر' : 'No workout data logged matching this filter'}</p>
                    </div>
                  ) : isCardioChartMode ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAmberCardio" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorRoseBpm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262626' : '#f1f5f9'} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          cursor={false}
                          contentStyle={{
                            backgroundColor: isDark ? '#18191D' : '#ffffff',
                            borderColor: isDark ? '#333333' : '#e2e8f0',
                            borderRadius: '16px',
                            fontSize: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }}
                          formatter={(val: any, name: any) =>
                            name === 'cardioMinutes'
                              ? [`${val} mins`, isAr ? 'مدة الكارديو' : 'Cardio Duration']
                              : name === 'heartRateBpm'
                              ? [`${val} BPM`, isAr ? 'نبضات القلب (Cospo)' : 'Cospo Heart Pumps']
                              : [`${val}`, isAr ? 'متوسط السرعة' : 'Avg Speed']
                          }
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Area
                          type="monotone"
                          dataKey="cardioMinutes"
                          name={isAr ? 'مدة الكارديو (د)' : 'Cardio Duration (mins)'}
                          stroke="#F59E0B"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorAmberCardio)"
                          connectNulls
                        />
                        <Area
                          type="monotone"
                          dataKey="heartRateBpm"
                          name={isAr ? 'نبضات القلب (Cospo BPM)' : 'Cospo Heart Pumps (BPM)'}
                          stroke="#F43F5E"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorRoseBpm)"
                          connectNulls
                        />
                        <Area
                          type="monotone"
                          dataKey="cardioSpeed"
                          name={isAr ? 'متوسط السرعة' : 'Avg Speed'}
                          stroke="#0EA5E9"
                          strokeWidth={2}
                          fillOpacity={0}
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {analyticsMetric === 'load_1rm' ? (
                        /* Dual Line: Working Weight & Estimated 1RM */
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262626' : '#f1f5f9'} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="kg" />
                          <Tooltip
                            cursor={false}
                            contentStyle={{
                              backgroundColor: isDark ? '#18191D' : '#ffffff',
                              borderColor: isDark ? '#333333' : '#e2e8f0',
                              borderRadius: '16px',
                              fontSize: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                            formatter={(val: any, name: any) => [
                              `${val} kg`,
                              name === 'maxWeight' ? (isAr ? 'أقصى وزن للرفع' : 'Peak Working Weight') : (isAr ? 'الحد الأقصى التقديري (1RM)' : 'Estimated 1RM')
                            ]}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Line
                            type="monotone"
                            dataKey="maxWeight"
                            name={isAr ? 'الوزن الفعلي' : 'Peak Weight'}
                            stroke="#F59E0B"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="est1RM"
                            name={isAr ? '1RM التقديري' : 'Estimated 1RM'}
                            stroke="#10B981"
                            strokeWidth={2.5}
                            strokeDasharray="4 4"
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      ) : analyticsMetric === 'volume' ? (
                        /* Area Chart for Cumulative Tonnage Volume */
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorEmeraldVol" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262626' : '#f1f5f9'} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip
                            cursor={false}
                            contentStyle={{
                              backgroundColor: isDark ? '#18191D' : '#ffffff',
                              borderColor: isDark ? '#333333' : '#e2e8f0',
                              borderRadius: '16px',
                              fontSize: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                            formatter={(val: any) => [`${val} kg`, isAr ? 'الحجم الكلي' : 'Total Volume']}
                          />
                          <Area
                            type="monotone"
                            dataKey="volume"
                            name={isAr ? 'الحجم التدريبي' : 'Session Volume'}
                            stroke="#10B981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorEmeraldVol)"
                          />
                        </AreaChart>
                      ) : (
                        /* Bar / Line Hybrid for Reps & Set Density */
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262626' : '#f1f5f9'} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip
                            cursor={false}
                            contentStyle={{
                              backgroundColor: isDark ? '#18191D' : '#ffffff',
                              borderColor: isDark ? '#333333' : '#e2e8f0',
                              borderRadius: '16px',
                              fontSize: '12px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar
                            dataKey="totalReps"
                            name={isAr ? 'إجمالي التكرارات' : 'Total Reps'}
                            fill="#0284C7"
                            radius={[6, 6, 0, 0]}
                          />
                          <Bar
                            dataKey="maxReps"
                            name={isAr ? 'أعلى تكرار بمجموعة' : 'Peak Reps / Set'}
                            fill="#38BDF8"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
      )}
    </div>
  )}

      {/* ========================================================================= */}
      {/* TAB 5: WORKOUT HISTORY & CHRONICLES                                       */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History size={18} className="text-emerald-500" />
              {isAr ? 'سجل التدريبات والتاريخ الرياضي' : 'Workout Chronicles & Past Logs'}
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {workouts.length} {isAr ? 'جلسة محفوظة' : 'sessions logged'}
            </span>
          </div>

          {workouts.length === 0 ? (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl p-10 text-center border border-slate-200/80 dark:border-neutral-800 space-y-3">
              <Dumbbell size={40} className="mx-auto text-slate-300 dark:text-neutral-600" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'لا توجد تمارين مسجلة بعد' : 'No workout logs recorded yet'}
              </h4>
              <button
                onClick={() => setActiveTab('logger')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                {isAr ? 'ابدأ روتينك الآن' : 'Start Workout Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map((session) => {
                const parts = session.date.split('-');
                const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                const formattedDate = dObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                const sessionOrderAnalysis = analyzeSessionExecutionOrder(session.exercises || []);

                return (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-neutral-800/80">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            {session.routineName}
                          </h4>
                          {session.routineCategory && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300">
                              {session.routineCategory}
                            </span>
                          )}
                          {(sessionOrderAnalysis.hasAlert || session.hasExecutionOrderAlert) && (
                            <div className="relative group inline-block">
                              <button
                                type="button"
                                className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black flex items-center gap-1 cursor-help"
                                title="⚠️ Efficiency Alert: You fatigued small muscles before heavy compounds. This reduces strength output."
                              >
                                <ShieldAlert size={11} />
                                <span>{isAr ? 'تنبيه الترتيب' : 'Efficiency Alert'}</span>
                              </button>
                              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-0 rtl:left-auto rtl:right-0 top-full mt-1.5 w-72 p-3 rounded-2xl bg-slate-900 text-amber-100 text-xs font-medium shadow-xl border border-amber-500/40 z-30 pointer-events-none space-y-1">
                                <p className="font-bold">
                                  ⚠️ Efficiency Alert: You fatigued small muscles before heavy compounds. This reduces strength output.
                                </p>
                                <p className="text-[11px] text-amber-200/80">
                                  {sessionOrderAnalysis.hasAlert
                                    ? (isAr ? sessionOrderAnalysis.detailsAr : sessionOrderAnalysis.detailsEn)
                                    : session.executionOrderAlertDetails}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-400">{formattedDate}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'الإنجاز' : 'OUTPUT'}</span>
                          <p className="text-xs font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {session.routineCategory === 'Cardio & Conditioning' || session.totalCardioMinutes || session.avgHeartRateBpm
                              ? ([
                                  session.totalCardioMinutes && session.totalCardioMinutes > 0 ? `${session.totalCardioMinutes}m cardio` : null,
                                  session.avgHeartRateBpm && session.avgHeartRateBpm > 0 ? `♥ ${session.avgHeartRateBpm} BPM` : null,
                                  session.durationMinutes && session.durationMinutes > 0 && session.durationMinutes !== session.totalCardioMinutes ? `${session.durationMinutes}m` : null
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || `${session.exercises?.length || 0} ${isAr ? 'تمارين' : 'completed'}`)
                              : `${session.totalReps || 0} reps${session.durationMinutes ? ` • ${session.durationMinutes}m` : ''}`}
                          </p>
                        </div>

                        <button
                          onClick={() => handleLoadHistoricalWorkout(session)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Copy size={12} />
                          <span>{isAr ? 'تكرار' : 'Repeat'}</span>
                        </button>

                        <button
                          onClick={() => session.id && handleDeleteWorkout(session.id)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            deletingWorkoutId === session.id
                              ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                              : 'text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          }`}
                        >
                          <Trash2 size={14} />
                          {deletingWorkoutId === session.id && (
                            <span>{isAr ? 'تأكيد؟' : 'Confirm?'}</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Breakdown of exercises in past workout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {session.exercises?.map((ex, exI) => {
                        const isCardioEx = ex.exerciseType === 'cardio' || !!ex.cardioData || isCardioExercise(ex.name);
                        const cd = ex.cardioData;
                        const unitLabel = cd?.speedUnit === 'km/h' ? 'km/h' : cd?.speedUnit === 'rpm' ? 'RPM' : cd?.speedUnit === 'spm' ? 'SPM' : 'Lv';
                        const hasDur = !!(cd?.durationMinutes && cd.durationMinutes > 0);
                        const hasSpd = !!(cd?.speedRpm && cd.speedRpm > 0);
                        const hasInc = !!(cd?.inclineResistance && cd.inclineResistance > 0);
                        const hasBpm = !!(cd?.heartRateBpm && cd.heartRateBpm > 0);

                        return (
                          <div
                            key={ex.id || exI}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/80 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                                {ex.name}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {ex.rpeFeedback && (
                                  <span className="text-[10px] font-bold">
                                    {ex.rpeFeedback === 'easy' ? '🟢 Easy' : ex.rpeFeedback === 'failure' ? '🔴 Fail' : '🟡 Perf'}
                                  </span>
                                )}
                                <span className={`text-[10px] font-mono tabular-nums font-bold ${
                                  isCardioEx ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {isCardioEx && cd
                                    ? (hasDur ? `${cd.durationMinutes} mins` : (isAr ? 'كارديو' : 'Cardio'))
                                    : `${ex.sets?.length || 0} sets`}
                                </span>
                              </div>
                            </div>
                            
                            {isCardioEx && cd ? (
                              <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                {hasSpd && (
                                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-bold">
                                    {cd.speedRpm} {unitLabel} avg
                                  </span>
                                )}
                                {hasBpm && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                                    ♥ {cd.heartRateBpm} BPM (Cospo)
                                  </span>
                                )}
                                {hasInc && (
                                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-bold">
                                    Inc/Res {cd.inclineResistance}
                                  </span>
                                )}
                                {cd.completed && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                                    ✓ Done
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {ex.sets?.map((s, sI) => (
                                  <span
                                    key={s.id || sI}
                                    className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-bold"
                                  >
                                    {s.reps}r {s.weight && s.weight !== '0' ? `(${s.weight}kg)` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {session.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-neutral-900/40 p-2.5 rounded-xl italic">
                        "{session.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cancel/Exit Workout Confirmation Custom Modal (NO browser window.confirm!) */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#18191D] rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3.5 text-rose-600 dark:text-rose-400">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center font-black shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isAr ? 'إلغاء أم إنهاء تمرينك الحالي؟' : 'Exit or Save Current Workout?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr
                    ? `لقد أتممت ${sessionStats.completedSets} مجموعات في هذه الجلسة. ماذا تريد أن تفعل؟`
                    : `You have completed ${sessionStats.completedSets} sets in this session. What would you like to do?`}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveWorkout}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 size={16} />
                <span>{isAr ? 'حفظ وتأكيد إنجاز الجلسة الآن' : 'Save & Finish Workout Now'}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDiscardWorkout}
                className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold text-xs sm:text-sm cursor-pointer border border-rose-200 dark:border-rose-800/60"
              >
                <span>{isAr ? 'إلغاء التمرين والتخلي عن السجلات الحالية' : 'Discard Workout Progress'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer mt-1"
              >
                <span>{isAr ? 'متابعة التمرين الحالي' : 'Keep Training'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Preview Modal Pop-up */}
      {previewModalData && (
        <ExercisePreviewModal
          exerciseName={previewModalData.name}
          targetWeightKg={previewModalData.targetWeightKg}
          previousWeightKg={previewModalData.previousWeightKg}
          previousRepsSummary={previewModalData.previousRepsSummary}
          targetReps={previewModalData.targetReps}
          onClose={() => setPreviewModalData(null)}
          lang={lang}
        />
      )}
    </div>
  );
};
