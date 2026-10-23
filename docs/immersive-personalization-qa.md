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

Each uses one reversible, unpinned GSAP scroll timeline. No primary treatment has
been chosen. Query previews include links to compare them. Touch, small-screen
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
