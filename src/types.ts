export type ModuleType = 'dashboard' | 'daily-blocks' | 'analytics' | 'goals' | 'habits' | 'tasks' | 'planner' | 'projects' | 'checklists' | 'notes' | 'comments' | 'guide' | 'mentor' | 'settings' | 'focus' | 'training' | 'sunday-reset' | 'reflections' | 'archive';

export interface AppCategoryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  order: number;
}

export interface AppNavItemConfig {
  id: ModuleType;
  labelEn: string;
  labelAr: string;
  category: string;
  hidden: boolean;
  order: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
  weight: number | string; // e.g. 0 or 'Bodyweight' or added kg/lbs (e.g. 10, '+10kg')
  weightUnit?: 'kg' | 'lbs' | 'bw';
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10) optional
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  name: string; // e.g., 'Push-ups', 'Pull-ups', 'Dips', 'Pistol Squats'
  category?: 'Chest & Triceps' | 'Back & Biceps' | 'Legs & Core' | 'Shoulders' | 'Skills' | 'Full Body' | 'General';
  sets: WorkoutSet[];
  notes?: string;
  restSeconds?: number;
  isAutoFilled?: boolean;
}

export interface WorkoutSession {
  id?: string;
  routineName: string; // e.g., "Push Day", "Calisthenics Upper Power"
  routineCategory?: 'Push' | 'Pull' | 'Legs' | 'Full Body' | 'Calisthenics Skills' | 'Core & Mobility' | 'Custom';
  exercises: WorkoutExercise[];
  durationMinutes?: number;
  date: string; // YYYY-MM-DD
  createdAt: number;
  notes?: string;
  totalVolume?: number; // total calculated volume or load
  totalReps?: number;
  totalSets?: number;
}

export interface WorkoutRoutineTemplate {
  id: string;
  name: string;
  category: 'Push' | 'Pull' | 'Legs' | 'Full Body' | 'Calisthenics Skills' | 'Core & Mobility' | 'Custom';
  description?: string;
  exercises: {
    name: string;
    targetSets: number;
    targetReps: number;
    defaultWeight: string;
  }[];
}

export interface BodyMetricLog {
  id?: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  heightCm?: number;
  numberOfMeals?: number;
  notes?: string;
  createdAt: number;
}

export type PrimaryFocusMode = 'hypertrophy_sprint' | 'business_maintenance' | 'fat_loss_cut';
export type BreakfastStrategy = 'intermittent_fasting' | 'light_breakfast' | 'full_breakfast';
export type MiddayMealStrategy = 'light_protein_fiber' | 'high_carb_power' | 'standard_balanced' | 'skipped';
export type PreSunsetMealStrategy = 'fruit_dates_yogurt' | 'pre_workout_carbs' | 'light_protein_snack' | 'skipped';
export type EveningFeastStrategy = 'peak_muscle_feast' | 'light_casein_salad' | 'skipped';

export interface BodyProfileConfig {
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number; // e.g. 70 kg
  timelineMonths?: number; // e.g. 2 months
  targetDeadlineDate?: string; // YYYY-MM-DD
  primaryFocusMode?: PrimaryFocusMode;
  breakfastStrategy?: BreakfastStrategy;
  middayMealStrategy?: MiddayMealStrategy;
  preSunsetMealStrategy?: PreSunsetMealStrategy;
  eveningFeastStrategy?: EveningFeastStrategy;
  breakfastTime?: string; // e.g. "08:30"
  meal1Time?: string; // Midday / Lunch (e.g. "13:00")
  meal2Time?: string; // Pre-Sunset / Snack (e.g. "17:30")
  meal3Time?: string; // Evening Feast / Dinner (e.g. "20:30")
  numberOfMeals: number; // default 3 or 4
  goal?: 'lean_bulk' | 'cut' | 'maintain';
  dailyCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatsGrams?: number;
  updatedAt?: number;
}

export interface ScheduledWorkoutItem {
  id?: string;
  date: string; // YYYY-MM-DD
  routineId: string;
  routineName: string;
  category?: string;
  completed: boolean;
  time?: string;
  workoutSessionId?: string;
  linkedHabitId?: string;
  createdAt: number;
}

