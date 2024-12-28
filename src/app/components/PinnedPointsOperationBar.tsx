"use client";

import React from "react";

interface PointsOperationBarProps {
  isEditingFileName: boolean;
  currentFile: string;
  fileList: string[];
  handleFileSelect: (fileName: string) => void;
  handleFileEditStart: () => void;
  handleFileEditFinish: (newName: string) => void;
  handleSave: () => void;
  openManageGroupsModal: () => void;
}

const PinnedPointsOperationBar: React.FC<PointsOperationBarProps> = ({
  isEditingFileName,
  currentFile,
  fileList,
  handleFileSelect,
  handleFileEditStart,
  handleFileEditFinish,
  handleSave,
  openManageGroupsModal,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        {!isEditingFileName ? (
          <select
            className="border p-2 rounded"
            value={currentFile}
            onChange={(e) => handleFileSelect(e.target.value)}
          >
            {fileList.map((file, index) => (
              <option key={index} value={file}>
                {file === "New Route" ? `\u2795 ${file}` : file.replace(/\.json$/, "")}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            defaultValue={currentFile.replace(/\.json$/, "")}
            onBlur={(e) => handleFileEditFinish(e.target.value)}
            autoFocus
            className="border p-2 rounded w-full"
          />
        )}
        <button
          className="text-blue-500"
          onClick={handleFileEditStart}
          title="Edit File Name"
          aria-label="Edit File Name"
        >
          {"\u270F\uFE0F"}
        </button>
      </div>

      {/* Middle: Manage Groups Button */}
      <button
        className="bg-yellow-500 px-4 py-2 rounded text-white hover:bg-yellow-600"
        onClick={openManageGroupsModal}
        aria-label="Manage Groups"
      >
        Manage Groups
      </button>

      <button
        className="bg-green-500 px-4 py-1 rounded text-white"
        onClick={handleSave}
        aria-label="Save"
      >
        Save
      </button>
    </div>
  );
};

export default PinnedPointsOperationBar;