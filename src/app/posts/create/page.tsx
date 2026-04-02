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
  const [publishState, setPublishState] = useState<'idle' | 'processing' | 'success'>('idle');
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

    setPublishState('processing');

    // Force the cool hyper-speed animation to display for at least 3 seconds
    // so the visual layout doesn't just flash instantly on fast networks.
    const minAnimationTime = new Promise(resolve => setTimeout(resolve, 3000));

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

    // Create a promise that rejects after 10 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out (10s)')), 10000)
    );

    try {
      // Wrap the insert and animation wait in a timeout
      await Promise.race([
        (async () => {
          // 2. Create post in Supabase
          console.log('Inserting post into Supabase...');
          const { data: postData, error: insertError } = await supabase
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

          console.log('Supabase insert finished. Error:', insertError);

          // Always wait for the minimum animation duration to complete
          await minAnimationTime;

          if (insertError) {
            throw insertError;
          }

          if (!postData) {
            throw new Error('No data returned from server.');
          }

          console.log('Publish successful! Redirecting...');
          setPublishState('success');

          setTimeout(() => {
            router.push(`/posts/${postData.id}`);
          }, 1000);
        })(),
        timeoutPromise
      ]);

    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(`Critical Error: ${err.message || 'Unknown error'}`);
      setAiStatus('');
      setLoading(false);
      setPublishState('idle');
    }
  };

  if (authLoading) return null;

  return (
    <div className="page">
      {publishState !== 'idle' && (
        <div className="publishing-overlay">
          <style dangerouslySetInnerHTML={{
            __html: `
            .publishing-overlay {
              position: fixed;
              inset: 0;
              background-color: rgba(247, 244, 237, 0.85); /* Ivory matched glassmorphism */
              backdrop-filter: blur(16px); /* Stronger blur for light mode */
              -webkit-backdrop-filter: blur(16px);
              z-index: 9999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              border: 1px solid rgba(204, 255, 0, 0.1);
            }
            .noise-bg {
              position: absolute; top: 0; left: 0; right: 0; bottom: 0;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
              opacity: 0.03; pointer-events: none;
            }
            .loader-container { position: relative; width: 100%; max-width: 600px; height: 250px; display: flex; align-items: center; justify-content: center; }
            .loader { position: absolute; top: 50%; margin-left: -50px; left: 50%; animation: speeder 0.4s linear infinite; z-index: 10; }
            .loader > span { height: 5px; width: 35px; background: var(--accent); position: absolute; top: -19px; left: 60px; border-radius: 2px 10px 1px 0; }
            .base span { position: absolute; width: 0; height: 0; border-top: 6px solid transparent; border-right: 100px solid var(--text-primary); border-bottom: 6px solid transparent; }
            .base span:before { content: ""; height: 22px; width: 22px; border-radius: 50%; background: var(--text-primary); position: absolute; right: -110px; top: -16px; }
            .base span:after { content: ""; position: absolute; width: 0; height: 0; border-top: 0 solid transparent; border-right: 55px solid var(--text-primary); border-bottom: 16px solid transparent; top: -16px; right: -98px; }
            .face { position: absolute; height: 12px; width: 20px; background: var(--text-primary); border-radius: 20px 20px 0 0; transform: rotate(-40deg); right: -125px; top: -15px; }
            .face:after { content: ""; height: 12px; width: 12px; background: var(--text-primary); right: 4px; top: 7px; position: absolute; transform: rotate(40deg); transform-origin: 50% 50%; border-radius: 0 0 0 2px; }
            .loader > span > span:nth-child(1), .loader > span > span:nth-child(2), .loader > span > span:nth-child(3), .loader > span > span:nth-child(4) { width: 30px; height: 1px; background: var(--accent); position: absolute; animation: fazer1 0.2s linear infinite; }
            .loader > span > span:nth-child(2) { top: 3px; animation: fazer2 0.4s linear infinite; }
            .loader > span > span:nth-child(3) { top: 1px; animation: fazer3 0.4s linear infinite; animation-delay: -1s; }
            .loader > span > span:nth-child(4) { top: 4px; animation: fazer4 1s linear infinite; animation-delay: -1s; }
            @keyframes fazer1 { 0% { left: 0; } 100% { left: -80px; opacity: 0; } }
            @keyframes fazer2 { 0% { left: 0; } 100% { left: -100px; opacity: 0; } }
            @keyframes fazer3 { 0% { left: 0; } 100% { left: -50px; opacity: 0; } }
            @keyframes fazer4 { 0% { left: 0; } 100% { left: -150px; opacity: 0; } }
            @keyframes speeder {
              0% { transform: translate(2px, 1px) rotate(0deg); }
              10% { transform: translate(-1px, -3px) rotate(-1deg); }
              20% { transform: translate(-2px, 0px) rotate(1deg); }
              30% { transform: translate(1px, 2px) rotate(0deg); }
              40% { transform: translate(1px, -1px) rotate(1deg); }
              50% { transform: translate(-1px, 3px) rotate(-1deg); }
              60% { transform: translate(-1px, 1px) rotate(0deg); }
              70% { transform: translate(3px, 1px) rotate(-1deg); }
              80% { transform: translate(-2px, -1px) rotate(1deg); }
              90% { transform: translate(2px, 1px) rotate(0deg); }
              100% { transform: translate(1px, -2px) rotate(-1deg); }
            }
            .longfazers { position: absolute; width: 100%; height: 100%; overflow: hidden; pointer-events: none; }
            .longfazers span { position: absolute; height: 2px; width: 20%; background: var(--accent); opacity: 0.2; }
            .longfazers span:nth-child(1) { top: 20%; animation: lf 0.6s linear infinite; animation-delay: -5s; }
            .longfazers span:nth-child(2) { top: 40%; animation: lf2 0.8s linear infinite; animation-delay: -1s; }
            .longfazers span:nth-child(3) { top: 60%; animation: lf3 0.6s linear infinite; }
            .longfazers span:nth-child(4) { top: 80%; animation: lf4 0.5s linear infinite; animation-delay: -3s; }
            @keyframes lf { 0% { left: 200%; } 100% { left: -200%; opacity: 0; } }
            @keyframes lf2 { 0% { left: 200%; } 100% { left: -200%; opacity: 0; } }
            @keyframes lf3 { 0% { left: 200%; } 100% { left: -100%; opacity: 0; } }
            @keyframes lf4 { 0% { left: 200%; } 100% { left: -100%; opacity: 0; } }
            .loader-content { text-align: center; margin-top: 32px; z-index: 20; }
            .loader-title { font-family: var(--font-serif); font-size: 32px; font-weight: 700; text-transform: uppercase; color: var(--text-primary); margin-bottom: 12px; animation: pulse-title 1.5s infinite; }
            @keyframes pulse-title { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            .loader-subtitle { font-family: var(--font-sans); color: var(--text-muted); font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; font-size: 12px; }
            .loader-progress { width: 256px; height: 4px; background-color: rgba(0,0,0,0.05); border: 1px solid var(--border); border-radius: 9999px; margin: 32px auto 0; overflow: hidden; position: relative; }
            .loader-progress-bar { height: 100%; background-color: var(--accent); width: 33%; animation: prog-loop 3s ease-in-out infinite; }
            @keyframes prog-loop { 0% { transform: translateX(-100%); } 50% { transform: translateX(50%); } 100% { transform: translateX(200%); } }
            .loader-success { color: var(--accent); font-family: var(--font-serif); font-size: 42px; text-transform: uppercase; animation: slide-up 0.4s ease-out; }
            @keyframes slide-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
          `}} />
          <div className="noise-bg"></div>

          {publishState === 'processing' ? (
            <>
              <div className="longfazers">
                <span></span><span></span><span></span><span></span>
              </div>
              <div className="loader-container">
                <div className="loader">
                  <span><span></span><span></span><span></span><span></span></span>
                  <div className="base"><span></span><div className="face"></div></div>
                </div>
              </div>
              <div className="loader-content">
                <h1 className="loader-title">Publishing...</h1>
                <div className="loader-progress">
                  <div className="loader-progress-bar"></div>
                </div>
              </div>
            </>
          ) : (
            <div className="loader-success">
              ✦ Blog Published
            </div>
          )}
        </div>
      )}

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
