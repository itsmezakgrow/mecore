import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Flame, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Award, 
  Search, 
  Filter, 
  BarChart2, 
  Calendar, 
  Grid, 
  Download, 
  HelpCircle, 
  Clock, 
  Layers, 
  MoreHorizontal, 
  Edit2, 
  CheckCircle2, 
  CheckCheck, 
  CalendarDays, 
  Snowflake, 
  GripVertical, 
  Target, 
  Minus, 
  Sliders, 
  ChevronUp, 
  ChevronDown,
  Sun,
  Sunrise,
  Sunset,
  Trophy,
  Volume2,
  VolumeX,
  Shield,
  Moon,
  Archive,
  Dumbbell,
  ArrowRight
} from 'lucide-react';
import { HabitItem, HabitRoutineTime, RewardItem, DailySleepLog, SleepScheduleConfig, WorkoutSession } from '../types';
import { SleepWakeTracker } from './SleepWakeTracker';
import { HabitDetailModal } from './HabitDetailModal';
import { ConfirmModal } from './ConfirmModal';
import { BulkActionToolbar } from './BulkActionToolbar';
import { BulkEditModal } from './BulkEditModal';
import { QuickLevelLoggerModal } from './QuickLevelLoggerModal';
import { StreakFreezeModal } from './StreakFreezeModal';
import { RewardStoreModal } from './RewardStoreModal';
import { EmojiPicker } from './EmojiPicker';
import { BulkExcuseLoggerModal } from './BulkExcuseLoggerModal';
import { calculateHabitStats, calculateHabitScoreHistory } from '../utils/habitAnalytics';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface HabitTrackerProps {
  habits: HabitItem[];
  rewards?: RewardItem[];
  sleepLogs?: DailySleepLog[];
  sleepConfig?: SleepScheduleConfig | null;
  workouts?: WorkoutSession[];
  onNavigateModule?: (module: string) => void;
  onAddHabit: (habit: Omit<HabitItem, 'id'>) => Promise<any>;
  onToggleHabit: (habit: HabitItem, dateKey: string) => Promise<any>;
  onUpdateHabit: (id: string, updates: Partial<HabitItem>) => Promise<any>;
  onDeleteHabit: (id: string) => Promise<any>;
  onReorderHabits?: (habitIds: string[]) => Promise<any>;
  onUpdateDailyValue?: (habit: HabitItem, dateKey: string, value: number) => Promise<any>;
  onToggleFreeze?: (habit: HabitItem, dateKey: string) => Promise<any>;
  onApplyFreezeExcuse?: (habit: HabitItem, dateKey: string, excuse: string) => Promise<any>;
  onRemoveFreeze?: (habit: HabitItem, dateKey: string) => Promise<any>;
  onBulkUpdateHabits?: (ids: string[], updates: Partial<HabitItem>) => Promise<any>;
  onBulkDeleteHabits?: (ids: string[]) => Promise<any>;
  onOpenExportModal?: () => void;
  onAddReward?: (reward: Omit<RewardItem, 'id'>) => Promise<any>;
  onClaimReward?: (rewardId: string) => Promise<any>;
  onDeleteReward?: (rewardId: string) => Promise<any>;
  onSaveSleepLog?: (log: Omit<DailySleepLog, 'id'>) => Promise<any>;
  onSaveSleepConfig?: (config: Partial<SleepScheduleConfig>) => Promise<any>;
  onDeleteSleepLog?: (id: string) => Promise<any>;
  lang?: 'en' | 'ar';
}

export const getArSingleLetterHelper = (dayNum: number): string => {
  switch (dayNum) {
    case 0: return 'ح'; // الأحد
    case 1: return 'ن'; // الإثنين
    case 2: return 'ث'; // الثلاثاء
    case 3: return 'ر'; // الأربعاء
    case 4: return 'خ'; // الخميس
    case 5: return 'ج'; // الجمعة
    case 6: return 'س'; // السبت
    default: return '';
  }
};

interface HabitCardItemProps {
  habit: HabitItem;
  index: number;
  totalCount: number;
  currentDays: { date: Date; iso: string; dayName: string; dayNumber: number; isToday: boolean }[];
  todayIso: string;
  isSelected: boolean;
  isSelectMode: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (habit: HabitItem) => void;
  onToggleDate: (habit: HabitItem, iso: string) => void;
  onOpenLevelLogger: (habit: HabitItem, dateKey: string) => void;
  onDelete: (habit: HabitItem) => void;
  onArchive?: (habit: HabitItem) => void;
  onToggleFreeze?: (habit: HabitItem, dateKey: string) => Promise<any>;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onDragStartRow?: (e: React.DragEvent, index: number) => void;
  onDragOverRow?: (e: React.DragEvent, index: number) => void;
  onDropRow?: (e: React.DragEvent, index: number) => void;
  onDragEndRow?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  isAr: boolean;
  getCategoryLabel: (cat: string) => string;
  getColorClasses: (col?: string) => { active: string; text: string; badge: string };
  getArSingleLetter?: (d: number) => string;
}

