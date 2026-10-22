// Served only by the local review server, never from Vercel's output directory.
export function installReview(api) {
  window.__portfolioReview = Object.freeze(api);
}
