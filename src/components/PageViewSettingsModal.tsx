import React from 'react';
import { Sliders, X, RotateCcw, Check, Eye, EyeOff } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export interface PageViewSettingItem {
  id: string;
  label: string;
  labelAr?: string;
  labelEn?: string;
  description?: string;
  descAr?: string;
  descEn?: string;
  icon?: React.ReactNode;
}

interface PageViewSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle?: string;
  pageTitleAr?: string;
  pageTitleEn?: string;
  items: PageViewSettingItem[];
  isVisible?: ((id: string) => boolean) | Record<string, boolean>;
  isSectionVisible?: ((id: string) => boolean) | Record<string, boolean>;
  settings?: Record<string, boolean>;
  onToggle: (id: string) => void;
  onReset: () => void;
  lang?: 'en' | 'ar';
}

export const PageViewSettingsModal: React.FC<PageViewSettingsModalProps> = ({
  isOpen,
  onClose,
  pageTitle,
  pageTitleAr,
  pageTitleEn,
  items,
  isVisible,
  isSectionVisible,
  settings,
  onToggle,
  onReset,
  lang = 'ar',
}) => {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const checkItemVisible = (id: string): boolean => {
    // 1. Try isSectionVisible function
    if (typeof isSectionVisible === 'function') {
      try {
        return Boolean(isSectionVisible(id));
      } catch {
        // fallback
      }
    }
    // 2. Try isSectionVisible object
    if (isSectionVisible && typeof isSectionVisible === 'object') {
      return (isSectionVisible as Record<string, boolean>)[id] !== false;
    }
    // 3. Try isVisible function
    if (typeof isVisible === 'function') {
      try {
        return Boolean(isVisible(id));
      } catch {
        // fallback
      }
    }
    // 4. Try isVisible object
    if (isVisible && typeof isVisible === 'object') {
      return (isVisible as Record<string, boolean>)[id] !== false;
    }
    // 5. Try settings object
    if (settings && typeof settings === 'object') {
      return settings[id] !== false;
    }
    return true;
  };

  const visibleCount = items.filter((item) => checkItemVisible(item.id)).length;

  const displayTitle = pageTitle || (isAr ? (pageTitleAr || 'الصفحة') : (pageTitleEn || 'Page View'));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#181A20] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                  {pageTitle ? pageTitle : (isAr ? `تخصيص عرض ${displayTitle}` : `Customize ${displayTitle} View`)}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                  {visibleCount}/{items.length} {isAr ? 'ظاهر' : 'visible'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {isAr
                  ? 'اختر الأقسام التي ترغب في إظهارها أو إخفائها لتبسيط واجهتك حسب استخدامك.'
                  : 'Toggle sections on or off to declutter and tailor this page to your workflow.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Settings Switcher Items */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 overscroll-contain">
          {items.map((item) => {
            const isItemVisible = checkItemVisible(item.id);
            const labelText = item.label || (isAr ? (item.labelAr || item.id) : (item.labelEn || item.id));
            const descText = item.description || (isAr ? item.descAr : item.descEn);

            return (
              <div
                key={item.id}
                onClick={() => onToggle(item.id)}
                className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  isItemVisible
                    ? 'bg-neutral-50/70 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40'
                    : 'bg-neutral-100/40 dark:bg-neutral-950/40 border-dashed border-neutral-300 dark:border-neutral-800 opacity-60 hover:opacity-85'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.icon && (
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isItemVisible
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {labelText}
                      </span>
                      {isItemVisible ? (
                        <Eye size={12} className="text-emerald-500 shrink-0" />
                      ) : (
                        <EyeOff size={12} className="text-neutral-400 shrink-0" />
                      )}
                    </div>
                    {descText && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                        {descText}
                      </p>
                    )}
                  </div>
                </div>

                {/* iOS-Style Toggle Switch */}
                <div className="shrink-0 pl-1 rtl:pl-0 rtl:pr-1">
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                      isItemVisible
                        ? 'bg-emerald-600'
                        : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out mt-0.5 ${
                        isItemVisible
                          ? (isAr ? '-translate-x-5' : 'translate-x-5')
                          : (isAr ? '-translate-x-0.5' : 'translate-x-0.5')
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-neutral-50/80 dark:bg-[#14161B] border-t border-neutral-200/80 dark:border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>{isAr ? 'إعادة ضبط للافتراضي' : 'Reset Defaults'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all shadow-xs cursor-pointer"
          >
            <Check size={14} />
            <span>{isAr ? 'تم وحفظ' : 'Done & Apply'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
