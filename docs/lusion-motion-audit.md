# Immersive portfolio: interaction audit and refinement

Date: October 8, 2026. Branch: `codex/immersive-motion-refinement`.

This pass is a preview experiment. It does not replace the established creative homepage or the clean portfolio. The earlier immersive version was rejected because its interaction details and continuity did not match the reference's quality. This document separates observed behavior, inspected implementation, and our adaptations.

## Evidence

| Observed on the live [Lusion homepage](https://lusion.co/)                                                                                                                                                  | What the observation establishes                                                                                                                                | Adaptation for this portfolio                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A short scroll indicator near the right edge fades when idle. The inspected track is 6 px wide, 20 vh tall, at 40 vh from the top and 16 px from the right; at a 720 px viewport the thumb is 28.8 px tall. | The indicator has deliberate sizing and visibility behavior. The root scroll containers use `overflow: hidden`. This does not identify their scrolling library. | A short rounded rail with a proportional thumb, idle fade, pointer dragging, track clicks, and keyboard navigation. Native scrolling remains the fallback.     |
| Wheel input produces a coast rather than abrupt section movement.                                                                                                                                           | Smoothing is visible; its exact implementation and tuning are unverified.                                                                                       | Initialize the already vendored Lenis 1.3.11 and synchronize it with GSAP and WebGL on one ticker.                                                             |
| The hero is a broad, rounded, dark stage with many responsive 3D objects.                                                                                                                                   | Large composition and controlled pointer response contribute to the experience.                                                                                 | Retain the original mechanical sculpture, add local pointer response and bounded velocity effects, and preserve the stage's continuity while scrolling.        |
| Oversized words and lines reveal as the reel section enters. Menu groups reveal after the menu expands. Project titles and the footer invitation roll repeated letters on hover.                            | Different interactions have distinct timing and choreography; a single generic reveal does not capture them.                                                    | Masked heading reveals, separate text/parallax timing, and rolling labels on controls and links. A duplicate visual label is hidden from assistive technology. |

These are browser observations from this audit, not a claim that our implementation reproduces every effect on the reference site. In particular, **Lusion's use of Lenis, GSAP, or any specific current scrolling package has not been established**.

## Problems confirmed in the earlier version

- `main.js` did not initialize Lenis. The library being present in the repository did not provide smooth scrolling.
- `selectWindow()` picked the single largest visible art window, moved the canvas to it, and faded into a new scene. That midpoint switch interrupted continuity between neighboring sections.
- Pointer damping existed in `world.js`, but the scrollbar, controls, hover labels, and scene transitions lacked a coordinated interaction layer.

## Sources and concrete adaptations

| Source                                                                                                                                                                                         | Useful implementation                                                                                                         | License / scope                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [Lenis 1.3.11 README](https://github.com/darkroomengineering/lenis/blob/v1.3.11/README.md) and [stylesheet](https://github.com/darkroomengineering/lenis/blob/v1.3.11/packages/core/lenis.css) | Native scroll smoothing; `raf(time * 1000)` on the GSAP ticker; `scroll` event synchronization; velocity and progress values. | MIT, existing vendored library. Version 1.3.11 requires explicit reduced-motion handling; newer documentation must not be assumed to apply. |
| [Lusion WebGL Scroll Sync](https://github.com/lusionltd/WebGL-Scroll-Sync), especially its [fragment shader](https://github.com/lusionltd/WebGL-Scroll-Sync/blob/main/src/shaders/img.frag)    | DOM-aligned art windows, velocity-decaying effect strength, and a five-sample noisy texture-displacement effect.              | MIT. Preserve Lusion's notice when adapting the shader. This public example is not proof of the live homepage's current renderer.           |
| [14islands ViewportScrollScene](https://github.com/14islands/r3f-scroll-rig/blob/master/src/components/ViewportScrollScene.tsx)                                                                | One shared canvas renders each visible DOM proxy through its own camera and scissored viewport.                               | MIT. Adapt the architecture to vanilla Three.js; no React dependency is required.                                                           |
| [Codrops MagneticButtons](https://github.com/codrops/MagneticButtons/blob/master/src/js/demo1/buttonCtrl.js)                                                                                   | Damped button displacement, counter-moving text, and a timed exit/roll-in sequence.                                           | MIT. Keep a stationary hitbox and move its visual children so the target does not chase the pointer.                                        |
| [Three.js MathUtils](https://threejs.org/docs/pages/MathUtils.html)                                                                                                                            | Delta-time-based damping for independent response speeds.                                                                     | Three.js is MIT; use the existing library.                                                                                                  |
| [Jan Kohlbach's on-scroll shader](https://github.com/jankohlbach/codrops-shader-on-scroll)                                                                                                     | Clamped signed-velocity deformation and local cursor distortion.                                                              | MIT research reference. Do not describe ordinary mesh tilt as screen refraction.                                                            |

The scene assets and personal content remain original to this portfolio. The refinement uses public implementation patterns and an adapted Lusion shader; it does not reuse the studio's models, images, or production assets. Public credits and applicable notices are in `dist/startup/immersive/resources.html` and its `licenses/` directory.

## Implementation and verification checklist

The intended implementation uses one clock for Lenis, GSAP, and rendering; direct scroll synchronization for the project track; multiple visible scissored art windows; local damped pointer interaction; and a bounded velocity postprocessing effect. Motion controls must tear down smoothing and pin spacing while preserving readable content.

The acceptance checks for this pass were:

- Compare wheel start, coast, reversal, and settling with the reference; avoid stacking long Lenis and ScrollTrigger delays.
- Exercise scrollbar dragging, track clicks, arrows, Page Up/Down, Home/End, anchor links, and keyboard focus into every project.
- Check adjacent art windows during section handoff and project transitions for blank frames, hard relocation, clipping errors, and pointer-coordinate jumps.
- Check heading masks and rolling labels for cropping, accidental duplicate announcements, and stable hitboxes.
- Test desktop, phone, and tablet layouts, reduced motion, Pause/Enable motion, unavailable WebGL, document visibility changes, and resize across gallery breakpoints.
- Keep pixel ratio and velocity effects bounded; reuse resources; suspend hidden rendering; release render targets, geometry, materials, listeners, and ticker callbacks on teardown.
- Inspect browser errors and frame behavior; perform syntax and whitespace checks; verify the résumé and existing homepage sources are unchanged.

### Verification results

- Browser checks passed at 1280×720, 390×844, 780×900, and 1280×600. The smaller and shorter layouts had no pin spacers or horizontal document overflow. Resizing across the gallery and rendering breakpoints rebuilt the scene successfully.
- A real wheel input continued from 157.6 to 171.2 px after the input ended; the indicator then faded to opacity 0. Reversal, smooth anchors, scrollbar dragging, Home/End, Page Down, and arrow navigation were exercised. Page Down + Arrow Down moved 676 px (612 + 64) at a 720 px viewport. Keyboard Work navigation focused the destination section.
- Focusing a later project's source link brought its panel into view. Pause removed the pin spacer and preserved Marble's top within 0.2 px; resume restored the gallery while retaining the contact position. A deployed-preview check found that native Home could fight an active wheel coast; keyboard scrolling now cancels that target. Local verification reached 0 immediately on Home during a coast and the page limit on End.
- Hero/work handoff and project transitions rendered the correct visible scenes without relocation or geometry ghosts. Local pointer response and the disassembly control were exercised. Console inspection reported no shader or runtime errors in the normal desktop and phone tests.
- The local GSDevTools harness replayed the entrance at 10% and normal speed. Its code and test fixtures are outside Vercel's public output.
- A local unavailable-WebGL fixture removed the canvas and kept the project flow readable with no pin or overflow. A JavaScript reduced-motion fixture started paused, without Lenis or pinning. This fixture does not emulate CSS media queries; reduced-motion CSS was inspected separately. Actual touch hardware and low-end GPU frame rates were not measured.
- Syntax, formatting, and whitespace checks passed. The résumé's local SHA-256 remains `797D80301EDBF6BE264CC5D02B093FB6FAB8567C71C5F0B5CEF6ED95D0C13288`; both homepage sources and the résumé are unchanged from the production baseline. Source review confirms paused scenes render on input rather than every ticker tick, hidden documents suspend rendering, and resource cleanup releases the shared target and per-view histories.

Vercel Preview requires the owner's sign-in. Browser verification uses that existing authenticated session; unauthenticated HTTP requests receive the login page and are not treated as asset validation.

The preview stays on this experiment branch. No production deployment is implied by this audit.
