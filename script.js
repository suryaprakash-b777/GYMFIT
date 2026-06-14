/* ══════════════════════════════════════════════════════════
   GymFit  ·  script.js
   All data ops use fetch() → Express/MySQL backend
   ══════════════════════════════════════════════════════════ */
 
const API = 'http://localhost:3000/api'; // set directly to the server to prevent fetch errors if accessed via file://
 
/* ── CLASSES DATA (static — no DB needed) ────────────────── */
const CLASSES = [
  { time:'6:00 AM',  name:'Power Yoga',          trainer:'Ravi Kumar',   dur:'60 min', total:20, booked:14, level:'All',          shift:'morning'   },
  { time:'6:30 AM',  name:'Strength Training',   trainer:'Priya Sharma', dur:'90 min', total:15, booked:10, level:'Intermediate', shift:'morning'   },
  { time:'7:00 AM',  name:'Zumba Dance',         trainer:'Kavya Nair',   dur:'60 min', total:25, booked:22, level:'Beginner',     shift:'morning'   },
  { time:'7:30 AM',  name:'HIIT Blast',          trainer:'Arjun Reddy',  dur:'45 min', total:12, booked:12, level:'Advanced',     shift:'morning'   },
  { time:'8:00 AM',  name:'Spin Cycle',          trainer:'Ravi Kumar',   dur:'60 min', total:18, booked:11, level:'All',          shift:'morning'   },
  { time:'9:00 AM',  name:'Pilates Core',        trainer:'Meena Iyer',   dur:'50 min', total:15, booked: 8, level:'Beginner',     shift:'morning'   },
  { time:'12:00 PM', name:'CrossFit',            trainer:'Arjun Reddy',  dur:'60 min', total:12, booked: 9, level:'Advanced',     shift:'afternoon' },
  { time:'1:00 PM',  name:'Aerobics',            trainer:'Kavya Nair',   dur:'45 min', total:20, booked:13, level:'All',          shift:'afternoon' },
  { time:'2:00 PM',  name:'Boxing Basics',       trainer:'Priya Sharma', dur:'60 min', total:10, booked: 7, level:'Beginner',     shift:'afternoon' },
  { time:'5:00 PM',  name:'Functional Fitness',  trainer:'Priya Sharma', dur:'60 min', total:20, booked:16, level:'Intermediate', shift:'evening'   },
  { time:'6:00 PM',  name:'Body Pump',           trainer:'Ravi Kumar',   dur:'60 min', total:20, booked:18, level:'All',          shift:'evening'   },
  { time:'7:00 PM',  name:'Meditation & Stretch',trainer:'Meena Iyer',   dur:'45 min', total:30, booked:25, level:'All',          shift:'evening'   },
];
 
let curShift = 'all';
let selPlan  = { name:'Basic', amount:999 };
let authToken = localStorage.getItem('gymfit_token') || null; // JWT stored in localStorage
let allMembersCache = []; // Cache for editing

/* ── THEME INITIALIZATION ── */
let currentTheme = localStorage.getItem('gymfit_theme') || 'light';
if (currentTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeBtn').textContent = '☀️ Light';
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('themeBtn').textContent = '🌙 Theme';
  }
  localStorage.setItem('gymfit_theme', currentTheme);
}
 
/* ══════════════════════════════════════════════════════════
   API HELPERS  —  replace old localStorage functions
   ══════════════════════════════════════════════════════════ */
 
/* headers for authenticated requests */
function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = 'Bearer ' + authToken;
  return h;
}
 
/* GET /api/members → array of member objects */
async function getMembers() {
  try {
    const res = await fetch(`${API}/members`);
    if (!res.ok) throw new Error('Failed to fetch members');
    allMembersCache = await res.json();
    return allMembersCache;
  } catch (err) {
    console.error('getMembers:', err);
    toast('Error fetching members', 'err');
    return [];
  }
}

