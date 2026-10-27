import React, { useState, useRef, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Check, 
  Tag, 
  Calendar, 
  Sparkles, 
  Edit2, 
  X, 
  RotateCcw, 
  Flame, 
  CheckCheck, 
  ListFilter, 
  ListTodo, 
  Square, 
  Maximize2, 
  GripVertical, 
  Target, 
  Minus, 
  Sliders, 
  ChevronUp, 
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  ExternalLink,
  Timer,
  LayoutGrid,
  List,
  BarChart3,
  Search,
  FolderKanban,
  MoreVertical,
  Layers,
  ArrowUpRight,
  ArrowLeft,
  Play,
  Archive
} from 'lucide-react';
import { TaskItem, Priority, AppComment, HabitItem, NoteItem, ProjectItem, GoalItem, FocusSession, TaskSubtask } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskPomodoroModal } from './TaskPomodoroModal';
import { BulkActionToolbar } from './BulkActionToolbar';
import { BulkEditModal } from './BulkEditModal';
import { QuickLevelLoggerModal } from './QuickLevelLoggerModal';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface TaskTrackerProps {
  tasks: TaskItem[];
  onAddTask: (task: Omit<TaskItem, 'id'>) => Promise<any>;
  onUpdateTask: (id: string, updates: Partial<TaskItem>) => Promise<any>;
  onDeleteTask: (id: string) => Promise<any>;
  onReorderTasks?: (taskIds: string[]) => Promise<any>;
  onBulkUpdateTasks?: (ids: string[], updates: Partial<TaskItem>) => Promise<any>;
  onBulkDeleteTasks?: (ids: string[]) => Promise<any>;
  onScheduleTask?: (task: TaskItem) => void;
  onFocusTask?: (task: TaskItem) => void;
  onAddFocusSession?: (session: Omit<FocusSession, 'id'>) => Promise<any>;
  onBulkSendToPomodoro?: (tasks: TaskItem[]) => void;
  comments?: AppComment[];
  onAddComment?: (comment: Omit<AppComment, 'id'>) => Promise<any>;
  onUpdateComment?: (id: string, updates: Partial<AppComment>) => Promise<any>;
  onDeleteComment?: (id: string) => Promise<any>;
  allHabits?: HabitItem[];
  allNotes?: NoteItem[];
  allProjects?: ProjectItem[];
  allGoals?: GoalItem[];
  lang?: 'en' | 'ar';
}

const getFriendlyDueDate = (dateStr?: string, isAr?: boolean) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (dateStr === todayStr) {
      return isAr ? 'اليوم' : 'Today';
    } else if (dateStr === tomorrowStr) {
      return isAr ? 'غداً' : 'Tomorrow';
    }
    
    const formatter = new Intl.DateTimeFormat(isAr ? 'ar' : 'en', { month: 'short', day: 'numeric' });
    return formatter.format(date);
  } catch (e) {
    return dateStr;
  }
};

