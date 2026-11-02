/**
 * Gym Equipment Weight Calculator & Plate Loading Breakdown
 * Utility to calculate exact per-side plate breakdowns, dumbbell pair weights,
 * and selectorized pin machine settings for standard commercial gym equipment.
 */

import { getAvailableWeightsForExercise } from './exerciseAssets';

export type EquipmentCategory = 'dumbbell' | 'barbell' | 'plate_loaded_machine' | 'cable_pin_stack';

export interface EquipmentBreakdown {
  category: EquipmentCategory;
  categoryLabelEn: string;
  categoryLabelAr: string;
  targetWeightKg: number;
  
  // Barbell / Plate Loaded Specifics
  baseStructureWeightKg: number; // 20kg bar or 20kg sled
  baseStructureLabelEn: string;
  baseStructureLabelAr: string;
  perSideWeightKg: number;
  perSidePlates: { weightKg: number; count: number; colorHex: string }[];
  
  // Dumbbell Specifics
  perHandDumbbellKg: number;
  dumbbellPairLabelEn: string;
  dumbbellPairLabelAr: string;
  isStandardRackAvailable: boolean;

  // Per-Rep Exact Load Details (Single implement vs bilateral pair)
  isSingleImplement: boolean;
  weightPerRepKg: number;
  weightPerHandKg: number;
  perRepExplanationEn: string;
  perRepExplanationAr: string;
  howToHoldEn: string;
  howToHoldAr: string;

  // Selectorized Stack Specifics
  pinNumber: number;
  stackStepKg: number;

  // Warmup Set Recommendations
  warmupSets: {
    setNumber: number;
    labelEn: string;
    labelAr: string;
    weightKg: number;
    reps: number;
    noteEn: string;
    noteAr: string;
  }[];
}

// Standard commercial gym plate colors and weights (Olympic)
const OLYMPIC_PLATES = [
  { weightKg: 25, colorHex: '#EF4444' }, // Red
  { weightKg: 20, colorHex: '#3B82F6' }, // Blue
  { weightKg: 15, colorHex: '#EAB308' }, // Yellow
  { weightKg: 10, colorHex: '#22C55E' }, // Green
  { weightKg: 5, colorHex: '#A855F7' },  // Purple
  { weightKg: 2.5, colorHex: '#64748B' }, // Slate
  { weightKg: 1.25, colorHex: '#94A3B8' } // Light Gray
];

// Standard dumbbell rack weights (kg)
export const STANDARD_DUMBBELL_RACK_KG = [
  2.5, 5.0, 7.5, 10.0, 12.5, 15.0, 17.5, 20.0, 22.5, 25.0, 27.5, 30.0, 32.5, 35.0, 37.5, 40.0, 42.5, 45.0, 50.0
];

/**
 * Snap arbitrary target to the closest available commercial gym weight
 */
function snapToAvailableWeights(targetKg: number, availableWeights: number[]): number {
  if (!availableWeights || availableWeights.length === 0) return targetKg;
  let closest = availableWeights[0];
  let minDiff = Math.abs(targetKg - closest);
  for (const w of availableWeights) {
    const diff = Math.abs(targetKg - w);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w;
    }
  }
  return closest;
}

/**
 * Build realistic warm-up pyramid sets strictly using available commercial gym weights
 */
