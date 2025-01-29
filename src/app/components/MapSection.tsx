// app/components
"use client";

import React from "react";
import dynamic from 'next/dynamic';
import { LatLng, LatLngTuple, LeafletMouseEvent } from "leaflet";
import { useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { mapPinIcon, mapPinIconGrey, mapPinIconGreyHighlighted, mapPinIconHighlighted } from "../components/MapMarker";
import PinnedPoint from "../types/PinnedPoint";
import PathWithArrow from "../components/PathWithArrow";
import Group from "../types/Group";
import Zone from "../types/Zone";

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);

interface MapSectionProps {
  pinnedPoints: PinnedPoint[];
  groups: Group[];
  zones: Zone[];
  draggingPoint: LatLng | null;
  isViewOnly: boolean;
  displayNoFlyZone: boolean;
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
  zones,
  draggingPoint,
  isViewOnly,
  displayNoFlyZone,
  onMapClick,
  onDragStart,
  onDragEnd,
}) => {
  const getPointIcon = (point: PinnedPoint) => {
    const pointGroups = groups.filter((group) =>
      group.pinnedPoints.some((p) => p.id === point.id)
    );
  
    const isSelected = pointGroups.some((group) => group.isSelected);
    const isVisible = pointGroups.some((group) => group.isVisible);
  
    if (isVisible && isSelected) {
      return mapPinIconHighlighted; // Red highlighted
    }
  
    if (!isVisible && isSelected) {
      return mapPinIconGreyHighlighted; // Grey highlighted
    }
  
    if (isVisible && !isSelected) {
      return mapPinIcon; // Red
    }
  
    return mapPinIconGrey; // Grey
  };


  // 使用 useMemo 缓存地图配置
  const mapConfig = React.useMemo(
    () => ({
      center: [-33.8688, 151.2093] as LatLngTuple,
      zoom: 13,
    }),
    []
  );
  

  
  return (
    <div className="w-2/3 h-full">
      <MapContainer
        // center={[-33.8688, 151.2093]} // Sydney coordinates
        // zoom={13}
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        style={{ height: "100%", width: "100%" }}
        whenReady={() => {
          // 使用 setTimeout 来确保地图完全加载
          setTimeout(() => {
            document.querySelector('.leaflet-container')?.classList.add('ready');
          }, 0);
        }}
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

        {/* Render path with arrows */}
        <PathWithArrow points={pinnedPoints} />

        {/* Render no-fly zones */}
        {displayNoFlyZone && zones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.points.map((point) => [point.latitude, point.longitude] as LatLngTuple)}
            pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.5 }}
            eventHandlers={{
              click: () => alert(zone.name),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default React.memo(MapSection);
