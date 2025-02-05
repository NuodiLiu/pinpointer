export interface GridCell {
  row: number;
  col: number;
  cost: number; // base cost >= 0, infinite cost when in zone
}

export type Grid = GridCell[][];
