'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { childrenApi, leaderboardApi } from '@/lib/endpoints';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiErrorShape, Child, LeaderboardEntry } from '@/lib/types';

export default function DashboardPage() {
  const { account, isAdmin } = useAuth();
  const [children, setChildren] = useState<Child[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [childrenRes, leaderboardRes] = await Promise.all([
          childrenApi.list(),
          leaderboardApi.list('current'),
        ]);
        if (cancelled) return;
        setChildren(childrenRes.data.children);
        setLeaderboard(leaderboardRes.data.leaderboard);
      } catch (err) {
        if (!cancelled) setError((err as ApiErrorShape).message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-900">Welcome back, {account?.name?.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-muted">
        {isAdmin
          ? 'Here\u2019s a shortcut to platform management.'
          : 'Here\u2019s what\u2019s happening across your children\u2019s reading this week.'}
      </p>

      {isAdmin ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <DashboardLink href="/admin/parents" title="Manage parents" body="View, ban, or remove parent accounts." />
          <DashboardLink href="/admin/teachers" title="Manage teachers" body="View, ban, or remove teacher accounts." />
          <DashboardLink href="/children" title="All children" body="Browse every child profile on the platform." />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-900">Your children</h2>
              <Link href="/children" className="text-sm font-medium text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            {!children && !error && <Spinner />}
            {error && <p className="text-sm text-danger">{error}</p>}
            {children && children.length === 0 && (
              <EmptyState
                title="No children yet"
                description="Add a child profile to start assigning books and reading sessions."
                action={
                  <Link href="/children" className="btn-primary">
                    Add a child
                  </Link>
                }
              />
            )}
            {children && children.length > 0 && (
              <ul className="divide-y divide-border">
                {children.slice(0, 5).map((child) => (
                  <li key={child.id} className="flex items-center justify-between py-3">
                    <div>
                      <Link href={`/children/${child.id}`} className="font-medium text-brand-900 hover:underline">
                        {child.name}
                      </Link>
                      <p className="text-xs text-muted">Age {child.age}</p>
                    </div>
                    <Badge tone="brand">{child.reading_level}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-900">This week&apos;s leaders</h2>
              <Link href="/leaderboard" className="text-sm font-medium text-brand-600 hover:underline">
                Full board
              </Link>
            </div>
            {!leaderboard && !error && <Spinner />}
            {leaderboard && leaderboard.length === 0 && (
              <p className="text-sm text-muted">No points logged yet this week.</p>
            )}
            {leaderboard && leaderboard.length > 0 && (
              <ol className="space-y-2.5">
                {leaderboard.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between text-sm">
                    <span className="text-brand-900">
                      <span className="mr-2 text-muted">#{entry.rank}</span>
                      {entry.child_name}
                    </span>
                    <span className="font-semibold text-brand-600">{entry.points} pts</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function DashboardLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="card block p-5 transition-all hover:-translate-y-1 hover:shadow-md">
      <h3 className="mb-1 text-sm font-semibold text-brand-900">{title}</h3>
      <p className="text-sm text-muted">{body}</p>
    </Link>
  );
}
