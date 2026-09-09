# 💰 Budget — Local-First Personal Finance PWA (v7.9)

> **Note:** This project was purely **vibe coded** with AI. I built it because I was genuinely struggling to figure out where my money was going every month, and I wanted a fast, lightweight tool tailored specifically to how I track expenses. 

I actively use this daily and update it from time to time whenever I run into a bug or brainstorm a new feature to make managing finances smoother.

---

## ✨ Features

* **100% Private & Local-First:** Zero backend servers, no cloud databases, and zero tracking. All your financial data lives securely in your own browser via `localStorage` with Web Locks persistence.
* **Progressive Web App (PWA):** Installable on iOS, Android, and Desktop directly from the browser. Fully functional offline with Service Worker caching.
* **Dynamic Budget Transfers (Monthly Scoped):** Move budget between categories mid-month when plans change. At the start of the next month, category budgets automatically reset to your default allocations.
* **Auto-Debit Engine:** Set up recurring commitments (weekly, monthly, quarterly, or yearly). The app automatically logs the debit when due upon launch and advances the schedule.
* **Interactive Savings Goals:** Track targets with custom deadlines, log progress, and visualize completion directly from your dashboard.
* **Multi-Currency Support:** Switch effortlessly between INR (₹), GBP (£), USD ($), EUR (€), and AED (د.إ) with localized number formatting.
* **Category-Bound Labels:** Organize transactions with contextual tags (e.g., `#Rent` or `#Electricity` under Home Bills; `#Mess` or `#Eating Out` under Food).
* **Flexible Date Filtering & Summary:** Filter income, spending, and net balance by Month, Year, Custom Date Ranges, or All-Time.
* **Appearance Customizer:** Personalize your workspace with custom background color palettes and switch between typography styles (Inter, System Native, Plus Jakarta Sans, JetBrains Mono, or Classic Serif).
* **Data Ownership:** Export/import full JSON backups anytime or download a CSV copy of your transactions.

---

## 🚀 Getting Started

1. Clone or download this repository.
2. Open `index.html` directly in any modern web browser, or host it on GitHub Pages.
3. On mobile (Safari/Chrome), tap **Share** $\rightarrow$ **Add to Home Screen** to run it as a standalone app.

---

## 🛠️ Tech Stack

* HTML5
* CSS3 (Custom Variables & Responsive Flex/Grid Layouts)
* Vanilla JavaScript (ES2022, Service Worker API, Storage Persistence)
