import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Bot,
  User,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  PlusCircle,
  Cpu,
  Zap,
  ShieldCheck,
  Settings2,
  ArrowRight,
  Flame,
  ListChecks,
  RefreshCw,
  Sliders,
  X,
  Activity,
  Layers,
  Key,
  History,
  Folder,
  Tag,
  Calendar,
  MessageSquarePlus,
  ChevronRight
} from 'lucide-react';
import { TaskItem, HabitItem, DailyBlockItem, ProjectItem, GoalItem, ReviewEntry, ChatMessage, ChatSession, ChatSessionSource } from '../types';
import { compileExecutiveTelemetry } from '../utils/executiveTelemetry';
import {
  getSavedChatSessions,
  saveChatSessions,
  addOrUpdateChatSession,
  deleteChatSession,
  getSourceMeta,
  generateConclusionSnippet
} from '../utils/chatSessionStore';
import MarkdownView from './MarkdownView';

export interface CoreChatProps {
  tasks?: TaskItem[];
  habits?: HabitItem[];
  dailyBlocks?: DailyBlockItem[];
  projects?: ProjectItem[];
  goals?: GoalItem[];
  reviews?: ReviewEntry[];
  habitsCount?: number;
  tasksCount?: number;
  goalsCount?: number;
  onNavigateToPlanImport?: () => void;
  lang?: 'en' | 'ar';
  onAddTask: (task: Omit<TaskItem, 'id'>) => Promise<any>;
  onAddHabit: (habit: Omit<HabitItem, 'id'>) => Promise<any>;
}

interface SuggestionItem {
  id: string;
  type: 'task' | 'habit';
  title: string;
  priorityOrCategory: string;
  matrixOrFrequency: string;
}

interface CoreChatMessage extends ChatMessage {
  provider?: 'gemini' | 'groq';
  model?: string;
  tier?: number;
  failover?: boolean;
  failoverReason?: string;
  source?: ChatSessionSource;
}

const getSystemInstruction = (lang: string, userName: string) => {
  const isAr = lang === 'ar';
  const nameContext = userName ? `The user's name is "${userName}". Address them directly and respectfully in an executive coach tone.` : '';

  return `You are "Core Chat", the elite Executive AI Action-Advisor & Performance Auditor integrated directly into the "Core" Operating System.
Your mission:
1. Provide ruthless executive-level prioritization and performance auditing.
2. Diagnose productivity bottlenecks, procrastination signals (e.g., tasks with rolloverCount > 0), and habit consistency leaks.
3. Architect high-yield habit systems and structured daily time-block recommendations.

${nameContext}

${isAr ? 'CRITICAL: The interface language is ARABIC. You MUST formulate all responses in high-caliber, professional, articulate Arabic, except for JSON payloads, technical keys, and code.' : 'CRITICAL: The interface language is ENGLISH. Formulate your responses in sharp, direct, executive-grade English.'}

Tone & Strategy:
- Direct, data-backed, tactical, and immediately executable (James Clear meets Cal Newport & Peter Drucker).
- Ground your analysis in the real-time telemetry snapshot provided to you (Tasks pending, Rollover count, Overdue items, Habits consistency, Today\'s scheduled blocks, and Active projects).
- Never give generic advice when real data is available. Quote their numbers directly!

TABLE & FORMATTING CONSTITUTION (CRITICAL):
- Whenever presenting task rankings, weekly reviews, priority matrices, or comparisons, ALWAYS format them as structured Markdown tables with headers (e.g. | Priority | Task | Why it moves the needle |).
- Use clear bold text for key insights and clean bullet points. Avoid monolithic paragraphs of text.

ACTION CARDS PROTOCOL:
Whenever you suggest specific tasks or positive atomic habits, you MUST append a machine-readable JSON payload at the end of your response, wrapped inside <core_suggestions> and </core_suggestions> tags.

Schema:
<core_suggestions>
{
  "tasks": [
    { "title": "Audit high-friction bottleneck in sales pipeline", "priority": "High", "matrix": "Urgent-Important" }
  ],
  "habits": [
    { "name": "15-minute shutdown and daily block preview", "category": "Mind", "frequency": "Daily" }
  ]
}
</core_suggestions>

Rules:
- Strictly valid JSON inside the tags.
- Do NOT wrap the JSON inside markdown code blocks within the tags.
- "priority" should be "High", "Med", or "Low".
- "matrix" should be "Urgent-Important", "Important-NotUrgent", "Urgent-NotImportant", or "NotUrgent-NotImportant".
- "category" can be "Mind", "Body", "Business", "Focus", or "Personal".
- Always provide 1 to 4 actionable suggestions when proposing actions.`;
};

