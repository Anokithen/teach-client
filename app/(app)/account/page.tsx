'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { LockKeyhole, ShieldCheck, UserCircle } from 'lucide-react';
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
import { isAllowedUploadFile, uploadFormatError } from '@/lib/file-validation';
import { PageHeader } from '@/components/ui/PageHeader';
import { PwaInstallCard } from '@/components/pwa/PwaInstallCard';

interface AccountForm {
  name: string;
  email: string;
  password: string;
}

interface ExitPasswordForm {
  currentPassword: string;
  exitPassword: string;
  confirmExitPassword: string;
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
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const profileImageInput = useRef<HTMLInputElement>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exitPasswordForm, setExitPasswordForm] =
    useState<ExitPasswordForm>({
      currentPassword: '',
      exitPassword: '',
      confirmExitPassword: '',
    });
  const [exitPasswordSaving, setExitPasswordSaving] = useState(false);
  const [exitPasswordError, setExitPasswordError] = useState<
    string | string[] | null
  >(null);
  const [exitPasswordSaved, setExitPasswordSaved] = useState<string | null>(
    null,
  );

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);
    setSaving(true);
    try {
      const payload: { name: string; email: string; password?: string } = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      await accountApi.update(payload);
      if (profileImageFile) {
        const image = new FormData();
        image.append('profile_image', profileImageFile);
        await accountApi.uploadProfileImage(image);
        setProfileImageFile(null);
        if (profileImageInput.current) profileImageInput.current.value = '';
      }
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

  function onProfileImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setSaveError(null);
    if (!file) return setProfileImageFile(null);
    if (!isAllowedUploadFile(file, 'image')) {
      event.target.value = '';
      setProfileImageFile(null);
      setSaveError(uploadFormatError('image'));
      return;
    }
    setProfileImageFile(file);
  }

  async function removeProfileImage() {
    setSaveError(null);
    setSaving(true);
    try {
      await accountApi.removeProfileImage();
      setProfileImageFile(null);
      if (profileImageInput.current) profileImageInput.current.value = '';
      await refreshAccount();
    } catch (err) {
      setSaveError((err as ApiErrorShape).message);
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

  async function onSaveExitPassword(event: FormEvent) {
    event.preventDefault();
    setExitPasswordError(null);
    setExitPasswordSaved(null);
    if (exitPasswordForm.exitPassword !== exitPasswordForm.confirmExitPassword) {
      setExitPasswordError('The exit passwords do not match.');
      return;
    }
    setExitPasswordSaving(true);
    try {
      await accountApi.setExitPassword({
        current_password: exitPasswordForm.currentPassword,
        exit_password: exitPasswordForm.exitPassword,
      });
      await refreshAccount();
      setExitPasswordForm({
        currentPassword: '',
        exitPassword: '',
        confirmExitPassword: '',
      });
      setExitPasswordSaved(
        account?.has_exit_password
          ? 'Exit password changed.'
          : 'Exit password enabled.',
      );
    } catch (err) {
      const apiError = err as ApiErrorShape;
      setExitPasswordError(
        apiError.fields?.length ? apiError.fields : apiError.message,
      );
    } finally {
      setExitPasswordSaving(false);
    }
  }

  async function onRemoveExitPassword() {
    setExitPasswordError(null);
    setExitPasswordSaved(null);
    if (!exitPasswordForm.currentPassword) {
      setExitPasswordError(
        'Enter your current account password before removing exit protection.',
      );
      return;
    }
    setExitPasswordSaving(true);
    try {
      await accountApi.removeExitPassword({
        current_password: exitPasswordForm.currentPassword,
      });
      await refreshAccount();
      setExitPasswordForm({
        currentPassword: '',
        exitPassword: '',
        confirmExitPassword: '',
      });
      setExitPasswordSaved('Exit password removed.');
    } catch (err) {
      const apiError = err as ApiErrorShape;
      setExitPasswordError(
        apiError.fields?.length ? apiError.fields : apiError.message,
      );
    } finally {
      setExitPasswordSaving(false);
    }
  }

  if (!account) return null;

  return (
    <div className="max-w-xl">
      <PageHeader eyebrow="Your TeachAlike space" title="My account" icon={UserCircle} description="Keep your profile and account details up to date." />
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
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-brand-400 bg-brand-400/10 text-2xl font-bold text-brand-600">
              {account.profile_image_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={account.profile_image_url} alt={`${account.name}'s profile`} className="h-full w-full object-cover" />
                </>
              ) : account.name[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <label htmlFor="account-profile-image" className="label">Profile picture (optional)</label>
              <input ref={profileImageInput} id="account-profile-image" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={onProfileImageChange} className="input" />
              <p className="mt-1 text-xs text-muted">JPG, PNG, or WebP only.</p>
              {account.profile_image_url && <Button type="button" variant="ghost" onClick={removeProfileImage} disabled={saving} className="mt-1 min-h-0 px-0 py-1 text-xs">Remove picture</Button>}
            </div>
          </div>
          <Input
            label="Name"
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            maxLength={120}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="New password (leave blank to keep current)"
            type="password"
            minLength={8}
            maxLength={128}
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

      <Card className="mt-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="icon-bubble mt-0.5 h-10 w-10 shrink-0 text-brand-600">
              {account.has_exit_password ? (
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              ) : (
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div>
              <h2 className="font-semibold text-brand-900">Exit protection</h2>
              <p className="mt-1 text-sm text-muted">
                Require a separate password before the in-app Exit app action
                can sign out.
              </p>
            </div>
          </div>
          <Badge tone={account.has_exit_password ? 'success' : 'warning'}>
            {account.has_exit_password ? 'Protected' : 'Not enabled'}
          </Badge>
        </div>

        <form onSubmit={onSaveExitPassword} className="space-y-4">
          <Input
            id="exit-current-account-password"
            label="Current account password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={exitPasswordForm.currentPassword}
            onChange={(event) =>
              setExitPasswordForm({
                ...exitPasswordForm,
                currentPassword: event.target.value,
              })
            }
          />
          <Input
            id="new-exit-password"
            label={
              account.has_exit_password
                ? 'New exit password'
                : 'Create exit password'
            }
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={exitPasswordForm.exitPassword}
            onChange={(event) =>
              setExitPasswordForm({
                ...exitPasswordForm,
                exitPassword: event.target.value,
              })
            }
          />
          <Input
            id="confirm-exit-password"
            label="Confirm exit password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={exitPasswordForm.confirmExitPassword}
            onChange={(event) =>
              setExitPasswordForm({
                ...exitPasswordForm,
                confirmExitPassword: event.target.value,
              })
            }
          />
          <Alert>{exitPasswordError}</Alert>
          {exitPasswordSaved && (
            <Alert tone="success">{exitPasswordSaved}</Alert>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={exitPasswordSaving}>
              {account.has_exit_password
                ? 'Change exit password'
                : 'Enable exit password'}
            </Button>
            {account.has_exit_password && (
              <Button
                type="button"
                variant="ghost"
                disabled={exitPasswordSaving}
                onClick={onRemoveExitPassword}
              >
                Remove protection
              </Button>
            )}
          </div>
        </form>

        <p className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs leading-5 text-muted">
          This protects TeachAlike&apos;s own exit control. A PWA cannot block
          the device Home button, app switching, force-closing, or browser
          controls. Use Android App Pinning, iOS Guided Access, or managed kiosk
          mode for device-level locking.
        </p>
      </Card>

      {account.role === 'parent' && <PwaInstallCard />}

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
