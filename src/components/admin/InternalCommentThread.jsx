import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InternalCommentThread({ taskId, taskTitle }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      setCurrentUser(user);

      const commentList = await base44.entities.InternalComment.filter({
        internal_task_id: taskId,
      });
      setComments(commentList || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await base44.entities.InternalComment.create({
        internal_task_id: taskId,
        author_email: currentUser.email,
        content: newComment,
      });
      setNewComment('');
      loadData();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const markImportant = async (id, isImportant) => {
    try {
      await base44.entities.InternalComment.update(id, {
        is_important: !isImportant,
      });
      loadData();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={16} style={{ color: '#3b82f6' }} />
        <h3 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 700, margin: 0 }}>
          Coordination Notes
        </h3>
      </div>

      {/* Comments */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No notes yet. Start coordinating!</p>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg group"
                style={{
                  background: comment.is_important ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.04)',
                  border: comment.is_important
                    ? '1px solid rgba(251,146,60,0.2)'
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, margin: 0 }}>
                      {comment.author_email}
                    </p>
                  </div>
                  <button
                    onClick={() => markImportant(comment.id, comment.is_important)}
                    className="p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                    style={{
                      color: comment.is_important ? '#fb923c' : 'rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.05)',
                    }}
                    title="Mark as important"
                  >
                    <Star size={12} fill={comment.is_important ? '#fb923c' : 'none'} />
                  </button>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: 0, wordBreak: 'break-word' }}>
                  {comment.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <form onSubmit={addComment} className="flex gap-2 pt-2 border-t border-white/8">
        <input
          type="text"
          placeholder="Leave a note... (mention: @user@email.com)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg text-white placeholder-white/40 focus:outline-none text-sm"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="px-3 py-2 rounded-lg transition-all flex-shrink-0"
          style={{
            background: newComment.trim() ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
            color: newComment.trim() ? '#3b82f6' : 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}