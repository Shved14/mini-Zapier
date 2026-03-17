#!/bin/bash

# Migration script for all databases
# This script runs Prisma migrations for all services

set -e

echo "🚀 Starting database migrations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run migration for a service
run_migration() {
    local service_name=$1
    local database_url=$2
    local service_path=$3
    
    echo -e "${BLUE}📦 Running migration for ${service_name}...${NC}"
    
    cd "$service_path"
    
    # Generate Prisma client
    echo -e "${YELLOW}🔧 Generating Prisma client for ${service_name}...${NC}"
    npx prisma generate
    
    # Run database push (for production)
    echo -e "${YELLOW}🔄 Pushing database schema for ${service_name}...${NC}"
    DATABASE_URL="$database_url" npx prisma db push --accept-data-loss
    
    # Check if migration was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migration successful for ${service_name}${NC}"
    else
        echo -e "${RED}❌ Migration failed for ${service_name}${NC}"
        exit 1
    fi
    
    cd - > /dev/null
}

# Wait for PostgreSQL to be ready
echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
while ! pg_isready -h postgres -U postgres -p 5432; do
    echo -e "${YELLOW}PostgreSQL is not ready yet. Waiting...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"

# Run migrations for each service
run_migration "Auth Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_auth" \
    "./services/auth-service"

run_migration "Workflow Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_workflows" \
    "./services/workflow-service"

run_migration "Execution Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_executions" \
    "./services/execution-service"

run_migration "Trigger Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_triggers" \
    "./services/trigger-service"

run_migration "Action Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_actions" \
    "./services/action-service"

run_migration "Notification Service" \
    "postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/minizapier_notifications" \
    "./services/notification-service"

echo -e "${GREEN}🎉 All migrations completed successfully!${NC}"
