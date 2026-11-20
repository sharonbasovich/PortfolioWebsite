# Sharon Basovich · Giats portfolio preview

Separate personal portfolio preview, adapted from **giats.me**, designed and developed by [Evangelos Giatsidis](https://giats.me/). The original [source](https://github.com/Giats2498/giats-portfolio) and its copyright notice are retained under the terms in LICENSE. This adaptation uses Sharon's portfolio details, links and project evidence.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 8073
```

Open [the Giats portfolio](http://127.0.0.1:8073/) or [the watch story](http://127.0.0.1:8073/story). Both previews run in the same application.

## Interaction pass

- Sweep through the hero to scatter the spheres or drag and release one to throw it. The keyboard controls work when the scene has focus.
- On wider screens the internship badge stays in view while the right-hand column scrolls from RBC to Magna. The badge turns over to reveal the second employer. Each face and strap uses the corresponding company branding. Phone layouts pair each badge with its job description.
- Move the pointer through Sharon’s name or the contact heading to disturb the grains. The footer also includes the curved email underline, animated links and a return-to-top control.
- Project cards open the live project inside the portfolio. Back restores the previous scroll position and keyboard focus. The window also offers a direct link.
- The watch story follows an original Three.js movement through assembly, close-up, and exploded views. Open the movement to inspect its barrel, bridge, and balance. The RBC and Magna chapters include a data-flow diagram and an interactive lever calculation. Static renders support reduced motion and browsers without WebGL.
- The header follows Sharon's existing creative portfolio navigation, with a one-click light/dark toggle. Light remains the initial theme.

Touch gestures retain native vertical scrolling. The shared canvas does not capture the document's touch events.

### Sources

Badge physics and drag mapping follow [Paul Henschel's Vercel guide](https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber). The badge artwork and geometry were created for this adaptation.

Particle flow and pointer-repulsion formulas are adapted from [Imfem Ambocus's MIT portfolio](https://github.com/imfemambocus/portfolio). Its notice is retained in [public/sharon/PARTICLE-NOTICE.txt](public/sharon/PARTICLE-NOTICE.txt).

### Verification

The production build passes. Chrome viewport checks covered 320×740, 390×844, 768×1024, 1024×600, 1366×768, and 1920×1080. The interaction pass checked mouse dragging, forward/reverse internship scrolling, one-click theme switching, navigation from a project page back to an anchored section, native touch swipes after the intro, and the reduced-motion contact fallback. No JavaScript page errors were reported. Phone checks use browser emulation rather than physical devices.
