import { toAssetUrl } from "./asset-url.js?v=20260523k";

export class StaffProfileModal {
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
    modal.className = "staff-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="staff-modal__backdrop" data-staff-modal-close></div>
      <div class="staff-modal__panel" role="dialog" aria-modal="true" aria-labelledby="staff-modal-title">
        <button class="staff-modal__close" type="button" data-staff-modal-close aria-label="Close profile">&#x2715;</button>
        <div class="staff-modal__hero">
          <div class="staff-modal__image-shell">
            <img class="staff-modal__image" data-staff-modal-image alt="" />
          </div>

          <div class="staff-modal__hero-copy">
            <p class="section-label">Staff profile</p>
            <h2 class="staff-modal__name" id="staff-modal-title" data-staff-modal-name></h2>
            <p class="staff-modal__role" data-staff-modal-role></p>
            <p class="staff-modal__summary" data-staff-modal-summary></p>
          </div>
        </div>

        <div class="staff-modal__body" data-staff-modal-body></div>
      </div>
    `;

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-staff-modal-close]")) {
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

  open(profile, fallbackProfileImage) {
    if (!this.modalElement || !profile) {
      return;
    }

    this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const modalImage = this.modalElement.querySelector("[data-staff-modal-image]");
    const imageShell = this.modalElement.querySelector(".staff-modal__image-shell");
    const name = this.modalElement.querySelector("[data-staff-modal-name]");
    const role = this.modalElement.querySelector("[data-staff-modal-role]");
    const summary = this.modalElement.querySelector("[data-staff-modal-summary]");
    const body = this.modalElement.querySelector("[data-staff-modal-body]");

    if (imageShell instanceof HTMLElement) {
      imageShell.hidden = Boolean(profile.sectionCard);
    }

    if (modalImage instanceof HTMLImageElement) {
      modalImage.src = toAssetUrl(profile.image || fallbackProfileImage);
      modalImage.alt = `${profile.name} profile picture`;
    }

    if (name) {
      name.textContent = profile.name ?? "";
    }

    if (role) {
      role.textContent = profile.role ?? "";
    }

    if (summary) {
      summary.textContent = profile.summary ?? "";
    }

    if (body) {
      const paragraphs = this.toParagraphs(profile.fullDescription ?? profile.summary ?? "");
      body.innerHTML = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
    }

    this.modalElement.setAttribute("aria-hidden", "false");
    this.modalElement.classList.add("is-open");
    document.body.style.overflow = "hidden";
    this.modalElement.querySelector(".staff-modal__close")?.focus();
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
    return String(text ?? "")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }
}
