'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { getNavItems } from '@/components/layout/nav-items';
import { useAuth } from '@/lib/auth-context';

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}

export function Sidebar({ open, collapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const items = getNavItems({ isAdmin });

  return (
    <>
      {/* mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-brand-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
          className={`sidebar-kids fixed inset-y-4 left-4 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-y-auto overscroll-contain p-5 transition-all lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:max-h-none lg:inset-y-auto lg:left-auto lg:w-[276px] lg:shrink-0 lg:translate-x-0 ${collapsed ? 'lg:w-20 lg:px-3' : ''} ${
          open ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] pointer-events-none lg:pointer-events-auto'
        }`}
      >
        <div className={`mb-8 shrink-0 px-1 ${collapsed ? 'lg:flex lg:justify-center' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <Logo compact={collapsed} />
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-cyan-100 transition-transform hover:bg-white/10 active:scale-90 lg:hidden" aria-label="Close menu">
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </button>
          </div>
        </div>
        <nav aria-label="Main navigation" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all hover:translate-x-0.5 ${collapsed ? 'lg:justify-center lg:px-2' : ''} ${
                  active
                    ? 'sidebar-nav-active'
                    : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <NavIcon href={item.href} active={active} />
                <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={`mt-5 shrink-0 rounded-2xl border border-white/10 bg-white/10 p-3 text-xs text-blue-100 ${collapsed ? 'lg:hidden' : ''}`}>
          <p className="font-bold text-white">Read · Learn · Shine</p>
          <p className="mt-1 leading-5 text-blue-100/80">A little story every day makes a big difference.</p>
        </div>
      </aside>
    </>
  );
}

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const icon = href.includes('dashboard') ? '⌂' : href.includes('children') ? '●' : href.includes('book') ? '▤' : href.includes('voice') ? '◖' : href.includes('leaderboard') ? '★' : href.includes('account') ? '◉' : href.includes('parent') || href.includes('teacher') ? '♟' : '+';
  return <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-base ${active ? 'bg-brand-400/15 text-brand-600' : 'bg-white/10 text-cyan-100'}`} aria-hidden="true">{icon}</span>;
}
