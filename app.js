/**
 * Personal Budget PWA — v7.6 Logic Engine (Part 1/2)
 * Features: Currency Engine, Flexible Duration Summaries, Safe Persistence
 */

const STORAGE_KEY = "personal-budget-db";
const LEGACY_KEYS = ["personalBudgetLocalV2", "pb_v6", "pb_v5", "pb_v4", "pb_v3", "pb_v2", "pb_v1"];

const CURRENCIES = {
  INR: { symbol: "₹", locale: "en-IN", name: "INR (₹) - Indian Rupee" },
  GBP: { symbol: "£", locale: "en-GB", name: "GBP (£) - British Pound" },
  USD: { symbol: "$", locale: "en-US", name: "USD ($) - US Dollar" },
  EUR: { symbol: "€", locale: "de-DE", name: "EUR (€) - Euro" },
  AED: { symbol: "AED ", locale: "ar-AE", name: "AED (د.إ) - UAE Dirham" }
};

const DEFAULT_EXP = [
  { name: "Markets", icon: "🎯", color: "#e8dcff" },
  { name: "Food & Drink", icon: "🍽️", color: "#fff1cf" },
  { name: "Transport", icon: "🚆", color: "#dcecff" },
  { name: "Shopping", icon: "🛍️", color: "#ffdede" },
  { name: "Self-Care", icon: "🧴", color: "#eee1ff" },
  { name: "Home Bills", icon: "⚡", color: "#ffe8d7" },
  { name: "Health", icon: "✚", color: "#d6f8f1" },
  { name: "Education", icon: "🎓", color: "#ffe2ec" }
];

const DEFAULT_INC = [
  { name: "Salary", icon: "💼", color: "#e1f6e9" },
  { name: "Pocket Money", icon: "💵", color: "#f7e7ff" },
  { name: "Interest", icon: "🏦", color: "#e5f0ff" },
  { name: "Dividend", icon: "📈", color: "#fff0c9" },
  { name: "Freelance", icon: "🧑‍💻", color: "#e8f7f2" },
  { name: "Other Income", icon: "➕", color: "#f1f1f6" }
];

const DEFAULT_LABELS = [
  { name: "Rent", cat: "Home Bills" },
  { name: "Cleaning", cat: "Home Bills" },
  { name: "Subscriptions", cat: "Home Bills" },
  { name: "Electricity", cat: "Home Bills" },
  { name: "Mess", cat: "Food & Drink" },
  { name: "Eating Outside", cat: "Food & Drink" },
  { name: "Groceries", cat: "Food & Drink" },
  { name: "Cab / Auto", cat: "Transport" },
  { name: "Fuel", cat: "Transport" }
];

const ADVICE = [
  ["Protect your savings rate", "Fund saving and investing before expanding discretionary spending."],
  ["Move the budget, not the goal", "For a big purchase, transfer money between categories so your total monthly plan stays honest."],
  ["Watch fixed costs", "Recurring payments quietly compound. Review subscriptions and autopays every few months."],
  ["Net worth beats cash balance", "Track investments and liabilities alongside cash to see whether your overall position is improving."],
  ["Use Remaining carefully", "A Remaining category should receive only the pool left after fixed and minimum allocations."],
  ["Build a buffer", "An emergency reserve reduces the need to raid long-term investments when something unexpected happens."]
];

function blank() {
  return {
    version: 7,
    settings: { currency: "INR" },
    expenseCats: DEFAULT_EXP,
    incomeCats: DEFAULT_INC,
    accounts: [],
    tx: [],
    investments: [],
    liabilities: [],
    budgets: [],
    budgetTransfers: [],
    autopay: [],
    goals: [],
    labels: DEFAULT_LABELS,
    rollovers: []
  };
}

function migrate(x) {
  let b = blank();
  if (!x || typeof x !== "object") return b;
  Object.assign(b, x);
  b.version = 7;
  b.settings = { ...b.settings, ...(x.settings || {}) };
  if (!b.settings.currency || !CURRENCIES[b.settings.currency]) {
    b.settings.currency = "INR";
  }
  b.expenseCats = Array.isArray(x.expenseCats) && x.expenseCats.length ? x.expenseCats : DEFAULT_EXP;
  b.incomeCats = Array.isArray(x.incomeCats) && x.incomeCats.length ? x.incomeCats : DEFAULT_INC;
  b.tx = Array.isArray(x.tx) ? x.tx : [];
  b.accounts = Array.isArray(x.accounts) ? x.accounts : [];
  b.investments = Array.isArray(x.investments) ? x.investments : [];
  b.liabilities = Array.isArray(x.liabilities) ? x.liabilities : [];
  b.budgets = Array.isArray(x.budgets) ? x.budgets : [];
  b.budgetTransfers = Array.isArray(x.budgetTransfers) ? x.budgetTransfers : [];
  b.autopay = Array.isArray(x.autopay) ? x.autopay : [];
  b.goals = Array.isArray(x.goals) ? x.goals : [];
  if (Array.isArray(x.labels)) {
    b.labels = x.labels.map(l => typeof l === "string" ? { name: l, cat: "" } : l);
  } else {
    b.labels = DEFAULT_LABELS;
  }
  b.rollovers = Array.isArray(x.rollovers) ? x.rollovers : [];
  return b;
}

function load() {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    for (const key of LEGACY_KEYS) {
      const legacyData = localStorage.getItem(key);
      if (legacyData) {
        raw = legacyData;
        break;
      }
    }
  }
  try {
    return raw ? migrate(JSON.parse(raw)) : blank();
  } catch (e) {
    return blank();
  }
}

let db = load();

const $ = id => document.getElementById(id);
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).substring(2, 8);

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  renderAll();
}

