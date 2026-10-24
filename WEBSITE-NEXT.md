# Docking flash and selector size corrected — 24 October 2026

Branch codex/docking-flash-fix, base705b153. The frame background bug was fixed,
but complementary photo/frame opacity fades then exposed25% page background
at their midpoint. Now the docked frame fades in behind an opaque outgoing
photo atp=.94–.97, then that photo fades out atp=.97–1. At least one remains
opaque in either scroll direction. No premature dark placeholder returns.
Selector label clamp17.5–21px, indices13px, active dot8px and60px row sit halfway
between the original and enlarged versions; requested progress bar remains8px.
Seven focused browser checks pass, including reverse/refresh/pause and full
coverage. Pixel samples confirm the washed-out midpoint is corrected. No other
content, layout, canonical resumes or clean homepage changes.

--- Earlier accepted checkpoint ---

# Accepted morph gallery promoted — 24 October 2026

Sharon selected the trial and explicitly requested live publication. Branch
codex/live-morph-gallery promotes89bd747 to the default homepage without a flag.
Removed original photo-through-type module/CSS and whole-track horizontal slide.
The larger selector/progress row appears only while the gallery pin is active;
otherwise it is invisible/inert. The destination frame's whole opacity is owned
by the title handoff, fixing the premature empty black background. Existing
native phone/reduced/pause layouts and all content/PDFs retained.25 scoped browser
checks pass, including source ratios, no placeholder, pin-time controls and row
fit at1100px/1280px. Docs/title-gallery-motion-study.md records implementation.
Marble black backdrop stays deferred. Rollback7578e08 remains available.

--- Earlier review checkpoint ---

# Review-only title/gallery morph study — 24 October 2026

Branch codex/title-gallery-motion-preview, accepted production base7578e08.
Sharon requested a trial before deciding whether to proceed. Do NOT merge this
branch to main or update production aliases without that selection. Preview flag
?motion-study=1 enables real DM Sans glyph-outline morphing into the Robotics
photo and a fixed-centre gallery aperture matching all four intrinsic image
ratios. Only the right-hand text slides. No flag retains accepted animation.
Native phone/reduced/pause fallbacks retain all content and source-ratio frames.
Existing project order, facts, links, side-sheet details and all PDFs unchanged.
Marble black background remains deferred. Source/provenance and verification:
docs/title-gallery-motion-study.md. Local IAB plus25 targeted emulated browser
checks pass; corrected initial hash timing and intro/frame stacking. The isolated
Chromium uses SwiftShader, so these are geometry/behavior checks, not hardware FPS.
Production remains7578e08 until user reviews the branch deployment.

--- Accepted baseline ---

# Robotics first and recovered trophy photograph — 24 October 2026

Branch codex/robotics-first-trophies; prior production/rollback4630e6d.
User deferred the Marble black backdrop. Its light background and other styling
remain unchanged. Lions Robotics is now first in both selector and gallery,
followed by Marble Investments, HPC, SkyCell. Updated all sequential indices,
while project-key media and dynamic gallery timing preserve correct associations.
The first-project photo-through-type heading now follows the Lions image.

Exact requested image recovered from the earlier portfolio's data/portfolio.json:
https://i.postimg.cc/8zXm1g34/robotics.jpg (1200x800, original unchanged, SHA256
dbab4df29e94f2f427e33dd33e5f051c660320454665bf313de534dd3243599d).
It shows four VEX robots and four competition trophies. Full photo contained,
with a 3:2 phone frame rather than a tall letterbox. Replaced old single-robot
asset; updated credits/provenance. All card summaries, dates, links, skills and
twelve resume bullets are unchanged. No resume/canonical/big-tech edits.
22 scoped browser checks pass: reordered navigation/reversal, first-project title
handoff, exact image dimensions/contain framing, all twelve resume bullets, first
dialog content, no overflow, and Marble background preservation on desktop/phone.
Raw UTF-8 per-project comparison confirms unchanged card content apart from index
numbers. Desktop in-app and native screenshots inspected; no runtime/asset errors.

