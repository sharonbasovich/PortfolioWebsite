# Lusion-inspired portfolio experiment

This is an additional version at `https://basovichsharon.vercel.app/immersive/`. The established creative homepage and clean portfolio keep their existing layouts and URLs.

## Direction and references

The live [Lusion homepage](https://lusion.co/) was inspected in the browser on October 8, 2026. The relevant qualities were its light editorial layout, oversized type, rounded visual stage, reflective sculptural objects, and strong scene-to-scene motion. This version uses an original watch-movement / robot-joint sculpture, reflecting Sharon's interest in horology and engineering.

The implementation follows the alignment pattern in Lusion's MIT-licensed [WebGL Scroll Sync source](https://github.com/lusionltd/WebGL-Scroll-Sync/blob/main/src/js/main.js): a single WebGL canvas maps its camera and viewport to measured DOM art windows. Scissors and rounded clipping prevent the rendering from covering adjacent copy. Each window remains a normal layout element, so typography, links, and native document scrolling work independently of the renderer.

Material research used Three.js's [MeshPhysicalMaterial documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html), its [clearcoat example](https://threejs.org/examples/webgl_materials_physical_clearcoat.html), and the [Codrops glass/plastic article](https://tympanus.net/codrops/2021/10/27/creating-the-effect-of-transparent-glass-and-plastic-in-three-js/). The scene uses the official Three.js 0.180.0 `RoomEnvironment` and `RoundedBoxGeometry` addons. Their source and license headers are retained under `vendor/three/addons/`.

No Lusion models, images, shaders, or other site assets were copied. `resources.html` provides public attribution and source links.

## Motion brief

The brief used for the scene: build an original, asymmetric mechanical assembly from cobalt enamel, chrome, ivory, and dark machined components; use physical lighting and small cursor responses; open into an exploded inspection on scroll; transition to concrete robot, balloon, and company-graph tableaux; close with an iris sculpture beside the invitation to talk. Keep readable text in HTML and allow deliberate holds before each project transition.

The motion-design, GSAP ScrollTrigger/timeline/performance, and frontend-design skills informed the sequencing and implementation. No separate paid harness or service is required. GSAP controls the scene-state transitions and desktop project track; Three.js owns rendering and resource cleanup.

## Runtime and fallbacks

- Desktop project panels travel horizontally within one pinned gallery, with reading holds before each transition.
- Smaller screens, reduced motion, and Pause motion use a natural vertical project layout.
- Pause tears down the GSAP context and pin spacing, restores ordinary document flow, and renders static chapter scenes on scroll.
- The renderer caps pixel ratio and mobile rendering rate, reuses geometries/materials, instances repeated nodes and fasteners, and stops rendering while the document is hidden.
- Without WebGL or JavaScript, content and navigation remain visible; the visual windows retain CSS backgrounds.
- The attached résumé is reused unchanged at `../resume.pdf`.

## Local preview and rollback

Browser verification covered 1280×720 desktop, 390×844 phone, and 780×900 tablet viewports. The hero interaction, robot and balloon scenes, contact iris, desktop pin, native mobile flow, and Pause/Enable motion transitions were exercised. Pause removed all pin spacers and preserved the active project and contact positions; no horizontal document overflow was observed. The résumé SHA-256 remains `797D80301EDBF6BE264CC5D02B093FB6FAB8567C71C5F0B5CEF6ED95D0C13288`.

JavaScript syntax checks and Git whitespace checks pass. The existing creative homepage source is unchanged by this experiment.

From the repository root:

```powershell
python -m http.server 8790 --bind 127.0.0.1 --directory dist/startup
```

Open `http://127.0.0.1:8790/immersive/`.

The pre-experiment baseline is commit `0e03f15d15f1008b024df0b986d8b183cb105430` and local branch `codex/creative-oct7-baseline`. Because the experiment lives in its own folder, the existing homepages do not require a rollback to keep their previous appearance.
