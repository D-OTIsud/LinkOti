const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const express = require("express");

const app = express();

const PORT = Number.parseInt(process.env.PORT || "8080", 10);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = process.env.DATA_FILE || path.join(DATA_DIR, "page-data.json");
const DEFAULT_FILE = process.env.DEFAULT_FILE || path.join(DATA_DIR, "page-data.default.json");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

function isObject(x) {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

async function ensureDataFiles() {
  await fsp.mkdir(DATA_DIR, { recursive: true });

  const hasDefault = fs.existsSync(DEFAULT_FILE);
  const hasData = fs.existsSync(DATA_FILE);

  if (!hasDefault && hasData) {
    await fsp.copyFile(DATA_FILE, DEFAULT_FILE);
  }

  if (hasDefault && !hasData) {
    await fsp.copyFile(DEFAULT_FILE, DATA_FILE);
  }
}

async function readJsonFile(filePath) {
  const raw = await fsp.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!isObject(parsed)) throw new Error("Invalid JSON root (must be an object).");
  return parsed;
}

async function writeJsonFile(filePath, data) {
  if (!isObject(data)) throw new Error("Invalid JSON root (must be an object).");
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return next(); // no auth configured

  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  return next();
}

app.disable("x-powered-by");

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/page-data", async (_req, res) => {
  try {
    await ensureDataFiles();
    const data = await readJsonFile(DATA_FILE);
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

app.use("/api/page-data", express.json({ limit: "1mb" }));

app.put("/api/page-data", requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (!isObject(body)) return res.status(400).json({ ok: false, error: "Body must be a JSON object." });

    await ensureDataFiles();
    await writeJsonFile(DATA_FILE, body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: String(err?.message || err) });
  }
});

app.delete("/api/page-data", requireAdmin, async (_req, res) => {
  try {
    await ensureDataFiles();
    if (fs.existsSync(DEFAULT_FILE)) {
      const def = await readJsonFile(DEFAULT_FILE);
      await writeJsonFile(DATA_FILE, def);
    } else {
      await fsp.unlink(DATA_FILE);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

app.get("/", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on :${PORT}`);
});

