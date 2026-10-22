# Website checkpoint — October 22, 2026

Sharon authorized continuing with the existing Lusion-inspired design and lifted
the earlier usage stopping constraint. AUREUS was rejected as a replacement.

- Repository: sharonbasovich/PortfolioWebsite, tmp/vercel-portfolio-deploy.
- Branch: codex/immersive-refined.
- Implementation commit: 407cf5a6b98ea64c3c0e7a0d0f806431f4b5a452.
- Published code including narrow controls: fb06dc9161e050cd1a5dc226ccf880de33673175.
- Rollback: codex/immersive-oct22-baseline at a5d6398407c0cba2b3fe7bd50f96aca1958882f0.
- Result URL: https://basovichsharon.vercel.app/immersive/
- Current source and rationale: docs/immersive-refinement.md.

## Implemented

Kept original procedural mechanical identity, light editorial layout and shared
cobalt/chrome palette. Added actual transformed-mesh pointer hits with bounded
position/angular springs, a sustained disassembly toggle, smooth camera fitting,
a short cursor trail, opposing scroll typography and a drawn route. Added named
project selectors on the existing shared timeline. Removed redundant cursor hint,
fixed sticky/reversible heading behavior, improved small metadata and header
legibility, and self-hosted DM Sans with its OFL notice.

Pause freezes clock/pose/pixels. Resizing preserves disassembly. Native keyboard
navigation cancels wheel coasting; semantic chapter status works without 3D.
WebGL loss falls back to readable content; restoration rebuilds reflections and
restores the exact paused canvas pixels. Hero material batches reduce draw
submission; invisible/hidden/paused scenes avoid continuous GPU work. Hardware
and software drawing resolutions are bounded and can step down on slow cadence.
No AUREUS assets, paid assets or new animation framework.

## Verification actually performed

IAB and NodeREPL still failed initialization with missing kernel assets, so used
isolated cached Playwright Chromium headless1248. Reviewed desktop1440x900,
mobile390x844, breakpoint1100x800, short1280x600 and overflow at300px.

Passed checks: actual pointer kicks (31 in one sweep), sustained open/closed
states, pixel-identical pause, selectors in both directions, keyboard project
focus, Home interrupting wheel, Space scrolling, draggable/keyboard scrollbar,
wheel coast/reversal, heading position/nonsticky behavior, local font load,
resume hash, contact links, resize/state carry, actual reduced-motion emulation,
WebGL denied/lost/restored, direct#contact, noJS content/contact and no page/HTTP
errors in edge checks. Independent source/screenshots review approved the scope.

Final screenshots and raw JSON: workspace tmp/immersive-oct22-qa/.
- refinement-functional.json: core checks pass; its final unexpected-error is a
  fixture that mistakenly expected the mailto CTA to scroll to contact.
- refinement-edge.json: all9checks pass, correcting that navigation assumption.
- refinement-final.json: all8checks pass, including exact restored pixels and
  corrected open framing. Test assertions completed; the120second watchdog
  expired during browser teardown. No site assertion failed in that final run.
- final-desktop-disassembled.png, final-desktop-hero.png, final-mobile-hero.png,
  final-small-300.png and desktop-project-0/1/2.png retain visual evidence.

Limits: Chromium used SwiftShader software rendering; observed slow software
cadence is not a hardwareGPU/FPS benchmark. Actual phoneGPU/touch hardware and
screen-reader behavior were not tested. No real-device60fps claim.

## Run/check commands

python tools/motion-lab.py
Open http://127.0.0.1:8789/immersive/?review=1
node --check dist/startup/immersive/main.js
node --check dist/startup/immersive/world.js
git diff --check

QA scripts are in workspace tmp/immersive-oct22-qa/, executed with bundled Node
at C:/Users/Sharon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe.
The local server now suppresses successful request logs to avoid filling an
unattended subprocess output pipe. Local review modules live in tools/ and are
not included in Vercel's public output.

## Publication and preservation

Both Vercel projects reported successful publication. Public immersive HTML,
JS/CSS/font/resume matched the implementation; desktop/mobile runtime rendered
without page/network errors. Both root homepages matched unchanged baseline Git
blobs exactly. Initial Windows checkout-hash comparisons failed because of CRLF;
production-homepages.json uses canonical Git bytes and passes. Narrow300px
controls have no overlap/overflow; production-narrow.json passes. Review endpoint404.

Existing Git integration publishes main to both Vercel projects; CLI login is
unnecessary. basovichsharon uses dist/startup and portfolio-website uses dist.
Only immersive website files changed. The clean and existing creative homepage
bytes and the existing resume are preserved. Resume SHA256:
797D80301EDBF6BE264CC5D02B093FB6FAB8567C71C5F0B5CEF6ED95D0C13288.
Preserve current professional content; do not add Eigenvale, job-seeking copy,
clean-version links, invented metrics or an unconfirmed250k claim.

Next action if continuing: inspect the live result on actual mobile/hardwareGPU
and address concrete feedback, preserving the current complete art direction.
