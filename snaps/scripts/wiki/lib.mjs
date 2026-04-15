// Shared helpers for wiki export/sync.
//
// Responsibilities:
//   1. Parse TS data files (data/{models,lessons}/*.ts, data/courses.ts, data/tracks.ts)
//      into plain JS objects WITHOUT any external dependencies. The data files
//      are simple object-literals with a `import type` and `export const ... = [...]`
//      shape, so we strip those two lines and eval the rest.
//   2. Serialize/parse markdown for the Obsidian wiki.
//   3. Serialize JS objects back to TS data files in a stable, deterministic format.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const DATA_DIR = path.join(REPO_ROOT, 'data');
export const WIKI_DIR = path.join(REPO_ROOT, 'wiki');
export const STATE_PATH = path.join(WIKI_DIR, '.sync-state.json');

// ─────────────────────────────────────────────────────────────────────────────
// 1. TS data file loader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads a TS data file and returns its exported array.
 * Works for files shaped like:
 *
 *     import type { Foo } from '@/types';
 *     export const fooName: Foo[] = [ { ... }, ... ];
 *
 * Strips the type-only import + the typed prefix and evals the rest.
 */
export function loadTsArray(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  // Strip type-only imports
  let body = raw.replace(/^\s*import\s+type[^;]+;\s*/gm, '');
  // Replace `export const NAME: Type[] = ` (or `Type =`) with `return `
  body = body.replace(
    /export\s+const\s+\w+\s*(?::\s*[\w\[\]<>,\s]+)?\s*=\s*/,
    'return '
  );
  // The remaining file should end with `];` or similar — wrap in a function and run.
  // Use `new Function` to avoid polluting outer scope.
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(body);
    return fn();
  } catch (err) {
    throw new Error(`Failed to parse ${filePath}: ${err.message}`);
  }
}

export function loadAllData() {
  // Tracks + courses live as a single export per file.
  const tracks = loadTsArray(path.join(DATA_DIR, 'tracks.ts'));
  const courses = loadTsArray(path.join(DATA_DIR, 'courses.ts'));

  // Models split across multiple files
  const modelFiles = fs
    .readdirSync(path.join(DATA_DIR, 'models'))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts');
  const models = [];
  const modelFileMap = {}; // model.id → source filename
  for (const f of modelFiles) {
    const arr = loadTsArray(path.join(DATA_DIR, 'models', f));
    for (const m of arr) {
      models.push(m);
      modelFileMap[m.id] = f;
    }
  }

  // Lessons split across multiple files
  const lessonFiles = fs
    .readdirSync(path.join(DATA_DIR, 'lessons'))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts');
  const lessons = [];
  const lessonFileMap = {}; // model_id → source filename
  for (const f of lessonFiles) {
    const arr = loadTsArray(path.join(DATA_DIR, 'lessons', f));
    for (const l of arr) {
      lessons.push(l);
      // Lessons share a file by model_id; just record the file once
      if (!lessonFileMap[l.model_id]) lessonFileMap[l.model_id] = f;
    }
  }

  return { tracks, courses, models, lessons, modelFileMap, lessonFileMap };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Slugify (for file names)
// ─────────────────────────────────────────────────────────────────────────────

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Tiny YAML frontmatter (only what we emit)
// ─────────────────────────────────────────────────────────────────────────────

function yamlEscape(v) {
  if (v == null) return '';
  const s = String(v);
  // Quote if contains special YAML chars
  if (/^[\s\-?:,\[\]{}#&*!|>'"%@`]/.test(s) || /[:#]/.test(s) || s !== s.trim()) {
    return `'${s.replace(/'/g, "''")}'`;
  }
  return s;
}

export function serializeFrontmatter(obj) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(obj)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) lines.push(`  - ${yamlEscape(item)}`);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${yamlEscape(value)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

export function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };
  const yaml = m[1];
  const body = text.slice(m[0].length);

  const meta = {};
  let currentKey = null;
  let currentArray = null;
  for (const rawLine of yaml.split('\n')) {
    if (!rawLine.trim()) continue;
    if (rawLine.startsWith('  - ')) {
      if (currentArray) currentArray.push(yamlUnescape(rawLine.slice(4).trim()));
      continue;
    }
    const idx = rawLine.indexOf(':');
    if (idx === -1) continue;
    const key = rawLine.slice(0, idx).trim();
    const rest = rawLine.slice(idx + 1).trim();
    currentKey = key;
    currentArray = null;
    if (rest === '') {
      // Array follows
      meta[key] = [];
      currentArray = meta[key];
    } else if (rest === '[]') {
      meta[key] = [];
    } else {
      meta[key] = yamlUnescape(rest);
    }
  }
  return { meta, body };
}

