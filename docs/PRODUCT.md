# docs/PRODUCT.md — Productvisie & Functionele Specificatie SportKompas

## 1. Productvisie & Filosofie

**SportKompas** is een persoonlijke, geïntegreerde sport- en gezondheidsapplicatie die krachttraining, cardio, voeding en voortgang samenbrengt in één rustige, doeltreffende gebruikerservaring.

### Waarom SportKompas?
Veel sporters moeten schakelen tussen drie tot vier verschillende apps: een aparte workout-tracker, een hardloop-app, een calorieënteller en een spreadsheet voor lichaamsgewicht. Deze apps zitten vaak vol opdringerige abonnementen, reclame, marketingpop-ups en cloud-afhankelijkheden. 

SportKompas pakt dit anders aan:
- **Eén geïntegreerde cockpit:** Alle pijlers van fitheid versterken elkaar in één overzicht.
- **Lokale data-soevereiniteit:** Alle data staat in de browser (IndexedDB) van de gebruiker. Geen verplichte externe accounts, geen risico op datalekken of plotselinge betaalmuren.
- **Echte persistentie:** Geen nepstatistieken of gefingeerde gegevens; wat je ziet is wat je hebt gelogd. Demo-data bestaat uitsluitend in een expliciet afgebakende demomodus.
- **Doordacht ergonomisch ontwerp:** Rustige uitstraling met donkere en lichte modus, één herkenbare groene accentkleur, en extra grote touch-knoppen tijdens actieve workouts.
- **Van lokaal bruikbaar naar slim:** Eerst een vlekkeloos werkende lokale app, daarna verrijkt met AI-ondersteuning (altijd op basis van bevestiging) en optionele externe koppelingen.

---

## 2. Hoofdnavigatie & Structuur

De applicatie kent vijf primaire schermen, bereikbaar via een vaste navigatiebalk (onderaan op mobiel, compacte zijbalk/header op desktop):

```text
┌────────────────────────────────────────────────────────┐
│                      SportKompas                       │
├─────────┬─────────────┬───────────┬───────────┬────────┤
│  Home   │  Training   │  Cardio   │  Voeding  │Profiel │
└─────────┴─────────────┴───────────┴───────────┴────────┘
```

1. **Home:** Centrale cockpit met de dagsamenvatting, geplande activiteiten, macrobalans, gewichtstrend en snelle actieknoppen.
2. **Training:** Alles rondom krachttraining: routines beheren, oefeningenbibliotheek, actieve workout-tracker, rusttimer, PR's en volume-analyses.
3. **Cardio:** Hardlopen, fietsen, roeien en andere duursporten: sessies registreren, live tracking, tempo-, afstands- en hartslagstatistieken.
4. **Voeding:** Dagelijks voedingsdagboek (ontbijt, lunch, diner, snacks), macro- en caloriedoelen, waterinname en maaltijdplanning.
5. **Profiel:** Lichaamsmetingen (gewicht, vetpercentage, omtrekken), doelen, BMR/TDEE calculator, app-instellingen, demomodus en export/import van data.

---

## 3. Geplande Modules & Functionele Details (in volgorde van uitrol)

### Module 1: Fundament, UI & Gebruikersprofiel (Stappen 01 – 09)
- **Design System:** Rustig kleurenpalet (antraciet/zwart in dark mode, neutraal wit/lichtgrijs in light mode, emerald groen als accent), duidelijke typografie.
- **Lokale Database Core:** Dexie.js met versiebeheer en schema-integriteit.
- **Profielbeheer:**
  - Persoonlijke parameters: leeftijd, geslacht, lengte, startgewicht, streefgewicht, activiteitsniveau.
  - BMR (Basal Metabolic Rate) en TDEE (Total Daily Energy Expenditure) berekeningen via bewezen formules (Mifflin-St Jeor en Katch-McArdle).
  - Lichaamsmetingen: gewichtslogboek met datum, tijd en notities; optionele omtrekken (taille, borst, armen, benen).
  - Grafieken van gewichtsverloop en trendlijnen.
- **Demomodus:** Eenvoudig in- en uitschakelbare demomodus met realistische voorbeelddata die gescheiden blijft van echte data.

### Module 2: Krachttraining (Stappen 10 – 18)
- **Oefeningenbibliotheek:**
  - Uitgebreide standaardlijst van oefeningen per spiergroep (borst, rug, benen, schouders, armen, core) en uitrusting (barbell, dumbbell, kabel, machine, lichaamsgewicht).
  - Mogelijkheid om eigen aangepaste oefeningen toe te voegen.
- **Routines & Schema's:**
  - Aanmaken van trainingsschema's (bijv. Push/Pull/Legs, Upper/Lower, Full Body).
  - Instellen van doelen per set: streefgewicht, aantal herhalingen, gewenste RPE (Rate of Perceived Exertion).
- **Actieve Workout Tracker:**
  - Grote, duidelijke bedieningselementen geoptimaliseerd voor gebruik in de sportschool.
  - Loggen van voltooide sets: gewicht, herhalingen, RPE, afvinken van sets.
  - Geïntegreerde rusttimer met visuele aftelling en instelbare rustduur.
  - Directe weergave van prestaties uit de vorige trainingssessie voor dezelfde oefening (progressieve overload stimuleren).
