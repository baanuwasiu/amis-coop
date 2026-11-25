# AMIS Cooperative · Finance Desk

A working frontend demo of the accounting system described in *AMIS Members Accounting Software Module Guide* (Asaa Royal Associates, November 2026). It is built for a live walkthrough, not production: every figure is sample data, everything runs in the browser, and there is no backend.

The app follows the guide’s flow: **capture → classify → post → report → review**.

---

## What is implemented

| Module | What works |
|---|---|
| Secure login | Four demo users with role-based access: Finance Officer, Accountant, Treasurer, Auditor |
| Dashboard | Bank, cash, member savings, loans, period surplus, monthly cash chart, pending approvals, exceptions |
| Daily transactions | Record income and expenditure, auto reference, member tagging, evidence reference, pending → approve/reject → posted |
| Journals | Two-line journal entry with debit/credit accounts and amount; posts to the ledger |
| Member ledgers | 15 members, savings/share/loan balances, statement with opening balance and running balance, printable |
| General ledger | Chart of accounts with opening, debits, credits and closing; drill-down to every posting |
| Trial balance | Derived from posted journals; debit/credit totals and balanced check |
| Reports | Income & expenditure, statement of financial position, printable statements |
| Fixed assets | Asset register, additions, straight-line monthly depreciation posting |
| Inventory | Stock items, reorder levels, stock receipts and issues with ledger postings |
| Audit & compliance | Append-only activity trail, exception register, resolve actions |
| Period close | Checklist, readiness checks, Treasurer-controlled lock/reopen |
| Team & access | Users, permission matrix, backup JSON export, reset sample data |

The visual language follows the guide: deep green, gold, cream, Georgia headings and a dense finance-desk layout. It is responsive down to a phone; the sidebar becomes a drawer.

---

## Demo accounts

Password for every account: **`demo1234`**

| Username | Name | Role | What they can do |
|---|---|---|---|
| `finance01` | Amina Yusuf | Finance Officer | Create receipts, payments and draft journals; cannot approve |
| `accountant` | Sadiq Bello | Accountant | Create and approve entries, post journals, manage assets and inventory |
| `treasurer` | Hajia R. Lawal | Treasurer | Approve entries, view reports, lock/reopen the period |
| `auditor01` | Musa Danjuma | Auditor | Read-only across the books and audit trail |

The top-bar user switch changes the active demo user without signing out. This is a demo affordance, not a production feature.

---

## Run locally

```bash
cd amis-coop
npm install
npm run dev
```

Open `http://localhost:5173`.

Production build:

```bash
npm run build
npm run preview
```

Requires Node 20+ (tested on Node 26, Vite 7).

---

## Deploy to Vercel from GitHub

The repository is ready for a standard Vercel Vite import.

1. Create a GitHub repository and push this folder:
   ```bash
   cd amis-coop
   git init -b main
   git add .
   git commit -m "AMIS Cooperative finance desk demo"
   git remote add origin https://github.com/<your-account>/<repo>.git
   git push -u origin main
   ```
2. In Vercel: **Add New → Project → Import Git Repository**, select the repo.
3. Vercel detects Vite automatically:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Deploy. `vercel.json` already contains the SPA rewrite used by the hash-based routes.

Or with the Vercel CLI:

```bash
npm i -g vercel
vercel
vercel --prod
```

No environment variables are required. Everything is client-side.

---

## Five-minute walkthrough

1. **Sign in as Accountant.** The dashboard shows bank, cash, member savings, loans and a period surplus of about **₦1.26m**. Three items are waiting for approval.
2. **Approve a pending savings receipt.** The posted total and member balance update immediately.
3. **Record a receipt:** Transactions → Record receipt → choose a member → “Monthly savings” → amount → submit. It waits for approval; approve it.
4. **Open the member:** Member ledgers → select the member → Savings tab. The statement shows the opening balance, the new deposit and the closing balance. Print it if useful.
5. **Post a journal:** Journal entries → New journal → set debit `5050 Depreciation`, credit `1045 Accumulated depreciation`, amount `50,000`. The trial balance remains balanced.
6. **Depreciate an asset:** Fixed assets → Depreciate on the first asset. The register’s accumulated depreciation and the ledger both move.
7. **Issue stock:** Inventory → Out on an item. Inventory value and operating expenses both move.
8. **Show reports:** Reports → Income & expenditure and Financial position. The balance sheet shows **Assets = Liabilities + Members’ funds**.
9. **Switch roles:** Top-bar user switch → Treasurer → Period close → Lock period. New entries are blocked. Switch to Auditor: the app becomes read-only.
10. **Reset:** Team & access → Reset demo restores the seeded books.

The sidebar has a **Demo guide** link with the same steps for the presenter.

---

## Data and limitations

- State is stored in `localStorage` under `amis-coop-finance-demo-v1`. Clearing site data or choosing **Reset demo** restores the seed.
- No backend, no live database, no real authentication, no bank integration, no email or file uploads. Evidence references are text labels only.
- All names, balances, transactions, assets and audit events are illustrative. The app is a functional UI prototype, not an accounting system for real money.
- Printing uses the browser’s print dialog and a generated statement page.
- The seed is deterministic and balanced: the trial balance equals, and the statement of financial position balances, before any demo entries.

---

## Project structure

```
src/
  data/seed.js          chart of accounts, members, sample transactions, assets, inventory
  lib/accounting.js     ledger, trial balance, I&E, financial position, member statements
  lib/store.jsx         app state, localStorage, roles, actions, audit trail
  components/           icons, buttons, cards, modals, tables, print helper
  pages/                dashboard, transactions, journals, members, ledger, trial balance,
                        reports, assets, inventory, audit, close, team
  App.jsx               login, shell, navigation, demo guide
scripts/
  e2e.mjs               headless Chrome walkthrough (optional QA)
  smoke.mjs             login/dashboard smoke test
```

---

## Verification

- `npm run build` passes (Vite production build).
- The headless walkthrough checks all twelve pages, receipt creation and approval, journal posting, member statements, depreciation, stock receipt, financial position, period lock/reopen, auditor read-only mode and 390px mobile layout with no horizontal overflow. Last run: **0 console errors**.
- The QA scripts expect Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` and a dev server on `http://127.0.0.1:5173`; they are development helpers, not part of the deployed app.

---

*Built from the AMIS Members Accounting Software Module Guide. Sample data only.*
