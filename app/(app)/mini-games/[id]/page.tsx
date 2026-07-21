'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { childrenApi, miniGamesApi } from '@/lib/endpoints';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ChildPinModal } from '@/components/children/ChildPinModal';
import { ApiErrorShape, Child, GameResult, MiniGame } from '@/lib/types';

type GameContent = { words?: string[]; questions?: { question: string; options: string[]; answer: string }[] };
type GamePrompt = { question: string; options: string[]; answer: string; scrambled?: string[] };
type SpellingDifficulty = 'easy' | 'medium' | 'hard';
type SpellingStage = 'choose' | 'memorise' | 'write' | 'feedback';

const MAX_WORD_BUILDER_WORDS = 10;
const SPELLING_WORD_COUNTS: Record<SpellingDifficulty, number> = { easy: 3, medium: 6, hard: 10 };

function shuffleLetters(word: string) {
  const letters = word.split('');
  if (letters.length < 2) return letters;

  // Keep the most mixed result, so tiles do not accidentally remain close to
  // their original positions after a random shuffle.
  let shuffled = [...letters];
  let mostMoved = 0;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = [...letters];
    for (let index = candidate.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [candidate[index], candidate[swapIndex]] = [candidate[swapIndex], candidate[index]];
    }
    const moved = candidate.reduce((count, letter, index) => count + Number(letter !== letters[index]), 0);
    if (moved > mostMoved) {
      shuffled = candidate;
      mostMoved = moved;
    }
    if (mostMoved === letters.length) break;
  }
  return shuffled;
}

const GAME_DETAILS: Record<string, { icon: string; title: string; goal: string; instructions: string }> = {
  word_puzzle: { icon: '🧩', title: 'Word builder', goal: 'Build story words', instructions: 'Look at the mixed-up letters, then type the word in the correct order.' },
  spelling: { icon: '✏️', title: 'Spelling practice', goal: 'Practise key words', instructions: 'Read each book word carefully and type it with the correct spelling.' },
  quiz: { icon: '🌟', title: 'Story word quiz', goal: 'Remember book words', instructions: 'Choose the word that appeared in this book.' },
};

