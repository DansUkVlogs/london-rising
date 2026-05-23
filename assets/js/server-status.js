import { FiveMStatusPoller } from "./fivem-status-poller.js?v=20260523c";

export class ServerStatus {
  constructor(root, serverData) {
    this.root = root;
    this.serverData = { ...serverData };
    this.animationFrames = new Map();
    this.poller = null;
    this.lastKnownPlayerCap = Number(serverData.playerCap ?? 0);
  }

  mount() {
    if (!this.root) {
      return;
    }

    const liveSource = this.serverData.liveSource ?? {};

    this.renderSchedule();
    this.applyStatus(
      {
        status: liveSource.provider === "fivem" ? "Online" : this.serverData.status,
        summary: liveSource.provider === "fivem" ? "Checking live FiveM status..." : this.serverData.summary,
        playerCount: liveSource.provider === "fivem" ? 0 : Number(this.serverData.playerCount ?? 0),
        playerCap: Number(this.serverData.playerCap ?? 0),
      },
      {
        playerAnimationDuration: 800,
      },
    );

    if (liveSource.provider === "fivem" && liveSource.joinCode) {
      this.poller = new FiveMStatusPoller(liveSource, {
        onUpdate: (nextStatus) => {
          this.applyStatus(nextStatus, {
            playerAnimationDuration: 700,
          });
        },
        onError: () => {
          this.applyStatus(
            {
              status: "Offline",
              summary: "Live FiveM status unavailable right now",
              playerCount: 0,
              playerCap: this.lastKnownPlayerCap,
            },
            {
              playerAnimationDuration: 650,
            },
          );
        },
      });

      this.poller.start();
    }
  }

  destroy() {
    this.poller?.destroy();
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

    scheduleRoot.innerHTML = (this.serverData.restartSchedule ?? [])
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

  applyStatus(nextStatus, options = {}) {
    const normalizedStatus = String(nextStatus.status ?? "Offline");
    const playerCount = Number(nextStatus.playerCount ?? 0);
    const playerCap = Number(nextStatus.playerCap ?? this.lastKnownPlayerCap ?? 0);

    if (playerCap > 0) {
      this.lastKnownPlayerCap = playerCap;
    }

    this.setText("[data-server-status-text]", normalizedStatus.toUpperCase());
    this.setText("[data-server-status-summary]", nextStatus.summary ?? "Status unavailable");
    this.setText("[data-player-cap]", String(playerCap || this.lastKnownPlayerCap || 0));

    const statusRoot = this.root.querySelector("[data-server-status-root]");
    if (statusRoot) {
      statusRoot.dataset.status = normalizedStatus.toLowerCase();
    }

    this.animateMetric("[data-player-count]", playerCount, options.playerAnimationDuration ?? 700);
  }

  animateMetric(selector, targetValue, duration) {
    const element = this.root.querySelector(selector);
    if (!element) {
      return;
    }

    const existingFrameId = this.animationFrames.get(element);
    if (existingFrameId) {
      cancelAnimationFrame(existingFrameId);
      this.animationFrames.delete(element);
    }

    const nextValue = Number(targetValue ?? 0);
    const startValue = this.parseMetricValue(element.textContent);

    if (duration <= 0 || startValue === nextValue) {
      element.textContent = String(nextValue);
      return;
    }

    const startTime = performance.now();
    let frameId = 0;

    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentValue = Math.round(
        startValue + ((nextValue - startValue) * this.easeOutCubic(progress)),
      );

      element.textContent = String(currentValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
        this.animationFrames.set(element, frameId);
        return;
      }

      element.textContent = String(nextValue);
      this.animationFrames.delete(element);
    };

    frameId = requestAnimationFrame(tick);
    this.animationFrames.set(element, frameId);
  }

  parseMetricValue(value) {
    const numericValue = Number(String(value ?? "").replace(/[^\d-]/g, ""));
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  easeOutCubic(value) {
    return 1 - (1 - value) ** 3;
  }
}
