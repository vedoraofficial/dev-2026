import { z } from "zod"

/** VEDORA IDs look like VED108 (Admin), VED000001 (Founder) or VED000418 (Partner). */
export const loginSchema = z.object({
  vedoraId: z
    .string()
    .trim()
    .min(1, "Enter your VEDORA ID")
    .regex(/^VED\d{3,6}$/i, "IDs look like VED000418"),
  password: z.string().min(1, "Enter your password"),
})

export type LoginValues = z.infer<typeof loginSchema>
