import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  CalendarDays, 
  StickyNote, 
  Flame, 
  CheckSquare, 
  ListChecks, 
  FolderKanban, 
  Database, 
  Zap, 
  Sparkles, 
  Brain, 
  Clock, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  Compass, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  BarChart3, 
  Activity, 
  ShieldCheck, 
  RefreshCw, 
  Lightbulb, 
  TrendingUp, 
  HelpCircle,
  Copy,
  Check,
  Briefcase,
  Users,
  Dumbbell,
  Target,
  Bookmark,
  Snowflake,
  Sliders,
  Award,
  Trophy,
  Volume2,
  Lock,
  Gift,
  RotateCcw,
  Bot,
  FileCode,
  Upload
} from 'lucide-react';
import { ModuleType } from '../types';
import { InteractiveWalkthroughGuide } from './InteractiveWalkthroughGuide';
import { importBackupData } from '../services/firestoreService';
import { playCelebrationChime } from '../utils/focusAudio';
import confetti from 'canvas-confetti';

interface UserGuideProps {
  onNavigateModule: (module: ModuleType) => void;
  lang?: 'en' | 'ar';
}

type GuideSection = 
  | 'planner'
  | 'life-phases'
  | 'rewards-vault'
  | 'habits-matrix'
  | 'task-eisenhower'
  | 'checklists-sop'
  | 'projects-okr'
  | 'notes-brain-dump'
  | 'goals-vision'
  | 'analytics-telemetry'
  | 'customization-audio'
  | 'algorithms-tech'
  | 'daily-weekly-routines';

export const MASTER_AI_PROMPT_TEXT = `# 🎯 MASTER INSTRUCTION FOR AI ASSISTANT: PERSONALIZED LIFE-OS ARCHITECT & DATA GENERATOR

## 1. CONTEXT & YOUR ROLE
You are acting as an elite Executive Systems Architect and Personal Performance Engineer.
You already have comprehensive, personalized context about me: my strengths, current work/business focus, target habits, energy levels throughout the day, fitness preferences, time constraints, health goals, and aspirations.

I am using a dedicated personal operating system called "Core (Life-OS)" — a high-performance productivity application built on React, TypeScript, and Firebase.
Your objective is to take EVERYTHING you already know about me and synthesize it into a pristine, fully populated JSON structure that I can directly paste and import into my application in one single click.

---

## 2. ⚠️ THE NUMBER ONE GOLDEN RULE & STRICT RESTRICTION
🛑 CRITICAL CONSTRAINT: DO NOT GENERATE TASKS!
The "tasks" array MUST remain strictly empty: "tasks": [].
- Reason: Daily tasks are dynamic and operational. I will manually define and execute them day-by-day inside the Task Tracker based on evolving real-world demands.
- Your scope is exclusively the permanent structural scaffolding of my life:
  1. Atomic Habits & Routines (habits)
  2. Daily Energy Blocks (dailyBlocks)
  3. Weekly 7-Day Master Calendar Schedule (planner)
  4. Strategic Projects & OKRs (projects)
  5. Strategic Life Focus Phases & Category Weights (lifePhases)
  6. Standard Operating Procedures & Checklists (checklists)
  7. Long-term Vision Targets & Goals (goals)
  8. Gamified Milestone Rewards Store (rewards)

---

## 3. REQUIRED MODULES & DETAILED DATA SCHEMAS

### A) Habits ("habits" array):
Create 6 to 10 realistic, high-impact atomic habits tailored specifically to my routine.
Each habit object MUST follow this schema:
{
  "title": "Habit Name (e.g., Morning Sunlight & 500ml Water)",
  "icon": "Single relevant emoji (e.g., 💧, 📖, 🏋️, 🧘, ⚡)",
  "category": "Health" | "Business" | "Personal" | "Mindset" | "Finance" | "Learning",
  "timeOfDay": "morning" | "afternoon" | "evening" | "anytime",
  "frequency": "daily" | "weekdays" | "weekends" | "3_times_week",
  "description": "Clear actionable trigger and standard (e.g., Right after waking up, drink water and get outdoor light)",
  "isMeasurable": true | false,
  "targetValue": 20,
  "unit": "pages" | "mins",
  "streak": 0,
  "archived": false
}

### B) Daily Energy Blocks ("dailyBlocks" array):
Create a structured set of 5 to 7 daily blocks covering my entire waking day based on cognitive chronobiology (peak focus in morning, recovery mid-day, execution afternoon, shutdown evening):
{
  "title": "Block Title (e.g., Morning Ignition & Priming / Deep Work Sprint 1 / Physical Training / Evening Wind-Down)",
  "subtitle": "Key activities and focus during this block",
  "startTime": "HH:MM (24-hour format, e.g., 07:30)",
  "endTime": "HH:MM (24-hour format, e.g., 09:00)",
  "blockType": "morning" | "deep-work" | "execution" | "recharge" | "fitness" | "evening",
  "energyRequired": "high" | "medium" | "low",
  "color": "amber" | "emerald" | "cyan" | "indigo" | "rose" | "purple",
  "icon": "Single emoji (e.g., 🌅, 🎯, 🥗, 🚀, 🏋️, 🌙)",
  "targetFocusMinutes": 30 | 120 | 0 | 90 | 60 | 20,
  "status": "pending",
  "order": 1,
  "date": "2026-10-27"
}

### C) Weekly Planner 7-Day Matrix ("planner" array):
Create 15 to 25 recurring time-slots distributed across the 7 days of the week:
- dayIndex: 0 = Monday, 1 = Tuesday, 2 = Wednesday, 3 = Thursday, 4 = Friday, 5 = Saturday, 6 = Sunday.
{
  "dayIndex": 0,
  "title": "Scheduled Block Title (e.g., Prime Cognitive Deep Work)",
  "startTime": "09:00",
  "endTime": "12:00",
  "timeSlot": "09:00 - 12:00",
  "type": "deep-work" | "workout" | "general",
  "blockType": "deep-work" | "fitness" | "execution" | "morning" | "evening",
  "color": "emerald" | "rose" | "indigo" | "amber" | "purple",
  "icon": "🎯",
  "energyRequired": "high" | "medium" | "low",
  "notes": "Clear instructions for this time block",
  "isRecurring": true,
  "completed": false
}

### D) Strategic Projects ("projects" array):
Create 2 to 4 active projects matching my current life and business priorities:
{
  "title": "Project Title (e.g., Core Product MVP Launch)",
  "category": "Business" | "Personal" | "Health" | "Finance" | "Learning",
  "status": "Active",
  "color": "#10B981" | "#6366F1" | "#F59E0B" | "#EC4899",
  "description": "Clear deliverable definition and definition of done",
  "progress": 0,
  "targetDate": "2026-12-31",
  "archived": false
}

### E) Strategic Life Phases ("lifePhases" array):
Create 2 strategic phases that define priority weightings, with the first phase set to active:
[
  {
    "id": "phase-1-accelerate",
    "name": "Sprint & High-Leverage Acceleration",
    "description": "Heavy emphasis on business delivery and core deliverables while maintaining physical baseline.",
    "startDate": "2026-10-27",
    "isActive": true,
    "categoryWeights": { "Business": 65, "Personal": 15, "Health": 20, "Learning": 0, "Finance": 0 }
  },
  {
    "id": "phase-2-recharge",
    "name": "Harmonious Health & Lifestyle Reset",
    "description": "Equal distribution between business maintenance and physical health/personal rejuvenation.",
    "startDate": "2026-10-27",
    "isActive": false,
    "categoryWeights": { "Business": 40, "Personal": 30, "Health": 30, "Learning": 0, "Finance": 0 }
  }
]

### F) Checklists & SOPs ("checklists" array):
Create 3 to 4 standard operating procedure checklists to streamline recurring routines:
{
  "title": "Morning Ignition SOP",
  "category": "Operations" | "Health" | "Mindset" | "General",
  "items": [
    { "id": "step-1", "text": "Drink 500ml water and get outdoor light", "completed": false },
    { "id": "step-2", "text": "Review today's top 3 priority commitments", "completed": false }
  ]
}

### G) Long-Term Goals ("goals" array):
Create 3 to 5 clear endpoint targets:
{
  "title": "Goal Title (e.g., Reach $10k Monthly Recurring Revenue)",
  "category": "Business" | "Personal" | "Health" | "Finance",
  "horizon": "Q1" | "1 Year" | "3 Years",
  "targetValue": 10000,
  "currentValue": 0,
  "unit": "$",
  "progress": 0,
  "description": "Strategic North Star statement"
}

### H) Milestone Rewards Store ("rewards" array):
Create 3 to 5 gamified rewards to celebrate consistency:
{
  "title": "Reward Title (e.g., Specialty Coffee & Pastry / New Workout Gear / Weekend Cinema Night)",
  "description": "Milestone celebration criteria",
  "icon": "☕",
  "category": "Personal Treat" | "Shopping" | "Entertainment",
  "milestoneType": "streak",
  "targetCount": 7,
  "isClaimed": false
}

---

## 4. STRICT OUTPUT INSTRUCTIONS
Return ONLY a valid, copy-pasteable JSON object matching the exact structure below. Do not wrap with conversational greetings or chit-chat.

\`\`\`json
{
  "version": "3.0",
  "system": "Life-OS Core Workspace Backup",
  "exportedAt": "2026-10-27T10:00:00.000Z",
  "data": {
    "habits": [...],
    "dailyBlocks": [...],
    "planner": [...],
    "projects": [...],
    "lifePhases": [...],
    "checklists": [...],
    "goals": [...],
    "rewards": [...],
    "tasks": []
  }
}
\`\`\`

Now, analyze everything you know about my personal goals, habits, work schedule, and fitness aspirations. Synthesize my optimal personalized configuration and output the complete JSON code above!`;

