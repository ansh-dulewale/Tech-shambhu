import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';

const RESOURCE_COLORS = {
  water: '#67e8f9', food: '#6ee7b7', energy: '#fcd34d', land: '#c4b5fd',
};

function getHealthColor(state) {
  if (!state.alive) return '#334155';
  const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
  if (avg > 60) return '#10b981';
  if (avg > 40) return '#f59e0b';
  if (avg > 20) return '#f97316';
  return '#f43f5e';
}

// ─── Geo projection (manual Mercator fit to canvas) ─────────────────
function createProjection(features, canvasW, canvasH) {
  // Compute bounding box of ALL features
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

  const pad = 40;
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;
  const scaleX = (canvasW - pad * 2) / lonSpan;
  const scaleY = (canvasH - pad * 2) / latSpan;
  const scale = Math.min(scaleX, scaleY);

  const cx = (minLon + maxLon) / 2;
  const cy = (minLat + maxLat) / 2;
  const ox = canvasW / 2;
  const oy = canvasH / 2;

  return function project(lon, lat) {
    return [
      ox + (lon - cx) * scale,
      oy - (lat - cy) * scale, // invert Y
    ];
  };
}

// ─── Draw a polygon ring on canvas ──────────────────────────────────
function drawRing(ctx, ring, project) {
  ring.forEach((coord, i) => {
    const [x, y] = project(coord[0], coord[1]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawGeometry(ctx, geometry, project) {
  ctx.beginPath();
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => drawRing(ctx, ring, project));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(poly =>
      poly.forEach(ring => drawRing(ctx, ring, project))
    );
  }
}

// ─── Compute centroid of a feature ──────────────────────────────────
function getCentroid(geometry, project) {
  let sx = 0, sy = 0, n = 0;
  function walk(coords) {
    if (typeof coords[0] === 'number') {
      const [px, py] = project(coords[0], coords[1]);
      sx += px; sy += py; n++;
      return;
    }
    coords.forEach(c => walk(c));
  }
  walk(geometry.coordinates);
  return n ? [sx / n, sy / n] : [400, 300];
}

// ─── Point-in-polygon test (ray casting) ────────────────────────────
function pointInFeature(px, py, feature, project) {
  function insideRing(ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = project(ring[i][0], ring[i][1]);
      const [xj, yj] = project(ring[j][0], ring[j][1]);
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }
  const { geometry } = feature;
  if (geometry.type === 'Polygon') {
    return insideRing(geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(poly => insideRing(poly[0]));
  }
  return false;
}

// ─── Particle system ────────────────────────────────────────────────
class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * 1200;
    this.y = Math.random() * 900;
    this.vx = (Math.random() - 0.5) * 0.2;
    this.vy = -0.15 - Math.random() * 0.2;
    this.life = Math.random() * 120 + 60;
    this.maxLife = this.life;
    this.size = Math.random() * 1.2 + 0.3;
  }
  update() { this.x += this.vx; this.y += this.vy; this.life--; if (this.life <= 0) this.reset(); }
  draw(ctx) {
    const a = (this.life / this.maxLife) * 0.12;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(167,139,250,${a})`; ctx.fill();
  }
}

// ─── Main Component ─────────────────────────────────────────────────
function IndiaMap({ states = [], trades = [], alliances = [], activeEvent, onStateClick }) {
  const canvasRef = useRef(null);
  const animRef = useRef(0);
  const particlesRef = useRef(Array.from({ length: 25 }, () => new Particle()));
  const [hovered, setHovered] = useState(null);
  const hoveredRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const containerRef = useRef(null);
  const [displayW, setDisplayW] = useState(800);
  const [displayH, setDisplayH] = useState(600);
  const canvasDimsRef = useRef({ w: 800, h: 600 });

  // ── Zoom & Pan state ──
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetStart = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = panOffset; }, [panOffset]);
  useEffect(() => { canvasDimsRef.current = { w: displayW, h: displayH }; }, [displayW, displayH]);

  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);

  // Convert screen coords to canvas coords accounting for zoom/pan
  const screenToCanvas = useCallback((clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const cw = canvasDimsRef.current.w;
    const ch = canvasDimsRef.current.h;
    const sx = cw / rect.width;
    const sy = ch / rect.height;
    const screenX = (clientX - rect.left) * sx;
    const screenY = (clientY - rect.top) * sy;
    const z = zoomRef.current;
    const p = panRef.current;
    // Reverse the transform: canvas draws with translate(panX + W/2, panY + H/2) then scale(zoom) then translate(-W/2, -H/2)
    const cx = (screenX - p.x - cw / 2) / z + cw / 2;
    const cy = (screenY - p.y - ch / 2) / z + ch / 2;
    return { x: cx, y: cy };
  }, []);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.25, 4)), []);
  const handleZoomOut = useCallback(() => {
    setZoom(z => {
      const next = Math.max(z - 0.25, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);
  const handleZoomReset = useCallback(() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }, []);

  // Load GeoJSON
  useEffect(() => {
    fetch('/geo/india.json')
      .then(r => r.json())
      .then(data => setGeoData(data))
      .catch(err => console.warn('GeoJSON load failed:', err));
  }, []);

  // Responsive canvas sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDisplayW(Math.floor(width));
      setDisplayH(Math.floor(height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build projection — recompute when container size changes
  const project = useMemo(() => {
    if (!geoData || !displayW || !displayH) return null;
    return createProjection(geoData.features, displayW, displayH);
  }, [geoData, displayW, displayH]);

  // Separate simulation vs background features
  const { simFeatures, bgFeatures, centroids } = useMemo(() => {
    if (!geoData || !project) return { simFeatures: [], bgFeatures: [], centroids: {} };
    const sim = [];
    const bg = [];
    const cents = {};
    geoData.features.forEach(f => {
      if (f.properties.id && f.properties.id !== 'bg') {
        sim.push(f);
        cents[f.properties.id] = getCentroid(f.geometry, project);
      } else {
        bg.push(f);
      }
    });
    return { simFeatures: sim, bgFeatures: bg, centroids: cents };
  }, [geoData, project]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cw = displayW;
    const ch = displayH;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.scale(dpr, dpr);

    const t = animRef.current;
    // Solid dark navy background
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, cw, ch);

    // Apply zoom & pan transform
    const z = zoomRef.current;
    const p = panRef.current;
    ctx.save();
    ctx.translate(p.x + cw / 2, p.y + ch / 2);
    ctx.scale(z, z);
    ctx.translate(-cw / 2, -ch / 2);

    // ── Grid dots ──
    ctx.fillStyle = 'rgba(255,255,255,0.012)';
    for (let gx = 0; gx < cw; gx += 28) {
      for (let gy = 0; gy < ch; gy += 28) {
        ctx.beginPath(); ctx.arc(gx, gy, 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ── Particles ──
    particlesRef.current.forEach(p => { p.update(); p.draw(ctx); });

    // ── Background states (dim outlines) ──
    bgFeatures.forEach(f => {
      drawGeometry(ctx, f.geometry, project);
      ctx.fillStyle = 'rgba(30,30,60,0.3)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Build state lookup
    const stateMap = {};
    states.forEach(s => (stateMap[s.id] = s));

    // ── Alliance arcs ──
    if (alliances?.length) {
      alliances.forEach(al => {
        if (!al.states || al.states.length < 2) return;
        const c1 = centroids[al.states[0]], c2 = centroids[al.states[1]];
        if (!c1 || !c2) return;
        ctx.save();
        ctx.shadowColor = 'rgba(255,215,0,0.4)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(c1[0], c1[1]);
        ctx.quadraticCurveTo((c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2 - 30, c2[0], c2[1]);
        ctx.strokeStyle = `rgba(255,215,0,${0.35 + Math.sin(t * 0.04) * 0.15})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      });
    }

    // ── Trade arcs ──
    if (trades?.length) {
      trades.forEach(tr => {
        const c1 = centroids[tr.from], c2 = centroids[tr.to];
        if (!c1 || !c2) return;
        ctx.beginPath();
        ctx.moveTo(c1[0], c1[1]);
        ctx.quadraticCurveTo((c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2 - 20, c2[0], c2[1]);
        ctx.strokeStyle = 'rgba(167,139,250,0.35)';
        ctx.lineWidth = Math.max(1, (tr.trust || 1) / 3);
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -(t * 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // ── Simulation states (colored shapes) ──
    simFeatures.forEach(feature => {
      const id = feature.properties.id;
      const state = stateMap[id];
      if (!state) return;

      const color = getHealthColor(state);
      const isHov = hoveredRef.current === id;
      const isEvent = activeEvent?.stateId === id;

      // Fill
      ctx.save();
      if (state.alive) {
        ctx.shadowColor = color;
        ctx.shadowBlur = isHov ? 20 : 10;
      }
      drawGeometry(ctx, feature.geometry, project);
      const cent = centroids[id] || [cw / 2, ch / 2];
      const grad = ctx.createRadialGradient(cent[0], cent[1], 0, cent[0], cent[1], 80);
      grad.addColorStop(0, (state.alive ? color : '#333') + (isHov ? '70' : '45'));
      grad.addColorStop(1, (state.alive ? color : '#222') + (isHov ? '30' : '15'));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Border — white outline
      drawGeometry(ctx, feature.geometry, project);
      ctx.strokeStyle = isHov ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = isHov ? 2.5 : 1.5;
      ctx.stroke();

      // Hover highlight
      if (isHov) {
        drawGeometry(ctx, feature.geometry, project);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Event pulse
      if (isEvent) {
        drawGeometry(ctx, feature.geometry, project);
        const isNeg = ['drought', 'flood', 'earthquake', 'conflict'].includes(activeEvent.type);
        ctx.strokeStyle = isNeg
          ? `rgba(255,23,68,${0.4 + Math.sin(t * 0.1) * 0.3})`
          : `rgba(0,200,83,${0.4 + Math.sin(t * 0.1) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // State name — with offsets for overlapping labels
      if (cent) {
        // Nudge labels so they don't pile on each other
        const labelOffsets = {
          punjab:       { dx: 0,   dy: -20 },
          rajasthan:    { dx: -30, dy: 0 },
          uttarpradesh: { dx: 20,  dy: -15 },
          gujarat:      { dx: -35, dy: 10 },
          jharkhand:    { dx: 35,  dy: -5 },
          maharashtra:  { dx: -20, dy: 15 },
          tamilnadu:    { dx: 20,  dy: -15 },
          kerala:       { dx: -30, dy: 15 },
        };
        const off = labelOffsets[id] || { dx: 0, dy: 0 };
        const lx = cent[0] + off.dx;
        const ly = cent[1] + off.dy;

        // Label background pill for readability
        const labelText = state.name;
        const fontSize = isHov ? 14 : 12;
        ctx.font = `bold ${fontSize}px Inter, system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textW = ctx.measureText(labelText).width;
        const pillH = fontSize + 6;
        const pillW = textW + 12;
        ctx.fillStyle = 'rgba(8,7,14,0.75)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(lx - pillW / 2, ly - 12 - pillH / 2, pillW, pillH, 4);
        } else {
          ctx.rect(lx - pillW / 2, ly - 12 - pillH / 2, pillW, pillH);
        }
        ctx.fill();

        ctx.fillStyle = state.alive ? '#fff' : '#666';
        ctx.fillText(labelText, lx, ly - 12);

        // Action label (smaller, below name)
        if (state.alive && state.action) {
          ctx.fillStyle = 'rgba(196,181,253,0.8)';
          ctx.font = '600 10px Inter, system-ui';
          ctx.fillText(state.action, lx, ly + 2);
        }

        // Collapsed marker
        if (!state.alive) {
          ctx.fillStyle = 'rgba(255,23,68,0.7)';
          ctx.font = 'bold 22px system-ui';
          ctx.fillText('✕', lx, ly + 2);
        }

        // Mini resource bars — only show on hover to reduce clutter
        if (state.alive && isHov) {
          const barW = 36, barH = 3, barGap = 5;
          const barX = lx - barW / 2;
          const barY = ly + 10;
          ['water', 'food', 'energy', 'land'].forEach((key, i) => {
            const val = state.resources[key];
            const by = barY + i * barGap;
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(barX, by, barW, barH);
            ctx.fillStyle = val < 20 ? '#ff1744' : RESOURCE_COLORS[key];
            ctx.globalAlpha = 0.85;
            ctx.fillRect(barX, by, Math.max(1, (val / 100) * barW), barH);
            ctx.globalAlpha = 1;
          });
        }
      }
    });

    // Watermark
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.font = '600 14px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('I N D I A', cw / 2, ch - 12);

    ctx.restore(); // undo zoom/pan transform
    animRef.current++;
  }, [states, trades, alliances, activeEvent, project, simFeatures, bgFeatures, centroids, displayW, displayH]);

  // Animation loop
  useEffect(() => {
    let raf;
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  // Wheel zoom on canvas
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(z => {
      const next = Math.min(Math.max(z + delta, 1), 4);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Attach wheel listener (passive: false needed for preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Pan start
  const handleMouseDown = useCallback((e) => {
    if (zoomRef.current <= 1) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOffsetStart.current = { ...panRef.current };
  }, []);

  // Pan move
  const handlePanMove = useCallback((e) => {
    if (!isPanning.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = canvasDimsRef.current.w / rect.width;
    const sy = canvasDimsRef.current.h / rect.height;
    const dx = (e.clientX - panStart.current.x) * sx;
    const dy = (e.clientY - panStart.current.y) * sy;
    setPanOffset({
      x: panOffsetStart.current.x + dx,
      y: panOffsetStart.current.y + dy,
    });
  }, []);

  // Pan end
  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Click
  const handleClick = (e) => {
    if (isPanning.current) return;
    if (!project || !simFeatures.length) return;
    const pt = screenToCanvas(e.clientX, e.clientY);
    if (!pt) return;
    for (const f of simFeatures) {
      if (pointInFeature(pt.x, pt.y, f, project)) {
        onStateClick?.(f.properties.id);
        break;
      }
    }
  };

  // Hover
  const handleMove = (e) => {
    if (isPanning.current) { handlePanMove(e); return; }
    if (!project || !simFeatures.length) return;
    const pt = screenToCanvas(e.clientX, e.clientY);
    if (!pt) return;
    let found = null;
    for (const f of simFeatures) {
      if (pointInFeature(pt.x, pt.y, f, project)) { found = f.properties.id; break; }
    }
    if (found !== hovered) setHovered(found);
  };

  const hovState = hovered ? states.find(s => s.id === hovered) : null;

  return (
    <div className="glass-card-glow p-3 h-full flex flex-col" style={{ background: '#0a0a1e' }}>
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="text-[15px] font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
          <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400 inline-block" />
          Map
        </h2>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-5 h-[2px] rounded bg-gradient-to-r from-purple-500/80 to-purple-400/30 inline-block" /> trade</span>
          <span className="flex items-center gap-1.5"><span className="w-5 h-[2px] rounded bg-gradient-to-r from-yellow-500/80 to-yellow-400/30 inline-block" /> alliance</span>
        </div>
      </div>

      <div ref={containerRef} className="flex justify-center items-center relative flex-1 min-h-0 overflow-hidden" style={{ background: '#0a0a1e' }}>
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setHovered(null); isPanning.current = false; }}
          className={`block ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
          style={{ width: displayW, height: displayH, background: '#0a0a1e' }}
        />

        {/* Zoom controls overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.15] transition-all flex items-center justify-center text-sm font-bold backdrop-blur-sm"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.15] transition-all flex items-center justify-center text-sm font-bold backdrop-blur-sm"
            title="Zoom out"
          >
            &minus;
          </button>
          {zoom > 1 && (
            <button
              onClick={handleZoomReset}
              className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.15] transition-all flex items-center justify-center backdrop-blur-sm"
              title="Reset zoom"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          )}
          {zoom > 1 && (
            <div className="text-[10px] text-center text-white/40 font-mono tabular-nums mt-0.5">
              {Math.round(zoom * 100)}%
            </div>
          )}
        </div>

        {/* Tooltip */}
        {hovState && hovState.alive && centroids[hovered] && (() => {
          const rawX = centroids[hovered][0];
          const rawY = centroids[hovered][1];
          const tipX = (rawX - displayW / 2) * zoom + displayW / 2 + panOffset.x;
          const tipY = (rawY - displayH / 2) * zoom + displayH / 2 + panOffset.y;
          return (
            <div
              className="absolute pointer-events-none px-3.5 py-2.5 rounded-xl bg-[#110f1d]/95 border border-violet-500/15 shadow-2xl backdrop-blur-md z-10 animate-scale-in"
              style={{
                left: Math.min(tipX + 30, displayW - 160),
                top: Math.max(tipY - 40, 10),
                minWidth: 155,
              }}
            >
              <div className="text-sm font-bold text-white mb-0.5">{hovState.name}</div>
              <div className="text-[11px] text-violet-300/60 mb-2">{hovState.title}</div>
              <div className="space-y-1.5">
                {['water', 'food', 'energy', 'land'].map(k => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 w-12 capitalize">{k}</span>
                    <div className="flex-1 h-[5px] rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${hovState.resources[k]}%`,
                          backgroundColor: hovState.resources[k] < 20 ? '#ff1744' : RESOURCE_COLORS[k],
                          boxShadow: `0 0 6px ${hovState.resources[k] < 20 ? 'rgba(255,23,68,0.4)' : RESOURCE_COLORS[k] + '40'}`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 w-6 text-right tabular-nums">{Math.round(hovState.resources[k])}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-500">
                <span>Pop {hovState.population}</span>
                <span>{hovState.happiness}%</span>
                <span>GDP {hovState.gdp}</span>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="flex justify-center gap-4 mt-1.5 pt-1.5 border-t border-white/[0.04] text-[11px] text-gray-500 uppercase tracking-wider">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/40" /> Healthy</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/40" /> At Risk</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-sm shadow-orange-500/40" /> Critical</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/40" /> Danger</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-600 inline-block" /> Dead</span>
      </div>
    </div>
  );
}

export default IndiaMap;
