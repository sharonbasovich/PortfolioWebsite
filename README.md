# Sharon Basovich's portfolio

This repository contains two static portfolios, deployed from `main` to separate Vercel projects.

| Version | Live URL | Vercel project | Root Directory | Output Directory |
| --- | --- | --- | --- | --- |
| Clean | https://sharonbasovich.vercel.app/ | `portfolio-website` | Repository root | `dist` |
| Creative | https://basovichsharon.vercel.app/ | `basovichsharon` | `dist/startup` | `.` |

Each project uses the `vercel.json` in its own root and serves static files without a build step. The creative version includes its own résumé at `dist/startup/Basovich_Sharon_Resume.pdf` (`resume.pdf` remains a compatibility URL) and rendering libraries in `vendor/`. The earlier Next.js source remains in the repository for history and rollback; do not run its build over the maintained static output.

Preview both locally by serving `dist/` over HTTP. The clean portfolio is at `/`, and the creative portfolio is at `/startup/`.

The Lusion-inspired creative portfolio is the single homepage at [basovichsharon.vercel.app](https://basovichsharon.vercel.app/), with its editable HTML in `dist/startup/index.html` and modules, styles, and assets in `dist/startup/experience/`. Its procedural mechanical sculpture responds to pointer hits, opens into a sustained exploded view, and connects to a scroll-driven project sequence. Keyboard navigation, pause, reduced motion, WebGL recovery and a readable non-3D layout are supported. The former `/immersive/` page redirects permanently to `/`. See [the source and route guide](docs/startup-homepage.md) and the site's [source credits](https://basovichsharon.vercel.app/resources.html).

For the creative site, run `python -m http.server 8790 --bind 127.0.0.1 --directory dist/startup` and open `http://127.0.0.1:8790/`. `python tools/motion-lab.py` adds local review fixtures and legacy-redirect behavior on port8789; those development modules are outside Vercel's public output.
