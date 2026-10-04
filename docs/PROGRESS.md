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
| **02** | **Design System, Theming & Hoofdnavigatie Shell** | `[x] KLAAR` | Herbruikbare UI suite, dark/light theme persistence, bottom nav + desktop zijbalk. |
| **03** | **Lokale Opslag & Dexie Database Core** | `[x] KLAAR` | Versioned Dexie v1/v2, canonieke eenheden, snapshotting, provenance & 13 tests. |
| **04** | **Profiel en eerste gebruik (Onboarding & Eenheden)** | `[x] KLAAR` | 3-staps onboarding, profielbeheer, weergave-eenheden (kg/lb, km/mi) & invoervalidatie. |
| **06** | **Krachttraining: Oefeningenbibliotheek** | `[x] KLAAR` | 42 standaard oefeningen, 5 meettypes, synoniemen, filters, custom oefeningen & archivering. |
| **07** | Profiel: Lichaamsmetingen & Gewichtstracking | `[ ] OPEN` | Gewichtslogboek, omtrekken, tijdstempels en notities. |
| **08** | Profiel: Voortgangsmetingen Visualisatie | `[ ] OPEN` | Recharts gewichtsverloop, trends en doelindicatie. |
| **09** | Profiel: BMR & TDEE Berekeningen | `[ ] OPEN` | Mifflin-St Jeor & Katch-McArdle formules met Vitest tests. |
| **10** | Krachttraining: Oefeningenbibliotheek | `[ ] OPEN` | Spiergroepen, apparatuur, filters, aangepaste oefeningen toevoegen. |
| **11 / P07** | **Krachttraining: Schema's & Routines Creator (Mijn Schema's)** | `[x] KLAAR` | Schema's maken, bewerken, dupliceren, archiveren, templates, versiebeheer en validatie. |
| **12 / P08** | **Actief Programma & Weekplanning (Prompt 08)** | `[x] KLAAR` | Actief schema selecteren, interactieve weekplanning, verschuiven, overslaan, datumverwerking en Home widget. |
| **13 / P09** | **Krachttraining: Training Starten & Hervatten (Prompt 09)** | `[x] KLAAR` | Snapshotting, single-active workout regel, persistente sessiestatus, hervatflow & cancel/discard opties. |
| **14 / P10** | **Krachttraining: Sets Registreren (Prompt 10)** | `[x] KLAAR` | Snelle setregistratie, decimalen (komma/punt), vorige set kopiëren, assisted oefeningen. |
| **15 / P11** | **Rusttimer & Trainingsnotities (Prompt 11)** | `[x] KLAAR` | Timestamp-gebaseerde timer met achtergrondresistentie, audio/tril fallback, gescheiden techniek- en sessienotities. |
| **16 / P12** | **Training Afronden & Corrigeren (Prompt 12)** | `[x] KLAAR` | Afrondscherm met overzicht en volume, incomplete sets afhandeling (discard/voltooid), bewerken en veilig verwijderen. |
| **P13** | **Geschiedenis en Oefenprogressie (Prompt 13)** | `[x] KLAAR` | Trainingsgeschiedenis met datumfilters (7d/30d/90d/1y/custom), zoekbalk, statistiekenribbon, oefenprogressiegrafieken (gewicht, reps, volume, RPE), lb/kg presentatie en tabelweergave. |
| **17 / P14** | **Krachttraining: Persoonlijke Records (PR) Tracking (Prompt 14)** | `[x] KLAAR` | Automatische PR-detectie in 5 categorieën, 1-10 reps 1RM wetenschappelijke grens, formuletransparantie, tie-bescherming, omgekeerde progressie bij assisted machines, dynamisch herberekenen bij sessieverwijdering, Home recente PRs widget & favoriete oefeningen cockpit voortgangsgrafiek. |
| **P15** | **Progressieve Overload & Dubbele Progressie (Prompt 15)** | `[x] KLAAR` | Uitlegbare dubbele progressie (reps uitbouwen naar max, daarna instelbare gewichtsstap en reset naar min), apparatuurspecifieke stappen (barbell 2.5kg, dumbbell 2kg, machine/kabel 2.5kg, kettlebell 4kg), omgekeerde progressie bij assisted machines, doel-RPE/RIR overloadbescherming (consolideren bij te hoge inspanning), disclaimer en 1-klik toepassing in actieve training. |
| **18 / P16** | **Spiergroepen, Weekvolume & Consistentie (Prompt 16)** | `[x] KLAAR` | Weekoverzicht werksets per spiergroep (gescheiden primaire 1.0x en secundaire 0.5x telling), interactieve anatomische SVG lichaamsvisualisatie (voor- en achterzijde), instelbaar weekdoel, respectvolle rustdagen (herstel, nooit falen), streaks en maand-/jaargrensbewaking. |
| **19-20 / P17** | **Cardio: Activiteitstypen, Datamodel & Handmatige Logger (Prompt 17)** | `[x] KLAAR` | Ondersteuning voor 7 sporten (hardlopen, fietsen, roeien, wandelen, zwemmen, crosstrainer, overig), canonieke eenheden (m, s), sportspecifieke splits (500m split, 100m zwemtempo, min/km, km/u), MET-calorieën o.b.v. snelheid en gewicht, Gellish HR-zones (Z1-Z5), live berekeningspreview in modal, filterbalk, bewerk/verwijder flows en statistiekentab. |
| **21-22 / P18** | **Cardio: Live Tracker, Stopwatch & Berekeningen (Prompt 18)** | `[x] KLAAR` | Timestamp-gebaseerde live stopwatch zonder tab-drift, achtergrondresistentie via localStorage, live pauzeer/hervat, ronde/split tracking met tussentijden, live tempo- en calorie-indicatoren, actieve cardio banner, finish- & discard dialogen, sportspecifieke afstands-incrementen en 9 tests. |
| **23-24 / P19** | **Cardio: Historiek, Periode-statistieken & Grafieken (Prompt 19)** | `[x] KLAAR` | Periodefiltering (7d/30d/90d/1j/alles), bucket aggregatie (dag/week/maand), interactieve pure SVG bar chart (volume), SVG line chart (tempo & snelheid verloop met atletische omkering voor hardlopen) en hartslagzone distributie (Z1-Z5). |
| **25 / P20** | **Voeding: Voedingsmiddelen & Recepten Database (Prompt 20)** | `[x] KLAAR` | Lokale Dexie bibliotheek met standaard 40+ Nederlandse basisproducten (NEVO/USDA) en receptenbeheer. Kcal, eiwit, koolhydraten, vetten en vezels per 100g, Atwater-energieverdeling, portiecalculaties en live receptensamenvatting. |
| **26** | Voeding: Dagelijks Voedingsdagboek | `[ ] OPEN` | Indeling: Ontbijt, Lunch, Diner, Snacks met datumkiezer. |
| **27** | Voeding: Maaltijdlogger & Snelle Invoer | `[ ] OPEN` | Producten selecteren, porties berekenen, favorieten markeren. |
| **28** | Voeding: Calorie & Macro Doelen Dashboard | `[ ] OPEN` | Dynamische berekening resterende macro's vs streefwaarden. |
| **29 / P24** | **Voeding: Maaltijdplanner & Weekplanning (Prompt 24)** | `[x] KLAAR` | 7-daagse weekplanner met maaltijdmomenten (ontbijt, lunch, diner, snacks), Dexie v6 `plannedMeals` store, recept- en productkoppeling met portieschaling, geaggregeerde boodschappen- en meal prep checklist met klembord-kopieerfunctie, automatische overzetting naar voedingsdagboek bij 'markeer als genuttigd', dag-kopieerfunctie en 314 tests. |
| **30 / P25** | **Voeding: Streepjescodescanner & Externe Zoekfunctie (Prompt 25)** | `[x] KLAAR` | Barcodescanner via camera met BarcodeDetector en handmatige invoer-fallback, Open Food Facts integratie met offline caching in Dexie v7 `barcode` index, universeel zoeken en 331 tests. |
| **31 / P26** | **Voeding: Voedingsgrafieken & Wekelijkse Balans (Prompt 26)** | `[x] KLAAR` | Pure SVG calorieën staafdiagram met streefdoellijn en cardio-verbranding overlay, macronutriënten energieverdeling (eiwit/koolhydraten/vetten), daggemiddelden, wekelijkse balans & geschat gewichtseffect, vezel- & hydratatietrends en 350 tests. |
| **32** | Voeding: Maaltijdplanning & Boodschappenlijst | `[x] KLAAR` | Geïntegreerd in stap 29 (weekplanner, prep-checklist, klembord-export en statusbeheer). |
| **33 / P27** | **Home: Centrale Cockpit & Dagsamenvatting (Prompt 27)** | `[x] KLAAR` | Geïntegreerde cockpit met datumwisselaar, holistische energie- en caloriebalans (inname vs verbranding), 1-klik snelle acties (water toevoegen, gewicht noteren via modal), 4-pijlers grid (kracht, cardio, voeding, hydratatie) en 364 tests. |
| **34 / P28** | **Home: Gecombineerde Voortgang Hub (Prompt 28)** | `[x] KLAAR` | Correlaties tussen workoutvolume, cardio, calorie-inname en gewichtsverloop met interactieve SVG-trendgrafieken en Wishnofsky-balans. |
| **35 / P29** | **Home: Consistentie & Activity Streaks (Prompt 29)** | `[x] KLAAR` | Multi-pijler kalender-heatmap (8w/12w) met intensiteitsgradaties, streakbehoud en rustdagwaardering. |
| **36 / P30** | **Algemeen: Universele Zoek- en Filterfunctie (Prompt 30)** | `[x] KLAAR` | Client-side multi-token zoekdialoog (`Ctrl+K`) door alle 4 pijlers met categoriefilters en relevantiescoring. |
| **37 / P31** | **Data-soevereiniteit: Volledige JSON Export & Import (Prompt 31)** | `[x] KLAAR` | Eén-klik JSON export van alle 16 IndexedDB tabellen, Zod-schemavalidatie, preview-dialoog met recordoverzicht, en veilige import in vervang- of samenvoegmodus. |
| **38 / P32** | **Data-soevereiniteit: Spreadsheet CSV Export (Prompt 32)** | `[x] KLAAR` | Exporteren van krachttraining (sets, reps, volume, 1RM), cardio (km, min, tempo, kcal), voeding (dagboekitems & macro's) en metingen naar UTF-8/BOM CSV bestanden (Excel NL ';' of RFC 4180 ',') en 407 tests. |
| **39 / P33** | **Data-soevereiniteit: Databasemigraties & Integriteitscontrole (Prompt 33)** | `[x] KLAAR` | Diepgaande validatie van alle 16 Dexie tabellen, referentiële integriteit, wees-record herstel, v1->v7 migratieverificatie en 412 tests. |
| **40 / P34** | **PWA: Offline Werking & Installatie (Prompt 34)** | `[x] KLAAR` | Web App Manifest route, Service Worker offline caching (stale-while-revalidate), standalone detectie, PwaInstallSection, offline statusbalk en 424 tests. |
| **41 / P35** | **AI Fundament: Veilige Server API & Rate Limits (Prompt 35)** | `[x] KLAAR` | Server-side `/api/ai` endpoints, rate limiting, strikte .env isolatie zonder `NEXT_PUBLIC_`, Zod validatie, lokale heuristiek fallback en 435 tests. |
| **42** | AI Assistent: Progressieve Overload Suggesties | `[x] KLAAR` | Slimme gewichtsverhogingssuggesties met verplichte confirm-stap. |
| **43** | AI Assistent: Slimme Voedingsadviezen | `[x] KLAAR` | Aanbevelingen voor maaltijdafstemming op trainingsdagen. |
| **44** | AI Assistent: Wekelijkse Holistische Review | `[x] KLAAR` | Samenvattend herstel-, volume- en voortgangsrapportage. |
| **45** | AI Assistent: Contextuele Q&A Chat | `[x] KLAAR` | Vragen stellen over eigen trainingsdata met context-injectie. |
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

### Stap 02: Ontwerp en navigatie (App-Shell, Theming & UI-Componenten)
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - App-shell geïmplementeerd (`AppShell.tsx`): responsieve vaste mobiele bottom navigation met grote touch targets (min. 48px) en een desktop zijbalk met logo, route-indicatie (emerald pills), thema-kiezer en offline statusbadge.
  - Complete herbruikbare UI-componentenset ontwikkeld in `src/components/ui/`:
    - `Button.tsx`: Primaire (emerald), secundaire, outline, ghost en gevaar varianten; touch-targets >= 44px; zichtbare focus-ringen (`focus-visible:ring-emerald-500`).
    - `Card.tsx`: Modulaire kaarten (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
    - `FormField.tsx`, `Input.tsx`, `Textarea.tsx`, `Select.tsx`, `Label.tsx`: Toegankelijke invoervelden met foutstatus, helperteksten, `inputMode` voor mobiele toetsenborden en touch-hoogte >= 44px.
    - `Dialog.tsx`: Toegankelijke modale vensters met Escape-toets afhandeling, backdrop-blur, veilige overflow en sluitknoppen (44px).
    - `Tabs.tsx`: Tab-systeem (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) voor sub-navigatie binnen modules.
    - `EmptyState.tsx`: Reusbare lege toestanden met iconen, duidelijke instructietekst en actieknoppen die direct naar de juiste invoer leiden (geen fictieve dashboards).
    - `Alert.tsx`: Status- en foutmeldingen (`info`, `success`, `warning`, `error`).
    - `Badge.tsx`: Labels en statusindicatoren.
    - `ThemeToggle.tsx` & `ThemeProvider.tsx`: Thema-ondersteuning (donker, licht, systeem) met persistente opslag in `localStorage` en hydration-veilige mount-guards.
  - Alle vijf routes (`/`, `/training`, `/cardio`, `/voeding`, `/profiel`) geüpgraded naar de nieuwe consistente designtaal met eerlijke lege toestanden en actieknoppen.
  - Safe-area insets (`pb-safe`, `mb-safe`) en zero horizontale overflow op 360px schermen gegarandeerd (`break-words`, `min-w-0`, `overflow-x-hidden`).
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 fouten of waarschuwingen.
  - Vitest unit tests (`npm run test`): 5/5 tests geslaagd.
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 routes statisch gegenereerd.
  - Lokale server HTTP validatie: Alle 5 routes (`/`, `/training`, `/cardio`, `/voeding`, `/profiel`) geverifieerd met HTTP status 200 OK.
- **Beperkingen & Notities:**
  - Browsertools voor geautomatiseerde visuele screenshots/DOM-tests ontbreken in de huidige CLI runtime.
  - Handmatige controle: Start `npm run dev`, open `http://localhost:3000` op desktop én via responsive simulator (bv. 360px breedte in DevTools), test de Dark/Light thema toggle, open modals in Training/Cardio/Voeding en wissel tussen tabs.
- **Volgende Stap:**
  - Prompt 03: Stap 03 — Lokale Opslag & Dexie Database Core (IndexedDB schema v1, Singleton instance, useLiveQuery wrappers en migratiebasis).

### Stap 03: Datamodel en opslag (IndexedDB, Dexie, Repositories & Migraties)
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - Volledig canoniek datamodel gedefinieerd in [src/types/database.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/types/database.ts):
    - Entiteiten: `Profile`, `Exercise`, `WorkoutRoutine`, `RoutineDay`, `ScheduledSession`, `WorkoutSession`, `WorkoutSet`, `CardioSession`, `Goal`, `FoodItem`, `MealLog`, `WaterLog`, `BodyMeasurement`, `RecoveryLog`, `AppSettings`.
    - Canonieke eenheden toegepast: `kg` voor gewicht, `meters` voor afstand en lichaamsafmetingen, `seconden` voor tijden/rust, `grammen`/`kcal` voor voeding.
    - Datums gestructureerd: lokale kalenderdagen als `YYYY-MM-DD` en tijdstippen als UTC ISO-8601 strings.
    - `Provenance` object op alle relevante entiteiten ter voorbereiding op AI-voorstellen en externe imports (met `source`, `confidence`, `proposedAt`, `acceptedAt`).
    - Workout snapshotting: een gestarte `WorkoutSession` slaat een onveranderlijke momentopname van de routine en oefeningen op (`snapshot`), zodat latere schemawijzigingen voltooide trainingen nooit retroactief veranderen.
  - Runtime validatieschema's gebouwd met Zod in [src/lib/db/schema.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/schema.ts).
  - Versioned Dexie database geïmplementeerd in [src/lib/db/dexie.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/dexie.ts) met versie 1 en versie 2 (inclusief defensieve migratie-upgrade logica zonder dataverlies).
  - Volledige repositorylaag geïmplementeerd in [src/lib/db/repositories/](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/repositories/): `BaseRepository`, `ProfileRepository`, `ExerciseRepository`, `WorkoutRepository`, `CardioRepository`, `NutritionRepository`, `MeasurementRepository`, `RecoveryRepository`, `SettingsRepository`.
  - Opslagfouten en capaciteitsbewaking geïmplementeerd in [src/lib/db/errors.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/errors.ts) en [src/lib/db/capacity.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/capacity.ts) (waarschuwing bij > 80% browser quota verbruik).
  - Geen persoonsgegevens in `localStorage`: alle sport-, voedings- en lichaamsdata bevindt zich strikt in IndexedDB; alleen niet-gevoelige UI-voorkeuren (`sportkompas_theme`) in `localStorage`.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 fouten of waarschuwingen.
  - Vitest testsuite ([tests/database.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/database.test.ts)): 13 van de 13 tests geslaagd, waaronder:
    - Verificatie van typed CRUD en canonieke eenheden.
    - Persistentietest na herladen (databaseverbinding sluiten en opnieuw openen).
    - Workout snapshot onveranderlijkheidstest (schema naderhand aanpassen tast voltooide workout niet aan).
    - Databasemigratietest (v1 -> v2 upgrade zonder dataverlies en met automatische provenance-verrijking).
    - Zod schema validatiefouten afhandeling.
    - Opslagcapaciteitscontrole fallback.
  - Productiebuild (`npm run build`): Succesvol gecompileerd.
- **Beperkingen & Notities:**
  - Browser storage estimation (`navigator.storage.estimate`) werkt lokaal in browsers met quota-ondersteuning; een veilige fallback is ingebouwd voor unsupported contexts.
- **Volgende Stap:**
  - Prompt 04: Stap 04 — Validatie & Domain Core Framework (Domain utilities, pure berekeningen en verdere testsuite verrijking).

### Stap 04: Profiel en eerste gebruik (Onboarding, Eenheden & Invoervalidatie)
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - 3-staps onboarding wizard gebouwd in [src/components/modules/onboarding/OnboardingModal.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/modules/onboarding/OnboardingModal.tsx):
    - **Stap 1: Doel & Ervaring:** Naam (optioneel), primair doel (kracht, spieropbouw, conditie, afvallen, fit blijven, onbekend), ervaring (beginner, gemiddeld, gevorderd, onbekend).
    - **Stap 2: Ritme & Apparatuur:** Dagen krachttraining en cardio per week (0..7), interactieve uitrustingsselectie (halters, dumbbells, kabels, apparaten, lichaamsgewicht, elastiek, cardio-apparatuur).
    - **Stap 3: Eenheden & Lichaamsmetingen:** Eenhedenvoorkeur (Metrisch kg/km vs Imperiaal lbs/mi), optionele lengte, optioneel lichaamsgewicht (met komma/punt ondersteuning), optionele geboortedatum, geslacht en energieformulevoorkeur (Mifflin-St Jeor, Katch-McArdle, onbekend).
    - Duidelijke toelichting opgenomen bij elk veld waarom gegevens worden gevraagd en dat alles optioneel is.
  - Onboarding guard geïmplementeerd via [src/lib/hooks/useProfile.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/hooks/useProfile.ts) in [src/components/layout/AppShell.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/layout/AppShell.tsx): de wizard toont uitsluitend als het profiel of de basisinstellingen ontbreken; na afronding start direct de volledige applicatie.
  - Profielpagina ([src/app/profiel/page.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/app/profiel/page.tsx)) geüpgraded met realtime bewerkingsmogelijkheden voor alle onboardingparameters, directe IndexedDB-persistentie en een interactieve eenhedenschakelaar.
  - Eenhedendomein en invoerparsers gebouwd in [src/domain/units.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/domain/units.ts):
    - Parsing met normalisatie van zowel komma's als punten (`"82,5"` en `"82.5"`).
    - Weigering van negatieve getallen met duidelijke foutmeldingen.
    - Strikte datumvalidatie (geen onmogelijke kalenderdagen zoals 30 februari, geen datums in de toekomst, geen jaren vóór 1900).
    - Weergavewijziging naar lbs of miles verandert de canonieke opgeslagen waarden (kg en meters) in de database niet.
  - App functioneert 100% zonder calorieadvies en zonder lichaamsmetingen (lege profielwaarden toegestaan).
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 fouten of waarschuwingen.
  - Vitest testsuite ([tests/onboarding.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/onboarding.test.ts) & [src/domain/units.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/domain/units.test.ts)): 34 van de 34 tests geslaagd.
    - Test op minimale onboarding zonder lichaamsmetingen.
    - Test op volledige onboarding en persistente opslag.
    - Test op herladen (database close & reopen behoudt profiel en `onboardingCompleted`).
    - Test op profielaanpassingen.
    - Test op canoniek behoud van waarden bij wisselen tussen kg en lbs.
    - Test op komma-invoer en datumvalidatie.
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 routes statisch gegenereerd.
  - Lokale server HTTP validatie: Alle 5 routes geretourneerd met HTTP status 200 OK.
- **Beperkingen & Notities:**
  - De onboarding wizard is gekoppeld aan de browser-IndexedDB en verdwijnt na de eerste succesvolle opslag; op het Profielscherm kunnen alle parameters te allen tijde worden herzien.
- **Volgende Stap:**
  - Prompt 05: Stap 05 — Demomodus en lege toestanden (Afgerond).

### Stap 05: Demomodus en lege toestanden
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Fysiek & Opslag Gescheiden Database:**
    - Volledige scheiding geïmplementeerd tussen de echte gebruikersdatabase (`SportKompasDB`) en de demodatabase (`SportKompasDemoDB`) via `getDatabase(isDemo)` en `getRepositories(isDemo)` in [src/lib/db/dexie.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/dexie.ts) en [src/lib/db/index.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/index.ts).
    - React `DatabaseProvider` en `useDatabase()` hook gebouwd in [src/lib/db/DatabaseContext.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/DatabaseContext.tsx) met mount-guard ter voorkoming van SSR/hydration mismatches.
  - **Zichtbare Persistente Demo-indicatie:**
    - Sticky amber meldingsbalk bovenaan de applicatie in `AppShell` met contextweergave (`SportKompasDemoDB`), knop "Reset Demo" en knop "Sluit Demo".
    - Geanimeerde amber badge en databaselabel in de desktop zijbalk.
    - Prominente "DEMO" pill-badge in de mobiele top-balk.
    - Demomodus & Testomgeving Beheerkaart op de Profielpagina (`/profiel`) met statusbadges, resetmogelijkheid en duidelijke privacy- en data-integriteitstoelichting.
  - **Realistische, Reproduceerbare & Intern Consistente Demodata:**
    - Generator gebouwd in [src/lib/db/demo/demoData.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/demo/demoData.ts) en seeder in [src/lib/db/demo/seedDemo.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/demo/seedDemo.ts).
    - Profiel: Alex (gevorderd, 184 cm, 82.5 kg startgewicht naar 81.0 kg streefgewicht, 4x kracht, 2x cardio).
    - 12 Functionele oefeningen met apparatuur, spiergroepen en instructies.
    - 4-daags split trainingsprogramma ("Upper / Lower Kracht & Massa").
    - 13 Historische workoutsessies met progressieve overbelasting over 4 weken (Bankdrukken stijgt naar 87.5 kg x 6 reps met berekende 1RM van 105 kg; Back Squat stijgt naar 110 kg; Deadlift stijgt naar 135 kg).
    - 6 Voltooide cardiosessies (72.5 km totaal: 5k, 7.5k, 10k hardlopen, 20k & 25k wielrennen, 5k roeien) met afstanden, tempo's, hartslagen en calorieën.
    - Voedingslogboek: Vandaag 2050 kcal, 158g eiwit, 194g koolhydraten, 64g vet en 2250 ml water.
    - 5 Wekelijkse lichaamsmetingen met dalende trend en vetpercentage.
    - 5 Herstellogs met slaapduur, kwaliteit en spierpijnscores.
    - Alle demorecords expliciet gemarkeerd met `provenance: { source: 'demo', isDemo: true }`.
  - **Volledige Isolatie & Demo-reset:**
    - `resetDemoDatabase()` wist uitsluitend tabellen van `SportKompasDemoDB` en herbevolkt deze met de schone beginset. Echte records in `SportKompasDB` worden 0% geraakt.
  - **Eerlijke Lege App & Geen Fictieve Overerving:**
    - Alle vijf schermen (`/`, `/training`, `/cardio`, `/voeding`, `/profiel`) dynamisch gekoppeld aan de actieve database.
    - In echte modus krijgt een nieuwe gebruiker uitsluitend zijn eigen data te zien; de app toont overal 0 totalen en duidelijke acties ("Maak je eerste schema", "Start Krachttraining", "Sessie Toevoegen", "Voeding Invoeren").
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 fouten of waarschuwingen.
  - Vitest testsuite ([tests/demomode.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/demomode.test.ts)): 40 van de 40 tests geslaagd in 5 testsuites.
    - Test op fysieke scheiding tussen echte DB en demodatabase.
    - Test op reproduceerbare en intern consistente demodata.
    - Test op dynamische 1RM- en kilometertotalen berekend uit logs (105 kg bench 1RM, 72.5 km cardio).
    - Test op garanderen dat nieuwe gebruikers in echte modus geen data of records erven uit de demo.
    - Test op behoud van echte gegevens bij wisselen tussen demomodus en echte modus.
    - Test op demo-reset: herstelt alleen de demodatabase; echte records van gebruikers blijven 100% onaangetast.
  - Productiebuild (`npm run build`): Succesvol gecompileerd in 7.8s, alle 8 routes statisch gegenereerd.
- **Beperkingen & Notities:**
  - Demomodus is uitsluitend bedoeld als vrijblijvende preview/verkenning en raakt op geen enkel moment de actieve `SportKompasDB`.
- **Volgende Stap:**
  - Prompt 06: Stap 06 — Krachttraining: Oefeningenbibliotheek (Afgerond).

### Stap 06: Krachttraining: Oefeningenbibliotheek
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Oefeningencatalogus & Datamodel:**
    - Catalogus van 42 standaard oefeningen gedefinieerd in [src/domain/strength/defaultExercises.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/domain/strength/defaultExercises.ts) met Nederlandse namen, meertalige alternatieve namen/synoniemen, primaire en secundaire spiergroepen, apparatuur, meettypes en techniekbeschrijvingen.
    - Ondersteuning voor alle 5 vereiste meetmethodes (`gewicht_herhalingen`, `lichaamsgewicht`, `extra_gewicht`, `assisted`, `tijd`).
    - Dexie schema gemigreerd naar Versie 3 in [src/lib/db/dexie.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/dexie.ts) met non-destructieve upgrade-functie voor `isArchived`, `measurementType` en `alternativeNames`.
    - Zod schema's uitgebreid in [src/lib/db/schema.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/schema.ts) met `MuscleGroupSchema`, `EquipmentEnumSchema`, `ExerciseMeasurementTypeSchema` en `ExerciseSchema`.
  - **Repositorylaag Uitbreiding:**
    - [src/lib/db/repositories/exercise.repository.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/repositories/exercise.repository.ts) uitgerust met:
      - `ensureDefaultExercises`: automatische veilige vulling bij eerste initialisatie zonder duplicaten.
      - `getAll(includeArchived)`: standaard uitsluiting van gearchiveerde oefeningen in actieve weergaven.
      - `searchAndFilter`: meertalig zoeken (naam, synoniemen, spiergroep, materiaal), multi-filters en archieffilter.
      - `archiveExercise` & `unarchiveExercise`: statusbeheer met behoud van referentiële integriteit.
      - `save`: automatische `updatedAt` tijdstempeling.
  - **UI Modules & Schermen:**
    - [src/components/modules/exercises/ExerciseCard.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/modules/exercises/ExerciseCard.tsx): interactieve kaart met spiergroep-, materiaal-, meettype- en statusbadges met min. 48px touch targets.
    - [src/components/modules/exercises/ExerciseDetailDialog.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/modules/exercises/ExerciseDetailDialog.tsx): modale detailweergave met techniekinstructies, meetmethode-uitleg, externe geverifieerde videolink (`rel="noopener noreferrer"`) en acties voor bewerken en archiveren/dearchiveren.
    - [src/components/modules/exercises/ExerciseFormDialog.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/modules/exercises/ExerciseFormDialog.tsx): formulier voor het aanmaken en bewerken van eigen aangepaste oefeningen met volledige validatie.
    - [src/components/modules/exercises/ExerciseLibrary.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/modules/exercises/ExerciseLibrary.tsx): centrale component met realtime zoeken, 3 filterdropdowns, archiefschakelaar, resultaatenteller en lege toestand integratie.
    - Geïntegreerd in het Oefeningen-tabblad van de trainingspagina ([src/app/training/page.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/app/training/page.tsx)).
  - **Data-integriteit & Veiligheid:**
    - Gearchiveerde oefeningen worden nooit hard verwijderd (`isArchived: true`), waardoor eerdere trainingslogs, snapshots en routines altijd hun referentie behouden.
    - Geen neppe videospelers of fictieve embedded bronnen; alleen optionele, door de gebruiker ingevoerde of geverifieerde web-URLs.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 waarschuwingen of fouten.
  - Vitest testsuite (`npm test`): 54 van de 54 tests geslaagd over 6 testsuites ([tests/exercises.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/exercises.test.ts), [tests/database.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/database.test.ts), [tests/demomode.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/demomode.test.ts), [tests/onboarding.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/onboarding.test.ts), [src/domain/units.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/domain/units.test.ts), [src/domain/health.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/domain/health.test.ts)).
    - Test op catalogus initialisatie van 42 oefeningen met correcte UUIDs.
    - Test op de 5 meetmethodes.
    - Test op meertalig zoeken (Nederlandse namen en Engelse synoniemen zoals "Bench Press", "Squat", "OHP").
    - Test op meervoudige combinatiefilters.
    - Test op opslaan en persistentie van eigen oefeningen na database reload (sluiten en heropenen).
    - Test op archiveren en dearchiveren met behoud van `getById` integriteit voor eerdere logs.
    - Test op Zod validatie bij ongeldige velden en foute URL-formaten.
  - Productiebuild (`npm run build`): Succesvol gecompileerd in 15.7s, alle 8 routes statisch gegenereerd.
- **Beperkingen & Notities:**
  - Standaard oefeningen kunnen veilig worden gearchiveerd om ze uit de weergave te houden, maar worden niet definitief gewist zodat standaard trainingsvoorbeelden consistent blijven.
- **Volgende Stap:**
  - Prompt 07: Schema's maken (Afgerond).

### Stap 07: Krachttraining: Schema's maken & Routines Creator (Prompt 07)
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Datamodel & Dexie Versie 4 Migratie:**
    - `WorkoutRoutine` uitgebreid met `isArchived?: boolean` in [src/types/database.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/types/database.ts).
    - `PlannedExerciseInDay` verrijkt met `measurementType?: ExerciseMeasurementType`, `targetDurationSeconds?: number`, `targetWeightKg?: number | null`, `effortScale?: "geen" | "rpe" | "rir"`, `targetRpe?: number | null`, `targetRir?: number | null`.
    - `WorkoutExerciseSnapshot` en `WorkoutExerciseSnapshotSchema` flexibel gemaakt voor tijdsduur-oefeningen (optionele repbereiken en optionele `targetDurationSeconds`).
    - Dexie gemigreerd naar Versie 4 in [src/lib/db/dexie.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/dexie.ts) met index op `workoutRoutines: "id, name, version, isActive, isArchived, createdAt"` en automatische upgrade-functie.
  - **Domeinvalidatie & Onveranderlijk Versiebeheer:**
    - [src/domain/strength/routineValidation.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/domain/strength/routineValidation.ts) geïmplementeerd:
      - Validatie op schemanaam en minimaal 1 trainingsdag.
      - Weigert lege trainingsdagen (elke dag vereist minimaal 1 oefening).
      - Repbereik-validatie (`targetRepsMin <= targetRepsMax` en beiden `>= 1`).
      - Duur-validatie voor tijd-gebaseerde oefeningen (`measurementType === "tijd"` vereist `targetDurationSeconds >= 1`).
      - Optionele inspanningsschaal: gebruiker kiest zelf `"geen"`, `"rpe"` (1.0-10.0) of `"rir"` (0-10); nooit verplicht gekoppeld aan kracht of hypertrofie.
      - Doelgewicht (optioneel, niet-negatief) en rusttijd (niet-negatief).
    - [src/lib/db/repositories/workout.repository.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/lib/db/repositories/workout.repository.ts) uitgebreid met:
      - `getRoutines(includeArchived)`: haalt schema's gesorteerd op (actief schema bovenaan, daarna recentste).
      - `getRoutineWithDays(routineId)`: haalt schema op met alle gekoppelde dagen gesorteerd op `dayIndex`.
      - `saveRoutineWithDays(routine, days)`: valideert via domeinregels en verhoogt automatisch het versienummer (`routine.version + 1`) zodra bestaande workoutsessies al naar de huidige versie verwijzen, zodat eerdere workout-snapshots intact en onveranderlijk blijven.
      - `duplicateRoutine(routineId, customName)`: kloont het schema en alle bijbehorende dagen met nieuwe unieke UUIDs en versie 1 (`isActive: false`, `isArchived: false`).
      - `archiveRoutine(routineId)` & `unarchiveRoutine(routineId)`: veilige zachte archivering zonder gegevensverlies.
      - `setActiveRoutine(routineId)`: stelt één schema in als het actieve trainingsprogramma en deactiveert eerdere actieve schema's.
  - **Bewezen Voorbeeldsjablonen (Templates):**
    - [src/domain/strength/routineTemplates.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/domain/strength/routineTemplates.ts) met 3 complete templates:
      1. Full Body Basis (3 Dagen)
      2. Upper / Lower Split (4 Dagen)
      3. Push / Pull / Legs (3 Dagen)
    - `instantiateTemplate()`: converteert een sjabloon in het geheugen naar een bewerkbaar concept. Wordt **nooit** stilzwijgend opgeslagen in de database totdat de gebruiker op Opslaan klikt.
  - **Gebruikersinterface & Ergonomie:**
    - [src/components/modules/routines/ExerciseSelectorDialog.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/modules/routines/ExerciseSelectorDialog.tsx): snelle zoek- en selectiedialoog met spiergroep-filter.
    - [src/components/modules/routines/TemplateSelectorDialog.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/modules/routines/TemplateSelectorDialog.tsx): sjabloonkiezer met dag- en oefeningenoverzicht.
    - [src/components/modules/routines/RoutineEditor.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/modules/routines/RoutineEditor.tsx):
      - Dagen toevoegen, hernoemen en verwijderen.
      - Oefeningen toevoegen via selector.
      - **Herordenen zonder drag-and-drop:** toegankelijke "Omhoog" en "Omlaag" knoppen.
      - **Oefening vervangen:** "Vervangen" knop wisselt de oefening en het meettype om met behoud van de door de gebruiker ingestelde sets, repbereik, gewicht en rusttijd.
      - Dynamische invoervelden op basis van meettype (reps vs tijd in sec), optioneel doelgewicht, selecteerbare rusttijd en keuze voor RPE/RIR.
      - Duidelijke validatiemeldingen bij foute invoer.
    - [src/components/modules/routines/RoutineList.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/components/modules/routines/RoutineList.tsx):
      - Schemakaarten met actieve programma-badge, versienummer, aantal dagen en oefeningen.
      - Knoppen voor Activeren, Bewerken, Kopiëren (dupliceren) en Archiveren/Herstellen.
      - Schakelaar voor het inzien van gearchiveerde schema's.
      - Geïntegreerd in het Schema's-tabblad op de Trainingspagina ([src/app/training/page.tsx](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/app/training/page.tsx)).
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 waarschuwingen of fouten.
  - Vitest testsuite (`npm test`): **68 van de 68 tests geslaagd** over 7 testsuites:
    - [tests/routines.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/routines.test.ts) (14 tests):
      - Test op aanmaken, bewaren en heropenen van een 3-daags schema na database reload.
      - Test op dupliceren met unieke IDs, versie 1 en ongewijzigd bronschema.
      - Test op activatiebeheer (slechts 1 actief schema tegelijk).
      - Test op zachte archivering en dearchivering.
      - Test op domeinvalidatie: lege schema's, lege trainingsdagen, rep min > max, tijdmeting zonder seconden, RPE/RIR grenzen.
      - Test op automatische versie-ophoging wanneer voltooide sessies al naar de huidige versie verwijzen met behoud van eerdere sessie-snapshots.
      - Test op sjabloon-integriteit en het garanderen dat sjablonen nooit stilzwijgend in IndexedDB terechtkomen.
    - [tests/database.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/database.test.ts) (8 tests inclusief v4 Dexie migratie).
    - [tests/exercises.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/exercises.test.ts) (14 tests).
    - [tests/demomode.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/demomode.test.ts) (6 tests).
    - [tests/onboarding.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/tests/onboarding.test.ts) (8 tests).
    - [src/domain/units.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/domain/units.test.ts) (13 tests).
    - [src/domain/health.test.ts](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes%20app/src/domain/health.test.ts) (5 tests).
  - Productiebuild (`npm run build`): Succesvol gecompileerd in 9.1s, alle 8 routes statisch gegenereerd.
- **Beperkingen & Notities:**
  - Sjablonen worden uitsluitend als in-memory concept ingeladen in de editor; pas na expliciet opslaan door de gebruiker worden ze vastgelegd in IndexedDB.
  - Bij aanpassing van een schema waarnaar al historische workoutsessies verwijzen, wordt automatisch een nieuwe schemaversie (`v + 1`) aangemaakt zodat eerdere logs 100% onveranderlijk blijven.
- **Volgende Stap:**
  - Prompt 08: Actief programma, weekplanning, datumverwerking en Home training-widget.

### Stap 08: Actief programma en planning (Weekplanning, Kalender & Home Widget)
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Domein & Datumverwerking (`src/domain/dates/calendar.ts`):**
    - `getLocalDateString()`: Pure lokale datumopbouw (`YYYY-MM-DD`) via `getFullYear()`, `getMonth()`, `getDate()`. Voorkomt de bekende UTC-middernacht bug waarbij tijden rond middernacht in West-Europa (UTC+1/UTC+2) per abuis als gisteren geëvalueerd worden.
    - `parseLocalDate()`: Parset `YYYY-MM-DD` naar een Date op het middaguur (`12:00:00`), wat voorkomt dat zomertijd-/wintertijdoverschrijdingen (±1 uur) over een datumgrens springen.
    - `getWeekStartDate()`: Configureerbare weekstart (`"maandag"` of `"zondag"`).
    - `getWeekDays()`: Genereert 7 kalenderdagen met lokale datum, weekdag-index, dag van de maand, Nederlandse korte en volledige dagnaam, en `isToday` status.
    - `formatFriendlyDate()`: Geeft Nederlandse gebruiksvriendelijke weergave ("Vandaag", "Morgen", "Gisteren" of bv. "Ma 5 okt").
    - `addDaysToDateString()` & `isSameDateString()`: Veilige datum-aritmetiek over maand- en jaargrenzen heen.
  - **Datamodel & Repositories (`src/lib/db/repositories/workout.repository.ts`, `src/types/database.ts`, `src/lib/db/schema.ts`):**
    - `ScheduledSessionStatus`: Formele statusafhandeling (`"gepland" | "afgerond" | "geannuleerd" | "overgeslagen"`).
    - `getActiveRoutine()`: Haalt het geselecteerde actieve schema en de geordende trainingsdagen op.
    - `getScheduledSessionsForDateRange(startDate, endDate)`: Haalt geplande sessies op verrijkt met schemanaam, dagnaam, aantal oefeningen en oefeningenlijst.
    - `getScheduledSessionForDate(calendarDate)`: Geeft de actieve geplande training voor een specifieke dag terug.
    - `scheduleSession()`: Plant een schemadag in op een kalenderdatum; vervangt eventuele eerdere niet-afgeronde sessies op dezelfde dag.
    - `scheduleWeek()`: Snelle weektoewijzing; ondersteunt rustdagen (`routineDayId: null`) en ruimt oude niet-afgeronde sessies op.
    - `moveScheduledSession()`: Verplaatst een geplande sessie interactief naar een andere datum.
    - `skipScheduledSession()` & `unskipScheduledSession()`: Markeert sessies als overgeslagen of herstelt ze zonder dataverlies.
    - `deleteScheduledSession()`: Verwijdert geplande sessie en herstelt de dag als rustdag.
    - `startWorkoutFromScheduledSession()`: Creëert een onveranderlijke `WorkoutSession` snapshot, markeert `ScheduledSession` als afgerond en koppelt `completedSessionId`.
    - `startWorkoutFromDay()`: Start een ad-hoc training direct vanuit een schemadag met bevroren snapshot en logging.
    - `AppSettings`: Configureerbare `weekStartsOn` voorkeur (`"maandag"` | `"zondag"`).
  - **Gebruikersinterface & Planning Modules:**
    - `src/components/modules/planning/MoveSessionDialog.tsx`: Modal om geplande sessies te verplaatsen met datumkiezer en snelle knoppen (+1 dag, +2 dagen, +7 dagen).
    - `src/components/modules/planning/ScheduleDayDialog.tsx`: Modal om een schemadag aan een datum toe te wijzen of in te stellen als rustdag.
    - `src/components/modules/planning/PlanWeekWizardDialog.tsx`: 1-klik wizard om alle trainingsdagen van het actieve programma over de 7 dagen van de week te verdelen, inclusief presets (3 dagen Ma/Wo/Vr, 4 dagen Ma/Di/Do/Vr).
    - `src/components/modules/planning/WeekPlanner.tsx`:
      - Actief programmacard met actieve schemanaam en directe knop naar de wizard.
      - Weeknavigatiebalk met Vorige Week, Vandaag, Volgende Week en wisselknop voor Weekstart (Maandag / Zondag).
      - 7 responsieve dagkaarten: toont datum, statusbadge (`Gepland`, `Voltooid`, `Overgeslagen`), oefeningenoverzicht, grote 48px actieknoppen voor direct Starten (emerald), Verplaatsen, Overslaan/Herstellen en Wijzigen.
      - Rustdagen worden direct en rustig aangeduid (`Rustdag 🧘`) met een knop om ad-hoc toch een training te plannen.
    - `src/components/modules/planning/TodayTrainingCard.tsx`:
      - Geïntegreerd in de Home cockpit (`src/app/page.tsx`).
      - Toont direct de training van vandaag met de exacte geplande dagnaam, schemanaam en aantal oefeningen.
      - Grote primaire actieknop: `Start Training (48px touch-target)` met play-icoon.
      - Secundaire knoppen om vandaag over te slaan of naar morgen te verplaatsen.
      - Toont een rustige rustdagmelding of een directe link naar schema-configuratie indien er nog geen actief programma is.
    - `src/app/training/page.tsx`:
      - Tabbladen uitgebreid naar: `Planning` (standaard wanneer er een schema bestaat), `Mijn Schema's` en `Oefeningen`.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 waarschuwingen of fouten.
  - Vitest testsuite (`npm test`): **86 van de 86 tests geslaagd** over 8 testbestanden:
    - `tests/planning.test.ts` (18 tests):
      - Lokale datumverwerking (`YYYY-MM-DD`) en preventie van UTC-middernacht verschuiving.
      - Midday parsing (`12:00:00`) tegen zomertijdsprongen.
      - Weekstartberekening en dagnummering voor zowel Maandag als Zondag weekstart.
      - Nederlandse datumformattering (`formatFriendlyDate`).
      - Actief programma selecteren, ophalen en overschakelen.
      - Sessie plannen op een concrete kalenderdatum en ophalen met verrijkte gegevens.
      - Vervangen van ongeplande sessies bij herplanning.
      - Volledige week plannen met `scheduleWeek` inclusief correcte rustdagafhandeling.
      - Verplaatsen van geplande sessies naar een andere datum.
      - Overslaan (`skip`) en herstellen (`unskip`) van geplande sessies.
      - Verwijderen van een sessie (reset naar rustdag).
      - Starten van een workout vanuit een geplande sessie met onveranderlijke snapshot en statusovergang naar `afgerond`.
      - Garanderen dat latere schemawijzigingen reeds gestarte workout-snapshots niet beïnvloeden.
      - Ad-hoc training starten direct vanuit een schemadag.
      - Ondersteuning voor meerdere geplande sessies van hetzelfde schema met eigen unieke identifiers.
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 routes statisch gegenereerd (`/`, `/training`, `/cardio`, `/voeding`, `/profiel`, `/_not-found`).
- **Beperkingen & Notities:**
  - De weekplanner ondersteunt naadloos het wisselen tussen weekstart op Maandag of Zondag; deze instelling wordt persistent onthouden.
  - Geen nepdata of gefingeerde synchronisaties; alle planningen berusten 100% op IndexedDB via Dexie.
- **Volgende Stap:**
  - Prompt 09: Training starten en hervatten (actieve workout tracker, single-active guard, frozen snapshots).

### Stap 09: Training starten en hervatten (Prompt 09)
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Domein & Datamodel (`src/types/database.ts` & `src/lib/db/schema.ts`):**
    - `WorkoutExerciseSnapshot` uitgebreid met `targetWeightKg`, `targetRpe`, `targetRir` en `notes`.
    - `WorkoutSession` verrijkt met persistente sessiestatus: `startedAt` (gestartOp ISO), `currentExerciseIndex` (0-based actieve oefening index), `activeExerciseId` (UUID van de actieve oefening), `scheduledSessionId` (bidirectionele koppeling), `durationMinutes` (automatische duurberekening) en `cancelledAt`.
    - `WorkoutSetSchema` afgestemd met flexibele rep-bereiken en veilige constraints.
  - **Workout Repository Functionaliteit (`src/lib/db/repositories/workout.repository.ts`):**
    - `getActiveWorkoutSession()`: Haalt de huidige actieve sessie op (`status: "actief"`).
    - `ensureNoActiveWorkoutSession()`: Garandeert de regel dat er **maximaal één actieve krachttraining tegelijk** mag bestaan. Biedt duidelijke foutmelding bij conflict.
    - `startWorkoutFromScheduledSession()`: Start vanuit geplande sessie, bewaart frozen snapshot, pre-populateert geplande sets (gemarkeerd als `completed: false`) en markeert geplande sessie als `afgerond` met `completedSessionId`.
    - `startWorkoutFromDay()`: Start actieve training direct vanuit een schemadag.
    - `startEmptyWorkout()`: Start een ad-hoc vrije sessie zonder vooraf vastgelegd schema.
    - `updateActiveSessionExercise()`: Slaat actieve oefeningindex persistent op in IndexedDB zodat herladen/navigeren exact op de juiste oefening blijft.
    - `addExerciseToActiveSession()` & `removeExerciseFromActiveSession()`: Oefeningen dynamisch toevoegen of verwijderen tijdens een lopende training inclusief set-opruiming.
    - `saveWorkoutSet()` & `deleteWorkoutSet()`: Sets opslaan met werkelijk gewicht, reps, RPE, RIR, tijdstempel en voltooid-status.
    - `getPreviousPerformanceForExercise()`: Haalt eerdere sets op uit de meest recente afgeronde sessie voor progressieve overload referentie.
    - `finishActiveSession()`: Rondt training af met duur, sessie-RPE (1-10) en notities.
    - `cancelOrDiscardActiveSession()`: Ondersteunt 3 expliciete keuzes: `"keep_draft"` (behoud draft), `"mark_cancelled"` (registreer als geannuleerd in historie), of `"discard_delete"` (verwijder sessie en sets volledig en herstel gekoppelde planning naar `"gepland"`).
  - **Gebruikersinterface & Active Tracker Modules (`src/components/modules/tracker/`):**
    - `ActiveWorkoutBanner.tsx`: Prominente statusbalk op Home en Training met live pulsindicator, verstreken tijd en directe "Hervatten" knop met >=48px touch targets.
    - `ActiveWorkoutTracker.tsx`: Volledige actieve trainingsinterface geoptimaliseerd voor smartphones (>=48px touch targets):
      - Live sessietimer en geïntegreerde rusttimer met countdown.
      - Horizontale oefen-tabs met voortgangsaanduiding (afgevinkte sets).
      - Vorige prestaties inline getoond voor progressieve overload.
      - Sets-tabel met gewicht- en herhalingsinvoer en grote afvinkknoppen.
      - Oefening toevoegen dialog en oefening verwijderen.
      - Grote sticky afrondbalk onderaan het scherm.
    - `StartWorkoutConflictDialog.tsx`: Modal wanneer een gebruiker een training wil starten terwijl er al één actief is (keuze tussen hervatten of weggooien).
    - `ExitWorkoutDialog.tsx`: Modal met de 3 expliciete opties voor pauzeren, annuleren of weggooien.
    - `FinishWorkoutDialog.tsx`: Modal voor training voltooien met samenvatting, RPE selector (1-10) en trainingsnotities.
    - `StartFreeWorkoutDialog.tsx`: Modal om direct een losse training te starten.
    - `TodayTrainingCard.tsx` & `WeekPlanner.tsx`: Verbonden met actieve sessie detectie en directe hervatfunctionaliteit.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 fouten of waarschuwingen.
  - Vitest testsuite (`npm test`): **101 van de 101 tests geslaagd** over 9 testbestanden:
    - `tests/activeWorkout.test.ts` (15 gerichte tests voor actieve sessies, persistentie, sets, eerdere prestaties en afbreekopties).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 pagina's correct gegenereerd.
- **Volgende Stap:**
  - Prompt 10: Sets registreren (snelle setregistratie, decimalen, vorige set kopiëren, assisted oefeningen) [AFGEROND].

### Stap 10: Sets registreren (Prompt 10)
- **Datum:** 2026-10-02
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Domein & Set Parsing (`src/domain/strength/setParser.ts`):**
    - `parseDecimalInput(raw, max, min)`: Flexibele decimaalinvoer met ondersteuning voor zowel komma als punt (`"72,5"` en `"72.5"` -> `72.5`) zonder focusverlies, sprongen of NaN. Beveiligd tegen negatieve invoer en absurde uitschieters (max 1000 kg).
    - `parseRepsInput(raw, max, min)`: Veilige gehele getallen parsing voor herhalingen (0 tot 500).
    - `parseDurationInput(raw)`: Ondersteunt zowel seconden (`"45"` -> 45) als `mm:ss` formaat (`"1:30"` -> 90) voor tijdgebaseerde oefeningen.
    - `formatDurationSeconds(seconds)`: Duidelijke Nederlandse tijdnotatie (`"45s"`, `"1m 30s"`).
    - `parseRpeInput` & `parseRirInput`: Invoer en afronding van RPE (1-10 in stappen van 0.5) en RIR (0-10).
    - `duplicateSetValues(previousSet, nextSetNumber, newId)`: Kopieerfunctie die gewicht, herhalingen/duur, setType, targetRpe en assisted-status overneemt, maar **strikt** `completed: false`, `actualRpe: null` en `completedAt: null` initialiseert conform specificatie.
    - `compareSetPerformance(a, b)`: Behandelt assisted-oefeningen expliciet met omgekeerde progressie: **minder tegengewicht = meer eigen lichaamsgewicht getild = betere prestatie** (20 kg machinehulp wint van 30 kg machinehulp).
    - `getWeightFieldLabel(measurementType, isAssisted)`: Retourneert contextuele labels en placeholders per meettype ("Tegengewicht (hulp)", "Extra gewicht (+/-)", "Gewicht").
  - **Geavanceerde Set Component (`src/components/modules/tracker/SetRow.tsx`):**
    - Modulaire rij met lokale tekst-states (`inputMode="decimal"` en `inputMode="numeric"`) voor vloeiend typen op mobiele schermen zonder hapering.
    - Directe autosave op `onBlur` en `Enter`.
    - SetType badges voor werkset, opwarmen, dropset en tot falen (`normal`, `warmup`, `drop`, `failure`).
    - Grote touch-targets (>= 48x48px) voor afvinken en setbediening met bezwete handen.
    - Visuele indicatie voor tegengewicht (`-kg`) en behulpzame contextuele hint voor assisted oefeningen.
  - **Actieve Tracker Uitbreidingen (`src/components/modules/tracker/ActiveWorkoutTracker.tsx`):**
    - Toevoegen van "Kopieer vorige set" knop naast "+ Set toevoegen".
    - Dubbelklikbeveiliging (`isOperatingSet`) op toevoeg- en kopieeracties ter preventie van dubbele sets.
    - Automatische hernummering (1..N) en opslag bij het verwijderen van een tussenliggende set.
    - Prominente waarschuwingsbanner bij assisted oefeningen met uitleg over de omgekeerde progressielogica.
    - Kolomtitels in de desktopweergave passen zich dynamisch aan op het meettype van de actieve oefening (Tegengewicht, Extra gewicht, Duur in sec).
  - **Database & Repositories (`src/types/database.ts`, `src/lib/db/schema.ts`, `src/lib/db/repositories/workout.repository.ts`):**
    - `WorkoutExerciseSnapshot` en `WorkoutSet` verrijkt met `measurementType`, `effortScale`, `durationSeconds`, `targetRir`, `actualRir`, `isAssisted` en `completedAt`.
    - Zod schema validatie afgestemd met nullable types en constraints.
    - Onvoltooide sets worden in `getPreviousPerformanceForExercise` strikt uitgesloten van eerdere prestaties en progressieve overload.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 waarschuwingen of fouten.
  - Vitest testsuite (`npm test`): **124 van de 124 tests geslaagd** over 11 testbestanden:
    - `src/domain/strength/setParser.test.ts` (14 tests voor komma/punt decimaalparsing, reps, tijdsduur, duplicaat en assisted vergelijking).
    - `tests/setRegistration.test.ts` (9 integratietests voor 3 sets registreren, 1 wijzigen, herladen uit IndexedDB, decimalen, kopiëren, assisted ranking, uncompleted set filtering, hernummering en Zod validatie).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 pagina's correct gegenereerd.
- **Beperkingen & Notities:**
  - Invoer met komma en punt werkt consistent over alle platformen dankzij gecontroleerde `inputMode="decimal"` inputs.
  - Geen neppe data; alle gewichten, herhalingen en sets worden direct persistent opgeslagen in IndexedDB.
- **Volgende Stap:**
  - Prompt 11: Stap 11 — Rusttimer en trainingsnotities (Geïntegreerde rusttimer met audio/vibratie fallback, achtergrondbestendigheid en oefen- en sessienotities) [AFGEROND].

### Stap 11: Rusttimer en oefennotities (Prompt 11)
- **Datum:** 2026-10-03
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Domein & Timestamp-gebaseerde Rusttimer (`src/domain/strength/restTimer.ts`):**
    - `getRemainingSeconds(state, nowMs)`: Berekent de resterende seconden zuiver uit de absolute doeltijdstempel (`targetEndTimeMs - nowMs`), niet alleen uit interval-ticks. Garandeert dat de timer na 30 seconden achtergrondgebruik, tab-switches of schermvergrendeling exact klopt.
    - `startRestTimer`, `pauseRestTimer`, `resumeRestTimer`, `adjustRestTimer`: Volledige bediening met pauzeren (bevriest resterende seconden), hervatten (herberekent doeltijdstempel), plus/min 15 seconden (+15s / -15s) en overslaan.
    - `formatTimerDisplay`: Formattering naar `mm:ss` (`"01:30"`, `"00:45"`, `"00:00"`). Nooit negatieve waarden.
    - Web Audio API synthese (`playTimerCompletionSound`) en Vibration API (`triggerTimerVibration`) met stille fallback als audio/trillen geblokkeerd is of de browser geen permissie heeft.
    - Opt-in voorkeuren voor geluid en trillen opgeslagen in `localStorage` met transparante toelichting dat gesloten mobiele browsers achtergrondgeluid kunnen onderbreken.
    - Persistentie via `saveTimerStateToStorage` en `loadTimerStateFromStorage`: timer overleeft herladen of navigeren binnen de app.
  - **Geïsoleerde Rusttimer Component (`src/components/modules/tracker/RestTimerBar.tsx`):**
    - Bevat een eigen lokale 1-seconde interval zodat **uitsluitend** de balk re-rendert en de rest van de actieve training (invoervelden, focus, sets) 100% rustig en stabiel blijft zonder storende inputfocus of schermflikkering.
    - Luistert naar `visibilitychange` en `window.onfocus` voor ogenblikkelijke herberekening na achtergrondgebruik.
    - Grote touch-targets (>= 48x48px) voor alle bedieningselementen.
  - **Strikte Scheiding van Notities (`src/components/modules/tracker/ExerciseNotesCard.tsx`):**
    - **1. Blijvende Technieknotitie:** Persistent opgeslagen op `Exercise.techniqueNotes` in de oefeningenbibliotheek (bv. "Bankje op stand 2, pinken op ringen"). Zichtbaar bij elke toekomstige training van deze oefening en direct bewerkbaar.
    - **2. Vorige Trainingsnotitie:** Uitgelezen uit de vorige voltooide sessie voor deze oefening via `getPreviousPerformanceForExercise` (`exerciseNotes`).
    - **3. Huidige Sessienotitie:** Opgeslagen in `session.snapshot.exercises[i].notes` specifiek voor deze trainingsdatum met autosave bij verlaten van het veld (`updateSessionExerciseNotes`).
  - **Database & Repositories (`src/types/database.ts`, `src/lib/db/schema.ts`, `src/lib/db/repositories/exercise.repository.ts`, `src/lib/db/repositories/workout.repository.ts`):**
    - `Exercise` en `ExerciseSchema` uitgebreid met optioneel veld `techniqueNotes`.
    - `ExerciseRepository.updateTechniqueNotes(id, techniqueNotes)` toegevoegd voor atomaire bibliotheekupdates.
    - `WorkoutRepository.updateSessionExerciseNotes(sessionId, exerciseIndex, notes)` toegevoegd voor sessie-oefennotities.
    - `WorkoutRepository.getPreviousPerformanceForExercise` retourneert nu ook `exerciseNotes` van de vorige afgeronde training.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): 0 fouten.
  - Linting (`npm run lint`): 0 waarschuwingen of fouten.
  - Vitest testsuite (`npm test`): **141 van de 141 tests geslaagd** over 13 testbestanden:
    - `src/domain/strength/restTimer.test.ts` (9 tests voor timestampberekeningen, 30s achtergrondsimulatie, pauze/hervat, +/-15s en audio/trillen fallback).
    - `tests/restTimerAndNotes.test.ts` (8 integratietests voor timestamp timer, achtergrondweerbaarheid, strikte scheiding tussen technieknotitie en sessienotitie, en eerdere notities tonen bij de volgende sessie).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 pagina's correct gegenereerd.
- **Beperkingen & Notities:**
  - Timer berekent resterende tijd altijd op basis van het verschil tussen systeemtijd en ingestelde doeltijdstempel.
  - Geluid en trillen werken zolang het tabblad geopend is; browsers blokkeren actieve audio bij volledig afgesloten apps (geen valse beloften).
- **Volgende Stap:**
  - Prompt 12: Stap 12 — Training afronden en corrigeren (Afrondscherm, bewerkbare voltooide training, herberekening van PR's en volume, incomplete sets afhandeling) [AFGEROND].

### Stap 12: Training afronden en corrigeren (Prompt 12)
- **Datum:** 2026-10-03
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Domeinberekeningen Krachttraining Volume & PR's (`src/domain/strength/volumeAndPR.ts`):**
    - `calculateSetVolume(set)`: Berekent het volume per set (\(gewicht \times herhalingen\)). Alleen daadwerkelijk voltooide sets (`completed === true`) met positieve waarden tellen mee. Assisted sets (tegengewicht machinehulp) worden strikt uitgesloten van positief extern gewichtsvolume.
    - `calculateSessionVolume(sets)`: Sommeert zuiver voltooide sets voor een accurate sessietonnage in kg.
    - `estimate1RM(weightKg, reps, formula)`: Ondersteunt zowel Epley als Brzycki formules met veilige asymptootbeveiliging.
    - `calculateExercisePRs(exerciseId, sets)`: Berekent dynamisch de zwaarste set (`maxWeightKg`), hoogste 1RM (`maxEstimated1RM`), maximaal volume in één set en cumulatief volume. PR's worden live afgeleid uit actuele voltooide sets, waardoor aanpassen of verwijderen direct correct doorwerkt zonder vervuilde historische records.
  - **Afrondscherm & Incomplete Sets Handling (`src/components/modules/tracker/FinishWorkoutDialog.tsx`):**
    - Samenvattingsheader met trainingsduur, voltooide sets vs geplande sets en totale tonnage in kg.
    - Oefeningenoverzicht met alle gelogde sets en subtotalen per oefening.
    - Duidelijke keuze bij niet-voltooide sets:
      - *Optie A (Aanbevolen):* "Weglaten" — niet-voltooide sets worden gewist; alleen uitgevoerde sets tellen mee.
      - *Optie B:* "Markeren als voltooid" — markeert alle resterende geplande sets als afgerond met de ingevulde waarden.
    - RPE-scoreselector (1 t/m 10) met >= 48px touch-targets en tekstuele toelichting.
    - Optioneel notitieveld voor sessie-ervaring.
    - Dubbelklikbeveiliging (`isSubmitting` en `isFinishingRef`) op de afrondknoppen.
  - **Atomaire Database Persistentie (`src/lib/db/repositories/workout.repository.ts`):**
    - `finishSession(sessionId, options)`: Dexie transactie op `[workoutSessions, workoutSets, scheduledSessions]` garandeert atomaire afronding.
    - Incomplete sets worden conform de gebruikerskeuze verwijderd (`discard`) of gemarkeerd (`mark_completed`).
    - Koppeling aan geplande sessie: zet gekoppelde `scheduledSession.status = "afgerond"` en `completedSessionId = session.id` zonder duplicaten.
    - Idempotent: dubbelklikken of gelijktijdige aanroepen geven veilig het afgeronde sessierecord terug.
    - Weerbaarheid bij opslagfouten: actieve sessiestatus wordt **uitsluitend** opgeheven na succesvolle databasepersistentie.
    - `updateCompletedSession(sessionId, updates)`: Maakt datum, RPE en notities bewerkbaar en synchroniseert de datum van een eventueel gekoppelde geplande sessie.
    - `deleteCompletedSession(sessionId)`: Verwijdert sessie en sets en herstelt een eventueel gekoppelde geplande sessie atomair terug naar `status: "gepland"` met `completedSessionId: null`.
    - `updateWorkoutSet(setId, updates)` & `addSetToSession(sessionId, exerciseId, initialValues)`: Maakt sets in voltooide trainingen bewerkbaar met automatische hernummering.
  - **Gebruikersinterface voor Voltooide Trainingen (`src/components/modules/tracker/`, `src/app/training/page.tsx`):**
    - `CompletedWorkoutDetailModal.tsx`:
      - Detailweergave van voltooide training met statistieken, RPE, notities en uitsplitsing per oefening.
      - Bewerkmodus met realtime volumeberekening tijdens het typen, datumkiezer, inline setbewerkingen (+ set toevoegen, gewicht/reps/type wijzigen, set wissen).
    - `DeleteWorkoutConfirmDialog.tsx`: Duidelijke Nederlandse bevestigingsdialoog met waarschuwing over het wissen van sets en de automatische herstelkoppeling naar de weekplanning.
    - "Workouts"-tabblad op `TrainingPage` uitgebreid met "Bekijken & Bewerken" en verwijderknoppen per sessiekaart.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **162 van de 162 tests geslaagd** over 15 testbestanden:
    - `src/domain/strength/volumeAndPR.test.ts` (13 tests voor volume, 1RM en dynamische PR-berekeningen).
    - `tests/finishAndEditWorkout.test.ts` (8 gerichte tests voor incomplete sets discard/voltooid, geplande sessiekoppeling zonder duplicaten, dubbelklikken, storage failure resilience, sessie bewerken met datum/notities/sets, dynamische volume/PR herberekening en veilig verwijderen).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 pagina's correct gegenereerd.
- **Beperkingen & Notities:**
  - Alleen daadwerkelijk uitgevoerde sets (`completed === true`) beïnvloeden volume en PR-statistieken.
  - Actieve trainingsstatus verdwijnt nooit zolang de IndexedDB write niet succesvol is afgerond.
- **Volgende Stap:**
  - Prompt 13: Stap 13 — Geschiedenis en oefenprogressie (Trainingsgeschiedenis met datumfilters, zoeken op oefening, sessiedetails, oefenpagina met grafieken voor gewicht, reps, volume en RPE over tijd, tabelweergave en lb conversie) [AFGEROND].

### Stap 13: Geschiedenis en oefenprogressie (Prompt 13)
- **Datum:** 2026-10-03
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Domeinlogica Trainingsgeschiedenis & Progressie (`src/domain/strength/progression.ts`):**
    - `getStartDateForFilter(filterType, customRange, now)`: Berekent de exacte begindatum voor vooraf gedefinieerde filters (`all`, `7d`, `30d`, `90d`, `1y`, `custom`).
    - `filterWorkoutSessions(sessions, filterType, options)`: Filtert workoutsessies op datumbereik, aangepast van-tot bereik, specifieke oefening ID en tekstuele zoekopdracht (zowel sessienaam, schemadagnaam, notities als oefeningnamen).
    - `buildExerciseProgressionPoints(exercise, completedSessions, allSets, userBodyweightKg)`:
      - Bouwt chronologische datapunten per sessie voor grafieken en tabellen.
      - **Strikte scheiding meettypes:** Externe belasting (\(kg \times reps\)), assisted machines (tegengewicht machinehulp, volume tonnage = 0 kg, omgekeerde progressie waarbij minder hulp beter is) en lichaamsgewicht (volume alleen bij expliciet geregistreerd actueel lichaamsgewicht).
      - **Nul en ontbrekend (null/undefined):** 0 kg getild is een expliciete nulwaarde; ontbrekend gewicht of ontbrekende RPE is `null` en verstoort het nulpunt van de grafiek niet.
      - 1RM-schatting via de Epley-formule per sessie.
      - `convertProgressionPointsToLbs(points)`: Converteert gewichten en tonnage naar lbs puur voor presentatie (canonieke database behoudt altijd kg).
  - **Oefenprogressie Modal & Grafiek (`src/components/modules/exercises/ExerciseProgressionModal.tsx`):**
    - Responsieve vector-grafiek (SVG) met vloeiende polylijn, rasterlijnen, interactieve datapunten met tooltips, en duidelijke y-as schaal.
    - Robuuste weergave van randgevallen:
      - Lege status: vriendelijke toelichting dat de oefening nog niet voltooid is in een sessie.
      - Enkelpunts status (1 datapunt): toont een horizontale referentielijn en één gecentreerde interactieve punt (geen kapotte of schuine helling).
    - Metriek-selector: snel schakelen tussen *Hoogste Gewicht*, *Herhalingen (Reps)*, *Werksetvolume (kg/lbs)* en *RPE over tijd*.
    - Eenhedenschakelaar (kg / lbs) via pure presentatieconversie.
    - Toegankelijke datatabel (`<table>`) met datum, sessie, max gewicht, reps, volume, RPE en status voor schermlezers en exacte vergelijking.
    - Samenvattingskaarten met all-time PR's en toelichting op de gekozen volumeberekening conform AGENTS.md.
  - **Trainingsgeschiedenis Weergave (`src/components/modules/history/WorkoutHistoryView.tsx`):**
    - Filterbalk met zoekveld (naam, oefening, notities), datumfilter dropdown en aangepaste van-tot datumkiezers.
    - Eenhedenswitch (kg / lbs) voor cumulatieve volumeweergave.
    - Filter Ribbon met dynamische totalen: aantal sessies, totaal verplaatst gewichtsvolume, totale trainingstijd.
    - Sessiekaarten met tags voor alle uitgevoerde oefeningen: klikken op een oefening opent direct de interactieve `ExerciseProgressionModal` voor die oefening.
    - Snelle acties: "Bekijken & Bewerken" (opent `CompletedWorkoutDetailModal`), "Verwijderen" (opent `DeleteWorkoutConfirmDialog`), of "Hervatten" indien sessie actief is.
  - **Integratie in Trainingpagina & Oefeningenbibliotheek:**
    - `src/app/training/page.tsx`: Tabblad "Workouts" vervangen door `WorkoutHistoryView`.
    - `ExerciseLibrary.tsx` en `ExerciseDetailDialog.tsx`: Uitgebreid met directe "Bekijk Progressie"-knop.
    - `CompletedWorkoutDetailModal.tsx`: Uitgebreid met directe progressielinks per oefening.
  - **Uitgebreide Tests:**
    - `src/domain/strength/progression.test.ts`: 11 unit tests voor filters, datumbereiken, meettype-scheiding en lbs-conversie.
    - `tests/workoutHistoryAndProgression.test.ts`: 9 integratietests met echte IndexedDB transacties voor filters, zoeken, realtime progressie-updates na bewerken/verwijderen van voltooide sessies, assisted machines, lichaamsgewicht en enkelpunts/lege grafieken.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **182 van de 182 tests geslaagd** over 17 testbestanden.
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 pagina's correct statisch gegenereerd.
- **Beperkingen & Notities:**
  - Externe gewichten en assisted tegengewichten worden strikt nooit opgeteld in één ambigu volumegetal.
  - Oefenprogressie wordt altijd live samengesteld uit de actuele sets in IndexedDB; een bewerking of verwijdering van een oude training werkt onmiddellijk door in de grafiek.
- **Volgende Stap:**
  - Prompt 14: Stap 14 — Persoonlijke records en geschatte 1RM.

---

### Stap 14: Persoonlijke records en geschatte 1RM (Prompt 14)
- **Datum:** 2026-10-03
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Domeinlogica Persoonlijke Records (`src/domain/strength/personalRecords.ts`):**
    - `calculateEligible1RM(weightKg, reps, measurementType, formula)`:
      - Wetenschappelijke rep-bereik validatie: strikt beperkt tot \(1 \le reps \le 10\). Boven 10 reps is een 1RM-schatting onbetrouwbaar en wordt `null` geretourneerd.
      - Meettype validatie: alleen voor `gewicht_herhalingen` en `extra_gewicht`. Assisted machines en pure lichaamsgewichtoefeningen krijgen expliciet geen 1RM.
      - 1 rep = 100% werkelijke meting (`isEstimated: false`); 2 t/m 10 reps = Epley of Brzycki formule met zichtbaar label `"Geschat"`.
    - `evaluateSetForPRs(candidateSet, exercise, session, priorSets, formula)`:
      - Evalueert een voltooide werkset tegen alle chronologisch eerdere sets over 5 officiële categorieën:
        1. **Zwaarste gewicht (`max_weight`):** Maximaal extern gewicht.
        2. **Meeste herhalingen bij een bepaald gewicht (`reps_at_weight`):** Meer reps bij ditzelfde gewicht dan ooit eerder.
        3. **Geschatte 1RM (`estimated_1rm`):** Hoogste 1RM (\(1 \le reps \le 10\)).
        4. **Minste tegengewicht (`least_assistance`):** Omgekeerde progressie bij assisted machines (bv. 20 kg hulp is een nieuw PR ten opzichte van eerdere 30 kg hulp).
        5. **Zwaarste set-volume (`max_volume_set`):** Hoogste tonnage in één werkset.
      - **Tie-bescherming:** Een gelijke prestatie is **geen** nieuw record; de eer en oorspronkelijke datum blijven behouden.
      - **Incomplete sets:** Sets met `completed === false` worden uitgesloten van PR-toekenning.
    - `detectSessionPRs(session, allSessions, allSets, exercises, formula)`:
      - Detecteert alle in een trainingssessie behaalde records door chronologisch te vergelijken met voorafgaande sessies.
    - `detectAllPRsAcrossHistory(allSessions, allSets, exercises, formula)`:
      - Berekent alle behaalde PR's over de volledige trainingshistorie.
    - `getRecentAchievedPRs(allSessions, allSets, exercises, days, now, formula)`:
      - Filtert behaalde PR's binnen de afgelopen N dagen (standaard 7 dagen / "deze week").
  - **Dynamische Herberekening & Data-integriteit:**
    - PR's worden 100% dynamisch afgeleid van de werkelijk opgeslagen sets en sessies in IndexedDB.
    - Bij bewerken of verwijderen van een training (`deleteCompletedSession`) herstelt het direct voorgaande record zich automatisch als actief record, zonder achterblijvende vervuilde database-records.
  - **Favoriete Oefeningen in AppSettings & Repository:**
    - `favoriteExerciseIds?: EntityId[]` toegevoegd aan `AppSettings` en `AppSettingsSchema`.
    - `SettingsRepository` uitgebreid met `getFavoriteExerciseIds()`, `setFavoriteExerciseIds(ids)` en `toggleFavoriteExerciseId(id)`.
  - **Home Cockpit Widgets (`src/app/page.tsx`):**
    - `HomeRecentPRsWidget`: Toont 'Deze week behaalde records' (afgelopen 7 dagen) met trofee-styling, categoriebadges, nieuwe waarde, vorige waarde en datum.
    - `HomeFavoriteExercisesWidget`:
      - Interactieve tabbladen voor favoriete compound oefeningen (bijv. Bankdrukken, Barbell Squat, Deadlift).
      - Quick-select modal dialog om favorieten aan te vinken of te ontkoppelen.
      - Metriekschakelaar (Geschatte 1RM, Max Gewicht, Werksetvolume).
      - Zichtbaar label "Geschat (Epley)" bij 1RM.
      - Responsieve SVG mini-grafiek met vloeiende polylijn, raster en eindwaarde.
      - Doorklikknop naar de volledige `ExerciseProgressionModal`.
  - **Trainingssessies & Tracker UI Integratie:**
    - `ActiveWorkoutTracker.tsx`:
      - Realtime feedback banner bij het afronden van een set die een nieuw PR vestigt (`🏆 Nieuw PR voor ...!`).
      - Rusttimer blijft direct na voltooien functioneren.
      - `SetRow.tsx`: Toont een gouden `🏆 PR` badge op voltooide sets die een nieuw record vestigden.
      - `FinishWorkoutDialog.tsx`: Toont een feestelijk "Behaalde Records" overzicht met alle in deze workout behaalde PR's.
    - `CompletedWorkoutDetailModal.tsx`:
      - Toont een prominente "Behaalde Records in deze training" banner met exercise badges, categorie, oude vs nieuwe waarde en formule.
      - Toont gouden `🏆 PR` indicatoren in de set-tabelrijen.
  - **Uitgebreide Tests:**
    - `src/domain/strength/personalRecords.test.ts`: 11 pure domeintests voor alle 5 PR-categorieën, 1-10 reps 1RM grenzen, afkeuren van assisted 1RM, tie-bescherming, omgekeerde assisted progressie en recente PR's filtering.
    - `tests/personalRecordsIntegration.test.ts`: 6 integratietests met echte Dexie/IndexedDB database voor sessie-PR's, tie-beveiliging, uitsluiten van incomplete sets, omgekeerde progressie bij assisted machines, dynamisch herstel van voorgaand PR na verwijdering van een sessie, en favoriete oefeningen persistentie in AppSettings.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **199 van de 199 tests geslaagd** over 19 testbestanden.
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 routes statisch gegenereerd.
- **Beperkingen & Notities:**
  - 1RM-schattingen worden strikt begrensd tot maximaal 10 herhalingen conform wetenschappelijke standaarden (boven 10 reps is 1RM onbetrouwbaar).
  - Geen PR-confetti of badges voor niet-afgevinkte sets of gelijke scores (ties).
- **Volgende Stap:**
  - Prompt 15: Stap 15 — Progressieve Overload & Dubbele Progressie.

---

### Prompt 15 — Progressieve Overload, Dubbele Progressie en Aanbevelingen
- **Datum:** 2026-10-03
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Pure Domeinlogica Progressieve Overload (`src/domain/strength/progressiveOverload.ts`):**
    - `calculateProgressiveOverload(input)`:
      - **Deterministische Dubbele Progressie (Double Progression):**
        - Eerst herhalingen (reps) uitbouwen binnen het repbereik (`targetRepsMin` t/m `targetRepsMax`).
        - Zolang nog niet álle voltooide werksets de bovengrens (`targetRepsMax`) hebben bereikt, is de actie `increase_reps` ("Herhalingen opbouwen") op hetzelfde gewicht.
        - Pas wanneer **alle werksets de bovengrens hebben gehaald**, wordt een instelbare gewichtsstap voorgesteld (`increase_weight`), waarbij de herhalingen resetten naar `targetRepsMin`.
      - **Doel-RPE / RIR Overloadbescherming:**
        - Als een doel-RPE is opgegeven en de gemiddelde werkelijke RPE substantieel te hoog was (`avgRpe >= targetRpe + 1.5`, bijv. RPE 10 / absolute failure terwijl doel RPE 8 was), adviseert het algoritme `maintain_weight` ("Consolideren & herstellen") om techniek te borgen en overbelasting te voorkomen.
      - **Assisted Machines (Omgekeerde Progressie):**
        - Wanneer alle sets de maximale herhalingen halen op het huidige tegengewicht, stelt het algoritme voor om de machinehulp te verlagen (`reduce_assistance`, bv. 30 kg -> 27.5 kg machinehulp).
      - **Apparatuurspecifieke Gewichtsstappen (`getDefaultEquipmentStep`):**
        - Barbell: standaard +2,5 kg (2x 1.25 kg schijven).
        - Dumbbell: standaard +2,0 kg (+1 kg per dumbbellpaar).
        - Machine / Kabel: standaard +2,5 kg.
        - Kettlebell: standaard +4,0 kg (standaard stappen 12 -> 16 -> 20 kg).
        - Assisted: -2,5 kg (minder tegengewicht).
        - Ondersteunt handmatige overrides zoals microloading (bv. +1.25 kg).
      - **Aanleiding & Rationale (Transparantie):**
        - Iedere suggestie bevat een heldere Nederlandstalige toelichting van de exacte reden (waarom gewicht omhoog, waarom eerst reps opbouwen of waarom herstellen).
      - **Adviesprincipe & Disclaimer (AGENTS.md Regel 7):**
        - Expliciete disclaimer: *"Dit voorstel is een indicatieve richtlijn op basis van dubbele progressie. Pas gewichten en herhalingen altijd aan op jouw actuele techniek, vermoeidheid en herstel."*
        - Suggesties zijn voorstellen; de gebruiker behoudt altijd de controle en bevestigt acties expliciet.
  - **Database Repository Integratie (`src/lib/db/repositories/workout.repository.ts`):**
    - `getProgressionSuggestion(exerciseId, plannedTarget?, equipmentStepKg?, fallbackExercise?)`:
      - Zoekt de meest recente voltooide sessie voor de oefening in IndexedDB.
      - Filtert voltooide werksets (`completed === true`, `setType !== 'warmup'`).
      - Berekent en retourneert de deterministische overload suggestie.
  - **Gebruikersinterface Components:**
    - `ProgressiveOverloadCard.tsx` (`src/components/modules/tracker/ProgressiveOverloadCard.tsx`):
      - Herbruikbare kaart met dynamische kleurcodering (emerald voor gewicht/hulp, blauw voor herhalingen, amber voor consolideren, slate voor nulmeting).
      - Vergelijking: vorig gewicht vs voorgesteld doelgewicht & reps.
      - Rationale en optionele RPE-contextbanner.
      - 1-klik knop "Pas toe op huidige training" met directe visuele feedback ("Toegepast ✓").
      - Uitklapbare uitleg over dubbele progressie en de gekozen uitrustingsstap.
      - Compacte weergavemodus (`isCompact`) voor modalen en samenvattingen.
    - `ActiveWorkoutTracker.tsx`:
      - Laadt automatisch de progressieve overload suggestie zodra een oefening wordt geselecteerd.
      - Toont de `ProgressiveOverloadCard` prominent tussen de voorschriftkaart en de werksets tabel.
      - `handleApplyProgressionSuggestion`: vult met 1 klik het voorgestelde gewicht en reps in voor alle resterende niet-voltooide sets en slaat deze direct persistent op in IndexedDB.
    - `ExerciseProgressionModal.tsx`:
      - Toont in de oefenprogressie-dialoog direct het berekende dubbele progressie voorstel voor de volgende sessie.
  - **Uitgebreide Tests:**
    - `src/domain/strength/progressiveOverload.test.ts`: 10 pure domeintests voor apparatuurstappen, bovengrens-verhoging, dumbbell sprongen, microloading, herhalingenopbouw, RPE-consolidatie, assisted machine progressie, en ontbrekende data.
    - `tests/progressiveOverloadIntegration.test.ts`: 6 integratietests met echte Dexie IndexedDB opslag voor nulmeting, double progression bij max reps, herhalingsopbouw bij onvoltooide reps, RPE overload protectie, assisted pull-up omgekeerde progressie en microloading overrides.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **215 van de 215 tests geslaagd** over 21 testbestanden.
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 routes statisch gegenereerd.
- **Beperkingen & Notities:**
  - Suggesties baseren zich strikt op voltooide werksets (warming-up sets worden genegeerd).
  - Als er nog geen afgeronde sets bestaan, geeft het systeem `insufficient_data` en wordt geen willekeurige verhoging gefingeerd.
- **Volgende Stap:**
  - Prompt 16: Stap 16 — Spiergroepen en consistentie.

---

### Prompt 16 — Spiergroepen en Consistentie
- **Datum:** 2026-10-03
- **Status:** `[x] KLAAR`
- **Uitgevoerde Acties:**
  - **Pure Domeinlogica Spiergroepen Volume & Consistentie (`src/domain/strength/muscleVolume.ts`):**
    - `calculateWeeklyMuscleVolume(options)`:
      - **Transparante Telmethode:** Primaire spiergroepen tellen als 1,0 werkset (direct volume). Secundaire spiergroepen tellen apart als 0,5 werkset (fractioneel indirect volume). Eén set wordt nooit ongemerkt als een volledige set geteld voor iedere hulpspier.
      - **Strikte Werksetfilter:** Uitsluitend voltooide sets (`completed === true`) in afgeronde sessies (`status === 'afgerond'`) tellen mee. Warming-up sets (`setType === 'warmup'`) worden standaard uitgesloten.
      - **Spiergroepaggregatie:** Berekent directe sets, indirecte sets, fractioneel totaal, totaal tonnage (kg) en categoriseert indicatief (geen, laag, optimaal, hoog) per spiergroep (borst, rug, benen, schouders, armen, core, kuiten).
      - **Maand- en Jaargrenzen:** Correcte afhandeling van weken die over maand- of jaargrenzen lopen (bijv. 31 december naar 1 januari).
    - `calculateWeeklyConsistency(options)`:
      - Berekent consistentie als het aantal behaalde trainingsweken t.o.v. een instelbaar weekdoel (standaard 3 trainingen/week).
      - **Herstellende Rustdagen:** Rustdagen worden expliciet respectvol behandeld als herstel (`isRestDay: true`) en **nooit** als falen of rood kruis weergegeven.
      - Berekent actieve wekenstreaks en het algehele consistentiepercentage over een instelbaar venster (bijv. afgelopen 4 weken).
      - **Disclaimer (AGENTS.md Regel 7):** Geen claims dat het overzicht overtraining voorkomt. Het is een transparant planning- en analysetool.
  - **Database & Instellingen Integratie:**
    - `weeklyWorkoutGoal?: number` toegevoegd aan `AppSettings` en `AppSettingsSchema` (standaard 3, begrensd tussen 1 en 7).
    - `SettingsRepository` uitgebreid met `getWeeklyWorkoutGoal()` en `setWeeklyWorkoutGoal(goal)`.
    - `WorkoutRepository` uitgebreid met:
      - `getWeeklyMuscleVolume(weekStartDate?, weekStartsOn?)`: Haalt gegevens op uit IndexedDB en levert het volledige weekrapport.
      - `getWeeklyConsistency(historyWeeksCount?, referenceDateStr?, weekStartsOn?, weeklyGoalOverride?)`: Levert actuele en historische consistentiecijfers.
  - **Gebruikersinterface Components:**
    - `BodyVisualizationSVG.tsx` (`src/components/modules/history/BodyVisualizationSVG.tsx`):
      - Interactief anatomisch silhouet met voorzijde (borst, schouders, armen, core, benen, kuiten) en achterzijde (rug, achterste schouders, triceps, glutes/hamstrings, kuiten).
      - Dynamische kleurvulling op basis van sets: neutraal leeg (0 sets), zacht groen (1-9 sets), optimaal groen (10-20 sets) en diepgroen (>20 sets).
      - Aanklikbaar: selecteert een spiergroep en toont direct details en bijdragende oefeningen.
    - `MuscleVolumeOverview.tsx` (`src/components/modules/history/MuscleVolumeOverview.tsx`):
      - Weeknavigator (vorige/volgende/deze week).
      - Samenvattingsribbon: totaal werksets, totaal tonnage en meest getrainde spiergroep.
      - Zichtbare toelichting op telmethode (direct vs indirect).
      - Weergaveschakelaar: interactieve Lichaamskaart (SVG) of gedetailleerde Spiergroeplijst met progressiebalken.
      - Detailkaart voor geselecteerde spiergroep met directe/indirecte uitsplitsing, tonnage en lijst met geregistreerde oefeningen.
      - Verplichte disclaimer inzake trainingsplanning en herstel.
    - `WeeklyConsistencyWidget.tsx` (`src/components/modules/history/WeeklyConsistencyWidget.tsx`):
      - Visualisatie van weekdoel met inline aanpassing (2x, 3x, 4x, 5x per week).
      - 7-dagen strip (Ma t/m Zo) met duidelijke checkmarks voor trainingen en rustige `Moon` indicatoren voor hersteldagen.
      - Voortgangsbalk naar weekdoel met viering bij behalen (`(Doel behaald! 🎯)`).
      - Historische consistentiebadge (% van afgelopen weken behaald) en actieve wekenstreak.
  - **Applicatie-integratie:**
    - `src/app/page.tsx` (Home): `WeeklyConsistencyWidget` prominent toegevoegd in de cockpit voor directe dagelijkse motivatie en consistentietracking.
    - `src/app/training/page.tsx`: Nieuw tabblad `"Spiergroepen & Volume"` toegevoegd met zowel `WeeklyConsistencyWidget` als de volledige `MuscleVolumeOverview`.
  - **Uitgebreide Tests:**
    - `src/domain/strength/muscleVolume.test.ts`: 9 pure domeintests voor gescheiden primaire/secundaire telling, uitsluiting van warming-up en incomplete sets, jaargrens (31 dec -> 1 jan), weekStartsOn (maandag vs zondag), en respectvolle rustdagen zonder falen.
    - `tests/muscleVolumeIntegration.test.ts`: 5 integratietests met echte Dexie IndexedDB opslag voor spiergroepenvolume, telmethode, data-integriteit bij verwijderen van sessies, weekdoel consistentie en jaargrenzen.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **229 van de 229 tests geslaagd** over 23 testbestanden.
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 routes statisch gegenereerd.
- **Beperkingen & Notities:**
  - Primaire sets tellen als 1.0; secundaire sets als 0.5 (fractioneel) om dubbeltelling te voorkomen.
  - Rustdagen tellen bewust nooit als falen of rode kruisen.
- **Volgende Stap:**
  - Prompt 17: Cardio: Activiteitstypen, datamodel en handmatige sessielogger (hardlopen, fietsen, roeien, wandelen, zwemmen, crosstrainer met afstand, duur, hartslag en MET-calorieën).

---

### Stap 19-20 / Prompt 17 — Cardio: Activiteitstypen, Datamodel & Handmatige Logger (`[x] KLAAR`)
- **Doel & Bereik:**
  - Volledige cardio-module realiseren met ondersteuning voor 7 duursportactiviteiten (hardlopen, fietsen, roeien, wandelen, zwemmen, crosstrainer, overig).
  - Canonieke data-opslag (meters voor afstand, seconden voor duur) in IndexedDB conform clean architecture principes.
  - Wetenschappelijk gevalideerde domeinberekeningen voor tempo (min/km, roeien 500m split, zwemmen 100m tempo, km/u), MET-calorieën schaling met snelheid en lichaamsgewicht, en fysiologische Gellish hartslagzones (Zone 1 t/m Zone 5).
  - Handmatige sessielogger modal met live berekeningspreview tijdens invoer, sportfilterbalk, interactieve sessiekaarten met bewerk- en verwijderflows, en statistiekentab.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlaag (`src/domain/cardio/`):**
    - `types.ts`: Typen voor `CardioActivityType`, `PaceCalculationResult`, `HeartRateZone`, en `ActivityMetadata`.
    - `calculations.ts`:
      - `calculatePace(distanceMeters, durationSeconds, activityType)`: Berekent tempo in min/km, snelheid in km/u, alsmede sportspecifieke metrieken zoals de roeier 500m split (`min:ss /500m`) en zwemtempo (`min:ss /100m`). Veilige afhandeling van 0 afstand of duur zonder `NaN` of deling door nul.
      - `getMetValue(activityType, speedKmH)`: Dynamische MET-toewijzing conform het *Compendium of Physical Activities (Ainsworth et al.)* geschaald op basis van gemeten snelheid en intensiteit.
      - `calculateCalories({ activityType, durationSeconds, distanceMeters, userWeightKg })`: Berekent het actuele calorieverbruik. Gebruikt het profielgewicht van de gebruiker (indien beschikbaar) of valt transparant terug op 75 kg standaard met duidelijke vermelding (`isDefaultWeight`).
      - `calculateHeartRateZones({ age, maxHeartRateBpm })`: Berekent Zone 1 t/m Zone 5 via de Gellish-formule (`HRmax = 207 - 0,7 * leeftijd`) of een expliciet ingestelde maximale hartslag.
      - `getHeartRateZoneForBpm(bpm, zones)`: Koppelt een gemiddelde hartslag direct aan de bijbehorende fysiologische trainingszone met kleuraccent en fysiologische omschrijving.
      - `getActivityMetadata(type)` / `CARDIO_ACTIVITIES`: Definieert Nederlandse labels, icoonnamen, standaard afstands-eenheid (km vs m) en primaire prestatiemetriek.
    - `calculations.test.ts`: 15 pure Vitest domeintests voor tempo, roeiersplits, zwemtempo's, MET-snelheidsschaling, gewichtsgebaseerde calorieën en Gellish zones.
  - **Database & Schema:**
    - `src/types/database.ts`: `CardioActivityType` geëxporteerd; `CardioSession` uitgebreid met optionele `cadenceRpm`, `status` ("gepland" | "actief" | "afgerond" | "geannuleerd"), en `updatedAt`.
    - `src/lib/db/schema.ts`: `CardioActivityTypeSchema` en `CardioSessionSchema` bijgewerkt met Zod runtime validatie en veilige grenzen.
    - `src/lib/db/repositories/cardio.repository.ts`: Uitgebreid met `getAllSessionsSorted()` (nieuwste datum/tijd eerst), `getFilteredSessions()`, en `getSummaryStats()` (totale meters, seconden, calorieën, en telling/volume per activiteitstype).
  - **Gebruikersinterface (`src/components/modules/cardio/`):**
    - `CardioSessionCard.tsx`: Rijke sessiekaart met sport-icoon, datum/tijd, afstand (km of m), duur, primair tempo/snelheid, calorieën, hartslag + zonebadge (bijv. "Z2 Duurbasis"), RPE badge, cadans/hoogtemeters, notities, bewerkknop en veilige verwijderdialoog (`Dialog`).
    - `CardioFilterBar.tsx`: Horizontale filterbalk met chips per sport ("Alle", "Hardlopen", "Fietsen", etc.) inclusief live tellers per categorie.
    - `CardioSessionModal.tsx`: Responsieve modal voor het toevoegen en bewerken van sessies:
      - Sportselector met visuele keuzekaarten.
      - Afstandsinvoer met dynamische eenheidschakelaar ("Kilometers" vs "Meters").
      - Duurinvoer met gescheiden minuten en seconden velden.
      - Datumkiezer en starttijd.
      - Optionele hartslag (gemiddeld + max), RPE-slider (1-10) met duidelijke tekstlabels, hoogtemeters en cadans.
      - **Live Previewstrook:** Toont realtime het berekende tempo, gemiddelde snelheid, geschat calorieverbruik (met vermelding van gebruikt gewicht) en hartslagzone terwijl de gebruiker typt.
    - `CardioStatsTab.tsx`: 4 cockpitkaarten (Totale Afstand, Tijd in beweging, Calorieën, Aantal sessies), uitsplitsing per sport met gemiddelde snelheden, en een transparantiekader met verantwoording van MET-formules en hartslagberekeningen.
  - **Applicatie-integratie (`src/app/cardio/page.tsx`):**
    - Volledig herbouwd met reactieve databasekoppeling, profielkoppeling (`userWeightKg`, `userAge`), actieve filtering per sport, lege staat met actieknop, en bewerk-/verwijderfunctionaliteit.
  - **Integratietests (`tests/cardioIntegration.test.ts`):**
    - 6 integratietests met Dexie en `fake-indexeddb` voor: canonieke opslag, Zod runtime validatie, 7 activiteitstypen, chronologische sortering, samenvattingsstatistieken met uitsluiting van geannuleerde sessies, en updates/verwijderingen.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **250 van de 250 tests geslaagd** over 25 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
- **Beperkingen & Notities:**
  - Calorieën worden berekend via het Compendium of Physical Activities (Ainsworth MET-formules); als profielgewicht ontbreekt, wordt 75 kg gehanteerd en transparant vermeld in de UI.
  - Geannuleerde sessies worden conform AGENTS.md bewaard maar automatisch uitgesloten van de prestatie- en kilometerstatistieken.
- **Volgende Stap:**
  - Prompt 18 / Stap 21: Cardio: Live Tracker & Stopwatch (live timer met pauze/hervat, tussentijdse splits en live statistieken).

---

### Stap 21-22 / Prompt 18 — Cardio: Live Tracker, Stopwatch & Berekeningen (`[x] KLAAR`)
- **Doel & Bereik:**
  - Realtime cardio stopwatch en live tracker realiseren voor trainingen (lopen, fietsen, roeien, etc.).
  - Timestamp-gebaseerde tijdregistratie (`Date.now()`) met absolute immuniteit voor tab-switches, achtergrondgebruik en `setInterval`-vertragingen.
  - Tussentijdse splits/rondes (laps) registreren met automatische berekening van de tussentijdse splitpace en rondeduur.
  - Live ergonomische interface met grote sportschoolklok, snelle afstandsknoppen (+100m, +250m, +500m, +1km), actieve banner bij navigatie, afrondingsflow met automatische Dexie-persistentie en veilige afbreekopties.
- **Geïmplementeerde Wijzigingen:**
  - **Live Tracker Domein (`src/domain/cardio/liveTracker.ts`):**
    - `startLiveTracker(activityType, nowMs, customId)`: Initialiseert live sessie met stabiele UUID en timestamps.
    - `getLiveElapsedSeconds(state, nowMs)`: Berekent de werkelijk verstreken seconden op basis van wall-clock timestamps en bevroren pauze-accumulatie.
    - `pauseLiveTracker(state, nowMs)` & `resumeLiveTracker(state, nowMs)`: Pauzeert en hervat zonder tijdverlies of sprongen.
    - `addLapSplit(state, nowMs)`: Registreert een ronde/split met rondeduur, cumulatieve tijd, rondenafstand en sportspecifiek split-tempo (bijv. 500m split voor roeien, min/km voor lopen).
    - `updateLiveDistance(state, distanceMeters)`: Werkt de tussentijdse afstand bij.
    - `formatLiveTimer(seconds)`: Formatteert seconden naar ergonomische leesbare tijd (`MM:SS` of `HH:MM:SS`).
    - `saveLiveTrackerToStorage()`, `loadLiveTrackerFromStorage()`, `clearLiveTrackerFromStorage()`: Volledige persistentie via localStorage (met veilige in-memory fallback voor SSR en testen).
    - `liveTracker.test.ts`: 6 pure domeintests voor initiatie, wall-clock nauwkeurigheid, meerdere pauzeer/hervat cycli, rondecalculaties en timerformatering.
  - **Gebruikersinterface Components (`src/components/modules/cardio/`):**
    - `StartLiveCardioDialog.tsx`: Sportselector met visuele kaarten om direct een stopwatch voor de gewenste duursport te starten.
    - `LiveCardioTrackerModal.tsx`:
      - Grote digitale sportklok met hoog contrast voor gebruik in de sportschool of buiten.
      - Live statistiekenstrook (afstand, live tempo/snelheid, geschat calorieverbruik).
      - Snelle afstands-increment knoppen (+100m, +250m, +500m, +1.0km) en directe decimale kilometerinvoer.
      - Extra grote touch-knoppen (minimaal 52px touch target) voor Pauzeren/Hervatten en Ronde/Split.
      - Rondes & Tussentijden overzichtslijst (nieuwste ronde bovenaan) met splitpace en tussentijden.
      - Haptische feedback (HTML5 vibration API) bij knopdrukken.
    - `ActiveCardioBanner.tsx`:
      - Prominente actieve banner bovenaan de pagina met sport-icoon, live lopende klok, afstand en rondeteller.
      - Knoppen voor "Hervatten/Pauzeren", "Openen" en "Afronden".
    - `FinishLiveCardioDialog.tsx`:
      - Afrondscherm met vooraf ingevulde verstreken tijd, berekend tempo, snelheid en calorieverbruik.
      - Optionele registratie van hartslag (gemiddeld/max), RPE-inspanningsscore (1-10 slider), hoogtemeters, cadans en notities.
      - Opslaan naar Dexie IndexedDB met `status: "afgerond"`.
    - `DiscardLiveCardioDialog.tsx`:
      - Veilige afbreekdialoog met 2 keuzes: "Wissen & Verwerpen" (geen databasevervuiling) of "Opslaan als geannuleerd" (status `geannuleerd` conform AGENTS.md data-integriteit).
  - **Integratie in [`src/app/cardio/page.tsx`](file:///c:/Users/Gameb/OneDrive%20-%20Stichting%20Hogeschool%20Utrecht/Jaar%204/Periode%20A&B/Minor_Future-proof_met_AI/Side%20Project/Fitnes app/src/app/cardio/page.tsx):**
    - Volledige integratie van de live tracker flows, actieve banner, startknop in de header en automatische synchronisatie met IndexedDB.
  - **Integratietests (`tests/cardioLiveTrackerIntegration.test.ts`):**
    - 3 integratietests voor: opslag en herstel via storage, voltooien en persistent opslaan in Dexie, en afbreken als geannuleerd met uitsluiting van volume-statistieken.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **259 van de 259 tests geslaagd** over 27 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
- **Volgende Stap:**
  - Prompt 19 / Stap 23-24: Cardio Historiek, Periode-statistieken & Pace/Hartslaggrafieken (Recharts/SVG grafieken voor tempo- en hartslagverloop over tijd, week- en maandtotalen per activiteitstype).

---

### Stap 23-24 / Prompt 19 — Cardio: Historiek, Periode-statistieken & Grafieken (`[x] KLAAR`)
- **Doel & Bereik:**
  - Cardio geschiedenis uitbreiden met interactieve periode-filters (7d, 30d, 90d, 1j, alles) en dynamische sportfiltering.
  - Tijd-aggregatie (buckets) berekenen voor dag-, week- en maandtotalen (afstand, tijd, calorieën, gemiddelde snelheid).
  - Pure SVG grafieken implementeren voor:
    - Afstand en volume per periode (interactieve Bar Chart met hover tooltips en sport-uitsplitsing).
    - Tempo- en snelheidsverloop over tijd (interactieve Line Chart met atletische omkering voor hardlopen/wandelen: snellere pace hoger weergegeven).
    - Hartslagzoneverdeling over de 5 fysiologische Gellish-zones (Zone 1 t/m 5) met progressiebalken en percentages.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/cardio/statistics.ts`):**
    - `filterSessionsByPeriod(sessions, period, referenceDateStr)`: Filtert sessies op 7d, 30d, 90d, 1j of alles; sluit conform AGENTS.md automatisch geannuleerde sessies uit.
    - `groupSessionsByBucket(sessions, period)`: Groepeert sessies per dag (bij 7d), week (bij 30d/90d) of maand (bij 1j/alles). Aggregeert meters, seconden, calorieën, sessietelling en uitsplitsing per sport.
    - `calculatePaceTrend(sessions, activityType)`: Extraheert chronologische tempo- en snelheidspunten met sportspecifieke metric formatting (min/km voor hardlopen/wandelen, km/u voor fietsen/crosstrainer, 500m split voor roeien, 100m pace voor zwemmen).
    - `calculateHeartRateDistribution(sessions, userAge)`: Berekent de fysiologische zoneverdeling (Z1 Herstel t/m Z5 Maximaal) op basis van de Gellish-leeftijdsformule.
    - `src/domain/cardio/statistics.test.ts`: 6 pure domeintests voor periodefiltering, aggregatie in buckets, pace trends en hartslagzones (100% geslaagd).
  - **Gebruikersinterface (`src/components/modules/cardio/CardioHistoryCharts.tsx`):**
    - Periode-knoppen (`7d`, `30d`, `90d`, `1j`, `Alles`) en sport-selector chips.
    - Periode-samenvattingsstrook met totale kilometers, trainingsuren, calorieën en aantal sessies.
    - `SvgCardioBarChart`: Responsieve SVG staafdiagram met dynamische Y-as schaling, afgeronde staven, interactieve selectie/hover en gedetailleerde tooltip met verantwoorde uitsplitsing per sport.
    - `SvgPaceTrendChart`: Responsieve SVG lijndiagram met vloeiende polyline, datapunten met grote touch hitzones (18px), en atletische Y-as omkering voor hardloopsessies.
    - Hartslagzone distributiekaart met kleurgecodeerde balken (emerald, sky, amber, orange, rose), zone-uitleg en percentages.
  - **Tab & Pagina Integratie:**
    - `src/components/modules/cardio/CardioStatsTab.tsx`: `CardioHistoryCharts` geïntegreerd inclusief doorgifte van `userAge`.
    - `src/app/cardio/page.tsx`: Gekoppeld aan het profiel (`userAge`, `userWeightKg`) en reactieve IndexedDB updates.
  - **Integratietests (`tests/cardioStatisticsIntegration.test.ts`):**
    - Dexie integratietest met `fake-indexeddb` die volledige end-to-end opslag, Zod UUID validatie, chronologische sortering, periodefiltering, bucketaggregatie, pace trends en zoneverdeling valideert.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **266 van de 266 tests geslaagd** over 29 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
- **Beperkingen & Notities:**
  - Pure SVG visualisaties zijn gebruikt i.p.v. externe zware bibliotheken om volledige React 19 compatibiliteit, SSR-veiligheid en nul hydratatie-mismatches te garanderen.
  - OneDrive bestandsintegriteit is gecontroleerd en geverifieerd (0-byte detectie en herstel).
- **Volgende Stap:**
  - **Module 4: Voeding & Hydratatie (Stap 25 / Prompt 20)**: Voedingsmiddelen & Recepten Database (lokale database met kcal, eiwit, koolhydraat, vet, vezels per 100g, Dexie tabellen, Zod schema's en CRUD beheer).

---

### Stap 25 / Prompt 20 — Voeding: Voedingsmiddelen & Recepten Database (`[x] KLAAR`)
- **Doel & Bereik:**
  - Robuuste lokale voedingsmiddelenbibliotheek in Dexie IndexedDB met macronutriënten en vezels per 100 gram.
  - Standaardassortiment van 40+ herkenbare Nederlandse basisvoedingsmiddelen (havermout, kwark, kipfilet, eieren, zalm, zilvervliesrijst, volkorenbrood, etc.) conform officiële NEVO/USDA voedingswaarden.
  - Samengestelde maaltijden en recepten (`Recipe`) datamodel met ingrediëntenkoppeling, portieberekening en automatische macro-aggregaties (totaal, per portie en per 100g).
  - Volledige CRUD-flows voor eigen producten en recepten met Zod-validatie, favoriet-toggles, categorie-filters en Atwater-energieverhoudingsbalken.
- **Geïmplementeerde Wijzigingen:**
  - **Datamodel & Migraties (`src/types/database.ts` & `src/lib/db/dexie.ts` & `src/lib/db/schema.ts`):**
    - `FoodCategory`: 11 categorieën (`vlees_vis_ei`, `zuivel`, `granen_brood`, `groente_fruit`, `peulvruchten`, `noten_zaden`, `oliën_sauzen`, `dranken`, `supplementen`, `snacks_zoet`, `overig`).
    - `FoodItem`: Uitgebreid met optionele `category` (default `overig`), `isFavorite` (default `false`), en `updatedAt`.
    - `Recipe` & `RecipeIngredient`: Nieuwe entiteit voor samengestelde recepten met porties, ingrediëntenlijst en berekende waarden (totaal, per portie en per 100g).
    - `SportKompasDatabase`: Versie 5 migratie toegevoegd met `recipes`-tabel en upgrade-functie voor bestaande records zonder dataverlies.
  - **Domeinlogica (`src/domain/nutrition/`):**
    - `defaultFoods.ts`: 40+ gevalideerde Nederlandse basisvoedingsmiddelen met standaard portiegroottes.
    - `calculations.ts`:
      - `calculateNutritionForPortion(foodItem, grams)`: Exacte portiecalculaties afgerond op hele calorieën en 1 decimaal voor macro's.
      - `calculateRecipeTotals(ingredients, portions)`: Berekening van totaal gewicht, totale macro's, per portie en per 100g.
      - `calculateMacroDistribution(protein, carbs, fat)`: Atwater-factoren (4-4-9 kcal/g) en 100% sluitende energiepercentages.
      - `filterFoods` & `filterRecipes`: Zoeken op naam/merk/ingrediënten, categorieën en favorieten-eerst sortering.
    - `calculations.test.ts`: 9 gerichte unit tests (100% geslaagd).
  - **Repository Laag (`src/lib/db/repositories/nutrition.repository.ts`):**
    - Uitgebreid met `recipes: BaseRepository<Recipe>`.
    - `ensureDefaultFoods()`: Idempotente seeding van het standaardassortiment.
    - `searchFoods`, `toggleFavoriteFood`, `deleteCustomFood` (met bescherming van systeembedragen), `searchRecipes`, `toggleFavoriteRecipe`, `deleteRecipe`.
  - **Gebruikersinterface (`src/components/modules/nutrition/` & `src/app/voeding/page.tsx`):**
    - `FoodItemCard.tsx`: Weergave van categoriebadge, herkomst (standaard vs eigen), favorietster, macro-ribbon per 100g, standaard portie en bewerk/verwijder acties.
    - `FoodItemModal.tsx`: Dialoogvenster met invoervelden, portiekeuze en live macro-ratio previewbalk.
    - `RecipeCard.tsx`: Weergave van recept met porties, schakelaar tussen "Per portie" en "Per 100g", uitklapbare ingrediëntenlijst en CRUD-acties.
    - `RecipeModal.tsx`: Samensteller met ingrediëntzoeker, grammen-invoer en realtime recepttotaal.
    - `FoodDatabaseView.tsx`: Centrale bibliotheekweergave met subtabs, zoekbalk, categoriefilters en favorietenselectie.
    - `src/app/voeding/page.tsx`: Vernieuwd met hoofdtabbladen "Dagboek & Loggen" en "Voedingsdatabase & Recepten".
  - **Integratietests (`tests/nutritionDatabaseIntegration.test.ts` & `tests/database.test.ts`):**
    - 4 integratietests voor Dexie persistence, standaard seeding, custom beheer, favorieten en receptcalculaties.
    - Databasemigratietest geactualiseerd voor Versie 5.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **279 van de 279 tests geslaagd** over 31 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
- **Beperkingen & Notities:**
  - Systeemvoedingsmiddelen hebben `isCustom: false` en kunnen conform de integriteitsregels niet door de gebruiker worden gewist; eigen producten kunnen wel te allen tijde worden bewerkt of gewist.
- **Volgende Stap:**
  - **Stap 26 / Prompt 21**: Voeding: Dagelijks Voedingsdagboek (geavanceerde datumkiezer, dagelijkse maaltijdindeling ontbijt/lunch/diner/snacks, dagtotalen en historische navigatie).

---

### Stap 26 / Prompt 21 — Voeding: Dagelijks Voedingsdagboek (`[x] KLAAR`)
- **Doel & Bereik:**
  - Implementatie van het dagelijks voedingsdagboek met 4 vaste maaltijdmomenten (Ontbijt, Lunch, Diner, Snacks) en waterinname.
  - Datumkiezer met historische kalendernavigatie (vorige dag, volgende dag, vandaag, en datumkiezer via HTML5 date picker).
  - Volledige persistentie van maaltijden (`MealLog`), individuele items (`MealItemEntry`) en waterlogs (`WaterLog`) in Dexie IndexedDB.
  - Pure domeinlogica voor dagtotalen, macro-ratio's en subtotalen per maaltijdmoment, 100% losgekoppeld van de UI.
  - Ergonomische dialoogvensters voor het toevoegen van producten/recepten met automatische portiecalculatie en het bewerken van porties.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/nutrition/diary.ts` & `src/domain/nutrition/diary.test.ts`):**
    - `calculateDailyTotals(mealLogs, waterLogs)`: Berekent exacte dagsommen voor calorieën, eiwitten, koolhydraten, vetten, vezels en waterinname.
    - `groupLogsByMealType(logs)`: Groepeert en aggregeert logs en subtotalen per maaltijdtype (`ontbijt`, `lunch`, `diner`, `snacks`).
    - `createMealLogFromItem(calendarDate, mealType, item)`: Creëert een nieuw gestructureerd maaltijdrecord.
    - `recalculateMealLogTotals(items)`: Herrekent subtotalen van een maaltijd na wijziging of verwijdering van een item.
    - `diary.test.ts`: 4 unit tests (100% geslaagd).
  - **Repository Uitbreidingen (`src/lib/db/repositories/nutrition.repository.ts`):**
    - `addItemToMeal(calendarDate, mealType, item)`: Voegt een item toe aan een bestaande maaltijdlog van die dag of creëert direct een nieuw record.
    - `updateItemInMeal(mealLogId, itemIndex, updatedItem)`: Past een specifiek maaltijditem aan en herrekent direct de macro-totalen.
    - `deleteItemFromMeal(mealLogId, itemIndex)`: Verwijdert een item of wist de maaltijdlog als deze leeg is.
    - `resetWaterByDate(calendarDate)`: Wist alle waterlogs voor de geselecteerde datum.
  - **Gebruikersinterface (`src/components/modules/nutrition/` & `src/app/voeding/page.tsx`):**
    - `DailyNutritionHeader.tsx`: Datumkiezer met Vorige/Volgende/Vandaag navigatie, 5 overzichtskaarten (Kcal, Eiwit, Koolhydraten, Vet, Vezels) en een Atwater energieverdelingsbalk met percentage-labels.
    - `DailyWaterWidget.tsx`: Interactieve hydratatie-kaart met progressiebalk naar dagdoel (standaard 2500 ml), sneltoetsen (+250 ml glas, +500 ml fles) en herstelknop.
    - `MealSectionCard.tsx`: Modulaire kaart per maaltijdmoment met subtotalen, opsomming van genuttigde items met grammen en macro's, bewerk- en verwijderknoppen en toevoegknop.
    - `AddMealItemDialog.tsx`: Modal met tabbladen voor "Zoeken in database & recepten" (met realtime portie-preview) en "Snelle handmatige invoer" voor directe calorieën/macro's.
    - `EditMealItemDialog.tsx`: Modal om portiegrootte in grammen aan te passen met dynamische herberekening.
    - `DailyNutritionView.tsx`: Hoofdweergave die alle dagboekcomponenten en modals met Dexie hooks integreert.
    - `src/app/voeding/page.tsx`: Volledige integratie tussen "Dagboek & Loggen" en "Voedingsdatabase & Recepten".
  - **Integratietests (`tests/dailyNutritionDiaryIntegration.test.ts`):**
    - Dexie integratietests met `fake-indexeddb` die item toevoeging, maaltijdsamenvoeging, portie-updates, verwijderingen en waterregistratie per datum valideren.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **286 van de 286 tests geslaagd** over 33 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole uitgevoerd en geverifieerd (0 lege bestanden).
- **Beperkingen & Notities:**
  - Water- en maaltijdlogs zijn strikt geïsoleerd per kalenderdatum (`YYYY-MM-DD`).
- **Volgende Stap:**
  - **Stap 27 / Prompt 22**: Voeding: Maaltijdlogger & Snelle Invoer (snelknoppen voor favorieten, lijst met recent gelogde producten, kopiëren van maaltijden van eerdere dagen en maaltijdsjablonen).

---

### Stap 27 / Prompt 22 — Voeding: Maaltijdlogger & Snelle Invoer (`[x] KLAAR`)
- **Doel & Bereik:**
  - Snelle en wrijvingsloze maaltijdregistratie via recente items, favorieten en slimme portieknoppen.
  - Mogelijkheid om eerdere maaltijden of een complete dag van gisteren direct naar vandaag te kopiëren zonder handmatig overtikken.
  - Opslaan van een samengestelde maaltijd als een herbruikbaar recept (`Recipe`) in de bibliotheek met automatische macro-calculatie.
  - Uitgebreide dialoog met 4 gerichte tabs: Recent, Favorieten, Database & Handmatig.
  - Snelle portie-presets (bijv. ½ portie, 1 portie, 1½ portie, 2 porties, 100g, 200g) voor directe aanpassing met één tik.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/nutrition/quickLog.ts` & `src/domain/nutrition/quickLog.test.ts`):**
    - `extractRecentMealItems(logs, limit)`: Haalt unieke items op uit recente `MealLog` records, ontdubbelt op product-ID/naam, berekent gebruiksfrequentie (`timesLogged`), onthoudt de laatst gekozen portiegrootte en sorteert chronologisch aflopend.
    - `createRecipeFromMealLog(mealLog, recipeName, portions)`: Converteert een gelogde maaltijd met al zijn items naar een formeel `Recipe` object met automatische aggregatie van gewicht, calorieën en macro's (totaal, per portie en per 100g).
    - `getQuickPortionOptions(defaultPortionGrams)`: Genereert handige snelknoppen (½ portie, 1 portie, 1½ portie, 2 porties, plus standaardgrammen 50g, 100g, 150g, 200g).
    - `duplicateMealItems(items)`: Veilige kloning van item-records zonder neveneffecten.
    - `quickLog.test.ts`: 4 pure unit tests (100% geslaagd).
  - **Repository Uitbreidingen (`src/lib/db/repositories/nutrition.repository.ts`):**
    - `getRecentMealItems(limit)`: Haalt maaltijdlogs op en levert dedupliceerde recente items.
    - `copyMealFromDate(sourceDate, targetDate, mealType)`: Kopieert alle items van een specifiek maaltijdmoment van dag A naar dag B.
    - `copyAllMealsFromDate(sourceDate, targetDate)`: Kopieert alle geregistreerde maaltijden van een bronkalenderdag naar de doeldatum en retourneert het aantal gekopieerde items.
    - `saveMealAsRecipe(mealLogId, recipeName, portions)`: Transformeert een bestaande maaltijdlog naar een recept en persisteert dit in IndexedDB `recipes`.
  - **Gebruikersinterface (`src/components/modules/nutrition/` & `src/app/voeding/page.tsx`):**
    - `AddMealItemDialog.tsx`: Geüpgraded met 4 tabs (Recent met gebruiksbadges, Favorieten gemarkeerd met ster, Database met zoekfunctie, Handmatig voor snelle macro-invoer) en dynamische snelknoppen voor porties (touch-targets >= 44px).
    - `SaveMealAsRecipeDialog.tsx`: Nieuw dialoogvenster om een geregistreerde maaltijd om te dopen tot een herbruikbaar recept inclusief ingrediëntenoverzicht en portiekeuze.
    - `MealSectionCard.tsx`: Toegevoegde actieknoppen voor "Van gisteren" (kopieer specifiek dit maaltijdmoment) en "Als Recept" (sla maaltijd op in receptenbibliotheek).
    - `DailyNutritionHeader.tsx`: Nieuwe knop "Kopieer gisteren" voor het dupliceren van een complete eetdag met één klik.
    - `DailyNutritionView.tsx`: Volledige orchestratie van recente items, kopieeracties en receptcreatie-modals.
    - `src/app/voeding/page.tsx`: Reactive state voor `recentItems` die automatisch wordt bijgewerkt na elke maaltijd-, kopieer- of bewerkactie.
  - **Integratietests (`tests/nutritionQuickLogIntegration.test.ts`):**
    - 4 integratietests met Dexie en `fake-indexeddb` die recente items ophalen, individuele maaltijdkopieën, complete dagkopieën en maaltijd-naar-recept conversie valideren.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **294 van de 294 tests geslaagd** over 35 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole uitgevoerd en geverifieerd (0 lege bestanden).
- **Beperkingen & Notities:**
  - Gekopieerde items worden als onafhankelijke nieuwe entries gelogd op de doeldatum, zodat latere bewerkingen geen invloed hebben op de historische brondatum.
- **Volgende Stap:**
  - **Stap 28 / Prompt 23**: Voeding: Voedingsdoelen & Caloriebalans (koppeling met gebruikersprofiel BMR/TDEE, dynamische berekening van calorie- en macro-doelen, resterend budget en visuele voortgangsindicatoren).

---

### Stap 28 / Prompt 23 — Voeding: Voedingsdoelen & Caloriebalans (`[x] KLAAR`)
- **Doel & Bereik:**
  - Dynamische berekening en instelling van dagelijkse calorie- en macronutriëntendoelen gekoppeld aan het gebruikersprofiel (BMR en TDEE).
  - Ondersteuning voor 6 wetenschappelijk onderbouwde voedingsstrategieën (afvallen rustig/standaard/agressief, onderhoud, lean bulk, bulken) plus vrije handmatige invoer, met een veilige ondergrens van 1200 kcal om crashdiëten te voorkomen.
  - 5 macroverdelingsprofielen: Gebalanceerd (30/40/30), Eiwitrijk (35/40/25), Koolhydraatarm (35/20/45), Krachtsport per kg (2.0g eiwit / 1.0g vet per kg lichaamsgewicht, rest koolhydraten), en Aangepast.
  - Calorie- en macrobalans cockpit (`NutritionBudgetCard`): real-time berekening van geconsumeerd vs. doel vs. resterend budget, overschrijdingsdetectie en 4 visuele voortgangsbalken (Eiwit, Koolhydraten, Vetten, Vezels).
  - Ergonomische instelmodal (`NutritionGoalsModal`) met live BMR/TDEE weergave, selectievakken en directe preview.
  - Persistentie in `AppSettings` binnen Dexie IndexedDB zonder dataverlies.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/nutrition/goals.ts` & `src/domain/nutrition/goals.test.ts`):**
    - `calculateBmr(gender, weightKg, heightCm, ageYears, formulaPreference, bodyFatPercentage)`: Ondersteuning voor zowel Mifflin-St Jeor als Katch-McArdle (LBM gebaseerd).
    - `calculateTdee(bmr, activityLevel)`: Multipliers van 1.2 (sedentair) tot 1.725 (zeer actief).
    - `calculateStrategyCalories(tdee, strategy, customCalories)`: Calorie-aanpassingen van -750 kcal tot +500 kcal met harde minimale veiligheidsgrens (1200 kcal).
    - `calculateMacroTargets(targetCalories, split, weightKg, custom)`: Exacte verdeling in grammen en kcal via Atwater-factoren (4-4-9), inclusief gezonde vezelnorm (~14g/1000 kcal) en waterinname (~35ml/kg).
    - `calculateNutritionProgress(targets, consumed, waterMl)`: Berekening van percentages, resterende grammen/kcal en status (`onder`, `doel_bereikt`, `overschreden`).
    - `goals.test.ts`: 7 gerichte unit tests (100% geslaagd).
  - **Datamodel & Repositories (`src/types/database.ts`, `src/lib/db/schema.ts`, `src/lib/db/repositories/settings.repository.ts`):**
    - `AppSettings` uitgebreid met optionele voedingsdoelen (`nutritionGoalStrategy`, `nutritionTargetCalories`, `nutritionTargetProteinGrams`, `nutritionTargetCarbsGrams`, `nutritionTargetFatGrams`, `nutritionTargetFiberGrams`, `nutritionTargetWaterMl`, `nutritionMacroSplit`).
    - `SettingsRepository`: `getNutritionTargets(profile)` (met automatische fallback naar profiel BMR/TDEE of `DEFAULT_NUTRITION_TARGETS`) en `updateNutritionTargets(targets)`.
  - **Gebruikersinterface (`src/components/modules/nutrition/` & `src/app/voeding/page.tsx`):**
    - `NutritionBudgetCard.tsx`: Cockpitkaart met caloriebalans (doel, inname, resterend met dynamische kleurcodering) en afzonderlijke voortgangsbalken voor Eiwit, Koolhydraten, Vetten en Vezels.
    - `NutritionGoalsModal.tsx`: Dialoog met actuele BMR/TDEE metabolisme-indicatie, keuzemenu voor doelstrategie en macro-split, optionele vrije invoervelden en realtime berekende doelpreview.
    - `DailyNutritionView.tsx`: Volledige integratie van `NutritionBudgetCard` en `NutritionGoalsModal` met reactieve macro-calculaties.
    - `src/app/voeding/page.tsx`: Laden van profiel en instellingen, en live opslag van aangepaste doelstellingen.
  - **Integratietests (`tests/nutritionGoalsIntegration.test.ts`):**
    - 4 integratietests met Dexie en `fake-indexeddb` die standaarddoelen, profielgebaseerde BMR/TDEE calculaties, custom target persistentie en budget/resterend berekeningen valideren.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **305 van de 305 tests geslaagd** over 37 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole uitgevoerd en geverifieerd (0 lege bestanden).
- **Beperkingen & Notities:**
  - Voedingsdoelen worden bewaard in `AppSettings` en zijn direct gekoppeld aan de dagelijkse weergave; als een profiel ontbreekt, worden veilige standaardwaarden (2200 kcal) gehanteerd.
- **Volgende Stap:**
  - **Stap 29 / Prompt 24**: Voeding: Maaltijdplanner & Weekplanning (weekkalender voor maaltijdplanning, voorbereiden/meal prep overzichten, maaltijden als genuttigd markeren en overzetten naar dagboek).

---

### Stap 29 / Prompt 24 — Voeding: Maaltijdplanner & Weekplanning (`[x] KLAAR`)
- **Doel & Bereik:**
  - Weekoverzicht met 7 kalenderdagen (maandag t/m zondag) voor het proactief inplannen van maaltijden per moment (Ontbijt, Lunch, Diner, Snacks).
  - Volledige Dexie IndexedDB versie 6 migratie met de nieuwe store `plannedMeals` en runtime Zod validatie via `PlannedMealSchema`.
  - Inplannen vanuit bestaande recepten (inclusief automatische ingrediënt- en macro-schaling naar aantal porties) of losse voedingsproducten met custom notities voor meal prep.
  - Aggregatie van ingrediënten over de gehele week tot een overzichtelijke boodschappen- en meal prep checklist (`MealPrepListModal`), inclusief klembord-kopieerfunctie voor eenvoudig delen of meenemen naar de supermarkt.
  - "Markeer als genuttigd" actie: zet de geplande maaltijdstatus op `genuttigd`, logt alle ingrediënten automatisch in het actieve voedingsdagboek (`MealLog`) en koppelt het aangemaakte log-ID.
  - Dag-kopieerfunctionaliteit (`copyPlannedMealsToDate`): dupliceer maaltijden van een dag snel naar een andere dag in de week.
- **Geïmplementeerde Wijzigingen:**
  - **Datamodel & Migraties (`src/types/database.ts`, `src/lib/db/schema.ts`, `src/lib/db/dexie.ts`):**
    - `PlannedMeal` en `PlannedMealStatus` (`"gepland" | "genuttigd" | "overgeslagen"`) gedefinieerd in `src/types/database.ts`.
    - `PlannedMealSchema` en `PlannedMealStatusSchema` met Zod runtime-validatie in `src/lib/db/schema.ts`.
    - Versie 6 migratie in `SportKompasDatabase` (`src/lib/db/dexie.ts`) met samengestelde indexen (`[calendarDate+status]`, `calendarDate`, `mealType`, `status`).
  - **Domeinlogica (`src/domain/nutrition/planning.ts` & `src/domain/nutrition/planning.test.ts`):**
    - `groupPlannedMealsByDate`: Groepeert maaltijden per datum en sorteert chronologisch op maaltijdmoment.
    - `groupPlannedMealsByMealType`: Filtert en groepeert maaltijden per type (ontbijt, lunch, diner, snacks).
    - `calculatePlannedDailyTotals`: Berekent de geplande dagtotalen van calorieën, eiwitten, koolhydraten, vetten en vezels.
    - `aggregateWeeklyMealPrepIngredients`: Aggregeert ingrediënten en gewichten over alle actieve geplande maaltijden voor de week tot een unieke boodschappenlijst met geschatte calorieën en eiwitten.
    - `calculateWeeklyPlanningSummary`: Berekent weektotalen voor geplande maaltijden, genuttigde maaltijden, calorieën en eiwit.
    - `planning.test.ts`: 5 gerichte unit tests (100% geslaagd).
  - **Repository Laag (`src/lib/db/repositories/nutrition.repository.ts` & `src/lib/db/index.ts`):**
    - `plannedMeals` BaseRepository gekoppeld in `NutritionRepository`.
    - `getPlannedMealsByDate(date)` & `getPlannedMealsForRange(startDate, endDate)`.
    - `planMeal(mealData)` & `updatePlannedMeal(id, updates)` & `deletePlannedMeal(id)`.
    - `markPlannedMealAsConsumed(id)`: Update status naar `genuttigd`, voegt items toe aan `MealLog` via `addItemToMeal` en slaat `consumedMealLogId` op.
    - `copyPlannedMealsToDate(sourceDate, targetDate)`: Dupliceert alle geplande maaltijden naar de doeldag.
  - **Gebruikersinterface (`src/components/modules/nutrition/` & `src/app/voeding/page.tsx`):**
    - `WeeklyMealPlannerView.tsx`: 7-daagse datum carrousel/strip, weeknavigatie (`<` / `>`), statusbadges, maaltijdkaarten per slot, dagtotalen vergeleken met gebruikersdoelen, en dagkopieerdialoog.
    - `PlanMealModal.tsx`: Dialoog met tabkeuze tussen Recepten (met automatische portieschaling) en Losse Producten (met portiecalculatie), maaltijdnaam, notities en macro-totalen.
    - `MealPrepListModal.tsx`: Boodschappen- en meal prep overzicht met interactieve afvinkvakjes, totale grammen en één-klik klembord-kopieerfunctie.
    - `src/app/voeding/page.tsx`: 3-tab layout geïntegreerd: Dagboek & Loggen, Weekplanning & Prep, Database & Recepten.
  - **Integratietests (`tests/nutritionPlanningIntegration.test.ts`):**
    - 4 integratietests met Dexie en `fake-indexeddb` die planning per datum en bereik, markeren als genuttigd met automatische `MealLog` logging, dupliceren naar andere dagen en ingrediëntenaggregatie testen.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **314 van de 314 tests geslaagd** over 39 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole uitgevoerd en geverifieerd (0 lege bestanden).
- **Beperkingen & Notities:**
  - Geplande maaltijden blijven persistent bewaard totdat de gebruiker ze verwijdert; genuttigde maaltijden worden visueel gemarkeerd en zijn direct terug te vinden in het dagelijkse voedingsdagboek.
- **Volgende Stap:**
  - **Stap 30 / Prompt 25**: Voeding: Streepjescodescanner & Externe Zoekfunctie (camera barcode scanning via BarcodeDetector / Html5Qrcode, Open Food Facts integratie met offline caching en fallback).

---

### Stap 30 / Prompt 25 — Voeding: Streepjescodescanner & Externe Zoekfunctie (`[x] KLAAR`)
- **Doel & Bereik:**
  - Snelle en accurate productherkenning door streepjescodes (EAN-13, EAN-8, UPC) te scannen via de camera of handmatig in te voeren.
  - Naadloze koppeling met de openbare Open Food Facts database met automatische extractie van Nederlandse/internationale productnamen, merken, portiegroottes, energie (kcal en kJ) en macronutriënten (eiwit, koolhydraten, vetten, vezels).
  - Offline-first architectuur conform Regel 8: producten die eenmaal zijn opgehaald of gescand, worden persistent opgeslagen in de lokale Dexie bibliotheek (`foodItems`), waardoor ze direct en permanent offline beschikbaar zijn.
  - Lokale lookup vóór netwerkaanroep: als een barcode al in de lokale database voorkomt, wordt deze direct geopend zonder onnodig netwerkverbruik.
  - Veilige camerabediening met native browser `BarcodeDetector` API, animatieve richtkruisen en scanlaser, haptische feedback (`navigator.vibrate`), camera-permissie foutafhandeling en universele handmatige barcode-invoer.
  - Uitgebreide online zoekfunctie (`ExternalFoodSearchDialog`) waarmee de gebruiker direct op merk of productnaam miljoenen producten kan doorzoeken en met één tik aan de lokale bibliotheek of maaltijd kan toevoegen.
- **Geïmplementeerde Wijzigingen:**
  - **Datamodel, Validatie & Migraties (`src/types/database.ts`, `src/lib/db/schema.ts`, `src/lib/db/dexie.ts`):**
    - `FoodItem` interface en `FoodItemSchema` uitgebreid met optioneel `barcode: string | null` veld.
    - `Provenance` en `ProvenanceSchema` uitgebreid met `"openfoodfacts"` en `"external"` bronidentificatie.
    - Dexie Database Versie 7 migratie gedefinieerd met geïndexeerd `barcode` veld op `foodItems` voor directe `.where("barcode").equals(code)` queries.
    - `tests/database.test.ts` bijgewerkt en geverifieerd voor versie 7.
  - **Domeinlogica (`src/domain/nutrition/openFoodFacts.ts` & `src/domain/nutrition/openFoodFacts.test.ts`):**
    - `mapOpenFoodFactsCategory`: Slimme mapping van meertalige categorietags (NL/EN/FR) naar canonieke `FoodCategory` (bijv. zuivel, granen_brood, dranken, snacks_zoet, vlees_vis_ei).
    - `parseOpenFoodFactsProduct`: Robuuste parser voor Open Food Facts JSON met fallback van kJ naar kcal (`kJ / 4.184`), portiegrootte parsing (`serving_size` / `serving_quantity`), afronding en defensieve validatie.
    - `convertExternalToFoodItem`: Vormt een extern product om naar het lokale `FoodItem` schema met `provenance: { source: "external" }`.
    - `fetchProductByBarcode` & `searchOpenFoodFacts`: Asynchrone fetchers met timeout-bewaking (`AbortController`), browser-safe headers en graceful foutafhandeling.
    - `openFoodFacts.test.ts`: 13 pure unit tests (100% geslaagd).
  - **Repository Laag (`src/lib/db/repositories/nutrition.repository.ts`):**
    - `getFoodByBarcode(barcode)`: Snelle lokale index-lookup.
    - `saveExternalFoodItem(external)`: Slaat extern product op in IndexedDB en voorkomt duplicaten indien de barcode al lokaal aanwezig is.
  - **Gebruikersinterface (`src/components/modules/nutrition/` & `src/app/voeding/page.tsx`):**
    - `BarcodeScannerDialog.tsx`: Viewfinder met richtkruis en scanlijn, statusbadges, haptische trilling, handmatig invoerveld en directe productpreview met voedingswaarden per 100g.
    - `ExternalFoodSearchDialog.tsx`: Online zoekvenster met realtime resultaten, merkvermelding, macro-overzicht en knoppen voor selectie of camera-doorverwijzing.
    - `FoodDatabaseView.tsx`: Voorzien van "Scan Barcode" en "Zoek Online" actieknoppen in de header met visuele feedbackbanner.
    - `AddMealItemDialog.tsx`: Voorzien van "Scan Barcode" snelknop in het zoekvak voor directe scanning tijdens het loggen van een maaltijd.
    - `src/app/voeding/page.tsx`: Volledige orchestratie van externe zoekopdrachten, barcode-resolutie en automatische verversing van de bibliotheek.
  - **Integratietests (`tests/nutritionBarcodeIntegration.test.ts`):**
    - 4 integratietests met Dexie en `fake-indexeddb` die lokale barcode lookup, externe productpersistentie, ontdubbeling van identieke barcodes en directe maaltijdlogging testen.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **331 van de 331 tests geslaagd** over 41 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole uitgevoerd en geverifieerd (0 lege bestanden).
- **Beperkingen & Notities:**
  - Barcode scanning via camera werkt via de native `BarcodeDetector` API van de browser; in browsers zonder native detector of camera wordt een direct bruikbaar invoerveld getoond waarin de cijfers onder de streepjescode kunnen worden ingetoetst.
- **Volgende Stap:**
  - **Stap 31 / Prompt 26**: Voeding: Voedingsgrafieken & Wekelijkse Balans (visualisatie van macronutriënt-verhoudingen en calorie-inname vs. verbruik over tijd via SVG grafieken, vezel- en hydratatiestatistieken).

---

### Stap 31 / Prompt 26 — Voeding: Voedingsgrafieken & Wekelijkse Balans (`[x] KLAAR`)
- **Doel & Bereik:**
  - Diepgaande visualisatie en historische trendanalyse van voedingsinname, macronutriënt-verhoudingen en wekelijkse energiebalans.
  - Pure SVG staafdiagrammen voor dagelijkse calorie-inname over instelbare tijdsperiodes (7 dagen, 14 dagen, 30 dagen, Deze Week, Deze Maand) met dynamische doellijn en kleurcodering (op doel binnen ±10%, boven doel, onder doel of geen data).
  - Optionele interactieve cardio-verbranding indicator per dag (netto calorieën = inname - cardioverbranding).
  - Macronutriënten energieverdeling over tijd via Atwater-factoren (4 kcal/g eiwit, 4 kcal/g koolhydraten, 9 kcal/g vet) met gestapelde balk, percentages en streefvergelijking.
  - Wekelijkse caloriebalans (surplus / deficit) en wetenschappelijk geschat effect op lichaamsvet (Wishnofsky's richtlijn: ~7700 kcal/kg).
  - Consistentie- en hydratatiestatistieken (vezelinname vs 30g norm, waterdoelverwezenlijking).
  - Interactieve doornavigatie: direct doorklikken vanaf een grafiekstaaf naar de betreffende dag in het voedingsdagboek.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/nutrition/statistics.ts` & `src/domain/nutrition/statistics.test.ts`):**
    - `getDateRangeForNutritionPeriod`: Genereert datumreeksen en opeenvolgende dagen voor `7d`, `14d`, `30d`, `deze_week` en `deze_maand`.
    - `calculateMacroDistribution`: Berekent zuivere macro-energieverdeling in kcal en percentages zonder afrondingsfouten of deling door nul.
    - `determineCalorieAdherence`: Classificeert daginname ten opzichte van streefdoel met tolerantie van ±10% (minimaal 150 kcal).
    - `calculateNutritionPeriodSummary`: Aggregeert maaltijden, waterlogs en cardiosessies; berekent daggemiddelden uitsluitend over gelogde dagen (zodat niet-gelogde dagen het gemiddelde niet vertekeken), wekelijkse balans (`dailyDifference * 7`), geschat gewichtseffect (`weeklyBalance / 7700`), consistente scores en uitersten.
    - 16 pure unit tests in `src/domain/nutrition/statistics.test.ts` (100% geslaagd).
  - **Repository Laag (`src/lib/db/repositories/nutrition.repository.ts`):**
    - `getMealsForDateRange(startDate, endDate)`: Directe Dexie index-lookup via `.where("calendarDate").between(startDate, endDate, true, true)`.
    - `getWaterLogsForDateRange(startDate, endDate)`: Directe Dexie index-lookup via `.where("calendarDate").between(startDate, endDate, true, true)`.
  - **Gebruikersinterface (`src/components/modules/nutrition/NutritionHistoryCharts.tsx` & `src/app/voeding/page.tsx`):**
    - `NutritionHistoryCharts.tsx`: Pure SVG responsieve grafiekcontainer met hover tooltips, KPI ribbon (Gem. Calorieën, Wekelijkse Balans, Consistentie %, Gem. Eiwit), macronutriënt breakdown blokken, vezel/water voortgang en uitvouwbare datatabel.
    - `src/app/voeding/page.tsx`: Vierde hoofdtabblad "Trends & Balans" met `BarChart3` icoon, automatische data-lading over 90 dagen historiek en interactieve navigatie naar het dagboek bij het aantikken van een staaf.
  - **Integratietests (`tests/nutritionStatisticsIntegration.test.ts`):**
    - 3 integratietests met Dexie en `fake-indexeddb` die datumbereik-queries, cardiosessie-correlaties en lege datasets valideren.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **350 van de 350 tests geslaagd** over 43 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Daggemiddelden worden berekend over de dagen waarop maaltijden zijn ingevoerd, zodat vergeten logdagen het dagelijkse caloriegemiddelde niet kunstmatig omlaag trekken; in het consistentiepercentage wordt de loggingfrequentie expliciet weerspiegeld.
- **Volgende Stap:**
  - **Stap 33 / Prompt 27**: Home: Centrale Cockpit & Dagsamenvatting (dashboard met realtime widgets voor geplande workouts, actieve cardio, voedingsdoelen en dagelijkse voortgang).

---

### Stap 33 / Prompt 27 — Home: Centrale Cockpit & Dagsamenvatting (`[x] KLAAR`)
- **Doel & Bereik:**
  - Realisatie van de centrale cockpit op het Home-scherm die alle pijlers van SportKompas verenigt: krachttraining, cardio, voeding & macro's, hydratatie en lichaamsgewicht.
  - Dynamische datumkiezer met dagwisselaar (`< Gisteren` | `Vandaag` | `Morgen >`) en één-klik "Terug naar Vandaag" knop.
  - Holistische energie- en caloriebalans: directe berekening van netto energie (`inname - cardioverbranding`), resterend caloriebudget en dynamische statusclassificatie (`deficit`, `onderhoud`, `surplus`) met visuele progressiemeter en macro-miniatuurcards.
  - Directe actiebalk ("Direct Vastleggen"):
    - `+ Glas water (250 ml)` en `+ Fles water (500 ml)` met directe Dexie-persistentie en live feedbacktoast.
    - `Gewicht noteren`: opent de nieuwe `QuickWeightModal` om direct vandaag een weging vast te leggen zonder navigatie naar Profiel.
    - Snelknoppen naar `Maaltijd loggen`, `Workout starten` en `Cardio starten`.
  - Vier Pijlers Grid met realtime dagsituatie per pijler (status, voltooide sets, cardio km/min/kcal, voedingsinname, vocht en herstel).
  - Gecombineerde dagscore (`dayCompletionScore`) die voortgang op alle 4 pijlers visualiseert.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/home/cockpit.ts` & `src/domain/home/cockpit.test.ts`):**
    - `getGreeting`: Tijdgebonden Nederlandse begroeting (Goedemorgen, Goedemiddag, Goedenavond, Goedenacht).
    - `calculateDailyCockpitSummary`: Pure domeinfunctie voor aggregatie van maaltijden, waterlogs, cardio, workouts, planning, metingen en herstel, inclusief netto calorieën, macro-percentages en dagvoltooiingsscore.
    - 10 pure unit tests in `src/domain/home/cockpit.test.ts` (100% geslaagd).
  - **Gebruikersinterface (`src/components/modules/home/` & `src/app/page.tsx`):**
    - `QuickWeightModal.tsx`: Toegankelijk dialoogvenster met decimale validatie (komma/punt), notities en directe opslag via `MeasurementRepository`.
    - `HomeCockpitDashboard.tsx`: Centrale cockpit component met interactieve datumselectie, energiebalans-visualisatie, snelle actiebalk en het 4-pijlers overzicht.
    - `src/app/page.tsx`: Volledige orchestratie van historische en actuele dagdata met live herlaadfuncties voor water- en gewichtsupdates, met behoud van `TodayTrainingCard`, `WeeklyConsistencyWidget`, `HomeRecentPRsWidget` en modulenavigatie.
  - **Integratietests (`tests/homeCockpitIntegration.test.ts`):**
    - 4 integratietests met Dexie en `fake-indexeddb` die snelle water- en gewichtsinvoer, gecombineerde caloriebalans met cardio en datumscheiding valideren.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **364 van de 364 tests geslaagd** over 45 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Volgende Stap:**
  - **Stap 34 / Prompt 28**: Home: Gecombineerde Voortgang Hub & Holistische Analytics (Afgerond).

---

### Stap 34 / Prompt 28 — Home: Gecombineerde Voortgang Hub & Holistische Analytics (`[x] KLAAR`)
- **Doel & Bereik:**
  - Creëren van een gecombineerde Voortgang Hub en holistische analyse-interface op het Home-scherm die correlaties aantoont tussen krachttrainingsvolume, cardio-belasting, calorie-inname en het feitelijke gewichtsverloop over tijd.
  - Multi-periode filter (14 dagen, 30 dagen, 90 dagen) voor flexibele historische inzichten.
  - Pure SVG grafieken met 3 interactieve weergaves:
    1. **Dubbele As Calorieën vs. Lichaamsgewicht**: Toont calorie-inname per dag (staven) en doellijn (gestreept groen) gecombineerd met de continue gewichtstrendlijn en individuele meetpunten (paars).
    2. **Trainingsvolume & Cardio**: Krachtvolume in kg per sessie met visuele cardio-activiteit indicatoren (verbrande calorieën / kilometers).
    3. **Trainingsdagen vs. Rustdagen**: Duidelijke vergelijking tussen de gemiddelde calorie- en eiwitinname op trainingsdagen versus rustdagen ter optimalisatie van herstel.
  - Holistische KPI Ribbon met 4 kerncijfers: Totaal volume (kg), Cardio afstand & burn, Gewichtsontwikkeling (start → eind) en Netto dagelijkse energiebalans.
  - Slimme feitelijke data-observaties (gewichtsverandering vs caloriebalans, innameverschillen tussen trainings- en rustdagen, cardioconsistentie en volumetrends) die transparant en zonder gefingeerde data worden gepresenteerd.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/home/progressHub.ts` & `src/domain/home/progressHub.test.ts`):**
    - `calculateProgressHubSummary`: Pure berekeningsfunctie die sets koppelt aan afgeronde workoutsessies, cardiosessies optelt, maaltijden aggregeert en gewichtsmetingen interpoleert voor een consistente trendlijn.
    - Berekening van trainingsdagen vs rustdagen calorie- en eiwitgemiddelden.
    - Cumulatief deficit/surplus en geschat gewichtseffect (Wishnofsky's ~7700 kcal per kg).
    - Berekening van de gewichtscorrelatie-accuratesse (`weightCorrelationAccuracyPct`).
    - Slimme feitelijke observatiegenerator (`ProgressObservation`) voor gewicht, voeding, cardio en volume.
    - 4 pure unit tests in `src/domain/home/progressHub.test.ts` (100% geslaagd).
  - **Gebruikersinterface (`src/components/modules/home/CombinedProgressHub.tsx` & `src/app/page.tsx`):**
    - `CombinedProgressHub.tsx`: Pure responsieve SVG multi-metric visualisatie met dubbele Y-assen (calorieën links, gewicht rechts), tabbladen voor de 3 grafiekweergaves, interactieve hover-details en observatiekaarten.
    - `src/app/page.tsx`: Historische dataverzameling over 90 dagen via `repositories.workout.sessions`, `repositories.workout.sets`, `repositories.cardio.getAll()`, `repositories.nutrition.getMealsForDateRange()` en `repositories.measurements.getAll()`.
  - **Integratietests (`tests/combinedProgressHubIntegration.test.ts`):**
    - 2 integratietests met Dexie en `fake-indexeddb` die multi-domein repositories bevragen, trainingsdagen vs rustdagen voeding testen, volume-aggregatie verifiëren en lege datasets robuust valideren.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **370 van de 370 tests geslaagd** over 47 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - De grafiek gebruikt pure SVG en CSS zonder externe zware dependencies, waardoor rendering razendsnel en hydration-safe is.
  - Bij onvoldoende meetpunten (minder dan 2) toont de gewichtscorrelatie netjes een streepje ("—") in plaats van onbetrouwbare aannames.
- **Volgende Stap:**
  - **Stap 35 / Prompt 29**: Home: Consistentie & Activity Streaks (Afgerond).

---

### Stap 35 / Prompt 29 — Home: Consistentie & Activity Streaks (`[x] KLAAR`)
- **Doel & Bereik:**
  - Realisatie van een holistische activiteits- en consistentiemonitor op het Home-scherm die álle pijlers van SportKompas eert (krachttraining, cardio, voedingsinname, hydratatiedoel en herstellogs).
  - Opeenvolgende streak-teller (dagelijkse streak in dagen):
    - Telt elke dag waarop ten minste één gezonde actie is vastgelegd (krachttraining, cardio, voeding, waterdoel of herstel).
    - Streak-behoud logica: als vandaag nog geen log heeft, blijft de actieve streak van gisteren behouden ("Log vandaag voor behoud"), zodat gebruikers niet onnodig ontmoedigd raken gedurende de dag.
    - Persoonlijk record: berekening van de langste actieve streak over de analyseperiode.
  - Multi-week kalender heatmap (instelbaar op 8 of 12 weken):
    - Duidelijke matrix van Maandag t/m Zondag met gekleurde activiteitsblokjes (0 = rust/geen log, 1 = lichte log / 1 pijler, 2 = actief / 2 pijlers, 3 = compleet / 3+ pijlers).
    - Toekomstige dagen gedimd en gestippeld; huidige dag voorzien van een focusring.
    - Interactief detailpaneel: tikken op een dag toont direct de exacte activiteiten (kracht volume, cardio minuten, calorieën, water en herstel).
  - Pijlerstatistieken & activiteitsgraad:
    - Percentage actieve dagen over de totale tijdsduur.
    - Expliciete waardering voor rust en herstel: rustdagen tellen nooit als falen of schuldgevoel, maar worden gepresenteerd als essentieel onderdeel van adaptatie en groei.
  - Rustige, schuldvrije feedbackboodschap (`ConsistencyFeedback`) met motiverende Nederlandse tekst.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/home/activityStreaks.ts` & `src/domain/home/activityStreaks.test.ts`):**
    - `calculateActivityStreaks`: Pure domeinfunctie die data indexeert, kalenderweken van Ma-Zo groepeert, intensiteitsniveaus (0..3) toekent, actieve streaks achterwaarts calculeert en de langste streak over de periode bepaalt.
    - 6 pure unit tests in `src/domain/home/activityStreaks.test.ts` (100% geslaagd).
  - **Gebruikersinterface (`src/components/modules/home/ActivityStreakHeatmap.tsx` & `src/app/page.tsx`):**
    - `ActivityStreakHeatmap.tsx`: Responsieve kalender heatmap met periodeknoppen (8w / 12w), streak-ribbon (Huidige streak, Record streak, Activiteitsgraad %, Rustdagen), interactieve dagselectie en motiverende feedbackbanner.
    - `src/app/page.tsx`: Gekoppeld aan historische water- en herstellogs over 90 dagen en opgenomen in de hoofdnavigatie van de cockpit.
  - **Integratietests (`tests/activityStreaksIntegration.test.ts`):**
    - 2 integratietests met Dexie en `fake-indexeddb` die multi-pijler data van kracht, cardio, voeding, water en herstel valideren.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **378 van de 378 tests geslaagd** over 49 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Rustdagen breken de trainingsconsistentie niet af; de streak weerspiegelt bewuste gezondheidsbetrokkenheid (waaronder het vastleggen van slaap/herstel of voeding op rustdagen).
