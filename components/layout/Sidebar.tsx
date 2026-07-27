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
          className={`sidebar-kids fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 p-5 transition-all lg:static lg:translate-x-0 ${collapsed ? 'lg:w-20 lg:px-3' : 'lg:w-64'} ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`mb-8 px-1 ${collapsed ? 'lg:flex lg:justify-center' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <Logo compact={collapsed} />
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-cyan-100 transition-transform hover:bg-white/10 active:scale-90 lg:hidden" aria-label="Close menu">
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </button>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all hover:translate-x-0.5 ${collapsed ? 'lg:justify-center lg:px-2' : ''} ${
                  active
                    ? 'bg-white text-brand-900 shadow-lg after:absolute after:-right-5 after:h-7 after:w-1 after:rounded-l-full after:bg-brand-400 lg:after:-right-3'
                    : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <NavIcon href={item.href} active={active} />
                <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <p className={`px-1 text-xs text-blue-200 ${collapsed ? 'lg:hidden' : ''}`}>Learn. Listen. Grow. ✦</p>
      </aside>
    </>
  );
}

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const icon = href.includes('dashboard') ? '⌂' : href.includes('children') ? '●' : href.includes('book') ? '▤' : href.includes('voice') ? '◖' : href.includes('leaderboard') ? '★' : href.includes('account') ? '◉' : href.includes('parent') || href.includes('teacher') ? '♟' : '+';
  return <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-base ${active ? 'bg-brand-400/15 text-brand-600' : 'bg-white/10 text-cyan-100'}`} aria-hidden="true">{icon}</span>;
}
