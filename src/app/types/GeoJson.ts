interface GeoJsonFeature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: "Point";
    coordinates: number[]; // [longitude, latitude, height?]
  };
}

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}