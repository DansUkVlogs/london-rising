import { toCssImageUrl } from "./asset-url.js?v=20260529g";
import { buildStyleAttribute } from "./style-utils.js?v=20260529g";
import { JobDetailModal } from "./job-detail-modal.js?v=20260529g";

export class CivJobsPageController {
  constructor(root, dataLoader, route) {
    this.root = root;
    this.dataLoader = dataLoader;
    this.route = route;
    this.jobModal = new JobDetailModal();
    this.jobsById = new Map();
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
      jobs: `${this.route.dataFolder}/jobs.json`,
      pillars: `${this.route.dataFolder}/pillars.json`,
      sectors: `${this.route.dataFolder}/sectors.json`,
    });

    this.sectorsById = new Map(pageData.sectors.map((sector) => [sector.id, sector]));

    const numbersByJobId = this.buildDisplayNumbers(pageData.jobs, pageData.sectors);

    const jobs = pageData.jobs.map((job) => ({
      ...job,
      number: numbersByJobId.get(job.id) ?? job.number,
      sectorLabel: this.sectorsById.get(job.sectorId)?.label ?? "Civilian role",
    }));

    this.jobsById = new Map(jobs.map((job) => [job.id, job]));
    this.render({ ...pageData, jobs });
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

  buildDisplayNumbers(jobs = [], sectors = []) {
    const numbersByJobId = new Map();
    let currentNumber = 1;

    sectors.forEach((sector) => {
      jobs
        .filter((job) => job.sectorId === sector.id)
        .forEach((job) => {
          numbersByJobId.set(job.id, String(currentNumber).padStart(2, "0"));
          currentNumber += 1;
        });
    });

    jobs.forEach((job) => {
      if (!numbersByJobId.has(job.id)) {
        numbersByJobId.set(job.id, String(currentNumber).padStart(2, "0"));
        currentNumber += 1;
      }
    });

    return numbersByJobId;
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

  renderJobCard(job) {
    const requirementsPreview = (job.requirements ?? []).slice(0, 2);

    return `
      <article
        class="job-card job-card--civilian job-card--clickable job-card--${job.variant}"
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
            <p class="job-card__eyebrow">${job.sectorLabel}</p>
            <div class="job-card__headline">
              <h2>${job.title}</h2>
              <span class="job-card__salary">${job.salary ?? "Salary varies"}</span>
            </div>
            <p>${job.description}</p>
            <div class="job-card__footer">
              <div class="job-card__requirements">
                <span class="job-card__requirements-label">Requirements</span>
                <ul class="job-card__tags">
                  ${requirementsPreview.map((requirement) => `<li>${requirement}</li>`).join("")}
                </ul>
              </div>
              <span class="job-card__arrow" aria-hidden="true">&rarr;</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  renderSectorSection(sector, jobs = []) {
    const sectorJobs = jobs.filter((job) => job.sectorId === sector.id);
    if (!sectorJobs.length) {
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
          ${sectorJobs.map((job) => this.renderJobCard(job)).join("")}
        </div>
      </section>
    `;
  }

  render(pageData) {
    this.root.innerHTML = `
      <header class="section-hero section-hero--jobs" data-reveal data-hero-trail>
        <p class="section-hero__eyebrow">${pageData.hero.eyebrow}</p>
        <h1 class="section-hero__title">${pageData.hero.title}</h1>
        <p class="section-hero__copy">${pageData.hero.description}</p>
      </header>

      ${this.renderHeroHighlights(pageData.hero.highlights)}

      <div class="jobs-sectors">
        ${pageData.sectors.map((sector) => this.renderSectorSection(sector, pageData.jobs)).join("")}
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
