# WEBXWHALE Bulk SMS — Starter Project

A single-shop-owner starter for contact import, campaign drafts, recipient validation, and SMS-provider integration scaffolding.

## Included
- `web/`: React + Vite dashboard (contacts, CSV import, campaign composer, preview, campaign history)
- `api/`: Express API, MongoDB models, contact normalization, consent checks, campaign routes, webhook scaffold
- `android/`: Expo/React Native contact-import companion starter
- `docs/`: architecture and India promotional-SMS compliance checklist

## Important: what is and isn't live
This project is a **starter implementation**, not a ready-to-send commercial SMS service. SMS submission is disabled by default. Before sending real promotional SMS in India, configure your registered Principal Entity/sender header, approved DLT content template, applicable consent records, recipient preference/opt-out checks, and an SMS provider account. Contact import does not itself establish marketing consent.

Provider APIs differ, so `api/src/providers/smsProvider.js` is an explicit adapter boundary and intentionally does not guess a provider endpoint or credentials. Implement the provider's official API and delivery webhook format there after selecting a provider.

## Requirements
- Node.js 20+ recommended
- MongoDB instance
- Optional Redis instance for future queue workers
- Google Cloud OAuth app if using Google Contacts
- Expo tooling for Android companion app

## Quick start

### 1) API
```bash
cd api
cp .env.example .env
npm install
# Set MONGODB_URI and a long random JWT_SECRET in .env
npm run dev
```
API defaults to `http://localhost:5000`. Health check: `GET /api/health`.

### 2) Web
```bash
cd web
cp .env.example .env
npm install
npm run dev
```
Open the Vite URL shown in the terminal. Set `VITE_API_URL=http://localhost:5000`.

### 3) Android contacts companion
```bash
cd android
cp .env.example .env
npm install
npx expo start
```
Set `EXPO_PUBLIC_API_URL` to an API URL reachable from the phone (not `localhost` on a physical device). Grant Contacts permission only when prompted. The starter previews contacts and requires the user to press Import.

## First-run flow
1. Register/login to the API using `/api/auth/register` and `/api/auth/login` (the starter web UI has a local development session helper; do not expose public registration without adding abuse protection).
2. Import contacts from CSV or the Android companion app.
3. Review imported contacts and record valid consent through your documented consent workflow. Imported contacts default to `unknown`.
4. Create a campaign draft and run preview.
5. Real sending remains disabled until you implement and verify the chosen provider adapter and compliance configuration.

## Security checklist before deployment
- Use HTTPS everywhere.
- Replace development secrets; never commit `.env`.
- Restrict CORS to your deployed frontend origin.
- Add rate limits, request size limits, logging/monitoring, backups and account recovery.
- Protect Google OAuth refresh tokens using a managed secret store or encryption-at-rest.
- Add CSRF/state validation to OAuth flows and verify webhook signatures per provider docs.
- Add consent capture/evidence, suppression list, unsubscribe/STOP workflow where applicable, and audit logs.
- Do not log full phone numbers or message contents unnecessarily.
- Review applicable Indian telecom rules and provider terms with the chosen provider before sending.
