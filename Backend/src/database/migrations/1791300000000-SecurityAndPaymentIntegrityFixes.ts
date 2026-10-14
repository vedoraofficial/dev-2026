import { MigrationInterface, QueryRunner } from "typeorm";

export class SecurityAndPaymentIntegrityFixes1791300000000 implements MigrationInterface {
    name = 'SecurityAndPaymentIntegrityFixes1791300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Expand otps.otp_code to varchar(255) for SHA-256 / bcrypt digests and add attempts_count
        await queryRunner.query(`
            ALTER TABLE "otps" ALTER COLUMN "otp_code" TYPE varchar(255);
            ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "attempts_count" integer NOT NULL DEFAULT 0;
        `);

        // 2. Add Unique constraint on commission_distributions to prevent concurrency race double-credits
        await queryRunner.query(`
            ALTER TABLE "commission_distributions"
            ADD CONSTRAINT "UQ_commission_distributions_order_level_user"
            UNIQUE ("order_id", "level", "beneficiary_user_id")
        `);

        // 3. Create payment_attempts table for tracking individual checkout sessions per order
        await queryRunner.query(`
            CREATE TABLE "payment_attempts" (
                "id" BIGSERIAL NOT NULL,
                "order_id" bigint NOT NULL,
                "merchant_order_id" varchar(100) NOT NULL,
                "amount" bigint NOT NULL,
                "status" varchar(20) NOT NULL DEFAULT 'INITIATED',
                "provider_reference_id" varchar(100),
                "redirect_url" text,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_attempts" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_payment_attempts_merchant_order_id" UNIQUE ("merchant_order_id"),
                CONSTRAINT "FK_payment_attempts_order_id" FOREIGN KEY ("order_id")
                    REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_payment_attempts_order_id" ON "payment_attempts" ("order_id")
        `);

        // 4. Create wallet_topups table for add-money flows
        await queryRunner.query(`
            CREATE TABLE "wallet_topups" (
                "id" BIGSERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "amount" bigint NOT NULL,
                "status" varchar(20) NOT NULL DEFAULT 'PENDING',
                "phonepe_merchant_order_id" varchar(100) NOT NULL,
                "phonepe_transaction_id" varchar(100),
                "phonepe_redirect_url" text,
                "wallet_transaction_id" bigint,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_wallet_topups" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_wallet_topups_merchant_order_id" UNIQUE ("phonepe_merchant_order_id"),
                CONSTRAINT "FK_wallet_topups_user_id" FOREIGN KEY ("user_id")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_wallet_topups_wallet_transaction" FOREIGN KEY ("wallet_transaction_id")
                    REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_wallet_topups_user_id" ON "wallet_topups" ("user_id")
        `);

        // 5. Create order_refunds table
        await queryRunner.query(`
            CREATE TABLE "order_refunds" (
                "id" BIGSERIAL NOT NULL,
                "order_id" bigint NOT NULL,
                "refund_amount" bigint NOT NULL,
                "status" varchar(20) NOT NULL DEFAULT 'INITIATED',
                "reason" text,
                "phonepe_refund_id" varchar(100),
                "wallet_transaction_id" bigint,
                "created_by_admin_id" integer,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order_refunds" PRIMARY KEY ("id"),
                CONSTRAINT "FK_order_refunds_order_id" FOREIGN KEY ("order_id")
                    REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_order_refunds_wallet_transaction" FOREIGN KEY ("wallet_transaction_id")
                    REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
                CONSTRAINT "FK_order_refunds_admin_user" FOREIGN KEY ("created_by_admin_id")
                    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_order_refunds_order_id" ON "order_refunds" ("order_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "order_refunds" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "wallet_topups" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payment_attempts" CASCADE`);
        await queryRunner.query(`
            ALTER TABLE "commission_distributions"
            DROP CONSTRAINT IF EXISTS "UQ_commission_distributions_order_level_user"
        `);
        await queryRunner.query(`
            ALTER TABLE "otps" ALTER COLUMN "otp_code" TYPE varchar(10)
        `);
    }
}
