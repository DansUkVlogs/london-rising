export class RestartCountdown {
  constructor(root, restartTimes, timezoneLabel) {
    this.root = root;
    this.restartTimes = restartTimes;
    this.timezoneLabel = timezoneLabel;
    this.intervalId = 0;
  }

  mount() {
    if (!this.root) {
      return;
    }

    this.update();
    this.intervalId = window.setInterval(() => this.update(), 1000);
  }

  destroy() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }

  update() {
    const now = new Date();
    const nextRestart = this.getNextRestart(now);
    const difference = Math.max(nextRestart.getTime() - now.getTime(), 0);

    const hours = Math.floor(difference / 3_600_000);
    const minutes = Math.floor((difference % 3_600_000) / 60_000);
    const seconds = Math.floor((difference % 60_000) / 1000);

    this.setValue("[data-countdown-hours]", hours);
    this.setValue("[data-countdown-minutes]", minutes);
    this.setValue("[data-countdown-seconds]", seconds);

    const label = this.root.querySelector("[data-countdown-label]");
    if (label) {
      label.textContent = this.formatTargetLabel(now, nextRestart);
    }
  }

  setValue(selector, value) {
    const element = this.root.querySelector(selector);
    if (element) {
      element.textContent = String(value).padStart(2, "0");
    }
  }

  getNextRestart(now) {
    const candidates = this.restartTimes
      .map((time) => {
        const [hours, minutes] = time.split(":").map(Number);
        const candidate = new Date(now);
        candidate.setHours(hours, minutes, 0, 0);
        return candidate;
      })
      .sort((left, right) => left.getTime() - right.getTime());

    const nextToday = candidates.find((candidate) => candidate.getTime() > now.getTime());
    if (nextToday) {
      return nextToday;
    }

    const [hours, minutes] = this.restartTimes[0].split(":").map(Number);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  }

  formatTargetLabel(now, target) {
    const isTomorrow = target.getDate() !== now.getDate()
      || target.getMonth() !== now.getMonth()
      || target.getFullYear() !== now.getFullYear();

    const dayLabel = isTomorrow ? "Tomorrow" : "Today";
    const timeLabel = target.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${dayLabel} | ${timeLabel} ${this.timezoneLabel}`;
  }
}
