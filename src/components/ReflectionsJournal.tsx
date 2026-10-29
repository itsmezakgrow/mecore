import React, { useState, useMemo } from 'react';
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
  Star
} from 'lucide-react';
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
  isDark: _isDark = false,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';

  // Module Tabs: 'journal' | 'blocks' | 'visions' | 'affirmations'
  // Daily Journal is primary default
  const [mainTab, setMainTab] = useState<'journal' | 'blocks' | 'visions' | 'affirmations'>('journal');

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

  const moodEmojis: Record<string, string> = {
    calm: '😌',
    productive: '⚡',
    stressed: '😣',
    neutral: '😐',
    tired: '🥱',
    victorious: '🏆',
  };

  const handleSaveJournal = async () => {
    setIsSavingJournal(true);
    try {
      const title = journalTitle.trim() || (isAr ? `تأمل يوم ${journalSelectedDate}` : `Daily Reflection ${journalSelectedDate}`);
      await onSaveReview({
        type: 'daily',
        periodKey: journalSelectedDate,
        title,
        dayMood: journalMood,
        rating: journalRating,
        lessons: journalLessons.trim() || undefined,
        wins: journalWins.trim() || undefined,
        challenges: journalChallenges.trim() || undefined,
        notes: journalNotes.trim() || undefined,
        createdAt: Date.now(),
      });
      // reset form
      setJournalTitle('');
      setJournalWins('');
      setJournalLessons('');
      setJournalChallenges('');
      setJournalNotes('');
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
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [reviews]);

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

        {/* TAB 1: DAILY JOURNAL */}
        {mainTab === 'journal' && (
          <div className="pt-6 space-y-6">
            <div className="bg-neutral-50/70 dark:bg-neutral-900/90 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-sm dark:shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                      {isAr ? 'سجل اليوميات والتقييم اليومي' : 'Daily Journal & Mood Reflection'}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {isAr ? 'سجل حالتك الذهنية، تقييم يومك على 10، الدروس المستفادة والإنجازات.' : 'Capture daily mood, rating out of 10, key lessons, and daily wins.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-neutral-500 dark:text-neutral-400" />
                  <input
                    type="date"
                    value={journalSelectedDate}
                    onChange={(e) => setJournalSelectedDate(e.target.value)}
                    className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191D] text-xs text-neutral-900 dark:text-white font-mono cursor-pointer focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Mood and Rating Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Mood Selection */}
                <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs">
                  <label className="text-xs text-neutral-800 dark:text-neutral-300 font-bold flex items-center gap-1.5">
                    <Smile size={14} className="text-emerald-500" />
                    <span>{isAr ? 'الحالة المزاجية لليوم (Daily Mood)' : 'Daily Mood'}</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(['calm', 'productive', 'stressed', 'neutral', 'tired', 'victorious'] as const).map((mood) => {
                      const isSelected = journalMood === mood;
                      return (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => setJournalMood(mood)}
                          className={`py-2 px-1.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm scale-102 font-extrabold'
                              : 'bg-neutral-50/80 dark:bg-[#18191D] border-neutral-200/90 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                        >
                          <span className="text-base">{moodEmojis[mood] || '✨'}</span>
                          <span className="capitalize text-[10px] truncate max-w-full">{mood}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating 1 - 10 */}
                <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-neutral-800 dark:text-neutral-300 font-bold flex items-center gap-1.5">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span>{isAr ? 'تقييم اليوم الإجمالي (من 10)' : 'Daily Rating (1-10)'}</span>
                    </label>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                      {journalRating} / 10
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const isSelected = journalRating === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setJournalRating(num)}
                          className={`h-9 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'bg-amber-500 text-neutral-950 font-black shadow-md scale-105'
                              : 'bg-neutral-50/80 dark:bg-[#18191D] text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Title Input */}
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

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSaveJournal}
                disabled={isSavingJournal}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingJournal ? (isAr ? 'جاري الحفظ في السحابة...' : 'Saving to cloud...') : (isAr ? 'حفظ اليوميات والتأمل' : 'Save Daily Journal Entry')}</span>
              </button>
            </div>

            {/* Previous Daily Reflections Feed */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span>{isAr ? 'اليوميات المحفوظة السابقة' : 'Saved Daily Journal Entries'} ({dailyReviews.length})</span>
              </h3>

              {dailyReviews.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 bg-white dark:bg-neutral-900/40">
                  <BookOpen className="w-9 h-9 text-neutral-400 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isAr ? 'لم تقم بتسجيل أي تأمل يومي بعد. املأ النموذج أعلاه لحفظ أول يومية!' : 'No daily reflections saved yet. Fill the log above to record your first day!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dailyReviews.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white dark:bg-neutral-900/80 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-5 space-y-3.5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white font-mono border border-neutral-200 dark:border-neutral-700">
                              {entry.periodKey}
                            </span>
                            {entry.dayMood && (
                              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                                <span>{moodEmojis[entry.dayMood] || '✨'}</span>
                                <span className="capitalize">{entry.dayMood}</span>
                              </span>
                            )}
                            {entry.rating && (
                              <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                                <Star size={11} className="fill-amber-500 text-amber-500" />
                                <span>{entry.rating}/10</span>
                              </span>
                            )}
                          </div>

                          {onDeleteReview && (
                            <button
                              type="button"
                              onClick={() => onDeleteReview(entry.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {entry.title && (
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{entry.title}</h4>
                        )}

                        {entry.wins && (
                          <div className="text-xs bg-neutral-50 dark:bg-[#141518] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 space-y-1">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                              {isAr ? 'الإنجازات' : 'Wins'}
                            </span>
                            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{entry.wins}</p>
                          </div>
                        )}

                        {entry.lessons && (
                          <div className="text-xs bg-neutral-50 dark:bg-[#141518] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 space-y-1">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                              {isAr ? 'الدروس' : 'Lessons'}
                            </span>
                            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{entry.lessons}</p>
                          </div>
                        )}

                        {entry.challenges && (
                          <div className="text-xs bg-neutral-50 dark:bg-[#141518] p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 space-y-1">
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                              {isAr ? 'المعوقات' : 'Challenges'}
                            </span>
                            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{entry.challenges}</p>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
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
