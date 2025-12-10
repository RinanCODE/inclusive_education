# 🚀 Quick Start Guide - Inclusive Education System

**Last Updated:** October 30, 2025  
**Status:** ✅ All services operational

---

## ⚡ TL;DR - Start Commands

Open **3 separate PowerShell terminals** and run these commands:

### Terminal 1: Backend API
```powershell
cd "c:\AI Learning\inclusive-education-system\backend"
npm start
```

### Terminal 2: AI Services
```powershell
cd "c:\AI Learning\inclusive-education-system\ai-services"
.\venv\Scripts\python.exe app.py
```

### Terminal 3: Frontend
```powershell
cd "c:\AI Learning\inclusive-education-system\frontend"
npm start
```

**Access the app:** http://localhost:4200

---

## 📋 Prerequisites Checklist

Before starting, ensure:
- ✅ MySQL is running on port 3306 (XAMPP or standalone)
- ✅ Database migrations completed: `npm run migrate` (in backend folder)
- ✅ Node.js installed (v18+)
- ✅ Python virtual environment created (in ai-services folder)

---

## 🎯 Detailed Step-by-Step Instructions

### Step 1: Start Backend API (Node.js)

**Open PowerShell Terminal #1:**

```powershell
# Navigate to backend folder
cd "c:\AI Learning\inclusive-education-system\backend"

# Start the backend server
npm start
```

**Expected Output:**
```
> inclusive-education-backend@1.0.0 start
> node server.js

✅ Database connected successfully
🚀 Server running on port 3000
```

**Health Check:**
```powershell
curl http://localhost:3000/health
```

---

### Step 2: Start AI Services (Python/Flask)

**Open PowerShell Terminal #2:**

```powershell
# Navigate to ai-services folder
cd "c:\AI Learning\inclusive-education-system\ai-services"

# Start AI services using venv Python
.\venv\Scripts\python.exe app.py
```

**⚠️ IMPORTANT:** 
- **DO NOT** use `python app.py` (uses system Python without packages)
- **ALWAYS** use `.\venv\Scripts\python.exe app.py` (uses venv with all packages)

**Expected Output:**
```
==================================================
🤖 AI Microservices Starting
==================================================
📡 Port: 5000
🔧 Debug Mode: True
🗄️  Database: localhost
==================================================
 * Running on http://0.0.0.0:5000
✅ Database connected successfully
```

**Health Check:**
```powershell
curl http://localhost:5000/health
```

---

### Step 3: Start Frontend (Angular)

**Open PowerShell Terminal #3:**

```powershell
# Navigate to frontend folder
cd "c:\AI Learning\inclusive-education-system\frontend"

# Start Angular dev server
npm start
```

**Expected Output:**
```
** Angular Live Development Server is listening on localhost:4200 **
✔ Compiled successfully.
```

**Access Application:**
Open browser: http://localhost:4200

---

## 🔐 Login Credentials

**Admin Account:**
- Email: `admin@inclusive-edu.com`
- Password: `admin123`

---

## 🛑 How to Stop Services

Press `Ctrl + C` in each terminal to stop the respective service.

---

## ❌ Common Errors & Solutions

### Error 1: "ModuleNotFoundError: No module named 'flask_cors'"

**Problem:** Using wrong Python interpreter

**Solution:** Use the venv Python:
```powershell
.\venv\Scripts\python.exe app.py
```
NOT:
```powershell
python app.py  # ❌ Wrong - uses system Python
```

---

### Error 2: "Port 3000 already in use"

**Problem:** Backend is already running

**Solution:**
```powershell
# Find the process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Then restart backend
npm start
```

---

### Error 3: "Database connection failed"

**Problem:** MySQL not running or wrong port

**Solution:**
```powershell
# Check if MySQL is running on port 3306
netstat -ano | findstr :3306

# If not running, start XAMPP MySQL or your MySQL service
# Then restart backend and AI services
```

---

### Error 4: "Cannot find module" (Backend)

**Problem:** npm packages not installed

**Solution:**
```powershell
cd "c:\AI Learning\inclusive-education-system\backend"
npm install
npm start
```

---

### Error 5: "ng: command not found" (Frontend)

**Problem:** Angular CLI not installed

**Solution:**
```powershell
cd "c:\AI Learning\inclusive-education-system\frontend"
npm install
npm start
```

---

