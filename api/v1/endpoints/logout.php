<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'POST') {
    sendResponse('error', 'Method not allowed');
}

// Sprawdź czy to request z panelu webowego
if (!isWebPanel()) {
    logEvent('logout', 'Unauthorized logout attempt from non-web interface');
    sendResponse('error', 'Method not allowed for API');
}

try {
    // Zapisz dane do logów przed zniszczeniem sesji
    if (isset($_SESSION['user_id'])) {
        logEvent('logout', 'User logged out successfully', [
            'user_id' => $_SESSION['user_id'],
            'email' => $_SESSION['email'] ?? 'unknown'
        ]);
    }

    // Zniszcz sesję
    session_start();
    
    // Usuń wszystkie zmienne sesyjne
    $_SESSION = array();
    
    // Usuń ciasteczko sesyjne
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/', '', true, true);
    }
    
    // Zniszcz sesję
    session_destroy();

    sendResponse('success', 'Logged out successfully');
    
} catch (Exception $e) {
    logEvent('error', 'Error during logout', ['error' => $e->getMessage()]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Logout failed');
}