- **Volgende Stap:**
  - **Stap 36 / Prompt 30**: Home: Universele Zoekfunctie & Activiteiten Geschiedenis Hub (Afgerond).

---

### Stap 36 / Prompt 30 — Home: Universele Zoekfunctie & Activiteiten Geschiedenis Hub (`[x] KLAAR`)
- **Doel & Bereik:**
  - Realisatie van een krachtige, universele zoekfunctie op het Home-scherm die over de volledige lokale IndexedDB geschiedenis zoekt:
    - Krachttrainingen: zoekt in routines, individuele oefeningen, PR's en persoonlijke sessienotities.
    - Cardio-sessies: zoekt in activiteitstypen (bijv. hardlopen, fietsen), afstanden en loopnotities.
    - Voeding: zoekt in maaltijdtypen en alle losse ingrediënten en merknamen van gelogde maaltijden.
    - Metingen: zoekt op gewichtstermen en notities bij de weging.
  - Sneltoets-ondersteuning: `Ctrl+K` of `Cmd+K` opent het zoekvenster direct vanuit elk punt op het hoofdscherm; `ESC` sluit het venster.
  - Zoektrigger-balk prominent bovenaan het Home-dashboard.
  - Filters & Sortering:
    - Categoriechips ("Alles", "Kracht", "Cardio", "Voeding", "Metingen").
    - Tijdsperiode-filter ("Alle tijden", "Laatste 7 dagen", "Laatste 30 dagen", "Laatste 90 dagen", "Afgelopen jaar").
    - Relevantiescore gecombineerd met chronologische sortering.
  - Interactief doorklikken: aantikken van een zoekresultaat stuurt de gebruiker via de Next.js client router direct door naar de juiste modulepagina (`/training`, `/cardio`, `/voeding`, `/profiel`).
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/home/universalSearch.ts` & `src/domain/home/universalSearch.test.ts`):**
    - `searchUniversalHistory`: Pure zoekfunctie met multi-token matching, case-insensitieve zoekcriteria, relevantiescoring (titels > inhoud > notities), snippet-extractie en datumperiode-begrenzing.
    - 6 pure unit tests in `src/domain/home/universalSearch.test.ts` (100% geslaagd).
  - **Gebruikersinterface (`src/components/modules/home/UniversalSearchDialog.tsx` & `src/app/page.tsx`):**
    - `UniversalSearchDialog.tsx`: Toegankelijk modal-venster met invoerveld, wis-knop, categoriechips, periodefilter en resultatenlijst met pijlericonen en badges.
    - `src/app/page.tsx`: Voorzien van een zoektrigger-balk bovenaan het scherm, `Ctrl+K` / `Cmd+K` sneltoets-luisteraar en integratie van de dialoog.
  - **Integratietests (`tests/universalSearchIntegration.test.ts`):**
    - Integratietest met Dexie en `fake-indexeddb` die zoekt door krachttrainingen, cardio-sessies, maaltijdlogs en gewichtsmetingen en categoriefilters valideert.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **385 van de 385 tests geslaagd** over 51 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Zoeken gebeurt 100% client-side direct in het lokale geheugen/IndexedDB, waardoor resultaten ogenblikkelijk getoond worden zonder netwerkvertraging of privacy-risico's.
- **Volgende Stap:**
  - **Stap 37 / Prompt 31**: Data-soevereiniteit & Complete JSON Back-up / Import (Afgerond).

---

### Stap 37 / Prompt 31 — Data-soevereiniteit: Complete JSON Back-up & Import (`[x] KLAAR`)
- **Doel & Bereik:**
  - Volledige realisatie van 100% offline data-soevereiniteit conform Rule 3 & 5 van `AGENTS.md`:
    - Eén-klik JSON export van alle 16 IndexedDB databasetabellen (`profiles`, `exercises`, `workoutRoutines`, `routineDays`, `scheduledSessions`, `workoutSessions`, `workoutSets`, `cardioSessions`, `goals`, `foodItems`, `recipes`, `mealLogs`, `plannedMeals`, `waterLogs`, `bodyMeasurements`, `recoveryLogs`, `appSettings`).
    - Gestandaardiseerd metadata-formaat (`SportKompasBackupPayload`) met app-versie, schema-versie (`CURRENT_DATABASE_SCHEMA_VERSION = 7`), exporttijdstip (ISO), databasenaam en recordstatistieken per tabel.
    - Zod-schema runtime validatie (`SportKompasBackupPayloadSchema`) met strikte controle op payloadintegriteit en comptabiliteitswaarschuwing bij nieuwere schema-versies.
    - Veilige import in twee modi:
      1. **Vervang alles (Restore/Clean overwrite):** Leegt bestaande tabellen atomair in één Dexie read-write transactie en herstelt de back-up exact. Vereist expliciete bevestiging met gevaarswaarschuwing.
      2. **Samenvoegen (Merge):** Voegt ontbrekende records toe en overschrijft bestaande id's via `bulkPut` zonder data in andere tabellen te wissen.
    - Automatische bijwerking van `lastBackupAt` in `AppSettings` na succesvolle export of import.
  - Gebruikersinterface:
    - `BackupRestoreSection.tsx` geïntegreerd in `/profiel` (tabblad Voorkeuren / Lokale Opslag).
    - Duidelijke statusbadge over privacy (100% lokaal in de browser, geen verborgen cloud).
    - Direct downloadbare JSON met leesbare bestandsnaam (`sportkompas-backup-YYYY-MM-DD-HHmm.json`).
    - Bestandskiezer met interactieve validatie-preview: toont datum van export, aantal records per categorie en databaseversie alvorens daadwerkelijk te importeren.
    - Keuzedialoog voor "Vervang alles" vs "Samenvoegen", inclusief waarschuwingsbanner en herlaadtrigger.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/backup/backup.ts` & `src/domain/backup/backup.test.ts`):**
    - `exportDatabaseToJson`: Verzamelt data uit alle 16 tabellen, bouwt metadata en produceert gevalideerde JSON payload + Blob grootte.
    - `validateBackupFile`: Valideert invoer met Zod, berekent tabeloverzichten en schemaversie-compatibiliteit.
    - `importDatabaseFromJson`: Voert de import uit binnen een geïsoleerde Dexie-transactie (`replace` of `merge`).
    - 6 pure unit tests in `src/domain/backup/backup.test.ts` (100% geslaagd).
  - **Gebruikersinterface (`src/components/modules/profile/BackupRestoreSection.tsx` & `src/app/profiel/page.tsx`):**
    - `BackupRestoreSection.tsx`: Complete beheercomponent met exportknop, bestandskiezer, interactieve modal met recordoverzicht en bevestigingsstappen.
    - `src/app/profiel/page.tsx`: Gekoppeld aan `settings.lastBackupAt` en `reloadProfile`.
  - **Integratietests (`tests/backupRestoreIntegration.test.ts`):**
    - Volledige end-to-end Dexie integratietest met vullen van profiel, workouts, cardio en voeding, exporteren naar JSON, wissen/muteren en succesvol herstellen in zowel `replace` als `merge` modus.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **392 van de 392 tests geslaagd** over 53 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Geen cloud-opslag vereist of geforceerd: de gebruiker behoudt 100% eigenaarschap over al zijn data.
