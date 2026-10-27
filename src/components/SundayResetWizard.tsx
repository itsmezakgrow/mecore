import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  Archive, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  Brain, 
  Flame, 
  Trophy, 
  CheckSquare, 
  ShieldAlert, 
  Check, 
  Trash2,
  ListPlus,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HabitItem, TaskItem, WeeklyPlanSlot, NoteItem, SundayReset } from '../types';

interface SundayResetWizardProps {
  habits: HabitItem[];
  tasks: TaskItem[];
  plans: WeeklyPlanSlot[];
  notes: NoteItem[];
  onUpdateHabit: (id: string, updates: Partial<HabitItem>) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  onAddPlan: (slot: Omit<WeeklyPlanSlot, 'id'>) => Promise<any>;
  onUpdateNote: (id: string, updates: Partial<NoteItem>) => Promise<void>;
  onAddTask: (task: Omit<TaskItem, 'id'>) => Promise<any>;
  onAddSundayReset: (reset: Omit<SundayReset, 'id'>) => Promise<any>;
  onNavigateModule: (mod: any) => void;
  lang: 'en' | 'ar';
}

const wizardTranslations = {
  en: {
    title: "Sunday Reset Protocol",
    subtitle: "A highly-focused ritual to clear your mind, archive completed work, and structure your upcoming week.",
    step1Title: "1. Habit Review",
    step1Desc: "Calculate consistency from the past 7 days and see protected streaks.",
    step2Title: "2. Clear Second Brain",
    step2Desc: "Process recent brain dumps. Categorize or archive to declutter.",
    step3Title: "3. Clean Taskboard",
    step3Desc: "Archive completed tasks to clear your active focus list.",
    step4Title: "4. Schedule Deep Work",
    step4Desc: "Plan key focus blocks. Respect Newport's 4-hour daily limit.",
    step5Title: "5. Intention Core",
    step5Desc: "Set your weekly theme and principal metric target.",
    nextStep: "Next Step",
    prevStep: "Previous Step",
    completeReset: "Lock in Intentions & Complete Reset",
    reviewStats: "Reviewing Past Week Stats",
    habitConsistency: "Habit Consistency Score",
    freezeBadge: "Streak Freeze Protection",
    freezeActive: "A streak freeze saved your progress on this day!",
    noUnreadNotes: "Zero inbox achieved! Your Second Brain inbox is completely clear.",
    unreadNotesFound: "Unresolved brain dumps remaining in your inbox:",
    archiveNote: "Archive note",
    convertToTask: "Convert to task",
    noCompletedTasks: "No completed tasks on the board. Ready to move forward!",
    completedTasksFound: "Completed tasks ready to be archived:",
    archiveAllCompleted: "Archive All Completed Tasks",
    deepWorkWarningTitle: "Cal Newport Cognitive Limit Warning",
    deepWorkWarningDesc: "Scheduling more than 4.0 hours of Deep Work per day exceeds sustainable human concentration limit. Consider optimizing for intensity, not pure volume.",
    weeklyFocusPlaceholder: "e.g., Deep Focused Execution, Writing & Strategy, Physical Recovery...",
    weeklyGoalPlaceholder: "e.g., Deliver V1 draft, run 15km, complete 4 deep-work blocks...",
    weeklyFocusLabel: "Weekly Focus / Core Theme",
    weeklyGoalLabel: "Weekly Goal / Principal Metric Target",
    congratsTitle: "Sunday Reset Accomplished!",
    congratsDesc: "You have cleared your queues, organized your calendar, and established your weekly intentions. Your telemetry is updated, and you are fully prepared for the week ahead.",
    backToDashboard: "Go to Dashboard",
    opportunitiesCount: "opportunities tracked across past 7 days",
    checkins: "Check-ins",
    freezesUsed: "Freezes applied",
    dayIndexLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    dayIndexFullLabels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    addDeepWorkBlock: "Add Deep Work block",
    selectDay: "Day of the week",
    blockTitle: "Deep Work Title",
    startTime: "Start Time",
    endTime: "End Time",
    hoursScheduled: "hours scheduled",
    addBlockBtn: "Schedule Block"
  },
  ar: {
    title: "بروتوكول إعادة ضبط الأحد",
    subtitle: "طقس أسبوعي لتصفية ذهنك، أرشفة أعمالك المكتملة، وتخطيط أسبوعك القادم بكفاءة.",
    step1Title: "١. مراجعة العادات",
    step1Desc: "احسب التزامك من الـ ٧ أيام الماضية وشاهد العادات المحمية.",
    step2Title: "٢. تصفية العقل الثاني",
    step2Desc: "معالجة مذكراتك السريعة. صنفها أو أرشِفها لإزالة الفوضى الرقمية.",
    step3Title: "٣. تنظيف لوحة المهام",
    step3Desc: "أرشفة المهام المكتملة لتهيئة لوحة التحكم صباح يوم الإثنين.",
    step4Title: "٤. جدولة العمل العميق",
    step4Desc: "خطط لفترات العمل العميق. انتبه لحد الـ ٤ ساعات لكال نيوبورت.",
    step5Title: "٥. تحديد النوايا والأهداف",
    step5Desc: "حدد شعاراً مركزياً وهدفاً واحداً للأسبوع القادم.",
    nextStep: "الخطوة التالية",
    prevStep: "الخطوة السابقة",
    completeReset: "تأكيد النوايا وإتمام الضبط",
    reviewStats: "مراجعة إحصائيات الأسبوع الماضي",
    habitConsistency: "معدل الالتزام بالعادات",
    freezeBadge: "حماية تجميد السلسلة",
    freezeActive: "لقد أنقذ تجميد السلسلة تقدمك في هذا اليوم من الانهيار!",
    noUnreadNotes: "رائع! مستودع أفكارك خالٍ تماماً وجاهز لاستقبال الإلهام.",
    unreadNotesFound: "أفكار معلقة في مستودعك تحتاج لمعالجة:",
    archiveNote: "أرشفة المذكرة",
    convertToTask: "تحويل لمهمة",
    noCompletedTasks: "لا توجد مهام مكتملة على اللوحة. جاهز للمضي قدماً!",
    completedTasksFound: "مهام مكتملة جاهزة للأرشفة لتطهير اللوحة:",
    archiveAllCompleted: "أرشفة جميع المهام المكتملة",
    deepWorkWarningTitle: "تحذير حد التركيز لكال نيوبورت",
    deepWorkWarningDesc: "جدولة أكثر من ٤.٠ ساعات من العمل العميق يومياً تتجاوز حدود الطاقة البشرية المستدامة. ركّز على جودة وكثافة التركيز وليس كثرة الساعات.",
    weeklyFocusPlaceholder: "مثال: التنفيذ الحاسم، الكتابة والتخطيط، الاستشفاء البدني...",
    weeklyGoalPlaceholder: "مثال: تسليم مسودة المشروع الأولى، الجري لمسافة ١٥ كم، إنجاز ٤ جلسات عمل عميق...",
    weeklyFocusLabel: "شعار / تركيز الأسبوع الرئيسي",
    weeklyGoalLabel: "هدف الأسبوع / المؤشر المستهدف",
    congratsTitle: "اكتمل بروتوكول إعادة ضبط الأحد بنجاح!",
    congratsDesc: "لقد قمت بتصفية لوحة العمل، تنظيم تقويمك، ورسم مسارات تركيزك للأيام القادمة. تم تحديث القياسات وأنت جاهز تماماً للأسبوع الجديد.",
    backToDashboard: "الذهاب للوحة التحكم",
    opportunitiesCount: "فرصة تتبع تم تسجيلها خلال الـ ٧ أيام الماضية",
    checkins: "تسجيلات الحضور",
    freezesUsed: "مرات التجميد المستخدمة",
    dayIndexLabels: ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
    dayIndexFullLabels: ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
    addDeepWorkBlock: "إضافة فترة عمل عميق",
    selectDay: "يوم الأسبوع",
    blockTitle: "عنوان فترة العمل",
    startTime: "وقت البدء",
    endTime: "وقت الانتهاء",
    hoursScheduled: "ساعات مجدولة",
    addBlockBtn: "جدولة الفترة"
  }
};