export interface FocusSession {
  id?: string;
  title: string;
  duration: number; // in minutes
  type: 'focus' | 'short-break' | 'long-break';
  associatedType: 'task' | 'habit' | 'project' | 'none';
  associatedId?: string;
  associatedTitle?: string;
  notes?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export type Priority = 'High' | 'Med' | 'Low';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: number;
}

export interface TaskSkipReason {
  date: string; // YYYY-MM-DD
  reason: string;
  movedToDate: string; // YYYY-MM-DD
  timestamp: number;
}

export interface TaskItem {
  id?: string;
  title: string;
  description?: string;
  subtasks?: TaskSubtask[];
  completed: boolean;
  priority: Priority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm (e.g. "09:00", "14:30")
  category?: string; // e.g. 'Business', 'Personal', 'Finance', 'Health'
  projectCategory?: string; // 'Business' | 'Personal' | 'Work' | 'Health'
  linkedProjectId?: string;
  projectId?: string;
  kanbanStatus?: 'todo' | 'in_progress' | 'completed';
  createdAt: number;
  completedAt?: number;
  focusedMinutes?: number; // Accumulated focused minutes
  order?: number; // Custom drag-and-drop sort order
  isMeasurable?: boolean; // Whether task has numeric target (e.g. pages, pomodoros)
  targetValue?: number; // e.g. 10
  currentValue?: number; // e.g. 4
  unit?: string; // e.g. 'pages', 'pomodoros', 'chapters', 'km', 'reps'
  rolloverCount?: number; // how many times rolled over
  skipReasons?: TaskSkipReason[]; // reasons when postponed/skipped
  archived?: boolean;
  archivedAt?: number;
}

export interface CommentMention {
  type: 'task' | 'habit' | 'note' | 'project' | 'goal';
  id: string;
  title: string;
}

export interface AppComment {
  id?: string;
  content: string;
  createdAt: number;
  author?: string;
  mentions?: CommentMention[];
  targetType?: 'task' | 'habit' | 'note' | 'project' | 'goal' | 'general';
  targetId?: string;
  targetTitle?: string;
  pinned?: boolean;
}

export type GoalCategory = 'Career & Business' | 'Health & Fitness' | 'Finance' | 'Personal Growth' | 'Relationships' | 'Mindset';
export type GoalTimeframe = 'Quarterly' | '1 Year' | '3 Years' | '5+ Years' | 'Lifetime';
export type GoalStatus = 'In Progress' | 'Achieved' | 'On Track' | 'At Risk' | 'Paused';

export interface GoalMilestone {
  id: string;
  title: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: number;
}

export interface GoalItem {
  id?: string;
  title: string;
  vision: string; // "Why this matters / The Endpoint Vision"
  endpointTarget: string; // Specific measurable end state
  category: GoalCategory;
  timeframe: GoalTimeframe;
  status: GoalStatus;
  targetDate?: string; // YYYY-MM-DD
  currentMetric?: number; // e.g. 50000
  targetMetric?: number; // e.g. 100000
  metricUnit?: string; // e.g. '$', 'kg', 'users', 'books'
  milestones: GoalMilestone[];
  color?: string; // 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue'
  linkedProjectIds?: string[];
  linkedHabitIds?: string[];
  createdAt: number;
  achievedAt?: number;
  notes?: string;
  archived?: boolean;
  snoozeUntil?: number; // timestamp until which it is paused
}

