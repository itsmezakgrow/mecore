import React, { useState } from 'react';
import { Snowflake, Shield, Calendar, Check, X, Sparkles, FileText, Clock, HelpCircle } from 'lucide-react';
import { HabitItem } from '../types';
import { soundManager } from '../utils/soundEffects';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface BulkExcuseLoggerModalProps {
  habits: HabitItem[];
  isOpen: boolean;
  onClose: () => void;
  onApplyFreeze: (habit: HabitItem, dateKey: string, excuse: string) => Promise<void>;
  lang?: 'en' | 'ar';
}

const COMMON_EXCUSES_AR = [
  '🎯 تركيز استثنائي على مشروع / قراءة مكثفة',
  '👥 زيارات عائلية / مناسبة اجتماعية',
  '💼 انشغال بظرف عمل أو خفر عاجل',
  '🤒 عائق صحي / استراحة واستشفاء',
  '✈️ سفر / خارج المكان المعتاد',
  '🔋 توقف متعمد لتفريغ الذهن ومنع الإرهاق'
];

const COMMON_EXCUSES_EN = [
  '🎯 Sprint Focus on Project / Deep Reading',
  '👥 Family Visit / Social Event',
  '💼 Urgent Work Deadline or Emergency',
  '🤒 Health issue / Recovery Rest Day',
  '✈️ Travel / Out of Town',
  '🔋 Intentional Pause / Burnout Prevention'
];

