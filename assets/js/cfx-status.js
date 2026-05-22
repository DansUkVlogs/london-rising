export async function getCfxServerStatus(joinCode, fallbackData = {}) {
    try {
        const response = await fetch(
            `https://servers-frontend.fivem.net/api/servers/single/${encodeURIComponent(joinCode)}`,
            { cache: "no-store", headers: { Accept: "application/json" } }
        );
        if (!response.ok) throw new Error(`Cfx request failed: ${response.status}`);
        const payload = await response.json();
        const server = payload?.Data;
        if (!server) throw new Error("No server data returned");

        const playerCount = Number(server.clients ?? 0);
        const playerCap = Number(server.sv_maxclients ?? fallbackData.playerCap ?? 0);

        return {
            ...fallbackData,
            status: "Online",
            summary: `No known Cfx issues as of ${new Date().toLocaleTimeString()}`,
            playerCount,
            playerCap,
            peakToday: Math.max(Number(fallbackData.peakToday ?? 0), playerCount),
        };
    } catch (error) {
        return {
            ...fallbackData,
            status: "Offline",
            summary: "Cfx status unavailable",
            playerCount: 0,
            playerCap: Number(fallbackData.playerCap ?? 0),
            peakToday: Number(fallbackData.peakToday ?? 0),
        };
    }
}