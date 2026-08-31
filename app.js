const KEY="pb_v6";
const DEFAULT={
  version:6,
  settings:{expenseCats:["Food & Drink","Home Bills","Transport","Shopping","Markets","Health","Education","Entertainment","Personal","Other"],incomeCats:["Salary","Pocket Money","Interest","Dividend","Freelance","Other Income"],expenseOrder:[],incomeOrder:[]},
  tx:[],
  accounts:[],
  investments:[],
  autopay:[],
  goals:[],
  liabilities:[],
  budget:{month:"",overall:0,cats:{},transfers:[],rollover:true}
};
let db=load();

function localDate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function monthKey(d=new Date()){return localDate(d).slice(0,7)}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random()}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)); return x?normalize(x):normalize(structuredClone(DEFAULT))}catch{return normalize(structuredClone(DEFAULT))}}
function normalize(x){
  x={...structuredClone(DEFAULT),...x}; x.settings={...DEFAULT.settings,...(x.settings||{})};
  x.settings.expenseOrder=x.settings.expenseOrder?.length?x.settings.expenseOrder:x.settings.expenseCats;
  x.settings.incomeOrder=x.settings.incomeOrder?.length?x.settings.incomeOrder:x.settings.incomeCats;
  x.tx=x.tx||[];x.accounts=x.accounts||[];x.investments=x.investments||[];x.autopay=x.autopay||[];x.goals=x.goals||[];x.liabilities=x.liabilities||[];
  x.budget={...DEFAULT.budget,...(x.budget||{})};x.budget.cats=x.budget.cats||{};x.budget.transfers=x.budget.transfers||[];return x;
}
function save(){localStorage.setItem(KEY,JSON.stringify(db));render()}

const appEl=document.getElementById("app");
function render(){
 const tab=window.currentTab||"home";
 appEl.innerHTML=`<div class="app">
  <header><div class="brand">💰 Personal Budget</div><div class="month">${new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</div></header>
  <main>${tab==="home"?home():tab==="accounts"?accounts():tab==="transactions"?transactions():tab==="budget"?budget():settings()}</main>
  <nav class="bottom">
   ${[["home","⌂","Home"],["accounts","◉","Account"],["transactions","≡","Transactions"],["budget","▣","Budget"],["settings","⚙","Setting"]].map(([t,i,l])=>`<button class="tab ${tab===t?"active":""}" onclick="go('${t}')"><span class="ico">${i}</span><small>${l}</small></button>`).join("")}
  </nav>
 </div>`;
}
function go(t){window.currentTab=t;render()}
function card(title,body,cls="card"){return `<section class="${cls}"><h3>${title}</h3>${body}</section>`}

