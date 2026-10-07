/**
 * An error whose message is written for the user (e.g. "Choose a photo smaller than 10 MB").
 * `apiErrorMessage` shows it as it is; any other non-API error gets the generic fallback.
 */
export class AppError extends Error {
  override name = "AppError"
}
