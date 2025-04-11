function logAction(action, details = '') {
    fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', action, details })
    }).catch(err => console.error('Logging failed:', err));
}

async function initAdmin() {
    await loadUserHotels(); // Initial load
    document.getElementById('user-select').addEventListener('change', loadUserHotels);
    logAction('Admin Loaded');
}

function populateSelect(id, items) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.text = item;
        select.appendChild(option);
    });
}

async function loadUserHotels() {
    const username = document.getElementById('user-select').value;
    const response = await fetch(`/api/user-hotels?username=${encodeURIComponent(username)}`);
    if (!response.ok) {
        console.error('Failed to fetch user hotels:', await response.text());
        return;
    }
    const hotels = await response.json();
    const userHotelsDiv = document.getElementById('user-hotels');
    userHotelsDiv.innerHTML = hotels.length ? hotels.map(h => `<p>${h}</p>`).join('') : 'No hotels assigned';
    logAction('Load User Hotels', username);
}

async function createUser() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const isAdmin = document.getElementById('is-admin').checked;
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, is_admin: isAdmin })
    });
    if (response.ok) {
        alert('User created');
        document.getElementById('new-username').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('is-admin').checked = false;
        // Refresh user list
        const userResponse = await fetch('/api/users/all');
        const users = await userResponse.json();
        populateSelect('user-select', users.map(u => u.username));
        loadUserHotels();
        logAction('Create User', username);
    } else {
        alert('Failed to create user: ' + await response.text());
    }
}

async function assignHotel() {
    const username = document.getElementById('user-select').value;
    const hotelName = document.getElementById('hotel-select').value;
    const response = await fetch('/api/user-hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, hotel_name: hotelName })
    });
    if (response.ok) {
        loadUserHotels();
        logAction('Assign Hotel', `${username} to ${hotelName}`);
    } else {
        alert('Failed to assign hotel: ' + await response.text());
    }
}

async function removeHotel() {
    const username = document.getElementById('user-select').value;
    const hotelName = document.getElementById('hotel-select').value;
    const response = await fetch(`/api/user-hotels/${encodeURIComponent(username)}?hotel_name=${encodeURIComponent(hotelName)}`, {
        method: 'DELETE'
    });
    if (response.ok) {
        loadUserHotels();
        logAction('Remove Hotel', `${username} from ${hotelName}`);
    } else {
        alert('Failed to remove hotel: ' + await response.text());
    }
}

window.addEventListener('load', initAdmin);
