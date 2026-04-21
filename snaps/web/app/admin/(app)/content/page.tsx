import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { getAdminSupabase } from '@web/lib/supabase-admin';
import { SeedButton } from './seed-button';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from('content_items')
    .select('kind, published')
    .order('kind');

  let counts = { track: 0, course: 0, model: 0, lesson: 0 };
  let published = { track: 0, course: 0, model: 0, lesson: 0 };
  if (data) {
    for (const row of data) {
      counts[row.kind as keyof typeof counts]++;
      if (row.published) published[row.kind as keyof typeof published]++;
    }
  }

  const totalItems = counts.track + counts.course + counts.model + counts.lesson;

  return (
    <div>
      <header className="mb-lg flex items-start justify-between gap-md">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-primary">Obsah</h1>
          <p className="mt-xs text-sm text-ink-secondary">
            Tracks, kurzy, koncepty a lekce. Každá položka má draft a published variantu.
          </p>
        </div>
        {totalItems === 0 && <SeedButton />}
      </header>

      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-md text-sm text-red-700">
          <p className="font-bold">Chyba při čtení obsahu.</p>
          <p className="mt-xs text-xs">{error.message}</p>
        </div>
      )}

      {totalItems === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-card p-xl text-center">
          <BookOpen className="mx-auto h-10 w-10 text-ink-muted" />
          <h2 className="mt-md text-lg font-extrabold text-ink-primary">
            Databáze je prázdná
          </h2>
          <p className="mx-auto mt-sm max-w-md text-sm text-ink-secondary">
            Začni tím, že nasypeš současný bundled obsah (data/*.ts) do databáze jedním
            kliknutím. Tenhle krok provedeš jen jednou — pak budeš vše editovat v adminu.
          </p>
          <div className="mt-md">
            <SeedButton />
          </div>
        </div>
      ) : (
        <section className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          <KindCard kind="track" label="Tracks" total={counts.track} published={published.track} />
          <KindCard kind="course" label="Kurzy" total={counts.course} published={published.course} />
          <KindCard kind="model" label="Koncepty" total={counts.model} published={published.model} />
          <KindCard kind="lesson" label="Lekce" total={counts.lesson} published={published.lesson} />
        </section>
      )}

      <div className="mt-lg rounded-xl border-2 border-dashed border-[#E5E7EB] bg-card p-md text-sm text-ink-muted">
        <p>
          <span className="font-bold text-ink-primary">Plná editace obsahu</span> (form-based editor s
          draft/publish flow, drag-n-drop pořadí) přijde v další iteraci. Zatím je admin read-only + seed.
        </p>
      </div>
    </div>
  );
}

function KindCard({
  kind,
  label,
  total,
  published,
}: {
  kind: string;
  label: string;
  total: number;
  published: number;
}) {
  const drafts = total - published;
  return (
    <Link
      href={`/admin/content/${kind}`}
      className="group rounded-2xl border-2 border-[#E5E7EB] bg-card p-md shadow-[2px_4px_0_0_#D1D5DB] transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
        <ArrowRight className="h-4 w-4 text-ink-muted group-hover:text-primary" />
      </div>
      <p className="mt-sm text-2xl font-extrabold text-ink-primary">{total}</p>
      <p className="mt-xs text-xs text-ink-muted">
        {published} published
        {drafts > 0 && <span className="ml-xs text-[#F59E0B]">· {drafts} draft</span>}
      </p>
    </Link>
  );
}
