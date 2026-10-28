import React, { useState, useMemo } from 'react';
import {
  Scale,
  Utensils,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Apple,
  Flame,
  CheckCircle2,
  Info,
  Calendar,
  Sparkles,
  Zap,
  Briefcase,
  Target,
  Moon,
  Clock,
  Sun,
  Sunset,
  Coffee
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  BodyMetricLog,
  BodyProfileConfig,
  PrimaryFocusMode,
  BreakfastStrategy,
  MiddayMealStrategy,
  PreSunsetMealStrategy,
  EveningFeastStrategy
} from '../types';

interface BodyMetricsNutritionProps {
  logs: BodyMetricLog[];
  profile: BodyProfileConfig | null;
  onSaveProfile: (profile: Partial<BodyProfileConfig>) => Promise<any>;
  onAddLog: (log: Omit<BodyMetricLog, 'id'>) => Promise<any>;
  onDeleteLog: (id: string) => Promise<any>;
  isDark?: boolean;
  lang?: 'en' | 'ar';
}

export const BodyMetricsNutrition: React.FC<BodyMetricsNutritionProps> = ({
  logs = [],
  profile,
  onSaveProfile,
  onAddLog,
  onDeleteLog,
  isDark = false,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';

  // Profile Form State
  const [heightCm, setHeightCm] = useState<number>(profile?.heightCm || 186);
  const [weightKg, setWeightKg] = useState<number>(profile?.currentWeightKg || (logs[0]?.weightKg || 64));
  const [targetWeightKg, setTargetWeightKg] = useState<number>(profile?.targetWeightKg || 70);
  const [timelineMonths, setTimelineMonths] = useState<number>(profile?.timelineMonths || 2);
  const [numberOfMeals, setNumberOfMeals] = useState<number>(profile?.numberOfMeals || 4);
  const [goal, setGoal] = useState<'lean_bulk' | 'maintain' | 'cut'>(profile?.goal || 'lean_bulk');

  // Strategy Fields for 4-Meal Daily Protocol
  const [primaryFocusMode, setPrimaryFocusMode] = useState<PrimaryFocusMode>(profile?.primaryFocusMode || 'hypertrophy_sprint');
  const [breakfastStrategy, setBreakfastStrategy] = useState<BreakfastStrategy>(profile?.breakfastStrategy || 'intermittent_fasting');
  const [middayMealStrategy, setMiddayMealStrategy] = useState<MiddayMealStrategy>(profile?.middayMealStrategy || 'light_protein_fiber');
  const [preSunsetMealStrategy, setPreSunsetMealStrategy] = useState<PreSunsetMealStrategy>(profile?.preSunsetMealStrategy || 'fruit_dates_yogurt');
  const [eveningFeastStrategy, setEveningFeastStrategy] = useState<EveningFeastStrategy>(profile?.eveningFeastStrategy || 'peak_muscle_feast');

  // Meal Timing Fields
  const [breakfastTime, setBreakfastTime] = useState<string>(profile?.breakfastTime || '08:30');
  const [meal1Time, setMeal1Time] = useState<string>(profile?.meal1Time || '13:00');
  const [meal2Time, setMeal2Time] = useState<string>(profile?.meal2Time || '17:30');
  const [meal3Time, setMeal3Time] = useState<string>(profile?.meal3Time || '20:30');

  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // New Weight Log input
  const [logWeightInput, setLogWeightInput] = useState<string>('');
  const [logDateInput, setLogDateInput] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [logNotesInput, setLogNotesInput] = useState<string>('');
  const [isAddingLog, setIsAddingLog] = useState<boolean>(false);

  // Sync state if profile loads from Firestore
  React.useEffect(() => {
    if (profile) {
      if (profile.heightCm) setHeightCm(profile.heightCm);
      if (profile.currentWeightKg) setWeightKg(profile.currentWeightKg);
      if (profile.targetWeightKg) setTargetWeightKg(profile.targetWeightKg);
      if (profile.timelineMonths) setTimelineMonths(profile.timelineMonths);
      if (profile.numberOfMeals) setNumberOfMeals(profile.numberOfMeals);
      if (profile.goal) setGoal(profile.goal);
      if (profile.primaryFocusMode) setPrimaryFocusMode(profile.primaryFocusMode);
      if (profile.breakfastStrategy) setBreakfastStrategy(profile.breakfastStrategy);
      if (profile.middayMealStrategy) setMiddayMealStrategy(profile.middayMealStrategy);
      if (profile.preSunsetMealStrategy) setPreSunsetMealStrategy(profile.preSunsetMealStrategy);
      if (profile.eveningFeastStrategy) setEveningFeastStrategy(profile.eveningFeastStrategy);
      if (profile.breakfastTime) setBreakfastTime(profile.breakfastTime);
      if (profile.meal1Time) setMeal1Time(profile.meal1Time);
      if (profile.meal2Time) setMeal2Time(profile.meal2Time);
      if (profile.meal3Time) setMeal3Time(profile.meal3Time);
    }
  }, [profile]);

  // Scientific Nutrition Algorithm across 4 Meals
  const nutritionCalculations = useMemo(() => {
    const w = Number(weightKg) || 64;
    const h = Number(heightCm) || 186;
    const tgtW = Number(targetWeightKg) || 70;
    const months = Number(timelineMonths) || 2;
    const age = 22; // default athletic baseline

    // Weight delta & rate per week
    const weightDiff = tgtW - w;
    const weeklyTargetRateKg = months > 0 ? Number((weightDiff / (months * 4.33)).toFixed(2)) : 0;

    // BMR (Mifflin-St Jeor)
    const bmr = 10 * w + 6.25 * h - 5 * age + 5;
    const tdee = Math.round(bmr * 1.45);

    // Goal & Focus Mode Caloric Adjustment
    let surplusDeficit = 0;
    if (primaryFocusMode === 'business_maintenance') {
      // Gentle surplus (+150 kcal) to avoid lethargy / heavy digestion during intensive work hours
      surplusDeficit = 150;
    } else if (goal === 'lean_bulk' || primaryFocusMode === 'hypertrophy_sprint') {
      // Surplus scaled to target rate (+250 kcal to +550 kcal)
      surplusDeficit = Math.min(550, Math.max(250, Math.round(weeklyTargetRateKg * 400)));
    } else if (goal === 'cut' || primaryFocusMode === 'fat_loss_cut') {
      surplusDeficit = -400;
    }

    const dailyCalories = Math.round(tdee + surplusDeficit);

    // Macros:
    // Protein: 2.0g per kg of bodyweight
    const proteinGrams = Math.round(w * 2.0);
    const proteinCalories = proteinGrams * 4;

    // Fats: ~0.9g per kg
    const fatsGrams = Math.round(w * 0.9);
    const fatsCalories = fatsGrams * 9;

    // Remainder -> Complex Glycogen Carbs
    const remainingCalories = Math.max(0, dailyCalories - (proteinCalories + fatsCalories));
    const carbsGrams = Math.round(remainingCalories / 4);

    // ---------------------------------------------------------------------
    // 4-MEAL FLEXIBLE DISTRIBUTION PROTOCOL
    // ---------------------------------------------------------------------
    
    // MEAL 1: Morning / Breakfast
    const isMorningFasting = breakfastStrategy === 'intermittent_fasting';
    let breakfast = null;
    let bKcal = 0, bProt = 0, bCarb = 0, bFat = 0;

    if (!isMorningFasting) {
      if (breakfastStrategy === 'light_breakfast') {
        bKcal = Math.round(dailyCalories * 0.15);
        bProt = Math.round(proteinGrams * 0.15);
        bCarb = Math.round(carbsGrams * 0.15);
        bFat = Math.round(fatsGrams * 0.15);
        breakfast = {
          nameEn: `Meal 1 - Light Breakfast (${breakfastTime})`,
          nameAr: `الوجبة 1 - فطور صباحي خفيف (${breakfastTime})`,
          calories: bKcal,
          protein: bProt,
          carbs: bCarb,
          fats: bFat,
          focusAr: '🍳 فطور خفيف طازج (بيض مسلوق / شوفان خفيف) لبدء اليوم بنشاط بدون إجهاد هضمي.',
          focusEn: 'Light fresh breakfast to ignite metabolic activity without digestive heaviness.',
          foodsAr: ['بيض مسلوق / بياض بيض', 'شوفان خفيف مع تمرات', 'قهوة سوداء أو شاي أخضر', 'خيارتان طازجتان'],
          foodsEn: ['Boiled Eggs / Egg Whites', 'Light Oats with Dates', 'Black Coffee or Green Tea', 'Fresh Cucumbers']
        };
      } else {
        bKcal = Math.round(dailyCalories * 0.22);
        bProt = Math.round(proteinGrams * 0.20);
        bCarb = Math.round(carbsGrams * 0.22);
        bFat = Math.round(fatsGrams * 0.20);
        breakfast = {
          nameEn: `Meal 1 - Full Morning Feast (${breakfastTime})`,
          nameAr: `الوجبة 1 - فطور صباحي كامل (${breakfastTime})`,
          calories: bKcal,
          protein: bProt,
          carbs: bCarb,
          fats: bFat,
          focusAr: '🥞 فطور مشبع كامل بالطاقة والبروتين لبدء اليوم بأقصى نشاط.',
          focusEn: 'Full hearty breakfast for all-day physical energy.',
          foodsAr: ['بيض كامل مع خبز كامل', 'زيت زيتون وأومليت', 'تمر وفواكه طازجة', 'زبادي يوناني أو ويه'],
          foodsEn: ['Whole Eggs & Whole Wheat Bread', 'Olive Oil Omelette', 'Fresh Dates & Fruits', 'Greek Yogurt or Whey']
        };
      }
    }

    // MEAL 2: Midday / Lunch (~13:00)
    let m2Kcal = 0, m2Prot = 0, m2Carb = 0, m2Fat = 0;
    let middayMeal = null;

    if (middayMealStrategy !== 'skipped') {
      const isLightMidday = middayMealStrategy === 'light_protein_fiber';
      if (isLightMidday) {
        m2Kcal = Math.round(dailyCalories * 0.25);
        m2Prot = Math.round(proteinGrams * 0.30);
        m2Carb = Math.round(carbsGrams * 0.20); // Low carbs during work to preserve cognitive focus!
        m2Fat = Math.round(fatsGrams * 0.25);
        middayMeal = {
          nameEn: `Meal 2 - Midday Fuel (${meal1Time})`,
          nameAr: `الوجبة 2 - غداء منتصف النهار / الظهيرة (${meal1Time})`,
          calories: m2Kcal,
          protein: m2Prot,
          carbs: m2Carb,
          fats: m2Fat,
          focusAr: '🥗 بروتين صافي + ألياف نباتية + كربوهيدرات خفيفة نقية (مصممة لمنع الخمول والنعاس والاحتفاظ بتركيز العمل العالي).',
          focusEn: 'Clean Protein + Plant Fiber + Controlled Low Carbs (Zero Food Coma / Peak Focus for Work).',
          foodsAr: ['صدر دجاج مشوي / مسلوق', 'بياض بيض / بيض', 'زبادي يوناني أو ويه بروتين', 'سلطة خضراء وخيار', 'تفاحة أو 3 تمرات', 'خبز كامل خفيف'],
          foodsEn: ['Grilled Chicken Breast', 'Egg Whites / Eggs', 'Greek Yogurt or Whey', 'Green Salad & Cucumbers', 'Apple or 3 Dates', 'Light Whole Grain Bread']
        };
      } else {
        m2Kcal = Math.round(dailyCalories * 0.30);
        m2Prot = Math.round(proteinGrams * 0.28);
        m2Carb = Math.round(carbsGrams * 0.30);
        m2Fat = Math.round(fatsGrams * 0.25);
        middayMeal = {
          nameEn: `Meal 2 - Power Midday Feast (${meal1Time})`,
          nameAr: `الوجبة 2 - غداء مشبع متوسط (${meal1Time})`,
          calories: m2Kcal,
          protein: m2Prot,
          carbs: m2Carb,
          fats: m2Fat,
          focusAr: '🍲 وجبة غداء كاملة متوازنة كربوهيدرات وبروتين.',
          focusEn: 'Balanced Full Midday Meal.',
          foodsAr: ['دجاج أو سمك/تونة', 'أرز أبيض أو بني', 'سلطة خضراء مع زيت زيتون', 'فاكهة طازجة'],
          foodsEn: ['Chicken or Fish/Tuna', 'White/Brown Rice', 'Green Salad with Olive Oil', 'Fresh Fruit']
        };
      }
    }

    // MEAL 3: Pre-Sunset / Late Afternoon Protocol (~17:30)
    let m3Kcal = 0, m3Prot = 0, m3Carb = 0, m3Fat = 0;
    let preSunsetMeal = null;

    if (preSunsetMealStrategy !== 'skipped') {
      if (preSunsetMealStrategy === 'fruit_dates_yogurt') {
        m3Kcal = Math.round(dailyCalories * 0.18);
        m3Prot = Math.round(proteinGrams * 0.20);
        m3Carb = Math.round(carbsGrams * 0.22);
        m3Fat = Math.round(fatsGrams * 0.15);
        preSunsetMeal = {
          nameEn: `Meal 3 - Pre-Sunset Refuel (${meal2Time})`,
          nameAr: `الوجبة 3 - وجبة ما قبل المغرب / العصر (${meal2Time})`,
          calories: m3Kcal,
          protein: m3Prot,
          carbs: m3Carb,
          fats: m3Fat,
          focusAr: '🍇 فواكه طازجة + تمرات + زبادي يوناني / ويه بروتين (تزود بالسكريات الطبيعية السريعة والبروتين قبل التمرين أو صلاة المغرب).',
          focusEn: 'Fresh Fruit + Dates + Greek Yogurt / Whey (Quick glycogen refuel pre-workout / pre-sunset).',
          foodsAr: ['تمر (3-5 تمرات)', 'زبادي يوناني أو ويه بروتين', 'موزة أو تفاحة', 'حفنة مكسرات نية'],
          foodsEn: ['Dates (3-5 dates)', 'Greek Yogurt or Whey Protein', 'Banana or Apple', 'Raw Nuts Handful']
        };
      } else if (preSunsetMealStrategy === 'pre_workout_carbs') {
        m3Kcal = Math.round(dailyCalories * 0.20);
        m3Prot = Math.round(proteinGrams * 0.15);
        m3Carb = Math.round(carbsGrams * 0.28);
        m3Fat = Math.round(fatsGrams * 0.10);
        preSunsetMeal = {
          nameEn: `Meal 3 - Pre-Workout Carbs (${meal2Time})`,
          nameAr: `الوجبة 3 - شحنة الكارب قبل التمرين (${meal2Time})`,
          calories: m3Kcal,
          protein: m3Prot,
          carbs: m3Carb,
          fats: m3Fat,
          focusAr: '⚡ كربوهيدرات سريعة وسهلة الهضم لشحن الجليكوجين وضمان ضخ عضلي قوي في التمرين.',
          focusEn: 'Fast digesting carbs to saturate glycogen for intense workout performance.',
          foodsAr: ['شوفان بالعسل والتمر', 'موزة كبيرة', 'خبز أبيض مع مربى طبيعي', 'قهوة سوداء / بري ورك أوت'],
          foodsEn: ['Oats with Honey & Dates', 'Large Banana', 'Toast with Natural Honey', 'Black Coffee']
        };
      } else {
        m3Kcal = Math.round(dailyCalories * 0.15);
        m3Prot = Math.round(proteinGrams * 0.25);
        m3Carb = Math.round(carbsGrams * 0.10);
        m3Fat = Math.round(fatsGrams * 0.15);
        preSunsetMeal = {
          nameEn: `Meal 3 - Light Protein Snack (${meal2Time})`,
          nameAr: `الوجبة 3 - سناك بروتين خفيف (${meal2Time})`,
          calories: m3Kcal,
          protein: m3Prot,
          carbs: m3Carb,
          fats: m3Fat,
          focusAr: '🧀 سناك بروتين خفيف بدون كربوهيدرات ثقيلة للحفاظ على الشبع حتى وجبة العشاء.',
          focusEn: 'Light protein snack to maintain amino acid flow into the evening feast.',
          foodsAr: ['سكوب ويه بروتين مع ماء', 'جبن قريش / زبادي يوناني', 'بيضتان مسلوقتان'],
          foodsEn: ['Whey Scoop with Water', 'Cottage Cheese / Greek Yogurt', '2 Boiled Eggs']
        };
      }
    }

    // MEAL 4: Evening Feast / Dinner Protocol (~20:30)
    // Reclaims all remaining protein, carbs, fats & calories for optimal overnight recovery!
    const m4Prot = Math.max(30, proteinGrams - bProt - m2Prot - m3Prot);
    const m4Carb = Math.max(30, carbsGrams - bCarb - m2Carb - m3Carb);
    const m4Fat = Math.max(10, fatsGrams - bFat - m2Fat - m3Fat);
    const m4Kcal = (m4Prot * 4) + (m4Carb * 4) + (m4Fat * 9);

    const eveningFeast = {
      nameEn: `Meal 4 - Evening Muscle Feast (${meal3Time})`,
      nameAr: `الوجبة 4 - وجبة العشاء الكبرى للتعافي العضلي (${meal3Time})`,
      calories: m4Kcal,
      protein: m4Prot,
      carbs: m4Carb,
      fats: m4Fat,
      focusAr: '🥩 الشحنة الكبرى: أقصى كمية بروتين وكربوهيدرات معقدة لتعويض الجليكوجين العضلي وتحفيز البناء أثناء النوم بعد التمرين.',
      focusEn: 'The Main Evening Feast: Peak Protein & Complex Glycogen Carbs for overnight muscle repair.',
      foodsAr: ['لحم بقري مفروم أو ستيك', 'دجاج أو سمك/تونة', 'أرز أبيض أو بني', 'بطاطس مسلوقة أو مشوية', 'بطاطا حلوة', 'شوفان مع مكسرات', 'خضروات مطهوة'],
      foodsEn: ['Lean Ground Beef or Steak', 'Chicken or Fish/Tuna', 'White/Brown Rice', 'Boiled/Baked Potatoes', 'Sweet Potatoes', 'Oats with Nuts', 'Steamed Vegetables']
    };

    return {
      dailyCalories,
      proteinGrams,
      carbsGrams,
      fatsGrams,
      tdee,
      weightDiff,
      weeklyTargetRateKg,
      breakfast,
      middayMeal,
      preSunsetMeal,
      eveningFeast,
      isFasting: isMorningFasting
    };
  }, [
    weightKg, heightCm, targetWeightKg, timelineMonths, goal, primaryFocusMode,
    breakfastStrategy, middayMealStrategy, preSunsetMealStrategy, eveningFeastStrategy,
    breakfastTime, meal1Time, meal2Time, meal3Time
  ]);

  // Handle saving profile changes
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await onSaveProfile({
        heightCm: Number(heightCm),
        currentWeightKg: Number(weightKg),
        targetWeightKg: Number(targetWeightKg),
        timelineMonths: Number(timelineMonths),
        numberOfMeals: Number(numberOfMeals),
        goal,
        primaryFocusMode,
        breakfastStrategy,
        middayMealStrategy,
        preSunsetMealStrategy,
        eveningFeastStrategy,
        breakfastTime,
        meal1Time,
        meal2Time,
        meal3Time,
        dailyCalories: nutritionCalculations.dailyCalories,
        proteinGrams: nutritionCalculations.proteinGrams,
        carbsGrams: nutritionCalculations.carbsGrams,
        fatsGrams: nutritionCalculations.fatsGrams,
        updatedAt: Date.now()
      });
      setProfileSuccessMsg(isAr ? 'تم حفظ واستيعاب الاستراتيجية الغذائية بـ 4 وجبات بنجاح!' : '4-Meal nutrition strategy & targets updated!');
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch (e) {
      console.error('Failed to save body profile:', e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle adding new weight log entry
  const handleAddWeightLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWeight = parseFloat(logWeightInput);
    if (isNaN(parsedWeight) || parsedWeight <= 0) return;

    setIsAddingLog(true);
    try {
      await onAddLog({
        date: logDateInput || new Date().toISOString().split('T')[0],
        weightKg: parsedWeight,
        heightCm: Number(heightCm),
        numberOfMeals: Number(numberOfMeals),
        notes: logNotesInput.trim() || undefined,
        createdAt: Date.now()
      });

      setWeightKg(parsedWeight);
      await onSaveProfile({ currentWeightKg: parsedWeight });

      setLogWeightInput('');
      setLogNotesInput('');
    } catch (e) {
      console.error('Failed to add weight log:', e);
    } finally {
      setIsAddingLog(false);
    }
  };

  // Weight Chart Data
  const weightChartData = useMemo(() => {
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((l) => {
      const parts = l.date.split('-');
      const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const shortDate = dObj.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
      return {
        date: shortDate,
        weight: l.weightKg,
        rawDate: l.date
      };
    });
  }, [logs, isAr]);

  const weightDelta = useMemo(() => {
    if (logs.length < 2) return null;
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const firstWeight = sorted[0].weightKg;
    const latestWeight = sorted[sorted.length - 1].weightKg;
    const diff = Number((latestWeight - firstWeight).toFixed(1));
    return {
      diff,
      isGain: diff > 0,
      isLoss: diff < 0
    };
  }, [logs]);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
            <Scale size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'مقياس الوزن وتغذية الـ 4 وجبات المرنة' : '4-Meal Adaptive Nutrition Engine'}
              </h2>
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800/40">
                FLEXIBLE 4-MEAL PROTOCOL
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {isAr
                ? 'توزيع دقيق للمغذيات على 4 وجبات يومية (الفطور، الغداء، وجبة ما قبل المغرب، ووجبة العشاء الكبرى) مع مراعاة تركيز البيزنس والتمرين.'
                : 'Scientific distribution of macros across 4 daily meal slots tailored for business productivity and hypertrophy.'}
            </p>
          </div>
        </div>

        {weightDelta && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 self-start md:self-auto text-xs">
            {weightDelta.isGain ? (
              <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
            ) : weightDelta.isLoss ? (
              <TrendingDown size={16} className="text-amber-600 dark:text-amber-400" />
            ) : null}
            <span className="font-bold text-slate-600 dark:text-neutral-400">{isAr ? 'التغير الكلي:' : 'Total Delta:'}</span>
            <span className={`font-mono font-black ${weightDelta.diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {weightDelta.diff > 0 ? `+${weightDelta.diff}` : weightDelta.diff} kg
            </span>
          </div>
        )}
      </div>

      {profileSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {/* Grid: Parameters Form (Left) vs Meal Protocol Blueprint (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Configurable Target Weights, Focus Mode & 4 Meal Protocols */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* User Parameters Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-neutral-400 tracking-wider flex items-center gap-2">
              <Scale size={14} className="text-emerald-500" />
              <span>{isAr ? 'بيانات الوزن والجدول الزمني' : 'Target Weight & Duration Timeline'}</span>
            </h3>

            {/* Current vs Target Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 block">
                  {isAr ? 'الوزن الحالي (kg):' : 'Current Weight (kg):'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-mono font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 block">
                  {isAr ? 'الوزن المستهدف (kg):' : 'Target Weight (kg):'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-mono font-bold px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200"
                />
              </div>
            </div>

            {/* Timeline Duration & Height */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 block">
                  {isAr ? 'المدة الزمنية (بالأشهر):' : 'Timeline (Months):'}
                </label>
                <select
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(parseFloat(e.target.value) || 1)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value={1}>{isAr ? 'شهر واحد (4 أسابيع)' : '1 Month'}</option>
                  <option value={2}>{isAr ? 'شهرين (8 أسابيع)' : '2 Months'}</option>
                  <option value={3}>{isAr ? '3 أشهر (12 أسبوع)' : '3 Months'}</option>
                  <option value={6}>{isAr ? '6 أشهر' : '6 Months'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 block">
                  {isAr ? 'الطول (cm):' : 'Height (cm):'}
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-mono font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Primary Focus Mode Selector */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 block">
                {isAr ? 'نمط التركيز والمرحلة الحالية:' : 'Primary Focus Mode:'}
              </label>
              <select
                value={primaryFocusMode}
                onChange={(e) => setPrimaryFocusMode(e.target.value as PrimaryFocusMode)}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="hypertrophy_sprint">
                  {isAr ? '🔥 تركيز أقصى على تضخيم العضلات والزيادة التدريجية' : 'Hypertrophy Muscle Sprint'}
                </option>
                <option value="business_maintenance">
                  {isAr ? '💼 تركيز على العمل والبيزنس - المحافظة على العضلات وتقليل الإجهاد' : 'Business Focus - Muscle Maintenance'}
                </option>
                <option value="fat_loss_cut">
                  {isAr ? '✂️ التنشيف والتخلص من الدهون مع حماية العضلات' : 'Clean Cut & Fat Loss'}
                </option>
              </select>
            </div>

            {/* 4 MEALS DYNAMIC SELECTORS */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                {isAr ? 'إعداد بروتوكول الـ 4 وجبات اليومية:' : 'Configure 4-Meal Daily Protocol:'}
              </span>

              {/* Meal 1: Breakfast */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Sun size={13} className="text-amber-500" />
                    <span>{isAr ? '1. وجبة الصباح / الفطور:' : '1. Morning Breakfast:'}</span>
                  </span>
                  <input
                    type="time"
                    value={breakfastTime}
                    onChange={(e) => setBreakfastTime(e.target.value)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
                  />
                </div>
                <select
                  value={breakfastStrategy}
                  onChange={(e) => setBreakfastStrategy(e.target.value as BreakfastStrategy)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="intermittent_fasting">
                    {isAr ? '🌙 صيام متقطع (بدون فطور - ماء/قهوة للتركيز)' : 'Intermittent Fasting (No Breakfast)'}
                  </option>
                  <option value="light_breakfast">
                    {isAr ? '☀️ فطور خفيف (بيض / شوفان)' : 'Light Breakfast (Eggs / Oats)'}
                  </option>
                  <option value="full_breakfast">
                    {isAr ? '🍳 فطور كامل مشبع' : 'Full Hearty Breakfast'}
                  </option>
                </select>
              </div>

              {/* Meal 2: Midday / Lunch */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Utensils size={13} className="text-emerald-500" />
                    <span>{isAr ? '2. وجبة منتصف النهار (الغداء):' : '2. Midday / Lunch Protocol:'}</span>
                  </span>
                  <input
                    type="time"
                    value={meal1Time}
                    onChange={(e) => setMeal1Time(e.target.value)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
                  />
                </div>
                <select
                  value={middayMealStrategy}
                  onChange={(e) => setMiddayMealStrategy(e.target.value as MiddayMealStrategy)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="light_protein_fiber">
                    {isAr ? '🥗 بروتين + ألياف + كارب منخفض (حماية التركيز للعمل)' : 'Light Protein + Fiber + Low Carbs (Work Focus)'}
                  </option>
                  <option value="standard_balanced">
                    {isAr ? '🍲 وجبة غداء قياسية متوازنة' : 'Standard Balanced Midday Meal'}
                  </option>
                  <option value="skipped">
                    {isAr ? '🚫 تجاوز الوجبة (صيام حتى العصر)' : 'Skipped / Fasted'}
                  </option>
                </select>
              </div>

              {/* Meal 3: Pre-Sunset / Late Afternoon */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Sunset size={13} className="text-orange-500" />
                    <span>{isAr ? '3. وجبة ما قبل المغرب / العصر:' : '3. Pre-Sunset / Late Afternoon:'}</span>
                  </span>
                  <input
                    type="time"
                    value={meal2Time}
                    onChange={(e) => setMeal2Time(e.target.value)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
                  />
                </div>
                <select
                  value={preSunsetMealStrategy}
                  onChange={(e) => setPreSunsetMealStrategy(e.target.value as PreSunsetMealStrategy)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="fruit_dates_yogurt">
                    {isAr ? '🍇 فواكه + تمرات + زبادي يوناني (قبل المغرب / التمرين)' : 'Fruits + Dates + Greek Yogurt (Pre-Workout Refuel)'}
                  </option>
                  <option value="pre_workout_carbs">
                    {isAr ? '⚡ كربوهيدرات سريعة لشحن التمرين (شوفان / موز)' : 'Fast Pre-Workout Carbs (Oats / Banana)'}
                  </option>
                  <option value="light_protein_snack">
                    {isAr ? '🧀 سناك بروتين خفيف (ويه / بيض مسلوق)' : 'Light Protein Snack (Whey / Boiled Eggs)'}
                  </option>
                  <option value="skipped">
                    {isAr ? '🚫 تجاوز الوجبة' : 'Skipped / Fasted'}
                  </option>
                </select>
              </div>

              {/* Meal 4: Evening Feast / Dinner */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Moon size={13} className="text-indigo-400" />
                    <span>{isAr ? '4. وجبة العشاء الكبرى (الليل):' : '4. Evening Feast Protocol:'}</span>
                  </span>
                  <input
                    type="time"
                    value={meal3Time}
                    onChange={(e) => setMeal3Time(e.target.value)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
                  />
                </div>
                <select
                  value={eveningFeastStrategy}
                  onChange={(e) => setEveningFeastStrategy(e.target.value as EveningFeastStrategy)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="peak_muscle_feast">
                    {isAr ? '🥩 الوجبة الكبرى للتعافي (بروتين عالي + أرز/بطاطس + سلطة)' : 'Peak Muscle Recovery Feast (High Protein + Rice/Potatoes)'}
                  </option>
                  <option value="light_casein_salad">
                    {isAr ? '🥗 عشاء خفيف مع سلطة وسكوب بروتين' : 'Light Evening Salad & Protein'}
                  </option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{isSavingProfile ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وتطبيق الخطة التغذوية' : 'Save & Calculate Targets')}</span>
            </button>
          </div>

          {/* Calculated Targets Cards */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-500 dark:text-neutral-400 tracking-wider flex items-center gap-2">
                <Flame size={14} className="text-emerald-500" />
                <span>{isAr ? 'الأهداف اليومية الحسابية' : 'Calculated Daily Targets'}</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                TDEE: {nutritionCalculations.tdee} kcal
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">{isAr ? 'سعرات' : 'CALORIES'}</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{nutritionCalculations.dailyCalories}</span>
                <span className="text-[9px] text-slate-400 block">kcal</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">{isAr ? 'بروتين' : 'PROTEIN'}</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{nutritionCalculations.proteinGrams}</span>
                <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 block">g</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{isAr ? 'كارب' : 'CARBS'}</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">{nutritionCalculations.carbsGrams}</span>
                <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 block">g</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 block">{isAr ? 'دهون' : 'FATS'}</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">{nutritionCalculations.fatsGrams}</span>
                <span className="text-[9px] text-blue-600/80 dark:text-blue-400/80 block">g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic 4-Meal Strategy Blueprint */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Utensils size={18} className="text-emerald-500" />
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {isAr ? 'بروتوكول توزيع المغذيات على الـ 4 وجبات' : 'Nutrient Distribution Protocol Blueprint'}
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                {isAr ? 'مخطط 4 وجبات' : '4-Meal Blueprint'}
              </span>
            </div>

            {/* Fasting Notice Card if Intermittent Fasting */}
            {nutritionCalculations.isFasting && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-1 text-xs">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <Moon size={14} className="text-indigo-400" />
                  <span>{isAr ? 'بروتوكول الصيام الصباحي (حتى الظهيرة):' : 'Morning Fasting Window:'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  {isAr
                    ? 'بدون فطور صباحي. المسموحات: ماء، قهوة سوداء أو شاي بدون سكر. يساعد على الحفاظ على تركيز الدماغ العالي في ساعات العمل الأولى وتوفير السعرات للوجبات القادمة.'
                    : 'No morning breakfast. Allowed: water, black coffee, or tea without sugar. Keeps cognitive focus high during morning work.'}
                </p>
              </div>
            )}

            {/* MEAL 1: Breakfast Card if active */}
            {nutritionCalculations.breakfast && (
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun size={18} className="text-amber-500" />
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {isAr ? nutritionCalculations.breakfast.nameAr : nutritionCalculations.breakfast.nameEn}
                    </h4>
                  </div>
                  <div className="text-right font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    {nutritionCalculations.breakfast.calories} kcal • {nutritionCalculations.breakfast.protein}g P • {nutritionCalculations.breakfast.carbs}g C • {nutritionCalculations.breakfast.fats}g F
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium">
                  {isAr ? nutritionCalculations.breakfast.focusAr : nutritionCalculations.breakfast.focusEn}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(isAr ? nutritionCalculations.breakfast.foodsAr : nutritionCalculations.breakfast.foodsEn).map((food) => (
                    <span
                      key={food}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MEAL 2: Midday / Lunch */}
            {nutritionCalculations.middayMeal && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-[11px] flex items-center justify-center">
                      2
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {isAr ? nutritionCalculations.middayMeal.nameAr : nutritionCalculations.middayMeal.nameEn}
                    </h4>
                  </div>
                  <div className="text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {nutritionCalculations.middayMeal.calories} kcal • {nutritionCalculations.middayMeal.protein}g P • {nutritionCalculations.middayMeal.carbs}g C • {nutritionCalculations.middayMeal.fats}g F
                  </div>
                </div>

                <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
                  {isAr ? nutritionCalculations.middayMeal.focusAr : nutritionCalculations.middayMeal.focusEn}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(isAr ? nutritionCalculations.middayMeal.foodsAr : nutritionCalculations.middayMeal.foodsEn).map((food) => (
                    <span
                      key={food}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-neutral-900 text-slate-800 dark:text-neutral-200 border border-emerald-200 dark:border-emerald-800/50"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MEAL 3: Pre-Sunset / Late Afternoon */}
            {nutritionCalculations.preSunsetMeal && (
              <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunset size={18} className="text-orange-500" />
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {isAr ? nutritionCalculations.preSunsetMeal.nameAr : nutritionCalculations.preSunsetMeal.nameEn}
                    </h4>
                  </div>
                  <div className="text-right font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                    {nutritionCalculations.preSunsetMeal.calories} kcal • {nutritionCalculations.preSunsetMeal.protein}g P • {nutritionCalculations.preSunsetMeal.carbs}g C • {nutritionCalculations.preSunsetMeal.fats}g F
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium">
                  {isAr ? nutritionCalculations.preSunsetMeal.focusAr : nutritionCalculations.preSunsetMeal.focusEn}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(isAr ? nutritionCalculations.preSunsetMeal.foodsAr : nutritionCalculations.preSunsetMeal.foodsEn).map((food) => (
                    <span
                      key={food}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-orange-200 dark:border-orange-800/40"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MEAL 4: Evening Feast / Dinner */}
            {nutritionCalculations.eveningFeast && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-slate-900 dark:bg-neutral-800 text-white font-mono font-bold text-[11px] flex items-center justify-center border border-neutral-700">
                      4
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {isAr ? nutritionCalculations.eveningFeast.nameAr : nutritionCalculations.eveningFeast.nameEn}
                    </h4>
                  </div>
                  <div className="text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {nutritionCalculations.eveningFeast.calories} kcal • {nutritionCalculations.eveningFeast.protein}g P • {nutritionCalculations.eveningFeast.carbs}g C • {nutritionCalculations.eveningFeast.fats}g F
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-neutral-300 font-medium leading-relaxed">
                  {isAr ? nutritionCalculations.eveningFeast.focusAr : nutritionCalculations.eveningFeast.focusEn}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(isAr ? nutritionCalculations.eveningFeast.foodsAr : nutritionCalculations.eveningFeast.foodsEn).map((food) => (
                    <span
                      key={food}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Scale Check-In Form & Progression History Chart */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18191D] border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-neutral-400 tracking-wider flex items-center gap-2">
              <Plus size={14} className="text-emerald-500" />
              <span>{isAr ? 'تسجيل قراءة الميزان اليومية' : 'Log Scale Check-In'}</span>
            </h3>

            <form onSubmit={handleAddWeightLog} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder={isAr ? 'الوزن اليومي (مثال: 64.5 kg)' : 'Today weight (e.g. 64.5 kg)'}
                  value={logWeightInput}
                  onChange={(e) => setLogWeightInput(e.target.value)}
                  className="text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
                />

                <input
                  type="date"
                  required
                  value={logDateInput}
                  onChange={(e) => setLogDateInput(e.target.value)}
                  className="text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
                />
              </div>

              <input
                type="text"
                placeholder={isAr ? 'ملاحظات (اختياري، مثلاً: صائم صباحاً)' : 'Notes (optional)'}
                value={logNotesInput}
                onChange={(e) => setLogNotesInput(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white"
              />

              <button
                type="submit"
                disabled={isAddingLog || !logWeightInput}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{isAddingLog ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'تسجيل قراءة الوزن' : 'Record Weight Log')}</span>
              </button>
            </form>

            {/* Weight Progression Chart */}
            {weightChartData.length > 0 && (
              <div className="pt-3 space-y-2 border-t border-slate-100 dark:border-neutral-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-neutral-400">
                  <span>{isAr ? 'مسار تطور الوزن عبر الزمن' : 'Body Weight Progress Over Time'}</span>
                  <span className="text-[10px] font-mono">{logs.length} {isAr ? 'مدخلات' : 'entries'}</span>
                </div>

                <div className="h-40 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.1 : 0.2} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? '#a3a3a3' : '#64748b' }} />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: isDark ? '#a3a3a3' : '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#18191D' : '#ffffff',
                          borderColor: isDark ? '#262626' : '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                      <Area type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

        </div>

        </div>

    </div>
  );
};
