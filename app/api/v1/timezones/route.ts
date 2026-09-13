import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/auth/api-auth";
import {
  COUNTRY_TIMEZONES,
  getLiveTimeInTimezone,
  getLiveOffsetInTimezone,
} from "@/lib/constants/timezones";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").toLowerCase().trim();
  const region = searchParams.get("region");

  const now = new Date();

  let results = COUNTRY_TIMEZONES;

  if (region) {
    results = results.filter((t) => t.region.toLowerCase() === region.toLowerCase());
  }

  if (search) {
    results = results.filter(
      (t) =>
        t.country.toLowerCase().includes(search) ||
        t.label.toLowerCase().includes(search) ||
        t.value.toLowerCase().includes(search) ||
        t.cities.toLowerCase().includes(search) ||
        t.offset.toLowerCase().includes(search)
    );
  }

  const enriched = results.map((tz) => ({
    ...tz,
    currentTime: getLiveTimeInTimezone(tz.value, now),
    currentOffset: getLiveOffsetInTimezone(tz.value, now) || tz.offset,
  }));

  return apiSuccess({
    total: enriched.length,
    timezones: enriched,
  });
}
