import React, { useState, useEffect } from 'react';
import {
  ListChecks,
  Plus,
  Trash2,
  Pin,
  PinOff,
  CheckCircle2,
  Circle,
  FolderKanban,
  CheckSquare,
  Search,
  Sparkles,
  ArrowLeft,
  Check,
  Calendar,
  AlertCircle,
  Layers,
  ChevronDown,
  RotateCcw,
  ListPlus,
  SendHorizontal
} from 'lucide-react';
import { ChecklistGroup, ChecklistItemEntry, ProjectItem, TaskItem, Priority } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface ChecklistsManagerProps {
  checklists: ChecklistGroup[];
  projects: ProjectItem[];
  tasks: TaskItem[];
  onAddChecklist: (checklist: Omit<ChecklistGroup, 'id'>) => Promise<any>;
  onUpdateChecklist: (id: string, updates: Partial<ChecklistGroup>) => Promise<any>;
  onDeleteChecklist: (id: string) => Promise<any>;
  onAddTask?: (task: Omit<TaskItem, 'id'>) => Promise<any>;
  lang?: 'en' | 'ar';
}

const CHECKLIST_TEMPLATES = [
  {
    name: 'Project Launch QA',
    nameAr: 'تأكيد جودة إطلاق المشروع',
    category: 'Project',
    color: 'indigo',
    description: 'Pre-flight sanity checklist before public release.',
    descriptionAr: 'قائمة مراجعة سلامة الجودة قبل النشر والإطلاق العام للمشروع.',
    items: [
      { text: 'Verify cross-browser and mobile viewport scaling', textAr: 'التحقق من التوافقية مع المتصفحات المختلفة ومقاسات الهواتف المحمولة', priority: 'High' as Priority },
      { text: 'Validate database security rules and index configuration', textAr: 'التحقق من قواعد حماية وأمن قواعد البيانات وضبط الفهارس والاتصال', priority: 'High' as Priority },
      { text: 'Test offline sync and cache fallback', textAr: 'اختبار المزامنة في وضع عدم الاتصال بالإنترنت والتخزين المؤقت الاحتياطي', priority: 'Med' as Priority },
      { text: 'Check SSL certificate & custom domain routing', textAr: 'التحقق من شهادة الأمان SSL وتوجيه النطاق المخصص', priority: 'High' as Priority },
      { text: 'Prepare release announcement note', textAr: 'تجهيز وإعداد ملاحظة إعلان النشر والإصدار', priority: 'Low' as Priority },
    ],
  },
  {
    name: 'Daily Startup & Shutdown',
    nameAr: 'بدء وإغلاق اليوم العملي اليومي',
    category: 'Task Routine',
    color: 'emerald',
    description: 'Structure morning priorities and evening reflection.',
    descriptionAr: 'تنظيم وتنسيق أولويات الصباح والتفكير والتقييم المسائي.',
    items: [
      { text: 'Review high-priority tasks and calendar schedule', textAr: 'مراجعة المهام ذات الأولوية المرتفعة وجدول التقويم اليومي', priority: 'High' as Priority },
      { text: 'Clear communications and Slack to zero', textAr: 'تصفية وتنظيف كافة الاتصالات والرسائل الواردة', priority: 'Med' as Priority },
      { text: 'Execute uninterrupted 90-minute deep work block', textAr: 'تنفيذ جلسة عمل عميق متواصلة لمدة ٩٠ دقيقة دون أي تشتيت', priority: 'High' as Priority },
      { text: 'Log daily habit streak and progress', textAr: 'تسجيل الالتزام بالعادات اليومية ومستوى التقدم الحاصل', priority: 'Med' as Priority },
      { text: 'Brain-dump unfinished thoughts for tomorrow', textAr: 'تفريغ العقل والأفكار غير المكتملة لتجهيزها ليوم الغد', priority: 'Low' as Priority },
    ],
  },
  {
    name: 'Weekly Review & Reset',
    nameAr: 'المراجعة الأسبوعية وإعادة الضبط',
    category: 'Work',
    color: 'blue',
    description: 'Clear backlogs, align weekly goals, and optimize habits.',
    descriptionAr: 'تصفية المهام المتراكمة، ومحاذاة الأهداف الأسبوعية وتحسين العادات.',
    items: [
      { text: 'Review completed tasks and celebrate weekly wins', textAr: 'مراجعة المهام المكتملة والاحتفال بالإنجازات الأسبوعية', priority: 'Low' as Priority },
      { text: 'Triage incoming notes and clean up desktop workspace', textAr: 'فرز الملاحظات الواردة وتنظيف مساحة العمل والمكتب', priority: 'Med' as Priority },
      { text: 'Update active project milestones and deadlines', textAr: 'تحديث معالم ومراحل المشاريع النشطة والمواعيد النهائية', priority: 'High' as Priority },
      { text: 'Plan top 3 critical outcomes for the upcoming week', textAr: 'التخطيط وتحديد أهم ٣ نتائج حاسمة للأسبوع القادم', priority: 'High' as Priority },
    ],
  },
  {
    name: 'Travel & Tech Gear',
    nameAr: 'تجهيزات السفر والأجهزة التقنية',
    category: 'Travel',
    color: 'amber',
    description: 'Essential checklist for remote work & trips.',
    descriptionAr: 'قائمة التحقق الأساسية للعمل عن بعد والرحلات والأسفار.',
    items: [
      { text: 'Laptop + USB-C fast charger + cable', textAr: 'الحاسب المحمول + شاحن سريع USB-C + كابل الشحن', priority: 'High' as Priority },
      { text: 'Noise-canceling headphones & backup earphones', textAr: 'سماعات رأس عازلة للضوضاء وسماعات احتياطية', priority: 'Med' as Priority },
      { text: 'Universal power plug adapter', textAr: 'محول كهربائي عالمي للمقابس والمنافذ المختلفة', priority: 'High' as Priority },
      { text: 'Passport / National ID / Backup credit card', textAr: 'جواز السفر / بطاقة الهوية الوطنية / بطاقة ائتمانية احتياطية', priority: 'High' as Priority },
    ],
  },
];

