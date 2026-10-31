import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1793461137230 implements MigrationInterface {
    name = 'Update1793461137230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_checkouts" DROP CONSTRAINT "FK_order_checkouts_user"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_user"`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" DROP CONSTRAINT "FK_invoice_orders_invoice"`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" DROP CONSTRAINT "FK_invoice_orders_order"`);
        await queryRunner.query(`ALTER TABLE "mobile_otps" DROP CONSTRAINT "FK_mobile_otps_requested_by"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" DROP CONSTRAINT "FK_pending_registrations_sponsor"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" DROP CONSTRAINT "FK_pending_registrations_created_user"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" DROP CONSTRAINT "FK_pending_registrations_order"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_product_images_product"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_razorpay_order_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_order_refunds_razorpay_refund_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payment_events_razorpay_order_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_wallet_topups_razorpay_order_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "UQ_orders_phonepe_merchant_order_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "phonepe_merchant_order_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "phonepe_transaction_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "phonepe_redirect_url"`);
        await queryRunner.query(`ALTER TABLE "order_refunds" DROP COLUMN "phonepe_refund_id"`);
        await queryRunner.query(`ALTER TABLE "payment_events" DROP COLUMN "phonepe_merchant_order_id"`);
        await queryRunner.query(`ALTER TABLE "wallet_topups" DROP CONSTRAINT "UQ_wallet_topups_merchant_order_id"`);
        await queryRunner.query(`ALTER TABLE "wallet_topups" DROP COLUMN "phonepe_merchant_order_id"`);
        await queryRunner.query(`ALTER TABLE "wallet_topups" DROP COLUMN "phonepe_transaction_id"`);
        await queryRunner.query(`ALTER TABLE "wallet_topups" DROP COLUMN "phonepe_redirect_url"`);
        await queryRunner.query(`ALTER TABLE "shipments" ALTER COLUMN "activities" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" DROP CONSTRAINT "UQ_invoice_orders_order_id"`);
        await queryRunner.query(`ALTER TABLE "order_checkouts" ADD CONSTRAINT "FK_6a277ede1898ec13cfea307a234" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_26daf5e433d6fb88ee32ce93637" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" ADD CONSTRAINT "FK_5c4c615ddabb27a1ba69b241f95" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" ADD CONSTRAINT "FK_a2e3e54da59abcb693826c68278" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mobile_otps" ADD CONSTRAINT "FK_2f1e2079674fcfa9fdca1d58e9b" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" ADD CONSTRAINT "FK_bced250980691c2598b6f3c1133" FOREIGN KEY ("sponsor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" ADD CONSTRAINT "FK_34d18929a3c4a9167b64d134a32" FOREIGN KEY ("created_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" ADD CONSTRAINT "FK_5dec7e81dca7d5ab8fe1640ffaa" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" DROP CONSTRAINT "FK_5dec7e81dca7d5ab8fe1640ffaa"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" DROP CONSTRAINT "FK_34d18929a3c4a9167b64d134a32"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" DROP CONSTRAINT "FK_bced250980691c2598b6f3c1133"`);
        await queryRunner.query(`ALTER TABLE "mobile_otps" DROP CONSTRAINT "FK_2f1e2079674fcfa9fdca1d58e9b"`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" DROP CONSTRAINT "FK_a2e3e54da59abcb693826c68278"`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" DROP CONSTRAINT "FK_5c4c615ddabb27a1ba69b241f95"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_26daf5e433d6fb88ee32ce93637"`);
        await queryRunner.query(`ALTER TABLE "order_checkouts" DROP CONSTRAINT "FK_6a277ede1898ec13cfea307a234"`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" ADD CONSTRAINT "UQ_invoice_orders_order_id" UNIQUE ("order_id")`);
        await queryRunner.query(`ALTER TABLE "shipments" ALTER COLUMN "activities" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "wallet_topups" ADD "phonepe_redirect_url" text`);
        await queryRunner.query(`ALTER TABLE "wallet_topups" ADD "phonepe_transaction_id" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "wallet_topups" ADD "phonepe_merchant_order_id" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "wallet_topups" ADD CONSTRAINT "UQ_wallet_topups_merchant_order_id" UNIQUE ("phonepe_merchant_order_id")`);
        await queryRunner.query(`ALTER TABLE "payment_events" ADD "phonepe_merchant_order_id" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "order_refunds" ADD "phonepe_refund_id" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "phonepe_redirect_url" text`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "phonepe_transaction_id" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "phonepe_merchant_order_id" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "UQ_orders_phonepe_merchant_order_id" UNIQUE ("phonepe_merchant_order_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_wallet_topups_razorpay_order_id" ON "wallet_topups" USING btree ("razorpay_order_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_payment_events_razorpay_order_id" ON "payment_events" USING btree ("razorpay_order_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_order_refunds_razorpay_refund_id" ON "order_refunds" USING btree ("razorpay_refund_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_orders_razorpay_order_id" ON "orders" USING btree ("razorpay_order_id") `);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_product_images_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" ADD CONSTRAINT "FK_pending_registrations_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" ADD CONSTRAINT "FK_pending_registrations_created_user" FOREIGN KEY ("created_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" ADD CONSTRAINT "FK_pending_registrations_sponsor" FOREIGN KEY ("sponsor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mobile_otps" ADD CONSTRAINT "FK_mobile_otps_requested_by" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" ADD CONSTRAINT "FK_invoice_orders_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_orders" ADD CONSTRAINT "FK_invoice_orders_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_checkouts" ADD CONSTRAINT "FK_order_checkouts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
