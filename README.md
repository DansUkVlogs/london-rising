# London Rising RP Website

Project version: `v1.1.0`

This repository contains the London Rising RP website, built as a static single-page site for a FiveM roleplay community.

## Stack

- HTML
- CSS
- Vanilla JavaScript (ES modules)
- JSON-driven content

## Run Locally

This site should be served over HTTP(S). Do not open `index.html` directly with `file://`, because the app loads page partials and JSON using `fetch()`.

Quick options:

```powershell
python -m http.server 8000
```

or

```powershell
npx serve .
```

Then open:

- `http://localhost:8000`

## Project Structure

- `index.html` - main app shell
- `pages/` - route loading stubs
- `assets/css/` - styling layers
- `assets/js/` - app logic and page controllers
- `assets/data/` - site content and config
- `assets/images/` - branding, hero, job, and placeholder images

## Main Routes

- `#/home`
- `#/civ-jobs`
- `#/crim-jobs`
- `#/police`
- `#/fire`
- `#/ambulance`
- `#/mechanic`
- `#/staff-structure`
- `#/rules`

## Documentation

Full technical documentation is available in [PROJECT_DOCUMENTATION.md](/C:/Users/danie/OneDrive/Coding/HTML/other/london-rising/PROJECT_DOCUMENTATION.md).

## Notes

- The site uses cache-busting query strings on CSS and JS assets.
- Some or all images used across the website are AI-generated or AI-assisted.
- AI was also used to assist with development of the website.