- **Volgende Stap:**
  - **Stap 38 / Prompt 32**: Data-soevereiniteit: Spreadsheet CSV Export (Afgerond).

---

### Stap 38 / Prompt 32 — Data-soevereiniteit: Spreadsheet CSV Export (`[x] KLAAR`)
- **Doel & Bereik:**
  - Realisatie van flexibele, tabelgerichte CSV-exports voor externe gegevensanalyse in Excel, Google Sheets, LibreOffice Calc en Apple Numbers:
    - **Krachttraining Sets:** Datum, start/eindtijd, routinenaam, status, oefening, spiergroep, setnummer, settype, gewicht (kg), herhalingen, berekend volume (kg), geschatte 1RM (Epley), RPE/RIR doelen & realisaties, rusttijd en sessienotities.
    - **Cardiosessies:** Datum, start/eindtijd, activiteitstype, afstand in km, duur in min, gemiddeld tempo (min:sec/km), snelheid (km/u), geschatte calorieën, gemiddelde/maximale hartslag, hoogtemeters en loopnotities.
    - **Voedingsdagboek:** Datum, tijdstip, maaltijdtype, productnaam/item, portiegrootte (gram), calorieën, eiwitten, koolhydraten, vetten en voedingsvezels.
    - **Lichaamsmetingen:** Datum, tijdstip, gewicht (kg), vetpercentage (%), omtrekken in centimeters (borst, taille, heupen, armen, bovenbenen) en notities bij de weging.
  - Exportopties & Ergonomie:
    - Keuze tussen **Excel Nederland** (puntkomma `;` scheidingsteken en decimale komma `,` zodat getallen direct als getal worden herkend in Nederlandse/Europese Excel-installaties) en **Internationaal RFC 4180** (komma `,` en decimale punt `.`).
    - Standaard UTF-8 Byte Order Mark (`\uFEFF`) waardoor Excel speciale tekens en accenten direct foutloos decodeert.
    - Datumfilter met presets: "Alles", "Laatste 30 dagen", "Laatste 90 dagen", "Dit kalenderjaar".
    - Losse exportknoppen per categorie én een centrale knop "Download Alle 4 Spreadsheets".
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/export/csvExport.ts` & `src/domain/export/csvExport.test.ts`):**
    - `escapeCsvField`: RFC 4180 compliant CSV veld-formatter met quote-verdubbeling en configureerbare decimale scheidingstekens.
    - `exportWorkoutsToCsv`, `exportCardioToCsv`, `exportNutritionToCsv`, `exportMeasurementsToCsv`: Pure generatiefuncties met data-verrijking (Epley 1RM, tempo, conversie van meters naar cm).
    - `downloadCsvString`: Veilige browser-download via Blob & tijdelijke anchor click.
    - 14 pure unit tests in `src/domain/export/csvExport.test.ts` (100% geslaagd).
  - **Gebruikersinterface (`src/components/modules/profile/CsvExportSection.tsx` & `src/app/profiel/page.tsx`):**
    - `CsvExportSection.tsx`: Responsieve kaart met categorie-tegels, optiebalk voor periode en formaat, alerts en één-klik downloadacties.
    - `src/app/profiel/page.tsx`: Naadloos opgenomen in het tabblad Voorkeuren ("voorkeuren") direct onder de JSON back-up sectie.
  - **Integratietests (`tests/csvExportIntegration.test.ts`):**
    - End-to-end Dexie integratietest met vullen van alle 4 modules in `fake-indexeddb`, controleren van velden, berekeningen, datumfiltering en BOM-headers.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **407 van de 407 tests geslaagd** over 55 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - CSV exports zijn bedoeld voor externe analyse en rapportage in spreadsheets; voor een volledige restore/back-up blijft de JSON export (Stap 37) het canonieke formaat.
- **Volgende Stap:**
  - **Stap 39 / Prompt 33**: Data-soevereiniteit: Databasemigraties & Integriteitscontrole (Afgerond).

---

### Stap 39 / Prompt 33 — Data-soevereiniteit: Databasemigraties & Integriteitscontrole (`[x] KLAAR`)
- **Doel & Bereik:**
  - Volledige realisatie van de integriteitsbewaking en gecontroleerde databasemigraties conform Rule 5 van `AGENTS.md` ("Wis nooit gebruikersdata om een migratie te omzeilen; geef semantische betekenis aan statussen"):
    - **Diepgaande Integriteitscontrole:** Inspectie van alle 16 IndexedDB databasetabellen op records, vereiste velden, geldige UUID's en kalenderdatumnotaties (YYYY-MM-DD en ISO-8601).
    - **Referentiële Integriteit:** Opsporen van wees-records (*orphaned records*), zoals sets zonder bijbehorende workoutSession, schemadagen zonder routine, of sessies met verwijderde routinekoppelingen.
    - **Gezondheidsrapportage & Scoring:** Berekening van een objectieve gezondheidsscore (0 - 100%) en indeling in `"gezond"`, `"aandacht"` of `"beschadigd"` met telling van errors, warnings en info-meldingen.
    - **Veilige Reparatiefunctie:** Mogelijkheid om wees-sets automatisch en veilig op te schonen zonder functionele data aan te tasten (`repairOrphanedWorkoutSets`).
    - **Migratieverificatie:** Strikte regressie- en migratietesten die de opeenvolgende overgang van Dexie schema v1 -> v2 -> v3 -> v4 -> v5 -> v6 -> v7 valideren met behoud van 100% data en automatische toekenning van defaults (`provenance`, `isArchived`, `measurementType`, `category`, `isFavorite`).
  - Gebruikersinterface:
    - `DatabaseIntegritySection.tsx` geïntegreerd in `/profiel` (tabblad Voorkeuren).
    - Statusbanner met gezondheidsscore (0-100%), actieve Dexie schemaversie (v7), aantal actieve tabellen (16/16) en totaal aantal geregistreerde records.
    - Uitklapbaar tabeloverzicht met recordtelling en status per tabel.
    - Probleemoverzicht met duidelijke Nederlandse toelichting en een één-klik "Wees-sets Herstellen" reparatieknop indien nodig.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica (`src/domain/integrity/integrityCheck.ts` & `src/domain/integrity/integrityCheck.test.ts`):**
    - `runDatabaseIntegrityCheck`: Pure scan- en validatiefunctie die alle 16 tabellen doorlicht en een gestructureerd `DatabaseIntegrityReport` opstelt.
    - `repairOrphanedWorkoutSets`: Veilige atomische opruimfunctie voor wees-records.
    - 3 unit tests in `src/domain/integrity/integrityCheck.test.ts` (100% geslaagd).
  - **Gebruikersinterface (`src/components/modules/profile/DatabaseIntegritySection.tsx` & `src/app/profiel/page.tsx`):**
    - `DatabaseIntegritySection.tsx`: Complete inspectie- en diagnosecomponent met interactieve scan, badges, waarschuwingenoverzicht en herstelactie.
    - `src/app/profiel/page.tsx`: Gekoppeld aan het tabblad Voorkeuren direct onder CSV export.
  - **Integratietests & Migratietests:**
    - `tests/databaseIntegrityIntegration.test.ts`: End-to-end integratietest met consistente data, foutinjectie en wees-set reparatie.
    - `tests/databaseMigration.test.ts`: Migratietest die de volledige schematransformatie van v1 naar v7 in Dexie valideert zonder dataverlies.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **412 van de 412 tests geslaagd** over 58 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 8 Next.js routes statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Integriteitscontroles draaien 100% lokaal in de browser en belasten noch netwerk noch externe servers.
- **Volgende Stap:**
  - **Stap 40 / Prompt 34**: PWA: Offline Werking & Installatie (Afgerond).

---

### Stap 40 / Prompt 34 — PWA: Offline Werking & Installatie (`[x] KLAAR`)
> **Mijlpaal:** Hiermee is **Module 6 (Geheugen, Data-soevereiniteit & PWA: Stappen 37 t/m 40)** 100% afgerond!
- **Doel & Bereik:**
  - Realisatie van een volwaardige Progressive Web App (PWA) met gegarandeerde offline werking conform de eisen van `docs/PRODUCT.md` en `AGENTS.md`:
    - **Web App Manifest (`src/app/manifest.ts`):** Officiële Next.js Metadata Route die `/manifest.webmanifest` serveert met Nederlandse metadata, standalone weergavemodus, themakleur (`#10b981`), donkere achtergrond (`#090d16`), oriëntatie en categorieën.
    - **App Iconenset (`public/icons/`):** Hoogwaardige SVG iconen in 192x192 (`icon-192.svg`), 512x512 (`icon-512.svg`) en maskable variant (`icon-maskable.svg`) met het karakteristieke SportKompas kompaslogo.
    - **Service Worker (`public/sw.js`):**
      - Pre-cache van de app-shell en alle 5 hoofdroutes (`/`, `/training`, `/cardio`, `/voeding`, `/profiel`) en iconen.
      - Network-first navigatiestrategie met offline fallback naar de lokale gecachede schil.
      - Stale-while-revalidate voor statische CSS/JS chunks en fonts.
      - Automatische cache-verversing bij updates via `activate` event.
    - **Automatische Registratie & Offline Indicator (`PwaRegister.tsx`):**
      - Registreert de service worker in `src/app/layout.tsx`.
      - Toont een rustige, niet-blokkerende waarschuwingsbalk wanneer het netwerk wegvalt ("Offline modus actief — SportKompas werkt 100% lokaal door").
    - **Installatie UI & Beheer (`PwaInstallSection.tsx`):**
      - Geïntegreerd in het instellingenscherm (`/profiel`, tabblad Voorkeuren).
      - Eén-klik installatieknop via het `beforeinstallprompt` event voor Android, Chrome en Edge.
      - Duidelijk 3-stappenplan voor iOS Safari ("Deel-icoon > Zet op beginscherm").
      - Automatische standalone-detectie (`isStandalone`) en weergave van de offline functionaliteitsmatrix.