## 🔄 Alternative: Start with Batch Script

You can create a batch file to start all services at once:

**Create `start-all.bat`:**
```batch
@echo off
echo Starting Inclusive Education System...

start "Backend" cmd /k "cd /d c:\AI Learning\inclusive-education-system\backend && npm start"
timeout /t 3 /nobreak

start "AI Services" cmd /k "cd /d c:\AI Learning\inclusive-education-system\ai-services && .\venv\Scripts\python.exe app.py"
timeout /t 3 /nobreak

start "Frontend" cmd /k "cd /d c:\AI Learning\inclusive-education-system\frontend && npm start"

echo All services started!
echo Frontend: http://localhost:4200
pause
```

**Run:**
```powershell
.\start-all.bat
```

---

## 🔍 Verify All Services Running

Run these commands to check service status:

```powershell
# Check all ports
netstat -ano | findstr ":3000 :4200 :5000"

# Test backend
curl http://localhost:3000/health

# Test AI services
curl http://localhost:5000/health

# Test frontend
curl http://localhost:4200
```

**Expected Result:**
- Port 3000: Backend (LISTENING)
- Port 4200: Frontend (LISTENING)
- Port 5000: AI Services (LISTENING)

---

## 📱 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:4200 | Main application UI |
| **Backend API** | http://localhost:3000 | REST API endpoints |
| **AI Services** | http://localhost:5000 | AI recommendations & chatbot |
| **Backend Health** | http://localhost:3000/health | Backend status check |
| **AI Health** | http://localhost:5000/health | AI service status check |

---

## 🎓 First Time Setup (One-Time Only)

If this is your first time running the system:

### 1. Install Backend Dependencies
```powershell
cd "c:\AI Learning\inclusive-education-system\backend"
npm install
```

### 2. Run Database Migrations
```powershell
cd "c:\AI Learning\inclusive-education-system\backend"
npm run migrate
```

### 3. Install Frontend Dependencies
```powershell
cd "c:\AI Learning\inclusive-education-system\frontend"
npm install
```

### 4. Verify Python Virtual Environment
```powershell
cd "c:\AI Learning\inclusive-education-system\ai-services"
.\venv\Scripts\python.exe -m pip list
```

Should show Flask, Flask-CORS, mysql-connector-python, etc.

---

## 💡 Pro Tips

### Tip 1: Keep Terminals Open
Keep all 3 terminals open while developing. You'll see real-time logs and errors.

### Tip 2: Auto-Restart on Changes
- **Backend:** Use `npm run dev` instead of `npm start` for auto-restart with nodemon
- **Frontend:** Already auto-reloads on file changes
- **AI Services:** Runs in debug mode, auto-reloads on file changes

### Tip 3: Check Logs for Errors
If something doesn't work, check the terminal logs:
- Backend errors → Terminal 1
- AI service errors → Terminal 2
- Frontend errors → Terminal 3 + Browser console (F12)

### Tip 4: Use the Correct Python
**Always use:** `.\venv\Scripts\python.exe app.py`  
**Never use:** `python app.py` (wrong interpreter)

---

## 🆘 Need Help?

1. **Check service logs** in the terminals
2. **Verify MySQL is running** on port 3306
3. **Check SYSTEM_SCAN_REPORT.md** for detailed diagnostics
4. **Restart services** in order: Backend → AI → Frontend

---

## 📞 Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  INCLUSIVE EDUCATION SYSTEM - QUICK REFERENCE           │
├─────────────────────────────────────────────────────────┤
│  START COMMANDS:                                        │
│                                                         │
│  Terminal 1 (Backend):                                  │
│  cd "c:\AI Learning\inclusive-education-system\backend" │
│  npm start                                              │
│                                                         │
│  Terminal 2 (AI Services):                              │
│  cd "c:\AI Learning\inclusive-education-system\ai-services" │
│  .\venv\Scripts\python.exe app.py                       │
│                                                         │
│  Terminal 3 (Frontend):                                 │
│  cd "c:\AI Learning\inclusive-education-system\frontend"│
│  npm start                                              │
│                                                         │
│  ACCESS: http://localhost:4200                          │
│  LOGIN: admin@inclusive-edu.com / admin123              │
│                                                         │
│  STOP: Ctrl+C in each terminal                          │
└─────────────────────────────────────────────────────────┘
```

---

**Happy Learning! 🎓**
