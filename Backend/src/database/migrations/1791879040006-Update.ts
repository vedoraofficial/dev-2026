import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1791879040006 implements MigrationInterface {
    name = 'Update1791879040006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "genealogy_nodes" DROP CONSTRAINT "fk_genealogy_nodes_sponsor_user_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "fk_notifications_user_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_product_id"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_wallets_user_id"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_wallet_transactions_wallet_id"`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" DROP CONSTRAINT "FK_commission_distributions_order_id"`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" DROP CONSTRAINT "FK_commission_distributions_beneficiary"`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" DROP CONSTRAINT "FK_commission_distributions_wallet_txn"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "fk_stock_movements_product_id"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "fk_stock_movements_created_by"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_withdrawals_user_id"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_withdrawals_bank_id"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_withdrawals_admin_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_genealogy_nodes_sponsor_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_payment_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_wallet_transactions_wallet_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_wallet_transactions_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_commission_distributions_order_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_commission_distributions_beneficiary"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payment_events_merchant_order_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_stock_movements_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_withdrawals_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_withdrawals_status"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "CHK_wallets_available_balance"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "CHK_wallets_locked_balance"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_quantity_check"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "chk_stock_movements_type"`);
        await queryRunner.query(`CREATE TABLE "shipments" ("id" BIGSERIAL NOT NULL, "order_id" bigint NOT NULL, "shiprocket_order_id" character varying(50), "shiprocket_shipment_id" character varying(50), "awb_code" character varying(50), "courier_name" character varying(100), "courier_company_id" integer, "current_status" character varying(50) NOT NULL DEFAULT 'NEW', "status_code" integer, "etd" TIMESTAMP WITH TIME ZONE, "current_location" character varying(150), "tracking_url" text, "activities" jsonb DEFAULT '[]'::jsonb, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e86fac2a18a75dcb82bfbb23f43" UNIQUE ("order_id"), CONSTRAINT "UQ_3a2fcc12f90f453508747997911" UNIQUE ("awb_code"), CONSTRAINT "REL_e86fac2a18a75dcb82bfbb23f4" UNIQUE ("order_id"), CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3a2fcc12f90f45350874799791" ON "shipments"  ("awb_code") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_e86fac2a18a75dcb82bfbb23f43" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_ac832121b6c331b084ecc4121fd" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_c57d19129968160f4db28fc8b28" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" ADD CONSTRAINT "FK_86a2a34d334b5606b9adb28c313" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" ADD CONSTRAINT "FK_2f9353c005216e23d22d6ac011e" FOREIGN KEY ("beneficiary_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" ADD CONSTRAINT "FK_d7bb62b372b5530605c97e3f573" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_0d3747894dc26f5f5c34f640d23" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_0bd35ddb3acfb323ae3e024d2f8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_d4ef3e8b8464ca6d7d4ac808cdf" FOREIGN KEY ("bank_id") REFERENCES "user_banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_0d873ad218b65d2d08da6426e26" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_0d873ad218b65d2d08da6426e26"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_d4ef3e8b8464ca6d7d4ac808cdf"`);
        await queryRunner.query(`ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_0bd35ddb3acfb323ae3e024d2f8"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_0d3747894dc26f5f5c34f640d23"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6"`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" DROP CONSTRAINT "FK_d7bb62b372b5530605c97e3f573"`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" DROP CONSTRAINT "FK_2f9353c005216e23d22d6ac011e"`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" DROP CONSTRAINT "FK_86a2a34d334b5606b9adb28c313"`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_c57d19129968160f4db28fc8b28"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_ac832121b6c331b084ecc4121fd"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`);
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_e86fac2a18a75dcb82bfbb23f43"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a2fcc12f90f45350874799791"`);
        await queryRunner.query(`DROP TABLE "shipments"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "chk_stock_movements_type" CHECK (((type)::text = ANY ((ARRAY['IN'::character varying, 'OUT'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_quantity_check" CHECK ((quantity > 0))`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "CHK_wallets_locked_balance" CHECK ((locked_balance >= 0))`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "CHK_wallets_available_balance" CHECK ((available_balance >= 0))`);
        await queryRunner.query(`CREATE INDEX "IDX_withdrawals_status" ON "withdrawals" USING btree ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_withdrawals_user_id" ON "withdrawals" USING btree ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_stock_movements_product_id" ON "stock_movements" USING btree ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_payment_events_merchant_order_id" ON "payment_events" USING btree ("phonepe_merchant_order_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_commission_distributions_beneficiary" ON "commission_distributions" USING btree ("beneficiary_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_commission_distributions_order_id" ON "commission_distributions" USING btree ("order_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_wallet_transactions_created_at" ON "wallet_transactions" USING btree ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_wallet_transactions_wallet_id" ON "wallet_transactions" USING btree ("wallet_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_orders_payment_status" ON "orders" USING btree ("payment_status") `);
        await queryRunner.query(`CREATE INDEX "IDX_orders_user_id" ON "orders" USING btree ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_genealogy_nodes_sponsor_user_id" ON "genealogy_nodes" USING btree ("sponsor_user_id") `);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_withdrawals_admin_user_id" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_withdrawals_bank_id" FOREIGN KEY ("bank_id") REFERENCES "user_banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_withdrawals_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "fk_stock_movements_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "fk_stock_movements_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" ADD CONSTRAINT "FK_commission_distributions_wallet_txn" FOREIGN KEY ("wallet_transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" ADD CONSTRAINT "FK_commission_distributions_beneficiary" FOREIGN KEY ("beneficiary_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "commission_distributions" ADD CONSTRAINT "FK_commission_distributions_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_wallet_transactions_wallet_id" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_wallets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genealogy_nodes" ADD CONSTRAINT "fk_genealogy_nodes_sponsor_user_id" FOREIGN KEY ("sponsor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
