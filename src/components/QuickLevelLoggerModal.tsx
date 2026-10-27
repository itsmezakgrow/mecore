import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Minus, 
  Plus, 
  RotateCcw, 
  Award, 
  Flame, 
  Target,
  Sliders,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface QuickLevelLoggerModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  currentValue: number;
  targetValue: number;
  unit?: string;
  color?: string;
  onSave: (value: number) => void;
  onClose: () => void;
  isAr?: boolean;
}

export const QuickLevelLoggerModal: React.FC<QuickLevelLoggerModalProps> = ({
  isOpen,
  title,
  subtitle,
  currentValue,
  targetValue,
  unit = 'units',
  color = 'amber',
  onSave,
  onClose,
  isAr = false,
}) => {
  useBodyScrollLock(isOpen);
  const [val, setVal] = useState<number>(currentValue || 0);

  useEffect(() => {
    if (isOpen) {
      setVal(currentValue || 0);
    }
  }, [isOpen, currentValue]);

  if (!isOpen) return null;

  const target = targetValue && targetValue > 0 ? targetValue : 10;
  const percentage = Math.min(150, Math.round((val / target) * 100));
  const isComplete = val >= target;

  const getTierInfo = (pct: number) => {
    if (pct >= 100) {
      return {
        levelName: isAr ? 'المستوى الذهبي / مكتمل 🏆' : 'Gold Tier / Mastered 🏆',
        bg: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
        border: 'border-amber-500'
      };
    }
    if (pct >= 75) {
      return {
        levelName: isAr ? 'المستوى المتقدم (75%) 🥇' : 'Advanced Tier (75%) 🥇',
        bg: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700',
        border: 'border-emerald-500'
      };
    }
    if (pct >= 50) {
      return {
        levelName: isAr ? 'المستوى الفضي (50%) 🥈' : 'Silver Tier (50%) 🥈',
        bg: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700',
        border: 'border-blue-500'
      };
    }
    if (pct >= 25) {
      return {
        levelName: isAr ? 'المستوى البرونزي (25%) 🥉' : 'Bronze Tier (25%) 🥉',
        bg: 'bg-purple-500',
        text: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700',
        border: 'border-purple-500'
      };
    }
    return {
      levelName: isAr ? 'البداية (قيد التقدم) 🚀' : 'Getting Started 🚀',
      bg: 'bg-neutral-400',
      text: 'text-neutral-600 dark:text-neutral-400',
      badgeBg: 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
      border: 'border-neutral-400'
    };
  };

  const tier = getTierInfo(percentage);

  const handleStep = (delta: number) => {
    const next = Math.max(0, Math.round((val + delta) * 10) / 10);
    setVal(next);
  };

  const handleSetPercent = (pct: number) => {
    const calculated = Math.round(((target * pct) / 100) * 10) / 10;
    setVal(calculated);
    if (pct >= 100) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
      });
    }
  };

  const handleApply = () => {
    onSave(val);
    if (val >= target && currentValue < target) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
      });
    }
    onClose();
  };

  // Radius for SVG gauge
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, percentage) / 100) * circumference;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-[#2A2C33] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp text-neutral-900 dark:text-neutral-100 my-auto ${
          isAr ? 'text-right' : 'text-left'
        }`}
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Pinned Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2A2C33] bg-[#FAF9F7] dark:bg-[#151619]">
          <div className="min-w-0 flex-1 pr-3 rtl:pr-0 rtl:pl-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tier.badgeBg}`}>
                {tier.levelName}
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-white truncate mt-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 font-mono">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#262830] transition-colors cursor-pointer shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar overscroll-contain bg-white dark:bg-[#18191D]">
          {/* Circular Progress Gauge & Number Input */}
          <div className="flex items-center justify-center gap-5 sm:gap-6 bg-neutral-50/70 dark:bg-[#1E2025] p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="text-neutral-200 dark:text-neutral-800 stroke-current"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className={`${tier.text} stroke-current transition-all duration-300`}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white font-mono">
                  {percentage}%
                </span>
                <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">
                  {isComplete ? (isAr ? 'مكتمل' : 'Complete') : (isAr ? 'المستوى' : 'Level')}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {isAr ? 'الكمية المنجزة' : 'Logged Progress'}
              </div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={val === 0 ? '0' : val}
                  onChange={(e) => setVal(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 px-3 py-1 text-2xl font-black rounded-xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#18191D] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center font-mono"
                />
                <span className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400">
                  / {target} {unit}
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {val >= target 
                  ? (isAr ? '🎉 تم إنجاز الهدف بالكامل!' : '🎉 Target goal completed!') 
                  : (isAr ? `متبقي ${Math.max(0, Math.round((target - val) * 10) / 10)} ${unit}` : `${Math.max(0, Math.round((target - val) * 10) / 10)} ${unit} remaining`)}
              </p>
            </div>
          </div>

          {/* Continuous Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Sliders size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>{isAr ? 'مقياس الإنجاز السريع' : 'Level Slider'}</span>
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{val} {unit}</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(target, Math.ceil(target * 1.2))}
              step={target > 20 ? 1 : 0.5}
              value={val}
              onChange={(e) => setVal(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Quick Level Preset Buttons */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {isAr ? 'مستويات سريعة' : 'Quick Milestones'}
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleSetPercent(25)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  percentage >= 25 && percentage < 50
                    ? 'bg-purple-100 border-purple-400 text-purple-950 dark:bg-purple-950 dark:border-purple-600 dark:text-purple-200 shadow-xs'
                    : 'bg-neutral-50 dark:bg-[#1E2025] border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-[#262830] text-neutral-800 dark:text-neutral-200'
                }`}
              >
                🥉 25%
              </button>
              <button
                type="button"
                onClick={() => handleSetPercent(50)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  percentage >= 50 && percentage < 75
                    ? 'bg-blue-100 border-blue-400 text-blue-950 dark:bg-blue-950 dark:border-blue-600 dark:text-blue-200 shadow-xs'
                    : 'bg-neutral-50 dark:bg-[#1E2025] border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-[#262830] text-neutral-800 dark:text-neutral-200'
                }`}
              >
                🥈 50%
              </button>
              <button
                type="button"
                onClick={() => handleSetPercent(75)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  percentage >= 75 && percentage < 100
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-600 dark:text-emerald-200 shadow-xs'
                    : 'bg-neutral-50 dark:bg-[#1E2025] border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-[#262830] text-neutral-800 dark:text-neutral-200'
                }`}
              >
                🥇 75%
              </button>
              <button
                type="button"
                onClick={() => handleSetPercent(100)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  percentage >= 100
                    ? 'bg-amber-100 border-amber-400 text-amber-950 dark:bg-amber-950 dark:border-amber-600 dark:text-amber-200 shadow-xs'
                    : 'bg-neutral-50 dark:bg-[#1E2025] border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-[#262830] text-neutral-800 dark:text-neutral-200'
                }`}
              >
                🏆 100%
              </button>
            </div>
          </div>

          {/* Stepper Buttons (-5, -1, +1, +5, Reset) */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStep(-5)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold bg-neutral-50 dark:bg-[#1E2025] hover:bg-neutral-200/70 dark:hover:bg-[#262830] transition-colors cursor-pointer text-neutral-800 dark:text-neutral-200"
                title="-5"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold bg-neutral-50 dark:bg-[#1E2025] hover:bg-neutral-200/70 dark:hover:bg-[#262830] transition-colors cursor-pointer text-neutral-800 dark:text-neutral-200"
                title="-1"
              >
                -1
              </button>
            </div>

            <button
              type="button"
              onClick={() => setVal(0)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={11} />
              <span>{isAr ? 'تصفير' : 'Reset'}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStep(1)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold bg-neutral-50 dark:bg-[#1E2025] hover:bg-neutral-200/70 dark:hover:bg-[#262830] transition-colors cursor-pointer text-neutral-800 dark:text-neutral-200"
                title="+1"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => handleStep(5)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-bold bg-neutral-50 dark:bg-[#1E2025] hover:bg-neutral-200/70 dark:hover:bg-[#262830] transition-colors cursor-pointer text-neutral-800 dark:text-neutral-200"
                title="+5"
              >
                +5
              </button>
            </div>
          </div>

          {/* Hint tip */}
          <div className="p-3 bg-neutral-50 dark:bg-[#1E2025] border border-neutral-200 dark:border-neutral-800 rounded-2xl text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
            💡 {isAr 
              ? 'تلميح: على الهاتف، اضغط مطولاً على مربع الاختيار لتسجيل المستوى. على الحاسوب، انقر بالزر الأيمن (Right-click) للوصول السريع!'
              : 'Tip: On mobile, long-press the checkbox to log partial levels. On PC, right-click the checkbox for fast tracking!'}
          </div>
        </div>

        {/* Pinned Sticky Footer Actions - Guaranteed ALWAYS visible */}
        <div className="shrink-0 sticky bottom-0 p-3.5 sm:p-4 bg-white/95 dark:bg-[#18191D]/95 backdrop-blur-md border-t border-neutral-200 dark:border-[#2A2C33] flex items-center justify-end gap-2.5 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#262830] rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            id="btn-save-level-logger"
            onClick={handleApply}
            className="px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Check size={16} />
            <span>{isAr ? 'حفظ المستوى' : 'Save Level'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
