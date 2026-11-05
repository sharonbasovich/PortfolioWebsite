# Personal model comparison and portfolio refinement — 5 November 2026

The existing creative direction, Three.js/GSAP stack and accepted scroll story
remain the production baseline. Sharon requested a comparison of recognizable
models tied to her interests/work before selecting one. These are three bounded
hero studies, not three replacement websites or an approved new production scene.

Run `python tools/portfolio-review.py` and open:

- `http://127.0.0.1:8790/tools/model-studies/?model=watch`
- `http://127.0.0.1:8790/tools/model-studies/?model=keyboard`
- `http://127.0.0.1:8790/tools/model-studies/?model=payload`

The comparison is outside `dist`, so it is not published by either Vercel
project. The same server serves the clean preview at `/dist/` and creative
preview at `/dist/startup/`. Port 8070 belongs to the user's ECHO reference and
must not be replaced with a portfolio preview.

## Subjects and construction

All geometry is original code-authored illustration, using the already bundled
Three.js renderer, RoundedBoxGeometry and RoomEnvironment. There are no purchased
or downloaded model assets. Existing vendor licenses continue to apply.

1. **Watch movement (recommended):** a wristwatch with a machined ring case,
   crown, lugs/bracelet links, open movement, gear train, minute markers, blued
   hands, screws and jewel details. Scroll separates the dial/hands/bezel from
   the movement. The existing portfolio already discusses the engineering work;
   horology adds a personal subject.
2. **Mechanical keyboard:** key legends, case, switches, plate and PCB separate
   into readable layers. This is an illustrative keyboard, not a claimed real
   commercial design or one of Sharon's manufactured products.
3. **Radio payload:** a GPS patch, antenna, radio shield, board, enclosure,
   mounting rail and battery cavity. This is explicitly SkyCell-inspired, not a
   CAD reconstruction or documentation of its actual flight hardware.

The actual union of assembled, intermediate and exploded bounds drives camera
framing. Geometry caches and rigid instancing reduce repeated key/tick/screw
work. Each selected model disposes its geometries, materials, textures and
instance resources. One animation loop pauses off-screen/hidden; scroll poses
are absolute and reversible. The explicit slider remains usable with reduced
motion, while scroll/idle animation stops. Reduced and unavailable-WebGL fixtures
are supplied by the existing local review handler (`&motion=reduce`,
`&webgl=off`). No QA fixture is shipped in public output.

## Independent refinements to both production pages

The clean page keeps its layout, type families, facts and audience. It gains the
existing real project photos/logo, aligned card controls, keyboard-visible focus,
more deliberate link/button feedback, a mobile contact shortcut and a narrower
phone name size that retains the period. The existing three-system chapter
retains desktop pinning; phones/coarse pointers use native-flow cards. Entry
reveals remain available on short laptops without forcing a pin. Initial
bookmarks are aligned after fonts, pin layout and native load-time positioning.

The creative page gains a left-hand scrim to separate contact copy from chrome,
brighter inverse link arrows, more readable phone project dates/skills and
correct initial bookmarks (contact opens its finished reveal). A cached-page
navigation no longer disposes its project dialog on persisted pagehide. Both
initial anchor corrections yield to user input. The final chapter status reads
CONNECT rather than the old SAY HELLO. Scene assets, accepted path/docking and
project motion, factual copy and both resume PDF byte streams remain intact.

## Verification record

Actual browser review, evidence and remaining limits are recorded in the private
workspace `tmp/portfolio-nov05-qa`. Screenshots establish composition; observed
scroll, selector, range and keyboard input establish those interactions. The
viewport fixtures are browser emulation, not physical-phone GPU/FPS measurements.
Do not present an initial matrix snapshot taken during resize as a settled
layout result; the subsequent bookmark rechecks supersede those initial rows.

No model option is selected for integration. Preserve all three until Sharon
chooses. Routine verified polish may be published under her standing deployment
authorization; model selection and full-story integration remain pending.
