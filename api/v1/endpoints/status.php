<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'GET') {
    sendResponse('error', 'Method not allowed');
}

// Uniwersalna autoryzacja
$userId = validateAuth($pdo);

try {
    // Sprawdź status aktywacji konta
    if (!validateUserStatus($pdo, $userId)) {
        sendResponse('error', 'Account is not active');
    }

    // Pobierz informacje o użytkowniku
    $stmt = $pdo->prepare('SELECT email FROM sshm_users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        logEvent('error', 'User not found in status check', ['user_id' => $userId]);
        sendResponse('error', 'User not found');
    }

    $response = [
        'version' => API_VERSION,
        'user' => $user['email']
    ];

    // Dodatkowe informacje dla panelu webowego
    if (isWebPanel()) {
        $stmt = $pdo->prepare('
            SELECT 
                (SELECT COUNT(*) FROM sshm_hosts WHERE user_id = ?) as hosts_count,
                (SELECT COUNT(*) FROM sshm_keys WHERE user_id = ?) as keys_count,
                (SELECT COUNT(*) FROM sshm_passwords WHERE user_id = ?) as passwords_count,
                (SELECT last_sync FROM sshm_sync_status WHERE user_id = ?) as last_sync
        ');
        $stmt->execute([$userId, $userId, $userId, $userId]);
        $stats = $stmt->fetch();
        
        $response['stats'] = [
            'hosts_count' => (int)$stats['hosts_count'],
            'keys_count' => (int)$stats['keys_count'],
            'passwords_count' => (int)$stats['passwords_count'],
            'last_sync' => $stats['last_sync']
        ];
    }

    logEvent('status', 'Status check successful', [
        'user_id' => $userId,
        'email' => $user['email']
    ]);

    sendResponse('success', 'API is working', $response);

} catch (PDOException $e) {
    logEvent('error', 'Database error during status check', [
        'error' => $e->getMessage(),
        'user_id' => $userId
    ]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Failed to retrieve status');
}
