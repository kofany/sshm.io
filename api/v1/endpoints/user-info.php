<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'GET') {
    sendResponse('error', 'Method not allowed');
}

$userId = validateAuth($pdo);

try {
    // Sprawdź czy konto jest aktywne
    if (!validateUserStatus($pdo, $userId)) {
        sendResponse('error', 'Account is not active');
    }

    // Pobierz szczegółowe informacje o użytkowniku
    $stmt = $pdo->prepare('
        SELECT 
            u.email, 
            u.created_at,
            u.api_key,
            (SELECT COUNT(*) FROM sshm_hosts WHERE user_id = u.id) as hosts_count,
            (SELECT COUNT(*) FROM sshm_keys WHERE user_id = u.id) as keys_count,
            (SELECT COUNT(*) FROM sshm_passwords WHERE user_id = u.id) as passwords_count,
            (SELECT last_sync FROM sshm_sync_status WHERE user_id = u.id) as last_sync
        FROM sshm_users u
        WHERE u.id = ?
    ');
    
    $stmt->execute([$userId]);
    $userData = $stmt->fetch();

    if (!$userData) {
        logEvent('user-info', 'User not found', ['user_id' => $userId]);
        sendResponse('error', 'User not found');
    }

    // Konwertuj liczniki na typ integer
    $userData['hosts_count'] = (int)$userData['hosts_count'];
    $userData['keys_count'] = (int)$userData['keys_count'];
    $userData['passwords_count'] = (int)$userData['passwords_count'];

    // Usuń api_key z odpowiedzi jeśli to nie jest panel webowy
    if (!isWebPanel()) {
        unset($userData['api_key']);
    }

    logEvent('user-info', 'User info retrieved successfully', [
        'user_id' => $userId,
        'email' => $userData['email']
    ]);

    sendResponse('success', 'User info retrieved', $userData);

} catch (PDOException $e) {
    logEvent('error', 'Database error during user info retrieval', [
        'error' => $e->getMessage(),
        'user_id' => $userId
    ]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Failed to get user info');
}
