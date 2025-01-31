// Import Leaflet and set custom icon
import L from "leaflet";
import { mapPinIconUrls } from "../types/MapSetting";

export const getMapPinIcon = (type: keyof typeof mapPinIconUrls, isHighlighted: boolean) => {
  const iconSize: [number, number] = isHighlighted ? [40, 40] : [32, 32];

  return new L.Icon({
    iconUrl: mapPinIconUrls[type],
    iconSize,
    iconAnchor: [16, iconSize[1]],
    popupAnchor: [0, -iconSize[1]],
  });
};