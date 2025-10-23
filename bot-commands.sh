#!/bin/bash

# TeleShop Multi-Bot Command Reference
# Quick commands for managing your 10 Telegram bots

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     TeleShop Multi-Bot Management Commands               ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Usage: ./bot-commands.sh [command] [bot_number]"
    echo ""
    echo -e "${GREEN}Setup Commands:${NC}"
    echo "  setup              - Initial setup (copy and edit config)"
    echo "  validate           - Check if tokens are configured correctly"
    echo ""
    echo -e "${GREEN}Deployment Commands:${NC}"
    echo "  deploy-all         - Deploy all 10 bots"
    echo "  deploy [1-10]      - Deploy specific bot (e.g., deploy 2)"
    echo "  deploy-range [n]   - Deploy bots 1 through n (e.g., deploy-range 5)"
    echo ""
    echo -e "${GREEN}Status Commands:${NC}"
    echo "  status             - Show all running bots"
    echo "  logs [1-10]        - View logs for specific bot"
    echo "  logs-all           - View logs for all bots"
    echo ""
    echo -e "${GREEN}Management Commands:${NC}"
    echo "  restart [1-10]     - Restart specific bot"
    echo "  restart-all        - Restart all bots"
    echo "  stop [1-10]        - Stop specific bot"
    echo "  stop-all           - Stop all bots"
    echo ""
    echo -e "${GREEN}Maintenance Commands:${NC}"
    echo "  update             - Pull latest code and rebuild"
    echo "  clean              - Stop and remove everything"
    echo "  rebuild            - Rebuild without cache"
    echo ""
    echo -e "${GREEN}Dashboard URLs:${NC}"
    echo "  urls               - Show all dashboard URLs"
    echo ""
}

case "$1" in
    setup)
        echo -e "${YELLOW}Setting up multi-bot configuration...${NC}"
        if [ ! -f ".env.docker" ]; then
            cp .env.docker.example .env.docker
            echo -e "${GREEN}✓ Created .env.docker from template${NC}"
            echo ""
            echo "Edit the file to add your bot tokens:"
            echo "  nano .env.docker"
        else
            echo -e "${YELLOW}⚠ .env.docker already exists${NC}"
            echo "Edit it with: nano .env.docker"
        fi
        ;;
        
    validate)
        echo -e "${YELLOW}Validating bot configuration...${NC}"
        ./check-bot-setup.sh
        ;;
        
    deploy-all)
        echo -e "${YELLOW}Deploying all bots...${NC}"
        docker-compose --env-file .env.docker up -d
        echo -e "${GREEN}✓ Deployment complete${NC}"
        ;;
        
    deploy)
        if [ -z "$2" ]; then
            echo -e "${YELLOW}Usage: ./bot-commands.sh deploy [1-10]${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Deploying bot $2...${NC}"
        docker-compose --env-file .env.docker up -d bot$2
        echo -e "${GREEN}✓ Bot $2 deployed${NC}"
        ;;
        
    deploy-range)
        if [ -z "$2" ]; then
            echo -e "${YELLOW}Usage: ./bot-commands.sh deploy-range [n]${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Deploying bots 1 through $2...${NC}"
        bots="postgres"
        for i in $(seq 1 $2); do
            bots="$bots bot$i"
        done
        docker-compose --env-file .env.docker up -d $bots
        echo -e "${GREEN}✓ Bots 1-$2 deployed${NC}"
        ;;
        
    status)
        echo -e "${YELLOW}Checking bot status...${NC}"
        docker-compose ps
        ;;
        
    logs)
        if [ -z "$2" ]; then
            echo -e "${YELLOW}Usage: ./bot-commands.sh logs [1-10]${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Showing logs for bot $2...${NC}"
        docker-compose logs -f bot$2
        ;;
        
    logs-all)
        echo -e "${YELLOW}Showing logs for all bots...${NC}"
        docker-compose logs -f
        ;;
        
    restart)
        if [ -z "$2" ]; then
            echo -e "${YELLOW}Usage: ./bot-commands.sh restart [1-10]${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Restarting bot $2...${NC}"
        docker-compose restart bot$2
        echo -e "${GREEN}✓ Bot $2 restarted${NC}"
        ;;
        
    restart-all)
        echo -e "${YELLOW}Restarting all bots...${NC}"
        docker-compose restart
        echo -e "${GREEN}✓ All bots restarted${NC}"
        ;;
        
    stop)
        if [ -z "$2" ]; then
            echo -e "${YELLOW}Usage: ./bot-commands.sh stop [1-10]${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Stopping bot $2...${NC}"
        docker-compose stop bot$2
        echo -e "${GREEN}✓ Bot $2 stopped${NC}"
        ;;
        
    stop-all)
        echo -e "${YELLOW}Stopping all bots...${NC}"
        docker-compose down
        echo -e "${GREEN}✓ All bots stopped${NC}"
        ;;
        
    update)
        echo -e "${YELLOW}Updating and rebuilding...${NC}"
        git pull
        docker-compose build
        docker-compose --env-file .env.docker up -d
        echo -e "${GREEN}✓ Update complete${NC}"
        ;;
        
    clean)
        echo -e "${YELLOW}Stopping and cleaning up...${NC}"
        docker-compose down -v
        echo -e "${GREEN}✓ Cleanup complete${NC}"
        ;;
        
    rebuild)
        echo -e "${YELLOW}Rebuilding without cache...${NC}"
        docker-compose build --no-cache
        docker-compose --env-file .env.docker up -d
        echo -e "${GREEN}✓ Rebuild complete${NC}"
        ;;
        
    urls)
        echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║           Bot Dashboard URLs                              ║${NC}"
        echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
        echo ""
        for i in {1..10}; do
            echo -e "${GREEN}Bot $i:${NC}  http://72.60.20.38:500$i"
        done
        echo ""
        ;;
        
    *)
        show_help
        ;;
esac
