import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWalletAndPaymentTables1790800000000 implements MigrationInterface {
    name = 'CreateWalletAndPaymentTables1790800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. wallets table
        await queryRunner.query(`
            CREATE TABLE "wallets" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "available_balance" bigint NOT NULL DEFAULT 0,
                "locked_balance" bigint NOT NULL DEFAULT 0,
                "total_earned" bigint NOT NULL DEFAULT 0,
                "total_withdrawn" bigint NOT NULL DEFAULT 0,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_wallets_user_id" UNIQUE ("user_id"),
                CONSTRAINT "CHK_wallets_available_balance" CHECK ("available_balance" >= 0),
                CONSTRAINT "CHK_wallets_locked_balance" CHECK ("locked_balance" >= 0),
                CONSTRAINT "PK_wallets" PRIMARY KEY ("id"),
                CONSTRAINT "FK_wallets_user_id" FOREIGN KEY ("user_id")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // 2. wallet_transactions table (immutable ledger)
        await queryRunner.query(`
            CREATE TABLE "wallet_transactions" (
                "id" BIGSERIAL NOT NULL,
                "wallet_id" integer NOT NULL,
                "type" varchar(10) NOT NULL,
                "category" varchar(40) NOT NULL,
                "amount" bigint NOT NULL,
                "balance_after" bigint NOT NULL,
                "reference_type" varchar(30),
                "reference_id" varchar(100),
                "description" text,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_wallet_transactions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_wallet_transactions_wallet_id" FOREIGN KEY ("wallet_id")
                    REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Index for fast transaction history lookup
        await queryRunner.query(`
            CREATE INDEX "IDX_wallet_transactions_wallet_id" ON "wallet_transactions" ("wallet_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_wallet_transactions_created_at" ON "wallet_transactions" ("created_at")
        `);

        // 3. orders table
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" BIGSERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "product_id" bigint NOT NULL,
                "quantity" integer NOT NULL DEFAULT 1,
                "unit_price" bigint NOT NULL,
                "total_amount" bigint NOT NULL,
                "bv_total" bigint NOT NULL,
                "payment_method" varchar(20) NOT NULL,
                "payment_status" varchar(20) NOT NULL DEFAULT 'PENDING',
                "phonepe_merchant_order_id" varchar(100),
                "phonepe_transaction_id" varchar(100),
                "phonepe_redirect_url" text,
                "order_status" varchar(20) NOT NULL DEFAULT 'PENDING',
                "commissions_distributed" boolean NOT NULL DEFAULT false,
                "created_by_admin_id" integer,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_orders_phonepe_merchant_order_id" UNIQUE ("phonepe_merchant_order_id"),
                CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
                CONSTRAINT "FK_orders_user_id" FOREIGN KEY ("user_id")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_orders_product_id" FOREIGN KEY ("product_id")
                    REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_orders_user_id" ON "orders" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_orders_payment_status" ON "orders" ("payment_status")
        `);

        // 4. commission_distributions table
        await queryRunner.query(`
            CREATE TABLE "commission_distributions" (
                "id" BIGSERIAL NOT NULL,
                "order_id" bigint NOT NULL,
                "beneficiary_user_id" integer NOT NULL,
                "level" smallint NOT NULL,
                "commission_rate" integer NOT NULL,
                "amount" bigint NOT NULL,
                "wallet_transaction_id" bigint,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_commission_distributions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_commission_distributions_order_id" FOREIGN KEY ("order_id")
                    REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_commission_distributions_beneficiary" FOREIGN KEY ("beneficiary_user_id")
                    REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_commission_distributions_wallet_txn" FOREIGN KEY ("wallet_transaction_id")
                    REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_commission_distributions_order_id" ON "commission_distributions" ("order_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_commission_distributions_beneficiary" ON "commission_distributions" ("beneficiary_user_id")
        `);

        // 5. withdrawals table
        await queryRunner.query(`
            CREATE TABLE "withdrawals" (
                "id" BIGSERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "bank_id" integer NOT NULL,
                "amount" bigint NOT NULL,
                "status" varchar(20) NOT NULL DEFAULT 'PENDING',
                "admin_user_id" integer,
                "admin_remarks" text,
                "processed_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_withdrawals" PRIMARY KEY ("id"),
                CONSTRAINT "FK_withdrawals_user_id" FOREIGN KEY ("user_id")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_withdrawals_bank_id" FOREIGN KEY ("bank_id")
                    REFERENCES "user_banks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_withdrawals_admin_user_id" FOREIGN KEY ("admin_user_id")
                    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_withdrawals_user_id" ON "withdrawals" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_withdrawals_status" ON "withdrawals" ("status")
        `);

        // 6. payment_events table (raw PhonePe payloads)
        await queryRunner.query(`
            CREATE TABLE "payment_events" (
                "id" BIGSERIAL NOT NULL,
                "phonepe_merchant_order_id" varchar(100) NOT NULL,
                "event_type" varchar(50) NOT NULL,
                "payload" jsonb NOT NULL,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_events" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_payment_events_merchant_order_id" ON "payment_events" ("phonepe_merchant_order_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "payment_events" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "withdrawals" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "commission_distributions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "wallet_transactions" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "wallets" CASCADE`);
    }
}
