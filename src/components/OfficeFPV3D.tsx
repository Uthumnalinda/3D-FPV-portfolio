"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

interface Waypoint {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  duration: number;
  onStart?: () => void;
  pauseAfter?: number;
}

type LocationState =
  | "LOBBY"
  | "CORRIDOR_1"
  | "INSIDE_1"
  | "CORRIDOR_2"
  | "INSIDE_2"
  | "CORRIDOR_3"
  | "INSIDE_3"
  | "CORRIDOR_4"
  | "INSIDE_4";

const projects = [
  {
    code: "SYS_01",
    title: "CyberShield",
    subtitle: "Real-Time Intrusion Detection & Telemetry",
    badge: "Production Blueprint",
    description:
      "A network monitoring architecture capturing live packet telemetry. Employs anomaly scoring models to isolate unauthorized port scans, DDoS precursors, and suspicious payload vectors.",
    specs: ["10k+ Packets/sec throughput", "Sub-50ms WebSocket telemetry", "Automated quarantine trigger"],
    tools: "Python • FastAPI • React • WebSockets • PostgreSQL",
  },
  {
    code: "SYS_02",
    title: "CodeForge",
    subtitle: "High-Concurrency Collaborative IDE",
    badge: "Live System",
    description:
      "Real-time collaborative code editor built with operational transformation algorithms, AST syntax parsing, and sandboxed in-browser code execution for engineering teams.",
    specs: ["Zero-conflict concurrent editing", "Monaco Editor AST parsing", "Sandboxed Web Worker execution"],
    tools: "Next.js 15 • TypeScript • Socket.io • Monaco • Tailwind",
  },
  {
    code: "SYS_03",
    title: "VaultGuard",
    subtitle: "Zero-Knowledge Secrets Manager",
    badge: "Security Tool",
    description:
      "End-to-end encrypted secrets and key manager engineered on zero-knowledge architecture. Payloads are encrypted and decrypted strictly on the client device using AES-GCM-256.",
    specs: ["Client-side AES-256-GCM cipher", "Argon2id cryptographic salt derivation", "Biometric hardware unlock"],
    tools: "TypeScript • Web Crypto API • Node.js • SQLite • Argon2id",
  },
];

const skills = [
  {
    domain: "01 // Frontend Engineering",
    description: "Type-safe client architecture, performance, accessibility.",
    tools: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "Framer Motion"],
  },
  {
    domain: "02 // Backend & Systems",
    description: "Scalable APIs, database schemas, and data pipelines.",
    tools: ["Node.js", "Express", "Python (FastAPI)", "PostgreSQL", "REST & GraphQL"],
  },
  {
    domain: "03 // Security & Pen-Testing",
    description: "Vulnerability analysis, offensive audits, and defensive hardening.",
    tools: ["Burp Suite", "OWASP Top 10", "Network Audits", "Kali Linux", "Wireshark"],
  },
  {
    domain: "04 // DevOps & Infrastructure",
    description: "Containerization, automated CI/CD, and deployment.",
    tools: ["Docker", "Git / GitHub", "Linux Admin", "CI / CD Pipelines", "Edge Compute"],
  },
];

const socials = [
  { name: "GitHub", href: "https://github.com", handle: "github.com/uthumnalinda" },
  { name: "LinkedIn", href: "https://linkedin.com", handle: "linkedin.com/in/uthumnalinda" },
  { name: "X (Twitter)", href: "https://x.com", handle: "@uthumnalinda" },
  { name: "Instagram", href: "https://instagram.com", handle: "@uthumnalinda" },
  { name: "WhatsApp", href: "https://wa.me", handle: "+94 (Direct)" },
  { name: "Email", href: "mailto:uthumnalinda@gmail.com", handle: "uthumnalinda@gmail.com" },
];

type ModalType = null | "about" | "project_0" | "project_1" | "project_2" | "stack" | "contact";

