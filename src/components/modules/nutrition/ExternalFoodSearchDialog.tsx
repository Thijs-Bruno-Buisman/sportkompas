"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  searchOpenFoodFacts,
  type ParsedExternalFood,
} from "@/domain/nutrition/openFoodFacts";
import {
  Search,
  Camera,
  RefreshCw,
  Sparkles,
  WifiOff,
  AlertCircle,
  Plus,
  BookOpen,
} from "lucide-react";

interface ExternalFoodSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: ParsedExternalFood) => void;
  onOpenBarcodeScanner: () => void;
}

export function ExternalFoodSearchDialog({
  isOpen,
  onClose,
  onSelectProduct,
  onOpenBarcodeScanner,
}: ExternalFoodSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ParsedExternalFood[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const results = await searchOpenFoodFacts(query, { limit: 15 });
      setSearchResults(results);
    } catch (err: any) {
      console.error("Fout bij online zoeken:", err);
      setErrorMessage("Kon geen verbinding maken met Open Food Facts. Controleer je internetverbinding.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (product: ParsedExternalFood) => {
    onSelectProduct(product);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Online Voedingsmiddelen Zoeken"
      description="Zoek in de wereldwijde Open Food Facts database of scan een streepjescode"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Zoekbalk & Barcode knop */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Zoek online (bijv. Alpro Sojamelk, Skyr, Snickers)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={!searchQuery.trim() || isSearching}
            className="h-11 px-4 flex items-center gap-1.5 shrink-0"
          >
            {isSearching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Zoeken</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
              onOpenBarcodeScanner();
            }}
            className="h-11 px-3 flex items-center gap-1.5 shrink-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            title="Scan streepjescode via camera"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </Button>
        </form>

        {/* Foutmelding / offline feedback */}
        {errorMessage && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Resultatenlijst */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {isSearching ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-500" />
              <p className="text-sm">Zoeken in Open Food Facts...</p>
            </div>
          ) : hasSearched && searchResults.length === 0 && !errorMessage ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Geen producten gevonden voor &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs">
                Probeer een algemenere zoekterm of scan de barcode direct van de verpakking.
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((product, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-emerald-500/50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {product.name}
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Open Food Facts
                    </span>
                  </div>
                  {product.brand && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Merk: {product.brand}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {product.caloriesPer100g} kcal
                    </span>
                    <span>•</span>
                    <span>E: {product.proteinGramsPer100g}g</span>
                    <span>•</span>
                    <span>K: {product.carbsGramsPer100g}g</span>
                    <span>•</span>
                    <span>V: {product.fatGramsPer100g}g</span>
                    <span>•</span>
                    <span>Vezels: {product.fiberGramsPer100g}g</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelect(product)}
                    className="h-10 text-xs flex items-center gap-1.5 w-full sm:w-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Selecteren</span>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-emerald-500 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Zoek online in miljoenen voedingsmiddelen
              </p>
              <p className="text-xs max-w-sm mx-auto">
                Typ de naam van een merk of product, of gebruik de cameraknop om de streepjescode rechtstreeks vanaf de verpakking te scannen.
              </p>
            </div>
          )}
        </div>

        {/* Sluitknop */}
        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-10 min-w-[80px]"
          >
            Sluiten
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
