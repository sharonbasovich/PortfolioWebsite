# Immersive portfolio refinement — October22,2026

## Decision and complete design

Continue the existing Lusion-inspired portfolio at `/immersive/`. Sharon prefers
its personal mechanical identity to AUREUS and authorized independent refinement
and publication. The original procedural sculpture, light editorial pages,
cobalt/chrome palette and project illustrations remain the complete design
source. AUREUS is not used. No React rewrite, paid assets or new effect library.

Baseline: a5d6398407c0cba2b3fe7bd50f96aca1958882f0, retained locally on
`codex/immersive-oct22-baseline`. Work branch: `codex/immersive-refined`.

## Visual and motion system

- Paper#eef1fa; ink#090b11; cobalt#2d43ff; original shared PBR palette and
  procedural studio environment. Local DM Sans400–700, SIL OFL1.1.
- Hero: name, existing Waterloo/Magna/RBC/interests introduction, panoramic
  mechanical subject, disassembly control, friendly email invitation. No cursor
  instruction, job-seeking language, Eigenvale or clean-version link.
- Transition: oversized opposing typography and one drawn cobalt route connect
  curiosity to engineering. Proof points are confirmed10hackathon wins,
  12,000+annual hours saved atRBC and firstplaceAPEX international research hackathon.
- Experience: static once-revealed heading, original engineering records, sticky
  mechanical inspection window. Heading no longer sticks over later text.
- Projects: original3D robot/balloon/relationship illustrations, reading holds
  and shared horizontal timeline, plus named project selectors. Small screens
  and reduced-motion mode retain natural vertical source order.
- Contact: existing friendly invitation, visible email/GitHub/LinkedIn/resume.

Motion character is fluid and physical: one GSAP/Lenis clock; damped input;
real transformed-mesh hits; bounded positional/angular springs; sustained,
critically damped disassembly; brief rolling/magnetic control feedback; one-time
masked heading reveals. Pause retains current scene time, pose and offsets.

## Implementation details that matter

`world.js` rigid-skin batches independent mechanical parts into six material
batches while retaining original exact meshes for raycasting. Shared materials
and cached geometries avoid duplicates; bare-metal StandardMaterial avoids
unnecessary clearcoat; one antialiasing resolve. Render only visible windows,
stop GPU work while hidden/paused, adapt drawing resolution downward in bounded
steps when observed cadence is slow. Stats distinguish CPU submission time from
observed frame intervals; neither is a GPU timer.

`main.js` initializes without waiting for optional fonts, synchronizes Lenis,
DOM animation and WebGL, freezes the scene clock on pause, derives chapter state
from semantic sections, and keeps native keyboard/focus navigation interruptible.
Compact renderer recreation preserves desired disassembly. Context loss restores
a readable native layout and can rebuild on context restoration.

## Acceptance criteria

The preserved identity must be visibly intact; pointer hits and sustained
disassembly must be observable; pause must freeze pixels/time; work headings
must remain readable; allprojectselectors and keyboard navigation must work;
desktop/mobile layouts must avoid overflow; reduced motion, noWebGL and noJS
must retain content and links; resume bytes and clean/creative homepages must
remain unchanged. Fix material defects rather than adding unrelated effects.

## Verification and evidence

IAB and NodeREPL initialization failed with missing kernel assets after the app
upgrade. Used isolated cached Playwright Chromiumheadless1248 via bundled Node.
Visuals and JSON results are in workspace `tmp/immersive-oct22-qa/`.

Local server: `python tools/motion-lab.py` on8789, `/immersive/?review=1`.
Local review module is served from `tools/` outside public output. Production
has no review module endpoint. `?webgl=off` is a local serverfixture; actual
browser reduced-motion emulation is also tested. Run the QA scripts recorded
in WEBSITE-NEXT.md. See final checkpoint for measured results and limitations.

Asset rights: procedural geometry is original to this portfolio; no Lusion
production images/models are used. Existing Lusion MIT scroll shader,
14islands/Codrops notices retained. Font provenance and full OFL are in the
public credits and `licenses/`. No new remote render assets required.
