'use client';

import { FormEvent, useEffect, useState } from 'react';
import { leaderboardApi, childrenApi } from '@/lib/endpoints';
import { useAuth } from '@/lib/auth-context';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ApiErrorShape, LeaderboardResponse } from '@/lib/types';

export default function LeaderboardPage() {
  const { isAdmin } = useAuth();
  const [week, setWeek] = useState('current');
  const [weekInput, setWeekInput] = useState('');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myChildIds, setMyChildIds] = useState<number[]>([]);

  useEffect(() => {
    if (isAdmin) return;
    childrenApi
      .list()
      .then((res) => setMyChildIds(res.data.children.map((c: { id: number }) => c.id)))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    leaderboardApi
      .list(week)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError((err as ApiErrorShape).message);
      });
    return () => {
      cancelled = true;
    };
  }, [week]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted">
            {data?.week_start ? `Week of ${new Date(data.week_start).toLocaleDateString()}` : 'Ranked by points'}
          </p>
        </div>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setWeek(weekInput || 'current');
          }}
          className="flex w-full flex-wrap items-end gap-2 sm:w-auto"
        >
          <Input
            label="Week (YYYY-MM-DD)"
            placeholder="current"
            className="min-w-0 flex-1 sm:w-44 sm:flex-none"
            value={weekInput}
            onChange={(e) => setWeekInput(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Go
          </Button>
          {week !== 'current' && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setWeekInput('');
                setWeek('current');
              }}
            >
              This week
            </Button>
          )}
        </form>
      </div>

      <div className="mt-6">
        {!data && !error && (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        )}
        {error && <Alert>{error}</Alert>}
        {data && data.leaderboard.length === 0 && (
          <EmptyState title="No points logged for this week" />
        )}
        {data && data.leaderboard.length > 0 && (
          <Table columns={['Rank', 'Child', 'Points', 'Streak']}>
            {data.leaderboard.map((entry) => {
              const mine = myChildIds.includes(entry.child_id);
              return (
                <tr key={entry.id} className={mine ? 'bg-brand-400/10' : ''}>
                  <td className="px-4 py-3 font-medium text-brand-900">#{entry.rank}</td>
                  <td className="px-4 py-3 text-brand-900">
                    {entry.child_name}
                    {mine && <span className="ml-2 chip">Yours</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-600">{entry.points}</td>
                  <td className="px-4 py-3 text-muted">{entry.streak_count ?? 0}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </div>
  );
}