export const CoreChat: React.FC<CoreChatProps> = ({
  tasks = [],
  habits = [],
  dailyBlocks = [],
  projects = [],
  goals = [],
  reviews = [],
  lang = 'en',
  onAddTask,
  onAddHabit,
}) => {
  const isAr = lang === 'ar';

  // Profile name
  const [profileName] = useState<string>(() => {
    try {
      return localStorage.getItem('core_profile_name') || '';
    } catch {
      return '';
    }
  });

  // Multi-session state
  const [sessions, setSessions] = useState<ChatSession[]>(() => getSavedChatSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const list = getSavedChatSessions();
    return list.length > 0 ? list[0].id : `session-core-${Date.now()}`;
  });
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);

  // Sync sessions when custom event fires
  useEffect(() => {
    const handleSync = () => {
      setSessions(getSavedChatSessions());
    };
    window.addEventListener('core_chat_sessions_updated', handleSync);
    return () => window.removeEventListener('core_chat_sessions_updated', handleSync);
  }, []);

  // Provider config modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [providerStatus, setProviderStatus] = useState<{
    geminiConfigured: boolean;
    groqConfigured: boolean;
    geminiMasked: string;
    groqMasked: string;
    tier1Model: string;
    tier2Model: string;
  } | null>(null);

  const [customGeminiKey, setCustomGeminiKey] = useState('');
  const [customGroqKey, setCustomGroqKey] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [keysFeedback, setKeysFeedback] = useState<string | null>(null);

  // Load server provider keys status
  const fetchProviderStatus = async () => {
    try {
      const res = await fetch('/api/chat/keys');
      if (res.ok) {
        const data = await res.json();
        setProviderStatus(data);
      }
    } catch (e) {
      console.error('Failed to load AI keys status:', e);
    }
  };

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKeys(true);
    setKeysFeedback(null);
    try {
      const payload: Record<string, string> = {};
      if (customGeminiKey.trim()) payload.geminiApiKey = customGeminiKey.trim();
      if (customGroqKey.trim()) payload.groqApiKey = customGroqKey.trim();

      const res = await fetch('/api/chat/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setProviderStatus({
          geminiConfigured: data.geminiConfigured,
          groqConfigured: data.groqConfigured,
          geminiMasked: data.geminiMasked,
          groqMasked: data.groqMasked,
          tier1Model: 'gemini-3.5-flash',
          tier2Model: 'llama-3.3-70b-versatile'
        });
        setKeysFeedback(isAr ? '✓ تم حفظ وتحديث المفاتيح بنجاح!' : '✓ Provider keys updated successfully!');
        setCustomGeminiKey('');
        setCustomGroqKey('');
      } else {
        throw new Error('Failed to update provider keys.');
      }
    } catch (err: any) {
      setKeysFeedback(err.message || 'Error updating keys');
    } finally {
      setIsSavingKeys(false);
    }
  };

  // Compile real-time user telemetry
  const telemetry = useMemo(() => {
    return compileExecutiveTelemetry({
      tasks,
      habits,
      dailyBlocks,
      projects,
      goals,
      reviews
    });
  }, [tasks, habits, dailyBlocks, projects, goals, reviews]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addedSuggestions, setAddedSuggestions] = useState<Record<string, boolean>>({});
  const [selectedCards, setSelectedCards] = useState<Record<string, Record<string, boolean>>>({});

  // Active Session Resolution
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Current session messages
  const [messages, setMessages] = useState<CoreChatMessage[]>(() => {
    if (activeSession && activeSession.messages && activeSession.messages.length > 0) {
      return activeSession.messages;
    }

    const greeting = profileName
      ? (isAr
          ? `مرحباً بك يا **${profileName}** في **Core Chat** — المستشار التنفيذي ومحرّك تدقيق الأداء اللحظي.\n\nلقد قمت بتحليل حالتك الحية: لديك **${telemetry.summary.tasks.pending}** مهام معلقة (${telemetry.summary.tasks.stalledRolloverCount > 0 ? `منها ${telemetry.summary.tasks.stalledRolloverCount} مهام مرحلة/مؤجلة` : 'لا توجد مهام متأخرة'})، ومعدل إنجاز العادات لليوم **${telemetry.summary.habits.todayRatePercent}%**.\n\nكيف يمكنني مساعدتك في توجيه طاقتك وأولوياتك بأعلى عائد ممكن؟`
          : `Welcome back, **${profileName}**! I am **Core Chat** — your Executive AI Action-Advisor & Live Telemetry Auditor.\n\nI have loaded your active workspace state: **${telemetry.summary.tasks.pending}** pending tasks (${telemetry.summary.tasks.stalledRolloverCount > 0 ? `${telemetry.summary.tasks.stalledRolloverCount} stalled/rolled over` : 'zero stalled tasks'}), **${telemetry.summary.habits.todayRatePercent}%** habit adherence today, and **${telemetry.summary.dailyBlocks.deepWorkCount}** deep work blocks scheduled.\n\nAsk for a weekly executive resume, bottleneck diagnostics, or tactical priority planning.`)
      : (isAr
          ? `مرحباً بك في **Core Chat** — المستشار التنفيذي ومحرّك تدقيق الأداء اللحظي المزود بنظام تجاوز الأعطال التلقائي (Google Gemini 3.5 Flash + Groq Llama 3.3 70B).\n\nأنا متصل بالكامل ببياناتك الحية (المهام، العادات، البلوكات اليومية، والمشاريع). كيف يمكنني مساندتك اليوم؟`
          : `Welcome to **Core Chat** — your Executive AI Action-Advisor & Real-Time Performance Auditor with multi-tier failover (Google Gemini 3.5 Flash + Groq Llama 3.3 70B).\n\nI am connected to your live tasks, habits, and daily blocks. How can we optimize your execution today?`);

    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
        provider: 'gemini',
        model: 'gemini-3.5-flash',
        tier: 1
      }
    ];
  });

  // Switch session handler
  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setShowSessionsDrawer(false);
  };

  // Start new session
  const handleStartNewSession = () => {
    const newId = `session-core-${Date.now()}`;
    const initialGreeting: CoreChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: isAr
        ? 'جلسة استراتيجية جديدة جاهزة. اطرح أي سؤال أو تحدٍ ترغب في تدقيقه وتحليله استناداً إلى بياناتك الحية.'
        : 'Fresh strategic consultation initiated. What high-leverage question or bottleneck would you like to analyze today?',
      timestamp: Date.now(),
      provider: 'gemini',
      model: 'gemini-3.5-flash',
      tier: 1
    };

    const newSession: ChatSession = {
      id: newId,
      title: isAr ? 'جلسة استراتيجية جديدة' : 'New Strategic Session',
      source: 'core-chat',
      sourceLabel: isAr ? 'Core Chat الرئيسي' : 'Core Chat Hub',
      date: Date.now(),
      conclusion: isAr ? 'جلسة جديدة مفتوحة' : 'Fresh consultation open',
      messages: [initialGreeting]
    };

    addOrUpdateChatSession(newSession);
    setActiveSessionId(newId);
    setMessages([initialGreeting]);
    setShowSessionsDrawer(false);
  };

  // Delete session
  const handleDeleteSession = (e: React.MouseEvent, sId: string) => {
    e.stopPropagation();
    const confirmMsg = isAr ? 'هل أنت متأكد من حذف هذه الجلسة من السجل؟' : 'Delete this session from history?';
    if (confirm(confirmMsg)) {
      deleteChatSession(sId);
      if (activeSessionId === sId) {
        handleStartNewSession();
      }
    }
  };

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Parse Action Cards from <core_suggestions> or legacy <atlas_suggestions>
  const parseSuggestions = (content: string): { cleanText: string; suggestions: SuggestionItem[] } => {
    let rawJson: string | null = null;
    let cleanText = content;

    const coreMatch = content.match(/<core_suggestions>([\s\S]*?)<\/core_suggestions>/i);
    const atlasMatch = content.match(/<atlas_suggestions>([\s\S]*?)<\/atlas_suggestions>/i);

    if (coreMatch) {
      rawJson = coreMatch[1];
      cleanText = content.replace(/<core_suggestions>[\s\S]*?<\/core_suggestions>/gi, '').trim();
    } else if (atlasMatch) {
      rawJson = atlasMatch[1];
      cleanText = content.replace(/<atlas_suggestions>[\s\S]*?<\/atlas_suggestions>/gi, '').trim();
    }

    if (!rawJson) return { cleanText, suggestions: [] };

    const suggestions: SuggestionItem[] = [];
    try {
      let sanitized = rawJson.trim();
      if (sanitized.startsWith('```json')) sanitized = sanitized.replace(/^```json/, '');
      if (sanitized.startsWith('```')) sanitized = sanitized.replace(/^```/, '');
      if (sanitized.endsWith('```')) sanitized = sanitized.replace(/```$/, '');
      sanitized = sanitized.trim();

      const parsed = JSON.parse(sanitized);

      if (Array.isArray(parsed.tasks)) {
        parsed.tasks.forEach((t: any, i: number) => {
          if (t && t.title) {
            suggestions.push({
              id: `task-${i}-${t.title.slice(0, 12)}`,
              type: 'task',
              title: t.title,
              priorityOrCategory: t.priority || 'High',
              matrixOrFrequency: t.matrix || 'Urgent-Important'
            });
          }
        });
      }

      if (Array.isArray(parsed.habits)) {
        parsed.habits.forEach((h: any, i: number) => {
          if (h && (h.name || h.title)) {
            suggestions.push({
              id: `habit-${i}-${(h.name || h.title).slice(0, 12)}`,
              type: 'habit',
              title: h.name || h.title,
              priorityOrCategory: h.category || 'Mind',
              matrixOrFrequency: h.frequency || 'Daily'
            });
          }
        });
      }
    } catch (e) {
      console.warn('Could not parse core_suggestions JSON payload:', e);
    }

    return { cleanText, suggestions };
  };

  // Toggle single card in bubble
  const toggleCardSelection = (msgId: string, itemId: string) => {
    setSelectedCards((prev) => {
      const bubble = prev[msgId] || {};
      const current = bubble[itemId] !== false;
      return {
        ...prev,
        [msgId]: {
          ...bubble,
          [itemId]: !current
        }
      };
    });
  };

  // 1-Click add single card
  const handleAddSingleItem = async (msgId: string, item: SuggestionItem) => {
    const key = `${msgId}-${item.id}`;
    if (addedSuggestions[key]) return;

    try {
      if (item.type === 'task') {
        await onAddTask({
          title: item.title,
          completed: false,
          priority: (item.priorityOrCategory as any) || 'High',
          matrix: (item.matrixOrFrequency as any) || 'Urgent-Important',
          createdAt: Date.now(),
          createdBy: 'Core Chat'
        });
      } else {
        await onAddHabit({
          title: item.title,
          category: item.priorityOrCategory || 'Mind',
          targetPerWeek: 7,
          history: {},
          streak: 0,
          createdAt: Date.now(),
          createdBy: 'Core Chat'
        } as any);
      }

      setAddedSuggestions((prev) => ({ ...prev, [key]: true }));
    } catch (err) {
      console.error('Failed adding single action card:', err);
    }
  };

  // Add selected items in bulk
  const handleAddSelectedItems = async (msgId: string, items: SuggestionItem[]) => {
    const bubble = selectedCards[msgId] || {};
    const itemsToAdd = items.filter(
      (item) => bubble[item.id] !== false && !addedSuggestions[`${msgId}-${item.id}`]
    );

    if (itemsToAdd.length === 0) return;

    try {
      for (const item of itemsToAdd) {
        if (item.type === 'task') {
          await onAddTask({
            title: item.title,
            completed: false,
            priority: (item.priorityOrCategory as any) || 'High',
            matrix: (item.matrixOrFrequency as any) || 'Urgent-Important',
            createdAt: Date.now(),
            createdBy: 'Core Chat'
          });
        } else {
          await onAddHabit({
            title: item.title,
            category: item.priorityOrCategory || 'Mind',
            targetPerWeek: 7,
            history: {},
            streak: 0,
            createdAt: Date.now(),
            createdBy: 'Core Chat'
          } as any);
        }
        setAddedSuggestions((prev) => ({ ...prev, [`${msgId}-${item.id}`]: true }));
      }
    } catch (err) {
      console.error('Failed adding selected cards in bulk:', err);
    }
  };

  // Send message with automatic multi-tier failover & session updating
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMessage: CoreChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!customPrompt) setInputValue('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const chatContext = newMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatContext,
          systemInstruction: getSystemInstruction(lang, profileName),
          dataSnapshot: telemetry.formattedPromptContext,
          generationConfig: {
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Chat request failed (${response.status})`);
      }

      const data = await response.json();
      const responseText = data.text || '';
      const assistantMessage: CoreChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        provider: data.provider || 'gemini',
        model: data.model || 'gemini-3.5-flash',
        tier: data.tier || (data.provider === 'groq' ? 2 : 1),
        failover: Boolean(data.failover),
        failoverReason: data.failoverReason
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Save / Update session in persistent history with title & conclusion snippet
      const sessionTitle = activeSession?.title && activeSession.title !== 'New Strategic Session' && activeSession.title !== 'جلسة استراتيجية جديدة'
        ? activeSession.title
        : textToSend.length > 40 ? `${textToSend.slice(0, 38)}...` : textToSend;

      const conclusion = generateConclusionSnippet(responseText);

      const updatedSession: ChatSession = {
        id: activeSessionId,
        title: sessionTitle,
        source: activeSession?.source || 'core-chat',
        sourceLabel: activeSession?.sourceLabel || (isAr ? 'Core Chat الرئيسي' : 'Core Chat Hub'),
        date: Date.now(),
        conclusion: conclusion || activeSession?.conclusion,
        messages: finalMessages,
        provider: data.provider,
        model: data.model
      };

      addOrUpdateChatSession(updatedSession);

    } catch (err: any) {
      console.error('Core Chat Execution Error:', err);
      setErrorMsg(err.message || 'Execution error');
      const errBubble: CoreChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: isAr
          ? `⚠️ **خطأ في المعالجة والتواصل**: ${err.message || 'تعذر الوصول إلى مزودي الذكاء الاصطناعي.'}`
          : `⚠️ **Multi-Provider Error**: ${err.message || 'AI providers could not be reached.'}`,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errBubble]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Executive Queries
  const executivePrompts = isAr
    ? [
        {
          title: 'ملخص أسبوعي تنفيذي',
          subtitle: 'تحليل الأرقام والإنجازات في جدول منظم',
          prompt: 'قدم لي ملخصاً تنفيذياً شاملاً (Executive Resume) لأدائي استناداً إلى بياناتي الحية، مع جدول Markdown تفصيلي للأولويات والمهام المرحلة.'
        },
        {
          title: 'كشف الاختناقات والتسويف',
          subtitle: 'فحص المهام المرحلة والعادات المهملة',
          prompt: 'ما هي الاختناقات (Bottlenecks) في مهامي حالياً؟ أين أقوم بالتسويف استناداً إلى المهام المرحلة (Rollover)؟ واقترح حلولاً في جدول واضح مع كروت أفعال.'
        },
        {
          title: 'أهم 3 أولويات قصوى للغد',
          subtitle: 'مصفوفة العائد الاستراتيجي الأكبر',
          prompt: 'ما هي أهم 3 أولويات عالية الأثر (High-Leverage) يجب أن أركز عليها غداً؟ وزعها عبر جدول مقارنة وكروت أفعال واضحة.'
        }
      ]
    : [
        {
          title: 'Weekly Executive Resume',
          subtitle: 'Data-driven overview of real progress in tables',
          prompt: 'Give me an executive resume of my week based on my real tasks, habit consistency, and daily blocks. Provide a structured Markdown table.'
        },
        {
          title: 'Bottlenecks & Procrastination',
          subtitle: 'Audit stalled tasks and delayed work',
          prompt: 'What are my current bottlenecks and where am I procrastinating based on my rollover tasks? Present findings in a comparison table and action cards.'
        },
        {
          title: 'Top 3 High-Leverage Priorities',
          subtitle: 'Ruthless strategic focus for tomorrow',
          prompt: 'What are my top 3 high-leverage priorities for tomorrow? Formulate them in an executive priorities table and actionable cards.'
        }
      ];

  const currentSourceMeta = getSourceMeta(activeSession?.source || 'core-chat', isAr ? 'ar' : 'en');

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-5rem)] max-w-5xl mx-auto px-2 sm:px-4 py-2 animate-fadeIn font-sans relative">
      
      {/* HEADER: Title, Source Tag, Failover Badge, History Drawer Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 mb-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#2D3136] text-[#34D399] flex items-center justify-center border border-[#34D399]/30 shadow-xs shrink-0">
            <Bot size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[#2F3437] dark:text-white tracking-tight">
                {isAr ? 'Core Chat | المستشار التنفيذي وتدقيق الأداء' : 'Core Chat | Executive AI & Telemetry Auditor'}
              </h2>

              {/* Source Tag Badge */}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                <span>{currentSourceMeta.iconEmoji}</span>
                <span>{isAr ? `المصدر: ${currentSourceMeta.label}` : `Source: ${currentSourceMeta.label}`}</span>
              </span>

              {/* Failover cascade badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold">
                <ShieldCheck size={11} />
                <span>Tier 1: Gemini 3.5 ➔ Tier 2: Groq 70B</span>
              </div>
            </div>

            <p className="text-xs text-[#787774] dark:text-neutral-400 mt-0.5">
              {isAr
                ? `بيانات حية: ${telemetry.summary.tasks.pending} مهام معلقة | عادات اليوم ${telemetry.summary.habits.todayRatePercent}% | ${telemetry.summary.dailyBlocks.deepWorkCount} بلوكات عمل عميق.`
                : `Live Telemetry: ${telemetry.summary.tasks.pending} pending tasks | ${telemetry.summary.habits.todayRatePercent}% habits today | ${telemetry.summary.dailyBlocks.deepWorkCount} deep work blocks.`}
            </p>
          </div>
        </div>

        {/* Action Controls: History Sessions, New Chat, AI Providers */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          
          {/* Past Consultations Drawer Button */}
          <button
            onClick={() => setShowSessionsDrawer(!showSessionsDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-neutral-700 bg-[#FBFBFA] dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[#2F3437] dark:text-white text-xs font-semibold transition-all cursor-pointer shadow-3xs"
            title={isAr ? 'عرض الجلسات والتحليلات السابقة ومصادرها' : 'View past sessions, dates, and conclusions'}
          >
            <History size={13} className="text-emerald-600" />
            <span>{isAr ? `سجل الجلسات (${sessions.length})` : `History (${sessions.length})`}</span>
          </button>

          {/* New Strategic Chat Button */}
          <button
            onClick={handleStartNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-neutral-700 bg-[#FBFBFA] dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[#2F3437] dark:text-white text-xs font-semibold transition-all cursor-pointer shadow-3xs"
            title={isAr ? 'بدء جلسة جديدة' : 'Start a fresh consultation'}
          >
            <MessageSquarePlus size={13} className="text-[#34D399]" />
            <span>{isAr ? 'جلسة جديدة' : 'New Session'}</span>
          </button>

          {/* Provider Settings Button */}
          <button
            onClick={() => {
              fetchProviderStatus();
              setShowConfigModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-neutral-700 bg-[#FBFBFA] dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-[#2F3437] dark:text-white text-xs font-semibold transition-all cursor-pointer shadow-3xs"
            title={isAr ? 'إدارة مزودي الذكاء الاصطناعي والمفاتيح' : 'Configure AI Providers & API Keys'}
          >
            <Sliders size={13} className="text-blue-500" />
            <span>{isAr ? 'المزودات' : 'Providers'}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE SESSION TITLE & CONCLUSION BANNER */}
      {activeSession && activeSession.conclusion && (
        <div className="mb-2.5 p-2.5 px-3.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-emerald-600 font-bold font-mono text-[11px] uppercase tracking-wider shrink-0">
              {isAr ? '💡 خلاصة الجلسة:' : '💡 Key Takeaway:'}
            </span>
            <span className="text-neutral-700 dark:text-neutral-300 truncate font-medium">
              {activeSession.conclusion}
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono shrink-0">
            {new Date(activeSession.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}

      {/* CHAT MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-neutral-800 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const { cleanText, suggestions } = isUser
            ? { cleanText: msg.content, suggestions: [] }
            : parseSuggestions(msg.content);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                  isUser
                    ? 'bg-[#2D3136] text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-3xs'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble + Markdown Tables + Action Cards */}
              <div className="flex-1 max-w-[92%] sm:max-w-[85%] space-y-2.5">
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed border ${
                    isUser
                      ? 'bg-[#2D3136] text-white border-[#2D3136] shadow-xs'
                      : 'bg-[#FBFBFA] dark:bg-[#181A1F] text-[#2F3437] dark:text-neutral-100 border-[#EAE9E6] dark:border-neutral-800 shadow-2xs'
                  }`}
                >
                  {/* RENDER BEAUTIFUL MARKDOWN TABLES, LISTS, CODE & HEADERS */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{cleanText}</div>
                  ) : (
                    <MarkdownView content={cleanText} />
                  )}

                  {/* Metadata Footer */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] opacity-75">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!isUser && msg.provider && (
                        <span className={`inline-flex items-center gap-1 font-mono font-bold px-1.5 py-0.5 rounded border ${
                          msg.provider === 'gemini'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                        }`}>
                          {msg.provider === 'gemini' ? <Zap size={10} /> : <Cpu size={10} />}
                          <span>{msg.provider === 'gemini' ? 'Gemini 3.5 Flash' : 'Groq Llama 3.3 70B'}</span>
                          {msg.failover && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold ml-1">
                              (Failover Cascade)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {!isUser && (
                      <button
                        onClick={() => handleCopyText(msg.id, cleanText)}
                        className="hover:opacity-100 flex items-center gap-1 cursor-pointer transition-opacity"
                      >
                        {copiedId === msg.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        {copiedId === msg.id ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                      </button>
                    )}
                  </div>
                </div>

                {/* INTERACTIVE ACTION CARDS (UNDER ASSISTANT BUBBLE) */}
                {suggestions.length > 0 && (
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl p-3 sm:p-4 space-y-3 shadow-3xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        <Sparkles size={14} className="text-emerald-600" />
                        <span>{isAr ? 'كروت الإجراءات التنفيذية (Action Cards)' : 'Executive Action Cards'}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                        {isAr ? 'إضافة مباشرة إلى النظام بضغطة زر' : '1-click direct integration'}
                      </span>
                    </div>

                    {/* Cards list */}
                    <div className="space-y-2">
                      {suggestions.map((item) => {
                        const uniqueKey = `${msg.id}-${item.id}`;
                        const isAdded = addedSuggestions[uniqueKey];
                        const isChecked = selectedCards[msg.id]?.[item.id] !== false;

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 bg-white dark:bg-[#1E2025] ${
                              isAdded
                                ? 'opacity-60 border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900'
                                : isChecked
                                ? 'border-emerald-300 dark:border-emerald-700 shadow-3xs'
                                : 'border-[#EAE9E6] dark:border-neutral-800 hover:border-neutral-300'
                            }`}
                          >
                            <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none min-w-0">
                              <input
                                type="checkbox"
                                disabled={isAdded}
                                checked={isChecked && !isAdded}
                                onChange={() => toggleCardSelection(msg.id, item.id)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 dark:border-neutral-700 transition-all"
                              />
                              <div className="min-w-0">
                                <span
                                  className={`text-xs font-bold block truncate ${
                                    isAdded
                                      ? 'line-through text-neutral-400 dark:text-neutral-500'
                                      : 'text-[#2F3437] dark:text-white'
                                  }`}
                                >
                                  {item.title}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span
                                    className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                                      item.type === 'task'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                    }`}
                                  >
                                    {item.type === 'task' ? (isAr ? 'مهمة' : 'Task') : (isAr ? 'عادة' : 'Habit')}
                                  </span>

                                  {item.priorityOrCategory && (
                                    <span className="text-[9px] font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded border border-neutral-200 dark:border-neutral-700">
                                      {item.priorityOrCategory}
                                    </span>
                                  )}

                                  {item.matrixOrFrequency && (
                                    <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400">
                                      • {item.matrixOrFrequency}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>

                            {/* 1-Click Action Button / Badge */}
                            <div className="shrink-0">
                              {isAdded ? (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono uppercase bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                  <Check size={12} />
                                  {isAr ? 'تمت الإضافة' : 'Added'}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddSingleItem(msg.id, item)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2D3136] hover:bg-black text-white text-[10px] font-bold transition-all shadow-3xs cursor-pointer active:scale-95"
                                  title={isAr ? 'إضافة فورية' : 'Quick Add'}
                                >
                                  <PlusCircle size={12} />
                                  <span>{isAr ? 'إضافة' : 'Add'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bulk Add Button */}
                    <button
                      onClick={() => handleAddSelectedItems(msg.id, suggestions)}
                      disabled={suggestions.every((item) => addedSuggestions[`${msg.id}-${item.id}`])}
                      className="w-full flex items-center justify-center gap-2 bg-[#2D3136] hover:bg-black text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <PlusCircle size={14} />
                      <span>{isAr ? 'إضافة العناصر المحددة دفعة واحدة' : 'Add Selected to Core Workspace'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-[#787774] dark:text-neutral-400 p-3 bg-[#FBFBFA] dark:bg-[#181A1F] rounded-2xl w-fit border border-[#EAE9E6] dark:border-neutral-800 animate-pulse">
            <Loader2 size={16} className="animate-spin text-emerald-600" />
            <span>
              {isAr
                ? 'Core Chat يحلل بياناتك ويصيغ الجداول والاستنتاجات...'
                : 'Core Chat is processing real-time telemetry, formatting tables and conclusions...'}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 max-w-lg">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-1">
              <span className="font-bold">{isAr ? 'تنبيه' : 'Alert'}:</span>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK EXECUTIVE ACTION QUERIES */}
      {messages.length <= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-2.5">
          {executivePrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              className="p-3 rounded-xl border border-[#EAE9E6] dark:border-neutral-800 bg-white dark:bg-[#1E2025] hover:border-emerald-400 dark:hover:border-emerald-600 text-left transition-all group cursor-pointer shadow-3xs hover:shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2F3437] dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                <Sparkles size={13} className="text-emerald-500 shrink-0" />
                <span className="truncate">{qp.title}</span>
              </div>
              <p className="text-[10px] text-[#787774] dark:text-neutral-400 mt-1 line-clamp-1">
                {qp.subtitle}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* CHAT INPUT BAR */}
      <div className="mt-2.5 bg-white dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-neutral-800 rounded-2xl p-2 sm:p-3 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isAr
                ? 'اسأل Core Chat عن أولوياتك، الاختناقات، ملخص أسبوعك، أو اطلب كروت مهام وعادات جديدة...'
                : 'Ask Core Chat for executive reviews, bottleneck audits, ruthless priorities, or action cards...'
            }
            rows={2}
            className="flex-1 resize-none bg-transparent text-xs sm:text-sm text-[#2F3437] dark:text-white placeholder-[#787774] dark:placeholder-neutral-500 focus:outline-none px-2 py-1 leading-relaxed"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#2D3136] hover:bg-black dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer active:scale-95"
            >
              <Send size={15} />
              <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Send'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SESSIONS HISTORY DRAWER (SOURCE TRACKING, DATE, CONCLUSION) */}
      {showSessionsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-end animate-fadeIn">
          <div className="bg-white dark:bg-[#181A1F] border-l border-[#EAE9E6] dark:border-neutral-800 w-full max-w-md h-full shadow-2xl flex flex-col p-4 sm:p-5 animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE9E6] dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <History size={18} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {isAr ? 'سجل الجلسات والتحليلات السابقة' : 'Consultations & Audit History'}
                </h3>
              </div>
              <button
                onClick={() => setShowSessionsDrawer(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Action: Start New Chat */}
            <div className="py-3">
              <button
                onClick={handleStartNewSession}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2D3136] hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <MessageSquarePlus size={15} />
                <span>{isAr ? 'بدء جلسة تحليل استراتيجية جديدة' : 'Start New Strategic Session'}</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-400">
                  {isAr ? 'لا توجد جلسات سابقة بعد.' : 'No past sessions logged yet.'}
                </div>
              ) : (
                sessions.map((session) => {
                  const isCurrent = session.id === activeSessionId;
                  const sMeta = getSourceMeta(session.source, isAr ? 'ar' : 'en');

                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-3xs'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-[#1E2025]'
                      }`}
                    >
                      {/* Top Row: Source Badge & Date */}
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          <span>{sMeta.iconEmoji}</span>
                          <span>{sMeta.label}</span>
                        </span>

                        <div className="flex items-center gap-2 text-neutral-400 font-mono">
                          <span>
                            {new Date(session.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                            {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="text-neutral-400 hover:text-rose-600 transition-colors p-0.5"
                            title={isAr ? 'حذف الجلسة' : 'Delete session'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                        {session.title}
                      </div>

                      {/* Conclusion / Takeaway Pill */}
                      {session.conclusion && (
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/80 p-1.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 line-clamp-2 leading-relaxed">
                          <span className="font-bold text-emerald-600 font-mono text-[10px] mr-1">
                            {isAr ? 'الخلاصة:' : 'Takeaway:'}
                          </span>
                          {session.conclusion}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: AI PROVIDERS CONFIGURATION & FAILOVER HEALTH */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#EAE9E6] dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#34D399]" />
                <h3 className="text-sm font-bold text-[#2F3437] dark:text-white">
                  {isAr ? 'إعدادات مزودي الذكاء الاصطناعي وشلال الفشل' : 'AI Providers & 2-Tier Failover Cascade'}
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Cascade explanation */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>{isAr ? 'نظام الشلال التلقائي (Automatic Multi-Provider Cascade)' : 'Automatic Multi-Provider Failover'}</span>
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {isAr
                    ? 'يتم توجيه الطلبات أولاً إلى Google Gemini 3.5 Flash. وفي حالة حدوث خطأ أو انتهاء الحصة (429 Quota Exceeded)، يتم التبديل آلياً إلى خوادم Groq Cloud الفائقة السرعة (Llama 3.3 70B).'
                    : 'Requests hit Google Gemini 3.5 Flash (Tier 1) first. If rate limited (HTTP 429) or quota exhausted, the backend automatically cascades to ultra-fast Groq Cloud (Llama 3.3 70B).'}
                </p>
              </div>

              {/* Providers Status Cards */}
              <div className="space-y-2.5">
                {/* Tier 1: Gemini */}
                <div className="p-3 rounded-xl border border-[#EAE9E6] dark:border-neutral-800 bg-[#FBFBFA] dark:bg-[#181A1F] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-[#2F3437] dark:text-white">
                      <Zap size={14} className="text-blue-500" />
                      <span>Tier 1: Google Gemini 3.5 Flash</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {providerStatus?.geminiMasked
                        ? `Key: ${providerStatus.geminiMasked}`
                        : (isAr ? 'المفتاح الافتراضي مدمج' : 'Default key loaded on server')}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {providerStatus?.geminiConfigured ? (isAr ? 'نشط (Tier 1)' : 'Active (Tier 1)') : (isAr ? 'غير مفعل' : 'Not configured')}
                  </span>
                </div>

                {/* Tier 2: Groq */}
                <div className="p-3 rounded-xl border border-[#EAE9E6] dark:border-neutral-800 bg-[#FBFBFA] dark:bg-[#181A1F] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-[#2F3437] dark:text-white">
                      <Cpu size={14} className="text-amber-500" />
                      <span>Tier 2: Groq Llama 3.3 70B Versatile</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {providerStatus?.groqMasked
                        ? `Key: ${providerStatus.groqMasked}`
                        : (isAr ? 'المفتاح الافتراضي مدمج' : 'Default key loaded on server')}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {providerStatus?.groqConfigured ? (isAr ? 'نشط (Tier 2)' : 'Active (Tier 2)') : (isAr ? 'غير مفعل' : 'Not configured')}
                  </span>
                </div>
              </div>

              {/* Form to change / override keys */}
              <form onSubmit={handleSaveKeys} className="space-y-3 pt-2 border-t border-[#EAE9E6] dark:border-neutral-800">
                <h4 className="font-bold text-[#2F3437] dark:text-white flex items-center gap-1.5">
                  <Key size={14} className="text-[#34D399]" />
                  <span>{isAr ? 'تغيير أو إضافة مفاتيح جديدة للـ API' : 'Change or Override Provider API Keys'}</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#2D3136] dark:text-neutral-300">
                    {isAr ? 'مفتاح Gemini API الجديد (اختياري للتحديث):' : 'Gemini API Key (Optional Override):'}
                  </label>
                  <input
                    type="password"
                    value={customGeminiKey}
                    onChange={(e) => setCustomGeminiKey(e.target.value)}
                    placeholder="AQ.Ab8RN6LdTgD..."
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-neutral-800 bg-neutral-50 dark:bg-[#181A1F] text-xs font-mono text-[#2D3136] dark:text-white focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#2D3136] dark:text-neutral-300">
                    {isAr ? 'مفتاح Groq Cloud API الجديد (اختياري للتحديث):' : 'Groq Cloud API Key (Optional Override):'}
                  </label>
                  <input
                    type="password"
                    value={customGroqKey}
                    onChange={(e) => setCustomGroqKey(e.target.value)}
                    placeholder="gsk_LRKAN4kXTRA9..."
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE9E6] dark:border-neutral-800 bg-neutral-50 dark:bg-[#181A1F] text-xs font-mono text-[#2D3136] dark:text-white focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                {keysFeedback && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                    {keysFeedback}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-3 py-1.5 rounded-xl border border-[#EAE9E6] dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold cursor-pointer"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingKeys || (!customGeminiKey.trim() && !customGroqKey.trim())}
                    className="px-4 py-1.5 rounded-xl bg-[#2D3136] hover:bg-black dark:bg-white dark:text-neutral-900 text-white font-bold transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    {isSavingKeys ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'تحديث المفاتيح' : 'Update Keys')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Re-export as Atlas for 100% backward compatibility
export const Atlas = CoreChat;
export default CoreChat;
