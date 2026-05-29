import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT ?? process.argv[2] ?? 3000);

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

const server = createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host ?? `localhost:${port}`}`;
    const requestUrl = new URL(req.url ?? "/", origin);

    if (requestUrl.pathname === "/api/fivem/server-status") {
      await proxyFiveMStatus(requestUrl, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      writeJson(res, 405, { error: "Method not allowed" });
      return;
    }

    await serveStaticFile(requestUrl.pathname, res, req.method === "HEAD");
  } catch (error) {
    writeJson(res, 500, {
      error: "Internal server error",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(port, () => {
  console.log(`London Rising dev server running at http://localhost:${port}`);
});

async function serveStaticFile(pathname, res, headOnly) {
  const requestPath = pathname === "/" ? "/index.html" : pathname;
  const resolvedPath = resolve(workspaceRoot, `.${decodeURIComponent(requestPath)}`);

  if (resolvedPath !== workspaceRoot && !resolvedPath.startsWith(`${workspaceRoot}\\`)) {
    writeJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const body = await readFile(resolvedPath);
    res.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes.get(extname(resolvedPath).toLowerCase()) ?? "application/octet-stream",
    });

    if (!headOnly) {
      res.end(body);
      return;
    }

    res.end();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      writeJson(res, 404, { error: "Not found" });
      return;
    }

    throw error;
  }
}

function proxyFiveMStatus(requestUrl, res) {
  return (async () => {
    const joinCode = String(requestUrl.searchParams.get("joinCode") ?? "").trim();

    if (!joinCode) {
      writeJson(res, 400, { error: "Missing joinCode query parameter" });
      return;
    }

    try {
      const upstreamResponse = await fetch(
        `https://frontend.cfx-services.net/api/servers/single/${encodeURIComponent(joinCode)}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "london-rising-dev-server",
          },
        },
      );

      const body = Buffer.from(await upstreamResponse.arrayBuffer());
      const upstreamStatusCode = upstreamResponse.status;

      if (!upstreamResponse.ok) {
        writeJson(res, 200, {
          ok: false,
          offline: true,
          error: {
            statusCode: upstreamStatusCode,
            detail: body.toString("utf8").trim() || "FiveM upstream returned an error",
          },
        });
        return;
      }

      res.writeHead(upstreamStatusCode, {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
        "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8",
      });
      res.end(body);
    } catch (error) {
      writeJson(res, 200, {
        ok: false,
        offline: true,
        error: {
          statusCode: 502,
          detail: error instanceof Error ? error.message : String(error),
        },
      });
    }
  })();
}

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}