--- Earlier checkpoint ---

# Project images, summaries and selected side sheet — 24 October 2026

Branch codex/project-brand-images; prior production/rollback9294aaf.
Sharon selected option2. Side-sheet wipe/cascade is the default on desktop and
phones; old reveal alternatives/local comparison UI removed. Native dialog,
Escape/backdrop, focus restore/trap, scroll locking and pause/reduced motion remain.
Project-link position:relative restores the containing block for its absolute
animated underline, fixing card and cloned-modal lines extending across sections.

Project fronts use Sharon's new italic summaries, including the team's Marble
growth from $250K to $3M AUM. Dates and locations occupy top-right metadata.
UW HPC is abbreviated in the heading and HPC in the selector. All twelve résumé
bullets and skills remain. Marble now links to its website rather than the PDF.
Official original Marble/UWHPC logos replace diagrams; supplied SkyCell launch
photo replaces archived replay screenshot; Lions robot photo retained. Captions
removed. CSS crop keeps both balloons and payload visible without changing the
photo bytes. Old media/styles removed, credits/provenance updated with sources.
Source remains root index.html with experience/ assets, no duplicate page.
Canonical résumés/PDFs and the big-tech homepage are outside this change's scope.
159 browser checks pass across desktop, short laptop, four touch layouts, exact
content, image sources/no captions, default side sheet/reduced motion, and bounded
hover/focus/click underlines on cards and cloned modal links. In-app and device
screenshots inspected; independent content/integration review clear. Actual source
photo and official logos retained byte-for-byte. No runtime/asset/shader errors.

Sharon additionally requested a separate SkyCell chat. Created
01a16c17-9168-7651-9ab0-22f9add6ca96 in this project with isolated SkyCell checkout
and preview-only publishing scope. It must not modify this portfolio repo or
the current skycell.vercel.app production alias. The chat is user-owned and
continues independently. No further messaging authorization is inferred.

--- Earlier checkpoint ---

# Single startup document and route consolidation — 23 October 2026

The editable homepage is now dist/startup/index.html. There is no separate
/immersive/ document: modules/styles/assets were moved to experience/, which
contains no HTML. Removed build-homepage.mjs and both Vercel build commands.
Static output directories remain unchanged. The one resources.html page now
contains the current motion references, with corrected font/module/license links.
Vercel redirects former immersive pages to root/resources and legacy assets to
experience/. The local motion-lab server mirrors those redirects for verification.
Equivalent nested /startup/immersive rules preserve bookmarks in big-tech output.
Edit root directly; do not regenerate a duplicate or run the Next.js build.
See docs/startup-homepage.md for source mapping and review commands.

Branch codex/consolidate-resume-projects; prior production fdd4ef7. Project order
now follows the startup résumé: Marble Investments, UWaterloo High Performance
Computing (HPC menu), SkyCell, Lions Robotics. Exact résumé names and three active
bullets per project; italic short summaries, skills, links, and View more controls.
Drawing robot removed and replaced with real Lions robot imagery/source. The
photo-through-type heading now follows the first Marble diagram. Project media
uses stable keys after reordering. One bounded native dialog avoids pinned-layout
resize. Three localhost-only GSAP reveal alternatives are reviewable through
details-motion=1/2/3; default disclosure remains static pending Sharon's selection
as required by motion-workflow-picker. Canonical resumes/PDFs remain unchanged.
108 primary browser checks and 28 final evidence/resize checks pass. In-app
desktop interactions and multi-size touch screenshots inspected. No unexpected
asset/runtime/shader errors. Independent content and integration review clear.
Sharon requested all three reveal previews and will decide afterward; keep them
available locally and do not select a preferred animation for production.

--- Earlier checkpoint ---

# Startup UWaterloo HPC projects and approved resume — 23 October 2026

