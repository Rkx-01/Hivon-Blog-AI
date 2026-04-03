'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types';
import { useAuth } from '@/context/AuthContext';
import CommentSection from '@/components/CommentSection';
import LikeButton from '@/components/LikeButton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

import { Skeleton } from '@/components/ui/Skeleton';

const PostDetailSkeleton = () => (
  <div className="post-detail fade-in">
    <Skeleton height="32px" width="80px" className="mb-4" /> {/* Back btn */}
    <Skeleton height="500px" width="100%" borderRadius="var(--radius-lg)" className="mb-8" /> {/* Hero */}
    <div className="post-detail-meta mb-8" style={{ display: 'flex', gap: '15px' }}>
      <Skeleton circle width="32px" height="32px" />
      <Skeleton width="100px" height="1rem" />
      <Skeleton width="150px" height="1rem" />
    </div>
    <Skeleton height="3.5rem" width="80%" className="mb-8" /> {/* Title */}
    <Skeleton height="150px" width="100%" borderRadius="var(--radius-md)" className="mb-8" /> {/* Summary */}
    <div className="post-body">
      <Skeleton height="1.2rem" width="100%" className="mb-2" />
      <Skeleton height="1.2rem" width="95%" className="mb-2" />
      <Skeleton height="1.2rem" width="90%" className="mb-2" />
      <Skeleton height="1.2rem" width="100%" className="mb-4" />
      <Skeleton height="1.2rem" width="98%" className="mb-2" />
      <Skeleton height="1.2rem" width="92%" className="mb-2" />
    </div>
  </div>
);

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [backHref, setBackHref] = useState('/');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const summaryAttempted = useRef(false);
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const fetchPost = useCallback(async () => {
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Fetch post without likes join first
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:users(id, name, role)')
        .eq('id', id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        const transformed = {
          ...data,
          likes_count: 0,
          user_has_liked: false
        };

        // 3. Try to fetch likes separately
        try {
          const { data: likesData } = await supabase
            .from('likes')
            .select('user_id')
            .eq('post_id', id);

          if (likesData) {
            transformed.likes_count = likesData.length;
            transformed.user_has_liked = likesData.some(l => l.user_id === user?.id);
          }
        } catch (likeErr) {
          console.warn('Likes table missing or error:', likeErr);
        }

        setPost(transformed as Post);
      }
    } catch (err) {
      console.error('fetchPost crashed:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchPost();
    
    // 2. Determine back link based on deterministic session tracking
    if (typeof window !== 'undefined') {
      const target = sessionStorage.getItem('hivon_back_target');
      if (target) {
        setBackHref(target);
      }
    }
  }, [fetchPost]);

  // 3. Background AI Summary generation - strictly controlled
  // 3. Background AI Summary generation - strictly controlled automated loop
  useEffect(() => {
    if (post && !post.summary && !loading && !isSummarizing && !summaryAttempted.current) {
      // Mark as attempted BEFORE everything to stop the loop immediately
      summaryAttempted.current = true;

      const generateInitialSummary = async () => {
        setIsSummarizing(true);
        try {
          // Add a small delay for aesthetic effect
          await new Promise(r => setTimeout(r, 1200));
          
          const res = await fetch('/api/generate-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: post.body }),
          });
          
          const data = await res.json();
          if (data.summary) {
            await supabase
              .from('posts')
              .update({ summary: data.summary })
              .eq('id', id);
            setPost({ ...post, summary: data.summary });
          } else {
            // Quota hit or engine busy - use fallback
            const fallback = "✦ Our AI is busy right now, but your intelligence is not. We will be back soon with a fresh summary.";
            console.warn('AI engine at capacity. Using fallback summary.');
            
            await supabase
              .from('posts')
              .update({ summary: fallback })
              .eq('id', id);
            setPost({ ...post, summary: fallback });
          }
        } catch (err) {
          console.error('Background summary failed:', err);
          const fallback = "✦ Our AI is busy right now, but your intelligence is not. We will be back soon with a fresh summary.";
          setPost({ ...post, summary: fallback });
        } finally {
          setIsSummarizing(false);
        }
      };
      generateInitialSummary();
    }
  }, [post?.summary, loading, isSummarizing, id, supabase]);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await supabase.from('posts').delete().eq('id', id);
      router.push('/');
    } catch (err) {
      console.error('Delete failed:', err);
      setLoading(false);
    }
  };

  const regenerateSummary = async () => {
    if (!post) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: post.body }),
      });
      const data = await res.json();
      if (data.summary) {
        const { error } = await supabase
          .from('posts')
          .update({ summary: data.summary })
          .eq('id', id);
        if (error) throw error;
        setPost({ ...post, summary: data.summary });
        alert('✦ AI Summary updated successfully!');
      } else {
        const fallback = "✦ Our AI is busy right now, but your intelligence is not. We will be back soon with a fresh summary.";
        const { error: fallbackError } = await supabase
          .from('posts')
          .update({ summary: fallback })
          .eq('id', id);
        
        if (!fallbackError) {
          setPost({ ...post, summary: fallback });
        }
        
        alert('✦ AI engine is currently at capacity. A placeholder summary has been placed for now.');
      }
    } catch (err: any) {
      console.error('Manual regeneration failed:', err);
      alert('⚠️ System busy. Please try again in 1 minute.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  const canEdit =
    profile?.role === 'admin' || profile?.id === post?.author_id;

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <PostDetailSkeleton />
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <h3>Post not found</h3>
            <p>This post may have been removed.</p>
            <Link href="/" className="btn btn-secondary">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <article className="post-detail fade-in">
          {/* Back button (Bulletproof Navigation) */}
          <button 
            onClick={() => {
              const target = sessionStorage.getItem('hivon_back_target') || '/';
              // If going back to home, add a flag to skip the intro gallery
              const finalPath = target === '/' ? '/?feed=true' : target;
              router.push(finalPath);
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: 0,
              color: 'var(--text-muted)', 
              fontSize: '0.875rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              marginBottom: '32px',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>

          {/* Featured Image - FAANG Fix: Optimized delivery */}
          {post.image_url && (
            <Image
              src={post.image_url}
              alt={post.title}
              width={1200}
              height={600}
              priority
              className="post-detail-hero"
              style={{ objectFit: 'cover' }}
            />
          )}

          {/* Meta */}
          <div className="post-detail-meta">
            <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
              {post.author?.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {post.author?.name?.toUpperCase() === 'ADMIN USER' ? 'ADMIN' : post.author?.name}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-muted)' }}>{formatDate(post.created_at)}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--accent)' }}>
              {Math.max(1, Math.ceil(post.body.split(' ').length / 200))} min read
            </span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <div style={{ transform: 'translateY(1px)' }}>
              <LikeButton
                postId={post.id}
                initialLikes={post.likes_count || 0}
                initialHasLiked={post.user_has_liked || false}
                size="sm"
              />
            </div>

            {/* Edit/Delete actions */}
            {canEdit && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <Link href={`/posts/${id}/edit`} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  Edit
                </Link>
                {profile?.role === 'admin' && (
                  <button onClick={handleDelete} className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          <h1 className="post-detail-title font-display">{post.title}</h1>

          {/* AI Summary Card */}
          {post.summary ? (
            <div className="summary-card fade-in">
              <div className="summary-label" style={{ marginBottom: '12px', fontSize: '0.7rem', color: 'var(--accent)' }}>AI SUMMARY</div>
              <p>{post.summary}</p>
            </div>
          ) : (
            <div className="summary-card" style={{ 
              background: 'rgba(167,139,250,0.05)', 
              borderColor: 'rgba(167,139,250,0.2)', 
              padding: '24px', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div className="loader-progress" style={{ width: '100%', maxWidth: '200px', height: '2px', marginTop: 0 }}>
                <div className="loader-progress-bar"></div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                ✦ Analysis in progress: Generating AI Intelligence...
              </p>
            </div>
          )}

          {/* Body */}
          <div className="post-body">
            {post.body.split('\n').map((para, i) =>
              para.trim() ? <p key={i}>{para}</p> : null
            )}
          </div>

          {/* Comments */}
          <CommentSection postId={post.id} />
        </article>

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmText="Delete Permanently"
          cancelText="Keep Post"
        />
      </div>
    </div>
  );
}
