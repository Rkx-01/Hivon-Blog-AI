'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types';
import { useAuth } from '@/context/AuthContext';
import CommentSection from '@/components/CommentSection';
import LikeButton from '@/components/LikeButton';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
  }, [fetchPost]);

  const handleDelete = async () => {
    if (!confirm('Delete this post permanently?')) return;
    await supabase.from('posts').delete().eq('id', id);
    router.push('/');
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
        alert('✦ AI Summary updated!');
      } else {
        alert('⚠️ AI Summary could not be generated: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
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
          <div className="empty-state"><h3>Loading post...</h3></div>
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
          {/* Back link */}
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
            ← All Posts
          </Link>

          {/* Featured Image */}
          {post.image_url && (
            <Image
              src={post.image_url}
              alt={post.title}
              width={800}
              height={400}
              className="post-detail-hero"
              unoptimized
            />
          )}

          {/* Meta */}
          <div className="post-detail-meta">
            <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
              {post.author?.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{post.author?.name}</span>
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
            <div className="summary-card">
              <p>{post.summary}</p>
            </div>
          ) : canEdit && (
            <div className="summary-card" style={{ borderStyle: 'dashed', opacity: 0.7, padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>No summary found for this intelligence node.</p>
              <button onClick={regenerateSummary} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                ✦ Generate AI Summary Now
              </button>
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
      </div>
    </div>
  );
}
