#!/bin/bash

# Multi-Bot Setup Validation Script
# This script checks if your bot tokens are properly configured

echo "🤖 TeleShop Multi-Bot Setup Validator"
echo "======================================"
echo ""

# Check if .env.docker exists
if [ ! -f ".env.docker" ]; then
    echo "❌ .env.docker file not found!"
    echo ""
    echo "📝 To create it, run:"
    echo "   cp .env.docker.example .env.docker"
    echo "   nano .env.docker"
    echo ""
    exit 1
fi

echo "✅ .env.docker file found"
echo ""

# Function to check if a token is configured
check_token() {
    local bot_num=$1
    local token=$(grep "^BOT${bot_num}_TOKEN=" .env.docker | cut -d '=' -f 2)
    
    if [ -z "$token" ]; then
        echo "❌ Bot $bot_num: No token found"
        return 1
    elif [[ "$token" == *"your_bot"* ]] || [[ "$token" == *"token_here"* ]]; then
        echo "⚠️  Bot $bot_num: Placeholder token (not configured)"
        return 2
    else
        # Basic token format validation (should have : separator)
        if [[ "$token" == *":"* ]]; then
            local token_preview="${token:0:15}...${token: -8}"
            echo "✅ Bot $bot_num: Configured ($token_preview)"
            return 0
        else
            echo "❌ Bot $bot_num: Invalid token format"
            return 1
        fi
    fi
}

# Check all 10 bots
echo "🔍 Checking Bot Tokens:"
echo "----------------------"

configured_count=0
placeholder_count=0
missing_count=0

for i in {1..10}; do
    check_token $i
    result=$?
    if [ $result -eq 0 ]; then
        ((configured_count++))
    elif [ $result -eq 2 ]; then
        ((placeholder_count++))
    else
        ((missing_count++))
    fi
done

echo ""
echo "📊 Summary:"
echo "----------"
echo "✅ Configured: $configured_count bots"
echo "⚠️  Placeholder: $placeholder_count bots"
echo "❌ Missing: $missing_count bots"
echo ""

# Check PUBLIC_URL
public_url=$(grep "^PUBLIC_URL=" .env.docker | cut -d '=' -f 2)
if [ -z "$public_url" ] || [[ "$public_url" == *"YOUR_VPS_IP"* ]]; then
    echo "⚠️  PUBLIC_URL not configured (using placeholder)"
    echo "   Current: $public_url"
    echo "   Should be: http://72.60.20.38 (or your actual domain)"
    echo ""
else
    echo "✅ PUBLIC_URL configured: $public_url"
    echo ""
fi

# Show next steps
if [ $configured_count -eq 0 ]; then
    echo "🚨 No bots configured!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Edit .env.docker: nano .env.docker"
    echo "2. Add at least one bot token from @BotFather"
    echo "3. Save and run this script again"
    echo ""
elif [ $configured_count -lt 10 ]; then
    echo "✨ You have $configured_count bot(s) configured!"
    echo ""
    echo "🚀 To deploy configured bots:"
    
    if [ $configured_count -eq 1 ]; then
        echo "   docker-compose --env-file .env.docker up -d postgres bot1"
    elif [ $configured_count -eq 2 ]; then
        echo "   docker-compose --env-file .env.docker up -d postgres bot1 bot2"
    elif [ $configured_count -eq 3 ]; then
        echo "   docker-compose --env-file .env.docker up -d postgres bot1 bot2 bot3"
    else
        # Build the command dynamically
        bots="postgres"
        for i in $(seq 1 $configured_count); do
            bots="$bots bot$i"
        done
        echo "   docker-compose --env-file .env.docker up -d $bots"
    fi
    
    echo ""
    echo "📝 To add more bots:"
    echo "1. Get tokens from @BotFather"
    echo "2. Edit .env.docker: nano .env.docker"
    echo "3. Add tokens for bots $((configured_count + 1)) through 10"
    echo "4. Deploy new bots: docker-compose --env-file .env.docker up -d botX"
    echo ""
else
    echo "🎉 All 10 bots are configured!"
    echo ""
    echo "🚀 To deploy all bots:"
    echo "   docker-compose --env-file .env.docker up -d"
    echo ""
    echo "📊 To check status:"
    echo "   docker-compose ps"
    echo ""
    echo "📝 To view logs:"
    echo "   docker-compose logs -f"
    echo ""
fi

# Check if docker is running
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        echo "✅ Docker is running"
        
        # Check if any bots are currently running
        running_bots=$(docker ps --filter "name=telegrambot-bot" --format "{{.Names}}" | wc -l)
        if [ $running_bots -gt 0 ]; then
            echo ""
            echo "🤖 Currently running bots:"
            docker ps --filter "name=telegrambot-bot" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        fi
    else
        echo "⚠️  Docker is installed but not running"
        echo "   Start it with: sudo systemctl start docker"
    fi
else
    echo "⚠️  Docker is not installed"
    echo "   Install it with: curl -fsSL https://get.docker.com | sh"
fi

echo ""
echo "======================================"
echo "For detailed setup guide, see: MULTI_BOT_SETUP.md"
echo "======================================"
