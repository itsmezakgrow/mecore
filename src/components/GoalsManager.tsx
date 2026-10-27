import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Flag,
  Check,
  X,
  Compass,
  Zap,
  Flame,
  FolderGit2,
  ArrowRight,
  Sliders,
  CheckSquare,
  BarChart3,
  Link as LinkIcon
} from 'lucide-react';
import {
  GoalItem,
  GoalMilestone,
  GoalCategory,
  GoalTimeframe,
  GoalStatus,
  ProjectItem,
  HabitItem,
  WeeklyPriorityGoal
} from '../types';

interface GoalsManagerProps {
  goals: GoalItem[];
  projects?: ProjectItem[];
  habits?: HabitItem[];
  weeklyGoals?: WeeklyPriorityGoal[];
  onAddGoal: (goal: Omit<GoalItem, 'id'>) => Promise<any>;
  onUpdateGoal: (id: string, updates: Partial<GoalItem>) => Promise<any>;
  onDeleteGoal: (id: string) => Promise<any>;
  onAddWeeklyGoal?: (goal: Omit<WeeklyPriorityGoal, 'id'>) => Promise<any>;
  onUpdateWeeklyGoal?: (id: string, updates: Partial<WeeklyPriorityGoal>) => Promise<any>;
  onDeleteWeeklyGoal?: (id: string) => Promise<any>;
  lang?: 'en' | 'ar';
}

