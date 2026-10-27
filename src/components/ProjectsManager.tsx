import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Target, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  Calendar, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Check,
  Edit2,
  Archive,
  Search,
  Filter,
  Link as LinkIcon,
  ExternalLink,
  Flame,
  TrendingUp,
  AlertCircle,
  Flag,
  ArrowRight,
  Sliders,
  X
} from 'lucide-react';
import { 
  ProjectItem, 
  ProjectSubtask, 
  GoalItem, 
  GoalCategory, 
  GoalTimeframe, 
  GoalStatus 
} from '../types';
import { ConfirmModal } from './ConfirmModal';
import confetti from 'canvas-confetti';

interface ProjectsManagerProps {
  projects: ProjectItem[];
  goals?: GoalItem[];
  onAddProject: (project: Omit<ProjectItem, 'id'>) => Promise<any>;
  onUpdateProject: (id: string, updates: Partial<ProjectItem>) => Promise<any>;
  onDeleteProject: (id: string) => Promise<any>;
  onAddGoal?: (goal: Omit<GoalItem, 'id'>) => Promise<any>;
  onUpdateGoal?: (id: string, updates: Partial<GoalItem>) => Promise<any>;
  onDeleteGoal?: (id: string) => Promise<any>;
  lang?: 'en' | 'ar';
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  projects = [],
  goals = [],
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';

