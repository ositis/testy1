<?php
require '../vendor/autoload.php';

use PostgreSQL\Connection as PgConnection;

function logActivity($username, $action, $details = '') {
    $logDir = __DIR__ . '/../logs';
    if (!file_exists($logDir)) mkdir($logDir, 0777, true);
    $logFile = "$logDir/activity.log";
    $timestamp = date('Y-m-d H:i:s');
    $line = "$timestamp\t$username\t$action\t$details\n";
    file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
}

function checkAuth($db) {
    if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])) {
        header('WWW-Authenticate: Basic realm="Restricted Area"');
        header('HTTP/1.0 401 Unauthorized');
        echo 'Unauthorized';
        exit;
    }
    $username = $_SERVER['PHP_AUTH_USER'];
    $password = $_SERVER['PHP_AUTH_PW'];
    $result = pg_query_params($db, 'SELECT * FROM users WHERE username = $1 AND password = $2', [$username, $password]);
    if (!pg_fetch_assoc($result)) {
        header('WWW-Authenticate: Basic realm="Restricted Area"');
        header('HTTP/1.0 401 Unauthorized');
        echo 'Unauthorized';
        exit;
    }
    return $username;
}

try {
    $db = PgConnection::connect(getenv('DATABASE_URL'));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$authUser = checkAuth($db);
logActivity($authUser, "Page Access", "Accessed {$_SERVER['REQUEST_URI']}");

$uri = $_SERVER['REQUEST_URI'];
if (strpos($uri, '/api') === 0) {
    require '../src/api.php';
} elseif ($uri === '/dashboard') {
    require '../dashboard.php';
} elseif ($uri === '/admin') {
    require '../admin.php';
} else {
    require 'index.php';
}
