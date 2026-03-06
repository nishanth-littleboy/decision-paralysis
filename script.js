let map;
let userLat, userLng;
let activities = [];
let placeMarkers = [];
let routeLayer = null;
let destinationMarker = null;
let selectedMood = null;

// ==========================
// USER EMAIL
// ==========================
const emailSpan = document.getElementById("userEmail");
if (emailSpan) emailSpan.innerText = localStorage.getItem("userEmail");

// ==========================
// LOGOUT
// ==========================
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// ==========================
// ORS API KEY
// ==========================
const ORS_API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjNlNzY0ZThjMDUyMTQ3NDA5NmI0YjFkMTJlYmVlODA1IiwiaCI6Im11cm11cjY0In0=";

// ==========================
// GET USER LOCATION
// ==========================
navigator.geolocation.getCurrentPosition(
  pos => {
    userLat = pos.coords.latitude;
    userLng = pos.coords.longitude;

    map = L.map("map").setView([userLat, userLng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map);

    L.marker([userLat, userLng])
      .addTo(map)
      .bindPopup("You are here")
      .openPopup();
  },
  () => alert("Allow location access")
);

// ==========================
// MOOD SELECTION
// ==========================
async function selectMood(mood) {
  selectedMood = mood;

  document.querySelectorAll(".mood-buttons button")
    .forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");

  document.getElementById("result").innerHTML = "";

  clearMarkers();

  activities = await fetchPlaces();
  showPlacesOnMap(activities);
}

// ==========================
// FETCH PLACES
// ==========================
async function fetchPlaces() {
  const tag = getAmenityTag(selectedMood);

  const query = `
    [out:json];
    (${tag}(around:5000, ${userLat}, ${userLng}););
    out center;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  });

  const data = await res.json();

  return data.elements
    .map(p => {
      const lat = p.lat || p.center?.lat;
      const lng = p.lon || p.center?.lon;
      if (!lat || !lng) return null;

      const distance = haversine(userLat, userLng, lat, lng);
      const time = Math.max(5, Math.round((distance / 4.5) * 60));

      return {
        name: p.tags?.name || "Unnamed Place",
        rating: Math.min(5, 3 + Object.keys(p.tags || {}).length * 0.2).toFixed(1),
        cost: 150,
        time,
        lat,
        lng
      };
    })
    .filter(Boolean);
}

// ==========================
// TAG MAP
// ==========================
function getAmenityTag(mood) {
  if (mood === "cafe") return 'node["amenity"="cafe"]';
  if (mood === "restaurant") return 'node["amenity"="restaurant"]';
  if (mood === "temple") return 'node["amenity"="place_of_worship"]';
}

// ==========================
// CLEAR MARKERS (SAFE)
// ==========================
function clearMarkers() {
  placeMarkers.forEach(m => map.removeLayer(m));
  placeMarkers = [];
}

// ==========================
// CREATE MARKER WITH POPUP (🔥 FIX)
// ==========================
function createMarker(place) {
  const marker = L.marker([place.lat, place.lng]).addTo(map);

  marker.bindPopup(`
    <b>${place.name}</b><br>
    ⭐ ${place.rating}/5<br>
    ⏱ ${place.time} mins · ₹${place.cost}<br><br>

    <button onclick="drawRoute(${place.lat}, ${place.lng})">
      Get Directions
    </button><br><br>

    <a href="https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}"
       target="_blank"
       style="
         display:inline-block;
         background:#2563eb;
         color:white;
         padding:6px 10px;
         border-radius:6px;
         text-decoration:none;">
      🧭 Open in Google Maps
    </a>
  `);

  return marker;
}

// ==========================
// SHOW PLACES ON MAP
// ==========================
function showPlacesOnMap(list) {
  clearMarkers();

  list.forEach(p => {
    const marker = createMarker(p);
    placeMarkers.push(marker);
  });

  if (placeMarkers.length) {
    map.fitBounds(L.featureGroup(placeMarkers).getBounds().pad(0.3));
  }
}

// ==========================
// FIND PLAN (TIME + BUDGET)
// ==========================
async function findPlan() {
  const result = document.getElementById("result");
  result.innerHTML = "";

  if (!activities.length) activities = await fetchPlaces();

  const budget = +document.getElementById("budget").value || 9999;
  const timeLimit = +document.getElementById("time").value || 9999;

  const plan = activities.filter(
    p => p.cost <= budget && p.time <= timeLimit
  ).slice(0, 5);

  showPlacesOnMap(plan);

  plan.forEach(p => {
    result.innerHTML += `
      <div class="plan-item">
        <b>${p.name}</b><br>
        ⭐ ${p.rating}/5<br>
        ⏱ ${p.time} mins · ₹${p.cost}<br>
        <button onclick="drawRoute(${p.lat}, ${p.lng})">
          Get Directions
        </button>
      </div>
    `;
  });
}

// ==========================
// DRAW ROUTE
// ==========================
async function drawRoute(destLat, destLng) {
  if (routeLayer) map.removeLayer(routeLayer);
  if (destinationMarker) map.removeLayer(destinationMarker);

  const res = await fetch(
    "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
    {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coordinates: [
          [userLng, userLat],
          [destLng, destLat]
        ]
      })
    }
  );

  const data = await res.json();

  routeLayer = L.geoJSON(data, {
    style: { color: "#2563eb", weight: 6 }
  }).addTo(map);

  destinationMarker = L.marker([destLat, destLng])
    .addTo(map)
    .bindPopup(`
      <b>Destination</b><br><br>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}"
         target="_blank"
         style="color:#2563eb;font-weight:600;">
        🧭 Open in Google Maps
      </a>
    `)
    .openPopup();

  map.fitBounds(routeLayer.getBounds().pad(0.3));
}

// ==========================
// DISTANCE
// ==========================
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
