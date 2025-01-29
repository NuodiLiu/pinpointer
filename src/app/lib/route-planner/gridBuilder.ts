import * as turf from "@turf/turf";
import Zone from "../type/Zone";
import { Grid, GridCell } from "../type/GridCell";
import PinnedPoint from "../type/PinnedPoint";
import { gridHeight, gridWidth, transformRowColToLatLng } from "./util";

export function buildCostGrid(
  // gridHeight: number,
  // gridWidth: number,
  zones: Zone[],
  preferredAreas: Zone[],
  baseCost: number = 1
): Grid {
  const grid: Grid = [];

  for (let r = 0; r < gridHeight; r++) {
    const rowCells: GridCell[] = [];
    for (let c = 0; c < gridWidth; c++) {
      const cell: GridCell = {
        row: r,
        col: c,
        cost: baseCost,
      };

      if (isInAnyZone(r, c, zones)) {
        cell.cost = Infinity;
      }

      if (isInAnyZone(r, c, preferredAreas)) {
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


export function isInAnyZone(row: number, col: number, zones: Zone[]): boolean {
  const { lat, lng } = transformRowColToLatLng(row, col);

  const point = turf.point([lng, lat]);

  for (const zone of zones) {
    const polygon = pinnedPointsToGeoJsonPolygon(zone.points);
    if (turf.booleanPointInPolygon(point, polygon)) {
      return true;
    }
  }

  return false;
}
