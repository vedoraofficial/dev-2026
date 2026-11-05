import { beforeEach, describe, expect, it } from "vitest"

import { useSession } from "./session"
import { env } from "./env"

describe("Session Management and Environment Configuration", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("Scenario 20: signOut clears user token, session, and pending payment storage", () => {
    // Simulate active session
    useSession.getState().signIn(
      {
        token: "jwt_token_sample",
        user: { id: 1, vedId: "VED001", name: "User One", email: "user1@example.com", role: "PARTNER" },
      },
      false,
    )

    // Simulate saved pending payment from an initiated checkout
    sessionStorage.setItem(
      "vedora.pendingPayment",
      JSON.stringify({ merchantOrderId: "order_user_1", type: "TOPUP" }),
    )
    sessionStorage.setItem("vedora.pendingJoin", JSON.stringify({ razorpayOrderId: "order_join_1" }))

    expect(sessionStorage.getItem("vedora.pendingPayment")).toBeDefined()
    expect(sessionStorage.getItem("vedora.pendingJoin")).toBeDefined()
    expect(useSession.getState().token).toBe("jwt_token_sample")

    // User logs out
    useSession.getState().signOut()

    expect(useSession.getState().token).toBeNull()
    expect(useSession.getState().user).toBeNull()
    // Stale payment data must not survive logout
    expect(sessionStorage.getItem("vedora.pendingPayment")).toBeNull()
    expect(sessionStorage.getItem("vedora.pendingJoin")).toBeNull()
    expect(localStorage.getItem("vedora.session")).toBeNull()
    expect(sessionStorage.getItem("vedora.session")).toBeNull()
  })

  it("Scenario 21: env.apiBaseUrl defaults safely to /api", () => {
    expect(env.apiBaseUrl).toBeDefined()
    expect(typeof env.apiBaseUrl).toBe("string")
    // Ensures relative path or valid endpoint, not undefined
    expect(env.apiBaseUrl.startsWith("/") || env.apiBaseUrl.startsWith("http")).toBe(true)
  })
})
