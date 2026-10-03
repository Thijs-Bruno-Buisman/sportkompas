import { describe, it, expect } from "vitest";
import {
  startLiveTracker,
  getLiveElapsedSeconds,
  pauseLiveTracker,
  resumeLiveTracker,
  addLapSplit,
  updateLiveDistance,
  formatLiveTimer,
} from "./liveTracker";

describe("Live Cardio Tracker Domain", () => {
  it("initializes a new live tracker with zero elapsed seconds", () => {
    const t0 = 1700000000000;
    const tracker = startLiveTracker("hardlopen", t0, "test-id-1");

    expect(tracker.id).toBe("test-id-1");
    expect(tracker.activityType).toBe("hardlopen");
    expect(tracker.isPaused).toBe(false);
    expect(tracker.accumulatedSeconds).toBe(0);
    expect(tracker.distanceMeters).toBe(0);
    expect(tracker.laps).toHaveLength(0);

    expect(getLiveElapsedSeconds(tracker, t0)).toBe(0);
    expect(getLiveElapsedSeconds(tracker, t0 + 15000)).toBe(15);
  });

  it("calculates wall-clock elapsed time accurately without drift", () => {
    const t0 = 1700000000000;
    const tracker = startLiveTracker("fietsen", t0);

    // 1234 seconds later
    const t1 = t0 + 1234 * 1000;
    expect(getLiveElapsedSeconds(tracker, t1)).toBe(1234);
  });

  it("freezes elapsed time upon pause", () => {
    const t0 = 1700000000000;
    let tracker = startLiveTracker("hardlopen", t0);

    // Run for 60 seconds
    const t1 = t0 + 60 * 1000;
    expect(getLiveElapsedSeconds(tracker, t1)).toBe(60);

    // Pause at t1
    tracker = pauseLiveTracker(tracker, t1);
    expect(tracker.isPaused).toBe(true);
    expect(tracker.accumulatedSeconds).toBe(60);

    // Time progresses by 10 minutes while paused
    const t2 = t1 + 600 * 1000;
    expect(getLiveElapsedSeconds(tracker, t2)).toBe(60);
  });

  it("handles multiple pause and resume cycles without losing time", () => {
    const t0 = 1700000000000;
    let tracker = startLiveTracker("roeien", t0);

    // 1. Run for 100 seconds
    const t1 = t0 + 100 * 1000;
    tracker = pauseLiveTracker(tracker, t1);
    expect(getLiveElapsedSeconds(tracker, t1)).toBe(100);

    // 2. Paused for 50 seconds
    const t2 = t1 + 50 * 1000;
    expect(getLiveElapsedSeconds(tracker, t2)).toBe(100);

    // 3. Resume at t2 and run for 200 seconds
    tracker = resumeLiveTracker(tracker, t2);
    const t3 = t2 + 200 * 1000;
    expect(getLiveElapsedSeconds(tracker, t3)).toBe(300); // 100 + 200

    // 4. Pause again at t3
    tracker = pauseLiveTracker(tracker, t3);
    const t4 = t3 + 300 * 1000; // paused 5 more minutes
    expect(getLiveElapsedSeconds(tracker, t4)).toBe(300);

    // 5. Resume and run 50 more seconds
    tracker = resumeLiveTracker(tracker, t4);
    const t5 = t4 + 50 * 1000;
    expect(getLiveElapsedSeconds(tracker, t5)).toBe(350); // 300 + 50
  });

  it("records laps and splits with correct duration and split pace", () => {
    const t0 = 1700000000000;
    let tracker = startLiveTracker("hardlopen", t0);

    // Run 1 km in 300 seconds (5:00 /km)
    const t1 = t0 + 300 * 1000;
    tracker = updateLiveDistance(tracker, 1000);
    tracker = addLapSplit(tracker, t1);

    expect(tracker.laps).toHaveLength(1);
    expect(tracker.laps[0].lapNumber).toBe(1);
    expect(tracker.laps[0].lapDurationSeconds).toBe(300);
    expect(tracker.laps[0].totalDurationSeconds).toBe(300);
    expect(tracker.laps[0].lapDistanceMeters).toBe(1000);
    expect(tracker.laps[0].splitPaceFormatted).toBe("5:00 /km");

    // Run another 1 km (total 2 km) in 270 seconds (4:30 /km) -> total 570s
    const t2 = t1 + 270 * 1000;
    tracker = updateLiveDistance(tracker, 2000);
    tracker = addLapSplit(tracker, t2);

    expect(tracker.laps).toHaveLength(2);
    expect(tracker.laps[1].lapNumber).toBe(2);
    expect(tracker.laps[1].lapDurationSeconds).toBe(270);
    expect(tracker.laps[1].totalDurationSeconds).toBe(570);
    expect(tracker.laps[1].lapDistanceMeters).toBe(1000);
    expect(tracker.laps[1].splitPaceFormatted).toBe("4:30 /km");
  });

  it("formats timer output for ergonomic mobile reading", () => {
    expect(formatLiveTimer(0)).toBe("00:00");
    expect(formatLiveTimer(5)).toBe("00:05");
    expect(formatLiveTimer(65)).toBe("01:05");
    expect(formatLiveTimer(599)).toBe("09:59");
    expect(formatLiveTimer(3599)).toBe("59:59");
    expect(formatLiveTimer(3600)).toBe("1:00:00");
    expect(formatLiveTimer(3665)).toBe("1:01:05");
    expect(formatLiveTimer(7325)).toBe("2:02:05");
  });
});
