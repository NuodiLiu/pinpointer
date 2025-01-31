export const arrowColors = ["red", "blue", "green", "yellow", "purple", "orange", "black", "gray"];

export type MapPinIconType = "default" | "grey" | "outlined";

export const mapPinIconUrls = {
  default: "/images/map_pin.svg",
  grey: "/images/map_pin_grey.png",
  outlined: "/images/map_pin_outlined.svg",
};

export interface MapSettings {
  pinIconType: MapPinIconType;
  arrowColor: string;
}
