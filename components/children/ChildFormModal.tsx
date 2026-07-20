'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth-context';
import { childrenApi } from '@/lib/endpoints';
import { ApiErrorShape, Child, ReadingLevel } from '@/lib/types';

const READING_LEVELS: ReadingLevel[] = ['beginner', 'intermediate', 'advanced'];

interface ChildFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (child: Child) => void;
}

interface ChildForm {
  name: string;
  age: string;
  reading_level: ReadingLevel;
  parent_id: string;
}

export function ChildFormModal({ open, onClose, onCreated }: ChildFormModalProps) {
  const { isTeacher } = useAuth();
  const [form, setForm] = useState<ChildForm>({ name: '', age: '', reading_level: 'beginner', parent_id: '' });
  const [error, setError] = useState<string | string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const close = () => {
    setForm({ name: '', age: '', reading_level: 'beginner', parent_id: '' });
    setError(null);
    onClose();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: { name: string; age: number; reading_level: ReadingLevel; parent_id?: number } = {
        name: form.name,
        age: Number(form.age),
        reading_level: form.reading_level,
      };
      if (isTeacher) payload.parent_id = Number(form.parent_id);
      const res = await childrenApi.create(payload);
      onCreated?.(res.data.child);
      close();
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Add child">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Age"
          type="number"
          min={1}
          max={18}
          required
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />
        <Select
          label="Reading level"
          value={form.reading_level}
          onChange={(e) => setForm({ ...form, reading_level: e.target.value as ReadingLevel })}
        >
          {READING_LEVELS.map((l) => (
            <option key={l} value={l} className="capitalize">
              {l}
            </option>
          ))}
        </Select>
        {isTeacher && (
          <Input
            label="Parent account ID"
            type="number"
            required
            value={form.parent_id}
            onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
          />
        )}
        {isTeacher && (
          <p className="-mt-2 text-xs text-muted">
            Ask the parent for their account ID, or check with an admin. Parent lookup by name isn&apos;t
            available yet.
          </p>
        )}
        <Alert>{error}</Alert>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" type="button" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add child
          </Button>
        </div>
      </form>
    </Modal>
  );
}
