import React, { useState, useMemo } from 'react';
import {
  Brain,
  BookOpen,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Maximize2,
  Play,
  Share2,
  Tag,
  Calendar,
  Save,
  Check,
  Zap,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Flame,
  CheckSquare,
  Moon,
  Coffee,
  Star,
  TrendingUp,
  ShieldAlert,
  Shuffle
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
  lang?: 'en' | 'ar';
}

export const ReflectionsJournal: React.FC<ReflectionsJournalProps> = ({
  reviews,
  habits,
  tasks,
  sleepLogs = [],
  focusSessions = [],
  weeklyGoals = [],
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
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';

  // Module Tabs: 'blocks' | 'visions' | 'affirmations' | 'journal'
  const [mainTab, setMainTab] = useState<'blocks' | 'visions' | 'affirmations' | 'journal'>('blocks');

  // Modal State for Focus Mode Vision Reader
  const [activeReaderStory, setActiveReaderStory] = useState<VisualizationStory | null>(null);

  // Modal State for Daily Affirmations Flashcard Pop-up
  const [isAffirmationPopupOpen, setIsAffirmationPopupOpen] = useState(false);

  // ---------------- FEATURE 1: BREAKTHROUGHS & COGNITIVE BLOCKS ----------------
  const [reflectionTitle, setReflectionTitle] = useState('');
  const [reflectionDesc, setReflectionDesc] = useState('');
  const [reflectionCategory, setReflectionCategory] = useState('Fear of Success');
  const [reflectionType, setReflectionType] = useState<'cognitive_block' | 'aha_moment' | 'mindset_shift'>('cognitive_block');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [extractingForId, setExtractingForId] = useState<string | null>(null);
  const [customAffirmationInput, setCustomAffirmationInput] = useState('');

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

    // AI-like transformation logic based on psychological reframing
    const promptReframes: Record<string, string[]> = {
      'Fear of Success': [
        `I am fully worthy and equipped to handle the exponential growth and new opportunities coming my way.`,
        `Success is a natural extension of my disciplined service and dedication.`
      ],
      'Imposter Syndrome': [
        `My achievements are earned through my focus, relentless execution, and continuous learning.`,
        `I belong in every room I enter, bringing unique value and clarity.`
      ],
      'Perfectionism': [
        `Done and iterated is vastly superior to perfect and unreleased.`,
        `I celebrate bold action and continuous refinement over stalling.`
      ],
    };

    const generated = promptReframes[refItem.category || ''] || [
      `I replace "${refItem.title}" with unwavering conviction and daily aligned action.`,
      `My mind is my standard-bearer; I choose empowerment over hesitation.`
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

  const handleAddManualAffirmationToBlock = async (refItem: CognitiveReflection) => {
    if (!refItem.id || !customAffirmationInput.trim() || !onUpdateReflection) return;
    const currentExtracted = refItem.extractedAffirmations || [];
    const updated = [...currentExtracted, customAffirmationInput.trim()];
    await onUpdateReflection(refItem.id, {
      extractedAffirmations: updated,
      updatedAt: Date.now()
    });
    setCustomAffirmationInput('');
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

  // ---------------- FEATURE 2: VISUALIZATION STORIES ----------------
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

  // ---------------- FEATURE 3: AFFIRMATIONS DECK MANAGEMENT ----------------
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

  // ---------------- FEATURE 4: JOURNAL & REFLECTIONS ----------------
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [journalSelectedDate, setJournalSelectedDate] = useState<string>(todayIso);
  const [journalMood, setJournalMood] = useState<'calm' | 'productive' | 'stressed' | 'neutral' | 'tired' | 'victorious'>('productive');
  const [journalRating, setJournalRating] = useState<number>(8);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalLessons, setJournalLessons] = useState('');
  const [journalWins, setJournalWins] = useState('');
  const [journalChallenges, setJournalChallenges] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  const handleSaveJournal = async () => {
    setIsSavingJournal(true);
    try {
      const title = journalTitle.trim() || (isAr ? `تأمل يوم ${journalSelectedDate}` : `Reflection for ${journalSelectedDate}`);
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
      soundManager.play('celebrate');
    } catch (e) {
      console.error('Failed to save journal entry:', e);
    } finally {
      setIsSavingJournal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* MODULE HEADER BAR */}
      <div className="bg-[#18191D] border border-neutral-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Brain size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">
                  {isAr ? 'العقلية وإعادة البرمجة (Mindset & Reflections)' : 'Mindset & Reflections Engine'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Atlas Cognitive OS
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {isAr
                  ? 'سجل التحديات النفسية والتحولات الذهنية، قمم التجسيد البصري، وتوكيدات إعادة البرمجة اليومية.'
                  : 'Log cognitive blocks, anchor vivid visualization stories, and practice daily identity reframing.'}
              </p>
            </div>
          </div>

          {/* MAIN MODULE TABS */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-2xl border border-neutral-800 w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setMainTab('blocks')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                mainTab === 'blocks'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Brain size={15} />
              <span>{isAr ? 'العوائق والتحولات' : 'Blocks & Breakthroughs'}</span>
            </button>

            <button
              onClick={() => setMainTab('visions')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                mainTab === 'visions'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles size={15} />
              <span>{isAr ? 'قصص التجسيد' : 'Visualization Stories'}</span>
            </button>

            <button
              onClick={() => setMainTab('affirmations')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                mainTab === 'affirmations'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers size={15} />
              <span>{isAr ? 'سطح التوكيدات' : 'Affirmations Deck'}</span>
            </button>

            <button
              onClick={() => setMainTab('journal')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                mainTab === 'journal'
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen size={15} />
              <span>{isAr ? 'سجل الدروس اليومي' : 'Daily Journal'}</span>
            </button>
          </div>
        </div>

        {/* SUB-SECTION 1: BREAKTHROUGHS & COGNITIVE BLOCKS */}
        {mainTab === 'blocks' && (
          <div className="pt-6 space-y-8">
            {/* Create Block Form */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                {isAr ? 'تسجيل عائق نفسي أو لحظة إدراك (Log Breakthrough or Block)' : 'Log Psychological Barrier or Aha! Moment'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs text-neutral-400 font-medium">
                    {isAr ? 'العنوان الرئيسي للتحدي الذهني' : 'Barrier / Breakthrough Title'}
                  </label>
                  <input
                    type="text"
                    value={reflectionTitle}
                    onChange={(e) => setReflectionTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: الخوف من النجاح، متلازمة المحتال، الخوف من النقد...' : 'e.g. Fear of Success, Imposter Syndrome, Perfectionism...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium">
                    {isAr ? 'الفئة النفسية' : 'Psychological Category'}
                  </label>
                  <select
                    value={reflectionCategory}
                    onChange={(e) => setReflectionCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Fear of Success">Fear of Success</option>
                    <option value="Imposter Syndrome">Imposter Syndrome</option>
                    <option value="Perfectionism">Perfectionism Stalling</option>
                    <option value="Fear of Failure">Fear of Failure</option>
                    <option value="Abundance vs Scarcity">Abundance vs Scarcity</option>
                    <option value="General Mindset">General Mindset Shift</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium">
                  {isAr ? 'الوصف التفصيلي وحقيقة الشعور' : 'Deep Description & Root Cause Analysis'}
                </label>
                <textarea
                  value={reflectionDesc}
                  onChange={(e) => setReflectionDesc(e.target.value)}
                  rows={3}
                  placeholder={isAr ? 'اشرح بالتفصيل كيف يظهر هذا العائق في يومك وما هي جذوره...' : 'Explain how this friction surfaces in your decisions and daily work...'}
                  className="w-full p-3 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveReflection}
                  disabled={isSavingReflection || !reflectionTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'حفظ العائق في السجل' : 'Save Barrier Entry'}</span>
                </button>
              </div>
            </div>

            {/* Saved Reflections List */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400">
                {isAr ? 'سجل التحديات والأفكار المسجلة' : 'Recorded Breakthroughs & Cognitive Barriers'} ({reflections.length})
              </h3>

              {reflections.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl p-6">
                  <Brain className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">
                    {isAr ? 'لم تقم بتسجيل أي عائق أو فكرة ذهنية بعد. استخدم النموذج أعلاه للبدء!' : 'No cognitive reflections logged yet. Record your first breakthrough above!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {reflections.map((ref) => (
                    <div
                      key={ref.id}
                      className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700/80 rounded-2xl p-5 space-y-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {ref.category || 'Mindset'}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {new Date(ref.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">{ref.title}</h4>
                        </div>

                        {onDeleteReflection && ref.id && (
                          <button
                            onClick={() => onDeleteReflection(ref.id!)}
                            className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed bg-[#18191D] p-3 rounded-xl border border-neutral-800/80">
                        {ref.description}
                      </p>

                      {/* Extracted Affirmations Display & Controls */}
                      <div className="pt-2 border-t border-neutral-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {isAr ? 'التوكيدات المعاكسة المستخرجة:' : 'Counter Affirmations:'}
                          </span>

                          <button
                            onClick={() => handleGenerateAtlasAffirmation(ref)}
                            disabled={extractingForId === ref.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
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
                                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200"
                              >
                                <span className="font-medium italic">"{aff}"</span>
                                <button
                                  onClick={() => handlePromoteToDeck(aff, ref.title, ref.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] whitespace-nowrap transition-colors"
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

        {/* SUB-SECTION 2: VISUALIZATION STORIES */}
        {mainTab === 'visions' && (
          <div className="pt-6 space-y-8">
            {/* Create Story Form */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {isAr ? 'صياغة قصة تجسيد جديدة (Write Visualization Story)' : 'Write New Visualization Story'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs text-neutral-400 font-medium">
                    {isAr ? 'عنوان القصة والرؤية' : 'Story Title'}
                  </label>
                  <input
                    type="text"
                    value={visionTitle}
                    onChange={(e) => setVisionTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: يوم في حياتي بعد سنة من الآن، إطلاق المنصة بنجاح...' : 'e.g. A day in my life 1 year from now, Scaling to $10k/mo...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium">
                    {isAr ? 'موضوع التجسيد' : 'Visualization Theme'}
                  </label>
                  <input
                    type="text"
                    value={visionTheme}
                    onChange={(e) => setVisionTheme(e.target.value)}
                    placeholder="e.g. 1 Year Ideal Future"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium">
                  {isAr ? 'نص التجسيد العميق (Rich Story Content)' : 'Rich Story Content (First Person Present Tense)'}
                </label>
                <textarea
                  value={visionStoryText}
                  onChange={(e) => setVisionStoryText(e.target.value)}
                  rows={6}
                  placeholder={isAr ? 'اكتب بصيغة الحاضر والتفاصيل الحسية كاملة...' : 'Write in present tense describing sight, feel, energy and outcomes...'}
                  className="w-full p-3 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-serif leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveVision}
                  disabled={isSavingVision || !visionTitle.trim() || !visionStoryText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'حفظ قصة التجسيد' : 'Save Story'}</span>
                </button>
              </div>
            </div>

            {/* List of Saved Visions */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400">
                {isAr ? 'قصص التجسيد المحفوظة' : 'Saved Visualization Scripts'} ({visions.length})
              </h3>

              {visions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl p-6">
                  <Sparkles className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400">
                    {isAr ? 'لا توجد قصص تجسيد بعد. اكتب قصتك الأولى وأطلق طاقة التركيز!' : 'No visualization stories written yet. Create your first script above!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visions.map((vis) => (
                    <div
                      key={vis.id}
                      className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {vis.theme || 'Future Vision'}
                          </span>
                          {onDeleteVision && vis.id && (
                            <button
                              onClick={() => onDeleteVision(vis.id!)}
                              className="p-1 rounded-lg hover:bg-rose-500/20 text-neutral-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-white">{vis.title}</h4>
                        <p className="text-xs text-neutral-400 line-clamp-3 font-serif">
                          {vis.storyContent}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-500">
                          {vis.readingTimeMinutes || 2} {isAr ? 'دقائق قراءة' : 'min read'}
                        </span>

                        <button
                          onClick={() => setActiveReaderStory(vis)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
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

        {/* SUB-SECTION 3: AFFIRMATIONS DECK */}
        {mainTab === 'affirmations' && (
          <div className="pt-6 space-y-8">
            {/* Top Deck Banner & Trigger Flashcard Modal */}
            <div className="p-6 bg-gradient-to-r from-emerald-950/40 to-neutral-900 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2 justify-center md:justify-start">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  {isAr ? 'سطح البرمجة التلقائية والتوكيدات' : 'Daily Identity Reprogramming Deck'}
                </h3>
                <p className="text-xs text-neutral-400">
                  {isAr ? 'انقر للبدء في تصفح بطاقات البرمجة الذهنية في تجربة تفاعلية مليئة بالتركيز.' : 'Start the immersive flashcard experience with timer or manual step.'}
                </p>
              </div>

              <button
                onClick={() => setIsAffirmationPopupOpen(true)}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/20 shrink-0"
              >
                <Play className="w-4 h-4 fill-neutral-950" />
                <span>{isAr ? 'تشغيل بطاقات التوكيدات اليومية' : 'Open Affirmations Popup'}</span>
              </button>
            </div>

            {/* Quick Add Affirmation Form */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={newAffirmationText}
                onChange={(e) => setNewAffirmationText(e.target.value)}
                placeholder={isAr ? 'اكتب توكيداً جديداً وتثبيتاً لمعتقد إيجابي...' : 'Type a new empowering statement...'}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500 w-full"
              />

              <select
                value={newAffirmationCategory}
                onChange={(e) => setNewAffirmationCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
              >
                <option value="Mindset">Mindset</option>
                <option value="Focus">Focus</option>
                <option value="Confidence">Confidence</option>
                <option value="Abundance">Abundance</option>
                <option value="Resilience">Resilience</option>
                <option value="Health">Health</option>
              </select>

              <button
                onClick={handleAddDeckAffirmation}
                disabled={!newAffirmationText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold text-xs whitespace-nowrap w-full sm:w-auto"
              >
                + {isAr ? 'إضافة' : 'Add Card'}
              </button>
            </div>

            {/* List of Deck Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {affirmations.map((aff) => (
                <div
                  key={aff.id}
                  className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {aff.category || 'Mindset'}
                    </span>
                    <p className="text-xs font-bold text-white italic leading-relaxed">
                      "{aff.statement}"
                    </p>
                  </div>

                  {onDeleteAffirmation && aff.id && (
                    <div className="flex justify-end pt-2 border-t border-neutral-800/60">
                      <button
                        onClick={() => onDeleteAffirmation(aff.id!)}
                        className="p-1 rounded hover:bg-rose-500/20 text-neutral-500 hover:text-rose-400 transition-colors"
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

        {/* SUB-SECTION 4: DAILY JOURNAL */}
        {mainTab === 'journal' && (
          <div className="pt-6 space-y-6">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  {isAr ? 'تأمل اليوم والدروس المستفادة' : 'Daily Reflection Log'}
                </h3>
                <input
                  type="date"
                  value={journalSelectedDate}
                  onChange={(e) => setJournalSelectedDate(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-neutral-800 bg-[#18191D] text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">{isAr ? 'الدروس المستفادة' : 'Lessons Learned'}</label>
                  <textarea
                    value={journalLessons}
                    onChange={(e) => setJournalLessons(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">{isAr ? 'أين ضاع الوقت؟' : 'Time Leaks / Friction'}</label>
                  <textarea
                    value={journalChallenges}
                    onChange={(e) => setJournalChallenges(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-[#18191D] border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveJournal}
                  disabled={isSavingJournal}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingJournal ? '...' : (isAr ? 'حفظ اليوم' : 'Save Entry')}</span>
                </button>
              </div>
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
