import React, { useState } from 'react';
import { Trophy, Plus, Trash2, X, Lock, Sparkles, Check, Edit2, RotateCcw, Award } from 'lucide-react';
import { RewardItem, HabitItem, TaskItem } from '../types';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface RewardStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: RewardItem[];
  habits: HabitItem[];
  tasks: TaskItem[];
  onAddReward: (reward: Omit<RewardItem, 'id'>) => Promise<void>;
  onUpdateReward?: (rewardId: string, updated: Partial<RewardItem>) => Promise<void>;
  onClaimReward: (rewardId: string) => Promise<void>;
  onDeleteReward: (rewardId: string) => Promise<void>;
  onResetRewards?: () => void;
  onClearAllRewards?: () => void;
  lang?: 'en' | 'ar';
}

const REWARD_CATEGORIES: RewardItem['category'][] = [
  'Personal Treat',
  'Shopping',
  'Entertainment',
  'Wellness',
  'Experience'
];

const PRESET_ICONS = ['☕', '🎁', '🎮', '🏖️', '🎧', '🍕', '🎬', '📚', '👟', '💆', '✈️', '🌟'];

export const RewardStoreModal: React.FC<RewardStoreModalProps> = ({
  isOpen,
  onClose,
  rewards,
  habits,
  tasks,
  onAddReward,
  onUpdateReward,
  onClaimReward,
  onDeleteReward,
  onResetRewards,
  onClearAllRewards,
  lang = 'en',
}) => {
  useBodyScrollLock(isOpen);
  const isAr = lang === 'ar';
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('☕');
  const [newCategory, setNewCategory] = useState<RewardItem['category']>('Personal Treat');
  const [newMilestoneType, setNewMilestoneType] = useState<RewardItem['milestoneType']>('streak');
  const [newTargetCount, setNewTargetCount] = useState<number>(7);
  const [newLinkedHabitId, setNewLinkedHabitId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate user's current progress metrics
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const totalHabitCompletions = habits.reduce(
    (total, h) => total + Object.values(h.history || {}).filter(Boolean).length,
    0
  );
  const totalCompletedTasks = tasks.filter((t) => t.completed).length;

  const getProgressForReward = (reward: RewardItem) => {
    if (reward.milestoneType === 'streak') {
      if (reward.linkedHabitId) {
        const linked = habits.find((h) => h.id === reward.linkedHabitId);
        return linked?.streak || 0;
      }
      return maxStreak;
    }
    if (reward.milestoneType === 'total_completions') {
      if (reward.linkedHabitId) {
        const linked = habits.find((h) => h.id === reward.linkedHabitId);
        return Object.values(linked?.history || {}).filter(Boolean).length;
      }
      return totalHabitCompletions;
    }
    return totalCompletedTasks;
  };

  const handleStartEdit = (reward: RewardItem) => {
    setEditingRewardId(reward.id || null);
    setNewTitle(reward.title);
    setNewDescription(reward.description || '');
    setNewIcon(reward.icon || '🎁');
    setNewCategory(reward.category || 'Personal Treat');
    setNewMilestoneType(reward.milestoneType || 'streak');
    setNewTargetCount(reward.targetCount || 7);
    setNewLinkedHabitId(reward.linkedHabitId || '');
    setShowAddForm(true);
  };

  const handleResetForm = () => {
    setEditingRewardId(null);
    setNewTitle('');
    setNewDescription('');
    setNewIcon('☕');
    setNewCategory('Personal Treat');
    setNewMilestoneType('streak');
    setNewTargetCount(7);
    setNewLinkedHabitId('');
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingRewardId && onUpdateReward) {
        await onUpdateReward(editingRewardId, {
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          icon: newIcon || '🎁',
          category: newCategory,
          milestoneType: newMilestoneType,
          targetCount: Math.max(1, newTargetCount),
          linkedHabitId: newLinkedHabitId || undefined,
        });
      } else {
        await onAddReward({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          icon: newIcon || '🎁',
          category: newCategory,
          milestoneType: newMilestoneType,
          targetCount: Math.max(1, newTargetCount),
          linkedHabitId: newLinkedHabitId || undefined,
          isClaimed: false,
          createdAt: Date.now(),
        });
      }
      handleResetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async (reward: RewardItem) => {
    if (!reward.id) return;
    try {
      if (reward.isClaimed && onUpdateReward) {
        await onUpdateReward(reward.id, { isClaimed: false, claimedAt: undefined });
      } else {
        await onClaimReward(reward.id);
        soundManager.playRewardClaim();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6']
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn" 
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#18191D] rounded-3xl border border-neutral-200 dark:border-[#2A2C33] shadow-2xl overflow-hidden animate-scaleUp flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 p-5 text-white flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Trophy size={24} className="text-white animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full font-mono">
                {isAr ? 'متجر الجوائز والمحطات التحفيزية' : 'Personal Milestone & Reward Vault'}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {isAr ? 'مكافآت الإنجاز الشخصية' : 'Milestone Rewards & Treats'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-center shrink-0">
          <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">
              {isAr ? 'أعلى سلسلة حالية' : 'Top Habit Streak'}
            </span>
            <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
              🔥 {maxStreak} {isAr ? 'أيام' : 'days'}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">
              {isAr ? 'إجمالي إنجاز العادات' : 'Habit Checkoffs'}
            </span>
            <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ✓ {totalHabitCompletions}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">
              {isAr ? 'المهام المكتملة' : 'Completed Tasks'}
            </span>
            <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
              🎯 {totalCompletedTasks}
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain bg-white dark:bg-[#18191D]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md">
              {isAr 
                ? 'كافئ نفسك عند تحقيق إنجازات مستمرة! يمكنك إضافة مكافآت مخصصة، تعديلها، أو حذفها بحرية.' 
                : 'Set tangible incentives when you hit continuous milestones. You can freely edit, add, or delete rewards.'}
            </div>

            <button
              type="button"
              onClick={() => {
                if (showAddForm) handleResetForm();
                else setShowAddForm(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white flex items-center gap-1.5 hover:bg-amber-700 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Plus size={13} />
              <span>{showAddForm ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? 'إضافة مكافأة جديدة' : 'Add Reward')}</span>
            </button>
          </div>

          {/* Add / Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                  {editingRewardId 
                    ? (isAr ? 'تعديل المكافأة' : 'Edit Milestone Reward')
                    : (isAr ? 'إنشاء مكافأة تحفيزية جديدة' : 'Create New Milestone Reward')}
                </h4>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'اسم المكافأة' : 'Reward Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: وجبة طعام مفضلة، شراء سماعات، عطلة نهاية أسبوع...' : 'e.g., Specialty Coffee, New Gaming Mouse, Weekend Trip...'}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'الأيقونة' : 'Icon'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="w-12 text-center text-sm px-2 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                    <div className="flex gap-1 overflow-x-auto py-1">
                      {PRESET_ICONS.slice(0, 5).map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setNewIcon(ic)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 text-xs"
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'الوصف' : 'Description'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'تفاصيل المكافأة ومتى تستحقها...' : 'Details on how you will reward yourself...'}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as RewardItem['category'])}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    {REWARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'نوع شرط الإنجاز' : 'Milestone Condition'}
                  </label>
                  <select
                    value={newMilestoneType}
                    onChange={(e) => setNewMilestoneType(e.target.value as RewardItem['milestoneType'])}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="streak">{isAr ? 'سلسلة أيام متتالية' : 'Habit Streak (Days)'}</option>
                    <option value="total_completions">{isAr ? 'إجمالي تكرار العادات' : 'Total Habit Checkoffs'}</option>
                    <option value="task_count">{isAr ? 'عدد المهام المكتملة' : 'Completed Tasks Count'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    {isAr ? 'الهدف المطلوب' : 'Target Count'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTargetCount}
                    onChange={(e) => setNewTargetCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {editingRewardId ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'حفظ المكافأة' : 'Save Reward')}
                </button>
              </div>
            </form>
          )}

          {/* List of Rewards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                {isAr ? 'قائمة الجوائز والمحطات' : 'Active Rewards & Milestones'}
              </h4>
              <div className="flex items-center gap-2">
                {onResetRewards && (
                  <button
                    type="button"
                    onClick={onResetRewards}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>{isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
                  </button>
                )}
                {onClearAllRewards && rewards.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAllRewards}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>{isAr ? 'مسح الكل' : 'Clear All'}</span>
                  </button>
                )}
              </div>
            </div>

            {rewards.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40">
                <Award size={28} className="mx-auto text-amber-400 opacity-60 mb-2" />
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {isAr ? 'لم تقم بإضافة مكافآت بعد' : 'No rewards configured yet'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {isAr ? 'انقر على "إضافة مكافأة جديدة" لتحديد مكافآت تحفزك.' : 'Click "Add Reward" to set self-rewards for streaks and targets.'}
                </p>
              </div>
            ) : (
              rewards.map((reward) => {
                const currentProgress = getProgressForReward(reward);
                const isUnlocked = currentProgress >= reward.targetCount;
                const percent = Math.min(100, Math.round((currentProgress / reward.targetCount) * 100));

                return (
                  <div
                    key={reward.id || reward.title}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      reward.isClaimed
                        ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 opacity-75'
                        : isUnlocked
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-xs'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl shrink-0">
                        {reward.icon || '🎁'}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {reward.title}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {reward.category}
                          </span>
                        </div>

                        {reward.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            {reward.description}
                          </p>
                        )}

                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-neutral-500">
                              {reward.milestoneType === 'streak'
                                ? (isAr ? `الهدف: سلسلة ${reward.targetCount} أيام` : `Target: ${reward.targetCount} Day Streak`)
                                : reward.milestoneType === 'total_completions'
                                ? (isAr ? `الهدف: ${reward.targetCount} إنجاز عادة` : `Target: ${reward.targetCount} Habit Checkoffs`)
                                : (isAr ? `الهدف: ${reward.targetCount} مهمة مكتملة` : `Target: ${reward.targetCount} Completed Tasks`)}
                            </span>
                            <span className="font-bold text-neutral-700 dark:text-neutral-300">
                              {currentProgress}/{reward.targetCount} ({percent}%)
                            </span>
                          </div>

                          <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                reward.isClaimed
                                  ? 'bg-neutral-400'
                                  : isUnlocked
                                  ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(reward)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                        title={isAr ? 'تعديل المكافأة' : 'Edit reward'}
                      >
                        <Edit2 size={13} />
                      </button>

                      {reward.isClaimed ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(reward)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title={isAr ? 'إلغاء حالة الاستلام' : 'Undo claim'}
                        >
                          <Check size={12} className="text-emerald-500" />
                          <span>{isAr ? 'تم استلامها' : 'Claimed'}</span>
                        </button>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(reward)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
                        >
                          <Sparkles size={13} />
                          <span>{isAr ? 'استلام المكافأة 🎉' : 'Claim Reward 🎉'}</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center gap-1">
                          <Lock size={12} />
                          <span>{isAr ? 'مقفلة' : 'Locked'}</span>
                        </span>
                      )}

                      {reward.id && (
                        <button
                          type="button"
                          onClick={() => onDeleteReward(reward.id!)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title={isAr ? 'حذف المكافأة' : 'Delete reward'}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-500">
            {isAr ? 'تتم مزامنة نقاطك وجوائزك تلقائياً.' : 'Milestones update automatically.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
