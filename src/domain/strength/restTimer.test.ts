import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  startRestTimer,
  getRemainingSeconds,
  pauseRestTimer,
  resumeRestTimer,
  adjustRestTimer,
  formatTimerDisplay,
  playTimerCompletionSound,
  triggerTimerVibration,
} from "./restTimer";

describe("RestTimer Domain Logic (Prompt 11)", () => {
  const baseTime = 1774864800000; // Vaste referentietijd

  it("berekent de resterende tijd correct op basis van timestamps bij de start", () => {
    const timer = startRestTimer(90, "Bankdrukken", undefined, baseTime);
    expect(timer.totalDurationSeconds).toBe(90);
    expect(timer.isPaused).toBe(false);
    expect(timer.targetEndTimeMs).toBe(baseTime + 90 * 1000);

    const remaining = getRemainingSeconds(timer, baseTime);
    expect(remaining).toBe(90);
  });

  it("behoudt de juiste resterende tijd na 30 seconden achtergrondgebruik", () => {
    const timer = startRestTimer(90, "Squat", undefined, baseTime);

    // Simuleer dat de app 30 seconden op de achtergrond was (tab verborgen / telefoon vergrendeld)
    const thirtySecondsLater = baseTime + 30 * 1000;
    const remaining = getRemainingSeconds(timer, thirtySecondsLater);

    // Moet EXACT 60 seconden zijn!
    expect(remaining).toBe(60);
  });

  it("geeft 0 seconden terug en wordt niet negatief wanneer de tijd is verstreken", () => {
    const timer = startRestTimer(60, "Deadlift", undefined, baseTime);

    // Simuleer tijd na afloop van de timer (bv. 75 seconden later)
    const pastTime = baseTime + 75 * 1000;
    const remaining = getRemainingSeconds(timer, pastTime);

    expect(remaining).toBe(0);
  });

  it("kan pauzeren en de resterende seconden bevriezen", () => {
    const timer = startRestTimer(90, "Overhead Press", undefined, baseTime);

    // Pauzeer na 20 seconden
    const pausedTime = baseTime + 20 * 1000;
    const pausedTimer = pauseRestTimer(timer, pausedTime);

    expect(pausedTimer.isPaused).toBe(true);
    expect(pausedTimer.remainingWhenPaused).toBe(70);
    expect(pausedTimer.targetEndTimeMs).toBeNull();

    // Verifieer dat tijdens de pauze de resterende tijd niet verder afneemt (ook niet na 50s)
    const muchLater = pausedTime + 50 * 1000;
    expect(getRemainingSeconds(pausedTimer, muchLater)).toBe(70);
  });

  it("kan een gepauzeerde timer hervatten met een herrekende doeltijdstempel", () => {
    const timer = startRestTimer(90, "Row", undefined, baseTime);

    // Pauzeer na 25 seconden (65s over)
    const paused = pauseRestTimer(timer, baseTime + 25 * 1000);
    expect(paused.remainingWhenPaused).toBe(65);

    // Hervat 10 seconden later
    const resumeTime = baseTime + 35 * 1000;
    const resumed = resumeRestTimer(paused, resumeTime);

    expect(resumed.isPaused).toBe(false);
    expect(resumed.targetEndTimeMs).toBe(resumeTime + 65 * 1000);
    expect(resumed.remainingWhenPaused).toBeNull();

    // Controleer de resterende tijd op hervat-moment
    expect(getRemainingSeconds(resumed, resumeTime)).toBe(65);

    // Controleer 15 seconden later
    expect(getRemainingSeconds(resumed, resumeTime + 15 * 1000)).toBe(50);
  });

  it("kan de timer verhogen met +15 seconden en verlagen met -15 seconden", () => {
    const timer = startRestTimer(60, "Bench Press", undefined, baseTime);

    // Voeg 15 seconden toe (+15s)
    const extended = adjustRestTimer(timer, 15, baseTime);
    expect(getRemainingSeconds(extended, baseTime)).toBe(75);

    // Trek 15 seconden af (-15s)
    const shortened = adjustRestTimer(extended, -15, baseTime);
    expect(getRemainingSeconds(shortened, baseTime)).toBe(60);

    // Trek meer af dan resteert: mag nooit onder 0 duiken
    const drained = adjustRestTimer(shortened, -100, baseTime);
    expect(getRemainingSeconds(drained, baseTime)).toBe(0);
  });

  it("kan de timer aanpassen terwijl deze gepauzeerd is", () => {
    const timer = startRestTimer(60, "Bench Press", undefined, baseTime);
    const paused = pauseRestTimer(timer, baseTime + 10 * 1000); // 50s remaining
    expect(paused.remainingWhenPaused).toBe(50);

    const adjustedPaused = adjustRestTimer(paused, 15, baseTime);
    expect(adjustedPaused.remainingWhenPaused).toBe(65);

    const reducedPaused = adjustRestTimer(adjustedPaused, -30, baseTime);
    expect(reducedPaused.remainingWhenPaused).toBe(35);
  });

  it("formatteert seconden naar mm:ss weergave", () => {
    expect(formatTimerDisplay(90)).toBe("01:30");
    expect(formatTimerDisplay(45)).toBe("00:45");
    expect(formatTimerDisplay(125)).toBe("02:05");
    expect(formatTimerDisplay(0)).toBe("00:00");
    expect(formatTimerDisplay(-5)).toBe("00:00");
  });

  it("crasht niet bij het aanroepen van audio of vibratie in test/niet-ondersteunde omgeving", () => {
    expect(() => playTimerCompletionSound()).not.toThrow();
    expect(() => triggerTimerVibration()).not.toThrow();
  });
});
