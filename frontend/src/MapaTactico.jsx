import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Mapa tactico: dibuja el mapa satelital de Venezuela y, sobre el, los drones,
// los enlaces mesh, la base, las zonas de cada enjambre y las zonas de
// interferencia. Las zonas y los jammers son objetos PERSISTENTES y
// ARRASTRABLES (no se recrean en cada frame), para poder moverlos y
// redimensionarlos sin que el redibujado los interrumpa.

const LOS_TEQUES = [10.344, -67.041];

export default function MapaTactico({
  snapshot, herramienta, cobertura, onMapClick, onDronClick, onZonaMove, onZonaClick, onJammerMove, onJammerClick,
}) {
  const contenedor = useRef(null);
  const mapa = useRef(null);
  const capas = useRef({ base: null, drones: null, mesh: null });
  const zonaObjs = useRef({});   // swarm_id -> { circle, handle }
  const jamObjs = useRef({});    // jammer_id -> { circle, handle }
  const arrastrando = useRef(null);
  const cbRef = useRef({});
  cbRef.current = { onMapClick, onDronClick, onZonaMove, onZonaClick, onJammerMove, onJammerClick };

  // ---- inicializacion (una sola vez) ----
  useEffect(() => {
    if (mapa.current) return;
    const m = L.map(contenedor.current, { zoomControl: true }).setView(LOS_TEQUES, 13);

    const satelite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "Imagery © Esri" }
    );
    const calles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 19, attribution: "© OpenStreetMap" }
    );
    const etiquetas = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, opacity: 0.9 }
    );
    satelite.addTo(m);
    etiquetas.addTo(m);
    L.control.layers(
      { "Satélite": satelite, "Calles": calles },
      { "Nombres de lugares": etiquetas },
      { position: "topright", collapsed: false }
    ).addTo(m);

    capas.current.cobertura = L.layerGroup().addTo(m);  // heatmap de cobertura (M2)
    capas.current.base = L.layerGroup().addTo(m);
    capas.current.zonas = L.layerGroup().addTo(m);   // contenedor de zonas/handles
    capas.current.jammers = L.layerGroup().addTo(m);
    capas.current.mesh = L.layerGroup().addTo(m);
    capas.current.drones = L.layerGroup().addTo(m);

    m.on("click", (e) => cbRef.current.onMapClick(e.latlng));
    mapa.current = m;
    window.__simcedMap = m;
  }, []);

  useEffect(() => {
    if (!contenedor.current) return;
    contenedor.current.style.cursor = herramienta === "normal" ? "grab" : "crosshair";
  }, [herramienta]);

  // ---- heatmap de cobertura (M2): celdas coloreadas por nº de visitas ----
  useEffect(() => {
    const capa = capas.current.cobertura;
    if (!capa) return;
    capa.clearLayers();
    if (!cobertura || !cobertura.celdas?.length) return;
    const { paso, max, celdas } = cobertura;
    const h = paso / 2;
    celdas.forEach((c) => {
      const t = max ? c.n / max : 0;        // intensidad 0..1
      const hue = 60 * (1 - t);             // amarillo (poco) -> rojo (mucho)
      L.rectangle(
        [[c.lat - h, c.lon - h], [c.lat + h, c.lon + h]],
        {
          stroke: false,
          fillColor: `hsl(${hue}, 90%, 50%)`,
          fillOpacity: 0.15 + 0.5 * t,
          interactive: false,
        }
      ).addTo(capa);
    });
  }, [cobertura]);

  // ---- crea un "handle" arrastrable (cruz central) ----
  function crearHandle(lat, lon, color, claveArrastre, onMove, onClickSel) {
    const icono = L.divIcon({
      className: "handle-icon",
      html: `<div class="zona-handle" style="--c:${color}">✛</div>`,
      iconSize: [20, 20], iconAnchor: [10, 10],
    });
    const h = L.marker([lat, lon], { icon: icono, draggable: true });
    h.on("dragstart", () => { arrastrando.current = claveArrastre; });
    h.on("drag", (e) => { h._circuloAsociado?.setLatLng(e.latlng); });
    h.on("dragend", (e) => {
      arrastrando.current = null;
      onMove(e.latlng.lat, e.latlng.lng);
    });
    if (onClickSel) h.on("click", (e) => { L.DomEvent.stop(e); onClickSel(); });
    return h;
  }

  // ---- redibujado en cada snapshot ----
  useEffect(() => {
    if (!mapa.current || !snapshot) return;
    const { base, drones, mesh, zonas, jammers } = capas.current;

    // --- base, drones y mesh: se limpian y redibujan (no son interactivos) ---
    base.clearLayers();
    drones.clearLayers();
    mesh.clearLayers();

    if (snapshot.base) {
      const b = snapshot.base;
      L.circle([b.lat, b.lon], {
        radius: b.radio_m, color: "#fbbf24", weight: 1,
        fillColor: "#fbbf24", fillOpacity: 0.08, interactive: false,
      }).addTo(base);
      L.marker([b.lat, b.lon], {
        icon: L.divIcon({ className: "base-icon", html: '<div class="base-marca">⬢ BASE</div>', iconSize: [60, 22], iconAnchor: [30, 11] }),
        interactive: false,
      }).addTo(base);
    }

    const porId = {};
    snapshot.drones.forEach((d) => (porId[d.id] = d));
    const colorEnjambre = {};
    snapshot.swarms.forEach((s) => (colorEnjambre[s.id] = s.color));

    const dibujados = new Set();
    snapshot.drones.forEach((d) => {
      if (d.status === "perdido") return;
      d.vecinos.forEach((vid) => {
        const clave = [d.id, vid].sort().join("|");
        if (dibujados.has(clave)) return;
        dibujados.add(clave);
        const v = porId[vid];
        if (!v) return;
        const interEnjambre = v.swarm_id !== d.swarm_id;
        L.polyline([[d.lat, d.lon], [v.lat, v.lon]], {
          color: interEnjambre ? "#e2e8f0" : "#38bdf8",   // blanco entre grupos, azul interno
          weight: 1,
          opacity: interEnjambre ? 0.55 : 0.45,
          dashArray: interEnjambre ? "4 5" : null,
          className: interEnjambre ? "mesh-inter" : "mesh-link",
          interactive: false,
        }).addTo(mesh);
      });
    });

    snapshot.drones.forEach((d) => {
      if (d.status === "perdido") return;
      const color = d.status === "degradado" ? "#ef4444" : colorEnjambre[d.swarm_id] || "#22d3ee";
      const icono = L.divIcon({
        className: "dron-icon",
        html: `<div class="dron" style="--c:${color}; transform: rotate(${d.heading}deg)">▲</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      });
      L.marker([d.lat, d.lon], { icon: icono })
        .on("click", (e) => { L.DomEvent.stopPropagation(e); cbRef.current.onDronClick(d); })
        .bindTooltip(`${d.id} · ${d.mode}<br>bat ${d.bateria}% · señal ${d.senal}%`, { direction: "top" })
        .addTo(drones);
    });

    // --- ZONAS asignadas: objetos persistentes y arrastrables ---
    const zonasActuales = new Set();
    snapshot.swarms.forEach((s) => {
      if (!s.zona) return;
      zonasActuales.add(s.id);
      const { lat, lon, radio_m } = s.zona;
      let obj = zonaObjs.current[s.id];
      if (!obj) {
        const circle = L.circle([lat, lon], {
          radius: radio_m, color: s.color, weight: 1.5,
          fillColor: s.color, fillOpacity: 0.07, dashArray: "6 6", interactive: false,
        }).addTo(zonas);
        const handle = crearHandle(lat, lon, s.color, "z:" + s.id,
          (la, lo) => cbRef.current.onZonaMove(s.id, la, lo),
          () => cbRef.current.onZonaClick(s.id));
        handle._circuloAsociado = circle;
        handle.bindTooltip(`${s.nombre} · arrastra para mover, clic para editar`, { direction: "top" });
        handle.addTo(zonas);
        obj = zonaObjs.current[s.id] = { circle, handle };
      } else if (arrastrando.current !== "z:" + s.id) {
        obj.circle.setLatLng([lat, lon]);
        obj.circle.setRadius(radio_m);
        obj.circle.setStyle({ color: s.color, fillColor: s.color });
        obj.handle.setLatLng([lat, lon]);
      } else {
        obj.circle.setRadius(radio_m);
      }
    });
    Object.keys(zonaObjs.current).forEach((id) => {
      if (!zonasActuales.has(id)) {
        zonas.removeLayer(zonaObjs.current[id].circle);
        zonas.removeLayer(zonaObjs.current[id].handle);
        delete zonaObjs.current[id];
      }
    });

    // --- JAMMERS: objetos persistentes, arrastrables y seleccionables ---
    const jamsActuales = new Set();
    snapshot.jammers.forEach((j) => {
      jamsActuales.add(j.id);
      let obj = jamObjs.current[j.id];
      if (!obj) {
        const circle = L.circle([j.lat, j.lon], {
          radius: j.radio_m, color: "#ef4444", weight: 2,
          fillColor: "#ef4444", fillOpacity: 0.18, interactive: false,
        }).addTo(jammers);
        const handle = crearHandle(j.lat, j.lon, "#ef4444", "j:" + j.id,
          (la, lo) => cbRef.current.onJammerMove(j.id, la, lo),
          () => cbRef.current.onJammerClick(j.id));
        handle._circuloAsociado = circle;
        handle.bindTooltip(`${j.id} · arrastra o clic para editar`, { direction: "top" });
        handle.addTo(jammers);
        obj = jamObjs.current[j.id] = { circle, handle };
      } else if (arrastrando.current !== "j:" + j.id) {
        obj.circle.setLatLng([j.lat, j.lon]);
        obj.circle.setRadius(j.radio_m);
        obj.handle.setLatLng([j.lat, j.lon]);
      } else {
        obj.circle.setRadius(j.radio_m);
      }
    });
    Object.keys(jamObjs.current).forEach((id) => {
      if (!jamsActuales.has(id)) {
        jammers.removeLayer(jamObjs.current[id].circle);
        jammers.removeLayer(jamObjs.current[id].handle);
        delete jamObjs.current[id];
      }
    });
  }, [snapshot]);

  return <div ref={contenedor} className="mapa" />;
}