export type HabitRoutineTime = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface HabitItem {
  id?: string;
  title: string;
  category: string;
  icon?: string; // Emoji or icon identifier e.g. '💧', '📚', '🏋️', '🧘'
  routineTime?: HabitRoutineTime; // Morning, Afternoon, Evening, Anytime
  targetPerWeek: number; // e.g., 7
  history: Record<string, boolean>; // date key: 'YYYY-MM-DD' -> boolean
  freezes?: Record<string, boolean>; // date key: 'YYYY-MM-DD' -> boolean for streak freeze/pass days
  freezeExcuses?: Record<string, string>; // date key: 'YYYY-MM-DD' -> excuse / reason (e.g. 'Sick', 'Travel')
  dailyMoods?: Record<string, string>; // date key: 'YYYY-MM-DD' -> emoji (e.g. '😊', '⚡', '😴', '🔥')
  bankedFreezes?: number; // accumulated banked freeze credits
  streak: number;
  createdAt: number;
  startDate?: string; // YYYY-MM-DD (Habit starts on this day; before this, it's upcoming/scheduled)
  targetDays?: string[]; // e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] for custom day-of-week target frequency
  frequencyType?: 'weekly' | 'specific_days'; // whether targetPerWeek or specific targetDays are used
  question?: string; // e.g. "Did you meditate for 15 mins today?"
  description?: string;
  color?: string; // e.g. 'emerald', 'amber', 'indigo', 'rose', 'purple', 'teal', 'blue'
  archived?: boolean;
  snoozeUntil?: number; // timestamp until which it is paused
  pauseStartDate?: string; // YYYY-MM-DD (Custom pause start date)
  pauseEndDate?: string; // YYYY-MM-DD (Custom pause end date)
  notes?: Record<string, string>; // date key: 'YYYY-MM-DD' -> daily note/log
  order?: number; // Custom drag-and-drop sort order
  isMeasurable?: boolean; // Whether habit has numeric units (e.g. pages, km, minutes, glasses)
  targetValue?: number; // e.g. 10 (target per session / day)
  unit?: string; // e.g. 'pages', 'minutes', 'km', 'glasses', 'reps', 'pomodoros'
  dailyValues?: Record<string, number>; // date key: 'YYYY-MM-DD' -> numeric progress for that day
}

export interface LifePhase {
  id?: string;
  name: string; // e.g., "Q4 Business Sprint", "Exam Study Period", "Health & Energy Reset"
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  isActive: boolean;
  categoryWeights: Record<string, number>; // e.g. { 'Business': 70, 'Personal': 30, 'Health': 0 } (Percentages summing to 100)
  createdAt: number;
  notes?: string;
}

export interface RewardItem {
  id?: string;
  title: string;
  description?: string;
  icon?: string; // e.g. '☕', '🎁', '🎮', '🏖️', '🎧', '🍕', '🎬'
  category: 'Personal Treat' | 'Shopping' | 'Entertainment' | 'Wellness' | 'Experience';
  milestoneType: 'streak' | 'total_completions' | 'task_count';
  targetCount: number; // e.g. 7 days streak, or 30 days streak, or 50 completed tasks
  linkedHabitId?: string; // specific habit or all habits
  isClaimed: boolean;
  claimedAt?: number;
  createdAt: number;
}

export interface DashboardWidgetConfig {
  id: 'urgent_tasks' | 'routines' | 'top_streaks' | 'level_loggers' | 'rewards' | 'daily_blocks' | 'sleep_rhythm' | 'reflections_highlight';
  titleEn: string;
  titleAr: string;
  enabled: boolean;
  order: number;
}

