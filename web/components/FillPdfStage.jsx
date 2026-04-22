"use client";
import { useCallback, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva";
let nid = 1;
function nextId() {
  nid += 1;
  return nid;
}

export default function FillPdfStage({ bgImage, width, height, items, onItemsChange }) {
  const stageRef = useRef(null);

  const handleDblClick = useCallback(
    (e) => {
      if (e.target !== e.target.getStage() && e.target.getClassName() !== "Image") return;
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;
      const id = nextId();
      onItemsChange([
        ...items,
        {
          id,
          x: pos.x,
          y: pos.y,
          text: "Text",
          fontSize: 18,
        },
      ]);
    },
    [items, onItemsChange]
  );

  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden bg-zinc-100 inline-block max-w-full">
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
      >
        <Layer>
          <KonvaImage image={bgImage} width={width} height={height} listening />
          {items.map((t) => (
            <Text
              key={t.id}
              text={t.text}
              x={t.x}
              y={t.y}
              fontSize={t.fontSize}
              fill="#111827"
              draggable
              onDblClick={(e) => {
                e.cancelBubble = true;
                const txt = window.prompt("Edit text", t.text);
                if (txt == null) return;
                onItemsChange(items.map((x) => (x.id === t.id ? { ...x, text: txt } : x)));
              }}
              onDragEnd={(ev) => {
                const node = ev.target;
                onItemsChange(
                  items.map((x) =>
                    x.id === t.id
                      ? {
                          ...x,
                          x: node.x(),
                          y: node.y(),
                        }
                      : x
                  )
                );
              }}
            />
          ))}
        </Layer>
      </Stage>
      <p className="text-xs text-zinc-500 px-2 py-1 bg-white">Double-click empty area to add text · Double-click text to edit · Drag to position</p>
    </div>
  );
}
