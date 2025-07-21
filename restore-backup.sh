#!/bin/bash

# Restore script for Dance School App
set -e

echo "🔄 Restoring server from backup..."

# Variables
SERVER_IP="89.104.71.170"
SERVER_USER="root"
SERVER_PASSWORD="FNctSC1tWxjU3AWL"
DEPLOY_DIR="/root/dance"
BACKUP_DIR="/root/dance-backup-20250717-105904"

echo "⚠️  This will restore the server to the previous working state"
echo "📂 Backup location: $BACKUP_DIR"

# Restore from backup
echo "🔄 Connecting to server and restoring..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << EOF
    set -e
    
    echo "⏹️  Stopping all services..."
    pm2 stop all || true
    pm2 delete all || true
    pkill -f node || true
    
    echo "📂 Restoring from backup..."
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf $DEPLOY_DIR
        cp -r $BACKUP_DIR $DEPLOY_DIR
        cd $DEPLOY_DIR
        
        echo "🚀 Starting restored application..."
        pm2 start ecosystem.config.js || pm2 start server/index.js --name dance-school-api
        pm2 save
        
        echo "🌐 Restarting nginx..."
        systemctl restart nginx
        
        echo "✅ Restoration completed!"
        echo "📋 Application status:"
        pm2 status
    else
        echo "❌ Backup not found: $BACKUP_DIR"
        exit 1
    fi
EOF

echo "🎉 Server restored successfully!"
echo "🌐 Application: http://89.104.71.170"
echo "📊 Health check: http://89.104.71.170/api/health" 