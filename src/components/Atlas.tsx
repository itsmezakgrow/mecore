import React, { useState, useEffect, useRef } from 'react';
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
  BrainCircuit,
  Key,
  PlusCircle,
  Award,
  CheckSquare,
  HelpCircle,
  Activity
} from 'lucide-react';
import { ChatMessage, TaskItem, HabitItem } from '../types';

interface AtlasProps {
  habitsCount?: number;
  tasksCount?: number;
  goalsCount?: number;
  onNavigateToPlanImport?: () => void;
  lang?: 'en' | 'ar';
  onAddTask: (task: Omit<TaskItem, 'id'>) => Promise<any>;
  onAddHabit: (habit: Omit<HabitItem, 'id'>) => Promise<any>;
}

const STORAGE_KEY_API_KEY = 'core_gemini_api_key';
const STORAGE_KEY_CHAT_HISTORY = 'core_atlas_chat_history';

interface SuggestionItem {
  type: 'task' | 'habit';
  title: string;
  categoryOrPriority?: string;
  matrixOrFrequency?: string;
  id: string;
}

interface SuggestionData {
  tasks?: Array<{ title: string; priority?: string; matrix?: string }>;
  habits?: Array<{ name: string; category?: string; frequency?: string }>;
}

const getSystemInstruction = (lang: string, userName: string) => {
  const isAr = lang === 'ar';
  const nameContext = userName ? `The user's name is "${userName}". You MUST address them directly by their name in a friendly, respectful executive-coach tone.` : '';

  return `You are "Atlas", the elite Executive AI Action-Mentor & Productivity Coach integrated into the "Core" Operating System.
Your mission is to help the user design high-leverage habit systems, prioritize tasks with absolute clarity, and build plans for peak execution.

${nameContext}

${isAr ? 'CRITICAL: The interface language is currently ARABIC. You MUST respond entirely in ARABIC, except for specific code/JSON schemas or technical names if appropriate. Keep your response in fluent, clear, and professional Arabic.' : 'CRITICAL: The interface language is currently ENGLISH. You must respond entirely in English.'}

Tone & Style:
- Direct, elite, strategic, and tactical (James Clear & Cal Newport style).
- Always address the user by name if provided.
- Provide highly concrete, actionable habits and tasks.

ACTION CARDS PROTOCOL:
Whenever you suggest specific positive habits or high-priority tasks, you MUST also output an automated JSON suggestions payload at the end of your response, wrapped inside '<atlas_suggestions>' and '</atlas_suggestions>' tags. This is crucial as the interface parses this payload to render interactive "Action Cards" that the user can instantly write to their active tracker.

The JSON schema must strictly look like this:
<atlas_suggestions>
{
  "tasks": [
    { "title": "Review database index configurations", "priority": "High", "matrix": "Urgent-Important" }
  ],
  "habits": [
    { "name": "10-minute morning strategic journaling", "category": "Mind", "frequency": "Daily" }
  ]
}
</atlas_suggestions>

Keep the JSON perfectly valid. Do not put backticks or any extra text inside the tags, just raw JSON. Always suggest 1 to 3 items when giving recommendations.`;
};

