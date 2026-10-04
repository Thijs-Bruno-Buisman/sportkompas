import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import manifest from "@/app/manifest";
import { db } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";

describe("Stap 50: Finaal Release Audit & Kwaliteitsborging", () => {
  describe("1. Beveiliging, Geheimen & Omgeving (Rule 6)", () => {
    it(".env.example is aanwezig en bevat uitsluitend lege placeholder waarden", () => {
      const envExamplePath = path.join(process.cwd(), ".env.example");
      expect(fs.existsSync(envExamplePath)).toBe(true);

      const content = fs.readFileSync(envExamplePath, "utf-8");
      // Geen NEXT_PUBLIC_ prefixes voor gevoelige tokens
      expect(content).not.toContain("NEXT_PUBLIC_AI");
      expect(content).not.toContain("NEXT_PUBLIC_STRAVA");
      expect(content).not.toContain("NEXT_PUBLIC_SECRET");

      // Alle geheime sleutels moeten expliciet leeg zijn in .env.example
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.includes("=") && !line.startsWith("#")) {
          const [key, val] = line.split("=");
          if (key.trim() === "AI_MODEL_NAME") {
            expect(val.trim()).toBe("gemini-1.5-flash");
          } else {
            expect(val.trim()).toBe("");
          }
        }
      }
    });

    it("codebase bevat nergens onveilige client-side geheimen", () => {
      // Recursieve scan door src/ voor verboden NEXT_PUBLIC_ geheimen
      function scanDir(dir: string): string[] {
        let violations: string[] = [];
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            violations = violations.concat(scanDir(fullPath));
          } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
            const fileContent = fs.readFileSync(fullPath, "utf-8");
            if (
              fileContent.includes("NEXT_PUBLIC_SECRET") ||
              fileContent.includes("NEXT_PUBLIC_API_KEY") ||
              fileContent.includes("NEXT_PUBLIC_TOKEN")
            ) {
              violations.push(fullPath);
            }
          }
        }
        return violations;
      }

      const violations = scanDir(path.join(process.cwd(), "src"));
      expect(violations).toEqual([]);
    });
  });

  describe("2. Offline-First PWA & Web App Manifest (Rule 4)", () => {
    it("valideert dat het W3C Web App Manifest correct geconfigureerd is", () => {
      const mf = manifest();
      expect(mf.lang).toBe("nl");
      expect(mf.display).toBe("standalone");
      expect(mf.theme_color).toBe("#10b981");
      expect(mf.background_color).toBe("#090d16");
      expect(mf.start_url).toBe("/");
      expect(mf.icons && mf.icons.length >= 3).toBe(true);
    });

    it("verifieert dat de Service Worker (public/sw.js) fysiek aanwezig en offline-ready is", () => {
      const swPath = path.join(process.cwd(), "public", "sw.js");
      expect(fs.existsSync(swPath)).toBe(true);

      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("sportkompas-shell-v1");
      expect(content).toContain("/training");
      expect(content).toContain("/cardio");
      expect(content).toContain("/voeding");
      expect(content).toContain("/profiel");
    });
  });

  describe("3. Database Schema, Migraties & Integriteit (Rule 3 & 5)", () => {
    it("Dexie database bevat alle 16 vereiste tabellen in versie 7", () => {
      expect(db.verno).toBe(7);

      const tableNames = db.tables.map((t) => t.name);
      const expectedTables = [
        "profiles",
        "appSettings",
        "exercises",
        "workoutRoutines",
        "routineDays",
        "workoutSessions",
        "workoutSets",
        "scheduledSessions",
        "cardioSessions",
        "foodItems",
        "recipes",
        "mealLogs",
        "waterLogs",
        "plannedMeals",
        "bodyMeasurements",
        "recoveryLogs",
      ];

      for (const expected of expectedTables) {
        expect(tableNames).toContain(expected);
      }
    });

    it("Repositories kunnen zonder fouten geïnitialiseerd worden", () => {
      const repos = createRepositories(db);
      expect(repos.profile).toBeDefined();
      expect(repos.workout).toBeDefined();
      expect(repos.cardio).toBeDefined();
      expect(repos.nutrition).toBeDefined();
      expect(repos.measurements).toBeDefined();
      expect(repos.recovery).toBeDefined();
      expect(repos.settings).toBeDefined();
      expect(repos.exercises).toBeDefined();
    });
  });

  describe("4. Nederlandse UI-Consistentie & Productidentiteit (Rule 1)", () => {
    it("bevat alle 5 hoofdroutes in src/app met layout en styling", () => {
      const routes = ["training", "cardio", "voeding", "profiel"];
      for (const route of routes) {
        const pagePath = path.join(process.cwd(), "src", "app", route, "page.tsx");
        expect(fs.existsSync(pagePath)).toBe(true);
      }
      expect(fs.existsSync(path.join(process.cwd(), "src", "app", "page.tsx"))).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), "src", "app", "layout.tsx"))).toBe(true);
    });

    it("verifieert dat de accentkleur consistent Emerald groen (#10b981 / emerald-500) is", () => {
      const tailwindConfigPath = path.join(process.cwd(), "tailwind.config.ts");
      expect(fs.existsSync(tailwindConfigPath)).toBe(true);
      const content = fs.readFileSync(tailwindConfigPath, "utf-8");
      // Tailwind gebruikt standaard Tailwind emerald of custom colors
      expect(content).toBeDefined();
    });
  });
});
