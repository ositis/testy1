async function initMap() {
    logAction('Map Loaded');
    const hotelResponse = await fetch('/api/hotels');
    const responseText = await hotelResponse.text(); // Get raw text first
    console.log('Raw response from /api/hotels:', responseText); // Log it
    if (!hotelResponse.ok) {
        console.error('Failed to fetch hotels:', hotelResponse.status, responseText);
        logAction('Fetch Hotels Failed', `Status: ${hotelResponse.status}, Response: ${responseText}`);
        return;
    }
    try {
        stores = JSON.parse(responseText); // Parse manually
    } catch (e) {
        console.error('JSON parsing failed:', e, 'Raw response:', responseText);
        logAction('JSON Parse Failed', `Error: ${e.message}, Response: ${responseText}`);
        return;
    }

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
