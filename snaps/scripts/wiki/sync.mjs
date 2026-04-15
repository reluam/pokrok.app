// Wiki sync: Obsidian markdown → TS data files.
//
// Reads wiki/, parses every model markdown file (and track/course indexes),
// reconstructs the data model, and regenerates the TS source files in
// data/{tracks,courses}.ts and data/{models,lessons}/*.ts.
//
// Change detection: hashes each markdown file and compares against
// wiki/.sync-state.json (written by export.mjs and updated here). Files with
// unchanged hashes are still parsed (we always rebuild the full data set), but
// the report tells you which files actually changed since last sync.
//
// Safety:
//   - Validates references (every course modelId resolves to a model, etc.).
//   - In dry-run mode (--dry), prints what would change without writing.
//   - Strips Obsidian comments (%% ... %%) so private notes don't leak into TS.

import fs from 'node:fs';
import path from 'node:path';
import {
  loadAllData,
  WIKI_DIR,
  DATA_DIR,
  STATE_PATH,
  hash,
  parseModelMarkdown,
  parseTrackMarkdown,
  parseCourseMarkdown,
  writeModelsFile,
  writeLessonsFile,
  writeTracksFile,
  writeCoursesFile,
} from './lib.mjs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { files: {} };
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { files: {} };
  }
}

function relWiki(p) {
  return path.relative(WIKI_DIR, p);
}

