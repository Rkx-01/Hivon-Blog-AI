'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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
        <Link href="/" className="navbar-brand">
          <div className="navbar-logo">✦</div>
          Hivon Blogs
        </Link>

        <div className="navbar-links">
          <Link href="/" className="navbar-link">Home</Link>

          {!loading && profile && (
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
              {profile.role === 'admin' && (
                <Link href="/admin" className="navbar-link">
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        <div className="navbar-user">
          {loading ? null : profile ? (
            <>
              <div className="user-badge">
                <div className="user-avatar">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`role-badge ${profile.role}`}
                >
                  {profile.role}
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
