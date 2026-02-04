const express = require("express");
const helmet = require("helmet");

const { requireApiKey } = require("./security");
const { PdfTableRequestSchema } = require("./schema");
const { renderTablePdf, shutdownPdf, checkBrowser } = require("./pdf");

const app = express();

// Basic CORS allowlist middleware
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000"
];

const ENV_ORIGINS = process.env.FRONTEND_ORIGINS
  ? process.env.FRONTEND_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

const ALLOWED_ORIGINS = ENV_ORIGINS.length > 0 ? ENV_ORIGINS : DEFAULT_ALLOWED_ORIGINS;

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Always allow any *.vercel.app frontend
  return origin.endsWith(".vercel.app");
}

app.use((req, res, next) => {
  const origin = req.header("Origin");

  if (origin && isAllowedOrigin(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    // cache successful preflight responses
    res.header("Access-Control-Max-Age", "600");
  }

  if (req.method === "OPTIONS") {
    // Fast path for preflight requests, no auth required
    return res.sendStatus(204);
  }

  next();
});

// Minimal logging for /pdf/* routes
app.use("/pdf", (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[pdf] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

app.use(helmet());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/debug/browser", async (req, res) => {
  try {
    await checkBrowser();
    res.json({ ok: true });
  } catch (err) {
    console.error("Playwright chromium launch failed:", err.stack || err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.post("/pdf/table", requireApiKey, async (req, res) => {
  const parsed = PdfTableRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten()
    });
  }

  try {
    const pdf = await renderTablePdf(parsed.data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="table.pdf"');
    return res.status(200).send(pdf);
  } catch (err) {
    console.error("PDF render failed:", err.stack || err);
    return res.status(500).json({
      error: "Failed to generate PDF",
      details: err.message
    });
  }
});

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, async () => {
  console.log(`stockly-pdf-service listening on port ${port}`);
  // Startup self-check: verify Playwright can launch
  try {
    await checkBrowser();
    console.log("Playwright chromium launch check: OK");
  } catch (err) {
    console.error("Playwright chromium launch failed:", err.stack || err);
  }
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {});
  await shutdownPdf();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

