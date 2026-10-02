# AGENTS.md — SportKompas Ontwikkelafspraken & Richtlijnen

Dit document definieert de vaste werkwijze, architectuurregels en kwaliteitseisen voor de ontwikkeling van **SportKompas**. Deze instructies gelden strikt voor elke sessie en elke prompt.

---

## 1. Productidentiteit & Doel

- **Product:** SportKompas — een persoonlijke, rustige, alles-in-één sport- en gezondheidsapplicatie.
- **Pijlers:** Krachttraining, Cardio, Voeding en Voortgang.
- **Hoofdnavigatie:** `Home`, `Training`, `Cardio`, `Voeding`, `Profiel`.
- **Taal:** De gebruikersinterface is 100% Nederlands.
- **Doelgroep:** Primair gebouwd voor eigen persoonlijk gebruik (geen paywall, geen advertenties, geen marketingwebsite).
- **Groeipad:** Eerst een robuuste, offline werkende lokale app; daarna uitbreiden met AI-inzichten en optionele externe koppelingen.

---

## 2. Technische Stack & Kerntechnologieën

| Laag | Technologie | Rol & Richtlijn |
|---|---|---|
| **Framework** | Next.js (App Router) | Moderne React architectuur, Server Components voor statische UI, Client Components voor interactie |
| **Taal** | TypeScript | Strikte typering (`strict: true`), geen onnodige `any` |
| **Styling** | Tailwind CSS | Mobile first, donkere en lichte modus, één consistente groene accentkleur (emerald) |
| **Lokale Opslag** | Dexie.js (IndexedDB) | Robuuste offline-first persistentie in de browser |
| **Validatie** | Zod | Runtime schema-validatie, grenzenbewaking en domeintypen |
| **Iconen** | Lucide React | Consistente, minimalistische iconenset |
| **Grafieken** | Recharts / Chart.js | Duidelijke visuele dataweergave voor voortgang, volume en tempo |
| **Unit/Domain Tests** | Vitest | Testen van domeinberekeningen (1RM, BMR/TDEE, tempo, volume) |
| **E2E Tests** | Playwright | Validatie van cruciale gebruikersroutes |

---

## 3. De 11 Vaste Regels voor ELKE Prompt

1. **Context & Inspectie:** Lees altijd `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md` en `docs/PROGRESS.md`. Inspecteer relevante bestaande code alvorens iets te wijzigen.
2. **Minimale & Doelgerichte Wijzigingen:** Implementeer uitsluitend de huidige stap met noodzakelijke ondersteunende code. Behoud bestaande werkende functionaliteiten; voer geen onnodige refactors of herschrijvingen uit.
3. **Echte Persistentie & Geen Neppe Data:** Alle gebruikersgegevens zijn persistent in IndexedDB. Geen willekeurige gefingeerde waarden of nepstatistieken presenteren als echt. Demo-data hoort uitsluitend thuis in een expliciet herkenbare, uitschakelbare demomodus.
4. **Schone Architectuur & Hydration Safety:** Houd domeinberekeningen los van UI-componenten. Gebruik stabiele unieke identifiers. Valideer invoer met Zod en geef duidelijke foutmeldingen. Browseropslag (IndexedDB, localStorage, `window`) mag **nooit** tijdens server-side rendering worden aangeroepen.
5. **Databasemigraties & Data-integriteit:** Beheer Dexie-versies zorgvuldig. Wis nooit gebruikersdata om een migratie te omzeilen. Geef expliciete semantische betekenis aan statussen: `nul`, `onbekend`, `gepland`, `afgerond` en `geannuleerd`.
6. **Geheimen & Veiligheid:** API-sleutels en geheimen blijven uitsluitend server-side en buiten Git. Gebruik **nooit** `NEXT_PUBLIC_` voor gevoelige tokens. Zorg voor een actuele `.env.example` met lege voorbeeldwaarden. Geen betaalde accounts forceren of publiceren.
7. **AI als Assistent (Niet Autonoom):** AI-inzichten en schema-aanpassingen zijn altijd voorstellen die door de gebruiker bevestigd moeten worden. Geen medische diagnoses stellen, geen ontbrekende data verzinnen en schattingen altijd zichtbaar labelen.
8. **Externe Koppelingen met Fallback:** Externe integraties worden netjes afgehandeld. Zonder geldige credentials toont de interface 'Nog niet verbonden', blijven alle lokale functies 100% werken, en worden duidelijke configuratiestappen getoond. Claim nooit een geslaagde koppeling zonder echte test.
9. **Kwaliteitsborging & Tests:** Verifieer TypeScript (`tsc --noEmit`), linting en builds. Test gewijzigde kritieke berekeningen en flows gericht met Vitest / Playwright. Los gevonden fouten direct op. Als een controle niet kan worden uitgevoerd, meld dan exact welke en waarom.
10. **Voortgangsbewaking & Checkpoint Commits:** Werk `docs/PROGRESS.md` na elke stap bij met actuele status (`klaar`, `gedeeltelijk`, `geblokkeerd`), uitgevoerde verificaties, beperkingen en de volgende stap. (*Let op: 'gedeeltelijk' is geen 'klaar'*). Maak een Git checkpoint-commit als Git beschikbaar is, zonder geheimen of ongerelateerde bestanden. Push nooit automatisch.
11. **Zelfstandigheid & Pragmatisme:** Maak gewone ontwerp- en implementatiekeuzes zelfstandig op basis van de specificaties. Vraag alleen om opheldering als essentiële informatie ontbreekt. Isoleer externe blokkades en ga door met onafhankelijke onderdelen.

