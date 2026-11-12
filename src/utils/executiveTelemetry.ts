import { TaskItem, HabitItem, DailyBlockItem, ProjectItem, GoalItem, ReviewEntry } from '../types';

export interface TelemetrySummary {
  tasks: {
    total: number;
    pending: number;
    completed: number;
    highPriority: number;
    stalledRolloverCount: number;
    stalledTasks: { title: string; rollovers: number; priority: string }[];
    topPending: { title: string; priority: string; dueDate?: string }[];
  };
  habits: {
    total: number;
    completedToday: number;
    todayRatePercent: number;
    sevenDayRatePercent: number;
    activeStreaks: { title: string; streak: number }[];
    frozenCount: number;
  };
  dailyBlocks: {
    todayCount: number;
    completedCount: number;
    deepWorkCount: number;
    deepWorkMinutesPlanned: number;
    blocksSummary: { title: string; time: string; type: string; status: string }[];
  };
  projects: {
    activeCount: number;
    projectsList: { title: string; progress?: number; category?: string }[];
  };
  goals: {
    activeCount: number;
    goalsList: { title: string; timeframe: string; status: string }[];
  };
}

export function compileExecutiveTelemetry(data: {
  tasks?: TaskItem[];
  habits?: HabitItem[];
  dailyBlocks?: DailyBlockItem[];
  projects?: ProjectItem[];
  goals?: GoalItem[];
  reviews?: ReviewEntry[];
}): { summary: TelemetrySummary; formattedPromptContext: string } {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. TASKS AUDIT
  const allTasks = (data.tasks || []).filter(t => !t.archived);
  const completedTasks = allTasks.filter(t => t.completed);
  const pendingTasks = allTasks.filter(t => !t.completed);
  const highPriorityPending = pendingTasks.filter(t => t.priority === 'High');
  
  // Stalled / delayed tasks (rolloverCount > 0 or has skipReasons)
  const stalledTasks = pendingTasks
    .filter(t => (t.rolloverCount && t.rolloverCount > 0) || (t.skipReasons && t.skipReasons.length > 0))
    .sort((a, b) => (b.rolloverCount || 0) - (a.rolloverCount || 0));

  // Overdue tasks
  const overdueTasks = pendingTasks.filter(t => t.dueDate && t.dueDate < todayStr);

  // 2. HABITS AUDIT
  const allHabits = data.habits || [];
  let habitsDoneToday = 0;
  let totalSevenDayChecks = 0;
  let totalSevenDayPossible = allHabits.length * 7;
  let totalFreezesUsed = 0;

  // Generate last 7 days strings
  const last7Days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  allHabits.forEach(h => {
    if (h.history && h.history[todayStr]) {
      habitsDoneToday++;
    }
    if (h.freezes && Object.keys(h.freezes).length > 0) {
      totalFreezesUsed += Object.values(h.freezes).filter(Boolean).length;
    }
    last7Days.forEach(day => {
      if (h.history && h.history[day]) {
        totalSevenDayChecks++;
      }
    });
  });

  const sevenDayRate = totalSevenDayPossible > 0 
    ? Math.round((totalSevenDayChecks / totalSevenDayPossible) * 100) 
    : 0;

  const todayHabitRate = allHabits.length > 0 
    ? Math.round((habitsDoneToday / allHabits.length) * 100) 
    : 0;

  // 3. DAILY BLOCKS AUDIT (TODAY)
  const allBlocks = data.dailyBlocks || [];
  const todayBlocks = allBlocks
    .filter(b => b.date === todayStr && !b.archived)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const completedBlocks = todayBlocks.filter(b => b.status === 'completed');
  const deepWorkBlocks = todayBlocks.filter(b => b.blockType === 'deep-work');
  
  let totalDeepWorkPlannedMinutes = 0;
  deepWorkBlocks.forEach(b => {
    if (b.targetFocusMinutes) {
      totalDeepWorkPlannedMinutes += b.targetFocusMinutes;
    } else {
      // Approximate duration from startTime to endTime
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh)) {
        const diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
        if (diff > 0) totalDeepWorkPlannedMinutes += diff;
      }
    }
  });

  // 4. PROJECTS & GOALS AUDIT
  const getProjectProgress = (p: ProjectItem): number => {
    if (!p.subtasks || p.subtasks.length === 0) return 0;
    const done = p.subtasks.filter((s) => s.completed).length;
    return Math.round((done / p.subtasks.length) * 100);
  };

  const activeProjects = (data.projects || []).filter((p) => !p.archived && p.status !== 'Completed');
  const activeGoals = (data.goals || []).filter((g) => !g.archived && g.status !== 'Achieved');

  const summary: TelemetrySummary = {
    tasks: {
      total: allTasks.length,
      pending: pendingTasks.length,
      completed: completedTasks.length,
      highPriority: highPriorityPending.length,
      stalledRolloverCount: stalledTasks.length,
      stalledTasks: stalledTasks.slice(0, 5).map((t) => ({
        title: t.title,
        rollovers: t.rolloverCount || 1,
        priority: t.priority
      })),
      topPending: pendingTasks.slice(0, 7).map((t) => ({
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate
      }))
    },
    habits: {
      total: allHabits.length,
      completedToday: habitsDoneToday,
      todayRatePercent: todayHabitRate,
      sevenDayRatePercent: sevenDayRate,
      activeStreaks: allHabits
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 6)
        .map((h) => ({ title: h.title, streak: h.streak })),
      frozenCount: totalFreezesUsed
    },
    dailyBlocks: {
      todayCount: todayBlocks.length,
      completedCount: completedBlocks.length,
      deepWorkCount: deepWorkBlocks.length,
      deepWorkMinutesPlanned: totalDeepWorkPlannedMinutes,
      blocksSummary: todayBlocks.map((b) => ({
        title: b.title,
        time: `${b.startTime} - ${b.endTime}`,
        type: b.blockType,
        status: b.status
      }))
    },
    projects: {
      activeCount: activeProjects.length,
      projectsList: activeProjects.slice(0, 5).map((p) => ({
        title: p.title,
        progress: getProjectProgress(p),
        category: p.category
      }))
    },
    goals: {
      activeCount: activeGoals.length,
      goalsList: activeGoals.slice(0, 5).map(g => ({
        title: g.title,
        timeframe: g.timeframe,
        status: g.status
      }))
    }
  };

  // Build the high-density formatted text for AI System Prompt
  const promptParts: string[] = [];

  promptParts.push(`[CURRENT DATE: ${todayStr}]`);
  
  // Tasks section
  promptParts.push(`\n### 1. TASKS AUDIT (Total: ${allTasks.length} | Pending: ${pendingTasks.length} | Completed: ${completedTasks.length})`);
  promptParts.push(`- High Priority Pending Tasks: ${highPriorityPending.length}`);
  if (overdueTasks.length > 0) {
    promptParts.push(`- OVERDUE TASKS (${overdueTasks.length}): ${overdueTasks.map(t => `"${t.title}" (Due: ${t.dueDate})`).join(', ')}`);
  }
  if (stalledTasks.length > 0) {
    promptParts.push(`- STALLED / PROCRASTINATED TASKS (Rollover Count > 0):`);
    stalledTasks.slice(0, 5).forEach(t => {
      promptParts.push(`  * "${t.title}" (Priority: ${t.priority}, Rolled over ${t.rolloverCount || 1} times)`);
    });
  } else {
    promptParts.push(`- Stalled Tasks: None detected (Clean momentum!)`);
  }
  if (pendingTasks.length > 0) {
    promptParts.push(`- Key Pending Tasks Queue:`);
    pendingTasks.slice(0, 6).forEach(t => {
      promptParts.push(`  * [${t.priority}] ${t.title}${t.dueDate ? ` (Due: ${t.dueDate})` : ''}`);
    });
  }

  // Habits section
  promptParts.push(`\n### 2. HABITS & ADHERENCE (Total Active: ${allHabits.length})`);
  promptParts.push(`- Today's Progress: ${habitsDoneToday}/${allHabits.length} completed (${todayHabitRate}%)`);
  promptParts.push(`- 7-Day Consistency Rate: ${sevenDayRate}%`);
  promptParts.push(`- Streak Freeze Days Logged: ${totalFreezesUsed}`);
  if (allHabits.length > 0) {
    const topStreaks = allHabits.filter(h => h.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 4);
    const zeroStreaks = allHabits.filter(h => h.streak === 0).slice(0, 4);
    if (topStreaks.length > 0) {
      promptParts.push(`- Strongest Streaks: ${topStreaks.map(h => `"${h.title}" (${h.streak}d)`).join(', ')}`);
    }
    if (zeroStreaks.length > 0) {
      promptParts.push(`- Broken / Zero Streaks Needing Attention: ${zeroStreaks.map(h => `"${h.title}"`).join(', ')}`);
    }
  }

  // Daily blocks section
  promptParts.push(`\n### 3. TODAY'S DAILY TIME-BLOCKS (Date: ${todayStr})`);
  promptParts.push(`- Scheduled Blocks: ${todayBlocks.length} | Completed: ${completedBlocks.length}`);
  promptParts.push(`- Deep Work Blocks: ${deepWorkBlocks.length} (Planned: ${(totalDeepWorkPlannedMinutes / 60).toFixed(1)} hours)`);
  if (todayBlocks.length > 0) {
    promptParts.push(`- Timeline:`);
    todayBlocks.forEach(b => {
      promptParts.push(`  * ${b.startTime}-${b.endTime} | [${b.blockType}] ${b.title} (${b.status})`);
    });
  } else {
    promptParts.push(`- No daily blocks scheduled for today yet.`);
  }

  // Projects & Goals
  promptParts.push(`\n### 4. ACTIVE PROJECTS & STRATEGIC GOALS`);
  promptParts.push(`- Active Projects (${activeProjects.length}): ${activeProjects.map(p => `"${p.title}" (${getProjectProgress(p)}% progress)`).join(', ') || 'None'}`);
  promptParts.push(`- Long-Term Milestones (${activeGoals.length}): ${activeGoals.map(g => `"${g.title}" [${g.timeframe} - ${g.status}]`).join(', ') || 'None'}`);

  return {
    summary,
    formattedPromptContext: promptParts.join('\n')
  };
}