function home(){
 const m=monthKey(), ex=db.tx.filter(x=>x.type==="expense"&&x.date?.startsWith(m)), inc=db.tx.filter(x=>x.type==="income"&&x.date?.startsWith(m));
 const spent=ex.reduce((a,x)=>a+Number(x.amount),0), income=inc.reduce((a,x)=>a+Number(x.amount),0), free=income-spent;
 const eCats=db.settings.expenseOrder.filter(c=>db.settings.expenseCats.includes(c));
 const iCats=db.settings.incomeOrder.filter(c=>db.settings.incomeCats.includes(c));
 return `
 ${card("Expense",`<div class="grid">${eCats.map(c=>catCard(c,"expense")).join("")}</div>`)}
 ${card("Income",`<div class="grid">${iCats.map(c=>catCard(c,"income")).join("")}</div>`)}
 ${card("This Month",`<div class="kpi"><div><small>Income</small><strong>${money(income)}</strong></div><div><small>Spent</small><strong>${money(spent)}</strong></div><div><small>Free</small><strong>${money(free)}</strong></div></div>`)}
 ${fixedWarning()}
 ${card("Upcoming",db.autopay.length?db.autopay.slice(0,3).map(a=>`<div class="item"><div><b>${esc(a.name)}</b><span>${esc(a.date||"")}${a.fixed?" · Fixed cost":""}</span></div><div class="right">${money(a.amount)}</div></div>`).join(""):`<p class="muted">No recurring payments added.</p>`)}
 ${card("Financial tip",`<p>${tip()}</p>`)}
 `;
}
function catCard(c,type){
 const total=db.tx.filter(x=>x.type===type&&x.cat===c&&x.date?.startsWith(monthKey())).reduce((a,x)=>a+Number(x.amount),0);
 return `<button class="cat" onclick="entry('${esc(c)}','${type}')" oncontextmenu="event.preventDefault();reorder('${type}')"><b>${esc(c)}</b><div class="amt">${money(total)}</div></button>`;
}
function fixedWarning(){
 const fixed=db.autopay.filter(a=>a.fixed), total=fixed.reduce((s,a)=>s+Number(a.amount||0),0);
 const income=db.tx.filter(x=>x.type==="income"&&x.date?.startsWith(monthKey())).reduce((s,x)=>s+Number(x.amount),0);
 let msg=fixed.length?`<b>Watch fixed costs</b><br><span>${money(total)} recurring fixed costs${income?` · ${Math.round(total/income*100)}% of recorded income`:""}</span>`:"<b>Watch fixed costs</b><br><span>Add recurring payments and mark fixed costs to monitor them.</span>";
 return `<section class="card warning">⚠️ ${msg}</section>`;
}
function tip(){return ["Pay yourself first—treat savings like a bill.","A budget is a plan, not a restriction.","Track recurring costs; small subscriptions compound.","Review your biggest spending category before cutting small ones.","Net worth matters more than any single month's spending."][new Date().getDate()%5]}

function entry(cat,type){
 const id="modal";document.getElementById(id)?.remove();
 const date=localDate();
 document.body.insertAdjacentHTML("beforeend",`<div class="modal" id="${id}" onclick="if(event.target===this)closeModal()"><div class="sheet">
 <h2>Add ${type==="income"?"Income":"Expense"}</h2><label>Amount</label><input id="amt" type="number" inputmode="decimal" min="0" step="0.01" placeholder="₹0">
 <label>Description</label><input id="desc" placeholder="${esc(cat)}">
 <label>Date</label><input id="date" type="date" value="${date}">
 <label>Account</label><select id="acc"><option value="">Unassigned</option>${db.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select>
 <label>Note</label><input id="note" placeholder="Optional">
 <div class="actions"><button onclick="closeModal()">Cancel</button><button onclick="saveEntry('${esc(cat)}','${type}')">Save</button></div>
 </div></div>`);
 document.getElementById("amt").focus();
}
function saveEntry(cat,type){
 const amount=Number(document.getElementById("amt").value); if(!amount||amount<=0)return alert("Enter an amount greater than ₹0.");
 db.tx.unshift({id:uid(),type,cat,amount,desc:document.getElementById("desc").value.trim()||cat,date:document.getElementById("date").value||localDate(),account:document.getElementById("acc").value,note:document.getElementById("note").value.trim()});
 closeModal();save();
}
function closeModal(){document.getElementById("modal")?.remove()}

