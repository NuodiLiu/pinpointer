import Group from "../types/Group";
import PinnedPoint from "../types/PinnedPoint";


export function adaptGeoJsonToData(
  geoJson: any 
): { pinnedPoints: PinnedPoint[]; groups: Group[] } {
  // 1. Basic validation
  if (!geoJson || geoJson.type !== "FeatureCollection") {
    throw new Error("The file data is not a valid GeoJSON FeatureCollection.");
  }
  if (!Array.isArray(geoJson.features)) {
    throw new Error("Invalid GeoJSON: 'features' is not an array.");
  }

  const features: GeoJsonFeature[] = geoJson.features;

  // 2. data structure
  //    pinnedPoints: PinnedPoint[];
  //    groups: Group[];
  //
  //   During the previous "forward conversion," group information (such as groupId, groupName, color, etc.) 
  //   was often placed in feature.properties. Now, we need to extract them in reverse.

  const pinnedPointsMap = new Map<string, PinnedPoint>();
  const pointToGroupIdsMap = new Map<string, Set<string>>();

  // 3. Iterate through each Feature to parse pinnedPoints
  for (const feature of features) {
    const { properties, geometry } = feature;
    if (geometry?.type !== "Point") {
      // throw new Error(`Unsupported geometry type: ${geometry?.type}`);
      continue;
    }
    const coordinates = geometry.coordinates; // [lng, lat, height?]
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      continue; // or error
    }

    // Extract information from properties.
    const pointId = properties.pointId || "";
    const pointName = properties.pointName || "";
    const groupIds = properties.groupIds || []; 

    const longitude = coordinates[0];
    const latitude = coordinates[1];
    const height = coordinates[2] ?? 0;

    // Only create a new pinnedPoint if it does not already exist in pinnedPointsMap.
    if (!pinnedPointsMap.has(pointId)) {
      pinnedPointsMap.set(pointId, {
        id: pointId,
        name: pointName,
        latitude,
        longitude,
        height,
      });
    }

    // Record the mapping from pointId to groupId.
    if (!pointToGroupIdsMap.has(pointId)) {
      pointToGroupIdsMap.set(pointId, new Set<string>());
    }
    if (Array.isArray(groupIds)) {
      groupIds.forEach((gid: string) => pointToGroupIdsMap.get(pointId)!.add(gid));
    } else if (typeof groupIds === "string" && groupIds) {
      pointToGroupIdsMap.get(pointId)!.add(groupIds);
    }
  }

  // 4. Generate the pinnedPoints array.
  const pinnedPoints: PinnedPoint[] = Array.from(pinnedPointsMap.values());

  // 5. Generate the groups array
  const groupsMap = new Map<string, Group>();
  for (const [pointId, groupIds] of pointToGroupIdsMap.entries()) {
    for (const gid of groupIds) {
      if (!groupsMap.has(gid)) {
        groupsMap.set(gid, {
          id: gid,
          name: gid,            
          color: "#ff0000",    
          pinnedPoints: [],
          isVisible: true,     
          isSelected: false,    
        });
      }
      // put pinnedPoint into pinnedPoints
      const point = pinnedPointsMap.get(pointId);
      if (point) {
        groupsMap.get(gid)!.pinnedPoints.push(point);
      }
    }
  }

  // 6. Convert to an array.
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
  // Generate a Map<pointId, string[]> to record which groupIds a point belongs to.
  const pointToGroupsMap = new Map<string, string[]>();

  groups.forEach((group) => {
    group.pinnedPoints.forEach((p) => {
      if (!pointToGroupsMap.has(p.id)) {
        pointToGroupsMap.set(p.id, []);
      }
      pointToGroupsMap.get(p.id)!.push(group.id);
    });
  });

  // Construct a FeatureCollection
  const features: GeoJsonFeature[] = pinnedPoints.map((point) => {
    // Retrieve the list of groupIds that this point belongs to.
    const groupIds = pointToGroupsMap.get(point.id) || [];
    return {
      type: "Feature",
      properties: {
        pointId: point.id,
        pointName: point.name,
        groupIds,
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