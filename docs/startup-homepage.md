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

## Startup HPC project group

The fourth project panel groups two in-progress UWaterloo High Performance
Computing projects. It records the Core Developer role in Waterloo, ON, and the
University of Waterloo design team's Citadel & Jane Street sponsorship.

- XPU: a C++23 interface for CPU and NVIDIA CUDA memory management, math, data
  layouts, and execution. Source: https://github.com/UWHPC/xpu.
- Variational Monte Carlo: a C++ homogeneous electron-gas simulation engine using
  a Slater-Jastrow trial wavefunction and Metropolis sampling. Source:
  https://github.com/UWHPC/variational-monte-carlo.

Both links were checked against the public team repositories. The accompanying
diagrams are explicitly conceptual; they do not represent completed work,
simulation output, or measured performance. Existing project content is retained.
The gallery derives its stops, transfer sequence, and progress width from the
panel count. Native mobile layouts remain content-sized with no gallery pin.

The approved startup PDF SHA256 is
`b95a74b618d5fa26e5177c461121710d2ef6a413cfba157acb2bf3c216525de8`.
Both startup download names contain those exact bytes. The big-tech PDF remains
`453bf82cbe455a3d950520f48a99b3f2ce64df193f734a23a86b43ce17b86086`.
The canonical resume sources and PDFs were read and copied, not edited.

## Verification

Sixteen local browser checks passed across desktop and touch layouts: root URL,
canonical metadata, font/module/CSS loading, SVG mask, navigation, resource return
link and the original /immersive/ route. No asset, runtime or shader errors were
reported. Both final PDFs were rendered and checked for one page, displayed name,
11 wins, intended audience differences and matching site links. Named files and
compatibility copies match the reviewed source hashes. Workspace evidence:
`tmp/immersive-oct22-qa/homepage-check.json`, `audience-resume-check.json` and
`audience-resume-copies.json`.

The subsequent HPC addition passes 38 scoped browser checks: four-project
navigation and reverse scrolling, three desktop sizes including 1100x650,
four touch layouts from 320x568 through landscape, unclipped diagram and copy,
source-link targets, pause/resume, reduced motion, and WebGL fallback. There were
no unexpected runtime or asset errors. Desktop and mobile screenshots were
inspected. Evidence: `tmp/immersive-oct22-qa/uwhpc-check.json` and
`uwhpc-desktop-*.png` / `uwhpc-mobile-*.png` in the workspace.
