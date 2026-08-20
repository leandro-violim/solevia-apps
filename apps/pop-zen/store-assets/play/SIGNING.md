# Zen Bubbles — Android release signing & AAB build

How to produce the **signed `.aab`** you upload to Google Play. Do this once the
Play Organization verification clears. The Gradle config is already wired
(`android/app/build.gradle`) — it stays inert until you create the keystore below.

## How Play signing works (read once)
You enroll in **Play App Signing** (default for new apps). You keep an **upload key**;
Google holds the real **app signing key**. You sign every upload with the upload key.
If the upload key is ever lost/compromised, Google can reset it — but still **back it
up** (see the end). Losing it is not catastrophic, but don't be careless.

## Prerequisites (already set up on this Mac)
- JDK 21 on PATH (`java`, `keytool`) — from `~/.bash_profile`. Open a **new terminal**
  (or `source ~/.bash_profile`) so `keytool` resolves.
- `ANDROID_HOME` set; the standard toolchain builds on JDK 21 (verified).

---

## Step 1 — Generate your upload keystore (once)
Keep the `.jks` OUTSIDE the repo (it's gitignored anyway):
```bash
mkdir -p ~/keys
keytool -genkeypair -v \
  -keystore ~/keys/zenbubbles-upload.jks \
  -alias zenbubbles-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```
It prompts for:
- a **keystore password** (choose one, save it),
- name/org fields (any sensible values — e.g. Sole Via Entertainment LLC),
- a **key password** (press Enter to reuse the keystore password, or set a separate one).

## Step 2 — Point the build at it
Copy the template and fill in your real values:
```bash
cp apps/pop-zen/android/keystore.properties.example apps/pop-zen/android/keystore.properties
```
Edit `apps/pop-zen/android/keystore.properties` (this file is **gitignored**):
```properties
storeFile=/Users/leandroviolim/keys/zenbubbles-upload.jks
storePassword=your-keystore-password
keyAlias=zenbubbles-upload
keyPassword=your-key-password
```

## Step 3 — Build the release AAB
The `.aab` bundles the web app, so build the **production** web assets first
(production = **LIVE** ads; do NOT pass `VITE_USE_TEST_ADS`):
```bash
cd apps/pop-zen
bun run build:mobile          # production web build → LIVE ads
bunx cap sync android
cd android
./gradlew :app:bundleRelease
```
Output:
```
apps/pop-zen/android/app/build/outputs/bundle/release/app-release.aab
```
Confirm it's signed with your upload key (not debug):
```bash
"$JAVA_HOME/bin/jarsigner" -verify -verbose -certs \
  app/build/outputs/bundle/release/app-release.aab | grep -i "CN=" | head
```

## Step 4 — Upload
Play Console → your app → **Testing ▸ Internal testing** (recommended first) →
Create release → upload `app-release.aab` → roll out. Promote to Production when ready.

---

## Versioning (each upload needs a higher versionCode)
In `apps/pop-zen/android/app/build.gradle`:
```
versionCode 1        // bump to 2, 3, … for every new upload
versionName "1.0"    // user-facing; bump on real releases (1.0.1, …)
```
Android versionCode is **independent** of the iOS build number — they don't need to match.

## ⚠️ Back up (do not skip)
- Save `~/keys/zenbubbles-upload.jks` **and** both passwords in your password manager /
  a safe backup. They're not in git (by design).
- Never commit `keystore.properties` or any `.jks` (the `.gitignore` blocks them).

## Notes
- `minifyEnabled false` (no R8/obfuscation) for a smooth first release — fine for a
  Capacitor web app. Can enable later if desired.
- Release builds without `keystore.properties` still run, but sign with the **debug** key
  and **cannot** be uploaded to Play — that's intentional.
