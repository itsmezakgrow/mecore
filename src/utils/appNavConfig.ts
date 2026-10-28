import { ModuleType, AppCategoryItem, AppNavItemConfig } from '../types';

export const DEFAULT_APP_CATEGORIES: AppCategoryItem[] = [
  { id: 'daily', nameEn: 'Daily Execution', nameAr: 'اليومي والتنفيذ', order: 1 },
  { id: 'strategy', nameEn: 'Planning & Strategy', nameAr: 'التخطيط والاستراتيجية', order: 2 },
];

export const DEFAULT_NAV_ITEMS: AppNavItemConfig[] = [
  // Primary Daily Execution Stack
  { id: 'dashboard', labelEn: 'Overview', labelAr: 'لوحة التحكم اليومية', category: 'daily', hidden: false, order: 1 },
  { id: 'daily-blocks', labelEn: 'Daily Blocks', labelAr: 'قوالب اليوم والفترات', category: 'daily', hidden: false, order: 2 },
  { id: 'training', labelEn: 'Iron Engine (Workout)', labelAr: 'محرك التدريب والتمارين', category: 'daily', hidden: false, order: 3 },
  { id: 'tasks', labelEn: 'Task Tracker', labelAr: 'متتبع المهام', category: 'daily', hidden: false, order: 4 },
  { id: 'habits', labelEn: 'Habit Tracker', labelAr: 'متتبع العادات', category: 'daily', hidden: false, order: 5 },
  { id: 'reflections', labelEn: 'Reflections & Journal', labelAr: 'التأملات والدروس', category: 'daily', hidden: false, order: 6 },
  { id: 'focus', labelEn: 'Pomodoro Focus', labelAr: 'مؤقت التركيز', category: 'daily', hidden: false, order: 7 },

  // Planning & Strategy Stack
  { id: 'planner', labelEn: 'Weekly Planner', labelAr: 'المخطط الأسبوعي', category: 'strategy', hidden: false, order: 8 },
  { id: 'projects', labelEn: 'Projects & Strategy', labelAr: 'المشاريع والاستراتيجية', category: 'strategy', hidden: false, order: 9 },
  { id: 'analytics', labelEn: 'Telemetry & Analytics', labelAr: 'التحليلات والقياس', category: 'strategy', hidden: false, order: 10 },

  // Secondary/Consolidated tools
  { id: 'goals', labelEn: 'Goals & Targets', labelAr: 'الأهداف والغايات', category: 'strategy', hidden: true, order: 11 },
  { id: 'checklists', labelEn: 'Checklists & SOPs', labelAr: 'قوائم التدقيق وإجراءات التشغيل', category: 'strategy', hidden: true, order: 12 },
  { id: 'notes', labelEn: 'Brain Dump & Notes', labelAr: 'تفريغ الأفكار والملاحظات', category: 'strategy', hidden: true, order: 13 },
  { id: 'comments', labelEn: 'Comments & Hub', labelAr: 'التعليقات والإشارات', category: 'strategy', hidden: true, order: 14 },
  { id: 'sunday-reset', labelEn: 'Sunday Reset', labelAr: 'إعادة ضبط الأحد', category: 'strategy', hidden: true, order: 15 },
  { id: 'mentor', labelEn: 'AI Mentor (Atlas)', labelAr: 'المستشار الذكي (أطلس)', category: 'strategy', hidden: true, order: 16 },
  { id: 'guide', labelEn: 'Operating Guide', labelAr: 'دليل التشغيل والشرح التفاعلي', category: 'strategy', hidden: false, order: 17 },
  { id: 'archive', labelEn: 'Archive Hub', labelAr: 'الأرشيف والمحفوظات', category: 'daily', hidden: false, order: 18 },
];

export const getSavedNavCategories = (): AppCategoryItem[] => {
  try {
    const raw = localStorage.getItem('core_app_categories_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load categories from localStorage:', e);
  }
  return DEFAULT_APP_CATEGORIES;
};

export const saveNavCategories = (cats: AppCategoryItem[]) => {
  try {
    localStorage.setItem('core_app_categories_v2', JSON.stringify(cats));
    window.dispatchEvent(new Event('core_nav_config_changed'));
  } catch (e) {
    console.error('Failed to save categories:', e);
  }
};

export const getSavedNavItems = (): AppNavItemConfig[] => {
  try {
    const raw = localStorage.getItem('core_nav_items_config_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((p: any) => p.id));
        const missing = DEFAULT_NAV_ITEMS.filter(d => !existingIds.has(d.id));
        const combined = [...parsed, ...missing].map(item => {
          if (item.id === 'training') {
            return { ...item, hidden: false, category: 'daily', order: 3 };
          }
          return item;
        });
        return combined;
      }
    }
  } catch (e) {
    console.error('Failed to load nav items from localStorage:', e);
  }
  return DEFAULT_NAV_ITEMS;
};

export const saveNavItems = (items: AppNavItemConfig[]) => {
  try {
    localStorage.setItem('core_nav_items_config_v2', JSON.stringify(items));
    window.dispatchEvent(new Event('core_nav_config_changed'));
  } catch (e) {
    console.error('Failed to save nav items:', e);
  }
};

