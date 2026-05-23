# London Rising RP Project Documentation

Project version: `v1.1.0`  
Documentation revision: `v1.1.0`  
Last updated: `23 May 2026`

## What This Project Is

This repository contains the London Rising RP website: a static, browser-run single-page application for a FiveM roleplay community.

The project does not use a framework or build tool. It runs directly in the browser using:

- one shell document: `index.html`
- hash routing such as `#/home` and `#/rules`
- HTML page stubs in `pages/`
- ES module JavaScript in `assets/js/`
- content/config JSON in `assets/data/`
- images in `assets/images/`

The hidden `.git/` folder exists for version control, but it is not part of runtime behavior, so it is only acknowledged at a folder level and not documented file-by-file.

## High-Level Architecture

### Boot Flow

1. `index.html` loads Google Fonts, all CSS files, the app shell markup, and `assets/js/main.js?v=...`.
2. `assets/js/main.js` imports `AppShell` and `JsonLoader` using cache-busting query strings.
3. `main.js` loads `assets/data/site/site-config.json` and `assets/data/site/branding.json`.
4. `main.js` creates `AppShell` and calls `init()`.
5. `AppShell`:
   - caches shell DOM references
   - renders desktop and mobile navigation
   - applies branding/footer/disclaimer text
   - mounts the mobile menu
   - mounts the route loader
   - sets up reveal animations
   - writes the current year into the footer
6. `PageLoader` reads the current hash, fetches the matching page partial from `pages/`, and creates the correct page controller.
7. The page controller loads its JSON data, renders the real page markup into `main[data-page-host]`, and binds any page-specific behavior.

### Versioned Asset Loading

The current project uses manual cache-busting query strings on CSS and JS module imports, for example:

- `assets/css/pages.css?v=20260523ac`
- `assets/js/main.js?v=20260523ac`
- module imports like `./rules-page-controller.js?v=20260523ac`

This pattern lets the site force browsers to reload changed assets after updates without introducing a build pipeline.

### Routing Model

Routing is driven by `assets/data/site/site-config.json`.

Internal routes define:

- `id`
- `label`
- `hash`
- `partial`
- `pageType`
- `dataFolder`

External links such as Discord and Join define:

- `id`
- `label`
- `href`
- `newTab`
- optional `buttonStyle`

The site uses hash-based routing only. There is no server-side route handling.

### Rendering Pattern

Every internal page follows the same pattern:

1. Load the route stub from `pages/...`.
2. Find the page root and its `data-*` marker.
3. Instantiate the page controller based on `pageType`.
4. Load JSON from the route's `dataFolder`.
5. Render full markup with template strings.
6. Mount helpers such as:
   - modals
   - countdowns
   - polling
   - sidebar sync
   - viewport controls
   - connector overlays

### Styling Layers

The CSS is intentionally split into layers:

- `assets/css/tokens.css`: variables and design tokens
- `assets/css/base.css`: reset, body/background, accessibility helpers
- `assets/css/layout.css`: app shell layout
- `assets/css/components.css`: shared reusable components
- `assets/css/pages.css`: page-specific layouts and feature systems

### Data Model

Content is mostly data-driven:

- site-wide branding and routing in `assets/data/site/`
- home content in `assets/data/home/`
- jobs/crime/rules/staff content in their own folders
- department content in `assets/data/departments/<department>/`
- server status and restart schedule in `assets/data/server/`

### Image Usage

Most images are not placed directly in HTML. Controllers typically:

1. read a path from JSON
2. convert it with `toAssetUrl()` or `toCssImageUrl()`
3. write it into an image `src` or CSS custom property
4. let CSS render it as a hero background, card background, or avatar

### Runtime Notes

- The app relies on `fetch()` for HTML partials and JSON, so it should be served over HTTP(S), not opened via `file://`.
- `JsonLoader` keeps an in-memory cache for the current browser session.
- `PageLoader` protects against stale route fetches using a request id counter.
- Live server status depends on the public FiveM server API when `liveSource.provider` is `fivem`.

## Current Route Map

| Route ID | Hash | Partial | Controller | Data Folder |
| --- | --- | --- | --- | --- |
| `home` | `#/home` | `pages/home.html` | `HomePageController` | `assets/data/home` |
| `civ-jobs` | `#/civ-jobs` | `pages/civ-jobs.html` | `CivJobsPageController` | `assets/data/civ-jobs` |
| `crim-jobs` | `#/crim-jobs` | `pages/crim-jobs.html` | `CrimJobsPageController` | `assets/data/crim-jobs` |
| `police` | `#/police` | `pages/police.html` | `DepartmentPageController` | `assets/data/departments/police` |
| `fire` | `#/fire` | `pages/fire.html` | `DepartmentPageController` | `assets/data/departments/fire` |
| `ambulance` | `#/ambulance` | `pages/ambulance.html` | `DepartmentPageController` | `assets/data/departments/ambulance` |
| `mechanic` | `#/mechanic` | `pages/mechanic.html` | `DepartmentPageController` | `assets/data/departments/mechanic` |
| `staff-structure` | `#/staff-structure` | `pages/staff-structure.html` | `StaffStructurePageController` | `assets/data/staff-structure` |
| `rules` | `#/rules` | `pages/rules.html` | `RulesPageController` | `assets/data/rules` |
| `discord` | external | none | none | none |
| `join` | external | none | none | none |

## Folder Structure

Hidden folder:

- `.git/`: Git repository metadata and history.

Runtime tree:

```text
.
|   index.html
|   PROJECT_DOCUMENTATION.md
|
+---assets
|   +---css
|   +---data
|   |   +---civ-jobs
|   |   +---crim-jobs
|   |   +---departments
|   |   |   +---ambulance
|   |   |   +---fire
|   |   |   +---mechanic
|   |   |   \---police
|   |   +---home
|   |   +---rules
|   |   +---server
|   |   +---site
|   |   \---staff-structure
|   +---images
|   |   +---branding
|   |   +---heroes
|   |   +---opportunities
|   |   \---placeholders
|   \---js
\---pages
```

## Page-By-Page Breakdown

### `#/home`

Purpose:

- landing page and main entry point into the site

What it displays:

- the primary London Rising hero
- main CTA buttons for joining the city and reading the rules
- a live server status card
- a live restart countdown card
- an about/community panel
- a restart schedule panel populated from server schedule data
- a career path card grid linking into departments and role paths

What it does:

- loads content from `assets/data/home/*`
- loads live/fallback server data from `assets/data/server/server-status.json`
- mounts `ServerStatus`
- mounts `RestartCountdown`

### `#/civ-jobs`

Purpose:

- showcases civilian job paths available on the server

What it displays:

- a civilian jobs hero section
- a rail of clickable job cards with images, numbers, summaries, and tags
- modal detail views for each job
- supporting pillar panels underneath the cards

What it does:

- loads hero, jobs, and pillar content from `assets/data/civ-jobs/`
- opens `JobDetailModal` when a job card is clicked or keyboard-activated

### `#/crim-jobs`

Purpose:

- showcases criminal activity paths and underground roleplay opportunities

What it displays:

- a criminal activities hero section
- clickable activity cards with images, numbers, summaries, and tags
- modal detail views for each activity
- supporting pillar panels underneath the cards

What it does:

- loads hero, activities, and pillar content from `assets/data/crim-jobs/`
- opens `JobDetailModal` for each activity

### `#/police`

Purpose:

- presents the police department route and recruitment/progression information

What it displays:

- a police hero with CTA buttons
- a divisions preview panel
- a requirements preview panel
- a progression preview panel
- a grid of police value cards
- modals for full divisions, full requirements, and full progression

What it does:

- loads data from `assets/data/departments/police/`
- uses the shared `DepartmentPageController`

### `#/fire`

Purpose:

- presents the fire brigade route and department structure

What it displays:

- a fire brigade hero with CTA buttons
- a divisions preview panel
- a requirements preview panel
- a progression preview panel
- a grid of fire value cards
- modals for full divisions, full requirements, and full progression

What it does:

- loads data from `assets/data/departments/fire/`
- uses the shared `DepartmentPageController`

### `#/ambulance`

Purpose:

- presents the ambulance service route and medical department structure

What it displays:

- an ambulance hero with CTA buttons
- a divisions preview panel
- a requirements preview panel
- a progression preview panel
- a grid of ambulance value cards
- modals for full divisions, full requirements, and full progression

What it does:

- loads data from `assets/data/departments/ambulance/`
- uses the shared `DepartmentPageController`

### `#/mechanic`

Purpose:

- presents the mechanic/workshop route and business/progression structure

What it displays:

- a mechanic hero with CTA buttons
- a divisions preview panel
- a requirements preview panel
- a progression preview panel
- a grid of mechanic value cards
- modals for full divisions, full requirements, and full progression

What it does:

- loads data from `assets/data/departments/mechanic/`
- uses the shared `DepartmentPageController`

### `#/staff-structure`

Purpose:

- displays the current staff hierarchy and reporting structure

What it displays:

- a staff hero section
- a chart heading with section label, title, description, and helper pill
- a zoomable and pannable chart canvas
- section cards and staff profile cards
- shared-parent connector lines
- a profile modal for deeper staff information

What it does:

- loads hero and chart data from `assets/data/staff-structure/`
- normalizes flat or nested staff structures
- mounts `StaffChartViewport`
- mounts `StaffSharedConnectors`
- mounts `StaffProfileModal`

### `#/rules`

Purpose:

- presents the server rulebook in a navigable long-form layout

What it displays:

- a rules hero section
- a sidebar card with title text
- rule-category navigation buttons
- an agreement card with a generated justice-badge icon
- full rule sections and rule items in the main content column

What it does:

- loads hero, rule data, and layout config from `assets/data/rules/`
- mounts `RulesAccordion`
- keeps the sidebar active state synced with the visible rule section

### External Navigation Items

These are not internal pages, but they are part of the visible navigation:

- `Discord` - opens the Discord server in a new tab
- `Join the City` - opens the FiveM join link in a new tab

## Root File

### `index.html`

Purpose:

- the main and only full HTML document
- permanent shell around all routed content

What it contains:

- Google font links
- versioned CSS links with `?v=...`
- header brand and desktop nav container
- mobile menu trigger and drawer
- route host: `main[data-page-host]`
- footer brand and tagline
- footer disclaimer row
- footer closing/copyright bar
- versioned `main.js` module import

Important hooks:

- `data-site-nav`
- `data-mobile-nav`
- `data-page-host`
- `data-menu-toggle`
- `data-menu-close`
- `data-mobile-drawer`
- `data-mobile-backdrop`
- `data-footer-tagline`
- `data-footer-disclaimer`
- `data-footer-closing-line`
- `data-current-year`

## `pages/` Folder

Each file in `pages/` is a lightweight loading stub. The controller for that route replaces it with real content.

### `pages/home.html`

- loading stub for the home route
- marks the page with `data-home-page`

### `pages/civ-jobs.html`

- loading stub for the civilians route
- marks the page with `data-civ-jobs-page`

