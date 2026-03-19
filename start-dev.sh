#!/bin/bash

# Local Development Startup Script
# This script sets up and starts the mini-Zapier platform for local development

set -e

echo "🚀 Starting mini-Zapier Local Development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose is available${NC}"
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
        if [ -f ".env.prod" ]; then
            cp .env.prod .env
            echo -e "${YELLOW}📝 Please update .env file with your local configuration${NC}"
        else
            echo -e "${RED}❌ No .env template found. Please create .env file manually.${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✅ .env file exists${NC}"
}

# Function to stop existing services
stop_existing_services() {
    echo -e "${BLUE}🛑 Stopping existing services...${NC}"
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    echo -e "${GREEN}✅ Existing services stopped${NC}"
}

# Function to clean up old containers and volumes
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up old containers and volumes...${NC}"
    docker system prune -f
    docker volume prune -f
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to start services
start_services() {
    echo -e "${BLUE}🐳 Starting services...${NC}"
    
    # Start database and Redis first
    echo -e "${YELLOW}📊 Starting PostgreSQL and Redis...${NC}"
    docker-compose -f docker-compose.dev.yml up -d postgres redis
    
    # Wait for databases to be ready
    echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
    sleep 10
    
    # Check database health
    echo -e "${YELLOW}🔍 Checking database health...${NC}"
    for i in {1..30}; do
        if docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ PostgreSQL failed to start${NC}"
            exit 1
        fi
        sleep 2
    done
    
    # Check Redis health
    for i in {1..30}; do
        if docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Redis is ready${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Redis failed to start${NC}"
            exit 1
        fi
        sleep 2
    done
    
    # Run database migrations
    echo -e "${YELLOW}🔄 Running database migrations...${NC}"
    sleep 5
    
    # Start all services
    echo -e "${YELLOW}🚀 Starting all services...${NC}"
    docker-compose -f docker-compose.dev.yml up -d
    
    echo -e "${GREEN}✅ All services started${NC}"
}

# Function to wait for services to be healthy
wait_for_services() {
    echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
    
    services=(
        "api-gateway:3000"
        "auth-service:3001"
        "workflow-service:3002"
        "execution-service:3003"
        "trigger-service:3004"
        "action-service:3005"
        "notification-service:3006"
        "frontend:3007"
    )
    
    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d: -f1)
        service_port=$(echo $service | cut -d: -f2)
        
        echo -e "${YELLOW}🔍 Checking $service_name...${NC}"
        
        for i in {1..60}; do
            if curl -f -s http://localhost:$service_port/health > /dev/null 2>&1; then
                echo -e "${GREEN}✅ $service_name is healthy${NC}"
                break
            fi
            if [ $i -eq 60 ]; then
                echo -e "${RED}❌ $service_name failed to become healthy${NC}"
                echo -e "${YELLOW}📋 Check logs: docker-compose -f docker-compose.dev.yml logs $service_name${NC}"
            fi
            sleep 2
        done
    done
}

# Function to display service URLs
display_urls() {
    echo -e ""
    echo -e "${GREEN}🎉 Mini-Zapier is now running locally!${NC}"
    echo -e ""
    echo -e "${BLUE}📱 Service URLs:${NC}"
    echo -e "  🌐 Frontend:        http://localhost:3007"
    echo -e "  🔗 API Gateway:     http://localhost:3000"
    echo -e "  📚 API Docs:        http://localhost:3000/api/docs"
    echo -e "  🔐 Auth Service:    http://localhost:3001"
    echo -e "  ⚙️  Workflow Svc:   http://localhost:3002"
    echo -e "  🚀 Execution Svc:   http://localhost:3003"
    echo -e "  🎯 Trigger Svc:     http://localhost:3004"
    echo -e "  📧 Action Svc:      http://localhost:3005"
    echo -e "  📢 Notification Svc: http://localhost:3006"
    echo -e ""
    echo -e "${BLUE}🗄️  Database URLs:${NC}"
    echo -e "  🐘 PostgreSQL:       postgresql://postgres:postgres@localhost:5432/minizapier"
    echo -e "  🔴 Redis:           redis://localhost:6379"
    echo -e ""
    echo -e "${BLUE}🔧 Useful Commands:${NC}"
    echo -e "  📋 View logs:        docker-compose -f docker-compose.dev.yml logs -f"
    echo -e "  🔄 Restart services: docker-compose -f docker-compose.dev.yml restart"
    echo -e "  🛑 Stop services:    docker-compose -f docker-compose.dev.yml down"
    echo -e "  🧹 Clean up:         docker-compose -f docker-compose.dev.yml down -v"
    echo -e ""
    echo -e "${YELLOW}⚠️  First time setup:${NC}"
    echo -e "  1. Open http://localhost:3007 in your browser"
    echo -e "  2. Register a new account or use OAuth"
    echo -e "  3. Create your first workflow"
    echo -e "  4. Test integrations (webhooks, email, Telegram)"
    echo -e ""
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Showing service logs...${NC}"
    docker-compose -f docker-compose.dev.yml logs -f
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    check_docker
    check_docker_compose
    check_env_file
    
    # Parse command line arguments
    case "${1:-}" in
        "clean")
            echo -e "${BLUE}🧹 Cleaning up...${NC}"
            stop_existing_services
            cleanup
            exit 0
            ;;
        "logs")
            show_logs
            exit 0
            ;;
        "stop")
            echo -e "${BLUE}🛑 Stopping services...${NC}"
            docker-compose -f docker-compose.dev.yml down
            echo -e "${GREEN}✅ Services stopped${NC}"
            exit 0
            ;;
        "restart")
            echo -e "${BLUE}🔄 Restarting services...${NC}"
            stop_existing_services
            start_services
            wait_for_services
            display_urls
            exit 0
            ;;
        "help"|"-h"|"--help")
            echo -e "${BLUE}📖 Usage: $0 [command]${NC}"
            echo -e ""
            echo -e "${YELLOW}Commands:${NC}"
            echo -e "  (no args)  Start all services"
            echo -e "  clean      Clean up containers and volumes"
            echo -e "  logs       Show service logs"
            echo -e "  stop       Stop all services"
            echo -e "  restart    Restart all services"
            echo -e "  help       Show this help message"
            echo -e ""
            exit 0
            ;;
        "")
            # Default behavior - start services
            stop_existing_services
            start_services
            wait_for_services
            display_urls
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo -e "${YELLOW}Use '$0 help' for available commands${NC}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
