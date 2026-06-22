"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/dictionaries";

/* ───────────────────────────────────────────────────────────────────
   Zamotaná nudle — easter egg na homepage.
   CÍL: sníst VŠECHEN text na stránce (slova, logo, tlačítka, texty karet).
   • obrázek experimentu (banner) = přebarví celou stránku do barev toho
     experimentu (nezabíjí); rychlost roste se skóre,
   • povede-li se sníst úplně vše → „Congratulations, good game" (ztmavení +
     bílý text), po pár vteřinách zmizí a vrátí se jen homepage,
   • jediná prohra = zamotat se sám do sebe.
   Vše kreslí průhledný canvas navrch; DOM se nemění → po konci se stránka
   sama „obnoví" (canvas se odmountuje, --bg se vrátí).
   ─────────────────────────────────────────────────────────────────── */

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifI: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };
const sans = "var(--font-sans)";

const CELL = 26; // velikost buňky v px (dokumentový prostor)
// rychlost roste se skóre: stepMs klesá z BASE_MS k MIN_MS
const BASE_MS = 132, MIN_MS = 52, SPEED_K = 0.06;
const WIN_HOLD_MS = 3600; // jak dlouho svítí „Congratulations" než se vrátí homepage

type Dir = { x: number; y: number };
type Cell = { x: number; y: number };
type Rect = { x0: number; y0: number; x1: number; y1: number };
type Food = Rect & { n: number; eaten: boolean; bg?: string };
type Paint = Rect & { color: string; hit: boolean };
type Game = {
  snake: Cell[];
  dir: Dir;
  nextDir: Dir;
  food: Food[];
  paints: Paint[];
  cards: Rect[];
  cols: number;
  rows: number;
  docW: number;
  docH: number;
  acc: number;
  last: number;
  score: number; // řídí rychlost
  stepMs: number; // aktuální ms na krok (i pro interpolaci)
  total: number; // počet soust na začátku (pro progress)
  eatenCount: number; // kolik soust snězeno (pro progress)
};

const UI = {
  cs: {
    scoreLabel: "Snědeno",
    exit: "Konec",
    again: "Hrát znovu",
    close: "Zavřít",
    controls: "šipky / WASD · táhni prstem · sněz všechen text · Esc = konec",
    over: "Konec",
  },
  en: {
    scoreLabel: "Eaten",
    exit: "Exit",
    again: "Play again",
    close: "Close",
    controls: "arrows / WASD · swipe · eat all the text · Esc = exit",
    over: "Game over",
  },
} as const;

const DEATHS_SELF: Record<Lang, string[]> = {
  cs: [
    "Zamotal ses sám do sebe. Klasika.",
    "Jediný uzel, co tě zastavil, byl tvůj vlastní.",
    "Snědl jsi vlastní ocas. Smyčka uzavřena.",
    "I špageta má hranice. Většinou vlastní.",
  ],
  en: [
    "You tangled into yourself. Classic.",
    "The only knot that stopped you was your own.",
    "You ate your own tail. Loop closed.",
    "Even spaghetti has limits. Mostly self-imposed.",
  ],
};

const opposite = (a: Dir, b: Dir) => a.x === -b.x && a.y === -b.y;
const inRect = (px: number, py: number, r: Rect) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1;
// buňka hlavy (CELL×CELL) se překrývá se soustem → sníst i při průjezdu jen částí textu
const cellHitsRect = (cx: number, cy: number, r: Rect) => cx * CELL < r.x1 && cx * CELL + CELL > r.x0 && cy * CELL < r.y1 && cy * CELL + CELL > r.y0;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const wob = (x: number, y: number, amp: number) => Math.sin(x * 0.9 + y * 1.7) * amp;
// barva pozadí elementu — jen když je NEPRŮHLEDNÁ; průhledné (karty po redesignu) → undefined = pozadí stránky
const opaqueBg = (el: Element | null): string | undefined => {
  if (!el) return undefined;
  const c = getComputedStyle(el).backgroundColor;
  if (!c || c === "transparent") return undefined;
  const m = c.match(/^rgba?\(([^)]+)\)/);
  if (m) {
    const a = m[1].split(",")[3];
    if (a !== undefined && parseFloat(a) < 0.99) return undefined; // poloprůhledné → pozadí stránky
  }
  return c;
};

