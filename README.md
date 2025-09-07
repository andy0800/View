# VIEW APP - Ad Rewards Platform

A comprehensive advertising platform where viewers earn rewards for watching ads and advertisers can promote their content.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0
- PostgreSQL database

### Installation
```bash
# Install all dependencies
npm run install:all

# Setup database
npm run setup

# Start both services
npm run dev
```

## 📋 Available Scripts

### Development
- `npm run dev` - Start both backend and frontend (with process cleanup)
- `npm run dev:backend` - Start only backend
- `npm run dev:frontend` - Start only frontend

### Process Management
- `npm run clean` - Stop all services and clean up processes
- `npm run kill:all` - Kill all Node.js processes
- `npm run kill:backend` - Kill backend process on port 4001
- `npm run kill:frontend` - Kill frontend process on port 5173

### Database
- `npm run setup` - Setup/reset database
- `npm run reset` - Reset database

### Build
- `npm run build` - Build frontend for production

## 🌐 Service URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4001

## 🛠️ Troubleshooting

### Port Already in Use (EADDRINUSE)
If you encounter port conflicts:

```bash
# Clean up all processes
npm run clean

# Or manually kill processes
npm run kill:all
```

### Multiple Node Processes
If you see multiple Node.js processes running:

```bash
# Kill all Node processes
npm run kill:all

# Start fresh
npm run dev
```

### Process Cleanup Commands
```bash
# Windows
taskkill /F /IM node.exe

# Check what's using port 4001
netstat -ano | findstr :4001

# Kill process by PID
taskkill /PID <PID> /F
```

## 📁 Project Structure

```
View/
├── backend/          # Node.js/Express backend
├── frontend/         # React frontend
├── start.bat         # Windows startup script
├── start.ps1         # PowerShell startup script
└── start.sh          # Unix/Linux startup script
```

## 🔧 Development Workflow

1. **Start Development:**
   ```bash
   npm run dev
   ```

2. **Stop All Services:**
   ```bash
   npm run clean
   ```

3. **Restart Services:**
   ```bash
   npm run clean && npm run dev
   ```

## 📱 Features

- **Advertiser Interface:** Package management, ad creation, analytics
- **Viewer Interface:** Video watching, reward earning, withdrawal
- **Real-time Statistics:** Live dashboard updates
- **Multi-language Support:** English and Arabic
- **Secure Authentication:** JWT-based auth with session management

## 🚨 Important Notes

- **Always use `npm run clean`** before starting services to prevent conflicts
- **Check for existing processes** if you encounter port issues
- **Use the startup scripts** for consistent service management
- **Database setup required** before first run

## 📞 Support

For issues related to:
- **Process conflicts:** Use `npm run clean`
- **Port issues:** Check with `netstat -ano | findstr :4001`
- **Database issues:** Run `npm run setup`

---

**VIEW APP Team** - Production Ready Platform 🎯