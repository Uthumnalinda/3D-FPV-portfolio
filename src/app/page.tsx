"use client";

import dynamic from "next/dynamic";
import CinematicIntro from "@/components/CinematicIntro";

const OfficeFPV3D = dynamic(() => import("@/components/OfficeFPV3D"), {
  ssr: false,
  loading: () => <CinematicIntro />,
});

export default function Home() {
  return (
    <main className="w-full min-h-screen">
      <OfficeFPV3D />
    </main>
  );
}
