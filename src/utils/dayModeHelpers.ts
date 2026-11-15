import {
  DayModeType,
  DayProfileConfig,
  DayProfileEntry,
  ErrandsTemplateItem,
  HabitDayModePolicy,
  HabitItem,
  LifeMaintenanceItem,
  TaskItem,
} from '../types';

const DAY_MODE_LOCAL_STORAGE_KEY = 'core_day_profile_config_v1';

export const DEFAULT_ERRANDS_TEMPLATE: ErrandsTemplateItem[] = [
  { id: 'err-clean-home', title: 'Home Cleaning & Room Reset', titleAr: 'تنظيف المنزل وترتيب الغرفة', category: 'cleaning' },
  { id: 'err-market', title: 'Market & Groceries Run', titleAr: 'التبضيع وشراء مقاضي السوق', category: 'market' },
  { id: 'err-laundry', title: 'Laundry & Clothes Prep', titleAr: 'غسيل وتجهيز الملابس', category: 'prep' },
  { id: 'err-admin', title: 'Personal Admin & Bills', titleAr: 'شؤون شخصية ومصاريف', category: 'errands' },
];

export const DEFAULT_DAY_PROFILE_CONFIG: DayProfileConfig = {
  recurringWeekdayModes: {},
  dateOverrides: {},
  defaultErrandsTemplate: DEFAULT_ERRANDS_TEMPLATE,
  updatedAt: 0,
};

let activeDayProfileConfigCache: DayProfileConfig | null = null;

export function getLocalIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStoredDayProfileConfig(): DayProfileConfig {
  if (activeDayProfileConfigCache) return activeDayProfileConfigCache;
  try {
    const raw = localStorage.getItem(DAY_MODE_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DayProfileConfig;
      activeDayProfileConfigCache = {
        ...DEFAULT_DAY_PROFILE_CONFIG,
        ...parsed,
        defaultErrandsTemplate:
          Array.isArray(parsed.defaultErrandsTemplate) && parsed.defaultErrandsTemplate.length > 0
            ? parsed.defaultErrandsTemplate
            : DEFAULT_ERRANDS_TEMPLATE,
      };
      return activeDayProfileConfigCache;
    }
  } catch {}
  return DEFAULT_DAY_PROFILE_CONFIG;
}

