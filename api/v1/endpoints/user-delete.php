// /api/v1/endpoints/user-delete.php
<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'DELETE') {
    sendResponse('error', 'Method not allowed');
}

try {
    // Uniwersalna autoryzacja
    $userId = validateAuth($pdo);
    
    // Pobieramy dane użytkownika przed usunięciem
    $stmt = $pdo->prepare('SELECT email FROM sshm_users WHERE id = ? AND is_active = 1');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        logEvent('user-delete', 'User not found', ['user_id' => $userId]);
        sendResponse('error', 'User not found');
    }

    // Rozpoczynamy transakcję
    $pdo->beginTransaction();

    // Usuwamy wszystkie powiązane dane
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

    // Usuwamy użytkownika
    $stmt = $pdo->prepare('DELETE FROM sshm_users WHERE id = ?');
    $stmt->execute([$userId]);

    // Zatwierdzamy transakcję
    $pdo->commit();

    // Logujemy sukces
    logEvent('user-delete', 'User deleted successfully', [
        'user_id' => $userId,
        'email' => $user['email']
    ]);

    // Jeśli to panel webowy, kończymy sesję
    if (isWebPanel()) {
        session_start();
        session_unset();
        session_destroy();
    }

    sendResponse('success', 'Account deleted successfully');

} catch (Exception $e) {
    // Wycofujemy transakcję w przypadku błędu
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logEvent('error', 'Failed to delete account', [
        'error' => $e->getMessage(),
        'user_id' => $userId ?? null
    ]);

    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Failed to delete account');
}