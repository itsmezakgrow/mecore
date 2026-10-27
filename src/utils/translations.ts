export interface Dictionary {
  // Navigation / Sidebar
  habitTracker: string;
  taskTracker: string;
  overview: string;
  aiMentor: string;
  weeklyPlanner: string;
  goalsTargets: string;
  analyticsTelemetry: string;
  checklistsSOPs: string;
  projects: string;
  brainDumpNotes: string;
  operatingGuide: string;
  settings: string;
  trainingEngine: string;
  focusTimer: string;
  sundayReset: string;
  dailyBlocks: string;
  preciseDailyTarget: string;

  // Header / Common
  liveSync: string;
  offline: string;
  standard: string;
  compact: string;
  exportSync: string;
  firestoreGuide: string;
  dailyExecutiveBriefing: string;
  dailyFocusRate: string;
  completed: string;
  urgent: string;
  habitsProtocol: string;
  doneToday: string;
  newHabit: string;
  newGoal: string;
  newTask: string;
  newProject: string;
  newNote: string;
  newChecklist: string;
  searchHabits: string;
  searchTasks: string;
  searchProjects: string;
  searchNotes: string;
  allCategories: string;
  healthFitness: string;
  productivity: string;
  businessCareer: string;
  personalGrowth: string;
  mindsetZen: string;
  allHorizons: string;
  milestones: string;
  endpoint: string;
  delete: string;
  edit: string;
  save: string;
  cancel: string;
  close: string;
  snooze: string;
  pause: string;
  archive: string;
  unarchive: string;
  history: string;
  archiveHistory: string;
  snoozed: string;
  archived: string;
  active: string;
  pause1Week: string;
  pause1Month: string;
  unpause: string;
  language: string;
  theme: string;
  light: string;
  dark: string;
  soundEffects: string;
  soundEnabled: string;
  soundDisabled: string;
  volume: string;
  customizeFeatures: string;

  // Life Focus Phases
  strategicLifePhases: string;
  lifePhaseFocus: string;
  activePhase: string;
  noActivePhase: string;
  managePhases: string;
  newPhase: string;
  editPhase: string;
  phaseName: string;
  startDate: string;
  endDate: string;
  ongoing: string;
  allocationWeights: string;
  savePhase: string;
  activatePhase: string;
  deactivatePhase: string;
  resetPhases: string;
  clearAllPhases: string;

  // Milestone Rewards
  milestoneRewards: string;
  rewardStore: string;
  rewardClaimed: string;
  claimReward: string;
  unclaimReward: string;
  addReward: string;
  editReward: string;
  deleteReward: string;
  resetRewards: string;
  clearAllRewards: string;
  rewardCategory: string;
  rewardTarget: string;
  rewardUnlocked: string;
  locked: string;

  // Routines & Streaks
  morningRoutine: string;
  afternoonRoutine: string;
  eveningRoutine: string;
  anytimeRoutine: string;
  completeRoutine: string;
  streakFreeze: string;
  applyFreeze: string;
  freezeExcuse: string;
  bankedFreezes: string;
  removeFreeze: string;
  sickDay: string;
  travel: string;
  emergency: string;
  restDay: string;

  // Task Skips & Rollovers
  skipTask: string;
  postponeTask: string;
  rolloverCount: string;
  skipReason: string;
  newDueDate: string;
  reasonsHistory: string;

  // Dashboard Widgets
  customizeDashboard: string;
  resetWidgets: string;
  enableAll: string;
  disableAll: string;
  urgentTasksWidget: string;
  routinesWidget: string;
  lifePhaseWidget: string;
  streaksWidget: string;
  rewardsWidget: string;
}

