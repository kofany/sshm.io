# sshm.io - Secure SSH Manager

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A free, open-source SSH management solution with encrypted synchronization between CLI and web interface.

## Project Structure
```plaintext
sshm.io/
├── api/                   # PHP API (v1)
│   └── v1/
│       ├── auth.php
│       ├── config.php     # Configuration file (not included in repo)
│       ├── endpoints/     # API endpoints
│       ├── functions.php
│       └── index.php
├── public/               # Next.js public assets
├── src/                  # Next.js source code
└── ...                  # Other Next.js project files
```

## Requirements

- Node.js 18+
- PHP 8.1+
- MySQL/MariaDB 10.5+
- Nginx
- PM2 (for Node.js process management)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/kofany/sshm.io.git
cd sshm.io
```

### 2. Install Node.js dependencies
```bash
npm install
```

### 3. Build the application
```bash
npm run build
```

### 4. Configure API
Create `api/v1/config.php` based on the example below:
```php
<?php
define('DB_HOST', '');
define('DB_NAME', '');
define('DB_USER', '');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

define('API_VERSION', '1.0');
define('API_DEBUG', false);

// Brevo Mail Configuration
define('BREVO_API_KEY', 'your-brevo-api-key');
define('MAIL_FROM', 'noreply@yourdomain.com');
define('MAIL_FROM_NAME', 'SSH Manager');

if (isWebPanel()) {
    define('SESSION_TIMEOUT', 1800);
    define('SESSION_NAME', 'SSHM_SESSION');
    define('SITE_URL', 'https://yourdomain.com');
}
```

### 5. Database Setup
Create the following MySQL/MariaDB tables:
```sql
CREATE TABLE `sshm_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `api_key` varchar(64) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `confirm_token` varchar(64) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `api_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sshm_hosts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `login` text NOT NULL,
  `ip` text NOT NULL,
  `port` text NOT NULL,
  `password_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sshm_hosts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sshm_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sshm_keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `key_data` text DEFAULT NULL,
  `path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sshm_keys_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sshm_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sshm_passwords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sshm_passwords_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sshm_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sshm_sync_status` (
  `user_id` int(11) NOT NULL,
  `last_sync` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `sshm_sync_status_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sshm_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 6. Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/sshm.io;

    location /api {
        alias /var/www/sshm.io/api;
        try_files $uri $uri/ /api/v1/index.php?$args;

        location ~ \.php$ {
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. Start the Application
```bash
pm2 start ecosystem.config.js
```

## Email Service
This project uses Brevo (formerly Sendinblue) for email services. You'll need to:

1. Create a Brevo account
2. Generate an API key
3. Add the API key to your `config.php`

## Features

- End-to-end encryption
- SSH host management
- Password management
- SSH key management
- Secure synchronization between CLI and web interface
- Email notifications for account activation and password reset

## Security
All sensitive data (passwords, SSH keys, host information) is encrypted using AES-256-CBC before being stored or transmitted.

## License
This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.

## Disclaimer
This software is provided "as is", without warranty of any kind. Use at your own risk.
