import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  CheckSquare, 
  Flame, 
  CalendarDays, 
  StickyNote, 
  ListChecks, 
  FolderKanban,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ModuleType } from '../types';

interface MobileQuickFabProps {
  onAddTask: (task: { title: string; priority: 'High' | 'Medium' | 'Low'; dueDate?: string }) => Promise<any>;
  onAddHabit: (habit: { name: string; targetFrequency: string }) => Promise<any>;
  onAddNote: (note: { title: string; content: string; category: 'note' | 'reminder' | 'idea' }) => Promise<any>;
  onNavigateModule: (module: ModuleType) => void;
  onAddPlannerSlot?: (slot: { dayIndex: number; title: string; timeSlot: string; type: 'deep-work' | 'meeting' | 'health' | 'admin' }) => Promise<any>;
}

export const MobileQuickFab: React.FC<MobileQuickFabProps> = ({
  onAddTask,
  onAddHabit,
  onAddNote,
  onNavigateModule,
  onAddPlannerSlot,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'menu' | 'task' | 'note' | 'habit' | 'plan'>('menu');
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [category, setCategory] = useState<'note' | 'reminder' | 'idea'>('note');
  const [planType, setPlanType] = useState<'deep-work' | 'meeting' | 'health' | 'admin'>('deep-work');
  const [planTime, setPlanTime] = useState('09:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    setActiveForm('menu');
    setInputText('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSubmitting(true);
    try {
      if (activeForm === 'task') {
        await onAddTask({
          title: inputText.trim(),
          priority,
          dueDate: new Date().toISOString().split('T')[0],
        });
      } else if (activeForm === 'note') {
        await onAddNote({
          title: inputText.trim().slice(0, 40),
          content: inputText.trim(),
          category,
        });
      } else if (activeForm === 'habit') {
        await onAddHabit({
          name: inputText.trim(),
          targetFrequency: 'daily',
        });
      } else if (activeForm === 'plan' && onAddPlannerSlot) {
        const currentJsDay = new Date().getDay();
        const mondayBased = currentJsDay === 0 ? 6 : currentJsDay - 1;
        await onAddPlannerSlot({
          dayIndex: mondayBased,
          title: inputText.trim(),
          timeSlot: planTime,
          type: planType,
        });
      }
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (Mobile Only) */}
      <button
        id="mobile-quick-fab-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`md:hidden fixed bottom-20 right-4 z-40 w-13 h-13 rounded-full bg-[#2F3437] text-white shadow-xl flex items-center justify-center transition-all duration-300 active:scale-95 border-2 border-white focus:outline-none ${
          isOpen ? 'rotate-45 bg-rose-600' : 'hover:bg-black'
        }`}
        aria-label="Quick Action"
      >
        <Plus size={24} />
      </button>

      {/* Mobile Bottom Sheet Modal */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={handleClose}
          />

          {/* Drawer Sheet */}
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl border-t border-[#EAE9E6] shadow-2xl p-5 pb-8 space-y-4 animate-slideUp max-h-[85vh] overflow-y-auto">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-[#EAE9E6] rounded-full mx-auto" />

            {activeForm === 'menu' ? (
              <>
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h3 className="text-base font-bold text-[#2F3437]">
                      Quick Capture & Actions
                    </h3>
                    <p className="text-xs text-[#787774]">
                      Add instantly without leaving your current screen.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-full hover:bg-neutral-100 text-[#787774]"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Quick Action Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => setActiveForm('task')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 active:bg-neutral-100 border border-[#EAE9E6] text-left transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <CheckSquare size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2F3437]">New Task</div>
                      <div className="text-[10px] text-[#787774]">Add to today</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveForm('habit')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 active:bg-neutral-100 border border-[#EAE9E6] text-left transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Flame size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2F3437]">New Habit</div>
                      <div className="text-[10px] text-[#787774]">Build streak</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveForm('note')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 active:bg-neutral-100 border border-[#EAE9E6] text-left transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <StickyNote size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2F3437]">Brain Dump</div>
                      <div className="text-[10px] text-[#787774]">Quick note</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveForm('plan')}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 active:bg-neutral-100 border border-[#EAE9E6] text-left transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2F3437]">Time Block</div>
                      <div className="text-[10px] text-[#787774]">Plan today</div>
                    </div>
                  </button>
                </div>

                {/* Direct Jump Links */}
                <div className="pt-2 border-t border-[#EAE9E6] space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[#787774] px-1">
                    Jump to Module
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      onClick={() => {
                        onNavigateModule('checklists');
                        handleClose();
                      }}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-medium text-[#2F3437] flex items-center gap-1.5 shrink-0"
                    >
                      <ListChecks size={13} className="text-indigo-600" />
                      Checklists
                    </button>
                    <button
                      onClick={() => {
                        onNavigateModule('projects');
                        handleClose();
                      }}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-medium text-[#2F3437] flex items-center gap-1.5 shrink-0"
                    >
                      <FolderKanban size={13} className="text-emerald-600" />
                      Projects
                    </button>
                    <button
                      onClick={() => {
                        onNavigateModule('guide');
                        handleClose();
                      }}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-medium text-[#2F3437] flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles size={13} className="text-amber-600" />
                      Operating Guide
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Inline Form Mode */
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveForm('menu')}
                      className="text-xs text-[#787774] font-medium hover:underline flex items-center gap-0.5"
                    >
                      ← Back
                    </button>
                    <span className="text-sm font-bold text-[#2F3437] capitalize">
                      Add {activeForm === 'plan' ? 'Time Block' : activeForm}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-neutral-100 text-[#787774]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <input
                  type="text"
                  autoFocus
                  required
                  placeholder={
                    activeForm === 'task' 
                      ? 'What needs to be done?' 
                      : activeForm === 'habit'
                      ? 'e.g. Read 20 pages, 30m Workout...'
                      : activeForm === 'note'
                      ? 'Type brain dump idea or memo...'
                      : 'e.g. Deep Work: Code Architecture...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full text-sm bg-neutral-50 border border-[#EAE9E6] focus:border-[#2F3437] focus:bg-white rounded-xl px-3.5 py-3 outline-none"
                />

                {/* Form-specific Options */}
                {activeForm === 'task' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#787774]">Priority:</span>
                    {(['High', 'Medium', 'Low'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                          priority === p
                            ? 'bg-[#2F3437] text-white border-[#2F3437]'
                            : 'bg-white text-[#787774] border-[#EAE9E6]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {activeForm === 'note' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#787774]">Type:</span>
                    {(['note', 'reminder', 'idea'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border capitalize transition-all ${
                          category === c
                            ? 'bg-[#2F3437] text-white border-[#2F3437]'
                            : 'bg-white text-[#787774] border-[#EAE9E6]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {activeForm === 'plan' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#787774]">Time:</span>
                      <input
                        type="text"
                        value={planTime}
                        onChange={(e) => setPlanTime(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-[#EAE9E6] rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {(['deep-work', 'meeting', 'health', 'admin'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPlanType(t)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold capitalize whitespace-nowrap ${
                            planType === t
                              ? 'bg-[#2F3437] text-white border-[#2F3437]'
                              : 'bg-white text-[#787774] border-[#EAE9E6]'
                          }`}
                        >
                          {t.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !inputText.trim()}
                  className="w-full py-3 bg-[#2F3437] hover:bg-black text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Cloud OS'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
