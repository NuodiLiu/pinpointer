"use client"
import dynamic from 'next/dynamic';

const PathWithArrowClient = dynamic(
  () => import('./PathWithArrowClient'),
  { 
    ssr: false 
  }
);

const PathWithArrow: React.FC<{ points: { latitude: number; longitude: number }[] }> = (props) => {
  return <PathWithArrowClient {...props} />;
};

export default PathWithArrow;