const MobileHabitCardItem: React.FC<HabitCardItemProps> = ({
  habit,
  index,
  totalCount,
  currentDays,
  todayIso,
  isSelected,
  isSelectMode,
  onToggleSelect,
  onOpenDetail,
  onToggleDate,
  onOpenLevelLogger,
  onDelete,
  onArchive,
  onToggleFreeze,
  onMoveUp,
  onMoveDown,
  onDragStartRow,
  onDragOverRow,
  onDropRow,
  onDragEndRow,
  isDragging,
  isDragOver,
  isAr,
  getCategoryLabel,
  getColorClasses,
  getArSingleLetter = getArSingleLetterHelper,
}) => {
  const habitStats = calculateHabitStats(habit);
  const colorTheme = getColorClasses(habit.color || 'amber');
  const completedCount = currentDays.filter((d) => habit.history && habit.history[d.iso]).length;

  const getFreezesUsedThisWeek = () => {
    let count = 0;
    const currentWeekIsoDays = currentDays.map(d => d.iso);
    if (habit.freezes) {
      Object.keys(habit.freezes).forEach(dateStr => {
        if (currentWeekIsoDays.includes(dateStr) && habit.freezes[dateStr]) {
          count++;
        }
      });
    }
    return count;
  };

  const freezesUsedThisWeek = getFreezesUsedThisWeek();

  const isStartsInFuture = Boolean(habit.startDate && habit.startDate > todayIso);
  const isSnoozed = Boolean(habit.snoozeUntil && habit.snoozeUntil > Date.now());

  const targetVal = habit.targetValue || 10;
  const todayVal = habit.dailyValues?.[todayIso] || (habit.history?.[todayIso] ? targetVal : 0);
  const todayPct = Math.min(100, Math.round((todayVal / targetVal) * 100));
  const isDoneToday = Boolean(habit.history && habit.history[todayIso]);

  return (
    <div
      onDragOver={(e) => onDragOverRow && onDragOverRow(e, index)}
      onDrop={(e) => onDropRow && onDropRow(e, index)}
      className={`bg-white dark:bg-neutral-900 p-4 rounded-2xl border shadow-xs space-y-3 transition-all select-none touch-manipulation ${
        isSelected ? 'border-neutral-900 dark:border-white bg-amber-50/40 dark:bg-amber-950/20' : 'border-neutral-200 dark:border-neutral-800'
      } ${
        isDragging ? 'opacity-40 border-2 border-dashed border-indigo-400' : ''
      } ${isDragOver ? 'border-t-2 border-indigo-500 bg-indigo-50/20' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {/* Drag handle */}
          <div 
            draggable={true}
            onDragStart={(e) => onDragStartRow && onDragStartRow(e, index)}
            onDragEnd={onDragEndRow}
            className="cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 p-1 rounded shrink-0 mt-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={isAr ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
          >
            <GripVertical size={16} />
          </div>

          {isSelectMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (habit.id) onToggleSelect(habit.id);
              }}
              className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'border-2 border-neutral-300 dark:border-neutral-600 hover:border-neutral-500'
              }`}
            >
              {isSelected && <Check size={12} />}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div
              onClick={() => onOpenDetail(habit)}
              className="font-bold text-sm text-neutral-900 dark:text-white break-words cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 flex-wrap"
            >
              <span className="text-base p-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">{habit.icon || '🔥'}</span>
              <span>{habit.title}</span>
              {(habit as any).createdBy === 'Atlas' && (
                <span className="inline-flex items-center bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[8px] font-bold px-1 py-0.2 rounded-sm font-mono shrink-0 uppercase">
                  Atlas
                </span>
              )}
            </div>

            {/* Badges and metadata */}
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-600 dark:text-neutral-400 flex-wrap">
              <span className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${colorTheme.badge}`}>
                {getCategoryLabel(habit.category)}
              </span>

              {habit.routineTime && habit.routineTime !== 'anytime' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 text-[10px] font-bold font-mono">
                  {habit.routineTime === 'morning' ? '☀️ ' + (isAr ? 'صباحي' : 'Morning') : habit.routineTime === 'afternoon' ? '🌤️ ' + (isAr ? 'بعد الظهر' : 'Afternoon') : '🌙 ' + (isAr ? 'مسائي' : 'Evening')}
                </span>
              )}

              {/* Measurable Badge */}
              {habit.isMeasurable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLevelLogger(habit, todayIso);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold font-mono cursor-pointer hover:scale-105 transition-transform"
                  title={isAr ? 'انقر لتسجيل المستوى الجزئي' : 'Click to log partial level'}
                >
                  <Target size={10} className="text-indigo-500" />
                  <span>
                    {todayVal}/{targetVal} {habit.unit || 'units'} ({todayPct}%)
                  </span>
                </button>
              )}

              {isStartsInFuture && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-medium font-mono">
                  <CalendarDays size={10} />
                  {isAr ? `تبدأ: ${habit.startDate}` : `Starts: ${habit.startDate}`}
                </span>
              )}

              {isSnoozed && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-medium font-mono">
                  <Clock size={10} />
                  {isAr ? 'متوقفة مؤقتاً' : 'Paused'}
                </span>
              )}

              <span>{isAr ? `${completedCount}/7 هذا الأسبوع` : `${completedCount}/7 this week`}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800 font-mono text-[11px] font-bold text-amber-800 dark:text-amber-200">
            <Flame size={11} className="text-amber-500 fill-amber-500" />
            {habitStats.currentStreak}{isAr ? ' يوم' : 'd'}
          </span>
          {onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(habit);
              }}
              className="p-1.5 text-neutral-400 hover:text-amber-600 transition-colors cursor-pointer"
              title={isAr ? 'أرشفة العادة' : 'Archive habit'}
            >
              <Archive size={13} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(habit);
            }}
            className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
            title={isAr ? 'حذف العادة' : 'Delete habit'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 7-Day Matrix Row: Zero horizontal scroll required on mobile cards */}
      <div className="grid grid-cols-7 gap-1 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        {currentDays.map((day) => {
          const isDone = Boolean(habit.history && habit.history[day.iso]);
          const isFrozen = Boolean(habit.freezes && habit.freezes[day.iso]);
          const dayVal = habit.dailyValues?.[day.iso] || (isDone ? targetVal : 0);
          const dayPct = Math.min(100, Math.round((dayVal / targetVal) * 100));
          const dayOfWeek = day.date.getDay();
          const isTargetDay = habit.frequencyType === 'specific_days' && habit.targetDays
            ? habit.targetDays.includes(dayOfWeek)
            : true;
          const isBeforeStart = habit.startDate && day.iso < habit.startDate;

          return (
            <div 
              key={day.iso} 
              className={`flex flex-col items-center gap-1 p-0.5 rounded-xl transition-all ${
                day.isToday ? 'bg-amber-100/40 dark:bg-amber-950/30 ring-1 ring-amber-400/80' : ''
              }`}
            >
              <span className={`text-[10px] font-bold uppercase ${day.isToday ? 'text-amber-700 dark:text-amber-400 font-black' : isTargetDay ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-300 dark:text-neutral-700'}`}>
                {isAr ? getArSingleLetter(day.date.getDay()) : day.dayName.slice(0, 1)}
              </span>
              <span className={`text-[9px] font-mono ${day.isToday ? 'font-black text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                {day.dayNumber}
              </span>
              <div className="relative w-full aspect-square max-w-[36px] group/cell">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDate(habit, day.iso);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (habit.isMeasurable) {
                      onOpenLevelLogger(habit, day.iso);
                    }
                  }}
                  disabled={isFrozen}
                  className={`w-full h-full rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isDone
                      ? `${colorTheme.active} text-white shadow-xs`
                      : habit.isMeasurable && dayVal > 0
                      ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : isFrozen
                      ? 'bg-blue-500 text-white shadow-xs border border-blue-400'
                      : isBeforeStart
                      ? 'border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-300'
                      : day.isToday
                      ? 'border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-transparent'
                      : isTargetDay
                      ? 'border border-neutral-300 dark:border-neutral-700 text-transparent hover:border-neutral-500 dark:hover:border-neutral-400'
                      : 'border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/40 text-transparent opacity-60'
                  }`}
                  title={`${day.dayName} (${day.iso})${habit.isMeasurable ? ` - ${dayVal}/${targetVal} ${habit.unit || 'units'} (Right-click or long press to adjust level)` : ''}`}
                >
                  {isDone ? (
                    <Check size={14} className="opacity-100" />
                  ) : habit.isMeasurable && dayVal > 0 ? (
                    <span className="text-[9px] font-black font-mono">{dayPct}%</span>
                  ) : isFrozen ? (
                    <Snowflake size={14} className="opacity-100 animate-pulse" />
                  ) : (
                    <span className="opacity-0">✓</span>
                  )}
                </button>

                {/* Micro Freeze button overlay */}
                {!isDone && onToggleFreeze && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isFrozen && freezesUsedThisWeek >= 1) {
                        alert(isAr ? 'يمكنك استخدام تجميد سلسلة واحد فقط في الأسبوع لتبقي تتبع العادات واقعياً.' : 'Limit reached: You can only apply 1 streak freeze per week for this habit.');
                        return;
                      }
                      onToggleFreeze(habit, day.iso);
                    }}
                    className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border transition-all ${
                      isFrozen
                        ? 'bg-blue-600 text-white border-blue-500 scale-100'
                        : 'bg-white dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-blue-500 border-neutral-300 opacity-0 group-hover/cell:opacity-100 scale-90 hover:scale-100'
                    }`}
                    title={isFrozen ? (isAr ? 'إلغاء التجميد' : 'Remove freeze') : (isAr ? 'تجميد اليوم' : 'Apply Streak Freeze')}
                  >
                    <Snowflake size={8} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DesktopHabitRowItem: React.FC<HabitCardItemProps> = ({
  habit,
  index,
  totalCount,
  currentDays,
  todayIso,
  isSelected,
  isSelectMode,
  onToggleSelect,
  onOpenDetail,
  onToggleDate,
  onOpenLevelLogger,
  onDelete,
  onArchive,
  onToggleFreeze,
  onMoveUp,
  onMoveDown,
  onDragStartRow,
  onDragOverRow,
  onDropRow,
  onDragEndRow,
  isDragging,
  isDragOver,
  isAr,
  getCategoryLabel,
  getColorClasses,
}) => {
  const completedDaysInView = currentDays.filter(
    (d) => habit.history && habit.history[d.iso]
  ).length;
  const habitStats = calculateHabitStats(habit);
  const colorTheme = getColorClasses(habit.color || 'amber');

  const getFreezesUsedThisWeek = () => {
    let count = 0;
    const currentWeekIsoDays = currentDays.map(d => d.iso);
    if (habit.freezes) {
      Object.keys(habit.freezes).forEach(dateStr => {
        if (currentWeekIsoDays.includes(dateStr) && habit.freezes[dateStr]) {
          count++;
        }
      });
    }
    return count;
  };

  const freezesUsedThisWeek = getFreezesUsedThisWeek();

  const isStartsInFuture = Boolean(habit.startDate && habit.startDate > todayIso);
  const isSnoozed = Boolean(habit.snoozeUntil && habit.snoozeUntil > Date.now());

  const targetVal = habit.targetValue || 10;
  const todayVal = habit.dailyValues?.[todayIso] || (habit.history?.[todayIso] ? targetVal : 0);
  const todayPct = Math.min(100, Math.round((todayVal / targetVal) * 100));

  return (
    <tr
      onDragOver={(e) => onDragOverRow && onDragOverRow(e, index)}
      onDrop={(e) => onDropRow && onDropRow(e, index)}
      className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-800/60 transition-colors group select-none relative ${
        isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
      } ${isDragging ? 'opacity-40 bg-indigo-50/30' : ''} ${
        isDragOver ? 'border-t-2 border-indigo-500 bg-indigo-50/20' : ''
      }`}
    >
      <td className={`py-3.5 px-3 sm:px-4 ${isAr ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center gap-2.5">
          {/* Drag handle */}
          <div 
            draggable={true}
            onDragStart={(e) => onDragStartRow && onDragStartRow(e, index)}
            onDragEnd={onDragEndRow}
            className="cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 p-1 rounded transition-colors shrink-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title={isAr ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
          >
            <GripVertical size={16} />
          </div>

          {isSelectMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (habit.id) onToggleSelect(habit.id);
              }}
              className={`w-4 h-4 rounded flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'border border-neutral-300 dark:border-neutral-600 hover:border-neutral-500'
              }`}
            >
              {isSelected && <Check size={11} />}
            </button>
          )}

          <div
            onClick={() => onOpenDetail(habit)}
            className="font-bold text-sm text-neutral-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 flex-wrap"
          >
            <span className="text-base p-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800">{habit.icon || '🔥'}</span>
            <span>{habit.title}</span>
            {(habit as any).createdBy === 'Atlas' && (
              <span className="inline-flex items-center bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[8px] font-bold px-1 py-0.2 rounded-sm font-mono shrink-0 uppercase">
                Atlas
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-600 dark:text-neutral-400 pl-6 rtl:pl-0 rtl:pr-6 flex-wrap">
          <span className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${colorTheme.badge}`}>
            {getCategoryLabel(habit.category)}
          </span>

          {habit.routineTime && habit.routineTime !== 'anytime' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 text-[10px] font-bold font-mono">
              {habit.routineTime === 'morning' ? '☀️ ' + (isAr ? 'صباحي' : 'Morning') : habit.routineTime === 'afternoon' ? '🌤️ ' + (isAr ? 'بعد الظهر' : 'Afternoon') : '🌙 ' + (isAr ? 'مسائي' : 'Evening')}
            </span>
          )}

          {/* Measurable Progress Badge */}
          {habit.isMeasurable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLevelLogger(habit, todayIso);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold font-mono cursor-pointer hover:scale-105 transition-transform"
              title={isAr ? 'انقر لتسجيل المستوى الجزئي' : 'Click to log partial level'}
            >
              <Target size={10} className="text-indigo-500" />
              <span>
                {todayVal}/{targetVal} {habit.unit || 'units'} ({todayPct}%)
              </span>
            </button>
          )}

          {isStartsInFuture && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-mono">
              <CalendarDays size={10} />
              {isAr ? `تبدأ: ${habit.startDate}` : `Starts: ${habit.startDate}`}
            </span>
          )}

          {isSnoozed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-mono">
              <Clock size={10} />
              {isAr ? 'متوقفة مؤقتاً' : 'Paused'}
            </span>
          )}

          <span>{isAr ? `${completedDaysInView}/7 تم إنجازها` : `${completedDaysInView}/7 checked`}</span>
        </div>
      </td>

      <td className="py-3 px-2 text-center">
        <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800 font-mono text-xs font-semibold text-amber-800 dark:text-amber-200">
          <Flame size={11} className="text-amber-500 fill-amber-500" />
          {habitStats.currentStreak}{isAr ? 'ي' : 'd'}
        </div>
      </td>

      {currentDays.map((day) => {
        const isDone = Boolean(habit.history && habit.history[day.iso]);
        const isFrozen = Boolean(habit.freezes && habit.freezes[day.iso]);
        const dayVal = habit.dailyValues?.[day.iso] || (isDone ? targetVal : 0);
        const dayPct = Math.min(100, Math.round((dayVal / targetVal) * 100));
        const dayOfWeek = day.date.getDay();
        const isTargetDay = habit.frequencyType === 'specific_days' && habit.targetDays
          ? habit.targetDays.includes(dayOfWeek)
          : true;
        const isBeforeStart = habit.startDate && day.iso < habit.startDate;

        return (
          <td
            key={day.iso}
            data-today={day.isToday ? "true" : undefined}
            className={`py-3 px-2 text-center relative group/cell ${
              day.isToday ? 'bg-amber-100/40 dark:bg-amber-950/30 border-x border-amber-300/60 dark:border-amber-700/60' : ''
            }`}
          >
            <div className="inline-block relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDate(habit, day.iso);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (habit.isMeasurable) {
                    onOpenLevelLogger(habit, day.iso);
                  }
                }}
                disabled={isFrozen}
                className={`w-8 h-8 rounded-xl inline-flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isDone
                    ? `${colorTheme.active} text-white shadow-xs scale-100`
                    : habit.isMeasurable && dayVal > 0
                    ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                    : isFrozen
                    ? 'bg-blue-500 text-white shadow-xs scale-100 border border-blue-400'
                    : isBeforeStart
                    ? 'border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-300 opacity-60'
                    : day.isToday
                    ? 'border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-transparent'
                    : isTargetDay
                    ? 'border border-neutral-300 dark:border-neutral-700 hover:border-neutral-800 dark:hover:border-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-transparent'
                    : 'border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/40 text-transparent opacity-50'
                }`}
                title={`${habit.title} - ${day.dayName} (${day.iso})${habit.isMeasurable ? ` - ${dayVal}/${targetVal} ${habit.unit || 'units'} (Right-click or long press to adjust level)` : ''}`}
              >
                {isDone ? (
                  <Check size={16} className="opacity-100" />
                ) : habit.isMeasurable && dayVal > 0 ? (
                  <span className="text-[9px] font-black font-mono">{dayPct}%</span>
                ) : isFrozen ? (
                  <Snowflake size={16} className="opacity-100 animate-pulse" />
                ) : (
                  <span className="opacity-0">✓</span>
                )}
              </button>

              {/* Micro Freeze button overlay */}
              {!isDone && onToggleFreeze && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isFrozen && freezesUsedThisWeek >= 1) {
                      alert(isAr ? 'يمكنك استخدام تجميد سلسلة واحد فقط في الأسبوع لتبقي تتبع العادات واقعياً.' : 'Limit reached: You can only apply 1 streak freeze per week for this habit.');
                      return;
                    }
                    onToggleFreeze(habit, day.iso);
                  }}
                  className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border transition-all ${
                    isFrozen
                      ? 'bg-blue-600 text-white border-blue-500 scale-100'
                      : 'bg-white dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 hover:text-blue-500 border-neutral-300 opacity-0 group-hover/cell:opacity-100 scale-90 hover:scale-100'
                  }`}
                  title={isFrozen ? (isAr ? 'إلغاء التجميد' : 'Remove freeze') : (isAr ? 'تجميد اليوم' : 'Apply Streak Freeze')}
                >
                  <Snowflake size={8} />
                </button>
              )}
            </div>
          </td>
        );
      })}

      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {habit.isMeasurable && (
            <button
              onClick={() => onOpenLevelLogger(habit, todayIso)}
              className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
              title={isAr ? 'تسجيل المستوى السريع' : 'Log Level'}
            >
              <Sliders size={13} />
            </button>
          )}

          <button
            onClick={() => onOpenDetail(habit)}
            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Analytics, graphs & notes"
          >
            <Edit2 size={13} />
          </button>
          {onArchive && (
            <button
              onClick={() => onArchive(habit)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
              title={isAr ? 'أرشفة العادة' : 'Archive habit'}
            >
              <Archive size={13} />
            </button>
          )}
          <button
            onClick={() => onDelete(habit)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            title={isAr ? 'حذف العادة' : 'Delete habit'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  rewards = [],
  sleepLogs = [],
  sleepConfig = null,
  onAddHabit,
  onToggleHabit,
  onUpdateHabit,
  onDeleteHabit,
  onReorderHabits,
  onUpdateDailyValue,
  onToggleFreeze,
  onApplyFreezeExcuse,
  onRemoveFreeze,
  onBulkUpdateHabits,
  onBulkDeleteHabits,
  onOpenExportModal,
  onAddReward,
  onClaimReward,
  onDeleteReward,
  onSaveSleepLog,
  onSaveSleepConfig,
  onDeleteSleepLog,
  workouts = [],
  onNavigateModule,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const matrixTableContainerRef = useRef<HTMLDivElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<HabitItem | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<HabitItem | null>(null);

  // Prompt modal to log workout session in Iron Engine when gym habit is checked
  const [promptWorkoutModal, setPromptWorkoutModal] = useState<{ habit: HabitItem; date: string } | null>(null);

  // Level logger state
  const [levelLoggingHabit, setLevelLoggingHabit] = useState<{ habit: HabitItem; dateKey: string } | null>(null);

  // Drag & drop reorder states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Selection mode & Bulk Actions
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  // Routine filter & modals
  const [selectedRoutineFilter, setSelectedRoutineFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [freezeModalHabit, setFreezeModalHabit] = useState<{ habit: HabitItem; dateKey: string } | null>(null);
  const [showBulkExcuseModal, setShowBulkExcuseModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundManager.isEnabled());

  // View states (default to cards on mobile for zero-horizontal-scroll experience)
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'matrix';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week

  // Form states for new habit
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('🔥');
  const [newRoutineTime, setNewRoutineTime] = useState<HabitRoutineTime>('anytime');
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('Productivity');
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [newColor, setNewColor] = useState('amber');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newFrequencyType, setNewFrequencyType] = useState<'weekly' | 'specific_days'>('weekly');
  const [newTargetDays, setNewTargetDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newIsMeasurable, setNewIsMeasurable] = useState(false);
  const [newTargetValue, setNewTargetValue] = useState(10);
  const [newUnit, setNewUnit] = useState('pages');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'tracker' | 'sleep' | 'stats' | 'archive'>('tracker');

  const getArSingleLetter = (dayNum: number) => {
    switch (dayNum) {
      case 0: return 'ح';
      case 1: return 'ن';
      case 2: return 'ث';
      case 3: return 'ر';
      case 4: return 'خ';
      case 5: return 'ج';
      case 6: return 'س';
      default: return '';
    }
  };

  const getCategoryLabel = (cat: string) => {
    if (!isAr) return cat;
    if (cat === 'All' || cat === 'all') return 'الكل';
    switch (cat) {
      case 'Productivity': return 'الإنتاجية';
      case 'Health': return 'الصحة والعافية';
      case 'Business': return 'الأعمال والريادة';
      case 'Personal Growth': return 'النمو الشخصي';
      case 'Mindset': return 'الذهنية والتفكير';
      default: return cat;
    }
  };

  // Calculate the 7 days of the currently selected week (Monday to Sunday)
  const getDaysOfWeek = (offset = 0) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Mon
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday + offset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short' });
      const dayNumber = d.getDate();
      const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
      days.push({ date: d, iso, dayName, dayNumber, isToday });
    }
    return days;
  };

  const currentDays = getDaysOfWeek(weekOffset);
  const todayIso = new Date().toISOString().split('T')[0];

  const todaySleepLog = useMemo(() => {
    return (sleepLogs || []).find((l) => l.date === todayIso);
  }, [sleepLogs, todayIso]);

  const todayFormattedDate = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Auto-scroll matrix container to today's column so phone view or small screens center today immediately!
  useEffect(() => {
    if (viewMode === 'matrix' && matrixTableContainerRef.current) {
      const todayCell = matrixTableContainerRef.current.querySelector('[data-today="true"]');
      if (todayCell) {
        todayCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [viewMode, weekOffset]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const calculatedTarget = newFrequencyType === 'specific_days' 
        ? Math.max(1, newTargetDays.length) 
        : targetPerWeek;

      await onAddHabit({
        title: newTitle.trim(),
        icon: newIcon || '🔥',
        routineTime: newRoutineTime,
        question: newQuestion.trim() || undefined,
        category: newCategory,
        targetPerWeek: calculatedTarget,
        color: newColor,
        startDate: newStartDate || undefined,
        frequencyType: newFrequencyType,
        targetDays: newFrequencyType === 'specific_days' ? newTargetDays : undefined,
        streak: 0,
        history: {},
        createdAt: Date.now(),
        order: habits.length,
        isMeasurable: newIsMeasurable,
        targetValue: newIsMeasurable ? newTargetValue : undefined,
        unit: newIsMeasurable ? (newUnit.trim() || 'pages') : undefined,
      });

      setNewTitle('');
      setNewIcon('🔥');
      setNewRoutineTime('anytime');
      setNewQuestion('');
      setNewStartDate(new Date().toISOString().split('T')[0]);
      setNewFrequencyType('weekly');
      setNewIsMeasurable(false);
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to create habit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = (habit: HabitItem, isoDate: string) => {
    const isAlreadyDone = Boolean(habit.history && habit.history[isoDate]);
    onToggleHabit(habit, isoDate);

    if (!isAlreadyDone) {
      soundManager.playCheck();
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.75 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
      });

      // User request: when checking off a gym/workout habit, prompt them with a popup
      // to easily navigate to The Iron Engine to log session details if not already logged today!
      try {
        const linkedGymId = localStorage.getItem('iron_engine_gym_habit');
        const titleLower = (habit.title || '').toLowerCase();
        const isGymHabit = (linkedGymId && habit.id === linkedGymId) ||
          titleLower.includes('gym') ||
          titleLower.includes('workout') ||
          titleLower.includes('training') ||
          titleLower.includes('fitness') ||
          titleLower.includes('جيم') ||
          titleLower.includes('تمرين') ||
          titleLower.includes('صالة') ||
          titleLower.includes('حديد');

        const hasWorkoutLogged = (workouts || []).some(w => w.date === isoDate);
        if (isGymHabit && !hasWorkoutLogged && onNavigateModule) {
          setPromptWorkoutModal({ habit, date: isoDate });
        }
      } catch {}
    }
  };

  const handleCompleteEntireRoutine = async (routine: HabitRoutineTime) => {
    const routineHabits = activeHabits.filter(h => (h.routineTime || 'anytime') === routine || (routine === 'morning' && !h.routineTime));
    const incomplete = routineHabits.filter(h => !h.history || !h.history[todayIso]);
    if (incomplete.length === 0) return;

    for (const h of incomplete) {
      await onToggleHabit(h, todayIso);
    }
    soundManager.playRoutineComplete();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6']
    });
  };

  const handleApplyFreeze = async (habit: HabitItem, dateKey: string, excuse: string) => {
    if (onApplyFreezeExcuse) {
      await onApplyFreezeExcuse(habit, dateKey, excuse);
    } else {
      const currentFreezes = { ...(habit.freezes || {}) };
      currentFreezes[dateKey] = true;
      const currentExcuses = { ...(habit.freezeExcuses || {}) };
      currentExcuses[dateKey] = excuse;
      if (habit.id) {
        await onUpdateHabit(habit.id, {
          freezes: currentFreezes,
          freezeExcuses: currentExcuses,
        });
      }
    }
  };

  const handleRemoveFreeze = async (habit: HabitItem, dateKey: string) => {
    if (onRemoveFreeze) {
      await onRemoveFreeze(habit, dateKey);
    } else {
      const currentFreezes = { ...(habit.freezes || {}) };
      delete currentFreezes[dateKey];
      const currentExcuses = { ...(habit.freezeExcuses || {}) };
      delete currentExcuses[dateKey];
      if (habit.id) {
        await onUpdateHabit(habit.id, {
          freezes: currentFreezes,
          freezeExcuses: currentExcuses,
        });
      }
    }
  };

  const handleSaveDailyLevel = async (val: number) => {
    if (!levelLoggingHabit || !levelLoggingHabit.habit.id) return;
    const { habit, dateKey } = levelLoggingHabit;

    if (onUpdateDailyValue) {
      await onUpdateDailyValue(habit, dateKey, val);
    } else {
      const currentDaily = { ...(habit.dailyValues || {}) };
      currentDaily[dateKey] = val;
      const target = habit.targetValue || 10;
      const isDone = val >= target;
      const currentHistory = { ...(habit.history || {}) };
      currentHistory[dateKey] = isDone;
      await onUpdateHabit(habit.id, {
        dailyValues: currentDaily,
        history: currentHistory,
      });
    }
  };

  // Drag and Drop Handlers
  const handleDragStartRow = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOverRow = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDropRow = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...filteredHabits];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    const orderedIds = reordered.map(h => h.id).filter(Boolean) as string[];
    if (onReorderHabits) {
      onReorderHabits(orderedIds);
    } else {
      orderedIds.forEach((id, idx) => {
        onUpdateHabit(id, { order: idx });
      });
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEndRow = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const reordered = [...filteredHabits];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index - 1, 0, moved);
    const orderedIds = reordered.map(h => h.id).filter(Boolean) as string[];
    if (onReorderHabits) {
      onReorderHabits(orderedIds);
    } else {
      orderedIds.forEach((id, idx) => onUpdateHabit(id, { order: idx }));
    }
  };

  const handleMoveDown = (index: number) => {
    if (index >= filteredHabits.length - 1) return;
    const reordered = [...filteredHabits];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index + 1, 0, moved);
    const orderedIds = reordered.map(h => h.id).filter(Boolean) as string[];
    if (onReorderHabits) {
      onReorderHabits(orderedIds);
    } else {
      orderedIds.forEach((id, idx) => onUpdateHabit(id, { order: idx }));
    }
  };

  // Filter out archived and currently snoozed habits for the active view
  const now = Date.now();
  const activeHabits = habits.filter((h) => !h.archived && (!h.snoozeUntil || h.snoozeUntil < now));
  const archivedAndSnoozedHabits = habits.filter((h) => h.archived || (h.snoozeUntil && h.snoozeUntil > now));

  // Gather all logged freeze excuses for audit breakdown
  const allLoggedExcuses = useMemo(() => {
    const list: { habitTitle: string; habitIcon: string; dateKey: string; excuse: string }[] = [];
    activeHabits.forEach((h) => {
      const excuses = h.freezeExcuses || {};
      Object.keys(excuses).forEach((dateKey) => {
        if (excuses[dateKey]) {
          list.push({
            habitTitle: h.title,
            habitIcon: h.icon || '🔥',
            dateKey,
            excuse: excuses[dateKey],
          });
        }
      });
    });
    return list.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [activeHabits]);

  // Sort active habits by custom order or createdAt
  const sortedActiveHabits = [...activeHabits].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  // Filtered active habits
  const filteredHabits = sortedActiveHabits.filter((h) => {
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.question && h.question.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered archived habits
  const filteredArchived = archivedAndSnoozedHabits.filter((h) => {
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.question && h.question.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate overall metrics (only based on active habits)
  const bestOverallStreak = activeHabits.reduce((max, h) => {
    const s = calculateHabitStats(h);
    return Math.max(max, s.currentStreak);
  }, 0);

  const completedTodayCount = activeHabits.filter((h) => h.history && h.history[todayIso]).length;
  const overallTodayRate = activeHabits.length > 0 ? Math.round((completedTodayCount / activeHabits.length) * 100) : 0;

  const categories = ['All', 'Productivity', 'Health', 'Business', 'Personal Growth', 'Mindset'];

  const getColorClasses = (color: string = 'amber') => {
    switch (color) {
      case 'emerald':
        return { active: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'blue':
        return { active: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
      case 'purple':
        return { active: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
      case 'rose':
        return { active: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
      case 'indigo':
        return { active: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
      default:
        return { active: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    }
  };

  const habitPresets = [
    { title: 'Read 15 Pages', cat: 'Personal Growth', q: 'Did you read 15 pages of nonfiction?', col: 'purple', isMeasurable: true, target: 15, unit: 'pages' },
    { title: 'Morning Deep Work (90m)', cat: 'Business', q: 'Did you execute 90m uninterrupted?', col: 'blue', isMeasurable: true, target: 90, unit: 'minutes' },
    { title: 'Hydration (2.5L Water)', cat: 'Health', q: 'Did you drink 2.5L of water today?', col: 'emerald', isMeasurable: true, target: 2.5, unit: 'liters' },
    { title: 'Daily Calisthenics / Reps', cat: 'Health', q: 'Did you complete 50 pushups & squats?', col: 'emerald', isMeasurable: true, target: 50, unit: 'reps' },
    { title: 'Daily Gratitude & Zen', cat: 'Mindset', q: 'Did you practice 5m mindfulness?', col: 'amber' },
  ];

  // Bulk Selection and Actions
  const handleToggleSelectHabit = (habitId: string) => {
    setSelectedHabitIds((prev) => 
      prev.includes(habitId) ? prev.filter(id => id !== habitId) : [...prev, habitId]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredHabits.map(h => h.id).filter(Boolean) as string[];
    setSelectedHabitIds(allFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedHabitIds([]);
  };

  const handleBulkMakeHighPriority = async () => {
    if (selectedHabitIds.length === 0) return;
    const updates = { targetPerWeek: 7, color: 'rose' };
    if (onBulkUpdateHabits) {
      await onBulkUpdateHabits(selectedHabitIds, updates);
    } else {
      for (const id of selectedHabitIds) {
        await onUpdateHabit(id, updates);
      }
    }
    handleDeselectAll();
  };

  const handleApplyBulkEdit = async (updates: Record<string, any>) => {
    if (selectedHabitIds.length === 0) return;
    if (onBulkUpdateHabits) {
      await onBulkUpdateHabits(selectedHabitIds, updates);
    } else {
      for (const id of selectedHabitIds) {
        await onUpdateHabit(id, updates);
      }
    }
    handleDeselectAll();
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedHabitIds.length === 0) return;
    if (onBulkDeleteHabits) {
      await onBulkDeleteHabits(selectedHabitIds);
    } else {
      for (const id of selectedHabitIds) {
        await onDeleteHabit(id);
      }
    }
    setShowBulkDeleteModal(false);
    handleDeselectAll();
  };

  const handleBulkExport = () => {
    const selected = habits.filter(h => h.id && selectedHabitIds.includes(h.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selected, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `habits_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className={`space-y-4 max-w-6xl mx-auto animate-fadeIn text-neutral-900 dark:text-neutral-100 ${isAr ? 'text-right' : ''}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-bold mb-0.5">
            <Flame size={15} className="text-amber-500 fill-amber-500" />
            <span>{isAr ? 'بروتوكول بناء العادات والمقاييس' : 'Habits & Measurable Protocol'}</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.2 rounded-md font-mono text-[11px] font-bold">
              {completedTodayCount}/{activeHabits.length} {isAr ? 'أُنجز اليوم' : 'Done Today'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {activeTab === 'tracker' 
              ? (isAr ? 'تسجيل العادات اليومية والمستويات' : 'Daily Habit Check-in') 
              : activeTab === 'stats' 
              ? (isAr ? 'إحصائيات وتحليلات العادات' : 'Habit Stats & Analytics') 
              : (isAr ? 'الأرشيف والعادات المتوقفة' : 'Archive & Paused History')}
          </h2>
        </div>

        {/* View Switcher Tabs & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid grid-cols-4 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 w-full sm:w-auto text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('tracker');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 size={13} className={activeTab === 'tracker' ? 'text-amber-500' : ''} />
              <span>{isAr ? 'المصفوفة' : 'Matrix'}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('sleep');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sleep'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Moon size={13} className={activeTab === 'sleep' ? 'text-indigo-500' : ''} />
              <span>{isAr ? 'النوم والاستيقاظ' : 'Sleep & Wake'}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('stats');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 size={13} className={activeTab === 'stats' ? 'text-indigo-500' : ''} />
              <span>{isAr ? 'التحليلات' : 'Analytics'}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('archive');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Clock size={13} className={activeTab === 'archive' ? 'text-rose-500' : ''} />
              <span>{isAr ? 'الأرشيف' : 'Archive'}</span>
            </button>
          </div>

          <button
            onClick={() => setShowBulkExcuseModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 hover:scale-105 transition-all shadow-xs cursor-pointer"
            title={isAr ? 'تسجيل عذر وسياق استثنائي لأيام سابقة' : 'Log Context Excuses for Missed Days'}
          >
            <Shield size={14} className="text-blue-500" />
            <span className="hidden sm:inline">{isAr ? 'تثبيت عذر' : 'Log Excuses'}</span>
          </button>

          <button
            onClick={() => setShowRewardsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:scale-105 transition-all shadow-xs cursor-pointer"
            title={isAr ? 'متجر الجوائز والمكافآت' : 'Milestone Rewards Vault'}
          >
            <Trophy size={14} className="text-amber-500" />
            <span className="hidden sm:inline">{isAr ? 'الجوائز' : 'Rewards'}</span>
          </button>

          <button
            onClick={() => {
              const newVal = soundManager.toggle();
              setSoundEnabled(newVal);
            }}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? (isAr ? 'كتم المؤثرات الصوتية' : 'Mute Sound FX') : (isAr ? 'تفعيل المؤثرات الصوتية' : 'Enable Sound FX')}
          >
            {soundEnabled ? <Volume2 size={15} className="text-indigo-500" /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setSelectedHabitIds([]);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isSelectMode || selectedHabitIds.length > 0
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CheckCheck size={14} />
            <span>{isAr ? 'تحديد' : 'Select'}</span>
            {selectedHabitIds.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px] font-mono">
                {selectedHabitIds.length}
              </span>
            )}
          </button>

          <button
            id="btn-add-habit-modal"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 ml-auto sm:ml-0 active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>{isAr ? 'عادة جديدة' : 'New Habit'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-PAGE 1: DAILY TRACKER (WITH TODAY SPOTLIGHT STRIP)
          ======================================================== */}
      {activeTab === 'tracker' && (
        <div className="space-y-4 animate-fadeIn">
          {/* TODAY SPOTLIGHT STRIP (Directly visible in matrix mode; hidden in snail view to eliminate duplicate routines) */}
          {viewMode === 'matrix' && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-neutral-900/60 dark:to-neutral-900/40 p-4 rounded-3xl border-2 border-amber-300/80 dark:border-amber-700/60 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/60 dark:border-amber-800/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Sun size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.2 rounded-full font-mono">
                        {isAr ? 'اليوم الحالي' : 'Current Day'}
                      </span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {todayFormattedDate}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                      {isAr ? 'تسجيل إنجاز اليوم والروتين الزمني' : "Today's Check-in & Time Routines"}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-amber-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 shadow-3xs">
                    {completedTodayCount} / {activeHabits.length} {isAr ? 'مكتمل' : 'Done'} ({overallTodayRate}%)
                  </span>
                </div>
              </div>

              {/* QUICK SLEEP & WAKE TODAY CHECK-IN BANNER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/90 dark:border-indigo-800/60 shadow-3xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
                    <Moon size={15} />
                  </div>
                  <div className="min-w-0">
                    {todaySleepLog ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          {isAr ? 'نوم واستيقاظ اليوم:' : "Today's Sleep & Wake:"}
                        </span>
                        <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          🌙 {todaySleepLog.actualBedtime || (todaySleepLog as any).bedtime || '23:00'} ➔ ☀️ {todaySleepLog.actualWakeTime || (todaySleepLog as any).wakeTime || '07:00'} ({todaySleepLog.sleepDurationMinutes ? (todaySleepLog.sleepDurationMinutes / 60).toFixed(1) : ((todaySleepLog as any).durationHours || 8)}h)
                        </span>
                        {(todaySleepLog.wokeOnTarget || (todaySleepLog as any).metTargetSchedule) && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            {isAr ? '✓ التزام بالموعد' : '✓ Target Met'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            {isAr ? 'مزامنة موعد الاستيقاظ والنوم:' : 'Sleep & Wake Rhythm:'}
                          </span>
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                            {isAr ? `(الهدف: ${sleepConfig?.targetWakeTime || '07:00'})` : `(Target: ${sleepConfig?.targetWakeTime || '07:00'})`}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {isAr
                            ? 'سجّل وقت استيقاظك اليوم لمقارنته بنهاية الأسبوع مع إنجاز المهام والعادات'
                            : 'Log wake-up time to evaluate weekly energy and habit execution'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {!todaySleepLog && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (onSaveSleepLog) {
                          const bt = sleepConfig?.targetBedtime || '23:00';
                          const wt = sleepConfig?.targetWakeTime || '07:00';
                          const [bH, bM] = bt.split(':').map(Number);
                          const [wH, wM] = wt.split(':').map(Number);
                          let bMin = bH * 60 + bM;
                          let wMin = wH * 60 + wM;
                          if (wMin <= bMin) wMin += 24 * 60;
                          const durMinutes = wMin - bMin;
                          await onSaveSleepLog({
                            date: todayIso,
                            targetBedtime: bt,
                            targetWakeTime: wt,
                            actualBedtime: bt,
                            actualWakeTime: wt,
                            wokeOnTarget: true,
                            sleptOnTarget: true,
                            sleepDurationMinutes: durMinutes,
                            quality: 'good',
                            energyLevel: 4,
                            notes: isAr ? 'تسجيل سريع مباشر للالتزام بالموعد' : 'Quick check-in on target schedule',
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                          });
                          soundManager.play('celebrate');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Check size={13} />
                      <span>{isAr ? `فقت مع ${sleepConfig?.targetWakeTime || '07:00'} (1-Tap)` : `Woke at ${sleepConfig?.targetWakeTime || '07:00'}`}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('sleep')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <Clock size={12} />
                    <span>{todaySleepLog ? (isAr ? 'تعديل أو تفاصيل' : 'Edit / Details') : (isAr ? 'وقت آخر أو ملاحظة' : 'Custom Time')}</span>
                  </button>
                </div>
              </div>

              {/* Time-of-Day Routine Filter Tabs & 1-Tap Complete Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1">
                <div className="flex items-center gap-1 bg-white/80 dark:bg-neutral-800/80 p-1 rounded-xl border border-amber-200/60 dark:border-neutral-700 overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
                  {[
                    { id: 'all', label: isAr ? 'كافة الفترات' : 'All Routines', icon: '🌟' },
                    { id: 'morning', label: isAr ? 'الصباح' : 'Morning', icon: '☀️' },
                    { id: 'afternoon', label: isAr ? 'الظهيرة' : 'Afternoon', icon: '🌤️' },
                    { id: 'evening', label: isAr ? 'المساء' : 'Evening', icon: '🌙' },
                  ].map((routine) => (
                    <button
                      key={routine.id}
                      type="button"
                      onClick={() => setSelectedRoutineFilter(routine.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        selectedRoutineFilter === routine.id
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{routine.icon}</span>
                      <span>{routine.label}</span>
                    </button>
                  ))}
                </div>

                {/* 1-Tap Complete Routine Button */}
                {selectedRoutineFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleCompleteEntireRoutine(selectedRoutineFilter as HabitRoutineTime)}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-3xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Sparkles size={13} />
                    <span>
                      {isAr 
                        ? `إنجاز كامل روتين ${selectedRoutineFilter === 'morning' ? 'الصباح' : selectedRoutineFilter === 'afternoon' ? 'الظهيرة' : 'المساء'} بنقرة واحدة!` 
                        : `Complete Entire ${selectedRoutineFilter.toUpperCase()} Routine (1-Tap)!`}
                    </span>
                  </button>
                )}
              </div>

              {/* Quick 1-Tap Actions for Today */}
              {activeHabits.length === 0 ? (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 py-2">
                  {isAr ? 'لم تتم إضافة عادات بعد. انقر على "عادة جديدة" للبدء.' : 'No active habits yet. Tap "New Habit" to start.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {activeHabits
                    .filter((h) => selectedRoutineFilter === 'all' || (h.routineTime || 'anytime') === selectedRoutineFilter || (selectedRoutineFilter === 'morning' && !h.routineTime))
                    .map((habit) => {
                    const isDone = Boolean(habit.history && habit.history[todayIso]);
                    const target = habit.targetValue || 10;
                    const val = habit.dailyValues?.[todayIso] || (isDone ? target : 0);
                    const pct = Math.min(100, Math.round((val / target) * 100));

                    return (
                      <div
                        key={`today-spotlight-${habit.id}`}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-3xs'
                            : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2 rtl:pr-0 rtl:pl-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(habit, todayIso)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                              isDone
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'border-2 border-neutral-300 dark:border-neutral-600 hover:border-amber-500'
                            }`}
                          >
                            {isDone && <Check size={14} />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <span className={`text-xs font-bold block truncate flex items-center gap-1 ${isDone ? 'line-through text-neutral-500 dark:text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                              <span>{habit.icon || '🔥'}</span>
                              <span>{habit.title}</span>
                            </span>
                            {habit.isMeasurable && (
                              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {val}/{target} {habit.unit} ({pct}%)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {habit.isMeasurable && (
                            <button
                              type="button"
                              onClick={() => setLevelLoggingHabit({ habit, dateKey: todayIso })}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:scale-105 transition-transform flex items-center gap-1 cursor-pointer"
                              title={isAr ? 'تعديل المستوى' : 'Adjust Level'}
                            >
                              <Sliders size={11} />
                              <span>{pct}%</span>
                            </button>
                          )}
                          <span className="text-[10px] font-bold font-mono text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md">
                            🔥 {habit.streak || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Filter and View Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            {/* Search */}
            <div className="relative w-full md:w-60">
              <Search size={14} className={`${isAr ? 'right-3' : 'left-3'} absolute top-1/2 -translate-y-1/2 text-neutral-400`} />
              <input
                type="text"
                placeholder={isAr ? 'البحث في العادات...' : 'Search habits...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white ${isAr ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3'}`}
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto py-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>

            {/* View Switcher & Week Navigator */}
            <div className="flex items-center gap-2 self-end md:self-auto text-xs">
              {viewMode === 'matrix' && (
                <div className="flex items-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
                    title={isAr ? 'الأسبوع السابق' : 'Previous week'}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-2 text-neutral-900 dark:text-neutral-200 font-semibold text-[11px] whitespace-nowrap">
                    {weekOffset === 0 
                      ? (isAr ? 'هذا الأسبوع' : 'This Week') 
                      : weekOffset === -1 
                      ? (isAr ? 'الأسبوع الماضي' : 'Last Week') 
                      : (isAr ? `أسبوع ${weekOffset > 0 ? `+${weekOffset}` : weekOffset}` : `Week ${weekOffset > 0 ? `+${weekOffset}` : weekOffset}`)}
                  </span>
                  <button
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
                    title={isAr ? 'الأسبوع التالي' : 'Next week'}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}

              <div className="inline-flex bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-0.5 rounded-xl">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                  title={isAr ? 'عرض البطاقات' : 'Cards View'}
                >
                  <Layers size={14} />
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'matrix'
                      ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                  title={isAr ? 'عرض الجدول والمصفوفة' : 'Matrix View'}
                >
                  <Grid size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Drag & Drop Reorder Helper Hint */}
          <div className="flex items-center justify-between px-3 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1">
              <GripVertical size={13} />
              {isAr ? 'اسحب العادات لإعادة ترتيبها (Drag & Drop) • انقر بالزر الأيمن أو اضغط مطولاً لتسجيل المستويات الجزئية' : 'Drag & drop habits to reorder • Right-click or long-press day cells to log partial levels'}
            </span>
            <span>{isAr ? `${filteredHabits.length} عادة نشطة` : `${filteredHabits.length} active habits`}</span>
          </div>

          {/* Habit Content: Desktop Matrix Table or Mobile Cards */}
          {filteredHabits.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 p-12 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500 dark:text-neutral-400">
              <CheckCircle2 size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-900 dark:text-white">{isAr ? 'لا توجد عادات تطابق البحث' : 'No habits found'}</p>
              <p className="text-xs mt-1">{isAr ? 'أضف عادة جديدة أو اختر تصنيفاً آخر.' : 'Create a new habit or select another category.'}</p>
            </div>
          ) : viewMode === 'matrix' ? (
            /* Matrix View: Auto-scrolls horizontally to center today's column */
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
              <div ref={matrixTableContainerRef} className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      <th className={`py-3.5 px-4 ${isAr ? 'text-right' : 'text-left'}`}>
                        {isAr ? 'العادة والهدف اليومي' : 'Habit & Daily Target'}
                      </th>
                      <th className="py-3.5 px-2 text-center w-16">
                        {isAr ? 'السلسلة' : 'Streak'}
                      </th>
                      {currentDays.map((d) => (
                        <th
                          key={d.iso}
                          data-today={d.isToday ? "true" : undefined}
                          className={`py-3.5 px-2 text-center w-12 transition-all ${
                            d.isToday ? 'bg-amber-100/60 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-black border-x border-amber-300 dark:border-amber-700' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold">
                              {isAr ? getArSingleLetter(d.date.getDay()) : d.dayName.slice(0, 3)}
                            </span>
                            <span className="text-[10px] font-mono mt-0.5">
                              {d.dayNumber}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="py-3.5 px-3 text-right w-24">
                        {isAr ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {filteredHabits.map((habit, idx) => (
                      <DesktopHabitRowItem
                        key={habit.id || idx}
                        habit={habit}
                        index={idx}
                        totalCount={filteredHabits.length}
                        currentDays={currentDays}
                        todayIso={todayIso}
                        isSelected={Boolean(habit.id && selectedHabitIds.includes(habit.id))}
                        isSelectMode={isSelectMode || selectedHabitIds.length > 0}
                        onToggleSelect={handleToggleSelectHabit}
                        onOpenDetail={setSelectedHabitForDetail}
                        onToggleDate={handleToggle}
                        onOpenLevelLogger={(h, dKey) => setLevelLoggingHabit({ habit: h, dateKey: dKey })}
                        onDelete={setHabitToDelete}
                        onArchive={(h) => h.id && onUpdateHabit(h.id, { archived: true, archivedAt: Date.now() })}
                        onToggleFreeze={async (h, dKey) => setFreezeModalHabit({ habit: h, dateKey: dKey })}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onDragStartRow={handleDragStartRow}
                        onDragOverRow={handleDragOverRow}
                        onDropRow={handleDropRow}
                        onDragEndRow={handleDragEndRow}
                        isDragging={draggedIndex === idx}
                        isDragOver={dragOverIndex === idx}
                        isAr={isAr}
                        getCategoryLabel={getCategoryLabel}
                        getColorClasses={getColorClasses}
                        getArSingleLetter={getArSingleLetter}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredHabits.map((habit, idx) => (
                <MobileHabitCardItem
                  key={habit.id || idx}
                  habit={habit}
                  index={idx}
                  totalCount={filteredHabits.length}
                  currentDays={currentDays}
                  todayIso={todayIso}
                  isSelected={Boolean(habit.id && selectedHabitIds.includes(habit.id))}
                  isSelectMode={isSelectMode || selectedHabitIds.length > 0}
                  onToggleSelect={handleToggleSelectHabit}
                  onOpenDetail={setSelectedHabitForDetail}
                  onToggleDate={handleToggle}
                  onOpenLevelLogger={(h, dKey) => setLevelLoggingHabit({ habit: h, dateKey: dKey })}
                  onDelete={setHabitToDelete}
                  onArchive={(h) => h.id && onUpdateHabit(h.id, { archived: true, archivedAt: Date.now() })}
                  onToggleFreeze={async (h, dKey) => setFreezeModalHabit({ habit: h, dateKey: dKey })}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onDragStartRow={handleDragStartRow}
                  onDragOverRow={handleDragOverRow}
                  onDropRow={handleDropRow}
                  onDragEndRow={handleDragEndRow}
                  isDragging={draggedIndex === idx}
                  isDragOver={dragOverIndex === idx}
                  isAr={isAr}
                  getCategoryLabel={getCategoryLabel}
                  getColorClasses={getColorClasses}
                  getArSingleLetter={getArSingleLetter}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-PAGE: SLEEP & WAKE RHYTHM
          ======================================================== */}
      {activeTab === 'sleep' && (
        <div className="pt-2 animate-in fade-in duration-200">
          <SleepWakeTracker
            sleepLogs={sleepLogs || []}
            sleepConfig={sleepConfig || null}
            onSaveSleepLog={onSaveSleepLog || (async () => {})}
            onSaveSleepConfig={onSaveSleepConfig || (async () => {})}
            onDeleteSleepLog={onDeleteSleepLog}
            lang={lang}
          />
        </div>
      )}

      {/* ========================================================
          SUB-PAGE 2: STATS & ANALYTICS
          ======================================================== */}
      {activeTab === 'stats' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                {isAr ? 'إنجاز اليوم' : 'Completed Today'}
              </span>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono">
                {completedTodayCount} / {activeHabits.length}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{overallTodayRate}% {isAr ? 'نسبة الالتزام اليومية' : 'daily adherence'}</p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                {isAr ? 'أطول سلسلة حالية' : 'Best Active Streak'}
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1">
                <Flame size={20} className="fill-amber-500" />
                {bestOverallStreak}{isAr ? ' يوم' : 'd'}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{isAr ? 'أفضل استمرارية مستمرة' : 'Consistent momentum'}</p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                {isAr ? 'إجمالي العادات النشطة' : 'Active Habits'}
              </span>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white font-mono">
                {activeHabits.length}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{isAr ? 'تحت التتبع اليومي' : 'Under daily tracking'}</p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                {isAr ? 'الأعذار والسياق الموثق' : 'Excused Context Days'}
              </span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
                <Shield size={20} className="text-blue-500" />
                {allLoggedExcuses.length}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{isAr ? 'أيام محمية بسياق رسمي' : 'Protected streak days'}</p>
            </div>
          </div>

          {/* Context & Excuse Audit Log (سجل الأعذار والسياق الاستثنائي الشهري) */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Shield size={18} className="text-blue-500" />
                  <span>{isAr ? 'سجل الأعذار والسياق الظرفي الشهري (Context Audit Log)' : 'Monthly Context & Excuse Audit Log'}</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {isAr 
                    ? 'تحليل موضوعي للأيام التي توقفت فيها لظروف طارئة، زيارات، أو تركيز استثنائي على مشاريع أخرى لراحة الذهن وعدم النسيان.' 
                    : 'Objective review of missed habit days protected by formal context excuses.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBulkExcuseModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>{isAr ? 'تسجيل عذر لأيام سابقة' : 'Log Context Excuse'}</span>
              </button>
            </div>

            {allLoggedExcuses.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400 font-medium">
                {isAr ? 'لا توجد أعذار أو سياق استثنائي مسجل حالياً. انقر على "تسجيل عذر لأيام سابقة" لتوثيق أسباب التوقف.' : 'No context excuses logged yet. Click "Log Context Excuse" to record reasons for missed days.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px] text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-[11px] font-bold text-neutral-500">
                      <th className={`py-2.5 px-3 ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'العادة' : 'Habit'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className={`py-2.5 px-3 ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'العذر الموثق / السياق' : 'Logged Context Excuse'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
                    {allLoggedExcuses.slice(0, 15).map((item, idx) => (
                      <tr key={`excuse-audit-${idx}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className={`py-2.5 px-3 font-bold text-neutral-900 dark:text-white ${isAr ? 'text-right' : 'text-left'}`}>
                          <span className="mr-1 rtl:mr-0 rtl:ml-1">{item.habitIcon}</span>
                          <span>{item.habitTitle}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-neutral-500">
                          {item.dateKey}
                        </td>
                        <td className={`py-2.5 px-3 text-blue-700 dark:text-blue-300 font-bold ${isAr ? 'text-right' : 'text-left'}`}>
                          {item.excuse}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                setActiveTab('tracker');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-black dark:hover:bg-neutral-200 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Check size={14} />
              <span>{isAr ? 'العودة لشبكة تسجيل العادات اليومية' : 'Back to Daily Check-in Matrix'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-PAGE 3: ARCHIVE & PAUSED HISTORY
          ======================================================== */}
      {activeTab === 'archive' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
              <Clock size={16} className="text-amber-600" />
              <span>{isAr ? 'سجل الأرشيف والعادات المتوقفة مؤقتاً' : 'Archive & Paused Habits Log'}</span>
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isAr 
                ? 'هذه العادات مؤرشفة أو متوقفة مؤقتاً حالياً. سجلات إنجازها وتواليها السابقة محفوظة تماماً ويمكنك استعادتها وتفعيلها مجدداً في أي وقت.' 
                : 'These habits are currently snoozed or soft-deleted/archived. Their historical completions and streak tracking remain intact. You can resume them at any time.'}
            </p>
          </div>

          {filteredArchived.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 p-12 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500 dark:text-neutral-400">
              <Clock size={36} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-900 dark:text-white">{isAr ? 'الأرشيف فارغ' : 'Archive is empty'}</p>
              <p className="text-xs mt-1">{isAr ? 'ستظهر العادات المؤرشفة أو المتوقفة مؤقتاً هنا.' : 'Snoozed or soft-deleted habits will appear here.'}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px] text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      <th className={`py-3 px-4 ${isAr ? 'text-right' : 'text-left'}`}>{isAr ? 'اسم العادة' : 'Habit Name'}</th>
                      <th className="py-3 px-2 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-3 px-2 text-center">{isAr ? 'التوالي التاريخي الأفضل' : 'Historical Streak'}</th>
                      <th className="py-3 px-2 text-center">{isAr ? 'إجمالي التكرارات' : 'Total Completed'}</th>
                      <th className={`py-3 px-4 w-24 ${isAr ? 'text-left' : 'text-right'}`}>{isAr ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {filteredArchived.map((habit) => {
                      const isArchived = habit.archived === true;
                      const isSnoozed = habit.snoozeUntil && habit.snoozeUntil > Date.now();
                      const totalCompletedCount = habit.history ? Object.keys(habit.history).length : 0;
                      const stats = calculateHabitStats(habit);

                      return (
                        <tr key={habit.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
                          <td className={`py-3 px-4 ${isAr ? 'text-right' : 'text-left'}`}>
                            <div className="font-bold text-neutral-900 dark:text-white text-sm">{habit.title}</div>
                            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{getCategoryLabel(habit.category)}</div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            {isArchived ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                                {isAr ? 'مؤرشفة' : 'Archived'}
                              </span>
                            ) : isSnoozed ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                                {isAr ? 'مؤجلة / متوقفة' : 'Snoozed / Paused'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                                {isAr ? 'غير نشطة' : 'Active Inactive'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-semibold text-amber-700 dark:text-amber-300">
                            🔥 {stats.bestStreak}{isAr ? 'ي الأفضل' : 'd max'}
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-semibold text-neutral-900 dark:text-white">
                            {totalCompletedCount} {isAr ? 'تكرار' : 'reps'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedHabitForDetail(habit)}
                                className="px-2.5 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 rounded-lg text-xs font-bold text-neutral-900 dark:text-white transition-all cursor-pointer"
                              >
                                {isAr ? 'عرض السجل' : 'View History'}
                              </button>
                              <button
                                onClick={async () => {
                                  if (habit.id) {
                                    await onUpdateHabit(habit.id, {
                                      archived: false,
                                      snoozeUntil: null as any
                                    });
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                {isAr ? 'استئناف العادة' : 'Resume Habit'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Level Logger Popover/Modal for Measurable Habits */}
      {levelLoggingHabit && (
        <QuickLevelLoggerModal
          isOpen={Boolean(levelLoggingHabit)}
          title={levelLoggingHabit.habit.title}
          subtitle={`${isAr ? 'تاريخ:' : 'Date:'} ${levelLoggingHabit.dateKey} (${getCategoryLabel(levelLoggingHabit.habit.category)})`}
          currentValue={levelLoggingHabit.habit.dailyValues?.[levelLoggingHabit.dateKey] || (levelLoggingHabit.habit.history?.[levelLoggingHabit.dateKey] ? (levelLoggingHabit.habit.targetValue || 10) : 0)}
          targetValue={levelLoggingHabit.habit.targetValue || 10}
          unit={levelLoggingHabit.habit.unit || 'pages'}
          color={levelLoggingHabit.habit.color || 'amber'}
          onSave={handleSaveDailyLevel}
          onClose={() => setLevelLoggingHabit(null)}
          isAr={isAr}
        />
      )}

      {/* Add New Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-h-[90vh] overflow-y-auto text-neutral-900 dark:text-neutral-100 my-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Flame size={18} className="text-amber-500 fill-amber-500" />
                {isAr ? 'إنشاء عادة جديدة ومقياس' : 'Create New Habit & Target'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-semibold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

            {/* Quick preset selector */}
            <div>
              <span className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {isAr ? 'نماذج ملهمة سريعة للتفعيل المباشر:' : 'Quick Inspiration Presets:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {habitPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewTitle(preset.title);
                      setNewCategory(preset.cat);
                      setNewQuestion(preset.q);
                      setNewColor(preset.col);
                      if (preset.isMeasurable) {
                        setNewIsMeasurable(true);
                        setNewTargetValue(preset.target || 10);
                        setNewUnit(preset.unit || 'pages');
                      } else {
                        setNewIsMeasurable(false);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[11px] font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 cursor-pointer transition-colors flex items-center gap-1"
                  >
                    {preset.isMeasurable && <Target size={10} className="text-indigo-500" />}
                    <span>+ {preset.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  {isAr ? 'اسم العادة *' : 'Habit Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: قراءة ١٥ صفحة من كتاب، شرب ٢.٥ لتر ماء...' : 'e.g. Read 15 Pages, 90m Deep Work, Drink 2.5L Water...'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-indigo-600 focus:outline-none text-sm ${isAr ? 'text-right' : ''}`}
                  autoFocus
                />
              </div>

              {/* Measurable Habit Toggle & Settings */}
              <div className="p-3.5 bg-indigo-50/50 dark:bg-neutral-800/60 rounded-2xl border border-indigo-200/70 dark:border-neutral-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIsMeasurable}
                      onChange={(e) => setNewIsMeasurable(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Target size={14} className="text-indigo-600" />
                      <span>{isAr ? 'تفعيل نظام المستويات والمقاييس (Measurable Units)' : 'Enable Measurable Units / Level System (e.g. 10 pages)'}</span>
                    </span>
                  </label>
                </div>

                {newIsMeasurable && (
                  <div className="pt-2 border-t border-indigo-200/60 dark:border-neutral-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                        {isAr ? 'الهدف اليومي المستهدف:' : 'Daily Target Value:'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newTargetValue}
                        onChange={(e) => setNewTargetValue(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                        {isAr ? 'الوحدة (مثلاً: صفحة، لتر، دقيقة):' : 'Unit (e.g. pages, liters, minutes):'}
                      </label>
                      <input
                        type="text"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        placeholder="pages"
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  {isAr ? 'السؤال / العبارة التحفيزية (للتأمل اليومي)' : 'Question / Cue (Prompt for Reflection)'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: هل قرأت صفحاتك اليوم بانتباه وتركيز؟' : 'e.g. Did you complete your reading with zero distractions?'}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-indigo-600 focus:outline-none text-xs ${isAr ? 'text-right' : ''}`}
                />
              </div>

              {/* Emoji / Icon Picker */}
              <EmojiPicker
                selectedEmoji={newIcon}
                onSelectEmoji={setNewIcon}
                lang={lang}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                    {isAr ? 'فترة الروتين اليومي' : 'Daily Routine Period'}
                  </label>
                  <select
                    value={newRoutineTime}
                    onChange={(e) => setNewRoutineTime(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none text-xs cursor-pointer font-semibold"
                  >
                    <option value="anytime">🌟 {isAr ? 'أي وقت خلال اليوم' : 'Anytime'}</option>
                    <option value="morning">☀️ {isAr ? 'روتين الصباح (Morning)' : 'Morning Routine'}</option>
                    <option value="afternoon">🌤️ {isAr ? 'روتين بعد الظهر (Afternoon)' : 'Afternoon Routine'}</option>
                    <option value="evening">🌙 {isAr ? 'روتين المساء (Evening)' : 'Evening Routine'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                    {isAr ? 'تاريخ البدء (جدولة مسبقة)' : 'Start Date (Schedule ahead)'}
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-indigo-600 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              {/* Target Frequency Setting */}
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {isAr ? 'تكرار العادة' : 'Habit Frequency'}
                  </label>
                  <div className="inline-flex p-0.5 bg-neutral-200/80 dark:bg-neutral-700 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setNewFrequencyType('weekly')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        newFrequencyType === 'weekly' ? 'bg-white dark:bg-neutral-800 shadow-xs font-bold text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {isAr ? 'عدد مرات أسبوعياً' : 'Weekly Count'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFrequencyType('specific_days')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        newFrequencyType === 'specific_days' ? 'bg-white dark:bg-neutral-800 shadow-xs font-bold text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {isAr ? 'أيام محددة بالأسبوع' : 'Specific Days'}
                    </button>
                  </div>
                </div>

                {newFrequencyType === 'weekly' ? (
                  <div>
                    <select
                      value={targetPerWeek}
                      onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none text-xs cursor-pointer font-semibold"
                    >
                      <option value={7}>{isAr ? '٧ أيام / أسبوع (يومياً)' : '7 days / week (Daily)'}</option>
                      <option value={6}>{isAr ? '٦ أيام / أسبوع' : '6 days / week'}</option>
                      <option value={5}>{isAr ? '٥ أيام / أسبوع (أيام العمل)' : '5 days / week (Weekdays)'}</option>
                      <option value={4}>{isAr ? '٤ أيام / أسبوع' : '4 days / week'}</option>
                      <option value={3}>{isAr ? '٣ أيام / أسبوع' : '3 days / week'}</option>
                      <option value={2}>{isAr ? '٢ أيام / أسبوع' : '2 days / week'}</option>
                      <option value={1}>{isAr ? 'يوم واحد / أسبوع' : '1 day / week'}</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400 block font-medium">
                      {isAr ? 'اختر الأيام المحددة التي ترغب بالالتزام فيها:' : 'Select the exact days of the week to practice:'}
                    </span>
                    <div className="grid grid-cols-7 gap-1">
                      {[
                        { day: 1, name: isAr ? 'إثنين' : 'Mon' },
                        { day: 2, name: isAr ? 'ثلاثاء' : 'Tue' },
                        { day: 3, name: isAr ? 'أربعاء' : 'Wed' },
                        { day: 4, name: isAr ? 'خميس' : 'Thu' },
                        { day: 5, name: isAr ? 'جمعة' : 'Fri' },
                        { day: 6, name: isAr ? 'سبت' : 'Sat' },
                        { day: 0, name: isAr ? 'أحد' : 'Sun' },
                      ].map((item) => {
                        const isSelected = newTargetDays.includes(item.day);
                        return (
                          <button
                            key={item.day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                if (newTargetDays.length > 1) {
                                  setNewTargetDays(newTargetDays.filter((d) => d !== item.day));
                                }
                              } else {
                                setNewTargetDays([...newTargetDays, item.day]);
                              }
                            }}
                            className={`py-1.5 rounded-lg text-[11px] font-bold transition-all border text-center cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400'
                            }`}
                          >
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                    {isAr ? 'اللون المميز' : 'Color Accent'}
                  </label>
                  <select
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none text-xs cursor-pointer font-semibold"
                  >
                    <option value="amber">{isAr ? 'كهرماني دافئ' : 'Amber Warm'}</option>
                    <option value="emerald">{isAr ? 'زمردي أخضر' : 'Emerald Green'}</option>
                    <option value="blue">{isAr ? 'أزرق ياقوتي' : 'Sapphire Blue'}</option>
                    <option value="purple">{isAr ? 'بنفسجي ملكي' : 'Royal Purple'}</option>
                    <option value="rose">{isAr ? 'مرجاني وردي' : 'Rose Coral'}</option>
                    <option value="indigo">{isAr ? 'نيلي كلاسيكي' : 'Indigo Slate'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white shadow-xs cursor-pointer transition-all"
                >
                  {isSubmitting ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء العادة' : 'Create Habit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Habit Detail Modal */}
      {selectedHabitForDetail && (
        <HabitDetailModal
          habit={selectedHabitForDetail}
          isOpen={Boolean(selectedHabitForDetail)}
          onClose={() => setSelectedHabitForDetail(null)}
          onToggleDate={onToggleHabit}
          onUpdateHabit={onUpdateHabit}
          onDeleteHabit={onDeleteHabit}
          lang={lang}
        />
      )}

      {/* Delete Habit Confirmation */}
      <ConfirmModal
        isOpen={Boolean(habitToDelete)}
        title={isAr ? 'أرشفة / حذف العادة' : 'Archive / Delete Habit'}
        message={isAr ? `هل أنت متأكد من رغبتك في أرشفة عادة "${habitToDelete?.title}"؟ ستبقى سجلاتها في قسم الأرشيف.` : `Are you sure you want to archive "${habitToDelete?.title}"? Its historical streaks will be saved in the archive.`}
        confirmLabel={isAr ? 'أرشفة العادة' : 'Archive Habit'}
        onConfirm={() => {
          if (habitToDelete?.id) {
            onDeleteHabit(habitToDelete.id);
          }
          setHabitToDelete(null);
        }}
        onCancel={() => setHabitToDelete(null)}
      />

      {/* Bulk Delete Habits Confirmation */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title={isAr ? 'أرشفة العادات المحددة' : 'Archive Selected Habits'}
        message={isAr ? `هل ترغب في أرشفة ${selectedHabitIds.length} عادات محددة؟` : `Are you sure you want to archive ${selectedHabitIds.length} selected habits?`}
        confirmLabel={isAr ? `أرشفة ${selectedHabitIds.length} عادة` : `Archive ${selectedHabitIds.length} Habits`}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />

      {/* Floating Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedHabitIds.length}
        totalCount={filteredHabits.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkEdit={() => setShowBulkEditModal(true)}
        onBulkDelete={() => setShowBulkDeleteModal(true)}
        onBulkExport={handleBulkExport}
        onMakeHighPriority={handleBulkMakeHighPriority}
        itemTypeLabel="habits"
        lang={lang}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        type="habits"
        selectedCount={selectedHabitIds.length}
        onApplyChanges={handleApplyBulkEdit}
        lang={lang}
      />

      {/* Streak Freeze Excuse Modal */}
      {freezeModalHabit && (
        <StreakFreezeModal
          habit={freezeModalHabit.habit}
          dateKey={freezeModalHabit.dateKey}
          isOpen={Boolean(freezeModalHabit)}
          onClose={() => setFreezeModalHabit(null)}
          onApplyFreeze={handleApplyFreeze}
          onRemoveFreeze={handleRemoveFreeze}
          lang={lang}
        />
      )}

      {/* Bulk Excuse & Context Logger Modal */}
      {showBulkExcuseModal && (
        <BulkExcuseLoggerModal
          habits={activeHabits}
          isOpen={showBulkExcuseModal}
          onClose={() => setShowBulkExcuseModal(false)}
          onApplyFreeze={handleApplyFreeze}
          lang={lang}
        />
      )}

      {/* Gamification & Milestone Rewards Modal */}
      {showRewardsModal && (
        <RewardStoreModal
          isOpen={showRewardsModal}
          onClose={() => setShowRewardsModal(false)}
          rewards={rewards}
          habits={habits}
          tasks={[]}
          onAddReward={onAddReward || (async () => {})}
          onClaimReward={onClaimReward || (async () => {})}
          onDeleteReward={onDeleteReward || (async () => {})}
          lang={lang}
        />
      )}

      {/* Workout Session Logging Prompt Modal */}
      {promptWorkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#18191D] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-neutral-800 shadow-2xl text-slate-900 dark:text-white space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Dumbbell size={24} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? 'عاش يا بطل! 💪' : 'Crushed It! 💪'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? 'تم تعليم عادة التمرين لهذا اليوم' : 'Workout habit marked completed'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{promptWorkoutModal.habit.icon || '🏋️'}</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {promptWorkoutModal.habit.title}
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold ml-auto rtl:ml-0 rtl:mr-auto shrink-0">
                  {promptWorkoutModal.date}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {isAr
                  ? 'لم تقم بتسجيل تفاصيل التكرارات والأوزان للحصة في محرك التمرين (The Iron Engine) بعد. هل تريد الانتقال الآن لتوثيق مجموعاتك وأوزانك وتطبيق زيادة الحمل التدريجي (Progressive Overload)؟'
                  : 'You have not logged the exercises, weights, and sets for this session in The Iron Engine yet. Would you like to navigate there now to log your sets and track progressive overload?'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const cb = onNavigateModule;
                  setPromptWorkoutModal(null);
                  if (cb) cb('training');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all active:scale-95"
              >
                <Dumbbell size={16} />
                <span>{isAr ? 'تسجيل تفاصيل الحصة الآن (Iron Engine)' : 'Log Workout Details Now'}</span>
                <ArrowRight size={14} className="rtl:rotate-180" />
              </button>

              <button
                type="button"
                onClick={() => setPromptWorkoutModal(null)}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                {isAr ? 'لاحقاً' : 'Later'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
