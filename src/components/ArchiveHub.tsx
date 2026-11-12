import React, { useState, useMemo } from 'react';
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  CheckSquare,
  FolderKanban,
  StickyNote,
  Layers,
  Flame,
  Target,
  ListChecks,
  CheckCircle2,
  Calendar,
  Tag,
  Sparkles,
  ArrowRight,
  Filter,
  BookOpen,
  TrendingUp,
  Dumbbell,
  Moon,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  Hash,
  ExternalLink,
  Plus,
  ShieldAlert,
  Activity
} from 'lucide-react';
import {
  TaskItem,
  HabitItem,
  ProjectItem,
  NoteItem,
  ChecklistGroup,
  DailyBlockItem,
  GoalItem,
  ReviewEntry,
  ModuleType
} from '../types';
import { ConfirmModal } from './ConfirmModal';

export type ArchiveItemType = 'task' | 'habit' | 'project' | 'note' | 'checklist' | 'dailyBlock' | 'goal' | 'review';

interface ArchiveHubProps {
  tasks: TaskItem[];
  habits: HabitItem[];
  projects: ProjectItem[];
  notes: NoteItem[];
  checklists: ChecklistGroup[];
  dailyBlocks: DailyBlockItem[];
  goals: GoalItem[];
  reviews?: ReviewEntry[];
  onUnarchiveItem: (type: ArchiveItemType, id: string) => Promise<void>;
  onPermanentDeleteItem: (type: ArchiveItemType, id: string) => Promise<void>;
  onArchiveCompletedTasks?: () => Promise<void>;
  onOpenReviewModal?: (type: 'weekly' | 'monthly' | 'archive') => void;
  onDeleteReview?: (id: string) => Promise<void>;
  lang?: 'en' | 'ar';
  onNavigateModule?: (module: ModuleType) => void;
}