- **Krachttrainings-analyses:**
  - Berekening van theoretische 1RM (One Rep Max) via de Epley- en Brzycki-formules.
  - Automatische detectie en viering van Persoonlijke Records (PR's).
  - Totaal volume per training en per spiergroep (sets en tonnage per week).

### Module 3: Cardio (Stappen 19 – 24)
- **Activiteitstypen:** Ondersteuning voor hardlopen, buiten fietsen, wielrennen/spinning, roeien, wandelen, zwemmen en crosstrainer.
- **Sessie Registratie:**
  - Handmatige invoer achteraf: afstand, duur, gemiddelde hartslag, calorieën, hoogteverschil, cadans en gevoel/RPE.
  - Live tracker / stopwatch met interval- en rustfasen.
- **Domeinberekeningen:**
  - Berekening van gemiddeld tempo (min/km), snelheid (km/u) en geschat calorieverbruik via accurate MET-waarden (Metabolic Equivalent of Task).
  - Hartslagzoneverdeling (Zone 1 tot Zone 5) op basis van de maximale hartslagformule.
- **Cardio Statistieken:**
  - Wekelijkse en maandelijkse kilometers, tempo-ontwikkeling over tijd en visuele grafieken.

### Module 4: Voeding & Hydratatie (Stappen 25 – 32)
- **Voedingsdatabase:**
  - Lokale bibliotheek van voedingsmiddelen met macronutriënten per 100 gram (calorieën, eiwitten, koolhydraten, vetten) en vezels.
  - Eenvoudig toevoegen en bewerken van eigen producten en samengestelde maaltijden/recepten.
- **Dagelijks Voedingsdagboek:**
  - Indeling op maaltijdmomenten: Ontbijt, Lunch, Diner en Tussendoortjes / Snacks.
  - Snelle invoer met recente producten, favorieten en portiekeuze.
- **Doelen & Voortgang:**
  - Dynamische berekening van resterende calorieën en macronutriënten op basis van TDEE en doel (afvallen, op gewicht blijven, spiermassa opbouwen).
  - Visuele voortgangsbalken en macroverhoudingen (percentage eiwit / koolhydraat / vet).
- **Waterinname Tracker:**
  - Snelle registratie van glazen (250 ml) en flesjes (500 ml) met dagelijks doel en voortgangsindicator.

### Module 5: Home Dashboard & Gecombineerde Voortgang (Stappen 33 – 36)
- **Dashboard Integratie:**
  - Dagsamenvatting die alle pijlers bundelt: geplande workout, voltooide cardio, caloriebalans (inname vs verbruik) en waterinname.
  - Streak-teller voor trainingsconsistentie en dagelijkse logs.
- **Holistische Analytics:**
  - Correlatie tussen trainingsvolume, calorie-inname en gewichtsontwikkeling.
  - Universele zoekfunctie door alle historische sessies en logs.

### Module 6: Geheugen, Data-soevereiniteit & PWA (Stappen 37 – 40)
- **Volledige Back-up:**
  - Eén-klik JSON export van de complete lokale database inclusief schemaversie.
  - Veilige import met validatie, herstel en conflictverificatie.
- **Spreadsheet Export:**
  - Exporteren van workouts, cardio en voeding naar nette CSV-bestanden voor eigen analyse in Excel of Google Sheets.
- **Progressive Web App (PWA):**
  - Web app manifest, service worker caching van app-shells en statische assets voor volledige offline werking op iOS en Android.

### Module 7: AI Assistent & Slimme Inzichten (Stappen 41 – 45)
- **Principes:** AI-adviezen zijn altijd vrijblijvende voorstellen; nooit automatische databewerking zonder goedkeuring van de gebruiker. Geen medische claims.
- **Functies:**
  - *Progressieve Overload Assistent:* Analyseert recente prestaties en stelt voorzichtige gewichts- of herhalingsverhogingen voor.
  - *Voedingsadviseur:* Stelt macro-aanpassingen voor op basis van trainingsintensiteit (bijv. extra koolhydraten rondom zware cardio of leg days).
  - *Wekelijkse Terugblik:* Genereert een beknopte, motiverende samenvatting van de week met herstel- en volumetips.
  - *Contextbewuste Vragen:* Mogelijkheid om vragen te stellen over je eigen opgebouwde data ("Hoeveel volume heb ik vorige maand op borst gedraaid vergeleken met deze maand?").

### Module 8: Externe Integraties & Koppelingen (Stappen 46 – 48)
- **Graceful Error Handling:** Als externe API-keys ontbreken, blijft de app 100% operationeel lokaal en toont het scherm een duidelijke 'Nog niet verbonden' status met aansluitinstructies.
- **Koppelingen:**
  - GPX/TCX bestandimport voor cardio-activiteiten.
  - Optionele Strava OAuth koppeling voor het synchroniseren van hardloop- en fietsritten.
  - Optionele Open Food Facts barcode scanning / zoekfunctie voor snelle voedingsmiddelen lookup.

### Module 9 & 10: Kwaliteitsborging & Release (Stappen 49 – 50)
- Playwright E2E tests voor kritische gebruikerspaden.
- Performance optimalisaties, bundlegrootte inspectie en afronding van alle documentatie.

---

## 4. Ontwerp- en Gebruikerservaring Regels

1. **Rustig & Zonder Afleiding:** Geen badges die stress veroorzaken, geen notificatie-terreur, geen advertenties.
2. **Groene Accentkleur:** Eén consistente tint groen voor positieve feedback, actieve knoppen, vinkjes en grafiekhighlights.
3. **Sportschool Ergonomie:**
   - Tijdens actieve training zijn knoppen minimaal 48x48 pixels.
   - Numerieke toetsenborden voor herhalingen en kilo's zijn intuïtief en snel bedienbaar.
   - Rusttimer blijft prominent zichtbaar en eenvoudig met één tik aan te passen (+30s / -30s).
