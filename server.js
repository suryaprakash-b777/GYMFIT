/* ══════════════════════════════════════════════════════════
   GymFit  ·  server.js
   Node.js / Express / MySQL2 backend
   ══════════════════════════════════════════════════════════ */

require('dotenv').config();
const express    = require('express');
const mysql      = require('mysql2/promise');
const cors       = require('cors');
const bodyParser = require('body-parser');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gymfit_secret_key';

/* ── MIDDLEWARE ─────────────────────────────────────────── */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

/* ── DB POOL ─────────────────────────────────────────────── */
const pool = mysql.createPool({
  host    : process.env.DB_HOST     || 'localhost',
  user    : process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || 'surya18',
  database: process.env.DB_NAME     || 'gymfit_db',
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0
});

// Test DB connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('   → Make sure MySQL is running and .env creds are correct');
  }
})();

/* ── JWT AUTH MIDDLEWARE ─────────────────────────────────── */
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'Access denied. No token.' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

/* ══════════════════════════════════════════════════════════
   AUTH ROUTES
   ══════════════════════════════════════════════════════════ */

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required.' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE username = ?', [username]
    );
    if (!rows.length)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const admin   = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, username: admin.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register  (create additional admins — protected)
app.post('/api/auth/register', authMiddleware, async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO admins (username, password, email) VALUES (?,?,?)',
      [username, hash, email || null]
    );
    res.status(201).json({ message: 'Admin created.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Username already exists.' });
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   MEMBERS  ·  /api/members
   ══════════════════════════════════════════════════════════ */

// GET /api/members  — list all (public, no auth needed for frontend use)
app.get('/api/members', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM members ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/members/:id
app.get('/api/members/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM members WHERE id = ?', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Member not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/members  — register new member
app.post('/api/members', async (req, res) => {
  const { name, email, phone, age, plan } = req.body;
  if (!name || !email || !phone)
    return res.status(400).json({ error: 'Name, email and phone are required.' });

  // Basic email validation
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email))
    return res.status(400).json({ error: 'Invalid email address.' });

  try {
    const [result] = await pool.query(
      `INSERT INTO members (name, email, phone, age, plan, paid, joined)
       VALUES (?, ?, ?, ?, ?, FALSE, CURDATE())`,
      [name, email, phone, age || null, plan || 'basic']
    );
    const [rows] = await pool.query(
      'SELECT * FROM members WHERE id = ?', [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'A member with this email already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/members/:id  — update member (mark paid, change plan, etc.)
app.put('/api/members/:id', async (req, res) => {
  const { name, email, phone, age, plan, paid } = req.body;
  try {
    await pool.query(
      `UPDATE members
         SET name  = COALESCE(?, name),
             email = COALESCE(?, email),
             phone = COALESCE(?, phone),
             age   = COALESCE(?, age),
             plan  = COALESCE(?, plan),
             paid  = COALESCE(?, paid)
       WHERE id = ?`,
      [name, email, phone, age, plan, paid !== undefined ? paid : null, req.params.id]
    );
    const [rows] = await pool.query(
      'SELECT * FROM members WHERE id = ?', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Member not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/members/:id
app.delete('/api/members/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM members WHERE id = ?', [req.params.id]
    );
    if (!result.affectedRows)
      return res.status(404).json({ error: 'Member not found.' });
    res.json({ message: 'Member deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   TRANSACTIONS  ·  /api/transactions
   ══════════════════════════════════════════════════════════ */

// GET /api/transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, m.email as member_email
         FROM transactions t
         LEFT JOIN members m ON t.member_id = m.id
        ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions  — save a payment (called after Razorpay success)
app.post('/api/transactions', async (req, res) => {
  const { member_id, member_name, plan, amount, payment_id, status } = req.body;
  if (!amount || !plan)
    return res.status(400).json({ error: 'plan and amount are required.' });
  try {
    const [result] = await pool.query(
      `INSERT INTO transactions (member_id, member_name, plan, amount, payment_id, date, time, status)
       VALUES (?, ?, ?, ?, ?, CURDATE(), CURTIME(), ?)`,
      [member_id || null, member_name || null, plan, amount,
       payment_id || null, status || 'success']
    );

    // Auto-mark member as paid
    if (member_id) {
      await pool.query(
        'UPDATE members SET paid = TRUE WHERE id = ?', [member_id]
      );
    }

    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE id = ?', [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   DASHBOARD  ·  /api/dashboard
   ══════════════════════════════════════════════════════════ */

// GET /api/dashboard  — aggregated stats + chart data
app.get('/api/dashboard', async (req, res) => {
  try {
    // Total members
    const [[{ totalMembers }]] = await pool.query(
      'SELECT COUNT(*) AS totalMembers FROM members'
    );

    // Paid vs pending
    const [[{ paidCount }]] = await pool.query(
      'SELECT COUNT(*) AS paidCount FROM members WHERE paid = TRUE'
    );

    // Total revenue
    const [[{ totalRevenue }]] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS totalRevenue FROM transactions WHERE status = 'success'"
    );

    // Plan distribution
    const [planDist] = await pool.query(
      `SELECT plan, COUNT(*) AS count
         FROM members
        GROUP BY plan`
    );

    // Recent members (last 5)
    const [recentMembers] = await pool.query(
      'SELECT * FROM members ORDER BY created_at DESC LIMIT 5'
    );

    // Revenue by day-of-week (last 30 days)
    const [revByDay] = await pool.query(
      `SELECT DAYNAME(date) AS day, SUM(amount) AS total
         FROM transactions
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          AND status = 'success'
        GROUP BY DAYOFWEEK(date), DAYNAME(date)
        ORDER BY DAYOFWEEK(date)`
    );

    // Revenue by month (last 6 months)
    const [revByMonth] = await pool.query(
      `SELECT DATE_FORMAT(date,'%b %Y') AS month, SUM(amount) AS total
         FROM transactions
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          AND status = 'success'
        GROUP BY YEAR(date), MONTH(date)
        ORDER BY YEAR(date), MONTH(date)`
    );

    // Normalize plan distribution into a map
    const plans = { basic: 0, standard: 0, premium: 0 };
    planDist.forEach(row => { plans[row.plan] = row.count; });

    // Build full week chart (fill missing days with 0)
    const weekDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayMap   = {};
    revByDay.forEach(r => { dayMap[r.day] = Number(r.total); });
    const revenueChart = weekDays.map(d => ({ day: d.slice(0,3), amount: dayMap[d] || 0 }));

    res.json({
      stats: {
        totalMembers,
        paidCount,
        pendingCount   : totalMembers - paidCount,
        totalRevenue   : Number(totalRevenue),
        classesToday   : 12   // static for now
      },
      planDistribution: plans,
      revenueByDay    : revenueChart,
      revenueByMonth  : revByMonth.map(r => ({ month: r.month, amount: Number(r.total) })),
      recentMembers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── CATCH-ALL: serve index.html for any unknown route ───── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ── START SERVER ────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🏋️  GymFit server running at http://localhost:${PORT}`);
  console.log(`   Serving frontend from /public`);
  console.log(`   API base: http://localhost:${PORT}/api\n`);
});