export const translations: Record<'en' | 'ar', Dictionary> = {
  en: {
    habitTracker: 'Habit Tracker',
    taskTracker: 'Task Tracker',
    overview: 'Overview',
    aiMentor: 'Atlas AI',
    weeklyPlanner: 'Weekly Planner',
    goalsTargets: 'Goals & Targets',
    analyticsTelemetry: 'Analytics & Telemetry',
    checklistsSOPs: 'Checklists & SOPs',
    projects: 'Projects',
    brainDumpNotes: 'Brain Dump & Notes',
    operatingGuide: 'Operating Guide',
    settings: 'Control Center & Settings',
    trainingEngine: 'Training Engine',
    focusTimer: 'Deep Focus & Pomodoro',
    sundayReset: 'Sunday Executive Reset',
    dailyBlocks: 'Daily Blocks Flow',
    preciseDailyTarget: 'Precise Focus Target',

    liveSync: 'Live Sync',
    offline: 'Offline',
    standard: 'Standard',
    compact: 'Compact',
    exportSync: 'Export & Sync',
    firestoreGuide: 'Cloud Guide',
    dailyExecutiveBriefing: 'Daily Executive Briefing',
    dailyFocusRate: 'Daily Focus Rate',
    completed: 'completed',
    urgent: 'Urgent',
    habitsProtocol: 'Habit Protocol',
    doneToday: 'Done Today',
    newHabit: 'New Habit',
    newGoal: 'New Goal',
    newTask: 'New Task',
    newProject: 'New Project',
    newNote: 'New Note',
    newChecklist: 'New Checklist',
    searchHabits: 'Search habits...',
    searchTasks: 'Search tasks...',
    searchProjects: 'Search projects...',
    searchNotes: 'Search notes...',
    allCategories: 'All Categories',
    healthFitness: 'Health & Fitness',
    productivity: 'Productivity',
    businessCareer: 'Business & Career',
    personalGrowth: 'Personal Growth',
    mindsetZen: 'Mindset & Zen',
    allHorizons: 'All Horizons',
    milestones: 'Milestones',
    endpoint: 'Endpoint',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save Changes',
    cancel: 'Cancel',
    close: 'Close',
    snooze: 'Snooze',
    pause: 'Pause',
    archive: 'Archive',
    unarchive: 'Unarchive',
    history: 'History',
    archiveHistory: 'Archive & History',
    snoozed: 'Snoozed',
    archived: 'Archived',
    active: 'Active',
    pause1Week: 'Pause for 1 week',
    pause1Month: 'Pause for 1 month',
    unpause: 'Unpause',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    soundEffects: 'Synthesizer Audio & Sound Cues',
    soundEnabled: 'Sound Enabled',
    soundDisabled: 'Muted',
    volume: 'Volume',
    customizeFeatures: 'Customize & Remove Features',

    strategicLifePhases: 'Strategic Life Phases',
    lifePhaseFocus: 'Life Focus & Priority Allocation',
    activePhase: 'Current Active Phase',
    noActivePhase: 'Standard Balanced Focus (No Active Phase)',
    managePhases: 'Manage Phases',
    newPhase: 'New Phase',
    editPhase: 'Edit Phase',
    phaseName: 'Phase Name',
    startDate: 'Start Date',
    endDate: 'End Date (Optional)',
    ongoing: 'Ongoing',
    allocationWeights: 'Category Allocation Weights',
    savePhase: 'Save Phase',
    activatePhase: 'Activate',
    deactivatePhase: 'Deactivate',
    resetPhases: 'Reset Default Phases',
    clearAllPhases: 'Clear All Phases',

    milestoneRewards: 'Milestone Rewards & Vault',
    rewardStore: 'Milestone Store',
    rewardClaimed: 'Claimed',
    claimReward: 'Claim Reward',
    unclaimReward: 'Undo Claim',
    addReward: 'Add Milestone Reward',
    editReward: 'Edit Reward',
    deleteReward: 'Delete Reward',
    resetRewards: 'Reset Default Rewards',
    clearAllRewards: 'Clear All Rewards',
    rewardCategory: 'Reward Category',
    rewardTarget: 'Target Requirement',
    rewardUnlocked: 'Unlocked! Ready to Claim',
    locked: 'Locked',

    morningRoutine: 'Morning Routine',
    afternoonRoutine: 'Afternoon Routine',
    eveningRoutine: 'Evening Routine',
    anytimeRoutine: 'Anytime Habits',
    completeRoutine: 'Complete Routine',
    streakFreeze: 'Streak Freeze Protection',
    applyFreeze: 'Apply Streak Freeze',
    freezeExcuse: 'Justification / Reason',
    bankedFreezes: 'Banked Freeze Credits',
    removeFreeze: 'Remove Freeze',
    sickDay: 'Sick / Unwell',
    travel: 'Travel / Out of Town',
    emergency: 'Urgent Emergency',
    restDay: 'Scheduled Rest Day',

    skipTask: 'Postpone / Skip Task',
    postponeTask: 'Reschedule',
    rolloverCount: 'Rollover Count',
    skipReason: 'Postpone Reason',
    newDueDate: 'New Due Date',
    reasonsHistory: 'Postpone History',

    customizeDashboard: 'Customize Dashboard Widgets',
    resetWidgets: 'Reset Default Widgets',
    enableAll: 'Enable All',
    disableAll: 'Disable All',
    urgentTasksWidget: 'Urgent & Weighted Tasks',
    routinesWidget: 'Time-of-Day Habit Routines',
    lifePhaseWidget: 'Strategic Life Focus Phase',
    streaksWidget: 'Top Habit Streaks',
    rewardsWidget: 'Milestone Rewards Vault',
  },
  ar: {
    habitTracker: 'متابع العادات',
    taskTracker: 'متابع المهام',
    overview: 'لوحة التحكم',
    aiMentor: 'أطلس الذكي',
    weeklyPlanner: 'المخطط الأسبوعي',
    goalsTargets: 'الأهداف والغايات',
    analyticsTelemetry: 'التحليلات والقياس',
    checklistsSOPs: 'قوائم التدقيق (SOPs)',
    projects: 'المشاريع',
    brainDumpNotes: 'الملاحظات والخواطر',
    operatingGuide: 'دليل التشغيل الشامل',
    settings: 'مركز التحكم والإعدادات',
    trainingEngine: 'محرك التدريب واللياقة',
    focusTimer: 'مؤقت التركيز وبومودورو',
    sundayReset: 'إعادة الضبط التنفيذي الأسبوعي',
    dailyBlocks: 'فترات وقوالب اليوم',
    preciseDailyTarget: 'الهدف اليومي الدقيق للتركيز',

    liveSync: 'مزامنة حية',
    offline: 'غير متصل',
    standard: 'قياسي',
    compact: 'مضغوط',
    exportSync: 'تصدير ومزامنة',
    firestoreGuide: 'دليل السحابة',
    dailyExecutiveBriefing: 'التقرير التنفيذي اليومي',
    dailyFocusRate: 'معدل التركيز اليومي',
    completed: 'منجز',
    urgent: 'عاجل',
    habitsProtocol: 'بروتوكول العادات',
    doneToday: 'تم إنجازها اليوم',
    newHabit: 'عادة جديدة',
    newGoal: 'هدف جديد',
    newTask: 'مهمة جديدة',
    newProject: 'مشروع جديد',
    newNote: 'ملاحظة جديدة',
    newChecklist: 'قائمة تدقيق جديدة',
    searchHabits: 'البحث في العادات...',
    searchTasks: 'البحث في المهام...',
    searchProjects: 'البحث في المشاريع...',
    searchNotes: 'البحث في الملاحظات...',
    allCategories: 'كل التصنيفات',
    healthFitness: 'الصحة واللياقة',
    productivity: 'الإنتاجية',
    businessCareer: 'العمل والمهنة',
    personalGrowth: 'النمو الشخصي',
    mindsetZen: 'التفكير والهدوء',
    allHorizons: 'كل الآفاق الزمنية',
    milestones: 'المحطات الرئيسية',
    endpoint: 'الغاية النهائية',
    delete: 'حذف',
    edit: 'تعديل',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    close: 'إغلاق',
    snooze: 'تأجيل مؤقت',
    pause: 'إيقاف مؤقت',
    archive: 'أرشفة',
    unarchive: 'إلغاء الأرشفة',
    history: 'السجل والماضي',
    archiveHistory: 'الأرشيف والسجل',
    snoozed: 'مؤجل',
    archived: 'مؤرشف',
    active: 'نشط',
    pause1Week: 'إيقاف مؤقت لأسبوع',
    pause1Month: 'إيقاف مؤقت لشهر',
    unpause: 'استئناف',
    language: 'اللغة',
    theme: 'المظهر',
    light: 'مضيء',
    dark: 'داكن',
    soundEffects: 'المؤثرات الصوتية والموسيقى التنبيهية',
    soundEnabled: 'الأصوات مفعلة',
    soundDisabled: 'مكتوم',
    volume: 'مستوى الصوت',
    customizeFeatures: 'تخصيص وحذف الميزات والإعدادات المضافة',

    strategicLifePhases: 'مراحل التركيز الاستراتيجي',
    lifePhaseFocus: 'توزيع نسب الأولويات والمراحل',
    activePhase: 'المرحلة النشطة حالياً',
    noActivePhase: 'تركيز متوازن قياسي (لا توجد مرحلة نشطة)',
    managePhases: 'إدارة المراحل',
    newPhase: 'مرحلة جديدة',
    editPhase: 'تعديل المرحلة',
    phaseName: 'اسم المرحلة',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء (اختياري)',
    ongoing: 'مستمرة',
    allocationWeights: 'توزيع النسب المئوية للمجالات',
    savePhase: 'حفظ المرحلة',
    activatePhase: 'تفعيل',
    deactivatePhase: 'تعطيل',
    resetPhases: 'استعادة المراحل الافتراضية',
    clearAllPhases: 'مسح جميع المراحل',

    milestoneRewards: 'متجر الجوائز والمحطات التحفيزية',
    rewardStore: 'متجر المكافآت',
    rewardClaimed: 'تم الاستلام',
    claimReward: 'استلام المكافأة',
    unclaimReward: 'إلغاء الاستلام',
    addReward: 'إضافة مكافأة جديدة',
    editReward: 'تعديل المكافأة',
    deleteReward: 'حذف المكافأة',
    resetRewards: 'استعادة المكافآت الافتراضية',
    clearAllRewards: 'مسح جميع المكافآت',
    rewardCategory: 'تصنيف المكافأة',
    rewardTarget: 'الشرط المطلوب للإنجاز',
    rewardUnlocked: 'متاحة للاستلام الآن!',
    locked: 'مقفلة',

    morningRoutine: 'روتين الصباح',
    afternoonRoutine: 'روتين الظهيرة',
    eveningRoutine: 'روتين المساء',
    anytimeRoutine: 'عادات طوال اليوم',
    completeRoutine: 'إنجاز كامل الروتين',
    streakFreeze: 'حماية السلسلة المتتالية (تجميد)',
    applyFreeze: 'تطبيق تجميد العادة',
    freezeExcuse: 'سبب التجميد / العذر',
    bankedFreezes: 'رصيد التجميد المحفوظ',
    removeFreeze: 'إلغاء التجميد',
    sickDay: 'مرض / وعكة صحية',
    travel: 'سفر / خارج المدينة',
    emergency: 'ظرف طارئ مستعجل',
    restDay: 'يوم راحة مجدول',

    skipTask: 'تأجيل أو تجاوز المهمة',
    postponeTask: 'إعادة جدولة',
    rolloverCount: 'مرات الترحيل والتأجيل',
    skipReason: 'سبب التأجيل',
    newDueDate: 'الموعد النهائي الجديد',
    reasonsHistory: 'سجل أسباب التأجيل',

    customizeDashboard: 'تخصيص بطاقات لوحة التحكم',
    resetWidgets: 'استعادة البطاقات الافتراضية',
    enableAll: 'تفعيل الكل',
    disableAll: 'إخفاء الكل',
    urgentTasksWidget: 'المهام المستعجلة والموزونة',
    routinesWidget: 'روتينات العادات اليومية',
    lifePhaseWidget: 'مرحلة التركيز الاستراتيجي',
    streaksWidget: 'سلاسل العادات المتتالية',
    rewardsWidget: 'متجر الجوائز والمكافآت',
  },
};
