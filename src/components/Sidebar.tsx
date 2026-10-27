import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Flame, 
  CheckSquare, 
  CalendarDays, 
  FolderKanban, 
  ListChecks,
  StickyNote, 
  BookOpen,
  ChevronRight, 
  ShieldCheck, 
  HelpCircle, 
  Smartphone, 
  Download, 
  Grid, 
  X, 
  Sparkles, 
  BarChart3, 
  Target, 
  Moon, 
  Sun, 
  Bot, 
  Settings, 
  Languages, 
  Timer,
  MessageSquare,
  Dumbbell,
  SlidersHorizontal,
  Folder,
  Layers,
  Archive,
  LogOut,
  UserCheck
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { ModuleType } from '../types';
import { translations } from '../utils/translations';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getSavedNavCategories, getSavedNavItems } from '../utils/appNavConfig';
import { getDisabledModules } from '../utils/moduleLifecycle';

interface SidebarProps {
  activeModule: ModuleType;
  setActiveModule: (m: ModuleType) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  onOpenSetupGuide: () => void;
  onOpenExportModal?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  lang?: 'en' | 'ar';
  onToggleLanguage?: () => void;
  currentUser?: User | null;
  onSignOut?: () => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  collapsed,
  setCollapsed,
  onOpenSetupGuide,
  onOpenExportModal,
  isDark = false,
  onToggleTheme,
  lang = 'en',
  onToggleLanguage,
  currentUser,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // App navigation and category state
  const [navCategories, setNavCategories] = useState(() => getSavedNavCategories());
  const [navItemsConfig, setNavItemsConfig] = useState(() => getSavedNavItems());
  const [disabledModules, setDisabledModules] = useState<ModuleType[]>(() => getDisabledModules());

  useEffect(() => {
    const handleConfigChange = () => {
      setNavCategories(getSavedNavCategories());
      setNavItemsConfig(getSavedNavItems());
      setDisabledModules(getDisabledModules());
    };
    window.addEventListener('core_nav_config_changed', handleConfigChange);
    window.addEventListener('core_module_state_changed', handleConfigChange);
    return () => {
      window.removeEventListener('core_nav_config_changed', handleConfigChange);
      window.removeEventListener('core_module_state_changed', handleConfigChange);
    };
  }, []);

  const t = translations[lang];

  const getTranslatedLabel = (id: string, defaultLabel: string) => {
    switch (id) {
      case 'daily-blocks': return lang === 'ar' ? 'قوالب وفترات اليوم' : 'Daily Blocks';
      case 'habits': return t.habitTracker;
      case 'tasks': return t.taskTracker;
      case 'dashboard': return t.overview;
      case 'mentor': return t.aiMentor;
      case 'planner': return t.weeklyPlanner;
      case 'goals': return t.goalsTargets;
      case 'analytics': return t.analyticsTelemetry;
      case 'checklists': return t.checklistsSOPs;
      case 'projects': return t.projects;
      case 'notes': return t.brainDumpNotes;
      case 'comments': return lang === 'ar' ? 'التعليقات والإشارات' : 'Comments & Hub';
      case 'guide': return t.operatingGuide;
      case 'focus': return lang === 'ar' ? 'محطة التركيز' : 'Focus Station';
      case 'training': return lang === 'ar' ? 'محرك التدريب' : 'Training Engine';
      case 'sunday-reset': return lang === 'ar' ? 'إعادة ضبط الأحد' : 'Sunday Reset';
      case 'reflections': return lang === 'ar' ? 'التأملات والدروس' : 'Reflections & Journal';
      case 'archive': return lang === 'ar' ? 'الأرشيف والمحفوظات' : 'Archive Hub';
      default: return defaultLabel;
    }
  };

  const getIconForModule = (id: ModuleType) => {
    switch (id) {
      case 'daily-blocks': return Layers;
      case 'habits': return Flame;
      case 'tasks': return CheckSquare;
      case 'training': return Dumbbell;
      case 'dashboard': return LayoutDashboard;
      case 'focus': return Timer;
      case 'reflections': return BookOpen;
      case 'mentor': return Bot;
      case 'sunday-reset': return Sparkles;
      case 'planner': return CalendarDays;
      case 'goals': return Target;
      case 'analytics': return BarChart3;
      case 'checklists': return ListChecks;
      case 'projects': return FolderKanban;
      case 'notes': return StickyNote;
      case 'comments': return MessageSquare;
      case 'guide': return BookOpen;
      case 'archive': return Archive;
      default: return Grid;
    }
  };

