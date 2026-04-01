'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Comment } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { profile, supabaseUser } = useAuth();
  const supabase = createClient();

  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, user:users(id, name, role)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) setComments(data as Comment[]);
    setLoading(false);
  }, [postId, supabase]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !supabaseUser) return;

    setSubmitting(true);
    setError('');

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: supabaseUser.id,
      comment_text: newComment.trim(),
    });

    if (error) {
      setError(error.message);
    } else {
      setNewComment('');
      await loadComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  return (
    <section className="comments-section">
      <h3 className="comments-title">
        Comments <span className="comments-count">{comments.length}</span>
      </h3>

      {supabaseUser ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            required
          />
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <a href="/auth/login">Sign in</a> to leave a comment.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3>No comments yet</h3>
          <p>Be the first to start the conversation!</p>
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {comment.user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.user?.name || 'Anonymous'}</span>
                  <span className="comment-date">{formatDate(comment.created_at)}</span>
                </div>
                <p className="comment-text">{comment.comment_text}</p>
              </div>
              {(profile?.role === 'admin' || comment.user_id === supabaseUser?.id) && (
                <button
                  className="btn btn-ghost"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--danger)' }}
                  onClick={() => handleDelete(comment.id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