  // ----------------- Filter State -----------------
  const [typeFilter, setTypeFilter] = useState<'all' | 'projects' | 'goals'>('all');
  const [sphereFilter, setSphereFilter] = useState<'all' | 'Business' | 'Personal'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ----------------- Modal States -----------------
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [createKind, setCreateKind] = useState<'project' | 'goal'>('project');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit Project Modal
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Edit Goal Modal
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);

  // Delete Confirm
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string; kind: 'project' | 'goal' } | null>(null);

  // Subtask quick input per project card
  const [activeSubtaskInput, setActiveSubtaskInput] = useState<{ [projectId: string]: string }>({});

  // ----------------- Project Form State (Add/Edit) -----------------
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState('Business');
  const [pStatus, setPStatus] = useState<ProjectItem['status']>('In Progress');
  const [pStartDate, setPStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pDeadline, setPDeadline] = useState('');
  const [pDailyAllocation, setPDailyAllocation] = useState<number>(25);
  const [pLinkedGoalId, setPLinkedGoalId] = useState<string>('');

  // ----------------- Goal Form State (Add/Edit) -----------------
  const [gTitle, setGTitle] = useState('');
  const [gVision, setGVision] = useState('');
  const [gEndpoint, setGEndpoint] = useState('');
  const [gCategory, setGCategory] = useState<GoalCategory>('Career & Business');
  const [gTimeframe, setGTimeframe] = useState<GoalTimeframe>('1 Year');
  const [gStatus, setGStatus] = useState<GoalStatus>('In Progress');
  const [gStartDate, setGStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [gTargetDate, setGTargetDate] = useState('');
  const [gCurrentMetric, setGCurrentMetric] = useState<string>('');
  const [gTargetMetric, setGTargetMetric] = useState<string>('');
  const [gMetricUnit, setGMetricUnit] = useState('');
  const [gLinkedProjectIds, setGLinkedProjectIds] = useState<string[]>([]);

  // ----------------- Helpers & Labels -----------------
  const getStatusLabel = (status: string) => {
    if (!isAr) return status;
    switch (status) {
      case 'In Progress': return 'قيد التنفيذ';
      case 'Planning': return 'قيد التخطيط';
      case 'Completed': return 'مكتمل';
      case 'On Hold': return 'معلق مؤقتاً';
      case 'On Track': return 'على المسار';
      case 'Achieved': return 'تم إنجازه';
      case 'At Risk': return 'في خطر';
      case 'Paused': return 'متوقف';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    if (!isAr) return category;
    switch (category) {
      case 'Business':
      case 'Career & Business': return 'الأعمال والشركات';
      case 'Engineering': return 'الهندسة والتطوير';
      case 'Design': return 'التصميم والواجهات';
      case 'Marketing': return 'التسويق والنمو';
      case 'Personal':
      case 'Personal Growth': return 'شخصي وحياتي';
      case 'Health & Fitness': return 'الصحة واللياقة';
      case 'Finance': return 'المالية والاستثمار';
      case 'Relationships': return 'العلاقات والأسرة';
      case 'Mindset': return 'التفكير والذهن';
      default: return category;
    }
  };

  // Timeline & Days Calculation helper
  const calculateTimelineMetrics = (createdTimestamp?: number, startDateStr?: string, deadlineStr?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine starting date
    let startD: Date;
    if (startDateStr) {
      startD = new Date(startDateStr);
    } else if (createdTimestamp) {
      startD = new Date(createdTimestamp);
    } else {
      startD = new Date();
    }
    startD.setHours(0, 0, 0, 0);

    // Days elapsed since start
    const diffTime = today.getTime() - startD.getTime();
    const daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    // Formatted start date
    const formattedStartDate = startD.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (!deadlineStr) {
      return {
        formattedStartDate,
        daysElapsed,
        hasDeadline: false,
        daysRemaining: null,
        percentElapsed: 0,
        isOverdue: false,
        formattedDeadline: null
      };
    }

    const endD = new Date(deadlineStr);
    endD.setHours(0, 0, 0, 0);

    const totalDuration = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));
    const remainingTime = endD.getTime() - today.getTime();
    const daysRemaining = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;

    let percentElapsed = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDuration) * 100)));
    if (isOverdue) percentElapsed = 100;

    const formattedDeadline = endD.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return {
      formattedStartDate,
      daysElapsed,
      hasDeadline: true,
      daysRemaining,
      percentElapsed,
      isOverdue,
      formattedDeadline
    };
  };

  // ----------------- Project Handlers -----------------
  const handleOpenAddModal = (kind: 'project' | 'goal' = 'project') => {
    setCreateKind(kind);
    // Reset project
    setPTitle('');
    setPDesc('');
    setPCategory('Business');
    setPStatus('In Progress');
    setPStartDate(new Date().toISOString().split('T')[0]);
    setPDeadline('');
    setPDailyAllocation(25);
    setPLinkedGoalId('');
    // Reset goal
    setGTitle('');
    setGVision('');
    setGEndpoint('');
    setGCategory('Career & Business');
    setGTimeframe('1 Year');
    setGStatus('In Progress');
    setGStartDate(new Date().toISOString().split('T')[0]);
    setGTargetDate('');
    setGCurrentMetric('');
    setGTargetMetric('');
    setGMetricUnit('');
    setGLinkedProjectIds([]);

    setShowAddModal(true);
  };

  const handleOpenEditProject = (project: ProjectItem) => {
    setEditingProject(project);
    setPTitle(project.title || '');
    setPDesc(project.description || '');
    setPCategory(project.category || 'Business');
    setPStatus(project.status || 'In Progress');
    setPStartDate(project.startDate || (project.createdAt ? new Date(project.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
    setPDeadline(project.deadline || '');
    setPDailyAllocation(project.dailyAllocationPercentage ?? 25);
    setPLinkedGoalId(project.linkedGoalId || '');
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const linkedGoalObj = goals.find(g => g.id === pLinkedGoalId);

      if (editingProject && editingProject.id) {
        // Update existing project
        await onUpdateProject(editingProject.id, {
          title: pTitle.trim(),
          description: pDesc.trim(),
          category: pCategory,
          status: pStatus,
          startDate: pStartDate,
          deadline: pDeadline || undefined,
          dailyAllocationPercentage: Number(pDailyAllocation) || 0,
          linkedGoalId: pLinkedGoalId || undefined,
          linkedGoalTitle: linkedGoalObj ? linkedGoalObj.title : undefined,
        });
        setEditingProject(null);
      } else {
        // Create new project
        await onAddProject({
          title: pTitle.trim(),
          description: pDesc.trim(),
          status: pStatus,
          category: pCategory,
          color: pCategory === 'Business' ? '#3B82F6' : '#10B981',
          startDate: pStartDate,
          deadline: pDeadline || undefined,
          dailyAllocationPercentage: Number(pDailyAllocation) || 0,
          linkedGoalId: pLinkedGoalId || undefined,
          linkedGoalTitle: linkedGoalObj ? linkedGoalObj.title : undefined,
          subtasks: [],
          createdAt: pStartDate ? new Date(pStartDate).getTime() : Date.now(),
        });
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditGoal = (goal: GoalItem) => {
    setEditingGoal(goal);
    setGTitle(goal.title || '');
    setGVision(goal.vision || '');
    setGEndpoint(goal.endpointTarget || '');
    setGCategory(goal.category || 'Career & Business');
    setGTimeframe(goal.timeframe || '1 Year');
    setGStatus(goal.status || 'In Progress');
    setGStartDate(goal.createdAt ? new Date(goal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setGTargetDate(goal.targetDate || '');
    setGCurrentMetric(goal.currentMetric !== undefined ? String(goal.currentMetric) : '');
    setGTargetMetric(goal.targetMetric !== undefined ? String(goal.targetMetric) : '');
    setGMetricUnit(goal.metricUnit || '');
    setGLinkedProjectIds(goal.linkedProjectIds || []);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle.trim() || !onAddGoal || !onUpdateGoal) return;

    setIsSubmitting(true);
    try {
      if (editingGoal && editingGoal.id) {
        // Update existing goal
        await onUpdateGoal(editingGoal.id, {
          title: gTitle.trim(),
          vision: gVision.trim(),
          endpointTarget: gEndpoint.trim(),
          category: gCategory,
          timeframe: gTimeframe,
          status: gStatus,
          targetDate: gTargetDate || undefined,
          currentMetric: gCurrentMetric ? Number(gCurrentMetric) : undefined,
          targetMetric: gTargetMetric ? Number(gTargetMetric) : undefined,
          metricUnit: gMetricUnit || undefined,
          linkedProjectIds: gLinkedProjectIds,
          createdAt: gStartDate ? new Date(gStartDate).getTime() : editingGoal.createdAt,
        });

        // Also update linked projects to reference this goal
        for (const pid of gLinkedProjectIds) {
          await onUpdateProject(pid, { linkedGoalId: editingGoal.id, linkedGoalTitle: gTitle.trim() });
        }

        setEditingGoal(null);
      } else {
        // Create new goal
        const newGoal = await onAddGoal({
          title: gTitle.trim(),
          vision: gVision.trim(),
          endpointTarget: gEndpoint.trim(),
          category: gCategory,
          timeframe: gTimeframe,
          status: gStatus,
          targetDate: gTargetDate || undefined,
          currentMetric: gCurrentMetric ? Number(gCurrentMetric) : undefined,
          targetMetric: gTargetMetric ? Number(gTargetMetric) : undefined,
          metricUnit: gMetricUnit || undefined,
          milestones: [],
          linkedProjectIds: gLinkedProjectIds,
          createdAt: gStartDate ? new Date(gStartDate).getTime() : Date.now(),
        });

        if (newGoal && newGoal.id && gLinkedProjectIds.length > 0) {
          for (const pid of gLinkedProjectIds) {
            await onUpdateProject(pid, { linkedGoalId: newGoal.id, linkedGoalTitle: gTitle.trim() });
          }
        }

        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Failed to save goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subtask management
  const handleAddSubtask = async (projectId: string) => {
    const text = (activeSubtaskInput[projectId] || '').trim();
    if (!text) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const newSubtask: ProjectSubtask = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: text,
      completed: false,
    };

    const updatedSubtasks = [...(project.subtasks || []), newSubtask];
    await onUpdateProject(projectId, { subtasks: updatedSubtasks });
    setActiveSubtaskInput({ ...activeSubtaskInput, [projectId]: '' });
  };

  const handleToggleSubtask = async (projectId: string, subtaskId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    let justCompleted = false;
    const updatedSubtasks = (project.subtasks || []).map((st) => {
      if (st.id === subtaskId) {
        if (!st.completed) justCompleted = true;
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);

    await onUpdateProject(projectId, {
      subtasks: updatedSubtasks,
      status: allDone ? 'Completed' : project.status,
    });

    if (justCompleted) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    }
  };

  const handleDeleteSubtask = async (projectId: string, subtaskId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedSubtasks = (project.subtasks || []).filter((st) => st.id !== subtaskId);
    await onUpdateProject(projectId, { subtasks: updatedSubtasks });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.kind === 'project') {
        await onDeleteProject(itemToDelete.id);
      } else if (itemToDelete.kind === 'goal' && onDeleteGoal) {
        await onDeleteGoal(itemToDelete.id);
      }
    } finally {
      setItemToDelete(null);
    }
  };

  // ----------------- Filter Logic -----------------
  const filteredProjects = useMemo(() => {
    if (typeFilter === 'goals') return [];
    return projects.filter((p) => {
      if (p.archived) return false;
      // Sphere filter
      if (sphereFilter !== 'all') {
        const cat = (p.category || '').toLowerCase();
        if (sphereFilter === 'Business' && !cat.includes('business') && !cat.includes('work') && !cat.includes('engineering') && !cat.includes('marketing')) {
          return false;
        }
        if (sphereFilter === 'Personal' && (cat.includes('business') || cat.includes('work') || cat.includes('engineering') || cat.includes('marketing'))) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (p.title || '').toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesGoal = (p.linkedGoalTitle || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesGoal) return false;
      }
      return true;
    });
  }, [projects, typeFilter, sphereFilter, statusFilter, searchQuery]);

  const filteredGoals = useMemo(() => {
    if (typeFilter === 'projects') return [];
    return goals.filter((g) => {
      if (g.archived) return false;
      // Sphere filter
      if (sphereFilter !== 'all') {
        const cat = (g.category || '').toLowerCase();
        if (sphereFilter === 'Business' && !cat.includes('business') && !cat.includes('career') && !cat.includes('finance')) {
          return false;
        }
        if (sphereFilter === 'Personal' && (cat.includes('business') || cat.includes('career') || cat.includes('finance'))) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'In Progress' && g.status !== 'In Progress' && g.status !== 'On Track') return false;
        if (statusFilter === 'Completed' && g.status !== 'Achieved') return false;
        if (statusFilter === 'On Hold' && g.status !== 'Paused' && g.status !== 'At Risk') return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (g.title || '').toLowerCase().includes(q);
        const matchesVision = (g.vision || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesVision) return false;
      }
      return true;
    });
  }, [goals, typeFilter, sphereFilter, statusFilter, searchQuery]);

  const totalVisibleItems = filteredProjects.length + filteredGoals.length;

  return (
    <div className={`space-y-6 max-w-7xl mx-auto animate-fadeIn ${isAr ? 'text-right' : ''}`}>
      {/* ----------------- Top Cockpit Header ----------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#787774] dark:text-neutral-400 font-semibold mb-1">
            <FolderKanban size={15} className="text-emerald-500" />
            <span>{isAr ? 'منظومة المشاريع والأهداف الاستراتيجية' : 'Executive Initiatives & Strategic Goals'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F3437] dark:text-white flex items-center gap-2.5">
            <span>{isAr ? 'المشاريع والأهداف' : 'Projects & Strategic Goals'}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-bold">
              {totalVisibleItems} {isAr ? 'عنصر' : 'items'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#787774] dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? 'التمييز بين الرؤى والغايات بعيدة المدى (Goals) والمشاريع التنفيذية المحددة بمهام ومواعيد (Projects) وربطهما معاً.'
              : 'Differentiate between high-level vision goals and tactical, time-bound project sprints with nested action items.'}
          </p>
        </div>

        {/* Action Controls & New Button */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          <button
            onClick={() => handleOpenAddModal('project')}
            className="flex items-center gap-2 bg-[#2F3437] dark:bg-white text-white dark:text-[#18191D] hover:bg-black dark:hover:bg-neutral-100 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>{isAr ? 'إضافة مشروع أو هدف جديد' : '+ New Item'}</span>
          </button>
        </div>
      </div>

      {/* ----------------- Filter Bar Next to + New ----------------- */}
      <div className="p-3.5 bg-white dark:bg-[#18191D] rounded-2xl border border-[#EAE9E6] dark:border-neutral-800 shadow-3xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Type Filter Buttons */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'all'
                ? 'bg-white dark:bg-[#20232B] text-neutral-900 dark:text-white shadow-3xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>{isAr ? 'الكل' : 'All Items'}</span>
            <span className="text-[10px] font-mono opacity-70">({projects.length + goals.length})</span>
          </button>

          <button
            onClick={() => setTypeFilter('projects')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'projects'
                ? 'bg-white dark:bg-[#20232B] text-blue-600 dark:text-blue-400 shadow-3xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FolderKanban size={13} />
            <span>{isAr ? 'المشاريع فقط' : 'Projects Only'}</span>
            <span className="text-[10px] font-mono opacity-70">({projects.length})</span>
          </button>

          <button
            onClick={() => setTypeFilter('goals')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'goals'
                ? 'bg-white dark:bg-[#20232B] text-purple-600 dark:text-purple-400 shadow-3xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Target size={13} />
            <span>{isAr ? 'الأهداف فقط' : 'Goals Only'}</span>
            <span className="text-[10px] font-mono opacity-70">({goals.length})</span>
          </button>
        </div>

        {/* Dropdown Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap flex-1 md:justify-end">
          {/* Sphere Filter */}
          <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/50 px-2.5 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-neutral-800">
            <span className="text-neutral-400 text-[11px] font-bold">{isAr ? 'المجال:' : 'Sphere:'}</span>
            <select
              value={sphereFilter}
              onChange={(e) => setSphereFilter(e.target.value as any)}
              className="bg-transparent text-neutral-800 dark:text-neutral-200 font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="dark:bg-neutral-900">{isAr ? 'كل المجالات' : 'All Spheres'}</option>
              <option value="Business" className="dark:bg-neutral-900">{isAr ? 'الأعمال (Business)' : '💼 Business'}</option>
              <option value="Personal" className="dark:bg-neutral-900">{isAr ? 'شخصي (Personal)' : '👤 Personal'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/50 px-2.5 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-neutral-800">
            <span className="text-neutral-400 text-[11px] font-bold">{isAr ? 'الحالة:' : 'Status:'}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-neutral-800 dark:text-neutral-200 font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="dark:bg-neutral-900">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="In Progress" className="dark:bg-neutral-900">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
              <option value="Planning" className="dark:bg-neutral-900">{isAr ? 'قيد التخطيط' : 'Planning'}</option>
              <option value="Completed" className="dark:bg-neutral-900">{isAr ? 'مكتمل / منجز' : 'Completed'}</option>
              <option value="On Hold" className="dark:bg-neutral-900">{isAr ? 'معلق / متوقف' : 'On Hold'}</option>
            </select>
          </div>

          {/* Quick Search Box */}
          <div className="relative min-w-[140px] flex-1 sm:max-w-[200px]">
            <Search size={13} className="absolute left-2.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث سريع...' : 'Search items...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white border border-[#EAE9E6] dark:border-neutral-800 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- Empty State ----------------- */}
      {totalVisibleItems === 0 && (
        <div className="py-16 text-center text-sm text-[#787774] dark:text-neutral-400 bg-white dark:bg-[#18191D] rounded-3xl border border-[#EAE9E6] dark:border-neutral-800 p-8 shadow-xs">
          <FolderKanban size={48} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
          <h3 className="font-extrabold text-[#2F3437] dark:text-white text-base">
            {isAr ? 'لا توجد عناصر مطابقة للفلتر المحدد' : 'No items match the selected filter'}
          </h3>
          <p className="text-xs mt-1 max-w-sm mx-auto text-neutral-500">
            {isAr
              ? 'جرّب تغيير خيارات التصفية أو أضف مشروعاً أو هدفاً استراتيجياً جديداً.'
              : 'Try clearing the search filter or click below to create a project or goal.'}
          </p>
          <div className="flex items-center justify-center gap-2.5 mt-5">
            <button
              onClick={() => handleOpenAddModal('project')}
              className="text-xs font-bold bg-[#2F3437] dark:bg-white text-white dark:text-[#18191D] px-4 py-2 rounded-xl hover:opacity-90 transition-all cursor-pointer"
            >
              {isAr ? '+ إنشاء مشروع' : '+ Create Project'}
            </button>
            <button
              onClick={() => handleOpenAddModal('goal')}
              className="text-xs font-bold bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-500 transition-all cursor-pointer"
            >
              {isAr ? '+ إنشاء هدف استراتيجي' : '+ Create Goal'}
            </button>
          </div>
        </div>
      )}

      {/* ----------------- Combined Projects & Goals Grid ----------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* RENDER PROJECTS */}
        {filteredProjects.map((project) => {
          const subtasks = project.subtasks || [];
          const completedCount = subtasks.filter((s) => s.completed).length;
          const subtaskProgress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;
          
          // Timeline intelligence
          const timeline = calculateTimelineMetrics(project.createdAt, project.startDate, project.deadline);

          return (
            <div
              key={`proj-${project.id}`}
              className="bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border border-[#EAE9E6] dark:border-neutral-800 shadow-sm hover:border-[#D3D1CB] dark:hover:border-neutral-700 transition-all flex flex-col justify-between relative group"
            >
              <div className="space-y-3.5">
                {/* Header Badge Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-50/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50 flex items-center gap-1">
                      <FolderKanban size={11} />
                      <span>{isAr ? 'مشروع' : 'Project'}</span>
                    </span>

                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700">
                      {getCategoryLabel(project.category)}
                    </span>

                    {/* Linked Goal Badge */}
                    {project.linkedGoalTitle && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 flex items-center gap-1 truncate max-w-[160px]">
                        <Target size={10} className="text-purple-500 shrink-0" />
                        <span className="truncate">{project.linkedGoalTitle}</span>
                      </span>
                    )}
                  </div>

                  {/* Actions: Edit, Archive, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border font-mono ${
                      project.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : project.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}>
                      {getStatusLabel(project.status)}
                    </span>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditProject(project)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                      title={isAr ? 'تعديل المشروع' : 'Edit Project'}
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => project.id && onUpdateProject(project.id, { archived: true, archivedAt: Date.now() })}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                      title={isAr ? 'أرشفة المشروع' : 'Archive project'}
                    >
                      <Archive size={14} />
                    </button>

                    <button
                      onClick={() => project.id && setItemToDelete({ id: project.id, title: project.title, kind: 'project' })}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title={isAr ? 'حذف المشروع' : 'Delete project'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-snug">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* ----------------- Creation Date & Timeline Counter Box ----------------- */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#1E2025] border border-neutral-200/70 dark:border-neutral-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Calendar size={12} className="text-emerald-500" />
                      <span>{isAr ? 'تاريخ البدء:' : 'Started:'} {timeline.formattedStartDate}</span>
                    </span>

                    {/* Elapsed days counter */}
                    <span className="font-bold px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                      ⏱️ {timeline.daysElapsed} {isAr ? (timeline.daysElapsed === 1 ? 'يوم مضى' : 'أيام مضت') : (timeline.daysElapsed === 1 ? 'day gone' : 'days gone')}
                    </span>
                  </div>

                  {/* Deadline & Remaining Days */}
                  {timeline.hasDeadline ? (
                    <div className="space-y-1.5 pt-1 border-t border-neutral-200/50 dark:border-neutral-800/50">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                          <Flag size={12} className={timeline.isOverdue ? 'text-rose-500' : 'text-indigo-500'} />
                          <span>{isAr ? 'الموعد النهائي:' : 'Deadline:'} {timeline.formattedDeadline}</span>
                        </span>

                        <span className={`font-bold px-2 py-0.5 rounded-md ${
                          timeline.isOverdue
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : timeline.daysRemaining === 0
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {timeline.isOverdue
                            ? (isAr ? `متأخر بـ ${Math.abs(timeline.daysRemaining!)} يوم` : `${Math.abs(timeline.daysRemaining!)} days overdue`)
                            : timeline.daysRemaining === 0
                            ? (isAr ? 'اليوم الموعد النهائي' : 'Due Today')
                            : (isAr ? `متبقي ${timeline.daysRemaining} يوم` : `${timeline.daysRemaining} days left`)}
                        </span>
                      </div>

                      {/* Visual Progress Timeline Bar */}
                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            timeline.isOverdue 
                              ? 'bg-rose-500' 
                              : timeline.percentElapsed > 80 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${timeline.percentElapsed}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                        <span>{isAr ? 'البداية' : 'Start'}</span>
                        <span>{timeline.percentElapsed}% {isAr ? 'من المدة انقضى' : 'timeline elapsed'}</span>
                        <span>{isAr ? 'الهدف' : 'Target'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{isAr ? 'لم يتم تحديد موعد نهائي' : 'No deadline specified'}</span>
                      <button
                        onClick={() => handleOpenEditProject(project)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                      >
                        {isAr ? '+ تحديد موعد نهائي' : '+ Set deadline'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtask Completion Progress */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#787774] dark:text-neutral-400 font-medium">
                      {isAr ? 'إنجاز المهام المتفرعة' : 'Subtask Completion'}
                    </span>
                    <span className="font-bold text-[#2F3437] dark:text-white">
                      {completedCount}/{subtasks.length} ({subtaskProgress}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                </div>

                {/* Nested Action Items List */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckSquare size={13} className="text-emerald-500" />
                    <span>{isAr ? 'المهام التنفيذية المتفرعة' : 'Nested Action Items'}</span>
                  </h4>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {subtasks.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic py-1">
                        {isAr ? 'لم تتم إضافة مهام فرعية بعد.' : 'No action items added yet.'}
                      </p>
                    ) : (
                      subtasks.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 text-xs group/item"
                        >
                          <button
                            onClick={() => project.id && handleToggleSubtask(project.id, st.id)}
                            className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0"
                          >
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              st.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-500'
                            }`}>
                              {st.completed && <Check size={11} className="stroke-[3]" />}
                            </div>
                            <span className={`truncate text-xs ${st.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200 font-medium'}`}>
                              {st.title}
                            </span>
                          </button>

                          <button
                            onClick={() => project.id && handleDeleteSubtask(project.id, st.id)}
                            className="text-neutral-400 hover:text-rose-500 p-1 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title={isAr ? 'حذف المهمة' : 'Delete subtask'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Subtask Input */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={activeSubtaskInput[project.id || ''] || ''}
                      onChange={(e) => setActiveSubtaskInput({ ...activeSubtaskInput, [project.id || '']: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (project.id) handleAddSubtask(project.id);
                        }
                      }}
                      placeholder={isAr ? 'إضافة مهمة فرعية...' : 'Add nested to-do...'}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => project.id && handleAddSubtask(project.id)}
                      className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {isAr ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer: Daily Allocation % and Status Dropdown */}
              <div className="pt-4 mt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <span>🎯 {isAr ? 'الحصة اليومية:' : 'Daily Allocation:'}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={project.dailyAllocationPercentage ?? 25}
                    onChange={(e) => project.id && onUpdateProject(project.id, { dailyAllocationPercentage: Number(e.target.value) })}
                    className="w-10 px-1 py-0.5 rounded border border-emerald-500/30 text-center font-mono font-bold bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none"
                  />
                  <span>%</span>
                </div>

                <select
                  value={project.status}
                  onChange={(e) => project.id && onUpdateProject(project.id, { status: e.target.value as any })}
                  className="px-2.5 py-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="In Progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                  <option value="Planning">{isAr ? 'قيد التخطيط' : 'Planning'}</option>
                  <option value="Completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                  <option value="On Hold">{isAr ? 'معلق مؤقتاً' : 'On Hold'}</option>
                </select>
              </div>
            </div>
          );
        })}

        {/* RENDER GOALS */}
        {filteredGoals.map((goal) => {
          const linkedProjectsList = projects.filter(p => p.linkedGoalId === goal.id || (goal.linkedProjectIds && goal.linkedProjectIds.includes(p.id || '')));
          const timeline = calculateTimelineMetrics(goal.createdAt, undefined, goal.targetDate);

          return (
            <div
              key={`goal-${goal.id}`}
              className="bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-3xl border-2 border-purple-200/80 dark:border-purple-900/50 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between relative group"
            >
              <div className="space-y-3.5">
                {/* Header Badge Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-900/60 flex items-center gap-1">
                      <Target size={11} className="text-purple-500" />
                      <span>{isAr ? 'هدف استراتيجي' : 'Strategic Goal'}</span>
                    </span>

                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700">
                      {getCategoryLabel(goal.category)}
                    </span>

                    {goal.timeframe && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        {goal.timeframe}
                      </span>
                    )}
                  </div>

                  {/* Actions: Edit, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border font-mono bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                      {getStatusLabel(goal.status)}
                    </span>

                    <button
                      onClick={() => handleOpenEditGoal(goal)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
                      title={isAr ? 'تعديل الهدف' : 'Edit Goal'}
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => goal.id && setItemToDelete({ id: goal.id, title: goal.title, kind: 'goal' })}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      title={isAr ? 'حذف الهدف' : 'Delete Goal'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title & Vision */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-snug">
                    {goal.title}
                  </h3>
                  {goal.vision && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                      {goal.vision}
                    </p>
                  )}
                  {goal.endpointTarget && (
                    <div className="mt-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                      🎯 {isAr ? 'المستهدف النهائي:' : 'Target State:'} {goal.endpointTarget}
                    </div>
                  )}
                </div>

                {/* ----------------- Creation Date & Timeline Counter Box ----------------- */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#1E2025] border border-neutral-200/70 dark:border-neutral-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Calendar size={12} className="text-purple-500" />
                      <span>{isAr ? 'تاريخ التأسيس:' : 'Created:'} {timeline.formattedStartDate}</span>
                    </span>

                    <span className="font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200">
                      ⏱️ {timeline.daysElapsed} {isAr ? (timeline.daysElapsed === 1 ? 'يوم مضى' : 'أيام مضت') : (timeline.daysElapsed === 1 ? 'day gone' : 'days gone')}
                    </span>
                  </div>

                  {timeline.hasDeadline ? (
                    <div className="space-y-1.5 pt-1 border-t border-neutral-200/50 dark:border-neutral-800/50">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                          <Flag size={12} className={timeline.isOverdue ? 'text-rose-500' : 'text-purple-500'} />
                          <span>{isAr ? 'الموعد المستهدف:' : 'Target Date:'} {timeline.formattedDeadline}</span>
                        </span>

                        <span className={`font-bold px-2 py-0.5 rounded-md ${
                          timeline.isOverdue
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                        }`}>
                          {timeline.isOverdue
                            ? (isAr ? `متأخر بـ ${Math.abs(timeline.daysRemaining!)} يوم` : `${Math.abs(timeline.daysRemaining!)} days overdue`)
                            : (isAr ? `متبقي ${timeline.daysRemaining} يوم` : `${timeline.daysRemaining} days left`)}
                        </span>
                      </div>

                      <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${timeline.isOverdue ? 'bg-rose-500' : 'bg-purple-500'}`}
                          style={{ width: `${timeline.percentElapsed}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{isAr ? 'أفق زمني مفتوح' : 'Open strategic timeframe'}</span>
                      <button
                        onClick={() => handleOpenEditGoal(goal)}
                        className="text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                      >
                        {isAr ? '+ تحديد موعد مستهدف' : '+ Set target date'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Numerical Metric Tracker */}
                {goal.targetMetric && goal.targetMetric > 0 && (
                  <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between font-bold text-neutral-800 dark:text-neutral-200">
                      <span>{isAr ? 'المقياس الرقمي' : 'Metric Tracker'}</span>
                      <span>
                        {goal.currentMetric || 0} / {goal.targetMetric} {goal.metricUnit || ''}
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 dark:bg-purple-900/50 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full transition-all rounded-full"
                        style={{ width: `${Math.min(100, Math.round(((goal.currentMetric || 0) / goal.targetMetric) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Connected Projects Sub-panel */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <FolderKanban size={13} className="text-blue-500" />
                      <span>{isAr ? `المشاريع التنفيذية المرتبطة (${linkedProjectsList.length})` : `Connected Action Projects (${linkedProjectsList.length})`}</span>
                    </h4>
                    <button
                      onClick={() => {
                        handleOpenAddModal('project');
                        setPLinkedGoalId(goal.id || '');
                      }}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isAr ? '+ ربط مشروع جديد' : '+ New Project for Goal'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {linkedProjectsList.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic py-1">
                        {isAr ? 'لا توجد مشاريع تنفيذية مرتبطة بهذا الهدف بعد.' : 'No active projects linked to this goal yet.'}
                      </p>
                    ) : (
                      linkedProjectsList.map((lp) => {
                        const stDone = (lp.subtasks || []).filter(s => s.completed).length;
                        const stTotal = (lp.subtasks || []).length;
                        const stProg = stTotal > 0 ? Math.round((stDone / stTotal) * 100) : 0;
                        return (
                          <div
                            key={lp.id}
                            className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                              📁 {lp.title}
                            </span>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shrink-0">
                              {stDone}/{stTotal} ({stProg}%)
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Goal Footer: Status Dropdown */}
              <div className="pt-4 mt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] font-bold text-neutral-400">
                  {goal.timeframe || 'Strategic'}
                </span>
                {onUpdateGoal && (
                  <select
                    value={goal.status}
                    onChange={(e) => goal.id && onUpdateGoal(goal.id, { status: e.target.value as any })}
                    className="px-2.5 py-1 rounded-xl border border-purple-200 dark:border-purple-900 bg-white dark:bg-neutral-900 text-xs font-bold text-purple-700 dark:text-purple-300 cursor-pointer focus:outline-none"
                  >
                    <option value="In Progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                    <option value="On Track">{isAr ? 'على المسار' : 'On Track'}</option>
                    <option value="Achieved">{isAr ? 'تم إنجازه' : 'Achieved'}</option>
                    <option value="At Risk">{isAr ? 'في خطر' : 'At Risk'}</option>
                    <option value="Paused">{isAr ? 'متوقف' : 'Paused'}</option>
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ----------------- CREATE MODAL (Project vs Goal) ----------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#18191D] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleIn max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-500" />
                  <span>{isAr ? 'إضافة مبادرة استراتيجية جديدة' : 'Create New Strategic Item'}</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {isAr ? 'اختر ما إذا كان هذا العنصر مشروعاً تنفيذياً أو غاية استراتيجية.' : 'Choose whether this is an actionable project or high-level goal.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Type Selector Toggle: PROJECT vs GOAL */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCreateKind('project')}
                className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  createKind === 'project'
                    ? 'bg-white dark:bg-[#20232B] text-blue-600 dark:text-blue-400 shadow-sm border border-neutral-200/80 dark:border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <FolderKanban size={15} />
                <span>{isAr ? '📁 مشروع (Project)' : '📁 Project'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateKind('goal')}
                className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  createKind === 'goal'
                    ? 'bg-white dark:bg-[#20232B] text-purple-600 dark:text-purple-400 shadow-sm border border-neutral-200/80 dark:border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Target size={15} />
                <span>{isAr ? '🎯 هدف استراتيجي (Goal)' : '🎯 Strategic Goal'}</span>
              </button>
            </div>

            {/* Info Hint */}
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {createKind === 'project'
                ? (isAr ? 'المشروع هو مبادرة محددة بزمن، مهام فرعية، وتخصيص جهد يومي.' : 'A Project is an actionable, time-bound sprint with subtasks and a tangible deadline.')
                : (isAr ? 'الهدف هو رؤية بعيدة المدى مع مقاييس رقمية وغايات عليا قد تتضمن مشاريع عدة.' : 'A Goal is an overarching vision with measurable targets that projects link to.')}
            </div>

            {/* FORM: PROJECT CREATION */}
            {createKind === 'project' && (
              <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'عنوان المشروع *' : 'Project Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={pTitle}
                    onChange={(e) => setPTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: إطلاق النسخة التجريبية للمنصة' : 'e.g., Validate Final University Semester'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'وصف المشروع ومخرجاته' : 'Description & Outcomes'}
                  </label>
                  <textarea
                    rows={2}
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    placeholder={isAr ? 'ما الذي سيحققه هذا المشروع عند اكتماله؟' : 'What defines the successful completion of this project?'}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Sphere Category & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'التصنيف / المجال' : 'Category / Sphere'}
                    </label>
                    <select
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="Business">{isAr ? 'الأعمال (Business)' : 'Business'}</option>
                      <option value="Personal">{isAr ? 'شخصي (Personal)' : 'Personal'}</option>
                      <option value="Engineering">{isAr ? 'الهندسة والتطوير' : 'Engineering'}</option>
                      <option value="Design">{isAr ? 'التصميم والواجهات' : 'Design'}</option>
                      <option value="Marketing">{isAr ? 'التسويق والمبيعات' : 'Marketing'}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'حالة المشروع' : 'Status'}
                    </label>
                    <select
                      value={pStatus}
                      onChange={(e) => setPStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="In Progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                      <option value="Planning">{isAr ? 'قيد التخطيط' : 'Planning'}</option>
                      <option value="Completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                      <option value="On Hold">{isAr ? 'معلق مؤقتاً' : 'On Hold'}</option>
                    </select>
                  </div>
                </div>

                {/* Dates: Start / Creation Date & Target Deadline */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                      <Calendar size={13} className="text-emerald-500" />
                      <span>{isAr ? 'تاريخ البدء / التأسيس' : 'Start Date (Created)'}</span>
                    </label>
                    <input
                      type="date"
                      value={pStartDate}
                      onChange={(e) => setPStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                      <Flag size={13} className="text-indigo-500" />
                      <span>{isAr ? 'الموعد النهائي المستهدف' : 'Target Deadline'}</span>
                    </label>
                    <input
                      type="date"
                      value={pDeadline}
                      onChange={(e) => setPDeadline(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Connect Goal Selector */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Target size={14} className="text-purple-500" />
                    <span>{isAr ? 'الغاية الاستراتيجية المرتبطة (Goal)' : 'Connected Overarching Goal'}</span>
                  </label>
                  <select
                    value={pLinkedGoalId}
                    onChange={(e) => setPLinkedGoalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="">{isAr ? '-- بدون ربط (مشروع مستقل) --' : '-- Standalone Project (No Linked Goal) --'}</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        🎯 {g.title} ({g.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Daily Allocation % */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'الحصة اليومية المستهدفة من الجهد (%):' : 'Target Daily Allocation (%):'}
                    </label>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{pDailyAllocation}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={pDailyAllocation}
                    onChange={(e) => setPDailyAllocation(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-sm active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وإنشاء المشروع' : 'Create Project')}
                  </button>
                </div>
              </form>
            )}

            {/* FORM: GOAL CREATION */}
            {createKind === 'goal' && (
              <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'عنوان الهدف الاستراتيجي *' : 'Strategic Goal Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={gTitle}
                    onChange={(e) => setGTitle(e.target.value)}
                    placeholder={isAr ? 'مثال: تحقيق الاستقلال المالي وبناء محفظة أعمال' : 'e.g., Reach $100k ARR & Financial Freedom'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'الرؤية والدافع العميق (Vision)' : 'The "Why" / Core Vision'}
                  </label>
                  <textarea
                    rows={2}
                    value={gVision}
                    onChange={(e) => setGVision(e.target.value)}
                    placeholder={isAr ? 'لماذا هذا الهدف محوري في حياتك؟' : 'Why does achieving this goal matter deeply to you?'}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'النتيجة الملموسة النهائية (Endpoint Target)' : 'Tangible Endpoint Target'}
                  </label>
                  <input
                    type="text"
                    value={gEndpoint}
                    onChange={(e) => setGEndpoint(e.target.value)}
                    placeholder={isAr ? 'مثال: امتلاك 3 عملاء دائمين بعائد 5000$ شهرياً' : 'e.g., 500 active paying users generating $10k MRR'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Category & Timeframe */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'التصنيف' : 'Category'}
                    </label>
                    <select
                      value={gCategory}
                      onChange={(e) => setGCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none font-bold"
                    >
                      <option value="Career & Business">{isAr ? 'المهنة والأعمال' : 'Career & Business'}</option>
                      <option value="Health & Fitness">{isAr ? 'الصحة واللياقة' : 'Health & Fitness'}</option>
                      <option value="Finance">{isAr ? 'المالية والاستثمار' : 'Finance'}</option>
                      <option value="Personal Growth">{isAr ? 'النمو الشخصي' : 'Personal Growth'}</option>
                      <option value="Relationships">{isAr ? 'العلاقات والأسرة' : 'Relationships'}</option>
                      <option value="Mindset">{isAr ? 'التفكير والذهن' : 'Mindset'}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'الأفق الزمني' : 'Timeframe'}
                    </label>
                    <select
                      value={gTimeframe}
                      onChange={(e) => setGTimeframe(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none font-bold"
                    >
                      <option value="Quarterly">{isAr ? 'ربع سنوي (٣ أشهر)' : 'Quarterly'}</option>
                      <option value="1 Year">{isAr ? 'سنة واحدة' : '1 Year'}</option>
                      <option value="3 Years">{isAr ? '٣ سنوات' : '3 Years'}</option>
                      <option value="5+ Years">{isAr ? '٥+ سنوات' : '5+ Years'}</option>
                      <option value="Lifetime">{isAr ? 'مدى الحياة' : 'Lifetime'}</option>
                    </select>
                  </div>
                </div>

                {/* Target Date */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'تاريخ التأسيس' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={gStartDate}
                      onChange={(e) => setGStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'الموعد المستهدف' : 'Target Date'}
                    </label>
                    <input
                      type="date"
                      value={gTargetDate}
                      onChange={(e) => setGTargetDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Metric Target */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'القيمة الحالية' : 'Current Value'}
                    </label>
                    <input
                      type="number"
                      value={gCurrentMetric}
                      onChange={(e) => setGCurrentMetric(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'المستهدف' : 'Target Value'}
                    </label>
                    <input
                      type="number"
                      value={gTargetMetric}
                      onChange={(e) => setGTargetMetric(e.target.value)}
                      placeholder="1000"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300">
                      {isAr ? 'الوحدة' : 'Unit'}
                    </label>
                    <input
                      type="text"
                      value={gMetricUnit}
                      onChange={(e) => setGMetricUnit(e.target.value)}
                      placeholder="$, users, kg"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold shadow-sm active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وإنشاء الهدف' : 'Create Goal')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ----------------- EDIT PROJECT MODAL ----------------- */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#18191D] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 space-y-4 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Edit2 size={16} className="text-blue-500" />
                <span>{isAr ? 'تعديل تفاصيل المشروع' : 'Modify Project'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'عنوان المشروع *' : 'Project Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold"
                  >
                    <option value="Business">{isAr ? 'الأعمال (Business)' : 'Business'}</option>
                    <option value="Personal">{isAr ? 'شخصي (Personal)' : 'Personal'}</option>
                    <option value="Engineering">{isAr ? 'الهندسة والتطوير' : 'Engineering'}</option>
                    <option value="Design">{isAr ? 'التصميم والواجهات' : 'Design'}</option>
                    <option value="Marketing">{isAr ? 'التسويق والمبيعات' : 'Marketing'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={pStatus}
                    onChange={(e) => setPStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold"
                  >
                    <option value="In Progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                    <option value="Planning">{isAr ? 'قيد التخطيط' : 'Planning'}</option>
                    <option value="Completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                    <option value="On Hold">{isAr ? 'معلق مؤقتاً' : 'On Hold'}</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <Calendar size={13} className="text-emerald-500" />
                    <span>{isAr ? 'تاريخ البدء / التأسيس' : 'Start Date (Created)'}</span>
                  </label>
                  <input
                    type="date"
                    value={pStartDate}
                    onChange={(e) => setPStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <Flag size={13} className="text-indigo-500" />
                    <span>{isAr ? 'الموعد النهائي' : 'Target Deadline'}</span>
                  </label>
                  <input
                    type="date"
                    value={pDeadline}
                    onChange={(e) => setPDeadline(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Linked Goal */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Target size={14} className="text-purple-500" />
                  <span>{isAr ? 'الهدف الاستراتيجي المرتبط' : 'Connected Goal'}</span>
                </label>
                <select
                  value={pLinkedGoalId}
                  onChange={(e) => setPLinkedGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold"
                >
                  <option value="">{isAr ? '-- بدون ربط (مشروع مستقل) --' : '-- Standalone Project --'}</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      🎯 {g.title} ({g.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Allocation % */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'الحصة اليومية المستهدفة (%):' : 'Daily Allocation (%):'}
                  </label>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{pDailyAllocation}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={pDailyAllocation}
                  onChange={(e) => setPDailyAllocation(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-sm active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (isAr ? 'جاري التحديث...' : 'Updating...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- EDIT GOAL MODAL ----------------- */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#18191D] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 space-y-4 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Edit2 size={16} className="text-purple-500" />
                <span>{isAr ? 'تعديل الهدف الاستراتيجي' : 'Modify Strategic Goal'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'عنوان الهدف *' : 'Goal Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={gTitle}
                  onChange={(e) => setGTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'الرؤية والدافع العميق' : 'Vision / The "Why"'}
                </label>
                <textarea
                  rows={2}
                  value={gVision}
                  onChange={(e) => setGVision(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'النتيجة الملموسة النهائية' : 'Endpoint Target'}
                </label>
                <input
                  type="text"
                  value={gEndpoint}
                  onChange={(e) => setGEndpoint(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={gCategory}
                    onChange={(e) => setGCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold"
                  >
                    <option value="Career & Business">{isAr ? 'المهنة والأعمال' : 'Career & Business'}</option>
                    <option value="Health & Fitness">{isAr ? 'الصحة واللياقة' : 'Health & Fitness'}</option>
                    <option value="Finance">{isAr ? 'المالية والاستثمار' : 'Finance'}</option>
                    <option value="Personal Growth">{isAr ? 'النمو الشخصي' : 'Personal Growth'}</option>
                    <option value="Relationships">{isAr ? 'العلاقات والأسرة' : 'Relationships'}</option>
                    <option value="Mindset">{isAr ? 'التفكير والذهن' : 'Mindset'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={gStatus}
                    onChange={(e) => setGStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold"
                  >
                    <option value="In Progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                    <option value="On Track">{isAr ? 'على المسار' : 'On Track'}</option>
                    <option value="Achieved">{isAr ? 'تم إنجازه' : 'Achieved'}</option>
                    <option value="At Risk">{isAr ? 'في خطر' : 'At Risk'}</option>
                    <option value="Paused">{isAr ? 'متوقف' : 'Paused'}</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'تاريخ التأسيس' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={gStartDate}
                    onChange={(e) => setGStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'الموعد المستهدف' : 'Target Date'}
                  </label>
                  <input
                    type="date"
                    value={gTargetDate}
                    onChange={(e) => setGTargetDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Metric Tracker */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">{isAr ? 'القيمة الحالية' : 'Current'}</label>
                  <input
                    type="number"
                    value={gCurrentMetric}
                    onChange={(e) => setGCurrentMetric(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">{isAr ? 'المستهدف' : 'Target'}</label>
                  <input
                    type="number"
                    value={gTargetMetric}
                    onChange={(e) => setGTargetMetric(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">{isAr ? 'الوحدة' : 'Unit'}</label>
                  <input
                    type="text"
                    value={gMetricUnit}
                    onChange={(e) => setGMetricUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold shadow-sm active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (isAr ? 'جاري التحديث...' : 'Updating...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- CONFIRM DELETE MODAL ----------------- */}
      {itemToDelete && (
        <ConfirmModal
          isOpen={true}
          title={itemToDelete.kind === 'project' ? (isAr ? 'حذف المشروع' : 'Delete Project') : (isAr ? 'حذف الهدف' : 'Delete Goal')}
          message={
            isAr
              ? `هل أنت متأكد من رغبتك في حذف "${itemToDelete.title}" نهائياً؟`
              : `Are you sure you want to delete "${itemToDelete.title}"? This cannot be undone.`
          }
          confirmLabel={isAr ? 'نعم، حذف' : 'Delete'}
          cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
};
