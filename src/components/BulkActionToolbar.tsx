import React from 'react';
import { 
  CheckSquare, 
  Trash2, 
  Edit3, 
  Download, 
  Flame, 
  X, 
  CheckCheck, 
  Square, 
  Tag, 
  Calendar,
  AlertCircle,
  Timer
} from 'lucide-react';

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  onMakeHighPriority?: () => void;
  onBulkSendToPomodoro?: () => void;
  onMoveToToday?: () => void;
  itemTypeLabel?: string;
  lang?: 'en' | 'ar';
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  onMakeHighPriority,
  onBulkSendToPomodoro,
  onMoveToToday,
  itemTypeLabel = 'items',
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl animate-slideUp">
      <div 
        className={`bg-[#2F3437] text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-neutral-700 flex flex-wrap items-center justify-between gap-2.5 ${
          isAr ? 'text-right' : ''
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Left: Count & Select All */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          >
            {isAllSelected ? <CheckCheck size={14} className="text-emerald-400" /> : <Square size={14} />}
            <span>
              {isAllSelected 
                ? (isAr ? 'إلغاء تحديد الكل' : 'Deselect All') 
                : (isAr ? `تحديد الكل (${totalCount})` : `Select All (${totalCount})`)}
            </span>
          </button>

          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg">
            {selectedCount} {isAr ? 'محدد' : 'selected'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Rollover to Today for selected */}
          {onMoveToToday && (
            <button
              onClick={onMoveToToday}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title={isAr ? 'ترحيل العناصر المحددة لتاريخ اليوم' : 'Move selected items to Today'}
            >
              <Calendar size={13} className="text-emerald-400" />
              <span>{isAr ? 'ترحيل لليوم 📅' : 'To Today 📅'}</span>
            </button>
          )}

          {/* Send Selected to Pomodoro Focus */}
          {onBulkSendToPomodoro && (
            <button
              onClick={onBulkSendToPomodoro}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title={isAr ? 'إرسال المهام المحددة إلى مؤقت التركيز بومودورو' : 'Send selected tasks to Pomodoro focus queue'}
            >
              <Timer size={13} className="text-emerald-400" />
              <span>{isAr ? 'إرسال للتركيز 🍅' : 'Focus Queue 🍅'}</span>
            </button>
          )}

          {/* Make High Priority */}
          {onMakeHighPriority && (
            <button
              onClick={onMakeHighPriority}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
              title={isAr ? 'تعيين كافة العناصر المحددة بأولوية قصوى' : 'Set high priority for all selected items'}
            >
              <Flame size={13} className="text-rose-400" />
              <span>{isAr ? 'أولوية قصوى' : 'High Priority'}</span>
            </button>
          )}

          {/* Bulk Edit */}
          <button
            onClick={onBulkEdit}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title={isAr ? 'تعديل جماعي للعناصر المحددة' : 'Bulk edit selected items'}
          >
            <Edit3 size={13} />
            <span>{isAr ? 'تعديل الكل' : 'Edit All'}</span>
          </button>

          {/* Export Selected */}
          <button
            onClick={onBulkExport}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title={isAr ? 'تصدير العناصر المحددة' : 'Export selected items'}
          >
            <Download size={13} />
            <span className="hidden sm:inline">{isAr ? 'تصدير' : 'Export'}</span>
          </button>

          {/* Bulk Delete */}
          <button
            onClick={onBulkDelete}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title={isAr ? 'حذف كافة العناصر المحددة' : 'Delete all selected items'}
          >
            <Trash2 size={13} />
            <span>{isAr ? 'حذف' : 'Delete'}</span>
          </button>

          {/* Close / Dismiss */}
          <button
            onClick={onDeselectAll}
            className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title={isAr ? 'إلغاء التحديد' : 'Close selection'}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