function accounts(){
 const net=netWorth();
 return `<div class="hero"><div class="label">Net Worth</div><div class="value">${money(net)}</div><small>Assets ${money(assets())} · Liabilities ${money(liabilities())}</small></div>
 ${card("Accounts",`<button class="primary" onclick="accountForm()">＋ Add Account</button><div class="list">${db.accounts.map(a=>`<div class="item"><div><b>${esc(a.name)}</b><span>${esc(a.type||"Account")}</span></div><div class="right">${money(accountBalance(a))}<br><button onclick="accountForm('${a.id}')">Edit</button> <button onclick="del('accounts','${a.id}')">Delete</button></div></div>`).join("")||`<p class="muted">No accounts yet.</p>`}</div>`)}
 ${card("Investments",`<button class="primary" onclick="investmentForm()">＋ Add Investment</button><div class="list">${db.investments.map(i=>`<div class="item"><div><b>${esc(i.name)}</b><span>${esc(i.type)} · ${i.qty?esc(i.qty)+" units · ":""}Invested ${money(i.invested)}</span></div><div class="right">${money(i.current)}<br><button onclick="investmentForm('${i.id}')">Edit</button> <button onclick="del('investments','${i.id}')">Delete</button></div></div>`).join("")||`<p class="muted">No investments yet.</p>`}</div>`)}
 ${card("Liabilities",`<button class="primary" onclick="liabilityForm()">＋ Add Liability</button>${db.liabilities.map(l=>`<div class="item"><div><b>${esc(l.name)}</b><span>${esc(l.type||"Debt")}</span></div><div class="right">${money(l.amount)} <button onclick="del('liabilities','${l.id}')">Delete</button></div></div>`).join("")||`<p class="muted">No liabilities.</p>`}`)}
 `;
}
function assets(){return db.accounts.reduce((s,a)=>s+accountBalance(a),0)+db.investments.reduce((s,i)=>s+Number(i.current||0),0)}
function liabilities(){return db.liabilities.reduce((s,l)=>s+Number(l.amount||0),0)}
function netWorth(){return assets()-liabilities()}
function accountBalance(a){
 let b=Number(a.opening||0);
 db.tx.forEach(x=>{if(x.account===a.id)b+=x.type==="income"?Number(x.amount):x.type==="expense"?-Number(x.amount):0});
 return b;
}
function formModal(title,fields,saveFn){
 document.getElementById("modal")?.remove();
 document.body.insertAdjacentHTML("beforeend",`<div class="modal" id="modal" onclick="if(event.target===this)closeModal()"><div class="sheet"><h2>${title}</h2>${fields}<div class="actions"><button onclick="closeModal()">Cancel</button><button onclick="${saveFn}">Save</button></div></div></div>`);
}
function field(id,label,val="",type="text",extra=""){return `<label>${label}</label><input id="${id}" type="${type}" value="${esc(val)}" ${extra}>`}
function accountForm(id){
 const a=db.accounts.find(x=>x.id===id)||{};
 formModal(id?"Edit Account":"Add Account",
 `${field("aName","Name",a.name||"")}${field("aType","Type",a.type||"Bank")}${field("aOpening","Opening Balance",a.opening||0,"number",'inputmode="decimal" step="0.01"')}`,
 `saveAccount('${id||""}')`);
}
function saveAccount(id){
 const name=document.getElementById("aName").value.trim(); if(!name)return alert("Enter account name.");
 const obj={id:id||uid(),name,type:document.getElementById("aType").value.trim()||"Bank",opening:Number(document.getElementById("aOpening").value||0)};
 if(id){const i=db.accounts.findIndex(x=>x.id===id);db.accounts[i]=obj}else db.accounts.push(obj);closeModal();save();
}
function investmentForm(id){
 const x=db.investments.find(i=>i.id===id)||{};
 formModal(id?"Edit Investment":"Add Investment",
 `${field("iName","Name",x.name||"")}${field("iType","Type",x.type||"Stock")}${field("iQty","Quantity / Units",x.qty||"","number",'inputmode="decimal" step="0.0001"')}${field("iInv","Invested Amount",x.invested||0,"number",'inputmode="decimal" step="0.01"')}${field("iCur","Current Value",x.current||0,"number",'inputmode="decimal" step="0.01"')}${field("iBroker","Broker / Provider",x.broker||"")}${field("iNote","Note",x.note||"")}`,
 `saveInvestment('${id||""}')`);
}
function saveInvestment(id){
 const name=document.getElementById("iName").value.trim();if(!name)return alert("Enter investment name.");
 const obj={id:id||uid(),name,type:document.getElementById("iType").value.trim()||"Other",qty:Number(document.getElementById("iQty").value||0),invested:Number(document.getElementById("iInv").value||0),current:Number(document.getElementById("iCur").value||0),broker:document.getElementById("iBroker").value.trim(),note:document.getElementById("iNote").value.trim()};
 if(id)db.investments[db.investments.findIndex(x=>x.id===id)]=obj;else db.investments.push(obj);closeModal();save();
}
function liabilityForm(){
 formModal("Add Liability",`${field("lName","Name")}${field("lType","Type","Credit Card")}${field("lAmt","Outstanding Amount",0,"number",'inputmode="decimal" step="0.01"')}`,`saveLiability()`);
}
function saveLiability(){const name=document.getElementById("lName").value.trim();if(!name)return alert("Enter a name.");db.liabilities.push({id:uid(),name,type:document.getElementById("lType").value.trim(),amount:Number(document.getElementById("lAmt").value||0)});closeModal();save()}
function del(arr,id){if(!confirm("Delete this item?"))return;db[arr]=db[arr].filter(x=>x.id!==id);save()}

