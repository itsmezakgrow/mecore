import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Plus,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Sliders,
  ListChecks,
} from 'lucide-react';
import {
  DayModeType,
  DayProfileConfig,
  ErrandsTemplateItem,
  HabitDayModePolicy,
  HabitItem,
  LifeMaintenanceItem,
} from '../types';
import {
  DAY_MODE_META,
  DAY_MODE_ORDER,
  DEFAULT_ERRANDS_TEMPLATE,
  OFF_DAY_MODES,
  createStarterErrandsFromTemplate,
  getErrandsProgressForDate,
  getHabitActiveOffDayModes,
  getHabitDayModePolicy,
  getLocalIsoDate,
  isHabitFrozenByDayMode,
  resolveDayModeForDate,
} from '../utils/dayModeHelpers';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface DayModeControlBarProps {
  dateStr?: string;
  dayProfileConfig?: DayProfileConfig | null;
  habits?: HabitItem[];
  onSetDateMode: (dateStr: string, mode: DayModeType) => Promise<void> | void;
  onSaveConfig: (nextConfig: DayProfileConfig) => Promise<void> | void;
  onBulkUpdateHabitPolicies?: (
    updates: { habitId: string; policy: HabitDayModePolicy; activeOnModes?: DayModeType[] }[]
  ) => Promise<void> | void;
  compact?: boolean;
  lang?: 'en' | 'ar';
}

