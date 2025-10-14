"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type BodyMapProps = {
  view: "front" | "back";
  onViewChange: (view: "front" | "back") => void;
  selectedLocation?: { x: number; y: number; region: string };
  onLocationClick: (x: number, y: number, region: string) => void;
  lesionMarkers?: Array<{ x: number; y: number; label: string; color?: string }>;
};

const BODY_REGIONS = {
  front: [
    { name: "head", path: "M150,30 L170,30 L175,50 L170,70 L150,70 L145,50 Z", color: "#FFE4E1" },
    { name: "neck", path: "M155,70 L165,70 L165,85 L155,85 Z", color: "#FFE4E1" },
    { name: "shoulders", path: "M130,85 L145,85 L145,110 L130,115 Z M175,85 L190,85 L190,115 L175,110 Z", color: "#FFD4D4" },
    { name: "chest", path: "M145,85 L175,85 L175,130 L145,130 Z", color: "#FFD4D4" },
    { name: "arms", path: "M130,115 L140,115 L140,180 L130,180 Z M180,115 L190,115 L190,180 L180,180 Z", color: "#FFE4E1" },
    { name: "forearms", path: "M130,180 L140,180 L140,230 L130,230 Z M180,180 L190,180 L190,230 L180,230 Z", color: "#FFE4E1" },
    { name: "hands", path: "M125,230 L145,230 L145,250 L125,250 Z M175,230 L195,230 L195,250 L175,250 Z", color: "#FFDAB9" },
    { name: "abdomen", path: "M145,130 L175,130 L175,170 L145,170 Z", color: "#FFD4D4" },
    { name: "legs", path: "M145,170 L165,170 L165,280 L145,280 Z M165,170 L175,170 L175,280 L165,280 Z", color: "#FFE4E1" },
    { name: "feet", path: "M140,280 L170,280 L170,295 L140,295 Z M170,280 L180,280 L180,295 L170,295 Z", color: "#FFDAB9" },
  ],
  back: [
    { name: "head", path: "M150,30 L170,30 L175,50 L170,70 L150,70 L145,50 Z", color: "#FFE4E1" },
    { name: "neck", path: "M155,70 L165,70 L165,85 L155,85 Z", color: "#FFE4E1" },
    { name: "shoulders", path: "M130,85 L145,85 L145,110 L130,115 Z M175,85 L190,85 L190,115 L175,110 Z", color: "#FFD4D4" },
    { name: "back", path: "M145,85 L175,85 L175,170 L145,170 Z", color: "#FFD4D4" },
    { name: "arms", path: "M130,115 L140,115 L140,180 L130,180 Z M180,115 L190,115 L190,180 L180,180 Z", color: "#FFE4E1" },
    { name: "forearms", path: "M130,180 L140,180 L140,230 L130,230 Z M180,180 L190,180 L190,230 L180,230 Z", color: "#FFE4E1" },
    { name: "hands", path: "M125,230 L145,230 L145,250 L125,250 Z M175,230 L195,230 L195,250 L175,250 Z", color: "#FFDAB9" },
    { name: "legs", path: "M145,170 L165,170 L165,280 L145,280 Z M165,170 L175,170 L175,280 L165,280 Z", color: "#FFE4E1" },
    { name: "feet", path: "M140,280 L170,280 L170,295 L140,295 Z M170,280 L180,280 L180,295 L170,295 Z", color: "#FFDAB9" },
  ],
};

export function BodyMap({ view, onViewChange, selectedLocation, onLocationClick, lesionMarkers = [] }: BodyMapProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [hoveredRegion, setHoveredRegion] = React.useState<string | null>(null);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 320;
    const y = ((e.clientY - rect.top) / rect.height) * 300;
    
    // Determine which region was clicked
    let clickedRegion = "other";
    const regions = BODY_REGIONS[view];
    
    for (const region of regions) {
      const paths = region.path.split(" M").filter(p => p.trim());
      // Simple region detection based on approximate bounds
      if (region.name === "head" && y < 70) clickedRegion = "head";
      else if (region.name === "neck" && y >= 70 && y < 85) clickedRegion = "neck";
      else if (region.name === "shoulders" && y >= 85 && y < 115) clickedRegion = "shoulders";
      else if (region.name === "chest" && y >= 85 && y < 130 && x >= 145 && x <= 175) clickedRegion = "chest";
      else if (region.name === "back" && y >= 85 && y < 170 && x >= 145 && x <= 175) clickedRegion = "back";
      else if (region.name === "abdomen" && y >= 130 && y < 170 && x >= 145 && x <= 175) clickedRegion = "abdomen";
      else if (region.name === "arms" && y >= 115 && y < 180) clickedRegion = "arms";
      else if (region.name === "forearms" && y >= 180 && y < 230) clickedRegion = "forearms";
      else if (region.name === "hands" && y >= 230 && y < 250) clickedRegion = "hands";
      else if (region.name === "legs" && y >= 170 && y < 280 && x >= 145 && x <= 175) clickedRegion = "legs";
      else if (region.name === "feet" && y >= 280) clickedRegion = "feet";
    }
    
    onLocationClick(Math.round(x), Math.round(y), clickedRegion);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={view === "front" ? "default" : "outline"}
          onClick={() => onViewChange("front")}
          className="flex-1"
        >
          Front View
        </Button>
        <Button
          variant={view === "back" ? "default" : "outline"}
          onClick={() => onViewChange("back")}
          className="flex-1"
        >
          Back View
        </Button>
      </div>

      {/* SVG Body Map */}
      <div className="border rounded-lg bg-gradient-to-b from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4">
        <svg
          ref={svgRef}
          viewBox="0 0 320 300"
          className="w-full h-auto cursor-crosshair"
          onClick={handleSvgClick}
        >
          {/* Body regions */}
          {BODY_REGIONS[view].map((region) => (
            <g key={region.name}>
              <path
                d={region.path}
                fill={hoveredRegion === region.name ? "#FFA07A" : region.color}
                stroke="#333"
                strokeWidth="1.5"
                opacity="0.8"
                onMouseEnter={() => setHoveredRegion(region.name)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
            </g>
          ))}

          {/* Selected location marker */}
          {selectedLocation && (
            <g>
              <circle
                cx={selectedLocation.x}
                cy={selectedLocation.y}
                r="6"
                fill="red"
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={selectedLocation.x}
                cy={selectedLocation.y}
                r="12"
                fill="none"
                stroke="red"
                strokeWidth="2"
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="12"
                  to="20"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}

          {/* Existing lesion markers */}
          {lesionMarkers.map((marker, idx) => (
            <g key={idx}>
              <circle
                cx={marker.x}
                cy={marker.y}
                r="5"
                fill={marker.color || "#FF6B6B"}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={marker.x}
                y={marker.y - 10}
                fontSize="10"
                fill="#333"
                textAnchor="middle"
                className="font-semibold"
              >
                {marker.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Location Info */}
      {selectedLocation && (
        <div className="p-3 bg-muted rounded-lg space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected Location:</span>
            <Badge variant="secondary" className="capitalize">{selectedLocation.region}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Coordinates: ({selectedLocation.x}, {selectedLocation.y})
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Click anywhere on the body to mark lesion location</p>
        <p>• Switch between front and back views</p>
        <p>• Coordinates are automatically saved with your lesion record</p>
      </div>
    </div>
  );
}

