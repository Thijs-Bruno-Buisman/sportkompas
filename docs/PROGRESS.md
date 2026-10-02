# docs/PROGRESS.md — Voortgang & Stappenplan SportKompas

Dit document bewaakt de actuele status van alle 50 ontwikkelstappen van SportKompas. Na iedere stap wordt dit bestand bijgewerkt met de uitgevoerde acties, controles, eventuele beperkingen en de volgende stap.

---

## Statussen en Betekenis
- `[x] KLAAR`: Volledig geïmplementeerd, geverifieerd met tests/checks, en gedocumenteerd.
- `[-] GEDEELTELIJK`: Gedeeltelijk gerealiseerd; vereist nog werk binnen dezelfde stap (*gedeeltelijk is geen klaar*).
- `[!] GEBLOKKEERD`: Werk kan niet doorgaan door een ontbrekende afhankelijkheid of externe fout.
- `[ ] OPEN`: Nog niet gestart.

---

## Totaaloverzicht Roadmap (50 Stappen)

| Stap | Titel | Status | Notities / Resultaat |
|---|---|---|---|
| **00** | **Instructie- en Documentatiebestanden** | `[x] KLAAR` | AGENTS.md, PRODUCT.md, ARCHITECTURE.md, PROGRESS.md opgesteld. Git geïnitialiseerd. |
| **01** | **Project Setup (Next.js, TypeScript, Tailwind, Lucide, Vitest)** | `[x] KLAAR` | App Router, 5 routes, scripts, Vitest testbasis, build en server getest. |
| **02** | Design System, Theming & Hoofdnavigatie Shell | `[ ] OPEN` | Dark/Light mode, groen accent, mobile-first navigatie (5 tabs). |
| **03** | Lokale Opslag & Dexie Database Core | `[ ] OPEN` | IndexedDB opzet, singleton, useLiveQuery wrapper, schema v1. |
| **04** | Validatie & Domain Core Framework | `[ ] OPEN` | Zod schema's, types, veilige ID generator, testsuite setup. |
| **05** | Demomodus & Realistische Voorbeelddata | `[ ] OPEN` | Veilige demomodus schakelaar in profiel zonder echte data te raken. |
| **06** | Profiel: Gebruikersprofiel Beheer | `[ ] OPEN` | Persoonlijke gegevens, leeftijd, lengte, geslacht, activiteitsniveau. |
| **07** | Profiel: Lichaamsmetingen & Gewichtstracking | `[ ] OPEN` | Gewichtslogboek, omtrekken, tijdstempels en notities. |
| **08** | Profiel: Voortgangsmetingen Visualisatie | `[ ] OPEN` | Recharts gewichtsverloop, trends en doelindicatie. |
| **09** | Profiel: BMR & TDEE Berekeningen | `[ ] OPEN` | Mifflin-St Jeor & Katch-McArdle formules met Vitest tests. |
| **10** | Krachttraining: Oefeningenbibliotheek | `[ ] OPEN` | Spiergroepen, apparatuur, filters, aangepaste oefeningen toevoegen. |
| **11** | Krachttraining: Schema's & Routines Creator | `[ ] OPEN` | Workoutsamensteller, sets/reps/rpe configuratie per routine. |
| **12** | Krachttraining: Actieve Workout Tracker Core | `[ ] OPEN` | Grote touchbediening, sets loggen, gewicht/reps invoer, afvinken. |
| **13** | Krachttraining: Geïntegreerde Rusttimer | `[ ] OPEN` | Grote visuele timer, instelbare rustduur, audio/visuele feedback. |
| **14** | Krachttraining: Vorige Prestaties Inline | `[ ] OPEN` | Direct inzicht in eerdere gewichten en reps tijdens de oefening. |
| **15** | Krachttraining: Trainingshistoriek & Detailweergave | `[ ] OPEN` | Historisch logboek, sessies inzien, bewerken en statusbeheer. |
| **16** | Krachttraining: 1RM & Volume Domeinberekeningen | `[ ] OPEN` | Epley & Brzycki formules, tonnage berekening met unit tests. |
| **17** | Krachttraining: Persoonlijke Records (PR) Tracking | `[ ] OPEN` | Automatische detectie van records op 1RM, volume en gewicht. |
| **18** | Krachttraining: Kracht- en Volumegrafieken | `[ ] OPEN` | Visuele trends per spiergroep en progressie over tijd. |
| **19** | Cardio: Activiteitstypen & Datamodel | `[ ] OPEN` | Hardlopen, fietsen, roeien, wandelen, zwemmen en crosstrainer. |
| **20** | Cardio: Handmatige Sessie Logger | `[ ] OPEN` | Afstand, tijd, hartslag, calorieën, gevoel/RPE en notities. |
| **21** | Cardio: Live Tracker & Stopwatch | `[ ] OPEN` | Live timer met pauze/hervat en tussentijdse statistieken. |
| **22** | Cardio: Domeinberekeningen & Formules | `[ ] OPEN` | Pace (min/km), snelheid (km/u), MET-calorieën en hartslagzones met tests. |
| **23** | Cardio: Historiek & Periode-statistieken | `[ ] OPEN` | Wekelijkse en maandelijkse totalen per activiteitstype. |
| **24** | Cardio: Grafieken & Pace-analyse | `[ ] OPEN` | Tempo- en hartslagverloop over tijd in Recharts. |
| **25** | Voeding: Voedingsmiddelen & Recepten Database | `[ ] OPEN` | Lokale database met kcal, eiwit, koolhydraat, vet, vezels per 100g. |
| **26** | Voeding: Dagelijks Voedingsdagboek | `[ ] OPEN` | Indeling: Ontbijt, Lunch, Diner, Snacks met datumkiezer. |
| **27** | Voeding: Maaltijdlogger & Snelle Invoer | `[ ] OPEN` | Producten selecteren, porties berekenen, favorieten markeren. |
| **28** | Voeding: Calorie & Macro Doelen Dashboard | `[ ] OPEN` | Dynamische berekening resterende macro's vs streefwaarden. |
| **29** | Voeding: Hydratatie & Waterinname Tracker | `[ ] OPEN` | Snelle registratie van waterinname (+250ml, +500ml) en dagdoel. |
| **30** | Voeding: Vezels & Micronutriënten Detail | `[ ] OPEN` | Aanvullende voedingsvezel- en micronutriëntentracking. |
| **31** | Voeding: Voedingsgrafieken & Wekelijkse Balans | `[ ] OPEN` | Visualisatie van macro-verhoudingen en dagtotalen over tijd. |
| **32** | Voeding: Maaltijdplanning & Boodschappenlijst | `[ ] OPEN` | Basis weekplanning en genereren van ingrediëntenlijst. |
| **33** | Home: Centrale Cockpit & Dagsamenvatting | `[ ] OPEN` | Samenvattingswidgets voor geplande training, cardio en voeding. |
| **34** | Home: Gecombineerde Voortgang Hub | `[ ] OPEN` | Correlaties tussen workoutvolume, calorie-inname en lichaamsgewicht. |
| **35** | Home: Consistentie & Activity Streaks | `[ ] OPEN` | Visuele streaks en trainingsfrequentie monitoring. |
| **36** | Algemeen: Universele Zoek- en Filterfunctie | `[ ] OPEN` | Zoeken door alle workouts, cardio-sessies en maaltijden. |
| **37** | Data-soevereiniteit: Volledige JSON Export & Import | `[ ] OPEN` | Eén-klik back-up en herstel met schema-validatie via Zod. |
| **38** | Data-soevereiniteit: CSV Export voor Spreadsheets | `[ ] OPEN` | Exporteren van ruwe logs naar CSV voor externe analyse. |
| **39** | Data-soevereiniteit: Databasemigraties & Integriteitscontrole | `[ ] OPEN` | Automatische integriteitscontrole en migratieverificatie. |
| **40** | PWA: Offline Werking & Installatie | `[ ] OPEN` | Web App Manifest en Service Worker caching voor volledige offline werking. |
| **41** | AI Fundament: Veilige Server API & Rate Limits | `[ ] OPEN` | Server-side endpoints (`/api/ai`), .env beveiliging en rate limits. |
| **42** | AI Assistent: Progressieve Overload Suggesties | `[ ] OPEN` | Slimme gewichtsverhogingssuggesties met verplichte confirm-stap. |
| **43** | AI Assistent: Slimme Voedingsadviezen | `[ ] OPEN` | Aanbevelingen voor maaltijdafstemming op trainingsdagen. |
| **44** | AI Assistent: Wekelijkse Holistische Review | `[ ] OPEN` | Samenvattend herstel-, volume- en voortgangsrapportage. |
| **45** | AI Assistent: Contextuele Q&A Chat | `[ ] OPEN` | Vragen stellen over eigen trainingsdata met context-injectie. |
| **46** | Externe Koppeling: GPX/TCX/FIT Bestand Import | `[ ] OPEN` | Handmatig cardiobestanden importeren vanaf sporthorloges. |
| **47** | Externe Koppeling: Optionele Strava Koppeling | `[ ] OPEN` | Veilige OAuth koppeling met duidelijke 'Nog niet verbonden' fallback. |
| **48** | Externe Koppeling: Optionele Open Food Facts Lookup | `[ ] OPEN` | Voedingsmiddelen lookup via Open Food Facts met offline cache. |
| **49** | Kwaliteitsborging: Playwright E2E Testsuite | `[ ] OPEN` | E2E tests van kernflows: workout loggen, voeding invoeren, export. |
| **50** | Afronding: Performance Audit & Release Review | `[ ] OPEN` | Lighthouse audits, bundlegrootte, finaal verificatierapport. |