  const getBadgeForModule = (id: ModuleType) => {
    switch (id) {
      case 'daily-blocks': return 'DAY';
      case 'training': return 'PRO';
      case 'comments': return '💬';
      case 'focus': return 'PC';
      case 'mentor': return 'AI';
      case 'sunday-reset': return 'Today';
      case 'planner': return '7d';
      case 'guide': return 'NEW';
      case 'archive': return 'ZIP';
      default: return null;
    }
  };

  // Group items by category and sort according to order, filtering out disabled modules
  const categorizedNavGroups = useMemo(() => {
    const visibleItems = navItemsConfig.filter(item => !item.hidden && !disabledModules.includes(item.id));
    const sortedCategories = [...navCategories].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Map categories with their assigned visible items
    const groups: { category: typeof navCategories[0]; items: typeof visibleItems }[] = [];

    sortedCategories.forEach(cat => {
      const itemsInCat = visibleItems
        .filter(item => item.category === cat.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (itemsInCat.length > 0) {
        groups.push({
          category: cat,
          items: itemsInCat
        });
      }
    });

    // Handle any items with unknown categories
    const knownCatIds = new Set(sortedCategories.map(c => c.id));
    const uncategorized = visibleItems
      .filter(item => !knownCatIds.has(item.category))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (uncategorized.length > 0) {
      groups.push({
        category: { id: 'other', nameEn: 'Other Apps', nameAr: 'تطبيقات أخرى', order: 999 },
        items: uncategorized
      });
    }

    return groups;
  }, [navCategories, navItemsConfig, disabledModules]);

  // Mobile Bottom Bar Tabs (Today, Daily Blocks, Tasks, Habits, Focus) filtered by active state
  const mobileCoreTabs = useMemo(() => {
    const tabs = [
      { id: 'dashboard' as ModuleType, label: lang === 'ar' ? 'اليوم' : 'Today', icon: LayoutDashboard },
      { id: 'daily-blocks' as ModuleType, label: lang === 'ar' ? 'الفترات' : 'Blocks', icon: Layers },
      { id: 'tasks' as ModuleType, label: lang === 'ar' ? 'المهام' : 'Tasks', icon: CheckSquare },
      { id: 'habits' as ModuleType, label: lang === 'ar' ? 'العادات' : 'Habits', icon: Flame },
      { id: 'focus' as ModuleType, label: lang === 'ar' ? 'التركيز' : 'Focus', icon: Timer },
    ];
    return tabs.filter(t => !disabledModules.includes(t.id));
  }, [lang, disabledModules]);

  const handleMobileNav = (id: ModuleType) => {
    setActiveModule(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const isMoreActive = !['dashboard', 'tasks', 'habits', 'focus'].includes(activeModule) && activeModule !== 'settings';

  return (
    <>
      {/* Desktop Sidebar (Collapsible: Small ~64px / Big ~240px) */}
      <aside
        id="desktop-sidebar"
        className={`hidden md:flex flex-col justify-between border-r border-[#EAE9E6] dark:border-[#2A2C33] bg-[#F7F6F3]/95 dark:bg-[#121316]/95 backdrop-blur-md transition-all duration-200 ease-in-out h-screen sticky top-0 z-30 select-none ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Top Header & Interactive Logo Toggle */}
        <div className="p-3 flex flex-col overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <button
            id="sidebar-logo-toggle-btn"
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              try {
                localStorage.setItem('sidebar_collapsed', String(next));
              } catch (e) {}
            }}
            className={`w-full flex items-center rounded-xl p-1 hover:bg-[#EAE9E6]/60 dark:hover:bg-[#1E2025] transition-all focus:outline-none cursor-pointer group active:scale-98 ${
              collapsed ? 'justify-center' : 'justify-start gap-2'
            }`}
            title={collapsed ? 'Click to expand sidebar' : 'Click to collapse sidebar'}
          >
            {!collapsed ? (
              <div className="flex items-center gap-2 py-0.5">
                <img
                  src={isDark ? '/assets/logo-full-dark.svg' : '/assets/logo-full.svg'}
                  alt="Core"
                  className="h-8 max-w-[140px] object-contain object-left transition-transform group-hover:scale-102"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center py-0.5">
                <img
                  src={isDark ? '/assets/logo-icon-dark.svg' : '/assets/logo-icon.svg'}
                  alt="Core"
                  className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
                />
              </div>
            )}
          </button>

          {/* Navigation Items Organized by Categories */}
          <nav className="mt-4 space-y-4">
            {categorizedNavGroups.map((group) => {
              const categoryTitle = lang === 'ar' ? group.category.nameAr : group.category.nameEn;
              return (
                <div key={group.category.id} className="space-y-1">
                  {!collapsed && (
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C8B88] dark:text-[#8E929B] flex items-center justify-between">
                      <span>{categoryTitle}</span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = getIconForModule(item.id);
                      const isActive = activeModule === item.id;
                      const label = getTranslatedLabel(item.id, lang === 'ar' ? item.labelAr : item.labelEn);
                      const badge = getBadgeForModule(item.id);

                      return (
                        <button
                          key={item.id}
                          id={`nav-item-${item.id}`}
                          onClick={() => setActiveModule(item.id)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                            isActive
                              ? 'bg-white dark:bg-[#1E2025] text-[#2F3437] dark:text-white shadow-2xs font-bold border border-[#EAE9E6] dark:border-[#34D399]/40'
                              : 'text-[#5A5955] dark:text-[#A0A4AE] hover:bg-[#EFEFEF] dark:hover:bg-[#1E2025]/60 hover:text-[#2F3437] dark:hover:text-white'
                          } ${collapsed ? 'justify-center px-0' : ''}`}
                          title={collapsed ? label : undefined}
                        >
                          <Icon
                            size={16}
                            className={`transition-colors shrink-0 ${
                              isActive ? 'text-[#34D399] dark:text-[#34D399]' : 'text-[#787774] dark:text-[#8E929B] group-hover:text-[#2D3136] dark:group-hover:text-white'
                            }`}
                          />
                          {!collapsed && (
                            <span className="truncate flex-1 text-start">{label}</span>
                          )}
                          {!collapsed && isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] shrink-0"></span>
                          )}
                          {!collapsed && !isActive && badge && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-200 dark:bg-[#2A2C33] text-neutral-600 dark:text-[#C5C8D0] font-mono font-bold">
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quick Tools */}
        <div className="p-3 border-t border-[#EAE9E6]/70 dark:border-[#2A2C33] space-y-2 bg-[#F7F6F3]/50 dark:bg-[#121316]/50">
          {!collapsed ? (
            <>
              {/* Quick Theme & Language row in sidebar */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#18191D] hover:bg-neutral-100 dark:hover:bg-[#1E2025] text-[#2F3437] dark:text-neutral-200 border border-[#EAE9E6] dark:border-[#2A2C33] text-[11px] font-bold transition-all cursor-pointer shadow-3xs"
                  title={isDark ? (lang === 'ar' ? 'تفعيل الوضع المضيء' : 'Switch to Light') : (lang === 'ar' ? 'تفعيل الوضع الداكن' : 'Switch to Dark')}
                >
                  {isDark ? (
                    <>
                      <Sun size={13} className="text-amber-500" />
                      <span>{lang === 'ar' ? 'مضيء' : 'Light'}</span>
                    </>
                  ) : (
                    <>
                      <Moon size={13} className="text-indigo-600" />
                      <span>{lang === 'ar' ? 'داكن' : 'Dark'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onToggleLanguage}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#18191D] hover:bg-neutral-100 dark:hover:bg-[#1E2025] text-[#2F3437] dark:text-neutral-200 border border-[#EAE9E6] dark:border-[#2A2C33] text-[11px] font-bold transition-all cursor-pointer shadow-3xs"
                  title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
                >
                  <Languages size={13} className="text-[#34D399]" />
                  <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
                </button>
              </div>

              <button
                id="btn-sidebar-settings"
                onClick={() => setActiveModule('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all group cursor-pointer ${
                  activeModule === 'settings'
                    ? 'bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-900'
                    : 'bg-white dark:bg-[#18191D] hover:bg-[#EFEFEF] dark:hover:bg-[#1E2025] hover:text-[#2F3437] dark:hover:text-white text-[#5A5955] dark:text-[#D1D5DB] border border-[#EAE9E6] dark:border-[#2A2C33]'
                }`}
              >
                <Settings
                  size={14}
                  className={`transition-colors shrink-0 ${
                    activeModule === 'settings' ? 'text-[#34D399]' : 'text-[#787774] dark:text-[#8E929B] group-hover:text-[#2D3136] dark:group-hover:text-white'
                  }`}
                />
                <span className="truncate flex-1 text-start">{lang === 'ar' ? 'الإعدادات وتخصيص التطبيقات' : 'Settings & Apps'}</span>
              </button>


              <div className="bg-white/80 dark:bg-[#18191D]/80 p-2 rounded-xl border border-[#EAE9E6] dark:border-[#2A2C33] shadow-2xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-semibold text-[#2F3437] dark:text-[#E5E7EB] flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                    {lang === 'ar' ? 'قاعدة البيانات حية' : 'Firestore Live'}
                  </span>
                  <span className="text-[8px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded">
                    {lang === 'ar' ? 'نشط' : 'Active'}
                  </span>
                </div>
                <button
                  id="btn-open-db-guide"
                  onClick={onOpenSetupGuide}
                  className="text-[9px] text-[#787774] dark:text-[#9CA3AF] font-medium flex items-center gap-1 hover:underline hover:text-[#2F3437] dark:hover:text-white cursor-pointer"
                >
                  <HelpCircle size={10} />
                  {lang === 'ar' ? 'دليل القواعد والمزامنة' : 'Rules & sync guide'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <button
                type="button"
                onClick={onToggleTheme}
                className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-[#1E2025] text-[#787774] dark:text-[#9CA3AF] hover:text-[#2F3437] dark:hover:text-white cursor-pointer"
                title={isDark ? (lang === 'ar' ? 'تفعيل الوضع المضيء' : 'Switch to Light') : (lang === 'ar' ? 'تفعيل الوضع الداكن' : 'Switch to Dark')}
              >
                {isDark ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} className="text-indigo-600" />}
              </button>
              <button
                id="btn-sidebar-settings-collapsed"
                onClick={() => setActiveModule('settings')}
                className={`w-full flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                  activeModule === 'settings'
                    ? 'bg-neutral-950 text-[#34D399] dark:bg-white dark:text-neutral-950'
                    : 'hover:bg-neutral-200 dark:hover:bg-[#1E2025] text-[#787774] dark:text-[#9CA3AF] hover:text-[#2F3437] dark:hover:text-white'
                }`}
                title={lang === 'ar' ? 'الإعدادات وتخصيص التطبيقات' : 'Settings & Apps'}
              >
                <Settings size={15} />
              </button>
              <button
                id="btn-open-db-guide-collapsed"
                onClick={onOpenSetupGuide}
                className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-[#1E2025] text-[#787774] dark:text-[#9CA3AF] hover:text-[#2F3437] dark:hover:text-white cursor-pointer"
                title={lang === 'ar' ? 'دليل إعداد قاعدة البيانات' : 'Database Setup Guide'}
              >
                <HelpCircle size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================
          TRUE NATIVE MOBILE BOTTOM APP BAR (3 TABS + MORE)
          ======================================================== */}
      <nav
        id="mobile-bottom-navbar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#121316]/95 backdrop-blur-xl border-t border-[#EAE9E6] dark:border-[#2A2C33] px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-around"
      >
        {mobileCoreTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => handleMobileNav(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 cursor-pointer ${
                isActive 
                  ? 'text-[#2D3136] dark:text-[#F3F4F6]' 
                  : 'text-[#8C8B88] dark:text-[#9CA3AF] hover:text-[#2D3136] dark:hover:text-[#F3F4F6]'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[#2D3136] text-[#34D399] dark:bg-[#1E2025] dark:text-[#34D399] dark:border dark:border-[#34D399]/40 shadow-xs scale-105' 
                    : 'text-[#8C8B88] dark:text-[#9CA3AF]'
                }`}
              >
                <Icon size={18} />
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive 
                    ? 'font-bold text-[#2D3136] dark:text-[#F3F4F6]' 
                    : 'font-medium text-[#787774] dark:text-[#9CA3AF]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Tab 4: "More" Menu Button */}
        <button
          id="mobile-nav-more"
          onClick={() => setMobileMenuOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 cursor-pointer ${
            isMoreActive 
              ? 'text-[#2D3136] dark:text-[#F3F4F6]' 
              : 'text-[#8C8B88] dark:text-[#9CA3AF] hover:text-[#2D3136] dark:hover:text-[#F3F4F6]'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all relative ${
              isMoreActive 
                ? 'bg-[#2D3136] text-[#34D399] dark:bg-[#1E2025] dark:text-[#34D399] dark:border dark:border-[#34D399]/40 shadow-xs scale-105' 
                : 'text-[#8C8B88] dark:text-[#9CA3AF]'
            }`}
          >
            <Grid size={18} />
            {isMoreActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#34D399] ring-2 ring-white dark:ring-[#18191D]"></span>
            )}
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight ${
              isMoreActive 
                ? 'font-bold text-[#2D3136] dark:text-[#F3F4F6]' 
                : 'font-medium text-[#787774] dark:text-[#9CA3AF]'
            }`}
          >
            {lang === 'ar' ? 'التطبيقات' : 'Apps'}
          </span>
        </button>
      </nav>

      {/* ========================================================
          NATIVE MOBILE ACTION SHEET DRAWER ("MORE" / APPS MENU)
          ======================================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18191D] rounded-t-3xl border-t border-[#EAE9E6] dark:border-[#2A2C33] shadow-2xl p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-5 animate-slideUp max-h-[88vh] overflow-y-auto">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-[#EAE9E6] dark:bg-[#2A2C33] rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE9E6] dark:border-[#2A2C33]">
              <div className="flex items-center gap-2">
                <img
                  src={isDark ? '/assets/logo-full-dark.svg' : '/assets/logo-full.svg'}
                  alt="Core"
                  className="h-8 max-w-[140px] object-contain object-left"
                />
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-[#262830] text-[#787774] dark:text-[#9CA3AF] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>


            {/* Dynamic Categorized Navigation in Mobile Drawer */}
            <div className="space-y-4">
              {categorizedNavGroups.map((group) => {
                const categoryTitle = lang === 'ar' ? group.category.nameAr : group.category.nameEn;
                return (
                  <div key={group.category.id} className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-[#787774] dark:text-[#9CA3AF] px-1 flex items-center gap-1.5">
                      <Folder size={12} className="text-[#34D399]" />
                      <span>{categoryTitle}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => {
                        const Icon = getIconForModule(item.id);
                        const isActive = activeModule === item.id;
                        const label = getTranslatedLabel(item.id, lang === 'ar' ? item.labelAr : item.labelEn);
                        const badge = getBadgeForModule(item.id);

                        return (
                          <button
                            key={item.id}
                            id={`mobile-drawer-${item.id}`}
                            onClick={() => handleMobileNav(item.id)}
                            className={`flex flex-col p-3 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
                              isActive
                                ? 'bg-[#2D3136] dark:bg-[#1E2025] text-white border-[#2D3136] dark:border-[#34D399]/40 shadow-md ring-1 ring-[#34D399]/30'
                                : 'bg-[#FBFBFA] dark:bg-[#1E2025] hover:bg-neutral-100 dark:hover:bg-[#262830] border-[#EAE9E6] dark:border-[#2A2C33] text-[#2D3136] dark:text-[#F3F4F6]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#34D399]/20 text-[#34D399]' : 'bg-[#EAE9E6]/60 dark:bg-[#2A2C33] text-[#2D3136] dark:text-[#34D399]'}`}>
                                <Icon size={16} />
                              </div>
                              {badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                  {badge}
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-xs truncate">{label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cloud & Data Actions */}
            <div className="space-y-2 pt-3 border-t border-[#EAE9E6] dark:border-[#2A2C33]">
              <div className="text-[11px] uppercase tracking-wider font-bold text-[#787774] dark:text-[#9CA3AF] px-1">
                {lang === 'ar' ? 'الإعدادات وتخصيص التطبيقات' : 'Settings & Customization'}
              </div>
              <div className="space-y-2">
                <button
                  id="mobile-drawer-settings"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleMobileNav('settings');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F7F6F3] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-semibold text-[#2D3136] dark:text-[#F3F4F6] active:bg-neutral-200 dark:active:bg-[#262830] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Settings size={15} className="text-[#34D399]" />
                    <span>{lang === 'ar' ? 'إدارة وترتيب وتصنيف التطبيقات' : 'Organize & Customize Apps'}</span>
                  </span>
                  <SlidersHorizontal size={13} className="text-[#787774]" />
                </button>

                <button
                  id="mobile-drawer-db-guide"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSetupGuide();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#F7F6F3] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] text-xs font-semibold text-[#2D3136] dark:text-[#F3F4F6] active:bg-neutral-200 dark:active:bg-[#262830] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-[#787774]" />
                    <span>{lang === 'ar' ? 'قواعد فايرستور والاتصال' : 'Firestore Rules & Connectivity'}</span>
                  </span>
                  <HelpCircle size={14} className="text-[#787774] dark:text-[#9CA3AF]" />
                </button>

                {!isInstalled && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (isInstallable) {
                        install();
                      } else {
                        setShowIOSGuide(true);
                      }
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs font-bold text-emerald-800 dark:text-emerald-300 active:scale-98 transition-all cursor-pointer shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{lang === 'ar' ? 'تثبيت التطبيق على الهاتف' : 'Install App on Phone'}</span>
                    </span>
                    <ChevronRight size={14} />
                  </button>
                )}

                {/* Quick Preferences Dashboard */}
                <div className="grid grid-cols-3 gap-2 pt-1.5">
                  <button
                    onClick={() => {
                      if (onToggleTheme) onToggleTheme();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#F7F6F3] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] text-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-[#262830] active:scale-95 transition-all text-[#2D3136] dark:text-[#F3F4F6]"
                  >
                    {isDark ? (
                      <>
                        <Sun size={15} className="text-amber-500 mb-1" />
                        <span className="text-[10px] font-bold">{lang === 'ar' ? 'نهاري' : 'Light'}</span>
                      </>
                    ) : (
                      <>
                        <Moon size={15} className="text-indigo-600 mb-1" />
                        <span className="text-[10px] font-bold">{lang === 'ar' ? 'ليلي' : 'Dark'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (onToggleLanguage) onToggleLanguage();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#F7F6F3] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] text-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-[#262830] active:scale-95 transition-all text-[#2D3136] dark:text-[#F3F4F6]"
                  >
                    <Languages size={15} className="text-[#34D399] mb-1" />
                    <span className="text-[10px] font-bold">{lang === 'ar' ? 'English' : 'عربي'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenExportModal) onOpenExportModal();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#F7F6F3] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] text-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-[#262830] active:scale-95 transition-all text-[#2D3136] dark:text-[#F3F4F6]"
                  >
                    <Download size={15} className="text-[#787774] mb-1" />
                    <span className="text-[10px] font-bold">{lang === 'ar' ? 'مزامنة' : 'Backup'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#18191D] border border-[#EAE9E6] dark:border-[#2A2C33] p-6 shadow-2xl space-y-4 text-center animate-scaleIn">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-lg">
              <Smartphone size={20} />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#2D3136] dark:text-white">
                {lang === 'ar' ? 'تثبيت التطبيق على جهازك' : 'Install Core on Your Device'}
              </h3>
              <p className="text-xs text-[#787774] dark:text-[#9CA3AF] leading-relaxed">
                {lang === 'ar' 
                  ? 'لتشغيل التطبيق كشاشة مستقلة كاملة على هاتفك (مثل التطبيقات الأصلية):' 
                  : 'Add Core to your home screen to use it as a standalone app with real-time sync:'}
              </p>
            </div>

            <div className="bg-[#FBFBFA] dark:bg-[#1E2025] rounded-2xl p-4 text-left space-y-2.5 text-xs text-[#2D3136] dark:text-[#F3F4F6] border border-[#EAE9E6] dark:border-[#2A2C33]">
              {lang === 'ar' ? (
                <div className="space-y-2 text-right">
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">١.</span>
                    <span>اضغط على زر <strong>المشاركة (Share)</strong> في شريط أدوات متصفح سفاري (سفاري هو الأفضل على الآيفون).</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">٢.</span>
                    <span>مرر للأسفل واضغط على خيار <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="flex items-start gap-2 col-span-2">
                    <span className="font-bold text-emerald-600">1.</span>
                    <span>Tap the <strong>Share</strong> icon in your browser toolbar (Safari is recommended on iOS).</span>
                  </p>
                  <p className="flex items-start gap-2 col-span-2">
                    <span className="font-bold text-emerald-600">2.</span>
                    <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#2D3136] dark:bg-[#F3F4F6] text-white dark:text-[#18191D] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'حسناً، فهمت' : 'Got it, close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