### `pages/crim-jobs.html`

- loading stub for the criminals route
- marks the page with `data-crim-jobs-page`

### `pages/police.html`

- loading stub for the police route
- uses `data-department-page` and `data-department="police"`

### `pages/fire.html`

- loading stub for the fire route
- uses `data-department-page` and `data-department="fire"`

### `pages/ambulance.html`

- loading stub for the ambulance route
- uses `data-department-page` and `data-department="ambulance"`

### `pages/mechanic.html`

- loading stub for the mechanic route
- uses `data-department-page` and `data-department="mechanic"`

### `pages/staff-structure.html`

- loading stub for the staff route
- marks the page with `data-staff-structure-page`

### `pages/rules.html`

- loading stub for the rules route
- marks the page with `data-rules-page`

## `assets/css/` Folder

### `assets/css/tokens.css`

Purpose:

- central design token file

Defines:

- font families
- base colors
- gradients
- shadows
- border radii
- layout width
- transition speeds
- header height

### `assets/css/base.css`

Purpose:

- global reset and browser baseline

Defines:

- box-sizing reset
- page background and overlay textures
- default element resets
- selection color
- skip-link and screen-reader-only helpers
- reduced-motion behavior

### `assets/css/layout.css`

Purpose:

- shell layout only

Defines:

- sticky header
- centered site width rules
- page-host loading/ready transitions
- mobile drawer positioning
- backdrop behavior
- footer shell layout
- desktop/mobile nav visibility rules

### `assets/css/components.css`

Purpose:

- reusable components shared across routes

Main areas:

- brand/logo block
- nav links
- drawer buttons
- generic buttons
- panels
- section labels and titles
- pills
- status row
- metric cards
- countdown
- footer nav styles
- reveal utility

### `assets/css/pages.css`

Purpose:

- page-specific systems and larger feature styling

Main systems now covered:

- home hero layout
- generic section heroes
- job cards
- job modals
- department pages
- department progression tree
- rules sidebar card
- rules agreement card
- hero particle trail
- staff chart canvas
- staff node cards
- staff shared connectors
- staff modal
- responsive rules for all of the above

## `assets/js/` Folder

### `assets/js/main.js`

Purpose:

- application entry point

Behavior:

- imports `AppShell` and `JsonLoader` with cache-busting query strings
- loads site config and branding config
- creates `AppShell`
- calls `appShell.init()`

### `assets/js/app-shell.js`

Purpose:

- top-level application shell controller

Classes and methods:

- `StaticPageController.mount()`: no-op fallback async mount.
- `StaticPageController.destroy()`: no-op fallback destroy.
- `AppShell.constructor({ siteConfig, brandingConfig, dataLoader })`: stores global config and shared helpers.
- `AppShell.init()`: starts the shell lifecycle.
- `AppShell.cacheElements()`: caches shared shell DOM elements.
- `AppShell.isPageRoute(route)`: checks whether a route is an internal routed page.
- `AppShell.buildSiteLink(route, baseClass)`: builds nav link markup for a route.
- `AppShell.renderNavigation()`: renders desktop, mobile, and footer nav links.
- `AppShell.applyBranding()`: writes brand text, footer copy, disclaimer text, meta description, and logo paths into the shell.
- `AppShell.mountMobileMenu()`: creates and mounts `MobileMenu`.
- `AppShell.mountPageLoader()`: creates and starts `PageLoader`.
- `AppShell.createController(route, root)`: chooses the correct page controller for the current route.
- `AppShell.setupRevealObserver()`: builds the global reveal animation observer.
- `AppShell.refreshRevealTargets(root)`: marks current route blocks as reveal targets.
- `AppShell.setCurrentYear()`: writes the current year into footer elements.

### `assets/js/page-loader.js`

Purpose:

- route loader and controller switcher

Methods:

- `PageLoader.constructor(...)`: stores route data, callbacks, and current controller state.
- `PageLoader.start()`: starts hash routing and redirects to the default route when needed.
- `PageLoader.destroy()`: removes listeners and destroys the active controller.
- `PageLoader.handleHashChange()`: reloads the route on hash changes.
- `PageLoader.loadCurrentRoute()`: resolves the route, fetches the partial, mounts the controller, updates active links, and handles errors.
- `PageLoader.updateActiveLinks(activeRouteId)`: writes `aria-current` on active links.
- `PageLoader.getDefaultHash()`: returns the configured default hash.
- `PageLoader.parseRouteId(hashValue)`: converts the location hash into a route id.

### `assets/js/json-loader.js`

Purpose:

- JSON fetch helper with in-memory caching

Methods:

- `JsonLoader.constructor()`: creates the cache map.
- `JsonLoader.load(path)`: fetches one JSON file and caches the parsed value.
- `JsonLoader.loadAll(paths)`: loads several JSON files in parallel and returns them in order.
- `JsonLoader.loadNamed(pathMap)`: loads several JSON files in parallel and returns them under named keys.

### `assets/js/asset-url.js`

Purpose:

- asset path conversion helpers

Functions:

- `toAssetUrl(assetPath)`: converts a relative asset path to an absolute URL.
- `toCssImageUrl(assetPath)`: wraps `toAssetUrl()` in a CSS `url("...")` string.

### `assets/js/link-utils.js`

Purpose:

- anchor attribute builder

Functions:

- `buildLinkAttributes(linkConfig = {})`: builds `href`, and when needed, `target="_blank" rel="noopener noreferrer"`.

### `assets/js/mobile-menu.js`

Purpose:

- off-canvas mobile drawer controller

Methods:

