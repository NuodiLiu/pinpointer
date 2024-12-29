import PinnedPoint from "./PinnedPoint";
interface SortableItemProps {
  point: PinnedPoint;
  children: React.ReactNode;
  onPointSelect: (point: PinnedPoint) => void;
  className?: string; // Add className prop
}

export default SortableItemProps