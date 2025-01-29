"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom icon for the marker (default Leaflet markers are broken in React)
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const LocationPage = () => {
  const [locationData, setLocationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const lng = 151.2093; // Default Longitude (Sydney, Australia)
  const lat = -33.8688; // Default Latitude

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await fetch(`/api/map/info?lng=${lng}&lat=${lat}`);
        const data = await response.json();
        setLocationData(data);
      } catch (error) {
        console.error("Error fetching location data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Location Information</h1>
      {loading ? (
        <p>Loading location data...</p>
      ) : locationData?.error ? (
        <p className="text-red-500">{locationData.error}</p>
      ) : (
        <div className="w-full h-[500px]">
          <MapContainer
            center={[locationData.latitude, locationData.longitude]}
            zoom={12}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker
              position={[locationData.latitude, locationData.longitude]}
              icon={customIcon}
            >
              <Popup>
                <strong>City:</strong> {locationData.city} <br />
                <strong>Elevation:</strong> {locationData.elevation} meters
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default LocationPage;
