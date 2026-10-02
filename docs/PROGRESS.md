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
| **13** | Krachttraining: Actieve Workout Tracker Core | `[ ] OPEN` | Grote touchbediening, sets loggen, gewicht/reps invoer, afvinken. |
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
  - Prompt 09 / Volgende geplande prompt.


