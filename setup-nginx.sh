#!/bin/bash

set -e

echo "=================================================="
echo "   Nginx Configuration for Admin Dashboard"
echo "=================================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (use: sudo bash setup-nginx.sh)${NC}"
  exit 1
fi

# Prompt for domain
echo -e "${YELLOW}Enter your domain name (e.g., shop.example.com):${NC}"
read DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain name cannot be empty!${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating Nginx configuration...${NC}"

# Create Nginx config
cat > /etc/nginx/sites-available/teleshop <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

echo -e "${YELLOW}Enabling Nginx site...${NC}"
ln -sf /etc/nginx/sites-available/teleshop /etc/nginx/sites-enabled/

echo -e "${YELLOW}Testing Nginx configuration...${NC}"
nginx -t

echo -e "${YELLOW}Reloading Nginx...${NC}"
systemctl reload nginx

echo ""
echo -e "${GREEN}✓ Nginx configured successfully!${NC}"
echo ""
echo "=================================================="
echo "Next Steps:"
echo "=================================================="
echo "1. Point your domain ($DOMAIN) to this server's IP"
echo "2. Wait for DNS propagation (can take up to 24 hours)"
echo "3. Install SSL certificate:"
echo ""
echo "   apt install certbot python3-certbot-nginx -y"
echo "   certbot --nginx -d $DOMAIN"
echo ""
echo "Your admin dashboard will be accessible at:"
echo "   http://$DOMAIN"
echo "=================================================="
