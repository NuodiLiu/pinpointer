"use client";

import React, { useState } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import Group from "../types/Group";
import PinnedPoint from "../types/PinnedPoint";

type DragItem =
  | { kind: "group"; groupId: string }
  | { kind: "point"; pointId: string };

function getItemId(item: DragItem): UniqueIdentifier {
  return item.kind === "group"
    ? `group-${item.groupId}`
    : `point-${item.pointId}`;
}

interface ManageGroupsModalProps {
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
}

const DEFAULT_GROUP_ID = "Ungrouped points";

export default function ManageGroupsModal({
  groups,
  setGroups,
}: ManageGroupsModalProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupCount, setGroupCount] = useState<number>(0); 
  // ↑ Tracks how many groups have been created so far

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const sensors = useSensors(useSensor(PointerSensor));

  /**
   * 1. 把 "ungrouped" 里的 pinnedPoints 当作顶层的 point 项
   * 2. 把 其它 group 当作 group 项
   */
  const ungrouped = groups.find((g) => g.id === DEFAULT_GROUP_ID);
  if (!ungrouped) {
    return <div>could not find group with id="ungrouped", please check data strucutre.</div>;
  }

  const ungroupedPoints = ungrouped.pinnedPoints;
  const normalGroups = groups.filter((g) => g.id !== DEFAULT_GROUP_ID);

  // items = ungrouped point + other group
  const topLevelItems: DragItem[] = [
    ...ungroupedPoints.map((p) => ({ kind: "point", pointId: p.id } as DragItem)),
    ...normalGroups.map((g) => ({ kind: "group", groupId: g.id } as DragItem)),
  ];

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);

    const activeItem = parseDragId(active.id as string);
    if (!activeItem || activeItem.kind === "group") {
      return;
    }

    // find where the point from
    const draggedPointId = activeItem.pointId;
    const sourceGroup = findParentGroup(draggedPointId);
    if (!sourceGroup) return;

    // ========== 1) 如果没有拖到任何 droppable，或拖到自身, 就移到 ungrouped ==========
    if (!over || active.id === over.id) {
      movePointToUngrouped(draggedPointId, sourceGroup.id);
      return;
    }

    // ========== 2) 如果拖拽到其它 item 上，解析对方 ==========
    const overItem = parseDragId(over.id as string);
    if (!overItem) return;

    // 2.1) point => point（都在 “顶层”） => 创建新 group
    if (
      overItem.kind === "point" &&
      sourceGroup.id === DEFAULT_GROUP_ID &&
      isInUngrouped(overItem.pointId)
    ) {
      createNewGroupFromPoints(draggedPointId, overItem.pointId);
      return;
    }

    // 2.2) point => group
    if (overItem.kind === "group") {
      movePointBetweenGroups(draggedPointId, sourceGroup.id, overItem.groupId);
      return;
    }

    // 2.3) point => group 中的某个 point => 移到该 group
    if (overItem.kind === "point") {
      const parent = findParentGroup(overItem.pointId);
      if (parent) {
        movePointBetweenGroups(draggedPointId, sourceGroup.id, parent.id);
      }
    }
  }

  // =========== “移动 point 到 ungrouped” ===========
  function movePointToUngrouped(pointId: string, fromGroupId: string) {
    const p = getPointById(pointId);
    if (!p) return;

    setGroups((prev) => {
      // 1) 先从 sourceGroup 移除
      let next = removePoint(prev, fromGroupId, pointId);

      // 2) 再把 p 加到 ungrouped
      next = addPoint(next, DEFAULT_GROUP_ID, p);

      // 3) 最后检查是否要解散 fromGroup
      next = disbandIfNeeded(next, fromGroupId);

      return next;
    });
  }

  // =========== 创建新 group，把两个 ungrouped point 移过去 ===========
  function createNewGroupFromPoints(pointAId: string, pointBId: string) {
    const pA = getPointById(pointAId);
    const pB = getPointById(pointBId);
    if (!pA || !pB) return;

    // 生成类似 "Group 1", "Group 2"...
    setGroupCount((old) => old + 1);
    const newIndex = groupCount + 1;
    const newGroupId = `group-${newIndex}`;
    const newGroupName = `Group ${newIndex}`;

    const newGroup: Group = {
      id: newGroupId,
      name: newGroupName,
      color: "#aaa",
      pinnedPoints: [pA, pB],
      isVisible: true,
      isSelected: false,
    };

    setGroups((prev) => {
      // 1) 移除 pA, pB from ungrouped
      let next = removePoint(prev, DEFAULT_GROUP_ID, pointAId);
      next = removePoint(next, DEFAULT_GROUP_ID, pointBId);

      // 2) 插入新组
      next = [newGroup, ...next];
      return next;
    });
  }

  // =========== 在两个 group 之间移动 point ===========
  function movePointBetweenGroups(
    pointId: string,
    fromGroupId: string,
    toGroupId: string
  ) {
    if (fromGroupId === toGroupId) return;
    const p = getPointById(pointId);
    if (!p) return;

    setGroups((prev) => {
      // 1) 先从 sourceGroup 中删除
      let next = removePoint(prev, fromGroupId, pointId);

      // 2) 放进 toGroupId
      next = addPoint(next, toGroupId, p);

      // 3) 检查 sourceGroup 是否要解散
      next = disbandIfNeeded(next, fromGroupId);

      return next;
    });
  }

  // =========== 当某个 group pinnedPoints < 2 时，解散它 ===========
  // (但不解散 ungrouped)
  function disbandIfNeeded(groupsData: Group[], groupId: string): Group[] {
    if (groupId === DEFAULT_GROUP_ID) return groupsData;
  
    return groupsData.reduce((acc, g) => {
      if (g.id !== groupId) {
        acc.push(g);
        return acc;
      }
  
      // 是目标 group
      if (g.pinnedPoints.length === 0) {
        // 没有 pinnedPoints => remove group
        return acc; // omit this group
      }
  
      // >=1 pinned point => 保留 group 原样
      acc.push(g);
      return acc;
    }, [] as Group[]);
  }
  

  // =========== “将 point p 加进 groupId” 的小工具函数 ===========
  function addPoint(groupsData: Group[], groupId: string, point: PinnedPoint) {
    return groupsData.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          pinnedPoints: [...g.pinnedPoints, point],
        };
      }
      return g;
    });
  }

  // =========== “从 groupId 移除 pointId” 的小工具函数 ===========
  function removePoint(groupsData: Group[], groupId: string, pointId: string) {
    return groupsData.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          pinnedPoints: g.pinnedPoints.filter((pp) => pp.id !== pointId),
        };
      }
      return g;
    });
  }

  // =========== 点击“眼睛”图标，切换 group 的 isVisible ===========
  function toggleGroupVisibility(groupId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, isVisible: !g.isVisible } : g
      )
    );
  }

  function handleToggleFold(groupId: string) {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId], // toggle
    }));
  }

  // 🆕 重命名 group
  function handleRenameGroup(groupId: string, newName: string) {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return { ...g, name: newName };
        }
        return g;
      })
    );
  }

  // =========== 工具函数 ===========
  function parseDragId(dragId: string): DragItem | null {
    if (dragId.startsWith("point-")) {
      return { kind: "point", pointId: dragId.replace("point-", "") };
    } else if (dragId.startsWith("group-")) {
      return { kind: "group", groupId: dragId.replace("group-", "") };
    }
    return null;
  }

  function isInUngrouped(pointId: string) {
    return ungroupedPoints.some((p) => p.id === pointId);
  }

  function findParentGroup(pointId: string) {
    return groups.find((g) => g.pinnedPoints.some((pp) => pp.id === pointId));
  }

  function getPointById(pointId: string) {
    for (const g of groups) {
      const found = g.pinnedPoints.find((pp) => pp.id === pointId);
      if (found) return found;
    }
    return undefined;
  }

  return (
    <div className="w-[360px] mx-auto mt-6">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext
          items={topLevelItems.map((item) => getItemId(item))}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {topLevelItems.map((item) => (
              <SortableItem
                key={getItemId(item)}
                item={item}
                groups={groups}
                expandedGroups={expandedGroups}     
                onToggleFold={handleToggleFold}     
                onToggleVisibility={toggleGroupVisibility}
                onRenameGroup={handleRenameGroup}     
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && (
            <div className="bg-white p-2 text-sm border shadow-sm">
              {(() => {
                const item = parseDragId(activeId);
                if (!item) return activeId;
                if (item.kind === "group") {
                  const group = groups.find((g) => g.id === item.groupId);
                  return group ? group.name : activeId;
                } else if (item.kind === "point") {
                  const point = groups
                    .flatMap((g) => g.pinnedPoints)
                    .find((p) => p.id === item.pointId);
                  return point ? point.name : activeId;
                }
                return activeId;
              })()}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function SortableItem({
  item,
  groups,
  expandedGroups,
  onToggleFold,
  onToggleVisibility,
  onRenameGroup,
}: {
  item: DragItem;
  groups: Group[];
  expandedGroups: Record<string, boolean>;
  onToggleFold: (groupId: string) => void;
  onToggleVisibility: (groupId: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: getItemId(item),
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (item.kind === "group") {
    const group = groups.find((g) => g.id === item.groupId);
    if (!group) return null;

    // 🆕 local states for inline name editing
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [tempName, setTempName] = React.useState(group.name);

    const isExpanded = expandedGroups[group.id] ?? true; // default expanded if not set

    function handleNameClick() {
      setIsEditingName(true);
    }

    function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
      setTempName(e.target.value);
    }

    function handleNameBlur() {
      if (group === undefined) return;
      setIsEditingName(false);
      onRenameGroup(group.id, tempName);
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-2 bg-gray-100 border text-sm flex flex-col gap-1"
        {...attributes}
      >
        {/* The "header" row => includes group name, eye button, fold button */}
        <div className="flex items-center justify-between text-gray-700 font-medium">
          {/* 
            Only this region is the "drag handle"
            => so user can STILL drag the group,
               but not on the eye/fold icons 
          */}
          <div className="cursor-grab select-none flex items-center gap-2">
            {/* 🆕 inline editing area */}
            {isEditingName ? (
              <input
                className="border-b border-gray-400 focus:outline-none text-sm px-1"
                style={{ width: `${tempName.length + 1}ch` }} 
                // ^ approximate minimal width
                value={tempName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                autoFocus
              />
            ) : (
              <span onClick={handleNameClick}>{group.name}</span>
            )}
          </div>

          {/* 右侧按钮们 */}
          <div className="flex items-center gap-2">
            {/* 🆕 fold/unfold button */}
            <button
              type="button"
              className="text-xs px-1 border rounded"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFold(group.id);
              }}
            >
              {isExpanded ? "Fold" : "Expand"}
            </button>

            {/* toggle visibility button */}
            <button
              type="button"
              className="text-xs px-1"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation(); // ensure no drag
                onToggleVisibility(group.id);
              }}
            >
              {group.isVisible ? "👁" : "🙈"}
            </button>
          </div>
        </div>

        {/* Now the pinnedPoints in this group, only if expanded */}
        {isExpanded && (
          <SortableContext
            items={group.pinnedPoints.map((p) => `point-${p.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {group.pinnedPoints.map((p) => (
              <GroupPoint key={p.id} point={p} />
            ))}
          </SortableContext>
        )}
      </div>
    );
  }

  // Rendering an ungrouped point
  if (item.kind === "point") {
    // If item is a point at the top level (ungrouped)
    const ungroupedGroup = groups.find((g) => g.id === DEFAULT_GROUP_ID);
    const point = ungroupedGroup?.pinnedPoints.find((p) => p.id === item.pointId);
    if (!point) return null;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-2 border bg-white text-sm cursor-grab"
        {...attributes}
        {...listeners}
      >
        {point.name}
      </div>
    );
  }

  return null;
}

// ========== group 中 point 的单独渲染 ==========
function GroupPoint({ point }: { point: PinnedPoint }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `point-${point.id}`,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="py-1 text-sm text-gray-700 cursor-grab"
      {...attributes}
      {...listeners}
    >
      {point.name}
    </div>
  );
}