type RGB = [number, number, number];
const hexToRgb = (color: string): RGB => {
  const c = (color || "").trim();
  const m = c.match(/^rgba?\(([^)]+)\)/i); // robustní i na "rgb(r,g,b)" (jinak by reset spadl na černou)
  if (m) {
    const [r, g, b] = m[1].split(",").map((x) => parseFloat(x));
    return [r || 0, g || 0, b || 0];
  }
  const h = c.replace("#", "");
  const s = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
  const v = parseInt(s.slice(0, 6) || "fafaf7", 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const rgbStr = (c: RGB) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

export function HomeNoodleGame({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: Lang }) {
  const t = UI[lang];
  const [phase, setPhase] = useState<"playing" | "dead" | "won">("playing");
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 — kolik textu už je posbíráno
  const [overLine, setOverLine] = useState("");
  const [round, setRound] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const eraseLayerRef = useRef<HTMLDivElement | null>(null); // DOM překryvy snědených slov (scrollují s textem)
  const colorsRef = useRef({ ink: "#1a1614", paper: "#FAFAF7", muted: "#9b958f" });
  const baseBgRef = useRef("#FAFAF7"); // PŮVODNÍ pozadí stránky (loop ho nepřepisuje) — pro reset při restartu
  const scrollRef = useRef(0);
  const themeCur = useRef<RGB>([250, 250, 247]);
  const themeTarget = useRef<RGB>([250, 250, 247]);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  /* ── posbírej slova z elementu (Range → rect na slovo) ── */
  const collectWords = useCallback((root: HTMLElement, out: Food[], sx: number, sy: number, bg?: string) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node.nodeValue ?? "";
      const re = /\S+/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const range = document.createRange();
        try {
          range.setStart(node, m.index);
          range.setEnd(node, m.index + m[0].length);
        } catch {
          continue;
        }
        const rects = range.getClientRects();
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          if (r.width < 2 || r.height < 2) continue;
          out.push({ x0: r.left + sx, y0: r.top + sy, x1: r.right + sx, y1: r.bottom + sy, n: m[0].length, eaten: false, bg });
        }
      }
      node = walker.nextNode();
    }
  }, []);

  /* ── postav svět z aktuálního DOM ── */
  const buildGame = useCallback((): Game | null => {
    const logoEl = document.querySelector<HTMLElement>('[data-noodle="logo"]');
    if (!logoEl) return null;
    const sx = window.scrollX, sy = window.scrollY;
    const toDoc = (r: DOMRect): Rect => ({ x0: r.left + sx, y0: r.top + sy, x1: r.right + sx, y1: r.bottom + sy });

    // jídlo: slova z textu + logo (text i obrázek)
    const food: Food[] = [];
    document.querySelectorAll<HTMLElement>('[data-noodle="eat"], [data-noodle="logo"]').forEach((el) => {
      // text na kartě sedí na bílém pozadí karty (#fff), jinak na pozadí stránky (--bg, tónuje se)
      const bg = opaqueBg(el.closest(".scard"));
      collectWords(el, food, sx, sy, bg);
      el.querySelectorAll("img").forEach((img) => {
        const r = img.getBoundingClientRect();
        if (r.width > 4 && r.height > 4) food.push({ x0: r.left + sx, y0: r.top + sy, x1: r.right + sx, y1: r.bottom + sy, n: 8, eaten: false, bg });
      });
    });

    // celé bloky (tlačítka) — sní se najednou i s pilulkou, ne jen text
    document.querySelectorAll<HTMLElement>('[data-noodle="eat-block"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const bg = opaqueBg(el.closest(".scard"));
      food.push({ x0: r.left + sx, y0: r.top + sy, x1: r.right + sx, y1: r.bottom + sy, n: 6, eaten: false, bg });
    });

    // obrázky experimentů = přebarvovací dlaždice
    const paints: Paint[] = [];
    document.querySelectorAll<HTMLElement>('[data-noodle="paint"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) paints.push({ ...toDoc(r), color: el.dataset.noodleColor || "#FAFAF7", hit: false });
    });

    // celé karty (nudle smí přes ně, jen je měříme)
    const cards: Rect[] = [];
    document.querySelectorAll<HTMLElement>(".scard").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) cards.push(toDoc(r));
    });

    const logo = toDoc(logoEl.getBoundingClientRect());
    const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth);
    const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    const cols = Math.max(8, Math.floor(docW / CELL));
    const rows = Math.max(8, Math.floor(docH / CELL));

    const hx = clamp(Math.floor((logo.x1 + CELL) / CELL), 0, cols - 1);
    const hy = clamp(Math.floor((logo.y0 + logo.y1) / 2 / CELL), 0, rows - 1);
    const snake: Cell[] = [];
    for (let i = 0; i < 5; i++) snake.push({ x: clamp(hx - i, 0, cols - 1), y: hy });

    return { snake, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, food, paints, cards, cols, rows, docW, docH, acc: 0, last: 0, score: 0, stepMs: BASE_MS, total: food.length, eatenCount: 0 };
  }, [collectWords]);

  /* ── canvas (fixed přes viewport, retina) ── */
  const ctxSetup = useCallback((): CanvasRenderingContext2D | null => {
    const cv = canvasRef.current;
    if (!cv) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    const ctx = cv.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }, []);

  const draw = useCallback((g: Game) => {
    const ctx = ctxSetup();
    if (!ctx) return;
    const { ink, paper } = colorsRef.current;
    const w = window.innerWidth, h = window.innerHeight;
    const sx = window.scrollX, sy = window.scrollY;
    ctx.clearRect(0, 0, w, h); // průhledné → stránka prosvítá (snědený text mizí přes DOM obdélníky)

    // nudle — plynulý pohyb: pozice se interpolují mezi kroky mřížky (t = postup do dalšího kroku)
    const amp = CELL * 0.06;
    const t = clamp(g.acc / g.stepMs, 0, 1);
    type Pt = { x: number; y: number };
    const vis: Pt[] = g.snake.map((c, i) => {
      if (i === 0) return { x: c.x + g.nextDir.x * t, y: c.y + g.nextDir.y * t }; // hlava klouže do další buňky
      const ahead = g.snake[i - 1];
      if (Math.abs(c.x - ahead.x) > 1 || Math.abs(c.y - ahead.y) > 1) return { x: c.x, y: c.y }; // wrap → neklouzat
      return { x: c.x + (ahead.x - c.x) * t, y: c.y + (ahead.y - c.y) * t };
    });
    const toScreen = (p: Pt) => ({ x: p.x * CELL + CELL / 2 - sx + wob(p.x, p.y, amp), y: p.y * CELL + CELL / 2 - sy + wob(p.y, p.x, amp) });
    const runs: Pt[][] = [];
    let run: Pt[] = [vis[0]];
    for (let i = 1; i < g.snake.length; i++) {
      const a = g.snake[i - 1], b = g.snake[i];
      if (Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1) { runs.push(run); run = [vis[i]]; }
      else run.push(vis[i]);
    }
    if (run.length) runs.push(run);

    const strokeRun = (pts: Pt[], width: number, color: string) => {
      const px = pts.map(toScreen);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (px.length === 1) {
        ctx.moveTo(px[0].x, px[0].y);
        ctx.lineTo(px[0].x + 0.1, px[0].y);
      } else {
        ctx.moveTo(px[0].x, px[0].y);
        for (let i = 1; i < px.length - 1; i++) {
          const mid = { x: (px[i].x + px[i + 1].x) / 2, y: (px[i].y + px[i + 1].y) / 2 };
          ctx.quadraticCurveTo(px[i].x, px[i].y, mid.x, mid.y);
        }
        ctx.lineTo(px[px.length - 1].x, px[px.length - 1].y);
      }
      ctx.stroke();
    };
    for (const r of runs) strokeRun(r, CELL * 0.7, ink);
    for (const r of runs) strokeRun(r, CELL * 0.16, paper);

    // očička na hlavě
    const head = toScreen(vis[0]);
    const d = g.nextDir;
    const fwd = d.x === 0 && d.y === 0 ? { x: 1, y: 0 } : d;
    const perp = { x: -fwd.y, y: fwd.x };
    for (const s of [-1, 1]) {
      const ex = head.x + perp.x * CELL * 0.17 * s + fwd.x * CELL * 0.08;
      const ey = head.y + perp.y * CELL * 0.17 * s + fwd.y * CELL * 0.08;
      ctx.fillStyle = paper;
      ctx.beginPath(); ctx.arc(ex, ey, CELL * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ink;
      ctx.beginPath(); ctx.arc(ex + fwd.x * CELL * 0.05, ey + fwd.y * CELL * 0.05, CELL * 0.06, 0, Math.PI * 2); ctx.fill();
    }
  }, [ctxSetup]);

  /* ── start / restart ── */
  const start = useCallback(() => {
    window.scrollTo(0, 0);
    if (eraseLayerRef.current) eraseLayerRef.current.replaceChildren(); // smaž překryvy z minula
    const g = buildGame();
    gameRef.current = g;
    scrollRef.current = 0;
    // reset pozadí na PŮVODNÍ (klasické) — žádný zbytek tintu z minulé hry
    document.documentElement.style.removeProperty("--bg");
    const base = baseBgRef.current || "#FAFAF7";
    colorsRef.current.paper = base;
    themeCur.current = hexToRgb(base);
    themeTarget.current = hexToRgb(base);
    setScore(0);
    setProgress(0);
    setOverLine("");
    setPhase("playing");
    setRound((r) => r + 1);
    if (g) requestAnimationFrame(() => draw(g));
  }, [buildGame, draw]);

  const steer = useCallback((nd: Dir) => {
    const g = gameRef.current;
    if (!g || opposite(nd, g.dir)) return;
    g.nextDir = nd;
  }, []);

  /* ── barvy + listenery + zámek scrollu ── */
  useEffect(() => {
    if (!open) return;
    const cs = getComputedStyle(document.documentElement);
    const baseBg = cs.getPropertyValue("--bg").trim() || "#FAFAF7";
    baseBgRef.current = baseBg; // původní pozadí — drží se, loop ho nepřepisuje
    colorsRef.current = {
      ink: cs.getPropertyValue("--text-primary").trim() || "#1a1614",
      paper: baseBg,
      muted: cs.getPropertyValue("--text-muted").trim() || "#9b958f",
    };
    // překryvová vrstva: kotva v počátku dokumentu, snědená slova jsou DOM obdélníky uvnitř →
    // scrollují NATIVNĚ s textem (i na mobilu) a s background:var(--bg) se samy přebarvují
    const layer = document.createElement("div");
    layer.style.cssText = "position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:1;";
    document.body.appendChild(layer);
    eraseLayerRef.current = layer;

    const startId = requestAnimationFrame(() => start());

    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "Escape") { onClose(); return; }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(k)) e.preventDefault();
      if (k === " " || k === "Enter") { if (gameRef.current === null || phaseRef.current === "dead") start(); return; }
      if (phaseRef.current !== "playing") return;
      if (k === "ArrowUp" || k === "w" || k === "W") steer({ x: 0, y: -1 });
      else if (k === "ArrowDown" || k === "s" || k === "S") steer({ x: 0, y: 1 });
      else if (k === "ArrowLeft" || k === "a" || k === "A") steer({ x: -1, y: 0 });
      else if (k === "ArrowRight" || k === "d" || k === "D") steer({ x: 1, y: 0 });
    };
    const lockScroll = (e: Event) => { if (phaseRef.current === "playing") e.preventDefault(); };
    let ts: { x: number; y: number } | null = null;
    const onTS = (e: TouchEvent) => { ts = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTE = (e: TouchEvent) => {
      if (!ts || phaseRef.current !== "playing") { ts = null; return; }
      const dx = e.changedTouches[0].clientX - ts.x, dy = e.changedTouches[0].clientY - ts.y;
      ts = null;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) steer({ x: dx > 0 ? 1 : -1, y: 0 });
      else steer({ x: 0, y: dy > 0 ? 1 : -1 });
    };
    window.addEventListener("keydown", onKey, { passive: false });
    window.addEventListener("wheel", lockScroll, { passive: false });
    window.addEventListener("touchmove", lockScroll, { passive: false });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchend", onTE, { passive: true });
    return () => {
      cancelAnimationFrame(startId);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", lockScroll);
      window.removeEventListener("touchmove", lockScroll);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchend", onTE);
      document.documentElement.style.removeProperty("--bg"); // vrať barvu stránky
      eraseLayerRef.current?.remove(); // odstraň překryvy → text je zpátky
      eraseLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── výhra: po pár vteřinách zavři hru → vrátí se jen homepage ── */
  useEffect(() => {
    if (phase !== "won") return;
    const id = setTimeout(() => onClose(), WIN_HOLD_MS);
    return () => clearTimeout(id);
  }, [phase, onClose]);

  /* ── herní smyčka ── */
  useEffect(() => {
    if (!open || phase !== "playing") return;
    const g = gameRef.current;
    if (!g) return;
    let raf = 0;
    g.last = performance.now();
    g.acc = 0;

    const die = () => {
      const pool = DEATHS_SELF[lang];
      setOverLine(pool[Math.floor(Math.random() * pool.length)] || "");
      draw(g);
      setPhase("dead");
    };
    const win = () => {
      draw(g);
      setPhase("won");
    };

    const step = () => {
      g.dir = g.nextDir;
      const head = g.snake[0];
      const nx = (head.x + g.dir.x + g.cols) % g.cols;
      const ny = (head.y + g.dir.y + g.rows) % g.rows;
      const px = nx * CELL + CELL / 2, py = ny * CELL + CELL / 2;

      // obrázek experimentu → přebarvi stránku (nezabíjí)
      for (const p of g.paints) if (inRect(px, py, p)) {
        themeTarget.current = hexToRgb(p.color);
        if (!p.hit) { p.hit = true; g.score += 15; setScore((s) => s + 15); }
      }

      // jídlo — stačí překryv buňky hlavy se soustem (sníst i při průjezdu jen částí)
      let ate = 0, grew = false;
      for (const f of g.food) if (!f.eaten && cellHitsRect(nx, ny, f)) {
        f.eaten = true; ate += f.n; grew = true; g.eatenCount++;
        const layer = eraseLayerRef.current; // text „zmizí" DOM obdélníkem, co scrolluje s textem
        if (layer) {
          const d = document.createElement("div");
          d.style.cssText = `position:absolute;left:${f.x0 - 2}px;top:${f.y0 - 2}px;width:${f.x1 - f.x0 + 4}px;height:${f.y1 - f.y0 + 4}px;background:${f.bg ?? "var(--bg)"};`;
          layer.appendChild(d);
        }
      }

      const body = grew ? g.snake : g.snake.slice(0, -1);
      if (body.some((c) => c.x === nx && c.y === ny)) { die(); return true; }

      g.snake.unshift({ x: nx, y: ny });
      if (grew) {
        g.score += ate;
        setScore((s) => s + ate);
        setProgress(g.eatenCount / Math.max(1, g.total)); // talíř se plní podle posbíraného textu
        // cíl splněn: všechen text snězen → výhra
        if (g.food.every((f) => f.eaten)) { win(); return true; }
      } else g.snake.pop();
      return false;
    };

    const loop = (now: number) => {
      const dt = now - g.last;
      g.last = now;
      g.acc += dt;
      g.stepMs = clamp(BASE_MS - g.score * SPEED_K, MIN_MS, BASE_MS); // rychlost roste se skóre
      let stop = false;
      while (g.acc >= g.stepMs) { g.acc -= g.stepMs; if (step()) { stop = true; break; } }
      if (stop) return; // die() / win() přepnuly fázi

      // plynulé přebarvení stránky do barvy experimentu
      const cur = themeCur.current, tgt = themeTarget.current;
      cur[0] += (tgt[0] - cur[0]) * 0.12;
      cur[1] += (tgt[1] - cur[1]) * 0.12;
      cur[2] += (tgt[2] - cur[2]) * 0.12;
      const col = rgbStr(cur);
      document.documentElement.style.setProperty("--bg", col);
      colorsRef.current.paper = col;

      // kamera sleduje hlavu (plynule, dle interpolované pozice)
      const vh = window.innerHeight;
      const tcam = clamp(g.acc / g.stepMs, 0, 1);
      const headDocY = (g.snake[0].y + g.nextDir.y * tcam) * CELL + CELL / 2;
      const targetY = clamp(headDocY - vh * 0.45, 0, Math.max(0, g.docH - vh));
      scrollRef.current += (targetY - scrollRef.current) * 0.18;
      window.scrollTo(0, Math.round(scrollRef.current));

      draw(g);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open, phase, round, draw, lang]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100vw", height: "100vh", display: "block", pointerEvents: "auto", touchAction: "none" }} />

      {/* HUD: talíř špaget, co se plní podle posbíraného textu (místo čísla) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", pointerEvents: "none" }}>
        <SpaghettiGauge p={progress} />
        <button onClick={onClose} style={sansBtn}>✕ {t.exit}</button>
      </div>

      {/* hint dole */}
      {phase === "playing" && (
        <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
          <span style={{ fontFamily: sans, fontSize: 12, color: "var(--text-muted)", background: "var(--bg)", borderRadius: 999, padding: "5px 12px", border: "1.5px solid var(--border)" }}>{t.controls}</span>
        </div>
      )}

      {/* výhra — zatemnění + bílý text, po pár vteřinách zmizí (homepage) */}
      {phase === "won" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 22, pointerEvents: "auto", background: "rgba(12,12,16,0.62)", animation: "noodleWin 600ms ease both" }}>
          <style>{`@keyframes noodleWin{from{opacity:0}to{opacity:1}}`}</style>
          <p style={{ ...display, fontSize: "clamp(34px,7vw,64px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", margin: 0, lineHeight: 1.05 }}>Congratulations</p>
          <p style={{ ...serifI, fontSize: "clamp(17px,3.5vw,26px)", color: "rgba(255,255,255,0.82)", margin: "12px 0 0" }}>good game</p>
        </div>
      )}

      {/* game over */}
      {phase === "dead" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 22, pointerEvents: "auto", background: "rgba(250,250,247,0.55)", backdropFilter: "blur(2px)" }}>
          <div style={{ background: "var(--bg)", border: "2.5px solid var(--border)", borderRadius: 18, boxShadow: "6px 6px 0 var(--border)", padding: "26px 28px", maxWidth: 420, width: "100%", textAlign: "center" }}>
            <p style={{ ...display, fontSize: 13, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 8px" }}>{t.over}</p>
            <p style={{ ...serifI, fontSize: 19, color: "var(--text-primary)", margin: "0 0 10px" }}>{overLine}</p>
            <p style={{ fontFamily: sans, fontSize: 14, color: "var(--text-secondary)", margin: "0 0 18px" }}>{t.scoreLabel}: <b>{score}</b></p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={start} style={{ ...sansBtn, background: "var(--text-primary)", color: "var(--bg)", borderColor: "var(--text-primary)" }}>↻ {t.again}</button>
              <button onClick={onClose} style={sansBtn}>{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* špagetový pramen navíjený do talíře — počítá se jednou (nezávisí na progresu) */
const PLATE_SPIRAL = (() => {
  const cx = 29, cy = 28, turns = 3.7, steps = 240, maxR = 16;
  let d = "", len = 0, px = cx, py = cy;
  for (let i = 0; i <= steps; i++) {
    const tt = i / steps;
    const ang = tt * turns * Math.PI * 2;
    const r = maxR * tt + Math.sin(ang * 3) * 0.9; // lehké zvlnění = organická nudle
    const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
    if (i === 0) d += `M${x.toFixed(2)} ${y.toFixed(2)}`;
    else { d += `L${x.toFixed(2)} ${y.toFixed(2)}`; len += Math.hypot(x - px, y - py); }
    px = x; py = y;
  }
  return { d, len };
})();

/* talíř špaget, co se postupně zaplňuje podle posbíraného textu (progress 0..1) */
function SpaghettiGauge({ p }: { p: number }) {
  const v = Math.max(0, Math.min(1, p));
  return (
    <svg viewBox="0 0 58 56" width={48} height={46} role="img" aria-label={`Posbíráno ${Math.round(v * 100)} %`}
      style={{ display: "block", color: "var(--text-primary)", pointerEvents: "none", filter: "drop-shadow(0 1px 0 var(--bg)) drop-shadow(0 0 2px var(--bg))" }}>
      {/* talíř shora */}
      <ellipse cx={29} cy={28} rx={21} ry={20} fill="none" stroke="currentColor" strokeWidth={2.2} opacity={0.55} />
      <ellipse cx={29} cy={28} rx={17.2} ry={16.2} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.28} />
      {/* špageta se navíjí od středu ven, jak roste progress */}
      <path d={PLATE_SPIRAL.d} fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={PLATE_SPIRAL.len} strokeDashoffset={PLATE_SPIRAL.len * (1 - v)}
        style={{ transition: "stroke-dashoffset 300ms ease" }} />
    </svg>
  );
}

const sansBtn: React.CSSProperties = {
  pointerEvents: "auto",
  background: "var(--bg)",
  color: "var(--text-primary)",
  border: "2px solid var(--border)",
  borderRadius: 999,
  boxShadow: "3px 3px 0 var(--border)",
  padding: "9px 18px",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};
