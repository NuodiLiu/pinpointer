import * as turf from "@turf/turf";
import { EAST_BOUNDARY, NORTH_BOUNDARY, SOUTH_BOUNDARY, transformRowColToLatLng, WEST_BOUNDARY } from "./util";
import Zone from "@/app/types/Zone";
import PinnedPoint from "@/app/types/PinnedPoint";
import { Grid, GridCell } from "@/app/types/GridCell";

export function buildCostGrid(
  // gridHeight: number,
  // gridWidth: number,
  zones: Zone[],
  preferredAreas: Zone[],
  baseCost: number = 1,
  STEP_SIZE: number
): Grid {
  const grid: Grid = [];
  const gridHeight = Math.ceil((NORTH_BOUNDARY - SOUTH_BOUNDARY) / STEP_SIZE);
  const gridWidth  = Math.ceil((EAST_BOUNDARY - WEST_BOUNDARY) / STEP_SIZE);

  for (let r = 0; r < gridHeight; r++) {
    const rowCells: GridCell[] = [];
    for (let c = 0; c < gridWidth; c++) {
      const cell: GridCell = {
        row: r,
        col: c,
        cost: baseCost,
      };

      if (isInAnyZone(r, c, zones, STEP_SIZE)) {
        cell.cost = Infinity;
      }

      if (isInAnyZone(r, c, preferredAreas, STEP_SIZE)) {
        cell.cost *= 0.5;
      }

      rowCells.push(cell);
    }
    grid.push(rowCells);
  }

  return grid;
}

export function pinnedPointsToGeoJsonPolygon(points: PinnedPoint[]) {
  const coordinates: number[][] = points.map((p) => [p.longitude, p.latitude]);

  if (
    coordinates.length > 0 &&
    (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length - 1][1])
  ) {
    coordinates.push(coordinates[0]);
  }

  return turf.polygon([coordinates]);
}


export function isInAnyZone(row: number, col: number, zones: Zone[], STEP_SIZE: number): boolean {
  const { lat, lng } = transformRowColToLatLng(row, col, STEP_SIZE);

  const point = turf.point([lng, lat]);

  for (const zone of zones) {
    const polygon = pinnedPointsToGeoJsonPolygon(zone.points);
    if (turf.booleanPointInPolygon(point, polygon)) {
      return true;
    }
  }

  return false;
}
