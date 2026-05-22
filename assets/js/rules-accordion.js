export class RulesAccordion {
  constructor(root, rulesData) {
    this.root = root;
    this.rulesData = rulesData;
    this.sectionObserver = null;
    this.handleClick = this.handleClick.bind(this);
  }

  mount() {
    if (!this.root) {
      return;
    }

    this.render();
    this.root.addEventListener("click", this.handleClick);
    this.observeSections();
  }

  destroy() {
    this.root?.removeEventListener("click", this.handleClick);
    this.sectionObserver?.disconnect();
  }

  render() {
    const sidebar = this.root.querySelector("[data-rules-sidebar]");
    const content = this.root.querySelector("[data-rules-content]");

    if (!sidebar || !content) {
      return;
    }

    sidebar.innerHTML = `
      <nav class="rules-nav">
        ${this.rulesData
          .map(
            (section, index) => `
              <button
                class="rules-nav__button ${index === 0 ? "is-active" : ""}"
                type="button"
                data-rule-nav="${section.id}"
              >
                ${section.navTitle}
              </button>
            `,
          )
          .join("")}
      </nav>
    `;

    content.innerHTML = this.rulesData
      .map(
        (section) => `
          <section id="${section.id}" class="panel rule-section" data-rule-section="${section.id}">
            <header class="rule-section__heading">
              <h2 class="rule-section__title">${section.title}</h2>
              <p class="rule-section__intro">${section.intro}</p>
            </header>

            <div class="rule-items">
              ${section.items
                .map(
                  (item) => `
                    <article class="rule-item">
                      <strong class="rule-item__title">${item.title}</strong>
                      <p class="rule-item__copy">${item.body}</p>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>
        `,
      )
      .join("");
  }

  handleClick(event) {
    const navButton = event.target.closest("[data-rule-nav]");
    if (navButton) {
      this.scrollToSection(navButton.dataset.ruleNav);
    }
  }

  scrollToSection(sectionId) {
    const section = this.root.querySelector(`[data-rule-section="${sectionId}"]`);
    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    this.updateActiveNav(sectionId);
  }

  observeSections() {
    const sections = [...this.root.querySelectorAll("[data-rule-section]")];
    if (!sections.length || !("IntersectionObserver" in window)) {
      return;
    }

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry) {
          this.updateActiveNav(visibleEntry.target.dataset.ruleSection);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.15, 0.4, 0.7],
      },
    );

    sections.forEach((section) => this.sectionObserver.observe(section));
  }

  updateActiveNav(sectionId) {
    this.root.querySelectorAll("[data-rule-nav]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.ruleNav === sectionId);
    });
  }
}