Branch codex/startup-uwhpc-projects; prior production/rollback 637db9e.
The existing projects UI gains a fourth UWaterloo HPC group containing XPU and
Variational Monte Carlo, both explicitly in progress. Core Developer role,
Waterloo location, and Citadel & Jane Street sponsorship match the approved
resume. Source links point to the verified public UWHPC repositories. The left
panel is a labeled concept overview, not a simulation or performance result.
Other project copy and the accepted design are retained. Four-panel navigation,
progress, and scroll timing derive from the panel count; no additional renderer
or animation clock. Native mobile content stays unpinned and content-sized.

Both startup PDF routes now contain the approved final PDF with SHA256
b95a74b618d5fa26e5177c461121710d2ef6a413cfba157acb2bf3c216525de8.
The big-tech site and its PDF are unchanged. Canonical resume files untouched.
38 scoped desktop/mobile/navigation checks pass, including short laptops,
320px touch, landscape, pause/resume, reduced motion and WebGL fallback.
Screenshots inspected. See docs/startup-homepage.md for scope and evidence.
Regenerate root from immersive/index.html before publishing. Standing routine
push/deploy authorization applies; verify actual public downloads after deploy.

--- Earlier checkpoint ---

# Startup root homepage and resume synchronization — 23 October 2026

Branch codex/promote-immersive-homepage. Prior production/rollback3ea5c4b.
The immersive experience is now generated as the basovichsharon root homepage;
/immersive/ remains available, with root canonical metadata. Its HTML is the
single editable source. Both Vercel static builds run build-homepage.mjs; do not
run Next.js build or maintain a second root document manually. See
`docs/startup-homepage.md` for commands, route behavior and download mapping.

Coordinated resume updates: both current sites show11 wins. Big-tech site retains
its design/Eigenvale and links to Sharon_Basovich_Resume.pdf. Startup links to
Basovich_Sharon_Resume.pdf (no Eigenvale, includes in-progress UWaterloo HPC).
Both generic resume.pdf URLs remain correct compatibility copies. PDFs were
reviewed and verified against the final workspace outputs; canonical Tex untouched.
No new HPC carousel slide was added: this sync preserves the selected project
structure and reflects the startup-only content in its resume download.
16 local root/alias/browser checks pass. Deployment/download verification follows
publication. Existing routine publication permission applies.

--- Earlier checkpoint ---

# Latest header, theme and route-layer fixes — 23 October 2026

Branch codex/immersive-header-layering. Prior production/rollback009a002.
The About route is masked behind the projected carrier bounds and its oversized
reveal cap is removed. Mobile nav keeps all five controls on one row with44px
targets. Each fresh immersive/resources load defaults light regardless of OS/saved
theme; the in-page dark toggle remains. Current source/QA details are in the latest
section of docs/immersive-personalization-qa.md.37 browser checks and an opaque
carrier pixel comparison pass. Prior projects sticky hold/mobile line timing and
native canvas containment remain. Existing push/deploy authorization applies.

--- Earlier checkpoint ---

# Current transition visibility fixes — 23 October 2026

Branch codex/immersive-visible-transitions. Prior production/rollback e2e7282.
The selected My projects photo reveal now holds inside a CSS sticky viewport
below the header, then resumes document scrolling for the gallery handoff.
Mobile About line draw uses the visible route area and finishes while the full
heading is still visible, including short landscape. Desktop carrier timing,
native canvas containment, content, roots and resume remain unchanged.
80 scoped checks pass (46 desktop, 34 final native); see the latest section of
docs/immersive-personalization-qa.md. Existing push/deploy permission applies.

--- Earlier checkpoint ---

# Current immersive refinement — 23 October 2026

Authoritative source: this repository, branch codex/immersive-oct23-polish.
Published destination: https://basovichsharon.vercel.app/immersive/
Prior production/rollback: 764e46cabf76d55e4ee2a5606ea11087cf44f17e.
User explicitly authorizes push and deployment without another approval.

