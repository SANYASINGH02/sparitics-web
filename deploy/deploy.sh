#!/bin/bash
# Run this from your Mac to build and deploy to the server
# Usage: ./deploy.sh YOUR_DROPLET_IP

set -e

SERVER_IP=$1
if [ -z "$SERVER_IP" ]; then
    echo "Usage: ./deploy.sh YOUR_DROPLET_IP"
    exit 1
fi

echo "=== Building frontend ==="
cd ../frontend
npm run build
cd ..

echo "=== Building backend ==="
cd backend
./mvnw package -DskipTests -q
cd ..

echo "=== Uploading frontend ==="
scp -r frontend/dist/* root@$SERVER_IP:/var/www/sparitics/frontend/

echo "=== Uploading backend JAR ==="
scp backend/target/sparitics-backend-0.0.1-SNAPSHOT.jar root@$SERVER_IP:/var/www/sparitics/backend/sparitics-backend.jar

echo "=== Uploading config files ==="
scp deploy/nginx.conf root@$SERVER_IP:/etc/nginx/sites-available/sparitics
scp deploy/sparitics.service root@$SERVER_IP:/etc/systemd/system/sparitics.service

echo "=== Configuring server ==="
ssh root@$SERVER_IP << 'EOF'
ln -sf /etc/nginx/sites-available/sparitics /etc/nginx/sites-enabled/sparitics
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
systemctl daemon-reload
systemctl enable sparitics
systemctl restart sparitics
echo "=== Deployment complete ==="
echo "App is live at http://$(curl -s ifconfig.me)"
EOF
