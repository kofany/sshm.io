<?php
// /api/v1/endpoints/user-update.php

if (!defined('API_ACCESS')) {
   header('HTTP/1.0 403 Forbidden');
   exit;
}

if ($method !== 'POST') {
   sendResponse('error', 'Method not allowed');
}

try {
   // Web session authorization only
   session_start();
   if (!isset($_SESSION['user_id'])) {
       sendResponse('error', 'Session required', ['code' => 'SESSION_REQUIRED']);
   }

   $userId = $_SESSION['user_id'];

   // Check if session is still valid
   if (!isset($_SESSION['LAST_ACTIVITY']) || (time() - $_SESSION['LAST_ACTIVITY'] > SESSION_TIMEOUT)) {
       session_unset();
       session_destroy();
       sendResponse('error', 'Session expired', ['code' => 'SESSION_EXPIRED']);
   }

   $_SESSION['LAST_ACTIVITY'] = time();

   $input = json_decode(file_get_contents('php://input'), true);
   $updates = [];
   $params = [];
   $logData = ['user_id' => $userId];

   // Handle email update
   if (isset($input['email'])) {
       $email = sanitizeInput($input['email']);

       if (!validateEmail($email)) {
           logEvent('user-update', 'Invalid email format', ['email' => $email]);
           sendResponse('error', 'Invalid email format');
       }

       // Check if email is already taken
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

   // Handle password update
   if (isset($input['new_password'])) {
       // Check current password first
       if (!isset($input['current_password'])) {
           sendResponse('error', 'Current password is required');
       }

       // Verify current password
       $stmt = $pdo->prepare('SELECT password FROM sshm_users WHERE id = ?');
       $stmt->execute([$userId]);
       $user = $stmt->fetch();

       if (!$user || !password_verify($input['current_password'], $user['password'])) {
           logEvent('user-update', 'Invalid current password', ['user_id' => $userId]);
           sendResponse('error', 'Current password is incorrect');
       }

       // Validate new password
       if (!validatePassword($input['new_password'])) {
           logEvent('user-update', 'Weak password attempt', ['user_id' => $userId]);
           sendResponse('error', 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
       }

       $updates[] = 'password = ?';
       $params[] = password_hash($input['new_password'], PASSWORD_DEFAULT, ['cost' => 12]);
       $logData['password_changed'] = true;
   }

   if (empty($updates)) {
       sendResponse('error', 'No fields to update');
   }

   // Begin transaction
   $pdo->beginTransaction();

   // Add userId to params
   $params[] = $userId;
   $sql = 'UPDATE sshm_users SET ' . implode(', ', $updates) . ' WHERE id = ?';
   $stmt = $pdo->prepare($sql);
   $stmt->execute($params);

   // Commit transaction
   $pdo->commit();

   // Log success
   logEvent('user-update', 'User updated successfully', $logData);

   // If email or password was changed, terminate session
   if (isset($input['email']) || isset($input['new_password'])) {
       session_unset();
       session_destroy();
       setcookie(session_name(), '', time() - 3600, '/');
       
       sendResponse('success', 'User updated successfully. Please login again', [
           'session_terminated' => true
       ]);
   }

   sendResponse('success', 'User updated successfully');

} catch (PDOException $e) {
   if ($pdo->inTransaction()) {
       $pdo->rollBack();
   }

   logEvent('error', 'Database error during user update', [
       'error' => $e->getMessage(),
       'user_id' => $userId ?? null
   ]);

   if (API_DEBUG) {
       sendResponse('error', 'Database error: ' . $e->getMessage());
   }
   sendResponse('error', 'Update failed');

} catch (Exception $e) {
   if ($pdo->inTransaction()) {
       $pdo->rollBack();
   }

   logEvent('error', 'Error during user update', [
       'error' => $e->getMessage(),
       'user_id' => $userId ?? null
   ]);

   if (API_DEBUG) {
       sendResponse('error', 'Error: ' . $e->getMessage());
   }
   sendResponse('error', 'Update failed');
}