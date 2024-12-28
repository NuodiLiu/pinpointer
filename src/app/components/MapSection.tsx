"use client";

import React from "react";
import { LatLng, LeafletMouseEvent } from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { mapPinIcon, mapPinIconGrey } from "../components/MapMarker";
import PinnedPoint from "../types/PinnedPoint";
import PathWithArrow from "../components/PathWithArrow";
import Group from "../types/Group";

interface MapSectionProps {
  pinnedPoints: PinnedPoint[];
  groups: Group[];
  draggingPoint: LatLng | null;
  isViewOnly: boolean;
  onMapClick: (event: LeafletMouseEvent) => void;
  onDragStart: (position: LatLng) => void;
  onDragEnd: (id: string, position: LatLng) => void;
}

// Component for capturing map events
const MapWithEvents: React.FC<{ onMapClick: (event: LeafletMouseEvent) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: onMapClick,
  });
  return null;
};


const MapSection: React.FC<MapSectionProps> = ({
  pinnedPoints,
  groups,
  draggingPoint,
  isViewOnly,
  onMapClick,
  onDragStart,
  onDragEnd,
}) => {
  const getPointIcon = (point: PinnedPoint) => {
    const pointGroups = groups.filter((group) =>
      group.pinnedPoints.some((p) => p.id === point.id)
    );

    const isVisible = pointGroups.some((group) => group.isVisible);
    return isVisible ? mapPinIcon : mapPinIconGrey;
  };
  
  return (
    <div className="w-2/3 h-full">
      <MapContainer
        center={[-33.8688, 151.2093]} // Sydney coordinates
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />

        <MapWithEvents onMapClick={onMapClick} />

        {/* Render Pin Points */}
        {pinnedPoints.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={getPointIcon(point)}
            draggable={!isViewOnly}
            eventHandlers={{
              dragstart: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                onDragStart(position);
              },
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                onDragEnd(point.id, position);
              },
            }}
          >
            {draggingPoint && (
              <Marker
                position={[draggingPoint.lat, draggingPoint.lng]}
                icon={mapPinIconGrey}
              />
            )}
          </Marker>
        ))}

        <PathWithArrow points={pinnedPoints} />
      </MapContainer>
    </div>
  );
};

export default MapSection;
