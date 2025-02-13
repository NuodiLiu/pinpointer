import { planRouteWithOrderedPoints } from "@/app/lib/route-planner/planner";
import PinnedPoint from "@/app/types/PinnedPoint";
import Zone from "@/app/types/Zone";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { pinnedPoints, zones, preferredZones, STEP_SIZE } = await request.json() as {
      pinnedPoints: PinnedPoint[];
      zones: Zone[];
      preferredZones: Zone[];
      STEP_SIZE: number;
    };

    const route = await planRouteWithOrderedPoints(
      pinnedPoints,
      zones,
      preferredZones,
      STEP_SIZE
    );

    if (!route) {
      return NextResponse.json({ success: false, message: "No route found" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: route });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server Error" },
      { status: 500 }
    );
  }
}
