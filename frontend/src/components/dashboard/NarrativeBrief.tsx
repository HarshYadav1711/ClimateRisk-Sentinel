type Props = {
  narrative: string | null;
};

export function NarrativeBrief({ narrative }: Props) {
  if (!narrative?.trim()) return null;

  const paragraphs = narrative.split(/\n\n+/).filter(Boolean);

  return (
    <details className="group rounded-2xl border border-slate-800/90 bg-slate-950/35 ring-1 ring-white/[0.03]">
      <summary className="cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Briefing</p>
            <p className="mt-1 text-sm font-medium text-slate-200">Analyst narrative</p>
          </div>
          <span className="text-xs font-medium text-slate-500 group-open:text-brand-500/90">Expand</span>
        </div>
      </summary>
      <div className="border-t border-slate-800/90 px-5 pb-5 pt-2">
        <div className="space-y-3 text-sm leading-relaxed text-slate-400">
          {paragraphs.map((p, i) => (
            <p key={i}>{p.replace(/\*\*/g, "")}</p>
          ))}
        </div>
      </div>
    </details>
  );
}
