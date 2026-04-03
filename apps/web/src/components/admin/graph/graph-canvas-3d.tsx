'use client';

import type { GraphTopologyResult } from '@/lib/admin/graph-topology';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { GraphControls } from './graph-controls';

type FG3DRef = React.ComponentRef<typeof ForceGraph3D>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Graph3DNode {
  id: string;
  name: string;
  displayName: string;
  category: string;
  maintenanceScore: number;
  stars: number;
  ox: number;
  oy: number;
  oz: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  // Mesh wobble physics — radial spring oscillator per node
  _dr: number; // radial displacement from sphere surface (units)
  _vr: number; // radial velocity (units/sec)
}

interface Graph3DLink {
  source: string | Graph3DNode;
  target: string | Graph3DNode;
  edgeType: string;
  effectiveWeight: number;
}

interface HoveredNodeState {
  node: Graph3DNode;
  screenX: number;
  screenY: number;
}

// ─── Category colours ─────────────────────────────────────────────────────────

const CATEGORY_HEX: Record<string, number> = {
  'web-framework': 0x6366f1,
  testing: 0x10b981,
  'relational-database': 0x0ea5e9,
  'vector-database': 0x8b5cf6,
  'graph-database': 0xec4899,
  cache: 0xf59e0b,
  queue: 0xf97316,
  auth: 0xe11d48,
  monitoring: 0xef4444,
  'llm-framework': 0xa855f7,
  'agent-framework': 0x7c3aed,
  embedding: 0x06b6d4,
  search: 0x0284c7,
  devops: 0x84cc16,
  other: 0x64748b,
};

const CATEGORY_CSS: Record<string, string> = {
  'web-framework': '#6366f1',
  testing: '#10b981',
  'relational-database': '#0ea5e9',
  'vector-database': '#8b5cf6',
  'graph-database': '#ec4899',
  cache: '#f59e0b',
  queue: '#f97316',
  auth: '#e11d48',
  monitoring: '#ef4444',
  'llm-framework': '#a855f7',
  'agent-framework': '#7c3aed',
  embedding: '#06b6d4',
  search: '#0284c7',
  devops: '#84cc16',
  other: '#64748b',
};

function nodeHex(category: string): number {
  return CATEGORY_HEX[category] ?? 0x64748b;
}

function nodeCss(category: string): string {
  return CATEGORY_CSS[category] ?? '#64748b';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPHERE_RADIUS = 180;

// ─── Fibonacci sphere distribution ───────────────────────────────────────────

function fibonacciSpherePoint(i: number, n: number, r: number) {
  const golden = (1 + Math.sqrt(5)) / 2;
  const theta = Math.acos(1 - (2 * (i + 0.5)) / n);
  const phi = (2 * Math.PI * i) / golden;
  return {
    x: r * Math.sin(theta) * Math.cos(phi),
    y: r * Math.sin(theta) * Math.sin(phi),
    z: r * Math.cos(theta),
  };
}

// ─── Glow texture (radial-gradient sprite, lazily created once in browser) ─────

let _glowTexture: THREE.CanvasTexture | null = null;

function getGlowTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  if (_glowTexture) return _glowTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  _glowTexture = new THREE.CanvasTexture(canvas);
  return _glowTexture;
}

// ─── Node bead factory ────────────────────────────────────────────────────────
// NOTE: no `hovered` parameter — changing per-node appearance on hover
// would require a new callback reference which causes ForceGraph3D to
// destroy and recreate EVERY node object, causing the shake + edge flicker.

function makeBead(node: Graph3DNode): THREE.Mesh {
  const score = node.maintenanceScore ?? 0;
  const radius = 2.5 + score * 2.5;
  const color = nodeHex(node.category);

  const geo = new THREE.SphereGeometry(radius, 16, 16);
  const mat = new THREE.MeshPhongMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.8,
    shininess: 80,
  });
  const mesh = new THREE.Mesh(geo, mat);

  // Neon glow: billboard sprite with radial-gradient texture + additive blending.
  // Much more visible than a BackSide sphere (which at opacity 0.09 is nearly invisible).
  // The sprite always faces the camera and scales with the mesh (wobble).
  const glowTex = getGlowTexture();
  if (glowTex) {
    const spriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      color,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.setScalar(radius * 7);
    mesh.add(sprite);
  }

  return mesh;
}

