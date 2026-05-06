# ShikshaSetu - Production Android APK Build Guide

## ⚡ Quick Start (3 Commands)

```bash
cd expo
npm install
npx eas build -p android --profile production --type apk
```

**Done!** APK will be ready in 10-15 minutes.

---

## 📋 Prerequisites

- ✅ Node.js v18+
- ✅ npm or yarn
- ✅ Free Expo account (create at https://expo.dev)
- ✅ Internet connection
- ✅ Android phone (8.0+) for testing

---

## 🔧 Setup & Build

### Step 1: Login to Expo
```bash
eas login
# Or use: eas login --interactive
```

### Step 2: Install Dependencies
```bash
cd expo
npm install
```

### Step 3: Build APK
```bash
npx eas build -p android --profile production --type apk
```

This will:
- ✅ Generate native Android project
- ✅ Enable Hermes engine (faster execution)
- ✅ Minify JavaScript code
- ✅ Apply ProGuard shrinking
- ✅ Compress assets
- ✅ Create production APK (~100 MB)

### Step 4: Download & Install
- EAS will give you a download link
- Download the APK file
- Transfer to Android phone via USB or download link
- Tap to install or use: `adb install shikshasetu.apk`

---

## ✅ Features Included

### AI System
- **Free Tier**: 5 AI generations/day
- **Premium Tier**: 10/day
- **Rate Limiting**: 60 requests/minute
- **Validation**: All API responses validated
- **Timeout**: 30-second default with fallback

### Task Organizer
- AI-powered timetable generation
- Auto-rescheduling logic
- Persistent storage via AsyncStorage
- Offline-first design

### Games
- **2048 Game** - Classic puzzle
- **Memory Match** - Brain training
- **1 Play/Day Rule** - Daily limit enforced
- **Quiz System** - 10 random questions
- **Quiz Unlock** - Computer Science excluded
- **Premium Access** - Question papers & mind maps

### Premium Features
- Question paper generation (locked for free)
- Mind map creation (locked for free)
- 10 AI generations/day (vs 5 free)
- Unlimited games (vs 1/day free)

### Realtime Features
- **Chat Messaging** - P2P communication
- **Study Rooms** - Collaborative learning
- **Room Codes** - Easy sharing
- **Monthly Challenges** - Community engagement
- **WebSocket Auto-Reconnect** - Handles network issues
- **Low Latency** - Optimized for India

### Authentication
- ❌ OTP System (REMOVED)
- ✅ Email + Password Login
- ✅ Google Sign-In
- ✅ Session Persistence
- ✅ Secure credential storage

### Performance
- **Hermes Engine** - ~40% faster execution
- **Code Minification** - ~30% smaller bundle
- **ProGuard Shrinking** - Removes unused code
- **Asset Compression** - Optimized images
- **APK Size** - ~100 MB (all features)

---

## 🚨 Troubleshooting

### Build Fails
```bash
# Clear cache and retry
rm -rf node_modules
npm install
npx eas build -p android --profile production --type apk
```

### APK Won't Install
```bash
# Check Android version
adb shell getprop ro.build.version.release

# Must be 8.0 (API 26) or higher
# Enable "Unknown Sources" in phone settings
```

### App Crashes on Startup
```bash
# Check logs
adb logcat | grep ShikshaSetu

# Verify API keys in .env.production
# Check internet connection
```

### Build Hangs
- Wait 15+ minutes (first build takes longer)
- Check https://expo.dev/builds for progress
- Check email for build status

---

## 📱 Installation Methods

### Method 1: ADB (Fastest)
```bash
adb install shikshasetu.apk
```

### Method 2: Direct Link
- Download APK from EAS link
- Tap file to install

### Method 3: USB Transfer
```bash
# Copy to phone storage
adb push shikshasetu.apk /sdcard/Download/

# Then tap file on phone
```

---

## 🔐 Environment Setup

Create `expo/.env.production`:
```
EXPO_PUBLIC_RORK_API_BASE_URL=https://api.shikshasetu.com
EXPO_PUBLIC_RORK_API_KEY=your_production_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

Replace with your actual credentials.

---

## 📊 Build Output

| Type | Size | Use Case |
|------|------|----------|
| APK | ~100 MB | Direct installation, testing |
| AAB | ~80 MB | Google Play Store (optimizes per device) |

---

## 🎯 Device Requirements

- **OS**: Android 8.0+ (API 26)
- **Storage**: 300 MB free
- **RAM**: 2 GB minimum (3+ recommended)
- **Network**: Internet for first run

---

## ✨ Optimization Summary

| Component | Optimization |
|-----------|--------------|
| Engine | Hermes (v0.12+) |
| Compression | ProGuard enabled |
| Minification | Enabled |
| Source Maps | Removed in production |
| Assets | Compressed |
| Dependencies | Tree-shaken |

---

## 🔄 Version Management

Current version: **1.0.0**

To increment for next release:
```json
// In app.json
"version": "1.0.1"
// Android automatically increments versionCode
```

---

## 📞 Support

- **Build Issues**: Check https://expo.dev/builds
- **Device Issues**: Check `adb logcat`
- **API Issues**: Verify .env.production credentials
- **Performance**: Test on low-end devices

---

## ✅ Pre-Launch Checklist

- [ ] All 8 features tested on real device
- [ ] No crashes in logcat
- [ ] Internet connection verified
- [ ] API keys configured
- [ ] APK size < 120 MB
- [ ] Tested on multiple Android versions
- [ ] Offline mode tested
- [ ] Push notifications tested (if enabled)

**Everything is ready. Build your APK now!** 🚀
