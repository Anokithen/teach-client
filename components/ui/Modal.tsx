'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm motion-safe:animate-[modal-backdrop-in_.18s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        ref={dialogRef}
        className="card relative max-h-[min(90vh,44rem)] w-full max-w-md overflow-y-auto rounded-b-none p-5 motion-safe:animate-[modal-card-in_.22s_cubic-bezier(.2,.8,.2,1)] sm:rounded-2xl sm:p-6"
      >
        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-xl leading-none text-muted hover:bg-bg hover:text-brand-900"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {title && (
          <h2 id={titleId} className="mb-3 pr-8 text-lg font-semibold text-brand-900">
            {title}
          </h2>
        )}
        <div className="text-sm text-brand-900">{children}</div>
        {footer && <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">{footer}</div>}
      </div>
    </div>
  );
}
