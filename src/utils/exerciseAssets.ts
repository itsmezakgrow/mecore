/**
 * Utility for Exercise Image Assets, Metadata, and Double Progression Specs.
 * Directly maps exercise names to uploaded assets in `/public/exercises/`.
 */

export function getExerciseSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Direct file mappings for user uploaded exercises in /public/exercises/
const EXACT_EXERCISE_IMAGE_FILES: Record<string, string> = {
  'leg press machine': '/exercises/Leg Press Machine.webp',
  'leg press': '/exercises/Leg Press Machine.webp',
  'flat dumbbell bench press': '/exercises/Flat Dumbbell Bench Press.webp',
  'flat db bench press': '/exercises/Flat Dumbbell Bench Press.webp',
  'flat dumbbell bench': '/exercises/Flat Dumbbell Bench Press.webp',
  'wide grip lat pulldown': '/exercises/Wide Grip Lat Pulldown.webp',
  'lat pulldown': '/exercises/Wide Grip Lat Pulldown.webp',
  'seated dumbbell shoulder press': '/exercises/Seated Dumbbell Shoulder Press.webp',
  'seated db shoulder press': '/exercises/Seated Dumbbell Shoulder Press.webp',
  'seated dumbbell press': '/exercises/Seated Dumbbell Shoulder Press.webp',
  'cable rope hammer curls': '/exercises/Cable Rope Hammer Curls.gif',
  'hammer curls': '/exercises/Cable Rope Hammer Curls.gif',
  'goblet squat': '/exercises/Goblet Squat.webp',
  'seated cable row': '/exercises/Seated Cable Row.webp',
  'cable row': '/exercises/Seated Cable Row.webp',
  'incline dumbbell bench press': '/exercises/Incline Dumbbell Bench Press.jpg',
  'incline db bench press': '/exercises/Incline Dumbbell Bench Press.jpg',
  'incline dumbbell bench': '/exercises/Incline Dumbbell Bench Press.jpg',
  'dumbbell lateral raises': '/exercises/Dumbbell Lateral Raises.webp',
  'lateral raises': '/exercises/Dumbbell Lateral Raises.webp',
  'tricep rope pushdown': '/exercises/Tricep Rope Pushdown.webp',
  'tricep pushdown': '/exercises/Tricep Rope Pushdown.webp'
};

export function getExerciseImagePath(name: string): string {
  const clean = name.toLowerCase().trim();
  if (EXACT_EXERCISE_IMAGE_FILES[clean]) {
    return EXACT_EXERCISE_IMAGE_FILES[clean];
  }
  // Generic fallback slug
  const slug = getExerciseSlug(name);
  return `/exercises/${slug}.webp`;
}

export interface ExerciseSpec {
  repRangeMin: number;
  repRangeMax: number;
  incrementStep: number; // in kg
  categoryType: 'heavy_compound' | 'back_leg_machine' | 'isolation';
  categoryEn: string;
  categoryAr: string;
  icon: string;
  executionCueEn: string;
  executionCueAr: string;
  availableWeights: number[];
}

// Exact realistic gym increments specified for commercial gym setups
export const EXERCISE_AVAILABLE_WEIGHTS: Record<string, number[]> = {
  // ROUTINE A (FULL BODY)
  'leg press machine': [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190],
  'flat dumbbell bench press': [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50],
  'wide grip lat pulldown': [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130],
  'seated dumbbell shoulder press': [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40],
  'cable rope hammer curls': [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40],

  // ROUTINE B (FULL BODY)
  'goblet squat': [5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40],
  'seated cable row': [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130],
  'incline dumbbell bench press': [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50],
  'dumbbell lateral raises': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12.5, 15, 17.5, 20, 22.5, 25],
  'tricep rope pushdown': [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40]
};

