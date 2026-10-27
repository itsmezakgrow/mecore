import React, { useState } from 'react';
import {
  X,
  Flame,
  Calendar,
  BarChart3,
  TrendingUp,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Save,
  Trash2,
  Share2,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { HabitItem, HabitRoutineTime } from '../types';
import {
  calculateHabitScoreHistory,
  calculateDayOfWeekStats,
  calculateHabitStats,
} from '../utils/habitAnalytics';
import { EmojiPicker } from './EmojiPicker';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface HabitDetailModalProps {
  habit: HabitItem;
  isOpen: boolean;
  onClose: () => void;
  onToggleDate: (habit: HabitItem, dateKey: string) => Promise<any>;
  onUpdateHabit: (id: string, updates: Partial<HabitItem>) => Promise<any>;
  onDeleteHabit: (id: string) => Promise<any>;
  lang?: 'en' | 'ar';
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  isOpen,
  onClose,
  onToggleDate,
  onUpdateHabit,
  onDeleteHabit,
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);

  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'score' | 'calendar' | 'weekdays' | 'settings'>('score');
  const [timeRange, setTimeRange] = useState<30 | 60 | 90>(30);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState<number>(0);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [noteInput, setNoteInput] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [selectedMood, setSelectedMood] = useState<string>(habit.dailyMoods?.[selectedCalendarDate] || '😊');

  // Edit settings states
  const [editTitle, setEditTitle] = useState(habit.title);
  const [editIcon, setEditIcon] = useState(habit.icon || '🔥');
  const [editRoutineTime, setEditRoutineTime] = useState<HabitRoutineTime>(habit.routineTime || 'anytime');
  const [editCategory, setEditCategory] = useState(habit.category);
  const [editTarget, setEditTarget] = useState(habit.targetPerWeek || 7);
  const [editQuestion, setEditQuestion] = useState(habit.question || '');
  const [editColor, setEditColor] = useState(habit.color || 'amber');
  const [editStartDate, setEditStartDate] = useState(habit.startDate || '');
  const [editIsMeasurable, setEditIsMeasurable] = useState(Boolean(habit.isMeasurable));
  const [editTargetValue, setEditTargetValue] = useState(habit.targetValue || 10);
  const [editUnit, setEditUnit] = useState(habit.unit || 'pages');
  const [frequencyMode, setFrequencyMode] = useState<'weekly' | 'specific_days'>(
    habit.frequencyType || (habit.targetDays && habit.targetDays.length > 0 ? 'specific_days' : 'weekly')
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    habit.targetDays && habit.targetDays.length > 0 
      ? habit.targetDays 
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  );

  // Custom Pause Range States
  const [customPauseStart, setCustomPauseStart] = useState(habit.pauseStartDate || new Date().toISOString().split('T')[0]);
  const [customPauseEnd, setCustomPauseEnd] = useState(habit.pauseEndDate || '');
  const [showCustomPausePicker, setShowCustomPausePicker] = useState(false);

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  if (!isOpen) return null;

  const scoreHistory = calculateHabitScoreHistory(habit, timeRange);
  const weekdayStats = calculateDayOfWeekStats(habit);
  const stats = calculateHabitStats(habit);
  const history = habit.history || {};
  const notes = habit.notes || {};
  const dailyMoods = habit.dailyMoods || {};
  const freezeExcuses = habit.freezeExcuses || {};

  // Current score is the latest score point
  const latestScore = scoreHistory[scoreHistory.length - 1]?.score || 0;

  const weekdaysList = [
    { key: 'Mon', en: 'Mon', ar: 'إثنين' },
    { key: 'Tue', en: 'Tue', ar: 'ثلاثاء' },
    { key: 'Wed', en: 'Wed', ar: 'أربعاء' },
    { key: 'Thu', en: 'Thu', ar: 'خميس' },
    { key: 'Fri', en: 'Fri', ar: 'جمعة' },
    { key: 'Sat', en: 'Sat', ar: 'سبت' },
    { key: 'Sun', en: 'Sun', ar: 'أحد' },
  ];

  const toggleDaySelection = (dayKey: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayKey)) {
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== dayKey);
      } else {
        return [...prev, dayKey];
      }
    });
  };

  const getEndOfCurrentWeekSunday = () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysUntilSunday);
    sunday.setHours(23, 59, 59, 999);
    return sunday.getTime();
  };

  const getFullCurrentWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const distToMon = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + distToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      startIso: mon.toISOString().split('T')[0],
      endIso: sun.toISOString().split('T')[0],
      endTimestamp: new Date(sun.getFullYear(), sun.getMonth(), sun.getDate(), 23, 59, 59).getTime(),
    };
  };

  const getMonthCalendarDays = (monthOffset: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    date.setDate(1);

    const monthName = date.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayIndex = (date.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: '', iso: '', isCurrentMonth: false });
    }

    const todayIso = new Date().toISOString().split('T')[0];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        iso: dayIso,
        isCurrentMonth: true,
        isToday: dayIso === todayIso,
      });
    }

    return { monthName, days };
  };

  const currentMonthData = getMonthCalendarDays(calendarMonthOffset);

  const handleSaveNote = async () => {
    if (!habit.id) return;
    setIsSavingNote(true);
    try {
      const updatedNotes = { ...(habit.notes || {}) };
      const updatedMoods = { ...(habit.dailyMoods || {}) };

      if (noteInput.trim()) {
        updatedNotes[selectedCalendarDate] = noteInput.trim();
      } else {
        delete updatedNotes[selectedCalendarDate];
      }

      if (selectedMood) {
        updatedMoods[selectedCalendarDate] = selectedMood;
      }

      await onUpdateHabit(habit.id, {
        notes: updatedNotes,
        dailyMoods: updatedMoods,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habit.id) return;
    setIsSavingSettings(true);
    try {
      await onUpdateHabit(habit.id, {
        title: editTitle.trim(),
        icon: editIcon,
        routineTime: editRoutineTime,
        category: editCategory,
        targetPerWeek: frequencyMode === 'weekly' ? editTarget : selectedDays.length,
        frequencyType: frequencyMode,
        targetDays: frequencyMode === 'specific_days' ? selectedDays : undefined,
        question: editQuestion.trim() || undefined,
        color: editColor,
        startDate: editStartDate || undefined,
        isMeasurable: editIsMeasurable,
        targetValue: editIsMeasurable ? editTargetValue : undefined,
        unit: editIsMeasurable ? editUnit.trim() : undefined,
      });
      setActiveTab('score');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getColorClasses = (c: string) => {
    switch (c) {
      case 'emerald':
        return {
          fill: '#10B981',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800/60',
          badge: 'bg-emerald-500',
        };
      case 'blue':
        return {
          fill: '#3B82F6',
          bg: 'bg-blue-50 dark:bg-blue-950/40',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800/60',
          badge: 'bg-blue-500',
        };
      case 'purple':
        return {
          fill: '#8B5CF6',
          bg: 'bg-purple-50 dark:bg-purple-950/40',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-200 dark:border-purple-800/60',
          badge: 'bg-purple-500',
        };
      case 'rose':
        return {
          fill: '#F43F5E',
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-200 dark:border-rose-800/60',
          badge: 'bg-rose-500',
        };
      case 'indigo':
        return {
          fill: '#6366F1',
          bg: 'bg-indigo-50 dark:bg-indigo-950/40',
          text: 'text-indigo-700 dark:text-indigo-300',
          border: 'border-indigo-200 dark:border-indigo-800/60',
          badge: 'bg-indigo-500',
        };
      default:
        return {
          fill: '#F59E0B',
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800/60',
          badge: 'bg-amber-500',
        };
    }
  };

  const colorTheme = getColorClasses(habit.color || 'amber');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#18191D] rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-[#EAE9E6] dark:border-[#2A2C33] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="p-5 sm:p-6 border-b border-[#EAE9E6] dark:border-[#2A2C33] bg-[#FBFBFA] dark:bg-[#151619] flex items-start justify-between shrink-0">
          <div className="space-y-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${colorTheme.bg} ${colorTheme.text} border ${colorTheme.border}`}>
                {habit.category}
              </span>
              {habit.frequencyType === 'specific_days' && habit.targetDays && habit.targetDays.length > 0 ? (
                <span className="text-xs text-[#787774] dark:text-neutral-300 font-medium flex items-center gap-1 bg-white dark:bg-[#1E2025] px-2.5 py-0.5 rounded-full border border-[#EAE9E6] dark:border-[#2A2C33]">
                  <Target size={13} className="text-amber-500" />
                  {habit.targetDays.join(', ')} ({habit.targetDays.length}d/wk)
                </span>
              ) : (
                <span className="text-xs text-[#787774] dark:text-neutral-300 font-medium flex items-center gap-1 bg-white dark:bg-[#1E2025] px-2.5 py-0.5 rounded-full border border-[#EAE9E6] dark:border-[#2A2C33]">
                  <Target size={13} className="text-amber-500" />
                  {habit.targetPerWeek || 7} {isAr ? 'أيام / أسبوع' : 'days / week'}
                </span>
              )}
              {habit.startDate && habit.startDate > new Date().toISOString().split('T')[0] && (
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Calendar size={12} />
                  {isAr ? `يبدأ في: ${habit.startDate}` : `Starts: ${habit.startDate}`}
                </span>
              )}
              {habit.snoozeUntil && habit.snoozeUntil > Date.now() && (
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock size={12} />
                  {isAr ? `متوقف مؤقتاً حتى: ${new Date(habit.snoozeUntil).toLocaleDateString()}` : `Paused until ${new Date(habit.snoozeUntil).toLocaleDateString()}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{habit.icon || '🔥'}</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2F3437] dark:text-[#F3F4F6]">
                {habit.title}
              </h2>
            </div>
            {habit.question && (
              <p className="text-xs italic text-[#787774] dark:text-neutral-400 font-normal">
                "{habit.question}"
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#787774] hover:text-[#2F3437] dark:text-neutral-400 dark:hover:text-[#F3F4F6] hover:bg-neutral-200/60 dark:hover:bg-[#262830] transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overview Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#EAE9E6] dark:divide-[#2A2C33] border-b border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] shrink-0">
          <div className="p-3.5 flex flex-col items-center text-center">
            <span className="text-[11px] uppercase tracking-wider text-[#787774] dark:text-neutral-400 font-medium">
              {isAr ? 'نقاط العادة' : 'Habit Score'}
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#2F3437] dark:text-white mt-0.5 flex items-baseline gap-0.5">
              <span>{latestScore}</span>
              <span className="text-xs text-[#787774] dark:text-neutral-400 font-normal">%</span>
            </div>
          </div>

          <div className="p-3.5 flex flex-col items-center text-center">
            <span className="text-[11px] uppercase tracking-wider text-[#787774] dark:text-neutral-400 font-medium flex items-center gap-1">
              <Flame size={12} className="text-amber-500 fill-amber-500" />
              {isAr ? 'السلسلة الحالية' : 'Current Streak'}
            </span>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
              {stats.currentStreak} <span className="text-xs font-normal text-[#787774] dark:text-neutral-400">{isAr ? 'أيام' : 'days'}</span>
            </div>
          </div>

          <div className="p-3.5 flex flex-col items-center text-center">
            <span className="text-[11px] uppercase tracking-wider text-[#787774] dark:text-neutral-400 font-medium">
              {isAr ? 'أفضل سلسلة' : 'Best Streak'}
            </span>
            <div className="text-xl sm:text-2xl font-bold text-[#2F3437] dark:text-white mt-0.5 font-mono">
              {stats.bestStreak} <span className="text-xs font-normal text-[#787774] dark:text-neutral-400">{isAr ? 'أيام' : 'days'}</span>
            </div>
          </div>

          <div className="p-3.5 flex flex-col items-center text-center">
            <span className="text-[11px] uppercase tracking-wider text-[#787774] dark:text-neutral-400 font-medium">
              {isAr ? 'إجمالي الإنجاز' : 'Total Check-ins'}
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              {stats.totalCompletions} <span className="text-xs font-normal text-[#787774] dark:text-neutral-400">{isAr ? 'مرات' : 'times'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#EAE9E6] dark:border-[#2A2C33] bg-white dark:bg-[#18191D] flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('score')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'score'
                ? 'border-[#2F3437] text-[#2F3437] dark:border-white dark:text-white'
                : 'border-transparent text-[#787774] hover:text-[#2F3437] dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={15} />
            <span>{isAr ? 'رسم بياني لتاريخ النقاط' : 'Score History Graph'}</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'calendar'
                ? 'border-[#2F3437] text-[#2F3437] dark:border-white dark:text-white'
                : 'border-transparent text-[#787774] hover:text-[#2F3437] dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Calendar size={15} />
            <span>{isAr ? 'التقويم الشهري والملاحظات' : 'Monthly History & Notes'}</span>
          </button>

          <button
            onClick={() => setActiveTab('weekdays')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'weekdays'
                ? 'border-[#2F3437] text-[#2F3437] dark:border-white dark:text-white'
                : 'border-transparent text-[#787774] hover:text-[#2F3437] dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={15} />
            <span>{isAr ? 'توزيع أيام الأسبوع' : 'Weekday Breakdown'}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#2F3437] text-[#2F3437] dark:border-white dark:text-white'
                : 'border-transparent text-[#787774] hover:text-[#2F3437] dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <FileText size={15} />
            <span>{isAr ? 'تعديل العادة' : 'Edit Habit'}</span>
          </button>
        </div>

        {/* Tab Body Content with strict overscroll containment and dark mode support */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-[#FBFBFA]/60 dark:bg-[#121316] space-y-6 overscroll-contain">
          {/* TAB 1: SCORE GRAPH */}
          {activeTab === 'score' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'قوة العادة عبر الزمن' : 'Habit Strength Over Time'}
                  </h3>
                  <p className="text-xs text-[#787774] dark:text-neutral-400">
                    {isAr ? 'منحنى الزخم الموزون الذي يعكس الاتساق والانضباط التراكمي.' : 'Weighted momentum curve reflecting daily consistency and compounding discipline.'}
                  </p>
                </div>

                <div className="inline-flex bg-neutral-100 dark:bg-[#1E2025] p-1 rounded-xl text-xs font-semibold text-[#787774] dark:text-neutral-300">
                  <button
                    onClick={() => setTimeRange(30)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      timeRange === 30 ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs' : 'hover:text-[#2F3437] dark:hover:text-white'
                    }`}
                  >
                    30 {isAr ? 'يوم' : 'Days'}
                  </button>
                  <button
                    onClick={() => setTimeRange(60)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      timeRange === 60 ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs' : 'hover:text-[#2F3437] dark:hover:text-white'
                    }`}
                  >
                    60 {isAr ? 'يوم' : 'Days'}
                  </button>
                  <button
                    onClick={() => setTimeRange(90)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      timeRange === 90 ? 'bg-white dark:bg-[#282C34] text-[#2F3437] dark:text-white shadow-xs' : 'hover:text-[#2F3437] dark:hover:text-white'
                    }`}
                  >
                    90 {isAr ? 'يوم' : 'Days'}
                  </button>
                </div>
              </div>

              {/* Chart container */}
              <div className="bg-white dark:bg-[#18191D] p-4 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colorTheme.fill} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={colorTheme.fill} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="dayLabel"
                      tick={{ fontSize: 11, fill: '#787774' }}
                      axisLine={{ stroke: '#2A2C33' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#787774' }}
                      axisLine={{ stroke: '#2A2C33' }}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#2F3437] text-white px-3 py-2 rounded-xl text-xs shadow-lg space-y-1">
                              <p className="font-semibold">{data.dayLabel} ({data.date})</p>
                              <p className="text-amber-300 font-mono">Score: {data.score}%</p>
                              <p className="text-[11px] text-neutral-300">
                                {data.completed ? '✓ Completed on this date' : '✗ Missed'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={colorTheme.fill}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-amber-50/60 dark:bg-[#1E2025] border border-amber-200/60 dark:border-amber-800/60 p-4 rounded-2xl flex items-start gap-3 text-xs text-[#787774] dark:text-neutral-300">
                <Sparkles size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#2F3437] dark:text-[#F3F4F6]">
                    {isAr ? 'كيف يتم حساب نقاط العادة؟' : 'How is Habit Score calculated?'}
                  </p>
                  <p className="mt-0.5 leading-relaxed text-[#787774] dark:text-neutral-400">
                    {isAr 
                      ? `بناءً على خوارزميات بناء العادات العلمية، ترتفع نقاطك مع كل إنجاز وتنخفض بلطف عند التفويت مع مراعاة التكرار المستهدف (${habit.targetPerWeek} أيام/أسبوع) ومكافأة السلاسل المتتالية.` 
                      : `Similar to scientific habit tracking algorithms, your score increases every time you complete the habit and gently diminishes when missed. It accounts for target frequency (${habit.targetPerWeek}x/week) and rewards streak consistency.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MONTHLY CALENDAR & DAILY NOTES */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Month Switcher Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#2F3437] dark:text-white">
                    {isAr ? 'مصفوفة السجل الشهري' : 'Monthly History Matrix'}
                  </h3>
                  <p className="text-xs text-[#787774] dark:text-neutral-400">
                    {isAr ? 'انقر على أي يوم للتبديل بين الإنجاز وإضافة الملاحظات اليومية.' : 'Click any day in the month to toggle completion or add daily logs.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] px-2 py-1 rounded-xl shadow-xs">
                  <button
                    onClick={() => setCalendarMonthOffset(calendarMonthOffset - 1)}
                    className="p-1 text-[#787774] hover:text-[#2F3437] dark:text-neutral-400 dark:hover:text-white rounded cursor-pointer"
                    title={isAr ? 'الشهر السابق' : 'Previous Month'}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-[#2F3437] dark:text-white px-2 min-w-[120px] text-center font-mono">
                    {currentMonthData.monthName}
                  </span>
                  <button
                    onClick={() => setCalendarMonthOffset(calendarMonthOffset + 1)}
                    className="p-1 text-[#787774] hover:text-[#2F3437] dark:text-neutral-400 dark:hover:text-white rounded cursor-pointer"
                    title={isAr ? 'الشهر التالي' : 'Next Month'}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Month Grid */}
              <div className="bg-white dark:bg-[#18191D] p-4 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] font-semibold text-[#787774] dark:text-neutral-400 uppercase tracking-wider">
                  <div>{isAr ? 'إثنين' : 'Mon'}</div>
                  <div>{isAr ? 'ثلاثاء' : 'Tue'}</div>
                  <div>{isAr ? 'أربعاء' : 'Wed'}</div>
                  <div>{isAr ? 'خميس' : 'Thu'}</div>
                  <div>{isAr ? 'جمعة' : 'Fri'}</div>
                  <div>{isAr ? 'سبت' : 'Sat'}</div>
                  <div>{isAr ? 'أحد' : 'Sun'}</div>
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {currentMonthData.days.map((d, idx) => {
                    if (!d.isCurrentMonth) {
                      return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
                    }

                    const isDone = Boolean(history[d.iso]);
                    const hasNote = Boolean(notes[d.iso]);
                    const isSelected = selectedCalendarDate === d.iso;

                    return (
                      <div
                        key={d.iso}
                        onClick={() => {
                          setSelectedCalendarDate(d.iso);
                          setNoteInput(notes[d.iso] || '');
                        }}
                        className={`h-10 sm:h-12 rounded-xl border flex flex-col items-center justify-between p-1 cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-amber-500 dark:ring-amber-400 ring-offset-1 border-amber-500 dark:border-amber-400'
                            : 'border-[#EAE9E6] dark:border-[#2A2C33] hover:border-neutral-400 dark:hover:border-neutral-600'
                        } ${
                          isDone
                            ? `${colorTheme.bg} border-${habit.color || 'amber'}-300 font-semibold`
                            : 'bg-white dark:bg-[#1E2025]'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between px-1">
                          <span
                            className={`text-[10px] font-mono ${
                              d.isToday ? 'bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900 px-1 rounded-sm' : 'text-[#787774] dark:text-neutral-400'
                            }`}
                          >
                            {d.dayNumber}
                          </span>
                          {hasNote && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Has daily note" />
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleDate(habit, d.iso);
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                            isDone ? `${colorTheme.badge} text-white` : 'border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <Check size={12} className={isDone ? 'opacity-100' : 'opacity-0'} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Note & Log Editor */}
              <div className="bg-white dark:bg-[#18191D] p-4 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#2F3437] dark:text-white" />
                    <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
                      {isAr ? 'الملاحظات وحالة المزاج لـ ' : 'Daily Log & Mood for '}
                      <span className="font-mono text-amber-600 dark:text-amber-400">{selectedCalendarDate}</span>
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#787774] dark:text-neutral-400 font-medium">
                    {history[selectedCalendarDate] ? (isAr ? '✓ تم إنجازها' : '✓ Completed') : (isAr ? '✗ غير مكتملة' : '✗ Incomplete')}
                  </span>
                </div>

                {/* Mood Picker Strip */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                    {isAr ? 'حالة المزاج والطاقة:' : 'Mood & Energy:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['😊', '⚡', '😴', '🧘', '🔥', '💪', '🌧️'].map((mood) => (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => setSelectedMood(mood)}
                        className={`text-base p-1.5 rounded-xl border transition-all cursor-pointer ${
                          selectedMood === mood
                            ? 'bg-amber-100 dark:bg-amber-950 border-amber-500 scale-110 shadow-3xs'
                            : 'bg-neutral-50 dark:bg-[#1E2025] border-neutral-200 dark:border-neutral-700 hover:scale-105'
                        }`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>

                {freezeExcuses[selectedCalendarDate] && (
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200">
                    <span className="font-bold">❄️ {isAr ? 'عذر التجميد الموثق:' : 'Documented Freeze Excuse:'}</span>{' '}
                    <span>{freezeExcuses[selectedCalendarDate]}</span>
                  </div>
                )}

                <textarea
                  rows={2}
                  placeholder={isAr ? 'سجل ملاحظاتك، خواطرك أو سبب الأداء لهذا اليوم...' : 'Record insights, repetitions, obstacles, or reflection for this day...'}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 bg-white dark:bg-[#1E2025] text-xs text-[#2F3437] dark:text-white placeholder:text-[#787774]/70 focus:outline-none focus:border-amber-500"
                />

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => onToggleDate(habit, selectedCalendarDate)}
                    className="text-xs font-medium text-[#2F3437] dark:text-neutral-300 hover:underline cursor-pointer"
                  >
                    {history[selectedCalendarDate] ? (isAr ? 'إلغاء الإنجاز' : 'Mark as missed') : (isAr ? 'تحديد كمنجزة' : 'Mark as completed')}
                  </button>

                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                  >
                    <Save size={13} />
                    <span>{isSavingNote ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الملاحظة والمزاج' : 'Save Daily Log & Mood')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEEKDAY BREAKDOWN */}
          {activeTab === 'weekdays' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-[#2F3437] dark:text-white">
                  {isAr ? 'الاتساق حسب أيام الأسبوع' : 'Consistency by Day of the Week'}
                </h3>
                <p className="text-xs text-[#787774] dark:text-neutral-400">
                  {isAr ? 'تعرف على أكثر الأيام التي تلتزم فيها لتحديد العوائق الروتينية.' : 'See on which days you are most regular to identify routine obstacles.'}
                </p>
              </div>

              <div className="bg-white dark:bg-[#18191D] p-4 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#787774' }} axisLine={{ stroke: '#2A2C33' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#787774' }} axisLine={{ stroke: '#2A2C33' }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#2F3437] text-white px-3 py-2 rounded-xl text-xs shadow-lg">
                              <p className="font-semibold">{data.dayName}</p>
                              <p className="text-amber-300 font-mono">{data.count} completions ({data.percentage}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {weekdayStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colorTheme.fill} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {weekdayStats.map((d) => (
                  <div key={d.dayName} className="bg-white dark:bg-[#18191D] p-2.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-center">
                    <div className="text-[11px] font-semibold text-[#787774] dark:text-neutral-400">{d.dayName}</div>
                    <div className="text-base font-bold text-[#2F3437] dark:text-white font-mono mt-0.5">{d.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EDIT SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-5 bg-white dark:bg-[#18191D] p-5 sm:p-6 rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs text-start animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-[#2F3437] dark:text-white mb-1">
                  {isAr ? 'اسم العادة' : 'Habit Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 bg-white dark:bg-[#1E2025] text-sm text-[#2F3437] dark:text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Emoji / Icon Picker (Compact) */}
              <EmojiPicker
                selectedEmoji={editIcon}
                onSelectEmoji={setEditIcon}
                lang={lang}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2F3437] dark:text-white mb-1">
                    {isAr ? 'فترة الروتين اليومي' : 'Daily Routine Period'}
                  </label>
                  <select
                    value={editRoutineTime}
                    onChange={(e) => setEditRoutineTime(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 text-xs bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="anytime">🌟 {isAr ? 'أي وقت خلال اليوم' : 'Anytime in the day'}</option>
                    <option value="morning">☀️ {isAr ? 'روتين الصباح (Morning Routine)' : 'Morning Routine'}</option>
                    <option value="afternoon">🌤️ {isAr ? 'روتين بعد الظهر (Afternoon)' : 'Afternoon Routine'}</option>
                    <option value="evening">🌙 {isAr ? 'روتين المساء (Evening Routine)' : 'Evening Routine'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2F3437] dark:text-white mb-1">
                    {isAr ? 'سؤال التحفيز اليومي / التنبيه' : 'Question / Cue (Prompt)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: هل قرأت 20 صفحة اليوم؟' : 'e.g. Did you read 20 pages today?'}
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2F3437] dark:text-white mb-1">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 text-xs bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Health">{isAr ? 'الصحة واللياقة' : 'Health & Fitness'}</option>
                    <option value="Productivity">{isAr ? 'الإنتاجية والعمل' : 'Productivity'}</option>
                    <option value="Business">{isAr ? 'المهنة والمال' : 'Business & Career'}</option>
                    <option value="Personal Growth">{isAr ? 'النمو الشخصي' : 'Personal Growth'}</option>
                    <option value="Mindset">{isAr ? 'التفكير والهدوء' : 'Mindset & Zen'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2F3437] dark:text-white mb-1">
                    {isAr ? 'لون العادة' : 'Color Accent'}
                  </label>
                  <select
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 text-xs bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="amber">Amber Warm</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="blue">Sapphire Blue</option>
                    <option value="purple">Royal Purple</option>
                    <option value="rose">Rose Coral</option>
                    <option value="indigo">Indigo Slate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2F3437] dark:text-white mb-1">
                    {isAr ? 'تاريخ البدء' : 'Start Date (Scheduled)'}
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 text-xs bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none cursor-pointer font-mono"
                  />
                </div>
              </div>

              {/* Target Frequency & Specific Days Configuration */}
              <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#2F3437] dark:text-white">
                      {isAr ? 'تكرار العادة المستهدف' : 'Target Frequency & Days'}
                    </label>
                    <p className="text-[11px] text-[#787774] dark:text-neutral-400">
                      {isAr ? 'اختر عدد مرات بالأسبوع أو حدد أياماً بعينها (مثل الإثنين والأحد)' : 'Choose days per week or select specific target days (e.g., Monday & Sunday)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-[#18191D] p-1 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setFrequencyMode('weekly')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        frequencyMode === 'weekly' ? 'bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900' : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
                      }`}
                    >
                      {isAr ? 'أيام أسبوعياً' : 'Weekly Count'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrequencyMode('specific_days')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        frequencyMode === 'specific_days' ? 'bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900' : 'text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white'
                      }`}
                    >
                      {isAr ? 'أيام مخصصة' : 'Specific Days'}
                    </button>
                  </div>
                </div>

                {frequencyMode === 'weekly' ? (
                  <div>
                    <select
                      value={editTarget}
                      onChange={(e) => setEditTarget(Number(e.target.value))}
                      className="w-full sm:w-64 px-3 py-2 rounded-xl border border-[#D3D1CB] dark:border-neutral-700 text-xs bg-white dark:bg-[#18191D] text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                    >
                      <option value={7}>7 {isAr ? 'أيام / أسبوع (يومياً)' : 'days / week (Daily)'}</option>
                      <option value={6}>6 {isAr ? 'أيام / أسبوع' : 'days / week'}</option>
                      <option value={5}>5 {isAr ? 'أيام / أسبوع (أيام العمل)' : 'days / week (Weekdays)'}</option>
                      <option value={4}>4 {isAr ? 'أيام / أسبوع' : 'days / week'}</option>
                      <option value={3}>3 {isAr ? 'أيام / أسبوع' : 'days / week'}</option>
                      <option value={2}>2 {isAr ? 'أيام / أسبوع' : 'days / week'}</option>
                      <option value={1}>1 {isAr ? 'يوم / أسبوع' : 'day / week'}</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {weekdaysList.map((d) => {
                        const isSelected = selectedDays.includes(d.key);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => toggleDaySelection(d.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-white dark:bg-[#18191D] text-[#787774] dark:text-neutral-300 border-[#D3D1CB] dark:border-neutral-700 hover:border-amber-500'
                            }`}
                          >
                            {isAr ? d.ar : d.en}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] font-medium text-amber-900 dark:text-amber-300">
                      {isAr
                        ? `تم تحديد ${selectedDays.length} أيام (${selectedDays.join(', ')})`
                        : `Selected: ${selectedDays.length} target days (${selectedDays.join(', ')})`}
                    </p>
                  </div>
                )}
              </div>

              {/* Measurable Target & Units Configuration */}
              <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editIsMeasurable}
                      onChange={(e) => setEditIsMeasurable(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-[#2F3437] dark:text-white flex items-center gap-1.5">
                      <Target size={14} className="text-amber-500" />
                      <span>{isAr ? 'نظام العادات الكمية والمستويات (Measurable Units)' : 'Enable Measurable Units / Level System'}</span>
                    </span>
                  </label>
                  {editIsMeasurable && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full font-mono">
                      {isAr ? 'عادة كمية' : 'Quantitative'}
                    </span>
                  )}
                </div>

                {editIsMeasurable && (
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#2F3437] dark:text-neutral-200 mb-1">
                        {isAr ? 'الهدف اليومي المستهدف:' : 'Target per session/day:'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editTargetValue}
                        onChange={(e) => setEditTargetValue(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-[#D3D1CB] dark:border-neutral-700 bg-white dark:bg-[#18191D] text-[#2F3437] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2F3437] dark:text-neutral-200 mb-1">
                        {isAr ? 'الوحدة (مثال: صفحة، دقيقة، كم):' : 'Unit (e.g. pages, minutes, km):'}
                      </label>
                      <input
                        type="text"
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        placeholder="pages"
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#D3D1CB] dark:border-neutral-700 bg-white dark:bg-[#18191D] text-[#2F3437] dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Snooze / Pause Habit Section */}
              <div className="p-4 bg-neutral-50 dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-600" />
                      {isAr ? 'إيقاف مؤقت / تجميد العادة (Snooze / Pause)' : 'Advanced Pause & Snooze Habit'}
                    </h4>
                    <p className="text-[11px] text-[#787774] dark:text-neutral-400 mt-0.5">
                      {isAr
                        ? 'قم بإيقاف العادة مؤقتاً عند السفر أو الراحة دون التأثير على سلاسل الإنجاز السابقة.'
                        : 'Temporarily pause this habit for rest or travel. Streaks and past achievements are preserved.'}
                    </p>
                  </div>

                  {habit.snoozeUntil && habit.snoozeUntil > Date.now() && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (habit.id) {
                          await onUpdateHabit(habit.id, { 
                            snoozeUntil: null as any,
                            pauseStartDate: null as any,
                            pauseEndDate: null as any,
                          });
                          onClose();
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Sparkles size={13} />
                      {isAr ? 'استئناف العادة الآن' : 'Resume Habit Now'}
                    </button>
                  )}
                </div>

                {habit.snoozeUntil && habit.snoozeUntil > Date.now() && (
                  <div className="p-2.5 bg-amber-100/90 dark:bg-amber-950/40 rounded-xl border border-amber-300/80 dark:border-amber-800 text-xs font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                    <Clock size={13} className="text-amber-700" />
                    <span>
                      {isAr
                        ? `العادة متوقفة حالياً حتى: ${new Date(habit.snoozeUntil).toLocaleDateString()}`
                        : `Currently paused until: ${new Date(habit.snoozeUntil).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </span>
                  </div>
                )}

                {/* Pause Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (habit.id) {
                        const endSun = getEndOfCurrentWeekSunday();
                        await onUpdateHabit(habit.id, { 
                          snoozeUntil: endSun,
                          pauseStartDate: new Date().toISOString().split('T')[0],
                          pauseEndDate: new Date(endSun).toISOString().split('T')[0],
                        });
                        onClose();
                      }
                    }}
                    className="px-2.5 py-1.5 bg-white dark:bg-[#18191D] hover:bg-neutral-100 dark:hover:bg-[#202227] text-[#2F3437] dark:text-neutral-200 border border-[#D3D1CB] dark:border-neutral-700 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    {isAr ? 'إيقاف لبقية هذا الأسبوع (حتى الأحد)' : 'Rest of this week (Until Sun)'}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (habit.id) {
                        const range = getFullCurrentWeekRange();
                        await onUpdateHabit(habit.id, { 
                          snoozeUntil: range.endTimestamp,
                          pauseStartDate: range.startIso,
                          pauseEndDate: range.endIso,
                        });
                        onClose();
                      }
                    }}
                    className="px-2.5 py-1.5 bg-white dark:bg-[#18191D] hover:bg-neutral-100 dark:hover:bg-[#202227] text-[#2F3437] dark:text-neutral-200 border border-[#D3D1CB] dark:border-neutral-700 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    {isAr ? 'إيقاف هذا الأسبوع كاملاً (إثنين - أحد)' : 'Full Current Week (Mon - Sun)'}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (habit.id) {
                        const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
                        await onUpdateHabit(habit.id, { 
                          snoozeUntil: nextWeek,
                          pauseStartDate: new Date().toISOString().split('T')[0],
                          pauseEndDate: new Date(nextWeek).toISOString().split('T')[0],
                        });
                        onClose();
                      }
                    }}
                    className="px-2.5 py-1.5 bg-white dark:bg-[#18191D] hover:bg-neutral-100 dark:hover:bg-[#202227] text-[#2F3437] dark:text-neutral-200 border border-[#D3D1CB] dark:border-neutral-700 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    {isAr ? 'إيقاف لمدة أسبوع (7 أيام)' : 'Pause 1 Week'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCustomPausePicker(!showCustomPausePicker)}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    {isAr ? 'تحديد فترة مخصصة (من تاريخ - إلى تاريخ)' : 'Custom Date Range...'}
                  </button>
                </div>

                {/* Custom Date Range Picker form */}
                {showCustomPausePicker && (
                  <div className="p-3 bg-white dark:bg-[#18191D] rounded-xl border border-amber-200 dark:border-neutral-700 mt-2 space-y-2">
                    <div className="text-xs font-bold text-[#2F3437] dark:text-white">
                      {isAr ? 'حدد تاريخ البداية والنهاية للإيقاف المؤقت:' : 'Select custom pause range (From - To):'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#787774] dark:text-neutral-400 mb-0.5">
                          {isAr ? 'من تاريخ' : 'From Date'}
                        </label>
                        <input
                          type="date"
                          value={customPauseStart}
                          onChange={(e) => setCustomPauseStart(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D3D1CB] dark:border-neutral-700 bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#787774] dark:text-neutral-400 mb-0.5">
                          {isAr ? 'إلى تاريخ (حتى نهاية اليوم)' : 'Until Date (End of day)'}
                        </label>
                        <input
                          type="date"
                          value={customPauseEnd}
                          onChange={(e) => setCustomPauseEnd(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D3D1CB] dark:border-neutral-700 bg-white dark:bg-[#1E2025] text-neutral-900 dark:text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCustomPausePicker(false)}
                        className="px-3 py-1 text-xs text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white font-semibold cursor-pointer"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        disabled={!customPauseEnd}
                        onClick={async () => {
                          if (habit.id && customPauseEnd) {
                            const [y, m, d] = customPauseEnd.split('-').map(Number);
                            const endTimestamp = new Date(y, m - 1, d, 23, 59, 59).getTime();
                            await onUpdateHabit(habit.id, {
                              snoozeUntil: endTimestamp,
                              pauseStartDate: customPauseStart,
                              pauseEndDate: customPauseEnd,
                            });
                            setShowCustomPausePicker(false);
                            onClose();
                          }
                        }}
                        className="px-3.5 py-1.5 bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        {isAr ? 'تطبيق فترة الإيقاف' : 'Apply Pause Range'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[#EAE9E6] dark:border-[#2A2C33]">
                <button
                  type="button"
                  onClick={() => {
                    if (habit.id && confirm(isAr ? `أرشفة العادة "${habit.title}"؟ ستبقى في السجلات التاريخية.` : `Archive habit "${habit.title}"? It will disappear from active views but remain in historical logs.`)) {
                      onDeleteHabit(habit.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>{isAr ? 'أرشفة العادة' : 'Archive Habit'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold hover:bg-black dark:hover:bg-neutral-100 transition-colors cursor-pointer shadow-xs"
                >
                  {isSavingSettings ? (isAr ? 'جاري الحفظ...' : 'Saving Changes...') : (isAr ? 'حفظ التعديلات' : 'Save Updates')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#EAE9E6] dark:border-[#2A2C33] bg-[#FBFBFA] dark:bg-[#151619] flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-[#262830] dark:hover:bg-[#30333C] text-[#2F3437] dark:text-[#F3F4F6] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
