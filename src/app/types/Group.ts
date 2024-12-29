import PinnedPoint from "./PinnedPoint";

type Group = {
  id: string,
  name: string,
  color: string,
  pinnedPoints: PinnedPoint[],
  isVisible: boolean,
  isSelected: boolean,
};

export default Group;