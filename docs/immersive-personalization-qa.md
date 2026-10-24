# Immersive personalization and motion comparison — 23 October 2026

The immersive page now has a saved/system light or dark theme, the requested
biography and internship details, larger achievement captions and the VEX metric.
The hero opens through scroll instead of a button. The flying module reaches the
line origin before its stroke begins. The contact section ends with the links.

## Bounded comparison previews

The user requested all three title treatments before choosing one. These share
one page and differ only at the projects introduction:

- `?projects-motion=1`: letters unfold into “My projects.”
- `?projects-motion=2`: the real prototype photograph appears through type,
  opens into a frame and docks into the original project photograph.
- `?projects-motion=3`: the heading advances in depth while the project arrives.

Each uses one reversible, unpinned GSAP scroll timeline. The user subsequently
selected photo through type as the default. Comparison links appear only with
an explicit valid preview query. Touch, small-screen
and reduced-motion layouts retain a semantic static heading. Pausing retains the
desktop introduction's document space and restores its visible position.

## Mobile scrolling fix

Phones use native touch scrolling, without Lenis, horizontal pinning or masked
heading reveals. The route uses the existing render loop. A height-only browser
toolbar change refreshes measurements without rebuilding choreography or
correcting scroll position. Width changes and rotation still rebuild layout;
fine-pointer laptop resizes preserve the current project. Pending resize work is
cancelled on disposal. Native Marble evidence remains content-sized.

## Verification

Browser checks covered 320×568, 390×844, 430×932, 844×390 and a wide touch layout;
native touch gestures, toolbar-height changes, rotation, header fit, evidence
clipping, contact links, reduced motion and theme persistence passed. The toolbar
fixture varies `innerHeight` with a stable small-viewport CSS layout; full viewport
resizes separately exercise real reflow. No claim is made about physical Safari
or Android devices or hardware frame rate.

Desktop checks covered all three title clocks, forward/reverse scroll, semantic
headings, pause/resume cleanup, introduction position, project preservation on
resize, blocked storage and WebGL fallback. The photo handoff matched the original
image bounds within 0.01 CSS pixels in the tested 1440×900 viewport. The flying
module reached the route origin within 0.02 pixels before any line was drawn.
Contact headings remained visible at the page end at 1440×900 and 1280×650.
Runtime error checks and JavaScript syntax checks passed.

Visual review included desktop and mobile dark themes, achievement captions,
internships, the three preview treatments and the contact ending. The clean and
creative root pages, resume, project evidence assets and vendor libraries are
outside this change.

## Selected treatment and docking impact

The normal immersive URL now uses the selected photo reveal, and the contact
section's “Say hello” kicker has been removed. The user selected metallic sparks
for the internship docking moment: a short fan of cool silver and cobalt streaks,
with no ring. It uses one LineSegments draw in the existing renderer and ticker,
then disappears after 0.56 seconds. It renders only in the internship window.

A forward crossing near the completed dock fires one burst; scrolling back into
the approach rearms it. The burst requires real scroll/navigation interaction,
so initial fragment positioning cannot fabricate an impact. Pausing freezes the
burst. Touch layouts retain their native path without particles, and initially
reduced-motion pages never trigger them. The module owns and disposes its geometry
and material independently of the mechanical model.

Seventeen browser checks passed for the selected default and impact, including
forward/reverse/repeated docking, pause, expiry, direct fragment entry, contact
layout and mobile/reduced-motion behavior. No runtime or shader errors were
recorded. During a burst the tested scene submitted 10 draws versus 9 after it
settled. Repeated impacts held geometry, texture and program counts at 15/3/7.
These are Chromium/SwiftShader observations, not a physical-device FPS claim.


## Motion refinement and native mobile presentation — 23 October

The header's small name enters after the large hero name leaves. Disassembly
starts with the first scroll; ambient rocking is stronger. The white
counterweight has a flush face inset, physical clearance from the ring and a
perspective-aware camera guard in both mechanical scenes. The route now uses a
normalized SVG reveal mask, has no stray base/dot, follows the actual SVG bounds
and finishes above the achievement panel. Achievement captions pop in once.

The selected photo-through-type sequence holds the complete solid “My projects”
title before opening the photograph. The project labels and progress track are
larger. The contact layout reserves space for its footer and fixed motion control;
the header contact link scrolls there. No project content or assets changed.
Docking now emits 160 silver/cobalt streaks (five times the previous desktop
count), with longer travel and a 0.62-second expiry, still in one draw call.
Native phones do not run this desktop carrier/impact sequence.

The mobile snapping had an architectural cause: a viewport-fixed WebGL canvas
was repositioning its scissored pixels on the JavaScript animation clock while
touch scrolling moved the DOM on the browser compositor. Native layouts now put
the sole canvas directly in the active art window. A 2D snapshot retains the
previous window on host changes; it is captured immediately after rendering,
never each frame. There remains one WebGL context, renderer and animation clock.
Disposal and pointer-mode changes restore the frame and remove snapshots.
Temporary context loss hides rendering while preserving window geometry;
permanent initialization failure retains the readable non-WebGL fallback.

Phone layouts use natural content heights, bounded art heights and explicit
landscape spacing. Existing native scrolling, no touch pinning, height-only
browser-toolbar handling and reduced-motion behavior remain in place.

Verification: 60 browser checks passed across 320×568, 360×640, 375×667, 390×844,
412×915, 430×932, 844×390 and 932×430, plus desktop 1440×900, 1280×650 and
1680×1050. Tests scroll with rendering deliberately frozen and confirm canvas
and border stay aligned within 2 CSS pixels. Touch gestures, host changes,
reverse scroll, bounded snapshot count, no horizontal overflow, contact targets,
toolbar resizing and reduced motion passed. Seven additional checks verified
nonempty snapshot pixels, paused reverse host switching, context loss/restoration,
layout preservation and light theme. A separate 34-check geometric regression
covers ring clearance and counterweight camera fit over opening, idle and pointer
extremes in desktop and native windows. No runtime or shader errors were seen.

Evidence is saved outside the public repository in the workspace's
`tmp/immersive-oct22-qa/`, including `refinement-check.json`,
`native-canvas-edge.json` and `hero-sculpture-refinement-check.json`.
Nine further checks passed at a 393×851, DPR 2.75 phone configuration, including
393×760 and 851×393 reflow, recovery and reverse navigation. These include
Pixel-sized layouts after the user identified a Pixel 6a. These are Chromium
emulation / SwiftShader checks, not a physical-device FPS or
Safari result. The clean/creative homepages, resume and vendor libraries remain
outside the change.
