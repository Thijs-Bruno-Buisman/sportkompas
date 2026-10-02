# SportKompas 🧭

SportKompas is een persoonlijke, geïntegreerde sport- en gezondheidsapplicatie voor krachttraining, cardio, voeding en voortgang. Gebouwd met een offline-first architectuur zodat al je gegevens lokaal in je eigen browser blijven via IndexedDB.

---

## 🚀 Technologieën

- **Framework:** Next.js (App Router) & React 19
- **Taal:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (donkere & lichte modus, emerald groen accent)
- **Lokale Opslag:** Dexie.js (IndexedDB)
- **Validatie:** Zod
- **Iconen:** Lucide React
- **Unit Tests:** Vitest

---

## 🛠️ Installatie & Lokaal Draaien

Er is **geen extern account of API-sleutel vereist** om de app lokaal volledig te draaien en te gebruiken.

### 1. Repository klonen & dependencies installeren
```bash
npm install
```

### 2. Ontwikkelserver starten
```bash
npm run dev
```
Open vervolgens in je browser: [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Bouwen voor Productie

```bash
npm run build
```

Productieserver starten:
```bash
npm run start
```

---

## 🧪 Kwaliteitscontroles & Tests

Voer de geconfigureerde verificaties uit:

```bash
# Type-checking controleren met TypeScript
npm run type-check

# Linting controleren met ESLint
npm run lint

# Unit tests uitvoeren met Vitest
npm run test
```

---

## 🔒 Beveiliging & Omgevingsvariabelen

Alle gevoelige tokens en toekomstige externe koppelingen (zoals optionele AI of Strava) blijven uitsluitend server-side.

Zie `.env.example` voor een overzicht van mogelijke configuratiewaarden:
```bash
cp .env.example .env.local
```

Zonder deze variabelen functioneert de applicatie 100% lokaal.

