const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, scans: {}, profiles: {}, carePlans: {} }, null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDatabase(db) {
  ensureDatabase();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function userIdFrom(value) {
  return crypto.createHash("sha1").update(String(value || "demo-farmer").toLowerCase()).digest("hex").slice(0, 16);
}

function assistantReply(question) {
  const q = String(question || "").toLowerCase();
  if (q.includes("fungal") || q.includes("disease") || q.includes("rain")) {
    return "After rain, inspect lower leaves first, remove infected leaves, improve airflow, and spray only after leaves dry.";
  }
  if (q.includes("water") || q.includes("irrigation")) {
    return "Water early morning or evening. Check soil 5 cm deep first and avoid wetting leaves when disease pressure is high.";
  }
  if (q.includes("fertilizer") || q.includes("npk") || q.includes("manure")) {
    return "Use compost before planting and split fertilizer into smaller doses. A soil test gives the safest NPK schedule.";
  }
  if (q.includes("pest") || q.includes("insect") || q.includes("whitefly") || q.includes("aphid")) {
    return "Check the underside of leaves. Start with traps, neem-based spray, and field sanitation before stronger pesticide use.";
  }
  if (q.includes("soil")) {
    return "Add compost, rotate crops, avoid repeated deep tillage, and keep soil draining well while holding moisture.";
  }
  return "Share crop name, plant age, symptoms, and weather for better advice. Meanwhile, isolate affected plants and keep photo records.";
}

async function handleApi(request, response, url) {
  const db = readDatabase();

  if (request.method === "GET" && url.pathname === "/api/health") {
    return sendJson(response, 200, { ok: true, app: "AgriVision AI", mode: "full-stack" });
  }

  if (request.method === "POST" && url.pathname === "/api/login") {
    const body = await readBody(request);
    const userId = userIdFrom(body.loginId);
    db.users[userId] = {
      id: userId,
      loginId: body.loginId || "Farmer",
      lastLoginAt: new Date().toISOString()
    };
    writeDatabase(db);
    return sendJson(response, 200, { user: db.users[userId] });
  }

  const userId = url.searchParams.get("userId") || "demo-farmer";

  if (url.pathname === "/api/profile") {
    if (request.method === "GET") {
      return sendJson(response, 200, { profile: db.profiles[userId] || {} });
    }
    if (request.method === "PUT") {
      const body = await readBody(request);
      db.profiles[userId] = body.profile || body;
      writeDatabase(db);
      return sendJson(response, 200, { profile: db.profiles[userId] });
    }
  }

  if (url.pathname === "/api/scans") {
    if (request.method === "GET") {
      return sendJson(response, 200, { scans: db.scans[userId] || [] });
    }
    if (request.method === "POST") {
      const body = await readBody(request);
      const scan = {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        ...body.scan
      };
      db.scans[userId] = [scan, ...(db.scans[userId] || [])].slice(0, 20);
      writeDatabase(db);
      return sendJson(response, 201, { scan, scans: db.scans[userId] });
    }
    if (request.method === "DELETE") {
      db.scans[userId] = [];
      writeDatabase(db);
      return sendJson(response, 200, { scans: [] });
    }
  }

  if (url.pathname === "/api/care-plan") {
    if (request.method === "GET") {
      return sendJson(response, 200, { carePlan: db.carePlans[userId] || {} });
    }
    if (request.method === "PUT") {
      const body = await readBody(request);
      db.carePlans[userId] = body.carePlan || body;
      writeDatabase(db);
      return sendJson(response, 200, { carePlan: db.carePlans[userId] });
    }
  }

  if (request.method === "POST" && url.pathname === "/api/assistant") {
    const body = await readBody(request);
    return sendJson(response, 200, { reply: assistantReply(body.question) });
  }

  sendJson(response, 404, { error: "API route not found" });
}

function serveStatic(request, response, url) {
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(ROOT, requestedPath));

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
    });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }
    serveStatic(request, response, url);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`AgriVision AI full-stack app running at http://localhost:${PORT}`);
});
