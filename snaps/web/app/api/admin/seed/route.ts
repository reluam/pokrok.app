import { NextResponse } from 'next/server';
import { getAdminSession } from '@web/lib/admin-auth';
import { getAdminSupabase } from '@web/lib/supabase-admin';
import { tracks } from '@/data/tracks';
import { courses } from '@/data/courses';
import { allModels } from '@/data/models/index';
import { allLessons } from '@/data/lessons/index';

export const runtime = 'nodejs';

/**
 * One-shot seeder: loads bundled data/*.ts and upserts every track/course/model/lesson
 * into content_items. Both draft and published are populated with the same snapshot
 * so the app can immediately start reading from the DB.
 *
 * Re-running is idempotent (upsert by id), but it will overwrite any in-DB edits
 * for existing items. Query param `?mode=draft-only` keeps existing published snapshots.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const draftOnly = url.searchParams.get('mode') === 'draft-only';

  const db = getAdminSupabase();
  const now = new Date().toISOString();

  type Row = {
    id: string;
    kind: 'track' | 'course' | 'model' | 'lesson';
    parent_id: string | null;
    sort_order: number;
    draft: Record<string, unknown>;
    published?: Record<string, unknown> | null;
    published_at?: string | null;
  };

  const rows: Row[] = [];

  for (const t of tracks) {
    const { id, order, ...rest } = t;
    rows.push({
      id,
      kind: 'track',
      parent_id: null,
      sort_order: order,
      draft: rest,
      ...(draftOnly ? {} : { published: rest, published_at: now }),
    });
  }

  for (const c of courses) {
    const { id, order, trackId, ...rest } = c;
    rows.push({
      id,
      kind: 'course',
      parent_id: trackId ?? null,
      sort_order: order,
      draft: rest,
      ...(draftOnly ? {} : { published: rest, published_at: now }),
    });
  }

  for (const m of allModels) {
    const { id, ...rest } = m;
    rows.push({
      id,
      kind: 'model',
      parent_id: null,
      sort_order: 0,
      draft: rest,
      ...(draftOnly ? {} : { published: rest, published_at: now }),
    });
  }

  for (const l of allLessons) {
    const { id, model_id, order_index, ...rest } = l;
    rows.push({
      id,
      kind: 'lesson',
      parent_id: model_id,
      sort_order: order_index,
      draft: rest,
      ...(draftOnly ? {} : { published: rest, published_at: now }),
    });
  }

  // Upsert in batches to stay well under row-size limits.
  const BATCH = 200;
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await db.from('content_items').upsert(slice, { onConflict: 'id' });
    if (error) {
      return NextResponse.json(
        { error: error.message, written, total: rows.length },
        { status: 500 },
      );
    }
    written += slice.length;
  }

  await db.from('content_audit').insert({
    actor_email: session.email,
    action: 'seed',
    item_id: null,
    item_kind: null,
    diff: { count: written, draft_only: draftOnly },
  });

  const counts = {
    tracks: tracks.length,
    courses: courses.length,
    models: allModels.length,
    lessons: allLessons.length,
    total: rows.length,
  };

  return NextResponse.json({ success: true, counts, draft_only: draftOnly });
}
