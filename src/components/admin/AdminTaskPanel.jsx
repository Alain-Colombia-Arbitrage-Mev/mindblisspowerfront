import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRIORITY_COLORS = {
  low: '#3b82f6',
  medium: '#f59e0b',
  high: '#ef5350',
  critical: '#dc2626',
};

const STATUS_ICONS = {
  pending: Clock,
  in_progress: Clock,
  review: Clock,
  completed: CheckCircle,
};

export default function AdminTaskPanel() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const result = await base44.entities.InternalTask.list();
      setTasks(result || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.InternalTask.create({
        ...formData,
        assigned_by: (await base44.auth.me()).email,
      });
      setFormData({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
      setShowForm(false);
      loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await base44.entities.InternalTask.delete(id);
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const updateTaskStatus = async (id, newStatus) => {
    try {
      await base44.entities.InternalTask.update(id, { status: newStatus });
      loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: 700 }}>Internal Tasks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
          style={{
            background: 'rgba(59,130,246,0.2)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#3b82f6',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Plus size={14} /> New Task
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={createTask}
            className="p-4 rounded-lg space-y-3"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <input
              type="text"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg text-white placeholder-white/40 focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white placeholder-white/40 focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              rows="2"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="email"
                placeholder="Assign to (email)"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                required
                className="px-3 py-2 rounded-lg text-white placeholder-white/40 focus:outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="px-3 py-2 rounded-lg text-white focus:outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg font-semibold text-white transition-all text-sm"
                style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)' }}
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg transition-all text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <div className="space-y-2">
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No tasks yet</p>
        ) : (
          tasks.map((task) => {
            const Icon = STATUS_ICONS[task.status];
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg cursor-pointer group transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid rgba(255,255,255,0.08)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600, margin: 0 }}>
                      {task.title}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>
                      → {task.assigned_to}
                    </p>
                    {task.due_date && (
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, margin: '2px 0 0' }}>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: PRIORITY_COLORS[task.priority] }}
                      title={task.priority}
                    />
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="px-2 py-1 rounded text-white focus:outline-none text-xs"
                      style={{ background: 'rgba(255,255,255,0.08)', border: 'none' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                      style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,0,0,0.1)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}