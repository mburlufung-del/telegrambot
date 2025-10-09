#!/bin/bash

# Telegram Bot VPS Deployment Script
# One-command deployment for Hostinger VPS

set -e

echo "=========================================="
echo "  Telegram Bot Multi-Instance Deployment"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root or use: sudo bash deploy-vps.sh"
    exit 1
fi

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Create directory and clone repository
echo ""
echo "📥 Cloning repository..."
mkdir -p /var/www
cd /var/www

# Remove existing directory if present
if [ -d "telegrambot" ]; then
    echo "🗑️  Removing existing telegrambot directory..."
    rm -rf telegrambot
fi

git clone https://github.com/mburlufung-del/telegrambot.git
cd telegrambot

# Create .env.docker from example
cp .env.docker.example .env.docker

echo ""
echo "=========================================="
echo "  ✅ Installation Complete!"
echo "=========================================="
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. Add your bot tokens:"
echo "   nano /var/www/telegrambot/.env.docker"
echo ""
echo "2. Deploy all bots:"
echo "   cd /var/www/telegrambot"
echo "   docker-compose --env-file .env.docker up -d"
echo ""
echo "3. View logs:"
echo "   docker-compose logs -f"
echo ""
echo "4. Access dashboards:"
echo "   http://$(curl -s ifconfig.me):5001 (Bot 1)"
echo "   http://$(curl -s ifconfig.me):5002 (Bot 2)"
echo "   ... through port 5010 (Bot 10)"
echo ""
echo "=========================================="
