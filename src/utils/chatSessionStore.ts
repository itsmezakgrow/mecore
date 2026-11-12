import { ChatSession, ChatSessionSource, ChatMessage } from '../types';

const STORAGE_KEY_SESSIONS = 'core_chat_sessions_history_v1';

export const getSavedChatSessions = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load chat sessions:', e);
  }
  return [];
};

export const saveChatSessions = (sessions: ChatSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    window.dispatchEvent(new Event('core_chat_sessions_updated'));
  } catch (e) {
    console.error('Failed to save chat sessions:', e);
  }
};

export const addOrUpdateChatSession = (session: ChatSession) => {
  try {
    const existing = getSavedChatSessions();
    const index = existing.findIndex((s) => s.id === session.id);
    let updated: ChatSession[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = session;
    } else {
      updated = [session, ...existing];
    }
    saveChatSessions(updated);
  } catch (e) {
    console.error('Failed to add or update chat session:', e);
  }
};

export const deleteChatSession = (sessionId: string) => {
  try {
    const existing = getSavedChatSessions();
    const updated = existing.filter((s) => s.id !== sessionId);
    saveChatSessions(updated);
  } catch (e) {
    console.error('Failed to delete chat session:', e);
  }
};

export const getSourceMeta = (source: ChatSessionSource, lang: 'en' | 'ar' = 'en'): { label: string; iconEmoji: string } => {
  const isAr = lang === 'ar';
  switch (source) {
    case 'tasks':
      return { label: isAr ? 'متتبع المهام' : 'Task Tracker', iconEmoji: '✅' };
    case 'habits':
      return { label: isAr ? 'متتبع العادات' : 'Habit Tracker', iconEmoji: '🔥' };
    case 'daily-blocks':
      return { label: isAr ? 'قوالب اليوم' : 'Daily Blocks', iconEmoji: '⏱️' };
    case 'training':
      return { label: isAr ? 'محرك التدريب' : 'Iron Engine', iconEmoji: '🏋️' };
    case 'reflections':
      return { label: isAr ? 'التأملات والدروس' : 'Reflections', iconEmoji: '📖' };
    case 'planner':
      return { label: isAr ? 'المخطط الأسبوعي' : 'Weekly Planner', iconEmoji: '📅' };
    case 'dashboard':
      return { label: isAr ? 'لوحة التحكم' : 'Overview', iconEmoji: '📊' };
    case 'projects':
      return { label: isAr ? 'المشاريع' : 'Projects', iconEmoji: '📁' };
    case 'goals':
      return { label: isAr ? 'الأهداف' : 'Goals', iconEmoji: '🎯' };
    case 'core-chat':
    default:
      return { label: isAr ? 'Core Chat الرئيسي' : 'Core Chat Hub', iconEmoji: '🤖' };
  }
};

// Generates an executive 1-sentence conclusion tag based on assistant response
export const generateConclusionSnippet = (content: string): string => {
  if (!content) return '';
  // Clean markdown syntax for summary
  const clean = content
    .replace(/<core_suggestions>[\s\S]*?<\/core_suggestions>/gi, '')
    .replace(/<atlas_suggestions>[\s\S]*?<\/atlas_suggestions>/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*|`_]/g, '')
    .trim();

  // Find the first meaningful sentence or line
  const lines = clean.split('\n').map(l => l.trim()).filter(l => l.length > 15);
  if (lines.length > 0) {
    const firstLine = lines[0];
    return firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine;
  }
  return clean.slice(0, 80);
};
