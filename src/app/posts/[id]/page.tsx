'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types';
import { useAuth } from '@/context/AuthContext';
import CommentSection from '@/components/CommentSection';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const fetchPost = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(id, name, role)')
      .eq('id', id)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setPost(data as Post);
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleDelete = async () => {
    if (!confirm('Delete this post permanently?')) return;
    await supabase.from('posts').delete().eq('id', id);
    router.push('/');
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
          <div className="empty-state"><div className="empty-state-icon">⏳</div><h3>Loading post...</h3></div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Post not found</h3>
            <p>This post may have been removed.</p>
            <Link href="/" className="btn btn-primary">Back to Home</Link>
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
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.author?.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(post.created_at)}</span>

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
          {post.summary && (
            <div className="summary-card">
              <div className="summary-card-header">
                <span>✦</span> AI Summary
              </div>
              <p>{post.summary}</p>
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
