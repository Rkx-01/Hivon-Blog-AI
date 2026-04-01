import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
}

function formatDate(dateStr: string) {
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
        {post.image_url ? (
          <Image
            src={post.image_url}
            alt={post.title}
            width={400}
            height={200}
            className="post-card-image"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        ) : (
          <div className="post-card-image-placeholder">📝</div>
        )}

        <div className="post-card-content">
          <div className="post-card-meta">
            <span>{post.author?.name || 'Anonymous'}</span>
            <span className="post-card-meta-dot">·</span>
            <span>{formatDate(post.created_at)}</span>
          </div>

          <h2 className="post-card-title">{post.title}</h2>

          {post.summary ? (
            <>
              <div className="ai-badge">✦ AI Summary</div>
              <p className="post-card-summary">{post.summary}</p>
            </>
          ) : (
            <p className="post-card-summary" style={{ whiteSpace: 'pre-wrap' }}>
              {post.body.slice(0, 180)}{post.body.length > 180 ? '...' : ''}
            </p>
          )}

          <div className="post-card-footer">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Read more →</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