export function setActiveDayProfileConfig(config: DayProfileConfig | null): void {
  const merged: DayProfileConfig = {
    ...DEFAULT_DAY_PROFILE_CONFIG,
    ...(config || {}),
    recurringWeekdayModes: config?.recurringWeekdayModes || {},
    dateOverrides: config?.dateOverrides || {},
    defaultErrandsTemplate:
      config?.defaultErrandsTemplate && config.defaultErrandsTemplate.length > 0
        ? config.defaultErrandsTemplate
        : DEFAULT_ERRANDS_TEMPLATE,
  };
  activeDayProfileConfigCache = merged;
  try {
    localStorage.setItem(DAY_MODE_LOCAL_STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

export function getActiveDayProfileConfig(): DayProfileConfig {
  return getStoredDayProfileConfig();
}

export interface DayModeMetaInfo {
  id: DayModeType;
  emoji: string;
  labelEn: string;
  labelAr: string;
  shortEn: string;
  shortAr: string;
  descEn: string;
  descAr: string;
  badgeClass: string;
  panelClass: string;
}

export const DAY_MODE_META: Record<DayModeType, DayModeMetaInfo> = {
  execution: {
    id: 'execution',
    emoji: '⚡',
    labelEn: 'Execution Day',
    labelAr: 'يوم تنفيذ وعمل',
    shortEn: 'Execution',
    shortAr: 'تنفيذ',
    descEn: 'Full protocol active: all habits, deep work target, and tasks count normally.',
    descAr: 'النظام الكامل نشط: جميع العادات وهدف التركيز والمهام تُحسب بشكل طبيعي.',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    panelClass: 'bg-white dark:bg-[#181A20] border-neutral-200/80 dark:border-neutral-800',
  },
  life_errands: {
    id: 'life_errands',
    emoji: '🧹',
    labelEn: 'Life & Errands Day',
    labelAr: 'يوم شؤون البيت والتبضيع',
    shortEn: 'Life & Errands',
    shortAr: 'شؤون ومهام شخصية',
    descEn: 'Cleaning, market, laundry & life admin. Heavy work habits are auto-shielded; life checklist becomes today’s win.',
    descAr: 'تنظيف، تسوّق، غسيل وشؤون شخصية. تُحمى عادات العمل الشاقة تلقائياً وتُحتسب قائمة شؤون الحياة كإنجاز اليوم.',
    badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    panelClass: 'bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-950/40 dark:via-neutral-900/70 dark:to-neutral-900/50 border-teal-300/80 dark:border-teal-800/70',
  },
  rest: {
    id: 'rest',
    emoji: '🛌',
    labelEn: 'Rest & Recovery Day',
    labelAr: 'يوم راحة واستشفاء',
    shortEn: 'Rest Day',
    shortAr: 'راحة واستشفاء',
    descEn: 'Intentional recharge. Only Core Anchor habits stay active; streaks and rates are fully protected.',
    descAr: 'استراحة مقصودة لاسترجاع الطاقة. تبقى العادات الأساسية فقط، مع حماية كاملة للسلاسل والنسب.',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    panelClass: 'bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-transparent dark:from-indigo-950/40 dark:via-neutral-900/70 dark:to-neutral-900/50 border-indigo-300/80 dark:border-indigo-800/70',
  },
  travel: {
    id: 'travel',
    emoji: '✈️',
    labelEn: 'Travel / Out of Routine',
    labelAr: 'سفر / خارج الروتين',
    shortEn: 'Travel Mode',
    shortAr: 'سفر',
    descEn: 'On the road or away from home/gym. Only Anchor & Portable habits count; all others stay shielded.',
    descAr: 'أثناء السفر أو خارج الروتين المعتاد. تبقى العادات الثابتة والمحمولة فقط نشطة وتُحمى البقية.',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    panelClass: 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/40 dark:via-neutral-900/70 dark:to-neutral-900/50 border-amber-300/80 dark:border-amber-800/70',
  },
};

export const DAY_MODE_ORDER: DayModeType[] = ['execution', 'life_errands', 'rest', 'travel'];
export const OFF_DAY_MODES: DayModeType[] = ['life_errands', 'rest', 'travel'];

export function getHabitDayModePolicy(habit: HabitItem): HabitDayModePolicy {
  if (
    habit.dayModePolicy === 'always_active' ||
    habit.dayModePolicy === 'portable' ||
    habit.dayModePolicy === 'execution_only' ||
    habit.dayModePolicy === 'custom'
  ) {
    return habit.dayModePolicy;
  }
  return 'execution_only';
}

export function getHabitActiveOffDayModes(habit: HabitItem): DayModeType[] {
  const policy = getHabitDayModePolicy(habit);
  if (policy === 'always_active') return [...OFF_DAY_MODES];
  if (policy === 'portable') return ['life_errands', 'travel'];
  if (policy === 'custom') {
    return (habit.activeOnModes || []).filter((m): m is DayModeType => OFF_DAY_MODES.includes(m));
  }
  return [];
}

export function getHabitPolicyMeta(habit: HabitItem, isAr: boolean = false): {
  policy: HabitDayModePolicy;
  icon: string;
  label: string;
  badgeClass: string;
  tooltip: string;
} {
  const policy = getHabitDayModePolicy(habit);
  if (policy === 'always_active') {
    return {
      policy,
      icon: '⚓',
      label: isAr ? 'ثابتة دائماً' : 'Do Anyway',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      tooltip: isAr ? 'مطلوبة دائماً حتى في أيام الراحة والسفر والتنظيف' : 'Always active — do anyway even on Rest, Errands & Travel days',
    };
  }
  if (policy === 'portable') {
    return {
      policy,
      icon: '🎒',
      label: isAr ? 'محمولة' : 'Portable',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      tooltip: isAr ? 'نشطة في السفر والشؤون الشخصية، ومحمية في يوم الراحة' : 'Active on Errands & Travel; auto-shielded on Rest days',
    };
  }
  if (policy === 'custom') {
    const activeModes = getHabitActiveOffDayModes(habit);
    const icons = activeModes.map((m) => DAY_MODE_META[m].emoji).join('');
    return {
      policy,
      icon: '🎯',
      label: activeModes.length > 0 ? `${isAr ? 'مخصص:' : 'On:'} ${icons}` : (isAr ? 'مخصص (التنفيذ فقط)' : 'Custom (Exec Only)'),
      badgeClass: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      tooltip: activeModes.length > 0
        ? (isAr
            ? `نشطة أيضاً في: ${activeModes.map((m) => DAY_MODE_META[m].shortAr).join('، ')}`
            : `Also active on: ${activeModes.map((m) => DAY_MODE_META[m].shortEn).join(', ')}`)
        : (isAr ? 'مخصصة لأيام التنفيذ فقط' : 'Custom: Execution days only'),
    };
  }
  return {
    policy: 'execution_only',
    icon: '🛡️',
    label: isAr ? 'التنفيذ فقط' : 'Exec Only',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    tooltip: isAr ? 'تُحمى تلقائياً في أيام الراحة والشؤون والسفر (والإنجاز فيها يُحسب كمكسب إضافي)' : 'Auto-shielded on Rest, Errands & Travel (optional Bonus Win)',
  };
}

export function resolveDayModeForDate(
  dateStr: string,
  config?: DayProfileConfig | null
): {
  mode: DayModeType;
  isOverride: boolean;
  isRecurring: boolean;
  entry?: DayProfileEntry;
  errandsChecklist: LifeMaintenanceItem[];
} {
  const effectiveConfig = config || getActiveDayProfileConfig();
  const overrideEntry = effectiveConfig.dateOverrides?.[dateStr];
  let mode: DayModeType = 'execution';
  let isOverride = false;
  let isRecurring = false;

  if (overrideEntry && overrideEntry.mode) {
    mode = overrideEntry.mode;
    isOverride = true;
  } else {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dow = String(d.getDay());
      const recurringMode = effectiveConfig.recurringWeekdayModes?.[dow];
      if (recurringMode) {
        mode = recurringMode;
        isRecurring = true;
      }
    }
  }

  const errandsChecklist = overrideEntry?.errandsChecklist || [];

  return {
    mode,
    isOverride,
    isRecurring,
    entry: overrideEntry,
    errandsChecklist,
  };
}

export function isHabitFrozenByDayMode(
  habit: HabitItem,
  dateStr: string,
  config?: DayProfileConfig | null
): boolean {
  const { mode } = resolveDayModeForDate(dateStr, config);
  if (mode === 'execution') return false;

  const policy = getHabitDayModePolicy(habit);
  if (policy === 'always_active') return false;
  if (policy === 'portable') return mode === 'rest';
  if (policy === 'custom') {
    const activeModes = habit.activeOnModes || [];
    return !activeModes.includes(mode);
  }
  return true; // 'execution_only' is shielded on life_errands, rest, and travel
}

export function getHabitEffectiveDayStatus(
  habit: HabitItem,
  dateStr: string,
  config?: DayProfileConfig | null
) {
  const { mode } = resolveDayModeForDate(dateStr, config);
  const isDone = Boolean(habit.history && habit.history[dateStr]);
  const isManualFreeze = Boolean(habit.freezes && habit.freezes[dateStr]);
  const isDayModeShielded = isHabitFrozenByDayMode(habit, dateStr, config);
  const isBonusWin = isDone && (isDayModeShielded || isManualFreeze);
  const isExempt = !isDone && (isManualFreeze || isDayModeShielded);

  return {
    dayMode: mode,
    isDone,
    isManualFreeze,
    isDayModeShielded,
    isBonusWin,
    isExempt,
  };
}

export function createStarterErrandsFromTemplate(
  config?: DayProfileConfig | null,
  isAr: boolean = false
): LifeMaintenanceItem[] {
  const effectiveConfig = config || getActiveDayProfileConfig();
  const template =
    effectiveConfig.defaultErrandsTemplate && effectiveConfig.defaultErrandsTemplate.length > 0
      ? effectiveConfig.defaultErrandsTemplate
      : DEFAULT_ERRANDS_TEMPLATE;

  return template.map((item) => ({
    id: `${item.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: isAr && item.titleAr ? item.titleAr : item.title,
    completed: false,
    category: item.category,
  }));
}

export function getErrandsProgressForDate(
  dateStr: string,
  config?: DayProfileConfig | null
): { total: number; completed: number; rate: number; items: LifeMaintenanceItem[] } {
  const resolved = resolveDayModeForDate(dateStr, config);
  const items = resolved.errandsChecklist;
  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, rate, items };
}

export function isPersonalLifeTask(task: TaskItem): boolean {
  const cat = (task.category || '').toLowerCase();
  if (['personal', 'life', 'home', 'errands', 'cleaning', 'health'].some((k) => cat.includes(k))) {
    return true;
  }
  const title = (task.title || '').toLowerCase();
  return [
    'clean',
    'market',
    'grocer',
    'laundry',
    'shopping',
    'shop',
    'home',
    'house',
    'tanzif',
    'tbdi3',
    'تنظيف',
    'تسوق',
    'سوق',
    'غسيل',
    'بيت',
  ].some((kw) => title.includes(kw));
}

export function isTaskActiveOnOffDay(task: TaskItem): boolean {
  return Boolean(task.doAnywayOnOffDay) || isPersonalLifeTask(task);
}

export function getNextExecutionDateIso(fromDateStr: string, config?: DayProfileConfig | null): string {
  const parts = fromDateStr.split('-');
  const cursor =
    parts.length === 3
      ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      : new Date();

  for (let i = 1; i <= 14; i++) {
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + i);
    const iso = getLocalIsoDate(next);
    if (resolveDayModeForDate(iso, config).mode === 'execution') {
      return iso;
    }
  }
  const fallback = new Date(cursor);
  fallback.setDate(cursor.getDate() + 1);
  return getLocalIsoDate(fallback);
}
