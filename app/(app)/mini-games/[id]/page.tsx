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
import { ApiErrorShape, Child, GameResult, MiniGame } from '@/lib/types';

type GameContent = { words?: string[]; questions?: { question: string; options: string[]; answer: string }[] };

export default function MiniGamePage() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<MiniGame | null>(null);
  const [children, setChildren] = useState<Child[] | null>(null);
  const [childId, setChildId] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | string[] | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [gameRes, childrenRes] = await Promise.all([miniGamesApi.get(id), childrenApi.list()]);
        setGame(gameRes.data.mini_game);
        setChildren(childrenRes.data.children);
        if (childrenRes.data.children.length === 1) setChildId(String(childrenRes.data.children[0].id));
      } catch (err) {
        setError((err as ApiErrorShape).message);
      }
    }
    load();
  }, [id]);

  const isQuiz = game?.game_type === 'quiz';
  const isSpelling = game?.game_type === 'spelling';
  const prompts = useMemo(() => {
    const content = (game?.content ?? {}) as GameContent;
    const words = content.words ?? [];
    const questions = content.questions ?? [];

    return isQuiz ? questions : words.map((word) => ({
      question: isSpelling ? `Spell the word: ${word}` : `Unscramble these letters: ${word.split('').reverse().join('')}`,
      options: [],
      answer: word,
    }));
  }, [game, isQuiz, isSpelling]);

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
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setSubmitError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!game || !children) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold capitalize text-brand-900">{game.game_type?.replace(/_/g, ' ')}</h1>
      <p className="mt-1 text-sm text-muted">Answer all questions to earn 10 points for each correct answer.</p>
      <Badge tone="neutral" className="mt-2 capitalize">{game.difficulty}</Badge>

      <Card className="mt-6 space-y-6">
        <Select label="Playing as" value={childId} onChange={(e) => setChildId(e.target.value)}>
          <option value="">Choose a child</option>
          {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
        </Select>

        {prompts.map((prompt, index) => (
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
            ) : (
              <Input className="mt-3" value={answers[index] ?? ''} onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })} placeholder={isSpelling ? 'Type the word' : 'Type the unscrambled word'} />
            )}
          </div>
        ))}

        <Alert>{submitError}</Alert>
        {result && <Alert tone="success">Great work! Your score of {result.score} has been saved.</Alert>}
        <Button type="button" onClick={finishGame} loading={submitting} className="w-full">Finish game</Button>
      </Card>
    </div>
  );
}
