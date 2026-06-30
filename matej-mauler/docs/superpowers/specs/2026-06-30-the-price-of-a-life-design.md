# The Price of a Life — design spec

**Slug:** `price-of-a-life`  ·  **URL:** `/price-of-a-life`  ·  **Date:** 2026-06-30

A data-journalism-style experience where the player acts as a government and decides, across **20
scenarios**, whether to fund a life-saving measure (fund it / don't fund it). Each decision implies
a *price per statistical life* (cost ÷ lives saved), revealed as a big number.

Based on the real economic concept of the **Value of a Statistical Life (VSL)**. All numbers are
**illustrative, not real statistics** — kept round so the price per life is clean and the player
barely has to do arithmetic.

> **Revision (v2, the implemented design).** The original draft below was 10 free-standing
> scenarios charted on a log scale. Per the user, it is now **20 scenarios arranged as 10 matched
> pairs**: the two halves of a pair cost exactly the same and save the same number of lives — so
> they carry the **same price per life**. Only *who* is saved differs (schoolchildren vs miners,
> locals vs foreigners, newborns vs the very old, families vs the homeless, the blameless vs the
> blamed…). The mirror's headline is the count of pairs where the player gave **opposite answers to
> the same price** — proof it wasn't the math deciding, it was who the people were. The institutional
> "you're the government" framing is kept; the slider/personal-pricing ideas were rejected.
>
> **Pairs (price/life):** guardrail children·miners ($200k) · flu local·foreign elderly ($50k) ·
> trial newborns·80s ($5M) · gear firefighters·rig workers ($300k) · smoke-alarms families·shelter
> ($100k) · drug children·adults ($2M) · crossing school·factory ($400k) · water citizens·migrants
> ($20k) · ambulance wealthy·poor suburb ($800k, class — no relatable side) · liver accident·drinkers
> ($1M). Each pair flags the more-relatable side (children, locals, newborns, families, the blameless)
> for the "you paid for the familiar" badge.
>
> **Mirror (v2):** the 10 pairs sorted ascending by price; each pair a card with both halves shown as
> funded/passed chips; **split pairs highlighted** ("same price · opposite call"). Headline = number
> of flips. Closing line sharpened to *"The price of a life isn't fixed. It depends on whose life it
> is."*
>
> **Badges (v2, still 100 XP):** saw_your_price (10, reached end) · drew_a_line (15, funded≥1 &
> skipped≥1) · same_price_different_answer (30, flips≥1) · who_not_how_much (25, flips≥2) ·
> you_paid_for_the_familiar (20, comfortFlips≥2). Insight keys: `flips`, `comfortFlips`,
> `fundedCount`, `skippedCount`, `reachedMirror`.

The 10-scenario log-scale design that follows is **superseded** by the revision above; kept for
provenance.

## Tone & visual

Matter-of-fact, slightly unsettling, never preachy. Numbers do the talking; no moralizing copy.
Clean data-journalism look (Pudding / Bloomberg Graphics): off-white/cream background to match
Spaghetti.ltd, lots of whitespace, **Space Grotesk** for headings + the big numbers, system sans
for body. Restrained muted palette — muted green `#3f8f6b`-ish for *funded / saved*, muted red
`#b4503f`-ish for *skipped / lost*; ink near-black on cream. No garish color. Numbers **count up**
when revealed. Smooth fade/slide between steps, single-column, mobile-first.

## Architecture (standard Spaghetti experiment shape)

- `app/price-of-a-life/page.tsx` — thin server page. `Space_Grotesk` via `next/font/google`,
  `metadata`, renders the client component on a cream background wrapper.
- `components/price-of-a-life/PriceOfALife.tsx` — `"use client"`, the whole experience. State
  machine: `intro → run (scenario i ∈ 0..9, each with decide → reveal sub-state) → mirror`.
- `lib/priceOfALife.ts` — the 10 scenarios as typed data + the pure helper
  `computeMirror(decisions)`. No React, unit-testable.
- `lib/rewards/price-of-a-life.ts` — `BadgeDef[]` summing to **exactly 100 XP**; registered in
  `lib/rewards/index.ts`.
- Catalog: an entry in `lib/experiments.ts` **and** both `cs` + `en` entries in
  `lib/dictionaries.ts` (the homepage seed skips experiments missing a dictionary entry, which
  breaks the static fallback — both languages are mandatory even though the site renders en-only).

No schema change (experiments are experiment-agnostic). No new dependencies — chart is hand-rolled
SVG. Clerk stays env-guarded; the experience is fully usable signed-out.

## Data flow

1. Player makes 10 fund/skip decisions; component holds `decisions: Decision[]` in state.
2. On entering `mirror`, compute `mirror = computeMirror(decisions)` and **once** POST to
   `/api/participation` with `{ experimentSlug: "price-of-a-life", insight, payload }`.
   - `insight` (badges read this): `{ reachedMirror, fundedCount, skippedCount, contradictions,
     distanceBias, fundedSpanRatio, impliedFloor, impliedCeiling }`.
   - `payload`: the raw `decisions` array (slug, funded, pricePerLife) for the record.
3. `track("experiment_completed", { slug, fundedCount })` (analytics, no insight payload).
4. After the personal number lands, render `<PromptRegistration trigger="on_result" …>` (renders
   nothing if Clerk is off or the user is signed in). Registration is never a gate.

## The scenarios (illustrative numbers)

`pricePerLife = totalCost ÷ livesSaved` over the stated horizon. Stored precomputed; inputs shown
to the player. Sorted ascending here to show the intended ~4.4-orders-of-magnitude spread:

| # | Scenario | Cost (illustrative) | Lives | Price / life |
|---|----------|--------------------|-------|--------------|
| 1 | Developing-region child vaccination | $6/child × 500k children = $3.0M | ~2,000 deaths averted | **$1,500** |
| 2 | Traffic-intersection lights | $280k one-time, 25-yr life | 2/yr → 50 | **$5,600** |
| 3 | ICU beds (add 6) | $1.3M/yr | 9 extra survivals/yr | **$144,000** |
| 4 | Factory air filtration | $14M + $0.4M/yr × 20yr = $22M | 7/yr → 140 | **$157,000** |
| 5 | Pedestrian underpass by a school | $5.5M one-time, 40-yr life | ~7 children | **$786,000** |
| 6 | Mine safety equipment | $3.4M over 30-yr mine life | ~4 | **$850,000** |
| 7 | Small-town fire station | $2.8M + $0.9M/yr × 20yr = $20.8M | 1/yr → 20 | **$1,040,000** |
| 8 | School-bus seatbelts | $9k × 700 buses = $6.3M, 12-yr life | ~3 children | **$2,100,000** |
| 9 | Speed-limit reduction | aggregate commuter time ≈ $48M/yr | 6/yr | **$8,000,000** |
| 10 | Rare-disease drug | $850k/patient/yr × 40 = $34M/yr | ~1/yr | **$34,000,000** |

Presentation order in the run is **shuffled per session** (stable within a session) so the player
can't anchor on a tidy ascending ramp; the mirror re-sorts ascending. Scenario #1 (the far,
cheapest life) and #10 (the near, dearest) are the two poles the closing insight leans on.

