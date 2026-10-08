import { EntityManager } from 'typeorm';

export type StockLevel = { received: number; sold: number; available: number };

/**
 * Received / sold / available per product, from stock_movements. Products with no entries are
 * missing from the map — no stock added yet, so 0 available (out of stock).
 */
export async function getStockLevels(
  manager: EntityManager,
  productIds?: number[],
): Promise<Map<number, StockLevel>> {
  const rows: { product_id: string; received: string; sold: string }[] = await manager.query(
    `SELECT product_id,
            COALESCE(SUM(quantity) FILTER (WHERE type = 'IN'), 0)  AS received,
            COALESCE(SUM(quantity) FILTER (WHERE type = 'OUT'), 0) AS sold
       FROM stock_movements
      ${productIds ? 'WHERE product_id = ANY($1)' : ''}
      GROUP BY product_id`,
    productIds ? [productIds] : [],
  );
  const levels = new Map<number, StockLevel>();
  for (const r of rows) {
    const received = Number(r.received);
    const sold = Number(r.sold);
    levels.set(Number(r.product_id), { received, sold, available: received - sold });
  }
  return levels;
}

/** Available stock for one product — 0 when no stock was ever added. */
export async function getAvailableStock(manager: EntityManager, productId: number): Promise<number> {
  return (await getStockLevels(manager, [productId])).get(productId)?.available ?? 0;
}
