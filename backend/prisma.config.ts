import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Les migrations passent par DIRECT_URL si défini : derrière un pooler de
    // connexions, DATABASE_URL ne convient pas aux opérations DDL. En local,
    // DIRECT_URL peut rester vide.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
