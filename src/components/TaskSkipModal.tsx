import React, { useState } from 'react';
import { Clock, Calendar, ArrowRight, X, Check, HelpCircle } from 'lucide-react';
import { TaskItem, TaskSkipReason } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface TaskSkipModalProps {
  task: TaskItem;
  isOpen: boolean;
  onClose: () => void;
  onRolloverTask: (task: TaskItem, newDate: string, skipReason: string) => Promise<void>;
  lang?: 'en' | 'ar';
}

const COMMON_TASK_REASONS_EN = [
  '⏰ Ran out of time / Underestimated scope',
  '🔋 Low energy / Mental fatigue',
  '⏳ Blocked / Waiting on someone or info',
  '🎯 Deprioritized for higher urgent focus',
  '⚡ Unexpected emergency / interruption',
  '😴 Postponed intentionally for fresh morning energy'
];

const COMMON_TASK_REASONS_AR = [
  '⏰ ضيق الوقت / المهمة تطلبت وقتاً أطول',
  '🔋 انخفاض الطاقة / الإرهاق الذهني',
  '⏳ معلقة / بانتظار رد أو معلومات من طرف آخر',
  '🎯 تأجيل لصالح أولوية أكثر إلحاحاً اليوم',
  '⚡ ظرف أو مقاطعة طارئة غير متوقعة',
  '😴 تأجيل متعمد للبدء بها بنشاط صباح الغد'
];

export const TaskSkipModal: React.FC<TaskSkipModalProps> = ({
  task,
  isOpen,
  onClose,
  onRolloverTask,
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';
  const reasons = isAr ? COMMON_TASK_REASONS_AR : COMMON_TASK_REASONS_EN;

  // Calculate tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  const [targetDate, setTargetDate] = useState<string>(tomorrowIso);
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentRollovers = task.rolloverCount || 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalReason = isCustom ? (customReason.trim() || selectedReason) : selectedReason;
      await onRolloverTask(task, targetDate, finalReason);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-[#18191D] rounded-3xl border border-neutral-200 dark:border-[#2A2C33] shadow-2xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-mono">
                {isAr ? 'ترحيل المهمة وتحليل السبب' : 'Task Rollover & Reflection'}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {isAr ? 'ترحيل المهمة إلى يوم آخر' : 'Reschedule / Roll Over Task'}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain bg-white dark:bg-[#18191D]">
          {/* Task Info & Rollover Counter */}
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
              {isAr ? 'المهمة الحالية' : 'Task'}
            </span>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
              {task.title}
            </h4>
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-mono pt-1">
              <span>📅 {isAr ? 'الموعد الحالي:' : 'Current due:'} {task.dueDate || (isAr ? 'غير محدد' : 'No date')}</span>
              {currentRollovers > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded-md">
                  ⚠️ {currentRollovers} {isAr ? 'مرات ترحيل سابقة' : 'previous rollovers'}
                </span>
              )}
            </div>
          </div>

          {/* New Due Date Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Calendar size={13} className="text-amber-500" />
              <span>{isAr ? 'ترحيل إلى تاريخ:' : 'Reschedule to Date:'}</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <HelpCircle size={13} className="text-amber-500" />
              <span>{isAr ? 'لماذا تم تأجيلها اليوم؟ (لتوثيق أسباب الإنتاجية)' : 'Why was this skipped/postponed today?'}</span>
            </label>

            <div className="grid grid-cols-1 gap-1.5">
              {reasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setSelectedReason(reason);
                    setIsCustom(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs text-left rtl:text-right font-medium transition-all flex items-center justify-between cursor-pointer ${
                    !isCustom && selectedReason === reason
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 font-bold shadow-2xs'
                      : 'bg-white dark:bg-[#1E2025] border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  <span>{reason}</span>
                  {!isCustom && selectedReason === reason && <Check size={14} className="text-amber-600 dark:text-amber-400" />}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`w-full p-2.5 rounded-xl border text-xs text-left rtl:text-right font-medium transition-all flex items-center justify-between cursor-pointer ${
                  isCustom
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 font-bold shadow-2xs'
                    : 'bg-white dark:bg-[#1E2025] border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                }`}
              >
                <span>✏️ {isAr ? 'سبب مخصص آخر...' : 'Other custom reason...'}</span>
                {isCustom && <Check size={14} className="text-amber-600 dark:text-amber-400" />}
              </button>
            </div>

            {isCustom && (
              <input
                type="text"
                placeholder={isAr ? 'اكتب سبب التأجيل بدقة...' : 'Explain custom rollover rationale...'}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full mt-2 p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#1E2025] text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-[#151619] border-t border-neutral-200 dark:border-[#2A2C33] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-[#262830] rounded-xl text-xs font-semibold cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={isSubmitting || (isCustom && !customReason.trim())}
            onClick={handleSubmit}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <span>{isSubmitting ? (isAr ? 'جاري الترحيل...' : 'Rolling over...') : (isAr ? 'ترحيل المهمة' : 'Roll Over Task')}</span>
            <ArrowRight size={14} className="rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