export const KNOWN_EXERCISES_SPECS: Record<string, ExerciseSpec> = {
  'leg press machine': {
    repRangeMin: 10,
    repRangeMax: 12,
    incrementStep: 10.0, // Pin-loaded stack increments by 10kg!
    categoryType: 'back_leg_machine',
    categoryEn: 'Legs / Quad Dominant Machine',
    categoryAr: 'الأرجل / آلة الضغط القوية',
    icon: '🦵',
    executionCueEn: 'Feet hip-width on platform. Lower under control for 3 seconds without lifting lower back.',
    executionCueAr: 'الأقدام بعرض الكتفين. انزل بالوزن بطريقة محكومة لمدة 3 ثوانٍ دون رفع أسفل الظهر.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['leg press machine']
  },
  'flat dumbbell bench press': {
    repRangeMin: 8,
    repRangeMax: 10,
    incrementStep: 2.5,
    categoryType: 'heavy_compound',
    categoryEn: 'Chest / Heavy Compound',
    categoryAr: 'الصدر / مركّب ثقيل',
    icon: '🏋️‍♂️',
    executionCueEn: 'Elbows tucked at 45 degrees. Drive dumbbells explosively up, squeeze pecs at peak.',
    executionCueAr: 'الكوعان بزاوية 45 درجة. ادفع الأثقال بقوة للأعلى واعتصر الصدر في القمة.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['flat dumbbell bench press']
  },
  'wide grip lat pulldown': {
    repRangeMin: 10,
    repRangeMax: 12,
    incrementStep: 5.0,
    categoryType: 'back_leg_machine',
    categoryEn: 'Back / Lat Width Machine',
    categoryAr: 'الظهر / السحب العريض',
    icon: '🦾',
    executionCueEn: 'Pull bar down to upper chest while driving elbows towards ribs. Avoid excessive swinging.',
    executionCueAr: 'اسحب البار نحو الجزء العلوي من الصدر مع توجيه المرفقين للأضلاع. تجنب المرجحة الزائدة.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['wide grip lat pulldown']
  },
  'seated dumbbell shoulder press': {
    repRangeMin: 8,
    repRangeMax: 10,
    incrementStep: 2.5,
    categoryType: 'heavy_compound',
    categoryEn: 'Shoulders / Heavy Compound',
    categoryAr: 'الكتف / ضغط ثقيل',
    icon: '🏋️',
    executionCueEn: 'Set bench to 75-80 degrees. Press vertically overhead, stop just short of locking elbows.',
    executionCueAr: 'اضبط المقعد على زاوية 75-80 درجة. ادفع للأعلى رأسياً وتوقف قبل قفل المرفقين تماماً.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['seated dumbbell shoulder press']
  },
  'cable rope hammer curls': {
    repRangeMin: 12,
    repRangeMax: 15,
    incrementStep: 2.5,
    categoryType: 'isolation',
    categoryEn: 'Arm Isolation / Brachialis',
    categoryAr: 'البايسبس والساعد / هامر',
    icon: '💪',
    executionCueEn: 'Keep elbows pinned to your torso. Pull rope handles up and spread at top contraction.',
    executionCueAr: 'ثبّت الكوعين بجانب الجسم. اسحب الحبل وأبعد طرفيه في القمة لعصر العضلة.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['cable rope hammer curls']
  },
  'goblet squat': {
    repRangeMin: 8,
    repRangeMax: 10,
    incrementStep: 2.5,
    categoryType: 'heavy_compound',
    categoryEn: 'Legs & Core / Heavy Compound',
    categoryAr: 'الأرجل والجذع / سكوات مركّب',
    icon: '🦵',
    executionCueEn: 'Hold dumbbell close to chest. Sit deep between hips while maintaining a neutral spine.',
    executionCueAr: 'احمل الدامبل ملاصقاً للصدر. انزل بعمق بين الفخذين مع الحفاظ على استقامة الظهر.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['goblet squat']
  },
  'seated cable row': {
    repRangeMin: 10,
    repRangeMax: 12,
    incrementStep: 5.0,
    categoryType: 'back_leg_machine',
    categoryEn: 'Back / Mid-Back Machine',
    categoryAr: 'الظهر / السحب السكاني',
    icon: '🚣',
    executionCueEn: 'Keep chest high. Pull handles to belly button and squeeze shoulder blades together for 1s.',
    executionCueAr: 'حافظ على استقامة الصدر. اسحب المقابض نحو السرة واعتصر لوحي الظهر لمدة ثانية.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['seated cable row']
  },
  'incline dumbbell bench press': {
    repRangeMin: 8,
    repRangeMax: 10,
    incrementStep: 2.5,
    categoryType: 'heavy_compound',
    categoryEn: 'Upper Chest / Heavy Compound',
    categoryAr: 'الصدر العلوي / مركّب ثقيل',
    icon: '🏋️‍♂️',
    executionCueEn: 'Set bench to 30 degrees incline. Lower dumbbells to upper chest line with controlled stretch.',
    executionCueAr: 'اضبط المقعد على زاوية 30 درجة. انزل بالدامبلز لنشاط الصدر العلوي بتمدد محكوم.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['incline dumbbell bench press']
  },
  'dumbbell lateral raises': {
    repRangeMin: 12,
    repRangeMax: 15,
    incrementStep: 1.0, // 1kg steps up to 10kg!
    categoryType: 'isolation',
    categoryEn: 'Shoulder Isolation / Lateral Delts',
    categoryAr: 'الكتف الجانبي / رفرفة عزل',
    icon: '🦅',
    executionCueEn: 'Slight forward lean. Lead with elbows up to shoulder height, strict form with no momentum.',
    executionCueAr: 'ميل طفيف للأمام. ارفع بالمرفقين حتى مستوى الكتف بدون استخدام الزخم أو المرجحة.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['dumbbell lateral raises']
  },
  'tricep rope pushdown': {
    repRangeMin: 12,
    repRangeMax: 15,
    incrementStep: 2.5,
    categoryType: 'isolation',
    categoryEn: 'Tricep Isolation / Lateral Head',
    categoryAr: 'الترايسبس / دفع بالبار أو الحبل',
    icon: '⚡',
    executionCueEn: 'Lock upper arms in place. Extend forearms down fully and flare rope outward at bottom.',
    executionCueAr: 'ثبّت الذراعين العلوية. افرد الساعدين لأسفل تماماً وافرك الحبل للخارج في النهاية.',
    availableWeights: EXERCISE_AVAILABLE_WEIGHTS['tricep rope pushdown']
  }
};

