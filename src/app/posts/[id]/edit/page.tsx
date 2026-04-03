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
  const [uploading, setUploading] = useState(false);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let newSummary = post?.summary || null;
      try {
        const res = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body }),
        });
        
        if (res.ok) {
          const { summary: generatedSummary } = await res.json();
          if (generatedSummary) newSummary = generatedSummary;
        } else {
          // Status 429 or other non-OK status
          console.warn('AI Summary regeneration failed (non-OK status).');
          if (!newSummary) {
            newSummary = "✦ Our AI is busy right now, but your intelligence is not. We will be back soon with a fresh summary.";
          }
        }
      } catch (aiErr) {
        console.error('AI Summary regeneration failed (exception):', aiErr);
        if (!newSummary) {
          newSummary = "✦ Our AI is busy right now, but your intelligence is not. We will be back soon with a fresh summary.";
        }
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update({ title, body, image_url: imageUrl || null, summary: newSummary })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
      } else {
        router.push(`/posts/${id}`);
      }
    } catch (err) {
      setError('An unexpected error occurred while saving.');
      setSaving(false);
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
            <p>Update your post content. The AI summary will be automatically regenerated to match your new text.</p>
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
                <label htmlFor="imageUrl">Featured Image</label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: '0 0 auto' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                      style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', zIndex: 2 }}
                    />
                    <button type="button" className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
                      {uploading ? '⌛ Uploading...' : '📁 Upload from Computer'}
                    </button>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</span>
                  <input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL"
                    style={{ flex: 1 }}
                  />
                </div>
                {imageUrl && (
                  <div style={{ position: 'relative', marginTop: '12px' }}>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setImageUrl('')}
                      style={{ 
                        position: 'absolute', top: '12px', right: '12px', 
                        background: 'rgba(0,0,0,0.5)', color: 'white', 
                        border: 'none', borderRadius: '4px', cursor: 'pointer', 
                        padding: '6px 10px', fontSize: '12px', backdropFilter: 'blur(4px)'
                      }}
                    >
                      ✕ Remove Image
                    </button>
                  </div>
                )}
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
