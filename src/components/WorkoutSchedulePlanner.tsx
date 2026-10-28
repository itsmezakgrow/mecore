import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Dumbbell,
  Play,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckSquare,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ScheduledWorkoutItem, HabitItem, WorkoutRoutineTemplate } from '../types';

interface WorkoutSchedulePlannerProps {
  scheduledWorkouts: ScheduledWorkoutItem[];
  habits: HabitItem[];
  linkedHabitId?: string | null;
  onAddScheduledWorkout: (item: Omit<ScheduledWorkoutItem, 'id'>) => Promise<any>;
  onToggleScheduledWorkout: (item: ScheduledWorkoutItem) => Promise<any>;
  onDeleteScheduledWorkout: (id: string) => Promise<any>;
  onStartRoutine: (template: WorkoutRoutineTemplate) => void;
  onSetLinkedHabit: (habitId: string) => void;
  isDark?: boolean;
  lang?: 'en' | 'ar';
}

const DEFAULT_PRESET_TEMPLATES: WorkoutRoutineTemplate[] = [
  {
    id: 'routine-a-fullbody',
    name: 'Routine A (Full Body)',
    category: 'Full Body',
    description: 'Leg Press, Flat DB Bench, Lat Pulldown, Shoulder Press, Hammer Curls',
    exercises: [
      { name: 'Leg Press', targetSets: 3, targetReps: 12, defaultWeight: '60' },
      { name: 'Flat Dumbbell Bench Press', targetSets: 3, targetReps: 10, defaultWeight: '20' },
      { name: 'Wide Grip Lat Pulldown', targetSets: 3, targetReps: 12, defaultWeight: '45' },
      { name: 'Seated Dumbbell Shoulder Press', targetSets: 3, targetReps: 10, defaultWeight: '14' },
      { name: 'Cable Rope Hammer Curls', targetSets: 3, targetReps: 12, defaultWeight: '18' },
    ]
  },
  {
    id: 'routine-b-fullbody',
    name: 'Routine B (Full Body)',
    category: 'Full Body',
    description: 'Goblet Squat, Seated Cable Row, Incline DB Bench, Lateral Raises, Tricep Rope Pushdown',
    exercises: [
      { name: 'Goblet Squat', targetSets: 3, targetReps: 12, defaultWeight: '24' },
      { name: 'Seated Cable Row', targetSets: 3, targetReps: 12, defaultWeight: '45' },
      { name: 'Incline Dumbbell Bench Press', targetSets: 3, targetReps: 10, defaultWeight: '18' },
      { name: 'Dumbbell Lateral Raises', targetSets: 3, targetReps: 15, defaultWeight: '8' },
      { name: 'Tricep Rope Pushdown', targetSets: 3, targetReps: 12, defaultWeight: '20' },
    ]
  }
];

