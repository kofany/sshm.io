<?php
// /api/v1/functions.php

if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

/**
 * Sprawdza czy request pochodzi z panelu webowego
 */
function isWebPanel() {
    $headers = getallheaders();
    return isset($headers['X-Requested-With']) && 
           $headers['X-Requested-With'] === 'XMLHttpRequest' && 
           (!empty($_SERVER['HTTP_REFERER']) && 
           parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST) === 'sshm.io');
}

/**
 * Wysyła odpowiedź JSON
 */
function sendResponse($status, $message, $data = null) {
    header('Content-Type: application/json; charset=utf-8');
    $response = [
        'status' => $status,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Sprawdza czy zapytanie zawiera wymagane pola
 */
function validateRequiredFields($required, $data) {
    if (!is_array($data)) {
        return false;
    }
    
    foreach ($required as $field) {
        if (!isset($data[$field]) || 
            (is_string($data[$field]) && trim($data[$field]) === '') || 
            $data[$field] === null) {
            return false;
        }
    }
    return true;
}

/**
 * Pobiera nagłówek API key
 */
function getApiKey() {
    $headers = getallheaders();
    return $headers['X-Api-Key'] ?? null;
}

/**
 * Sanityzuje dane wejściowe
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Generuje bezpieczny token
 */
function generateSecureToken($length = 32) {
    try {
        return bin2hex(random_bytes($length / 2));
    } catch (Exception $e) {
        // Fallback w przypadku problemów z random_bytes
        return bin2hex(openssl_random_pseudo_bytes($length / 2));
    }
}

/**
 * Weryfikuje adres email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) && 
           preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $email);
}

/**
 * Weryfikuje siłę hasła
 */
function validatePassword($password) {
    // Minimum 8 znaków, przynajmniej jedna wielka litera, jedna mała, jedna cyfra i jeden znak specjalny
    return strlen($password) >= 8 && 
           preg_match('/[A-Z]/', $password) && 
           preg_match('/[a-z]/', $password) && 
           preg_match('/[0-9]/', $password) && 
           preg_match('/[^A-Za-z0-9]/', $password);
}

/**
 * Loguje zdarzenia do pliku
 */
function logEvent($type, $message, $data = []) {
    $logFile = __DIR__ . '/logs/api.log';
    $logDir = dirname($logFile);
    
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'type' => $type,
        'message' => $message,
        'ip' => $_SERVER['REMOTE_ADDR'],
        'data' => $data
    ];
    
    file_put_contents(
        $logFile, 
        json_encode($logEntry, JSON_UNESCAPED_UNICODE) . "\n", 
        FILE_APPEND | LOCK_EX
    );
}

/**
 * Sprawdza limit prób logowania
 */
function checkRateLimit($ip, $action = 'login', $limit = 5, $timeWindow = 300) {
    $cacheFile = sys_get_temp_dir() . '/rate_limit_' . md5($ip . $action) . '.tmp';
    
    $attempts = [];
    if (file_exists($cacheFile)) {
        $attempts = unserialize(file_get_contents($cacheFile));
    }
    
    // Usuń stare próby
    $attempts = array_filter($attempts, function($timestamp) use ($timeWindow) {
        return $timestamp > (time() - $timeWindow);
    });
    
    if (count($attempts) >= $limit) {
        return false;
    }
    
    $attempts[] = time();
    file_put_contents($cacheFile, serialize($attempts), LOCK_EX);
    return true;
}

/**
 * Sprawdza czy sesja jest aktywna
 */
function checkSession() {
    if (!isset($_SESSION['LAST_ACTIVITY'])) {
        return false;
    }
    
    if (time() - $_SESSION['LAST_ACTIVITY'] > SESSION_TIMEOUT) {
        session_unset();
        session_destroy();
        return false;
    }
    
    $_SESSION['LAST_ACTIVITY'] = time();
    return true;
}

/**
 * Inicjalizuje sesję z bezpiecznymi ustawieniami
 */
function initSession() {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', 1);
        ini_set('session.use_strict_mode', 1);
        ini_set('session.cookie_samesite', 'Lax');
        
        session_name(SESSION_NAME);
        session_start();
    }
}

/**
 * Validacja danych JSON
 */
function validateJson($string) {
    if (!is_string($string)) {
        return false;
    }
    
    json_decode($string);
    return json_last_error() === JSON_ERROR_NONE;
}
