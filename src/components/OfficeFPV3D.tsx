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
  const isWalkingRef = useRef(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [sentSuccess, setSentSuccess] = useState(false);

  // NFC Keycard Drag-and-Drop states (Lobby entrance exclusive)
  const [cardOffset, setCardOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [nfcAccessGranted, setNfcAccessGranted] = useState(false);
  const [cardHintDenied, setCardHintDenied] = useState(false);
  const [projectedNfcTarget, setProjectedNfcTarget] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const nfcLedMeshRef = useRef<THREE.Mesh | null>(null);
  const nfcReaderPos3D = useRef(new THREE.Vector3(0.74, 1.35, 0.08));
  const shelfPos3D = useRef(new THREE.Vector3(-0.95, 0.90, 0.75));
  const [shelfScreenPos, setShelfScreenPos] = useState<{ x: number; y: number } | null>(null);
  const projectedPosRef = useRef<{ x: number; y: number } | null>(null);

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

  // Clickable interactive meshes with strict room location guards
  const clickablesRef = useRef<{
    mesh: THREE.Object3D;
    action: () => void;
    allowedLocations?: LocationState[];
  }[]>([]);
  const wallsRef = useRef<THREE.Mesh[]>([]);
  const locationRef = useRef<LocationState>(location);
  locationRef.current = location;

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
    isWalkingRef.current = true;
    setIsWalking(true);
    waypointQueue.current = queue;
    setLocation(nextLoc);
  }, []);

  // --- DIRECT FREE NAVIGATION CONFIGURATION ---
  const ROOM_CONFIG = {
    ROOM_1: {
      corridorZ: -2.5,
      doorKey: "door1",
      openAngle: Math.PI / 2.15,
      corridorLoc: "CORRIDOR_1" as LocationState,
      insideLoc: "INSIDE_1" as LocationState,
      corridorLook: new THREE.Vector3(-2.4, 1.6, -2.5),
      insidePos: new THREE.Vector3(-1.9, 1.6, -2.5),
      insideLook: new THREE.Vector3(-4.72, 1.6, -2.5),
    },
    ROOM_2: {
      corridorZ: -6.5,
      doorKey: "door2",
      openAngle: Math.PI / 2.15,
      corridorLoc: "CORRIDOR_2" as LocationState,
      insideLoc: "INSIDE_2" as LocationState,
      corridorLook: new THREE.Vector3(2.4, 1.6, -6.5),
      insidePos: new THREE.Vector3(1.9, 1.6, -6.5),
      insideLook: new THREE.Vector3(5.12, 1.6, -6.5),
    },
    ROOM_3: {
      corridorZ: -10.5,
      doorKey: "door3",
      openAngle: Math.PI / 2.15,
      corridorLoc: "CORRIDOR_3" as LocationState,
      insideLoc: "INSIDE_3" as LocationState,
      corridorLook: new THREE.Vector3(-2.4, 1.6, -10.5),
      insidePos: new THREE.Vector3(-1.9, 1.6, -10.5),
      insideLook: new THREE.Vector3(-4.72, 1.6, -10.5),
    },
    ROOM_4: {
      corridorZ: -16.0,
      doorKey: "door4",
      openAngle: -Math.PI / 2.15,
      corridorLoc: "CORRIDOR_4" as LocationState,
      insideLoc: "INSIDE_4" as LocationState,
      corridorLook: new THREE.Vector3(0, 1.6, -17.5),
      insidePos: new THREE.Vector3(0, 1.6, -19.0),
      insideLook: new THREE.Vector3(0, 1.6, -22.4),
    },
  };

  // Unified Direct Free Navigator (Can jump to any room, hallway point, or lobby from anywhere)
  const navigateTo = useCallback(
    (
      target:
        | "LOBBY"
        | "ROOM_1"
        | "ROOM_2"
        | "ROOM_3"
        | "ROOM_4"
        | "CORRIDOR_1"
        | "CORRIDOR_2"
        | "CORRIDOR_3"
        | "CORRIDOR_4"
    ) => {
      if (isWalkingRef.current) return;

      const curPos = currentCamPos.current;
      const isInsideRoom = Math.abs(curPos.x) > 0.3 || curPos.z < -17.0;
      const isInLobby = curPos.z > 0.8;
      const queue: Waypoint[] = [];

      // Step 1: If currently inside any room, smoothly step out into the hallway center
      if (isInsideRoom) {
        const exitZ = curPos.z < -17.0 ? -16.0 : curPos.z;
        queue.push({
          pos: new THREE.Vector3(0, 1.6, exitZ),
          look: new THREE.Vector3(0, 1.6, exitZ - 2.0),
          duration: 650,
          onStart: () => {
            setDoorOpen("door1", false);
            setDoorOpen("door2", false);
            setDoorOpen("door3", false);
            setDoorOpen("door4", false);
          },
        });
      }

      // TARGET A: Return to Lobby with Animated Door Entry
      if (target === "LOBBY") {
        if (isInLobby) {
          queue.push({
            pos: new THREE.Vector3(0, 1.6, 2.5),
            look: new THREE.Vector3(0, 1.6, 0),
            duration: 400,
          });
          runSequence(queue, "LOBBY");
          return;
        }

        // 1. Walk down corridor towards the entrance door threshold (z = -0.9)
        const walkDistToDoor = Math.abs(curPos.z - (-0.9));
        queue.push({
          pos: new THREE.Vector3(0, 1.6, -0.9),
          look: new THREE.Vector3(0, 1.6, 2.5),
          duration: Math.max(650, Math.min(1800, walkDistToDoor * 130)),
          onStart: () => {
            setDoorOpen("door1", false);
            setDoorOpen("door2", false);
            setDoorOpen("door3", false);
            setDoorOpen("door4", false);
          },
        });

        // 2. Entrance glass door swings open to let you into the lobby
        queue.push({
          pos: new THREE.Vector3(0, 1.6, -0.9),
          look: new THREE.Vector3(0, 1.6, 2.5),
          duration: 180,
          onStart: () => setDoorOpen("entrance", true, -Math.PI / 2.15),
          pauseAfter: 500,
        });

        // 3. Walk through the open doorway into the lobby
        queue.push({
          pos: new THREE.Vector3(0, 1.6, 2.5),
          look: new THREE.Vector3(0, 1.6, 4.0),
          duration: 1050,
        });

        // 4. Turn around in the lobby to face the entrance & console, and smoothly close the door
        queue.push({
          pos: new THREE.Vector3(0, 1.6, 2.5),
          look: new THREE.Vector3(0, 1.6, 0),
          duration: 600,
          onStart: () => setDoorOpen("entrance", false),
        });

        runSequence(queue, "LOBBY");
        return;
      }

      // If starting from Lobby into the corridor
      if (isInLobby) {
        queue.push({
          pos: new THREE.Vector3(0, 1.6, 2.5),
          look: new THREE.Vector3(0, 1.6, 0),
          duration: 200,
          onStart: () => setDoorOpen("entrance", true, -Math.PI / 2.15),
          pauseAfter: 550,
        });
      }

      // Determine target corridor location & Z
      const isEnteringRoom = target.startsWith("ROOM_");
      const roomKey = isEnteringRoom ? (target as keyof typeof ROOM_CONFIG) : null;
      const targetCorridorZ = roomKey
        ? ROOM_CONFIG[roomKey].corridorZ
        : target === "CORRIDOR_1"
        ? -2.5
        : target === "CORRIDOR_2"
        ? -6.5
        : target === "CORRIDOR_3"
        ? -10.5
        : -16.0;

      const targetCorridorLoc: LocationState = roomKey
        ? ROOM_CONFIG[roomKey].corridorLoc
        : (target as LocationState);

      const targetLook = roomKey
        ? ROOM_CONFIG[roomKey].corridorLook
        : target === "CORRIDOR_1"
        ? new THREE.Vector3(-2.4, 1.6, -2.5)
        : target === "CORRIDOR_2"
        ? new THREE.Vector3(2.4, 1.6, -6.5)
        : target === "CORRIDOR_3"
        ? new THREE.Vector3(-2.4, 1.6, -10.5)
        : new THREE.Vector3(0, 1.6, -17.5);

      // Step 2: Walk along corridor center to target Z
      const startZ = isInLobby ? 0 : curPos.z;
      const walkDistance = Math.abs(startZ - targetCorridorZ);
      if (walkDistance > 0.4 || isInLobby) {
        queue.push({
          pos: new THREE.Vector3(0, 1.6, targetCorridorZ),
          look: new THREE.Vector3(
            0,
            1.6,
            targetCorridorZ + (targetCorridorZ < startZ ? -4.0 : 4.0)
          ),
          duration: Math.max(700, Math.min(2000, walkDistance * 170)),
        });
      }

      // Face the door / hallway view
      queue.push({
        pos: new THREE.Vector3(0, 1.6, targetCorridorZ),
        look: targetLook,
        duration: 450,
      });

      // Step 3: If target is entering the room, open the door and step inside!
      if (roomKey) {
        const cfg = ROOM_CONFIG[roomKey];
        queue.push({
          pos: new THREE.Vector3(0, 1.6, targetCorridorZ),
          look: targetLook,
          duration: 200,
          onStart: () => setDoorOpen(cfg.doorKey, true, cfg.openAngle),
          pauseAfter: 550,
        });
        queue.push({
          pos: cfg.insidePos,
          look: cfg.insideLook,
          duration: 950,
        });
        runSequence(queue, cfg.insideLoc);
      } else {
        runSequence(queue, targetCorridorLoc);
      }
    },
    [runSequence, setDoorOpen]
  );

  // Denial Feedback when clicking instead of dragging or clicking locked links
  const showDeniedHint = useCallback(() => {
    setCardHintDenied(true);
    setTimeout(() => setCardHintDenied(false), 2400);
  }, []);

  // Quick navigation from top header with Access Control
  const handleHeaderNav = useCallback(
    (dest: "LOBBY" | "ROOM_1" | "ROOM_2" | "ROOM_3" | "ROOM_4") => {
      if (dest === "LOBBY") {
        navigateTo("LOBBY");
        return;
      }
      // Security Enforcement: Cannot bypass locked entrance door from lobby without scanning visitor pass
      if (location === "LOBBY" && !nfcAccessGranted) {
        showDeniedHint();
        return;
      }
      navigateTo(dest);
    },
    [location, nfcAccessGranted, navigateTo, showDeniedHint]
  );

  // Helper to project 3D NFC reader position to 2D screen coordinates
  const getProjectedNfcPos = useCallback(() => {
    if (!cameraRef.current) return null;
    const v = nfcReaderPos3D.current.clone();
    v.project(cameraRef.current);
    if (v.z >= 1) return null;
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-(v.y * 0.5) + 0.5) * window.innerHeight,
    };
  }, []);

  // Trigger NFC Keycard Authentication & Unlock Sequence
  const triggerNfcUnlock = useCallback(
    (explicitTarget?: { x: number; y: number }) => {
      if (isWalkingRef.current || nfcAccessGranted) return;
      setNfcAccessGranted(true);

      const target = explicitTarget || getProjectedNfcPos();
      if (target && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const currentCenterX = rect.left + rect.width / 2;
        const currentCenterY = rect.top + rect.height / 2;
        setCardOffset((prev) => ({
          x: prev.x + (target.x - currentCenterX),
          y: prev.y + (target.y - currentCenterY),
        }));
      }

      // Switch 3D reader LED to emerald green
      if (nfcLedMeshRef.current) {
        (nfcLedMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
      }

      // Smoothly unlock and walk through
      setTimeout(() => {
        navigateTo("CORRIDOR_1");
        setTimeout(() => {
          setNfcAccessGranted(false);
          setCardOffset({ x: 0, y: 0 });
          if (nfcLedMeshRef.current) {
            (nfcLedMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
          }
        }, 1600);
      }, 700);
    },
    [getProjectedNfcPos, navigateTo, nfcAccessGranted]
  );


  // Drag-and-Drop Handlers for the Floating NFC Card
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (nfcAccessGranted || isWalking) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setIsDraggingCard(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: cardOffset.x,
      startY: cardOffset.y,
    };
  };

  useEffect(() => {
    if (!isDraggingCard) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragStartRef.current.mouseX;
      const dy = clientY - dragStartRef.current.mouseY;
      const newX = dragStartRef.current.startX + dx;
      const newY = dragStartRef.current.startY + dy;
      setCardOffset({ x: newX, y: newY });
    };

    const handleEnd = () => {
      if (!isDraggingCard) return;
      setIsDraggingCard(false);
      dragStartRef.current = null;

      // STRICT DRAG & DROP CHECK: Must drop the card directly on the wall scanner
      const target = projectedPosRef.current || getProjectedNfcPos();
      if (target && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;
        const dist = Math.hypot(cardCenterX - target.x, cardCenterY - target.y);
        if (dist < 140) {
          triggerNfcUnlock(target);
          return;
        }
      }

      // If dropped elsewhere or just clicked without dragging to scanner, spring back and prompt
      setCardOffset({ x: 0, y: 0 });
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDraggingCard, triggerNfcUnlock, getProjectedNfcPos]);

  // ==========================================
  // THREE.JS SCENE CREATION & ACTION DISPATCHER
  // ==========================================
  const actionsRef = useRef({
    navigateTo,
    triggerNfcUnlock,
    showDeniedHint,
    enterLabFromLobby: () => showDeniedHint(),
    enterRoom1: () => navigateTo("ROOM_1"),
    exitRoom1ToCorridor2: () => navigateTo("ROOM_2"),
    enterRoom2: () => navigateTo("ROOM_2"),
    exitRoom2ToCorridor3: () => navigateTo("ROOM_3"),
    enterRoom3: () => navigateTo("ROOM_3"),
    exitRoom3ToCorridor4: () => navigateTo("ROOM_4"),
    enterRoom4: () => navigateTo("ROOM_4"),
    returnToLobby: () => navigateTo("LOBBY"),
  });
  actionsRef.current = {
    navigateTo,
    triggerNfcUnlock,
    showDeniedHint,
    enterLabFromLobby: () => showDeniedHint(),
    enterRoom1: () => navigateTo("ROOM_1"),
    exitRoom1ToCorridor2: () => navigateTo("ROOM_2"),
    enterRoom2: () => navigateTo("ROOM_2"),
    exitRoom2ToCorridor3: () => navigateTo("ROOM_3"),
    enterRoom3: () => navigateTo("ROOM_3"),
    exitRoom3ToCorridor4: () => navigateTo("ROOM_4"),
    enterRoom4: () => navigateTo("ROOM_4"),
    returnToLobby: () => navigateTo("LOBBY"),
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    clickablesRef.current = [];

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#ede8de");
    scene.fog = new THREE.FogExp2("#ede8de", 0.022);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 50);
    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentCamLook.current);
    cameraRef.current = camera;

    // 3. Renderer - Optimized for Silky Smooth 60FPS Walkthrough
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 4. Lighting - Optimized High-Performance Architectural Illumination
    const ambientLight = new THREE.AmbientLight(0xfff8ed, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 0.7);
    dirLight.position.set(3, 7, 2);
    scene.add(dirLight);

    // 4 Key Zone Lights along the corridor (Smooth, zero GPU overload)
    const corridorLightZones = [1.5, -4.5, -10.5, -16.5];
    corridorLightZones.forEach((lz) => {
      const zoneLight = new THREE.PointLight(0xfff2dc, 0.55, 9.0, 1.5);
      zoneLight.position.set(0, 2.85, lz);
      scene.add(zoneLight);
    });

    // Helper: Anti-Z-Fighting Sketched Wireframe Edges (0.4 architectural drafting stroke)
    const addSketchEdges = (mesh: THREE.Mesh, color = 0x1a1c1e, opacity = 0.4, threshold = 25) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry, threshold);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        })
      );
      mesh.add(line);
      return line;
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

      // Clear glass background (architectural crystal lightest blue tint)
      ctx.fillStyle = "rgba(195, 232, 246, 0.22)";
      ctx.fillRect(0, 0, 512, 1024);

      // Frosted translucent icy-white manifestation stripes in middle section (eye & waist levels)
      ctx.fillStyle = "rgba(235, 248, 255, 0.78)";

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

    // Helper: Clean Architectural Honed Limestone Wall Texture with Soft Ambient Gradient
    const createArchitecturalWallTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;

      // Vertical architectural ambient gradient (Soft lighting falloff from ceiling to floor)
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0.0, "#cdc5b7"); // Contact shadow near ceiling
      grad.addColorStop(0.14, "#e5ded2"); // Soft upper wall transition
      grad.addColorStop(0.48, "#f2ece2"); // Natural illuminated center / eye level
      grad.addColorStop(0.84, "#ded6ca"); // Soft lower wall falloff
      grad.addColorStop(1.0, "#c6beb0"); // Baseboard contact shadow
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Fine honed plaster / limestone surface grain for realistic physical texture
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const alpha = 0.015 + Math.random() * 0.025;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(45,40,32,${alpha})`;
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    // Helper: Lobby Front Wall Texture (Bright Warm Architectural Stone with Soft Ambient Falloff)
    const createLobbyFrontWallTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;

      // Soft architectural ambient gradient: bright warm limestone center, delicate contact shade near ceiling & floor
      const vGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      vGrad.addColorStop(0.0, "#d5cdc0");
      vGrad.addColorStop(0.15, "#ebe4d8");
      vGrad.addColorStop(0.50, "#f5efe5");
      vGrad.addColorStop(0.85, "#ebe4d8");
      vGrad.addColorStop(1.0, "#cfc6b8");
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Delicate plaster grain
      for (let i = 0; i < 3500; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const alpha = 0.012 + Math.random() * 0.02;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(45,40,32,${alpha})`;
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    // Helper: Lobby Perpendicular Side Wall Texture (Recessed Greige Shadow Shade with Corner Ambient Occlusion)
    const createLobbySideWallTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d")!;

      // Base: Shaded architectural greige tone for natural perpendicular plane contrast
      ctx.fillStyle = "#cec7b9";
      ctx.fillRect(0, 0, 1024, 1024);

      // Horizontal Ambient Occlusion Corner Gradient (Soft corner shadow where side wall meets front & back walls)
      const hGrad = ctx.createLinearGradient(0, 0, 1024, 0);
      hGrad.addColorStop(0.0, "rgba(70, 62, 52, 0.28)");  // Corner ambient shadow
      hGrad.addColorStop(0.18, "rgba(70, 62, 52, 0.06)"); // Soft falloff into room
      hGrad.addColorStop(0.50, "rgba(255, 255, 255, 0.08)"); // Subtle ambient room bounce
      hGrad.addColorStop(0.82, "rgba(70, 62, 52, 0.06)"); // Soft falloff towards back
      hGrad.addColorStop(1.0, "rgba(70, 62, 52, 0.28)");  // Back corner ambient shadow
      ctx.fillStyle = hGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Vertical ceiling & baseboard contact shadows
      const vGrad = ctx.createLinearGradient(0, 0, 0, 1024);
      vGrad.addColorStop(0.0, "rgba(50, 44, 36, 0.22)");
      vGrad.addColorStop(0.12, "rgba(50, 44, 36, 0.0)");
      vGrad.addColorStop(0.88, "rgba(50, 44, 36, 0.0)");
      vGrad.addColorStop(1.0, "rgba(50, 44, 36, 0.22)");
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      // Fine honed stone grain
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const alpha = 0.015 + Math.random() * 0.025;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(45,40,32,${alpha})`;
        ctx.fillRect(x, y, 1.5, 1.5);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    // Materials - Executive Matte Black & Architectural Bronze Suite
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: createArchitecturalWallTexture(),
      roughness: 0.85,
    });
    const lobbyFrontWallMaterial = new THREE.MeshStandardMaterial({
      map: createLobbyFrontWallTexture(),
      roughness: 0.88,
    });
    const lobbySideWallMaterial = new THREE.MeshStandardMaterial({
      map: createLobbySideWallTexture(),
      roughness: 0.88,
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: createTravertineFloorTexture(),
      roughness: 0.22, // Polished travertine high-specular sheen
      metalness: 0.1,
    });
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xf7f7f5, // Clean matte architectural ceiling
      roughness: 0.95,
    });
    // Full-height Transparent Glass with Lightest Blue Tint
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8eff8, // Pure crystalline lightest blue architectural glass
      map: frostedTexture,
      transparent: true,
      opacity: 0.82,
      roughness: 0.05,
      metalness: 0.15,
      depthWrite: false, // Ensures interior furniture and wall posters render cleanly behind glass
    });

    // 3D Glass Door Leaf: High-specular tempered glass
    const doorGlassMaterial = new THREE.MeshStandardMaterial({
      color: 0xdaf2fb, // Pure architectural lightest aqua glass
      map: frostedTexture,
      transparent: true,
      opacity: 0.85,
      roughness: 0.03,
      metalness: 0.18,
      depthWrite: false,
    });

    // Polished Tempered Glass Edge (darker aqua/teal due to internal light refraction along glass edges)
    const glassEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d8a98,
      transparent: true,
      opacity: 0.92,
      roughness: 0.08,
      metalness: 0.25,
      depthWrite: false,
    });
    // Anodized Matte Black / Dark Charcoal Clamping Channels & Baseboards
    const aluminumTrackMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2124, // Crisp Matte Black / Dark Bronze framing
      metalness: 0.55,
      roughness: 0.35,
    });
    // Rich Architectural Dark Bronze / Marbled Graphite Structural Columns
    const columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x221f1d,
      roughness: 0.3,
      metalness: 0.4,
    });
    // Polished Stainless Steel / Chrome for handles & fittings
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e7ed,
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

    const corridorHeight = 3.2;

    // Helper: Solid Wall Segment with Dark Bronze Skirting Baseboard
    const buildWall = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      customMaterial?: THREE.Material
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, customMaterial || wallMaterial);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      wallsRef.current.push(mesh);
      addSketchEdges(mesh, 0x1a1c1e, 0.4);

      // Architectural Baseboard / Skirting to cleanly ground the wall
      const isZAxis = d > w;
      const skirtH = 0.08;
      const skirtThick = (isZAxis ? w : d) + 0.015;
      const skirtGeo = new THREE.BoxGeometry(
        isZAxis ? skirtThick : w,
        skirtH,
        isZAxis ? d : skirtThick
      );
      const skirt = new THREE.Mesh(skirtGeo, aluminumTrackMaterial);
      skirt.position.set(x, skirtH / 2, z);
      scene.add(skirt);
      addSketchEdges(skirt, 0x1a1c1e, 0.3);

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
      addSketchEdges(floorChan, 0x1a1c1e, 0.35);

      // Slim top clamping channel
      const ceilChan = new THREE.Mesh(
        new THREE.BoxGeometry(isZAxis ? 0.04 : length, channelThick, isZAxis ? length : 0.04),
        aluminumTrackMaterial
      );
      ceilChan.position.set(x, h - channelThick / 2, z);
      scene.add(ceilChan);
      addSketchEdges(ceilChan, 0x1a1c1e, 0.35);

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
      wallsRef.current.push(glassMesh);

      return glassMesh;
    };

    // Helper: Dark Marble / Bronze Structural Column (0.4 architectural drafting edge)
    const buildStructuralColumn = (x: number, z: number, w = 0.32, d = 0.32) => {
      const col = new THREE.Mesh(
        new THREE.BoxGeometry(w, corridorHeight, d),
        columnMaterial
      );
      col.position.set(x, corridorHeight / 2, z);
      scene.add(col);
      wallsRef.current.push(col);
      addSketchEdges(col, 0x1a1c1e, 0.4);
      return col;
    };

    // Helper: Recessed Round LED Ceiling Pot Light (Emissive Fixture)
    const createCeilingPotLight = (x: number, z: number) => {
      // Metallic outer trim ring
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.015, 24),
        aluminumTrackMaterial
      );
      ring.position.set(x, corridorHeight - 0.008, z);
      scene.add(ring);

      // Glowing LED disc (Emissive - lightweight zero GPU lighting cost)
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.018, 24),
        new THREE.MeshBasicMaterial({ color: 0xfffaed })
      );
      disc.position.set(x, corridorHeight - 0.01, z);
      scene.add(disc);
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
      addSketchEdges(tableTop, 0x1a1c1e, 0.4);

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
      addSketchEdges(top, 0x1a1c1e, 0.4);

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
    // Clean solid entrance wall separating lobby from corridor (Warm architectural limestone tone)
    buildGlassDoorFrame(0, 0, "z", 1.2, 2.3);
    buildWall(-4.6, corridorHeight / 2, 0, 8.0, corridorHeight, 0.14, lobbyFrontWallMaterial);
    buildWall(4.6, corridorHeight / 2, 0, 8.0, corridorHeight, 0.14, lobbyFrontWallMaterial);

    // Lobby side and back architectural walls (Perpendicular planes with corner ambient occlusion & shadow depth)
    buildWall(-1.8, corridorHeight / 2, 2.25, 0.14, corridorHeight, 4.5, lobbySideWallMaterial);
    buildWall(1.8, corridorHeight / 2, 2.25, 0.14, corridorHeight, 4.5, lobbySideWallMaterial);
    buildWall(0, corridorHeight / 2, 4.5, 3.6, corridorHeight, 0.14, lobbySideWallMaterial);

    // Overhead lobby fixture
    const lobbyLight = new THREE.PointLight(0xffedd5, 0.6, 6);
    lobbyLight.position.set(0, 2.9, 2.2);
    scene.add(lobbyLight);

    // Architectural Wall-Grazing Downlights (Casts realistic lighting gradients & corner depth)
    const leftWallWash = new THREE.SpotLight(0xffebd2, 1.3, 5.5, Math.PI / 4, 0.65);
    leftWallWash.position.set(-1.2, 3.1, 1.4);
    const leftTarget = new THREE.Object3D();
    leftTarget.position.set(-1.8, 1.0, 0.6);
    scene.add(leftTarget);
    leftWallWash.target = leftTarget;
    scene.add(leftWallWash);

    const rightWallWash = new THREE.SpotLight(0xffebd2, 1.3, 5.5, Math.PI / 4, 0.65);
    rightWallWash.position.set(1.2, 3.1, 1.4);
    const rightTarget = new THREE.Object3D();
    rightTarget.position.set(1.8, 1.0, 0.6);
    scene.add(rightTarget);
    rightWallWash.target = rightTarget;
    scene.add(rightWallWash);

    // 3D Minimalist Visitor Console Stand (Pedestal shelf on the left at x = -0.95, y = 0.42, z = 0.75)
    const standGroup = new THREE.Group();
    standGroup.position.set(-0.95, 0, 0.75);

    // Matte dark graphite pedestal column
    const standColumn = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.85, 0.20),
      new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 0.5, metalness: 0.3 })
    );
    standColumn.position.y = 0.425;
    standGroup.add(standColumn);
    addSketchEdges(standColumn, 0x1a1c1e, 0.4);

    // Dark limestone tray shelf top (Reception surface)
    const standTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.04, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x221f1d, roughness: 0.4, metalness: 0.2 })
    );
    standTop.position.y = 0.87;
    standGroup.add(standTop);
    addSketchEdges(standTop, 0x1a1c1e, 0.4);

    // Dedicated keycard tray on top of the shelf
    const badgeTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.012, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.2, metalness: 0.3 })
    );
    badgeTray.position.y = 0.896;
    standGroup.add(badgeTray);

    scene.add(standGroup);

    // 3D NFC RFID Keycard Wall Terminal (Right of entrance door at x = 0.74, y = 1.35, z = 0.08)
    const nfcGroup = new THREE.Group();
    nfcGroup.position.copy(nfcReaderPos3D.current);

    // Beveled Matte Black Terminal Housing
    const nfcBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.18, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.6 })
    );
    nfcGroup.add(nfcBody);

    // Faceplate canvas with NFC waves and instructions
    const nfcCanvas = document.createElement("canvas");
    nfcCanvas.width = 256;
    nfcCanvas.height = 384;
    const nfcCtx = nfcCanvas.getContext("2d")!;
    nfcCtx.fillStyle = "#0a0a0c";
    nfcCtx.fillRect(0, 0, 256, 384);
    nfcCtx.strokeStyle = "#3f3f46";
    nfcCtx.lineWidth = 4;
    nfcCtx.strokeRect(4, 4, 248, 376);

    // RFID / NFC Wave Icon
    nfcCtx.fillStyle = "#ffffff";
    nfcCtx.beginPath();
    nfcCtx.arc(128, 160, 20, 0, Math.PI * 2);
    nfcCtx.fill();
    nfcCtx.strokeStyle = "#ea580c";
    nfcCtx.lineWidth = 7;
    nfcCtx.beginPath();
    nfcCtx.arc(128, 160, 48, -Math.PI * 0.45, Math.PI * 0.45);
    nfcCtx.stroke();
    nfcCtx.beginPath();
    nfcCtx.arc(128, 160, 74, -Math.PI * 0.45, Math.PI * 0.45);
    nfcCtx.stroke();

    nfcCtx.fillStyle = "#f5f5f4";
    nfcCtx.font = "bold 26px 'Space Grotesk', sans-serif";
    nfcCtx.textAlign = "center";
    nfcCtx.fillText("NFC ACCESS", 128, 280);
    nfcCtx.font = "bold 20px 'JetBrains Mono', monospace";
    nfcCtx.fillStyle = "#fb923c";
    nfcCtx.fillText("TAP BADGE", 128, 325);

    const nfcTex = new THREE.CanvasTexture(nfcCanvas);
    const nfcFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.105, 0.165),
      new THREE.MeshBasicMaterial({ map: nfcTex })
    );
    nfcFace.position.set(0, -0.003, 0.016);
    nfcGroup.add(nfcFace);

    // Illuminated Status LED Bar (Red when locked, Green when granted)
    const ledGeo = new THREE.BoxGeometry(0.08, 0.012, 0.012);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const nfcLed = new THREE.Mesh(ledGeo, ledMat);
    nfcLed.position.set(0, 0.076, 0.018);
    nfcGroup.add(nfcLed);
    nfcLedMeshRef.current = nfcLed;

    scene.add(nfcGroup);

    // Clicking terminal in 3D prompts the user to drag the card (Lobby exclusive)
    clickablesRef.current.push({
      mesh: nfcFace,
      action: () => actionsRef.current.showDeniedHint(),
      allowedLocations: ["LOBBY"],
    });

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
      const doorThick = 0.024; // Realistic 24mm architectural tempered safety glass slab

      // Frameless Tempered Glass Door Leaf (Pure Crystalline Lightest Blue)
      const leafGeo = new THREE.BoxGeometry(doorW, doorH, doorThick);
      const leaf = new THREE.Mesh(leafGeo, doorGlassMaterial);
      leaf.position.set(doorW / 2, doorH / 2, 0);
      leaf.renderOrder = 11;
      doorHinge.add(leaf);

      // Polished Tempered Glass Edges (Gives visible 3D volume, thickness, and aqua refraction when swinging)
      const edgeTop = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, 0.005, doorThick + 0.002),
        glassEdgeMaterial
      );
      edgeTop.position.set(doorW / 2, doorH - 0.0025, 0);
      doorHinge.add(edgeTop);

      const edgeBottom = new THREE.Mesh(
        new THREE.BoxGeometry(doorW, 0.005, doorThick + 0.002),
        glassEdgeMaterial
      );
      edgeBottom.position.set(doorW / 2, 0.0025, 0);
      doorHinge.add(edgeBottom);

      const edgeRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.005, doorH, doorThick + 0.002),
        glassEdgeMaterial
      );
      edgeRight.position.set(doorW - 0.0025, doorH / 2, 0);
      doorHinge.add(edgeRight);

      const edgeLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.005, doorH, doorThick + 0.002),
        glassEdgeMaterial
      );
      edgeLeft.position.set(0.0025, doorH / 2, 0);
      doorHinge.add(edgeLeft);

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

      // Bottom stainless steel floor latch / lock fitting
      const floorLock = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.045, 0.038),
        chromeMaterial
      );
      floorLock.position.set(doorW * 0.85, 0.025, 0);
      doorHinge.add(floorLock);

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

      // High-Visibility Solid Architectural Door Signage Plate
      const isEntrance = nameKey === "entrance";
      const pWidth = isEntrance ? 0.98 : 0.84;
      const pHeight = isEntrance ? 0.30 : 0.24;

      const pCanvas = document.createElement("canvas");
      pCanvas.width = 1024;
      pCanvas.height = Math.round(1024 * (pHeight / pWidth));
      const pCtx = pCanvas.getContext("2d")!;

      // 1. Solid Deep Architectural Dark Graphite Plate (100% Opaque for maximum contrast)
      pCtx.fillStyle = "#121316";
      pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);

      // 2. Precision Burnt Orange Architectural Border
      pCtx.strokeStyle = "#ea580c";
      pCtx.lineWidth = isEntrance ? 12 : 10;
      pCtx.strokeRect(6, 6, pCanvas.width - 12, pCanvas.height - 12);

      // 3. Inner accent micro-line for high-end signage feel
      pCtx.strokeStyle = "rgba(251, 146, 60, 0.4)";
      pCtx.lineWidth = 2;
      pCtx.strokeRect(18, 18, pCanvas.width - 36, pCanvas.height - 36);

      // 4. Centralized Typography
      pCtx.textAlign = "center";
      pCtx.textBaseline = "middle";

      if (!subText) {
        // Single centralized header (e.g. "ENTER")
        pCtx.fillStyle = "#ffffff";
        pCtx.font = "900 86px 'Space Grotesk', -apple-system, sans-serif";
        pCtx.fillText(plaqueText, pCanvas.width / 2, pCanvas.height / 2);
      } else {
        // Centralized Header + Subtitle
        pCtx.fillStyle = "#ffffff";
        pCtx.font = isEntrance
          ? "900 68px 'Space Grotesk', -apple-system, sans-serif"
          : "900 58px 'Space Grotesk', -apple-system, sans-serif";
        pCtx.fillText(plaqueText, pCanvas.width / 2, isEntrance ? 116 : 100);

        pCtx.fillStyle = "#fb923c";
        pCtx.font = isEntrance
          ? "bold 34px 'JetBrains Mono', monospace"
          : "bold 28px 'JetBrains Mono', monospace";
        pCtx.fillText(subText, pCanvas.width / 2, isEntrance ? 204 : 176);
      }

      const pTex = new THREE.CanvasTexture(pCanvas);
      pTex.generateMipmaps = true;
      pTex.minFilter = THREE.LinearMipmapLinearFilter;
      pTex.anisotropy = 16;
      const pGeo = new THREE.PlaneGeometry(pWidth, pHeight);
      const pMat = new THREE.MeshBasicMaterial({
        map: pTex,
        depthWrite: true,
      });

      // Front facing plaque (eye level at Y = 1.72m)
      const plaqueMesh = new THREE.Mesh(pGeo, pMat);
      plaqueMesh.position.set(doorW / 2, 1.72, doorThick / 2 + 0.005);
      doorHinge.add(plaqueMesh);

      // Back facing plaque (visible when looking back from inside)
      const plaqueBack = new THREE.Mesh(pGeo, pMat);
      plaqueBack.position.set(doorW / 2, 1.72, -doorThick / 2 - 0.005);
      plaqueBack.rotation.y = Math.PI;
      doorHinge.add(plaqueBack);

      scene.add(doorHinge);
      doorsRef.current[nameKey] = { group: doorHinge, baseY: baseRotationY };

      const doorLocs: { [key: string]: LocationState[] } = {
        entrance: ["LOBBY", "CORRIDOR_1"],
        door1: ["CORRIDOR_1", "INSIDE_1"],
        door2: ["CORRIDOR_2", "INSIDE_2"],
        door3: ["CORRIDOR_3", "INSIDE_3"],
        door4: ["CORRIDOR_4", "INSIDE_4"],
      };

      clickablesRef.current.push({
        mesh: leaf,
        action: onClickDoor,
        allowedLocations: doorLocs[nameKey] || ["CORRIDOR_1"],
      });
    };

    // 1. Entrance Door (Hinged at left jamb x = -0.57, z = 0, baseY = 0)
    create3DDoor("entrance", [-0.57, 0, 0], 0, "ENTER", "", () => {
      if (currentCamPos.current.z > 0.8) {
        actionsRef.current.showDeniedHint();
      } else {
        actionsRef.current.navigateTo("LOBBY");
      }
    });

    // 2. Door 1 (Hinged at left jamb x = -1.2, z = -1.93, baseY = Math.PI / 2)
    create3DDoor("door1", [-1.2, 0, -1.93], Math.PI / 2, "01 // ABOUT ME", "PROFILE ELEVATION", () => {
      actionsRef.current.navigateTo("ROOM_1");
    });

    // 3. Door 2 (Hinged at right jamb x = 1.2, z = -7.07, baseY = -Math.PI / 2)
    create3DDoor("door2", [1.2, 0, -7.07], -Math.PI / 2, "02 // SELECTED SYSTEMS", "PROJECT SCHEMATICS", () => {
      actionsRef.current.navigateTo("ROOM_2");
    });

    // 4. Door 3 (Hinged at left jamb x = -1.2, z = -9.93, baseY = Math.PI / 2)
    create3DDoor("door3", [-1.2, 0, -9.93], Math.PI / 2, "03 // ARSENAL", "SYSTEM WIRING", () => {
      actionsRef.current.navigateTo("ROOM_3");
    });

    // 5. Door 4 (Hinged at back doorway x = -0.57, z = -17.5, baseY = 0)
    create3DDoor("door4", [-0.57, 0, -17.5], 0, "04 // DRAFTING DESK", "CONTACT & INQUIRIES", () => {
      actionsRef.current.navigateTo("ROOM_4");
    });

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
        allowedLocations: ["INSIDE_1"],
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
          allowedLocations: ["INSIDE_2"],
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
        allowedLocations: ["INSIDE_3"],
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
        allowedLocations: ["INSIDE_4"],
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
      if (!container || isWalkingRef.current) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Only test targets valid for current location, preventing X-ray clicks through lobby/corridor walls
      const curLoc = locationRef.current;
      const validClickables = clickablesRef.current.filter((c) => {
        if (!c.allowedLocations) return true;
        return c.allowedLocations.includes(curLoc);
      });

      const targets = validClickables.map((c) => c.mesh);
      // Include walls to physically block clicks through solid drywall/glass partitions
      const allMeshesToTest = [...targets, ...wallsRef.current];
      const intersects = raycaster.intersectObjects(allMeshesToTest, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        // If the closest object hit is a wall or partition, the click is occluded
        if (wallsRef.current.includes(hit as THREE.Mesh)) return;

        while (hit && hit !== scene) {
          const matched = validClickables.find((c) => c.mesh === hit);
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

    // Smooth, cinematic ease-in-out curve for seamless waypoint transitions
    const smoothEase = (t: number) => {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };

    let lastFrameTime = performance.now();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;

      // Check if we need to immediately load next waypoint
      if (!currentWaypoint.current && waypointQueue.current.length > 0) {
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
      }

      // Waypoint processing
      if (currentWaypoint.current) {
        const wp = currentWaypoint.current;

        if (now >= wp.pauseUntil) {
          const actualStart = wp.pauseUntil > 0 ? wp.pauseUntil : wp.startTime;
          const elapsed = now - actualStart;
          const progress = Math.min(1, elapsed / wp.duration);
          const eased = smoothEase(progress);

          currentCamPos.current.lerpVectors(wp.startPos, wp.endPos, eased);
          currentCamLook.current.lerpVectors(wp.startLook, wp.endLook, eased);

          if (progress >= 1) {
            currentCamPos.current.copy(wp.endPos);
            currentCamLook.current.copy(wp.endLook);
            currentWaypoint.current = null;
          }
        }
      } else if (waypointQueue.current.length === 0) {
        if (isWalkingRef.current) {
          isWalkingRef.current = false;
          setIsWalking(false);
        }
      }

      camera.position.copy(currentCamPos.current);

      const finalLook = currentCamLook.current.clone().add(
        new THREE.Vector3(mouseOffset.x, mouseOffset.y, 0)
      );
      camera.lookAt(finalLook);

      // Frame-rate independent hinge door rotation using delta time
      const doorLerpFactor = 1 - Math.exp(-6.5 * delta);
      Object.keys(doorsRef.current).forEach((key) => {
        const item = doorsRef.current[key];
        const angleData = doorAngles.current[key];
        if (item && angleData) {
          angleData.current += (angleData.target - angleData.current) * doorLerpFactor;
          item.group.rotation.y = item.baseY + angleData.current;
        }
      });

      // Keep stand & reader projection synchronized with camera when in lobby
      if (currentCamPos.current.z > 0.8) {
        updateProjections();
      }

      renderer.render(scene, camera);
    };

    const updateProjections = () => {
      // 1. 3D NFC Wall Reader projection
      const sv = nfcReaderPos3D.current.clone();
      sv.project(camera);
      if (sv.z < 1) {
        const sx = Math.round((sv.x * 0.5 + 0.5) * window.innerWidth);
        const sy = Math.round((-(sv.y * 0.5) + 0.5) * window.innerHeight);
        projectedPosRef.current = { x: sx, y: sy };
      }

      // 2. 3D Visitor Stand resting shelf projection (Anchors the keycard to the table)
      const cv = shelfPos3D.current.clone();
      cv.project(camera);
      if (cv.z < 1) {
        const cx = Math.round((cv.x * 0.5 + 0.5) * window.innerWidth);
        const cy = Math.round((-(cv.y * 0.5) + 0.5) * window.innerHeight);
        setShelfScreenPos((prev) => {
          if (!prev || Math.abs(prev.x - cx) > 1 || Math.abs(prev.y - cy) > 1) {
            return { x: cx, y: cy };
          }
          return prev;
        });
      }
    };
    updateProjections();

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      updateProjections();
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
  }, []);

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
          <span className="w-3.5 h-3.5 border-2 border-stone-800 bg-orange-600 rotate-45 shrink-0" />
          <span className="font-display font-black text-base sm:text-lg tracking-normal text-stone-900 inline-block scale-y-125 origin-left">
            UTHUM NALINDA
          </span>
        </div>

        {/* Corridor Waypoint Navigation with Security Access Indicators */}
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
          {[
            { id: "ROOM_1" as const, label: "ABOUT", locs: ["CORRIDOR_1", "INSIDE_1"] },
            { id: "ROOM_2" as const, label: "PROJECTS", locs: ["CORRIDOR_2", "INSIDE_2"] },
            { id: "ROOM_3" as const, label: "STACK", locs: ["CORRIDOR_3", "INSIDE_3"] },
            { id: "ROOM_4" as const, label: "CONTACT", locs: ["CORRIDOR_4", "INSIDE_4"] },
          ].map(({ id, label, locs }) => {
            const isLocked = location === "LOBBY" && !nfcAccessGranted;
            const isActive = locs.includes(location);
            return (
              <button
                key={id}
                onClick={() => handleHeaderNav(id)}
                disabled={isWalking}
                title={isLocked ? "Scan visitor pass at the door to unlock" : undefined}
                className={`px-3 py-1.5 rounded transition-all border flex items-center gap-1.5 ${
                  isActive
                    ? "bg-stone-900 text-stone-100 font-bold border-stone-900 shadow-sm"
                    : isLocked
                    ? "text-stone-400 border-transparent hover:border-stone-400 hover:text-stone-600 cursor-pointer"
                    : "text-stone-700 hover:text-stone-900 border-transparent hover:border-stone-400 cursor-pointer"
                } ${isWalking ? "cursor-wait opacity-60" : ""}`}
              >
                <span>{label}</span>
                {isLocked && (
                  <svg
                    className="w-2.5 h-2.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="Locked"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="#cbd5e1" stroke="#94a3b8" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#94a3b8" />
                    <circle cx="12" cy="16" r="1.5" fill="#64748b" />
                  </svg>
                )}
              </button>
            );
          })}
        </nav>
      </header>

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
                    navigateTo("ROOM_2");
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
                    navigateTo("ROOM_4");
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
          LOBBY EXCLUSIVE: REALISTIC DISCOVERABLE GUEST VISITOR PASS
          (Rests on the Reception Stand in the lower-left lobby)
         ============================================================ */}
      {location === "LOBBY" && !isWalking && (
        <div
          ref={cardRef}
          style={{
            left: shelfScreenPos ? `${shelfScreenPos.x}px` : "22%",
            top: shelfScreenPos ? `${shelfScreenPos.y + 14}px` : "79%",
            transform: `translate(calc(-50% + ${cardOffset.x}px), calc(-50% + ${cardOffset.y}px)) ${
              isDraggingCard
                ? "rotate(4deg) scale(1.1)"
                : "perspective(500px) rotateX(52deg) rotateZ(-3deg)"
            }`,
            transformOrigin: "center center",
          }}
          className={`fixed z-40 transition-transform ${
            isDraggingCard ? "cursor-grabbing duration-0 drop-shadow-2xl" : "cursor-grab duration-300 hover:rotate-x-[36deg] hover:scale-105"
          } select-none touch-none`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={() => {
            if (!isDraggingCard && cardOffset.x === 0 && cardOffset.y === 0) {
              showDeniedHint();
            }
          }}
        >
          {/* Authentic Physical Corporate Plastic RFID Visitor Badge */}
          <div
            className={`w-28 h-18 rounded border text-stone-900 p-1.5 relative select-none transition-all ${
              isDraggingCard
                ? "shadow-2xl"
                : "shadow-[0_8px_14px_-2px_rgba(0,0,0,0.7),0_2px_4px_rgba(0,0,0,0.4)]"
            } ${
              nfcAccessGranted
                ? "bg-emerald-100 border-emerald-600 shadow-emerald-500/50"
                : cardHintDenied
                ? "bg-rose-100 border-rose-600 animate-bounce"
                : "bg-[#fcfbf9] border-stone-300 hover:border-stone-500"
            }`}
          >
            {/* Lanyard Clip Slot */}
            <div className="w-5 h-0.5 mx-auto bg-stone-300 border border-stone-400 rounded-full mb-1" />

            {/* Header: VISITOR PASS */}
            <div className="flex items-center justify-between border-b border-stone-300 pb-0.5">
              <span className="font-sans font-black text-[7.5px] tracking-wider text-stone-900 uppercase">
                VISITOR PASS
              </span>
              <span className="font-mono text-[6px] font-bold text-orange-700">
                LEVEL 01
              </span>
            </div>

            {/* Middle Badge Details */}
            <div className="my-0.5 flex items-center justify-between">
              <div>
                <div className="font-mono text-[6px] font-semibold text-stone-600 uppercase tracking-tight leading-none">
                  TEMPORARY GUEST
                </div>
                <div className="font-mono text-[5.5px] text-stone-400 leading-none mt-0.5">
                  UN-LABS // ACCESS
                </div>
              </div>
              <div className="font-mono text-[7px] font-bold text-stone-700 flex items-center">
                <span>)))</span>
              </div>
            </div>

            {/* Realistic Barcode with Serial Number */}
            <div className="mt-0.5 pt-0.5 border-t border-stone-200 flex items-end justify-between">
              <div className="flex gap-[1px] items-end h-2">
                {[2, 1, 2, 1, 1, 2, 1, 2, 2, 1, 2, 1, 2, 1].map((w, i) => (
                  <div key={i} style={{ width: `${w}px` }} className="bg-stone-900 h-full" />
                ))}
              </div>
              <span className="font-mono text-[5.5px] text-stone-600 font-bold tracking-tight">
                #VIS-8492
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          BOTTOM INTERACTIVE CONTROLLER (DIRECT FREE NAVIGATION)
         ============================================================ */}
      <footer className="absolute bottom-0 inset-x-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-stone-800 bg-[#fbf9f4]/95 backdrop-blur-md font-mono text-xs">
        {/* Step Backward / Exit Room / Back to Lobby Button */}
        <button
          onClick={() => {
            if (isWalkingRef.current) return;
            if (location === "INSIDE_1") navigateTo("CORRIDOR_1");
            else if (location === "INSIDE_2") navigateTo("CORRIDOR_2");
            else if (location === "INSIDE_3") navigateTo("CORRIDOR_3");
            else if (location === "INSIDE_4") navigateTo("CORRIDOR_4");
            else if (location === "CORRIDOR_1") navigateTo("LOBBY");
            else if (location === "CORRIDOR_2") navigateTo("CORRIDOR_1");
            else if (location === "CORRIDOR_3") navigateTo("CORRIDOR_2");
            else if (location === "CORRIDOR_4") navigateTo("CORRIDOR_3");
          }}
          disabled={location === "LOBBY" || isWalking}
          className={`px-4 py-2 border-2 border-stone-800 rounded transition-all font-semibold ${
            location === "LOBBY" || isWalking
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-stone-900 hover:text-stone-100 cursor-pointer"
          }`}
        >
          {location.startsWith("INSIDE_")
            ? "← STEP OUT TO HALLWAY"
            : location === "CORRIDOR_1"
            ? "← RETURN TO LOBBY"
            : location === "CORRIDOR_2"
            ? "← BACK TO DOOR 01"
            : location === "CORRIDOR_3"
            ? "← BACK TO DOOR 02"
            : location === "CORRIDOR_4"
            ? "← BACK TO DOOR 03"
            : "LOBBY ENTRANCE"}
        </button>

        {/* Current Location Indicator */}
        <div className="text-center font-mono">
          <div className="font-bold tracking-wider text-stone-900">
            {location === "LOBBY"
              ? "Entrance Lobby"
              : location === "CORRIDOR_1"
              ? "Hallway • Room 01"
              : location === "INSIDE_1"
              ? "Room 01: About Me"
              : location === "CORRIDOR_2"
              ? "Hallway • Room 02"
              : location === "INSIDE_2"
              ? "Room 02: Projects"
              : location === "CORRIDOR_3"
              ? "Hallway • Room 03"
              : location === "INSIDE_3"
              ? "Room 03: Tech Stack"
              : location === "CORRIDOR_4"
              ? "Hallway • Room 04"
              : "Room 04: Contact"}
          </div>
          <div className="text-[10px] text-stone-600 mt-0.5">
            {isWalking
              ? "Walking inside..."
              : location === "LOBBY"
              ? cardHintDenied
                ? "Door locked. Scan your pass to enter."
                : "Scan your pass to enter."
              : location.startsWith("INSIDE_1")
              ? "Click the board to view."
              : location.startsWith("INSIDE_2")
              ? "Click any project to view."
              : location.startsWith("INSIDE_3")
              ? "Click wall to view tools."
              : location.startsWith("INSIDE_4")
              ? "Click desk to send a message."
              : "Click any door to enter."}
          </div>
        </div>

        {/* Direct Navigation & Forward Controls */}
        <div className="flex items-center gap-2">
          {location === "LOBBY" && (
            <button
              onClick={showDeniedHint}
              disabled={isWalking || nfcAccessGranted}
              className={`px-5 py-2 border-2 border-stone-800 font-bold transition-all ${
                nfcAccessGranted
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                  : cardHintDenied
                  ? "bg-rose-900 text-rose-100 border-rose-600 animate-pulse cursor-pointer"
                  : "bg-stone-900 text-stone-300 hover:bg-stone-800 cursor-pointer shadow-sm"
              }`}
            >
              {isWalking
                ? "Entering Office..."
                : nfcAccessGranted
                ? "Access Granted — Welcome"
                : cardHintDenied
                ? "Please drag your pass to the scanner"
                : "Door Locked — Scan Pass"}
            </button>
          )}

          {location === "CORRIDOR_1" && (
            <>
              <button
                onClick={() => navigateTo("ROOM_1")}
                disabled={isWalking}
                className={`px-4 py-2 bg-stone-900 text-stone-100 border-2 border-stone-800 font-bold transition-all ${
                  isWalking ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600 cursor-pointer shadow-sm"
                }`}
              >
                ENTER ROOM 01 ↗
              </button>
              <button
                onClick={() => navigateTo("CORRIDOR_2")}
                disabled={isWalking}
                className={`px-4 py-2 border-2 border-stone-800 hover:bg-stone-900 hover:text-stone-100 font-semibold transition-all ${
                  isWalking ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                WALK DOWN HALLWAY →
              </button>
            </>
          )}

          {location === "CORRIDOR_2" && (
            <>
              <button
                onClick={() => navigateTo("ROOM_2")}
                disabled={isWalking}
                className={`px-4 py-2 bg-stone-900 text-stone-100 border-2 border-stone-800 font-bold transition-all ${
                  isWalking ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600 cursor-pointer shadow-sm"
                }`}
              >
                ENTER ROOM 02 ↗
              </button>
              <button
                onClick={() => navigateTo("CORRIDOR_3")}
                disabled={isWalking}
                className={`px-4 py-2 border-2 border-stone-800 hover:bg-stone-900 hover:text-stone-100 font-semibold transition-all ${
                  isWalking ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                WALK DOWN HALLWAY →
              </button>
            </>
          )}

          {location === "CORRIDOR_3" && (
            <>
              <button
                onClick={() => navigateTo("ROOM_3")}
                disabled={isWalking}
                className={`px-4 py-2 bg-stone-900 text-stone-100 border-2 border-stone-800 font-bold transition-all ${
                  isWalking ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600 cursor-pointer shadow-sm"
                }`}
              >
                ENTER ROOM 03 ↗
              </button>
              <button
                onClick={() => navigateTo("CORRIDOR_4")}
                disabled={isWalking}
                className={`px-4 py-2 border-2 border-stone-800 hover:bg-stone-900 hover:text-stone-100 font-semibold transition-all ${
                  isWalking ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                WALK TO CONTACT DESK →
              </button>
            </>
          )}

          {location === "CORRIDOR_4" && (
            <>
              <button
                onClick={() => navigateTo("ROOM_4")}
                disabled={isWalking}
                className={`px-4 py-2 bg-stone-900 text-stone-100 border-2 border-stone-800 font-bold transition-all ${
                  isWalking ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600 cursor-pointer shadow-sm"
                }`}
              >
                ENTER ROOM 04 ↗
              </button>
              <button
                onClick={() => navigateTo("LOBBY")}
                disabled={isWalking}
                className={`px-4 py-2 border-2 border-stone-800 hover:bg-stone-900 hover:text-stone-100 font-semibold transition-all ${
                  isWalking ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                RETURN TO LOBBY ↺
              </button>
            </>
          )}

          {location === "INSIDE_1" && (
            <button
              onClick={() => navigateTo("ROOM_2")}
              disabled={isWalking}
              className={`px-5 py-2 bg-stone-900 text-stone-100 border-2 border-stone-800 font-bold transition-all ${
                isWalking ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600 cursor-pointer shadow-sm"
              }`}
            >
              EXIT & NEXT ROOM (PROJECTS) →
            </button>
          )}

          {location === "INSIDE_2" && (
            <button
              onClick={() => navigateTo("ROOM_3")}
              disabled={isWalking}
              className={`px-5 py-2 bg-stone-900 text-stone-100 border-2 border-stone-800 font-bold transition-all ${
                isWalking ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600 cursor-pointer shadow-sm"
              }`}
            >
              EXIT & NEXT ROOM (STACK) →
            </button>
          )}

          {location === "INSIDE_3" && (
            <button
              onClick={() => navigateTo("ROOM_4")}
              disabled={isWalking}
              className={`px-5 py-2 bg-stone-900 text-stone-100 border-2 border-stone-800 font-bold transition-all ${
                isWalking ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600 cursor-pointer shadow-sm"
              }`}
            >
              EXIT & NEXT ROOM (CONTACT) →
            </button>
          )}

          {location === "INSIDE_4" && (
            <button
              onClick={() => navigateTo("LOBBY")}
              disabled={isWalking}
              className={`px-5 py-2 bg-stone-900 text-stone-100 border-2 border-stone-800 font-bold transition-all ${
                isWalking ? "opacity-30 cursor-not-allowed" : "hover:bg-orange-600 cursor-pointer shadow-sm"
              }`}
            >
              RETURN TO ENTRANCE LOBBY ↺
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
