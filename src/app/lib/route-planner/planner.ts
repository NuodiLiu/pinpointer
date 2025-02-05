import PinnedPoint from "@/app/types/PinnedPoint";
import { aStarSearch } from "./aStarSearch";
import { buildCostGrid } from "./gridBuilder";
import { transformLatLngToRowCol, transformRowColToLatLng } from "./util";
import Zone from "@/app/types/Zone";
import { normalizeCoordinate } from "../normalizePoints";

/**
 * Calls A* search sequentially for "ordered" mandatory points and stitches the paths together
 */
export async function planRouteWithOrderedPoints(
  pinnedPoints: PinnedPoint[],
  zones: Zone[],
  preferredZones: Zone[]
): Promise<{ lat: number; lng: number }[] | null> {
  // 1)  Build the costGrid (including restricted zones / preferred zones)
  const costGrid = buildCostGrid(zones, preferredZones, 1);

  const n = pinnedPoints.length;
  if (n < 2) {
    // If there is only one or zero points, there is no route to plan; handle accordingly
    return [];
  }

  let finalPath: { lat: number; lng: number }[] = [];

  // 2) Search sequentially: PinnedPoints[i] -> PinnedPoints[i+1]
  for (let i = 0; i < n - 1; i++) {
    const startRC = transformLatLngToRowCol(
      pinnedPoints[i].latitude,
      pinnedPoints[i].longitude
    );
    const endRC = transformLatLngToRowCol(
      pinnedPoints[i + 1].latitude,
      pinnedPoints[i + 1].longitude
    );

    const partial = aStarSearch(costGrid, startRC, endRC);
    if (!partial) {
      // If unreachable, return null
      return null;
    }

    // Convert grid path to geographic coordinates
    const partialGeo = partial.map((node) => {
      const { lat, lng } = transformRowColToLatLng(node.row, node.col);
      return { 
        lat: normalizeCoordinate(lat), 
        lng: normalizeCoordinate(lng)
      };
    });    

    // 3) Append to finalPath
    if (i === 0) {
      // First segment, assign directly
      finalPath = partialGeo;
    } else {
      // Subsequent segments need to remove the last point of the previous segment to avoid duplication
      finalPath.pop();
      finalPath.push(...partialGeo);
    }
  }

  return finalPath;
}