export const TaskTracker: React.FC<TaskTrackerProps> = ({
  tasks = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
  onBulkUpdateTasks,
  onBulkDeleteTasks,
  onScheduleTask,
  onFocusTask,
  onAddFocusSession,
  onBulkSendToPomodoro,
  comments = [],
  onAddComment,
  onDeleteComment,
  allHabits = [],
  allNotes = [],
  allProjects = [],
  allGoals = [],
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const inputRef = useRef<HTMLInputElement>(null);

  // Layout View Switcher: 'list' | 'kanban' | 'stats'
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'stats'>('list');

  // Quick Adder Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('Med');
  const [newCategory, setNewCategory] = useState('Business');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState('');
  const [newIsMeasurable, setNewIsMeasurable] = useState(false);
  const [newTargetValue, setNewTargetValue] = useState(10);
  const [newUnit, setNewUnit] = useState('pages');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection & Bulk Actions
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskItem | null>(null);
  const [selectedTaskForPomodoro, setSelectedTaskForPomodoro] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [showClearCompletedModal, setShowClearCompletedModal] = useState(false);
  const [taskForLevelLogging, setTaskForLevelLogging] = useState<TaskItem | null>(null);

  // Subtasks & Completion Confirmation Prompt
  const [taskPromptToComplete, setTaskPromptToComplete] = useState<TaskItem | null>(null);
  const [quickSubtaskTaskId, setQuickSubtaskTaskId] = useState<string | null>(null);
  const [quickSubtaskTitle, setQuickSubtaskTitle] = useState<string>('');

  // Inline Editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('Med');
  const [editCategory, setEditCategory] = useState('Business');
  const [editDueDate, setEditDueDate] = useState('');

  // Filters & Search
  const [smartFilter, setSmartFilter] = useState<'all' | 'today' | 'overdue' | 'high' | 'measurable' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag & Drop Reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Priority and Category Labels
  const getPriorityLabel = (p: Priority) => {
    if (!isAr) return p;
    switch (p) {
      case 'High': return 'مرتفعة';
      case 'Med': return 'متوسطة';
      case 'Low': return 'منخفضة';
      default: return p;
    }
  };

  const getPriorityBadgeStyle = (p: Priority) => {
    switch (p) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/60';
      case 'Med':
        return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
    }
  };

  // Add Task Handler
  const handleCreateTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask({
        title: newTitle.trim(),
        priority: newPriority,
        category: newCategory,
        projectId: newProjectId || undefined,
        dueDate: newDueDate || undefined,
        description: newDescription.trim() || undefined,
        completed: false,
        createdAt: Date.now(),
        order: tasks.length,
        isMeasurable: newIsMeasurable,
        targetValue: newIsMeasurable ? newTargetValue : undefined,
        currentValue: 0,
        unit: newIsMeasurable ? (newUnit.trim() || 'units') : undefined,
        kanbanStatus: 'todo',
      });

      soundManager.playCheck();
      setNewTitle('');
      setNewDescription('');
      setShowAdvancedOptions(false);
      setNewIsMeasurable(false);
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Completion
  const handleToggleTask = async (task: TaskItem) => {
    if (!task.id) return;
    const nextCompleted = !task.completed;
    const target = task.targetValue && task.targetValue > 0 ? task.targetValue : 1;

    await onUpdateTask(task.id, {
      completed: nextCompleted,
      kanbanStatus: nextCompleted ? 'completed' : 'todo',
      ...(task.isMeasurable ? { currentValue: nextCompleted ? target : 0 } : {}),
      ...(nextCompleted ? { completedAt: Date.now() } : {}),
    });

    if (nextCompleted) {
      soundManager.playCheck();
      confetti({
        particleCount: 28,
        spread: 45,
        origin: { y: 0.75 },
        colors: ['#10B981', '#34D399', '#059669']
      });
    }
  };

  // Move Task Kanban Status Direct Action
  const handleMoveTaskStatus = async (task: TaskItem, newStatus: 'todo' | 'in_progress' | 'completed') => {
    if (!task.id) return;

    if (newStatus === 'completed') {
      const target = task.targetValue && task.targetValue > 0 ? task.targetValue : (task.currentValue || 1);
      await onUpdateTask(task.id, {
        completed: true,
        kanbanStatus: 'completed',
        completedAt: Date.now(),
        currentValue: target,
      });
      soundManager.playCheck();
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.75 } });
    } else if (newStatus === 'in_progress') {
      await onUpdateTask(task.id, {
        completed: false,
        kanbanStatus: 'in_progress',
      });
      soundManager.playCheck();
    } else {
      await onUpdateTask(task.id, {
        completed: false,
        kanbanStatus: 'todo',
      });
      soundManager.playCheck();
    }
  };

  // Step Measurable Progress (+ / -)
  const handleQuickStepProgress = async (task: TaskItem, delta: number) => {
    if (!task.id || !task.isMeasurable) return;
    const current = task.currentValue || 0;
    const nextVal = Math.max(0, current + delta);
    const target = task.targetValue || 1;
    const isNowDone = nextVal >= target;

    await onUpdateTask(task.id, {
      currentValue: nextVal,
      completed: isNowDone,
      kanbanStatus: isNowDone ? 'completed' : 'in_progress',
      ...(isNowDone ? { completedAt: Date.now() } : {}),
    });

    soundManager.playCheck();
    if (isNowDone) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.75 } });
    }
  };

  // Toggle Subtask Completion & Trigger prompt if all subtasks completed
  const handleToggleSubtask = async (task: TaskItem, subtaskId: string) => {
    if (!task.id) return;
    const currentSubtasks = task.subtasks || [];
    const targetSubtask = currentSubtasks.find((s) => s.id === subtaskId);
    if (!targetSubtask) return;

    const nextCompleted = !targetSubtask.completed;
    const updatedSubtasks = currentSubtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: nextCompleted } : s
    );

    soundManager.playCheck();

    await onUpdateTask(task.id, {
      subtasks: updatedSubtasks,
    });

    // If nextCompleted is true and now ALL subtasks are completed, and the main task is not yet completed:
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);
    if (nextCompleted && allDone && !task.completed) {
      setTaskPromptToComplete({
        ...task,
        subtasks: updatedSubtasks,
      });
    }
  };

  // Quick Add Subtask directly under task
  const handleQuickAddSubtask = async (task: TaskItem) => {
    if (!task.id || !quickSubtaskTitle.trim()) return;
    const newSubtask: TaskSubtask = {
      id: 'st_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: quickSubtaskTitle.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    await onUpdateTask(task.id, {
      subtasks: updatedSubtasks,
    });
    soundManager.playCheck();
    setQuickSubtaskTitle('');
  };

  // Delete Subtask directly under task
  const handleDeleteSubtask = async (task: TaskItem, subtaskId: string) => {
    if (!task.id) return;
    const updatedSubtasks = (task.subtasks || []).filter((s) => s.id !== subtaskId);
    await onUpdateTask(task.id, {
      subtasks: updatedSubtasks,
    });
  };

  // Confirm completion of main task from pop-up modal
  const handleConfirmCompleteMainTask = async () => {
    if (!taskPromptToComplete || !taskPromptToComplete.id) return;
    const target =
      taskPromptToComplete.targetValue && taskPromptToComplete.targetValue > 0
        ? taskPromptToComplete.targetValue
        : taskPromptToComplete.currentValue || 1;

    await onUpdateTask(taskPromptToComplete.id, {
      completed: true,
      completedAt: Date.now(),
      kanbanStatus: 'completed',
      ...(taskPromptToComplete.isMeasurable ? { currentValue: target } : {}),
    });

    soundManager.playCheck();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#059669', '#FBBF24'],
      });
    } catch {}

    setTaskPromptToComplete(null);
  };

  // Decline completion of main task from pop-up modal
  const handleDeclineCompleteMainTask = () => {
    setTaskPromptToComplete(null);
  };

  // Bulk Selection Handlers
  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedTaskIds(filteredTasks.map((t) => t.id!).filter(Boolean));
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds([]);
  };

  const handleApplyBulkEdit = async (updates: Partial<TaskItem>) => {
    if (onBulkUpdateTasks && selectedTaskIds.length > 0) {
      await onBulkUpdateTasks(selectedTaskIds, updates);
      setSelectedTaskIds([]);
      setShowBulkEditModal(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (onBulkDeleteTasks && selectedTaskIds.length > 0) {
      await onBulkDeleteTasks(selectedTaskIds);
      setSelectedTaskIds([]);
      setShowBulkDeleteModal(false);
    }
  };

  const handleClearCompleted = async () => {
    const completedIds = tasks.filter((t) => t.completed && t.id).map((t) => t.id!);
    if (onBulkDeleteTasks && completedIds.length > 0) {
      await onBulkDeleteTasks(completedIds);
      setShowClearCompletedModal(false);
    }
  };

  // 1-Click Morning Rollover: Move all overdue/yesterday's unfinished tasks to Today
  const handleRolloverAllOverdueToToday = async () => {
    const overdueTasks = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr && t.id);
    if (overdueTasks.length === 0) return;

    try {
      if (onBulkUpdateTasks) {
        await onBulkUpdateTasks(overdueTasks.map((t) => t.id!), { dueDate: todayStr });
      } else {
        for (const t of overdueTasks) {
          await onUpdateTask(t.id!, { dueDate: todayStr });
        }
      }
      soundManager.playCheck();
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#059669', '#3B82F6']
      });
    } catch (err) {
      console.error('Failed to rollover overdue tasks:', err);
    }
  };

  // Drag & Drop Handlers for List view
  const handleDragStartRow = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverRow = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDropRow = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reordered = [...tasks];
    const [movedTask] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, movedTask);

    if (onReorderTasks) {
      const ids = reordered.map((t) => t.id!).filter(Boolean);
      await onReorderTasks(ids);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Drag & Drop Handlers for Kanban Board
  const handleKanbanDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleKanbanDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleKanbanDrop = async (e: React.DragEvent, targetStatus: 'todo' | 'in_progress' | 'completed') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await handleMoveTaskStatus(task, targetStatus);
  };

  // Filter Tasks
  const projectMap = useMemo(() => {
    const map = new Map<string, ProjectItem>();
    allProjects.forEach((p) => { if (p.id) map.set(p.id, p); });
    return map;
  }, [allProjects]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Smart Filter
      if (smartFilter === 'today' && task.dueDate !== todayStr) return false;
      if (smartFilter === 'overdue' && (!task.dueDate || task.dueDate >= todayStr || task.completed)) return false;
      if (smartFilter === 'high' && task.priority !== 'High') return false;
      if (smartFilter === 'measurable' && !task.isMeasurable) return false;
      if (smartFilter === 'completed' && !task.completed) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q) || false;
        const matchesCat = task.category?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [tasks, smartFilter, searchQuery, todayStr]);

  // Kanban Filtered Lists
  const todoKanbanTasks = useMemo(() => {
    return filteredTasks.filter(t => 
      !t.completed && 
      (t.kanbanStatus === 'todo' || (!t.kanbanStatus && (!t.currentValue || t.currentValue === 0) && (!t.focusedMinutes || t.focusedMinutes === 0)))
    );
  }, [filteredTasks]);

  const inProgressKanbanTasks = useMemo(() => {
    return filteredTasks.filter(t => 
      !t.completed && 
      (t.kanbanStatus === 'in_progress' || (!t.kanbanStatus && ((t.currentValue && t.currentValue > 0) || (t.focusedMinutes && t.focusedMinutes > 0))))
    );
  }, [filteredTasks]);

  const completedKanbanTasks = useMemo(() => {
    return filteredTasks.filter(t => t.completed || t.kanbanStatus === 'completed');
  }, [filteredTasks]);

  // Counts
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const overdueCount = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr).length;

  return (
    <div className="space-y-4 max-w-full">
      {/* ========================================================
          TOP CONTROL BAR & VIEW SWITCHER
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3.5 sm:p-4 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200/60 dark:border-emerald-800">
            <CheckSquare size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{isAr ? 'إدارة المهام والتنفيذ' : 'Task & Execution Hub'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {totalCount}
              </span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isAr ? 'نظام العمل الإنجازي: كانبان، قوائم سلسة، وجلسات بومودورو مدمجة' : 'High-productivity action hub: Kanban, smart lists, and integrated Pomodoro sessions'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* New Task Trigger Button (Opens Sleek Modal) */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>{isAr ? 'مهمة جديدة' : 'New Task'}</span>
          </button>

          {/* Select Mode Toggle */}
          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setSelectedTaskIds([]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isSelectMode
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:text-neutral-900'
            }`}
          >
            {isSelectMode ? (isAr ? 'إلغاء التحديد' : 'Done Selecting') : (isAr ? 'تحديد متعدد' : 'Select Mode')}
          </button>

          {/* View Switcher Pills */}
          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-3xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <List size={14} />
              <span className="hidden sm:inline">{isAr ? 'قائمة' : 'List'}</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-3xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">{isAr ? 'كانبان' : 'Kanban'}</span>
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'stats'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-3xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 size={14} />
              <span className="hidden sm:inline">{isAr ? 'إحصائيات' : 'Stats'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          STREAMLINED TASK CREATOR (MOBILE LAUNCHER + DESKTOP QUICK BAR)
          ======================================================== */}
      {/* MOBILE TRIGGER (Dedicated, spacious, opens CreateTaskModal) */}
      <div className="block sm:hidden bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent hover:bg-emerald-500/15 dark:from-emerald-500/20 dark:via-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/40 rounded-xl transition-all cursor-pointer group active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Plus size={20} />
            </div>
            <div className="text-left rtl:text-right">
              <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white block">
                {isAr ? 'إضافة مهمة جديدة...' : 'Create a new task...'}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {isAr ? 'اضغط لفتح نافذة التفاصيل والأولويات والتاريخ' : 'Tap to set priority, date & project modal'}
              </span>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 shrink-0">
            <Plus size={14} />
            <span>{isAr ? 'أضف مهمة' : 'Add Task'}</span>
          </span>
        </button>
      </div>

      {/* DESKTOP QUICK ADDER (Spacious with Modal Trigger) */}
      <div className="hidden sm:block bg-white dark:bg-neutral-900 p-3.5 sm:p-4 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs space-y-3">
        <form onSubmit={handleCreateTask} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 focus-within:border-emerald-500 focus-within:bg-white dark:focus-within:bg-neutral-800 transition-all">
              <Plus size={18} className="text-neutral-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={isAr ? 'أضف مهمة جديدة (اضغط Enter لحفظ المهمة مباشرة)...' : 'Add a task (e.g., Read 15 pages of book)...'}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-transparent border-none text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none placeholder:text-neutral-400"
              />
            </div>

            {/* Quick Priority */}
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Priority)}
              className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer shrink-0"
            >
              <option value="High">{isAr ? '🔴 مرتفعة' : '🔴 High'}</option>
              <option value="Med">{isAr ? '🟡 متوسطة' : '🟡 Med'}</option>
              <option value="Low">{isAr ? '🟢 منخفضة' : '🟢 Low'}</option>
            </select>

            {/* Quick Date */}
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="px-2.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold font-mono bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer shrink-0"
            />

            {/* Modal Trigger Button for Desktop */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title={isAr ? 'فتح نافذة إضافة المهمة الكاملة' : 'Open Full Task Modal'}
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>{isAr ? 'نافذة التفاصيل' : 'Full Modal'}</span>
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-3xs"
            >
              <Plus size={15} />
              <span>{isSubmitting ? (isAr ? 'جاري الإضافة...' : 'Adding...') : (isAr ? 'إضافة' : 'Add')}</span>
            </button>
          </div>

          {/* Advanced Collapsible Options */}
          {showAdvancedOptions && (
            <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Project Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                    {isAr ? 'ربط بمشروع:' : 'Assign to Project:'}
                  </label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="">{isAr ? 'بدون مشروع' : 'No Project'}</option>
                    {allProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                    {isAr ? 'التصنيف:' : 'Category:'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="Business">{isAr ? 'العمل والأعمال' : 'Business'}</option>
                    <option value="Personal">{isAr ? 'شخصي' : 'Personal'}</option>
                    <option value="Finance">{isAr ? 'المالية' : 'Finance'}</option>
                    <option value="Health">{isAr ? 'الصحة والعافية' : 'Health'}</option>
                    <option value="Operations">{isAr ? 'العمليات' : 'Operations'}</option>
                  </select>
                </div>

                {/* Measurable Target Toggle */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                    {isAr ? 'خاصية القياس (Level / Quantity):' : 'Measurable Goal:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewIsMeasurable(!newIsMeasurable)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      newIsMeasurable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Target size={14} className={newIsMeasurable ? 'text-emerald-600' : 'text-neutral-400'} />
                      <span>{isAr ? 'تفعيل الهدف المكمم' : 'Measurable Target'}</span>
                    </span>
                    <span className="text-[10px] font-mono">{newIsMeasurable ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Quantitative Inputs */}
              {newIsMeasurable && (
                <div className="flex items-center gap-3 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <span>{isAr ? 'الهدف:' : 'Target:'}</span>
                    <input
                      type="number"
                      min="1"
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-20 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-xs font-black bg-white dark:bg-neutral-800 text-center font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <span>{isAr ? 'الوحدة:' : 'Unit:'}</span>
                    <input
                      type="text"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="pages, mins..."
                      className="w-28 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-xs font-medium bg-white dark:bg-neutral-800"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* ========================================================
          SMART FILTER PILLS & SEARCH BAR
          ======================================================== */}
      {viewMode !== 'stats' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Smart Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSmartFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                smartFilter === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-3xs'
                  : 'bg-white dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/80 hover:text-neutral-900'
              }`}
            >
              {isAr ? `الكل (${totalCount})` : `All (${totalCount})`}
            </button>
            <button
              onClick={() => setSmartFilter('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                smartFilter === 'today'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs'
                  : 'bg-white dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/80 hover:text-emerald-600'
              }`}
            >
              {isAr ? 'اليوم' : 'Today'}
            </button>
            <button
              onClick={() => setSmartFilter('overdue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                smartFilter === 'overdue'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-3xs'
                  : 'bg-white dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/80 hover:text-rose-600'
              }`}
            >
              {isAr ? `المتأخرة (${overdueCount})` : `Overdue (${overdueCount})`}
            </button>
            <button
              onClick={() => setSmartFilter('high')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                smartFilter === 'high'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-3xs'
                  : 'bg-white dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/80 hover:text-amber-600'
              }`}
            >
              {isAr ? 'عالية الأولوية' : 'High Priority'}
            </button>
            <button
              onClick={() => setSmartFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                smartFilter === 'completed'
                  ? 'bg-neutral-700 text-white border-neutral-700 shadow-3xs'
                  : 'bg-white dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/80 hover:text-neutral-900'
              }`}
            >
              {isAr ? `المكتملة (${completedCount})` : `Done (${completedCount})`}
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder={isAr ? 'بحث في المهام...' : 'Search tasks...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700/80 text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Clear Completed Action */}
            {completedCount > 0 && (
              <button
                onClick={() => setShowClearCompletedModal(true)}
                className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                title={isAr ? 'مسح المهام المكتملة' : 'Clear completed tasks'}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MORNING KICKOFF & YESTERDAY'S TASKS ROLLOVER BANNER
          ======================================================== */}
      {overdueCount > 0 && viewMode !== 'stats' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw size={18} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>{isAr ? '🌅 انطلاقة الصباح: مهام متبقية من الأمس' : '🌅 Morning Rollover: Pending Tasks'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {overdueCount} {isAr ? 'مهام متأخرة' : 'overdue'}
                </span>
              </h2>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                {isAr
                  ? 'هل ترغب في ترحيل جميع مهام الأمس إلى قائمة اليوم بضغطة زر واحدة لتنظيم خطة يومك فوراً؟'
                  : 'Effortlessly roll over yesterday\'s pending tasks into today\'s plan with 1 click.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRolloverAllOverdueToToday}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{isAr ? `ترحيل الكل لليوم (${overdueCount})` : `Rollover All to Today (${overdueCount})`}</span>
            </button>
            {smartFilter !== 'overdue' && (
              <button
                type="button"
                onClick={() => setSmartFilter('overdue')}
                className="px-3 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
              >
                {isAr ? 'معاينة فقط' : 'Filter Overdue'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          BULK ACTION TOOLBAR (WHEN SELECT MODE ACTIVE)
          ======================================================== */}
      {selectedTaskIds.length > 0 && (
        <BulkActionToolbar
          selectedCount={selectedTaskIds.length}
          totalCount={filteredTasks.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onMakeHighPriority={() => handleApplyBulkEdit({ priority: 'High' })}
          onMoveToToday={() => handleApplyBulkEdit({ dueDate: todayStr })}
          onOpenBulkEdit={() => setShowBulkEditModal(true)}
          onOpenBulkDelete={() => setShowBulkDeleteModal(true)}
          onSendToPomodoro={() => {
            if (onBulkSendToPomodoro) {
              const selectedObjects = tasks.filter(t => t.id && selectedTaskIds.includes(t.id));
              onBulkSendToPomodoro(selectedObjects);
            }
          }}
          lang={lang}
        />
      )}

      {/* ========================================================
          VIEW MODE 1: STREAMLINED CLEAN LIST VIEW
          ======================================================== */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
              <CheckSquare size={36} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                {isAr ? 'لا توجد مهام مطابقة للفلتر المحدد' : 'No tasks match your selected filter'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {isAr ? 'أضف مهمة جديدة أو قم بتغيير الفلاتر أعلاه' : 'Add a new task or adjust your active search filters above'}
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Plus size={15} />
                <span>{isAr ? 'إضافة مهمة جديدة الآن' : 'Create Task Now'}</span>
              </button>
            </div>
          ) : (
            filteredTasks.map((task, index) => {
              const proj = task.projectId ? projectMap.get(task.projectId) : null;
              const isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr;
              const isToday = !task.completed && task.dueDate === todayStr;
              const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
              const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

              return (
                <div
                  key={task.id || index}
                  draggable={!isSelectMode}
                  onDragStart={(e) => handleDragStartRow(e, index)}
                  onDragOver={(e) => handleDragOverRow(e, index)}
                  onDrop={(e) => handleDropRow(e, index)}
                  className={`group relative bg-white dark:bg-neutral-900 rounded-2xl border transition-all flex flex-col ${
                    draggedIndex === index ? 'opacity-40' : ''
                  } ${
                    dragOverIndex === index ? 'border-emerald-500 scale-[1.005]' : 'border-neutral-200/80 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
                  } ${
                    task.completed ? 'bg-neutral-50/60 dark:bg-neutral-900/40 opacity-75' : ''
                  }`}
                >
                  {/* Top Main Task Row */}
                  <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    {/* Left Controls & Checkbox */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Drag Handle */}
                      <div className="hidden sm:block text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-400 cursor-grab active:cursor-grabbing">
                        <GripVertical size={14} />
                      </div>

                      {/* Selection Checkbox (Select Mode) */}
                      {isSelectMode && task.id && (
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={() => handleToggleSelectTask(task.id!)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                      )}

                      {/* Task Toggle Checkbox */}
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          task.completed
                            ? 'bg-emerald-600 text-white border-transparent'
                            : 'border-2 border-neutral-300 dark:border-neutral-600 hover:border-emerald-500 dark:hover:border-emerald-400'
                        }`}
                      >
                        {task.completed && <Check size={12} className="stroke-[3]" />}
                      </button>

                      {/* Content Block */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Title */}
                          <span
                            onClick={() => setSelectedTaskForDetail(task)}
                            className={`text-xs sm:text-sm font-semibold cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${
                              task.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-white'
                            }`}
                          >
                            {task.title}
                          </span>

                          {/* Project Badge */}
                          {proj && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                              <FolderKanban size={10} />
                              <span>{proj.title}</span>
                            </span>
                          )}

                          {/* Priority Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadgeStyle(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>

                          {/* Focused Minutes Badge */}
                          {(task.focusedMinutes || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                              <Flame size={10} />
                              <span>{task.focusedMinutes}m</span>
                            </span>
                          )}

                          {/* Due Date Indicator */}
                          {task.dueDate && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                              isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                : isToday
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}>
                              <Calendar size={10} />
                              <span>{getFriendlyDueDate(task.dueDate, isAr)}</span>
                            </span>
                          )}

                          {/* 1-Click Move to Today Button (Direct Rollover) */}
                          {!task.completed && task.dueDate !== todayStr && task.id && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await onUpdateTask(task.id!, { dueDate: todayStr });
                                soundManager.playCheck();
                                confetti({ particleCount: 22, spread: 45, origin: { y: 0.8 } });
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer active:scale-95 shadow-3xs"
                              title={isAr ? 'ترحيل هذه المهمة إلى تاريخ اليوم بنقرة واحدة' : 'Move this task to Today'}
                            >
                              <RotateCcw size={10} />
                              <span>{isAr ? 'إلى اليوم' : 'To Today'}</span>
                            </button>
                          )}

                          {/* Subtask count badge */}
                          {totalSubtasks > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (quickSubtaskTaskId === task.id) {
                                  setQuickSubtaskTaskId(null);
                                } else {
                                  setQuickSubtaskTaskId(task.id || null);
                                  setQuickSubtaskTitle('');
                                }
                              }}
                              className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                              title={isAr ? 'عرض / إضافة مهام فرعية' : 'View / Add subtasks'}
                            >
                              <ListTodo size={11} className={completedSubtasks === totalSubtasks ? 'text-emerald-500' : 'text-neutral-400'} />
                              <span>{completedSubtasks}/{totalSubtasks} {isAr ? 'فرعية' : 'subtasks'}</span>
                            </button>
                          )}
                        </div>

                        {/* Measurable Level Interactive Bar */}
                        {task.isMeasurable && task.targetValue && (
                          <div className="flex items-center gap-2 pt-0.5 max-w-sm">
                            <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full transition-all duration-300"
                                style={{ width: `${Math.min(100, ((task.currentValue || 0) / task.targetValue) * 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400">
                              <span>{task.currentValue || 0}/{task.targetValue} {task.unit || ''}</span>
                              <button
                                onClick={() => handleQuickStepProgress(task, 1)}
                                className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-emerald-600 cursor-pointer"
                                title="+1 Progress"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Direct Action Trio */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Subtasks Toggle / Quick Add Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (quickSubtaskTaskId === task.id) {
                            setQuickSubtaskTaskId(null);
                          } else {
                            setQuickSubtaskTaskId(task.id || null);
                            setQuickSubtaskTitle('');
                          }
                        }}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          totalSubtasks > 0 || quickSubtaskTaskId === task.id
                            ? 'text-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 hover:bg-emerald-100'
                            : 'text-neutral-400 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        title={isAr ? 'عرض / إضافة المهام الفرعية' : 'View / Add Subtasks'}
                      >
                        <ListTodo size={15} />
                      </button>

                      {/* Direct Task Pomodoro Launcher */}
                      {!task.completed && (
                        <button
                          onClick={() => setSelectedTaskForPomodoro(task)}
                          className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                          title={isAr ? 'تشغيل مؤقت بومودورو للمهمة' : 'Launch Task Pomodoro'}
                        >
                          <Timer size={15} />
                        </button>
                      )}

                      {/* Schedule in Weekly Planner */}
                      {!task.completed && onScheduleTask && (
                        <button
                          onClick={() => onScheduleTask(task)}
                          className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                          title={isAr ? 'جدولة في المخطط الأسبوعي' : 'Schedule in Weekly Planner'}
                        >
                          <Clock size={15} />
                        </button>
                      )}

                      {/* Details Modal */}
                      <button
                        onClick={() => setSelectedTaskForDetail(task)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title={isAr ? 'التفاصيل الكاملة والتعليقات' : 'Task Details'}
                      >
                        <Maximize2 size={15} />
                      </button>

                      {/* Archive Button */}
                      <button
                        onClick={async () => {
                          if (task.id) {
                            await onUpdateTask(task.id, { archived: true, archivedAt: Date.now() });
                          }
                        }}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                        title={isAr ? 'أرشفة المهمة' : 'Archive Task'}
                      >
                        <Archive size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setTaskToDelete(task)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title={isAr ? 'حذف المهمة' : 'Delete Task'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* SUBTASKS DISPLAY UNDER MAIN TASK (Smaller, Indented, and Checkable) */}
                  {(totalSubtasks > 0 || quickSubtaskTaskId === task.id) && (
                    <div className="px-3 pb-3 sm:px-3.5 sm:pb-3.5 pt-0">
                      <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-2.5 ps-7 sm:ps-9 space-y-1.5">
                        {/* Subtask completion summary */}
                        {totalSubtasks > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 pb-0.5">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <CheckCheck size={13} className={completedSubtasks === totalSubtasks ? 'text-emerald-500' : 'text-neutral-400'} />
                              <span>{isAr ? 'المهام الفرعية:' : 'Subtasks:'}</span>
                              <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">
                                {completedSubtasks}/{totalSubtasks}
                              </span>
                            </span>
                            {completedSubtasks === totalSubtasks && !task.completed && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                {isAr ? 'مكتملة بالكامل ✓' : 'All completed ✓'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Subtasks list */}
                        {(task.subtasks || []).map((st) => (
                          <div
                            key={st.id}
                            className={`flex items-center justify-between gap-2.5 py-1 px-2.5 rounded-xl border transition-all text-xs group/st ${
                              st.completed
                                ? 'bg-neutral-50/70 dark:bg-neutral-800/30 border-neutral-200/50 dark:border-neutral-800/50 opacity-80'
                                : 'bg-neutral-50/90 dark:bg-neutral-800/60 border-neutral-200/80 dark:border-neutral-700/60 hover:border-emerald-400'
                            }`}
                          >
                            {/* Checkbox and title */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleSubtask(task, st.id)}
                                className={`w-4 h-4 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                  st.completed
                                    ? 'bg-emerald-600 text-white border-transparent'
                                    : 'border-2 border-neutral-300 dark:border-neutral-500 hover:border-emerald-500 dark:hover:border-emerald-400 bg-white dark:bg-neutral-800'
                                }`}
                              >
                                {st.completed && <Check size={10} className="stroke-[3]" />}
                              </button>

                              <span
                                onClick={() => handleToggleSubtask(task, st.id)}
                                className={`text-xs cursor-pointer select-none transition-all ${
                                  st.completed
                                    ? 'line-through text-neutral-400 dark:text-neutral-500'
                                    : 'text-neutral-800 dark:text-neutral-200 font-medium'
                                }`}
                              >
                                {st.title}
                              </span>
                            </div>

                            {/* Delete subtask button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(task, st.id)}
                              className="opacity-0 group-hover/st:opacity-100 p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-opacity cursor-pointer shrink-0"
                              title={isAr ? 'حذف المهمة الفرعية' : 'Delete subtask'}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                        {/* Inline Quick Add Subtask Input / Trigger */}
                        {quickSubtaskTaskId === task.id ? (
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              autoFocus
                              placeholder={isAr ? 'اكتب اسم المهمة الفرعية واضغط Enter...' : 'Type subtask and press Enter...'}
                              value={quickSubtaskTitle}
                              onChange={(e) => setQuickSubtaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleQuickAddSubtask(task);
                                } else if (e.key === 'Escape') {
                                  setQuickSubtaskTaskId(null);
                                  setQuickSubtaskTitle('');
                                }
                              }}
                              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-emerald-400 dark:border-emerald-600 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuickAddSubtask(task)}
                              disabled={!quickSubtaskTitle.trim()}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                            >
                              {isAr ? 'أضف' : 'Add'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickSubtaskTaskId(null);
                                setQuickSubtaskTitle('');
                              }}
                              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickSubtaskTaskId(task.id || null);
                              setQuickSubtaskTitle('');
                            }}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 pt-1 cursor-pointer transition-colors"
                          >
                            <Plus size={13} />
                            <span>{isAr ? 'إضافة مهمة فرعية...' : 'Add subtask...'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          VIEW MODE 2: ENHANCED KANBAN BOARD VIEW
          ======================================================== */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: To Do Drop Zone */}
          <div 
            onDragOver={handleKanbanDragOver}
            onDrop={(e) => handleKanbanDrop(e, 'todo')}
            className="bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-3 flex flex-col min-h-[420px]"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-extrabold text-xs text-neutral-800 dark:text-neutral-200">
                  {isAr ? 'قيد الانتظار (To Do)' : 'To Do'}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-neutral-700 dark:text-neutral-300">
                  {todoKanbanTasks.length}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 hover:text-emerald-600 transition-colors cursor-pointer"
                  title={isAr ? 'إضافة مهمة' : 'Add Task'}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2.5 flex-1">
              {todoKanbanTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-400 text-xs font-medium">
                  {isAr ? 'اسحب المهمة إلى هنا' : 'Drag tasks here'}
                </div>
              ) : (
                todoKanbanTasks.map((task) => {
                  const proj = task.projectId ? projectMap.get(task.projectId) : null;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleKanbanDragStart(e, task.id!)}
                      className="group bg-white dark:bg-neutral-800/90 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 shadow-2xs hover:border-emerald-500 hover:shadow-md cursor-grab active:cursor-grabbing space-y-2.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span 
                          onClick={() => setSelectedTaskForDetail(task)}
                          className="text-xs font-bold text-neutral-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2 cursor-pointer"
                        >
                          {task.title}
                        </span>

                        <button
                          onClick={() => handleToggleTask(task)}
                          className="w-4 h-4 rounded border border-neutral-300 hover:border-emerald-500 shrink-0 cursor-pointer"
                          title={isAr ? 'إكمال' : 'Complete'}
                        />
                      </div>

                      {/* Project & Priority Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {proj && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <FolderKanban size={9} />
                            <span>{proj.title}</span>
                          </span>
                        )}

                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getPriorityBadgeStyle(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>

                        {task.dueDate && (
                          <span className="text-[9px] font-mono font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
                            {getFriendlyDueDate(task.dueDate, isAr)}
                          </span>
                        )}
                      </div>

                      {/* Subtasks inside Kanban Card */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-1 pt-1.5 border-t border-neutral-100 dark:border-neutral-700/60">
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold mb-0.5">
                            <span>{isAr ? 'المهام الفرعية:' : 'Subtasks:'}</span>
                            <span className="font-mono">{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                          </div>
                          {task.subtasks.map((st) => (
                            <div key={st.id} className="flex items-center gap-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSubtask(task, st.id);
                                }}
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                  st.completed
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-neutral-300 dark:border-neutral-600 hover:border-emerald-500'
                                }`}
                              >
                                {st.completed && <Check size={8} className="stroke-[3]" />}
                              </button>
                              <span
                                className={`line-clamp-1 select-none cursor-pointer ${st.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-300'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSubtask(task, st.id);
                                }}
                              >
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Action Footer */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between gap-1 text-[10px] flex-wrap">
                        {/* 1-Click Move to Today in Kanban */}
                        {!task.completed && task.dueDate !== todayStr && task.id && (
                          <button
                            type="button"
                            onClick={async () => {
                              await onUpdateTask(task.id!, { dueDate: todayStr });
                              soundManager.playCheck();
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all font-bold cursor-pointer flex items-center gap-1"
                            title={isAr ? 'ترحيل لليوم' : 'Move to Today'}
                          >
                            <RotateCcw size={10} />
                            <span>{isAr ? 'لليوم' : 'Today'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleMoveTaskStatus(task, 'in_progress')}
                          className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-all font-bold cursor-pointer flex items-center gap-1"
                        >
                          <span>{isAr ? 'بدء التنفيذ ➔' : 'Start ➔'}</span>
                        </button>

                        <button
                          onClick={() => setSelectedTaskForPomodoro(task)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all font-bold cursor-pointer flex items-center gap-1"
                          title={isAr ? 'بومودورو' : 'Pomodoro'}
                        >
                          <Timer size={11} />
                          <span>Pomo</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: In Progress Drop Zone */}
          <div 
            onDragOver={handleKanbanDragOver}
            onDrop={(e) => handleKanbanDrop(e, 'in_progress')}
            className="bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 space-y-3 flex flex-col min-h-[420px]"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="font-extrabold text-xs text-neutral-800 dark:text-neutral-200">
                  {isAr ? 'قيد التنفيذ (In Progress)' : 'In Progress'}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                {inProgressKanbanTasks.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {inProgressKanbanTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-400 text-xs font-medium">
                  {isAr ? 'اسحب المهمة لتبدأ تنفيذها' : 'Drag task here to start working'}
                </div>
              ) : (
                inProgressKanbanTasks.map((task) => {
                  const proj = task.projectId ? projectMap.get(task.projectId) : null;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleKanbanDragStart(e, task.id!)}
                      className="group bg-white dark:bg-neutral-800/90 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs hover:border-emerald-500 hover:shadow-md cursor-grab active:cursor-grabbing space-y-2.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span 
                          onClick={() => setSelectedTaskForDetail(task)}
                          className="text-xs font-bold text-neutral-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2 cursor-pointer"
                        >
                          {task.title}
                        </span>

                        {(task.focusedMinutes || 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <Flame size={10} />
                            <span>{task.focusedMinutes}m</span>
                          </span>
                        )}
                      </div>

                      {/* Project Badge */}
                      {proj && (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <FolderKanban size={9} />
                            <span>{proj.title}</span>
                          </span>
                        </div>
                      )}

                      {/* Quantitative Level Progress Bar */}
                      {task.isMeasurable && task.targetValue && (
                        <div className="space-y-1">
                          <div className="w-full bg-neutral-100 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full transition-all duration-300"
                              style={{ width: `${Math.min(100, ((task.currentValue || 0) / task.targetValue) * 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 font-bold">
                            <span>{task.currentValue || 0}/{task.targetValue} {task.unit || ''}</span>
                            <button
                              onClick={() => handleQuickStepProgress(task, 1)}
                              className="p-0.5 rounded hover:bg-neutral-200 text-emerald-600"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Subtasks inside In Progress Card */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-1 pt-1.5 border-t border-neutral-100 dark:border-neutral-700/60">
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold mb-0.5">
                            <span>{isAr ? 'المهام الفرعية:' : 'Subtasks:'}</span>
                            <span className="font-mono">{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                          </div>
                          {task.subtasks.map((st) => (
                            <div key={st.id} className="flex items-center gap-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSubtask(task, st.id);
                                }}
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                  st.completed
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-neutral-300 dark:border-neutral-600 hover:border-emerald-500'
                                }`}
                              >
                                {st.completed && <Check size={8} className="stroke-[3]" />}
                              </button>
                              <span
                                className={`line-clamp-1 select-none cursor-pointer ${st.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-300'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSubtask(task, st.id);
                                }}
                              >
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* DIRECT POMODORO LAUNCH BUTTON IN IN-PROGRESS */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => setSelectedTaskForPomodoro(task)}
                          className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play size={11} className="fill-white" />
                          <span>{isAr ? 'جلسة بومودورو ⏱' : 'Pomodoro Timer ⏱'}</span>
                        </button>

                        <button
                          onClick={() => handleMoveTaskStatus(task, 'completed')}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-emerald-100 text-neutral-600 hover:text-emerald-700 dark:bg-neutral-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                          title={isAr ? 'تعيين كمكتملة' : 'Mark Done'}
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Completed Drop Zone */}
          <div 
            onDragOver={handleKanbanDragOver}
            onDrop={(e) => handleKanbanDrop(e, 'completed')}
            className="bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-3 flex flex-col min-h-[420px]"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-extrabold text-xs text-neutral-800 dark:text-neutral-200">
                  {isAr ? 'مكتملة (Completed)' : 'Completed'}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                {completedKanbanTasks.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {completedKanbanTasks.length === 0 ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-400 text-xs font-medium">
                  {isAr ? 'المهام المكتملة ستظهر هنا' : 'Completed tasks appear here'}
                </div>
              ) : (
                completedKanbanTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleKanbanDragStart(e, task.id!)}
                    className="group bg-white/60 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-3xs opacity-80 space-y-1.5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span 
                        onClick={() => setSelectedTaskForDetail(task)}
                        className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 line-through line-clamp-2 cursor-pointer hover:text-emerald-600"
                      >
                        {task.title}
                      </span>

                      <button
                        onClick={() => handleMoveTaskStatus(task, 'todo')}
                        className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                        title={isAr ? 'إعادة الفتح' : 'Reopen'}
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>

                    {(task.focusedMinutes || 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-neutral-400">
                        <Flame size={9} />
                        <span>{task.focusedMinutes}m focused</span>
                      </span>
                    )}

                    {/* Subtasks inside Completed Kanban Card */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-neutral-100 dark:border-neutral-700/60">
                        {task.subtasks.map((st) => (
                          <div key={st.id} className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                            <span className="w-3 h-3 rounded flex items-center justify-center bg-emerald-600/70 text-white shrink-0">
                              <Check size={8} className="stroke-[3]" />
                            </span>
                            <span className="line-through line-clamp-1">{st.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW MODE 3: STATS & OVERVIEW
          ======================================================== */}
      {viewMode === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <p className="text-xs font-bold text-neutral-500">{isAr ? 'إجمالي المهام' : 'Total Tasks'}</p>
            <p className="text-3xl font-black font-mono text-neutral-900 dark:text-white">{totalCount}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <p className="text-xs font-bold text-emerald-600">{isAr ? 'المهام المكتملة' : 'Completed'}</p>
            <p className="text-3xl font-black font-mono text-emerald-600">{completedCount}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <p className="text-xs font-bold text-amber-500">{isAr ? 'نسبة الإنجاز' : 'Completion Rate'}</p>
            <p className="text-3xl font-black font-mono text-amber-500">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          MODALS INTEGRATION
          ======================================================== */}
      {/* Create New Task Dedicated Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAddTask={onAddTask}
        allProjects={allProjects}
        allGoals={allGoals}
        tasksCount={tasks.length}
        lang={lang}
      />

      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          isOpen={Boolean(selectedTaskForDetail)}
          onClose={() => setSelectedTaskForDetail(null)}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onScheduleTask={onScheduleTask}
          comments={comments}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          allTasks={tasks}
          allHabits={allHabits}
          allNotes={allNotes}
          allProjects={allProjects}
          allGoals={allGoals}
          lang={lang}
        />
      )}

      {selectedTaskForPomodoro && (
        <TaskPomodoroModal
          task={selectedTaskForPomodoro}
          isOpen={Boolean(selectedTaskForPomodoro)}
          onClose={() => setSelectedTaskForPomodoro(null)}
          onUpdateTask={onUpdateTask}
          onAddFocusSession={onAddFocusSession}
          allProjects={allProjects}
          lang={lang}
        />
      )}

      {taskToDelete && (
        <ConfirmModal
          isOpen={Boolean(taskToDelete)}
          title={isAr ? 'حذف المهمة' : 'Delete Task'}
          message={isAr ? `هل أنت متأكد من حذف المهمة "${taskToDelete.title}"؟` : `Are you sure you want to delete "${taskToDelete.title}"?`}
          confirmLabel={isAr ? 'حذف' : 'Delete'}
          cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
          isDestructive={true}
          isDanger={true}
          onConfirm={async () => {
            if (taskToDelete.id) await onDeleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }}
          onCancel={() => setTaskToDelete(null)}
          onClose={() => setTaskToDelete(null)}
        />
      )}

      {showClearCompletedModal && (
        <ConfirmModal
          isOpen={showClearCompletedModal}
          title={isAr ? 'مسح المهام المكتملة' : 'Clear Completed Tasks'}
          message={isAr ? 'هل أنت متأكد من حذف جميع المهام المكتملة؟' : 'Are you sure you want to delete all completed tasks?'}
          confirmLabel={isAr ? 'مسح الجميع' : 'Clear All'}
          cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
          isDestructive={true}
          isDanger={true}
          onConfirm={handleClearCompleted}
          onCancel={() => setShowClearCompletedModal(false)}
          onClose={() => setShowClearCompletedModal(false)}
        />
      )}

      {showBulkEditModal && (
        <BulkEditModal
          isOpen={showBulkEditModal}
          onClose={() => setShowBulkEditModal(false)}
          onApply={handleApplyBulkEdit}
          selectedCount={selectedTaskIds.length}
          lang={lang}
        />
      )}

      {showBulkDeleteModal && (
        <ConfirmModal
          isOpen={showBulkDeleteModal}
          title={isAr ? 'حذف المهام المحددة' : 'Delete Selected Tasks'}
          message={isAr ? `هل أنت متأكد من حذف ${selectedTaskIds.length} مهمة محددة؟` : `Are you sure you want to delete ${selectedTaskIds.length} selected tasks?`}
          confirmLabel={isAr ? 'حذف المجموع' : 'Delete Selected'}
          cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
          isDestructive={true}
          isDanger={true}
          onConfirm={handleConfirmBulkDelete}
          onCancel={() => setShowBulkDeleteModal(false)}
          onClose={() => setShowBulkDeleteModal(false)}
        />
      )}

      {/* Pop-up confirmation when all subtasks of a task are checked */}
      {taskPromptToComplete && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800 p-6 space-y-5 text-center transform scale-100 my-auto animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Sparkles size={28} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                {isAr ? 'أكملت جميع المهام الفرعية! 🎉' : 'All Subtasks Completed! 🎉'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {isAr
                  ? 'لقد أنهيت بنجاح كافة المهام الفرعية التابعة للمهمة:'
                  : 'You have finished all subtasks for the task:'}
              </p>
              <div className="text-sm font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800/80 py-2.5 px-3 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                "{taskPromptToComplete.title}"
              </div>
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 pt-1">
                {isAr
                  ? 'هل تريد تعليم المهمة كمنجزة بالكامل أيضاً؟'
                  : 'Would you like to mark the main task as completed too?'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeclineCompleteMainTask}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {isAr ? 'لا، اتركها قيد العمل' : 'No, Keep Active'}
              </button>

              <button
                type="button"
                onClick={handleConfirmCompleteMainTask}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={16} />
                <span>{isAr ? 'نعم، أكمل المهمة' : 'Yes, Complete Task'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
