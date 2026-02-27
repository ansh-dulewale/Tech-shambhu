import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

// ─── Constants ──────────────────────────────────────────────────────
const RESOURCE_COLORS = {
    water: '#67e8f9', food: '#6ee7b7', energy: '#fcd34d', land: '#c4b5fd',
};

// ─── Projection: geo coords → 3D XZ plane ──────────────────────────
function createProjection3D(features) {
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    function walk(coords) {
        if (typeof coords[0] === 'number') {
            minLon = Math.min(minLon, coords[0]);
            maxLon = Math.max(maxLon, coords[0]);
            minLat = Math.min(minLat, coords[1]);
            maxLat = Math.max(maxLat, coords[1]);
            return;
        }
        coords.forEach(c => walk(c));
    }
    features.forEach(f => walk(f.geometry.coordinates));

    const lonSpan = maxLon - minLon;
    const latSpan = maxLat - minLat;
    const mapSize = 12;
    const scale = mapSize / Math.max(lonSpan, latSpan);
    const cx = (minLon + maxLon) / 2;
    const cy = (minLat + maxLat) / 2;

    return function project(lon, lat) {
        return [
            (lon - cx) * scale,
            (lat - cy) * scale,
        ];
    };
}

// ─── Health color ───────────────────────────────────────────────────
function getHealthColor(state) {
    if (!state.alive) return '#334155';
    const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
    if (avg > 60) return '#10b981';
    if (avg > 40) return '#f59e0b';
    if (avg > 20) return '#f97316';
    return '#f43f5e';
}

function getHealthHeight(state) {
    if (!state.alive) return 0.05;
    const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
    return 0.15 + (avg / 100) * 1.2;
}