- **Geïmplementeerde Wijzigingen:**
  - **Domeinlogica & Hook (`src/domain/pwa/pwaManager.ts`, `src/domain/pwa/pwaManager.test.ts` & `src/lib/hooks/usePwa.ts`):**
    - `checkIsStandalone`: Detectie via iOS `navigator.standalone` en W3C `display-mode: standalone` queries.
    - `formatPwaStatus`: Nederlandse statusbepaling en badge-variant.
    - `getBrowserPlatform`: Platformherkenning (iOS, Android, Desktop).
    - `usePwa`: Custom React hook met online/offline listeners en installatiemethode.
    - 9 pure unit tests in `src/domain/pwa/pwaManager.test.ts` (100% geslaagd).
  - **Gebruikersinterface:**
    - `src/components/layout/PwaRegister.tsx`: Client-registratie en offline waarschuwingsbanner.
    - `src/components/modules/profile/PwaInstallSection.tsx`: Complete PWA installatie- en statuskaart.
    - `src/app/layout.tsx`: Gekoppeld aan manifest, apple-web-app metatags en `PwaRegister`.
    - `src/app/profiel/page.tsx`: Opgenomen op het tabblad Voorkeuren.
  - **Integratietests (`tests/pwaOfflineIntegration.test.ts`):**
    - Testen van manifest-generatie, fysieke aanwezigheid van `sw.js` en iconen op schijf, en platformdetectie.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **424 van de 424 tests geslaagd** over 60 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 9 routes (inclusief `/manifest.webmanifest`) statisch gegenereerd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Omdat alle data lokaal in IndexedDB (Dexie) persistent is, blijft de app 100% functioneel in de sportschool of in het vliegtuig zonder netwerkverbinding.
