'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import { Skeleton } from '@/components/ui/Skeleton';

export default function Navbar() {
  const { profile, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link href="/?feed=true" className="navbar-brand">
          <div className="navbar-logo">✦</div>
          Hivon Blogs
        </Link>

        <div className="navbar-links">
          <Link href="/?feed=true" className="navbar-link">Home</Link>

          {loading ? (
            <div style={{ display: 'flex', gap: '20px', marginLeft: '12px' }}>
              <Skeleton width="60px" height="1rem" borderRadius="4px" />
              <Skeleton width="50px" height="1rem" borderRadius="4px" />
            </div>
          ) : profile ? (
            <>
              {(profile.role === 'author' || profile.role === 'admin') && (
                <>
                  <Link href="/dashboard" className="navbar-link">
                    Dashboard
                  </Link>
                  <Link href="/posts/create" className="navbar-link">
                    + Write
                  </Link>
                </>
              )}
            </>
          ) : null}
        </div>

        <div className="navbar-user">
          {loading ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Skeleton width="80px" height="32px" borderRadius="16px" />
              <Skeleton width="32px" height="32px" circle />
            </div>
          ) : profile ? (
            <>
              <div className="user-badge">
                <div className="user-avatar">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{ 
                    fontWeight: 600, 
                    color: 'var(--text-primary)', 
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {profile.name?.toUpperCase() === 'ADMIN USER' ? 'ADMIN' : profile.name}
                </span>
              </div>
              <button onClick={handleSignOut} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
