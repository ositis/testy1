var map = L.map('map').setView([54.0, -2.0], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors | <button onclick="captureMap()" style="background: none; border: none; color: #0078A8; cursor: pointer; font-size: 12px;">Pic</button>',
    maxZoom: 19
}).addTo(map);

let stores = [];
let selectedStore = null;
let customMarker = null;
let storeMarkers = [];
let lineLayer = L.layerGroup().addTo(map);
let labelLayer = L.layerGroup().addTo(map);
const storeSelect = document.getElementById('store-select');

function logAction(action, details = '') {
    const username = localStorage.getItem('username') || 'unknown';
    fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action, details })
    }).catch(err => console.error('Logging failed:', err));
}

function getColor(index, total) {
    if (total <= 1) return `hsl(120, 70%, 50%)`;
    let hue = (1 - (index / (total - 1))) * 120;
    return `hsl(${hue}, 70%, 50%)`;
}

function getFilteredStores(selectedAmenities) {
    let hideUnavailable = document.getElementById('hide-unavailable-amenities').checked;
    let filteredStores = stores;
    if (selectedAmenities.length > 0) {
        filteredStores = filteredStores.filter(store =>
            selectedAmenities.every(amenity => store.amenities.includes(amenity))
        );
    }
    if (hideUnavailable) {
        filteredStores = filteredStores.filter(store =>
            selectedAmenities.every(amenity => store.availability[amenity] !== false)
        );
    }
    return filteredStores;
}

function getDistancesForStore(store, filteredStores) {
    let startPoint = L.latLng(store.lat, store.lon);
    return filteredStores
        .filter(s => s.name !== store.name)
        .map(s => {
            let endPoint = L.latLng(s.lat, s.lon);
            let distanceMeters = startPoint.distanceTo(endPoint);
            let distanceMiles = distanceMeters * 0.000621371;
            return { name: s.name, lat: s.lat, lon: s.lon, distance: distanceMiles, amenities: s.amenities };
        })
        .sort((a, b) => a.distance - b.distance);
}

function updateTooltip(marker, store, distanceData) {
    let distanceText = distanceData ? `Distance: ${distanceData.distance.toFixed(1)} miles` : "Not calculated";
    let amenitiesText = store.amenities.map(amenity => {
        let availability = store.availability[amenity] ? "[O]" : "[X]";
        let color = store.availability[amenity] ? "green" : "red";
        return `${amenity} <span style="color:${color}">${availability}</span>`;
    }).join("<br>");
    marker.bindTooltip(`
        <div class="tooltip-content">
            <div class="tooltip-name">${store.name}</div>
            <div class="tooltip-distance">${distanceText}</div>
            <hr>
            <div class="tooltip-amenities">Amenities:<br>${amenitiesText}</div>
        </div>
    `, { direction: 'top', permanent: false, className: 'leaflet-tooltip' });
}

function drawStoreLines(store, filteredStores, showLabels) {
    let showTop3 = document.getElementById('top3-toggle').checked;
    let showAutoTooltips = document.getElementById('auto-tooltips').checked;
    let distances = getDistancesForStore(store, filteredStores);
    let displayDistances = showTop3 ? distances.slice(0, 3) : distances;

    let startPoint = L.latLng(store.lat, store.lon);
    displayDistances.forEach((d, i) => {
        let color = getColor(i, displayDistances.length);
        let endPoint = L.latLng(d.lat, d.lon);
        L.polyline([startPoint, endPoint], { color, weight: i === 0 ? 6 : 4, opacity: 0.8, lineCap: 'round' }).addTo(lineLayer);
        if (showLabels) {
            let midPoint = [(startPoint.lat + endPoint.lat) / 2, (startPoint.lng + endPoint.lng) / 2];
            L.marker(midPoint, {
                icon: L.divIcon({ className: 'distance-label', html: `${d.distance.toFixed(1)} mi`, iconSize: [50, 20] })
            }).addTo(labelLayer);
        }
    });

    storeMarkers.forEach(marker => {
        let storeData = stores.find(s => s.lat === marker.getLatLng().lat && s.lon === marker.getLatLng().lng);
        let distanceData = distances.find(d => d.name === storeData.name);
        if (showTop3 && !displayDistances.some(d => d.name === storeData.name) && !showAutoTooltips) {
            marker.closeTooltip();
            marker.unbindTooltip();
        } else {
            updateTooltip(marker, storeData, distanceData);
            if (showAutoTooltips && displayDistances.some(d => d.name === storeData.name)) marker.openTooltip();
        }
    });

    return { distances, displayDistances };
}

