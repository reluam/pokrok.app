"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import type { PublicComment } from "@/lib/commentsDb";

const MAX = 4000;

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const s = Math.max(0, Math.round((Date.now() - d) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type Node = PublicComment & { children: Node[] };

function buildTree(flat: PublicComment[]): Node[] {
  const map = new Map<number, Node>();
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: Node[] = [];
  map.forEach((n) => {
    const parent = n.parentId != null ? map.get(n.parentId) : null;
    if (parent) parent.children.push(n);
    else roots.push(n);
  });
  // Smazaný uzel bez žádného viditelného potomka zahodíme (ať thread nezasviní prázdné tombstony).
  const prune = (nodes: Node[]): Node[] =>
    nodes
      .map((n) => ({ ...n, children: prune(n.children) }))
      .filter((n) => !n.deleted || n.children.length > 0);
  return prune(roots);
}

export function Comments({ pageSlug }: { pageSlug: string }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/comments?page=${encodeURIComponent(pageSlug)}`, { cache: "no-store" });
        const data = await res.json();
        if (active) setComments(Array.isArray(data.comments) ? data.comments : []);
      } catch {
        /* ticho — prázdná sekce je lepší než rozbitá stránka */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pageSlug]);

  const tree = useMemo(() => buildTree(comments), [comments]);
  const visibleCount = useMemo(() => comments.filter((c) => !c.deleted).length, [comments]);

  const post = useCallback(
    async (body: string, parentId: number | null) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page: pageSlug, body, parentId }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data?.comment) {
        setComments((prev) => [...prev, data.comment as PublicComment]);
        setReplyTo(null);
        return true;
      }
      return false;
    },
    [pageSlug],
  );

  const remove = useCallback(async (id: number) => {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, deleted: true, body: "", authorName: "" } : c)));
    }
  }, []);

  return (
    <section className="cmt-wrap" data-noodle="eat">
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, letterSpacing: "-0.02em", fontSize: 22, marginBottom: 4 }}>
        Comments {visibleCount > 0 && <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>· {visibleCount}</span>}
      </h2>

      {isLoaded && !isSignedIn && (
        <div style={{ padding: "14px 0 18px", borderTop: "1px solid rgba(26,22,20,0.1)", marginTop: 12 }}>
          <SignInButton mode="modal">
            <button className="sbtn" style={{ fontSize: 13.5, padding: "9px 18px" }}>Sign in to comment</button>
          </SignInButton>
        </div>
      )}

      {isLoaded && isSignedIn && (
        <CommentForm onSubmit={(b) => post(b, null)} avatar={user?.imageUrl} placeholder="Add a comment…" />
      )}

      <div className="cmt-list" style={{ marginTop: 8 }}>
        {loading ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", padding: "14px 0", borderTop: "1px solid rgba(26,22,20,0.1)" }}>Loading…</p>
        ) : tree.length === 0 ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", padding: "14px 0", borderTop: "1px solid rgba(26,22,20,0.1)" }}>No comments yet. Be the first.</p>
        ) : (
          tree.map((n) => (
            <CommentNode
              key={n.id}
              node={n}
              meId={user?.id}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              onReply={(b, pid) => post(b, pid)}
              onDelete={remove}
              depth={0}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CommentNode({
  node,
  meId,
  replyTo,
  setReplyTo,
  onReply,
  onDelete,
  depth,
}: {
  node: Node;
  meId: string | undefined;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  onReply: (body: string, parentId: number) => Promise<boolean>;
  onDelete: (id: number) => void;
  depth: number;
}) {
  const mine = !!meId && meId === node.userId;
  return (
    <div className="cmt">
      {node.deleted ? (
        <p className="cmt-deleted">[comment removed]</p>
      ) : (
        <>
          <div className="cmt-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {node.authorAvatar ? <img className="cmt-avatar" src={node.authorAvatar} alt="" /> : <span className="cmt-avatar" />}
            <span className="cmt-name">{node.authorName}</span>
            <span className="cmt-time">{timeAgo(node.createdAt)}</span>
          </div>
          <p className="cmt-body">{node.body}</p>
          <div className="cmt-actions">
            {depth < 4 && meId && (
              <button className="cmt-action" onClick={() => setReplyTo(replyTo === node.id ? null : node.id)}>
                {replyTo === node.id ? "Cancel" : "Reply"}
              </button>
            )}
            {mine && (
              <button className="cmt-action" onClick={() => onDelete(node.id)}>
                Delete
              </button>
            )}
          </div>
          {replyTo === node.id && (
            <div style={{ marginTop: 10 }}>
              <CommentForm
                onSubmit={async (b) => {
                  const ok = await onReply(b, node.id);
                  return ok;
                }}
                placeholder={`Reply to ${node.authorName}…`}
                small
              />
            </div>
          )}
        </>
      )}

      {node.children.length > 0 && (
        <div className="cmt-children">
          {node.children.map((c) => (
            <CommentNode
              key={c.id}
              node={c}
              meId={meId}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  onSubmit,
  avatar,
  placeholder,
  small,
}: {
  onSubmit: (body: string) => Promise<boolean>;
  avatar?: string | null;
  placeholder?: string;
  small?: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const trimmed = text.trim();
  const tooLong = text.length > MAX;

  const submit = async () => {
    if (!trimmed || tooLong || busy) return;
    setBusy(true);
    const ok = await onSubmit(trimmed);
    setBusy(false);
    if (ok) setText("");
  };

  return (
    <div style={{ padding: small ? 0 : "14px 0 18px", ...(small ? {} : { borderTop: "1px solid rgba(26,22,20,0.1)", marginTop: 12 }) }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {!small && avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cmt-avatar" src={avatar} alt="" />
        )}
        <textarea
          className="cmt-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, justifyContent: "flex-end" }}>
        {tooLong && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "#c0392b" }}>{text.length}/{MAX}</span>}
        <button className="sbtn" style={{ fontSize: 13, padding: "8px 18px", opacity: !trimmed || tooLong || busy ? 0.5 : 1 }} disabled={!trimmed || tooLong || busy} onClick={submit}>
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
