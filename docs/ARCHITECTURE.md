# docs/ARCHITECTURE.md — Technische Architectuur & Opslagbeslissingen

## 1. Systeemoverzicht & Architectuurprincipes

SportKompas is gebouwd als een **offline-first**, privacy-vriendelijke webapplicatie. Alle kernfunctionaliteiten werken volledig lokaal in de browser zonder verplichte backend of cloudafhankelijkheid.

### Lagenstructuur (Clean Architecture)

```text
┌────────────────────────────────────────────────────────┐
│                      UI / Presentatie                  │
│       Next.js App Router, Tailwind CSS, Lucide         │
├────────────────────────────────────────────────────────┤
│                 Applicatie & State Laag                │
│     React Hooks, Dexie useLiveQuery, Form State        │
├────────────────────────────┬───────────────────────────┤
│        Domeinlogica        │      Opslag & Integratie  │
│  Pure functies, Zod schemas│  Dexie.js (IndexedDB)     │
│  (1RM, MET, BMR, Macro's)  │  Server Routes (AI, Auth) │
└────────────────────────────┴───────────────────────────┘
```

1. **Presentatielaag (`src/components/`, `src/app/`):** Verantwoordelijk voor weergave, navigatie en invoer. Kent géén directe wiskundige domeinberekeningen; roept domeinfuncties aan.
2. **State & Query Laag (`src/lib/hooks/`):** Reactieve koppeling tussen IndexedDB en de UI via Dexie's `useLiveQuery`.
3. **Domeinlaag (`src/domain/`):** Volledig ontkoppeld van React, de browser en opslag. Bevat pure TypeScript-functies voor berekeningen (1RM, tempo, BMR, TDEE, macro-verdelingen). Makkelijk 100% te testen met Vitest.
4. **Opslaglaag (`src/lib/db/`):** Beheert IndexedDB schema's, migraties, seed data en datavalidatie.

---

## 2. Technische Keuzes & Bibliotheken

| Categorie | Bibliotheek / Tool | Rationale |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Snelle builds, Server Components waar mogelijk, uitstekende routing en API-endpoints voor server-side geheimen. |
| **Taal** | TypeScript 5 | Strikte typeveiligheid, minder runtime-fouten en duidelijke contracten. |
| **Styling** | Tailwind CSS 3 / 4 | Snelle utility-first styling, uitstekende dark-mode ondersteuning en minimale CSS-overhead. |
| **Lokale Database** | Dexie.js 4+ | Beproefde, performante abstractielaag over IndexedDB met reactieve queries (`useLiveQuery`) en duidelijke migratie-API. |
| **Validatie** | Zod 3 | Schema-validatie voor alle gebruikersinvoer, database-entiteiten en API-payloads. |
| **Iconen** | Lucide React | Lichtgewicht, consistente SVG-iconenset. |
| **Grafieken** | Recharts | Flexibele, responsive visualisatie van voortgang, tempo en gewicht. |
| **Unit Testing** | Vitest | Razendsnelle testrunner, direct compatibel met TypeScript en ESM, perfect voor pure domeinfuncties. |
| **E2E Testing** | Playwright | Betrouwbare browserautomatisering voor kritieke gebruikerspaden. |

---

## 3. Hydration Safety & Browseropslag Regels

> [!IMPORTANT]
> IndexedDB en browserobjecten (`window`, `localStorage`, `navigator`) bestaan **niet** tijdens Server-Side Rendering (SSR) of Static Site Generation (SSG).

### Richtlijnen tegen Hydration Mismatches:
1. **Client Components:** Componenten die Dexie bevragen moeten gemarkeerd worden met `'use client';`.
2. **Mount Guard:** Toegang tot browser-specifieke data mag pas plaatsvinden na het mounten van de component (bijv. via een `isMounted`-flag of `useLiveQuery` met een veilige fallback/loading-status).
3. **Geen SSR Database Initialisatie:** De Dexie database instantie wordt veilig geïnitialiseerd via een singleton patroon dat controleert of `typeof window !== 'undefined'`.

