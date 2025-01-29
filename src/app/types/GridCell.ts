export interface GridCell {
  row: number;
  col: number;
  cost: number; // 该格的基本代价(≥ 0)，∞ 表示不可通行
}

export type Grid = GridCell[][];
