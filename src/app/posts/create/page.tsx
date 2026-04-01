'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiStatus, setAiStatus] = useState('');
  const { profile, supabaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Redirect if not author/admin
  useEffect(() => {
    if (!authLoading && (!supabaseUser || (profile && profile.role === 'viewer'))) {
      router.push('/auth/login');
    }
  }, [authLoading, supabaseUser, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUser) return;

    setLoading(true);
    setError('');
    setAiStatus('✦ Generating AI summary...');

    // 1. Generate AI summary
    let summary: string | null = null;
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (data.summary) {
        summary = data.summary;
        setAiStatus('✦ Summary generated!');
      } else {
        setAiStatus('⚠️ Summary skipped (no API key or error).');
      }
    } catch {
      setAiStatus('⚠️ Summary generation failed, continuing without it.');
    }

    // 2. Create post in Supabase
    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        title,
        body,
        image_url: imageUrl || null,
        author_id: supabaseUser.id,
        summary,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setAiStatus('');
      setLoading(false);
      return;
    }

    router.push(`/posts/${post.id}`);
  };

  if (authLoading) return null;

  return (
    <div className="page">
      <div className="container">
        <div className="post-form-page">
          <div className="page-header">
            <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>← Back</Link>
            <h1 style={{ marginTop: '16px' }}>Create a New Post</h1>
            <p>Share your ideas with the world. An AI summary will be generated automatically.</p>
          </div>

          <div className="post-form-card">
            <form onSubmit={handleSubmit} className="form-stack">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a compelling title"
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
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    width={800}
                    height={200}
                    className="image-preview"
                    unoptimized
                    onError={() => setImageUrl('')}
                  />
                )}
              </div>

              <div className="form-group">
                <label htmlFor="body">Body *</label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your post content here... (use line breaks for paragraphs)"
                  required
                  minLength={50}
                  style={{ minHeight: '320px' }}
                />
              </div>

              {aiStatus && (
                <div className="alert" style={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>
                  {aiStatus}
                </div>
              )}

              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-actions">
                <Link href="/" className="btn btn-secondary">Cancel</Link>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Publishing...' : '✦ Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
