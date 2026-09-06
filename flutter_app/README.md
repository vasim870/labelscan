# LabelScan Flutter Mobile Application
**AI Legal Metrology Compliance Platform • Ministry of Consumer Affairs**

---

### Mobile App Overview
The native Flutter mobile app implementation of **LabelScan** brings Legal Metrology compliance auditing directly to Android and iOS devices.

### Features
1. **Camera Inspection & Label Zones Viewfinder**: Overlays bounding boxes on product panels with instant color-coded compliance status (Green for Pass, Red for Tampered Dual-MRP stickers).
2. **Pre-loaded FMCG Demonstration Cases**: Fast-switch between compliant vs dual-MRP vs missing USP items for judge reviews.
3. **Crowdsourced Hyderabad Store Violation GIS Feed**: View local retail violations with community verifications.
4. **1-Click Legal Notice Generator**: Pre-fills official Form 1 notice under Section 36 of Legal Metrology Act, 2009.
5. **Role-Based HUD**: Instant toggle between Citizen Mode ("Am I Being Cheated?" USP calculator) and Inspector HUD (seizure notice queues).

---

### Running the Mobile App

#### Prerequisites
- Flutter SDK (>= 3.0.0)
- Android Studio / Xcode

#### Commands
```bash
# 1. Navigate to the flutter app folder
cd flutter_app

# 2. Install dependencies
flutter pub get

# 3. Run on connected Android or iOS device / emulator
flutter run

# 4. Build release Android APK
flutter build apk --release
```
The compiled APK will be generated at `build/app/outputs/flutter-apk/app-release.apk`.
