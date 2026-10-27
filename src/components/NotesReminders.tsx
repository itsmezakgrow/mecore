import React, { useState, useEffect, useRef } from 'react';
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Pin, 
  PinOff, 
  Clock, 
  Tag, 
  Search, 
  Sparkles, 
  FileText, 
  Save, 
  Check, 
  ArrowLeft,
  Bell,
  Calendar,
  CheckSquare,
  ListTodo,
  Copy,
  ExternalLink,
  BookOpen,
  Inbox,
  Eye,
  Edit3,
  Filter,
  CheckCircle2,
  Circle,
  MoreVertical,
  Layers,
  LayoutGrid,
  List,
  Columns,
  Maximize2,
  Minimize2,
  Share2,
  Flame,
  ArrowUpRight,
  Download,
  Archive
} from 'lucide-react';
import { NoteItem, TaskItem, ChecklistGroup } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface NotesRemindersProps {
  notes: NoteItem[];
  onAddNote: (note: Omit<NoteItem, 'id'>) => Promise<any>;
  onUpdateNote: (id: string, updates: Partial<NoteItem>) => Promise<any>;
  onDeleteNote: (id: string) => Promise<any>;
  onConvertToTask?: (task: Omit<TaskItem, 'id'>) => Promise<any>;
  onConvertToChecklist?: (checklist: Omit<ChecklistGroup, 'id'>) => Promise<any>;
  lang?: 'en' | 'ar';
}

type TabFilter = 'all' | 'inbox' | 'read-later' | 'reminders' | 'pinned' | 'reviewed';
type ViewMode = 'grid' | 'list' | 'split';

const COLOR_THEMES: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  default: { bg: 'bg-white', border: 'border-[#EAE9E6]', badge: 'bg-neutral-100 text-neutral-700', text: 'text-[#2F3437]' },
  amber: { bg: 'bg-amber-50/70', border: 'border-amber-200/80', badge: 'bg-amber-100 text-amber-900', text: 'text-amber-950' },
  emerald: { bg: 'bg-emerald-50/70', border: 'border-emerald-200/80', badge: 'bg-emerald-100 text-emerald-900', text: 'text-emerald-950' },
  blue: { bg: 'bg-blue-50/70', border: 'border-blue-200/80', badge: 'bg-blue-100 text-blue-900', text: 'text-blue-950' },
  purple: { bg: 'bg-purple-50/70', border: 'border-purple-200/80', badge: 'bg-purple-100 text-purple-900', text: 'text-purple-950' },
  rose: { bg: 'bg-rose-50/70', border: 'border-rose-200/80', badge: 'bg-rose-100 text-rose-900', text: 'text-rose-950' },
};

