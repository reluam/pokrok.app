import { sql } from "./database";
import type {
  ToolboxTool,
  ToolboxToolInput,
  ToolboxToolCard,
  ToolSource,
} from "./toolbox";

// ── Row mapping ──────────────────────────────────────────────────────────────

type ToolRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description_markdown: string;
  application_markdown: string;
  sources: ToolSource[];
  tags: string[] | null;
  category: string | null;
  difficulty: number | null;
  duration_estimate: string | null;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  is_featured: boolean;
  related_tool_ids: string[] | null;
  tool_type: string;
  component_id: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: ToolRow): ToolboxTool {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    descriptionMarkdown: row.description_markdown,
    applicationMarkdown: row.application_markdown,
    sources: Array.isArray(row.sources) ? row.sources : [],
    tags: row.tags ?? [],
    category: row.category ?? undefined,
    difficulty: row.difficulty ?? undefined,
    durationEstimate: row.duration_estimate ?? undefined,
    icon: row.icon ?? undefined,
    orderIndex: row.order_index,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    relatedToolIds: row.related_tool_ids ?? [],
    toolType: (row.tool_type as "knowledge" | "interactive") ?? "knowledge",
    componentId: row.component_id ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

type CardRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  category: string | null;
  tags: string[] | null;
  difficulty: number | null;
  duration_estimate: string | null;
  icon: string | null;
  is_featured: boolean;
  order_index: number;
  tool_type: string;
  component_id: string | null;
};

function mapCardRow(row: CardRow): ToolboxToolCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    category: row.category,
    tags: row.tags ?? [],
    difficulty: row.difficulty,
    durationEstimate: row.duration_estimate,
    icon: row.icon,
    isFeatured: row.is_featured,
    orderIndex: row.order_index,
    toolType: (row.tool_type as "knowledge" | "interactive") ?? "knowledge",
    componentId: row.component_id ?? null,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getAllTools(
  options: { includeInactive?: boolean } = {}
): Promise<ToolboxTool[]> {
  const { includeInactive = false } = options;

  const rows = (await sql`
    SELECT
      id, slug, title, short_description,
      description_markdown, application_markdown,
      sources, tags, category, difficulty,
      duration_estimate, icon, order_index,
      is_active, is_featured, related_tool_ids, tool_type, component_id,
      created_at, updated_at
    FROM toolbox_tools
    ${includeInactive ? sql`` : sql`WHERE is_active = true`}
    ORDER BY is_featured DESC, order_index ASC, created_at DESC
  `) as ToolRow[];

  return rows.map(mapRow);
}

