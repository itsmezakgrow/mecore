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
  Camera
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
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
  updateScheduledWorkout,
  deleteScheduledWorkout,
  toggleScheduledWorkoutWithHabit
} from '../services/firestoreService';
import { playCelebrationChime } from '../utils/focusAudio';
import { getCoachPrescriptionForExercise } from '../utils/progressiveOverloadCoach';
import { WorkoutSchedulePlanner } from './WorkoutSchedulePlanner';
import { BodyMetricsNutrition } from './BodyMetricsNutrition';
import { NextSessionOverloadPlanner } from './NextSessionOverloadPlanner';
import { ExercisePreviewModal } from './ExercisePreviewModal';
import { getExerciseImagePath, getExerciseMeta } from '../utils/exerciseAssets';

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
  const targetName = exerciseName.trim().toLowerCase();
  
  // Sort sessions chronologically descending
  const sortedSessions = [...workoutHistory].sort((a, b) => b.createdAt - a.createdAt);
  
  for (const session of sortedSessions) {
    if (session.exercises && Array.isArray(session.exercises)) {
      const match = session.exercises.find(ex => ex.name.trim().toLowerCase() === targetName);
      if (match && match.sets && match.sets.length > 0) {
        return match;
      }
    }
  }
  return null;
}

// Built-in Iron Engine Presets & Routines (Routine A & Routine B are prominent Hero Routines)
const ROUTINE_TEMPLATES: WorkoutRoutineTemplate[] = [
  {
    id: 'routine-a-fullbody',
    name: 'Routine A (Full Body)',
    category: 'Full Body',
    description: 'Leg Press (3x12), Flat DB Bench (3x10), Lat Pulldown (3x12), Shoulder Press (3x10), Hammer Curls (3x12)',
    exercises: [
      { name: 'Leg Press Machine', targetSets: 3, targetReps: 12, defaultWeight: '60' },
      { name: 'Flat Dumbbell Bench Press', targetSets: 3, targetReps: 10, defaultWeight: '20' },
      { name: 'Wide Grip Lat Pulldown', targetSets: 3, targetReps: 12, defaultWeight: '45' },
      { name: 'Seated Dumbbell Shoulder Press', targetSets: 3, targetReps: 10, defaultWeight: '14' },
      { name: 'Cable Rope Hammer Curls', targetSets: 3, targetReps: 12, defaultWeight: '18' },
    ]
  },
  {
    id: 'routine-b-fullbody',
    name: 'Routine B (Full Body)',
    category: 'Full Body',
    description: 'Goblet Squat (3x12), Seated Cable Row (3x12), Incline DB Bench (3x10), Lateral Raises (3x15), Tricep Rope Pushdown (3x12)',
    exercises: [
      { name: 'Goblet Squat', targetSets: 3, targetReps: 12, defaultWeight: '24' },
      { name: 'Seated Cable Row', targetSets: 3, targetReps: 12, defaultWeight: '45' },
      { name: 'Incline Dumbbell Bench Press', targetSets: 3, targetReps: 10, defaultWeight: '18' },
      { name: 'Dumbbell Lateral Raises', targetSets: 3, targetReps: 15, defaultWeight: '8' },
      { name: 'Tricep Rope Pushdown', targetSets: 3, targetReps: 12, defaultWeight: '20' },
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
  const [routineCategory, setRoutineCategory] = useState<'Push' | 'Pull' | 'Legs' | 'Full Body' | 'Calisthenics Skills' | 'Core & Mobility' | 'Custom'>('Full Body');
  const [workoutDate, setWorkoutDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [previewExerciseName, setPreviewExerciseName] = useState<string | null>(null);

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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7' | '30' | '90' | 'all'>('30');
  const [analyticsMetric, setAnalyticsMetric] = useState<'maxReps' | 'totalReps' | 'volume'>('maxReps');
  const [analyticsSubView, setAnalyticsSubView] = useState<'gameplan' | 'charts'>('gameplan');

  // Saving state & notifications
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Cancellation confirm modal & deleting state (NO browser window.confirm!)
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<boolean>(false);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);

  // Exercise collapsing state to avoid long scrolls on mobile
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});
  const handleToggleCollapse = (id: string) => {
    setCollapsedExercises((prev) => ({ ...prev, [id]: !prev[id] }));
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

  // Load a preset routine template (e.g. Routine A or Routine B)
  const handleLoadPreset = (template: WorkoutRoutineTemplate) => {
    setRoutineName(template.name);
    setRoutineCategory(template.category);
    setCollapsedExercises({});
    const newExs: WorkoutExercise[] = template.exercises.map((item, idx) => {
      const lastRecorded = getLastRecordedExercise(item.name, workouts);
      let targetSets: WorkoutSet[] = [];

      if (lastRecorded && lastRecorded.sets && lastRecorded.sets.length > 0) {
        targetSets = lastRecorded.sets.map((pastSet, sIdx) => ({
          id: `s-${Date.now()}-${idx}-${sIdx}`,
          setNumber: sIdx + 1,
          reps: pastSet.reps || item.targetReps,
          weight: pastSet.weight || item.defaultWeight,
          weightUnit: pastSet.weightUnit || 'kg',
          completed: false
        }));
      } else {
        targetSets = Array.from({ length: item.targetSets }).map((_, sIdx) => ({
          id: `s-${Date.now()}-${idx}-${sIdx}`,
          setNumber: sIdx + 1,
          reps: item.targetReps,
          weight: item.defaultWeight,
          weightUnit: 'kg',
          completed: false
        }));
      }

      return {
        id: `ex-${Date.now()}-${idx}`,
        name: item.name,
        sets: targetSets,
        isAutoFilled: !!lastRecorded
      };
    });
    setExercises(newExs);
    setElapsedSeconds(0);
    setIsTimerRunning(false); // DO NOT auto-start stopwatch!
    setManualDurationMinutes(45);
    setIsSessionActive(true);
    setActiveTab('logger');
  };

  // Start an empty custom workout session (Secondary option)
  const handleStartCustomWorkout = () => {
    setRoutineName(isAr ? 'تمرين مخصص جديد' : 'Custom Workout Session');
    setRoutineCategory('Custom');
    setExercises([]);
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

  // Toggle set completed checkbox with audio chime
  const handleToggleSetComplete = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id === setId) {
              const nextState = !s.completed;
              if (nextState) {
                try {
                  playCelebrationChime();
                } catch {}
                startRestTimer(60);
              }
              return { ...s, completed: nextState };
            }
            return s;
          })
        };
      })
    );
  };

  // Apply Coach Target Prescription to an exercise
  const handleApplyCoachTarget = (exerciseId: string, recommendedWeight: number, recommendedReps: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.completed) return s; // leave completed alone
            return {
              ...s,
              weight: recommendedWeight.toString(),
              reps: recommendedReps
            };
          })
        };
      })
    );
    try {
      playCelebrationChime();
    } catch {}
  };

  // Active workout summary stats
  const sessionStats = useMemo(() => {
    let totalSets = 0;
    let completedSets = 0;
    let totalReps = 0;
    let calculatedVolume = 0;

    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        totalSets++;
        if (s.completed) {
          completedSets++;
          const reps = Number(s.reps) || 0;
          totalReps += reps;
          const weightNum = parseFloat(s.weight || '0');
          if (!isNaN(weightNum) && weightNum > 0) {
            calculatedVolume += reps * weightNum;
          }
        }
      });
    });

    const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    return { totalSets, completedSets, totalReps, calculatedVolume, completionRate };
  }, [exercises]);

  // Save workout session to Firestore and batch check-off habit
  const handleSaveWorkout = async () => {
    if (exercises.length === 0) {
      alert(isAr ? 'يرجى إضافة تمرين واحد على الأقل قبل الحفظ' : 'Please add at least one exercise before saving.');
      return;
    }

    setIsSaving(true);
    try {
      // Use timer if it ran, otherwise use manualDurationMinutes for retrospective logging
      const durationMins = elapsedSeconds >= 60 
        ? Math.round(elapsedSeconds / 60) 
        : (manualDurationMinutes || 45);

      const targetDate = workoutDate || new Date().toISOString().split('T')[0];
      
      const payload: Omit<WorkoutSession, 'id'> = {
        routineName: routineName.trim(),
        routineCategory,
        exercises,
        durationMinutes: durationMins,
        date: targetDate,
        createdAt: Date.now(),
        notes: workoutNotes.trim() || undefined,
        totalVolume: sessionStats.calculatedVolume,
        totalReps: sessionStats.totalReps,
        totalSets: sessionStats.completedSets,
      };

      // Check linked habits for automatic batch completion
      const gymHabitId = linkedHabitId || (typeof window !== 'undefined' ? localStorage.getItem('iron_engine_gym_habit') || undefined : undefined);
      const cardioHabitId = typeof window !== 'undefined' ? localStorage.getItem('iron_engine_cardio_habit') || undefined : undefined;

      if (gymHabitId || cardioHabitId) {
        await addWorkoutWithHabitBatch(payload, gymHabitId, cardioHabitId);
      } else {
        await addWorkout(payload);
      }

      playCelebrationChime();
      
      setSaveSuccessMessage(
        isAr
          ? '🎉 تم تسجيل التمرين وتحديث العادة المرتبطة بنجاح!'
          : '🎉 Workout logged & linked habit checked off!'
      );
      setTimeout(() => setSaveSuccessMessage(null), 4000);

      setIsTimerRunning(false);
      setElapsedSeconds(0);
      cancelRestTimer();
      setIsSessionActive(false);
      setExercises([]);
      setActiveTab('analytics');
    } catch (err) {
      console.error('Failed to log workout session:', err);
      alert(isAr ? 'حدث خطأ أثناء حفظ التمرين' : 'Error saving workout session. Please retry.');
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
        sets: ex.sets.map((s, sIdx) => ({
          ...s,
          id: `s-clone-${Date.now()}-${idx}-${sIdx}`,
          completed: false
        }))
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
    let globalMaxReps = 0;
    let globalMaxRepsExercise = '';
    let globalMaxRepsDate = '';

    let exerciseMaxReps = 0;
    let exerciseMaxRepsDate = '';
    let exerciseMaxVolume = 0;
    let totalExerciseSessions = 0;
    let totalRepsInSelected = 0;

    const now = new Date();
    const timeframeDays = selectedTimeframe === 'all' ? 99999 : parseInt(selectedTimeframe, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - timeframeDays);
    const cutoffISO = cutoffDate.toISOString().split('T')[0];

    const filteredWorkouts = workouts.filter((w) => {
      if (selectedTimeframe === 'all') return true;
      return w.date >= cutoffISO;
    });

    workouts.forEach((w) => {
      w.exercises?.forEach((ex) => {
        const exName = ex.name.trim();
        const isMatch = selectedExerciseFilter === 'All' || exName.toLowerCase() === selectedExerciseFilter.toLowerCase();

        let sessionExReps = 0;
        ex.sets?.forEach((s) => {
          const reps = Number(s.reps) || 0;
          
          if (reps > globalMaxReps) {
            globalMaxReps = reps;
            globalMaxRepsExercise = exName;
            globalMaxRepsDate = w.date;
          }

          if (isMatch) {
            if (reps > exerciseMaxReps) {
              exerciseMaxReps = reps;
              exerciseMaxRepsDate = w.date;
            }
            sessionExReps += reps;
            totalRepsInSelected += reps;
          }
        });

        if (isMatch && sessionExReps > 0) {
          totalExerciseSessions++;
          if (sessionExReps > exerciseMaxVolume) {
            exerciseMaxVolume = sessionExReps;
          }
        }
      });
    });

    return {
      globalMaxReps,
      globalMaxRepsExercise,
      globalMaxRepsDate,
      exerciseMaxReps: selectedExerciseFilter === 'All' ? globalMaxReps : exerciseMaxReps,
      exerciseMaxRepsDate: selectedExerciseFilter === 'All' ? globalMaxRepsDate : exerciseMaxRepsDate,
      exerciseMaxVolume,
      totalExerciseSessions,
      totalRepsInSelected,
      filteredWorkouts,
    };
  }, [workouts, selectedExerciseFilter, selectedTimeframe]);

  const chartData = useMemo(() => {
    const rawMap: Record<string, { date: string; maxReps: number; totalReps: number; volume: number; routine: string }> = {};

    const sorted = [...prAnalytics.filteredWorkouts].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach((w) => {
      let sessionMaxReps = 0;
      let sessionTotalReps = 0;
      let sessionVolume = w.totalVolume || 0;

      w.exercises?.forEach((ex) => {
        const isMatch = selectedExerciseFilter === 'All' || ex.name.trim().toLowerCase() === selectedExerciseFilter.toLowerCase();
        if (isMatch) {
          ex.sets?.forEach((s) => {
            const reps = Number(s.reps) || 0;
            if (reps > sessionMaxReps) sessionMaxReps = reps;
            sessionTotalReps += reps;
          });
        }
      });

      if (selectedExerciseFilter === 'All' || sessionTotalReps > 0) {
        const parts = w.date.split('-');
        const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const shortDate = dObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });

        rawMap[w.date] = {
          date: shortDate,
          maxReps: sessionMaxReps,
          totalReps: sessionTotalReps > 0 ? sessionTotalReps : (w.totalReps || 0),
          volume: sessionVolume,
          routine: w.routineName,
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

            {/* Custom Session is a Secondary Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartCustomWorkout}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-neutral-700 shrink-0"
              >
                <Plus size={14} />
                <span>{isAr ? 'جلسة مخصصة فارغة' : 'Start Custom Empty Session'}</span>
              </button>
            </div>
          </div>

          {/* DUAL HERO CARDS: Routine A & Routine B Side-by-Side Prominent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ROUTINE_TEMPLATES.slice(0, 2).map((routine, idx) => {
              const isRoutineA = idx === 0;
              return (
                <div
                  key={routine.id}
                  className={`p-6 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between group ${
                    isRoutineA
                      ? 'bg-gradient-to-br from-emerald-500/10 via-slate-900/5 to-transparent dark:from-emerald-950/40 dark:via-[#18191D] dark:to-[#121316] border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                      : 'bg-gradient-to-br from-teal-500/10 via-slate-900/5 to-transparent dark:from-teal-950/40 dark:via-[#18191D] dark:to-[#121316] border-teal-500/30 shadow-lg shadow-teal-500/5'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                        isRoutineA
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                      }`}>
                        {routine.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {routine.exercises.length} {isAr ? 'تمارين مستهدفة' : 'exercises'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                        {routine.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {routine.description}
                      </p>
                    </div>

                    {/* Exercise List preview */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-neutral-800/80">
                      {routine.exercises.map((ex, exI) => (
                        <div
                          key={ex.name}
                          className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-white/70 dark:bg-neutral-900/60 border border-slate-200/50 dark:border-neutral-800"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {exI + 1}. {ex.name}
                          </span>
                          <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                            {ex.targetSets}x{ex.targetReps} • {ex.defaultWeight}kg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4">
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(routine)}
                      className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-[0.98] ${
                        isRoutineA
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                          : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/25'
                      }`}
                    >
                      <Play size={16} className="fill-current stroke-[2.5]" />
                      <span>{isAr ? `بدء تمرين ${routine.name}` : `Start ${routine.name}`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linked Habit Quick Selector / Status */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Flame size={20} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'العادة المرتبطة بالتمارين الرياضية' : 'Linked Gym Habit'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr 
                    ? 'يتم وضع علامة إنجاز أوتوماتيكياً على هذه العادة فور إنهاء أي تمرين بنجاح.' 
                    : 'Automatically checked off in Habit Tracker when a workout is finished.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                <option value="">{isAr ? 'غير مرتبط بأي عادة' : 'None (No habit linked)'}</option>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.icon || '🏋️'} {h.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Calisthenics & Other Presets */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 px-1">
              <Layers size={16} className="text-emerald-500" />
              <span>{isAr ? 'روتينات إضافية (كاليسثينكس وقوة عضلية)' : 'Additional Specialist Routines'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ROUTINE_TEMPLATES.slice(2).map((tmpl) => (
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
              
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-emerald-500" />
                  {isAr ? 'التمارين والمجموعات' : 'Exercises & Sets'}
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {exercises.length} {isAr ? 'تمارين' : 'movements'}
                </span>
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
                  {exercises.map((exercise, exIdx) => {
                    const isCollapsed = !!collapsedExercises[exercise.id];
                    const completedSetsCount = exercise.sets.filter((s) => s.completed).length;
                    const totalSetsCount = exercise.sets.length;
                    const isAllCompleted = completedSetsCount === totalSetsCount && totalSetsCount > 0;
                    
                    // Scientific Progressive Overload Coach prescription
                    const targetSetsCount = exercise.sets.length || 3;
                    const targetRepsCount = exercise.sets[0]?.reps || 10;
                    const defaultWeight = exercise.sets[0]?.weight || '20';
                    const prescription = getCoachPrescriptionForExercise(
                      exercise.name,
                      targetSetsCount,
                      targetRepsCount,
                      defaultWeight,
                      workouts
                    );

                    return (
                      <div
                        key={exercise.id}
                        className={`bg-white dark:bg-[#18191D] rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs transition-all ${
                          isCollapsed ? 'p-4' : 'p-5 sm:p-6 space-y-4'
                        }`}
                      >
                        {/* Collapsed View */}
                        {isCollapsed ? (
                          <div className="flex items-center justify-between gap-3 animate-fadeIn">
                            <div className="flex items-center gap-3 overflow-hidden">
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
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400 font-mono">
                                  {completedSetsCount}/{totalSetsCount} {isAr ? 'مجموعات منجزة' : 'sets completed'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
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
                              <div className="flex items-center gap-3">
                                {/* Interactive Exercise Image Thumbnail */}
                                <button
                                  type="button"
                                  onClick={() => setPreviewExerciseName(exercise.name)}
                                  className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center relative group cursor-pointer hover:border-emerald-500 transition-all shadow-2xs"
                                  title={isAr ? 'انقر لمعاينة حركة التمرين والتكنيك' : 'Click to preview exercise technique'}
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
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-black text-slate-400">#{exIdx + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewExerciseName(exercise.name)}
                                      className="text-base font-black text-slate-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left rtl:text-right"
                                    >
                                      <span>{exercise.name}</span>
                                      <Eye size={15} className="text-slate-400 hover:text-emerald-500" />
                                    </button>
                                  </div>
                                  {exercise.isAutoFilled && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 inline-block mt-0.5">
                                      {isAr ? 'معبأ من آخر حصة' : 'Last Session Preloaded'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCollapse(exercise.id)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                  title={isAr ? 'طي التمرين' : 'Collapse'}
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExercise(exercise.id)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                  title={isAr ? 'حذف التمرين' : 'Remove'}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Scientific Progressive Overload Coach Box */}
                            <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              prescription.isReadyForOverload
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-50 dark:bg-neutral-900/60 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  prescription.isReadyForOverload
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                  <TrendingUp size={16} />
                                </div>
                                <div className="text-xs">
                                  <div className="flex items-center gap-1.5 font-black uppercase text-[10px]">
                                    <span>{isAr ? 'توجيه الكوتش (Double Progression):' : 'Iron Coach Target:'}</span>
                                    <span className="px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                                      {isAr ? prescription.headlineAr : prescription.headlineEn}
                                    </span>
                                  </div>
                                  <p className="mt-0.5">{isAr ? prescription.detailsAr : prescription.detailsEn}</p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleApplyCoachTarget(exercise.id, prescription.suggestedWeight, prescription.suggestedReps)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1"
                              >
                                <Zap size={12} className="fill-current" />
                                <span>{isAr ? 'تطبيق هدف الكوتش' : 'Apply Targets'}</span>
                              </button>
                            </div>

                            {/* Sets Table */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">
                                <span className="col-span-2">{isAr ? 'المجموعة' : 'SET'}</span>
                                <span className="col-span-4">{isAr ? 'الوزن (kg)' : 'WEIGHT (KG)'}</span>
                                <span className="col-span-3">{isAr ? 'التكرار' : 'REPS'}</span>
                                <span className="col-span-3 text-center">{isAr ? 'تم' : 'DONE'}</span>
                              </div>

                              {exercise.sets.map((set, sIdx) => {
                                const isDone = !!set.completed;
                                return (
                                  <div
                                    key={set.id}
                                    className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl border transition-all ${
                                      isDone
                                        ? 'bg-emerald-500/10 dark:bg-emerald-950/25 border-emerald-500/30'
                                        : 'bg-slate-50 dark:bg-neutral-900 border-slate-200/70 dark:border-neutral-800'
                                    }`}
                                  >
                                    {/* Set Number */}
                                    <span className="col-span-2 font-mono font-black text-xs text-slate-700 dark:text-slate-300">
                                      {sIdx + 1}
                                    </span>

                                    {/* Weight Input (Large numeric tap target) */}
                                    <div className="col-span-4 flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={set.weight || ''}
                                        onChange={(e) => handleUpdateSet(exercise.id, set.id, { weight: e.target.value })}
                                        placeholder="kg"
                                        className="w-full text-sm font-black font-mono px-3 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                      />
                                    </div>

                                    {/* Reps Input (Large numeric tap target) */}
                                    <div className="col-span-3 flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="1"
                                        value={set.reps || ''}
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
                                          className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Add Set Button */}
                            <button
                              type="button"
                              onClick={() => handleAddSet(exercise.id)}
                              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 hover:border-emerald-500 text-slate-600 dark:text-slate-400 hover:text-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>{isAr ? 'إضافة مجموعة جديدة' : '+ Add Set'}</span>
                            </button>
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
                    placeholder={isAr ? 'اكتب اسم التمرين (مثال: Incline DB Press)' : 'Type exercise name or pick below...'}
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
                  {POPULAR_EXERCISES.slice(0, 8).map((ex) => (
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

              {/* Bottom Sticky Action Bar with Mobile Safe-Area Margin */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-2xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-16 sm:mb-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'المجموعات' : 'SETS'}</span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                      {sessionStats.completedSets} <span className="text-xs text-slate-400">/ {sessionStats.totalSets}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'التكرارات' : 'TOTAL REPS'}</span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-white">
                      {sessionStats.totalReps}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'الحجم' : 'VOLUME'}</span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
                      {sessionStats.calculatedVolume} <span className="text-xs text-slate-400">kg</span>
                    </p>
                  </div>
                </div>

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
                setRoutineCategory(template.category as any);
                setExercises(targetExercises);
                setWorkoutDate(date);
                setIsTimerRunning(false);
                setElapsedSeconds(0);
                setIsSessionActive(true);
                setActiveTab('logger');
                setCollapsedExercises({});
              }}
              isDark={isDark}
              lang={lang}
            />
          ) : (
            <div className="space-y-5 animate-fadeIn">
              {/* PR Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" />
                {isAr ? 'الرقم القياسي (أقصى تكرار)' : 'Personal Record (PR)'}
              </span>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                  <span>{prAnalytics.exerciseMaxReps || 0}</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? 'تكرار' : 'reps'}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {selectedExerciseFilter === 'All'
                    ? (prAnalytics.globalMaxRepsExercise ? `${prAnalytics.globalMaxRepsExercise} (${prAnalytics.globalMaxRepsDate})` : (isAr ? 'سجل أول تمرين لك' : 'Log your first session'))
                    : `${selectedExerciseFilter} ${prAnalytics.exerciseMaxRepsDate ? `(${prAnalytics.exerciseMaxRepsDate})` : ''}`}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap size={14} className="text-emerald-500" />
                {isAr ? 'أعلى حجم تدريبي بجلسة' : 'Peak Session Volume'}
              </span>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                  <span>{prAnalytics.exerciseMaxVolume || (workouts[0]?.totalVolume || workouts[0]?.totalReps || 0)}</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? 'kg' : 'kg/reps'}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {isAr ? 'أعلى جهد مجمع في يوم واحد' : 'Highest cumulative output'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Flame size={14} className="text-rose-500" />
                {isAr ? 'إجمالي التكرارات المنجزة' : 'Total Reps Crushed'}
              </span>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                  <span>{prAnalytics.totalRepsInSelected || workouts.reduce((acc, cur) => acc + (cur.totalReps || 0), 0)}</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? 'تكرار' : 'reps'}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {isAr ? `خلال آخر ${selectedTimeframe === 'all' ? 'فترة' : selectedTimeframe + ' يوم'}` : `Across selected timeframe`}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-500" />
                {isAr ? 'الجلسات المسجلة' : 'Sessions Logged'}
              </span>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                  <span>{workouts.length}</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? 'تمرين' : 'workouts'}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {isAr ? 'التزام حديدي مع المزامنة' : 'Cloud synchronized training records'}
                </p>
              </div>
            </div>
          </div>

          {/* Progressive Overload Chart */}
          <div className="bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-neutral-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {isAr ? 'منحنى زيادة الحمل التدريجي (Progressive Overload Chart)' : 'Progressive Overload & Strength Trajectory'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'تتبع تطور التكرارات والأوزان المضافة عبر الزمن' : 'Plotting Max Reps & Cumulative Volume across workout sessions'}
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter chart by exercise"
                  value={selectedExerciseFilter}
                  onChange={(e) => setSelectedExerciseFilter(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="All">{isAr ? 'جميع التمارين (الحجم الإجمالي)' : 'All Exercises (Total Volume)'}</option>
                  {allUniqueExercises.map((exName) => (
                    <option key={exName} value={exName}>
                      {exName}
                    </option>
                  ))}
                </select>

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

            {/* Recharts Area Chart */}
            <div className="h-64 sm:h-80 w-full pt-4">
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Activity size={32} className="opacity-40 animate-pulse" />
                  <p className="text-xs">{isAr ? 'لا توجد بيانات كافية لرسم المنحنى في هذه الفترة' : 'No workout data logged in this timeframe'}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262626' : '#f1f5f9'} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#18191D' : '#ffffff',
                        borderColor: isDark ? '#333333' : '#e2e8f0',
                        borderRadius: '16px',
                        fontSize: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={analyticsMetric === 'maxReps' ? 'maxReps' : 'totalReps'}
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorEmerald)"
                    />
                  </AreaChart>
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

                return (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-neutral-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            {session.routineName}
                          </h4>
                          {session.routineCategory && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300">
                              {session.routineCategory}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-400">{formattedDate}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'الإنجاز' : 'OUTPUT'}</span>
                          <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {session.totalReps || 0} reps • {session.durationMinutes || 45}m
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
                      {session.exercises?.map((ex, exI) => (
                        <div
                          key={ex.id || exI}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                              {ex.name}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {ex.sets?.length || 0} sets
                            </span>
                          </div>
                          
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
                        </div>
                      ))}
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
