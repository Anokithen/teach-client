'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { adminApi } from '@/lib/endpoints';
import { ApiErrorShape, Book, ReadingLevel } from '@/lib/types';

interface BookEditModalProps {
  book: Book;
  open: boolean;
  onClose: () => void;
  onUpdated: (book: Book) => void;
}

interface BookForm {
  title: string;
  age_group: string;
  reading_level: ReadingLevel;
  text_content: string;
  content_url: string;
  cover_image_url: string;
  image_urls: string;
  video_url: string;
}

function formFromBook(book: Book): BookForm {
  return {
    title: book.title || '',
    age_group: book.age_group || '',
    reading_level: book.reading_level || 'beginner',
    text_content: book.text_content || '',
    content_url: book.content_url || '',
    cover_image_url: book.cover_image_url || '',
    image_urls: (book.image_urls || []).join('\n'),
    video_url: book.video_url || '',
  };
}

export function BookEditModal({ book, open, onClose, onUpdated }: BookEditModalProps) {
  const [form, setForm] = useState<BookForm>(() => formFromBook(book));
  const [error, setError] = useState<string | string[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(formFromBook(book));
      setError(null);
    }
  }, [book, open]);

  function close() {
    if (saving) return;
    setError(null);
    onClose();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const response = await adminApi.updateBook(book.id, {
        title: form.title.trim(),
        age_group: form.age_group.trim(),
        reading_level: form.reading_level,
        text_content: form.text_content,
        content_url: form.content_url.trim(),
        cover_image_url: form.cover_image_url.trim(),
        image_urls: form.image_urls
          .split(/\r?\n/)
          .map((url) => url.trim())
          .filter(Boolean),
        video_url: form.video_url.trim(),
      });
      onUpdated(response.data.book as Book);
      onClose();
    } catch (err) {
      const apiError = err as ApiErrorShape;
      setError(apiError.fields?.length ? apiError.fields : apiError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title={`Edit ${book.title}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <Input
          label="Age group"
          required
          placeholder="e.g. 6–8"
          value={form.age_group}
          onChange={(event) => setForm({ ...form, age_group: event.target.value })}
        />
        <Select
          label="Reading level"
          value={form.reading_level}
          onChange={(event) => setForm({ ...form, reading_level: event.target.value as ReadingLevel })}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
        <Textarea
          label="Story text"
          rows={8}
          value={form.text_content}
          onChange={(event) => setForm({ ...form, text_content: event.target.value })}
        />
        <Input
          label="Content URL (optional)"
          type="url"
          value={form.content_url}
          onChange={(event) => setForm({ ...form, content_url: event.target.value })}
        />
        <Input
          label="Cover image URL (optional)"
          type="url"
          value={form.cover_image_url}
          onChange={(event) => setForm({ ...form, cover_image_url: event.target.value })}
        />
        <Textarea
          label="Illustration URLs (one per line)"
          rows={4}
          value={form.image_urls}
          onChange={(event) => setForm({ ...form, image_urls: event.target.value })}
        />
        <Input
          label="Video URL (optional)"
          type="url"
          value={form.video_url}
          onChange={(event) => setForm({ ...form, video_url: event.target.value })}
        />
        <Alert>{error}</Alert>
        <div className="flex flex-col-reverse justify-end gap-3 pt-1 sm:flex-row">
          <Button type="button" variant="ghost" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
