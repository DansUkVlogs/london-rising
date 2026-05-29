import { toCssImageUrl } from "./asset-url.js?v=20260529g";

export class JobDetailModal {
  constructor() {
    this.modalElement = null;
    this.escListener = null;
    this.lastFocusedElement = null;
  }

  mount() {
    if (this.modalElement) {
      return;
    }

    const modal = document.createElement("div");
    modal.className = "job-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="job-modal__backdrop" data-job-modal-close></div>
      <div class="job-modal__panel" role="dialog" aria-modal="true" aria-labelledby="job-modal-title">
        <button class="job-modal__close" type="button" data-job-modal-close aria-label="Close details">&#x2715;</button>
        <div class="job-modal__hero" data-job-modal-hero>
          <div class="job-modal__hero-content">
            <p class="section-label job-modal__label" data-job-modal-label></p>
            <div class="job-modal__hero-row">
              <strong class="job-modal__number" data-job-modal-number></strong>
              <h2 class="job-modal__title" id="job-modal-title" data-job-modal-title></h2>
              <span class="job-modal__salary" data-job-modal-salary></span>
            </div>
            <p class="job-modal__summary" data-job-modal-summary></p>
          </div>
        </div>
        <div class="job-modal__body">
          <div class="job-modal__details">
            <p class="section-label" data-job-modal-details-label>Requirements</p>
            <ul class="job-modal__tags" data-job-modal-tags></ul>
          </div>
          <div class="job-modal__copy" data-job-modal-copy></div>
        </div>
      </div>
    `;

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-job-modal-close]")) {
        this.close();
      }
    });

    this.escListener = (event) => {
      if (event.key === "Escape") {
        this.close();
      }
    };

    document.body.appendChild(modal);
    document.addEventListener("keydown", this.escListener);
    this.modalElement = modal;
  }

  destroy() {
    if (!this.modalElement) {
      return;
    }

    this.close({ restoreFocus: false });
    document.removeEventListener("keydown", this.escListener);
    this.modalElement.remove();
    this.modalElement = null;
    this.escListener = null;
  }

  open(item, options = {}) {
    if (!this.modalElement || !item) {
      return;
    }

    this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const label = this.modalElement.querySelector("[data-job-modal-label]");
    const number = this.modalElement.querySelector("[data-job-modal-number]");
    const title = this.modalElement.querySelector("[data-job-modal-title]");
    const salary = this.modalElement.querySelector("[data-job-modal-salary]");
    const summary = this.modalElement.querySelector("[data-job-modal-summary]");
    const copy = this.modalElement.querySelector("[data-job-modal-copy]");
    const detailsLabel = this.modalElement.querySelector("[data-job-modal-details-label]");
    const tags = this.modalElement.querySelector("[data-job-modal-tags]");
    const hero = this.modalElement.querySelector("[data-job-modal-hero]");

    if (label) {
      label.textContent = options.label ?? "";
    }

    if (number) {
      number.textContent = item.number ?? "";
    }

    if (title) {
      title.textContent = item.title ?? "";
    }

    if (salary) {
      salary.textContent = item.salary ?? "Salary varies";
      salary.hidden = !item.salary;
    }

    if (summary) {
      summary.textContent = item.description ?? "";
    }

    if (copy) {
      const paragraphs = this.toParagraphs(item.longDescription ?? item.description ?? "");
      copy.innerHTML = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
    }

    if (tags) {
      tags.innerHTML = (item.requirements ?? item.tags ?? []).map((tag) => `<li>${tag}</li>`).join("");
    }

    if (detailsLabel) {
      detailsLabel.textContent = options.detailsLabel ?? (
        Array.isArray(item.requirements) && item.requirements.length
          ? "Requirements"
          : "Role details"
      );
    }

    if (hero instanceof HTMLElement) {
      if (item.backgroundImage) {
        hero.style.setProperty("--job-modal-image", toCssImageUrl(item.backgroundImage));
      } else {
        hero.style.removeProperty("--job-modal-image");
      }

      if (item.accentColor) {
        hero.style.setProperty("--job-modal-accent", item.accentColor);
      } else {
        hero.style.removeProperty("--job-modal-accent");
      }
    }

    this.modalElement.setAttribute("aria-hidden", "false");
    this.modalElement.classList.add("is-open");
    document.body.style.overflow = "hidden";
    this.modalElement.querySelector(".job-modal__close")?.focus();
  }

  close({ restoreFocus = true } = {}) {
    if (!this.modalElement) {
      return;
    }

    this.modalElement.setAttribute("aria-hidden", "true");
    this.modalElement.classList.remove("is-open");
    document.body.style.overflow = "";

    if (restoreFocus) {
      this.lastFocusedElement?.focus?.();
    }
  }

  toParagraphs(text) {
    return String(text)
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }
}
