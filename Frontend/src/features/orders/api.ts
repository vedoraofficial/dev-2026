import type {
  ApiOrder,
  CashOrderInput,
  CreatedOrder,
  CreateOrderInput,
  OrderDetail,
} from "@/features/orders/types"
import { api } from "@/lib/api"

// bigint columns can arrive as strings — normalise the numbers we do maths / formatting on.
const toOrder = (o: ApiOrder): ApiOrder => ({
  ...o,
  id: Number(o.id),
  totalAmount: Number(o.totalAmount),
  bvTotal: Number(o.bvTotal),
})

/** GET /api/order — my orders */
export async function getMyOrders(): Promise<ApiOrder[]> {
  const { data } = await api.get<ApiOrder[]>("/order")
  return data.map(toOrder)
}

/** GET /api/order/:id — with the commission split */
export async function getOrder(id: number): Promise<OrderDetail> {
  const { data } = await api.get<OrderDetail>(`/order/${id}`)
  return data
}

/** POST /api/order */
export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const { data } = await api.post<CreatedOrder>("/order", input)
  return data
}

/** GET /api/order/admin/all — [Admin] */
export async function getAllOrders(): Promise<ApiOrder[]> {
  const { data } = await api.get<ApiOrder[]>("/order/admin/all")
  return data.map(toOrder)
}

/** POST /api/order/admin/cash — [Admin] */
export async function createCashOrder(input: CashOrderInput): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/order/admin/cash", input)
  return data
}
