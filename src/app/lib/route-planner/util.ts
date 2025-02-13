

export const SOUTH_BOUNDARY = -34.2;  // southern lat
export const NORTH_BOUNDARY = -33.5;  // northern lat
export const WEST_BOUNDARY = 150.5;
export const EAST_BOUNDARY = 151.5;

export const BASE_LAT = SOUTH_BOUNDARY; // -34.2
export const BASE_LNG = WEST_BOUNDARY;  // 150.5

// Fetch step size once
export function transformRowColToLatLng(row: number, col: number, STEP_SIZE: number) {
  return {
    lat: BASE_LAT + row * STEP_SIZE, // -34.2 + row * 0.1
    lng: BASE_LNG + col * STEP_SIZE, // 150.5 + col * 0.1
  };
}

export function transformLatLngToRowCol(latitude: number, longitude: number, STEP_SIZE: number) {
  const row = Math.round((latitude - SOUTH_BOUNDARY) / STEP_SIZE);
  const col = Math.round((longitude - WEST_BOUNDARY) / STEP_SIZE);
  return { row, col };
}

export const areCoordinatesClose = (a: number, b: number, tolerance: number) => {
  return Math.abs(a - b) < tolerance;
};

export function isValidGridCoordinate(row: number, col: number, STEP_SIZE:number ): boolean {
  const gridHeight = Math.ceil((NORTH_BOUNDARY - SOUTH_BOUNDARY) / STEP_SIZE);
  const gridWidth  = Math.ceil((EAST_BOUNDARY - WEST_BOUNDARY) / STEP_SIZE);

  if (row < 0 || row >= gridHeight || col < 0 || col >= gridWidth) {
    const { lat, lng } = transformRowColToLatLng(row, col, STEP_SIZE);
    console.warn(`Warning: Coordinate (row=${row}, col=${col}) is out of bounds!`);
    console.warn(`Corresponding lat/lng: (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    console.warn(`Valid range: row=[0, ${gridHeight - 1}], col=[0, ${gridWidth - 1}]`);
    console.warn("Some points are outside of Sydney area. Auto routing is not yet supported.");
    return false;
  }
  return true;
}