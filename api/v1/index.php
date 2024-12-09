<?php
// /api/v1/index.php
require_once __DIR__ . '/../vendor/autoload.php';  // cofamy się tylko jeden katalog w górę

define('API_ACCESS', true);

// Ustawienia nagłówków CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

// Jeśli to zapytanie OPTIONS, zakończ
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Dołączanie wymaganych plików - zmieniona kolejność!
require_once 'functions.php';  // Najpierw functions.php
require_once 'config.php';     // Potem config.php
require_once 'auth.php';       // Na końcu auth.php

// Pobierz metodę i ścieżkę
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path = '';
if (preg_match('#^/api/v1/(.*)#', $request_uri, $matches)) {
    $path = trim($matches[1], '/');
}
// Tymczasowo dodaj debug
if (API_DEBUG) {
    error_log('Request path: ' . $path);
    error_log('Full URL: ' . $_SERVER['REQUEST_URI']);
    error_log('Query string: ' . $_SERVER['QUERY_STRING']);
}


// Lista endpointów dla panelu webowego (wymagających sesji)
$web_endpoints = ['user/update', 'user/delete', 'check-session', 'logout']; // Usuń 'user/info'

// Lista publicznych endpointów (nie wymagających żadnej autoryzacji)
$public_endpoints = ['login', 'register', 'confirm-email'];

// Lista endpointów akceptujących oba typy autoryzacji
$dual_auth_endpoints = ['sync', 'status', 'user/info']; // Dodaj 'user/info'

// Zarządzanie autoryzacją
if (in_array($path, $web_endpoints)) {
    // Endpointy panelu webowego - wymagają sesji
    session_start();
    if (isset($_SESSION['LAST_ACTIVITY'])) {
        if (time() - $_SESSION['LAST_ACTIVITY'] > SESSION_TIMEOUT) {
            session_unset();
            session_destroy();
            sendResponse('error', 'Session expired', ['code' => 'SESSION_EXPIRED']);
        }
    }
    
    if (!isset($_SESSION['user_id'])) {
        sendResponse('error', 'Unauthorized', ['code' => 'SESSION_REQUIRED']);
    }
    
    $_SESSION['LAST_ACTIVITY'] = time();
} elseif (in_array($path, $dual_auth_endpoints)) {
    // Endpointy akceptujące oba typy autoryzacji
    $userId = null;
    
    // Próba autoryzacji przez sesję
    if (isWebPanel()) {
        session_start();
        if (isset($_SESSION['user_id']) && 
            isset($_SESSION['LAST_ACTIVITY']) && 
            (time() - $_SESSION['LAST_ACTIVITY'] < SESSION_TIMEOUT)) {
            $userId = $_SESSION['user_id'];
            $_SESSION['LAST_ACTIVITY'] = time();
        }
    }
    
    // Jeśli nie ma autoryzacji przez sesję, sprawdź API key
    if (!$userId) {
        $apiKey = getApiKey();
        if (!$apiKey) {
            sendResponse('error', 'Authentication required');
        }
        
        // Walidacja API key
        $stmt = $pdo->prepare('SELECT id FROM sshm_users WHERE api_key = ? AND is_active = 1');
        $stmt->execute([$apiKey]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendResponse('error', 'Invalid API key');
        }
        
        $userId = $user['id'];
    }
    
    // Zapisz ID użytkownika do wykorzystania w endpointach
    define('AUTH_USER_ID', $userId);
} elseif (!in_array($path, $public_endpoints)) {
    // Pozostałe endpointy - wymagają API key
    $apiKey = getApiKey();
    if (!$apiKey) {
        sendResponse('error', 'API key required');
    }
    
    // Walidacja API key
    $stmt = $pdo->prepare('SELECT id FROM sshm_users WHERE api_key = ? AND is_active = 1');
    $stmt->execute([$apiKey]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendResponse('error', 'Invalid API key');
    }
    
    define('AUTH_USER_ID', $user['id']);
}

// Routing API
switch ($path) {
    case 'sync':
        require_once 'endpoints/sync.php';
        break;
    
    case 'status':
        require_once 'endpoints/status.php';
        break;
        
    case 'register':
        require_once 'endpoints/register.php';
        break;
        
    case 'login':
        require_once 'endpoints/login.php';
        break;
        
    case 'logout':
        require_once 'endpoints/logout.php';
        break;
        
    case 'confirm-email':
        require_once 'endpoints/confirm-email.php';
        break;
        
    case 'user/update':
        require_once 'endpoints/user-update.php';
        break;
        
    case 'user/delete':
        require_once 'endpoints/user-delete.php';
        break;
        
    case 'user/info':
        require_once 'endpoints/user-info.php';
        break;
        
    case 'check-session':
        sendResponse('success', 'Session active');
        break;
        
    default:
        sendResponse('error', 'Unknown endpoint');
}
