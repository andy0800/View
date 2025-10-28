#!/bin/bash
# =============================================================================
# EXECUTE 24-HOUR REWARD SYSTEM DATABASE CHANGES
# Bash Script for Linux/Mac
# =============================================================================

set -e  # Exit on error

echo "=============================================================================="
echo "  24-HOUR REWARD SYSTEM - DATABASE DEPLOYMENT"
echo "=============================================================================="
echo ""

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "📁 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  No .env file found. Using system environment variables."
fi

# Get database credentials from environment
DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASS="${DB_PASS}"

# Validate required environment variables
echo ""
echo "🔍 Validating database credentials..."

if [ -z "$DB_HOST" ]; then
    echo "❌ ERROR: DB_HOST not set in environment"
    exit 1
fi

if [ -z "$DB_PORT" ]; then
    DB_PORT="5432"
    echo "⚠️  DB_PORT not set, using default: 5432"
fi

if [ -z "$DB_NAME" ]; then
    echo "❌ ERROR: DB_NAME not set in environment"
    exit 1
fi

if [ -z "$DB_USER" ]; then
    echo "❌ ERROR: DB_USER not set in environment"
    exit 1
fi

if [ -z "$DB_PASS" ]; then
    echo "❌ ERROR: DB_PASS not set in environment"
    exit 1
fi

echo "✅ All required credentials found"
echo ""

# Display connection details (mask password)
echo "📊 Database Connection Details:"
echo "  Host:     $DB_HOST"
echo "  Port:     $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo "  Password: ********"
echo ""

# Check if psql is installed
echo "🔍 Checking for PostgreSQL client (psql)..."
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql command not found!"
    echo ""
    echo "Please install PostgreSQL client tools:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  CentOS/RHEL:   sudo yum install postgresql"
    echo "  macOS:         brew install postgresql"
    echo ""
    exit 1
fi

echo "✅ psql found at: $(which psql)"
echo ""

# Check if SQL file exists
SQL_FILE="$(dirname "$0")/add-24hr-reward-system.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ ERROR: SQL file not found at: $SQL_FILE"
    exit 1
fi

echo "✅ SQL file found: add-24hr-reward-system.sql"
echo ""

# Confirm execution
echo "=============================================================================="
echo "⚠️  WARNING: This will modify your production database!"
echo "=============================================================================="
echo ""
echo "This script will:"
echo "  • Add performance indexes for 24-hour reward system"
echo "  • Update completed_at timestamps for existing records"
echo "  • Enable recurring daily rewards for users"
echo ""

read -p "Are you sure you want to proceed? (yes/no): " confirmation
if [ "$confirmation" != "yes" ]; then
    echo ""
    echo "❌ Deployment cancelled by user"
    exit 0
fi

echo ""
echo "=============================================================================="
echo "  EXECUTING DATABASE CHANGES..."
echo "=============================================================================="
echo ""

# Set PGPASSWORD environment variable for authentication
export PGPASSWORD="$DB_PASS"

# Execute the SQL file
echo "🚀 Executing SQL script..."
echo ""

# Execute psql command with SSL mode
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE" --set=sslmode=require; then
    echo ""
    echo "=============================================================================="
    echo "  ✅ DATABASE CHANGES COMPLETED SUCCESSFULLY!"
    echo "=============================================================================="
    echo ""
    echo "📋 Next Steps:"
    echo "  1. ✅ Database indexes created"
    echo "  2. ⏳ Deploy updated backend code"
    echo "  3. ⏳ Restart backend server"
    echo "  4. ⏳ Test 24-hour reward functionality"
    echo ""
    echo "🎉 Users can now earn rewards every 24 hours!"
    echo ""
else
    echo ""
    echo "❌ ERROR: SQL execution failed"
    echo ""
    exit 1
fi

# Clear password from environment
unset PGPASSWORD

echo "=============================================================================="
echo "  DEPLOYMENT COMPLETE"
echo "=============================================================================="

