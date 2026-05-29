import { toCssImageUrl } from "./asset-url.js?v=20260529g";
import { buildStyleAttribute } from "./style-utils.js?v=20260529g";
import { JobDetailModal } from "./job-detail-modal.js?v=20260529g";

export class CrimJobsPageController {
  constructor(root, dataLoader, route) {
    this.root = root;
    this.dataLoader = dataLoader;
    this.route = route;
    this.jobModal = new JobDetailModal();
    this.activitiesById = new Map();
    this.sectorsById = new Map();
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
      sectors: `${this.route.dataFolder}/sectors.json`,
    });

    this.sectorsById = new Map(pageData.sectors.map((sector) => [sector.id, sector]));

    const numbersByActivityId = this.buildDisplayNumbers(pageData.activities, pageData.sectors);
    const activities = pageData.activities.map((activity) => ({
      ...activity,
      number: numbersByActivityId.get(activity.id) ?? activity.number,
      sectorLabel: this.sectorsById.get(activity.sectorId)?.label ?? "Criminal activity",
    }));

    this.activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
    this.render({ ...pageData, activities });
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

  buildDisplayNumbers(activities = [], sectors = []) {
    const numbersByActivityId = new Map();
    let currentNumber = 1;

    sectors.forEach((sector) => {
      activities
        .filter((activity) => activity.sectorId === sector.id)
        .forEach((activity) => {
          numbersByActivityId.set(activity.id, String(currentNumber).padStart(2, "0"));
          currentNumber += 1;
        });
    });

    activities.forEach((activity) => {
      if (!numbersByActivityId.has(activity.id)) {
        numbersByActivityId.set(activity.id, String(currentNumber).padStart(2, "0"));
        currentNumber += 1;
      }
    });

    return numbersByActivityId;
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

    this.jobModal.open(activity, {
      label: "Criminal activity",
      detailsLabel: "Activity notes",
    });
  }

  renderHeroHighlights(highlights = []) {
    if (!highlights.length) {
      return "";
    }

    return `
      <div class="jobs-overview" data-reveal>
        ${highlights
          .map(
            (highlight) => `
              <article class="panel jobs-overview__item">
                <strong class="jobs-overview__value">${highlight.value}</strong>
                <span class="jobs-overview__label">${highlight.label}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    `;
  }

  renderActivityCard(activity) {
    const tagsPreview = (activity.tags ?? []).slice(0, 2);

    return `
      <article
        class="job-card job-card--criminal job-card--clickable job-card--${activity.variant}"
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
            <p class="job-card__eyebrow">${activity.sectorLabel}</p>
            <div class="job-card__headline">
              <h2>${activity.title}</h2>
            </div>
            <p>${activity.description}</p>
            <div class="job-card__footer">
              <div class="job-card__meta">
                <span class="job-card__meta-label">Activity notes</span>
                <ul class="job-card__tags">
                  ${tagsPreview.map((tag) => `<li>${tag}</li>`).join("")}
                </ul>
              </div>
              <span class="job-card__arrow" aria-hidden="true">&rarr;</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  renderSectorSection(sector, activities = []) {
    const sectorActivities = activities.filter((activity) => activity.sectorId === sector.id);
    if (!sectorActivities.length) {
      return "";
    }

    return `
      <section class="panel jobs-sector" data-reveal>
        <div class="jobs-sector__heading">
          <div>
            <p class="section-label">${sector.label}</p>
            <h2 class="section-title jobs-sector__title">${sector.title}</h2>
          </div>
          <p class="jobs-sector__copy">${sector.description}</p>
        </div>

        <div class="jobs-sector__grid">
          ${sectorActivities.map((activity) => this.renderActivityCard(activity)).join("")}
        </div>
      </section>
    `;
  }

  render(pageData) {
    this.root.innerHTML = `
      <header class="section-hero section-hero--crime" data-reveal data-hero-trail>
        <p class="section-hero__eyebrow">${pageData.hero.eyebrow}</p>
        <h1 class="section-hero__title">${pageData.hero.title}</h1>
        <p class="section-hero__copy">${pageData.hero.description}</p>
      </header>

      ${this.renderHeroHighlights(pageData.hero.highlights)}

      <div class="jobs-sectors">
        ${pageData.sectors.map((sector) => this.renderSectorSection(sector, pageData.activities)).join("")}
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