export const BulkExcuseLoggerModal: React.FC<BulkExcuseLoggerModalProps> = ({
  habits,
  isOpen,
  onClose,
  onApplyFreeze,
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Selection states
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(
    habits.map((h) => h.id).filter(Boolean) as string[]
  );
  
  // Date range or specific dates
  const [dateSelectionMode, setDateSelectionMode] = useState<'preset' | 'range' | 'recent_missed'>('recent_missed');
  const [startDate, setStartDate] = useState<string>(yesterday);
  const [endDate, setEndDate] = useState<string>(today);

  // Generate last 7 days list for manual check-boxes
  const getRecentDays = () => {
    const list: { iso: string; label: string; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      list.push({ iso, label, isToday: i === 0 });
    }
    return list;
  };

  const recentDays = getRecentDays();
  const [selectedDays, setSelectedDays] = useState<string[]>([yesterday]);

  // Excuse selection
  const excusesList = isAr ? COMMON_EXCUSES_AR : COMMON_EXCUSES_EN;
  const [selectedExcuse, setSelectedExcuse] = useState<string>(excusesList[0]);
  const [customExcuse, setCustomExcuse] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleSelectHabit = (id: string) => {
    setSelectedHabitIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllHabits = () => {
    if (selectedHabitIds.length === habits.length) {
      setSelectedHabitIds([]);
    } else {
      setSelectedHabitIds(habits.map((h) => h.id).filter(Boolean) as string[]);
    }
  };

  const toggleSelectDay = (iso: string) => {
    setSelectedDays((prev) =>
      prev.includes(iso) ? prev.filter((item) => item !== iso) : [...prev, iso]
    );
  };

  // Compute final list of dates to freeze
  const getTargetDates = (): string[] => {
    if (dateSelectionMode === 'recent_missed') {
      return selectedDays;
    }
    
    // Date range calculation
    const dates: string[] = [];
    if (!startDate || !endDate) return dates;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return dates;

    const curr = new Date(start);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const targetDates = getTargetDates();
  const selectedHabitObjects = habits.filter((h) => h.id && selectedHabitIds.includes(h.id));

  const handleApplyBulk = async () => {
    if (targetDates.length === 0 || selectedHabitObjects.length === 0) return;

    setIsSubmitting(true);
    try {
      const finalExcuse = isCustom ? (customExcuse.trim() || selectedExcuse) : selectedExcuse;

      for (const habit of selectedHabitObjects) {
        for (const dateKey of targetDates) {
          await onApplyFreeze(habit, dateKey, finalExcuse);
        }
      }

      soundManager.playFreeze();
      onClose();
    } catch (err) {
      console.error('Failed bulk excuse application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#18191D] rounded-3xl border border-neutral-200 dark:border-[#2A2C33] shadow-2xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Snowflake size={24} className="text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full font-mono">
                {isAr ? 'نظام المرونة والجدية الحازمة' : 'Firm & Flexible Recovery Shield'}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {isAr ? 'تسجيل عذر وسياق استثنائي لأيام سابقة' : 'Log Excuses & Context for Missed Days'}
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 overscroll-contain bg-white dark:bg-[#18191D]">
          
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs leading-relaxed text-indigo-950 dark:text-indigo-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-100">
              <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? 'العقل للتفكير وليس للتذكر (Clear Your Mind)' : 'Offload your mind & keep stats realistic'}</span>
            </div>
            <p className="text-[11px] opacity-90">
              {isAr
                ? 'حدد الأيام التي لم تمارس فيها العادات لظروف استثنائية (زيارات، تركيز مكثف على القراءة أو مشروع عاجل). سيتم حماية السلسلة وتسجيل العذر بالكامل للتحليل الشهري.'
                : 'Select days you missed due to legitimate external context. Streak momentum is protected while logging the excuse for end-of-month audit.'}
            </p>
          </div>

          {/* STEP 1: Select Habits */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-mono text-[10px] flex items-center justify-center font-bold">1</span>
                <span>{isAr ? 'العادات المستهدفة:' : 'Target Habits:'}</span>
              </label>
              <button
                type="button"
                onClick={toggleSelectAllHabits}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {selectedHabitIds.length === habits.length
                  ? (isAr ? 'إلغاء تحديد الكل' : 'Deselect All')
                  : (isAr ? 'تحديد الكل' : 'Select All')}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50">
              {habits.map((habit) => {
                const isSelected = Boolean(habit.id && selectedHabitIds.includes(habit.id));
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => habit.id && toggleSelectHabit(habit.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-2xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <span>{habit.icon || '🔥'}</span>
                    <span>{habit.title}</span>
                    {isSelected && <Check size={12} className="ml-1 rtl:mr-1 rtl:ml-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Select Missed Days or Range */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-mono text-[10px] flex items-center justify-center font-bold">2</span>
              <span>{isAr ? 'الأيام المراد حمايتها وتبريرها:' : 'Select Days to Protect & Justify:'}</span>
            </label>

            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setDateSelectionMode('recent_missed')}
                className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  dateSelectionMode === 'recent_missed'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {isAr ? 'أيام سابقة محددة' : 'Specific Days'}
              </button>
              <button
                type="button"
                onClick={() => setDateSelectionMode('range')}
                className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  dateSelectionMode === 'range'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {isAr ? 'نطاق تواريخ (من - إلى)' : 'Date Range (From - To)'}
              </button>
            </div>

            {dateSelectionMode === 'recent_missed' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {recentDays.map((day) => {
                  const isSelected = selectedDays.includes(day.iso);
                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => toggleSelectDay(day.iso)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 shadow-2xs'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <div className="flex flex-col text-left rtl:text-right">
                        <span className="text-[11px]">{day.label}</span>
                        <span className="text-[9px] font-mono text-neutral-400">{day.iso}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                    {isAr ? 'من تاريخ:' : 'Start Date:'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                    {isAr ? 'إلى تاريخ:' : 'End Date:'}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Excuse / Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-mono text-[10px] flex items-center justify-center font-bold">3</span>
              <span>{isAr ? 'العذر أو السياق الظرفي:' : 'Formal Excuse or Context:'}</span>
            </label>

            <div className="grid grid-cols-1 gap-1.5">
              {excusesList.map((excuse) => (
                <button
                  key={excuse}
                  type="button"
                  onClick={() => {
                    setSelectedExcuse(excuse);
                    setIsCustom(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left rtl:text-right text-xs transition-all flex items-center justify-between cursor-pointer ${
                    !isCustom && selectedExcuse === excuse
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-200 font-semibold shadow-2xs'
                      : 'bg-neutral-50/60 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{excuse}</span>
                  {!isCustom && selectedExcuse === excuse && (
                    <Check size={14} className="text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}

              {/* Custom Excuse */}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`p-2.5 rounded-xl border text-left rtl:text-right text-xs transition-all flex items-center justify-between cursor-pointer ${
                  isCustom
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-200 font-semibold shadow-2xs'
                    : 'bg-neutral-50/60 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span>✏️ {isAr ? 'سبب مخصص آخر (مثلاً: تركيز على مهارة كذا...)' : 'Other custom context reason...'}</span>
                {isCustom && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
              </button>
            </div>

            {isCustom && (
              <input
                type="text"
                placeholder={isAr ? 'اكتب السبب المخصص بالتفصيل...' : 'Type custom excuse...'}
                value={customExcuse}
                onChange={(e) => setCustomExcuse(e.target.value)}
                className="w-full p-2.5 text-xs bg-white dark:bg-neutral-800 border-2 border-blue-400 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
              />
            )}
          </div>

          {/* Summary Badge */}
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-between text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">
            <span>{isAr ? 'إجمالي التأثير:' : 'Total Impact:'}</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              {selectedHabitObjects.length} {isAr ? 'عادات' : 'habits'} × {targetDates.length} {isAr ? 'أيام' : 'days'} = {selectedHabitObjects.length * targetDates.length} {isAr ? 'تجميد موثق' : 'excused entries'}
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 dark:bg-[#141518] border-t border-neutral-200 dark:border-[#2A2C33] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={isSubmitting || targetDates.length === 0 || selectedHabitObjects.length === 0}
            onClick={handleApplyBulk}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Shield size={14} />
            <span>
              {isSubmitting
                ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                : (isAr ? `تطبيق الحماية والأعذار (${selectedHabitObjects.length * targetDates.length})` : `Apply Context Protection (${selectedHabitObjects.length * targetDates.length})`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
