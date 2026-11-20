# Creative portfolio

The source for basovichsharon.vercel.app is in `creative-site`. The existing Vercel project serves its static export from `dist/startup`.

Build the creative site from the repository root in PowerShell.

```powershell
Push-Location creative-site
npm ci
$env:PORTFOLIO_STATIC_EXPORT = '1'
npm run build
Pop-Location
node tools/update-creative-export.mjs creative-site/out
```

Review the updated `dist/startup` in a local static server before publishing. The packager leaves the approved resume downloads, legacy assets, and resources page in place. The watch study can be previewed at `/story` in the source app.

The release that replaced the former homepage can be reverted without changing the separate clean portfolio builds. The previous creative homepage is available in commit `2bdfeae`.
