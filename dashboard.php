<?php
// Ensure this runs through server.php, so $db and $authUser are available
global $db, $authUser;

// Fetch user's hotels
$result = pg_query_params($db, 'SELECT h.name, h.lat, h.lon, h.amenities, h.availability FROM hotels h JOIN user_hotels uh ON h.id = uh.hotel_id JOIN users u ON uh.user_id = u.id WHERE u.username = $1', [$authUser]);
if ($result === false) {
    die('Query failed: ' . pg_last_error($db));
}
$hotels = pg_fetch_all($result) ?: [];
foreach ($hotels as &$hotel) {
    $hotel['amenities'] = json_decode($hotel['amenities'], true);
    $hotel['availability'] = json_decode($hotel['availability'], true);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Hotel Manager Dashboard</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .amenity { margin: 5px; }
        button { margin: 5px; padding: 5px 10px; }
        #editor { display: none; }
    </style>
    <script src="/js/dashboard.js" defer></script>
</head>
<body>
    <h1>Hotel Manager Dashboard</h1>
    <div id="login" style="display: <?php echo count($hotels) > 0 ? 'none' : 'block'; ?>;">
        <p>You have no hotels assigned. Contact an admin.</p>
        <button onclick="window.location.href='/'">Back to Map</button>
    </div>
    <div id="editor" style="display: <?php echo count($hotels) > 0 ? 'block' : 'none'; ?>;">
        <select id="hotel-select">
            <?php foreach ($hotels as $hotel): ?>
                <option value='<?php echo json_encode($hotel); ?>'><?php echo htmlspecialchars($hotel['name']); ?></option>
            <?php endforeach; ?>
        </select>
        <h2 id="hotel-name"></h2>
        <div id="amenities"></div>
        <input type="text" id="new-amenity" placeholder="New Amenity">
        <button onclick="addAmenity()">Add Amenity</button>
        <button onclick="saveChanges()">Save Changes</button>
        <button onclick="logout()">Logout</button>
    </div>

    <script>
        let currentHotel = null;
        const hotels = <?php echo json_encode($hotels); ?>;
        if (hotels.length > 0) {
            currentHotel = JSON.parse(document.getElementById('hotel-select').value);
            document.getElementById('hotel-name').textContent = currentHotel.name;
            renderAmenities();
        }

        document.getElementById('hotel-select').addEventListener('change', function() {
            currentHotel = JSON.parse(this.value);
            document.getElementById('hotel-name').textContent = currentHotel.name;
            renderAmenities();
        });
    </script>
</body>
</html>
