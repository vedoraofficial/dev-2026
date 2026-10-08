import { useQuery } from "@tanstack/react-query"

import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  getPublicProducts,
  updateProduct,
} from "@/features/products/api"
import { useApiMutation } from "@/lib/mutation"

export const productKeys = {
  all: ["products"] as const,
  one: (id: number) => ["products", id] as const,
}

export const useProducts = () => useQuery({ queryKey: productKeys.all, queryFn: getProducts })

/** Public (no sign-in) list for the referral join page. */
export const usePublicProducts = () =>
  useQuery({ queryKey: [...productKeys.all, "public"], queryFn: getPublicProducts })

export const useProduct = (id: number) =>
  useQuery({ queryKey: productKeys.one(id), queryFn: () => getProduct(id), enabled: id > 0 })

export const useCreateProduct = () =>
  useApiMutation(createProduct, {
    success: (p) => `${p.name} added`,
    invalidate: [productKeys.all],
  })

export const useUpdateProduct = () =>
  useApiMutation(updateProduct, {
    success: (p) => `${p.name} saved`,
    invalidate: [productKeys.all],
  })

export const useDeleteProduct = () =>
  useApiMutation(deleteProduct, { success: "Product deleted", invalidate: [productKeys.all] })
