<?php
if (!defined('API_ACCESS')) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

// Dostęp zarówno przez API key jak i sesję
$userId = defined('AUTH_USER_ID') ? AUTH_USER_ID : validateAuth($pdo);

// Sprawdź status aktywacji konta
if (!validateUserStatus($pdo, $userId)) {
    sendResponse('error', 'Account is not active');
}

switch ($method) {
    case 'GET':
        try {
            // Pobieranie wszystkich danych użytkownika
            // Pobieranie hostów
            $stmtHosts = $pdo->prepare('SELECT * FROM sshm_hosts WHERE user_id = ?');
            $stmtHosts->execute([$userId]);
            $hosts = $stmtHosts->fetchAll();

            // Pobieranie haseł
            $stmtPasswords = $pdo->prepare('SELECT * FROM sshm_passwords WHERE user_id = ?');
            $stmtPasswords->execute([$userId]);
            $passwords = $stmtPasswords->fetchAll();

            // Pobieranie kluczy SSH
            $stmtKeys = $pdo->prepare('SELECT * FROM sshm_keys WHERE user_id = ?');
            $stmtKeys->execute([$userId]);
            $keys = $stmtKeys->fetchAll();

            // Pobieranie czasu ostatniej synchronizacji
            $stmtLastSync = $pdo->prepare('SELECT last_sync FROM sshm_sync_status WHERE user_id = ?');
            $stmtLastSync->execute([$userId]);
            $lastSync = $stmtLastSync->fetch();

            logEvent('sync', 'Data retrieved successfully', [
                'user_id' => $userId,
                'data_counts' => [
                    'hosts' => count($hosts),
                    'passwords' => count($passwords),
                    'keys' => count($keys)
                ]
            ]);

            sendResponse('success', 'Data retrieved successfully', [
                'hosts' => $hosts,
                'passwords' => $passwords,
                'keys' => $keys,
                'last_sync' => $lastSync ? $lastSync['last_sync'] : null
            ]);

        } catch (PDOException $e) {
            logEvent('error', 'Database error during data retrieval', [
                'error' => $e->getMessage(),
                'user_id' => $userId
            ]);
            
            if (API_DEBUG) {
                sendResponse('error', $e->getMessage());
            }
            sendResponse('error', 'Failed to retrieve data');
        }
        break;

case 'POST':
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['data'])) {
            sendResponse('error', 'Invalid input data');
        }

        $data = $input['data'];
        $pdo->beginTransaction();

        // Sprawdzamy jakie dane zostały przesłane i tylko te aktualizujemy
        $updatedTypes = [];

        // Hosty
        if (isset($data['hosts'])) {
            $stmtDeleteHosts = $pdo->prepare('DELETE FROM sshm_hosts WHERE user_id = ?');
            $stmtDeleteHosts->execute([$userId]);

            if (!empty($data['hosts'])) {
                $stmtInsertHost = $pdo->prepare('
                    INSERT INTO sshm_hosts 
                    (user_id, name, description, login, ip, port, password_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ');

                foreach ($data['hosts'] as $host) {
                    $stmtInsertHost->execute([
                        $userId,
                        $host['name'],
                        $host['description'] ?? null,
                        $host['login'],
                        $host['ip'],
                        $host['port'],
                        $host['password_id']
                    ]);
                }
            }
            $updatedTypes[] = 'hosts';
        }

        // Hasła
        if (isset($data['passwords'])) {
            $stmtDeletePasswords = $pdo->prepare('DELETE FROM sshm_passwords WHERE user_id = ?');
            $stmtDeletePasswords->execute([$userId]);

            if (!empty($data['passwords'])) {
                $stmtInsertPassword = $pdo->prepare('
                    INSERT INTO sshm_passwords 
                    (user_id, description, password) 
                    VALUES (?, ?, ?)
                ');

                foreach ($data['passwords'] as $password) {
                    $stmtInsertPassword->execute([
                        $userId,
                        $password['description'] ?? null,
                        $password['password']
                    ]);
                }
            }
            $updatedTypes[] = 'passwords';
        }

        // Klucze SSH
        if (isset($data['keys'])) {
            $stmtDeleteKeys = $pdo->prepare('DELETE FROM sshm_keys WHERE user_id = ?');
            $stmtDeleteKeys->execute([$userId]);

            if (!empty($data['keys'])) {
                $stmtInsertKey = $pdo->prepare('
                    INSERT INTO sshm_keys 
                    (user_id, description, key_data, path) 
                    VALUES (?, ?, ?, ?)
                ');

                foreach ($data['keys'] as $key) {
                    $stmtInsertKey->execute([
                        $userId,
                        $key['description'] ?? null,
                        $key['key_data'],
                        $key['path'] ?? null
                    ]);
                }
            }
            $updatedTypes[] = 'keys';
        }

        // Aktualizacja czasu synchronizacji
        $stmtUpdateSync = $pdo->prepare('
            INSERT INTO sshm_sync_status (user_id, last_sync) 
            VALUES (?, CURRENT_TIMESTAMP) 
            ON DUPLICATE KEY UPDATE last_sync = CURRENT_TIMESTAMP
        ');
        $stmtUpdateSync->execute([$userId]);

        $pdo->commit();

        // Pobranie aktualnego czasu synchronizacji
        $stmtGetSync = $pdo->prepare('SELECT last_sync FROM sshm_sync_status WHERE user_id = ?');
        $stmtGetSync->execute([$userId]);
        $syncInfo = $stmtGetSync->fetch();

        logEvent('sync', 'Data synchronized successfully', [
            'user_id' => $userId,
            'updated_types' => $updatedTypes,
            'data_counts' => [
                'hosts' => isset($data['hosts']) ? count($data['hosts']) : null,
                'passwords' => isset($data['passwords']) ? count($data['passwords']) : null,
                'keys' => isset($data['keys']) ? count($data['keys']) : null
            ]
        ]);

        sendResponse('success', 'Data synchronized successfully', [
            'sync_timestamp' => $syncInfo['last_sync']
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        
        logEvent('error', 'Error during data synchronization', [
            'error' => $e->getMessage(),
            'user_id' => $userId
        ]);
        
        if (API_DEBUG) {
            sendResponse('error', $e->getMessage());
        }
        sendResponse('error', 'Failed to synchronize data');
    }
    break;
    default:
        sendResponse('error', 'Method not allowed');
}
