# VEDORA Backend

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="Nest Logo" />
</p>

<p align="center">
  <b>Enterprise Multi-Level Marketing (MLM), E-Commerce, Digital Wallet & PhonePe Payment Processing Backend</b>
</p>

---

## 📖 Overview

The **VEDORA Backend** is an enterprise-grade REST API backend built on **NestJS 12**, **TypeScript**, **TypeORM**, and **PostgreSQL**. It powers:
- **Sequential VED ID Generation** via PostgreSQL atomic sequence (`ved_id_seq`).
- **20-Slot Width MLM Genealogy Matrix** with pessimistic write locking to prevent concurrency race conditions.
- **Pre-computed 5-Level Commission Engine** ($O(1)$ lookup for Direct Referral Bonus ₹200 + 5-level percentage splits on Business Volume).
- **Double-Entry Wallet Ledger** with balance locking for fraud-free withdrawal requests and approvals.
- **PhonePe V2 Standard Checkout Payment Gateway** with S2S webhook processing.
- **End-to-End Role-Based Access Control (RBAC)** securing admin routes across all controllers.

---

## 📚 Complete Project Documentation

All detailed architectural and technical documentation is available in the [`docs/`](./docs) folder:

- 🏛️ **[System Architecture](./docs/ARCHITECTURE.md)** — Core modules, layer structure, concurrency patterns, and security model.
- 🗄️ **[Database Schema & ERD](./docs/DATABASE-SCHEMA.md)** — PostgreSQL ER diagram (Mermaid) and full specifications for all 13 tables.
- 🌳 **[Genealogy & Compensation Plan](./docs/GENEALOGY-AND-COMMISSIONS.md)** — 20-slot matrix rules and 5-level commission calculations.
- 🔌 **[API Specification](./docs/API-SPECIFICATION.md)** — Full technical reference for all 40+ endpoints with request/response schemas.
- ⚙️ **[Operations & Deployment](./docs/OPERATIONS-AND-DEPLOYMENT.md)** — Environment setup, migrations, database seeding, testing, and production deployment.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your database credentials:
```env
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/vedora_db
JWT_SECRET=supersecretjwtkey_change_in_production
```

### 3. Seed Database
Seeds Root Admin (`VED108`) and the 3 Fixed Founders (`VED000001` - `VED000003`):
```bash
pnpm run db:seed
```

### 4. Run Development Server
```bash
pnpm run start:dev
```
- API Base: `http://localhost:8000/api`
- Interactive Swagger UI: `http://localhost:8000/api/docs`

---

## 🧪 Automated Testing

Run the full end-to-end test suite testing all 40+ API routes:
```bash
# Run the complete API test suite
pnpm run test:apis

# Or run all e2e tests
pnpm run test:e2e
```

---

## 👥 Seed Credentials (Development)

| Role | VED ID | Password | Access |
|---|---|---|---|
| **Root Admin** | `VED108` | `root@123` | Full admin control, product creation, cash orders, withdrawal approvals |
| **Founder 1** | `VED000001` | `founder@123` | Primary referral sponsor for testing incoming joins |
| **Founder 2** | `VED000002` | `founder@123` | Secondary sponsor with active wallet |
| **Founder 3** | `VED000003` | `founder@123` | Additional founder node |
