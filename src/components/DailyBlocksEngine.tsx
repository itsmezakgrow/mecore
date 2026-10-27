import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  Plus,
  Play,
  CheckCircle2,
  Flame,
  Zap,
  Coffee,
  Dumbbell,
  Moon,
  Sun,
  Briefcase,
  Brain,
  ListChecks,
  RotateCcw,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Layers,
  Award,
  Activity,
  Check,
  Timer,
  Info,
  CalendarDays,
  Target,
  X,
  Compass,
  Archive
} from 'lucide-react';
import {
  DailyBlockItem,
  DailyBlockType,
  DailyBlockStatus,
  DailyBlockEnergy,
  DailyBlockArchetype,
  TaskItem,
  HabitItem,
  ModuleType,
  WeeklyPlanSlot,
  ProjectItem,
  GoalItem,
  NestedChecklistItem
} from '../types';
import { playCelebrationChime, playTaskCompleteSound } from '../utils/focusAudio';

interface DailyBlocksEngineProps {
  blocks: DailyBlockItem[];
  tasks: TaskItem[];
  habits: HabitItem[];
  plans?: WeeklyPlanSlot[];
  projects?: ProjectItem[];
  goals?: GoalItem[];
  onAddBlock: (block: Omit<DailyBlockItem, 'id'>) => Promise<any>;
  onUpdateBlock: (id: string, updates: Partial<DailyBlockItem>) => Promise<any>;
  onDeleteBlock: (id: string) => Promise<any>;
  onBatchApplyBlocks: (blocks: Omit<DailyBlockItem, 'id'>[]) => Promise<any>;
  onClearDateBlocks: (dateStr: string) => Promise<any>;
  onToggleTask?: (id: string, completed: boolean) => Promise<any> | void;
  onToggleHabit?: (habitId: string, dateStr: string) => Promise<any> | void;
  onAddWeeklyPlanSlot?: (slot: Omit<WeeklyPlanSlot, 'id'>) => Promise<any>;
  onNavigateModule: (module: ModuleType) => void;
  lang?: 'en' | 'ar';
  isDark?: boolean;
}

