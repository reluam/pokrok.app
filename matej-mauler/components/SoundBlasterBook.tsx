"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/dictionaries";

const INK = "#1a1614", BG = "#FAFAF7";
const display: React.CSSProperties = { fontFamily: "var(--font-display)" };
const card: React.CSSProperties = { background: "#fff", border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 ${INK}` };

type Choice = "remote" | "soil" | "insulation" | "panels" | "speakers";
type Effect = "barrier" | "shield" | "aim" | "";
type Opt = { emoji: string; label: string; verdict: string; title: string; text: string; effect?: Effect };
type Scen = { setup: string; src: string; tgt: string; options: Opt[] };

const C = {
  cs: {
    eyebrow: "Sound Blaster", back: "← Spaghetti.ltd", chapter: "Kapitola", hintKeys: "Listuj šipkami ← →",
    coverTitle: "Jak zastavit zvuk", coverSub: "Malá interaktivní knížka o tom, jak se zvuk šíří — a jak ho přemluvit, aby zůstal, kde má.", start: "Začít →",
    p_wave_t: "Zvuk je vlnění", p_wave_1: "Zdroj rozkmitá molekuly vzduchu a ten rozkmit se šíří všemi směry — jako kruhy na vodě.",
    p_spread_t: "Cestou se mění", p_spread_1: "Slábne se vzdáleností.", p_spread_2: "Odráží se od tvrdých ploch.", p_spread_3: "A ohýbá se kolem překážek.",
    p_stop_t: "Zastavit zvuk", p_stop_1: "…znamená nenechat ten rozkmit dojít k uchu.", p_stop_2: "Buď ho odrazíš pryč (tvrdá hmota), nebo pohltíš (pórovitý materiál).",
    p_freq_t: "Výšky a basy", p_freq_1: "Výšky mají krátké vlny — jdou rovně a snadno se zastaví.", p_freq_2: "Basy mají dlouhé vlny — ohýbají se kolem rohů a procházejí stěnami.",
    p_freqi_t: "Vyzkoušej si to", treble: "Výšky", bass: "Basy", trebleNote: "Výšky stěna zastaví.", bassNote: "Basy se přes stěnu ohnou.",
    p_plug_t: "Špunty do uší", p_plug_1: "Sedí ve zvukovodu a zastaví zvuk dřív, než dorazí na bubínek.", p_plug_2: "Pěnové nejlíp pohltí výšky. Basy tělem a kostí stejně trochu projdou — proto na koncertě dunění pořád cítíš.",
    p_plugi_t: "Co špunty udělají", noPlug: "Bez špuntů", plug: "Se špunty", plugNote: "Špunty uberou nejvíc na výškách (~20–30 dB).",
    p_wall_t: "Tenká stěna", p_wall_1: "Večer, film s pořádnými efekty. Stěna k sousedovi je tenká a on už bouchal.", p_wall_2: "Jak to vyřešit? Klikni na řešení.",
    pick: "Klikni na řešení:", again: "Zkusit jinak",
    p_sum_t: "Shrnutí", p_sum_1: "Hmota blokuje, pórovitost pohlcuje.", p_sum_2: "Výšky zastavíš snadno, basy těžko.", p_sum_3: "Nejlevnější trik? Nasměrovat zdroj jinam — a vzdálenost dělá zázraky.",
    endT: "A to je vše", endP: "Teď víš, proč soused slyší tvoje basy a ne melodii — a co s tím.", endBtn: "← Zpět na Spaghetti.ltd",
    options: [
      { emoji: "🔉", label: "Ztlumit ovladačem", verdict: "ok", title: "Funguje — ale…", text: "Soused má klid, ale přišel jsi o ty efekty, kvůli kterým má smysl pouštět to nahlas. Neodhlučnil jsi, jen vypnul." },
      { emoji: "🪏", label: "Nasypat hlínu do obýváku", verdict: "bad", title: "Princip dobrý, provedení šílené", text: "Hlína je těžká a porézní — zvuk by pohltila. Jenže teď máš obývák po okna v hlíně a panáček se v ní ztratil." },
      { emoji: "🧱", label: "Izolace ve stěně", verdict: "best", title: "Nejlepší fyzika, špatné načasování", text: "Těžká stěna s minerální vatou uvnitř je přesně ono. Jenže to se řeší při stavbě, ne v deset večer." },
      { emoji: "🟪", label: "Odhlučňovací panely", verdict: "ok", title: "Pomůžou — ale jinak", text: "Panely pohltí odrazy uvnitř. Zvuk je čistší, ale prostup k sousedovi sníží jen málo. Pohoda dovnitř, ne bariéra ven." },
      { emoji: "🔈", label: "Otočit reproduktory", verdict: "ok", title: "Chytré a zadarmo", text: "Nasměruj repro od společné stěny — výšky míří jinam, k sousedovi jde míň. Basy se ohnou, ale je to slyšitelně lepší." },
    ] as Opt[],
    scTitles: ["Cirkulárka v noci", "Dálnice u vesnice", "Vlak ve městě", "Letadlo nad bytem", "Koncert ve městě"],
    scenarios: [
      { setup: "Soused řeže cirkulárkou v deset večer. Ostrý kvil se nese celou ulicí. Co s tím?", src: "🪚", tgt: "😖", options: [
        { emoji: "🤝", label: "Poprosit, ať řeže ve dne", verdict: "best", title: "Nejjednodušší řešení", text: "Hluk nezmizí, ale v deset večer ho nikdo nechce. Většina obcí má noční klid od 22:00. Sociální řešení často porazí technické." },
        { emoji: "🌲", label: "Plný plot mezi pozemky", verdict: "ok", effect: "barrier", title: "Pomůže — na ten kvil", text: "Vysoké tóny pily jsou směrové a snadno se odrazí. Plný plot je výrazně utlumí. Hučení motoru (nízké) se ale ohne." },
        { emoji: "🪟", label: "Zavřít okna", verdict: "ok", effect: "shield", title: "Pomůže tobě", text: "Okno je nejslabší místo. Zavřené a lépe izolované sklo ubere nejvíc. Sousedovi venku to ale nepomůže." },
        { emoji: "🎧", label: "Pustit si vlastní hudbu", verdict: "bad", title: "Maskování, ne řešení", text: "Překryješ jeden hluk druhým. Chvíli to funguje, ale celkově je hluku víc, ne míň." },
      ] },
      { setup: "Za vesnicí vede dálnice. V domech je pořád slyšet šum aut. Co postavit?", src: "🚗", tgt: "🏘️", options: [
        { emoji: "⛰️", label: "Zemní val", verdict: "best", effect: "barrier", title: "Levné a účinné", text: "Val z hlíny je těžký i pohltivý — skvělá bariéra, často zadarmo z výkopku. Čím vyšší a blíž dálnici, tím líp." },
        { emoji: "🧱", label: "Protihluková stěna", verdict: "best", effect: "barrier", title: "Přesně na to navržená", text: "Vysoká stěna mezi dálnicí a domy odřízne přímý zvuk. Funguje nejlíp, když blokuje přímou viditelnost na auta." },
        { emoji: "🌳", label: "Vysadit pás stromů", verdict: "bad", title: "Spíš pro oko", text: "Stromy uteší akusticky jen pár dB — fungují hlavně psychologicky (co nevidíš, míň vnímáš). Hluk samy nevyřeší." },
        { emoji: "🤷", label: "Nedělat nic", verdict: "bad", title: "Hluk zůstává", text: "Šum dálnice nikam nezmizí — dlouhodobě únava a horší spánek. Aspoň val by pomohl." },
      ] },
      { setup: "Kolem paneláku jezdí tramvaj. Kvil kol a drnčení je slyšet až v bytě. Co pomůže?", src: "🚊", tgt: "🏢", options: [
        { emoji: "🧱", label: "Stěna podél kolejí", verdict: "best", effect: "barrier", title: "U zdroje je to nejúčinnější", text: "Bariéra hned u kolejí zachytí kvil kol dřív, než se rozletí. Nízké dunění z konstrukce projde, ale ostré zvuky zmizí." },
        { emoji: "🪟", label: "Lepší okna (troj­sklo)", verdict: "ok", effect: "shield", title: "Pomůže uvnitř", text: "Těžší zasklení a dobré těsnění uberou hodně. Venku to nezmění nic, doma ano." },
        { emoji: "🛤️", label: "Pružné uložení kolejí", verdict: "best", title: "Řeší dunění", text: "Antivibrační podloží zastaví přenos vibrací do konstrukce — to je ta basa, co ti drnčí v bytě. Drahé, ale účinné." },
        { emoji: "😴", label: "Zvyknout si", verdict: "bad", title: "Mozek to umí — částečně", text: "Na pravidelný zvuk si zvykneš, ale tělo na hluk reaguje i ve spánku. Není to skutečné řešení." },
      ] },
      { setup: "Bydlíš pod příletovou dráhou. Letadla burácí přímo shora. Co postavit?", src: "✈️", tgt: "🏠", options: [
        { emoji: "🧱", label: "Stěna kolem domu", verdict: "bad", effect: "barrier", title: "Proti nebi nepomůže", text: "Zvuk jde shora — stěna kolem dvora zastíní jen to, co letí po zemi. Letadlo nad hlavou žádná stěna neodstíní." },
        { emoji: "🏠", label: "Izolovat okna a strop", verdict: "best", effect: "shield", title: "Jediné, co funguje", text: "Hluk shora zastaví jen obálka budovy: těžký strop, kvalitní okna, zateplení. Proto se domy u letišť zvukově izolují." },
        { emoji: "🌳", label: "Vysadit stromy", verdict: "bad", title: "Kosmetika", text: "Pár dB a hlavně pocit. Burácení tryskáče to neřeší." },
        { emoji: "📝", label: "Petice za změnu dráhy", verdict: "ok", title: "Systémové řešení", text: "Nejúčinnější bývá změna trasy nebo časů letů — ale to není na tobě, je to na úřadu a letišti." },
      ] },
      { setup: "Pořádáš open-air ve městě. Návštěvníci musí slyšet, sousedi ne. Jak na to?", src: "🎤", tgt: "🌃", options: [
        { emoji: "🔈", label: "Otočit repro od domů", verdict: "best", effect: "aim", title: "Základ", text: "Reproboxy jsou směrové (hlavně výšky). Otoč je k davu a pryč od obytné zóny — okamžitě míň hluku do oken." },
        { emoji: "🎚️", label: "Snížit basy", verdict: "ok", title: "Basy nesou nejdál", text: "Nízké frekvence se ohýbají a nesou kilometry. Mírnější basy = výrazně míň stížností, dav skoro nepozná." },
        { emoji: "🗼", label: "Delay tower v davu", verdict: "best", title: "Chytrá technika", text: "Menší repro v davu = nemusíš tlačit hlavní aparát tak nahlas. Dav slyší, okolí míň. Tak se to dělá na velkých akcích." },
        { emoji: "📢", label: "Pustit to naplno", verdict: "bad", title: "Ráno pokuta", text: "Krátkodobě super, ale limity hluku jsou limity. Pokuta a příště bez povolení." },
      ] },
    ] as Scen[],
  },
  en: {
    eyebrow: "Sound Blaster", back: "← Spaghetti.ltd", chapter: "Chapter", hintKeys: "Use arrows ← →",
    coverTitle: "How to stop sound", coverSub: "A little interactive book about how sound travels — and how to talk it into staying where it belongs.", start: "Start →",
    p_wave_t: "Sound is a wave", p_wave_1: "A source shakes the air molecules and that shaking spreads in every direction — like ripples on water.",
    p_spread_t: "It changes on the way", p_spread_1: "It fades with distance.", p_spread_2: "It reflects off hard surfaces.", p_spread_3: "And it bends around obstacles.",
    p_stop_t: "Stopping sound", p_stop_1: "…means not letting that shaking reach the ear.", p_stop_2: "Either reflect it away (hard mass) or absorb it (porous material).",
    p_freq_t: "Highs and bass", p_freq_1: "Treble has short waves — it goes straight and is easy to stop.", p_freq_2: "Bass has long waves — it bends around corners and passes through walls.",
    p_freqi_t: "Try it", treble: "Treble", bass: "Bass", trebleNote: "A wall stops treble.", bassNote: "Bass bends around the wall.",
    p_plug_t: "Earplugs", p_plug_1: "They sit in your ear canal and stop sound before it reaches the eardrum.", p_plug_2: "Foam plugs absorb highs best. Bass still partly gets through your body and bones — that's why you still feel it at a concert.",
    p_plugi_t: "What plugs do", noPlug: "No plugs", plug: "With plugs", plugNote: "Plugs cut the highs most (~20–30 dB).",
    p_wall_t: "The thin wall", p_wall_1: "Evening, a film with serious effects. The wall to your neighbor is thin and they've banged on it.", p_wall_2: "How to solve it? Click a solution.",
    pick: "Click a solution:", again: "Try another",
    p_sum_t: "In short", p_sum_1: "Mass blocks, porosity absorbs.", p_sum_2: "Treble is easy to stop, bass is hard.", p_sum_3: "Cheapest trick? Aim the source elsewhere — and distance works wonders.",
    endT: "That's it", endP: "Now you know why the neighbor hears your bass but not the melody — and what to do about it.", endBtn: "← Back to Spaghetti.ltd",
    options: [
      { emoji: "🔉", label: "Turn it down", verdict: "ok", title: "Works — but…", text: "The neighbor is happy, but you lost the effects you turned it up for. You didn't soundproof, you switched it off." },
      { emoji: "🪏", label: "Fill the room with soil", verdict: "bad", title: "Right idea, insane execution", text: "Soil is heavy and porous — it would absorb the sound. Except now your living room is buried to the windows and the little guy is gone." },
      { emoji: "🧱", label: "Insulate the wall", verdict: "best", title: "Best physics, wrong timing", text: "A heavy wall with mineral wool inside is exactly it. But that's done when you build, not at ten p.m." },
      { emoji: "🟪", label: "Acoustic panels", verdict: "ok", title: "They help — differently", text: "Panels absorb reflections inside. The sound is cleaner, but transmission next door drops only a little. Comfort in, not a barrier out." },
      { emoji: "🔈", label: "Reposition the speakers", verdict: "ok", title: "Smart and free", text: "Aim the speakers away from the shared wall — treble goes elsewhere, less reaches the neighbor. Bass still bends, but it's audibly better." },
    ] as Opt[],
    scTitles: ["Circular saw at night", "Highway by a village", "Tram in the city", "Plane over a flat", "Concert in the city"],
    scenarios: [
      { setup: "Your neighbor is cutting with a circular saw at 10 p.m. The sharp whine carries down the whole street. What now?", src: "🪚", tgt: "😖", options: [
        { emoji: "🤝", label: "Ask them to do it by day", verdict: "best", title: "The simplest fix", text: "The noise won't vanish, but nobody wants it at 10 p.m. Most places have quiet hours from 10 p.m. The social fix often beats the technical one." },
        { emoji: "🌲", label: "Solid fence between yards", verdict: "ok", effect: "barrier", title: "Helps — with the whine", text: "The saw's high tones are directional and reflect easily. A solid fence cuts them a lot. The low motor hum still bends around." },
        { emoji: "🪟", label: "Close the windows", verdict: "ok", effect: "shield", title: "Helps you", text: "A window is the weakest point. Closed, better-sealed glass cuts the most. But it does nothing for the neighbor outside." },
        { emoji: "🎧", label: "Play your own music", verdict: "bad", title: "Masking, not solving", text: "You cover one noise with another. It works for a while, but overall there's more noise, not less." },
      ] },
      { setup: "A highway runs past the village. Houses always hear the traffic hum. What to build?", src: "🚗", tgt: "🏘️", options: [
        { emoji: "⛰️", label: "Earth berm", verdict: "best", effect: "barrier", title: "Cheap and effective", text: "An earth berm is heavy and absorptive — a great barrier, often free from excavation. The taller and closer to the road, the better." },
        { emoji: "🧱", label: "Noise barrier wall", verdict: "best", effect: "barrier", title: "Built exactly for this", text: "A tall wall between the road and houses cuts the direct sound. Works best when it blocks line of sight to the cars." },
        { emoji: "🌳", label: "Plant a row of trees", verdict: "bad", title: "Mostly for the eyes", text: "Trees only cut a few dB acoustically — they work mainly psychologically. They won't fix the noise alone." },
        { emoji: "🤷", label: "Do nothing", verdict: "bad", title: "The noise stays", text: "Highway hum won't go away — long term it's fatigue and worse sleep. At least a berm would help." },
      ] },
      { setup: "A tram passes the apartment block. Wheel screech and rumble reach the flat. What helps?", src: "🚊", tgt: "🏢", options: [
        { emoji: "🧱", label: "Barrier along the tracks", verdict: "best", effect: "barrier", title: "Most effective at the source", text: "A barrier right by the tracks catches the wheel screech before it spreads. Low structure-borne rumble passes, but the sharp sounds go." },
        { emoji: "🪟", label: "Better windows (triple)", verdict: "ok", effect: "shield", title: "Helps inside", text: "Heavier glazing and good sealing cut a lot. Outside it changes nothing, indoors a lot." },
        { emoji: "🛤️", label: "Resilient track mounting", verdict: "best", title: "Fixes the rumble", text: "Anti-vibration bedding stops vibration getting into the structure — that's the bass rattling your flat. Pricey but effective." },
        { emoji: "😴", label: "Get used to it", verdict: "bad", title: "The brain can — partly", text: "You adapt to regular sound, but the body reacts to noise even in sleep. Not a real solution." },
      ] },
      { setup: "You live under a flight path. Planes roar straight from above. What to build?", src: "✈️", tgt: "🏠", options: [
        { emoji: "🧱", label: "Wall around the house", verdict: "bad", effect: "barrier", title: "Useless against the sky", text: "The sound comes from above — a yard wall only blocks what travels along the ground. No wall shields a plane overhead." },
        { emoji: "🏠", label: "Insulate windows & roof", verdict: "best", effect: "shield", title: "The only thing that works", text: "Overhead noise is only stopped by the building envelope: heavy roof, quality windows, insulation. That's why homes near airports get soundproofed." },
        { emoji: "🌳", label: "Plant trees", verdict: "bad", title: "Cosmetic", text: "A few dB and mostly a feeling. It won't fix a jet's roar." },
        { emoji: "📝", label: "Petition to change the route", verdict: "ok", title: "Systemic fix", text: "Changing flight routes or times is usually most effective — but that's up to the authority and airport, not you." },
      ] },
      { setup: "You're running an open-air in the city. The crowd must hear it, the neighbors mustn't. How?", src: "🎤", tgt: "🌃", options: [
        { emoji: "🔈", label: "Aim speakers away from homes", verdict: "best", effect: "aim", title: "The basics", text: "Speakers are directional (especially treble). Point them at the crowd and away from the residential area — instantly less into windows." },
        { emoji: "🎚️", label: "Turn down the bass", verdict: "ok", title: "Bass carries farthest", text: "Low frequencies bend and carry for kilometers. Gentler bass = far fewer complaints, the crowd barely notices." },
        { emoji: "🗼", label: "Delay tower in the crowd", verdict: "best", title: "Clever rig", text: "Smaller speakers in the crowd mean you don't push the main rig so loud. The crowd hears it, the surroundings less. That's how big events do it." },
        { emoji: "📢", label: "Crank it all the way", verdict: "bad", title: "A fine in the morning", text: "Great short-term, but limits are limits. A fine, and next time no permit." },
      ] },
    ] as Scen[],
  },
} as const;

const vColor = (v: string) => v === "best" ? "#16A34A" : v === "ok" ? "#2563EB" : v === "bad" ? "#dc2626" : INK;
const vTag = (v: string, lang: Lang) => v === "best" ? (lang === "cs" ? "nejlepší" : "best") : v === "ok" ? "ok" : (lang === "cs" ? "vedle" : "off");

export function SoundBlasterBook({ lang }: { lang: Lang }) {
  const t = C[lang];
  const homeHref = lang === "cs" ? "/cs" : "/";
  const [step, setStep] = useState(0);
  const [band, setBand] = useState<"treble" | "bass">("bass");
  const [plug, setPlug] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);
  const opt = choice ? t.options[["remote", "soil", "insulation", "panels", "speakers"].indexOf(choice)] : null;

  const pages: (() => React.ReactNode)[] = [
    () => (<Center>
      <Reveal d={0}><p style={chipS}>{t.eyebrow}</p></Reveal>
      <Reveal d={0.1}><div style={{ position: "relative", height: 120, margin: "8px 0 6px" }}><span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontSize: 40, zIndex: 2 }}>🔊</span>{[0, 1, 2].map((i) => <span key={i} className="sb-ring" style={{ animationDelay: `${i * 0.7}s` }} />)}</div></Reveal>
      <Reveal d={0.2}><h1 style={{ ...display, fontSize: "clamp(34px,8vw,60px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.03 }}>{t.coverTitle}</h1></Reveal>
      <Reveal d={0.35}><p style={subS}>{t.coverSub}</p></Reveal>
      <Reveal d={0.5}><button onClick={() => setStep(1)} style={primary}>{t.start}</button></Reveal>
      <Reveal d={0.7}><p style={{ ...hintS, marginTop: 16 }}>{t.hintKeys}</p></Reveal>
    </Center>),
    () => (<Page title={t.p_wave_t}>
      <Reveal d={0.15}><div style={{ position: "relative", height: 150, margin: "4px 0 14px" }}><span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontSize: 36, zIndex: 2 }}>🔊</span>{[0, 1, 2, 3].map((i) => <span key={i} className="sb-ring" style={{ animationDelay: `${i * 0.55}s` }} />)}</div></Reveal>
      <Reveal d={0.3}><P>{t.p_wave_1}</P></Reveal>
    </Page>),
    () => (<Page title={t.p_spread_t}>
      <Reveal d={0.15}><Bullet emoji="📉">{t.p_spread_1}</Bullet></Reveal>
      <Reveal d={0.35}><Bullet emoji="🪨">{t.p_spread_2}</Bullet></Reveal>
      <Reveal d={0.55}><Bullet emoji="↪️">{t.p_spread_3}</Bullet></Reveal>
    </Page>),
    () => (<Page title={t.p_stop_t}>
      <Reveal d={0.15}><P>{t.p_stop_1}</P></Reveal>
      <Reveal d={0.35}><Note>{t.p_stop_2}</Note></Reveal>
    </Page>),
    () => (<Page title={t.p_freq_t}>
      <Reveal d={0.15}><Bullet emoji="🎼">{t.p_freq_1}</Bullet></Reveal>
      <Reveal d={0.35}><Bullet emoji="🔊">{t.p_freq_2}</Bullet></Reveal>
    </Page>),
    () => (<Page title={t.p_freqi_t}>
      <Reveal d={0.1}><div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}><Toggle active={band === "treble"} onClick={() => setBand("treble")}>{t.treble}</Toggle><Toggle active={band === "bass"} onClick={() => setBand("bass")}>{t.bass}</Toggle></div></Reveal>
      <Reveal d={0.2}><div style={{ ...card, padding: 16 }}><WaveDiagram band={band} /><p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: band === "bass" ? "#dc2626" : "#16A34A", marginTop: 8, textAlign: "center" }}>{band === "bass" ? t.bassNote : t.trebleNote}</p></div></Reveal>
    </Page>),
    () => (<Page title={t.p_plug_t}>
      <Reveal d={0.15}><div style={{ fontSize: 48, textAlign: "center", margin: "4px 0 12px" }}>🦻</div></Reveal>
      <Reveal d={0.3}><P>{t.p_plug_1}</P></Reveal>
      <Reveal d={0.5}><P>{t.p_plug_2}</P></Reveal>
    </Page>),
    () => (<Page title={t.p_plugi_t}>
      <Reveal d={0.1}><div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}><Toggle active={!plug} onClick={() => setPlug(false)}>{t.noPlug}</Toggle><Toggle active={plug} onClick={() => setPlug(true)}>{t.plug}</Toggle></div></Reveal>
      <Reveal d={0.2}><div style={{ ...card, padding: 16 }}><Spectrum plug={plug} lang={lang} /><p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginTop: 10, textAlign: "center" }}>{t.plugNote}</p></div></Reveal>
    </Page>),
    () => (<Page title={t.p_wall_t}>
      <Reveal d={0.15}><P>{t.p_wall_1}</P></Reveal>
      <Reveal d={0.3}><P style2={{ fontWeight: 700, color: "var(--text-primary)" }}>{t.p_wall_2}</P></Reveal>
      <Reveal d={0.45}><Room choice={choice} /></Reveal>
      <Reveal d={0.55}><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {t.options.map((o, i) => { const id = (["remote", "soil", "insulation", "panels", "speakers"] as Choice[])[i]; return (
          <button key={id} onClick={() => setChoice(id)} style={optBtn(choice === id)}><span style={{ fontSize: 16 }}>{o.emoji}</span>{o.label}</button>); })}
      </div></Reveal>
      {opt && <Consequence o={opt} onAgain={() => setChoice(null)} again={t.again} lang={lang} />}
    </Page>),
    ...t.scenarios.map((sc, si) => () => (<Page title={t.scTitles[si]}><Solve key={si} cfg={sc} lang={lang} again={t.again} /></Page>)),
    () => (<Page title={t.p_sum_t}>
      <Reveal d={0.15}><Bullet emoji="🧱">{t.p_sum_1}</Bullet></Reveal>
      <Reveal d={0.35}><Bullet emoji="🎚️">{t.p_sum_2}</Bullet></Reveal>
      <Reveal d={0.55}><Bullet emoji="🔈">{t.p_sum_3}</Bullet></Reveal>
    </Page>),
    () => (<Center>
      <Reveal d={0.1}><div style={{ fontSize: 44, marginBottom: 10 }}>🎧</div></Reveal>
      <Reveal d={0.2}><h2 style={{ ...display, fontSize: "clamp(26px,6vw,40px)", fontWeight: 700 }}>{t.endT}</h2></Reveal>
      <Reveal d={0.35}><p style={subS}>{t.endP}</p></Reveal>
      <Reveal d={0.5}><Link href={homeHref} style={{ ...primary, display: "inline-block", textDecoration: "none" }}>{t.endBtn}</Link></Reveal>
    </Center>),
  ];
  const N = pages.length;
  const go = (d: number) => setStep((s) => Math.max(0, Math.min(N - 1, s + d)));
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [N]);

  return (
    <main style={{ background: BG, color: INK, height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", flexShrink: 0 }}>
        <Link href={homeHref} style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>{t.back}</Link>
        {step > 0 && <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-muted)" }}>{t.chapter} {step} / {N - 1}</span>}
        <span style={{ width: 70 }} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 20px" }}>
        <div key={step} style={{ width: "100%", maxWidth: 600 }}>{pages[step]()}</div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "14px 20px 22px" }}>
        <button onClick={() => go(-1)} disabled={step === 0} style={navBtn(step === 0)}>‹</button>
        <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", maxWidth: 300, justifyContent: "center" }}>
          {pages.map((_, i) => <button key={i} onClick={() => setStep(i)} aria-label={`${i}`} style={{ width: i === step ? 10 : 7, height: i === step ? 10 : 7, borderRadius: "50%", border: "none", background: i === step ? INK : "rgba(26,22,20,0.25)", cursor: "pointer", padding: 0 }} />)}
        </div>
        <button onClick={() => go(1)} disabled={step === N - 1} style={navBtn(step === N - 1)}>›</button>
      </div>
      <style>{`
        .sb-ring { position:absolute; left:50%; top:50%; width:18px; height:18px; border:2.5px solid ${INK}; border-radius:50%; transform:translate(-50%,-50%); opacity:0; animation: sb-ring 2.1s ease-out infinite; }
        @keyframes sb-ring { 0%{ width:18px; height:18px; opacity:0.9; } 100%{ width:150px; height:150px; opacity:0; } }
        .sb-rev { opacity:0; animation: sb-up 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes sb-up { from{ opacity:0; transform: translateY(12px); } to{ opacity:1; transform:none; } }
      `}</style>
    </main>
  );
}

const chipS: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.24em", color: "var(--text-muted)" };
const subS: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--text-secondary)", maxWidth: 460, margin: "12px auto 0", lineHeight: 1.6 };
const hintS: React.CSSProperties = { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" };
const primary: React.CSSProperties = { background: INK, color: "#fff", border: `2.5px solid ${INK}`, borderRadius: 12, boxShadow: `4px 4px 0 ${INK}`, padding: "13px 28px", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 18 };
const navBtn = (dis: boolean): React.CSSProperties => ({ width: 48, height: 48, borderRadius: 14, border: `2.5px solid ${INK}`, background: dis ? "rgba(0,0,0,0.04)" : "#fff", color: dis ? "var(--text-muted)" : INK, boxShadow: dis ? "none" : `3px 3px 0 ${INK}`, fontSize: 22, cursor: dis ? "default" : "pointer", flexShrink: 0 });
const optBtn = (active: boolean): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 999, border: `2px solid ${INK}`, background: active ? INK : "#fff", color: active ? "#fff" : INK, boxShadow: active ? "none" : `2px 2px 0 ${INK}`, transform: active ? "translate(2px,2px)" : "none", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, cursor: "pointer" });

function Center({ children }: { children: React.ReactNode }) { return <div style={{ textAlign: "center" }}>{children}</div>; }
function Page({ title, children }: { title: string; children: React.ReactNode }) { return (<div><Reveal d={0}><h2 style={{ ...display, fontSize: "clamp(24px,5vw,38px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 18 }}>{title}</h2></Reveal>{children}</div>); }
function Reveal({ d = 0, children }: { d?: number; children: React.ReactNode }) { return <div className="sb-rev" style={{ animationDelay: `${d}s` }}>{children}</div>; }
function P({ children, style2 }: { children: React.ReactNode; style2?: React.CSSProperties }) { return <p style={{ fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 14, ...style2 }}>{children}</p>; }
function Note({ children }: { children: React.ReactNode }) { return <p style={{ ...display, fontStyle: "italic", fontSize: 18, color: "var(--text-primary)", borderLeft: `3px solid ${INK}`, paddingLeft: 14 }}>{children}</p>; }
function Bullet({ emoji, children }: { emoji: string; children: React.ReactNode }) { return <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}><span style={{ fontSize: 26 }}>{emoji}</span><span style={{ fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.5, color: "var(--text-primary)" }}>{children}</span></div>; }
function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} style={optBtn(active)}>{children}</button>; }

function Consequence({ o, onAgain, again, lang }: { o: Opt; onAgain: () => void; again: string; lang: Lang }) {
  return (
    <div className="sb-rev" style={{ ...card, padding: "16px 18px", marginTop: 14, borderColor: vColor(o.verdict), boxShadow: `5px 5px 0 ${vColor(o.verdict)}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>{o.emoji}</span>
        <h3 style={{ ...display, fontSize: 18, fontWeight: 700 }}>{o.title}</h3>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#fff", background: vColor(o.verdict), borderRadius: 999, padding: "3px 10px" }}>{vTag(o.verdict, lang)}</span>
      </div>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.6 }}>{o.text}</p>
      <button onClick={onAgain} style={{ marginTop: 10, background: "transparent", border: "none", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>{again}</button>
    </div>
  );
}