// ─── Build Shape from polygon ring ──────────────────────────────────
function ringToShape(ring, project) {
    const shape = new THREE.Shape();
    ring.forEach((coord, i) => {
        const [x, z] = project(coord[0], coord[1]);
        if (i === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
    });
    shape.closePath();
    return shape;
}

function geometryToShapes(geometry, project) {
    const shapes = [];
    if (geometry.type === 'Polygon') {
        const outer = ringToShape(geometry.coordinates[0], project);
        if (geometry.coordinates.length > 1) {
            geometry.coordinates.slice(1).forEach(hole => {
                outer.holes.push(ringToShape(hole, project));
            });
        }
        shapes.push(outer);
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(poly => {
            const outer = ringToShape(poly[0], project);
            if (poly.length > 1) {
                poly.slice(1).forEach(hole => {
                    outer.holes.push(ringToShape(hole, project));
                });
            }
            shapes.push(outer);
        });
    }
    return shapes;
}

// ─── Compute centroid ───────────────────────────────────────────────
function getCentroid3D(geometry, project) {
    let sx = 0, sz = 0, n = 0;
    function walk(coords) {
        if (typeof coords[0] === 'number') {
            const [x, z] = project(coords[0], coords[1]);
            sx += x; sz += z; n++;
            return;
        }
        coords.forEach(c => walk(c));
    }
    walk(geometry.coordinates);
    return n ? [sx / n, sz / n] : [0, 0];
}

// ─── Animated State Mesh ────────────────────────────────────────────
function StateMesh({ feature, state, project, isHovered, isEvent, activeEvent, onClick, onHover, onUnhover }) {
    const meshRef = useRef();
    const edgeRef = useRef();
    const glowRef = useRef();
    const targetHeight = getHealthHeight(state);
    const currentHeight = useRef(targetHeight);
    const color = getHealthColor(state);
    const centroid = useMemo(() => getCentroid3D(feature.geometry, project), [feature, project]);

    const shapes = useMemo(() => {
        try {
            return geometryToShapes(feature.geometry, project);
        } catch {
            return [];
        }
    }, [feature, project]);

    const extrudeSettings = useMemo(() => ({
        depth: 1, // base depth, we'll scale Y instead
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2,
        curveSegments: 4,
    }), []);

    // Use scale animation instead of rebuilding geometry each frame
    useFrame((_, delta) => {
        if (!meshRef.current) return;
        // Smoothly animate height via scale
        currentHeight.current += (targetHeight - currentHeight.current) * Math.min(delta * 3, 1);
        // The group is rotated -PI/2 so Z in local = Y in world for extrude depth
        meshRef.current.scale.z = currentHeight.current;
        if (edgeRef.current) edgeRef.current.scale.z = currentHeight.current;
        if (glowRef.current) glowRef.current.scale.z = currentHeight.current;

        // Pulse on hover
        if (isHovered && meshRef.current.material) {
            meshRef.current.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.15;
        }

        // Event glow
        if (glowRef.current) {
            if (isEvent) {
                glowRef.current.visible = true;
                const isNeg = ['drought', 'flood', 'earthquake', 'conflict'].includes(activeEvent?.type);
                glowRef.current.material.color.set(isNeg ? '#ff1744' : '#00c853');
                glowRef.current.material.opacity = 0.3 + Math.sin(Date.now() * 0.008) * 0.2;
            } else {
                glowRef.current.visible = false;
            }
        }
    });

    if (shapes.length === 0) return null;

    const geo = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
    const edgeGeo = new THREE.EdgesGeometry(geo, 15);

    return (
        <group
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerEnter={(e) => { e.stopPropagation(); onHover(); }}
            onPointerLeave={(e) => { e.stopPropagation(); onUnhover(); }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            {/* Main body */}
            <mesh ref={meshRef} geometry={geo} castShadow receiveShadow>
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={isHovered ? 0.3 : 0.1}
                    transparent
                    opacity={state.alive ? (isHovered ? 0.9 : 0.75) : 0.2}
                    roughness={0.5}
                    metalness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Wireframe edges */}
            <lineSegments ref={edgeRef} geometry={edgeGeo}>
                <lineBasicMaterial
                    color={isHovered ? '#ffffff' : color}
                    transparent
                    opacity={isHovered ? 0.6 : 0.25}
                    linewidth={1}
                />
            </lineSegments>

            {/* Event glow outline */}
            <mesh ref={glowRef} geometry={geo} visible={false}>
                <meshBasicMaterial
                    color="#ff1744"
                    transparent
                    opacity={0.3}
                    wireframe
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* State label - positioned at centroid above the extrusion */}
            <Html
                position={[centroid[0], centroid[1], targetHeight + 0.15]}
                center
                distanceFactor={12}
                style={{ pointerEvents: 'none' }}
            >
                <div className="text-center whitespace-nowrap" style={{ pointerEvents: 'none' }}>
                    <div className={`text-[10px] font-bold tracking-wide drop-shadow-lg ${state.alive ? 'text-white' : 'text-gray-500'}`}>
                        {state.name}
                    </div>
                    {state.alive && state.action && (
                        <div className="text-[8px] text-violet-300 font-semibold uppercase tracking-wider mt-0.5">
                            {state.action}
                        </div>
                    )}
                    {!state.alive && (
                        <div className="text-[10px] text-red-400 font-bold">✕ COLLAPSED</div>
                    )}
                </div>
            </Html>
        </group>
    );
}

// ─── Background state (non-simulated, dim) ──────────────────────────
function BgStateMesh({ feature, project }) {
    const shapes = useMemo(() => {
        try {
            return geometryToShapes(feature.geometry, project);
        } catch {
            return [];
        }
    }, [feature, project]);

    if (shapes.length === 0) return null;

    const geo = new THREE.ExtrudeGeometry(shapes, {
        depth: 0.03,
        bevelEnabled: false,
        curveSegments: 3,
    });

    return (
        <group rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={geo}>
                <meshStandardMaterial
                    color="#1e1e3c"
                    transparent
                    opacity={0.4}
                    roughness={0.8}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <lineSegments geometry={new THREE.EdgesGeometry(geo, 15)}>
                <lineBasicMaterial color="#ffffff" transparent opacity={0.05} />
            </lineSegments>
        </group>
    );
}