Refined the accepted GSAP/Three.js direction: delayed small header brand,
immediate hero opening, stronger idle movement, corrected counterweight geometry
and camera clearance, normalized route draw, one-time achievement reveals,
fivefold docking sparks, readable photo-through-type hold, larger project
controls, contact layout and header anchor. Native phone rendering now puts the
single canvas in the active art window, with event-only outgoing snapshots, so
touch scrolling no longer separates the pixels from the DOM border. Temporary
context loss preserves the layout. Portrait and landscape spacing is content-led.

Verification: 60 broad browser checks, 7 native rendering/recovery checks,
9 Pixel-sized checks, 34 mechanical geometry/camera checks, syntax and whitespace.
No observed runtime/shader errors. Details: docs/immersive-personalization-qa.md.
No physical-phone FPS claim. Clean/creative root homepages, resume, assets/vendor
remain unchanged. Existing project content is pending the user's later review.
Pause motion remains. No new engine, external models or template replacement.

--- Earlier reference checkpoint ---

# Lusion reference review — 22 October 2026

User asked to inspect Lusion's pages for further compatible refinements.
Published code: 5d7b5c7e59956fd40dd8719dd6e10561df04480e
(previous pass aeb0d670daf572019f38c17f02a87dc4adfaef33).
Branch: codex/lusion-full-site-refinement. Pushed to branch and main.
Both Vercel projects success; actual live immersive assets match tested bytes.
Live: https://basovichsharon.vercel.app/immersive/

Shipped this pass: reversible internal project-copy choreography, fractional
indicator, active navigation, SkyCell demo/source links, cached-progress contact
iris, footer return path, and layered cobalt/chrome bridge path. The route uses
one inherited draw offset, narrower mobile weight and a paper mask at the metrics.
No extra clock, framework, asset pack or new WebGL pass.

Verification: 17 initial focused checks, 6 path checks, and 15 corrected layout/
text-size cases pass. Final desktop/mobile images inspected. Both existing root
homepages and resume bytes preserved. Resume SHA256:
797d80301edbf6be264cc5d02b093fb6fab8567c71c5f0b5cef6ed95d0c13288.
Evidence: workspace tmp/immersive-oct22-qa/, especially tube-check.json,
gallery-fit-probe.json, tube-production.json and tube-desktop/mobile-reduced.png.
A stale-resize fixture was corrected; no steady-state clipping defect found.

Reference coverage: Home, About, Projects catalogue and all 19 case sequences,
plus Labs landing. All 209 ordered panels (181 image / 26 video / 2 text) match the
independent source inventory. All 19 contact-sheet overviews were reviewed.
Per-state panel geometry shows at least 97.4% of the width that fits in the viewport;
track-end captures within 6 CSS pixels. Detailed results and qualifications:
docs/lusion-full-site-audit.md; raw reports/source/evidence remain outside Git in
workspace tmp/lusion-oct22-audit/, including coverage-validation.json.

Do not claim every control/video was verified. Talks, card hover, reel close,
Back restoration, valid mobile menu close and Labs toggle remain unverified after
bounded attempts. Some video panels show initial states; technical-text full
contrast not confirmed. External client demos/Labs experiments/forms excluded.
Source/live/inference are distinct in the audit. No hardware GPU/FPS claim.

Next design priorities: authentic project/process media; one wider framing or
object handoff using current scene/clock; short material pointer trace.
Preserve sculpture, cobalt/chrome/paper, friendly positioning and current stack.
No game world, new template, job-seeking copy, Eigenvale or clean-version link.

The public cloud audits have returned their final reports and stopped task work.
Their account/client lifecycle details are kept outside this repository.
Do not restart research merely because an individual control remained unverified.

# Earlier verified baseline — October 22, 2026

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
cadence is not a hardware GPU/FPS benchmark. Actual phoneGPU/touch hardware and
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
