# 🏭 Industrial Downtime Alerts Management App

[![Live Demo](https://img.shields.io/badge/Live%20Demo-EAS%20Update-brightgreen)](https://expo.dev/preview/update?message=MVP+complete&updateRuntimeVersion=1.0.0&createdAt=2025-12-30T19%3A33%3A32.746Z&slug=exp&projectId=ce79cd3d-031f-4651-9dca-e3559e6dfd3c&group=a158e475-c381-4a1b-b367-725f375c9dcf)
[![Expo Go](https://img.shields.io/badge/Expo%20Go-Scan%20QR-blue)](exp://expo-development-client/?url=https://u.expo.dev/ce79cd3d-031f-4651-9dca-e3559e6dfd3c/group/a158e475-c381-4a1b-b367-725f375c9dcf)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-181717)](https://github.com/pratistha9903/Industrial-Downtime-Alerts-Management-App)

**Production-grade offline-first field application** for machine operators and supervisors. **✅ 100% MVP requirements fulfilled**
🏭 BIGGEST BUSINESS PROBLEM: Factory Downtime Tracking Fails Offline

🎯 The Real Factory Crisis 

Problem: Factory machines stop (downtime) but workers can't log reasons because WiFi fails or airplane mode is on. Result = ZERO data → Managers blind → Losses continue.

Daily Factory Reality:

✅ Cutter breaks → No WiFi → Can't log

✅ Operator forgets reason  

✅ Supervisor can't see issues

✅ $5000/hour lost → No data why ❌
Expo, React Native, AsyncStorage, and useState are the main tools you used in your factory downtime tracker app.

📱 Tool 1: Expo (The Magic Box)
Expo makes building React Native apps super easy because it handles all the hard setup work for you. You chose Expo so you could focus on coding your factory screens instead of fighting Android/iOS build errors. It lets you test on your phone instantly with just "expo start" - perfect for quick demos during interviews. Expo gives you a professional app without needing a Mac or complex build tools.

🎨 Tool 2: React Native (Phone Screens)
React Native lets you build native iOS/Android apps using JavaScript, which you already know well. You picked it because factory workers need smooth, fast apps that feel like real phone apps (not web pages). It gives you buttons, screens, and badges that work perfectly on any phone - exactly what supervisors expect to see on the shop floor.

💾 Tool 3: AsyncStorage (Phone's Memory)
AsyncStorage saves your downtime events directly to the phone's internal storage so data survives airplane mode, WiFi drops, and app crashes. You chose it because factories have terrible internet, and operators can't lose logged events. Unlike regular state (which disappears on restart), AsyncStorage keeps your pendingQueue safe until the supervisor syncs it.

🧠 Tool 4: useState (App's Brain)
useState manages your app's memory - it tracks pendingQueue, badgeCount, currentRole, and screen states. You used React hooks because they're simple and powerful for handling factory flows like "operator logs → red badge appears → supervisor syncs → green check". No complex Redux needed for your MVP.
🚀 My Solution:

1. **Offline logging** → AsyncStorage saves ALWAYS

2. **Red badge** → "3 issues waiting" 

3. **Supervisor sync** → Instant dashboard

4. **90-second demo** → Managers understand instantly

---
**🏗️ 3 LAYERS ARCHITECTURE EXPLANATION **
<div align="center">

┌─────────────────────┐  ← Layer 1: Screens
│   Login | Dashboard │
├─────────────────────┤
│ useState + Functions│  ← Layer 2: Logic  
│ pendingQueue logic  │
├─────────────────────┤
│   AsyncStorage      │  ← Layer 3: Storage
│ Phone Memory (SAFE) │
└─────────────────────┘
---
🔄 DATA FLOW (Step-by-Step Story)
text
1. Operator taps "Cutter 1" BUTTON
   ↓ (Presentation Layer)
2. App shows reason picker SCREEN  
   ↓ (Logic Layer)
3. User picks "No Order" → event created
   ↓ (Logic Layer)
4. event saved to pendingQueue ARRAY
   ↓ (Storage Layer)
5. AsyncStorage saves to PHONE MEMORY
   ↓ (Back to Presentation)
6. Red badge shows "1"
   
---

## 🎥 90-Second Demo Video **(Google Drive)**

[![📱 Watch Demo Video](https://drive.google.com/uc?id=YOUR_FILE_ID&export=download)](https://drive.google.com/drive/folders/1hVt3TiicmlP8bPSU8dFWDrx8x3BtoKHS?usp=sharing)

**Demo Flow:** Login → Airplane ON → 2x Downtime + Photo → Kill App → Restart → Sync → Supervisor Ack
---
## 📱 Run on Phone - 4 Methods

### **Method 1: Expo Go QR Scan (Recommended)**

npx expo start --clear

**📱 On phone:** Download Expo Go → Scan QR code → App loads instantly

### **Method 2: Live EAS Update (No Install)**
**[Direct Link](https://expo.dev/preview/update?message=MVP+complete&updateRuntimeVersion=1.0.0&createdAt=2025-12-30T19%3A33%3A32.746Z&slug=exp&projectId=ce79cd3d-031f-4651-9dca-e3559e6dfd3c&group=a158e475-c381-4a1b-b367-725f375c9dcf)**  
**📱 On phone:** Open link → "Open with Expo Go" → Ready

### **Method 3: USB Debug Cable (Development)**
**Phone Setup:**
1. Settings → About Phone → Tap "Build Number" 7x → Developer Options
2. Enable "USB Debugging" → Connect USB cable
3. Allow debugging popup → `adb devices` (shows your device)

**Laptop Commands:**

adb devices # Verify connection

npx expo start --clear --android # Auto-launches on phone



### **Method 4: Production APK**

eas login

eas build --platform android --profile preview


**📥 Download APK:** expo.dev dashboard → Builds tab → Install directly

---

## ✅ Offline Demo Flow (Test All Methods)

Login: john@factory.com → Operator role

✈️ Airplane Mode ON

Log 2x downtime (reason tree + photo) + maintenance

Close app → Reopen → "3 pending" badge appears

Airplane OFF → Supervisor login → Sync → Badge clears
---

## 🚀 Get Started in 90 Seconds **(Copy-Paste Commands)**

### 📋 Prerequisites (Run These)
node --version # Must show v18+

npm --version # Must show v9+

npm i -g eas-cli # Install EAS CLI (one-time)


### 🛠️ Clone, Install & Run **(3 Commands)**
1. Clone repo
   
 git clone https://github.com/pratistha9903/Industrial-Downtime-Alerts-Management-App.git

cd Industrial-Downtime-Alerts-Management-App

3. Install dependencies
   
 npm install

5. Start development server
   
 npx expo start --clear


**📱 Scan QR code with Expo Go app → App loads instantly**

---

## 📦 Production Deployment Commands

### **Build APK (Android)**

eas login # Login (one-time)

eas build --platform android --profile preview

📥 Download APK: expo.dev dashboard → Builds tab

⚡ Live immediately via Expo Go link above
text

---

## ✅ Feature Implementation Matrix

| **Challenge Req** | **Status** | **Details** |
|-------------------|------------|-------------|
| **👤 Login** | ✅ | Mock JWT + operator/supervisor toggle |
| **🏭 3 Machines** | ✅ | M-101 Cutter, M-102 Roller, M-103 Packer |
| **⏹️ Downtime** | ✅ | 2-level reason tree + photo ≤200KB |
| **🔧 Maintenance** | ✅ | Due/Overdue/Done checklists |
| **🚨 Alerts** | ✅ | Created→Ack→Cleared flow |
| **✈️ Offline** | ✅ | Survives airplane + app kills |
| **📊 Reports** | ✅ | Active/Idle time + top reasons |
| **🔒 tenant_id** | ✅ | `factory-001` everywhere [attached_file:1] |

---

## 🔄 Offline-First Architecture

👷 Operator Logs Events → 📦 AsyncStorage Queue (Unique IDs)
↓ Survives Airplane + App Kill
👨‍💼 Supervisor Syncs → ✅ Badge Clears + Visual Feedback


**Key Design:**
- **Idempotent**: `${Date.now()}-${Math.random()}` IDs prevent duplicates
- **Persistent**: All state saved on every change
- **Visual**: Pending badge + sync spinner

---

## 🛠️ Tech Stack

| **Tool** | **Version** | **Purpose** |
|----------|-------------|-------------|
| Expo SDK | ~54.0.30 | Cross-platform builds |
| React Native | 0.81.5 | UI + state management |
| AsyncStorage | 2.2.0 | Offline queue [attached_file:2] |
| ImagePicker | ~17.0.10 | Photo compression ≤200KB |
| EAS CLI | Latest | APK + OTA updates |

---

## 🎯 90-Second Demo Flow **(Record This Exactly)**

[0:00] 👤 Login: john@factory.com → Operator role
[0:05] ✈️ Airplane ON
[0:15] 🏭 M-101 → 2x Downtime (reason tree + 📸 photo)
[0:30] 🔧 Maintenance task logged
[0:35] 💀 Kill app → 🔄 Restart → 🔔 "3 pending" badge
[0:50] ✅ Airplane OFF → 👨‍💼 Supervisor → 🔄 SYNC
[1:10] 👆 Acknowledge alerts → Status updates
[1:25] "✨ Production-ready MVP complete"



---

## 🔍 Quick Troubleshooting

❌ "Metro not running" → npx expo start --clear
❌ "Build fails" → npm install --legacy-peer-deps
❌ "No camera" → Android auto-permissions
❌ "Sync stuck" → Switch to Supervisor role


---

## 🚀 Next Phase (Production)
1. 🌐 **SSE Backend** + background sync
2. 📈 **OEE Dashboard** from downtime data
3. 📸 **Photo Watermarking** (machine_id + ts)

---

## 📄 License
MIT License © 2025 Pratistha9903
Built for: Cross-Platform Mobile Challenge (Intern)


---

**🎯 [LIVE DEMO → Test Now](https://expo.dev/preview/update?message=MVP+complete&updateRuntimeVersion=1.0.0&createdAt=2025-12-30T19%3A33%3A32.746Z&slug=exp&projectId=ce79cd3d-031f-4651-9dca-e3559e6dfd3c&group=a158e475-c381-4a1b-b367-725f375c9dcf)**

**⚡ ONE COMMAND DEMO:** `npx expo start --clear` → 📱 Scan QR → ✅ Offline flow works!

📱 Watch Demo Video

https://drive.google.com/drive/folders/1hVt3TiicmlP8bPSU8dFWDrx8x3BtoKHS?usp=sharing

