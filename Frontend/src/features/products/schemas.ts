import { z } from "zod"

import type { ApiProduct, ProductInput } from "@/features/products/types"
import { paiseToRupees, rupeesToPaise } from "@/lib/money"

const rupees = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, `Enter the ${label} in ₹`)
    .refine((v) => Number(v) > 0, `${label} must be more than ₹0`)

/** Admin product form — prices typed in rupees, sent to the backend in paise. */
export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the product name"),
    description: z.string().trim(),
    mrp: rupees("MRP"),
    salePrice: rupees("Sale price"),
    bvAmount: z.string().trim().regex(/^\d+$/, "BV is a whole number"),
    active: z.boolean(),
  })
  .refine((v) => Number(v.salePrice) <= Number(v.mrp), {
    path: ["salePrice"],
    message: "Sale price can't be above MRP",
  })
export type ProductFormValues = z.infer<typeof productSchema>

export const blankProduct: ProductFormValues = {
  name: "",
  description: "",
  mrp: "",
  salePrice: "",
  bvAmount: "",
  active: true,
}

export const productToForm = (p: ApiProduct): ProductFormValues => ({
  name: p.name,
  description: p.description ?? "",
  mrp: String(paiseToRupees(p.mrp)),
  salePrice: String(paiseToRupees(p.salePrice)),
  bvAmount: String(p.bvAmount),
  active: p.status === "ACTIVE",
})

export const formToProduct = (v: ProductFormValues): ProductInput => ({
  name: v.name,
  description: v.description || undefined,
  mrp: rupeesToPaise(Number(v.mrp)),
  salePrice: rupeesToPaise(Number(v.salePrice)),
  bvAmount: Number(v.bvAmount),
  status: v.active ? "ACTIVE" : "INACTIVE",
})
