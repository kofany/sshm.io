<?php
// /api/v1/endpoints/confirm-email.php

if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'POST') {
    sendResponse('error', 'Method not allowed');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!validateRequiredFields(['token'], $input)) {
    logEvent('confirm-email', 'Missing token in confirmation attempt');
    sendResponse('error', 'Token is required');
}

$token = sanitizeInput($input['token']);

try {
    // Znajdź użytkownika z tym tokenem
    $stmt = $pdo->prepare('
        SELECT id, email 
        FROM sshm_users 
        WHERE confirm_token = ? 
        AND is_active = 0
    ');
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        logEvent('confirm-email', 'Invalid or expired token used', ['token' => $token]);
        sendResponse('error', 'Invalid or expired token');
    }

    // Aktywuj konto i wyczyść token
    $stmt = $pdo->prepare('
        UPDATE sshm_users 
        SET is_active = 1,
            confirm_token = NULL 
        WHERE id = ?
    ');
    $stmt->execute([$user['id']]);

    // Pobierz API key do zwrócenia użytkownikowi
    $stmt = $pdo->prepare('
        SELECT api_key 
        FROM sshm_users 
        WHERE id = ?
    ');
    $stmt->execute([$user['id']]);
    $userData = $stmt->fetch();

    logEvent('confirm-email', 'Account confirmed successfully', [
        'user_id' => $user['id'],
        'email' => $user['email']
    ]);

    sendResponse('success', 'Account confirmed successfully', [
        'api_key' => $userData['api_key']
    ]);
    
} catch (PDOException $e) {
    logEvent('error', 'Database error during email confirmation', [
        'error' => $e->getMessage(),
        'token' => $token
    ]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Confirmation failed');
}
