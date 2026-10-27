import React, { useState } from 'react';
import { 
  X, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  Tag, 
  Flame, 
  Clock, 
  MessageSquare, 
  AtSign, 
  Save, 
  Send, 
  Pin, 
  Sparkles,
  ListTodo,
  FileText,
  Layers,
  ChevronRight,
  ExternalLink,
  Target
} from 'lucide-react';
import { TaskItem, TaskSubtask, Priority, AppComment, CommentMention, HabitItem, NoteItem, ProjectItem, GoalItem } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface TaskDetailModalProps {
  task: TaskItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => Promise<any>;
  onDeleteTask: (id: string) => Promise<any>;
  onScheduleTask?: (task: TaskItem) => void;
  comments: AppComment[];
  onAddComment: (comment: Omit<AppComment, 'id'>) => Promise<any>;
  onDeleteComment?: (id: string) => Promise<any>;
  allTasks?: TaskItem[];
  allHabits?: HabitItem[];
  allNotes?: NoteItem[];
  allProjects?: ProjectItem[];
  allGoals?: GoalItem[];
  lang?: 'en' | 'ar';
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onScheduleTask,
  comments,
  onAddComment,
  onDeleteComment,
  allTasks = [],
  allHabits = [],
  allNotes = [],
  allProjects = [],
  allGoals = [],
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);

  const isAr = lang === 'ar';

  // Form states
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [category, setCategory] = useState(task.category || 'Business');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Measurable state
  const [isMeasurable, setIsMeasurable] = useState(Boolean(task.isMeasurable));
  const [targetValue, setTargetValue] = useState(task.targetValue || 10);
  const [currentValue, setCurrentValue] = useState(task.currentValue || 0);
  const [unit, setUnit] = useState(task.unit || 'pages');
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  const [selectedMentions, setSelectedMentions] = useState<CommentMention[]>([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'comments'>('details');

  if (!isOpen) return null;

  // Subtask handlers
  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    const newEntry: TaskSubtask = {
      id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      title: trimmed,
      completed: false,
      createdAt: Date.now()
    };
    const updated = [...subtasks, newEntry];
    setSubtasks(updated);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    setSubtasks(updated);
  };

  const handleDeleteSubtask = (id: string) => {
    const updated = subtasks.filter(s => s.id !== id);
    setSubtasks(updated);
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  // Save all fields
  const handleSaveAll = async () => {
    if (!task.id) return;
    setIsSaving(true);
    try {
      await onUpdateTask(task.id, {
        title: title.trim() || task.title,
        description: description.trim(),
        priority,
        category,
        dueDate,
        subtasks,
        isMeasurable,
        targetValue: isMeasurable ? targetValue : undefined,
        currentValue: isMeasurable ? currentValue : undefined,
        unit: isMeasurable ? unit : undefined
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Comment on Task
  const handlePostComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Omit<AppComment, 'id'> = {
      content: commentText.trim(),
      createdAt: Date.now(),
      author: 'Executive',
      targetType: 'task',
      targetId: task.id,
      targetTitle: task.title,
      mentions: selectedMentions.length > 0 ? selectedMentions : undefined
    };

    await onAddComment(newComment);
    setCommentText('');
    setSelectedMentions([]);
    setShowMentionPicker(false);
  };

  // Filter linked comments (attached to this task or mentioning this task ID/title)
  const taskComments = comments.filter(c => 
    (c.targetType === 'task' && c.targetId === task.id) ||
    c.mentions?.some(m => m.id === task.id || m.title.toLowerCase() === task.title.toLowerCase())
  );

  // Mentionable items
  const allMentionCandidates: CommentMention[] = [
    ...allHabits.map(h => ({ type: 'habit' as const, id: h.id || '', title: h.title })),
    ...allTasks.filter(t => t.id !== task.id).map(t => ({ type: 'task' as const, id: t.id || '', title: t.title })),
    ...allNotes.map(n => ({ type: 'note' as const, id: n.id || '', title: n.title })),
    ...allProjects.map(p => ({ type: 'project' as const, id: p.id || '', title: p.title })),
    ...allGoals.map(g => ({ type: 'goal' as const, id: g.id || '', title: g.title })),
  ].filter(item => item.id && item.title);

  const filteredMentionCandidates = allMentionCandidates.filter(item => 
    item.title.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-[#18191D] w-full max-w-2xl rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto ${
          isAr ? 'text-right' : ''
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between bg-[#FAF9F7] dark:bg-[#151619] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${
              priority === 'High' ? 'bg-rose-600' : priority === 'Med' ? 'bg-amber-500' : 'bg-emerald-600'
            }`}>
              <CheckSquare size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#787774] dark:text-neutral-400">
                  {isAr ? 'تفاصيل المهمة' : 'Task Details'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  priority === 'High' 
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' 
                    : priority === 'Med' 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  {priority === 'High' ? (isAr ? 'أولوية قصوى' : 'High Priority') : priority === 'Med' ? (isAr ? 'أولوية متوسطة' : 'Med Priority') : (isAr ? 'أولوية منخفضة' : 'Low Priority')}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#2F3437] dark:text-white truncate max-w-md">
                {title || (isAr ? 'مهمة بدون عنوان' : 'Untitled Task')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#787774] dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-[#262830] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs inside Modal */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 pb-2 border-b border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'bg-[#2F3437] text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#262830]'
            }`}
          >
            <FileText size={13} />
            <span>{isAr ? 'الوصف والإعدادات' : 'Description & Settings'}</span>
          </button>
          <button
            onClick={() => setActiveTab('subtasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'subtasks'
                ? 'bg-[#2F3437] text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#262830]'
            }`}
          >
            <ListTodo size={13} />
            <span>{isAr ? `المهام الفرعية (${subtasks.length})` : `Subtasks (${subtasks.length})`}</span>
            {subtasks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-md font-mono">
                {progressPercent}%
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-[#2F3437] text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-[#787774] dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#262830]'
            }`}
          >
            <MessageSquare size={13} />
            <span>{isAr ? `التعليقات (${taskComments.length})` : `Comments (${taskComments.length})`}</span>
          </button>
        </div>

        {/* Modal Body with overscroll containment */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-white dark:bg-[#18191D] overscroll-contain">
          {/* TAB 1: DETAILS & DESCRIPTION */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#787774] dark:text-neutral-400 uppercase tracking-wider block">
                  {isAr ? 'عنوان المهمة' : 'Task Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] focus:border-[#2F3437] dark:focus:border-neutral-400 text-sm font-semibold text-[#2F3437] dark:text-white focus:outline-none bg-[#FBFBFA] dark:bg-[#1E2025]"
                />
              </div>

              {/* Description / Notes area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#787774] dark:text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{isAr ? 'الوصف والملاحظات التفصيلية' : 'Description & Notes'}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    {description.length} {isAr ? 'حرف' : 'chars'}
                  </span>
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isAr ? 'أضف تفاصيل دقيقة، معايير القبول، روابط أو توجيهات خاصة بهذه المهمة...' : 'Add detailed requirements, acceptance criteria, links, or context for this task...'}
                  className="w-full p-3.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] focus:border-[#2F3437] dark:focus:border-neutral-400 text-xs sm:text-sm text-[#2F3437] dark:text-white focus:outline-none bg-[#FBFBFA] dark:bg-[#1E2025] resize-y placeholder:text-[#9A9996] dark:placeholder:text-neutral-500"
                />
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#787774] dark:text-neutral-400">
                    {isAr ? 'مستوى الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-semibold bg-[#FBFBFA] dark:bg-[#1E2025] text-[#2F3437] dark:text-white"
                  >
                    <option value="High">{isAr ? '🔴 مرتفعة جداً (High)' : '🔴 High Priority'}</option>
                    <option value="Med">{isAr ? '🟡 متوسطة (Med)' : '🟡 Medium Priority'}</option>
                    <option value="Low">{isAr ? '🟢 منخفضة (Low)' : '🟢 Low Priority'}</option>
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#787774] dark:text-neutral-400">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-semibold bg-[#FBFBFA] dark:bg-[#1E2025] text-[#2F3437] dark:text-white"
                  >
                    <option value="Business">{isAr ? 'العمل والأعمال' : 'Business'}</option>
                    <option value="Personal">{isAr ? 'شخصي' : 'Personal'}</option>
                    <option value="Finance">{isAr ? 'المالية والاستثمار' : 'Finance'}</option>
                    <option value="Operations">{isAr ? 'العمليات والتشغيل' : 'Operations'}</option>
                    <option value="Strategy">{isAr ? 'الاستراتيجية والتخطيط' : 'Strategy'}</option>
                    <option value="Health">{isAr ? 'الصحة والعافية' : 'Health'}</option>
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#787774] dark:text-neutral-400">
                    {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-mono bg-[#FBFBFA] dark:bg-[#1E2025] text-[#2F3437] dark:text-white"
                  />
                </div>
              </div>

              {/* Measurable Progress Section */}
              <div className="bg-[#FAF9F7] dark:bg-[#151619] p-4 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMeasurable}
                      onChange={(e) => setIsMeasurable(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-[#2F3437] dark:text-white flex items-center gap-1.5">
                      <Target size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{isAr ? 'نظام القياس والمستويات (Measurable Units / Level System)' : 'Measurable Units / Level System'}</span>
                    </span>
                  </label>
                  {isMeasurable && (
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full font-mono">
                      {currentValue} / {targetValue} {unit} ({Math.min(100, Math.round(((currentValue || 0) / (targetValue || 1)) * 100))}%)
                    </span>
                  )}
                </div>

                {isMeasurable && (
                  <div className="pt-2 border-t border-[#EAE9E6] dark:border-[#2A2C33] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-[#787774] dark:text-neutral-400 block mb-1">
                          {isAr ? 'الكمية الحالية:' : 'Current Progress:'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={currentValue}
                          onChange={(e) => setCurrentValue(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-bold text-[#2F3437] dark:text-white bg-white dark:bg-[#18191D] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#787774] dark:text-neutral-400 block mb-1">
                          {isAr ? 'الهدف الكامل:' : 'Target Value:'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={targetValue}
                          onChange={(e) => setTargetValue(Math.max(1, parseFloat(e.target.value) || 1))}
                          className="w-full px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-bold text-[#2F3437] dark:text-white bg-white dark:bg-[#18191D] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#787774] dark:text-neutral-400 block mb-1">
                          {isAr ? 'الوحدة (مثال: صفحة، دقيقة):' : 'Unit (e.g. pages, mins):'}
                        </label>
                        <input
                          type="text"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-semibold text-[#2F3437] dark:text-white bg-white dark:bg-[#18191D]"
                          placeholder="pages"
                        />
                      </div>
                    </div>

                    {/* Quick Stepper Buttons */}
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentValue(Math.max(0, currentValue - 5))}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-[#2F3437] dark:text-white hover:bg-neutral-100 dark:hover:bg-[#202227] cursor-pointer"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentValue(Math.max(0, currentValue - 1))}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-[#2F3437] dark:text-white hover:bg-neutral-100 dark:hover:bg-[#202227] cursor-pointer"
                        >
                          -1
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentValue(Math.round(targetValue * 0.5 * 10) / 10)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentValue(targetValue)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
                        >
                          100%
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentValue(currentValue + 1)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-[#2F3437] dark:text-white hover:bg-neutral-100 dark:hover:bg-[#202227] cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentValue(currentValue + 5)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] text-[#2F3437] dark:text-white hover:bg-neutral-100 dark:hover:bg-[#202227] cursor-pointer"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-200 dark:bg-[#2A2C33] h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round(((currentValue || 0) / (targetValue || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Subtasks Quick Overview */}
              {subtasks.length > 0 && (
                <div className="bg-[#FAF9F7] dark:bg-[#151619] p-3.5 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                      <ListTodo size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{isAr ? 'المهام الفرعية المنجزة' : 'Subtask Progress'}</span>
                    </span>
                    <span className="font-mono font-bold text-neutral-600 dark:text-neutral-400">
                      {completedSubtasks}/{subtasks.length} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-[#2A2C33] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUBTASKS CHECKLIST */}
          {activeTab === 'subtasks' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Progress bar */}
              <div className="bg-[#FAF9F7] dark:bg-[#151619] p-3.5 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                    <ListTodo size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'تقدم إنجاز المهام الفرعية' : 'Subtasks Execution Progress'}</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                    {completedSubtasks} / {subtasks.length} {isAr ? 'مكتملة' : 'done'} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-[#2A2C33] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Add Subtask Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={isAr ? 'أضف مهمة فرعية جديدة (اضغط Enter)...' : 'Add a new subtask (press Enter)...'}
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] focus:border-[#2F3437] dark:focus:border-neutral-400 text-xs sm:text-sm bg-[#FBFBFA] dark:bg-[#1E2025] text-[#2F3437] dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="bg-[#2F3437] dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{isAr ? 'إضافة' : 'Add'}</span>
                </button>
              </div>

              {/* Subtasks List */}
              <div className="space-y-1.5 divide-y divide-[#EAE9E6] dark:divide-[#2A2C33] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl p-1 bg-white dark:bg-[#18191D]">
                {subtasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#787774] dark:text-neutral-400">
                    <ListTodo size={28} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-1" />
                    <p className="font-semibold">{isAr ? 'لا توجد مهام فرعية بعد' : 'No subtasks created yet'}</p>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {isAr ? 'قم بتقسيم هذه المهمة الكبيرة إلى خطوات إنجاز واضحة وقابلة للتنفيذ.' : 'Break down this major task into manageable micro-steps.'}
                    </p>
                  </div>
                ) : (
                  subtasks.map((st) => (
                    <div 
                      key={st.id}
                      className="flex items-center justify-between gap-3 p-2.5 hover:bg-[#FBFBFA] dark:hover:bg-[#1E2025] rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(st.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                            st.completed 
                              ? 'bg-emerald-600 text-white' 
                              : 'border-2 border-neutral-300 dark:border-neutral-600 hover:border-neutral-500'
                          }`}
                        >
                          {st.completed && <Check size={12} />}
                        </button>
                        <span className={`text-xs sm:text-sm truncate ${
                          st.completed ? 'line-through text-[#787774] dark:text-neutral-500' : 'text-[#2F3437] dark:text-white font-medium'
                        }`}>
                          {st.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title={isAr ? 'حذف المهمة الفرعية' : 'Delete subtask'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMMENTS & ACTIVITY */}
          {activeTab === 'comments' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Comment Composer */}
              <form onSubmit={handlePostComment} className="bg-[#FAF9F7] dark:bg-[#151619] p-3.5 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'إضافة تعليق أو ملاحظة مرتبطة' : 'Add Comment / Work Note'}</span>
                  </span>
                  
                  {/* Mention Picker Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowMentionPicker(!showMentionPicker)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <AtSign size={12} />
                    <span>{isAr ? 'إشارة لعنصر (@)' : 'Mention Item (@)'}</span>
                  </button>
                </div>

                {/* Selected Mentions Pills */}
                {selectedMentions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {selectedMentions.map((m, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        <span>@{m.type.toUpperCase()}: {m.title}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedMentions(selectedMentions.filter((_, i) => i !== idx))}
                          className="hover:text-indigo-950 dark:hover:text-white cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Mention Dropdown Selector */}
                {showMentionPicker && (
                  <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-xl p-2 shadow-lg space-y-1 max-h-48 overflow-y-auto animate-fadeIn">
                    <input
                      type="text"
                      placeholder={isAr ? 'ابحث في العادات، المهام، الملاحظات...' : 'Search habits, tasks, notes...'}
                      value={mentionFilter}
                      onChange={(e) => setMentionFilter(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-[#EAE9E6] dark:border-[#2A2C33] bg-[#FBFBFA] dark:bg-[#1E2025] text-[#2F3437] dark:text-white rounded-lg mb-1 focus:outline-none"
                      autoFocus
                    />
                    {filteredMentionCandidates.slice(0, 10).map((cand, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!selectedMentions.some(m => m.id === cand.id)) {
                            setSelectedMentions([...selectedMentions, cand]);
                          }
                          setShowMentionPicker(false);
                          setMentionFilter('');
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-[#202227] rounded-lg text-xs flex items-center justify-between text-[#2F3437] dark:text-white cursor-pointer"
                      >
                        <span className="font-medium truncate">{cand.title}</span>
                        <span className="text-[9px] font-mono uppercase bg-neutral-100 dark:bg-[#2A2C33] px-1.5 py-0.5 rounded text-[#787774] dark:text-neutral-300">
                          {cand.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  rows={2}
                  placeholder={isAr ? 'اكتب تعليقك أو تقدم العمل هنا... (يتم حفظ الوقت بدقة)' : 'Write your comment or update here... (timestamp is recorded)'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs text-[#2F3437] dark:text-white focus:outline-none bg-white dark:bg-[#18191D]"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="bg-[#2F3437] dark:bg-white hover:bg-black dark:hover:bg-neutral-200 disabled:opacity-40 text-white dark:text-neutral-900 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send size={12} />
                    <span>{isAr ? 'نشر التعليق' : 'Post Comment'}</span>
                  </button>
                </div>
              </form>

              {/* Comments Timeline */}
              <div className="space-y-2.5">
                {taskComments.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#787774] dark:text-neutral-400">
                    <MessageSquare size={24} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-1" />
                    <p>{isAr ? 'لا توجد تعليقات بعد على هذه المهمة.' : 'No comments on this task yet.'}</p>
                  </div>
                ) : (
                  taskComments.map((c) => {
                    const formattedDate = new Date(c.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div 
                        key={c.id || c.createdAt}
                        className="p-3 bg-white dark:bg-[#18191D] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400 text-[11px]">
                          <span className="font-bold text-[#2F3437] dark:text-white">{c.author || 'Executive'}</span>
                          <span className="font-mono">{formattedDate}</span>
                        </div>
                        <p className="text-[#2F3437] dark:text-neutral-200 whitespace-pre-wrap">{c.content}</p>
                        
                        {/* Mention badges */}
                        {c.mentions && c.mentions.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {c.mentions.map((m, i) => (
                              <span 
                                key={i}
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono"
                              >
                                <span>@{m.type}: {m.title}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#EAE9E6] dark:border-[#2A2C33] bg-[#FAF9F7] dark:bg-[#151619] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (task.id) {
                  onDeleteTask(task.id);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>{isAr ? 'حذف المهمة' : 'Delete Task'}</span>
            </button>

            {onScheduleTask && !task.completed && (
              <button
                type="button"
                onClick={() => {
                  onScheduleTask(task);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Clock size={14} />
                <span>{isAr ? 'بدء جلسة تركيز' : 'Focus Session'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#787774] dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-[#262830] rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold bg-[#2F3437] dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save size={14} />
              <span>{isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التغييرات' : 'Save Changes')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
