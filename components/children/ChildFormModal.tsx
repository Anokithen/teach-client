'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/lib/auth-context';
import { childrenApi } from '@/lib/endpoints';
import { ApiErrorShape, Child, ChildGender } from '@/lib/types';

const GENDER_OPTIONS: { value: ChildGender; label: string }[] = [
  { value: 'female', label: 'Girl' },
  { value: 'male', label: 'Boy' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

interface ChildFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (child: Child) => void;
}

interface ChildForm {
  name: string;
  age: string;
  gender: ChildGender;
  parent_id: string;
  child_pin: string;
}

export function ChildFormModal({ open, onClose, onCreated }: ChildFormModalProps) {
  const { isTeacher } = useAuth();
  const [form, setForm] = useState<ChildForm>({ name: '', age: '', gender: 'prefer_not_to_say', parent_id: '', child_pin: '' });
  const [error, setError] = useState<string | string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const close = () => {
    setForm({ name: '', age: '', gender: 'prefer_not_to_say', parent_id: '', child_pin: '' });
    setError(null);
    onClose();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: { name: string; age: number; gender: ChildGender; parent_id?: number; child_pin?: string } = {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
      };
      if (isTeacher) payload.parent_id = Number(form.parent_id);
      if (form.child_pin) payload.child_pin = form.child_pin;
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
        <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as ChildGender })}>
          {GENDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
        <Input
          label="Age"
          type="number"
          min={1}
          max={18}
          required
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />
        <p className="-mt-2 text-xs text-muted">New children start at beginner level and progress automatically as they earn points.</p>
        {!isTeacher && <Input
          label="Child profile PIN (optional)"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{6}"
          minLength={6}
          maxLength={6}
          value={form.child_pin}
          onChange={(e) => setForm({ ...form, child_pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
        />}
        {!isTeacher && <p className="-mt-2 text-xs text-muted">Use exactly six digits. The child will enter it before opening their profile.</p>}
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
