// app/settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapEvents } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import "tailwindcss/tailwind.css";
import { v4 as uuidv4 } from 'uuid';
import PinnedPoint from "../types/PinnedPoint";
import { LatLng, LeafletMouseEvent } from "leaflet";
import Zone from "../types/Zone";

import dynamic from "next/dynamic";
const MapSection2 = dynamic(() => import("../components/MapSection2"), {
  ssr: false,
});

const MapPage: React.FC = () => {
  const router = useRouter();

  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [points, setPoints] = useState<PinnedPoint[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [draggingPoint, setDraggingPoint] = useState<LatLng | null>(null); // tmp point to display grey pinpoint

  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>("");

  useEffect(() => {
    const savedState = sessionStorage.getItem("mapState");
    if (savedState) {
      try {
        const {
          zones,
          currentFile,
        } = JSON.parse(savedState);

        setCurrentFile(currentFile);
        setZones(zones);
      } catch (error) {
        console.error("Failed to parse saved state:", error);
      }
    }
  }, []);

  const handleBack = () => {
    // save current change for zones
    const storedStateString = sessionStorage.getItem("mapState");
    if (storedStateString) {
      const storedState = JSON.parse(storedStateString);
      storedState.zones = zones;
      sessionStorage.setItem("mapState", JSON.stringify(storedState));
    } else {
      console.error("No mapState found in sessionStorage.");
    }
    
    // redirect to other page.
    router.push('/')
  };

  // Function to add a new point when the map is clicked
  const MapClickHandler = () => {
    useMapEvents({
      click(event: LeafletMouseEvent) {
        const { lat, lng } = event.latlng;
        const newPoint: PinnedPoint = {
          id: uuidv4(),
          name: `Point ${points.length + 1}`,
          latitude: lat,
          longitude: lng,
          height: 100,
        };
        setPoints((prevPoints) => [...prevPoints, newPoint]);
      },
    });
    return null; // Component doesn't render anything
  };
  const handleDragStart = (position: LatLng) => {
    setDraggingPoint(position); // set tmp point for grey point
  };
  
  const handleDragEnd = (id: string, position: LatLng) => {
    setDraggingPoint(null); // remove tmp point for grey point

    const updatedPoints = points.map((point) =>
      point.id === id
        ? {
            ...point,
            latitude: position.lat,
            longitude: position.lng,
          }
        : point
    );

    setPoints(updatedPoints);
  };

  const handleAddZone = () => {
    if (points.length >= 3) {
      const newZone = {
        id: crypto.randomUUID(), // Generate a unique ID for the zone
        name: `Zone-${zones.length + 1}`, // Use current zones count + 1 for naming
        points: [...points], // Copy current points
      };
  
      console.log("Zone Created!", newZone);
      setZones((prevZones) => [...prevZones, newZone]); // Add the new zone to the state
      setPoints([]); // Clear current points
    } else {
      alert("Need at least 3 points to form a zone.");
    }
  };

  // Function to delete a zone
  const handleDeleteZone = (zoneId: string) => {
    setZones(zones.filter((zone) => zone.id !== zoneId));
  };

  const handleDeletePoint = (pointId: string) => {
    setPoints((prevPoints) => prevPoints.filter((p) => p.id !== pointId));
  };  

  // Function to edit a zone
  const handleEditZone = (zoneId: string) => {
    const zoneToEdit = zones.find((zone) => zone.id === zoneId);
    if (zoneToEdit) {
      setPoints(zoneToEdit.points);
      setZones(zones.filter((zone) => zone.id !== zoneId)); // Remove zone from list while editing
    }
  };

  const handleEditClick = (zone: Zone) => {
    setEditingZoneId(zone.id);
    setEditedName(zone.name);
  };

  const handleBlur = () => {
    setZones((prevZones) =>
      prevZones.map((zone) =>
        zone.id === editingZoneId ? { ...zone, name: editedName } : zone
      )
    );
    setEditingZoneId(null);
  };

  return (
    <div className="flex h-screen">
      {/* Map section */}
      <div className="w-2/3 h-full">
        <MapSection2
          points={points}
          zones={zones}
          draggingPoint={draggingPoint}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDeletePoint={handleDeletePoint}
          MapClickHandler={MapClickHandler}
        />
      </div>
  
      {/* Sidebar section */}
      <div className="w-1/3 h-full bg-gray-100 flex flex-col p-4">
        {/* Heading + button section */}
        <div className="flex justify-between items-center mb-4 w-full">
          <h2 className="text-lg font-semibold">Zones</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleAddZone}
              disabled={points.length < 3}
              className={`px-6 py-3 rounded focus:outline-none focus:ring-2 ${
                points.length < 3
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-300"
              }`}
            >
              Add Zone
            </button>
  
            <button
              onClick={handleBack}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Back
            </button>
          </div>
        </div>
  
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {zones.length === 0 ? (
            <p className="text-gray-500">No zones added yet.</p>
          ) : (
            <ul className="space-y-2">
              {zones.map((zone) => (
                <li
                  key={zone.id}
                  className="p-3 bg-white shadow rounded-lg flex justify-between items-center"
                >
                  {editingZoneId === zone.id ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      autoFocus
                      onBlur={handleBlur}
                      className="border border-gray-300 rounded px-2 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : (
                    <button
                      onClick={() => handleEditClick(zone)}
                      className="text-left text-blue-500 hover:underline focus:outline-none"
                    >
                      {zone.name}
                    </button>
                  )}
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditZone(zone.id)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
  
};

export default MapPage;