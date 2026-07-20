// ════════════════════════════════════════════════════════════
//  KanbanBoard — drag-and-drop task board
//  Optimistic UI + server sync
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, AlertCircle, Clock, CheckCircle, Loader2, GripVertical } from 'lucide-react';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatRelative } from '../../lib/utils';

const COLUMNS = [
  { id: 'TODO',        title: 'To do',         color: '#94a3b8' },
  { id: 'IN_PROGRESS', title: 'In progress',   color: '#ff6d34' },
  { id: 'REVIEW',      title: 'In review',     color: '#7C3AED' },
  { id: 'DONE',        title: 'Done',          color: '#00bea3' },
];

const PRIORITY_COLORS = {
  URGENT: '#dc2626', HIGH: '#ff6d34', MEDIUM: '#f59e0b', LOW: '#94a3b8',
};

const STATUS_ICON = {
  TODO: Clock, IN_PROGRESS: Loader2, REVIEW: AlertCircle, DONE: CheckCircle, BLOCKED: AlertCircle,
};

const TaskCard = ({ task, isOverlay = false, canEdit = true, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
    disabled: !canEdit,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const StatusIcon = STATUS_ICON[task.status] || Clock;
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        cursor: canEdit ? 'grab' : 'default',
        boxShadow: isOverlay ? '0 10px 30px rgba(0,0,0,0.18)' : 'none',
        position: 'relative',
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[task.priority] || '#94a3b8', flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1, lineHeight: 1.35 }}>{task.title}</p>
        {canEdit && <GripVertical size={12} style={{ color: 'var(--muted)', opacity: 0.4, flexShrink: 0 }} />}
      </div>
      {task.dueDate && (
        <p style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Clock size={10} /> Due {formatRelative(task.dueDate)}
        </p>
      )}
      {task.assignee && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6d34, #00bea3)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {task.assignee.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
};

const Column = ({ column, tasks, canEdit, onAdd, onClickTask }) => {
  const taskIds = tasks.map((t) => t.id);
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'column' }, disabled: !canEdit });
  return (
    <div
      ref={setNodeRef}
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 12,
        minHeight: 320,
        width: 280,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 4, paddingRight: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: column.color }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{column.title}</p>
          <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--card)', padding: '1px 6px', borderRadius: 10 }}>{tasks.length}</span>
        </div>
        {canEdit && onAdd && (
          <button onClick={() => onAdd(column.id)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
            <Plus size={14} />
          </button>
        )}
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 100 }}>
          {tasks.map((t) => <TaskCard key={t.id} task={t} canEdit={canEdit} onClick={() => onClickTask?.(t)} />)}
          {tasks.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: 24, opacity: 0.6 }}>No tasks here.</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const TaskModal = ({ task, onClose, onSave }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [priority, setPriority] = useState(task?.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  if (!task) return null;
  const isNew = !task._id;
  const save = async () => {
    if (!title.trim()) return notify.error('Title is required');
    setSaving(true);
    try {
      await onSave({ ...task, title, priority, dueDate: dueDate || null });
      onClose();
    } catch (err) { notify.error(err.response?.data?.error || 'Failed'); }
    setSaving(false);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, width: 'min(90vw, 480px)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>{isNew ? 'New task' : 'Edit task'}</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title"
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.04, display: 'block', marginBottom: 4 }}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: 13 }}>
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.04, display: 'block', marginBottom: 4 }}>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: 13 }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ff6d34', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

const KanbanBoard = ({ projectId, canEdit = true }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [modalTask, setModalTask] = useState(null);
  const [project, setProject] = useState(null);

  const fetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        api.get(`/projects/${projectId}`).catch(() => null),
        api.get('/tasks', { params: { projectId, limit: 200 } }),
      ]);
      setProject(p?.data?.project);
      setTasks(t.data.items);
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragStart = (e) => {
    const data = e.active.data.current;
    if (data?.type === 'task') setActiveTask(data.task);
  };

  const onDragEnd = async (e) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const aData = active.data.current;
    const oData = over.data.current;
    if (!aData || aData.type !== 'task') return;

    let newStatus;
    if (oData?.type === 'column') {
      newStatus = over.id;
    } else if (oData?.type === 'task') {
      newStatus = oData.task.status;
    } else return;

    if (newStatus === aData.task.status) return;
    // Optimistic update
    setTasks((arr) => arr.map((t) => t.id === aData.task.id ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${aData.task.id}`, { status: newStatus });
      notify.success(`Moved to ${newStatus.replace('_', ' ').toLowerCase()}`);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update');
      fetch();
    }
  };

  const onAdd = (status) => {
    setModalTask({ title: '', priority: 'MEDIUM', status, projectId, _id: null });
  };

  const onSaveTask = async (task) => {
    if (task._id) {
      await api.post('/tasks', {
        title: task.title, priority: task.priority, dueDate: task.dueDate, status: task.status, projectId: task.projectId,
      });
    }
    fetch();
    notify.success('Task created');
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}><Loader2 size={20} className="animate-spin" style={{ display: 'inline-block', verticalAlign: 'middle' }} /></div>;

  return (
    <div>
      {project && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{project.name}</h2>
          {project.description && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{project.description}</p>}
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
          {COLUMNS.map((c) => (
            <Column
              key={c.id}
              column={c}
              tasks={tasks.filter((t) => t.status === c.id)}
              canEdit={canEdit}
              onAdd={onAdd}
              onClickTask={(t) => canEdit && setModalTask(t)}
            />
          ))}
        </div>
        <DragOverlay>{activeTask && <TaskCard task={activeTask} isOverlay />}</DragOverlay>
      </DndContext>
      {modalTask && <TaskModal task={modalTask} onClose={() => setModalTask(null)} onSave={onSaveTask} />}
    </div>
  );
};

export default KanbanBoard;
