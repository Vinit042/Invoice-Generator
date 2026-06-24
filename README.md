# BGS GST Invoice Generator

A production-ready GST Tax Invoice Generator SaaS built with MERN stack (MySQL + Prisma).

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Shadcn UI, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MySQL with Prisma ORM
- **Auth:** JWT + bcrypt
- **PDF:** pdf-lib + html2canvas
- **Uploads:** Multer

## Prerequisites

- Node.js 18+
- MySQL 8+

## Setup

### 1. Database

Create a MySQL database:

```sql
CREATE DATABASE bgs_invoice;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Features

- User registration & login (JWT stored in localStorage)
- Dashboard with invoice stats and revenue overview
- Company settings (logo, signature, bank details, invoice prefix)
- Customer CRUD with search and invoice history
- GST invoice builder with live split-screen preview
- Auto tax calculations (CGST, SGST, IGST)
- Auto invoice numbering (e.g., BGS/0001/26-27)
- PDF download and print
- Public invoice sharing (`/invoice/BGS-0001-26-27`)
- WhatsApp share

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| GET | `/api/public/invoice/:slug` | Public invoice view |

## Invoice Number Format

`{PREFIX}/{SEQUENCE}/{FINANCIAL_YEAR}`

Example: `BGS/0001/26-27`

## Project Structure

```
backend/
  controllers/
  routes/
  middleware/
  prisma/
  config/
  utils/

frontend/
  src/
    components/
    pages/
    layouts/
    hooks/
    services/
    context/
    routes/
    utils/
```
