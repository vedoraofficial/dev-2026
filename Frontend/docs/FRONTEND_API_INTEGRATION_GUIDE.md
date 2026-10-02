# VEDORA Backend — Complete Frontend API Integration Guide

Welcome to the **VEDORA Platform API Integration Guide**. This document is designed for frontend/UI developers to seamlessly integrate all backend REST APIs into the client web application (React / Vite / TypeScript).

---

## Table of Contents
1. [General Information & Setup](#1-general-information--setup)
2. [Authentication & Authorization (RBAC)](#2-authentication--authorization-rbac)
3. [Recommended Frontend Architecture & Axios Setup](#3-recommended-frontend-architecture--axios-setup)
4. [TypeScript Data Models & Enums](#4-typescript-data-models--enums)
5. [Module API Reference](#5-module-api-reference)
   - [5.1 Authentication Module (`/api/auth`)](#51-authentication-module-apiauth)
   - [5.2 User & Profile Module (`/api/user`)](#52-user--profile-module-apiuser)
   - [5.3 Partner & Genealogy Module (`/api/partner`)](#53-partner--genealogy-module-apipartner)
   - [5.4 Product Module (`/api/product`)](#54-product-module-apiproduct)
   - [5.5 Order & Checkout Module (`/api/order`)](#55-order--checkout-module-apiorder)
   - [5.6 Wallet & Withdrawal Module (`/api/wallet`)](#56-wallet--withdrawal-module-apiwallet)
   - [5.7 PhonePe Payment Module (`/api/payment`)](#57-phonepe-payment-module-apipayment)
6. [Complete PhonePe Checkout Flow (Step-by-Step)](#6-complete-phonepe-checkout-flow-step-by-step)
7. [Error Handling & HTTP Status Codes](#7-error-handling--http-status-codes)
8. [Development Credentials for Testing](#8-development-credentials-for-testing)

---

## 1. General Information & Setup

- **Backend Base URL (Local Dev):** `http://localhost:8000/api`
- **Interactive Swagger Documentation:** `http://localhost:8000/api/docs`
- **Vite Proxy (Recommended in dev):**
  In Vite `vite.config.ts`, `/api` is proxied to `http://localhost:8000`, so frontend code calls `/api/...`.
- **Content-Type:** `application/json` for all POST, PATCH, and PUT requests.
- **Currencies & Numbers:**
  - Product `mrp` and `salePrice` in requests/responses are in **Rupees (₹)**.
  - Wallet amounts in the database are stored in **Paise** (1 Rupee = 100 Paise), but formatted display strings (e.g. `amountFormatted: "₹500.00"`) are provided in API responses for convenience.
  - Withdrawal requests take `amount` in **Rupees (₹)** (Minimum: ₹100).

---

## 2. Authentication & Authorization (RBAC)

VEDORA uses standard **JWT Bearer Token** authentication.

### Authorization Header
All protected endpoints require the HTTP header:
```http
Authorization: Bearer <your_access_token>
```

### User Roles
| Role | Description | Capabilities |
|---|---|---|
| `ADMIN` | Root administrator (`VED108`) | Full control: create products, create cash orders, manage users, approve/reject withdrawals, view any tree. |
| `FOUNDER` | Permanent founding partner (`VED000001`, `VED000002`, `VED000003`) | Receives level commissions, has direct partner slots, cannot be placed under anyone. |
| `PARTNER` | Regular distributor partner | Has a sponsor, placed in slots 1–20, earns 5-level commissions, requests withdrawals. |

> **Security Note:** If a partner tries to access an admin-only endpoint (like `POST /api/product` or `POST /api/order/admin/cash`), the backend responds with **`403 Forbidden`**.

---

## 3. Recommended Frontend Architecture & Axios Setup

In your frontend application (`Frontend/src/lib/api.ts`), configure an Axios instance with automatic request and response interceptors:

```typescript
// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 4. TypeScript Data Models & Enums

Save these in `src/types/api.ts`:

```typescript
// ─── Enums ───────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'ADMIN',
  FOUNDER = 'FOUNDER',
  PARTNER = 'PARTNER',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum BankVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PaymentMethod {
  PHONEPE = 'PHONEPE',
  CASH = 'CASH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum TransactionCategory {
  COMMISSION_DIRECT = 'COMMISSION_DIRECT',
  COMMISSION_LEVEL_1 = 'COMMISSION_LEVEL_1',
  COMMISSION_LEVEL_2 = 'COMMISSION_LEVEL_2',
  COMMISSION_LEVEL_3 = 'COMMISSION_LEVEL_3',
  COMMISSION_LEVEL_4 = 'COMMISSION_LEVEL_4',
  COMMISSION_LEVEL_5 = 'COMMISSION_LEVEL_5',
  WITHDRAWAL = 'WITHDRAWAL',
  WITHDRAWAL_REFUND = 'WITHDRAWAL_REFUND',
  PURCHASE = 'PURCHASE',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

// ─── Entities & Responses ────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  vedId: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface UserProfileDetails {
  id: number;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profilePhoto?: string;
}

export interface UserBank {
  id: number;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  verificationStatus: BankVerificationStatus; // 'PENDING' | 'VERIFIED' | 'REJECTED'
  verifiedName?: string | null;               // Official registered name returned by destination bank
  nameMatchScore?: number | null;            // 0 - 100 fuzzy match score
  nameMatchResult?: string | null;           // 'DIRECT' | 'GOOD' | 'MODERATE' | 'POOR' | 'NO_MATCH'
  utr?: string | null;                        // Bank UTR for ₹1 Penny Drop deposit
  verificationReferenceId?: string | null;    // Cashfree verification transaction reference
  verificationFailedReason?: string | null;   // Failure explanation if rejected
  verifiedAt?: string | null;                 // Verification completion timestamp
  isPrimary: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  mrp: number;
  salePrice: number;
  bvAmount: number;
  status: ProductStatus;
  createdAt: string;
}

export interface SlotItem {
  slotNumber: number;
  isOccupied: boolean;
  partner?: {
    id: number;
    vedId: string;
    name: string;
    email: string;
    mobile: string;
    status: UserStatus;
    joinedAt: string;
  };
}

export interface SlotsResponse {
  sponsor: {
    id: number;
    vedId: string;
    name: string;
    role: UserRole;
  };
  totalFilled: number;
  totalAvailable: number;
  maxSlots: number;
  filledSlots: SlotItem[];
  slots: SlotItem[];
}

export interface UplineNode {
  id: number;
  vedId: string;
  name: string;
}

export interface GenealogyResponse {
  user: AuthUser;
  node: {
    depth: number;
    slotNumber: number;
    placementStatus: string;
    parent: UplineNode | null;
  } | null;
  directPartnersCount: number;
  maxSlots: 20;
  directPartners: Array<{
    id: number;
    vedId: string;
    name: string;
    email: string;
    mobile: string;
    slotNumber: number;
    depth: number;
    status: string;
  }>;
  commissionUplines: {
    level1: UplineNode | null;
    level2: UplineNode | null;
    level3: UplineNode | null;
    level4: UplineNode | null;
    level5: UplineNode | null;
  } | null;
}

export interface OrderItem {
  id: number;
  userId: number;
  userVedId?: string;
  userName?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  totalAmountFormatted: string;
  bvTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
}

export interface WalletSummary {
  availableBalance: number;       // in paise
  availableBalanceFormatted: string; // e.g. "₹1,250.00"
  lockedBalance: number;          // in paise (pending withdrawals)
  lockedBalanceFormatted: string;
  totalEarned: number;            // in paise
  totalEarnedFormatted: string;
  totalWithdrawn: number;         // in paise
  totalWithdrawnFormatted: string;
}

export interface WalletTransaction {
  id: number;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;                 // in paise
  amountFormatted: string;
  balanceAfter: number;
  balanceAfterFormatted: string;
  referenceType?: string;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface WithdrawalRecord {
  id: number;
  amount: number;                 // in paise
  amountFormatted: string;
  status: WithdrawalStatus;
  bank: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  remarks?: string;
  createdAt: string;
}
```

---

## 5. Module API Reference

### 5.1 Authentication Module (`/api/auth`)

#### 1. Login with VED ID and Password
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "vedId": "VED108",
    "password": "root@123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Root Admin",
      "email": "admin@vedora.com",
      "role": "ADMIN",
      "vedId": "VED108"
    }
  }
  ```

#### 2. Forgot Password (Request OTP)
- **Endpoint:** `POST /api/auth/forgot-password`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "vedId": "VED000001"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Password reset OTP generated (normally sent via email/SMS).",
    "resetToken": "583921"
  }
  ```

#### 3. Reset Password (Submit OTP)
- **Endpoint:** `POST /api/auth/reset-password`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "vedId": "VED000001",
    "resetToken": "583921",
    "newPassword": "NewSecurePassword@123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Password reset successfully"
  }
  ```

---

### 5.2 User & Profile Module (`/api/user`)

#### 1. Get Logged-in User Profile
- **Endpoint:** `GET /api/user`
- **Access:** Authenticated (Any role)
- **Response (200 OK):**
  ```json
  {
    "id": 5,
    "vedId": "VED000010",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "mobile": "9876543210",
    "role": "PARTNER",
    "status": "ACTIVE",
    "createdAt": "2026-10-01T08:00:00.000Z"
  }
  ```

#### 2. Update Basic Profile
- **Endpoint:** `PATCH /api/user`
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "name": "Rahul S. Sharma",
    "email": "newrahul@example.com",
    "mobile": "9876543211"
  }
  ```

#### 3. Change Password
- **Endpoint:** `PATCH /api/user/password`
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "oldPassword": "CurrentPassword@123",
    "newPassword": "NewPassword@123"
  }
  ```

#### 4. Extended Profile Details
- **Get:** `GET /api/user/profile-details`
- **Update:** `PATCH /api/user/profile-details`
- **Request Body:**
  ```json
  {
    "dateOfBirth": "1995-08-15",
    "gender": "MALE",
    "addressLine1": "Flat 402, Sunshine Heights",
    "addressLine2": "FC Road",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411004",
    "profilePhoto": "https://example.com/avatar.jpg"
  }
  ```

#### 5. Bank Accounts & Penny Drop Verification
- **List Banks:** `GET /api/user/bank`
- **Add Bank Account:** `POST /api/user/bank`
  - *Automated Penny Drop:* The backend immediately triggers Cashfree Penny Drop Verification Suite (Sync), transferring ₹1 to the destination bank. It fetches the official registered name from NPCI/Bank, runs fuzzy name matching against the user's name, and returns the result in real-time.
  - *Validation Rules:* IFSC must be 11 characters (e.g. `HDFC0001234`), Account Number must be 9 to 18 digits.
  ```json
  {
    "accountHolderName": "Rahul Sharma",
    "accountNumber": "12345678901234",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0001234",
    "isPrimary": true
  }
  ```
  - **Success Response (201 Created):**
  ```json
  {
    "id": 1,
    "accountHolderName": "Rahul Sharma",
    "accountNumber": "12345678901234",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0001234",
    "isPrimary": true,
    "verificationStatus": "VERIFIED",
    "verifiedName": "RAHUL SHARMA",
    "nameMatchScore": 100,
    "nameMatchResult": "DIRECT",
    "utr": "CF_UTR_9876543210",
    "verificationReferenceId": "CF_REF_123456",
    "verificationFailedReason": null,
    "verifiedAt": "2026-10-02T09:00:00.000Z",
    "createdAt": "2026-10-02T09:00:00.000Z"
  }
  ```
  - **Failure/Mismatch Response (201 Created with REJECTED status):**
  ```json
  {
    "id": 2,
    "accountHolderName": "Different Stranger",
    "accountNumber": "98765432109876",
    "bankName": "ICICI Bank",
    "ifscCode": "ICIC0001234",
    "isPrimary": false,
    "verificationStatus": "REJECTED",
    "verifiedName": "DIFFERENT STRANGER",
    "nameMatchScore": 15,
    "nameMatchResult": "POOR",
    "verificationFailedReason": "Name mismatch: Bank account belongs to 'DIFFERENT STRANGER'. Expected name matching 'Rahul Sharma' (Score: 15% < Threshold: 60%).",
    "verifiedAt": null
  }
  ```
- **Retry / Re-verify Bank:** `POST /api/user/bank/:id/verify`
  - Re-triggers the Penny Drop check for accounts that are `PENDING` or `REJECTED`.
- **Set as Primary:** `PATCH /api/user/bank/:id/primary`
- **Delete Bank:** `DELETE /api/user/bank/:id`
- **[Admin] Manual Bank Verification Override:** `PATCH /api/user/admin/bank/:id/verify` *(Admin only)*
  - Body: `{ "status": "VERIFIED" | "REJECTED", "reason": "Verified via offline cheque" }`
  - Use case: If automatic penny drop fails due to minor spelling discrepancies, admin can review uploaded documents and manually verify the account.

**UI Implementation Checklist for Bank Management:**
1. Show **"Verified" badge (green)** when `verificationStatus === 'VERIFIED'`, displaying Bank UTR as proof of deposit.
2. Show **"Verification Failed / Rejected" badge (red)** with `verificationFailedReason` alert when `verificationStatus === 'REJECTED'`.
3. Provide a **"Verify Again" button** calling `POST /api/user/bank/:id/verify`.
4. Only allow wallet withdrawal selection for accounts with `verificationStatus === 'VERIFIED'`.

#### 6. [Admin] Direct User Management
- **Create User directly:** `POST /api/user` *(Admin only)*
- **Change Status:** `PATCH /api/user/status` *(Admin only - status: PENDING, ACTIVE, INACTIVE, BLOCKED)*
- **Delete User:** `DELETE /api/user` *(Admin only)*

---

### 5.3 Partner & Genealogy Module (`/api/partner`)

#### 1. Public Join under Sponsor Referral Link
Used when a new partner registers via a sponsor's referral URL (e.g. `vedora.com/join?ref=VED000001`).
- **Endpoint:** `POST /api/partner/join`
- **Access:** Public (No token needed)
- **Request Body:**
  ```json
  {
    "referralId": "VED000001",
    "name": "Aniket Patil",
    "email": "aniket@example.com",
    "mobile": "9812345678",
    "password": "Partner@123",
    "dateOfBirth": "1996-05-20",
    "gender": "MALE",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411005"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Partner successfully joined.",
    "partner": {
      "id": 12,
      "vedId": "VED000015",
      "name": "Aniket Patil",
      "email": "aniket@example.com",
      "role": "PARTNER",
      "status": "PENDING",
      "slotNumber": 3,
      "depth": 1,
      "sponsorVedId": "VED000001",
      "sponsorName": "Founder One"
    }
  }
  ```

#### 2. Register Downline Partner from Dashboard
Used by a logged-in partner/founder to register someone directly into their team, with optional manual slot selection (1 to 20).
- **Endpoint:** `POST /api/partner/register-downline`
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "name": "Sneha Kulkarni",
    "email": "sneha@example.com",
    "mobile": "9823456789",
    "password": "Partner@123",
    "slotNumber": 5
  }
  ```

#### 3. View 20 Direct Slots Grid
Returns all 20 direct partner slots for the logged-in user.
- **Endpoint:** `GET /api/partner/my-slots`
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "sponsor": {
      "id": 2,
      "vedId": "VED000001",
      "name": "Founder One",
      "role": "FOUNDER"
    },
    "totalFilled": 3,
    "totalAvailable": 17,
    "maxSlots": 20,
    "filledSlots": [ ... ],
    "slots": [
      { "slotNumber": 1, "isOccupied": true, "partner": { "vedId": "VED000005", "name": "Partner A", ... } },
      { "slotNumber": 2, "isOccupied": true, "partner": { "vedId": "VED000006", "name": "Partner B", ... } },
      { "slotNumber": 3, "isOccupied": false },
      ...
    ]
  }
  ```

#### 4. View My Tree Node & 5-Level Uplines
- **Endpoint:** `GET /api/partner/me/genealogy`
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "user": { "id": 12, "vedId": "VED000015", "name": "Aniket Patil", ... },
    "node": { "depth": 1, "slotNumber": 3, "placementStatus": "ACTIVE", "parent": { ... } },
    "directPartnersCount": 0,
    "maxSlots": 20,
    "directPartners": [],
    "commissionUplines": {
      "level1": { "id": 2, "vedId": "VED000001", "name": "Founder One" },
      "level2": null,
      "level3": null,
      "level4": null,
      "level5": null
    }
  }
  ```

#### 5. [Admin] Inspect Any User's Genealogy
- **Endpoint:** `GET /api/partner/:vedId/genealogy`
- **Access:** Admin only (`@Roles('ADMIN')`)

---

### 5.4 Product Module (`/api/product`)

#### 1. List Products
- **Endpoint:** `GET /api/product`
- **Access:** Authenticated (Partners & Admins)
- **Response (200 OK):** Array of `Product` objects.

#### 2. Get Product by ID
- **Endpoint:** `GET /api/product/:id`
- **Access:** Authenticated

#### 3. [Admin] Product Management
- **Create Product:** `POST /api/product` *(Admin only)*
  ```json
  {
    "name": "Vedora Health Supplement",
    "description": "Organic vitality booster",
    "mrp": 1500,
    "salePrice": 1200,
    "bvAmount": 500,
    "status": "ACTIVE"
  }
  ```
- **Update Product:** `PATCH /api/product/:id` *(Admin only)*
- **Delete Product:** `DELETE /api/product/:id` *(Admin only)*

---

### 5.5 Order & Checkout Module (`/api/order`)

#### 1. Create Order (Checkout)
- **Endpoint:** `POST /api/order`
- **Access:** Authenticated (Partner)
- **Request Body:**
  ```json
  {
    "productId": 1,
    "quantity": 2,
    "paymentMethod": "PHONEPE"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Order created. Proceed with payment.",
    "order": {
      "id": 18,
      "productName": "Vedora Health Supplement",
      "quantity": 2,
      "unitPrice": 1200,
      "totalAmount": 240000,
      "totalAmountFormatted": "₹2400.00",
      "bvTotal": 1000,
      "paymentMethod": "PHONEPE",
      "paymentStatus": "PENDING",
      "orderStatus": "PENDING",
      "createdAt": "2026-10-01T08:30:00.000Z"
    }
  }
  ```

#### 2. List My Orders
- **Endpoint:** `GET /api/order`
- **Access:** Authenticated

#### 3. Get Order Details & Breakdown
- **Endpoint:** `GET /api/order/:id`
- **Access:** Authenticated (Partners view own orders; Admins can view any)

#### 4. [Admin] Create Cash Order
Creates an offline order and automatically triggers instant 5-level commission distribution to upline wallets.
- **Endpoint:** `POST /api/order/admin/cash` *(Admin only)*
- **Request Body:**
  ```json
  {
    "userId": 12,
    "productId": 1,
    "quantity": 1
  }
  ```

#### 5. [Admin] List All Orders
- **Endpoint:** `GET /api/order/admin/all` *(Admin only)*

---

### 5.6 Wallet & Withdrawal Module (`/api/wallet`)

#### 1. Get Wallet Summary
- **Endpoint:** `GET /api/wallet`
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "availableBalance": 250000,
    "availableBalanceFormatted": "₹2,500.00",
    "lockedBalance": 50000,
    "lockedBalanceFormatted": "₹500.00",
    "totalEarned": 300000,
    "totalEarnedFormatted": "₹3,000.00",
    "totalWithdrawn": 0,
    "totalWithdrawnFormatted": "₹0.00"
  }
  ```

#### 2. Get Transaction History (Paginated)
- **Endpoint:** `GET /api/wallet/transactions`
- **Access:** Authenticated
- **Query Params:**
  - `page`: default `1`
  - `limit`: default `20`
  - `type`: `CREDIT` | `DEBIT` (optional)
  - `category`: `COMMISSION_DIRECT`, `COMMISSION_LEVEL_1`, etc. (optional)
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 42,
        "type": "CREDIT",
        "category": "COMMISSION_DIRECT",
        "amount": 20000,
        "amountFormatted": "₹200.00",
        "balanceAfter": 250000,
        "balanceAfterFormatted": "₹2,500.00",
        "referenceType": "ORDER",
        "referenceId": "18",
        "description": "Level 0 commission from order #18 (Direct Referral Bonus ₹200)",
        "createdAt": "2026-10-01T08:35:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

#### 3. Request Payout Withdrawal
- **Endpoint:** `POST /api/wallet/withdraw`
- **Access:** Authenticated
- **Rule:** Bank account MUST be `VERIFIED`. Minimum amount is ₹100.
- **Request Body:**
  ```json
  {
    "amount": 500,
    "bankId": 2
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Withdrawal request submitted successfully.",
    "withdrawal": {
      "id": 7,
      "amount": 500,
      "amountFormatted": "₹500.00",
      "status": "PENDING",
      "bank": {
        "bankName": "HDFC Bank",
        "accountNumber": "****1234",
        "ifscCode": "HDFC0001234"
      },
      "createdAt": "2026-10-01T08:40:00.000Z"
    }
  }
  ```

#### 4. My Withdrawal Requests History
- **Endpoint:** `GET /api/wallet/withdrawals`
- **Access:** Authenticated

#### 5. [Admin] Withdrawals Management
- **List All Pending Withdrawals:** `GET /api/wallet/admin/withdrawals?status=PENDING` *(Admin only)*
- **Approve Withdrawal:** `PATCH /api/wallet/admin/withdrawal/:id/approve` *(Admin only)*
- **Reject Withdrawal:** `PATCH /api/wallet/admin/withdrawal/:id/reject` *(Admin only)*
  ```json
  {
    "remarks": "Bank account name does not match KYC documents."
  }
  ```

---

### 5.7 PhonePe Payment Module (`/api/payment`)

#### 1. Initiate PhonePe Payment
- **Endpoint:** `POST /api/payment/initiate/:orderId`
- **Access:** Authenticated
- **Response (201 Created):**
  ```json
  {
    "message": "Payment initiated. Redirect the user to the provided URL.",
    "redirectUrl": "https://mercury-t2.phonepe.com/transact/pg?token=...",
    "merchantOrderId": "VEDORA_18_1759312345",
    "orderId": 18
  }
  ```

#### 2. Manual Payment Status Check (Polling)
- **Endpoint:** `GET /api/payment/status/:merchantOrderId`
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "message": "Payment confirmed. Order processed successfully.",
    "orderId": 18,
    "paymentStatus": "PAID",
    "orderStatus": "CONFIRMED"
  }
  ```

#### 3. PhonePe Redirect Callback
- **Endpoint:** `GET /api/payment/callback?merchantOrderId=...`
- **Access:** Public (Invoked when PhonePe redirects back to frontend).

---

## 6. Complete PhonePe Checkout Flow (Step-by-Step)

```text
[1. User Clicks Buy] -> [2. FE calls POST /api/order] -> [3. FE calls POST /api/payment/initiate/:orderId]
                                                                        |
                                                                        v
[5. User completes UPI/Card on PhonePe] <- [4. FE redirects: window.location.href = redirectUrl]
              |
              +---> [PhonePe sends Webhook to Backend -> Backend confirms order & distributes commission]
              |
              v
[6. PhonePe redirects browser to /payment/status?merchantOrderId=...]
              |
              v
[7. FE calls GET /api/payment/status/:merchantOrderId -> Shows Success Screen!]
```

### Frontend Implementation Snippet:

```typescript
// features/checkout/api.ts
import { api } from '@/lib/api';

export async function checkoutAndPay(productId: number, quantity: number = 1) {
  // 1. Create order
  const { data: orderData } = await api.post('/order', {
    productId,
    quantity,
    paymentMethod: 'PHONEPE',
  });

  const orderId = orderData.order.id;

  // 2. Initiate PhonePe payment
  const { data: paymentData } = await api.post(`/payment/initiate/${orderId}`);

  // 3. Redirect to PhonePe hosted checkout
  if (paymentData.redirectUrl) {
    window.location.href = paymentData.redirectUrl;
  }
}
```

```typescript
// pages/PaymentStatusPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

export function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const merchantOrderId = searchParams.get('merchantOrderId');
  const [status, setStatus] = useState<'LOADING' | 'PAID' | 'FAILED'>('LOADING');

  useEffect(() => {
    if (!merchantOrderId) return;

    api.get(`/payment/status/${merchantOrderId}`)
      .then((res) => {
        if (res.data.paymentStatus === 'PAID') {
          setStatus('PAID');
        } else {
          setStatus('FAILED');
        }
      })
      .catch(() => setStatus('FAILED'));
  }, [merchantOrderId]);

  if (status === 'LOADING') return <div>Verifying your payment, please wait...</div>;
  if (status === 'PAID') return <div>🎉 Payment Successful! Your order has been confirmed.</div>;
  return <div>❌ Payment could not be confirmed. Please check your order history.</div>;
}
```

---

## 7. Error Handling & HTTP Status Codes

When an error occurs, the backend returns standard NestJS error payloads:

```json
{
  "statusCode": 400,
  "message": "Minimum withdrawal amount is ₹100.",
  "error": "Bad Request"
}
```

### Common Status Codes:
- **`200 OK`**: Request succeeded (GET, PATCH, DELETE).
- **`201 Created`**: Resource created successfully (POST).
- **`400 Bad Request`**: Validation failure (e.g. invalid IFSC code, withdrawal amount < ₹100, sponsor reached 20-partner limit).
- **`401 Unauthorized`**: Missing or expired JWT token. Redirect user to `/login`.
- **`403 Forbidden`**: Insufficient permissions (e.g. Partner accessing an Admin endpoint). Display "Access Denied".
- **`404 Not Found`**: Resource does not exist (e.g. wrong ID, sponsor referral code not found).
- **`409 Conflict`**: Duplicate field (e.g. email or mobile already registered).
- **`500 Internal Server Error`**: Unexpected server issue or PhonePe gateway unconfigured.

### Helper for Displaying Error Messages in UI:
```typescript
export function getApiErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  return error.message || 'Something went wrong. Please try again.';
}
```

---

## 8. Development Credentials for Testing

Use these pre-seeded accounts in local development to test different user journeys:

| Role | VED ID | Password | Notes |
|---|---|---|---|
| **Root Admin** | `VED108` | `root@123` | Can access all admin endpoints, create cash orders, approve withdrawals. |
| **Founder 1** | `VED000001` | `founder@123` | Referral sponsor code `VED000001` for new partner joins. |
| **Founder 2** | `VED000002` | `founder@123` | Secondary sponsor with active wallet. |
| **Founder 3** | `VED000003` | `founder@123` | Additional founder node. |

---

### Questions or Support
- Check the live Swagger docs at **`http://localhost:8000/api/docs`** for interactive testing.
- Run `pnpm run test:apis` in the `Backend` directory to verify backend health.
