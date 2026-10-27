import React, { useState } from 'react';
import {
  Timer,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { TaskItem, WeeklyPlanSlot } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface FocusSelectModalProps {
  isOpen: boolean;
  tasks: TaskItem[];
  plans: WeeklyPlanSlot[];
  lang: 'en' | 'ar';
  onClose: () => void;
  onStartFocus: (target: { id?: string; type: 'task' | 'plan' | 'custom'; title: string }) => void;
}

export const FocusSelectModal: React.FC<FocusSelectModalProps> = ({
  isOpen,
  tasks = [],
  plans = [],
  lang,
  onClose,
  onStartFocus,
}) => {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const isAr = lang === 'ar';

  // Get active tasks (uncompleted)
  const activeTasks = tasks.filter((t) => !t.completed);

  // Get today's scheduled plans
  const currentJsDay = new Date().getDay();
  const currentMondayBased = currentJsDay === 0 ? 6 : currentJsDay - 1;
  const todayPlans = plans.filter((p) => p.dayIndex === currentMondayBased && !p.completed);

  const [selectionType, setSelectionType] = useState<'task' | 'plan' | 'custom'>('task');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectionType === 'task') {
      const task = activeTasks.find((t) => t.id === selectedTaskId);
      if (task) {
        onStartFocus({ id: task.id, type: 'task', title: task.title });
      } else if (activeTasks.length > 0 && !selectedTaskId) {
        // Fallback to first task if not chosen explicitly
        const first = activeTasks[0];
        onStartFocus({ id: first.id, type: 'task', title: first.title });
      } else {
        // If no tasks, allow fallback
        onStartFocus({ type: 'custom', title: isAr ? 'جلسة تركيز عامة' : 'General Focus Sprint' });
      }
    } else if (selectionType === 'plan') {
      const plan = todayPlans.find((p) => p.id === selectedPlanId);
      if (plan) {
        onStartFocus({ id: plan.id, type: 'plan', title: plan.title });
      } else if (todayPlans.length > 0 && !selectedPlanId) {
        const first = todayPlans[0];
        onStartFocus({ id: first.id, type: 'plan', title: first.title });
      } else {
        onStartFocus({ type: 'custom', title: isAr ? 'جلسة تركيز عامة' : 'General Focus Sprint' });
      }
    } else {
      const title = customTitle.trim() || (isAr ? 'جلسة تركيز عامة' : 'General Focus Sprint');
      onStartFocus({ type: 'custom', title });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#18191D] text-[#2F3437] dark:text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Title */}
        <div className="flex items-center justify-between border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-[#34D399] flex items-center justify-center">
              <Timer size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#2F3437] dark:text-white">
                {isAr ? 'بدء روتين التركيز الفائق' : 'Initiate Deep Focus Routine'}
              </h3>
              <p className="text-[10px] text-neutral-400">
                {isAr ? 'قم بإرساء انتباهك على هدف معين لرفع مستوى التركيز.' : 'Anchor your attention to a specific milestone block.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-[#2F3437] dark:hover:text-white text-xs font-bold cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Dismiss'}
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="grid grid-cols-3 gap-1 bg-neutral-50 dark:bg-[#1E2025] p-1 rounded-xl border border-neutral-100 dark:border-neutral-800">
          {[
            { id: 'task' as const, label: isAr ? 'المهام المعلقة' : 'Active Task', icon: CheckCircle2 },
            { id: 'plan' as const, label: isAr ? 'مخطط اليوم' : 'Today Block', icon: Calendar },
            { id: 'custom' as const, label: isAr ? 'مستهدف مخصص' : 'Custom Goal', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectionType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectionType(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#282C34] text-neutral-900 dark:text-white shadow-sm border border-neutral-100 dark:border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                <Icon size={12} className="mb-0.5" />
                <span className="truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selection Input Area */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectionType === 'task' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block">
                {isAr ? 'اختر مهمة نشطة' : 'Select an Active Task'}
              </label>
              {activeTasks.length === 0 ? (
                <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] border-dashed rounded-xl text-center space-y-1">
                  <CheckCircle2 size={18} className="mx-auto text-emerald-500" />
                  <p className="text-[11px] font-bold text-[#2F3437] dark:text-white">{isAr ? 'لا توجد مهام نشطة حالياً' : 'All tasks completed!'}</p>
                  <p className="text-[10px] text-neutral-400">{isAr ? 'يمكنك التبديل إلى مستهدف مخصص لتسجيل وقتك.' : 'Switch to Custom Goal to configure manual focus.'}</p>
                </div>
              ) : (
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 focus:border-neutral-900 focus:outline-none text-xs bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white"
                >
                  <option value="" disabled>{isAr ? '-- اختر مهمة --' : '-- Choose Task --'}</option>
                  {activeTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.priority}] {t.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {selectionType === 'plan' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block">
                {isAr ? 'اختر فترة زمنية من مخطط اليوم' : "Select Today's Planner Block"}
              </label>
              {todayPlans.length === 0 ? (
                <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] border-dashed rounded-xl text-center space-y-1">
                  <Calendar size={18} className="mx-auto text-blue-500" />
                  <p className="text-[11px] font-bold text-[#2F3437] dark:text-white">{isAr ? 'لا توجد فترات مجدولة متبقية اليوم' : 'No plans remaining today!'}</p>
                  <p className="text-[10px] text-neutral-400">{isAr ? 'يمكنك ربط جلسة التركيز بمهمة معلقة أو كتابة مستهدف مخصص.' : 'Link focus to a pending task or custom target instead.'}</p>
                </div>
              ) : (
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 focus:border-neutral-900 focus:outline-none text-xs bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white"
                >
                  <option value="" disabled>{isAr ? '-- اختر فترة --' : '-- Choose Planner Block --'}</option>
                  {todayPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      ({p.timeSlot}) {p.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {selectionType === 'custom' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block">
                {isAr ? 'ما الذي تعمل عليه الآن؟' : 'What are you working on right now?'}
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={isAr ? 'مثال: مراجعة الكود، كتابة مقال، حل مسألة...' : 'e.g. Code refactoring, audit analysis...'}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 focus:border-neutral-900 focus:outline-none text-xs bg-white dark:bg-[#1E2025] text-[#2F3437] dark:text-white"
                autoFocus
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-[#EAE9E6] dark:border-[#2A2C33]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#262830] cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Dismiss'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900 hover:bg-black dark:hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? 'بدء ٢٥ دقيقة تركيز' : 'Start 25-Min Sprint'}</span>
              <ArrowRight size={13} className={isAr ? 'rotate-180' : ''} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