## The mirror (final reveal)

Price-per-life is a fixed property of each scenario. The player's *choice* reveals their personal
threshold. The mirror is the payload.

- **Chart:** horizontal log-scale bar chart, all 10 sorted ascending by price/life. Each bar
  labelled with the scenario + its price; colored **green if the player funded it, red if skipped**.
- **Your number:** `impliedFloor` = highest price/life you funded; `impliedCeiling` = lowest
  price/life you skipped. Shown as a band: "you paid up to **$X** for a life — and walked away
  from one that cost **$Y**." (Counts up.)
- **Contradictions:** count of skipped scenarios cheaper than your most expensive funded one,
  highlighted on the chart (a red bar sitting *below* a green one is a contradiction). "You funded
  a life at $X but passed on one at a tenth the price."
- **Edge cases:** funded-all → "your line sits above $34,000,000 — every life made the cut";
  skipped-all → "your line sits below $1,500 — no life cleared the bar." Both still coherent.
- **Closing line:** *"The price of a life isn't fixed. It depends on who's asking, and why."*
- Actions: **restart** (reshuffle, clear decisions) and **share** (`navigator.share` → clipboard
  fallback, like the other experiments).

`computeMirror(decisions)` is pure and returns everything above; the component only renders it.

## Badges — 100 XP total (insight, never completion/volume/streak)

All read the `insight` object via the `asNumber`/`asBool` helpers. They reward the self-knowledge
the experience can mirror back; the full 100 is reachable by a player who actually wrestles with the
trade-offs (funds some, skips some, and — by the design of the spread — contradicts themselves).

| slug | name | XP | criteriaKey | earned when |
|------|------|----|-------------|-------------|
| `saw_your_price` | you saw your own price | 10 | `reached_mirror` | `reachedMirror` true (floor) |
| `drew_a_line` | you drew a line | 20 | `has_threshold` | funded ≥1 **and** skipped ≥1 — a real threshold exists |
| `broke_your_own_rule` | you broke your own rule | 25 | `self_contradiction` | `contradictions ≥ 1` |
| `distance_changed_math` | distance changed the math | 25 | `proximity_bias` | skipped the far $1,500 vaccination while funding something dearer |
| `priced_lives_100x_apart` | you priced lives 100× apart | 20 | `funded_span` | `fundedSpanRatio ≥ 100` (funded both a cheap and a ~100× dearer life) |

Sum = 10+20+25+25+20 = **100**. Copy names what the player learned about *themselves*; each
sentence is the shareable payload. None celebrate finishing for its own sake (beyond the 10-XP floor).

## Testing

- `lib/priceOfALife.test.ts` (vitest): `computeMirror` — floor/ceiling, contradiction counting,
  `distanceBias`, `fundedSpanRatio`, and the funded-all / skipped-all edge cases.
- `lib/rewards/price-of-a-life.test.ts`: each badge's `evaluate` against representative insight
  objects, and that the array sums to exactly 100 XP.

## Out of scope (YAGNI)

No leaderboard, no per-scenario social stats, no real-citation mode, no difficulty settings, no
persistence of in-progress runs. One sitting, one mirror.
