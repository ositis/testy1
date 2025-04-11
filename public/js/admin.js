function logAction(action, details = '') {
    const username = localStorage.getItem('username') || 'unknown';
    fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action, details })
    }).catch(err => console.error('Logging failed:', err));
}

async function initAdmin() {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/dashboard'; // Redirect if not logged in
        return;
    }
    const userResponse = await fetch('/api/users/all');
    const users = await userResponse.json();
    const isAdmin = users.some(u => u.username === username && u.is_admin);
    if (!isAdmin) {
        alert('Access denied: Admins only');
        window.location.href = '/dashboard';
        return;
    }

    const hotelResponse = await fetch('/api/hotels');
    const hotels = await hotelResponse.json();
    populateSelect('user-select', users.map(u => u.username));
    populateSelect('hotel-select', hotels.map(h => h.name));
    document.getElementById('user-select').addEventListener('change', loadUserHotels);
    loadUserHotels();
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
    const response = await fetch('/api/user-hotels', {
        headers: { 'X-Username': username } // Custom header for admin to fetch another's hotels
    });
    const hotels = await response.json();
    const userHotelsDiv = document.getElementById('user-hotels');
    userHotelsDiv.innerHTML = hotels.length ? hotels.map(h => `<p>${h}</p>`).join('') : 'No hotels assigned';
    logAction('Load User Hotels', username);
}

async function createUser() {
    const username = document.getElementById('new-username').value;
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
        initAdmin(); // Refresh user list
        logAction('Create User', username);
    } else {
        alert('Failed to create user');
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
        alert('Failed to assign hotel');
    }
}

async function removeHotel() {
    const username = document.getElementById('user-select').value;
    const hotelName = document.getElementById('hotel-select').value;
    const response = await fetch(`/api/user-hotels/${username}?hotel_name=${encodeURIComponent(hotelName)}`, {
        method: 'DELETE'
    });
    if (response.ok) {
        loadUserHotels();
        logAction('Remove Hotel', `${username} from ${hotelName}`);
    } else {
        alert('Failed to remove hotel');
    }
}

window.addEventListener('load', initAdmin);
