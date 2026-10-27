import React, { useState } from 'react';
import { Layers, Target, Calendar, Plus, Check, Trash2, X, Edit2, RotateCcw, Activity, Ban } from 'lucide-react';
import { LifePhase } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface PhaseFocusManagerProps {
  isOpen: boolean;
  onClose: () => void;
  phases: LifePhase[];
  activePhaseId?: string;
  onSelectActivePhase: (phaseId: string) => Promise<void>;
  onCreatePhase: (phase: Omit<LifePhase, 'id'>) => Promise<void>;
  onUpdatePhase?: (phaseId: string, updated: Partial<LifePhase>) => Promise<void>;
  onDeletePhase: (phaseId: string) => Promise<void>;
  onResetPhases?: () => void;
  onClearAllPhases?: () => void;
  lang?: 'en' | 'ar';
}

const DEFAULT_CATEGORIES = ['Business', 'Personal', 'Health', 'Learning', 'Finance'];

export const PhaseFocusManager: React.FC<PhaseFocusManagerProps> = ({
  isOpen,
  onClose,
  phases,
  activePhaseId,
  onSelectActivePhase,
  onCreatePhase,
  onUpdatePhase,
  onDeletePhase,
  onResetPhases,
  onClearAllPhases,
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';
  const todayIso = new Date().toISOString().split('T')[0];

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState('');
  
  const [weights, setWeights] = useState<Record<string, number>>({
    Business: 60,
    Personal: 40,
    Health: 0,
    Learning: 0,
    Finance: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalWeight = (Object.values(weights) as number[]).reduce((a: number, b: number) => a + b, 0);

  const handleWeightChange = (cat: string, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [cat]: Math.max(0, Math.min(100, val)),
    }));
  };

  const handleStartEdit = (phase: LifePhase) => {
    setEditingPhaseId(phase.id || null);
    setName(phase.name);
    setDescription(phase.description || '');
    setStartDate(phase.startDate || todayIso);
    setEndDate(phase.endDate || '');
    setWeights({
      Business: phase.categoryWeights?.Business ?? 0,
      Personal: phase.categoryWeights?.Personal ?? 0,
      Health: phase.categoryWeights?.Health ?? 0,
      Learning: phase.categoryWeights?.Learning ?? 0,
      Finance: phase.categoryWeights?.Finance ?? 0,
      ...phase.categoryWeights,
    });
    setShowAddForm(true);
  };

  const handleResetForm = () => {
    setEditingPhaseId(null);
    setName('');
    setDescription('');
    setStartDate(todayIso);
    setEndDate('');
    setWeights({
      Business: 60,
      Personal: 40,
      Health: 0,
      Learning: 0,
      Finance: 0,
    });
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingPhaseId && onUpdatePhase) {
        await onUpdatePhase(editingPhaseId, {
          name: name.trim(),
          description: description.trim() || undefined,
          startDate: startDate || todayIso,
          endDate: endDate || undefined,
          categoryWeights: weights,
        });
      } else {
        await onCreatePhase({
          name: name.trim(),
          description: description.trim() || undefined,
          startDate: startDate || todayIso,
          endDate: endDate || undefined,
          isActive: true,
          categoryWeights: weights,
          createdAt: Date.now(),
        });
      }
      handleResetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePhase = phases.find((p) => p.id === activePhaseId || p.isActive);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn" 
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#18191D] rounded-3xl border border-neutral-200 dark:border-[#2A2C33] shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-5 text-white flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Target size={24} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-mono">
                {isAr ? 'مراحل التركيز الاستراتيجي' : 'Strategic Focus Phases'}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {isAr ? 'توزيع نسب الأولويات والمراحل' : 'Life Focus & Priority Allocation'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Active Phase Banner */}
        {activePhase ? (
          <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-indigo-600 text-white px-2 py-0.2 rounded-full font-mono">
                    <Activity size={11} className="animate-pulse" />
                    {isAr ? 'المرحلة النشطة حالياً' : 'Current Active Phase'}
                  </span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                    📅 {activePhase.startDate} {activePhase.endDate ? `→ ${activePhase.endDate}` : `(${isAr ? 'مستمرة' : 'Ongoing'})`}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-1">
                  {activePhase.name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                {Object.entries(activePhase.categoryWeights || {}).filter(([_, w]) => Number(w) > 0).map(([cat, weight]) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-3xs"
                  >
                    <span>{cat}:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{weight}%</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
            <span>{isAr ? 'لا توجد مرحلة نشطة حالياً - الحسابات قياسية ومتوازنة.' : 'No active phase set - standard balanced scoring applied.'}</span>
          </div>
        )}

        {/* Content area */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain bg-white dark:bg-[#18191D]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md">
              {isAr 
                ? 'تساعدك المراحل على تعديل وزن الأولويات (مثل 70% عمل و30% شخصي) حتى تظهر المهام العاجلة للمرحلة في صدارة لوحة التحكم. يمكنك تعديل أو حذف أي مرحلة.' 
                : 'Calibrate your priority algorithm so urgent tasks for your dominant focus rise to the top. You can edit, disable, or delete any phase.'}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (showAddForm) handleResetForm();
                  else setShowAddForm(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white flex items-center gap-1.5 hover:bg-indigo-700 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Plus size={13} />
                <span>{showAddForm ? (isAr ? 'إغلاق النموذج' : 'Close Form') : (isAr ? 'إضافة مرحلة جديدة' : 'New Phase')}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                  {editingPhaseId 
                    ? (isAr ? 'تعديل المرحلة الحالية' : 'Edit Life Phase') 
                    : (isAr ? 'إعداد مرحلة تركيز جديدة' : 'Configure New Life Phase')}
                </h4>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'اسم المرحلة' : 'Phase Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: إطلاق مشروع Q4، فترة اختبارات، استشفاء ورياضة...' : 'e.g., Q4 Business Sprint, Exam Season, Health Reset...'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'الوصف / ملاحظات' : 'Description / Focus Notes'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'الهدف الرئيسي من هذه المرحلة...' : 'Main objective for this phase...'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'تاريخ البدء' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'تاريخ الانتهاء (اختياري)' : 'End Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'إجمالي النسب' : 'Total Allocation'}
                  </label>
                  <div className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl border text-center ${
                    totalWeight === 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {totalWeight}% {totalWeight === 100 ? '✓ (100%)' : '(Target: 100%)'}
                  </div>
                </div>
              </div>

              {/* Weight sliders */}
              <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {isAr ? 'تحديد النسب المئوية للمجالات:' : 'Category Percentage Focus:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <div key={cat} className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{cat}</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{weights[cat] || 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={weights[cat] || 0}
                        onChange={(e) => handleWeightChange(cat, Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingPhaseId ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'حفظ وتفعيل المرحلة' : 'Save & Activate')}
                </button>
              </div>
            </form>
          )}

          {/* List of Phases */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                {isAr ? 'سجل المراحل والمخططات الزمنية' : 'Phase History & Timelines'}
              </h4>
              <div className="flex items-center gap-2">
                {onResetPhases && (
                  <button
                    type="button"
                    onClick={onResetPhases}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>{isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
                  </button>
                )}
                {onClearAllPhases && phases.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAllPhases}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>{isAr ? 'مسح الكل' : 'Clear All'}</span>
                  </button>
                )}
              </div>
            </div>

            {phases.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40">
                <Layers size={28} className="mx-auto text-indigo-400 opacity-60 mb-2" />
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'لم يتم إنشاء مراحل بعد' : 'No custom phases defined yet'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {isAr ? 'انقر على "إضافة مرحلة جديدة" لتخصيص تركيزك الحالي.' : 'Click "New Phase" to set your business/personal focus.'}
                </p>
              </div>
            ) : (
              phases.map((phase) => {
                const isActive = (phase.id && phase.id === activePhaseId) || phase.isActive;

                return (
                  <div
                    key={phase.id || phase.name}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {phase.name}
                        </h4>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.2 rounded-full font-mono">
                            <Check size={11} />
                            {isAr ? 'نشطة' : 'Active'}
                          </span>
                        ) : null}
                      </div>

                      {phase.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
                          {phase.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                        <Calendar size={12} />
                        <span>{phase.startDate} {phase.endDate ? `→ ${phase.endDate}` : `(${isAr ? 'مستمرة' : 'Ongoing'})`}</span>
                      </div>

                      {/* Category weights */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(phase.categoryWeights || {}).filter(([_, w]) => Number(w) > 0).map(([cat, weight]) => (
                          <span
                            key={cat}
                            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                          >
                            {cat}: {weight}%
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(phase)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                        title={isAr ? 'تعديل المرحلة' : 'Edit phase'}
                      >
                        <Edit2 size={13} />
                      </button>

                      {!isActive && phase.id && (
                        <button
                          type="button"
                          onClick={() => onSelectActivePhase(phase.id!)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-3xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Activity size={12} />
                          <span>{isAr ? 'تفعيل' : 'Activate'}</span>
                        </button>
                      )}

                      {isActive && phase.id && (
                        <button
                          type="button"
                          onClick={() => onSelectActivePhase('')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title={isAr ? 'إلغاء تفعيل المرحلة والعودة للوزن الافتراضي' : 'Deactivate phase'}
                        >
                          <Ban size={12} />
                          <span>{isAr ? 'تعطيل' : 'Deactivate'}</span>
                        </button>
                      )}

                      {phase.id && (
                        <button
                          type="button"
                          onClick={() => onDeletePhase(phase.id!)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title={isAr ? 'حذف المرحلة' : 'Delete phase'}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-500">
            {isAr ? 'يتم حفظ كافة الفترات مع تواريخها تلقائياً.' : 'Phase timelines are saved permanently.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
