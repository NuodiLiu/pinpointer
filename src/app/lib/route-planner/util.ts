// boundaries.ts
export const SOUTH_BOUNDARY = -34.2;  // southern lat
export const NORTH_BOUNDARY = -33.5;  // northern lat
export const WEST_BOUNDARY = 150.5;
export const EAST_BOUNDARY = 151.5;

export const STEP_SIZE = 0.03; // 0.005 ideal

export const gridHeight = Math.ceil((NORTH_BOUNDARY - SOUTH_BOUNDARY) / STEP_SIZE);
export const gridWidth  = Math.ceil((EAST_BOUNDARY - WEST_BOUNDARY) / STEP_SIZE);

export const BASE_LAT = SOUTH_BOUNDARY; // -34.2
export const BASE_LNG = WEST_BOUNDARY;  // 150.5

export function transformRowColToLatLng(row: number, col: number) {
  return {
    lat: BASE_LAT + row * STEP_SIZE, // -34.2 + row * 0.1
    lng: BASE_LNG + col * STEP_SIZE, // 150.5 + col * 0.1
  };
}

export function transformLatLngToRowCol(latitude: number, longitude: number) {
  const row = Math.round((latitude - SOUTH_BOUNDARY) / STEP_SIZE);
  const col = Math.round((longitude - WEST_BOUNDARY) / STEP_SIZE);
  return { row, col };
}