function renderLinesForStore(store, filteredStores, showLabels) {
    lineLayer.clearLayers();
    labelLayer.clearLayers();
    let { distances, displayDistances } = drawStoreLines(store, filteredStores, showLabels);
    if (distances.length === 0) {
        document.getElementById('distance-list').innerHTML = `<h3>${store.name}</h3><p>No other stores match the selected filters.</p>`;
        document.getElementById('stats').innerHTML = '';
        return;
    }
    let avgDistance = distances.reduce((sum, d) => sum + d.distance, 0) / distances.length;
    let maxDistance = distances[distances.length - 1].distance;
    let nearestStore = distances[0];
    document.getElementById('distance-list').innerHTML = `
        <h3>${store.name}</h3>
        <ul>${displayDistances.map((d, i) => `
            <li style="color: ${getColor(i, displayDistances.length)}">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${getColor(i, displayDistances.length)}; margin-right: 5px;"></span>
                ${d.name}: ${d.distance.toFixed(1)} miles
            </li>`).join('')}
        </ul>`;
    document.getElementById('stats').innerHTML = `
        Nearest: ${nearestStore.name} (${nearestStore.distance.toFixed(1)} mi)<br>
        Avg. Distance: ${avgDistance.toFixed(1)} mi<br>
        Farthest: ${maxDistance.toFixed(1)} mi
    `;
    if (lineLayer.getLayers().length > 0) {
        const bounds = L.latLngBounds(lineLayer.getLayers().map(layer => layer.getLatLngs()).flat());
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    }
}

