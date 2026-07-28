'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Maximize2, ShieldAlert, UnlockKeyhole } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { accountApi } from '@/lib/endpoints';
import type { ApiErrorShape } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const FULLSCREEN_EXIT_LOCK_KEY = 'teachalike_fullscreen_exit_locked';

type WebkitFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
};

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isDocumentFullscreen(fullscreenMode: MediaQueryList) {
  const fullscreenDocument = document as WebkitFullscreenDocument;
  return Boolean(
    document.fullscreenElement ||
      fullscreenDocument.webkitFullscreenElement ||
      fullscreenMode.matches,
  );
}

export function FullscreenExitGuard() {
  const { account, isAuthenticated, isLoading } = useAuth();
  const [locked, setLocked] = useState(false);
  const [exitPassword, setExitPassword] = useState('');
  const [error, setError] = useState<string | string[] | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [restoringFullscreen, setRestoringFullscreen] = useState(false);
  const wasFullscreen = useRef(false);
  const preventDismiss = useCallback(() => undefined, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !account?.has_exit_password) {
      window.sessionStorage.removeItem(FULLSCREEN_EXIT_LOCK_KEY);
      wasFullscreen.current = false;
      setLocked(false);
      return;
    }

    const fullscreenMode = window.matchMedia('(display-mode: fullscreen)');
    const updateFullscreenState = () => {
      const fullscreen = isDocumentFullscreen(fullscreenMode);
      if (fullscreen) {
        wasFullscreen.current = true;
        window.sessionStorage.removeItem(FULLSCREEN_EXIT_LOCK_KEY);
        setLocked(false);
        return;
      }
      if (wasFullscreen.current) {
        window.sessionStorage.setItem(FULLSCREEN_EXIT_LOCK_KEY, 'true');
        setLocked(true);
      }
    };

    wasFullscreen.current = isDocumentFullscreen(fullscreenMode);
    if (
      !wasFullscreen.current &&
      window.sessionStorage.getItem(FULLSCREEN_EXIT_LOCK_KEY) === 'true'
    ) {
      setLocked(true);
    }

    // Browsers report this only after fullscreen has ended. Closing or
    // switching away from an installed PWA is controlled by the device OS and
    // cannot be intercepted by web code.
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    fullscreenMode.addEventListener('change', updateFullscreenState);
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener(
        'webkitfullscreenchange',
        updateFullscreenState,
      );
      fullscreenMode.removeEventListener('change', updateFullscreenState);
    };
  }, [account?.has_exit_password, isAuthenticated, isLoading]);

  async function verifyExit(event: FormEvent) {
    event.preventDefault();
    if (!exitPassword || verifying) return;
    setError(null);
    setVerifying(true);
    try {
      await accountApi.verifyExitPassword(exitPassword);
      window.sessionStorage.removeItem(FULLSCREEN_EXIT_LOCK_KEY);
      wasFullscreen.current = false;
      setExitPassword('');
      setLocked(false);
    } catch (err) {
      const apiError = err as ApiErrorShape;
      setError(apiError.fields?.length ? apiError.fields : apiError.message);
    } finally {
      setVerifying(false);
    }
  }

  async function returnToFullscreen() {
    setError(null);
    setRestoringFullscreen(true);
    try {
      const root = document.documentElement as WebkitFullscreenElement;
      if (root.requestFullscreen) {
        await root.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      } else {
        throw new Error('Fullscreen is not supported by this browser.');
      }
      window.sessionStorage.removeItem(FULLSCREEN_EXIT_LOCK_KEY);
      wasFullscreen.current = true;
      setExitPassword('');
      setLocked(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not return to fullscreen. Please try again.',
      );
    } finally {
      setRestoringFullscreen(false);
    }
  }

  return (
    <Modal
      open={locked}
      onClose={preventDismiss}
      dismissible={false}
      title="Fullscreen was closed"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={returnToFullscreen}
            loading={restoringFullscreen}
            disabled={verifying}
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
            Return to fullscreen
          </Button>
          <Button
            type="submit"
            form="fullscreen-exit-password-form"
            loading={verifying}
            disabled={!exitPassword || restoringFullscreen}
          >
            <UnlockKeyhole className="h-4 w-4" aria-hidden="true" />
            Continue outside fullscreen
          </Button>
        </>
      }
    >
      <form
        id="fullscreen-exit-password-form"
        onSubmit={verifyExit}
        className="space-y-4"
      >
        <div className="flex items-start gap-3 rounded-2xl bg-warning/10 p-3">
          <ShieldAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-warning"
            aria-hidden="true"
          />
          <p className="text-muted">
            Enter the parent exit password to use TeachAlike outside
            fullscreen, or return to fullscreen.
          </p>
        </div>
        <Input
          id="fullscreen-exit-password"
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