// ----------------------------------------------------
// CURATED ZERO-STRESS DAY ARCHETYPES (1-Click Blueprints)
// ----------------------------------------------------
export const DAY_ARCHETYPES: DailyBlockArchetype[] = [
  {
    id: 'deep-work',
    nameEn: 'Deep Work & High Leverage',
    nameAr: 'التركيز العميق والإنجاز العالي',
    descriptionEn: 'Structured for peak cognitive performance with two deep sprints and dedicated recharge.',
    descriptionAr: 'مصمم لتحقيق أعلى أداء ذهني مع فترتي تركيز عميق وفترة استعادة طاقة.',
    icon: '⚡',
    badge: 'Executive',
    blocks: [
      {
        title: 'Morning Ignition & Routine',
        subtitle: 'Habits, hydration, light, mindset and day prioritization',
        startTime: '07:30',
        endTime: '09:00',
        blockType: 'morning',
        energyRequired: 'medium',
        color: 'amber',
        icon: '🌅',
        targetFocusMinutes: 30,
        order: 1
      },
      {
        title: 'Deep Work Sprint 1 (Prime Cognitive)',
        subtitle: 'Most critical needle-mover task, zero distraction flow',
        startTime: '09:00',
        endTime: '12:00',
        blockType: 'deep-work',
        energyRequired: 'high',
        color: 'emerald',
        icon: '🎯',
        targetFocusMinutes: 150,
        order: 2
      },
      {
        title: 'Nutrition & Mind Reset',
        subtitle: 'Healthy lunch, outdoor walk, decompress eyes and mind',
        startTime: '12:00',
        endTime: '13:30',
        blockType: 'recharge',
        energyRequired: 'low',
        color: 'cyan',
        icon: '🥗',
        targetFocusMinutes: 0,
        order: 3
      },
      {
        title: 'Execution Sprint 2 & Deliverables',
        subtitle: 'Secondary priorities, task batching, core deliveries',
        startTime: '13:30',
        endTime: '16:30',
        blockType: 'execution',
        energyRequired: 'high',
        color: 'indigo',
        icon: '🚀',
        targetFocusMinutes: 120,
        order: 4
      },
      {
        title: 'Physical Training & Energy Recharge',
        subtitle: 'Calisthenics workout, movement, sauna or stretching',
        startTime: '17:00',
        endTime: '18:30',
        blockType: 'fitness',
        energyRequired: 'high',
        color: 'rose',
        icon: '🏋️',
        targetFocusMinutes: 45,
        order: 5
      },
      {
        title: 'Evening Wind-Down & Audit',
        subtitle: 'Daily review, reading, dinner, prepare tomorrow',
        startTime: '19:30',
        endTime: '21:30',
        blockType: 'evening',
        energyRequired: 'low',
        color: 'purple',
        icon: '🌙',
        targetFocusMinutes: 20,
        order: 6
      }
    ]
  },
  {
    id: 'balanced-executive',
    nameEn: 'Balanced Executive Day',
    nameAr: 'اليوم التنفيذي المتوازن',
    descriptionEn: 'Harmonious rhythm between strategic focus, communications, and wellbeing.',
    descriptionAr: 'توازن دقيق بين التركيز الاستراتيجي، التواصل مع الفريق، والراحة النفسية.',
    icon: '⚖️',
    badge: 'Popular',
    blocks: [
      {
        title: 'Morning Clarity & Priming',
        subtitle: 'Journaling, breathwork, nutrition and habit checks',
        startTime: '08:00',
        endTime: '09:15',
        blockType: 'morning',
        energyRequired: 'medium',
        color: 'amber',
        icon: '☀️',
        targetFocusMinutes: 30,
        order: 1
      },
      {
        title: 'Strategic Focus & Core Projects',
        subtitle: 'High-impact project execution without interruption',
        startTime: '09:30',
        endTime: '12:00',
        blockType: 'deep-work',
        energyRequired: 'high',
        color: 'emerald',
        icon: '🧠',
        targetFocusMinutes: 120,
        order: 2
      },
      {
        title: 'Lunch & Cognitive Reset',
        subtitle: 'Nourishment, fresh air, offline break',
        startTime: '12:00',
        endTime: '13:15',
        blockType: 'recharge',
        energyRequired: 'low',
        color: 'cyan',
        icon: '☕',
        targetFocusMinutes: 0,
        order: 3
      },
      {
        title: 'Admin, Communications & Tasks',
        subtitle: 'Emails, updates, meetings and closing action items',
        startTime: '13:30',
        endTime: '16:00',
        blockType: 'execution',
        energyRequired: 'medium',
        color: 'indigo',
        icon: '💼',
        targetFocusMinutes: 90,
        order: 4
      },
      {
        title: 'Movement & Outdoor Activity',
        subtitle: 'Strength or mobility workout and fresh air',
        startTime: '16:30',
        endTime: '17:45',
        blockType: 'fitness',
        energyRequired: 'high',
        color: 'rose',
        icon: '⚡',
        targetFocusMinutes: 30,
        order: 5
      },
      {
        title: 'Personal Flow & Reflection',
        subtitle: 'Family, leisure, day review and sleep hygiene',
        startTime: '18:30',
        endTime: '21:30',
        blockType: 'evening',
        energyRequired: 'low',
        color: 'purple',
        icon: '🕯️',
        targetFocusMinutes: 15,
        order: 6
      }
    ]
  },
  {
    id: 'creative-flow',
    nameEn: 'Creative Sprint & Synthesis',
    nameAr: 'الإبداع والتصميم المكثف',
    descriptionEn: 'Extended uninterrupted creative zone for writing, coding, or designing.',
    descriptionAr: 'مساحة إبداعية طويلة غير منقطعة للتصميم، البرمجة أو الكتابة.',
    icon: '🎨',
    badge: 'Flow State',
    blocks: [
      {
        title: 'Morning Inspiration & Setup',
        subtitle: 'Coffee, inspiring literature, workspace readiness',
        startTime: '08:30',
        endTime: '09:30',
        blockType: 'morning',
        energyRequired: 'medium',
        color: 'amber',
        icon: '☕',
        targetFocusMinutes: 20,
        order: 1
      },
      {
        title: 'Extended Creative Flow Zone',
        subtitle: 'Pure immersive building and creative development',
        startTime: '09:30',
        endTime: '13:30',
        blockType: 'deep-work',
        energyRequired: 'high',
        color: 'emerald',
        icon: '✨',
        targetFocusMinutes: 180,
        order: 2
      },
      {
        title: 'Decompression Walk & Nourishment',
        subtitle: 'Long walk in nature, unplug from screens',
        startTime: '13:30',
        endTime: '15:00',
        blockType: 'recharge',
        energyRequired: 'low',
        color: 'cyan',
        icon: '🌿',
        targetFocusMinutes: 0,
        order: 3
      },
      {
        title: 'Refinement & Feedback Wrap-up',
        subtitle: 'Polish drafts, test prototypes, organize notes',
        startTime: '15:30',
        endTime: '17:30',
        blockType: 'execution',
        energyRequired: 'medium',
        color: 'indigo',
        icon: '📝',
        targetFocusMinutes: 60,
        order: 4
      },
      {
        title: 'Evening Peace & Free Exploration',
        subtitle: 'Music, personal hobbies, unwinding',
        startTime: '18:30',
        endTime: '21:30',
        blockType: 'evening',
        energyRequired: 'low',
        color: 'purple',
        icon: '🌌',
        targetFocusMinutes: 10,
        order: 5
      }
    ]
  },
  {
    id: 'recovery-reset',
    nameEn: 'Active Recovery & Low Pressure',
    nameAr: 'التعافي النشط والهدوء',
    descriptionEn: 'Gentle cadence designed to prevent burnout, restore energy, and clear mental debt.',
    descriptionAr: 'إيقاع هادئ لاستعادة الطاقة وتجنب الإجهاد وتصفية الذهن.',
    icon: '🌿',
    badge: 'Recharge',
    blocks: [
      {
        title: 'Slow Morning & Nourishment',
        subtitle: 'No alarms rush, gentle stretching, warm tea',
        startTime: '09:00',
        endTime: '10:30',
        blockType: 'morning',
        energyRequired: 'low',
        color: 'amber',
        icon: '🍵',
        targetFocusMinutes: 15,
        order: 1
      },
      {
        title: 'Light Organization & Clean Up',
        subtitle: 'Tidy environment, clear desk, light backlog check',
        startTime: '11:00',
        endTime: '12:30',
        blockType: 'execution',
        energyRequired: 'low',
        color: 'indigo',
        icon: '🧹',
        targetFocusMinutes: 45,
        order: 2
      },
      {
        title: 'Relaxation & Reading',
        subtitle: 'Leisure reading, good food, nap if needed',
        startTime: '13:00',
        endTime: '15:30',
        blockType: 'recharge',
        energyRequired: 'low',
        color: 'cyan',
        icon: '📖',
        targetFocusMinutes: 0,
        order: 3
      },
      {
        title: 'Mobility & Nature Walk',
        subtitle: 'Walking, stretching, breathing deeply',
        startTime: '16:00',
        endTime: '17:30',
        blockType: 'fitness',
        energyRequired: 'medium',
        color: 'rose',
        icon: '🚶',
        targetFocusMinutes: 20,
        order: 4
      },
      {
        title: 'Deep Rest & Sleep Preparation',
        subtitle: 'Early offline shutdown, warm bath, restful sleep',
        startTime: '19:00',
        endTime: '21:30',
        blockType: 'evening',
        energyRequired: 'low',
        color: 'purple',
        icon: '🌙',
        targetFocusMinutes: 0,
        order: 5
      }
    ]
  }
];

