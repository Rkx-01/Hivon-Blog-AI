'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post, Comment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'comments'>('posts');
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [postsRes, commentsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('*, author:users(id, name, role)')
        .order('created_at', { ascending: false }),
      supabase
        .from('comments')
        .select('*, user:users(id, name, role)')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (postsRes.data) setPosts(postsRes.data as Post[]);
    if (commentsRes.data) setComments(commentsRes.data as Comment[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      router.push('/');
    } else if (!authLoading && profile?.role === 'admin') {
      fetchData();
    }
  }, [authLoading, profile, router, fetchData]);

  const deletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (authLoading || loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state"><div className="empty-state-icon">⏳</div><h3>Loading admin panel...</h3></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>⚡ Admin Dashboard</h1>
          <p>Manage all posts and monitor community comments.</p>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-number">{posts.length}</div>
            <div className="stat-label">Total Posts</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{comments.length}</div>
            <div className="stat-label">Comments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {posts.filter((p) => p.summary).length}
            </div>
            <div className="stat-label">AI Summaries</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            className={`btn ${tab === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('posts')}
          >
            Posts ({posts.length})
          </button>
          <button
            className={`btn ${tab === 'comments' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('comments')}
          >
            Comments ({comments.length})
          </button>
        </div>

        {/* Posts Table */}
        {tab === 'posts' && (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>AI Summary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link href={`/posts/${post.id}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {post.title.length > 50 ? post.title.slice(0, 50) + '…' : post.title}
                      </Link>
                    </td>
                    <td>{post.author?.name}</td>
                    <td>{formatDate(post.created_at)}</td>
                    <td>
                      <span style={{ color: post.summary ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {post.summary ? '✓ Yes' : '— No'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/posts/${post.id}/edit`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Edit</Link>
                        <button onClick={() => deletePost(post.id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {posts.length === 0 && (
              <div className="empty-state"><div className="empty-state-icon">📭</div><h3>No posts yet</h3></div>
            )}
          </div>
        )}

        {/* Comments Table */}
        {tab === 'comments' && (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Comment</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id}>
                    <td>
                      {comment.comment_text.length > 80
                        ? comment.comment_text.slice(0, 80) + '…'
                        : comment.comment_text}
                    </td>
                    <td>{comment.user?.name}</td>
                    <td>{formatDate(comment.created_at)}</td>
                    <td>
                      <button onClick={() => deleteComment(comment.id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {comments.length === 0 && (
              <div className="empty-state"><div className="empty-state-icon">💬</div><h3>No comments yet</h3></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
