// Wiki export: TS data → Obsidian-friendly markdown vault.
//
// Reads data/{tracks,courses}.ts + data/models/*.ts + data/lessons/*.ts and
// writes a structured wiki/ directory:
//
//   wiki/
//     README.md                            (Karpathy-style index)
//     ARCHITECTURE.md                      (lesson rendering & interactions)
//     <NN>-<track-id>/
//       _track.md
//       <NN>-<course-id>/
//         _course.md
//         <model-id>.md                    (model + all its lessons)
//
// This is a regeneration tool — it OVERWRITES the wiki/ directory (except for
// README.md and ARCHITECTURE.md, which are hand-edited).
//
// Note: this is an idempotent rebuild. The user's edits live in the markdown
// files; sync.mjs writes them back to TS. If the wiki gets out of sync (e.g.
// you edited TS directly), re-run export to refresh from TS.

import fs from 'node:fs';
import path from 'node:path';
import {
  loadAllData,
  WIKI_DIR,
  STATE_PATH,
  hash,
  renderModelMarkdown,
  renderTrackMarkdown,
  renderCourseMarkdown,
  slugify,
} from './lib.mjs';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function main() {
  const { tracks, courses, models, lessons } = loadAllData();

  console.log(
    `Loaded: ${tracks.length} tracks, ${courses.length} courses, ${models.length} models, ${lessons.length} lessons`
  );

  // Build lookup maps
  const courseById = Object.fromEntries(courses.map((c) => [c.id, c]));
  const modelById = Object.fromEntries(models.map((m) => [m.id, m]));
  const lessonsByModel = {};
  for (const l of lessons) {
    if (!lessonsByModel[l.model_id]) lessonsByModel[l.model_id] = [];
    lessonsByModel[l.model_id].push(l);
  }

  // Wipe old track folders (keep README, ARCHITECTURE, .sync-state.json)
  if (fs.existsSync(WIKI_DIR)) {
    for (const entry of fs.readdirSync(WIKI_DIR)) {
      if (entry === 'README.md' || entry === 'ARCHITECTURE.md' || entry === '.sync-state.json') continue;
      const p = path.join(WIKI_DIR, entry);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) rmDir(p);
    }
  } else {
    ensureDir(WIKI_DIR);
  }

  const state = { files: {}, generatedAt: new Date().toISOString() };

  // Sort tracks by order
  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);
  for (let ti = 0; ti < sortedTracks.length; ti++) {
    const track = sortedTracks[ti];
    const trackSlug = slugify(track.id.replace(/^track-/, '')) || track.id;
    const trackDir = path.join(WIKI_DIR, `${pad2(ti + 1)}-${trackSlug}`);
    ensureDir(trackDir);

    // Track index
    const trackCourses = track.courseIds.map((id) => courseById[id]).filter(Boolean);
    const modelsByCourseId = {};
    for (const c of trackCourses) {
      modelsByCourseId[c.id] = c.nodes
        .map((n) => modelById[n.modelId])
        .filter(Boolean);
    }
    const trackMd = renderTrackMarkdown(track, trackCourses, modelsByCourseId);
    const trackPath = path.join(trackDir, '_track.md');
    fs.writeFileSync(trackPath, trackMd);
    state.files[path.relative(WIKI_DIR, trackPath)] = hash(trackMd);

    // Each course
    for (let ci = 0; ci < trackCourses.length; ci++) {
      const course = trackCourses[ci];
      const courseSlug = slugify(course.id) || course.id;
      const courseDir = path.join(trackDir, `${pad2(ci + 1)}-${courseSlug}`);
      ensureDir(courseDir);

      const courseModels = modelsByCourseId[course.id] || [];
      const courseMd = renderCourseMarkdown(course, courseModels);
      const coursePath = path.join(courseDir, '_course.md');
      fs.writeFileSync(coursePath, courseMd);
      state.files[path.relative(WIKI_DIR, coursePath)] = hash(courseMd);

      // Each model
      for (const model of courseModels) {
        const modelLessons = lessonsByModel[model.id] || [];
        const md = renderModelMarkdown(model, modelLessons);
        const fname = `${model.id}.md`;
        const fpath = path.join(courseDir, fname);
        fs.writeFileSync(fpath, md);
        state.files[path.relative(WIKI_DIR, fpath)] = hash(md);
      }
    }
  }

  // Models that don't belong to any course (orphans) — put in `_orphans/`
  const referencedModelIds = new Set();
  for (const c of courses) for (const n of c.nodes) referencedModelIds.add(n.modelId);
  const orphans = models.filter((m) => !referencedModelIds.has(m.id));
  if (orphans.length > 0) {
    const orphanDir = path.join(WIKI_DIR, '_orphans');
    ensureDir(orphanDir);
    for (const model of orphans) {
      const md = renderModelMarkdown(model, lessonsByModel[model.id] || []);
      const fpath = path.join(orphanDir, `${model.id}.md`);
      fs.writeFileSync(fpath, md);
      state.files[path.relative(WIKI_DIR, fpath)] = hash(md);
    }
    console.log(`  ${orphans.length} orphaned models written to _orphans/`);
  }

  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  console.log(`✓ Wiki exported to ${WIKI_DIR}`);
  console.log(`  ${Object.keys(state.files).length} markdown files`);
  console.log(`  Sync state saved to ${STATE_PATH}`);
}

main();
