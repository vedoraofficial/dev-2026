import { z } from "zod"

/** Add stock / record sale form. */
export const stockEntrySchema = z.object({
  quantity: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a whole number")
    .refine((v) => Number(v) >= 1, "At least 1"),
  note: z.string().trim().max(300, "Keep the note under 300 characters"),
})
export type StockEntryValues = z.infer<typeof stockEntrySchema>
