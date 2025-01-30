// lib/normalizePoints.ts

export const normalizeCoordinate = (value: number): number => {
  return Number(value.toFixed(6)); // Round to 6 decimal places
};

export const normalizePoints = (
  points: { lat: number; lng: number }[]
): { lat: number; lng: number }[] => {
  return points.map((p) => ({
    lat: normalizeCoordinate(p.lat),
    lng: normalizeCoordinate(p.lng),
  }));
};
