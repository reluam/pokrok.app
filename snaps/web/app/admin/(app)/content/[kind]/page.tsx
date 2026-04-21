import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { getAdminSupabase } from '@web/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const KIND_LABELS: Record<string, string> = {
  track: 'Tracks',
  course: 'Kurzy',
  model: 'Koncepty',
  lesson: 'Lekce',
};

interface ContentRow {
  id: string;
  kind: string;
  parent_id: string | null;
  sort_order: number;
  draft: Record<string, unknown>;
  published: Record<string, unknown> | null;
  updated_at: string;
}

function title(row: ContentRow): string {
  const src = (row.draft ?? {}) as Record<string, unknown>;
  if (typeof src.title === 'string') return src.title;
  if (typeof src.name_cz === 'string') return src.name_cz;
  if (typeof src.name === 'string') return src.name;
  if (typeof src.lesson_type === 'string') return `${src.lesson_type} lesson`;
  return row.id;
}

export default async function AdminContentKindPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  if (!(kind in KIND_LABELS)) notFound();

  const db = getAdminSupabase();
  const { data, error } = await db
    .from('content_items')
    .select('id, kind, parent_id, sort_order, draft, published, updated_at')
    .eq('kind', kind)
    .order('parent_id', { nullsFirst: true })
    .order('sort_order');

  return (
    <div>
      <Link href="/admin/content" className="inline-flex items-center gap-xs text-xs font-bold text-ink-muted hover:text-ink-primary">
        <ArrowLeft className="h-3 w-3" /> Zpět na obsah
      </Link>
      <header className="mt-md mb-lg">
        <h1 className="text-2xl font-extrabold text-ink-primary">{KIND_LABELS[kind]}</h1>
        <p className="mt-xs text-sm text-ink-secondary">
          {(data?.length ?? 0)} položek · editor přijde v další iteraci
        </p>
      </header>

      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-md text-sm text-red-700">
          {error.message}
        </div>
      )}

      <ul className="divide-y divide-[#E5E7EB] rounded-2xl border-2 border-[#E5E7EB] bg-card shadow-[2px_4px_0_0_#D1D5DB]">
        {(data ?? []).map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-md px-md py-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-sm">
                {row.published ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 flex-shrink-0 text-[#F59E0B]" />
                )}
                <p className="truncate text-sm font-bold text-ink-primary">{title(row as ContentRow)}</p>
              </div>
              <div className="mt-xs flex items-center gap-sm text-[11px] text-ink-muted">
                <code>{row.id}</code>
                {row.parent_id && <span>· pod {row.parent_id}</span>}
                <span>· #{row.sort_order}</span>
              </div>
            </div>
            <span
              className={`rounded-full px-sm py-[2px] text-[10px] font-extrabold uppercase tracking-wider ${
                row.published ? 'bg-green-100 text-green-700' : 'bg-[#FEF3C7] text-[#92400E]'
              }`}
            >
              {row.published ? 'published' : 'draft'}
            </span>
          </li>
        ))}
        {(data?.length ?? 0) === 0 && (
          <li className="p-md text-center text-sm text-ink-muted">Zatím žádné položky.</li>
        )}
      </ul>
    </div>
  );
}
