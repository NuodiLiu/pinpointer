// Import Leaflet and set custom icon
import L from "leaflet";

export const mapPinIcon = new L.Icon({
  iconUrl: "/images/map_pin.png", // Path to your custom map pin
  iconSize: [32, 32], // Adjust the size of the icon
  iconAnchor: [16, 32], // Anchor the icon (center bottom of the image)
  popupAnchor: [0, -32], // Position of the popup relative to the icon
});

export const mapPinIconGrey = new L.Icon({
  iconUrl: "/images/map_pin_grey.png", // Path to your custom map pin
  iconSize: [32, 32], // Adjust the size of the icon
  iconAnchor: [16, 32], // Anchor the icon (center bottom of the image)
  popupAnchor: [0, -32], // Position of the popup relative to the icon
});

