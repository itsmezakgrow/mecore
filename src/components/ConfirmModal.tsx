import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  lang?: 'en' | 'ar';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel,
  isDestructive = true,
  isDanger,
  onConfirm,
  onCancel,
  onClose,
  lang,
}) => {
  useBodyScrollLock(isOpen);
  const isRtl = typeof document !== 'undefined' ? (lang === 'ar' || document.documentElement.dir === 'rtl') : false;
  const isReallyDestructive = isDanger !== undefined ? isDanger : isDestructive;
  const handleDismiss = () => {
    if (typeof onCancel === 'function') {
      onCancel();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };
  const resolvedCancelLabel = cancelLabel || (isRtl ? 'إلغاء' : 'Cancel');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={handleDismiss}
    >
      <div 
        className={`bg-white dark:bg-[#18191D] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EAE9E6] dark:border-[#2A2C33] space-y-4 my-auto animate-scaleUp ${isRtl ? 'text-right' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-start gap-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${isReallyDestructive ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400' : 'bg-neutral-100 dark:bg-[#262830] text-[#2F3437] dark:text-neutral-200'}`}>
            {isReallyDestructive ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#2F3437] dark:text-white leading-snug">
              {title}
            </h3>
            <p className="text-xs text-[#787774] dark:text-neutral-400 mt-1.5 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-neutral-400 hover:text-[#2F3437] dark:hover:text-white p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#262830] transition-colors shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className={`pt-3 flex items-center gap-2.5 border-t border-[#EAE9E6] dark:border-[#2A2C33] ${isRtl ? 'flex-row-reverse justify-start' : 'justify-end'}`}>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#787774] dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#262830] hover:text-[#2F3437] dark:hover:text-white transition-colors cursor-pointer"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              handleDismiss();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isReallyDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#2F3437] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