export const NotesReminders: React.FC<NotesRemindersProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onConvertToTask,
  onConvertToChecklist,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';

  const getCategoryLabel = (cat: string) => {
    if (!isAr) return cat;
    switch (cat) {
      case 'Brain Dump': return 'تفريغ أفكار';
      case 'Read Later': return 'القراءة لاحقاً';
      case 'Idea': return 'فكرة ملهمة';
      case 'Quick Note': return 'ملاحظة سريعة';
      case 'Reminder': return 'تذكير مهم';
      case 'Meeting': return 'اجتماع عمل';
      case 'Business': return 'الأعمال والشركات';
      case 'Life': return 'شخصي وحياتي';
      case 'All': return 'الجميع';
      default: return cat;
    }
  };

  const getPresetLabel = (preset: string) => {
    if (!isAr) return preset;
    switch (preset) {
      case 'none': return '🔔 لا يوجد تذكير';
      case 'tonight': return '🌆 الليلة (6:00 مساءً)';
      case 'tomorrow': return '🌅 غداً (9:00 صباحاً)';
      case 'weekend': return '📅 نهاية الأسبوع';
      case 'monday': return '🗓️ الاثنين القادم';
      default: return preset;
    }
  };

  const getColorLabel = (col: string) => {
    if (!isAr) return col;
    switch (col) {
      case 'default': return 'أبيض (افتراضي)';
      case 'amber': return 'كهرماني دافئ';
      case 'emerald': return 'زمردي هادئ';
      case 'blue': return 'أزرق بارد';
      case 'purple': return 'أرجواني ناعم';
      case 'rose': return 'وردي لطيف';
      default: return col;
    }
  };

  // Navigation & View mode
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Quick Brain Dump Capture State
  const [quickText, setQuickText] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<NoteItem['category']>('Brain Dump');
  const [quickReminderPreset, setQuickReminderPreset] = useState<string>('none');
  const [quickColor, setQuickColor] = useState<string>('default');
  const [isQuickExpanded, setIsQuickExpanded] = useState(false);
  const quickInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus Modal / Reader State
  const [activeModalNote, setActiveModalNote] = useState<NoteItem | null>(null);
  const [modalMode, setModalMode] = useState<'read' | 'edit'>('read');
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalCategory, setModalCategory] = useState<NoteItem['category']>('Brain Dump');
  const [modalTags, setModalTags] = useState('');
  const [modalReminderDate, setModalReminderDate] = useState('');
  const [modalReminderTime, setModalReminderTime] = useState('');
  const [modalColor, setModalColor] = useState('default');
  const [isModalSavedRecently, setIsModalSavedRecently] = useState(false);

  // Split-view selected note
  const [splitSelectedId, setSplitSelectedId] = useState<string | null>(notes[0]?.id || null);

  // Confirm delete
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);

  // Sync modal when activeModalNote changes
  useEffect(() => {
    if (activeModalNote) {
      setModalTitle(activeModalNote.title || '');
      setModalContent(activeModalNote.content || '');
      setModalCategory(activeModalNote.category || 'Brain Dump');
      setModalTags(activeModalNote.tags?.join(', ') || '');
      setModalReminderDate(activeModalNote.reminderDate || '');
      setModalReminderTime(activeModalNote.reminderTime || '');
      setModalColor(activeModalNote.color || 'default');
    }
  }, [activeModalNote?.id]);

  // Quick Preset Helper for Reminders
  const getPresetDate = (preset: string) => {
    const d = new Date();
    if (preset === 'tonight') {
      return { date: d.toISOString().split('T')[0], time: '18:00' };
    }
    if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      return { date: d.toISOString().split('T')[0], time: '09:00' };
    }
    if (preset === 'weekend') {
      const day = d.getDay();
      const dist = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + dist);
      return { date: d.toISOString().split('T')[0], time: '10:00' };
    }
    if (preset === 'monday') {
      const day = d.getDay();
      const dist = (1 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + dist);
      return { date: d.toISOString().split('T')[0], time: '09:00' };
    }
    return { date: undefined, time: undefined };
  };

  // Instant Brain Dump Submit (0 friction!)
  const handleQuickDumpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = quickText.trim();
    if (!trimmed && !quickTitle.trim()) return;

    let autoTitle = quickTitle.trim();
    let autoContent = trimmed;

    // If no title, derive smart title from the first sentence / line
    if (!autoTitle) {
      const lines = trimmed.split('\n');
      const firstLine = lines[0].replace(/^[-*#\s[\]x]+/, '').trim();
      autoTitle = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine || 'Quick Brain Dump';
    }

    const { date, time } = getPresetDate(quickReminderPreset);

    const isReadLater = quickCategory === 'Read Later' || activeTab === 'read-later';
    const finalCategory = isReadLater ? 'Read Later' : quickCategory;

    await onAddNote({
      title: autoTitle,
      content: autoContent,
      tags: [finalCategory],
      pinned: quickReminderPreset !== 'none' || finalCategory === 'Idea',
      category: finalCategory,
      isRead: false, // Unread by default for the review pipeline!
      color: quickColor,
      reminderDate: date,
      reminderTime: time,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Reset quick capture form
    setQuickText('');
    setQuickTitle('');
    setQuickReminderPreset('none');
    setQuickColor('default');
    setIsQuickExpanded(false);
  };

  // Keyboard shortcut for quick dump: Cmd/Ctrl+Enter
  const handleQuickKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleQuickDumpSubmit();
    } else if (e.key === 'Enter' && !e.shiftKey && !isQuickExpanded) {
      // Single-line instant dump
      e.preventDefault();
      handleQuickDumpSubmit();
    }
  };

  // Toggle Read / Inbox status
  const handleToggleRead = async (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!note.id) return;
    const nextRead = !note.isRead;
    await onUpdateNote(note.id, { isRead: nextRead });
    if (activeModalNote?.id === note.id) {
      setActiveModalNote({ ...activeModalNote, isRead: nextRead });
    }
  };

  // Toggle Pin
  const handleTogglePin = async (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!note.id) return;
    await onUpdateNote(note.id, { pinned: !note.pinned });
    if (activeModalNote?.id === note.id) {
      setActiveModalNote({ ...activeModalNote, pinned: !note.pinned });
    }
  };

  // Copy Note Text
  const handleCopyNote = (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const fullText = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(fullText);
    setCopiedNoteId(note.id || 'copied');
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Convert Note to Task
  const handleConvertToTask = async (note: NoteItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onConvertToTask) return;
    await onConvertToTask({
      title: note.title,
      completed: false,
      priority: note.pinned ? 'High' : 'Med',
      dueDate: note.reminderDate,
      category: note.category === 'Business' ? 'Work' : 'Personal',
      createdAt: Date.now(),
    });
    // Mark as read/reviewed
    if (note.id) {
      await onUpdateNote(note.id, { isRead: true });
    }
  };

  // Checkbox toggle inside markdown content (e.g. - [ ] vs - [x])
  const handleToggleInlineChecklist = async (note: NoteItem, itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!note.id || !note.content) return;

    let count = 0;
    const lines = note.content.split('\n');
    const updatedLines = lines.map((line) => {
      const match = line.match(/^(\s*[-*]\s*\[)([ xX])(\]\s*.*)$/);
      if (match) {
        if (count === itemIndex) {
          const currentChecked = match[2].toLowerCase() === 'x';
          const newBox = currentChecked ? ' ' : 'x';
          count++;
          return `${match[1]}${newBox}${match[3]}`;
        }
        count++;
      }
      return line;
    });

    const newContent = updatedLines.join('\n');
    await onUpdateNote(note.id, { content: newContent });
    if (activeModalNote?.id === note.id) {
      setModalContent(newContent);
    }
  };

  // Save changes from Modal Editor
  const handleModalAutoSave = async (
    title: string,
    content: string,
    category: NoteItem['category'],
    tagsStr: string,
    color: string,
    remDate?: string,
    remTime?: string
  ) => {
    if (!activeModalNote?.id) return;

    const tagsArray = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onUpdateNote(activeModalNote.id, {
      title: title || 'Untitled Note',
      content,
      category,
      tags: tagsArray,
      color,
      reminderDate: remDate || undefined,
      reminderTime: remTime || undefined,
      updatedAt: Date.now(),
    });

    setIsModalSavedRecently(true);
    setTimeout(() => setIsModalSavedRecently(false), 2000);
  };

  // Calculate stats for pipeline tabs
  const unreadNotesCount = notes.filter((n) => !n.isRead).length;
  const readLaterCount = notes.filter((n) => n.category === 'Read Later' || n.tags?.includes('Read Later')).length;
  const remindersCount = notes.filter((n) => Boolean(n.reminderDate)).length;
  const pinnedCount = notes.filter((n) => n.pinned).length;

  // Filter notes based on active tab and search
  const filteredNotes = notes
    .filter((n) => {
      if (activeTab === 'inbox') {
        if (n.isRead) return false;
      } else if (activeTab === 'read-later') {
        if (n.category !== 'Read Later' && !n.tags?.includes('Read Later')) return false;
      } else if (activeTab === 'reminders') {
        if (!n.reminderDate && n.category !== 'Reminder') return false;
      } else if (activeTab === 'pinned') {
        if (!n.pinned) return false;
      } else if (activeTab === 'reviewed') {
        if (!n.isRead) return false;
      }

      if (selectedCategory !== 'All' && n.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(query);
        const matchContent = (n.content || '').toLowerCase().includes(query);
        const matchTags = (n.tags || []).some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchContent && !matchTags) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });

  const categories: Array<NoteItem['category']> = [
    'Brain Dump',
    'Read Later',
    'Idea',
    'Quick Note',
    'Reminder',
    'Meeting',
    'Business',
    'Life',
  ];

  // Estimated reading time helper
  const getReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(words / 180);
    return { words, minutes: minutes || 1 };
  };

  return (
    <div className={`space-y-4 max-w-6xl mx-auto animate-fadeIn ${isAr ? 'text-right' : ''}`}>
      {/* Top Header: Title & Pipeline Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#EAE9E6]">
        <div>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#787774] font-semibold mb-0.5">
            <StickyNote size={14} className="text-[#2F3437]" />
            <span>{isAr ? 'العقل الثاني والالتقاط السريع' : 'Second Brain & Quick Capture'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2F3437]">
            {isAr ? 'تفريغ الأفكار والقراءة لاحقاً' : 'Brain Dump & Read Later'}
          </h2>
          <p className="text-xs text-[#787774] mt-0.5">
            {isAr 
              ? 'أفرغ أفكارك فوراً لتحرير عقلك، ثم اقرأها أو راجعها أو اتخذ إجراءً بشأنها عندما تكون مستعداً.' 
              : 'Dump ideas immediately to free your mind, then read, review, or action them whenever you\'re ready.'}
          </p>
        </div>

        {/* View Mode & Stats Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white rounded-xl border border-[#EAE9E6] p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'grid' ? 'bg-[#2F3437] text-white shadow-2xs' : 'text-[#787774] hover:text-[#2F3437]'
              }`}
              title={isAr ? 'عرض البطاقات المتراصة' : 'Masonry Cards View (Easy Reading)'}
            >
              <LayoutGrid size={14} />
              <span className="hidden md:inline">{isAr ? 'بطاقات' : 'Cards'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'list' ? 'bg-[#2F3437] text-white shadow-2xs' : 'text-[#787774] hover:text-[#2F3437]'
              }`}
              title={isAr ? 'عرض القائمة المضغوطة' : 'Compact List View'}
            >
              <List size={14} />
              <span className="hidden md:inline">{isAr ? 'قائمة' : 'List'}</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'split' ? 'bg-[#2F3437] text-white shadow-2xs' : 'text-[#787774] hover:text-[#2F3437]'
              }`}
              title={isAr ? 'عرض المحرر المنقسم' : 'Split Editor View'}
            >
              <Columns size={14} />
              <span className="hidden md:inline">{isAr ? 'منقسم' : 'Split'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* INSTANT BRAIN DUMP & QUICK CAPTURE BOX (Zero friction capture area) */}
      <div className="bg-white rounded-2xl border-2 border-[#2F3437]/15 shadow-sm p-3.5 transition-all hover:border-[#2F3437]/30 focus-within:border-[#2F3437] focus-within:shadow-md">
        <form onSubmit={handleQuickDumpSubmit} className="space-y-2.5">
          {isQuickExpanded && (
            <input
              type="text"
              placeholder={isAr ? 'العنوان (اختياري - يتم إنشاؤه تلقائياً من النص)' : 'Title (optional — auto-generated from your text)'}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              dir="auto"
              className="w-full text-sm font-bold text-[#2F3437] focus:outline-none placeholder:text-neutral-300 pb-1 border-b border-[#EAE9E6] text-start"
            />
          )}

          <div className="relative">
            <textarea
              ref={quickInputRef}
              rows={isQuickExpanded ? 3 : 1}
              value={quickText}
              onFocus={() => setIsQuickExpanded(true)}
              onChange={(e) => setQuickText(e.target.value)}
              onKeyDown={handleQuickKeyDown}
              placeholder={isAr ? 'أفرغ فكرة، رابطاً، ملاحظة اجتماع، أو خاطرة سريعة... (اضغط Enter أو ⌘+Enter للحفظ)' : 'Dump a thought, link, meeting note, or brain dump... (Press Enter or ⌘+Enter to save)'}
              dir="auto"
              className="w-full text-xs sm:text-sm text-[#2F3437] leading-relaxed resize-none focus:outline-none bg-transparent placeholder:text-[#787774] text-start"
            />
          </div>

          {/* Quick Capture Toolbar: Category, Preset Reminders, Color, and Submit */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#EAE9E6]/60">
            {/* Left Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {/* Category Quick Selector */}
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value as NoteItem['category'])}
                className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-[11px] font-semibold text-[#2F3437] border-0 focus:outline-none cursor-pointer"
              >
                <option value="Brain Dump">⚡ {isAr ? 'تفريغ أفكار' : 'Brain Dump'}</option>
                <option value="Read Later">📖 {isAr ? 'القراءة لاحقاً' : 'Read Later'}</option>
                <option value="Idea">💡 {isAr ? 'فكرة ملهمة' : 'Idea'}</option>
                <option value="Quick Note">📝 {isAr ? 'ملاحظة سريعة' : 'Quick Note'}</option>
                <option value="Reminder">⏰ {isAr ? 'تذكير مهم' : 'Reminder'}</option>
                <option value="Meeting">🤝 {isAr ? 'اجتماع عمل' : 'Meeting'}</option>
                <option value="Business">💼 {isAr ? 'الأعمال والشركات' : 'Business'}</option>
                <option value="Life">🌱 {isAr ? 'شخصي وحياتي' : 'Life'}</option>
              </select>

              {/* Fast Reminder Presets */}
              <select
                value={quickReminderPreset}
                onChange={(e) => setQuickReminderPreset(e.target.value)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold border-0 focus:outline-none cursor-pointer ${
                  quickReminderPreset !== 'none'
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-[#787774]'
                }`}
              >
                <option value="none">🔔 {isAr ? 'بلا تذكير' : 'No Reminder'}</option>
                <option value="tonight">🌆 {isAr ? 'الليلة (6:00 مساءً)' : 'Tonight (6:00 PM)'}</option>
                <option value="tomorrow">🌅 {isAr ? 'غداً (9:00 صباحاً)' : 'Tomorrow (9:00 AM)'}</option>
                <option value="weekend">📅 {isAr ? 'نهاية الأسبوع الحالية' : 'This Weekend'}</option>
                <option value="monday">🗓️ {isAr ? 'الاثنين القادم' : 'Next Monday'}</option>
              </select>

              {/* Color Tint Selector */}
              <div className="hidden sm:flex items-center gap-1 ml-1">
                {(['default', 'amber', 'emerald', 'blue', 'purple', 'rose'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setQuickColor(c)}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      c === 'default' ? 'bg-white border-neutral-300' :
                      c === 'amber' ? 'bg-amber-300 border-amber-400' :
                      c === 'emerald' ? 'bg-emerald-300 border-emerald-400' :
                      c === 'blue' ? 'bg-blue-300 border-blue-400' :
                      c === 'purple' ? 'bg-purple-300 border-purple-400' :
                      'bg-rose-300 border-rose-400'
                    } ${quickColor === c ? 'ring-2 ring-[#2F3437] scale-110' : 'opacity-70 hover:opacity-100'}`}
                    title={isAr ? `تلوين ${getColorLabel(c)}` : `Tint ${c}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Action Button */}
            <div className="flex items-center gap-2">
              {isQuickExpanded && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickText('');
                    setQuickTitle('');
                    setIsQuickExpanded(false);
                  }}
                  className="px-2.5 py-1 text-xs text-[#787774] hover:text-[#2F3437]"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              )}
              <button
                type="submit"
                disabled={!quickText.trim() && !quickTitle.trim()}
                className="flex items-center gap-1.5 bg-[#2F3437] hover:bg-black disabled:opacity-40 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all"
              >
                <Sparkles size={13} className="text-amber-300" />
                <span>{isAr ? 'حفظ في العقل' : 'Save to Brain'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* PIPELINE TABS & SEARCH (Inbox / Read Later / Reminders / All) */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Main Flow Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#2F3437] text-white shadow-2xs'
                  : 'bg-white text-[#787774] hover:bg-neutral-100 border border-[#EAE9E6]'
              }`}
            >
              <Layers size={13} />
              <span>{isAr ? 'كل الملاحظات' : 'All Notes'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'all' ? 'bg-neutral-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                {notes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'inbox'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-[#787774] hover:bg-neutral-100 border border-[#EAE9E6]'
              }`}
            >
              <Inbox size={13} />
              <span>{isAr ? 'للقراءة / الوارد' : 'To Read / Inbox'}</span>
              {unreadNotesCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === 'inbox' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                  {unreadNotesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('read-later')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'read-later'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-[#787774] hover:bg-neutral-100 border border-[#EAE9E6]'
              }`}
            >
              <BookOpen size={13} />
              <span>{isAr ? 'القراءة لاحقاً' : 'Read Later'}</span>
              {readLaterCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'read-later' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {readLaterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'reminders'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white text-[#787774] hover:bg-neutral-100 border border-[#EAE9E6]'
              }`}
            >
              <Bell size={13} />
              <span>{isAr ? 'التذكيرات' : 'Reminders'}</span>
              {remindersCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'reminders' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'}`}>
                  {remindersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pinned')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === 'pinned'
                  ? 'bg-[#2F3437] text-white shadow-2xs'
                  : 'bg-white text-[#787774] hover:bg-neutral-100 border border-[#EAE9E6]'
              }`}
            >
              <Pin size={13} />
              <span>{isAr ? 'المثبتة' : 'Pinned'}</span>
              {pinnedCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'pinned' ? 'bg-neutral-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  {pinnedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviewed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === 'reviewed'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-[#787774] hover:bg-neutral-100 border border-[#EAE9E6]'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>{isAr ? 'تمت مراجعتها / الأرشيف' : 'Reviewed / Archive'}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774]" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث في الخواطر، التصنيفات...' : 'Search thoughts, tags...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 rounded-xl border border-[#EAE9E6] bg-white text-xs text-[#2F3437] focus:outline-none focus:border-[#2F3437] shadow-2xs"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-neutral-200 text-[#2F3437]'
                : 'text-[#787774] hover:bg-neutral-100'
            }`}
          >
            {isAr ? 'جميع التصنيفات' : 'All Categories'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-neutral-800 text-white'
                  : 'text-[#787774] hover:bg-neutral-100 bg-white border border-[#EAE9E6]'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW MODE 1: MASONRY CARDS GRID (Default - Apple Notes / Keep Easy-Reading Style) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
          {filteredNotes.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-[#EAE9E6] p-6 space-y-2">
              <FileText size={36} className="mx-auto text-neutral-300" />
              <h3 className="font-bold text-sm text-[#2F3437]">{isAr ? 'لا توجد ملاحظات في هذا القسم' : 'No notes in this view'}</h3>
              <p className="text-xs text-[#787774]">
                {isAr 
                  ? 'اكتب في صندوق تفريغ الأفكار السريع أعلاه لالتقاط خواطرك وقراءتها في أي وقت.' 
                  : 'Type in the quick brain dump box above to capture thoughts and read them anytime.'}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const theme = COLOR_THEMES[note.color || 'default'] || COLOR_THEMES.default;
              const { words, minutes } = getReadingTime(note.content || '');

              // Parse inline checklists in content
              const lines = (note.content || '').split('\n');
              let checkCount = 0;

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveModalNote(note);
                    setModalMode('read');
                  }}
                  className={`${theme.bg} rounded-2xl border ${theme.border} p-4 shadow-2xs hover:shadow-md hover:border-[#2F3437]/40 transition-all cursor-pointer flex flex-col justify-between group relative`}
                >
                  {/* Top Note Bar: Status, Pin, Copy, Actions */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {note.pinned && (
                          <Pin size={13} className="text-amber-600 fill-amber-500 shrink-0" />
                        )}
                        <h3 className="font-bold text-sm text-[#2F3437] leading-snug line-clamp-2">
                          {note.title || (isAr ? 'خاطرة غير معنونة' : 'Untitled Thought')}
                        </h3>
                      </div>

                      {/* Quick Card Top Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* Mark Read/Inbox button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleRead(note, e)}
                          className={`p-1 rounded-md transition-colors ${
                            note.isRead
                              ? 'text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200'
                              : 'text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title={note.isRead 
                            ? (isAr ? 'تحديد كغير مقروء (الوارد)' : 'Mark as Unread (Inbox)') 
                            : (isAr ? 'تحديد كمقروء / تمت المراجعة' : 'Mark as Read / Reviewed')}
                        >
                          {note.isRead ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        </button>

                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyNote(note, e)}
                          className="p-1 rounded-md text-neutral-400 hover:text-[#2F3437] hover:bg-neutral-100 transition-colors"
                          title={isAr ? 'نسخ المحتوى' : 'Copy content'}
                        >
                          {copiedNoteId === note.id ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>

                        {/* Pin toggle */}
                        <button
                          type="button"
                          onClick={(e) => handleTogglePin(note, e)}
                          className={`p-1 rounded-md transition-colors ${
                            note.pinned
                              ? 'text-amber-600 hover:bg-amber-100'
                              : 'text-neutral-400 hover:text-[#2F3437] hover:bg-neutral-100'
                          }`}
                          title={note.pinned ? (isAr ? 'إلغاء التثبيت' : 'Unpin') : (isAr ? 'تثبيت الملاحظة' : 'Pin note')}
                        >
                          {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                        </button>

                        {/* Archive */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (note.id) {
                              onUpdateNote(note.id, { archived: true, archivedAt: Date.now() });
                            }
                          }}
                          className="p-1 rounded-md text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title={isAr ? 'أرشفة الملاحظة' : 'Archive note'}
                        >
                          <Archive size={13} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteToDelete(note);
                          }}
                          className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={isAr ? 'حذف الملاحظة' : 'Delete note'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Note Content / Checklist rendering */}
                    <div className="text-xs text-[#5A5955] leading-relaxed space-y-1 max-h-48 overflow-hidden font-sans">
                      {lines.map((line, idx) => {
                        const checkMatch = line.match(/^(\s*[-*]\s*\[)([ xX])(\]\s*)(.*)$/);
                        if (checkMatch) {
                          const itemIndex = checkCount++;
                          const isDone = checkMatch[2].toLowerCase() === 'x';
                          return (
                            <div
                              key={idx}
                              onClick={(e) => handleToggleInlineChecklist(note, itemIndex, e)}
                              dir="auto"
                              className="flex items-start gap-1.5 py-0.5 hover:text-black cursor-pointer group/item text-start"
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${
                                  isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-neutral-400 group-hover/item:border-[#2F3437]'
                                }`}
                              >
                                {isDone && <Check size={10} />}
                              </div>
                              <span className={`line-clamp-1 ${isDone ? 'line-through text-neutral-400' : 'text-[#2F3437]'}`}>
                                {checkMatch[4]}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <p key={idx} dir="auto" className="line-clamp-2 text-start">
                            {line}
                          </p>
                        );
                      })}
                    </div>

                    {/* Reminder Badge if active */}
                    {note.reminderDate && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-lg w-fit">
                        <Bell size={11} className="text-amber-700" />
                        <span>
                          {note.reminderDate} {note.reminderTime || ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Meta & Quick Action */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#EAE9E6]/70 text-[10px] text-[#787774]">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${theme.badge}`}>
                        {getCategoryLabel(note.category)}
                      </span>
                      <span>{isAr ? `قراءة ${minutes} د` : `${minutes} min read`}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Convert to Task shortcut */}
                      {onConvertToTask && (
                        <button
                          type="button"
                          onClick={(e) => handleConvertToTask(note, e)}
                          className="hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors font-medium"
                          title={isAr ? 'تحويل لمهمة في متتبع المهام' : 'Convert to Task in Task Tracker'}
                        >
                          <CheckSquare size={11} />
                          <span>{isAr ? 'مهمة' : 'Task'}</span>
                        </button>
                      )}
                      <span>
                        {new Date(note.updatedAt || note.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: COMPACT LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-[#EAE9E6] shadow-xs divide-y divide-[#EAE9E6] overflow-hidden">
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#787774]">
              {isAr ? 'لم يتم العثور على ملاحظات تطابق التصفية.' : 'No notes found in this filter.'}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setActiveModalNote(note);
                  setModalMode('read');
                }}
                className="p-3 hover:bg-[#FBFBFA] flex items-center justify-between gap-3 transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    onClick={(e) => handleToggleRead(note, e)}
                    className="text-neutral-400 hover:text-indigo-600 shrink-0"
                  >
                    {note.isRead ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {note.pinned && <Pin size={11} className="text-amber-600 fill-amber-500 shrink-0" />}
                      <span className="font-bold text-[#2F3437] truncate">
                        {note.title || (isAr ? 'خاطرة غير معنونة' : 'Untitled Thought')}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#787774] truncate mt-0.5">
                      {note.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {note.reminderDate && (
                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                      <Bell size={10} /> {note.reminderDate}
                    </span>
                  )}
                  <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md font-medium">
                    {getCategoryLabel(note.category)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (note.id) {
                        onUpdateNote(note.id, { archived: true, archivedAt: Date.now() });
                      }
                    }}
                    className="p-1 rounded hover:bg-amber-50 text-neutral-400 hover:text-amber-600 transition-colors"
                    title={isAr ? 'أرشفة الملاحظة' : 'Archive note'}
                  >
                    <Archive size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNoteToDelete(note);
                    }}
                    className="p-1 rounded hover:bg-rose-50 text-neutral-400 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW MODE 3: SPLIT-PANE EDITOR VIEW */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Left List */}
          <div className="md:col-span-4 space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const isSelected = (splitSelectedId || filteredNotes[0]?.id) === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSplitSelectedId(note.id || null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isAr ? 'text-right' : 'text-left'
                  } ${
                    isSelected
                      ? 'bg-white border-[#2F3437] shadow-xs ring-1 ring-[#2F3437]/10'
                      : 'bg-white border-[#EAE9E6] hover:bg-[#FBFBFA]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-[#2F3437] truncate">
                      {note.title || (isAr ? 'خاطرة غير معنونة' : 'Untitled Thought')}
                    </span>
                    {note.pinned && <Pin size={11} className="text-amber-600 fill-amber-500" />}
                  </div>
                  <p className="text-[11px] text-[#787774] line-clamp-2 mt-1">{note.content}</p>
                </div>
              );
            })}
          </div>

          {/* Right Active Editor */}
          <div className="md:col-span-8">
            {(() => {
              const active = notes.find((n) => n.id === splitSelectedId) || notes[0];
              if (!active) return <div className="p-8 text-center text-xs text-[#787774]">{isAr ? 'اختر ملاحظة لعرضها' : 'Select a note'}</div>;
              return (
                <div className="bg-white rounded-xl border border-[#EAE9E6] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={active.title}
                      onChange={(e) => onUpdateNote(active.id!, { title: e.target.value })}
                      className="text-lg font-bold text-[#2F3437] focus:outline-none w-full"
                    />
                    <button
                      onClick={() => handleToggleRead(active)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-[#2F3437] flex items-center gap-1 shrink-0"
                    >
                      {active.isRead ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Circle size={13} />}
                      <span>{active.isRead ? (isAr ? 'تمت المراجعة' : 'Reviewed') : (isAr ? 'للقراءة' : 'To Read')}</span>
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={active.content}
                    onChange={(e) => onUpdateNote(active.id!, { content: e.target.value })}
                    className="w-full text-xs sm:text-sm text-[#2F3437] leading-relaxed p-3 rounded-xl border border-[#EAE9E6] focus:border-[#2F3437] focus:outline-none bg-[#FBFBFA]"
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* FOCUS MODAL: Distraction-Free Reader & Editor */}
      {activeModalNote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#EAE9E6] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#EAE9E6] flex items-center justify-between gap-2 bg-[#FBFBFA]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalMode('read')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    modalMode === 'read' ? 'bg-[#2F3437] text-white shadow-2xs' : 'text-[#787774] hover:text-[#2F3437]'
                  }`}
                >
                  <Eye size={13} />
                  <span>{isAr ? 'وضع القراءة' : 'Reader Mode'}</span>
                </button>

                <button
                  onClick={() => setModalMode('edit')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    modalMode === 'edit' ? 'bg-[#2F3437] text-white shadow-2xs' : 'text-[#787774] hover:text-[#2F3437]'
                  }`}
                >
                  <Edit3 size={13} />
                  <span>{isAr ? 'تعديل الملاحظة' : 'Edit Note'}</span>
                </button>
              </div>

              {/* Top Quick Actions */}
              <div className="flex items-center gap-1.5 text-xs">
                {isModalSavedRecently && (
                  <span className="text-[11px] font-mono text-emerald-600 flex items-center gap-1 mr-1">
                    <Check size={11} /> {isAr ? 'تم الحفظ' : 'Saved'}
                  </span>
                )}

                <button
                  onClick={() => handleToggleRead(activeModalNote)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    activeModalNote.isRead
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {activeModalNote.isRead ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                  <span>{activeModalNote.isRead ? (isAr ? 'تمت المراجعة' : 'Reviewed') : (isAr ? 'تحديد كمقروء' : 'Mark as Read')}</span>
                </button>

                <button
                  onClick={() => handleCopyNote(activeModalNote)}
                  className="p-1.5 rounded-lg border border-[#EAE9E6] hover:bg-neutral-100 text-[#787774]"
                  title={isAr ? 'نسخ الملاحظة' : 'Copy note'}
                >
                  {copiedNoteId === activeModalNote.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>

                <button
                  onClick={() => setActiveModalNote(null)}
                  className="p-1.5 rounded-lg border border-[#EAE9E6] hover:bg-neutral-100 text-[#787774]"
                  title={isAr ? 'إغلاق' : 'Close'}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Reader vs Editor */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {modalMode === 'read' ? (
                /* Distraction-Free Reader View */
                <div className="space-y-4">
                  <div>
                    <h2 dir="auto" className="text-xl sm:text-2xl font-bold text-[#2F3437] leading-tight text-start">
                      {activeModalNote.title || (isAr ? 'خاطرة غير معنونة' : 'Untitled Thought')}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#787774]">
                      <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md font-semibold">
                        {getCategoryLabel(activeModalNote.category)}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(activeModalNote.updatedAt || activeModalNote.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {activeModalNote.reminderDate && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                          <Bell size={11} /> {activeModalNote.reminderDate} {activeModalNote.reminderTime || ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formatted Content */}
                  <div className="text-sm text-[#2F3437] leading-relaxed space-y-2 font-sans border-t border-[#EAE9E6] pt-4">
                    {(activeModalNote.content || '').split('\n').map((line, idx) => {
                      const checkMatch = line.match(/^(\s*[-*]\s*\[)([ xX])(\]\s*)(.*)$/);
                      if (checkMatch) {
                        const isDone = checkMatch[2].toLowerCase() === 'x';
                        return (
                          <div
                            key={idx}
                            onClick={(e) => handleToggleInlineChecklist(activeModalNote, idx, e)}
                            dir="auto"
                            className="flex items-start gap-2 py-1 cursor-pointer hover:bg-neutral-50 px-1 rounded-lg text-start"
                          >
                            <div
                              className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${
                                isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-neutral-400'
                              }`}
                            >
                              {isDone && <Check size={12} />}
                            </div>
                            <span className={isDone ? 'line-through text-neutral-400' : 'text-[#2F3437]'}>
                              {checkMatch[4]}
                            </span>
                          </div>
                        );
                      }
                      if (!line.trim()) return <div key={idx} className="h-2" />;
                      return <p key={idx} dir="auto" className="text-start">{line}</p>;
                    })}
                  </div>
                </div>
              ) : (
                /* Editor View */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => {
                      setModalTitle(e.target.value);
                      handleModalAutoSave(e.target.value, modalContent, modalCategory, modalTags, modalColor, modalReminderDate, modalReminderTime);
                    }}
                    placeholder={isAr ? 'عنوان المستند...' : 'Document Title...'}
                    className="w-full text-xl font-bold text-[#2F3437] focus:outline-none placeholder:text-neutral-300"
                  />

                  {/* Metadata selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#FBFBFA] p-2.5 rounded-xl border border-[#EAE9E6] text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-[#787774] uppercase block mb-1">
                        {isAr ? 'التصنيف' : 'Category'}
                      </label>
                      <select
                        value={modalCategory}
                        onChange={(e) => {
                          const next = e.target.value as NoteItem['category'];
                          setModalCategory(next);
                          handleModalAutoSave(modalTitle, modalContent, next, modalTags, modalColor, modalReminderDate, modalReminderTime);
                        }}
                        className="w-full px-2 py-1 rounded-md border border-[#EAE9E6] bg-white font-medium text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>{getCategoryLabel(c)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#787774] uppercase block mb-1 flex items-center gap-1">
                        <Bell size={10} className="text-amber-600" /> {isAr ? 'تاريخ التذكير' : 'Reminder Date'}
                      </label>
                      <input
                        type="date"
                        value={modalReminderDate}
                        onChange={(e) => {
                          setModalReminderDate(e.target.value);
                          handleModalAutoSave(modalTitle, modalContent, modalCategory, modalTags, modalColor, e.target.value, modalReminderTime);
                        }}
                        className="w-full px-2 py-1 rounded-md border border-[#EAE9E6] bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#787774] uppercase block mb-1">
                        {isAr ? 'تلوين الملاحظة' : 'Color Tint'}
                      </label>
                      <select
                        value={modalColor}
                        onChange={(e) => {
                          setModalColor(e.target.value);
                          handleModalAutoSave(modalTitle, modalContent, modalCategory, modalTags, e.target.value, modalReminderDate, modalReminderTime);
                        }}
                        className="w-full px-2 py-1 rounded-md border border-[#EAE9E6] bg-white font-medium text-xs"
                      >
                        <option value="default">{isAr ? 'أبيض (افتراضي)' : 'Default White'}</option>
                        <option value="amber">{isAr ? 'كهرماني دافئ' : 'Warm Amber'}</option>
                        <option value="emerald">{isAr ? 'زمردي هادئ' : 'Soft Emerald'}</option>
                        <option value="blue">{isAr ? 'أزرق بارد' : 'Cool Blue'}</option>
                        <option value="purple">{isAr ? 'أرجواني ناعم' : 'Gentle Purple'}</option>
                        <option value="rose">{isAr ? 'وردي لطيف' : 'Soft Rose'}</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    value={modalContent}
                    onChange={(e) => {
                      setModalContent(e.target.value);
                      handleModalAutoSave(modalTitle, e.target.value, modalCategory, modalTags, modalColor, modalReminderDate, modalReminderTime);
                    }}
                    placeholder={isAr ? 'اكتب أي شيء بحرية... استخدم "- [ ] عنصر" لإنشاء قوائم مهام فورية!' : 'Write anything freely... Use \'- [ ] item\' for instant checklists!'}
                    dir="auto"
                    className="w-full text-xs sm:text-sm text-[#2F3437] leading-relaxed p-3 rounded-xl border border-[#EAE9E6] focus:border-[#2F3437] focus:outline-none bg-[#FBFBFA] font-mono sm:font-sans resize-y text-start"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer: Conversions & Delete */}
            <div className="p-3 bg-[#FBFBFA] border-t border-[#EAE9E6] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {onConvertToTask && (
                  <button
                    onClick={() => {
                      handleConvertToTask(activeModalNote);
                      setActiveModalNote(null);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#EAE9E6] hover:bg-neutral-100 rounded-lg font-semibold text-[#2F3437] shadow-2xs"
                  >
                    <CheckSquare size={13} className="text-indigo-600" />
                    <span>{isAr ? 'إرسال إلى متتبع المهام' : 'Send to Task Tracker'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (activeModalNote?.id) {
                      onUpdateNote(activeModalNote.id, { archived: true, archivedAt: Date.now() });
                      setActiveModalNote(null);
                    }
                  }}
                  className="flex items-center gap-1 text-amber-700 hover:text-amber-800 px-2.5 py-1 rounded-md hover:bg-amber-50 border border-amber-200 transition-colors font-medium"
                >
                  <Archive size={13} />
                  <span>{isAr ? 'أرشفة الملاحظة' : 'Archive Note'}</span>
                </button>
                <button
                  onClick={() => {
                    setNoteToDelete(activeModalNote);
                    setActiveModalNote(null);
                  }}
                  className="flex items-center gap-1 text-rose-600 hover:text-rose-800 px-2 py-1 rounded-md hover:bg-rose-50"
                >
                  <Trash2 size={13} />
                  <span>{isAr ? 'حذف الملاحظة' : 'Delete Note'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(noteToDelete)}
        title={isAr ? 'حذف الملاحظة' : 'Delete Note'}
        message={isAr 
          ? `هل أنت متأكد أنك تريد حذف "${noteToDelete?.title || 'خاطرة غير معنونة'}"؟ سيتم إزالة هذه الملاحظة نهائياً.`
          : `Are you sure you want to delete "${noteToDelete?.title || 'Untitled Thought'}"? This note will be permanently removed.`}
        confirmLabel={isAr ? 'حذف الملاحظة' : 'Delete Note'}
        onConfirm={() => {
          if (noteToDelete?.id) {
            onDeleteNote(noteToDelete.id);
            if (activeModalNote?.id === noteToDelete.id) {
              setActiveModalNote(null);
            }
          }
          setNoteToDelete(null);
        }}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
};
