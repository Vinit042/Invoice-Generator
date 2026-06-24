# Deploying BGS Invoice Generator on Hostinger Business Shared Hosting

## Architecture Overview

On Hostinger shared hosting, the Express backend serves **everything**:
- `/api/*` → API routes (auth, invoices, customers, etc.)
- `/uploads/*` → Uploaded images (logos, signatures)
- `/*` → React frontend (built static files from `public/` folder)

No `.htaccess` proxy tricks needed.

---

## Prerequisites

- Hostinger Business Plan with:
  - **MySQL database** created
  - **Node.js** enabled (hPanel → Node.js)
  - **SSH access** enabled
- Local machine: Node.js 18+, npm

---

## Step 1 — Build the React Frontend Locally

Run this in the **root** of the project on your local machine:

```bash
cd frontend
npm install
npm run build
```

This creates `frontend/dist/` with all static files.

---

## Step 2 — Copy Frontend Build into Backend

Copy the entire contents of `frontend/dist/` into `backend/public/`:

```bash
# Windows (PowerShell)
Copy-Item -Recurse -Force frontend\dist\* backend\public\

# Mac/Linux
cp -r frontend/dist/* backend/public/
```

> The `backend/public/` folder is created automatically. After copying, it should contain `index.html`, `assets/`, etc.

---

## Step 3 — Set Up MySQL on Hostinger

1. Log in to **hPanel** → **Databases** → **MySQL Databases**
2. Create a new database (e.g., `u123456789_bgs`)
3. Create a new database user with a strong password
4. Assign the user to the database with **All Privileges**
5. Note down:
   - Database name
   - Database username
   - Database password
   - Host: `localhost`

---

## Step 4 — Upload the Backend to Hostinger

### Option A: Using FTP (FileZilla)

1. In hPanel → **Files** → **FTP Accounts**, create an FTP account
2. Connect with FileZilla to your domain
3. Create a folder: `/home/yourusername/bgs_invoice/`
4. Upload the entire `backend/` folder contents into `/home/yourusername/bgs_invoice/`

   Upload these folders/files:
   ```
   bgs_invoice/
   ├── config/
   ├── controllers/
   ├── prisma/
   ├── routes/
   ├── scripts/
   ├── public/          ← React build you copied in Step 2
   ├── server.js
   ├── package.json
   └── .env             ← Create this on the server (see Step 5)
   ```

   > Do NOT upload `node_modules/` — it will be installed on the server.

### Option B: Using Git + SSH (Recommended)

1. Enable SSH in hPanel → **SSH Access**
2. Connect: `ssh u123456789@yourdomain.com`
3. Clone or upload your repo:
   ```bash
   cd ~
   git clone https://github.com/yourusername/BGS_Invoice_Generator.git
   # or use git pull if already cloned
   ```
4. Copy the React build into backend/public:
   ```bash
   cp -r BGS_Invoice_Generator/frontend/dist/* BGS_Invoice_Generator/backend/public/
   ```

---

## Step 5 — Create the `.env` File on the Server

SSH into the server and create the `.env` file:

```bash
nano ~/bgs_invoice/.env
```

Paste the following (replace values with your actual Hostinger MySQL credentials):

```env
NODE_ENV=production
PORT=3000

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=u123456789_bgsuser
MYSQL_PASSWORD=your_strong_password_here
MYSQL_DATABASE=u123456789_bgs

JWT_SECRET=replace_with_a_long_random_string_min_32_chars

UPLOAD_DIR=/home/yourusername/bgs_invoice/uploads
```

> **Generate a strong JWT secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

Save with `Ctrl+O`, then `Ctrl+X`.

---

## Step 6 — Install Dependencies & Run Migrations

SSH into the server:

```bash
cd ~/bgs_invoice

# Install production dependencies (also runs prisma generate via postinstall)
npm install --omit=dev

# Push the database schema (creates all tables)
npm run db:push
```

---

## Step 7 — Configure Node.js App in hPanel

1. Log in to **hPanel** → **Website** → **Node.js**
2. Click **Create Application**
3. Fill in:
   - **Node.js version**: 18 (or highest available)
   - **Application mode**: Production
   - **Application root**: `/home/yourusername/bgs_invoice`
   - **Application URL**: `yourdomain.com` (your main domain or subdomain)
   - **Application startup file**: `server.js`
4. Click **Create**
5. Click **Run NPM Install** (if the button is available — skip if you did it via SSH)
6. Click **Start** to launch the app

The app will be accessible at `https://yourdomain.com`.

---

## Step 8 — Verify Deployment

1. Open `https://yourdomain.com` — you should see the login page
2. Open `https://yourdomain.com/api/health` — should return `{"status":"ok","env":"production"}`
3. Register an account and test creating an invoice

---

## Step 9 — Set Up SSL (HTTPS)

1. hPanel → **SSL** → **SSL/TLS**
2. Select your domain → **Install** (free Let's Encrypt SSL)
3. Wait 2–5 minutes for it to activate

---

## Updating the Application

When you make changes:

```bash
# 1. Locally: rebuild frontend
cd frontend && npm run build

# 2. Copy new build to backend/public
cp -r dist/* ../backend/public/

# 3. Upload changed files to Hostinger (FTP or git pull)

# 4. SSH into server and restart Node.js
cd ~/bgs_invoice
# hPanel → Node.js → Restart
# OR via SSH:
# The hPanel restart button is the easiest option
```

---

## Troubleshooting

### App shows error or blank page
- SSH in and check logs: hPanel → **Node.js** → **View Logs**
- Make sure `.env` file exists and has correct MySQL credentials

### Database connection fails
- Verify MySQL username/password in hPanel → Databases
- Ensure the user is assigned to the database
- Try `npm run db:test` via SSH

### Uploads (logos/signatures) not showing
- Check `UPLOAD_DIR` in `.env` is an absolute path
- Ensure the `uploads/` folder exists: `mkdir -p ~/bgs_invoice/uploads`

### Prisma binary error
- SSH in: `npm run db:generate` to regenerate Prisma client
- If still failing: check Node.js version (must be 16+)

### Port conflicts
- Hostinger assigns the `PORT` automatically — the `PORT` in `.env` is just a fallback
- Make sure `server.js` uses `process.env.PORT || 5000`

---

## File Structure After Deployment

```
/home/yourusername/bgs_invoice/     ← Node.js app root (set in hPanel)
├── config/
├── controllers/
├── node_modules/                   ← Installed on server
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/                         ← React build (copied from frontend/dist/)
│   ├── index.html
│   └── assets/
├── routes/
├── scripts/
├── uploads/                        ← User-uploaded logos/signatures
├── .env                            ← Production environment variables
├── package.json
└── server.js
```
