import { z } from "zod";

// Pagination commune aux routes admin. Les bornes (cap 200, default 50)
// vivent désormais ICI plutôt que dans admin-service : la validation
// d'entrée HTTP est un concern du middleware validateQuery (cf.
// validate-query.ts), pas de la couche métier.
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Filtres ventes (admin/stats/sales)
export const salesFilterQuerySchema = paginationQuerySchema.extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  expertId: z.string().cuid().optional(),
});

// Export CSV (admin/stats/export.csv)
export const salesExportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SalesFilterQuery = z.infer<typeof salesFilterQuerySchema>;
export type SalesExportQuery = z.infer<typeof salesExportQuerySchema>;
