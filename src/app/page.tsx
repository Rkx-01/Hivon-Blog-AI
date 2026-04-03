import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import HomePageClient from './HomePageClient';
import { FullPageSkeleton } from '@/components/ui/Skeleton';

export const dynamic = 'force-dynamic';

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

  const initialPosts = (postsData || []).map((post: any) => ({
    ...post,
    likes_count: post.likes?.[0]?.count || 0,
    user_has_liked: false // Server can't easily determine this without more auth logic, handled by client hydration
  }));

  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <HomePageClient initialPosts={initialPosts} initialCount={count || 0} />
    </Suspense>
  );
}
