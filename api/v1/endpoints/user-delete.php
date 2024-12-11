<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'POST') {
    sendResponse('error', 'Method not allowed');
}

// Uniwersalna autoryzacja
$userId = validateAuth($pdo);

try {
    // Pobranie danych użytkownika przed usunięciem (do logów)
    $stmt = $pdo->prepare('SELECT email FROM sshm_users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        logEvent('user-delete', 'User not found during deletion', ['user_id' => $userId]);
        sendResponse('error', 'User not found');
    }

    $pdo->beginTransaction();

    $tables = [
        'sshm_hosts',
        'sshm_keys',
        'sshm_passwords',
        'sshm_sync_status'
    ];
    
    foreach ($tables as $table) {
        $stmt = $pdo->prepare("DELETE FROM $table WHERE user_id = ?");
        $stmt->execute([$userId]);
    }

    $stmt = $pdo->prepare('DELETE FROM sshm_users WHERE id = ?');
    $stmt->execute([$userId]);

    $pdo->commit();

    logEvent('user-delete', 'User account deleted successfully', [
        'user_id' => $userId,
        'email' => $user['email']
    ]);

    if (isWebPanel()) {
        session_start();
        session_unset();
        session_destroy();
        
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/', '', true, true);
        }
    }

    sendResponse('success', 'User account deleted successfully');

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logEvent('error', 'Database error during account deletion', [
        'error' => $e->getMessage(),
        'user_id' => $userId
    ]);
    
    sendResponse('error', 'Failed to delete account');
}