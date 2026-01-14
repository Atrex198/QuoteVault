# Notification Setup Guide for Standalone Android APK

## Problem
Notifications work in Expo Go but not in the standalone APK built with `expo export` + Gradle.

## Why?
Standalone apps need Firebase Cloud Messaging (FCM) configuration, which Expo Go provides automatically.

## Solution: Add Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add Project**
3. Enter project name: `QuoteVault`
4. Disable Google Analytics (optional)
5. Click **Create Project**

### Step 2: Add Android App to Firebase

1. In Firebase Console, click **Add app** > Android icon
2. **Android package name**: `com.quotevault.app` (from app.json)
3. **App nickname**: QuoteVault
4. **Debug signing certificate**: Leave blank for now
5. Click **Register app**
6. Download **google-services.json**

### Step 3: Add google-services.json to Project

```bash
# Copy the downloaded file to:
cp ~/Downloads/google-services.json /home/atharva/Work/QuoteVault/app-source/QuoteVault/android/app/
```

### Step 4: Update app.json

Add FCM server key to your `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#0df2f2",
          "defaultChannel": "default"
        }
      ]
    ]
  }
}
```

### Step 5: Rebuild the App

```bash
# Prebuild to update native code
npx expo prebuild --clean

# Export and build
npx expo export --platform android
cd android
./gradlew assembleRelease

# Install
adb install -r app/build/outputs/apk/release/app-release.apk
```

### Step 6: Test Notifications

Open the app and go to Settings > Notifications. The notification permission dialog should appear.

## Alternative: Use EAS Build (Easier)

EAS Build automatically handles Firebase configuration:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile production

# Download and install the APK
```

## Verify Notification Setup

Check if notifications are working:

```bash
# Test local notification via adb
adb shell am broadcast -a com.quotevault.app.NOTIFICATION_TEST

# Check device logs
adb logcat | grep -i "notification\|fcm\|firebase"
```

## Common Issues

### Issue: "Failed to register for push notifications"
**Solution**: Make sure `google-services.json` is in `android/app/` directory

### Issue: Notifications still not showing
**Solution**: Check Android notification permissions:
```bash
adb shell dumpsys notification_listener
adb shell settings get global heads_up_notifications_enabled
```

### Issue: Build fails after adding google-services.json
**Solution**: Clean and rebuild:
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

## Notes

- **Expo Go** uses Expo's notification service (works automatically)
- **Standalone APK** requires Firebase FCM (manual setup)
- **EAS Build** handles FCM automatically (recommended for production)

## Current Status

Your app has:
- ✅ `expo-notifications` installed (v0.32.16)
- ✅ Notification permission in AndroidManifest
- ✅ Notification handler configured in code
- ❌ Missing Firebase `google-services.json`
- ❌ No FCM configuration

Once you add Firebase, notifications will work in the standalone APK!
