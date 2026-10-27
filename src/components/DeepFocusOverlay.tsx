import React from 'react';
import {
  Timer,
  Play,
  Pause,
  Square,
  Headphones,
  Maximize2,
  Minimize2,
  Volume2,
  Compass,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';

interface DeepFocusOverlayProps {
  isOpen: boolean;
  timeRemaining: number;
  isActive: boolean;
  target: { id?: string; type: 'task' | 'plan' | 'custom'; title: string } | null;
  ambientAudio: 'none' | 'lofi' | 'white-noise';
  lang: 'en' | 'ar';
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onMinimize: () => void;
  onToggleAmbient: (type: 'none' | 'lofi' | 'white-noise') => void;
}

export const DeepFocusOverlay: React.FC<DeepFocusOverlayProps> = ({
  isOpen,
  timeRemaining,
  isActive,
  target,
  ambientAudio,
  lang,
  onPause,
  onResume,
  onStop,
  onMinimize,
  onToggleAmbient,
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progressPercent = ((25 * 60 - timeRemaining) / (25 * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#121314] text-white flex flex-col justify-between p-6 sm:p-12 animate-fadeIn font-sans selection:bg-neutral-800">
      {/* Top Banner / Minimize button */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#34D399] animate-ping" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#34D399]">
            {isAr ? 'منطقة التركيز الفائق نشطة' : 'Deep Focus Area Active'}
          </span>
        </div>

        <button
          onClick={onMinimize}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
          title={isAr ? 'تصغير (إبقاء الجلسة جارية بالخلفية)' : 'Minimize (Keep session running in background)'}
        >
          <Minimize2 size={14} />
          <span>{isAr ? 'تصغير' : 'Minimize'}</span>
        </button>
      </div>

      {/* Centered Timer Dial Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full space-y-8 py-8">
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
          {/* Circular progress svg */}
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="46%"
              stroke="#1C1E1F"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r="46%"
              stroke="#34D399"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="289%"
              strokeDashoffset={`${289 - (289 * progressPercent) / 100}%`}
              className="transition-all duration-1000 ease-linear"
              strokeLinecap="round"
            />
          </svg>

          {/* Time display */}
          <div className="flex flex-col items-center justify-center space-y-1 z-10">
            <div className="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-white tabular-nums select-all">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">
              {isActive ? (isAr ? 'جري التركيز' : 'Focusing') : (isAr ? 'مؤقت معلق' : 'Paused')}
            </div>
          </div>
        </div>

        {/* Focus Target Description card */}
        <div className="text-center space-y-2 w-full px-4">
          <div className="text-[11px] uppercase tracking-wider font-bold text-neutral-500">
            {isAr ? 'المرساة المعرفية النشطة' : 'Active Cognitive Anchor'}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white max-w-md mx-auto line-clamp-2">
            {target ? target.title : (isAr ? 'جلسة تفكير وحل مشكلات عامة' : 'Unstructured focus sprint')}
          </h2>
          {target?.type && (
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 capitalize">
              {target.type === 'task' ? (isAr ? 'مهمة منجزة في قائمة المهام' : 'Linked Task') : target.type === 'plan' ? (isAr ? 'فترة من المخطط الأسبوعي' : 'Linked Schedule Block') : (isAr ? 'مستهدف مخصص' : 'Custom Target')}
            </span>
          )}
        </div>

        {/* Ambient Sound Controller */}
        <div className="bg-neutral-950/40 p-4 rounded-2xl border border-neutral-900 w-full max-w-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Headphones size={13} className="text-[#34D399]" />
              {isAr ? 'المؤثرات الصوتية المهدئة' : 'Focus Ambient Audio'}
            </span>
            <span className="font-mono text-[10px] font-bold text-[#34D399] uppercase bg-[#34D399]/10 px-1.5 py-0.2 rounded">
              {ambientAudio === 'none' ? (isAr ? 'صامت' : 'None') : ambientAudio === 'lofi' ? (isAr ? 'ترددات لوفاي' : 'Binaural Lo-Fi') : (isAr ? 'ضوضاء بيضاء' : 'White Noise')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'none' as const, label: isAr ? 'صامت' : 'None' },
              { id: 'white-noise' as const, label: isAr ? 'ضوضاء بيضاء' : 'White Noise' },
              { id: 'lofi' as const, label: isAr ? 'ألفا لوفاي' : 'Alpha Lo-Fi' },
            ].map((sound) => {
              const isSelected = ambientAudio === sound.id;
              return (
                <button
                  key={sound.id}
                  onClick={() => onToggleAmbient(sound.id)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#34D399] text-black border-[#34D399] shadow-sm font-black'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800/60'
                  }`}
                >
                  {sound.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Master Controls Block */}
        <div className="flex items-center gap-4 pt-2">
          {isActive ? (
            <button
              onClick={onPause}
              className="w-14 h-14 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg cursor-pointer"
              title={isAr ? 'إيقاف مؤقت' : 'Pause'}
            >
              <Pause size={20} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={onResume}
              className="w-14 h-14 rounded-full bg-[#34D399] text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg cursor-pointer"
              title={isAr ? 'استئناف' : 'Resume'}
            >
              <Play size={20} fill="currentColor" className="ml-1" />
            </button>
          )}

          <button
            onClick={onStop}
            className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 text-rose-500 hover:text-rose-400 hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer"
            title={isAr ? 'إعادة تعيين وإنهاء' : 'Terminate & Reset'}
          >
            <Square size={16} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Footer Zen Quote / Tip */}
      <div className="w-full max-w-md mx-auto text-center pt-4 border-t border-neutral-900/40">
        <p className="text-[11px] text-neutral-600 leading-relaxed font-medium">
          {isAr
            ? '«لا تتنقل بين النوافذ والمهام. التركيز ليس فقط إنجاز المهام، بل هو إخضاع عقلك لهدف واحد فقط.»'
            : '“The successful warrior is the average man, with laser-like focus.” — Bruce Lee'}
        </p>
      </div>
    </div>
  );
};
