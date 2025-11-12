// prisma.config.ts (Projekt-Root)
import "dotenv/config";
import { defineConfig } from "@prisma/config";
export default defineConfig({ schema: "./prisma/schema.prisma" });

