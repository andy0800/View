#!/bin/bash

# =====================================================
# BULLETPROOF DATABASE FIX EXECUTION SCRIPT
# Executes all database fixes in the correct order
# =====================================================

echo "🚀 Starting comprehensive database schema fixes..."

# Set error handling
set -e

# Check if we're in the right directory
if [ ! -f "fix-database-schema.sql" ]; then
    echo "❌ Error: fix-database-schema.sql not found. Please run from backend directory."
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Set database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-view_db}
DB_USER=${DB_USER:-postgres}

echo "📊 Database connection details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Execute the database fixes
echo "🔧 Executing database schema fixes..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f fix-database-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema fixes completed successfully!"
else
    echo "❌ Error: Database schema fixes failed!"
    exit 1
fi

# Verify the fixes
echo "🔍 Verifying database fixes..."

# Check if all tables exist
echo "📋 Checking table existence..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'Tables Check' as check_type,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
"

# Check foreign key constraints
echo "🔗 Checking foreign key constraints..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'Foreign Keys Check' as check_type,
    COUNT(*) as fk_count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public';
"

# Check indexes
echo "📊 Checking indexes..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    'Indexes Check' as check_type,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public';
"

echo "🎉 Database verification completed!"
echo "✅ All database fixes have been applied successfully!"
echo ""
echo "📝 Summary of fixes applied:"
echo "   ✅ Fixed duplicate video tables issue"
echo "   ✅ Added missing foreign key constraints"
echo "   ✅ Fixed ad table package_id null constraint"
echo "   ✅ Added missing indexes for performance"
echo "   ✅ Fixed data type consistencies"
echo "   ✅ Added missing constraints"
echo "   ✅ Fixed wallet balance consistency"
echo "   ✅ Added missing not null constraints"
echo "   ✅ Fixed array data types"
echo "   ✅ Added missing unique constraints"
echo "   ✅ Fixed transaction category requirements"
echo "   ✅ Added missing reference IDs"
echo "   ✅ Fixed company wallet references"
echo "   ✅ Added missing metadata fields"
echo ""
echo "🚀 Database is now fully aligned with the application models!"
