import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserBank, BankVerificationStatus } from '../src/user/entity/user-bank.entity';
import { Wallet } from '../src/wallet/entity/wallet.entity';
import { PaymentMethod } from '../src/order/entity/order.entity';

describe('VEDORA - Full System End-to-End API Test Suite', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // Unique timestamp suffix for isolating test runs
  const uniqueSuffix = Date.now().toString().slice(-6);

  // Authentication Tokens
  let adminToken: string;
  let founderToken: string;
  let partnerToken: string;

  // Partner Identity
  const partnerEmail = `partner_${uniqueSuffix}@vedora.com`;
  const partnerMobile = `98${Date.now().toString().slice(-8)}`;
  let partnerVedId: string;
  let partnerUserId: number;

  // Resource IDs across modules
  let createdProductId: number;
  let primaryBankId: number;
  let secondaryBankId: number;
  let pendingOrderId: number;
  let cashOrderId: number;
  let withdrawalId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Replicate production configuration from main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();
    dataSource = app.get(DataSource);
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. APP HEALTH & ROOT
  // ═══════════════════════════════════════════════════════════════════════════
  describe('1. Health & Welcome Endpoint', () => {
    it('GET /api should return Hello World!', async () => {
      const res = await request(app.getHttpServer()).get('/api');
      expect(res.status).toBe(200);
      expect(res.text).toBe('Hello World!');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. AUTHENTICATION MODULE (/api/auth)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('2. Authentication Module (/api/auth)', () => {
    it('POST /api/auth/login - Root Admin (VED108) login successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ vedId: 'VED108', password: 'root@123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.user.vedId).toBe('VED108');
      adminToken = res.body.access_token;
    });

    it('POST /api/auth/login - Founder (VED000001) login successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ vedId: 'VED000001', password: 'founder@123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user.role).toBe('FOUNDER');
      founderToken = res.body.access_token;
    });

    it('POST /api/auth/login - Should fail with invalid credentials (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ vedId: 'VED108', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('POST /api/auth/forgot-password & POST /api/auth/reset-password flow', async () => {
      // 1. Request reset OTP for VED000003
      const forgotRes = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ vedId: 'VED000003' });

      expect(forgotRes.status).toBe(201);
      expect(forgotRes.body).toHaveProperty('resetToken');
      const resetToken = forgotRes.body.resetToken;

      // 2. Reset password using the received OTP
      const resetRes = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          vedId: 'VED000003',
          resetToken,
          newPassword: 'tempFounderPass@123',
        });

      expect(resetRes.status).toBe(201);
      expect(resetRes.body.success).toBe(true);

      // 3. Verify login works with new password
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ vedId: 'VED000003', password: 'tempFounderPass@123' });

      expect(loginRes.status).toBe(201);

      // 4. Reset back to founder@123 for test idempotence
      const forgotRes2 = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ vedId: 'VED000003' });
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          vedId: 'VED000003',
          resetToken: forgotRes2.body.resetToken,
          newPassword: 'founder@123',
        });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. PARTNER & GENEALOGY MODULE (/api/partner)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('3. Partner & Genealogy Module (/api/partner)', () => {
    it('POST /api/partner/join - Public join under Founder VED000001 sponsor', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/partner/join')
        .send({
          referralId: 'VED000001',
          name: 'Integration Test Partner',
          email: partnerEmail,
          mobile: partnerMobile,
          password: 'Partner@123',
          city: 'Pune',
          state: 'Maharashtra',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('partner');
      expect(res.body.partner).toHaveProperty('vedId');
      expect(res.body.partner.role).toBe('PARTNER');
      expect(res.body.partner.slotNumber).toBeGreaterThanOrEqual(1);

      partnerVedId = res.body.partner.vedId;
      partnerUserId = res.body.partner.id;
    });

    it('POST /api/auth/login - Newly joined partner logs in', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ vedId: partnerVedId, password: 'Partner@123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user.role).toBe('PARTNER');
      partnerToken = res.body.access_token;
    });

    it('GET /api/partner/my-slots - Sponsor views 20 slots containing the new partner', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/partner/my-slots')
        .set('Authorization', `Bearer ${founderToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.slots)).toBe(true);
      expect(res.body.slots.length).toBe(20);

      const occupied = res.body.slots.find((slot: any) => slot.isOccupied);
      expect(occupied).toBeDefined();
    });

    it('GET /api/partner/me/genealogy - Partner views own node and uplines', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/partner/me/genealogy')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(partnerUserId);
      expect(res.body).toHaveProperty('node');
      expect(res.body).toHaveProperty('commissionUplines');
    });

    it('POST /api/partner/register-downline - Sponsor registers second downline directly', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/partner/register-downline')
        .set('Authorization', `Bearer ${founderToken}`)
        .send({
          name: 'Downline Partner Two',
          email: `downline2_${uniqueSuffix}@vedora.com`,
          mobile: `97${Date.now().toString().slice(-8)}`,
          password: 'Downline@123',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('partner');
      expect(res.body.partner.vedId).toBeDefined();
    });

    it('GET /api/partner/:vedId/genealogy - Admin can view any partner tree (RBAC)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/partner/${partnerVedId}/genealogy`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/partner/:vedId/genealogy - Partner is FORBIDDEN from viewing others (403 RBAC)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/partner/VED000001/genealogy')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. USER PROFILE, BANK & DETAILS (/api/user)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('4. User Profile, Bank & Extended Details (/api/user)', () => {
    it('GET /api/user - Partner views own profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(partnerEmail);
      expect(res.body.vedId).toBe(partnerVedId);
    });

    it('PATCH /api/user - Partner updates profile name', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/user')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ name: 'Updated Partner Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Partner Name');
    });

    it('GET & PATCH /api/user/profile-details - Extended profile details', async () => {
      const updateRes = await request(app.getHttpServer())
        .patch('/api/user/profile-details')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          addressLine1: 'MG Road 404',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.city).toBe('Mumbai');

      const getRes = await request(app.getHttpServer())
        .get('/api/user/profile-details')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.addressLine1).toBe('MG Road 404');
    });

    it('POST /api/user/bank - Partner adds primary and secondary bank accounts', async () => {
      // 1. Add primary bank
      const bank1 = await request(app.getHttpServer())
        .post('/api/user/bank')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          accountHolderName: 'Updated Partner Name',
          accountNumber: '11223344556677',
          bankName: 'HDFC Bank',
          ifscCode: 'HDFC0001234',
          isPrimary: true,
        });

      expect(bank1.status).toBe(201);
      expect(bank1.body).toHaveProperty('id');
      expect(bank1.body.isPrimary).toBe(true);
      primaryBankId = bank1.body.id;

      // 2. Add secondary bank
      const bank2 = await request(app.getHttpServer())
        .post('/api/user/bank')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          accountHolderName: 'Updated Partner Name',
          accountNumber: '99887766554433',
          bankName: 'ICICI Bank',
          ifscCode: 'ICIC0009876',
          isPrimary: false,
        });

      expect(bank2.status).toBe(201);
      secondaryBankId = bank2.body.id;
    });

    it('GET /api/user/bank - Lists all bank accounts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user/bank')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('PATCH /api/user/bank/:id/primary - Sets secondary bank as primary', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/user/bank/${secondaryBankId}/primary`)
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Primary bank account updated');
    });

    it('DELETE /api/user/bank/:id - Deletes secondary bank', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/user/bank/${secondaryBankId}`)
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });

    it('PATCH /api/user/password - Partner changes password', async () => {
      const changeRes = await request(app.getHttpServer())
        .patch('/api/user/password')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          oldPassword: 'Partner@123',
          newPassword: 'NewPassword@123',
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // Revert password back for test consistency
      await request(app.getHttpServer())
        .patch('/api/user/password')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          oldPassword: 'NewPassword@123',
          newPassword: 'Partner@123',
        });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. PRODUCT MODULE & RBAC (/api/product)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('5. Product Module & RBAC (/api/product)', () => {
    it('POST /api/product - Partner is FORBIDDEN from creating product (403 RBAC)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          name: `Unauthorized Product ${uniqueSuffix}`,
          mrp: 1000,
          salePrice: 800,
          bvAmount: 400,
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/product - Admin creates new product (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Vedora Health Formula ${uniqueSuffix}`,
          description: 'Premium organic vitality blend',
          mrp: 1500,
          salePrice: 1200,
          bvAmount: 500,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.salePrice).toBe(1200);
      createdProductId = res.body.id;
    });

    it('GET /api/product - Lists all products for authenticated users', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/product')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((p: any) => p.id === createdProductId);
      expect(found).toBeDefined();
    });

    it('GET /api/product/:id - Retrieves product by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/product/${createdProductId}`)
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdProductId);
      expect(res.body.name).toContain(uniqueSuffix);
    });

    it('PATCH /api/product/:id - Admin updates product details', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/product/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ salePrice: 1100 });

      expect(res.status).toBe(200);
      expect(res.body.salePrice).toBe(1100);
    });

    it('DELETE /api/product/:id - Partner is FORBIDDEN from deleting product (403 RBAC)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/product/${createdProductId}`)
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ORDER MODULE & COMMISSION DISTRIBUTION (/api/order)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('6. Order Module & Multi-Level Commissions (/api/order)', () => {
    it('POST /api/order - Partner creates an online (PhonePe) order', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/order')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          productId: createdProductId,
          quantity: 1,
          paymentMethod: PaymentMethod.PHONEPE,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('order');
      expect(res.body.order.paymentStatus).toBe('PENDING');
      expect(res.body.order.orderStatus).toBe('PENDING');
      pendingOrderId = res.body.order.id;
    });

    it('GET /api/order - Partner views their orders list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/order')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((o: any) => o.id === pendingOrderId);
      expect(found).toBeDefined();
    });

    it('GET /api/order/:id - Partner views order details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/order/${pendingOrderId}`)
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(pendingOrderId);
    });

    it('POST /api/order/admin/cash - Partner is FORBIDDEN from creating cash orders (403 RBAC)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/order/admin/cash')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          userId: partnerUserId,
          productId: createdProductId,
          quantity: 1,
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/order/admin/cash - Admin creates cash order and triggers 5-level commission auto-distribution', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/order/admin/cash')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: partnerUserId,
          productId: createdProductId,
          quantity: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('order');
      expect(res.body.order.paymentStatus).toBe('PAID');
      expect(res.body.order.orderStatus).toBe('CONFIRMED');
      cashOrderId = res.body.order.id;
    });

    it('GET /api/order/admin/all - Admin views all orders across the entire system', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/order/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. WALLET & WITHDRAWAL PROCESSING (/api/wallet)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('7. Wallet & Withdrawal Processing (/api/wallet)', () => {
    it('GET /api/wallet - Founder checks wallet (commission credited from cash order)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/wallet')
        .set('Authorization', `Bearer ${founderToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('availableBalance');
      expect(res.body).toHaveProperty('totalEarned');
      expect(Number(res.body.availableBalance)).toBeGreaterThan(0);
    });

    it('GET /api/wallet/transactions - Founder checks transaction history (COMMISSION credit)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${founderToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);

      const creditTxn = res.body.items.find(
        (t: any) => String(t.category).startsWith('COMMISSION') || t.type === 'CREDIT',
      );
      expect(creditTxn).toBeDefined();
    });

    it('POST /api/wallet/withdraw - Fails when bank account is not verified (400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          amount: 100,
          bankId: primaryBankId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('verified bank');
    });

    it('POST /api/wallet/withdraw - Successfully requests withdrawal after bank verification & wallet credit', async () => {
      // 1. Mark partner's bank as VERIFIED directly in database
      const bankRepo = dataSource.getRepository(UserBank);
      await bankRepo.update(primaryBankId, { verificationStatus: BankVerificationStatus.VERIFIED });

      // 2. Fund partner wallet with ₹500 (50,000 paise) to allow withdrawal
      const walletRepo = dataSource.getRepository(Wallet);
      await walletRepo.update({ userId: partnerUserId }, { availableBalance: 50000 });

      // 3. Request withdrawal of ₹100
      const res = await request(app.getHttpServer())
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          amount: 100,
          bankId: primaryBankId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('withdrawal');
      expect(res.body.withdrawal.status).toBe('PENDING');
      expect(res.body.withdrawal.amount).toBe(100);
      withdrawalId = res.body.withdrawal.id;
    });

    it('GET /api/wallet/withdrawals - Partner views withdrawal history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/wallet/withdrawals')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((w: any) => w.id === withdrawalId);
      expect(found).toBeDefined();
    });

    it('GET /api/wallet/admin/withdrawals - Partner is FORBIDDEN from viewing admin withdrawals (403 RBAC)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/wallet/admin/withdrawals')
        .set('Authorization', `Bearer ${partnerToken}`);

      expect(res.status).toBe(403);
    });

    it('GET /api/wallet/admin/withdrawals - Admin lists all withdrawals', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/wallet/admin/withdrawals')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((w: any) => w.id === withdrawalId);
      expect(found).toBeDefined();
    });

    it('PATCH /api/wallet/admin/withdrawal/:id/approve - Admin approves pending withdrawal', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/wallet/admin/withdrawal/${withdrawalId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.withdrawal.status).toBe('APPROVED');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. PAYMENT GATEWAY MODULE (/api/payment)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('8. PhonePe Payment Gateway Module (/api/payment)', () => {
    it('POST /api/payment/initiate/:orderId - Initiates payment or handles unconfigured credentials gracefully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/payment/initiate/${pendingOrderId}`)
        .set('Authorization', `Bearer ${partnerToken}`);

      // If credentials configured: 201; if not: 500 with unconfigured gateway response
      expect([201, 500]).toContain(res.status);
    });

    it('POST /api/payment/webhook - Server-to-server webhook endpoint accepts notifications', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payment/webhook')
        .send({
          merchantOrderId: 'VEDORA_MOCK_PAYMENT_TEST',
          code: 'PAYMENT_SUCCESS',
        });

      // Webhook logs and responds gracefully
      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('message');
    });

    it('GET /api/payment/callback - Handles redirect callback with status check', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/payment/callback?merchantOrderId=NON_EXISTENT_ORDER');

      // Either handles error or returns 404/500 without crashing
      expect([404, 500]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. ADMIN USER MANAGEMENT & PRODUCT CLEANUP (/api/user, /api/product)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('9. Admin User Management & RBAC Protection', () => {
    it('POST /api/user - Partner is FORBIDDEN from direct user creation (403 RBAC)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/user')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          name: 'Hacker User',
          email: `hacker_${uniqueSuffix}@vedora.com`,
          mobile: `95${Date.now().toString().slice(-8)}`,
          password: 'Password@123',
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/user - Admin creates user directly', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Directly Created User',
          email: `admin_created_${uniqueSuffix}@vedora.com`,
          mobile: `94${Date.now().toString().slice(-8)}`,
          password: 'Password@123',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('User created successfully');
      expect(res.body).toHaveProperty('vedId');
    });

    it('DELETE /api/product/:id - Admin successfully deletes an unattached product', async () => {
      // 1. Create a product that has no orders attached
      const tempProductRes = await request(app.getHttpServer())
        .post('/api/product')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Temp Product For Deletion ${uniqueSuffix}`,
          mrp: 500,
          salePrice: 400,
          bvAmount: 100,
        });

      expect(tempProductRes.status).toBe(201);
      const tempProductId = tempProductRes.body.id;

      // 2. Admin deletes it cleanly
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/product/${tempProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toContain('deleted successfully');
    });
  });
});
