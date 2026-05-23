import { PageLoader } from "./page-loader.js?v=20260523ac";
import { MobileMenu } from "./mobile-menu.js?v=20260523ac";
import { HomePageController } from "./home-page-controller.js?v=20260523ac";
import { CivJobsPageController } from "./civ-jobs-page-controller.js?v=20260523ac";
import { CrimJobsPageController } from "./crim-jobs-page-controller.js?v=20260523ac";
import { DepartmentPageController } from "./department-page-controller.js?v=20260523ac";
import { RulesPageController } from "./rules-page-controller.js?v=20260523ac";
import { StaffStructurePageController } from "./staff-structure-page-controller.js?v=20260523ac";
import { HeroParticleTrail } from "./hero-particle-trail.js?v=20260523ac";
import { buildLinkAttributes } from "./link-utils.js?v=20260523ac";

class StaticPageController {
  async mount() {}
  destroy() {}
}

export class AppShell {
  constructor({ siteConfig, brandingConfig, dataLoader }) {
    this.siteConfig = siteConfig;
    this.brandingConfig = brandingConfig;
    this.dataLoader = dataLoader;
    this.sites = this.siteConfig.sites ?? this.siteConfig.routes ?? [];
    this.pageRoutes = this.sites.filter((site) => this.isPageRoute(site));
    this.defaultRouteId = this.siteConfig.defaultSiteId ?? this.siteConfig.defaultRoute ?? this.pageRoutes[0]?.id ?? "home";
    this.revealObserver = null;
    this.pageLoader = null;
    this.mobileMenu = null;
    this.heroParticleTrail = new HeroParticleTrail();
  }

  init() {
    this.cacheElements();
    this.renderNavigation();
    this.applyBranding();
    this.setupRevealObserver();
    this.mountMobileMenu();
    this.mountPageLoader();
    this.setCurrentYear();
  }

  cacheElements() {
    this.siteNav = document.querySelector("[data-site-nav]");
    this.mobileNav = document.querySelector("[data-mobile-nav]");
    this.footerNav = document.querySelector("[data-footer-nav]");
    this.pageHost = document.querySelector("[data-page-host]");
    this.menuToggle = document.querySelector("[data-menu-toggle]");
    this.menuClose = document.querySelector("[data-menu-close]");
    this.mobileDrawer = document.querySelector("[data-mobile-drawer]");
    this.mobileBackdrop = document.querySelector("[data-mobile-backdrop]");
  }

  isPageRoute(route) {
    return Boolean(route.hash && route.partial);
  }

  buildSiteLink(route, baseClass) {
    const classes = [baseClass];
    const href = route.href ?? route.hash ?? "#";
    const isPageRoute = this.isPageRoute(route);

    if (route.buttonStyle) {
      classes.push(`${baseClass}--button`);
    }

    return `
      <a class="${classes.join(" ")}" ${buildLinkAttributes({ href, newTab: route.newTab })}${isPageRoute ? ` data-route-link="${route.id}" aria-current="false"` : ""}>
        ${route.label}
      </a>
    `;
  }

  renderNavigation() {
    const desktopLinks = this.sites.map((route) => this.buildSiteLink(route, "nav-link")).join("");
    const mobileLinks = this.sites.map((route) => this.buildSiteLink(route, "mobile-nav__link")).join("");
    const footerLinks = this.sites.map((route) => this.buildSiteLink(route, "footer-nav__link")).join("");

    if (this.siteNav) {
      this.siteNav.innerHTML = desktopLinks;
    }

    if (this.mobileNav) {
      this.mobileNav.innerHTML = mobileLinks;
      this.mobileNav.addEventListener("click", (event) => {
        if (event.target.closest("a[href]")) {
          this.mobileMenu?.close({ returnFocus: false });
        }
      });
    }

    if (this.footerNav) {
      this.footerNav.innerHTML = footerLinks;
    }
  }

