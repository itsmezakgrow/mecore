import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Search, X } from 'lucide-react';

interface EmojiPickerProps {
  selectedEmoji?: string;
  onSelectEmoji: (emoji: string) => void;
  lang?: 'en' | 'ar';
}

const QUICK_SHORTCUTS = ['🔥', '💧', '📚', '🏋️', '🧘', '💻', '☕', '🎯', '✨', '🏃'];

const EMOJI_CATEGORIES: { nameEn: string; nameAr: string; emojis: string[] }[] = [
  {
    nameEn: 'Health & Body',
    nameAr: 'الصحة والجسم',
    emojis: ['💧', '🥗', '🏋️', '🏃', '🧘', '🚶', '🚴', '🏊', '💊', '🛌', '🍎', '🍵', '🥑', '🥦', '🥊', '🥋']
  },
  {
    nameEn: 'Mind & Growth',
    nameAr: 'العقل والتعلم',
    emojis: ['📚', '✍️', '🧠', '🎯', '🎨', '🎸', '💻', '💡', '📖', '📝', '🎧', '🔬', '🎓', '🧩', '🗣️', '🔍']
  },
  {
    nameEn: 'Daily Life & Routine',
    nameAr: 'الحياة اليومية والروتين',
    emojis: ['☀️', '🌙', '🍳', '🧹', '🌿', '🌱', '🚿', '🧺', '🐕', '☕', '🕯️', '🪴', '🌅', '🌌', '🧘‍♂️', '🛏️']
  },
  {
    nameEn: 'Productivity & Work',
    nameAr: 'الإنتاجية والعمل',
    emojis: ['💼', '💰', '📊', '🚀', '🔥', '⚡', '⏳', '🏆', '💎', '🔑', '📈', '🤝', '📅', '📌', '🎯', '⭐']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  selectedEmoji = '🔥',
  onSelectEmoji,
  lang = 'en'
}) => {
  const isAr = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCategories = search.trim()
    ? EMOJI_CATEGORIES.map(cat => ({
        ...cat,
        emojis: cat.emojis.filter(e => e.includes(search.trim()))
      })).filter(cat => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  return (
    <div className="space-y-1.5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          {isAr ? 'أيقونة / إيموجي العادة' : 'Habit Icon / Emoji'}
        </label>
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
          {isAr ? 'انقر للاختيار أو التغيير' : 'Tap to select or change'}
        </span>
      </div>

      {/* Compact Selector Bar */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap p-1.5 bg-neutral-50 dark:bg-[#1E2025] rounded-xl border border-neutral-200 dark:border-neutral-800">
        {/* Selected Emoji Badge & Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#18191D] border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-800 dark:text-white shadow-2xs hover:border-amber-500 transition-all cursor-pointer shrink-0"
          title={isAr ? 'تغيير الإيموجي' : 'Change Emoji'}
        >
          <span className="text-base">{selectedEmoji || '🔥'}</span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>

        {/* Quick Shortcut Strip */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 flex-1">
          {QUICK_SHORTCUTS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelectEmoji(emoji)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-transform hover:scale-115 active:scale-95 cursor-pointer shrink-0 ${
                selectedEmoji === emoji
                  ? 'bg-amber-100 dark:bg-amber-950 border border-amber-500 scale-105 shadow-3xs'
                  : 'hover:bg-white dark:hover:bg-neutral-800'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Browse Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          {isOpen ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'المزيد...' : 'More...')}
        </button>
      </div>

      {/* Expandable Popover / Drawer (Only when opened) */}
      {isOpen && (
        <div className="p-3 bg-white dark:bg-[#18191D] rounded-2xl border border-amber-200 dark:border-neutral-700 shadow-lg space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-neutral-800 dark:text-white">
              {isAr ? 'اختر أيقونة للعادة:' : 'Pick a Habit Icon:'}
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                maxLength={4}
                value={selectedEmoji}
                onChange={(e) => onSelectEmoji(e.target.value)}
                placeholder="✍️"
                className="w-12 text-center text-xs py-1 px-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                title={isAr ? 'اكتب أو الصق أي إيموجي' : 'Type or paste any custom emoji'}
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 overscroll-contain">
            {filteredCategories.map((cat) => (
              <div key={cat.nameEn} className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  {isAr ? cat.nameAr : cat.nameEn}
                </span>
                <div className="flex flex-wrap gap-1">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onSelectEmoji(emoji);
                        setIsOpen(false);
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-transform hover:scale-120 cursor-pointer ${
                        selectedEmoji === emoji
                          ? 'bg-amber-100 dark:bg-amber-950 border border-amber-500 shadow-2xs'
                          : 'bg-neutral-50 dark:bg-neutral-800 hover:bg-amber-50 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
