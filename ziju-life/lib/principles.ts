import { sql } from "./database";

export interface PrincipleInput {
  slug: string;
  title: string;
  shortDescription: string;
  contentMarkdown: string;
  orderIndex?: number;
  videoUrl?: string | null;
  relatedInspirationIds?: string[];
  isActive?: boolean;
}

export interface Principle extends PrincipleInput {
  id: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type PrincipleRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  content_markdown: string;
  order_index: number;
  video_url: string | null;
  related_inspiration_ids: string[] | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: PrincipleRow): Principle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    contentMarkdown: row.content_markdown,
    orderIndex: row.order_index,
    videoUrl: row.video_url ?? null,
    relatedInspirationIds: row.related_inspiration_ids ?? [],
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getAllPrinciples(options: { includeInactive?: boolean } = {}): Promise<Principle[]> {
  const { includeInactive = false } = options;

  const rows = (await sql`
    SELECT
      id,
      slug,
      title,
      short_description,
      content_markdown,
      order_index,
      video_url,
      related_inspiration_ids,
      is_active,
      created_at,
      updated_at
    FROM principles
    ${includeInactive ? sql`` : sql`WHERE is_active = true`}
    ORDER BY order_index ASC, created_at DESC
  `) as PrincipleRow[];

  return rows.map(mapRow);
}

export async function getPrincipleBySlug(slug: string): Promise<Principle | null> {
  const rows = (await sql`
    SELECT
      id,
      slug,
      title,
      short_description,
      content_markdown,
      order_index,
      video_url,
      related_inspiration_ids,
      is_active,
      created_at,
      updated_at
    FROM principles
    WHERE slug = ${slug}
    LIMIT 1
  `) as PrincipleRow[];

  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function getPrincipleById(id: string): Promise<Principle | null> {
  const rows = (await sql`
    SELECT
      id,
      slug,
      title,
      short_description,
      content_markdown,
      order_index,
      video_url,
      related_inspiration_ids,
      is_active,
      created_at,
      updated_at
    FROM principles
    WHERE id = ${id}
    LIMIT 1
  `) as PrincipleRow[];

  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function createPrinciple(input: PrincipleInput): Promise<Principle> {
  const id = `princip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();

  await sql`
    INSERT INTO principles (
      id,
      slug,
      title,
      short_description,
      content_markdown,
      order_index,
      video_url,
      related_inspiration_ids,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      ${id},
      ${input.slug},
      ${input.title},
      ${input.shortDescription},
      ${input.contentMarkdown},
      ${input.orderIndex ?? 0},
      ${input.videoUrl ?? null},
      ${input.relatedInspirationIds ?? []},
      ${input.isActive ?? true},
      ${now},
      ${now}
    )
  `;

  return {
    id,
    slug: input.slug,
    title: input.title,
    shortDescription: input.shortDescription,
    contentMarkdown: input.contentMarkdown,
    orderIndex: input.orderIndex ?? 0,
    videoUrl: input.videoUrl ?? null,
    relatedInspirationIds: input.relatedInspirationIds ?? [],
    isActive: input.isActive ?? true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function updatePrinciple(
  id: string,
  updates: Partial<PrincipleInput>
): Promise<Principle | null> {
  const existing = await getPrincipleById(id);
  if (!existing) return null;

  const next: PrincipleInput = {
    slug: updates.slug ?? existing.slug,
    title: updates.title ?? existing.title,
    shortDescription: updates.shortDescription ?? existing.shortDescription,
    contentMarkdown: updates.contentMarkdown ?? existing.contentMarkdown,
    orderIndex: updates.orderIndex ?? existing.orderIndex,
    videoUrl: updates.videoUrl ?? existing.videoUrl ?? undefined,
    relatedInspirationIds: updates.relatedInspirationIds ?? existing.relatedInspirationIds,
    isActive: updates.isActive ?? existing.isActive,
  };

  const now = new Date();

  await sql`
    UPDATE principles
    SET
      slug = ${next.slug},
      title = ${next.title},
      short_description = ${next.shortDescription},
      content_markdown = ${next.contentMarkdown},
      order_index = ${next.orderIndex ?? 0},
      video_url = ${next.videoUrl ?? null},
      related_inspiration_ids = ${next.relatedInspirationIds ?? []},
      is_active = ${next.isActive ?? true},
      updated_at = ${now}
    WHERE id = ${id}
  `;

  return {
    id,
    ...next,
    orderIndex: next.orderIndex ?? 0,
    relatedInspirationIds: next.relatedInspirationIds ?? [],
    isActive: next.isActive ?? true,
    createdAt: existing.createdAt,
    updatedAt: now.toISOString(),
  };
}

export async function deletePrinciple(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM principles
    WHERE id = ${id}
  `;

  // neon returns void; we can re-check existence instead
  const stillExists = await getPrincipleById(id);
  return !stillExists;
}