  applyBranding() {
    const meta = this.brandingConfig.meta ?? {};
    const brand = this.brandingConfig.brand ?? {};
    const mobileDrawer = this.brandingConfig.mobileDrawer ?? {};
    const footer = this.brandingConfig.footer ?? {};

    document.querySelectorAll("[data-brand-line-one]").forEach((element) => {
      element.textContent = brand.lineOne ?? "";
    });

    document.querySelectorAll("[data-brand-line-two]").forEach((element) => {
      element.textContent = brand.lineTwo ?? "";
    });

    document.querySelectorAll("[data-brand-full-name]").forEach((element) => {
      element.textContent = brand.fullName ?? "";
    });

    document.querySelectorAll("[data-brand-fallback]").forEach((element) => {
      element.textContent = brand.fallbackMark ?? "";
    });

    document.querySelectorAll("[data-footer-tagline]").forEach((element) => {
      element.textContent = footer.tagline ?? "";
    });

    document.querySelectorAll("[data-mobile-eyebrow]").forEach((element) => {
      element.textContent = mobileDrawer.eyebrow ?? "";
    });

    document.querySelectorAll("[data-mobile-drawer-action]").forEach((element) => {
      element.textContent = mobileDrawer.action?.label ?? "";
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `<a ${buildLinkAttributes(mobileDrawer.action)}></a>`;
      const generatedLink = wrapper.firstElementChild;
      if (generatedLink) {
        ["href", "target", "rel"].forEach((attribute) => {
          if (generatedLink.hasAttribute(attribute)) {
            element.setAttribute(attribute, generatedLink.getAttribute(attribute));
          } else {
            element.removeAttribute(attribute);
          }
        });
      }
    });

    document.querySelectorAll("[data-footer-nav-heading]").forEach((element) => {
      element.textContent = footer.navigationHeading ?? "";
    });

    document.querySelectorAll("[data-footer-meta-heading]").forEach((element) => {
      element.textContent = footer.metaHeading ?? "";
    });

    document.querySelectorAll("[data-footer-closing-line]").forEach((element) => {
      element.textContent = footer.closingLine ?? "";
    });

    document.querySelectorAll("[data-footer-copyright-suffix]").forEach((element) => {
      element.textContent = footer.copyrightSuffix ?? "";
    });

    document.querySelectorAll("[data-footer-disclaimer]").forEach((element) => {
      element.textContent = footer.disclaimer ?? "";
    });

    document.querySelectorAll("[data-footer-meta-list]").forEach((element) => {
      element.innerHTML = (footer.metaItems ?? []).map((item) => `<li>${item}</li>`).join("");
    });

    document.querySelectorAll("[data-brand-mark]").forEach((mark) => {
      const logo = mark.querySelector("[data-brand-logo]");
      if (!logo) {
        return;
      }

      const handleLoad = () => {
        mark.dataset.logoState = "loaded";
      };

      const handleError = () => {
        mark.dataset.logoState = "error";
        logo.hidden = true;
      };

      mark.dataset.logoState = "loading";
      logo.hidden = false;
      logo.addEventListener("load", handleLoad, { once: true });
      logo.addEventListener("error", handleError, { once: true });
      logo.src = brand.logoPath ?? "";
    });

    if (meta.documentTitle) {
      document.title = meta.documentTitle;
    }

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && meta.documentDescription) {
      metaDescription.setAttribute("content", meta.documentDescription);
    }
  }

  mountMobileMenu() {
    this.mobileMenu = new MobileMenu({
      toggleButton: this.menuToggle,
      closeButton: this.menuClose,
      drawer: this.mobileDrawer,
      backdrop: this.mobileBackdrop,
    });

    this.mobileMenu.init();
  }

  mountPageLoader() {
    this.pageLoader = new PageLoader({
      host: this.pageHost,
      routes: this.pageRoutes,
      defaultRoute: this.defaultRouteId,
      createController: (route, root) => this.createController(route, root),
      onRouteChangeStart: () => {
        this.heroParticleTrail.clear();
      },
      onRouteLoaded: (_route, root) => {
        this.mobileMenu?.close({ returnFocus: false });
        this.refreshRevealTargets(root);
        this.heroParticleTrail.mount(root);
      },
    });

    this.pageLoader.start();
  }

  createController(route, root) {
    switch (route.pageType) {
      case "home":
        return new HomePageController(root, this.dataLoader, route);
      case "civ-jobs":
        return new CivJobsPageController(root, this.dataLoader, route);
      case "crim-jobs":
        return new CrimJobsPageController(root, this.dataLoader, route);
      case "staff-structure":
        return new StaffStructurePageController(root, this.dataLoader, route);
      case "department":
        return new DepartmentPageController(root, route.id, this.dataLoader, route);
      case "rules":
        return new RulesPageController(root, this.dataLoader, route);
      default:
        return new StaticPageController();
    }
  }

  setupRevealObserver() {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          this.revealObserver?.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px",
      },
    );
  }

  refreshRevealTargets(root) {
    const targets = root.querySelectorAll("[data-reveal]");
    if (!targets.length) {
      return;
    }

    targets.forEach((target, index) => {
      target.classList.add("reveal");
      target.style.transitionDelay = `${Math.min(index * 70, 220)}ms`;

      if (!this.revealObserver) {
        target.classList.add("is-visible");
        return;
      }

      this.revealObserver.observe(target);
    });
  }

  setCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  }
}
