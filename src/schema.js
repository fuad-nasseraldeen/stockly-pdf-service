const { z } = require("zod");

const ColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  width: z.number().optional()
});

const PdfTableRequestSchema = z.object({
  storeName: z.string().min(1),
  title: z.string().min(1),
  printedAtISO: z.string().optional(),
  rtl: z.boolean().optional().default(false),
  columns: z.array(ColumnSchema).min(1),
  rows: z.array(z.record(z.any())).default([])
});

module.exports = { PdfTableRequestSchema };

