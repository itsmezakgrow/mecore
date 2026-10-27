import React, { useState } from 'react';
import { Calendar, TrendingUp, BookOpen, ChevronRight, X, AlertCircle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { ReviewEntry } from '../types';

interface ReviewPromptBannerProps {
  reviews?: ReviewEntry[];
  appStartDate?: string;
  onOpenWeekly: () => void;
  onOpenMonthly: () => void;
  onOpenArchive: () => void;
  lang?: 'en' | 'ar';
}

export const ReviewPromptBanner: React.FC<ReviewPromptBannerProps> = ({
  reviews = [],
  appStartDate,
  onOpenWeekly,
  onOpenMonthly,
  onOpenArchive,
  lang = 'ar',
}) => {
  const [dismissed, setDismissed] = useState<boolean>(false);
  const isAr = lang === 'ar';

  // Compute current week key (e.g. 2026-W41)
  const today = new Date();
  const year = today.getFullYear();
  const firstJan = new Date(year, 0, 1);
  const dayNr = Math.ceil((today.getTime() - firstJan.getTime()) / 86400000);
  const weekNr = Math.ceil((dayNr + firstJan.getDay()) / 7);
  const currentWeekKey = `${year}-W${weekNr.toString().padStart(2, '0')}`;

  // Compute current month key (e.g. 2026-10)
  const currentMonthKey = `${year}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  // Check start date (grace period for clean starts / new accounts)
  const startDateStr = appStartDate || (typeof window !== 'undefined' ? localStorage.getItem('app_start_date') : null);
  let startDate = startDateStr ? new Date(startDateStr) : new Date();
  if (isNaN(startDate.getTime())) {
    startDate = new Date();
  }

  // Days elapsed since clean start / app registration
  const daysSinceStart = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const isInGracePeriod = daysSinceStart < 7;
  const daysRemainingInGrace = Math.max(1, 7 - daysSinceStart);

  // Check if weekly review for current week is completed
  const hasCompletedWeekly = reviews.some(
    (r) => r.type === 'weekly' && r.periodKey === currentWeekKey
  );

  // Is today Saturday (6) or Sunday (0)?
  const isSunday = today.getDay() === 0;
  const isSaturday = today.getDay() === 6;

  // MANDATORY REQUIREMENT:
  // Must NOT be mandatory if in 7-day grace period for new/clean starts!
  const isMandatory = !hasCompletedWeekly && !isInGracePeriod;

  if (dismissed && !isMandatory) {
    return null;
  }

  return (
    <div className="mb-5 relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-emerald-500/10 dark:from-amber-950/40 dark:via-neutral-900/60 dark:to-emerald-950/30 border border-amber-500/30 dark:border-amber-500/20 p-4 transition-all duration-300 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl text-white shadow-md ${
            isMandatory 
              ? 'bg-amber-500 shadow-amber-500/20 animate-bounce' 
              : isInGracePeriod 
                ? 'bg-blue-600 shadow-blue-600/20'
                : 'bg-emerald-600 shadow-emerald-600/20'
          }`}>
            {isMandatory ? <ShieldAlert className="w-5 h-5" /> : isInGracePeriod ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                {isAr ? 'تذكير التقييم والتحليل الدوري' : 'Periodic Audit & Review Reminder'}
              </h3>

              {isInGracePeriod ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-500 text-white shadow-3xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {isAr 
                    ? `الأسبوع الأول (فترة انطلاقة): باقي ${daysRemainingInGrace} أيام على أول تحليل إجباري` 
                    : `First Week (Fresh Start): ${daysRemainingInGrace} days until first mandatory review`}
                </span>
              ) : isMandatory ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-rose-500 text-white shadow-3xs flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  {isAr ? 'إجباري: التحليل الأسبوعي مطلوب!' : 'Mandatory: Weekly Review Required!'}
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500 text-white shadow-3xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isAr ? 'تم تحليل هذا الأسبوع بنجاح' : 'Weekly Review Done'}
                </span>
              )}

              {(isSunday || isSaturday) && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {isSunday ? (isAr ? 'اليوم الأحد (يوم المراجعة)' : 'Sunday Reset') : (isAr ? 'اليوم السبت (نهاية الأسبوع)' : 'Saturday Reset')}
                </span>
              )}
            </div>

            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
              {isInGracePeriod
                ? (isAr
                    ? 'أهلاً بك في انطلاقتك الجديدة! أنت في أسبوعك الأول. سيبدأ التكليف بالتحليل الأسبوعي الإجباري بعد انقضاء 7 أيام لجمع بياناتك الأولى.'
                    : 'Welcome to your fresh start! You are in your first week. Mandatory weekly review will begin after 7 days of logging.')
                : isMandatory
                  ? (isAr
                      ? 'لم تقم بعد بإكمال التحليل الأسبوعي لهذا الأسبوع. هذا التذكير سيظل يظهر يومياً حتى تقوم بتسجيل تحليل الأسبوع وتوثيق أعذارك وإنجازاتك للحفاظ على الانضباط والصدق مع الذات.'
                      : 'You have not completed this week’s review. This prompt will stay visible daily until logged to maintain self-honesty and clarity.')
                  : (isAr
                      ? 'ممتاز! تم تسجيل تحليلك الأسبوعي. يمكنك مراجعة تحاليل الأسابيع السابقة أو تجميعها في التحليل الشهري.'
                      : 'Awesome! Your weekly audit is recorded. You can inspect previous reviews or run your monthly audit.')}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={onOpenWeekly}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition cursor-pointer ${
              isMandatory 
                ? 'bg-amber-500 hover:bg-amber-600 ring-2 ring-amber-400/50 animate-pulse' 
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {isAr ? 'بدء التحليل الأسبوعي' : 'Weekly Review'}
          </button>

          <button
            onClick={onOpenMonthly}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {isAr ? 'التحليل الشهري' : 'Monthly Review'}
          </button>

          <button
            onClick={onOpenArchive}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition cursor-pointer"
            title={isAr ? 'الأرشيف والسجل' : 'Archive'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dismiss button ONLY available if not mandatory */}
          {!isMandatory && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
              title={isAr ? 'إخفاء التذكير' : 'Dismiss'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
