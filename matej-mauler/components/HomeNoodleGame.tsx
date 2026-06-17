"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/dictionaries";

/* ───────────────────────────────────────────────────────────────────
   Zamotaná nudle — easter egg na homepage.
   Nudle vyjede z loga a požírá REÁLNÝ obsah stránky:
   • text (slova) + logo = sousta (body, nudle roste),
   • obrázek experimentu (banner) = přebarví celou stránku do barev toho
     experimentu (nezabíjí),
   • snědený text se po ~15 s nahradí zajímavým faktoidem (jde taky sníst),
   • jediná prohra = zamotat se sám do sebe.
   Vše kreslí průhledný canvas navrch; DOM se nemění → po konci se stránka
   sama „obnoví" (canvas se odmountuje, --bg se vrátí).
   ─────────────────────────────────────────────────────────────────── */

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const serifI: React.CSSProperties = { fontFamily: "var(--font-display)", fontStyle: "italic" };
const sans = "var(--font-sans)";

const CELL = 26; // velikost buňky v px (dokumentový prostor)
const STEP_MS = 110; // ms na krok
const RESPAWN_MIN = 5000, RESPAWN_MAX = 10000; // ms — nový text 5–10 s po snědení
const MAX_PENDING = 6; // max čekajících respawnů naráz
const FACTOID_FONT = 'italic 16px ui-serif, Georgia, "Times New Roman", serif';
const FACTOID_LINE = 23;

type Dir = { x: number; y: number };
type Cell = { x: number; y: number };
type Rect = { x0: number; y0: number; x1: number; y1: number };
type Food = Rect & { n: number; eaten: boolean; kind: "dom" | "factoid"; text?: string; bg?: string };
type Paint = Rect & { color: string; hit: boolean };
type Game = {
  snake: Cell[];
  dir: Dir;
  nextDir: Dir;
  food: Food[];
  paints: Paint[];
  cards: Rect[];
  pending: number[]; // časy (ms), kdy se má objevit nový text po snědení
  cols: number;
  rows: number;
  docW: number;
  docH: number;
  acc: number;
  last: number;
};

