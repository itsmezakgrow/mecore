import React, { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, ChevronRight, ChevronLeft, Shuffle, Play, Pause, CheckCircle2, Flame, ShieldAlert, Award, RefreshCw } from 'lucide-react';
import { Affirmation } from '../types';

interface AffirmationsModalPopupProps {
  isOpen: boolean;
  onClose: () => void;
  affirmations: Affirmation[];
  lang?: 'en' | 'ar';
  titleEn?: string;
  titleAr?: string;
}

export const AffirmationsModalPopup: React.FC<AffirmationsModalPopupProps> = ({
  isOpen,
  onClose,
  affirmations,
  lang = 'en',
  titleEn = 'Daily Reprogramming & Affirmation Deck',
  titleAr = 'بطاقات التوكيدات اليومية وإعادة البرمجة الذهنية'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [timerProgress, setTimerProgress] = useState(0);
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());

  // Filter affirmations by category
  const filteredAffirmations = React.useMemo(() => {
    if (selectedCategory === 'all') return affirmations;
    return affirmations.filter(a => (a.category || 'Mindset').toLowerCase() === selectedCategory.toLowerCase());
  }, [affirmations, selectedCategory]);

  const totalCards = filteredAffirmations.length;
  const currentCard = filteredAffirmations[currentIndex] || filteredAffirmations[0];

  const handleNext = useCallback(() => {
    if (totalCards === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalCards);
    setTimerProgress(0);
  }, [totalCards]);

  const handlePrev = useCallback(() => {
    if (totalCards === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
    setTimerProgress(0);
  }, [totalCards]);

  const handleShuffle = () => {
    if (totalCards <= 1) return;
    const randomIndex = Math.floor(Math.random() * totalCards);
    setCurrentIndex(randomIndex);
    setTimerProgress(0);
  };

  const handleToggleComplete = (idx: number) => {
    setCompletedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Auto-play interval timer (7 seconds per card)
  useEffect(() => {
    if (!isAutoPlay || !isOpen || totalCards === 0) {
      setTimerProgress(0);
      return;
    }

    const duration = 7000; // 7s
    const step = 100;
    const interval = setInterval(() => {
      setTimerProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (step / duration) * 100;
      });
    }, step);

    return () => clearInterval(interval);
  }, [isAutoPlay, isOpen, totalCards, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen) return null;

  const categories = ['all', 'Mindset', 'Focus', 'Confidence', 'Abundance', 'Resilience', 'Health'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#18191D] border border-neutral-800 rounded-3xl shadow-2xl shadow-emerald-950/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Glow & Progress Line */}
        <div className="h-1.5 w-full bg-neutral-800 relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
            style={{ width: `${totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0}%` }}
          />
        </div>

        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {lang === 'ar' ? titleAr : titleEn}
              </h2>
              <p className="text-xs text-neutral-400">
                {lang === 'ar' ? 'إعادة تشكيل المعتقدات وتثبيت التفكير الإيجابي' : 'Cognitive reprogramming & daily identity alignment'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors border border-neutral-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Categories Bar */}
        <div className="px-6 py-3 border-b border-neutral-800/60 bg-neutral-900/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 border border-neutral-700/40'
              }`}
            >
              {cat === 'all' ? (lang === 'ar' ? 'الكل' : 'All Decks') : cat}
            </button>
          ))}
        </div>

        {/* Main Flashcard Body */}
        <div className="p-8 md:p-12 flex-1 flex flex-col items-center justify-center text-center relative min-h-[280px]">
          {totalCards === 0 ? (
            <div className="space-y-4 text-center max-w-sm">
              <ShieldAlert className="w-12 h-12 text-amber-400/80 mx-auto" />
              <p className="text-neutral-300 text-sm">
                {lang === 'ar' ? 'لا توجد توكيدات في هذه الفئة حالياً. أضف توكيدات جديدة من دفتر التفكير!' : 'No affirmations available in this deck yet. Add new ones from your Mindset & Reflections journal!'}
              </p>
            </div>
          ) : (
            <div className="w-full space-y-6 animate-fade-in key={currentIndex}">
              {/* Category & Source Tag */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  {currentCard.category || 'Mindset Alignment'}
                </span>
                {currentCard.sourceBlockTitle && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                    {lang === 'ar' ? 'مستخرجة من:' : 'Reframing:'} {currentCard.sourceBlockTitle}
                  </span>
                )}
              </div>

              {/* Main Statement Quote */}
              <blockquote className="text-2xl md:text-3xl font-extrabold text-white leading-relaxed tracking-tight max-w-xl mx-auto drop-shadow-md">
                "{currentCard.statement}"
              </blockquote>

              {/* Internalize Action */}
              <div className="pt-2">
                <button
                  onClick={() => handleToggleComplete(currentIndex)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    completedSet.has(currentIndex)
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : 'bg-neutral-800/80 text-neutral-400 hover:text-white border border-neutral-700/60'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${completedSet.has(currentIndex) ? 'text-emerald-400 fill-emerald-400/20' : ''}`} />
                  {completedSet.has(currentIndex)
                    ? (lang === 'ar' ? 'تم استيعاب التوكيد اليوم' : 'Internalized & Believed')
                    : (lang === 'ar' ? 'انقر لتثبيت المعتقد' : 'Internalize Statement')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer & Navigation Controls */}
        <footer className="px-6 py-4 bg-neutral-900/60 border-t border-neutral-800/80 flex items-center justify-between">
          {/* Card Count & AutoPlay Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-neutral-400 bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/50">
              {totalCards > 0 ? `${currentIndex + 1} / ${totalCards}` : '0 / 0'}
            </span>

            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                isAutoPlay
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white border-neutral-700/50'
              }`}
              title={isAutoPlay ? 'Pause Auto-Advance' : 'Play Auto-Advance (7s)'}
            >
              {isAutoPlay ? <Pause className="w-4 h-4 text-emerald-400" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isAutoPlay ? (lang === 'ar' ? 'إيقاف التلقائي' : 'Auto Playing') : (lang === 'ar' ? 'تشغيل تلقائي' : 'Auto Play')}
              </span>
            </button>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              disabled={totalCards <= 1}
              className="p-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 hover:text-white transition-colors border border-neutral-700/50"
              title="Shuffle Cards"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrev}
              disabled={totalCards <= 1}
              className="p-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 hover:text-white transition-colors border border-neutral-700/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              disabled={totalCards <= 1}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>{lang === 'ar' ? 'التالي' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