export const DailyBlocksEngine: React.FC<DailyBlocksEngineProps> = ({
  blocks = [],
  tasks = [],
  habits = [],
  plans = [],
  projects = [],
  goals = [],
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onBatchApplyBlocks,
  onClearDateBlocks,
  onToggleTask,
  onToggleHabit,
  onAddWeeklyPlanSlot,
  onNavigateModule,
  lang = 'en',
  isDark = true,
}) => {
  const isAr = lang === 'ar';

  // Current viewing date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Current view mode: 'today' | 'week' | 'month'
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');

  // Modals
  const [showArchetypeModal, setShowArchetypeModal] = useState<boolean>(false);
  const [showAddBlockModal, setShowAddBlockModal] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<DailyBlockItem | null>(null);

  // New Block Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newType, setNewType] = useState<DailyBlockType>('deep-work');
  const [newEnergy, setNewEnergy] = useState<DailyBlockEnergy>('high');
  const [newColor, setNewColor] = useState('emerald');
  const [newTargetFocus, setNewTargetFocus] = useState(90);
  const [newLinkedTasks, setNewLinkedTasks] = useState<string[]>([]);
  const [newLinkedHabits, setNewLinkedHabits] = useState<string[]>([]);
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newGoalId, setNewGoalId] = useState<string>('');
  const [newChecklist, setNewChecklist] = useState<NestedChecklistItem[]>([]);
  const [newStepText, setNewStepText] = useState<string>('');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  // Clock tick for live active block highlighting
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeStr(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isViewingToday = selectedDate === todayStr;

  const todayTasksPendingCount = useMemo(() => {
    return tasks.filter((t) => !t.completed && (t.dueDate === selectedDate || (!t.dueDate && selectedDate === todayStr))).length;
  }, [tasks, selectedDate, todayStr]);

  // Filter blocks for selected date, ordered by order / start time
  const dayBlocks = useMemo(() => {
    return blocks
      .filter((b) => b.date === selectedDate)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.startTime.localeCompare(b.startTime));
  }, [blocks, selectedDate]);

  // Find currently active block if viewing today
  const activeNowBlock = useMemo(() => {
    if (!isViewingToday || dayBlocks.length === 0) return null;
    return dayBlocks.find((b) => {
      return b.startTime <= currentTimeStr && b.endTime >= currentTimeStr;
    }) || null;
  }, [isViewingToday, dayBlocks, currentTimeStr]);

  // Aggregate stats for the selected day
  const dayStats = useMemo(() => {
    const total = dayBlocks.length;
    const completed = dayBlocks.filter((b) => b.status === 'completed').length;
    const deepWorkBlocks = dayBlocks.filter((b) => b.blockType === 'deep-work').length;
    const totalPlannedFocusMins = dayBlocks.reduce((acc, b) => acc + (b.targetFocusMinutes || 0), 0);
    const totalLoggedFocusMins = dayBlocks.reduce((acc, b) => acc + (b.focusMinutesLogged || 0), 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      deepWorkBlocks,
      totalPlannedFocusMins,
      totalLoggedFocusMins,
      pct
    };
  }, [dayBlocks]);

  // 7-day week blocks summary
  const weekData = useMemo(() => {
    const days: { date: string; dayName: string; blocks: DailyBlockItem[]; completedPct: number }[] = [];
    const base = new Date(selectedDate);
    const dayOfWeek = (base.getDay() + 6) % 7; // Monday = 0
    base.setDate(base.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const blks = blocks.filter((b) => b.date === dStr);
      const c = blks.filter((b) => b.status === 'completed').length;
      const pct = blks.length > 0 ? Math.round((c / blks.length) * 100) : 0;
      const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayNamesAr = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

      days.push({
        date: dStr,
        dayName: isAr ? dayNamesAr[i] : dayNamesEn[i],
        blocks: blks,
        completedPct: pct
      });
    }
    return days;
  }, [blocks, selectedDate, isAr]);

  // Matching slots from Weekly Planner for selectedDate:
  // Check single-day overrides first (slot.date === selectedDate), otherwise recurring template for that weekday
  const availableWeekSlotsForDate = useMemo(() => {
    if (!plans || plans.length === 0) return [];
    const d = new Date(selectedDate);
    const jsDay = d.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1; // Monday = 0
    const singleDaySlots = plans.filter((p) => p.date === selectedDate);
    if (singleDaySlots.length > 0) {
      return singleDaySlots.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
    }
    return plans
      .filter((p) => p.dayIndex === dayIndex && (!p.date || p.isRecurring === true))
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
  }, [plans, selectedDate]);

  // Import from Weekly Planner for selectedDate
  const handleImportFromWeeklyPlan = async () => {
    if (!onBatchApplyBlocks || availableWeekSlotsForDate.length === 0) return;
    try {
      if (dayBlocks.length > 0) {
        if (!confirm(isAr ? 'هل تريد استبدال فترات اليوم الحالية بالفترات المجدولة في المخطط الأسبوعي؟' : 'Replace today\'s blocks with slots from Weekly Planner?')) {
          return;
        }
        await onClearDateBlocks(selectedDate);
      }

      const formatted: Omit<DailyBlockItem, 'id'>[] = availableWeekSlotsForDate.map((s, idx) => ({
        date: selectedDate,
        title: s.title,
        subtitle: s.notes || undefined,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '11:00',
        blockType: s.blockType || (s.type === 'deep-work' ? 'deep-work' : s.type === 'workout' ? 'fitness' : 'execution'),
        energyRequired: s.energyRequired || 'medium',
        status: s.completed ? 'completed' : 'pending',
        color: s.color || 'emerald',
        icon: s.icon,
        targetFocusMinutes: 60,
        focusMinutesLogged: 0,
        linkedTaskIds: s.linkedTaskIds,
        linkedHabitIds: s.linkedHabitIds,
        linkedProjectId: s.linkedProjectId,
        linkedGoalId: s.linkedGoalId,
        nestedChecklist: s.nestedChecklist,
        order: idx + 1,
        createdAt: Date.now() + idx,
      }));

      await onBatchApplyBlocks(formatted);
      setSyncStatusMessage(
        isAr
          ? `✓ تم استيراد ${formatted.length} فترات بنجاح من المخطط الأسبوعي!`
          : `✓ Successfully imported ${formatted.length} blocks from Weekly Planner!`
      );
      playCelebrationChime();
      setTimeout(() => setSyncStatusMessage(null), 4000);
    } catch (err) {
      console.error('Failed to import from weekly plan:', err);
    }
  };

  // Save a single Daily Block back as a Recurring Weekly Plan Slot
  const handleSaveBlockAsWeeklyRecurring = async (block: DailyBlockItem) => {
    if (!onAddWeeklyPlanSlot) return;
    try {
      const d = new Date(block.date);
      const jsDay = d.getDay();
      const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
      await onAddWeeklyPlanSlot({
        dayIndex,
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        timeSlot: `${block.startTime} - ${block.endTime}`,
        type: block.blockType === 'fitness' ? 'workout' : block.blockType === 'deep-work' ? 'deep-work' : 'general',
        blockType: block.blockType,
        color: block.color || 'emerald',
        icon: block.icon,
        energyRequired: block.energyRequired || 'medium',
        notes: block.subtitle,
        linkedTaskIds: block.linkedTaskIds,
        linkedHabitIds: block.linkedHabitIds,
        linkedProjectId: block.linkedProjectId,
        linkedGoalId: block.linkedGoalId,
        nestedChecklist: block.nestedChecklist,
        completed: false,
        isRecurring: true,
        createdAt: Date.now(),
      });
      setSyncStatusMessage(
        isAr ? '✓ تم حفظ الفترة كقالب أسبوعي دائم!' : '✓ Block saved as recurring weekly template!'
      );
      playCelebrationChime();
      setTimeout(() => setSyncStatusMessage(null), 3500);
    } catch (e) {
      console.warn('Save as weekly recurring failed:', e);
    }
  };

  // Toggle nested checklist item inside Daily Block
  const handleToggleNestedChecklistItem = async (block: DailyBlockItem, itemId: string) => {
    if (!block.id || !block.nestedChecklist) return;
    const updated = block.nestedChecklist.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    await onUpdateBlock(block.id, { nestedChecklist: updated });
    playTaskCompleteSound();
  };

  // Quick navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleJumpToToday = () => {
    setSelectedDate(todayStr);
  };

  // Apply Blueprint Archetype
  const handleApplyArchetype = async (archetype: DailyBlockArchetype) => {
    try {
      if (dayBlocks.length > 0) {
        if (!confirm(isAr ? 'سيتم استبدال قوالب اليوم الحالية بهذا القالب، هل تريد المتابعة؟' : 'Replace today\'s blocks with this template?')) {
          return;
        }
        await onClearDateBlocks(selectedDate);
      }

      const formattedBlocks: Omit<DailyBlockItem, 'id'>[] = archetype.blocks.map((b) => ({
        date: selectedDate,
        title: b.title,
        subtitle: b.subtitle,
        startTime: b.startTime,
        endTime: b.endTime,
        blockType: b.blockType,
        energyRequired: b.energyRequired,
        status: 'pending',
        color: b.color,
        icon: b.icon,
        targetFocusMinutes: b.targetFocusMinutes || 0,
        focusMinutesLogged: 0,
        order: b.order,
        createdAt: Date.now()
      }));

      await onBatchApplyBlocks(formattedBlocks);
      playCelebrationChime();
      setShowArchetypeModal(false);
    } catch (err) {
      console.error('Failed to apply daily archetype:', err);
    }
  };

  // Toggle Block Status
  const handleToggleStatus = async (block: DailyBlockItem) => {
    if (!block.id) return;
    const newStatus: DailyBlockStatus =
      block.status === 'completed'
        ? 'pending'
        : block.status === 'pending'
        ? 'in_progress'
        : 'completed';

    if (newStatus === 'completed') {
      playTaskCompleteSound();
    }

    try {
      await onUpdateBlock(block.id, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? Date.now() : undefined
      });
    } catch (err) {
      console.error('Failed to update block status:', err);
    }
  };

  // Open Add Block Modal with smart default times
  const handleOpenAddModal = (presetType?: DailyBlockType) => {
    const lastBlock = dayBlocks[dayBlocks.length - 1];
    let defaultStart = '09:00';
    let defaultEnd = '11:00';

    if (lastBlock?.endTime) {
      defaultStart = lastBlock.endTime;
      const [h, m] = defaultStart.split(':').map(Number);
      const newH = Math.min(23, h + 2);
      defaultEnd = `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    setNewStartTime(defaultStart);
    setNewEndTime(defaultEnd);

    if (presetType === 'morning') {
      setNewTitle(isAr ? 'الروتين الصباحي والانطلاق' : 'Morning Ignition & Priming');
      setNewType('morning');
      setNewEnergy('medium');
      setNewColor('amber');
    } else if (presetType === 'deep-work') {
      setNewTitle(isAr ? 'فترة تركيز عميق' : 'Deep Work Focus Sprint');
      setNewType('deep-work');
      setNewEnergy('high');
      setNewColor('emerald');
    } else if (presetType === 'recharge') {
      setNewTitle(isAr ? 'استراحة وتغذية' : 'Recharge & Nutrition');
      setNewType('recharge');
      setNewEnergy('low');
      setNewColor('cyan');
    } else if (presetType === 'fitness') {
      setNewTitle(isAr ? 'تمرين ولياقة بدنية' : 'Movement & Physical Training');
      setNewType('fitness');
      setNewEnergy('high');
      setNewColor('rose');
    } else if (presetType === 'evening') {
      setNewTitle(isAr ? 'إغلاق اليوم والمراجعة' : 'Evening Shutdown & Review');
      setNewType('evening');
      setNewEnergy('low');
      setNewColor('purple');
    } else {
      setNewTitle('');
      setNewType('deep-work');
      setNewEnergy('high');
      setNewColor('emerald');
    }

    setNewSubtitle('');
    setNewTargetFocus(90);
    setNewLinkedTasks([]);
    setNewLinkedHabits([]);
    setNewProjectId('');
    setNewGoalId('');
    setNewChecklist([]);
    setNewStepText('');
    setEditingBlock(null);
    setShowAddBlockModal(true);
  };

  // Save Block (Create or Edit)
  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      if (editingBlock?.id) {
        await onUpdateBlock(editingBlock.id, {
          title: newTitle.trim(),
          subtitle: newSubtitle.trim() || undefined,
          startTime: newStartTime,
          endTime: newEndTime,
          blockType: newType,
          energyRequired: newEnergy,
          color: newColor,
          targetFocusMinutes: Number(newTargetFocus) || 0,
          linkedTaskIds: newLinkedTasks,
          linkedHabitIds: newLinkedHabits,
          linkedProjectId: newProjectId || undefined,
          linkedGoalId: newGoalId || undefined,
          nestedChecklist: newChecklist.length > 0 ? newChecklist : undefined,
        });
      } else {
        await onAddBlock({
          date: selectedDate,
          title: newTitle.trim(),
          subtitle: newSubtitle.trim() || undefined,
          startTime: newStartTime,
          endTime: newEndTime,
          blockType: newType,
          energyRequired: newEnergy,
          status: 'pending',
          color: newColor,
          targetFocusMinutes: Number(newTargetFocus) || 0,
          focusMinutesLogged: 0,
          linkedTaskIds: newLinkedTasks,
          linkedHabitIds: newLinkedHabits,
          linkedProjectId: newProjectId || undefined,
          linkedGoalId: newGoalId || undefined,
          nestedChecklist: newChecklist.length > 0 ? newChecklist : undefined,
          order: dayBlocks.length + 1,
          createdAt: Date.now()
        });
      }
      setShowAddBlockModal(false);
      setEditingBlock(null);
    } catch (err) {
      console.error('Failed to save block:', err);
    }
  };

  const getBlockTypeBadge = (type: DailyBlockType) => {
    switch (type) {
      case 'morning':
        return { label: isAr ? 'صباحي' : 'Morning', icon: Sun, bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'deep-work':
        return { label: isAr ? 'تركيز عميق' : 'Deep Work', icon: Zap, bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'recharge':
        return { label: isAr ? 'راحة وتغذية' : 'Recharge', icon: Coffee, bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' };
      case 'execution':
        return { label: isAr ? 'تنفيذ ومهام' : 'Execution', icon: Briefcase, bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
      case 'fitness':
        return { label: isAr ? 'رياضة وتدريب' : 'Fitness', icon: Dumbbell, bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
      case 'evening':
        return { label: isAr ? 'مسائي' : 'Evening', icon: Moon, bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
      default:
        return { label: isAr ? 'مخصص' : 'Custom', icon: Compass, bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
    }
  };

  const getEnergyBadge = (energy?: DailyBlockEnergy) => {
    if (energy === 'high') return { label: isAr ? 'طاقة عالية' : 'High Energy', icon: Flame, color: 'text-amber-500' };
    if (energy === 'medium') return { label: isAr ? 'طاقة متوازنة' : 'Balanced', icon: Activity, color: 'text-emerald-500' };
    return { label: isAr ? 'طاقة هادئة' : 'Low / Rest', icon: Coffee, color: 'text-blue-400' };
  };

  return (
    <div
      className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-5 space-y-4 font-sans select-none animate-fadeIn"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ----------------------------------------------------
          1. HEADER & DATE SWITCHER
          ---------------------------------------------------- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                <span>{isAr ? 'قوالب وفترات اليوم (Daily Blocks)' : 'Daily Blocks Architecture'}</span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block shadow-xs shadow-indigo-500/50" />
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                {isAr ? 'تنظيم سهل وبدون إجهاد' : 'Zero-Stress Day Flow'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isAr
                ? 'قسّم يومك إلى فترات واضحة وسهلة الاختيار، واتبع تدفق يومك وأسبوعك وشهرك بكل راحة ووضوح.'
                : 'Structure each day into macro blocks. Enter, select what you want effortlessly, and track how your days unfold.'}
            </p>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Day / Week / Month Mode Tabs */}
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-[#1E2025] rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'today'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'اليوم' : 'Day View'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'الأسبوع' : 'Week Flow'}
            </button>
          </div>

          {/* Quick Jump to Weekly Planner Button */}
          <button
            type="button"
            onClick={() => onNavigateModule('planner')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold border border-neutral-200 dark:border-neutral-700 cursor-pointer shadow-2xs transition-all active:scale-95"
            title={isAr ? 'فتح المخطط الأسبوعي وتخطيط الأسبوع' : 'Open Weekly Planner'}
          >
            <Calendar size={14} className="text-indigo-500" />
            <span>{isAr ? 'المخطط الأسبوعي' : 'Weekly Planner'}</span>
          </button>

          {/* Import from Weekly Plan Button if slots available */}
          {availableWeekSlotsForDate.length > 0 && (
            <button
              type="button"
              onClick={handleImportFromWeeklyPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-800 cursor-pointer shadow-2xs transition-all active:scale-95"
              title={isAr ? `استيراد ${availableWeekSlotsForDate.length} فترات مجدولة لهذا التاريخ من المخطط الأسبوعي` : `Import ${availableWeekSlotsForDate.length} slots from Weekly Planner`}
            >
              <RotateCcw size={13} />
              <span>
                {isAr
                  ? `استيراد من المخطط (${availableWeekSlotsForDate.length})`
                  : `Import from Plan (${availableWeekSlotsForDate.length})`}
              </span>
            </button>
          )}

          {/* 1-Click Apply Archetype Button */}
          <button
            type="button"
            onClick={() => setShowArchetypeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-all active:scale-95"
            title={isAr ? 'اختيار قالب يومي جاهز بنقرة واحدة' : 'Apply 1-click day blueprint'}
          >
            <Sparkles size={14} />
            <span>{isAr ? 'قالب يوم جاهز' : 'Day Blueprints'}</span>
          </button>

          {/* Add Block Button */}
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-all active:scale-95"
          >
            <Plus size={14} />
            <span>{isAr ? 'إضافة فترة' : 'Add Block'}</span>
          </button>
        </div>
      </header>

      {/* Sync Status Toast Banner */}
      {syncStatusMessage && (
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{syncStatusMessage}</span>
        </div>
      )}

      {/* ----------------------------------------------------
          2. DATE PICKER & METRICS BAR
          ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#181A20] border border-neutral-200/90 dark:border-neutral-800/90 shadow-2xs">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer transition-colors"
            title={isAr ? 'اليوم السابق' : 'Previous day'}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
            <Calendar size={15} className="text-indigo-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
            />
            {isViewingToday && (
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {isAr ? 'اليوم' : 'Today'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer transition-colors"
            title={isAr ? 'اليوم التالي' : 'Next day'}
          >
            <ChevronRight size={16} />
          </button>

          {!isViewingToday && (
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {isAr ? 'العودة لليوم' : 'Jump to Today'}
            </button>
          )}
        </div>

        {/* Live Active Block Banner (When viewing today) */}
        {isViewingToday && activeNowBlock && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="font-bold">
              {isAr ? 'الفترة النشطة الآن:' : 'Happening Now:'} <span className="underline">{activeNowBlock.title}</span> ({activeNowBlock.startTime} - {activeNowBlock.endTime})
            </span>
            <button
              type="button"
              onClick={() => onNavigateModule('focus')}
              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all"
            >
              <Timer size={11} />
              <span>{isAr ? 'بدء بومودورو' : 'Focus'}</span>
            </button>
          </div>
        )}

        {/* Execution Metrics Summary */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">{isAr ? 'الفترات:' : 'Blocks:'}</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {dayStats.completed}/{dayStats.total}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold">({dayStats.pct}%)</span>
          </div>

          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800" />

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">{isAr ? 'ساعات التركيز:' : 'Focus Time:'}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {Math.floor(dayStats.totalPlannedFocusMins / 60)}h {dayStats.totalPlannedFocusMins % 60}m
            </span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          2.5. DAILY WORKFLOW STRIP (MORNING KICKOFF & EVENING AUDIT)
          ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/5 to-purple-500/10 border border-neutral-200/90 dark:border-neutral-800/90 shadow-2xs">
        {/* Morning Setup Strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <span>🌅 {isAr ? 'تجهيز الصباح:' : 'Morning Setup:'}</span>
          </span>

          <button
            type="button"
            onClick={() => setShowArchetypeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-200 dark:border-neutral-700 cursor-pointer shadow-3xs transition-all active:scale-95"
            title={isAr ? 'اختيار قالب يوم جاهز بنقرة واحدة' : 'Select a ready day blueprint'}
          >
            <Sparkles size={13} className="text-amber-500" />
            <span>{isAr ? 'قالب جاهز' : 'Day Blueprints'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateModule('tasks')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-200 dark:border-neutral-700 cursor-pointer shadow-3xs transition-all active:scale-95"
            title={isAr ? 'الانتقال إلى قائمة المهام' : 'Go to tasks'}
          >
            <ListChecks size={13} className="text-emerald-500" />
            <span>
              {isAr ? `مهام اليوم (${todayTasksPendingCount})` : `Today's Tasks (${todayTasksPendingCount})`}
            </span>
          </button>
        </div>

        {/* Evening Audit Strip */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateModule('reflections')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold cursor-pointer shadow-xs transition-all"
            title={isAr ? 'إجراء تقييم اليوم وتدوين الإنجازات والدروس' : 'Run daily evening review and reflections'}
          >
            <Moon size={13} />
            <span>{isAr ? 'تقييم نهاية اليوم 🌙' : 'Evening Audit 🌙'}</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          3. MAIN CONTENT: DAY VIEW VS WEEK VIEW
          ---------------------------------------------------- */}
      {viewMode === 'today' ? (
        <div className="space-y-3">
          {dayBlocks.length === 0 ? (
            /* Empty State: Zero Stress Quick Starter */
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#181A20] border border-dashed border-neutral-300 dark:border-neutral-800 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center text-2xl shadow-xs">
                ✨
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                  {isAr ? 'لا توجد فترات محددة لهذا اليوم بعد' : 'No blocks set for this day yet'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {isAr
                    ? 'لا داعي للتفكير الطويل أو كتابة جدول معقد! اختر قالباً جاهزاً بنقرة واحدة أو أضف فتراتك الأساسية وسيقوم النظام بتنظيمها.'
                    : 'Reduce the stress of building a program. Choose a proven day blueprint in 1 click, or add your primary blocks.'}
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {availableWeekSlotsForDate.length > 0 && (
                  <button
                    type="button"
                    onClick={handleImportFromWeeklyPlan}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    <span>
                      {isAr
                        ? `استيراد ${availableWeekSlotsForDate.length} فترات من المخطط الأسبوعي لهذا اليوم`
                        : `Import ${availableWeekSlotsForDate.length} slots from Weekly Planner`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleApplyArchetype(DAY_ARCHETYPES[0])}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Zap size={14} />
                  <span>{isAr ? 'قالب التركيز العميق (Deep Work)' : 'Deep Work Blueprint'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyArchetype(DAY_ARCHETYPES[1])}
                  className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Compass size={14} />
                  <span>{isAr ? 'اليوم التنفيذي المتوازن' : 'Balanced Executive'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowArchetypeModal(true)}
                  className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs font-bold cursor-pointer text-neutral-700 dark:text-neutral-300"
                >
                  {isAr ? 'عرض كافة القوالب' : 'Explore All Blueprints'}
                </button>
              </div>
            </div>
          ) : (
            /* Structured Blocks Timeline List */
            <div className="space-y-2.5">
              {dayBlocks.map((block, index) => {
                const isCurrentlyActive = isViewingToday && block.startTime <= currentTimeStr && block.endTime >= currentTimeStr;
                const isCompleted = block.status === 'completed';
                const typeBadge = getBlockTypeBadge(block.blockType);
                const energyBadge = getEnergyBadge(block.energyRequired);
                const TypeIcon = typeBadge.icon;

                return (
                  <div
                    key={block.id || index}
                    className={`group relative p-3 sm:p-4 rounded-2xl border transition-all ${
                      isCurrentlyActive
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20'
                        : isCompleted
                        ? 'bg-neutral-50/70 dark:bg-[#16171B]/60 border-neutral-200/60 dark:border-neutral-800/60 opacity-80'
                        : 'bg-white dark:bg-[#181A20] border-neutral-200/90 dark:border-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                      {/* Left: Status Toggle & Time Interval */}
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(block)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                              : isCurrentlyActive
                              ? 'bg-white dark:bg-neutral-800 border-emerald-500 text-emerald-500 animate-pulse'
                              : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400 hover:text-emerald-500'
                          }`}
                          title={isCompleted ? (isAr ? 'إلغاء الإكمال' : 'Unmark completed') : (isAr ? 'وضع علامة تم الإنجاز' : 'Mark as done')}
                        >
                          <Check size={15} className={isCompleted ? 'stroke-[3]' : ''} />
                        </button>

                        <div>
                          <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-neutral-900 dark:text-white">
                            <Clock size={13} className="text-neutral-400" />
                            <span>{block.startTime}</span>
                            <span className="text-neutral-400">→</span>
                            <span>{block.endTime}</span>
                          </div>
                          {isCurrentlyActive && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-sans flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                              {isAr ? 'جارية الآن' : 'Active Now'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Block Title & Focus Objective */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base">{block.icon || '📌'}</span>
                          <h4
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isCompleted
                                ? 'text-neutral-500 dark:text-neutral-400 line-through'
                                : 'text-neutral-900 dark:text-white'
                            }`}
                          >
                            {block.title}
                          </h4>

                          {/* Block Type Badge */}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeBadge.bg}`}>
                            <TypeIcon size={10} />
                            <span>{typeBadge.label}</span>
                          </span>

                          {/* Energy Badge */}
                          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                            <energyBadge.icon size={11} className={energyBadge.color} />
                            <span>{energyBadge.label}</span>
                          </span>
                        </div>

                        {block.subtitle && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                            {block.subtitle}
                          </p>
                        )}

                        {/* Connected Project & Goal Badges */}
                        {(block.linkedProjectId || block.linkedGoalId) && (
                          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                            {block.linkedProjectId && (() => {
                              const p = projects.find((pr) => pr.id === block.linkedProjectId);
                              return p ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                                  <span>📁</span>
                                  <span className="truncate max-w-[120px]">{p.title}</span>
                                </span>
                              ) : null;
                            })()}
                            {block.linkedGoalId && (() => {
                              const g = goals.find((gl) => gl.id === block.linkedGoalId);
                              return g ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                  <span>🎯</span>
                                  <span className="truncate max-w-[120px]">{g.title}</span>
                                </span>
                              ) : null;
                            })()}
                          </div>
                        )}

                        {/* Interactive Linked Tasks */}
                        {block.linkedTaskIds && block.linkedTaskIds.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase">{isAr ? 'المهام:' : 'Tasks:'}</span>
                            {block.linkedTaskIds.map((taskId) => {
                              const t = tasks.find((tk) => tk.id === taskId);
                              if (!t) return null;
                              return (
                                <div
                                  key={taskId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onToggleTask) onToggleTask(t.id!, !t.completed);
                                  }}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] cursor-pointer transition-all ${
                                    t.completed
                                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 line-through'
                                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/40 hover:border-indigo-400'
                                  }`}
                                  title={isAr ? 'تغيير حالة المهمة' : 'Toggle task status'}
                                >
                                  <span className={`w-2.5 h-2.5 rounded flex items-center justify-center border text-[7px] ${t.completed ? 'bg-emerald-500 text-white' : 'border-neutral-400'}`}>
                                    {t.completed && '✓'}
                                  </span>
                                  <span className="truncate">{t.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Interactive Linked Habits for selectedDate */}
                        {block.linkedHabitIds && block.linkedHabitIds.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase">{isAr ? 'العادات:' : 'Habits:'}</span>
                            {block.linkedHabitIds.map((habitId) => {
                              const h = habits.find((hb) => hb.id === habitId);
                              if (!h) return null;
                              const isDone = h.completedDates?.includes(selectedDate);
                              return (
                                <div
                                  key={habitId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onToggleHabit) onToggleHabit(h.id!, selectedDate);
                                  }}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] cursor-pointer transition-all ${
                                    isDone
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40 hover:border-amber-400'
                                  }`}
                                  title={isAr ? 'تسجيل عادة اليوم' : 'Toggle habit for today'}
                                >
                                  <span>{h.icon || '🔥'}</span>
                                  <span className="truncate max-w-[100px]">{h.name}</span>
                                  <span className={`font-bold ${isDone ? 'text-emerald-600' : 'text-neutral-400'}`}>
                                    {isDone ? '✓' : '○'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Interactive Nested Checklist (Sub-steps) */}
                        {block.nestedChecklist && block.nestedChecklist.length > 0 && (
                          <div className="space-y-1 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/80">
                            {block.nestedChecklist.map((item) => (
                              <div
                                key={item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleNestedChecklistItem(block, item.id);
                                }}
                                className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                              >
                                <span className={`w-3 h-3 rounded flex items-center justify-center border text-[8px] ${item.completed ? 'bg-emerald-500 text-white border-emerald-600' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                  {item.completed && '✓'}
                                </span>
                                <span className={item.completed ? 'line-through text-neutral-400' : ''}>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions & Focus Integration */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Start Pomodoro Focus Button */}
                        <button
                          type="button"
                          onClick={() => onNavigateModule('focus')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold cursor-pointer transition-colors"
                          title={isAr ? 'فتح مؤقت التركيز لهذه الفترة' : 'Launch Pomodoro for this block'}
                        >
                          <Timer size={13} className="text-emerald-500" />
                          <span className="hidden sm:inline">{isAr ? 'تركيز' : 'Focus'}</span>
                        </button>

                        {/* Save as Recurring Weekly Plan Template */}
                        {onAddWeeklyPlanSlot && (
                          <button
                            type="button"
                            onClick={() => handleSaveBlockAsWeeklyRecurring(block)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                            title={isAr ? 'حفظ كقالب أسبوعي دائم في المخطط الأسبوعي' : 'Save as recurring template in Weekly Planner'}
                          >
                            <CalendarDays size={14} />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBlock(block);
                            setNewTitle(block.title);
                            setNewSubtitle(block.subtitle || '');
                            setNewStartTime(block.startTime);
                            setNewEndTime(block.endTime);
                            setNewType(block.blockType);
                            setNewEnergy(block.energyRequired || 'high');
                            setNewColor(block.color || 'emerald');
                            setNewTargetFocus(block.targetFocusMinutes || 60);
                            setNewLinkedTasks(block.linkedTaskIds || []);
                            setNewLinkedHabits(block.linkedHabitIds || []);
                            setNewProjectId(block.linkedProjectId || '');
                            setNewGoalId(block.linkedGoalId || '');
                            setNewChecklist(block.nestedChecklist || []);
                            setNewStepText('');
                            setShowAddBlockModal(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer transition-colors"
                          title={isAr ? 'تعديل الفترة' : 'Edit block'}
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* Archive Button */}
                        {block.id && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateBlock(block.id!, { archived: true, archivedAt: Date.now() });
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors"
                            title={isAr ? 'أرشفة الفترة' : 'Archive block'}
                          >
                            <Archive size={14} />
                          </button>
                        )}

                        {/* Delete Button */}
                        {block.id && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteBlock(block.id!);
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 cursor-pointer transition-colors"
                            title={isAr ? 'حذف الفترة' : 'Delete block'}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* EXECUTIVE EVENING REVIEW & AUDIT CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent dark:from-purple-950/30 dark:via-indigo-950/20 border border-purple-300/40 dark:border-purple-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 animate-fadeIn">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
                    🌙
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>{isAr ? 'تقييم وإغلاق اليوم (Evening Audit)' : 'Evening Audit & Day Closeout'}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                        {dayStats.completed}/{dayStats.total} {isAr ? 'فترات منجزة' : 'done'} ({dayStats.pct}%)
                      </span>
                    </h4>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                      {isAr
                        ? 'في نهاية اليوم: قيّم مستوى طاقتك، سجّل أهم إنجازاتك والدروس المستفادة، وتأكد من ترحيل ما تبقى لغدٍ جديد.'
                        : 'Close your day intentionally: assess energy, celebrate daily wins, and note improvements.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => onNavigateModule('reflections')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>{isAr ? 'إجراء تقييم اليوم 📝' : 'Open Daily Reflection 📝'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ----------------------------------------------------
           WEEK FLOW MATRIX (7-Day Overview)
           ---------------------------------------------------- */
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181A20] border border-neutral-200/90 dark:border-neutral-800/90 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <CalendarDays size={15} className="text-indigo-500" />
                <span>{isAr ? 'تدفق الأسبوع ومتابعة الإنجاز' : '7-Day Weekly Flow & Adherence'}</span>
              </h3>
              <span className="text-[11px] text-neutral-400 font-mono">
                {weekData[0]?.date} → {weekData[6]?.date}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {weekData.map((day) => {
                const isSelected = day.date === selectedDate;
                const isDayToday = day.date === todayStr;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.date);
                      setViewMode('today');
                    }}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between min-h-[140px] ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/20'
                        : isDayToday
                        ? 'bg-neutral-50 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700'
                        : 'bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-neutral-900 dark:text-white">{day.dayName}</span>
                        {isDayToday && (
                          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1 rounded">
                            {isAr ? 'اليوم' : 'Today'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                        {day.date.slice(5)}
                      </span>
                    </div>

                    <div className="space-y-1.5 py-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-500">{isAr ? 'فترات' : 'Blocks'}</span>
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {day.blocks.filter((b) => b.status === 'completed').length}/{day.blocks.length}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all rounded-full"
                          style={{ width: `${day.completedPct}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 text-center block pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      {isAr ? 'عرض اليوم' : 'Open Day'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: ZERO-STRESS DAY BLUEPRINTS (Archetypes)
          ---------------------------------------------------- */}
      {showArchetypeModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowArchetypeModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-xl my-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                    {isAr ? 'قوالب اليوم الجاهزة (Zero-Stress Blueprints)' : 'Zero-Stress Day Blueprints'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {isAr
                      ? 'اختر القالب الأنسب لليوم وسيقوم النظام بتجهيز فتراتك تلقائياً دون أي كتابة أو إجهاد.'
                      : 'Pick a tested archetype to instantly organize your day without tedious manual planning.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowArchetypeModal(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Archetype Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {DAY_ARCHETYPES.map((arch) => (
                <div
                  key={arch.id}
                  className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 flex flex-col justify-between space-y-3 hover:border-indigo-500/50 transition-all shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{arch.icon}</span>
                      {arch.badge && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {arch.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                      {isAr ? arch.nameAr : arch.nameEn}
                    </h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {isAr ? arch.descriptionAr : arch.descriptionEn}
                    </p>
                    <div className="text-[10px] text-neutral-400 font-mono pt-1">
                      {arch.blocks.length} {isAr ? 'فترات محددة' : 'structured blocks'} • ~{arch.blocks.reduce((a, b) => a + (b.targetFocusMinutes || 0), 0) / 60}h focus
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyArchetype(arch)}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{isAr ? 'تطبيق هذا القالب على اليوم' : 'Apply to Today'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: ADD / EDIT BLOCK
          ---------------------------------------------------- */}
      {showAddBlockModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddBlockModal(false);
              setEditingBlock(null);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[88vh] overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-5 py-4 shrink-0 bg-white dark:bg-[#181A20]">
              <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-indigo-500" />
                <span>
                  {editingBlock
                    ? isAr
                      ? 'تعديل الفترة الزمنية'
                      : 'Edit Daily Block'
                    : isAr
                    ? 'إضافة فترة جديدة'
                    : 'Add New Daily Block'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddBlockModal(false);
                  setEditingBlock(null);
                }}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer transition-colors"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 custom-scrollbar min-h-0">
              {/* Title */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'عنوان الفترة:' : 'Block Title:'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={isAr ? 'مثال: فترة التركيز العميق الأولى' : 'e.g. Deep Work Sprint 1'}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              {/* Subtitle / Objective */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'الهدف أو التفاصيل (اختياري):' : 'Objective / Subtitle (Optional):'}
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder={isAr ? 'مثال: إنهاء ميزة الـ analytics وتجهيز التقرير' : 'e.g. Finish analytics feature and architecture'}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Time Span */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'وقت البدء:' : 'Start Time:'}
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'وقت الانتهاء:' : 'End Time:'}
                  </label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Block Type & Energy Level */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'نوع الفترة:' : 'Block Type:'}
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as DailyBlockType)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="morning">{isAr ? '🌅 روتين صباحي' : '🌅 Morning'}</option>
                    <option value="deep-work">{isAr ? '🎯 تركيز عميق' : '🎯 Deep Work'}</option>
                    <option value="execution">{isAr ? '💼 تنفيذ ومهام' : '💼 Execution'}</option>
                    <option value="recharge">{isAr ? '🥗 راحة وتغذية' : '🥗 Recharge'}</option>
                    <option value="fitness">{isAr ? '🏋️ رياضة ولياقة' : '🏋️ Fitness'}</option>
                    <option value="evening">{isAr ? '🌙 إغلاق مسائي' : '🌙 Evening'}</option>
                    <option value="custom">{isAr ? '📌 مخصص' : '📌 Custom'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'مستوى الطاقة المطلوب:' : 'Energy Required:'}
                  </label>
                  <select
                    value={newEnergy}
                    onChange={(e) => setNewEnergy(e.target.value as DailyBlockEnergy)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="high">{isAr ? '⚡ طاقة عالية (High)' : '⚡ High Energy'}</option>
                    <option value="medium">{isAr ? '⚖️ طاقة متوازنة (Medium)' : '⚖️ Balanced'}</option>
                    <option value="low">{isAr ? '🔋 طاقة هادئة / راحة (Low)' : '🔋 Low / Calm'}</option>
                  </select>
                </div>
              </div>

              {/* Planned Focus Minutes */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'دقائق التركيز المخططة في هذه الفترة:' : 'Planned Focus Minutes:'}
                  </label>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {newTargetFocus} {isAr ? 'دقيقة' : 'mins'}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {[0, 30, 60, 90, 120, 150, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setNewTargetFocus(mins)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        newTargetFocus === mins
                          ? 'bg-emerald-500 text-white shadow-2xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Connected Project & Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <span>📁</span>
                    <span>{isAr ? 'ربط بمشروع:' : 'Link Project:'}</span>
                  </label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold focus:outline-none"
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
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <span>🎯</span>
                    <span>{isAr ? 'ربط بهدف:' : 'Link Goal:'}</span>
                  </label>
                  <select
                    value={newGoalId}
                    onChange={(e) => setNewGoalId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold focus:outline-none"
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
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                    <span>{isAr ? 'المهام المرتبطة بهذه الفترة:' : 'Linked Tasks:'}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {newLinkedTasks.length} {isAr ? 'محددة' : 'selected'}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 custom-scrollbar">
                    {tasks.slice(0, 18).map((t) => {
                      const isSelected = newLinkedTasks.includes(t.id!);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setNewLinkedTasks((prev) =>
                              isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id!]
                            );
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700'
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
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                    <span>{isAr ? 'العادات المرتبطة بهذه الفترة:' : 'Linked Habits:'}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {newLinkedHabits.length} {isAr ? 'محددة' : 'selected'}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 custom-scrollbar">
                    {habits.map((h) => {
                      const isSelected = newLinkedHabits.includes(h.id!);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            setNewLinkedHabits((prev) =>
                              isSelected ? prev.filter((id) => id !== h.id) : [...prev, h.id!]
                            );
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700'
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
              <div className="space-y-1.5 p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <label className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ListChecks size={13} className="text-emerald-500" />
                    <span>{isAr ? 'قائمة خطوات فرعية داخل الفترة (Micro-checklist):' : 'Sub-steps Checklist:'}</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {newChecklist.length} {isAr ? 'خطوات' : 'steps'}
                  </span>
                </label>

                {/* Input to add sub-step */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newStepText.trim()) {
                          setNewChecklist((prev) => [
                            ...prev,
                            { id: `step-${Date.now()}`, text: newStepText.trim(), completed: false },
                          ]);
                          setNewStepText('');
                        }
                      }
                    }}
                    placeholder={isAr ? 'أضف خطوة فرعية واضغط إدخال...' : 'Add sub-step item and press enter...'}
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newStepText.trim()) {
                        setNewChecklist((prev) => [
                          ...prev,
                          { id: `step-${Date.now()}`, text: newStepText.trim(), completed: false },
                        ]);
                        setNewStepText('');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer"
                  >
                    + {isAr ? 'إضافة' : 'Add'}
                  </button>
                </div>

                {/* Sub-steps items */}
                {newChecklist.length > 0 && (
                  <div className="space-y-1 pt-1 max-h-28 overflow-y-auto custom-scrollbar">
                    {newChecklist.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-1.5 p-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs"
                      >
                        <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => {
                              setNewChecklist((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s))
                              );
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={`truncate text-xs ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                            {item.text}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setNewChecklist((prev) => prev.filter((_, i) => i !== idx));
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

            {/* Fixed Footer: Cancel & Submit Buttons ALWAYS visible on screen */}
            <div className="px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-50/95 dark:bg-neutral-900/95 backdrop-blur-xs flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBlockModal(false);
                    setEditingBlock(null);
                  }}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 font-bold cursor-pointer transition-colors text-xs"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold cursor-pointer shadow-xs transition-all text-xs flex items-center gap-1.5"
                >
                  {editingBlock ? (isAr ? 'تحديث الفترة' : 'Update Block') : (isAr ? 'إضافة الفترة' : 'Add Block')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