export default function OfficeFPV3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useState<LocationState>("LOBBY");
  const [isWalking, setIsWalking] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [sentSuccess, setSentSuccess] = useState(false);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Live camera vectors
  const currentCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.6, 2.5));
  const currentCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.6, 0));

  // Waypoint animation queue
  const waypointQueue = useRef<Waypoint[]>([]);
  const currentWaypoint = useRef<{
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startLook: THREE.Vector3;
    endLook: THREE.Vector3;
    startTime: number;
    duration: number;
    pauseUntil: number;
  } | null>(null);

  // Clickable interactive meshes
  const clickablesRef = useRef<{ mesh: THREE.Object3D; action: () => void }[]>([]);

  // Door pivot groups & rotation states
  const doorsRef = useRef<{ [key: string]: { group: THREE.Group; baseY: number } }>({});
  const doorAngles = useRef<{ [key: string]: { current: number; target: number } }>({
    entrance: { current: 0, target: 0 },
    door1: { current: 0, target: 0 },
    door2: { current: 0, target: 0 },
    door3: { current: 0, target: 0 },
    door4: { current: 0, target: 0 },
  });

  // Open/Close door helper
  const setDoorOpen = useCallback((doorKey: string, open: boolean, angle = -Math.PI / 2.15) => {
    if (doorAngles.current[doorKey]) {
      doorAngles.current[doorKey].target = open ? angle : 0;
    }
  }, []);

  // Dispatch Waypoint Sequence
  const runSequence = useCallback((queue: Waypoint[], nextLoc: LocationState) => {
    setActiveModal(null);
    setIsWalking(true);
    waypointQueue.current = queue;
    setLocation(nextLoc);
  }, []);

  // --- ACTIONS ---

  // 1. Enter Lab from Lobby
  const enterLabFromLobby = useCallback(() => {
    if (isWalking) return;
    const queue: Waypoint[] = [
      // Swing Entrance door open
      {
        pos: new THREE.Vector3(0, 1.6, 2.5),
        look: new THREE.Vector3(0, 1.6, 0),
        duration: 200,
        onStart: () => setDoorOpen("entrance", true, -Math.PI / 2.15),
        pauseAfter: 750, // Let door open fully
      },
      // Walk through open entrance door into corridor to Door 01
      {
        pos: new THREE.Vector3(0, 1.6, -2.5),
        look: new THREE.Vector3(0, 1.6, -6.0),
        duration: 2000,
      },
      // Turn left to face closed Door 01
      {
        pos: new THREE.Vector3(0, 1.6, -2.5),
        look: new THREE.Vector3(-2.4, 1.6, -2.5),
        duration: 800,
      },
    ];
    runSequence(queue, "CORRIDOR_1");
  }, [isWalking, runSequence, setDoorOpen]);

  // 2. Open Door 01 & Enter Room 01 (About Me)
  const enterRoom1 = useCallback(() => {
    if (isWalking) return;
    const queue: Waypoint[] = [
      // Swing Door 01 open into Room 1
      {
        pos: new THREE.Vector3(0, 1.6, -2.5),
        look: new THREE.Vector3(-2.4, 1.6, -2.5),
        duration: 200,
        onStart: () => setDoorOpen("door1", true, Math.PI / 2.15),
        pauseAfter: 700,
      },
      // Walk inside Room 1 facing the exhibition wall
      {
        pos: new THREE.Vector3(-1.9, 1.6, -2.5),
        look: new THREE.Vector3(-4.72, 1.6, -2.5),
        duration: 1200,
      },
    ];
    runSequence(queue, "INSIDE_1");
  }, [isWalking, runSequence, setDoorOpen]);

  // 3. Exit Room 01 & Walk to Door 02 (Selected Systems)
  const exitRoom1ToCorridor2 = useCallback(() => {
    if (isWalking) return;
    const queue: Waypoint[] = [
      // Step back out to corridor center
      {
        pos: new THREE.Vector3(0, 1.6, -2.5),
        look: new THREE.Vector3(-4.72, 1.6, -2.5),
        duration: 900,
        onStart: () => setDoorOpen("door1", false), // Close door 1 behind you
      },
      // Turn to face down corridor
      {
        pos: new THREE.Vector3(0, 1.6, -2.5),
        look: new THREE.Vector3(0, 1.6, -6.5),
        duration: 700,
      },
      // Walk down corridor to Door 02
      {
        pos: new THREE.Vector3(0, 1.6, -6.5),
        look: new THREE.Vector3(0, 1.6, -10.0),
        duration: 1700,
      },
      // Turn right to face closed Door 02
      {
        pos: new THREE.Vector3(0, 1.6, -6.5),
        look: new THREE.Vector3(2.4, 1.6, -6.5),
        duration: 800,
      },
    ];
    runSequence(queue, "CORRIDOR_2");
  }, [isWalking, runSequence, setDoorOpen]);

  // 4. Open Door 02 & Enter Room 02 (Selected Systems)
  const enterRoom2 = useCallback(() => {
    if (isWalking) return;
    const queue: Waypoint[] = [
      // Swing Door 02 open into Room 2
      {
        pos: new THREE.Vector3(0, 1.6, -6.5),
        look: new THREE.Vector3(2.4, 1.6, -6.5),
        duration: 200,
        onStart: () => setDoorOpen("door2", true, Math.PI / 2.15),
        pauseAfter: 700,
      },
      // Walk inside Room 2 facing the 3 project boards
      {
        pos: new THREE.Vector3(1.9, 1.6, -6.5),
        look: new THREE.Vector3(5.12, 1.6, -6.5),
        duration: 1200,
      },
    ];
    runSequence(queue, "INSIDE_2");
  }, [isWalking, runSequence, setDoorOpen]);

  // 5. Exit Room 02 & Walk to Door 03 (Arsenal)
  const exitRoom2ToCorridor3 = useCallback(() => {
    if (isWalking) return;
    const queue: Waypoint[] = [
      // Step back out to corridor center
      {
        pos: new THREE.Vector3(0, 1.6, -6.5),
        look: new THREE.Vector3(5.12, 1.6, -6.5),
        duration: 900,
        onStart: () => setDoorOpen("door2", false), // Close door 2
      },
      // Turn to face down corridor
      {
        pos: new THREE.Vector3(0, 1.6, -6.5),
        look: new THREE.Vector3(0, 1.6, -10.5),
        duration: 700,
      },
      // Walk down corridor to Door 03
      {
        pos: new THREE.Vector3(0, 1.6, -10.5),
        look: new THREE.Vector3(0, 1.6, -14.0),
        duration: 1700,
      },
      // Turn left to face closed Door 03
      {
        pos: new THREE.Vector3(0, 1.6, -10.5),
        look: new THREE.Vector3(-2.4, 1.6, -10.5),
        duration: 800,
      },
    ];
    runSequence(queue, "CORRIDOR_3");
  }, [isWalking, runSequence, setDoorOpen]);

  // 6. Open Door 03 & Enter Room 03 (Technical Arsenal)
  const enterRoom3 = useCallback(() => {
    if (isWalking) return;
    const queue: Waypoint[] = [
      {
        pos: new THREE.Vector3(0, 1.6, -10.5),
        look: new THREE.Vector3(-2.4, 1.6, -10.5),
        duration: 200,
        onStart: () => setDoorOpen("door3", true, Math.PI / 2.15),
        pauseAfter: 700,
      },
      {
        pos: new THREE.Vector3(-1.9, 1.6, -10.5),
        look: new THREE.Vector3(-4.72, 1.6, -10.5),
        duration: 1200,
      },
    ];
    runSequence(queue, "INSIDE_3");
  }, [isWalking, runSequence, setDoorOpen]);

  // 7. Exit Room 03 & Walk to Door 04 (Contact Desk)
  const exitRoom3ToCorridor4 = useCallback(() => {
    if (isWalking) return;
    const queue: Waypoint[] = [
      {
        pos: new THREE.Vector3(0, 1.6, -10.5),
        look: new THREE.Vector3(-4.72, 1.6, -10.5),
        duration: 900,
        onStart: () => setDoorOpen("door3", false),
      },
      {
        pos: new THREE.Vector3(0, 1.6, -10.5),
        look: new THREE.Vector3(0, 1.6, -16.0),
        duration: 700,
      },
      {
        pos: new THREE.Vector3(0, 1.6, -16.0),
        look: new THREE.Vector3(0, 1.6, -17.5),
        duration: 1800,
      },
    ];
    runSequence(queue, "CORRIDOR_4");
  }, [isWalking, runSequence, setDoorOpen]);

  // 8. Open Door 04 & Enter Room 04 (Contact Drafting Desk)
  const enterRoom4 = useCallback(() => {
    if (isWalking) return;
    const queue: Waypoint[] = [
      {
        pos: new THREE.Vector3(0, 1.6, -16.0),
        look: new THREE.Vector3(0, 1.6, -17.5),
        duration: 200,
        onStart: () => setDoorOpen("door4", true, -Math.PI / 2.15),
        pauseAfter: 700,
      },
      {
        pos: new THREE.Vector3(0, 1.6, -19.0),
        look: new THREE.Vector3(0, 1.6, -22.4),
        duration: 1200,
      },
    ];
    runSequence(queue, "INSIDE_4");
  }, [isWalking, runSequence, setDoorOpen]);

  // 9. Return to Lobby from anywhere
  const returnToLobby = useCallback(() => {
    if (isWalking) return;
    const queue: Waypoint[] = [
      // Step to corridor center
      {
        pos: new THREE.Vector3(0, 1.6, currentCamPos.current.z),
        look: new THREE.Vector3(0, 1.6, 2.0),
        duration: 800,
        onStart: () => {
          setDoorOpen("door1", false);
          setDoorOpen("door2", false);
          setDoorOpen("door3", false);
          setDoorOpen("door4", false);
        },
      },
      // Walk back through corridor to lobby
      {
        pos: new THREE.Vector3(0, 1.6, 2.5),
        look: new THREE.Vector3(0, 1.6, 0),
        duration: 2400,
        onStart: () => setDoorOpen("entrance", false),
      },
    ];
    runSequence(queue, "LOBBY");
  }, [isWalking, runSequence, setDoorOpen]);

  // Quick navigation from top header
  const handleHeaderNav = useCallback((dest: "LOBBY" | "ROOM_1" | "ROOM_2" | "ROOM_3" | "ROOM_4") => {
    if (dest === "LOBBY") returnToLobby();
    else if (dest === "ROOM_1") {
      if (location === "INSIDE_1") return;
      if (location === "CORRIDOR_1") enterRoom1();
      else {
        // Walk to Room 1
        const queue: Waypoint[] = [
          { pos: new THREE.Vector3(0, 1.6, -2.5), look: new THREE.Vector3(-2.4, 1.6, -2.5), duration: 1500 },
        ];
        runSequence(queue, "CORRIDOR_1");
      }
    } else if (dest === "ROOM_2") {
      if (location === "INSIDE_2") return;
      if (location === "CORRIDOR_2") enterRoom2();
      else {
        const queue: Waypoint[] = [
          { pos: new THREE.Vector3(0, 1.6, -6.5), look: new THREE.Vector3(2.4, 1.6, -6.5), duration: 1500 },
        ];
        runSequence(queue, "CORRIDOR_2");
      }
    } else if (dest === "ROOM_3") {
      if (location === "INSIDE_3") return;
      if (location === "CORRIDOR_3") enterRoom3();
      else {
        const queue: Waypoint[] = [
          { pos: new THREE.Vector3(0, 1.6, -10.5), look: new THREE.Vector3(-2.4, 1.6, -10.5), duration: 1500 },
        ];
        runSequence(queue, "CORRIDOR_3");
      }
    } else if (dest === "ROOM_4") {
      if (location === "INSIDE_4") return;
      if (location === "CORRIDOR_4") enterRoom4();
      else {
        const queue: Waypoint[] = [
          { pos: new THREE.Vector3(0, 1.6, -16.0), look: new THREE.Vector3(0, 1.6, -17.5), duration: 1500 },
        ];
        runSequence(queue, "CORRIDOR_4");
      }
    }
  }, [location, returnToLobby, enterRoom1, enterRoom2, enterRoom3, enterRoom4, runSequence]);

  // ==========================================
  // THREE.JS SCENE CREATION
  // ==========================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    clickablesRef.current = [];

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#fbf9f4");
    scene.fog = new THREE.FogExp2("#fbf9f4", 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 50);
    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentCamLook.current);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff9ef, 0.5);
    dirLight.position.set(2, 6, 2);
    scene.add(dirLight);

    // Overhead corridor strip lights
    for (let z = 2; z >= -19; z -= 3.5) {
      const pointLight = new THREE.PointLight(0xffedd5, 0.45, 6);
      pointLight.position.set(0, 2.9, z);
      scene.add(pointLight);
    }

    // Helper: Anti-Z-Fighting Sketched Wireframe Edges
    const addSketchEdges = (mesh: THREE.Mesh, color = 0x1a1c1e, threshold = 25) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry, threshold);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color,
          linewidth: 1.5,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        })
      );
      mesh.add(line);
    };

    // Helper: Realistic Polished Travertine / Limestone Floor Texture
    const createTravertineFloorTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;

      // Base warm travertine cream/beige tone
      ctx.fillStyle = "#ebe5d8";
      ctx.fillRect(0, 0, 1024, 1024);

      // Subtle natural limestone veining and mottling
      for (let i = 0; i < 350; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const rad = 25 + Math.random() * 80;
        const grad = ctx.createRadialGradient(x, y, 4, x, y, rad);
        const shade =
          Math.random() > 0.5
            ? "rgba(250, 246, 238, 0.28)"
            : "rgba(218, 208, 192, 0.22)";
        grad.addColorStop(0, shade);
        grad.addColorStop(1, "rgba(235, 229, 216, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Large corporate polished floor tile grout lines (256px step = ~1m x 1m tiles)
      ctx.strokeStyle = "rgba(145, 135, 120, 0.38)";
      ctx.lineWidth = 3;
      const step = 256;
      for (let x = 0; x <= 1024; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }
      for (let y = 0; y <= 1024; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 14);
      return tex;
    };

    // Helper: Horizontal Frosted Privacy / Manifestation Stripes on Glass
    const createFrostedGlassTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 1024; // Y represents height of glass panel
      const ctx = canvas.getContext("2d")!;

      // Clear glass background (crystal clear with faint soft tint)
      ctx.fillStyle = "rgba(240, 248, 252, 0.04)";
      ctx.fillRect(0, 0, 512, 1024);

      // Frosted translucent white stripes in middle section (eye & waist levels)
      ctx.fillStyle = "rgba(255, 255, 255, 0.88)";

      // Realistic horizontal manifestation bands matching executive corporate office
      const stripeConfigs = [
        { y: 340, h: 8 },
        { y: 360, h: 12 },
        { y: 385, h: 18 },
        { y: 415, h: 26 },
        { y: 455, h: 36 },
        { y: 505, h: 48 },
        { y: 565, h: 48 },
        { y: 625, h: 36 },
        { y: 670, h: 26 },
        { y: 705, h: 18 },
        { y: 730, h: 12 },
        { y: 750, h: 8 },
      ];

      stripeConfigs.forEach((s) => {
        ctx.fillRect(0, s.y, 512, s.h);
      });

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    const frostedTexture = createFrostedGlassTexture();

    // Materials
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xfcfbfa,
      roughness: 0.9,
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: createTravertineFloorTexture(),
      roughness: 0.26, // Polished travertine sheen
      metalness: 0.08,
    });
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf9f6,
      roughness: 0.9,
    });
    // Full-height Transparent Glass with Frosted Horizontal Manifestation
    const glassMaterial = new THREE.MeshStandardMaterial({
      map: frostedTexture,
      transparent: true,
      opacity: 0.78,
      roughness: 0.06,
      metalness: 0.12,
      depthWrite: false, // Ensures interior furniture and wall posters render cleanly behind glass
    });
    // Brushed Satin Aluminum clamping tracks (clean architectural metal, NOT black bars)
    const aluminumTrackMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8d0d8,
      metalness: 0.85,
      roughness: 0.22,
    });
    // Dark structural accent columns (bronze / marble cladding)
    const columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x322d28,
      roughness: 0.35,
      metalness: 0.2,
    });
    // Polished Chrome / Stainless Steel for handles, pivot fittings & legs
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8ecf0,
      metalness: 0.95,
      roughness: 0.1,
    });
    // Office furniture materials
    const tableWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e2924,
      roughness: 0.4,
    });
    const chairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2022,
      roughness: 0.7,
    });
    const plantPotMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.3,
    });
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x285935,
      roughness: 0.6,
    });

    const corridorHeight = 3.2;

    // Helper: Solid Wall Segment (Back exhibition walls & boundary dividers)
    const buildWall = (x: number, y: number, z: number, w: number, h: number, d: number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, wallMaterial);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    };

    // Helper: Modern Frameless Glass Partition with Slim Satin Aluminum Channels
    const buildGlassWall = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number
    ) => {
      const isZAxis = d > w;
      const length = isZAxis ? d : w;
      const channelThick = 0.03;
      const glassH = h - channelThick * 2;

      // Slim bottom clamping channel
      const floorChan = new THREE.Mesh(
        new THREE.BoxGeometry(isZAxis ? 0.04 : length, channelThick, isZAxis ? length : 0.04),
        aluminumTrackMaterial
      );
      floorChan.position.set(x, channelThick / 2, z);
      scene.add(floorChan);

      // Slim top clamping channel
      const ceilChan = new THREE.Mesh(
        new THREE.BoxGeometry(isZAxis ? 0.04 : length, channelThick, isZAxis ? length : 0.04),
        aluminumTrackMaterial
      );
      ceilChan.position.set(x, h - channelThick / 2, z);
      scene.add(ceilChan);

      // Tempered Glass Pane with frosted manifestation stripes
      const glassGeo = new THREE.BoxGeometry(
        isZAxis ? 0.015 : length,
        glassH,
        isZAxis ? length : 0.015
      );
      const glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
      glassMesh.position.set(x, channelThick + glassH / 2, z);
      glassMesh.renderOrder = 10;
      scene.add(glassMesh);

      return glassMesh;
    };

    // Helper: Dark Marble / Bronze Structural Column (Clean architectural finish, no wireframe lines)
    const buildStructuralColumn = (x: number, z: number, w = 0.32, d = 0.32) => {
      const col = new THREE.Mesh(
        new THREE.BoxGeometry(w, corridorHeight, d),
        columnMaterial
      );
      col.position.set(x, corridorHeight / 2, z);
      scene.add(col);
      return col;
    };

    // Helper: Recessed Round LED Ceiling Pot Light
    const createCeilingPotLight = (x: number, z: number) => {
      // Metallic outer trim ring
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.015, 24),
        aluminumTrackMaterial
      );
      ring.position.set(x, corridorHeight - 0.008, z);
      scene.add(ring);

      // Glowing LED disc
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.018, 24),
        new THREE.MeshBasicMaterial({ color: 0xfffaed })
      );
      disc.position.set(x, corridorHeight - 0.01, z);
      scene.add(disc);

      // Soft downward point light
      const light = new THREE.PointLight(0xfff6e5, 0.45, 6.0, 1.8);
      light.position.set(x, corridorHeight - 0.1, z);
      scene.add(light);
    };

    // Helper: Frameless Glass Door Transom (No heavy black frames!)
    const buildGlassDoorFrame = (
      centerX: number,
      centerZ: number,
      orientation: "x" | "z",
      doorWidth = 1.2,
      doorHeight = 2.3
    ) => {
      const lintelH = corridorHeight - doorHeight;

      if (orientation === "z") {
        // Overhead glass transom panel above door
        const transom = new THREE.Mesh(
          new THREE.BoxGeometry(doorWidth, lintelH - 0.04, 0.015),
          glassMaterial
        );
        transom.position.set(centerX, doorHeight + lintelH / 2, centerZ);
        transom.renderOrder = 10;
        scene.add(transom);

        // Slim satin aluminum transom channel above door
        const fTop = new THREE.Mesh(
          new THREE.BoxGeometry(doorWidth, 0.025, 0.03),
          aluminumTrackMaterial
        );
        fTop.position.set(centerX, doorHeight, centerZ);
        scene.add(fTop);

        // Slim ceiling channel
        const fCeil = new THREE.Mesh(
          new THREE.BoxGeometry(doorWidth, 0.025, 0.03),
          aluminumTrackMaterial
        );
        fCeil.position.set(centerX, corridorHeight - 0.012, centerZ);
        scene.add(fCeil);
      } else {
        // Overhead glass transom panel
        const transom = new THREE.Mesh(
          new THREE.BoxGeometry(0.015, lintelH - 0.04, doorWidth),
          glassMaterial
        );
        transom.position.set(centerX, doorHeight + lintelH / 2, centerZ);
        transom.renderOrder = 10;
        scene.add(transom);

        // Slim satin aluminum transom channel
        const fTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.025, doorWidth),
          aluminumTrackMaterial
        );
        fTop.position.set(centerX, doorHeight, centerZ);
        scene.add(fTop);

        // Slim ceiling channel
        const fCeil = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.025, doorWidth),
          aluminumTrackMaterial
        );
        fCeil.position.set(centerX, corridorHeight - 0.012, centerZ);
        scene.add(fCeil);
      }
    };

    // Helper: 3D Office Potted Plant (Ficus / Palm in Modern Planter)
    const createPottedPlant = (x: number, z: number) => {
      const plantGroup = new THREE.Group();
      plantGroup.position.set(x, 0, z);

      // White minimalist cylindrical pot
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.18, 0.6, 24),
        plantPotMaterial
      );
      pot.position.y = 0.3;
      plantGroup.add(pot);

      // Soil
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: 0x33261d, roughness: 0.9 })
      );
      soil.position.y = 0.59;
      plantGroup.add(soil);

      // Lush green foliage tiers
      for (let i = 0; i < 4; i++) {
        const leafTier = new THREE.Mesh(
          new THREE.ConeGeometry(0.36 - i * 0.05, 0.45, 8),
          leafMaterial
        );
        leafTier.position.y = 0.8 + i * 0.28;
        leafTier.rotation.y = i * 0.7;
        plantGroup.add(leafTier);
      }

      scene.add(plantGroup);
    };

    // Helper: Modern Executive Conference Chair
    const createOfficeChair = (x: number, z: number, rotationY = 0) => {
      const chair = new THREE.Group();
      chair.position.set(x, 0, z);
      chair.rotation.y = rotationY;

      // Chrome five-star base stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.45, 12),
        chromeMaterial
      );
      stem.position.y = 0.225;
      chair.add(stem);

      // Chrome base legs
      for (let a = 0; a < 5; a++) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.02, 0.03),
          chromeMaterial
        );
        leg.position.set(0.13, 0.04, 0);
        leg.rotation.y = (a * Math.PI * 2) / 5;
        chair.add(leg);
      }

      // Seat cushion
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.06, 0.46),
        chairMaterial
      );
      seat.position.y = 0.48;
      chair.add(seat);

      // Backrest
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.52, 0.05),
        chairMaterial
      );
      back.position.set(0, 0.76, -0.21);
      chair.add(back);

      scene.add(chair);
    };

    // Helper: Executive Conference Room (Room 2)
    const buildConferenceRoom = (centerX: number, centerZ: number) => {
      // Large conference table
      const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.06, 2.6),
        tableWoodMaterial
      );
      tableTop.position.set(centerX, 0.74, centerZ);
      scene.add(tableTop);

      // Chrome cylindrical table legs
      const legOffsets = [
        [-0.55, -1.05],
        [0.55, -1.05],
        [-0.55, 1.05],
        [0.55, 1.05],
      ];
      legOffsets.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 0.71, 16),
          chromeMaterial
        );
        leg.position.set(centerX + lx, 0.355, centerZ + lz);
        scene.add(leg);
      });

      // 6 Conference Chairs around table
      createOfficeChair(centerX - 0.75, centerZ - 0.8, Math.PI / 2);
      createOfficeChair(centerX - 0.75, centerZ, Math.PI / 2);
      createOfficeChair(centerX - 0.75, centerZ + 0.8, Math.PI / 2);
      createOfficeChair(centerX + 0.75, centerZ - 0.8, -Math.PI / 2);
      createOfficeChair(centerX + 0.75, centerZ, -Math.PI / 2);
      createOfficeChair(centerX + 0.75, centerZ + 0.8, -Math.PI / 2);

      // Potted plant in corner
      createPottedPlant(centerX + 1.4, centerZ + 1.8);
    };

    // Helper: Executive Work Desk with Laptop & Chair
    const buildExecutiveDesk = (centerX: number, centerZ: number, rotY = 0) => {
      const deskGroup = new THREE.Group();
      deskGroup.position.set(centerX, 0, centerZ);
      deskGroup.rotation.y = rotY;

      // Desk top
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.05, 0.8),
        tableWoodMaterial
      );
      top.position.y = 0.74;
      deskGroup.add(top);

      // Legs
      const dLegs = [
        [-0.7, -0.32],
        [0.7, -0.32],
        [-0.7, 0.32],
        [0.7, 0.32],
      ];
      dLegs.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.715, 12),
          chromeMaterial
        );
        leg.position.set(lx, 0.36, lz);
        deskGroup.add(leg);
      });

      // Modern laptop on desk
      const laptopBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.015, 0.22),
        chromeMaterial
      );
      laptopBase.position.set(0, 0.77, 0);
      deskGroup.add(laptopBase);

      const laptopScreen = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.2, 0.012),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      laptopScreen.position.set(0, 0.87, -0.1);
      laptopScreen.rotation.x = -0.2;
      deskGroup.add(laptopScreen);

      scene.add(deskGroup);

      // Ergonomic desk chair
      createOfficeChair(centerX, centerZ - 0.7, 0);

      // Potted plant
      createPottedPlant(centerX - 1.2, centerZ + 0.8);
    };

    // ==========================================
    // 5. ARCHITECTURAL BUILDING (REALISTIC GLASS CORPORATE SUITE)
    // ==========================================

    // Seamless continuous travertine tile floor
    const fullFloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 32), floorMaterial);
    fullFloor.rotation.x = -Math.PI / 2;
    fullFloor.position.set(0, 0, -8);
    scene.add(fullFloor);

    // Continuous bright white ceiling
    const fullCeil = new THREE.Mesh(new THREE.PlaneGeometry(16, 32), ceilingMaterial);
    fullCeil.rotation.x = Math.PI / 2;
    fullCeil.position.set(0, corridorHeight, -8);
    scene.add(fullCeil);

    // Ceiling Recessed Round LED Pot Lights (Downlights matching photo)
    const potLightZs = [2.2, 0, -2.5, -5.0, -7.5, -10.0, -12.5, -15.0, -17.5, -20.0];
    potLightZs.forEach((lz) => {
      createCeilingPotLight(0, lz);
    });

    // --- A. ENTRANCE LOBBY ENCLOSURE (z = 0 to z = 4.5) ---
    // Clean solid entrance wall separating lobby from corridor (prevents optical clutter)
    buildGlassDoorFrame(0, 0, "z", 1.2, 2.3);
    buildWall(-4.6, corridorHeight / 2, 0, 8.0, corridorHeight, 0.14);
    buildWall(4.6, corridorHeight / 2, 0, 8.0, corridorHeight, 0.14);

    // Lobby side and back architectural walls
    buildWall(-1.8, corridorHeight / 2, 2.25, 0.14, corridorHeight, 4.5);
    buildWall(1.8, corridorHeight / 2, 2.25, 0.14, corridorHeight, 4.5);
    buildWall(0, corridorHeight / 2, 4.5, 3.6, corridorHeight, 0.14);

    // Overhead lobby fixture
    const lobbyLight = new THREE.PointLight(0xffedd5, 0.6, 6);
    lobbyLight.position.set(0, 2.9, 2.2);
    scene.add(lobbyLight);

    // --- B. CENTRAL CORRIDOR GLASS PARTITION WALLS (x = -1.2 and x = 1.2) ---
    // Corridor Left Glass Wall (x = -1.2)
    buildGlassWall(-1.2, corridorHeight / 2, -0.95, 0.04, corridorHeight, 1.9); // z: 0 to -1.9
    buildGlassDoorFrame(-1.2, -2.5, "x", 1.2, 2.3);                             // Glass Doorway 1
    buildStructuralColumn(-1.2, -4.5);                                         // Accent Pillar
    buildGlassWall(-1.2, corridorHeight / 2, -6.5, 0.04, corridorHeight, 6.8);  // z: -3.1 to -9.9
    buildStructuralColumn(-1.2, -8.5);                                         // Accent Pillar
    buildGlassDoorFrame(-1.2, -10.5, "x", 1.2, 2.3);                            // Glass Doorway 3
    buildStructuralColumn(-1.2, -12.5);                                        // Accent Pillar
    buildGlassWall(-1.2, corridorHeight / 2, -14.3, 0.04, corridorHeight, 6.4); // z: -11.1 to -17.5

    // Corridor Right Glass Wall (x = 1.2)
    buildGlassWall(1.2, corridorHeight / 2, -2.95, 0.04, corridorHeight, 5.9);  // z: 0 to -5.9 (Meeting room view!)
    buildStructuralColumn(1.2, -4.2);                                          // Accent Pillar
    buildGlassDoorFrame(1.2, -6.5, "x", 1.2, 2.3);                              // Glass Doorway 2
    buildStructuralColumn(1.2, -8.8);                                          // Accent Pillar
    buildGlassWall(1.2, corridorHeight / 2, -12.3, 0.04, corridorHeight, 10.4); // z: -7.1 to -17.5
    buildStructuralColumn(1.2, -12.5);                                         // Accent Pillar

    // Corridor End Solid Wall with Glass Doorway 4 (z = -17.5)
    buildGlassDoorFrame(0, -17.5, "z", 1.2, 2.3);
    buildWall(-0.9, corridorHeight / 2, -17.5, 0.6, corridorHeight, 0.14);
    buildWall(0.9, corridorHeight / 2, -17.5, 0.6, corridorHeight, 0.14);

    // --- C. SOLID ENCLOSED SIDE ROOMS & INTERIORS ---
    // Room 1 Enclosure (About Me, Left Side, z = -2.5, 4m wide in Z)
    buildWall(-3.0, corridorHeight / 2, -0.5, 3.6, corridorHeight, 0.14);  // North wall
    buildWall(-3.0, corridorHeight / 2, -4.5, 3.6, corridorHeight, 0.14);  // South wall
    buildWall(-4.8, corridorHeight / 2, -2.5, 0.14, corridorHeight, 4.0);  // Back exhibition wall
    buildExecutiveDesk(-3.0, -2.5, Math.PI / 2);

    // Room 2 Enclosure (Selected Systems, Right Side, z = -6.5, 4.6m wide in Z)
    buildWall(3.2, corridorHeight / 2, -4.2, 4.0, corridorHeight, 0.14);   // North wall
    buildWall(3.2, corridorHeight / 2, -8.8, 4.0, corridorHeight, 0.14);   // South wall
    buildWall(5.2, corridorHeight / 2, -6.5, 0.14, corridorHeight, 4.6);   // Back exhibition wall
    // Executive Meeting Boardroom visible through glass!
    buildConferenceRoom(3.2, -6.5);

    // Room 3 Enclosure (Technical Arsenal, Left Side, z = -10.5, 4m wide in Z)
    buildWall(-3.0, corridorHeight / 2, -8.5, 3.6, corridorHeight, 0.14);  // North wall
    buildWall(-3.0, corridorHeight / 2, -12.5, 3.6, corridorHeight, 0.14); // South wall
    buildWall(-4.8, corridorHeight / 2, -10.5, 0.14, corridorHeight, 4.0); // Back exhibition wall
    buildExecutiveDesk(-3.0, -10.5, Math.PI / 2);

    // Room 4 Enclosure (Contact Drafting Desk, Back, z = -17.5 to -22.5)
    buildWall(0, corridorHeight / 2, -22.5, 4.4, corridorHeight, 0.14);    // Back wall
    buildWall(-2.2, corridorHeight / 2, -20.0, 0.14, corridorHeight, 5.0); // Left wall
    buildWall(2.2, corridorHeight / 2, -20.0, 0.14, corridorHeight, 5.0);  // Right wall
    buildExecutiveDesk(0, -20.0, 0);

    // ==========================================
    // 6. 3D SWINGING GLASS DOORS WITH STAINLESS STEEL LADDER PULL HANDLES
    // ==========================================
    const create3DDoor = (
      nameKey: "entrance" | "door1" | "door2" | "door3" | "door4",
      hingePos: [number, number, number],
      baseRotationY: number,
      plaqueText: string,
      subText: string,
      onClickDoor: () => void
    ) => {
      const doorHinge = new THREE.Group();
      doorHinge.position.set(...hingePos);
      doorHinge.rotation.y = baseRotationY;

      const doorW = 1.14;
      const doorH = 2.24;
      const doorThick = 0.02; // Realistic 12mm-19mm tempered architectural glass

      // Frameless Tempered Glass Door Leaf with Frosted Horizontal Stripes
      const leafGeo = new THREE.BoxGeometry(doorW, doorH, doorThick);
      const leaf = new THREE.Mesh(leafGeo, glassMaterial);
      leaf.position.set(doorW / 2, doorH / 2, 0);
      leaf.renderOrder = 11;
      doorHinge.add(leaf);

      // Stainless Steel / Chrome Top & Bottom Pivot Patch Fittings
      const patchTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.045, 0.038),
        chromeMaterial
      );
      patchTop.position.set(0.08, doorH - 0.025, 0);
      doorHinge.add(patchTop);

      const patchBottom = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.045, 0.038),
        chromeMaterial
      );
      patchBottom.position.set(0.08, 0.025, 0);
      doorHinge.add(patchBottom);

      // Long Vertical Chrome Tubular Ladder Pull Handle (D-Handle)
      const handleGroup = new THREE.Group();
      const hX = doorW * 0.85;
      const hY = 1.05;
      const hLength = 1.05;
      const hRadius = 0.016;

      // Vertical tubular bar (Outside)
      const barOut = new THREE.Mesh(
        new THREE.CylinderGeometry(hRadius, hRadius, hLength, 16),
        chromeMaterial
      );
      barOut.position.set(hX, hY, 0.04);
      handleGroup.add(barOut);

      // Vertical tubular bar (Inside)
      const barIn = new THREE.Mesh(
        new THREE.CylinderGeometry(hRadius, hRadius, hLength, 16),
        chromeMaterial
      );
      barIn.position.set(hX, hY, -0.04);
      handleGroup.add(barIn);

      // Standoff mount brackets connecting handle to glass
      const mountTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.085, 12),
        chromeMaterial
      );
      mountTop.rotation.x = Math.PI / 2;
      mountTop.position.set(hX, hY + 0.4, 0);
      handleGroup.add(mountTop);

      const mountBottom = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.085, 12),
        chromeMaterial
      );
      mountBottom.rotation.x = Math.PI / 2;
      mountBottom.position.set(hX, hY - 0.4, 0);
      handleGroup.add(mountBottom);

      doorHinge.add(handleGroup);

      // Minimalist Frosted Glass Door Plaque at Eye Level
      const pCanvas = document.createElement("canvas");
      pCanvas.width = 512;
      pCanvas.height = 128;
      const pCtx = pCanvas.getContext("2d")!;
      pCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
      pCtx.fillRect(0, 0, 512, 128);
      pCtx.strokeStyle = "rgba(160, 170, 180, 0.45)";
      pCtx.lineWidth = 3;
      pCtx.strokeRect(4, 4, 504, 120);

      pCtx.fillStyle = "#1a1c1e";
      pCtx.font = "bold 30px 'Space Grotesk', sans-serif";
      pCtx.fillText(plaqueText, 24, 52);

      pCtx.fillStyle = "#c2410c";
      pCtx.font = "bold 20px 'JetBrains Mono', monospace";
      pCtx.fillText(subText, 24, 95);

      const pTex = new THREE.CanvasTexture(pCanvas);
      const pGeo = new THREE.PlaneGeometry(0.65, 0.16);
      const pMat = new THREE.MeshBasicMaterial({ map: pTex, transparent: true });
      const plaqueMesh = new THREE.Mesh(pGeo, pMat);
      plaqueMesh.position.set(doorW / 2, doorH * 0.74, doorThick / 2 + 0.005);
      doorHinge.add(plaqueMesh);

      scene.add(doorHinge);
      doorsRef.current[nameKey] = { group: doorHinge, baseY: baseRotationY };

      clickablesRef.current.push({ mesh: leaf, action: onClickDoor });
    };

    // 1. Entrance Door (Hinged at left jamb x = -0.57, z = 0, baseY = 0)
    create3DDoor("entrance", [-0.57, 0, 0], 0, "UTHUM NALINDA", "SOFTWARE & SECURITY LAB", enterLabFromLobby);

    // 2. Door 1 (Hinged at left jamb x = -1.2, z = -1.93, baseY = Math.PI / 2)
    create3DDoor("door1", [-1.2, 0, -1.93], Math.PI / 2, "01 // ABOUT ME", "PROFILE ELEVATION", enterRoom1);

    // 3. Door 2 (Hinged at right jamb x = 1.2, z = -7.07, baseY = -Math.PI / 2)
    create3DDoor("door2", [1.2, 0, -7.07], -Math.PI / 2, "02 // SELECTED SYSTEMS", "PROJECT SCHEMATICS", enterRoom2);

    // 4. Door 3 (Hinged at left jamb x = -1.2, z = -9.93, baseY = Math.PI / 2)
    create3DDoor("door3", [-1.2, 0, -9.93], Math.PI / 2, "03 // ARSENAL", "SYSTEM WIRING", enterRoom3);

    // 5. Door 4 (Hinged at back doorway x = -0.57, z = -17.5, baseY = 0)
    create3DDoor("door4", [-0.57, 0, -17.5], 0, "04 // DRAFTING DESK", "CONTACT & INQUIRIES", enterRoom4);

    // ============================================================
    // 7. WALL BLUEPRINT BOARDS (INSIDE ROOMS)
    // ============================================================

    // ROOM 1: ABOUT ME WALL DOSSIER BOARD (Mounted inside Room 1 at x = -4.72, z = -2.5)
    {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1024, 768);

      ctx.strokeStyle = "#1a1c1e";
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, 984, 728);

      ctx.fillStyle = "#c2410c";
      ctx.font = "bold 28px 'JetBrains Mono', monospace";
      ctx.fillText("DOOR 01 // LEFT WALL • ELEVATION DOSSIER", 50, 75);

      ctx.fillStyle = "#1a1c1e";
      ctx.font = "bold 60px 'Space Grotesk', sans-serif";
      ctx.fillText("Uthum Nalinda", 50, 150);

      ctx.fillStyle = "#555";
      ctx.font = "28px 'Space Grotesk', sans-serif";
      ctx.fillText("Full-Stack Developer & Security Researcher", 50, 195);
      ctx.fillText("Colombo, Sri Lanka • Next.js 15, TypeScript, Python", 50, 235);

      ctx.strokeStyle = "rgba(30, 34, 40, 0.12)";
      ctx.lineWidth = 2;
      for (let y = 280; y <= 620; y += 45) {
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(974, y);
        ctx.stroke();
      }

      ctx.fillStyle = "#1a1c1e";
      ctx.font = "26px 'Space Grotesk', sans-serif";
      ctx.fillText("• Specializing in high-performance distributed systems & web application security.", 50, 320);
      ctx.fillText("• Adversarial penetration testing, OWASP Top 10 mitigation & defensive architectures.", 50, 365);
      ctx.fillText("• Clean architecture, client-side encryption & zero-knowledge data pipelines.", 50, 410);

      ctx.fillStyle = "#1a1c1e";
      ctx.fillRect(50, 640, 420, 60);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px 'JetBrains Mono', monospace";
      ctx.fillText("🔍 CLICK TO EXPAND DOSSIER →", 70, 678);

      const tex = new THREE.CanvasTexture(canvas);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 2.1),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      mesh.position.set(-4.72, 1.6, -2.5);
      mesh.rotation.y = Math.PI / 2;
      addSketchEdges(mesh, 0x1a1c1e);
      scene.add(mesh);

      clickablesRef.current.push({
        mesh,
        action: () => setActiveModal("about"),
      });

      const spot = new THREE.SpotLight(0xfffaee, 1.4, 7, Math.PI / 3, 0.5);
      spot.position.set(-2.0, 3.0, -2.5);
      spot.target = mesh;
      scene.add(spot);
    }

    // ROOM 2: 3 DISTINCT PROJECT BLUEPRINT BOARDS (Inside Room 2 at x = 5.12)
    {
      const zOffsets = [-5.3, -6.5, -7.7];

      projects.forEach((proj, idx) => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 768;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 512, 768);

        ctx.strokeStyle = "#1a1c1e";
        ctx.lineWidth = 8;
        ctx.strokeRect(16, 16, 480, 736);

        ctx.fillStyle = "#c2410c";
        ctx.font = "bold 24px 'JetBrains Mono', monospace";
        ctx.fillText(proj.code, 40, 65);

        ctx.fillStyle = "#666";
        ctx.font = "18px 'JetBrains Mono', monospace";
        ctx.fillText(proj.badge, 40, 100);

        ctx.fillStyle = "#1a1c1e";
        ctx.font = "bold 44px 'Space Grotesk', sans-serif";
        ctx.fillText(proj.title, 40, 160);

        ctx.fillStyle = "#444";
        ctx.font = "20px 'Space Grotesk', sans-serif";
        ctx.fillText(proj.subtitle, 40, 200);

        ctx.strokeStyle = "rgba(30, 34, 40, 0.12)";
        ctx.lineWidth = 2;
        for (let y = 240; y <= 580; y += 40) {
          ctx.beginPath();
          ctx.moveTo(40, y);
          ctx.lineTo(472, y);
          ctx.stroke();
        }

        ctx.fillStyle = "#333";
        ctx.font = "20px 'Space Grotesk', sans-serif";
        ctx.fillText("Specs:", 40, 275);
        ctx.font = "18px 'Space Grotesk', sans-serif";
        ctx.fillText("• " + proj.specs[0], 40, 315);
        ctx.fillText("• " + proj.specs[1], 40, 355);

        ctx.fillStyle = "#c2410c";
        ctx.font = "16px 'JetBrains Mono', monospace";
        ctx.fillText(proj.tools, 40, 540);

        ctx.fillStyle = "#1a1c1e";
        ctx.fillRect(40, 640, 432, 60);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px 'JetBrains Mono', monospace";
        ctx.fillText("🔍 CLICK TO EXPAND →", 120, 678);

        const tex = new THREE.CanvasTexture(canvas);
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(1.05, 1.55),
          new THREE.MeshBasicMaterial({ map: tex })
        );
        mesh.position.set(5.12, 1.6, zOffsets[idx]);
        mesh.rotation.y = -Math.PI / 2;
        addSketchEdges(mesh, 0x1a1c1e);
        scene.add(mesh);

        clickablesRef.current.push({
          mesh,
          action: () => setActiveModal(`project_${idx}` as ModalType),
        });
      });

      const r2Spot = new THREE.SpotLight(0xfffaee, 1.5, 9, Math.PI / 2.6, 0.4);
      r2Spot.position.set(2.4, 3.0, -6.5);
      r2Spot.target.position.set(5.12, 1.6, -6.5);
      scene.add(r2Spot);
      scene.add(r2Spot.target);
    }

    // ROOM 3: TECHNICAL ARSENAL WIRING BOARD (Inside Room 3 at x = -4.72, z = -10.5)
    {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1024, 768);

      ctx.strokeStyle = "#1a1c1e";
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, 984, 728);

      ctx.fillStyle = "#c2410c";
      ctx.font = "bold 28px 'JetBrains Mono', monospace";
      ctx.fillText("DOOR 03 // LEFT WALL • SYSTEM WIRING DIAGRAM", 50, 75);

      ctx.fillStyle = "#1a1c1e";
      ctx.font = "bold 56px 'Space Grotesk', sans-serif";
      ctx.fillText("Technical Arsenal & Tooling", 50, 145);

      const quads = [
        { title: "01 // Frontend Engineering", tools: "Next.js 15, React 19, TypeScript, Tailwind", x: 50, y: 220 },
        { title: "02 // Backend & Systems", tools: "Node.js, Express, Python FastAPI, PostgreSQL", x: 520, y: 220 },
        { title: "03 // Security & Pen-Testing", tools: "Burp Suite, OWASP Top 10, Kali Linux, Wireshark", x: 50, y: 400 },
        { title: "04 // DevOps & Infrastructure", tools: "Docker, GitHub CI/CD, Linux Admin, Edge Compute", x: 520, y: 400 },
      ];

      quads.forEach((q) => {
        ctx.strokeStyle = "#1a1c1e";
        ctx.lineWidth = 3;
        ctx.strokeRect(q.x, q.y, 450, 140);

        ctx.fillStyle = "#c2410c";
        ctx.font = "bold 24px 'Space Grotesk', sans-serif";
        ctx.fillText(q.title, q.x + 20, q.y + 40);

        ctx.fillStyle = "#333";
        ctx.font = "20px 'JetBrains Mono', monospace";
        ctx.fillText(q.tools, q.x + 20, q.y + 90);
      });

      ctx.fillStyle = "#1a1c1e";
      ctx.fillRect(50, 640, 420, 60);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px 'JetBrains Mono', monospace";
      ctx.fillText("🔍 CLICK TO EXPAND STACK →", 70, 678);

      const tex = new THREE.CanvasTexture(canvas);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 2.1),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      mesh.position.set(-4.72, 1.6, -10.5);
      mesh.rotation.y = Math.PI / 2;
      addSketchEdges(mesh, 0x1a1c1e);
      scene.add(mesh);

      clickablesRef.current.push({
        mesh,
        action: () => setActiveModal("stack"),
      });

      const spot = new THREE.SpotLight(0xfffaee, 1.4, 7, Math.PI / 3, 0.5);
      spot.position.set(-2.0, 3.0, -10.5);
      spot.target = mesh;
      scene.add(spot);
    }

    // ROOM 4: END OFFICE CONTACT BOARD (Inside Room 4 at z = -20.9)
    {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1024, 768);

      ctx.strokeStyle = "#1a1c1e";
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, 984, 728);

      ctx.fillStyle = "#c2410c";
      ctx.font = "bold 28px 'JetBrains Mono', monospace";
      ctx.fillText("ROOM 04 // CORNER DRAFTING DESK • TRANSMISSION", 50, 75);

      ctx.fillStyle = "#1a1c1e";
      ctx.font = "bold 56px 'Space Grotesk', sans-serif";
      ctx.fillText("Let's Build Resilient Software", 50, 150);

      ctx.fillStyle = "#444";
      ctx.font = "26px 'Space Grotesk', sans-serif";
      ctx.fillText("Direct: uthumnalinda@gmail.com", 50, 220);
      ctx.fillText("Colombo, Sri Lanka • Available for full-stack engineering & security audits", 50, 265);

      ctx.fillStyle = "#1a1c1e";
      ctx.fillRect(50, 640, 480, 60);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px 'JetBrains Mono', monospace";
      ctx.fillText("✉️ CLICK TO OPEN TRANSMISSION FORM →", 70, 678);

      const tex = new THREE.CanvasTexture(canvas);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.8),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      mesh.position.set(0, 1.6, -20.9);
      addSketchEdges(mesh, 0x1a1c1e);
      scene.add(mesh);

      clickablesRef.current.push({
        mesh,
        action: () => setActiveModal("contact"),
      });

      const spot = new THREE.SpotLight(0xfffaee, 1.4, 7, Math.PI / 3, 0.5);
      spot.position.set(0, 3.0, -19.0);
      spot.target = mesh;
      scene.add(spot);
    }

    // ==========================================
    // 8. RAYCASTING INTERACTION ON CLICK
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      if (!container || isWalking) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const targets = clickablesRef.current.map((c) => c.mesh);
      const intersects = raycaster.intersectObjects(targets, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && hit !== scene) {
          const matched = clickablesRef.current.find((c) => c.mesh === hit);
          if (matched) {
            matched.action();
            return;
          }
          if (hit.parent) hit = hit.parent;
          else break;
        }
      }
    };

    container.addEventListener("click", handleCanvasClick);

    // ==========================================
    // 9. ANIMATION LOOP & SMOOTH HEAD LOOK
    // ==========================================
    let reqId: number;
    const mouseOffset = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseOffset.x = nx * 0.35;
      mouseOffset.y = -ny * 0.18;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const now = performance.now();

      // Waypoint processing
      if (currentWaypoint.current) {
        const wp = currentWaypoint.current;

        if (now < wp.pauseUntil) {
          // Waiting for door to swing open
        } else {
          const elapsed = now - wp.startTime;
          const progress = Math.min(1, elapsed / wp.duration);
          const eased = easeInOutCubic(progress);

          currentCamPos.current.lerpVectors(wp.startPos, wp.endPos, eased);
          currentCamLook.current.lerpVectors(wp.startLook, wp.endLook, eased);

          if (progress < 1) {
            currentCamPos.current.y = 1.6 + Math.sin(now * 0.008) * 0.015;
          }

          if (progress >= 1) {
            currentCamPos.current.copy(wp.endPos);
            currentCamLook.current.copy(wp.endLook);
            currentWaypoint.current = null;
          }
        }
      } else if (waypointQueue.current.length > 0) {
        const nextWp = waypointQueue.current.shift()!;
        if (nextWp.onStart) {
          nextWp.onStart();
        }

        const pauseDuration = nextWp.pauseAfter || 0;
        currentWaypoint.current = {
          startPos: currentCamPos.current.clone(),
          endPos: nextWp.pos,
          startLook: currentCamLook.current.clone(),
          endLook: nextWp.look,
          startTime: now,
          duration: nextWp.duration,
          pauseUntil: pauseDuration > 0 ? now + pauseDuration : 0,
        };
      } else {
        if (isWalking) {
          setIsWalking(false);
        }
      }

      camera.position.copy(currentCamPos.current);

      const finalLook = currentCamLook.current.clone().add(
        new THREE.Vector3(mouseOffset.x, mouseOffset.y, 0)
      );
      camera.lookAt(finalLook);

      // Smooth hinge door rotation with base orientation
      Object.keys(doorsRef.current).forEach((key) => {
        const item = doorsRef.current[key];
        const angleData = doorAngles.current[key];
        if (item && angleData) {
          angleData.current += (angleData.target - angleData.current) * 0.055;
          item.group.rotation.y = item.baseY + angleData.current;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("click", handleCanvasClick);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [enterLabFromLobby, enterRoom1, enterRoom2, enterRoom3, enterRoom4, isWalking]);

  const copyEmail = () => {
    navigator.clipboard.writeText("uthumnalinda@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSentSuccess(true);
    setFormState({ name: "", email: "", message: "" });
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#fbf9f4] text-stone-900 select-none">
      {/* 3D WEBGL FIRST-PERSON VIEW CANVAS */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-pointer" />

      {/* ============================================================
          TOP BLUEPRINT HEADER & ROOM NAVIGATION
         ============================================================ */}
      <header className="absolute top-0 inset-x-0 z-40 px-6 py-4 flex items-center justify-between border-b-2 border-stone-800 bg-[#fbf9f4]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 border-2 border-stone-800 bg-orange-600 rotate-45" />
          <span className="font-display font-extrabold text-sm sm:text-base tracking-wider text-stone-900">
            UTHUM NALINDA
          </span>
          <span className="text-[10px] font-mono text-stone-600 hidden sm:inline">
            // 3D FPV ARCHITECTURAL WALKTHROUGH
          </span>
        </div>

        {/* Corridor Waypoint Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono">
          <button
            onClick={() => handleHeaderNav("LOBBY")}
            disabled={isWalking}
            className={`px-3 py-1.5 rounded transition-all border ${
              location === "LOBBY"
                ? "bg-stone-900 text-stone-100 font-bold border-stone-900 shadow-sm"
                : "text-stone-700 hover:text-stone-900 border-transparent hover:border-stone-400"
            } ${isWalking ? "cursor-wait opacity-60" : "cursor-pointer"}`}
          >
            LOBBY
          </button>
          <button
            onClick={() => handleHeaderNav("ROOM_1")}
            disabled={isWalking}
            className={`px-3 py-1.5 rounded transition-all border ${
              location === "CORRIDOR_1" || location === "INSIDE_1"
                ? "bg-stone-900 text-stone-100 font-bold border-stone-900 shadow-sm"
                : "text-stone-700 hover:text-stone-900 border-transparent hover:border-stone-400"
            } ${isWalking ? "cursor-wait opacity-60" : "cursor-pointer"}`}
          >
            ABOUT
          </button>
          <button
            onClick={() => handleHeaderNav("ROOM_2")}
            disabled={isWalking}
            className={`px-3 py-1.5 rounded transition-all border ${
              location === "CORRIDOR_2" || location === "INSIDE_2"
                ? "bg-stone-900 text-stone-100 font-bold border-stone-900 shadow-sm"
                : "text-stone-700 hover:text-stone-900 border-transparent hover:border-stone-400"
            } ${isWalking ? "cursor-wait opacity-60" : "cursor-pointer"}`}
          >
            PROJECTS
          </button>
          <button
            onClick={() => handleHeaderNav("ROOM_3")}
            disabled={isWalking}
            className={`px-3 py-1.5 rounded transition-all border ${
              location === "CORRIDOR_3" || location === "INSIDE_3"
                ? "bg-stone-900 text-stone-100 font-bold border-stone-900 shadow-sm"
                : "text-stone-700 hover:text-stone-900 border-transparent hover:border-stone-400"
            } ${isWalking ? "cursor-wait opacity-60" : "cursor-pointer"}`}
          >
            STACK
          </button>
          <button
            onClick={() => handleHeaderNav("ROOM_4")}
            disabled={isWalking}
            className={`px-3 py-1.5 rounded transition-all border ${
              location === "CORRIDOR_4" || location === "INSIDE_4"
                ? "bg-stone-900 text-stone-100 font-bold border-stone-900 shadow-sm"
                : "text-stone-700 hover:text-stone-900 border-transparent hover:border-stone-400"
            } ${isWalking ? "cursor-wait opacity-60" : "cursor-pointer"}`}
          >
            CONTACT
          </button>
        </nav>
      </header>

      {/* ============================================================
          ON-SCREEN 3D HUD HINT (NO FLOATING MODAL)
         ============================================================ */}
      {!activeModal && (
        <div className="absolute top-20 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
          <div className="pointer-events-auto bg-[#ffffff]/90 border border-stone-800 px-4 py-2 font-mono text-xs shadow-md flex items-center gap-3">
            <span className="text-orange-700 font-bold">
              {isWalking ? "WALKING..." : "● 3D ROOM VIEW:"}
            </span>
            <span className="text-stone-700">
              {isWalking
                ? "Moving through hallway..."
                : location === "LOBBY"
                ? "Standing outside entrance. Click the door or 'OPEN DOOR & WALK IN'"
                : location === "CORRIDOR_1"
                ? "Outside Room 01 (About Me). Click door to open & enter"
                : location === "INSIDE_1"
                ? "Inside Room 01. Click the wall dossier to expand details"
                : location === "CORRIDOR_2"
                ? "Outside Room 02 (Selected Systems). Click door to open & enter"
                : location === "INSIDE_2"
                ? "Inside Room 02. Click any of the 3 wall project boards to inspect"
                : location === "CORRIDOR_3"
                ? "Outside Room 03 (Technical Arsenal). Click door to open & enter"
                : location === "INSIDE_3"
                ? "Inside Room 03. Click technical stack wall to inspect tools"
                : location === "CORRIDOR_4"
                ? "Outside Room 04 (Contact Desk). Click door to open & enter"
                : "Inside Room 04. Click contact terminal wall to send message"}
            </span>

            {/* In-room Expand Button */}
            {!isWalking && (location === "INSIDE_1" || location === "INSIDE_2" || location === "INSIDE_3" || location === "INSIDE_4") && (
              <button
                onClick={() => {
                  if (location === "INSIDE_1") setActiveModal("about");
                  else if (location === "INSIDE_2") setActiveModal("project_0");
                  else if (location === "INSIDE_3") setActiveModal("stack");
                  else if (location === "INSIDE_4") setActiveModal("contact");
                }}
                className="ml-2 px-2.5 py-1 bg-stone-900 text-stone-100 hover:bg-orange-600 font-bold text-[11px] cursor-pointer"
              >
                [ EXPAND DETAILS ↗ ]
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          INTERACTIVE MODAL OVERLAYS (ONLY POP UP WHEN CLICKED)
         ============================================================ */}
      {activeModal && (
        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          {/* ABOUT ME MODAL */}
          {activeModal === "about" && (
            <div className="bg-[#ffffff] border-2 border-stone-800 p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 relative">
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 font-mono text-xs font-bold px-2 py-1 bg-stone-100 hover:bg-stone-900 hover:text-white border border-stone-800 cursor-pointer"
              >
                ✕ CLOSE [ESC]
              </button>

              <div className="font-mono text-xs text-orange-700 font-bold uppercase tracking-widest border-b border-stone-300 pb-2">
                DOOR 01 // WALL ELEVATION DOSSIER • COLOMBO, SRI LANKA
              </div>

              <div className="space-y-2">
                <h2 className="font-display font-bold text-3xl text-stone-900">Uthum Nalinda</h2>
                <p className="font-mono text-xs text-orange-700 font-bold uppercase">
                  Full-Stack Developer & Security Researcher
                </p>
                <p className="text-sm text-stone-700 leading-relaxed">
                  I bridge modern web application engineering with adversarial security analysis. I build high-performance systems using modern TypeScript and Next.js, and scrutinize them with a penetration-testing mindset to ensure software is fast, accessible, and resilient under real-world threat conditions.
                </p>
              </div>

              <div className="border border-stone-800 bg-stone-100/60 p-4 font-mono text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-stone-300">
                  <span className="text-stone-500">LOCATION</span>
                  <span className="font-bold">Colombo, Sri Lanka (UTC+5:30)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-300">
                  <span className="text-stone-500">CORE FOCUS</span>
                  <span className="font-bold">Next.js 15, TypeScript, Python</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">SECURITY AUDITS</span>
                  <span className="text-orange-700 font-bold">OWASP Top 10 • Burp Suite</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 font-mono text-xs">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-stone-800 bg-stone-100 hover:bg-stone-200 cursor-pointer"
                >
                  ← RETURN TO 3D ROOM
                </button>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    exitRoom1ToCorridor2();
                  }}
                  className="px-4 py-2 bg-stone-900 text-stone-100 hover:bg-orange-600 font-bold cursor-pointer"
                >
                  EXIT ROOM & WALK TO DOOR 02 →
                </button>
              </div>
            </div>
          )}

          {/* PROJECT DETAIL MODAL */}
          {(activeModal === "project_0" || activeModal === "project_1" || activeModal === "project_2") && (
            (() => {
              const idx = parseInt(activeModal.split("_")[1]);
              const proj = projects[idx];
              return (
                <div className="bg-[#ffffff] border-2 border-stone-800 p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 relative">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="absolute top-4 right-4 font-mono text-xs font-bold px-2 py-1 bg-stone-100 hover:bg-stone-900 hover:text-white border border-stone-800 cursor-pointer"
                  >
                    ✕ CLOSE [ESC]
                  </button>

                  <div className="flex items-center justify-between border-b border-stone-300 pb-2 font-mono text-xs">
                    <span className="text-orange-700 font-bold uppercase">{proj.code} // {proj.badge}</span>
                    <span className="text-stone-500">WALL BLUEPRINT SCHEMATIC</span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="font-display font-bold text-2xl text-stone-900">{proj.title}</h2>
                    <p className="font-mono text-xs text-orange-700 font-semibold">{proj.subtitle}</p>
                  </div>

                  <p className="text-sm text-stone-700 leading-relaxed">{proj.description}</p>

                  <div className="border border-stone-800 bg-stone-100/60 p-3 space-y-1.5 font-mono text-xs">
                    <div className="font-bold text-stone-900 uppercase">Architecture Highlights:</div>
                    {proj.specs.map((s) => (
                      <div key={s} className="text-stone-700 flex items-center gap-2">
                        <span className="text-orange-700">▸</span> {s}
                      </div>
                    ))}
                  </div>

                  <div className="font-mono text-xs text-stone-500">
                    <span className="font-bold text-stone-800">Stack: </span>{proj.tools}
                  </div>

                  <div className="flex justify-between items-center pt-2 font-mono text-xs">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 border border-stone-800 bg-stone-100 hover:bg-stone-200 cursor-pointer"
                    >
                      ← RETURN TO 3D ROOM
                    </button>
                    <div className="flex gap-2">
                      {idx > 0 && (
                        <button
                          onClick={() => setActiveModal(`project_${idx - 1}` as ModalType)}
                          className="px-3 py-1.5 border border-stone-800 hover:bg-stone-200 cursor-pointer"
                        >
                          ← PREV
                        </button>
                      )}
                      {idx < projects.length - 1 && (
                        <button
                          onClick={() => setActiveModal(`project_${idx + 1}` as ModalType)}
                          className="px-3 py-1.5 border border-stone-800 hover:bg-stone-200 cursor-pointer"
                        >
                          NEXT →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* ARSENAL MODAL */}
          {activeModal === "stack" && (
            <div className="bg-[#ffffff] border-2 border-stone-800 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 relative">
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 font-mono text-xs font-bold px-2 py-1 bg-stone-100 hover:bg-stone-900 hover:text-white border border-stone-800 cursor-pointer"
              >
                ✕ CLOSE [ESC]
              </button>

              <div className="font-mono text-xs text-orange-700 font-bold uppercase tracking-widest border-b border-stone-300 pb-2">
                DOOR 03 // TECHNICAL ARSENAL WIRING
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.map((cat) => (
                  <div key={cat.domain} className="border border-stone-800 bg-stone-50 p-3.5 space-y-2">
                    <h3 className="font-display font-bold text-xs text-stone-900">{cat.domain}</h3>
                    <p className="text-[11px] text-stone-500">{cat.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {cat.tools.map((tool) => (
                        <span
                          key={tool}
                          className="px-1.5 py-0.5 bg-stone-200 border border-stone-400 font-mono text-[10px] text-stone-800"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 font-mono text-xs">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-stone-800 bg-stone-100 hover:bg-stone-200 cursor-pointer"
                >
                  ← RETURN TO 3D ROOM
                </button>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    exitRoom3ToCorridor4();
                  }}
                  className="px-4 py-2 bg-stone-900 text-stone-100 hover:bg-orange-600 font-bold cursor-pointer"
                >
                  EXIT ROOM & WALK TO CONTACT DESK →
                </button>
              </div>
            </div>
          )}

          {/* CONTACT MODAL */}
          {activeModal === "contact" && (
            <div className="bg-[#ffffff] border-2 border-stone-800 p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 relative">
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 font-mono text-xs font-bold px-2 py-1 bg-stone-100 hover:bg-stone-900 hover:text-white border border-stone-800 cursor-pointer"
              >
                ✕ CLOSE [ESC]
              </button>

              <div className="font-mono text-xs text-orange-700 font-bold uppercase tracking-widest border-b border-stone-300 pb-2">
                ROOM 04 // CORNER DRAFTING DESK • TRANSMISSION
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5 space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[11px] text-stone-500 uppercase block mb-1">Direct Inquiries</span>
                    <div
                      onClick={copyEmail}
                      className="p-2.5 border border-stone-800 bg-stone-900 text-stone-100 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-orange-700 transition-colors"
                    >
                      <span className="truncate">uthumnalinda@gmail.com</span>
                      <span className="text-[10px] ml-1">{copiedEmail ? "✓" : "COPY"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-stone-500 uppercase block">Profiles</span>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      {socials.slice(0, 4).map((s) => (
                        <a
                          key={s.name}
                          href={s.href}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 border border-stone-800 bg-stone-100 hover:border-orange-600 transition-colors text-stone-900 flex justify-between"
                        >
                          <span>{s.name}</span>
                          <span className="text-stone-500">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="sm:col-span-7 space-y-2 font-mono text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-stone-100 border border-stone-800 text-stone-900 placeholder-stone-500 focus:outline-none focus:border-orange-600"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-stone-100 border border-stone-800 text-stone-900 placeholder-stone-500 focus:outline-none focus:border-orange-600"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Project scope or security audit inquiry..."
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-stone-100 border border-stone-800 text-stone-900 placeholder-stone-500 focus:outline-none focus:border-orange-600 resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-stone-900 text-stone-100 font-bold uppercase hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    {sentSuccess ? "✓ INQUIRY DISPATCHED" : "SEND INQUIRY →"}
                  </button>
                </form>
              </div>

              <div className="flex justify-between items-center pt-2 font-mono text-xs">
                <span className="text-stone-500">© 2026 UTHUM NALINDA</span>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-stone-800 bg-stone-100 hover:bg-stone-200 cursor-pointer"
                >
                  ← RETURN TO 3D ROOM
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          BOTTOM INTERACTIVE CONTROLLER
         ============================================================ */}
      <footer className="absolute bottom-0 inset-x-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-stone-800 bg-[#fbf9f4]/90 backdrop-blur-md font-mono text-xs">
        {/* Step Backward / Exit Room Button */}
        <button
          onClick={() => {
            if (location === "INSIDE_1") {
              const queue: Waypoint[] = [
                { pos: new THREE.Vector3(0, 1.6, -2.5), look: new THREE.Vector3(-2.4, 1.6, -2.5), duration: 800, onStart: () => setDoorOpen("door1", false) },
              ];
              runSequence(queue, "CORRIDOR_1");
            } else if (location === "INSIDE_2") {
              const queue: Waypoint[] = [
                { pos: new THREE.Vector3(0, 1.6, -6.5), look: new THREE.Vector3(2.4, 1.6, -6.5), duration: 800, onStart: () => setDoorOpen("door2", false) },
              ];
              runSequence(queue, "CORRIDOR_2");
            } else if (location === "INSIDE_3") {
              const queue: Waypoint[] = [
                { pos: new THREE.Vector3(0, 1.6, -10.5), look: new THREE.Vector3(-2.4, 1.6, -10.5), duration: 800, onStart: () => setDoorOpen("door3", false) },
              ];
              runSequence(queue, "CORRIDOR_3");
            } else if (location === "INSIDE_4") {
              const queue: Waypoint[] = [
                { pos: new THREE.Vector3(0, 1.6, -16.0), look: new THREE.Vector3(0, 1.6, -17.5), duration: 800, onStart: () => setDoorOpen("door4", false) },
              ];
              runSequence(queue, "CORRIDOR_4");
            } else if (location === "CORRIDOR_1") {
              returnToLobby();
            } else if (location === "CORRIDOR_2") {
              const queue: Waypoint[] = [
                { pos: new THREE.Vector3(0, 1.6, -2.5), look: new THREE.Vector3(-2.4, 1.6, -2.5), duration: 1500 },
              ];
              runSequence(queue, "CORRIDOR_1");
            } else if (location === "CORRIDOR_3") {
              const queue: Waypoint[] = [
                { pos: new THREE.Vector3(0, 1.6, -6.5), look: new THREE.Vector3(2.4, 1.6, -6.5), duration: 1500 },
              ];
              runSequence(queue, "CORRIDOR_2");
            } else if (location === "CORRIDOR_4") {
              const queue: Waypoint[] = [
                { pos: new THREE.Vector3(0, 1.6, -10.5), look: new THREE.Vector3(-2.4, 1.6, -10.5), duration: 1500 },
              ];
              runSequence(queue, "CORRIDOR_3");
            }
          }}
          disabled={location === "LOBBY" || isWalking}
          className={`px-4 py-2 border-2 border-stone-800 rounded transition-all ${
            location === "LOBBY" || isWalking
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-stone-900 hover:text-stone-100 cursor-pointer"
          }`}
        >
          {location.startsWith("INSIDE_") ? "← STEP OUT TO HALLWAY" : "← STEP BACK"}
        </button>

        {/* Current Location Indicator */}
        <div className="text-center">
          <div className="font-bold tracking-wider text-stone-900">
            {location === "LOBBY"
              ? "00 // ENTRANCE LOBBY FOYER"
              : location === "CORRIDOR_1"
              ? "CORRIDOR // DOOR 01: ABOUT ME (DOOR CLOSED)"
              : location === "INSIDE_1"
              ? "INSIDE ROOM 01 // ABOUT ME ELEVATION DOSSIER"
              : location === "CORRIDOR_2"
              ? "CORRIDOR // DOOR 02: SELECTED SYSTEMS (DOOR CLOSED)"
              : location === "INSIDE_2"
              ? "INSIDE ROOM 02 // 03 SELECTED SYSTEM BLUEPRINTS"
              : location === "CORRIDOR_3"
              ? "CORRIDOR // DOOR 03: TECHNICAL ARSENAL (DOOR CLOSED)"
              : location === "INSIDE_3"
              ? "INSIDE ROOM 03 // TECHNICAL ARSENAL & TOOLING"
              : location === "CORRIDOR_4"
              ? "CORRIDOR // DOOR 04: CONTACT DESK (DOOR CLOSED)"
              : "INSIDE ROOM 04 // CORNER DRAFTING DESK"}
          </div>
          <div className="text-[10px] text-stone-600 mt-0.5">
            {isWalking ? "WALKING THROUGH CORRIDOR..." : "CLICK DOORS OR CONTROLS TO ENTER ROOMS"}
          </div>
        </div>

        {/* Dynamic Action Button */}
        <button
          onClick={() => {
            if (location === "LOBBY") enterLabFromLobby();
            else if (location === "CORRIDOR_1") enterRoom1();
            else if (location === "INSIDE_1") exitRoom1ToCorridor2();
            else if (location === "CORRIDOR_2") enterRoom2();
            else if (location === "INSIDE_2") exitRoom2ToCorridor3();
            else if (location === "CORRIDOR_3") enterRoom3();
            else if (location === "INSIDE_3") exitRoom3ToCorridor4();
            else if (location === "CORRIDOR_4") enterRoom4();
            else if (location === "INSIDE_4") returnToLobby();
          }}
          disabled={isWalking}
          className={`px-5 py-2 bg-stone-900 text-stone-100 border-2 border-stone-800 font-bold transition-all ${
            isWalking ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600 cursor-pointer shadow-sm"
          }`}
        >
          {isWalking
            ? "WALKING..."
            : location === "LOBBY"
            ? "OPEN DOOR & WALK IN →"
            : location === "CORRIDOR_1"
            ? "OPEN DOOR 01 & ENTER ROOM →"
            : location === "INSIDE_1"
            ? "EXIT & WALK TO DOOR 02 →"
            : location === "CORRIDOR_2"
            ? "OPEN DOOR 02 & ENTER ROOM →"
            : location === "INSIDE_2"
            ? "EXIT & WALK TO DOOR 03 →"
            : location === "CORRIDOR_3"
            ? "OPEN DOOR 03 & ENTER ROOM →"
            : location === "INSIDE_3"
            ? "EXIT & WALK TO DOOR 04 →"
            : location === "CORRIDOR_4"
            ? "OPEN DOOR 04 & ENTER ROOM →"
            : "RETURN TO ENTRANCE LOBBY ↺"}
        </button>
      </footer>
    </div>
  );
}
