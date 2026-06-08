"use client";

import { useState } from "react";
import Link from "next/link";
import { SoundUniverse } from "./SoundUniverse";
import type { Lang } from "@/lib/dictionaries";

const INK = "#1a1614", BG = "#FAFAF7";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const card: React.CSSProperties = { background: "#fff", border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}` };

type SongLite = { url: string; title: string };
type Choice = "remote" | "soil" | "insulation" | "panels" | "speakers";

const C = {
  cs: {
    eyebrow: "Sound Blaster",
    title: "Jak zastavit zvuk",
    sub: "Malá knížka o tom, jak se zvuk šíří — a jak ho přemluvit, aby zůstal, kde má.",
    scroll: "Scrolluj ↓",
    ch1: "1 · Jak se zvuk vůbec šíří",
    ch1p1: "Zvuk je vlnění. Zdroj — reproduktor, auto, pila — rozkmitá molekuly vzduchu kolem sebe a ten rozkmit se šíří všemi směry jako kruhy na vodě.",
    ch1p2: "Cestou slábne (čím dál, tím tišeji), odráží se od tvrdých ploch a ohýbá se kolem překážek. K uchu nakonec dorazí směs přímého zvuku, odrazů a toho, co se ohnulo přes překážky.",
    ch1note: "Zastavit zvuk = nenechat ten rozkmit dojít až k uchu. Buď ho odrazíš pryč, nebo pohltíš.",
    ch2: "2 · Výšky a basy se chovají jinak",
    ch2p1: "Vysoké tóny (výšky) mají krátké vlny. Snadno se odrazí, pohltí a jdou rovně jako paprsek — stačí malá překážka a je po nich.",
    ch2p2: "Basy mají dlouhé vlny. Ohýbají se kolem rohů, procházejí stěnami a rozechvívají konstrukci. Proto od souseda slyšíš dunění basy, ale ne melodii.",
    treble: "Výšky", bass: "Basy",
    trebleNote: "Výšky stěna zastaví.", bassNote: "Basy se přes stěnu ohnou.",
    ch3: "3 · Tenká stěna",
    ch3p1: "Je večer. Koukáš na film s pořádnými zvukovými efekty. Jenže stěna k sousedovi je tenká a on už jednou bouchal. Jak to vyřešit?",
    pick: "Klikni na řešení:",
    again: "Zkusit jinak",
    play: "Teď to zkus na reálných situacích →",
    playNote: "Dálnice u vesnice, vlak ve městě, továrna v obci, letadlo nad bytem, open-air ve městě…",
    back: "← Spaghetti.ltd",
    options: [
      { id: "remote", emoji: "🔉", label: "Ztlumit ovladačem", verdict: "ok", title: "Funguje — ale…", text: "Soused má klid. Jenže přišel jsi o ten zážitek: výbuchy a basy, kvůli kterým má smysl pouštět to nahlas. Zvuk jsi neodhlučnil, jen vypnul." },
      { id: "soil", emoji: "🪏", label: "Nasypat do obýváku hlínu", verdict: "bad", title: "Technicky by to fungovalo…", text: "Hlína je těžká a porézní — zvuk by spolehlivě pohltila. Jenže teď máš obývák po okna v hlíně a panáček se v ní ztratil. Správný princip (hmota + pohlcení), úplně špatné provedení." },
      { id: "insulation", emoji: "🧱", label: "Izolace ve stěně", verdict: "best", title: "Nejlepší fyzika — špatné načasování", text: "Těžká stěna s minerální vatou uvnitř je přesně ono. Jenže tohle se řeší při stavbě, ne v deset večer před filmem. Skvělé na příště." },
      { id: "panels", emoji: "🟪", label: "Odhlučňovací panely", verdict: "ok", title: "Pomůžou — ale jinak, než čekáš", text: "Akustické panely pohltí odrazy v místnosti. Zvuk je čistší a míň se „rozjíždí“ do stěn — ale samotný prostup do vedlejšího bytu sníží jen málo. Dělají pohodu uvnitř, ne bariéru ven." },
      { id: "speakers", emoji: "🔈", label: "Otočit reproduktory", verdict: "ok", title: "Chytré a zadarmo", text: "Nasměruj repro od společné stěny. Přímý zvuk i výšky míří jinam, k sousedovi jde míň. Basy se sice pořád ohnou, ale je to slyšitelně lepší — a nestálo to nic." },
    ] as { id: Choice; emoji: string; label: string; verdict: string; title: string; text: string }[],
  },
  en: {
    eyebrow: "Sound Blaster",
    title: "How to stop sound",
    sub: "A little book about how sound travels — and how to talk it into staying where it belongs.",
    scroll: "Scroll ↓",
    ch1: "1 · How sound even travels",
    ch1p1: "Sound is a wave. A source — a speaker, a car, a saw — shakes the air molecules around it, and that shaking spreads in all directions like ripples on water.",
    ch1p2: "On the way it fades (farther = quieter), bounces off hard surfaces and bends around obstacles. Your ear gets a mix of direct sound, reflections and whatever diffracted around things.",
    ch1note: "Stopping sound = not letting that shaking reach the ear. Either reflect it away, or absorb it.",
    ch2: "2 · Highs and bass behave differently",
    ch2p1: "High tones (treble) have short waves. They reflect and absorb easily and travel in a straight beam — a small barrier kills them.",
    ch2p2: "Bass has long waves. It bends around corners, passes through walls and shakes the structure. That's why you hear the neighbor's bass thumping but not the melody.",
    treble: "Treble", bass: "Bass",
    trebleNote: "A wall stops treble.", bassNote: "Bass bends around the wall.",
    ch3: "3 · The thin wall",
    ch3p1: "It's evening. You're watching a film with serious sound effects. But the wall to your neighbor is thin and they've banged on it before. How do you solve it?",
    pick: "Click a solution:",
    again: "Try another",
    play: "Now try it on real situations →",
    playNote: "Highway by a village, train in the city, factory in town, plane over a flat, open-air in the city…",
    back: "← Spaghetti.ltd",
    options: [
      { id: "remote", emoji: "🔉", label: "Turn it down", verdict: "ok", title: "Works — but…", text: "The neighbor is happy. But you lost the whole point: the explosions and bass you turned it up for. You didn't soundproof anything, you just switched it off." },
      { id: "soil", emoji: "🪏", label: "Fill the room with soil", verdict: "bad", title: "Technically it would work…", text: "Soil is heavy and porous — it would absorb the sound reliably. Except now your living room is buried up to the windows and the little guy is gone. Right principle (mass + absorption), very wrong execution." },
      { id: "insulation", emoji: "🧱", label: "Insulate the wall", verdict: "best", title: "Best physics — wrong timing", text: "A heavy wall with mineral wool inside is exactly it. But that's done when you build, not at ten p.m. before a film. Great for next time." },
      { id: "panels", emoji: "🟪", label: "Acoustic panels", verdict: "ok", title: "They help — just not how you'd think", text: "Acoustic panels absorb reflections inside the room. The sound is cleaner and spreads less into the walls — but they cut the actual transmission next door only a little. Comfort inside, not a barrier out." },
      { id: "speakers", emoji: "🔈", label: "Reposition the speakers", verdict: "ok", title: "Smart and free", text: "Aim the speakers away from the shared wall. Direct sound and treble go elsewhere, less reaches the neighbor. Bass still bends, but it's audibly better — and it cost nothing." },
    ] as { id: Choice; emoji: string; label: string; verdict: string; title: string; text: string }[],
  },
} as const;

const verdictColor = (v: string) => v === "best" ? "#16A34A" : v === "ok" ? "#2563EB" : v === "bad" ? "#dc2626" : INK;
const verdictTag = (v: string, lang: Lang) => v === "best" ? (lang === "cs" ? "nejlepší" : "best") : v === "ok" ? "ok" : (lang === "cs" ? "vedle" : "off");

export function SoundBlasterBook({ lang, songs }: { lang: Lang; songs: SongLite[] }) {
  const t = C[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const [playing, setPlaying] = useState(false);
  const [band, setBand] = useState<"treble" | "bass">("bass");
  const [choice, setChoice] = useState<Choice | null>(null);

  if (playing) return <SoundUniverse lang={lang} songs={songs} onExit={() => setPlaying(false)} />;

  const opt = t.options.find((o) => o.id === choice) || null;

  return (
    <main style={{ background: BG, color: INK, minHeight: "100dvh" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 22px 90px" }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>

        {/* cover */}
        <section style={{ textAlign: "center", padding: "56px 0 40px" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.24em", color: "var(--text-muted)", marginBottom: 18 }}>{t.eyebrow}</p>
          <div style={{ position: "relative", height: 120, marginBottom: 18 }}>
            <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontSize: 40, zIndex: 2 }}>🔊</span>
            {[0, 1, 2].map((i) => <span key={i} className="sb-ring" style={{ animationDelay: `${i * 0.7}s` }} />)}
          </div>
          <h1 style={{ ...display, fontSize: "clamp(36px,8vw,64px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02 }}>{t.title}</h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--text-secondary)", maxWidth: 460, margin: "14px auto 0", lineHeight: 1.6 }}>{t.sub}</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 28 }}>{t.scroll}</p>
        </section>

        {/* ch1 */}
        <Chapter title={t.ch1}>
          <P>{t.ch1p1}</P>
          <P>{t.ch1p2}</P>
          <Note>{t.ch1note}</Note>
        </Chapter>

        {/* ch2 highs/bass */}
        <Chapter title={t.ch2}>
          <P>{t.ch2p1}</P>
          <P>{t.ch2p2}</P>
          <div style={{ ...card, padding: 18, marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <Toggle active={band === "treble"} onClick={() => setBand("treble")}>{t.treble}</Toggle>
              <Toggle active={band === "bass"} onClick={() => setBand("bass")}>{t.bass}</Toggle>
            </div>
            <WaveDiagram band={band} />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: band === "bass" ? "#dc2626" : "#16A34A", marginTop: 10, textAlign: "center" }}>{band === "bass" ? t.bassNote : t.trebleNote}</p>
          </div>
        </Chapter>

        {/* ch3 thin wall story */}
        <Chapter title={t.ch3}>
          <P>{t.ch3p1}</P>
          <Room choice={choice} />
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: "18px 0 8px" }}>{t.pick}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {t.options.map((o) => (
              <button key={o.id} onClick={() => setChoice(o.id)} style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 999,
                border: `2px solid ${INK}`, background: choice === o.id ? INK : "#fff", color: choice === o.id ? "#fff" : INK,
                boxShadow: choice === o.id ? "none" : `2px 2px 0 ${INK}`, transform: choice === o.id ? "translate(2px,2px)" : "none",
                fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}><span style={{ fontSize: 16 }}>{o.emoji}</span>{o.label}</button>
            ))}
          </div>
          {opt && (
            <div style={{ ...card, padding: "18px 20px", marginTop: 14, borderColor: verdictColor(opt.verdict), boxShadow: `5px 5px 0 ${verdictColor(opt.verdict)}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                <h3 style={{ ...display, fontSize: 19, fontWeight: 700 }}>{opt.title}</h3>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#fff", background: verdictColor(opt.verdict), borderRadius: 999, padding: "3px 10px" }}>{verdictTag(opt.verdict, lang)}</span>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.6, color: "var(--text-primary)" }}>{opt.text}</p>
              <button onClick={() => setChoice(null)} style={{ marginTop: 12, background: "transparent", border: "none", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>{t.again}</button>
            </div>
          )}
        </Chapter>

        {/* CTA playground */}
        <section style={{ ...card, padding: "28px 26px", textAlign: "center", marginTop: 44 }}>
          <button onClick={() => setPlaying(true)} style={{ background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: 12, boxShadow: `4px 4px 0 ${INK}`, padding: "15px 30px", fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{t.play}</button>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginTop: 14, maxWidth: 440, marginInline: "auto", lineHeight: 1.5 }}>{t.playNote}</p>
        </section>
      </div>

      <style>{`
        .sb-ring { position:absolute; left:50%; top:50%; width:18px; height:18px; border:2.5px solid ${INK}; border-radius:50%; transform:translate(-50%,-50%); opacity:0; animation: sb-ring 2.1s ease-out infinite; }
        @keyframes sb-ring { 0%{ width:18px; height:18px; opacity:0.9; } 100%{ width:150px; height:150px; opacity:0; } }
        @keyframes sb-soil { from{ height:0; } to{ height:62%; } }
      `}</style>
    </main>
  );
}

