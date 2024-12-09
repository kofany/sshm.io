<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'POST') {
    sendResponse('error', 'Method not allowed');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!validateRequiredFields(['email', 'password'], $input)) {
    logEvent('login', 'Missing required fields');
    sendResponse('error', 'Missing required fields');
}

// Walidacja limitu prób logowania
if (!validateAuthAttempts($_SERVER['REMOTE_ADDR'])) {
    sendResponse('error', 'Too many login attempts. Please try again later.');
}

try {
    // Sanityzacja danych wejściowych
    $email = sanitizeInput($input['email']);
    $password = $input['password']; // Nie sanityzujemy hasła, bo może zawierać specjalne znaki

    // Sprawdź dane logowania
    $stmt = $pdo->prepare('
        SELECT id, email, password, api_key, is_active 
        FROM sshm_users 
        WHERE email = ?
    ');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Weryfikacja użytkownika i hasła
    if (!$user || !password_verify($password, $user['password'])) {
        logEvent('login', 'Invalid login attempt', ['email' => $email]);
        sendResponse('error', 'Invalid credentials');
    }

    // Sprawdzamy czy konto zostało aktywowane
    if (!$user['is_active']) {
        logEvent('login', 'Inactive account login attempt', ['email' => $email]);
        sendResponse('error', 'Please confirm your email address before logging in');
    }

    // Jeśli request pochodzi z panelu webowego, inicjalizujemy sesję
    if (isWebPanel()) {
        initSession();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['LAST_ACTIVITY'] = time();
        
        logEvent('login', 'Web panel login successful', [
            'user_id' => $user['id'],
            'email' => $user['email']
        ]);
    } else {
        logEvent('login', 'API login successful', [
            'user_id' => $user['id'],
            'email' => $user['email']
        ]);
    }

    sendResponse('success', 'Login successful', [
        'email' => $user['email'],
        'api_key' => $user['api_key']
    ]);

} catch (PDOException $e) {
    logEvent('error', 'Database error during login', ['error' => $e->getMessage()]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Login failed');
}
