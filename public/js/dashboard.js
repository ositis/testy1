let currentHotel = null;
let debounceTimeout = null;

function logAction(action, details = '') {
    fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'unknown', action, details }) // $authUser not available, could pass from PHP
    }).catch(err => console.error('Logging failed:', err));
}

function renderAmenities() {
    const amenitiesDiv = document.getElementById('amenities');
    amenitiesDiv.innerHTML = '';
    currentHotel.amenities.forEach(amenity => {
        const div = document.createElement('div');
        div.className = 'amenity-item';
        div.innerHTML = `
            <span>${amenity}</span>
            <label class="toggle-switch">
                <input type="checkbox" ${currentHotel.availability[amenity] ? 'checked' : ''} onchange="updateAvailability('${amenity}', this.checked)">
                <span class="slider"></span>
            </label>
        `;
        amenitiesDiv.appendChild(div);
    });
    logAction('Render Amenities', currentHotel.name);
}

function updateAvailability(amenity, available) {
    currentHotel.availability[amenity] = available;
    logAction('Update Availability', `${currentHotel.name}: ${amenity} = ${available}`);
    saveChangesDebounced();
}

function toggleAllAmenities(shutdown) {
    Object.keys(currentHotel.availability).forEach(amenity => {
        currentHotel.availability[amenity] = !shutdown;
    });
    renderAmenities();
    logAction('Toggle All Amenities', `${currentHotel.name}: ${shutdown ? 'Shutdown' : 'Restore'}`);
    saveChangesDebounced();
}

function saveChangesDebounced() {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = 'Saving...';
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/hotels/${encodeURIComponent(currentHotel.name)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amenities: currentHotel.amenities, availability: currentHotel.availability })
            });
            if (response.ok) {
                statusDiv.textContent = 'Saved successfully';
                logAction('Save Changes', currentHotel.name);
            } else {
                statusDiv.textContent = 'Failed to save: ' + await response.text();
            }
        } catch (err) {
            statusDiv.textContent = 'Error: ' + err.message;
        }
    }, 1000); // 1-second debounce
}

function logout() {
    window.location.href = '/';
    logAction('Logout');
}

function initDashboard() {
    if (hotels.length === 0) return;

    const hotelSelect = document.getElementById('hotel-select');
    currentHotel = JSON.parse(hotelSelect.value);
    document.getElementById('hotel-name').textContent = currentHotel.name;
    renderAmenities();

    hotelSelect.addEventListener('change', function() {
        currentHotel = JSON.parse(this.value);
        document.getElementById('hotel-name').textContent = currentHotel.name;
        renderAmenities();
        logAction('Select Hotel', currentHotel.name);
    });

    logAction('Dashboard Loaded');
}

window.addEventListener('load', initDashboard);
