#!/bin/bash

# Sistema de Votación - Setup Script
# This script helps set up the application

echo "=========================================="
echo "Sistema de Votación Enterprise v3.0.0"
echo "Setup Script"
echo "=========================================="
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✓ Node.js $(node -v) found"

# Check PostgreSQL
echo "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client is not installed. Please install PostgreSQL 13+."
    exit 1
fi

echo "✓ PostgreSQL client found"

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✓ Backend dependencies installed"

# Create .env file if it doesn't exist
echo ""
if [ ! -f ../.env ]; then
    echo "Creating .env file from template..."
    cp ../.env.example ../.env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your database credentials"
    echo "   File location: .env"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "=========================================="
echo "Setup completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Create PostgreSQL database:"
echo "   createdb votacion_db"
echo ""
echo "2. Run database schema:"
echo "   psql -U postgres -d votacion_db -f backend/database/schema.sql"
echo ""
echo "3. Edit .env file with your database credentials"
echo ""
echo "4. Start the server:"
echo "   cd backend && npm start"
echo ""
echo "5. Access the application:"
echo "   http://localhost:3000"
echo ""
echo "Default admin credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "=========================================="
