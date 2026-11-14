import React, { useState, useEffect } from 'react';
import { X, Zap, Save, Clock, BookOpen, CheckSquare } from 'lucide-react';
import { FocusSession, ProjectItem, TaskItem } from '../types';

interface FocusLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Omit<FocusSession, 'id'>) => Promise<void>;
  onUpdate?: (id: string, session: Partial<FocusSession>) => Promise<void>;
  sessionToEdit?: FocusSession | null;
  defaultDuration?: number;
  projects?: ProjectItem[];
  tasks?: TaskItem[];
  initialProjectId?: string;
  initialTaskId?: string | null;
  lang?: 'en' | 'ar';
}

export const FocusLogModal: React.FC<FocusLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  sessionToEdit,
  defaultDuration = 50,
  projects = [],
  tasks = [],
  initialProjectId = 'none',
  initialTaskId = null,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(defaultDuration);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);

    if (sessionToEdit) {
      const totalMins = Math.max(1, sessionToEdit.duration || defaultDuration);
      setTitle(sessionToEdit.title || '');
      setHours(Math.floor(totalMins / 60));
      setMinutes(totalMins % 60);
      if (sessionToEdit.associatedType === 'project' && sessionToEdit.associatedId) {
        setSelectedProjectId(sessionToEdit.associatedId);
        setSelectedTaskId('none');
      } else if (sessionToEdit.associatedType === 'task' && sessionToEdit.associatedId) {
        const matchedTask = tasks.find((t) => t.id === sessionToEdit.associatedId);
        setSelectedProjectId(matchedTask?.linkedProjectId || 'none');
        setSelectedTaskId(sessionToEdit.associatedId);
      } else {
        setSelectedProjectId('none');
        setSelectedTaskId('none');
      }
    } else {
      const totalMins = Math.max(1, defaultDuration || 50);
      setTitle('');
      setHours(Math.floor(totalMins / 60));
      setMinutes(totalMins % 60);
      setSelectedProjectId(initialProjectId || 'none');
      setSelectedTaskId(initialTaskId || 'none');
    }
  }, [isOpen, sessionToEdit, defaultDuration, initialProjectId, initialTaskId]);

  if (!isOpen) return null;

  const totalMinutes = Math.max(0, (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0));

  const applyPresetMinutes = (total: number) => {
    setHours(Math.floor(total / 60));
    setMinutes(total % 60);
    setErrorMsg(null);
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId !== 'none') {
      return t.linkedProjectId === selectedProjectId;
    }
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (totalMinutes <= 0) {
      setErrorMsg(isAr ? 'يرجى إدخال مدة لا تقل عن دقيقة واحدة.' : 'Please enter a duration of at least 1 minute.');
      return;
    }

    const boundTask = selectedTaskId !== 'none' ? tasks.find((t) => t.id === selectedTaskId) : undefined;
    const boundProject = selectedProjectId !== 'none' ? projects.find((p) => p.id === selectedProjectId) : undefined;

    const finalTitle =
      title.trim() ||
      boundTask?.title ||
      boundProject?.title ||
      (isAr ? 'عمل عميق (جلسة يدوية)' : 'Deep Work (Manual Session)');

    const associatedType: 'task' | 'project' | 'none' = boundTask
      ? 'task'
      : boundProject
      ? 'project'
      : 'none';
    const associatedId = boundTask?.id || boundProject?.id;
    const associatedTitle = boundTask?.title || boundProject?.title;

    setIsSubmitting(true);
    try {
      if (sessionToEdit && sessionToEdit.id && onUpdate) {
        await onUpdate(sessionToEdit.id, {
          title: finalTitle,
          duration: totalMinutes,
          associatedType,
          associatedId,
          associatedTitle,
        });
      } else {
        await onSave({
          title: finalTitle,
          duration: totalMinutes,
          type: 'focus',
          associatedType,
          associatedId,
          associatedTitle,
          createdAt: Date.now(),
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving manual focus session:', err);
      setErrorMsg(
        err?.message ||
          (isAr ? 'تعذر حفظ الجلسة، حاول مرة أخرى.' : 'Failed to save session. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        dir={isAr ? 'rtl' : 'ltr'}
        className="bg-white dark:bg-[#181A20] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-5 sm:p-6 max-w-md w-full space-y-4 animate-scaleUp"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
            <Zap size={16} className="text-emerald-500" />
            {sessionToEdit
              ? isAr
                ? 'تعديل جلسة التركيز'
                : 'Edit Focus Session'
              : isAr
              ? 'تسجيل وقت عمل يدوي (بدون بومودورو)'
              : 'Log Manual Work Session (No Pomodoro)'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Title (Optional - auto-fills if empty) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
            <span>{isAr ? 'وصف العمل / الجلسة (اختياري)' : 'Session Description (Optional)'}</span>
            <span className="text-[10px] font-normal text-neutral-400">
              {isAr ? 'افتراضي: عمل عميق' : 'Defaults to Deep Work'}
            </span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isAr ? 'مثال: دراسة، برمجة، عمل عميق...' : 'e.g. Deep coding, client sprint, study...'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/90 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Quick Duration Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <Clock size={13} className="text-emerald-500" />
            <span>{isAr ? 'اختيار سريع للمدة:' : 'Quick Duration:'}</span>
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {[
              { mins: 25, label: '25m' },
              { mins: 50, label: '50m' },
              { mins: 60, label: '1h' },
              { mins: 120, label: '2h' },
              { mins: 180, label: '3h' },
              { mins: 240, label: '4h' },
            ].map((preset) => (
              <button
                key={preset.mins}
                type="button"
                onClick={() => applyPresetMinutes(preset.mins)}
                className={`py-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                  totalMinutes === preset.mins
                    ? 'bg-emerald-500 text-white dark:text-neutral-950 border-emerald-500 shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-emerald-500/40'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hours & Minutes Steppers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block">
              {isAr ? 'الساعات' : 'Hours'}
            </label>
            <input
              type="number"
              min={0}
              max={24}
              value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/90 text-sm font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block">
              {isAr ? 'الدقائق' : 'Minutes'}
            </label>
            <input
              type="number"
              min={0}
              max={599}
              value={minutes}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                if (val >= 60) {
                  setHours((h) => h + Math.floor(val / 60));
                  setMinutes(val % 60);
                } else {
                  setMinutes(val);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/90 text-sm font-mono font-bold text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 tabular-nums"
            />
          </div>
        </div>

        <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
            {isAr ? 'إجمالي المدة المسجلة:' : 'Total Logged Time:'}
          </span>
          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m ({totalMinutes}m)
          </span>
        </div>

        {/* Optional Project / Task Binding */}
        {(projects.length > 0 || tasks.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <BookOpen size={11} />
                <span>{isAr ? 'المشروع (اختياري)' : 'Project (Optional)'}</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedTaskId('none');
                }}
                className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/90 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="none">{isAr ? 'بدون مشروع (عام)' : 'No Project (General)'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <CheckSquare size={11} />
                <span>{isAr ? 'المهمة (اختياري)' : 'Task (Optional)'}</span>
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/90 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="none">{isAr ? 'بدون مهمة (تركيز حر)' : 'No Task (Free Focus)'}</option>
                {filteredTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || totalMinutes <= 0}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white dark:text-neutral-950 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Save size={14} />
          {isSubmitting
            ? isAr
              ? 'جاري الحفظ...'
              : 'Saving...'
            : sessionToEdit
            ? isAr
              ? 'حفظ التعديلات'
              : 'Save Changes'
            : isAr
            ? 'تسجيل الجلسة الآن'
            : 'Log Focus Session'}
        </button>
      </form>
    </div>
  );
};
