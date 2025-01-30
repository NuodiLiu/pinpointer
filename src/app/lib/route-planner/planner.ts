import PinnedPoint from "@/app/types/PinnedPoint";
import { aStarSearch } from "./aStarSearch";
import { buildCostGrid } from "./gridBuilder";
import { transformLatLngToRowCol, transformRowColToLatLng } from "./util";
import Zone from "@/app/types/Zone";
import { normalizeCoordinate } from "../normalizePoints";

/**
 * 根据“已知顺序”的必经点，依次调用A*搜索并拼接路径
 */
export async function planRouteWithOrderedPoints(
  pinnedPoints: PinnedPoint[],
  zones: Zone[],
  preferredZones: Zone[]
): Promise<{ lat: number; lng: number }[] | null> {
  // 1) 构建 costGrid (含禁区 / 偏好区)
  const costGrid = buildCostGrid(zones, preferredZones, 1);

  const n = pinnedPoints.length;
  if (n < 2) {
    // 如果只有一个点或0点，就没有路线可言，按需求自行处理
    return [];
  }

  let finalPath: { lat: number; lng: number }[] = [];

  // 2) 依次搜索：PinnedPoints[i] -> PinnedPoints[i+1]
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
      // 不可达则返回 null
      return null;
    }

    // 将网格路径转为地理坐标
    const partialGeo = partial.map((node) => {
      const { lat, lng } = transformRowColToLatLng(node.row, node.col);
      return { 
        lat: normalizeCoordinate(lat), 
        lng: normalizeCoordinate(lng)
      };
    });    

    // 3) 拼接到 finalPath
    if (i === 0) {
      // 第一段，直接赋值
      finalPath = partialGeo;
    } else {
      // 后面的段要去掉前一段的最后一个点，避免重复
      finalPath.pop();
      finalPath.push(...partialGeo);
    }
  }

  return finalPath;
}
