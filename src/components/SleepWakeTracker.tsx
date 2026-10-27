import React, { useState, useMemo } from 'react';
import {
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Calendar,
  Sparkles,
  Zap,
  Check,
  X,
  BatteryCharging,
  Info
} from 'lucide-react';
import { DailySleepLog, SleepScheduleConfig } from '../types';
import { soundManager } from '../utils/soundEffects';

interface SleepWakeTrackerProps {
  sleepLogs: DailySleepLog[];
  sleepConfig: SleepScheduleConfig | null;
  onSaveSleepLog: (log: Omit<DailySleepLog, 'id'>) => Promise<any>;
  onSaveSleepConfig: (config: Partial<SleepScheduleConfig>) => Promise<any>;
  onDeleteSleepLog?: (id: string) => Promise<any>;
  lang?: 'en' | 'ar';
  compactMode?: boolean;
}

export const SleepWakeTracker: React.FC<SleepWakeTrackerProps> = ({
  sleepLogs,
  sleepConfig,
  onSaveSleepLog,
  onSaveSleepConfig,
  onDeleteSleepLog,
  lang = 'ar',
  compactMode = false,
}) => {
  const isAr = lang === 'ar';

  // Default target schedule if not set
  const currentConfig: SleepScheduleConfig = useMemo(() => {
    return sleepConfig || {
      targetBedtime: '23:00',
      targetWakeTime: '07:00',
      targetDurationHours: 8.0,
      weeklyTargetHours: 56.0,
      enabled: true,
    };
  }, [sleepConfig]);

  // Today ISO
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Today's log if already recorded
  const todayLog = useMemo(() => {
    return sleepLogs.find(l => l.date === todayIso);
  }, [sleepLogs, todayIso]);

  // Form states for manual / quick logging
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  // Editable fields in Log Modal
  const [modalBedtime, setModalBedtime] = useState(currentConfig.targetBedtime);
  const [modalWakeTime, setModalWakeTime] = useState(currentConfig.targetWakeTime);
  const [modalQuality, setModalQuality] = useState<'great' | 'good' | 'fair' | 'poor'>('good');
  const [modalEnergy, setModalEnergy] = useState<number>(4);
  const [modalNotes, setModalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Config modal fields
  const [cfgBedtime, setCfgBedtime] = useState(currentConfig.targetBedtime);
  const [cfgWakeTime, setCfgWakeTime] = useState(currentConfig.targetWakeTime);
  const [cfgTargetHours, setCfgTargetHours] = useState(currentConfig.targetDurationHours);

  // Week offset for 7-day strip (0 = this week, -1 = last week)
  const [weekOffset, setWeekOffset] = useState(0);

  // Compute 7 days of the currently selected week (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    // Monday start
    const currentDayOfWeek = (now.getDay() + 6) % 7; // Mon=0, Sun=6
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek + weekOffset * 7);

    const days = [];
    const arDays = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
    const enDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        iso,
        dayName: isAr ? arDays[i] : enDays[i],
        dayNumber: d.getDate(),
        isToday: iso === todayIso,
      });
    }
    return days;
  }, [weekOffset, isAr, todayIso]);

  // Helper to calculate minutes between Bedtime (e.g. 23:00) and Wake time (e.g. 07:00)
  const calculateDurationMinutes = (bedtimeStr: string, wakeTimeStr: string): number => {
    try {
      const [bH, bM] = bedtimeStr.split(':').map(Number);
      const [wH, wM] = wakeTimeStr.split(':').map(Number);
      if (isNaN(bH) || isNaN(wH)) return 480;

      let bedMinutes = bH * 60 + (bM || 0);
      let wakeMinutes = wH * 60 + (wM || 0);

      // If wake time is less than bedtime, it crossed midnight (typical sleep)
      if (wakeMinutes <= bedMinutes) {
        wakeMinutes += 24 * 60;
      }
      return wakeMinutes - bedMinutes;
    } catch {
      return 480;
    }
  };

  const formatHoursMinutes = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Quick 1-click check-ins
  const handleQuickWakeCheck = async (onTarget: boolean) => {
    soundManager.play('check');
    const wake = onTarget ? currentConfig.targetWakeTime : modalWakeTime;
    const bed = todayLog?.actualBedtime || currentConfig.targetBedtime;
    const duration = calculateDurationMinutes(bed, wake);

    await onSaveSleepLog({
      date: todayIso,
      targetBedtime: currentConfig.targetBedtime,
      targetWakeTime: currentConfig.targetWakeTime,
      actualBedtime: bed,
      actualWakeTime: wake,
      wokeOnTarget: onTarget,
      sleptOnTarget: todayLog ? todayLog.sleptOnTarget : true,
      sleepDurationMinutes: duration,
      quality: 'good',
      energyLevel: onTarget ? 5 : 3,
      createdAt: todayLog ? todayLog.createdAt : Date.now(),
      updatedAt: Date.now(),
    });
  };

  const handleQuickBedtimeCheck = async (onTarget: boolean) => {
    soundManager.play('check');
    const bed = onTarget ? currentConfig.targetBedtime : modalBedtime;
    const wake = todayLog?.actualWakeTime || currentConfig.targetWakeTime;
    const duration = calculateDurationMinutes(bed, wake);

    await onSaveSleepLog({
      date: todayIso,
      targetBedtime: currentConfig.targetBedtime,
      targetWakeTime: currentConfig.targetWakeTime,
      actualBedtime: bed,
      actualWakeTime: wake,
      wokeOnTarget: todayLog ? todayLog.wokeOnTarget : true,
      sleptOnTarget: onTarget,
      sleepDurationMinutes: duration,
      quality: todayLog?.quality || 'good',
      energyLevel: todayLog?.energyLevel || 4,
      createdAt: todayLog ? todayLog.createdAt : Date.now(),
      updatedAt: Date.now(),
    });
  };

  const handleOpenLogModalForDate = (iso: string) => {
    const existing = sleepLogs.find(l => l.date === iso);
    setSelectedDate(iso);
    if (existing) {
      setModalBedtime(existing.actualBedtime);
      setModalWakeTime(existing.actualWakeTime);
      setModalQuality(existing.quality || 'good');
      setModalEnergy(existing.energyLevel || 4);
      setModalNotes(existing.notes || '');
    } else {
      setModalBedtime(currentConfig.targetBedtime);
      setModalWakeTime(currentConfig.targetWakeTime);
      setModalQuality('good');
      setModalEnergy(4);
      setModalNotes('');
    }
    setShowLogModal(true);
  };

  const handleSaveModalLog = async () => {
    setIsSubmitting(true);
    try {
      const duration = calculateDurationMinutes(modalBedtime, modalWakeTime);
      // Auto determine if on target within 20 mins margin
      const targetWakeM = calculateDurationMinutes('00:00', currentConfig.targetWakeTime);
      const actualWakeM = calculateDurationMinutes('00:00', modalWakeTime);
      const wokeOnTime = Math.abs(actualWakeM - targetWakeM) <= 25;

      const targetBedM = calculateDurationMinutes('00:00', currentConfig.targetBedtime);
      const actualBedM = calculateDurationMinutes('00:00', modalBedtime);
      const sleptOnTime = Math.abs(actualBedM - targetBedM) <= 30;

      await onSaveSleepLog({
        date: selectedDate,
        targetBedtime: currentConfig.targetBedtime,
        targetWakeTime: currentConfig.targetWakeTime,
        actualBedtime: modalBedtime,
        actualWakeTime: modalWakeTime,
        wokeOnTarget: wokeOnTime,
        sleptOnTarget: sleptOnTime,
        sleepDurationMinutes: duration,
        quality: modalQuality,
        energyLevel: modalEnergy as any,
        notes: modalNotes.trim() || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      soundManager.play('check');
      setShowLogModal(false);
    } catch (err) {
      console.error('Failed to save sleep log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = async () => {
    const targetMins = calculateDurationMinutes(cfgBedtime, cfgWakeTime);
    const targetHours = Number((targetMins / 60).toFixed(1));
    const weeklyTarget = Number((targetHours * 7).toFixed(1));

    await onSaveSleepConfig({
      targetBedtime: cfgBedtime,
      targetWakeTime: cfgWakeTime,
      targetDurationHours: targetHours,
      weeklyTargetHours: weeklyTarget,
      enabled: true,
      updatedAt: Date.now(),
    });
    soundManager.play('pop');
    setShowConfigModal(false);
  };

  // Week telemetry calculations
  const weekStats = useMemo(() => {
    const weekLogs = currentWeekDays
      .map(d => sleepLogs.find(l => l.date === d.iso))
      .filter(Boolean) as DailySleepLog[];

    const loggedCount = weekLogs.length;
    const wokeOnTargetCount = weekLogs.filter(l => l.wokeOnTarget).length;
    const totalMinutes = weekLogs.reduce((acc, l) => acc + (l.sleepDurationMinutes || 0), 0);
    const totalHours = Number((totalMinutes / 60).toFixed(1));
    const targetWeeklyHours = currentConfig.weeklyTargetHours || (currentConfig.targetDurationHours * 7);
    const consistencyPct = loggedCount > 0 ? Math.round((wokeOnTargetCount / loggedCount) * 100) : 0;
    const avgMinutes = loggedCount > 0 ? Math.round(totalMinutes / loggedCount) : 0;

    return {
      loggedCount,
      wokeOnTargetCount,
      totalHours,
      targetWeeklyHours,
      consistencyPct,
      avgMinutes,
    };
  }, [currentWeekDays, sleepLogs, currentConfig]);

  return (
    <div className="space-y-4">
      {/* HEADER & SUMMARY CARD */}
      <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
              <Moon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#2F3437] dark:text-white">
                  {isAr ? 'إيقاع وجدول النوم والاستيقاظ' : 'Sleep & Wake Rhythm Station'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                  {isAr ? 'هدف أسبوعي منتظم' : 'Weekly Routine'}
                </span>
              </div>
              <p className="text-xs text-[#787774] dark:text-neutral-400 mt-0.5">
                {isAr
                  ? `الهدف المخطط: النوم عند ${currentConfig.targetBedtime} ➔ الاستيقاظ عند ${currentConfig.targetWakeTime} (${currentConfig.targetDurationHours} س/يومياً)`
                  : `Target: Sleep at ${currentConfig.targetBedtime} ➔ Wake at ${currentConfig.targetWakeTime} (${currentConfig.targetDurationHours}h/day)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setCfgBedtime(currentConfig.targetBedtime);
                setCfgWakeTime(currentConfig.targetWakeTime);
                setShowConfigModal(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-neutral-50 dark:bg-[#202228] text-xs font-medium text-[#2F3437] dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#282B33] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Settings size={13} className="text-neutral-500" />
              <span>{isAr ? 'تعديل الهدف' : 'Edit Target'}</span>
            </button>
            <button
              onClick={() => handleOpenLogModalForDate(todayIso)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} />
              <span>{isAr ? 'تسجيل نوم اليوم' : 'Log Today'}</span>
            </button>
          </div>
        </div>

        {/* TODAY'S QUICK CHECK-IN ACTION TILES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          {/* Morning Wake Up Check */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sunrise size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                  {isAr ? 'الاستيقاظ الصباحي اليوم' : 'Morning Wake Up'}
                </span>
                <span className="text-xs font-mono font-bold text-[#2F3437] dark:text-white">
                  {todayLog ? (
                    <span className="flex items-center gap-1">
                      {todayLog.actualWakeTime}
                      {todayLog.wokeOnTarget ? (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">({isAr ? 'في الموعد ✓' : 'On-time ✓'})</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">({isAr ? 'تأخر' : 'Delayed'})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-neutral-500 text-[11px]">
                      {isAr ? `المستهدف: ${currentConfig.targetWakeTime}` : `Target: ${currentConfig.targetWakeTime}`}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {todayLog?.actualWakeTime ? (
                <button
                  onClick={() => handleOpenLogModalForDate(todayIso)}
                  className="px-2.5 py-1 bg-white dark:bg-[#1E2025] hover:bg-neutral-100 dark:hover:bg-[#252830] border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={11} />
                  <span>{isAr ? 'تعديل' : 'Edit'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleQuickWakeCheck(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    title={isAr ? 'فقت في الوقت المحدد' : 'Woke up on time'}
                  >
                    <Check size={12} />
                    <span>{isAr ? `فقت فـ ${currentConfig.targetWakeTime}` : `Woke @ ${currentConfig.targetWakeTime}`}</span>
                  </button>
                  <button
                    onClick={() => handleOpenLogModalForDate(todayIso)}
                    className="px-2 py-1 bg-white dark:bg-[#202228] hover:bg-neutral-100 dark:hover:bg-[#282B33] border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 rounded-lg cursor-pointer"
                  >
                    {isAr ? 'وقت آخر' : 'Other'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Night Bedtime Check */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sunset size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 block">
                  {isAr ? 'موعد النوم اليوم' : 'Night Bedtime'}
                </span>
                <span className="text-xs font-mono font-bold text-[#2F3437] dark:text-white">
                  {todayLog ? (
                    <span className="flex items-center gap-1">
                      {todayLog.actualBedtime}
                      {todayLog.sleptOnTarget ? (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">({isAr ? 'في الموعد ✓' : 'On-time ✓'})</span>
                      ) : (
                        <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">({isAr ? 'سهر' : 'Late'})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-neutral-500 text-[11px]">
                      {isAr ? `المستهدف: ${currentConfig.targetBedtime}` : `Target: ${currentConfig.targetBedtime}`}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {todayLog?.actualBedtime ? (
                <button
                  onClick={() => handleOpenLogModalForDate(todayIso)}
                  className="px-2.5 py-1 bg-white dark:bg-[#1E2025] hover:bg-neutral-100 dark:hover:bg-[#252830] border border-indigo-300 dark:border-indigo-800 text-[11px] font-bold text-indigo-800 dark:text-indigo-300 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={11} />
                  <span>{isAr ? 'تعديل' : 'Edit'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleQuickBedtimeCheck(true)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    title={isAr ? 'نعست في الوقت المحدد' : 'Slept on target time'}
                  >
                    <Check size={12} />
                    <span>{isAr ? `نعست فـ ${currentConfig.targetBedtime}` : `Slept @ ${currentConfig.targetBedtime}`}</span>
                  </button>
                  <button
                    onClick={() => handleOpenLogModalForDate(todayIso)}
                    className="px-2 py-1 bg-white dark:bg-[#202228] hover:bg-neutral-100 dark:hover:bg-[#282B33] border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 rounded-lg cursor-pointer"
                  >
                    {isAr ? 'وقت آخر' : 'Other'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 4 STAT MINI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#787774] dark:text-neutral-400 block">
              {isAr ? 'الانضباط بالاستيقاظ' : 'Wake Discipline'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-black text-[#2F3437] dark:text-white font-mono">
                {weekStats.consistencyPct}%
              </span>
              <span className="text-[10px] text-neutral-500">
                ({weekStats.wokeOnTargetCount}/{weekStats.loggedCount} {isAr ? 'أيام' : 'days'})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#787774] dark:text-neutral-400 block">
              {isAr ? 'مجموع نوم الأسبوع' : 'Total Week Sleep'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {weekStats.totalHours}h
              </span>
              <span className="text-[10px] text-neutral-500">
                / {weekStats.targetWeeklyHours}h
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#787774] dark:text-neutral-400 block">
              {isAr ? 'متوسط ساعات النوم' : 'Avg Daily Sleep'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-black text-[#2F3437] dark:text-white font-mono">
                {weekStats.loggedCount > 0 ? formatHoursMinutes(weekStats.avgMinutes) : '—'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#202228] border border-[#EAE9E6] dark:border-[#2A2C33]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#787774] dark:text-neutral-400 block">
              {isAr ? 'فارق النوم (Debt/Surplus)' : 'Sleep Balance'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              {weekStats.loggedCount > 0 ? (
                (() => {
                  const expectedMins = weekStats.loggedCount * (currentConfig.targetDurationHours * 60);
                  const diffMins = (weekStats.avgMinutes * weekStats.loggedCount) - expectedMins;
                  const isPositive = diffMins >= 0;
                  return (
                    <span className={`text-base font-black font-mono ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {isPositive ? '+' : ''}{formatHoursMinutes(Math.abs(diffMins))}
                    </span>
                  );
                })()
              ) : (
                <span className="text-sm font-medium text-neutral-400">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7-DAY WEEKLY SLEEP STRIP & MATRIX */}
      <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-indigo-500" />
            <h4 className="text-xs font-bold text-[#2F3437] dark:text-white">
              {isAr ? 'سجل الأيام السبعة للأسبوع (Sleep & Wake Matrix)' : '7-Day Sleep & Wake Strip'}
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1 rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] hover:bg-neutral-100 dark:hover:bg-[#252830] text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title={isAr ? 'الأسبوع السابق' : 'Previous Week'}
            >
              {isAr ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                weekOffset === 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                  : 'border-[#EAE9E6] dark:border-[#2A2C33] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              {isAr ? 'هذا الأسبوع' : 'This Week'}
            </button>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              disabled={weekOffset >= 0}
              className="p-1 rounded-lg border border-[#EAE9E6] dark:border-[#2A2C33] hover:bg-neutral-100 dark:hover:bg-[#252830] text-neutral-600 dark:text-neutral-300 transition-colors disabled:opacity-30 cursor-pointer"
              title={isAr ? 'الأسبوع التالي' : 'Next Week'}
            >
              {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>

        {/* The 7 Day Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {currentWeekDays.map((day) => {
            const log = sleepLogs.find(l => l.date === day.iso);
            const isToday = day.isToday;

            return (
              <div
                key={day.iso}
                onClick={() => handleOpenLogModalForDate(day.iso)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[125px] ${
                  isToday
                    ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                    : log
                    ? 'border-[#EAE9E6] dark:border-[#2A2C33] bg-neutral-50/70 dark:bg-[#1E2025] hover:border-neutral-300 dark:hover:border-neutral-600'
                    : 'border-dashed border-neutral-200 dark:border-neutral-800 bg-transparent hover:bg-neutral-50/50 dark:hover:bg-[#18191D]'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-[#2F3437] dark:text-neutral-300'}`}>
                    {day.dayName}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${isToday ? 'bg-indigo-600 text-white font-bold' : 'text-neutral-500'}`}>
                    {day.dayNumber}
                  </span>
                </div>

                {/* Log Content or Empty placeholder */}
                {log ? (
                  <div className="my-2 space-y-1.5">
                    {/* Sleep Duration */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-black font-mono text-[#2F3437] dark:text-white">
                        {formatHoursMinutes(log.sleepDurationMinutes)}
                      </span>
                      {log.wokeOnTarget ? (
                        <CheckCircle2 size={13} className="text-emerald-500" title={isAr ? 'استيقاظ في الموعد' : 'On-time wake'} />
                      ) : (
                        <AlertCircle size={13} className="text-amber-500" title={isAr ? 'تأخر عن الموعد' : 'Delayed'} />
                      )}
                    </div>

                    {/* Bed and Wake Times */}
                    <div className="space-y-0.5 text-[10px] text-neutral-600 dark:text-neutral-400 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-500 flex items-center gap-0.5"><Moon size={10} /> {log.actualBedtime}</span>
                        <span className="text-amber-500 flex items-center gap-0.5"><Sun size={10} /> {log.actualWakeTime}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="my-auto py-2 text-center text-neutral-400 text-[10px] flex flex-col items-center gap-1">
                    <Plus size={13} className="opacity-60" />
                    <span>{isAr ? 'سجل' : 'Add'}</span>
                  </div>
                )}

                {/* Bottom status badge */}
                <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[9px]">
                  <span className="text-neutral-400">
                    {isToday ? (isAr ? 'اليوم' : 'Today') : log?.quality ? log.quality : '—'}
                  </span>
                  {log && (
                    <span className={`font-bold ${log.wokeOnTarget ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                      {log.wokeOnTarget ? (isAr ? 'منضبط' : 'On-time') : (isAr ? 'تأخر' : 'Delayed')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LOG MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Moon size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#2F3437] dark:text-white">
                    {isAr ? `تسجيل النوم والاستيقاظ (${selectedDate})` : `Log Sleep & Wake (${selectedDate})`}
                  </h3>
                  <span className="text-[10px] text-neutral-500">
                    {isAr ? `الهدف: نوم ${currentConfig.targetBedtime} / استيقاظ ${currentConfig.targetWakeTime}` : `Target: Bed ${currentConfig.targetBedtime} / Wake ${currentConfig.targetWakeTime}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Actual Bedtime & Wake Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 flex items-center gap-1.5">
                    <Moon size={12} className="text-indigo-500" />
                    <span>{isAr ? 'وقت النوم الفعلي' : 'Actual Bedtime'}</span>
                  </label>
                  <input
                    type="time"
                    value={modalBedtime}
                    onChange={(e) => setModalBedtime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-neutral-50 dark:bg-[#202228] text-xs font-mono text-[#2F3437] dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 flex items-center gap-1.5">
                    <Sunrise size={12} className="text-amber-500" />
                    <span>{isAr ? 'وقت الاستيقاظ الفعلي' : 'Actual Wake Time'}</span>
                  </label>
                  <input
                    type="time"
                    value={modalWakeTime}
                    onChange={(e) => setModalWakeTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-neutral-50 dark:bg-[#202228] text-xs font-mono text-[#2F3437] dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Calculated duration preview badge */}
              <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 flex items-center justify-between">
                <span className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">
                  {isAr ? 'إجمالي الساعات المحسوبة:' : 'Calculated Duration:'}
                </span>
                <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {formatHoursMinutes(calculateDurationMinutes(modalBedtime, modalWakeTime))}
                </span>
              </div>

              {/* Sleep Quality */}
              <div>
                <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1.5 block">
                  {isAr ? 'جودة النوم والشعور بالراحة' : 'Sleep Quality'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['great', 'good', 'fair', 'poor'] as const).map((q) => {
                    const labels: Record<string, { ar: string; en: string }> = {
                      great: { ar: 'ممتاز ✨', en: 'Great ✨' },
                      good: { ar: 'جيد 👍', en: 'Good 👍' },
                      fair: { ar: 'متوسط 😐', en: 'Fair 😐' },
                      poor: { ar: 'متعب 😴', en: 'Poor 😴' },
                    };
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setModalQuality(q)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          modalQuality === q
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-neutral-50 dark:bg-[#202228] text-neutral-600 dark:text-neutral-300 border border-[#EAE9E6] dark:border-[#2A2C33] hover:bg-neutral-100'
                        }`}
                      >
                        {isAr ? labels[q].ar : labels[q].en}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 block">
                  {isAr ? 'ملاحظات (سبب التأخر، جودة الراحة...)' : 'Notes / Context'}
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder={isAr ? 'مثلا: شربت قهوة متأخرة، أو قراءة كتاب قبل النوم...' : 'e.g. Read book before bed, late tea...'}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-neutral-50 dark:bg-[#202228] text-xs text-[#2F3437] dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE9E6] dark:border-[#2A2C33]">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveModalLog}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check size={14} />
                <span>{isAr ? 'حفظ السجل' : 'Save Sleep Log'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TARGET CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAE9E6] dark:border-[#2A2C33] pb-3">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-indigo-500" />
                <h3 className="text-xs font-bold text-[#2F3437] dark:text-white">
                  {isAr ? 'تحديد الجدول والهدف الأسبوعي للنوم' : 'Target Sleep & Wake Schedule'}
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 flex items-center gap-1.5">
                  <Moon size={12} className="text-indigo-500" />
                  <span>{isAr ? 'موعد النوم المستهدف (Bedtime Target)' : 'Target Bedtime'}</span>
                </label>
                <input
                  type="time"
                  value={cfgBedtime}
                  onChange={(e) => setCfgBedtime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-neutral-50 dark:bg-[#202228] text-xs font-mono text-[#2F3437] dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#2F3437] dark:text-white mb-1 flex items-center gap-1.5">
                  <Sunrise size={12} className="text-amber-500" />
                  <span>{isAr ? 'موعد الاستيقاظ المستهدف (Wake Target)' : 'Target Wake Time'}</span>
                </label>
                <input
                  type="time"
                  value={cfgWakeTime}
                  onChange={(e) => setCfgWakeTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] bg-neutral-50 dark:bg-[#202228] text-xs font-mono text-[#2F3437] dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-[#202228] rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-1 text-xs">
                <div className="flex items-center justify-between text-[#2F3437] dark:text-white font-medium">
                  <span>{isAr ? 'ساعات النوم اليومية الناتجة:' : 'Calculated Daily Hours:'}</span>
                  <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                    {(calculateDurationMinutes(cfgBedtime, cfgWakeTime) / 60).toFixed(1)} س/يوم
                  </strong>
                </div>
                <div className="flex items-center justify-between text-[#787774] dark:text-neutral-400 text-[11px]">
                  <span>{isAr ? 'الهدف الأسبوعي الإجمالي:' : 'Weekly Target:'}</span>
                  <strong className="font-mono">
                    {((calculateDurationMinutes(cfgBedtime, cfgWakeTime) / 60) * 7).toFixed(1)} س/أسبوع
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE9E6] dark:border-[#2A2C33]">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                <span>{isAr ? 'اعتماد الجدول' : 'Save Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
