import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Database,
  CheckCircle2,
  X
} from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  useBodyScrollLock(isOpen);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const firestoreRulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read & write for Life & Business OS collections
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-[#18191D] rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#EAE9E6] dark:border-[#2A2C33] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header */}
        <div className="flex items-center justify-between border-b border-[#EAE9E6] dark:border-[#2A2C33] p-4 sm:p-6 bg-white dark:bg-[#151619] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#2F3437] dark:text-white leading-tight">
                Firebase Firestore Setup & Sync Guide
              </h3>
              <p className="text-[11px] sm:text-xs text-[#787774] dark:text-neutral-400">
                Step-by-step instructions for real-time mobile and desktop synchronization.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#787774] dark:text-neutral-400 hover:text-[#2F3437] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#262830] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs overscroll-contain bg-white dark:bg-[#18191D]">
          {/* Sync Status Banner */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800 flex items-start gap-3">
            <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <strong>Database is Provisioned & Live:</strong> This application has already initialized Firestore (Project ID: <code className="font-mono bg-emerald-100/90 dark:bg-emerald-900/80 px-1.5 py-0.5 rounded font-bold text-[11px]">{projectId || 'Active'}</code>). Any task, habit, or note created here syncs instantly to your mobile browser when accessing the same URL.
            </div>
          </div>

          {/* Step 1 */}
          <div className="p-4 rounded-xl sm:rounded-2xl bg-[#FBFBFA] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#2F3437] dark:text-white">
              <span className="w-5 h-5 rounded-full bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[10px]">1</span>
              <span>Create or Open your Firebase Project</span>
            </div>
            <p className="text-[#787774] dark:text-neutral-400 leading-relaxed pl-7">
              Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-medium">Firebase Console</a>, create a project (e.g. <em>Life-Business-OS</em>), and click <strong>Build &rarr; Firestore Database</strong>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl sm:rounded-2xl bg-[#FBFBFA] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#2F3437] dark:text-white">
                <span className="w-5 h-5 rounded-full bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[10px]">2</span>
                <span>Firestore Security Rules (Real-time Cross Device Access)</span>
              </div>
              <button
                onClick={() => copyToClipboard(firestoreRulesText, 'rules')}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#2F3437] dark:text-neutral-300 hover:underline cursor-pointer"
              >
                {copiedSection === 'rules' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check size={12} /> Copied</span>
                ) : (
                  <span className="flex items-center gap-1"><Copy size={12} /> Copy Rules</span>
                )}
              </button>
            </div>
            <p className="text-[#787774] dark:text-neutral-400 pl-7">
              Under <strong>Firestore Database &rarr; Rules</strong>, paste the rule below and click <strong>Publish</strong>:
            </p>
            <pre className="mt-2 ml-7 p-3 bg-neutral-900 text-neutral-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
              {firestoreRulesText}
            </pre>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl sm:rounded-2xl bg-[#FBFBFA] dark:bg-[#1E2025] border border-[#EAE9E6] dark:border-[#2A2C33] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#2F3437] dark:text-white">
              <span className="w-5 h-5 rounded-full bg-[#2F3437] dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-[10px]">3</span>
              <span>Syncing on your Mobile Device (Seamless PWA/Web Experience)</span>
            </div>
            <div className="pl-7 space-y-2 text-[#787774] dark:text-neutral-400">
              <p className="flex items-center gap-2">
                <Smartphone size={14} className="text-[#2F3437] dark:text-white shrink-0" />
                <span><strong>On iOS / Safari:</strong> Open your app link, tap <em>Share &rarr; Add to Home Screen</em> to launch as a standalone app.</span>
              </p>
              <p className="flex items-center gap-2">
                <Monitor size={14} className="text-[#2F3437] dark:text-white shrink-0" />
                <span><strong>On Android / Chrome:</strong> Tap the 3 dots menu &rarr; <em>Install App</em> or <em>Add to Home screen</em>.</span>
              </p>
              <p className="text-[11px] text-[#5A5955] dark:text-neutral-500">
                Firestore automatically caches changes offline and syncs immediately when an internet connection is established.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#151619] border-t border-[#EAE9E6] dark:border-[#2A2C33] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#787774] dark:text-neutral-400">
            Powered by Firebase Firestore v9 Modular SDK
          </span>
          <button
            onClick={onClose}
            className="bg-[#2F3437] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Done & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
