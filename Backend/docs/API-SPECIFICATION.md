# VEDORA Backend — API Specification

This document provides a comprehensive REST API specification for all endpoints implemented in the VEDORA Backend.

- **Base URL:** `http://localhost:8000/api`
- **Swagger Documentation:** `http://localhost:8000/api/docs`
- **Authentication:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`

---

## 1. Authentication Module (`/api/auth`)

### 1.1 Login
- **Method / Route:** `POST /api/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "vedId": "string (e.g. VED108)",
    "password": "string (min 6 chars)"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "access_token": "string (JWT)",
    "user": {
      "id": 1,
      "name": "Root Admin",
      "email": "admin@vedora.com",
      "role": "ADMIN",
      "vedId": "VED108"
    }
  }
  ```

### 1.2 Request Password Reset OTP
- **Method / Route:** `POST /api/auth/forgot-password`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "vedId": "string"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Password reset OTP generated (normally sent via email/SMS).",
    "resetToken": "6-digit OTP string"
  }
  ```

### 1.3 Submit Password Reset
- **Method / Route:** `POST /api/auth/reset-password`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "vedId": "string",
    "resetToken": "string (6-digit OTP)",
    "newPassword": "string (min 6 chars)"
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

## 2. User & Profile Module (`/api/user`)

### 2.1 Get Current User Profile
- **Method / Route:** `GET /api/user`
- **Auth:** Bearer JWT (Any Role)
- **Response (200 OK):**
  ```json
  {
    "id": 5,
    "vedId": "VED000004",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "mobile": "9876543210",
    "role": "PARTNER",
    "status": "ACTIVE",
    "createdAt": "2026-10-01T08:00:00.000Z"
  }
  ```

### 2.2 Update Profile Info
- **Method / Route:** `PATCH /api/user`
- **Auth:** Bearer JWT
- **Request Body:**
  ```json
  {
    "name": "optional string",
    "email": "optional string",
    "mobile": "optional string"
  }
  ```

### 2.3 Change Password
- **Method / Route:** `PATCH /api/user/password`
- **Auth:** Bearer JWT
- **Request Body:**
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"
  }
  ```

### 2.4 Extended Profile Details
- **Get Details:** `GET /api/user/profile-details` (Bearer JWT)
- **Update Details:** `PATCH /api/user/profile-details` (Bearer JWT)
  ```json
  {
    "dateOfBirth": "YYYY-MM-DD",
    "gender": "MALE | FEMALE | OTHER",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "profilePhoto": "URL string"
  }
  ```

### 2.5 Bank Accounts & Penny Drop Verification
- **List Banks:** `GET /api/user/bank` (Bearer JWT)
- **Add Bank:** `POST /api/user/bank` (Bearer JWT)
  - *Behavior:* Immediately triggers **Cashfree Penny Drop Verification Suite (Sync)** with ₹1 IMPS deposit. Pre-validates 11-char IFSC format and 9-18 digit account numbers. Computes fuzzy name matching score between user name and bank-registered account holder name. If score >= 60%, automatically marks account as `VERIFIED` with bank UTR and timestamp. If invalid or mismatched, marks account as `REJECTED` with detailed `verificationFailedReason`.
  ```json
  {
    "accountHolderName": "Rahul Sharma",
    "accountNumber": "11223344556677",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0001234",
    "isPrimary": true
  }
  ```
  - **Response (201 Created):**
  ```json
  {
    "id": 1,
    "accountHolderName": "Rahul Sharma",
    "accountNumber": "11223344556677",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0001234",
    "isPrimary": true,
    "verificationStatus": "VERIFIED",
    "verifiedName": "RAHUL SHARMA",
    "nameMatchScore": 100,
    "nameMatchResult": "DIRECT",
    "utr": "CF_UTR_1234567890",
    "verificationReferenceId": "CF_REF_987654",
    "verificationFailedReason": null,
    "verifiedAt": "2026-10-02T09:00:00.000Z",
    "createdAt": "2026-10-02T09:00:00.000Z"
  }
  ```
- **Re-verify Bank:** `POST /api/user/bank/:id/verify` (Bearer JWT)
  - Triggers on-demand Penny Drop re-verification for accounts currently marked `PENDING` or `REJECTED`.
- **Set Primary:** `PATCH /api/user/bank/:id/primary` (Bearer JWT)
- **Delete Bank:** `DELETE /api/user/bank/:id` (Bearer JWT)
- **[Admin] Manual Bank Verification Override:** `PATCH /api/user/admin/bank/:id/verify` (Bearer JWT + `@Roles('ADMIN')`)
  - Enables administrators to manually approve or reject a user bank account (e.g. for offline cancelled cheque review).
  ```json
  {
    "status": "VERIFIED",
    "reason": "Verified manually via cancelled cheque copy"
  }
  ```

### 2.6 Admin User Management
- **Direct User Creation:** `POST /api/user` (Bearer JWT + `@Roles('ADMIN')`)
  ```json
  {
    "name": "string",
    "email": "string",
    "mobile": "string",
    "password": "string"
  }
  ```
- **Change Status:** `PATCH /api/user/status` (Bearer JWT + `@Roles('ADMIN')`)
  ```json
  {
    "status": "PENDING | ACTIVE | INACTIVE | BLOCKED"
  }
  ```
- **Delete Account:** `DELETE /api/user` (Bearer JWT + `@Roles('ADMIN')`)

---

## 3. Partner & Genealogy Module (`/api/partner`)

### 3.1 Public Join under Referral Sponsor
- **Method / Route:** `POST /api/partner/join`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "referralId": "VED000001",
    "name": "string",
    "email": "string",
    "mobile": "string",
    "password": "string",
    "dateOfBirth": "YYYY-MM-DD (optional)",
    "gender": "MALE | FEMALE | OTHER (optional)",
    "addressLine1": "string (optional)",
    "city": "string (optional)",
    "state": "string (optional)",
    "pincode": "string (optional)"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "Partner successfully joined.",
    "partner": {
      "id": 10,
      "vedId": "VED000004",
      "name": "string",
      "role": "PARTNER",
      "status": "PENDING",
      "slotNumber": 1,
      "depth": 1,
      "sponsorVedId": "VED000001"
    }
  }
  ```

