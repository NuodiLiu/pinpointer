import Group from "../types/Group";
import PinnedPoint from "../types/PinnedPoint";


export function adaptGeoJsonToData(
  geoJson: any 
): { pinnedPoints: PinnedPoint[]; groups: Group[] } {
  // 1. 基本校验
  if (!geoJson || geoJson.type !== "FeatureCollection") {
    throw new Error("The file data is not a valid GeoJSON FeatureCollection.");
  }
  if (!Array.isArray(geoJson.features)) {
    throw new Error("Invalid GeoJSON: 'features' is not an array.");
  }

  const features: GeoJsonFeature[] = geoJson.features;

  // 2. 我们想要的业务数据结构
  //    pinnedPoints: PinnedPoint[];
  //    groups: Group[];
  //
  //   在之前“正向转换”时，常常把 group 的信息 (groupId, groupName, color 等) 
  //   放到 feature.properties 里。现在我们就要逆过来拿到它们。

  const pinnedPointsMap = new Map<string, PinnedPoint>();
  // 如果一个 point 可能属于多个 group，需要一个 { pointId -> Set<GroupId> } 的结构
  // 也可以把 groupId 等信息直接保存到 pinnedPoint 里，视业务而定。
  const pointToGroupIdsMap = new Map<string, Set<string>>();

  // 3. 遍历每条 Feature，解析出 pinnedPoints
  for (const feature of features) {
    const { properties, geometry } = feature;
    if (geometry?.type !== "Point") {
      // 如果你只关心点数据，可跳过或抛错
      // throw new Error(`Unsupported geometry type: ${geometry?.type}`);
      continue;
    }
    const coordinates = geometry.coordinates; // [lng, lat, height?]
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      continue; // 或抛错
    }

    // 取出 properties 里的信息
    const pointId = properties.pointId || "";
    const pointName = properties.pointName || "";
    const groupIds = properties.groupIds || []; 
    //   在之前正向转换中，这里可能是 groupId, groupIds 或 groupName 等
    //   需要根据你的实际逻辑来取。如果只可能属于一个 group，那就不是数组了。

    const longitude = coordinates[0];
    const latitude = coordinates[1];
    const height = coordinates[2] ?? 0;

    // 如果 pinnedPointsMap 中已经没有此 point，才新建
    if (!pinnedPointsMap.has(pointId)) {
      pinnedPointsMap.set(pointId, {
        id: pointId,
        name: pointName,
        latitude,
        longitude,
        height,
      });
    }

    // 记录 pointId -> groupId 映射
    if (!pointToGroupIdsMap.has(pointId)) {
      pointToGroupIdsMap.set(pointId, new Set<string>());
    }
    if (Array.isArray(groupIds)) {
      groupIds.forEach((gid: string) => pointToGroupIdsMap.get(pointId)!.add(gid));
    } else if (typeof groupIds === "string" && groupIds) {
      pointToGroupIdsMap.get(pointId)!.add(groupIds);
    }
  }

  // 4. 生成 pinnedPoints 数组
  const pinnedPoints: PinnedPoint[] = Array.from(pinnedPointsMap.values());

  // 5. 生成 groups 数组
  //   如果之前正向转换里是单个 groupId，那么这里就只会有一个 group
  //   如果可能多个 group，需要自己处理 groupName/groupColor 等映射。
  //   这里演示：假定 groupId 就是 groupName（或通过某种映射拿到 name、color）。
  //   真实业务中，group 的信息可从 properties 里再取，比如 properties.groupName。
  //   也可以在本地保存一个 groupId -> group信息 的映射表，进行组装。

  // 先做个示例，把提取到的 groupIds 全部放成一个“空 group”，只做演示
  // 你也可以根据 feature.properties 里的 groupName, groupColor 等信息来组装
  const groupsMap = new Map<string, Group>();
  for (const [pointId, groupIds] of pointToGroupIdsMap.entries()) {
    for (const gid of groupIds) {
      if (!groupsMap.has(gid)) {
        groupsMap.set(gid, {
          id: gid,
          name: gid,            // 假设 name = groupId
          color: "#ff0000",     // 需要真实逻辑的话，就从 properties 里获取
          pinnedPoints: [],
          isVisible: true,      // 看你业务如何设置
          isSelected: false,    // 看你业务如何设置
        });
      }
      // 把 pinnedPoint 加进 pinnedPoints
      const point = pinnedPointsMap.get(pointId);
      if (point) {
        groupsMap.get(gid)!.pinnedPoints.push(point);
      }
    }
  }

  // 6. 转换为数组
  const groups: Group[] = Array.from(groupsMap.values());

  return {
    pinnedPoints,
    groups,
  };
}


export function convertToGeoJson(
  pinnedPoints: PinnedPoint[],
  groups: Group[]
): GeoJsonFeatureCollection {
  // 生成一个 Map<pointId, string[]>，用于记录 point 属于哪些 groupId
  const pointToGroupsMap = new Map<string, string[]>();

  groups.forEach((group) => {
    group.pinnedPoints.forEach((p) => {
      if (!pointToGroupsMap.has(p.id)) {
        pointToGroupsMap.set(p.id, []);
      }
      pointToGroupsMap.get(p.id)!.push(group.id);
    });
  });

  // 构造 FeatureCollection
  const features: GeoJsonFeature[] = pinnedPoints.map((point) => {
    // 找出这个 point 所属的 groupId 列表
    const groupIds = pointToGroupsMap.get(point.id) || [];
    return {
      type: "Feature",
      properties: {
        pointId: point.id,
        pointName: point.name,
        groupIds, // 这里存放所有 groupId，如果你想多存些信息，可在此扩展
      },
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude, point.height],
      },
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
}