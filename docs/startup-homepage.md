# Startup homepage and audience-specific resume downloads

The accepted immersive site is the homepage at https://basovichsharon.vercel.app/.
The original /immersive/ address remains functional and shares the root canonical
URL. The clean big-tech website remains https://sharonbasovich.vercel.app/.

## Editable source and static generation

Edit dist/startup/immersive/index.html. The dependency-free Node script
`dist/startup/build-homepage.mjs` generates dist/startup/index.html from that
source, rebasing local HTML assets and the Three.js import map. It preserves
fragment links and SVG mask references, so navigation stays on the root page.
CSS and module-relative media continue to use the original immersive assets.
Do not hand-maintain a second homepage or run the repository's Next.js build.

Both Vercel configurations run the generator before serving their static output.
For local static previews, run `node dist/startup/build-homepage.mjs` after source
changes. The script resolves its directory through import.meta.url, so it also
works as `node build-homepage.mjs` from dist/startup. Its output is deterministic.

## Resume mapping

- Big tech: dist/Sharon_Basovich_Resume.pdf. Eigenvale retained.
- Startups: dist/startup/Basovich_Sharon_Resume.pdf. Eigenvale omitted and
  UWaterloo High Performance Computing included as in-progress work.

Visible download links use these explicit filenames. Each directory's existing
resume.pdf URL remains a compatibility copy of the matching audience's file.
The canonical LaTeX sources and reviewed PDFs live outside this repository and
are maintained by the resume workflow; do not edit them during website sync.
The current win count is 11 on both sites. Historical dated notes are unchanged.

## Verification

Sixteen local browser checks passed across desktop and touch layouts: root URL,
canonical metadata, font/module/CSS loading, SVG mask, navigation, resource return
link and the original /immersive/ route. No asset, runtime or shader errors were
reported. Both final PDFs were rendered and checked for one page, displayed name,
11 wins, intended audience differences and matching site links. Named files and
compatibility copies match the reviewed source hashes. Workspace evidence:
`tmp/immersive-oct22-qa/homepage-check.json`, `audience-resume-check.json` and
`audience-resume-copies.json`.
