# Title and gallery motion study — October 24, 2026

This is a reviewable experiment on `codex/title-gallery-motion-preview`, based on
accepted production commit `7578e08`. It is enabled only with `?motion-study=1`.
The unflagged page retains its accepted title/gallery motion. Do not merge or
deploy this branch to the production aliases until Sharon selects the trial.

The title's real DM Sans weight-500 outlines expand into adjoining image-mask
regions, then the finished Robotics photograph docks into the gallery. There is
no independently opening centre rectangle. One stationary SVG gallery viewport
morphs its aperture to each source image's intrinsic ratio; only the existing
right-hand project copy slides. Existing content, side-sheet details, selectors,
keyboard navigation, pause, light/dark controls, and resume downloads are retained.
Touch, reduced motion, short/small viewports and unavailable WebGL use native
vertical cards with source-ratio frames. There is no new renderer or RAF loop.

## Sources and authoring

- Official GSAP 3.13.0 MorphSVG distribution:
  https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MorphSVGPlugin.min.js
  SHA256 `fe638800184406468075bdb59ef41ea264d5d3568fff5f68f3ce46bb132a02fe`.
  Original copyright/license header retained. API reference:
  https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/.
- Letter paths: existing `experience/assets/dm-sans-latin.woff2`, weight 500.
  Existing SIL Open Font License remains in `experience/licenses/DM-Sans-OFL.txt`.
  Reproduce the compact runtime data using `python tools/generate-project-glyphs.py`
  with FontTools/Brotli installed, or `--deps` pointing to authoring dependencies.
  Runtime font parsing and new remote font requests are unnecessary.
- All four project assets and factual content retain their accepted provenance.

## Verification

Browser/IAB exercised the title forwards/backwards and selectors between wide
and portrait images. Isolated Chromium supplied viewport emulation unavailable
in IAB: 1440×900, 1280×720, 1100×650, 320×740, 393×851, 430×932, 851×393;
also reduced motion, pause/re-enable, native fallback, source ratios, fixed
centres, one gallery pin, selected-card accessibility and details/Escape.
Local QA reports/screenshots live outside public output in the workspace's
`tmp/immersive-oct22-qa/`. SwiftShader results verify behavior/geometry, not real
phone GPU performance or hardware FPS. The physical Pixel 6a was not available.

The comparison preserves production and both audience-specific resume files.
