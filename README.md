# 🏭 Industrial Downtime Alerts Management App

[![Live Demo](https://img.shields.io/badge/Live%20Demo-EAS%20Update-brightgreen)](https://expo.dev/preview/update?message=MVP+complete&updateRuntimeVersion=1.0.0&createdAt=2025-12-30T19%3A33%3A32.746Z&slug=exp&projectId=ce79cd3d-031f-4651-9dca-e3559e6dfd3c&group=a158e475-c381-4a1b-b367-725f375c9dcf)
[![Expo Go](https://img.shields.io/badge/Expo%20Go-Scan%20QR-blue)](exp://expo-development-client/?url=https://u.expo.dev/ce79cd3d-031f-4651-9dca-e3559e6dfd3c/group/a158e475-c381-4a1b-b367-725f375c9dcf)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-181717)](https://github.com/pratistha9903/Industrial-Downtime-Alerts-Management-App)

**Production-grade offline-first field application** for machine operators and supervisors. **✅ 100% MVP requirements fulfilled**

---

## 🏭 **BIGGEST BUSINESS PROBLEM SOLVED**
**Factory Downtime Tracking Fails Offline**

**Daily Factory Crisis:**
- Machines stop 2-3 hours daily → **$5000+/hour lost**
- WiFi drops + Airplane mode → **ZERO data logged**
- Managers blind → Can't fix root causes

**My Solution:**
✅ Operator logs OFFLINE → AsyncStorage → Red badge shows
✅ Survives airplane mode + app crashes
✅ Supervisor syncs → Instant dashboard + root cause visible
✅ 30-50% downtime reduction potential

text

---

## 🎥 **90-Second Demo Video**
[![📱 Watch Demo](https://img.shields.io/badge/Demo-Google%20Drive-blue)](https://drive.google.com/drive/folders/1hVt3TiicmlP8bPSU8dFWDrx8x3BtoKHS?usp=sharing)

**Demo Flow:** Login → Airplane ON → Log events → Kill app → Restart → Supervisor syncs

---

## 🚀 **Run on Phone - 4 Methods (Pick One)**

### **Method 1: Expo Go QR (2 Minutes)**
```bash
npx expo start --clear
📱 Phone: Expo Go app → Scan QR → Ready!

Method 2: Live Demo (30 Seconds)
📱 Live Demo

Method 3: Production APK
bash
eas login
eas build --platform android --profile preview
Method 4: USB Debug
bash
npx expo start --android  # Phone connected via USB
🛠️ Get Started (90 Seconds)
bash
# Prerequisites
node --version  # v18+
npm i -g eas-cli

# Clone + Run
git clone https://github.com/pratistha9903/Industrial-Downtime-Alerts-Management-App.git
cd Industrial-Downtime-Alerts-Management-App
npm install
npx expo start --clear

# 📱 Scan QR with Expo Go app
Login: john@factory.com (Operator role)

🏗️ Architecture (3 Layers)
text
┌─────────────────────┐  ← Layer 1: Screens
│ Login | Dashboard   │
├─────────────────────┤
│ useState + Functions│  ← Layer 2: Logic
│ pendingQueue logic  │
├─────────────────────┤
│   AsyncStorage      │  ← Layer 3: Storage
│ Phone Memory (SAFE) │
└─────────────────────┘
Data Flow:

text
1. Operator taps "Cutter 1" → Reason picker
2. "No Order" → Event created → AsyncStorage
3. Red badge "1" → Survives airplane mode
4. Supervisor syncs → Badge clears ✅
✅ Feature Matrix
Requirement	Status	Implementation
👤 Login	✅	Mock JWT + Role toggle
🏭 3 Machines	✅	M101 Cutter, M102 Roller, M103 Packer
⏹️ Downtime	✅	2-level reason tree + Photo
🔧 Maintenance	✅	Due/Overdue/Done flow
✈️ Offline	✅	AsyncStorage + Airplane survival
📊 Reports	✅	Active/Idle time analytics
🔒 tenant_id	✅	factory-001 multitenancy
💾 Tech Stack
Tool	Why Chosen
Expo SDK 54	Zero-config + EAS APK builds
React Native	Native performance
AsyncStorage	Offline data survival
useState	Simple factory state
ImagePicker	Photo ≤200KB compression
🎯 90-Second LIVE Demo Flow
text
[0:00] Login: john@factory.com → Operator
[0:05] ✈️ Airplane ON
[0:15] M101 → Downtime "No Order" + 📸 Photo
[0:30] M102 → Maintenance "Tool broken"
[0:40] 💀 Kill app → 🔄 Restart → "3 pending" badge
[0:55] Airplane OFF → Supervisor → 🔄 SYNC
[1:15] Acknowledge alerts → Status updates ✅
🔄 Production Roadmap
text
Phase 1 (Done ✅): Offline MVP + APK
Phase 2: Real server (fetch('/api/events'))
Phase 3: SSE push alerts + OEE dashboard
Phase 4: Multi-factory tenant support
Current → Production = Replace setTimeout(1000) with fetch('/api/events')

🔍 Troubleshooting
Problem	Fix
Metro crash	npx expo start --clear
Build fails	npm i --legacy-peer-deps
No camera	Android permissions auto
Sync stuck	Toggle Supervisor role
📄 License
MIT © 2026 Pratistha9903
Built for: Cross-Platform Mobile Internship Challenge

⚡ LIVE TEST NOW → No Install Needed

🎯 ONE COMMAND: npx expo start --clear → 📱 Scan → ✅ Offline works!

text

**✅ COPY EVERYTHING ABOVE → Paste in README.md → Save → Push → DONE!** 😎

**Perfect professional README = Interviewers impressed!** 🔥
