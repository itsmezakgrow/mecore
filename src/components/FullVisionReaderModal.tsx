import React, { useState, useEffect } from 'react';
import { X, BookOpen, Sun, Moon, Type, AlignLeft, Sparkles, Clock } from 'lucide-react';
import { VisualizationStory } from '../types';

interface FullVisionReaderModalProps {
  story: VisualizationStory | null;
  onClose: () => void;
  lang?: 'en' | 'ar';
}

export const FullVisionReaderModal: React.FC<FullVisionReaderModalProps> = ({
  story,
  onClose,
  lang = 'en'
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [themeMode, setThemeMode] = useState<'light' | 'charcoal' | 'pitch' | 'warm'>('light');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!story) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const totalHeight = target.scrollHeight - target.clientHeight;
    if (totalHeight > 0) {
      setScrollProgress((target.scrollTop / totalHeight) * 100);
    }
  };

  const wordCount = story.storyContent ? story.storyContent.trim().split(/\s+/).length : 0;
  const estReadTime = Math.max(1, Math.ceil(wordCount / 200));

  const fontClasses = {
    sm: 'text-base leading-relaxed',
    md: 'text-lg leading-relaxed',
    lg: 'text-xl leading-loose',
    xl: 'text-2xl leading-loose',
  }[fontSize];

  const themeClasses = {
    light: 'bg-[#faf9f5] text-neutral-900 border-neutral-200',
    charcoal: 'bg-[#121316] text-neutral-100',
    pitch: 'bg-black text-neutral-200',
    warm: 'bg-[#1a1816] text-[#e8ded2]',
  }[themeMode];

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex flex-col transition-colors duration-300 ${themeClasses}`}>
      {/* Top Reading Bar / Progress */}
      <div className="w-full h-1 bg-neutral-800/60 sticky top-0 left-0 z-20">
        <div
          className="h-full bg-emerald-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header controls */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-neutral-800/40 backdrop-blur-md bg-neutral-900/30 sticky top-1 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90 block">
              {lang === 'ar' ? 'نموذج التركيز العميق' : 'Focus Mode Reader'}
            </span>
            <span className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-neutral-500" />
              {estReadTime} {lang === 'ar' ? 'دقائق قراءة' : 'min read'} • {wordCount} {lang === 'ar' ? 'كلمة' : 'words'}
            </span>
          </div>
        </div>

        {/* Reader Customization Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme toggles */}
          <div className="flex items-center bg-neutral-800/60 p-1 rounded-lg border border-neutral-700/50">
            <button
              onClick={() => setThemeMode('light')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                themeMode === 'light' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Light Paper"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setThemeMode('charcoal')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                themeMode === 'charcoal' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Charcoal Grey"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setThemeMode('pitch')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                themeMode === 'pitch' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="OLED Pitch Black"
            >
              <span className="w-3.5 h-3.5 block rounded-full bg-neutral-900 border border-neutral-600" />
            </button>
            <button
              onClick={() => setThemeMode('warm')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                themeMode === 'warm' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Warm Sepia"
            >
              <span className="w-3.5 h-3.5 block rounded-full bg-[#d4a373]" />
            </button>
          </div>

          {/* Font Size toggles */}
          <div className="flex items-center bg-neutral-800/60 p-1 rounded-lg border border-neutral-700/50">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2 py-1 rounded text-xs font-semibold uppercase transition-colors ${
                  fontSize === size
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700/60 ml-2"
            title="Exit Focus Mode (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Focus Content Container */}
      <div
        className="flex-1 overflow-y-auto px-4 py-12 md:py-16 scroll-smooth"
        onScroll={handleScroll}
      >
        <article className="max-w-2xl mx-auto space-y-8 font-serif leading-relaxed">
          {/* Story Badge & Meta */}
          <div className="space-y-3 text-center border-b border-neutral-800/60 pb-8 font-sans">
            {story.theme && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {story.theme}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-sans">
              {story.title}
            </h1>
            <p className="text-sm text-neutral-400 font-sans">
              {lang === 'ar' ? 'قصة التجسيد والرؤية المستقبيلة' : 'Visualization & Future State Script'}
            </p>
          </div>

          {/* Story Content Blocks */}
          <div className={`space-y-6 ${fontClasses} whitespace-pre-wrap font-serif`}>
            {story.storyContent}
          </div>

          {/* Footer Reflection Prompt */}
          <div className="mt-16 pt-8 border-t border-neutral-800/60 text-center space-y-4 font-sans">
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              {lang === 'ar' ? 'تجسد في هذه الرؤية وتنسجم مع مشاعرك الحالية' : 'Embody this future state as present reality.'}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              {lang === 'ar' ? 'إغلاق والعودة للتطبيق' : 'Complete Visualization'}
            </button>
          </div>
        </article>
      </div>
    </div>
  );
};
