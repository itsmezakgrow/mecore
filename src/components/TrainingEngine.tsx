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
  AlertCircle
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
import { WorkoutSession, WorkoutExercise, WorkoutSet, WorkoutRoutineTemplate } from '../types';
import { addWorkout, deleteWorkout } from '../services/firestoreService';
import { playCelebrationChime } from '../utils/focusAudio';

interface TrainingEngineProps {
  workouts: WorkoutSession[];
  isDark?: boolean;
  lang?: 'en' | 'ar';
}

// Built-in Calisthenics & Strength Presets
const ROUTINE_TEMPLATES: WorkoutRoutineTemplate[] = [
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
      { name: 'Pull-ups', targetSets: 4, targetReps: 8, defaultWeight: 'Bodyweight' },
      { name: 'Chin-ups', targetSets: 3, targetReps: 8, defaultWeight: 'Bodyweight' },
      { name: 'Australian Rows', targetSets: 4, targetReps: 12, defaultWeight: 'Bodyweight' },
      { name: 'Scapular Pull-ups', targetSets: 3, targetReps: 12, defaultWeight: 'Bodyweight' },
    ]
  },
  {
    id: 'legs-explosive',
    name: 'Legs & Lower Body Power',
    category: 'Legs',
    description: 'Quadriceps, Glutes, Hamstrings, and Calves endurance',
    exercises: [
      { name: 'Bodyweight Squats', targetSets: 4, targetReps: 25, defaultWeight: 'Bodyweight' },
      { name: 'Bulgarian Split Squats', targetSets: 3, targetReps: 12, defaultWeight: 'Bodyweight' },
      { name: 'Pistol Squats (Assisted/Free)', targetSets: 3, targetReps: 6, defaultWeight: 'Bodyweight' },
      { name: 'Standing Calf Raises', targetSets: 4, targetReps: 20, defaultWeight: 'Bodyweight' },
    ]
  },
  {
    id: 'skills-core',
    name: 'Skills & Isometric Core',
    category: 'Calisthenics Skills',
    description: 'Muscle-up transitions, L-Sit, Handstand balance, and Core compression',
    exercises: [
      { name: 'L-Sit Hold (Secs)', targetSets: 4, targetReps: 15, defaultWeight: 'Bodyweight' },
      { name: 'Handstand Wall Holds (Secs)', targetSets: 4, targetReps: 30, defaultWeight: 'Bodyweight' },
      { name: 'Hanging Knee/Leg Raises', targetSets: 4, targetReps: 12, defaultWeight: 'Bodyweight' },
      { name: 'Hollow Body Hold (Secs)', targetSets: 3, targetReps: 45, defaultWeight: 'Bodyweight' },
    ]
  },
  {
    id: 'fullbody-calisthenics',
    name: 'Full Body Calisthenics Engine',
    category: 'Full Body',
    description: 'Total body athletic performance and high metabolic output',
    exercises: [
      { name: 'Pull-ups', targetSets: 3, targetReps: 8, defaultWeight: 'Bodyweight' },
      { name: 'Dips', targetSets: 3, targetReps: 10, defaultWeight: 'Bodyweight' },
      { name: 'Push-ups', targetSets: 3, targetReps: 15, defaultWeight: 'Bodyweight' },
      { name: 'Jump Squats', targetSets: 3, targetReps: 15, defaultWeight: 'Bodyweight' },
      { name: 'Plank Hold (Secs)', targetSets: 3, targetReps: 60, defaultWeight: 'Bodyweight' },
    ]
  }
];

const POPULAR_EXERCISES = [
  'Push-ups',
  'Pull-ups',
  'Dips',
  'Chin-ups',
  'Pike Push-ups',
  'Handstand Push-ups',
  'Muscle-ups',
  'Australian Rows',
  'Diamond Push-ups',
  'Bodyweight Squats',
  'Pistol Squats',
  'Bulgarian Split Squats',
  'L-Sit Hold (Secs)',
  'Hanging Leg Raises',
  'Plank Hold (Secs)',
  'Dragon Flag',
  'Decline Push-ups',
  'Incline Push-ups',
  'Archer Push-ups',
  'Archer Pull-ups'
];

