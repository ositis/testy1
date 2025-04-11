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
    currentHotel.amenities.forEach(amenity => {
        const div = document.createElement('div');
        div.className = 'amenity';
        div.innerHTML = `
            <label>${amenity}</label>
            <input type="checkbox" ${currentHotel.availability[amenity] ? 'checked' : ''} onchange="updateAvailability('${amenity}', this.checked)">
            <button onclick="removeAmenity('${amenity}')">Remove</button>
        `;
        amenitiesDiv.appendChild(div);
    });
    logAction('Render Amenities', currentHotel.name);
}

function updateAvailability(amenity, available) {
    currentHotel.availability[amenity] = available;
    logAction('Update Availability', `${currentHotel.name}: ${amenity} = ${available}`);
}

function addAmenity() {
    const newAmenity = document.getElementById('new-amenity').value.trim();
    if (newAmenity && !currentHotel.amenities.includes(newAmenity)) {
        currentHotel.amenities.push(newAmenity);
        currentHotel.availability[newAmenity] = false;
        renderAmenities();
        document.getElementById('new-amenity').value = '';
        logAction('Add Amenity', `${currentHotel.name}: ${newAmenity}`);
    }
}

function removeAmenity(amenity) {
    currentHotel.amenities = currentHotel.amenities.filter(a => a !== amenity);
    delete currentHotel.availability[amenity];
    renderAmenities();
    logAction('Remove Amenity', `${currentHotel.name}: ${amenity}`);
}

async function saveChanges() {
    const response = await fetch(`/api/hotels/${encodeURIComponent(currentHotel.name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenities: currentHotel.amenities, availability: currentHotel.availability })
    });
    if (response.ok) {
        alert('Changes saved');
        logAction('Save Changes', currentHotel.name);
    } else {
        alert('Failed to save: ' + await response.text());
    }
}

function logout() {
    window.location.href = '/'; // Redirect to map
    logAction('Logout');
}
