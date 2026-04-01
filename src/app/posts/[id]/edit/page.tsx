'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { profile, supabaseUser } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const fetchPost = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, author:users(id, name, role)')
      .eq('id', id)
      .single();

    if (data) {
      setPost(data as Post);
      setTitle(data.title);
      setBody(data.body);
      setImageUrl(data.image_url || '');
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Check authorization
  useEffect(() => {
    if (!loading && post) {
      const canEdit = profile?.role === 'admin' || post.author_id === supabaseUser?.id;
      if (!canEdit) router.push('/');
    }
  }, [loading, post, profile, supabaseUser, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { error } = await supabase
      .from('posts')
      .update({ title, body, image_url: imageUrl || null })
      .eq('id', id);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push(`/posts/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state"><div className="empty-state-icon">⏳</div><h3>Loading...</h3></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="post-form-page">
          <div className="page-header">
            <Link href={`/posts/${id}`} style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>← Back to post</Link>
            <h1 style={{ marginTop: '16px' }}>Edit Post</h1>
            <p>Update your post content. The existing AI summary will be preserved.</p>
          </div>

          <div className="post-form-card">
            <form onSubmit={handleSave} className="form-stack">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Featured Image URL</label>
                <input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label htmlFor="body">Body *</label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  minLength={50}
                  style={{ minHeight: '300px' }}
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-actions">
                <Link href={`/posts/${id}`} className="btn btn-secondary">Cancel</Link>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