- **Volgende Stap:**
  - **Stap 41 / Prompt 35**: AI Fundament: Veilige Server API & Rate Limits (Afgerond).

---

### Stap 41 / Prompt 35 — AI Fundament: Veilige Server API & Rate Limits (`[x] KLAAR`)
> **Mijlpaal:** Start van **Module 7: AI Assistent & Slimme Inzichten (Stappen 41 t/m 45)**!
- **Doel & Bereik:**
  - Opzet van de veilige server-side infrastructuur voor AI-assistentie conform Rule 6 ("Geheimen uitsluitend server-side en NOOIT in Git, geen NEXT_PUBLIC_") en Rule 7 ("AI als assistent, nooit autonoom; geen medische diagnoses en schattingen altijd expliciet labelen"):
    - **Veilige Next.js API Routes (`src/app/api/ai/route.ts`):**
      - `GET /api/ai`: Status- en configuratiecheck (is de API sleutel ingesteld en welk model is actief?).
      - `POST /api/ai`: Behandelt AI-taken voor overload suggesties, voedingsadviezen, wekelijkse reviews en Q&A vragen.
    - **Geheimen & Milieubeveiliging (`src/lib/ai/config.ts`):**
      - Leest `AI_PROVIDER_API_KEY` en `AI_MODEL_NAME` direct uit de server environment (`process.env`).
      - Geen enkele sleutel lekt naar de client bundle.
      - `.env.example` aanwezig met lege voorbeelden zonder actieve tokens.
    - **Rate Limiting & Misbruikpreventie (`src/lib/ai/rateLimiter.ts`):**
      - Server-side sliding window rate limiter (max 15 verzoeken per 60 seconden per client IP).
      - Retourneert HTTP `429 Too Many Requests` met `Retry-After` header en heldere Nederlandse wachttijdmelding wanneer het limiet bereikt wordt.
    - **Runtime Schema-validatie (`src/lib/ai/schemas.ts`):**
      - Zod validatie van inkomende payloads (`task`, `context`, `userPrompt`).
      - Gestructureerde data-schema's voor overload suggesties, voedingsaanbevelingen en periodieke reviews.
    - **AI Provider & Lokale Heuristiek Fallback (`src/lib/ai/provider.ts`):**
      - Google Gemini REST integratie met strikte systeemprompting.
      - 100% Graceful Fallback (Rule 8): Zonder API-sleutel of bij netwerkfouten schakelt het systeem naadloos over naar betrouwbare, privacy-vriendelijke lokale heuristiek op basis van double progression en voedingsrichtlijnen.
      - Verplichte disclaimer en markering met `(schatting)`.
    - **Client Hook (`src/lib/hooks/useAi.ts`):**
      - Typesafe React hook voor eenvoudige aanroepen vanuit de gebruikersinterface.