function transactions(){
 const rows=db.tx.slice(0,100).map(x=>`<div class="item"><div><b>${esc(x.desc||x.cat||x.type)}</b><span>${esc(x.date)} · ${esc(x.cat||x.type)}</span></div><div class="right">${x.type==="expense"?"−":"+"}${money(x.amount)}<br><button onclick="editTx('${x.id}')">Edit</button> <button onclick="del('tx','${x.id}')">Delete</button></div></div>`).join("");
 return `${card("Transactions",rows||`<p class="muted">No transactions yet.</p>`)}`
}
function editTx(id){
 const x=db.tx.find(t=>t.id===id);if(!x)return;
 formModal("Edit Transaction",`${field("eAmt","Amount",x.amount,"number",'inputmode="decimal" step="0.01"')}${field("eDesc","Description",x.desc||x.cat||"")}${field("eDate","Date",x.date||localDate(),"date")}`,`saveTx('${id}')`);
}
function saveTx(id){const x=db.tx.find(t=>t.id===id);x.amount=Number(document.getElementById("eAmt").value||0);x.desc=document.getElementById("eDesc").value;x.date=document.getElementById("eDate").value||localDate();closeModal();save()}

function budget(){
 const m=monthKey();let total=db.budget.overall||0;
 const cats=[...new Set([...db.settings.expenseOrder,...Object.keys(db.budget.cats)])];
 return `${card("Monthly Budget",`${field("overall","Overall Budget",total,"number",'inputmode="decimal" step="0.01"')}<button class="primary" onclick="setOverall()">Save Overall Budget</button><p class="muted">You can allocate fixed, minimum, or remaining-budget amounts to categories.</p>`)}
 ${card("Category Budgets",cats.map(c=>{const b=db.budget.cats[c]||{mode:"remaining",amount:0};return `<div class="item"><div><b>${esc(c)}</b><span>${esc(b.mode)} · ${money(b.amount)}</span></div><button onclick="catBudget('${esc(c)}')">Edit</button></div>`}).join(""))}
 ${card("Transfer Budget",`<button class="primary" onclick="transferForm()">Move money between categories</button>${db.budget.transfers.slice(-10).reverse().map(t=>`<div class="item"><span>${esc(t.from)} → ${esc(t.to)}</span><b>${money(t.amount)}</b></div>`).join("")}`)}
 `;
}
function setOverall(){db.budget.overall=Number(document.getElementById("overall").value||0);db.budget.month=monthKey();save()}
function catBudget(c){
 const b=db.budget.cats[c]||{mode:"remaining",amount:0};
 formModal("Budget: "+c,`<label>Mode</label><select id="bm"><option ${b.mode==="fixed"?"selected":""}>fixed</option><option ${b.mode==="minimum"?"selected":""}>minimum</option><option ${b.mode==="remaining"?"selected":""}>remaining</option></select>${field("ba","Amount",b.amount||0,"number",'inputmode="decimal" step="0.01"')}`,`saveCatBudget('${esc(c)}')`);
}
function saveCatBudget(c){db.budget.cats[c]={mode:document.getElementById("bm").value,amount:Number(document.getElementById("ba").value||0)};closeModal();save()}
function transferForm(){
 const cats=db.settings.expenseCats;
 formModal("Transfer Budget",`<label>From</label><select id="tf">${cats.map(c=>`<option>${esc(c)}</option>`).join("")}</select><label>To</label><select id="tt">${cats.map(c=>`<option>${esc(c)}</option>`).join("")}</select>${field("tv","Amount",0,"number",'inputmode="decimal" step="0.01"')}`,`saveTransfer()`);
}
function saveTransfer(){const from=document.getElementById("tf").value,to=document.getElementById("tt").value,amount=Number(document.getElementById("tv").value||0);if(from===to||amount<=0)return alert("Choose different categories and enter a valid amount.");const f=db.budget.cats[from]||{mode:"fixed",amount:0},t=db.budget.cats[to]||{mode:"fixed",amount:0};f.amount=Math.max(0,Number(f.amount)-amount);t.amount=Number(t.amount)+amount;db.budget.cats[from]=f;db.budget.cats[to]=t;db.budget.transfers.push({id:uid(),from,to,amount,date:localDate()});closeModal();save()}

