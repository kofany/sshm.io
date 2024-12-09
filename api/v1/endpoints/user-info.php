<?php
// /api/v1/endpoints/user-info.php

if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'GET') {
    sendResponse('error', 'Method not allowed');
}

try {
    // Web session authorization only
    session_start();
    if (!isset($_SESSION['user_id'])) {
        sendResponse('error', 'Session required', ['code' => 'SESSION_REQUIRED']);
    }

    $userId = $_SESSION['user_id'];

    // Check if user exists and is active
    $stmt = $pdo->prepare('
        SELECT 
            u.email,
            u.created_at,
            COALESCE((SELECT COUNT(*) FROM sshm_hosts WHERE user_id = u.id), 0) as hosts_count,
            COALESCE((SELECT COUNT(*) FROM sshm_keys WHERE user_id = u.id), 0) as keys_count,
            COALESCE((SELECT COUNT(*) FROM sshm_passwords WHERE user_id = u.id), 0) as passwords_count,
            COALESCE((SELECT last_sync FROM sshm_sync_status WHERE user_id = u.id), NULL) as last_sync
        FROM sshm_users u 
        WHERE u.id = ? AND u.is_active = 1
    ');
    
    $stmt->execute([$userId]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        logEvent('user-info', 'User not found or inactive', ['user_id' => $userId]);
        sendResponse('error', 'User not found');
    }

    // Check if session is still valid
    if (!isset($_SESSION['LAST_ACTIVITY']) || (time() - $_SESSION['LAST_ACTIVITY'] > SESSION_TIMEOUT)) {
        session_unset();
        session_destroy();
        sendResponse('error', 'Session expired', ['code' => 'SESSION_EXPIRED']);
    }

    $_SESSION['LAST_ACTIVITY'] = time();

    logEvent('user-info', 'User info retrieved successfully', [
        'user_id' => $userId,
        'email' => $userData['email']
    ]);

    sendResponse('success', 'User info retrieved successfully', $userData);

} catch (PDOException $e) {
    logEvent('error', 'Database error in user info', [
        'error' => $e->getMessage(),
        'user_id' => $userId ?? null
    ]);

    if (API_DEBUG) {
        sendResponse('error', 'Database error: ' . $e->getMessage());
    }
    sendResponse('error', 'Database error occurred');

} catch (Exception $e) {
    logEvent('error', 'Error retrieving user info', [
        'error' => $e->getMessage(),
        'user_id' => $userId ?? null
    ]);

    if (API_DEBUG) {
        sendResponse('error', 'Error: ' . $e->getMessage());
    }
    sendResponse('error', 'Failed to get user info');
}