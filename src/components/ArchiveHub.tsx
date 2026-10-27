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
  Filter
} from 'lucide-react';
import {
  TaskItem,
  HabitItem,
  ProjectItem,
  NoteItem,
  ChecklistGroup,
  DailyBlockItem,
  GoalItem,
  ModuleType
} from '../types';
import { ConfirmModal } from './ConfirmModal';

export type ArchiveItemType = 'task' | 'habit' | 'project' | 'note' | 'checklist' | 'dailyBlock' | 'goal';

interface ArchiveHubProps {
  tasks: TaskItem[];
  habits: HabitItem[];
  projects: ProjectItem[];
  notes: NoteItem[];
  checklists: ChecklistGroup[];
  dailyBlocks: DailyBlockItem[];
  goals: GoalItem[];
  onUnarchiveItem: (type: ArchiveItemType, id: string) => Promise<void>;
  onPermanentDeleteItem: (type: ArchiveItemType, id: string) => Promise<void>;
  onArchiveCompletedTasks?: () => Promise<void>;
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
  onUnarchiveItem,
  onPermanentDeleteItem,
  onArchiveCompletedTasks,
  lang = 'en',
  onNavigateModule,
}) => {
  const isAr = lang === 'ar';
  const [selectedTab, setSelectedTab] = useState<'all' | ArchiveItemType>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
          subtitle: g.vision,
          category: g.category || 'Goal',
          date: g.createdAt,
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
          subtitle: c.description,
          category: c.category || 'Checklist',
          date: c.createdAt,
          archivedAt: c.archivedAt,
          meta: c,
        });
      });

    return list.sort((a, b) => (b.archivedAt || b.date || 0) - (a.archivedAt || a.date || 0));
  }, [tasks, projects, notes, dailyBlocks, habits, goals, checklists]);

  // Filtered by tab and search
  const filteredItems = useMemo(() => {
    return archivedItems.filter((item) => {
      const matchTab = selectedTab === 'all' || item.type === selectedTab;
      if (!matchTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    });
  }, [archivedItems, selectedTab, searchQuery]);

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
    };
    archivedItems.forEach((item) => {
      c[item.type] = (c[item.type] || 0) + 1;
    });
    return c;
  }, [archivedItems]);

  const getItemTypeBadge = (type: ArchiveItemType) => {
    switch (type) {
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
      await onPermanentDeleteItem(confirmDelete.type, confirmDelete.id);
      setConfirmDelete(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs: Array<{ id: 'all' | ArchiveItemType; label: string; count: number; icon: any }> = [
    { id: 'all', label: isAr ? 'الكل' : 'All Items', count: counts.all, icon: Archive },
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
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
              <Archive size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D3136] tracking-tight">
                  {isAr ? 'مركز الأرشيف والمحفوظات' : 'Executive Archive Hub'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                  {archivedItems.length} {isAr ? 'عنصر' : 'items'}
                </span>
              </div>
              <p className="text-sm text-neutral-500 max-w-2xl leading-relaxed">
                {isAr
                  ? 'مستودع آمن لإخفاء المهام والمشاريع المكتملة دون حذفها. يتيح لك الحفاظ على لوحة عمل يومية خفيفة وسريعة، مع إمكانية استرجاع أي عنصر في ثانية واحدة.'
                  : 'A secure repository to clear finished tasks and projects from your active views without permanently losing them. Keep your workspace lean, fast, and recover any item anytime.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          {unarchivedCompletedTasks.length > 0 && onArchiveCompletedTasks && (
            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={onArchiveCompletedTasks}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs md:text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title={isAr ? 'نقل جميع المهام المنجزة للأرشيف' : 'Move all finished tasks to archive'}
              >
                <Sparkles size={16} />
                <span>
                  {isAr
                    ? `أرشفة ${unarchivedCompletedTasks.length} مهمة مكتملة`
                    : `Archive ${unarchivedCompletedTasks.length} Completed Tasks`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-100">
          <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium">{isAr ? 'المهام المؤرشفة' : 'Archived Tasks'}</span>
            <div className="text-xl font-bold text-neutral-800 mt-1">{counts.task}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium">{isAr ? 'المشاريع المحفوظة' : 'Archived Projects'}</span>
            <div className="text-xl font-bold text-neutral-800 mt-1">{counts.project}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium">{isAr ? 'فترات الأيام السابقة' : 'Past Daily Blocks'}</span>
            <div className="text-xl font-bold text-neutral-800 mt-1">{counts.dailyBlock}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium">{isAr ? 'الملاحظات والأفكار' : 'Archived Notes'}</span>
            <div className="text-xl font-bold text-neutral-800 mt-1">{counts.note}</div>
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
                    ? 'bg-[#2D3136] text-white shadow-sm'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-amber-400' : 'text-neutral-400'} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
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
            placeholder={isAr ? 'بحث في الأرشيف...' : 'Search archive...'}
            className={`w-full py-2 bg-white border border-neutral-200/90 rounded-xl text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-neutral-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Archive size={32} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-neutral-800">
              {searchQuery.trim()
                ? (isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching archived items found')
                : (isAr ? 'الأرشيف فارغ حالياً' : 'Your Archive is Clean and Empty')}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500">
              {isAr
                ? 'عند إكمال مهمة أو إنهاء مشروع، يمكنك أرشفته لإبقائه محفوظاً دون أن يزاحم مساحة عملك اليومية النشطة.'
                : 'Whenever you complete tasks, finish projects, or wrap up timeblocks, archive them to keep your primary dashboard clutter-free.'}
            </p>
          </div>
          {onNavigateModule && (
            <button
              onClick={() => onNavigateModule('tasks')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-all cursor-pointer"
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
                className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
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
                    <h4 className="text-sm font-bold text-neutral-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
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
                    {/* Restore Button */}
                    <button
                      onClick={() => handleUnarchive(item.type, item.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title={isAr ? 'استرجاع إلى القائمة النشطة' : 'Restore to active view'}
                    >
                      <RotateCcw size={12} />
                      <span>{isAr ? 'استرجاع' : 'Restore'}</span>
                    </button>

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
