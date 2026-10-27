import React, { useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  CheckSquare, 
  Calendar, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Check,
  Edit2,
  Archive
} from 'lucide-react';
import { ProjectItem, ProjectSubtask } from '../types';
import { ConfirmModal } from './ConfirmModal';
import confetti from 'canvas-confetti';

interface ProjectsManagerProps {
  projects: ProjectItem[];
  onAddProject: (project: Omit<ProjectItem, 'id'>) => Promise<any>;
  onUpdateProject: (id: string, updates: Partial<ProjectItem>) => Promise<any>;
  onDeleteProject: (id: string) => Promise<any>;
  lang?: 'en' | 'ar';
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  lang = 'en',
}) => {
  const isAr = lang === 'ar';
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Business');
  const [newStatus, setNewStatus] = useState<ProjectItem['status']>('In Progress');
  const [newDeadline, setNewDeadline] = useState('');
  const [newDailyAllocation, setNewDailyAllocation] = useState<number>(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subtask creation state inside an expanded project card
  const [activeSubtaskInput, setActiveSubtaskInput] = useState<{ [projectId: string]: string }>({});

  // Delete project confirm
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);

  const getStatusLabel = (status: ProjectItem['status']) => {
    if (!isAr) return status;
    switch (status) {
      case 'In Progress': return 'قيد التنفيذ';
      case 'Planning': return 'قيد التخطيط';
      case 'Completed': return 'مكتمل';
      case 'On Hold': return 'معلق مؤقتاً';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    if (!isAr) return category;
    switch (category) {
      case 'Business': return 'الأعمال والشركات';
      case 'Engineering': return 'الهندسة والتطوير';
      case 'Design': return 'التصميم والوجهات';
      case 'Marketing': return 'التسويق والمبيعات';
      case 'Personal': return 'شخصي وحياتي';
      default: return category;
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddProject({
        title: newTitle.trim(),
        description: newDesc.trim(),
        status: newStatus,
        category: newCategory,
        color: 'blue',
        deadline: newDeadline || undefined,
        dailyAllocationPercentage: Number(newDailyAllocation) || 0,
        subtasks: [],
        createdAt: Date.now(),
      });

      setNewTitle('');
      setNewDesc('');
      setNewDeadline('');
      setNewDailyAllocation(25);
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubtask = async (projectId: string) => {
    const text = (activeSubtaskInput[projectId] || '').trim();
    if (!text) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const newSubtask: ProjectSubtask = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: text,
      completed: false,
    };

    const updatedSubtasks = [...(project.subtasks || []), newSubtask];
    await onUpdateProject(projectId, { subtasks: updatedSubtasks });

    setActiveSubtaskInput({ ...activeSubtaskInput, [projectId]: '' });
  };

  const handleToggleSubtask = async (projectId: string, subtaskId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    let justCompleted = false;
    const updatedSubtasks = (project.subtasks || []).map((st) => {
      if (st.id === subtaskId) {
        if (!st.completed) justCompleted = true;
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);

    await onUpdateProject(projectId, {
      subtasks: updatedSubtasks,
      status: allDone ? 'Completed' : project.status,
    });

    if (justCompleted) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
      });
    }
  };

  const handleDeleteSubtask = async (projectId: string, subtaskId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedSubtasks = (project.subtasks || []).filter((st) => st.id !== subtaskId);
    await onUpdateProject(projectId, { subtasks: updatedSubtasks });
  };

  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'Planning':
        return 'bg-purple-50 text-purple-700 border-purple-200/60';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'On Hold':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200/60';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className={`space-y-6 max-w-6xl mx-auto animate-fadeIn ${isAr ? 'text-right' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAE9E6]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#787774] font-medium mb-1">
            <FolderKanban size={14} />
            <span>{isAr ? 'مبادرات ومشاريع عالية التأثير' : 'High-Leverage Initiatives'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2F3437]">
            {isAr ? 'المشاريع وتتبع الأهداف' : 'Projects & Goal Tracking'}
          </h2>
          <p className="text-sm text-[#787774] mt-0.5">
            {isAr ? 'قم بتفكيك وتقسيم أهداف عملك الطموحة إلى مراحل ومعالم قابلة للتنفيذ الفعلي.' : 'Break down ambitious business objectives into actionable milestones.'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#2F3437] hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>{isAr ? 'مشروع جديد' : 'New Project'}</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-[#787774] bg-white rounded-2xl border border-[#EAE9E6] p-8 shadow-xs">
            <FolderKanban size={40} className="mx-auto text-neutral-300 mb-3" />
            <p className="font-semibold text-[#2F3437] text-base">{isAr ? 'لا توجد مشاريع نشطة بعد' : 'No active projects yet'}</p>
            <p className="text-xs mt-1 max-w-sm mx-auto">
              {isAr 
                ? 'أنشئ مشروعك الأول لتنظيم المهام الفرعية وتتبع مستوى التقدم في التنفيذ.' 
                : 'Create your first project to organize subtasks and track execution progress.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-xs font-bold bg-[#2F3437] text-white px-4 py-2 rounded-xl hover:bg-black transition-colors"
            >
              {isAr ? '+ إنشاء المشروع الأول' : '+ Create First Project'}
            </button>
          </div>
        ) : (
          projects.map((project) => {
            const subtasks = project.subtasks || [];
            const completedCount = subtasks.filter((s) => s.completed).length;
            const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

            return (
              <div
                key={project.id}
                className="bg-white p-5 rounded-2xl border border-[#EAE9E6] shadow-xs hover:border-[#D3D1CB] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-neutral-50 text-[#787774] border-[#EAE9E6]">
                      {getCategoryLabel(project.category)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border font-mono ${getStatusBadge(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                      <button
                        onClick={() => project.id && onUpdateProject(project.id, { archived: true, archivedAt: Date.now() })}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title={isAr ? 'أرشفة المشروع' : 'Archive project'}
                      >
                        <Archive size={15} />
                      </button>
                      <button
                        onClick={() => setProjectToDelete(project)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title={isAr ? 'حذف المشروع' : 'Delete project'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#2F3437] leading-snug">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-[#787774] mt-1.5 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-4 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-[#787774]">{isAr ? 'إنجاز المهام الفرعية' : 'Subtask Completion'}</span>
                      <span className="text-[#2F3437] font-mono font-bold">
                        {completedCount}/{subtasks.length} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2F3437] h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Nested Checklist */}
                  <div className="space-y-2 mt-4 pt-3 border-t border-[#EAE9E6]">
                    <div className="text-xs font-semibold text-[#787774] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare size={13} />
                      <span>{isAr ? 'عناصر العمل الفرعية' : 'Nested Action Items'}</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {subtasks.length === 0 ? (
                        <p className="text-xs text-neutral-400 py-1 italic">
                          {isAr ? 'لم تتم إضافة مهام فرعية بعد.' : 'No action items added yet.'}
                        </p>
                      ) : (
                        subtasks.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#FBFBFA] border border-[#EAE9E6]/60 hover:bg-[#F7F6F3] text-xs transition-colors group/item"
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                              <button
                                onClick={() => project.id && handleToggleSubtask(project.id, st.id)}
                                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                                  st.completed
                                    ? 'bg-[#2F3437] text-white'
                                    : 'border border-[#D3D1CB] hover:border-[#2F3437]'
                                }`}
                              >
                                {st.completed && <Check size={10} />}
                              </button>
                              <span className={`truncate font-medium ${st.completed ? 'line-through text-[#787774]' : 'text-[#2F3437]'}`}>
                                {st.title}
                              </span>
                            </div>

                            <button
                              onClick={() => project.id && handleDeleteSubtask(project.id, st.id)}
                              className="text-neutral-400 hover:text-rose-600 p-1 transition-colors"
                              title={isAr ? 'حذف العنصر' : 'Delete item'}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add nested subtask input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder={isAr ? 'أضف مهمة فرعية جديدة...' : 'Add nested to-do...'}
                        value={activeSubtaskInput[project.id || ''] || ''}
                        onChange={(e) =>
                          setActiveSubtaskInput({
                            ...activeSubtaskInput,
                            [project.id || '']: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && project.id) {
                            handleAddSubtask(project.id);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#EAE9E6] text-xs bg-[#FBFBFA] text-[#2F3437] focus:outline-none focus:border-[#2F3437]"
                      />
                      <button
                        onClick={() => project.id && handleAddSubtask(project.id)}
                        className="bg-neutral-200 hover:bg-[#2F3437] hover:text-white text-[#2F3437] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        {isAr ? 'إضافة' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer status toggle */}
                {/* Footer status & allocation toggle */}
                <div className="mt-5 pt-3 border-t border-[#EAE9E6] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {project.deadline && (
                      <span className="text-[#787774] flex items-center gap-1 font-mono text-[11px]">
                        <Calendar size={12} />
                        {isAr ? `تاريخ الاستحقاق ${project.deadline}` : `Due ${project.deadline}`}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                      <span>🎯 {isAr ? 'النسبة اليومية:' : 'Daily Allocation:'}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={project.dailyAllocationPercentage ?? 20}
                        onChange={(e) => {
                          if (project.id) {
                            onUpdateProject(project.id, {
                              dailyAllocationPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0))
                            });
                          }
                        }}
                        className="w-10 px-1 py-0.5 text-center bg-white dark:bg-neutral-800 rounded border border-emerald-300 dark:border-emerald-700 font-mono font-bold text-xs"
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <select
                    value={project.status}
                    onChange={(e) => {
                      if (project.id) {
                        onUpdateProject(project.id, {
                          status: e.target.value as ProjectItem['status'],
                        });
                      }
                    }}
                    className="ml-auto px-2.5 py-1 rounded-md border border-[#EAE9E6] bg-white text-xs font-medium text-[#2F3437]"
                  >
                    <option value="In Progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                    <option value="Planning">{isAr ? 'قيد التخطيط' : 'Planning'}</option>
                    <option value="Completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                    <option value="On Hold">{isAr ? 'معلق مؤقتاً' : 'On Hold'}</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#EAE9E6] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#2F3437] flex items-center gap-2">
                <FolderKanban size={18} />
                {isAr ? 'إنشاء مشروع جديد' : 'Create New Project'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#787774] hover:text-[#2F3437] text-sm font-semibold"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2F3437] mb-1">
                  {isAr ? 'عنوان المشروع *' : 'Project Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: إطلاق الإصدار ٢.٠ للبرنامج، التدقيق المالي' : 'e.g. Mobile App 2.0 Launch, Financial Audit'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D3D1CB] focus:border-[#2F3437] focus:outline-none text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2F3437] mb-1">
                  {isAr ? 'الوصف / الأهداف والمؤشرات الرئيسية للمشروع' : 'Description / High-Level Objective'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isAr ? 'حدد المقاييس والنتائج والمعايير الأساسية لاكتمال المشروع...' : 'Outline key metrics, business outcomes, and criteria for completion...'}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D3D1CB] focus:border-[#2F3437] focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2F3437] mb-1">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3D1CB] focus:border-[#2F3437] focus:outline-none text-xs bg-white"
                  >
                    <option value="Business">{isAr ? 'الأعمال والشركات' : 'Business'}</option>
                    <option value="Engineering">{isAr ? 'الهندسة والتطوير' : 'Engineering'}</option>
                    <option value="Design">{isAr ? 'التصميم والوجهات' : 'Design'}</option>
                    <option value="Marketing">{isAr ? 'التسويق والمبيعات' : 'Marketing'}</option>
                    <option value="Personal">{isAr ? 'شخصي وحياتي' : 'Personal'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2F3437] mb-1">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProjectItem['status'])}
                    className="w-full px-3 py-2 rounded-xl border border-[#D3D1CB] focus:border-[#2F3437] focus:outline-none text-xs bg-white"
                  >
                    <option value="In Progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                    <option value="Planning">{isAr ? 'قيد التخطيط' : 'Planning'}</option>
                    <option value="Completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                    <option value="On Hold">{isAr ? 'معلق مؤقتاً' : 'On Hold'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2F3437] mb-1">
                    {isAr ? 'تاريخ الاستحقاق' : 'Target Deadline'}
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-[#D3D1CB] focus:border-[#2F3437] focus:outline-none text-xs bg-white"
                  />
                </div>
              </div>

              {/* Target Daily Allocation Slider */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>{isAr ? 'النسبة المستهدفة في اليوم (Daily Allocation %)' : 'Daily Target Allocation %'}</span>
                  </span>
                  <span className="font-mono font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {newDailyAllocation}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={newDailyAllocation}
                  onChange={(e) => setNewDailyAllocation(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-emerald-700 font-medium">
                  {isAr 
                    ? 'حدد النسبة المئوية من وقتك ومهامك اليومية المخصصة لهذا المشروع للمقارنة والتحليل في الداشبورد.'
                    : 'Target share of daily focus and task execution to compare actual vs target in Dashboard.'}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#787774] hover:bg-neutral-100"
                >
                  {isAr ? 'إلغاء' : 'Dismiss'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2F3437] text-white hover:bg-black transition-colors"
                >
                  {isSubmitting ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء المشروع' : 'Create Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(projectToDelete)}
        title={isAr ? 'حذف المشروع' : 'Delete Project'}
        message={
          isAr 
            ? `هل أنت متأكد من رغبتك في حذف المشروع "${projectToDelete?.title}" مع جميع عناصر العمل والمهام الفرعية التابعة له؟`
            : `Are you sure you want to delete "${projectToDelete?.title}" along with all its nested action items?`
        }
        confirmLabel={isAr ? 'حذف المشروع' : 'Delete Project'}
        cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        onConfirm={() => {
          if (projectToDelete?.id) {
            onDeleteProject(projectToDelete.id);
          }
          setProjectToDelete(null);
        }}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
};