export const Atlas: React.FC<AtlasProps> = ({
  habitsCount = 0,
  tasksCount = 0,
  goalsCount = 0,
  onNavigateToPlanImport,
  lang = 'en',
  onAddTask,
  onAddHabit,
}) => {
  const isAr = lang === 'ar';

  // Load user profile name
  const [profileName] = useState<string>(() => {
    try {
      return localStorage.getItem('core_profile_name') || '';
    } catch {
      return '';
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // States to track which interactive action card suggestions have been added to prevent duplicates
  const [addedSuggestions, setAddedSuggestions] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    const greeting = profileName 
      ? (isAr 
          ? `مرحباً بك يا ${profileName}! أنا **أطلس (Atlas)**، مستشارك التنفيذي المتكامل.\n\nأنا هنا لمساعدتك على صياغة عادات عالية الأثر، وجدولة مهامك الأساسية، وبناء مصفوفة إنتاجيتك الفعّالة. تفضل بطرح أسئلتك، وسأقوم بتوليد توصيات ملموسة يمكنك إضافتها لملفك بضغطة زر واحدة.`
          : `Welcome back, **${profileName}**! I am **Atlas**, your executive action advisor.\n\nI am here to help you audit your habits, engineer your tasks, and design elite productivity flows. Pitch your challenge or ask for recommendations, and I will generate interactive Action Cards you can add to your Core instantly.`)
      : (isAr
          ? `مرحباً بك! أنا **أطلس (Atlas)**، مستشارك التنفيذي المتكامل.\n\nيرجى تكوين اسمك في الإعدادات لأتمكن من مخاطبتك بشكل مخصص. كيف يمكنني دعم خططك وإنتاجيتك اليوم؟`
          : `Welcome! I am **Atlas**, your executive action advisor.\n\nPlease configure your Profile Name in Settings so I can customize my coaching for you. How can we elevate your output today?`);

    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: greeting,
        timestamp: Date.now()
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist chat history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT_HISTORY, JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleClearHistory = () => {
    const confirmMsg = isAr
      ? 'هل أنت متأكد أنك تريد إعادة ضبط سجل محادثة أطلس؟'
      : 'Are you sure you want to reset your Atlas conversation history?';
    if (confirm(confirmMsg)) {
      const initial: ChatMessage[] = [
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: isAr
            ? `⚡ تم تصفير سجل أطلس. جاهز للمرحلة القادمة من التخطيط والبناء.`
            : `⚡ Atlas conversation reset. Ready for your next high-performance strategic alignment session.`,
          timestamp: Date.now()
        }
      ];
      setMessages(initial);
      try {
        localStorage.setItem(STORAGE_KEY_CHAT_HISTORY, JSON.stringify(initial));
      } catch (e) {}
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInputValue('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const conversationContents = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      conversationContents.push({
        role: 'user',
        parts: [{ text: textToSend }]
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: conversationContents,
          systemInstruction: {
            parts: [{ text: getSystemInstruction(lang, profileName) }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `API request failed with status ${response.status}`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const botResponseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        (isAr ? 'لم يرجع خادم أطلس رداً مناسباً. يرجى إعادة محاولة الصياغة.' : 'Atlas processed your prompt but returned an empty context. Please try again.');

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: botResponseText,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Atlas Gemini API Error:', err);
      setErrorMsg(err.message || (isAr ? 'خطأ في الاتصال بأطلس.' : 'Failed to connect with Atlas.'));
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: isAr
          ? `⚠️ **خطأ اتصال**: ${err.message || 'فشل الاتصال بخادم Gemini.'}\n\nيرجى التأكد من إضافة مفتاح GEMINI_API_KEY في إعدادات المنصة.`
          : `⚠️ **Connection Error**: ${err.message || 'Failed to authenticate request.'}\n\nPlease ensure your GEMINI_API_KEY is configured on the platform settings.`,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse interactive suggestions
  const parseSuggestions = (content: string): { cleanText: string; parsedSuggestions: SuggestionItem[] } => {
    const match = content.match(/<atlas_suggestions>([\s\S]*?)<\/atlas_suggestions>/);
    if (!match) {
      return { cleanText: content, parsedSuggestions: [] };
    }

    const cleanText = content.replace(/<atlas_suggestions>[\s\S]*?<\/atlas_suggestions>/g, '').trim();
    const result: SuggestionItem[] = [];

    try {
      const data = JSON.parse(match[1].trim()) as SuggestionData;
      if (data.tasks) {
        data.tasks.forEach((t, i) => {
          result.push({
            id: `task-${i}-${t.title.substring(0, 10)}`,
            type: 'task',
            title: t.title,
            categoryOrPriority: t.priority || 'Medium',
            matrixOrFrequency: t.matrix || 'Important-NotUrgent'
          });
        });
      }
      if (data.habits) {
        data.habits.forEach((h, i) => {
          result.push({
            id: `habit-${i}-${h.name.substring(0, 10)}`,
            type: 'habit',
            title: h.name,
            categoryOrPriority: h.category || 'Mind',
            matrixOrFrequency: h.frequency || 'Daily'
          });
        });
      }
    } catch (err) {
      console.error('Failed parsing Atlas JSON block:', err);
    }

    return { cleanText, parsedSuggestions: result };
  };

  // State to track checkboxes selected in each message bubble
  const [selectedCards, setSelectedCards] = useState<Record<string, Record<string, boolean>>>({});

  const toggleCardSelection = (msgId: string, itemId: string) => {
    setSelectedCards(prev => {
      const bubble = prev[msgId] || {};
      const currentVal = bubble[itemId] !== false; // default true if undefined to make it easier for user
      return {
        ...prev,
        [msgId]: {
          ...bubble,
          [itemId]: !currentVal
        }
      };
    });
  };

  const handleAddSelectedToCore = async (msgId: string, items: SuggestionItem[]) => {
    const bubbleSelections = selectedCards[msgId] || {};
    // Filter items that are checked (default true if not set)
    const itemsToAdd = items.filter(item => bubbleSelections[item.id] !== false);

    if (itemsToAdd.length === 0) return;

    try {
      for (const item of itemsToAdd) {
        if (item.type === 'task') {
          await onAddTask({
            title: item.title,
            completed: false,
            priority: item.categoryOrPriority || 'Medium',
            matrix: item.matrixOrFrequency || 'Important-NotUrgent',
            createdAt: Date.now(),
            createdBy: 'Atlas'
          });
        } else {
          await onAddHabit({
            title: item.title,
            category: item.categoryOrPriority || 'Mind',
            frequency: item.matrixOrFrequency || 'Daily',
            completedDays: {},
            streak: 0,
            bestStreak: 0,
            createdAt: Date.now(),
            createdBy: 'Atlas'
          });
        }
        // Mark as added
        setAddedSuggestions(prev => ({
          ...prev,
          [`${msgId}-${item.id}`]: true
        }));
      }

      alert(isAr ? '🎉 تم دمج المهام والعادات المحددة بنجاح في قلب التطبيق كـ (منشأ بواسطة أطلس)!' : '🎉 Selected habits and tasks successfully merged into your active Core, tagged as "Created by Atlas"!');
    } catch (err) {
      console.error('Failed adding suggestions:', err);
      alert(isAr ? 'فشل إضافة العناصر المحددة.' : 'Failed to save some selected elements.');
    }
  };

  const quickPrompts = isAr
    ? [
        {
          title: 'تخطيط عادات صباحية',
          prompt: 'اقترح علي عادات صباحية استثنائية لرواد الأعمال، وحوّلها إلى كروت أفعال لأتمكن من استيرادها.'
        },
        {
          title: 'ترتيب أولويات مهام العمل',
          prompt: 'لدي مشكلة في الرد المستمر على رسائل البريد والمكالمات. اقترح علي 3 مهام عمل عميق استراتيجية لتغيير اتجاه يومي اليوم.'
        },
        {
          title: 'بناء روتين تركيز ذهني',
          prompt: 'كيف يمكنني تقليل الإرهاق الفكري وتحسين طاقتي اليومية؟ أريد عادات وتطبيقات فورية ببطاقات أفعال.'
        }
      ]
    : [
        {
          title: 'Morning Habit Architect',
          prompt: 'Recommend 3 stellar micro-habits for a high-momentum morning and generate actionable cards.'
        },
        {
          title: 'Ruthless Task Prioritizer',
          prompt: 'I feel overwhelmed by admin tasks. Suggest 2 high-leverage deep work tasks to realign my focus today.'
        },
        {
          title: 'Focus Routine Planner',
          prompt: 'How can I limit cognitive overload and maintain evening winding-down clarity? Suggest habit stacks with action cards.'
        }
      ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-5rem)] max-w-5xl mx-auto px-2 sm:px-4 py-2 animate-fadeIn">
      {/* Atlas Header */}
      <div className="flex items-center justify-between bg-white border border-[#EAE9E6] rounded-2xl p-3.5 sm:p-4 mb-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D3136] text-[#34D399] flex items-center justify-center border border-[#34D399]/30 shadow-xs shrink-0">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#2F3437] tracking-tight">
                {isAr ? 'أطلس | الموجه الإجرائي الذكي' : 'Atlas | Interactive Action-Mentor'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Action-Coaching
              </span>
            </div>
            <p className="text-xs text-[#787774] mt-0.5">
              {isAr ? 'توليد عادات ذكية ومهام مباشرة بضغطة واحدة، مدمجة بفايرستور ومعلمة بـ "Atlas".' : 'Elite tactical coach. Generates interactive action items integrated directly with Firestore.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl border border-[#EAE9E6] bg-[#FBFBFA] hover:bg-neutral-100 text-[#787774] hover:text-rose-600 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
            title={isAr ? 'مسح سجل المحادثة' : 'Clear Chat History'}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 overflow-y-auto bg-white border border-[#EAE9E6] rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          
          // Parse content for automated cards
          const { cleanText, parsedSuggestions } = isUser ? { cleanText: msg.content, parsedSuggestions: [] } : parseSuggestions(msg.content);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                  isUser
                    ? 'bg-[#2D3136] text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble & Cards */}
              <div className="flex-1 max-w-[85%] sm:max-w-[78%] space-y-2.5">
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed border ${
                    isUser
                      ? 'bg-[#2D3136] text-white border-[#2D3136] shadow-xs'
                      : 'bg-[#FBFBFA] text-[#2F3437] border-[#EAE9E6] shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {cleanText}
                  </div>

                  {/* Bubble timestamp & copy */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-1.5 border-t border-black/5 text-[10px] opacity-70">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                {parsedSuggestions.length > 0 && (
                  <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-3 sm:p-4 space-y-3 shadow-3xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>{isAr ? 'توصيات أطلس الإجرائية (Action Cards)' : 'Atlas Action Cards'}</span>
                    </div>

                    <div className="space-y-2">
                      {parsedSuggestions.map((item) => {
                        const uniqueKey = `${msg.id}-${item.id}`;
                        const isAdded = addedSuggestions[uniqueKey];
                        const isChecked = selectedCards[msg.id]?.[item.id] !== false; // default true if undefined

                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 bg-white ${
                              isAdded 
                                ? 'opacity-50 border-neutral-200' 
                                : isChecked 
                                ? 'border-emerald-300 shadow-2xs' 
                                : 'border-[#EAE9E6] hover:border-neutral-300'
                            }`}
                          >
                            <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none min-w-0">
                              <input
                                type="checkbox"
                                disabled={isAdded}
                                checked={isChecked && !isAdded}
                                onChange={() => toggleCardSelection(msg.id, item.id)}
                                className="w-4.5 h-4.5 rounded text-emerald-600 focus:ring-emerald-500 border-neutral-300 transition-all"
                              />
                              <div className="min-w-0">
                                <span className={`text-xs font-bold block truncate ${isAdded ? 'line-through text-neutral-400' : 'text-[#2F3437]'}`}>
                                  {item.title}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[9px] font-mono font-bold uppercase px-1.5 rounded border ${
                                    item.type === 'task'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                  }`}>
                                    {item.type === 'task' ? (isAr ? 'مهمة' : 'Task') : (isAr ? 'عادة' : 'Habit')}
                                  </span>
                                  {item.categoryOrPriority && (
                                    <span className="text-[9px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 rounded border border-neutral-200">
                                      {item.categoryOrPriority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>

                            {isAdded && (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 font-mono uppercase">
                                <Check size={12} />
                                {isAr ? 'تم الدمج' : 'Merged'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleAddSelectedToCore(msg.id, parsedSuggestions)}
                      disabled={parsedSuggestions.every(item => addedSuggestions[`${msg.id}-${item.id}`])}
                      className="w-full flex items-center justify-center gap-2 bg-[#2D3136] hover:bg-black text-white px-3 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <PlusCircle size={14} />
                      <span>{isAr ? 'إضافة المحدد إلى التطبيق' : 'Add Selected to Core'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-[#787774] p-3 bg-[#FBFBFA] rounded-2xl w-fit border border-[#EAE9E6] animate-pulse">
            <Loader2 size={16} className="animate-spin text-emerald-600" />
            <span>{isAr ? 'أطلس يقوم بفرز المحركات الاستراتيجية لتوليد خطتك...' : 'Atlas is structuring elite actionable workflows for you...'}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 max-w-md">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-2.5">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              className="p-3 rounded-xl border border-[#EAE9E6] bg-white hover:border-emerald-400 text-left transition-all group cursor-pointer shadow-3xs hover:shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2F3437] group-hover:text-emerald-700">
                <Sparkles size={13} className="text-emerald-500 shrink-0" />
                <span className="truncate">{qp.title}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="mt-2.5 bg-white border border-[#EAE9E6] rounded-2xl p-2 sm:p-3 shadow-sm">
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
              isAr ? 'اسأل أطلس عن تنظيم وتصميم العادات، أولويات المهام الإجرائية...' : 'Ask Atlas for high-yield habits, ruthless task matrices, or custom routines...'
            }
            rows={2}
            className="flex-1 resize-none bg-transparent text-xs sm:text-sm text-[#2F3437] placeholder-[#787774] focus:outline-none px-2 py-1 leading-relaxed"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#2D3136] hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer active:scale-95"
            >
              <Send size={15} />
              <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Send'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
