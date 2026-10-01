# VEDORA Backend — Operations & Deployment Guide

This guide describes how to configure, run, test, and deploy the VEDORA Backend.

---

## 1. Prerequisites

- **Node.js:** v20.x or higher
- **Package Manager:** `pnpm` (recommended) or `npm`
- **Database:** PostgreSQL 15+ (local or Docker)
- **Containerization (Optional):** Docker & Docker Compose

---

## 2. Environment Variables Configuration

Create a `.env` file in the `Backend/` directory:

```env
# Server Port
PORT=8000

# Database Connection (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/vedora_db

# JWT Security Key
JWT_SECRET=your_super_secret_jwt_key_here

# PhonePe Standard Checkout V2 Configuration
PHONEPE_CLIENT_ID=your_phonepe_client_id
PHONEPE_CLIENT_SECRET=your_phonepe_client_secret
PHONEPE_CLIENT_VERSION=1
PHONEPE_ENV=SANDBOX # Or PRODUCTION
PHONEPE_REDIRECT_URL=http://localhost:5173/payment/status
PHONEPE_WEBHOOK_URL=http://localhost:8000/api/payment/webhook
```

---

## 3. Database Setup & Seeding

### 3.1 Start Database via Docker (Optional)
If PostgreSQL is not installed natively, start it using the included Docker Compose configuration:
```bash
docker-compose up -d
```

### 3.2 Initialize Schema Migrations
```bash
# Run all pending migrations
pnpm run db:migrate:run
```

### 3.3 Seed Initial Data
Seeds the **Root Admin (`VED108`)**, the **3 Fixed Founders (`VED000001` - `VED000003`)**, and their initial wallets:
```bash
pnpm run db:seed
```

---

## 4. Running the Application

### 4.1 Development Mode (with hot-reload)
```bash
pnpm run start:dev
```
- API Base: `http://localhost:8000/api`
- Swagger UI Docs: `http://localhost:8000/api/docs`

### 4.2 Production Build & Run
```bash
# 1. Compile TypeScript to dist/
pnpm run build

# 2. Start production server
pnpm run start:prod
```

---

## 5. Automated Testing

The backend includes a comprehensive Vitest test suite testing all 40+ endpoints and RBAC guards:

```bash
# Run the complete full-system E2E test suite
pnpm run test:apis

# Or run all E2E tests
pnpm run test:e2e

# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch
```

---

## 6. Production Deployment Considerations

1. **Database Connection Pooling:** Set maximum pool size (`max: 20` or based on server RAM) in `src/app.module.ts`.
2. **Reverse Proxy:** Deploy behind **Nginx** or **Cloudflare** for SSL/TLS termination, rate limiting, and DDoS protection.
3. **Process Manager:** Use **PM2** or Docker for process management and automatic restarts:
   ```bash
   pm2 start dist/main.js --name "vedora-backend" -i max
   ```
4. **PhonePe Production Credentials:**
   - Change `PHONEPE_ENV=PRODUCTION` in `.env`.
   - Update `PHONEPE_WEBHOOK_URL` to your live public domain HTTPS URL.
   - Configure the webhook endpoint in the [PhonePe Merchant Dashboard](https://business.phonepe.com/).
