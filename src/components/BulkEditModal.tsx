import React, { useState } from 'react';
import { X, Edit3, Save, CheckSquare, Flame, Calendar, Tag } from 'lucide-react';
import { Priority } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'tasks' | 'habits';
  selectedCount: number;
  onApplyChanges: (updates: Record<string, any>) => Promise<any>;
  lang?: 'en' | 'ar';
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  type,
  selectedCount,
  onApplyChanges,
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';

  // Task fields
  const [updatePriority, setUpdatePriority] = useState(false);
  const [priority, setPriority] = useState<Priority>('High');
  const [updateCategory, setUpdateCategory] = useState(false);
  const [category, setCategory] = useState('Business');
  const [updateDueDate, setUpdateDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Habit fields
  const [updateHabitTarget, setUpdateHabitTarget] = useState(false);
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [updateHabitColor, setUpdateHabitColor] = useState(false);
  const [color, setColor] = useState('amber');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Record<string, any> = {};

    if (type === 'tasks') {
      if (updatePriority) updates.priority = priority;
      if (updateCategory) updates.category = category;
      if (updateDueDate) updates.dueDate = dueDate;
      if (updateStatus) {
        updates.completed = completed;
        updates.completedAt = completed ? Date.now() : undefined;
      }
    } else {
      if (updateCategory) updates.category = category;
      if (updateHabitTarget) updates.targetPerWeek = targetPerWeek;
      if (updateHabitColor) updates.color = color;
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onApplyChanges(updates);
      onClose();
    } catch (err) {
      console.error('Bulk edit failed:', err);
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
        className={`bg-white dark:bg-[#18191D] w-full max-w-md rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto ${
          isAr ? 'text-right' : ''
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE9E6] dark:border-[#2A2C33] bg-[#FAF9F7] dark:bg-[#151619] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900">
              <Edit3 size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#2F3437] dark:text-white">
                {isAr ? `تعديل جماعي (${selectedCount} عنصر)` : `Bulk Edit (${selectedCount} ${type})`}
              </h3>
              <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                {isAr ? 'حدد الخصائص التي ترغب في تطبيقها على كافة العناصر المحددة.' : 'Select which properties to overwrite on all selected items.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#787774] dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-[#262830] rounded-xl cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
          {type === 'tasks' ? (
            <>
              {/* Priority */}
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#2F3437] dark:text-white">
                  <input
                    type="checkbox"
                    checked={updatePriority}
                    onChange={(e) => setUpdatePriority(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{isAr ? 'تحديث مستوى الأولوية' : 'Update Priority'}</span>
                </label>
                {updatePriority && (
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs font-semibold text-[#2F3437] dark:text-white"
                  >
                    <option value="High">{isAr ? '🔴 أولوية قصوى (High)' : '🔴 High Priority'}</option>
                    <option value="Med">{isAr ? '🟡 أولوية متوسطة (Med)' : '🟡 Medium Priority'}</option>
                    <option value="Low">{isAr ? '🟢 أولوية منخفضة (Low)' : '🟢 Low Priority'}</option>
                  </select>
                )}
              </div>

              {/* Category */}
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#2F3437] dark:text-white">
                  <input
                    type="checkbox"
                    checked={updateCategory}
                    onChange={(e) => setUpdateCategory(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{isAr ? 'تحديث التصنيف' : 'Update Category'}</span>
                </label>
                {updateCategory && (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs font-semibold text-[#2F3437] dark:text-white"
                  >
                    <option value="Business">{isAr ? 'العمل والأعمال' : 'Business'}</option>
                    <option value="Personal">{isAr ? 'شخصي' : 'Personal'}</option>
                    <option value="Finance">{isAr ? 'المالية والاستثمار' : 'Finance'}</option>
                    <option value="Operations">{isAr ? 'العمليات والتشغيل' : 'Operations'}</option>
                    <option value="Strategy">{isAr ? 'الاستراتيجية والتخطيط' : 'Strategy'}</option>
                    <option value="Health">{isAr ? 'الصحة والعافية' : 'Health'}</option>
                  </select>
                )}
              </div>

              {/* Due Date */}
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#2F3437] dark:text-white">
                  <input
                    type="checkbox"
                    checked={updateDueDate}
                    onChange={(e) => setUpdateDueDate(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{isAr ? 'تحديث تاريخ الاستحقاق' : 'Update Due Date'}</span>
                </label>
                {updateDueDate && (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs font-mono text-[#2F3437] dark:text-white"
                  />
                )}
              </div>

              {/* Status */}
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#2F3437] dark:text-white">
                  <input
                    type="checkbox"
                    checked={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{isAr ? 'تحديث حالة الإنجاز' : 'Update Completion Status'}</span>
                </label>
                {updateStatus && (
                  <select
                    value={completed ? 'done' : 'active'}
                    onChange={(e) => setCompleted(e.target.value === 'done')}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs font-semibold text-[#2F3437] dark:text-white"
                  >
                    <option value="active">{isAr ? 'قيد الانتظار (Active)' : 'Active (Not Done)'}</option>
                    <option value="done">{isAr ? 'تم الإنجاز (Completed)' : 'Completed'}</option>
                  </select>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Habit Category */}
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#2F3437] dark:text-white">
                  <input
                    type="checkbox"
                    checked={updateCategory}
                    onChange={(e) => setUpdateCategory(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{isAr ? 'تحديث تصنيف العادة' : 'Update Habit Category'}</span>
                </label>
                {updateCategory && (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-xs font-semibold text-[#2F3437] dark:text-white"
                  >
                    <option value="Productivity">{isAr ? 'الإنتاجية' : 'Productivity'}</option>
                    <option value="Health">{isAr ? 'الصحة والعافية' : 'Health'}</option>
                    <option value="Business">{isAr ? 'الأعمال والريادة' : 'Business'}</option>
                    <option value="Personal Growth">{isAr ? 'النمو الشخصي' : 'Personal Growth'}</option>
                    <option value="Mindset">{isAr ? 'الذهنية والتفكير' : 'Mindset'}</option>
                  </select>
                )}
              </div>

              {/* Habit Target Days Per Week */}
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#2F3437] dark:text-white">
                  <input
                    type="checkbox"
                    checked={updateHabitTarget}
                    onChange={(e) => setUpdateHabitTarget(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{isAr ? 'تحديث عدد الأيام المستهدفة أسبوعياً' : 'Update Target Days / Week'}</span>
                </label>
                {updateHabitTarget && (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={7}
                      value={targetPerWeek}
                      onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      {targetPerWeek} {isAr ? 'أيام' : 'days'}
                    </span>
                  </div>
                )}
              </div>

              {/* Habit Color */}
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#2F3437] dark:text-white">
                  <input
                    type="checkbox"
                    checked={updateHabitColor}
                    onChange={(e) => setUpdateHabitColor(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{isAr ? 'تحديث لون السمة' : 'Update Color Theme'}</span>
                </label>
                {updateHabitColor && (
                  <div className="flex items-center gap-2 pt-1">
                    {['amber', 'emerald', 'indigo', 'rose', 'purple', 'blue', 'teal'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                          color === c ? 'border-black dark:border-white scale-110' : 'border-transparent'
                        } ${
                          c === 'amber' ? 'bg-amber-500' :
                          c === 'emerald' ? 'bg-emerald-500' :
                          c === 'indigo' ? 'bg-indigo-500' :
                          c === 'rose' ? 'bg-rose-500' :
                          c === 'purple' ? 'bg-purple-500' :
                          c === 'blue' ? 'bg-blue-500' : 'bg-teal-500'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE9E6] dark:border-[#2A2C33]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#787774] dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#262830] rounded-xl cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-[#2F3437] dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>{isSubmitting ? (isAr ? 'جاري التطبيق...' : 'Applying...') : (isAr ? 'تطبيق على الكل' : 'Apply to Selected')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