function yamlUnescape(s) {
  if (s.startsWith("'") && s.endsWith("'") && s.length >= 2) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  // Coerce numbers
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (s === 'true') return true;
  if (s === 'false') return false;
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Comment stripping (Obsidian native %% ... %%)
// ─────────────────────────────────────────────────────────────────────────────

export function stripObsidianComments(text) {
  // Remove %% ... %% (single or multi-line). Greedy-safe via lazy match.
  return text.replace(/%%[\s\S]*?%%/g, '').replace(/[ \t]+\n/g, '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TS string serializer (matches existing data style: prefer single quotes)
// ─────────────────────────────────────────────────────────────────────────────

export function serializeTsString(s) {
  if (s == null) return "''";
  const str = String(s);
  // Choose quote style: double if string has ' but not ", else single.
  const hasSingle = str.includes("'");
  const hasDouble = str.includes('"');
  let quote;
  if (hasSingle && !hasDouble) quote = '"';
  else quote = "'";

  let escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n');
  if (quote === "'") escaped = escaped.replace(/'/g, "\\'");
  else escaped = escaped.replace(/"/g, '\\"');
  return quote + escaped + quote;
}

// Pretty TS object printer matching existing data file style.
export function serializeTsValue(value, indent = 0) {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);

  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return serializeTsString(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    // Inline array of primitives if short
    const allPrim = value.every(
      (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
    );
    if (allPrim) {
      const inline = value.map((v) => serializeTsValue(v, 0)).join(', ');
      if (inline.length < 60) return `[${inline}]`;
    }
    const items = value.map((v) => `${padInner}${serializeTsValue(v, indent + 1)}`);
    return `[\n${items.join(',\n')},\n${pad}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    // Inline small objects whose values are all primitives.
    const allPrim = entries.every(
      ([, v]) => v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
    );
    if (allPrim) {
      const inline = entries
        .map(([k, v]) => `${k}: ${serializeTsValue(v, 0)}`)
        .join(', ');
      if (inline.length < 80) return `{ ${inline} }`;
    }
    const lines = entries.map(
      ([k, v]) => `${padInner}${k}: ${serializeTsValue(v, indent + 1)}`
    );
    return `{\n${lines.join(',\n')},\n${pad}}`;
  }

  return JSON.stringify(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Markdown rendering for a model + its lessons
// ─────────────────────────────────────────────────────────────────────────────

const STEP_TYPE_LABEL = {
  lesson_intro: 'Úvod lekce',
  text: 'Text',
  engagement: 'Zamyšlení',
  scenario: 'Scénář',
  key_insight: 'Klíčový poznatek',
  quiz: 'Kvíz',
};

const STEP_TYPE_LABEL_REV = Object.fromEntries(
  Object.entries(STEP_TYPE_LABEL).map(([k, v]) => [v.toLowerCase(), k])
);

const LESSON_TYPE_LABEL = {
  intro: 'Úvod',
  scenario: 'Scénář',
  quiz: 'Kvíz',
  application: 'Aplikace',
  deep_dive: 'Hluboký ponor',
  comparison: 'Srovnání',
};

const LESSON_TYPE_LABEL_REV = Object.fromEntries(
  Object.entries(LESSON_TYPE_LABEL).map(([k, v]) => [v.toLowerCase(), k])
);

// Helpers for option rendering — used by both CZ and EN blocks
function renderOptionsBlock(parts, options, lang) {
  for (const opt of options || []) {
    const text = lang === 'en' ? opt.text_en : opt.text;
    const explanation = lang === 'en' ? opt.explanation_en : opt.explanation;
    if (!text) continue;
    const marker = opt.correct ? '✅' : '❌';
    const display = opt.correct ? `**${marker} ${text}**` : `${marker} ${text}`;
    parts.push(`- ${display}`);
    if (explanation) {
      const lines = explanation.split('\n');
      for (const ln of lines) parts.push(`  ${ln}`);
    }
  }
}

function hasEnOptions(options) {
  return (options || []).some((o) => o.text_en || o.explanation_en);
}

export function renderModelMarkdown(model, lessons) {
  const fm = serializeFrontmatter({
    id: model.id,
    type: 'model',
    slug: model.slug,
    category: model.category,
    difficulty: model.difficulty,
    icon: model.icon_name,
    related: model.related_models || [],
  });

  const parts = [fm, ''];
  parts.push(`# ${model.name_cz}`);
  if (model.name && model.name !== model.name_cz) {
    parts.push(`*EN: ${model.name}*`);
  }
  parts.push('');

  // Helper for model sections with optional EN sub-block
  const section = (title, czField, enField) => {
    parts.push(`## ${title}`);
    parts.push('');
    parts.push(model[czField] || '');
    parts.push('');
    if (model[enField]) {
      parts.push('### EN');
      parts.push('');
      parts.push(model[enField]);
      parts.push('');
    }
  };

  section('Krátký popis', 'short_description', 'short_description_en');
  section('Plné vysvětlení', 'full_explanation', 'full_explanation_en');
  section('Příklad ze života', 'real_world_example', 'real_world_example_en');
  section('Časté chyby', 'common_mistakes', 'common_mistakes_en');

  parts.push('---');
  parts.push('');
  parts.push('# Lekce');
  parts.push('');

  if (!lessons || lessons.length === 0) {
    parts.push('*Žádné lekce zatím nejsou definované.*');
    parts.push('');
  } else {
    const sorted = [...lessons].sort((a, b) => a.order_index - b.order_index);
    for (let i = 0; i < sorted.length; i++) {
      const lesson = sorted[i];
      const typeLabel = LESSON_TYPE_LABEL[lesson.lesson_type] || lesson.lesson_type;
      parts.push(`## Lekce ${i + 1} — ${typeLabel}`);
      parts.push(`*id: \`${lesson.id}\` · typ: ${lesson.lesson_type} · xp: ${lesson.xp_reward}*`);
      parts.push('');
      const steps = lesson.content?.steps || [];
      for (let j = 0; j < steps.length; j++) {
        const step = steps[j];
        const stepLabel = STEP_TYPE_LABEL[step.type] || step.type;
        parts.push(`### ${j + 1}. ${stepLabel}`);
        parts.push('');
        if (step.type === 'lesson_intro') {
          parts.push(`# ${step.title}`);
          if (step.icon) parts.push(`*ikona: ${step.icon}*`);
          parts.push('');
          parts.push(step.description || '');
          parts.push('');
          if (step.title_en || step.description_en) {
            parts.push('#### EN');
            parts.push('');
            parts.push(`# ${step.title_en || step.title}`);
            if (step.icon) parts.push(`*icon: ${step.icon}*`);
            parts.push('');
            parts.push(step.description_en || step.description || '');
            parts.push('');
          }
        } else if (step.type === 'text' || step.type === 'key_insight') {
          parts.push(step.content || '');
          parts.push('');
          if (step.content_en) {
            parts.push('#### EN');
            parts.push('');
            parts.push(step.content_en);
            parts.push('');
          }
        } else if (step.type === 'scenario' || step.type === 'quiz' || step.type === 'engagement') {
          if (step.type === 'scenario' && step.situation) {
            parts.push(`**Situace:** ${step.situation}`);
            parts.push('');
          }
          parts.push(`**Otázka:** ${step.question}`);
          parts.push('');
          renderOptionsBlock(parts, step.options, 'cs');
          parts.push('');

          // Optional EN block — emitted if any EN field present
          const hasEn =
            (step.type === 'scenario' && step.situation_en) ||
            step.question_en ||
            hasEnOptions(step.options);
          if (hasEn) {
            parts.push('#### EN');
            parts.push('');
            if (step.type === 'scenario' && step.situation_en) {
              parts.push(`**Situation:** ${step.situation_en}`);
              parts.push('');
            }
            if (step.question_en) {
              parts.push(`**Question:** ${step.question_en}`);
              parts.push('');
            }
            renderOptionsBlock(parts, step.options, 'en');
            parts.push('');
          }
        }
      }
    }
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Markdown parsing → model + lessons
// ─────────────────────────────────────────────────────────────────────────────

export function parseModelMarkdown(text) {
  const stripped = stripObsidianComments(text);
  const { meta, body } = parseFrontmatter(stripped);

  if (meta.type !== 'model') {
    throw new Error(`Expected type: model in frontmatter, got: ${meta.type}`);
  }

  // Split body into "model body" and "lessons" at the `# Lekce` heading
  const lessonsIdx = body.search(/^# Lekce\s*$/m);
  let modelBody = lessonsIdx === -1 ? body : body.slice(0, lessonsIdx);
  const lessonsBody = lessonsIdx === -1 ? '' : body.slice(lessonsIdx);

  // Strip standalone `---` separator lines (Obsidian visual separators) from
  // the model body before parsing sections — they're cosmetic, not data.
  modelBody = modelBody.replace(/^---\s*$/gm, '');

  // Parse model body — sections separated by ## headings
  const sections = parseSections(modelBody, '## ');

  // Title (h1) and EN name
  const titleMatch = modelBody.match(/^#\s+(.+)$/m);
  const name_cz = titleMatch ? titleMatch[1].trim() : '';
  const enMatch = modelBody.match(/^\*EN:\s*(.+?)\*$/m);
  const name = enMatch ? enMatch[1].trim() : name_cz;

  // Each section may contain a `### EN` sub-block. Extract it.
  const sectionCzEn = (heading) => splitCzEnAtHeading(sections[heading] || '', '### EN');

  const sShort = sectionCzEn('Krátký popis');
  const sFull = sectionCzEn('Plné vysvětlení');
  const sExample = sectionCzEn('Příklad ze života');
  const sMistakes = sectionCzEn('Časté chyby');

  const model = {
    id: meta.id,
    name,
    name_cz,
    slug: meta.slug,
    category: meta.category,
    difficulty: typeof meta.difficulty === 'number' ? meta.difficulty : parseInt(meta.difficulty, 10),
    short_description: sShort.cz,
    full_explanation: sFull.cz,
    real_world_example: sExample.cz,
    common_mistakes: sMistakes.cz,
    related_models: Array.isArray(meta.related) ? meta.related : [],
    icon_name: meta.icon || '',
    created_at: meta.created_at || '2024-01-01T00:00:00Z',
  };
  if (sShort.en) model.short_description_en = sShort.en;
  if (sFull.en) model.full_explanation_en = sFull.en;
  if (sExample.en) model.real_world_example_en = sExample.en;
  if (sMistakes.en) model.common_mistakes_en = sMistakes.en;

  // Parse lessons
  const lessons = parseLessons(lessonsBody, model.id);

  return { model, lessons };
}

// Split a section's content at a given EN sub-heading marker (e.g. `### EN`
// or `#### EN`). Returns { cz, en } trimmed.
function splitCzEnAtHeading(content, marker) {
  const re = new RegExp(`^${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  const m = content.match(re);
  if (!m) return { cz: content.trim(), en: '' };
  const idx = content.indexOf(m[0]);
  const cz = content.slice(0, idx).trim();
  const en = content.slice(idx + m[0].length).trim();
  return { cz, en };
}

function parseSections(text, headingPrefix) {
  // Split text by headings of given prefix; return { heading: content }
  const lines = text.split('\n');
  const out = {};
  let curHeading = null;
  let curLines = [];
  const flush = () => {
    if (curHeading != null) out[curHeading] = curLines.join('\n').trim();
    curLines = [];
  };
  for (const line of lines) {
    if (line.startsWith(headingPrefix) && !line.startsWith(headingPrefix + '#')) {
      flush();
      curHeading = line.slice(headingPrefix.length).trim();
    } else {
      curLines.push(line);
    }
  }
  flush();
  return out;
}

function parseLessons(text, modelId) {
  // Split by `## Lekce N — ...` headings
  const lessonBlocks = [];
  const lines = text.split('\n');
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^##\s+Lekce\s+\d+\s*[—\-–]\s*(.+)$/);
    if (m) {
      if (cur) lessonBlocks.push(cur);
      cur = { typeLabel: m[1].trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) lessonBlocks.push(cur);

  const lessons = [];
  for (let i = 0; i < lessonBlocks.length; i++) {
    const block = lessonBlocks[i];
    const blockText = block.lines.join('\n');

    // Metadata line: *id: `xxx` · typ: intro · xp: 10*
    const metaMatch = blockText.match(/^\*id:\s*`([^`]+)`\s*·\s*typ:\s*(\w+)\s*·\s*xp:\s*(\d+)\*$/m);
    if (!metaMatch) {
      throw new Error(`Lesson ${i + 1} missing metadata line in model ${modelId}`);
    }
    const lessonId = metaMatch[1];
    const lessonType = metaMatch[2];
    const xp = parseInt(metaMatch[3], 10);

    // Strip the metadata line, then parse steps
    const afterMeta = blockText.slice(blockText.indexOf(metaMatch[0]) + metaMatch[0].length);
    const steps = parseSteps(afterMeta, lessonId);

    lessons.push({
      id: lessonId,
      model_id: modelId,
      lesson_type: lessonType,
      order_index: i,
      xp_reward: xp,
      content: { steps },
    });
  }
  return lessons;
}

function parseSteps(text, lessonId) {
  // Split by `### N. Type` headings
  const stepBlocks = [];
  const lines = text.split('\n');
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^###\s+\d+\.\s+(.+)$/);
    if (m) {
      if (cur) stepBlocks.push(cur);
      cur = { typeLabel: m[1].trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) stepBlocks.push(cur);

  const steps = [];
  for (const block of stepBlocks) {
    const stepType = STEP_TYPE_LABEL_REV[block.typeLabel.toLowerCase()] || block.typeLabel.toLowerCase();
    const blockText = block.lines.join('\n').trim();

    // Each step body may contain a `#### EN` sub-block.
    const { cz: czBlock, en: enBlock } = splitCzEnAtHeading(blockText, '#### EN');

    if (stepType === 'lesson_intro') {
      const cz = parseLessonIntro(czBlock);
      const step = { type: 'lesson_intro', title: cz.title, description: cz.description };
      if (cz.icon) step.icon = cz.icon;
      if (enBlock) {
        const en = parseLessonIntro(enBlock);
        if (en.title) step.title_en = en.title;
        if (en.description) step.description_en = en.description;
      }
      steps.push(step);
    } else if (stepType === 'text' || stepType === 'key_insight') {
      const step = { type: stepType, content: czBlock };
      if (enBlock) step.content_en = enBlock;
      steps.push(step);
    } else if (stepType === 'scenario' || stepType === 'quiz' || stepType === 'engagement') {
      const step = parseScenarioBlock(czBlock, stepType, lessonId);
      if (enBlock) {
        const enFields = parseScenarioFields(enBlock, lessonId, /*requireQuestion*/ false);
        if (enFields.situation) step.situation_en = enFields.situation;
        if (enFields.question) step.question_en = enFields.question;
        // Pair options by index — if EN has same count, attach
        if (enFields.options.length === step.options.length) {
          for (let i = 0; i < step.options.length; i++) {
            if (enFields.options[i].text) step.options[i].text_en = enFields.options[i].text;
            if (enFields.options[i].explanation) step.options[i].explanation_en = enFields.options[i].explanation;
          }
        } else if (enFields.options.length > 0) {
          throw new Error(
            `Lesson ${lessonId} step "${block.typeLabel}": EN block has ${enFields.options.length} options, CZ has ${step.options.length}`
          );
        }
      }
      steps.push(step);
    } else {
      throw new Error(`Unknown step type "${block.typeLabel}" in lesson ${lessonId}`);
    }
  }
  return steps;
}

// Parse the structured fields out of a scenario/quiz block (works for both CZ
// and EN blocks). Markers accept either Czech (Situace/Otázka) or English
// (Situation/Question) names.
function parseScenarioFields(text, lessonId, requireQuestion) {
  let situation = '';
  let question = '';

  const sitMatch = text.match(/\*\*(?:Situace|Situation):\*\*\s*([\s\S]*?)(?=\n\*\*(?:Otázka|Question):|$)/);
  if (sitMatch) situation = sitMatch[1].trim();

  const qMatch = text.match(/\*\*(?:Otázka|Question):\*\*\s*([\s\S]*?)(?=\n-\s|$)/);
  if (qMatch) question = qMatch[1].trim();
  if (requireQuestion && !question) {
    throw new Error(`Missing **Otázka:**/**Question:** in step of lesson ${lessonId}`);
  }

  // Parse options: each starts with `- ` line containing ✅/❌
  const options = [];
  const optLines = text.split('\n');
  let curOpt = null;
  for (const line of optLines) {
    const optMatch = line.match(/^-\s+(.*)$/);
    if (optMatch) {
      if (curOpt) options.push(curOpt);
      let body = optMatch[1].trim();
      body = body.replace(/^\*\*(.+)\*\*$/, '$1').trim();
      const correct = body.startsWith('✅');
      const wrong = body.startsWith('❌');
      if (!correct && !wrong) {
        curOpt = null;
        continue;
      }
      const optText = body.slice(1).trim();
      curOpt = { text: optText, correct, explanation: '' };
    } else if (curOpt && line.startsWith('  ')) {
      const ln = line.slice(2);
      curOpt.explanation = curOpt.explanation
        ? curOpt.explanation + '\n' + ln
        : ln;
    }
  }
  if (curOpt) options.push(curOpt);
  for (const o of options) o.explanation = (o.explanation || '').trim();

  return { situation, question, options };
}

// Parse a lesson_intro block: extract H1 title, optional `*ikona: X*` line,
// and the rest as description.
function parseLessonIntro(text) {
  const lines = text.split('\n');
  let title = '';
  let icon = '';
  const descLines = [];
  for (const line of lines) {
    const titleMatch = line.match(/^#\s+(.+)$/);
    if (titleMatch && !title) {
      title = titleMatch[1].trim();
      continue;
    }
    const iconMatch = line.match(/^\*(?:ikona|icon):\s*(.+?)\*$/);
    if (iconMatch) {
      icon = iconMatch[1].trim();
      continue;
    }
    descLines.push(line);
  }
  const description = descLines.join('\n').trim();
  return { title, icon, description };
}

function parseScenarioBlock(text, stepType, lessonId) {
  const { situation, question, options } = parseScenarioFields(text, lessonId, true);
  if (stepType === 'scenario') {
    return { type: 'scenario', situation, question, options };
  } else if (stepType === 'engagement') {
    return { type: 'engagement', question, options };
  } else {
    // Quiz steps may optionally have a situation framing.
    const step = { type: 'quiz', question, options };
    if (situation) step.situation = situation;
    return step;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Track + Course markdown
// ─────────────────────────────────────────────────────────────────────────────

export function renderTrackMarkdown(track, courses, modelsByCourseId) {
  const fmObj = {
    id: track.id,
    type: 'track',
    title: track.title,
    ...(track.title_en ? { title_en: track.title_en } : {}),
    subtitle: track.subtitle,
    ...(track.subtitle_en ? { subtitle_en: track.subtitle_en } : {}),
    icon: track.icon_name,
    color: track.color,
    order: track.order,
    courseIds: track.courseIds,
  };
  const fm = serializeFrontmatter(fmObj);
  const parts = [fm, ''];
  parts.push(`# ${track.title}`);
  if (track.title_en) parts.push(`*EN: ${track.title_en}*`);
  parts.push('');
  parts.push(`> ${track.subtitle}`);
  if (track.subtitle_en) parts.push(`> EN: ${track.subtitle_en}`);
  parts.push('');
  parts.push('## Kurzy');
  parts.push('');
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    parts.push(`${i + 1}. **${c.title}** — ${c.subtitle}`);
    const models = modelsByCourseId[c.id] || [];
    for (const m of models) {
      parts.push(`   - [[${m.id}|${m.name_cz}]]`);
    }
  }
  parts.push('');
  return parts.join('\n');
}

export function renderCourseMarkdown(course, models) {
  const fmObj = {
    id: course.id,
    type: 'course',
    title: course.title,
    ...(course.title_en ? { title_en: course.title_en } : {}),
    subtitle: course.subtitle,
    ...(course.subtitle_en ? { subtitle_en: course.subtitle_en } : {}),
    icon: course.icon_name,
    color: course.color,
    order: course.order,
    trackId: course.trackId || null,
    modelIds: course.nodes.map((n) => n.modelId),
  };
  const fm = serializeFrontmatter(fmObj);
  const parts = [fm, ''];
  parts.push(`# ${course.title}`);
  if (course.title_en) parts.push(`*EN: ${course.title_en}*`);
  parts.push('');
  parts.push(`> ${course.subtitle}`);
  if (course.subtitle_en) parts.push(`> EN: ${course.subtitle_en}`);
  parts.push('');
  parts.push('## Modely');
  parts.push('');
  for (let i = 0; i < models.length; i++) {
    const m = models[i];
    parts.push(`${i + 1}. [[${m.id}|${m.name_cz}]] — ${m.short_description}`);
  }
  parts.push('');
  return parts.join('\n');
}

export function parseTrackMarkdown(text) {
  const { meta } = parseFrontmatter(stripObsidianComments(text));
  if (meta.type !== 'track') throw new Error('Not a track file');
  const out = {
    id: meta.id,
    title: meta.title,
    subtitle: meta.subtitle,
    icon_name: meta.icon,
    color: meta.color,
    order: typeof meta.order === 'number' ? meta.order : parseInt(meta.order, 10),
    courseIds: Array.isArray(meta.courseIds) ? meta.courseIds : [],
  };
  if (meta.title_en) out.title_en = meta.title_en;
  if (meta.subtitle_en) out.subtitle_en = meta.subtitle_en;
  return out;
}

export function parseCourseMarkdown(text) {
  const { meta } = parseFrontmatter(stripObsidianComments(text));
  if (meta.type !== 'course') throw new Error('Not a course file');
  const modelIds = Array.isArray(meta.modelIds) ? meta.modelIds : [];
  const out = {
    id: meta.id,
    title: meta.title,
    subtitle: meta.subtitle,
    icon_name: meta.icon,
    color: meta.color,
    order: typeof meta.order === 'number' ? meta.order : parseInt(meta.order, 10),
    trackId: meta.trackId || undefined,
    nodes: modelIds.map((modelId, i) => ({ modelId, order: i })),
  };
  if (meta.title_en) out.title_en = meta.title_en;
  if (meta.subtitle_en) out.subtitle_en = meta.subtitle_en;
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. TS file writer (regenerate data files from objects)
// ─────────────────────────────────────────────────────────────────────────────

export function writeModelsFile(filePath, exportName, models) {
  const lines = [
    `import type { MentalModel } from '@/types';`,
    '',
    `export const ${exportName}: MentalModel[] = ${serializeTsValue(models, 0)};`,
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'));
}

export function writeLessonsFile(filePath, exportName, lessons) {
  const lines = [
    `import type { Lesson } from '@/types';`,
    '',
    `export const ${exportName}: Lesson[] = ${serializeTsValue(lessons, 0)};`,
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'));
}

export function writeTracksFile(filePath, tracks) {
  const lines = [
    `import type { Track } from '@/types';`,
    '',
    `export const tracks: Track[] = ${serializeTsValue(tracks, 0)};`,
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'));
}

export function writeCoursesFile(filePath, courses) {
  const lines = [
    `import type { Course } from '@/types';`,
    '',
    `export const courses: Course[] = ${serializeTsValue(courses, 0)};`,
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'));
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Hashing for sync state
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'node:crypto';
export function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}
