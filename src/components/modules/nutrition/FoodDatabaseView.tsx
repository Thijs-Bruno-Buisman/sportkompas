"use client";

import React, { useState, useMemo } from "react";
import {
  Apple,
  UtensilsCrossed,
  Plus,
  Search,
  Star,
  User,
  Filter,
  Trash2,
  Sparkles,
  Camera,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FoodItem, Recipe, FoodCategory } from "@/types/database";
import { FoodItemCard } from "./FoodItemCard";
import { RecipeCard } from "./RecipeCard";
import { FoodItemModal } from "./FoodItemModal";
import { RecipeModal } from "./RecipeModal";
import { BarcodeScannerDialog } from "./BarcodeScannerDialog";
import { ExternalFoodSearchDialog } from "./ExternalFoodSearchDialog";
import type { ParsedExternalFood } from "@/domain/nutrition/openFoodFacts";
import { filterFoods, filterRecipes, getCategoryMetadata } from "@/domain/nutrition/calculations";

interface FoodDatabaseViewProps {
  foods: FoodItem[];
  recipes: Recipe[];
  onSaveFood: (food: FoodItem) => Promise<void>;
  onDeleteFood: (id: string) => Promise<void>;
  onToggleFavoriteFood: (id: string) => Promise<void>;
  onSaveRecipe: (recipe: Recipe) => Promise<void>;
  onDeleteRecipe: (id: string) => Promise<void>;
  onToggleFavoriteRecipe: (id: string) => Promise<void>;
  onSaveExternalFood?: (external: ParsedExternalFood) => Promise<FoodItem>;
  onLookupLocalBarcode?: (barcode: string) => Promise<FoodItem | undefined>;
  isDemoMode?: boolean;
}

