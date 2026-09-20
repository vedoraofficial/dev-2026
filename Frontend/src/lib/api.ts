import axios from "axios"

import { env } from "@/lib/env"

/**
 * The one axios instance for all backend calls.
 * Never call axios/fetch directly from components — write a function in
 * `features/<name>/api.ts` that uses this client.
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
})
