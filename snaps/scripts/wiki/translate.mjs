// Bulk EN translation for wiki markdown files using the Claude API.
//
// Reads each model markdown file in wiki/, finds CZ fields that don't have an
// EN translation yet, sends them in one batch per model to Claude, and writes
// the EN sub-blocks back into the markdown.
//
// USAGE:
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/wiki/translate.mjs [options]
//
// OPTIONS:
//   --limit N          Translate at most N model files (default: all)
//   --model ID         Translate only the model with this id (e.g. cb-f01)
//   --claude-model M   Claude model id (default: claude-sonnet-4-6)
//   --tracks-courses   Also translate track + course titles/subtitles
//   --dry              Show what would be translated, don't call API
//   --force            Re-translate fields even if EN already exists
//
// COST CONTROL:
//   The script reports estimated tokens before calling. Use --limit during
//   testing. Translating all 175 models costs roughly $5–15 with Sonnet
//   depending on model verbosity (~600k input + ~400k output tokens total).
//
// SAFETY:
//   - Idempotent: re-running skips fields that already have EN.
//   - Resumable: Ctrl+C between files is safe; partial files are saved on each
//     model completion.
//   - Validates that the EN response has the same number of items as the CZ
//     batch — errors out if Claude returns a malformed response.

import fs from 'node:fs';
import path from 'node:path';
import {
  WIKI_DIR,
  parseModelMarkdown,
  parseTrackMarkdown,
  parseCourseMarkdown,
  renderModelMarkdown,
  renderTrackMarkdown,
  renderCourseMarkdown,
  serializeFrontmatter,
} from './lib.mjs';

// ─── CLI args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flagValue(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
}
const LIMIT = parseInt(flagValue('--limit') || '0', 10) || Infinity;
const ONLY_MODEL = flagValue('--model');
const CLAUDE_MODEL = flagValue('--claude-model') || 'claude-sonnet-4-6';
const DRY = args.includes('--dry');
const FORCE = args.includes('--force');
const TRACKS_COURSES = args.includes('--tracks-courses');
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!DRY && !API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY env variable. Set it or use --dry.');
  process.exit(1);
}

// ─── File walking ─────────────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const allMd = walk(WIKI_DIR).filter(
  (f) => !path.basename(f).startsWith('README') && !path.basename(f).startsWith('ARCHITECTURE')
);
const modelFiles = allMd.filter(
  (f) => !path.basename(f).startsWith('_') && !f.includes('/_orphans/') === false
    ? false
    : !path.basename(f).startsWith('_')
);
const trackFiles = allMd.filter((f) => path.basename(f) === '_track.md');
const courseFiles = allMd.filter((f) => path.basename(f) === '_course.md');

// ─── Claude API ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional Czech-to-English translator specializing in psychology, cognitive science, mental models, productivity, mindfulness, health, and self-improvement content.

You translate educational micro-content for a learning app. Translations must:
- Preserve the casual, second-person tone ("you", "your brain") — never formal "one"
- Keep Czech personal names (Honza, Klára, Tomáš, Petra, Míša, Jirka, Martina) as-is — they give cultural flavor
- Convert Czech currency (Kč) to its native form ("CZK" or keep "Kč" — pick whatever reads more natural in context)
- Preserve markdown formatting exactly: **, lists, line breaks
- Match register: short phrases stay short, expanded passages stay expanded
- Convert Czech „lower-upper" quotes to standard "..." double quotes
- Use natural, idiomatic English — not literal translation
- Don't add or remove information

You will receive a JSON array of items to translate. You MUST return ONLY a JSON array of translations in the SAME order, with no preamble, no code fence, no commentary. Each output item is a string — the English translation of the input string at that index.

Example:
Input:  ["Honza jede autem.", "Mozek dělá zkratky."]
Output: ["Honza is driving a car.", "The brain takes shortcuts."]`;

async function callClaude(items) {
  const userContent = JSON.stringify(items);
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userContent },
      { role: 'assistant', content: '[' }, // prefill: forces JSON array start
    ],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  // Re-prepend the [ from the prefill
  const fullJson = '[' + text;
  // Strip any trailing junk after the closing bracket
  const lastBracket = fullJson.lastIndexOf(']');
  if (lastBracket === -1) throw new Error('Claude returned no JSON array');
  const jsonStr = fullJson.slice(0, lastBracket + 1);

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Failed to parse Claude response as JSON: ${e.message}\n\nRaw:\n${fullJson.slice(0, 500)}`);
  }
  if (!Array.isArray(parsed)) throw new Error('Claude response is not an array');
  if (parsed.length !== items.length) {
    throw new Error(`Claude returned ${parsed.length} items, expected ${items.length}`);
  }
  return parsed;
}

