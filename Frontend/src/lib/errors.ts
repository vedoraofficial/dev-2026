/**
 * An error whose message is written for the user (e.g. "Choose a photo smaller than 10 MB").
 * `apiErrorMessage` shows it as it is; any other non-API error gets the generic fallback.
 */
export class AppError extends Error {
  override name = "AppError"
}

export class PaymentCancelledError extends AppError {
  override name = "PaymentCancelledError"
  constructor(message = "Payment cancelled — no money was deducted.") {
    super(message)
  }
}

export class PaymentFailedError extends AppError {
  override name = "PaymentFailedError"
  constructor(message = "Payment failed at gateway.") {
    super(message)
  }
}

export function isPaymentCancelled(err: unknown): err is PaymentCancelledError {
  return (
    err instanceof PaymentCancelledError ||
    (err instanceof Error && err.name === "PaymentCancelledError")
  )
}
export function isPaymentFailed(err: unknown): err is PaymentFailedError {
  return (
    err instanceof PaymentFailedError ||
    (err instanceof Error && err.name === "PaymentFailedError")
  )
}