function Chapter({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "30px 0", borderTop: "1.5px solid rgba(26,22,20,0.1)" }}>
      <h2 style={{ ...display, fontSize: "clamp(22px,4.5vw,32px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>{title}</h2>
      {children}
    </section>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 14 }}>{children}</p>;
}
function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ ...display, fontStyle: "italic", fontSize: 17, color: "var(--text-primary)", borderLeft: `3px solid ${INK}`, paddingLeft: 14, marginTop: 6 }}>{children}</p>;
}
function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ padding: "8px 16px", borderRadius: 999, border: `2px solid ${INK}`, background: active ? INK : "#fff", color: active ? "#fff" : INK, boxShadow: active ? "none" : `2px 2px 0 ${INK}`, transform: active ? "translate(2px,2px)" : "none", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{children}</button>;
}

// wave bending vs blocking
function WaveDiagram({ band }: { band: "treble" | "bass" }) {
  const bass = band === "bass";
  return (
    <svg viewBox="0 0 320 130" style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x="0" y="108" width="320" height="22" fill="#e6e2d6" />
      {/* zdroj */}
      <circle cx="40" cy="78" r="9" fill="#ff6fae" stroke={INK} strokeWidth="2.5" />
      {/* stěna */}
      <rect x="150" y="34" width="14" height="74" fill="#8b8d92" stroke={INK} strokeWidth="2.5" />
      {/* ucho */}
      <circle cx="282" cy="78" r="9" fill={bass ? "#dc2626" : "#cfcabf"} stroke={INK} strokeWidth="2.5" />
      <text x="282" y="82" textAnchor="middle" fontSize="11">👂</text>
      {bass ? (
        <path d="M40 78 Q 110 78 130 50 Q 150 22 180 22 Q 250 22 282 78" fill="none" stroke="#dc2626" strokeWidth="3" strokeDasharray="2 5" strokeLinecap="round" />
      ) : (
        <>
          <line x1="49" y1="78" x2="148" y2="78" stroke="#16A34A" strokeWidth="3" strokeDasharray="2 5" strokeLinecap="round" />
          <path d="M150 78 l-10 -8 m10 8 l-10 8" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}

// interaktivní pokoj
function Room({ choice }: { choice: Choice | null }) {
  const soil = choice === "soil";
  const panels = choice === "panels";
  const insul = choice === "insulation";
  const speakers = choice === "speakers";
  const remote = choice === "remote";
  return (
    <div style={{ ...card, position: "relative", height: 200, overflow: "hidden", marginTop: 16, background: "#fbf3e4" }}>
      {/* zeď uprostřed/vpravo */}
      <div style={{ position: "absolute", right: "34%", top: 0, bottom: 0, width: 14, background: insul ? "repeating-linear-gradient(45deg,#e3d06a 0 7px,#cbb84e 7px 14px)" : "#cdbfa6", borderLeft: `2px solid ${INK}`, borderRight: `2px solid ${INK}`, transition: "background 300ms" }} />
      {panels && <div style={{ position: "absolute", right: "calc(34% + 16px)", top: 24, bottom: 24, width: 14, background: "repeating-linear-gradient(0deg,#c060ff 0 8px,#a64de0 8px 16px)", borderRadius: 3 }} />}
      {/* obývák vlevo */}
      <span style={{ position: "absolute", left: 24, bottom: 18, fontSize: 34 }}>📺</span>
      <span style={{ position: "absolute", left: 70, bottom: 22, fontSize: 26, transform: speakers ? "rotate(-35deg)" : "none", transition: "transform 400ms" }}>🔊</span>
      <span style={{ position: "absolute", left: 120, fontSize: 30, transition: "bottom 700ms", bottom: soil ? 80 : 16 }}>🧍</span>
      {remote && <span style={{ position: "absolute", left: 30, top: 16, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, background: "#fff", border: `2px solid ${INK}`, borderRadius: 8, padding: "2px 8px" }}>🔉 −20</span>}
      {/* soused */}
      <span style={{ position: "absolute", right: 24, bottom: 18, fontSize: 30 }}>🧑</span>
      <span style={{ position: "absolute", right: 22, top: 16, fontSize: 18, opacity: choice && choice !== "soil" && choice !== "insulation" && choice !== "speakers" && choice !== "panels" ? 1 : (choice ? 0.2 : 1), transition: "opacity 300ms" }}>✊</span>
      {/* hlína */}
      <div style={{ position: "absolute", left: 0, right: "34%", bottom: 0, height: soil ? "62%" : 0, background: "repeating-linear-gradient(0deg,#7a5230 0 6px,#6b4626 6px 12px)", borderTop: soil ? `3px solid #5c3d22` : "none", transition: "height 800ms ease-out" }} />
    </div>
  );
}