const UI = {
  cs: {
    scoreLabel: "Snědeno",
    exit: "Konec",
    again: "Hrát znovu",
    close: "Zavřít",
    controls: "šipky / WASD · táhni prstem · najeď na obrázek = přebarvíš web · Esc = konec",
    over: "Konec",
  },
  en: {
    scoreLabel: "Eaten",
    exit: "Exit",
    again: "Play again",
    close: "Close",
    controls: "arrows / WASD · swipe · hit an image to recolor the site · Esc = exit",
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

const FACTOIDS: Record<Lang, string[]> = {
  cs: [
    "Jsi z ~60 % voda. Hlavně neztuhni.",
    "Tělo ti denně vymění ~330 miliard buněk.",
    "Mikrobů v tobě je víc než tvých vlastních buněk.",
    "Světlo ze Slunce sem letělo 8 minut.",
    "Každý atom v tobě se ukoval v umírající hvězdě.",
    "Srdce ti tlukne asi 2,5 miliardykrát. Bez pauzy.",
    "V hlavě máš víc synapsí než hvězd v Mléčné dráze.",
    "S banánem sdílíš zhruba 60 % genů.",
    "Suchá špageta se skoro nikdy nezlomí jen na dva kusy.",
    "Mozek běží na asi 20 wattech. Slabá žárovka, skvělé nápady.",
    "Právě teď se točíš rychlostí ~1600 km/h a nic necítíš.",
    "Atom je z větší části prázdný prostor. Ty taky.",
    "Asi třetinu života prospíš. To je servisní okno.",
    "Nadechneš se asi 20 000krát denně, aniž bys o to požádal.",
    "Voda, co dnes piješ, byla kdysi voda dinosaurů.",
    "Kosti jsou na váhu asi 4krát pevnější než beton.",
  ],
  en: [
    "You are about 60% water. Try not to harden.",
    "Your body swaps ~330 billion cells a day.",
    "Microbes in you outnumber your own cells.",
    "Light from the Sun took 8 minutes to get here.",
    "Every atom in you was forged in a dying star.",
    "Your heart beats about 2.5 billion times. No breaks.",
    "More synapses in your head than stars in the Milky Way.",
    "You share roughly 60% of your genes with a banana.",
    "A dry spaghetti strand almost never snaps into just two.",
    "Your brain runs on about 20 watts. Dim bulb, bright ideas.",
    "Right now you spin at ~1600 km/h and feel nothing.",
    "Most of an atom is empty space. So are you.",
    "You'll spend about a third of your life asleep.",
    "You take ~20,000 breaths a day without asking.",
    "The water you drink today was once dinosaur water.",
    "Bones are about 4x stronger than concrete by weight.",
  ],
};

const opposite = (a: Dir, b: Dir) => a.x === -b.x && a.y === -b.y;
const inRect = (px: number, py: number, r: Rect) => px >= r.x0 && px <= r.x1 && py >= r.y0 && py <= r.y1;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const wob = (x: number, y: number, amp: number) => Math.sin(x * 0.9 + y * 1.7) * amp;

type RGB = [number, number, number];
const hexToRgb = (hex: string): RGB => {
  const h = hex.trim().replace("#", "");
  const s = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const v = parseInt(s.slice(0, 6) || "fafaf7", 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const rgbStr = (c: RGB) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

export function HomeNoodleGame({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: Lang }) {
  const t = UI[lang];
  const [phase, setPhase] = useState<"playing" | "dead">("playing");
  const [score, setScore] = useState(0);
  const [overLine, setOverLine] = useState("");
  const [round, setRound] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const colorsRef = useRef({ ink: "#1a1614", paper: "#FAFAF7", muted: "#9b958f" });
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
          out.push({ kind: "dom", x0: r.left + sx, y0: r.top + sy, x1: r.right + sx, y1: r.bottom + sy, n: m[0].length, eaten: false, bg });
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
      const card = el.closest(".scard") as HTMLElement | null;
      const bg = card ? getComputedStyle(card).backgroundColor || undefined : undefined;
      collectWords(el, food, sx, sy, bg);
      el.querySelectorAll("img").forEach((img) => {
        const r = img.getBoundingClientRect();
        if (r.width > 4 && r.height > 4) food.push({ kind: "dom", x0: r.left + sx, y0: r.top + sy, x1: r.right + sx, y1: r.bottom + sy, n: 8, eaten: false, bg });
      });
    });

    // obrázky experimentů = přebarvovací dlaždice
    const paints: Paint[] = [];
    document.querySelectorAll<HTMLElement>('[data-noodle="paint"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) paints.push({ ...toDoc(r), color: el.dataset.noodleColor || "#FAFAF7", hit: false });
    });

    // celé karty — kvůli rozmístění nového textu (věty jen mimo karty, na kartách jen slova)
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

    return { snake, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, food, paints, cards, pending: [], cols, rows, docW, docH, acc: 0, last: 0 };
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

  /* ── nový text na NÁHODNÉ místo: věta na pozadí mimo karty, nebo jedno slovo na kartu ── */
  const spawnText = useCallback((g: Game, ctx: CanvasRenderingContext2D) => {
    if (g.food.filter((f) => f.kind === "factoid" && !f.eaten).length > 200) return;
    ctx.font = FACTOID_FONT;
    const overlaps = (b: Rect, c: Rect) => b.x0 < c.x1 && b.x1 > c.x0 && b.y0 < c.y1 && b.y1 > c.y0;

    // na kartách: jen jedno slovo, vždy se vejde dovnitř karty
    if (g.cards.length > 0 && Math.random() < 0.4) {
      const card = g.cards[Math.floor(Math.random() * g.cards.length)];
      const pad = 12;
      const pool = FACTOIDS[lang];
      let word = "nudle";
      for (let i = 0; i < 8; i++) {
        const ws = pool[Math.floor(Math.random() * pool.length)].replace(/[.,]/g, "").split(/\s+/).filter((w) => w.length >= 3);
        if (ws.length) { word = ws[Math.floor(Math.random() * ws.length)]; break; }
      }
      const ww = ctx.measureText(word).width;
      const slotW = card.x1 - card.x0 - 2 * pad;
      const slotH = card.y1 - card.y0 - 2 * pad - 18;
      if (ww > slotW || slotH < 0) return; // nevejde se → přeskoč
      const x = card.x0 + pad + Math.random() * (slotW - ww);
      const y = card.y0 + pad + Math.random() * slotH;
      g.food.push({ kind: "factoid", text: word, x0: x, y0: y, x1: x + ww, y1: y + 18, n: word.length, eaten: false });
      return;
    }

    // na pozadí stránky: celá věta, ale nesmí zasahovat do žádné karty
    const text = FACTOIDS[lang][Math.floor(Math.random() * FACTOIDS[lang].length)];
    const maxW = Math.min(340, g.docW - 32);
    for (let attempt = 0; attempt < 20; attempt++) {
      const ax = 16 + Math.random() * Math.max(0, g.docW - maxW - 32);
      const ay = 80 + Math.random() * Math.max(0, g.docH - 160);
      const items: Food[] = [];
      let x = ax, y = ay, x1max = ax;
      for (const w of text.split(/\s+/)) {
        const adv = ctx.measureText(w + " ").width;
        const ww = ctx.measureText(w).width;
        if (x + ww > ax + maxW) { x = ax; y += FACTOID_LINE; }
        items.push({ kind: "factoid", text: w, x0: x, y0: y, x1: x + ww, y1: y + 18, n: w.length, eaten: false });
        x1max = Math.max(x1max, x + ww);
        x += adv;
      }
      const box: Rect = { x0: ax, y0: ay, x1: x1max, y1: y + 18 };
      if (g.cards.some((c) => overlaps(box, c))) continue; // zasahuje do karty → zkus jinde
      for (const it of items) g.food.push(it);
      return;
    }
  }, [lang]);

  const draw = useCallback((g: Game) => {
    const ctx = ctxSetup();
    if (!ctx) return;
    const { ink, paper } = colorsRef.current;
    const w = window.innerWidth, h = window.innerHeight;
    const sx = window.scrollX, sy = window.scrollY;
    ctx.clearRect(0, 0, w, h); // průhledné → stránka prosvítá

    // snědená DOM slova: přemaluj barvou pozadí; faktoidy: vykresli inkoustem
    ctx.textBaseline = "top";
    for (const f of g.food) {
      if (f.kind === "dom") {
        if (!f.eaten) continue;
        const x = f.x0 - sx - 2, y = f.y0 - sy - 2;
        if (x > w || y > h || x + (f.x1 - f.x0) + 4 < 0 || y + (f.y1 - f.y0) + 4 < 0) continue;
        ctx.fillStyle = f.bg ?? paper; // karty mají bílé pozadí, hlavní stránka tónující --bg
        ctx.fillRect(x, y, f.x1 - f.x0 + 4, f.y1 - f.y0 + 4);
      } else if (!f.eaten && f.text) {
        const x = f.x0 - sx, y = f.y0 - sy;
        if (x > w || y > h || x + (f.x1 - f.x0) < 0 || y + 20 < 0) continue;
        ctx.font = FACTOID_FONT;
        ctx.fillStyle = ink;
        ctx.fillText(f.text, x, y);
      }
    }

    // nudle — plynulý pohyb: pozice se interpolují mezi kroky mřížky (t = postup do dalšího kroku)
    const amp = CELL * 0.06;
    const t = clamp(g.acc / STEP_MS, 0, 1);
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
    const g = buildGame();
    gameRef.current = g;
    scrollRef.current = 0;
    const base = colorsRef.current.paper || "#FAFAF7";
    themeCur.current = hexToRgb(base);
    themeTarget.current = hexToRgb(base);
    setScore(0);
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
    colorsRef.current = {
      ink: cs.getPropertyValue("--text-primary").trim() || "#1a1614",
      paper: cs.getPropertyValue("--bg").trim() || "#FAFAF7",
      muted: cs.getPropertyValue("--text-muted").trim() || "#9b958f",
    };
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

    const step = () => {
      g.dir = g.nextDir;
      const head = g.snake[0];
      const nx = (head.x + g.dir.x + g.cols) % g.cols;
      const ny = (head.y + g.dir.y + g.rows) % g.rows;
      const px = nx * CELL + CELL / 2, py = ny * CELL + CELL / 2;

      // obrázek experimentu → přebarvi stránku (nezabíjí)
      for (const p of g.paints) if (inRect(px, py, p)) {
        themeTarget.current = hexToRgb(p.color);
        if (!p.hit) { p.hit = true; setScore((s) => s + 15); }
      }

      // jídlo
      let ate = 0, grew = false;
      for (const f of g.food) if (!f.eaten && inRect(px, py, f)) { f.eaten = true; ate += f.n; grew = true; }

      const body = grew ? g.snake : g.snake.slice(0, -1);
      if (body.some((c) => c.x === nx && c.y === ny)) { die(); return true; }

      g.snake.unshift({ x: nx, y: ny });
      if (grew) {
        setScore((s) => s + ate);
        // po snědení naplánuj nový text za 5–10 s (jinam, náhodně)
        if (g.pending.length < MAX_PENDING) g.pending.push(performance.now() + RESPAWN_MIN + Math.random() * (RESPAWN_MAX - RESPAWN_MIN));
      } else g.snake.pop();
      return false;
    };

    const loop = (now: number) => {
      const dt = now - g.last;
      g.last = now;
      g.acc += dt;
      let dead = false;
      while (g.acc >= STEP_MS) { g.acc -= STEP_MS; if (step()) { dead = true; break; } }
      if (dead) return;

      // objev nové texty, kterým „dozrál" čas (5–10 s po snědení)
      if (g.pending.length && g.pending.some((d) => d <= now)) {
        const ctx = canvasRef.current?.getContext("2d");
        const dueCount = g.pending.filter((d) => d <= now).length;
        g.pending = g.pending.filter((d) => d > now);
        if (ctx) for (let i = 0; i < dueCount; i++) spawnText(g, ctx);
      }

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
      const tcam = clamp(g.acc / STEP_MS, 0, 1);
      const headDocY = (g.snake[0].y + g.nextDir.y * tcam) * CELL + CELL / 2;
      const targetY = clamp(headDocY - vh * 0.45, 0, Math.max(0, g.docH - vh));
      scrollRef.current += (targetY - scrollRef.current) * 0.18;
      window.scrollTo(0, Math.round(scrollRef.current));

      draw(g);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open, phase, round, draw, lang, spawnText]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100vw", height: "100vh", display: "block", pointerEvents: "auto", touchAction: "none" }} />

      {/* HUD */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", pointerEvents: "none" }}>
        <span style={{ ...display, fontSize: 16, fontWeight: 900, color: "var(--text-primary)", background: "var(--bg)", border: "2px solid var(--border)", borderRadius: 999, padding: "6px 14px", boxShadow: "3px 3px 0 var(--border)" }}>
          🍝 {t.scoreLabel}: {score}
        </span>
        <button onClick={onClose} style={sansBtn}>✕ {t.exit}</button>
      </div>

      {/* hint dole */}
      {phase === "playing" && (
        <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
          <span style={{ fontFamily: sans, fontSize: 12, color: "var(--text-muted)", background: "var(--bg)", borderRadius: 999, padding: "5px 12px", border: "1.5px solid var(--border)" }}>{t.controls}</span>
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
