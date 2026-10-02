"use client";

import { useEffect, useState, useCallback } from "react";
import { useDatabase } from "@/lib/db";
import type { Profile, AppSettings, UnitPreference } from "@/types/database";

export function useProfile() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const currentProfile = await repositories.profile.getCurrentProfile();
      const currentSettings = await repositories.settings.getSettings();
      setProfile(currentProfile);
      setSettings(currentSettings);
    } catch (error) {
      console.error("Fout bij laden van profiel of instellingen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [repositories]);

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, [loadData, isDemoMode, dataVersion]);

  const saveProfile = async (
    data: Omit<Profile, "id" | "createdAt" | "updatedAt">
  ): Promise<Profile> => {
    const saved = await repositories.profile.upsertProfile(data);
    setProfile(saved);

    // Synchroniseer ook unitPreference in settings
    if (settings && data.unitPreference !== settings.unitPreference) {
      const updatedSettings = await repositories.settings.updateSettings({
        unitPreference: data.unitPreference,
      });
      setSettings(updatedSettings);
    }

    return saved;
  };

  const updateUnitPreference = async (preference: UnitPreference) => {
    if (settings) {
      const updatedSettings = await repositories.settings.updateSettings({
        unitPreference: preference,
      });
      setSettings(updatedSettings);
    }
    if (profile) {
      const updatedProfile = await repositories.profile.save({
        ...profile,
        unitPreference: preference,
        updatedAt: new Date().toISOString(),
      });
      setProfile(updatedProfile);
    }
  };

  const needsOnboarding =
    isMounted && !isLoading && (!profile || !profile.onboardingCompleted);

  return {
    profile,
    settings,
    isDemoMode,
    isLoading: !isMounted || isLoading,
    needsOnboarding,
    saveProfile,
    updateUnitPreference,
    reloadProfile: loadData,
  };
}
