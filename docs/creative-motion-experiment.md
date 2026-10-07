# Creative portfolio motion experiment

Baseline: `88739d7b12c8a166777020fa3706b5c8a37c6028`.
Local backup branch: `codex/creative-motion-baseline`.
Experiment branch: `codex/motion-experiment`.

## Research and tools actually used

- [Official GSAP agent skills](https://github.com/greensock/gsap-skills): installed `gsap-timeline`, `gsap-scrolltrigger`, `gsap-performance`, and `gsap-plugins` into Codex. Used their timeline ownership, responsive cleanup, SplitText accessibility, pinning, and transform/opacity guidance.
- [LottieFiles motion-design skill](https://github.com/LottieFiles/motion-design-skill): installed and read its director/choreography guidance. Used a single emotional intent, primary/supporting hierarchy, deliberate holds, and staged entrances. No Lottie runtime or animation assets are needed.
- [Codrops 3D Stack Motion](https://tympanus.net/codrops/2024/03/06/on-scroll-3d-stack-motion-effect/) and [reference source](https://github.com/codrops/3DStackMotion/blob/main/js/effect-1/stackMotionEffect.js): adapted the pinned-stage/card-depth technique to the existing text project cards. The implementation is specific to this site, rather than a copied template.
- [Codrops OneElementScroll](https://github.com/codrops/OneElementScroll): spatial continuity and one persistent visual motif across chapters.
- [GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/): real line masks, accessible heading text, automatic resplitting, returned animation cleanup.
- [GSDevTools](https://gsap.com/docs/v3/Plugins/GSDevTools/): local-only entrance replay, scrubbing, and 10% playback. The scroll sequences are inspected by scrolling; GSDevTools does not drive ScrollTrigger timelines.

## Motion direction / implementation prompt

Apply the motion-design skill's director workflow to a curious, confident personal portfolio. Keep the current copy, visual identity, and four chapters. The name is the primary entrance; the introduction and invitation follow it; the abstract 3D form gathers and settles. Each chapter transition should have a beginning, transformation, and readable hold. Make a single particle object travel between compositions rather than spinning continuously. At the projects chapter, adapt Codrops' pinned 3D card stack: flat readable cards at rest, depth and rotation only between cards. Support both scrolling and direct project buttons. End with the existing Let's talk invitation. Keep mobile a natural list. Pause/reduced motion must restore normal document flow and complete text. Use local GSDevTools to inspect entrance timing at 10% before shipping. No new career claims, job-seeking copy, or changes to the clean site.

## Storyboard

1. **Arrival:** name lines rise through masks; supporting copy follows; particles gather in about 1.45 s.
2. **Engineering:** sphere transforms into a lattice at the section boundary, then holds while RBC text is read.
3. **Building:** the object crosses to the left and becomes a knot; three project cards advance through a short pinned sequence, with substantial reading holds and direct selectors.
4. **Connection:** the shape opens into a halo and moves back to the right; the existing Let's talk heading and contact details settle into place.

Shader attributes store all four formations; interpolation runs on the GPU. No per-particle JavaScript work each frame. Mobile caps rendering at 30 fps; the canvas pauses in hidden tabs and when motion is paused.

## Local review harness

Run `python tools/motion-lab.py`, then open `http://127.0.0.1:8789/?motion-lab=1`.
The server explicitly maps two development assets from `tools/`; Vercel publishes only `dist/startup`. The production page will never load the lab on a public hostname.
Use the lab buttons for 10% / full-speed entrance replay and the GSDevTools scrubber. Review the scroll sequence separately, in both directions. Also review 390 px mobile, a short landscape viewport, Pause/Enable halfway through the stack, all three selectors, keyboard access, and the resume link.

## Rollback

Restore the following tracked files from the baseline and remove the newly added particle module / SplitText dependency, then commit and push to `main`:

```powershell
git restore --source=88739d7b12c8a166777020fa3706b5c8a37c6028 -- dist/startup/index.html dist/startup/style.css dist/startup/scene.js dist/startup/resources.html
```

Do not replace `main` wholesale: this keeps future unrelated website changes intact. The original resume bytes and all clean-site files are unchanged by the experiment.
