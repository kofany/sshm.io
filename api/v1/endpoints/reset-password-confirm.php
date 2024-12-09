<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'POST') {
    sendResponse('error', 'Method not allowed');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!validateRequiredFields(['token', 'password'], $input)) {
    logEvent('reset-password-confirm', 'Missing required fields');
    sendResponse('error', 'Token and password are required');
}

try {
    $token = sanitizeInput($input['token']);
    $password = $input['password'];

    // Sprawdź czy token istnieje i nie wygasł
    $stmt = $pdo->prepare('
        SELECT id 
        FROM sshm_users 
        WHERE reset_token = ? 
        AND reset_token_expires > NOW() 
        AND is_active = 1
    ');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        logEvent('reset-password-confirm', 'Invalid or expired token', ['token' => $token]);
        sendResponse('error', 'Invalid or expired reset link');
    }

    // Walidacja hasła
    if (!validatePassword($password)) {
        sendResponse('error', 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
    }

    // Aktualizuj hasło i wyczyść token
    $stmt = $pdo->prepare('
        UPDATE sshm_users 
        SET password = ?,
            reset_token = NULL,
            reset_token_expires = NULL
        WHERE id = ?
    ');
    $stmt->execute([
        password_hash($password, PASSWORD_DEFAULT),
        $user['id']
    ]);

    logEvent('reset-password-confirm', 'Password reset successfully', [
        'user_id' => $user['id']
    ]);

    sendResponse('success', 'Password reset successfully');

} catch (Exception $e) {
    logEvent('error', 'Error during password reset confirmation', [
        'error' => $e->getMessage()
    ]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Failed to reset password');
}