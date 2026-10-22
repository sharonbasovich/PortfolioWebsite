# Lusion follow-up audit — 22 October 2026

## Coverage and limits

This audit is **not a completed visual walkthrough of every page**.

- The public source inventory covers [Home](https://lusion.co/),
  [About](https://lusion.co/about), [Projects](https://lusion.co/projects), and all
  19 case-study routes linked from Projects. Each returned its own correct title.
- Live Home inspection covered the interactive hero, first kinetic title and
  drawn route, reel expansion and full-screen player, project-grid framing,
  early camera transition, a later tunnel stage, contact scene, menu, footer and
  next-page continuation. The complete tunnel progression was not inspected.
- About's particle field and large opening typography were viewed live. Its
  team/client/awards/expertise sequences were inspected in source, not exercised.
- Atlas Motion was viewed live at its introduction and early/middle horizontal
  media states. Its next-project endpoint was not reached. The other 18 case
  studies remain source-only; their complete motion was not verified.
- Labs is a separate outbound site; its landing URL was checked but no complete
  Labs experiment walkthrough was performed. External client sites, award
  destinations, social accounts and newsletter submissions are outside coverage.

The in-app browser repeatedly stalled/reset. Isolated Playwright was then used
as the fallback allowed by the Frontend App Builder skill. A call with a
45-second requested limit returned after approximately 1,001 seconds; local
free RAM was subsequently measured around 0.8 GB of 16 GB. Browsing was stopped
instead of claiming unobserved coverage. The installed Devin helper initially
reported unauthenticated; its separate setup later completed and a second check
confirmed authentication. The org usage screen showed Max with 0% weekly usage,
reset in two days, and no on-demand balance; it states sessions pause at the
included limit. No billing settings were changed. A separate cloud audit was
requested to complete the missing visual coverage. No local LLM was used.

Raw inventory, HTML/JSON and actual screenshots are retained outside Git in
workspace `tmp/lusion-oct22-audit/`. `case-study-walkthrough.md` records the
partial browser evidence separately from `inventory.md`'s source inspection.

## Useful mechanisms and their fit

| Mechanism | Evidence | Fit for this portfolio |
| --- | --- | --- |
| Hero objects respond directly to a cursor gesture | Home live | Already implemented with transformed mesh hits and springs; preserve it. |
| Large type and one drawn line carry the eye into the next section | Home live | Existing flow bridge supplies this motif. Extra unrelated decorations would dilute it. |
| Reel grows from a small editorial block into a large media surface, with geometric distortion during the transfer | Home live | A useful future treatment for authentic project footage; no reel should be invented just to imitate the layout. |
| Media and introductory copy move as one transition, then leave a clear viewing/reading state | Atlas live | Add restrained internal project-copy choreography to the existing shared horizontal deck clock. |
| Small index/progress/continuation marks repeat through the journey | Home live; case-study endpoint source | Make project progress continuous, indicate the active navigation section, and provide an explicit return path. |
| Contact is a composed final scene, followed by practical ways to connect | Home live | Let the existing mechanical iris open with contact progress, retaining the site's own visual language. |
| Project-specific palettes distinguish case studies within one system | All 19 source; Atlas live | Consider a small accent evolution later, while preserving the accepted cobalt/chrome identity. Changing every project to a new art direction is unnecessary. |
| Project pages pair strong visuals with concise implementation detail and a clear launch action | All 19 source; Atlas live | Keep technical descriptions; add the actual SkyCell demo alongside source. Authentic project screenshots/footage would be a valuable next content pass. |
| Evidence is grouped into compact award/article lists | About source | A future compact hackathon record could help, using only confirmed prizes and links; avoid inventing a studio-style client/award wall. |
| Team/brand carousels and large expertise panels | About source only | These solve studio-specific content needs and do not currently justify new portfolio sections. |

The important observation is temporal coordination: each section has an entry,
a readable hold and an exit. More simultaneous effects are not automatically an
improvement. The existing shared Lenis/GSAP/WebGL clock remains the foundation.

## Refinements prepared from verified observations

1. Project metadata, titles and body/actions now enter and leave inside the
   existing deck's transfers. Its 6.3-unit duration and reading holds are retained.
   Reverse scroll and direct project selection use the same timeline.
2. The project indicator follows the fractional deck index; the selected button
   remains discrete. Removed its separate CSS transition to avoid double easing.
3. Work and Projects expose `aria-current="location"` and a small cobalt cue.
4. SkyCell has distinct Live demo and Source actions, both ordinary links.
5. The contact sculpture's six blades open with its cached scroll progress. The
   central cobalt part is revealed slightly; there is no extra animation clock.
6. The footer has Back to top through the existing anchor/focus behavior.

No Lusion production assets or proprietary bundle code were copied. No new
framework, paid resource, model or font was introduced. The existing resume and
both root homepages remain outside the change scope.

## Verification status

Source checks passed for the agent-owned HTML/main/CSS changes; world.js syntax
also passed. Independent source review found no material aperture-envelope,
pause/state or deck-hold issue. The iris stays inside the existing outer ring.

After browser cleanup restored normal execution, all 17 focused browser checks
passed: forward/reverse reading holds for every project, active header state,
fractional progress, SkyCell keyboard actions/demo URL, contact aperture/pause,
native paused copy, return to top, mobile and reduced-motion copy, 300px overflow
and runtime errors. The initial navigation attempt had timed out; it did not
produce a site assertion. A full-viewport pause screenshot initially differed
because the surrounding document/scroll rail settled; a corrected art-window
comparison and a separate focused check both preserved exact 3D pixels.

The bottom contact state reached aperture0.962 and remained inside its existing
frame. Desktop1440x900, mobile390x844 and narrow300x740 screenshots were inspected.
Chromium used SwiftShader; this is not a hardware performance benchmark. Resume
SHA256 remains797d80301edbf6be264cc5d02b093fb6fab8567c71c5f0b5cef6ed95d0c13288.
Raw follow-up checks and screenshots live in workspace `tmp/immersive-oct22-qa/`.
The prior production baseline is
`ea031ec3ba45e2a9e3141cbf60901aac0c81f852`; the new implementation is on branch
`codex/lusion-full-site-refinement`.

## Case-study source inventory

All paths below are under `https://lusion.co/projects/`:

`oryzo_ai`, `atlas_motion`, `devin_ai`, `of_the_oak`, `everswap`,
`porsche_dream_machine`, `synthetic_human`, `ddd_2024`, `spaace`,
`choo_choo_world`, `zero_tech`, `spatial_fusion`, `worldcoin`, `lusion_labs`,
`my_little_story_book`, `soda_experience`, `infinite_passerella`,
`the_turn_of_the_screw`, `maxmara_bearings_gifts`.

Reusable technical reference, distinct from the live proprietary site:
[Lusion's MIT WebGL Scroll Sync](https://github.com/lusionltd/WebGL-Scroll-Sync).
