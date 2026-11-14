import React, { useState } from 'react';
import { X, Dumbbell, Zap, Target, ShieldCheck, Sparkles, Layers, Flame, Scale, Info, Activity, Timer } from 'lucide-react';
import { getExerciseImagePath, getExerciseSpec, getAvailableWeightsForExercise, getNextProgressionWeight, isCardioExercise } from '../utils/exerciseAssets';
import { calculateEquipmentBreakdown, EquipmentBreakdown } from '../utils/equipmentCalculator';
import { CARDIO_MIN_DURATION, CARDIO_MAX_DURATION } from '../utils/progressiveOverloadCoach';

interface ExercisePreviewModalProps {
  exerciseName: string | null;
  targetWeightKg?: number;
  previousWeightKg?: number;
  previousRepsSummary?: string;
  targetReps?: number;
  onClose: () => void;
  lang?: 'en' | 'ar';
}

export const ExercisePreviewModal: React.FC<ExercisePreviewModalProps> = ({
  exerciseName,
  targetWeightKg = 20,
  previousWeightKg,
  previousRepsSummary,
  targetReps = 10,
  onClose,
  lang = 'en'
}) => {
  if (!exerciseName) return null;

  const isAr = lang === 'ar';
  const imagePath = getExerciseImagePath(exerciseName);
  const spec = getExerciseSpec(exerciseName);
  const isCardio = !!spec.isCardio || isCardioExercise(exerciseName);
  const availableWeights = getAvailableWeightsForExercise(exerciseName);

  // Editable local weight state for interactive calculator
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(targetWeightKg);
  const [customBaseWeight, setCustomBaseWeight] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'equipment_calculator' | 'form_technique'>('equipment_calculator');

  // Calculate equipment breakdown only for strength movements
  const breakdown: EquipmentBreakdown | null = !isCardio
    ? calculateEquipmentBreakdown(exerciseName, currentWeightKg, customBaseWeight)
    : null;

  // Quick weight adjustment helpers using the next available weight in the array
  const handleNextStep = () => {
    const { nextWeight } = getNextProgressionWeight(exerciseName, currentWeightKg);
    setCurrentWeightKg(nextWeight);
  };

  const handlePrevStep = () => {
    const idx = availableWeights.indexOf(currentWeightKg);
    if (idx > 0) {
      setCurrentWeightKg(availableWeights[idx - 1]);
    } else {
      const lower = [...availableWeights].reverse().find(w => w < currentWeightKg);
      if (lower !== undefined) setCurrentWeightKg(lower);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-scaleUp text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{spec.icon}</span>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {exerciseName}
                {(isAr ? spec.subtitleAr : spec.subtitleEn) ? ` (${isAr ? spec.subtitleAr : spec.subtitleEn})` : ''}
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

        {/* Tab Selector: Equipment Loading / Cardio Protocol vs Form Guidance */}
        <div className="flex border-b border-slate-100 dark:border-neutral-800 px-5 bg-slate-50/50 dark:bg-neutral-900/50 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('equipment_calculator')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'equipment_calculator'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isCardio ? <Activity size={15} /> : <Scale size={15} />}
            <span>
              {isCardio
                ? (isAr ? 'خوارزمية تطور الكارديو' : 'Cardio Overload Rules')
                : (isAr ? 'حاسبة أوزان المعدات والأقراص' : 'Equipment & Plate Loader')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('form_technique')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'form_technique'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={15} />
            <span>{isAr ? 'عرض الحركة والتكنيك' : 'Motion & Form Guide'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">

          {activeTab === 'equipment_calculator' ? (
            isCardio ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                        <Timer size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 block">
                          {isAr ? 'نظام التدرج القلبي والتنفسي (15–30 دقيقة)' : 'Cardio Progressive Overload (15–30 mins)'}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-neutral-300">
                          {previousRepsSummary ? `${isAr ? 'آخر أداء:' : 'Last:'} ${previousRepsSummary}` : (isAr ? 'تدرج ذكي للمدة والشدة' : 'Smart Duration & Intensity Progression')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{isAr ? 'الحد الأدنى للمدة' : 'Min Duration'}</span>
                      <span className="text-lg font-mono font-black text-sky-600 dark:text-sky-400">{CARDIO_MIN_DURATION} mins</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{isAr ? 'الحد الأقصى للمدة' : 'Max Duration'}</span>
                      <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">{CARDIO_MAX_DURATION} mins</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">{isAr ? 'السرعة الافتراضية' : 'Default Intensity'}</span>
                      <span className="text-lg font-mono font-black text-slate-900 dark:text-white">
                        {spec.defaultSpeedRpm ?? 1} {spec.speedUnit || 'level'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-1">
                    <span className="font-black text-sky-600 dark:text-sky-400 block">
                      {isAr ? 'السيناريو B — بناء التحمل (< 30 دقيقة):' : 'Scenario B — Building Stamina (< 30 mins):'}
                    </span>
                    <p className="text-slate-600 dark:text-neutral-300 leading-relaxed">
                      {isAr
                        ? 'حافظ على نفس السرعة والميلان، وأضف +2 دقيقة في كل حصة قادمة حتى تصل إلى 30 دقيقة.'
                        : 'Keep Speed/RPM & Incline/Resistance steady, and add +2 minutes next session until you reach 30 mins.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                    <span className="font-black text-emerald-700 dark:text-emerald-400 block">
                      {isAr ? 'السيناريو A — إتقان التحمل (30 دقيقة × حصتين متتاليتين):' : 'Scenario A — Endurance Mastered (30 mins × 2 consecutive sessions):'}
                    </span>
                    <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed">
                      {isAr
                        ? 'عند إتمام 30 دقيقة بنفس الشدة لحصتين متتاليتين، ارفع السرعة أو المقاومة +1 مستوى وأعد المدة إلى 15 دقيقة.'
                        : 'After hitting 30 mins at the same Speed/Incline for 2 consecutive sessions, increase Speed or Incline by +1 level and reset Duration to 15 mins.'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck size={15} />
                    <span>{isAr ? 'توجيه الأداء الصحيح:' : 'Execution & Form Cue:'}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                    {isAr ? spec.executionCueAr : spec.executionCueEn}
                  </p>
                </div>
              </div>
            ) : breakdown ? (
            <div className="space-y-5">
              
              {/* Target Weight Interactive Dial */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200/80 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Target size={14} className="text-emerald-500" />
                    <span>{isAr ? 'الوزن المستهدف للجلسة:' : 'Target Workout Weight:'}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-[11px] font-mono font-bold text-slate-700 dark:text-neutral-200 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer"
                      title={isAr ? 'الوزن السابق المتاح في الصالة' : 'Previous gym increment'}
                    >
                      {isAr ? '⬇️ السابق' : '⬇️ Prev'}
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold shadow-xs transition-all cursor-pointer"
                      title={isAr ? 'الوزن التالي المتاح في الصالة' : 'Next gym increment'}
                    >
                      {isAr ? '⬆️ التالي' : '⬆️ Next Step'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-neutral-950 p-3 rounded-xl border border-slate-200 dark:border-neutral-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {currentWeightKg}
                    </span>
                    <span className="text-sm font-bold text-slate-400">kg ({Math.round(currentWeightKg * 2.20462)} lbs)</span>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {isAr ? breakdown.categoryLabelAr : breakdown.categoryLabelEn}
                  </span>
                </div>

                {/* Available Gym Weights Array Selector */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    {isAr ? 'الأوزان المتوفرة في الجيم لهذا التمرين:' : 'Available Commercial Gym Weights for This Exercise:'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap max-h-28 overflow-y-auto p-1 bg-white/50 dark:bg-neutral-950/50 rounded-xl border border-slate-200/60 dark:border-neutral-800/60">
                    {availableWeights.map((w) => {
                      const isMatch = Math.abs(w - currentWeightKg) < 0.05;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setCurrentWeightKg(w)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            isMatch
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {w}kg
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* EXACT LOAD PER REPETITION SPOTLIGHT CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-teal-500/10 border-2 border-emerald-500/30 dark:border-emerald-500/40 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Scale size={16} />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block leading-tight">
                        {isAr ? 'وزن التكرار الواحد (Load Per Repetition)' : 'Exact Load Per Repetition'}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400">
                        {isAr ? 'الوزن الدقيق الذي ترفعه في كل تكرار (Rep) واحد' : 'What you actually lift and move on every single rep'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {breakdown.isSingleImplement 
                      ? (isAr ? 'أداة فردية واحدة' : '1 Single Implement')
                      : (isAr ? 'زوج أوزان متناظر' : 'Bilateral Pair')}
                  </span>
                </div>

                {/* 3 Metric Summary Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Metric 1: Weight Per Rep */}
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-neutral-950/80 border border-emerald-500/20 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isAr ? 'الوزن في كل تكرار:' : 'Weight Per Rep:'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {breakdown.weightPerRepKg}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">kg</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-neutral-400 leading-tight mt-1">
                      {breakdown.isSingleImplement
                        ? (isAr ? 'دامبل واحد بوزن كامل' : '1x dumbbell moved per rep')
                        : (isAr ? `${breakdown.weightPerHandKg} كجم في كل يد` : `${breakdown.weightPerHandKg}kg per hand combined`)}
                    </p>
                  </div>

                  {/* Metric 2: Commercial Equipment Setup */}
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-neutral-950/80 border border-emerald-500/20 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isAr ? 'تجهيز الأداة في الصالة:' : 'Gym Equipment Setup:'}
                    </span>
                    <p className="text-xs font-black text-slate-900 dark:text-white mt-1 leading-snug">
                      {breakdown.category === 'dumbbell'
                        ? (breakdown.isSingleImplement 
                            ? `1x ${currentWeightKg}kg Dumbbell`
                            : `2x ${currentWeightKg}kg Dumbbells`)
                        : breakdown.category === 'cable_pin_stack'
                        ? `Pin #${breakdown.pinNumber} (${currentWeightKg}kg Stack)`
                        : `${breakdown.baseStructureWeightKg}kg Bar + ${breakdown.perSideWeightKg}kg/side`}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-neutral-400 leading-tight mt-0.5">
                      {isAr ? breakdown.categoryLabelAr : breakdown.categoryLabelEn}
                    </p>
                  </div>

                  {/* Metric 3: Progression Step & Volume */}
                  <div className="p-3 rounded-xl bg-white/90 dark:bg-neutral-950/80 border border-emerald-500/20 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isAr ? 'التطور والهدف:' : 'Progression Step:'}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-xs font-bold">
                      <span className="text-slate-400">
                        {previousWeightKg !== undefined ? `${previousWeightKg}kg` : `${Math.max(2.5, currentWeightKg - 2.5)}kg`}
                      </span>
                      <span className="text-emerald-500">➔</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">
                        {currentWeightKg}kg
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-tight mt-0.5">
                      {targetReps} reps • {breakdown.weightPerRepKg * targetReps}kg volume
                    </p>
                  </div>
                </div>

                {/* Practical Execution Guidance */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                  <Info size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs text-emerald-950 dark:text-emerald-200">
                    <p className="font-bold">
                      {isAr ? breakdown.perRepExplanationAr : breakdown.perRepExplanationEn}
                    </p>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                      💡 {isAr ? breakdown.howToHoldAr : breakdown.howToHoldEn}
                    </p>
                  </div>
                </div>
              </div>

              {/* DUMBBELL DISPLAY */}
              {breakdown.category === 'dumbbell' && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/30">
                    <Dumbbell size={24} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {isAr ? breakdown.dumbbellPairLabelAr : breakdown.dumbbellPairLabelEn}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      {availableWeights.includes(currentWeightKg)
                        ? (isAr ? '✓ وزن متوفر في الصالة الرياضية لهذا التمرين' : '✓ Standard available commercial gym weight')
                        : (isAr ? '⚠️ وزن مخصص: اختر من قائمة الأوزان المتوفرة أعلاه' : '⚠️ Non-standard step: pick from available weights above')}
                    </p>
                  </div>
                </div>
              )}

              {/* SELECTORIZED PIN STACK DISPLAY */}
              {breakdown.category === 'cable_pin_stack' && (
                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                      <Layers size={15} />
                      <span>{isAr ? 'وضع الأنشوطة في البرغي (Pin Stack Selector):' : 'Pin Stack Position:'}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500 text-white">
                      Pin #{breakdown.pinNumber}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-sky-200 dark:border-sky-800/40 text-center space-y-1">
                    <p className="text-base font-black text-sky-900 dark:text-sky-200">
                      {isAr
                        ? `ضع المسمار (Pin) عند البلاطة رقم ${breakdown.pinNumber}`
                        : `Insert selector pin at Plate #${breakdown.pinNumber}`}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                      ({breakdown.pinNumber} plates × {breakdown.stackStepKg}kg per plate = {breakdown.targetWeightKg}kg total)
                    </p>
                  </div>
                </div>
              )}

              {/* BARBELL / PLATE LOADED MACHINE BREAKDOWN */}
              {(breakdown.category === 'barbell' || breakdown.category === 'plate_loaded_machine') && (
                <div className="space-y-4">
                  {/* Base Bar / Sled Structure Options */}
                  <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                    <span className="font-bold text-slate-600 dark:text-neutral-400">
                      {isAr ? 'وزن الحامل / البار الأولي:' : 'Base Structure Weight:'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(breakdown.category === 'plate_loaded_machine'
                        ? [0, 15, 20, 25]
                        : [10, 15, 20]
                      ).map((bW) => (
                        <button
                          key={bW}
                          type="button"
                          onClick={() => setCustomBaseWeight(bW)}
                          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                            breakdown.baseStructureWeightKg === bW
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200'
                          }`}
                        >
                          {bW}kg
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Plate Loader Diagram (Each Side) */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={14} />
                        <span>{isAr ? 'تركيب الأقراص لكل جهة (Per-Side Plate Loading):' : 'Plates Per Side:'}</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {breakdown.perSideWeightKg} kg / side
                      </span>
                    </div>

                    {/* Plates Breakdown Chips */}
                    {breakdown.perSidePlates.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap bg-slate-950/80 p-3 rounded-xl border border-neutral-800">
                          {breakdown.perSidePlates.map((plate, pIdx) => (
                            <div
                              key={pIdx}
                              className="px-3 py-1.5 rounded-xl font-mono text-xs font-black flex items-center gap-2 shadow-md border border-white/10"
                              style={{ backgroundColor: plate.colorHex, color: '#FFFFFF' }}
                            >
                              <span>{plate.count}x</span>
                              <span>{plate.weightKg} kg</span>
                            </div>
                          ))}
                        </div>

                        {/* Visual Barbell End Illustration */}
                        <div className="flex items-center justify-center gap-1 py-2 overflow-x-auto">
                          {/* Sleeve Bar */}
                          <div className="w-12 h-3 bg-slate-500 rounded-l-md shrink-0"></div>
                          <div className="w-2 h-8 bg-slate-400 rounded-xs shrink-0"></div>

                          {/* Plates visual stack */}
                          {breakdown.perSidePlates.flatMap((p) =>
                            Array.from({ length: p.count }).map((_, i) => (
                              <div
                                key={`${p.weightKg}-${i}`}
                                className="h-16 w-4 rounded-sm border border-white/20 flex items-center justify-center text-[9px] font-black font-mono text-white shadow-lg shrink-0"
                                style={{ backgroundColor: p.colorHex }}
                                title={`${p.weightKg} kg plate`}
                              >
                                {p.weightKg}
                              </div>
                            ))
                          )}
                          <div className="w-3 h-5 bg-amber-400 rounded-r-xs shrink-0" title="Collar Lock"></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-2">
                        {isAr ? 'الوزن يطابق البار الخالي فقط دون أقراص إضافية.' : 'Weight equals empty bar/sled. No additional plates needed.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* WARM-UP SETS PYRAMID */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Flame size={14} />
                    <span>{isAr ? 'مجموعات التسخين والتهيئة العصبية (Warm-up Sets):' : 'Recommended Warm-up Pyramid:'}</span>
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-300 font-bold">
                    {isAr ? 'لا تحسب ضمن مجموعات التمرين الفعلي' : 'Do not log as working sets'}
                  </span>
                </div>

                <div className="space-y-2">
                  {breakdown.warmupSets.map((ws) => (
                    <div
                      key={ws.setNumber}
                      className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-amber-500/20 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-neutral-200 block">
                          {isAr ? ws.labelAr : ws.labelEn}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-neutral-400">
                          {isAr ? ws.noteAr : ws.noteEn}
                        </span>
                      </div>

                      <div className="text-right font-mono font-black text-amber-600 dark:text-amber-400 text-sm shrink-0">
                        {ws.weightKg} kg × {ws.reps} reps
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            ) : null
          ) : (
            /* MOTION & FORM GUIDE TAB */
            <div className="space-y-4">
              {/* Image / GIF Display */}
              <div className="relative w-full h-60 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-neutral-800">
                <img
                  src={imagePath}
                  alt={exerciseName}
                  className="w-full h-full object-contain p-2"
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
              </div>

              {/* Execution Cues */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={15} />
                  <span>{isAr ? 'توجيه الأداء والتكنيك الصحيح:' : 'Execution & Form Cue:'}</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
                  {isAr ? spec.executionCueAr : spec.executionCueEn}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isCardio ? (isAr ? 'نطاق المدة' : 'Duration Range') : (isAr ? 'نطاق التكرارات' : 'Target Reps')}
                  </span>
                  <p className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {isCardio ? `${CARDIO_MIN_DURATION} - ${CARDIO_MAX_DURATION} mins` : `${spec.repRangeMin} - ${spec.repRangeMax} reps`}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isCardio ? (isAr ? 'التدرج' : 'Cardio Overload') : (isAr ? 'خطوة التطور' : 'Progression Step')}
                  </span>
                  <p className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {isCardio ? '+2 mins / +1 Lv' : `+${spec.incrementStep} kg`}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-neutral-900/60 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            {isAr ? `تمرين: ${exerciseName}` : `Exercise: ${exerciseName}`}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
          >
            {isAr ? 'إغلاق الحاسبة' : 'Close Breakdown'}
          </button>
        </div>
      </div>
    </div>
  );
};
