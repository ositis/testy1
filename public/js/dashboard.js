let currentHotel = null;
let debounceTimeout = null;

function logAction(action, details = '') {
    fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'unknown', action, details })
    }).catch(err => console.error('Logging failed:', err));
}

function renderAmenities() {
    const amenitiesDiv = document.getElementById('amenities');
    amenitiesDiv.innerHTML = '';
    if (!currentHotel || !currentHotel.amenities) return;
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
            const payload = { amenities: currentHotel.amenities, availability: currentHotel.availability };
            console.log('Sending payload:', payload);
            const response = await fetch(`/api/hotels/${encodeURIComponent(currentHotel.name)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('Response status:', response.status);
            if (response.ok) {
                statusDiv.textContent = 'Saved successfully';
                logAction('Save Changes', currentHotel.name);
            } else {
                const errorText = await response.text();
                statusDiv.textContent = 'Failed to save: ' + errorText;
                console.log('Error response:', errorText);
            }
        } catch (err) {
            statusDiv.textContent = 'Error: ' + err.message;
            console.log('Fetch error:', err);
        }
    }, 1000);
}

function logout() {
    window.location.href = '/';
    logAction('Logout');
}

async function fetchHotelData(hotelName) {
    try {
        const response = await fetch(`/api/hotels`);
        if (!response.ok) {
            throw new Error('Failed to fetch hotel data');
        }
        const hotels = await response.json();
        const hotel = hotels.find(h => h.name === hotelName);
        if (!hotel) {
            throw new Error(`Hotel ${hotelName} not found`);
        }
        return hotel;
    } catch (err) {
        console.error('Error fetching hotel data:', err);
        document.getElementById('status').textContent = 'Error loading hotel data: ' + err.message;
        return null;
    }
}

async function initDashboard() {
    console.log('initDashboard called');
    if (!hotels || hotels.length === 0) {
        console.log('No hotels available');
        return;
    }

    const hotelSelect = document.getElementById('hotel-select');
    const editorDiv = document.getElementById('editor');
    editorDiv.style.display = 'block';

    // Initial load: Fetch fresh data for the first hotel
    const initialHotelName = JSON.parse(hotelSelect.value).name;
    currentHotel = await fetchHotelData(initialHotelName);
    if (currentHotel) {
        document.getElementById('hotel-name').textContent = currentHotel.name;
        renderAmenities();
    }

    hotelSelect.addEventListener('change', async function() {
        const selectedHotel = JSON.parse(this.value);
        currentHotel = await fetchHotelData(selectedHotel.name);
        if (currentHotel) {
            document.getElementById('hotel-name').textContent = currentHotel.name;
            renderAmenities();
            logAction('Select Hotel', currentHotel.name);
        }
    });

    logAction('Dashboard Loaded');
}

window.addEventListener('load', initDashboard);