async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=gb`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        alert("Address not found in the UK.");
        return null;
    } catch (error) {
        alert("Error geocoding address.");
        return null;
    }
}

function updateMap() {
    let showAll = document.getElementById('show-all-lines').checked;
    let showLabels = document.getElementById('show-distance-labels').checked;
    let selectedAmenities = Array.from(document.querySelectorAll('.amenity:checked')).map(cb => cb.value);
    let filteredStores = getFilteredStores(selectedAmenities);
    lineLayer.clearLayers();
    labelLayer.clearLayers();
    if (selectedStore === null) {
        document.getElementById('distance-list').innerHTML = `<h3>No store selected</h3><p>Select a store or enter a custom address.</p>`;
        document.getElementById('stats').innerHTML = '';
        logAction('Map Update', 'No store selected');
    } else if (showAll) {
        renderLinesForStore(selectedStore, filteredStores, showLabels);
        logAction('Map Update', `Show all lines for ${selectedStore.name}`);
    } else {
        renderLinesForStore(selectedStore, filteredStores, showLabels);
        logAction('Map Update', `Show lines for ${selectedStore.name}`);
    }
}

async function initMap() {
    logAction('Map Loaded');
    const hotelResponse = await fetch('/api/hotels');
    if (!hotelResponse.ok) {
        const errorText = await hotelResponse.text();
        console.error('Failed to fetch hotels:', hotelResponse.status, errorText);
        logAction('Fetch Hotels Failed', `Status: ${hotelResponse.status}, Response: ${errorText}`);
        return;
    }
    stores = await hotelResponse.json();

    storeSelect.innerHTML = "";
    storeSelect.appendChild(Object.assign(document.createElement('option'), { value: "none", text: "None" }));
    stores.forEach((store, index) => {
        storeSelect.appendChild(Object.assign(document.createElement('option'), { value: index, text: store.name }));
    });
    storeSelect.appendChild(Object.assign(document.createElement('option'), { value: "custom", text: "Custom Address" }));

    const amenitiesResponse = await fetch('/api/amenities');
    if (!amenitiesResponse.ok) {
        console.error('Failed to fetch amenities:', amenitiesResponse.status, await amenitiesResponse.text());
        logAction('Fetch Amenities Failed', `Status: ${amenitiesResponse.status}`);
        return;
    }
    const amenities = await amenitiesResponse.json();
    const amenityList = document.getElementById('amenity-list');
    amenities.forEach(amenity => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" class="amenity" value="${amenity}"> ${amenity}`;
        amenityList.appendChild(label);
    });

    storeSelect.addEventListener('change', function() {
        let value = this.value;
        if (value === "none") {
            selectedStore = null;
            document.getElementById('custom-address-container').style.display = 'none';
            if (customMarker) map.removeLayer(customMarker); customMarker = null;
            logAction('Store Select', 'None selected');
        } else if (value === "custom") {
            document.getElementById('custom-address-container').style.display = 'block';
            if (customMarker) selectedStore = { name: "Custom Address", lat: customMarker.getLatLng().lat, lon: customMarker.getLatLng().lng };
            logAction('Store Select', 'Custom address selected');
        } else {
            document.getElementById('custom-address-container').style.display = 'none';
            selectedStore = stores[parseInt(value)];
            if (customMarker) map.removeLayer(customMarker); customMarker = null;
            logAction('Store Select', `Selected ${selectedStore.name}`);
        }
        updateMap();
        updateLocationIndicator(this.options[this.selectedIndex].text);
    });

    document.getElementById('submit-address').addEventListener('click', async () => {
        let address = document.getElementById('custom-address-input').value;
        if (address) {
            let location = await geocodeAddress(address);
            if (location) {
                if (customMarker) map.removeLayer(customMarker);
                customMarker = L.circleMarker([location.lat, location.lon], { color: 'purple', radius: 8 })
                    .addTo(map)
                    .bindTooltip("Custom Address: " + address, { permanent: false, direction: 'top' });
                selectedStore = { name: "Custom Address: " + address, lat: location.lat, lon: location.lon };
                logAction('Set Custom Address', address);
                updateMap();
            }
        }
    });

    document.getElementById('custom-address-input').addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            let address = document.getElementById('custom-address-input').value;
            if (address) {
                let location = await geocodeAddress(address);
                if (location) {
                    if (customMarker) map.removeLayer(customMarker);
                    customMarker = L.circleMarker([location.lat, location.lon], { color: 'purple', radius: 8 })
                        .addTo(map)
                        .bindTooltip("Custom Address: " + address, { permanent: false, direction: 'top' });
                    selectedStore = { name: "Custom Address: " + address, lat: location.lat, lon: location.lon };
                    logAction('Set Custom Address (Enter)', address);
                    updateMap();
                }
            }
        }
    });

    ['show-all-lines', 'show-distance-labels', 'top3-toggle', 'auto-tooltips', 'hide-unavailable-amenities'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            logAction('Toggle Change', `${id} set to ${document.getElementById(id).checked}`);
            updateMap();
        });
    });

    storeMarkers = stores.map((store, index) => {
        let marker = L.circleMarker([store.lat, store.lon], { color: 'blue', radius: 8 }).addTo(map);
        updateTooltip(marker, store, null);
        marker.on('click', () => {
            selectedStore = store;
            storeSelect.value = index;
            document.getElementById('custom-address-container').style.display = 'none';
            if (customMarker) map.removeLayer(customMarker); customMarker = null;
            logAction('Marker Click', `Selected ${store.name}`);
            updateMap();
        });
        return marker;
    });

    selectedStore = null;
    storeSelect.value = "none";
    updateMap();

    setTimeout(() => {
        document.querySelectorAll('.amenity').forEach(cb => cb.addEventListener('change', () => {
            logAction('Amenity Filter Change', `${cb.value} set to ${cb.checked}`);
            updateMap();
        }));
    }, 100);
}

function captureMap() {
    if (!map || !map.getCenter()) return alert('Please wait for the map to load.');
    html2canvas(document.getElementById('map'), { useCORS: true, scale: 2, backgroundColor: '#ffffff' })
        .then(canvas => {
            const link = document.createElement('a');
            link.download = 'map-screenshot.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            logAction('Capture Map');
        })
        .catch(err => {
            console.error('Screenshot failed:', err);
            alert('Failed to capture screenshot.');
        });
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('visible');
    document.getElementById('sidebar-toggle').classList.toggle('active');
    logAction('Toggle Sidebar', `Sidebar ${document.getElementById('sidebar').classList.contains('visible') ? 'opened' : 'closed'}`);
}

function updateLocationIndicator(storeName) {
    const indicator = document.getElementById('location-indicator');
    if (indicator) {
        indicator.textContent = storeName;
        indicator.style.display = 'none';
        indicator.offsetHeight;
        indicator.style.display = 'block';
    }
}

window.addEventListener('load', initMap);