export function FoodDatabaseView({
  foods,
  recipes,
  onSaveFood,
  onDeleteFood,
  onToggleFavoriteFood,
  onSaveRecipe,
  onDeleteRecipe,
  onToggleFavoriteRecipe,
  onSaveExternalFood,
  onLookupLocalBarcode,
  isDemoMode = false,
}: FoodDatabaseViewProps) {
  const [activeTab, setActiveTab] = useState<"foods" | "recipes">("foods");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | "alle">("alle");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyCustom, setOnlyCustom] = useState(false);

  // Modals
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState<FoodItem | null>(null);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isExternalSearchOpen, setIsExternalSearchOpen] = useState(false);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "food" | "recipe"; name: string } | null>(null);

  const handleExternalProductSelected = async (product: any) => {
    try {
      if (onSaveExternalFood) {
        await onSaveExternalFood(product);
        setActionNotification(`"${product.name}" succesvol toegevoegd aan je bibliotheek!`);
        setTimeout(() => setActionNotification(null), 3500);
      }
    } catch (err: any) {
      console.error("Fout bij opslaan extern product:", err);
    }
  };

  // Filtered lists
  const filteredFoods = useMemo(() => {
    return filterFoods(foods, {
      query: searchQuery,
      category: selectedCategory,
      onlyFavorites,
      onlyCustom,
    });
  }, [foods, searchQuery, selectedCategory, onlyFavorites, onlyCustom]);

  const filteredRecipes = useMemo(() => {
    return filterRecipes(recipes, {
      query: searchQuery,
      onlyFavorites,
    });
  }, [recipes, searchQuery, onlyFavorites]);

  const categories: Array<{ id: FoodCategory | "alle"; label: string }> = [
    { id: "alle", label: "Alle Categorieën" },
    { id: "vlees_vis_ei", label: "Vlees, Vis & Ei" },
    { id: "zuivel", label: "Zuivel" },
    { id: "granen_brood", label: "Granen & Brood" },
    { id: "groente_fruit", label: "Groente & Fruit" },
    { id: "peulvruchten", label: "Peulvruchten" },
    { id: "noten_zaden", label: "Noten & Zaden" },
    { id: "oliën_sauzen", label: "Oliën & Vetten" },
    { id: "supplementen", label: "Supplementen" },
    { id: "dranken", label: "Dranken" },
    { id: "snacks_zoet", label: "Snacks & Zoet" },
    { id: "overig", label: "Overig" },
  ];

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === "food") {
      await onDeleteFood(itemToDelete.id);
    } else {
      await onDeleteRecipe(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Notificatie banner */}
      {actionNotification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionNotification}</span>
        </div>
      )}

      {/* Top navigatiebalk: Subtabs en Actieknoppen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("foods")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "foods"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Apple className="w-4 h-4 text-emerald-500" />
            Voedingsmiddelen
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-normal">
              {foods.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recipes")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "recipes"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
            Mijn Recepten
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-normal">
              {recipes.length}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "foods" ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsBarcodeScannerOpen(true)}
                leftIcon={<Camera className="w-4 h-4 text-emerald-500" />}
                className="h-10 text-xs"
              >
                Scan Barcode
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsExternalSearchOpen(true)}
                leftIcon={<Sparkles className="w-4 h-4 text-emerald-500" />}
                className="h-10 text-xs"
              >
                Zoek Online
              </Button>
              <Button
                onClick={() => {
                  setFoodToEdit(null);
                  setIsFoodModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
                className="h-10 text-xs"
              >
                Nieuw Product
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                setRecipeToEdit(null);
                setIsRecipeModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="h-10 text-xs"
            >
              Nieuw Recept
            </Button>
          )}
        </div>
      </div>

      {/* Zoek- en filterstrook */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Zoekbalk */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <Input
              placeholder={
                activeTab === "foods"
                  ? "Zoek op productnaam of merk (bijv. havermout, kwark, campina)..."
                  : "Zoek in recepten of ingrediënten..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Wissen
              </button>
            )}
          </div>

          {/* Snelfilters: Favorieten & Eigen */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                onlyFavorites
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-amber-400 text-amber-500" : ""}`} />
              Favorieten
            </button>

            {activeTab === "foods" && (
              <button
                type="button"
                onClick={() => setOnlyCustom(!onlyCustom)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  onlyCustom
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Eigen Producten
              </button>
            )}
          </div>
        </div>

        {/* Categorie-filters (alleen bij Voedingsmiddelen) */}
        {activeTab === "foods" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Inhoud: Voedingsmiddelen Grid */}
      {activeTab === "foods" && (
        <>
          {filteredFoods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFoods.map((food) => (
                <FoodItemCard
                  key={food.id}
                  food={food}
                  onToggleFavorite={onToggleFavoriteFood}
                  onEdit={(f) => {
                    setFoodToEdit(f);
                    setIsFoodModalOpen(true);
                  }}
                  onDelete={(id) => {
                    setItemToDelete({ id, type: "food", name: food.name });
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Apple className="w-12 h-12 text-slate-400" />}
              title="Geen voedingsmiddelen gevonden"
              description={
                searchQuery || selectedCategory !== "alle" || onlyFavorites || onlyCustom
                  ? "Geen producten voldoen aan je huidige zoek- en filtercriteria. Probeer je filters te wissen."
                  : "Er zijn nog geen voedingsmiddelen beschikbaar."
              }
              actionLabel={
                searchQuery || selectedCategory !== "alle" || onlyFavorites || onlyCustom
                  ? "Filters Wissen"
                  : "Nieuw Product Toevoegen"
              }
              onAction={() => {
                if (searchQuery || selectedCategory !== "alle" || onlyFavorites || onlyCustom) {
                  setSearchQuery("");
                  setSelectedCategory("alle");
                  setOnlyFavorites(false);
                  setOnlyCustom(false);
                } else {
                  setFoodToEdit(null);
                  setIsFoodModalOpen(true);
                }
              }}
            />
          )}
        </>
      )}

      {/* Inhoud: Recepten Grid */}
      {activeTab === "recipes" && (
        <>
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onToggleFavorite={onToggleFavoriteRecipe}
                  onEdit={(r) => {
                    setRecipeToEdit(r);
                    setIsRecipeModalOpen(true);
                  }}
                  onDelete={(id) => {
                    setItemToDelete({ id, type: "recipe", name: recipe.name });
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<UtensilsCrossed className="w-12 h-12 text-slate-400" />}
              title="Geen recepten gevonden"
              description={
                searchQuery || onlyFavorites
                  ? "Geen recepten voldoen aan je zoekcriteria."
                  : "Je hebt nog geen eigen recepten samengesteld. Maak een recept aan om maaltijden in één keer te kunnen loggen."
              }
              actionLabel="Nieuw Recept Maken"
              onAction={() => {
                setRecipeToEdit(null);
                setIsRecipeModalOpen(true);
              }}
            />
          )}
        </>
      )}

      {/* Product Toevoegen / Bewerken Modal */}
      <FoodItemModal
        isOpen={isFoodModalOpen}
        onClose={() => {
          setIsFoodModalOpen(false);
          setFoodToEdit(null);
        }}
        onSave={onSaveFood}
        foodToEdit={foodToEdit}
        isDemoMode={isDemoMode}
      />

      {/* Recept Maken / Bewerken Modal */}
      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setRecipeToEdit(null);
        }}
        onSave={onSaveRecipe}
        availableFoods={foods}
        recipeToEdit={recipeToEdit}
        isDemoMode={isDemoMode}
      />

      {/* Verwijder Bevestiging Dialoog */}
      <Dialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title={`${itemToDelete?.type === "food" ? "Product" : "Recept"} Verwijderen`}
        description={`Weet je zeker dat je "${itemToDelete?.name}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
      >
        <DialogFooter>
          <Button variant="ghost" onClick={() => setItemToDelete(null)}>
            Annuleren
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Definitief Verwijderen
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Streepjescodescanner Dialoog */}
      <BarcodeScannerDialog
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onLookupLocalBarcode={onLookupLocalBarcode}
        onSelectProduct={(prod) => {
          handleExternalProductSelected(prod);
        }}
      />

      {/* Online Zoeken Dialoog (Open Food Facts) */}
      <ExternalFoodSearchDialog
        isOpen={isExternalSearchOpen}
        onClose={() => setIsExternalSearchOpen(false)}
        onSelectProduct={(prod) => {
          handleExternalProductSelected(prod);
        }}
        onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
      />
    </div>
  );
}