### 3.2 Register Downline by Sponsor
- **Method / Route:** `POST /api/partner/register-downline`
- **Auth:** Bearer JWT (Sponsor user)
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "mobile": "string",
    "password": "string",
    "slotNumber": 3
  }
  ```

### 3.3 View 20 Slots Grid
- **Method / Route:** `GET /api/partner/my-slots`
- **Auth:** Bearer JWT

### 3.4 View My Tree & Uplines
- **Method / Route:** `GET /api/partner/me/genealogy`
- **Auth:** Bearer JWT

### 3.5 [Admin] View Any User's Genealogy
- **Method / Route:** `GET /api/partner/:vedId/genealogy`
- **Auth:** Bearer JWT + `@Roles('ADMIN')`

---

## 4. Product Module (`/api/product`)

### 4.1 Browse Products
- **List All Products:** `GET /api/product` (Bearer JWT)
- **Get Product Details:** `GET /api/product/:id` (Bearer JWT)

### 4.2 [Admin] Manage Products
- **Create Product:** `POST /api/product` (Bearer JWT + `@Roles('ADMIN')`)
  ```json
  {
    "name": "string",
    "description": "string (optional)",
    "mrp": 1500,
    "salePrice": 1200,
    "bvAmount": 500,
    "status": "ACTIVE"
  }
  ```
- **Update Product:** `PATCH /api/product/:id` (Bearer JWT + `@Roles('ADMIN')`)
- **Delete Product:** `DELETE /api/product/:id` (Bearer JWT + `@Roles('ADMIN')`)

---

## 5. Order Module (`/api/order`)

### 5.1 Place Online Order
- **Method / Route:** `POST /api/order`
- **Auth:** Bearer JWT
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
      "productName": "string",
      "quantity": 2,
      "unitPrice": 1200,
      "totalAmount": 240000,
      "totalAmountFormatted": "₹2400.00",
      "bvTotal": 1000,
      "paymentMethod": "PHONEPE",
      "paymentStatus": "PENDING",
      "orderStatus": "PENDING"
    }
  }
  ```

### 5.2 List My Orders
- **Method / Route:** `GET /api/order`
- **Auth:** Bearer JWT

### 5.3 Order Details
- **Method / Route:** `GET /api/order/:id`
- **Auth:** Bearer JWT

### 5.4 [Admin] Create Cash Order
- **Method / Route:** `POST /api/order/admin/cash`
- **Auth:** Bearer JWT + `@Roles('ADMIN')`
- **Request Body:**
  ```json
  {
    "userId": 5,
    "productId": 1,
    "quantity": 1
  }
  ```

### 5.5 [Admin] List All Orders
- **Method / Route:** `GET /api/order/admin/all`
- **Auth:** Bearer JWT + `@Roles('ADMIN')`

---

## 6. Wallet Module (`/api/wallet`)

