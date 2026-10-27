import { ModuleType, ModuleLifecycleEvent } from '../types';

const DISABLED_MODULES_KEY = 'core_disabled_modules_v1';
const MODULE_LIFECYCLE_KEY = 'core_module_lifecycle_history_v1';

export const ALL_CONTROLLABLE_MODULES: { id: ModuleType; nameEn: string; nameAr: string; icon: string; descriptionEn: string; descriptionAr: string }[] = [
  {
    id: 'daily-blocks',
    nameEn: 'Daily Blocks Flow',
    nameAr: 'قوالب وفترات اليوم',
    icon: '🧱',
    descriptionEn: 'Daily macro time-blocks and structured day flow.',
    descriptionAr: 'تنظيم اليوم في فترات كلية وتدفق منظم بدون إجهاد.'
  },
  {
    id: 'tasks',
    nameEn: 'Task Tracker & Kanban',
    nameAr: 'متتبع المهام وكانبان',
    icon: '✅',
    descriptionEn: 'Priority task execution, measurable goals, and deadlines.',
    descriptionAr: 'تنفيذ المهام ذات الأولوية، الأهداف القابلة للقياس، والمواعيد.'
  },
  {
    id: 'habits',
    nameEn: 'Habits & Streaks',
    nameAr: 'العادات والسلاسل اليومية',
    icon: '🔥',
    descriptionEn: 'Daily habits protocol, streaks, freeze passes, and snail visualizer.',
    descriptionAr: 'بروتوكول العادات اليومية، السلاسل، التجميد، ومخطط الحلزون.'
  },
  {
    id: 'reflections',
    nameEn: 'Reflections & Journal',
    nameAr: 'سجل التأملات والدروس',
    icon: '📖',
    descriptionEn: 'Daily reflections, weekly audits, lessons learned, and interconnected insights.',
    descriptionAr: 'التأمل اليومي، المراجعة الأسبوعية، الدروس المستفادة، وتتبع أين ضاع الوقت.'
  },
  {
    id: 'focus',
    nameEn: 'Pomodoro Focus Station',
    nameAr: 'مؤقت التركيز وبومودورو',
    icon: '🎯',
    descriptionEn: 'Precision focus timer, daily time target, audio and session logs.',
    descriptionAr: 'مؤقت التركيز الدقيق، الهدف الزمني اليومي، والتسجيل الصوتي.'
  },
  {
    id: 'planner',
    nameEn: 'Weekly Planner',
    nameAr: 'المخطط الأسبوعي',
    icon: '📅',
    descriptionEn: '7-day visual calendar grid and time slots.',
    descriptionAr: 'شبكة التقويم الأسبوعي والفترات الزمنية الموزعة على الأيام.'
  },
  {
    id: 'training',
    nameEn: 'Calisthenics & Training',
    nameAr: 'محرك التدريب واللياقة',
    icon: '🏋️',
    descriptionEn: 'Progressive overload calisthenics, volume load, and workout routines.',
    descriptionAr: 'تمارين الكاليسثينكس والتحميل التدريجي وتسجيل الجولات.'
  },
  {
    id: 'projects',
    nameEn: 'Projects & Strategy',
    nameAr: 'المشاريع والاستراتيجية',
    icon: '📁',
    descriptionEn: 'Multi-step projects, roadmaps, and nested subtasks.',
    descriptionAr: 'المشاريع متعددة المراحل وخطط العمل والمهام المتفرعة.'
  },
  {
    id: 'goals',
    nameEn: 'Goals & Targets',
    nameAr: 'الأهداف والغايات',
    icon: '🏆',
    descriptionEn: 'Lifetime visions, milestones, and strategic targets.',
    descriptionAr: 'الرؤى بعيدة المدى، المعالم الاستراتيجية، والأهداف الحياتية.'
  },
  {
    id: 'notes',
    nameEn: 'Brain Dump & Notes',
    nameAr: 'تفريغ الأفكار والملاحظات',
    icon: '📝',
    descriptionEn: 'Quick capture, category tags, reminders, and knowledge base.',
    descriptionAr: 'التدوين السريع، التصنيفات، التذكيرات، وقاعدة المعرفة الشخصية.'
  },
  {
    id: 'checklists',
    nameEn: 'Checklists & SOPs',
    nameAr: 'قوائم التدقيق وإجراءات التشغيل',
    icon: '📋',
    descriptionEn: 'Standard Operating Procedures, routines, and repeatable checklists.',
    descriptionAr: 'إجراءات التشغيل القياسية والقوائم المرجعية المتكررة.'
  },
  {
    id: 'comments',
    nameEn: 'Comments Hub',
    nameAr: 'مركز التعليقات والإشارات',
    icon: '💬',
    descriptionEn: 'Cross-module comments and contextual entity mentions.',
    descriptionAr: 'التعليقات المترابطة بين المهام والعادات والملاحظات.'
  },
  {
    id: 'sunday-reset',
    nameEn: 'Sunday Reset Wizard',
    nameAr: 'إعادة ضبط الأحد',
    icon: '✨',
    descriptionEn: 'Weekly reflection ritual, inbox triage, and weekly focus alignment.',
    descriptionAr: 'طقس المراجعة الأسبوعية، فرز المهام، وتحديد اتجاه الأسبوع.'
  }
];

