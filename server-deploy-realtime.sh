#!/bin/bash

# Deploy script for Dance School App with Real-time Chat
set -e

echo "🚀 Starting deployment with Socket.io support..."

# Variables
SERVER_IP="89.104.71.170"
SERVER_USER="root"
SERVER_PASSWORD="FNctSC1tWxjU3AWL"
DEPLOY_DIR="/root/dance"
BACKUP_DIR="/root/dance-backup-$(date +%Y%m%d-%H%M%S)"
ARCHIVE_NAME=$(ls dance-realtime-deploy-*.tar.gz | head -n1)

echo "📦 Using archive: $ARCHIVE_NAME"

# Check if archive exists
if [ ! -f "$ARCHIVE_NAME" ]; then
    echo "❌ Archive not found: $ARCHIVE_NAME"
    exit 1
fi

# Create backup on server
echo "🔄 Creating backup on server..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << EOF
    if [ -d "$DEPLOY_DIR" ]; then
        echo "📂 Backing up existing deployment to $BACKUP_DIR"
        cp -r $DEPLOY_DIR $BACKUP_DIR
    fi
EOF

# Stop services
echo "⏹️ Stopping services..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
    # Stop PM2 processes
    pm2 stop all || true
    pm2 delete all || true
    
    # Kill any remaining node processes
    pkill -f "node.*dance" || true
    pkill -f "nodemon" || true
    
    # Wait a moment
    sleep 3
EOF

# Upload new archive
echo "📤 Uploading new deployment..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no "$ARCHIVE_NAME" $SERVER_USER@$SERVER_IP:/tmp/

# Deploy on server
echo "🔧 Deploying application..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << EOF
    set -e
    
    # Remove old deployment
    rm -rf $DEPLOY_DIR
    
    # Create new deployment directory
    mkdir -p $DEPLOY_DIR
    cd $DEPLOY_DIR
    
    # Extract archive
    echo "📂 Extracting archive..."
    tar -xzf /tmp/$ARCHIVE_NAME
    
    # Install dependencies
    echo "📦 Installing server dependencies..."
    npm install --production
    
    echo "📦 Installing client dependencies..."
    cd client
    npm install --production
    cd ..
    
    # Set production environment
    echo "🔧 Setting up environment..."
    echo "NODE_ENV=production" > .env
    echo "PORT=5000" >> .env
    echo "MONGODB_URI=mongodb://127.0.0.1:27017/dance-school" >> .env
    echo "JWT_SECRET=your-super-secret-jwt-key-production" >> .env
    
    # Create PM2 ecosystem file for Socket.io app
    cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'dance-school-api',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/root/logs/dance-api-error.log',
    out_file: '/root/logs/dance-api-out.log',
    log_file: '/root/logs/dance-api-combined.log',
    time: true,
    autorestart: true,
    restart_delay: 1000
  }]
};
EOFPM2
    
    # Create logs directory
    mkdir -p /root/logs
    
    # Start application with PM2
    echo "🚀 Starting application..."
    pm2 start ecosystem.config.js
    pm2 save
    
    # Setup nginx if not already configured
    if [ ! -f /etc/nginx/sites-available/dance-school ]; then
        echo "🌐 Setting up Nginx..."
        cat > /etc/nginx/sites-available/dance-school << 'EOFNGINX'
server {
    listen 80;
    server_name 89.104.71.170;

    # Serve static files
    location / {
        root /root/dance/client/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
        
        # Add headers for better caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Socket.io routes for real-time chat
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
EOFNGINX

        # Enable site
        ln -sf /etc/nginx/sites-available/dance-school /etc/nginx/sites-enabled/
        
        # Remove default site if exists
        rm -f /etc/nginx/sites-enabled/default
        
        # Test and reload nginx
        nginx -t && systemctl reload nginx
    else
        echo "✅ Nginx already configured"
        nginx -t && systemctl reload nginx
    fi
    
    # Cleanup
    rm -f /tmp/$ARCHIVE_NAME
    
    echo "✅ Deployment completed successfully!"
    echo "🌐 Application available at: http://89.104.71.170"
    echo "📊 API health check: http://89.104.71.170/api/health"
    echo "💬 Real-time chat is now enabled!"
    
    # Show PM2 status
    echo "📋 Application status:"
    pm2 status
    
    # Show recent logs
    echo "📝 Recent logs:"
    pm2 logs --lines 10
EOF

echo "🎉 Deployment completed successfully!"
echo "🌐 Application: http://89.104.71.170"
echo "📊 Health check: http://89.104.71.170/api/health"
echo "💬 Real-time chat is active!" 