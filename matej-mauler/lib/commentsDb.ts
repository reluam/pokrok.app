import { getDb } from "./db";

type Sql = ReturnType<typeof getDb>;

export const COMMENT_MAX_LEN = 4000;

export type CommentRow = {
  id: number | string;
  page_slug: string;
  parent_id: number | string | null;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  body: string;
  status: "visible" | "deleted";
  created_at: string;
  edited_at: string | null;
};

/** Co posíláme klientovi. Smazané komentáře zůstávají jako tombstone (kvůli vláknům), ale bez obsahu. */
export type PublicComment = {
  id: number;
  parentId: number | null;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
};

let ready = false;
async function ensure(sql: Sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS comments (
    id BIGSERIAL PRIMARY KEY,
    page_slug TEXT NOT NULL,
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'visible',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ
  )`;
  await sql`CREATE INDEX IF NOT EXISTS comments_page_idx ON comments (page_slug, created_at)`;
  ready = true;
}

function toPublic(r: CommentRow): PublicComment {
  const deleted = r.status === "deleted";
  return {
    id: Number(r.id),
    parentId: r.parent_id == null ? null : Number(r.parent_id),
    userId: deleted ? "" : r.user_id,
    authorName: deleted ? "" : r.author_name,
    authorAvatar: deleted ? null : r.author_avatar,
    body: deleted ? "" : r.body,
    createdAt: r.created_at,
    editedAt: r.edited_at,
    deleted,
  };
}

/** Všechny komentáře stránky chronologicky (vč. smazaných tombstonů — strom si poskládá klient). */
export async function listComments(pageSlug: string): Promise<PublicComment[]> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`
    SELECT * FROM comments WHERE page_slug = ${pageSlug} ORDER BY created_at ASC
  `) as CommentRow[];
  return rows.map(toPublic);
}

export async function countComments(pageSlug: string): Promise<number> {
  const sql = getDb();
  await ensure(sql);
  const rows = (await sql`
    SELECT COUNT(*)::int AS n FROM comments WHERE page_slug = ${pageSlug} AND status = 'visible'
  `) as { n: number }[];
  return rows[0]?.n ?? 0;
}

export async function addComment(input: {
  pageSlug: string;
  parentId: number | null;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
}): Promise<PublicComment | { error: string }> {
  const body = input.body.trim();
  if (!body) return { error: "empty" };
  if (body.length > COMMENT_MAX_LEN) return { error: "too_long" };

  const sql = getDb();
  await ensure(sql);

  // Parent musí existovat a patřit ke stejné stránce (zákaz cross-page vláken).
  if (input.parentId != null) {
    const parent = (await sql`
      SELECT id FROM comments WHERE id = ${input.parentId} AND page_slug = ${input.pageSlug} AND status = 'visible'
    `) as { id: number }[];
    if (parent.length === 0) return { error: "bad_parent" };
  }

  const rows = (await sql`
    INSERT INTO comments (page_slug, parent_id, user_id, author_name, author_avatar, body)
    VALUES (${input.pageSlug}, ${input.parentId}, ${input.userId}, ${input.authorName}, ${input.authorAvatar}, ${body})
    RETURNING *
  `) as CommentRow[];
  return toPublic(rows[0]);
}

/** Měkké smazání. Smí autor komentáře nebo admin. Vrací true, pokud něco smazal. */
export async function deleteComment(id: number, userId: string, isAdmin: boolean): Promise<boolean> {
  const sql = getDb();
  await ensure(sql);
  const rows = isAdmin
    ? ((await sql`UPDATE comments SET status = 'deleted' WHERE id = ${id} AND status = 'visible' RETURNING id`) as { id: number }[])
    : ((await sql`UPDATE comments SET status = 'deleted' WHERE id = ${id} AND user_id = ${userId} AND status = 'visible' RETURNING id`) as { id: number }[]);
  return rows.length > 0;
}
