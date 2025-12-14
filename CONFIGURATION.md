# 🔐 Configuration & Security Guide

## Environment Variables & Credentials

### 📋 Overview
The Caliber backend uses **environment variables** for configuration and credentials management. This approach keeps sensitive information separate from code and allows different configurations for development, staging, and production environments.

## 🗂️ Where Credentials Are Stored

### 1. Environment Variables File (`.env`)
**Location**: `Caliber_Backend/.env`

**Status**: 🔴 **NOT in version control** (listed in `.gitignore`)

This file contains all sensitive credentials and configuration:
```bash
# Database credentials
DB_NAME=caliber
DB_USER=postgres
DB_PASSWORD=your_secret_password

# JWT secret for authentication
JWT_SECRET=your_very_long_random_secret_key

# Server configuration
PORT=5000
NODE_ENV=development
```

### 2. Example Template (`.env.example`)
**Location**: `Caliber_Backend/.env.example`

**Status**: ✅ **Safe to commit** - Contains template without real credentials

This file shows the structure but NO actual secrets:
```bash
DB_PASSWORD=your_database_password_here  # ← Placeholder, not real password
JWT_SECRET=your_jwt_secret_key_here      # ← Placeholder, not real secret
```

## 🔧 How Environment Variables Work

### 1. Loading Process
```javascript
// server.js (Line 1)
require('dotenv').config();
```
This loads all variables from `.env` file into `process.env`

### 2. Using in Code
```javascript
// config/db.js
const DB_NAME = process.env.DB_NAME || 'caliber';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';

// services/authService.js
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret-key';
```

### 3. Fallback Values
```javascript
process.env.DB_PASSWORD || 'password'
                          └─ Used if .env doesn't exist (development only!)
```

## 📍 API Endpoints Configuration

### Base URLs

#### Development
```
Backend API:  http://localhost:5000
API Docs:     http://localhost:5000/api-docs
Frontend:     http://localhost:5173
```

#### Production
```env
# .env (production)
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### API Endpoint Structure

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Register new user | No |
| `/api/auth/login` | POST | Login user | No |
| `/api/auth/logout` | POST | Logout user | No |
| `/api/auth/check` | GET | Check auth status | Yes |
| `/api/auth/me` | GET | Get current user | Yes |
| `/api/auth/profile` | PATCH | Update profile | Yes |
| `/api/videos` | POST | Upload video | Yes |
| `/api/videos` | GET | Get all videos | No |
| `/api/videos/:id` | GET | Get single video | No |
| `/api/videos/stream/:id` | GET | Stream video | No |
| `/api/videos/user/:userId` | GET | Get user's videos | No |

### Configured In
```javascript
// server.js (Lines 94-96)
app.use('/api/auth', authRoutes);
app.use('/api/videos', createVideoRouter(io));
```

## 🔐 Secrets Management

### 1. JWT Secret
**Purpose**: Sign and verify authentication tokens

**Location Used**:
- [`services/authService.js`](Caliber_Backend/services/authService.js:7)
- [`middleware/authMiddleware.js`](Caliber_Backend/middleware/authMiddleware.js)

**How to Generate Secure Secret**:
```bash
# Run in terminal
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Best Practices**:
- ✅ Use at least 256 bits (32 bytes)
- ✅ Different secret for each environment
- ✅ Rotate periodically in production
- ❌ Never commit to git
- ❌ Never share via email/chat

### 2. Database Credentials
**Purpose**: Connect to PostgreSQL database

**Location Used**:
- [`config/db.js`](Caliber_Backend/config/db.js:3-7)

**Configuration**:
```javascript
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
});
```

## 🛠️ Setup Instructions

### First Time Setup

1. **Copy the example file**:
   ```bash
   cd Caliber_Backend
   cp .env.example .env
   ```

2. **Edit `.env` with your actual values**:
   ```bash
   # Use your preferred editor
   nano .env
   # or
   code .env
   ```

3. **Fill in real credentials**:
   ```env
   DB_NAME=caliber
   DB_USER=postgres
   DB_PASSWORD=MyActualPassword123!
   JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...
   PORT=5000
   NODE_ENV=development
   ```

4. **Verify `.env` is in `.gitignore`**:
   ```bash
   cat .gitignore | grep .env
   # Should show: .env
   ```

