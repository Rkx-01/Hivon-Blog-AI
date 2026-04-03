import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import HomePageClient from './HomePageClient';
import { FullPageSkeleton } from '@/components/ui/Skeleton';

export const revalidate = 360; // Cache for 6 minutes at the edge

export default async function HomePage() {
  const supabase = await createClient();
  
  // Initial Fetch on Server
  const { data: postsData, count } = await supabase
    .from('posts')
    .select(`
      *,
      author:users(id, name, role),
      likes(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 8); // First 9 posts (POSTS_PER_PAGE - 1)

  const { data: { user } } = await supabase.auth.getUser();

  let likedPostIds = new Set<string>();
  if (user) {
    const { data: userLikes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id);
    if (userLikes) {
      likedPostIds = new Set(userLikes.map(l => l.post_id || ''));
    }
  }

  const initialPosts = (postsData || []).map((post: any) => ({
    ...post,
    likes_count: post.likes?.[0]?.count || 0,
    user_has_liked: likedPostIds.has(post.id)
  }));

  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <HomePageClient initialPosts={initialPosts} initialCount={count || 0} />
    </Suspense>
  );
}
