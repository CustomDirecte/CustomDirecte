const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const interfaceId = process.argv[2] || "classic";
const ports = { classic: 4173, legacy: 4174 };
const port = Number(process.env.POPUP_PREVIEW_PORT) || ports[interfaceId];

if (!port) {
  console.error(`Interface inconnue : ${interfaceId}. Utilisez classic ou legacy.`);
  process.exit(1);
}

const pages = {
  classic: "/dev/previews/classic.html",
  legacy: "/dev/previews/legacy.html",
};

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function resolveRequest(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? pages[interfaceId] : pathname.slice(1);
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return null;
  return target;
}

const server = http.createServer((request, response) => {
  try {
    const target = resolveRequest(request.url);
    if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(target).pipe(response);
  } catch (error) {
    response.writeHead(500);
    response.end(error.message);
  }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}${pages[interfaceId]}`;
  console.log(`Preview ${interfaceId} : ${url}`);
  const opener = process.platform === "win32" ? "explorer.exe" : process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(opener, [url], { detached: true, stdio: "ignore" });
  child.on("error", (error) => console.warn(`Ouverture automatique impossible : ${error.message}`));
  child.unref();
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