export const WorkoutSchedulePlanner: React.FC<WorkoutSchedulePlannerProps> = ({
  scheduledWorkouts = [],
  habits = [],
  linkedHabitId,
  onAddScheduledWorkout,
  onToggleScheduledWorkout,
  onDeleteScheduledWorkout,
  onStartRoutine,
  onSetLinkedHabit,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';

  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  const [showAddModalForDate, setShowAddModalForDate] = useState<string | null>(null);
  const [selectedRoutineForAdd, setSelectedRoutineForAdd] = useState<'routine-a-fullbody' | 'routine-b-fullbody' | 'custom'>('routine-a-fullbody');
  const [customRoutineName, setCustomRoutineName] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('09:00 AM');

  // Compute 7 days of the selected week (Sunday to Saturday, as shown in Notion screenshot)
  const weekDays = useMemo(() => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    // Align to Sunday of current week
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + currentWeekOffset * 7);

    const days: { dateObj: Date; iso: string; dayNumber: number; dayNameEn: string; dayNameAr: string; isToday: boolean }[] = [];
    const enDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const arDayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        dateObj: d,
        iso,
        dayNumber: d.getDate(),
        dayNameEn: enDayNames[i],
        dayNameAr: arDayNames[i],
        isToday: iso === todayIso
      });
    }

    return days;
  }, [currentWeekOffset]);

  // Month & Year display label
  const headerMonthLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const midDate = weekDays[3].dateObj;
    return midDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
  }, [weekDays, isAr]);

  // Handle scheduling a new routine
  const handleScheduleSubmit = async () => {
    if (!showAddModalForDate) return;
    let name = '';
    let category = 'Full Body';

    if (selectedRoutineForAdd === 'routine-a-fullbody') {
      name = 'Routine A (Full Body)';
      category = 'Full Body';
    } else if (selectedRoutineForAdd === 'routine-b-fullbody') {
      name = 'Routine B (Full Body)';
      category = 'Full Body';
    } else {
      name = customRoutineName.trim() || (isAr ? 'حصة مخصصة' : 'Custom Session');
      category = 'Custom';
    }

    const item: Omit<ScheduledWorkoutItem, 'id'> = {
      date: showAddModalForDate,
      routineId: selectedRoutineForAdd,
      routineName: name,
      category,
      time: scheduledTime || '09:00 AM',
      completed: false,
      linkedHabitId: linkedHabitId || undefined,
      createdAt: Date.now()
    };

    try {
      await onAddScheduledWorkout(item);
      setShowAddModalForDate(null);
      setCustomRoutineName('');
    } catch (e) {
      console.error('Failed to schedule workout:', e);
    }
  };

  // Launch routine directly in Active Logger
  const handleLaunchRoutine = (item: ScheduledWorkoutItem) => {
    const preset = DEFAULT_PRESET_TEMPLATES.find(p => p.id === item.routineId);
    if (preset) {
      onStartRoutine(preset);
    } else {
      onStartRoutine({
        id: 'custom-' + Date.now(),
        name: item.routineName,
        category: 'Custom',
        exercises: [
          { name: 'Leg Press', targetSets: 3, targetReps: 12, defaultWeight: '60' },
          { name: 'Flat Dumbbell Bench Press', targetSets: 3, targetReps: 10, defaultWeight: '20' }
        ]
      });
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Bar: Notion-Style Header & Controls (Adaptive Light/Dark Mode) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18191D] text-slate-900 dark:text-white border border-slate-200/80 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {isAr ? 'جدول ومخطط الحصص الأسبوعي' : 'Workout Schedule Planner'}
              </h2>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-slate-200 dark:border-neutral-700">
                NOTION VIEW
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {isAr
                ? 'تخطيط وتتبع حصص الأسبوع كبطاقات. وضع علامة صح يربط الإنجاز تلقائياً مع العادات.'
                : 'Plan your weekly routines. Checking a session syncs atomically with your Gym Habit.'}
            </p>
          </div>
        </div>

        {/* Week Navigation & Today Jump */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-neutral-300 px-2.5 py-1 bg-slate-100 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
            {headerMonthLabel}
          </span>

          <div className="flex items-center bg-slate-100 dark:bg-neutral-900 rounded-xl p-1 border border-slate-200 dark:border-neutral-800 text-xs">
            <button
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title={isAr ? 'الأسبوع السابق' : 'Previous Week'}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentWeekOffset(0)}
              className="px-2.5 py-1 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
            >
              {isAr ? 'اليوم' : 'Today'}
            </button>
            <button
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title={isAr ? 'الأسبوع التالي' : 'Next Week'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Linked Habit Quick Selector Bar (Adaptive & Clear Text) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 text-slate-800 dark:text-neutral-200">
          <Flame size={16} className="text-amber-500 shrink-0" />
          <span className="font-bold">{isAr ? 'العادة المرتبطة بالجم (Gym Habit Link):' : 'Linked Gym Habit:'}</span>
          <span className="text-slate-400 dark:text-neutral-400 text-[11px]">
            {isAr ? '(التحديد هنا يربط علامة الصح أوتوماتيكياً)' : '(Checking off a workout updates this habit)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={linkedHabitId || ''}
            onChange={(e) => onSetLinkedHabit(e.target.value)}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
          >
            <option value="" className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">
              {isAr ? '— اختر عادة للربط —' : '— Select Linked Habit —'}
            </option>
            {habits.map((h) => (
              <option key={h.id} value={h.id} className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white">
                {h.icon || '🏋️'} {h.title} {h.streak ? `(🔥 ${h.streak}d streak)` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 7-DAY NOTION SCHEDULE BOARD GRID (Adaptive Backgrounds & Borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayItems = scheduledWorkouts.filter(w => w.date === day.iso);

          return (
            <div
              key={day.iso}
              className={`rounded-2xl flex flex-col min-h-[300px] transition-all border ${
                day.isToday
                  ? 'bg-white dark:bg-[#18191E] border-emerald-500 dark:border-emerald-500/50 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/70 dark:bg-[#15161A] border-slate-200/80 dark:border-neutral-800/70 hover:border-slate-300 dark:hover:border-neutral-700'
              }`}
            >
              {/* Day Header */}
              <div className="p-3 border-b border-slate-200/70 dark:border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-neutral-400">
                    {isAr ? day.dayNameAr : day.dayNameEn}
                  </span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-xs ${
                      day.isToday
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-800 dark:text-neutral-300 bg-slate-200/60 dark:bg-neutral-800'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModalForDate(day.iso)}
                  className="p-1 rounded-lg text-slate-400 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title={isAr ? 'إضافة حصة تدريبية لهذا اليوم' : 'Schedule workout for this day'}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Day Cards Stack */}
              <div className="p-2 space-y-2 flex-1 flex flex-col">
                {dayItems.length === 0 ? (
                  <div
                    onClick={() => setShowAddModalForDate(day.iso)}
                    className="flex-1 flex flex-col items-center justify-center text-center p-3 rounded-xl border border-dashed border-slate-300 dark:border-neutral-800 hover:border-emerald-400 text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300 cursor-pointer transition-colors"
                  >
                    <span className="text-[11px] font-medium">{isAr ? '+ خطط حصة' : '+ Add session'}</span>
                  </div>
                ) : (
                  dayItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all text-left space-y-2.5 ${
                        item.completed
                          ? 'bg-emerald-50 dark:bg-[#1C2420] border-emerald-300 dark:border-emerald-600/50 text-emerald-900 dark:text-emerald-200'
                          : 'bg-white dark:bg-[#22242A] border-slate-200 dark:border-neutral-700/80 hover:border-slate-300 dark:hover:border-neutral-600 text-slate-900 dark:text-white shadow-xs'
                      }`}
                    >
                      {/* Title & Routine Badge */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Clock size={13} className={item.completed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-neutral-400'} />
                          <h4 className="text-xs font-black truncate">
                            {item.routineName}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => item.id && onDeleteScheduledWorkout(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                          title={isAr ? 'حذف من المخطط' : 'Delete scheduled workout'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Checkbox for Completion (Notion style) */}
                      <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => onToggleScheduledWorkout(item)}
                          className="w-4 h-4 rounded text-emerald-600 bg-slate-100 dark:bg-neutral-900 border-slate-300 dark:border-neutral-600 focus:ring-0 cursor-pointer"
                        />
                        <span
                          className={`text-xs font-bold transition-colors ${
                            item.completed ? 'line-through text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-neutral-300 group-hover:text-emerald-600 dark:group-hover:text-white'
                          }`}
                        >
                          {isAr ? 'تم الإنجاز (Done)' : 'Check (Done)'}
                        </span>
                      </label>

                      {/* Time / Date label */}
                      <div className="text-[10px] font-mono text-slate-400 dark:text-neutral-400 truncate">
                        {item.time || '09:00 AM'}
                      </div>

                      {/* Launch Button */}
                      <button
                        type="button"
                        onClick={() => handleLaunchRoutine(item)}
                        className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          item.completed
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/40'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        }`}
                      >
                        <Play size={10} className="fill-current" />
                        <span>{item.completed ? (isAr ? 'تعديل أو مراجعة' : 'Review Logs') : (isAr ? 'ابدأ التمرين الآن' : 'Start Session')}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SCHEDULE MODAL (When clicking + on a day) */}
      {showAddModalForDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#18191D] text-slate-900 dark:text-white rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <CalendarIcon size={18} className="text-emerald-500" />
                <h3 className="text-base font-black">
                  {isAr ? 'جدولة حصة تدريبية' : 'Schedule Workout'}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {showAddModalForDate}
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                  {isAr ? 'اختر الروتين:' : 'Select Routine:'}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRoutineForAdd('routine-a-fullbody')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedRoutineForAdd === 'routine-a-fullbody'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black'
                        : 'bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>Routine A (Full Body)</span>
                    <span className="text-[10px] font-mono text-slate-400">5 exercises</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRoutineForAdd('routine-b-fullbody')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedRoutineForAdd === 'routine-b-fullbody'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-300 font-black'
                        : 'bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>Routine B (Full Body)</span>
                    <span className="text-[10px] font-mono text-slate-400">5 exercises</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRoutineForAdd('custom')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedRoutineForAdd === 'custom'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black'
                        : 'bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>{isAr ? 'حصة مخصصة' : 'Custom Session'}</span>
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {selectedRoutineForAdd === 'custom' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                    {isAr ? 'اسم الروتين المخصص:' : 'Custom Routine Name:'}
                  </label>
                  <input
                    type="text"
                    value={customRoutineName}
                    onChange={(e) => setCustomRoutineName(e.target.value)}
                    placeholder={isAr ? 'مثال: Calisthenics Skills' : 'e.g., Calisthenics Skills'}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                  {isAr ? 'وقت الحصة المبرمج:' : 'Scheduled Time:'}
                </label>
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleScheduleSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer text-center"
              >
                {isAr ? 'إضافة للجدول' : 'Add to Schedule'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModalForDate(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
