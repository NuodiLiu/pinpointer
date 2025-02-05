import Heap from 'heap';
import { isValidGridCoordinate } from './util';
import { Grid } from '@/app/types/GridCell';

interface AStarNode {
  row: number;
  col: number;
  g: number;  // cost: from start to current node
  h: number;  // cost: to the end
  f: number;  // g + h
  parent?: AStarNode;
}

/**
 * A* search (8-directional), allowing diagonal movement.
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

  // Construct the starting point
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

  // Main loop
  while (!openList.empty()) {
    // Extract the node with the smallest f value from the openList
    const current = openList.pop()!;
    console.log('Pop from openList:', `(${current.row}, ${current.col})`, 
                `g=${current.g.toFixed(2)} h=${current.h.toFixed(2)} f=${current.f.toFixed(2)}`);

    // Check if the end point is reached
    if (current.row === end.row && current.col === end.col) {
      console.log('Reached END, reconstruct path...');
      const path = reconstructPath(current);
      console.log('Path found:', path);
      return path;
    }

    // Mark as visited
    closedSet.add(getKey(current.row, current.col));

    // Get neighbors
    const neighbors = getNeighbors(grid, current);
    console.log(`Neighbors of (${current.row}, ${current.col}):`, neighbors);

    for (const neighbor of neighbors) {
      const key = getKey(neighbor.row, neighbor.col);
      if (closedSet.has(key)) {
        // Skip if already visited
        // console.log(`  skip neighbor (${neighbor.row}, ${neighbor.col}) in closedSet`);
        continue;
      }

      // Check if the movement is diagonal
      const isDiagonal =
        Math.abs(neighbor.row - current.row) === 1 &&
        Math.abs(neighbor.col - current.col) === 1;
      
      // Calculate the cost to move to the neighbor
      const moveCost = grid[neighbor.row][neighbor.col].cost * (isDiagonal ? Math.SQRT2 : 1);
      const newG = current.g + moveCost;

      let exist = nodeMap.get(key);
      if (!exist) {
        // If the node does not exist, create a new one
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
        // If the node already exists but this path is better, update it
        if (newG < exist.g) {
          console.log(`  found better path for (${exist.row}, ${exist.col}): old g=${exist.g.toFixed(2)}, new g=${newG.toFixed(2)}`);
          exist.g = newG;
          exist.parent = current;
          exist.f = exist.g + exist.h;
          // Ensure that heap.js's updateItem works with the same reference
          openList.updateItem(exist);
        }
      }
    }
  }

  console.log('No path found, return null.');
  return null;
}

/**
 * Get the 8-directional neighboring nodes (excluding out-of-bounds or nodes with cost=∞)
 */
function getNeighbors(grid: Grid, node: AStarNode): AStarNode[] {
  const directions = [
    { dr: -1, dc: 0 },  // up
    { dr: 1,  dc: 0 },  // down
    { dr: 0,  dc: -1 }, // left
    { dr: 0,  dc: 1 },  // right
    { dr: -1, dc: -1 }, // up-left
    { dr: -1, dc: 1 },  // up-right
    { dr: 1,  dc: -1 }, // down-left
    { dr: 1,  dc: 1 },  // down-right
  ];

  const result: AStarNode[] = [];
  for (const { dr, dc } of directions) {
    const nr = node.row + dr;
    const nc = node.col + dc;
    // Boundary check
    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) {
      continue;
    }
    
    // Nodes with cost=∞ are not passable
    if (grid[nr][nc].cost === Infinity) {
      continue;
    }

    // Only fill row/col; g/h/f will be calculated in the main loop
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
 * Backtrack from the endpoint to construct the path
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
 * Heuristic function: uses octile distance (suitable for maps with diagonal movement)
 */
function heuristic(a: { row: number; col: number }, b: { row: number; col: number }): number {
  const D = 1;
  const D2 = Math.SQRT2;
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return D * (dr + dc) + (D2 - 2 * D) * Math.min(dr, dc);
}
