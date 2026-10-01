# VEDORA Backend Documentation

Welcome to the **VEDORA Backend Documentation Hub**. This directory contains comprehensive technical and operational documentation for the VEDORA platform backend.

---

## 📚 Documentation Index

| Document | Description | Audience |
|---|---|---|
| 🏛️ **[System Architecture](ARCHITECTURE.md)** | High-level system design, modular structure, concurrency locking, and Role-Based Access Control (RBAC). | Backend Engineers, Architects |
| 🗄️ **[Database Schema & ERD](DATABASE-SCHEMA.md)** | Entity-Relationship Diagram (Mermaid), table structures, foreign keys, constraints, and sequences. | Database Admins, Backend Engineers |
| 🌳 **[Genealogy & Compensation Plan](GENEALOGY-AND-COMMISSIONS.md)** | 20-slot width MLM matrix, precomputed 5-level upline routing, and commission calculation engine. | Product Owners, Developers |
| 🔌 **[API Specification](API-SPECIFICATION.md)** | Comprehensive REST API documentation for all 40+ endpoints with request/response schemas. | Full-Stack & Frontend Developers |
| ⚙️ **[Operations & Deployment](OPERATIONS-AND-DEPLOYMENT.md)** | Local environment setup, database seeding, automated testing commands, and production deployment. | DevOps, Sysadmins, Developers |

---

## ⚡ Quick Technical Summary

- **Framework:** NestJS 12 (TypeScript, Express)
- **Database:** PostgreSQL 15 via TypeORM
- **Payment Gateway:** PhonePe PG SDK Node (v2 Standard Checkout)
- **Authentication:** JWT Bearer with Role-Based Access Control (`ADMIN`, `FOUNDER`, `PARTNER`)
- **API Base URL:** `http://localhost:8000/api`
- **Interactive Swagger:** `http://localhost:8000/api/docs`
- **Automated Test Suite:** `pnpm run test:apis` (46 E2E tests, 100% pass rate)

---

## 🚀 Getting Started

1. **Configure Environment:** Copy `.env.example` to `.env` and configure database credentials.
2. **Seed Database:** Run `pnpm run db:seed` to initialize the Root Admin (`VED108`) and Founders (`VED000001` - `VED000003`).
3. **Start Dev Server:** Run `pnpm run start:dev`.
4. **Run Verification Tests:** Run `pnpm run test:apis` to ensure all 40+ API routes are operational.
