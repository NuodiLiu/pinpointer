"use client"
import React, { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import "leaflet-arrowheads";
import "leaflet/dist/leaflet.css";

const PathWithArrowClient: React.FC<{ points: { latitude: number; longitude: number }[] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;

    const polylineGroup = L.layerGroup().addTo(map);

    points.forEach((point, index) => {
      if (index === points.length - 1) return;

      const start = point;
      const end = points[index + 1];

      const polyline = L.polyline(
        [
          [start.latitude, start.longitude],
          [end.latitude, end.longitude],
        ],
        {
          color: "#FFA500",
          weight: 5,
        }
      );

      polyline.addTo(polylineGroup);

      polyline.arrowheads({
        size: "10px",
        frequency: "endonly",
        fill: true,
        fillColor: "#FFA500",
      });

      setTimeout(() => polyline.redraw(), 0);
    });

    map.invalidateSize();

    return () => {
      polylineGroup.clearLayers();
      map.removeLayer(polylineGroup);
    };
  }, [map, points]);

  return null;
};

export default PathWithArrowClient;