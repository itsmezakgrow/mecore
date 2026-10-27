import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  Tag,
  FolderKanban,
  FileText,
  Target,
  Sparkles,
  Check,
  AlertCircle,
  Hash,
  Trash2,
  ListTodo
} from 'lucide-react';
import { TaskItem, Priority, ProjectItem, GoalItem, TaskSubtask } from '../types';
import { soundManager } from '../utils/soundEffects';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<TaskItem, 'id'>) => Promise<any>;
  allProjects?: ProjectItem[];
  allGoals?: GoalItem[];
  initialDueDate?: string;
  initialPriority?: Priority;
  initialProjectId?: string;
  tasksCount?: number;
  lang?: 'en' | 'ar';
}

const CATEGORY_PRESETS = [
  { id: 'Business', labelEn: 'Business', labelAr: 'عمل وأعمال' },
  { id: 'Personal', labelEn: 'Personal', labelAr: 'شخصي' },
  { id: 'Deep Work', labelEn: 'Deep Work', labelAr: 'عمل عميق' },
  { id: 'Health', labelEn: 'Health & Fitness', labelAr: 'صحة ولياقة' },
  { id: 'Finance', labelEn: 'Finance', labelAr: 'مالية' },
  { id: 'Learning', labelEn: 'Learning', labelAr: 'تعلم وتطوير' },
  { id: 'Admin', labelEn: 'Admin / Routine', labelAr: 'إداريات وروتين' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  allProjects = [],
  allGoals = [],
  initialDueDate,
  initialPriority = 'Med',
  initialProjectId = '',
  tasksCount = 0,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(initialPriority);
  const [dueDate, setDueDate] = useState<string>(
    initialDueDate || new Date().toISOString().split('T')[0]
  );
  const [dueTime, setDueTime] = useState<string>('');
  const [category, setCategory] = useState<string>('Business');
  const [projectId, setProjectId] = useState<string>(initialProjectId);
  const [isMeasurable, setIsMeasurable] = useState(false);
  const [targetValue, setTargetValue] = useState<number>(10);
  const [unit, setUnit] = useState<string>('units');
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority(initialPriority);
      setDueDate(initialDueDate || new Date().toISOString().split('T')[0]);
      setDueTime('');
      setCategory('Business');
      setProjectId(initialProjectId);
      setIsMeasurable(false);
      setSubtasks([]);
      setNewSubtaskTitle('');
      setErrorMsg(null);
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, initialDueDate, initialPriority, initialProjectId]);

  if (!isOpen) return null;

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newEntry: TaskSubtask = {
      id: 'st_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    setSubtasks(prev => [...prev, newEntry]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  };

  // Quick Date Helpers
  const setQuickDate = (daysFromToday: number | 'clear') => {
    if (daysFromToday === 'clear') {
      setDueDate('');
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const isDateToday = dueDate === new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isDateTomorrow = dueDate === tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e?: React.FormEvent, keepOpen = false) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setErrorMsg(isAr ? 'يرجى كتابة عنوان المهمة' : 'Please enter a task title');
      if (titleInputRef.current) titleInputRef.current.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onAddTask({
        title: title.trim(),
        description: description.trim() || undefined,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        priority,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        category,
        projectId: projectId || undefined,
        completed: false,
        createdAt: Date.now(),
        order: tasksCount + 1,
        isMeasurable,
        targetValue: isMeasurable ? targetValue : undefined,
        currentValue: 0,
        unit: isMeasurable ? (unit.trim() || 'units') : undefined,
        kanbanStatus: 'todo',
      });

      soundManager.playCheck();

      if (keepOpen) {
        setTitle('');
        setDescription('');
        setIsMeasurable(false);
        setSubtasks([]);
        setNewSubtaskTitle('');
        if (titleInputRef.current) titleInputRef.current.focus();
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setErrorMsg(err?.message || (isAr ? 'حدث خطأ أثناء حفظ المهمة' : 'Failed to save task'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE9E6] dark:border-[#2A2C33] bg-[#FAF9F6] dark:bg-[#1D1F24]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckSquare size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#2F3437] dark:text-[#F3F4F6] flex items-center gap-2">
                <span>{isAr ? 'إضافة مهمة جديدة' : 'Create New Task'}</span>
              </h3>
              <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                {isAr
                  ? 'اكتب عنوان المهمة وحدد الأولويات والتاريخ لإدراجها في خطتك'
                  : 'Enter title, choose priority, due date and project'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Main Title Input (Spacious, prominent) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2F3437] dark:text-white">
              {isAr ? 'عنوان المهمة *' : 'Task Title *'}
            </label>
            <div className="relative">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit(e, false);
                  }
                }}
                placeholder={isAr ? 'مثال: كتابة تقرير المبيعات، قراءة 20 صفحة، مراجعة العقد...' : 'e.g., Write sales report, Review contract, Exercise...'}
                className="w-full px-4 py-3 bg-[#F7F6F3] dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl text-sm sm:text-base font-semibold text-[#2F3437] dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1E2025] transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* 2. Priority Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2F3437] dark:text-white">
              {isAr ? 'درجة الأولوية' : 'Priority Level'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('High')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  priority === 'High'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 shadow-2xs'
                    : 'bg-[#F7F6F3] dark:bg-[#202228] text-neutral-600 dark:text-neutral-400 border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{isAr ? 'مرتفعة (High)' : 'High Priority'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('Med')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  priority === 'Med'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs'
                    : 'bg-[#F7F6F3] dark:bg-[#202228] text-neutral-600 dark:text-neutral-400 border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{isAr ? 'متوسطة (Med)' : 'Medium'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('Low')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  priority === 'Low'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                    : 'bg-[#F7F6F3] dark:bg-[#202228] text-neutral-600 dark:text-neutral-400 border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{isAr ? 'منخفضة (Low)' : 'Low Priority'}</span>
              </button>
            </div>
          </div>

          {/* 3. Due Date & Quick Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-600" />
                <span>{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</span>
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setQuickDate('clear')}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
                >
                  {isAr ? 'مسح التاريخ' : 'No due date'}
                </button>
              )}
            </div>

            {/* Quick date chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  isDateToday
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-[#F7F6F3] dark:bg-[#202228] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {isAr ? 'اليوم' : 'Today'}
              </button>

              <button
                type="button"
                onClick={() => setQuickDate(1)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  isDateTomorrow
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-[#F7F6F3] dark:bg-[#202228] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {isAr ? 'غداً' : 'Tomorrow'}
              </button>

              <button
                type="button"
                onClick={() => setQuickDate(2)}
                className="px-3 py-1 rounded-xl text-[11px] font-bold bg-[#F7F6F3] dark:bg-[#202228] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
              >
                {isAr ? 'بعد يومين (+2)' : 'In 2 Days'}
              </button>

              <button
                type="button"
                onClick={() => setQuickDate(7)}
                className="px-3 py-1 rounded-xl text-[11px] font-bold bg-[#F7F6F3] dark:bg-[#202228] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
              >
                {isAr ? 'الأسبوع القادم (+7)' : 'Next Week'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F6F3] dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-xl text-xs font-semibold text-[#2F3437] dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
              </div>

              <div className="relative flex items-center gap-1.5 px-3 py-2 bg-[#F7F6F3] dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-xl">
                <Clock size={13} className="text-neutral-400 shrink-0" />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  placeholder="--:--"
                  className="w-full bg-transparent border-none text-xs font-semibold text-[#2F3437] dark:text-white focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. Project & Category Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Project */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                <FolderKanban size={14} className="text-indigo-600" />
                <span>{isAr ? 'المشروع المرتبط' : 'Assigned Project'}</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F6F3] dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-xl text-xs font-semibold text-[#2F3437] dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">{isAr ? 'بدون مشروع (مهمة مستقلة)' : 'None (Standalone Task)'}</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                <Tag size={14} className="text-amber-600" />
                <span>{isAr ? 'التصنيف' : 'Category'}</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F6F3] dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-xl text-xs font-semibold text-[#2F3437] dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {CATEGORY_PRESETS.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏷️ {isAr ? c.labelAr : c.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Measurable Goal Toggle (Optional) */}
          <div className="p-3 bg-[#FAF9F6] dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMeasurable}
                  onChange={(e) => setIsMeasurable(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 border-neutral-300 dark:border-neutral-700"
                />
                <span className="flex items-center gap-1.5">
                  <Target size={14} className="text-emerald-600" />
                  <span>{isAr ? 'مهمة برقم وقياس كمي (مثل: 20 صفحة، 5 مكالمات)' : 'Measurable Numeric Target'}</span>
                </span>
              </label>
            </div>

            {isMeasurable && (
              <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-1 font-semibold">
                    {isAr ? 'العدد المستهدف:' : 'Target Value:'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18191D] border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-[#2F3437] dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-500 dark:text-neutral-400 mb-1 font-semibold">
                    {isAr ? 'الوحدة (مثال: صفحات، بومودورو):' : 'Unit (e.g. pages, calls):'}
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={isAr ? 'صفحة / دقيقة / مكالمة' : 'pages, mins, calls'}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#18191D] border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-semibold text-[#2F3437] dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. Subtasks Checklist Section (Optional) */}
          <div className="space-y-2 p-3 bg-[#FAF9F6] dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                <ListTodo size={14} className="text-emerald-600" />
                <span>{isAr ? 'المهام الفرعية (خطوات التنفيذ)' : 'Subtasks (Action Steps)'}</span>
              </label>
              {subtasks.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  {subtasks.length} {isAr ? 'مهام فرعية' : 'subtasks'}
                </span>
              )}
            </div>

            {/* Quick Add Subtask Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder={isAr ? 'أضف خطوة فرعية (اضغط Enter للإضافة)...' : 'Add a subtask step (press Enter)...'}
                className="flex-1 px-3 py-1.5 bg-white dark:bg-[#18191D] border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-[#2F3437] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus size={13} />
                <span>{isAr ? 'أضف' : 'Add'}</span>
              </button>
            </div>

            {/* Added Subtasks list */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1 pr-0.5">
                {subtasks.map((st, idx) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 group/item"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate font-medium">{st.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-neutral-400 hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                      title={isAr ? 'حذف' : 'Remove'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Description / Notes Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
              <FileText size={14} className="text-neutral-500" />
              <span>{isAr ? 'تفاصيل وملاحظات إضافية (اختياري)' : 'Description & Notes (Optional)'}</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isAr ? 'أي ملاحظات سريعة، روابط، أو خطوات فرعية لإنجاز المهمة...' : 'Any notes, sub-points, or links to complete the task...'}
              className="w-full px-3 py-2 bg-[#F7F6F3] dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl text-xs text-[#2F3437] dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500 transition-all resize-none"
            />
          </div>
        </form>

        {/* Modal Footer / Actions */}
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-[#EAE9E6] dark:border-[#2A2C33] bg-[#FAF9F6] dark:bg-[#1D1F24]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting || !title.trim()}
              onClick={(e) => handleSubmit(e, true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={isAr ? 'حفظ المهمة وإبقاء النافذة مفتوحة لإضافة مهمة أخرى' : 'Save and keep dialog open to add another'}
            >
              <Plus size={14} />
              <span>{isAr ? 'حفظ وإضافة أخرى' : 'Save & Add Another'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !title.trim()}
              onClick={(e) => handleSubmit(e, false)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{isAr ? 'حفظ المهمة' : 'Save Task'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
