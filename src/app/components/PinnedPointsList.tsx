// PinnedPointsList.jsx
"use client"

import { DndContext, UniqueIdentifier, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useRef, useState } from 'react';
import PinnedPoint from '../types/PinnedPoint';
import SortableItemProps from '../types/SortableItem';

interface PinnedPointsListProps {
  points: PinnedPoint[];
  onPointSelect: (point: PinnedPoint) => void;
  onPointRemove: (point: PinnedPoint) => void;
  onPointUpdate: (updatedPoint: PinnedPoint) => void;
  onPointsReorder: (updatedPoints: PinnedPoint[]) => void;
}

// Define EditableField without null
type EditableField = 'name' | 'height' | 'latitude' | 'longitude';

// Define the structure for editing state
interface EditingState {
  pointId: string | null;
  field: EditableField | null;
  value: string;
}

const SortableItem: React.FC<SortableItemProps> = ({ point, className, onPointSelect, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: point.id,
  });

  const defaultTransform = { x: 0, y: 0, scaleX: 1, scaleY: 1 };

  const style = {
    transform: isDragging
      ? CSS.Transform.toString(transform || defaultTransform) // Fallback for null
      : `scale(1) translate3d(${(transform?.x || 0)}px, ${(transform?.y || 0)}px, 0)`,
    zIndex: isDragging ? 1000 : 'auto',
    boxShadow: isDragging ? '0px 4px 10px rgba(0, 0, 0, 0.3)' : 'none',
  }

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className={className} onClick={() => onPointSelect(point)}>
      {children}
    </li>
  )
};

const PinnedPointsList: React.FC<PinnedPointsListProps> = ({
  points,
  onPointSelect,
  onPointRemove,
  onPointUpdate,
  onPointsReorder,
}) => {
  // Initialize editing state
  const [editing, setEditing] = useState<EditingState>({
    pointId: null,
    field: null,
    value: '',
  });

  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = ({ active }: { active: { id: UniqueIdentifier } }) => {
    const element = document.getElementById(active.id.toString()); // Convert to string for DOM access
    if (element) {
      const rect = element.getBoundingClientRect();
      dragStartPosition.current = { x: rect.left, y: rect.top };
    }
  };
  
  const handleDragEnd = ({
    active,
    over,
  }: {
    active: { id: UniqueIdentifier };
    over: { id: UniqueIdentifier } | null;
  }) => {
    if (!over || active.id !== over.id) {
      handleReorder(active.id.toString(), over?.id.toString() || ''); // Convert IDs to strings
    }
  
    const element = document.getElementById(active.id.toString());
    if (element && dragStartPosition.current) {
      const rect = element.getBoundingClientRect();
      const distanceX = Math.abs(rect.left - dragStartPosition.current.x);
      const distanceY = Math.abs(rect.top - dragStartPosition.current.y);
  
      if (distanceX < 5 && distanceY < 5) {
        const point = points.find((p) => p.id === active.id.toString());
        if (point) {
          onPointSelect(point);
        }
      }
    }
  
    dragStartPosition.current = null;
  };

  
  // Handle clicking on a field to start editing
  const handleFieldClick = (point: PinnedPoint, field: EditableField) => {
    let value: string;

    // If the field is numeric, format it to 4 decimal places
    if (['latitude', 'longitude'].includes(field)) {
      // Ensure that toFixed is called on a number
      const numValue = typeof point[field] === 'number' ? point[field] : Number(point[field]);
      value = numValue.toFixed(4);
    } else {
      // For non-numeric fields, use the string representation
      value = String(point[field]);
    }

    setEditing({
      pointId: point.id,
      field: field, // field is guaranteed to be EditableField, not null
      value: value,
    });
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditing((prev) => ({
      ...prev,
      value: e.target.value,
    }));
  };

  // Handle saving the edited value
  const handleSave = (point: PinnedPoint) => {
    if (editing.pointId && editing.field) {
      const originalValue = point[editing.field];
      let newValue: string | number = editing.value.trim();

      // Convert to number for specific fields
      if (['height', 'latitude', 'longitude'].includes(editing.field)) {
        const parsed = Number(newValue);
        if (isNaN(parsed)) {
          alert(`Please enter a valid number for ${editing.field}.`);
          return;
        }
        newValue = parsed;
      }

      // Update only if the value has changed
      if (newValue !== originalValue) {
        onPointUpdate({
          ...point,
          [editing.field]: newValue,
        });
      }
    }
    // Reset editing state
    setEditing({ pointId: null, field: null, value: '' });
  };

  // Handle blur event to save changes
  const handleBlur = (point: PinnedPoint) => {
    handleSave(point);
  };

  // Handle key events for saving or cancelling
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    point: PinnedPoint
  ) => {
    if (e.key === 'Enter') {
      handleSave(point);
    } else if (e.key === 'Escape') {
      // Cancel editing on Escape
      setEditing({ pointId: null, field: null, value: '' });
    }
  };

  // Render a field, either as text or input if editing
  const renderField = (
    point: PinnedPoint,
    field: EditableField,
    displayValue: React.ReactNode
  ) => {
    const isEditing =
      editing.pointId === point.id && editing.field === field;

    return isEditing ? (
      <input
        type={['height', 'latitude', 'longitude'].includes(field) ? 'number' : 'text'}
        value={editing.value}
        onChange={handleChange}
        onBlur={() => handleBlur(point)}
        onKeyDown={(e) => handleKeyDown(e, point)}
        autoFocus
        className="border border-gray-300 rounded px-2 py-1"
      />
    ) : (
      <span
        onPointerDown={(e) => e.stopPropagation()}
        draggable={false}
        onClick={() => handleFieldClick(point, field)}
        className="cursor-pointer hover:underline"
      >
        {displayValue}
      </span>
    );
  };

  const handleReorder = (activeId: string, overId: string) => {
    const oldIndex = points.findIndex((point) => point.id === activeId);
    const newIndex = points.findIndex((point) => point.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const updatedPoints = arrayMove(points, oldIndex, newIndex);
      onPointsReorder(updatedPoints); // Update points in parent component
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={points} strategy={verticalListSortingStrategy}>
        <ul>
          {points.map((point) => (
            <SortableItem key={point.id} point={point} className="mb-4 p-4 bg-white shadow-md rounded relative" onPointSelect={onPointSelect}>
              {/* Action Buttons */}
              <div className="absolute flex space-x-2 top-3 right-3">
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPointRemove(point);
                  }}
                  draggable={false}
                  className="hover:bg-gray-200 rounded-full p-1 no-drag"
                  aria-label="Remove Point"
                >
                  <img src="/images/bin.svg" alt="Remove" className="w-5 h-5" />
                </button>
              </div>

              {/* Name */}
              <div>
                <h3 className="font-bold mb-2">
                  {renderField(point, 'name', point.name)}
                </h3>
                {/* Height */}
                <p>
                  <strong>Height:</strong> {renderField(point, 'height', point.height)}
                </p>
                {/* Latitude */}
                <p>
                  <strong>Latitude:</strong> {renderField(point, 'latitude', point.latitude.toFixed(4))}
                </p>
                {/* Longitude */}
                <p>
                  <strong>Longitude:</strong> {renderField(point, 'longitude', point.longitude.toFixed(4))}
                </p>
              </div>
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export default PinnedPointsList;
