# 🚀 VIEW APP - Startup Guide

## 📋 **Quick Start Options**

### **Option 1: NPM Scripts (Recommended)**
```bash
# Start backend only
npm start

# Start both backend and frontend
npm run dev

# Start services separately
npm run start:backend
npm run start:frontend
```

### **Option 2: Windows Batch File**
```bash
# Double-click or run:
start.bat
```

### **Option 3: PowerShell Script**
```bash
# Run in PowerShell:
.\start.ps1
```

### **Option 4: Unix/Linux/Mac Shell Script**
```bash
# Make executable and run:
chmod +x start.sh
./start.sh
```

### **Option 5: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🔧 **Prerequisites**

### **1. Install Dependencies**
```bash
npm run install:all
```

### **2. Database Setup**
```bash
npm run setup
```

### **3. Environment Variables**
Ensure your `.env` file is configured in the backend directory.

---

## 🌐 **Service URLs**

| Service | URL | Port | Status |
|---------|-----|-------|---------|
| **Backend API** | http://localhost:4001 | 4001 | ✅ Running |
| **Frontend App** | http://localhost:5173 | 5173 | ✅ Running |
| **Database** | localhost:5432 | 5432 | ✅ Running |

---

## 🚨 **Troubleshooting**

### **Port Already in Use**
```bash
# Windows
netstat -ano | findstr :4001
netstat -ano | findstr :5173

# Mac/Linux
lsof -i :4001
lsof -i :5173
```

### **Database Issues**
```bash
npm run setup
```

### **Dependencies Issues**
```bash
npm run install:all
```

### **Permission Issues (Unix)**
```bash
chmod +x start.sh
```

---

## 📁 **File Structure**

```
View/
├── start.bat          # Windows batch file
├── start.ps1          # PowerShell script
├── start.sh           # Unix shell script
├── package.json       # Root package with scripts
├── README.md          # Main documentation
├── STARTUP_GUIDE.md   # This file
├── backend/           # Node.js API server
└── frontend/          # React frontend app
```

---

## 🎯 **Development Workflow**

### **1. Daily Development**
```bash
npm run dev
```

### **2. Backend Development Only**
```bash
npm start
```

### **3. Frontend Development Only**
```bash
npm run start:frontend
```

### **4. Database Reset**
```bash
npm run setup
```

---

## 🔍 **Verification**

### **Backend Health Check**
```bash
curl http://localhost:4001/health
# Should return: {"status":"ok"}
```

### **Frontend Check**
- Open http://localhost:5173 in browser
- Should see VIEW APP interface

### **Database Check**
- Backend should connect without errors
- No "Connection refused" messages

---

## 💡 **Pro Tips**

1. **Use `npm run dev`** for full-stack development
2. **Use `npm start`** for backend-only work
3. **Keep database running** - don't stop PostgreSQL
4. **Check ports** if services won't start
5. **Use `npm run setup`** to reset database state

---

## 📞 **Support**

If you encounter issues:
1. Check this guide first
2. Verify all prerequisites are met
3. Check terminal output for error messages
4. Ensure no other services are using the ports

---

**Happy Coding! 🎉**
