import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SectionCard({ title, subtitle, children }: Props) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm shadow-slate-950/40">
      <header className="mb-4 border-b border-slate-800 pb-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
