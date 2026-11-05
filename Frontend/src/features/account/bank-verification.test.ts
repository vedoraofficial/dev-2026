import { describe, expect, it } from "vitest"

import { formatBankVerificationResult } from "./queries"
import type { Bank } from "./types"

describe("Bank Verification Status Messaging (Penny Drop)", () => {
  const baseBank: Bank = {
    id: 1,
    accountHolderName: "Rohit Sharma",
    accountNumber: "123456789012",
    bankName: "HDFC Bank",
    ifscCode: "HDFC0001234",
    verificationStatus: "VERIFIED",
    isPrimary: true,
    createdAt: "2026-10-25T10:00:00Z",
  }

  it("Scenario 6: VERIFIED status displays explicit verified message with withdrawal eligibility", () => {
    const verifiedBank: Bank = {
      ...baseBank,
      verificationStatus: "VERIFIED",
      verifiedName: "ROHIT SHARMA",
      nameMatchScore: 100,
    }
    const message = formatBankVerificationResult(verifiedBank)
    expect(message).toContain("HDFC Bank ****9012 verified via RazorpayX penny drop")
    expect(message).toContain("you can withdraw to it")
  })

  it("Scenario 7: PENDING status explicitly states verification is in progress (never claims verified)", () => {
    const pendingBank: Bank = {
      ...baseBank,
      verificationStatus: "PENDING",
      verifiedName: null,
      nameMatchScore: null,
    }
    const message = formatBankVerificationResult(pendingBank)
    expect(message).toContain("Penny Drop verification is in progress")
    expect(message).not.toContain("verified successfully")
    expect(message).not.toContain("you can withdraw to it")
  })

  it("Scenario 8: REJECTED status includes the failure reason", () => {
    const rejectedBank: Bank = {
      ...baseBank,
      verificationStatus: "REJECTED",
      verificationFailedReason: "Beneficiary name mismatch (score: 12%)",
    }
    const message = formatBankVerificationResult(rejectedBank)
    expect(message).toContain("Bank couldn't be verified")
    expect(message).toContain("Beneficiary name mismatch")
    expect(message).not.toContain("verified successfully")
  })

  it("Scenario 9: Null or unknown status displays truthful neutral fallback", () => {
    expect(formatBankVerificationResult(null)).toBe("Bank account submitted")
    expect(formatBankVerificationResult({ ...baseBank, verificationStatus: "UNKNOWN" as any })).toBe(
      "Bank account details saved",
    )
  })
})
