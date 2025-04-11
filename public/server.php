<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

$db = pg_connect(getenv('DATABASE_URL'));
if ($db === false) {
    http_response_code(500);
    die('Database connection failed');
}

function checkAuth($db) {
    // Check if user is already authenticated
    if (isset($_SERVER['PHP_AUTH_USER']) && isset($_SERVER['PHP_AUTH_PW'])) {
        $username = $_SERVER['PHP_AUTH_USER'];
        $password = $_SERVER['PHP_AUTH_PW'];
        $result = pg_query_params($db, 'SELECT username FROM users WHERE username = $1 AND password = $2', [$username, $password]);
        if ($result && pg_fetch_assoc($result)) {
            return $username;
        }
    }
    // Redirect to login page if not authenticated
    header('Location: /login');
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$authUser = null;

if ($path === '/dashboard' || $path === '/admin') {
    $authUser = checkAuth($db);
}

if ($path === '/') {
    require 'index.php';
} elseif ($path === '/dashboard') {
    require 'dashboard.php';
} elseif ($path === '/admin') {
    require 'admin.php';
} elseif ($path === '/login') {
    require 'login.php';
} elseif (str_starts_with($path, '/api')) {
    require 'api.php';
} elseif (str_starts_with($path, '/css') || str_starts_with($path, '/js')) {
    $file = 'public' . $path;
    if (file_exists($file)) {
        if (str_ends_with($file, '.css')) {
            header('Content-Type: text/css');
        } elseif (str_ends_with($file, '.js')) {
            header('Content-Type: application/javascript');
        }
        readfile($file);
    } else {
        http_response_code(404);
        echo 'File not found';
    }
} else {
    http_response_code(404);
    echo 'Not Found';
}
