"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  fetchProductByBarcode,
  type ParsedExternalFood,
} from "@/domain/nutrition/openFoodFacts";
import type { FoodItem } from "@/types/database";
import {
  Camera,
  Search,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
  Sparkles,
  WifiOff,
} from "lucide-react";

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: {
    name: string;
    brand: string | null;
    category: any;
    caloriesPer100g: number;
    proteinGramsPer100g: number;
    carbsGramsPer100g: number;
    fatGramsPer100g: number;
    fiberGramsPer100g: number;
    defaultPortionGrams: number;
    barcode?: string | null;
    localFoodId?: string;
  }) => void;
  onLookupLocalBarcode?: (barcode: string) => Promise<FoodItem | undefined>;
}

export function BarcodeScannerDialog({
  isOpen,
  onClose,
  onSelectProduct,
  onLookupLocalBarcode,
}: BarcodeScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [foundProduct, setFoundProduct] = useState<ParsedExternalFood | FoodItem | null>(null);
  const [isLocalProduct, setIsLocalProduct] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle barcode result lookup (local first, then Open Food Facts)
  const handleBarcodeFound = useCallback(
    async (rawBarcode: string) => {
      const code = rawBarcode.trim();
      if (!code || isSearching) return;

      setIsSearching(true);
      setSearchStatus(`Barcode ${code} controleren...`);
      setFoundProduct(null);
      setIsOffline(false);

      // Trigger lichte haptische feedback indien ondersteund
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }

      try {
        // 1. Zoek eerst in lokale Dexie database
        if (onLookupLocalBarcode) {
          const localItem = await onLookupLocalBarcode(code);
          if (localItem) {
            setFoundProduct(localItem);
            setIsLocalProduct(true);
            setSearchStatus(`Gevonden in lokale database: ${localItem.name}`);
            setIsSearching(false);
            return;
          }
        }

        // 2. Zoek extern op Open Food Facts
        setSearchStatus("Zoeken op Open Food Facts...");
        const external = await fetchProductByBarcode(code);
        if (external) {
          setFoundProduct(external);
          setIsLocalProduct(false);
          setSearchStatus(`Gevonden op Open Food Facts: ${external.name}`);
        } else {
          setSearchStatus(`Geen product gevonden voor streepjescode ${code}`);
        }
      } catch (err: any) {
        console.error("Fout bij opzoeken streepjescode:", err);
        setIsOffline(true);
        setSearchStatus("Netwerkfout: kon Open Food Facts niet bereiken.");
      } finally {
        setIsSearching(false);
      }
    },
    [isSearching, onLookupLocalBarcode]
  );

  // Start camera stream when dialog opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setFoundProduct(null);
      setSearchStatus(null);
      setManualBarcode("");
      setCameraError(null);
      return;
    }

    let isCancelled = false;

    async function initCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError("Camera niet ondersteund in deze browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setHasCamera(true);
        setCameraError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Activeer BarcodeDetector indien ondersteund
        const win = window as any;
        if ("BarcodeDetector" in win) {
          try {
            const barcodeDetector = new win.BarcodeDetector({
              formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
            });

            scanIntervalRef.current = setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState >= 2 && !isSearching) {
                try {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes.length > 0 && barcodes[0].rawValue) {
                    const rawValue = barcodes[0].rawValue;
                    handleBarcodeFound(rawValue);
                  }
                } catch {
                  // Frame capture negeren
                }
              }
            }, 400);
          } catch {
            // BarcodeDetector initialisatie mislukt
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setHasCamera(false);
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setCameraError("Cameratoegang geweigerd. Voer de streepjescode handmatig in.");
          } else {
            setCameraError("Geen camera gevonden of camera is al in gebruik.");
          }
        }
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [isOpen, stopCamera, handleBarcodeFound, isSearching]);

  // Handle manual submit
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleBarcodeFound(manualBarcode.trim());
  };

  // Add the found product
  const handleConfirmProduct = () => {
    if (!foundProduct) return;

    onSelectProduct({
      name: foundProduct.name,
      brand: foundProduct.brand,
      category: foundProduct.category,
      caloriesPer100g: foundProduct.caloriesPer100g,
      proteinGramsPer100g: foundProduct.proteinGramsPer100g,
      carbsGramsPer100g: foundProduct.carbsGramsPer100g,
      fatGramsPer100g: foundProduct.fatGramsPer100g,
      fiberGramsPer100g: foundProduct.fiberGramsPer100g,
      defaultPortionGrams: foundProduct.defaultPortionGrams,
      barcode: foundProduct.barcode,
      localFoodId: "id" in foundProduct ? foundProduct.id : undefined,
    });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Streepjescode Scannen"
      description="Scan een barcode via de camera of voer het nummer in"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Camera Viewfinder */}
        <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-700 shadow-inner">
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scan box overlay met richtkruisen en laser-animatie */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-3/4 h-1/2 border-2 border-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-0.5 -ml-0.5" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-0.5 -mr-0.5" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-0.5 -ml-0.5" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-0.5 -mr-0.5" />
                  {/* Rode scanlijn */}
                  <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-6 text-slate-400 space-y-2">
              <Camera className="w-10 h-10 mx-auto opacity-50" />
              <p className="text-xs">
                {cameraError || "Camera niet beschikbaar. Gebruik onderstaand invoerveld."}
              </p>
            </div>
          )}

          {/* Status badge in de hoek */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-medium text-white flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                hasCamera ? "bg-emerald-500 animate-ping" : "bg-amber-500"
              }`}
            />
            <span>{hasCamera ? "Camera actief" : "Handmatige modus"}</span>
          </div>
        </div>

        {/* Handmatige barcode zoekbalk */}
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Streepjescode (bijv. 8710400012345)"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            className="h-11 font-mono text-sm"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!manualBarcode.trim() || isSearching}
            className="h-11 px-4 flex items-center gap-1.5 shrink-0"
          >
            {isSearching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Zoeken</span>
          </Button>
        </form>

        {/* Zoekstatus feedback */}
        {searchStatus && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              isOffline
                ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                : foundProduct
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
            ) : foundProduct ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : isSearching ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="truncate">{searchStatus}</span>
          </div>
        )}

        {/* Gevonden Product Kaart */}
        {foundProduct && (
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border-2 border-emerald-500/30 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {foundProduct.name}
                  </span>
                  {isLocalProduct ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Lokaal
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Open Food Facts
                    </span>
                  )}
                </div>
                {foundProduct.brand && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Merk: {foundProduct.brand}
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {foundProduct.caloriesPer100g}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block -mt-1">
                  kcal / 100g
                </span>
              </div>
            </div>

            {/* Macro's per 100g */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-emerald-500/20">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Eiwit</div>
                <div className="font-bold font-mono">{foundProduct.proteinGramsPer100g}g</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Koolh.</div>
                <div className="font-bold font-mono">{foundProduct.carbsGramsPer100g}g</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Vetten</div>
                <div className="font-bold font-mono">{foundProduct.fatGramsPer100g}g</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Vezels</div>
                <div className="font-bold font-mono">{foundProduct.fiberGramsPer100g}g</div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmProduct}
              className="w-full h-11 flex items-center justify-center gap-2 font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Kies dit product</span>
            </Button>
          </div>
        )}

        {/* Annuleren knop */}
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
