// ════════════════════════════════════════════════════════════
//  KanbanBoard — drag-and-drop collaborative task board
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, AlertCircle, Clock, CheckCircle, Loader2, GripVertical, Users } from 'lucide-react';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatRelative } from '../../lib/utils';

const COLUMNS = [
  { id: 'TODO',        title: 'To do',         color: '#94a3b8' },
  { id: 'IN_PROGRESS', title: 'In progress',   color: '#ff6d34' },
  { id: 'DONE',        title: 'Done',          color: '#00bea3' },
];

const STATUS_ICON = {
  TODO: Clock,
  IN_PROGRESS: Loader2,
  DONE: CheckCircle,
};

const TaskCard = ({ task, isOverlay = false, canEdit = true, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
    disabled: !canEdit,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleCardClick = (e) => {
    // Check if the click is on the drag handle or card itself
    if (onClick) onClick(e);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        cursor: canEdit ? 'grab' : 'default',
        boxShadow: isOverlay ? 'var(--card-shadow-lg)' : 'var(--card-shadow)',
        position: 'relative',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className="hover:border-slate-300 dark:hover:border-slate-700"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>
          {task.title}
        </p>
        {canEdit && (
          <GripVertical size={14} style={{ color: 'var(--muted)', opacity: 0.5, flexShrink: 0, marginTop: 2 }} />
        )}
      </div>

      {task.description && (
        <p style={{
          fontSize: 11,
          color: 'var(--text-soft)',
          marginTop: 4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.45,
        }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8, gap: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
          By {task.creator?.name || 'System'}
        </span>

        {task.assignees && task.assignees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {task.assignees.slice(0, 3).map((assignee, idx) => (
              <div
                key={assignee.id}
                title={assignee.name}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${idx % 2 === 0 ? '#ff6d34' : '#00bea3'}, #2563eb)`,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--card)',
                  marginLeft: idx > 0 ? -6 : 0,
                  zIndex: 10 - idx,
                  textTransform: 'uppercase',
                }}
              >
                {assignee.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 4, fontWeight: 600 }}>
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Column = ({ column, tasks, canEdit, onAdd, onClickTask }) => {
  const taskIds = tasks.map((t) => t.id);
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column' },
    disabled: !canEdit,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: 'var(--bg-soft)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 16,
        minHeight: '65vh',
        width: 320,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: column.color }} />
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{column.title}</p>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted)',
            background: 'var(--card)',
            padding: '2px 8px',
            borderRadius: 10,
            border: '1px solid var(--border)'
          }}>
            {tasks.length}
          </span>
        </div>
        {canEdit && onAdd && (
          <button
            onClick={() => onAdd(column.id)}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              color: 'var(--text)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 120 }}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} canEdit={canEdit} onClick={() => onClickTask?.(t)} />
          ))}
          {tasks.length === 0 && (
            <p style={{
              fontSize: 12,
              color: 'var(--muted)',
              textAlign: 'center',
              padding: '32px 16px',
              opacity: 0.6,
              border: '1px dashed var(--border)',
              borderRadius: 12,
              background: 'var(--card)'
            }}>
              No tasks here.
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const CreateTaskModal = ({ teams, activeTeamId, initialStatus = 'TODO', onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(activeTeamId || (teams[0]?.id || ''));
  const [status, setStatus] = useState(initialStatus);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const members = selectedTeam?.members || [];

  useEffect(() => {
    setSelectedAssigneeIds([]);
  }, [selectedTeamId]);

  const handleToggleAssignee = (userId) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return notify.error('Title is required');
    setSaving(true);
    try {
      await onSave({
        teamId: selectedTeamId,
        title: title.trim(),
        description: description.trim(),
        status,
        assigneeIds: selectedAssigneeIds,
      });
      onClose();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: 20,
        padding: 28,
        width: 'min(90vw, 520px)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow-lg)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: 'var(--text)' }}>
          Create Collaborative Task
        </h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.05, display: 'block', marginBottom: 6 }}>
              Task Title *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Implement OAuth client flow"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--input-bg)',
                color: 'var(--text)',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.05, display: 'block', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of this task..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--input-bg)',
                color: 'var(--text)',
                fontSize: 14,
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.05, display: 'block', marginBottom: 6 }}>
                Team Selection
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text)',
                  fontSize: 13,
                }}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.05, display: 'block', marginBottom: 6 }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text)',
                  fontSize: 13,
                }}
              >
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.05, display: 'block', marginBottom: 6 }}>
              Assigned Members
            </label>
            <div style={{
              maxHeight: 140,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 12,
              background: 'var(--input-bg)',
            }}>
              {members.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: 8 }}>
                  No members in this team.
                </p>
              ) : (
                members.map((member) => (
                  <label
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--text)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssigneeIds.includes(member.id)}
                      onChange={() => handleToggleAssignee(member.id)}
                      style={{ accentColor: '#ff6d34' }}
                    />
                    <span>{member.name}</span>
                    <span style={{
                      fontSize: 10,
                      color: 'var(--muted)',
                      background: 'var(--bg)',
                      padding: '1px 6px',
                      borderRadius: 10,
                      marginLeft: 'auto',
                      border: '1px solid var(--border)',
                    }}>
                      {member.role}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                background: '#ff6d34',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskDetailModal = ({ task, teams, onClose, onSaveAssignees }) => {
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState(task?.assignees?.map((a) => a.id) || []);
  const [saving, setSaving] = useState(false);

  const team = teams.find((t) => t.id === task.teamId);
  const members = team?.members || [];

  const handleToggleAssignee = (userId) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveAssignees(task.id, selectedAssigneeIds);
      onClose();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update assignees');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: 20,
        padding: 28,
        width: 'min(90vw, 480px)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow-lg)',
      }}>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{task.title}</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Created by {task.creator?.name || 'System'} • {formatRelative(task.createdAt)}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.05, display: 'block', marginBottom: 4 }}>
              Description
            </label>
            <div style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              fontSize: 13,
              color: 'var(--text)',
              minHeight: 60,
              maxHeight: 120,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {task.description || (
                <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No description provided.</span>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.05, display: 'block', marginBottom: 6 }}>
              Assigned Members
            </label>
            <div style={{
              maxHeight: 160,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 12,
              background: 'var(--input-bg)',
            }}>
              {members.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: 8 }}>
                  No members in this team.
                </p>
              ) : (
                members.map((member) => (
                  <label
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--text)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssigneeIds.includes(member.id)}
                      onChange={() => handleToggleAssignee(member.id)}
                      style={{ accentColor: '#ff6d34' }}
                    />
                    <span>{member.name}</span>
                    <span style={{
                      fontSize: 10,
                      color: 'var(--muted)',
                      background: 'var(--bg)',
                      padding: '1px 6px',
                      borderRadius: 10,
                      marginLeft: 'auto',
                      border: '1px solid var(--border)',
                    }}>
                      {member.role}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                background: '#ff6d34',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const KanbanBoard = ({ teamId, teams, canEdit = true }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateStatus, setShowCreateStatus] = useState('TODO');
  const [modalTask, setModalTask] = useState(null);
  const [team, setTeam] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const response = await api.get(`/collab-tasks/team/${teamId}`);
      setTasks(response.data.tasks || []);
      const activeTeam = teams.find((t) => t.id === teamId);
      setTeam(activeTeam || null);
    } catch {
      notify.error('Failed to load collaborative tasks.');
    } finally {
      setLoading(false);
    }
  }, [teamId, teams]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

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
    const originalTasks = [...tasks];
    setTasks((arr) =>
      arr.map((t) => (t.id === aData.task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await api.patch(`/collab-tasks/${aData.task.id}/status`, { status: newStatus });
      notify.success(`Moved to ${newStatus.replace('_', ' ').toLowerCase()}`);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to update status');
      setTasks(originalTasks);
    }
  };

  const onAdd = (status) => {
    setShowCreateStatus(status);
    setShowCreateModal(true);
  };

  const handleCreateTask = async (taskData) => {
    await api.post('/collab-tasks', taskData);
    fetchTasks();
    notify.success('Task created successfully');
  };

  const handleUpdateAssignees = async (taskId, assigneeIds) => {
    await api.put(`/collab-tasks/${taskId}/assignees`, { assigneeIds });
    fetchTasks();
    notify.success('Assignees updated successfully');
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
        <Loader2 size={24} className="animate-spin" style={{ display: 'inline-block' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {team && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--card)',
          padding: 20,
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: 'var(--card-shadow)',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
              {team.name}
            </h2>
            {team.description && (
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                {team.description}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setShowCreateStatus('TODO');
              setShowCreateModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 12,
              border: 'none',
              background: '#ff6d34',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,109,52,0.2)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e85d25'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ff6d34'; }}
          >
            <Plus size={15} />
            Create Task
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 16,
          alignItems: 'flex-start',
        }}>
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
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isOverlay />}
        </DragOverlay>
      </DndContext>

      {showCreateModal && (
        <CreateTaskModal
          teams={teams}
          activeTeamId={teamId}
          initialStatus={showCreateStatus}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {modalTask && (
        <TaskDetailModal
          task={modalTask}
          teams={teams}
          onClose={() => setModalTask(null)}
          onSaveAssignees={handleUpdateAssignees}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
