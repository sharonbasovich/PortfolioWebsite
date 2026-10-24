# Startup homepage and audience-specific resume downloads

The accepted startup site is the homepage at https://basovichsharon.vercel.app/.
There is one document and one experience. The former /immersive/ page permanently
redirects to the root, preserving existing bookmarks. The clean big-tech website
remains https://sharonbasovich.vercel.app/.

## Single editable source and static hosting

Edit `dist/startup/index.html` directly. Modules, styles, project assets, fonts,
and license notices are under `dist/startup/experience/`; vendor libraries remain
under `dist/startup/vendor/`. The experience directory has no HTML page. Homepage
fragments and SVG masks remain local to the root document. Do not restore a
duplicate page or run the repository's Next.js build, which overwrites dist.

The old `build-homepage.mjs` generator has been removed. Both Vercel configurations
serve static output with an empty build command. The startup project serves
`dist/startup`; the big-tech project continues to serve `dist`. Start local review
with `python tools/motion-lab.py` and open `http://127.0.0.1:8789/`. Its optional
review fixtures remain local and are not shipped as page assets.

The sole credits page is `/resources.html`, with valid font, module, and license
links. Legacy `/immersive/resources.html` redirects there; former asset URLs
redirect to `/experience/:path*`. Equivalent `/startup/immersive` rules in the
big-tech output preserve old nested bookmarks without changing its homepage.

## Resume mapping

- Big tech: dist/Sharon_Basovich_Resume.pdf. Eigenvale retained.
- Startups: dist/startup/Basovich_Sharon_Resume.pdf. Eigenvale omitted and
  UWaterloo High Performance Computing included as in-progress work.

Visible download links use these explicit filenames. Each directory's existing
resume.pdf URL remains a compatibility copy of the matching audience's file.
The canonical LaTeX sources and reviewed PDFs live outside this repository and
are maintained by the resume workflow; do not edit them during website sync.
The current win count is 11 on both sites. Historical dated notes are unchanged.

## Resume-matched projects

The cards and their selection menu follow Sharon's latest requested order:
Lions Robotics, Marble Investments, UW HPC, SkyCell. The résumé bullet content
is unchanged; the gallery order was explicitly changed on October 24.
The HPC menu label is abbreviated and its heading is UW HPC, as requested on
October 24. Each front has a short italic summary, skills, source/demo links,
and a View more control. The top-right metadata is time and location. Marble
links to its website. Summaries use Sharon's supplied October 24 wording.
The templates contain the three active résumé bullets verbatim, with LaTeX
formatting converted to ordinary Unicode text. The unrelated drawing robot and
its photographs are removed. Lions Robotics uses the four-robots-and-trophies
photograph recovered from the earlier portfolio. Its software source remains
https://github.com/sharonbasovich/828555Sworlds.

One native dialog displays the matching résumé bullets with keyboard focus,
Escape/backdrop dismissal, focus restoration, bounded small-screen scrolling,
and page-scroll locking. Opening details does not resize the gallery. Sharon
selected option 2, the side sheet, on October 24. Its directional wipe and bullet
cascade are the default. Alternate treatments and comparison controls are removed.
Reduced motion and pause use an immediate state. No new renderer or ticker.
The shared project link is positioned so its animated underline stays within its
own bounds on cards and inside the dialog, including keyboard focus/click.

The accepted photo-through-type project heading follows the first project's
Lions Robotics trophy photograph into its gallery frame. The other images are
the official Marble/UW HPC logos and Sharon's supplied SkyCell launch photograph
(cropped using CSS). The new Robotics photograph is fully contained and uses a
3:2 phone frame, preserving all four robots and trophies. The requested Marble
black background was deferred; its existing light backdrop remains. There are no
image captions. Original
asset bytes are retained; sources/hashes are in the project-evidence provenance.
Evidence selection is keyed by project, independent of carousel position.

## Startup HPC project group

The third project panel groups two in-progress UWaterloo High Performance
Computing projects. Its detail bullets retain the University of Waterloo design
team's Citadel & Jane Street sponsorship and both works in progress.

- XPU: a C++23 interface for CPU and NVIDIA CUDA memory management, math, data
  layouts, and execution. Source: https://github.com/UWHPC/xpu.
- Variational Monte Carlo: a C++ homogeneous electron-gas simulation engine using
  a Slater-Jastrow trial wavefunction and Metropolis sampling. Source:
  https://github.com/UWHPC/variational-monte-carlo.

Both links were checked against the public team repositories.
The gallery derives its stops, transfer sequence, and progress width from the
panel count. Native mobile layouts remain content-sized with no gallery pin.

The approved startup PDF SHA256 is
`b95a74b618d5fa26e5177c461121710d2ef6a413cfba157acb2bf3c216525de8`.
Both startup download names contain those exact bytes. The big-tech PDF remains
`453bf82cbe455a3d950520f48a99b3f2ce64df193f734a23a86b43ce17b86086`.
The canonical resume sources and PDFs were read and copied, not edited.

## Verification

Latest October 24 photo/order update: 22 focused desktop/touch checks pass for
Lions-first navigation, the new first-photo handoff, unchanged bullet templates,
full 1200x800 trophy image, detail selection and preserved Marble backdrop. Card
contents were also compared by project key with the previous Git revision after
normalizing only sequence numbers and line endings. Evidence: workspace
`tmp/immersive-oct22-qa/robotics-first-check.json`, `robotics-first-content.json`,
and `robotics-first-desktop/native.png` / `robotics-trophies-iab.png`.

October 24 update: 159 scoped browser checks pass across 1280x720 and 1100x650
desktops and 320x568, 393x851, 430x932, and 851x393 touch layouts. This covers
the four supplied summaries, time/location metadata, exact twelve résumé bullets,
four image sources with no captions, selected side-sheet opening/closing, focus
and scroll restoration, reduced motion, and link-bounded underlines under hover,
keyboard focus and intercepted clicks. Official logo originals and the supplied
photo were hash-checked; the photo is unchanged and cropped only in CSS. In-app
desktop and device screenshots were inspected. No runtime, asset or shader errors.
Evidence: workspace `tmp/immersive-oct22-qa/project-brand-check.json`,
`brand-card-*.png`, `brand-iab-*.png`, and `brand-mobile-*.png`.

Earlier October 23 checkpoint:

Consolidation/project verification: 108 primary browser checks plus 28 final
evidence/resize checks pass. Coverage includes 1280x720 and 1100x650 desktops;
320x568, 393x851, 430x932, 768x1024, and 851x393 touch layouts; exact titles,
order and all twelve résumé bullets; all three changing animation treatments;
interrupt/close, focus restoration/trap, background scroll lock through resize,
source links, pause/reduced-motion states, and unclipped image/caption geometry.
The in-app browser was used for desktop interaction review; the separate test
browser supplied device sizes unavailable in its controls. Screenshots were
inspected. Five legacy redirect cases and both pages' local references pass.
Evidence: workspace `tmp/immersive-oct22-qa/project-cards-check.json`,
`project-fit-final.json`, `project-card-*.png`, `project-details-*.png`.
At that checkpoint the three treatments were comparison previews. Sharon selected
the side sheet on October 24; the unused alternatives have since been removed.

Earlier verification history:

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
