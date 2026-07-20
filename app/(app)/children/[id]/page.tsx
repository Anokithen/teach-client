'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { childrenApi } from '@/lib/endpoints';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ApiErrorShape, Child, GameResult, LeaderboardEntry, ReadingLevel, ReadingSession } from '@/lib/types';

const READING_LEVELS: ReadingLevel[] = ['beginner', 'intermediate', 'advanced'];

interface EditForm {
  name: string;
  age: number | string;
  reading_level: ReadingLevel;
}

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [child, setChild] = useState<Child | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[] | null>(null);
  const [gameResults, setGameResults] = useState<GameResult[] | null>(null);
  const [leaderboardEntry, setLeaderboardEntry] = useState<LeaderboardEntry | null | undefined>(undefined); // undefined = loading, null = none
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saveError, setSaveError] = useState<string | string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      const [childRes, sessionsRes, gameResultsRes] = await Promise.all([
        childrenApi.get(id),
        childrenApi.sessions(id),
        childrenApi.gameResults(id),
      ]);
      setChild(childRes.data.child);
      setForm({
        name: childRes.data.child.name,
        age: childRes.data.child.age,
        reading_level: childRes.data.child.reading_level,
      });
      setSessions(sessionsRes.data.reading_sessions);
      setGameResults(gameResultsRes.data.game_results);
    } catch (err) {
      setError((err as ApiErrorShape).message);
      return;
    }
    try {
      const entryRes = await childrenApi.leaderboardEntry(id, 'current');
      setLeaderboardEntry(entryRes.data.leaderboard_entry || null);
    } catch (err) {
      setLeaderboardEntry(null);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaveError(null);
    setSaving(true);
    try {
      const res = await childrenApi.update(id, {
        name: form.name,
        age: Number(form.age),
        reading_level: form.reading_level,
      });
      setChild(res.data.child);
      setEditing(false);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setSaveError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await childrenApi.remove(id);
      router.push('/children');
    } catch (err) {
      setError((err as ApiErrorShape).message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!child || !form) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <Link href="/children" className="text-sm font-medium text-brand-600 hover:underline">
        &larr; All children
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">{child.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone="brand">{child.reading_level}</Badge>
            <span className="text-sm text-muted">Age {child.age}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      {editing && (
        <Card className="mt-5">
          <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Age"
              type="number"
              min={1}
              max={18}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
            <Select
              label="Reading level"
              value={form.reading_level}
              onChange={(e) => setForm({ ...form, reading_level: e.target.value as ReadingLevel })}
            >
              {READING_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
            <div className="sm:col-span-3">
              <Alert>{saveError}</Alert>
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total sessions</p>
          <p className="mt-2 text-2xl font-semibold text-brand-900">{child.stats?.total_sessions ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Games played</p>
          <p className="mt-2 text-2xl font-semibold text-brand-900">{child.stats?.total_game_results ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">This week&apos;s points</p>
          <p className="mt-2 text-2xl font-semibold text-brand-900">
            {leaderboardEntry === undefined ? <Spinner size={18} /> : leaderboardEntry?.points ?? 0}
          </p>
          {leaderboardEntry?.streak_count ? (
            <p className="mt-1 text-xs text-muted">Streak: {leaderboardEntry.streak_count} days</p>
          ) : null}
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-900">Reading sessions</h2>
          {sessions && sessions.length === 0 && (
            <EmptyState title="No reading sessions yet" description="Start one from a book's page." />
          )}
          {sessions && sessions.length > 0 && (
            <ul className="divide-y divide-border">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      href={`/reading-sessions/${s.id}`}
                      className="text-sm font-medium text-brand-900 hover:underline"
                    >
                      Session #{s.id}
                    </Link>
                    <p className="text-xs text-muted">
                      Started {new Date(s.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge tone={s.is_complete ? 'success' : 'warning'}>
                    {s.is_complete ? 'Complete' : 'In progress'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-900">Mini-game results</h2>
          {gameResults && gameResults.length === 0 && (
            <EmptyState title="No games played yet" description="Points from mini-games will show up here." />
          )}
          {gameResults && gameResults.length > 0 && (
            <ul className="divide-y divide-border">
              {gameResults.map((g) => (
                <li key={g.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-brand-900">Game #{g.game_id}</span>
                  <span className="font-semibold text-brand-600">{g.score} pts</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        loading={deleting}
        title={`Delete ${child.name}?`}
        description="This permanently removes this child's sessions, game results, and leaderboard entries."
        confirmLabel="Delete child"
      />
    </div>
  );
}
