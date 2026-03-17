#!/bin/bash

# Seed script for initial data
# This script creates initial data for all services

set -e

echo "🌱 Starting data seeding..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run seed for a service
run_seed() {
    local service_name=$1
    local database_url=$2
    local service_path=$3
    
    echo -e "${BLUE}🌱 Seeding data for ${service_name}...${NC}"
    
    cd "$service_path"
    
    # Run seed script
    if [ -f "prisma/seed.ts" ]; then
        echo -e "${YELLOW}🔄 Running seed script for ${service_name}...${NC}"
        DATABASE_URL="$database_url" npx ts-node prisma/seed.ts
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Seeding successful for ${service_name}${NC}"
        else
            echo -e "${RED}❌ Seeding failed for ${service_name}${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  No seed script found for ${service_name}${NC}"
    fi
    
    cd - > /dev/null
}

# Wait for all services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"

# Check API Gateway
while ! curl -f http://api-gateway:3000/health > /dev/null 2>&1; do
    echo -e "${YELLOW}API Gateway is not ready yet. Waiting...${NC}"
    sleep 2
done

echo -e "${GREEN}✅ API Gateway is ready!${NC}"

# Run seeds for each service
run_seed "Auth Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_auth" \
    "./services/auth-service"

run_seed "Workflow Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_workflows" \
    "./services/workflow-service"

run_seed "Trigger Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_triggers" \
    "./services/trigger-service"

run_seed "Action Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_actions" \
    "./services/action-service"

run_seed "Notification Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_notifications" \
    "./services/notification-service"

echo -e "${GREEN}🎉 All seeding completed successfully!${NC}"
