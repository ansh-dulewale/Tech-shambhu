import React, { useRef, useEffect, useCallback } from 'react';

const HEX_RADIUS = 38;

// Health color based on average resources
function getHealthColor(state) {
  if (!state.alive) return '#424242';
  const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
  if (avg > 60) return '#00c853';
  if (avg > 40) return '#ffab00';
  if (avg > 20) return '#ff6d00';
  return '#ff1744';
}

function getHealthGlow(state) {
  if (!state.alive) return 'rgba(66,66,66,0.2)';
  const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
  if (avg > 60) return 'rgba(0,200,83,0.3)';
  if (avg > 40) return 'rgba(255,171,0,0.3)';
  if (avg > 20) return 'rgba(255,109,0,0.3)';
  return 'rgba(255,23,68,0.3)';
}

// Draw a hexagon
function drawHex(ctx, x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// Check if point is inside hexagon
function isInsideHex(px, py, hx, hy, radius) {
  const dx = Math.abs(px - hx);
  const dy = Math.abs(py - hy);
  if (dx > radius || dy > radius) return false;
  return (dx * dx + dy * dy) <= radius * radius * 1.2;
}

function IndiaMap({ states = [], trades = [], alliances = [], activeEvent, onStateClick }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(0);

  // State positions (approximate India geography)
  const positions = {
    punjab: { x: 160, y: 75 },
    rajasthan: { x: 120, y: 175 },
    uttarpradesh: { x: 250, y: 135 },
    gujarat: { x: 90, y: 270 },
    jharkhand: { x: 310, y: 235 },
    maharashtra: { x: 170, y: 340 },
    tamilnadu: { x: 225, y: 460 },
    kerala: { x: 165, y: 480 },
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = 420 * dpr;
    canvas.height = 560 * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = '420px';
    canvas.style.height = '560px';

    // Clear
    ctx.clearRect(0, 0, 420, 560);

    // Draw background grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let x = 0; x < 420; x += 20) {
      for (let y = 0; y < 560; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw trade lines
    if (trades && trades.length > 0) {
      trades.forEach(trade => {
        const fromPos = positions[trade.from];
        const toPos = positions[trade.to];
        if (!fromPos || !toPos) return;

        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);

        // Curved line
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2 - 30;
        ctx.quadraticCurveTo(midX, midY, toPos.x, toPos.y);

        ctx.strokeStyle = 'rgba(124, 77, 255, 0.4)';
        ctx.lineWidth = Math.max(1, (trade.trust || 1) / 3);
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -(animFrameRef.current * 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Draw alliance lines (thicker, golden)
    if (alliances && alliances.length > 0) {
      alliances.forEach(alliance => {
        if (alliance.states && alliance.states.length >= 2) {
          const pos1 = positions[alliance.states[0]];
          const pos2 = positions[alliance.states[1]];
          if (!pos1 || !pos2) return;

          ctx.beginPath();
          ctx.moveTo(pos1.x, pos1.y);
          const midX = (pos1.x + pos2.x) / 2;
          const midY = (pos1.y + pos2.y) / 2 - 25;
          ctx.quadraticCurveTo(midX, midY, pos2.x, pos2.y);
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });
    }

    // Draw states
    states.forEach(state => {
      const pos = positions[state.id];
      if (!pos) return;

      const healthColor = getHealthColor(state);
      const glowColor = getHealthGlow(state);

      // Outer glow
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 20;

      // Hex fill
      drawHex(ctx, pos.x, pos.y, HEX_RADIUS);
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, HEX_RADIUS);
      gradient.addColorStop(0, healthColor + '40');
      gradient.addColorStop(1, healthColor + '15');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Hex border
      drawHex(ctx, pos.x, pos.y, HEX_RADIUS);
      ctx.strokeStyle = healthColor + '80';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Event pulse animation
      if (activeEvent && activeEvent.stateId === state.id) {
        const pulseSize = HEX_RADIUS + 8 + Math.sin(animFrameRef.current * 0.1) * 5;
        drawHex(ctx, pos.x, pos.y, pulseSize);
        ctx.strokeStyle = activeEvent.type === 'drought' || activeEvent.type === 'flood'
          ? 'rgba(255, 23, 68, 0.5)'
          : 'rgba(0, 200, 83, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // State name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(state.name, pos.x, pos.y - 5);

      // Action badge
      if (state.action) {
        ctx.fillStyle = 'rgba(186, 146, 255, 0.9)';
        ctx.font = '600 8px Inter, system-ui';
        ctx.fillText(state.action, pos.x, pos.y + 10);
      }

      // Population
      ctx.fillStyle = '#757575';
      ctx.font = '7px Inter, system-ui';
      ctx.fillText(`P: ${state.population}`, pos.x, pos.y + 22);

      // Collapsed X
      if (!state.alive) {
        ctx.fillStyle = 'rgba(255, 23, 68, 0.8)';
        ctx.font = 'bold 28px system-ui';
        ctx.fillText('✕', pos.x, pos.y + 8);
      }
    });

    // Title
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.font = '600 11px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText('INDIA', 210, 540);

    animFrameRef.current++;
  }, [states, trades, alliances, activeEvent]);

  useEffect(() => {
    let rafId;
    const animate = () => {
      draw();
      rafId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(rafId);
  }, [draw]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 420 / rect.width;
    const scaleY = 560 / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    for (const state of states) {
      const pos = positions[state.id];
      if (pos && isInsideHex(px, py, pos.x, pos.y, HEX_RADIUS)) {
        onStateClick && onStateClick(state.id);
        break;
      }
    }
  };

  return (
    <div className="glass-card p-4">
      <h2 className="text-base font-semibold mb-3 text-white uppercase tracking-wider">India Resource Map</h2>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="cursor-pointer rounded-xl"
          style={{ background: 'rgba(10, 14, 39, 0.5)' }}
        />
      </div>
      <div className="flex justify-center gap-5 mt-3 text-[11px] text-gray-400 uppercase tracking-wider">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Healthy</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> At Risk</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span> Critical</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Danger</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600 inline-block"></span> Collapsed</span>
      </div>
    </div>
  );
}

export default IndiaMap;
