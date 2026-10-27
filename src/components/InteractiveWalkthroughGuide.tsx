import React, { useState } from 'react';
import {
  Layers,
  CheckSquare,
  Flame,
  CalendarDays,
  FolderKanban,
  Archive,
  Timer,
  Target,
  StickyNote,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Info,
  Clock,
  Zap,
  Play,
  ShieldCheck,
  Tag,
  CornerDownRight,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { ModuleType } from '../types';

interface InteractiveWalkthroughGuideProps {
  onNavigateModule?: (module: ModuleType) => void;
  onSwitchToAiPrompt?: () => void;
  lang?: 'en' | 'ar';
}

interface WalkthroughStep {
  id: number;
  title: string;
  pinLabel: string;
  whyIsItHere: string;
  howItHelps: string;
  realExample: string;
  executiveTip: string;
  targetElementHighlight: string;
}

interface WalkthroughModule {
  id: string;
  moduleId: ModuleType;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  badge: string;
  summary: string;
  steps: WalkthroughStep[];
  faq: { q: string; a: string }[];
}

export const InteractiveWalkthroughGuide: React.FC<InteractiveWalkthroughGuideProps> = ({
  onNavigateModule,
  onSwitchToAiPrompt,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const [selectedModuleId, setSelectedModuleId] = useState<string>('daily-blocks');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({});
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  const modules: WalkthroughModule[] = [
    {
      id: 'daily-blocks',
      moduleId: 'daily-blocks',
      title: isAr ? 'فترات اليوم والجدول الزمني (Daily Blocks)' : 'Daily Blocks & Energy Time-Blocking',
      subtitle: isAr ? 'هندسة اليوم عبر كتل زمنية موجهة، وتقسيم المهام والعادات حسب طاقة النهار' : 'Time-blocking architecture: align deep focus, recovery, and execution with your biological energy',
      icon: Layers,
      color: 'amber',
      badge: isAr ? 'الأكثر استخداماً' : 'Core Daily',
      summary: isAr
        ? 'بدلاً من قائمة مهام عشوائية لا تنتهي، تقسم الـ Daily Blocks يومك إلى فترات واضحة (التركيز الصباحي، الاجتماعات، الاستعادة). كل فترة لها وقت محدد، نوع طاقة، ومهام مخصصة.'
        : 'Instead of an overwhelming to-do list, Daily Blocks groups your day into deliberate containers (Morning Startup, Deep Work, Recovery, Execution) mapped to your cognitive energy.',
      steps: [
        {
          id: 1,
          title: isAr ? 'كتلة التركيز العميق (Deep Work Block)' : 'Deep Work Focus Block',
          pinLabel: '1',
          whyIsItHere: isAr
            ? 'لحماية أثمن ساعاتك الصباحية من الاجتماعات والمقاطعات ورسائل البريد التافهة، وتخصيصها للمهمة التي تصنع 80% من نتائجك (قاعدة باريتو).'
            : 'To protect your highest cognitive hours from fragmented meetings and Slack messages, reserving them strictly for high-leverage creation (Pareto 80/20).',
          howItHelps: isAr
            ? 'تنهي أهم مخرجاتك قبل الساعة 12:00 ظهراً، مما يمنحك شعوراً بالانتصار والهدوء الذهني طوال بقية النهار.'
            : 'You produce your most challenging work before midday, eliminating afternoon guilt and decision fatigue.',
          realExample: isAr
            ? 'فترة 09:00 - 11:30 مخصصة لهندسة الكود وبناء المنتج بدون هاتف وبدون فتح رسائل البريد.'
            : '09:00 - 11:30 dedicated strictly to software architecture with Slack notifications completely muted.',
          executiveTip: isAr
            ? 'لا تضع أكثر من فترتي تركيز عميق في اليوم الواحد. الطاقة الذهنية القصوى محدودة بيولوجياً بـ 3 إلى 4 ساعات.'
            : 'Limit yourself to at most 2 deep work blocks per day; peak neuro-cognitive focus is capped around 3-4 hours.',
          targetElementHighlight: 'deep-work-block',
        },
        {
          id: 2,
          title: isAr ? 'المهام والعادات المرتبطة (Linked Tasks & Habits)' : 'Linked Micro-Tasks & Checklists',
          pinLabel: '2',
          whyIsItHere: isAr
            ? 'لإلغاء التشتت (Decision Fatigue). عندما يحين موعد الفترة، لا تسأل نفسك "شنو غاندير دابا؟"؛ الخطوات جاهزة أمامك.'
            : 'To remove choice overload. When the block starts, you do not pause to wonder what to tackle next; items are already queued.',
          howItHelps: isAr
            ? 'تبدأ العمل فوراً وبدون تردد. بمجرد إتمام أي مهمة داخل الفترة، ينعكس ذلك تلقائياً في قائمة المهام العامة.'
            : 'Zero friction startup. Completing items directly checks them off in your central task database in real-time.',
          realExample: isAr
            ? 'داخل فترة "المراجعة والتنفيذ"، توجد مهمتان: فحص تقرير المبيعات + الرد على 3 عملاء رئيسيين.'
            : 'Inside the "Execution Sprint" block: 1) Review cloud server telemetry + 2) Ship client update email.',
          executiveTip: isAr
            ? 'قسّم أي كتلة إلى 2 إلى 4 عناصر واضحة وقابلة للإنجاز خلال وقت الفترة فقط.'
            : 'Keep 2 to 4 micro-tasks per block. Overloading a 90-minute block causes demoralizing rollover.',
          targetElementHighlight: 'linked-tasks',
        },
        {
          id: 3,
          title: isAr ? 'مقياس الطاقة المطلوبة (Energy Level Leveling)' : 'Circadian Energy Leveling',
          pinLabel: '3',
          whyIsItHere: isAr
            ? 'لأن الطاقة البشرية ليست متساوية طوال النهار؛ فهناك فترات ذروة (High Energy) وأخرى هابطة (Low Energy).'
            : 'Because human focus follows circadian rhythms; demanding creative tasks fail during post-lunch energy troughs.',
          howItHelps: isAr
            ? 'يرشدك التطبيق لوضع المهام الإبداعية والمعقدة في فترات High Energy، ومهام الإيميلات والردود في فترات Low Energy.'
            : 'Directs you to schedule cognitive beasts in peak hours and mechanical administrative chores in low-energy zones.',
          realExample: isAr
            ? 'كتابة الاستراتيجية في الصباح (High Energy)، وجدولة دفع الفواتير والأعمال الورقية بعد الغداء (Low Energy).'
            : 'High Energy for pitch deck crafting, Low Energy for invoicing and calendar organization at 15:00.',
          executiveTip: isAr
            ? 'احترم وقت فترات الاستعادة (Recharge) كأنها موعد مع مستثمر؛ بدون استعادة، ينهار التركيز في المساء.'
            : 'Treat your Recharge block as non-negotiable; skipping rest creates immediate cognitive debt.',
          targetElementHighlight: 'energy-tag',
        },
        {
          id: 4,
          title: isAr ? 'عداد التركيز والإنهاء التفاعلي (Timer & Completion)' : 'Focus Telemetry & Completion Check',
          pinLabel: '4',
          whyIsItHere: isAr
            ? 'لقياس دقائق التركيز الفعلية وإغلاق الفترة بنجاح للحصول على إحساس فوري بالإنجاز والمكافأة.'
            : 'To track actual time invested and trigger gamified dopamine feedback when the block is wrapped up.',
          howItHelps: isAr
            ? 'يغذي تحليلات الأداء ويوضح لك كم ساعة عمل عميق أنجزت خلال الأسبوع.'
            : 'Feeds your analytics dashboard with verifiable focus telemetry so you can spot productive patterns.',
          realExample: isAr
            ? 'الضغط على زر تشغيل المؤقت داخل الكتلة لبدء 45 دقيقة صامتة بصوت خلفي مهدئ، ثم علامة الصح.'
            : 'Clicking start timer inside the block to log 45 uninterrupted minutes with binaural focus audio.',
          executiveTip: isAr
            ? 'إذا لم تتمكن من إنهاء كل ما في الفترة، لا تقلق! استخدم زر التمديد أو انقله للفترة المسائية.'
            : 'Never rush: quality of output during deep focus is 10x higher than rushed multi-tasking.',
          targetElementHighlight: 'completion-bar',
        },
      ],
      faq: [
        {
          q: isAr ? 'شنو الفرق بين Daily Block والمهمة العادية في Task Tracker؟' : 'What is the difference between a Daily Block and a regular Task?',
          a: isAr
            ? 'المهمة هي "ماذا ستفعل" (What)، أما الـ Daily Block فهو "المكان والزمان والبيئة التي ستفعلها فيها" (When & Where). الـ Block يحتوي على مهام بداخله.'
            : 'A Task defines WHAT you do. A Daily Block defines WHEN and in what energetic container you execute it.',
        },
        {
          q: isAr ? 'واش خاصني نملأ 24 ساعة كلها بالفترات؟' : 'Should I schedule every single hour of the day?',
          a: isAr
            ? 'أبداً! اترك دائماً هوامش فارغة (Buffer Zones) من 30 إلى 60 دقيقة بين الكتل لتفادي الضغط في حال تأخر أي اجتماع.'
            : 'Never. Always leave 30-60 minute buffer zones between blocks to absorb reality and unexpected emergencies.',
        },
      ],
    },
    {
      id: 'tasks',
      moduleId: 'tasks',
      title: isAr ? 'متتبع المهام ومصفوفة أيزنهاور (Task Tracker)' : 'Task Execution & Priority Matrix',
      subtitle: isAr ? 'فرز المهام حسب الأهمية، وقت الاستحقاق بالساعة، والمهام القابلة للقياس الرقمي' : 'Execute with surgical priority: due times, measurable numeric targets, and rollover accountability',
      icon: CheckSquare,
      color: 'emerald',
      badge: isAr ? 'تنفيذ يومي' : 'Action Stack',
      summary: isAr
        ? 'متتبع مهام احترافي غير تقليدي: يركز على وقت الاستحقاق بالساعة (Due Time)، المهام المقاسة بالأرقام (صفحات، جلسات)، وتوثيق أسباب التأجيل لمنع التسويف.'
        : 'An executive task manager featuring exact due times, numeric target increments, and skip reason tracking to dismantle procrastination.',
      steps: [
        {
          id: 1,
          title: isAr ? 'تحديد الأولوية ووقت الاستحقاق الدقيق (Due Time Urgency)' : 'Exact Due Time & Priority Tier',
          pinLabel: '1',
          whyIsItHere: isAr
            ? 'المهمة التي ليس لها موعد ساعة محدد (مثلاً 14:30) يتم تأجيلها دائماً إلى آخر الليل ثم إلى الغد (قانون باركنسون).'
            : 'A task without an exact deadline hour (e.g., 14:30) expands until midnight, then inevitably rolls over.',
          howItHelps: isAr
            ? 'يفرز التطبيق مهامك تنازلياً حسب الساعة الأقرب، مع شارة واضحة تنبهك للمهام العاجلة ذات الأولوية القصوى.'
            : 'Tasks are ordered chronologically by upcoming hour, with color-coded high priority indicators.',
          realExample: isAr
            ? 'مهمة "إرسال العقد للعميل" موعدها 11:00 صباحاً بأولوية High.'
            : 'High Priority task: "Deliver Q4 Audit Report" due at 11:00 AM.',
          executiveTip: isAr
            ? 'اجعل فقط 1 إلى 3 مهام كـ High Priority في اليوم الواحد. إذا كان كل شيء عاجلاً، فلاشيء مهم.'
            : 'Limit High Priority to 1-3 tasks per day. If everything is urgent, nothing is priority.',
          targetElementHighlight: 'priority-tag',
        },
        {
          id: 2,
          title: isAr ? 'المهام القابلة للقياس الرقمي (Measurable Targets)' : 'Measurable Target Increments',
          pinLabel: '2',
          whyIsItHere: isAr
            ? 'كثير من المهام ليست مجرد نعم/لا، بل كميات: قراءة 20 صفحة، إنجاز 4 جلسات بومودورو، كتابة 1000 كلمة.'
            : 'Many tasks are quantitative: read 25 pages, run 5km, or complete 3 code reviews.',
          howItHelps: isAr
            ? 'يتيح لك النقر على +1 أو تسجيل التقدم تدريجياً، مع شريط تقدم حي يُظهر كم بقي للوصول لـ 100%.'
            : 'Allows 1-tap increments (+1 page, +1 Pomodoro) with dynamic visual progress bar toward the target.',
          realExample: isAr
            ? 'مهمة: "مراجعة صفحات الكتاب" الهدف 30 صفحة، التقدم الحالي 18/30 صفحة (60%).'
            : '"Read Technical Manual": target 25 pages, current 18/25 (72% complete).',
          executiveTip: isAr
            ? 'استخدم المهام المقاسة للمشاريع الطويلة التي تتطلب تقدماً تدريجياً لتفادي الشعور بالإحباط.'
            : 'Use measurable tasks for long-tail milestones to maintain constant forward momentum.',
          targetElementHighlight: 'measurable-bar',
        },
        {
          id: 3,
          title: isAr ? 'توثيق أسباب التأجيل وعداد الـ Rollover' : 'Rollover Counter & Skip Reasons',
          pinLabel: '3',
          whyIsItHere: isAr
            ? 'لمواجهة نمط التسويف بصدق. يوضح لك التطبيق كم مرة قمت بترحيل هذه المهمة ولماذا.'
            : 'To make procrastination conscious: tracks how many times you delayed a task and the stated excuse.',
          howItHelps: isAr
            ? 'إذا رأيت مهمة ترحلت 5 مرات، يعلمك التطبيق إما أن تفوضها لشخص آخر، أو تحذفها، أو تفككها لخطوة أصغر.'
            : 'Seeing a task rolled over 4 times tells you to either delegate it, delete it, or break it into smaller parts.',
          realExample: isAr
            ? 'شارة "Rollover x3" مع سبب التأجيل المسجل: "انتظار رد المحامي القانوني".'
            : 'Badge: "Rollover x3" with logged reason: "Waiting for legal team review".',
          executiveTip: isAr
            ? 'المهمة التي ترحلها أكثر من 3 مرات نادراً ما تحتاج إليها حقاً؛ فكر في أرشفتها أو إلغائها فوراً.'
            : 'If a task rolls over 3+ times, either eliminate it or schedule a dedicated Deep Work block for it.',
          targetElementHighlight: 'rollover-badge',
        },
        {
          id: 4,
          title: isAr ? 'الأرشفة والتراجع الفوري (Archive & Undo ↺)' : 'Safe Archiving & Instant Undo ↺',
          pinLabel: '4',
          whyIsItHere: isAr
            ? 'لإبقاء لوحة اليوم نظيفة دون فقدان أي معلومة، وحمايتك من أي حذف بالخطأ بواسطة زر التراجع الفوري.'
            : 'Keeps your active board clean without permanent data loss, and enables 1-tap Undo for accidental deletes.',
          howItHelps: isAr
            ? 'عند حذف أي مهمة، يظهر إشعار فوري بزر "تراجع ↺" أو ضغط Ctrl+Z لاسترجاعها في لحظة.'
            : 'Any deletion displays a floating Undo toast (or press Ctrl+Z) to immediately restore the item to Firestore.',
          realExample: isAr
            ? 'مسحت مهمة بالخطأ ➔ نقرت "تراجع ↺" ➔ عادت المهمة بكامل بياناتها وتواريخها بنجاح.'
            : 'Accidentally deleted task ➔ clicked "Undo ↺" ➔ task fully recovered with subtasks intact.',
          executiveTip: isAr
            ? 'استخدم الأرشفة (Archive) دائماً بدلاً من الحذف إذا كان العمل المنجز قد يفيدك في مراجعات نهاية الشهر.'
            : 'Prefer archiving over permanent deletion for finished deliverables you might need during reviews.',
          targetElementHighlight: 'undo-archive-btn',
        },
      ],
      faq: [
        {
          q: isAr ? 'وقتاش ندير الأرشفة ووقتاش ندير الحذف النهائي؟' : 'When should I archive vs permanently delete?',
          a: isAr
            ? 'الأرشفة مخصصة للمهام المكتملة التي تريد حفظ سجلها. الحذف مخصص فقط للمهام الخاطئة أو التي لن تنفذها إطلاقاً.'
            : 'Archive completed tasks so they remain accessible in the Archive Hub. Delete only tasks created by mistake.',
        },
      ],
    },
    {
      id: 'habits',
      moduleId: 'habits',
      title: isAr ? 'العادات الذرية وحماية السلاسل (Atomic Habits)' : 'Atomic Habits & Streak Shields',
      subtitle: isAr ? 'بناء الهوية عبر التكرار اليومي، وتجميد السلاسل في حالات السفر والمرض المشروعة' : 'Identity-based compounding with streak freezes, banked credits, and time-of-day routines',
      icon: Flame,
      color: 'orange',
      badge: isAr ? 'تطوير الذات' : 'Compounding',
      summary: isAr
        ? 'بناء العادات الناجحة لا يعتمد على الإرادة الحديدية المؤقتة، بل على السلاسل اليومية المستمرة (Streaks) مع نظام ذكي لتجميد السلسلة عند السفر أو المرض لضمان عدم الانقطاع.'
        : 'Habit mastery built on consistency. Features daily streak counts, morning/evening routine grouping, and banked streak freezes to protect your psychological momentum.',
      steps: [
        {
          id: 1,
          title: isAr ? 'قاعدة السلسلة المستمرة (The Streak Counter)' : 'Unbroken Streak Momentum',
          pinLabel: '1',
          whyIsItHere: isAr
            ? 'مستوحى من قاعدة جيري ساينفيلد: "لا تكسر السلسلة". رؤية رقم الـ Streak يكبر يولد دافعاً نفسياً قوياً للاستمرار.'
            : 'Jerry Seinfeld’s rule: "Don’t break the chain". Watching the streak counter climb creates powerful retention.',
          howItHelps: isAr
            ? 'نقرة واحدة سريعة يومياً تسجل إنجاز العادة، وتحدث فورياً معدل الاستمرارية لشهر كامل.'
            : '1-tap check-off increments the streak and updates weekly and monthly success telemetry.',
          realExample: isAr
            ? 'عادة: "قراءة 20 دقيقة" بسلسلة مستمرة لـ 42 يوماً بدون انقطاع 🔥.'
            : 'Habit: "20m Morning Breathwork" with an active 42-day streak 🔥.',
          executiveTip: isAr
            ? 'ابدأ صغيراً جداً؛ عادة القراءة لـ 5 دقائق يومياً أفضل 100 مرة من ساعة واحدة تنقطع بعدها.'
            : 'Make the threshold ridiculously small: 5 push-ups daily beats an erratic 2-hour workout once a week.',
          targetElementHighlight: 'streak-pill',
        },
        {
          id: 2,
          title: isAr ? 'تجميد السلسلة بالأعذار الموثقة (Banked Streak Freezes)' : 'Legitimate Streak Freezes & Excuses',
          pinLabel: '2',
          whyIsItHere: isAr
            ? 'لمنع "أثر تدمير الهدف" (The What-The-Hell Effect): عندما يمرض الشخص يوماً وينقطع الـ Streak، يشعر بالإحباط ويترك العادة بالكامل.'
            : 'Eliminates the "What-the-hell" abandonment loop where a single missed day causes complete habit collapse.',
          howItHelps: isAr
            ? 'يتيح لك تجميد اليوم برصيد الـ Freeze المكتسب، مع توثيق السبب (سفر، مرض، طارئ عائلي) مع الحفاظ على السلسلة.'
            : 'Allows freezing a missed day with an earned freeze token and logged reason, keeping your streak alive.',
          realExample: isAr
            ? 'شارة زرقاء "تجميد ❄️" لعادة الذهاب للجيم مع توثيق السبب: "رحلة سفر بالطائرة لمدة 10 ساعات".'
            : 'Cyan freeze badge ❄️ for Gym with documented note: "10-hour international flight".',
          executiveTip: isAr
            ? 'لا تستخدم التجميد للكسل؛ استخدمه فقط للظروف الخارجة عن إرادتك لحماية نزاهتك مع نفسك.'
            : 'Reserve streak freezes for genuine physical constraints (illness/travel) to maintain personal integrity.',
          targetElementHighlight: 'freeze-action',
        },
        {
          id: 3,
          title: isAr ? 'الروتينات المقسمة (Morning & Evening Routines)' : 'Time-of-Day Routine Stacking',
          pinLabel: '3',
          whyIsItHere: isAr
            ? 'لأن أفضل طريقة لتنفيذ العادات هي ربطها بأوقات اليوم الطبيعية (استيقاظ الصباح، عودة بعد الظهر، نوم المساء).'
            : 'Habit stacking works best when anchored to natural circadian triggers: waking up, post-lunch, and bedtime.',
          howItHelps: isAr
            ? 'تصفية سريعة بنقرة زر لعرض عادات الصباح فقط أو المساء فقط لتفادي التشتت.'
            : 'Quick tabs to isolate Morning or Evening habits so you only see what is relevant right now.',
          realExample: isAr
            ? 'روتين الصباح: شرب ماء بالليمون ➔ 15 دقيقة تأمل ➔ قراءة أهداف اليوم.'
            : 'Morning routine: Hydration ➔ 10m Mobility ➔ Review Top 3 Priorities.',
          executiveTip: isAr
            ? 'اربط العادة الجديدة بعادة قديمة تقوم بها بالفعل (مثلاً: بعد شرب قهوة الصباح، سأكتب 3 أسطر تأمل).'
            : 'Stack your new habit immediately after an existing subconscious ritual (e.g. after morning espresso).',
          targetElementHighlight: 'routine-tabs',
        },
      ],
      faq: [
        {
          q: isAr ? 'كيفاش نربح رصيد إضافي لتجميد السلاسل (Banked Freezes)؟' : 'How do I earn banked freeze credits?',
          a: isAr
            ? 'كلما حافظت على سلسلة 7 أيام متتالية دون انقطاع، يمنحك التطبيق رصيد تجميد طارئ تقديراً لالتزامك.'
            : 'Maintaining a 7-day uninterrupted streak automatically awards emergency freeze tokens to your vault.',
        },
      ],
    },
    {
      id: 'archive-undo',
      moduleId: 'archive',
      title: isAr ? 'الأرشيف وخاصية التراجع الفوري (Archive & Undo ↺)' : 'Unified Archive Hub & Instant Undo',
      subtitle: isAr ? 'استرجاع العناصر الممسوحة فوراً، وحفظ السجلات المكتملة بعيداً عن مساحة العمل اليومية' : 'Zero-risk deletions with 1-click Undo (Ctrl+Z), and a searchable vault for finished projects and tasks',
      icon: Archive,
      color: 'blue',
      badge: isAr ? 'جديد وحصري' : 'New Feature',
      summary: isAr
        ? 'السر وراء إنتاجية كبار التنفيذيين هو النظافة الذهنية (Zero Clutter). هذا النظام يمنحك زر التراجع (Undo) في أي وقت تمسح فيه شيئاً، ومركز الأرشيف الذي يخفي المكتمل دون مسحه نهائياً.'
        : 'High performers protect their cognitive bandwidth with zero-clutter workspaces. This system provides safety-first deletions with 1-tap Undo (Ctrl+Z) and an executive vault to archive completed work without losing it.',
      steps: [
        {
          id: 1,
          title: isAr ? 'خاصية التراجع الفوري بنقرة واحدة أو Ctrl+Z' : 'Instant Undo Toast & Ctrl+Z Shortcut',
          pinLabel: '1',
          whyIsItHere: isAr
            ? 'لكي لا تخاف أبداً من مسح أي عنصر بالخطأ. التطبيق يحفظ آخر العناصر المحذوفة في ذاكرة استرجاع فورية.'
            : 'Eliminates anxiety around accidental deletions. Your last deleted item is held in an instant recovery buffer.',
          howItHelps: isAr
            ? 'بمجرد الضغط على حذف، يظهر إشعار أسفل الشاشة بزر "تراجع ↺"، أو يمكنك الضغط على Ctrl+Z لاسترجاعه في رمشة عين.'
            : 'Click the Undo button on the notification or hit Ctrl+Z / Cmd+Z to resurrect the item to Firestore immediately.',
          realExample: isAr
            ? 'مسحت بالخطأ قائمة فحص مكونة من 10 خطوات ➔ ضغطت Ctrl+Z ➔ عادت القائمة فوراً بجميع عناصرها وتفاصيلها.'
            : 'Accidentally deleted a 10-step SOP checklist ➔ pressed Ctrl+Z ➔ fully restored in 200ms.',
          executiveTip: isAr
            ? 'يمكنك أيضاً استخدام زر التراجع الموجود دائماً في الشريط العلوي للتطبيق.'
            : 'You can also use the permanent Undo button located in the top navigation header anytime.',
          targetElementHighlight: 'undo-notification',
        },
        {
          id: 2,
          title: isAr ? 'مركز الأرشيف الموحد (The Unified Archive Vault)' : 'The Unified Archive Vault',
          pinLabel: '2',
          whyIsItHere: isAr
            ? 'لأن مسح المشاريع والمهام الناجحة خطأ فادح؛ تحتاج لسجل إنجازاتك في التقييمات السنوية ومراجعات الأداء.'
            : 'Deleting successful projects erases your institutional memory; you need this history for quarterly reviews.',
          howItHelps: isAr
            ? 'يجمع لك كافة المهام، المشاريع، الملاحظات، وفترات الأيام السابقة في مكان واحد منظم مع بحث سريع وتصفية.'
            : 'Aggregates all archived tasks, projects, notes, and past blocks in a fast, searchable command center.',
          realExample: isAr
            ? 'تبحث عن ملاحظة كتبتها قبل 3 أشهر لمشروع انتهى؛ تدخل للأرشيف وتجدها فوراً وتسترجعها بضغطة زر.'
            : 'Search for a client contract note from 3 months ago: locate it in Archive and click Restore in 1 tap.',
          executiveTip: isAr
            ? 'استخدم زر "أرشفة كافة المهام المكتملة" بنهاية كل أسبوع لتبدأ أسبوعك الجديد بلوحة فارغة ومنعشة.'
            : 'Run "Archive All Completed Tasks" at the end of each week to start Monday with a pristine clean slate.',
          targetElementHighlight: 'archive-tabs',
        },
        {
          id: 3,
          title: isAr ? 'استرجاع بنقرة واحدة أو الحذف النهائي' : '1-Click Unarchive or Permanent Purge',
          pinLabel: '3',
          whyIsItHere: isAr
            ? 'للتحكم الكامل: إما إعادة العنصر للعمل النشط إذا عاد المشروع للحياة، أو حذفه نهائياً إذا لم تعد بحاجة إليه.'
            : 'Total operational control: re-activate dormant projects or purge them permanently when obsolete.',
          howItHelps: isAr
            ? 'زر استرجاع (Restore) ينقل العنصر فوراً إلى مكانه الأصلي مع إشعار تأكيد لطيف.'
            : 'Unarchiving moves the item straight back into your active daily board with full state preserved.',
          realExample: isAr
            ? 'مشروع تم تأجيله لعدة أشهر؛ بضغطة زر يسترجع ويظهر في لوحة المشاريع النشطة.'
            : 'Client project un-paused after 2 months: unarchive to restore to active Kanban board.',
          executiveTip: isAr
            ? 'لا تتردد في أرشفة أي شيء لا تحتاجه في الأيام السبعة القادمة؛ مساحة الشاشة يجب أن تخصص للحاضر فقط.'
            : 'Be aggressive with archiving; your active screen real-estate should be reserved strictly for the next 7 days.',
          targetElementHighlight: 'restore-action',
        },
      ],
      faq: [
        {
          q: isAr ? 'واش الأرشفة كتمسح البيانات من السحابة (Firestore)؟' : 'Does archiving delete data from Firestore?',
          a: isAr
            ? 'لا، البيانات تظل محفوظة بأمان تام في قاعدة بياناتك السحابية، وفقط يتم تصنيفها كـ "مؤرشفة" لتختفي من الشاشة اليومية.'
            : 'No. The item remains 100% securely preserved in your cloud database, merely flagged as archived to clean your UI.',
        },
      ],
    },
    {
      id: 'planner',
      moduleId: 'planner',
      title: isAr ? 'المخطط الأسبوعي الاستراتيجي (Weekly 7-Day Master Planner)' : 'Weekly 7-Day Master Planner',
      subtitle: isAr ? 'تصميم خريطة الأسبوع مسبقاً، وتوزيع الجهد على الأيام السبعة بقوالب جاهزة' : 'Calendar architecture: plan Monday-to-Sunday proactively with reusable weekly archetypes',
      icon: CalendarDays,
      color: 'indigo',
      badge: isAr ? 'استراتيجي' : 'Strategy Stack',
      summary: isAr
        ? 'الفرق بين الشخص العادي والتنفيذي الناجح هو التخطيط الاستباقي. المخطط الأسبوعي يسمح لك برؤية الأيام السبعة دفعة واحدة، وتطبيق قوالب أسبوعية نموذجية بضغطة واحدة.'
        : 'Proactive week design: visual 7-day grid with color-coded slots, recurring weekly routines, and 1-click archetype templates.',
      steps: [
        {
          id: 1,
          title: isAr ? 'الشبكة الأسبوعية الشاملة (7-Day Overview)' : 'Visual 7-Day Grid',
          pinLabel: '1',
          whyIsItHere: isAr
            ? 'لأن التخطيط ليوم بيوم يجعلك دائماً في موقف رد الفعل (Reactive Mode)، بينما رؤية 7 أيام تجعلك استباقياً (Proactive).'
            : 'Day-to-day planning traps you in reactive firefights; seeing 7 days at a glance grants strategic perspective.',
          howItHelps: isAr
            ? 'توزع الأحمال الثقيلة بحيث لا تجعل يوم الثلاثاء مضغوطاً بـ 6 ساعات اجتماعات بينما الأربعاء فارغ.'
            : 'Enables balanced load distribution so you don’t burn out on Tuesday and coast aimlessly on Friday.',
          realExample: isAr
            ? 'تخصيص الاثنين للأمور الإدارية، الثلاثاء والأربعاء للمنتج والبرمجة، الخميس للاجتماعات، والجمعة للمراجعة.'
            : 'Themed days: Monday for Admin, Tuesday/Wednesday for Deep Work, Thursday for Client Calls, Friday for Review.',
          executiveTip: isAr
            ? 'خطط لأسبوعك مساء الأحد خلال جلسة Sunday Reset لمدة 20 دقيقة فقط.'
            : 'Design your entire week on Sunday afternoon during your Sunday Reset ritual in just 20 minutes.',
          targetElementHighlight: 'week-grid',
        },
        {
          id: 2,
          title: isAr ? 'القوالب الأسبوعية النموذجية (Weekly Archetypes)' : '1-Click Archetype Templates',
          pinLabel: '2',
          whyIsItHere: isAr
            ? 'لتوفير الوقت: بدلاً من إدخال 30 فترة يدوياً كل أسبوع، يمكنك تطبيق قالب جاهز في ثانيتين.'
            : 'Automation: instead of manually populating 25 timeblocks every week, apply a battle-tested archetype in 2 seconds.',
          howItHelps: isAr
            ? 'قوالب جاهزة مثل: "أسبوع المؤسس التنفيذي" أو "أسبوع المطور المركز" أو "أسبوع التوازن واللياقة".'
            : 'Pre-built configurations for Tech Founders, Deep Work Specialists, or Balanced Executives.',
          realExample: isAr
            ? 'نقرة على قالب "Executive Sprint" تنشئ فورياً فترات الصباح والرياضة والعمل العميق لجميع الأيام السبعة.'
            : 'Selecting the "Executive Sprint" template instantly seeds your week with gym, deep work, and team syncs.',
          executiveTip: isAr
            ? 'يمكنك حفظ وتعديل القالب حسب ما يناسب روتينك وعاداتك الشخصية.'
            : 'Customize any archetype slots to reflect your personal family commitments and circadian peaks.',
          targetElementHighlight: 'archetype-picker',
        },
      ],
      faq: [
        {
          q: isAr ? 'هل الفترات الأسبوعية تظهر تلقائياً في فترات اليوم (Daily Blocks)؟' : 'Do weekly slots sync with Daily Blocks?',
          a: isAr
            ? 'نعم! يمكنك بنقرة واحدة استيراد فترات اليوم المخططة في Weekly Planner لتصبح كتل عمل حية في Daily Blocks.'
            : 'Yes! You can convert any day’s planned slots into live interactive Daily Blocks with 1 tap.',
        },
      ],
    },
    {
      id: 'projects',
      moduleId: 'projects',
      title: isAr ? 'المشاريع ومحطات الإنجاز (Projects & Milestones)' : 'Projects & OKR Milestones',
      subtitle: isAr ? 'ربط الرؤية الكبرى بالمهام التنفيذية، وتتبع نسب الإنجاز التراكمية' : 'Bridge high-level objectives to executable tasks with progress percentages and deadlines',
      icon: FolderKanban,
      color: 'purple',
      badge: isAr ? 'إدارة المشاريع' : 'Milestones',
      summary: isAr
        ? 'إدارة المشاريع المصممة لعدم التعقيد: بطاقات واضحة لكل مشروع، شريط تقدم يحسب تلقائياً نسبة المهام المنجزة، وتحديد المواعيد النهائية (Deadlines).'
        : 'Lean project management without corporate overhead: milestone tracking, automatic progress calculation from subtasks, and visual deadlines.',
      steps: [
        {
          id: 1,
          title: isAr ? 'حساب نسبة الإنجاز التلقائي (Progress Calculation)' : 'Automated Progress Calculation',
          pinLabel: '1',
          whyIsItHere: isAr
            ? 'لمعرفة أين يقف المشروع بدقة دون الحاجة لكتابة تقارير يدوية مملة.'
            : 'To instantly gauge completion velocity without writing tedious manual status updates.',
          howItHelps: isAr
            ? 'بمجرد إنجاز أي خطوة فرعية، يقفز شريط التقدم بنسبة مئوية واضحة (مثلاً من 50% إلى 75%).'
            : 'Checking off subtasks or linked tasks dynamically computes completion percentage in real-time.',
          realExample: isAr
            ? 'مشروع: "إطلاق التحديث 2.0" به 4 مهام، إنجاز 3 منها يرفع النسبة إلى 75% مع لون متدرج.'
            : 'Project: "Launch iOS Client" with 4 milestones; 3 completed sets the visual ring to 75%.',
          executiveTip: isAr
            ? 'لا تفتح أكثر من 3 مشاريع رئيسية في وقت واحد لضمان تركيز فريقك ومواردك.'
            : 'Cap active initiatives at 3 max; multitasking across 8 projects guarantees stalled deadlines.',
          targetElementHighlight: 'progress-ring',
        },
      ],
      faq: [
        {
          q: isAr ? 'كيفاش نربط مهمة بمشروع معين؟' : 'How do I link a task to a project?',
          a: isAr
            ? 'عند إنشاء أو تعديل أي مهمة، اختر اسم المشروع من القائمة المنسدلة، وستظهر فورياً داخل بطاقة المشروع.'
            : 'When creating any task, select the project from the dropdown to automatically bind them together.',
        },
      ],
    },
    {
      id: 'focus',
      moduleId: 'focus',
      title: isAr ? 'محطة التركيز والصوتيات المحفزة (Deep Focus & Audio)' : 'Deep Focus Station & Ambient Audio',
      subtitle: isAr ? 'مؤقت بومودورو تنفيذي، مؤثرات صوتية طبيعية مركبة، وتسجيل دقائق العمل الصافي' : 'Distraction-free Pomodoro station with synthesized binaural ambient audio and telemetry',
      icon: Timer,
      color: 'rose',
      badge: isAr ? 'تركيز فائق' : 'Pure Focus',
      summary: isAr
        ? 'بيئة عمل هادئة مصممة لقطع كافة المشتتات: شاشة كاملة، مؤقت تنازلي دقيق، ومحرك صوتيات (أمطار، ضوضاء بيضاء، ترددات ثنائية Binaural) لتثبيت انتباه الدماغ.'
        : 'A minimal sanctuary for uninterrupted flow: full-screen timer, ambient binaural synthesizer, and focus telemetry.',
      steps: [
        {
          id: 1,
          title: isAr ? 'المؤقت التنازلي التفاعلي (Precision Focus Timer)' : 'Precision Focus Timer',
          pinLabel: '1',
          whyIsItHere: isAr
            ? 'استناداً لتقنية بومودورو: تقسيم العمل إلى 25 أو 50 دقيقة تركيز خالص يمنع التعب ويزيد الكفاءة.'
            : 'Leverages the Pomodoro protocol: 25 or 50 minute sprints prevent mental exhaustion and procrastination.',
          howItHelps: isAr
            ? 'يظهر الوقت المتبقي بخط كبير وواضح مع إمكانية الإيقاف المؤقت أو تمديد الجلسة.'
            : 'Prominent, distraction-free countdown with intuitive pause and extend capabilities.',
          realExample: isAr
            ? 'جلسة 45 دقيقة لكتابة مقترح التمويل المالي.'
            : '45-minute sprint to finalize the financial investor memo.',
          executiveTip: isAr
            ? 'في فترة الاستراحة (5 دقائق)، انهض من مكتبك واشرب ماء؛ لا تتصفح الهاتف أبداً لتسمح لدماغك بالانتعاش.'
            : 'During the 5-minute break, stand up and look at distant objects; avoid checking social media.',
          targetElementHighlight: 'timer-display',
        },
        {
          id: 2,
          title: isAr ? 'المؤثرات الصوتية المركبة (Ambient Soundscapes)' : 'Binaural Ambient Soundscapes',
          pinLabel: '2',
          whyIsItHere: isAr
            ? 'الضوضاء البيضاء وترددات ألفا تحجب أصوات البيئة المحيطة وتساعد خلايا الدماغ على الدخول في حالة التدفق (Flow State).'
            : 'Synthesized rain, white noise, and alpha binaural waves mask ambient acoustic noise to trigger flow state.',
          howItHelps: isAr
            ? 'اختر بين: صوت المطر، المقهى الهادئ، أو ترددات التركيز، مع تحكم فوري بالصوت.'
            : 'Toggle between Gentle Rain, Deep Ambient Hum, or White Noise with instant volume slider.',
          realExample: isAr
            ? 'تشغيل صوت المطر الهادئ أثناء البرمجة في مكان عام صاخب.'
            : 'Listening to rain soundscape while working in a noisy airport lounge.',
          executiveTip: isAr
            ? 'استخدم سماعات عازلة للضوضاء لمضاعفة تأثير الصوتيات التركيزية.'
            : 'Pair ambient audio with noise-cancelling headphones for complete cognitive isolation.',
          targetElementHighlight: 'audio-player',
        },
      ],
      faq: [
        {
          q: isAr ? 'واش الجلسات كتحسب في الإحصائيات (Analytics)؟' : 'Are focus sessions logged to Analytics?',
          a: isAr
            ? 'نعم، كل دقيقة تركيز تقضيها تسجل تلقائياً في مؤشر الـ Focus Time داخل لوحة التحليلات.'
            : 'Yes! Every focused minute logs to your personal telemetry index in the Analytics dashboard.',
        },
      ],
    },
  ];

  const currentModule = modules.find((m) => m.id === selectedModuleId) || modules[0];
  const steps = currentModule.steps;
  const currentStep = steps[currentStepIndex] || steps[0];

  const handleNextStep = () => {
    // Record step as completed
    const currentCompleted = completedSteps[selectedModuleId] || [];
    if (!currentCompleted.includes(currentStep.id)) {
      setCompletedSteps({
        ...completedSteps,
        [selectedModuleId]: [...currentCompleted, currentStep.id],
      });
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setSelectedHotspot(null);
    } else {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setSelectedHotspot(null);
    }
  };

  const handleRestartModule = () => {
    setCurrentStepIndex(0);
    setSelectedHotspot(null);
    setShowCelebration(false);
  };

  const completedCount = (completedSteps[selectedModuleId] || []).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className={`space-y-6 max-w-6xl mx-auto pb-16 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#1E2224] to-[#2D3136] text-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-700/60 relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
            <Sparkles size={13} />
            <span>{isAr ? 'المحاكي التفاعلي وشرح أسرار التطبيق' : 'Interactive Visual Blueprint & Simulator'}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {isAr ? 'دليل الاستخدام التنفيذي والشرح المرئي' : 'Executive Visual Operating Guide'}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {isAr
              ? 'شرح واقعي لكل ميزة وأداة في النظام، مع أمثلة حية ثابتة وخطوط توضيحية. اضغط على "فهمت الخطوة" للتقدم خطوة بخطوة، أو انقر على أي عنصر لاستكشاف فلسفة تصميمه وكيف يخدم إنتاجيتك.'
              : 'Interactive walkthrough with static realistic mockups and indicator callouts. Step through each tool with "I Understand", or click any hotspot to discover the executive psychology behind it.'}
          </p>
        </div>

        {/* Floating Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* AI SETUP ASSISTANT BANNER */}
      {onSwitchToAiPrompt && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
              🤖
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>{isAr ? 'تجهيز النظام بمساعد الذكاء الاصطناعي الخاص بك' : 'Setup with your AI Assistant'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {isAr ? 'برومبت جاهز' : '1-Click Prompt'}
                </span>
              </h4>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                {isAr
                  ? 'إذا كان لديك مساعد ذكاء اصطناعي (ChatGPT / Claude) يعرف عاداتك وأهدافك، انسخ البرومبت الشامل ليعطيك كود النظام بالكامل!'
                  : 'Already chatted with an AI assistant about your routines? Copy our master prompt and let it generate your custom setup code!'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSwitchToAiPrompt}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>{isAr ? 'فتح موجه الذكاء الاصطناعي ➔' : 'Open AI Prompt ➔'}</span>
          </button>
        </div>
      )}

      {/* Module Selector Stack */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isSelected = selectedModuleId === mod.id;
          const isDone = (completedSteps[mod.id] || []).length >= mod.steps.length;

          return (
            <button
              key={mod.id}
              onClick={() => {
                setSelectedModuleId(mod.id);
                setCurrentStepIndex(0);
                setSelectedHotspot(null);
                setShowCelebration(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#2D3136] text-white shadow-md scale-[1.02]'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200/80'
              }`}
            >
              <Icon size={16} className={isSelected ? 'text-amber-400' : 'text-neutral-400'} />
              <span>{mod.title.split('(')[0].trim()}</span>
              {isDone && <CheckCircle2 size={14} className="text-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* Main Walkthrough Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Explanation & Step Progression (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Progress Header Card */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                  {currentStepIndex + 1}
                </span>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {isAr
                    ? `الخطوة ${currentStepIndex + 1} من ${steps.length}`
                    : `Step ${currentStepIndex + 1} of ${steps.length}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestartModule}
                  className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  title={isAr ? 'إعادة الشرح من البداية' : 'Restart walkthrough'}
                >
                  <RotateCcw size={12} />
                  <span>{isAr ? 'إعادة' : 'Reset'}</span>
                </button>
              </div>
            </div>

            {/* Visual Step Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(10, ((currentStepIndex + 1) / steps.length) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-neutral-400 font-medium">
                <span>{currentModule.title.split('(')[0].trim()}</span>
                <span>{progressPercent}% {isAr ? 'تم استيعابه' : 'Understood'}</span>
              </div>
            </div>
          </div>

          {/* Active Step Deep-Dive Card */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-sm space-y-5 relative">
            {/* Step Title & Pin */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm shadow-amber-500/20">
                {currentStep.pinLabel}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-800 leading-snug">
                  {currentStep.title}
                </h3>
                <span className="text-xs text-neutral-400 font-medium mt-0.5 block">
                  {isAr ? 'اضغط "فهمت الخطوة" بالأسفل للمواصلة' : 'Click "I Understand" below to advance'}
                </span>
              </div>
            </div>

            {/* Why Is It Here (علاش مديورة؟) */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <HelpCircle size={14} className="text-amber-600" />
                <span>{isAr ? 'علاش مديورة هاد الأداة هنا؟ (Why is it here?)' : 'Why is this here?'}</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                {currentStep.whyIsItHere}
              </p>
            </div>

            {/* How It Helps You (كيفاش تفيدك عملياً؟) */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Zap size={14} className="text-emerald-600" />
                <span>{isAr ? 'كيفاش غادي تعاونك في يومك؟ (How it accelerates you)' : 'How it accelerates your daily execution'}</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                {currentStep.howItHelps}
              </p>
            </div>

            {/* Real Executive Example (مثال واقعي) */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Tag size={14} className="text-blue-600" />
                <span>{isAr ? 'مثال واقعي تطبيقي (Real World Example)' : 'Real World Example'}</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                {currentStep.realExample}
              </p>
            </div>

            {/* Executive Pro Tip (نصيحة ذهبية) */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
              <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-800 font-bold block mb-0.5">
                  {isAr ? 'نصيحة تنفيذية ذهبية:' : 'Executive Pro Tip:'}
                </strong>
                <span>{currentStep.executiveTip}</span>
              </div>
            </div>

            {/* Action Buttons: Understand / Next Step */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-100">
              <button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentStepIndex === 0
                    ? 'opacity-40 cursor-not-allowed text-neutral-400'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                <span>{isAr ? 'السابقة' : 'Previous'}</span>
              </button>

              <button
                onClick={handleNextStep}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs md:text-sm shadow-md shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>
                  {currentStepIndex === steps.length - 1
                    ? (isAr ? 'فهمت كل شيء، إنهاء الشرح 🏆' : 'Understood, Finish Walkthrough 🏆')
                    : (isAr ? 'فهمت الخطوة، انتقل للتالية ➔' : 'I Understand, Next Step ➔')}
                </span>
              </button>
            </div>

            {/* Live Tool Direct Link */}
            {onNavigateModule && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => onNavigateModule(currentModule.moduleId)}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold transition-colors cursor-pointer"
                >
                  <span>{isAr ? `فتح أداة ${currentModule.title.split('(')[0]} الفعلية الآن` : `Open live ${currentModule.title.split('(')[0]} tool`}</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Realistic Static Mockup with Interactive Callout Pins (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mockup Frame Header */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-neutral-400 ml-2">
                core-os / {selectedModuleId} / static-preview
              </span>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600">
              {isAr ? 'نموذج محاكاة تفاعلي' : 'Interactive Static Blueprint'}
            </span>
          </div>

          {/* The Static Mockup Card Display */}
          <div className="bg-neutral-50/80 rounded-3xl border border-neutral-200/90 p-5 md:p-6 shadow-inner relative overflow-hidden space-y-5">
            {/* Celebration Overlay if completed */}
            {showCelebration && (
              <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center text-white animate-fadeIn space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30">
                  🏆
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  {isAr ? 'أحسنت! أتقنت فهم هذه الأداة بالكامل' : 'Mastery Achieved! You Understood Every Component'}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-200 max-w-md">
                  {isAr
                    ? 'أنت الآن جاهز لاستخدام هذه الأداة في روتينك اليومي كقائد تنفيذي محترف.'
                    : 'You now command the operational blueprint to execute with maximum clarity.'}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setShowCelebration(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {isAr ? 'إغلاق' : 'Dismiss'}
                  </button>
                  {onNavigateModule && (
                    <button
                      onClick={() => onNavigateModule(currentModule.moduleId)}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      {isAr ? 'ابدأ الاستخدام الحي ➔' : 'Launch Live Tool ➔'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* RENDER SPECIFIC MOCKUP PER MODULE */}
            {selectedModuleId === 'daily-blocks' && (
              <div className="space-y-4">
                {/* Header Mockup */}
                <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                      <Layers size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-800">
                        {isAr ? 'اليوم: الأربعاء، 26 أكتوبر' : 'Today: Wednesday, Oct 26'}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {isAr ? '4 فترات مجدولة • 5 ساعات تركيز مخطط لها' : '4 scheduled blocks • 5.0h planned focus'}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Zap size={12} />
                    <span>94% {isAr ? 'طاقة الصباح' : 'Morning Peak'}</span>
                  </span>
                </div>

                {/* Pin 1: Deep Work Block Card */}
                <div
                  className={`bg-white rounded-2xl border p-4 shadow-sm transition-all relative ${
                    currentStepIndex === 0
                      ? 'border-amber-500 ring-4 ring-amber-500/15 scale-[1.01]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* Floating Pulsing Pin #1 */}
                  <div className="absolute -top-3 -right-3 z-20 flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentStepIndex(0)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all cursor-pointer ${
                        currentStepIndex === 0
                          ? 'bg-amber-600 text-white ring-4 ring-amber-400/40 animate-bounce'
                          : 'bg-neutral-800 text-white hover:bg-amber-600'
                      }`}
                      title="Pin 1: Deep Work Block"
                    >
                      1
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                          {isAr ? 'عمل عميق' : 'Deep Work'}
                        </span>
                        <span className="text-xs font-mono font-semibold text-neutral-500">
                          09:00 - 11:30 (2.5h)
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900">
                        {isAr ? 'هندسة الكود وبناء منصة المنتجات' : 'Product Architecture & High-Impact Coding'}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {isAr ? 'بدون هاتف، بدون تشتت، بدون فتح بريد إلكتروني' : 'Zero interruptions, muted notifications, single-tasking.'}
                      </p>
                    </div>

                    {/* Pin 3: Energy Tag */}
                    <div className="relative">
                      <button
                        onClick={() => setCurrentStepIndex(2)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm cursor-pointer ${
                          currentStepIndex === 2
                            ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                            : 'bg-neutral-700 text-white'
                        }`}
                        title="Pin 3: High Energy Tag"
                      >
                        3
                      </button>
                      <span className="mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 block text-center">
                        ⚡ High
                      </span>
                    </div>
                  </div>

                  {/* Pin 2: Linked Tasks inside Block */}
                  <div
                    className={`mt-3 pt-3 border-t border-neutral-100 space-y-2 relative rounded-xl p-2 transition-all ${
                      currentStepIndex === 1 ? 'bg-amber-50/50 border border-amber-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-700 flex items-center gap-1.5">
                        <CheckSquare size={13} className="text-amber-600" />
                        <span>{isAr ? 'المهام والعادات المربوطة بالفترة' : 'Linked Tasks & Micro-Habits'}</span>
                      </span>
                      <button
                        onClick={() => setCurrentStepIndex(1)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] cursor-pointer ${
                          currentStepIndex === 1
                            ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                            : 'bg-neutral-700 text-white'
                        }`}
                        title="Pin 2: Linked Tasks"
                      >
                        2
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span className="line-through text-neutral-400">
                          {isAr ? 'إنهاء مخطط معمارية النظام' : 'Draft system design blueprint'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-800">
                        <div className="w-3.5 h-3.5 rounded border border-neutral-300 shrink-0" />
                        <span>{isAr ? 'كتابة اختبارات الأداء للواجهة' : 'Implement core unit test suite'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pin 4: Focus Timer & Completion Bar */}
                  <div
                    className={`mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs relative rounded-xl p-2 transition-all ${
                      currentStepIndex === 3 ? 'bg-amber-50/50 border border-amber-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-mono text-neutral-600 font-bold bg-neutral-100 px-2 py-0.5 rounded-md">
                        <Clock size={11} />
                        <span>90 / 150 min</span>
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold">60% {isAr ? 'منجز' : 'done'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentStepIndex(3)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] cursor-pointer ${
                          currentStepIndex === 3
                            ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                            : 'bg-neutral-700 text-white'
                        }`}
                        title="Pin 4: Timer & Completion"
                      >
                        4
                      </button>
                      <button className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
                        <Play size={10} />
                        <span>{isAr ? 'تشغيل المؤقت' : 'Focus'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Block (Recharge) for realism */}
                <div className="bg-white/80 rounded-2xl border border-neutral-200 p-3.5 shadow-sm flex items-center justify-between opacity-80">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                      {isAr ? 'استعادة ونشاط' : 'Recharge'}
                    </span>
                    <span className="text-xs font-bold text-neutral-700">
                      {isAr ? '12:00 - 13:00 • وجبة صحية ومشي 15 دقيقة' : '12:00 - 13:00 • Nutrition & Sunlight Walk'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    Low Energy
                  </span>
                </div>
              </div>
            )}

            {selectedModuleId === 'tasks' && (
              <div className="space-y-3.5">
                {/* Pin 1: High Priority Due Time Task */}
                <div
                  className={`bg-white rounded-2xl border p-4 shadow-sm relative transition-all ${
                    currentStepIndex === 0 ? 'border-emerald-500 ring-4 ring-emerald-500/15' : 'border-neutral-200'
                  }`}
                >
                  <button
                    onClick={() => setCurrentStepIndex(0)}
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md animate-bounce cursor-pointer"
                  >
                    1
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                      High Priority
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      🕒 Due: 11:30 AM
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900 mt-2">
                    {isAr ? 'إرسال وثيقة التدقيق الأمني للعميل الاستراتيجي' : 'Send Enterprise Security Audit to Lead Client'}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isAr ? 'مشروع: توسع الأعمال • وقت الاستحقاق الدقيق بالساعة' : 'Project: Enterprise Expansion • Due by morning'}
                  </p>
                </div>

                {/* Pin 2: Measurable Task */}
                <div
                  className={`bg-white rounded-2xl border p-4 shadow-sm relative transition-all ${
                    currentStepIndex === 1 ? 'border-emerald-500 ring-4 ring-emerald-500/15' : 'border-neutral-200'
                  }`}
                >
                  <button
                    onClick={() => setCurrentStepIndex(1)}
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md cursor-pointer"
                  >
                    2
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      Measurable (30 pages)
                    </span>
                    <span className="text-xs font-bold text-neutral-700">18 / 30 pages</span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900 mt-2">
                    {isAr ? 'قراءة 30 صفحة في كتاب هندسة النظم' : 'Read 30 pages of Systems Engineering Book'}
                  </h4>
                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-100 h-2 rounded-full mt-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[60%] rounded-full" />
                  </div>
                </div>

                {/* Pin 3: Rollover Counter & Skip Reasons */}
                <div
                  className={`bg-white rounded-2xl border p-4 shadow-sm relative transition-all ${
                    currentStepIndex === 2 ? 'border-emerald-500 ring-4 ring-emerald-500/15' : 'border-neutral-200'
                  }`}
                >
                  <button
                    onClick={() => setCurrentStepIndex(2)}
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md cursor-pointer"
                  >
                    3
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                      Rollover x3
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {isAr ? 'سبب التأجيل: انتظار الموافقة القانونية' : 'Skip: Awaiting legal clearance'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900 mt-2">
                    {isAr ? 'تجديد عقود الخدمات السحابية السنوية' : 'Renew Annual Cloud Infrastructure Contracts'}
                  </h4>
                </div>

                {/* Pin 4: Archive & Undo Toast Trigger */}
                <div
                  className={`bg-white rounded-2xl border p-4 shadow-sm relative transition-all ${
                    currentStepIndex === 3 ? 'border-emerald-500 ring-4 ring-emerald-500/15' : 'border-neutral-200'
                  }`}
                >
                  <button
                    onClick={() => setCurrentStepIndex(3)}
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md cursor-pointer"
                  >
                    4
                  </button>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Archive size={16} className="text-amber-600" />
                      <span className="text-xs font-bold text-neutral-800">
                        {isAr ? 'خاصية الأرشفة والتراجع الفوري' : '1-Tap Archive & Instant Undo'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Ctrl + Z
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedModuleId === 'archive-undo' && (
              <div className="space-y-4">
                {/* Floating Mockup Toast with Undo Button */}
                <div className="bg-[#1E2224] text-white p-4 rounded-2xl shadow-xl border border-neutral-700/80 flex items-center justify-between gap-3 relative">
                  <button
                    onClick={() => setCurrentStepIndex(0)}
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-md animate-bounce cursor-pointer"
                  >
                    1
                  </button>
                  <div className="flex items-center gap-2.5 text-xs font-medium">
                    <span className="text-rose-400">🗑️</span>
                    <span>
                      {isAr ? 'تم حذف المهمة: "مراجعة عقد الشراكة"' : 'Deleted task: "Review Partnership Agreement"'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer">
                      <RotateCcw size={12} />
                      <span>{isAr ? 'تراجع ↺ (Ctrl+Z)' : 'Undo ↺ (Ctrl+Z)'}</span>
                    </button>
                  </div>
                </div>

                {/* Archive Vault Card */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3 relative">
                  <button
                    onClick={() => setCurrentStepIndex(1)}
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-md cursor-pointer"
                  >
                    2
                  </button>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                      <Archive size={16} className="text-amber-600" />
                      <span>{isAr ? 'مستودع الأرشيف الموحد (Archive Hub)' : 'Unified Archive Hub Vault'}</span>
                    </h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                      12 {isAr ? 'عنصر محفوظ' : 'Archived Items'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-neutral-800">
                        {isAr ? 'إطلاق الحملة الإعلانية للربع الثالث' : 'Q3 Product Marketing Launch'}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {isAr ? 'مشروع مكتمل • مؤرشف قبل 14 يوماً' : 'Completed Project • Archived 14 days ago'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentStepIndex(2)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw size={11} />
                        <span>{isAr ? 'استرجاع' : 'Restore'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedModuleId === 'habits' && (
              <div className="space-y-3.5">
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex items-center justify-between relative">
                  <button
                    onClick={() => setCurrentStepIndex(0)}
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-md animate-bounce cursor-pointer"
                  >
                    1
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-xl">
                      🧘
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">
                        {isAr ? '20 دقيقة تأمل وتنفس واعي' : '20m Meditation & Conscious Breathwork'}
                      </h4>
                      <p className="text-xs text-neutral-400">
                        {isAr ? 'روتين الصباح • الهدف: 7 أيام أسبوعياً' : 'Morning Routine • Target: 7 days/week'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1">
                      <Flame size={14} className="fill-orange-500" />
                      <span>36 Days</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex items-center justify-between relative">
                  <button
                    onClick={() => setCurrentStepIndex(1)}
                    className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-md cursor-pointer"
                  >
                    2
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-xl">
                      🏋️
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">
                        {isAr ? 'تمارين القوة والكاليستنكس' : 'Strength & Calisthenics Routine'}
                      </h4>
                      <p className="text-xs text-neutral-400">
                        {isAr ? 'تجميد السلسلة: رحلة سفر دولية ❄️' : 'Frozen: International Flight Travel ❄️'}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    ❄️ Banked Freeze
                  </span>
                </div>
              </div>
            )}

            {selectedModuleId === 'planner' && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-neutral-800">
                    {isAr ? 'مخطط الأسبوع 43 (Monday - Sunday)' : 'Week 43 Strategic Planner'}
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Archetype: Executive Sprint
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 font-bold text-indigo-900">
                    <div>Mon</div>
                    <div className="text-[10px] text-indigo-600 mt-1">Deep Work</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 font-bold text-indigo-900">
                    <div>Tue</div>
                    <div className="text-[10px] text-indigo-600 mt-1">Product</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 font-bold text-amber-900">
                    <div>Wed</div>
                    <div className="text-[10px] text-amber-600 mt-1">Team Sync</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 font-bold text-emerald-900">
                    <div>Thu</div>
                    <div className="text-[10px] text-emerald-600 mt-1">Clients</div>
                  </div>
                </div>
              </div>
            )}

            {selectedModuleId === 'focus' && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm text-center space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
                  Pomodoro 50/10 Protocol
                </span>
                <div className="text-4xl font-mono font-extrabold text-neutral-800">
                  34:20
                </div>
                <p className="text-xs text-neutral-500">
                  {isAr ? 'صوت الطبيعة النشط: أمطار خفيفة 🌧️' : 'Active Soundscape: Ambient Rain 🌧️'}
                </p>
              </div>
            )}
          </div>

          {/* FAQ Accordion for this Module */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle size={14} className="text-amber-600" />
              <span>{isAr ? 'أسئلة شائعة وإجابات سريعة عن الأداة' : 'Frequently Asked Questions & Answers'}</span>
            </h4>

            <div className="space-y-2">
              {currentModule.faq.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-100 space-y-1">
                  <div className="text-xs font-bold text-neutral-800">{item.q}</div>
                  <div className="text-xs text-neutral-600 leading-relaxed font-normal">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
