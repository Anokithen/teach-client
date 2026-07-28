'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ExitPasswordDialog } from '@/components/account/ExitPasswordDialog';
import { useAuth } from '@/lib/auth-context';

const ANDROID_BACK_GUARD_STATE = '__teachalikeAndroidBackGuard';

type HistoryState = Record<string, unknown>;

function isInstalledAndroidPwa() {
  if (!/Android/i.test(window.navigator.userAgent)) return false;
  return (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

function currentHistoryState(): HistoryState {
  const state: unknown = window.history.state;
  return typeof state === 'object' && state !== null
    ? (state as HistoryState)
    : {};
}

function guardedHistoryState(state: HistoryState, pathname: string) {
  return {
    ...state,
    [ANDROID_BACK_GUARD_STATE]: pathname,
  };
}

export function AndroidBackExitGuard() {
  const pathname = usePathname();
  const { account, isAuthenticated, isLoading, logout } = useAuth();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

  useEffect(() => {
    if (
      isLoading ||
      !isAuthenticated ||
      !account?.has_exit_password ||
      !isInstalledAndroidPwa()
    ) {
      setExitDialogOpen(false);
      return;
    }

    const currentState = currentHistoryState();
    if (currentState[ANDROID_BACK_GUARD_STATE] !== pathname) {
      window.history.pushState(
        guardedHistoryState(currentState, pathname),
        '',
        window.location.href,
      );
    }

    const onBackNavigation = () => {
      // A PWA can consume browser history Back navigation, but Android does
      // not expose Home, Recents, force-stop, or app-switch controls to web
      // content. Device-level blocking requires App Pinning or kiosk mode.
      window.history.pushState(
        guardedHistoryState(currentHistoryState(), pathname),
        '',
        window.location.href,
      );
      setExitDialogOpen(true);
    };

    window.addEventListener('popstate', onBackNavigation);
    return () => window.removeEventListener('popstate', onBackNavigation);
  }, [
    account?.has_exit_password,
    isAuthenticated,
    isLoading,
    pathname,
  ]);

  return (
    <ExitPasswordDialog
      open={exitDialogOpen}
      onClose={() => setExitDialogOpen(false)}
      onConfirm={logout}
      description="Android Back was pressed. Enter the parent exit password to leave the protected session, or stay in TeachAlike."
    />
  );
}
