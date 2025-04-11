let currentHotel = null;

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
        currentHotel = data.hotel;
        document.getElementById('login').style.display = 'none';
        document.getElementById('editor').style.display = 'block';
        document.getElementById('hotel-name').textContent = currentHotel.name;
        renderAmenities();
    } else {
        alert('Invalid credentials');
    }
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
}

function updateAvailability(amenity, available) {
    currentHotel.availability[amenity] = available;
}

function addAmenity() {
    const newAmenity = document.getElementById('new-amenity').value;
    if (newAmenity && !currentHotel.amenities.includes(newAmenity)) {
        currentHotel.amenities.push(newAmenity);
        currentHotel.availability[newAmenity] = false;
        renderAmenities();
        document.getElementById('new-amenity').value = '';
    }
}

function removeAmenity(amenity) {
    currentHotel.amenities = currentHotel.amenities.filter(a => a !== amenity);
    delete currentHotel.availability[amenity];
    renderAmenities();
}

async function saveChanges() {
    const response = await fetch(`/api/hotels/${currentHotel.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenities: currentHotel.amenities, availability: currentHotel.availability })
    });
    if (response.ok) alert('Changes saved');
    else alert('Failed to save');
}

function logout() {
    currentHotel = null;
    document.getElementById('login').style.display = 'block';
    document.getElementById('editor').style.display = 'none';
}
