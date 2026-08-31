const KEY="personalBudgetLocalV1";
const CATS=[
 ["Markets","🎯","#e8dcff"],["Food & Drink","🍽️","#fff1cf"],["Transport","🚆","#dcecff"],
 ["Shopping","🛍️","#ffdede"],["Self-Care","🧴","#eee1ff"],["Home Bills","⚡","#ffe8d7"],
 ["Health","✚","#d6f8f1"],["Education","🎓","#ffe2ec"]
];
const ADVICE=[
 ["Protect your savings rate","Try to keep saving/investing a consistent percentage of income before increasing discretionary spending."],
 ["Budget before the month gets away","If one category needs extra money, transfer budget from another category instead of silently increasing total spending."],
 ["Track net worth, not just cash","Investments and liabilities matter. Review net worth monthly to see whether your overall position is improving."],
 ["Separate spending from investing","An investment transfer isn't the same as an expense. Keep both visible so your spending rate stays meaningful."],
 ["Use remaining-budget categories carefully","A Remaining category should absorb the money left after your fixed and minimum allocations are satisfied."]
];
let db=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||blank()}catch(e){return blank()}}
function blank(){return {accounts:[],tx:[],investments:[],liabilities:[],budgets:CATS.map(c=>({cat:c[0],rule:"fixed",amount:0})),budgetTransfers:[],autopay:[],goals:[]}}
function save(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
function money(n){return "₹"+Math.round(Number(n)||0).toLocaleString("en-IN")}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function monthKey(d=new Date()){return d.toISOString().slice(0,7)}
function monthName(){return new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"})}
document.getElementById("monthLabel").textContent=monthName();
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
function showTab(id){document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id===id));document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));renderAll()}
function modal(html){document.getElementById("modalBody").innerHTML=html;document.getElementById("modal").classList.add("open")}
function closeModal(){document.getElementById("modal").classList.remove("open")}
function form(title,body,submit){modal(`<h2>${title}</h2>${body}<div class="actions" style="margin-top:15px"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="${submit}">Save</button></div>`)}
function openExpense(cat){
 const accounts=db.accounts.map(a=>`<option value="${esc(a.id)}">${esc(a.name)}</option>`).join("")||`<option value="">No account yet</option>`;
 form("Add "+cat,`<label>Amount</label><input id="fAmt" type="number" min="0" inputmode="decimal"><label>Description</label><input id="fDesc" placeholder="${esc(cat)}"><label>Date</label><input id="fDate" type="date" value="${new Date().toISOString().slice(0,10)}"><label>Account</label><select id="fAcc">${accounts}</select><label>Note</label><input id="fNote" placeholder="Optional">`,`addExpense("${esc(cat)}")`)
}
function addExpense(cat){const amt=+fAmt.value;if(!amt)return;db.tx.unshift({id:crypto.randomUUID(),type:"expense",cat,amount:amt,desc:fDesc.value||cat,date:fDate.value,account:fAcc.value,note:fNote.value});save();closeModal()}
function openIncome(){form("Add Income",`<label>Amount</label><input id="iAmt" type="number" min="0"><label>Source</label><input id="iDesc" placeholder="Salary / allowance"><label>Date</label><input id="iDate" type="date" value="${new Date().toISOString().slice(0,10)}">`,`addIncome()`)}
function addIncome(){const amount=+iAmt.value;if(!amount)return;db.tx.unshift({id:crypto.randomUUID(),type:"income",amount,desc:iDesc.value||"Income",date:iDate.value});save();closeModal()}
function openAccount(){form("Add Account",`<label>Name</label><input id="aName" placeholder="Bank / Cash / Wallet"><label>Type</label><select id="aType"><option>Bank</option><option>Cash</option><option>Wallet</option></select><label>Opening balance</label><input id="aBal" type="number" value="0">`,`addAccount()`)}
function addAccount(){db.accounts.push({id:crypto.randomUUID(),name:aName.value||"Account",type:aType.value,balance:+aBal.value||0});save();closeModal()}
function openTransfer(){if(db.accounts.length<2)return alert("Add at least two accounts first.");form("Account Transfer",`<label>From</label><select id="tFrom">${db.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select><label>To</label><select id="tTo">${db.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select><label>Amount</label><input id="tAmt" type="number" min="0"><label>Date</label><input id="tDate" type="date" value="${new Date().toISOString().slice(0,10)}">`,`addTransfer()`)}
function addTransfer(){let x=+tAmt.value;if(!x||tFrom.value===tTo.value)return;db.tx.unshift({id:crypto.randomUUID(),type:"transfer",amount:x,from:tFrom.value,to:tTo.value,date:tDate.value,desc:"Account transfer"});save();closeModal()}
function openInvestment(){form("Add Investment",`<label>Type</label><select id="vType"><option>Stock</option><option>Mutual Fund</option><option>FD</option><option>Gold</option><option>Bond</option><option>Other</option></select><label>Name</label><input id="vName" placeholder="Company / scheme / bank"><div class="row"><div><label>Quantity / Units</label><input id="vQty" type="number" step="0.0001"></div><div><label>Invested</label><input id="vInv" type="number"></div></div><label>Current value</label><input id="vCur" type="number"><label>Notes / maturity / SIP details</label><input id="vNote">`,`addInvestment()`)}
function addInvestment(){if(!vName.value)return;db.investments.push({id:crypto.randomUUID(),type:vType.value,name:vName.value,qty:+vQty.value||0,invested:+vInv.value||0,current:+vCur.value||0,note:vNote.value});save();closeModal()}
function openLiability(){form("Add Liability",`<label>Name</label><input id="lName" placeholder="Loan / credit card"><label>Outstanding</label><input id="lAmt" type="number"><label>Interest %</label><input id="lRate" type="number" step=".01"><label>EMI</label><input id="lEmi" type="number"><label>Next due</label><input id="lDue" type="date">`,`addLiability()`)}
function addLiability(){db.liabilities.push({id:crypto.randomUUID(),name:lName.value||"Liability",amount:+lAmt.value||0,rate:+lRate.value||0,emi:+lEmi.value||0,due:lDue.value});save();closeModal()}
function openBudget(){form("Category Budget",`<label>Category</label><select id="bCat">${CATS.map(c=>`<option>${esc(c[0])}</option>`).join("")}</select><label>Rule</label><select id="bRule"><option value="fixed">Fixed amount</option><option value="minimum">Minimum allocation</option><option value="remaining">Remaining monthly balance</option></select><label>Amount (ignored for Remaining)</label><input id="bAmt" type="number" min="0">`,`addBudget()`)}
function addBudget(){let x=db.budgets.find(b=>b.cat===bCat.value);if(!x)db.budgets.push(x={cat:bCat.value});x.rule=bRule.value;x.amount=+bAmt.value||0;save();closeModal()}
function budgetAllocations(){
 let income=db.tx.filter(t=>t.type==="income"&&t.date?.startsWith(monthKey())).reduce((s,t)=>s+t.amount,0);
 let fixed=0,min=0,remainingCats=[];
 db.budgets.forEach(b=>{if(b.rule==="fixed")fixed+=b.amount;else if(b.rule==="minimum")min+=b.amount;else remainingCats.push(b)});
 let pool=Math.max(0,income-fixed-min);
 let alloc={};db.budgets.forEach(b=>alloc[b.cat]=b.rule==="remaining"?pool/Math.max(1,remainingCats.length):b.amount);
 return {alloc,income,total:fixed+min+pool};
}
function openBudgetTransfer(){form("Move Budget",`<label>From</label><select id="btFrom">${CATS.map(c=>`<option>${esc(c[0])}</option>`).join("")}</select><label>To</label><select id="btTo">${CATS.map(c=>`<option>${esc(c[0])}</option>`).join("")}</select><label>Amount</label><input id="btAmt" type="number" min="0"><label>Reason</label><input id="btReason" placeholder="Big purchase">`,`addBudgetTransfer()`)}
function addBudgetTransfer(){let x=+btAmt.value;if(!x||btFrom.value===btTo.value)return;db.budgetTransfers.unshift({id:crypto.randomUUID(),from:btFrom.value,to:btTo.value,amount:x,reason:btReason.value,date:new Date().toISOString().slice(0,10)});save();closeModal()}
function openAutopay(){modal(`<h2>Autopay & Recurring</h2><div class="actions"><button class="primary" onclick="openAutopayForm()">+ Add</button></div><div class="list" style="margin-top:15px">${db.autopay.map(a=>`<div class="item"><div><b>${esc(a.name)}</b><br><span class="muted">${esc(a.frequency)} · ${esc(a.next)}</span></div><div class="right">${money(a.amount)}<br><button onclick="deleteBy('autopay','${a.id}')">Delete</button></div></div>`).join("")||'<p class="muted">No recurring payments.</p>'}</div>`)}
function openAutopayForm(){form("Add Autopay",`<label>Name</label><input id="pName" placeholder="Spotify"><div class="row"><div><label>Amount</label><input id="pAmt" type="number"></div><div><label>Next due</label><input id="pNext" type="date"></div></div><label>Frequency</label><select id="pFreq"><option>Monthly</option><option>Yearly</option><option>Weekly</option></select>`,`addAutopay()`)}
function addAutopay(){db.autopay.push({id:crypto.randomUUID(),name:pName.value||"Autopay",amount:+pAmt.value||0,next:pNext.value,frequency:pFreq.value});save();closeModal();openAutopay()}
function openGoal(){form("Savings Goal",`<label>Name</label><input id="gName" placeholder="Laptop"><div class="row"><div><label>Target</label><input id="gTarget" type="number"></div><div><label>Current</label><input id="gCur" type="number"></div></div><label>Deadline</label><input id="gDue" type="date">`,`addGoal()`)}
function addGoal(){db.goals.push({id:crypto.randomUUID(),name:gName.value||"Goal",target:+gTarget.value||0,current:+gCur.value||0,due:gDue.value});save();closeModal()}
function showInsights(){const tx=db.tx.filter(t=>t.date?.startsWith(monthKey())&&t.type==="expense");const by={};tx.forEach(t=>by[t.cat]=(by[t.cat]||0)+t.amount);const vals=Object.entries(by).sort((a,b)=>b[1]-a[1]);const max=vals[0]?.[1]||1;modal(`<h2>Charts & Insights</h2><p class="muted">Current month spending by category</p><div class="chart">${vals.map(v=>`<div style="flex:1"><div class="col" style="height:${Math.max(4,v[1]/max*145)}px"></div><div class="legend">${esc(v[0].split(" ")[0])}</div></div>`).join("")||'<p class="muted">No expenses yet.</p>'}</div><div class="list">${vals.map(v=>`<div class="item"><b>${esc(v[0])}</b><span>${money(v[1])}</span></div>`).join("")}</div>`)}
function deleteBy(kind,id){db[kind]=db[kind].filter(x=>x.id!==id);save()}
function renderAll(){renderHome();renderAccounts();renderTransactions();renderBudget();renderSettings();}
function renderHome(){
 const m=monthKey(), tx=db.tx.filter(t=>t.date?.startsWith(m)), inc=tx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0), spent=tx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
 const assets=db.accounts.reduce((s,a)=>s+a.balance,0)+db.investments.reduce((s,i)=>s+i.current,0), liab=db.liabilities.reduce((s,l)=>s+l.amount,0);
 netWorth.textContent=money(assets-liab);heroSub.textContent=`Assets ${money(assets)} · Liabilities ${money(liab)}`;
 homeIncome.textContent=money(inc);homeSpent.textContent=money(spent);homeFree.textContent=money(inc-spent);
 const a=ADVICE[Math.floor(Date.now()/86400000)%ADVICE.length];adviceTitle.textContent=a[0];adviceText.textContent=a[1];
 categoryGrid.innerHTML=CATS.map(c=>{const s=tx.filter(t=>t.type==="expense"&&t.cat===c[0]).reduce((x,t)=>x+t.amount,0);return `<div class="cat" style="background:${c[2]}" onclick="openExpense('${esc(c[0])}')"><b>${c[1]} ${esc(c[0])}</b><div class="amt">${money(s)}</div><small>Tap to add expense</small></div>`}).join("");
 homeUpcoming.innerHTML=db.autopay.filter(a=>a.next).sort((a,b)=>a.next.localeCompare(b.next)).slice(0,4).map(a=>`<div class="item"><div><b>${esc(a.name)}</b><br><span class="muted">Due ${esc(a.next)}</span></div><b>${money(a.amount)}</b></div>`).join("")||'<div class="card muted">No upcoming autopay.</div>';
}
function renderAccounts(){
 accountList.innerHTML=db.accounts.map(a=>`<div class="item"><div><b>${esc(a.name)}</b><br><span class="muted">${esc(a.type)}</span></div><div class="right">${money(a.balance)}<br><button onclick="deleteBy('accounts','${a.id}')">Delete</button></div></div>`).join("")||'<div class="card muted">No accounts yet.</div>';
 investmentList.innerHTML=db.investments.map(i=>{const g=i.current-i.invested;return `<div class="item"><div><b>${esc(i.name)}</b><br><span class="muted">${esc(i.type)} · Qty ${i.qty||0}</span></div><div class="right">${money(i.current)}<br><span class="${g>=0?'green':'red'}">${g>=0?'+':''}${money(g)}</span> <button onclick="deleteBy('investments','${i.id}')">×</button></div></div>`}).join("")||'<div class="card muted">No investments yet.</div>';
 liabilityList.innerHTML=db.liabilities.map(l=>`<div class="item"><div><b>${esc(l.name)}</b><br><span class="muted">${l.rate}% · EMI ${money(l.emi)}</span></div><div class="right">${money(l.amount)}<br><span class="muted">Due ${esc(l.due||"—")}</span></div></div>`).join("")||'<div class="card muted">No liabilities.</div>';
}
function renderTransactions(){
 const q=(searchTx.value||"").toLowerCase(), type=txType.value;
 const arr=db.tx.filter(t=>(type==="all"||t.type===type)&&JSON.stringify(t).toLowerCase().includes(q)).slice(0,100);
 transactionList.innerHTML=arr.map(t=>`<div class="item"><div><b>${esc(t.desc||t.type)}</b><br><span class="muted">${esc(t.date||"")} ${t.cat?`· ${esc(t.cat)}`:""}</span></div><div class="right"><b class="${t.type==='expense'?'red':t.type==='income'?'green':''}">${t.type==='expense'?'-':t.type==='income'?'+':''}${money(t.amount)}</b><br><button onclick="deleteBy('tx','${t.id}')">Delete</button></div></div>`).join("")||'<div class="card muted">No transactions.</div>';
}
function renderBudget(){
 const x=budgetAllocations(), m=monthKey(), spentBy={};db.tx.filter(t=>t.type==="expense"&&t.date?.startsWith(m)).forEach(t=>spentBy[t.cat]=(spentBy[t.cat]||0)+t.amount);
 const total=Object.values(x.alloc).reduce((s,v)=>s+v,0), spent=Object.values(spentBy).reduce((s,v)=>s+v,0);budgetTotal.textContent=money(total);budgetSpent.textContent=money(spent);budgetRemain.textContent=money(total-spent);
 budgetList.innerHTML=db.budgets.map(b=>{const alloc=x.alloc[b.cat]||0,s=spentBy[b.cat]||0,p=alloc?Math.min(100,s/alloc*100):0;return `<div class="card"><div style="display:flex;justify-content:space-between"><b>${esc(b.cat)}</b><span class="muted">${esc(b.rule)}</span></div><div style="display:flex;justify-content:space-between;margin:10px 0"><span>Spent ${money(s)}</span><span>Plan ${money(alloc)}</span></div><div class="bar"><i style="width:${p}%"></i></div></div>`}).join("");
 budgetTransfers.innerHTML=db.budgetTransfers.slice(0,10).map(t=>`<div class="item"><div><b>${esc(t.from)} → ${esc(t.to)}</b><br><span class="muted">${esc(t.reason||"Budget transfer")} · ${esc(t.date)}</span></div><b>${money(t.amount)}</b></div>`).join("")||'<div class="card muted">No transfers yet.</div>';
}
function renderSettings(){}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="budget-backup.json";a.click();URL.revokeObjectURL(a.href)}
function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();alert("Backup imported.")}catch(x){alert("Invalid backup file.")}};r.readAsText(f)}
function resetData(){if(confirm("Delete all local financial data? This cannot be undone unless you exported a backup.")){db=blank();save()}}
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
renderAll();