function money(n) {
  const code = db.settings?.currency || "INR";
  const conf = CURRENCIES[code] || CURRENCIES.INR;
  const num = Math.round(Number(n) || 0);
  return conf.symbol + num.toLocaleString(conf.locale);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function today() {
  return localDate();
}

function monthKey(d = today()) {
  return String(d).slice(0, 7);
}

function monthLabel(k = monthKey()) {
  let [y, m] = k.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function months() {
  let out = [], d = new Date();
  for (let i = 0; i < 24; i++) {
    let k = localDate(d).slice(0, 7);
    out.push(k);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function years() {
  let currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
}

function modal(html) {
  $("modalBody").innerHTML = html;
  $("modal").classList.add("open");
}

function closeModal() {
  $("modal").classList.remove("open");
  $("modalBody").innerHTML = "";
}

function openFormModal(title, bodyHtml, onSave) {
  modal(`
    <h2>${title}</h2>
    <div id="formContainer">${bodyHtml}</div>
    <div class="actions" style="margin-top:15px">
      <button type="button" id="modalCancelBtn">Cancel</button>
      <button type="button" class="primary" id="modalSaveBtn">Save</button>
    </div>
  `);
  
  $("modalCancelBtn").onclick = closeModal;
  $("modalSaveBtn").onclick = () => {
    try {
      onSave();
    } catch (err) {
      console.error(err);
      alert("Error saving record: " + err.message);
    }
  };
}

function accountOptions(selected = "") {
  return db.accounts.map(a => `<option value="${a.id}" ${a.id === selected ? 'selected' : ''}>${esc(a.name)}</option>`).join("") || '<option value="">Cash / Default</option>';
}

function labelOptions(category = "", selected = "") {
  const filtered = db.labels.filter(l => !l.cat || l.cat === category);
  return filtered.map(l => `<option value="${esc(l.name)}" ${l.name === selected ? 'selected' : ''}>#${esc(l.name)}</option>`).join("");
}

// --- Currency Selector ---
function openCurrencySelector() {
  const current = db.settings?.currency || "INR";
  const html = `
    <label>Select Preferred Currency</label>
    <select id="currencySelect">
      ${Object.entries(CURRENCIES).map(([code, item]) => `
        <option value="${code}" ${code === current ? 'selected' : ''}>${esc(item.name)}</option>
      `).join('')}
    </select>
    <p class="muted" style="font-size:12px">All financial amounts, budgets, and balance totals will format with this currency symbol automatically.</p>
  `;

  openFormModal("Change Currency", html, () => {
    const selected = $("currencySelect").value;
    if (CURRENCIES[selected]) {
      db.settings.currency = selected;
      save();
      closeModal();
    }
  });
}

// --- Entry Form Implementations ---
function openExpense(catName) {
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  const html = `
    <span class="pill">${esc(catName)}</span>
    <label>Amount (${symbol}) *</label>
    <input id="fAmt" type="number" step="any" min="0.01" inputmode="decimal" placeholder="0.00" autofocus>
    <label>Description</label>
    <input id="fDesc" placeholder="${esc(catName)}">
    <div class="row">
      <div>
        <label>Date</label>
        <input id="fDate" type="date" value="${today()}">
      </div>
      <div>
        <label>Account</label>
        <select id="fAcc">${accountOptions()}</select>
      </div>
    </div>
    <label>Label</label>
    <select id="fLabel"><option value="">None</option>${labelOptions(catName)}</select>
    <label>Note</label>
    <textarea id="fNote" placeholder="Optional notes"></textarea>
  `;

  openFormModal("Add Expense", html, () => {
    const amt = parseFloat($("fAmt").value);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    db.tx.unshift({
      id: uid(),
      type: "expense",
      cat: catName,
      amount: amt,
      desc: $("fDesc").value.trim() || catName,
      date: $("fDate").value || today(),
      account: $("fAcc").value,
      label: $("fLabel").value,
      note: $("fNote").value.trim()
    });

    save();
    closeModal();
  });
}

function openIncome(catName = "") {
  const cats = db.incomeCats;
  const initialCat = catName || cats[0]?.name || "Salary";
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  
  const html = `
    ${catName ? `<span class="pill">${esc(catName)}</span>` : `
      <label>Category</label>
      <select id="iCat" onchange="updateIncomeLabels()">${cats.map(c => `<option value="${esc(c.name)}" ${c.name === initialCat ? 'selected' : ''}>${esc(c.name)}</option>`).join("")}</select>
    `}
    <label>Amount (${symbol}) *</label>
    <input id="iAmt" type="number" step="any" min="0.01" inputmode="decimal" placeholder="0.00" autofocus>
    <label>Source / Description</label>
    <input id="iDesc" placeholder="Salary / allowance / payout">
    <div class="row">
      <div>
        <label>Date</label>
        <input id="iDate" type="date" value="${today()}">
      </div>
      <div>
        <label>Account</label>
        <select id="iAcc">${accountOptions()}</select>
      </div>
    </div>
    <label>Label</label>
    <select id="iLabel"><option value="">None</option>${labelOptions(initialCat)}</select>
    <label>Note</label>
    <textarea id="iNote" placeholder="Optional notes"></textarea>
  `;

  openFormModal("Add Income", html, () => {
    const amt = parseFloat($("iAmt").value);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    const category = catName || ($("iCat") ? $("iCat").value : "Salary");

    db.tx.unshift({
      id: uid(),
      type: "income",
      cat: category,
      amount: amt,
      desc: $("iDesc").value.trim() || category,
      date: $("iDate").value || today(),
      account: $("iAcc").value,
      label: $("iLabel").value,
      note: $("iNote").value.trim()
    });

    save();
    closeModal();
  });
}

function updateIncomeLabels() {
  const cat = $("iCat").value;
  $("iLabel").innerHTML = `<option value="">None</option>${labelOptions(cat)}`;
}

function openQuickIncome() {
  openIncome();
}

function openAccount(editId = "") {
  const a = db.accounts.find(x => x.id === editId) || {};
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  const html = `
    <label>Account Name *</label>
    <input id="aName" value="${esc(a.name || "")}" placeholder="Bank / Cash / Wallet" autofocus>
    <label>Type</label>
    <select id="aType">
      ${["Bank", "Cash", "Wallet", "Credit Card", "Broker", "Other"].map(x => `<option value="${x}" ${a.type === x ? 'selected' : ''}>${x}</option>`).join("")}
    </select>
    <label>Opening Balance (${symbol})</label>
    <input id="aBal" type="number" step="any" value="${a.opening ?? 0}">
    <label>Note</label>
    <input id="aNote" value="${esc(a.note || "")}">
  `;

  openFormModal(editId ? "Edit Account" : "Add Account", html, () => {
    const name = $("aName").value.trim();
    if (!name) return alert("Account name is required.");

    let target = db.accounts.find(x => x.id === editId);
    if (!target) {
      target = { id: uid() };
      db.accounts.push(target);
    }
    target.name = name;
    target.type = $("aType").value;
    target.opening = parseFloat($("aBal").value) || 0;
    target.note = $("aNote").value.trim();

    save();
    closeModal();
  });
}

function accountBalance(a) {
  let v = Number(a.opening) || 0;
  db.tx.forEach(t => {
    if (t.account === a.id) {
      if (t.type === 'income') v += Number(t.amount) || 0;
      if (t.type === 'expense') v -= Number(t.amount) || 0;
    }
    if (t.type === 'transfer') {
      if (t.from === a.id) v -= Number(t.amount) || 0;
      if (t.to === a.id) v += Number(t.amount) || 0;
    }
  });
  return v;
}

function openTransfer() {
  if (db.accounts.length < 2) return alert("Add at least two accounts to execute transfers.");
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  const html = `
    <label>From Account</label>
    <select id="tFrom">${accountOptions()}</select>
    <label>To Account</label>
    <select id="tTo">${accountOptions()}</select>
    <label>Amount (${symbol}) *</label>
    <input id="tAmt" type="number" step="any" min="0.01" autofocus>
    <label>Date</label>
    <input id="tDate" type="date" value="${today()}">
    <label>Note</label>
    <input id="tNote" placeholder="Optional">
  `;

  openFormModal("Account Transfer", html, () => {
    const amt = parseFloat($("tAmt").value);
    const from = $("tFrom").value;
    const to = $("tTo").value;

    if (!amt || amt <= 0) return alert("Enter a valid amount.");
    if (from === to) return alert("Source and destination accounts must be different.");

    db.tx.unshift({
      id: uid(),
      type: 'transfer',
      amount: amt,
      from,
      to,
      date: $("tDate").value || today(),
      desc: 'Account transfer',
      note: $("tNote").value.trim()
    });

    save();
    closeModal();
  });
}

function openInvestment(editId = "") {
  const i = db.investments.find(x => x.id === editId) || {};
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  const html = `
    <label>Type</label>
    <select id="vType">
      ${["Stock", "Mutual Fund", "FD", "Gold", "Bond", "ETF", "Crypto", "Other"].map(x => `<option value="${x}" ${i.type === x ? 'selected' : ''}>${x}</option>`).join("")}
    </select>
    <label>Name / Scheme *</label>
    <input id="vName" value="${esc(i.name || "")}" placeholder="Company / Fund / Asset" autofocus>
    <div class="row">
      <div>
        <label>Quantity / Units</label>
        <input id="vQty" type="number" step="any" value="${i.qty ?? 1}">
      </div>
      <div>
        <label>Invested (${symbol})</label>
        <input id="vInv" type="number" step="any" value="${i.invested ?? 0}">
      </div>
    </div>
    <label>Current Value (${symbol}) *</label>
    <input id="vCur" type="number" step="any" value="${i.current ?? 0}">
    <label>Broker / Provider</label>
    <input id="vBroker" value="${esc(i.broker || "")}" placeholder="Broker / Bank">
    <label>Notes</label>
    <textarea id="vNote">${esc(i.note || "")}</textarea>
  `;

  openFormModal(editId ? "Edit Investment" : "Add Investment", html, () => {
    const name = $("vName").value.trim();
    if (!name) return alert("Investment name is required.");

    let item = db.investments.find(x => x.id === editId);
    if (!item) {
      item = { id: uid() };
      db.investments.push(item);
    }

    item.type = $("vType").value;
    item.name = name;
    item.qty = parseFloat($("vQty").value) || 0;
    item.invested = parseFloat($("vInv").value) || 0;
    item.current = parseFloat($("vCur").value) || 0;
    item.broker = $("vBroker").value.trim();
    item.note = $("vNote").value.trim();

    save();
    closeModal();
  });
}

function openLiability(editId = "") {
  const l = db.liabilities.find(x => x.id === editId) || {};
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  const html = `
    <label>Liability / Loan Name *</label>
    <input id="lName" value="${esc(l.name || "")}" placeholder="Home Loan / Credit Card" autofocus>
    <label>Outstanding Amount (${symbol}) *</label>
    <input id="lAmt" type="number" step="any" value="${l.amount ?? 0}">
    <label>Interest Rate (%)</label>
    <input id="lRate" type="number" step="0.01" value="${l.rate ?? 0}">
    <label>Monthly EMI (${symbol})</label>
    <input id="lEmi" type="number" step="any" value="${l.emi ?? 0}">
    <label>Next Due Date</label>
    <input id="lDue" type="date" value="${l.due || ""}">
  `;

  openFormModal(editId ? "Edit Liability" : "Add Liability", html, () => {
    const name = $("lName").value.trim();
    if (!name) return alert("Liability name is required.");

    let target = db.liabilities.find(x => x.id === editId);
    if (!target) {
      target = { id: uid() };
      db.liabilities.push(target);
    }

    target.name = name;
    target.amount = parseFloat($("lAmt").value) || 0;
    target.rate = parseFloat($("lRate").value) || 0;
    target.emi = parseFloat($("lEmi").value) || 0;
    target.due = $("lDue").value;

    save();
    closeModal();
  });
}

function editTx(id) {
  const t = db.tx.find(x => x.id === id);
  if (!t) return;

  const isExpense = t.type === 'expense';
  const catList = isExpense ? db.expenseCats : db.incomeCats;
  const currentCat = t.cat || catList[0]?.name || "";
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;

  const html = `
    <label>Category</label>
    <select id="editCat" onchange="updateEditLabels()">
      ${catList.map(c => `<option value="${esc(c.name)}" ${t.cat === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join("")}
    </select>
    <label>Amount (${symbol}) *</label>
    <input id="editAmt" type="number" step="any" value="${t.amount}">
    <label>Description</label>
    <input id="editDesc" value="${esc(t.desc || "")}">
    <div class="row">
      <div>
        <label>Date</label>
        <input id="editDate" type="date" value="${t.date || today()}">
      </div>
      <div>
        <label>Account</label>
        <select id="editAcc">${accountOptions(t.account)}</select>
      </div>
    </div>
    <label>Label</label>
    <select id="editLabel"><option value="">None</option>${labelOptions(currentCat, t.label)}</select>
    <label>Note</label>
    <textarea id="editNote">${esc(t.note || "")}</textarea>
  `;

  openFormModal("Edit Transaction", html, () => {
    const amt = parseFloat($("editAmt").value);
    if (!amt || amt <= 0) return alert("Enter a valid amount.");

    t.cat = $("editCat").value;
    t.amount = amt;
    t.desc = $("editDesc").value.trim() || t.cat;
    t.date = $("editDate").value || today();
    t.account = $("editAcc").value;
    t.label = $("editLabel").value;
    t.note = $("editNote").value.trim();

    save();
    closeModal();
  });
}

function updateEditLabels() {
  const cat = $("editCat").value;
  $("editLabel").innerHTML = `<option value="">None</option>${labelOptions(cat)}`;
}
/**
 * Personal Budget PWA — v7.6 Logic Engine (Part 2/2)
 */

function openAutopay() {
  modal(`
    <h2>Autopay & Recurring</h2>
    <div class="actions"><button class="primary" onclick="openAutopayForm()">+ Add Commitment</button></div>
    <div class="list" style="margin-top:15px">
      ${db.autopay.map(a => `
        <div class="item">
          <div><b>${esc(a.name)}</b><br><span class="muted">${esc(a.frequency)} · Due ${esc(a.next || '—')} · ${esc(a.cat || 'General')}</span></div>
          <div class="right">
            ${money(a.amount)}<br>
            <button onclick="openAutopayForm('${a.id}')">Edit</button>
            <button onclick="deleteBy('autopay','${a.id}')">×</button>
          </div>
        </div>
      `).join('') || '<p class="muted">No recurring payments configured.</p>'}
    </div>
  `);
}

function openAutopayForm(id = "") {
  const a = db.autopay.find(x => x.id === id) || {};
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  const html = `
    <label>Name *</label>
    <input id="pName" value="${esc(a.name || "")}" placeholder="Netflix / Rent" autofocus>
    <div class="row">
      <div>
        <label>Amount (${symbol}) *</label>
        <input id="pAmt" type="number" step="any" value="${a.amount ?? 0}">
      </div>
      <div>
        <label>Next Due</label>
        <input id="pNext" type="date" value="${a.next || today()}">
      </div>
    </div>
    <label>Frequency</label>
    <select id="pFreq">
      ${["Weekly", "Monthly", "Quarterly", "Yearly"].map(x => `<option value="${x}" ${a.frequency === x ? 'selected' : ''}>${x}</option>`).join("")}
    </select>
    <label>Category</label>
    <select id="pCat">
      ${db.expenseCats.map(c => `<option value="${esc(c.name)}" ${a.cat === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join("")}
    </select>
    <label>Account</label>
    <select id="pAcc">${accountOptions(a.account)}</select>
  `;

  openFormModal(id ? "Edit Recurring Payment" : "Add Recurring Payment", html, () => {
    const name = $("pName").value.trim();
    const amt = parseFloat($("pAmt").value);
    if (!name || !amt) return alert("Name and valid amount are required.");

    let item = db.autopay.find(x => x.id === id);
    if (!item) {
      item = { id: uid() };
      db.autopay.push(item);
    }
    item.name = name;
    item.amount = amt;
    item.next = $("pNext").value;
    item.frequency = $("pFreq").value;
    item.cat = $("pCat").value;
    item.account = $("pAcc").value;

    save();
    openAutopay();
  });
}

function openGoal(id = "") {
  if (!id && db.goals.length > 0) {
    openGoalList();
    return;
  }
  openGoalForm(id);
}

function openGoalList() {
  modal(`
    <h2>🎯 Savings Goals</h2>
    <div class="actions"><button class="primary" onclick="openGoalForm()">+ New Savings Goal</button></div>
    <div class="list" style="margin-top:15px">
      ${db.goals.map(g => {
        const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
        return `
          <div class="card" style="margin:6px 0;padding:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <b>${esc(g.name)}</b>
              <span>${money(g.current)} / <b>${money(g.target)}</b></span>
            </div>
            <div class="bar" style="margin:8px 0"><i style="width:${pct}%"></i></div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="muted">${pct}% saved ${g.due ? `· Target: ${esc(g.due)}` : ''}</span>
              <span>
                <button onclick="openGoalForm('${g.id}')">Edit</button>
                <button onclick="deleteBy('goals','${g.id}');openGoalList()">×</button>
              </span>
            </div>
          </div>
        `;
      }).join('') || '<p class="muted">No savings goals created.</p>'}
    </div>
  `);
}

function openGoalForm(id = "") {
  const g = db.goals.find(x => x.id === id) || {};
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  const html = `
    <label>Goal Name *</label>
    <input id="gName" value="${esc(g.name || "")}" placeholder="e.g. Emergency Fund, Travel" autofocus>
    <div class="row">
      <div>
        <label>Target Amount (${symbol}) *</label>
        <input id="gTarget" type="number" step="any" min="1" value="${g.target ?? ""}">
      </div>
      <div>
        <label>Saved so far (${symbol})</label>
        <input id="gCur" type="number" step="any" min="0" value="${g.current ?? 0}">
      </div>
    </div>
    <label>Target Date (Optional)</label>
    <input id="gDue" type="date" value="${g.due || ""}">
    <label>Note</label>
    <input id="gNote" value="${esc(g.note || "")}" placeholder="Optional details">
  `;

  openFormModal(id ? "Edit Savings Goal" : "Add Savings Goal", html, () => {
    const name = $("gName").value.trim();
    const target = parseFloat($("gTarget").value);
    const current = parseFloat($("gCur").value) || 0;

    if (!name) return alert("Please enter a goal name.");
    if (!target || isNaN(target) || target <= 0) return alert("Please enter a valid target amount greater than 0.");

    let item = db.goals.find(x => x.id === id);
    if (!item) {
      item = { id: uid() };
      db.goals.push(item);
    }
    item.name = name;
    item.target = target;
    item.current = current;
    item.due = $("gDue").value;
    item.note = $("gNote").value.trim();

    save();
    openGoalList();
  });
}

function budgetBase() {
  let inc = db.tx.filter(t => t.type === 'income' && t.date?.startsWith(monthKey())).reduce((s, t) => s + Number(t.amount || 0), 0);
  let alloc = {};
  let fixed = 0, min = 0, remaining = [];

  db.budgets.forEach(b => {
    if (b.rule === 'remaining') remaining.push(b);
    else {
      alloc[b.cat] = Number(b.amount) || 0;
      if (b.rule === 'fixed') fixed += Number(b.amount) || 0;
      else min += Number(b.amount) || 0;
    }
  });

  let pool = Math.max(0, inc - fixed - min);
  remaining.forEach(b => alloc[b.cat] = pool / Math.max(1, remaining.length));
  return { inc, alloc, total: Object.values(alloc).reduce((s, v) => s + v, 0) };
}

function adjustedAlloc() {
  let a = { ...budgetBase().alloc };
  db.budgetTransfers.filter(t => t.date?.startsWith(monthKey())).forEach(t => {
    a[t.from] = (a[t.from] || 0) - Number(t.amount);
    a[t.to] = (a[t.to] || 0) + Number(t.amount);
  });
  return a;
}

function openBudget() {
  const cats = db.expenseCats;
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  const html = `
    <label>Expense Category</label>
    <select id="bCat">${cats.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("")}</select>
    <label>Allocation Rule</label>
    <select id="bRule">
      <option value="fixed">Fixed amount</option>
      <option value="minimum">Minimum allocation</option>
      <option value="remaining">Remaining balance</option>
    </select>
    <label>Amount (${symbol})</label>
    <input id="bAmt" type="number" step="any" min="0" value="0">
  `;

  openFormModal("Category Budget Rule", html, () => {
    const c = $("bCat").value;
    let b = db.budgets.find(x => x.cat === c);
    if (!b) {
      b = { cat: c };
      db.budgets.push(b);
    }
    b.rule = $("bRule").value;
    b.amount = parseFloat($("bAmt").value) || 0;

    save();
    closeModal();
  });
}

function openBudgetTransfer() {
  const cats = db.expenseCats.map(c => c.name);
  const symbol = CURRENCIES[db.settings?.currency || "INR"].symbol;
  const html = `
    <label>From Category</label>
    <select id="btFrom">${cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>
    <label>To Category</label>
    <select id="btTo">${cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>
    <label>Amount (${symbol}) *</label>
    <input id="btAmt" type="number" step="any" min="1">
    <label>Reason</label>
    <input id="btReason" placeholder="Reallocation">
  `;

  openFormModal("Move Budget", html, () => {
    const from = $("btFrom").value;
    const to = $("btTo").value;
    const amt = parseFloat($("btAmt").value);

    if (!amt || amt <= 0) return alert("Enter a valid amount.");
    if (from === to) return alert("From and To categories must differ.");

    db.budgetTransfers.unshift({
      id: uid(),
      from,
      to,
      amount: amt,
      reason: $("btReason").value.trim(),
      date: today()
    });

    save();
    closeModal();
  });
}

function openCategoryManager() {
  modal(`
    <h2>Category Manager</h2>
    <div class="section-title">Expense categories</div>
    <div class="list" id="catListExpense">
      ${db.expenseCats.map((c, i) => `
        <div class="item">
          <span>${c.icon} <b>${esc(c.name)}</b></span>
          <span>
            <button data-action="edit-cat" data-type="expense" data-idx="${i}">Edit</button>
            <button data-action="del-cat" data-type="expense" data-idx="${i}">×</button>
          </span>
        </div>
      `).join('')}
    </div>
    <button class="primary" style="margin-top:10px" id="addExpCatBtn">+ Expense Category</button>

    <div class="section-title" style="margin-top:20px">Income categories</div>
    <div class="list" id="catListIncome">
      ${db.incomeCats.map((c, i) => `
        <div class="item">
          <span>${c.icon} <b>${esc(c.name)}</b></span>
          <span>
            <button data-action="edit-cat" data-type="income" data-idx="${i}">Edit</button>
            <button data-action="del-cat" data-type="income" data-idx="${i}">×</button>
          </span>
        </div>
      `).join('')}
    </div>
    <button class="primary" style="margin-top:10px" id="addIncCatBtn">+ Income Category</button>
  `);

  $("addExpCatBtn").onclick = () => categoryForm('expense');
  $("addIncCatBtn").onclick = () => categoryForm('income');

  document.querySelectorAll("[data-action='edit-cat']").forEach(b => {
    b.onclick = () => {
      const type = b.dataset.type;
      const idx = parseInt(b.dataset.idx, 10);
      const list = type === 'expense' ? db.expenseCats : db.incomeCats;
      categoryForm(type, list[idx].name);
    };
  });

  document.querySelectorAll("[data-action='del-cat']").forEach(b => {
    b.onclick = () => {
      const type = b.dataset.type;
      const idx = parseInt(b.dataset.idx, 10);
      const list = type === 'expense' ? db.expenseCats : db.incomeCats;
      if (confirm(`Delete "${list[idx].name}"?`)) {
        list.splice(idx, 1);
        save();
        openCategoryManager();
      }
    };
  });
}

function categoryForm(type, oldName = "") {
  const arr = type === 'expense' ? db.expenseCats : db.incomeCats;
  const c = arr.find(x => x.name === oldName) || {};
  const html = `
    <label>Category Name *</label>
    <input id="cName" value="${esc(c.name || "")}" placeholder="Category Name" autofocus>
    <div class="row">
      <div>
        <label>Emoji Icon</label>
        <input id="cIcon" value="${esc(c.icon || '•')}">
      </div>
      <div>
        <label>Card Color</label>
        <input id="cColor" type="color" value="${c.color || '#eeeeee'}">
      </div>
    </div>
  `;

  openFormModal(oldName ? `Edit ${type} Category` : `Add ${type} Category`, html, () => {
    const name = $("cName").value.trim();
    if (!name) return alert("Category name is required.");

    let target = arr.find(x => x.name === oldName);
    if (!target) {
      target = {};
      arr.push(target);
    }
    target.name = name;
    target.icon = $("cIcon").value.trim() || '•';
    target.color = $("cColor").value;

    save();
    openCategoryManager();
  });
}

function openLabels() {
  const allCats = [...db.expenseCats.map(c => c.name), ...db.incomeCats.map(c => c.name)];
  
  modal(`
    <h2>🏷️ Category-Specific Labels</h2>
    <p class="muted" style="margin-top:-6px;font-size:12px">Bind custom tags to specific categories (e.g. Rent to Home Bills, Mess to Food).</p>
    <div class="row" style="margin:12px 0 6px">
      <input id="newLabelInput" placeholder="Label tag name (e.g. Rent)" style="margin:0 0 6px">
      <select id="newLabelCat" style="margin:0 0 8px">
        <option value="">(All Categories / Global)</option>
        ${allCats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
      </select>
    </div>
    <button class="primary" style="width:100%;margin-bottom:12px" onclick="addNewLabel()">+ Add Label Tag</button>
    <div class="list" id="labelListContainer">
      ${db.labels.map((l, i) => `
        <div class="item">
          <div>
            <b>#${esc(l.name)}</b>
            <br><span class="muted" style="font-size:12px">${esc(l.cat || 'All Categories')}</span>
          </div>
          <button onclick="removeLabel(${i})">×</button>
        </div>
      `).join('') || '<p class="muted">No labels created yet.</p>'}
    </div>
  `);
}

function addNewLabel() {
  const input = $("newLabelInput");
  const catSelect = $("newLabelCat");
  if (!input) return;

  const val = input.value.trim().replace(/^#/, '');
  const cat = catSelect ? catSelect.value : "";

  if (!val) return alert("Please enter a label name.");
  if (db.labels.some(l => l.name.toLowerCase() === val.toLowerCase() && l.cat === cat)) {
    return alert("This label already exists for the chosen category.");
  }

  db.labels.push({ name: val, cat });
  save();
  openLabels();
}

function removeLabel(idx) {
  db.labels.splice(idx, 1);
  save();
  openLabels();
}

function handleDurationChange() {
  const type = $("txDurationType").value;
  const container = $("durationSelectorContainer");

  if (type === "month") {
    container.innerHTML = `<select id="txMonthSelect" onchange="renderTransactions()" style="margin:0">${months().map(m => `<option value="${m}" ${m === monthKey() ? 'selected' : ''}>${monthLabel(m)}</option>`).join('')}</select>`;
  } else if (type === "year") {
    const currentYear = new Date().getFullYear();
    container.innerHTML = `<select id="txYearSelect" onchange="renderTransactions()" style="margin:0">${years().map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>Year ${y}</option>`).join('')}</select>`;
  } else if (type === "custom") {
    container.innerHTML = `
      <div class="row-flex" style="gap:6px">
        <input type="date" id="txStartDate" value="${monthKey()}-01" onchange="renderTransactions()" style="margin:0">
        <span style="flex:none;font-weight:bold;color:var(--muted)">to</span>
        <input type="date" id="txEndDate" value="${today()}" onchange="renderTransactions()" style="margin:0">
      </div>
    `;
  } else {
    container.innerHTML = "";
  }
  renderTransactions();
}

function showInsights() {
  const m = monthKey();
  const tx = db.tx.filter(t => t.date && t.date.startsWith(m));
  const exp = tx.filter(t => t.type === 'expense');
  const inc = tx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const spent = exp.reduce((s, t) => s + Number(t.amount || 0), 0);
  const by = {};
  exp.forEach(t => by[t.cat] = (by[t.cat] || 0) + Number(t.amount || 0));

  const vals = Object.entries(by).sort((a, b) => b[1] - a[1]);
  const max = vals[0]?.[1] || 1;

  modal(`
    <h2>Charts & Insights</h2>
    <div class="kpi">
      <div><span class="muted">Savings</span><strong class="green">${money(inc - spent)}</strong></div>
      <div><span class="muted">Savings Rate</span><strong>${inc ? Math.round((inc - spent) / inc * 100) : 0}%</strong></div>
      <div><span class="muted">Total Spent</span><strong class="red">${money(spent)}</strong></div>
    </div>
    <p class="muted">Category spending for ${esc(monthLabel(m))}</p>
    <div class="chart">
      ${vals.map(v => `
        <div style="flex:1">
          <div class="col" style="height:${Math.max(4, (v[1] / max) * 145)}px"></div>
          <div class="legend">${esc(v[0].split(' ')[0])}</div>
        </div>
      `).join('') || '<div class="empty">No expense records.</div>'}
    </div>
    <div class="list" style="margin-top:15px">
      ${vals.map(v => `<div class="item"><b>${esc(v[0])}</b><span>${money(v[1])}</span></div>`).join('')}
    </div>
  `);
}

function showReports() {
  const ms = months().slice(0, 6).reverse();
  const rows = ms.map(m => {
    const i = db.tx.filter(t => t.type === 'income' && t.date?.startsWith(m)).reduce((s, t) => s + Number(t.amount || 0), 0);
    const e = db.tx.filter(t => t.type === 'expense' && t.date?.startsWith(m)).reduce((s, t) => s + Number(t.amount || 0), 0);
    return [m, i, e];
  });
  const max = Math.max(...rows.map(r => Math.max(r[1], r[2])), 1);

  modal(`
    <h2>Reports & Cash Flow</h2>
    <div class="chart">
      ${rows.map(r => `
        <div style="flex:1">
          <div class="col" style="height:${Math.max(4, (r[1] / max) * 130)}px"></div>
          <div class="legend">${r[0].slice(5)}</div>
        </div>
      `).join('')}
    </div>
    <div class="list" style="margin-top:15px">
      ${rows.reverse().map(r => `
        <div class="item">
          <b>${monthLabel(r[0])}</b>
          <span><span class="green">+${money(r[1])}</span> · <span class="red">-${money(r[2])}</span></span>
        </div>
      `).join('')}
    </div>
  `);
}

function showDebtPlan() {
  const rows = db.liabilities.map(l => {
    const monthsEst = l.emi ? Math.ceil(l.amount / l.emi) : 0;
    return `
      <div class="item">
        <div><b>${esc(l.name)}</b><br><span class="muted">${l.rate}% · EMI ${money(l.emi)}</span></div>
        <div class="right">${money(l.amount)}<br><span class="muted">${monthsEst ? monthsEst + ' payments' : 'Set EMI'}</span></div>
      </div>
    `;
  }).join('');

  modal(`
    <h2>Debt Plan</h2>
    <p class="muted">Payoff timeline based on outstanding balance divided by monthly EMI.</p>
    <div class="list">${rows || '<p class="muted">No active liabilities.</p>'}</div>
  `);
}

function deleteBy(kind, id) {
  if (confirm("Delete this entry?")) {
    db[kind] = db[kind].filter(x => x.id !== id);
    save();
  }
}

function exportData() {
  const payload = { ...db, exportedAt: new Date().toISOString(), app: "Personal Budget PWA", version: 7 };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `budget-backup-${today()}.json`;
  a.click();
}

function exportCSV() {
  const rows = [
    ['Date', 'Type', 'Category', 'Description', 'Amount', 'Account', 'Label', 'Note'],
    ...db.tx.map(t => [
      t.date || '',
      t.type || '',
      t.cat || '',
      t.desc || '',
      t.amount || 0,
      (db.accounts.find(a => a.id === t.account)?.name) || '',
      t.label || '',
      t.note || ''
    ])
  ];
  const csv = rows.map(r => r.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = `transactions-${today()}.csv`;
  a.click();
}

function importData(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const parsed = JSON.parse(r.result);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid structure");
      db = migrate(parsed);
      save();
      alert("Data restored successfully.");
    } catch (err) {
      alert("Failed to import file: " + err.message);
    }
  };
  r.readAsText(f);
  e.target.value = '';
}

function resetData() {
  if (confirm("Delete ALL local financial records? Ensure you have an exported JSON backup.")) {
    db = blank();
    save();
  }
}

function renderHome() {
  const m = monthKey();
  const tx = db.tx.filter(t => t.date && t.date.startsWith(m));
  const inc = tx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const spent = tx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);

  $("homeIncome").textContent = money(inc);
  $("homeSpent").textContent = money(spent);
  $("homeFree").textContent = money(inc - spent);

  $("categoryGrid").innerHTML = db.expenseCats.map(c => {
    const s = tx.filter(t => t.type === 'expense' && t.cat === c.name).reduce((x, t) => x + Number(t.amount || 0), 0);
    return `<div class="cat" style="background:${c.color}" data-cat-name="${esc(c.name)}">
      <b>${c.icon} ${esc(c.name)}</b>
      <div class="amt">${money(s)}</div>
    </div>`;
  }).join('');

  document.querySelectorAll("#categoryGrid .cat").forEach(el => {
    el.onclick = () => openExpense(el.dataset.catName);
  });

  $("incomeGrid").innerHTML = db.incomeCats.map(c => {
    const s = tx.filter(t => t.type === 'income' && t.cat === c.name).reduce((x, t) => x + Number(t.amount || 0), 0);
    return `<div class="cat income-cat" style="background:${c.color}" data-cat-name="${esc(c.name)}">
      <b>${c.icon} ${esc(c.name)}</b>
      <div class="amt">${money(s)}</div>
    </div>`;
  }).join('');

  document.querySelectorAll("#incomeGrid .cat").forEach(el => {
    el.onclick = () => openIncome(el.dataset.catName);
  });

  const fixed = db.autopay;
  const fixedTotal = fixed.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  $("fixedCostWarning").textContent = fixedTotal > 0
    ? `${money(fixedTotal)} in scheduled commitments. Keep an eye on these before discretionary spending.`
    : "No recurring commitments recorded. Add them in Setting to track fixed obligations.";

  const ups = [...db.autopay].sort((a, b) => (a.next || '').localeCompare(b.next || '')).slice(0, 5);
  $("homeUpcoming").innerHTML = ups.map(a => `
    <div class="item">
      <div><b>${esc(a.name)}</b><br><span class="muted">Due ${esc(a.next || '—')} · ${esc(a.cat || '')}</span></div>
      <b>${money(a.amount)}</b>
    </div>
  `).join('') || '<div class="card muted">No upcoming payments.</div>';

  const advice = ADVICE[Math.floor(Date.now() / 86400000) % ADVICE.length];
  $("adviceTitle").textContent = advice[0];
  $("adviceText").textContent = advice[1];
}

function renderAccounts() {
  const cash = db.accounts.reduce((s, a) => s + accountBalance(a), 0);
  const invest = db.investments.reduce((s, i) => s + (Number(i.current) || 0), 0);
  const debt = db.liabilities.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const nw = cash + invest - debt;

  $("netWorth").textContent = money(nw);
  $("heroSub").textContent = `Assets ${money(cash + invest)} · Liabilities ${money(debt)}`;
  $("assetCash").textContent = money(cash);
  $("assetInvest").textContent = money(invest);
  $("assetDebt").textContent = money(debt);

  $("accountList").innerHTML = db.accounts.map(a => `
    <div class="item">
      <div><b>${esc(a.name)}</b><br><span class="muted">${esc(a.type)} · Opening ${money(a.opening)}</span></div>
      <div class="right">
        <b>${money(accountBalance(a))}</b><br>
        <button onclick="openAccount('${a.id}')">Edit</button>
        <button onclick="deleteBy('accounts','${a.id}')">×</button>
      </div>
    </div>
  `).join('') || '<div class="empty">No accounts added.</div>';

  $("investmentList").innerHTML = db.investments.map(i => {
    const g = (Number(i.current) || 0) - (Number(i.invested) || 0);
    return `
      <div class="item">
        <div><b>${esc(i.name)}</b><br><span class="muted">${esc(i.type)} · Qty ${i.qty || 0} ${i.broker ? '· ' + esc(i.broker) : ''}</span></div>
        <div class="right">
          <b>${money(i.current)}</b><br>
          <span class="${g >= 0 ? 'green' : 'red'}">${g >= 0 ? '+' : ''}${money(g)}</span><br>
          <button onclick="openInvestment('${i.id}')">Edit</button>
          <button onclick="deleteBy('investments','${i.id}')">×</button>
        </div>
      </div>
    `;
  }).join('') || '<div class="empty">No investments recorded.</div>';

  const goalContainer = $("goalList");
  if (goalContainer) {
    goalContainer.innerHTML = db.goals.map(g => {
      const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
      return `
        <div class="card" style="margin:6px 0;padding:12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <b>${esc(g.name)}</b>
            <span>${money(g.current)} / <b>${money(g.target)}</b></span>
          </div>
          <div class="bar" style="margin:8px 0"><i style="width:${pct}%"></i></div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="muted">${pct}% saved ${g.due ? `· Target: ${esc(g.due)}` : ''}</span>
            <span>
              <button onclick="openGoalForm('${g.id}')">Edit</button>
              <button onclick="deleteBy('goals','${g.id}')">×</button>
            </span>
          </div>
        </div>
      `;
    }).join('') || '<div class="empty">No savings goals set.</div>';
  }

  $("liabilityList").innerHTML = db.liabilities.map(l => `
    <div class="item">
      <div><b>${esc(l.name)}</b><br><span class="muted">${l.rate}% · EMI ${money(l.emi)} · Due ${esc(l.due || '—')}</span></div>
      <div class="right">
        <b class="red">${money(l.amount)}</b><br>
        <button onclick="openLiability('${l.id}')">Edit</button>
        <button onclick="deleteBy('liabilities','${l.id}')">×</button>
      </div>
    </div>
  `).join('') || '<div class="empty">No liabilities.</div>';
}

function renderTransactions() {
  const q = ($("searchTx")?.value || "").toLowerCase();
  const type = $("txType")?.value || "all";
  const durationType = $("txDurationType")?.value || "month";

  let filtered = db.tx.filter(t => {
    if (!t.date) return false;
    if (durationType === "month") {
      const targetMonth = $("txMonthSelect")?.value || monthKey();
      return t.date.startsWith(targetMonth);
    } else if (durationType === "year") {
      const targetYear = $("txYearSelect")?.value || String(new Date().getFullYear());
      return t.date.startsWith(targetYear);
    } else if (durationType === "custom") {
      const start = $("txStartDate")?.value || "1970-01-01";
      const end = $("txEndDate")?.value || "2099-12-31";
      return t.date >= start && t.date <= end;
    }
    return true;
  });

  const durationIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const durationSpent = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
  const durationNet = durationIncome - durationSpent;

  if ($("txSummaryIncome")) $("txSummaryIncome").textContent = money(durationIncome);
  if ($("txSummarySpent")) $("txSummarySpent").textContent = money(durationSpent);
  if ($("txSummaryBalance")) {
    $("txSummaryBalance").textContent = money(durationNet);
    $("txSummaryBalance").className = durationNet >= 0 ? "green" : "red";
  }

  const listData = filtered.filter(t => (type === 'all' || t.type === type) && JSON.stringify(t).toLowerCase().includes(q)).slice(0, 150);

  $("transactionList").innerHTML = listData.map(t => `
    <div class="item">
      <div>
        <b>${esc(t.desc || t.type)}</b><br>
        <span class="muted">${esc(t.date || '')} ${t.cat ? '· ' + esc(t.cat) : ''} ${t.label ? '· #' + esc(t.label) : ''}</span>
      </div>
      <div class="right">
        <b class="${t.type === 'expense' ? 'red' : t.type === 'income' ? 'green' : ''}">
          ${t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}${money(t.amount)}
        </b><br>
        ${t.type !== 'transfer' ? `<button onclick="editTx('${t.id}')">Edit</button>` : ''}
        <button onclick="deleteBy('tx','${t.id}')">×</button>
      </div>
    </div>
  `).join('') || '<div class="empty">No transactions found for the selected duration.</div>';
}

function renderBudget() {
  const alloc = adjustedAlloc();
  const m = monthKey();
  const spentBy = {};

  db.tx.filter(t => t.type === 'expense' && t.date?.startsWith(m)).forEach(t => {
    spentBy[t.cat] = (spentBy[t.cat] || 0) + Number(t.amount || 0);
  });

  const total = Object.values(alloc).reduce((s, v) => s + v, 0);
  const spent = Object.values(spentBy).reduce((s, v) => s + v, 0);

  $("budgetTotal").textContent = money(total);
  $("budgetSpent").textContent = money(spent);
  $("budgetRemain").textContent = money(total - spent);

  $("budgetList").innerHTML = Object.entries(alloc).map(([c, a]) => {
    const s = spentBy[c] || 0;
    const p = a > 0 ? Math.min(100, (s / a) * 100) : 0;
    const rule = db.budgets.find(b => b.cat === c)?.rule || 'derived';
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between"><b>${esc(c)}</b><span class="muted">${esc(rule)}</span></div>
        <div style="display:flex;justify-content:space-between;margin:10px 0"><span>Spent ${money(s)}</span><span>Plan ${money(a)}</span></div>
        <div class="bar"><i style="width:${p}%"></i></div>
        ${s > a ? `<p class="danger-text">Over budget by ${money(s - a)}</p>` : ''}
      </div>
    `;
  }).join('') || '<div class="empty">Add category budget rules to begin planning.</div>';

  $("budgetTransfers").innerHTML = db.budgetTransfers.filter(t => t.date?.startsWith(m)).slice(0, 20).map(t => `
    <div class="item">
      <div><b>${esc(t.from)} → ${esc(t.to)}</b><br><span class="muted">${esc(t.reason || 'Reallocation')} · ${esc(t.date)}</span></div>
      <b>${money(t.amount)}</b>
    </div>
  `).join('') || '<div class="card muted">No transfers this month.</div>';
}

function renderAll() {
  $("monthLabel").textContent = monthLabel();
  renderHome();
  renderAccounts();
  renderTransactions();
  renderBudget();
}

function showTab(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id));
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === id));
  renderAll();
}

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

window.addEventListener("DOMContentLoaded", () => {
  handleDurationChange();
  document.querySelectorAll(".tab").forEach(b => {
    b.onclick = () => showTab(b.dataset.tab);
  });
  renderAll();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
