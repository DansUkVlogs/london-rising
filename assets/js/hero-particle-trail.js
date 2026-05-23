export class HeroParticleTrail {
  constructor() {
    this.entries = [];
  }

  mount(root = document) {
    this.clear();

    if (!this.checkSupport() || !root?.querySelectorAll) {
      return;
    }

    const heroes = root.querySelectorAll("[data-hero-trail]");
    heroes.forEach((element) => {
      const entry = this.createEntry(element);
      this.entries.push(entry);

      element.addEventListener("pointerenter", entry.handlePointerEnter);
      element.addEventListener("pointermove", entry.handlePointerMove);
      element.addEventListener("pointerleave", entry.handlePointerLeave);
      element.addEventListener("pointercancel", entry.handlePointerLeave);
      element.addEventListener("mouseenter", entry.handlePointerEnter);
      element.addEventListener("mousemove", entry.handlePointerMove);
      element.addEventListener("mouseleave", entry.handlePointerLeave);
    });
  }

  clear() {
    this.entries.forEach((entry) => {
      const { element, overlay } = entry;
      element.removeEventListener("pointerenter", entry.handlePointerEnter);
      element.removeEventListener("pointermove", entry.handlePointerMove);
      element.removeEventListener("pointerleave", entry.handlePointerLeave);
      element.removeEventListener("pointercancel", entry.handlePointerLeave);
      element.removeEventListener("mouseenter", entry.handlePointerEnter);
      element.removeEventListener("mousemove", entry.handlePointerMove);
      element.removeEventListener("mouseleave", entry.handlePointerLeave);

      if (entry.frameId) {
        cancelAnimationFrame(entry.frameId);
      }

      overlay?.remove();
    });

    this.entries = [];
  }

  checkSupport() {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  createEntry(element) {
    element.style.setProperty("--hero-follow-x", "50%");
    element.style.setProperty("--hero-follow-y", "50%");
    element.style.setProperty("--hero-follow-opacity", "0");

    const overlay = document.createElement("div");
    overlay.className = "hero-particle-trail";
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.setProperty("--hero-follow-x", "50%");
    overlay.style.setProperty("--hero-follow-y", "50%");
    overlay.style.setProperty("--hero-follow-opacity", "0");
    overlay.innerHTML = `
      <span class="hero-particle hero-particle--1"></span>
      <span class="hero-particle hero-particle--2"></span>
      <span class="hero-particle hero-particle--3"></span>
      <span class="hero-particle hero-particle--4"></span>
      <span class="hero-particle hero-particle--5"></span>
      <span class="hero-particle hero-particle--6"></span>
      <span class="hero-particle hero-particle--7"></span>
    `;
    element.appendChild(overlay);

    const particleElements = Array.from(overlay.querySelectorAll(".hero-particle"));
    const particles = particleElements.map(() => ({
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
    }));

    const entry = {
      element,
      overlay,
      particleElements,
      particles,
      targetX: 0,
      targetY: 0,
      lastClientX: Number.NEGATIVE_INFINITY,
      lastClientY: Number.NEGATIVE_INFINITY,
      glowX: 0,
      glowY: 0,
      opacity: 0,
      targetOpacity: 0,
      frameId: 0,
      isRunning: false,
      isInitialized: false,
      isPointerInside: false,
    };

    entry.handlePointerEnter = (event) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }

      entry.isPointerInside = true;
      this.updateTargetFromEvent(entry, event);
      this.startFrame(entry);
    };

    entry.handlePointerMove = (event) => {
      entry.isPointerInside = true;
      this.updateTargetFromEvent(entry, event);
      this.startFrame(entry);
    };

    entry.handlePointerLeave = (event) => {
      entry.isPointerInside = false;

      if (typeof event?.clientX === "number" && typeof event?.clientY === "number") {
        entry.lastClientX = event.clientX;
        entry.lastClientY = event.clientY;
      }

      this.startFrame(entry);
    };

    return entry;
  }

  updateTargetFromEvent(entry, event) {
    const rect = entry.element.getBoundingClientRect();
    entry.lastClientX = event.clientX;
    entry.lastClientY = event.clientY;
    entry.targetX = event.clientX - rect.left;
    entry.targetY = event.clientY - rect.top;

    if (!entry.isInitialized) {
      entry.glowX = entry.targetX;
      entry.glowY = entry.targetY;
      entry.particles.forEach((particle) => {
        particle.currentX = entry.targetX;
        particle.currentY = entry.targetY;
        particle.targetX = entry.targetX;
        particle.targetY = entry.targetY;
      });
      entry.isInitialized = true;
    }
  }

  startFrame(entry) {
    if (entry.isRunning) {
      return;
    }

    entry.isRunning = true;
    entry.frameId = requestAnimationFrame(() => this.tick(entry));
  }

  tick(entry) {
    const rect = entry.element.getBoundingClientRect();
    const pointerStillInside = entry.lastClientX >= rect.left
      && entry.lastClientX <= rect.right
      && entry.lastClientY >= rect.top
      && entry.lastClientY <= rect.bottom;

    entry.targetOpacity = entry.isPointerInside || pointerStillInside ? 1 : 0;
    entry.opacity += (entry.targetOpacity - entry.opacity) * 0.18;
    entry.glowX += (entry.targetX - entry.glowX) * 0.2;
    entry.glowY += (entry.targetY - entry.glowY) * 0.2;
    entry.element.style.setProperty("--hero-follow-x", `${entry.glowX}px`);
    entry.element.style.setProperty("--hero-follow-y", `${entry.glowY}px`);
    entry.element.style.setProperty("--hero-follow-opacity", entry.opacity.toFixed(3));
    entry.overlay.style.setProperty("--hero-follow-x", `${entry.glowX}px`);
    entry.overlay.style.setProperty("--hero-follow-y", `${entry.glowY}px`);
    entry.overlay.style.setProperty("--hero-follow-opacity", entry.opacity.toFixed(3));

    entry.particles.forEach((particle, index) => {
      const leadX = index === 0 ? entry.targetX : entry.particles[index - 1].currentX;
      const leadY = index === 0 ? entry.targetY : entry.particles[index - 1].currentY;
      const easing = Math.max(0.11, 0.28 - (index * 0.02));

      particle.targetX = leadX;
      particle.targetY = leadY;
      particle.currentX += (particle.targetX - particle.currentX) * easing;
      particle.currentY += (particle.targetY - particle.currentY) * easing;

      const scale = Math.max(0.34, 1 - (index * 0.085));
      const opacity = Math.max(0, entry.opacity * (0.96 - (index * 0.095)));

      entry.particleElements[index].style.transform = `translate(${particle.currentX}px, ${particle.currentY}px) translate(-50%, -50%) scale(${scale})`;
      entry.particleElements[index].style.opacity = String(opacity);
    });

    const settled = Math.abs(entry.targetOpacity - entry.opacity) < 0.03
      && entry.particles.every((particle, index) => {
        const leadX = index === 0 ? entry.targetX : entry.particles[index - 1].currentX;
        const leadY = index === 0 ? entry.targetY : entry.particles[index - 1].currentY;
        return Math.abs(leadX - particle.currentX) < 0.4 && Math.abs(leadY - particle.currentY) < 0.4;
      });

    if (settled && entry.targetOpacity === 0) {
      entry.particleElements.forEach((particleElement) => {
        particleElement.style.opacity = "0";
      });
      entry.element.style.setProperty("--hero-follow-opacity", "0");
      entry.overlay.style.setProperty("--hero-follow-opacity", "0");
      entry.isRunning = false;
      entry.frameId = 0;
      return;
    }

    entry.frameId = requestAnimationFrame(() => this.tick(entry));
  }
}