function Solve({ cfg, lang, again }: { cfg: Scen; lang: Lang; again: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const o = sel != null ? cfg.options[sel] : null;
  const eff = o?.effect;
  return (
    <div>
      <Reveal d={0.15}><P>{cfg.setup}</P></Reveal>
      <Reveal d={0.3}><div style={{ ...card, position: "relative", height: 150, overflow: "hidden", background: "#eef3fb" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, background: "#5ec46a", borderTop: `2.5px solid ${INK}` }} />
        <span style={{ position: "absolute", left: 30, bottom: 30, fontSize: 38 }}>{cfg.src}</span>
        <span style={{ position: "absolute", right: 30, bottom: 30, fontSize: 38, filter: eff === "shield" ? "none" : "none" }}>{cfg.tgt}</span>
        {eff === "barrier" && <div style={{ position: "absolute", left: "48%", bottom: 26, width: 16, height: 90, background: "repeating-linear-gradient(0deg,#9a9ca1 0 8px,#74767b 8px 16px)", border: `2.5px solid ${INK}`, borderRadius: 3, transition: "all 300ms" }} />}
        {eff === "shield" && <div style={{ position: "absolute", right: 18, bottom: 24, width: 64, height: 80, border: `3px dashed #2563EB`, borderRadius: 10, boxShadow: "0 0 0 4px rgba(37,99,235,0.12)" }} />}
        {eff === "aim" && <span style={{ position: "absolute", left: 72, bottom: 40, fontSize: 22, transform: "rotate(40deg)" }}>🔈</span>}
      </div></Reveal>
      <Reveal d={0.45}><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {cfg.options.map((op, i) => <button key={i} onClick={() => setSel(i)} style={optBtn(sel === i)}><span style={{ fontSize: 16 }}>{op.emoji}</span>{op.label}</button>)}
      </div></Reveal>
      {o && <Consequence o={o} onAgain={() => setSel(null)} again={again} lang={lang} />}
    </div>
  );
}

function WaveDiagram({ band }: { band: "treble" | "bass" }) {
  const bass = band === "bass";
  return (
    <svg viewBox="0 0 320 130" style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x="0" y="108" width="320" height="22" fill="#e6e2d6" />
      <circle cx="40" cy="78" r="9" fill="#ff6fae" stroke={INK} strokeWidth="2.5" />
      <rect x="150" y="34" width="14" height="74" fill="#8b8d92" stroke={INK} strokeWidth="2.5" />
      <circle cx="282" cy="78" r="9" fill={bass ? "#dc2626" : "#cfcabf"} stroke={INK} strokeWidth="2.5" />
      <text x="282" y="82" textAnchor="middle" fontSize="11">👂</text>
      {bass
        ? <path d="M40 78 Q 110 78 130 50 Q 150 22 180 22 Q 250 22 282 78" fill="none" stroke="#dc2626" strokeWidth="3" strokeDasharray="2 5" strokeLinecap="round" />
        : <><line x1="49" y1="78" x2="148" y2="78" stroke="#16A34A" strokeWidth="3" strokeDasharray="2 5" strokeLinecap="round" /><path d="M150 78 l-10 -8 m10 8 l-10 8" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none" /></>}
    </svg>
  );
}

function Spectrum({ plug, lang }: { plug: boolean; lang: Lang }) {
  const labels = lang === "cs" ? ["Basy", "Středy", "Výšky"] : ["Bass", "Mid", "Treble"];
  const base = [0.85, 0.8, 0.9]; const cut = plug ? [0.7, 0.42, 0.18] : [1, 1, 1];
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-end", justifyContent: "center", height: 120 }}>
      {labels.map((l, i) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div style={{ width: 46, height: 90, background: "rgba(26,22,20,0.08)", border: `2px solid ${INK}`, borderRadius: 6, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
            <div style={{ width: "100%", height: `${base[i] * cut[i] * 100}%`, background: i === 2 ? "#ff6fae" : i === 1 ? "#ffd23f" : "#4aa3ff", transition: "height 500ms ease" }} />
          </div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, marginTop: 6 }}>{l}</p>
        </div>
      ))}
    </div>
  );
}