// ─── Trade Arc (3D quadratic curve) ─────────────────────────────────
function TradeArc({ from, to, trust, isAlliance, time }) {
    const points = useMemo(() => {
        const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
        const dist = Math.sqrt((to[0] - from[0]) ** 2 + (to[1] - from[1]) ** 2);
        const arcHeight = Math.min(dist * 0.5, 1.5);
        const pts = [];
        const segments = 30;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = from[0] + (to[0] - from[0]) * t;
            const z = from[1] + (to[1] - from[1]) * t;
            const y = Math.sin(t * Math.PI) * arcHeight;
            pts.push(new THREE.Vector3(x, y, z));
        }
        return pts;
    }, [from, to]);

    const particleRef = useRef();

    useFrame(() => {
        if (!particleRef.current || points.length === 0) return;
        const t = ((Date.now() * 0.001) % 2) / 2;
        const idx = Math.floor(t * (points.length - 1));
        const pt = points[Math.min(idx, points.length - 1)];
        particleRef.current.position.set(pt.x, pt.y, pt.z);
    });

    return (
        <group>
            <Line
                points={points}
                color={isAlliance ? '#ffd700' : '#a78bfa'}
                lineWidth={isAlliance ? 2.5 : Math.max(1, (trust || 1) / 3)}
                transparent
                opacity={isAlliance ? 0.6 : 0.4}
                dashed={!isAlliance}
                dashSize={0.15}
                gapSize={0.1}
            />
            {/* Animated particle along the arc */}
            <mesh ref={particleRef}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshBasicMaterial
                    color={isAlliance ? '#ffd700' : '#c4b5fd'}
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </group>
    );
}

