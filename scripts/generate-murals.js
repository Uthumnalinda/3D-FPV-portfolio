const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
console.log('Generating blackboard-style tech circuit word-cloud murals in black ink...');

// Helper: Common SVG wrapper with 100% transparent background
function wrapSvg(width, height, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <style>
        .circuit-line { stroke: #121316; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .circuit-line-thick { stroke: #121316; stroke-width: 3.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .circuit-dashed { stroke: #121316; stroke-width: 2; fill: none; stroke-dasharray: 6 5; }
        .circuit-dot { fill: #121316; }
        .circuit-ring { stroke: #121316; stroke-width: 2.2; fill: none; }
        .hero-text { font-family: 'Space Grotesk', -apple-system, sans-serif; font-weight: 900; fill: #121316; text-anchor: middle; }
        .sub-text { font-family: 'Space Grotesk', -apple-system, sans-serif; font-weight: 800; fill: #121316; text-anchor: middle; }
        .tech-label { font-family: 'JetBrains Mono', monospace; font-weight: 700; fill: #121316; }
        .icon-stroke { stroke: #121316; stroke-width: 2.4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .icon-fill { fill: #121316; }
      </style>
    </defs>
    ${content}
  </svg>`;
}

// ----------------------------------------------------------------------
// Reusable Vector Graphics matching the user's reference image
// ----------------------------------------------------------------------

// 1. Earth Globe with circuit board traces emanating from it
function drawGlobeWithCircuits(cx, cy, r) {
  return `
    <g transform="translate(${cx}, ${cy})">
      <!-- Outer Globe Perimeter -->
      <circle cx="0" cy="0" r="${r}" class="icon-stroke" stroke-width="3" />
      
      <!-- Continents (Detailed silhouettes) -->
      <!-- North America -->
      <path d="M -${r*0.65} -${r*0.5} Q -${r*0.3} -${r*0.75} -${r*0.1} -${r*0.45} Q -${r*0.2} -${r*0.2} -${r*0.35} -${r*0.05} Q -${r*0.6} -${r*0.1} -${r*0.65} -${r*0.5} Z" class="icon-fill" />
      <!-- South America -->
      <path d="M -${r*0.35} ${r*0.05} Q -${r*0.15} ${r*0.1} -${r*0.18} ${r*0.45} Q -${r*0.3} ${r*0.75} -${r*0.38} ${r*0.5} Q -${r*0.45} ${r*0.25} -${r*0.35} ${r*0.05} Z" class="icon-fill" />
      <!-- Eurasia &amp; Africa -->
      <path d="M ${r*0.1} -${r*0.6} Q ${r*0.5} -${r*0.55} ${r*0.68} -${r*0.3} Q ${r*0.55} -${r*0.1} ${r*0.4} -${r*0.05} Q ${r*0.15} -${r*0.2} ${r*0.1} -${r*0.6} Z" class="icon-fill" />
      <path d="M ${r*0.15} ${r*0.02} Q ${r*0.45} ${r*0.05} ${r*0.4} ${r*0.45} Q ${r*0.25} ${r*0.65} ${r*0.18} ${r*0.4} Q ${r*0.12} ${r*0.2} ${r*0.15} ${r*0.02} Z" class="icon-fill" />

      <!-- Circuit Traces Radiating from Left Edge -->
      <path d="M -${r} -${r*0.3} H -${r + 40} V -${r*0.6} H -${r + 75}" class="circuit-line" />
      <circle cx="-${r + 75}" cy="-${r*0.6}" r="4" class="circuit-dot" />

      <path d="M -${r} 0 H -${r + 60} V ${r*0.2} H -${r + 95}" class="circuit-line" />
      <circle cx="-${r + 95}" cy="${r*0.2}" r="4" class="circuit-dot" />

      <path d="M -${r} ${r*0.35} H -${r + 45} V ${r*0.55} H -${r + 80}" class="circuit-line" />
      <circle cx="-${r + 80}" cy="${r*0.55}" r="4" class="circuit-dot" />

      <!-- Top Circuit Traces -->
      <path d="M -${r*0.2} -${r} V -${r + 35} H -${r*0.5} V -${r + 65}" class="circuit-line" />
      <circle cx="-${r*0.5}" cy="-${r + 65}" r="4" class="circuit-dot" />

      <path d="M ${r*0.3} -${r} V -${r + 45} H ${r*0.6}" class="circuit-line" />
      <circle cx="${r*0.6}" cy="-${r + 45}" r="4" class="circuit-dot" />
    </g>
  `;
}

// 2. Light Bulb with Filament and Circuit Stems
function drawLightBulb(cx, cy, scale = 1) {
  return `
    <g transform="translate(${cx}, ${cy}) scale(${scale})">
      <!-- Radiant Short Rays -->
      <line x1="0" y1="-52" x2="0" y2="-62" class="circuit-line" />
      <line x1="-38" y1="-38" x2="-45" y2="-45" class="circuit-line" />
      <line x1="38" y1="-38" x2="45" y2="-45" class="circuit-line" />
      <line x1="-52" y1="0" x2="-62" y2="0" class="circuit-line" />
      <line x1="52" y1="0" x2="62" y2="0" class="circuit-line" />

      <!-- Bulb Dome &amp; Neck -->
      <path d="M -26 -10 C -40 -35, 40 -35, 26 -10 C 18 2, 14 14, 14 24 L -14 24 C -14 14, -18 2, -26 -10 Z" class="icon-stroke" stroke-width="3" />
      
      <!-- Screw Base Threads -->
      <line x1="-12" y1="28" x2="12" y2="28" class="circuit-line" />
      <line x1="-10" y1="33" x2="10" y2="33" class="circuit-line" />
      <path d="M -7 38 L 7 38 L 4 43 L -4 43 Z" class="circuit-dot" />

      <!-- Internal Glowing Filament -->
      <path d="M -6 18 L -6 -6 L -2 -14 L 2 -14 L 6 -6 L 6 18" class="icon-stroke" stroke-width="2" />

      <!-- Circuit Traces Leaving the Base -->
      <path d="M -4 43 V 65 H -45 V 95" class="circuit-line" />
      <circle cx="-45" cy="95" r="4" class="circuit-dot" />
      <path d="M 4 43 V 65 H 50 V 105" class="circuit-line" />
      <circle cx="50" cy="105" r="4" class="circuit-dot" />
    </g>
  `;
}

// 3. Interlocking Mechanical Gears / Cogs
function drawInterlockingGears(cx, cy, scale = 1) {
  return `
    <g transform="translate(${cx}, ${cy}) scale(${scale})">
      <!-- Primary Large Gear (12 teeth) -->
      <g>
        <circle cx="0" cy="0" r="32" class="circuit-line" stroke-width="3" />
        <circle cx="0" cy="0" r="14" class="circuit-ring" stroke-width="2.5" />
        <!-- 12 Teeth -->
        ${Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = Math.cos(a) * 31;
          const y1 = Math.sin(a) * 31;
          const x2 = Math.cos(a) * 42;
          const y2 = Math.sin(a) * 42;
          return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#121316" stroke-width="8" stroke-linecap="round" />`;
        }).join('')}
      </g>

      <!-- Secondary Meshing Gear (8 teeth) -->
      <g transform="translate(56, -42)">
        <circle cx="0" cy="0" r="22" class="circuit-line" stroke-width="2.6" />
        <circle cx="0" cy="0" r="9" class="circuit-ring" stroke-width="2" />
        <!-- 8 Teeth -->
        ${Array.from({ length: 8 }, (_, i) => {
          const a = ((i * 45 + 22.5) * Math.PI) / 180;
          const x1 = Math.cos(a) * 21;
          const y1 = Math.sin(a) * 21;
          const x2 = Math.cos(a) * 30;
          const y2 = Math.sin(a) * 30;
          return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#121316" stroke-width="6.5" stroke-linecap="round" />`;
        }).join('')}
      </g>

      <!-- Tertiary Micro Gear (6 teeth) -->
      <g transform="translate(98, -12)">
        <circle cx="0" cy="0" r="14" class="circuit-line" stroke-width="2.2" />
        <circle cx="0" cy="0" r="5" class="circuit-dot" />
        ${Array.from({ length: 6 }, (_, i) => {
          const a = ((i * 60 + 15) * Math.PI) / 180;
          const x1 = Math.cos(a) * 13;
          const y1 = Math.sin(a) * 13;
          const x2 = Math.cos(a) * 20;
          const y2 = Math.sin(a) * 20;
          return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#121316" stroke-width="5" stroke-linecap="round" />`;
        }).join('')}
      </g>
    </g>
  `;
}

// 4. Star in Concentric Dashed Ring Badge
function drawStarBadge(cx, cy, scale = 1) {
  return `
    <g transform="translate(${cx}, ${cy}) scale(${scale})">
      <circle cx="0" cy="0" r="42" class="circuit-dashed" stroke-width="2.5" />
      <circle cx="0" cy="0" r="32" class="circuit-ring" stroke-width="1.8" />
      <!-- 5-Point Star -->
      <polygon points="0,-22 6.5,-8 21,-6 10,4.5 13,19 0,11.5 -13,19 -10,4.5 -21,-6 -6.5,-8" class="icon-fill" />
      <text x="0" y="30" class="tech-label" font-size="10" text-anchor="middle">NEW</text>
    </g>
  `;
}

// 5. WiFi / Radio Transmission Waves
function drawWifiWaves(cx, cy, scale = 1) {
  return `
    <g transform="translate(${cx}, ${cy}) scale(${scale})">
      <circle cx="0" cy="0" r="4" class="circuit-dot" />
      <path d="M -8 -8 A 12 12 0 0 1 8 -8" class="icon-stroke" stroke-width="2.4" />
      <path d="M -15 -15 A 22 22 0 0 1 15 -15" class="icon-stroke" stroke-width="2.4" />
      <path d="M -22 -22 A 32 32 0 0 1 22 -22" class="icon-stroke" stroke-width="2.4" />
    </g>
  `;
}

// 6. Network Node Tree (1 parent branching to 3 children)
function drawNetworkNode(cx, cy, scale = 1) {
  return `
    <g transform="translate(${cx}, ${cy}) scale(${scale})">
      <circle cx="0" cy="0" r="6" class="circuit-ring" stroke-width="2" />
      <circle cx="0" cy="0" r="3" class="circuit-dot" />
      <!-- Branch Lines -->
      <line x1="6" y1="-2" x2="28" y2="-18" class="circuit-line" />
      <circle cx="34" cy="-22" r="5" class="circuit-dot" />
      
      <line x1="6" y1="0" x2="30" y2="0" class="circuit-line" />
      <circle cx="36" cy="0" r="5" class="circuit-dot" />
      
      <line x1="6" y1="2" x2="28" y2="18" class="circuit-line" />
      <circle cx="34" cy="22" r="5" class="circuit-dot" />
    </g>
  `;
}

// 7. Signal Bars Icon
function drawSignalBars(cx, cy) {
  return `
    <g transform="translate(${cx}, ${cy})">
      <rect x="0" y="20" width="5" height="12" class="circuit-dot" />
      <rect x="9" y="14" width="5" height="18" class="circuit-dot" />
      <rect x="18" y="8" width="5" height="24" class="circuit-dot" />
      <rect x="27" y="0" width="5" height="32" class="circuit-dot" />
    </g>
  `;
}

// 8. Dashed Word Boundary Box
function drawWordFrame(x, y, w, h) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" class="circuit-dashed" rx="6" />
    <circle cx="${x}" cy="${y}" r="3.5" class="circuit-dot" />
    <circle cx="${x + w}" cy="${y}" r="3.5" class="circuit-dot" />
    <circle cx="${x}" cy="${y + h}" r="3.5" class="circuit-dot" />
    <circle cx="${x + w}" cy="${y + h}" r="3.5" class="circuit-dot" />
  `;
}

// ======================================================================
// PANEL 1: LEFT WALL (2048 x 1440) - Systems, Core Engineering & Runtimes
// Matches the exact composition layout of the uploaded chalkboard mural!
// ======================================================================
const leftWallSvg = wrapSvg(2048, 1440, `
  <!-- ================= TOP LEFT: GLOBE & FUTURE ================= -->
  ${drawGlobeWithCircuits(280, 260, 100)}
  
  <text x="280" y="110" class="hero-text" font-size="46" letter-spacing="4">FUTURE</text>
  ${drawNetworkNode(380, 100, 1.1)}
  
  <!-- Circuit connecting Future to Globe -->
  <path d="M 180 110 H 130 V 220 H 170" class="circuit-line" />
  <circle cx="170" cy="220" r="4" class="circuit-dot" />

  <!-- CONNECTION Label with Nodes -->
  <text x="490" y="140" class="tech-label" font-size="20" letter-spacing="2">CONNECTION</text>
  <circle cx="630" cy="134" r="5" class="circuit-dot" />
  <circle cx="360" cy="134" r="5" class="circuit-dot" />
  <path d="M 365 134 H 480 M 610 134 H 625" class="circuit-dashed" />

  <!-- WiFi Waves above Global Data -->
  ${drawWifiWaves(560, 210, 1.2)}

  <!-- PROGRAMMING inside Dashed Box -->
  ${drawWordFrame(650, 160, 260, 50)}
  <text x="780" y="195" class="sub-text" font-size="26" letter-spacing="3">PROGRAMMING</text>

  <!-- GLOBAL DATA Hero Group -->
  <text x="730" y="270" class="hero-text" font-size="52" letter-spacing="3">GLOBAL</text>
  <text x="730" y="325" class="hero-text" font-size="48" letter-spacing="3">DATA</text>
  ${drawNetworkNode(850, 280, 1.2)}

  <!-- Circuit branching from Global Data -->
  <path d="M 850 320 H 940 V 230 H 1020" class="circuit-line-thick" />
  <circle cx="1020" cy="230" r="5" class="circuit-dot" />

  <!-- RESEARCH & RUST Section -->
  <text x="560" y="375" class="sub-text" font-size="30" letter-spacing="2">RESEARCH</text>
  <path d="M 450 370 H 490 V 430 H 420" class="circuit-line" />
  <circle cx="420" cy="430" r="4" class="circuit-dot" />

  <!-- ================= CENTER HERO: TECHNOLOGY & ENGINEERING ================= -->
  <!-- TECHNICS on Left -->
  <text x="320" y="525" class="hero-text" font-size="62" letter-spacing="5">TECHNICS</text>
  <circle cx="150" cy="510" r="6" class="circuit-dot" />
  <path d="M 156 510 H 190" class="circuit-line" />

  <!-- GIANT CENTER: TECHNOLOGY -->
  <text x="1040" y="525" class="hero-text" font-size="94" letter-spacing="8">TECHNOLOGY</text>
  <path d="M 600 540 H 1480" class="circuit-line-thick" />

  <!-- ENGINEERING & INNOVATION -->
  <text x="1560" y="475" class="hero-text" font-size="52" letter-spacing="4">ENGINEERING</text>
  <text x="1620" y="540" class="hero-text" font-size="56" letter-spacing="4">INNOVATION</text>
  
  <!-- Star Badge (Top Right) -->
  ${drawStarBadge(1390, 260, 1.2)}
  <text x="1230" y="210" class="tech-label" font-size="20">BUSINESS</text>
  <text x="1390" y="130" class="tech-label" font-size="18">SOFTWARE</text>
  <text x="1650" y="180" class="hero-text" font-size="38" letter-spacing="3">KNOWLEDGE</text>
  ${drawNetworkNode(1830, 175, 1.2)}

  <!-- ADVANCED PRODUCT in Dashed Box -->
  ${drawWordFrame(1480, 220, 280, 50)}
  <text x="1620" y="255" class="sub-text" font-size="24" letter-spacing="2">ADVANCED PRODUCT</text>

  <!-- CREATIVE with 90-degree circuit -->
  <path d="M 1030 360 V 420 H 1120 V 400" class="circuit-line" />
  <text x="1220" y="415" class="sub-text" font-size="36" letter-spacing="3">CREATIVE</text>
  <circle cx="1030" cy="360" r="5" class="circuit-dot" />

  <!-- ================= LOWER SECTION: LIGHT BULB, AUTOMATION, INVENTIONS ================= -->
  <!-- Light Bulb Hero -->
  ${drawLightBulb(950, 680, 1.35)}

  <!-- Circuit Network flowing from Bulb to Equipment & Industry -->
  <text x="740" y="820" class="sub-text" font-size="28" letter-spacing="2">EQUIPMENT</text>
  <text x="1040" y="880" class="sub-text" font-size="28" letter-spacing="2">INDUSTRY</text>
  <text x="1360" y="855" class="tech-label" font-size="20" letter-spacing="2">ADVANCED</text>

  <!-- INVENTION in dashed box -->
  ${drawWordFrame(1160, 595, 220, 45)}
  <text x="1270" y="627" class="sub-text" font-size="24" letter-spacing="2">INVENTION</text>

  <!-- AUTOMATION (Repeated prominent) -->
  <text x="1280" y="685" class="hero-text" font-size="36" letter-spacing="3">AUTOMATION</text>
  <text x="320" y="615" class="hero-text" font-size="40" letter-spacing="3">AUTOMATION</text>
  <circle cx="170" cy="605" r="5" class="circuit-dot" />

  <!-- WEB & SYSTEM -->
  <text x="240" y="750" class="hero-text" font-size="54" letter-spacing="4">WEB</text>
  ${drawWifiWaves(340, 740, 1.1)}
  <text x="470" y="750" class="hero-text" font-size="38" letter-spacing="3">SYSTEM</text>
  <path d="M 150 635 V 710 H 180" class="circuit-line" />
  <circle cx="180" cy="710" r="4" class="circuit-dot" />

  <!-- EFFICIENT with Network Node -->
  <text x="340" y="830" class="sub-text" font-size="30" letter-spacing="2">EFFICIENT</text>
  ${drawNetworkNode(450, 825, 1.1)}

  <!-- Center-Right: GIANT INNOVATION -->
  <text x="1340" y="760" class="hero-text" font-size="64" letter-spacing="5">INNOVATION</text>
  ${drawSignalBars(1470, 665)}

  <!-- Interlocking Gears (Bottom Right) -->
  ${drawInterlockingGears(1640, 735, 1.4)}
  <text x="1680" y="820" class="sub-text" font-size="26" letter-spacing="3">MACHINERY</text>

  <!-- ================= SYSTEMS PROGRAMMING LANGUAGES CLUSTER ================= -->
  <!-- RUST (Memory Safety Hero) -->
  <g transform="translate(180, 960)">
    <circle cx="0" cy="0" r="28" class="circuit-ring" stroke-width="2.5" />
    <circle cx="0" cy="0" r="12" class="circuit-dot" />
    <text x="42" y="10" class="hero-text" font-size="38" text-anchor="start" letter-spacing="3">RUST</text>
    <text x="44" y="30" class="tech-label" font-size="13">CARGO // MEMORY-SAFE CONCURRENCY</text>
  </g>
  <path d="M 180 990 V 1040 H 420" class="circuit-line" />
  <circle cx="420" cy="1040" r="4" class="circuit-dot" />

  <!-- C++ (Modern ISO Core) -->
  <g transform="translate(620, 960)">
    <polygon points="0,-22 20,-11 20,11 0,22 -20,11 -20,-11" class="icon-stroke" stroke-width="2.5" />
    <text x="36" y="10" class="hero-text" font-size="38" text-anchor="start" letter-spacing="2">C++23</text>
    <text x="38" y="30" class="tech-label" font-size="13">LLVM // TEMPLATES // ZERO-COST</text>
  </g>
  <path d="M 620 985 V 1025 H 780 V 985" class="circuit-line" />

  <!-- C (POSIX Kernel Core) -->
  <g transform="translate(980, 960)">
    <circle cx="0" cy="0" r="24" class="circuit-ring" stroke-width="2.5" />
    <text x="0" y="8" class="hero-text" font-size="24">C</text>
    <text x="36" y="10" class="hero-text" font-size="38" text-anchor="start" letter-spacing="2">C17 / POSIX</text>
    <text x="38" y="30" class="tech-label" font-size="13">BARE-METAL // POINTER ARITHMETIC</text>
  </g>

  <!-- GO (GOLANG) CSP -->
  <g transform="translate(1420, 960)">
    <rect x="-24" y="-18" width="48" height="36" rx="8" class="circuit-ring" stroke-width="2.5" />
    <circle cx="-8" cy="0" r="4" class="circuit-dot" />
    <circle cx="8" cy="0" r="4" class="circuit-dot" />
    <text x="36" y="10" class="hero-text" font-size="38" text-anchor="start" letter-spacing="2">GOLANG</text>
    <text x="38" y="30" class="tech-label" font-size="13">GOROUTINES // CSP CHANNELS // NET</text>
  </g>

  <!-- LOWER ROW: ASSEMBLY, ZIG, LINUX, DOCKER, KERNEL -->
  <g transform="translate(180, 1150)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">x86_64 ASSEMBLY</text>
    <text x="0" y="24" class="tech-label" font-size="13">OPCODES // REGISTERS // SYSCALLS</text>
  </g>

  <g transform="translate(620, 1150)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">ZIG 0.13</text>
    <text x="0" y="24" class="tech-label" font-size="13">COMPTIME // NO HIDDEN CONTROL FLOW</text>
  </g>

  <g transform="translate(1000, 1150)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">LINUX KERNEL</text>
    <text x="0" y="24" class="tech-label" font-size="13">EBPF // CGROUPS // NAMESPACES</text>
  </g>

  <g transform="translate(1420, 1150)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">DOCKER // K8S</text>
    <text x="0" y="24" class="tech-label" font-size="13">OCI CONTAINERS // CLUSTERS // PODS</text>
  </g>

  <!-- BOTTOM ROW: JAVA, C#, SWIFT, KOTLIN -->
  <g transform="translate(180, 1310)">
    <text x="0" y="0" class="hero-text" font-size="30" text-anchor="start" letter-spacing="2">JAVA 21 (LTS)</text>
    <text x="0" y="22" class="tech-label" font-size="12">VIRTUAL THREADS // HOTSPOT JVM</text>
  </g>

  <g transform="translate(620, 1310)">
    <text x="0" y="0" class="hero-text" font-size="30" text-anchor="start" letter-spacing="2">C# (.NET 9)</text>
    <text x="0" y="22" class="tech-label" font-size="12">CLR // ASYNC/AWAIT // HIGH-THROUGHPUT</text>
  </g>

  <g transform="translate(1000, 1310)">
    <text x="0" y="0" class="hero-text" font-size="30" text-anchor="start" letter-spacing="2">SWIFT 6</text>
    <text x="0" y="22" class="tech-label" font-size="12">ACTORS // APPLE ECOSYSTEM // LLVM</text>
  </g>

  <g transform="translate(1420, 1310)">
    <text x="0" y="0" class="hero-text" font-size="30" text-anchor="start" letter-spacing="2">KOTLIN</text>
    <text x="0" y="22" class="tech-label" font-size="12">MULTI-PLATFORM // COROUTINES</text>
  </g>

  <!-- Long Connecting Circuit Lines across bottom &amp; margins -->
  <path d="M 120 1200 V 1360 H 1880 V 1220" class="circuit-line" />
  <circle cx="120" cy="1200" r="4" class="circuit-dot" />
  <circle cx="1880" cy="1220" r="4" class="circuit-dot" />

  <!-- Right Vertical Word: SOFTWARE -->
  <g transform="translate(1960, 480)">
    <text x="0" y="0" class="hero-text" font-size="42" letter-spacing="14" transform="rotate(90)">SOFTWARE</text>
    <line x1="20" y1="-30" x2="20" y2="340" class="circuit-line" />
    <circle cx="20" cy="-30" r="4" class="circuit-dot" />
    <circle cx="20" cy="340" r="4" class="circuit-dot" />
  </g>

  <!-- Left Vertical Line with Nodes -->
  <path d="M 70 80 V 1360" class="circuit-line" />
  <circle cx="70" cy="80" r="5" class="circuit-dot" />
  <circle cx="70" cy="460" r="5" class="circuit-dot" />
  <circle cx="70" cy="940" r="5" class="circuit-dot" />
  <circle cx="70" cy="1360" r="5" class="circuit-dot" />
`);

// ======================================================================
// PANEL 2: RIGHT WALL (2048 x 1440) - Web, AI, Data Science & Functional
// ======================================================================
const rightWallSvg = wrapSvg(2048, 1440, `
  <!-- ================= TOP LEFT: GLOBE & INTELLIGENCE ================= -->
  ${drawGlobeWithCircuits(280, 260, 100)}
  
  <text x="280" y="110" class="hero-text" font-size="44" letter-spacing="4">INTELLIGENCE</text>
  ${drawNetworkNode(420, 100, 1.1)}

  <!-- CONNECTION Label with Nodes -->
  <text x="490" y="140" class="tech-label" font-size="20" letter-spacing="2">SYNAPSE</text>
  <circle cx="580" cy="134" r="5" class="circuit-dot" />
  <path d="M 370 134 H 470 M 555 134 H 575" class="circuit-dashed" />

  <!-- WiFi Waves above Deep Learning -->
  ${drawWifiWaves(560, 210, 1.2)}

  <!-- ARCHITECTURE inside Dashed Box -->
  ${drawWordFrame(650, 160, 260, 50)}
  <text x="780" y="195" class="sub-text" font-size="26" letter-spacing="3">ARCHITECTURE</text>

  <!-- ARTIFICIAL DATA Hero Group -->
  <text x="730" y="270" class="hero-text" font-size="52" letter-spacing="3">NEURAL</text>
  <text x="730" y="325" class="hero-text" font-size="48" letter-spacing="3">MODELS</text>
  ${drawNetworkNode(850, 280, 1.2)}

  <path d="M 850 320 H 940 V 230 H 1020" class="circuit-line-thick" />
  <circle cx="1020" cy="230" r="5" class="circuit-dot" />

  <text x="560" y="375" class="sub-text" font-size="30" letter-spacing="2">ALGORITHMS</text>
  <path d="M 450 370 H 490 V 430 H 420" class="circuit-line" />
  <circle cx="420" cy="430" r="4" class="circuit-dot" />

  <!-- ================= CENTER HERO: FULLSTACK & DISTRIBUTED ================= -->
  <text x="320" y="525" class="hero-text" font-size="62" letter-spacing="5">FULLSTACK</text>
  <circle cx="150" cy="510" r="6" class="circuit-dot" />
  <path d="M 156 510 H 190" class="circuit-line" />

  <!-- GIANT CENTER: PROGRAMMING -->
  <text x="1040" y="525" class="hero-text" font-size="94" letter-spacing="8">DEVELOPMENT</text>
  <path d="M 600 540 H 1480" class="circuit-line-thick" />

  <!-- DISTRIBUTED & REACTIVE -->
  <text x="1560" y="475" class="hero-text" font-size="50" letter-spacing="4">DISTRIBUTED</text>
  <text x="1620" y="540" class="hero-text" font-size="54" letter-spacing="4">ECOSYSTEM</text>
  
  <!-- Star Badge (Top Right) -->
  ${drawStarBadge(1390, 260, 1.2)}
  <text x="1230" y="210" class="tech-label" font-size="20">AI / ML</text>
  <text x="1390" y="130" class="tech-label" font-size="18">PROTOCOL</text>
  <text x="1650" y="180" class="hero-text" font-size="38" letter-spacing="3">FOUNDATIONS</text>
  ${drawNetworkNode(1830, 175, 1.2)}

  <!-- REACTIVE DESIGN in Dashed Box -->
  ${drawWordFrame(1480, 220, 280, 50)}
  <text x="1620" y="255" class="sub-text" font-size="24" letter-spacing="2">REACTIVE SYSTEM</text>

  <!-- DECENTRALIZED with 90-degree circuit -->
  <path d="M 1030 360 V 420 H 1120 V 400" class="circuit-line" />
  <text x="1230" y="415" class="sub-text" font-size="34" letter-spacing="3">SERVERLESS</text>
  <circle cx="1030" cy="360" r="5" class="circuit-dot" />

  <!-- ================= LOWER SECTION: LIGHT BULB, GENERATIVE, DISCOVERY ================= -->
  ${drawLightBulb(950, 680, 1.35)}

  <text x="740" y="820" class="sub-text" font-size="28" letter-spacing="2">SYNTHESIS</text>
  <text x="1040" y="880" class="sub-text" font-size="28" letter-spacing="2">PIPELINES</text>
  <text x="1360" y="855" class="tech-label" font-size="20" letter-spacing="2">ANALYTICS</text>

  <!-- EVOLUTION in dashed box -->
  ${drawWordFrame(1160, 595, 220, 45)}
  <text x="1270" y="627" class="sub-text" font-size="24" letter-spacing="2">TRANSFORM</text>

  <!-- ORCHESTRATION -->
  <text x="1280" y="685" class="hero-text" font-size="36" letter-spacing="3">ASYNC FLOW</text>
  <text x="320" y="615" class="hero-text" font-size="40" letter-spacing="3">CONCURRENCY</text>
  <circle cx="170" cy="605" r="5" class="circuit-dot" />

  <!-- API & GRAPHQL -->
  <text x="240" y="750" class="hero-text" font-size="54" letter-spacing="4">API</text>
  ${drawWifiWaves(340, 740, 1.1)}
  <text x="470" y="750" class="hero-text" font-size="38" letter-spacing="3">GRAPHQL</text>
  <path d="M 150 635 V 710 H 180" class="circuit-line" />
  <circle cx="180" cy="710" r="4" class="circuit-dot" />

  <text x="340" y="830" class="sub-text" font-size="30" letter-spacing="2">STREAMING</text>
  ${drawNetworkNode(450, 825, 1.1)}

  <!-- Center-Right: GIANT ARCHITECTURE -->
  <text x="1340" y="760" class="hero-text" font-size="64" letter-spacing="5">INTELLIGENCE</text>
  ${drawSignalBars(1470, 665)}

  <!-- Interlocking Gears (Bottom Right) -->
  ${drawInterlockingGears(1640, 735, 1.4)}
  <text x="1680" y="820" class="sub-text" font-size="26" letter-spacing="3">DATABASES</text>

  <!-- ================= MODERN WEB, DATA & FUNCTIONAL LANGUAGES ================= -->
  <!-- TYPESCRIPT -->
  <g transform="translate(180, 960)">
    <rect x="-22" y="-22" width="44" height="44" rx="6" class="circuit-ring" stroke-width="2.5" />
    <text x="0" y="8" class="hero-text" font-size="22">TS</text>
    <text x="36" y="10" class="hero-text" font-size="38" text-anchor="start" letter-spacing="2">TYPESCRIPT</text>
    <text x="38" y="30" class="tech-label" font-size="13">STATIC TYPE SAFETY // GENERICS // AST</text>
  </g>

  <!-- PYTHON 3.12 (Data & AI) -->
  <g transform="translate(620, 960)">
    <circle cx="0" cy="0" r="22" class="circuit-ring" stroke-width="2.5" />
    <text x="36" y="10" class="hero-text" font-size="38" text-anchor="start" letter-spacing="2">PYTHON 3</text>
    <text x="38" y="30" class="tech-label" font-size="13">NUMPY // PYTORCH // TENSORFLOW // FASTAPI</text>
  </g>

  <!-- JAVASCRIPT & REACT -->
  <g transform="translate(1000, 960)">
    <text x="0" y="10" class="hero-text" font-size="38" text-anchor="start" letter-spacing="2">JAVASCRIPT // REACT</text>
    <text x="0" y="30" class="tech-label" font-size="13">V8 ENGINE // SSR // SERVER COMPONENTS</text>
  </g>

  <!-- SQL & POSTGRESQL -->
  <g transform="translate(1480, 960)">
    <text x="0" y="10" class="hero-text" font-size="38" text-anchor="start" letter-spacing="2">POSTGRESQL / SQL</text>
    <text x="0" y="30" class="tech-label" font-size="13">ACID // JSONB // VECTOR EMBEDDINGS</text>
  </g>

  <!-- LOWER ROW: HASKELL, ELIXIR, SOLIDITY, DART -->
  <g transform="translate(180, 1150)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">HASKELL</text>
    <text x="0" y="24" class="tech-label" font-size="13">MONADS // PURE FUNCTIONAL // GHC</text>
  </g>

  <g transform="translate(620, 1150)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">ELIXIR // ERLANG</text>
    <text x="0" y="24" class="tech-label" font-size="13">BEAM VM // OTP // FAULT TOLERANCE</text>
  </g>

  <g transform="translate(1020, 1150)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">SOLIDITY (EVM)</text>
    <text x="0" y="24" class="tech-label" font-size="13">SMART CONTRACTS // BYTECODE // WEB3</text>
  </g>

  <g transform="translate(1480, 1150)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">DART // FLUTTER</text>
    <text x="0" y="24" class="tech-label" font-size="13">AOT COMPILATION // CROSS-PLATFORM</text>
  </g>

  <!-- BOTTOM ROW: LUA, JULIA, SCALA, RUBY, PHP, R -->
  <g transform="translate(180, 1310)">
    <text x="0" y="0" class="hero-text" font-size="28" text-anchor="start" letter-spacing="2">LUA / LUAJIT</text>
    <text x="0" y="22" class="tech-label" font-size="12">EMBEDDED // FAST JIT RUNTIME</text>
  </g>

  <g transform="translate(560, 1310)">
    <text x="0" y="0" class="hero-text" font-size="28" text-anchor="start" letter-spacing="2">JULIA</text>
    <text x="0" y="22" class="tech-label" font-size="12">MULTIPLE DISPATCH // SCIENTIFIC COMPUTE</text>
  </g>

  <g transform="translate(940, 1310)">
    <text x="0" y="0" class="hero-text" font-size="28" text-anchor="start" letter-spacing="2">SCALA 3</text>
    <text x="0" y="22" class="tech-label" font-size="12">FP + OOP // AKKA // APACHE SPARK</text>
  </g>

  <g transform="translate(1320, 1310)">
    <text x="0" y="0" class="hero-text" font-size="28" text-anchor="start" letter-spacing="2">RUBY // PHP 8</text>
    <text x="0" y="22" class="tech-label" font-size="12">RAILS // JIT // DYNAMIC RUNTIMES</text>
  </g>

  <g transform="translate(1700, 1310)">
    <text x="0" y="0" class="hero-text" font-size="28" text-anchor="start" letter-spacing="2">R // PERL</text>
    <text x="0" y="22" class="tech-label" font-size="12">BIOINFORMATICS // TEXT AUTOMATION</text>
  </g>

  <!-- Connecting Conduits -->
  <path d="M 120 1200 V 1360 H 1880 V 1220" class="circuit-line" />
  <circle cx="120" cy="1200" r="4" class="circuit-dot" />
  <circle cx="1880" cy="1220" r="4" class="circuit-dot" />

  <!-- Right Vertical Word: SECURITY -->
  <g transform="translate(1960, 480)">
    <text x="0" y="0" class="hero-text" font-size="42" letter-spacing="14" transform="rotate(90)">SECURITY</text>
    <line x1="20" y1="-30" x2="20" y2="340" class="circuit-line" />
    <circle cx="20" cy="-30" r="4" class="circuit-dot" />
    <circle cx="20" cy="340" r="4" class="circuit-dot" />
  </g>

  <!-- Left Vertical Line with Nodes -->
  <path d="M 70 80 V 1360" class="circuit-line" />
  <circle cx="70" cy="80" r="5" class="circuit-dot" />
  <circle cx="70" cy="460" r="5" class="circuit-dot" />
  <circle cx="70" cy="940" r="5" class="circuit-dot" />
  <circle cx="70" cy="1360" r="5" class="circuit-dot" />
`);

// ======================================================================
// PANEL 3: FRONT-LEFT WALL (1024 x 1440) - Security & Low-Level Portal
// ======================================================================
const frontLeftSvg = wrapSvg(1024, 1440, `
  <!-- Top Circuit & Globe Motif -->
  ${drawGlobeWithCircuits(280, 220, 80)}
  <text x="280" y="90" class="hero-text" font-size="36" letter-spacing="3">SECURITY</text>
  ${drawNetworkNode(400, 85, 1.0)}

  <!-- Dashed Box -->
  ${drawWordFrame(120, 360, 320, 50)}
  <text x="280" y="395" class="sub-text" font-size="24" letter-spacing="3">ZERO TRUST</text>

  <!-- Center Hero -->
  <text x="512" y="520" class="hero-text" font-size="64" letter-spacing="6">CRYPTOGRAPHY</text>
  <path d="M 120 545 H 904" class="circuit-line-thick" />

  <!-- Light Bulb Innovation -->
  ${drawLightBulb(512, 700, 1.2)}
  <text x="310" y="820" class="sub-text" font-size="26" letter-spacing="2">AUTHENTICATION</text>
  <text x="710" y="820" class="sub-text" font-size="26" letter-spacing="2">ISOLATION</text>

  <!-- Lower Tech Languages & Protocols -->
  <g transform="translate(140, 960)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">WASM // BYTECODE</text>
    <text x="0" y="24" class="tech-label" font-size="14">SANDBOXED NEAR-NATIVE RUNTIME</text>
  </g>

  <g transform="translate(140, 1100)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">ARM64 // NEON</text>
    <text x="0" y="24" class="tech-label" font-size="14">RISC ARCHITECTURE // HARDWARE SECURITY</text>
  </g>

  <g transform="translate(140, 1240)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">SECURE ENCLAVE</text>
    <text x="0" y="24" class="tech-label" font-size="14">HARDWARE ROOT OF TRUST // TPM 2.0</text>
  </g>

  <!-- Interlocking Gears in lower right -->
  ${drawInterlockingGears(780, 1200, 1.3)}

  <!-- Border conduits -->
  <path d="M 60 60 V 1380 H 964 V 60" class="circuit-line" />
  <circle cx="60" cy="60" r="5" class="circuit-dot" />
  <circle cx="964" cy="60" r="5" class="circuit-dot" />
`);

// ======================================================================
// PANEL 4: FRONT-RIGHT WALL (1024 x 1440) - Distributed Systems & NFC
// ======================================================================
const frontRightSvg = wrapSvg(1024, 1440, `
  <!-- Top Circuit Star & WiFi -->
  ${drawStarBadge(512, 180, 1.2)}
  <text x="512" y="80" class="hero-text" font-size="36" letter-spacing="3">DISTRIBUTED</text>
  ${drawWifiWaves(720, 180, 1.2)}

  <!-- Dashed Box -->
  ${drawWordFrame(320, 290, 384, 50)}
  <text x="512" y="325" class="sub-text" font-size="24" letter-spacing="3">NFC 13.56 MHz // ISO 14443</text>

  <!-- Center Hero -->
  <text x="512" y="520" class="hero-text" font-size="64" letter-spacing="6">TELEMETRY</text>
  <path d="M 120 545 H 904" class="circuit-line-thick" />

  <!-- Light Bulb Innovation -->
  ${drawLightBulb(512, 700, 1.2)}
  <text x="310" y="820" class="sub-text" font-size="26" letter-spacing="2">MICROSERVICES</text>
  <text x="710" y="820" class="sub-text" font-size="26" letter-spacing="2">HIGH-AVAILABILITY</text>

  <!-- Lower Tech Languages & Protocols -->
  <g transform="translate(140, 960)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">PROTOBUF // GRPC</text>
    <text x="0" y="24" class="tech-label" font-size="14">BINARY WIRE PROTOCOL // HTTP/2</text>
  </g>

  <g transform="translate(140, 1100)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">KAFKA // NATS</text>
    <text x="0" y="24" class="tech-label" font-size="14">EVENT-DRIVEN STREAMING PIPELINES</text>
  </g>

  <g transform="translate(140, 1240)">
    <text x="0" y="0" class="hero-text" font-size="34" text-anchor="start" letter-spacing="2">REDIS // MEMCACHED</text>
    <text x="0" y="24" class="tech-label" font-size="14">IN-MEMORY DATA STRUCTURES // SUB-MS</text>
  </g>

  <!-- Interlocking Gears in lower right -->
  ${drawInterlockingGears(780, 1200, 1.3)}

  <!-- Border conduits -->
  <path d="M 60 60 V 1380 H 964 V 60" class="circuit-line" />
  <circle cx="60" cy="60" r="5" class="circuit-dot" />
  <circle cx="964" cy="60" r="5" class="circuit-dot" />
`);

// ======================================================================
// Render SVGs to transparent PNGs via sharp
// ======================================================================
async function generate() {
  try {
    console.log('Rendering Left Wall Mural (2048x1440)...');
    await sharp(Buffer.from(leftWallSvg))
      .png()
      .toFile(path.join(publicDir, 'mural-left-wall.png'));

    console.log('Rendering Right Wall Mural (2048x1440)...');
    await sharp(Buffer.from(rightWallSvg))
      .png()
      .toFile(path.join(publicDir, 'mural-right-wall.png'));

    console.log('Rendering Front-Left Wall Mural (1024x1440)...');
    await sharp(Buffer.from(frontLeftSvg))
      .png()
      .toFile(path.join(publicDir, 'mural-front-left.png'));

    console.log('Rendering Front-Right Wall Mural (1024x1440)...');
    await sharp(Buffer.from(frontRightSvg))
      .png()
      .toFile(path.join(publicDir, 'mural-front-right.png'));

    console.log('SUCCESS: All 4 full-wall murals generated with transparent backgrounds!');
  } catch (err) {
    console.error('Error generating murals:', err);
    process.exit(1);
  }
}

generate();
