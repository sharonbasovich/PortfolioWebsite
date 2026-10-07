# Sharon Basovich's portfolio

This repository contains two static portfolios, deployed from `main` to separate Vercel projects.

| Version | Live URL | Vercel project | Root Directory | Output Directory |
| --- | --- | --- | --- | --- |
| Clean | https://sharonbasovich.vercel.app/ | `portfolio-website` | Repository root | `dist` |
| Creative | https://basovichsharon.vercel.app/ | `basovichsharon` | `dist/startup` | `.` |

Each project uses the `vercel.json` in its own root. The creative version links to the clean site's shared résumé and includes its own rendering libraries in `vendor/`. The earlier Next.js source remains in the repository for history and rollback.

Preview locally by serving `dist/` over HTTP. The main portfolio is at `/`, and the experimental version is at `/startup/`.

