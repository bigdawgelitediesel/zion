# zion

Family pitch site: move from Utah to Cheyenne, Wyoming, buy land together, build next to each other, raise cattle and chickens.

- **Live:** https://the-home-place.vercel.app (also zion-nine-fawn.vercel.app)
- **Name:** The Home Place (never "Zion," never "compound")
- **Reasons list:** `250-reasons-utah-to-cheyenne.md` (source of truth; regenerate `site/reasons.js` from it, see below)
- **Site:** `site/` (static HTML/CSS/JS, no build step)

## Editing

- Names, contact email/phone, and every calculator default: `site/config.js`
- Page copy: `site/index.html`
- Reasons: edit the markdown, then from `site/` run the one-liner in `site/README-regen.txt`
- Deploy: `cd site && vercel deploy --prod --yes` (the-home-place.vercel.app is a project domain, so it follows production automatically; if it ever lags, run `vercel alias set <deployment-url> the-home-place.vercel.app`)
