import React from 'react';
import { CheckCircle2, AlertCircle, Trash2, Info, X, RotateCcw } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'delete';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-fadeIn ${
            toast.type === 'delete'
              ? 'bg-[#1E2224] text-white border-neutral-700/80 shadow-rose-950/20'
              : toast.type === 'error'
              ? 'bg-rose-950 text-white border-rose-800'
              : toast.type === 'info'
              ? 'bg-blue-950 text-white border-blue-800'
              : 'bg-[#1E2224] text-white border-neutral-700/80 shadow-emerald-950/20'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-medium min-w-0 flex-1">
            {toast.type === 'delete' && <Trash2 size={16} className="text-rose-400 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info size={16} className="text-blue-400 shrink-0" />}
            <span className="truncate">{toast.message}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              >
                <RotateCcw size={12} className="shrink-0" />
                <span>{toast.action.label}</span>
              </button>
            )}

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
