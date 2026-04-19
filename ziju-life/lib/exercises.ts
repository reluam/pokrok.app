import { sql } from "./database";

export interface ExerciseInput {
  slug: string;
  title: string;
  emoji?: string | null;
  bodyMarkdown: string;
  orderIndex?: number;
  resourceUrl?: string | null;
  relatedPostSlug?: string | null;
  isActive?: boolean;
}

export interface Exercise extends ExerciseInput {
  id: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type ExerciseRow = {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  body_markdown: string;
  order_index: number;
  resource_url: string | null;
  related_post_slug: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    emoji: row.emoji,
    bodyMarkdown: row.body_markdown,
    orderIndex: row.order_index,
    resourceUrl: row.resource_url,
    relatedPostSlug: row.related_post_slug,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getAllExercises(
  options: { includeInactive?: boolean } = {}
): Promise<Exercise[]> {
  const { includeInactive = false } = options;

  const rows = (await sql`
    SELECT id, slug, title, emoji, body_markdown, order_index,
           resource_url, related_post_slug, is_active, created_at, updated_at
    FROM exercises
    ${includeInactive ? sql`` : sql`WHERE is_active = true`}
    ORDER BY order_index ASC, created_at DESC
  `) as ExerciseRow[];

  return rows.map(mapRow);
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const rows = (await sql`
    SELECT id, slug, title, emoji, body_markdown, order_index,
           resource_url, related_post_slug, is_active, created_at, updated_at
    FROM exercises
    WHERE id = ${id}
    LIMIT 1
  `) as ExerciseRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const id = `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();

  const [{ max_order_index }] = (await sql`
    SELECT COALESCE(MAX(order_index), 0) AS max_order_index FROM exercises
  `) as { max_order_index: number }[];
  const currentMax = Number(max_order_index) || 0;

  let targetIndex = input.orderIndex ?? currentMax + 1;
  if (!Number.isFinite(targetIndex) || targetIndex < 1) targetIndex = 1;
  if (targetIndex > currentMax + 1) targetIndex = currentMax + 1;

  if (currentMax > 0) {
    await sql`
      UPDATE exercises
      SET order_index = order_index + 1
      WHERE order_index >= ${targetIndex}
    `;
  }

  await sql`
    INSERT INTO exercises (
      id, slug, title, emoji, body_markdown, order_index,
      resource_url, related_post_slug, is_active, created_at, updated_at
    ) VALUES (
      ${id},
      ${input.slug},
      ${input.title},
      ${input.emoji ?? null},
      ${input.bodyMarkdown},
      ${targetIndex},
      ${input.resourceUrl ?? null},
      ${input.relatedPostSlug ?? null},
      ${input.isActive ?? true},
      ${now},
      ${now}
    )
  `;

  await resequenceExercises();

  return {
    id,
    slug: input.slug,
    title: input.title,
    emoji: input.emoji ?? null,
    bodyMarkdown: input.bodyMarkdown,
    orderIndex: targetIndex,
    resourceUrl: input.resourceUrl ?? null,
    relatedPostSlug: input.relatedPostSlug ?? null,
    isActive: input.isActive ?? true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function updateExercise(
  id: string,
  updates: Partial<ExerciseInput>
): Promise<Exercise | null> {
  const existing = await getExerciseById(id);
  if (!existing) return null;

  let targetOrderIndex = existing.orderIndex;
  if (updates.orderIndex !== undefined) {
    const [{ max_order_index }] = (await sql`
      SELECT COALESCE(MAX(order_index), 0) AS max_order_index FROM exercises
    `) as { max_order_index: number }[];
    const currentMax = Number(max_order_index) || 0;
    targetOrderIndex = updates.orderIndex ?? existing.orderIndex;
    if (!Number.isFinite(targetOrderIndex) || targetOrderIndex < 1) targetOrderIndex = 1;
    if (targetOrderIndex > currentMax) targetOrderIndex = currentMax;

    if (targetOrderIndex !== existing.orderIndex && currentMax > 0) {
      if (targetOrderIndex < existing.orderIndex) {
        await sql`
          UPDATE exercises SET order_index = order_index + 1
          WHERE id <> ${id}
            AND order_index >= ${targetOrderIndex}
            AND order_index < ${existing.orderIndex}
        `;
      } else {
        await sql`
          UPDATE exercises SET order_index = order_index - 1
          WHERE id <> ${id}
            AND order_index <= ${targetOrderIndex}
            AND order_index > ${existing.orderIndex}
        `;
      }
    }
  }

  const next: ExerciseInput = {
    slug: updates.slug ?? existing.slug,
    title: updates.title ?? existing.title,
    emoji: updates.emoji !== undefined ? updates.emoji : existing.emoji,
    bodyMarkdown: updates.bodyMarkdown ?? existing.bodyMarkdown,
    orderIndex: targetOrderIndex,
    resourceUrl:
      updates.resourceUrl !== undefined ? updates.resourceUrl : existing.resourceUrl,
    relatedPostSlug:
      updates.relatedPostSlug !== undefined
        ? updates.relatedPostSlug
        : existing.relatedPostSlug,
    isActive: updates.isActive ?? existing.isActive,
  };

  const now = new Date();

  await sql`
    UPDATE exercises SET
      slug = ${next.slug},
      title = ${next.title},
      emoji = ${next.emoji ?? null},
      body_markdown = ${next.bodyMarkdown},
      order_index = ${next.orderIndex ?? 0},
      resource_url = ${next.resourceUrl ?? null},
      related_post_slug = ${next.relatedPostSlug ?? null},
      is_active = ${next.isActive ?? true},
      updated_at = ${now}
    WHERE id = ${id}
  `;

  await resequenceExercises();

  return {
    id,
    ...next,
    emoji: next.emoji ?? null,
    orderIndex: next.orderIndex ?? 0,
    resourceUrl: next.resourceUrl ?? null,
    relatedPostSlug: next.relatedPostSlug ?? null,
    isActive: next.isActive ?? true,
    createdAt: existing.createdAt,
    updatedAt: now.toISOString(),
  };
}

export async function deleteExercise(id: string): Promise<boolean> {
  const existing = await getExerciseById(id);
  if (!existing) return false;

  await sql`DELETE FROM exercises WHERE id = ${id}`;
  await sql`
    UPDATE exercises SET order_index = order_index - 1
    WHERE order_index > ${existing.orderIndex}
  `;
  await resequenceExercises();
  return true;
}

async function resequenceExercises() {
  await sql`
    WITH ordered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY order_index ASC, created_at ASC) AS new_order_index
      FROM exercises
    )
    UPDATE exercises e
    SET order_index = o.new_order_index
    FROM ordered o
    WHERE e.id = o.id AND e.order_index <> o.new_order_index
  `;
}