export default function MiniGamePage() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<MiniGame | null>(null);
  const [children, setChildren] = useState<Child[] | null>(null);
  const [childId, setChildId] = useState('');
  const [pendingChild, setPendingChild] = useState<Child | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedLetters, setSelectedLetters] = useState<Record<number, number[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | string[] | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [spellingDifficulty, setSpellingDifficulty] = useState<SpellingDifficulty | null>(null);
  const [spellingStage, setSpellingStage] = useState<SpellingStage>('choose');
  const [memoriseSecondsLeft, setMemoriseSecondsLeft] = useState(30);
  const [spellingResponse, setSpellingResponse] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [gameRes, childrenRes] = await Promise.all([miniGamesApi.get(id), childrenApi.list()]);
        setGame(gameRes.data.mini_game);
        setChildren(childrenRes.data.children);
      } catch (err) {
        setError((err as ApiErrorShape).message);
      }
    }
    load();
  }, [id]);

  const isQuiz = game?.game_type === 'quiz';
  const isSpelling = game?.game_type === 'spelling';
  const details = GAME_DETAILS[game?.game_type || ''] || { icon: '🎮', title: 'Mini-game', goal: 'Practise reading', instructions: 'Answer every question to complete the activity.' };
  const prompts = useMemo<GamePrompt[]>(() => {
    const content = (game?.content ?? {}) as GameContent;
    const wordLimit = isSpelling ? (spellingDifficulty ? SPELLING_WORD_COUNTS[spellingDifficulty] : 0) : MAX_WORD_BUILDER_WORDS;
    const words = (content.words ?? []).slice(0, wordLimit);
    const questions = content.questions ?? [];

    return isQuiz ? questions : words.map((word) => ({
      question: isSpelling ? 'Spell this word from memory' : 'Tap the letters to build this book word',
      options: [],
      answer: word,
      scrambled: isSpelling ? undefined : shuffleLetters(word),
    }));
  }, [game, isQuiz, isSpelling, spellingDifficulty]);

  useEffect(() => {
    if (!isSpelling || !spellingDifficulty || spellingStage !== 'memorise') return undefined;
    if (memoriseSecondsLeft === 0) {
      setSpellingStage('write');
      return undefined;
    }
    const timer = window.setTimeout(() => setMemoriseSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [isSpelling, memoriseSecondsLeft, spellingDifficulty, spellingStage]);

  function chooseSpellingDifficulty(difficulty: SpellingDifficulty) {
    setSpellingDifficulty(difficulty);
    setAnswers({});
    setSpellingResponse('');
    setResult(null);
    setMemoriseSecondsLeft(30);
    setSpellingStage('memorise');
  }

  function selectChild(value: string) {
    if (!value) {
      setChildId('');
      return;
    }
    setPendingChild(children?.find((child) => String(child.id) === value) || null);
  }

  function updateSpellingResponse(value: string) {
    setSpellingResponse(value);
    setAnswers(Object.fromEntries(value.split(/\r?\n/).map((word, index) => [index, word])));
  }

  function selectLetter(questionIndex: number, letterIndex: number, letters: string[]) {
    const selected = selectedLetters[questionIndex] || [];
    if (selected.includes(letterIndex)) return;
    const next = [...selected, letterIndex];
    setSelectedLetters({ ...selectedLetters, [questionIndex]: next });
    setAnswers({ ...answers, [questionIndex]: next.map((index) => letters[index]).join('') });
  }

  function resetLetters(questionIndex: number) {
    setSelectedLetters({ ...selectedLetters, [questionIndex]: [] });
    setAnswers({ ...answers, [questionIndex]: '' });
  }

  async function finishGame() {
    setSubmitError(null);
    if (!childId) return setSubmitError('Choose a child before finishing the game.');
    if (!prompts.length) return setSubmitError('This game does not have any questions yet.');
    if (prompts.some((_, index) => !answers[index]?.trim())) return setSubmitError('Answer every question before finishing.');

    const correct = prompts.filter((prompt, index) => answers[index]?.trim().toLowerCase() === prompt.answer.toLowerCase()).length;
    setSubmitting(true);
    try {
      const res = await miniGamesApi.submitResult(id, { child_id: Number(childId), score: correct * 10 });
      setResult(res.data.game_result);
      if (isSpelling) setSpellingStage('feedback');
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setSubmitError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!game || !children) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  const correctAnswers = prompts.filter((prompt, index) => answers[index]?.trim().toLowerCase() === prompt.answer.toLowerCase()).length;
  const answeredPromptCount = prompts.filter((_, index) => Boolean(answers[index]?.trim())).length;

  return (
    <div className="max-w-2xl">
      <div className="relative overflow-hidden rounded-2xl bg-brand-400/10 p-5">
        <span className="text-3xl" aria-hidden="true">{details.icon}</span>
        <h1 className="mt-2 text-2xl font-semibold text-brand-900">{details.title}</h1>
        <p className="mt-1 text-sm font-medium text-brand-600">Goal: {details.goal}</p>
        <p className="mt-2 text-sm text-muted">{details.instructions}</p>
        <Badge tone="neutral" className="mt-3 capitalize">{game.difficulty}</Badge>
      </div>

      <Card className="mt-6 space-y-6">
        <Select label="Playing as" value={childId} onChange={(e) => selectChild(e.target.value)}>
          <option value="">Choose a child</option>
          {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
        </Select>

        {isSpelling && (
          <>
            <div>
              <p className="text-sm font-semibold text-brand-900">Choose your challenge</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Object.keys(SPELLING_WORD_COUNTS) as SpellingDifficulty[]).map((difficulty) => (
                  <button key={difficulty} type="button" disabled={spellingStage !== 'choose'} onClick={() => chooseSpellingDifficulty(difficulty)} className={`rounded-xl border-2 px-2 py-3 text-sm font-bold capitalize transition hover:-translate-y-0.5 disabled:cursor-not-allowed ${spellingDifficulty === difficulty ? 'border-brand-500 bg-brand-400/15 text-brand-900 shadow-sm' : 'border-brand-100 bg-surface text-muted'}`}>
                    {difficulty}<span className="mt-1 block text-xs font-normal">{SPELLING_WORD_COUNTS[difficulty]} words</span>
                  </button>
                ))}
              </div>
            </div>
            {spellingStage !== 'choose' && <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
              {(['memorise', 'write', 'feedback'] as SpellingStage[]).map((stage, index) => (
                <div key={stage} className={`rounded-full px-2 py-2 capitalize transition ${spellingStage === stage ? 'bg-brand-500 text-white shadow-md' : 'bg-brand-50 text-brand-700'}`}>{index + 1}. {stage}</div>
              ))}
            </div>}
          </>
        )}

        {isSpelling && spellingStage === 'choose' ? (
          <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-5 text-center">
            <p className="font-bold text-brand-900">Choose a challenge to begin</p>
            <p className="mt-1 text-sm text-muted">The 30-second memory timer starts only after you select a difficulty.</p>
          </div>
        ) : isSpelling && spellingStage === 'memorise' ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-brand-300 bg-gradient-to-br from-brand-50 via-white to-brand-400/15 p-5 text-center">
            <span className="absolute left-4 top-3 animate-pulse text-2xl" aria-hidden="true">✨</span><span className="absolute bottom-3 right-4 animate-bounce text-2xl" aria-hidden="true">🌟</span>
            <p className="text-sm font-bold text-brand-700">Memory magic time!</p>
            <p className="mt-1 text-sm text-muted">Look carefully and remember these words before the timer ends.</p>
            <div className="mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-brand-400 bg-white text-2xl font-black text-brand-900 shadow-lg transition-transform animate-pulse">{memoriseSecondsLeft}</div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {prompts.map((prompt) => <span key={prompt.answer} className="animate-bounce rounded-xl bg-white px-3 py-2 text-lg font-bold text-brand-900 shadow-sm">{prompt.answer}</span>)}
            </div>
            <Button type="button" onClick={() => setSpellingStage('write')} className="mt-5">I am ready to spell!</Button>
          </div>
        ) : isSpelling && spellingStage === 'feedback' && result ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 via-brand-50 to-brand-300/20 p-7 text-center">
            <div className="animate-bounce text-6xl" aria-hidden="true">🏆</div>
            <h2 className="mt-3 text-2xl font-bold text-brand-900">Fantastic spelling!</h2>
            <p className="mt-2 text-lg text-brand-700">You spelled {correctAnswers} out of {prompts.length} words correctly.</p>
            <div className="mt-4 space-y-2 text-left">
              {prompts.map((prompt, index) => {
                const correct = answers[index]?.trim().toLowerCase() === prompt.answer.toLowerCase();
                return <div key={index} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold ${correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  <span>{index + 1}. {answers[index]?.trim() || 'No answer'}</span>
                  <span>{correct ? 'Correct' : 'Incorrect'}</span>
                </div>;
              })}
            </div>
            <p className="mt-3 rounded-xl bg-white/80 px-4 py-3 font-bold text-brand-900 shadow-sm">You earned {result.score} points! ✨</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm"><span className="font-medium text-brand-900">{isSpelling ? 'Writing progress' : 'Activity progress'}</span><span className="chip">{answeredPromptCount} of {prompts.length} answered</span></div>

            {isSpelling ? (
              <div className="rounded-xl border border-brand-100 p-4">
                <label htmlFor="spelling-response" className="font-medium text-brand-900">Write the words you remember</label>
                <p className="mt-1 text-sm text-muted">Enter one word on each line. Your spelling will be checked when you finish.</p>
                <textarea id="spelling-response" value={spellingResponse} onChange={(e) => updateSpellingResponse(e.target.value)} rows={Math.max(5, prompts.length)} placeholder="Type one word per line" className="mt-3 w-full rounded-xl border border-brand-200 bg-surface px-3 py-3 text-brand-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/20" />
              </div>
            ) : prompts.map((prompt, index) => (
          <div key={index} className="rounded-xl border border-brand-100 p-4">
            <p className="font-medium text-brand-900">{index + 1}. {prompt.question}</p>
            {isQuiz ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {prompt.options.map((option) => (
                  <label key={option} className={`cursor-pointer rounded-lg border p-3 text-sm ${answers[index] === option ? 'border-brand-500 bg-brand-50' : 'border-brand-100'}`}>
                    <input className="mr-2" type="radio" name={`question-${index}`} value={option} checked={answers[index] === option} onChange={() => setAnswers({ ...answers, [index]: option })} />
                    {option}
                  </label>
                ))}
              </div>
            ) : !isSpelling && prompt.scrambled ? (
              <div className="mt-4">
                <div className="min-h-14 rounded-xl border border-dashed border-brand-400/60 bg-brand-400/10 px-3 py-3 text-center">
                  {selectedLetters[index]?.length ? (
                    <span className="font-mono text-xl font-bold uppercase tracking-[0.25em] text-brand-900">{answers[index]}</span>
                  ) : <span className="text-sm text-muted">Your word will appear here</span>}
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {prompt.scrambled.map((letter, letterIndex) => (
                    <button
                      key={`${letter}-${letterIndex}`}
                      type="button"
                      disabled={selectedLetters[index]?.includes(letterIndex)}
                      onClick={() => selectLetter(index, letterIndex, prompt.scrambled || [])}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-400/35 bg-surface text-lg font-bold uppercase text-brand-900 shadow-sm transition hover:-translate-y-1 hover:bg-brand-400/15 disabled:scale-90 disabled:opacity-35"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => resetLetters(index)} className="mx-auto mt-3 block text-xs font-medium text-brand-600 hover:underline">Start this word again</button>
              </div>
            ) : (
              <Input className="mt-3" value={answers[index] ?? ''} onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })} placeholder="Type the unscrambled word" />
            )}
          </div>
            ))}

            <Alert>{submitError}</Alert>
            {result && <Alert tone="success">Great work! You earned {result.score} points. Your score has been saved to the leaderboard.</Alert>}
            <Button type="button" onClick={finishGame} loading={submitting} disabled={Boolean(result)} className="w-full">{result ? 'Activity complete!' : isSpelling ? 'See my results!' : 'Finish game'}</Button>
          </>
        )}
      </Card>
      <ChildPinModal child={pendingChild} onClose={() => setPendingChild(null)} onVerified={(child) => setChildId(String(child.id))} />
    </div>
  );
}
