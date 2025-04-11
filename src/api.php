<?php
header('Content-Type: application/json');
ini_set('display_errors', '0'); // Suppress error output
error_reporting(E_ALL);

require '../vendor/autoload.php';

function logActivity($username, $action, $details = '') {
    $logDir = __DIR__ . '/../logs';
    if (!file_exists($logDir)) mkdir($logDir, 0777, true);
    $logFile = "$logDir/activity.log";
    $timestamp = date('Y-m-d H:i:s');
    $line = "$timestamp\t$username\t$action\t$details\n";
    file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
}

try {
    $db = pg_connect(getenv('DATABASE_URL'));
    if ($db === false) {
        throw new Exception('Failed to connect to database');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
$authUser = $_SERVER['PHP_AUTH_USER'] ?? 'unknown';

if ($path[0] !== 'api') {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
    exit;
}

switch ($method) {
    case 'GET':
        if ($path[1] === 'hotels') {
            $result = pg_query($db, 'SELECT name, lat, lon, amenities, availability FROM hotels');
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Query failed: ' . pg_last_error($db)]);
                exit;
            }
            $hotels = pg_fetch_all($result) ?: [];
            foreach ($hotels as &$hotel) {
                $hotel['lat'] = floatval($hotel['lat']);
                $hotel['lon'] = floatval($hotel['lon']);
                $hotel['amenities'] = json_decode($hotel['amenities'], true);
                $hotel['availability'] = json_decode($hotel['availability'], true);
            }
            logActivity($authUser, 'Fetch Hotels');
            echo json_encode($hotels);
        } elseif ($path[1] === 'amenities') {
            $result = pg_query($db, 'SELECT DISTINCT unnest(amenities::jsonb) AS amenity FROM hotels');
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Query failed: ' . pg_last_error($db)]);
                exit;
            }
            $amenities = array_column(pg_fetch_all($result) ?: [], 'amenity');
            sort($amenities);
            logActivity($authUser, 'Fetch Amenities');
            echo json_encode(array_values(array_unique($amenities)));
        } elseif ($path[1] === 'user-hotels') {
            $result = pg_query_params($db, 'SELECT h.name FROM hotels h JOIN user_hotels uh ON h.id = uh.hotel_id JOIN users u ON uh.user_id = u.id WHERE u.username = $1', [$authUser]);
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Query failed: ' . pg_last_error($db)]);
                exit;
            }
            $hotels = array_column(pg_fetch_all($result) ?: [], 'name');
            logActivity($authUser, 'Fetch User Hotels');
            echo json_encode($hotels);
        } elseif ($path[1] === 'users' && $path[2] === 'all') {
            $result = pg_query_params($db, 'SELECT username, is_admin FROM users WHERE username != $1', [$authUser]);
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Query failed: ' . pg_last_error($db)]);
                exit;
            }
            $users = pg_fetch_all($result) ?: [];
            logActivity($authUser, 'Fetch All Users');
            echo json_encode($users);
        }
        break;

    case 'POST':
        if ($path[1] === 'login') {
            $data = json_decode(file_get_contents('php://input'), true);
            $username = $data['username'] ?? '';
            $result = pg_query_params($db, 'SELECT username FROM users WHERE username = $1', [$username]);
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Query failed: ' . pg_last_error($db)]);
                exit;
            }
            if (pg_fetch_assoc($result)) {
                logActivity($username, 'Login', 'Successful');
                echo json_encode(['success' => true]);
            } else {
                logActivity($username, 'Login', 'Failed');
                http_response_code(401);
                echo json_encode(['success' => false]);
            }
        } elseif ($path[1] === 'log') {
            $data = json_decode(file_get_contents('php://input'), true);
            logActivity($data['username'] ?? $authUser, $data['action'] ?? 'Unknown Action', $data['details'] ?? '');
            echo json_encode(['success' => true]);
        } elseif ($path[1] === 'users') {
            $data = json_decode(file_get_contents('php://input'), true);
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';
            $is_admin = $data['is_admin'] ?? false;
            $result = pg_query_params($db, 'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3) RETURNING id', [$username, $password, $is_admin]);
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Query failed: ' . pg_last_error($db)]);
                exit;
            }
            if ($row = pg_fetch_assoc($result)) {
                logActivity($authUser, 'Create User', "Username: $username, Admin: $is_admin");
                echo json_encode(['success' => true, 'id' => $row['id']]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'User creation failed']);
            }
        } elseif ($path[1] === 'user-hotels') {
            $data = json_decode(file_get_contents('php://input'), true);
            $username = $data['username'] ?? '';
            $hotelName = $data['hotel_name'] ?? '';
            $result = pg_query_params($db, 'INSERT INTO user_hotels (user_id, hotel_id) SELECT u.id, h.id FROM users u, hotels h WHERE u.username = $1 AND h.name = $2', [$username, $hotelName]);
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Query failed: ' . pg_last_error($db)]);
                exit;
            }
            if ($result) {
                logActivity($authUser, 'Assign Hotel', "User: $username, Hotel: $hotelName");
                echo json_encode(['success' => true]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Assignment failed']);
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
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Query failed: ' . pg_last_error($db)]);
                exit;
            }
            if ($result) {
                logActivity($authUser, 'Update Hotel', "Hotel: $name");
                echo json_encode(['success' => true]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Update failed']);
            }
        }
        break;

    case 'DELETE':
        if ($path[1] === 'user-hotels' && isset($path[2])) {
            $username = $path[2];
            $hotelName = $_GET['hotel_name'] ?? '';
            $result = pg_query_params($db, 'DELETE FROM user_hotels WHERE user_id = (SELECT id FROM users WHERE username = $1) AND hotel_id = (SELECT id FROM hotels WHERE name = $2)', [$username, $hotelName]);
            if ($result === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Query failed: ' . pg_last_error($db)]);
                exit;
            }
            if ($result) {
                logActivity($authUser, 'Remove Hotel Access', "User: $username, Hotel: $hotelName");
                echo json_encode(['success' => true]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Removal failed']);
            }
        }
        break;
}
