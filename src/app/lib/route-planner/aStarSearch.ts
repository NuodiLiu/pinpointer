import Heap from 'heap';
import { isValidGridCoordinate } from './util';

export interface GridCell {
  row: number;
  col: number;
  cost: number; // 该格的基本代价(≥ 0)，∞ 表示不可通行
}

export type Grid = GridCell[][];

interface AStarNode {
  row: number;
  col: number;
  g: number;  // 从起点到此节点的已知代价
  h: number;  // 启发式(到终点的预估)
  f: number;  // g + h
  parent?: AStarNode;
}

/**
 * A* 搜索 (8 向)，且允许对角线移动。
 */
export function aStarSearch(
  grid: Grid,
  start: { row: number; col: number },
  end: { row: number; col: number }
): AStarNode[] | null {
  console.log('=== A* START ===');
  console.log('Start:', start, 'End:', end);
  console.log("Grid size:", grid.length, grid[0].length);

  if (!isValidGridCoordinate(start.row, start.col) || !isValidGridCoordinate(end.row, end.col)) {
    return null;
  }

  const openList = new Heap<AStarNode>((a, b) => a.f - b.f);
  const closedSet = new Set<string>();

  // 构建起点
  const startNode: AStarNode = {
    row: start.row,
    col: start.col,
    g: 0,
    h: heuristic(start, end),
    f: 0,
  };
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);

  const nodeMap = new Map<string, AStarNode>();
  nodeMap.set(getKey(startNode.row, startNode.col), startNode);

  // 主循环
  while (!openList.empty()) {
    // 从 openList 中取出 f 最小节点
    const current = openList.pop()!;
    console.log('Pop from openList:', `(${current.row}, ${current.col})`, 
                `g=${current.g.toFixed(2)} h=${current.h.toFixed(2)} f=${current.f.toFixed(2)}`);

    // 检查是否到终点
    if (current.row === end.row && current.col === end.col) {
      console.log('Reached END, reconstruct path...');
      const path = reconstructPath(current);
      console.log('Path found:', path);
      return path;
    }

    // 标记为已访问
    closedSet.add(getKey(current.row, current.col));

    // 获取邻居
    const neighbors = getNeighbors(grid, current);
    console.log(`Neighbors of (${current.row}, ${current.col}):`, neighbors);

    for (const neighbor of neighbors) {
      const key = getKey(neighbor.row, neighbor.col);
      if (closedSet.has(key)) {
        // 已经访问过了，跳过
        // console.log(`  skip neighbor (${neighbor.row}, ${neighbor.col}) in closedSet`);
        continue;
      }

      // 是否对角线移动
      const isDiagonal =
        Math.abs(neighbor.row - current.row) === 1 &&
        Math.abs(neighbor.col - current.col) === 1;
      
      // 计算走到 neighbor 的花费
      const moveCost = grid[neighbor.row][neighbor.col].cost * (isDiagonal ? Math.SQRT2 : 1);
      const newG = current.g + moveCost;

      let exist = nodeMap.get(key);
      if (!exist) {
        // 创建新节点
        const node: AStarNode = {
          row: neighbor.row,
          col: neighbor.col,
          g: newG,
          h: heuristic(neighbor, end),
          f: 0,
          parent: current,
        };
        node.f = node.g + node.h;

        nodeMap.set(key, node);
        openList.push(node);
        console.log(`  push neighbor (${node.row}, ${node.col}) g=${node.g.toFixed(2)}, h=${node.h.toFixed(2)}, f=${node.f.toFixed(2)}`);
      } else {
        // 若已有节点，但这条路径更优，则更新
        if (newG < exist.g) {
          console.log(`  found better path for (${exist.row}, ${exist.col}): old g=${exist.g.toFixed(2)}, new g=${newG.toFixed(2)}`);
          exist.g = newG;
          exist.parent = current;
          exist.f = exist.g + exist.h;
          // heap.js 的 updateItem 要保证是同一个引用
          openList.updateItem(exist);
        }
      }
    }
  }

  console.log('No path found, return null.');
  return null;
}

/**
 * 获取 8 个方向的邻居节点（不含越界或 cost=∞ 的节点）
 */
function getNeighbors(grid: Grid, node: AStarNode): AStarNode[] {
  const directions = [
    { dr: -1, dc: 0 },  // 上
    { dr: 1,  dc: 0 },  // 下
    { dr: 0,  dc: -1 }, // 左
    { dr: 0,  dc: 1 },  // 右
    { dr: -1, dc: -1 }, // 左上
    { dr: -1, dc: 1 },  // 右上
    { dr: 1,  dc: -1 }, // 左下
    { dr: 1,  dc: 1 },  // 右下
  ];

  const result: AStarNode[] = [];
  for (const { dr, dc } of directions) {
    const nr = node.row + dr;
    const nc = node.col + dc;
    // 边界检测
    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) {
      continue;
    }
    
    // cost=∞ 的格子无法通行
    if (grid[nr][nc].cost === Infinity) {
      continue;
    }

    // 仅填 row/col，g/h/f 在主循环里再计算
    result.push({
      row: nr,
      col: nc,
      g: 0,
      h: 0,
      f: 0,
    });
  }

  return result;
}

/**
 * 回溯终点，构建路径
 */
function reconstructPath(endNode: AStarNode): AStarNode[] {
  const path: AStarNode[] = [];
  let curr: AStarNode | undefined = endNode;
  while (curr) {
    path.push(curr);
    curr = curr.parent;
  }
  return path.reverse();
}

function getKey(r: number, c: number): string {
  return `${r},${c}`;
}

/**
 * 启发函数：使用八方向距离（适用于含对角线的地图）
 */
function heuristic(a: { row: number; col: number }, b: { row: number; col: number }): number {
  const D = 1;
  const D2 = Math.SQRT2;
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return D * (dr + dc) + (D2 - 2 * D) * Math.min(dr, dc);
}
