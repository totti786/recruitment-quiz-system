#!/bin/bash

# Docker Setup Script for Recruitment Quiz System

set -e

echo "🚀 Recruitment Quiz System - Docker Setup"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Menu
echo "Select an option:"
echo "1) Development mode (with hot reload)"
echo "2) Production mode"
echo "3) Stop all containers"
echo "4) View logs"
echo "5) Reset database"
echo "6) Exit"
echo ""

read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "🔄 Starting in DEVELOPMENT mode..."
        docker-compose up --build -d
        echo ""
        echo "✅ Development server started!"
        echo ""
        echo "📍 Access URLs:"
        echo "   Client: http://localhost:5173"
        echo "   Server: http://localhost:3001"
        echo ""
        echo "📝 To view logs: docker-compose logs -f"
        echo "📝 To stop: docker-compose down"
        echo ""
        
        read -p "Initialize database with sample data? (y/n): " init_db
        if [[ $init_db == "y" || $init_db == "Y" ]]; then
            echo "⏳ Initializing database..."
            docker-compose exec server npx prisma migrate dev --name init
            docker-compose exec server npx prisma db seed
            echo "✅ Database initialized with sample data!"
        fi
        ;;
    
    2)
        echo ""
        echo "🔄 Starting in PRODUCTION mode..."
        docker-compose -f docker-compose.prod.yml up --build -d
        echo ""
        echo "✅ Production server started!"
        echo ""
        echo "📍 Access URLs:"
        echo "   Client: http://localhost"
        echo "   Server: http://localhost:3001"
        echo ""
        
        read -p "Initialize database with sample data? (y/n): " init_db
        if [[ $init_db == "y" || $init_db == "Y" ]]; then
            echo "⏳ Initializing database..."
            docker-compose -f docker-compose.prod.yml exec server npx prisma migrate deploy
            docker-compose -f docker-compose.prod.yml exec server npx prisma db seed
            echo "✅ Database initialized with sample data!"
        fi
        ;;
    
    3)
        echo ""
        echo "🛑 Stopping all containers..."
        docker-compose down
        docker-compose -f docker-compose.prod.yml down
        echo "✅ All containers stopped!"
        ;;
    
    4)
        echo ""
        echo "📜 Viewing logs (press Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    
    5)
        echo ""
        echo "⚠️  WARNING: This will DELETE all data in the database!"
        read -p "Are you sure? (yes/no): " confirm
        if [[ $confirm == "yes" ]]; then
            echo "🗑️  Resetting database..."
            docker-compose exec server npx prisma migrate reset --force
            echo "✅ Database reset complete!"
        else
            echo "❌ Cancelled"
        fi
        ;;
    
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac