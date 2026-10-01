import { z } from "zod"

/** POST /api/order/admin/cash — Admin records a cash sale for a user. */
export const cashOrderSchema = z.object({
  userId: z.string().trim().regex(/^\d+$/, "Enter the user's numeric ID"),
  productId: z.string().min(1, "Choose a product"),
  quantity: z
    .string()
    .trim()
    .regex(/^\d+$/, "Whole number")
    .refine((v) => Number(v) >= 1 && Number(v) <= 100, "1 to 100"),
})
export type CashOrderValues = z.infer<typeof cashOrderSchema>
