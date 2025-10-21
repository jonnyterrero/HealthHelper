"use client";

import React from "react";

type Props = {
  imageDataUrl: string;
  onApplyCalibrated?: (dataUrl: string) => void;
};

// Lightweight canvas ROI tool inspired by the provided Streamlit canvas examples
// - Draw a rectangle ROI over the image
// - Apply white-balance correction using ROI mean (neutral gray assumption)
// - Optionally clear/reset
export const CanvasRoi: React.FC<Props> = ({ imageDataUrl, onApplyCalibrated }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const overlayRef = React.useRef<HTMLCanvasElement | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const [isDown, setIsDown] = React.useState(false);
  const [start, setStart] = React.useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [ready, setReady] = React.useState(false);

  // Load image
  React.useEffect(() => {
    const img = new Image();
    imgRef.current = img;
    img.src = imageDataUrl;
    img.onload = () => {
      setReady(true);
      requestAnimationFrame(() => layout());
    };
  }, [imageDataUrl]);

  // Handle layout on resize
  React.useEffect(() => {
    const ro = new ResizeObserver(() => layout());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  function layout() {
    const img = imgRef.current;
    const base = canvasRef.current;
    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!img || !base || !overlay || !container) return;

    const dpr = window.devicePixelRatio || 1;

    const maxW = container.clientWidth || 600;
    const scale = Math.min(1, maxW / img.naturalWidth);
    const viewW = Math.floor(img.naturalWidth * scale);
    const viewH = Math.floor(img.naturalHeight * scale);

    // Size canvases
    base.width = Math.floor(viewW * dpr);
    base.height = Math.floor(viewH * dpr);
    base.style.width = `${viewW}px`;
    base.style.height = `${viewH}px`;

    overlay.width = Math.floor(viewW * dpr);
    overlay.height = Math.floor(viewH * dpr);
    overlay.style.width = `${viewW}px`;
    overlay.style.height = `${viewH}px`;

    // Draw image to base canvas
    const ctx = base.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.drawImage(img, 0, 0, viewW, viewH);

    // Redraw overlay rectangle if exists
    drawOverlay();
  }

  function drawOverlay() {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = overlay.width / dpr;
    const h = overlay.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (rect) {
      ctx.strokeStyle = "#22c55e"; // green
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

      ctx.fillStyle = "rgba(34,197,94,0.12)";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
  }

  function getRelativePos(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const overlay = overlayRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x: Math.max(0, Math.min(rect.width, x)), y: Math.max(0, Math.min(rect.height, y)) };
  }

  function handleDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    setIsDown(true);
    const p = getRelativePos(e);
    setStart(p);
    setRect({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  function handleMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!isDown || !start) return;
    const p = getRelativePos(e);
    const x = Math.min(start.x, p.x);
    const y = Math.min(start.y, p.y);
    const w = Math.abs(p.x - start.x);
    const h = Math.abs(p.y - start.y);
    setRect({ x, y, w, h });
    requestAnimationFrame(drawOverlay);
  }
  function handleUp() {
    setIsDown(false);
  }

  function clearBox() {
    setRect(null);
    requestAnimationFrame(drawOverlay);
  }

  function resetImage() {
    // redraw base from img
    layout();
  }

  function applyWhiteBalance() {
    const base = canvasRef.current;
    const img = imgRef.current;
    if (!base || !img) return;
    if (!rect || rect.w < 2 || rect.h < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const viewW = base.width / dpr;
    const viewH = base.height / dpr;

    const ctx = base.getContext("2d");
    if (!ctx) return;

    // Read current pixels
    const imageData = ctx.getImageData(0, 0, viewW, viewH);
    const data = imageData.data;

    // ROI bounds (clamped)
    const x = Math.max(0, Math.floor(rect.x));
    const y = Math.max(0, Math.floor(rect.y));
    const w = Math.max(1, Math.min(viewW - x, Math.floor(rect.w)));
    const h = Math.max(1, Math.min(viewH - y, Math.floor(rect.h)));

    // Compute mean of ROI
    let sumR = 0,
      sumG = 0,
      sumB = 0,
      count = 0;
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        const i = (yy * viewW + xx) * 4;
        sumR += data[i];
        sumG += data[i + 1];
        sumB += data[i + 2];
        count++;
      }
    }
    if (count === 0) return;

    const meanR = sumR / count + 1e-6;
    const meanG = sumG / count + 1e-6;
    const meanB = sumB / count + 1e-6;
    const target = (meanR + meanG + meanB) / 3;

    const gR = target / meanR;
    const gG = target / meanG;
    const gB = target / meanB;

    // Apply gains
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, Math.round(data[i] * gR)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(data[i + 1] * gG)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(data[i + 2] * gB)));
    }

    ctx.putImageData(imageData, 0, 0);

    if (onApplyCalibrated) {
      const dataUrl = base.toDataURL("image/png");
      onApplyCalibrated(dataUrl);
    }
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="relative w-full">
        <canvas ref={canvasRef} className="block w-full rounded border" />
        <canvas
          ref={overlayRef}
          className="absolute left-0 top-0 block w-full h-full cursor-crosshair"
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded border border-pink-300 text-pink-700 hover:bg-pink-50 text-sm"
          onClick={applyWhiteBalance}
          disabled={!ready || !rect}
          title="Apply white-balance using ROI"
        >
          Apply white balance (ROI)
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded border bg-pink-100 text-pink-700 hover:bg-pink-200 text-sm"
          onClick={clearBox}
        >
          Clear box
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded border bg-pink-200 text-pink-900 hover:bg-pink-300 text-sm"
          onClick={resetImage}
        >
          Reset image
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: Drag to draw a rectangle over a neutral gray/white patch to correct color balance. Then re-run segmentation.
      </p>
    </div>
  );
};

export default CanvasRoi;