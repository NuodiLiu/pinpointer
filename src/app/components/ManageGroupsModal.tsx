"use client";

import React, { useState, useEffect } from "react";
import PinnedPoint from "../types/PinnedPoint";
import Group from "../types/Group";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface ManageGroupsModalProps {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  pinnedPoints: PinnedPoint[];
  setPinnedPoints: React.Dispatch<React.SetStateAction<PinnedPoint[]>>;
  onClose: () => void;
}

const ManageGroupsModal: React.FC<ManageGroupsModalProps> = ({
  groups,
  setGroups,
  pinnedPoints,
  setPinnedPoints,
  onClose,
}) => {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(new Set());
  const [shouldSyncUngrouped, setShouldSyncUngrouped] = useState(false);

  const togglePointSelection = (pointId: string) => {
    setSelectedPoints((prev) => {
      const updated = new Set(prev);
      if (updated.has(pointId)) {
        updated.delete(pointId);
      } else {
        updated.add(pointId);
      }
      return updated;
    });
  };

  // delete a point will automatically remove the point from group
  const syncGroupsWithPoints = () => {
    const updatedGroups = groups.map((group) => ({
      ...group,
      pinnedPoints: group.pinnedPoints.filter((point) =>
        pinnedPoints.some((p) => p.id === point.id)
      ).map((point) =>
        pinnedPoints.find((p) => p.id === point.id) || point
      ),
    }));
    setGroups(updatedGroups);
  };

  const syncUngroupedPoints = () => {
    // Find the "Ungrouped points" group
    const ungroupedGroup = groups.find((group) => group.id === "Ungrouped points");
    if (!ungroupedGroup) return;
  
    // Calculate points that are not in any other group
    const groupedPointIds = new Set(
      groups.flatMap((group) =>
        group.id === "Ungrouped points" ? [] : group.pinnedPoints.map((p) => p.id)
      )
    );
  
    const ungroupedPoints = pinnedPoints.filter((point) => !groupedPointIds.has(point.id));
  
    // Update the "Ungrouped points" group
    const updatedGroups = groups.map((group) =>
      group.id === "Ungrouped points"
        ? { ...group, pinnedPoints: ungroupedPoints }
        : group
    );
  
    setGroups(updatedGroups);
  };

  useEffect(() => {
    syncGroupsWithPoints();
  }, [pinnedPoints]);

  useEffect(() => {
    if (shouldSyncUngrouped) {
      syncUngroupedPoints();
      setShouldSyncUngrouped(false);
    }
  }, [shouldSyncUngrouped]);
  
  const addGroupMember = () => {
    if (selectedGroupIndex !== null && selectedPoints.size > 0) {
      const updatedGroups = [...groups];
      const group = updatedGroups[selectedGroupIndex];
      selectedPoints.forEach((pointId) => {
        const point = pinnedPoints.find((p) => p.id === pointId);
        if (point && !group.pinnedPoints.some((p) => p.id === point.id)) {
          group.pinnedPoints.push(point);
        }
      });
      setGroups(updatedGroups);
      setSelectedPoints(new Set());
      setShouldSyncUngrouped(true); 
    }
  };

  const removeGroupMember = () => {
    if (selectedGroupIndex !== null && selectedPoints.size > 0) {
      const updatedGroups = [...groups];
      const group = updatedGroups[selectedGroupIndex];
      group.pinnedPoints = group.pinnedPoints.filter(
        (point) => !selectedPoints.has(point.id)
      );
      setGroups(updatedGroups);
      setSelectedPoints(new Set());
      setShouldSyncUngrouped(true); 
    }
  };

  const addGroup = () => {
    setGroups([
      ...groups,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "New Group",
        color: "#ffffff",
        pinnedPoints: [],
        isVisible: true,
      },
    ]);
  };

  const removeGroup = (index: number) => {
    // Check if the group to be removed is "Ungrouped points"
    if (groups[index]?.id === "Ungrouped points") {
      return
    }

    const updatedGroups = groups.filter((_, i) => i !== index);
    setGroups(updatedGroups);
    if (selectedGroupIndex === index) {
      setSelectedGroupIndex(null);
    } else if (selectedGroupIndex !== null && selectedGroupIndex > index) {
      setSelectedGroupIndex(selectedGroupIndex - 1);
    }
    setShouldSyncUngrouped(true); 
  };

  const toggleGroupVisibility = (groupId: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId ? { ...group, isVisible: !group.isVisible } : group
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      <button
        className="absolute top-4 right-4 text-gray-700 hover:text-gray-900"
        onClick={onClose}
      >
        {"\u274C"}
      </button>
      <div className="flex-[6] flex justify-center mt-8 h-full overflow-hidden">
        <div className="flex flex-col w-1/2 border-r p-4 h-full">
          <h2 className="text-lg font-bold mb-4">Groups</h2>
          <div className="flex-1 overflow-y-auto">
            {groups.map((group, index) => (
              <div
                key={group.id}
                className={`p-2 rounded-lg cursor-pointer flex items-center justify-between ${
                  selectedGroupIndex === index ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
              >
                <div onClick={() => setSelectedGroupIndex(index)} className="flex-1">
                  <h3 className="font-medium text-gray-800">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.pinnedPoints.length} pinned points</p>
                </div>
                <div
                  className={`cursor-pointer flex items-center px-2 py-1 rounded ${
                    group.isVisible ? "bg-green-100 hover:bg-green-200" : "bg-red-100 hover:bg-red-200"
                  }`}
                  onClick={() => toggleGroupVisibility(group.id)}
                >
                    {group.isVisible ? (
                      <FaEye className="text-green-600" />
                    ) : (
                      <FaEyeSlash className="text-red-600" />
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-1/2 p-4 h-full">
          <h2 className="text-lg font-bold mb-4">Pinned Points</h2>
          {selectedGroupIndex !== null ? (
            <div className="flex flex-col">
              <h2 className="text-lg font-bold mb-4">
                {groups[selectedGroupIndex].name} Details
              </h2>
              <ul>
                {groups[selectedGroupIndex].pinnedPoints.map((point, i) => (
                  <li key={i} className="text-gray-700">
                    {point.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-600">Select a group to see details</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-[1]">
        <div className="flex flex-1 justify-evenly items-center">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={addGroup}
          >
            {"\u2795"}
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => {
              if (selectedGroupIndex !== null) {
                removeGroup(selectedGroupIndex);
              }
            }}
            disabled={selectedGroupIndex === null}
          >
            {"\u2796"}
          </button>
        </div>
        <div className="flex flex-1 justify-evenly items-center">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={addGroupMember}
            disabled={selectedGroupIndex === null || selectedPoints.size === 0}
          >
            Add Members
          </button>
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            onClick={removeGroupMember}
            disabled={selectedGroupIndex === null || selectedPoints.size === 0}
          >
            Remove Members
          </button>
        </div>
      </div>

      <div className="flex-[6] grid grid-cols-4 gap-2 p-4 overflow-y-auto">
        {pinnedPoints.map((point) => {
          const pointGroups = groups.filter((group) =>
            group.id !== "Ungrouped points" &&
            group.pinnedPoints.some((p) => p.id === point.id)
          );

          const isSelected = selectedPoints.has(point.id);
          const pointColor = pointGroups.length > 0 ? "#4caf50" : "#ffeb3b"; // Green for grouped, Yellow for no group

          return (
            <div
              key={point.id}
              className={`w-16 h-16 flex items-center justify-center rounded-lg text-black font-bold cursor-pointer ${
                isSelected ? "ring-4 ring-blue-500" : ""
              }`}
              style={{ backgroundColor: pointColor }}
              title={point.name}
              onClick={() => togglePointSelection(point.id)}
            >
              {point.name}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManageGroupsModal;
