<?php
header('Content-Type: application/json');
require 'vendor/autoload.php'; // Composer autoload

use PostgreSQL\Connection as PgConnection;

try {
    $db = PgConnection::connect(getenv('DATABASE_URL'));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = explode('/', trim($_SERVER['REQUEST_URI'], '/'));

if ($path[0] !== 'api') {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
    exit;
}

switch ($method) {
    case 'GET':
        if ($path[1] === 'hotels') {
            $result = pg_query($db, 'SELECT name, lat, lon, amenities, availability FROM hotels');
            $hotels = [];
            while ($row = pg_fetch_assoc($result)) {
                $hotels[] = [
                    'name' => $row['name'],
                    'lat' => floatval($row['lat']),
                    'lon' => floatval($row['lon']),
                    'amenities' => json_decode($row['amenities'], true),
                    'availability' => json_decode($row['availability'], true)
                ];
            }
            echo json_encode($hotels);
        }
        break;

    case 'POST':
        if ($path[1] === 'login') {
            $data = json_decode(file_get_contents('php://input'), true);
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';
            $result = pg_query_params($db, 'SELECT * FROM hotels WHERE manager_username = $1 AND manager_password = $2', [$username, $password]);
            if ($row = pg_fetch_assoc($result)) {
                echo json_encode(['success' => true, 'hotel' => [
                    'name' => $row['name'],
                    'lat' => floatval($row['lat']),
                    'lon' => floatval($row['lon']),
                    'amenities' => json_decode($row['amenities'], true),
                    'availability' => json_decode($row['availability'], true)
                ]]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false]);
            }
        }
        break;

    case 'PUT':
        if ($path[1] === 'hotels' && isset($path[2])) {
            $data = json_decode(file_get_contents('php://input'), true);
            $name = $path[2];
            $amenities = json_encode($data['amenities']);
            $availability = json_encode($data['availability']);
            $result = pg_query_params($db, 'UPDATE hotels SET amenities = $1, availability = $2 WHERE name = $3', [$amenities, $availability, $name]);
            if ($result) echo json_encode(['success' => true]);
            else http_response_code(500); echo json_encode(['error' => 'Update failed']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
}
?>
