import { NextResponse } from "next/server";

import { requireAmsaSession } from "@/lib/authSession";
import { getPowerBiToken } from "@/lib/powerBi";
import {
  getAvailableReportPageCodes,
} from "@/lib/reports/areaCategoryTargets";
import { fetchAreaCategoryTargets } from "@/lib/reports/areaCategoryTargetsApi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const area = new URL(request.url).searchParams.get("area")?.trim() ?? "";
  if (!area) {
    return NextResponse.json(
      { ok: false, message: "Missing area." },
      { status: 400 },
    );
  }

  try {
    const { token } = await requireAmsaSession();
    const powerBiAccessToken = await getPowerBiToken(token);
    const record = await fetchAreaCategoryTargets(powerBiAccessToken, area);

    return NextResponse.json({
      ok: true,
      area,
      record,
      availablePageCodes: getAvailableReportPageCodes(record),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load area report availability.",
      },
      { status: 500 },
    );
  }
}