export const GoalsManager: React.FC<GoalsManagerProps> = ({
  goals,
  projects = [],
  habits = [],
  weeklyGoals = [],
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddWeeklyGoal,
  onUpdateWeeklyGoal,
  onDeleteWeeklyGoal,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'map' | 'archive'>('active');

  // Quick milestone input state per goal card
  const [quickMilestoneText, setQuickMilestoneText] = useState<Record<string, string>>({});

  const getCategoryLabel = (cat: string) => {
    if (!isAr) return cat;
    if (cat === 'All') return 'كل التصنيفات';
    switch (cat) {
      case 'Career & Business': return 'المهنة والعمل';
      case 'Health & Fitness': return 'الصحة واللياقة';
      case 'Finance': return 'المالية والاستثمار';
      case 'Personal Growth': return 'النمو الشخصي';
      case 'Relationships': return 'العلاقات والأسرة';
      case 'Mindset': return 'التفكير والذهن';
      default: return cat;
    }
  };

  const getTimeframeLabel = (tf: string) => {
    if (!isAr) return tf;
    if (tf === 'All') return 'كل الآفاق الزمنية';
    switch (tf) {
      case 'Quarterly': return 'ربع سنوي (٣ أشهر)';
      case '1 Year': return 'سنة واحدة';
      case '3 Years': return '٣ سنوات';
      case '5+ Years': return '٥+ سنوات';
      case 'Lifetime': return 'مدى الحياة';
      default: return tf;
    }
  };

  const getStatusLabel = (s: string) => {
    if (!isAr) return s;
    switch (s) {
      case 'In Progress': return 'قيد التنفيذ';
      case 'On Track': return 'على المسار';
      case 'Achieved': return 'تم إنجازه بنجاح';
      case 'At Risk': return 'في خطر';
      case 'Paused': return 'متوقف مؤقتاً';
      default: return s;
    }
  };

  // Form State
  const [title, setTitle] = useState('');
  const [vision, setVision] = useState('');
  const [endpointTarget, setEndpointTarget] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Career & Business');
  const [timeframe, setTimeframe] = useState<GoalTimeframe>('1 Year');
  const [status, setStatus] = useState<GoalStatus>('In Progress');
  const [targetDate, setTargetDate] = useState('');
  const [currentMetric, setCurrentMetric] = useState<string>('');
  const [targetMetric, setTargetMetric] = useState<string>('');
  const [metricUnit, setMetricUnit] = useState('');
  const [milestonesText, setMilestonesText] = useState('');
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Editing state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const categories: GoalCategory[] = [
    'Career & Business',
    'Health & Fitness',
    'Finance',
    'Personal Growth',
    'Relationships',
    'Mindset',
  ];

  const timeframes: GoalTimeframe[] = [
    'Quarterly',
    '1 Year',
    '3 Years',
    '5+ Years',
    'Lifetime',
  ];

  const now = Date.now();
  const activeGoals = goals.filter((g) => !g.archived && (!g.snoozeUntil || g.snoozeUntil < now));
  const archivedAndSnoozedGoals = goals.filter((g) => g.archived || (g.snoozeUntil && g.snoozeUntil > now));

  const filteredGoals = activeGoals.filter((g) => {
    const matchCat = selectedCategory === 'All' || g.category === selectedCategory;
    const matchTime = selectedTimeframe === 'All' || g.timeframe === selectedTimeframe;
    return matchCat && matchTime;
  });

  const filteredArchivedGoals = archivedAndSnoozedGoals.filter((g) => {
    const matchCat = selectedCategory === 'All' || g.category === selectedCategory;
    const matchTime = selectedTimeframe === 'All' || g.timeframe === selectedTimeframe;
    return matchCat && matchTime;
  });

  const handleOpenAdd = () => {
    setEditingGoalId(null);
    setTitle('');
    setVision('');
    setEndpointTarget('');
    setCategory('Career & Business');
    setTimeframe('1 Year');
    setStatus('In Progress');
    setTargetDate('');
    setCurrentMetric('');
    setTargetMetric('');
    setMetricUnit('');
    setMilestonesText('');
    setSelectedHabitIds([]);
    setSelectedProjectIds([]);
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (goal: GoalItem) => {
    setEditingGoalId(goal.id || null);
    setTitle(goal.title);
    setVision(goal.vision || '');
    setEndpointTarget(goal.endpointTarget || '');
    setCategory(goal.category);
    setTimeframe(goal.timeframe);
    setStatus(goal.status);
    setTargetDate(goal.targetDate || '');
    setCurrentMetric(goal.currentMetric !== undefined ? String(goal.currentMetric) : '');
    setTargetMetric(goal.targetMetric !== undefined ? String(goal.targetMetric) : '');
    setMetricUnit(goal.metricUnit || '');
    setMilestonesText((goal.milestones || []).map((m) => m.title).join('\n'));
    setSelectedHabitIds(goal.linkedHabitIds || []);
    setSelectedProjectIds(goal.linkedProjectIds || []);
    setNotes(goal.notes || '');
    setShowAddModal(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Parse milestones
    const lines = milestonesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let parsedMilestones: GoalMilestone[] = lines.map((line, idx) => ({
      id: `ms-${Date.now()}-${idx}`,
      title: line,
      completed: false,
    }));

    // If editing, preserve completion state where titles match
    if (editingGoalId) {
      const existing = goals.find((g) => g.id === editingGoalId);
      if (existing) {
        parsedMilestones = lines.map((line, idx) => {
          const match = (existing.milestones || []).find((m) => m.title === line);
          return {
            id: match?.id || `ms-${Date.now()}-${idx}`,
            title: line,
            completed: match?.completed || false,
            completedAt: match?.completedAt,
          };
        });
      }
    }

    const payload: Omit<GoalItem, 'id'> = {
      title: title.trim(),
      vision: vision.trim(),
      endpointTarget: endpointTarget.trim(),
      category,
      timeframe,
      status,
      targetDate: targetDate || undefined,
      currentMetric: currentMetric ? parseFloat(currentMetric) : undefined,
      targetMetric: targetMetric ? parseFloat(targetMetric) : undefined,
      metricUnit: metricUnit.trim() || undefined,
      milestones: parsedMilestones,
      linkedHabitIds: selectedHabitIds,
      linkedProjectIds: selectedProjectIds,
      notes: notes.trim() || undefined,
      createdAt: editingGoalId
        ? goals.find((g) => g.id === editingGoalId)?.createdAt || Date.now()
        : Date.now(),
      achievedAt: status === 'Achieved' ? Date.now() : undefined,
    };

    if (editingGoalId) {
      await onUpdateGoal(editingGoalId, payload);
    } else {
      await onAddGoal(payload);
    }

    setShowAddModal(false);
  };

  const toggleMilestone = async (goal: GoalItem, milestoneId: string) => {
    if (!goal.id) return;
    const updatedMilestones = (goal.milestones || []).map((m) => {
      if (m.id === milestoneId) {
        const nextCompleted = !m.completed;
        return {
          ...m,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
        };
      }
      return m;
    });

    const allDone = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.completed);
    await onUpdateGoal(goal.id, {
      milestones: updatedMilestones,
      status: allDone ? 'Achieved' : goal.status === 'Achieved' ? 'In Progress' : goal.status,
    });
  };

  const handleAddQuickMilestone = async (goal: GoalItem) => {
    if (!goal.id) return;
    const text = (quickMilestoneText[goal.id] || '').trim();
    if (!text) return;

    const newMilestone: GoalMilestone = {
      id: `ms-${Date.now()}`,
      title: text,
      completed: false,
    };

    const updated = [...(goal.milestones || []), newMilestone];
    await onUpdateGoal(goal.id, { milestones: updated });
    setQuickMilestoneText((prev) => ({ ...prev, [goal.id!]: '' }));
  };

  const toggleHabitSelection = (habitId: string) => {
    setSelectedHabitIds((prev) =>
      prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
    );
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  return (
    <div className={`space-y-6 animate-fadeIn pb-12 ${isAr ? 'text-right' : ''}`}>
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#16181D] p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
            <Compass size={14} className="text-emerald-500" />
            <span>{isAr ? 'نظام التحكم والربط الاستراتيجي' : 'Strategic Control & Endpoint Vision'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            {isAr ? 'الأهداف طويلة المدى وربط المشاريع والعادات' : 'Long-Term Goals & Synergy Hub'}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl">
            {isAr
              ? 'حدد رؤية واضحة لكل هدف، واربطه بالعادات اليومية والمشاريع الموصلة له، مع إمكانية إضافة نقاط ومحطات وسط كل هدف للتحكم والسيطرة الكاملة.'
              : 'Define clear end-state visions, link the specific daily habits and projects that will deliver each target, with micro-milestones for complete control.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          <span>{isAr ? 'إضافة هدف جديد' : 'New Goal'}</span>
        </button>
      </div>

      {/* Tabs Switcher: Active Goals vs Synergy Map vs Archive */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-900/80 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white dark:bg-[#1C1F26] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Target size={14} className={activeTab === 'active' ? 'text-emerald-500' : ''} />
            <span>{isAr ? `الأهداف النشطة (${activeGoals.length})` : `Active Goals (${activeGoals.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-white dark:bg-[#1C1F26] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Layers size={14} className={activeTab === 'map' ? 'text-indigo-500' : ''} />
            <span>{isAr ? 'خارطة الربط الاستراتيجي (الكل متصل)' : 'Strategic Synergy Map'}</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-[#1C1F26] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Clock size={14} className={activeTab === 'archive' ? 'text-amber-500' : ''} />
            <span>{isAr ? `المؤرشفة (${archivedAndSnoozedGoals.length})` : `Archive (${archivedAndSnoozedGoals.length})`}</span>
          </button>
        </div>
      </div>

      {/* ----------------- TAB 2: STRATEGIC SYNERGY MAP ----------------- */}
      {activeTab === 'map' && (
        <div className="bg-white dark:bg-[#16181D] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6 shadow-xs animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <LinkIcon size={14} />
                <span>{isAr ? 'رؤية السيطرة الشاملة والربط التلقائي' : 'Holistic Connectivity & Control Architecture'}</span>
              </div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">
                {isAr ? 'كيف ترتبط أهدافك بالمشاريع والعادات والأولويات الأسبوعية' : 'How Goals Connect to Projects, Habits & Weekly Priorities'}
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-xl">
              {activeGoals.length} {isAr ? 'أهداف نشطة' : 'Active Goals'}
            </span>
          </div>

          {activeGoals.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              {isAr ? 'أضف أول هدف طويل المدى لعرض خارطة الربط المتكاملة.' : 'Add your first goal to view the connected synergy map.'}
            </div>
          ) : (
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const linkedP = projects.filter((p) => (goal.linkedProjectIds || []).includes(p.id!));
                const linkedH = habits.filter((h) => (goal.linkedHabitIds || []).includes(h.id!));
                const linkedW = weeklyGoals.filter((wg) => wg.linkedGoalId === goal.id);

                return (
                  <div
                    key={goal.id}
                    className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h3 className="font-extrabold text-neutral-900 dark:text-white text-sm">
                          🎯 {goal.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {getTimeframeLabel(goal.timeframe)}
                        </span>
                        {goal.targetDate && (
                          <span className="text-[10px] text-neutral-400 font-mono">
                            📅 {goal.targetDate}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {goal.status}
                      </span>
                    </div>

                    {/* Hierarchy flow: Projects + Habits + Weekly Priorities */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                      {/* Projects delivering this goal */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-300 text-[11px]">
                          <FolderGit2 size={13} className="text-blue-500" />
                          <span>{isAr ? 'المشاريع الموصلة للهدف:' : 'Delivering Projects:'}</span>
                        </div>
                        {linkedP.length === 0 ? (
                          <p className="text-[10px] text-neutral-400 italic">{isAr ? 'لم يتم ربط مشاريع بعد' : 'No linked projects'}</p>
                        ) : (
                          <div className="space-y-1">
                            {linkedP.map((p) => {
                              const doneSub = (p.subtasks || []).filter((s) => s.completed).length;
                              return (
                                <div key={p.id} className="p-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 flex items-center justify-between text-[11px]">
                                  <span className="font-semibold truncate max-w-[140px]">{p.title}</span>
                                  <span className="text-[10px] font-mono text-neutral-500">{doneSub}/{(p.subtasks || []).length} مهام</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Daily habits fueling this goal */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-300 text-[11px]">
                          <Flame size={13} className="text-amber-500" />
                          <span>{isAr ? 'العادات اليومية الملزمة:' : 'Fueling Daily Habits:'}</span>
                        </div>
                        {linkedH.length === 0 ? (
                          <p className="text-[10px] text-neutral-400 italic">{isAr ? 'لم يتم ربط عادات بعد' : 'No linked habits'}</p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {linkedH.map((h) => (
                              <span key={h.id} className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                <span>{h.icon || '🔥'}</span>
                                <span className="truncate max-w-[100px]">{h.title}</span>
                                <span className="text-[9px] opacity-75">({h.streak || 0}d)</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Weekly focus goals connected */}
                      <div className="p-3 rounded-xl bg-white dark:bg-[#1A1D24] border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-300 text-[11px]">
                          <Target size={13} className="text-emerald-500" />
                          <span>{isAr ? 'أولويات الأسبوع المرتبطة:' : 'Weekly Priorities:'}</span>
                        </div>
                        {linkedW.length === 0 ? (
                          <p className="text-[10px] text-neutral-400 italic">{isAr ? 'لا توجد أولوية أسبوعية محددة' : 'No weekly priority set'}</p>
                        ) : (
                          <div className="space-y-1">
                            {linkedW.map((wg) => (
                              <div key={wg.id} className="p-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-[11px]">
                                <span className="font-bold text-emerald-800 dark:text-emerald-300 truncate max-w-[130px]">
                                  #{wg.rank} {wg.title}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-emerald-600">
                                  {wg.progressPercent}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter Chips Bar (only on Active or Archive tab) */}
      {activeTab !== 'map' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#16181D] p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          {/* Category filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {isAr ? `الكل (${activeTab === 'active' ? activeGoals.length : archivedAndSnoozedGoals.length})` : `All (${activeTab === 'active' ? activeGoals.length : archivedAndSnoozedGoals.length})`}
            </button>
            {categories.map((cat) => {
              const count = (activeTab === 'active' ? activeGoals : archivedAndSnoozedGoals).filter((g) => g.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  {getCategoryLabel(cat)} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400 text-[11px] font-bold">{isAr ? 'الأفق الزمني:' : 'Horizon:'}</span>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none text-xs font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="All">{isAr ? 'كل الآفاق الزمنية' : 'All Horizons'}</option>
              {timeframes.map((tf) => (
                <option key={tf} value={tf}>
                  {getTimeframeLabel(tf)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ----------------- TAB 1: GOALS GRID ----------------- */}
      {activeTab !== 'map' && (
        <>
          {(activeTab === 'active' ? filteredGoals : filteredArchivedGoals).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeTab === 'active' ? filteredGoals : filteredArchivedGoals).map((goal) => {
                const isExpanded = expandedGoalId === goal.id;
                const milestones = goal.milestones || [];
                const completedMilestones = milestones.filter((m) => m.completed).length;
                const progressPercent =
                  goal.targetMetric && goal.targetMetric > 0 && goal.currentMetric !== undefined
                    ? Math.min(100, Math.round((goal.currentMetric / goal.targetMetric) * 100))
                    : milestones.length > 0
                    ? Math.round((completedMilestones / milestones.length) * 100)
                    : goal.status === 'Achieved'
                    ? 100
                    : 0;

                const linkedP = projects.filter((p) => (goal.linkedProjectIds || []).includes(p.id!));
                const linkedH = habits.filter((h) => (goal.linkedHabitIds || []).includes(h.id!));

                let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
                if (goal.status === 'Achieved') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
                if (goal.status === 'At Risk') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
                if (goal.status === 'Paused') badgeColor = 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';

                return (
                  <div
                    key={goal.id}
                    className="bg-white dark:bg-[#16181D] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-emerald-500/40 transition-all p-5 sm:p-6 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Tags & Action row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {getCategoryLabel(goal.category)}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                            {getTimeframeLabel(goal.timeframe)}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {getStatusLabel(goal.status)}
                          </span>
                          {goal.targetDate && (
                            <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                              <Calendar size={11} /> {goal.targetDate}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(goal)}
                            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            title={isAr ? 'تعديل الهدف' : 'Edit Goal'}
                          >
                            <Edit2 size={13} />
                          </button>

                          {goal.archived ? (
                            <button
                              onClick={async () => {
                                if (goal.id) {
                                  await onUpdateGoal(goal.id, { archived: false, status: 'In Progress' });
                                }
                              }}
                              className="px-2 py-1 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer"
                              title={isAr ? 'استعادة الهدف' : 'Restore'}
                            >
                              {isAr ? 'استعادة' : 'Restore'}
                            </button>
                          ) : (
                            <button
                              onClick={() => goal.id && confirm(isAr ? `أرشفة الهدف "${goal.title}"؟` : `Archive goal "${goal.title}"?`) && onDeleteGoal(goal.id)}
                              className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={isAr ? 'أرشفة الهدف' : 'Archive Goal'}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Goal Title */}
                      <h3 className="text-base font-extrabold text-neutral-900 dark:text-white tracking-tight leading-snug">
                        {goal.title}
                      </h3>

                      {/* Vision Statement */}
                      {goal.vision && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 leading-relaxed italic">
                          "{goal.vision}"
                        </div>
                      )}

                      {/* Endpoint Target Box */}
                      {goal.endpointTarget && (
                        <div className="flex items-start gap-2 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300">
                          <Flag size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-emerald-950 dark:text-emerald-200">{isAr ? 'الحالة النهائية المستهدفة: ' : 'Target Outcome: '}</strong>
                            <span>{goal.endpointTarget}</span>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 font-bold">
                            {goal.targetMetric ? (isAr ? 'القياس الرقمي' : 'Metric') : (isAr ? 'إنجاز المحطات' : 'Milestones')}
                            {milestones.length > 0 && ` (${completedMilestones}/${milestones.length})`}
                          </span>
                          <span className="font-mono font-extrabold text-neutral-900 dark:text-white">
                            {goal.targetMetric
                              ? `${goal.currentMetric || 0} / ${goal.targetMetric} ${goal.metricUnit || ''} (${progressPercent}%)`
                              : `${progressPercent}%`}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Linked Habits Row ("العادات الموصلة للهدف") */}
                      {linkedH.length > 0 && (
                        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                            <Flame size={12} className="text-amber-500" />
                            {isAr ? 'العادات اليومية الملزمة للوصول للهدف:' : 'Habits Fueling This Goal:'}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {linkedH.map((h) => (
                              <div
                                key={h.id}
                                className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1"
                                title={isAr ? `سلسلة الالتزام: ${h.streak || 0} أيام` : `Streak: ${h.streak || 0} days`}
                              >
                                <span>{h.icon || '🔥'}</span>
                                <span className="truncate max-w-[90px]">{h.title}</span>
                                <span className="text-[9px] opacity-75 font-mono">{h.streak || 0}d</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Projects Row ("المشاريع الموصلة للهدف") */}
                      {linkedP.length > 0 && (
                        <div className="pt-1.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                            <FolderGit2 size={12} className="text-blue-500" />
                            {isAr ? 'المشاريع الداعمة للهدف:' : 'Projects Delivering This Target:'}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {linkedP.map((p) => {
                              const doneSub = (p.subtasks || []).filter((s) => s.completed).length;
                              return (
                                <div
                                  key={p.id}
                                  className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-300 text-[10px] font-bold flex items-center gap-1"
                                >
                                  <span>📁</span>
                                  <span className="truncate max-w-[100px]">{p.title}</span>
                                  <span className="text-[9px] opacity-75 font-mono">({doneSub}/{(p.subtasks || []).length})</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Milestones Drawer ("حاجة وسط حاجة") */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedGoalId(isExpanded ? null : goal.id || null)}
                          className="text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isAr ? 'المحطات والخطوات الفرعية' : 'Checkpoints & Milestones'} ({milestones.length})</span>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-2 pt-1 animate-fadeIn">
                          {/* List of Milestones */}
                          {milestones.length > 0 ? (
                            milestones.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => toggleMilestone(goal, m.id)}
                                className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs"
                              >
                                {m.completed ? (
                                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle size={16} className="text-neutral-400 shrink-0" />
                                )}
                                <span className={`flex-1 ${m.completed ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100 font-semibold'}`}>
                                  {m.title}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-neutral-400 italic py-1">
                              {isAr ? 'لم تتم إضافة محطات بعد. أضف أول خطوة أدناه:' : 'No checkpoints added yet. Add one below:'}
                            </p>
                          )}

                          {/* Quick Add Milestone Input */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={quickMilestoneText[goal.id!] || ''}
                              onChange={(e) =>
                                setQuickMilestoneText((prev) => ({ ...prev, [goal.id!]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddQuickMilestone(goal);
                                }
                              }}
                              placeholder={isAr ? '+ إضافة محطة أو خطوة وسط هذا الهدف...' : '+ Add checkpoint milestone...'}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none text-neutral-900 dark:text-white focus:outline-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddQuickMilestone(goal)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                            >
                              {isAr ? 'إضافة' : 'Add'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#16181D] rounded-3xl p-12 text-center border border-dashed border-neutral-300 dark:border-neutral-700 space-y-3">
              <Target size={36} className="mx-auto text-neutral-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {activeTab === 'archive'
                  ? (isAr ? 'لم يتم العثور على أهداف مؤرشفة' : 'No Archived Goals Found')
                  : (isAr ? 'لم يتم العثور على أهداف' : 'No Goals Found')}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {activeTab === 'archive'
                  ? (isAr ? 'لا توجد أهداف مؤرشفة حالياً.' : 'None of your goals are currently archived.')
                  : (isAr ? 'أنشئ أول هدف طويل المدى واربطه بالعادات والمشاريع لتحقيق السيطرة الكاملة.' : 'Create your first long-term target and connect it with habits and projects.')}
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isAr ? 'إنشاء أول هدف' : 'Create First Goal'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ----------------- ADD / EDIT GOAL MODAL ----------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className={`bg-white dark:bg-[#16181D] rounded-3xl max-w-2xl w-full my-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh] ${isAr ? 'text-right' : ''}`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-emerald-500" />
                <h3 className="text-base font-black text-neutral-900 dark:text-white">
                  {editingGoalId
                    ? (isAr ? 'تعديل الهدف وتفاصيل الربط' : 'Edit Goal & Linkages')
                    : (isAr ? 'تعريف هدف طويل المدى جديد' : 'Define New Long-Term Goal')}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-900 dark:text-white">
                  {isAr ? 'عنوان الهدف الاستراتيجي' : 'Goal Title'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: الوصول إلى استقلال مالي / إتقان البرمجة / لياقة بدنية ممتازة' : 'e.g. Scale SaaS to $50k MRR / Run Full Marathon / Publish Book'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              {/* Category & Timeframe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-900 dark:text-white">{isAr ? 'التصنيف' : 'Category'}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {getCategoryLabel(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-900 dark:text-white">{isAr ? 'الأفق الزمني' : 'Timeframe'}</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as GoalTimeframe)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white"
                  >
                    {timeframes.map((tf) => (
                      <option key={tf} value={tf}>
                        {getTimeframeLabel(tf)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vision Statement */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-900 dark:text-white">
                  {isAr ? 'بيان الرؤية ("لماذا هذا الهدف حاسم بالنسبة لك؟")' : 'Vision Statement ("Why this matters")'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isAr ? 'كيف ستتغير حياتك بمجرد تحقيق هذا الهدف؟' : 'Why is this transformative?'}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              {/* Endpoint Target Definition */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-900 dark:text-white">
                  {isAr ? 'الغاية النهائية القابلة للقياس' : 'Specific Endpoint Definition'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'الحالة الملموسة مثلاً: "الوصول لوزن ٧٢ كجم ونسبة دهون ١٢٪"' : 'Measurable outcome e.g. 10,000 active subscribers'}
                  value={endpointTarget}
                  onChange={(e) => setEndpointTarget(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              {/* ---------------- HABITS LINKAGE SECTION ---------------- */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <label className="block text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-500" />
                  <span>{isAr ? 'العادات اليومية الملزمة للوصول لهذا الهدف (اختر العادات)' : 'Fueling Daily Habits (Select habits to link)'}</span>
                </label>
                <p className="text-[11px] text-neutral-500">
                  {isAr ? 'ما هي العادات التي إذا احترمتها يومياً أو أسبوعياً ستضمن لك الوصول لهذا الهدف؟' : 'Which habits directly drive this goal forward?'}
                </p>
                {habits.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic">{isAr ? 'لا توجد عادات مسجلة حالياً.' : 'No habits created yet.'}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto custom-scrollbar">
                    {habits.map((h) => {
                      const isSelected = selectedHabitIds.includes(h.id!);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => toggleHabitSelection(h.id!)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white dark:bg-[#1A1D24] border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-amber-400'
                          }`}
                        >
                          <span>{h.icon || '🔥'}</span>
                          <span>{h.title}</span>
                          {isSelected && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ---------------- PROJECTS LINKAGE SECTION ---------------- */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                <label className="block text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <FolderGit2 size={14} className="text-indigo-500" />
                  <span>{isAr ? 'المشاريع والبرامج الموصلة لهذا الهدف (اختر المشاريع)' : 'Delivering Projects (Select projects to link)'}</span>
                </label>
                <p className="text-[11px] text-neutral-500">
                  {isAr ? 'ما هو المشروع العملي الذي سيوصلك إلى هذا الهدف؟' : 'Which active project is driving this target?'}
                </p>
                {projects.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic">{isAr ? 'لا توجد مشاريع مسجلة حالياً.' : 'No projects created yet.'}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto custom-scrollbar">
                    {projects.map((p) => {
                      const isSelected = selectedProjectIds.includes(p.id!);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProjectSelection(p.id!)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                              : 'bg-white dark:bg-[#1A1D24] border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-indigo-400'
                          }`}
                        >
                          <span>📁</span>
                          <span>{p.title}</span>
                          {isSelected && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Numeric Metric tracking (Optional) */}
              <div className="grid grid-cols-3 gap-2 bg-neutral-50 dark:bg-neutral-900/40 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-500">{isAr ? 'القيمة الحالية' : 'Current Value'}</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={currentMetric}
                    onChange={(e) => setCurrentMetric(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-white dark:bg-[#1A1D24] text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-500">{isAr ? 'المستهدف' : 'Target Value'}</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="100"
                    value={targetMetric}
                    onChange={(e) => setTargetMetric(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-white dark:bg-[#1A1D24] text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-neutral-500">{isAr ? 'الوحدة' : 'Unit'}</label>
                  <input
                    type="text"
                    placeholder={isAr ? 'دولار، كجم، كتاب' : '$, kg, users'}
                    value={metricUnit}
                    onChange={(e) => setMetricUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-white dark:bg-[#1A1D24] text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Milestones textarea */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-900 dark:text-white">
                  {isAr ? 'المحطات الرئيسية (واحدة في كل سطر - حاجة وسط حاجة)' : 'Checkpoints / Milestones (1 per line)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isAr ? 'المحطة ١: الانتهاء من الخطة والنموذج الأولي\nالمحطة ٢: الوصول إلى أول ١٠٠ مشترك\nالمحطة ٣: التوسع إلى الأسواق الخارجية' : 'Milestone 1: Complete MVP\nMilestone 2: 100 beta testers\nMilestone 3: Public launch'}
                  value={milestonesText}
                  onChange={(e) => setMilestonesText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              {/* Target Date & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-900 dark:text-white">{isAr ? 'التاريخ النهائي المستهدف' : 'Target Deadline'}</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-900 dark:text-white">{isAr ? 'الحالة' : 'Status'}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GoalStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1D24] text-xs text-neutral-900 dark:text-white"
                  >
                    <option value="In Progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                    <option value="On Track">{isAr ? 'على المسار الصحيح' : 'On Track'}</option>
                    <option value="Achieved">{isAr ? 'تم إنجازه بنجاح' : 'Achieved'}</option>
                    <option value="At Risk">{isAr ? 'في خطر' : 'At Risk'}</option>
                    <option value="Paused">{isAr ? 'متوقف مؤقتاً' : 'Paused'}</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {editingGoalId
                    ? (isAr ? 'حفظ التعديلات' : 'Save Changes')
                    : (isAr ? 'إنشاء الهدف' : 'Create Goal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