---

## Logboek Uitgevoerde Stappen

### Stap 00: Instructie- en Documentatiebestanden
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - Git repository geïnitialiseerd (`git init`).
  - `.gitignore` aangemaakt met uitsluiting van node_modules, build artifacts, geheimen en lokale omgevingsvariabelen.
  - `AGENTS.md` aangemaakt met alle vaste ontwikkelregels, productdoelen, stackbesluiten en gedragsconventies.
  - `docs/PRODUCT.md` aangemaakt met de productvisie, module-indeling, navigatie en ergonomische ontwerpregels.
  - `docs/ARCHITECTURE.md` aangemaakt met de technische architectuur, hydration-veiligheid, Dexie-schema's en datagrenzen.
  - `docs/PROGRESS.md` aangemaakt met de complete 50-stappen roadmap en actuele status.
- **Uitgevoerde Controles:**
  - Bestandsinspectie: alle vier documentatiebestanden en `.gitignore` succesvol aangemaakt en geverifieerd.
  - Conformiteitscontrole: Geen app-code aangemaakt vóór prompt 01 conform de opdracht. Geen gefingeerde testclaims opgenomen.
- **Beperkingen & Afhankelijkheden:**
  - Applicatiecode wordt conform opdracht gestart in Prompt 01.
- **Volgende Stap:**
  - Prompt 01: Project Setup met Next.js App Router, React, TypeScript, Tailwind CSS, Lucide en Vitest.

