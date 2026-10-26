import { EntityManager } from 'typeorm';

/** Key on the transaction's QueryRunner where paid orders wait for their invoice. */
export const INVOICE_QUEUE_KEY = 'invoiceOrderIds';

/**
 * Marks an order as paid inside the current transaction. Its invoice is issued and emailed only
 * after the transaction commits (see InvoiceService) — a rolled-back payment never gets one, and
 * the payment itself never waits for the PDF or the email.
 */
export function queueInvoice(manager: EntityManager, orderId: number): void {
  const data = manager.queryRunner?.data as Record<string, unknown> | undefined;
  if (!data) return;
  const queued = (data[INVOICE_QUEUE_KEY] as number[] | undefined) ?? [];
  if (!queued.includes(orderId)) queued.push(orderId);
  data[INVOICE_QUEUE_KEY] = queued;
}
