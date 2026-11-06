import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  BookOpen,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  AlertTriangle,
  Maximize2,
  Play,
  Save,
  Smile,
  Calendar,
  Star,
  Zap,
  Shield,
  Target,
  Award,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  BarChart2,
  Sun,
  Dumbbell,
  Salad,
  Flame,
  Moon,
  Smartphone,
  Frown,
  Edit3,
  ChevronDown,
  ChevronUp,
  Check,
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
  CartesianGrid,
} from 'recharts';
import {
  HabitItem,
  TaskItem,
  FocusSession,
  ReviewEntry,
  DailySleepLog,
  WeeklyPriorityGoal,
  CognitiveReflection,
  VisualizationStory,
  Affirmation
} from '../types';
import { soundManager } from '../utils/soundEffects';
import { FullVisionReaderModal } from './FullVisionReaderModal';
import { AffirmationsModalPopup } from './AffirmationsModalPopup';

interface ReflectionsJournalProps {
  reviews: ReviewEntry[];
  habits: HabitItem[];
  tasks: TaskItem[];
  sleepLogs?: DailySleepLog[];
  focusSessions?: FocusSession[];
  weeklyGoals?: WeeklyPriorityGoal[];
  reflections?: CognitiveReflection[];
  visions?: VisualizationStory[];
  affirmations?: Affirmation[];
  onSaveReview: (review: Omit<ReviewEntry, 'id'>) => Promise<void>;
  onDeleteReview?: (id: string) => Promise<void>;
  onAddReflection?: (r: Omit<CognitiveReflection, 'id'>) => Promise<any>;
  onUpdateReflection?: (id: string, updates: Partial<CognitiveReflection>) => Promise<any>;
  onDeleteReflection?: (id: string) => Promise<any>;
  onAddVision?: (v: Omit<VisualizationStory, 'id'>) => Promise<any>;
  onUpdateVision?: (id: string, updates: Partial<VisualizationStory>) => Promise<any>;
  onDeleteVision?: (id: string) => Promise<any>;
  onAddAffirmation?: (a: Omit<Affirmation, 'id'>) => Promise<any>;
  onDeleteAffirmation?: (id: string) => Promise<any>;
  initialTab?: 'journal' | 'blocks' | 'visions' | 'affirmations';
  isDark?: boolean;
  lang?: 'en' | 'ar';
}

