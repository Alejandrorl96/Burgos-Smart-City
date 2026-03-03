// ======== Config ========
const centroBurgos = [42.34399, -3.69691];
const zoomInicial = 13;

// ======== UI refs ========
const sidebar = document.getElementById("sidebar");
const btnTogglePanel = document.getElementById("btnTogglePanel");
const btnLocate = document.getElementById("btnLocate");
const searchInput = document.getElementById("searchInput");
const listEl = document.getElementById("list");
const countBadge = document.getElementById("countBadge");

// ======== Mapa ========
const map = L.map("map", { zoomControl: true }).setView(centroBurgos, zoomInicial);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// ======== Estado ========
let features = [];                  // features del GeoJSON
const markerById = new Map();       // id -> marker
const cardById = new Map();         // id -> card element
let activeId = null;

// ======== Helpers ========
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setActive(id) {
  if (activeId && cardById.get(activeId)) cardById.get(activeId).classList.remove("active");
  activeId = id;
  if (activeId && cardById.get(activeId)) cardById.get(activeId).classList.add("active");
}

function openProject(id) {
  const marker = markerById.get(id);
  if (!marker) return;

  setActive(id);
  map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
  marker.openPopup();

  // En móvil, cerramos panel tras seleccionar
  if (window.matchMedia("(max-width: 980px)").matches) {
    sidebar.classList.remove("open");
  }
}

function renderList(filtered) {
  listEl.innerHTML = "";
  countBadge.textContent = filtered.length;

  filtered.forEach((f) => {
    const p = f.properties || {};
    const id = p.id || p.titulo; // fallback (pero mejor usar id en GeoJSON)
    const titulo = p.titulo || "Proyecto";
    const desc = p.descripcion || "";
    const url = p.url || "";

    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;

    card.innerHTML = `
      <h3>${escapeHtml(titulo)}</h3>
      ${desc ? `<p>${escapeHtml(desc)}</p>` : ""}
      <div class="meta">
        <span class="pill">${escapeHtml(p.categoria || "Proyecto")}</span>
        ${url ? `<a class="link" href="${escapeHtml(url)}" target="_blank" rel="noopener">Abrir</a>` : ""}
      </div>
    `;

    card.addEventListener("click", () => openProject(id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openProject(id);
    });

    listEl.appendChild(card);
    cardById.set(id, card);
  });
}

function applySearch() {
  const q = (searchInput.value || "").trim().toLowerCase();
  if (!q) {
    renderList(features);
    return;
  }
  const filtered = features.filter((f) => {
    const p = f.properties || {};
    const hay = `${p.titulo || ""} ${p.descripcion || ""} ${p.categoria || ""}`.toLowerCase();
    return hay.includes(q);
  });
  renderList(filtered);
}

// ======== Cargar GeoJSON ========
fetch("data/proyectos.geojson")
  .then((r) => {
    if (!r.ok) throw new Error(`No se pudo cargar data/proyectos.geojson (HTTP ${r.status})`);
    return r.json();
  })
  .then((geojson) => {
    features = (geojson.features || []).map((f) => {
      const p = f.properties || {};
      // Recomendación: usar un id estable
      if (!p.id) p.id = p.titulo || crypto.randomUUID();
      f.properties = p;
      return f;
    });

    // Capa de marcadores
    const capa = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => L.marker(latlng),
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const id = p.id;

        const titulo = p.titulo || "Proyecto";
        const desc = p.descripcion ? `<p>${escapeHtml(p.descripcion)}</p>` : "";
        const url = p.url
          ? `<p><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Abrir recurso</a></p>`
          : "";

        layer.bindPopup(`<h3>${escapeHtml(titulo)}</h3>${desc}${url}`);

        markerById.set(id, layer);

        layer.on("click", () => {
          setActive(id);
        });
      },
    }).addTo(map);

    // Ajustar vista a todos los puntos
    const bounds = capa.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.2));

    // Pintar listado inicial
    renderList(features);
  })
  .catch((err) => {
    console.error(err);
    alert("Error cargando las chinchetas. Revisa la consola (F12).");
  });

// ======== UX extra: coordenadas ========
map.on("click", (e) => {
  console.log("Coordenadas (lat, lon):", e.latlng.lat, e.latlng.lng);
});

// ======== Botones ========
btnLocate.addEventListener("click", () => {
  map.setView(centroBurgos, zoomInicial, { animate: true });
});

btnTogglePanel.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ======== Buscador ========
searchInput.addEventListener("input", applySearch);
