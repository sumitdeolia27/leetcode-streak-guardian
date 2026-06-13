'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NavUser {
  name: string;
  leetcodeUsername: string;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const displayUserName = 'Name';

  const loadSession = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      setUser(res.ok && data.user ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setSessionChecked(true);
    }
  };

  useEffect(() => {
    loadSession();
    window.addEventListener('focus', loadSession);
    window.addEventListener('auth-changed', loadSession);

    return () => {
      window.removeEventListener('focus', loadSession);
      window.removeEventListener('auth-changed', loadSession);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new Event('auth-changed'));
  };

  const guestLinks = [
    { href: '/', label: 'Home' },
    { href: '/signup', label: 'Sign Up', primary: true },
    { href: '/dashboard', label: 'Login' },
  ];

  const authLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard', primary: true },
  ];

  const links = user ? authLinks : guestLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-lc-border/30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lc-orange text-black font-black">
            SG
          </span>
          <div>
            <span className="text-lg font-bold text-lc-orange text-glow">
              Streak Guardian
            </span>
            <span className="hidden sm:inline text-xs text-gray-500 ml-2">
              for LeetCode
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {sessionChecked && links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.primary
                  ? 'btn-glow text-black font-bold px-5 py-2 rounded-lg text-sm'
                  : 'text-gray-400 hover:text-lc-orange transition-colors'
              }
            >
              {link.label}
            </Link>
          ))}
          {sessionChecked && user && (
            <div className="flex items-center gap-3 border-l border-lc-border/50 pl-5">
              <span className="max-w-36 truncate text-sm text-gray-400">
                {displayUserName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-lc-orange"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-400 hover:text-lc-orange"
          aria-label="Toggle navigation menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-lc-border/30 px-4 py-3 flex flex-col gap-3">
          {sessionChecked && user && (
            <p className="text-sm text-gray-500">
              Signed in as <span className="text-gray-300">{displayUserName}</span>
            </p>
          )}
          {sessionChecked && links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.primary
                  ? 'btn-glow text-black font-bold px-5 py-2 rounded-lg text-sm text-center'
                  : 'text-gray-400 hover:text-lc-orange transition-colors'
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {sessionChecked && user && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-left text-gray-400 hover:text-lc-orange transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
