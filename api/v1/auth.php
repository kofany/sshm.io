<?php
// /api/v1/auth.php

if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

/**
 * Walidacja API key dla aplikacji desktopowej
 */
function validateApiKey($pdo) {
    $apiKey = getApiKey();
    
    if (!$apiKey) {
        sendResponse('error', 'API key is required');
    }

    try {
        $stmt = $pdo->prepare('SELECT id FROM sshm_users WHERE api_key = ? AND is_active = 1');
        $stmt->execute([$apiKey]);
        $user = $stmt->fetch();

        if (!$user) {
            logEvent('auth', 'Invalid API key attempt', ['api_key' => $apiKey]);
            sendResponse('error', 'Invalid API key');
        }

        return $user['id'];
    } catch (PDOException $e) {
        logEvent('error', 'Database error during API key validation', ['error' => $e->getMessage()]);
        sendResponse('error', 'Authentication failed');
    }
}

/**
 * Walidacja sesji dla panelu webowego
 */
function validateSession() {
    if (!isset($_SESSION['user_id'])) {
        sendResponse('error', 'Session required', ['code' => 'SESSION_REQUIRED']);
    }

    if (!isset($_SESSION['LAST_ACTIVITY']) || 
        (time() - $_SESSION['LAST_ACTIVITY'] > SESSION_TIMEOUT)) {
        session_unset();
        session_destroy();
        sendResponse('error', 'Session expired', ['code' => 'SESSION_EXPIRED']);
    }

    $_SESSION['LAST_ACTIVITY'] = time();
    return $_SESSION['user_id'];
}

/**
 * Uniwersalna funkcja autoryzacji - obsługuje oba typy
 */
function validateAuth($pdo) {
    if (isWebPanel()) {
        return validateSession();
    } else {
        return validateApiKey($pdo);
    }
}

/**
 * Sprawdza czy użytkownik ma aktywne konto
 */
function validateUserStatus($pdo, $userId) {
    try {
        $stmt = $pdo->prepare('SELECT is_active FROM sshm_users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || !$user['is_active']) {
            logEvent('auth', 'Inactive account access attempt', ['user_id' => $userId]);
            sendResponse('error', 'Account is not active');
        }

        return true;
    } catch (PDOException $e) {
        logEvent('error', 'Database error during user status validation', ['error' => $e->getMessage()]);
        sendResponse('error', 'User validation failed');
    }
}

/**
 * Sprawdza uprawnienia użytkownika do zasobu
 */
function validateResourceAccess($pdo, $userId, $resourceId, $resourceType) {
    try {
        $tableName = 'sshm_' . $resourceType;
        $stmt = $pdo->prepare("SELECT id FROM {$tableName} WHERE id = ? AND user_id = ?");
        $stmt->execute([$resourceId, $userId]);
        
        if (!$stmt->fetch()) {
            logEvent('auth', 'Unauthorized resource access attempt', [
                'user_id' => $userId,
                'resource_id' => $resourceId,
                'resource_type' => $resourceType
            ]);
            sendResponse('error', 'Access denied');
        }

        return true;
    } catch (PDOException $e) {
        logEvent('error', 'Database error during resource access validation', ['error' => $e->getMessage()]);
        sendResponse('error', 'Access validation failed');
    }
}

/**
 * Sprawdza limit prób uwierzytelnienia
 */
function validateAuthAttempts($ip) {
    if (!checkRateLimit($ip, 'auth', 5, 300)) {
        logEvent('auth', 'Rate limit exceeded', ['ip' => $ip]);
        sendResponse('error', 'Too many authentication attempts. Please try again later.', 
            ['code' => 'RATE_LIMIT_EXCEEDED']);
    }
    return true;
}
