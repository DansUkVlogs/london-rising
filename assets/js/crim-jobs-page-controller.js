import { toCssImageUrl } from "./asset-url.js?v=20260523c";
import { buildStyleAttribute } from "./style-utils.js?v=20260523c";
import { JobDetailModal } from "./job-detail-modal.js?v=20260523c";

export class CrimJobsPageController {
  constructor(root, dataLoader, route) {
    this.root = root;
    this.dataLoader = dataLoader;
    this.route = route;
    this.jobModal = new JobDetailModal();
    this.activitiesById = new Map();
    this.handleRootClick = this.handleRootClick.bind(this);
    this.handleRootKeydown = this.handleRootKeydown.bind(this);
  }

  async mount() {
    if (!this.root) {
      return;
    }

    const pageData = await this.dataLoader.loadNamed({
      hero: `${this.route.dataFolder}/hero.json`,
      activities: `${this.route.dataFolder}/activities.json`,
      pillars: `${this.route.dataFolder}/pillars.json`,
    });

    this.activitiesById = new Map(pageData.activities.map((activity) => [activity.id, activity]));
    this.render(pageData);
    this.applyHeroSettings(pageData.hero);
    this.jobModal.mount();
    this.bindEvents();
  }

  destroy() {
    this.root?.removeEventListener("click", this.handleRootClick);
    this.root?.removeEventListener("keydown", this.handleRootKeydown);
    this.jobModal.destroy();
  }

  applyHeroSettings(heroConfig = {}) {
    if (heroConfig.backgroundImage) {
      this.root.style.setProperty("--crime-hero-image", toCssImageUrl(heroConfig.backgroundImage));
    } else {
      this.root.style.removeProperty("--crime-hero-image");
    }

    if (heroConfig.backgroundPosition) {
      this.root.style.setProperty("--crime-hero-position", heroConfig.backgroundPosition);
    } else {
      this.root.style.removeProperty("--crime-hero-position");
    }
  }

  buildActivityStyle(activity) {
    return buildStyleAttribute({
      "--job-card-media-image": activity.backgroundImage ? toCssImageUrl(activity.backgroundImage) : "",
      "--job-card-accent": activity.accentColor,
    });
  }

  bindEvents() {
    this.root.addEventListener("click", this.handleRootClick);
    this.root.addEventListener("keydown", this.handleRootKeydown);
  }

  handleRootClick(event) {
    const trigger = event.target.closest("[data-opportunity-trigger]");
    if (!trigger) {
      return;
    }

    this.openActivity(trigger.dataset.opportunityId);
  }

  handleRootKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const trigger = event.target.closest("[data-opportunity-trigger]");
    if (!trigger) {
      return;
    }

    event.preventDefault();
    this.openActivity(trigger.dataset.opportunityId);
  }

  openActivity(activityId) {
    const activity = this.activitiesById.get(activityId);
    if (!activity) {
      return;
    }

    this.jobModal.open(activity, { label: "Criminal activity" });
  }

  render(pageData) {
    this.root.innerHTML = `
      <header class="section-hero section-hero--crime" data-reveal data-hero-trail>
        <p class="section-hero__eyebrow">${pageData.hero.eyebrow}</p>
        <h1 class="section-hero__title">${pageData.hero.title}</h1>
        <p class="section-hero__copy">${pageData.hero.description}</p>
      </header>

      <div class="job-rail" data-reveal>
        ${pageData.activities
          .map(
            (activity) => `
              <article
                class="job-card job-card--clickable job-card--${activity.variant}"
                ${this.buildActivityStyle(activity)}
                tabindex="0"
                role="button"
                aria-haspopup="dialog"
                aria-label="Open details for ${activity.title}"
                data-opportunity-trigger
                data-opportunity-id="${activity.id}"
              >
                <div class="job-card__media">
                  <strong class="job-card__number">${activity.number ?? ""}</strong>
                </div>
                <div class="job-card__body">
                  <div class="job-card__copy">
                    <h2>${activity.title}</h2>
                    <p>${activity.description}</p>
                  </div>
                  <div class="job-card__aside">
                    <ul class="job-card__tags">
                      ${(activity.tags ?? []).map((tag) => `<li>${tag}</li>`).join("")}
                    </ul>
                    <span class="job-card__arrow" aria-hidden="true">&rarr;</span>
                  </div>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>

      <section class="jobs-pillars">
        ${pageData.pillars
          .map(
            (pillar) => `
              <article class="panel">
                <p class="section-label">${pillar.label}</p>
                <h2 class="section-title">${pillar.title}</h2>
                <p class="section-copy">${pillar.description}</p>
              </article>
            `,
          )
          .join("")}
      </section>
    `;
  }
}
