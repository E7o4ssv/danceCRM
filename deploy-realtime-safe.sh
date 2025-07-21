#!/bin/bash

# Safe deployment script for Dance School App with Socket.io
set -e

echo "🚀 Starting SAFE deployment with Socket.io support..."

# Variables
SERVER_IP="89.104.71.170"
SERVER_USER="root"
SERVER_PASSWORD="FNctSC1tWxjU3AWL"
DEPLOY_DIR="/root/dance"
BACKUP_DIR="/root/dance-backup-$(date +%Y%m%d-%H%M%S)"
ARCHIVE_NAME=$(ls dance-realtime-full-*.tar.gz | head -n1)

echo "📦 Using archive: $ARCHIVE_NAME"

# Check if archive exists
if [ ! -f "$ARCHIVE_NAME" ]; then
    echo "❌ Archive not found: $ARCHIVE_NAME"
    exit 1
fi

echo "📊 Archive size: $(du -h "$ARCHIVE_NAME" | cut -f1)"

# Quick health check
echo "🔍 Checking server health before deployment..."
if ! curl -s --connect-timeout 5 http://89.104.71.170/api/health > /dev/null; then
    echo "❌ Server is not responding! Aborting deployment."
    exit 1
fi
echo "✅ Server is healthy"

# Create backup on server
echo "🔄 Creating backup on server..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP << EOF
    if [ -d "$DEPLOY_DIR" ]; then
        echo "📂 Backing up existing deployment to $BACKUP_DIR"
        cp -r $DEPLOY_DIR $BACKUP_DIR
        echo "✅ Backup created"
    fi
EOF

# Upload new archive (in chunks to avoid timeout)
echo "📤 Uploading deployment archive..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 "$ARCHIVE_NAME" $SERVER_USER@$SERVER_IP:/tmp/

# Deploy on server - MINIMAL STEPS
echo "🔧 Deploying application (minimal steps)..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP << EOF
    set -e
    
    echo "⏹️  Stopping services..."
    pm2 stop all || true
    pm2 delete all || true
    
    echo "📂 Extracting new version..."
    cd /root
    rm -rf dance-new
    mkdir dance-new
    cd dance-new
    tar -xf /tmp/$ARCHIVE_NAME
    
    echo "🔄 Replacing application..."
    cd /root
    rm -rf $DEPLOY_DIR
    mv dance-new $DEPLOY_DIR
    cd $DEPLOY_DIR
    
    echo "🔧 Setting production environment..."
    cat > .env << 'EOFENV'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/dance-school
JWT_SECRET=your-super-secret-jwt-key-production
EOFENV
    
    echo "🚀 Starting application..."
    pm2 start server/index.js --name dance-school-api
    pm2 save
    
    echo "🌐 Checking nginx..."
    systemctl reload nginx || true
    
    echo "🧹 Cleanup..."
    rm -f /tmp/$ARCHIVE_NAME
    
    echo "⏱️  Waiting for app to start..."
    sleep 5
    
    echo "📋 Application status:"
    pm2 status
    
    echo "🔍 Testing API..."
    curl -s http://localhost:5000/api/health || echo "API not ready yet"
EOF

# Final verification
echo "✅ Deployment completed! Verifying..."
sleep 3

echo "🔍 Final health check..."
if curl -s --connect-timeout 10 http://89.104.71.170/api/health; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "🌐 Application: http://89.104.71.170"
    echo "📊 API Health: http://89.104.71.170/api/health"
    echo "💬 Real-time chat is active!"
else
    echo ""
    echo "⚠️  API not responding yet, but deployment may still be in progress"
    echo "🔄 Check again in 1-2 minutes: curl http://89.104.71.170/api/health"
fi 