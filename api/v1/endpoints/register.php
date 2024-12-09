<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

require_once __DIR__ . '/../../vendor/autoload.php';

use Brevo\Client\Api\TransactionalEmailsApi;
use Brevo\Client\Configuration;
use Brevo\Client\Model\SendSmtpEmail;

if ($method !== 'POST') {
    sendResponse('error', 'Method not allowed');
}

// Walidacja limitu prób rejestracji
if (!validateAuthAttempts($_SERVER['REMOTE_ADDR'])) {
    sendResponse('error', 'Too many registration attempts. Please try again later.');
}

$input = json_decode(file_get_contents('php://input'), true);

if (!validateRequiredFields(['email', 'password'], $input)) {
    logEvent('register', 'Missing required fields');
    sendResponse('error', 'Missing required fields');
}

$email = sanitizeInput($input['email']);
$password = $input['password'];

// Walidacja email
if (!validateEmail($email)) {
    logEvent('register', 'Invalid email format', ['email' => $email]);
    sendResponse('error', 'Invalid email format');
}

// Walidacja hasła
if (!validatePassword($password)) {
    logEvent('register', 'Weak password attempt', ['email' => $email]);
    sendResponse('error', 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
}

try {
    // Sprawdź czy email już istnieje
    $stmt = $pdo->prepare('SELECT id FROM sshm_users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        logEvent('register', 'Email already exists', ['email' => $email]);
        sendResponse('error', 'Email already exists');
    }

    // Generuj token potwierdzający i API key
    $confirmToken = generateSecureToken(32);
    $apiKey = generateSecureToken(32);
    $passwordHash = password_hash($password, PASSWORD_DEFAULT, ['cost' => 12]);

    // Rozpocznij transakcję
    $pdo->beginTransaction();

    // Dodaj użytkownika do bazy
    $stmt = $pdo->prepare('
        INSERT INTO sshm_users
        (email, password, api_key, confirm_token, is_active)
        VALUES (?, ?, ?, ?, 0)
    ');

    $stmt->execute([
        $email,
        $passwordHash,
        $apiKey,
        $confirmToken
    ]);

    $userId = $pdo->lastInsertId();

    // Utwórz wpis w tabeli sync_status
    $stmt = $pdo->prepare('
        INSERT INTO sshm_sync_status
        (user_id, last_sync)
        VALUES (?, CURRENT_TIMESTAMP)
    ');
    $stmt->execute([$userId]);

    // Konfiguracja Brevo API
    $config = Configuration::getDefaultConfiguration()
        ->setApiKey('api-key', BREVO_API_KEY);
    
    $apiInstance = new TransactionalEmailsApi(
        new GuzzleHttp\Client(),
        $config
    );

    $sendSmtpEmail = new SendSmtpEmail();
    $sendSmtpEmail['to'] = [
        [
            'email' => $email,
            'name' => explode('@', $email)[0] // Użyj części przed @ jako imienia
        ]
    ];
    $sendSmtpEmail['sender'] = [
        'name' => 'SSH Manager',
        'email' => 'noreply@sshm.io'
    ];
    $sendSmtpEmail['subject'] = 'Welcome to SSH Manager - Confirm Your Email';
    $sendSmtpEmail['htmlContent'] = '
        <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h1 style="color: #2563EB; margin-bottom: 20px;">Welcome to SSH Manager!</h1>
                    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                        Thank you for registering. To get started, please confirm your email address by clicking the button below.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://sshm.io/confirm-email/' . $confirmToken . '"
                           style="background-color: #2563EB; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 6px; font-weight: bold;
                                  display: inline-block;">
                            Confirm Email
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        If you didn\'t create this account, you can safely ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        SSH Manager - Secure SSH Management
                        <br>
                        <a href="https://sshm.io" style="color: #2563EB; text-decoration: none;">sshm.io</a>
                    </p>
                </div>
            </body>
        </html>';

    // Dodatkowe parametry śledzenia
    $sendSmtpEmail['params'] = [
        'CONFIRMATION_LINK' => 'https://sshm.io/confirm-email/' . $confirmToken,
        'USER_ID' => $userId
    ];

    // Dodaj nagłówki śledzenia
    $sendSmtpEmail['headers'] = [
        'X-Mailin-Tag' => 'registration_confirmation',
        'X-Mailin-Custom' => json_encode([
            'user_id' => $userId,
            'registration_date' => date('Y-m-d H:i:s')
        ])
    ];

    $result = $apiInstance->sendTransacEmail($sendSmtpEmail);

    // Zatwierdź transakcję
    $pdo->commit();

    logEvent('register', 'User registered successfully', [
        'user_id' => $userId,
        'email' => $email,
        'message_id' => $result['messageId'] ?? null
    ]);

    sendResponse('success', 'Registration successful. Please check your email to confirm your account.', [
        'confirm_token' => $confirmToken
    ]);

} catch (\Brevo\Client\ApiException $e) {
    // W razie błędu, wycofaj transakcję
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logEvent('error', 'Brevo API error during registration', [
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
        'response' => $e->getResponseBody(),
        'email' => $email
    ]);

    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Registration failed - could not send confirmation email');

} catch (PDOException $e) {
    // W razie błędu, wycofaj transakcję
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logEvent('error', 'Database error during registration', [
        'error' => $e->getMessage(),
        'email' => $email
    ]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Registration failed');

} catch (Exception $e) {
    // Obsługa innych błędów
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    logEvent('error', 'Unexpected error during registration', [
        'error' => $e->getMessage(),
        'email' => $email
    ]);

    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Registration failed - unexpected error');
}