'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/endpoints';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { ApiErrorShape, ReadingLevel } from '@/lib/types';

const AGE_GROUPS = ['3-5', '6-8', '9-11', '12+'];

export default function NewBookPage() {
  const [form, setForm] = useState({
    title: '', age_group: '3-5', reading_level: 'beginner' as ReadingLevel, text_content: '', content_url: '',
  });
  const [error, setError] = useState<string | string[] | null>(null);
  const [createdBookId, setCreatedBookId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreatedBookId(null);
    setLoading(true);
    try {
      const res = await adminApi.createBook(form);
      setCreatedBookId(res.data.book.id);
      setForm({ title: '', age_group: '3-5', reading_level: 'beginner', text_content: '', content_url: '' });
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-brand-900">Add a book</h1>
      <p className="mt-1 text-sm text-muted">Each new book automatically receives word puzzle, spelling, and quiz activities.</p>
      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Book title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Age group" value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })}>
              {AGE_GROUPS.map((age) => <option key={age} value={age}>{age}</option>)}
            </Select>
            <Select label="Reading level" value={form.reading_level} onChange={(e) => setForm({ ...form, reading_level: e.target.value as ReadingLevel })}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </Select>
          </div>
          <Textarea label="Book text" required value={form.text_content} onChange={(e) => setForm({ ...form, text_content: e.target.value })} placeholder="Paste or write the story text used to build the games." />
          <Input label="Content URL (optional)" type="url" value={form.content_url} onChange={(e) => setForm({ ...form, content_url: e.target.value })} />
          <Alert>{error}</Alert>
          {createdBookId && <Alert tone="success">Book and its three mini-games are ready. <Link className="font-medium underline" href={`/books/${createdBookId}`}>Open book</Link></Alert>}
          <Button type="submit" loading={loading} className="w-full">Create book and games</Button>
        </form>
      </Card>
    </div>
  );
}
