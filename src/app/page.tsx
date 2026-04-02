'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types';
import PostCard from '@/components/PostCard';

const POSTS_PER_PAGE = 9;

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filtered, setFiltered] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchPosts = useCallback(async () => {
    try {
      // 1. Get current user safely
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Fetch posts WITHOUT the 'likes' join first (to prevent PGRST200 if table missing)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, author:users(id, name, role)')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (postsData) {
        let transformed = (postsData as any[]).map((post: any) => ({
          ...post,
          likes_count: 0,
          user_has_liked: false
        }));

        try {
          const { data: likesData } = await supabase
            .from('likes')
            .select('post_id, user_id');
          
          if (likesData) {
            transformed = transformed.map((post: any) => ({
              ...post,
              likes_count: (likesData as any[]).filter((l: any) => l.post_id === post.id).length,
              user_has_liked: (likesData as any[]).some((l: any) => l.post_id === post.id && l.user_id === user?.id)
            }));
          }
        } catch (likeErr) {
          console.warn('Likes table not available or error:', likeErr);
        }

        setPosts(transformed as Post[]);
        setFiltered(transformed as Post[]);
      }
    } catch (err) {
      console.error('fetchPosts crashed:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) {
      setFiltered(posts);
    } else {
      setFiltered(
        posts.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.body.toLowerCase().includes(q) ||
            p.author?.name?.toLowerCase().includes(q)
        )
      );
    }
    setPage(1);
  }, [search, posts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <section className="hero fade-in" style={{ textAlign: 'center', padding: '100px 0' }}>
          <h1 className="font-display" style={{ fontSize: '4.5rem', marginBottom: '24px', letterSpacing: '-0.03em' }}>The Modern Signal.</h1>
          <p style={{ margin: '0 auto 48px', maxWidth: '650px', fontSize: '1.25rem', opacity: 0.9 }}>
            High-velocity intelligence for the digital frontier. <br/>
            Where human creativity meets machine precision.
          </p>

          {/* Search */}
          <div className="search-bar-wrapper" style={{ display: 'flex', gap: '12px', maxWidth: '550px', margin: '0 auto 80px' }}>
            <input
              type="text"
              className="search-bar"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '14px 28px', flex: 1, background: 'rgba(0,0,0,0.02)' }}
              placeholder="Find the pulse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '0 24px' }}>SEARCH</button>
          </div>
        </section>

        {/* Posts Listing */}
        <section>
          <div className="section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
              {search ? `Results for "${search}"` : 'Latest Posts'}
              {!loading && (
                <span style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>
                  ({filtered.length})
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="empty-state">
              <h3>Loading...</h3>
            </div>
          ) : paginated.length === 0 ? (
            <div className="empty-state">
              <h3>{search ? 'No posts match your search.' : 'No posts yet.'}</h3>
              <p>{search ? 'Try different keywords.' : 'Be the first.'}</p>
            </div>
          ) : (
            <div className="posts-grid fade-in">
              {paginated.map((post) => (
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
