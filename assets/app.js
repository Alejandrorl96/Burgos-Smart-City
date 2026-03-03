// ==============================
// 1) Inicializa mapa en Burgos
// ==============================
const centroBurgos = [42.34399, -3.69691];
const map = L.map("map").setView(centroBurgos, 13);

// ==============================
// 2) Capa base (OpenStreetMap)
// ==============================
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// ==============================
// 3) Carga chinchetas desde GeoJSON
// ==============================
fetch("data/proyectos.geojson")
  .then((r) => {
    if (!r.ok) {
      throw new Error(`No se pudo cargar data/proyectos.geojson (HTTP ${r.status})`);
    }
    return r.json();
  })
  .then((geojson) => {
    const capaProyectos = L.geoJSON(geojson, {
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};

        const titulo = p.titulo || "Proyecto";
        const desc = p.descripcion ? `<p>${p.descripcion}</p>` : "";
        const url = p.url
          ? `<p><a href="${p.url}" target="_blank" rel="noopener">Abrir recurso</a></p>`
          : "";

        layer.bindPopup(`<h3>${titulo}</h3>${desc}${url}`);
      },
    }).addTo(map);

    // Ajustar vista para encajar todas las chinchetas
    const bounds = capaProyectos.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
  })
  .catch((err) => {
    console.error(err);
    alert("Error cargando las chinchetas. Revisa la consola (F12).");
  });

// ==============================
// 4) Extra: obtener coordenadas clicando en el mapa
// ==============================
map.on("click", (e) => {
  console.log("Coordenadas (lat, lon):", e.latlng.lat, e.latlng.lng);
});