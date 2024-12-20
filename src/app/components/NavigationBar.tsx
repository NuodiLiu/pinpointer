"use client";

import React from "react";

interface NavigationBarProps {
  onDownloadJson: () => void;
  onUploadJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isViewOnly: boolean;
  toggleViewOnly: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  onDownloadJson,
  onUploadJson,
  isViewOnly,
  toggleViewOnly,
}) => {
  return (
    <div className="h-12 bg-white-500 flex items-center px-4 text-white font-bold justify-between border border-gray-300">
      {/* Left Section: Download and Upload Buttons */}
      <div className="flex space-x-4 items-center">
        {/* Download JSON Button */}
        <button
          className="bg-green-500 px-4 py-1 rounded text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
          onClick={onDownloadJson}
          title="Download JSON"
          aria-label="Download JSON"
        >
          Download JSON
        </button>

        {/* Upload JSON Button */}
        <label className="bg-blue-500 px-4 py-1 rounded text-white cursor-pointer hover:bg-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-300">
          Upload JSON
          <input
            type="file"
            accept=".json"
            onChange={onUploadJson}
            className="hidden"
            aria-label="Upload JSON"
          />
        </label>
      </div>

      {/* Right Section: View Only Checkbox */}
      <div className="flex items-center space-x-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isViewOnly}
            onChange={() => toggleViewOnly}
            className="cursor-pointer rounded focus:ring-2 focus:ring-gray-400"
            aria-label="Toggle View Only"
          />
          <span className="text-gray-700">View Only</span>
        </label>
      </div>
    </div>
  );

}

export default NavigationBar;