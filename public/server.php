<?php
require '../vendor/autoload.php'; // Adjusted path

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
    die('Database error: ' . $e->getMessage());
}

$authUser = checkAuth($db);
logActivity($authUser, "Page Access", "Accessed {$_SERVER['REQUEST_URI']}");

$uri = $_SERVER['REQUEST_URI'];
if (strpos($uri, '/api') === 0) {
    require '../src/api.php'; // Adjusted path
} elseif ($uri === '/dashboard') {
    require '../dashboard.php'; // Adjusted path
} elseif ($uri === '/admin') {
    require '../admin.php'; // Adjusted path
} else {
    require 'index.php'; // Relative to public/
}
?>