export interface NestedChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeeklyPriorityGoal {
  id?: string;
  weekId: string; // e.g. '2026-W42'
  rank: 1 | 2 | 3; // 1 = Primary, 2 = Secondary, 3 = Tertiary
  title: string;
  description?: string;
  linkedGoalId?: string; // Long-term GoalItem ID
  linkedProjectId?: string; // ProjectItem ID
  progressPercent: number; // 0 to 100
  status: 'in_progress' | 'completed' | 'carried_over' | 'cancelled';
  outcomeNotes?: string;
  carriedFromWeekId?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface WeeklyPlanSlot {
  id?: string;
  dayIndex: number; // 0 for Monday, 6 for Sunday
  title: string;
  timeSlot?: string; // e.g. '09:00 AM'
  startTime?: string; // e.g. '08:00'
  endTime?: string; // e.g. '10:00'
  linkedTaskIds?: string[];
  linkedHabitIds?: string[];
  nestedChecklist?: NestedChecklistItem[];
  linkedProjectId?: string;
  linkedGoalId?: string;
  completed: boolean;
  type: 'deep-work' | 'meeting' | 'workout' | 'personal' | 'general';
  weekId?: string; // e.g., '2026-W38'
  date?: string; // YYYY-MM-DD for single day overrides
  isRecurring?: boolean; // true = repeats weekly on dayIndex, false = specific date only
  blockType?: DailyBlockType;
  color?: string; // emerald, indigo, amber, rose, cyan, purple, blue, slate
  icon?: string;
  energyRequired?: DailyBlockEnergy;
  notes?: string;
  createdAt: number;
}

export interface WeeklyPlanTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  badge?: string;
  slots: {
    dayIndex: number;
    title: string;
    startTime: string;
    endTime: string;
    type: WeeklyPlanSlot['type'];
    blockType?: DailyBlockType;
    color?: string;
    icon?: string;
    energyRequired?: DailyBlockEnergy;
    notes?: string;
  }[];
}

export interface MonthlyPlanMeta {
  id?: string;
  monthKey: string; // YYYY-MM
  theme?: string;
  monthlyGoals?: string[];
  weekThemes?: Record<number, string>; // week 1 to 5 focus themes
  keyDates?: { date: string; title: string; category?: string }[];
  reflection?: string;
  updatedAt?: number;
}

export interface SundayReset {
  id?: string;
  weekId: string; // e.g. "2026-W38"
  completedAt: number;
  habitScore: number;
  triageNotesCount: number;
  archivedTasksCount: number;
  weeklyFocus: string;
  weeklyGoal?: string;
}

export interface ReviewEntry {
  id?: string;
  type: 'daily' | 'weekly' | 'monthly';
  periodKey: string; // e.g., '2026-10-14' for daily, '2026-W41' for weekly, '2026-10' for monthly
  title: string;
  createdAt: number;
  updatedAt?: number;
  rating?: number; // 1 to 10
  dayMood?: 'calm' | 'productive' | 'stressed' | 'neutral' | 'tired' | 'victorious';
  habitScore?: number; // percentage
  completedTasksCount?: number;
  completedWorkoutsCount?: number;
  totalLiftedVolume?: number;
  focusMinutes?: number;
  excusesCount?: number;
  wins?: string;
  challenges?: string;
  lessons?: string;
  nextFocus?: string;
  notes?: string; // free-form notes or reflections
  tags?: string[];
  linkedHabitIds?: string[];
  linkedTaskIds?: string[];
  linkedProjectIds?: string[];
  linkedGoalIds?: string[];
  sleepActualHours?: number;
  wokeOnTarget?: boolean;
  isStarred?: boolean;
  excusesSummary?: { date: string; habitTitle: string; excuse: string }[];
  weeklyReviewIds?: string[]; // linked weekly review IDs if type is 'monthly'
}

export interface SleepScheduleConfig {
  id?: string;
  targetBedtime: string; // e.g. "23:00"
  targetWakeTime: string; // e.g. "07:00"
  targetDurationHours: number; // e.g. 8.0
  weeklyTargetHours: number; // e.g. 56
  enabled: boolean;
  updatedAt?: number;
}

export interface DailySleepLog {
  id?: string;
  date: string; // YYYY-MM-DD
  targetBedtime: string; // e.g. "23:00"
  targetWakeTime: string; // e.g. "07:00"
  actualBedtime: string; // e.g. "23:15"
  actualWakeTime: string; // e.g. "07:00"
  wokeOnTarget: boolean;
  sleptOnTarget: boolean;
  sleepDurationMinutes: number; // calculated minutes (e.g. 465 = 7h 45m)
  quality?: 'great' | 'good' | 'fair' | 'poor';
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ProjectSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  status: 'In Progress' | 'Planning' | 'Completed' | 'On Hold';
  category: string;
  color: string;
  startDate?: string; // YYYY-MM-DD
  deadline?: string; // YYYY-MM-DD
  linkedGoalId?: string; // High-level overarching Goal ID
  linkedGoalTitle?: string;
  subtasks: ProjectSubtask[];
  dailyAllocationPercentage?: number; // Target daily allocation percentage (e.g. 40%)
  createdAt: number;
  archived?: boolean;
  archivedAt?: number;
}

