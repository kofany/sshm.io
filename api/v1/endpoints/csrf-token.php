// api/v1/endpoints/csrf-token.php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

if ($method !== 'GET') {
    sendResponse('error', 'Method not allowed');
}

session_start();
$token = generateCSRFToken();
sendResponse('success', 'CSRF token generated', ['token' => $token]);