- `MobileMenu.constructor({ toggleButton, closeButton, drawer, backdrop })`: stores elements and binds handlers.
- `MobileMenu.init()`: attaches listeners.
- `MobileMenu.destroy()`: removes listeners.
- `MobileMenu.open()`: opens the drawer and traps focus.
- `MobileMenu.close({ returnFocus = true } = {})`: closes the drawer and optionally restores focus.
- `MobileMenu.handleToggle()`: toggles open state.
- `MobileMenu.handleClose()`: closes the drawer.
- `MobileMenu.handleViewportChange()`: closes the drawer when moving back to desktop width.
- `MobileMenu.handleKeydown(event)`: handles `Escape` and `Tab`.
- `MobileMenu.focusFirstElement()`: focuses the first focusable item in the drawer.
- `MobileMenu.trapFocus(event)`: keeps focus inside the drawer.
- `MobileMenu.getFocusableElements()`: returns focusable elements inside the drawer.

### `assets/js/style-utils.js`

Purpose:

- inline style attribute helpers

Functions:

- `escapeHtmlAttribute(value)`: escapes unsafe characters for HTML attributes.
- `buildStyleAttribute(propertyMap = {})`: converts a property map into a safe `style="..."` attribute string.

### `assets/js/home-page-controller.js`

Purpose:

- renders the home page and mounts home-only helpers

Methods:

- `HomePageController.constructor(root, dataLoader, route)`: stores page state and helper references.
- `HomePageController.mount()`: loads home JSON plus server JSON, renders the page, applies the hero image, and mounts `ServerStatus` and `RestartCountdown`.
- `HomePageController.destroy()`: destroys the home helpers.
- `HomePageController.applyHeroImage(imagePath)`: sets or clears the home hero image variable.
- `HomePageController.buildDepartmentCardStyle(card)`: builds the inline accent style for homepage career cards.
- `HomePageController.render(pageData)`: renders the full home route markup.

### `assets/js/server-status.js`

Purpose:

- powers the live status card on the home page

Methods:

- `ServerStatus.constructor(root, serverData)`: stores server config, animation state, and last known player cap.
- `ServerStatus.mount()`: renders the schedule, applies fallback/live-loading status, and starts `FiveMStatusPoller` when configured.
- `ServerStatus.destroy()`: stops polling and cancels running animations.
- `ServerStatus.setText(selector, value)`: writes a string into a matched element.
- `ServerStatus.renderSchedule()`: renders the restart schedule list.
- `ServerStatus.applyStatus(nextStatus, options = {})`: updates the status card and animates player count changes.
- `ServerStatus.animateMetric(selector, targetValue, duration)`: animates a numeric DOM value.
- `ServerStatus.parseMetricValue(value)`: extracts the numeric value from existing text.
- `ServerStatus.easeOutCubic(value)`: easing function for number animation.

### `assets/js/fivem-status-poller.js`

Purpose:

- polls the public FiveM API for live server status

Methods:

- `FiveMStatusPoller.constructor(liveSourceConfig = {}, callbacks = {})`: stores config and callbacks.
- `FiveMStatusPoller.start()`: starts polling when the config is valid.
- `FiveMStatusPoller.destroy()`: aborts requests and cancels timers.
- `FiveMStatusPoller.poll()`: performs one API request and schedules the next one.
- `FiveMStatusPoller.buildSummary(server)`: returns the FiveM hostname or a fallback summary.

### `assets/js/restart-countdown.js`

Purpose:

- powers the restart countdown card on the home page

Methods:

- `RestartCountdown.constructor(root, restartTimes, timezoneLabel)`: stores countdown configuration.
- `RestartCountdown.mount()`: performs the first render and starts the interval timer.
- `RestartCountdown.destroy()`: clears the interval timer.
- `RestartCountdown.update()`: computes the next restart and updates the DOM.
- `RestartCountdown.setValue(selector, value)`: writes a zero-padded countdown value.
- `RestartCountdown.getNextRestart(now)`: finds the next restart today or rolls over to tomorrow.
- `RestartCountdown.formatTargetLabel(now, target)`: formats the “Today/Tomorrow | HH:MM TZ” label.

### `assets/js/civ-jobs-page-controller.js`

Purpose:

- renders the civilians page and opens job details in a modal

Methods:

- `CivJobsPageController.constructor(root, dataLoader, route)`: stores dependencies and creates `JobDetailModal`.
- `CivJobsPageController.mount()`: loads page JSON, builds a job lookup, renders the route, applies hero settings, mounts the modal, and binds events.
- `CivJobsPageController.destroy()`: removes listeners and destroys the modal.
- `CivJobsPageController.applyHeroSettings(heroConfig = {})`: writes hero background image and position variables.
- `CivJobsPageController.buildJobStyle(job)`: builds inline image/accent styles for a job card.
- `CivJobsPageController.bindEvents()`: attaches click and keyboard listeners to the page root.
- `CivJobsPageController.handleRootClick(event)`: opens a job when a trigger is clicked.
- `CivJobsPageController.handleRootKeydown(event)`: opens a job for keyboard activation.
- `CivJobsPageController.openJob(jobId)`: looks up the selected job and opens the modal.
- `CivJobsPageController.renderJobCard(job)`: renders one civilian job card.
- `CivJobsPageController.render(pageData)`: renders the full civilians page.

### `assets/js/crim-jobs-page-controller.js`

Purpose:

- renders the criminals page and opens activity details in a modal

Methods:

- `CrimJobsPageController.constructor(root, dataLoader, route)`: stores dependencies and creates `JobDetailModal`.
- `CrimJobsPageController.mount()`: loads page JSON, builds an activity lookup, renders the route, applies hero settings, mounts the modal, and binds events.
- `CrimJobsPageController.destroy()`: removes listeners and destroys the modal.
- `CrimJobsPageController.applyHeroSettings(heroConfig = {})`: writes crime hero background image and position variables.
- `CrimJobsPageController.buildActivityStyle(activity)`: builds inline image/accent styles for an activity card.
- `CrimJobsPageController.bindEvents()`: attaches click and keyboard listeners.
- `CrimJobsPageController.handleRootClick(event)`: opens an activity when clicked.
- `CrimJobsPageController.handleRootKeydown(event)`: opens an activity for keyboard activation.
- `CrimJobsPageController.openActivity(activityId)`: finds the activity and opens the modal.
- `CrimJobsPageController.render(pageData)`: renders the full criminals page.

### `assets/js/job-detail-modal.js`

Purpose:

- reusable modal for civilians and criminals cards

Methods:

- `JobDetailModal.constructor()`: initializes modal state.
- `JobDetailModal.mount()`: creates the modal DOM, close handlers, and Escape handling.
- `JobDetailModal.destroy()`: removes the modal and global listeners.
- `JobDetailModal.open(item, options = {})`: fills the modal with item data and opens it.
- `JobDetailModal.close({ restoreFocus = true } = {})`: closes the modal and optionally restores focus.
- `JobDetailModal.toParagraphs(text)`: splits text into paragraph blocks.

### `assets/js/department-page-controller.js`

Purpose:

- shared controller for Police, Fire, Ambulance, and Mechanic pages

Methods:

- `DepartmentPageController.constructor(root, departmentKey, dataLoader, route)`: stores route state and modal state.
- `DepartmentPageController.mount()`: loads department JSON, applies hero imagery, renders the page, mounts the modal shell, and binds interactions.
- `DepartmentPageController._mountModal()`: creates the reusable body-level department modal container.
- `DepartmentPageController._getProgressionPreview(progression)`: extracts a unique list of rank names from the nested progression tree.
- `DepartmentPageController._bindEvents(divisions, requirements, progression)`: wires buttons and close behavior.
- `DepartmentPageController._openModal(contentHtml)`: injects modal content and opens the modal.
- `DepartmentPageController._closeModal()`: closes the modal and restores scrolling.
- `DepartmentPageController._openDivisionsModal(divisions)`: renders the full divisions modal.
- `DepartmentPageController._openRequirementsModal(requirements)`: renders the full requirements modal.
- `DepartmentPageController._openProgressionModal(progression)`: renders the interactive progression tree modal.
- `DepartmentPageController._renderTreeNode(node)`: recursively renders progression tree nodes.
- `DepartmentPageController._initCanvasInteraction(focusId = null)`: adds drag, zoom, and fit controls to the progression canvas.
- `DepartmentPageController.destroy()`: removes listeners, restores body state, and deletes the modal root.

### `assets/js/rules-page-controller.js`

Purpose:

- renders the rules route shell and mounts `RulesAccordion`

Methods:

- `RulesPageController.constructor(root, dataLoader, route)`: stores page state.
- `RulesPageController.mount()`: loads `hero.json`, `rules.json`, and `layout.json`, applies hero imagery, renders the shell, creates `RulesAccordion`, and mounts it.
- `RulesPageController.destroy()`: destroys the accordion helper.
- `RulesPageController.applyHeroImage(imagePath)`: sets or clears the rules hero image variable.

### `assets/js/rules-accordion.js`

Purpose:

- renders the rules sidebar and content column

Methods:

- `RulesAccordion.constructor(root, rulesData, layoutData = {})`: stores rule data, layout data, and event bindings.
- `RulesAccordion.mount()`: renders the UI, attaches click handling, and starts the section observer.
- `RulesAccordion.destroy()`: removes listeners and disconnects the observer.
- `RulesAccordion.render()`: renders the sidebar card, rules nav, agreement card, and rule sections.
- `RulesAccordion.renderAgreementIcon()`: returns the SVG badge markup for supported icon types.
- `RulesAccordion.handleClick(event)`: handles rule-nav button clicks.
- `RulesAccordion.scrollToSection(sectionId)`: scrolls the target section into view.
- `RulesAccordion.observeSections()`: watches which rules section is most visible.
- `RulesAccordion.updateActiveNav(sectionId)`: toggles active state on sidebar buttons.

### `assets/js/hero-particle-trail.js`

Purpose:

- hover-follow particle/glow effect for hero areas

Methods:

- `HeroParticleTrail.constructor()`: stores effect state and checks support.
- `HeroParticleTrail.mount(root = document)`: finds hero targets and attaches particle overlays/listeners.
- `HeroParticleTrail.clear()`: removes overlays, listeners, and animation frames.
- `HeroParticleTrail.checkSupport()`: enables the effect only on supported pointer/motion conditions.
- `HeroParticleTrail.createEntry(element)`: creates the overlay and event handlers for one hero.
- `HeroParticleTrail.updateTargetFromEvent(entry, event)`: updates the target pointer position.
- `HeroParticleTrail.startFrame(entry)`: starts animation for one hero.
- `HeroParticleTrail.tick(entry)`: runs one animation frame for the particle chain.

### `assets/js/staff-structure-page-controller.js`

Purpose:

- renders and manages the interactive staff org chart page

Methods:

- `StaffStructurePageController.constructor(root, dataLoader, route)`: stores page state, creates `StaffProfileModal`, and initializes chart helper references.
- `StaffStructurePageController.mount()`: loads hero and structure JSON, normalizes structure config, builds the profile map, renders the page, mounts the modal, mounts the chart viewport, mounts shared connectors, and binds click handling.
- `StaffStructurePageController.destroy()`: removes listeners and destroys all mounted helpers.
- `StaffStructurePageController.handleRootClick(event)`: opens a staff profile when a staff node card is clicked.
- `StaffStructurePageController.applyHeroSettings(heroConfig = {})`: writes hero background image and position variables.
- `StaffStructurePageController.buildProfileMap(nodes, map = new Map())`: recursively indexes nodes and shared children by id.
- `StaffStructurePageController.normalizeStructureConfig(rawStructure = {})`: normalizes several accepted structure schema aliases into one internal shape.
- `StaffStructurePageController.buildHierarchyNodes(rawNodes, preferredRoots = [])`: converts either nested nodes or flat referenced nodes into a renderable hierarchy.
- `StaffStructurePageController.hasReferencedChildren(node)`: checks whether a node uses reference ids instead of fully nested child objects.
- `StaffStructurePageController.normalizeNodes(nodes)`: normalizes an array of node objects recursively.
- `StaffStructurePageController.normalizeFlatNode(node, index = 0)`: normalizes one flat reference-based node.
- `StaffStructurePageController.normalizeNode(node, index = 0)`: converts a node into the controller’s internal node shape.
- `StaffStructurePageController.materializeNodeTree(nodeId, nodeMap, trail)`: recursively rebuilds the nested chart tree from flat references.
- `StaffStructurePageController.resolveSharedAnchor(sharedParents, parentRefs)`: picks the best anchor node for shared-parent connector rendering.
- `StaffStructurePageController.collectAncestorDistances(nodeId, parentRefs, distances = new Map(), depth = 0)`: measures ancestor depth for shared-anchor resolution.
- `StaffStructurePageController.buildNodeStyle(node)`: builds the inline accent style for one staff node.
- `StaffStructurePageController.getProfileImage(imagePath)`: resolves a node image or the fallback profile image.
- `StaffStructurePageController.renderNode(node)`: recursively renders one staff node, its children, and shared children.
- `StaffStructurePageController.render(hero, structure)`: renders the staff hero, chart heading, helper pill, canvas, zoom controls, and full chart.

### `assets/js/staff-chart-viewport.js`

Purpose:

- zoom/pan controller for the staff chart canvas

Methods:

- `StaffChartViewport.constructor(root)`: caches viewport elements, stores transform state, and binds handlers.
- `StaffChartViewport.mount()`: attaches pointer, wheel, zoom-button, and resize handling, then fits the chart into view.
- `StaffChartViewport.destroy()`: removes all viewport listeners and observers.
- `StaffChartViewport.handleResize()`: refits the chart on resize.
- `StaffChartViewport.handlePointerDown(event)`: starts drag panning unless the user clicked a card or chart controls.
- `StaffChartViewport.handlePointerMove(event)`: updates translation while dragging.
- `StaffChartViewport.handlePointerUp(event)`: ends dragging and releases pointer capture.
- `StaffChartViewport.handleWheel(event)`: zooms around the mouse position.
- `StaffChartViewport.handleZoomIn()`: zoom-in button handler.
- `StaffChartViewport.handleZoomOut()`: zoom-out button handler.
- `StaffChartViewport.zoomBy(delta)`: performs centered zooming.
- `StaffChartViewport.fitView()`: scales and centers the chart within the canvas.
- `StaffChartViewport.applyTransform()`: writes the current translate/scale transform to the chart inner wrapper.
- `StaffChartViewport.clamp(value, min, max)`: limits a number to the allowed range.

### `assets/js/staff-shared-connectors.js`

Purpose:

- draws connector lines for staff nodes that share multiple parents

Methods:

- `StaffSharedConnectors.constructor(root)`: stores root state, connector styling defaults, and resize handling.
- `StaffSharedConnectors.mount()`: performs initial layout, schedules a second layout pass, and starts resize observation.
- `StaffSharedConnectors.destroy()`: disconnects observers and listeners.
- `StaffSharedConnectors.handleResize()`: re-runs layout on resize.
- `StaffSharedConnectors.layout()`: finds all shared-anchor nodes and lays out their connector overlays.
- `StaffSharedConnectors.layoutAnchor(anchor)`: calculates parent-child geometry for one shared connector group and writes SVG markup.
- `StaffSharedConnectors.measureCard(button, anchorRect)`: measures a node card relative to the anchor container.
- `StaffSharedConnectors.createHorizontalSegment(x1, x2, y)`: returns SVG markup for one horizontal connector segment.
- `StaffSharedConnectors.createVerticalSegment(x, y1, y2)`: returns SVG markup for one vertical connector segment.

### `assets/js/staff-profile-modal.js`

Purpose:

- profile modal for the staff chart

Methods:

- `StaffProfileModal.constructor()`: initializes modal state and focus restoration state.
- `StaffProfileModal.mount()`: creates the modal DOM, close handling, and Escape handling.
- `StaffProfileModal.destroy()`: removes the modal and all listeners.
- `StaffProfileModal.open(profile, fallbackProfileImage)`: fills the modal with profile data, hides the image shell for section cards, resolves the profile image, and opens the modal.
- `StaffProfileModal.close({ restoreFocus = true } = {})`: closes the modal and optionally restores focus.
- `StaffProfileModal.toParagraphs(text)`: converts block text into paragraph markup units.

## `assets/data/` Folder

### `assets/data/site/`

#### `assets/data/site/site-config.json`