function buildRealisticWarmupPyramid(
  targetWeightKg: number,
  availableWeights: number[],
  category: EquipmentCategory
): EquipmentBreakdown['warmupSets'] {
  const validLowerWeights = availableWeights.filter(w => w < targetWeightKg);

  if (validLowerWeights.length === 0) {
    return [
      {
        setNumber: 1,
        labelEn: 'Warm-up Set (Movement Prep)',
        labelAr: 'مجموعة تسخين (تهيئة حركية)',
        weightKg: targetWeightKg,
        reps: 8,
        noteEn: 'Light movement rehearsal & joint lubrication',
        noteAr: 'تهيئة المفصل وتكرار مسار الحركة بدون إجهاد'
      }
    ];
  }

  const warmups: EquipmentBreakdown['warmupSets'] = [];

  // Set 1: ~45-50% load
  const w1Target = targetWeightKg * 0.5;
  const w1Weight = snapToAvailableWeights(w1Target, validLowerWeights);
  warmups.push({
    setNumber: 1,
    labelEn: 'Warm-up Set 1 (50% Load)',
    labelAr: 'مجموعة تسخين 1 (50% من الوزن)',
    weightKg: w1Weight,
    reps: 10,
    noteEn: 'Joint lubrication & movement pattern groove',
    noteAr: 'تزليق المفاصل وضبط المسار الحركي'
  });

  // Set 2: ~75% load
  const remainingForW2 = validLowerWeights.filter(w => w > w1Weight);
  if (remainingForW2.length > 0) {
    const w2Target = targetWeightKg * 0.75;
    const w2Weight = snapToAvailableWeights(w2Target, remainingForW2);
    warmups.push({
      setNumber: 2,
      labelEn: 'Warm-up Set 2 (75% Load)',
      labelAr: 'مجموعة تسخين 2 (75% من الوزن)',
      weightKg: w2Weight,
      reps: 5,
      noteEn: 'CNS potentiation & explosive speed',
      noteAr: 'تنشيط الجهاز العصبي والسرعة الانفجارية'
    });

    // Optional Set 3 (Feeder Set ~88%): only if target is heavy enough and room exists
    const remainingForW3 = validLowerWeights.filter(w => w > w2Weight);
    if (remainingForW3.length > 0 && targetWeightKg >= 35) {
      const w3Target = targetWeightKg * 0.88;
      const w3Weight = snapToAvailableWeights(w3Target, remainingForW3);
      warmups.push({
        setNumber: 3,
        labelEn: 'Feeder Set (Acclimatization)',
        labelAr: 'مجموعة تمهيدية (تأقلم عصبي)',
        weightKg: w3Weight,
        reps: 2,
        noteEn: 'Prime neuromuscular recruitment with zero fatigue',
        noteAr: 'جاهزية عضلية كاملة بدون أي إجهاد قبل المجموعات الفعالة'
      });
    }
  }

  return warmups;
}

/**
 * Determine equipment category based on exercise name
 */
export function detectEquipmentCategory(exerciseName: string): EquipmentCategory {
  const clean = exerciseName.toLowerCase().trim();

  // Dumbbell movements
  if (
    clean.includes('dumbbell') ||
    clean.includes('db ') ||
    clean.includes('lateral raise') ||
    clean.includes('goblet') ||
    clean.includes('bicep curl') ||
    (clean.includes('hammer curl') && !clean.includes('cable'))
  ) {
    return 'dumbbell';
  }

  // Pin stack selectorized machines (Standard Commercial Gym Pin Stacks: Leg Press, Lat Pulldown, Cable Row, Cable curls)
  if (
    clean.includes('leg press') ||
    clean.includes('lat pulldown') ||
    clean.includes('cable') ||
    clean.includes('pulldown') ||
    clean.includes('tricep pushdown') ||
    clean.includes('seated row') ||
    clean.includes('extension') ||
    clean.includes('machine')
  ) {
    return 'cable_pin_stack';
  }

  // Plate-loaded machines with physical plate horns/pegs
  if (
    clean.includes('hack squat') ||
    clean.includes('lever') ||
    clean.includes('plate loaded') ||
    clean.includes('plate-loaded')
  ) {
    return 'plate_loaded_machine';
  }

  return 'barbell';
}

/**
 * Calculate equipment breakdown for a target weight
 */
