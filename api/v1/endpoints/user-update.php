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

// Sprawdź status konta
if (!validateUserStatus($pdo, $userId)) {
    sendResponse('error', 'Account is not active');
}

$input = json_decode(file_get_contents('php://input'), true);

try {
    $updates = [];
    $params = [];
    $logData = ['user_id' => $userId];

    if (isset($input['email'])) {
        $email = sanitizeInput($input['email']);
        
        // Walidacja formatu email
        if (!validateEmail($email)) {
            logEvent('user-update', 'Invalid email format', ['email' => $email]);
            sendResponse('error', 'Invalid email format');
        }

        // Sprawdź czy email nie jest już zajęty
        $stmt = $pdo->prepare('SELECT id FROM sshm_users WHERE email = ? AND id != ?');
        $stmt->execute([$email, $userId]);
        if ($stmt->fetch()) {
            logEvent('user-update', 'Email already in use', ['email' => $email]);
            sendResponse('error', 'Email already in use');
        }

        $updates[] = 'email = ?';
        $params[] = $email;
        $logData['new_email'] = $email;
    }

    if (isset($input['password'])) {
        // Walidacja siły hasła
        if (!validatePassword($input['password'])) {
            logEvent('user-update', 'Weak password attempt', ['user_id' => $userId]);
            sendResponse('error', 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
        }

        $updates[] = 'password = ?';
        $params[] = password_hash($input['password'], PASSWORD_DEFAULT, ['cost' => 12]);
        $logData['password_changed'] = true;
    }

    // Regeneracja API key tylko dla panelu webowego
    if (isWebPanel() && isset($input['regenerate_api_key']) && $input['regenerate_api_key']) {
        $new_api_key = generateSecureToken(32);
        $updates[] = 'api_key = ?';
        $params[] = $new_api_key;
        $logData['api_key_regenerated'] = true;
    }

    if (empty($updates)) {
        sendResponse('error', 'No fields to update');
    }

    // Rozpocznij transakcję
    $pdo->beginTransaction();

    $params[] = $userId;
    $sql = 'UPDATE sshm_users SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Zakończ transakcję
    $pdo->commit();

    // Przygotuj odpowiedź
    $response_data = [];
    if (isset($new_api_key)) {
        $response_data['api_key'] = $new_api_key;
    }

    // Logowanie sukcesu
    logEvent('user-update', 'User updated successfully', $logData);

    // Jeśli zmieniono email lub hasło w panelu webowym, wyloguj użytkownika
    if (isWebPanel() && (isset($input['email']) || isset($input['password']))) {
        session_start();
        session_unset();
        session_destroy();
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/', '', true, true);
        }
        $response_data['session_terminated'] = true;
    }

    sendResponse('success', 'User updated successfully', $response_data);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logEvent('error', 'Database error during user update', [
        'error' => $e->getMessage(),
        'user_id' => $userId
    ]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Update failed');
}