Purpose:

- master route and navigation config

Current notes:

- internal route labels now use `Civilians` and `Criminals` for nav wording
- the external `discord` and `join` labels include inline HTML image tags
- `join.href` uses a full `https://` URL here

#### `assets/data/site/branding.json`

Purpose:

- site-wide brand and footer copy source

Current fields include:

- `meta.documentTitle`
- `meta.documentDescription`
- `brand.lineOne`
- `brand.lineTwo`
- `brand.fullName`
- `brand.fallbackMark`
- `brand.logoPath`
- `mobileDrawer.eyebrow`
- `mobileDrawer.action`
- `footer.navigationHeading`
- `footer.tagline`
- `footer.metaHeading`
- `footer.metaItems`
- `footer.closingLine`
- `footer.copyrightSuffix`
- `footer.disclaimer`

The new `footer.disclaimer` field is now wired into the shell footer.

### `assets/data/server/`

#### `assets/data/server/server-status.json`

Purpose:

- fallback status data and live FiveM polling config for the home page

Defines:

- fallback status text
- player count and cap
- FiveM provider config
- timezone label
- restart times
- schedule card entries

### `assets/data/home/`

#### `assets/data/home/hero.json`

- home hero text, image, and CTA buttons

#### `assets/data/home/about.json`

- about-panel label, copy, and link

#### `assets/data/home/schedule.json`

- schedule-panel label, title, and meta badge

#### `assets/data/home/career-section.json`

- label and title for the career-strip heading

#### `assets/data/home/career-cards.json`

- homepage career cards linking into departments and other paths
- each card includes route target, title, description, eyebrow, and accent color

### `assets/data/civ-jobs/`

#### `assets/data/civ-jobs/hero.json`

- civilians hero content and background image

#### `assets/data/civ-jobs/jobs.json`

- civilian opportunities data
- each item includes:
  - `id`
  - `variant`
  - `number`
  - `backgroundImage`
  - `accentColor`
  - `title`
  - `description`
  - `longDescription`
  - `tags`

#### `assets/data/civ-jobs/pillars.json`

- supporting content blocks for the civilians page

### `assets/data/crim-jobs/`

#### `assets/data/crim-jobs/hero.json`

- criminals hero content, background image, and background position

#### `assets/data/crim-jobs/activities.json`

- criminal opportunities data
- follows the same general schema as civilian jobs

#### `assets/data/crim-jobs/pillars.json`

- supporting content blocks for the criminals page

### `assets/data/rules/`

#### `assets/data/rules/hero.json`

- rules hero content and background image

#### `assets/data/rules/layout.json`

Purpose:

- layout/config layer for the rules sidebar

Current interface:

- `sidebarTitle`
- `agreementCard.iconType`
- `agreementCard.text`

The current `iconType` is `justice-badge`, which causes `RulesAccordion.renderAgreementIcon()` to render the inline SVG badge.

#### `assets/data/rules/rules.json`

- main rules dataset
- each section includes:
  - `id`
  - `navTitle`
  - `title`
  - `intro`
  - `items[]`

Current sections cover:

- Core Rules
- In-Character Rules
- Combat and Weapon Rules
- Vehicle Rules
- Economy Rules
- Staff and Support
- Server and Community

### `assets/data/staff-structure/`

#### `assets/data/staff-structure/hero.json`

- staff hero content, background image, and background position

#### `assets/data/staff-structure/structure.json`

Purpose:

- current staff chart dataset

Current direct fields:

- `sectionLabel`
- `sectionTitle`
- `sectionDescription`
- `fallbackProfileImage`
- `nodes[]`

Current node features used by the controller:

- `id`
- `name`
- `role`
- `summary`
- `fullDescription`
- `image`
- `sectionCard`
- `accentColor`
- `children`
- `sharedParents`

Important behavior:

- this file currently uses a flat reference-style graph, not a purely nested tree
- some `children` arrays contain string ids
- some nodes use `sharedParents` so the same division/tester relationship can be rendered under multiple superiors
- `fallbackProfileImage` points to `assets/images/placeholders/blank-profile.png`
- some nodes use external image URLs instead of local assets

Current content represented in the chart:

- Ownership Team
- Development Team
- Server Management
- City Staff
- Discord Staff
- Testing Division
- staff profiles for owners, developers, testers, and management roles

### `assets/data/departments/`

Shared department pattern:

- `page.json`
- `divisions.json`
- `requirements.json`
- `progression.json`
- `stats.json`
- `values.json`

The active controller currently uses everything except `stats.json`.

#### `assets/data/departments/police/page.json`

- police hero content, CTA buttons, section labels, preview ranks, and progression focus id
- still uses a primary join link without `https://`
- now includes inline HTML icon markup in the CTA label

#### `assets/data/departments/police/divisions.json`

- police divisions list and two highlighted role slots per division

#### `assets/data/departments/police/requirements.json`

- police application/roleplay requirements

#### `assets/data/departments/police/progression.json`

- nested police rank tree used by the progression modal

#### `assets/data/departments/police/stats.json`

- police stats data currently not rendered by the page controller

#### `assets/data/departments/police/values.json`

- police value cards

#### `assets/data/departments/fire/page.json`

- fire hero content, CTA buttons, section labels, preview ranks, and focus id
- still uses a primary join link without `https://`
- includes inline HTML icon markup in the CTA label

#### `assets/data/departments/fire/divisions.json`

- fire divisions list

#### `assets/data/departments/fire/requirements.json`

- fire requirements list

#### `assets/data/departments/fire/progression.json`

- fire progression tree

