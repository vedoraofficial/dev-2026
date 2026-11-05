import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  openRazorpayCheckout,
  readPendingPayment,
  savePendingPayment,
  type InitiatePaymentResponse,
  type VerifyPaymentResponse,
} from "./api"
import { PaymentCancelledError, PaymentFailedError, isPaymentCancelled, isPaymentFailed } from "@/lib/errors"

describe("Razorpay Checkout Lifecycle & Lifecycle Security", () => {
  const dummyInitiate: InitiatePaymentResponse = {
    message: "Initiated",
    keyId: "rzp_test_12345",
    amount: 100000,
    currency: "INR",
    orderId: "order_test_999",
    merchantOrderId: "order_test_999",
    redirectUrl: "/payment/status?merchantOrderId=order_test_999",
  }

  let capturedOptions: any = null
  let mockRzpInstance: any = null

  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    capturedOptions = null

    mockRzpInstance = {
      open: vi.fn(),
      on: vi.fn(),
    }

    // Mock window.Razorpay constructor
    ;(window as any).Razorpay = vi.fn(function (opts: any) {
      capturedOptions = opts
      return mockRzpInstance
    })
  })

  it("Scenario 1: Successful checkout and backend verification confirms payment and clears pending state", async () => {
    savePendingPayment({ merchantOrderId: "order_test_999", type: "TOPUP", amount: 100000 })
    expect(readPendingPayment()?.merchantOrderId).toBe("order_test_999")

    const onSuccess = vi.fn()
    const onError = vi.fn()
    const onDismiss = vi.fn()
    const mockVerify = vi.fn().mockResolvedValue({
      message: "Payment verified successfully",
      paymentStatus: "PAID",
      status: "COMPLETED",
    } as VerifyPaymentResponse)

    const promise = openRazorpayCheckout({
      initiateData: dummyInitiate,
      onSuccess,
      onError,
      onDismiss,
      verify: mockVerify,
    })

    expect((window as any).Razorpay).toHaveBeenCalled()
    expect(mockRzpInstance.open).toHaveBeenCalled()

    // Trigger checkout handler callback
    await capturedOptions.handler({
      razorpay_order_id: "order_test_999",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "sig_abc",
    })

    const result = await promise
    expect(result.paymentStatus).toBe("PAID")
    expect(mockVerify).toHaveBeenCalledWith({
      razorpayOrderId: "order_test_999",
      razorpayPaymentId: "pay_123",
      razorpaySignature: "sig_abc",
    })
    expect(onSuccess).toHaveBeenCalledWith(result)
    expect(onError).not.toHaveBeenCalled()
    expect(onDismiss).not.toHaveBeenCalled()
    // Authoritative confirmation clears pending session payment
    expect(readPendingPayment()).toBeNull()
  })

  it("Scenario 2: Modal dismissal without payment rejects with PaymentCancelledError and never reports success", async () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const onDismiss = vi.fn()

    const promise = openRazorpayCheckout({
      initiateData: dummyInitiate,
      onSuccess,
      onError,
      onDismiss,
    })

    // User closes checkout popup without paying
    capturedOptions.modal.ondismiss()

    await expect(promise).rejects.toThrow(PaymentCancelledError)
    await expect(promise).rejects.toSatisfy((err) => isPaymentCancelled(err))
    expect(onDismiss).toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it("Scenario 3: Razorpay payment.failed event followed by modal dismissal rejects with PaymentFailedError", async () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const onDismiss = vi.fn()

    const promise = openRazorpayCheckout({
      initiateData: dummyInitiate,
      onSuccess,
      onError,
      onDismiss,
    })

    // Find the payment.failed handler registered on rzp.on()
    const failedCallback = mockRzpInstance.on.mock.calls.find(
      (call: any[]) => call[0] === "payment.failed",
    )?.[1]
    expect(failedCallback).toBeDefined()

    // Simulate gateway failure event
    failedCallback({ error: { description: "Card declined by bank" } })

    // User subsequently closes the failure dialog
    capturedOptions.modal.ondismiss()

    await expect(promise).rejects.toThrow(PaymentFailedError)
    await expect(promise).rejects.toSatisfy((err) => isPaymentFailed(err))
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(expect.any(PaymentFailedError))
  })

  it("Scenario 4: Backend signature verification failure rejects and does not mark success", async () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const mockVerify = vi.fn().mockRejectedValue(new Error("Invalid payment signature"))

    const promise = openRazorpayCheckout({
      initiateData: dummyInitiate,
      onSuccess,
      onError,
      verify: mockVerify,
    })

    await capturedOptions.handler({
      razorpay_order_id: "order_test_999",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "bad_sig",
    })

    await expect(promise).rejects.toThrow("Invalid payment signature")
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it("Scenario 5: Missing Razorpay SDK rejects with AppError immediately", async () => {
    delete (window as any).Razorpay
    const onError = vi.fn()

    await expect(
      openRazorpayCheckout({
        initiateData: dummyInitiate,
        onSuccess: vi.fn(),
        onError,
      }),
    ).rejects.toThrow(/Razorpay SDK is not loaded/)
    expect(onError).toHaveBeenCalled()
  })

  it("Scenario 6: Duplicate callbacks or dismissal after success cannot trigger duplicate success or cancellation", async () => {
    const onSuccess = vi.fn()
    const onError = vi.fn()
    const onDismiss = vi.fn()
    const mockVerify = vi.fn().mockResolvedValue({
      message: "Verified",
      paymentStatus: "PAID",
      status: "COMPLETED",
    } as VerifyPaymentResponse)

    const promise = openRazorpayCheckout({
      initiateData: dummyInitiate,
      onSuccess,
      onError,
      onDismiss,
      verify: mockVerify,
    })

    // First handler call completes verification
    await capturedOptions.handler({
      razorpay_order_id: "order_test_999",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "good_sig",
    })

    // Simulate modal dismissal firing after payment completion (standard Razorpay UI behavior)
    capturedOptions.modal.ondismiss()

    // Simulate duplicate handler call (e.g. repeated postMessage / re-entry)
    await capturedOptions.handler({
      razorpay_order_id: "order_test_999",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "good_sig",
    })

    const result = await promise
    expect(result.paymentStatus).toBe("PAID")
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onDismiss).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
