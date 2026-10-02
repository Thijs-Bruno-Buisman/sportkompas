"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { SportKompasDatabase, getDatabase } from "./dexie";
import { createRepositories, type Repositories } from "./index";
import {
  seedDemoDatabase,
  resetDemoDatabase,
  isDemoDatabaseSeeded,
} from "./demo/seedDemo";

interface DatabaseContextValue {
  isDemoMode: boolean;
  isLoading: boolean;
  dataVersion: number;
  db: SportKompasDatabase;
  repositories: Repositories;
  toggleDemoMode: (enable: boolean) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

const STORAGE_KEY = "sportkompas_demo_mode";

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Mount guard & hydration safety: lees pas na client mount
  useEffect(() => {
    let isCancelled = false;
    async function init() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "true") {
          setIsDemoMode(true);
        }
        // Initialiseer standaard oefeningen in de echte DB indien leeg
        const realDb = getDatabase(false);
        const realRepos = createRepositories(realDb);
        await realRepos.exercises.ensureDefaultExercises();
      } catch (err) {
        console.warn("Kon localStorage of basisdata niet initialiseren:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Bepaal de actieve database en repository set
  const activeDb = useMemo(() => getDatabase(isDemoMode), [isDemoMode]);
  const activeRepos = useMemo(() => createRepositories(activeDb), [activeDb]);

  // Wisselen tussen Echte Modus en Demomodus
  const toggleDemoMode = useCallback(async (enable: boolean) => {
    setIsLoading(true);
    try {
      if (enable) {
        const demoDb = getDatabase(true);
        const isSeeded = await isDemoDatabaseSeeded(demoDb);
        if (!isSeeded) {
          await seedDemoDatabase(demoDb);
        }
      }
      setIsDemoMode(enable);
      setDataVersion((v) => v + 1);

      try {
        localStorage.setItem(STORAGE_KEY, enable ? "true" : "false");
      } catch (err) {
        console.warn("Kon demomodus status niet opslaan in localStorage:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Demodata herstellen naar beginstaat in de afzonderlijke demo database
  const resetDemoData = useCallback(async () => {
    setIsLoading(true);
    try {
      const demoDb = getDatabase(true);
      await resetDemoDatabase(demoDb);
      setDataVersion((v) => v + 1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      isDemoMode,
      isLoading,
      dataVersion,
      db: activeDb,
      repositories: activeRepos,
      toggleDemoMode,
      resetDemoData,
    }),
    [
      isDemoMode,
      isLoading,
      dataVersion,
      activeDb,
      activeRepos,
      toggleDemoMode,
      resetDemoData,
    ]
  );

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Custom hook voor toegang tot de actieve database, repositories en demomodus status.
 * Valt veilig terug op de echte database indien buiten een Provider gebruikt (zoals in tests).
 */
export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    const realDb = getDatabase(false);
    return {
      isDemoMode: false,
      isLoading: false,
      dataVersion: 0,
      db: realDb,
      repositories: createRepositories(realDb),
      toggleDemoMode: async () => {},
      resetDemoData: async () => {},
    };
  }
  return context;
}