// ─── Resource Bars (mini floating bars at centroid) ──────────────────
function ResourceBars3D({ centroid, state, height }) {
    if (!state.alive) return null;
    const resources = ['water', 'food', 'energy', 'land'];
    const barWidth = 0.08;
    const barSpacing = 0.12;
    const totalWidth = resources.length * barSpacing;
    const startX = -totalWidth / 2 + barSpacing / 2;

    return (
        <group position={[centroid[0], height + 0.05, centroid[1]]}>
            {resources.map((key, i) => {
                const val = state.resources[key] / 100;
                const maxH = 0.3;
                const h = Math.max(val * maxH, 0.01);
                return (
                    <group key={key} position={[startX + i * barSpacing, 0, 0]}>
                        {/* Background bar */}
                        <mesh position={[0, maxH / 2, 0]}>
                            <boxGeometry args={[barWidth, maxH, barWidth]} />
                            <meshBasicMaterial color="#ffffff" transparent opacity={0.05} />
                        </mesh>
                        {/* Value bar */}
                        <mesh position={[0, h / 2, 0]}>
                            <boxGeometry args={[barWidth * 0.9, h, barWidth * 0.9]} />
                            <meshBasicMaterial
                                color={state.resources[key] < 20 ? '#ff1744' : RESOURCE_COLORS[key]}
                                transparent
                                opacity={0.8}
                            />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
}

// ─── Grid ground ────────────────────────────────────────────────────
function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial
                color="#0a0816"
                transparent
                opacity={0.5}
                roughness={1}
            />
        </mesh>
    );
}

// ─── Grid lines ─────────────────────────────────────────────────────
function GridLines() {
    const lines = useMemo(() => {
        const arr = [];
        const size = 14;
        const step = 1;
        for (let i = -size; i <= size; i += step) {
            arr.push([new THREE.Vector3(i, -0.005, -size), new THREE.Vector3(i, -0.005, size)]);
            arr.push([new THREE.Vector3(-size, -0.005, i), new THREE.Vector3(size, -0.005, i)]);
        }
        return arr;
    }, []);

    return (
        <group>
            {lines.map((pts, i) => (
                <Line key={i} points={pts} color="#ffffff" lineWidth={0.5} transparent opacity={0.03} />
            ))}
        </group>
    );
}

// ─── Hover Tooltip (HTML overlay) ───────────────────────────────────
function HoverTooltip({ state, centroid, height }) {
    if (!state || !state.alive) return null;
    return (
        <Html
            position={[centroid[0], height + 0.6, centroid[1]]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none', zIndex: 50 }}
        >
            <div
                className="px-3.5 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md animate-scale-in"
                style={{
                    background: 'rgba(17,15,29,0.95)',
                    borderColor: 'rgba(139,92,246,0.2)',
                    minWidth: 160,
                    pointerEvents: 'none',
                }}
            >
                <div className="text-xs font-bold text-white mb-0.5">{state.name}</div>
                <div className="text-[10px] text-violet-300/60 mb-2">{state.title}</div>
                <div className="space-y-1.5">
                    {['water', 'food', 'energy', 'land'].map(k => (
                        <div key={k} className="flex items-center gap-1.5">
                            <span className="text-[9px] text-gray-500 w-10 capitalize">{k}</span>
                            <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${state.resources[k]}%`,
                                        backgroundColor: state.resources[k] < 20 ? '#ff1744' : RESOURCE_COLORS[k],
                                        boxShadow: `0 0 6px ${state.resources[k] < 20 ? 'rgba(255,23,68,0.4)' : RESOURCE_COLORS[k] + '40'}`,
                                        transition: 'width 0.5s',
                                    }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-gray-400 w-5 text-right">{Math.round(state.resources[k])}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 pt-2 text-[9px] text-gray-500" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>Pop {state.population}</span>
                    <span>{state.happiness}%</span>
                    <span>GDP {state.gdp}</span>
                </div>
            </div>
        </Html>
    );
}

// ─── Scene Content ──────────────────────────────────────────────────
function SceneContent({ states, trades, alliances, activeEvent, onStateClick, geoData }) {
    const [hovered, setHovered] = useState(null);

    const project = useMemo(() => {
        if (!geoData) return null;
        return createProjection3D(geoData.features);
    }, [geoData]);

    const { simFeatures, bgFeatures, centroids } = useMemo(() => {
        if (!geoData || !project) return { simFeatures: [], bgFeatures: [], centroids: {} };
        const sim = [];
        const bg = [];
        const cents = {};
        geoData.features.forEach(f => {
            if (f.properties.id && f.properties.id !== 'bg') {
                sim.push(f);
                cents[f.properties.id] = getCentroid3D(f.geometry, project);
            } else {
                bg.push(f);
            }
        });
        return { simFeatures: sim, bgFeatures: bg, centroids: cents };
    }, [geoData, project]);

    const stateMap = useMemo(() => {
        const map = {};
        states.forEach(s => (map[s.id] = s));
        return map;
    }, [states]);

    if (!project) return null;

    const hovState = hovered ? stateMap[hovered] : null;
    const hovCentroid = hovered ? centroids[hovered] : null;
    const hovHeight = hovState ? getHealthHeight(hovState) : 0;

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow color="#e8e0ff" />
            <directionalLight position={[-5, 8, -5]} intensity={0.3} color="#a78bfa" />
            <pointLight position={[0, 5, 0]} intensity={0.4} color="#c4b5fd" distance={20} />

            {/* Ground & grid */}
            <Ground />
            <GridLines />

            {/* Background states */}
            {bgFeatures.map((f, i) => (
                <BgStateMesh key={`bg-${i}`} feature={f} project={project} />
            ))}

            {/* Simulation states */}
            {simFeatures.map(f => {
                const state = stateMap[f.properties.id];
                if (!state) return null;
                return (
                    <React.Fragment key={f.properties.id}>
                        <StateMesh
                            feature={f}
                            state={state}
                            project={project}
                            isHovered={hovered === f.properties.id}
                            isEvent={activeEvent?.stateId === f.properties.id}
                            activeEvent={activeEvent}
                            onClick={() => onStateClick?.(f.properties.id)}
                            onHover={() => setHovered(f.properties.id)}
                            onUnhover={() => setHovered(null)}
                        />
                        {/* Resource bars above each state */}
                        {centroids[f.properties.id] && (
                            <ResourceBars3D
                                centroid={centroids[f.properties.id]}
                                state={state}
                                height={getHealthHeight(state)}
                            />
                        )}
                    </React.Fragment>
                );
            })}

            {/* Trade arcs */}
            {trades.map((tr, idx) => {
                const c1 = centroids[tr.from];
                const c2 = centroids[tr.to];
                if (!c1 || !c2) return null;
                const allianceKeys = new Set(
                    (alliances || []).map(a => a.states?.sort().join('_')).filter(Boolean)
                );
                const tradeKey = [tr.from, tr.to].sort().join('_');
                return (
                    <TradeArc
                        key={`trade-${idx}`}
                        from={[c1[0], c1[1]]}
                        to={[c2[0], c2[1]]}
                        trust={tr.trust}
                        isAlliance={allianceKeys.has(tradeKey)}
                        time={idx}
                    />
                );
            })}

            {/* Alliance arcs */}
            {(alliances || []).map((al, idx) => {
                if (!al.states || al.states.length < 2) return null;
                const c1 = centroids[al.states[0]];
                const c2 = centroids[al.states[1]];
                if (!c1 || !c2) return null;
                return (
                    <TradeArc
                        key={`alliance-${idx}`}
                        from={[c1[0], c1[1]]}
                        to={[c2[0], c2[1]]}
                        trust={10}
                        isAlliance={true}
                        time={idx}
                    />
                );
            })}

            {/* Hover tooltip */}
            {hovState && hovCentroid && (
                <HoverTooltip state={hovState} centroid={hovCentroid} height={hovHeight} />
            )}

            {/* Camera controls */}
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={5}
                maxDistance={25}
                maxPolarAngle={Math.PI / 2.2}
                minPolarAngle={0.2}
                autoRotate={false}
                target={[0, 0, 0]}
                dampingFactor={0.1}
                enableDamping={true}
            />

            {/* Fog for depth */}
            <fog attach="fog" args={['#0a0816', 15, 35]} />
        </>
    );
}

// ─── Main 3D Map Component ──────────────────────────────────────────
function IndiaMap3D({ states = [], trades = [], alliances = [], activeEvent, onStateClick }) {
    const [geoData, setGeoData] = useState(null);

    useEffect(() => {
        fetch('/geo/india.json')
            .then(r => r.json())
            .then(data => setGeoData(data))
            .catch(err => console.warn('GeoJSON load failed:', err));
    }, []);

    return (
        <div className="glass-card-glow p-0 h-full flex flex-col overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 z-10 relative">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
                    <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400 inline-block" />
                    3D Map
                </h2>
                <div className="flex items-center gap-3 text-[9px] text-gray-500">
                    <span className="flex items-center gap-1">
                        <span className="w-5 h-[2px] rounded bg-gradient-to-r from-purple-500/80 to-purple-400/30 inline-block" /> trade
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-5 h-[2px] rounded bg-gradient-to-r from-yellow-500/80 to-yellow-400/30 inline-block" /> alliance
                    </span>
                    <span className="text-[8px] text-violet-400/50 ml-1">drag to rotate • scroll to zoom</span>
                </div>
            </div>

            {/* 3D Canvas */}
            <div className="flex-1 relative min-h-0">
                <Canvas
                    camera={{ position: [0, 10, 10], fov: 45 }}
                    dpr={[1, 2]}
                    shadows
                    gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                    style={{
                        background: 'radial-gradient(ellipse at 50% 40%, rgba(18,14,30,0.95) 0%, rgba(8,7,14,0.98) 100%)',
                        borderRadius: '0 0 1rem 1rem',
                    }}
                    onCreated={({ gl }) => {
                        gl.setClearColor('#0a0816', 1);
                        gl.toneMapping = THREE.ACESFilmicToneMapping;
                        gl.toneMappingExposure = 1.2;
                    }}
                >
                    {geoData && (
                        <SceneContent
                            states={states}
                            trades={trades}
                            alliances={alliances}
                            activeEvent={activeEvent}
                            onStateClick={onStateClick}
                            geoData={geoData}
                        />
                    )}
                </Canvas>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 px-5 py-2.5 border-t border-white/[0.04] text-[10px] text-gray-500 uppercase tracking-wider z-10 relative">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/40" /> Healthy
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/40" /> At Risk
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block shadow-sm shadow-orange-500/40" /> Critical
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/40" /> Danger
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" /> Dead
                </span>
                <span className="text-[9px] text-violet-400/40">| Height = resources</span>
            </div>
        </div>
    );
}

export default IndiaMap3D;