// ─── Data conversion ──────────────────────────────────────────────────────────

function toGraph3DData(topo: GraphTopologyResult): {
  nodes: Graph3DNode[];
  links: Graph3DLink[];
} {
  const total = topo.nodes.length;
  const nodes: Graph3DNode[] = topo.nodes.map((n, i) => {
    const pos = fibonacciSpherePoint(i, total, SPHERE_RADIUS);
    return {
      id: n.id,
      name: n.data.name,
      displayName: n.data.displayName,
      category: n.data.category,
      maintenanceScore: n.data.maintenanceScore,
      stars: n.data.stars,
      ox: pos.x,
      oy: pos.y,
      oz: pos.z,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      fx: pos.x,
      fy: pos.y,
      fz: pos.z,
      _dr: 0,
      _vr: 0,
    };
  });
  // Create a map of node IDs to node objects for quick lookup
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  // Only include edges where both source and target exist in our node set
  const links: Graph3DLink[] = topo.edges
    .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
    .map((e) => ({
      source: nodeMap.get(e.source)!,
      target: nodeMap.get(e.target)!,
      edgeType: e.data.edgeType,
      effectiveWeight: e.data.effectiveWeight,
    }));
  return { nodes, links };
}

// ─── Hover card ───────────────────────────────────────────────────────────────

