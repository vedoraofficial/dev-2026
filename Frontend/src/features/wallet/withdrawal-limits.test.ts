import { describe, expect, it } from "vitest"

import type { Withdrawal } from "./types"

describe("Withdrawal Rules, Limits, and Data Contracts", () => {
  const MIN_WITHDRAWAL = 100
  const MAX_WITHDRAWAL = 500000

  function validateWithdrawalInput(amount: number, balance: number, bankId?: number | null) {
    if (!bankId) return { valid: false, error: "Please select a bank account" }
    if (isNaN(amount) || amount <= 0) return { valid: false, error: "Invalid withdrawal amount" }
    if (amount < MIN_WITHDRAWAL) return { valid: false, error: `Minimum withdrawal is ₹${MIN_WITHDRAWAL}` }
    if (amount > MAX_WITHDRAWAL) return { valid: false, error: `Maximum single withdrawal is ₹${MAX_WITHDRAWAL}` }
    if (amount > balance) return { valid: false, error: "Amount exceeds available balance" }
    return { valid: true }
  }

  it("Scenario 15: Rejects amounts below minimum limit (₹100)", () => {
    expect(validateWithdrawalInput(50, 1000, 1).valid).toBe(false)
    expect(validateWithdrawalInput(99, 1000, 1).valid).toBe(false)
  })

  it("Scenario 16: Rejects amounts above maximum limit (₹5,00,000) even with high balance", () => {
    expect(validateWithdrawalInput(500001, 1000000, 1).valid).toBe(false)
    expect(validateWithdrawalInput(500000, 1000000, 1).valid).toBe(true)
  })

  it("Scenario 17: Rejects amounts exceeding available balance", () => {
    expect(validateWithdrawalInput(5000, 2000, 1).valid).toBe(false)
    expect(validateWithdrawalInput(2000, 2000, 1).valid).toBe(true)
  })

  it("Scenario 18: Rejects requests without a selected bank account", () => {
    expect(validateWithdrawalInput(500, 2000, null).valid).toBe(false)
  })

  it("Scenario 19: Withdrawal contract allows optional payoutId and utr", () => {
    const withdrawal: Withdrawal = {
      id: 101,
      amount: 50000,
      amountFormatted: "₹500.00",
      status: "COMPLETED",
      bank: { bankName: "HDFC", accountNumber: "****1234", ifscCode: "HDFC0001234" },
      adminRemarks: "Processed via RazorpayX",
      payoutId: "pout_1234567890",
      utr: "CMS123456789",
      processedAt: "2026-10-25T11:00:00Z",
      createdAt: "2026-10-25T10:00:00Z",
    }
    expect(withdrawal.payoutId).toBe("pout_1234567890")
    expect(withdrawal.utr).toBe("CMS123456789")
  })
})
