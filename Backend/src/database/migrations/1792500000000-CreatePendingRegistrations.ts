import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePendingRegistrations1792500000000 implements MigrationInterface {
    name = 'CreatePendingRegistrations1792500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "pending_registrations" (
                "id" BIGSERIAL NOT NULL,
                "sponsor_user_id" integer NOT NULL,
                "details" jsonb NOT NULL,
                "password_hash" varchar(255),
                "product_id" bigint NOT NULL,
                "quantity" integer NOT NULL DEFAULT 1,
                "amount" bigint NOT NULL,
                "status" varchar(20) NOT NULL DEFAULT 'PENDING',
                "phonepe_merchant_order_id" varchar(100) NOT NULL,
                "phonepe_transaction_id" varchar(100),
                "phonepe_redirect_url" text,
                "created_user_id" integer,
                "order_id" bigint,
                "failure_reason" text,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_pending_registrations" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_pending_registrations_merchant_order_id" UNIQUE ("phonepe_merchant_order_id"),
                CONSTRAINT "FK_pending_registrations_sponsor" FOREIGN KEY ("sponsor_user_id")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_pending_registrations_created_user" FOREIGN KEY ("created_user_id")
                    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
                CONSTRAINT "FK_pending_registrations_order" FOREIGN KEY ("order_id")
                    REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_pending_registrations_sponsor_user_id" ON "pending_registrations" ("sponsor_user_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pending_registrations_sponsor_user_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "pending_registrations"`);
    }
}