function settings(){
 return `${card("Categories",`<p class="muted">Create and reorder your income and expense categories.</p><button class="primary" onclick="categoryManager('expense')">Manage Expense Categories</button> <button class="primary" onclick="categoryManager('income')">Manage Income Categories</button>`)}
 ${card("Autopay / Recurring",`<button class="primary" onclick="autopayForm()">＋ Add Autopay</button>${db.autopay.map(a=>`<div class="item"><div><b>${esc(a.name)}</b><span>${esc(a.frequency||"Monthly")}${a.fixed?" · Fixed cost":""}</span></div><div class="right">${money(a.amount)} <button onclick="del('autopay','${a.id}')">Delete</button></div></div>`).join("")}`)}
 ${card("Savings Goals",`<button class="primary" onclick="goalForm()">＋ Add Goal</button>${db.goals.map(g=>`<div class="item"><div><b>${esc(g.name)}</b><span>${money(g.saved)} / ${money(g.target)}</span></div><button onclick="del('goals','${g.id}')">Delete</button></div>`).join("")}`)}
 ${card("Backup & Import",`<button class="primary" onclick="exportJSON()">Export JSON Backup</button><button onclick="document.getElementById('jsonIn').click()">Import JSON</button><input id="jsonIn" type="file" accept=".json,application/json" hidden onchange="importJSON(event)"><br><button onclick="exportCSV()">Export Transactions CSV</button><button onclick="csvHelp()">CSV templates</button><p class="muted">JSON preserves the complete local database. CSV is for bulk transaction entry/export.</p>`)}
 ${card("Data",`<button onclick="alert('Stored locally on this device/browser. No bank or device tracking is used by this app.')">Privacy info</button><button onclick="if(confirm('Delete ALL local data?')){localStorage.removeItem(KEY);location.reload()}">Reset all data</button>`)}
 `;
}
function categoryManager(type){
 const isE=type==="expense", key=isE?"expenseCats":"incomeCats", orderKey=isE?"expenseOrder":"incomeOrder";
 formModal("Manage "+(isE?"Expense":"Income")+" Categories",`<div id="catList">${db.settings[orderKey].filter(c=>db.settings[key].includes(c)).map(c=>`<div class="item"><b>${esc(c)}</b><span><button onclick="moveCat('${type}','${esc(c)}',-1)">↑</button><button onclick="moveCat('${type}','${esc(c)}',1)">↓</button><button onclick="renameCat('${type}','${esc(c)}')">Rename</button><button onclick="removeCat('${type}','${esc(c)}')">Delete</button></span></div>`).join("")}</div><hr>${field("newCat","New Category")}<button onclick="addCat('${type}')">Add</button>`,`closeModal()`);
}
function reorder(type){categoryManager(type)}
function addCat(type){const id="newCat",n=document.getElementById(id)?.value.trim();if(!n)return;const key=type==="expense"?"expenseCats":"incomeCats",ok=type==="expense"?"expenseOrder":"incomeOrder";if(!db.settings[key].includes(n)){db.settings[key].push(n);db.settings[ok].push(n);save();}categoryManager(type)}
function moveCat(type,c,dir){const k=type==="expense"?"expenseOrder":"incomeOrder",a=db.settings[k],i=a.indexOf(c),j=i+dir;if(i<0||j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];save();categoryManager(type)}
function renameCat(type,c){const n=prompt("New category name",c)?.trim();if(!n||n===c)return;const key=type==="expense"?"expenseCats":"incomeCats",ok=type==="expense"?"expenseOrder":"incomeOrder";db.settings[key]=db.settings[key].map(x=>x===c?n:x);db.settings[ok]=db.settings[ok].map(x=>x===c?n:x);db.tx.forEach(x=>{if(x.cat===c)x.cat=n});save();categoryManager(type)}
function removeCat(type,c){if(!confirm(`Delete category "${c}"? Existing transactions will stay.`))return;const key=type==="expense"?"expenseCats":"incomeCats",ok=type==="expense"?"expenseOrder":"incomeOrder";db.settings[key]=db.settings[key].filter(x=>x!==c);db.settings[ok]=db.settings[ok].filter(x=>x!==c);save();categoryManager(type)}

