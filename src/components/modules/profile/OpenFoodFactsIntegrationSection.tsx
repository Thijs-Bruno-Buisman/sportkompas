"use client";

import React, { useState, useEffect } from "react";
import {
  Apple,
  Barcode,
  Search,
  CheckCircle2,
  Database,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useDatabase } from "@/lib/db";
import {
  fetchProductByBarcode,
  searchOpenFoodFacts,
  getMockOpenFoodFactsProducts,
  type ParsedExternalFood,
} from "@/domain/nutrition/openFoodFacts";

export function OpenFoodFactsIntegrationSection() {
  const { repositories } = useDatabase();

  const [cachedItemsCount, setCachedItemsCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  // Test Dialog State
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testBarcode, setTestBarcode] = useState("8710400041234");
  const [isSearching, setIsSearching] = useState(false);
  const [testResult, setTestResult] = useState<ParsedExternalFood | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const allItems = await repositories.nutrition.getAllFoods();
        if (isMounted) {
          setCachedItemsCount(allItems.length);
        }
      } catch {
        if (isMounted) setCachedItemsCount(0);
      } finally {
        if (isMounted) setIsLoadingCount(false);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [repositories]);

  const handleTestLookup = async (codeToTest?: string) => {
    const code = (codeToTest || testBarcode).trim();
    if (!code) return;

    setIsSearching(true);
    setTestError(null);
    setTestResult(null);

    try {
      // Probeer eerst via lokale /api/integrations/openfoodfacts proxy
      const res = await fetch(`/api/integrations/openfoodfacts?barcode=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          setTestResult(data.product);
          return;
        }
      }

      // Fallback: directe aanroep van domain fetcher
      const direct = await fetchProductByBarcode(code);
      if (direct) {
        setTestResult(direct);
      } else {
        // Fallback naar demo mock data indien offline
        const mocks = getMockOpenFoodFactsProducts();
        const foundMock = mocks.find((m) => m.barcode === code);
        if (foundMock) {
          setTestResult(foundMock);
        } else {
          setTestError(`Geen product gevonden voor streepjescode ${code}.`);
        }
      }
    } catch {
      // Graceful demo fallback
      const mocks = getMockOpenFoodFactsProducts();
      const foundMock = mocks.find((m) => m.barcode === code);
      if (foundMock) {
        setTestResult(foundMock);
      } else {
        setTestError("Netwerkfout: kon Open Food Facts niet bereiken.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Open Food Facts Voedingsdatabase
                  <Badge variant="success">Actief (Publieke Open Data)</Badge>
                </CardTitle>
                <CardDescription>
                  Wereldwijde open voedingsmiddelendatabase voor barcode-scanning en online productopzoeking.
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTestResult(null);
                setTestError(null);
                setIsTestDialogOpen(true);
              }}
              leftIcon={<Barcode className="w-4 h-4" />}
            >
              Test Barcode Lookup
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Offline-First Voedingscache: {isLoadingCount ? "..." : `${cachedItemsCount} producten`}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Ieder product dat je via de streepjescodescanner of online zoekbalk selecteert,
                wordt direct lokaal in IndexedDB opgeslagen. Volgende scans van hetzelfde product
                werken daardoor 100% offline en ogenblikkelijk.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://nl.openfoodfacts.org"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center gap-1 font-medium"
              >
                Bezoek Open Food Facts
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Geen account of API-sleutel nodig. Open Food Facts is een vrije open collaborative database.
              SportKompas stuurt een geidentificeerde User-Agent header mee en respecteert fair-use serverlimieten.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Test Dialog */}
      <Dialog
        isOpen={isTestDialogOpen}
        onClose={() => setIsTestDialogOpen(false)}
        title="Open Food Facts Barcode Lookup Testen"
        description="Voer een EAN streepjescode in of kies een voorbeeld om de server-side proxy en parser te testen."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testBarcode}
              onChange={(e) => setTestBarcode(e.target.value)}
              placeholder="Bijv. 8710400041234"
              className="h-10"
            />
            <Button
              type="button"
              variant="primary"
              onClick={() => handleTestLookup()}
              disabled={isSearching || !testBarcode.trim()}
              leftIcon={
                isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )
              }
            >
              Opzoeken
            </Button>
          </div>

          {/* Quick chip buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Snelle testvoorbeelden:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { code: "8710400041234", name: "Arla Skyr" },
                { code: "8712100012345", name: "Calvé Pindakaas" },
                { code: "8710400123456", name: "Quaker Havermout" },
                { code: "8710400987654", name: "Alpro Sojadrink" },
              ].map((chip) => (
                <button
                  key={chip.code}
                  type="button"
                  onClick={() => {
                    setTestBarcode(chip.code);
                    handleTestLookup(chip.code);
                  }}
                  className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {chip.name} ({chip.code})
                </button>
              ))}
            </div>
          </div>

          {testError && (
            <Alert variant="error" onDismiss={() => setTestError(null)}>
              {testError}
            </Alert>
          )}

          {testResult && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    {testResult.name}
                    <Badge variant="outline" className="text-[10px]">
                      {testResult.category}
                    </Badge>
                  </div>
                  {testResult.brand && (
                    <div className="text-xs text-slate-500">{testResult.brand}</div>
                  )}
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    Barcode: {testResult.barcode}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {testResult.caloriesPer100g} kcal
                  </div>
                  <div className="text-[11px] text-slate-400">per 100g</div>
                </div>
              </div>

              {/* Macro grid */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                <div className="p-1.5 rounded bg-white dark:bg-slate-800/80">
                  <div className="text-[10px] text-slate-400">Eiwit</div>
                  <div className="text-xs font-semibold text-blue-500">
                    {testResult.proteinGramsPer100g}g
                  </div>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-slate-800/80">
                  <div className="text-[10px] text-slate-400">Koolhydraten</div>
                  <div className="text-xs font-semibold text-amber-500">
                    {testResult.carbsGramsPer100g}g
                  </div>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-slate-800/80">
                  <div className="text-[10px] text-slate-400">Vetten</div>
                  <div className="text-xs font-semibold text-rose-500">
                    {testResult.fatGramsPer100g}g
                  </div>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-slate-800/80">
                  <div className="text-[10px] text-slate-400">Vezels</div>
                  <div className="text-xs font-semibold text-emerald-500">
                    {testResult.fiberGramsPer100g}g
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTestDialogOpen(false)}
            >
              Sluiten
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