/** Lightweight card query for gallery (no markdown columns). */
export async function getToolCards(options: {
  category?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ tools: ToolboxToolCard[]; total: number }> {
  const { category, tag, search, limit = 24, offset = 0 } = options;
  const searchPattern = search ? `%${search}%` : null;

  const countRows = (await sql`
    SELECT COUNT(*)::int AS total
    FROM toolbox_tools
    WHERE is_active = true
      AND (${category ?? null}::text IS NULL OR category = ${category ?? null})
      AND (${tag ?? null}::text IS NULL OR ${tag ?? null} = ANY(tags))
      AND (${searchPattern}::text IS NULL OR title ILIKE ${searchPattern} OR short_description ILIKE ${searchPattern})
  `) as { total: number }[];
  const total = countRows[0]?.total ?? 0;

  const rows = (await sql`
    SELECT id, slug, title, short_description, category, tags, difficulty,
           duration_estimate, icon, is_featured, order_index, tool_type, component_id
    FROM toolbox_tools
    WHERE is_active = true
      AND (${category ?? null}::text IS NULL OR category = ${category ?? null})
      AND (${tag ?? null}::text IS NULL OR ${tag ?? null} = ANY(tags))
      AND (${searchPattern}::text IS NULL OR title ILIKE ${searchPattern} OR short_description ILIKE ${searchPattern})
    ORDER BY is_featured DESC, order_index ASC, created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as CardRow[];

  return { tools: rows.map(mapCardRow), total };
}

/** Tool cards with created_at/updated_at — for merging into inspiration feed. */
export async function getToolCardsWithDates(): Promise<(ToolboxToolCard & { createdAt: string; updatedAt: string })[]> {
  const rows = (await sql`
    SELECT id, slug, title, short_description, category, tags, difficulty,
           duration_estimate, icon, is_featured, order_index, tool_type, component_id,
           created_at, updated_at
    FROM toolbox_tools
    WHERE is_active = true
    ORDER BY is_featured DESC, order_index ASC, created_at DESC
  `) as (CardRow & { created_at: Date; updated_at: Date })[];

  return rows.map((row) => ({
    ...mapCardRow(row),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function getToolBySlug(slug: string): Promise<ToolboxTool | null> {
  const rows = (await sql`
    SELECT
      id, slug, title, short_description,
      description_markdown, application_markdown,
      sources, tags, category, difficulty,
      duration_estimate, icon, order_index,
      is_active, is_featured, related_tool_ids, tool_type, component_id,
      created_at, updated_at
    FROM toolbox_tools
    WHERE slug = ${slug}
    LIMIT 1
  `) as ToolRow[];

  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function getToolById(id: string): Promise<ToolboxTool | null> {
  const rows = (await sql`
    SELECT
      id, slug, title, short_description,
      description_markdown, application_markdown,
      sources, tags, category, difficulty,
      duration_estimate, icon, order_index,
      is_active, is_featured, related_tool_ids, tool_type, component_id,
      created_at, updated_at
    FROM toolbox_tools
    WHERE id = ${id}
    LIMIT 1
  `) as ToolRow[];

  const row = rows[0];
  return row ? mapRow(row) : null;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createTool(input: ToolboxToolInput): Promise<ToolboxTool> {
  const id = `tool_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date();

  const [{ max_order_index }] = (await sql`
    SELECT COALESCE(MAX(order_index), 0) AS max_order_index
    FROM toolbox_tools
  `) as { max_order_index: number }[];

  const currentMax = Number(max_order_index) || 0;
  let targetIndex = input.orderIndex ?? currentMax + 1;
  if (!Number.isFinite(targetIndex) || targetIndex < 1) targetIndex = 1;
  if (targetIndex > currentMax + 1) targetIndex = currentMax + 1;

  if (currentMax > 0) {
    await sql`
      UPDATE toolbox_tools
      SET order_index = order_index + 1
      WHERE order_index >= ${targetIndex}
    `;
  }

  await sql`
    INSERT INTO toolbox_tools (
      id, slug, title, short_description,
      description_markdown, application_markdown,
      sources, tags, category, difficulty,
      duration_estimate, icon, order_index,
      is_active, is_featured, related_tool_ids, tool_type, component_id,
      created_at, updated_at
    ) VALUES (
      ${id},
      ${input.slug},
      ${input.title},
      ${input.shortDescription},
      ${input.descriptionMarkdown},
      ${input.applicationMarkdown},
      ${JSON.stringify(input.sources ?? [])},
      ${input.tags ?? []},
      ${input.category ?? null},
      ${input.difficulty ?? null},
      ${input.durationEstimate ?? null},
      ${input.icon ?? null},
      ${targetIndex},
      ${input.isActive ?? true},
      ${input.isFeatured ?? false},
      ${input.relatedToolIds ?? []},
      ${input.toolType ?? "knowledge"},
      ${input.componentId ?? null},
      ${now},
      ${now}
    )
  `;

  await resequenceTools();

  return {
    id,
    slug: input.slug,
    title: input.title,
    shortDescription: input.shortDescription,
    descriptionMarkdown: input.descriptionMarkdown,
    applicationMarkdown: input.applicationMarkdown,
    sources: input.sources ?? [],
    tags: input.tags ?? [],
    category: input.category,
    difficulty: input.difficulty,
    durationEstimate: input.durationEstimate,
    icon: input.icon,
    orderIndex: targetIndex,
    isActive: input.isActive ?? true,
    isFeatured: input.isFeatured ?? false,
    relatedToolIds: input.relatedToolIds ?? [],
    toolType: input.toolType ?? "knowledge",
    componentId: input.componentId ?? null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function updateTool(
  id: string,
  updates: Partial<ToolboxToolInput>
): Promise<ToolboxTool | null> {
  const existing = await getToolById(id);
  if (!existing) return null;

  let targetOrderIndex = existing.orderIndex;
  if (updates.orderIndex !== undefined) {
    const [{ max_order_index }] = (await sql`
      SELECT COALESCE(MAX(order_index), 0) AS max_order_index
      FROM toolbox_tools
    `) as { max_order_index: number }[];

    const currentMax = Number(max_order_index) || 0;
    targetOrderIndex = updates.orderIndex ?? existing.orderIndex;

    if (!Number.isFinite(targetOrderIndex) || targetOrderIndex < 1) targetOrderIndex = 1;
    if (targetOrderIndex > currentMax) targetOrderIndex = currentMax;

    if (targetOrderIndex !== existing.orderIndex && currentMax > 0) {
      if (targetOrderIndex < existing.orderIndex) {
        await sql`
          UPDATE toolbox_tools
          SET order_index = order_index + 1
          WHERE id <> ${id}
            AND order_index >= ${targetOrderIndex}
            AND order_index < ${existing.orderIndex}
        `;
      } else {
        await sql`
          UPDATE toolbox_tools
          SET order_index = order_index - 1
          WHERE id <> ${id}
            AND order_index <= ${targetOrderIndex}
            AND order_index > ${existing.orderIndex}
        `;
      }
    }
  }

  const next = {
    slug: updates.slug ?? existing.slug,
    title: updates.title ?? existing.title,
    shortDescription: updates.shortDescription ?? existing.shortDescription,
    descriptionMarkdown: updates.descriptionMarkdown ?? existing.descriptionMarkdown,
    applicationMarkdown: updates.applicationMarkdown ?? existing.applicationMarkdown,
    sources: updates.sources ?? existing.sources,
    tags: updates.tags ?? existing.tags,
    category: updates.category ?? existing.category ?? null,
    difficulty: updates.difficulty ?? existing.difficulty ?? null,
    durationEstimate: updates.durationEstimate ?? existing.durationEstimate ?? null,
    icon: updates.icon ?? existing.icon ?? null,
    orderIndex: targetOrderIndex,
    isActive: updates.isActive ?? existing.isActive,
    isFeatured: updates.isFeatured ?? existing.isFeatured,
    relatedToolIds: updates.relatedToolIds ?? existing.relatedToolIds,
    toolType: updates.toolType ?? existing.toolType ?? "knowledge",
    componentId: updates.componentId ?? existing.componentId ?? null,
  };

  const now = new Date();

  await sql`
    UPDATE toolbox_tools
    SET
      slug = ${next.slug},
      title = ${next.title},
      short_description = ${next.shortDescription},
      description_markdown = ${next.descriptionMarkdown},
      application_markdown = ${next.applicationMarkdown},
      sources = ${JSON.stringify(next.sources)},
      tags = ${next.tags},
      category = ${next.category},
      difficulty = ${next.difficulty},
      duration_estimate = ${next.durationEstimate},
      icon = ${next.icon},
      order_index = ${next.orderIndex},
      is_active = ${next.isActive},
      is_featured = ${next.isFeatured},
      related_tool_ids = ${next.relatedToolIds},
      tool_type = ${next.toolType},
      component_id = ${next.componentId},
      updated_at = ${now}
    WHERE id = ${id}
  `;

  await resequenceTools();

  return {
    id,
    ...next,
    category: next.category ?? undefined,
    difficulty: next.difficulty ?? undefined,
    durationEstimate: next.durationEstimate ?? undefined,
    icon: next.icon ?? undefined,
    createdAt: existing.createdAt,
    updatedAt: now.toISOString(),
  };
}

export async function deleteTool(id: string): Promise<boolean> {
  const existing = await getToolById(id);
  if (!existing) return false;

  await sql`DELETE FROM toolbox_tools WHERE id = ${id}`;

  await sql`
    UPDATE toolbox_tools
    SET order_index = order_index - 1
    WHERE order_index > ${existing.orderIndex}
  `;

  await resequenceTools();
  return true;
}

async function resequenceTools() {
  await sql`
    WITH ordered AS (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY order_index ASC, created_at ASC) AS new_order_index
      FROM toolbox_tools
    )
    UPDATE toolbox_tools t
    SET order_index = o.new_order_index
    FROM ordered o
    WHERE t.id = o.id
      AND t.order_index <> o.new_order_index
  `;
}
