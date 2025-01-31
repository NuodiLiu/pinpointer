'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import PinnedPoint from '../types/PinnedPoint';
import Zone from '../types/Zone';
import { LatLng } from 'leaflet';
import { getMapPinIcon } from './MapMarker';

// If you define or import your Leaflet icons elsewhere (e.g., mapPinIcon, mapPinIconGrey),
// just make sure they are passed in or accessible in this component scope.

interface MapSection2Props {
  points: PinnedPoint[];            // Keep your own types here; using `any` to avoid changing them
  zones: Zone[];
  draggingPoint: LatLng | null;
  handleDragStart: (position: any) => void;
  handleDragEnd: (pointId: any, position: any) => void;
  handleDeletePoint: (pointId: any) => void;
  MapClickHandler: React.FC;
}

export default function MapSection2({
  points,
  zones,
  draggingPoint,
  handleDragStart,
  handleDragEnd,
  handleDeletePoint,
  MapClickHandler,
}: MapSection2Props) {
  const defaultIcon = React.useMemo(() => getMapPinIcon("default", false), []);
  const greyIcon = React.useMemo(() => getMapPinIcon("grey", false), []);

  console.log(defaultIcon);
  return (
    <MapContainer
      center={[-33.8688, 151.2093]} // Sydney coordinates
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <MapClickHandler />

      {/* Render Markers for points */}
      {points.map((point: PinnedPoint) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={defaultIcon}
          draggable
          eventHandlers={{
            dragstart: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              handleDragStart(position);
            },
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              handleDragEnd(point.id, position);
            },
          }}
        >
          {/* Show a second "ghost" marker while dragging */}
          {draggingPoint && (
            <Marker
              position={[draggingPoint.lat, draggingPoint.lng]}
              icon={greyIcon}
            />
          )}

          {/* Popup with a Delete button */}
          <Popup>
            <div className="flex flex-col space-y-2">
              <span className="font-semibold">{point.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePoint(point.id);
                }}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Render Polygons for zones */}
      {zones.map((zone: any) => (
        <Polygon
          key={zone.id}
          positions={zone.points.map((p: any) => [p.latitude, p.longitude])}
          color="red"
        />
      ))}
    </MapContainer>
  );
}
