# Standalone deployment and backend configuration

This repository is exclusively for the independent Wallet QA Lab. It does not depend on or modify any other project.

## 1. Create an empty GitHub repository
On GitHub select **New repository**, name it `samsung-wallet-qa-lab`, and keep it private while configuring your sandbox. Do not initialize with a README. Unzip this package, then in the root folder:

```bash
git init -b main
git add .
git commit -m "Initialize standalone Wallet QA lab"
git remote add origin https://github.com/YOUR_USERNAME/samsung-wallet-qa-lab.git
git push -u origin main
```

If you have the included `.bundle` artifact, its history may be imported directly. Avoid uploading real payment information.

## 2. Independent Supabase project — already created

- Project: `wallet-qa-lab` · `mvypyjjfqjiuolluyhmj` · region `us-east-1` · free plan.
- Dashboard: https://supabase.com/dashboard/project/mvypyjjfqjiuolluyhmj
- Public API URL: `https://mvypyjjfqjiuolluyhmj.supabase.co`
- Both `wallet_qa_runs` and `wallet_qa_defects` already exist. **Do not rerun the policy-creation SQL against this existing project**, because duplicate policies would raise errors.
- Each table has RLS enabled, owner-only authenticated access and no anonymous table-read permission. New database is completely separate from Predictify.
- Browser-safe publishable key is set in `.env.example` and in the build script's defaults; only change if rotating keys or switching to a different sandbox. Service-role/secret keys must never appear in client-side files.

**Required action for local and deployed magic-link login:** Configure Auth → URL Configuration in this project's Supabase dashboard. Set a suitable Site URL and add `http://localhost:4173/cloud.html` to the redirect allowlist for local testing; after deploying, add your exact `https://YOUR-VERCEL-HOST/cloud.html` URL. Check that Email authentication is enabled. Test with a real address you control. Supabase Auth emails can be subject to rate limits.

`cloud.html` signs users in via Supabase Auth and writes only synthetic QA run and defect records to the tables above. Tokens are stored in the browser's sessionStorage for the demonstration. It is not hardened for real customer data.

## 2a. Configure the standalone source

No secret key is required. `npm run build` writes `dist/cloud-config.js` with the independent project's **public** endpoint and publishable key. If you ever change databases, override them in the build environment with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` and rebuild.

## 3. Deploy frontend to Vercel
1. Import the **new** `samsung-wallet-qa-lab` GitHub repo into Vercel.
2. Root Directory: repository root. Framework: Other. Build command: `npm run build`. Output Directory: `dist`.
3. Optionally add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as build-time environment variables; the independent sandbox public values are already configured as defaults. Deploy.
4. Open the deployed root path for the simulator, and `/cloud.html` for authenticated database-backed QA reports.
5. Configure Supabase Auth redirect allowlist for your Vercel domain and any preview URLs you actually plan to use.

## 4. Run tests
```bash
npm install
npm test
npx playwright install chromium
npm run test:e2e
```

Android automation requires Android Studio, ADB, Java/Gradle and Appium with UiAutomator2. See the root README. GitHub Actions runs Node unit tests and Playwright tests.

## Security and scope
The UI is fictional; it does not process cards, tokenize payments, conduct NFC operations or integrate with Samsung Wallet. Protect test logs from real credentials. The optional Supabase QA database is for educational reports only.
