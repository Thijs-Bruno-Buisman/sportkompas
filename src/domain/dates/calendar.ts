/**
 * Datum- en Kalenderhulpprogramma's voor SportKompas
 *
 * BELANGRIJK ROND MIDDERNACHT:
 * Gebruik NOOIT `toISOString().split('T')[0]` voor lokale kalenderdagen!
 * In tijdzones zoals Nederland (UTC+1 / UTC+2 zomertijd) is het om 00:30 lokale tijd
 * nog 22:30 of 23:30 van de vorige dag in UTC. `toISOString()` zou dan gisteren opleveren.
 *
 * Deze module garandeert correcte lokale datumverwerking en configureerbare weekstart.
 */

export type WeekStartDay = "maandag" | "zondag";

/**
 * Geeft de huidige of opgegeven datum terug als 'YYYY-MM-DD' in de LOKALE tijdzone.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parset een 'YYYY-MM-DD' string naar een Date object op het middaguur (12:00:00).
 * Middaguur voorkomt dat zomertijd/wintertijd verschuivingen (+1 of -1 uur)
 * over een datumgrens heen springen.
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Ongeldig datumformaat: "${dateStr}". Verwacht 'YYYY-MM-DD'.`);
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Telt een aantal dagen op bij een 'YYYY-MM-DD' datum (of trekt af bij negatief getal).
 */
export function addDaysToDateString(dateStr: string, daysToAdd: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + daysToAdd);
  return getLocalDateString(date);
}

/**
 * Berekent de begindatum ('YYYY-MM-DD') van de week waarin de referentiedatum valt,
 * rekening houdend met de gekozen weekstart (maandag of zondag).
 */
export function getWeekStartDate(
  anchorDate: string | Date,
  weekStartsOn: WeekStartDay = "maandag"
): string {
  const date = typeof anchorDate === "string" ? parseLocalDate(anchorDate) : new Date(anchorDate);
  const dayOfWeek = date.getDay(); // 0 = Zondag, 1 = Maandag, ..., 6 = Zaterdag

  let diffToStart: number;
  if (weekStartsOn === "maandag") {
    // Maandag is dag 1. Als dayOfWeek == 0 (zondag), is diff -6. Anders 1 - dayOfWeek.
    diffToStart = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  } else {
    // Zondag is dag 0. diff is direct -dayOfWeek.
    diffToStart = -dayOfWeek;
  }

  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() + diffToStart);
  return getLocalDateString(startDate);
}

export interface CalendarDayInfo {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number; // Dag van de maand (bv. 12)
  monthNumber: number; // Maandnummer 1..12
  year: number; // Jaartal (bv. 2026)
  dayOfWeekIndex: number; // 0..6 (relatief aan de weekstart)
  dayNameShort: string; // "Ma", "Di", etc.
  dayNameFull: string; // "Maandag", etc.
  isToday: boolean;
}

/**
 * Genereert de 7 kalenderdagen van de week voor een gegeven datum en weekstart.
 */
export function getWeekDays(
  anchorDate: string | Date = new Date(),
  weekStartsOn: WeekStartDay = "maandag",
  todayDateStr: string = getLocalDateString()
): CalendarDayInfo[] {
  const startStr = getWeekStartDate(anchorDate, weekStartsOn);
  const days: CalendarDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const currentStr = addDaysToDateString(startStr, i);
    const currentDate = parseLocalDate(currentStr);

    const dayNameShort = currentDate.toLocaleDateString("nl-NL", { weekday: "short" });
    const dayNameFull = currentDate.toLocaleDateString("nl-NL", { weekday: "long" });

    days.push({
      dateStr: currentStr,
      dayNumber: currentDate.getDate(),
      monthNumber: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      dayOfWeekIndex: i,
      dayNameShort: dayNameShort.charAt(0).toUpperCase() + dayNameShort.slice(1, 2),
      dayNameFull: dayNameFull.charAt(0).toUpperCase() + dayNameFull.slice(1),
      isToday: currentStr === todayDateStr,
    });
  }

  return days;
}

/**
 * Formatteert een 'YYYY-MM-DD' datum naar een vriendelijke Nederlandse tekst.
 * Bv: "Vandaag", "Morgen", "Gisteren" of "Maandag 12 oktober".
 */
export function formatFriendlyDate(
  dateStr: string,
  todayStr: string = getLocalDateString()
): string {
  if (dateStr === todayStr) return "Vandaag";
  if (dateStr === addDaysToDateString(todayStr, 1)) return "Morgen";
  if (dateStr === addDaysToDateString(todayStr, -1)) return "Gisteren";

  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Controleert of twee datumstrings naar dezelfde kalenderdag verwijzen.
 */
export function isSameDateString(dateA: string, dateB: string): boolean {
  return dateA === dateB;
}
