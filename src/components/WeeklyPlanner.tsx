import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  Calendar,
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  Brain, 
  Sparkles, 
  Copy, 
  RotateCcw, 
  Layers, 
  LayoutGrid, 
  Columns, 
  Flame, 
  Target, 
  Briefcase, 
  Dumbbell, 
  Users, 
  BookOpen, 
  ArrowRight, 
  Edit3, 
  Zap, 
  Coffee, 
  X,
  ListChecks,
  CheckSquare,
  AlertCircle,
  Eye,
  Sliders
} from 'lucide-react';
import { 
  WeeklyPlanSlot, 
  TaskItem, 
  HabitItem, 
  DailyBlockItem, 
  DailyBlockType, 
  DailyBlockEnergy,
  WeeklyPlanTemplate,
  MonthlyPlanMeta,
  ModuleType,
  ProjectItem,
  GoalItem,
  NestedChecklistItem,
  WeeklyPriorityGoal
} from '../types';
import { ConfirmModal } from './ConfirmModal';
import confetti from 'canvas-confetti';
import { playCelebrationChime, playTaskCompleteSound } from '../utils/focusAudio';

interface WeeklyPlannerProps {
  plans: WeeklyPlanSlot[];
  tasks: TaskItem[];
  habits: HabitItem[];
  projects?: ProjectItem[];
  goals?: GoalItem[];
  weeklyGoals?: WeeklyPriorityGoal[];
  dailyBlocks?: DailyBlockItem[];
  onAddPlan: (slot: Omit<WeeklyPlanSlot, 'id'>) => Promise<any>;
  onUpdatePlan: (id: string, updates: Partial<WeeklyPlanSlot>) => Promise<any>;
  onDeletePlan: (id: string) => Promise<any>;
  onBatchAddPlans?: (slots: Omit<WeeklyPlanSlot, 'id'>[]) => Promise<any>;
  onClearDayPlans?: (dayIndex: number) => Promise<any>;
  onAddDailyBlock?: (block: Omit<DailyBlockItem, 'id'>) => Promise<any>;
  onUpdateDailyBlock?: (id: string, updates: Partial<DailyBlockItem>) => Promise<any>;
  onDeleteDailyBlock?: (id: string) => Promise<any>;
  onBatchApplyDailyBlocks?: (blocks: Omit<DailyBlockItem, 'id'>[]) => Promise<any>;
  onClearDateBlocks?: (dateStr: string) => Promise<any>;
  onToggleTask?: (id: string, completed: boolean) => Promise<any> | void;
  onToggleHabit?: (habitId: string, dateStr: string) => Promise<any> | void;
  onAddWeeklyGoal?: (goal: Omit<WeeklyPriorityGoal, 'id'>) => Promise<any>;
  onUpdateWeeklyGoal?: (id: string, updates: Partial<WeeklyPriorityGoal>) => Promise<any>;
  onDeleteWeeklyGoal?: (id: string) => Promise<any>;
  onRolloverWeeklyGoals?: (
    sourceWeekId: string,
    targetWeekId: string,
    decisions: Record<string, { action: 'rollover' | 'cancel' | 'complete'; notes?: string; newProgress?: number }>
  ) => Promise<any>;
  onNavigateModule?: (module: ModuleType) => void;
  onNavigateGuide?: () => void;
  lang?: 'en' | 'ar';
  isDark?: boolean;
  preSelectedTaskId?: string | null;
  autoOpenAddModal?: boolean;
  onClearPreSelection?: () => void;
}

