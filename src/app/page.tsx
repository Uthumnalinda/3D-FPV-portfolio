"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import CinematicIntro from "@/components/CinematicIntro";

const OfficeFPV3D = dynamic(() => import("@/components/OfficeFPV3D"), {
  ssr: false,
});

export default function Home() {
  const [introFinished, setIntroFinished] = useState(false);
  const [introFading, setIntroFading] = useState(false);

  const handleIntroComplete = () => {
    setIntroFading(true);
    setTimeout(() => {
      setIntroFinished(true);
    }, 700); // 700ms smooth cinematic crossfade
  };

  return (
    <main className="w-full min-h-screen relative overflow-hidden bg-[#fbf9f4]">
      {/* 3D Walkthrough mounts and builds textures in the background */}
      <OfficeFPV3D />

      {/* Cinematic 3D Intro (Plays for 3.5 seconds, then crossfades into the lobby) */}
      {!introFinished && (
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-700 ease-out ${
            introFading ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <CinematicIntro onComplete={handleIntroComplete} />
        </div>
      )}
    </main>
  );
}
