'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  borderRadius,
  circle 
}) => {
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '1rem',
    borderRadius: circle ? '50%' : (borderRadius || 'var(--radius-sm)'),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    display: 'inline-block',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div className={`skeleton-loader ${className}`} style={style}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .skeleton-loader {
          position: relative;
        }
        .skeleton-loader::after {
          content: "";
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.4) 20%,
            rgba(255, 255, 255, 0.7) 60%,
            rgba(255, 255, 255, 0)
          );
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export const PostCardSkeleton = () => (
  <div className="post-card" style={{ pointerEvents: 'none' }}>
    <Skeleton height="160px" borderRadius="var(--radius-md)" className="mb-4" />
    <div className="post-card-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Skeleton width="30%" height="0.7rem" className="mb-2" /> {/* Meta */}
      <Skeleton width="90%" height="1.5rem" className="mb-4" /> {/* Title */}
      <div style={{ flex: 1, marginBottom: '24px' }}>
        <Skeleton width="100%" height="0.85rem" className="mb-2" />
        <Skeleton width="95%" height="0.85rem" className="mb-2" />
        <Skeleton width="80%" height="0.85rem" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <Skeleton width="100px" height="1rem" />
        <Skeleton width="30px" height="24px" circle />
      </div>
    </div>
  </div>
);

export const NavbarSkeleton = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
    <Skeleton width="60px" height="1rem" />
    <Skeleton width="60px" height="1rem" />
    <Skeleton width="32px" height="32px" circle />
  </div>
);

export const FullPageSkeleton = () => (
  <div className="page fade-in" style={{ background: 'var(--bg-primary)', position: 'relative', zIndex: 20001 }}>
    <div className="container">
      {/* Hero Skeleton (Matches HomePageContent) */}
      <section style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Skeleton width="60%" height="4.5rem" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <Skeleton width="80%" height="1.2rem" />
        </div>
        
        {/* Search Bar Skeleton */}
        <div style={{ display: 'flex', gap: '12px', maxWidth: '550px', margin: '0 auto 40px' }}>
          <Skeleton width="100%" height="56px" borderRadius="var(--radius-full)" />
        </div>
      </section>

      {/* Grid Header Skeleton */}
      <div className="section-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
        <Skeleton width="150px" height="1rem" />
      </div>

      {/* Posts Grid Skeleton */}
      <div className="posts-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);
