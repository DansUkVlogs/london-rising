export class PageLoader {
  constructor({ host, routes, defaultRoute, createController, onRouteLoaded, onRouteChangeStart }) {
    this.host = host;
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    this.createController = createController;
    this.onRouteLoaded = onRouteLoaded;
    this.onRouteChangeStart = onRouteChangeStart;
    this.currentRoute = null;
    this.currentController = null;
    this.loadRequestId = 0;

    this.handleHashChange = this.handleHashChange.bind(this);
  }

  start() {
    window.addEventListener("hashchange", this.handleHashChange);

    if (!window.location.hash) {
      window.location.hash = this.getDefaultHash();
      return;
    }

    this.loadCurrentRoute();
  }

  destroy() {
    window.removeEventListener("hashchange", this.handleHashChange);
    this.currentController?.destroy?.();
  }

  handleHashChange() {
    this.loadCurrentRoute();
  }

  async loadCurrentRoute() {
    const routeId = this.parseRouteId(window.location.hash);
    const route = this.routes.find((entry) => entry.id === routeId)
      ?? this.routes.find((entry) => entry.id === this.defaultRoute);

    if (!route) {
      return;
    }

    if (route.id !== routeId) {
      window.location.hash = route.hash;
      return;
    }

    const requestId = ++this.loadRequestId;
    this.onRouteChangeStart?.(route);
    this.host.dataset.state = "loading";
    this.host.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(route.partial, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${route.partial}`);
      }

      const markup = await response.text();
      if (requestId !== this.loadRequestId) {
        return;
      }

      this.currentController?.destroy?.();
      this.host.innerHTML = markup;
      this.currentRoute = route;
      this.updateActiveLinks(route.id);

      const root = this.host.firstElementChild ?? this.host;
      this.currentController = this.createController(route, root);
      await this.currentController?.mount?.();

      document.body.dataset.route = route.id;
      window.scrollTo({ top: 0, behavior: "auto" });
      this.host.focus({ preventScroll: true });
      this.onRouteLoaded?.(route, root);
    } catch (error) {
      this.currentController?.destroy?.();
      this.currentController = null;
      this.host.innerHTML = `
        <article class="panel error-state">
          <p class="section-label">Navigation error</p>
          <h1 class="section-title">This page could not be loaded.</h1>
          <p class="section-copy">${error.message}</p>
        </article>
      `;
    } finally {
      this.host.dataset.state = "ready";
      this.host.setAttribute("aria-busy", "false");
    }
  }

  updateActiveLinks(activeRouteId) {
    document.querySelectorAll("[data-route-link]").forEach((link) => {
      const isActive = link.dataset.routeLink === activeRouteId;
      link.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  getDefaultHash() {
    const defaultRoute = this.routes.find((entry) => entry.id === this.defaultRoute);
    return defaultRoute?.hash ?? "#/home";
  }

  parseRouteId(hashValue) {
    return hashValue.replace(/^#\/?/, "").split("?")[0] || this.defaultRoute;
  }
}
