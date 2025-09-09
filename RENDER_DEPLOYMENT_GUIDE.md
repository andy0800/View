# 🚀 Render Deployment Configuration Guide

## Frontend Static Site Configuration

### **Service Settings:**
- **Service Type**: Static Site
- **Repository**: `https://github.com/andy0800/View`
- **Branch**: `master`
- **Root Directory**: `frontend`

### **Build Settings:**
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### **Environment Variables:**
```
VITE_API_BASE_URL=https://d32eha6hoiifdk.cloudfront.net/api
VITE_SOCKET_URL=https://d32eha6hoiifdk.cloudfront.net
VITE_APP_NAME=ViewApp
VITE_NODE_ENV=production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_KEY
```

## Backend Web Service Configuration

### **Service Settings:**
- **Service Type**: Web Service
- **Repository**: `https://github.com/andy0800/View`
- **Branch**: `master`
- **Root Directory**: `backend`

### **Build Settings:**
- **Build Command**: `npm ci`
- **Start Command**: `npm start`

### **Environment Variables:**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://viewapp_postgres_user:Hj82NSRMhqsi2GgTzoG0Wmzs8Se21GAf@dpg-d2vdj7ogjchc73b4iqig-a/viewapp_postgres
REDIS_URL=redis://red-d2vdrcmr433s73f4oaj0:6379
JWT_SECRET=2d8ea8f818adbb33b8d878efb2b13cad8b9c256eb6330773c201dfb36c2cfd0b
ALLOWED_ORIGIN=https://your-frontend.onrender.com
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_S3_BUCKET=your-s3-bucket-name
```

## Common Issues & Solutions

### **Frontend Issues:**

#### **1. "Publish directory does not exist"**
- **Fix**: Set Publish Directory to `dist` (not `npm run build`)
- **Reason**: Vite builds to `dist` directory

#### **2. "Build command failed"**
- **Fix**: Ensure Build Command is `npm run build`
- **Reason**: Vite uses `vite build` command

#### **3. "API calls failing"**
- **Fix**: Update `VITE_API_BASE_URL` to your backend URL
- **Reason**: Frontend needs to know where backend is deployed

### **Backend Issues:**

#### **1. "Database connection failed"**
- **Fix**: Ensure `DATABASE_URL` is set correctly
- **Reason**: Backend needs production database connection

#### **2. "Migration failed"**
- **Fix**: Our smart initialization handles this automatically
- **Reason**: Creates tables directly without migrations

#### **3. "Port already in use"**
- **Fix**: Set `PORT=10000` environment variable
- **Reason**: Render assigns specific ports

## Deployment Steps

### **1. Deploy Backend First:**
1. Create Web Service on Render
2. Connect to GitHub repository
3. Set root directory to `backend`
4. Add all environment variables
5. Deploy and verify logs

### **2. Deploy Frontend Second:**
1. Create Static Site on Render
2. Connect to same GitHub repository
3. Set root directory to `frontend`
4. Set build command to `npm run build`
5. Set publish directory to `dist`
6. Add frontend environment variables
7. Deploy

### **3. Update CORS:**
1. Get frontend URL from Render (e.g., `https://your-app.onrender.com`)
2. Update backend `ALLOWED_ORIGIN` environment variable
3. Redeploy backend

## Verification

### **Frontend:**
- Visit your frontend URL
- Check browser console for API calls
- Verify all features work

### **Backend:**
- Check logs for database initialization
- Test API endpoints
- Verify database tables created

---

**Remember**: Always deploy backend first, then frontend, then update CORS settings! 🎯
