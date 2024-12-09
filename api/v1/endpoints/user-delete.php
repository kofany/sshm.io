<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

// Uniwersalna autoryzacja
$userId = validateAuth($pdo);

if ($method !== 'DELETE') {
    sendResponse('error', 'Method not allowed');
}

try {
    // Pobranie danych użytkownika przed usunięciem (do logów)
    $stmt = $pdo->prepare('SELECT email FROM sshm_users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        logEvent('user-delete', 'User not found during deletion', ['user_id' => $userId]);
        sendResponse('error', 'User not found');
    }

    // Rozpocznij transakcję
    $pdo->beginTransaction();

    // Usuń wszystkie powiązane dane w odpowiedniej kolejności
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

    // Usuń użytkownika
    $stmt = $pdo->prepare('DELETE FROM sshm_users WHERE id = ?');
    $stmt->execute([$userId]);

    // Zatwierdź transakcję
    $pdo->commit();

    // Logowanie pomyślnego usunięcia
    logEvent('user-delete', 'User account deleted successfully', [
        'user_id' => $userId,
        'email' => $user['email']
    ]);

    // Jeśli to panel webowy, niszczymy sesję
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
    // Wycofaj transakcję w przypadku błędu
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logEvent('error', 'Database error during account deletion', [
        'error' => $e->getMessage(),
        'user_id' => $userId
    ]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Failed to delete account');
}
