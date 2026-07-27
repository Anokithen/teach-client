import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow = 'TeachAlike', title, description, icon = '✨', action }: PageHeaderProps) {
  return (
    <section className="page-hero mb-6 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div className="relative z-10 min-w-0">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      <div className="relative z-10 flex items-center gap-3 self-start sm:self-center">
        <span className="soft-inset grid h-16 w-16 shrink-0 place-items-center rounded-3xl text-4xl" aria-hidden="true">{icon}</span>
        {action}
      </div>
      <span className="pointer-events-none absolute -right-5 -top-8 text-5xl text-white/10" aria-hidden="true">✦</span>
      <span className="pointer-events-none absolute bottom-3 right-32 text-xl text-amber-300/60" aria-hidden="true">✦</span>
    </section>
  );
}
