#!/bin/bash

# AWE Self-Hosted Firecrawl Startup Script

set -e

echo "🔥 Starting AWE Self-Hosted Firecrawl..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.sample..."
    cp .env.sample .env
    echo "⚠️  Please edit .env with your configuration before continuing."
    echo "   Especially change the BULL_AUTH_KEY for security!"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Pull or build images
echo "📦 Building Firecrawl services..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if API is responding
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Firecrawl is running at http://localhost:3002"
    echo ""
    echo "📊 Admin Panel: http://localhost:3002/admin"
    echo "   Username: bull"
    echo "   Password: Check BULL_AUTH_KEY in your .env file"
    echo ""
    echo "🔧 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
else
    echo "⚠️  API is not responding yet. Check logs with: docker-compose logs"
fi