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
import { ChildPinModal } from '@/components/children/ChildPinModal';
import { ApiErrorShape, Book, Child, MiniGame, VoiceProfile } from '@/lib/types';

const GAME_DETAILS: Record<string, { icon: string; goal: string; description: string }> = {
  word_puzzle: { icon: '🧩', goal: 'Word builder', description: 'Put mixed-up letters in the right order to build book words.' },
  spelling: { icon: '✏️', goal: 'Spelling practice', description: 'Type important words from the story carefully and correctly.' },
  quiz: { icon: '🌟', goal: 'Story word quiz', description: 'Choose words you remember from the book to check your understanding.' },
};

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [miniGames, setMiniGames] = useState<MiniGame[] | null>(null);
  const [children, setChildren] = useState<Child[] | null>(null);
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [childId, setChildId] = useState('');
  const [pendingChild, setPendingChild] = useState<Child | null>(null);
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

  function selectChild(value: string) {
    if (!value) {
      setChildId('');
      return;
    }
    setPendingChild(children?.find((child) => String(child.id) === value) || null);
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
        {book.cover_image_url && (
          // External admin-provided image URLs cannot be allowlisted at build time for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.cover_image_url} alt={`Cover for ${book.title}`} className="h-36 w-28 rounded-2xl object-cover shadow-card" />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-brand-900">Preview</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-brand-900/90">
            {book.text_content || 'No preview text available for this book.'}
          </p>
          {book.video_url && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-brand-400/20 bg-brand-400/5 p-3">
              <p className="mb-2 text-sm font-semibold text-brand-900">Watch the story</p>
              <video controls preload="metadata" src={book.video_url} className="w-full rounded-xl" />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-900">Start a reading session</h2>
          <form onSubmit={onStartSession} className="space-y-4">
            <Select label="Child" value={childId} onChange={(e) => selectChild(e.target.value)}>
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
                className="sparkle-book-card card block p-5 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="mb-3 block text-2xl" aria-hidden="true">{GAME_DETAILS[g.game_type]?.icon || '🎮'}</span>
                <h3 className="text-base font-semibold text-brand-900">{GAME_DETAILS[g.game_type]?.goal || g.game_type?.replace(/_/g, ' ')}</h3>
                <p className="mt-1 min-h-10 text-sm text-muted">{GAME_DETAILS[g.game_type]?.description || 'Complete the activity to practise this book.'}</p>
                <div className="mt-3 flex items-center justify-between"><Badge tone="neutral" className="capitalize">{g.difficulty}</Badge><span className="text-xs font-semibold text-brand-600">Play →</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <ChildPinModal child={pendingChild} onClose={() => setPendingChild(null)} onVerified={(child) => setChildId(String(child.id))} />
    </div>
  );
}
