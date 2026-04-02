'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Post } from '@/types';

// Extend post to include comments count
interface DashboardPost extends Post {
  comments: [{ count: number }];
}

export default function DashboardPage() {
  const { profile, supabaseUser, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    postIdToDelete?: string;
  }>({ isOpen: false, type: 'alert', title: '', message: '' });

  const router = useRouter();
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    if (!supabaseUser) return;

    // Fetch posts by this author and get a count of comments for each
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*, comments(count)')
      .eq('author_id', supabaseUser.id)
      .order('created_at', { ascending: false });

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*, post:posts!inner(id, title), user:users(id, name)')
      .eq('posts.author_id', supabaseUser.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (postsError) {
      console.error('Error fetching dashboard data:', postsError);
    } else if (postsData) {
      setPosts(postsData as unknown as DashboardPost[]);
    }
    if (commentsData) {
      setRecentComments(commentsData);
    }
    setLoading(false);
  }, [supabaseUser, supabase]);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login');
    } else if (!authLoading && profile) {
      if (profile.role !== 'author' && profile.role !== 'admin') {
        router.push('/');
      } else {
        fetchDashboardData();
      }
    }
  }, [authLoading, profile, router, fetchDashboardData]);

  const requestDelete = (postId: string) => {
    setModalState({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Post',
      message: 'Are you sure you want to permanently delete this post and all its comments? This cannot be undone.',
      postIdToDelete: postId
    });
  };

  const confirmDelete = async () => {
    const postId = modalState.postIdToDelete;
    if (!postId) return;

    // Temporarily close modal to process
    setModalState(prev => ({ ...prev, isOpen: false }));
    
    // Explicitly ask Supabase exactly how many rows were deleted to catch silent RLS bypasses
    const { error, count } = await supabase
      .from('posts')
      .delete({ count: 'exact' })
      .eq('id', postId);

    if (error) {
      setModalState({
        isOpen: true,
        type: 'alert',
        title: 'Deletion Failed',
        message: 'Failed to delete post: ' + error.message
      });
      return;
    }

    if (count === 0) {
      setModalState({
        isOpen: true,
        type: 'alert',
        title: 'Database Security Block',
        message: 'The post was NOT deleted because the Supabase RLS policy is missing.\n\nYou MUST run the SQL command I provided earlier in your Supabase SQL Editor to grant Authors permission to delete their own posts!'
      });
      return;
    }

    // Success! Remove from frontend instantly without re-fetching old Next.js cache
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setRecentComments((prev) => prev.filter((c) => c.post_id !== postId));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (authLoading || loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <h3>Loading dashboard...</h3>
          </div>
        </div>
      </div>
    );
  }

  const totalPosts = posts.length;
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.[0]?.count || 0), 0);
  const latestPostDate = posts.length > 0 ? formatDate(posts[0].created_at) : 'N/A';
  
  let mostCommentedPostTitle = 'N/A';
  if (posts.length > 0) {
    const mostCommented = [...posts].sort((a, b) => (b.comments?.[0]?.count || 0) - (a.comments?.[0]?.count || 0))[0];
    if (mostCommented && mostCommented.comments?.[0]?.count > 0) {
      mostCommentedPostTitle = mostCommented.title.length > 25 ? mostCommented.title.slice(0, 25) + '...' : mostCommented.title;
    } else if (mostCommented) {
      mostCommentedPostTitle = 'No comments yet';
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Header Section */}
        <div className="section-header" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: '36px', marginBottom: '8px' }}>
              Welcome back, {profile?.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="role-badge author" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                {profile?.role.toUpperCase()}
              </span>
            </div>
          </div>
          <Link href="/posts/create" className="btn btn-primary" style={{ borderRadius: '0' }}>
            Write New Post
          </Link>
        </div>

        {/* Stats Row */}
        <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {[
            { label: 'Total Posts Published', value: totalPosts },
            { label: 'Total Comments Received', value: totalComments },
            { label: 'Latest Post', value: latestPostDate },
            { label: 'Most Commented', value: mostCommentedPostTitle }
          ].map((stat, i) => (
            <div key={i} className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <div className="stat-number" style={{ fontSize: '2.5rem', color: 'var(--accent)', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
                {stat.value}
              </div>
              <div className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Posts Table */}
        {posts.length === 0 ? (
          <div className="empty-state" style={{ border: '1px dashed var(--border)', padding: '64px 24px', textAlign: 'center', margin: '48px 0' }}>
            <h3 className="font-display" style={{ fontSize: '24px', marginBottom: '8px' }}>You haven&apos;t written anything yet.</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your ideas deserve to be heard.</p>
            <Link href="/posts/create" className="btn btn-primary" style={{ borderRadius: '0', fontSize: '1.2rem', padding: '16px 32px' }}>
              Write Your First Post
            </Link>
          </div>
        ) : (
          <>
            <div className="section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                My Posts
              </h2>
            </div>
            <div className="admin-table">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ width: '60px', padding: '12px' }}></th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Comments</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>AI Signal</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '12px' }}>
                         {post.image_url ? (
                           <Image src={post.image_url} alt="thumbnail" width={40} height={40} style={{ objectFit: 'cover' }} />
                         ) : (
                           <div style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', borderRadius: '4px' }} />
                         )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Link href={`/posts/${post.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {post.title}
                        </Link>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{formatDate(post.created_at)}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                         💬 {post.comments?.[0]?.count || 0}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                        {post.summary ? (
                          <span style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.08)', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>Generated</span>
                        ) : (
                          <span style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.08)', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>Missing</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Link href={`/posts/${post.id}/edit`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '0' }}>
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => requestDelete(post.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '0' }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent Comments */}
            <div className="section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px', marginTop: '64px' }}>
              <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                Recent Comments On My Posts
              </h2>
            </div>
            
            {recentComments.length === 0 ? (
              <div style={{ padding: '24px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                No comments received yet.
              </div>
            ) : (
              <div className="admin-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Commenter</th>
                      <th style={{ padding: '12px', textAlign: 'left', width: '40%' }}>Preview</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Post</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentComments.map((comment) => (
                      <tr key={comment.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)', padding: '12px' }}>
                          {comment.user?.name || 'Anonymous'}
                        </td>
                        <td style={{ fontStyle: 'italic', padding: '12px', color: 'var(--text-secondary)' }}>
                          &quot;{comment.comment_text.length > 60 ? comment.comment_text.slice(0, 60) + '...' : comment.comment_text}&quot;
                        </td>
                        <td style={{ padding: '12px' }}>
                          <Link href={`/posts/${comment.post_id}`} style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
                            {comment.post?.title.length > 25 ? comment.post?.title.slice(0, 25) + '...' : comment.post?.title}
                          </Link>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {formatDate(comment.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Global Modal */}
      {modalState.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border)', width: '100%', maxWidth: '450px', 
            padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 className="font-display" style={{ fontSize: '32px', color: modalState.type === 'alert' ? 'var(--danger)' : 'var(--text-primary)', marginBottom: '16px' }}>
              {modalState.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {modalState.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {modalState.type === 'confirm' && (
                <button 
                  onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))} 
                  className="btn btn-secondary" 
                  style={{ borderRadius: '0' }}
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={modalState.type === 'confirm' ? confirmDelete : () => setModalState(prev => ({ ...prev, isOpen: false }))} 
                className={modalState.type === 'confirm' ? "btn btn-danger" : "btn btn-primary"} 
                style={{ borderRadius: '0' }}
              >
                {modalState.type === 'confirm' ? 'Delete' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
