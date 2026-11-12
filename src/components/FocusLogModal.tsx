import React, { useState, useEffect } from 'react';
import { X, Zap, Save } from 'lucide-react';
import { FocusSession } from '../types';

interface FocusLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Omit<FocusSession, 'id'>) => Promise<void>;
  onUpdate?: (id: string, session: Partial<FocusSession>) => Promise<void>;
  sessionToEdit?: FocusSession | null;
  lang?: 'en' | 'ar';
}

export const FocusLogModal: React.FC<FocusLogModalProps> = ({
  isOpen, onClose, onSave, onUpdate, sessionToEdit, lang = 'en'
}) => {
  const isAr = lang === 'ar';
  const [title, setTitle] = useState(sessionToEdit?.title || '');
  const [duration, setDuration] = useState(sessionToEdit?.duration || 25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionToEdit) {
      setTitle(sessionToEdit.title);
      setDuration(sessionToEdit.duration);
    } else {
      setTitle('');
      setDuration(25);
    }
  }, [sessionToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || duration <= 0) return;
    
    setIsSubmitting(true);
    try {
      if (sessionToEdit && sessionToEdit.id && onUpdate) {
        await onUpdate(sessionToEdit.id, { title, duration });
      } else {
        await onSave({
          title,
          duration,
          type: 'focus',
          associatedType: 'none',
          createdAt: Date.now()
        });
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
            <Zap size={16} className="text-emerald-500" />
            {sessionToEdit 
              ? (isAr ? 'تعديل جلسة التركيز' : 'Edit Focus Session') 
              : (isAr ? 'تسجيل وقت تركيز يدوي' : 'Log Manual Focus Time')}
          </h3>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {isAr ? 'عنوان المهمة أو التركيز' : 'Task or Focus Title'}
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isAr ? 'مثال: كتابة التقرير...' : 'e.g. Drafting the report...'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {isAr ? 'المدة (بالدقائق)' : 'Duration (minutes)'}
          </label>
          <input
            type="number"
            required
            min="1"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Save size={14} />
          {isSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الجلسة' : 'Save Session')}
        </button>
      </form>
    </div>
  );
};
