#!/bin/bash

echo ""
echo "========================================"
echo "    VIEW APP - Starting Application"
echo "========================================"
echo ""

echo "Starting Backend Server..."
cd backend && npm start &
BACKEND_PID=$!

echo ""
echo "Waiting 5 seconds for backend to start..."
sleep 5

echo "Starting Frontend Application..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "    Both services are starting..."
echo "========================================"
echo ""
echo "Backend: http://localhost:4001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Services are running in background."
echo "To stop services, run: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Wait for user input to stop services
read -p "Press Enter to stop all services..."
echo "Stopping services..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "Services stopped."
