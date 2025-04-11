<?php
global $db, $authUser;

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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/css/styles.css">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f4f9; }
        .navbar { background: #333; color: white; padding: 10px; }
        .navbar ul { list-style: none; margin: 0; padding: 0; display: flex; }
        .navbar li { margin-right: 20px; }
        .navbar a { color: white; text-decoration: none; }
        .navbar a.active { font-weight: bold; }
        .container { max-width: 800px; margin: 20px auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        #no-hotels { text-align: center; color: #666; }
        #editor { display: none; }
        .hotel-header { margin-bottom: 20px; }
        #hotel-select { width: 100%; padding: 8px; margin-bottom: 10px; }
        .amenities-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .amenity-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f9f9f9; border-radius: 5px; }
        .toggle-switch { position: relative; display: inline-block; width: 40px; height: 20px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; transition: 0.4s; border-radius: 20px; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background: white; transition: 0.4s; border-radius: 50%; }
        input:checked + .slider { background: #4caf50; }
        input:checked + .slider:before { transform: translateX(20px); }
        .global-toggle { margin-top: 20px; text-align: center; }
        .status { font-size: 0.9em; color: #666; margin-top: 10px; }
    </style>
    <script src="/js/dashboard.js" defer></script>
</head>
<body>
    <nav class="navbar">
        <ul>
            <li><a href="/">Map View</a></li>
            <li><a href="/dashboard" class="active">Dashboard</a></li>
        </ul>
    </nav>
    <div class="container">
        <h1>Hotel Manager Dashboard</h1>
        <div id="no-hotels" <?php echo count($hotels) > 0 ? 'style="display:none;"' : ''; ?>>
            <p>You have no hotels assigned. Contact an admin.</p>
            <button onclick="window.location.href='/'">Back to Map</button>
        </div>
        <div id="editor" <?php echo count($hotels) > 0 ? '' : 'style="display:none;"'; ?>>
            <div class="hotel-header">
                <select id="hotel-select">
                    <?php foreach ($hotels as $hotel): ?>
                        <option value='<?php echo json_encode($hotel); ?>'><?php echo htmlspecialchars($hotel['name']); ?></option>
                    <?php endforeach; ?>
                </select>
                <h2 id="hotel-name"></h2>
            </div>
            <div id="amenities" class="amenities-list"></div>
            <div class="global-toggle">
                <label>Shutdown All Amenities</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="global-shutdown" onchange="toggleAllAmenities(this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
            <div id="status" class="status"></div>
            <button onclick="logout()">Logout</button>
        </div>
    </div>
    <script>
        const hotels = <?php echo json_encode($hotels); ?>;
    </script>
</body>
</html>
