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
      const response = await fetch(this.buildRequestUrl(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`FiveM status request failed with ${response.status}`);
      }

      const payload = await response.json();
      if (payload?.ok === false || payload?.error) {
        throw new Error(payload?.error?.detail ?? "FiveM status unavailable");
      }

      const server = payload?.Data ?? payload;

      if (!server) {
        throw new Error("FiveM status response did not include server data");
      }

      this.onUpdate({
        status: server.offline === true ? "Offline" : "Online",
        summary: this.buildSummary(server),
        playerCount: Number(server.clients ?? server.playersCurrent ?? 0),
        playerCap: Number(server.sv_maxclients ?? server.svMaxclients ?? server.playersMax ?? 0),
        metricLabel: "Current players",
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

  buildRequestUrl() {
    const joinCode = String(this.liveSourceConfig.joinCode ?? "").trim();
    const proxyPath = String(this.liveSourceConfig.proxyPath ?? "").trim();

    if (proxyPath) {
      if (proxyPath.includes("{joinCode}")) {
        return new URL(
          proxyPath.replaceAll("{joinCode}", encodeURIComponent(joinCode)),
          window.location.origin,
        ).toString();
      }

      const proxyUrl = new URL(proxyPath, window.location.origin);
      proxyUrl.searchParams.set("joinCode", joinCode);
      return proxyUrl.toString();
    }

    return `https://frontend.cfx-services.net/api/servers/single/${encodeURIComponent(joinCode)}`;
  }

  buildSummary(server) {
    const hostname = String(server.hostname ?? server.projectName ?? "").trim();
    if (hostname) {
      return hostname;
    }

    return "Server responding normally";
  }
}
