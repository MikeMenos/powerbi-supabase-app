import { NextResponse } from "next/server";

import { requireAmsaSession } from "@/lib/authSession";
import {
  fetchPowerBiSellersCatalog,
  getUniquePowerBiAreas,
} from "@/lib/reports/areas";
import { getPowerBiToken } from "@/lib/powerBi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { token } = await requireAmsaSession();
    const powerBiAccessToken = await getPowerBiToken(token);
    const records = await fetchPowerBiSellersCatalog(powerBiAccessToken);

    return NextResponse.json({
      ok: true,
      areas: getUniquePowerBiAreas(records),
      records,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Failed to load areas.",
      },
      { status: 500 },
    );
  }
}
