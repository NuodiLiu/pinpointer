import { create } from "zustand";

interface StepSizeState {
  stepSize: number;
  setStepSize: (value: number) => void;
}

const useStepSizeStore = create<StepSizeState>((set) => ({
  stepSize: 0.011, // 0.005 ideal
  setStepSize: (value: number) => set({ stepSize: value }),
}));

export default useStepSizeStore;
