# Personal Budget — Local iOS Web App

A private, no-server personal finance PWA designed for iPhone.

## Included
- Minimal 5-tab navigation: Home / Account / Transactions / Budget / Setting
- Tap a category on Home to enter an expense for a date
- Manual accounts and account transfers
- Manual investments: stocks, mutual funds, FDs, gold, bonds, other
- Net worth = assets - liabilities
- Monthly budget rules: Fixed / Minimum / Remaining
- Budget transfers between categories
- Autopay/recurring tracker
- Savings goals
- Charts/insights
- JSON backup/import
- LocalStorage + offline service worker
- No analytics, bank connection, GPS, ads, or required account

## iPhone
Open the hosted HTTPS URL in Safari → Share → Add to Home Screen → Open as Web App → Add.

## Free hosting
The files can be hosted for free on a static host such as GitHub Pages or Cloudflare Pages. The website code may be public, but financial data stays in the browser's local storage and is not uploaded by this app.

## Important PWA limitations
- A web app cannot provide the same native Action Button/App Intent integration as a native iOS app. You can create an iOS Shortcut that opens the web-app URL and assign that Shortcut to the Action Button on supported iPhones.
- App-specific Face ID locking is not provided by this pure web version.
- Autopay entries are a tracker; the app does not detect real bank charges.
