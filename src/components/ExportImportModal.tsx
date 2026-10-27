import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  Smartphone,
  Check,
  Copy,
  AlertCircle,
  Database,
  Cloud,
  RefreshCw,
  Sparkles,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Timer,
  ShieldCheck,
} from 'lucide-react';
import { HabitItem, TaskItem, ProjectItem, NoteItem, WeeklyPlanSlot, ChecklistGroup, GoalItem, AppComment, FocusSession } from '../types';
import { generateHabitsCSV } from '../utils/habitAnalytics';
import { importBackupData, importPlanJSON, clearAllDataFromFirestore } from '../services/firestoreService';
import { BrainCircuit } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: HabitItem[];
  tasks: TaskItem[];
  projects: ProjectItem[];
  notes: NoteItem[];
  plans: WeeklyPlanSlot[];
  checklists?: ChecklistGroup[];
  goals?: GoalItem[];
  comments?: AppComment[];
  focusSessions?: FocusSession[];
  onDataReset?: () => void;
  lang?: 'en' | 'ar';
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  habits,
  tasks,
  projects,
  notes,
  plans,
  checklists = [],
  goals = [],
  comments = [],
  focusSessions = [],
  onDataReset,
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'phone' | 'reset'>('export');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Reset confirmation state
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = generateHabitsCSV(habits);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `habits-data-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON (Full Workspace Backup)
  const handleExportJSON = () => {
    const fullBackup = {
      version: '3.0',
      system: 'Life-OS Core Workspace Backup',
      exportedAt: new Date().toISOString(),
      counts: {
        habits: habits.length,
        tasks: tasks.length,
        projects: projects.length,
        notes: notes.length,
        planner: plans.length,
        checklists: checklists.length,
        goals: goals.length,
        comments: comments.length,
        focusSessions: focusSessions.length,
      },
      data: {
        habits,
        tasks,
        projects,
        checklists,
        notes,
        planner: plans,
        goals,
        comments,
        focusSessions,
      },
    };

    const jsonString = JSON.stringify(fullBackup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `life-os-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle JSON Import (Supports both AI Plan format and Full Backups)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsImporting(true);
        setImportError(null);
        setImportStatus('Parsing and validating JSON structure...');

        const parsed = JSON.parse(event.target?.result as string);

        // Check if full backup schema
        if (parsed.data && typeof parsed.data === 'object') {
          setImportStatus('Restoring full workspace snapshot into Firestore...');
          const res = await importBackupData(parsed.data);
          setImportStatus(`Successfully restored ${res} items across all modules!`);
        } else if (parsed.habits || parsed.tasks || parsed.goals) {
          // AI Plan Format
          setImportStatus('Applying AI Strategy plan into database...');
          const res = await importPlanJSON(parsed);
          setImportStatus(`AI Plan imported! Added ${res.habitsCount} habits, ${res.tasksCount} tasks, and ${res.goalsCount} targets.`);
        } else {
          throw new Error('Unrecognized JSON structure. Please use a backup from this system or an AI Mentor plan.');
        }
      } catch (err: any) {
        console.error('Import error:', err);
        setImportError(err.message || 'Failed to parse JSON file.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyUrl = () => {
    if (appUrl) {
      navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleResetData = async () => {
    if (confirmText.toLowerCase() !== 'reset') return;

    try {
      setIsResetting(true);
      await clearAllDataFromFirestore();
      setResetSuccess(true);
      if (onDataReset) {
        onDataReset();
      }
    } catch (e: any) {
      alert('Error clearing data: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  const totalItemCount = habits.length + tasks.length + projects.length + notes.length + plans.length + checklists.length + goals.length + comments.length + focusSessions.length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#18191D] rounded-3xl max-w-2xl w-full my-auto shadow-2xl border border-[#EAE9E6] dark:border-[#2A2C33] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAE9E6] dark:border-[#2A2C33] bg-[#FBFBFA] dark:bg-[#151619] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#787774] dark:text-neutral-400 font-medium mb-1">
              <Database size={14} className="text-blue-500" />
              <span>{isAr ? 'مركز البيانات والمزامنة' : 'Data Center'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2F3437] dark:text-white">
              {isAr ? 'إدارة البيانات والمزامنة' : 'Data Management & Sync'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-[#262830] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] flex items-center gap-1 sm:gap-4 text-xs font-semibold overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#2F3437] text-[#2F3437] dark:border-white dark:text-white'
                : 'border-transparent text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <Download size={14} />
            <span>{isAr ? 'تصدير البيانات' : 'Export Data'}</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#2F3437] text-[#2F3437] dark:border-white dark:text-white'
                : 'border-transparent text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <Upload size={14} />
            <span>{isAr ? 'استعادة / استيراد' : 'Restore / Import'}</span>
          </button>

          <button
            onClick={() => setActiveTab('phone')}
            className={`py-3 px-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'phone'
                ? 'border-[#2F3437] text-[#2F3437] dark:border-white dark:text-white'
                : 'border-transparent text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            <span>{isAr ? 'مزامنة الهاتف' : 'Phone Sync'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reset')}
            className={`py-3 px-2 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'reset'
                ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                : 'border-transparent text-rose-500 hover:text-rose-700'
            }`}
          >
            <Trash2 size={14} />
            <span>{isAr ? 'تنظيف / إعادة ضبط' : 'Clean Up / Reset'}</span>
          </button>
        </div>

        {/* Tab Body with overscroll containment */}
        <div className="p-6 overflow-y-auto space-y-6 bg-[#FBFBFA]/50 dark:bg-[#121316] flex-1 overscroll-contain">
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-[#787774] dark:text-neutral-400 leading-relaxed">
                {isAr ? 'قم بتصدير عاداتك ومهامك ومشاريعك وأهدافك وملاحظاتك للتحليل في جداول البيانات أو للحفظ الآمن.' : 'Export your habits, tasks, projects, goals, notes, and weekly schedules for spreadsheet analysis or external backups.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CSV Box */}
                <div className="bg-white dark:bg-[#18191D] p-5 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FileSpreadsheet size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-[#2F3437] dark:text-white">
                      {isAr ? 'تصدير العادات كملف CSV' : 'Export Habits as CSV'}
                    </h3>
                    <p className="text-xs text-[#787774] dark:text-neutral-400 leading-relaxed">
                      {isAr ? 'ملف جداول بيانات يحتوي على سجل الإنجاز اليومي الكامل، السلاسل، التكرارات، والملاحظات اليومية.' : 'Spreadsheet compatible format containing full daily check-in histories, streaks, target frequencies, and daily journal notes.'}
                    </p>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>{isAr ? `تنزيل ملف CSV (${habits.length} عادة)` : `Download Habits CSV (${habits.length} habits)`}</span>
                  </button>
                </div>

                {/* JSON Full Backup Box */}
                <div className="bg-white dark:bg-[#18191D] p-5 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <FileCode size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-[#2F3437] dark:text-white">
                      {isAr ? 'نسخة احتياطية كاملة (JSON)' : 'Full Database Backup (JSON)'}
                    </h3>
                    <p className="text-xs text-[#787774] dark:text-neutral-400 leading-relaxed">
                      {isAr ? 'لقطة كاملة لجميع الوحدات (العادات، المهام، المشاريع، الأهداف، الملاحظات، القوائم، المخطط) للحفظ والاستعادة بنقرة واحدة.' : 'Complete snapshot of all modules (Habits, Tasks, Projects, Goals, Notes, Checklists, Planner) for safe storage and one-click restore.'}
                    </p>
                  </div>

                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#2F3437] dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>{isAr ? 'تنزيل النسخة الكاملة (JSON)' : 'Download Full Backup.json'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#18191D] p-4 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs text-xs space-y-1.5">
                <div className="font-semibold text-[#2F3437] dark:text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>{isAr ? 'حفظ سحابي فوري ومستمر' : 'Real-Time Cloud Persistence'}</span>
                </div>
                <p className="text-[#787774] dark:text-neutral-400 leading-relaxed">
                  {isAr ? 'بياناتك محفوظة باستمرار وبشكل فوري في قاعدة بياناتك السحابية Firestore. خيارات التصدير تمنحك ملكية وحرية كاملة لبياناتك في أي وقت.' : 'Your data is continuously saved to your live Firestore database. These export options are provided so you have 100% data ownership and portability at any time.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT / RESTORE */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#18191D] p-6 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#2F3437] dark:text-white flex items-center gap-2">
                      <span>{isAr ? 'استيراد خطة أو ملف احتياطي' : 'Import Plan or Backup File'}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#2bb380] font-bold">
                        Auto Batch Sync
                      </span>
                    </h3>
                    <p className="text-xs text-[#787774] dark:text-neutral-400 leading-relaxed">
                      {isAr ? 'ارفع خطة أسبوعية مولدة بالذكاء الاصطناعي أو ملف JSON كامل لكتابة العادات والمهام والأهداف والمواعيد دفعة واحدة في Firestore.' : 'Upload an AI-generated weekly plan or full JSON backup to automatically batch-write habits, tasks, goals, and schedules into Firestore.'}
                    </p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-[#D3D1CB] dark:border-neutral-700 hover:border-[#34D399] transition-colors rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2 bg-[#FBFBFA]/50 dark:bg-[#1E2025]">
                  <div className="w-10 h-10 rounded-xl bg-[#34D399]/10 text-[#34D399] flex items-center justify-center font-bold">
                    <Upload size={22} />
                  </div>
                  <p className="text-xs font-semibold text-[#2F3437] dark:text-white">
                    {isAr ? 'اختر ملف JSON للاستيراد الجماعي' : 'Choose Plan or Backup JSON file to batch import'}
                  </p>
                  <label className="cursor-pointer px-4 py-2 bg-[#2D3136] dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95">
                    <span>{isAr ? 'تحديد ملف JSON' : 'Select JSON File'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isImporting}
                    />
                  </label>
                  <span className="text-[11px] text-[#787774] dark:text-neutral-400">
                    {isAr ? 'يقبل صيغة خطة الذكاء الاصطناعي أو النسخ الاحتياطية الكاملة' : 'Accepts AI Plan schema or full Core workspace backups'}
                  </span>
                </div>

                {importStatus && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>{importStatus}</span>
                  </div>
                )}

                {importError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PHONE & PC SYNC */}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#18191D] p-6 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Smartphone size={26} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#2F3437] dark:text-white">
                      {isAr ? 'المزامنة مع هاتفك الذكي (Mobile Companion)' : 'Sync with your Phone (Mobile Companion)'}
                    </h3>
                    <p className="text-xs text-[#787774] dark:text-neutral-400 leading-relaxed">
                      {isAr ? 'بفضل المزامنة اللحظية مع Firestore، أي عادة أو مهمة تنجزها على هاتفك تنعكس فوراً على شاشة حاسوبك والعكس صحيح!' : 'Because this app uses Cloud Firestore real-time listeners, any habit checked or task completed on your phone updates instantly on your PC screen and vice versa!'}
                    </p>
                  </div>
                </div>

                {/* Direct App Link */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-[#2F3437] dark:text-white">
                    {isAr ? 'رابط بيئة العمل المباشر' : 'Live Cloud Workspace URL'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={appUrl}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 bg-neutral-50 dark:bg-[#1E2025] text-xs font-mono text-[#2F3437] dark:text-white select-all"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2F3437] dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedUrl ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الرابط' : 'Copy Link')}</span>
                    </button>
                  </div>
                </div>

                {/* Steps */}
                <div className="p-4 bg-[#FBFBFA] dark:bg-[#1E2025] rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs space-y-2 text-[#787774] dark:text-neutral-300">
                  <p className="font-semibold text-[#2F3437] dark:text-white">{isAr ? 'طريقة الاستخدام على الهاتف:' : 'How to access on your phone:'}</p>
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                    <li>{isAr ? 'افتح هذا الرابط في Safari (iOS) أو Chrome (Android) على هاتفك.' : 'Open this URL in Safari (iOS) or Chrome (Android) on your phone.'}</li>
                    <li>{isAr ? 'اضغط على زر المشاركة (Safari) أو القائمة (Chrome) واختر "إضافة إلى الشاشة الرئيسية".' : 'Tap Share (Safari) or Menu (Chrome) → select "Add to Home Screen".'}</li>
                    <li>{isAr ? 'افتح التطبيق من شاشتك الرئيسية ليعمل كتطبيق كامل ومباشر مع مزامنة فورية!' : 'Launch the app from your home screen — it runs as a native full-screen app with instantaneous cloud synchronization!'}</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLEAN UP / RESET */}
          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-5 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                      {isAr ? 'تنظيف شامل وبدء صفحة جديدة (مسح كافة البيانات)' : 'Clean Up & Start Fresh (Wipe All Data)'}
                    </h3>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                      {isAr ? 'سيؤدي هذا الإجراء إلى حذف جميع العادات والمهام والمشاريع والملاحظات والأهداف والجداول بشكل دائم من Firestore لتبدأ بمساحة عمل فارغة تماماً.' : 'This will permanently delete all your sample and custom habits, tasks, projects, goals, notes, checklists, and weekly plans from Cloud Firestore so you can start with a completely clean slate.'}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#18191D] p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs space-y-2">
                  <div className="font-semibold text-[#2F3437] dark:text-white">{isAr ? `العناصر الحالية في قاعدة بياناتك (${totalItemCount} عنصر):` : `Items currently in your database (${totalItemCount} total):`}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#787774] dark:text-neutral-400">
                    <div>• <strong>{habits.length}</strong> {isAr ? 'عادة' : 'habits'}</div>
                    <div>• <strong>{tasks.length}</strong> {isAr ? 'مهمة' : 'tasks'}</div>
                    <div>• <strong>{projects.length}</strong> {isAr ? 'مشروع' : 'projects'}</div>
                    <div>• <strong>{goals.length}</strong> {isAr ? 'هدف' : 'goals'}</div>
                    <div>• <strong>{checklists.length}</strong> {isAr ? 'قائمة' : 'checklists'}</div>
                    <div>• <strong>{notes.length}</strong> {isAr ? 'ملاحظة' : 'notes'}</div>
                    <div>• <strong>{plans.length}</strong> {isAr ? 'موعد مجدول' : 'schedule slots'}</div>
                    <div>• <strong>{comments.length}</strong> {isAr ? 'تعليق' : 'comments'}</div>
                    <div>• <strong>{focusSessions.length}</strong> {isAr ? 'جلسة تركيز' : 'focus sessions'}</div>
                  </div>
                </div>

                {resetSuccess ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                    <Check size={18} className="text-emerald-600 shrink-0" />
                    <span><strong>{isAr ? 'تم تنظيف قاعدة البيانات بنجاح!' : 'Database successfully cleaned!'}</strong> {isAr ? 'لديك الآن مساحة عمل فارغة ونظيفة.' : 'You now have a fresh, empty workspace.'}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200">
                      {isAr ? 'اكتب RESET للتأكيد على مسح كافة العناصر:' : `Type RESET below to confirm wiping all ${totalItemCount} items:`}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Type RESET to confirm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#18191D] text-xs font-mono text-[#2F3437] dark:text-white focus:outline-rose-500"
                      />
                      <button
                        onClick={handleResetData}
                        disabled={confirmText.toLowerCase() !== 'reset' || isResetting}
                        className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        {isResetting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        <span>{isAr ? 'مسح وتنظيف كل شيء' : 'Wipe & Clean Up Everything'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#EAE9E6] dark:border-[#2A2C33] bg-[#FBFBFA] dark:bg-[#151619] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#787774] dark:text-neutral-400">
            {totalItemCount} {isAr ? 'إجمالي العناصر المخزنة سحابياً' : 'total items stored in cloud'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 dark:bg-[#262830] text-[#2F3437] dark:text-white rounded-xl text-xs font-semibold hover:bg-neutral-300 dark:hover:bg-[#323540] transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
