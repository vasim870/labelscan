# LabelScan Deployment Guide

This guide outlines how to deploy **LabelScan** as a live web platform and build/distribute the mobile application.

---

## 1. Automated GitHub Pages & Cloud Android APK Build (Recommended)

The repository includes a ready-to-run GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Steps to Deploy:
1. **Create a GitHub repository**:
   Create a new empty repository on [GitHub](https://github.com/new) (e.g. `labelscan`).
2. **Push the project**:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/labelscan.git
   git branch -M main
   git push -u origin main
   ```
3. **Automatic Deployment**:
   - **Website**: GitHub Actions will automatically publish the website to GitHub Pages (`https://<YOUR-USERNAME>.github.io/labelscan/`).
   - **Android Mobile App**: The workflow will spin up an Ubuntu runner with Flutter 3.19.x, compile `app-release.apk`, and attach it under the **Actions** tab as `labelscan-android-release-apk`.

---

## 2. Vercel Deployment (One-Click or CLI)

The project includes a ready-to-use [`vercel.json`](vercel.json) file with custom routing, PWA headers, and CDN caching.

### Option A: 1-Click GitHub Import (Permanent)
1. Push this project to GitHub.
2. Go to **[vercel.com/new](https://vercel.com/new)** and click **"Continue with GitHub"**.
3. Select your `labelscan` repository and click **"Deploy"**.
4. Vercel will deploy your app to `https://labelscan.vercel.app` with free SSL and automatic updates on every push.

### Option B: Deploy via Vercel CLI
Run the following in your terminal:
```bash
npx -y vercel
```
- Select your Vercel account or log in via browser.
- Accept default settings (`Set up and deploy? [Y/n]` $\rightarrow$ `Y`).
- Vercel will output your live URL immediately.

---

## 3. Firebase Hosting Deployment

The repository includes [`firebase.json`](firebase.json) and [`.firebaserc`](.firebaserc) pre-configured with PWA headers, caching, and single-page routing.

### Steps to Deploy:
1. **Log in to Firebase**:
   ```bash
   npx -y firebase-tools@latest login
   ```
2. **Select or create your Firebase project**:
   ```bash
   npx -y firebase-tools@latest use <YOUR_FIREBASE_PROJECT_ID>
   ```
3. **Deploy live to Google CDN**:
   ```bash
   npx -y firebase-tools@latest deploy --only hosting
   ```
Your app will be live at `https://<YOUR_FIREBASE_PROJECT_ID>.web.app` with instant global SSL.

---

## 3. Instant Mobile App Installation (PWA)

Because LabelScan is a Progressive Web App (PWA):
1. Open your deployed URL (or `http://127.0.0.1:8080` locally) on any Android or iOS device.
2. **On Android (Chrome)**: Tap the **"Install App"** button in the top bar or select **"Install App"** from the browser menu.
3. **On iOS (Safari)**: Tap the **Share** button and select **"Add to Home Screen"**.
4. The app installs as a standalone native-like application with its own icon, splash screen, and offline support.

---

## 4. Local Flutter Mobile App Build

If you have Flutter SDK and Android Studio installed locally:
```bash
cd flutter_app
flutter pub get
flutter run                # Run on connected device or emulator
flutter build apk --release # Compile production Android APK
```
The compiled APK will be located at:
`flutter_app/build/app/outputs/flutter-apk/app-release.apk`