---

## 4. Datamodel & Dexie Schema

Alle data wordt opgeslagen in IndexedDB via Dexie onder de databasenaam `SportKompasDB`.

### Schema Versie 1 (Initiële Tabellen):

```text
Database: SportKompasDB
Tabellen:
  ├── profile           (id, naam, geboortedatum, lengte, geslacht, activiteitsniveau, aangemaaktOp, bijgewerktOp)
  ├── measurements      (id, datum, gewicht, vetpercentage, borst, taille, heupen, armen, benen, opmerkingen)
  ├── exercises         (id, naam, spiergroep, secundaireSpiergroepen, uitrusting, isAangepast, instructies)
  ├── workoutTemplates  (id, naam, omschrijving, oefeningen, aangemaaktOp, bijgewerktOp)
  ├── workoutSessions   (id, templateId, startTijd, eindTijd, status, oefeningenLog, notities, rpe)
  ├── cardioSessions    (id, activiteitstype, startTijd, duurMinuten, afstandKm, gemHartslag, calorieen, routeData, status)
  ├── foodItems         (id, naam, merk, calorieen, eiwit, koolhydraten, vet, vezels, portieGrootte, isAangepast)
  ├── nutritionLogs     (id, datum, maaltijdType, items, totaalCalorieen, totaalEiwit, totaalKoolhydraten, totaalVet)
  ├── waterLogs         (id, datum, hoeveelheidMl)
  └── appSettings       (id, thema, demomodusActief, geluidAan, rusttimerSeconden, exportDatum)
```

### Primaire Sleutels & IDs:
- Ieder record gebruikt een stabiele, unieke string-ID (gegenereerd via `crypto.randomUUID()`).
- Geen automatische ophogende integer IDs voor entiteiten die gesynchroniseerd of geëxporteerd moeten kunnen worden.

### Semantiek van Statussen en Waarden:
- **`status` bij Sessies:**
  - `gepland`: Training of cardio staat ingepland maar is nog niet gestart.
  - `actief`: Training is momenteel bezig (timer loopt, sets worden gelogd).
  - `afgerond`: Training succesvol voltooid en opgeslagen.
  - `geannuleerd`: Training afgebroken; data blijft bewaard voor analyse, maar telt niet mee voor PR's.
- **Waarden:**
  - `null`: Expliciet geen waarde bekend of niet ingevuld door gebruiker.
  - `0`: Een daadwerkelijke meting van nul (bijv. 0 kg extra gewicht bij pull-ups).
  - Nooit `0` gebruiken om 'onbekend' aan te duiden.

---

## 5. Opslaggrenzen & Databeheer

### IndexedDB Limieten:
- Moderne browsers kennen royale opslagquota toe aan IndexedDB (doorgaans tot 50%-80% van de beschikbare schijfruimte op desktop en 1-2 GB op mobiel).
- Een doorsnee jaar aan intensief gebruik van SportKompas (365 dagen voeding, 200 workouts met sets, 150 cardio-logs) verbruikt circa **10 tot 25 MB** aan JSON-tekstdata.
- Zelfs met duizenden metingen blijft de database ruim binnen de veilige grenzen van elke browser.

### Opslagbewaking:
- Via `navigator.storage.estimate()` kan in het Profiel-scherm het actuele geheugengebruik en de resterende quota worden getoond.
- Bij het naderen van 80% van een toegekend mobiel quotum krijgt de gebruiker een waarschuwing met advies om een back-up te downloaden.

### Back-up en Herstel Formaat:
- **Formaat:** JSON-bestand met header:
  ```json
  {
    "app": "SportKompas",
    "version": 1,
    "exportedAt": "2026-10-02T10:30:00.000Z",
    "data": {
      "profile": [...],
      "measurements": [...],
      "exercises": [...],
      "workoutTemplates": [...],
      "workoutSessions": [...],
      "cardioSessions": [...],
      "foodItems": [...],
      "nutritionLogs": [...],
      "waterLogs": [...],
      "appSettings": [...]
    }
  }
  ```
