<?php
global $db, $authUser;

// Check if user is admin
$result = pg_query_params($db, 'SELECT is_admin FROM users WHERE username = $1', [$authUser]);
if ($result === false) {
    die('Query failed: ' . pg_last_error($db));
}
$user = pg_fetch_assoc($result);
if (!$user || !$user['is_admin']) {
    header('HTTP/1.0 403 Forbidden');
    echo 'Access denied: Admins only';
    exit;
}

// Fetch all users and hotels for initial load
$usersResult = pg_query($db, 'SELECT username FROM users WHERE username != $1', [$authUser]);
$hotelsResult = pg_query($db, 'SELECT name FROM hotels');
$users = pg_fetch_all($usersResult) ?: [];
$hotels = pg_fetch_all($hotelsResult) ?: [];
?>
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
        <select id="user-select">
            <?php foreach ($users as $user): ?>
                <option value="<?php echo htmlspecialchars($user['username']); ?>"><?php echo htmlspecialchars($user['username']); ?></option>
            <?php endforeach; ?>
        </select>
        <select id="hotel-select">
            <?php foreach ($hotels as $hotel): ?>
                <option value="<?php echo htmlspecialchars($hotel['name']); ?>"><?php echo htmlspecialchars($hotel['name']); ?></option>
            <?php endforeach; ?>
        </select>
        <button onclick="assignHotel()">Assign Hotel</button>
        <button onclick="removeHotel()">Remove Hotel</button>
        <div id="user-hotels"></div>
    </div>
</body>
</html>
