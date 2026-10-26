import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * GST invoices: one number per payment (VED/2026-27/000001), sequential within the financial
 * year. A cart paid in one go is one invoice covering all its orders. The PDF is built on demand,
 * so only the number and its orders are stored.
 */
export class CreateInvoices1793000000000 implements MigrationInterface {
    name = 'CreateInvoices1793000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "invoices" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "invoice_number" varchar(30) NOT NULL,
                "financial_year" varchar(7) NOT NULL,
                "seq" integer NOT NULL,
                "emailed_at" TIMESTAMPTZ,
                "issued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_invoices_invoice_number" UNIQUE ("invoice_number"),
                CONSTRAINT "UQ_invoices_financial_year_seq" UNIQUE ("financial_year", "seq"),
                CONSTRAINT "FK_invoices_user" FOREIGN KEY ("user_id")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "invoice_orders" (
                "invoice_id" integer NOT NULL,
                "order_id" bigint NOT NULL,
                CONSTRAINT "PK_invoice_orders" PRIMARY KEY ("invoice_id", "order_id"),
                CONSTRAINT "UQ_invoice_orders_order_id" UNIQUE ("order_id"),
                CONSTRAINT "FK_invoice_orders_invoice" FOREIGN KEY ("invoice_id")
                    REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_invoice_orders_order" FOREIGN KEY ("order_id")
                    REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "invoice_orders"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    }
}
