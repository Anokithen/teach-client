'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { booksApi, sessionsApi } from '@/lib/endpoints';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ApiErrorShape, Book, PronunciationCheck, ReadingSession, SessionFeedback } from '@/lib/types';

export default function ReadingSessionPage() {
  const { id } = useParams<{ id: string }>();

  const [session, setSession] = useState<ReadingSession | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [feedback, setFeedback] = useState<SessionFeedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationCheck | null>(null);
  const [pronunciationError, setPronunciationError] = useState<string | null>(null);

  const sentences = (book?.text_content || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => () => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function load() {
    try {
      const [sessionRes, feedbackRes] = await Promise.all([
        sessionsApi.get(id),
        sessionsApi.listFeedback(id),
      ]);
      const loadedSession = sessionRes.data.reading_session as ReadingSession;
      setSession(loadedSession);
      setFeedback(feedbackRes.data.feedback);
      const bookRes = await booksApi.get(loadedSession.book_id);
      setBook(bookRes.data.book);
    } catch (err) {
      setError((err as ApiErrorShape).message);
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

  async function startListening() {
    setPronunciationError(null);
    setPronunciationResult(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone recording is not supported in this browser. Please use Chrome, Edge, or Safari over HTTPS or localhost.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const chunks: BlobPart[] = [];
      const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setListening(false);
        const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) return;
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append('audio', audio, 'my-reading.webm');
          form.append('sentence_index', String(sentenceIndex));
          const response = await sessionsApi.transcribePronunciation(id, form);
          const spoken = response.data.transcript as string;
          setTranscript(spoken || '');
          if (!spoken) setPronunciationError('I could not hear any words. Try again a little closer to the microphone.');
        } catch (err) {
          setPronunciationError((err as ApiErrorShape).message || 'We could not analyse that recording. Please try again.');
        } finally {
          setTranscribing(false);
        }
      };
      setTranscript('');
      setListening(true);
      recorder.start();
    } catch (err) {
      setListening(false);
      setPronunciationError(err instanceof Error && err.message ? err.message : 'Microphone access is blocked. Allow microphone access for this site and try again.');
    }
  }

  function stopListening() { recorderRef.current?.state === 'recording' && recorderRef.current.stop(); }

  async function checkPronunciation() {
    if (!transcript.trim()) {
      setPronunciationError('Read the sentence aloud first, then check your pronunciation.');
      return;
    }
    setChecking(true);
    setPronunciationError(null);
    setPronunciationResult(null);
    try {
      const res = await sessionsApi.checkPronunciation(id, { sentence_index: sentenceIndex, transcript });
      setPronunciationResult(res.data);
      load();
    } catch (err) {
      setPronunciationError((err as ApiErrorShape).message);
    } finally {
      setChecking(false);
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
        <Card className="overflow-hidden">
          <div className="relative mb-5 overflow-hidden rounded-2xl bg-brand-400/10 p-5">
            <h2 className="relative text-lg font-semibold text-brand-900">Read aloud for points</h2>
            <p className="relative mt-1 text-sm text-muted">Press the friendly microphone, read with confidence, then see how you did.</p>
          </div>
          {sentences.length === 0 ? (
            <EmptyState title="This book has no text to read aloud yet" />
          ) : (
            <div className="space-y-4">
              <Select
                label="Sentence"
                value={String(sentenceIndex)}
                onChange={(e) => {
                  setSentenceIndex(Number(e.target.value));
                  setTranscript('');
                  setPronunciationResult(null);
                }}
                disabled={session.is_complete}
              >
                {sentences.map((_, index) => (
                  <option key={index} value={index}>Sentence {index + 1}</option>
                ))}
              </Select>
              <p className="rounded-xl border border-brand-400/30 bg-brand-400/10 p-4 text-base leading-relaxed text-brand-900">
                {sentences[sentenceIndex]}
              </p>
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <button type="button" aria-label={listening ? 'Stop recording' : 'Start recording'} onClick={listening ? stopListening : startListening} disabled={session.is_complete || transcribing} className={`mic-orb ${listening ? 'is-listening' : ''} disabled:opacity-50`}>
                  <span className="text-3xl" aria-hidden="true">{listening ? '◼' : '🎙'}</span>
                </button>
                <p className="text-sm font-medium text-brand-900">{listening ? 'Listening… tap to finish' : transcribing ? 'Listening back to your words…' : 'Tap the microphone to read'}</p>
                <p className="text-xs text-muted">Correct readings earn 10 leaderboard points, once per sentence.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={checkPronunciation}
                  loading={checking}
                  disabled={session.is_complete || transcribing || !transcript.trim()}
                >
                  Check pronunciation
                </Button>
              </div>
              {transcript && (
                <p className="rounded-lg bg-surface px-3 py-2 text-sm text-brand-900">
                  <span className="font-medium">I heard:</span> {transcript}
                </p>
              )}
              {pronunciationError && <Alert>{pronunciationError}</Alert>}
              {pronunciationResult && (
                <Alert>
                  {pronunciationResult.message} Match: {pronunciationResult.accuracy}%.
                </Alert>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 text-sm font-semibold text-brand-900">Progress log</h2>
          <p className="mb-4 text-sm text-muted">Your reading scores are saved here automatically after each check.</p>
          {(!session.progress_log || session.progress_log.length === 0) && (
            <EmptyState title="No reading scores yet" description="Read a sentence aloud to create your first progress entry." />
          )}
          {session.progress_log && session.progress_log.length > 0 && (
            <ol className="mb-5 space-y-2 border-l-2 border-border pl-4">
              {session.progress_log.map((entry, i) => (
                <li key={i} className="text-sm text-brand-900">
                  {entry.type === 'pronunciation_check' && (
                    <>
                      <span className="font-medium">Sentence {Number(entry.sentence_index) + 1}</span>
                      <span className="ml-2 text-muted">{entry.accuracy}% accuracy</span>
                      {Number(entry.awarded_points) > 0 && <span className="ml-2 font-medium text-success">+{String(entry.awarded_points)} points</span>}
                    </>
                  )}
                  {entry.type !== 'pronunciation_check' && (
                    <>
                  {entry.page !== undefined && <span className="font-medium">Page {entry.page}</span>}
                  {entry.accuracy !== undefined && (
                    <span className="ml-2 text-muted">{entry.accuracy}% accuracy</span>
                  )}
                  {entry.page === undefined && entry.accuracy === undefined && (
                    <span className="text-muted">{JSON.stringify(entry)}</span>
                  )}
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 text-sm font-semibold text-brand-900">Your reading feedback</h2>
          <p className="mb-4 text-sm text-muted">Feedback appears automatically after each pronunciation score.</p>

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
