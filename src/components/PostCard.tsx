import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import LikeButton from './LikeButton';

interface PostCardProps {
  post: Post;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Unknown date';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.id}`} style={{ textDecoration: 'none' }}>
      <article className="post-card">
        <div className="post-card-meta">
          <span className="post-card-category">
            {post.author?.role === 'admin' ? 'Featured' : 'Story'}
          </span>
          <span className="post-card-meta-dot">·</span>
          <span>{formatDate(post.created_at)}</span>
        </div>

        <h2 className="post-card-title">{post.title}</h2>

        <div className="post-card-summary-box">
          <div className="summary-label">The Signal</div>
          <p className="post-card-summary">
            {post.summary || (post.body.slice(0, 140) + '...')}
          </p>
        </div>

        {post.image_url && (
          <div className="post-card-image-wrapper">
             <Image
              src={post.image_url}
              alt={post.title}
              width={400}
              height={200}
              className="post-card-image"
              unoptimized
            />
          </div>
        )}

        <div className="post-card-footer">
          <span className="read-more">Continue reading</span>
          <div className="post-card-actions">
            <LikeButton 
              postId={post.id} 
              initialLikes={post.likes_count || 0} 
              initialHasLiked={post.user_has_liked || false}
              size="sm"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
