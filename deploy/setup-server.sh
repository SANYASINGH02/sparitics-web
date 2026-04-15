#!/bin/bash
# Run this on a fresh Ubuntu 22.04/24.04 DigitalOcean droplet
# Usage: ssh root@YOUR_DROPLET_IP < setup-server.sh

set -e

echo "=== Installing Java 21 ==="
apt update
apt install -y openjdk-21-jre-headless

echo "=== Installing MySQL ==="
apt install -y mysql-server
systemctl enable mysql
systemctl start mysql

echo "=== Installing Nginx ==="
apt install -y nginx
systemctl enable nginx

echo "=== Creating MySQL database and user ==="
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS sparitics_web;
CREATE USER IF NOT EXISTS 'sparitics_user'@'localhost' IDENTIFIED BY 'CHANGE_ME';
GRANT ALL PRIVILEGES ON sparitics_web.* TO 'sparitics_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "=== Creating app directories ==="
mkdir -p /var/www/sparitics/backend
mkdir -p /var/www/sparitics/frontend

echo "=== Server setup complete ==="
echo "Next steps:"
echo "1. Upload backend JAR to /var/www/sparitics/backend/"
echo "2. Upload frontend build to /var/www/sparitics/frontend/"
echo "3. Copy nginx.conf to /etc/nginx/sites-available/sparitics"
echo "4. Copy sparitics.service to /etc/systemd/system/"
echo "5. Update passwords in sparitics.service and MySQL"
