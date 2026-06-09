import { useEffect, useRef } from "react";
import L from "leaflet";

// Interfaz tipo radar: centrada SIEMPRE en la base, con el MAPA REAL de calles
// (sin nombres) de fondo. Los drones/zonas se proyectan con la MISMA proyección
// del mapa Leaflet, así quedan perfectamente alineados con las calles reales.
// El alcance (zoom) se ajusta según dónde estén las zonas asignadas.

const M_LAT = 111320;
const mLon = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

export default function Radar({ snapshot }) {
  const wrapRef = useRef(null);
  const mapDivRef = useRef(null);
  const canvasRef = useRef(null);
  const snapRef = useRef(snapshot);
  snapRef.current = snapshot;
  const sweep = useRef(0);
  const lmapRef = useRef(null);
  const lastView = useRef({ lat: null, lon: null, zoom: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;

    const lmap = L.map(mapDivRef.current, {
      zoomControl: false, attributionControl: false,
      dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
      boxZoom: false, keyboard: false, touchZoom: false,
      fadeAnimation: false, zoomAnimation: false, inertia: false,
    }).setView([10.344, -67.041], 13);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
      { maxZoom: 19, opacity: 0.95 }
    ).addTo(lmap);
    lmapRef.current = lmap;

    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect();
      if (!r.width || !r.height) return;
      canvas.width = r.width;
      canvas.height = r.height;
      lmap.invalidateSize(false);
      lastView.current = { lat: null, lon: null, zoom: null }; // fuerza re-centrado
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrapRef.current);
    resize();
    setTimeout(resize, 60);
    setTimeout(resize, 250);
    window.addEventListener("resize", resize);

    function draw() {
      const snap = snapRef.current;
      const W = canvas.width, H = canvas.height;
      const R = Math.min(W, H) / 2 - 34;
      ctx.clearRect(0, 0, W, H);

      if (!snap || !snap.base) { raf = requestAnimationFrame(draw); return; }
      const base = snap.base;

      // --- alcance (m) según ZONAS (+ jammers + drones) ---
      let maxd = 600;
      snap.drones.forEach((d) => {
        if (d.status === "perdido") return;
        maxd = Math.max(maxd, Math.hypot((d.lon - base.lon) * mLon(base.lat), (d.lat - base.lat) * M_LAT));
      });
      snap.swarms.forEach((s) => {
        if (!s.zona) return;
        maxd = Math.max(maxd, Math.hypot((s.zona.lon - base.lon) * mLon(base.lat), (s.zona.lat - base.lat) * M_LAT) + s.zona.radio_m);
      });
      snap.jammers.forEach((j) => {
        maxd = Math.max(maxd, Math.hypot((j.lon - base.lon) * mLon(base.lat), (j.lat - base.lat) * M_LAT) + j.radio_m);
      });
      const alcance = maxd * 1.15;

      // zoom (entero) para que el alcance quepa en R px; centrado en la base
      let zoom = Math.log2((156543.03392 * Math.cos((base.lat * Math.PI) / 180) * R) / alcance);
      zoom = Math.max(3, Math.min(18, Math.floor(zoom)));
      const lv = lastView.current;
      if (lv.lat !== base.lat || lv.lon !== base.lon || lv.zoom !== zoom) {
        lmap.setView([base.lat, base.lon], zoom, { animate: false });
        lastView.current = { lat: base.lat, lon: base.lon, zoom };
      }

      // proyección REAL del mapa: punto en pantalla de cada lat/lon
      const proj = (lat, lon) => lmap.latLngToContainerPoint([lat, lon]);
      const c = proj(base.lat, base.lon);                 // centro = base
      const cN = proj(base.lat + 1000 / M_LAT, base.lon);
      const mpp = 1000 / (Math.hypot(cN.x - c.x, cN.y - c.y) || 1); // metros por píxel real

      // tinte verde sutil sobre el mapa (las calles quedan visibles)
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(W, H) / 1.4);
      grad.addColorStop(0, "rgba(10, 40, 28, 0.1)");
      grad.addColorStop(0.6, "rgba(6, 28, 18, 0.26)");
      grad.addColorStop(1, "rgba(2, 14, 9, 0.55)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.font = "10px monospace";

      // anillos de alcance (a distancias reales) + etiquetas
      ctx.strokeStyle = "rgba(52,211,153,0.35)";
      ctx.fillStyle = "rgba(110,231,183,0.8)";
      for (let i = 1; i <= 4; i++) {
        const rr = (R * i) / 4;
        ctx.beginPath(); ctx.arc(c.x, c.y, rr, 0, 2 * Math.PI); ctx.stroke();
        const m = rr * mpp;
        ctx.fillText(m >= 1000 ? (m / 1000).toFixed(1) + " km" : Math.round(m) + " m", c.x + 4, c.y - rr + 12);
      }

      // cruz cardinal
      ctx.strokeStyle = "rgba(52,211,153,0.25)";
      ctx.beginPath();
      ctx.moveTo(c.x - R, c.y); ctx.lineTo(c.x + R, c.y);
      ctx.moveTo(c.x, c.y - R); ctx.lineTo(c.x, c.y + R);
      ctx.stroke();
      ctx.fillStyle = "rgba(110,231,183,0.9)";
      ctx.fillText("N", c.x - 3, c.y - R - 6);
      ctx.fillText("S", c.x - 3, c.y + R + 14);
      ctx.fillText("E", c.x + R + 6, c.y + 4);
      ctx.fillText("O", c.x - R - 16, c.y + 4);

      // zonas asignadas
      snap.swarms.forEach((s) => {
        if (!s.zona) return;
        const p = proj(s.zona.lat, s.zona.lon);
        ctx.beginPath(); ctx.arc(p.x, p.y, s.zona.radio_m / mpp, 0, 2 * Math.PI);
        ctx.strokeStyle = (s.color || "#38bdf8") + "aa";
        ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
      });

      // zonas de interferencia
      snap.jammers.forEach((j) => {
        const p = proj(j.lat, j.lon);
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(4, j.radio_m / mpp), 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(239,68,68,0.16)"; ctx.fill();
        ctx.strokeStyle = "rgba(239,68,68,0.55)"; ctx.stroke();
      });

      // barrido giratorio (0 = Norte)
      sweep.current = (sweep.current + 0.022) % (2 * Math.PI);
      const theta = sweep.current - Math.PI / 2;
      ctx.save();
      ctx.translate(c.x, c.y);
      for (let k = 0; k < 28; k++) {
        const a2 = theta - k * 0.035;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a2 - 0.035, a2); ctx.closePath();
        ctx.fillStyle = `rgba(52,211,153,${0.13 * (1 - k / 28)})`; ctx.fill();
      }
      ctx.shadowColor = "rgba(110,231,183,0.9)"; ctx.shadowBlur = 12;
      ctx.strokeStyle = "rgba(160,255,210,0.95)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(theta) * R, Math.sin(theta) * R); ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = 1;
      ctx.restore();

      // blips de drones (proyectados sobre el mapa real)
      const colorEnj = {};
      snap.swarms.forEach((s) => (colorEnj[s.id] = s.color));
      snap.drones.forEach((d) => {
        if (d.status === "perdido") return;
        const p = proj(d.lat, d.lon);
        const col = d.status === "degradado" ? "#ef4444" : colorEnj[d.swarm_id] || "#34d399";
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.strokeStyle = col; ctx.globalAlpha = 0.3; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      });

      // base al centro
      ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#fbbf24"; ctx.fill();
      ctx.fillStyle = "rgba(251,191,36,0.95)"; ctx.fillText("BASE", c.x + 9, c.y + 4);

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      lmap.remove();
    };
  }, []);

  return (
    <div ref={wrapRef} className="radar-wrap">
      <div ref={mapDivRef} className="radar-mapa" />
      <canvas ref={canvasRef} className="radar-canvas" />
    </div>
  );
}
