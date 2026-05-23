export class RulesAccordion {
  constructor(root, rulesData, layoutData = {}) {
    this.root = root;
    this.rulesData = rulesData;
    this.layoutData = layoutData;
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
      <div class="rules-sidebar-card">
        <h2 class="rules-sidebar-card__title">${this.layoutData.sidebarTitle ?? "Rules"}</h2>

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

        <aside class="rules-agreement-card">
          <div class="rules-agreement-card__icon" aria-hidden="true">${this.renderAgreementIcon()}</div>
          <p class="rules-agreement-card__copy">${this.layoutData.agreementCard?.text ?? "By playing on London Rising RP, you agree to follow all rules. No excuses."}</p>
        </aside>
      </div>
    `;

    content.innerHTML = this.rulesData
      .map(
        (section) => `
          <section id="${section.id}" class="rule-section" data-rule-section="${section.id}">
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

  renderAgreementIcon() {
    const iconType = this.layoutData.agreementCard?.iconType ?? "justice-badge";

    if (iconType !== "justice-badge") {
      return "";
    }

    return `
      <svg class="rules-agreement-card__icon-svg" viewBox="0 0 128 128" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M49 106C31 95 21 78 19 58C17 39 24 22 39 11" stroke-width="2.4" opacity="0.94" />
          <path d="M79 106C97 95 107 78 109 58C111 39 104 22 89 11" stroke-width="2.4" opacity="0.94" />
          <path d="M55 107L63 97" stroke-width="2.4" opacity="0.94" />
          <path d="M73 107L65 97" stroke-width="2.4" opacity="0.94" />
        </g>

        <g fill="currentColor" opacity="0.96">
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(40 93) rotate(-72)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(31 80) rotate(-58)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(25 66) rotate(-42)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(23 51) rotate(-26)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(25 36) rotate(-10)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(32 23) rotate(8)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(43 14) rotate(26)" />

          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(88 93) rotate(72)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(97 80) rotate(58)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(103 66) rotate(42)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(105 51) rotate(26)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(103 36) rotate(10)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(96 23) rotate(-8)" />
          <path d="M0 -9C4 -7 6 -2 6 4C6 10 2 14 0 16C-2 14 -6 10 -6 4C-6 -2 -4 -7 0 -9Z" transform="translate(85 14) rotate(-26)" />
        </g>

        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <path d="M64 31V76" stroke-width="3.4" />
          <path d="M44 42H84" stroke-width="3.2" />
          <path d="M50 42L44 57" stroke-width="2.2" opacity="0.92" />
          <path d="M50 42L56 57" stroke-width="2.2" opacity="0.92" />
          <path d="M78 42L72 57" stroke-width="2.2" opacity="0.92" />
          <path d="M78 42L84 57" stroke-width="2.2" opacity="0.92" />
          <path d="M44 57H56" stroke-width="2.8" />
          <path d="M72 57H84" stroke-width="2.8" />
          <path d="M50 42V57" stroke-width="1.9" opacity="0.9" />
          <path d="M78 42V57" stroke-width="1.9" opacity="0.9" />
          <circle cx="64" cy="42" r="4.2" stroke-width="2.2" />
          <path d="M60 81H68" stroke-width="3.2" />
          <path d="M56 84H72" stroke-width="4.2" />
        </g>
      </svg>
    `;
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
