import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';

const CANVAS_W = 420;
const CANVAS_H = 560;

const RESOURCE_COLORS = {
  water: '#00d4ff', food: '#00e676', energy: '#ffab00', land: '#8d6e63',
};

function getHealthColor(state) {
  if (!state.alive) return '#424242';
  const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
  if (avg > 60) return '#00c853';
  if (avg > 40) return '#ffab00';
  if (avg > 20) return '#ff6d00';
  return '#ff1744';
}

// ─── Geo projection (manual Mercator fit to canvas) ─────────────────
function createProjection(features) {
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

  const pad = 25;
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;
  const scaleX = (CANVAS_W - pad * 2) / lonSpan;
  const scaleY = (CANVAS_H - pad * 2) / latSpan;
  const scale = Math.min(scaleX, scaleY);

  const cx = (minLon + maxLon) / 2;
  const cy = (minLat + maxLat) / 2;
  const ox = CANVAS_W / 2;
  const oy = CANVAS_H / 2;

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
  return n ? [sx / n, sy / n] : [CANVAS_W / 2, CANVAS_H / 2];
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
    this.x = Math.random() * CANVAS_W;
    this.y = Math.random() * CANVAS_H;
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
    ctx.fillStyle = `rgba(124,77,255,${a})`; ctx.fill();
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

  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);

  // Load GeoJSON
  useEffect(() => {
    fetch('/geo/india.json')
      .then(r => r.json())
      .then(data => setGeoData(data))
      .catch(err => console.warn('GeoJSON load failed:', err));
  }, []);

  // Build projection once
  const project = useMemo(() => {
    if (!geoData) return null;
    return createProjection(geoData.features);
  }, [geoData]);

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

    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = CANVAS_W + 'px';
    canvas.style.height = CANVAS_H + 'px';

    const t = animRef.current;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // ── Grid dots ──
    ctx.fillStyle = 'rgba(255,255,255,0.012)';
    for (let gx = 0; gx < CANVAS_W; gx += 28) {
      for (let gy = 0; gy < CANVAS_H; gy += 28) {
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
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
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
        ctx.strokeStyle = 'rgba(124,77,255,0.35)';
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
      const cent = centroids[id] || [CANVAS_W / 2, CANVAS_H / 2];
      const grad = ctx.createRadialGradient(cent[0], cent[1], 0, cent[0], cent[1], 80);
      grad.addColorStop(0, (state.alive ? color : '#333') + (isHov ? '70' : '45'));
      grad.addColorStop(1, (state.alive ? color : '#222') + (isHov ? '30' : '15'));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Border
      drawGeometry(ctx, feature.geometry, project);
      ctx.strokeStyle = color + (isHov ? 'dd' : '60');
      ctx.lineWidth = isHov ? 2 : 1;
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
        // Nudge labels for geographically close states
        const labelOffsets = {
          kerala: { dx: -25, dy: 15 },
          tamilnadu: { dx: 25, dy: -10 },
        };
        const off = labelOffsets[id] || { dx: 0, dy: 0 };
        const lx = cent[0] + off.dx;
        const ly = cent[1] + off.dy;

        ctx.fillStyle = state.alive ? '#fff' : '#666';
        ctx.font = `${isHov ? 'bold 10px' : '600 8px'} Inter, system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.name, lx, ly - 8);

        // Action label
        if (state.alive && state.action) {
          ctx.fillStyle = 'rgba(186,146,255,0.85)';
          ctx.font = '600 6px Inter, system-ui';
          ctx.fillText(state.action, lx, ly + 3);
        }

        // Collapsed marker
        if (!state.alive) {
          ctx.fillStyle = 'rgba(255,23,68,0.7)';
          ctx.font = 'bold 22px system-ui';
          ctx.fillText('✕', lx, ly + 2);
        }

        // Mini resource bars under name
        if (state.alive) {
          const barW = 24, barH = 2, barGap = 3;
          const barX = lx - barW / 2;
          const barY = ly + 8;
          ['water', 'food', 'energy', 'land'].forEach((key, i) => {
            const val = state.resources[key];
            const by = barY + i * barGap;
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(barX, by, barW, barH);
            ctx.fillStyle = val < 20 ? '#ff1744' : RESOURCE_COLORS[key];
            ctx.globalAlpha = isHov ? 0.85 : 0.55;
            ctx.fillRect(barX, by, Math.max(1, (val / 100) * barW), barH);
            ctx.globalAlpha = 1;
          });
        }
      }
    });

    // Watermark
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.font = '600 11px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('I N D I A', CANVAS_W / 2, CANVAS_H - 12);

    animRef.current++;
  }, [states, trades, alliances, activeEvent, project, simFeatures, bgFeatures, centroids]);

  // Animation loop
  useEffect(() => {
    let raf;
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  // Click
  const handleClick = (e) => {
    if (!project || !simFeatures.length) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = CANVAS_W / rect.width, sy = CANVAS_H / rect.height;
    const px = (e.clientX - rect.left) * sx, py = (e.clientY - rect.top) * sy;
    for (const f of simFeatures) {
      if (pointInFeature(px, py, f, project)) {
        onStateClick?.(f.properties.id);
        break;
      }
    }
  };

  // Hover
  const handleMove = (e) => {
    if (!project || !simFeatures.length) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = CANVAS_W / rect.width, sy = CANVAS_H / rect.height;
    const px = (e.clientX - rect.left) * sx, py = (e.clientY - rect.top) * sy;
    let found = null;
    for (const f of simFeatures) {
      if (pointInFeature(px, py, f, project)) { found = f.properties.id; break; }
    }
    if (found !== hovered) setHovered(found);
  };

  const hovState = hovered ? states.find(s => s.id === hovered) : null;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Map</h2>
        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
          <span className="w-5 h-[2px] rounded bg-purple-500/50 inline-block" />
          <span>trade</span>
          <span className="w-5 h-[2px] rounded bg-yellow-500/50 inline-block ml-2" />
          <span>alliance</span>
        </div>
      </div>

      <div className="flex justify-center relative">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseMove={handleMove}
          onMouseLeave={() => setHovered(null)}
          className="cursor-pointer rounded-xl"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(15,21,53,0.9) 0%, rgba(7,11,26,0.95) 100%)' }}
        />

        {/* Tooltip */}
        {hovState && hovState.alive && centroids[hovered] && (
          <div
            className="absolute pointer-events-none px-3 py-2 rounded-lg bg-[#0d1127]/95 border border-white/10 shadow-xl backdrop-blur-sm z-10"
            style={{
              left: Math.min(centroids[hovered][0] + 30, CANVAS_W - 140),
              top: Math.max(centroids[hovered][1] - 40, 10),
              minWidth: 145,
            }}
          >
            <div className="text-xs font-bold text-white mb-0.5">{hovState.name}</div>
            <div className="text-[10px] text-gray-400 mb-1.5">{hovState.title}</div>
            <div className="space-y-1">
              {['water', 'food', 'energy', 'land'].map(k => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="text-[9px] text-gray-500 w-10 capitalize">{k}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${hovState.resources[k]}%`,
                        backgroundColor: hovState.resources[k] < 20 ? '#ff1744' : RESOURCE_COLORS[k],
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-gray-400 w-5 text-right">{Math.round(hovState.resources[k])}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5 pt-1.5 border-t border-white/5 text-[9px] text-gray-500">
              <span>👥 {hovState.population}</span>
              <span>😊 {hovState.happiness}%</span>
              <span>💰 {hovState.gdp}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500 uppercase tracking-wider">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Healthy</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" /> At Risk</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" /> Critical</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Danger</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-600 inline-block" /> Dead</span>
      </div>
    </div>
  );
}

export default IndiaMap;
