export class MobileMenu {
  constructor({ toggleButton, closeButton, drawer, backdrop }) {
    this.toggleButton = toggleButton;
    this.closeButton = closeButton;
    this.drawer = drawer;
    this.backdrop = backdrop;
    this.isOpen = false;
    this.returnFocusElement = null;
    this.hideTimeoutId = 0;

    this.handleToggle = this.handleToggle.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);
  }

  init() {
    this.toggleButton?.addEventListener("click", this.handleToggle);
    this.closeButton?.addEventListener("click", this.handleClose);
    this.backdrop?.addEventListener("click", this.handleClose);
    window.addEventListener("resize", this.handleViewportChange);
  }

  destroy() {
    this.toggleButton?.removeEventListener("click", this.handleToggle);
    this.closeButton?.removeEventListener("click", this.handleClose);
    this.backdrop?.removeEventListener("click", this.handleClose);
    document.removeEventListener("keydown", this.handleKeydown);
    window.removeEventListener("resize", this.handleViewportChange);
  }

  open() {
    if (this.isOpen || !this.drawer || !this.backdrop) {
      return;
    }

    window.clearTimeout(this.hideTimeoutId);
    this.isOpen = true;
    this.returnFocusElement = document.activeElement;
    document.body.classList.add("menu-is-open");
    this.drawer.hidden = false;
    this.backdrop.hidden = false;
    this.drawer.setAttribute("aria-hidden", "false");
    this.toggleButton?.setAttribute("aria-expanded", "true");

    requestAnimationFrame(() => {
      this.drawer.classList.add("is-open");
    });

    document.addEventListener("keydown", this.handleKeydown);
    this.focusFirstElement();
  }

  close({ returnFocus = true } = {}) {
    if (!this.isOpen || !this.drawer || !this.backdrop) {
      return;
    }

    this.isOpen = false;
    this.drawer.classList.remove("is-open");
    this.drawer.setAttribute("aria-hidden", "true");
    this.toggleButton?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-is-open");
    document.removeEventListener("keydown", this.handleKeydown);

    this.hideTimeoutId = window.setTimeout(() => {
      this.drawer.hidden = true;
      this.backdrop.hidden = true;
    }, 280);

    if (returnFocus && this.returnFocusElement instanceof HTMLElement) {
      this.returnFocusElement.focus();
    }
  }

  handleToggle() {
    if (this.isOpen) {
      this.close();
      return;
    }

    this.open();
  }

  handleClose() {
    this.close();
  }

  handleViewportChange() {
    if (window.innerWidth >= 960 && this.isOpen) {
      this.close({ returnFocus: false });
    }
  }

  handleKeydown(event) {
    if (event.key === "Escape") {
      this.close();
      return;
    }

    if (event.key === "Tab") {
      this.trapFocus(event);
    }
  }

  focusFirstElement() {
    const focusable = this.getFocusableElements();
    focusable[0]?.focus();
  }

  trapFocus(event) {
    const focusable = this.getFocusableElements();
    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  getFocusableElements() {
    if (!this.drawer) {
      return [];
    }

    return [...this.drawer.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")];
  }
}