---

## 4. UI/UX Ontwerprichtlijnen

- **Thema:** Ondersteuning voor Donkere modus (standaard) en Lichte modus. Rustige donkergrijze/antraciete achtergronden, geen fel overdadig contrast.
- **Accentkleur:** Eén consistente groene tint (bijv. `#10B981` / Emerald 500) voor actieve status, primaire knoppen, vorderingen en highlights.
- **Ergonomie tijdens Training:**
  - Knoppen en invoervelden in de actieve trainingsmodus zijn extra groot (minimaal 48x48px touch targets) zodat ze eenvoudig te bedienen zijn met bezwete handen of tussen sets.
  - Rusttimers met grote, in één oogopslag leesbare cijfers.
- **Responsiviteit:**
  - *Mobile first:* Geoptimaliseerd voor een smartphone in portretmodus met een vaste onderste navigatiebalk.
  - *Desktop:* Meer schermruimte benutten voor overzichten naast elkaar (bijv. volume-analyses, kalender, uitgebreide voedingsgrafieken).

---

## 5. Structuur van de Codebase (Standaard)

```text
src/
├── app/                  # Next.js App Router pagina's en API routes
│   ├── (main)/           # Hoofdapplicatieroutes (home, training, cardio, voeding, profiel)
│   ├── api/              # Veilige server-side endpoints (AI, optionele sync)
│   ├── layout.tsx        # Root layout met providers (Theme, Database, Toast)
│   └── globals.css       # Tailwind basisstijlen & CSS variabelen
├── components/           # Herbruikbare UI componenten
│   ├── ui/               # Knoppen, modale vensters, invoervelden, kaarten
│   ├── layout/           # Navigatiebalk (mobiel + desktop), header
│   └── modules/          # Module-specifieke componenten (training, cardio, voeding, profiel)
├── domain/               # Pure domeinlogica & berekeningen (100% UI-vrij)
│   ├── strength/         # 1RM schattingen, volume, progressieve overload
│   ├── cardio/           # Pace, hartslagzones, calorieverbranding (MET)
│   └── nutrition/        # Macro-balans, BMR/TDEE berekeningen
├── lib/                  # Hulpprogramma's en infrastructuur
│   ├── db/               # Dexie.js database configuratie, schema's en migraties
│   ├── hooks/            # Custom React hooks (bijv. useLiveQuery wrappers)
│   └── utils/            # Generieke utility functies en datum-helpers
├── types/                # TypeScript type-definities en Zod schema's
└── tests/                # Vitest unit tests en Playwright E2E tests
```