export interface ChecklistItemEntry {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority?: Priority;
  notes?: string;
}

export interface ChecklistGroup {
  id?: string;
  title: string;
  description?: string;
  category: string; // 'Work' | 'Personal' | 'Project' | 'Task Routine' | 'Shopping' | 'Travel' | 'General'
  color?: string; // 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue' | 'slate'
  pinned?: boolean;
  linkedProjectId?: string;
  linkedTaskId?: string;
  items: ChecklistItemEntry[];
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
  archivedAt?: number;
}

export interface NoteItem {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  isRead?: boolean;
  color?: string; // 'default' | 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'slate'
  category: 'Brain Dump' | 'Business' | 'Life' | 'Meeting' | 'Quick Note' | 'Reminder' | 'Read Later' | 'Idea';
  reminderDate?: string;
  reminderTime?: string;
  checklistItems?: ChecklistItemEntry[];
  updatedAt: number;
  createdAt: number;
  archived?: boolean;
  archivedAt?: number;
}

export type DailyBlockType = 'morning' | 'deep-work' | 'recharge' | 'execution' | 'fitness' | 'evening' | 'custom';
export type DailyBlockEnergy = 'high' | 'medium' | 'low';
export type DailyBlockStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface DailyBlockItem {
  id?: string;
  date: string; // YYYY-MM-DD
  title: string;
  subtitle?: string;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "10:30"
  blockType: DailyBlockType;
  energyRequired?: DailyBlockEnergy;
  status: DailyBlockStatus;
  color?: string; // emerald, indigo, amber, rose, blue, purple, cyan, slate
  icon?: string;
  linkedTaskIds?: string[];
  linkedHabitIds?: string[];
  nestedChecklist?: NestedChecklistItem[];
  linkedProjectId?: string;
  linkedGoalId?: string;
  focusMinutesLogged?: number; // accumulated focused minutes inside this block
  targetFocusMinutes?: number; // planned focus time in this block
  notes?: string;
  completedAt?: number;
  order: number;
  createdAt: number;
  archived?: boolean;
  archivedAt?: number;
}

export interface DailyBlockArchetype {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  badge?: string;
  targetDays?: string[]; // e.g. ['Mon', 'Tue', 'Wed'] or ['الإثنين', 'الثلاثاء']
  isCustom?: boolean;
  createdAt?: number;
  blocks: {
    title: string;
    subtitle?: string;
    startTime: string;
    endTime: string;
    blockType: DailyBlockType;
    energyRequired?: DailyBlockEnergy;
    color: string;
    icon: string;
    targetFocusMinutes?: number;
    order: number;
    linkedProjectId?: string;
    linkedGoalId?: string;
  }[];
}

export interface ModuleLifecycleEvent {
  id?: string;
  moduleId: ModuleType;
  moduleName: string;
  status: 'enabled' | 'disabled';
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  reason?: string;
}

export interface PomodoroTimeTarget {
  hours: number;
  minutes: number;
  totalMinutes: number;
  targetWindow?: 'all-day' | 'morning' | 'afternoon' | 'evening';
}

export interface AccessControlData {
  ownerEmail: string;
  allowedEmails: string[];
  updatedAt?: number;
}

export interface CognitiveReflection {
  id?: string;
  title: string;
  description: string;
  category?: string;
  type?: 'cognitive_block' | 'aha_moment' | 'mindset_shift';
  extractedAffirmations?: string[];
  createdAt: number;
  updatedAt?: number;
}

export interface VisualizationStory {
  id?: string;
  title: string;
  storyContent: string;
  theme?: string;
  readingTimeMinutes?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Affirmation {
  id?: string;
  statement: string;
  category?: string;
  sourceBlockId?: string;
  sourceBlockTitle?: string;
  createdAt: number;
}

