import React, { useState, useMemo } from 'react';
import { HabitItem } from '../types';
import { Flame, Award, Sparkles, Check, ChevronLeft, ChevronRight, Calendar, Info, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HabitSnailVisualizerProps {
  habits: HabitItem[];
  activeHabitId?: string;
  onSelectHabit?: (id: string) => void;
  onToggleDate?: (habit: HabitItem, isoDate: string) => void;
  lang?: 'en' | 'ar';
}

export const HabitSnailVisualizer: React.FC<HabitSnailVisualizerProps> = ({
  habits = [],
  activeHabitId,
  onSelectHabit,
  onToggleDate,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const [selectedHabitId, setSelectedHabitId] = useState<string>(
    activeHabitId || (habits[0]?.id || '')
  );

  // Selected habit
  const habit = useMemo(() => {
    return habits.find((h) => h.id === selectedHabitId) || habits[0] || null;
  }, [habits, selectedHabitId]);

  // Generate 30 days window for the Snail Shell
  const snailDays = useMemo(() => {
    const days: { dayIndex: number; iso: string; dateObj: Date; displayDay: string; isToday: boolean; isCompleted: boolean; isFrozen: boolean }[] = [];
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    // Go back 29 days up to today (30 days total in the snail shell cycle)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const isCompleted = Boolean(habit?.history?.[iso]);
      const isFrozen = Boolean(habit?.freezes?.[iso]);
      const dayIndex = 30 - i; // 1 to 30

      const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const displayDay = isAr
        ? `${d.getDate()} ${monthNamesAr[d.getMonth()]}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      days.push({
        dayIndex,
        iso,
        dateObj: d,
        displayDay,
        isToday: iso === todayIso,
        isCompleted,
        isFrozen,
      });
    }
    return days;
  }, [habit, isAr]);

  // Compute Snail Sizing & Spiral Positions (Concentric Archimedean Snail Shell)
  const spiralPoints = useMemo(() => {
    const total = snailDays.length; // 30
    const centerX = 160;
    const centerY = 160;
    const maxRadius = 125;
    const minRadius = 32;
    const turns = 2.2; // 2.2 turns

    return snailDays.map((day, idx) => {
      const t = idx / (total - 1); // 0 to 1
      const angle = (1 - t) * (turns * 2 * Math.PI); // Spiral from outer rim to center core
      const radius = maxRadius - t * (maxRadius - minRadius);

      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const nodeRadius = 15 - t * 4; // Node radius gently scales down towards center

      return {
        ...day,
        x,
        y,
        nodeRadius,
      };
    });
  }, [snailDays]);

  // Calculate statistics
  const completedCount = useMemo(() => {
    return snailDays.filter((d) => d.isCompleted).length;
  }, [snailDays]);

  const completionPercentage = useMemo(() => {
    return Math.round((completedCount / snailDays.length) * 100);
  }, [completedCount, snailDays.length]);

  const handleCellClick = (dayItem: typeof snailDays[0]) => {
    if (habit && onToggleDate) {
      onToggleDate(habit, dayItem.iso);
      if (!dayItem.isCompleted) {
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#6366F1'],
        });
      }
    }
  };

  if (habits.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-neutral-400 font-medium">
        {isAr ? 'لا توجد عادات معرفة حالياً لعرض حلزون العادات.' : 'No habits created yet to render the Habit Snail.'}
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-[#18191D] p-5 sm:p-7 rounded-3xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-xs space-y-6 font-sans select-none animate-fadeIn">
      
      {/* Top Header & Habit Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐌</span>
            <h2 className="text-base sm:text-lg font-black text-[#2F3437] dark:text-[#F3F4F6]">
              {isAr ? 'حلزون العادات البصري (l\'Escargot des Habitudes)' : 'Habit Snail Visualizer'}
            </h2>
          </div>
          <p className="text-xs text-[#787774] dark:text-neutral-400">
            {isAr
              ? 'طريقة بصرية مبتكرة لتتبع استمرارية العادة يوماً بيوم نحو النواة الذهبية'
              : 'A visual concentric spiral shell to track daily habit consistency towards the golden core'}
          </p>
        </div>

        {/* Habit Switcher Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={habit?.id || ''}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedHabitId(id);
              if (onSelectHabit) onSelectHabit(id);
            }}
            className="px-3.5 py-2 bg-[#F7F6F3] dark:bg-[#1E2025] rounded-2xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-bold text-[#2F3437] dark:text-white focus:outline-none cursor-pointer"
          >
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.icon || '🔥'} {h.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Snail Interactive Canvas Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left / Center: Interactive SVG Snail Shell */}
        <div className="md:col-span-7 flex flex-col items-center justify-center relative my-2">
          
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
            
            <svg className="w-full h-full" viewBox="0 0 320 320">
              <defs>
                <linearGradient id="snailTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connecting Spiral Line */}
              <path
                d={spiralPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                fill="none"
                stroke={isAr ? 'rgba(52, 211, 153, 0.25)' : 'rgba(99, 102, 241, 0.25)'}
                strokeWidth="3"
                strokeDasharray="4 4"
              />

              {/* Golden Snail Core Center Badge (Goal Destination) */}
              <g transform="translate(160, 160)">
                <circle
                  r="20"
                  fill="url(#snailTrackGrad)"
                  opacity={completionPercentage >= 80 ? 1 : 0.7}
                  filter="url(#glow)"
                />
                <text
                  textAnchor="middle"
                  dy="5"
                  fontSize="14"
                  fill="#FFFFFF"
                  className="font-bold select-none pointer-events-none"
                >
                  🐚
                </text>
              </g>

              {/* Interactive Segment Cells along Spiral */}
              {spiralPoints.map((pt) => {
                const isDone = pt.isCompleted;
                const isToday = pt.isToday;

                return (
                  <g
                    key={pt.iso}
                    onClick={() => handleCellClick(pt)}
                    className="cursor-pointer group transition-transform hover:scale-110"
                    style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                  >
                    {/* Node Background Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.nodeRadius + (isToday ? 2 : 0)}
                      fill={
                        isDone
                          ? '#10B981'
                          : pt.isFrozen
                          ? '#3B82F6'
                          : isToday
                          ? '#F59E0B'
                          : '#262830'
                      }
                      stroke={
                        isToday
                          ? '#F59E0B'
                          : isDone
                          ? '#059669'
                          : 'rgba(255,255,255,0.15)'
                      }
                      strokeWidth={isToday ? 3 : 1.5}
                      className="transition-all duration-300"
                      filter={isDone || isToday ? 'url(#glow)' : 'none'}
                    />

                    {/* Node Content / Day Number or Checkmark */}
                    {isDone ? (
                      <path
                        d={`M ${pt.x - 4} ${pt.y} L ${pt.x - 1} ${pt.y + 3} L ${pt.x + 4} ${pt.y - 3}`}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pointer-events-none"
                      />
                    ) : (
                      <text
                        x={pt.x}
                        y={pt.y + 3}
                        textAnchor="middle"
                        fontSize={pt.nodeRadius > 12 ? '9' : '8'}
                        fill={isToday ? '#FFFFFF' : '#9CA3AF'}
                        className="font-mono font-bold select-none pointer-events-none"
                      >
                        {pt.dayIndex}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

          </div>

          <p className="text-[11px] text-[#787774] dark:text-neutral-400 mt-1 font-medium text-center">
            {isAr
              ? '💡 انقر على أي خلية فـ حلزون العادات لتبديل حالة الإنجاز فوراً'
              : '💡 Click any segment in the snail spiral to toggle completed status'}
          </p>
        </div>

        {/* Right: Stats, Legend & Progress Bar */}
        <div className="md:col-span-5 space-y-4">
          
          {/* Active Habit Title Badge */}
          <div className="p-4 rounded-2xl bg-[#F7F6F3] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                {isAr ? 'العادة النشطة:' : 'Active Snail Habit:'}
              </span>
              <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                🔥 {habit?.streak || 0} {isAr ? 'أيام متتالية' : 'day streak'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-[#2F3437] dark:text-white flex items-center gap-2">
              <span className="text-base">{habit?.icon || '🔥'}</span>
              <span>{habit?.title}</span>
            </h3>

            {/* Snail Spiral Cycle Completion Progress */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {isAr ? 'إنجاز دورة الحلزون (30 يوم):' : 'Snail Shell Completion (30d):'}
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{completedCount} / 30 ({completionPercentage}%)</span>
              </div>
              <div className="w-full h-2.5 bg-neutral-200 dark:bg-[#282C34] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div className="p-4 rounded-2xl bg-[#F7F6F3] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2.5 text-xs font-medium">
            <span className="text-[11px] font-bold text-[#2F3437] dark:text-neutral-300 block mb-1">
              {isAr ? 'دليل رموز حلزون العادات:' : 'Habit Snail Legend:'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs inline-block shrink-0" />
                <span>{isAr ? 'يوم مكتمل ✓' : 'Completed Day ✓'}</span>
              </div>

              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs inline-block shrink-0" />
                <span>{isAr ? 'اليوم الحالي 🔥' : 'Today 🔥'}</span>
              </div>

              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-xs inline-block shrink-0" />
                <span>{isAr ? 'مجمد (Freeze)' : 'Streak Frozen'}</span>
              </div>

              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <span className="w-3.5 h-3.5 rounded-full bg-[#262830] border border-neutral-600 inline-block shrink-0" />
                <span>{isAr ? 'في الانتظار' : 'Pending Day'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
