# Sharon Basovich's portfolio

This repository deploys three Vercel projects from `main`. The two clean sites share one HTML template, styles, scripts, and assets. Their resume downloads and dates are specific to each version. Both include Abstract, and `sharonb` also lists Eigenvale.

| Version | Live URL | Vercel project | Root Directory | Output Directory | Resume variant |
| --- | --- | --- | --- | --- | --- |
| Clean | https://sharonbasovich.vercel.app/ | `portfolio-website` | Repository root | `dist` | `sharonbasovich` (default) |
| Clean, current resume | https://sharonb.vercel.app/ | `sharonb` | Repository root | `dist` | `sharonb` |
| Creative | https://basovichsharon.vercel.app/ | `basovichsharon` | `dist/startup` | `.` | Separate startup resume |

Each project uses the `vercel.json` in its own root. The clean projects run the dependency-free `node tools/select-resume.mjs` build step, which generates `dist/index.html`, `dist/Sharon_Basovich_Resume.pdf`, and its `dist/resume.pdf` compatibility alias. All remaining static files come from the same `dist/` source and are unchanged by the selector.

Edit common clean-site markup in `templates/clean-index.html`, rather than the generated `dist/index.html`. Enclose the Eigenvale entry in exactly one ordered `<!-- eigenvale:start -->` / `<!-- eigenvale:end -->` comment pair. The selector validates the pair before writing output, removes that block for `sharonbasovich`, retains it for `sharonb`, and strips the marker comments from both generated versions. All other template markup is preserved exactly; the template itself is never modified during selection.

For dates that differ between the clean portfolios, wrap the relevant lines in `<!-- variant:sharonbasovich -->` and `<!-- /variant:sharonbasovich -->` or the equivalent `sharonb` pair. Put each comment on its own line. The selector keeps the matching block and strips the comments.

Set `PORTFOLIO_RESUME_VARIANT=sharonb` on the `sharonb` Vercel project for Production and Preview environments. Development may use the same value. The existing `portfolio-website` project defaults to `sharonbasovich`; it may also set that value explicitly. Unknown or empty values fail the build instead of silently choosing a resume. Selection is project-based, so generated deployment and branch-preview URLs serve the same variant as their project without hostname matching.

The selector reads `resumes/Sharon_Basovich_Resume.pdf` for `sharonbasovich` and `resumes/Sharon_Basovich_Resume_Current.pdf` for `sharonb`. Replace the appropriate approved source when refreshing a resume. Keep the two source files distinct. A build reads the selected PDF once and writes identical bytes to both public download paths.

The creative project still serves static files without a build step and includes its own resume at `dist/startup/Basovich_Sharon_Resume.pdf` (`resume.pdf` remains a compatibility URL) and rendering libraries in `vendor/`. Its configuration and downloads are independent of the clean-site selector. The earlier Next.js source remains in the repository for history and rollback; do not run its build over the maintained static output.

Preview locally by serving `dist/` over HTTP. The clean portfolio is at `/`, and the creative portfolio is at `/startup/`. Before a clean-site preview, run the selector with the desired environment value to generate its homepage and two root PDF files.

The Lusion-inspired creative portfolio is the single homepage at [basovichsharon.vercel.app](https://basovichsharon.vercel.app/), with its editable HTML in `dist/startup/index.html` and modules, styles, and assets in `dist/startup/experience/`. Its procedural mechanical sculpture responds to pointer hits, opens into a sustained exploded view, and connects to a scroll-driven project sequence. Keyboard navigation, pause, reduced motion, WebGL recovery and a readable non-3D layout are supported. The former `/immersive/` page redirects permanently to `/`. See [the source and route guide](docs/startup-homepage.md) and the site's [source credits](https://basovichsharon.vercel.app/resources.html).

For the creative site, run `python -m http.server 8790 --bind 127.0.0.1 --directory dist/startup` and open `http://127.0.0.1:8790/`. `python tools/motion-lab.py` adds local review fixtures and legacy-redirect behavior on port8789; those development modules are outside Vercel's public output.
