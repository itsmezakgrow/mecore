import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  Loader2,
  PlusCircle,
  Check,
  Zap,
  ExternalLink,
  Flame,
  CheckSquare,
  Clock,
  Layers,
  Dumbbell,
  BookOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { TaskItem, HabitItem, DailyBlockItem, ProjectItem, GoalItem, ReviewEntry, ChatMessage, ChatSessionSource, ChatSession } from '../types';
import { compileExecutiveTelemetry } from '../utils/executiveTelemetry';
import { addOrUpdateChatSession, getSourceMeta, generateConclusionSnippet } from '../utils/chatSessionStore';
import MarkdownView from './MarkdownView';

interface ContextualAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: ChatSessionSource;
  onNavigateToCoreChat: () => void;
  tasks?: TaskItem[];
  habits?: HabitItem[];
  dailyBlocks?: DailyBlockItem[];
  projects?: ProjectItem[];
  goals?: GoalItem[];
  reviews?: ReviewEntry[];
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

export const ContextualAdvisorModal: React.FC<ContextualAdvisorModalProps> = ({
  isOpen,
  onClose,
  source,
  onNavigateToCoreChat,
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
  const sourceMeta = getSourceMeta(source, isAr ? 'ar' : 'en');

  const [sessionId] = useState<string>(() => `session-${source}-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedSuggestions, setAddedSuggestions] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live telemetry snapshot
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

  // Contextual prompts based on current page
  const contextualPrompts = useMemo(() => {
    const list = [
      {
        id: 'week-resume',
        label: isAr ? 'ملخص أسبوعي تنفيذي' : 'Weekly Executive Resume',
        icon: Sparkles,
        prompt: isAr 
          ? 'قدم لي ملخصاً تنفيذياً شاملاً (Executive Resume) لأدائي استناداً إلى بياناتي الحية، مع جدول واضح لأولويات الأسبوع.' 
          : 'Give me an executive resume of my week based on my real tasks, habit consistency, and daily blocks. Provide a clean priorities table.'
      },
      {
        id: 'today-resume',
        label: isAr ? 'ملخص اليوم والأولويات' : 'Today Executive Brief',
        icon: Zap,
        prompt: isAr 
          ? 'قدم لي ملخصاً مكثفاً لليوم مع أهم 3 مهام عمل عميق يجب إنجازها الآن استناداً لبياناتي.' 
          : 'Give me a condensed executive briefing for today with the top 3 deep work focus priorities based on my data.'
      },
      {
        id: 'bottlenecks',
        label: isAr ? 'كشف الاختناقات والتسويف' : 'Bottlenecks & Stalled Tasks',
        icon: AlertCircle,
        prompt: isAr
          ? 'ما هي الاختناقات والمهام المعلقة أو المؤجلة (Rollover)؟ اقترح حلولاً وجدولاً للأولويات وكروت أفعال.'
          : 'Audit my current bottlenecks and stalled/rollover tasks. Recommend ruthless tactical solutions as a table and action cards.'
      }
    ];

    // Page-specific shortcuts
    if (source === 'tasks') {
      list.unshift({
        id: 'task-80-20',
        label: isAr ? 'تصفية المهام 80/20' : 'Ruthless 80/20 Prioritization',
        icon: CheckSquare,
        prompt: isAr
          ? 'قم بإجراء تصفية 80/20 لقائمة مهامي المعلقة. صنفها في جدول يوضح الأولوية وتأثيرها على الأهداف الرئيسية.'
          : 'Perform a ruthless 80/20 prioritization of my pending tasks. Present them in an executive table with Priority, Task, and Impact.'
      });
    } else if (source === 'habits') {
      list.unshift({
        id: 'habit-audit',
        label: isAr ? 'تدقيق العادات والسلاسل' : 'Audit Habits & Streaks',
        icon: Flame,
        prompt: isAr
          ? 'حلل استمرارية عاداتي لآخر 7 أيام، وحدد العادات المتعثرة وكيفية ربطها (Habit Stacking).'
          : 'Audit my 7-day habit consistency and broken streaks. Recommend micro-habits and habit stacking as action cards.'
      });
    } else if (source === 'daily-blocks') {
      list.unshift({
        id: 'blocks-deepwork',
        label: isAr ? 'تحسين قوالب اليوم والتركيز' : 'Optimize Daily Blocks',
        icon: Layers,
        prompt: isAr
          ? 'حلل جدول قوالب اليوم (Daily Blocks) وساعات العمل العميق. كيف يمكنني ترتيب الفترات لتعظيم الإنتاجية الذهنية؟'
          : 'Analyze today\'s scheduled daily blocks and deep work hours. How should I sequence them for peak cognitive output?'
      });
    } else if (source === 'training') {
      list.unshift({
        id: 'training-audit',
        label: isAr ? 'تدقيق التدريب والجهد البدني' : 'Audit Iron Workout Volume',
        icon: Dumbbell,
        prompt: isAr
          ? 'حلل روتين تماريني وأدائي البدني. كيف يمكنني تطبيق الزيادة التدريجية (Progressive Overload) بأفضل صورة؟'
          : 'Audit my workout frequency, volume, and consistency. Suggest tactical progressive overload refinements.'
      });
    } else if (source === 'reflections') {
      list.unshift({
        id: 'reflection-synthesis',
        label: isAr ? 'تركيب الدروس والتأملات' : 'Synthesize Mental Clarity',
        icon: BookOpen,
        prompt: isAr
          ? 'قم بتحليل تأملاتي والدروس المستفادة، واستخرج النمط الذهني المتكرر (Cognitive Blindspots) لتطوير أدائي.'
          : 'Synthesize my reflections and lesson logs. Extract cognitive patterns and blindspots to elevate my executive performance.'
      });
    }

    return list;
  }, [source, isAr]);

  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        const welcome: ChatMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: isAr
            ? `مرحباً بك! أنا مستشارك التنفيذي السريع من صفحة **${sourceMeta.label}**.\n\nبياناتك الحية محملة وجاهزة للتحليل الفوري. اختر أحد الإجراءات السريعة بالأسفل أو اكتب استفسارك مباشرة.`
            : `Executive Advisor active on **${sourceMeta.label}**.\n\nYour live workspace data is loaded. Select a quick action query below or ask any tactical question.`,
          timestamp: Date.now()
        };
        setMessages([welcome]);
      }
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // Parse Action Cards from <core_suggestions> or <atlas_suggestions>
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

      const parsed = JSON.parse(sanitized.trim());
      if (Array.isArray(parsed.tasks)) {
        parsed.tasks.forEach((t: any, i: number) => {
          if (t && t.title) {
            suggestions.push({
              id: `task-${i}-${t.title.slice(0, 10)}`,
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
              id: `habit-${i}-${(h.name || h.title).slice(0, 10)}`,
              type: 'habit',
              title: h.name || h.title,
              priorityOrCategory: h.category || 'Mind',
              matrixOrFrequency: h.frequency || 'Daily'
            });
          }
        });
      }
    } catch (e) {}

    return { cleanText, suggestions };
  };

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
          createdBy: `Core Chat (${sourceMeta.label})`
        });
      } else {
        await onAddHabit({
          title: item.title,
          category: item.priorityOrCategory || 'Mind',
          targetPerWeek: 7,
          history: {},
          streak: 0,
          createdAt: Date.now(),
          createdBy: `Core Chat (${sourceMeta.label})`
        } as any);
      }
      setAddedSuggestions(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!customPrompt) setInputValue('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const chatContext = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const pageContext = `CURRENT PAGE / CONTEXT: "${sourceMeta.label}" (source id: ${source}). Provide immediate tactical insights tailored to this context. When recommending tasks or priorities, ALWAYS use clean Markdown tables (with columns | Priority | Task | Why it moves the needle |) and append <core_suggestions> JSON tags.`;

      const clientGeminiKey = (localStorage.getItem('core_gemini_api_key') || '').trim();
      const clientGroqKey = (localStorage.getItem('core_groq_api_key') || '').trim();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatContext,
          systemInstruction: `You are Core Chat Executive Advisor serving from page "${sourceMeta.label}". ${isAr ? 'Respond in professional executive Arabic.' : 'Respond in sharp executive English.'} Present priorities in clean Markdown tables and wrap actionable suggestions in <core_suggestions> JSON.`,
          dataSnapshot: `${pageContext}\n\n${telemetry.formattedPromptContext}`,
          customKeys: {
            gemini: clientGeminiKey,
            groq: clientGroqKey
          }
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const asstText = data.text || '';

      const asstMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: asstText,
        timestamp: Date.now()
      };

      const finalMessages = [...newMessages, asstMsg];
      setMessages(finalMessages);

      // Auto-save this consultation into shared Core Chat history with page source & conclusion!
      const conclusionSnippet = generateConclusionSnippet(asstText);
      const sessionObj: ChatSession = {
        id: sessionId,
        title: text.length > 40 ? `${text.slice(0, 37)}...` : text,
        source: source,
        sourceLabel: sourceMeta.label,
        date: Date.now(),
        conclusion: conclusionSnippet,
        messages: finalMessages,
        provider: data.provider,
        model: data.model
      };
      addOrUpdateChatSession(sessionObj);

    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to connect to advisor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#181A1F] border border-[#EAE9E6] dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] overflow-hidden">
        
        {/* Header with Source Badge & Actions */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#EAE9E6] dark:border-neutral-800 bg-[#FBFBFA] dark:bg-[#15171B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2D3136] text-[#34D399] flex items-center justify-center border border-[#34D399]/30 shrink-0">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#2F3437] dark:text-white">
                  {isAr ? 'المستشار التنفيذي اللحظي' : 'Executive In-Context Advisor'}
                </h3>
                {/* Source Badge */}
                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span>{sourceMeta.iconEmoji}</span>
                  <span>{sourceMeta.label}</span>
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {isAr ? 'متصل ببياناتك الحية وبنظام الشلال الذكي' : 'Connected to live workspace telemetry & multi-tier failover'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Open Full Core Chat button */}
            <button
              onClick={() => {
                onClose();
                onNavigateToCoreChat();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-[#EAE9E6] dark:border-neutral-700 text-[11px] font-bold text-neutral-700 dark:text-neutral-200 transition-all cursor-pointer shadow-3xs"
              title={isAr ? 'الانتقال إلى Core Chat الكامل' : 'Open in Full Core Chat Hub'}
            >
              <span>{isAr ? 'فتح المحادثة الكاملة' : 'Full Core Chat'}</span>
              <ExternalLink size={12} />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Action Queries Banner */}
        <div className="p-2 sm:p-2.5 bg-neutral-50/80 dark:bg-neutral-900/40 border-b border-[#EAE9E6] dark:border-neutral-800 overflow-x-auto flex items-center gap-1.5 custom-scrollbar">
          {contextualPrompts.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={() => handleSendMessage(btn.prompt)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1E2025] hover:border-emerald-400 dark:hover:border-emerald-600 border border-[#EAE9E6] dark:border-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-400 whitespace-nowrap transition-all shadow-3xs shrink-0 cursor-pointer disabled:opacity-40"
              >
                <Icon size={12} className="text-emerald-500" />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Messages Stream with MarkdownView & Action Cards */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 bg-white dark:bg-[#181A1F]">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const { cleanText, suggestions } = isUser ? { cleanText: m.content, suggestions: [] } : parseSuggestions(m.content);

            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                    isUser
                      ? 'bg-[#2D3136] text-white shadow-3xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {isUser ? 'ME' : <Bot size={14} />}
                </div>

                <div className="flex-1 max-w-[90%] sm:max-w-[85%] space-y-2">
                  <div
                    className={`rounded-2xl p-3.5 text-xs leading-relaxed border ${
                      isUser
                        ? 'bg-[#2D3136] text-white border-[#2D3136] shadow-3xs'
                        : 'bg-[#FBFBFA] dark:bg-[#1E2025] text-neutral-800 dark:text-neutral-100 border-[#EAE9E6] dark:border-neutral-800 shadow-3xs'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{cleanText}</div>
                    ) : (
                      <MarkdownView content={cleanText} />
                    )}

                    <div className="mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[9px] opacity-60 flex justify-between items-center">
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-mono">{sourceMeta.label}</span>
                    </div>
                  </div>

                  {/* Action Cards under Bubble */}
                  {suggestions.length > 0 && (
                    <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2 shadow-3xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        <Sparkles size={12} className="text-emerald-600" />
                        <span>{isAr ? 'توصيات إجرائية (Action Cards)' : 'Action Cards Recommendations'}</span>
                      </div>
                      <div className="space-y-1.5">
                        {suggestions.map((card) => {
                          const key = `${m.id}-${card.id}`;
                          const isAdded = addedSuggestions[key];

                          return (
                            <div
                              key={card.id}
                              className="p-2 rounded-lg bg-white dark:bg-[#181A1F] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <span className={`text-xs font-bold block truncate ${isAdded ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                  {card.title}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[9px] font-mono uppercase px-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    {card.type}
                                  </span>
                                  <span className="text-[9px] text-neutral-500 font-semibold">
                                    {card.priorityOrCategory}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddSingleItem(m.id, card)}
                                disabled={isAdded}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                  isAdded
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-[#2D3136] hover:bg-black text-white active:scale-95'
                                }`}
                              >
                                {isAdded ? <Check size={11} /> : <PlusCircle size={11} />}
                                <span>{isAdded ? (isAr ? 'تمت' : 'Added') : (isAr ? 'إضافة' : 'Add')}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl text-xs text-neutral-500 w-fit animate-pulse border border-neutral-200 dark:border-neutral-700">
              <Loader2 size={14} className="animate-spin text-emerald-600" />
              <span>{isAr ? 'المستشار يحلل البيانات ويعد الإجابة والجداول...' : 'Advisor analyzing telemetry and formatting insights...'}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-2.5 sm:p-3 bg-[#FBFBFA] dark:bg-[#15171B] border-t border-[#EAE9E6] dark:border-neutral-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isAr ? `اسأل المستشار عن ${sourceMeta.label} أو اطلب تحليلاً شاملاً...` : `Ask Advisor regarding ${sourceMeta.label} or request custom table...`}
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-neutral-800 text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-[#2D3136] hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer active:scale-95 shadow-3xs"
            >
              <Send size={13} />
              <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Send'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ContextualAdvisorModal;
