'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { account, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-brand-900 hover:bg-bg lg:hidden"
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      <div className="hidden lg:block" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium text-brand-900 hover:bg-bg"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400/20 text-sm font-semibold text-brand-600">
            {account?.name?.[0]?.toUpperCase() || '?'}
          </span>
          <span className="hidden sm:inline">{account?.name}</span>
          <span className="chip hidden sm:inline">{account?.role}</span>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-card">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-brand-900 hover:bg-bg"
              >
                My account
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/5"
              >
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
