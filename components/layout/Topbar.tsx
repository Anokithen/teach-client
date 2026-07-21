'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/layout/Logo';

interface TopbarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

export function Topbar({ onMenuClick, sidebarCollapsed, onSidebarToggle }: TopbarProps) {
  const { account, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-brand-900/95 px-4 py-3 text-white backdrop-blur lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-white hover:bg-white/10"
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <Logo compact />
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <button type="button" onClick={onSidebarToggle} className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/20" aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}>
          <svg className={`h-5 w-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {sidebarCollapsed && <div className="header-brand-reveal"><Logo /></div>}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-left text-sm font-medium text-white shadow-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-400"
          aria-expanded={menuOpen}
          aria-label="Open profile menu"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-400 bg-white/15 text-base font-bold text-white shadow-inner">
            {account?.name?.[0]?.toUpperCase() || '?'}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="max-w-[145px] truncate font-semibold leading-tight">{account?.name || 'My profile'}</span>
            <span className="mt-0.5 text-xs capitalize text-cyan-100">{account?.role || 'Account'}</span>
          </span>
          <svg className={`h-4 w-4 shrink-0 text-cyan-100 transition-transform ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-card">
              <div className="mb-1 border-b border-border px-3 py-2">
                <p className="truncate text-sm font-semibold text-brand-900">{account?.name || 'My profile'}</p>
                <p className="mt-0.5 text-xs capitalize text-muted">{account?.role || 'Account'}</p>
              </div>
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
