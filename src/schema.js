const { z } = require("zod");

const ColumnSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  width: z.number().positive().nullable()
});

const PdfTableRequestSchema = z.object({
  storeName: z.string().min(1),
  title: z.string().min(1),
  printedAtISO: z.string().min(1),
  rtl: z.boolean().optional().default(false),
  columns: z.array(ColumnSchema).min(1),
  rows: z.array(z.record(z.union([z.string(), z.number(), z.null()])))
});

module.exports = { PdfTableRequestSchema };

