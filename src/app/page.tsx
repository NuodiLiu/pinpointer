"use client";

import React, { useEffect, useState } from "react";
import "tailwindcss/tailwind.css";
import { LatLng, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { v4 as uuidv4 } from 'uuid';
import PinnedPoint from "./types/PinnedPoint";
import PinnedPointsList from './components/PinnedPointsList';
import MapSection from "./components/MapSection";
import NavigationBar from "./components/NavigationBar";
import PinnedPointsOperationBar from "./components/PinnedPointsOperationBar";
import "leaflet-arrowheads";
import Group from "./types/Group";


const Home: React.FC = () => {
  const [pinnedPoints, setPinnedPoints] = useState<PinnedPoint[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [draggingPoint, setDraggingPoint] = useState<LatLng | null>(null); // tmp point to display grey pinpoint
  const [currentFile, setCurrentFile] = useState<string>("New Route");
  const [fileList, setFileList] = useState<string[]>(["New Route"]);
  const [isViewOnly, setIsViewOnly] = useState<boolean>(false); // default allow to edit
  const [isEditingFileName, setIsEditingFileName] = useState<boolean>(false);
  const [tempFileName, setTempFileName] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false); 

  // Handle map click events
  const handleMapClick = (event: LeafletMouseEvent) => {
    if (isViewOnly) return;

    const { lat, lng } = event.latlng;
    const newPoint: PinnedPoint = {
      id: uuidv4(),
      name: `Point ${pinnedPoints.length + 1}`,
      latitude: lat,
      longitude: lng,
      height: 100,
    };
    setPinnedPoints([...pinnedPoints, newPoint]);
  };

  const handleDragStart = (position: LatLng) => {
    setDraggingPoint(position); // set tmp point for grey point
  };

  const handleDragEnd = (id: string, position: LatLng) => {
    setDraggingPoint(null); // remove tmp point for grey point

    if (isViewOnly) return;
    const updatedPoints = pinnedPoints.map((point) =>
      point.id === id
        ? {
            ...point,
            latitude: position.lat,
            longitude: position.lng,
          }
        : point
    );
    setPinnedPoints(updatedPoints);
  };

  const handleDownloadJson = () => {
    const fileData = JSON.stringify(pinnedPoints, null, 2); // make JSON format
    const blob = new Blob([fileData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = url;
    link.download = "pinned_points.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleUploadJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setPinnedPoints(data);
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  // init map routes (json file) folder
  useEffect(() => {
    const fetchFiles = async () => {
      const response = await fetch("/api/files");
      if (response.ok) {
        const files = await response.json();
        setFileList(["New Route", ...files]);
      }
    };
    fetchFiles();
  }, []);

  // load json data from current selected file
  const handleFileSelect = async (fileName: string) => {
    setCurrentFile(fileName);
    if (fileName === "New Route") {
      setPinnedPoints([]);
    } else {
      const response = await fetch(`/api/files?fileName=${fileName}`);
      if (response.ok) {
        const data = await response.json();
        setPinnedPoints(data);
      } else {
        alert("Error loading file");
      }
    }
  }; 

  // call back functions
  const handlePointSelect = (point: PinnedPoint) => {
    // Handle point selection
    console.log('Selected point:', point);
  };

  const handlePointRemove = (pointToRemove: PinnedPoint) => {
    setPinnedPoints((prevPoints) =>
      prevPoints.filter((point) => point !== pointToRemove)
    );
  };

  const handlePointUpdate = (updatedPoint: PinnedPoint) => {
    setPinnedPoints((prevPoints) =>
      prevPoints.map((point) => (point.id === updatedPoint.id ? updatedPoint : point))
    );
  };

  const handlePointsReorder = (newPoints: PinnedPoint[]) => {
    setPinnedPoints(newPoints);
  };

  const handleGroupsUpdate = (newGroups: Group[]) => {
    setGroups(newGroups);
  };

  const handleFileEditStart = () => {
    setIsEditingFileName(true);
    setTempFileName(currentFile.replace(/\.json$/, ""));
  };

  const handleFileEditFinish = async (newName: string) => {
    setIsEditingFileName(false);
    newName = newName.trim();
    if (!newName) return;

    if (currentFile === "New Route") {
      const response = await fetch("/api/files/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldName: currentFile,
          newName: newName + ".json",
          isPending: true
        })
      });

      if (response.ok) {
        const newFileFullName = newName + ".json";
        setCurrentFile(newFileFullName);
        setTempFileName(newName);
        setIsPending(true);

        setFileList((prev) => {
          const withoutNewRoute = prev.filter((f) => f !== "New Route");
          return [newFileFullName, ...withoutNewRoute];
        });

      } else {
        alert("Error in pending rename.");
      }
    } else {
      const oldName = currentFile;
      const newFileName = newName + ".json";

      if (newFileName === oldName) return;

      const response = await fetch("/api/files/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldName,
          newName: newFileName,
          isPending: false
        })
      });

      if (response.ok) {
        setFileList((prev) => {
          const index = prev.indexOf(oldName);
          if (index > -1) {
            const newList = [...prev];
            newList[index] = newFileName;
            return newList;
          }
          return prev;
        });
        setCurrentFile(newFileName);
      } else {
        alert("Error renaming file");
      }
    }
  };

  const generateDefaultFileName = () => {
    const defaultPrefix = "New Route";
    let highestIndex = 0;
    fileList.forEach((file) => {
      const baseName = file.replace(/\.json$/, "");
      const match = baseName.match(new RegExp(`^${defaultPrefix} (\\d+)$`));
      if (match) {
        const index = parseInt(match[1], 10);
        if (index > highestIndex) {
          highestIndex = index;
        }
      }
    });
    return `${defaultPrefix} ${highestIndex + 1}`;
  };

  const handleSave = async () => {
    let oldFileName = currentFile;
    let fileName = "";
    if (oldFileName === "New Route") {
      fileName = generateDefaultFileName() + ".json";
    } else if (isPending) {
      fileName = tempFileName.trim() !== "" ? tempFileName + ".json" : fileName;
    } else {
      fileName = oldFileName;
    }

    const response = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, data: pinnedPoints }),
    });

    if (response.ok) {
      if (oldFileName === "New Route") {
        setFileList((prev) => {
          const withoutNewRoute = prev.filter((f) => f !== "New Route" && f !== fileName);
          return ["New Route", ...withoutNewRoute, fileName];
        });

        setCurrentFile(fileName);
      } else if (isPending) {
        setFileList((prev) => {
          const withoutNewRoute = prev.filter((f) => f !== "New Route" && f !== fileName);
          return ["New Route", ...withoutNewRoute, fileName];
        });

        setCurrentFile(fileName);
        setIsPending(false);
      }
    } else {
      alert("Error saving file");
    }
  };

  const toggleViewOnly = () => {
    setIsViewOnly((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation bar */}
      <NavigationBar
        onDownloadJson={handleDownloadJson}
        onUploadJson={handleUploadJson}
        isViewOnly={isViewOnly}
        toggleViewOnly={toggleViewOnly}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left section: Map */}
        <MapSection
          pinnedPoints={pinnedPoints}
          draggingPoint={draggingPoint}
          isViewOnly={isViewOnly}
          onMapClick={handleMapClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />

        {/* Right section: Points list */}
        <div className="w-1/3 h-full bg-gray-100 p-4 flex flex-col">
          {/* Dropdown menu and save button */}
          <PinnedPointsOperationBar
            isEditingFileName={isEditingFileName}
            currentFile={currentFile}
            fileList={fileList}
            handleFileSelect={handleFileSelect}
            handleFileEditStart={handleFileEditStart}
            handleFileEditFinish={handleFileEditFinish}
            handleSave={handleSave}
          />
          {/* Pin points list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {pinnedPoints.length === 0 ? (
              <p>No points pinned yet.</p>
            ) : (
              <PinnedPointsList
                points={pinnedPoints}
                groups={groups}
                onPointSelect={handlePointSelect}
                onPointRemove={handlePointRemove}
                onPointUpdate={handlePointUpdate}
                onPointsReorder={handlePointsReorder}
                onGroupsUpdate={handleGroupsUpdate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