export const DayModeControlBar: React.FC<DayModeControlBarProps> = ({
  dateStr,
  dayProfileConfig,
  habits = [],
  onSetDateMode,
  onSaveConfig,
  onBulkUpdateHabitPolicies,
  compact = false,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const targetDate = dateStr || getLocalIsoDate();
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [newErrandTitle, setNewErrandTitle] = useState('');
  const [newErrandCategory, setNewErrandCategory] = useState<'cleaning' | 'market' | 'errands' | 'prep' | 'custom'>('cleaning');

  const resolved = useMemo(
    () => resolveDayModeForDate(targetDate, dayProfileConfig),
    [targetDate, dayProfileConfig]
  );

  const modeMeta = DAY_MODE_META[resolved.mode];
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archived && (!h.snoozeUntil || h.snoozeUntil < Date.now())),
    [habits]
  );

  const habitShieldSummary = useMemo(() => {
    let activeCount = 0;
    let shieldedCount = 0;
    activeHabits.forEach((h) => {
      if (isHabitFrozenByDayMode(h, targetDate, dayProfileConfig)) {
        shieldedCount++;
      } else {
        activeCount++;
      }
    });
    return { activeCount, shieldedCount };
  }, [activeHabits, targetDate, dayProfileConfig]);

  const errandsProgress = useMemo(
    () => getErrandsProgressForDate(targetDate, dayProfileConfig),
    [targetDate, dayProfileConfig]
  );

  const ensureDateErrandsInitialized = (): LifeMaintenanceItem[] => {
    if (resolved.errandsChecklist && resolved.errandsChecklist.length > 0) {
      return resolved.errandsChecklist;
    }
    return createStarterErrandsFromTemplate(dayProfileConfig, isAr);
  };

  const handleToggleErrand = async (itemId: string) => {
    const baseConfig: DayProfileConfig = {
      recurringWeekdayModes: dayProfileConfig?.recurringWeekdayModes || {},
      dateOverrides: { ...(dayProfileConfig?.dateOverrides || {}) },
      defaultErrandsTemplate: dayProfileConfig?.defaultErrandsTemplate || DEFAULT_ERRANDS_TEMPLATE,
    };
    const currentList = ensureDateErrandsInitialized();
    const updatedList = currentList.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    baseConfig.dateOverrides![targetDate] = {
      ...(baseConfig.dateOverrides![targetDate] || { mode: resolved.mode }),
      mode: resolved.mode,
      errandsChecklist: updatedList,
      updatedAt: Date.now(),
    };
    await onSaveConfig(baseConfig);
  };

  const handleAddErrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newErrandTitle.trim();
    if (!trimmed) return;

    const baseConfig: DayProfileConfig = {
      recurringWeekdayModes: dayProfileConfig?.recurringWeekdayModes || {},
      dateOverrides: { ...(dayProfileConfig?.dateOverrides || {}) },
      defaultErrandsTemplate: dayProfileConfig?.defaultErrandsTemplate || DEFAULT_ERRANDS_TEMPLATE,
    };
    const currentList = ensureDateErrandsInitialized();
    const newItem: LifeMaintenanceItem = {
      id: `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      title: trimmed,
      completed: false,
      category: newErrandCategory,
    };
    baseConfig.dateOverrides![targetDate] = {
      ...(baseConfig.dateOverrides![targetDate] || { mode: resolved.mode }),
      mode: resolved.mode,
      errandsChecklist: [...currentList, newItem],
      updatedAt: Date.now(),
    };
    setNewErrandTitle('');
    await onSaveConfig(baseConfig);
  };

  const handleDeleteErrand = async (itemId: string) => {
    const baseConfig: DayProfileConfig = {
      recurringWeekdayModes: dayProfileConfig?.recurringWeekdayModes || {},
      dateOverrides: { ...(dayProfileConfig?.dateOverrides || {}) },
      defaultErrandsTemplate: dayProfileConfig?.defaultErrandsTemplate || DEFAULT_ERRANDS_TEMPLATE,
    };
    const currentList = ensureDateErrandsInitialized();
    const updatedList = currentList.filter((i) => i.id !== itemId);
    baseConfig.dateOverrides![targetDate] = {
      ...(baseConfig.dateOverrides![targetDate] || { mode: resolved.mode }),
      mode: resolved.mode,
      errandsChecklist: updatedList,
      updatedAt: Date.now(),
    };
    await onSaveConfig(baseConfig);
  };

  const handleLoadStarterErrands = async () => {
    const baseConfig: DayProfileConfig = {
      recurringWeekdayModes: dayProfileConfig?.recurringWeekdayModes || {},
      dateOverrides: { ...(dayProfileConfig?.dateOverrides || {}) },
      defaultErrandsTemplate: dayProfileConfig?.defaultErrandsTemplate || DEFAULT_ERRANDS_TEMPLATE,
    };
    baseConfig.dateOverrides![targetDate] = {
      ...(baseConfig.dateOverrides![targetDate] || { mode: resolved.mode }),
      mode: resolved.mode,
      errandsChecklist: createStarterErrandsFromTemplate(dayProfileConfig, isAr),
      updatedAt: Date.now(),
    };
    await onSaveConfig(baseConfig);
  };

  const displayErrands = resolved.errandsChecklist;

  return (
    <>
      <div
        className={`rounded-2xl border p-3.5 sm:p-4 transition-all shadow-xs ${modeMeta.panelClass} ${
          isAr ? 'text-right' : ''
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Current Day Mode Indicator & Summary */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/90 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xl shrink-0 shadow-3xs">
              {modeMeta.emoji}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {isAr ? 'وضع اليوم النشط' : "Today's Day Mode"}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${modeMeta.badgeClass}`}>
                  {isAr ? modeMeta.labelAr : modeMeta.labelEn}
                </span>
                {resolved.isRecurring && !resolved.isOverride && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                    {isAr ? 'تلقائي أسبوعياً' : 'Auto Weekly Rule'}
                  </span>
                )}
              </div>

              {!compact && (
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                  {isAr ? modeMeta.descAr : modeMeta.descEn}
                </p>
              )}

              {activeHabits.length > 0 && resolved.mode !== 'execution' && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-md">
                    <ShieldCheck size={12} />
                    <span>
                      {isAr
                        ? `${habitShieldSummary.shieldedCount} عادة محمية تلقائياً (بلا كسر للسلسلة)`
                        : `${habitShieldSummary.shieldedCount} habits auto-shielded`}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={12} />
                    <span>
                      {isAr
                        ? `${habitShieldSummary.activeCount} عادات ثابتة نشطة اليوم`
                        : `${habitShieldSummary.activeCount} core habits active today`}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: 1-Click Mode Switcher + Planner Button */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <div className="grid grid-cols-2 sm:inline-flex p-1 bg-neutral-100/90 dark:bg-neutral-800/90 rounded-xl border border-neutral-200 dark:border-neutral-700 gap-1">
              {DAY_MODE_ORDER.map((m) => {
                const info = DAY_MODE_META[m];
                const isSelected = resolved.mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onSetDateMode(targetDate, m)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs ring-1 ring-neutral-200 dark:ring-neutral-600'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                    title={isAr ? info.descAr : info.descEn}
                  >
                    <span>{info.emoji}</span>
                    <span>{isAr ? info.shortAr : info.shortEn}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowPlannerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shadow-3xs transition-all cursor-pointer whitespace-nowrap"
              title={isAr ? 'ضبط الأيام الأسبوعية وقواعد العادات' : 'Configure weekly schedule & habit policies'}
            >
              <Settings2 size={14} className="text-emerald-500" />
              <span>{isAr ? 'القواعد والروتين' : 'Rules & Policies'}</span>
            </button>
          </div>
        </div>

        {/* Life & Errands Inline Checklist (When mode === 'life_errands' and not compact) */}
        {!compact && resolved.mode === 'life_errands' && (
          <div className="mt-3.5 pt-3.5 border-t border-teal-200/70 dark:border-teal-800/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListChecks size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                  {isAr ? 'قائمة شؤون البيت والمهام الشخصية لليوم' : "Today's Life & Home Maintenance Checklist"}
                </span>
                {errandsProgress.total > 0 && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 tabular-nums">
                    {errandsProgress.completed}/{errandsProgress.total} ({errandsProgress.rate}%)
                  </span>
                )}
              </div>

              {displayErrands.length === 0 && (
                <button
                  type="button"
                  onClick={handleLoadStarterErrands}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-3xs cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>{isAr ? 'تحميل مهام البيت والتبضيع الافتراضية' : 'Load Home & Market Checklist'}</span>
                </button>
              )}
            </div>

            {errandsProgress.total > 0 && (
              <div className="w-full h-1.5 bg-neutral-200/70 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${errandsProgress.rate}%` }}
                />
              </div>
            )}

            {displayErrands.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {displayErrands.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                      item.completed
                        ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 text-neutral-500 dark:text-neutral-400'
                        : 'bg-white/90 dark:bg-neutral-900/70 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleErrand(item.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left rtl:text-right cursor-pointer"
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                          item.completed
                            ? 'bg-teal-600 text-white'
                            : 'border-2 border-neutral-300 dark:border-neutral-600'
                        }`}
                      >
                        {item.completed && <Check size={12} />}
                      </span>
                      <span className={`font-semibold truncate ${item.completed ? 'line-through' : ''}`}>
                        {item.title}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteErrand(item.id)}
                      className="p-1 text-neutral-400 hover:text-rose-500 rounded-lg cursor-pointer shrink-0"
                      title={isAr ? 'حذف' : 'Remove'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Life Errand */}
            <form onSubmit={handleAddErrand} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <input
                type="text"
                value={newErrandTitle}
                onChange={(e) => setNewErrandTitle(e.target.value)}
                placeholder={isAr ? 'أضف مهمة شخصية لليوم (مثال: تنظيف الغرفة، سوق الخضر...)' : 'Add a personal errand for today (e.g. Clean kitchen, Buy groceries)...'}
                className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
              <select
                value={newErrandCategory}
                onChange={(e) => setNewErrandCategory(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
              >
                <option value="cleaning">🧹 {isAr ? 'تنظيف' : 'Cleaning'}</option>
                <option value="market">🛒 {isAr ? 'سوق وتبضيع' : 'Market'}</option>
                <option value="prep">👕 {isAr ? 'غسيل وتجهيز' : 'Prep'}</option>
                <option value="errands">📋 {isAr ? 'شؤون عامة' : 'Errands'}</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-3xs"
              >
                <Plus size={14} />
                <span>{isAr ? 'إضافة' : 'Add'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {showPlannerModal && (
        <DayModePlannerModal
          isOpen={showPlannerModal}
          onClose={() => setShowPlannerModal(false)}
          dayProfileConfig={dayProfileConfig}
          habits={activeHabits}
          onSaveConfig={onSaveConfig}
          onBulkUpdateHabitPolicies={onBulkUpdateHabitPolicies}
          lang={lang}
        />
      )}
    </>
  );
};

interface DayModePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayProfileConfig?: DayProfileConfig | null;
  habits: HabitItem[];
  onSaveConfig: (nextConfig: DayProfileConfig) => Promise<void> | void;
  onBulkUpdateHabitPolicies?: (
    updates: { habitId: string; policy: HabitDayModePolicy; activeOnModes?: DayModeType[] }[]
  ) => Promise<void> | void;
  lang?: 'en' | 'ar';
}

export const DayModePlannerModal: React.FC<DayModePlannerModalProps> = ({
  isOpen,
  onClose,
  dayProfileConfig,
  habits,
  onSaveConfig,
  onBulkUpdateHabitPolicies,
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';

  const [tab, setTab] = useState<'schedule' | 'policies'>('schedule');
  const [weekdayModes, setWeekdayModes] = useState<Record<string, DayModeType>>(
    () => ({ ...(dayProfileConfig?.recurringWeekdayModes || {}) })
  );
  const [templateItems, setTemplateItems] = useState<ErrandsTemplateItem[]>(
    () =>
      dayProfileConfig?.defaultErrandsTemplate && dayProfileConfig.defaultErrandsTemplate.length > 0
        ? [...dayProfileConfig.defaultErrandsTemplate]
        : [...DEFAULT_ERRANDS_TEMPLATE]
  );
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplCategory, setNewTplCategory] = useState<'cleaning' | 'market' | 'errands' | 'prep' | 'custom'>('cleaning');

  // Local editable map of habitId -> HabitDayModePolicy & custom activeOnModes
  const [policyDraft, setPolicyDraft] = useState<Record<string, HabitDayModePolicy>>(() => {
    const map: Record<string, HabitDayModePolicy> = {};
    habits.forEach((h) => {
      if (h.id) map[h.id] = getHabitDayModePolicy(h);
    });
    return map;
  });
  const [customModesDraft, setCustomModesDraft] = useState<Record<string, DayModeType[]>>(() => {
    const map: Record<string, DayModeType[]> = {};
    habits.forEach((h) => {
      if (h.id) map[h.id] = getHabitActiveOffDayModes(h);
    });
    return map;
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setWeekdayModes({ ...(dayProfileConfig?.recurringWeekdayModes || {}) });
    setTemplateItems(
      dayProfileConfig?.defaultErrandsTemplate && dayProfileConfig.defaultErrandsTemplate.length > 0
        ? [...dayProfileConfig.defaultErrandsTemplate]
        : [...DEFAULT_ERRANDS_TEMPLATE]
    );
  }, [dayProfileConfig]);

  useEffect(() => {
    const map: Record<string, HabitDayModePolicy> = {};
    const customMap: Record<string, DayModeType[]> = {};
    habits.forEach((h) => {
      if (h.id) {
        map[h.id] = getHabitDayModePolicy(h);
        customMap[h.id] = getHabitActiveOffDayModes(h);
      }
    });
    setPolicyDraft(map);
    setCustomModesDraft(customMap);
  }, [habits]);

  if (!isOpen) return null;

  const weekdays = [
    { dow: '1', labelEn: 'Mon', labelAr: 'الإثنين' },
    { dow: '2', labelEn: 'Tue', labelAr: 'الثلاثاء' },
    { dow: '3', labelEn: 'Wed', labelAr: 'الأربعاء' },
    { dow: '4', labelEn: 'Thu', labelAr: 'الخميس' },
    { dow: '5', labelEn: 'Fri', labelAr: 'الجمعة' },
    { dow: '6', labelEn: 'Sat', labelAr: 'السبت' },
    { dow: '0', labelEn: 'Sun', labelAr: 'الأحد' },
  ];

  const handleAddTemplateItem = () => {
    const t = newTplTitle.trim();
    if (!t) return;
    setTemplateItems((prev) => [
      ...prev,
      {
        id: `tpl-${Date.now().toString(36)}`,
        title: t,
        titleAr: t,
        category: newTplCategory,
      },
    ]);
    setNewTplTitle('');
  };

  const handleSetAllPolicies = (policy: HabitDayModePolicy) => {
    const next: Record<string, HabitDayModePolicy> = {};
    habits.forEach((h) => {
      if (h.id) next[h.id] = policy;
    });
    setPolicyDraft(next);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig({
        recurringWeekdayModes: weekdayModes,
        dateOverrides: dayProfileConfig?.dateOverrides || {},
        defaultErrandsTemplate: templateItems,
        updatedAt: Date.now(),
      });

      if (onBulkUpdateHabitPolicies) {
        const changed: { habitId: string; policy: HabitDayModePolicy; activeOnModes?: DayModeType[] }[] = [];
        habits.forEach((h) => {
          if (!h.id) return;
          const nextPol = policyDraft[h.id] || 'execution_only';
          const prevPol = getHabitDayModePolicy(h);
          const nextModes = nextPol === 'custom' ? (customModesDraft[h.id] || []) : [];
          const prevModes = [...getHabitActiveOffDayModes(h)].sort().join(',');
          const nextModesKey = [...nextModes].sort().join(',');

          if (prevPol !== nextPol || (nextPol === 'custom' && prevModes !== nextModesKey)) {
            changed.push({
              habitId: h.id,
              policy: nextPol,
              activeOnModes: nextPol === 'custom' ? nextModes : undefined,
            });
          }
        });
        if (changed.length > 0) {
          await onBulkUpdateHabitPolicies(changed);
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to save Day Mode config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-[#18191D] w-full max-w-2xl rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto ${
          isAr ? 'text-right' : ''
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#151619] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                {isAr ? 'نظام أوضاع الأيام وشؤون الحياة' : 'Day Modes & Life Maintenance Rules'}
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {isAr
                  ? 'حدد أيام التنظيف والتبضيع أو الراحة أسبوعياً، واختر أي العادات تبقى نشطة وأيها يُحمى تلقائياً.'
                  : 'Automate your weekly Cleaning/Errands or Rest days, and decide which habits stay active vs auto-shielded.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="px-4 sm:px-5 pt-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('schedule')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'schedule'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} />
              <span>{isAr ? 'الجدول الأسبوعي وقائمة التبضيع/التنظيف' : 'Weekly Rules & Errands Template'}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('policies')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'policies'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Sliders size={13} />
              <span>
                {isAr ? `سياسة العادات (${habits.length})` : `Habit Policies (${habits.length})`}
              </span>
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {tab === 'schedule' ? (
            <>
              {/* Recurring Weekly Rules */}
              <div className="space-y-2.5">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    {isAr ? '1. الوضع الافتراضي لأيام الأسبوع' : '1. Recurring Weekly Day Modes'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isAr
                      ? 'مثلاً: اجعل يوم الأحد "شؤون البيت والتبضيع" تلقائياً دون الحاجة لتجميد العادات يدوياً.'
                      : 'Example: Set Sunday to "Life & Errands" automatically so your routines adapt every week with zero manual freezes.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {weekdays.map((w) => {
                    const currentMode = weekdayModes[w.dow] || 'execution';
                    return (
                      <div
                        key={w.dow}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/70 dark:bg-neutral-800/50"
                      >
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          {isAr ? w.labelAr : w.labelEn}
                        </span>
                        <select
                          value={currentMode}
                          onChange={(e) =>
                            setWeekdayModes((prev) => ({
                              ...prev,
                              [w.dow]: e.target.value as DayModeType,
                            }))
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer"
                        >
                          {DAY_MODE_ORDER.map((m) => (
                            <option key={m} value={m}>
                              {DAY_MODE_META[m].emoji}{' '}
                              {isAr ? DAY_MODE_META[m].shortAr : DAY_MODE_META[m].shortEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Default Life & Errands Checklist Template */}
              <div className="space-y-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    {isAr ? '2. قالب مهام البيت والتبضيع التلقائي' : '2. Default Life & Errands Checklist Template'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isAr
                      ? 'تُحمّل هذه القائمة عند تفعيل وضع "شؤون البيت والتبضيع" لأي يوم.'
                      : 'Automatically loaded whenever a day is switched to Life & Errands Day.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  {templateItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/70 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span>
                          {item.category === 'cleaning'
                            ? '🧹'
                            : item.category === 'market'
                            ? '🛒'
                            : item.category === 'prep'
                            ? '👕'
                            : '📋'}
                        </span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {isAr && item.titleAr ? item.titleAr : item.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTemplateItems((prev) => prev.filter((x) => x.id !== item.id))}
                        className="p-1 text-neutral-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newTplTitle}
                    onChange={(e) => setNewTplTitle(e.target.value)}
                    placeholder={isAr ? 'أضف مهمة متكررة (مثلاً: ترتيب المكتب، شراء الفواكه)...' : 'Add recurring errand (e.g. Clean desk, Buy groceries)...'}
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
                  />
                  <select
                    value={newTplCategory}
                    onChange={(e) => setNewTplCategory(e.target.value as any)}
                    className="px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold cursor-pointer"
                  >
                    <option value="cleaning">🧹 {isAr ? 'تنظيف' : 'Cleaning'}</option>
                    <option value="market">🛒 {isAr ? 'سوق' : 'Market'}</option>
                    <option value="prep">👕 {isAr ? 'تجهيز' : 'Prep'}</option>
                    <option value="errands">📋 {isAr ? 'شؤون' : 'Errands'}</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddTemplateItem}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{isAr ? 'إضافة للقالب' : 'Add'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Shield size={14} className="text-sky-500" />
                  <span>{isAr ? 'كيف تتصرف كل عادة في أيام التنظيف / الراحة / السفر؟' : 'How should each habit behave on Off / Errands / Travel days?'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
                      ⚓ {isAr ? 'ثابتة دائماً (Anchor)' : 'Always On (Anchor)'}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {isAr ? 'تبقى مطلوبة كل يوم (صلاة، ماء، نوم).' : 'Active even on Rest, Cleaning & Travel days.'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800/60">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 block">
                      🎒 {isAr ? 'محمولة (Portable)' : 'Portable'}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {isAr ? 'نشطة في السفر والتبضيع، محمية في الراحة.' : 'Active on Errands & Travel; shielded on Rest.'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-sky-200 dark:border-sky-800/60">
                    <span className="font-extrabold text-sky-600 dark:text-sky-400 block">
                      🛡️ {isAr ? 'أيام التنفيذ فقط' : 'Execution Only'}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {isAr ? 'تُحمى تلقائياً في أيام التنظيف والراحة والسفر.' : 'Auto-shielded on Errands, Rest & Travel days.'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-neutral-500">
                    {isAr ? 'تعيين الكل:' : 'Set all:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSetAllPolicies('always_active')}
                    className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold cursor-pointer"
                  >
                    ⚓ {isAr ? 'ثابتة' : 'Always On'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllPolicies('portable')}
                    className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold cursor-pointer"
                  >
                    🎒 {isAr ? 'محمولة' : 'Portable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllPolicies('execution_only')}
                    className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold cursor-pointer"
                  >
                    🛡️ {isAr ? 'أيام التنفيذ فقط' : 'Execution Only'}
                  </button>
                </div>
              </div>

              {habits.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-4">
                  {isAr ? 'لا توجد عادات نشطة حالياً.' : 'No active habits found.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {habits.map((h) => {
                    if (!h.id) return null;
                    const pol = policyDraft[h.id] || 'execution_only';
                    const activeCustom = customModesDraft[h.id] || [];
                    return (
                      <div
                        key={h.id}
                        className="flex flex-col gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800/50"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">{h.icon || '🔥'}</span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                {h.title}
                              </div>
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                {h.category}
                              </div>
                            </div>
                          </div>

                          <div className="inline-flex flex-wrap p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-bold shrink-0">
                            <button
                              type="button"
                              onClick={() => setPolicyDraft((prev) => ({ ...prev, [h.id!]: 'always_active' }))}
                              className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                                pol === 'always_active'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              ⚓ {isAr ? 'دائماً' : 'Always'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPolicyDraft((prev) => ({ ...prev, [h.id!]: 'portable' }))}
                              className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                                pol === 'portable'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              🎒 {isAr ? 'محمولة' : 'Portable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPolicyDraft((prev) => ({ ...prev, [h.id!]: 'execution_only' }))}
                              className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                                pol === 'execution_only'
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              🛡️ {isAr ? 'تنفيذ فقط' : 'Exec Only'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPolicyDraft((prev) => ({ ...prev, [h.id!]: 'custom' }))}
                              className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                                pol === 'custom'
                                  ? 'bg-violet-600 text-white shadow-xs'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                              }`}
                            >
                              🎯 {isAr ? 'مخصص' : 'Custom'}
                            </button>
                          </div>
                        </div>

                        {pol === 'custom' && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
                            <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300">
                              {isAr ? 'نشطة أيضاً في:' : 'Active on:'}
                            </span>
                            {OFF_DAY_MODES.map((m) => {
                              const meta = DAY_MODE_META[m];
                              const checked = activeCustom.includes(m);
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    setCustomModesDraft((prev) => {
                                      const cur = prev[h.id!] || [];
                                      const next = cur.includes(m)
                                        ? cur.filter((x) => x !== m)
                                        : [...cur, m];
                                      return { ...prev, [h.id!]: next };
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-all ${
                                    checked
                                      ? 'bg-violet-600 text-white border-violet-600'
                                      : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                                  }`}
                                >
                                  {meta.emoji} {isAr ? meta.shortAr : meta.shortEn}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#151619] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer transition-all active:scale-95"
          >
            {isSaving
              ? isAr
                ? 'جاري الحفظ...'
                : 'Saving...'
              : isAr
              ? 'حفظ القواعد وتطبيقها'
              : 'Save Rules & Policies'}
          </button>
        </div>
      </div>
    </div>
  );
};