export const getDisabledModules = (): ModuleType[] => {
  try {
    const raw = localStorage.getItem(DISABLED_MODULES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ModuleType[];
    }
  } catch (e) {
    console.error('Failed to get disabled modules:', e);
  }
  return [];
};

export const isModuleEnabled = (moduleId: ModuleType): boolean => {
  const disabled = getDisabledModules();
  return !disabled.includes(moduleId);
};

export const getModuleLifecycleHistory = (): ModuleLifecycleEvent[] => {
  try {
    const raw = localStorage.getItem(MODULE_LIFECYCLE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ModuleLifecycleEvent[];
    }
  } catch (e) {
    console.error('Failed to get module lifecycle history:', e);
  }
  return [];
};

export const setModuleState = (
  moduleId: ModuleType,
  enable: boolean,
  reason?: string
): ModuleLifecycleEvent => {
  const currentDisabled = getDisabledModules();
  let nextDisabled: ModuleType[];

  if (enable) {
    nextDisabled = currentDisabled.filter((id) => id !== moduleId);
  } else {
    nextDisabled = Array.from(new Set([...currentDisabled, moduleId]));
  }

  try {
    localStorage.setItem(DISABLED_MODULES_KEY, JSON.stringify(nextDisabled));
  } catch (e) {
    console.error('Failed to save disabled modules:', e);
  }

  // Create lifecycle event
  const modDef = ALL_CONTROLLABLE_MODULES.find((m) => m.id === moduleId);
  const now = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];

  const event: ModuleLifecycleEvent = {
    moduleId,
    moduleName: modDef ? modDef.nameEn : moduleId,
    status: enable ? 'enabled' : 'disabled',
    timestamp: now,
    dateStr,
    reason: reason?.trim() || undefined
  };

  const currentHistory = getModuleLifecycleHistory();
  const nextHistory = [event, ...currentHistory];

  try {
    localStorage.setItem(MODULE_LIFECYCLE_KEY, JSON.stringify(nextHistory.slice(0, 200)));
  } catch (e) {
    console.error('Failed to save lifecycle event:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('core_module_state_changed', { detail: { moduleId, enable, event } }));
    window.dispatchEvent(new Event('core_nav_config_changed'));
  }

  return event;
};

const SYSTEM_TRACKING_STATE_KEY = 'core_system_tracking_state_v1';
const SYSTEM_ACTIVATED_AT_KEY = 'core_system_activated_at_v1';

export const isSystemTrackingActive = (): boolean => {
  try {
    const raw = localStorage.getItem(SYSTEM_TRACKING_STATE_KEY);
    if (raw !== null) {
      return raw === 'true';
    }
  } catch (e) {}
  return true; // Default active
};

export const getSystemActivatedAt = (): number => {
  try {
    const raw = localStorage.getItem(SYSTEM_ACTIVATED_AT_KEY);
    if (raw) return parseInt(raw, 10);
  } catch (e) {}
  return 0;
};

export const setSystemTrackingActive = (active: boolean): void => {
  try {
    localStorage.setItem(SYSTEM_TRACKING_STATE_KEY, String(active));
    if (active) {
      localStorage.setItem(SYSTEM_ACTIVATED_AT_KEY, String(Date.now()));
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('core_system_tracking_changed', { detail: { active, timestamp: Date.now() } }));
  }
};
