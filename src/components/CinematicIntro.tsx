"use client";

import React, { useEffect, useRef, useState } from "react";

interface CinematicIntroProps {
  onComplete?: () => void;
}

const NAME_LETTERS = [
  "U", "t", "h", "u", "m",
  " ",
  "N", "a", "l", "i", "n", "d", "a"
];

const TOTAL_DURATION = 4200; // 4.2 seconds for realistic, smooth handwriting
const WRITE_START = 350;
const WRITE_DURATION = 3300; // finishes writing at 3650ms, ink settles until 4200ms
const CHAR_TIME = WRITE_DURATION / NAME_LETTERS.length; // ~254ms per letter

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasCompletedRef = useRef(false);

  // Smooth 4.2-second timeline clock (runs once on mount)
  useEffect(() => {
    if (hasCompletedRef.current) return;
    const startTime = performance.now();

    let frameId: number;
    const tick = () => {
      const now = performance.now();
      const time = now - startTime;

      if (time < TOTAL_DURATION) {
        setElapsed(time);
        setProgress(Math.min(100, Math.round((time / TOTAL_DURATION) * 100)));
        frameId = requestAnimationFrame(tick);
      } else {
        setElapsed(TOTAL_DURATION);
        setProgress(100);
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onCompleteRef.current?.();
        }
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Real-time 3D Architectural Motion Canvas (Perspective corridor fly-through)
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
    const speed = 0.015;

    // Ambient floating particles (cinematic dust / light motes)
    const particles = Array.from({ length: 45 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random() * 4 + 0.5,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.2,
    }));

    const render = () => {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = Math.min(width, height) * 0.9;

      zOffset = (zOffset + speed) % 1;

      // Draw perspective hallway depth frames (concentric camera frames)
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const depth = ((i + zOffset) / 7) * 3 + 0.3;
        const scale = fov / depth;

        const hw = (width * 0.42) * (scale / fov);
        const hh = (height * 0.38) * (scale / fov);

        const alpha = Math.max(0, Math.min(0.28, 0.28 - (depth / 3) * 0.25));
        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.85})`; // Burnt architectural orange wireframe

        ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);

        // Technical corner crosshairs
        const crossSize = 5;
        ctx.strokeStyle = `rgba(214, 211, 209, ${alpha * 0.6})`;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(cx - hw - crossSize, cy - hh);
        ctx.lineTo(cx - hw + crossSize, cy - hh);
        ctx.moveTo(cx - hw, cy - hh - crossSize);
        ctx.lineTo(cx - hw, cy - hh + crossSize);
        // Top-right
        ctx.moveTo(cx + hw - crossSize, cy - hh);
        ctx.lineTo(cx + hw + crossSize, cy - hh);
        ctx.moveTo(cx + hw, cy - hh - crossSize);
        ctx.lineTo(cx + hw, cy - hh + crossSize);
        // Bottom-left
        ctx.moveTo(cx - hw - crossSize, cy + hh);
        ctx.lineTo(cx - hw + crossSize, cy + hh);
        ctx.moveTo(cx - hw, cy + hh - crossSize);
        ctx.lineTo(cx - hw, cy + hh + crossSize);
        // Bottom-right
        ctx.moveTo(cx + hw - crossSize, cy + hh);
        ctx.lineTo(cx + hw + crossSize, cy + hh);
        ctx.moveTo(cx + hw, cy + hh - crossSize);
        ctx.lineTo(cx + hw, cy + hh + crossSize);
        ctx.stroke();
      }

      // Draw corridor 4 corner vanishing rays
      const maxHw = width * 0.48;
      const maxHh = height * 0.44;
      ctx.strokeStyle = "rgba(120, 113, 108, 0.12)";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - maxHw, cy - maxHh);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxHw, cy - maxHh);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - maxHw, cy + maxHh);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxHw, cy + maxHh);
      ctx.stroke();

      // Draw architectural horizontal reference baseline
      ctx.strokeStyle = "rgba(249, 115, 22, 0.15)";
      ctx.beginPath();
      ctx.moveTo(cx - maxHw, cy);
      ctx.lineTo(cx + maxHw, cy);
      ctx.stroke();

      // Render floating 3D dust particles
      for (const p of particles) {
        p.z -= speed * 0.8;
        if (p.z <= 0.2) p.z = 4;

        const pScale = fov / p.z;
        const px = cx + p.x * pScale;
        const py = cy + p.y * pScale;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const pAlpha = p.alpha * (1 - p.z / 4);
          ctx.fillStyle = `rgba(249, 115, 22, ${pAlpha})`;
          ctx.beginPath();
          ctx.arc(px, py, p.radius * (pScale / fov) * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-stone-100 flex items-center justify-center overflow-hidden select-none font-mono">
      {/* Real-time 3D Cinematic Motion Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Center Title Card */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl w-full">


        {/* Authentic Scratchy Hand-Written Name (Written Letter by Letter) */}
        <div className="relative flex items-center justify-center py-2 min-h-[4.5rem] sm:min-h-[6rem] md:min-h-[7.5rem]">
          <h1
            className="font-scratchy text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#fdfcf9] tracking-wide whitespace-nowrap select-none flex items-center"
            style={{
              filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.85)) drop-shadow(0 0 1px rgba(255,255,255,0.4))",
            }}
          >
            {NAME_LETTERS.map((char, idx) => {
              // Word space between "Uthum" and "Nalinda"
              if (char === " ") {
                return (
                  <span
                    key={`space-${idx}`}
                    className="inline-block w-3 sm:w-5 md:w-6"
                    aria-hidden="true"
                  />
                );
              }

              const charStart = WRITE_START + idx * CHAR_TIME;
              const charEnd = charStart + CHAR_TIME * 0.92; // 92% writing, 8% natural pen-lift

              const isWritten = elapsed >= charEnd;
              const isWriting = elapsed >= charStart && elapsed < charEnd;
              const isPending = elapsed < charStart;

              // Calculate active stroke reveal fraction
              const fraction = isWriting
                ? Math.min(1, Math.max(0, (elapsed - charStart) / (charEnd - charStart)))
                : isWritten
                  ? 1
                  : 0;

              return (
                <span
                  key={`char-${idx}-${char}`}
                  className="relative inline-block"
                  style={{
                    opacity: isPending ? 0 : 1,
                    clipPath: isWriting
                      ? `inset(0 ${(100 - fraction * 100).toFixed(1)}% 0 0)`
                      : "none",
                    transition: isWriting ? "none" : "opacity 0.05s ease-out",
                  }}
                >
                  {char}

                  {/* Active Drafting Pen Nib at the tip of the ink stroke */}
                  {isWriting && (
                    <span
                      className="absolute -top-1 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] pointer-events-none"
                      style={{
                        transform: "translate(50%, -20%)",
                      }}
                    >
                      <span className="absolute inset-0 rounded-full bg-amber-300 animate-ping opacity-75" />
                    </span>
                  )}
                </span>
              );
            })}
          </h1>
        </div>



        {/* Sleek Cinematic Progress Bar */}
        <div className="mt-8 w-72 sm:w-96 space-y-2.5">
          <div className="w-full h-2 bg-stone-950/90 rounded-full overflow-hidden p-[1px] border border-stone-700/80 shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-amber-300 rounded-full relative transition-[width] duration-75 ease-linear"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 12px rgba(249, 115, 22, 0.9)",
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono tracking-wider text-stone-400">
            <span>Loading...</span>
            <span className="text-orange-400 font-bold tracking-widest">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
