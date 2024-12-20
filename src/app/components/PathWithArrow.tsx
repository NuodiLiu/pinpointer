import React, { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import "leaflet-arrowheads";
import "leaflet/dist/leaflet.css";

const PathWithArrow: React.FC<{ points: { latitude: number; longitude: number }[] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return; // No path to draw if fewer than 2 points

    // Create a group layer to manage all polylines and arrowheads
    const polylineGroup = L.layerGroup().addTo(map);

    // Loop through points to create segments
    points.forEach((point, index) => {
      if (index === points.length - 1) return; // Skip the last point as it has no next point

      const start = point;
      const end = points[index + 1];

      // Create a single polyline for the segment
      const polyline = L.polyline(
        [
          [start.latitude, start.longitude],
          [end.latitude, end.longitude],
        ],
        {
          color: "#FFA500", // Orange-yellow color
          weight: 5,
        }
      );

      // Add the polyline to the map
      polyline.addTo(polylineGroup);

      // Add arrowheads for the segment
      polyline.arrowheads({
        size: "10px", // Arrow size
        frequency: "endonly", // Add arrow at the end of each segment
        fill: true,
        fillColor: "#FFA500", // Arrow color
      });

      // Force arrowhead layer redraw
      setTimeout(() => polyline.redraw(), 0);
    });

    // Trigger a refresh to ensure everything is displayed correctly
    map.invalidateSize();

    // Clean up the polyline group on unmount
    return () => {
      polylineGroup.clearLayers();
      map.removeLayer(polylineGroup);
    };
  }, [map, points]);

  return null;
};


export default PathWithArrow