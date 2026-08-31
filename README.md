# Personal Budget PWA v2

Local-first personal finance PWA designed for iPhone and future Mac app migration.

Features include income/expense categories, category manager, budgets with fixed/minimum/remaining rules, budget transfers, rollover, accounts, account transfers, manual investments, liabilities/debt plan, recurring payments, goals, labels, transaction editing, charts/insights, cash-flow reports, JSON backup/restore and CSV export.

No bank sync, GPS, analytics or device tracking.


## v4 mobile fixes
- Phone-first 430px layout and safe-area handling
- Prevented horizontal overflow/overlapping controls
- Local device date is used instead of UTC for today's date
- Removed category helper text
- Fixed robust income and expense save validation
- Service-worker cache bumped to v4


## v6
All major sections now have working add/edit/delete forms. CSV templates are in `csv-templates/`. JSON remains the full-fidelity backup format.
