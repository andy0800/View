# 🔧 VIEW APP - Environment Setup Guide

This guide helps you set up environment variables for your VIEW APP project.

## 📁 File Structure

```
├── frontend/
│   ├── .env                    # Frontend environment variables (VITE_ prefixed)
│   └── env.template           # Template for frontend .env
├── backend/
│   ├── .env                   # Backend environment variables (sensitive data)
│   └── env.template          # Template for backend .env
└── setup-env.js              # Interactive setup script
```

## 🚀 Quick Setup

### Option 1: Interactive Setup (Recommended)
```bash
node setup-env.js
```

### Option 2: Manual Setup
1. Copy the templates:
   ```bash
   cp frontend/env.template frontend/.env
   cp backend/env.template backend/.env
   ```

2. Edit the `.env` files with your actual values

## 📋 Environment Variables Reference

### Frontend (.env) - Public Variables Only
- **VITE_APP_NAME**: Application name
- **VITE_API_BASE_URL**: Backend API URL
- **VITE_STRIPE_PUBLISHABLE_KEY**: Stripe public key
- **VITE_SOCKET_URL**: Socket.io server URL
- **VITE_DEFAULT_CURRENCY**: Default currency (KWD)
- **VITE_DEFAULT_LANGUAGE**: Default language (en)

### Backend (.env) - All Sensitive Data
- **PORT**: Server port (default: 8080)
- **DB_HOST**: PostgreSQL database host
- **DB_PASS**: Database password
- **JWT_SECRET**: JWT signing secret (2d8ea8f818adbb33b8d878efb2b13cad8b9c256eb6330773c201dfb36c2cfd0b)
- **STRIPE_SECRET_KEY**: Stripe secret key
- **AWS_ACCESS_KEY_ID**: AWS access key
- **AWS_SECRET_ACCESS_KEY**: AWS secret key
- **AWS_S3_BUCKET**: S3 bucket name

## 🔐 Security Best Practices

### ✅ DO:
- Use strong, unique passwords
- Rotate secrets regularly
- Use environment-specific values
- Keep `.env` files in `.gitignore`
- Use AWS Secrets Manager for production

### ❌ DON'T:
- Commit `.env` files to version control
- Use the same secrets across environments
- Share secrets in plain text
- Use weak passwords
- Store secrets in code

## 🌍 Environment-Specific Configurations

### Development
```bash
NODE_ENV=development
DEBUG_MODE=true
VERBOSE_LOGGING=true
```

### Production
```bash
NODE_ENV=production
DEBUG_MODE=false
VERBOSE_LOGGING=false
HELMET_CSP_ENABLED=true
```

## 🔄 Updating Environment Variables

### When Adding New Services:
1. Update the appropriate `.env` template
2. Add the new variables to your actual `.env` files
3. Update this documentation

### When Rotating Secrets:
1. Generate new secrets
2. Update your `.env` files
3. Restart your application
4. Update production environment

## 🛠️ AWS Integration

### Required AWS Services:
- **RDS**: PostgreSQL database
- **ElastiCache**: Redis for sessions
- **S3**: File storage
- **SES**: Email notifications
- **Elastic Beanstalk**: Application hosting

### AWS Environment Variables:
```bash
# Database
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PASS=your-secure-password

# Redis
REDIS_URL=redis://red-d2vdrcmr433s73f4oaj0:6379

# S3
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# SES
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

## 🧪 Testing Environment Variables

### Frontend Testing:
```bash
cd frontend
npm run dev
# Check browser console for VITE_ variables
```

### Backend Testing:
```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env.DB_HOST)"
```

## 🚨 Troubleshooting

### Common Issues:

1. **Frontend variables not loading**:
   - Ensure variables start with `VITE_`
   - Restart the development server
   - Check for typos in variable names

2. **Backend can't connect to database**:
   - Verify `DB_HOST` and `DB_PASS`
   - Check network connectivity
   - Ensure database is running

3. **Stripe payments failing**:
   - Verify `STRIPE_SECRET_KEY` is correct
   - Check if using test vs live keys
   - Ensure webhook endpoint is configured

## 📞 Support

If you need help with environment setup:
1. Check this documentation
2. Review the template files
3. Run the interactive setup script
4. Contact the development team

---

**Remember**: Never commit `.env` files to version control! 🚫
