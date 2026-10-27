import React, { useState, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  AtSign, 
  Search, 
  Filter, 
  Pin, 
  Trash2, 
  Edit2, 
  Download, 
  Sparkles, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Flame, 
  StickyNote, 
  FolderKanban, 
  Target,
  ExternalLink,
  MessageCircle,
  Plus
} from 'lucide-react';
import { 
  AppComment, 
  CommentMention, 
  TaskItem, 
  HabitItem, 
  NoteItem, 
  ProjectItem, 
  GoalItem, 
  ModuleType 
} from '../types';
import { ConfirmModal } from './ConfirmModal';

interface CommentsHubProps {
  comments: AppComment[];
  onAddComment: (comment: Omit<AppComment, 'id'>) => Promise<any>;
  onUpdateComment: (id: string, updates: Partial<AppComment>) => Promise<any>;
  onDeleteComment: (id: string) => Promise<any>;
  onNavigateToModule?: (module: ModuleType) => void;
  tasks?: TaskItem[];
  habits?: HabitItem[];
  notes?: NoteItem[];
  projects?: ProjectItem[];
  goals?: GoalItem[];
  lang?: 'en' | 'ar';
}

export const CommentsHub: React.FC<CommentsHubProps> = ({
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onNavigateToModule,
  tasks = [],
  habits = [],
  notes = [],
  projects = [],
  goals = [],
  lang = 'en',
}) => {
  const isAr = lang === 'ar';

  // Composer states
  const [newContent, setNewContent] = useState('');
  const [author, setAuthor] = useState('Executive');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState<CommentMention[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  // Editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Delete modal
  const [commentToDelete, setCommentToDelete] = useState<AppComment | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // All mentionable items across the entire OS
  const mentionCandidates: CommentMention[] = [
    ...tasks.map(t => ({ type: 'task' as const, id: t.id || '', title: t.title })),
    ...habits.map(h => ({ type: 'habit' as const, id: h.id || '', title: h.title })),
    ...notes.map(n => ({ type: 'note' as const, id: n.id || '', title: n.title })),
    ...projects.map(p => ({ type: 'project' as const, id: p.id || '', title: p.title })),
    ...goals.map(g => ({ type: 'goal' as const, id: g.id || '', title: g.title })),
  ].filter(c => c.id && c.title);

  const filteredCandidates = mentionCandidates.filter(c => 
    c.title.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    c.type.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleSelectMention = (candidate: CommentMention) => {
    if (!selectedMentions.some(m => m.id === candidate.id && m.type === candidate.type)) {
      setSelectedMentions([...selectedMentions, candidate]);
    }
    setShowMentionMenu(false);
    setMentionSearch('');
    textareaRef.current?.focus();
  };

  const handleRemoveMention = (index: number) => {
    setSelectedMentions(selectedMentions.filter((_, i) => i !== index));
  };

  const handlePostComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onAddComment({
        content: trimmed,
        createdAt: Date.now(),
        author: author || 'Executive',
        pinned: isPinned,
        mentions: selectedMentions.length > 0 ? selectedMentions : undefined,
        targetType: 'general'
      });
      setNewContent('');
      setSelectedMentions([]);
      setIsPinned(false);
      setShowMentionMenu(false);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    await onUpdateComment(commentId, {
      content: editContent.trim()
    });
    setEditingCommentId(null);
  };

  const handleTogglePin = async (comment: AppComment) => {
    if (!comment.id) return;
    await onUpdateComment(comment.id, {
      pinned: !comment.pinned
    });
  };

  // Export all filtered comments
  const handleExportComments = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(comments, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `comments_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter and sort comments
  const filteredComments = comments.filter((c) => {
    if (filterType === 'Pinned' && !c.pinned) return false;
    if (filterType === 'Tasks' && !c.mentions?.some(m => m.type === 'task') && c.targetType !== 'task') return false;
    if (filterType === 'Habits' && !c.mentions?.some(m => m.type === 'habit') && c.targetType !== 'habit') return false;
    if (filterType === 'Notes' && !c.mentions?.some(m => m.type === 'note') && c.targetType !== 'note') return false;
    if (filterType === 'Projects' && !c.mentions?.some(m => m.type === 'project') && c.targetType !== 'project') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = c.content.toLowerCase().includes(q);
      const matchAuthor = c.author?.toLowerCase().includes(q);
      const matchMentions = c.mentions?.some(m => m.title.toLowerCase().includes(q));
      if (!matchText && !matchAuthor && !matchMentions) return false;
    }
    return true;
  }).sort((a, b) => {
    // Pinned first, then newest
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isAr ? 'الآن' : 'Just now';
    if (mins < 60) return isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return isAr ? `منذ ${days} أيام` : `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare size={12} className="text-emerald-600" />;
      case 'habit': return <Flame size={12} className="text-amber-500" />;
      case 'note': return <StickyNote size={12} className="text-blue-500" />;
      case 'project': return <FolderKanban size={12} className="text-purple-500" />;
      case 'goal': return <Target size={12} className="text-rose-500" />;
      default: return <MessageSquare size={12} className="text-neutral-500" />;
    }
  };

  return (
    <div className={`space-y-4 max-w-5xl mx-auto animate-fadeIn ${isAr ? 'text-right' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAE9E6]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#787774] font-semibold mb-0.5">
            <MessageSquare size={14} className="text-indigo-600" />
            <span>{isAr ? 'منصة التعليقات والربط الشامل' : 'Universal Comments & Mentions'}</span>
            <span className="text-neutral-300">•</span>
            <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.2 rounded-md font-mono text-[11px] font-bold">
              {comments.length} {isAr ? 'تعليق' : 'logs'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2F3437]">
            {isAr ? 'سجل التعليقات والخواطر والربط بين التطبيقات' : 'Comments, Reflections & Cross-App Mentions'}
          </h2>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportComments}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#EAE9E6] hover:bg-neutral-50 text-xs font-semibold text-[#2F3437] transition-all shadow-xs"
          >
            <Download size={13} />
            <span>{isAr ? 'تصدير الكل' : 'Export All'}</span>
          </button>
        </div>
      </div>

      {/* Main Comment Composer Box */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EAE9E6] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#2F3437] flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>{isAr ? 'تدوين تعليق / فكرة / ربط جديد' : 'Compose Comment or Cross-Entity Reflection'}</span>
          </span>

          <div className="flex items-center gap-2">
            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                isPinned 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-neutral-100 text-[#787774] hover:bg-neutral-200'
              }`}
            >
              <Pin size={12} className={isPinned ? 'fill-amber-600' : ''} />
              <span>{isAr ? 'تثبيت في القمة' : 'Pin'}</span>
            </button>

            {/* Mention Item Trigger */}
            <button
              type="button"
              onClick={() => setShowMentionMenu(!showMentionMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all"
            >
              <AtSign size={13} />
              <span>{isAr ? 'إشارة لعنصر (@)' : 'Mention Item (@)'}</span>
            </button>
          </div>
        </div>

        {/* Selected Mentions Badges */}
        {selectedMentions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {selectedMentions.map((mention, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200"
              >
                {getEntityIcon(mention.type)}
                <span className="uppercase font-mono text-[10px] text-indigo-500">{mention.type}:</span>
                <span className="truncate max-w-xs">{mention.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMention(idx)}
                  className="hover:text-indigo-950 p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Mention Selection Menu Drawer */}
        {showMentionMenu && (
          <div className="bg-[#FAF9F7] p-3 rounded-2xl border border-indigo-200 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-[#2F3437]">
              <span>{isAr ? 'اختر عنصراً للإشارة إليه (مهمة، عادة، ملاحظة، مشروع، هدف):' : 'Select an item to link & mention across apps:'}</span>
              <button onClick={() => setShowMentionMenu(false)} className="text-neutral-400 hover:text-black">
                <X size={14} />
              </button>
            </div>

            <input
              type="text"
              placeholder={isAr ? 'ابحث في كافة العناصر...' : 'Search across all tasks, habits, notes, projects, goals...'}
              value={mentionSearch}
              onChange={(e) => setMentionSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#EAE9E6] bg-white focus:outline-none focus:border-indigo-400"
              autoFocus
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pt-1">
              {filteredCandidates.length === 0 ? (
                <div className="col-span-2 text-center py-3 text-xs text-[#787774]">
                  {isAr ? 'لم يتم العثور على عناصر مطابقة' : 'No matching items found'}
                </div>
              ) : (
                filteredCandidates.map((cand, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectMention(cand)}
                    className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-indigo-50/60 border border-[#EAE9E6] hover:border-indigo-300 text-left transition-all text-xs"
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      {getEntityIcon(cand.type)}
                      <span className="font-semibold text-[#2F3437] truncate">{cand.title}</span>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-[#787774] shrink-0">
                      {cand.type}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={3}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={isAr ? 'اكتب ملاحظتك أو تعليقك هنا... يتم تسجيل التوقيت والربط بشكل فوري وتزامنه سحابياً.' : 'Write your comment, insight, or update here... Timestamp and entity links will be saved in real time.'}
          className="w-full p-3.5 rounded-2xl border border-[#EAE9E6] focus:border-[#2F3437] text-xs sm:text-sm text-[#2F3437] bg-[#FBFBFA] focus:bg-white focus:outline-none placeholder:text-[#9A9996] resize-y"
        />

        {/* Submit bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-[11px] text-[#787774]">
            <Clock size={13} className="text-emerald-600" />
            <span>{isAr ? 'التوقيت التلقائي:' : 'Auto-timestamped:'}</span>
            <span className="font-mono font-medium text-[#2F3437]">
              {new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handlePostComment()}
            disabled={!newContent.trim() || isSubmitting}
            className="bg-[#2F3437] hover:bg-black disabled:opacity-40 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Send size={13} />
            <span>{isSubmitting ? (isAr ? 'جاري النشر...' : 'Posting...') : (isAr ? 'نشر التعليق' : 'Post Comment')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/70 p-2.5 rounded-2xl border border-[#EAE9E6] text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Pinned', 'Tasks', 'Habits', 'Notes', 'Projects'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
                filterType === cat
                  ? 'bg-[#2F3437] text-white shadow-xs'
                  : 'text-[#787774] hover:bg-neutral-100 bg-[#FBFBFA] sm:bg-transparent'
              }`}
            >
              {cat === 'All' ? (isAr ? 'الكل' : 'All') :
               cat === 'Pinned' ? (isAr ? '📌 المثبتة' : '📌 Pinned') :
               cat === 'Tasks' ? (isAr ? 'المهام' : 'Tasks') :
               cat === 'Habits' ? (isAr ? 'العادات' : 'Habits') :
               cat === 'Notes' ? (isAr ? 'الملاحظات' : 'Notes') : (isAr ? 'المشاريع' : 'Projects')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={isAr ? 'البحث في التعليقات والإشارات...' : 'Search comments & mentions...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 px-3 py-1 rounded-lg border border-[#EAE9E6] bg-white text-xs text-[#2F3437] focus:outline-none"
          />
        </div>
      </div>

      {/* Comments Feed */}
      <div className="space-y-3">
        {filteredComments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#EAE9E6] py-14 px-4 text-center text-sm text-[#787774] shadow-xs">
            <MessageCircle size={36} className="mx-auto text-neutral-300 mb-2" />
            <p className="font-bold text-base text-[#2F3437]">{isAr ? 'لا توجد تعليقات بعد' : 'No comments recorded'}</p>
            <p className="text-xs text-[#787774] mt-1 max-w-sm mx-auto">
              {isAr ? 'استخدم المربع أعلاه لتدوين تعليقاتك وربط المهام والعادات والملاحظات.' : 'Use the composer above to write thoughts and connect your tasks, habits, and notes.'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => {
            const isEditing = editingCommentId === comment.id;
            const fullDate = new Date(comment.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <div
                key={comment.id || comment.createdAt}
                className={`p-4 sm:p-5 bg-white rounded-3xl border transition-all shadow-xs space-y-3 group ${
                  comment.pinned ? 'border-amber-300 bg-amber-50/20 shadow-amber-500/5' : 'border-[#EAE9E6] hover:border-neutral-300'
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#2F3437] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {(comment.author || 'E')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#2F3437]">{comment.author || 'Executive'}</span>
                        {comment.pinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                            <Pin size={10} className="fill-amber-600" />
                            <span>{isAr ? 'مثبت' : 'Pinned'}</span>
                          </span>
                        )}
                        {comment.targetTitle && (
                          <span className="text-[10px] bg-neutral-100 text-[#787774] px-1.5 py-0.2 rounded font-mono">
                            {comment.targetType}: {comment.targetTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#787774] font-mono mt-0.5">
                        <span title={fullDate}>{getRelativeTime(comment.createdAt)}</span>
                        <span>•</span>
                        <span className="text-[10px] opacity-75">{fullDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleTogglePin(comment)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        comment.pinned ? 'text-amber-600 bg-amber-100' : 'text-neutral-400 hover:text-black hover:bg-neutral-100'
                      }`}
                      title={comment.pinned ? (isAr ? 'إلغاء التثبيت' : 'Unpin') : (isAr ? 'تثبيت' : 'Pin')}
                    >
                      <Pin size={14} className={comment.pinned ? 'fill-amber-600' : ''} />
                    </button>

                    <button
                      onClick={() => {
                        setEditingCommentId(comment.id || null);
                        setEditContent(comment.content);
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                      title={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      onClick={() => setCommentToDelete(comment)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Comment Content / Edit mode */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#2F3437] text-xs sm:text-sm text-[#2F3437] focus:outline-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-3 py-1 text-xs text-[#787774] hover:bg-neutral-100 rounded-lg"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => comment.id && handleSaveEdit(comment.id)}
                        className="px-4 py-1 text-xs font-bold bg-[#2F3437] text-white rounded-lg hover:bg-black"
                      >
                        {isAr ? 'حفظ' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-[#2F3437] whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                )}

                {/* Mentions Badges */}
                {comment.mentions && comment.mentions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#EAE9E6]/60">
                    <span className="text-[10px] font-bold text-[#787774] uppercase font-mono">
                      {isAr ? 'العناصر المرتبطة:' : 'Mentions:'}
                    </span>
                    {comment.mentions.map((m, i) => {
                      const targetModule: ModuleType = 
                        m.type === 'task' ? 'tasks' :
                        m.type === 'habit' ? 'habits' :
                        m.type === 'note' ? 'notes' :
                        m.type === 'project' ? 'projects' : 'goals';

                      return (
                        <button
                          key={i}
                          onClick={() => onNavigateToModule && onNavigateToModule(targetModule)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors group/pill cursor-pointer"
                          title={isAr ? `الانتقال إلى ${m.title}` : `Jump to ${m.title}`}
                        >
                          {getEntityIcon(m.type)}
                          <span className="font-mono text-[10px] text-indigo-500 uppercase">{m.type}:</span>
                          <span>{m.title}</span>
                          <ExternalLink size={10} className="opacity-0 group-hover/pill:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Comment Modal */}
      <ConfirmModal
        isOpen={Boolean(commentToDelete)}
        title={isAr ? 'حذف التعليق' : 'Delete Comment'}
        message={isAr ? 'هل أنت متأكد من رغبتك في حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this comment? This action cannot be undone.'}
        confirmLabel={isAr ? 'حذف التعليق' : 'Delete Comment'}
        onConfirm={() => {
          if (commentToDelete?.id) {
            onDeleteComment(commentToDelete.id);
          }
          setCommentToDelete(null);
        }}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
};