function HoverCard({ state }: { state: HoveredNodeState }) {
  const { node, screenX, screenY } = state;
  const score = Math.round((node.maintenanceScore ?? 0) * 100);
  const color = nodeCss(node.category);
  const scoreColor = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: screenX + 18,
        top: screenY - 60,
        transform: 'perspective(700px) rotateY(-6deg) rotateX(2deg)',
        transformOrigin: 'left center',
      }}
    >
      <div
        style={{
          background: 'rgba(10, 14, 26, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderLeft: `3px solid ${color}`,
          borderRadius: '10px',
          padding: '12px 16px',
          minWidth: '200px',
          boxShadow: '-6px 6px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
          {node.displayName}
        </p>
        <p
          style={{
            color,
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '10px',
            opacity: 0.9,
          }}
        >
          {node.category}
        </p>
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: 'rgba(148,163,184,0.8)',
              marginBottom: '4px',
            }}
          >
            <span>Health</span>
            <span style={{ color: scoreColor, fontWeight: 700 }}>{score}%</span>
          </div>
          <div
            style={{
              height: '3px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${score}%`,
                background: scoreColor,
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#fbbf24', fontSize: '12px' }}>★</span>
          <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>
            {node.stars.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GraphCanvas3DProps {
  initialData: GraphTopologyResult;
}

export function GraphCanvas3D({ initialData }: GraphCanvas3DProps) {
  const graphRef = useRef<FG3DRef | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const isDraggingRef = useRef(false);
  const isHoveringNodeRef = useRef(false);
  const springbacksRef = useRef<
    Array<{ node: Graph3DNode; sx: number; sy: number; sz: number; progress: number }>
  >([]);

  // Direct mesh refs — avoids scene.traverse() and __data lookups which are
  // unreliable with custom nodeThreeObject callbacks.
  const nodeObjectsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  // Bubble membrane shell added to the Three.js scene
  const bubbleMeshRef = useRef<THREE.Mesh | null>(null);
  // Keep a ref to current graph data so the RAF loop can read it without
  // having it as a dependency (which would restart the loop constantly).
  const graphDataRef = useRef<{ nodes: Graph3DNode[]; links: Graph3DLink[] }>({
    nodes: [],
    links: [],
  });

  // Wobble wave state
  const wobbleNodeRef = useRef<Graph3DNode | null>(null);
  const wobbleTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  // Cursor velocity tracking for sudden movement detection
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const lastCursorPosRef = useRef({ x: 0, y: 0 });
  const cursorVelocityRef = useRef(0);
  const lastCursorMoveTimeRef = useRef(0);

  // Threshold for "sudden" cursor movement (pixels per ms)
  const SUDDEN_MOVE_THRESHOLD = 2.5;

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphData, setGraphData] = useState(() => toGraph3DData(initialData));
  const [stats, setStats] = useState(initialData.stats);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [nodeLimit, setNodeLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<HoveredNodeState | null>(null);

  // Keep graphDataRef in sync whenever graphData changes
  useEffect(() => {
    graphDataRef.current = graphData;
    // Clear the mesh map so stale entries for removed nodes are dropped;
    // nodeThreeObject will repopulate it when the graph is re-rendered.
    nodeObjectsRef.current.clear();
  }, [graphData]);

  // Pause auto-rotation while user holds mouse button
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onDown = () => {
      isDraggingRef.current = true;
    };
    const onUp = () => {
      isDraggingRef.current = false;
    };
    // Track cursor velocity for sudden movement detection
    const onMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = now - lastCursorMoveTimeRef.current;
      if (dt > 0) {
        const dx = e.clientX - lastCursorPosRef.current.x;
        const dy = e.clientY - lastCursorPosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Calculate velocity in pixels per ms
        cursorVelocityRef.current = dist / dt;
      }
      lastCursorPosRef.current = { x: e.clientX, y: e.clientY };
      lastCursorMoveTimeRef.current = now;
    };
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('mousemove', onMouseMove);
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Track container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry)
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    setDimensions({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Fetch updated topology on filter change
  const fetchTopology = useCallback(async (category: string, limit: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      params.set('limit', String(limit));
      const res = await fetch(`/api/admin/graph?${params.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as { ok: boolean; data: GraphTopologyResult };
      if (!json.ok) return;
      setGraphData(toGraph3DData(json.data));
      setStats(json.data.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    void fetchTopology(cat, nodeLimit);
  };

  const handleNodeLimitChange = (limit: number) => {
    setNodeLimit(limit);
    void fetchTopology(selectedCategory, limit);
  };

  // ── Node object factory ───────────────────────────────────────────────────
  // CRITICAL: empty dep array — this callback must NEVER change reference.
  // If it changes (e.g. via [hoveredNode]), ForceGraph3D destroys and
  // recreates every node object on each hover → nodes shake, edges vanish.
  const nodeThreeObject = useCallback((nodeRaw: object): THREE.Mesh => {
    const node = nodeRaw as Graph3DNode;
    const mesh = makeBead(node);
    nodeObjectsRef.current.set(node.id, mesh);
    return mesh;
  }, []); // ← intentionally empty — must stay empty

  // ── Glowing straight-line edges ───────────────────────────────────────────
  // linkThreeObject creates a pre-allocated 2-point Line with AdditiveBlending.
  // linkPositionUpdate fills it in-place every frame (zero allocations).
  // AdditiveBlending makes lines glow where they overlap — no post-processing needed.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally empty
  const linkThreeObject = useCallback((linkRaw: object): THREE.Line => {
    const link = linkRaw as Graph3DLink;
    // Brighter colors for better visibility
    const color = link.edgeType === 'REQUIRES' ? 0xa78bfa : 0x6ee7b7;
    const geo = new THREE.BufferGeometry();
    const pos = new THREE.BufferAttribute(new Float32Array(6), 3);
    pos.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', pos);
    // Increased opacity and linewidth for visibility
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }, []);

  // Called every frame by three-forcegraph with current node positions.
  // Returning true suppresses the default cylinder/line position update.
  const linkPositionUpdate = useCallback(
    (
      obj: THREE.Object3D,
      coords: {
        start: { x: number; y: number; z: number };
        end: { x: number; y: number; z: number };
      },
    ): boolean => {
      const { start, end } = coords;
      const pos = (obj as THREE.Line).geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, start.x, start.y, start.z);
      pos.setXYZ(1, end.x, end.y, end.z);
      pos.needsUpdate = true;
      (obj as THREE.Line).geometry.computeBoundingSphere();
      return true;
    },
    [],
  );

  // ── Hover: show card, start node bounce, apply mesh wobble impulse ──────
  const handleNodeHover = useCallback((nodeRaw: object | null) => {
    isHoveringNodeRef.current = nodeRaw !== null;
    if (!nodeRaw) {
      setHoveredNode(null);
      wobbleNodeRef.current = null;
      return;
    }
    const node = nodeRaw as Graph3DNode;

    // Only trigger wobble on sudden cursor movement
    const isSuddenMove = cursorVelocityRef.current > SUDDEN_MOVE_THRESHOLD;

    if (isSuddenMove) {
      // Mesh wobble: apply outward radial velocity impulse to all nodes.
      // Magnitude decays with angular distance (Gaussian, σ = 46°).
      const r0 = Math.sqrt(node.ox * node.ox + node.oy * node.oy + node.oz * node.oz);
      if (r0 > 0) {
        const hvX = node.ox / r0;
        const hvY = node.oy / r0;
        const hvZ = node.oz / r0;
        const SIGMA = 0.8; // radians ~46°
        const V0 = 180; // initial radial velocity units/sec
        for (const n of graphDataRef.current.nodes) {
          const nr = Math.sqrt(n.ox * n.ox + n.oy * n.oy + n.oz * n.oz);
          if (nr === 0) continue;
          const dot = Math.min(1, Math.max(-1, (n.ox * hvX + n.oy * hvY + n.oz * hvZ) / nr));
          const angle = Math.acos(dot);
          n._vr += V0 * Math.exp(-(angle * angle) / (2 * SIGMA * SIGMA));
        }
      }
    }

    wobbleNodeRef.current = node;
    wobbleTimeRef.current = 0;

    const fg = graphRef.current;
    if (!fg || node.x == null || node.y == null || node.z == null) {
      setHoveredNode(null);
      return;
    }
    const coords = fg.graph2ScreenCoords(node.x, node.y, node.z);
    setHoveredNode({ node, screenX: coords.x, screenY: coords.y });
  }, []);

  // ── Drag end → elastic spring-back ───────────────────────────────────────
  const handleNodeDragEnd = useCallback((nodeRaw: object) => {
    const node = nodeRaw as Graph3DNode;
    springbacksRef.current = springbacksRef.current.filter((s) => s.node.id !== node.id);
    springbacksRef.current.push({
      node,
      sx: node.x ?? node.ox,
      sy: node.y ?? node.oy,
      sz: node.z ?? node.oz,
      progress: 0,
    });
    isDraggingRef.current = false;
  }, []);

  const handleBackgroundClick = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const stableGraphData = useMemo(() => graphData, [graphData]);

  // ── RAF loop ──────────────────────────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: stableGraphData triggers setup restart when graph data changes
  useEffect(() => {
    const setup = setTimeout(() => {
      const fg = graphRef.current;
      if (!fg) return;

      fg.d3Force('charge', null);
      fg.d3Force('link', null);
      fg.d3Force('center', null);

      // Initial camera — set once; the RAF loop rotates incrementally from here
      fg.cameraPosition({ x: 0, y: 130, z: 360 }, { x: 0, y: 0, z: 0 }, 0);

      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);

      // ── Bubble membrane shell ────────────────────────────────────────────
      // Semi-transparent sphere sits just inside the node shell.
      // AdditiveBlending + depthWrite:false gives a glossy surface-tension look
      // without z-fighting against nodes or edges.
      const scene = fg.scene();
      if (bubbleMeshRef.current) {
        scene.remove(bubbleMeshRef.current);
        (bubbleMeshRef.current.material as THREE.Material).dispose();
        bubbleMeshRef.current.geometry.dispose();
      }
      const shellGeo = new THREE.SphereGeometry(SPHERE_RADIUS * 0.97, 48, 48);
      const shellMat = new THREE.MeshPhongMaterial({
        color: 0x4488ff,
        emissive: 0x112244,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        shininess: 120,
      });
      const shellMesh = new THREE.Mesh(shellGeo, shellMat);
      scene.add(shellMesh);
      bubbleMeshRef.current = shellMesh;

      // Y-axis rotation per frame (60 s/revolution at 60 fps)
      // Use cos/sin matrix instead of absolute cameraPosition() so the
      // user's manual zoom and orbit are PRESERVED each frame.
      const SPEED = (2 * Math.PI) / (60 * 60);
      const cosS = Math.cos(SPEED);
      const sinS = Math.sin(SPEED);

      // Mesh wobble spring-damper constants (radial oscillator per node)
      // k = 30 → ω₀ ≈ 5.5 rad/s ≈ 0.87 Hz; γ = 3.5 → ζ ≈ 0.32 (underdamped)
      const K_SPRING = 30;
      const GAMMA_DAMP = 3.5;

      const tick = () => {
        const now = performance.now();
        const dt = Math.min(
          lastFrameTimeRef.current > 0 ? (now - lastFrameTimeRef.current) / 1000 : 0.016,
          0.05, // clamp to 50 ms — prevents physics explosion on tab-switch
        );
        lastFrameTimeRef.current = now;

        // ── Elastic spring-back (drag → original position) ──────────────
        springbacksRef.current = springbacksRef.current.filter((sb) => {
          sb.progress = Math.min(1, sb.progress + 0.03);
          const t = 1 - (1 - sb.progress) ** 3;
          sb.node.fx = sb.sx + (sb.node.ox - sb.sx) * t;
          sb.node.fy = sb.sy + (sb.node.oy - sb.sy) * t;
          sb.node.fz = sb.sz + (sb.node.oz - sb.sz) * t;
          return sb.progress < 1;
        });

        // ── Mesh wobble spring physics (bubble deformation) ─────────────
        // Each node is a radial spring oscillator displaced from SPHERE_RADIUS.
        // linkPositionUpdate in three-forcegraph picks up the new fx/fy/fz
        // every frame, so edges follow the deformed surface automatically.
        for (const node of graphDataRef.current.nodes) {
          if (Math.abs(node._dr) < 0.005 && Math.abs(node._vr) < 0.05) continue;
          // Damped harmonic oscillator: ẍ + γẋ + kx = 0
          node._vr += (-K_SPRING * node._dr - GAMMA_DAMP * node._vr) * dt;
          node._dr += node._vr * dt;
          node._dr = Math.max(-40, Math.min(40, node._dr)); // safety clamp
          // Project new position along original radial direction
          const r = Math.sqrt(node.ox * node.ox + node.oy * node.oy + node.oz * node.oz);
          if (r > 0) {
            const s = (r + node._dr) / r;
            node.fx = node.ox * s;
            node.fy = node.oy * s;
            node.fz = node.oz * s;
          }
          // Snap to rest when amplitude is negligible
          if (Math.abs(node._dr) < 0.005 && Math.abs(node._vr) < 0.05) {
            node._dr = 0;
            node._vr = 0;
            node.fx = node.ox;
            node.fy = node.oy;
            node.fz = node.oz;
          }
        }

        const fgCurrent = graphRef.current;
        if (fgCurrent) {
          // ── Camera Y-orbit ─────────────────────────────────────────────
          // Rotate camera.position directly (Y-axis rotation matrix) instead
          // of calling cameraPosition() which would reset zoom and orbit.
          if (!isDraggingRef.current && !isHoveringNodeRef.current) {
            const cam = fgCurrent.camera();
            if (cam) {
              const px = cam.position.x;
              const pz = cam.position.z;
              cam.position.x = cosS * px + sinS * pz;
              cam.position.z = -sinS * px + cosS * pz;
            }
          }

          // ── Bubble wobble (hovered node only — damped sine bounce) ────
          const wobN = wobbleNodeRef.current;
          const meshMap = nodeObjectsRef.current;

          if (wobN) wobbleTimeRef.current += dt;

          // 0.7 s bounce on the hovered node; 7 Hz, fast exponential decay
          const WOBBLE_DUR = 0.7;
          const WOBBLE_FREQ = 7;
          const WOBBLE_DECAY = 6;

          if (wobN) {
            const hovMesh = meshMap.get(wobN.id);
            if (hovMesh) {
              if (wobbleTimeRef.current < WOBBLE_DUR) {
                const amp = 0.2 * Math.exp(-wobbleTimeRef.current * WOBBLE_DECAY);
                const target =
                  1 + amp * Math.sin(wobbleTimeRef.current * WOBBLE_FREQ * Math.PI * 2);
                const cur = hovMesh.scale.x;
                hovMesh.scale.setScalar(cur + (target - cur) * 0.6);
              } else {
                wobbleNodeRef.current = null;
              }
            }
          }

          // Restore every non-hovered node smoothly back to scale 1
          for (const [id, mesh] of meshMap) {
            if (wobN?.id === id) continue;
            const cur = mesh.scale.x;
            if (Math.abs(cur - 1) > 0.001) {
              mesh.scale.setScalar(cur + (1 - cur) * 0.15);
            }
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }, 200);

    return () => {
      clearTimeout(setup);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      // Remove bubble membrane from scene to avoid leaking geometry/material
      const fg = graphRef.current;
      if (fg && bubbleMeshRef.current) {
        fg.scene().remove(bubbleMeshRef.current);
        (bubbleMeshRef.current.material as THREE.Material).dispose();
        bubbleMeshRef.current.geometry.dispose();
        bubbleMeshRef.current = null;
      }
    };
  }, [stableGraphData]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <GraphControls
        categories={stats.categories}
        selectedCategory={selectedCategory}
        nodeLimit={nodeLimit}
        onCategoryChange={handleCategoryChange}
        onNodeLimitChange={handleNodeLimitChange}
        totalNodes={stats.totalNodes}
        totalEdges={stats.totalEdges}
      />

      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 rounded-xl overflow-hidden"
        style={{ background: '#070b18' }}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <span className="text-xs text-slate-400 animate-pulse">Loading…</span>
          </div>
        )}

        <ForceGraph3D
          ref={graphRef}
          graphData={stableGraphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#070b18"
          // Nodes — stable callback, never recreated on hover
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          nodeLabel=""
          // Links — custom glowing lines (AdditiveBlending, zero-alloc per-frame update)
          linkThreeObject={linkThreeObject}
          linkPositionUpdate={linkPositionUpdate}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.003}
          linkDirectionalParticleWidth={3}
          linkDirectionalParticleColor={() => '#e9d5ff'}
          // Static graph — skip sim warmup, keep render loop alive for RAF
          warmupTicks={0}
          cooldownTime={Number.POSITIVE_INFINITY}
          // Interaction
          onNodeHover={handleNodeHover}
          onNodeDragEnd={handleNodeDragEnd}
          onBackgroundClick={handleBackgroundClick}
          enableNodeDrag
          enableNavigationControls
          showNavInfo={false}
        />

        {hoveredNode && <HoverCard state={hoveredNode} />}

        {/* Legend */}
        <div
          className="absolute bottom-3 left-3 flex flex-col gap-1.5 pointer-events-none"
          style={{
            background: 'rgba(7,11,24,0.75)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
        >
          <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Edge type</p>
          <div className="flex items-center gap-2">
            <span
              style={{
                display: 'inline-block',
                width: 24,
                height: 2,
                background: '#818cf8',
                borderRadius: 1,
              }}
            />
            <span className="text-[10px] text-slate-400">REQUIRES</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              style={{
                display: 'inline-block',
                width: 24,
                height: 2,
                background: '#34d399',
                borderRadius: 1,
              }}
            />
            <span className="text-[10px] text-slate-400">INTEGRATES_WITH</span>
          </div>
        </div>

        {/* Controls hint */}
        <div
          className="absolute bottom-3 right-3 pointer-events-none"
          style={{
            background: 'rgba(7,11,24,0.75)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
        >
          <p className="text-[10px] text-slate-500 leading-relaxed">
            🖱 Drag to rotate · Scroll to zoom
            <br />
            Click node to inspect
          </p>
        </div>
      </div>
    </div>
  );
}
