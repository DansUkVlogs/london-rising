export class FiveMStatusPoller {
  constructor(liveSourceConfig = {}, callbacks = {}) {
    this.liveSourceConfig = liveSourceConfig;
    this.onUpdate = callbacks.onUpdate ?? (() => {});
    this.onError = callbacks.onError ?? (() => {});
    this.timerId = 0;
    this.abortController = null;
    this.stopped = false;
  }

  start() {
    if (this.liveSourceConfig.provider !== "fivem" || !this.liveSourceConfig.joinCode) {
      return;
    }

    this.stopped = false;
    this.poll();
  }

  destroy() {
    this.stopped = true;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = 0;
    }

    this.abortController?.abort();
    this.abortController = null;
  }

  async poll() {
    this.abortController?.abort();
    this.abortController = new AbortController();

    const timeoutMs = Number(this.liveSourceConfig.requestTimeoutMs ?? 8000);
    const timeoutId = window.setTimeout(() => {
      this.abortController?.abort();
    }, timeoutMs);

    try {
      const response = await fetch(
        `https://servers-frontend.fivem.net/api/servers/single/${encodeURIComponent(this.liveSourceConfig.joinCode)}`,
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: this.abortController.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`FiveM status request failed with ${response.status}`);
      }

      const payload = await response.json();
      const server = payload?.Data;

      if (!server) {
        throw new Error("FiveM status response did not include server data");
      }

      this.onUpdate({
        status: "Online",
        summary: this.buildSummary(server),
        playerCount: Number(server.clients ?? 0),
        playerCap: Number(server.sv_maxclients ?? server.svMaxclients ?? 0),
      });
    } catch (_error) {
      this.onError();
    } finally {
      clearTimeout(timeoutId);

      if (!this.stopped) {
        const pollIntervalMs = Number(this.liveSourceConfig.pollIntervalMs ?? 30000);
        this.timerId = window.setTimeout(() => this.poll(), pollIntervalMs);
      }
    }
  }

  buildSummary(server) {
    const hostname = String(server.hostname ?? "").trim();
    if (hostname) {
      return hostname;
    }

    return "Server responding normally";
  }
}
