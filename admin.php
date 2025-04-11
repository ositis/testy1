<!DOCTYPE html>
<html lang="en">
<head>
    <title>Admin Dashboard</title>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="/css/styles.css">
    <script src="/js/admin.js" defer></script>
</head>
<body>
    <nav class="navbar">
        <ul>
            <li><a href="/">Map View</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/admin" class="active">Admin</a></li>
        </ul>
    </nav>
    <h1>Admin Dashboard</h1>
    <div id="admin-panel">
        <h2>Create User</h2>
        <input type="text" id="new-username" placeholder="Username">
        <input type="password" id="new-password" placeholder="Password">
        <label><input type="checkbox" id="is-admin"> Is Admin</label>
        <button onclick="createUser()">Create User</button>

        <h2>Manage User Access</h2>
        <select id="user-select"></select>
        <select id="hotel-select"></select>
        <button onclick="assignHotel()">Assign Hotel</button>
        <button onclick="removeHotel()">Remove Hotel</button>
        <div id="user-hotels"></div>
    </div>
</body>
</html>