export const UserGuide: React.FC<UserGuideProps> = ({ onNavigateModule, lang = 'en' }) => {
  const [guideMode, setGuideMode] = useState<'walkthrough' | 'docs' | 'ai-prompt'>('walkthrough');
  const [activeSection, setActiveSection] = useState<GuideSection>('planner');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRoutine, setCopiedRoutine] = useState<string | null>(null);
  const [copiedAiPrompt, setCopiedAiPrompt] = useState<boolean>(false);
  const [pastedJsonInput, setPastedJsonInput] = useState<string>('');
  const [jsonImportSuccess, setJsonImportSuccess] = useState<string | null>(null);
  const [jsonImportError, setJsonImportError] = useState<string | null>(null);
  const [isApplyingJson, setIsApplyingJson] = useState<boolean>(false);

  // Time Block Calculator State
  const [deepWorkHours, setDeepWorkHours] = useState<number>(4);
  const [meetingHours, setMeetingHours] = useState<number>(2);
  const [adminHours, setAdminHours] = useState<number>(1.5);
  const [personalHours, setPersonalHours] = useState<number>(2.5);

  const totalCalculatedHours = deepWorkHours + meetingHours + adminHours + personalHours;
  const deepWorkRatio = totalCalculatedHours > 0 ? Math.round((deepWorkHours / totalCalculatedHours) * 100) : 0;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRoutine(id);
    setTimeout(() => setCopiedRoutine(null), 2000);
  };

  const isAr = lang === 'ar';

  const handleCopyAiPrompt = () => {
    navigator.clipboard.writeText(MASTER_AI_PROMPT_TEXT);
    setCopiedAiPrompt(true);
    setTimeout(() => setCopiedAiPrompt(false), 2500);
  };

  const handleApplyPastedJson = async () => {
    if (!pastedJsonInput.trim()) {
      setJsonImportError(isAr ? 'يرجى لصق كود الـ JSON أولاً.' : 'Please paste the JSON code first.');
      return;
    }
    setIsApplyingJson(true);
    setJsonImportError(null);
    setJsonImportSuccess(null);
    try {
      const parsed = JSON.parse(pastedJsonInput.trim());
      const payload = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      const count = await importBackupData(payload);
      playCelebrationChime();
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6366F1', '#F59E0B']
      });
      setJsonImportSuccess(
        isAr
          ? `✓ رائع! تم بنجاح استيراد وتطبيق ${count} عنصراً في نظامك (العادات، فترات اليوم، المخطط، المشاريع، الأهداف، وقوائم التدقيق)!`
          : `✓ Success! Imported and applied ${count} items into your Life-OS (Habits, Blocks, Schedule, Projects, Goals & Checklists)!`
      );
      setPastedJsonInput('');
    } catch (err: any) {
      console.error('Failed to parse or import JSON:', err);
      setJsonImportError(
        isAr
          ? `خطأ في قراءة كود الـ JSON: ${err.message || 'تأكد من نسخ الكود كاملاً وبصيغة JSON صحيحة'}`
          : `JSON parsing error: ${err.message || 'Make sure you copied valid and complete JSON'}`
      );
    } finally {
      setIsApplyingJson(false);
    }
  };

  const sections = [
    {
      id: 'planner' as GuideSection,
      title: isAr ? 'المخطط الرئيسي لـ 7 أيام' : 'Weekly 7-Day Master Planner',
      subtitle: isAr ? 'تقسيم الوقت، قانون باركنسون وهندسة التقويم' : 'Time Blocking, Parkinson\'s Law, & Calendar Architecture',
      icon: CalendarDays,
      badge: isAr ? 'أساسي' : 'Core',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'life-phases' as GuideSection,
      title: isAr ? 'مراحل التركيز الاستراتيجي والوزن النسبي' : 'Strategic Life Focus Phases & Weights',
      subtitle: isAr ? 'إعادة معايرة خوارزمية الأولويات حسب فترة حياتك' : 'Priority Calibration & Dominant Category Weighting',
      icon: Layers,
      badge: isAr ? 'إستراتيجية' : 'Strategy',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'rewards-vault' as GuideSection,
      title: isAr ? 'متجر المكافآت والتحفيز التراكمي' : 'Milestone Rewards & Gamification Vault',
      subtitle: isAr ? 'مكافأة الذات عند تحقيق السلاسل والأهداف' : 'Self-Incentives, Streak Milestones & Vault Redemptions',
      icon: Trophy,
      badge: isAr ? 'تحفيز' : 'Rewards',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'habits-matrix' as GuideSection,
      title: isAr ? 'العادات الذرية، الروتينات وتجميد السلاسل' : 'Atomic Habits, Routines & Streak Freezes',
      subtitle: isAr ? 'روتينات الصباح والمساء، وحماية السلاسل بالأعذار' : 'Time-of-Day Routines, 1-Tap Checkoffs & Banked Freezes',
      icon: Flame,
      badge: isAr ? 'عادات' : 'Habits',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'task-eisenhower' as GuideSection,
      title: isAr ? 'مصفوفة أيزنهاور، المهام وإدارة التأجيل' : 'Task Execution, Urgency & Postpone Skips',
      subtitle: isAr ? 'ترتيب الأولويات بالوقت وتوثيق أسباب التأجيل' : 'Due Time Urgency, 4-Quadrant Matrix & Rollover Tracking',
      icon: CheckSquare,
      badge: isAr ? 'تنفيذ' : 'Execution',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'checklists-sop' as GuideSection,
      title: isAr ? 'محرك قوائم التدقيق وإجراءات SOP' : 'Checklists Engine & Executive SOPs',
      subtitle: isAr ? 'بيان قوائم التدقيق ومنع الأخطاء التشغيلية' : 'The Checklist Manifesto & Operational Quality Control',
      icon: ListChecks,
      badge: isAr ? 'عمليات' : 'Operations',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'projects-okr' as GuideSection,
      title: isAr ? 'المشاريع ومحطات أهداف OKR' : 'Projects & OKR Goal Milestones',
      subtitle: isAr ? 'هندسة النتائج الرئيسية وربط المهام بالمشاريع' : 'Objective & Key Results (OKR) & Milestone Tracking',
      icon: FolderKanban,
      badge: isAr ? 'مشاريع' : 'Projects',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'notes-brain-dump' as GuideSection,
      title: isAr ? 'العقل الثاني وتفريغ الأفكار (Brain Dump)' : 'Second Brain & Brain Dump Pipeline',
      subtitle: isAr ? 'احفظ أولاً، اقرأ لاحقاً والتحويل السريع لمهام' : 'Zero-Friction Capture, Read Later & One-Click Conversions',
      icon: StickyNote,
      badge: isAr ? 'معرفة' : 'Knowledge',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'goals-vision' as GuideSection,
      title: isAr ? 'الأهداف وهندسة الغايات النهائية' : 'Goals & Endpoint Target Architecture',
      subtitle: isAr ? 'بيانات الرؤية، المقاييس الرقمية والمحطات' : 'Vision Statements, Numeric Metrics & Horizons',
      icon: Target,
      badge: isAr ? 'أهداف' : 'Goals',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'analytics-telemetry' as GuideSection,
      title: isAr ? 'التحليلات ورادار الأداء التنفيذي' : 'Analytics & Executive Performance Radar',
      subtitle: isAr ? 'القياس الكمي، خطوط الاتجاه ومؤشر الأبعاد الستة' : 'Quantitative Telemetry, Trend Lines & 6-Dimension Index',
      icon: BarChart3,
      badge: isAr ? 'تحليلات' : 'Analytics',
      category: isAr ? 'الوحدات الأساسية' : 'Core Modules',
    },
    {
      id: 'customization-audio' as GuideSection,
      title: isAr ? 'تخصيص وحذف الميزات والمؤثرات الصوتية' : 'Feature Controls, Audio & Customization',
      subtitle: isAr ? 'التحكم بكافة العناصر المضافة والمؤثرات الصوتية' : 'Granular Feature Control, Audio Synthesizer & Layout Tuning',
      icon: Sliders,
      badge: isAr ? 'تخصيص' : 'Settings',
      category: isAr ? 'الإعدادات والتحكم' : 'Settings & Controls',
    },
    {
      id: 'algorithms-tech' as GuideSection,
      title: isAr ? 'كواليس التطبيق: الخوارزميات والمزامنة' : 'Under the Hood: Algorithms & Real-Time Sync',
      subtitle: isAr ? 'الصيغ الرياضية ومحرك Firestore السحابي' : 'Formulas, Sorting Logic & Cloud Firestore Engine',
      icon: Cpu,
      badge: isAr ? 'تقني' : 'Technical',
      category: isAr ? 'مواصفات فنية' : 'Technical Specs',
    },
    {
      id: 'daily-weekly-routines' as GuideSection,
      title: isAr ? 'مخططات التشغيل الرئيسية وإجراءات العمل' : 'Master Operating Blueprints & SOPs',
      subtitle: isAr ? 'روتين الصباح والمساء وإعادة ضبط الأحد' : 'Step-by-step Morning, Evening & Sunday Reset Rituals',
      icon: Compass,
      badge: isAr ? 'كتيبات' : 'Playbooks',
      category: isAr ? 'كتيبات العمل' : 'Playbooks',
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [searchQuery, isAr]);

  const tBanner = {
    kb: isAr ? 'قاعدة المعرفة الرئيسية ودليل التشغيل' : 'Master Knowledge Base & Operating Guide',
    title: isAr ? 'دليل التشغيل الشامل والمنهجية' : 'Comprehensive Operating Manual & Methodology',
    desc: isAr ? 'دليل مرجعي كامل يشرح جميع ميزات التطبيق، علم النفس المعرفي، هندسة تقسيم الوقت، خوارزميات الأولويات، وإرشادات التخصيص خطوة بخطوة.' : 'An exhaustive reference guide explaining every feature, cognitive psychology, time-blocking architecture, priority weighting algorithms, and step-by-step customization workflows.',
    searchPlaceholder: isAr ? 'ابحث في الدليل (مثل: مراحل التركيز، المكافآت، العادات، التجميد، التخطيط...)...' : 'Search guide (e.g., life phases, rewards, streak freeze, planner, habits)...',
    clear: isAr ? 'مسح' : 'Clear',
    toc: isAr ? 'فهرس الدليل' : 'Table of Contents',
    chapters: isAr ? 'أقسام' : 'Sections',
    launchApp: isAr ? 'الانتقال للوحدة' : 'Open Module',
    dbActive: isAr ? 'كلاود فايرستور متزامن' : 'Cloud Firestore Synced',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2F3437] via-neutral-800 to-[#2F3437] text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300 font-bold">
            <BookOpen size={14} />
            <span>{tBanner.kb}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            {tBanner.title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed pt-1">
            {tBanner.desc}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mt-6 max-w-md">
          <Search size={16} className={`absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-neutral-400`} />
          <input
            type="text"
            placeholder={tBanner.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-neutral-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15 transition-all shadow-inner`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white cursor-pointer`}
            >
              {tBanner.clear}
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGuideMode('walkthrough')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              guideMode === 'walkthrough'
                ? 'bg-amber-600 text-white shadow-sm scale-[1.01]'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <Sparkles size={15} />
            <span>{isAr ? 'المحاكي التفاعلي والشرح المرئي (جديد)' : 'Interactive Visual Blueprint (New)'}</span>
          </button>

          <button
            onClick={() => setGuideMode('docs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              guideMode === 'docs'
                ? 'bg-[#2F3437] text-white shadow-sm'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <BookOpen size={15} />
            <span>{isAr ? 'الدليل المفصل والكتيبات (Documentation)' : 'Detailed Docs & Playbooks'}</span>
          </button>

          <button
            onClick={() => setGuideMode('ai-prompt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              guideMode === 'ai-prompt'
                ? 'bg-emerald-600 text-white shadow-sm scale-[1.01]'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Bot size={15} />
            <span>{isAr ? '🤖 موجه الذكاء الاصطناعي (AI Setup Prompt)' : '🤖 AI Setup Assistant Prompt'}</span>
          </button>
        </div>

        <span className="text-xs text-neutral-400 hidden sm:inline">
          {guideMode === 'walkthrough'
            ? (isAr ? 'شرح عملي خطوة بخطوة بالـ examples الحية' : 'Step-by-step visual simulator with static mockups')
            : guideMode === 'ai-prompt'
            ? (isAr ? 'استنساخ خطتك الشخصية عبر الذكاء الاصطناعي' : 'Generate complete workspace code with your AI assistant')
            : (isAr ? 'كتيبات العمل والمنهجية الفنية' : 'In-depth reference documentation and playbooks')}
        </span>
      </div>

      {guideMode === 'walkthrough' ? (
        <InteractiveWalkthroughGuide 
          onNavigateModule={onNavigateModule} 
          onSwitchToAiPrompt={() => setGuideMode('ai-prompt')}
          lang={lang} 
        />
      ) : guideMode === 'ai-prompt' ? (
        /* ========================================================
           AI SYSTEM PROMPT & CODE GENERATOR DASHBOARD
           ======================================================== */
        <div className="space-y-6 animate-fadeIn">
          {/* Top Hero Banner */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-500/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-200 border border-white/20 text-xs font-bold">
                <Sparkles size={14} className="text-amber-300" />
                <span>{isAr ? 'تجهيز النظام الشخصي بالذكاء الاصطناعي' : 'AI-Powered System Setup'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {isAr ? '🤖 موجه الذكاء الاصطناعي (AI Setup Assistant Prompt)' : '🤖 Master AI Setup Assistant Prompt'}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                {isAr
                  ? 'إذا كنت قد تحدثت مسبقاً مع مساعد ذكاء اصطناعي (مثل ChatGPT أو Claude أو Gemini) ويعرف تفاصيل حياتك، أهدافك، روتينك، وما تريد تحقيقه: ما عليك سوى نسخ هذا البرومبت الشامل وإعطائه له. سيقوم بدراسة كل ما يعرفه عنك وصياغة كود الـ JSON المتطابق مع هذا التطبيق، لتقوم بلصقه هنا وتطبيق خطتك في ثانية واحدة!'
                  : 'Already chatted with an AI assistant (ChatGPT, Claude, Gemini) that knows your life context, habits, and goals? Copy this master prompt, feed it to your assistant, and let it generate a tailored JSON code that populates your entire Life-OS in one click!'}
              </p>
            </div>
          </div>

          {/* 3-Step Flow Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-white dark:bg-[#18191D] p-5 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-sm border border-emerald-200 dark:border-emerald-800">
                1
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                {isAr ? 'انسخ البرومبت الشامل' : 'Copy the Master Prompt'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {isAr
                  ? 'اضغط على زر النسخ أدناه لنسخ البرومبت الكامل المليء بكافة مواصفات وقواعد التطبيق.'
                  : 'Click the copy button below to copy the full prompt with complete architectural specifications.'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-[#18191D] p-5 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-sm border border-indigo-200 dark:border-indigo-800">
                2
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                {isAr ? 'أعطه لمساعدك الذكي' : 'Feed to your AI Assistant'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {isAr
                  ? 'الصق البرومبت في محادثتك مع الذكاء الاصطناعي الذي يعرفك جيداً. سيقوم بتوليد كود JSON نقي.'
                  : 'Paste it in your ongoing chat with ChatGPT, Claude, or Gemini. It will output clean JSON.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-[#18191D] p-5 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-extrabold flex items-center justify-center text-sm border border-purple-200 dark:border-purple-800">
                3
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                {isAr ? 'الصق الكود هنا وطبقه فوراً' : 'Paste JSON Code & Apply'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {isAr
                  ? 'انسخ كود الـ JSON الناتج وضعه في صندوق الاستيراد أدناه واضغط تطبيق ليملأ النظام عاداتك وجدولك!'
                  : 'Copy the resulting JSON code, paste it into the box below, and click Apply to set up your workspace.'}
              </p>
            </div>
          </div>

          {/* CRITICAL EXCLUSION NOTICE (NO TASKS) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <AlertCircle size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-200">
                {isAr
                  ? '⚠️ شرط أساسي مدمج: عدم توليد المهام اليومية (tasks = [])'
                  : '⚠️ Critical Rule Included: No Daily Tasks Generated (tasks = [])'}
              </h4>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                {isAr
                  ? 'البرومبت يشترط صراحةً على الذكاء الاصطناعي ترك مصفوفة المهام فارغة، حتى تقوم أنت شخصياً بإدخال مهامك يومياً حسب مستجدات كل نهار. الذكاء الاصطناعي سيهندس لك الهيكل الثابت فقط: العادات، فترات اليوم (Daily Blocks)، المخطط الأسبوعي (Weekly Planner)، المشاريع، مراحل الحياة، قوائم التدقيق (SOPs)، الأهداف، ومتجر المكافآت.'
                  : 'The prompt strictly instructs the AI to leave tasks empty because you will manage operational tasks daily. The AI focuses purely on your permanent life architecture: habits, daily energy blocks, weekly master schedule, projects, strategic phases, checklists/SOPs, goals, and milestone rewards.'}
              </p>
            </div>
          </div>

          {/* Prompt Copy & Interactive Code Card */}
          <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs space-y-4">
            <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/70 dark:bg-neutral-900/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white">
                    {isAr ? 'نص البرومبت الشامل (Master Prompt)' : 'Master AI System Prompt'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {isAr ? 'جاهز للنسخ الفوري باللغة الإنجليزية المعيارية لضمان أعلى دقة برمجية' : 'Standard English prompt optimized for ChatGPT, Claude, and Gemini'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyAiPrompt}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                {copiedAiPrompt ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                <span>{copiedAiPrompt ? (isAr ? '✓ تم النسخ بنجاح!' : '✓ Copied to Clipboard!') : (isAr ? 'نسخ البرومبت الكامل 📋' : 'Copy Master Prompt 📋')}</span>
              </button>
            </div>

            {/* Scrollable Preformatted Code Block */}
            <div className="p-4 sm:p-6">
              <pre className="text-xs font-mono bg-neutral-900 text-neutral-100 p-4 sm:p-6 rounded-2xl overflow-x-auto max-h-96 leading-relaxed select-all whitespace-pre-wrap border border-neutral-800 shadow-inner">
                {MASTER_AI_PROMPT_TEXT}
              </pre>
            </div>
          </div>

          {/* Instant JSON Importer Section (No File Required!) */}
          <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-emerald-500/30 dark:border-emerald-500/30 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-2xs">
                <Upload size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white">
                  {isAr ? 'مستورد الكود المباشر (Direct JSON Importer)' : 'Direct JSON Code Importer'}
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {isAr
                    ? 'بعد أن يُعطيك الذكاء الاصطناعي كود الـ JSON، الصقه هنا واضغط تطبيق ليتم ملء نظامك فوراً دون حفظ أي ملف!'
                    : 'Paste the JSON code received from your AI assistant and apply it immediately without saving any file.'}
                </p>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              rows={6}
              value={pastedJsonInput}
              onChange={(e) => {
                setPastedJsonInput(e.target.value);
                setJsonImportError(null);
                setJsonImportSuccess(null);
              }}
              placeholder={isAr ? 'الصق كود الـ JSON هنا (مثال: { "version": "3.0", "data": { ... } })...' : 'Paste your JSON code here...'}
              className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 font-mono text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-neutral-400"
            />

            {/* Status alerts */}
            {jsonImportError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{jsonImportError}</span>
              </div>
            )}

            {jsonImportSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{jsonImportSuccess}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[11px] text-neutral-400">
                {isAr
                  ? 'سيتم الحفظ في قاعدة بيانات السحابة فايرستور فوراً وتحديث واجهاتك.'
                  : 'Items will sync immediately into your Cloud Firestore and workspace.'}
              </span>

              <button
                type="button"
                onClick={handleApplyPastedJson}
                disabled={isApplyingJson || !pastedJsonInput.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Zap size={14} />
                <span>{isApplyingJson ? (isAr ? 'جاري التطبيق...' : 'Applying...') : (isAr ? '⚡ تطبيق واستيراد الكود لمساحة العمل فوراً' : '⚡ Apply & Import to Workspace')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Main Grid: Navigation Sidebar + Active Guide Content */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Menu */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white dark:bg-[#18191D] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] p-3 shadow-xs sticky top-4">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#787774] dark:text-neutral-400 border-b border-[#EAE9E6] dark:border-[#2A2C33] mb-1 flex items-center justify-between">
              <span>{tBanner.toc}</span>
              <span>{filteredSections.length} {tBanner.chapters}</span>
            </div>

            <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;

                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveSection(sec.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-start p-3 rounded-xl transition-all flex items-start gap-3 group relative cursor-pointer ${
                      isActive
                        ? 'bg-[#2F3437] text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                        : 'hover:bg-neutral-100 dark:hover:bg-[#202227] text-[#2F3437] dark:text-neutral-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 transition-colors ${
                        isActive
                          ? 'bg-white/15 text-amber-300 dark:bg-neutral-900/10 dark:text-amber-600'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-[#787774] dark:text-neutral-400 group-hover:text-[#2F3437] dark:group-hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs sm:text-sm truncate">
                          {sec.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md ${
                            isActive
                              ? 'bg-amber-400 text-neutral-900'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {sec.badge}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] line-clamp-1 mt-0.5 ${
                          isActive ? 'text-neutral-300 dark:text-neutral-600' : 'text-[#787774] dark:text-neutral-400'
                        }`}
                      >
                        {sec.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Link to Current App State */}
            <div className="mt-3 pt-3 border-t border-[#EAE9E6] dark:border-[#2A2C33] px-2 text-xs text-[#787774] dark:text-neutral-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>{tBanner.dbActive}</span>
              </span>
              <button
                onClick={() => onNavigateModule('dashboard')}
                className="text-xs font-bold text-[#2F3437] dark:text-white hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isAr ? 'لوحة التحكم' : 'Dashboard'}</span>
                <ArrowRight size={12} className={isAr ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 space-y-6">

          {/* SECTION 1: WEEKLY PLANNER */}
          {activeSection === 'planner' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'المنهجية الأساسية' : 'Core Methodology'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'المخطط الرئيسي لـ 7 أيام (Time-Blocking)' : 'Weekly 7-Day Master Planner'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'هندسة تقسيم الوقت للكاتب كال نيوبورت وقانون باركنسون لزيادة الإنتاجية والتركيز العميق.' 
                      : 'Cal Newport Time-Blocking architecture & Parkinson’s Law optimization to maximize deep focus.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('planner')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <CalendarDays size={14} />
                  <span>{isAr ? 'افتح المخطط الأسبوعي' : 'Open Weekly Planner'}</span>
                </button>
              </div>

              {/* Reason Why */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-bold text-[#2F3437] dark:text-white">
                  <Brain className="text-indigo-600" size={20} />
                  <h3>{isAr ? '1. لماذا تم تصميم المخطط بهذه الطريقة؟' : '1. Why Time-Blocking Outperforms Endless Task Lists'}</h3>
                </div>
                <div className="prose text-sm text-[#444] dark:text-neutral-300 leading-relaxed space-y-3">
                  <p>
                    {isAr
                      ? 'قوائم المهام العادية تسبب إرهاق القرار وقانون باركنسون (تمدد العمل ليملأ الوقت المتاح). تقسيم الوقت يحول السؤال من "ماذا علي أن أفعل؟" إلى "متى سأخصص طاقتي الذهنية القصوى لإنجاز هذه المهمة؟".'
                      : 'Traditional endless to-do lists suffer from Decision Fatigue and Parkinson\'s Law. Time-blocking assigns every hour a specific priority before your day begins.'}
                  </p>
                </div>
              </div>

              {/* Interactive Calculator */}
              <div className="p-5 bg-neutral-900 text-white rounded-2xl border border-neutral-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-amber-400" size={18} />
                    <h4 className="font-bold text-sm text-white">
                      {isAr ? 'محاكي تقسيم الوقت اليومي التفاعلي' : 'Interactive Daily Time-Block Simulator'}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 bg-white/10 px-2 py-0.5 rounded">
                    {isAr ? 'الهدف: 50%+ عمل عميق' : 'Target: 50%+ Deep Work'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-neutral-900 dark:text-neutral-100">
                  <div>
                    <label className="text-neutral-400 block mb-1">{isAr ? 'العمل العميق (ساعات)' : 'Deep Work (hrs)'}</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={deepWorkHours}
                      onChange={(e) => setDeepWorkHours(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">{isAr ? 'الاجتماعات (ساعات)' : 'Meetings (hrs)'}</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={meetingHours}
                      onChange={(e) => setMeetingHours(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">{isAr ? 'الإدارة والإيميل (ساعات)' : 'Admin & Email (hrs)'}</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={adminHours}
                      onChange={(e) => setAdminHours(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">{isAr ? 'شخصي وصحي (ساعات)' : 'Personal / Rest (hrs)'}</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={personalHours}
                      onChange={(e) => setPersonalHours(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-400">{isAr ? 'إجمالي الساعات:' : 'Total Planned:'} </span>
                    <span className="font-bold text-white font-mono">{totalCalculatedHours} {isAr ? 'ساعة' : 'hrs'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">{isAr ? 'نسبة التركيز العميق:' : 'Deep Work Ratio:'} </span>
                    <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                      deepWorkRatio >= 45 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {deepWorkRatio}% {deepWorkRatio >= 45 ? (isAr ? '✓ توزيع ممتاز' : '✓ Excellent') : (isAr ? '⚠ ارفع كتل التركيز' : '⚠ Increase Deep Work')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: STRATEGIC LIFE FOCUS PHASES */}
          {activeSection === 'life-phases' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'الأولويات الديناميكية' : 'Dynamic Prioritization'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'مراحل التركيز الاستراتيجي وتوزيع الأوزان' : 'Strategic Life Focus Phases & Category Weights'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'كيف تعيد معايرة ترتيب مهامك بناءً على مرحلة حياتك الحالية (مثل 70% عمل، 30% شخصي).' 
                      : 'How your current life phase dynamically weights and ranks urgent tasks on your dashboard.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('dashboard')}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <Sliders size={14} />
                  <span>{isAr ? 'إدارة المراحل في لوحة التحكم' : 'Manage Life Phases'}</span>
                </button>
              </div>

              <div className="space-y-4 text-sm text-[#444] dark:text-neutral-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                    {isAr ? 'كيف تعمل معادلة الترتيب الموزون؟' : 'How the Weighted Priority Algorithm Works'}
                  </h4>
                  <p className="text-xs text-indigo-900 dark:text-indigo-300">
                    {isAr 
                      ? 'عند تفعيل مرحلة (مثل "إطلاق الربع الرابع" بوزن 70% للعمل و30% للشخصي)، تقوم الخوارزمية بضرب أولوية المهمة وتوقيتها بوزن المرحلة. المهام التابعة للمجال المسيطر تصعد تلقائياً لصدارة لوحة التحكم!'
                      : 'When you activate a phase (e.g. "Q4 Sprint" at 70% Business, 30% Personal), the algorithm scales priority by the dominant category weight, elevating aligned tasks to the top of your dashboard.'}
                  </p>
                </div>

                <h4 className="font-bold text-base text-[#2F3437] dark:text-white pt-2">
                  {isAr ? 'خطوات إدارة المراحل وتعديلها أو حذفها:' : 'Step-by-Step Guide to Managing Life Phases:'}
                </h4>
                <ol className="list-decimal pr-5 pl-5 space-y-2 text-xs">
                  <li><strong>{isAr ? 'إنشاء مرحلة جديدة:' : 'Create a New Phase:'}</strong> {isAr ? 'انقر على "مراحل التركيز" في لوحة التحكم أو في صفحة الإعدادات، حدد الاسم والتواريخ وقم بضبط مؤشرات النسب المئوية.' : 'Click "Life Phases" on the dashboard or in Settings, name your phase, set date ranges, and slide category percentages to sum to 100%.'}</li>
                  <li><strong>{isAr ? 'تعديل مرحلة موجودة:' : 'Edit an Existing Phase:'}</strong> {isAr ? 'انقر على أيقونة القلم بجانب أي مرحلة لتعديل نسبها أو تواريخها أو ملاحظاتها.' : 'Click the Edit icon on any phase to modify weights, titles, or active timeline.'}</li>
                  <li><strong>{isAr ? 'التعطيل والعودة للوضع القياسي:' : 'Deactivate / Standard Balanced:'}</strong> {isAr ? 'يمكنك إلغاء تفعيل المرحلة النشطة ليعود النظام إلى الحساب القياسي المتساوي لجميع المجالات.' : 'You can deactivate any active phase to return to standard uniform task ranking.'}</li>
                  <li><strong>{isAr ? 'حذف أو استعادة المراحل:' : 'Delete or Reset Phases:'}</strong> {isAr ? 'يمكنك حذف أي مرحلة بنقرة واحدة، أو مسح الكل، أو استعادة المراحل الافتراضية في أي وقت.' : 'Delete unwanted phases, clear all, or restore system defaults with one click.'}</li>
                </ol>
              </div>
            </div>
          )}

          {/* SECTION 3: MILESTONE REWARDS */}
          {activeSection === 'rewards-vault' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'التحفيز الذاتي' : 'Behavioral Incentives'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'متجر المكافآت والجوائز التحفيزية' : 'Milestone Rewards & Gamification Vault'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'ربط السلاسل المتتالية والمهام بمكافآت ملموسة تعزز الدوبامين وتدعم الاستمرارية.' 
                      : 'Tying streaks and task completion milestones to real-world rewards to sustain long-term momentum.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('dashboard')}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <Trophy size={14} />
                  <span>{isAr ? 'افتح متجر المكافآت' : 'Open Milestone Vault'}</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <p>
                  {isAr 
                    ? 'أثبتت أبحاث علم الأعصاب أن ربط الانضباط بمكافآت محددة مسبقاً يرفع الالتزام بنسبة تزيد عن 300%. متجر المكافآت يسمح لك بتحديد جوائزك بنفسك ومتابعة تقدمك نحوها تلقائياً.'
                    : 'Behavioral psychology confirms that pre-committed tangible milestones increase habit adherence by over 300%. The Milestone Vault automatically tracks your progress.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-white block">🔥 {isAr ? 'شروط السلاسل (Streak)' : 'Streak Milestones'}</span>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'تفتح الجائزة عند الوصول إلى 7 أيام، 30 يوماً، أو أي رقم تحدده.' : 'Unlocks upon reaching 7, 14, 30+ consecutive habit streak days.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-white block">✓ {isAr ? 'شروط التكرار (Total Checkoffs)' : 'Total Checkoffs'}</span>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'تفتح الجائزة بناءً على المجموع التراكمي لإنجاز العادات.' : 'Unlocks based on cumulative lifetime habit repetitions.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-white block">🎯 {isAr ? 'شروط المهام (Task Count)' : 'Completed Tasks'}</span>
                    <p className="text-[11px] text-neutral-500">
                      {isAr ? 'تفتح الجائزة بعد إتمام عدد محدد من المهام المكتملة.' : 'Unlocks after completing 25, 50, or 100 productive tasks.'}
                    </p>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-neutral-900 dark:text-white pt-2">
                  {isAr ? 'التعديل، الحذف وإعادة الضبط:' : 'Customization & Controls:'}
                </h4>
                <p>
                  {isAr 
                    ? 'يمكنك إضافة مكافآتك الخاصة مع أيقونات تعبيرية (مثل ☕ أو 🏖️ أو 🎮)، تعديل المتطلبات، أو حذف أي مكافأة في أي وقت سواء من المتجر أو من صفحة الإعدادات.'
                    : 'You can create custom treats with emojis (☕, 🎮, 🏖️), adjust targets, or delete/reset default rewards from the Vault or Settings at any time.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 4: ATOMIC HABITS & ROUTINES & FREEZES */}
          {activeSection === 'habits-matrix' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'بناء الاتساق' : 'Consistency Architecture'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'العادات الذرية، روتينات الأوقات وتجميد السلاسل' : 'Atomic Habits, Time-of-Day Routines & Freezes'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'روتينات الصباح والظهيرة والمساء، زر إنجاز الروتين بنقرة واحدة، وتجميد السلاسل بأعذار مقبولة.' 
                      : 'Morning/Evening routines, 1-tap routine checkoffs, and justified streak freezes.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('habits')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <Flame size={14} className="text-amber-400" />
                  <span>{isAr ? 'افتح متابع العادات' : 'Open Habit Tracker'}</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-2">
                    <h4 className="font-bold text-xs uppercase text-neutral-900 dark:text-white">
                      🌅 {isAr ? 'روتينات الأوقات وإنجاز الروتين' : 'Time-of-Day Routines'}
                    </h4>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                      {isAr 
                        ? 'فرز العادات حسب الصباح، بعد الظهر، المساء، أو طوال اليوم. يتيح لك زر "إنجاز كامل الروتين" التحقق من جميع عادات الفترة بنقرة واحدة وتشغيل مؤثر صوتي واحتفالي.'
                        : 'Group habits by Morning, Afternoon, Evening, or Anytime. The 1-Tap "Complete Routine" button marks all routine items done simultaneously.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
                    <h4 className="font-bold text-xs uppercase text-blue-950 dark:text-blue-200">
                      ❄️ {isAr ? 'حماية وتجميد السلاسل (Streak Freeze)' : 'Streak Freeze Protection'}
                    </h4>
                    <p className="text-[11px] text-blue-900 dark:text-blue-300">
                      {isAr 
                        ? 'الحياة مليئة بالظروف الطارئة. بدلاً من انكسار السلسلة ظلماً، يمكنك تطبيق تجميد العادة مع توثيق السبب (مرض، سفر، طارئ، أو يوم راحة مجدول) وحفظ رصيد التجميد المكتسب.'
                        : 'Life happens. Protect your streak with justified freeze reasons (Sick, Travel, Emergency, Rest Day) to prevent unfair resets.'}
                    </p>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-neutral-900 dark:text-white pt-2">
                  {isAr ? 'الأيقونات المخصصة للعادات:' : 'Custom Emoji Icons:'}
                </h4>
                <p>
                  {isAr 
                    ? 'يمكنك تعيين رمز تعبيري مميز لكل عادة (مثل 💧 لشرب الماء، 📚 للقراءة، 🏋️ للرياضة) لسهولة التعرف البصري الفوري.'
                    : 'Assign clear emoji icons (💧, 📚, 🏋️, 🧘) to habits for fast visual recognition in all views.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 5: TASK EXECUTION & ROLLOVERS */}
          {activeSection === 'task-eisenhower' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'التنفيذ الفعّال' : 'Execution & Triage'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'تنفيذ المهام، مصفوفة أيزنهاور وإدارة التأجيل' : 'Task Execution, Urgency & Rollover Management'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'تصنيف المهام حسب الوقت والمصفوفة الرباعية، وتوثيق أسباب تأجيل المهام لمنع التسويف.' 
                      : 'Due time sorting, Eisenhower matrix, and logging skip reasons to eliminate procrastination debt.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('tasks')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <CheckSquare size={14} />
                  <span>{isAr ? 'افتح متابع المهام' : 'Open Task Tracker'}</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-2">
                  <h4 className="font-bold text-xs uppercase text-neutral-900 dark:text-white">
                    ⏱️ {isAr ? 'ميزة وقت الاستحقاق الدقيق (Due Time):' : 'Precise Due Time Scheduling:'}
                  </h4>
                  <p>
                    {isAr 
                      ? 'يمكنك تحديد وقت محدد للمهمة (مثل 09:00 صباحاً). المهام المستحقة في وقت قريب تتصدر قائمة الاستعجال فوراً.'
                      : 'Set specific due times (e.g. 09:00 AM) so time-critical tasks rise to the top of your urgent agenda.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                  <h4 className="font-bold text-xs uppercase text-amber-950 dark:text-amber-200">
                    🔄 {isAr ? 'إدارة الترحيل والتأجيل المبرر (Task Postpone & Skips):' : 'Task Skip & Rollover Tracking:'}
                  </h4>
                  <p>
                    {isAr 
                      ? 'عند تأجيل مهمة، يطلب منك النظام تسجيل السبب (مثل انتظار رد، ضيق وقت، ظرف طارئ) وحساب عدد مرات الترحيل. هذا يكشف المهام العالقة التي تحتاج لتفويض أو إلغاء.'
                      : 'When rescheduling, log the reason to track rollover debt and identify bottleneck tasks that should be delegated or deleted.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: CUSTOMIZATION, AUDIO & CONTROLS */}
          {activeSection === 'customization-audio' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'التحكم والتخصيص' : 'System Customization'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'تخصيص وحذف الميزات والمؤثرات الصوتية' : 'Customizing Features, Audio & Layout'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'دليل كامل لكيفية تفعيل، تعديل، أو حذف كل ميزة في التطبيق وضبط المؤثرات الصوتية.' 
                      : 'Complete guide on modifying, toggling, or removing added features and fine-tuning audio.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('settings')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <Sliders size={14} />
                  <span>{isAr ? 'افتح مركز الإعدادات' : 'Open Control Center'}</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <p>
                  {isAr 
                    ? 'صُمم هذا النظام ليكون مرناً ومخصصاً بالكامل لأسلوبك. إليك كيف يمكنك التحكم في كل جزء:' 
                    : 'The system is built for full customization. Here is how you can tailor every element to your workflow:'}
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-white block">1. {isAr ? 'تخصيص بطاقات لوحة التحكم:' : 'Dashboard Widget Toggles:'}</span>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {isAr 
                        ? 'انقر على أيقونة التخصيص (المزلاجات) في أعلى لوحة التحكم لتفعيل أو إخفاء أي بطاقة (المراحل، الروتينات، المهام العاجلة، الجوائز، أو السلاسل).' 
                        : 'Click the Sliders icon at top of the dashboard to enable or hide any card (Life Phase, Routines, Urgent Tasks, Rewards, or Streaks).'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-white block">2. {isAr ? 'المؤثرات الصوتية (Web Audio Synthesizer):' : 'Web Audio Synthesizer Controls:'}</span>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {isAr 
                        ? 'في تبويب "تخصيص وحذف الميزات" في الإعدادات، يمكنك كتم الأصوات بالكامل، ضبط مستوى الصوت (0-100%)، واختبار نغمات الإنجاز وفك الجوائز.' 
                        : 'In Settings -> "Feature Controls", toggle sound effects on/off, adjust volume slider (0-100%), and test custom synthesized chimes.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-1">
                    <span className="font-bold text-neutral-900 dark:text-white block">3. {isAr ? 'تفريغ النماذج التجريبية والبدء من الصفر:' : 'Purging Demo Presets:'}</span>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {isAr 
                        ? 'زر "مسح النماذج التجريبية" في تبويب التخصيص يتيح لك إزالة كافة العناصر التوضيحية الافتراضية بنقرة واحدة والبدء بصفحة نظيفة مخصصة لك.' 
                        : 'The "Purge Sample Presets" button in Settings removes all default demo records with a single click so you can build your workspace from a clean slate.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: CHECKLISTS & SOPS */}
          {activeSection === 'checklists-sop' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'منع الأخطاء' : 'Operational Quality'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'محرك قوائم التدقيق وإجراءات التشغيل القياسية (SOPs)' : 'Checklists Engine & Executive SOPs'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'مستوحى من كتاب بيان قوائم التدقيق لجراح هارفارد أتول غاواندي للقضاء على الأخطاء الروتينية.' 
                      : 'Inspired by Atul Gawande\'s Checklist Manifesto for zero-error execution in complex recurring routines.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('checklists')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <ListChecks size={14} />
                  <span>{isAr ? 'افتح قوائم التدقيق' : 'Open Checklists'}</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <p>
                  {isAr 
                    ? 'تستخدم قوائم التدقيق للعمليات المتكررة مثل إطلاق المشاريع، التجهيز للسفر، إجراءات نهاية الشهر، وبروتوكولات التدريب.' 
                    : 'Use checklists for complex recurring processes: project deployment, travel packing, monthly finances, and client onboarding.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 8: PROJECTS & OKRS */}
          {activeSection === 'projects-okr' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'إدارة المبادرات' : 'Initiative Architecture'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'المشاريع وهندسة الأهداف والنتائج الرئيسية (OKR)' : 'Projects & OKR Goal Milestones'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'ربط المخرجات اليومية بالمشاريع الإستراتيجية وقياس التقدم بالنسبة المئوية.' 
                      : 'Linking daily tactical outputs directly to strategic projects and percentage completion milestones.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('projects')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <FolderKanban size={14} />
                  <span>{isAr ? 'افتح المشاريع' : 'Open Projects'}</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <p>
                  {isAr 
                    ? 'كل مشروع يحتوي على مهام فرعية، مواعيد نهائية، وربط تلقائي بالمهام والقوائم لمتابعة نسبة الإنجاز بصرياً.' 
                    : 'Every project breaks down into actionable subtasks with progress tracking and direct linkages to tasks and checklists.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 9: BRAIN DUMP & SECOND BRAIN */}
          {activeSection === 'notes-brain-dump' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'التفريغ المعرفي' : 'Cognitive Capture'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'العقل الثاني وتفريغ الأفكار (Second Brain)' : 'Second Brain & Zero-Friction Capture'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'التقاط الخواطر والأفكار فور ورودها وتحويلها بنقرة واحدة إلى مهام أو قوائم تدقيق.' 
                      : 'Capture spontaneous ideas instantly, categorize into read-later or convert to tasks in one tap.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('notes')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <StickyNote size={14} />
                  <span>{isAr ? 'افتح الملاحظات' : 'Open Notes'}</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <p>
                  {isAr 
                    ? 'عقلك صُمم لتوليد الأفكار وليس لتخزينها (ديفيد ألين - GTD). التفريغ السريع يحفظ طاقتك الذهنية للتركيز والتنفيذ.' 
                    : 'Your brain is for having ideas, not holding them (David Allen, GTD). Offload spontaneous thoughts immediately to protect cognitive bandwidth.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 10: GOALS & TARGETS */}
          {activeSection === 'goals-vision' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'الرؤية بعيدة المدى' : 'Long-Horizon Targets'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'الأهداف وهندسة الغايات النهائية' : 'Goals & Endpoint Target Architecture'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'تحديد أهداف ربع سنوية وسنوية بمقاييس رقمية واضحة ومحطات إنجاز قابلة للتحقق.' 
                      : 'Quarterly and multi-year goals defined with measurable numeric metrics and step-by-step milestones.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('goals')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <Target size={14} />
                  <span>{isAr ? 'افتح الأهداف' : 'Open Goals'}</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <p>
                  {isAr 
                    ? 'الأهداف غير الواضحة نادراً ما تتحقق. هذا المحرك يطلب منك تحديد الغاية النهائية بدقة والمقياس الرقمي (مثل $50,000 أو 10 كتب) وربطها بالعادات والمشاريع.' 
                    : 'Vague goals fail. Define exact endpoint states, numeric metric units, and connect them with habits and projects.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 11: ANALYTICS & TELEMETRY */}
          {activeSection === 'analytics-telemetry' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'القياس التنفيذي' : 'Executive Radar'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'التحليلات ورادار الأداء التنفيذي' : 'Analytics & Executive Performance Radar'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'مؤشر الأبعاد الستة، معدلات التركيز اليومية والأسبوعية، وخطوط اتجاه الالتزام بالعادات.' 
                      : '6-Dimension performance index, daily focus telemetry, and habit consistency trendlines.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('analytics')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <BarChart3 size={14} />
                  <span>{isAr ? 'افتح التحليلات' : 'Open Analytics'}</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <p>
                  {isAr 
                    ? 'ما لا يمكن قياسه لا يمكن إدارته (بيتر دراكر). تقدم التحليلات لوحة تحكم كمية تكشف نقاط القوة وفرص التحسين في روتينك.' 
                    : 'What gets measured gets managed (Peter Drucker). Telemetry charts provide objective feedback on your real execution patterns.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 12: ALGORITHMS & CLOUD FIRESTORE */}
          {activeSection === 'algorithms-tech' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'المواصفات التقنية' : 'System Architecture'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'كواليس التطبيق: الخوارزميات والمزامنة السحابية' : 'Under the Hood: Algorithms & Cloud Sync'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'الصيغ الرياضية لحساب السلاسل، ترتيب الأولويات الموزون، ومحرك Firestore السحابي.' 
                      : 'Streak math, phase-weighted scoring formulas, and Cloud Firestore real-time synchronization.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-[#444] dark:text-neutral-300 leading-relaxed">
                <p>
                  {isAr 
                    ? 'يتم تخزين بياناتك ومزامنتها لحظياً في قاعدة بيانات Google Cloud Firestore مع دعم العمل بدون إنترنت (Offline Cache) وتوليد نسخ احتياطية كاملة بصيغة JSON بنقرة واحدة.' 
                    : 'Your workspace is synchronized in real-time using Google Cloud Firestore with offline fallback support and 1-click full JSON backups.'}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 13: MASTER OPERATING BLUEPRINTS */}
          {activeSection === 'daily-weekly-routines' && (
            <div className="bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {isAr ? 'بروتوكولات التشغيل' : 'Standard Protocols'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#2F3437] dark:text-white mt-2">
                    {isAr ? 'مخططات التشغيل الرئيسية وإجراءات العمل خطوة بخطوة' : 'Master Operating Blueprints & SOPs'}
                  </h2>
                  <p className="text-sm text-[#787774] dark:text-neutral-400 mt-1">
                    {isAr 
                      ? 'بروتوكول بدء الصباح (5 دقائق)، بروتوكول إغلاق المساء، وطقس إعادة ضبط الأحد (15 دقيقة).' 
                      : '5-minute morning startup ritual, evening shutdown protocol, and 15-minute Sunday executive reset.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateModule('sunday-reset')}
                  className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xs self-start sm:self-auto transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>{isAr ? 'افتح معالج إعادة ضبط الأحد' : 'Open Sunday Reset'}</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Routine 1: Morning Startup */}
                <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#2F3437] dark:text-white flex items-center gap-2">
                      <Clock size={15} className="text-indigo-600" />
                      <span>{isAr ? 'بروتوكول بدء الصباح (٥ دقائق)' : 'Morning Startup Protocol (5 Minutes)'}</span>
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `Morning Startup Protocol:\n1. Open Weekly Planner & review Today's Agenda.\n2. Review Brain Dump Inbox and triage 3 items.\n3. Confirm #1 High Priority Task.\n4. Complete Morning Routine habits in 1 tap.\n5. Enter 90-minute Deep Work focus block.`,
                          'morning'
                        )
                      }
                      className="px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] font-bold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedRoutine === 'morning' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedRoutine === 'morning' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الخطوات' : 'Copy Routine')}</span>
                    </button>
                  </div>
                  <ol className="list-decimal pr-5 pl-5 space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                    <li><strong>08:30:</strong> {isAr ? 'افتح المخطط الأسبوعي وتفقد كتل الوقت المخصصة لليوم.' : 'Open Weekly Planner and inspect today\'s pre-scheduled focus blocks.'}</li>
                    <li><strong>08:32:</strong> {isAr ? 'تأكد من المهمة رقم 1 الأكثر أهمية في متابع المهام.' : 'Confirm your #1 non-negotiable priority in Task Tracker.'}</li>
                    <li><strong>08:34:</strong> {isAr ? 'انقر على "إنجاز كامل الروتين" لروتين الصباح.' : '1-Tap "Complete Routine" for your morning habits.'}</li>
                    <li><strong>08:35:</strong> {isAr ? 'ابدأ أول جلسة تركيز عميق مع إيقاف الإشعارات.' : 'Launch your first 90-minute deep work focus session.'}</li>
                  </ol>
                </div>

                {/* Routine 2: Sunday Reset */}
                <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#2F3437] dark:text-white flex items-center gap-2">
                      <CalendarDays size={15} className="text-amber-600" />
                      <span>{isAr ? 'طقس إعادة ضبط الأحد الأسبوعي (١٥ دقيقة)' : 'Sunday Executive Reset Ritual (15 Minutes)'}</span>
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `Sunday Weekly Architecture Ritual:\n1. Open Sunday Reset wizard.\n2. Review past week's habit consistency and streak protections.\n3. Clear unread Brain Dumps.\n4. Clean taskboard & archive completed work.\n5. Schedule Deep Work focus blocks for next week.\n6. Set core Weekly Focus and Metric Goal.`,
                          'sunday'
                        )
                      }
                      className="px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] font-bold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedRoutine === 'sunday' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedRoutine === 'sunday' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الخطوات' : 'Copy Routine')}</span>
                    </button>
                  </div>
                  <ol className="list-decimal pr-5 pl-5 space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                    <li>{isAr ? 'افتح معالج إعادة ضبط الأحد من القائمة الجانبية.' : 'Launch the interactive Sunday Reset wizard from the sidebar.'}</li>
                    <li>{isAr ? 'راجع أداء العادات وسلاسل الالتزام للأسبوع المنصرم.' : 'Review habit completion and streak freezes over the past 7 days.'}</li>
                    <li>{isAr ? 'قم بفرز الملاحظات السريعة وتحويل الأفكار المهمة لمهام.' : 'Triage your Second Brain and convert urgent notes into actionable tasks.'}</li>
                    <li>{isAr ? 'أرشف المهام المكتملة لتفريغ اللوحة والبدء بصفحة نظيفة.' : 'Archive completed tasks to clear the board.'}</li>
                    <li>{isAr ? 'وزّع كتل العمل العميق على أيام الأسبوع القادم في المخطط.' : 'Architect your deep-work schedule for the upcoming week.'}</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