// ----------------------------------------------------
// NOTION-STYLE CURATED WEEK BLUEPRINT TEMPLATES
// ----------------------------------------------------
export const NOTION_WEEK_TEMPLATES: WeeklyPlanTemplate[] = [
  {
    id: 'executive-deep-work',
    nameEn: 'Executive Deep Work Rhythm',
    nameAr: 'الإيقاع التنفيذي والتركيز العالي',
    descriptionEn: 'Structured around high-leverage morning deep work sprints, afternoon execution, and physical training.',
    descriptionAr: 'منظم حول فترات عمل عميق صباحية عالية المردود، تنفيذ بعد الظهر، وتدريب بدني.',
    icon: '⚡',
    badge: 'Popular',
    slots: [
      // Monday to Thursday: Standard Prime Work
      ...[0, 1, 2, 3].flatMap((day) => [
        {
          dayIndex: day,
          title: 'Morning Ignition & Priority Triage',
          startTime: '08:00',
          endTime: '09:00',
          type: 'general' as const,
          blockType: 'morning' as const,
          color: 'amber',
          icon: '🌅',
          energyRequired: 'medium' as const,
        },
        {
          dayIndex: day,
          title: 'Deep Work Sprint 1 (Needle Mover)',
          startTime: '09:00',
          endTime: '12:00',
          type: 'deep-work' as const,
          blockType: 'deep-work' as const,
          color: 'emerald',
          icon: '🎯',
          energyRequired: 'high' as const,
        },
        {
          dayIndex: day,
          title: 'Nutrition & Decompression',
          startTime: '12:00',
          endTime: '13:30',
          type: 'personal' as const,
          blockType: 'recharge' as const,
          color: 'cyan',
          icon: '🥗',
          energyRequired: 'low' as const,
        },
        {
          dayIndex: day,
          title: 'Execution Sprint 2 & Deliverables',
          startTime: '13:30',
          endTime: '16:30',
          type: 'deep-work' as const,
          blockType: 'execution' as const,
          color: 'indigo',
          icon: '🚀',
          energyRequired: 'high' as const,
        },
        {
          dayIndex: day,
          title: 'Physical Training & Calisthenics',
          startTime: '17:00',
          endTime: '18:30',
          type: 'workout' as const,
          blockType: 'fitness' as const,
          color: 'rose',
          icon: '🏋️',
          energyRequired: 'high' as const,
        },
        {
          dayIndex: day,
          title: 'Evening Wind-Down & Day Audit',
          startTime: '20:00',
          endTime: '21:30',
          type: 'personal' as const,
          blockType: 'evening' as const,
          color: 'purple',
          icon: '🌙',
          energyRequired: 'low' as const,
        },
      ]),
      // Friday: Wrap up, Review, Clean up
      {
        dayIndex: 4,
        title: 'Morning Deep Focus Sprint',
        startTime: '09:00',
        endTime: '12:00',
        type: 'deep-work',
        blockType: 'deep-work',
        color: 'emerald',
        icon: '🎯',
        energyRequired: 'high',
      },
      {
        dayIndex: 4,
        title: 'Weekly Triage & Inbox Clean Up',
        startTime: '14:00',
        endTime: '16:00',
        type: 'general',
        blockType: 'execution',
        color: 'blue',
        icon: '📬',
        energyRequired: 'medium',
      },
      {
        dayIndex: 4,
        title: 'Workout & Weekend Transition',
        startTime: '17:00',
        endTime: '18:30',
        type: 'workout',
        blockType: 'fitness',
        color: 'rose',
        icon: '⚡',
        energyRequired: 'high',
      },
      // Saturday: Creative Rest
      {
        dayIndex: 5,
        title: 'Active Recovery & Outdoor Walk',
        startTime: '10:00',
        endTime: '12:00',
        type: 'personal',
        blockType: 'recharge',
        color: 'cyan',
        icon: '🌲',
        energyRequired: 'low',
      },
      {
        dayIndex: 5,
        title: 'Passion Project or Deep Reading',
        startTime: '14:00',
        endTime: '17:00',
        type: 'personal',
        blockType: 'deep-work',
        color: 'purple',
        icon: '📖',
        energyRequired: 'medium',
      },
      // Sunday: Executive Reset & Next Week Architecture
      {
        dayIndex: 6,
        title: 'Sunday Executive Reset & Audit',
        startTime: '16:00',
        endTime: '18:00',
        type: 'general',
        blockType: 'evening',
        color: 'amber',
        icon: '✨',
        energyRequired: 'medium',
        notes: 'Review weekly wins, clean desk, plan next week timeblocks.',
      },
      {
        dayIndex: 6,
        title: 'Rest & Mental Priming for Monday',
        startTime: '19:30',
        endTime: '21:30',
        type: 'personal',
        blockType: 'evening',
        color: 'purple',
        icon: '🌙',
        energyRequired: 'low',
      },
    ],
  },
  {
    id: 'balanced-lifestyle',
    nameEn: 'Balanced Lifestyle & Health First',
    nameAr: 'الحياة المتوازنة والصحة أولاً',
    descriptionEn: 'Guarantees steady daily progress without sacrificing sleep, movement, family, or personal peace.',
    descriptionAr: 'يضمن تقدماً يومياً ثابتاً دون التضحية بالنوم، الرياضة، العائلة، أو السلام النفسي.',
    icon: '⚖️',
    badge: 'Sustainable',
    slots: [
      ...[0, 1, 2, 3, 4].flatMap((day) => [
        {
          dayIndex: day,
          title: 'Morning Habits & Hydration',
          startTime: '07:30',
          endTime: '08:30',
          type: 'personal' as const,
          blockType: 'morning' as const,
          color: 'amber',
          icon: '🌅',
        },
        {
          dayIndex: day,
          title: 'Core Deep Work Session',
          startTime: '09:00',
          endTime: '12:30',
          type: 'deep-work' as const,
          blockType: 'deep-work' as const,
          color: 'emerald',
          icon: '🎯',
        },
        {
          dayIndex: day,
          title: 'Lunch & Fresh Air Break',
          startTime: '12:30',
          endTime: '14:00',
          type: 'personal' as const,
          blockType: 'recharge' as const,
          color: 'cyan',
          icon: '🥗',
        },
        {
          dayIndex: day,
          title: 'Communications & Task Batching',
          startTime: '14:00',
          endTime: '16:30',
          type: 'general' as const,
          blockType: 'execution' as const,
          color: 'blue',
          icon: '💼',
        },
        {
          dayIndex: day,
          title: 'Daily Workout & Movement',
          startTime: '17:00',
          endTime: '18:15',
          type: 'workout' as const,
          blockType: 'fitness' as const,
          color: 'rose',
          icon: '🏃',
        },
      ]),
      {
        dayIndex: 5,
        title: 'Family & Social Connection',
        startTime: '11:00',
        endTime: '16:00',
        type: 'personal',
        blockType: 'recharge',
        color: 'purple',
        icon: '☕',
      },
      {
        dayIndex: 6,
        title: 'Weekly Review & Calm Reset',
        startTime: '17:00',
        endTime: '18:30',
        type: 'general',
        blockType: 'evening',
        color: 'amber',
        icon: '🕯️',
      },
    ],
  },
  {
    id: 'intense-learning-study',
    nameEn: 'Intense Study & Skill Mastery',
    nameAr: 'الدراسة المكثفة واكتساب المهارات',
    descriptionEn: 'Calibrated for students, certifications, and professionals mastering hard technical subjects.',
    descriptionAr: 'مصمم للطلاب، الشهادات المهنية، وتعلم المهارات الصعبة والبرمجة واللغات.',
    icon: '📚',
    badge: 'Study',
    slots: [
      ...[0, 1, 2, 3, 4].flatMap((day) => [
        {
          dayIndex: day,
          title: 'Prime Theoretical Study Block',
          startTime: '08:30',
          endTime: '11:30',
          type: 'deep-work' as const,
          blockType: 'deep-work' as const,
          color: 'indigo',
          icon: '🧠',
        },
        {
          dayIndex: day,
          title: 'Problem Solving & Active Recall',
          startTime: '13:00',
          endTime: '16:00',
          type: 'deep-work' as const,
          blockType: 'execution' as const,
          color: 'emerald',
          icon: '✍️',
        },
        {
          dayIndex: day,
          title: 'Cardio & Energy Recharge',
          startTime: '17:00',
          endTime: '18:15',
          type: 'workout' as const,
          blockType: 'fitness' as const,
          color: 'rose',
          icon: '🏃',
        },
        {
          dayIndex: day,
          title: 'Spaced Repetition & Flashcards',
          startTime: '19:30',
          endTime: '20:30',
          type: 'personal' as const,
          blockType: 'evening' as const,
          color: 'purple',
          icon: '📑',
        },
      ]),
    ],
  },
  {
    id: 'minimalist-3-block',
    nameEn: 'Minimalist 3-Block Rhythm',
    nameAr: 'الإيقاع المبسط (3 فترات يومياً)',
    descriptionEn: 'The antidote to complexity: 1 main needle mover, 1 admin sprint, 1 restoration block.',
    descriptionAr: 'علاج التعقيد والضغط: فترة واحدة للمهمة الكبرى، فترة للمهام العامة، وفترة للراحة والرياضة.',
    icon: '🌱',
    badge: 'Calm',
    slots: [
      ...[0, 1, 2, 3, 4].flatMap((day) => [
        {
          dayIndex: day,
          title: 'Block 1: The Needle Mover (Single Priority)',
          startTime: '09:00',
          endTime: '12:30',
          type: 'deep-work' as const,
          blockType: 'deep-work' as const,
          color: 'emerald',
          icon: '🎯',
        },
        {
          dayIndex: day,
          title: 'Block 2: Administration & Task Clearing',
          startTime: '14:00',
          endTime: '16:30',
          type: 'general' as const,
          blockType: 'execution' as const,
          color: 'blue',
          icon: '📦',
        },
        {
          dayIndex: day,
          title: 'Block 3: Movement, Food & Decompression',
          startTime: '17:30',
          endTime: '19:30',
          type: 'personal' as const,
          blockType: 'recharge' as const,
          color: 'cyan',
          icon: '🧘',
        },
      ]),
    ],
  },
];

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  plans,
  tasks = [],
  habits = [],
  projects = [],
  goals = [],
  weeklyGoals = [],
  dailyBlocks = [],
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onBatchAddPlans,
  onClearDayPlans,
  onAddDailyBlock,
  onUpdateDailyBlock,
  onDeleteDailyBlock,
  onBatchApplyDailyBlocks,
  onClearDateBlocks,
  onToggleTask,
  onToggleHabit,
  onAddWeeklyGoal,
  onUpdateWeeklyGoal,
  onDeleteWeeklyGoal,
  onRolloverWeeklyGoals,
  onNavigateModule,
  onNavigateGuide,
  lang = 'en',
  isDark = false,
  preSelectedTaskId = null,
  autoOpenAddModal = false,
  onClearPreSelection,
}) => {
  const isAr = lang === 'ar';

  // ----------------------------------------------------
  // VIEW STATE: 'weekly' (Board/Grid) | 'daily' | 'monthly'
  // ----------------------------------------------------
  const [activeView, setActiveView] = useState<'weekly' | 'daily' | 'monthly'>('weekly');
  
  // Week navigation offset (0 = current week, 1 = next week, -1 = previous week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Today calculations
  const now = new Date();
  const currentJsDay = now.getDay();
  const currentMondayBased = currentJsDay === 0 ? 6 : currentJsDay - 1;
  const todayDateStr = now.toISOString().split('T')[0];

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(currentMondayBased);

  // Compute week dates based on weekOffset
  const weekInfo = useMemo(() => {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    const DAYS_NAMES_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const DAYS_NAMES_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
    const SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const SHORT_AR = ['اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت', 'أحد'];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      days.push({
        index: i,
        name: isAr ? DAYS_NAMES_AR[i] : DAYS_NAMES_EN[i],
        short: isAr ? SHORT_AR[i] : SHORT_EN[i],
        date: dayDate,
        dateStr,
        dayNum: dayDate.getDate(),
        monthShort: dayDate.toLocaleDateString(isAr ? 'ar-MA' : 'en-US', { month: 'short' }),
        isToday: dateStr === todayDateStr,
      });
    }

    const startStr = `${days[0].dayNum} ${days[0].monthShort}`;
    const endStr = `${days[6].dayNum} ${days[6].monthShort} ${days[6].date.getFullYear()}`;
    const weekNumber = Math.ceil((((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7);

    return { monday, days, dateRangeStr: `${startStr} - ${endStr}`, weekNumber };
  }, [weekOffset, isAr, todayDateStr]);

  // Selected dateStr corresponding to selectedDayIndex
  const selectedDateStr = weekInfo.days[selectedDayIndex]?.dateStr || todayDateStr;

  const currentWeekId = useMemo(() => {
    return `${weekInfo.monday.getFullYear()}-W${String(weekInfo.weekNumber).padStart(2, '0')}`;
  }, [weekInfo]);

  const nextWeekId = useMemo(() => {
    const nextMonday = new Date(weekInfo.monday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    const nextWeekNum = Math.ceil((((nextMonday.getTime() - new Date(nextMonday.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7);
    return `${nextMonday.getFullYear()}-W${String(nextWeekNum).padStart(2, '0')}`;
  }, [weekInfo]);

  // Current week's 3 priority goals
  const thisWeekGoals = useMemo(() => {
    return (weeklyGoals || []).filter((g) => g.weekId === currentWeekId).sort((a, b) => a.rank - b.rank);
  }, [weeklyGoals, currentWeekId]);

  // Quick inspection slot modal
  const [viewingSlot, setViewingSlot] = useState<WeeklyPlanSlot | null>(null);

  // Top 3 Weekly Goals Modals
  const [showWeeklyGoalsModal, setShowWeeklyGoalsModal] = useState(false);
  const [showRolloverModal, setShowRolloverModal] = useState(false);

  // Form states for setting the 3 goals
  const [goal1Title, setGoal1Title] = useState('');
  const [goal1Desc, setGoal1Desc] = useState('');
  const [goal1LongTermId, setGoal1LongTermId] = useState('');
  const [goal1ProjectId, setGoal1ProjectId] = useState('');

  const [goal2Title, setGoal2Title] = useState('');
  const [goal2Desc, setGoal2Desc] = useState('');
  const [goal2LongTermId, setGoal2LongTermId] = useState('');
  const [goal2ProjectId, setGoal2ProjectId] = useState('');

  const [goal3Title, setGoal3Title] = useState('');
  const [goal3Desc, setGoal3Desc] = useState('');
  const [goal3LongTermId, setGoal3LongTermId] = useState('');
  const [goal3ProjectId, setGoal3ProjectId] = useState('');

  // Rollover decisions state
  const [rolloverDecisions, setRolloverDecisions] = useState<
    Record<string, { action: 'rollover' | 'cancel' | 'complete'; notes: string; newProgress: number }>
  >({});

  // ----------------------------------------------------
  // MODALS & INTERACTION STATES
  // ----------------------------------------------------
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewWeekWizard, setShowNewWeekWizard] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WeeklyPlanSlot | null>(null);
  const [planToDelete, setPlanToDelete] = useState<WeeklyPlanSlot | null>(null);
  const [showMethodologyBanner, setShowMethodologyBanner] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  // Form Fields for Add/Edit Slot
  const [formTitle, setFormTitle] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('11:30');
  const [formType, setFormType] = useState<WeeklyPlanSlot['type']>('deep-work');
  const [formBlockType, setFormBlockType] = useState<DailyBlockType>('deep-work');
  const [formColor, setFormColor] = useState('emerald');
  const [formNotes, setFormNotes] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formGoalId, setFormGoalId] = useState<string>('');
  const [formEnergy, setFormEnergy] = useState<DailyBlockEnergy>('medium');
  const [formIcon, setFormIcon] = useState<string>('🎯');
  const [formChecklist, setFormChecklist] = useState<NestedChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState<string>('');
  // Scope selector: 'day_only' (Single day exception) vs 'recurring' (Apply always)
  const [formScope, setFormScope] = useState<'day_only' | 'recurring'>('day_only');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard state
  const [wizardWeekTheme, setWizardWeekTheme] = useState('');
  const [wizardSelectedTemplateId, setWizardSelectedTemplateId] = useState<string>('executive-deep-work');
  const [wizardAutoSyncDailyBlocks, setWizardAutoSyncDailyBlocks] = useState(true);

  // Monthly planner state
  const [monthlyThemes, setMonthlyThemes] = useState<Record<string, string>>(() => {
    try {
      const s = localStorage.getItem('planner_monthly_themes_v1');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });
  const currentMonthKey = `${weekInfo.monday.getFullYear()}-${String(weekInfo.monday.getMonth() + 1).padStart(2, '0')}`;
  const [currentMonthThemeInput, setCurrentMonthThemeInput] = useState(() => monthlyThemes[currentMonthKey] || '');

  // Board density state: 'compact' (micro chips) vs 'detailed' (expanded checklists/habits)
  const [boardDensity, setBoardDensity] = useState<'compact' | 'detailed'>(() => {
    try {
      const saved = localStorage.getItem('planner_board_density');
      if (saved === 'compact' || saved === 'detailed') return saved;
    } catch {}
    return 'compact';
  });

  const toggleBoardDensity = (density: 'compact' | 'detailed') => {
    setBoardDensity(density);
    try {
      localStorage.setItem('planner_board_density', density);
    } catch {}
  };

  // Synchronize preSelectedTaskId and autoOpenAddModal
  useEffect(() => {
    if (preSelectedTaskId) {
      const task = tasks.find((t) => t.id === preSelectedTaskId);
      if (task) {
        setFormTitle(`${isAr ? 'مهمة: ' : 'Task: '}${task.title}`);
        setSelectedTaskIds([preSelectedTaskId]);
        setFormType(task.priority === 'High' ? 'deep-work' : 'general');
        setFormScope('day_only');
        if (autoOpenAddModal) {
          setShowAddModal(true);
        }
      }
    }
  }, [preSelectedTaskId, autoOpenAddModal, tasks, isAr]);

  // Reset form helper
  const resetForm = () => {
    setFormTitle('');
    setFormStartTime('09:00');
    setFormEndTime('11:30');
    setFormType('deep-work');
    setFormBlockType('deep-work');
    setFormColor('emerald');
    setFormNotes('');
    setSelectedTaskIds([]);
    setSelectedHabitIds([]);
    setFormProjectId('');
    setFormGoalId('');
    setFormEnergy('medium');
    setFormIcon('🎯');
    setFormChecklist([]);
    setNewChecklistText('');
    setFormScope('day_only');
    setEditingPlan(null);
  };

  // Open Edit Modal for a slot
  const handleOpenEdit = (slot: WeeklyPlanSlot) => {
    setEditingPlan(slot);
    setFormTitle(slot.title);
    setFormStartTime(slot.startTime || '09:00');
    setFormEndTime(slot.endTime || '11:00');
    setFormType(slot.type || 'deep-work');
    setFormBlockType(slot.blockType || 'deep-work');
    setFormColor(slot.color || 'emerald');
    setFormNotes(slot.notes || '');
    setSelectedTaskIds(slot.linkedTaskIds || []);
    setSelectedHabitIds(slot.linkedHabitIds || []);
    setFormProjectId(slot.linkedProjectId || '');
    setFormGoalId(slot.linkedGoalId || '');
    setFormEnergy(slot.energyRequired || 'medium');
    setFormIcon(slot.icon || '🎯');
    setFormChecklist(slot.nestedChecklist || []);
    setNewChecklistText('');
    // If it has a date assigned, default to day_only, else recurring
    setFormScope(slot.date ? 'day_only' : 'recurring');
    setShowAddModal(true);
  };

  // Toggle nested checklist item inside a plan slot
  const handleToggleSlotChecklistItem = async (slot: WeeklyPlanSlot, itemId: string) => {
    if (!slot.id || !slot.nestedChecklist) return;
    const updatedList = slot.nestedChecklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await onUpdatePlan(slot.id, { nestedChecklist: updatedList });
    playTaskCompleteSound();
  };

  // ----------------------------------------------------
  // SLOT RESOLVER FOR A DAY
  // Logic: 
  // 1. If day has single-day override slots (slot.date === day.dateStr), use them!
  // 2. Otherwise, fallback to recurring slots (slot.dayIndex === day.index && !slot.date)
  // This guarantees user's requirement: recurring template by default, but single-day exceptions preserved!
  // ----------------------------------------------------
  const getSlotsForDay = (dayIndex: number, dateStr: string) => {
    const singleDaySlots = plans.filter((p) => p.date === dateStr);
    if (singleDaySlots.length > 0) {
      return singleDaySlots.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
    }
    // Fallback to recurring
    return plans
      .filter((p) => p.dayIndex === dayIndex && (!p.date || p.isRecurring === true))
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
  };

  // Current selected day slots
  const currentDaySlots = useMemo(() => {
    return getSlotsForDay(selectedDayIndex, selectedDateStr);
  }, [plans, selectedDayIndex, selectedDateStr]);

  // Submit Add or Edit Slot
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const isDayOnly = formScope === 'day_only';
      const slotData: Omit<WeeklyPlanSlot, 'id'> = {
        dayIndex: selectedDayIndex,
        title: formTitle.trim(),
        timeSlot: `${formStartTime} - ${formEndTime}`,
        startTime: formStartTime,
        endTime: formEndTime,
        type: formType,
        blockType: formBlockType,
        color: formColor,
        icon: formIcon,
        energyRequired: formEnergy,
        notes: formNotes.trim(),
        linkedTaskIds: selectedTaskIds,
        linkedHabitIds: selectedHabitIds,
        linkedProjectId: formProjectId || undefined,
        linkedGoalId: formGoalId || undefined,
        nestedChecklist: formChecklist.length > 0 ? formChecklist : undefined,
        completed: editingPlan ? editingPlan.completed : false,
        // IF day_only: bind to exact date and mark isRecurring false.
        // IF recurring: omit date and mark isRecurring true so it repeats!
        date: isDayOnly ? selectedDateStr : undefined,
        isRecurring: !isDayOnly,
        createdAt: editingPlan ? editingPlan.createdAt : Date.now(),
      };

      if (editingPlan && editingPlan.id) {
        // If editing a recurring template, but user explicitly chose "day_only" exception:
        // Create a single-day override for selectedDateStr and leave the master recurring template intact!
        if (editingPlan.isRecurring && !editingPlan.date && isDayOnly) {
          await onAddPlan({
            ...slotData,
            date: selectedDateStr,
            isRecurring: false,
          });
        } else {
          await onUpdatePlan(editingPlan.id, slotData);
        }
      } else {
        await onAddPlan(slotData);
      }

      // If user also wants to sync directly to Daily Blocks
      if (onAddDailyBlock && isDayOnly) {
        try {
          await onAddDailyBlock({
            date: selectedDateStr,
            title: formTitle.trim(),
            subtitle: formNotes.trim(),
            startTime: formStartTime,
            endTime: formEndTime,
            blockType: formBlockType,
            status: 'pending',
            color: formColor,
            icon: formIcon,
            energyRequired: formEnergy,
            linkedTaskIds: selectedTaskIds,
            linkedHabitIds: selectedHabitIds,
            linkedProjectId: formProjectId || undefined,
            linkedGoalId: formGoalId || undefined,
            nestedChecklist: formChecklist.length > 0 ? formChecklist : undefined,
            order: currentDaySlots.length + 1,
            createdAt: Date.now(),
          });
        } catch (e) {
          console.warn('Sync to daily block error:', e);
        }
      }

      setShowAddModal(false);
      resetForm();
      if (onClearPreSelection) onClearPreSelection();
    } catch (err) {
      console.error('Failed to save plan slot:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync a single day to Daily Blocks
  const handleSyncDayToDailyBlocks = async (dayIndex: number, dateStr: string) => {
    if (!onBatchApplyDailyBlocks) return;
    try {
      const slots = getSlotsForDay(dayIndex, dateStr);
      if (slots.length === 0) {
        setSyncStatusMessage(isAr ? 'لا توجد فترات مجدولة في هذا اليوم لتصديرها.' : 'No slots scheduled for this day to sync.');
        setTimeout(() => setSyncStatusMessage(null), 3000);
        return;
      }
      const blocksToCreate: Omit<DailyBlockItem, 'id'>[] = slots.map((s, idx) => ({
        date: dateStr,
        title: s.title,
        subtitle: s.notes || undefined,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '11:00',
        blockType: s.blockType || (s.type === 'deep-work' ? 'deep-work' : s.type === 'workout' ? 'fitness' : 'execution'),
        status: s.completed ? 'completed' : 'pending',
        color: s.color || 'emerald',
        icon: s.icon,
        energyRequired: s.energyRequired || 'medium',
        linkedTaskIds: s.linkedTaskIds,
        linkedHabitIds: s.linkedHabitIds,
        linkedProjectId: s.linkedProjectId,
        linkedGoalId: s.linkedGoalId,
        nestedChecklist: s.nestedChecklist,
        order: idx + 1,
        createdAt: Date.now() + idx,
      }));
      await onBatchApplyDailyBlocks(blocksToCreate);
      const dayObj = weekInfo.days.find((d) => d.dateStr === dateStr);
      setSyncStatusMessage(
        isAr
          ? `✓ تم تصدير ${blocksToCreate.length} فترة ليوم ${dayObj ? dayObj.name : dateStr} إلى Daily Blocks!`
          : `✓ Successfully synced ${blocksToCreate.length} blocks for ${dayObj ? dayObj.name : dateStr} to Daily Blocks!`
      );
      playCelebrationChime();
      setTimeout(() => setSyncStatusMessage(null), 4000);
    } catch (e) {
      console.warn('Sync day to daily blocks failed:', e);
    }
  };

  // Toggle slot completion with sound and confetti
  const handleToggleSlot = async (slot: WeeklyPlanSlot) => {
    if (!slot.id) return;
    const nextCompleted = !slot.completed;
    await onUpdatePlan(slot.id, { completed: nextCompleted });

    if (nextCompleted) {
      playTaskCompleteSound();
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
      });
    }
  };

  // Duplicate slot to next day (or copy to all weekdays)
  const handleDuplicateSlot = async (slot: WeeklyPlanSlot, targetDayIndex: number) => {
    try {
      const targetDate = weekInfo.days[targetDayIndex]?.dateStr;
      await onAddPlan({
        dayIndex: targetDayIndex,
        title: slot.title,
        timeSlot: slot.timeSlot,
        startTime: slot.startTime,
        endTime: slot.endTime,
        type: slot.type,
        blockType: slot.blockType,
        color: slot.color,
        notes: slot.notes,
        linkedTaskIds: slot.linkedTaskIds,
        linkedHabitIds: slot.linkedHabitIds,
        completed: false,
        date: targetDate,
        isRecurring: false,
        createdAt: Date.now(),
      });
      playCelebrationChime();
    } catch (e) {
      console.warn('Failed to duplicate slot:', e);
    }
  };

  // Copy current slot to all 5 weekdays (Mon-Fri)
  const handleCopyToAllWeekdays = async (slot: WeeklyPlanSlot) => {
    try {
      const newSlots: Omit<WeeklyPlanSlot, 'id'>[] = [0, 1, 2, 3, 4].map((dayIdx) => ({
        dayIndex: dayIdx,
        title: slot.title,
        timeSlot: slot.timeSlot,
        startTime: slot.startTime,
        endTime: slot.endTime,
        type: slot.type,
        blockType: slot.blockType,
        color: slot.color,
        notes: slot.notes,
        linkedTaskIds: slot.linkedTaskIds,
        linkedHabitIds: slot.linkedHabitIds,
        completed: false,
        isRecurring: true,
        createdAt: Date.now() + dayIdx,
      }));

      if (onBatchAddPlans) {
        await onBatchAddPlans(newSlots);
      } else {
        for (const s of newSlots) {
          await onAddPlan(s);
        }
      }
      playCelebrationChime();
    } catch (e) {
      console.warn('Failed to copy to weekdays:', e);
    }
  };

  // ----------------------------------------------------
  // SYNC THIS WEEK TO DAILY BLOCKS (The requested bridge!)
  // ----------------------------------------------------
  const handleSyncWeekToDailyBlocks = async () => {
    if (!onBatchApplyDailyBlocks) return;
    setIsSubmitting(true);
    try {
      const blocksToCreate: Omit<DailyBlockItem, 'id'>[] = [];

      weekInfo.days.forEach((d) => {
        const slots = getSlotsForDay(d.index, d.dateStr);
        slots.forEach((s, idx) => {
          blocksToCreate.push({
            date: d.dateStr,
            title: s.title,
            subtitle: s.notes || undefined,
            startTime: s.startTime || '09:00',
            endTime: s.endTime || '11:00',
            blockType: s.blockType || (s.type === 'deep-work' ? 'deep-work' : s.type === 'workout' ? 'fitness' : 'execution'),
            status: s.completed ? 'completed' : 'pending',
            color: s.color || 'emerald',
            linkedTaskIds: s.linkedTaskIds,
            linkedHabitIds: s.linkedHabitIds,
            order: idx + 1,
            createdAt: Date.now() + idx,
          });
        });
      });

      if (blocksToCreate.length > 0) {
        await onBatchApplyDailyBlocks(blocksToCreate);
        setSyncStatusMessage(
          isAr
            ? `✓ تم تصدير ${blocksToCreate.length} فترة بنجاح إلى فترات اليوم (Daily Blocks)!`
            : `✓ Successfully synced ${blocksToCreate.length} time blocks to Daily Blocks!`
        );
        playCelebrationChime();
        setTimeout(() => setSyncStatusMessage(null), 4000);
      }
    } catch (err) {
      console.warn('Failed to sync to daily blocks:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // NEW WEEK PLANNING WIZARD: APPLY BLUEPRINT
  // ----------------------------------------------------
  const handleApplyWeekBlueprint = async () => {
    setIsSubmitting(true);
    try {
      const template = NOTION_WEEK_TEMPLATES.find((t) => t.id === wizardSelectedTemplateId);
      if (!template) return;

      const slotsToCreate: Omit<WeeklyPlanSlot, 'id'>[] = template.slots.map((s, idx) => {
        const targetDate = weekInfo.days[s.dayIndex]?.dateStr;
        return {
          dayIndex: s.dayIndex,
          title: s.title,
          timeSlot: `${s.startTime} - ${s.endTime}`,
          startTime: s.startTime,
          endTime: s.endTime,
          type: s.type,
          blockType: s.blockType || 'deep-work',
          color: s.color || 'emerald',
          icon: s.icon,
          notes: s.notes,
          completed: false,
          date: targetDate, // specific to this planned week
          isRecurring: false,
          createdAt: Date.now() + idx,
        };
      });

      if (onBatchAddPlans) {
        await onBatchAddPlans(slotsToCreate);
      } else {
        for (const s of slotsToCreate) {
          await onAddPlan(s);
        }
      }

      // Auto-sync to daily blocks if checked
      if (wizardAutoSyncDailyBlocks && onBatchApplyDailyBlocks) {
        const blocksToCreate: Omit<DailyBlockItem, 'id'>[] = slotsToCreate.map((s, idx) => ({
          date: s.date || selectedDateStr,
          title: s.title,
          subtitle: s.notes,
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '11:00',
          blockType: s.blockType || 'deep-work',
          status: 'pending',
          color: s.color || 'emerald',
          icon: s.icon,
          order: idx + 1,
          createdAt: Date.now() + idx,
        }));
        await onBatchApplyDailyBlocks(blocksToCreate);
      }

      // Save theme to localStorage
      if (wizardWeekTheme.trim()) {
        try {
          const key = `week_theme_${weekInfo.monday.getFullYear()}_W${weekInfo.weekNumber}`;
          localStorage.setItem(key, wizardWeekTheme.trim());
        } catch {}
      }

      setShowNewWeekWizard(false);
      setWizardWeekTheme('');
      playCelebrationChime();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.warn('Failed to apply week blueprint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // WEEKLY PRIORITY GOALS (#1, #2, #3) & ROLLOVER
  // ----------------------------------------------------
  const handleOpenWeeklyGoalsModal = () => {
    const g1 = thisWeekGoals.find((g) => g.rank === 1);
    const g2 = thisWeekGoals.find((g) => g.rank === 2);
    const g3 = thisWeekGoals.find((g) => g.rank === 3);

    setGoal1Title(g1?.title || '');
    setGoal1Desc(g1?.description || '');
    setGoal1LongTermId(g1?.linkedGoalId || '');
    setGoal1ProjectId(g1?.linkedProjectId || '');

    setGoal2Title(g2?.title || '');
    setGoal2Desc(g2?.description || '');
    setGoal2LongTermId(g2?.linkedGoalId || '');
    setGoal2ProjectId(g2?.linkedProjectId || '');

    setGoal3Title(g3?.title || '');
    setGoal3Desc(g3?.description || '');
    setGoal3LongTermId(g3?.linkedGoalId || '');
    setGoal3ProjectId(g3?.linkedProjectId || '');

    setShowWeeklyGoalsModal(true);
  };

  const handleSaveWeeklyGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    const g1 = thisWeekGoals.find((g) => g.rank === 1);
    const g2 = thisWeekGoals.find((g) => g.rank === 2);
    const g3 = thisWeekGoals.find((g) => g.rank === 3);

    const saveGoal = async (
      rank: 1 | 2 | 3,
      existing: WeeklyPriorityGoal | undefined,
      titleVal: string,
      descVal: string,
      longTermVal: string,
      projVal: string
    ) => {
      if (!titleVal.trim()) {
        if (existing?.id && onDeleteWeeklyGoal) {
          await onDeleteWeeklyGoal(existing.id);
        }
        return;
      }
      if (existing?.id && onUpdateWeeklyGoal) {
        await onUpdateWeeklyGoal(existing.id, {
          title: titleVal.trim(),
          description: descVal.trim() || undefined,
          linkedGoalId: longTermVal || undefined,
          linkedProjectId: projVal || undefined,
        });
      } else if (onAddWeeklyGoal) {
        await onAddWeeklyGoal({
          weekId: currentWeekId,
          rank,
          title: titleVal.trim(),
          description: descVal.trim() || undefined,
          linkedGoalId: longTermVal || undefined,
          linkedProjectId: projVal || undefined,
          progressPercent: 0,
          status: 'in_progress',
          createdAt: Date.now(),
        });
      }
    };

    await saveGoal(1, g1, goal1Title, goal1Desc, goal1LongTermId, goal1ProjectId);
    await saveGoal(2, g2, goal2Title, goal2Desc, goal2LongTermId, goal2ProjectId);
    await saveGoal(3, g3, goal3Title, goal3Desc, goal3LongTermId, goal3ProjectId);

    setShowWeeklyGoalsModal(false);
    playCelebrationChime();
  };

  const handleUpdateGoalProgress = async (goal: WeeklyPriorityGoal, newPct: number) => {
    if (!goal.id || !onUpdateWeeklyGoal) return;
    const clamped = Math.max(0, Math.min(100, newPct));
    await onUpdateWeeklyGoal(goal.id, {
      progressPercent: clamped,
      status: clamped >= 100 ? 'completed' : 'in_progress',
    });
    if (clamped >= 100) {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      playTaskCompleteSound();
    }
  };

  const handleOpenRolloverModal = () => {
    const initialDecisions: Record<
      string,
      { action: 'rollover' | 'cancel' | 'complete'; notes: string; newProgress: number }
    > = {};
    thisWeekGoals.forEach((g) => {
      if (g.id) {
        initialDecisions[g.id] = {
          action: g.progressPercent >= 100 ? 'complete' : 'rollover',
          notes: g.outcomeNotes || '',
          newProgress: g.progressPercent,
        };
      }
    });
    setRolloverDecisions(initialDecisions);
    setShowRolloverModal(true);
  };

  const handleExecuteRollover = async () => {
    if (onRolloverWeeklyGoals) {
      await onRolloverWeeklyGoals(currentWeekId, nextWeekId, rolloverDecisions);
    }
    setShowRolloverModal(false);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    playCelebrationChime();
  };

  // Helper for styling badge colors
  const getTypeBadge = (type: WeeklyPlanSlot['type']) => {
    switch (type) {
      case 'deep-work':
        return { label: isAr ? 'عمل عميق' : 'Deep Work', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20', icon: Briefcase };
      case 'meeting':
        return { label: isAr ? 'اجتماع' : 'Meeting', bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20', icon: Users };
      case 'workout':
        return { label: isAr ? 'تمرين' : 'Workout', bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20', icon: Dumbbell };
      case 'personal':
        return { label: isAr ? 'شخصي' : 'Personal', bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20', icon: BookOpen };
      default:
        return { label: isAr ? 'عام' : 'General', bg: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-neutral-500/20', icon: Sparkles };
    }
  };

  // Saved week theme from localStorage
  const currentWeekTheme = useMemo(() => {
    try {
      const key = `week_theme_${weekInfo.monday.getFullYear()}_W${weekInfo.weekNumber}`;
      return localStorage.getItem(key) || '';
    } catch { return ''; }
  }, [weekInfo]);

  return (
    <div className="space-y-5 w-full max-w-[1920px] mx-auto animate-fadeIn select-none">
      {/* ----------------------------------------------------
          NOTION-STYLE BREADCRUMBS & TOP CONTROLS BAR
          ---------------------------------------------------- */}
      <div className="bg-white dark:bg-[#16181D] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Notion Breadcrumb */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              <span>Core Workspace</span>
              <span>/</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Calendar size={13} />
                {isAr ? 'المخطط الرئيسي المتكامل' : 'Master Planning Hub'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                {isAr ? `أسبوع ${weekInfo.weekNumber} • ${weekInfo.dateRangeStr}` : `Week ${weekInfo.weekNumber} • ${weekInfo.dateRangeStr}`}
              </h1>

              {weekOffset === 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                  {isAr ? 'الأسبوع الحالي' : 'Current Week'}
                </span>
              )}
            </div>

            {currentWeekTheme && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 font-medium italic">
                <Target size={13} className="text-emerald-500 shrink-0" />
                <span>{isAr ? 'هدف الأسبوع:' : 'Week North Star:'} {currentWeekTheme}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Week Stepper */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl p-1 border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
                title={isAr ? 'الأسبوع السابق' : 'Previous Week'}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 rounded-xl transition-all cursor-pointer"
              >
                {isAr ? 'هذا الأسبوع' : 'This Week'}
              </button>
              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
                title={isAr ? 'الأسبوع القادم' : 'Next Week'}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Sync Week to Daily Blocks Button */}
            <button
              onClick={handleSyncWeekToDailyBlocks}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer shadow-2xs active:scale-95"
              title={isAr ? 'تصدير هذا الأسبوع لفترات اليوم' : 'Sync week to Daily Blocks'}
            >
              <Layers size={14} className="text-emerald-500" />
              <span>{isAr ? 'مزامنة مع فترات اليوم' : 'Sync to Daily Blocks'}</span>
            </button>

            {/* Plan New Week Wizard Button */}
            <button
              onClick={() => setShowNewWeekWizard(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles size={14} />
              <span>{isAr ? 'تخطيط أسبوع جديد (نويشن)' : 'New Week Planning'}</span>
            </button>

            {/* Add Custom Time Block */}
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-950 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>{isAr ? 'إضافة فترة' : 'Add Block'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatusMessage && (
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{syncStatusMessage}</span>
          </div>
        )}

        {/* Notion-style Tab View Switcher */}
        <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setActiveView('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'weekly'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Columns size={13} />
              <span>{isAr ? 'اللوحة الأسبوعية (7 أيام)' : '7-Day Weekly Board'}</span>
            </button>

            <button
              onClick={() => setActiveView('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'daily'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Clock size={13} />
              <span>{isAr ? 'فترات اليوم بالتفصيل' : 'Daily Blocks Flow'}</span>
            </button>

            <button
              onClick={() => setActiveView('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'monthly'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <CalendarDays size={13} />
              <span>{isAr ? 'الرؤية الشهرية الكلية' : 'Monthly Overview'}</span>
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>{isAr ? 'مجموع فترات الأسبوع:' : 'Total Week Slots:'}</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {weekInfo.days.reduce((acc, d) => acc + getSlotsForDay(d.index, d.dateStr).length, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          TOP 3 WEEKLY CORE PRIORITIES (الأولويات الثلاث الكبرى للأسبوع)
          ---------------------------------------------------- */}
      <div className="bg-gradient-to-br from-white via-white to-neutral-50/80 dark:from-[#16181D] dark:via-[#16181D] dark:to-[#121316] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                  {isAr ? 'الأهداف الثلاثة الأساسية للأسبوع' : 'Top 3 Weekly Core Goals'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {currentWeekId}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                {isAr
                  ? 'أهم ٣ مخرجات للتركيز عليها هذا الأسبوع، مع مراجعة النسبة المحققة وترحيل أو إغلاق المتبقي نهاية الأسبوع.'
                  : 'The 3 core needle-movers for this week. Review percentage achieved & roll over or close at week end.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleOpenWeeklyGoalsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 size={13} className="text-emerald-500" />
              <span>{isAr ? 'تحديد / تعديل الأهداف' : 'Set Goals'}</span>
            </button>

            <button
              onClick={handleOpenRolloverModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
              title={isAr ? 'مراجعة نسب الإنجاز وترحيل الأهداف المتبقية للأسبوع القادم' : 'End of week review & rollover'}
            >
              <RotateCcw size={13} />
              <span>{isAr ? 'نهاية الأسبوع: مراجعة وترحيل' : 'Week Review & Rollover'}</span>
            </button>
          </div>
        </div>

        {/* 3 Goals Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((rank) => {
            const goal = thisWeekGoals.find((g) => g.rank === rank);
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
            const rankLabel = rank === 1
              ? (isAr ? 'الهدف الرئيسي الأول' : 'Primary Focus #1')
              : rank === 2
              ? (isAr ? 'الهدف الثانوي الثاني' : 'Secondary Focus #2')
              : (isAr ? 'الهدف التكميلي الثالث' : 'Tertiary Focus #3');

            const linkedGl = goals.find((g) => g.id === goal?.linkedGoalId);
            const linkedPr = projects.find((p) => p.id === goal?.linkedProjectId);

            if (!goal) {
              return (
                <div
                  key={rank}
                  onClick={handleOpenWeeklyGoalsModal}
                  className="p-3.5 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500/60 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col justify-between cursor-pointer transition-all min-h-[110px]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-400 flex items-center gap-1">
                      <span>{rankEmoji}</span>
                      <span>{rankLabel}</span>
                    </span>
                    <Plus size={14} className="text-neutral-400" />
                  </div>
                  <p className="text-xs text-neutral-400 font-medium italic">
                    {isAr ? '+ انقر لتحديد هذا الهدف الأسبوعي...' : '+ Click to set this weekly goal...'}
                  </p>
                </div>
              );
            }

            const isDone = goal.progressPercent >= 100 || goal.status === 'completed';

            return (
              <div
                key={rank}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 ${
                  isDone
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : goal.status === 'carried_over'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-white dark:bg-[#1A1D24] border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-xs mb-1">
                    <span className="font-bold text-neutral-500 flex items-center gap-1 text-[11px]">
                      <span>{rankEmoji}</span>
                      <span>{rankLabel}</span>
                    </span>

                    {goal.carriedFromWeekId && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {isAr ? 'مرحل' : 'Carried'}
                      </span>
                    )}

                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {goal.progressPercent}%
                    </span>
                  </div>

                  <h4 className={`text-xs font-black leading-snug break-words ${isDone ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                    {goal.title}
                  </h4>

                  {goal.description && (
                    <p className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5">
                      {goal.description}
                    </p>
                  )}

                  {/* Connected Long-term Goal & Project chips */}
                  <div className="flex items-center gap-1 pt-1.5 flex-wrap">
                    {linkedGl && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 truncate max-w-[110px]" title={linkedGl.title}>
                        🎯 {linkedGl.title}
                      </span>
                    )}
                    {linkedPr && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 truncate max-w-[110px]" title={linkedPr.title}>
                        📁 {linkedPr.title}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar + Quick Steppers */}
                <div className="space-y-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1 text-[9px] text-neutral-400">
                    <span>{isAr ? 'نسبة الإنجاز:' : 'Progress:'}</span>
                    <div className="flex items-center gap-1 font-mono">
                      {[0, 25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handleUpdateGoalProgress(goal, pct)}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                            goal.progressPercent === pct
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                              : 'hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------
          VIEW 1: NOTION 7-DAY WEEKLY BOARD
          ---------------------------------------------------- */}
      {activeView === 'weekly' && (
        <div className="space-y-3">
          {/* Board Toolbar & Density Selector */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-neutral-400">{isAr ? 'نمط العرض:' : 'View Density:'}</span>
              <div className="flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
                <button
                  onClick={() => toggleBoardDensity('compact')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                    boardDensity === 'compact'
                      ? 'bg-white dark:bg-[#1A1D24] text-neutral-900 dark:text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title={isAr ? 'عرض بطاقات مدمج وأنيق وسهل القراءة' : 'Sleek, uncluttered compact cards'}
                >
                  <Sliders size={12} />
                  <span>{isAr ? 'مدمج أنيق' : 'Compact'}</span>
                </button>
                <button
                  onClick={() => toggleBoardDensity('detailed')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                    boardDensity === 'detailed'
                      ? 'bg-white dark:bg-[#1A1D24] text-neutral-900 dark:text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title={isAr ? 'عرض كامل الخطوات والعادات داخل البطاقة' : 'Expanded view with full sub-steps'}
                >
                  <ListChecks size={12} />
                  <span>{isAr ? 'مفصل كامل' : 'Detailed'}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 font-mono">
              {weekInfo.days.reduce((acc, d) => acc + getSlotsForDay(d.index, d.dateStr).filter((s) => s.completed).length, 0)} / {weekInfo.days.reduce((acc, d) => acc + getSlotsForDay(d.index, d.dateStr).length, 0)} {isAr ? 'منجز' : 'completed'}
            </div>
          </div>

          {/* Mobile Horizontal Carousel Tabs */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {weekInfo.days.map((d) => {
              const daySlots = getSlotsForDay(d.index, d.dateStr);
              const isSelected = selectedDayIndex === d.index;
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDayIndex(d.index)}
                  className={`flex flex-col items-center px-3 py-2 rounded-2xl shrink-0 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black'
                      : d.isToday
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'bg-white dark:bg-[#16181D] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-neutral-500">{d.short}</span>
                  <span className="text-sm font-bold">{d.dayNum}</span>
                  <span className="text-[9px] font-mono opacity-60">{daySlots.length} blk</span>
                </button>
              );
            })}
          </div>

          {/* Desktop 7-Column Notion Grid with Horizontal Scroll protection */}
          <div className="overflow-x-auto pb-3 custom-scrollbar">
            <div className="grid grid-cols-7 gap-3 min-w-[1050px] xl:min-w-0">
              {weekInfo.days.map((d) => {
                const daySlots = getSlotsForDay(d.index, d.dateStr);
                const isSelected = selectedDayIndex === d.index;
                const completedCount = daySlots.filter((s) => s.completed).length;

                return (
                  <div
                    key={d.dateStr}
                    onClick={() => setSelectedDayIndex(d.index)}
                    className={`flex flex-col rounded-3xl border transition-all ${
                      d.isToday
                        ? 'bg-amber-500/5 dark:bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/30'
                        : isSelected
                        ? 'bg-white dark:bg-[#16181D] border-emerald-500/50 shadow-sm'
                        : 'bg-white/80 dark:bg-[#16181D]/80 border-neutral-200 dark:border-neutral-800'
                    } min-h-[360px]`}
                  >
                    {/* Column Header */}
                    <div className="p-3 border-b border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                            {d.name}
                          </span>
                          {d.isToday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          {d.dayNum} {d.monthShort}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">
                          {completedCount}/{daySlots.length}
                        </span>
                        {onBatchApplyDailyBlocks && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSyncDayToDailyBlocks(d.index, d.dateStr);
                            }}
                            className="p-1 rounded-lg text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-all"
                            title={isAr ? `مزامنة فترات ${d.name} (${d.dateStr}) مع Daily Blocks` : `Sync ${d.name} to Daily Blocks`}
                          >
                            <Layers size={13} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayIndex(d.index);
                            resetForm();
                            setShowAddModal(true);
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-all"
                          title={isAr ? `إضافة فترة ليوم ${d.name}` : `Add block to ${d.name}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Slot Cards List */}
                    <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[500px] custom-scrollbar">
                      {daySlots.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-center p-3 text-neutral-400">
                          <p className="text-[11px] font-medium">{isAr ? 'فارغ' : 'Open'}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDayIndex(d.index);
                              resetForm();
                              setShowAddModal(true);
                            }}
                            className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                          >
                            + {isAr ? 'إضافة فترة' : 'Schedule'}
                          </button>
                        </div>
                      ) : (
                        daySlots.map((slot) => {
                          const badge = getTypeBadge(slot.type);
                          const isDayException = !!slot.date;
                          const linkedProj = projects.find((p) => p.id === slot.linkedProjectId);
                          const linkedGl = goals.find((g) => g.id === slot.linkedGoalId);
                          const checklistDone = (slot.nestedChecklist || []).filter((i) => i.completed).length;
                          const checklistTotal = (slot.nestedChecklist || []).length;

                          // Color border strip based on type
                          const borderStripColor =
                            slot.type === 'deep-work'
                              ? 'border-l-emerald-500'
                              : slot.type === 'workout'
                              ? 'border-l-amber-500'
                              : slot.type === 'meeting'
                              ? 'border-l-purple-500'
                              : slot.type === 'personal'
                              ? 'border-l-blue-500'
                              : 'border-l-neutral-400';

                          return (
                            <div
                              key={slot.id || `${slot.title}-${slot.startTime}`}
                              onClick={() => setViewingSlot(slot)}
                              className={`p-2.5 rounded-2xl border border-l-4 ${borderStripColor} text-xs transition-all relative group cursor-pointer ${
                                slot.completed
                                  ? 'bg-neutral-100/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 opacity-60'
                                  : 'bg-white dark:bg-[#1A1D24] border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/40 shadow-3xs'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {/* Fast Checkbox */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSlot(slot);
                                  }}
                                  className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                    slot.completed
                                      ? 'bg-emerald-500 text-white'
                                      : 'border border-neutral-300 dark:border-neutral-600 hover:border-emerald-500'
                                  }`}
                                >
                                  {slot.completed && <Check size={10} />}
                                </button>

                                <div className="flex-1 min-w-0 space-y-1">
                                  {/* Time and Badges */}
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[10px] text-neutral-500 flex items-center gap-1">
                                      <Clock size={10} />
                                      {slot.timeSlot || `${slot.startTime} - ${slot.endTime}`}
                                    </span>

                                    {isDayException && (
                                      <span
                                        className="text-[8px] font-bold px-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                        title={isAr ? 'تعديل استثنائي لهذا اليوم فقط' : 'Single day exception'}
                                      >
                                        {isAr ? 'استثناء' : '1-day'}
                                      </span>
                                    )}
                                  </div>

                                  <p className={`font-bold leading-snug break-words ${slot.completed ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                                    {slot.icon && <span className="mr-1">{slot.icon}</span>}
                                    {slot.title}
                                  </p>

                                  {/* Compact Mode: Micro-chips row */}
                                  {boardDensity === 'compact' ? (
                                    <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                                      {linkedProj && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 truncate max-w-[90px]" title={linkedProj.title}>
                                          📁 {linkedProj.title}
                                        </span>
                                      )}
                                      {linkedGl && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 truncate max-w-[90px]" title={linkedGl.title}>
                                          🎯 {linkedGl.title}
                                        </span>
                                      )}
                                      {checklistTotal > 0 && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                          ✓ {checklistDone}/{checklistTotal}
                                        </span>
                                      )}
                                      {slot.linkedHabitIds && slot.linkedHabitIds.length > 0 && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                          🔥 {slot.linkedHabitIds.length}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    /* Detailed Mode: Expanded Items directly inside card */
                                    <div className="space-y-1.5 pt-1">
                                      {/* Tags */}
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${badge.bg}`}>
                                          {badge.label}
                                        </span>
                                        {linkedProj && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 truncate max-w-[100px]">
                                            📁 {linkedProj.title}
                                          </span>
                                        )}
                                        {linkedGl && (
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 truncate max-w-[100px]">
                                            🎯 {linkedGl.title}
                                          </span>
                                        )}
                                      </div>

                                      {/* Direct Tasks inside Slot */}
                                      {slot.linkedTaskIds && slot.linkedTaskIds.length > 0 && (
                                        <div className="space-y-1 pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                                          {slot.linkedTaskIds.map((taskId) => {
                                            const t = tasks.find((tk) => tk.id === taskId);
                                            if (!t) return null;
                                            return (
                                              <div
                                                key={taskId}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (onToggleTask) onToggleTask(t.id!, !t.completed);
                                                }}
                                                className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border text-[9px] cursor-pointer transition-all ${
                                                  t.completed
                                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 line-through border-neutral-200 dark:border-neutral-700'
                                                    : 'bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400'
                                                }`}
                                              >
                                                <span className={`w-2.5 h-2.5 rounded flex items-center justify-center border text-[7px] ${t.completed ? 'bg-emerald-500 text-white border-emerald-600' : 'border-neutral-400'}`}>
                                                  {t.completed && '✓'}
                                                </span>
                                                <span className="truncate">{t.title}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Direct Habits inside Slot */}
                                      {slot.linkedHabitIds && slot.linkedHabitIds.length > 0 && (
                                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                                          {slot.linkedHabitIds.map((habitId) => {
                                            const h = habits.find((hb) => hb.id === habitId);
                                            if (!h) return null;
                                            const isDone = h.history && h.history[d.dateStr];
                                            return (
                                              <div
                                                key={habitId}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (onToggleHabit) onToggleHabit(h.id!, d.dateStr);
                                                }}
                                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] cursor-pointer transition-all ${
                                                  isDone
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                                    : 'bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:border-amber-400'
                                                }`}
                                              >
                                                <span>{h.icon || '🔥'}</span>
                                                <span className="truncate max-w-[80px]">{h.title}</span>
                                                <span className={`font-bold ${isDone ? 'text-emerald-600' : 'text-neutral-400'}`}>
                                                  {isDone ? '✓' : '○'}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Nested Checklist inside Slot */}
                                      {slot.nestedChecklist && slot.nestedChecklist.length > 0 && (
                                        <div className="space-y-0.5 pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                                          {slot.nestedChecklist.map((item) => (
                                            <div
                                              key={item.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleSlotChecklistItem(slot, item.id);
                                              }}
                                              className="flex items-center gap-1 text-[9px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                                            >
                                              <span className={`w-2.5 h-2.5 rounded flex items-center justify-center border text-[7px] ${item.completed ? 'bg-emerald-500 text-white border-emerald-600' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                                {item.completed && '✓'}
                                              </span>
                                              <span className={item.completed ? 'line-through text-neutral-400' : ''}>{item.text}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Card Hover Actions */}
                              <div className="mt-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEdit(slot);
                                    }}
                                    className="p-1 rounded text-neutral-400 hover:text-emerald-500 cursor-pointer"
                                    title={isAr ? 'تعديل' : 'Edit'}
                                  >
                                    <Edit3 size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyToAllWeekdays(slot);
                                    }}
                                    className="p-1 rounded text-neutral-400 hover:text-blue-500 cursor-pointer"
                                    title={isAr ? 'تكرار لكل أيام العمل (اثنين-جمعة)' : 'Copy to Mon-Fri'}
                                  >
                                    <Copy size={11} />
                                  </button>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlanToDelete(slot);
                                  }}
                                  className="p-1 rounded text-neutral-400 hover:text-rose-500 cursor-pointer"
                                  title={isAr ? 'حذف' : 'Delete'}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Quick Bottom "+ Add" in column */}
                    <div className="p-2 border-t border-neutral-200 dark:border-neutral-800/80">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayIndex(d.index);
                          resetForm();
                          setShowAddModal(true);
                        }}
                        className="w-full py-1.5 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <Plus size={12} />
                        <span>{isAr ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          VIEW 2: DAILY BLOCKS FOCUS VIEW (Integrated with DailyBlocks)
          ---------------------------------------------------- */}
      {activeView === 'daily' && (
        <div className="bg-white dark:bg-[#16181D] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
          {/* Day Header & Navigator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono text-neutral-500 tracking-wider">
                  {isAr ? 'تركيز اليوم المختار:' : 'Selected Day Timeline:'}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {weekInfo.days[selectedDayIndex]?.name} ({selectedDateStr})
                </span>
              </div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-1">
                {isAr ? `جدول الفترات الميدانية ليوم ${weekInfo.days[selectedDayIndex]?.name}` : `Field Schedule & Blocks for ${weekInfo.days[selectedDayIndex]?.name}`}
              </h2>
            </div>

            {/* Quick 7-Day Picker */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {weekInfo.days.map((d) => (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDayIndex(d.index)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedDayIndex === d.index
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {d.short} {d.dayNum}
                </button>
              ))}
            </div>
          </div>

          {/* Day Blocks Timeline List */}
          <div className="space-y-3">
            {currentDaySlots.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Clock size={36} className="mx-auto text-neutral-300 dark:text-neutral-700" />
                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? `لا توجد فترات مجدولة ليوم ${weekInfo.days[selectedDayIndex]?.name}` : `No blocks scheduled for ${weekInfo.days[selectedDayIndex]?.name}`}
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-all"
                >
                  + {isAr ? 'إضافة أول فترة لهذا اليوم' : 'Add First Block for Today'}
                </button>
              </div>
            ) : (
              currentDaySlots.map((slot, index) => {
                const badge = getTypeBadge(slot.type);

                return (
                  <div
                    key={slot.id || index}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      slot.completed
                        ? 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60'
                        : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleSlot(slot)}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                          slot.completed
                            ? 'bg-emerald-500 text-white'
                            : 'border border-neutral-300 dark:border-neutral-600 hover:border-emerald-500'
                        }`}
                      >
                        {slot.completed && <Check size={12} />}
                      </button>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neutral-500">
                            {slot.timeSlot || `${slot.startTime} - ${slot.endTime}`}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          {slot.date && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                              {isAr ? 'هذا اليوم فقط' : 'Day Only'}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-sm font-bold ${slot.completed ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                          {slot.title}
                        </h4>

                        {slot.notes && (
                          <p className="text-xs text-neutral-500 leading-relaxed">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {onNavigateModule && (
                        <button
                          onClick={() => onNavigateModule('focus')}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold cursor-pointer transition-all"
                          title={isAr ? 'بدء مؤقت التركيز لهذه الفترة' : 'Start Focus Timer'}
                        >
                          ⚡ {isAr ? 'تركيز' : 'Focus'}
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(slot)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                        title={isAr ? 'تعديل' : 'Edit'}
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => setPlanToDelete(slot)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 cursor-pointer"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          VIEW 3: MONTHLY BIRD'S-EYE MACRO OVERVIEW
          ---------------------------------------------------- */}
      {activeView === 'monthly' && (
        <div className="bg-white dark:bg-[#16181D] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                {isAr ? 'التخطيط الاستراتيجي الشهري' : 'Strategic Monthly Architecture'}
              </span>
              <h2 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">
                {isAr ? `خارطة طريق شهر ${weekInfo.monday.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' })}` : `Roadmap for ${weekInfo.monday.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
              </h2>
            </div>

            {/* Monthly Theme Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentMonthThemeInput}
                onChange={(e) => setCurrentMonthThemeInput(e.target.value)}
                onBlur={() => {
                  try {
                    const next = { ...monthlyThemes, [currentMonthKey]: currentMonthThemeInput };
                    setMonthlyThemes(next);
                    localStorage.setItem('planner_monthly_themes_v1', JSON.stringify(next));
                  } catch {}
                }}
                placeholder={isAr ? 'شعار / هدف الشهر الأساسي...' : 'Monthly core theme / slogan...'}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white w-64"
              />
            </div>
          </div>

          {/* 4-Week Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((wIndex) => {
              const isThisWeek = Math.abs(weekOffset) === 0 && wIndex === 2; // sample relative indicator

              return (
                <div
                  key={wIndex}
                  className={`p-4 rounded-2xl border space-y-3 transition-all ${
                    isThisWeek
                      ? 'bg-emerald-500/5 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-neutral-900 dark:text-white">
                      {isAr ? `الأسبوع ${wIndex}` : `Week ${wIndex}`}
                    </span>
                    {isThisWeek && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                        {isAr ? 'النشط حالياً' : 'Current'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {wIndex === 1 && (isAr ? 'التأسيس، ضبط العادات، والبدء بالمشاريع.' : 'Foundation, habit anchors, and project kickoff.')}
                    {wIndex === 2 && (isAr ? 'العمل العميق والتنفيذ المباشر لأعلى الأولويات.' : 'Prime execution sprints & needle movers.')}
                    {wIndex === 3 && (isAr ? 'تسليم المخرجات والتحسين وحل العقبات.' : 'Deliverables shipping & milestone execution.')}
                    {wIndex === 4 && (isAr ? 'المراجعة الكلية، إغلاق الملفات، والاستعداد.' : 'Full monthly review, closing loose ends & rest.')}
                  </p>

                  <button
                    onClick={() => {
                      setWeekOffset(wIndex - 2);
                      setActiveView('weekly');
                    }}
                    className="w-full py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer transition-all text-center block"
                  >
                    {isAr ? 'فتح هذا الأسبوع ←' : 'Open This Week →'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL 1: NOTION NEW WEEK PLANNING WIZARD
          ---------------------------------------------------- */}
      {showNewWeekWizard && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewWeekWizard(false);
          }}
        >
          <div 
            className="bg-white dark:bg-[#16181D] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl p-5 sm:p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                    {isAr ? 'معالج تخطيط الأسبوع الجديد (Notion Template)' : 'New Week Planning Wizard'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr ? 'خطط لأسبوعك مسبقاً بنقرة واحدة وبدون إجهاد' : 'Architect your entire upcoming week with 1 click without stress'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewWeekWizard(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step 1: Week North Star Theme */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Target size={13} className="text-emerald-500" />
                <span>{isAr ? '١. الشعار أو الهدف المركزي لهذا الأسبوع (North Star):' : '1. North Star / Objective for This Week:'}</span>
              </label>
              <input
                type="text"
                value={wizardWeekTheme}
                onChange={(e) => setWizardWeekTheme(e.target.value)}
                placeholder={isAr ? 'مثال: إنهاء واجهة المستخدم وتسليم مشروع العميل...' : 'e.g. Ship Core V1 API & 4 Deep Work Sprints'}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            {/* Step 2: Choose Blueprint Template */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Layers size={13} className="text-emerald-500" />
                <span>{isAr ? '٢. اختر نمط وهيكل الأسبوع المناسب:' : '2. Select Week Blueprint Template:'}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {NOTION_WEEK_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setWizardSelectedTemplateId(tmpl.id)}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                      wizardSelectedTemplateId === tmpl.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg">{tmpl.icon}</span>
                      {tmpl.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          {tmpl.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-extrabold mt-1">{isAr ? tmpl.nameAr : tmpl.nameEn}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                      {isAr ? tmpl.descriptionAr : tmpl.descriptionEn}
                    </p>
                    <span className="text-[9px] font-mono text-neutral-400 mt-2">
                      {tmpl.slots.length} {isAr ? 'فترة مجدولة مسبقاً' : 'pre-configured blocks'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Options (Bridge to Daily Blocks) */}
            <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <input
                  type="checkbox"
                  checked={wizardAutoSyncDailyBlocks}
                  onChange={(e) => setWizardAutoSyncDailyBlocks(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{isAr ? 'مزامنة وتصدير هذا الجدول تلقائياً إلى تطبيق فترات اليوم (Daily Blocks)' : 'Automatically sync schedule into Daily Blocks flow'}</span>
              </label>
              <p className="text-[11px] text-neutral-500">
                {isAr
                  ? 'سيتيح لك ذلك رؤية هذه الفترات في Daily Blocks وتشغيل مؤقت التركيز بنقرة واحدة.'
                  : 'This allows you to see these blocks in Daily Blocks and run Pomodoro timers directly from them.'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowNewWeekWizard(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleApplyWeekBlueprint}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
              >
                {isAr ? '✓ تطبيق الهيكل على الأسبوع بالكامل' : '✓ Apply Blueprint to Entire Week'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL 2: ADD / EDIT TIME BLOCK WITH SCOPE TOGGLE
          (This day only vs Always recurring)
          ---------------------------------------------------- */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              resetForm();
            }
          }}
        >
          <div 
            className="bg-white dark:bg-[#16181D] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[88vh] overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-5 py-4 shrink-0 bg-white dark:bg-[#16181D]">
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                  {editingPlan
                    ? (isAr ? 'تعديل الفترة الزمنية' : 'Edit Time Block')
                    : (isAr ? `إضافة فترة ليوم ${weekInfo.days[selectedDayIndex]?.name}` : `Add Block to ${weekInfo.days[selectedDayIndex]?.name}`)}
                </h3>
                <p className="text-xs text-neutral-500">
                  {weekInfo.days[selectedDayIndex]?.name} • {selectedDateStr}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer transition-colors"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar min-h-0">

            {/* CRUCIAL SCOPE TOGGLE: THIS DAY ONLY VS ALWAYS RECURRING */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sliders size={13} className="text-emerald-500" />
                <span>{isAr ? 'نطاق التطبيق (هل التغيير مؤقت أم دائم؟):' : 'Application Scope (One-off or Permanent?):'}</span>
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFormScope('day_only')}
                  className={`p-2.5 rounded-xl border text-start cursor-pointer transition-all ${
                    formScope === 'day_only'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-200 font-bold'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-extrabold">
                    <span>⚡</span>
                    <span>{isAr ? 'هذا اليوم فقط' : 'This Day Only'}</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {isAr ? 'استثناء لهذا التاريخ دون المساس بالأسابيع الأخرى.' : 'One-off exception without altering recurring template.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormScope('recurring')}
                  className={`p-2.5 rounded-xl border text-start cursor-pointer transition-all ${
                    formScope === 'recurring'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-extrabold">
                    <span>🔄</span>
                    <span>{isAr ? 'دائماً كل أسبوع' : 'Always Every Week'}</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {isAr ? 'يتكرر في كل يوم اثنين/ثلاثاء كنمط رئيسي دائم.' : 'Repeats every week on this day as master rhythm.'}
                  </p>
                </button>
              </div>
            </div>

            {/* Block Title & Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {isAr ? 'عنوان الفترة:' : 'Block Title:'}
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={isAr ? 'مثال: عمل عميق على المشروع، تمرين، قراءة...' : 'e.g. Deep Work Sprint, Workout, Review'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white"
              />

              {/* 1-Tap Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[
                  { label: isAr ? 'عمل عميق' : 'Deep Work', type: 'deep-work', icon: '🎯' },
                  { label: isAr ? 'صباحي' : 'Morning Routine', type: 'general', icon: '🌅' },
                  { label: isAr ? 'تمرين' : 'Workout', type: 'workout', icon: '🏋️' },
                  { label: isAr ? 'إنجاز مهام' : 'Task Batching', type: 'deep-work', icon: '🚀' },
                  { label: isAr ? 'مراجعة' : 'Evening Review', type: 'personal', icon: '🌙' },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setFormTitle(p.label);
                      setFormType(p.type as any);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 transition-all cursor-pointer"
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'وقت البدء:' : 'Start Time:'}
                </label>
                <input
                  type="time"
                  required
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono text-neutral-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'وقت الانتهاء:' : 'End Time:'}
                </label>
                <input
                  type="time"
                  required
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* Block Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {isAr ? 'نوع الفترة:' : 'Block Category:'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'deep-work', labelEn: 'Deep Work', labelAr: 'عمل عميق', icon: '🎯' },
                  { id: 'meeting', labelEn: 'Meeting', labelAr: 'اجتماع', icon: '👥' },
                  { id: 'workout', labelEn: 'Workout', labelAr: 'تمرين', icon: '🏋️' },
                  { id: 'personal', labelEn: 'Personal', labelAr: 'شخصي', icon: '📖' },
                  { id: 'general', labelEn: 'General', labelAr: 'عام', icon: '✨' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormType(cat.id as any)}
                    className={`p-2 rounded-xl border text-xs font-bold text-start flex items-center gap-1.5 cursor-pointer transition-all ${
                      formType === cat.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{isAr ? cat.labelAr : cat.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Project & Goal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <span>📁</span>
                  <span>{isAr ? 'ربط بمشروع:' : 'Link Project:'}</span>
                </label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                >
                  <option value="">{isAr ? 'بدون مشروع' : 'No Project'}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <span>🎯</span>
                  <span>{isAr ? 'ربط بهدف:' : 'Link Goal:'}</span>
                </label>
                <select
                  value={formGoalId}
                  onChange={(e) => setFormGoalId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                >
                  <option value="">{isAr ? 'بدون هدف' : 'No Goal'}</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linked Tasks Selection */}
            {tasks.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>{isAr ? 'المهام المرتبطة بهذه الفترة:' : 'Linked Tasks:'}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {selectedTaskIds.length} {isAr ? 'محددة' : 'selected'}
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 custom-scrollbar">
                  {tasks.slice(0, 20).map((t) => {
                    const isSelected = selectedTaskIds.includes(t.id!);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTaskIds((prev) =>
                            isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id!]
                          );
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500 text-white border-indigo-600'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {t.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Linked Habits Selection */}
            {habits.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>{isAr ? 'العادات المرتبطة بهذه الفترة:' : 'Linked Habits:'}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {selectedHabitIds.length} {isAr ? 'محددة' : 'selected'}
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 custom-scrollbar">
                  {habits.map((h) => {
                    const isSelected = selectedHabitIds.includes(h.id!);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setSelectedHabitIds((prev) =>
                            isSelected ? prev.filter((id) => id !== h.id) : [...prev, h.id!]
                          );
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <span>{h.icon || '🔥'}</span>
                        <span>{h.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-steps Checklist ("حاجة وسط حاجة") */}
            <div className="space-y-2 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ListChecks size={13} className="text-emerald-500" />
                  <span>{isAr ? 'قائمة خطوات فرعية داخل الفترة (Micro-checklist):' : 'Sub-steps Checklist inside Block:'}</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {formChecklist.length} {isAr ? 'خطوات' : 'steps'}
                </span>
              </label>

              {/* Add Sub-step input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newChecklistText.trim()) {
                        setFormChecklist((prev) => [
                          ...prev,
                          { id: `step-${Date.now()}`, text: newChecklistText.trim(), completed: false },
                        ]);
                        setNewChecklistText('');
                      }
                    }
                  }}
                  placeholder={isAr ? 'أضف خطوة فرعية (مثلاً: إعداد الكود، كتابة التقرير...)' : 'Add sub-step item and press enter...'}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newChecklistText.trim()) {
                      setFormChecklist((prev) => [
                        ...prev,
                        { id: `step-${Date.now()}`, text: newChecklistText.trim(), completed: false },
                      ]);
                      setNewChecklistText('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer"
                >
                  + {isAr ? 'إضافة' : 'Add'}
                </button>
              </div>

              {/* Listed Sub-steps */}
              {formChecklist.length > 0 && (
                <div className="space-y-1 pt-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {formChecklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => {
                            setFormChecklist((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s))
                            );
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className={`truncate ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormChecklist((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-neutral-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>

            {/* Actions Sticky Footer: ALWAYS VISIBLE */}
            <div className="px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-50/95 dark:bg-neutral-900/95 backdrop-blur-xs flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isAr ? 'حفظ وتطبيق الفترة' : 'Save & Apply Block'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* ----------------------------------------------------
          MODAL 3: CONFIRM DELETE SLOT
          ---------------------------------------------------- */}
      {planToDelete && (
        <ConfirmModal
          isOpen={!!planToDelete}
          title={isAr ? 'تأكيد حذف الفترة المجدولة' : 'Confirm Delete Block'}
          message={
            isAr
              ? `هل تريد حذف فترة "${planToDelete.title}"؟`
              : `Are you sure you want to delete "${planToDelete.title}"?`
          }
          onConfirm={async () => {
            if (planToDelete.id) {
              await onDeletePlan(planToDelete.id);
            }
            setPlanToDelete(null);
          }}
          onCancel={() => setPlanToDelete(null)}
          lang={lang}
        />
      )}

      {/* ----------------------------------------------------
          MODAL 4: SET / EDIT TOP 3 WEEKLY GOALS
          ---------------------------------------------------- */}
      {showWeeklyGoalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className={`bg-white dark:bg-[#16181D] rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh] ${isAr ? 'text-right' : ''}`}>
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-amber-500" />
                <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                  {isAr ? 'تحديد الأهداف الثلاثة الأساسية للأسبوع' : 'Set Top 3 Weekly Core Goals'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {currentWeekId}
                </span>
              </div>
              <button
                onClick={() => setShowWeeklyGoalsModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWeeklyGoals} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Goal #1 Primary */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <span>🥇</span>
                    <span>{isAr ? 'الهدف #1 الرئيسي (الأولوية القصوى)' : 'Goal #1 Primary Focus'}</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 px-2 py-0.5 rounded">Core</span>
                </div>
                <input
                  type="text"
                  placeholder={isAr ? 'عنوان الهدف الرئيسي الأول لهذا الأسبوع...' : 'Primary goal title...'}
                  value={goal1Title}
                  onChange={(e) => setGoal1Title(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs font-bold text-neutral-900 dark:text-white focus:outline-amber-500"
                />
                <input
                  type="text"
                  placeholder={isAr ? 'تفاصيل أو النتيجة الملموسة المتوقعة...' : 'Description or expected tangible outcome...'}
                  value={goal1Desc}
                  onChange={(e) => setGoal1Desc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={goal1LongTermId}
                    onChange={(e) => setGoal1LongTermId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-[11px] text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="">{isAr ? '🎯 ربط بهدف طويل المدى (اختياري)' : '🎯 Link Long-Term Goal'}</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>

                  <select
                    value={goal1ProjectId}
                    onChange={(e) => setGoal1ProjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-[11px] text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="">{isAr ? '📁 ربط بمشروع (اختياري)' : '📁 Link Project'}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Goal #2 Secondary */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-neutral-800 dark:text-neutral-200">
                  <span className="flex items-center gap-1.5">
                    <span>🥈</span>
                    <span>{isAr ? 'الهدف #2 الثانوي' : 'Goal #2 Secondary Focus'}</span>
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={isAr ? 'عنوان الهدف الثانوي الثاني...' : 'Secondary goal title...'}
                  value={goal2Title}
                  onChange={(e) => setGoal2Title(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs font-bold text-neutral-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={isAr ? 'تفاصيل الهدف الثاني...' : 'Description or expected outcome...'}
                  value={goal2Desc}
                  onChange={(e) => setGoal2Desc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={goal2LongTermId}
                    onChange={(e) => setGoal2LongTermId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-[11px] text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="">{isAr ? '🎯 ربط بهدف طويل المدى' : '🎯 Link Long-Term Goal'}</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>

                  <select
                    value={goal2ProjectId}
                    onChange={(e) => setGoal2ProjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-[11px] text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="">{isAr ? '📁 ربط بمشروع' : '📁 Link Project'}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Goal #3 Tertiary */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-neutral-800 dark:text-neutral-200">
                  <span className="flex items-center gap-1.5">
                    <span>🥉</span>
                    <span>{isAr ? 'الهدف #3 التكميلي' : 'Goal #3 Tertiary Focus'}</span>
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={isAr ? 'عنوان الهدف الثالث التكميلي...' : 'Tertiary goal title...'}
                  value={goal3Title}
                  onChange={(e) => setGoal3Title(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs font-bold text-neutral-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={isAr ? 'تفاصيل الهدف الثالث...' : 'Description or expected outcome...'}
                  value={goal3Desc}
                  onChange={(e) => setGoal3Desc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={goal3LongTermId}
                    onChange={(e) => setGoal3LongTermId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-[11px] text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="">{isAr ? '🎯 ربط بهدف طويل المدى' : '🎯 Link Long-Term Goal'}</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>

                  <select
                    value={goal3ProjectId}
                    onChange={(e) => setGoal3ProjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-[11px] text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="">{isAr ? '📁 ربط بمشروع' : '📁 Link Project'}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowWeeklyGoalsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
                >
                  {isAr ? 'حفظ أهداف الأسبوع' : 'Save Weekly Goals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL 5: END OF WEEK REVIEW & ROLLOVER (نهاية الأسبوع: مراجعة وترحيل)
          ---------------------------------------------------- */}
      {showRolloverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className={`bg-white dark:bg-[#16181D] rounded-3xl max-w-2xl w-full my-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh] ${isAr ? 'text-right' : ''}`}>
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    {isAr ? 'مراجعة وترحيل أهداف نهاية الأسبوع' : 'End of Week Review & Rollover'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr
                      ? `تقييم إنجاز أسبوع (${currentWeekId}) وتحديد ما يرحل للأسبوع القادم (${nextWeekId}) أو يلغى.`
                      : `Evaluate (${currentWeekId}) and decide what rolls over to next week (${nextWeekId}) or closes.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRolloverModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {thisWeekGoals.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  {isAr ? 'لا توجد أهداف مسجلة لهذا الأسبوع لمراجعتها.' : 'No weekly goals found to review for this week.'}
                </div>
              ) : (
                thisWeekGoals.map((g) => {
                  const decision = rolloverDecisions[g.id!] || {
                    action: g.progressPercent >= 100 ? 'complete' : 'rollover',
                    notes: g.outcomeNotes || '',
                    newProgress: g.progressPercent,
                  };

                  return (
                    <div
                      key={g.id}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{g.rank === 1 ? '🥇' : g.rank === 2 ? '🥈' : '🥉'}</span>
                          <h4 className="text-xs font-black text-neutral-900 dark:text-white">
                            {g.title}
                          </h4>
                        </div>
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                          {decision.newProgress}%
                        </span>
                      </div>

                      {/* Percentage slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-bold">
                          <span>{isAr ? 'النسبة المحققة فعلياً:' : 'Achieved Percentage:'}</span>
                          <span className="font-mono">{decision.newProgress}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={decision.newProgress}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setRolloverDecisions((prev) => ({
                              ...prev,
                              [g.id!]: {
                                ...decision,
                                newProgress: val,
                                action: val >= 100 ? 'complete' : decision.action === 'complete' ? 'rollover' : decision.action,
                              },
                            }));
                          }}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>

                      {/* Action selector */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                          {isAr ? 'القرار بخصوص هذا الهدف:' : 'Action Decision:'}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setRolloverDecisions((prev) => ({
                                ...prev,
                                [g.id!]: { ...decision, action: 'rollover' },
                              }))
                            }
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              decision.action === 'rollover'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white dark:bg-[#1A1D24] border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            <ArrowRight size={12} />
                            <span>{isAr ? 'ترحيل للأسبوع القادم' : 'Roll Over'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setRolloverDecisions((prev) => ({
                                ...prev,
                                [g.id!]: { ...decision, action: 'complete', newProgress: 100 },
                              }))
                            }
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              decision.action === 'complete'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                : 'bg-white dark:bg-[#1A1D24] border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            <Check size={12} />
                            <span>{isAr ? 'اعتباره مكتملاً (100%)' : 'Completed'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setRolloverDecisions((prev) => ({
                                ...prev,
                                [g.id!]: { ...decision, action: 'cancel' },
                              }))
                            }
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              decision.action === 'cancel'
                                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                                : 'bg-white dark:bg-[#1A1D24] border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            <X size={12} />
                            <span>{isAr ? 'إلغاء أو أرشفة' : 'Cancel / Close'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Reflection notes */}
                      <input
                        type="text"
                        placeholder={isAr ? 'ملاحظة أو سبب ما تبقى (اختياري)...' : 'Reflection note on outcome...'}
                        value={decision.notes}
                        onChange={(e) =>
                          setRolloverDecisions((prev) => ({
                            ...prev,
                            [g.id!]: { ...decision, notes: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white"
                      />
                    </div>
                  );
                })
              )}

              {/* Informative helper box */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                <p className="font-bold">
                  {isAr ? '💡 كيف يعمل الترحيل الذكي:' : '💡 How Smart Rollover Works:'}
                </p>
                <p className="text-[11px] opacity-90">
                  {isAr
                    ? `سيتم حفظ النتيجة المسجلة لأسبوع (${currentWeekId})، وأي هدف اخترت له "ترحيل" سيتم إنشاء نسخة منه تلقائياً في الأسبوع القادم (${nextWeekId}) مع الحفاظ على الروابط والملاحظات.`
                    : `Your review for (${currentWeekId}) will be finalized, and any goal marked "Roll Over" will automatically be scheduled in (${nextWeekId}).`}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2 bg-neutral-50/50 dark:bg-neutral-900/50">
              <button
                type="button"
                onClick={() => setShowRolloverModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteRollover}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>{isAr ? 'تأكيد الترحيل وإغلاق الأسبوع' : 'Confirm & Roll Over'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL 6: QUICK INSPECTION DRAWER / MODAL FOR A SLOT
          ---------------------------------------------------- */}
      {viewingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className={`bg-white dark:bg-[#16181D] rounded-3xl max-w-lg w-full my-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh] ${isAr ? 'text-right' : ''}`}>
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{viewingSlot.icon || '🎯'}</span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                    {viewingSlot.title}
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono flex items-center gap-1">
                    <Clock size={11} />
                    <span>{viewingSlot.timeSlot || `${viewingSlot.startTime} - ${viewingSlot.endTime}`}</span>
                    {viewingSlot.date && (
                      <span className="text-amber-600 font-bold ml-1">({isAr ? 'استثناء ليوم' : '1-day'})</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingSlot(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Connected Badges */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {projects.find((p) => p.id === viewingSlot.linkedProjectId) && (
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                    📁 {projects.find((p) => p.id === viewingSlot.linkedProjectId)?.title}
                  </span>
                )}
                {goals.find((g) => g.id === viewingSlot.linkedGoalId) && (
                  <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold">
                    🎯 {goals.find((g) => g.id === viewingSlot.linkedGoalId)?.title}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                  ⚡ {viewingSlot.energyRequired || 'medium'}
                </span>
              </div>

              {/* Notes */}
              {viewingSlot.notes && (
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
                  <p className="font-bold text-neutral-500 mb-0.5">{isAr ? 'ملاحظات:' : 'Notes:'}</p>
                  <p>{viewingSlot.notes}</p>
                </div>
              )}

              {/* Interactive Checklist ("حاجة وسط حاجة") */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  <span className="flex items-center gap-1.5">
                    <ListChecks size={14} className="text-emerald-500" />
                    <span>{isAr ? 'خطوات ومحطات وسط هذه الفترة' : 'Sub-steps Checklist'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {(viewingSlot.nestedChecklist || []).filter((i) => i.completed).length}/{(viewingSlot.nestedChecklist || []).length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(viewingSlot.nestedChecklist || []).length === 0 ? (
                    <p className="text-[11px] text-neutral-400 italic">{isAr ? 'لا توجد خطوات فرعية بعد.' : 'No sub-steps yet.'}</p>
                  ) : (
                    (viewingSlot.nestedChecklist || []).map((item) => (
                      <div
                        key={item.id}
                        onClick={async () => {
                          await handleToggleSlotChecklistItem(viewingSlot, item.id);
                          setViewingSlot((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  nestedChecklist: (prev.nestedChecklist || []).map((i) =>
                                    i.id === item.id ? { ...i, completed: !i.completed } : i
                                  ),
                                }
                              : null
                          );
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 cursor-pointer text-xs"
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center border ${item.completed ? 'bg-emerald-500 text-white border-emerald-600' : 'border-neutral-300 dark:border-neutral-600'}`}>
                          {item.completed && <Check size={10} />}
                        </span>
                        <span className={`flex-1 ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100 font-semibold'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Linked Tasks */}
              {viewingSlot.linkedTaskIds && viewingSlot.linkedTaskIds.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-neutral-500">{isAr ? 'المهام المرتبطة:' : 'Linked Tasks:'}</p>
                  <div className="space-y-1">
                    {viewingSlot.linkedTaskIds.map((taskId) => {
                      const t = tasks.find((tk) => tk.id === taskId);
                      if (!t) return null;
                      return (
                        <div
                          key={taskId}
                          onClick={() => onToggleTask && onToggleTask(t.id!, !t.completed)}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 text-xs cursor-pointer"
                        >
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${t.completed ? 'bg-emerald-500 text-white' : 'border-neutral-400'}`}>
                            {t.completed && <Check size={8} />}
                          </span>
                          <span className={t.completed ? 'line-through text-neutral-400' : 'font-semibold'}>{t.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with quick action buttons */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const slot = viewingSlot;
                    setViewingSlot(null);
                    handleOpenEdit(slot);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>{isAr ? 'تعديل الفترة' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const slot = viewingSlot;
                    setViewingSlot(null);
                    setPlanToDelete(slot);
                  }}
                  className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingSlot(null)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