function autopayForm(){
 formModal("Add Autopay",`${field("pName","Name")}${field("pAmt","Amount",0,"number",'inputmode="decimal" step="0.01"')}${field("pFreq","Frequency","Monthly")}${field("pDate","Next Date",localDate(),"date")}<label><input id="pFixed" type="checkbox"> Mark as fixed cost</label>`,`saveAutopay()`);
}
function saveAutopay(){const name=document.getElementById("pName").value.trim();if(!name)return alert("Enter a name.");db.autopay.push({id:uid(),name,amount:Number(document.getElementById("pAmt").value||0),frequency:document.getElementById("pFreq").value,date:document.getElementById("pDate").value,fixed:document.getElementById("pFixed").checked});closeModal();save()}
function goalForm(){formModal("Add Savings Goal",`${field("gName","Goal")}${field("gTarget","Target Amount",0,"number",'inputmode="decimal" step="0.01"')}${field("gSaved","Already Saved",0,"number",'inputmode="decimal" step="0.01"')}`,`saveGoal()`)}
function saveGoal(){const name=document.getElementById("gName").value.trim();if(!name)return alert("Enter a goal.");db.goals.push({id:uid(),name,target:Number(document.getElementById("gTarget").value||0),saved:Number(document.getElementById("gSaved").value||0)});closeModal();save()}

function exportJSON(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});download(blob,`personal-budget-backup-${localDate()}.json`)}
function importJSON(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=normalize(JSON.parse(r.result));if(!confirm("Replace current local data with this backup?"))return;db=x;save();alert("Backup restored.");}catch{alert("Invalid backup file.")}};r.readAsText(f)}
function csvEscape(v){return `"${String(v??"").replace(/"/g,'""')}"`}
function exportCSV(){const rows=[["date","type","category","description","amount","account","note"],...db.tx.map(x=>[x.date,x.type,x.cat||"",x.desc||"",x.amount,x.account||"",x.note||""])];download(new Blob([rows.map(r=>r.map(csvEscape).join(",")).join("\n")],{type:"text/csv"}),`transactions-${localDate()}.csv`)}
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function csvHelp(){alert("CSV export format: date,type,category,description,amount,account,note. For bulk entry, fill these columns in Excel/Sheets and use it as your transaction source. Full restore should use JSON Backup.")}

render();
