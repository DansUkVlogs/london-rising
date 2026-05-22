import { RestartCountdown } from "./restart-countdown.js";
import { ServerStatus } from "./server-status.js";
import { toCssImageUrl } from "./asset-url.js";
import { buildLinkAttributes } from "./link-utils.js";
import { buildStyleAttribute } from "./style-utils.js";
import { getCfxServerStatus } from "./cfx-status.js";

const SERVER_STATUS_PATH = "assets/data/server/server-status.json";
const SERVER_JOIN_CODE = "89ymqm";

export class HomePageController {
  constructor(root, dataLoader, route) {
    this.root = root;
    this.dataLoader = dataLoader;
    this.route = route;
    this.serverStatus = null;
    this.restartCountdown = null;
  }

  async mount() {
    if (!this.root) {
      return;
    }

    const [{ hero, about, schedule, careerSection, careerCards }, baseServerData] = await Promise.all([
      this.dataLoader.loadNamed({
        hero: `${this.route.dataFolder}/hero.json`,
        about: `${this.route.dataFolder}/about.json`,
        schedule: `${this.route.dataFolder}/schedule.json`,
        careerSection: `${this.route.dataFolder}/career-section.json`,
        careerCards: `${this.route.dataFolder}/career-cards.json`,
      }),
      this.dataLoader.load(SERVER_STATUS_PATH),
    ]);

    const serverData = await getCfxServerStatus(SERVER_JOIN_CODE, baseServerData);

    this.render({ hero, about, schedule, careerSection, careerCards });
    this.applyHeroImage(hero.backgroundImage);

    this.serverStatus = new ServerStatus(this.root, serverData);
    this.restartCountdown = new RestartCountdown(this.root, serverData.restartTimes, serverData.timezoneLabel);

    this.serverStatus.mount();
    this.restartCountdown.mount();
  }

  destroy() {
    this.serverStatus?.destroy();
    this.restartCountdown?.destroy();
  }

  applyHeroImage(imagePath) {
    if (imagePath) {
      this.root.style.setProperty("--home-hero-image", toCssImageUrl(imagePath));
      return;
    }

    this.root.style.removeProperty("--home-hero-image");
  }

  buildDepartmentCardStyle(card) {
    return buildStyleAttribute({
      "--department-card-accent": card.accentColor,
    });
  }

  render(pageData) {
    this.root.innerHTML = `
      <div class="hero hero--home" data-reveal>
        <div class="hero__backdrop hero__backdrop--home" aria-hidden="true"></div>

        <div class="hero__layout hero__layout--home">
          <div class="hero__copy hero__copy--home">
            <p class="hero__kicker">${pageData.hero.kicker}</p>
            <h1 class="hero__title">
              ${pageData.hero.title.lineOne}
              <span>${pageData.hero.title.accent}</span>
              ${pageData.hero.title.lineTwo}
            </h1>
            <p class="hero__text">${pageData.hero.description}</p>

            <div class="hero__actions hero__actions--home">
              <a class="button button--primary" ${buildLinkAttributes(pageData.hero.actions.primary)}>${pageData.hero.actions.primary.label}</a>
              <a class="button button--ghost" ${buildLinkAttributes(pageData.hero.actions.secondary)}>${pageData.hero.actions.secondary.label}</a>
            </div>
          </div>

          <div class="hero__panels hero__panels--home">
            <article class="panel panel--status" data-server-status-root>
              <p class="section-label">Server status</p>
              <div class="status-row">
                <span class="status-dot" data-server-status-indicator></span>
                <strong class="status-text" data-server-status-text>ONLINE</strong>
              </div>
              <p class="status-summary" data-server-status-summary>All systems operational</p>

              <div class="metric-card">
                <span class="metric-card__label">Current players</span>
                <div class="metric-card__value">
                  <strong data-player-count>0</strong>
                  <span>/</span>
                  <span data-player-cap>250</span>
                </div>
                <span class="metric-card__meta">Peak today: <span data-player-peak>0</span></span>
              </div>
            </article>

            <article class="panel panel--countdown" data-countdown-root>
              <p class="section-label">Next restart</p>
              <div class="countdown" aria-live="polite">
                <div class="countdown__unit">
                  <strong data-countdown-hours>00</strong>
                  <span>Hours</span>
                </div>
                <div class="countdown__separator">:</div>
                <div class="countdown__unit">
                  <strong data-countdown-minutes>00</strong>
                  <span>Minutes</span>
                </div>
                <div class="countdown__separator">:</div>
                <div class="countdown__unit">
                  <strong data-countdown-seconds>00</strong>
                  <span>Seconds</span>
                </div>
              </div>

              <p class="countdown__meta" data-countdown-label>Today | 18:00 BST</p>
            </article>
          </div>

          <div class="home-hero__footer">
            <article class="home-footer-panel home-footer-panel--about">
              <p class="section-label">${pageData.about.label}</p>
              <p class="home-footer-panel__copy">${pageData.about.description}</p>
              <a class="home-footer-panel__link" ${buildLinkAttributes(pageData.about.link)}>${pageData.about.link.label}</a>
            </article>

            <article class="home-footer-panel home-footer-panel--schedule">
              <div class="home-footer-panel__heading">
                <div>
                  <p class="section-label">${pageData.schedule.label}</p>
                  <h2 class="home-footer-panel__title">${pageData.schedule.title}</h2>
                </div>
                <span class="home-footer-panel__meta">${pageData.schedule.meta}</span>
              </div>

              <div class="schedule-list" data-restart-schedule></div>
            </article>
          </div>
        </div>
      </div>

      <section class="department-strip">
        <div class="section-heading">
          <p class="section-label">${pageData.careerSection.label}</p>
          <h2 class="section-title">${pageData.careerSection.title}</h2>
        </div>

        <div class="department-strip__grid">
          ${pageData.careerCards
            .map(
              (card) => `
                <a class="department-card department-card--${card.variant}" ${this.buildDepartmentCardStyle(card)} ${buildLinkAttributes(card)}>
                  <span class="department-card__eyebrow">${card.eyebrow}</span>
                  <strong>${card.title}</strong>
                  <p>${card.description}</p>
                </a>
              `,
            )
            .join("")}
        </div>
      </section>
    `;
  }
}
