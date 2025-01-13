// src/app/map-page/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // 使用 Next.js 的 useRouter 钩子
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "tailwindcss/tailwind.css";

const MapPage: React.FC = () => {
  const router = useRouter();

  const [currentFile, setCurrentFile] = useState<string | null>(null);

  useEffect(() => {
    const file = localStorage.getItem("currentFile");
    setCurrentFile(file);
  }, []);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex h-screen">
      {/* map */}
      <div className="w-2/3 h-full">
        <MapContainer
          center={[-33.8688, 151.2093]} // Sydney coordinates
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
      </div>

      {/* 右侧功能占位符 */}
      <div className="w-1/3 h-full bg-gray-100 flex flex-col items-center justify-center">
        <p className="text-gray-700 text-lg mb-4">功能占位符</p>
        {/* 返回按钮 */}
        <button
          onClick={handleBack}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default MapPage;
