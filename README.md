# London Rising RP Website

Project version: `v1.1.0`  
README revision: `v1.1.0`  
Last updated: `29 May 2026`

This repository contains the London Rising RP website, built as a static single-page site for a FiveM roleplay community.

## Stack

- HTML
- CSS
- Vanilla JavaScript (ES modules)
- JSON-driven content

## Run Locally

This site should be served over HTTP(S). Do not open `index.html` directly with `file://`, because the app loads page partials and JSON using `fetch()`.

Recommended for local development:

```powershell
node dev-server.mjs
```

Then open:

- `http://localhost:3000`

Other static server options:

```powershell
python -m http.server 8000
```

or

```powershell
npx serve .
```

Then open:

- `http://localhost:8000`

The live status card now uses FiveM's CORS-enabled `frontend.cfx-services.net` endpoint directly from the browser, so it works on plain static servers too.

## Project Structure

- `index.html` - main app shell
- `pages/` - route loading stubs
- `assets/css/` - styling layers
- `assets/js/` - app logic and page controllers
- `assets/data/` - site content and config
- `assets/images/` - branding, hero, job, and placeholder images

## Page Overview

- `#/home` - landing page with the main hero, join/rules buttons, live server status, restart countdown, community/about panel, restart schedule, and career path cards.
- `#/civ-jobs` - civilian jobs page with a hero section, job cards, modal job details, and supporting pillar panels.
- `#/crim-jobs` - criminal activities page with a hero section, activity cards, modal details, and supporting pillar panels.
- `#/police` - police department page with hero CTAs, divisions, requirements, progression preview, value cards, and modal detail views.
- `#/fire` - fire brigade page with hero CTAs, divisions, requirements, progression preview, value cards, and modal detail views.
- `#/ambulance` - ambulance service page with hero CTAs, divisions, requirements, progression preview, value cards, and modal detail views.
- `#/mechanic` - mechanic/workshop page with hero CTAs, divisions, requirements, progression preview, value cards, and modal detail views.
- `#/staff-structure` - interactive staff hierarchy page with a hero, zoomable org chart, shared reporting connectors, and profile modals.
- `#/rules` - rules page with a hero, sidebar navigation, agreement card, and full rule sections.

External navigation:

- `Discord` - opens the community Discord in a new tab.
- `Join the City` - opens the FiveM join link in a new tab.

## Documentation

Full technical documentation is available in [PROJECT_DOCUMENTATION.md](/C:/Users/danie/OneDrive/Coding/HTML/other/london-rising/PROJECT_DOCUMENTATION.md).

## Notes

- The site uses cache-busting query strings on CSS and JS assets.
- Some or all images used across the website are AI-generated or AI-assisted.
- AI was also used to assist with development of the website.
