const express = require("express");
const helmet = require("helmet");

const { requireApiKey } = require("./security");
const { PdfTableRequestSchema } = require("./schema");
const { renderTablePdf, shutdownPdf } = require("./pdf");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
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
    console.error("PDF render failed:", err);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
});

const port = Number(process.env.PORT) || 3000;

const API_KEY = process.env.PDF_API_KEY;
if (!API_KEY) {
  throw new Error('PDF_API_KEY is not defined');
}
const server = app.listen(port, () => {
  console.log(`stockly-pdf-service listening on port ${port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {});
  await shutdownPdf();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

