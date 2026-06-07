import { useEffect, useRef } from "react";

// Interfaz tipo radar: representa los drones como "blips" segun su distancia y
// rumbo respecto a la BASE (estacion de control), con anillos de alcance y una
// linea de barrido giratoria. Refuerza la conciencia situacional (tesis, cap. II).

const M_LAT = 111320;
const mLon = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

// redondea el alcance a un valor "bonito" (1, 2, 5 x 10^k)
function alcanceBonito(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * p;
}

export default function Radar({ snapshot }) {
  const canvasRef = useRef(null);
  const snapRef = useRef(snapshot);
  snapRef.current = snapshot;
  const sweep = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
    };
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const snap = snapRef.current;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) / 2 - 34;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) / 1.4);
      grad.addColorStop(0, "#08251a");
      grad.addColorStop(0.6, "#051a10");
      grad.addColorStop(1, "#02100a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      if (!snap || !snap.base) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const base = snap.base;

      // proyectar drones (este/norte en metros respecto a la base)
      let maxd = 800;
      const pts = [];
      snap.drones.forEach((d) => {
        if (d.status === "perdido") return;
        const este = (d.lon - base.lon) * mLon(base.lat);
        const norte = (d.lat - base.lat) * M_LAT;
        const dist = Math.hypot(este, norte);
        if (dist > maxd) maxd = dist;
        pts.push({ este, norte, d });
      });
      const alcance = alcanceBonito(maxd * 1.12);
      const scale = R / alcance;

      ctx.font = "10px monospace";

      // anillos de alcance + etiquetas
      ctx.strokeStyle = "rgba(52,211,153,0.35)";
      ctx.fillStyle = "rgba(110,231,183,0.7)";
      for (let i = 1; i <= 4; i++) {
        const rr = (R * i) / 4;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, 2 * Math.PI);
        ctx.stroke();
        const m = (alcance * i) / 4;
        const txt = m >= 1000 ? (m / 1000).toFixed(1) + " km" : Math.round(m) + " m";
        ctx.fillText(txt, cx + 4, cy - rr + 12);
      }

      // cruz cardinal
      ctx.strokeStyle = "rgba(52,211,153,0.25)";
      ctx.beginPath();
      ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
      ctx.stroke();
      ctx.fillStyle = "rgba(110,231,183,0.9)";
      ctx.fillText("N", cx - 3, cy - R - 6);
      ctx.fillText("S", cx - 3, cy + R + 14);
      ctx.fillText("E", cx + R + 6, cy + 4);
      ctx.fillText("O", cx - R - 16, cy + 4);

      // zonas de interferencia
      snap.jammers.forEach((j) => {
        const este = (j.lon - base.lon) * mLon(base.lat);
        const norte = (j.lat - base.lat) * M_LAT;
        const x = cx + este * scale, y = cy - norte * scale;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(4, j.radio_m * scale), 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(239,68,68,0.16)";
        ctx.fill();
        ctx.strokeStyle = "rgba(239,68,68,0.55)";
        ctx.stroke();
      });

      // barrido giratorio (0 = Norte, sentido horario)
      sweep.current = (sweep.current + 0.022) % (2 * Math.PI);
      const theta = sweep.current - Math.PI / 2; // bearing -> angulo canvas
      ctx.save();
      ctx.translate(cx, cy);
      for (let k = 0; k < 28; k++) {
        const a2 = theta - k * 0.035;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, a2 - 0.035, a2);
        ctx.closePath();
        ctx.fillStyle = `rgba(52,211,153,${0.13 * (1 - k / 28)})`;
        ctx.fill();
      }
      ctx.shadowColor = "rgba(110,231,183,0.9)";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "rgba(160,255,210,0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(theta) * R, Math.sin(theta) * R);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      ctx.restore();

      // blips de drones
      const colorEnj = {};
      snap.swarms.forEach((s) => (colorEnj[s.id] = s.color));
      pts.forEach(({ este, norte, d }) => {
        const x = cx + este * scale, y = cy - norte * scale;
        const col = d.status === "degradado" ? "#ef4444" : colorEnj[d.swarm_id] || "#34d399";
        // halo exterior (anillo de sensor)
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // blip
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // base al centro
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();
      ctx.fillStyle = "rgba(251,191,36,0.95)";
      ctx.fillText("BASE", cx + 9, cy + 4);

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="radar-canvas" />;
}
