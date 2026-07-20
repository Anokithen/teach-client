'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { sessionsApi } from '@/lib/endpoints';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ApiErrorShape, FeedbackType, ReadingSession, SessionFeedback } from '@/lib/types';

const FEEDBACK_TYPES: FeedbackType[] = ['praise', 'correction', 'tip'];

export default function ReadingSessionPage() {
  const { id } = useParams<{ id: string }>();

  const [session, setSession] = useState<ReadingSession | null>(null);
  const [feedback, setFeedback] = useState<SessionFeedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState('');
  const [accuracy, setAccuracy] = useState('');
  const [logError, setLogError] = useState<string | string[] | null>(null);
  const [logging, setLogging] = useState(false);

  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('praise');
  const [genError, setGenError] = useState<string | string[] | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      const [sessionRes, feedbackRes] = await Promise.all([
        sessionsApi.get(id),
        sessionsApi.listFeedback(id),
      ]);
      setSession(sessionRes.data.reading_session);
      setFeedback(feedbackRes.data.feedback);
    } catch (err) {
      setError((err as ApiErrorShape).message);
    }
  }

  async function onLogProgress(e: FormEvent) {
    e.preventDefault();
    setLogError(null);
    setLogging(true);
    try {
      const entry: { page?: number; accuracy?: number } = {};
      if (page) entry.page = Number(page);
      if (accuracy) entry.accuracy = Number(accuracy);
      const res = await sessionsApi.update(id, { progress_entry: entry });
      setSession(res.data.reading_session);
      setPage('');
      setAccuracy('');
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setLogError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setLogging(false);
    }
  }

  async function onMarkComplete() {
    setCompleting(true);
    try {
      const res = await sessionsApi.update(id, { mark_complete: true });
      setSession(res.data.reading_session);
      setConfirmComplete(false);
    } catch (err) {
      setError((err as ApiErrorShape).message);
    } finally {
      setCompleting(false);
    }
  }

  async function onGenerateFeedback(e: FormEvent) {
    e.preventDefault();
    setGenError(null);
    setGenerating(true);
    try {
      const res = await sessionsApi.generateFeedback(id, { feedback_type: feedbackType });
      setFeedback((prev) => [...(prev || []), res.data.feedback]);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setGenError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setGenerating(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!session) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-900">Reading session #{session.id}</h1>
          <p className="mt-1 text-sm text-muted">
            Started {new Date(session.started_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={session.is_complete ? 'success' : 'warning'}>
            {session.is_complete ? 'Complete' : 'In progress'}
          </Badge>
          {!session.is_complete && (
            <Button variant="secondary" onClick={() => setConfirmComplete(true)}>
              Mark complete
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-900">Progress log</h2>
          {(!session.progress_log || session.progress_log.length === 0) && (
            <EmptyState title="No progress logged yet" description="Add a page and accuracy entry below." />
          )}
          {session.progress_log && session.progress_log.length > 0 && (
            <ol className="mb-5 space-y-2 border-l-2 border-border pl-4">
              {session.progress_log.map((entry, i) => (
                <li key={i} className="text-sm text-brand-900">
                  {entry.page !== undefined && <span className="font-medium">Page {entry.page}</span>}
                  {entry.accuracy !== undefined && (
                    <span className="ml-2 text-muted">{entry.accuracy}% accuracy</span>
                  )}
                  {entry.page === undefined && entry.accuracy === undefined && (
                    <span className="text-muted">{JSON.stringify(entry)}</span>
                  )}
                </li>
              ))}
            </ol>
          )}

          {!session.is_complete && (
            <form onSubmit={onLogProgress} className="grid grid-cols-2 gap-3">
              <Input
                label="Page"
                type="number"
                min={0}
                value={page}
                onChange={(e) => setPage(e.target.value)}
              />
              <Input
                label="Accuracy %"
                type="number"
                min={0}
                max={100}
                value={accuracy}
                onChange={(e) => setAccuracy(e.target.value)}
              />
              <div className="col-span-2">
                <Alert>{logError}</Alert>
              </div>
              <div className="col-span-2">
                <Button type="submit" loading={logging} variant="secondary" className="w-full">
                  Log progress
                </Button>
              </div>
            </form>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-brand-900">Feedback</h2>

          <form onSubmit={onGenerateFeedback} className="mb-5 flex items-end gap-3">
            <div className="flex-1">
              <Select label="Type" value={feedbackType} onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}>
                {FEEDBACK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" loading={generating}>
              Generate feedback
            </Button>
          </form>
          <Alert>{genError}</Alert>

          {feedback && feedback.length === 0 && (
            <p className="text-sm text-muted">No feedback generated yet.</p>
          )}
          {feedback && feedback.length > 0 && (
            <ul className="space-y-3">
              {feedback.map((f) => (
                <li key={f.id} className="rounded-xl border border-border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <Badge tone="brand" className="capitalize">
                      {f.feedback_type}
                    </Badge>
                    <span className="text-xs text-muted">
                      {new Date(f.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-brand-900">{f.feedback_text}</p>
                  {f.audio_url && (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <audio controls src={f.audio_url} className="mt-2 w-full" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        onConfirm={onMarkComplete}
        loading={completing}
        danger={false}
        title="Mark this session complete?"
        description="This stamps the session as finished. You can still generate feedback afterward."
        confirmLabel="Mark complete"
      />
    </div>
  );
}
