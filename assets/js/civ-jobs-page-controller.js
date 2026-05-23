import { toCssImageUrl } from "./asset-url.js?v=20260523c";
import { buildStyleAttribute } from "./style-utils.js?v=20260523c";
import { JobDetailModal } from "./job-detail-modal.js?v=20260523c";

export class CivJobsPageController {
  constructor(root, dataLoader, route) {
    this.root = root;
    this.dataLoader = dataLoader;
    this.route = route;
    this.jobModal = new JobDetailModal();
    this.jobsById = new Map();
    this.handleRootClick = this.handleRootClick.bind(this);
    this.handleRootKeydown = this.handleRootKeydown.bind(this);
  }

  async mount() {
    if (!this.root) {
      return;
    }

    const pageData = await this.dataLoader.loadNamed({
      hero: `${this.route.dataFolder}/hero.json`,
      jobs: `${this.route.dataFolder}/jobs.json`,
      pillars: `${this.route.dataFolder}/pillars.json`,
    });

    this.jobsById = new Map(pageData.jobs.map((job) => [job.id, job]));
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
      this.root.style.setProperty("--jobs-hero-image", toCssImageUrl(heroConfig.backgroundImage));
    } else {
      this.root.style.removeProperty("--jobs-hero-image");
    }

    if (heroConfig.backgroundPosition) {
      this.root.style.setProperty("--jobs-hero-position", heroConfig.backgroundPosition);
    } else {
      this.root.style.removeProperty("--jobs-hero-position");
    }
  }

  buildJobStyle(job) {
    return buildStyleAttribute({
      "--job-card-media-image": job.backgroundImage ? toCssImageUrl(job.backgroundImage) : "",
      "--job-card-accent": job.accentColor,
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

    this.openJob(trigger.dataset.opportunityId);
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
    this.openJob(trigger.dataset.opportunityId);
  }

  openJob(jobId) {
    const job = this.jobsById.get(jobId);
    if (!job) {
      return;
    }

    this.jobModal.open(job, { label: "Civilian job" });
  }

  renderJobCard(job) {
    return `
      <article
        class="job-card job-card--clickable job-card--${job.variant}"
        ${this.buildJobStyle(job)}
        tabindex="0"
        role="button"
        aria-haspopup="dialog"
        aria-label="Open details for ${job.title}"
        data-opportunity-trigger
        data-opportunity-id="${job.id}"
      >
        <div class="job-card__media">
          <strong class="job-card__number">${job.number ?? ""}</strong>
        </div>
        <div class="job-card__body">
          <div class="job-card__copy">
            <h2>${job.title}</h2>
            <p>${job.description}</p>
          </div>
          <div class="job-card__aside">
            <ul class="job-card__tags">
              ${(job.tags ?? []).map((tag) => `<li>${tag}</li>`).join("")}
            </ul>
            <span class="job-card__arrow" aria-hidden="true">&rarr;</span>
          </div>
        </div>
      </article>
    `;
  }

  render(pageData) {
    this.root.innerHTML = `
      <header class="section-hero section-hero--jobs" data-reveal data-hero-trail>
        <p class="section-hero__eyebrow">${pageData.hero.eyebrow}</p>
        <h1 class="section-hero__title">${pageData.hero.title}</h1>
        <p class="section-hero__copy">${pageData.hero.description}</p>
      </header>

      <div class="job-rail" data-reveal>
        ${pageData.jobs.map((job) => this.renderJobCard(job)).join("")}
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
