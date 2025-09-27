export function InsightsCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
      <p className="text-xs uppercase tracking-widest text-slate-500">{title}</p>
      <p className="mt-2 text-xs text-slate-300">{body}</p>
    </div>
  );
}

