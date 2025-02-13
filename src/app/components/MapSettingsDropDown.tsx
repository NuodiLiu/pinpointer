"use client";

import React, { useState, useRef, useEffect } from "react";
import { IoIosArrowDown, IoIosCheckmark } from "react-icons/io";
import clsx from "clsx";
import { arrowColors, MapPinIconType, mapPinIconUrls, MapSettings } from "../types/MapSetting";
import useStepSizeStore from "../store/useStepSizeStore";

interface SettingsDropdownProps {
  changePinIconType: (type: MapPinIconType) => void;
  changeArrowColor: (color: string) => void;
}

const RANGE_MIN = 0.005;
const RANGE_MAX = 0.03;
const CONVERT_FACTOR = 100000;

/**
 * A reusable, accessible dropdown for selecting Icon Type and Arrow Color.
 */
export default function SettingsDropdown({
  changePinIconType,
  changeArrowColor,
}: SettingsDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localMapSettings, setLocalMapSettings] = useState<MapSettings>({pinIconType: "default", arrowColor: "#FF0000"})
  const { stepSize, setStepSize } = useStepSizeStore();
  // middle state
  const [inputValue, setInputValue] = useState("1100");

  // Close dropdown if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard handling – close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // limit boundary
  function clampStepSize(value: number) {
    if (value < 0.005) return 0.005;
    if (value > 0.03) return 0.03;
    return value;
  }

  const handleConfirm = () => {
    if (!inputValue) {
      setStepSize(RANGE_MIN);
      setInputValue((RANGE_MIN * CONVERT_FACTOR).toString());
      return;
    }
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed)) {
      setStepSize(RANGE_MIN);
      setInputValue((RANGE_MIN * CONVERT_FACTOR).toString());
      return;
    }
    // clamp
    const realStepSize = parsed / CONVERT_FACTOR;
    const clamped = clampStepSize(realStepSize);
    setStepSize(clamped);
    setInputValue((clamped * CONVERT_FACTOR).toString());
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="inline-flex items-center justify-center bg-gray-500 px-4 py-1 text-white rounded hover:bg-gray-600 
                   focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors ease-in-out"
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        Settings
        <IoIosArrowDown
          className={clsx("ml-2 transition-transform", {
            "rotate-180": dropdownOpen,
          })}
        />
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          className="absolute right-0 mt-2 w-58 bg-white border border-gray-200 rounded shadow-lg p-3 z-50"
          role="menu"
        >
          {/* Optional caret (triangle) at the top */}
          <div className="absolute -top-2 right-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white" />

          {/* Icon Type Section */}
          <section className="mb-3" aria-labelledby="icon-type-label">
            <p id="icon-type-label" className="text-sm text-gray-700 font-medium mb-2">
              Select Icon Type:
            </p>
            <ul className="space-y-1" role="menu">
              {Object.keys(mapPinIconUrls).map((type) => {
                const isActive = type === localMapSettings.pinIconType;
                return (
                  <li
                    key={type}
                    className={clsx(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 text-sm cursor-pointer transition-all duration-200",
                      {
                        "bg-gray-100 hover:bg-gray-200": !isActive,
                        "bg-blue-50 text-blue-600": isActive,
                      }
                    )}
                    onClick={() => {
                      changePinIconType(type as MapPinIconType);
                      setDropdownOpen(false);
                      setLocalMapSettings((prevSettings) => ({
                        ...prevSettings,
                        pinIconType: type as MapPinIconType,
                      }));
                    }}
                    role="menuitem"
                  >
                    <span>{type}</span>
                    {isActive && <IoIosCheckmark className="text-blue-600" />}
                  </li>
                );
              })}
            </ul>
          </section>

          <hr className="my-2" />

          {/* Arrow Color Section */}
          <section aria-labelledby="arrow-color-label">
            <p id="arrow-color-label" className="text-sm text-gray-700 font-medium mb-2">
              Select Arrow Color:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {arrowColors.map((color) => {
                const isSelected = color === localMapSettings.arrowColor;
                return (
                  <div
                    key={color}
                    className={clsx(
                      "w-9 h-9 rounded-full cursor-pointer transition-all flex items-center justify-center shadow-sm",
                      isSelected
                        ? "ring-2 ring-blue-400 border border-blue-300"
                        : "border border-gray-300 hover:opacity-80"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      changeArrowColor(color);
                      setDropdownOpen(false);
                      setLocalMapSettings((prevSettings) => ({
                        ...prevSettings,
                        arrowColor: color
                      }));
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        changeArrowColor(color);
                        setDropdownOpen(false);
                        setLocalMapSettings((prevSettings) => ({
                          ...prevSettings,
                          arrowColor: color
                        }));
                      }
                    }}
                    aria-label={`Choose color ${color}`}
                  >
                    {isSelected && <IoIosCheckmark className="text-white text-lg" />}
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="my-2" />

          {/* Step Size Section */}
          <section aria-labelledby="step-size-label" className="mt-3">
            <p
              id="step-size-label"
              className="text-sm text-gray-700 font-medium mb-1"
            >
              Step Size:
            </p>
            <div className="flex items-center space-x-2">
              {/* slider input */}
              <input
                type="range"
                min={RANGE_MIN}
                max={RANGE_MAX}
                step="0.001"
                value={stepSize}
                onChange={(e) => {
                  const rawValue = parseFloat(e.target.value);
                  setStepSize(clampStepSize(rawValue));
                  setInputValue(Math.round((clampStepSize(rawValue) * CONVERT_FACTOR)).toString());
                }}
              />

              {/* number input frame */}
              <div className="flex items-center border border-gray-300 rounded px-2 py-1 w-20">
                <input
                  type="number"
                  className="
                    flex-grow
                    w-full
                    text-sm
                    text-black
                    appearance-none
                    focus:outline-none
                    [&::-webkit-outer-spin-button]:appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none
                    [MozAppearance:textfield]
                    text-right
                  "
                  min={RANGE_MIN * 1000}
                  max={RANGE_MAX * 1000}
                  step="1"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                  onBlur={handleConfirm}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleConfirm();
                      e.currentTarget.blur();
                    }
                  }}
                />
                <span className="ml-1 text-gray-500 text-sm">m</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
