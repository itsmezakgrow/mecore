import React, { useState } from 'react';
import { Snowflake, Shield, AlertCircle, X, Check, Clock } from 'lucide-react';
import { HabitItem } from '../types';
import { soundManager } from '../utils/soundEffects';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface StreakFreezeModalProps {
  habit: HabitItem;
  dateKey: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyFreeze: (habit: HabitItem, dateKey: string, excuse: string) => Promise<void>;
  onRemoveFreeze: (habit: HabitItem, dateKey: string) => Promise<void>;
  lang?: 'en' | 'ar';
}

const COMMON_EXCUSES_EN = [
  '🤒 Sick / Under the weather',
  '✈️ Traveling / Away from home',
  '🏖️ Rest & Active Recovery day',
  '💼 Urgent Work or Family emergency',
  '🔋 Low energy / Burnout prevention',
  '🌧️ Severe weather / External obstacle'
];

const COMMON_EXCUSES_AR = [
  '🤒 وعكة صحية / مريض',
  '✈️ سفر / خارج المنزل',
  '🏖️ يوم راحة واستشفاء متعمد',
  '💼 ظرف عمل أو عائلي طارئ',
  '🔋 انخفاض طاقة / تجنب الإرهاق',
  '🌧️ عائق خارجي / ظروف قاهرة'
];

export const StreakFreezeModal: React.FC<StreakFreezeModalProps> = ({
  habit,
  dateKey,
  isOpen,
  onClose,
  onApplyFreeze,
  onRemoveFreeze,
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';
  const isAlreadyFrozen = Boolean(habit.freezes && habit.freezes[dateKey]);
  const currentExcuse = habit.freezeExcuses?.[dateKey] || '';

  const excuses = isAr ? COMMON_EXCUSES_AR : COMMON_EXCUSES_EN;
  const [selectedExcuse, setSelectedExcuse] = useState<string>(currentExcuse || excuses[0]);
  const [customExcuse, setCustomExcuse] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentStreak = habit.streak || 0;
  const bankedCredits = habit.bankedFreezes ?? Math.min(5, Math.max(1, 1 + Math.floor(currentStreak / 14)));

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      const finalExcuse = isCustom ? (customExcuse.trim() || selectedExcuse) : selectedExcuse;
      await onApplyFreeze(habit, dateKey, finalExcuse);
      soundManager.playFreeze();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      await onRemoveFreeze(habit, dateKey);
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
        {/* Header with cool icy gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-5 text-white relative shrink-0">
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
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-mono">
                {isAr ? 'حماية واستشفاء السلسلة' : 'Streak Protection Shield'}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {isAlreadyFrozen 
                  ? (isAr ? 'تعديل تجميد العادة' : 'Manage Habit Streak Freeze')
                  : (isAr ? 'تجميد السلسلة لهذا اليوم' : 'Freeze Habit for Date')}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain bg-white dark:bg-[#18191D]">
          {/* Habit Info & Banked Credits */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">
                {isAr ? 'العادة المستهدفة' : 'Target Habit'}
              </span>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span>{habit.icon || '🔥'}</span>
                <span>{habit.title}</span>
              </h4>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                📅 {dateKey}
              </span>
            </div>

            <div className="text-right rtl:text-left">
              <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                {isAr ? 'رصيد التجميد المتاح' : 'Banked Freezes'}
              </div>
              <div className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 dark:text-blue-300 text-sm">
                <Shield size={14} className="text-blue-500" />
                <span>{bankedCredits} {isAr ? 'أيام' : 'days'}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {isAr 
              ? 'تجميد السلسلة يمنع انقطاع عداد أيامك المتتالية عند حدوث ظرف طارئ. سجل العذر لتوثيق نمطك الواقعي.' 
              : 'Freezing protects your active streak from resetting during emergencies or rest days without cheating your stats.'}
          </p>

          {/* Excuse Options */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {isAr ? 'سبب أو عذر التجميد:' : 'Reason / Excuse for Freeze:'}
            </label>

            <div className="grid grid-cols-1 gap-1.5">
              {excuses.map((excuse) => (
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
                      : 'bg-neutral-50/60 dark:bg-[#1E2025] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#262830]'
                  }`}
                >
                  <span>{excuse}</span>
                  {!isCustom && selectedExcuse === excuse && (
                    <Check size={14} className="text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))}

              {/* Custom Reason option */}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`p-2.5 rounded-xl border text-left rtl:text-right text-xs transition-all flex items-center justify-between cursor-pointer ${
                  isCustom
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-950 dark:text-blue-200 font-semibold shadow-2xs'
                    : 'bg-neutral-50/60 dark:bg-[#1E2025] border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#262830]'
                }`}
              >
                <span>✏️ {isAr ? 'سبب مخصص آخر...' : 'Other custom reason...'}</span>
                {isCustom && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
              </button>
            </div>

            {isCustom && (
              <input
                type="text"
                placeholder={isAr ? 'اكتب العذر باختصار...' : 'Enter your specific freeze excuse...'}
                value={customExcuse}
                onChange={(e) => setCustomExcuse(e.target.value)}
                className="w-full mt-2 p-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-[#1E2025] text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-[#151619] border-t border-neutral-200 dark:border-[#2A2C33] flex items-center justify-between gap-2 shrink-0">
          {isAlreadyFrozen ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRemove}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء التجميد' : 'Unfreeze Habit'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-[#262830] rounded-xl text-xs font-semibold cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          )}

          <button
            type="button"
            disabled={isSubmitting || (isCustom && !customExcuse.trim())}
            onClick={handleApply}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Shield size={14} />
            <span>
              {isSubmitting 
                ? (isAr ? 'جاري التطبيق...' : 'Applying...') 
                : isAlreadyFrozen 
                ? (isAr ? 'تحديث العذر' : 'Update Freeze') 
                : (isAr ? 'تأكيد وحماية السلسلة' : 'Confirm Freeze')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