function main() {
  if (!fs.existsSync(WIKI_DIR)) {
    console.error(`No wiki/ directory found. Run \`npm run wiki:export\` first.`);
    process.exit(1);
  }

  const prevState = loadState();
  const newState = { files: {}, generatedAt: new Date().toISOString() };

  const allFiles = walk(WIKI_DIR).filter(
    (f) => !path.basename(f).startsWith('README') && !path.basename(f).startsWith('ARCHITECTURE')
  );

  // Categorize files
  const trackFiles = [];
  const courseFiles = [];
  const modelFiles = [];
  for (const f of allFiles) {
    const base = path.basename(f);
    if (base === '_track.md') trackFiles.push(f);
    else if (base === '_course.md') courseFiles.push(f);
    else modelFiles.push(f);
  }

  // Detect changes
  const changed = [];
  const added = [];
  const removed = [];
  for (const f of allFiles) {
    const text = fs.readFileSync(f, 'utf8');
    const h = hash(text);
    const rel = relWiki(f);
    newState.files[rel] = h;
    if (!(rel in prevState.files)) added.push(rel);
    else if (prevState.files[rel] !== h) changed.push(rel);
  }
  for (const rel of Object.keys(prevState.files)) {
    if (!(rel in newState.files)) removed.push(rel);
  }

  console.log(`Wiki status:`);
  console.log(`  Tracks:  ${trackFiles.length}`);
  console.log(`  Courses: ${courseFiles.length}`);
  console.log(`  Models:  ${modelFiles.length}`);
  console.log(`  Changed: ${changed.length}, added: ${added.length}, removed: ${removed.length}`);
  if (VERBOSE || changed.length + added.length + removed.length <= 20) {
    for (const r of changed) console.log(`  ~ ${r}`);
    for (const r of added) console.log(`  + ${r}`);
    for (const r of removed) console.log(`  - ${r}`);
  }

  if (changed.length === 0 && added.length === 0 && removed.length === 0) {
    console.log(`\n✓ No changes detected. Nothing to do.`);
    return;
  }

  // Parse everything (we always rebuild full TS data set)
  console.log(`\nParsing markdown files...`);
  const tracks = trackFiles.map((f) => {
    try {
      return parseTrackMarkdown(fs.readFileSync(f, 'utf8'));
    } catch (e) {
      throw new Error(`Failed to parse track ${relWiki(f)}: ${e.message}`);
    }
  });
  const courses = courseFiles.map((f) => {
    try {
      return parseCourseMarkdown(fs.readFileSync(f, 'utf8'));
    } catch (e) {
      throw new Error(`Failed to parse course ${relWiki(f)}: ${e.message}`);
    }
  });

  const allModels = [];
  const allLessons = [];
  const modelToFile = {}; // modelId → wiki file path (for grouping back to TS files)
  for (const f of modelFiles) {
    try {
      const { model, lessons } = parseModelMarkdown(fs.readFileSync(f, 'utf8'));
      allModels.push(model);
      for (const l of lessons) allLessons.push(l);
      modelToFile[model.id] = f;
    } catch (e) {
      throw new Error(`Failed to parse model ${relWiki(f)}: ${e.message}`);
    }
  }

  // Validate
  const modelIds = new Set(allModels.map((m) => m.id));
  const errors = [];
  for (const c of courses) {
    for (const node of c.nodes) {
      if (!modelIds.has(node.modelId)) {
        errors.push(`Course ${c.id} references unknown model: ${node.modelId}`);
      }
    }
  }
  const courseIds = new Set(courses.map((c) => c.id));
  for (const t of tracks) {
    for (const cid of t.courseIds) {
      if (!courseIds.has(cid)) {
        errors.push(`Track ${t.id} references unknown course: ${cid}`);
      }
    }
  }
  if (errors.length > 0) {
    console.error(`\n✗ Validation errors:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  // Sort tracks and courses by order
  tracks.sort((a, b) => a.order - b.order);
  courses.sort((a, b) => a.order - b.order);

  // Map each model back to its original TS source file (preserve grouping)
  const { modelFileMap, lessonFileMap } = loadAllData();

  // Group models by source TS filename
  const modelsByFile = {};
  for (const m of allModels) {
    const file = modelFileMap[m.id] || 'mental-models.ts'; // new models default to mental-models.ts
    if (!modelsByFile[file]) modelsByFile[file] = [];
    modelsByFile[file].push(m);
  }

  // Group lessons by source TS filename (using model's file)
  const lessonsByFile = {};
  for (const l of allLessons) {
    const file = lessonFileMap[l.model_id] || 'mental-model-lessons.ts';
    if (!lessonsByFile[file]) lessonsByFile[file] = [];
    lessonsByFile[file].push(l);
  }

  // Sort lessons within each file by model order then order_index
  for (const file of Object.keys(lessonsByFile)) {
    lessonsByFile[file].sort((a, b) => {
      if (a.model_id !== b.model_id) return a.model_id.localeCompare(b.model_id);
      return a.order_index - b.order_index;
    });
  }

  // Map TS file → exported variable name (read from existing file's first export line)
  const exportNameCache = {};
  function getExportName(filePath) {
    if (exportNameCache[filePath]) return exportNameCache[filePath];
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      const m = text.match(/export\s+const\s+(\w+)\s*:/);
      if (m) {
        exportNameCache[filePath] = m[1];
        return m[1];
      }
    } catch {
      // file doesn't exist yet
    }
    // Derive a default name from filename
    const base = path.basename(filePath, '.ts');
    const camel = base.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return camel;
  }

  console.log(`\nWriting TS files${DRY ? ' (dry-run)' : ''}...`);

  // Write models files
  for (const [file, models] of Object.entries(modelsByFile)) {
    const filePath = path.join(DATA_DIR, 'models', file);
    const exportName = getExportName(filePath);
    if (DRY) {
      console.log(`  models/${file} (${exportName}, ${models.length} models)`);
    } else {
      writeModelsFile(filePath, exportName, models);
      console.log(`  ✓ models/${file} (${models.length} models)`);
    }
  }

  // Write lessons files
  for (const [file, lessons] of Object.entries(lessonsByFile)) {
    const filePath = path.join(DATA_DIR, 'lessons', file);
    const exportName = getExportName(filePath);
    if (DRY) {
      console.log(`  lessons/${file} (${exportName}, ${lessons.length} lessons)`);
    } else {
      writeLessonsFile(filePath, exportName, lessons);
      console.log(`  ✓ lessons/${file} (${lessons.length} lessons)`);
    }
  }

  // Write tracks + courses
  if (DRY) {
    console.log(`  tracks.ts (${tracks.length} tracks)`);
    console.log(`  courses.ts (${courses.length} courses)`);
  } else {
    writeTracksFile(path.join(DATA_DIR, 'tracks.ts'), tracks);
    console.log(`  ✓ tracks.ts (${tracks.length} tracks)`);
    writeCoursesFile(path.join(DATA_DIR, 'courses.ts'), courses);
    console.log(`  ✓ courses.ts (${courses.length} courses)`);
  }

  if (!DRY) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(newState, null, 2));
    console.log(`\n✓ Sync complete. State updated.`);
  } else {
    console.log(`\n(dry-run — no files written)`);
  }
}

main();