- **Geïmplementeerde Wijzigingen:**
  - **Infrastructuur & Logica:**
    - `src/lib/ai/rateLimiter.ts` & `src/lib/ai/rateLimiter.test.ts`: In-memory sliding window rate limiter (3 tests, 100% geslaagd).
    - `src/lib/ai/schemas.ts`: Zod validatieschema's voor request payloads en gestructureerde responses.
    - `src/lib/ai/config.ts`: Server-side API key beheer en disclaimer definities.
    - `src/lib/ai/provider.ts` & `src/lib/ai/provider.test.ts`: Gemini adapter en lokale heuristiek fallback (4 tests, 100% geslaagd).
    - `src/app/api/ai/route.ts`: Next.js Route Handlers (GET & POST) met headers en rate limiting.
    - `src/lib/hooks/useAi.ts`: Client-side React hook met loading-, status- en foutafhandeling.
  - **Integratietests (`tests/aiServerApiIntegration.test.ts`):**
    - 4 integratietests voor GET status, POST geldige taak, POST HTTP 422 invoervalidatie, en HTTP 429 rate limit blokkade.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **435 van de 435 tests geslaagd** over 63 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, `/api/ai` als dynamische server route en 9 statische routes prerendered.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd via Node script (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Als de gebruiker geen externe API key instelt in `.env.local`, blijft de complete app en alle AI functies 100% werken via de ingebouwde lokale heuristiek zonder afhankelijkheid van externe cloud accounts.
- **Volgende Stap:**
  - **Stap 42 / Prompt 36**: AI Assistent: Progressieve Overload Suggesties (Afgerond).

---

### Stap 42 / Prompt 36 — AI Assistent: Progressieve Overload Suggesties (`[x] KLAAR`)
- **Doel & Bereik:**
  - Implementatie van de AI Overload Assistent conform **Rule 7 ("AI als Assistent, NOOIT autonoom")** en **Rule 8 ("Lokale fallback zonder credentials")**:
    - **Domeinlogica & Veiligheidsbegrenzing (`src/domain/ai/overloadAdvisor.ts`):**
      - `buildOverloadContext`: Bundelt eerdere werksets, reps, gewichten, RPE en berekent de deterministische dubbele progressie baseline.
      - `sanitizeOverloadSuggestion`: Fysiologische guardrails tegen extreme sprongen (clamping op maximaal 10% / 2x equipment step), afronding op 0.5 kg, afhandeling van assisted machines (minder tegengewicht is beter), en verplichte markering met `(schatting)`.
      - `applyOverloadProposalToWorkoutSets`: Past het voorstel uitsluitend toe op niet-voltooide sets in de actieve tracker; reeds voltooide sets blijven 100% onaangetast.
      - `applyOverloadProposalToRoutineDay`: Werkt het doelschema in een routinedag bij met deugdelijke provenance (`source: "ai"`, `acceptedAt`).
    - **Gebruikersinterface (`AiOverloadAdvisorModal.tsx`):**
      - Volledig toegankelijke dialoog met visuele vergelijkingskaart (Huidig vs Aanbevolen doel).
      - Prominente `(schatting)` badge naast alle voorgestelde getallen.
      - Betrouwbaarheidslabel (`hoog`, `gemiddeld`, `laag`) en modelbron (`Google Gemini` vs `Lokale Heuristiek`).
      - AI Coaching Rationale met rustige en heldere onderbouwing.
      - Gebruikersinvoer / toelichting ("Persoonlijk gevoel toevoegen") om het advies bij te sturen op basis van dagvorm of pijntjes.
      - Uitklapbare medische disclaimer ("SportKompas AI geeft indicatieve adviezen. Raadpleeg bij blessures of twijfel altijd een professional").
      - **Strikte bevestigingsknoppen:** "Accepteren & Toepassen" (groene primaire knop) vs "Negeren" (outline knop). Geen enkele autonome wijziging zonder gebruikersactie.
    - **Integratie in de App:**
      - **Actieve Tracker (`ActiveWorkoutTracker.tsx`):** Knop "AI Overload Assistent" direct toegankelijk bij elke oefening; bij acceptatie worden resterende sets direct bijgewerkt en opgeslagen.
      - **Oefenprogressie Modal (`ExerciseProgressionModal.tsx`):** Mogelijkheid om AI overload analyse te raadplegen tijdens het bekijken van historische grafieken en sets.
- **Geïmplementeerde Wijzigingen:**
  - `src/domain/ai/overloadAdvisor.ts`: Pure domeinlogica voor contextvoorbereiding, guardrails en set-updaters.
  - `src/domain/ai/overloadAdvisor.test.ts`: 5 gerichte unit tests (100% geslaagd).
  - `src/components/modules/training/AiOverloadAdvisorModal.tsx`: Complete interactieve modal component.
  - `src/components/modules/tracker/ActiveWorkoutTracker.tsx`: Gekoppeld aan de actieve workout tracker.
  - `src/components/modules/exercises/ExerciseProgressionModal.tsx`: Gekoppeld aan de oefenprogressie modal.
  - `src/lib/ai/provider.ts`: Verfijnde heuristiek en gestructureerde JSON extractie voor overload taken.
  - `tests/aiOverloadIntegration.test.ts`: 5 integratietests voor dubbele progressie, guardrails, non-autonome bevestiging en routine-upgrades (100% geslaagd).
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **445 van de 445 tests geslaagd** over 65 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 10 routes (inclusief `/training` en `/api/ai`) correct gebouwd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Zowel online (met Gemini API-sleutel) als 100% offline (lokale dubbele progressie heuristiek) gegarandeerd identieke UX en veilige guardrails conform Regel 7 en 8.
- **Volgende Stap:**
  - **Stap 43 / Prompt 37**: AI Voedingsadviezen & Macro-Balans (Afgerond).

---

### Stap 43 / Prompt 37 — AI Voedingsadviezen & Macro-Balans (`[x] KLAAR`)
- **Doel & Bereik:**
  - Implementatie van de AI Voedingsassistent conform **Rule 7 ("AI als Assistent, NOOIT autonoom")** en **Rule 8 ("Lokale fallback & privacy zonder externe accounts")**:
    - **Domeinlogica & Veiligheidsbegrenzing (`src/domain/ai/nutritionAdvisor.ts`):**
      - `buildNutritionContext`: Bundelt profielstatistieken (gewicht, lengte, leeftijd, geslacht, formulevoorkeur), berekent BMR & TDEE, huidige doelstellingen, en trainingsdag-indicator.
      - `sanitizeNutritionAdvice`: Fysiologische guardrails met harde ondergrens van 1200 kcal om crashdiëten te weren, eiwitgrenzen tussen 1.4 en 2.5 g/kg, vetminimum van 0.6 g/kg, en verplichte markering met `(schatting)`.
      - Differentieert tussen trainingsdagen (+200 kcal complexe koolhydraten en verhoogd eiwit voor glycogeenherstel) en rustdagen (onderhoud/spierherstel).
      - `applyNutritionAdviceToTargets`: Past het goedgekeurde voedingsadvies uitsluitend na expliciete bevestiging toe op de dagelijkse doelen.
    - **Gebruikersinterface (`AiNutritionAdvisorModal.tsx`):**
      - Volledig toegankelijke dialoog met dagtype-schakelaar ("Trainingsdag" vs "Rustdag").
      - Vergelijkingsgrid: Huidig doel vs AI Voorstel voor calorieën, eiwitten, koolhydraten, vetten en vezels.
      - Prominente `(schatting)` badge en transparante bronvermelding (`Google Gemini` vs `Lokale Heuristiek`).
      - AI Coaching Richtlijnen met praktische tips (timing rond training, hydratatie, maaltijdsamenstelling).
      - Gebruikersinvoer om het advies bij te sturen op basis van persoonlijke doelen ("bv. vetverlies versnellen").
      - Uitklapbare niet-medische disclaimer conform Regel 7.
      - **Strikte Bevestiging:** "Accepteren & Toepassen" (groene primaire knop) vs "Negeren" (outline knop). Geen enkele autonome wijziging zonder gebruikersactie.
    - **Integratie in de App:**
      - **Calorie- & Macrobudget Kaart (`NutritionBudgetCard.tsx`):** Directe knop "AI Advies" naast "Doel Wijzigen".
      - **Dagoverzicht Voeding (`DailyNutritionView.tsx`):** Volledig gekoppeld aan de database; updates worden direct opgeslagen in IndexedDB via `onSaveNutritionTargets`.
- **Geïmplementeerde Wijzigingen:**
  - `src/domain/ai/nutritionAdvisor.ts`: Pure domeinlogica voor contextvoorbereiding, guardrails en target-updaters.
  - `src/domain/ai/nutritionAdvisor.test.ts`: 5 gerichte unit tests (100% geslaagd).
  - `src/components/modules/nutrition/AiNutritionAdvisorModal.tsx`: Complete interactieve modal component.
  - `src/components/modules/nutrition/NutritionBudgetCard.tsx`: Knop "AI Advies" toegevoegd.
  - `src/components/modules/nutrition/DailyNutritionView.tsx`: Gekoppeld aan de database en modal.
  - `src/lib/ai/provider.ts`: Dynamische berekening op trainings- vs rustdagen en gestructureerde JSON extractie voor voedingstaken.
  - `tests/aiNutritionIntegration.test.ts`: 5 integratietests voor dagdifferentiatie, guardrails, non-autonome bevestiging en target-upgrades (100% geslaagd).
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite (`npm test`): **455 van de 455 tests geslaagd** over 67 testbestanden (100% slagingspercentage).
  - Productiebuild (`npm run build`): Succesvol gecompileerd, alle 10 routes (inclusief `/voeding` en `/api/ai`) correct gebouwd.
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Werkt 100% offline via lokale wetenschappelijk onderbouwde formules (Mifflin-St Jeor, TDEE activiteitsfactoren en macro-balansen).
- **Volgende Stap:**
  - **Stap 44 / Prompt 38**: AI Wekelijkse & Periodieke Reviews (Afgerond).

---

### Stap 44 / Prompt 38 — AI Wekelijkse & Periodieke Reviews (`[x] KLAAR`)
- **Doel & Bereik:**
  - Implementatie van de periodieke AI Review Assistent conform **Rule 3 ("Echte Persistentie & Geen Neppe Data")**, **Rule 7 ("AI als Assistent, NOOIT autonoom")** en **Rule 8 ("Lokale fallback & privacy zonder externe accounts")**:
    - **Holistische Domein-Aggregatie (`src/domain/ai/weeklyReview.ts`):**
      - `buildWeeklyReviewContext`: Pure domeinfunctie die alle 4 pijlers (krachttraining werksets & tonnage, cardiotijd & kilometers, maaltijden, calorieën, eiwitten, water, rustdagen en slaap/herstelscore) over de gekozen periode (7 of 30 dagen) consolideert.
      - `generateDeterministicWeeklyReview`: Wetenschappelijk onderbouwde deterministische analyse (voor offline/lokale modus) die constructieve feedback formuleert op volume, rustbalans en voeding.
      - `sanitizeWeeklyReview`: Fysiologische guardrails, verplichte `(schatting)` markeringen op indicatieve waarden, selectie van maximaal 3 sterke positieve highlights en de officiële SportKompas niet-medische disclaimer (`AI_WEEKLY_REVIEW_DISCLAIMER`).
    - **AI Server Provider Enhancement (`src/lib/ai/provider.ts`):**
      - `buildSystemPrompt`: Gestructureerd JSON schema voor de taak `weekly_review`.
      - `generateLocalHeuristicResponse`: Volledige integratie van `generateDeterministicWeeklyReview` via de meegeleverde `preparedContext`.
      - `executeAiTask`: Veilige parsing van `WeeklyReviewSchema` uit Gemini JSON met naadloze fallback naar lokale heuristiek bij netwerkfouten of ontbrekende API-sleutel.
    - **Gebruikersinterface & Dashboard Integratie (`AiWeeklyReviewCard.tsx`):**
      - Direct geïntegreerd op het centrale Home Dashboard (`src/app/page.tsx`).
      - Periodekeuze: "7 Dagen" vs "30 Dagen" schakelaar met verversknop (`RefreshCw`).
      - Badge voor modelbron: "Gemini AI" of "Lokale Heuristiek".
      - Positieve highlight badges (bv. "Weekdoel behaald", "1.780 kg volume", "80% herstelscore").
      - 3-koloms assessment grid voor Krachttraining & Volume, Cardio & Herstel, en Voeding & Brandstof.
      - Opvallend "Focus voor komende periode" coachingsadvies.
      - Uitklapbaar invoerveld voor persoonlijke weekervaring ("Eigen weekgevoel toevoegen of bijsturen") waarmee de review dynamisch kan worden verfijnd.
      - Prominente medische disclaimer conform Regel 7.
- **Geïmplementeerde Bestanden:**
  - `src/domain/ai/weeklyReview.ts`: Pure domeinlogica voor contextaggregatie, deterministische review en sanitizing.
  - `src/domain/ai/weeklyReview.test.ts`: 6 gerichte unit tests voor aggregatie, goal-beoordeling, highlights en fallback.
  - `src/components/modules/home/AiWeeklyReviewCard.tsx`: Complete dashboard component met periodewissel en gebruikersnotitie.
  - `src/lib/ai/provider.ts`: JSON schema prompt, lokale heuristiek en Zod parsing voor `weekly_review`.
  - `src/app/page.tsx`: Kaart toegevoegd tussen trainingconsistentie en voortgang hub.
  - `tests/aiWeeklyReviewIntegration.test.ts`: 4 integratietests over data-aggregatie, provider fallback, disclaimer checks en 30-dagen vensters.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite: **465 van de 465 tests geslaagd** over 69 testbestanden (100% pass rate).
  - Next.js productiebuild (`npm run build`): **Succesvol gecompileerd** (10 pagina's).
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - Volledig functioneel zowel online (via Google Gemini) als 100% offline (via lokale deterministische heuristiek).
- **Volgende Stap:**
  - **Stap 45 / Prompt 39**: AI Assistent: Contextuele Q&A Chat (Afgerond).

---

### Stap 45 / Prompt 39 — AI Assistent: Contextuele Q&A Chat (`[x] KLAAR`)
- **Doel & Bereik:**
  - Implementatie van de interactieve AI Q&A Assistent met contextuele data-injectie conform **Rule 3 ("Echte Persistentie & Geen Neppe Data")**, **Rule 7 ("AI als Assistent, NOOIT autonoom")** en **Rule 8 ("Lokale fallback & privacy zonder externe accounts")**:
    - **Contextuele Domein-Injectie (`src/domain/ai/chatAdvisor.ts`):**
      - `buildChatContext`: Pure domeinfunctie die een gestructureerde 14-daagse samenvatting samenstelt:
        - Profielgegevens van de sporter (naam, hoofddoel, trainingservaring).
        - Krachttraining: Aantal afgeronde sessies, totale tonnage (kg) en prestatie-overzicht van de top-oefeningen (hoogste gewicht, recent gewicht, aantal sets).
        - Cardio: Aantal sessies, totale kilometers en geschatte calorieverbranding.
        - Voeding & Hydratatie: Aantal gelogde maaltijddagen, gemiddelde calorie- en eiwitinname vs ingestelde dagdoelen.
        - Rust & Herstel: Aantal rustdagen binnen de 14 dagen en samengestelde gemiddelde herstelscore.
      - `generateLocalChatResponse`: Slimme deterministische lokale heuristiek die offline vragen beantwoordt via contextuele analyse:
        - *Veiligheid & Pijn:* Directe detectie van blessures of pijnsignalen met waarschuwing om de oefening te staken en professioneel medisch advies in te winnen (strikte Rule 7 guardrail: geen medische diagnoses).
        - *Eiwit & Voeding:* Vergelijkt daadwerkelijke inname met het streefdoel en geeft gerichte suggesties (kwark, eieren, peulvruchten) met `(schatting)`.
        - *Progressieve Overload:* Analyseert gerealiseerde piekgewichten en adviseert verantwoorde verhogingen (+1.0 tot +2.5 kg).
        - *Herstel & Slaap:* Toetst rustdagenbalans (4-8 rustdagen per 2 weken als richtlijn) en herstelpercentages.
        - *Cardio:* Analyseert aerobe prikkels en kilometers.
    - **AI Server Provider Enhancement (`src/lib/ai/provider.ts`):**
      - `buildSystemPrompt`: Taakspecifieke coach-richtlijnen voor `qa_chat` met strikte instructies voor Nederlands taalgebruik, feitelijke contextbenutting en verplichte `(schatting)` markeringen.
      - `generateLocalHeuristicResponse`: Volledige integratie van `generateLocalChatResponse` met de meegestuurde `preparedContext`.
    - **Gebruikersinterface (`AiContextualChatDialog.tsx` & Dashboard Integratie):**
      - Volledig toegankelijke chatmodal (`Dialog`) met statusbanner die actuele 14-daagse statistieken toont (trainingen, kilometers, eiwit en rustdagen).
      - Herkomstlabeling: *Gemini AI* of *Lokale Heuristiek* met knop om de gespreksgeschiedenis te wissen.
      - 4 voorgedefinieerde snelle suggestie-chips (`QUICK_PROMPT_CHIPS`): "Trainingsvoortgang", "Eiwit- & Calorie-inname", "Herstel & Rustdagen", "Progressieve Overload".
      - Berichtengeschiedenis met visueel onderscheid tussen sporter (emerald) en assistent (neutraal grijs met herkomst en tijdstempel).
      - Invoerbalk met Enter-toetsverzending, laadindicator ("SportKompas assistent formuleert antwoord...") en automatische scroll naar het nieuwste bericht.
      - Prominente trigger in de Home-header naast de zoekbalk ("AI Vraagbaak").
      - Vaste zwevende actieknop (FAB) rechtsonder ("Vraag AI") voor directe bereikbaarheid op elk moment.
- **Geïmplementeerde Bestanden:**
  - `src/domain/ai/chatAdvisor.ts`: Pure domeinlogica voor contextvoorbereiding, lokale chatheuristiek, prompt-chips en disclaimers.
  - `src/domain/ai/chatAdvisor.test.ts`: 7 gerichte unit tests voor contextaggregatie, blessurewaarschuwingen, macro-evaluatie, overload-feedback en chips.
  - `src/components/modules/ai/AiContextualChatDialog.tsx`: Complete responsieve chatinterface met contextbanner, chips en invoer.
  - `src/lib/ai/provider.ts`: Taakbegeleiding en contextuele `qa_chat` responsverwerking.
  - `src/app/page.tsx`: Triggerknop in header, floating action button en chatdialoog geïntegreerd.
  - `tests/aiChatIntegration.test.ts`: 4 integratietests over end-to-end contextinjectie, provider execution, guardrails en prompt chips.
- **Uitgevoerde Controles:**
  - TypeScript type-check (`npm run type-check`): **0 fouten**.
  - Linting (`npm run lint`): **0 waarschuwingen of fouten**.
  - Vitest testsuite: **476 van de 476 tests geslaagd** over 71 testbestanden (100% pass rate).
  - Next.js productiebuild (`npm run build`): **Succesvol gecompileerd** (10 pagina's).
  - Bestandsintegriteit: 0-byte bestandscontrole geverifieerd (**0 lege bestanden**).
- **Beperkingen & Notities:**
  - De AI assistent functioneert 100% lokaal en offline; met een geconfigureerde Gemini API-sleutel levert het systeem diepere vloeiende tekstsynthese terwijl de feiten geworteld blijven in de lokale IndexedDB data.
- **Volgende Stap:**
  - **Stap 46 / Prompt 40**: Externe Koppeling: GPX/TCX/FIT Bestand Import (Module 8: handmatig importeren en parseren van trainingsbestanden vanaf sporthorloges en fietscomputers conform Rule 8 fallback).