export const ChecklistsManager: React.FC<ChecklistsManagerProps> = ({
  checklists,
  projects,
  tasks,
  onAddChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
  onAddTask,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(
    checklists[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  // Active Checklist
  const activeChecklist = checklists.find((c) => c.id === selectedChecklistId) || checklists[0];

  // Editor states
  const [title, setTitle] = useState(activeChecklist?.title || '');
  const [description, setDescription] = useState(activeChecklist?.description || '');
  const [category, setCategory] = useState(activeChecklist?.category || 'General');
  const [color, setColor] = useState(activeChecklist?.color || 'indigo');
  const [linkedProjectId, setLinkedProjectId] = useState(activeChecklist?.linkedProjectId || '');
  const [linkedTaskId, setLinkedTaskId] = useState(activeChecklist?.linkedTaskId || '');
  const [items, setItems] = useState<ChecklistItemEntry[]>(activeChecklist?.items || []);
  const [newItemText, setNewItemText] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<Priority>('Med');
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);

  // Deletion modal state
  const [checklistToDelete, setChecklistToDelete] = useState<ChecklistGroup | null>(null);

  const getPriorityLabel = (p: Priority) => {
    if (!isAr) return p;
    switch (p) {
      case 'High': return 'مرتفع';
      case 'Med': return 'متوسط';
      case 'Low': return 'منخفض';
      default: return p;
    }
  };

  const getCategoryLabel = (cat: string) => {
    if (!isAr) return cat;
    if (cat === 'all' || cat === 'All') return 'الكل';
    switch (cat) {
      case 'General': return 'عام';
      case 'Work': return 'العمل';
      case 'Project': return 'المشاريع';
      case 'Task Routine': return 'روتين المهام';
      case 'Personal': return 'شخصي';
      case 'Travel': return 'السفر والتنقل';
      case 'Shopping': return 'التسوق والشراء';
      default: return cat;
    }
  };

  // Sync state when active checklist changes
  useEffect(() => {
    if (activeChecklist) {
      setTitle(activeChecklist.title || '');
      setDescription(activeChecklist.description || '');
      setCategory(activeChecklist.category || 'General');
      setColor(activeChecklist.color || 'indigo');
      setLinkedProjectId(activeChecklist.linkedProjectId || '');
      setLinkedTaskId(activeChecklist.linkedTaskId || '');
      setItems(activeChecklist.items || []);
    }
  }, [activeChecklist?.id]);

  // Real-time auto-saving helper
  const handleAutoSave = async (
    newTitle: string,
    newDesc: string,
    newCat: string,
    newCol: string,
    newProjId: string,
    newTaskId: string,
    newItems: ChecklistItemEntry[]
  ) => {
    if (!activeChecklist?.id) return;

    await onUpdateChecklist(activeChecklist.id, {
      title: newTitle || 'Untitled Checklist',
      description: newDesc,
      category: newCat,
      color: newCol,
      linkedProjectId: newProjId || undefined,
      linkedTaskId: newTaskId || undefined,
      items: newItems,
      updatedAt: Date.now(),
    });

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleCreateNew = async (template?: typeof CHECKLIST_TEMPLATES[0]) => {
    const templateItems: ChecklistItemEntry[] = template
      ? template.items.map((i, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          text: isAr ? (i.textAr || i.text) : i.text,
          completed: false,
          priority: i.priority,
        }))
      : [
          { id: `item-${Date.now()}-1`, text: isAr ? 'العنصر الأول في قائمة التحقق' : 'First checklist item', completed: false, priority: 'Med' },
          { id: `item-${Date.now()}-2`, text: isAr ? 'العنصر الثاني في قائمة التحقق' : 'Second checklist item', completed: false, priority: 'Low' },
        ];

    const newDoc = await onAddChecklist({
      title: template 
        ? (isAr ? (template.nameAr || template.name) : template.name) 
        : (isAr ? 'قائمة مراجعة سريعة جديدة' : 'New Quick Checklist'),
      description: template 
        ? (isAr ? (template.descriptionAr || template.description) : template.description) 
        : (isAr ? 'اكتب مهامك وقم بالإشارة لإنجازها...' : 'Write your tasks and check them off...'),
      category: template ? template.category : 'General',
      color: template ? template.color : 'indigo',
      pinned: false,
      items: templateItems,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (newDoc && newDoc.id) {
      setSelectedChecklistId(newDoc.id);
      setMobileView('editor');
    }
    setShowTemplatesDropdown(false);
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim() || !activeChecklist?.id) return;

    const newItem: ChecklistItemEntry = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newItemText.trim(),
      completed: false,
      priority: newItemPriority,
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    setNewItemText('');
    handleAutoSave(title, description, category, color, linkedProjectId, linkedTaskId, nextItems);
  };

  const handleToggleItem = (itemId: string) => {
    if (!activeChecklist?.id) return;
    const nextItems = items.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    setItems(nextItems);
    handleAutoSave(title, description, category, color, linkedProjectId, linkedTaskId, nextItems);
  };

  const handleUpdateItemText = (itemId: string, newText: string) => {
    const nextItems = items.map((it) =>
      it.id === itemId ? { ...it, text: newText } : it
    );
    setItems(nextItems);
    handleAutoSave(title, description, category, color, linkedProjectId, linkedTaskId, nextItems);
  };

  const handleUpdateItemPriority = (itemId: string, prio: Priority) => {
    const nextItems = items.map((it) =>
      it.id === itemId ? { ...it, priority: prio } : it
    );
    setItems(nextItems);
    handleAutoSave(title, description, category, color, linkedProjectId, linkedTaskId, nextItems);
  };

  const handleDeleteItem = (itemId: string) => {
    const nextItems = items.filter((it) => it.id !== itemId);
    setItems(nextItems);
    handleAutoSave(title, description, category, color, linkedProjectId, linkedTaskId, nextItems);
  };

  const handleToggleCheckAll = (checkAll: boolean) => {
    const nextItems = items.map((it) => ({ ...it, completed: checkAll }));
    setItems(nextItems);
    handleAutoSave(title, description, category, color, linkedProjectId, linkedTaskId, nextItems);
  };

  const handleClearCompleted = () => {
    const nextItems = items.filter((it) => !it.completed);
    setItems(nextItems);
    handleAutoSave(title, description, category, color, linkedProjectId, linkedTaskId, nextItems);
  };

  const handleConvertUncheckedToTasks = async () => {
    if (!onAddTask) return;
    const pendingItems = items.filter((it) => !it.completed);
    for (const p of pendingItems) {
      await onAddTask({
        title: `${title}: ${p.text}`,
        completed: false,
        priority: p.priority || 'Med',
        category: category || 'Work',
        createdAt: Date.now(),
      });
    }
  };

  const filteredChecklists = checklists
    .filter((c) => {
      if (filterType === 'pinned' && !c.pinned) return false;
      if (filterType === 'project' && !c.linkedProjectId) return false;
      if (filterType === 'task' && !c.linkedTaskId) return false;
      if (filterType === 'standalone' && (c.linkedProjectId || c.linkedTaskId)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(query);
        const matchDesc = (c.description || '').toLowerCase().includes(query);
        const matchItem = (c.items || []).some((i) => i.text.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchItem) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });

  // Calculate active checklist progress
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`space-y-4 max-w-6xl mx-auto animate-fadeIn ${isAr ? 'text-right' : ''}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAE9E6]">
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#787774] font-semibold mb-0.5">
            <ListChecks size={14} className="text-[#2F3437]" />
            <span>{isAr ? 'قوائم التحقق وإجراءات التشغيل اليومية' : 'Checklists & Operating Routines'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2F3437]">
            {isAr ? 'قوائم المراجعة والتحقق' : 'Checklists & Action Lists'}
          </h2>
          <p className="text-xs text-[#787774] mt-0.5">
            {isAr ? 'قم بإنشاء قوائم مراجعة مستقلة أو ربطها مباشرة بمشاريعك ومهامك اليومية.' : 'Create standalone checklists or connect them directly to your Projects and Tasks.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Templates button */}
          <div className="relative">
            <button
              onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-[#2F3437] border border-[#EAE9E6] rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>{isAr ? 'القوالب جاهزة' : 'Templates'}</span>
              <ChevronDown size={12} className="text-[#787774]" />
            </button>

            {showTemplatesDropdown && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-[#EAE9E6] py-1 z-30 animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-[#787774] tracking-wider border-b border-neutral-100">
                  {isAr ? 'قوائم مراجعة للمبتدئين' : 'Starter Checklists'}
                </div>
                {CHECKLIST_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    onClick={() => handleCreateNew(tpl)}
                    className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex flex-col transition-colors"
                  >
                    <span className="text-xs font-semibold text-[#2F3437]">{isAr ? tpl.nameAr : tpl.name}</span>
                    <span className="text-[10px] text-[#787774] line-clamp-1">{isAr ? tpl.descriptionAr : tpl.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleCreateNew()}
            className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus size={14} />
            <span>{isAr ? 'قائمة مراجعة جديدة' : 'New Checklist'}</span>
          </button>
        </div>
      </div>

      {/* Two Column Workspace Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Column: List of Checklists */}
        <div className={`space-y-2.5 md:col-span-4 ${mobileView === 'editor' ? 'hidden md:block' : 'block'}`}>
          {/* Search & Filter bar */}
          <div className="bg-white p-2.5 rounded-xl border border-[#EAE9E6] shadow-xs space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774]" />
              <input
                type="text"
                placeholder={isAr ? 'البحث في القوائم أو العناصر...' : 'Search checklists or items...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 rounded-lg border border-[#EAE9E6] text-xs text-[#2F3437] focus:outline-none focus:border-[#2F3437]"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px] py-0.5">
              {[
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'project', label: isAr ? 'المشاريع' : 'Projects' },
                { id: 'task', label: isAr ? 'المهام' : 'Tasks' },
                { id: 'standalone', label: isAr ? 'مستقلة' : 'Standalone' },
                { id: 'pinned', label: isAr ? 'المثبتة' : 'Pinned' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-all ${
                    filterType === f.id
                      ? 'bg-[#2F3437] text-white'
                      : 'text-[#787774] hover:bg-neutral-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist Cards List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredChecklists.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#787774] bg-white rounded-xl border border-[#EAE9E6] p-4">
                {isAr ? 'لم يتم العثور على قوائم تحقق. انقر على "+ قائمة مراجعة جديدة" للبدء.' : 'No checklists found. Click "+ New Checklist" to get started.'}
              </div>
            ) : (
              filteredChecklists.map((chk) => {
                const isSelected = activeChecklist?.id === chk.id;
                const completed = (chk.items || []).filter((i) => i.completed).length;
                const total = (chk.items || []).length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                const linkedProject = projects.find((p) => p.id === chk.linkedProjectId);
                const linkedTask = tasks.find((t) => t.id === chk.linkedTaskId);

                return (
                  <div
                    key={chk.id}
                    onClick={() => {
                      setSelectedChecklistId(chk.id || null);
                      setMobileView('editor');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative group ${
                      isSelected
                        ? 'bg-white border-[#2F3437] shadow-xs ring-1 ring-[#2F3437]/10'
                        : 'bg-white border-[#EAE9E6] hover:border-[#D3D1CB] hover:bg-[#FBFBFA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {chk.pinned && (
                          <Pin size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                        )}
                        <h4 className="font-bold text-xs text-[#2F3437] truncate">
                          {chk.title || (isAr ? 'قائمة تحقق غير معنونة' : 'Untitled Checklist')}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono text-[#787774]">
                          {completed}/{total}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChecklistToDelete(chk);
                          }}
                          className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={isAr ? 'حذف القائمة' : 'Delete checklist'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {chk.description && (
                      <p className="text-[11px] text-[#787774] line-clamp-1 mt-0.5">
                        {chk.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          pct === 100 ? 'bg-emerald-500' : 'bg-[#2F3437]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#EAE9E6]/60 text-[10px] text-[#787774]">
                      <div className="flex items-center gap-1 truncate">
                        {linkedProject ? (
                          <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium truncate">
                            <FolderKanban size={10} />
                            <span className="truncate max-w-[100px]">{linkedProject.title}</span>
                          </span>
                        ) : linkedTask ? (
                          <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-medium truncate">
                            <CheckSquare size={10} />
                            <span className="truncate max-w-[100px]">{linkedTask.title}</span>
                          </span>
                        ) : (
                          <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-medium">
                            {getCategoryLabel(chk.category)}
                          </span>
                        )}
                      </div>

                      <span className="shrink-0">{isAr ? `${pct}% منجز` : `${pct}% done`}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Checklist Editor */}
        <div className={`md:col-span-8 ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
          {activeChecklist ? (
            <div className="bg-white rounded-xl border border-[#EAE9E6] shadow-xs p-3.5 sm:p-5 space-y-3.5">
              {/* Top Navigation & Actions Bar */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#EAE9E6] gap-2">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden flex items-center gap-1 text-xs font-semibold text-[#2F3437] hover:underline"
                >
                  <ArrowLeft size={13} />
                  <span>{isAr ? 'كافة قوائم التحقق' : 'All Checklists'}</span>
                </button>

                <div className="flex items-center gap-1.5 ml-auto text-xs">
                  {isSavedRecently && (
                    <span className="text-[11px] font-mono text-emerald-600 flex items-center gap-1 mr-1">
                      <Check size={11} /> {isAr ? 'تم الحفظ' : 'Saved'}
                    </span>
                  )}

                  <button
                    onClick={() => {
                      const nextPinned = !activeChecklist.pinned;
                      onUpdateChecklist(activeChecklist.id!, { pinned: nextPinned });
                    }}
                    className={`p-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                      activeChecklist.pinned
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'text-[#787774] border-[#EAE9E6] hover:bg-neutral-100'
                    }`}
                    title={activeChecklist.pinned ? (isAr ? 'إلغاء التثبيت' : 'Unpin') : (isAr ? 'تثبيت في الأعلى' : 'Pin to top')}
                  >
                    {activeChecklist.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                    <span className="hidden sm:inline">{activeChecklist.pinned ? (isAr ? 'مثبتة' : 'Pinned') : (isAr ? 'تثبيت' : 'Pin')}</span>
                  </button>

                  <button
                    onClick={() => setChecklistToDelete(activeChecklist)}
                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span className="hidden sm:inline">{isAr ? 'حذف' : 'Delete'}</span>
                  </button>
                </div>
              </div>

              {/* Title & Description Edit */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    handleAutoSave(e.target.value, description, category, color, linkedProjectId, linkedTaskId, items);
                  }}
                  placeholder={isAr ? 'عنوان قائمة المراجعة...' : 'Checklist Title...'}
                  className="w-full text-lg sm:text-xl font-bold text-[#2F3437] focus:outline-none placeholder:text-neutral-300"
                />

                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    handleAutoSave(title, e.target.value, category, color, linkedProjectId, linkedTaskId, items);
                  }}
                  placeholder={isAr ? 'أضف ملاحظات أو توجيهات أو سياق قائمة التحقق...' : 'Add notes, instructions, or scope context...'}
                  className="w-full text-xs text-[#787774] focus:outline-none placeholder:text-neutral-300"
                />
              </div>

              {/* Metadata row: Link to Project, Link to Task, Category */}
              <div className="bg-[#FBFBFA] p-2.5 rounded-lg border border-[#EAE9E6] grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Link to Project */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#787774] flex items-center gap-1">
                    <FolderKanban size={11} className="text-indigo-600" />
                    {isAr ? 'المشروع المرتبط' : 'Connected Project'}
                  </label>
                  <select
                    value={linkedProjectId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setLinkedProjectId(next);
                      handleAutoSave(title, description, category, color, next, linkedTaskId, items);
                    }}
                    className="w-full px-2 py-1 rounded-md border border-[#EAE9E6] bg-white text-xs text-[#2F3437] focus:outline-none"
                  >
                    <option value="">{isAr ? 'بلا (مستقلة)' : 'None (Standalone)'}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Link to Task */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#787774] flex items-center gap-1">
                    <CheckSquare size={11} className="text-amber-600" />
                    {isAr ? 'المهمة المرتبطة' : 'Connected Task'}
                  </label>
                  <select
                    value={linkedTaskId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setLinkedTaskId(next);
                      handleAutoSave(title, description, category, color, linkedProjectId, next, items);
                    }}
                    className="w-full px-2 py-1 rounded-md border border-[#EAE9E6] bg-white text-xs text-[#2F3437] focus:outline-none"
                  >
                    <option value="">{isAr ? 'بلا (مستقلة)' : 'None (Standalone)'}</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#787774] flex items-center gap-1">
                    <Layers size={11} />
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCategory(next);
                      handleAutoSave(title, description, next, color, linkedProjectId, linkedTaskId, items);
                    }}
                    className="w-full px-2 py-1 rounded-md border border-[#EAE9E6] bg-white text-xs text-[#2F3437] focus:outline-none"
                  >
                    <option value="General">{isAr ? 'عام' : 'General'}</option>
                    <option value="Work">{isAr ? 'العمل' : 'Work'}</option>
                    <option value="Project">{isAr ? 'المشاريع' : 'Project'}</option>
                    <option value="Task Routine">{isAr ? 'روتين المهام' : 'Task Routine'}</option>
                    <option value="Personal">{isAr ? 'شخصي' : 'Personal'}</option>
                    <option value="Travel">{isAr ? 'السفر والتنقل' : 'Travel'}</option>
                    <option value="Shopping">{isAr ? 'التسوق والشراء' : 'Shopping'}</option>
                  </select>
                </div>
              </div>

              {/* Progress Summary & Batch Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#2F3437]">
                    {isAr 
                      ? `التقدم: مكتمل ${completedCount} من ${totalCount} (${progressPercent}%)`
                      : `Progress: ${completedCount} / ${totalCount} completed (${progressPercent}%)`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => handleToggleCheckAll(completedCount !== totalCount)}
                    className="px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-[#2F3437] text-[11px] font-semibold transition-colors"
                  >
                    {completedCount === totalCount 
                      ? (isAr ? 'إلغاء تحديد الكل' : 'Uncheck All') 
                      : (isAr ? 'تحديد الكل' : 'Check All')}
                  </button>

                  {completedCount > 0 && (
                    <button
                      onClick={handleClearCompleted}
                      className="px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-rose-700 text-[11px] font-semibold transition-colors"
                    >
                      {isAr ? 'مسح المنجز' : 'Clear Done'}
                    </button>
                  )}

                  {onAddTask && totalCount - completedCount > 0 && (
                    <button
                      onClick={handleConvertUncheckedToTasks}
                      className="px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-indigo-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
                      title={isAr ? 'إرسال العناصر المتبقية إلى متتبع المهام' : 'Send remaining checklist items to Task Tracker'}
                    >
                      <ListPlus size={12} />
                      <span className="hidden sm:inline">{isAr ? 'مزامنة مع المهام' : 'Sync to Tasks'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Input Box for Adding Items Fast */}
              <form onSubmit={handleAddItem} className="flex items-center gap-1.5 bg-[#FBFBFA] p-1.5 rounded-lg border border-[#EAE9E6]">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder={isAr ? 'اكتب عنصراً واضغط Enter...' : 'Type an item and hit Enter...'}
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs text-[#2F3437] focus:outline-none"
                />

                <select
                  value={newItemPriority}
                  onChange={(e) => setNewItemPriority(e.target.value as Priority)}
                  className="px-2 py-1 bg-white rounded border border-[#EAE9E6] text-[10px] font-bold text-[#2F3437] focus:outline-none"
                >
                  <option value="High">{isAr ? 'مرتفع' : 'High'}</option>
                  <option value="Med">{isAr ? 'متوسط' : 'Med'}</option>
                  <option value="Low">{isAr ? 'منخفض' : 'Low'}</option>
                </select>

                <button
                  type="submit"
                  disabled={!newItemText.trim()}
                  className="px-2.5 py-1 bg-[#2F3437] hover:bg-black disabled:opacity-40 text-white rounded text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>{isAr ? 'إضافة' : 'Add'}</span>
                </button>
              </form>

              {/* Checklist Items List */}
              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#787774] border border-dashed border-[#EAE9E6] rounded-xl">
                    {isAr 
                      ? 'لا توجد عناصر في قائمة التحقق هذه بعد. اكتب أعلاه لإضافة أول عنصر لك!'
                      : 'No items in this checklist yet. Type above to add your first item!'}
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                       key={item.id}
                       className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                         item.completed
                           ? 'bg-neutral-50/70 border-neutral-100 text-[#787774]'
                           : 'bg-white border-[#EAE9E6] hover:border-[#D3D1CB]'
                       }`}
                     >
                       <button
                         type="button"
                         onClick={() => handleToggleItem(item.id)}
                         className="shrink-0 text-[#2F3437] focus:outline-none"
                       >
                         {item.completed ? (
                           <CheckCircle2 size={16} className="text-emerald-600 fill-emerald-50" />
                         ) : (
                           <Circle size={16} className="text-neutral-300 hover:text-neutral-500" />
                         )}
                       </button>
 
                       <input
                         type="text"
                         value={item.text}
                         onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                         className={`flex-1 bg-transparent text-xs focus:outline-none ${
                           item.completed ? 'line-through text-[#787774]' : 'text-[#2F3437] font-medium'
                         }`}
                       />
 
                       <div className="flex items-center gap-1.5 shrink-0">
                         <select
                           value={item.priority || 'Med'}
                           onChange={(e) => handleUpdateItemPriority(item.id, e.target.value as Priority)}
                           className={`text-[9px] font-bold px-1.5 py-0.5 rounded border focus:outline-none ${
                             item.priority === 'High'
                               ? 'bg-rose-50 text-rose-700 border-rose-200'
                               : item.priority === 'Med'
                               ? 'bg-amber-50 text-amber-700 border-amber-200'
                               : 'bg-blue-50 text-blue-700 border-blue-200'
                           }`}
                         >
                           <option value="High">{isAr ? 'مرتفع' : 'High'}</option>
                           <option value="Med">{isAr ? 'متوسط' : 'Med'}</option>
                           <option value="Low">{isAr ? 'منخفض' : 'Low'}</option>
                         </select>
 
                         <button
                           type="button"
                           onClick={() => handleDeleteItem(item.id)}
                           className="p-1 rounded text-neutral-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                           title={isAr ? 'إزالة العنصر' : 'Remove item'}
                         >
                           <Trash2 size={12} />
                         </button>
                       </div>
                     </div>
                   ))
                 )}
               </div>
             </div>
           ) : (
             <div className="bg-white rounded-xl border border-[#EAE9E6] shadow-xs p-10 text-center text-[#787774]">
               <ListChecks size={36} className="mx-auto text-neutral-300 mb-2" />
               <h3 className="font-bold text-xs text-[#2F3437]">{isAr ? 'لم يتم تحديد قائمة تحقق' : 'No Checklist Selected'}</h3>
               <p className="text-[11px] mt-0.5">{isAr ? 'اختر قائمة تحقق من الجانب الأيمن أو أنشئ واحدة جديدة.' : 'Select a checklist on the left or create a new one.'}</p>
               <button
                 onClick={() => handleCreateNew()}
                 className="mt-3 text-xs font-bold bg-[#2F3437] text-white px-3.5 py-1.5 rounded-lg hover:bg-black"
               >
                 {isAr ? '+ إنشاء قائمة تحقق جديدة' : '+ Create Checklist'}
               </button>
             </div>
           )}
         </div>
       </div>
 
       {/* Delete Confirmation Modal */}
       <ConfirmModal
         isOpen={Boolean(checklistToDelete)}
         title={isAr ? 'حذف قائمة التحقق' : 'Delete Checklist'}
         message={
           isAr 
             ? `هل أنت متأكد من رغبتك في حذف القائمة "${checklistToDelete?.title || 'قائمة تحقق غير معنونة'}"؟ سيتم حذف جميع عناصر قائمة التحقق المرتبطة بها.`
             : `Are you sure you want to delete "${checklistToDelete?.title || 'Untitled Checklist'}"? All checklist items will be removed.`
         }
         confirmLabel={isAr ? 'حذف قائمة التحقق' : 'Delete Checklist'}
         cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
         onConfirm={() => {
           if (checklistToDelete?.id) {
             onDeleteChecklist(checklistToDelete.id);
             if (selectedChecklistId === checklistToDelete.id) {
               setSelectedChecklistId(null);
               setMobileView('list');
             }
           }
           setChecklistToDelete(null);
         }}
         onCancel={() => setChecklistToDelete(null)}
       />
     </div>
   );
 };
