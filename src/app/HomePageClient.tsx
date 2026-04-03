'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/context/AuthContext';
import CircularGallery from '@/components/ui/circular-flip-card-gallery';
import { FullPageSkeleton } from '@/components/ui/Skeleton';
import { GradientBarsBackground } from '@/components/ui/gradient-bars-background';

const POSTS_PER_PAGE = 9;

interface HomePageClientProps {
  initialPosts: Post[];
  initialCount: number;
}

export default function HomePageClient({ initialPosts, initialCount }: HomePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFeedView = searchParams.get('feed') === 'true';
  const [hasHydrated, setHasHydrated] = useState(false);
  
  // Initialize with SSR data to prevent flash
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filtered, setFiltered] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false); // Initially false because we have initialPosts
  const [showBlog, setShowBlog] = useState(isFeedView);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { supabaseUser } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const handleStartReading = () => {
    router.push('/?feed=true');
    setShowBlog(true);
  };

  const fetchPosts = useCallback(async (abortSignal?: AbortSignal) => {
    // If it's the first page and we have initialPosts, we might skip the very first client-side load
    // but we need it for 'user_has_liked' state which is client-specific.
    setLoading(true);
    setFetchError(null);
    try {
      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const query = supabase
        .from('posts')
        .select(`
          *,
          author:users(id, name, role),
          likes(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (abortSignal) query.abortSignal(abortSignal);
      
      const { data: postsData, error: postsError, count } = await query;

      if (postsError) throw postsError;

      if (postsData) {
        setTotalCount(count || 0);
        let transformed = (postsData as any[]).map((post: any) => ({
          ...post,
          likes_count: post.likes?.[0]?.count || 0,
          user_has_liked: false
        }));

        if (supabaseUser) {
          try {
            const { data: userLikes } = await supabase
              .from('likes')
              .select('post_id')
              .eq('user_id', supabaseUser.id);
            
            if (userLikes) {
              const likedIds = new Set(userLikes.map(l => l.post_id));
              transformed = transformed.map(post => ({
                ...post,
                user_has_liked: likedIds.has(post.id)
              }));
            }
          } catch (likeErr) {
            console.warn('User likes fetch failed:', likeErr);
          }
        }

        setPosts(transformed as Post[]);
        setFiltered(transformed as Post[]);
      }
      setLoading(false);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('AbortError')) return;
      console.error('fetchPosts crashed:', err);
      setFetchError('Failed to fetch latest insights.');
      setLoading(false); 
    }
  }, [supabase, supabaseUser, page]);

  // Handle pagination/refresh
  useEffect(() => {
    if (!hasHydrated && page === 1) {
      setHasHydrated(true);
      return;
    }
    const controller = new AbortController();
    fetchPosts(controller.signal);
    return () => controller.abort();
  }, [fetchPosts, page, hasHydrated]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hivon_back_target', '/');
    }
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) {
      setFiltered(posts);
    } else {
      setFiltered(
        posts.filter(
          (p: Post) =>
            p.title.toLowerCase().includes(q) ||
            p.body.toLowerCase().includes(q) ||
            p.author?.name?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, posts]);

  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PER_PAGE));

  if (!showBlog) {
    return (
      <GradientBarsBackground
        numBars={15}
        gradientFrom="rgba(245, 158, 11, 0.4)" // Increased opacity for visibility
        gradientTo="rgba(245, 158, 11, 0)"     // Explicit transparent matching color
        animationDuration={3}
        backgroundColor="var(--bg-primary)"
      >
        <CircularGallery onStartReading={handleStartReading} posts={posts} />
      </GradientBarsBackground>
    );
  }

  // Only show skeleton if we are loading and have NO posts (shouldn't happen with SSR initialPosts)
  if (loading && posts.length === 0) {
    return <FullPageSkeleton />;
  }

  return (
    <div className="page fade-in">
      <div className="container">
        {/* Hero */}
        <section className="hero fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
          <h1 className="font-display" style={{ fontSize: '4.5rem', marginBottom: '24px', letterSpacing: '-0.04em' }}>The Hivon Chronicle.</h1>
          <p style={{ margin: '0 auto 40px', maxWidth: '720px', fontSize: '1.2rem', lineHeight: '1.6', opacity: 0.9, fontWeight: 300 }}>
            A premium home for modern editorial. Where deep human insight meets the precision of machine intelligence.
          </p>

          {/* Search */}
          <div className="search-bar-wrapper" style={{ display: 'flex', gap: '12px', maxWidth: '550px', margin: '0 auto 40px' }}>
            <input
              type="text"
              className="search-bar"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '14px 28px', flex: 1, background: 'rgba(0,0,0,0.02)' }}
              placeholder="Search for insights..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '0 24px' }}>SEARCH</button>
          </div>
        </section>

        {/* Posts Listing */}
        <section>
          <div className="section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {search ? `Results for "${search}"` : 'Latest Posts'}
              <span style={{ color: 'var(--text-muted)' }}>
                ({filtered.length})
              </span>
            </h2>
          </div>

          {fetchError && posts.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <h3 style={{ color: '#ef4444' }}>✦ System Anomaly</h3>
              <p style={{ marginBottom: '20px' }}>{fetchError}</p>
              <button onClick={() => fetchPosts()} className="btn btn-primary" style={{ background: '#ef4444' }}>RETRY CONNECTION</button>
            </div>
          ) : filtered.length === 0 && !loading ? (
            <div className="empty-state">
              <h3>{search ? 'No posts match your search.' : 'No posts yet.'}</h3>
              <p>{search ? 'Try different keywords.' : 'Be the first.'}</p>
            </div>
          ) : (
            <div className={`posts-grid ${loading ? 'opacity-50' : 'fade-in'}`}>
              {filtered.map((post: Post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