### Stap 01: Project dat werkelijk start (Setup, Routing & Tests)
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - `package.json` ingericht met Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide React, Vitest, Zod en Dexie.
  - Scriptaanroepen geoptimaliseerd met directe Node-uitvoering om pad-parsing problemen in Windows te vermijden.
  - `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.ts`, `vitest.config.ts` en `.eslintrc.json` geconfigureerd.
  - De vijf afgesproken routes aangemaakt: Home (`/`), Training (`/training`), Cardio (`/cardio`), Voeding (`/voeding`), Profiel (`/profiel`).
  - Responsieve navigatie geïmplementeerd: mobiele vaste balk (onderaan) en desktop header met actieve route-markering in emerald groen.
  - Vitest testbasis opgezet met domeinberekeningen (`src/domain/health.ts` & `src/domain/health.test.ts`).
  - `README.md` opgesteld met instructies voor installatie, starten, bouwen en testen.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 fouten of waarschuwingen (alle unescaped entities gecorrigeerd).
  - Vitest unit tests (`npm run test`): 5 van de 5 tests geslaagd.
  - Productiebuild (`npm run build`): Succesvol afgerond, alle 8 pagina's correct gegenereerd.
  - Lokale server HTTP controle: Server gestart op poort 3000; geautomatiseerde GET-requests naar `/`, `/training`, `/cardio`, `/voeding` en `/profiel` geretourneerd met HTTP status 200 OK.
- **Beperkingen & Notities:**
  - Geautomatiseerde interactieve browsertools (browser rendering inspectie) zijn momenteel niet beschikbaar in de shell agent tools. Handmatige controle: `npm run dev` starten, ga naar `http://localhost:3000`, inspecteer met DevTools console (F12) op runtimefouten en wissel tussen de 5 tabbladen.
- **Volgende Stap:**
  - Prompt 02: Stap 02 — Design System, Theming (Dark/Light mode) & Hoofdnavigatie Shell verdiepen.