### 6.1 Wallet Summary
- **Method / Route:** `GET /api/wallet`
- **Auth:** Bearer JWT

### 6.2 Transaction History
- **Method / Route:** `GET /api/wallet/transactions?page=1&limit=20&type=CREDIT&category=COMMISSION_DIRECT`
- **Auth:** Bearer JWT

### 6.3 Request Withdrawal
- **Method / Route:** `POST /api/wallet/withdraw`
- **Auth:** Bearer JWT
- **Request Body:**
  ```json
  {
    "amount": 500,
    "bankId": 2
  }
  ```

### 6.4 My Withdrawals History
- **Method / Route:** `GET /api/wallet/withdrawals`
- **Auth:** Bearer JWT

### 6.5 [Admin] Withdrawals Queue & Actions
- **List All:** `GET /api/wallet/admin/withdrawals?status=PENDING` (Bearer JWT + `@Roles('ADMIN')`)
- **Approve:** `PATCH /api/wallet/admin/withdrawal/:id/approve` (Bearer JWT + `@Roles('ADMIN')`)
- **Reject:** `PATCH /api/wallet/admin/withdrawal/:id/reject` (Bearer JWT + `@Roles('ADMIN')`)
  ```json
  {
    "remarks": "Reason for rejection"
  }
  ```

---

## 7. Payment Module (`/api/payment`)

### 7.1 Initiate PhonePe Payment
- **Method / Route:** `POST /api/payment/initiate/:orderId`
- **Auth:** Bearer JWT
- **Response (201 Created):**
  ```json
  {
    "message": "Payment initiated. Redirect the user to the provided URL.",
    "redirectUrl": "https://mercury-t2.phonepe.com/transact/pg?token=...",
    "merchantOrderId": "VEDORA_18_1759312345",
    "orderId": 18
  }
  ```

### 7.2 Manual Status Polling
- **Method / Route:** `GET /api/payment/status/:merchantOrderId`
- **Auth:** Bearer JWT

### 7.3 Redirect Callback
- **Method / Route:** `GET /api/payment/callback?merchantOrderId=...`
- **Auth:** Public

### 7.4 Server-to-Server Webhook
- **Method / Route:** `POST /api/payment/webhook`
- **Auth:** Public (PhonePe S2S)

---

## 8. In-App Notifications Module (`/api/notifications`)

### 8.1 Get User Notifications
- **Method / Route:** `GET /api/notifications`
- **Auth:** Bearer JWT (All authenticated users)
- **Query Parameters:**
  - `page` (optional, default: 1)
  - `limit` (optional, default: 20)
  - `unreadOnly` (optional boolean, default: false)
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 105,
        "key": "COMMISSION_CREDITED",
        "title": "₹200 commission credited",
        "message": "From Rohan's order #12 · Direct ₹200. Wallet balance: ₹1,450.00.",
        "metadata": { "orderId": 12, "totalPaise": 20000, "breakdown": "Direct ₹200" },
        "isRead": false,
        "readAt": null,
        "createdAt": "2026-10-02T04:12:00.000Z"
      }
    ],
    "total": 1,
    "unreadCount": 1,
    "page": 1,
    "limit": 20
  }
  ```

### 8.2 Get Unread Notifications Count
- **Method / Route:** `GET /api/notifications/unread-count`
- **Auth:** Bearer JWT (All authenticated users)
- **Purpose:** Fast polling or header bell-icon badge display.
- **Response (200 OK):**
  ```json
  {
    "unreadCount": 3
  }
  ```

### 8.3 Mark Single Notification as Read
- **Method / Route:** `PATCH /api/notifications/:id/read`
- **Auth:** Bearer JWT
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "notification": {
      "id": 105,
      "isRead": true,
      "readAt": "2026-10-02T04:15:30.000Z"
    }
  }
  ```

### 8.4 Mark All Notifications as Read
- **Method / Route:** `PATCH /api/notifications/read-all`
- **Auth:** Bearer JWT
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 3
  }
  ```

### 8.5 Admin: Broadcast System Announcement
- **Method / Route:** `POST /api/notifications/announcement`
- **Auth:** Bearer JWT (`ADMIN` only)
- **Request Body:**
  ```json
  {
    "title": "Important Platform Update",
    "message": "Commission payouts for September have been processed.",
    "target": "ALL_PARTNERS" // or "FOUNDER_TEAM"
    // "founderVedId": "VED000001" (required if target is "FOUNDER_TEAM")
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Announcement broadcasted successfully",
    "recipientCount": 42
  }
  ```

