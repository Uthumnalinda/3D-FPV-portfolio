"use client";

import React, { useEffect, useRef, useState } from "react";

interface CinematicIntroProps {
  onComplete?: () => void;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [timecode, setTimecode] = useState("00:00:01:00");

  // Timecode generator
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame = (frame + 1) % 24;
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      setTimecode(`00:00:01:${pad(frame)}`);
    }, 41); // ~24fps timecode cadence

    return () => clearInterval(interval);
  }, []);

  // Smooth 3.5-second cinematic loading progress
  useEffect(() => {
    const startTime = performance.now();
    const duration = 3500; // Exactly 3.5 seconds

    let frameId: number;
    const tick = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed < duration) {
        frameId = requestAnimationFrame(tick);
      } else {
        if (onComplete) {
          onComplete();
        }
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [onComplete]);

  // Real-time 3D Architectural Motion Canvas (Simulates a rendered studio video)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // 3D Corridor grid lines & architectural beams
    let zOffset = 0;
    const speed = 0.018;

    // Ambient floating particles (cinematic dust / light motes)
    const motes = Array.from({ length: 45 }, () => ({
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 2.5,
      z: Math.random() * 8 + 1,
      size: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.4 + 0.2,
    }));

    const render = () => {
      zOffset = (zOffset + speed) % 1.0;

      // Deep atmospheric background with radial vignette
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.1,
        width / 2,
        height / 2,
        width * 0.75
      );
      bgGrad.addColorStop(0, "#181716");
      bgGrad.addColorStop(0.5, "#100f0e");
      bgGrad.addColorStop(1, "#070707");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 550;

      // 1. Draw 3D Infinite Architectural Corridor Beams
      const corridorWidth = 2.4;
      const corridorHeight = 1.6;

      ctx.save();
      // Four longitudinal architectural boundary rails
      const rails = [
        [-corridorWidth, -corridorHeight],
        [corridorWidth, -corridorHeight],
        [-corridorWidth, corridorHeight],
        [corridorWidth, corridorHeight],
      ];

      // Draw converging perspective lines towards horizon
      rails.forEach(([rx, ry]) => {
        const x1 = cx + (rx / 0.8) * fov;
        const y1 = cy + (ry / 0.8) * fov;
        const x2 = cx + (rx / 14) * fov;
        const y2 = cy + (ry / 14) * fov;

        const railGrad = ctx.createLinearGradient(x1, y1, x2, y2);
        railGrad.addColorStop(0, "rgba(234, 88, 12, 0.45)"); // Warm burnt orange edge
        railGrad.addColorStop(0.35, "rgba(214, 204, 187, 0.22)"); // Architectural limestone
        railGrad.addColorStop(1, "rgba(214, 204, 187, 0.0)");

        ctx.strokeStyle = railGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Transverse perspective structural portals (doorway rings moving forward)
      const portalCount = 8;
      for (let i = 0; i < portalCount; i++) {
        const z = ((i - zOffset + portalCount) % portalCount) * 1.5 + 0.9;
        const scale = fov / z;
        const pw = corridorWidth * scale;
        const ph = corridorHeight * scale;

        const alpha = Math.max(0, Math.min(0.45, 1 - z / (portalCount * 1.4)));
        ctx.strokeStyle = `rgba(224, 215, 200, ${alpha * 0.85})`;
        ctx.lineWidth = Math.max(1, 2.5 / z);

        // Architectural doorframe rectangle
        ctx.strokeRect(cx - pw, cy - ph, pw * 2, ph * 2);

        // Subtle corner crosshairs on each frame
        const cross = 8 / (z * 0.5);
        ctx.strokeStyle = `rgba(234, 88, 12, ${alpha * 0.9})`;
        [
          [cx - pw, cy - ph],
          [cx + pw, cy - ph],
          [cx - pw, cy + ph],
          [cx + pw, cy + ph],
        ].forEach(([px, py]) => {
          ctx.beginPath();
          ctx.moveTo(px - cross, py);
          ctx.lineTo(px + cross, py);
          ctx.moveTo(px, py - cross);
          ctx.lineTo(px, py + cross);
          ctx.stroke();
        });
      }

      // 2. Cinematic Floating Dust Motes (Depth of field)
      motes.forEach((m) => {
        m.z -= speed * 1.2;
        if (m.z <= 0.4) m.z = 8;

        const sx = cx + (m.x / m.z) * fov;
        const sy = cy + (m.y / m.z) * fov;
        const r = (m.size / m.z) * 1.5;
        const a = (1 - m.z / 8) * m.alpha;

        if (sx > 0 && sx < width && sy > 0 && sy < height) {
          ctx.fillStyle = `rgba(255, 248, 235, ${a})`;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.6, r), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Subtle horizontal anamorphic light sweep across the center
      const sweepGrad = ctx.createLinearGradient(0, cy - 2, 0, cy + 2);
      sweepGrad.addColorStop(0, "rgba(234, 88, 12, 0)");
      sweepGrad.addColorStop(0.5, "rgba(234, 88, 12, 0.12)");
      sweepGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, cy - 80, width, 160);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-stone-100 flex flex-col justify-between overflow-hidden select-none font-mono">
      {/* Real-time 3D Cinematic Motion Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Cinema Letterbox Bar */}
      <div className="relative z-10 px-6 sm:px-12 py-5 flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-800/60 bg-black/75 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <span className="font-bold tracking-widest text-stone-300">LIVE FEED</span>
          <span className="text-stone-600 ml-2 hidden sm:inline">CAM-01 • 35mm F/1.4</span>
        </div>
        <div className="tracking-widest font-bold text-stone-400">{timecode}</div>
      </div>

      {/* Center 3D Movie-Style Title Card */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 my-auto">
        {/* Subtle Architectural Grid Marker */}
        <div className="flex items-center gap-3 text-orange-500/90 text-xs font-bold tracking-widest uppercase mb-3">
          <span className="w-2.5 h-2.5 bg-orange-600 rotate-45" />
          <span>SOFTWARE & SECURITY LAB</span>
          <span className="w-2.5 h-2.5 bg-orange-600 rotate-45" />
        </div>

        {/* 3D Extruded Masterpiece Typography */}
        <h1
          className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase text-[#fdfcf9] tracking-[0.08em] sm:tracking-[0.14em] scale-y-110"
          style={{
            textShadow:
              "0 1px 0 #a8a29e, 0 2px 0 #948e89, 0 3px 0 #78716c, 0 4px 0 #57534e, 0 5px 0 #44403c, 0 7px 1px rgba(0,0,0,0.5), 0 12px 28px rgba(0,0,0,0.85)",
          }}
        >
          UTHUM NALINDA
        </h1>

        {/* Human Subtitle */}
        <p className="mt-4 text-xs sm:text-sm font-sans font-medium text-stone-300 tracking-wider max-w-md">
          Architectural Portfolio & Interactive Walkthrough
        </p>

        {/* Sleek Cinematic Progress Bar */}
        <div className="mt-8 w-64 sm:w-80 space-y-2">
          <div className="w-full h-1 bg-stone-800/80 rounded-full overflow-hidden p-[1px] border border-stone-700/60">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-stone-400">
            <span>Preparing 3D environment...</span>
            <span className="text-orange-400 font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Cinema Letterbox Bar */}
      <div className="relative z-10 px-6 sm:px-12 py-5 flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-800/60 bg-black/75 backdrop-blur-md">
        <span className="text-stone-500 hidden sm:inline">COLOMBO, SRI LANKA (UTC+5:30)</span>
        <span className="text-stone-400 mx-auto sm:mx-0">
          First-Person Interactive Experience
        </span>
        <span className="text-stone-500 hidden sm:inline font-sans">© 2026</span>
      </div>
    </div>
  );
}

