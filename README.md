# 🏋️ GymFit — Gym Management System
 
Node.js · Express · MySQL · Razorpay
 
---
 
## 📁 Project Structure
 
```
gymfit/
├── server.js          ← Express backend + all API routes
├── schema.sql         ← MySQL table definitions + sample data
├── package.json
├── .env               ← DB credentials (never commit this!)
└── public/
    ├── index.html     ← Frontend (served by Express)
    ├── style.css
    └── script.js      ← All fetch() API calls
```
 
---
 
## ⚡ Quick Setup
 
### 1. Install dependencies
```bash
npm install
```
 
### 2. Create the MySQL database
Open MySQL Workbench or your terminal:
```bash
mysql -u root -p < schema.sql
```
 
### 3. Configure environment
Edit `.env` with your credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gymfit_db
JWT_SECRET=change_this_to_something_random
```
 
### 4. Start the server
```bash
# Development (auto-restart on save)
npm run dev
 
# Production
npm start
```
 
### 5. Open in browser
```
http://localhost:3000
```
 
---
 
## 🔌 API Reference
 
### Auth
| Method | Endpoint              | Body                        | Description        |
|--------|-----------------------|-----------------------------|--------------------|
| POST   | `/api/auth/login`     | `{username, password}`      | Get JWT token      |
| POST   | `/api/auth/register`  | `{username, password, email}` | Create admin (JWT required) |
 
**Default admin credentials:**
- Username: `admin`
- Password: `admin123`
 
---
 
### Members
| Method | Endpoint            | Auth | Description           |
|--------|---------------------|------|-----------------------|
| GET    | `/api/members`      | No   | List all members      |
| GET    | `/api/members/:id`  | No   | Get single member     |
| POST   | `/api/members`      | No   | Register new member   |
| PUT    | `/api/members/:id`  | No   | Update member         |
| DELETE | `/api/members/:id`  | JWT  | Delete member         |
 
**POST /api/members body:**
```json
{
  "name": "Arjun Kumar",
  "email": "arjun@example.com",
  "phone": "9876543210",
  "age": 25,
  "plan": "standard"
}
```
 
---
 
### Transactions
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/transactions`   | List all transactions    |
| POST   | `/api/transactions`   | Save a payment record    |
 
**POST /api/transactions body:**
```json
{
  "member_id": 1,
  "member_name": "Arjun Kumar",
  "plan": "Standard",
  "amount": 1799,
  "payment_id": "rzp_test_abc123",
  "status": "success"
}
```
 
---
 
### Dashboard
| Method | Endpoint          | Description                    |
|--------|-------------------|--------------------------------|
| GET    | `/api/dashboard`  | Stats, charts, recent members  |
 
**Response shape:**
```json
{
  "stats": {
    "totalMembers": 10,
    "paidCount": 7,
    "pendingCount": 3,
    "totalRevenue": 18000,
    "classesToday": 12
  },
  "planDistribution": { "basic": 2, "standard": 5, "premium": 3 },
  "revenueByDay": [{ "day": "Mon", "amount": 2999 }, ...],
  "revenueByMonth": [{ "month": "Mar 2024", "amount": 8000 }, ...],
  "recentMembers": [...]
}
```
 
---
 
## 💳 Razorpay Setup
 
1. Sign up at [razorpay.com](https://razorpay.com)
2. Get your test API keys from Dashboard → Settings → API Keys
3. Update `server.js` and `public/script.js` with your key:
   ```
   key: 'rzp_test_YOUR_KEY_HERE'
   ```
4. Add your secret to `.env`:
   ```
   RAZORPAY_KEY_SECRET=your_secret_here
   ```
 
---
 
## 🔐 JWT Auth Usage
 
After login, include the token in requests:
```javascript
fetch('/api/members/5', {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' }
});
```
 
---
 
## 🚀 Deployment Tips
 
- Set `NODE_ENV=production` in your environment
- Use a process manager: `npm install -g pm2 && pm2 start server.js`
- Reverse proxy with Nginx pointing to `localhost:3000`
- Never commit `.env` — add it to `.gitignore`
"# GYMFIT" 
"# GYMFIT" 