// ─── Field extraction for a model ─────────────────────────────────────────
//
// Build a flat list of fields that need translation. Each entry has:
//   { path: '...', cz: '...', set: (en) => void }
//
// `path` is a debug identifier. `set` mutates the model object to attach the
// translated value when we get it back.

function collectMissingFields(model, lessons) {
  const fields = [];
  const need = (cur, en) => (cur && (FORCE || !en));

  const modelEnPairs = [
    ['short_description', 'short_description_en'],
    ['full_explanation', 'full_explanation_en'],
    ['real_world_example', 'real_world_example_en'],
    ['common_mistakes', 'common_mistakes_en'],
  ];
  for (const [czKey, enKey] of modelEnPairs) {
    if (need(model[czKey], model[enKey])) {
      fields.push({
        path: `model.${czKey}`,
        cz: model[czKey],
        set: (en) => { model[enKey] = en; },
      });
    }
  }

  for (let li = 0; li < lessons.length; li++) {
    const lesson = lessons[li];
    const steps = lesson.content?.steps || [];
    for (let si = 0; si < steps.length; si++) {
      const step = steps[si];
      if (step.type === 'text' || step.type === 'key_insight') {
        if (need(step.content, step.content_en)) {
          fields.push({
            path: `lesson[${li}].step[${si}].content`,
            cz: step.content,
            set: (en) => { step.content_en = en; },
          });
        }
      } else if (step.type === 'scenario' || step.type === 'quiz') {
        if (step.type === 'scenario' && need(step.situation, step.situation_en)) {
          fields.push({
            path: `lesson[${li}].step[${si}].situation`,
            cz: step.situation,
            set: (en) => { step.situation_en = en; },
          });
        }
        if (need(step.question, step.question_en)) {
          fields.push({
            path: `lesson[${li}].step[${si}].question`,
            cz: step.question,
            set: (en) => { step.question_en = en; },
          });
        }
        const opts = step.options || [];
        for (let oi = 0; oi < opts.length; oi++) {
          const opt = opts[oi];
          if (need(opt.text, opt.text_en)) {
            fields.push({
              path: `lesson[${li}].step[${si}].options[${oi}].text`,
              cz: opt.text,
              set: (en) => { opt.text_en = en; },
            });
          }
          if (need(opt.explanation, opt.explanation_en)) {
            fields.push({
              path: `lesson[${li}].step[${si}].options[${oi}].explanation`,
              cz: opt.explanation,
              set: (en) => { opt.explanation_en = en; },
            });
          }
        }
      }
    }
  }
  return fields;
}

// ─── Track/course ─────────────────────────────────────────────────────────

function collectMissingForTrackCourse(obj) {
  const fields = [];
  if ((obj.title || '') && (FORCE || !obj.title_en)) {
    fields.push({ path: 'title', cz: obj.title, set: (en) => { obj.title_en = en; } });
  }
  if ((obj.subtitle || '') && (FORCE || !obj.subtitle_en)) {
    fields.push({ path: 'subtitle', cz: obj.subtitle, set: (en) => { obj.subtitle_en = en; } });
  }
  return fields;
}

// ─── Token estimation (rough) ─────────────────────────────────────────────
function estimateTokens(text) {
  // Very rough: 1 token ≈ 4 chars for Czech. We use this for cost reporting.
  return Math.ceil(text.length / 4);
}

// ─── Per-model translation ────────────────────────────────────────────────

async function translateModelFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const { model, lessons } = parseModelMarkdown(text);
  const fields = collectMissingFields(model, lessons);

  if (fields.length === 0) {
    return { skipped: true, reason: 'all fields already translated' };
  }

  const inputItems = fields.map((f) => f.cz);
  const inputTokens = inputItems.reduce((sum, s) => sum + estimateTokens(s), 0);

  if (DRY) {
    return { skipped: false, dryRun: true, count: fields.length, inputTokens };
  }

  const translated = await callClaude(inputItems);
  for (let i = 0; i < fields.length; i++) {
    fields[i].set(translated[i]);
  }

  // Re-render markdown — note: for top-level model body sections we render via
  // renderModelMarkdown which now emits `### EN` blocks. For lesson steps we
  // already attached _en to the step objects so render picks them up.
  const newMd = renderModelMarkdown(model, lessons);
  fs.writeFileSync(filePath, newMd);

  return { skipped: false, count: fields.length, inputTokens };
}

