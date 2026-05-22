import { RulesAccordion } from "./rules-accordion.js";
import { toCssImageUrl } from "./asset-url.js";

export class RulesPageController {
  constructor(root, dataLoader, route) {
    this.root = root;
    this.dataLoader = dataLoader;
    this.route = route;
    this.rulesAccordion = null;
  }

  async mount() {
    if (!this.root) {
      return;
    }

    const { hero, rules } = await this.dataLoader.loadNamed({
      hero: `${this.route.dataFolder}/hero.json`,
      rules: `${this.route.dataFolder}/rules.json`,
    });

    this.applyHeroImage(hero.backgroundImage);

    this.root.innerHTML = `
      <header class="section-hero section-hero--rules" data-reveal>
        <p class="section-hero__eyebrow">${hero.eyebrow}</p>
        <h1 class="section-hero__title">${hero.title}</h1>
        <p class="section-hero__copy">${hero.description}</p>
      </header>

      <div class="rules-shell">
        <aside class="rules-shell__sidebar" data-rules-sidebar aria-label="Rule categories"></aside>
        <div class="rules-shell__content" data-rules-content></div>
      </div>
    `;

    this.rulesAccordion = new RulesAccordion(this.root, rules);
    this.rulesAccordion.mount();
  }

  destroy() {
    this.rulesAccordion?.destroy();
  }

  applyHeroImage(imagePath) {
    if (imagePath) {
      this.root.style.setProperty("--rules-hero-image", toCssImageUrl(imagePath));
      return;
    }

    this.root.style.removeProperty("--rules-hero-image");
  }
}
