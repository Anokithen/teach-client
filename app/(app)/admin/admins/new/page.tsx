'use client';

import { FormEvent, useState } from 'react';
import { adminApi } from '@/lib/endpoints';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiErrorShape } from '@/lib/types';

interface NewAdminForm {
  name: string;
  email: string;
  password: string;
}

export default function NewAdminPage() {
  const [form, setForm] = useState<NewAdminForm>({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | string[] | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await adminApi.createAdmin(form);
      setForm({ name: '', email: '', password: '' });
      setSuccess(true);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-brand-900">Add an admin</h1>
      <p className="mt-1 text-sm text-muted">
        Bootstrap another administrator account. There&apos;s no public sign-up for this role.
      </p>

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Alert>{error}</Alert>
          {success && <Alert tone="success">Admin account created.</Alert>}
          <Button type="submit" loading={loading} className="w-full">
            Create admin
          </Button>
        </form>
      </Card>
    </div>
  );
}