export function calculateEquipmentBreakdown(
  exerciseName: string,
  targetWeightKg: number,
  customBaseWeight?: number
): EquipmentBreakdown {
  const category = detectEquipmentCategory(exerciseName);
  const availableWeights = getAvailableWeightsForExercise(exerciseName);
  const snappedTarget = snapToAvailableWeights(targetWeightKg, availableWeights);
  const target = Math.max(2.5, snappedTarget);

  let baseWeight = 20; // Default bar or sled weight
  let baseLabelEn = 'Olympic Barbell (20kg)';
  let baseLabelAr = 'بار أولمبي (20 كجم)';

  if (category === 'plate_loaded_machine') {
    baseWeight = customBaseWeight !== undefined ? customBaseWeight : 20; // Standard sled carriage 20kg
    baseLabelEn = `Machine Carriage Sled (${baseWeight}kg)`;
    baseLabelAr = `حامل الآلة الأولي (${baseWeight} كجم)`;
  } else if (category === 'barbell') {
    baseWeight = customBaseWeight !== undefined ? customBaseWeight : 20;
    if (baseWeight === 15) {
      baseLabelEn = "Women's Barbell (15kg)";
      baseLabelAr = 'بار نسائي (15 كجم)';
    } else if (baseWeight === 10) {
      baseLabelEn = 'EZ-Curl Barbell (10kg)';
      baseLabelAr = 'بار EZ الملتوي (10 كجم)';
    } else {
      baseLabelEn = 'Olympic Barbell (20kg)';
      baseLabelAr = 'بار أولمبي (20 كجم)';
    }
  }

  // --- 1. DUMBBELL CALCULATIONS ---
  if (category === 'dumbbell') {
    const isSingleDb = exerciseName.toLowerCase().includes('goblet');
    const perHand = target;
    const isStandard = availableWeights.includes(perHand);
    const warmupSets = buildRealisticWarmupPyramid(perHand, availableWeights, 'dumbbell');

    return {
      category: 'dumbbell',
      categoryLabelEn: isSingleDb ? 'Single Dumbbell (Goblet Grip)' : 'Dumbbell Pair Rack',
      categoryLabelAr: isSingleDb ? 'دامبل فردي (قبضة غوبلت)' : 'حامل أزواج الأثقال (الدامبلز)',
      targetWeightKg: target,
      baseStructureWeightKg: 0,
      baseStructureLabelEn: 'Handheld',
      baseStructureLabelAr: 'حمل باليد',
      perSideWeightKg: 0,
      perSidePlates: [],
      perHandDumbbellKg: perHand,
      dumbbellPairLabelEn: isSingleDb
        ? `Use 1x ${perHand}kg Dumbbell`
        : `Use 2x ${perHand}kg Dumbbells (1 in each hand)`,
      dumbbellPairLabelAr: isSingleDb
        ? `استخدم دامبل واحد بوزن ${perHand} كجم`
        : `استخدم زوج دامبلز بوزن ${perHand} كجم في كل يد`,
      isStandardRackAvailable: isStandard,
      isSingleImplement: isSingleDb,
      weightPerRepKg: isSingleDb ? perHand : perHand * 2,
      weightPerHandKg: perHand,
      perRepExplanationEn: isSingleDb
        ? `Every single rep moves exactly ${perHand}kg. You hold 1 dumbbell with both hands vertically against your chest.`
        : `Every rep moves ${perHand}kg in each hand (${perHand * 2}kg total combined weight moved per repetition).`,
      perRepExplanationAr: isSingleDb
        ? `في كل تكرار، ترفع بالضبط ${perHand} كجم. تمسك دامبلاً واحداً بكلتا اليدين رأسياً أمام الصدر.`
        : `في كل تكرار، ترفع ${perHand} كجم في كل يد (${perHand * 2} كجم إجمالي الوزن المرفوع في كل تكرار).`,
      howToHoldEn: isSingleDb
        ? `Cup both hands under the top bell of the ${perHand}kg dumbbell at sternum level.`
        : `Grip one ${perHand}kg dumbbell firmly in each hand with wrist aligned.`,
      howToHoldAr: isSingleDb
        ? `احمل رأس الدامبل العلوي (${perHand} كجم) بكلتا يديك ملاصقاً لمنتصف الصدر.`
        : `أمسك دامبل بوزن ${perHand} كجم بإحكام في كل يد مع استقامة المعصم.`,
      pinNumber: 0,
      stackStepKg: 0,
      warmupSets
    };
  }

  // --- 2. CABLE / SELECTORIZED PIN STACK CALCULATIONS ---
  if (category === 'cable_pin_stack') {
    const stackStepKg = availableWeights.length > 1 
      ? Number((availableWeights[1] - availableWeights[0]).toFixed(1)) 
      : 5.0;

    const pinIndex = availableWeights.findIndex(w => Math.abs(w - target) < 0.1);
    const pinNumber = pinIndex !== -1 ? pinIndex + 1 : Math.max(1, Math.round(target / stackStepKg));
    const warmupSets = buildRealisticWarmupPyramid(target, availableWeights, 'cable_pin_stack');

    return {
      category: 'cable_pin_stack',
      categoryLabelEn: 'Pin-Loaded Stack Machine',
      categoryLabelAr: 'آلة الأوزان المدمجة (Pin-Loaded Stack)',
      targetWeightKg: target,
      baseStructureWeightKg: 0,
      baseStructureLabelEn: 'Cable / Pin Pulley',
      baseStructureLabelAr: 'بكرة الكابل والأنشوطة',
      perSideWeightKg: 0,
      perSidePlates: [],
      perHandDumbbellKg: 0,
      dumbbellPairLabelEn: '',
      dumbbellPairLabelAr: '',
      isStandardRackAvailable: true,
      isSingleImplement: true,
      weightPerRepKg: target,
      weightPerHandKg: target,
      perRepExplanationEn: `Every repetition moves the full ${target}kg selectorized stack (Pin #${pinNumber}).`,
      perRepExplanationAr: `في كل تكرار، يتم تحريك كتلة الأوزان المحددة بالكامل بوزن ${target} كجم (البلاطة رقم #${pinNumber}).`,
      howToHoldEn: `Select plate #${pinNumber} (${target}kg) with the selector pin.`,
      howToHoldAr: `ثبّت مسمار الاختيار عند البلاطة رقم #${pinNumber} (${target} كجم).`,
      pinNumber,
      stackStepKg,
      warmupSets
    };
  }

  // --- 3. BARBELL & PLATE-LOADED MACHINES ---
  const remainingWeight = Math.max(0, target - baseWeight);
  const perSideWeight = remainingWeight / 2;

  // Greedy Plate Algorithm for each side
  const perSidePlates: { weightKg: number; count: number; colorHex: string }[] = [];
  let tempRemainingPerSide = perSideWeight;

  for (const plate of OLYMPIC_PLATES) {
    if (tempRemainingPerSide >= plate.weightKg) {
      const count = Math.floor(tempRemainingPerSide / plate.weightKg);
      if (count > 0) {
        perSidePlates.push({
          weightKg: plate.weightKg,
          count,
          colorHex: plate.colorHex
        });
        tempRemainingPerSide = Math.round((tempRemainingPerSide - count * plate.weightKg) * 100) / 100;
      }
    }
  }

  const categoryLabelEn = category === 'plate_loaded_machine' ? 'Plate-Loaded Machine' : 'Barbell & Olympic Plates';
  const categoryLabelAr = category === 'plate_loaded_machine' ? 'آلة محملة بالأقراص (Hack / Plate Machine)' : 'بار أولمبي وأقراص الوزن';

  const barbellWeights = [baseWeight, ...[0.5, 0.75].map(ratio => Math.round((baseWeight + (remainingWeight * ratio)) / 2.5) * 2.5)];
  const warmupSets = buildRealisticWarmupPyramid(target, barbellWeights, category);

  return {
    category,
    categoryLabelEn,
    categoryLabelAr,
    targetWeightKg: target,
    baseStructureWeightKg: baseWeight,
    baseStructureLabelEn: baseLabelEn,
    baseStructureLabelAr: baseLabelAr,
    perSideWeightKg: perSideWeight,
    perSidePlates,
    perHandDumbbellKg: 0,
    dumbbellPairLabelEn: '',
    dumbbellPairLabelAr: '',
    isStandardRackAvailable: true,
    isSingleImplement: true,
    weightPerRepKg: target,
    weightPerHandKg: target,
    perRepExplanationEn: `Every repetition moves ${target}kg total (${baseWeight}kg bar/carriage + ${perSideWeight}kg plates on each side).`,
    perRepExplanationAr: `في كل تكرار، يتم رفع ${target} كجم إجمالاً (${baseWeight} كجم البار الأولي + ${perSideWeight} كجم أقراص في كل جهة).`,
    howToHoldEn: `Load ${perSideWeight}kg on each sleeve and clamp with safety collars.`,
    howToHoldAr: `حمّل ${perSideWeight} كجم في كل جهة وأحكم الإغلاق بمشابك الأمان.`,
    pinNumber: 0,
    stackStepKg: 0,
    warmupSets
  };
}
