# 🔧 Quick Fix - Add Error Logging

The 500 error means something is failing in the Worker. Let's add detailed error logging to find out what.

## Most Likely Issues:

### 1. **Admin User Not Seeded in D1** (Most Common)
You need to add your admin email to the database first.

**Fix**:
1. Go to Cloudflare Dashboard
2. Open D1 database: `bidxaagui-db`
3. Click "Console" tab
4. Run this SQL (replace with YOUR email):

```sql
INSERT INTO admin_users (id, email, name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'your-actual-email@example.com',  -- ⚠️ CHANGE THIS
  'Admin',
  CURRENT_TIMESTAMP
);
```

5. Verify it worked:
```sql
SELECT * FROM admin_users;
```

---

### 2. **Check What Email You're Using**
The email you enter in the login form MUST exist in the `admin_users` table.

---

### 3. **Resend API Key Issue**
Check that `.dev.vars` file exists in `backend-worker/` directory with:
```env
RESEND_API_KEY=re_ee9AHwEx_9ajFG1AanxtDSq4KGWGBniun
JWT_SECRET=bidxaagui-dev-secret-key-change-in-production-12345678
```

---

## 🔍 Debug Steps:

### Step 1: Restart the Worker
Sometimes variables aren't loaded. Stop and restart:

```bash
# Press Ctrl+C in the wrangler terminal
# Then restart:
npx wrangler dev
```

### Step 2: Test with cURL
Try requesting with cURL to see the actual error:

```bash
curl -X POST http://localhost:8787/api/auth/magic-link/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

This should show you the exact error message.

---

## ⚡ Quick Test Checklist:

- [ ] Admin user seeded in D1 database
- [ ] Using the SAME email in login form
- [ ] `.dev.vars` file exists with API keys
- [ ] Worker restarted after adding `.dev.vars`
- [ ] Database ID in wrangler.toml is correct

---

**What email did you seed in the database?** Use that exact email in the login form!
