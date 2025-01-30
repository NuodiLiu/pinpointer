"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

type LocationData = {
  latitude: number;
  longitude: number;
  city: string;
  elevation: number;
  display_name: string;
  error?: string;
};

// Custom icon for the marker
const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [1, -34],
});

const LocationPage = () => {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const defaultCoordinates: LocationData = {
    latitude: -33.8688,
    longitude: 151.2093,
    city: "Sydney",
    elevation: 58,
    display_name: "Sydney, Australia",
  };

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await fetch(`/api/map/info?locations=${defaultCoordinates.latitude},${defaultCoordinates.longitude}`);
        const data: LocationData[] = await response.json();
        setLocationData(data[0]); // Assuming API returns an array, pick the first result
      } catch (error) {
        console.error("Error fetching location data:", error);
        setLocationData({ ...defaultCoordinates, error: "Failed to load location" });
      } finally {
        setLoading(false);
      }
    };
    

    fetchLocationData();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Location Information</h1>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-lg font-medium text-gray-500">Loading location data...</p>
        </div>
      ) : locationData?.error ? (
        <p className="text-red-600 font-semibold">{locationData.error}</p>
      ) : (
        locationData && ( // ✅ Safe null check before accessing properties
          <div className="w-full max-w-2xl p-4 bg-white shadow-md rounded-lg">
            <p className="text-lg font-semibold text-gray-700 text-center">{locationData.display_name}</p>
            <div className="text-gray-600 text-center mt-2">
              <p>
                <strong>City:</strong> {locationData.city}
              </p>
              <p>
                <strong>Elevation:</strong> {locationData.elevation} meters
              </p>
            </div>

            <div className="w-full h-[500px] mt-4 rounded-lg overflow-hidden shadow-md">
              <MapContainer center={[locationData.latitude, locationData.longitude]} zoom={12} className="w-full h-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                <Marker position={[locationData.latitude, locationData.longitude]} icon={customIcon}>
                  <Popup>
                    <strong>City:</strong> {locationData.city} <br />
                    <strong>Elevation:</strong> {locationData.elevation} meters
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default LocationPage;
