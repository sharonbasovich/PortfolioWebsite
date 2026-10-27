## October 27: ECHO section adaptation and responsive repair

ECHO's actual liquid carousel is adapted for page-driven projects, not nested
wheel capture or dragging. The previous fixed-frame aspect morph and sliding
copy now present RBC and Magna internships. ECHO's expanding card/separating
words now reveal the existing Let's talk content. Provenance is recorded in
`dist/startup/experience/echo/SOURCE.md`, including OGL 1.0.11's Unlicense declaration.

The old 1100x650 and Three.js-world prerequisites incorrectly disabled the title
and project effects on short laptops. Fine-pointer layouts now qualify at
760x480, independently of Three.js. Touch/reduced-motion layouts keep native
vertical project and internship cards. The blue route starts at the measured
hero art boundary, without its former gap. Contact and internship positions are
preserved during responsive rebuilds.

Browser checks cover 768x512, 900x600, 1024x768, 1280x578, 1366x638,
1440x900, 1920x1080 and 2560x1080. Touch-layout fixtures cover 320x568,
393x851 and 851x393. Geometry and screenshots were inspected; the smallest
contact layout was corrected to retain a 16px email/link gap. Page wheel input
advances projects forward and backward; project/internship sheets close with
Escape. Reduced motion and unavailable WebGL retain readable content. This is
browser/layout verification, not physical Pixel 6a GPU or frame-rate testing.
Evidence is private in workspace `tmp/immersive-oct22-qa/echo-*`.

Existing source assets, factual body content, resume PDFs and clean homepage
are unchanged. Marble's black backdrop remains deferred.

# Accepted title and gallery motion — October 24, 2026

Sharon selected preview `89bd747` for the live homepage on October 24. This is
now the default experience, with no query flag. The old photo-through-type
implementation and horizontally sliding image track have been removed.

The title's real DM Sans weight-500 outlines expand into adjoining image-mask
regions, then the finished Robotics photograph docks into the gallery. There is
no independently opening centre rectangle. One stationary SVG gallery viewport
morphs its aperture to each source image's intrinsic ratio; only the existing
right-hand project copy slides. Existing content, side-sheet details, selectors,
keyboard navigation, pause, light/dark controls, and resume downloads are retained.
Touch, reduced motion, short/small viewports and unavailable WebGL use native
vertical cards with matching image frames. SkyCell uses Sharon's requested
4:3 display crop at a 34% vertical focal position, removing excess lower sky;
the other frames retain their source ratios. There is no new renderer or RAF loop.
The enlarged selector and 8px progress bar appear only while the gallery's
ScrollTrigger pin is active. Outside that interval the controls are invisible
and inert. The complete destination frame, including its background and edge,
stays transparent until the photo arrives, avoiding an empty black placeholder.
The docked frame fills beneath the opaque moving photo before that photo fades,
so the handoff never exposes the page background. Complementary simultaneous
fades previously exposed up to 25% background and caused a white flash.
The selector was subsequently moderated to 17.5–21px labels and 13px indices,
halfway between the original and enlarged versions; the progress bar stays 8px.

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

The adoption pass adds 25 successful browser assertions, including default-route
activation, hidden destination before arrival, visible final frame, controls
hidden before pin, and enlarged navigation fitting 1100px/1280px laptops. Both
audience-specific resume files and the clean portfolio remain unchanged.
Seven targeted handoff checks also pass for forward/reverse coverage, refresh,
pause/resume, pre-dock invisibility, and the moderated selector. Captured image
patches confirm the mid-handoff colour washout is gone.
