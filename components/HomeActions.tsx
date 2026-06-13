'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface HomeActionsProps {
  signedInLabel?: string;
  signedOutLabel?: string;
  loginLabel?: string;
}

export default function HomeActions({
  signedInLabel = 'Open Dashboard',
  signedOutLabel = 'Sign Up',
  loginLabel = 'Login',
}: HomeActionsProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        setIsLoggedIn(res.ok && Boolean(data.user));
      } catch {
        setIsLoggedIn(false);
      } finally {
        setChecked(true);
      }
    }

    loadSession();
    window.addEventListener('auth-changed', loadSession);

    return () => {
      window.removeEventListener('auth-changed', loadSession);
    };
  }, []);

  if (!checked) {
    return <div className="h-12" />;
  }

  if (isLoggedIn) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="btn-glow text-black font-bold px-5 py-3 rounded-lg"
        >
          {signedInLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/signup"
        className="btn-glow text-black font-bold px-5 py-3 rounded-lg"
      >
        {signedOutLabel}
      </Link>
      <Link
        href="/dashboard"
        className="border border-lc-border text-gray-300 hover:text-lc-orange hover:border-lc-orange/50 px-5 py-3 rounded-lg transition-colors"
      >
        {loginLabel}
      </Link>
    </div>
  );
}
