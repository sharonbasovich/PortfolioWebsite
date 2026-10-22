# Sharon Basovich's portfolio

This repository contains two static portfolios, deployed from `main` to separate Vercel projects.

| Version | Live URL | Vercel project | Root Directory | Output Directory |
| --- | --- | --- | --- | --- |
| Clean | https://sharonbasovich.vercel.app/ | `portfolio-website` | Repository root | `dist` |
| Creative | https://basovichsharon.vercel.app/ | `basovichsharon` | `dist/startup` | `.` |

Each project uses the `vercel.json` in its own root. The creative version includes its own résumé at `dist/startup/resume.pdf` and rendering libraries in `vendor/`. The earlier Next.js source remains in the repository for history and rollback.

Preview locally by serving `dist/` over HTTP. The main portfolio is at `/`, and the experimental version is at `/startup/`.

A separate Lusion-inspired portfolio is available at [basovichsharon.vercel.app/immersive/](https://basovichsharon.vercel.app/immersive/), with source in `dist/startup/immersive/`. Its procedural mechanical sculpture responds to pointer hits, opens into a sustained exploded view, and connects to a scroll-driven project sequence. Keyboard navigation, pause, reduced motion, WebGL recovery and a readable non-3D layout are supported. See [the refinement notes](docs/immersive-refinement.md) and the site's [source credits](https://basovichsharon.vercel.app/immersive/resources.html).

For the immersive page, run `python -m http.server 8790 --bind 127.0.0.1 --directory dist/startup` and open `http://127.0.0.1:8790/immersive/`. `python tools/motion-lab.py` adds local review fixtures on port8789; those development modules are outside Vercel's public output.
