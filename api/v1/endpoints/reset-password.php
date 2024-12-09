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

$input = json_decode(file_get_contents('php://input'), true);

if (!validateRequiredFields(['email'], $input)) {
    logEvent('reset-password', 'Missing email');
    sendResponse('error', 'Email is required');
}

// Walidacja limitu prób
if (!validateAuthAttempts($_SERVER['REMOTE_ADDR'])) {
    sendResponse('error', 'Too many reset attempts. Please try again later.');
}

try {
    $email = sanitizeInput($input['email']);

    // Sprawdź czy email istnieje
    $stmt = $pdo->prepare('SELECT id, is_active FROM sshm_users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        logEvent('reset-password', 'Email not found', ['email' => $email]);
        // Dla bezpieczeństwa zwracamy tę samą wiadomość co dla sukcesu
        sendResponse('success', 'If the email exists, password reset instructions have been sent');
        exit;
    }

    if (!$user['is_active']) {
        logEvent('reset-password', 'Inactive account reset attempt', ['email' => $email]);
        sendResponse('error', 'Account is not active');
        exit;
    }

    // Generuj token resetowania hasła
    $resetToken = generateSecureToken(32);
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Zapisz token w bazie
    $stmt = $pdo->prepare('
        UPDATE sshm_users 
        SET reset_token = ?, 
            reset_token_expires = ? 
        WHERE email = ?
    ');
    $stmt->execute([$resetToken, $tokenExpiry, $email]);

    // Konfiguracja Brevo API
    $config = Configuration::getDefaultConfiguration()
        ->setApiKey('api-key', BREVO_API_KEY);
    
    $apiInstance = new TransactionalEmailsApi(
        new GuzzleHttp\Client(),
        $config
    );

    $sendSmtpEmail = new SendSmtpEmail();
    $sendSmtpEmail['to'] = [['email' => $email]];
    $sendSmtpEmail['sender'] = [
        'name' => 'SSH Manager',
        'email' => 'noreply@sshm.io'
    ];
    $sendSmtpEmail['subject'] = 'Password Reset Request';
    $sendSmtpEmail['htmlContent'] = '
        <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h1 style="color: #2563EB; margin-bottom: 20px;">Password Reset Request</h1>
                    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                        We received a request to reset your password. Click the button below to create a new password.
                        This link will expire in 1 hour.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://sshm.io/reset-password/' . $resetToken . '"
                           style="background-color: #2563EB; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 6px; font-weight: bold;
                                  display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        If you did not request this reset, you can safely ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        SSH Manager - Secure SSH Management
                    </p>
                </div>
            </body>
        </html>';

    $result = $apiInstance->sendTransacEmail($sendSmtpEmail);

    logEvent('reset-password', 'Reset email sent successfully', [
        'email' => $email,
        'message_id' => $result['messageId'] ?? null
    ]);

    sendResponse('success', 'If the email exists, password reset instructions have been sent');

} catch (Exception $e) {
    logEvent('error', 'Error during password reset', [
        'error' => $e->getMessage(),
        'email' => $email ?? null
    ]);
    
    if (API_DEBUG) {
        sendResponse('error', $e->getMessage());
    }
    sendResponse('error', 'Failed to process password reset request');
}