## 🚨 Security Best Practices

### ✅ DO:
1. **Always use `.env` for secrets**
   ```javascript
   const SECRET = process.env.JWT_SECRET;  // ✅ Good
   ```

2. **Keep `.env` in `.gitignore`**
   ```gitignore
   .env          # ✅ Correctly ignored
   *.env         # ✅ Also ignore any .env variants
   ```

3. **Use different secrets per environment**
   ```
   Development:  JWT_SECRET=dev_secret_123
   Production:   JWT_SECRET=prod_xK9mP2vN8qL5...
   ```

4. **Provide `.env.example` for team**
   ```env
   # ✅ Template with placeholders
   DB_PASSWORD=your_password_here
   ```

5. **Use environment-specific configs**
   ```javascript
   if (process.env.NODE_ENV === 'production') {
     cookieOptions.secure = true;  // HTTPS only
   }
   ```

### ❌ DON'T:
1. **Never hardcode secrets**
   ```javascript
   const SECRET = 'my-secret-123';  // ❌ BAD!
   ```

2. **Never commit `.env`**
   ```bash
   git add .env   # ❌ NEVER DO THIS!
   ```

3. **Never log secrets**
   ```javascript
   console.log(process.env.JWT_SECRET);  // ❌ BAD!
   ```

4. **Never share `.env` via email/Slack**
   ```
   ❌ "Here's my .env file..." → Security breach!
   ```

## 🌍 Environment-Specific Configuration

### Development (`.env`)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_NAME=caliber_dev
JWT_SECRET=dev_secret_not_for_production
```

### Production (Server environment variables)
```env
NODE_ENV=production
PORT=5000
DB_HOST=production-db-server.com
DB_NAME=caliber_prod
JWT_SECRET=super_long_random_production_secret_xyz123
```

### Setting Production Variables

#### Option 1: Hosting Platform (Heroku, Vercel, etc.)
```bash
# Via dashboard or CLI
heroku config:set JWT_SECRET=your_production_secret
heroku config:set DB_PASSWORD=prod_password
```

#### Option 2: Docker
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DB_PASSWORD=${DB_PASSWORD}
```

#### Option 3: Server (Linux)
```bash
# Add to /etc/environment or ~/.bashrc
export JWT_SECRET="production_secret"
export DB_PASSWORD="prod_password"
```

## 🔍 Checking Current Configuration

### View Loaded Environment (Development Only!)
```javascript
// Add to server.js temporarily
console.log('Config loaded:', {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  dbHost: process.env.DB_HOST,
  // ❌ Never log secrets!
  // jwtSecret: process.env.JWT_SECRET  // DON'T DO THIS
});
```

### Verify `.env` is Loaded
```javascript
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not found in environment!');
  process.exit(1);
}
```

## 📚 Files Related to Configuration

| File | Purpose | Committed? |
|------|---------|------------|
| `.env` | **Actual secrets** | ❌ No (in .gitignore) |
| `.env.example` | **Template** | ✅ Yes (safe) |
| [`config/db.js`](Caliber_Backend/config/db.js) | Database config | ✅ Yes |
| [`server.js`](Caliber_Backend/server.js) | App config | ✅ Yes |
| [`.gitignore`](Caliber_Backend/.gitignore) | Ignore rules | ✅ Yes |

## 🆘 Troubleshooting

### Problem: "Cannot connect to database"
```bash
# Check .env exists
ls -la .env

# Check DB credentials are correct
cat .env | grep DB_
```

### Problem: "Invalid token"
```bash
# JWT_SECRET might be missing or different
cat .env | grep JWT_SECRET
```

### Problem: "Module not found: dotenv"
```bash
# Install dependencies
npm install
```

### Problem: ".env not loading"
```javascript
// Ensure this is at the TOP of server.js
require('dotenv').config();
```

## 🔗 Related Documentation
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](http://localhost:5000/api-docs)
- [dotenv Package](https://www.npmjs.com/package/dotenv)

## 📝 Quick Reference

```bash
# Create .env from template
cp .env.example .env

# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Check if .env is ignored
git status .env  # Should say: "nothing to commit"

# Start server (loads .env automatically)
npm start
```

---

**⚠️ REMEMBER**: Never commit sensitive credentials to version control!