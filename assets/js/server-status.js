export class ServerStatus {
  constructor(root, serverData) {
    this.root = root;
    this.serverData = serverData;
    this.animationFrames = new Set();
  }

  mount() {
    if (!this.root) {
      return;
    }

    this.setText("[data-server-status-text]", this.serverData.status.toUpperCase());
    this.setText("[data-server-status-summary]", this.serverData.summary);
    this.setText("[data-player-cap]", String(this.serverData.playerCap));

    const statusRoot = this.root.querySelector("[data-server-status-root]");
    if (statusRoot) {
      statusRoot.dataset.status = this.serverData.status.toLowerCase();
    }

    this.renderSchedule();
    this.animateMetric("[data-player-count]", this.serverData.playerCount, 800);
    this.animateMetric("[data-player-peak]", this.serverData.peakToday, 1000);
  }

  destroy() {
    this.animationFrames.forEach((frameId) => cancelAnimationFrame(frameId));
    this.animationFrames.clear();
  }

  setText(selector, value) {
    const element = this.root.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  renderSchedule() {
    const scheduleRoot = this.root.querySelector("[data-restart-schedule]");
    if (!scheduleRoot) {
      return;
    }

    scheduleRoot.innerHTML = this.serverData.restartSchedule
      .map(
        (entry) => `
          <article class="schedule-list__item">
            <strong class="schedule-list__title">${entry.title}</strong>
            <span class="schedule-list__detail">${entry.detail}</span>
          </article>
        `,
      )
      .join("");
  }

  animateMetric(selector, targetValue, duration) {
    const element = this.root.querySelector(selector);
    if (!element) {
      return;
    }

    const startTime = performance.now();
    let frameId = 0;

    const tick = (currentTime) => {
      if (frameId) {
        this.animationFrames.delete(frameId);
      }

      const progress = Math.min((currentTime - startTime) / duration, 1);
      const nextValue = Math.round(targetValue * this.easeOutCubic(progress));
      element.textContent = String(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
        this.animationFrames.add(frameId);
      }
    };

    frameId = requestAnimationFrame(tick);
    this.animationFrames.add(frameId);
  }

  easeOutCubic(value) {
    return 1 - (1 - value) ** 3;
  }
}