function Room({ choice }: { choice: Choice | null }) {
  const soil = choice === "soil", panels = choice === "panels", insul = choice === "insulation", speakers = choice === "speakers", remote = choice === "remote";
  const calm = choice === "soil" || choice === "insulation" || choice === "speakers" || choice === "panels";
  return (
    <div style={{ ...card, position: "relative", height: 200, overflow: "hidden", background: "#fbf3e4" }}>
      <div style={{ position: "absolute", right: "34%", top: 0, bottom: 0, width: 14, background: insul ? "repeating-linear-gradient(45deg,#e3d06a 0 7px,#cbb84e 7px 14px)" : "#cdbfa6", borderLeft: `2px solid ${INK}`, borderRight: `2px solid ${INK}`, transition: "background 300ms" }} />
      {panels && <div style={{ position: "absolute", right: "calc(34% + 16px)", top: 24, bottom: 24, width: 14, background: "repeating-linear-gradient(0deg,#c060ff 0 8px,#a64de0 8px 16px)", borderRadius: 3 }} />}
      <span style={{ position: "absolute", left: 24, bottom: 18, fontSize: 34 }}>📺</span>
      <span style={{ position: "absolute", left: 70, bottom: 22, fontSize: 26, transform: speakers ? "rotate(-35deg)" : "none", transition: "transform 400ms" }}>🔊</span>
      <span style={{ position: "absolute", left: 120, fontSize: 30, transition: "bottom 800ms ease-out", bottom: soil ? 88 : 16 }}>🧍</span>
      {remote && <span style={{ position: "absolute", left: 30, top: 16, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, background: "#fff", border: `2px solid ${INK}`, borderRadius: 8, padding: "2px 8px" }}>🔉 −20</span>}
      <span style={{ position: "absolute", right: 24, bottom: 18, fontSize: 30 }}>🧑</span>
      <span style={{ position: "absolute", right: 22, top: 16, fontSize: 18, opacity: choice ? (calm ? 0.15 : 1) : 1, transition: "opacity 300ms" }}>✊</span>
      <div style={{ position: "absolute", left: 0, right: "34%", bottom: 0, height: soil ? "64%" : 0, background: "repeating-linear-gradient(0deg,#7a5230 0 6px,#6b4626 6px 12px)", borderTop: soil ? "3px solid #5c3d22" : "none", transition: "height 800ms ease-out" }} />
    </div>
  );
}
