'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LogOut, UnlockKeyhole } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { ApiErrorShape } from '@/lib/types';

interface ExitPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (exitPassword: string) => Promise<void>;
  description?: string;
  confirmMode?: 'exit' | 'unlock';
}

export function ExitPasswordDialog({
  open,
  onClose,
  onConfirm,
  description = 'Ask a parent or account owner to enter the exit password.',
  confirmMode = 'exit',
}: ExitPasswordDialogProps) {
  const [exitPassword, setExitPassword] = useState('');
  const [error, setError] = useState<string | string[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setExitPassword('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!exitPassword || loading) return;
    setError(null);
    setLoading(true);
    try {
      await onConfirm(exitPassword);
    } catch (err) {
      const apiError = err as ApiErrorShape;
      setError(apiError.fields?.length ? apiError.fields : apiError.message);
      setLoading(false);
    }
  }

  const close = () => {
    if (!loading) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Exit password required"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={loading}>
            Stay in app
          </Button>
          <Button
            type="submit"
            form="exit-password-form"
            loading={loading}
            disabled={!exitPassword}
          >
            {confirmMode === 'unlock' ? (
              <UnlockKeyhole className="h-4 w-4" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            {confirmMode === 'unlock' ? 'Temporarily unlock' : 'Exit app'}
          </Button>
        </>
      }
    >
      <form id="exit-password-form" onSubmit={submit} className="space-y-4">
        <p className="text-muted">{description}</p>
        <Input
          id="exit-password"
          label="Exit password"
          type="password"
          autoComplete="off"
          minLength={8}
          maxLength={128}
          required
          value={exitPassword}
          onChange={(event) => setExitPassword(event.target.value)}
        />
        <Alert>{error}</Alert>
      </form>
    </Modal>
  );
}