export const SundayResetWizard: React.FC<SundayResetWizardProps> = ({
  habits,
  tasks,
  plans,
  notes,
  onUpdateHabit,
  onUpdateTask,
  onAddPlan,
  onUpdateNote,
  onAddTask,
  onAddSundayReset,
  onNavigateModule,
  lang,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [weeklyFocus, setWeeklyFocus] = useState<string>('');
  const [weeklyGoal, setWeeklyGoal] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [archivedTasksCount, setArchivedTasksCount] = useState<number>(0);
  const [triagedNotesCount, setTriagedNotesCount] = useState<number>(0);

  // Deep work form states
  const [newBlockDay, setNewBlockDay] = useState<number>(0);
  const [newBlockTitle, setNewBlockTitle] = useState<string>('');
  const [newBlockStart, setNewBlockStart] = useState<string>('09:00');
  const [newBlockEnd, setNewBlockEnd] = useState<string>('11:00');

  const t = wizardTranslations[lang];
  const isRtl = lang === 'ar';

  // --- Step 1 Math: Habit consistency score ---
  const todayStr = new Date().toISOString().split('T')[0];
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  let checkinsCount = 0;
  let freezesCount = 0;
  let activeHabits = habits.filter(h => !h.archived);
  let totalOpportunities = activeHabits.length * 7;

  activeHabits.forEach(h => {
    past7Days.forEach(day => {
      if (h.history && h.history[day]) checkinsCount++;
      if (h.freezes && h.freezes[day]) freezesCount++;
    });
  });

  const habitScore = totalOpportunities > 0 
    ? Math.round(((checkinsCount + freezesCount) / totalOpportunities) * 100) 
    : 100;

  // --- Step 2 Data: Filter unread notes ---
  const activeNotes = notes.filter(n => !n.archived);

  const handleTriageNote = async (id: string, action: 'archive' | 'task') => {
    const targetNote = notes.find(n => n.id === id);
    if (!targetNote) return;

    if (action === 'task') {
      await onAddTask({
        title: targetNote.content || 'Action item from Sunday Reset',
        completed: false,
        createdAt: Date.now(),
        priority: 'high',
        category: 'personal'
      });
    }

    await onUpdateNote(id, { archived: true });
    setTriagedNotesCount(prev => prev + 1);
  };

  // --- Step 3 Data: Filter completed, non-archived tasks ---
  const completedTasks = tasks.filter(t => t.completed && !t.archived);

  const handleArchiveCompletedTasks = async () => {
    const count = completedTasks.length;
    for (const task of completedTasks) {
      if (task.id) {
        await onUpdateTask(task.id, { archived: true });
      }
    }
    setArchivedTasksCount(prev => prev + count);
  };

  // --- Step 4 Math: Weekly plan slots for deep work duration ---
  const getDurationInHours = (slot: WeeklyPlanSlot) => {
    if (!slot.startTime || !slot.endTime) return 1.0;
    try {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const diffMins = (eh * 60 + em) - (sh * 60 + sm);
      return Math.max(0.5, diffMins / 60);
    } catch {
      return 1.0;
    }
  };

  // Calculate deep work hours per day (Mon=0 to Sun=6)
  const getDeepWorkHoursForDay = (dayIndex: number) => {
    const dayPlans = plans.filter(p => p.dayIndex === dayIndex && p.type === 'deep-work');
    return dayPlans.reduce((sum, slot) => sum + getDurationInHours(slot), 0);
  };

  const handleAddDeepWorkBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle.trim()) return;

    await onAddPlan({
      dayIndex: newBlockDay,
      title: newBlockTitle,
      startTime: newBlockStart,
      endTime: newBlockEnd,
      completed: false,
      type: 'deep-work',
      createdAt: Date.now()
    });

    setNewBlockTitle('');
  };

  // --- Step 5 Submission: Save Reset and celebrate ---
  const handleCompleteReset = async () => {
    if (!weeklyFocus.trim()) return;

    const weekId = `2026-W${Math.ceil(new Date().getDate() / 7)}`; // Standard safe week generation
    await onAddSundayReset({
      weekId,
      completedAt: Date.now(),
      habitScore,
      triageNotesCount: triagedNotesCount,
      archivedTasksCount,
      weeklyFocus,
      weeklyGoal: weeklyGoal || undefined
    });

    setIsCompleted(true);
  };

  // Render Header Progress Dots
  const renderProgress = () => {
    return (
      <div className="flex items-center justify-between gap-2 max-w-xl mx-auto mb-8 border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-4">
        {[1, 2, 3, 4, 5].map((step) => (
          <button
            key={step}
            onClick={() => step < currentStep && setCurrentStep(step)}
            className={`flex items-center gap-1.5 transition-all text-[11px] font-bold uppercase tracking-wider cursor-pointer ${
              currentStep === step
                ? 'text-[#34D399] border-b-2 border-[#34D399] pb-2 px-1'
                : step < currentStep
                ? 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                : 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
            }`}
            disabled={step > currentStep}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono ${
              currentStep === step 
                ? 'bg-[#34D399] text-white' 
                : step < currentStep 
                ? 'bg-neutral-200 text-neutral-600 dark:bg-[#2A2C33] dark:text-neutral-300' 
                : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-900'
            }`}>
              {step}
            </span>
            <span className="hidden sm:inline">
              {step === 1 ? 'Habits' : step === 2 ? 'Notes' : step === 3 ? 'Tasks' : step === 4 ? 'Planner' : 'Theme'}
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4 space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm"
        >
          <Trophy size={40} />
        </motion.div>

        <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          {t.congratsTitle}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-lg mx-auto">
          {t.congratsDesc}
        </p>

        {/* Highlight Summary Stats */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-4 pb-6">
          <div className="p-3 bg-neutral-50 dark:bg-[#1A1C20] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-center">
            <div className="text-xl font-black text-neutral-800 dark:text-neutral-100 font-mono">
              {habitScore}%
            </div>
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
              Consistency
            </div>
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-[#1A1C20] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-center">
            <div className="text-xl font-black text-neutral-800 dark:text-neutral-100 font-mono">
              {triagedNotesCount}
            </div>
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
              Notes Triage
            </div>
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-[#1A1C20] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-center">
            <div className="text-xl font-black text-neutral-800 dark:text-neutral-100 font-mono">
              {archivedTasksCount}
            </div>
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
              Tasks Archived
            </div>
          </div>
        </div>

        {/* Core intentions visualization */}
        <div className="p-4 bg-emerald-50/50 dark:bg-[#1E2025]/50 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-start max-w-md mx-auto space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
              {t.weeklyFocusLabel}
            </span>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
              {weeklyFocus}
            </p>
          </div>
          {weeklyGoal && (
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                {t.weeklyGoalLabel}
              </span>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5">
                {weeklyGoal}
              </p>
            </div>
          )}
        </div>

        <div className="pt-4">
          <button
            onClick={() => onNavigateModule('dashboard')}
            className="px-6 py-2.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 active:scale-98 transition-all cursor-pointer"
          >
            {t.backToDashboard}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 px-1" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Introduction Title */}
      <div className="text-center mb-6 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          {t.title}
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Progress indicators */}
      {renderProgress()}

      {/* Wizard Step Body */}
      <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl p-4 sm:p-6 shadow-3xs mb-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: Habit Review */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              className="space-y-5"
            >
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Flame size={18} className="text-orange-500" />
                  {t.step1Title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t.step1Desc}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Score Widget */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-center">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {t.habitConsistency}
                  </span>
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="stroke-neutral-200 dark:stroke-[#2A2C33]"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="stroke-[#34D399]"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={2 * Math.PI * 42 * (1 - habitScore / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-mono text-2xl font-black text-neutral-800 dark:text-neutral-100">
                      {habitScore}%
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-3 font-semibold leading-tight">
                    {totalOpportunities} {t.opportunitiesCount}
                  </p>
                </div>

                {/* Habits list & streak protection audit */}
                <div className="md:col-span-7 space-y-3 max-h-72 overflow-y-auto pr-1">
                  {activeHabits.map(habit => {
                    // Check if freeze was applied in past 7 days
                    const freezesInPastWeek = past7Days.filter(day => habit.freezes && habit.freezes[day]);
                    return (
                      <div key={habit.id} className="p-3 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color === 'emerald' ? '#34D399' : habit.color === 'amber' ? '#F59E0B' : habit.color === 'indigo' ? '#6366F1' : habit.color === 'rose' ? '#EF4444' : '#10B981' }} />
                            {habit.title}
                          </div>
                          {freezesInPastWeek.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded mt-1.5">
                              <ShieldAlert size={10} />
                              {t.freezeBadge} ({freezesInPastWeek.length})
                            </span>
                          ) : (
                            <span className="text-[9px] text-neutral-400 mt-1 block">
                              Streak: {habit.streak} days
                            </span>
                          )}
                        </div>

                        {/* Sparkline for last 7 days */}
                        <div className="flex gap-0.5">
                          {past7Days.map(day => {
                            const isChecked = habit.history && habit.history[day];
                            const isFrozen = habit.freezes && habit.freezes[day];
                            return (
                              <div
                                key={day}
                                className={`w-3.5 h-3.5 rounded-sm ${
                                  isChecked 
                                    ? 'bg-[#34D399]' 
                                    : isFrozen 
                                    ? 'bg-indigo-400 border border-indigo-500' 
                                    : 'bg-neutral-100 dark:bg-neutral-800'
                                }`}
                                title={`${day}: ${isChecked ? 'Check-in' : isFrozen ? 'Streak Freeze (Saved!)' : 'No activity'}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Clear Second Brain */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Brain size={18} className="text-indigo-500" />
                  {t.step2Title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t.step2Desc}
                </p>
              </div>

              {activeNotes.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-dashed border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                  <CheckCircle size={24} className="text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {t.noUnreadNotes}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    {t.unreadNotesFound} ({activeNotes.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {activeNotes.map(note => (
                      <div key={note.id} className="p-3 bg-amber-50/40 dark:bg-[#1E2025] rounded-xl border border-amber-100 dark:border-[#2A2C33] flex flex-col justify-between space-y-3">
                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 line-clamp-3">
                          {note.content}
                        </p>
                        <div className="flex items-center gap-1.5 self-end">
                          <button
                            onClick={() => handleTriageNote(note.id!, 'archive')}
                            className="text-[10px] px-2 py-1 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded font-bold cursor-pointer"
                          >
                            {t.archiveNote}
                          </button>
                          <button
                            onClick={() => handleTriageNote(note.id!, 'task')}
                            className="text-[10px] px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ListPlus size={10} />
                            {t.convertToTask}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Clean Taskboard */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              className="space-y-5"
            >
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <CheckSquare size={18} className="text-[#34D399]" />
                  {t.step3Title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t.step3Desc}
                </p>
              </div>

              {completedTasks.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-dashed border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                  <CheckCircle size={24} className="text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {t.noCompletedTasks}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      {t.completedTasksFound} ({completedTasks.length})
                    </span>
                    <button
                      onClick={handleArchiveCompletedTasks}
                      className="text-[10px] px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 rounded-lg font-bold flex items-center gap-1.5 shadow-3xs cursor-pointer"
                    >
                      <Archive size={12} />
                      {t.archiveAllCompleted}
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {completedTasks.map(task => (
                      <div key={task.id} className="p-2.5 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-400 line-through truncate">
                          {task.title}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          Done
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Schedule Deep Work */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              className="space-y-5"
            >
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Calendar size={18} className="text-[#34D399]" />
                  {t.step4Title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t.step4Desc}
                </p>
              </div>

              {/* Newport Warn Indicator block if any day exceeds 4 hrs */}
              {Array.from({ length: 7 }).map((_, i) => getDeepWorkHoursForDay(i)).some(h => h > 4.0) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800 dark:text-amber-400">
                      {t.deepWorkWarningTitle}
                    </h5>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                      {t.deepWorkWarningDesc}
                    </p>
                  </div>
                </div>
              )}

              {/* Weekly overview of deep work blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const hours = getDeepWorkHoursForDay(dayIdx);
                  const isExceeded = hours > 4.0;
                  return (
                    <div 
                      key={dayIdx} 
                      className={`p-2.5 rounded-xl border text-center space-y-1 ${
                        isExceeded 
                          ? 'bg-amber-500/5 border-amber-500/40 text-amber-900 dark:text-amber-300' 
                          : hours > 0 
                          ? 'bg-emerald-500/5 border-[#34D399]/40 text-neutral-800 dark:text-neutral-200'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-[#EAE9E6] dark:border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider">
                        {t.dayIndexLabels[dayIdx]}
                      </div>
                      <div className="text-sm font-black font-mono">
                        {hours.toFixed(1)}h
                      </div>
                      <div className="text-[8px] opacity-70">
                        {t.hoursScheduled}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Block Add Form */}
              <form onSubmit={handleAddDeepWorkBlock} className="p-4 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                  <Sparkles size={11} className="text-[#34D399]" />
                  {t.addDeepWorkBlock}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">{t.selectDay}</label>
                    <select
                      value={newBlockDay}
                      onChange={(e) => setNewBlockDay(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium cursor-pointer"
                    >
                      {t.dayIndexFullLabels.map((name, idx) => (
                        <option key={idx} value={idx}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">{t.blockTitle}</label>
                    <input
                      type="text"
                      value={newBlockTitle}
                      onChange={(e) => setNewBlockTitle(e.target.value)}
                      placeholder="e.g. Finish Core Dashboard, Write Strategy C2"
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">{t.startTime}</label>
                      <input
                        type="time"
                        value={newBlockStart}
                        onChange={(e) => setNewBlockStart(e.target.value)}
                        className="w-full text-xs px-1.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">{t.endTime}</label>
                      <input
                        type="time"
                        value={newBlockEnd}
                        onChange={(e) => setNewBlockEnd(e.target.value)}
                        className="w-full text-xs px-1.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#34D399] hover:bg-[#2bb380] text-white rounded-lg text-xs font-bold shadow-3xs flex items-center gap-1 cursor-pointer"
                  >
                    <PlusIcon size={12} />
                    {t.addBlockBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 5: Set Intentions */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Sparkles size={18} className="text-[#34D399]" />
                  {t.step5Title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {t.step5Desc}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {t.weeklyFocusLabel} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={weeklyFocus}
                    onChange={(e) => setWeeklyFocus(e.target.value)}
                    placeholder={t.weeklyFocusPlaceholder}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-[#FBFBFA] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-xl focus:ring-2 focus:ring-[#34D399] focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {t.weeklyGoalLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(e.target.value)}
                    placeholder={t.weeklyGoalPlaceholder}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-[#FBFBFA] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-xl focus:ring-2 focus:ring-[#34D399] focus:outline-none resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation button block */}
      <div className="flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="px-4 py-2 bg-[#F7F6F3] hover:bg-neutral-200 dark:bg-[#1E2025] dark:hover:bg-[#2A2C33] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft size={13} className={isRtl ? 'rotate-180' : ''} />
            {t.prevStep}
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="px-4 py-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-3xs transition-all cursor-pointer"
          >
            {t.nextStep}
            <ArrowRight size={13} className={isRtl ? 'rotate-180' : ''} />
          </button>
        ) : (
          <button
            onClick={handleCompleteReset}
            disabled={!weeklyFocus.trim()}
            className={`px-5 py-2.5 text-white bg-[#34D399] dark:bg-[#34D399] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              !weeklyFocus.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#2bb380]'
            }`}
          >
            <Check size={14} />
            {t.completeReset}
          </button>
        )}
      </div>
    </div>
  );
};

// Helper components
const PlusIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
