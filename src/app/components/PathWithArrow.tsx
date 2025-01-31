"use client"
import dynamic from 'next/dynamic';
import { MapSettings } from '../types/MapSetting';

const PathWithArrowClient = dynamic(
  () => import('./PathWithArrowClient'),
  { 
    ssr: false 
  }
);

interface PathWithArrowProps {
  points: { latitude: number; longitude: number }[];
  mapSettings?: MapSettings
}

const PathWithArrow: React.FC<PathWithArrowProps> = (props) => {
  return <PathWithArrowClient {...props} />;
};

export default PathWithArrow;