'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { booksApi, childrenApi, voiceProfilesApi, sessionsApi } from '@/lib/endpoints';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiErrorShape, Book, Child, MiniGame, VoiceProfile } from '@/lib/types';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [miniGames, setMiniGames] = useState<MiniGame[] | null>(null);
  const [children, setChildren] = useState<Child[] | null>(null);
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [childId, setChildId] = useState('');
  const [voiceProfileId, setVoiceProfileId] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | string[] | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [bookRes, gamesRes, childrenRes] = await Promise.all([
          booksApi.get(id),
          booksApi.miniGames(id),
          childrenApi.list(),
        ]);
        setBook(bookRes.data.book);
        setMiniGames(gamesRes.data.mini_games);
        setChildren(childrenRes.data.children);
        if (childrenRes.data.children.length === 1) setChildId(String(childrenRes.data.children[0].id));
      } catch (err) {
        setError((err as ApiErrorShape).message);
      }
      try {
        const vpRes = await voiceProfilesApi.list();
        setVoiceProfiles(vpRes.data.voice_profiles.filter((v: VoiceProfile) => v.status === 'ready'));
      } catch (err) {
        // voice profiles are optional — ignore failure here
      }
    }
    load();
  }, [id]);

  async function onStartSession(e: FormEvent) {
    e.preventDefault();
    setStartError(null);
    if (!childId) {
      setStartError('Choose a child to start this session for.');
      return;
    }
    setStarting(true);
    try {
      const payload: { child_id: number; book_id: number; voice_profile_id?: number } = {
        child_id: Number(childId),
        book_id: Number(id),
      };
      if (voiceProfileId) payload.voice_profile_id = Number(voiceProfileId);
      const res = await sessionsApi.create(payload);
      router.push(`/reading-sessions/${res.data.reading_session.id}`);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setStartError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setStarting(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!book) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <Link href="/books" className="text-sm font-medium text-brand-600 hover:underline">
        &larr; All books
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">{book.title}</h1>
          <div className="mt-2 flex gap-2">
            <Badge tone="brand">{book.age_group}</Badge>
            <Badge tone="neutral">{book.reading_level}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-brand-900">Preview</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-brand-900/90">
            {book.text_content || 'No preview text available for this book.'}
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-900">Start a reading session</h2>
          <form onSubmit={onStartSession} className="space-y-4">
            <Select label="Child" value={childId} onChange={(e) => setChildId(e.target.value)}>
              <option value="">Choose a child</option>
              {children?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {voiceProfiles.length > 0 && (
              <Select
                label="Voice (optional)"
                value={voiceProfileId}
                onChange={(e) => setVoiceProfileId(e.target.value)}
              >
                <option value="">Default narration</option>
                {voiceProfiles.map((vp) => (
                  <option key={vp.id} value={vp.id}>
                    {vp.label || `Voice profile #${vp.id}`}
                  </option>
                ))}
              </Select>
            )}
            <Alert>{startError}</Alert>
            <Button type="submit" loading={starting} className="w-full">
              Start reading session
            </Button>
          </form>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold text-brand-900">Linked mini-games</h2>
        {miniGames && miniGames.length === 0 && (
          <EmptyState title="No mini-games linked to this book yet" />
        )}
        {miniGames && miniGames.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {miniGames.map((g) => (
              <Link
                key={g.id}
                href={`/mini-games/${g.id}`}
                className="card block p-5 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-sm font-semibold capitalize text-brand-900">
                  {g.game_type?.replace(/_/g, ' ')}
                </h3>
                <Badge tone="neutral" className="capitalize">
                  {g.difficulty}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