/* PUT /api/members/:id → update member */
async function commitUpdateMember(id, data) {
  const res = await fetch(`${API}/members/${id}`, {
    method : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Update failed');
  return json;
}
 
/* POST /api/members → saved member object */
async function addMember(data) {
  const res = await fetch(`${API}/members`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(data)
  });
  
  // ✅ SAFE JSON PARSE
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from server. Raw response: ${text.substring(0, 100)}`);
  }

  if (!res.ok) throw new Error(json?.error || 'Registration failed');
  return json;
}
 
/* DELETE /api/members/:id */
async function deleteMember(id) {
  const res = await fetch(`${API}/members/${id}`, {
    method : 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const j = await res.json();
    throw new Error(j.error || 'Delete failed');
  }
}
 
/* GET /api/transactions → array */
async function getTransactions() {
  try {
    const res = await fetch(`${API}/transactions`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return await res.json();
  } catch (err) {
    console.error('getTransactions:', err);
    return [];
  }
}
 
/* POST /api/transactions → saved transaction */
async function addTransaction(data) {
  const res = await fetch(`${API}/transactions`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Transaction save failed');
  return json;
}
 
/* GET /api/dashboard → stats object */
async function getDashboardData() {
  try {
    const res = await fetch(`${API}/dashboard`);
    if (!res.ok) throw new Error('Dashboard fetch failed');
    return await res.json();
  } catch (err) {
    console.error('getDashboard:', err);
    return null;
  }
}
 
/* ══════════════════════════════════════════════════════════
   AUTH  (login modal — optional admin gate)
   ══════════════════════════════════════════════════════════ */
 
async function login(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ username, password })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Login failed');
  authToken = json.token;
  localStorage.setItem('gymfit_token', authToken);
  return json;
}
 
function logout() {
  authToken = null;
  localStorage.removeItem('gymfit_token');
}
 
/* ── NAVIGATION ──────────────────────────────────────────── */
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const btn = [...document.querySelectorAll('.nav-btn')].find(
    b => b.textContent.toLowerCase().includes(page === 'home' ? 'home' : page)
  );
  if (btn) btn.classList.add('active');
  document.getElementById('navLinks').classList.remove('open');
  window.scrollTo({ top:0, behavior:'smooth' });
 
  if (page === 'dashboard') buildDashboard();
  if (page === 'members')   { renderMembers(); refreshHeroCount(); }
  if (page === 'payments')  renderTxns();
  if (page === 'home')      refreshHeroCount();
}
 
/* ── HAMBURGER ───────────────────────────────────────────── */
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
 
/* ── HERO PARTICLES ──────────────────────────────────────── */
(function spawnParticles() {
  const wrap = document.getElementById('heroParticles');
  if (!wrap) return;
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const left = Math.random() * 100;
    const top  = Math.random() * 100;
    const tx   = (Math.random() - 0.5) * 60 + 'px';
    const ty   = -(20 + Math.random() * 60) + 'px';
    const dur  = (5 + Math.random() * 7).toFixed(1) + 's';
    const del  = (Math.random() * 6).toFixed(1) + 's';
    p.style.cssText = `left:${left}%;top:${top}%;--tx:${tx};--ty:${ty};--dur:${dur};animation-delay:${del}`;
    wrap.appendChild(p);
  }
})();
 
/* ── HERO COUNTER ────────────────────────────────────────── */
async function refreshHeroCount() {
  const el = document.getElementById('heroMCount');
  if (!el) return;
  const members = await getMembers();
  el.textContent = members.length;
}
 
/* ══════════════════════════════════════════════════════════
   MEMBER REGISTRATION
   ══════════════════════════════════════════════════════════ */
document.getElementById('memberForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name   = document.getElementById('mName').value.trim();
  const email  = document.getElementById('mEmail').value.trim();
  const phone  = document.getElementById('mPhone').value.trim();
  const age    = document.getElementById('mAge').value.trim();
  const planEl = document.querySelector('input[name="plan"]:checked');
 
  if (!name || !email || !phone) { toast('Please fill all required fields.', 'err'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Enter a valid email address.', 'err'); return; }
 
  const submitBtn = this.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Registering…';
 
  try {
    const member = await addMember({
      name, email, phone,
      age : age || null,
      plan: planEl ? planEl.value : 'standard'
    });
    renderMembers();
    refreshHeroCount();
    this.reset();
    document.querySelector('input[name="plan"][value="standard"]').checked = true;
    toast(`✅ ${member.name} registered successfully!`);
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '✅ Register Member';
  }
});
 
/* ── RENDER MEMBERS ──────────────────────────────────────── */
async function renderMembers() {
  const list  = document.getElementById('membersList');
  const label = document.getElementById('memberCountLabel');
  if (list) list.innerHTML = '<div class="empty-msg">Loading…</div>';
 
  const members = await getMembers();
  if (label) label.textContent = members.length + ' member' + (members.length !== 1 ? 's' : '');
  if (!list) return;
 
  if (!members.length) {
    list.innerHTML = '<div class="empty-msg">No members yet — register above! 💪</div>';
    return;
  }
 
  // Format joined date nicely
  const fmt = d => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  };
 
  list.innerHTML = members.map(m => `
    <div class="member-row">
      <div class="mem-ava">${m.name.charAt(0).toUpperCase()}</div>
      <div class="mem-info">
        <div class="mem-name">${m.name}</div>
        <div class="mem-meta">${m.email} · ${fmt(m.joined)}</div>
      </div>
      <span class="plan-chip chip-${m.plan}">${cap(m.plan)}</span>
      <div style="display:flex; gap:6px;">
        <button class="mem-del" onclick="openEditModal(${m.id})" title="Edit" style="color:var(--blue)">✏️</button>
        <button class="mem-del" onclick="delMember(${m.id})" title="Delete">✕</button>
      </div>
    </div>`).join('');
}
 
async function delMember(id) {
  try {
    await deleteMember(id);
    renderMembers();
    refreshHeroCount();
    if (document.getElementById('page-dashboard').classList.contains('active')) buildDashboard();
    toast('Member removed.', 'info');
  } catch (err) {
    toast(err.message, 'err');
  }
}
 
/* ── EDIT MEMBER (MODAL) ─────────────────────────────────── */
function openEditModal(id) {
  const m = allMembersCache.find(x => x.id === id);
  if (!m) return;
  document.getElementById('eId').value = m.id;
  document.getElementById('eName').value = m.name;
  document.getElementById('eEmail').value = m.email;
  document.getElementById('ePhone').value = m.phone;
  document.getElementById('eAge').value = m.age || '';
  document.getElementById('ePlan').value = m.plan || 'basic';
  document.getElementById('ePaid').value = m.paid ? 'true' : 'false';
  
  const modal = document.getElementById('editModal');
  modal.classList.add('visible');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('visible');
}

document.getElementById('editForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const id = document.getElementById('eId').value;
  const name = document.getElementById('eName').value.trim();
  const email = document.getElementById('eEmail').value.trim();
  const phone = document.getElementById('ePhone').value.trim();
  const age = document.getElementById('eAge').value.trim();
  const plan = document.getElementById('ePlan').value;
  const paid = document.getElementById('ePaid').value === 'true';

  if (!name || !email || !phone) { toast('Please fill all required fields.', 'err'); return; }
  
  const submitBtn = this.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Updating...';

  try {
    await commitUpdateMember(id, { name, email, phone, age: age || null, plan, paid });
    closeEditModal();
    renderMembers();
    refreshHeroCount();
    if (document.getElementById('page-dashboard').classList.contains('active')) buildDashboard();
    toast(`✅ Member updated successfully!`);
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '✅ Update';
  }
});

/* ── BMI (pure client-side, no API needed) ───────────────── */
function calcBMI() {
  const w = parseFloat(document.getElementById('bmiW').value);
  const h = parseFloat(document.getElementById('bmiH').value);
  if (!w || !h || w < 30 || h < 100) { toast('Enter valid weight and height.', 'err'); return; }
  const bmi = w / Math.pow(h / 100, 2);
  const val = bmi.toFixed(1);
 
  let cat, color;
  if      (bmi < 18.5) { cat = '⚠️ Underweight';  color = '#1D4ED8'; }
  else if (bmi < 25)   { cat = '✅ Normal Weight'; color = '#065F46'; }
  else if (bmi < 30)   { cat = '⚠️ Overweight';   color = '#92400E'; }
  else                 { cat = '🚨 Obese';         color = '#991B1B'; }
 
  document.getElementById('bmiVal').textContent = val;
  document.getElementById('bmiCat').textContent = val;
  const catEl = document.getElementById('bmiCat');
  catEl.textContent = cat; catEl.style.color = color;
  const circ = document.getElementById('bmiCircle');
  circ.style.borderColor = color; circ.style.color = color; circ.style.background = color + '14';
  document.getElementById('bmiVal').textContent = val;
  document.getElementById('bmiOut').style.display = 'block';
 
  document.querySelectorAll('.bl-chip').forEach(c => c.classList.remove('active'));
  const map = { Underweight:'under', 'Normal Weight':'normal', Overweight:'over', Obese:'obese' };
  const key = Object.keys(map).find(k => cat.includes(k));
  if (key) document.querySelector('.bl-chip.' + map[key])?.classList.add('active');
  toast(`BMI: ${val} — ${cat.replace(/[^a-zA-Z ]/g,'').trim()}`);
}
 
/* ── CLASSES (static data, no API) ──────────────────────── */
function renderClasses(data) {
  const tbody = document.getElementById('classTbody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#9CA3AF">No classes found.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map((c, i) => {
    const pct   = Math.round(c.booked / c.total * 100);
    const color = pct >= 95 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981';
    const full  = c.booked >= c.total;
    const lv    = c.level.toLowerCase().replace(' ','');
    return `<tr>
      <td><strong>${c.time}</strong></td>
      <td>${c.name}</td>
      <td>${c.trainer}</td>
      <td>${c.dur}</td>
      <td>
        <div class="slot-cell">
          <div class="mini-bar"><div class="mini-fill" style="width:${pct}%;background:${color}"></div></div>
          <span class="slot-txt" style="color:${full?'#EF4444':'inherit'}">${c.booked}/${c.total}</span>
        </div>
      </td>
      <td><span class="lv-tag lv-${lv}">${c.level}</span></td>
      <td><button class="book-btn ${full?'booked':''}" onclick="bookSlot(${i},this)" ${full?'disabled':''}>${full?'Full ✗':'Book'}</button></td>
    </tr>`;
  }).join('');
}
 
function filterClasses() {
  const q = document.getElementById('classQ').value.toLowerCase();
  const filtered = CLASSES.filter(c =>
    (curShift === 'all' || c.shift === curShift) &&
    (c.name.toLowerCase().includes(q) || c.trainer.toLowerCase().includes(q))
  );
  renderClasses(filtered);
}
 
function setShift(shift, btn) {
  curShift = shift;
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterClasses();
}
 
function bookSlot(idx, btn) {
  if (CLASSES[idx].booked >= CLASSES[idx].total) return;
  CLASSES[idx].booked++;
  btn.textContent = 'Booked ✓'; btn.classList.add('booked'); btn.disabled = true;
  filterClasses();
  toast(`🎉 Booked "${CLASSES[idx].name}" at ${CLASSES[idx].time}!`);
}
 
/* ══════════════════════════════════════════════════════════
   PAYMENTS  —  Razorpay client-side + save to DB server-side
   ══════════════════════════════════════════════════════════ */
 
function selectPlan(el, amount, name) {
  document.querySelectorAll('.pay-plan').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  selPlan = { name, amount };
  document.getElementById('payAmt').textContent = amount.toLocaleString('en-IN');
}
 
async function pay() {
  const members = await getMembers();
  if (!members.length) { toast('Register a member first!', 'err'); return; }
  const member = members[0]; // most recent member (API returns DESC order)
 
  const opts = {
    key        : 'rzp_test_1DP5mmOlF5G5ag',   // ← swap with your Razorpay key
    amount     : selPlan.amount * 100,
    currency   : 'INR',
    name       : 'GymFit',
    description: selPlan.name + ' Membership',
    theme      : { color: '#FF6B35' },
    prefill    : { name: member.name, email: member.email, contact: member.phone },
    handler    : (res) => recordPayment(member, res.razorpay_payment_id)
  };
 
  try   { new Razorpay(opts).open(); }
  catch { recordPayment(member, 'SIM_' + Date.now()); } // fallback for test mode
}
 
async function recordPayment(member, paymentId) {
  try {
    // Save transaction to DB via API
    await addTransaction({
      member_id  : member.id,
      member_name: member.name,
      plan       : selPlan.name,
      amount     : selPlan.amount,
      payment_id : paymentId || ('SIM_' + Date.now()),
      status     : 'success'
    });
    // API auto-marks member as paid; refresh UI
    renderTxns();
    if (document.getElementById('page-dashboard').classList.contains('active')) buildDashboard();
    toast(`💰 Payment ₹${selPlan.amount.toLocaleString('en-IN')} successful!`);
  } catch (err) {
    toast('Payment recorded locally but DB save failed: ' + err.message, 'err');
  }
}
 
/* ── RENDER TRANSACTIONS ─────────────────────────────────── */
async function renderTxns() {
  const list  = document.getElementById('txnList');
  const label = document.getElementById('txnCountLabel');
  const rev   = document.getElementById('totalRevLabel');
  if (list) list.innerHTML = '<div class="empty-msg">Loading…</div>';
 
  const txns  = await getTransactions();
  const total = txns.reduce((s, t) => s + Number(t.amount), 0);
  if (label) label.textContent = txns.length + ' transaction' + (txns.length !== 1 ? 's' : '');
  if (rev)   rev.textContent   = '₹' + total.toLocaleString('en-IN');
  if (!list) return;
 
  if (!txns.length) { list.innerHTML = '<div class="empty-msg">No transactions yet.</div>'; return; }
 
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  const fmtTime = t => t ? t.slice(0,5) : '';
 
  list.innerHTML = txns.map(t => `
    <div class="txn-row">
      <div class="txn-ico">💳</div>
      <div class="txn-body">
        <div class="txn-name">${t.member_name || 'Guest'} · ${t.plan} Plan</div>
        <div class="txn-date">${fmtDate(t.date)} · ${fmtTime(t.time)} · ${(t.payment_id||'').substring(0,14)}…</div>
      </div>
      <div class="txn-amt">+₹${Number(t.amount).toLocaleString('en-IN')}</div>
    </div>`).join('');
}
 
/* ══════════════════════════════════════════════════════════
   DASHBOARD  —  pull live data from /api/dashboard
   ══════════════════════════════════════════════════════════ */
 
async function buildDashboard() {
  const data = await getDashboardData();
  if (!data) { toast('Could not load dashboard data.', 'err'); return; }
 
  const { stats, planDistribution: plans, revenueByDay, recentMembers } = data;
 
  setText('dMembers', stats.totalMembers);
  setText('dRevenue', '₹' + Number(stats.totalRevenue).toLocaleString('en-IN'));
  setText('dPaid',    stats.paidCount);
  setText('dPending', stats.pendingCount + ' pending');
  setText('basicCnt', plans.basic);
  setText('stdCnt',   plans.standard);
  setText('premCnt',  plans.premium);
 
  const max = Math.max(1, plans.basic, plans.standard, plans.premium);
  setTimeout(() => {
    setWidth('basicBar', plans.basic    / max * 100);
    setWidth('stdBar',   plans.standard / max * 100);
    setWidth('premBar',  plans.premium  / max * 100);
  }, 80);
 
  // Revenue chart
  const maxAmt = Math.max(1, ...revenueByDay.map(d => d.amount));
  const chart  = document.getElementById('revChart');
  if (chart) chart.innerHTML = revenueByDay.map(d => {
    const h = Math.max(6, Math.round(d.amount / maxAmt * 110));
    return `<div class="rc-col">
      <div class="rc-bar" style="height:${h}px" title="₹${Number(d.amount).toLocaleString('en-IN')}"></div>
      <span class="rc-lbl">${d.day}</span>
    </div>`;
  }).join('');
 
  // Recent members
  const recentEl = document.getElementById('recentList');
  if (!recentMembers.length) {
    if (recentEl) recentEl.innerHTML = '<div class="empty-msg">No members yet.</div>';
    return;
  }
  const fmt = d => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  if (recentEl) recentEl.innerHTML = recentMembers.map(m => `
    <div class="member-row">
      <div class="mem-ava">${m.name.charAt(0).toUpperCase()}</div>
      <div class="mem-info">
        <div class="mem-name">${m.name}</div>
        <div class="mem-meta">${m.plan} plan · ${fmt(m.joined)}</div>
      </div>
      <span style="font-size:1.1rem">${m.paid ? '✅' : '⏳'}</span>
    </div>`).join('');
}
 
/* ── EXPORT & CLEAR ──────────────────────────────────────── */
async function exportData() {
  const [members, transactions] = await Promise.all([getMembers(), getTransactions()]);
  const blob = new Blob(
    [JSON.stringify({ members, transactions }, null, 2)],
    { type: 'application/json' }
  );
  const a = Object.assign(document.createElement('a'), {
    href    : URL.createObjectURL(blob),
    download: 'gymfit-data.json'
  });
  a.click();
  URL.revokeObjectURL(a.href);
  toast('📥 Data exported!');
}
 
async function clearData() {
  if (!confirm('⚠️ This will delete ALL members from the database. Are you sure?')) return;
  try {
    const members = await getMembers();
    await Promise.all(members.map(m => deleteMember(m.id)));
    buildDashboard(); renderMembers(); renderTxns(); refreshHeroCount();
    toast('🗑 All members deleted.', 'info');
  } catch (err) {
    toast('Clear failed: ' + err.message, 'err');
  }
}
 
/* ── TOAST ───────────────────────────────────────────────── */
function toast(msg, type = 'ok') {
  const icons = { ok:'✅', err:'❌', info:'ℹ️' };
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'err' ? ' err' : type === 'info' ? ' info' : '');
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById('toastZone').appendChild(t);
  setTimeout(() => {
    t.style.opacity   = '0';
    t.style.transform = 'translateX(30px)';
    t.style.transition = '0.3s';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}
 
/* ── UTILS ───────────────────────────────────────────────── */
const cap      = s => s.charAt(0).toUpperCase() + s.slice(1);
const setText  = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
const setWidth = (id, v) => { const e = document.getElementById(id); if (e) e.style.width = v + '%'; };
 
/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (currentTheme === 'dark') document.getElementById('themeBtn').textContent = '☀️ Light';
});
renderClasses(CLASSES);
renderTxns();
refreshHeroCount();