- **Validatie bij Import:** Het JSON-bestand wordt bij import gevalideerd via Zod. Ongeldige records worden geweigerd met duidelijke foutmeldingen zonder bestaande data te corrumperen.

---

## 6. Databasemigratie Strategie

Om dataverlies bij updates te voorkomen, hanteert SportKompas een strikte migratiemethode:
1. **Nooit tabellen wissen:** Schemawijzigingen worden toegevoegd via een nieuwe Dexie versie: `db.version(2).stores({...}).upgrade(tx => ...)`.
2. **Defensieve veldtransformaties:** Als veldnamen veranderen of berekende waarden worden toegevoegd, draait een upgrade-functie die oude velden migreert en defaults toewijst.
3. **Migratietesten:** Voor elke nieuwe databaseversie wordt een Vitest test geschreven die data van versie `N` laadt en controleert of versie `N+1` vlekkeloos ontstaat zonder dataverlies.

---

## 7. Beveiliging, Geheimen & AI Integratie

### Server-Side Isolatie:
- Alle communicatie met externe LLM-providers of externe API's verloopt uitsluitend via Next.js API Routes (`/api/ai/...`, `/api/integrations/...`).
- API-sleutels staan in `.env.local` en worden **nooit** aangeroepen met een `NEXT_PUBLIC_` prefix.
- In Git bevindt zich uitsluitend `.env.example` met lege placeholders:
  ```env
  # AI Provider Configuratie (Optioneel)
  AI_PROVIDER_API_KEY=
  AI_MODEL_NAME=gemini-1.5-flash
  
  # Externe Diensten (Optioneel)
  STRAVA_CLIENT_ID=
  STRAVA_CLIENT_SECRET=
  ```

### AI Veiligheidsregels:
- **Menselijke Regie (Human-in-the-loop):** AI-aanbevelingen (bijv. "Verhoog bench press naar 82.5 kg") worden getoond als een modal of interactieve kaart met knoppen: `Accepteren` of `Negeren`.
- **Geen Medische Claims:** AI-teksten bevatten een duidelijke disclaimer dat de adviezen puur trainingssuggesties zijn en geen fysiotherapeutisch of medisch advies.
- **Schattingen Labelen:** Elke berekende of geschatte waarde (bijv. MET-calorieverbranding of 1RM) krijgt een expliciete indicatie `(schatting)`.

---

## 8. Externe Diensten & Graceful Degradation

Als de gebruiker geen API-sleutels configureert of offline is:
1. De UI toont een rustige melding: `Nog niet verbonden`.
2. Er wordt een link of knop getoond naar duidelijke instructies hoe een sleutel lokaal geconfigureerd kan worden.
3. Alle lokale functies (handmatig loggen, berekenen, schema's beheren, grafieken bekijken) blijven 100% operationeel zonder storende foutmeldingen of crashende schermen.

---

## 9. Test- en Verificatiestrategie

1. **Type- & Lintcontrole:** `npm run type-check` (`tsc --noEmit`) en `npm run lint` moeten slagen voor elke afronding.
2. **Vitest Unit Tests:**
   - 1RM formules (Epley vs Brzycki tolerantie en grenswaarden).
   - BMR & TDEE formules (leeftijd, gewicht, geslachtsverschillen).
   - Cardio MET berekeningen en tempo conversies (min/km naar km/u).
   - Zod schema validaties (grenzen op reps, sets, gewichten, negatieve getallen weren).
3. **Playwright E2E Tests:**
   - Hoofdnavigatie tussen alle vijf schermen.
   - Aanmaken van een workout, sets invullen en training afronden.
   - Voedingsmiddel toevoegen en dagtotaal controleren.
   - Exporteren en importeren van een back-up.