export function getExerciseSpec(name: string): ExerciseSpec {
  const key = name.toLowerCase().trim();
  if (KNOWN_EXERCISES_SPECS[key]) {
    return KNOWN_EXERCISES_SPECS[key];
  }

  // Fallback heuristic based on exercise name keywords
  if (key.includes('press') || key.includes('squat') || key.includes('deadlift') || key.includes('bench')) {
    return {
      repRangeMin: 8,
      repRangeMax: 10,
      incrementStep: 2.5,
      categoryType: 'heavy_compound',
      categoryEn: 'Heavy Compound Lift',
      categoryAr: 'تمرين مركّب ثقيل',
      icon: '🏋️',
      executionCueEn: 'Focus on explosive concentric push and controlled 3-second eccentric lower.',
      executionCueAr: 'ركز على الدفع القوي والانخفاض المحكوم لمدة 3 ثوانٍ.',
      availableWeights: [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 45, 50]
    };
  }

  if (key.includes('pulldown') || key.includes('row') || key.includes('leg press') || key.includes('extension')) {
    return {
      repRangeMin: 10,
      repRangeMax: 12,
      incrementStep: 5.0,
      categoryType: 'back_leg_machine',
      categoryEn: 'Machine / Cable Compound',
      categoryAr: 'تمرین آلة / كيبل',
      icon: '🦾',
      executionCueEn: 'Maintain continuous muscle tension without using momentum or body swinging.',
      executionCueAr: 'حافظ على شد عضلي مستمر بدون استخدام قوة المرجحة.',
      availableWeights: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120]
    };
  }

  // Isolation default
  return {
    repRangeMin: 12,
    repRangeMax: 15,
    incrementStep: 2.5,
    categoryType: 'isolation',
    categoryEn: 'Isolation Exercise',
    categoryAr: 'تمرين عزل',
    icon: '💪',
    executionCueEn: 'Strict form, pause for 1 second at peak muscular contraction.',
    executionCueAr: 'تكنيك دقيق مع توقف لمدة ثانية عند ذروة انقباض العضلة.',
    availableWeights: [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 35, 40]
  };
}

export function getExerciseMeta(name: string) {
  const spec = getExerciseSpec(name);
  return {
    categoryEn: spec.categoryEn,
    categoryAr: spec.categoryAr,
    icon: spec.icon
  };
}

/**
 * Get available standard gym weights for an exercise
 */
export function getAvailableWeightsForExercise(name: string): number[] {
  const clean = name.toLowerCase().trim();
  if (EXERCISE_AVAILABLE_WEIGHTS[clean]) {
    return EXERCISE_AVAILABLE_WEIGHTS[clean];
  }
  return getExerciseSpec(name).availableWeights;
}

/**
 * Calculate the realistic next progression weight using the exercise's exact gym weight array.
 * If user mastered current weight, advance to next index in availableWeights.
 */
export function getNextProgressionWeight(
  exerciseName: string,
  currentWeight: number
): { nextWeight: number; incrementStep: number } {
  const weights = getAvailableWeightsForExercise(exerciseName);
  
  if (!weights || weights.length === 0) {
    const defaultStep = 2.5;
    return { nextWeight: currentWeight + defaultStep, incrementStep: defaultStep };
  }

  // Find exact index or the closest index <= currentWeight
  let matchedIndex = -1;
  for (let i = 0; i < weights.length; i++) {
    if (Math.abs(weights[i] - currentWeight) < 0.1) {
      matchedIndex = i;
      break;
    }
  }

  if (matchedIndex !== -1) {
    if (matchedIndex + 1 < weights.length) {
      const nextWeight = weights[matchedIndex + 1];
      const incrementStep = Math.round((nextWeight - currentWeight) * 10) / 10;
      return { nextWeight, incrementStep };
    }
    // Reached maximum in array
    return { nextWeight: weights[weights.length - 1], incrementStep: 0 };
  }

  // If currentWeight wasn't an exact match, find the first weight strictly greater than currentWeight
  const higherWeight = weights.find(w => w > currentWeight);
  if (higherWeight !== undefined) {
    return {
      nextWeight: higherWeight,
      incrementStep: Math.round((higherWeight - currentWeight) * 10) / 10
    };
  }

  // Already above max or no higher weight found
  return { nextWeight: currentWeight, incrementStep: 0 };
}
