<?php
// /api/v1/endpoints/user-delete.php

if (!defined('API_ACCESS')) {
   header('HTTP/1.0 403 Forbidden');
   exit;
}

if ($method !== 'DELETE') {
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

   // Check if user exists and is active
   $stmt = $pdo->prepare('SELECT email FROM sshm_users WHERE id = ? AND is_active = 1');
   $stmt->execute([$userId]);
   $user = $stmt->fetch();

   if (!$user) {
       logEvent('user-delete', 'User not found or inactive', ['user_id' => $userId]);
       sendResponse('error', 'User not found');
   }

   // Begin transaction
   $pdo->beginTransaction();

   // Delete all related data
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

   // Delete the user
   $stmt = $pdo->prepare('DELETE FROM sshm_users WHERE id = ?');
   $stmt->execute([$userId]);

   // Commit transaction
   $pdo->commit();

   // Log successful deletion
   logEvent('user-delete', 'User deleted successfully', [
       'user_id' => $userId,
       'email' => $user['email']
   ]);

   // Clear session
   session_unset();
   session_destroy();
   setcookie(session_name(), '', time() - 3600, '/');

   sendResponse('success', 'Account deleted successfully');

} catch (PDOException $e) {
   if ($pdo->inTransaction()) {
       $pdo->rollBack();
   }

   logEvent('error', 'Database error during account deletion', [
       'error' => $e->getMessage(),
       'user_id' => $userId ?? null
   ]);

   if (API_DEBUG) {
       sendResponse('error', 'Database error: ' . $e->getMessage());
   }
   sendResponse('error', 'Failed to delete account');

} catch (Exception $e) {
   if ($pdo->inTransaction()) {
       $pdo->rollBack();
   }

   logEvent('error', 'Error during account deletion', [
       'error' => $e->getMessage(),
       'user_id' => $userId ?? null
   ]);

   if (API_DEBUG) {
       sendResponse('error', 'Error: ' . $e->getMessage());
   }
   sendResponse('error', 'Failed to delete account');
}