import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/auth/api-auth";
import {
  WORLD_CURRENCIES,
  formatCurrencySample,
} from "@/lib/constants/currencies";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").toLowerCase().trim();
  const region = searchParams.get("region");

  let results = WORLD_CURRENCIES;

  if (region) {
    results = results.filter((c) => c.region.toLowerCase() === region.toLowerCase());
  }

  if (search) {
    results = results.filter(
      (c) =>
        c.code.toLowerCase().includes(search) ||
        c.name.toLowerCase().includes(search) ||
        c.country.toLowerCase().includes(search) ||
        c.symbol.toLowerCase().includes(search) ||
        (c.symbolNative && c.symbolNative.toLowerCase().includes(search))
    );
  }

  const enriched = results.map((c) => ({
    ...c,
    sampleFormatted: formatCurrencySample(c.code, 10000),
  }));

  return apiSuccess({
    total: enriched.length,
    currencies: enriched,
  });
}