export const ArchiveHub: React.FC<ArchiveHubProps> = ({
  tasks,
  habits,
  projects,
  notes,
  checklists,
  dailyBlocks,
  goals,
  reviews = [],
  onUnarchiveItem,
  onPermanentDeleteItem,
  onArchiveCompletedTasks,
  onOpenReviewModal,
  onDeleteReview,
  lang = 'en',
  onNavigateModule,
}) => {
  const isAr = lang === 'ar';
  const [selectedTab, setSelectedTab] = useState<'all' | ArchiveItemType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewSubFilter, setReviewSubFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    type: ArchiveItemType;
    id: string;
    title: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed but not archived tasks count
  const unarchivedCompletedTasks = useMemo(() => {
    return tasks.filter((t) => t.completed && !t.archived);
  }, [tasks]);

  // Periodic reviews (weekly & monthly)
  const periodicReviews = useMemo(() => {
    return reviews.filter((r) => r.type === 'weekly' || r.type === 'monthly');
  }, [reviews]);

  // Filtered periodic reviews
  const filteredPeriodicReviews = useMemo(() => {
    return periodicReviews
      .filter((r) => {
        if (reviewSubFilter !== 'all' && r.type !== reviewSubFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchTitle = (r.title || '').toLowerCase().includes(q);
        const matchCustom = (r.customTitle || '').toLowerCase().includes(q);
        const matchNum = (r.customNumber || '').toLowerCase().includes(q);
        const matchWins = (r.wins || '').toLowerCase().includes(q);
        const matchLessons = (r.lessons || '').toLowerCase().includes(q);
        return matchTitle || matchCustom || matchNum || matchWins || matchLessons;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [periodicReviews, reviewSubFilter, searchQuery]);

  // Aggregate all archived items
  const archivedItems = useMemo(() => {
    const list: Array<{
      id: string;
      type: ArchiveItemType;
      title: string;
      subtitle?: string;
      category?: string;
      date?: number;
      archivedAt?: number;
      meta?: any;
    }> = [];

    tasks
      .filter((t) => t.archived)
      .forEach((t) => {
        list.push({
          id: t.id!,
          type: 'task',
          title: t.title,
          subtitle: t.description,
          category: t.category || t.projectCategory || 'Task',
          date: t.completedAt || t.createdAt,
          archivedAt: t.archivedAt,
          meta: t,
        });
      });

    projects
      .filter((p) => p.archived)
      .forEach((p) => {
        list.push({
          id: p.id!,
          type: 'project',
          title: p.title,
          subtitle: p.description,
          category: p.category || 'Project',
          date: p.createdAt,
          archivedAt: p.archivedAt,
          meta: p,
        });
      });

    notes
      .filter((n) => n.archived)
      .forEach((n) => {
        list.push({
          id: n.id!,
          type: 'note',
          title: n.title,
          subtitle: n.content.slice(0, 80),
          category: n.category || 'Note',
          date: n.createdAt,
          archivedAt: n.archivedAt,
          meta: n,
        });
      });

    dailyBlocks
      .filter((b) => b.archived)
      .forEach((b) => {
        list.push({
          id: b.id!,
          type: 'dailyBlock',
          title: b.title,
          subtitle: `${b.date} • ${b.startTime} - ${b.endTime}`,
          category: b.blockType || 'Daily Block',
          date: b.createdAt,
          archivedAt: b.archivedAt,
          meta: b,
        });
      });

    habits
      .filter((h) => h.archived)
      .forEach((h) => {
        list.push({
          id: h.id!,
          type: 'habit',
          title: h.title,
          subtitle: h.description,
          category: h.category || 'Habit',
          date: h.createdAt,
          archivedAt: h.archivedAt,
          meta: h,
        });
      });

    goals
      .filter((g) => g.archived)
      .forEach((g) => {
        list.push({
          id: g.id!,
          type: 'goal',
          title: g.title,
          subtitle: g.description,
          category: g.category || 'Goal',
          date: g.createdAt,
          archivedAt: g.archivedAt,
          meta: g,
        });
      });

    checklists
      .filter((c) => c.archived)
      .forEach((c) => {
        list.push({
          id: c.id!,
          type: 'checklist',
          title: c.title,
          subtitle: `${c.items?.length || 0} items`,
          category: c.category || 'Checklist',
          date: c.createdAt,
          archivedAt: c.archivedAt,
          meta: c,
        });
      });

    // Also include periodic reviews in general search
    periodicReviews.forEach((r) => {
      list.push({
        id: r.id!,
        type: 'review',
        title: r.title,
        subtitle: r.customTitle || (r.type === 'weekly' ? `Weekly Review (${r.periodKey})` : `Monthly Synthesis (${r.periodKey})`),
        category: r.type === 'weekly' ? 'Weekly Review' : 'Monthly Review',
        date: r.createdAt,
        archivedAt: r.createdAt,
        meta: r,
      });
    });

    return list.sort((a, b) => (b.archivedAt || b.date || 0) - (a.archivedAt || a.date || 0));
  }, [tasks, projects, notes, dailyBlocks, habits, goals, checklists, periodicReviews]);

  // Filtered by tab and search query
  const filteredItems = useMemo(() => {
    let items = archivedItems;
    if (selectedTab !== 'all') {
      items = items.filter((i) => i.type === selectedTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.subtitle && i.subtitle.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q))
      );
    }
    return items;
  }, [archivedItems, selectedTab, searchQuery]);

  // Counts by item type
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: archivedItems.length,
      task: 0,
      project: 0,
      dailyBlock: 0,
      note: 0,
      habit: 0,
      goal: 0,
      checklist: 0,
      review: periodicReviews.length,
    };
    archivedItems.forEach((item) => {
      c[item.type] = (c[item.type] || 0) + 1;
    });
    return c;
  }, [archivedItems, periodicReviews]);

  const getItemTypeBadge = (type: ArchiveItemType) => {
    switch (type) {
      case 'review':
        return {
          label: isAr ? 'تقرير دوري' : 'Review',
          icon: BookOpen,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
        };
      case 'task':
        return {
          label: isAr ? 'مهمة' : 'Task',
          icon: CheckSquare,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        };
      case 'project':
        return {
          label: isAr ? 'مشروع' : 'Project',
          icon: FolderKanban,
          color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        };
      case 'dailyBlock':
        return {
          label: isAr ? 'فترة يومية' : 'Daily Block',
          icon: Layers,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
        };
      case 'note':
        return {
          label: isAr ? 'ملاحظة' : 'Note',
          icon: StickyNote,
          color: 'text-blue-700 bg-blue-50 border-blue-200',
        };
      case 'habit':
        return {
          label: isAr ? 'عادة' : 'Habit',
          icon: Flame,
          color: 'text-orange-700 bg-orange-50 border-orange-200',
        };
      case 'goal':
        return {
          label: isAr ? 'هدف' : 'Goal',
          icon: Target,
          color: 'text-purple-700 bg-purple-50 border-purple-200',
        };
      case 'checklist':
        return {
          label: isAr ? 'قائمة تدقيق' : 'Checklist',
          icon: ListChecks,
          color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
        };
      default:
        return {
          label: 'Item',
          icon: Archive,
          color: 'text-neutral-700 bg-neutral-50 border-neutral-200',
        };
    }
  };

  const handleUnarchive = async (type: ArchiveItemType, id: string) => {
    setIsProcessing(true);
    try {
      await onUnarchiveItem(type, id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecutePermanentDelete = async () => {
    if (!confirmDelete) return;
    setIsProcessing(true);
    try {
      if (confirmDelete.type === 'review') {
        if (onDeleteReview) await onDeleteReview(confirmDelete.id);
      } else {
        await onPermanentDeleteItem(confirmDelete.type, confirmDelete.id);
      }
      setConfirmDelete(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs: Array<{ id: 'all' | ArchiveItemType; label: string; count: number; icon: any }> = [
    { id: 'all', label: isAr ? 'الكل' : 'All Items', count: counts.all, icon: Archive },
    { id: 'review', label: isAr ? 'التقارير والمراجعات' : 'Periodic Reviews', count: counts.review, icon: BookOpen },
    { id: 'task', label: isAr ? 'المهام' : 'Tasks', count: counts.task, icon: CheckSquare },
    { id: 'project', label: isAr ? 'المشاريع' : 'Projects', count: counts.project, icon: FolderKanban },
    { id: 'dailyBlock', label: isAr ? 'فترات اليوم' : 'Daily Blocks', count: counts.dailyBlock, icon: Layers },
    { id: 'note', label: isAr ? 'الملاحظات' : 'Notes', count: counts.note, icon: StickyNote },
    { id: 'habit', label: isAr ? 'العادات' : 'Habits', count: counts.habit, icon: Flame },
    { id: 'goal', label: isAr ? 'الأهداف' : 'Goals', count: counts.goal, icon: Target },
    { id: 'checklist', label: isAr ? 'قوائم التدقيق' : 'Checklists', count: counts.checklist, icon: ListChecks },
  ];

  return (
    <div className={`space-y-6 max-w-6xl mx-auto pb-16 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
              <Archive size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D3136] dark:text-white tracking-tight">
                  {isAr ? 'مركز الأرشيف والمحفوظات' : 'Executive Archive Hub'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  {archivedItems.length} {isAr ? 'عنصر' : 'items'}
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                {isAr
                  ? 'مستودع آمن وشامل لجميع التقارير الأسبوعية والشهرية، المهام المكتملة، والمشاريع السابقة. يمكنك استرجاع أي عنصر أو تصفح سجل الأسابيع الماضية بدقة متناهية.'
                  : 'A secure repository for periodic reviews, finished tasks, past daily blocks, and projects. Keep your daily workspace fast while retaining full historical intelligence.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="shrink-0 flex items-center gap-2.5 flex-wrap">
            {onOpenReviewModal && (
              <button
                type="button"
                onClick={() => onOpenReviewModal('weekly')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs md:text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus size={16} />
                <span>{isAr ? 'تسجيل تقرير أسبوعي' : 'New Weekly Review'}</span>
              </button>
            )}

            {unarchivedCompletedTasks.length > 0 && onArchiveCompletedTasks && (
              <button
                onClick={onArchiveCompletedTasks}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium text-xs md:text-sm border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
                title={isAr ? 'نقل جميع المهام المنجزة للأرشيف' : 'Move all finished tasks to archive'}
              >
                <Sparkles size={15} className="text-amber-500" />
                <span>
                  {isAr
                    ? `أرشفة ${unarchivedCompletedTasks.length} مهمة مكتملة`
                    : `Archive ${unarchivedCompletedTasks.length} Completed Tasks`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid (5 Matrix Tiles) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          <div
            onClick={() => setSelectedTab('review')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedTab === 'review'
                ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-neutral-100/70 dark:bg-[#1E2025] border-neutral-200/80 dark:border-neutral-800 hover:border-amber-500/40'
            }`}
          >
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center justify-between">
              <span>{isAr ? 'التقارير والمراجعات' : 'Periodic Reviews'}</span>
              <BookOpen size={13} className="text-amber-500" />
            </span>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{counts.review}</div>
          </div>

          <div
            onClick={() => setSelectedTab('task')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedTab === 'task'
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-neutral-100/70 dark:bg-[#1E2025] border-neutral-200/80 dark:border-neutral-800 hover:border-emerald-500/40'
            }`}
          >
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center justify-between">
              <span>{isAr ? 'المهام المؤرشفة' : 'Archived Tasks'}</span>
              <CheckSquare size={13} className="text-emerald-500" />
            </span>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{counts.task}</div>
          </div>

          <div
            onClick={() => setSelectedTab('project')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedTab === 'project'
                ? 'bg-indigo-500/10 border-indigo-500/40'
                : 'bg-neutral-100/70 dark:bg-[#1E2025] border-neutral-200/80 dark:border-neutral-800 hover:border-indigo-500/40'
            }`}
          >
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center justify-between">
              <span>{isAr ? 'المشاريع المحفوظة' : 'Archived Projects'}</span>
              <FolderKanban size={13} className="text-indigo-500" />
            </span>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{counts.project}</div>
          </div>

          <div
            onClick={() => setSelectedTab('dailyBlock')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedTab === 'dailyBlock'
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'bg-neutral-100/70 dark:bg-[#1E2025] border-neutral-200/80 dark:border-neutral-800 hover:border-amber-500/40'
            }`}
          >
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center justify-between">
              <span>{isAr ? 'فترات الأيام السابقة' : 'Past Daily Blocks'}</span>
              <Layers size={13} className="text-amber-500" />
            </span>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{counts.dailyBlock}</div>
          </div>

          <div
            onClick={() => setSelectedTab('note')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              selectedTab === 'note'
                ? 'bg-blue-500/10 border-blue-500/40'
                : 'bg-neutral-100/70 dark:bg-[#1E2025] border-neutral-200/80 dark:border-neutral-800 hover:border-blue-500/40'
            }`}
          >
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center justify-between">
              <span>{isAr ? 'الملاحظات والأفكار' : 'Archived Notes'}</span>
              <StickyNote size={13} className="text-blue-500" />
            </span>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{counts.note}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2D3136] dark:bg-neutral-700 text-white shadow-sm'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-amber-400' : 'text-neutral-400'} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search
            size={16}
            className={`absolute top-1/2 -translate-y-1/2 text-neutral-400 ${
              isAr ? 'right-3' : 'left-3'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث في الأرشيف والتقارير...' : 'Search archive & reviews...'}
            className={`w-full py-2 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {/* =========================================================================
          SPECIAL SECTION: WEEKLY & MONTHLY REVIEWS DOSSIERS
          When tab is 'review', renders executive chronological cards ("sections واحدة فوق واحدة")
          ========================================================================= */}
      {selectedTab === 'review' ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Subfilter Bar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setReviewSubFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  reviewSubFilter === 'all'
                    ? 'bg-amber-500 text-white shadow-3xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'كافة التقارير' : 'All Reviews'} ({periodicReviews.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewSubFilter('weekly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  reviewSubFilter === 'weekly'
                    ? 'bg-amber-500 text-white shadow-3xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'التقارير الأسبوعية' : 'Weekly Reviews'} ({periodicReviews.filter(r => r.type === 'weekly').length})
              </button>
              <button
                type="button"
                onClick={() => setReviewSubFilter('monthly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  reviewSubFilter === 'monthly'
                    ? 'bg-emerald-500 text-white shadow-3xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {isAr ? 'المراجعات الشهرية' : 'Monthly Synthesis'} ({periodicReviews.filter(r => r.type === 'monthly').length})
              </button>
            </div>

            {onOpenReviewModal && (
              <button
                type="button"
                onClick={() => onOpenReviewModal('weekly')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>{isAr ? 'إنشاء تقرير جديد' : 'New Review'}</span>
              </button>
            )}
          </div>

          {filteredPeriodicReviews.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <BookOpen size={32} />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-neutral-800 dark:text-white">
                  {isAr ? 'لا توجد تقارير أسبوعية أو شهرية محفوظة بعد' : 'No periodic reviews archived yet'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {isAr
                    ? 'يمكنك إجراء مراجعة لنهاية الأسبوع أو نهاية الشهر لتوثيق إنجازاتك، ساعات التركيز، وأدائك البدني مع علامات السيطرة اليومية.'
                    : 'Conduct a weekly or monthly review to synthesize your execution metrics, focus hours, and state mastery.'}
                </p>
              </div>
              {onOpenReviewModal && (
                <button
                  onClick={() => onOpenReviewModal('weekly')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>{isAr ? 'بدء أول تقرير أسبوعي الآن' : 'Start First Weekly Review'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredPeriodicReviews.map((r) => {
                const isExpanded = expandedReviewId === r.id;
                const isWeekly = r.type === 'weekly';

                return (
                  <div
                    key={r.id || r.createdAt}
                    className={`rounded-3xl border transition-all overflow-hidden ${
                      isExpanded
                        ? 'bg-neutral-50/90 dark:bg-[#1B1D25] border-amber-500/40 shadow-lg ring-1 ring-amber-500/20'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    {/* Dossier Header Row */}
                    <div
                      onClick={() => setExpandedReviewId(isExpanded ? null : r.id!)}
                      className="p-4 sm:p-5 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs shadow-3xs ${
                              isWeekly
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isWeekly ? <Calendar size={18} /> : <TrendingUp size={18} />}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                                {r.title}
                              </h3>
                              {r.customNumber && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono font-bold border border-neutral-200 dark:border-neutral-700">
                                  {r.customNumber}
                                </span>
                              )}
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                ⭐ {r.rating || 8}/10
                              </span>
                            </div>

                            <div className="mt-1 flex items-center gap-2.5 text-[11px] text-neutral-400 font-mono">
                              <span>{r.periodKey}</span>
                              {r.startDate && r.endDate && (
                                <>
                                  <span>•</span>
                                  <span>{r.startDate} ➔ {r.endDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Snapshot KPI Grid */}
                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                          {r.stateAuditSummary?.avgDayScore !== undefined && r.stateAuditSummary.avgDayScore > 0 && (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                              🏆 {r.stateAuditSummary.avgDayScore}/100
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                            ⚡ {r.habitScore || 100}%
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/20">
                            🎯 {r.completedTasksCount || 0}
                          </span>
                          {r.completedWorkoutsCount !== undefined && r.completedWorkoutsCount > 0 && (
                            <span className="px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20 flex items-center gap-1">
                              <Dumbbell size={12} />
                              <span>{r.completedWorkoutsCount}</span>
                            </span>
                          )}

                          {onDeleteReview && r.id && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete({
                                  type: 'review',
                                  id: r.id!,
                                  title: r.title,
                                });
                              }}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                              title={isAr ? 'حذف التقرير' : 'Delete'}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          <div className="text-neutral-400 p-1">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Deep Dossier View */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 pt-0 border-t border-neutral-200/80 dark:border-neutral-800 space-y-4 text-xs animate-fadeIn">
                        {/* State Audit 5-Dimensions */}
                        {r.stateAuditSummary && (
                          <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 space-y-2.5">
                            <span className="text-[11px] font-mono uppercase text-neutral-400 font-bold block">
                              {isAr ? 'مؤشرات الطاقة والتحكم الذهني خلال هذه الفترة:' : 'Recorded State Ratings:'}
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                              <div>
                                <span className="text-neutral-400 block text-[10px]">⚡ الطاقة والنشاط:</span>
                                <span className="font-bold text-amber-500 font-mono">{r.stateAuditSummary.avgEnergy || '—'}/10</span>
                              </div>
                              <div>
                                <span className="text-neutral-400 block text-[10px]">🛡️ التحكم بالتوتر:</span>
                                <span className="font-bold text-emerald-500 font-mono">{r.stateAuditSummary.avgStress || '—'}/10</span>
                              </div>
                              <div>
                                <span className="text-neutral-400 block text-[10px]">🎯 الصفاء الذهني:</span>
                                <span className="font-bold text-sky-500 font-mono">{r.stateAuditSummary.avgClarity || '—'}/10</span>
                              </div>
                              <div>
                                <span className="text-neutral-400 block text-[10px]">⚔️ الانضباط:</span>
                                <span className="font-bold text-indigo-500 font-mono">{r.stateAuditSummary.avgDiscipline || '—'}/10</span>
                              </div>
                              <div>
                                <span className="text-neutral-400 block text-[10px]">🌟 الرضا والامتنان:</span>
                                <span className="font-bold text-purple-500 font-mono">{r.stateAuditSummary.avgFulfillment || '—'}/10</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Wins */}
                        {r.wins && (
                          <div className="space-y-1">
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                              <Sparkles size={14} />
                              <span>{isAr ? 'أهم الانتصارات والإنجازات المحققة:' : 'Key Wins:'}</span>
                            </span>
                            <p className="p-3.5 rounded-2xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed whitespace-pre-wrap">
                              {r.wins}
                            </p>
                          </div>
                        )}

                        {/* Obstacles */}
                        {r.challenges && (
                          <div className="space-y-1">
                            <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 text-xs">
                              <ShieldAlert size={14} />
                              <span>{isAr ? 'العقبات ونقاط الاحتكاك:' : 'Obstacles & Friction:'}</span>
                            </span>
                            <p className="p-3.5 rounded-2xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed whitespace-pre-wrap">
                              {r.challenges}
                            </p>
                          </div>
                        )}

                        {/* Lessons & Next Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {r.lessons && (
                            <div className="space-y-1">
                              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 text-xs">
                                <BookOpen size={14} />
                                <span>{isAr ? 'الدروس المكتسبة:' : 'Lessons Learned:'}</span>
                              </span>
                              <p className="p-3.5 rounded-2xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed whitespace-pre-wrap">
                                {r.lessons}
                              </p>
                            </div>
                          )}

                          {r.nextFocus && (
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                                <TrendingUp size={14} />
                                <span>{isAr ? 'التركيز والشعار القادم:' : 'Next Priority:'}</span>
                              </span>
                              <p className="p-3.5 rounded-2xl bg-white dark:bg-[#14161C] border border-neutral-200/60 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs leading-relaxed whitespace-pre-wrap">
                                {r.nextFocus}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Excuses Log if recorded */}
                        {r.excusesSummary && r.excusesSummary.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                              {isAr ? 'الأعذار المسجلة خلال هذه الفترة:' : 'Recorded Excuses:'}
                            </span>
                            <div className="space-y-1 text-[11px]">
                              {r.excusesSummary.map((exc, idx) => (
                                <div key={idx} className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                                  <span>{exc.date} • {exc.habitTitle}</span>
                                  <span className="italic font-medium text-amber-700 dark:text-amber-400">"{exc.excuse}"</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= GENERAL ARCHIVE ITEMS GRID ================= */
        filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
              <Archive size={32} />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-neutral-800 dark:text-white">
                {searchQuery.trim()
                  ? (isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching archived items found')
                  : (isAr ? 'الأرشيف فارغ حالياً' : 'Your Archive is Clean and Empty')}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                {isAr
                  ? 'عند إكمال مهمة أو إنهاء مشروع، يمكنك أرشفته لإبقائه محفوظاً دون أن يزاحم مساحة عملك اليومية النشطة.'
                  : 'Whenever you complete tasks, finish projects, or wrap up timeblocks, archive them to keep your primary dashboard clutter-free.'}
              </p>
            </div>
            {onNavigateModule && (
              <button
                onClick={() => onNavigateModule('tasks')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <span>{isAr ? 'الانتقال إلى المهام' : 'Go to Tasks'}</span>
                <ArrowRight size={14} className={isAr ? 'rotate-180' : ''} />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredItems.map((item) => {
              const badge = getItemTypeBadge(item.type);
              const BadgeIcon = badge.icon;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${badge.color}`}
                      >
                        <BadgeIcon size={12} />
                        <span>{badge.label}</span>
                      </span>

                      {item.category && (
                        <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
                          <Tag size={11} />
                          <span className="truncate max-w-[120px]">{item.category}</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-neutral-800 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h4>
                      {item.subtitle && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Calendar size={12} />
                      <span>
                        {item.archivedAt
                          ? new Date(item.archivedAt).toLocaleDateString(isAr ? 'ar-MA' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : item.date
                          ? new Date(item.date).toLocaleDateString(isAr ? 'ar-MA' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : isAr
                          ? 'مؤرشف'
                          : 'Archived'}
                      </span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Restore Button (if not review) */}
                      {item.type !== 'review' ? (
                        <button
                          onClick={() => handleUnarchive(item.type, item.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title={isAr ? 'استرجاع إلى القائمة النشطة' : 'Restore to active view'}
                        >
                          <RotateCcw size={12} />
                          <span>{isAr ? 'استرجاع' : 'Restore'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenReviewModal?.('archive')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-all cursor-pointer"
                          title={isAr ? 'فتح التقرير' : 'View Review'}
                        >
                          <ExternalLink size={12} />
                          <span>{isAr ? 'عرض' : 'View'}</span>
                        </button>
                      )}

                      {/* Permanent Delete Button */}
                      <button
                        onClick={() =>
                          setConfirmDelete({
                            type: item.type,
                            id: item.id,
                            title: item.title,
                          })
                        }
                        disabled={isProcessing}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={isAr ? 'حذف نهائي' : 'Delete permanently'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Confirmation Modal for Permanent Delete */}
      {confirmDelete && (
        <ConfirmModal
          isOpen={true}
          title={isAr ? 'تأكيد الحذف النهائي من الأرشيف' : 'Confirm Permanent Deletion'}
          message={
            isAr
              ? `هل أنت متأكد من حذف "${confirmDelete.title}" نهائياً من قاعدة البيانات السحابية؟ لا يمكن التراجع عن هذا الإجراء.`
              : `Are you sure you want to permanently delete "${confirmDelete.title}"? This item cannot be recovered.`
          }
          confirmLabel={isAr ? 'حذف نهائياً' : 'Delete Permanently'}
          cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
          isDanger={true}
          onConfirm={handleExecutePermanentDelete}
          onClose={() => setConfirmDelete(null)}
          onCancel={() => setConfirmDelete(null)}
          lang={lang}
        />
      )}
    </div>
  );
};