export const ReflectionsJournal: React.FC<ReflectionsJournalProps> = ({
  reviews,
  habits: _habits,
  tasks: _tasks,
  sleepLogs: _sleepLogs = [],
  focusSessions: _focusSessions = [],
  weeklyGoals: _weeklyGoals = [],
  reflections = [],
  visions = [],
  affirmations = [],
  onSaveReview,
  onDeleteReview,
  onAddReflection,
  onUpdateReflection,
  onDeleteReflection,
  onAddVision,
  onUpdateVision,
  onDeleteVision,
  onAddAffirmation,
  onDeleteAffirmation,
  initialTab,
  isDark: _isDark = false,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';

  // Module Tabs: 'journal' | 'blocks' | 'visions' | 'affirmations'
  // Daily Journal is primary default
  const [mainTab, setMainTab] = useState<'journal' | 'blocks' | 'visions' | 'affirmations'>(initialTab || 'journal');

  useEffect(() => {
    if (initialTab) {
      setMainTab(initialTab);
    }
  }, [initialTab]);

  // Modal State for Focus Mode Vision Reader
  const [activeReaderStory, setActiveReaderStory] = useState<VisualizationStory | null>(null);

  // Modal State for Daily Affirmations Flashcard Pop-up
  const [isAffirmationPopupOpen, setIsAffirmationPopupOpen] = useState(false);

  // ---------------- FEATURE 1: DAILY JOURNAL ----------------
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [journalSelectedDate, setJournalSelectedDate] = useState<string>(todayIso);
  const [journalMood, setJournalMood] = useState<'calm' | 'productive' | 'stressed' | 'neutral' | 'tired' | 'victorious'>('productive');
  const [journalRating, setJournalRating] = useState<number>(8);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalWins, setJournalWins] = useState('');
  const [journalLessons, setJournalLessons] = useState('');
  const [journalChallenges, setJournalChallenges] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  // 5 Daily State Sliders (1 to 10)
  const [energyRating, setEnergyRating] = useState<number>(8);
  const [stressRating, setStressRating] = useState<number>(8);
  const [clarityRating, setClarityRating] = useState<number>(8);
  const [disciplineRating, setDisciplineRating] = useState<number>(8);
  const [fulfillmentRating, setFulfillmentRating] = useState<number>(8);

  // Checklists: Energy Boosters & Energy Drains
  const [selectedBoosters, setSelectedBoosters] = useState<string[]>([]);
  const [selectedDrains, setSelectedDrains] = useState<string[]>([]);

  // Analytics View State
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '14d' | '30d' | 'all'>('30d');
  const [chartMetric, setChartMetric] = useState<'composite' | 'energy' | 'stress' | 'clarity' | 'discipline' | 'fulfillment'>('composite');
  const [showAnalyticsSection, setShowAnalyticsSection] = useState<boolean>(true);
  const [showWrittenPrompts, setShowWrittenPrompts] = useState<boolean>(true);

  const moodEmojis: Record<string, string> = {
    calm: '😌',
    productive: '⚡',
    stressed: '😣',
    neutral: '😐',
    tired: '🥱',
    victorious: '🏆',
  };

  const BOOSTER_ITEMS = useMemo(() => [
    { id: 'workout', label: isAr ? 'تمرين رياضي مكتمل' : 'Solid Workout', icon: Dumbbell, color: 'text-amber-500' },
    { id: 'clean_nutrition', label: isAr ? 'أكل صحي ونظيف' : 'Clean Nutrition', icon: Salad, color: 'text-emerald-500' },
    { id: 'deep_work', label: isAr ? 'عمل عميق بدون مقاطعة' : 'Deep Focus Flow', icon: Target, color: 'text-indigo-500' },
    { id: 'good_sleep', label: isAr ? 'نعاس كافي ومريح' : 'Restorative Sleep', icon: Moon, color: 'text-blue-500' },
    { id: 'sunlight', label: isAr ? 'شمس ومشي خارجي' : 'Sunlight & Walk', icon: Sun, color: 'text-amber-400' },
    { id: 'connection', label: isAr ? 'تواصل نوعي إيجابي' : 'Quality Connection', icon: Smile, color: 'text-pink-500' },
    { id: 'learning', label: isAr ? 'قراءة وتعلم مهارة' : 'Reading / Learning', icon: BookOpen, color: 'text-cyan-500' },
  ], [isAr]);

  const DRAIN_ITEMS = useMemo(() => [
    { id: 'work_stress', label: isAr ? 'ضغط عمل وتوتر ديدلاين' : 'Work & Deadline Stress', icon: AlertTriangle, color: 'text-rose-500' },
    { id: 'screen_overload', label: isAr ? 'سكرين تايم مفرط ومشتت' : 'Screen Overload', icon: Smartphone, color: 'text-amber-500' },
    { id: 'poor_sleep', label: isAr ? 'قلة نعاس أو نوم مقلق' : 'Poor / Broken Sleep', icon: Moon, color: 'text-purple-400' },
    { id: 'junk_food', label: isAr ? 'تخربيق فالماكلة / سكر' : 'Junk Food / Sugar', icon: Frown, color: 'text-orange-500' },
    { id: 'friction', label: isAr ? 'نقاش سلبي أو خلاف' : 'Negative Friction', icon: Flame, color: 'text-red-500' },
    { id: 'procrastination', label: isAr ? 'تسويف وتأجيل المهام' : 'Procrastination Guilt', icon: Activity, color: 'text-rose-400' },
  ], [isAr]);

  const toggleBooster = (id: string) => {
    setSelectedBoosters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    soundManager.play('click');
  };

  const toggleDrain = (id: string) => {
    setSelectedDrains((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    soundManager.play('click');
  };

  // Real-time Composite Mastery Day Score (0 - 100)
  const calculatedDayScore = useMemo(() => {
    const slidersAvg = (energyRating + stressRating + clarityRating + disciplineRating + fulfillmentRating) / 5;
    const base = slidersAvg * 10;
    const boosterBonus = Math.min(selectedBoosters.length * 2, 10);
    const drainPenalty = Math.min(selectedDrains.length * 2.5, 15);
    return Math.max(10, Math.min(100, Math.round(base + boosterBonus - drainPenalty)));
  }, [energyRating, stressRating, clarityRating, disciplineRating, fulfillmentRating, selectedBoosters, selectedDrains]);

  const getScoreTier = (score: number) => {
    if (score >= 90) return { label: isAr ? 'أداء أسطوري 🏆' : 'Legendary 🏆', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30 ring-1 ring-amber-500/20' };
    if (score >= 75) return { label: isAr ? 'أداء ممتاز 🟢' : 'High Execution 🟢', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 ring-1 ring-emerald-500/20' };
    if (score >= 60) return { label: isAr ? 'يوم متوازن 🟡' : 'Balanced & Steady 🟡', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' };
    if (score >= 45) return { label: isAr ? 'يوم مليء بالتحديات 🟠' : 'Challenging Day 🟠', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' };
    return { label: isAr ? 'يحتاج استرجاع طاقة 🔴' : 'Recovery Mode 🔴', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
  };

  // Auto-populate when date changes
  useEffect(() => {
    const existing = reviews.find((r) => r.type === 'daily' && r.periodKey === journalSelectedDate);
    if (existing) {
      setJournalTitle(existing.title || '');
      setJournalMood(existing.dayMood || 'productive');
      setJournalRating(existing.rating || 8);
      setJournalWins(existing.wins || '');
      setJournalLessons(existing.lessons || '');
      setJournalChallenges(existing.challenges || '');
      setJournalNotes(existing.notes || '');
      setEnergyRating(existing.stateRatings?.energy ?? existing.rating ?? 8);
      setStressRating(existing.stateRatings?.stress ?? 8);
      setClarityRating(existing.stateRatings?.clarity ?? existing.rating ?? 8);
      setDisciplineRating(existing.stateRatings?.discipline ?? existing.rating ?? 8);
      setFulfillmentRating(existing.stateRatings?.fulfillment ?? existing.rating ?? 8);
      setSelectedBoosters(existing.boosters || []);
      setSelectedDrains(existing.drains || []);
    } else {
      setJournalTitle('');
      setJournalWins('');
      setJournalLessons('');
      setJournalChallenges('');
      setJournalNotes('');
      setEnergyRating(8);
      setStressRating(8);
      setClarityRating(8);
      setDisciplineRating(8);
      setFulfillmentRating(8);
      setSelectedBoosters([]);
      setSelectedDrains([]);
    }
  }, [journalSelectedDate, reviews]);

  const handleSaveJournal = async () => {
    setIsSavingJournal(true);
    try {
      const title = journalTitle.trim() || (isAr ? `تأمل وتقييم يوم ${journalSelectedDate}` : `Daily Reflection & Audit ${journalSelectedDate}`);
      await onSaveReview({
        type: 'daily',
        periodKey: journalSelectedDate,
        title,
        dayMood: journalMood,
        rating: Math.round(calculatedDayScore / 10),
        dayScore: calculatedDayScore,
        stateRatings: {
          energy: energyRating,
          stress: stressRating,
          clarity: clarityRating,
          discipline: disciplineRating,
          fulfillment: fulfillmentRating,
        },
        boosters: selectedBoosters,
        drains: selectedDrains,
        lessons: journalLessons.trim() || undefined,
        wins: journalWins.trim() || undefined,
        challenges: journalChallenges.trim() || undefined,
        notes: journalNotes.trim() || undefined,
        createdAt: Date.now(),
      });
      soundManager.play('celebrate');
    } catch (e) {
      console.error('Failed to save journal entry:', e);
    } finally {
      setIsSavingJournal(false);
    }
  };

  const dailyReviews = useMemo(() => {
    return reviews
      .filter((r) => r.type === 'daily')
      .sort((a, b) => (b.periodKey || '').localeCompare(a.periodKey || '') || b.createdAt - a.createdAt);
  }, [reviews]);

  // Chart data calculation
  const chartData = useMemo(() => {
    const dailies = reviews
      .filter((r) => r.type === 'daily' && r.periodKey)
      .sort((a, b) => a.periodKey.localeCompare(b.periodKey));

    if (dailies.length === 0) return [];

    let sliceCount = dailies.length;
    if (chartTimeframe === '7d') sliceCount = 7;
    else if (chartTimeframe === '14d') sliceCount = 14;
    else if (chartTimeframe === '30d') sliceCount = 30;

    const sliced = dailies.slice(-sliceCount);

    return sliced.map((entry) => {
      const score = entry.dayScore ?? (entry.rating ? entry.rating * 10 : 75);
      const energy = entry.stateRatings?.energy ?? (entry.rating ?? 8);
      const stress = entry.stateRatings?.stress ?? 8;
      const clarity = entry.stateRatings?.clarity ?? (entry.rating ?? 8);
      const discipline = entry.stateRatings?.discipline ?? (entry.rating ?? 8);
      const fulfillment = entry.stateRatings?.fulfillment ?? (entry.rating ?? 8);

      return {
        date: entry.periodKey,
        displayDate: entry.periodKey.slice(5),
        composite: score,
        energy,
        stress,
        clarity,
        discipline,
        fulfillment,
        boostersCount: entry.boosters?.length ?? 0,
        drainsCount: entry.drains?.length ?? 0,
        mood: entry.dayMood,
      };
    });
  }, [reviews, chartTimeframe]);

  // Pattern Insights Finder
  const patternInsights = useMemo(() => {
    const dailies = reviews.filter((r) => r.type === 'daily' && r.periodKey);
    if (dailies.length < 2) return null;

    // 1. Workout impact on day score
    const withWorkout = dailies.filter((r) => r.boosters?.includes('workout'));
    const withoutWorkout = dailies.filter((r) => !r.boosters?.includes('workout'));
    const avgScoreWithWorkout = withWorkout.length > 0
      ? Math.round(withWorkout.reduce((acc, r) => acc + (r.dayScore ?? (r.rating ? r.rating * 10 : 70)), 0) / withWorkout.length)
      : null;
    const avgScoreWithoutWorkout = withoutWorkout.length > 0
      ? Math.round(withoutWorkout.reduce((acc, r) => acc + (r.dayScore ?? (r.rating ? r.rating * 10 : 70)), 0) / withoutWorkout.length)
      : null;

    // 2. Screen Overload impact on stress control
    const withScreen = dailies.filter((r) => r.drains?.includes('screen_overload'));
    const withoutScreen = dailies.filter((r) => !r.drains?.includes('screen_overload'));
    const avgStressWithScreen = withScreen.length > 0
      ? (withScreen.reduce((acc, r) => acc + (r.stateRatings?.stress ?? 6), 0) / withScreen.length).toFixed(1)
      : null;
    const avgStressWithoutScreen = withoutScreen.length > 0
      ? (withoutScreen.reduce((acc, r) => acc + (r.stateRatings?.stress ?? 8), 0) / withoutScreen.length).toFixed(1)
      : null;

    // 3. Best weekday
    const weekdayMap: Record<number, { sum: number; count: number }> = {};
    dailies.forEach((d) => {
      const dateObj = new Date(d.periodKey);
      if (!isNaN(dateObj.getTime())) {
        const day = dateObj.getDay();
        const score = d.dayScore ?? (d.rating ? d.rating * 10 : 70);
        if (!weekdayMap[day]) weekdayMap[day] = { sum: 0, count: 0 };
        weekdayMap[day].sum += score;
        weekdayMap[day].count += 1;
      }
    });

    const weekdayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const weekdayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let bestDayIdx = -1;
    let bestAvg = 0;
    Object.entries(weekdayMap).forEach(([dayStr, data]) => {
      const avg = data.sum / data.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDayIdx = Number(dayStr);
      }
    });

    const totalScore = dailies.reduce((acc, r) => acc + (r.dayScore ?? (r.rating ? r.rating * 10 : 70)), 0);
    const overallAvg = Math.round(totalScore / dailies.length);

    return {
      totalEntries: dailies.length,
      overallAvg,
      avgScoreWithWorkout,
      avgScoreWithoutWorkout,
      workoutDiff: avgScoreWithWorkout && avgScoreWithoutWorkout ? avgScoreWithWorkout - avgScoreWithoutWorkout : null,
      avgStressWithScreen,
      avgStressWithoutScreen,
      bestDayName: bestDayIdx !== -1 ? (isAr ? weekdayNamesAr[bestDayIdx] : weekdayNamesEn[bestDayIdx]) : null,
      bestDayAvg: Math.round(bestAvg),
    };
  }, [reviews, isAr]);

  // ---------------- FEATURE 2: BREAKTHROUGHS & COGNITIVE BLOCKS ----------------
  const [reflectionTitle, setReflectionTitle] = useState('');
  const [reflectionDesc, setReflectionDesc] = useState('');
  const [reflectionCategory, setReflectionCategory] = useState('Fear of Success');
  const [reflectionType] = useState<'cognitive_block' | 'aha_moment' | 'mindset_shift'>('cognitive_block');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [extractingForId, setExtractingForId] = useState<string | null>(null);

  const handleSaveReflection = async () => {
    if (!reflectionTitle.trim() || !reflectionDesc.trim()) return;
    setIsSavingReflection(true);
    try {
      if (onAddReflection) {
        await onAddReflection({
          title: reflectionTitle.trim(),
          description: reflectionDesc.trim(),
          category: reflectionCategory,
          type: reflectionType,
          extractedAffirmations: [],
          createdAt: Date.now(),
        });
      }
      setReflectionTitle('');
      setReflectionDesc('');
      soundManager.play('celebrate');
    } catch (e) {
      console.error('Failed to save reflection block:', e);
    } finally {
      setIsSavingReflection(false);
    }
  };

  const handleGenerateAtlasAffirmation = async (refItem: CognitiveReflection) => {
    if (!refItem.id || !onUpdateReflection) return;
    setExtractingForId(refItem.id);

    const promptReframes: Record<string, string[]> = {
      'Fear of Success': [
        'I am fully worthy and equipped to handle the exponential growth and new opportunities coming my way.',
        'Success is a natural extension of my disciplined service and dedication.'
      ],
      'Imposter Syndrome': [
        'My achievements are earned through my focus, relentless execution, and continuous learning.',
        'I belong in every room I enter, bringing unique value and clarity.'
      ],
      'Perfectionism': [
        'Done and iterated is vastly superior to perfect and unreleased.',
        'I celebrate bold action and continuous refinement over stalling.'
      ],
    };

    const generated = promptReframes[refItem.category || ''] || [
      `I replace "${refItem.title}" with unwavering conviction and daily aligned action.`,
      'My mind is my standard-bearer; I choose empowerment over hesitation.'
    ];

    const currentExtracted = refItem.extractedAffirmations || [];
    const updatedExtracted = Array.from(new Set([...currentExtracted, ...generated]));

    await onUpdateReflection(refItem.id, {
      extractedAffirmations: updatedExtracted,
      updatedAt: Date.now()
    });

    setExtractingForId(null);
    soundManager.play('celebrate');
  };

  const handlePromoteToDeck = async (statement: string, sourceTitle: string, sourceId?: string) => {
    if (!onAddAffirmation) return;
    await onAddAffirmation({
      statement,
      category: 'Mindset',
      sourceBlockId: sourceId,
      sourceBlockTitle: sourceTitle,
      createdAt: Date.now()
    });
    soundManager.play('celebrate');
  };

  // ---------------- FEATURE 3: VISUALIZATION STORIES ----------------
  const [visionTitle, setVisionTitle] = useState('');
  const [visionStoryText, setVisionStoryText] = useState('');
  const [visionTheme, setVisionTheme] = useState('1 Year Ideal Future');
  const [isSavingVision, setIsSavingVision] = useState(false);

  const handleSaveVision = async () => {
    if (!visionTitle.trim() || !visionStoryText.trim()) return;
    setIsSavingVision(true);
    try {
      const words = visionStoryText.trim().split(/\s+/).length;
      const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

      if (onAddVision) {
        await onAddVision({
          title: visionTitle.trim(),
          storyContent: visionStoryText.trim(),
          theme: visionTheme,
          readingTimeMinutes,
          createdAt: Date.now()
        });
      }
      setVisionTitle('');
      setVisionStoryText('');
      soundManager.play('celebrate');
    } catch (e) {
      console.error('Failed to save vision story:', e);
    } finally {
      setIsSavingVision(false);
    }
  };

  // ---------------- FEATURE 4: AFFIRMATIONS DECK MANAGEMENT ----------------
  const [newAffirmationText, setNewAffirmationText] = useState('');
  const [newAffirmationCategory, setNewAffirmationCategory] = useState('Mindset');

  const handleAddDeckAffirmation = async () => {
    if (!newAffirmationText.trim() || !onAddAffirmation) return;
    await onAddAffirmation({
      statement: newAffirmationText.trim(),
      category: newAffirmationCategory,
      createdAt: Date.now()
    });
    setNewAffirmationText('');
    soundManager.play('celebrate');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* MODULE MAIN CARD */}
      <div className="bg-white dark:bg-[#18191D] border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-96 h-40 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header & Tabs Grid */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Brain size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white">
                  {isAr ? 'العقلية واليوميات (Mindset & Reflections)' : 'Mindset & Reflections Engine'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  Atlas Cognitive OS
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {isAr
                  ? 'سجل التقييم والدروس اليومية، تتبع المزاج، حل العوائق النفسية، وتوكيدات البرمجة الذهنية.'
                  : 'Log daily reviews, track mood & rating (1-10), solve cognitive barriers, and practice affirmations.'}
              </p>
            </div>
          </div>

          {/* MAIN MODULE TABS - Clean Responsive Grid, No Awkward Scrollbar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full xl:w-auto p-1.5 bg-neutral-100/90 dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shrink-0">
            <button
              onClick={() => setMainTab('journal')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mainTab === 'journal'
                  ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800/60'
              }`}
            >
              <BookOpen size={15} className="shrink-0" />
              <span className="truncate">{isAr ? 'سجل اليوميات' : 'Daily Journal'}</span>
            </button>

            <button
              onClick={() => setMainTab('blocks')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mainTab === 'blocks'
                  ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800/60'
              }`}
            >
              <Brain size={15} className="shrink-0" />
              <span className="truncate">{isAr ? 'العوائق والتحولات' : 'Blocks & Breakthroughs'}</span>
            </button>

            <button
              onClick={() => setMainTab('visions')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mainTab === 'visions'
                  ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800/60'
              }`}
            >
              <Sparkles size={15} className="shrink-0" />
              <span className="truncate">{isAr ? 'قصص التجسيد' : 'Visualization Stories'}</span>
            </button>

            <button
              onClick={() => setMainTab('affirmations')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mainTab === 'affirmations'
                  ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800/60'
              }`}
            >
              <Layers size={15} className="shrink-0" />
              <span className="truncate">{isAr ? 'سطح التوكيدات' : 'Affirmations Deck'}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DAILY JOURNAL & STATE AUDIT */}
        {mainTab === 'journal' && (
          <div className="pt-6 space-y-8 animate-fadeIn">
            {/* MAIN LOGGING CARD */}
            <div className="bg-neutral-50/70 dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm dark:shadow-xl transition-all">
              
              {/* Card Header: Title + Date Picker & Quick Selectors */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>{isAr ? 'تقييم اليوم والحالة الذهنية' : 'Daily State & Performance Audit'}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {isAr ? 'تقييم شامل' : 'Scored'}
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {isAr
                        ? 'نقط محاور يومك، حدد المؤثرات والمشتتات، واكتشف نمط طاقتك ومزاجك.'
                        : 'Score key life dimensions, audit triggers, and visualize behavioral patterns.'}
                    </p>
                  </div>
                </div>

                {/* Date Controls & Quick Day Buttons */}
                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  <div className="flex items-center bg-white dark:bg-[#18191D] p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setJournalSelectedDate(todayIso)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        journalSelectedDate === todayIso
                          ? 'bg-emerald-500 text-white shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {isAr ? 'اليوم' : 'Today'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const y = new Date();
                        y.setDate(y.getDate() - 1);
                        setJournalSelectedDate(`${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`);
                      }}
                      className="px-2.5 py-1 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {isAr ? 'أمس' : 'Yesterday'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191D] text-xs font-mono shadow-2xs">
                    <Calendar size={13} className="text-neutral-400" />
                    <input
                      type="date"
                      value={journalSelectedDate}
                      onChange={(e) => setJournalSelectedDate(e.target.value)}
                      className="bg-transparent text-neutral-900 dark:text-white cursor-pointer focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* HERO COMPOSITE DAY SCORE BANNER */}
              <div className="p-5 rounded-3xl bg-linear-to-br from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-500/25 dark:border-emerald-500/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" />
                    <span>{isAr ? 'نقطة إتقان اليوم الإجمالية (Daily Mastery Score)' : 'Composite Daily Mastery Score'}</span>
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black font-mono text-neutral-900 dark:text-white tracking-tight">
                      {calculatedDayScore}
                    </span>
                    <span className="text-lg font-bold text-neutral-400 font-mono">/ 100</span>
                    <span className={`ms-2 px-3 py-1 rounded-xl text-xs font-black border ${getScoreTier(calculatedDayScore).color}`}>
                      {getScoreTier(calculatedDayScore).label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                    <span className="bg-white/80 dark:bg-neutral-800/80 px-2 py-0.5 rounded-md border border-neutral-200/60 dark:border-neutral-700/60">
                      {isAr ? 'الأساس' : 'Base'}: {(( (energyRating + stressRating + clarityRating + disciplineRating + fulfillmentRating) * 2 )).toFixed(0)} pts
                    </span>
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                      {isAr ? 'محفزات' : 'Boosters'}: +{Math.min(selectedBoosters.length * 2, 10)} pts
                    </span>
                    <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/60">
                      {isAr ? 'مشتتات' : 'Drains'}: -{Math.min(selectedDrains.length * 2.5, 15)} pts
                    </span>
                  </div>
                </div>

                {/* Mood Selection Quick Bar */}
                <div className="space-y-1.5 shrink-0">
                  <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1.5">
                    <Smile size={13} className="text-emerald-500" />
                    <span>{isAr ? 'المزاج العام لليوم:' : 'Dominant Mood:'}</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['calm', 'productive', 'stressed', 'neutral', 'tired', 'victorious'] as const).map((mood) => {
                      const isSelected = journalMood === mood;
                      return (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => setJournalMood(mood)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm font-extrabold scale-105'
                              : 'bg-white dark:bg-[#18191D] border-neutral-200/90 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          <span>{moodEmojis[mood] || '✨'}</span>
                          <span className="capitalize text-[11px]">{mood}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 5 CORE DAILY STATE SLIDERS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" />
                    <span>{isAr ? 'تنقيط محاور اليوم الخمسة (من 1 إلى 10)' : 'The 5 Core Daily Sliders (1 to 10)'}</span>
                  </h4>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {isAr ? 'حرك المؤشر حسب إحساسك الحقيقي' : 'Slide to reflect honest state'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Slider 1: Physical Energy */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <Zap size={15} className="text-amber-500 fill-amber-500" />
                        <span>{isAr ? 'الطاقة والنشاط الجسدي' : 'Physical Energy & Vitality'}</span>
                      </span>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                        {energyRating} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={energyRating}
                      onChange={(e) => setEnergyRating(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                      <span>{isAr ? '١: إرهاق وفشلة' : '1: Exhausted'}</span>
                      <span>{isAr ? '١٠: طاقة ونشاط متقد' : '10: Peak Vitality'}</span>
                    </div>
                  </div>

                  {/* Slider 2: Stress & Pressure Control */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <Shield size={15} className="text-emerald-500" />
                        <span>{isAr ? 'التحكم في التوتر والضغط' : 'Stress & Pressure Control'}</span>
                      </span>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        {stressRating} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={stressRating}
                      onChange={(e) => setStressRating(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                      <span>{isAr ? '١: توتر وقلق مفرط' : '1: Overwhelmed'}</span>
                      <span>{isAr ? '١٠: هدوء وسلام تام' : '10: Calm Mastery'}</span>
                    </div>
                  </div>

                  {/* Slider 3: Mental Clarity */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <Brain size={15} className="text-indigo-500" />
                        <span>{isAr ? 'الصفاء الذهني والتركيز' : 'Mental Clarity & Focus'}</span>
                      </span>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                        {clarityRating} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={clarityRating}
                      onChange={(e) => setClarityRating(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                      <span>{isAr ? '١: ضباب وتشتت' : '1: Brain Fog'}</span>
                      <span>{isAr ? '١٠: صفاء وتركيز حاد' : '10: Laser Sharp'}</span>
                    </div>
                  </div>

                  {/* Slider 4: Discipline & Execution */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <Target size={15} className="text-rose-500" />
                        <span>{isAr ? 'الانضباط ومحاربة التسويف' : 'Discipline & Execution'}</span>
                      </span>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                        {disciplineRating} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={disciplineRating}
                      onChange={(e) => setDisciplineRating(Number(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                      <span>{isAr ? '١: تسويف وتراجع' : '1: Heavy Procrastination'}</span>
                      <span>{isAr ? '١٠: التزام صارم بالخطة' : '10: Unshakable Execution'}</span>
                    </div>
                  </div>

                  {/* Slider 5: Daily Fulfillment (Full Width or standard) */}
                  <div className="md:col-span-2 p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <Star size={15} className="text-amber-500 fill-amber-500" />
                        <span>{isAr ? 'الرضا عن الذات والامتنان' : 'Daily Fulfillment & Self-Pride'}</span>
                      </span>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                        {fulfillmentRating} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={fulfillmentRating}
                      onChange={(e) => setFulfillmentRating(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
                    />
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                      <span>{isAr ? '١: إحباط وشعور بالتقصير' : '1: Disappointed'}</span>
                      <span>{isAr ? '١٠: فخر عميق وامتنان لنعم اليوم' : '10: Deep Pride & Gratitude'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTEXT & TRIGGERS CHECKLISTS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>{isAr ? 'قائمة المؤثرات والمحفزات السريعة (Checklists)' : 'Context & Day Triggers Checklists'}</span>
                  </h4>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {isAr ? 'انقر على ما حدث معك اليوم' : 'Tap what occurred today'}
                  </span>
                </div>

                {/* Boosters Section */}
                <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs">
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-500" />
                    <span>{isAr ? 'محفزات القوة والطاقة الإيجابية (+2 نقاط لكل منها)' : 'Energy Boosters (+2 pts each)'}</span>
                  </span>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {BOOSTER_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = selectedBoosters.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleBooster(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm font-bold scale-102 ring-2 ring-emerald-500/20'
                              : 'bg-neutral-50 dark:bg-[#18191D] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-emerald-300 dark:hover:border-emerald-700'
                          }`}
                        >
                          <Icon size={13} className={active ? 'text-white' : item.color} />
                          <span>{item.label}</span>
                          {active && <Check size={12} className="stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Drains Section */}
                <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs">
                  <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-rose-500" />
                    <span>{isAr ? 'مسببات التوتر والنزف (-2.5 نقطة لكل منها)' : 'Energy Drains & Stressors (-2.5 pts each)'}</span>
                  </span>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {DRAIN_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = selectedDrains.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleDrain(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            active
                              ? 'bg-rose-500 text-white border-rose-500 shadow-sm font-bold scale-102 ring-2 ring-rose-500/20'
                              : 'bg-neutral-50 dark:bg-[#18191D] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-rose-300 dark:hover:border-rose-700'
                          }`}
                        >
                          <Icon size={13} className={active ? 'text-white' : item.color} />
                          <span>{item.label}</span>
                          {active && <Check size={12} className="stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Title & Central Theme Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">
                  {isAr ? 'عنوان اليوم / الفكرة المركزية (اختياري)' : 'Day Title / Central Theme (Optional)'}
                </label>
                <input
                  type="text"
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  placeholder={isAr ? 'مثال: يوم عالي التركيز والإنتاجية، كسر حاجز المقاومة...' : 'e.g. Relentless execution day, broke resistance...'}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              {/* COLLAPSIBLE REFLECTIVE PROMPTS (Wins, Lessons, Challenges) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowWrittenPrompts(!showWrittenPrompts)}
                  className="text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer pb-2 transition-colors"
                >
                  <Edit3 size={13} />
                  <span>{isAr ? 'كتابة تأملات وتفاصيل اليوم (الإنجازات، الدروس، والتحديات)' : 'Write Detailed Reflection (Wins, Lessons, Obstacles)'}</span>
                  {showWrittenPrompts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showWrittenPrompts && (
                  <div className="space-y-4 pt-2 animate-fadeIn">
                    {/* Wins & Lessons Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1.5">
                          <span className="text-emerald-500">✨</span>
                          <span>{isAr ? 'إنجازات اليوم (Wins & Accomplishments)' : 'Wins & Accomplishments'}</span>
                        </label>
                        <textarea
                          value={journalWins}
                          onChange={(e) => setJournalWins(e.target.value)}
                          rows={3}
                          placeholder={isAr ? 'ما الذي نجحت في تحقيقه اليوم؟ المهام، التمارين، الالتزام...' : 'What went well today? Key wins, milestones, completed work...'}
                          className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 leading-relaxed shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1.5">
                          <span className="text-amber-500">💡</span>
                          <span>{isAr ? 'الدروس المستفادة (Lessons Learned)' : 'Lessons Learned & Realizations'}</span>
                        </label>
                        <textarea
                          value={journalLessons}
                          onChange={(e) => setJournalLessons(e.target.value)}
                          rows={3}
                          placeholder={isAr ? 'ماذا تعلمت عن نفسك، عاداتك، أو عملك اليوم؟' : 'What insights or adjustments did you realize today?'}
                          className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 leading-relaxed shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Challenges & Time Leaks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1.5">
                          <span className="text-rose-500">🛡️</span>
                          <span>{isAr ? 'التحديات وضياع الوقت (Obstacles & Time Leaks)' : 'Obstacles & Time Leaks'}</span>
                        </label>
                        <textarea
                          value={journalChallenges}
                          onChange={(e) => setJournalChallenges(e.target.value)}
                          rows={2}
                          placeholder={isAr ? 'أين كانت المقاومة؟ أين ضاع الوقت أو التركيز؟' : 'What drained focus or triggered friction today?'}
                          className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 leading-relaxed shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1.5">
                          <span className="text-blue-500">📝</span>
                          <span>{isAr ? 'ملاحظات وتوجيهات للغد (Next Day Focus)' : 'Next Day Intentions & Notes'}</span>
                        </label>
                        <textarea
                          value={journalNotes}
                          onChange={(e) => setJournalNotes(e.target.value)}
                          rows={2}
                          placeholder={isAr ? 'الهدف الأساسي لليوم القادم...' : 'Primary intent and non-negotiable target for tomorrow...'}
                          className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 leading-relaxed shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSaveJournal}
                disabled={isSavingJournal}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>
                  {isSavingJournal
                    ? (isAr ? 'جاري الحفظ في السحابة...' : 'Saving to cloud...')
                    : (isAr ? `حفظ تقييم يوم ${journalSelectedDate} (نقطة: ${calculatedDayScore}/100)` : `Save Daily Audit for ${journalSelectedDate} (Score: ${calculatedDayScore}/100)`)}
                </span>
              </button>
            </div>

            {/* INTERACTIVE VISUAL TREND & PATTERN ANALYTICS ENGINE */}
            <div className="bg-white dark:bg-[#18191D] border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm dark:shadow-xl transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>{isAr ? 'مبيان تطور الحالة والأنماط اليومية' : 'Daily State & Performance Trajectory'}</span>
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {isAr
                        ? 'تتبع تطور النقطة الشاملة أو افصل كل جانب (الطاقة، الستريس، الانضباط) لاكتشاف نمطك.'
                        : 'Track composite trajectory or isolate individual dimensions to uncover key behavioral trends.'}
                    </p>
                  </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-xs font-bold self-start sm:self-auto">
                  {(['7d', '14d', '30d', 'all'] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setChartTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        chartTimeframe === tf
                          ? 'bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white shadow-2xs font-extrabold'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {tf === '7d' ? (isAr ? '٧ أيام' : '7 Days') : tf === '14d' ? (isAr ? '١٤ يوماً' : '14 Days') : tf === '30d' ? (isAr ? '٣٠ يوماً' : '30 Days') : (isAr ? 'كل السجل' : 'All')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metric Selector Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'composite', label: isAr ? 'النقطة الشاملة (Composite)' : 'Composite Score', icon: Award, color: '#10B981' },
                  { id: 'energy', label: isAr ? 'الطاقة والنشاط' : 'Energy', icon: Zap, color: '#F59E0B' },
                  { id: 'stress', label: isAr ? 'التحكم بالتوتر' : 'Stress Control', icon: Shield, color: '#059669' },
                  { id: 'clarity', label: isAr ? 'الصفاء الذهني' : 'Mental Clarity', icon: Brain, color: '#6366F1' },
                  { id: 'discipline', label: isAr ? 'الانضباط' : 'Discipline', icon: Target, color: '#EF4444' },
                  { id: 'fulfillment', label: isAr ? 'الرضا والامتنان' : 'Fulfillment', icon: Star, color: '#D97706' },
                ].map((m) => {
                  const isSelected = chartMetric === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setChartMetric(m.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-neutral-900 dark:bg-neutral-800 text-white border-neutral-900 dark:border-neutral-700 shadow-xs'
                          : 'bg-neutral-50/80 dark:bg-[#141518] text-neutral-600 dark:text-neutral-400 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <Icon size={13} style={{ color: m.color }} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* The Graph */}
              {chartData.length < 2 ? (
                <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-neutral-50/50 dark:bg-[#141518]">
                  <BarChart2 className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'سجل يومين أو أكثر لرسم مبيان التطور واكتشاف الأنماط' : 'Record at least 2 daily entries to unlock the trajectory graph'}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {isAr ? 'كل يومية تسجلها تزيد دقة التحليلات والمقارنات' : 'Each audit builds richer longitudinal behavioral insights'}
                  </p>
                </div>
              ) : (
                <div className="w-full h-64 sm:h-72 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartMetric === 'composite' ? '#10B981' : chartMetric === 'energy' ? '#F59E0B' : chartMetric === 'stress' ? '#059669' : chartMetric === 'clarity' ? '#6366F1' : '#EF4444'} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={chartMetric === 'composite' ? '#10B981' : chartMetric === 'energy' ? '#F59E0B' : chartMetric === 'stress' ? '#059669' : chartMetric === 'clarity' ? '#6366F1' : '#EF4444'} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                      <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#888888' }} tickLine={false} axisLine={false} />
                      <YAxis
                        domain={chartMetric === 'composite' ? [0, 100] : [0, 10]}
                        tick={{ fontSize: 10, fill: '#888888' }}
                        tickLine={false}
                        axisLine={false}
                        unit={chartMetric === 'composite' ? '%' : ''}
                      />
                      <Tooltip
                        cursor={false}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-neutral-900/95 dark:bg-neutral-800/95 text-white p-3 rounded-2xl shadow-xl border border-neutral-700 text-xs space-y-1.5 min-w-[170px]">
                                <div className="font-bold flex items-center justify-between pb-1 border-b border-neutral-700">
                                  <span>{data.date}</span>
                                  <span>{moodEmojis[data.mood] || '✨'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 font-mono">
                                  <span className="text-neutral-400">{isAr ? 'النقطة الشاملة:' : 'Mastery Score:'}</span>
                                  <span className="font-extrabold text-emerald-400 text-sm">{data.composite}/100</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[10px] text-neutral-300 font-mono pt-1">
                                  <span>⚡ {data.energy}/10</span>
                                  <span>🧘 {data.stress}/10</span>
                                  <span>🧠 {data.clarity}/10</span>
                                  <span>🎯 {data.discipline}/10</span>
                                </div>
                                {(data.boostersCount > 0 || data.drainsCount > 0) && (
                                  <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-700 flex items-center justify-between">
                                    <span className="text-emerald-400">+{data.boostersCount} {isAr ? 'محفزات' : 'boosters'}</span>
                                    <span className="text-rose-400">-{data.drainsCount} {isAr ? 'مشتتات' : 'drains'}</span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={chartMetric}
                        stroke={chartMetric === 'composite' ? '#10B981' : chartMetric === 'energy' ? '#F59E0B' : chartMetric === 'stress' ? '#059669' : chartMetric === 'clarity' ? '#6366F1' : '#EF4444'}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#scoreAreaGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* PATTERN & CORRELATION INSIGHTS CARDS */}
              {patternInsights && (
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>{isAr ? 'مكتشف الأنماط الذكي (Behavioral Correlations)' : 'Behavioral Pattern Insights'}</span>
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {isAr ? `مبني على ${patternInsights.totalEntries} أيام مسجلة` : `Grounded in ${patternInsights.totalEntries} logged days`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Insight 1: Workout Impact */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <Dumbbell size={13} />
                        <span>{isAr ? 'تأثير التمارين الرياضية' : 'Workout Impact'}</span>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {patternInsights.avgScoreWithWorkout && patternInsights.avgScoreWithoutWorkout ? (
                          isAr ? (
                            <>
                              معدل نهارك مع تمرين: <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{patternInsights.avgScoreWithWorkout}/100</span> مقابل <span className="font-mono text-neutral-500">{patternInsights.avgScoreWithoutWorkout}/100</span> بدونه (فارق <span className="font-bold font-mono">+{patternInsights.workoutDiff} نقطة</span>).
                            </>
                          ) : (
                            <>
                              Score with workout: <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{patternInsights.avgScoreWithWorkout}/100</span> vs <span className="font-mono text-neutral-500">{patternInsights.avgScoreWithoutWorkout}/100</span> without (+{patternInsights.workoutDiff} pts).
                            </>
                          )
                        ) : (
                          isAr ? 'سجل المزيد من أيام التمارين لاكتشاف فارق الطاقة.' : 'Keep logging workout days to quantify energy lift.'
                        )}
                      </p>
                    </div>

                    {/* Insight 2: Screen Overload on Stress */}
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                      <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        <Smartphone size={13} />
                        <span>{isAr ? 'تأثير السكرين تايم المفرط' : 'Screen Overload Stress'}</span>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {patternInsights.avgStressWithScreen && patternInsights.avgStressWithoutScreen ? (
                          isAr ? (
                            <>
                              التحكم بالتوتر مع سكرين زايد: <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{patternInsights.avgStressWithScreen}/10</span> مقابل <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{patternInsights.avgStressWithoutScreen}/10</span> في الأيام المنضبطة.
                            </>
                          ) : (
                            <>
                              Stress control with high screen time: <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{patternInsights.avgStressWithScreen}/10</span> vs <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{patternInsights.avgStressWithoutScreen}/10</span> without.
                            </>
                          )
                        ) : (
                          isAr ? 'راقب مسببات التشتت والسكرين تايم لخفض مستويات القلق.' : 'Monitor screen overload triggers to protect stress calm.'
                        )}
                      </p>
                    </div>

                    {/* Insight 3: Peak Weekday */}
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Award size={13} />
                        <span>{isAr ? 'أقوى أيام الأسبوع أداءً' : 'Peak Weekday Rhythm'}</span>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {patternInsights.bestDayName ? (
                          isAr ? (
                            <>
                              يوم <span className="font-bold text-emerald-600 dark:text-emerald-400">{patternInsights.bestDayName}</span> هو الأعلى أداءً بمعدل <span className="font-bold font-mono">{patternInsights.bestDayAvg}/100</span> (معدلك العام: <span className="font-mono">{patternInsights.overallAvg}/100</span>).
                            </>
                          ) : (
                            <>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{patternInsights.bestDayName}</span> is your highest performing day averaging <span className="font-bold font-mono">{patternInsights.bestDayAvg}/100</span> (overall avg: {patternInsights.overallAvg}/100).
                            </>
                          )
                        ) : (
                          isAr ? 'أضف المزيد من اليوميات لاكتشاف إيقاعك الأسبوعي.' : 'Add more daily audits to discover your weekly rhythm.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PREVIOUS DAILY REFLECTIONS FEED */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                  <BookOpen size={14} className="text-emerald-500" />
                  <span>{isAr ? 'سجل اليوميات والتقييمات السابقة' : 'Saved Daily Audits & Reflections'} ({dailyReviews.length})</span>
                </h3>
                <span className="text-[11px] text-neutral-400">
                  {isAr ? 'اضغط على أي يومية لتعديلها أو مراجعتها' : 'Click any entry to load and edit'}
                </span>
              </div>

              {dailyReviews.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 bg-white dark:bg-neutral-900/40">
                  <BookOpen className="w-9 h-9 text-neutral-400 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isAr ? 'لم تقم بتسجيل أي تأمل يومي بعد. املأ النموذج أعلاه لحفظ أول تقييم لليوم!' : 'No daily reflections saved yet. Fill the audit above to record your first day!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dailyReviews.map((entry) => {
                    const score = entry.dayScore ?? (entry.rating ? entry.rating * 10 : 75);
                    const tier = getScoreTier(score);
                    return (
                      <div
                        key={entry.id}
                        onClick={() => {
                          if (entry.periodKey) {
                            setJournalSelectedDate(entry.periodKey);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }
                        }}
                        className="bg-white dark:bg-neutral-900/80 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 space-y-3.5 hover:border-emerald-300 dark:hover:border-emerald-700/80 transition-all shadow-sm flex flex-col justify-between cursor-pointer group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white font-mono border border-neutral-200 dark:border-neutral-700">
                                {entry.periodKey}
                              </span>
                              {entry.dayMood && (
                                <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                                  <span>{moodEmojis[entry.dayMood] || '✨'}</span>
                                  <span className="capitalize">{entry.dayMood}</span>
                                </span>
                              )}
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono border ${tier.color}`}>
                                {score}/100
                              </span>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (entry.periodKey) {
                                    setJournalSelectedDate(entry.periodKey);
                                    window.scrollTo({ top: 120, behavior: 'smooth' });
                                  }
                                }}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                title={isAr ? 'تعديل اليومية' : 'Edit Day Entry'}
                              >
                                <Edit3 size={13} />
                              </button>
                              {onDeleteReview && entry.id && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteReview(entry.id!)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title={isAr ? 'حذف' : 'Delete Entry'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Ratings Badges Row */}
                          {entry.stateRatings && (
                            <div className="flex items-center gap-2 flex-wrap font-mono text-[10px] text-neutral-500 dark:text-neutral-400 pt-0.5">
                              {entry.stateRatings.energy !== undefined && (
                                <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">⚡ {entry.stateRatings.energy}/10</span>
                              )}
                              {entry.stateRatings.stress !== undefined && (
                                <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">🧘 {entry.stateRatings.stress}/10</span>
                              )}
                              {entry.stateRatings.clarity !== undefined && (
                                <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">🧠 {entry.stateRatings.clarity}/10</span>
                              )}
                              {entry.stateRatings.discipline !== undefined && (
                                <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">🎯 {entry.stateRatings.discipline}/10</span>
                              )}
                              {entry.stateRatings.fulfillment !== undefined && (
                                <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">⭐ {entry.stateRatings.fulfillment}/10</span>
                              )}
                            </div>
                          )}

                          {/* Boosters & Drains badges */}
                          {((entry.boosters && entry.boosters.length > 0) || (entry.drains && entry.drains.length > 0)) && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
                              {entry.boosters?.map((b) => (
                                <span key={b} className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                  +{b.replace('_', ' ')}
                                </span>
                              ))}
                              {entry.drains?.map((d) => (
                                <span key={d} className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                                  -{d.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          )}

                          {entry.title && (
                            <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {entry.title}
                            </h4>
                          )}

                          {entry.wins && (
                            <div className="text-xs bg-neutral-50 dark:bg-[#141518] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 space-y-1">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                {isAr ? 'الإنجازات' : 'Wins'}
                              </span>
                              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed line-clamp-3">{entry.wins}</p>
                            </div>
                          )}

                          {entry.lessons && (
                            <div className="text-xs bg-neutral-50 dark:bg-[#141518] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 space-y-1">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                                {isAr ? 'الدروس' : 'Lessons'}
                              </span>
                              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed line-clamp-2">{entry.lessons}</p>
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                          <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
                            {isAr ? 'تعديل السجل ←' : 'Edit entry →'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BREAKTHROUGHS & COGNITIVE BLOCKS */}
        {mainTab === 'blocks' && (
          <div className="pt-6 space-y-8 animate-fadeIn">
            {/* Create Block Form */}
            <div className="bg-neutral-50/70 dark:bg-neutral-900/80 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {isAr ? 'تسجيل عائق نفسي أو لحظة إدراك' : 'Log Psychological Barrier / Aha! Moment'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">
                    {isAr ? 'العنوان' : 'Title'}
                  </label>
                  <input
                    type="text"
                    value={reflectionTitle}
                    onChange={(e) => setReflectionTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: متلازمة المحتال، الخوف من النجاح...' : 'e.g. Imposter Syndrome, Fear of Scale...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">
                    {isAr ? 'الفئة' : 'Category'}
                  </label>
                  <select
                    value={reflectionCategory}
                    onChange={(e) => setReflectionCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                  >
                    <option value="Fear of Success">Fear of Success</option>
                    <option value="Imposter Syndrome">Imposter Syndrome</option>
                    <option value="Perfectionism">Perfectionism</option>
                    <option value="Fear of Failure">Fear of Failure</option>
                    <option value="General Mindset">General Mindset</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">
                  {isAr ? 'الوصف' : 'Detailed Description'}
                </label>
                <textarea
                  value={reflectionDesc}
                  onChange={(e) => setReflectionDesc(e.target.value)}
                  rows={2}
                  placeholder={isAr ? 'صف العائق والشعور الداخلي بدقة...' : 'Describe the resistance or cognitive pattern...'}
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveReflection}
                disabled={isSavingReflection || !reflectionTitle.trim()}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAr ? 'حفظ العائق' : 'Save Barrier'}
              </button>
            </div>

            {/* Saved Reflections List */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-neutral-500 dark:text-neutral-400">
                {isAr ? 'سجل التحديات والأفكار المسجلة' : 'Recorded Breakthroughs & Cognitive Barriers'} ({reflections.length})
              </h3>

              {reflections.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 bg-white dark:bg-neutral-900/40">
                  <Brain className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isAr ? 'لم تقم بتسجيل أي عائق أو فكرة ذهنية بعد. استخدم النموذج أعلاه للبدء!' : 'No cognitive reflections logged yet. Record your first breakthrough above!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {reflections.map((ref) => (
                    <div
                      key={ref.id}
                      className="bg-white dark:bg-neutral-900/60 border border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700/80 rounded-2xl p-5 space-y-4 shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                              {ref.category || 'Mindset'}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {new Date(ref.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-neutral-900 dark:text-white">{ref.title}</h4>
                        </div>

                        {onDeleteReflection && ref.id && (
                          <button
                            type="button"
                            onClick={() => onDeleteReflection(ref.id!)}
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed bg-neutral-50 dark:bg-[#18191D] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80">
                        {ref.description}
                      </p>

                      {/* Extracted Affirmations Display & Controls */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {isAr ? 'التوكيدات المعاكسة المستخرجة:' : 'Counter Affirmations:'}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleGenerateAtlasAffirmation(ref)}
                            disabled={extractingForId === ref.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isAr ? 'توليد توكيدات ذكية (Atlas AI)' : 'Extract Affirmations (AI)'}</span>
                          </button>
                        </div>

                        {/* List of Affirmations */}
                        {ref.extractedAffirmations && ref.extractedAffirmations.length > 0 && (
                          <div className="space-y-2">
                            {ref.extractedAffirmations.map((aff, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200"
                              >
                                <span className="font-medium italic">"{aff}"</span>
                                <button
                                  type="button"
                                  onClick={() => handlePromoteToDeck(aff, ref.title, ref.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] whitespace-nowrap transition-colors cursor-pointer"
                                >
                                  {isAr ? '+ إضافة لسطح التوكيدات' : '+ Add to Deck'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VISUALIZATION STORIES */}
        {mainTab === 'visions' && (
          <div className="pt-6 space-y-8 animate-fadeIn">
            {/* Create Story Form */}
            <div className="bg-neutral-50/70 dark:bg-neutral-900/80 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                {isAr ? 'صياغة قصة تجسيد جديدة (Write Visualization Story)' : 'Write New Visualization Story'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">
                    {isAr ? 'عنوان القصة والرؤية' : 'Story Title'}
                  </label>
                  <input
                    type="text"
                    value={visionTitle}
                    onChange={(e) => setVisionTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: يوم في حياتي بعد سنة من الآن، إطلاق المنصة بنجاح...' : 'e.g. A day in my life 1 year from now, Scaling to $10k/mo...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">
                    {isAr ? 'موضوع التجسيد' : 'Visualization Theme'}
                  </label>
                  <input
                    type="text"
                    value={visionTheme}
                    onChange={(e) => setVisionTheme(e.target.value)}
                    placeholder="e.g. 1 Year Ideal Future"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">
                  {isAr ? 'نص التجسيد العميق (Rich Story Content)' : 'Rich Story Content (First Person Present Tense)'}
                </label>
                <textarea
                  value={visionStoryText}
                  onChange={(e) => setVisionStoryText(e.target.value)}
                  rows={5}
                  placeholder={isAr ? 'اكتب بصيغة الحاضر والتفاصيل الحسية كاملة...' : 'Write in present tense describing sight, feel, energy and outcomes...'}
                  className="w-full p-3.5 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-serif leading-relaxed shadow-2xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveVision}
                  disabled={isSavingVision || !visionTitle.trim() || !visionStoryText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'حفظ قصة التجسيد' : 'Save Story'}</span>
                </button>
              </div>
            </div>

            {/* List of Saved Visions */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-neutral-500 dark:text-neutral-400">
                {isAr ? 'قصص التجسيد المحفوظة' : 'Saved Visualization Scripts'} ({visions.length})
              </h3>

              {visions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 bg-white dark:bg-neutral-900/40">
                  <Sparkles className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isAr ? 'لا توجد قصص تجسيد بعد. اكتب قصتك الأولى وأطلق طاقة التركيز!' : 'No visualization stories written yet. Create your first script above!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visions.map((vis) => (
                    <div
                      key={vis.id}
                      className="bg-white dark:bg-neutral-900/60 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 shadow-sm transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            {vis.theme || 'Future Vision'}
                          </span>
                          {onDeleteVision && vis.id && (
                            <button
                              type="button"
                              onClick={() => onDeleteVision(vis.id!)}
                              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 text-neutral-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-neutral-900 dark:text-white">{vis.title}</h4>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 font-serif leading-relaxed">
                          {vis.storyContent}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {vis.readingTimeMinutes || 2} {isAr ? 'دقائق قراءة' : 'min read'}
                        </span>

                        <button
                          type="button"
                          onClick={() => setActiveReaderStory(vis)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'نموذج التركيز (Focus Reader)' : 'Focus Reader Mode'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AFFIRMATIONS DECK */}
        {mainTab === 'affirmations' && (
          <div className="pt-6 space-y-8 animate-fadeIn">
            {/* Top Deck Banner & Trigger Flashcard Modal */}
            <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:to-neutral-900 border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 justify-center md:justify-start">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  {isAr ? 'سطح البرمجة التلقائية والتوكيدات' : 'Daily Identity Reprogramming Deck'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isAr ? 'انقر للبدء في تصفح بطاقات البرمجة الذهنية في تجربة تفاعلية مليئة بالتركيز.' : 'Start the immersive flashcard experience with timer or manual step.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAffirmationPopupOpen(true)}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isAr ? 'تشغيل بطاقات التوكيدات اليومية' : 'Open Affirmations Popup'}</span>
              </button>
            </div>

            {/* Quick Add Affirmation Form */}
            <div className="bg-neutral-50/70 dark:bg-neutral-900/80 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
              <input
                type="text"
                value={newAffirmationText}
                onChange={(e) => setNewAffirmationText(e.target.value)}
                placeholder={isAr ? 'اكتب توكيداً جديداً وتثبيتاً لمعتقد إيجابي...' : 'Type a new empowering statement...'}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500 w-full shadow-2xs"
              />

              <select
                value={newAffirmationCategory}
                onChange={(e) => setNewAffirmationCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 w-full sm:w-auto shadow-2xs"
              >
                <option value="Mindset">Mindset</option>
                <option value="Focus">Focus</option>
                <option value="Confidence">Confidence</option>
                <option value="Abundance">Abundance</option>
                <option value="Resilience">Resilience</option>
                <option value="Health">Health</option>
              </select>

              <button
                type="button"
                onClick={handleAddDeckAffirmation}
                disabled={!newAffirmationText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-extrabold text-xs whitespace-nowrap w-full sm:w-auto cursor-pointer shadow-sm shadow-emerald-500/20"
              >
                + {isAr ? 'إضافة' : 'Add Card'}
              </button>
            </div>

            {/* List of Deck Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {affirmations.map((aff) => (
                <div
                  key={aff.id}
                  className="bg-white dark:bg-neutral-900/50 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative group shadow-sm hover:border-emerald-500/30 transition-all"
                >
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      {aff.category || 'Mindset'}
                    </span>
                    <p className="text-xs font-bold text-neutral-800 dark:text-white italic leading-relaxed">
                      "{aff.statement}"
                    </p>
                  </div>

                  {onDeleteAffirmation && aff.id && (
                    <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                      <button
                        type="button"
                        onClick={() => onDeleteAffirmation(aff.id!)}
                        className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/20 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOCUS MODE FULL SCREEN READER MODAL */}
      <FullVisionReaderModal
        story={activeReaderStory}
        onClose={() => setActiveReaderStory(null)}
        lang={lang}
      />

      {/* DAILY AFFIRMATIONS FLASHCARD POPUP MODAL */}
      <AffirmationsModalPopup
        isOpen={isAffirmationPopupOpen}
        onClose={() => setIsAffirmationPopupOpen(false)}
        affirmations={affirmations}
        lang={lang}
      />
    </div>
  );
};
