"use client";

import dynamic from "next/dynamic";

const OfficeFPV3D = dynamic(() => import("@/components/OfficeFPV3D"), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen flex items-center justify-center bg-[#fbf9f4] font-mono text-xs text-stone-700 select-none">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 bg-orange-600 rotate-45 animate-spin" />
        <span className="font-bold tracking-wider">INITIALIZING 3D ENVIRONMENT...</span>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full min-h-screen">
      <OfficeFPV3D />
    </main>
  );
}
