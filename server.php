<?php
require 'vendor/autoload.php'; // Composer autoload

use PostgreSQL\Connection as PgConnection;

// Password protection
function checkAuth() {
    $username = 'admin';
    $password = '173713'; // Change this!
    if (!isset($_SERVER['PHP_AUTH_USER']) || 
        $_SERVER['PHP_AUTH_USER'] !== $username || 
        $_SERVER['PHP_AUTH_PW'] !== $password) {
        header('WWW-Authenticate: Basic realm="Restricted Area"');
        header('HTTP/1.0 401 Unauthorized');
        echo 'Unauthorized';
        exit;
    }
}

checkAuth();

// Database setup
try {
    $db = PgConnection::connect(getenv('DATABASE_URL'));
    pg_query($db, 'CREATE TABLE IF NOT EXISTS hotels (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        lat REAL,
        lon REAL,
        amenities JSONB,
        availability JSONB,
        manager_username TEXT,
        manager_password TEXT
    )');
    // Seed initial data (run once)
    $initialHotels = [
        ['The Grand Hotel', 51.5074, -0.1278, json_encode(['Free WiFi', 'Swimming Pool']), json_encode(['Free WiFi' => true, 'Swimming Pool' => false]), 'grandmgr', 'pass123'],
        ['Seaside Retreat', 50.7174, -3.5333, json_encode(['Jacuzzi', 'Beach Access']), json_encode(['Jacuzzi' => true, 'Beach Access' => false]), 'seasidemgr', 'pass456']
    ];
    foreach ($initialHotels as $hotel) {
        pg_query_params($db, 'INSERT INTO hotels (name, lat, lon, amenities, availability, manager_username, manager_password) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (name) DO NOTHING', $hotel);
    }
} catch (Exception $e) {
    die('Database error: ' . $e->getMessage());
}

// Route handling
$uri = $_SERVER['REQUEST_URI'];
if (strpos($uri, '/api') === 0) {
    require 'src/api.php';
} elseif ($uri === '/dashboard') {
    require 'dashboard.php';
} else {
    require 'public/index.php';
}
?>
