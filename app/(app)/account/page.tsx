'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { accountApi } from '@/lib/endpoints';
import { clearTokens } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ApiErrorShape } from '@/lib/types';

interface AccountForm {
  name: string;
  email: string;
  password: string;
}

export default function AccountPage() {
  const { account, refreshAccount } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<AccountForm>({
    name: account?.name || '',
    email: account?.email || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | string[] | null>(null);
  const [saved, setSaved] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);
    setSaving(true);
    try {
      const payload: { name: string; email: string; password?: string } = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      await accountApi.update(payload);
      await refreshAccount();
      setForm((f) => ({ ...f, password: '' }));
      setSaved(true);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      setSaveError(apiErr.fields?.length ? apiErr.fields : apiErr.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await accountApi.remove();
      clearTokens();
      router.push('/login');
    } catch (err) {
      setSaveError((err as ApiErrorShape).message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (!account) return null;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-brand-900">My account</h1>
      <div className="mt-2 flex items-center gap-2">
        <Badge tone="brand" className="capitalize">
          {account.role}
        </Badge>
        <span className="text-sm text-muted">
          Joined {new Date(account.created_at).toLocaleDateString()}
        </span>
      </div>

      <Card className="mt-6">
        <form onSubmit={onSave} className="space-y-4">
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
            label="New password (leave blank to keep current)"
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Alert>{saveError}</Alert>
          {saved && <Alert tone="success">Account updated.</Alert>}
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </form>
      </Card>

      <Card className="mt-6 border-danger/30">
        <h2 className="mb-1 text-sm font-semibold text-danger">Delete account</h2>
        <p className="mb-4 text-sm text-muted">
          This permanently removes your account, children, and voice profiles. This can&apos;t be undone.
        </p>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          Delete my account
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete your account?"
        description="This permanently removes your account, all children profiles, and voice profiles."
        confirmLabel="Delete account"
      />
    </div>
  );
}