async function translateTrackOrCourseFile(filePath, type) {
  const text = fs.readFileSync(filePath, 'utf8');
  const obj = type === 'track' ? parseTrackMarkdown(text) : parseCourseMarkdown(text);
  const fields = collectMissingForTrackCourse(obj);

  if (fields.length === 0) {
    return { skipped: true, reason: 'no missing fields' };
  }

  if (DRY) {
    return { skipped: false, dryRun: true, count: fields.length };
  }

  const translated = await callClaude(fields.map((f) => f.cz));
  for (let i = 0; i < fields.length; i++) fields[i].set(translated[i]);

  // For tracks/courses we need to preserve existing body content (course list)
  // We'll surgically update the frontmatter only.
  const newFm = serializeFrontmatter({
    id: obj.id,
    type,
    title: obj.title,
    ...(obj.title_en ? { title_en: obj.title_en } : {}),
    subtitle: obj.subtitle,
    ...(obj.subtitle_en ? { subtitle_en: obj.subtitle_en } : {}),
    icon: obj.icon_name,
    color: obj.color,
    order: obj.order,
    ...(type === 'track'
      ? { courseIds: obj.courseIds }
      : { trackId: obj.trackId || null, modelIds: obj.nodes.map((n) => n.modelId) }),
  });
  // Replace just the frontmatter at the top of the file
  const updated = text.replace(/^---\n[\s\S]*?\n---\n?/, newFm + '\n');
  fs.writeFileSync(filePath, updated);

  return { skipped: false, count: fields.length };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Wiki: ${WIKI_DIR}`);
  console.log(`Claude model: ${CLAUDE_MODEL}`);
  console.log(`Mode: ${DRY ? 'DRY-RUN' : 'LIVE'}${FORCE ? ' (force re-translate)' : ''}`);
  console.log('');

  // Collect target model files
  let targetModelFiles = allMd.filter(
    (f) =>
      path.basename(f) !== '_track.md' &&
      path.basename(f) !== '_course.md' &&
      !path.basename(f).startsWith('README') &&
      !path.basename(f).startsWith('ARCHITECTURE')
  );

  if (ONLY_MODEL) {
    targetModelFiles = targetModelFiles.filter(
      (f) => path.basename(f, '.md') === ONLY_MODEL
    );
    if (targetModelFiles.length === 0) {
      console.error(`No model file found for id: ${ONLY_MODEL}`);
      process.exit(1);
    }
  }

  let processed = 0;
  let totalFields = 0;
  let totalTokensIn = 0;

  if (TRACKS_COURSES && !ONLY_MODEL) {
    console.log(`─── Tracks (${trackFiles.length}) ───`);
    for (const f of trackFiles) {
      try {
        const r = await translateTrackOrCourseFile(f, 'track');
        const rel = path.relative(WIKI_DIR, f);
        if (r.skipped) console.log(`  · ${rel} — skipped (${r.reason})`);
        else console.log(`  ${DRY ? '~' : '✓'} ${rel} (${r.count} fields)`);
        if (!r.skipped) totalFields += r.count;
      } catch (e) {
        console.error(`  ✗ ${f}: ${e.message}`);
      }
    }
    console.log(`─── Courses (${courseFiles.length}) ───`);
    for (const f of courseFiles) {
      try {
        const r = await translateTrackOrCourseFile(f, 'course');
        const rel = path.relative(WIKI_DIR, f);
        if (r.skipped) console.log(`  · ${rel} — skipped (${r.reason})`);
        else console.log(`  ${DRY ? '~' : '✓'} ${rel} (${r.count} fields)`);
        if (!r.skipped) totalFields += r.count;
      } catch (e) {
        console.error(`  ✗ ${f}: ${e.message}`);
      }
    }
    console.log('');
  }

  console.log(`─── Models (${targetModelFiles.length}, limit ${LIMIT === Infinity ? 'none' : LIMIT}) ───`);
  for (const f of targetModelFiles) {
    if (processed >= LIMIT) break;
    const rel = path.relative(WIKI_DIR, f);
    try {
      const r = await translateModelFile(f);
      if (r.skipped) {
        console.log(`  · ${rel} — skipped (${r.reason})`);
      } else {
        console.log(
          `  ${DRY ? '~' : '✓'} ${rel} (${r.count} fields, ~${r.inputTokens} input tokens)`
        );
        totalFields += r.count;
        totalTokensIn += r.inputTokens;
        processed++;
      }
    } catch (e) {
      console.error(`  ✗ ${rel}: ${e.message}`);
      // Continue with next file — don't abort the whole batch
    }
  }

  console.log('');
  console.log(`Done. ${processed} model(s) translated, ${totalFields} field(s) total.`);
  if (DRY) {
    console.log(`Estimated input tokens: ~${totalTokensIn} (output usually 1.0–1.3× input)`);
    console.log(`Run without --dry to actually translate.`);
  } else {
    console.log(`Total input tokens: ~${totalTokensIn}`);
    console.log(`Tip: run \`npm run wiki:sync\` next to propagate translations into TS data files.`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