#### `assets/data/departments/fire/stats.json`

- fire stats data currently not rendered

#### `assets/data/departments/fire/values.json`

- fire value cards

#### `assets/data/departments/ambulance/page.json`

- ambulance hero content, CTA buttons, section labels, preview ranks, and focus id
- still uses a primary join link without `https://`
- includes inline HTML icon markup in the CTA label

#### `assets/data/departments/ambulance/divisions.json`

- ambulance divisions list

#### `assets/data/departments/ambulance/requirements.json`

- ambulance requirements list

#### `assets/data/departments/ambulance/progression.json`

- large ambulance hierarchy tree used in the progression modal

#### `assets/data/departments/ambulance/stats.json`

- ambulance stats data currently not rendered

#### `assets/data/departments/ambulance/values.json`

- ambulance value cards

#### `assets/data/departments/mechanic/page.json`

- mechanic hero content, CTA buttons, section labels, preview ranks, and focus id
- still uses a primary join link without `https://`
- includes inline HTML icon markup in the CTA label

#### `assets/data/departments/mechanic/divisions.json`

- mechanic divisions list

#### `assets/data/departments/mechanic/requirements.json`

- mechanic requirements list

#### `assets/data/departments/mechanic/progression.json`

- mechanic progression tree

#### `assets/data/departments/mechanic/stats.json`

- mechanic stats data currently not rendered

#### `assets/data/departments/mechanic/values.json`

- mechanic value cards

## `assets/images/` Folder

### `assets/images/branding/`

#### `assets/images/branding/london-rising-logo.png`

- main site logo
- used in the header, mobile drawer, footer, and favicon

### `assets/images/heroes/`

#### `assets/images/heroes/home-hero-v1.png`

- active home hero background

#### `assets/images/heroes/home-hero-v2.png`

- alternate home hero image currently unused

#### `assets/images/heroes/civ-jobs-hero-v1.png`

- civilians hero image

#### `assets/images/heroes/criminal-hero.png`

- criminals hero image

#### `assets/images/heroes/police-hero-v1.png`

- police hero image

#### `assets/images/heroes/fire-hero-v1.png`

- fire hero image

#### `assets/images/heroes/ambulance-hero-v1.png`

- ambulance hero image

#### `assets/images/heroes/mechanic-hero-v1.png`

- mechanic hero image

#### `assets/images/heroes/rules-hero-v1.png`

- rules hero image

#### `assets/images/heroes/staff-structure-hero.png`

- staff structure hero image

### `assets/images/opportunities/`

#### `assets/images/opportunities/civ-taxi.png`

- taxi job card/modal image

#### `assets/images/opportunities/civ-taxi-test.png`

- alternate taxi image currently unused

#### `assets/images/opportunities/civ-bus.png`

- bus job image

#### `assets/images/opportunities/civ-delivery.png`

- delivery job image

#### `assets/images/opportunities/civ-sanitation.png`

- sanitation job image

#### `assets/images/opportunities/civ-logistics.png`

- logistics job image

#### `assets/images/opportunities/civ-legal.png`

- legal job image

#### `assets/images/opportunities/crime-street-dealing.png`

- street dealing image

#### `assets/images/opportunities/crime-boosting.png`

- boosting image

#### `assets/images/opportunities/crime-burglaries.png`

- burglaries image

#### `assets/images/opportunities/crime-atm.png`

- ATM raids image

#### `assets/images/opportunities/crime-store.png`

- store robbery image

#### `assets/images/opportunities/crime-heists.png`

- major heist image

### `assets/images/placeholders/`

#### `assets/images/placeholders/blank-profile.png`

- fallback local profile image used by the staff page when a node does not define its own image

## Current Caveats And Inactive Pieces

These are the genuine current caveats still worth knowing about.

### 1. Department `stats.json` files are dormant

The department folders all contain `stats.json`, but `DepartmentPageController` does not currently load or render them.

Result:

- the stats data exists as content but is not visible on the live department pages

### 2. Footer config is broader than current footer markup

`AppShell.applyBranding()` still supports:

- `[data-footer-nav]`
- `[data-footer-nav-heading]`
- `[data-footer-meta-heading]`
- `[data-footer-meta-list]`

The current `index.html` footer only renders:

- tagline
- disclaimer
- closing line
- copyright line

Result:

- some footer config fields are supported in JS and CSS but not currently surfaced in the live footer HTML

### 3. Department join links still omit the protocol

The primary CTA in the department `page.json` files still uses `cfx.re/join/89ymqm` instead of `https://cfx.re/join/89ymqm`.

Result:

- those buttons may resolve inconsistently because the href is not a full absolute URL

### 4. Some JSON strings intentionally contain raw HTML

Raw HTML is currently stored in data files for:

- `assets/data/site/site-config.json` nav labels
- department `page.json` CTA labels

Result:

- the content is treated as trusted markup
- labels are content-plus-HTML, not plain text-only strings

## Practical Maintenance Summary

For most updates:

1. Change route or shell behavior in `assets/data/site/site-config.json`, `assets/data/site/branding.json`, `index.html`, or `assets/js/app-shell.js`.
2. Change page content in the matching `assets/data/...` folder.
3. Change route behavior in the matching controller under `assets/js/`.
4. Change look and feel in the appropriate CSS layer.
5. Change images in `assets/images/` and update the JSON paths that point to them.

Most content changes do not require touching the HTML stubs in `pages/`, because those are only route placeholders.

## AI Disclaimer

Some or all images used across this website are AI-generated or were created with AI assistance. AI was also used to assist with the development of this page and the wider website implementation.
