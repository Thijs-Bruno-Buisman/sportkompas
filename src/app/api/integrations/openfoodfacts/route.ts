import { NextRequest, NextResponse } from "next/server";
import {
  parseOpenFoodFactsProduct,
  getMockOpenFoodFactsProducts,
} from "@/domain/nutrition/openFoodFacts";

const USER_AGENT = "SportKompas - FitnessApp/1.0 - Web/Desktop (https://sportkompas.app)";

/**
 * GET /api/integrations/openfoodfacts
 * Veilige server-side proxy voor Open Food Facts barcode lookups en zoekacties.
 * Voorkomt CORS-blokkades en zorgt voor een conforme User-Agent header conform API-richtlijnen.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "status";
  const barcode = searchParams.get("barcode");
  const query = searchParams.get("query") || searchParams.get("search");

  // 1. Status controle
  if (action === "status" && !barcode && !query) {
    return NextResponse.json({
      status: "ok",
      service: "Open Food Facts",
      isAvailable: true,
      message:
        "Open Food Facts publieke voedingsdatabase is beschikbaar zonder verplichte API-sleutel.",
    });
  }

  // 2. Demo modus
  if (action === "demo") {
    const mockProducts = getMockOpenFoodFactsProducts();
    if (barcode) {
      const match = mockProducts.find((p) => p.barcode === barcode.trim());
      if (match) {
        return NextResponse.json({ success: true, isDemo: true, product: match });
      }
      return NextResponse.json(
        { error: "Product niet gevonden in demodata.", isDemo: true },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      isDemo: true,
      products: mockProducts,
    });
  }

  // 3. Barcode Lookup Proxy
  if (barcode) {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode || !/^\d{6,14}$/.test(cleanBarcode)) {
      return NextResponse.json(
        { error: "Ongeldige streepjescode. Een geldige EAN/UPC barcode bevat 6 tot 14 cijfers." },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
        cleanBarcode
      )}.json?fields=code,product_name,product_name_nl,generic_name,generic_name_nl,brands,nutriments,categories_tags,serving_quantity,serving_size,image_front_small_url`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: `Geen product gevonden voor streepjescode ${cleanBarcode}.` },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: `Open Food Facts API retourneerde HTTP status ${response.status}.` },
          { status: response.status }
        );
      }

      const json = await response.json();
      if (json.status === 1 && json.product) {
        const parsed = parseOpenFoodFactsProduct(json.product);
        if (parsed) {
          return NextResponse.json({
            success: true,
            product: parsed,
          });
        }
      }

      return NextResponse.json(
        { error: `Geen bruikbare productgegevens gevonden voor barcode ${cleanBarcode}.` },
        { status: 404 }
      );
    } catch (err: any) {
      if (err.name === "AbortError") {
        return NextResponse.json(
          { error: "Verzoek naar Open Food Facts is verlopen (timeout na 6 seconden)." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        {
          error: "Kon geen verbinding maken met Open Food Facts servers.",
          message: err.message,
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 4. Query Zoeken Proxy
  if (query) {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return NextResponse.json({ success: true, products: [] });
    }

    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const url = `https://nl.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        cleanQuery
      )}&search_simple=1&action=process&json=1&page_size=${Math.min(30, Math.max(1, limit))}&fields=code,product_name,product_name_nl,generic_name,generic_name_nl,brands,nutriments,categories_tags,serving_quantity,serving_size,image_front_small_url`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Open Food Facts zoekfout: HTTP ${response.status}.` },
          { status: response.status }
        );
      }

      const json = await response.json();
      const products: any[] = Array.isArray(json?.products) ? json.products : [];
      const parsedList = products
        .map((p) => parseOpenFoodFactsProduct(p))
        .filter((p): p is NonNullable<typeof p> => p !== null);

      return NextResponse.json({
        success: true,
        products: parsedList,
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        return NextResponse.json(
          { error: "Zoekverzoek naar Open Food Facts is verlopen." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        {
          error: "Kon Open Food Facts zoekopdracht niet voltooien.",
          message: err.message,
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return NextResponse.json(
    { error: "Geen geldige zoekparameter opgegeven (verwacht barcode of query)." },
    { status: 400 }
  );
}
