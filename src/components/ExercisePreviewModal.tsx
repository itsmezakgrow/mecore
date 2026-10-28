import React from 'react';
import { X, Dumbbell, Zap, Target, CheckCircle2, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { getExerciseImagePath, getExerciseSpec } from '../utils/exerciseAssets';

interface ExercisePreviewModalProps {
  exerciseName: string | null;
  onClose: () => void;
  lang?: 'en' | 'ar';
}

export const ExercisePreviewModal: React.FC<ExercisePreviewModalProps> = ({
  exerciseName,
  onClose,
  lang = 'en'
}) => {
  if (!exerciseName) return null;

  const isAr = lang === 'ar';
  const imagePath = getExerciseImagePath(exerciseName);
  const spec = getExerciseSpec(exerciseName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{spec.icon}</span>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {exerciseName}
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                {isAr ? spec.categoryAr : spec.categoryEn}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Exercise Image / GIF Display */}
        <div className="relative w-full h-64 bg-slate-950 flex items-center justify-center overflow-hidden group">
          <img
            src={imagePath}
            alt={exerciseName}
            className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const fallback = parent.querySelector('.modal-fallback-icon');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />
          <div className="modal-fallback-icon hidden w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <Dumbbell size={48} className="text-emerald-500 mb-2 animate-bounce" />
            <span className="text-sm font-bold text-white">{exerciseName}</span>
          </div>

          {/* Badge over image */}
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
            <Sparkles size={12} />
            <span>{isAr ? 'عرض الحركة والتكنيك' : 'Motion Guide'}</span>
          </div>
        </div>

        {/* Specifications & Double Progression Rules */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {/* Target Rep Range */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                {isAr ? 'نطاق التكرارات' : 'Rep Range'}
              </span>
              <p className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {spec.repRangeMin} - {spec.repRangeMax} {isAr ? 'تكرار' : 'reps'}
              </p>
            </div>

            {/* Load Step */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                {isAr ? 'خطوة الزيادة' : 'Load Step'}
              </span>
              <p className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{spec.incrementStep} kg
              </p>
            </div>

            {/* Type */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                {isAr ? 'نوع التمرين' : 'Type'}
              </span>
              <p className="text-[11px] font-black text-slate-700 dark:text-neutral-200 mt-0.5 truncate">
                {spec.categoryType === 'heavy_compound'
                  ? (isAr ? 'مركّب ثقيل' : 'Heavy Compound')
                  : spec.categoryType === 'back_leg_machine'
                  ? (isAr ? 'آلة / كابل' : 'Machine / Cable')
                  : (isAr ? 'عزل عضلي' : 'Isolation')}
              </p>
            </div>
          </div>

          {/* Execution Cues */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>{isAr ? 'توجيه الأداء والتكنيك الصحيح:' : 'Execution & Form Cue:'}</span>
            </div>
            <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
              {isAr ? spec.executionCueAr : spec.executionCueEn}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-neutral-900/60 border-t border-slate-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-neutral-800 text-white font-bold text-xs cursor-pointer hover:bg-slate-800 dark:hover:bg-neutral-700 transition-all"
          >
            {isAr ? 'إغلاق المعاينة' : 'Close Preview'}
          </button>
        </div>
      </div>
    </div>
  );
};
