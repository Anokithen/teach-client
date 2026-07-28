'use client';

import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { ExitPasswordDialog } from '@/components/account/ExitPasswordDialog';
import { useStandaloneMode } from '@/components/pwa/PwaProvider';
import { useAuth } from '@/lib/auth-context';

const HOLD_DURATION_MS = 2_000;
const MOVE_TOLERANCE_PX = 18;
const CLICK_SUPPRESSION_MS = 1_000;
const HOLD_ACTIVE_CLASS = 'teachalike-exit-hold-active';

function isAndroidDevice() {
  return /Android/i.test(window.navigator.userAgent);
}

export function AndroidLongPressExitGuard() {
  const isStandalone = useStandaloneMode();
  const { account, isAuthenticated, isLoading, logout } = useAuth();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const holdTriggeredRef = useRef(false);
  const suppressClicksUntilRef = useRef(0);

  useEffect(() => {
    const guardEnabled =
      !isLoading &&
      isAuthenticated &&
      Boolean(account?.has_exit_password) &&
      isStandalone &&
      isAndroidDevice();

    if (!guardEnabled || exitDialogOpen) {
      setIsHolding(false);
      return;
    }

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const finishPointer = () => {
      clearTimer();
      activePointerIdRef.current = null;
      holdTriggeredRef.current = false;
      document.documentElement.classList.remove(HOLD_ACTIVE_CLASS);
      setIsHolding(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        event.pointerType !== 'touch' ||
        !event.isPrimary ||
        activePointerIdRef.current !== null ||
        document.querySelector('[role="dialog"][aria-modal="true"]')
      ) {
        return;
      }

      activePointerIdRef.current = event.pointerId;
      startPointRef.current = { x: event.clientX, y: event.clientY };
      holdTriggeredRef.current = false;
      document.documentElement.classList.add(HOLD_ACTIVE_CLASS);
      setIsHolding(true);

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        holdTriggeredRef.current = true;
        suppressClicksUntilRef.current = Date.now() + CLICK_SUPPRESSION_MS;
        setIsHolding(false);
        setExitDialogOpen(true);
        navigator.vibrate?.(30);
      }, HOLD_DURATION_MS);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointerIdRef.current) return;
      const distance = Math.hypot(
        event.clientX - startPointRef.current.x,
        event.clientY - startPointRef.current.y,
      );
      if (distance > MOVE_TOLERANCE_PX && !holdTriggeredRef.current) {
        finishPointer();
      }
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId === activePointerIdRef.current) finishPointer();
    };

    const onContextMenu = (event: MouseEvent) => {
      if (activePointerIdRef.current !== null) event.preventDefault();
    };

    const onClick = (event: MouseEvent) => {
      if (Date.now() >= suppressClicksUntilRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerup', onPointerEnd, true);
    document.addEventListener('pointercancel', onPointerEnd, true);
    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('click', onClick, true);

    return () => {
      clearTimer();
      activePointerIdRef.current = null;
      holdTriggeredRef.current = false;
      document.documentElement.classList.remove(HOLD_ACTIVE_CLASS);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerup', onPointerEnd, true);
      document.removeEventListener('pointercancel', onPointerEnd, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [
    account?.has_exit_password,
    exitDialogOpen,
    isAuthenticated,
    isLoading,
    isStandalone,
  ]);

  return (
    <>
      {isHolding && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] mx-auto max-w-xs overflow-hidden rounded-2xl border border-brand-300 bg-brand-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-card"
        >
          <span className="flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Keep holding to exit
          </span>
          <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/25">
            <span className="block h-full origin-left animate-[exit-hold-progress_2s_linear_forwards] rounded-full bg-brand-300" />
          </span>
        </div>
      )}
      <ExitPasswordDialog
        open={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        onConfirm={logout}
        description="A two-second touch and hold requested an exit. Enter the parent exit password to leave the protected session, or stay in TeachAlike."
      />
    </>
  );
}