export const TrainingEngine: React.FC<TrainingEngineProps> = ({
  workouts = [],
  isDark = false,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';

  // Navigation sub-tab
  const [activeTab, setActiveTab] = useState<'logger' | 'analytics' | 'history'>('logger');

  // Active workout logger states
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [routineName, setRoutineName] = useState<string>('Push Day (Calisthenics)');
  const [routineCategory, setRoutineCategory] = useState<'Push' | 'Pull' | 'Legs' | 'Full Body' | 'Calisthenics Skills' | 'Core & Mobility' | 'Custom'>('Push');
  const [workoutDate, setWorkoutDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  // Workout Session Duration Timer
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
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

  // Saving state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Exercise collapsing state to avoid long scrolls
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

  // Load a preset routine template
  const handleLoadPreset = (template: WorkoutRoutineTemplate) => {
    setRoutineName(template.name);
    setRoutineCategory(template.category);
    setCollapsedExercises({}); // Clear collapsed states
    const newExs: WorkoutExercise[] = template.exercises.map((item, idx) => ({
      id: `ex-${Date.now()}-${idx}`,
      name: item.name,
      sets: Array.from({ length: item.targetSets }).map((_, sIdx) => ({
        id: `s-${Date.now()}-${idx}-${sIdx}`,
        setNumber: sIdx + 1,
        reps: item.targetReps,
        weight: item.defaultWeight,
        weightUnit: 'bw',
        completed: false
      }))
    }));
    setExercises(newExs);
    setElapsedSeconds(0);
    setIsTimerRunning(false);
    setIsSessionActive(true);
  };

  // Start an empty custom workout session
  const handleStartCustomWorkout = () => {
    setRoutineName(isAr ? 'تمرين مخصص جديد' : 'Custom Workout Session');
    setRoutineCategory('Custom');
    setExercises([]);
    setCollapsedExercises({});
    setElapsedSeconds(0);
    setIsTimerRunning(false);
    setIsSessionActive(true);
  };

  // Discard/Cancel active session
  const handleCancelWorkout = () => {
    if (window.confirm(isAr ? 'هل تريد إلغاء التمرين الحالي؟ لن يتم حفظ البيانات.' : 'Discard current workout session? Your active logs will be lost.')) {
      setIsSessionActive(false);
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      setExercises([]);
      cancelRestTimer();
    }
  };

  // Add a new exercise to active routine
  const handleAddExercise = (exerciseName: string) => {
    if (!exerciseName.trim()) return;
    const newExercise: WorkoutExercise = {
      id: `ex-${Date.now()}`,
      name: exerciseName.trim(),
      sets: [
        { id: `s-${Date.now()}-1`, setNumber: 1, reps: 10, weight: 'Bodyweight', weightUnit: 'bw', completed: false },
        { id: `s-${Date.now()}-2`, setNumber: 2, reps: 10, weight: 'Bodyweight', weightUnit: 'bw', completed: false },
        { id: `s-${Date.now()}-3`, setNumber: 3, reps: 10, weight: 'Bodyweight', weightUnit: 'bw', completed: false },
      ]
    };
    setExercises((prev) => [...prev, newExercise]);
    setCustomExerciseName('');
    setShowExerciseSuggestions(false);
  };

  // Remove an exercise
  const handleRemoveExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  };

  // Add a set to an exercise (duplicates last set reps/weight for speed)
  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSetNumber = ex.sets.length + 1;
        const newSet: WorkoutSet = {
          id: `s-${Date.now()}-${newSetNumber}`,
          setNumber: newSetNumber,
          reps: lastSet ? lastSet.reps : 10,
          weight: lastSet ? lastSet.weight : 'Bodyweight',
          weightUnit: lastSet?.weightUnit || 'bw',
          completed: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  // Remove a set from an exercise
  const handleRemoveSet = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const filtered = ex.sets.filter((s) => s.id !== setId);
        // Renumber sets
        const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return { ...ex, sets: renumbered };
      })
    );
  };

  // Update specific set values
  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: keyof WorkoutSet,
    value: any
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            const updated = { ...s, [field]: value };
            return updated;
          })
        };
      })
    );
  };

  // Toggle set completion + trigger rest timer
  const handleToggleSetComplete = (exerciseId: string, setId: string) => {
    setExercises((prev) => {
      return prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const newSets = ex.sets.map((s) => {
          if (s.id !== setId) return s;
          const nextCompleted = !s.completed;
          if (nextCompleted) {
            // Auto trigger rest timer if not already running
            startRestTimer(60);
          }
          return { ...s, completed: nextCompleted };
        });

        // Keep exercises expanded so user can see and edit set logs cleanly

        return { ...ex, sets: newSets };
      });
    });
  };

  // Calculate live session summary totals
  const sessionStats = useMemo(() => {
    let totalSets = 0;
    let completedSets = 0;
    let totalReps = 0;
    let calculatedVolume = 0;

    exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        totalSets++;
        if (set.completed) {
          completedSets++;
          const reps = Number(set.reps) || 0;
          totalReps += reps;

          // Numeric weight parsing for added load
          let weightVal = 0;
          if (typeof set.weight === 'number') {
            weightVal = set.weight;
          } else if (typeof set.weight === 'string') {
            const num = parseFloat(set.weight.replace(/[^0-9.]/g, ''));
            if (!isNaN(num)) weightVal = num;
          }
          // Volume = reps * (bodyweight base factor + added weight)
          calculatedVolume += reps * (weightVal > 0 ? weightVal : 1);
        }
      });
    });

    return {
      totalSets,
      completedSets,
      totalReps,
      calculatedVolume: Math.round(calculatedVolume),
    };
  }, [exercises]);

  // Save workout to Firestore
  const handleSaveWorkout = async () => {
    if (!routineName.trim()) {
      alert(isAr ? 'يرجى إدخال اسم التمرين' : 'Please provide a routine name');
      return;
    }

    if (exercises.length === 0) {
      alert(isAr ? 'يرجى إضافة تمرين واحد على الأقل' : 'Please add at least one exercise');
      return;
    }

    setIsSaving(true);
    try {
      const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
      
      const payload: Omit<WorkoutSession, 'id'> = {
        routineName: routineName.trim(),
        routineCategory,
        exercises,
        durationMinutes: durationMins,
        date: workoutDate || new Date().toISOString().split('T')[0],
        createdAt: Date.now(),
        notes: workoutNotes.trim() || undefined,
        totalVolume: sessionStats.calculatedVolume,
        totalReps: sessionStats.totalReps,
        totalSets: sessionStats.completedSets,
      };

      await addWorkout(payload);
      playCelebrationChime();
      
      setSaveSuccessMessage(isAr ? '🎉 تم تسجيل التمرين في السحابة بنجاح!' : '🎉 Workout successfully logged & synced to Cloud!');
      setTimeout(() => setSaveSuccessMessage(null), 4000);

      // Reset timer and reset completed marks
      setIsTimerRunning(false);
      setElapsedSeconds(0);
      cancelRestTimer();
      setIsSessionActive(false); // Done with the active session!

      // Reset completion checkboxes so routine can be re-run
      setExercises([]);

      // Jump to analytics tab so user immediately sees their PR and progress chart update!
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
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا التمرين من السجل؟' : 'Are you sure you want to delete this workout log?')) {
      return;
    }
    try {
      await deleteWorkout(id);
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
    setIsSessionActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // Progressive Overload & Analytics Calculations
  // -------------------------------------------------------------
  
  // Extract all unique exercise names from all past workouts + active routine
  const allUniqueExercises = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach((w) => {
      w.exercises?.forEach((ex) => {
        if (ex.name) set.add(ex.name.trim());
      });
    });
    // Add default popular ones
    POPULAR_EXERCISES.forEach((p) => set.add(p));
    return Array.from(set).sort();
  }, [workouts]);

  // Compute Personal Records (PRs) across historical workouts
  const prAnalytics = useMemo(() => {
    let globalMaxReps = 0;
    let globalMaxRepsExercise = '';
    let globalMaxRepsDate = '';

    let exerciseMaxReps = 0;
    let exerciseMaxRepsDate = '';
    let exerciseMaxVolume = 0;
    let totalExerciseSessions = 0;
    let totalRepsInSelected = 0;

    // Filter workouts by selected timeframe
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
          
          // Global Max Reps in a single set
          if (reps > globalMaxReps) {
            globalMaxReps = reps;
            globalMaxRepsExercise = exName;
            globalMaxRepsDate = w.date;
          }

          // Exercise-specific Max Reps in a single set
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

  // Construct chart data points: chronological date vs reps/volume
  const chartData = useMemo(() => {
    const rawMap: Record<string, { date: string; maxReps: number; totalReps: number; volume: number; routine: string }> = {};

    // Sort chronologically ascending for line graph
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
        // Format display date
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
    <div id="training-engine-container" className="space-y-6 max-w-7xl mx-auto pb-24 text-slate-800 dark:text-slate-100">
      
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Dumbbell size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'محرك التدريب والكاليسثينكس' : 'Training & Calisthenics Engine'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                PRO OVERLOAD
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'تسجيل التمارين، المجموعات والتكرارات مع تتبع زيادة الحمل التدريجي (Progressive Overload) والأرقام القياسية'
                : 'Interactive workout logger, sets/reps tracker, progressive overload analytics, and personal record (PR) engine.'}
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-neutral-900/90 rounded-2xl border border-slate-200 dark:border-neutral-800 self-start md:self-auto">
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
            <span>{isAr ? 'تسجيل التمرين' : 'Workout Logger'}</span>
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
            <span>{isAr ? 'التحليلات والأرقام القياسية' : 'Progress & PRs'}</span>
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
            <span>{isAr ? 'السجل التاريخي' : 'History Log'}</span>
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
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold">{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-xs text-emerald-700 dark:text-emerald-400 underline font-semibold cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 2: PROGRESSIVE OVERLOAD & ANALYTICS (THE GRAPH)                   */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          
          {/* PR & Milestone Summary Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* PR Badge 1: Highest Single-Set Reps */}
            <div className="bg-white dark:bg-[#18191D] p-4.5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 dark:bg-amber-400/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-500" />
                  {isAr ? 'الرقم القياسي (أقصى تكرار)' : 'Personal Record (PR)'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase">
                  MAX REPS
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                  <span>{prAnalytics.exerciseMaxReps || 0}</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? 'تكرار / مجموعة' : 'reps in 1 set'}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {selectedExerciseFilter === 'All'
                    ? (prAnalytics.globalMaxRepsExercise ? `${prAnalytics.globalMaxRepsExercise} (${prAnalytics.globalMaxRepsDate})` : (isAr ? 'سجل أول تمرين لك' : 'Log your first session'))
                    : `${selectedExerciseFilter} ${prAnalytics.exerciseMaxRepsDate ? `(${prAnalytics.exerciseMaxRepsDate})` : ''}`}
                </p>
              </div>
            </div>

            {/* PR Badge 2: Peak Session Volume */}
            <div className="bg-white dark:bg-[#18191D] p-4.5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-400/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Zap size={14} className="text-emerald-500" />
                  {isAr ? 'أعلى حجم تدريبي بجلسة' : 'Peak Session Volume'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase">
                  VOLUME PR
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                  <span>{prAnalytics.exerciseMaxVolume || (workouts[0]?.totalReps || 0)}</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? 'إجمالي التكرارات' : 'total reps'}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {isAr ? 'أعلى جهد مجمع في يوم واحد' : 'Highest cumulative output in a single workout'}
                </p>
              </div>
            </div>

            {/* PR Badge 3: Cumulative Reps in Timeframe */}
            <div className="bg-white dark:bg-[#18191D] p-4.5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Flame size={14} className="text-rose-500" />
                  {isAr ? 'إجمالي التكرارات المنجزة' : 'Total Reps Crushed'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase">
                  WORKOUT LOAD
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                  <span>{prAnalytics.totalRepsInSelected || workouts.reduce((acc, cur) => acc + (cur.totalReps || 0), 0)}</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? 'تكرار' : 'reps'}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {isAr ? `خلال آخر ${selectedTimeframe === 'all' ? 'فترة' : selectedTimeframe + ' يوم'}` : `Across selected ${selectedTimeframe === 'all' ? 'history' : selectedTimeframe + ' days'}`}
                </p>
              </div>
            </div>

            {/* PR Badge 4: Total Logged Workouts */}
            <div className="bg-white dark:bg-[#18191D] p-4.5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-500" />
                  {isAr ? 'الجلسات المسجلة' : 'Sessions Logged'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase">
                  CONSISTENCY
                </span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono flex items-baseline gap-1.5">
                  <span>{workouts.length}</span>
                  <span className="text-xs font-bold text-slate-400">{isAr ? 'تمرين' : 'workouts'}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {isAr ? 'التزام حديدي مع المزامنة السحابية' : 'Cloud synchronized training records'}
                </p>
              </div>
            </div>
          </div>

          {/* Progressive Overload Line / Area Chart Container */}
          <div className="bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
            
            {/* Graph Controls Header */}
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

              {/* Filters: Exercise Selector & Timeframe */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Exercise Filter Dropdown */}
                <select
                  id="exercise-filter-select"
                  aria-label="Filter chart by exercise"
                  value={selectedExerciseFilter}
                  onChange={(e) => setSelectedExerciseFilter(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="All">{isAr ? 'جميع التمارين (الحجم الإجمالي)' : 'All Exercises (Total Volume)'}</option>
                  {allUniqueExercises.map((exName) => (
                    <option key={exName} value={exName}>
                      {exName}
                    </option>
                  ))}
                </select>

                {/* Metric Selector */}
                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-700 text-[11px] font-bold">
                  <button
                    onClick={() => setAnalyticsMetric('maxReps')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      analyticsMetric === 'maxReps'
                        ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isAr ? 'أقصى تكرار' : 'Max Reps'}
                  </button>
                  <button
                    onClick={() => setAnalyticsMetric('totalReps')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      analyticsMetric === 'totalReps'
                        ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {isAr ? 'إجمالي التكرارات' : 'Total Reps'}
                  </button>
                </div>

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

            {/* Recharts Canvas */}
            <div className="h-64 sm:h-72 w-full pt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mintGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262626' : '#F1F5F9'} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke={isDark ? '#737373' : '#94A3B8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#737373' : '#94A3B8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#18191D] text-white p-3 rounded-2xl border border-neutral-700 shadow-xl text-xs space-y-1 z-50">
                              <p className="font-bold text-emerald-400">{data.routine}</p>
                              <p className="text-slate-300 font-mono text-[11px]">{data.date}</p>
                              <div className="pt-1 border-t border-neutral-800 space-y-0.5">
                                <p className="flex justify-between gap-4">
                                  <span className="text-slate-400">{isAr ? 'أقصى تكرار بمجموعة:' : 'Max Reps (Set):'}</span>
                                  <span className="font-bold text-white font-mono">{data.maxReps}</span>
                                </p>
                                <p className="flex justify-between gap-4">
                                  <span className="text-slate-400">{isAr ? 'إجمالي تكرارات الجلسة:' : 'Total Reps:'}</span>
                                  <span className="font-bold text-emerald-300 font-mono">{data.totalReps}</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={analyticsMetric === 'maxReps' ? 'maxReps' : 'totalReps'}
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#mintGrad)"
                      activeDot={{ r: 6, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-slate-50/50 dark:bg-neutral-900/30">
                  <Dumbbell size={32} className="text-slate-300 dark:text-neutral-600 mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'لا توجد بيانات كافية لرسم المنحنى' : 'No workout data logged in this timeframe'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                    {isAr
                      ? 'سجل تمرينك الأول من قسم "تسجيل التمرين" لترى منحنى القوة والأرقام القياسية يتحدث تلقائياً'
                      : 'Log your first workout session to start charting your progressive overload trajectory.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 1: THE WORKOUT LOGGER UI (INTERACTIVE SETS & REPS ENGINE)        */}
      {/* ========================================================================= */}
      {activeTab === 'logger' && !isSessionActive && (
        <div className="animate-fadeIn space-y-6">
          {/* Main Welcome Message */}
          <div className="text-center max-w-2xl mx-auto py-8 px-4 space-y-3.5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <Dumbbell size={32} className="stroke-[2]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'روتينك التدريبي اليومي' : 'Your Daily Calisthenics Routine'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isAr 
                ? 'اختر روتيناً تدريبياً لبدء تتبع حملك التدريبي وتكراراتك، أو صمم جلسة تمرين مخصصة فارغة.' 
                : 'Choose a structured calisthenics preset to auto-populate your workout, repeat a recent session, or craft a custom lift from scratch.'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleStartCustomWorkout}
                className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-black text-xs sm:text-sm font-black flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>{isAr ? 'بدء جلسة مخصصة فارغة' : 'Start Custom Empty Session'}</span>
              </button>
            </div>
          </div>

          {/* Quick Launcher Presets Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 px-1">
              <Sparkles size={16} className="text-emerald-500" />
              <span>{isAr ? 'قوالب التمارين والروتينات' : 'Available Routine Templates'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ROUTINE_TEMPLATES.map((tmpl) => {
                const exerciseSummary = tmpl.exercises.map(e => e.name).slice(0, 3).join(', ') + (tmpl.exercises.length > 3 ? '...' : '');
                
                let cardColor = 'from-emerald-50/40 to-teal-50/10 dark:from-emerald-950/10 dark:to-neutral-900';
                if (tmpl.category === 'Pull') {
                  cardColor = 'from-blue-50/40 to-indigo-50/10 dark:from-blue-950/10 dark:to-neutral-900';
                } else if (tmpl.category === 'Legs') {
                  cardColor = 'from-amber-50/40 to-orange-50/10 dark:from-amber-950/10 dark:to-neutral-900';
                } else if (tmpl.category === 'Calisthenics Skills') {
                  cardColor = 'from-purple-50/40 to-indigo-50/10 dark:from-purple-950/10 dark:to-neutral-900';
                } else if (tmpl.category === 'Full Body') {
                  cardColor = 'from-rose-50/40 to-red-50/10 dark:from-rose-950/10 dark:to-neutral-900';
                }

                return (
                  <div
                    key={tmpl.id}
                    className={`p-6 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs bg-white dark:bg-[#18191D] bg-gradient-to-br ${cardColor} flex flex-col justify-between hover:shadow-md transition-all group`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/80 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-neutral-700/60">
                          {tmpl.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">
                          {tmpl.exercises.length} {isAr ? 'تمارين' : 'exercises'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                          {tmpl.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {tmpl.description || (isAr ? 'برنامج تدريبي مخصص لزيادة القوة وبناء العضلات.' : 'Core calisthenics training program for optimal strength progression.')}
                        </p>
                      </div>

                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">
                          {isAr ? 'التدريبات تشمل:' : 'Exercises include:'}
                        </span>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate font-mono">
                          {exerciseSummary}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-neutral-850">
                      <button
                        onClick={() => handleLoadPreset(tmpl)}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs hover:scale-[1.01] flex items-center justify-center gap-1.5"
                      >
                        <Play size={12} className="stroke-[3] fill-current" />
                        <span>{isAr ? 'ابدأ روتين التدريب' : 'Start Workout Routine'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent History Load Option (Repeat Workout) */}
          {workouts.length > 0 && (
            <div className="pt-4 space-y-3">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 px-1">
                <History size={16} className="text-emerald-500" />
                <span>{isAr ? 'تكرار جلسة تمرين سابقة' : 'Repeat Recent Logged Session'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workouts.slice(0, 2).map((workout) => (
                  <div
                    key={workout.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {workout.routineName}
                        </h4>
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-neutral-800 text-slate-500 px-1.5 py-0.2 rounded-md">
                          {workout.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {workout.exercises.length} {isAr ? 'تمارين مبرمجة' : 'exercises'} | {workout.totalSets || 0} مجموعات | {workout.totalReps || 0} تكرارات
                      </p>
                    </div>

                    <button
                      onClick={() => handleLoadHistoricalWorkout(workout)}
                      className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 text-xs font-black transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 border border-slate-200 dark:border-neutral-700"
                    >
                      <RotateCcw size={12} className="stroke-[2.5]" />
                      <span>{isAr ? 'تكرار نفس التمرين' : 'Repeat Session'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logger' && isSessionActive && (
        <div className="animate-fadeIn">
          {/* Responsive Two-Column Grid: Left holds setup & presets, Right holds active exercise logger */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Routine Configuration, Timers & Reflections (Sticky on Desktop) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto pr-1">
              
              {/* Routine Header & Controls Card */}
              <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    {isAr ? 'اسم الروتين التدريبي' : 'Workout Routine Name'}
                  </label>
                  <input
                    id="routine-name-input"
                    type="text"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    placeholder={isAr ? 'مثال: Push Day' : 'e.g., Push Day'}
                    className="w-full text-sm font-black px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      {isAr ? 'التصنيف' : 'Category'}
                    </label>
                    <select
                      id="routine-category-select"
                      aria-label="Routine category"
                      value={routineCategory}
                      onChange={(e) => setRoutineCategory(e.target.value as any)}
                      className="w-full text-xs font-bold px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="Push">Push</option>
                      <option value="Pull">Pull</option>
                      <option value="Legs">Legs</option>
                      <option value="Full Body">Full Body</option>
                      <option value="Calisthenics Skills">Skills</option>
                      <option value="Core & Mobility">Core</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      {isAr ? 'تاريخ الجلسة' : 'Date'}
                    </label>
                    <input
                      id="workout-date-input"
                      type="date"
                      value={workoutDate}
                      onChange={(e) => setWorkoutDate(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                    />
                  </div>
                </div>

                {/* Live Stopwatch Tracker */}
                <div className="p-3.5 rounded-2xl bg-slate-950 text-white border border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300">{isAr ? 'المدة المنقضية:' : 'Elapsed Time:'}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono font-bold text-sm text-emerald-400">
                    <span>{formatTime(elapsedSeconds)}</span>
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                    >
                      {isTimerRunning ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Inter-Set Rest Timer Card */}
              {restSecondsRemaining !== null && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer size={16} className="animate-pulse text-emerald-300" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
                        {isAr ? 'مؤقت الاستراحة' : 'REST INTERVAL'}
                      </span>
                    </div>
                    <span className="text-xl font-black font-mono bg-black/15 px-2 py-0.5 rounded-lg">
                      {formatTime(restSecondsRemaining)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setRestSecondsRemaining((prev) => (prev ? prev + 30 : 30))}
                      className="flex-1 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-[10px] font-bold cursor-pointer transition-colors text-center"
                    >
                      +30s
                    </button>
                    <button
                      onClick={cancelRestTimer}
                      className="flex-1 py-1.5 rounded-xl bg-black/20 hover:bg-black/35 text-[10px] font-bold cursor-pointer transition-colors text-center"
                    >
                      {isAr ? 'تخطي' : 'Skip Rest'}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes & Session Reflection Card */}
              <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  {isAr ? 'ملاحظات وتأملات الجلسة' : 'Workout Notes & Reflections'}
                </label>
                <textarea
                  id="workout-notes-textarea"
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  placeholder={isAr ? 'كيف كانت الطاقة؟ هل حطمت رقماً قياسياً؟...' : 'Form cues, energy levels, records...'}
                  rows={2}
                  className="w-full text-xs px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

            </div>

            {/* Right Column: Active Exercise Logger List */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Exercises List Header */}
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-emerald-500" />
                  {isAr ? 'تمارين الجلسة الحالية' : 'Active Routine Exercises'}
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {exercises.length} {isAr ? 'تمارين مضافة' : 'exercises listed'}
                </span>
              </div>

              {exercises.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-3xl bg-slate-50/50 dark:bg-neutral-900/10 space-y-2">
                  <Plus size={32} className="mx-auto text-slate-300 dark:text-neutral-700 animate-pulse" />
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                    {isAr ? 'لا توجد تمارين مضافة في الروتين حالياً' : 'Your active workout routine is empty'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'اختر قالباً جاهزاً من القائمة الجانبية أو أضف تمارين مخصصة أدناه لبدء تتبع أدائك' : 'Load a preset on the left, or use the tool below to add movements.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exercises.map((exercise, exIdx) => {
                    const isCollapsed = !!collapsedExercises[exercise.id];
                    const completedSetsCount = exercise.sets.filter((s) => s.completed).length;
                    const totalSetsCount = exercise.sets.length;
                    const isAllCompleted = completedSetsCount === totalSetsCount && totalSetsCount > 0;

                    return (
                      <div
                        key={exercise.id}
                        className={`bg-white dark:bg-[#18191D] rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs transition-all ${
                          isCollapsed ? 'p-3.5 sm:p-4' : 'p-5 sm:p-6 space-y-4'
                        }`}
                      >
                        {/* 1. COLLAPSED VIEW */}
                        {isCollapsed ? (
                          <div className="flex items-center justify-between gap-3 animate-fadeIn">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleToggleCollapse(exercise.id)}
                                className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 cursor-pointer ${
                                  isAllCompleted 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-neutral-800'
                                }`}
                              >
                                {isAllCompleted ? '✓' : `#${exIdx + 1}`}
                              </button>
                              <div className="truncate">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>{exercise.name}</span>
                                  {isAllCompleted && (
                                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0 border border-emerald-100 dark:border-emerald-900/60">
                                      {isAr ? 'مكتمل' : 'Done'}
                                    </span>
                                  )}
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
                                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-900/40 dark:hover:bg-neutral-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                              >
                                {isAr ? 'توسيع' : 'Expand'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(exercise.id)}
                                className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* 2. FULL DETAILED EXPANDED VIEW */
                          <div className="animate-fadeIn space-y-4">
                            {/* Exercise Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800/80">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCollapse(exercise.id)}
                                  className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-black text-xs flex items-center justify-center cursor-pointer"
                                  title={isAr ? 'طي التمرين' : 'Collapse Exercise'}
                                >
                                  #{exIdx + 1}
                                </button>
                                <div>
                                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                    {exercise.name}
                                  </h3>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {exercise.category || (isAr ? 'تمرين كاليسثينكس' : 'Calisthenics Movement')}
                                  </span>
                                </div>
                              </div>

                              {/* Rest Buttons & Remove Exercise */}
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-neutral-800 text-[10px] font-bold">
                                  <span className="text-slate-400 px-1">{isAr ? 'استراحة:' : 'Rest:'}</span>
                                  <button
                                    type="button"
                                    onClick={() => startRestTimer(30)}
                                    className="px-1.5 py-0.5 rounded hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
                                  >
                                    30s
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startRestTimer(60)}
                                    className="px-1.5 py-0.5 rounded hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
                                  >
                                    60s
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startRestTimer(90)}
                                    className="px-1.5 py-0.5 rounded hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
                                  >
                                    90s
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleCollapse(exercise.id)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                  title={isAr ? 'طي التمرين' : 'Collapse exercise'}
                                >
                                  <ChevronDown size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveExercise(exercise.id)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                  title={isAr ? 'حذف التمرين' : 'Remove exercise'}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                             {/* Sets List */}
                             <div className="space-y-3.5">
                               {exercise.sets.map((set) => {
                                 const isDone = set.completed;
                                 return (
                                   <div
                                     key={set.id}
                                     className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl transition-all ${
                                       isDone
                                         ? 'bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-800/20 text-emerald-900 dark:text-emerald-200'
                                         : 'bg-slate-50/60 dark:bg-neutral-900/30 border border-slate-100 dark:border-neutral-800/40 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-900/50'
                                     }`}
                                   >
                                     {/* Left: Set number and Weight field */}
                                     <div className="flex items-center gap-3 flex-1 min-w-0">
                                       <span className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                                         {set.setNumber}
                                       </span>
                                       
                                       <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                         <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{isAr ? 'الوزن:' : 'Weight:'}</span>
                                         <input
                                           type="text"
                                           value={set.weight}
                                           onChange={(e) => handleUpdateSet(exercise.id, set.id, 'weight', e.target.value)}
                                           placeholder={isAr ? 'وزن الجسم' : 'Bodyweight'}
                                           className={`w-full max-w-[120px] text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
                                             isDone
                                               ? 'bg-emerald-100/30 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300'
                                               : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                           }`}
                                         />
                                       </div>
                                     </div>

                                     {/* Middle: Reps with Tap Targets */}
                                     <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-start">
                                       <div className="flex items-center gap-2">
                                         <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">{isAr ? 'التكرار:' : 'Reps:'}</span>
                                         <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 rounded-xl p-0.5 border border-slate-200 dark:border-neutral-700">
                                           <button
                                             type="button"
                                             onClick={() => handleUpdateSet(exercise.id, set.id, 'reps', Math.max(0, (Number(set.reps) || 0) - 1))}
                                             className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer select-none text-xs"
                                           >
                                             -
                                           </button>
                                           <input
                                             type="number"
                                             value={set.reps}
                                             onChange={(e) => handleUpdateSet(exercise.id, set.id, 'reps', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                             className={`w-8 text-center font-mono font-bold text-xs bg-transparent focus:outline-hidden ${
                                               isDone ? 'text-emerald-800 dark:text-emerald-300 font-black' : 'text-slate-800 dark:text-slate-200'
                                             }`}
                                           />
                                           <button
                                             type="button"
                                             onClick={() => handleUpdateSet(exercise.id, set.id, 'reps', (Number(set.reps) || 0) + 1)}
                                             className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 font-black flex items-center justify-center cursor-pointer select-none text-xs"
                                           >
                                             +
                                           </button>
                                         </div>
                                       </div>

                                       {/* Right: Checkmark & Trash Buttons */}
                                       <div className="flex items-center gap-1.5">
                                         <button
                                           type="button"
                                           onClick={() => handleToggleSetComplete(exercise.id, set.id)}
                                           className={`px-3 py-1.5 rounded-xl text-[11px] font-black tracking-wide flex items-center gap-1 cursor-pointer transition-all ${
                                             isDone
                                               ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                               : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-neutral-700'
                                           }`}
                                         >
                                           {isDone ? <Check size={12} className="stroke-[3]" /> : null}
                                           <span>{isDone ? (isAr ? 'مكتمل' : 'Done') : (isAr ? 'إنجاز' : 'Check')}</span>
                                         </button>

                                         {exercise.sets.length > 1 && (
                                           <button
                                             type="button"
                                             onClick={() => handleRemoveSet(exercise.id, set.id)}
                                             className="p-1.5 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                                             title="Delete set"
                                           >
                                             <Trash2 size={13} />
                                           </button>
                                         )}
                                       </div>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>

                            {/* Exercise Footer: Add set button */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-neutral-900/20">
                              <button
                                type="button"
                                onClick={() => handleAddSet(exercise.id)}
                                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 transition-colors cursor-pointer"
                              >
                                <Plus size={12} className="stroke-[2.5]" />
                                <span>{isAr ? 'إضافة مجموعة (+Set)' : '+ Add Set'}</span>
                              </button>

                              <span className="text-[10px] text-slate-400 font-mono">
                                {completedSetsCount}/{totalSetsCount} {isAr ? 'مجموعات مكتملة' : 'sets completed'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Another Exercise Input / Suggestions Box */}
              <div className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus size={16} className="text-emerald-500" />
                  {isAr ? 'إضافة تمرين جديد للروتين' : 'Add Another Exercise to Routine'}
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    id="custom-exercise-input"
                    type="text"
                    value={customExerciseName}
                    onChange={(e) => {
                      setCustomExerciseName(e.target.value);
                      setShowExerciseSuggestions(true);
                    }}
                    onFocus={() => setShowExerciseSuggestions(true)}
                    placeholder={isAr ? 'اكتب اسم التمرين (مثال: Pull-ups, Dips...)' : 'Type exercise name or pick from library...'}
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

                {/* Popular Calisthenics Library Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    {isAr ? 'مكتبة تمارين الكاليسثينكس السريعة:' : 'Quick library suggestions:'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {POPULAR_EXERCISES.slice(0, 10).map((ex) => (
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
              </div>

              {/* Sticky Bottom Save Bar */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-2xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'المجموعات' : 'COMPLETED SETS'}</span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                      {sessionStats.completedSets} <span className="text-xs text-slate-400">/ {sessionStats.totalSets}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'إجمالي التكرارات' : 'TOTAL REPS'}</span>
                    <p className="text-xl sm:text-2xl font-black font-mono text-white">
                      {sessionStats.totalReps}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">{isAr ? 'المدة' : 'DURATION'}</span>
                    <div className="flex items-center gap-2">
                      <p className="text-xl sm:text-2xl font-black font-mono text-slate-300">
                        {formatTime(elapsedSeconds)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isTimerRunning 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 animate-pulse'
                        }`}
                        title={isTimerRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause Timer') : (isAr ? 'بدء المؤقت' : 'Start Timer')}
                      >
                        {isTimerRunning ? <Pause size={14} className="stroke-[2.5]" /> : <Play size={14} className="stroke-[2.5] fill-current" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save & Cancel Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelWorkout}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white/90 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
                  >
                    <span>{isAr ? 'إلغاء التمرين' : 'Cancel Workout'}</span>
                  </button>

                  <button
                    id="save-workout-session-btn"
                    onClick={handleSaveWorkout}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} className="stroke-[2.5]" />
                    )}
                    <span>{isAr ? 'حفظ جلسة التمرين' : 'Save Workout'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKOUT CHRONICLES & HISTORICAL LOGS TAB                                 */}
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
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isAr
                  ? 'ابدأ أول جلسة كاليسثينكس الآن وسجل أرقامك لتتابع زيادة الحمل التدريجي.'
                  : 'Start your first training session from the Workout Logger to archive sets, reps, and PRs.'}
              </p>
              <button
                onClick={() => setActiveTab('logger')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                {isAr ? 'ابدأ تمرينك الآن' : 'Start Workout Now'}
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
                    className="bg-white dark:bg-[#18191D] p-5 rounded-3xl border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3.5 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-colors"
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
                          <span className="text-[10px] uppercase font-bold text-slate-400">{isAr ? 'الإجمالي' : 'OUTPUT'}</span>
                          <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {session.totalReps || 0} reps • {session.durationMinutes || 25}m
                          </p>
                        </div>

                        <button
                          onClick={() => handleLoadHistoricalWorkout(session)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Load as today's routine template"
                        >
                          <Copy size={12} />
                          <span>{isAr ? 'تكرار التمرين' : 'Repeat Routine'}</span>
                        </button>

                        <button
                          onClick={() => session.id && handleDeleteWorkout(session.id)}
                          className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Delete workout log"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Breakdown of exercises & sets in this past workout */}
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
                          
                          {/* Sets summary string */}
                          <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {ex.sets?.map((s, sI) => (
                              <span
                                key={s.id || sI}
                                className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 font-bold"
                              >
                                {s.reps}r {s.weight && s.weight !== 'Bodyweight' && s.weight !== '0' ? `(${s.weight})` : ''}
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
    </div>
  );
};
